import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';

describe('Phase 7: Signal Engine Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();

  it('명세서 산식에 기반한 재성 신호군(WealthSignalSet)이 0~100 연속값으로 산출되어야 한다', () => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });

    const signalResult = signalEngine.execute({
      saju_core: core.data,
      relationship: rel.data,
    });

    expect(signalResult.metadata.status).toBe('active');
    const { wealth } = signalResult.data;

    // 0~100 연속값 검증
    expect(wealth.structureScore).toBeGreaterThanOrEqual(0.0);
    expect(wealth.structureScore).toBeLessThanOrEqual(100.0);
    expect(wealth.dayMasterCapacity).toBeGreaterThan(0.0);
    expect(wealth.biGeopDispersion).toBeGreaterThanOrEqual(0.0);
    expect(wealth.sikSangProduceJae).toBeGreaterThanOrEqual(0.0);
  });

  it('5대 점수 축(Score5Axis)이 독립적으로 보존되어야 한다 (조기 단일 압축 금지)', () => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });

    const signalResult = signalEngine.execute({
      saju_core: core.data,
      relationship: rel.data,
    });

    const axis = signalResult.data.axis5_baseline;
    expect(axis.intensity).toBeGreaterThan(0.0);
    expect(axis.pressure).toBeGreaterThanOrEqual(0.0);
    expect(axis.opportunity).toBeGreaterThan(0.0);
    expect(axis.volatility).toBeGreaterThanOrEqual(0.0);
    expect(axis.mitigation).toBeGreaterThanOrEqual(0.0);

    // 다섯 값이 서로 다른 고유한 의미의 수치로 독립 보존되는지 확인
    expect([axis.intensity, axis.pressure, axis.opportunity, axis.volatility, axis.mitigation].some(v => v !== axis.intensity)).toBe(true);
  });

  it('역마 지지(인신사해) 정면 충돌 시 이동/변동 신호가 유의미하게 상승해야 한다', () => {
    // 인목 년지, 신금 월지, 사화 일지 -> 사맹지/역마 충돌 밀집
    const customPillars = {
      year: { stem: '무' as const, branch: '인' as const, name: '무인' },
      month: { stem: '경' as const, branch: '신' as const, name: '경신' },
      day: { stem: '정' as const, branch: '사' as const, name: '정사' },
      hour: { stem: '계' as const, branch: '해' as const, name: '계해' },
    };

    const pilData = {
      four_pillars: customPillars,
    } as any;

    const core = coreEngine.execute(pilData);
    const rel = relEngine.execute({ four_pillars: customPillars });
    const signalResult = signalEngine.execute({
      saju_core: core.data,
      relationship: rel.data,
    });

    const movement = signalResult.data.movement_clash;
    expect(movement.yeokmaMovementScore).toBeGreaterThan(70.0);
    expect(movement.clashDensity).toBeGreaterThan(50.0);
    expect(signalResult.data.axis5_baseline.volatility).toBeGreaterThan(50.0);
  });

  it('출생시간 미상(hour=null) 시 3주 기준으로 신호가 정상 산출되고 시간 의존도가 기록되어야 한다', () => {
    const cal = calEngine.execute({ birth_date: '2020-07-07', birth_time: null });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });

    const signalResult = signalEngine.execute({
      saju_core: core.data,
      relationship: rel.data,
    });

    expect(signalResult.metadata.status).toBe('active');
    expect(signalResult.data.time_dependency.is_missing_hour).toBe(true);
    expect(signalResult.data.wealth.structureScore).toBeGreaterThanOrEqual(0);
    expect(signalResult.data.axis5_baseline.intensity).toBeGreaterThan(0);
  });
});
