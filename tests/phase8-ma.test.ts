import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { ExtensionSlotMaModule } from '../src/modules/ma/extension-slot.js';
import { MaModuleEngine } from '../src/modules/ma/ma-module-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';

describe('Phase 8: Ma Module Engine Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();

  const getTestSignals = () => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });
    return signalEngine.execute({ saju_core: core.data, relationship: rel.data }).data;
  };

  it('20개 표준 마와 21번 확장 슬롯이 모두 등록되고 정상 계산되어야 한다', () => {
    const signals = getTestSignals();
    const maEngine = new MaModuleEngine();

    const result = maEngine.execute({ signals });
    expect(result.metadata.status).toBe('active');
    expect(result.data.registered_count).toBe(21);
    expect(Object.keys(result.data.ma_results).length).toBe(21);

    // 1번 재물마부터 20번 집마까지 존재 확인
    expect(result.data.ma_results.ma_wealth).toBeDefined();
    expect(result.data.ma_results.ma_business).toBeDefined();
    expect(result.data.ma_results.ma_career).toBeDefined();
    expect(result.data.ma_results.ma_health).toBeDefined();
    expect(result.data.ma_results.ma_home).toBeDefined();
    expect(result.data.ma_results.ma_extension_slot).toBeDefined();
  });

  it('모든 마의 점수는 0~100 연속값이어야 하며, 5대 축이 독립 보존되어야 한다', () => {
    const signals = getTestSignals();
    const maEngine = new MaModuleEngine();
    const result = maEngine.execute({ signals });

    for (const [id, ma] of Object.entries(result.data.ma_results)) {
      // 0~100 범위
      expect(ma.presentation_score).toBeGreaterThanOrEqual(0.0);
      expect(ma.presentation_score).toBeLessThanOrEqual(100.0);

      // 5대 축 독립 보존
      const ax = ma.score_5axis;
      expect(ax.intensity).toBeGreaterThanOrEqual(0.0);
      expect(ax.pressure).toBeGreaterThanOrEqual(0.0);
      expect(ax.opportunity).toBeGreaterThanOrEqual(0.0);
      expect(ax.volatility).toBeGreaterThanOrEqual(0.0);
      expect(ax.mitigation).toBeGreaterThanOrEqual(0.0);
    }
  });

  it('건강마, 사고마, 재판마의 안전 표현 원칙(안내 경고)이 포함되어야 한다', () => {
    const signals = getTestSignals();
    const maEngine = new MaModuleEngine();
    const result = maEngine.execute({ signals });

    const health = result.data.ma_results.ma_health;
    expect(health.safety_warnings).toBeDefined();
    expect(health.safety_warnings?.[0]).toContain('의학적 진단이나 질병 발생 확률이 아니며');

    const accident = result.data.ma_results.ma_accident;
    expect(accident.safety_warnings?.[0]).toContain('사고의 발생 확률이 아니며');

    const legal = result.data.ma_results.ma_legal;
    expect(legal.safety_warnings?.[0]).toContain('소송 결과를 예측하지 않으며');
  });

  it('모듈 삭제 테스트: 특정 마 모듈을 제거해도 전체 엔진 및 다른 마의 작동에 영향이 없어야 한다', () => {
    const signals = getTestSignals();
    const maEngine = new MaModuleEngine();

    // 재물마 점수 사전 기록
    const initialResult = maEngine.execute({ signals });
    const wealthScoreBefore = initialResult.data.ma_results.ma_wealth.presentation_score;

    // 직장마 제거
    const removed = maEngine.unregisterModule('ma_career');
    expect(removed).toBe(true);

    const afterResult = maEngine.execute({ signals });
    expect(afterResult.metadata.status).toBe('active');
    expect(afterResult.data.registered_count).toBe(20);
    expect(afterResult.data.ma_results.ma_career).toBeUndefined();

    // 직장마가 삭제되어도 재물마 점수는 완벽히 불변
    expect(afterResult.data.ma_results.ma_wealth.presentation_score).toBe(wealthScoreBefore);
  });

  it('모듈 추가/확장 슬롯 테스트: 신규 마를 추가해도 기존 마의 계산 결과는 전혀 변하지 않아야 한다', () => {
    const signals = getTestSignals();
    const maEngine = new MaModuleEngine();

    const baselineResult = maEngine.execute({ signals });
    const wealthScoreBefore = baselineResult.data.ma_results.ma_wealth.presentation_score;
    const businessScoreBefore = baselineResult.data.ma_results.ma_business.presentation_score;

    // 21번 슬롯에 커스텀 마 장착
    const customSlot = new ExtensionSlotMaModule(
      'ma_custom_crypto',
      '코인투자마',
      21,
      ctx => ({
        presentationScore: 78.45,
        intensity: 80.0,
        pressure: 65.0,
        opportunity: 70.0,
        volatility: 90.0,
        mitigation: 30.0,
        breakdown: { 코인변동성: 90.0 },
        notes: ['고변동성 자산 특화 신규 마'],
      })
    );

    maEngine.registerModule(customSlot);

    const customResult = maEngine.execute({ signals });
    expect(customResult.data.ma_results.ma_custom_crypto.presentation_score).toBe(78.45);

    // 기존 재물마, 사업마 점수 완전 불변 검증
    expect(customResult.data.ma_results.ma_wealth.presentation_score).toBe(wealthScoreBefore);
    expect(customResult.data.ma_results.ma_business.presentation_score).toBe(businessScoreBefore);
  });

  it('개별 마 모듈 계산 오류 발생 시 전체 엔진이 중단되지 않고 안전 격리되어야 한다', () => {
    const signals = getTestSignals();
    const maEngine = new MaModuleEngine();

    // 의도적으로 에러를 발생시키는 결함 모듈 등록
    const faultModule = {
      maId: 'ma_faulty',
      koreanName: '결함마',
      order: 22,
      calculate: () => {
        throw new Error('의도된 결함 마 예외 발생');
      },
    };
    maEngine.registerModule(faultModule as any);

    const result = maEngine.execute({ signals });
    expect(result.metadata.status).toBe('active');
    expect(result.data.ma_results.ma_faulty.presentation_score).toBe(0);
    expect(result.data.ma_results.ma_faulty.notes[0]).toContain('계산 오류 격리');

    // 다른 정상 마들은 온전히 계산됨
    expect(result.data.ma_results.ma_wealth.presentation_score).toBeGreaterThan(0);
  });
});
