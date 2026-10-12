import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaModuleEngine } from '../src/modules/ma/ma-module-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';
import { TasteEngine } from '../src/modules/taste/taste-engine.js';

describe('Phase 11: Taste Module Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();
  const maEngine = new MaModuleEngine();
  const tasteEngine = new TasteEngine();

  const getMaOutput = () => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });
    const sig = signalEngine.execute({ saju_core: core.data, relationship: rel.data });
    return maEngine.execute({ signals: sig.data }).data;
  };

  it('지시서 제10원칙 준수: 맛을 변경해도 계산 엔진 결과(Engine Result)는 100% 동일해야 한다', () => {
    const maOutput = getMaOutput();

    const resMild = tasteEngine.execute({ maOutput, tasteType: 'mild' });
    const resStandard = tasteEngine.execute({ maOutput, tasteType: 'standard' });
    const resSpicy = tasteEngine.execute({ maOutput, tasteType: 'spicy' });

    // 원본 계산 결과 불변 검증
    expect(resMild.data.originalResult.top_ma.presentation_score)
      .toBe(resStandard.data.originalResult.top_ma.presentation_score);
    expect(resStandard.data.originalResult.top_ma.presentation_score)
      .toBe(resSpicy.data.originalResult.top_ma.presentation_score);

    // 21개 전체 마 점수가 순한맛/보통맛/매운맛 간에 0.001점도 다르지 않음을 전수 검증
    for (const [id, ma] of Object.entries(resMild.data.originalResult.ma_results)) {
      expect(ma.presentation_score).toBe(resSpicy.data.originalResult.ma_results[id].presentation_score);
      expect(ma.score_5axis).toEqual(resSpicy.data.originalResult.ma_results[id].score_5axis);
    }
  });

  it('맛에 따라 달라지는 것은 오직 표현 강도와 문체여야 한다', () => {
    const maOutput = getMaOutput();

    const resMild = tasteEngine.execute({ maOutput, tasteType: 'mild' });
    const resSpicy = tasteEngine.execute({ maOutput, tasteType: 'spicy' });

    // 직설성 및 경고 수위의 차이
    expect(resSpicy.data.tasteProfile.directnessLevel).toBeGreaterThan(resMild.data.tasteProfile.directnessLevel);
    expect(resSpicy.data.tasteProfile.cautionIntensity).toBeGreaterThan(resMild.data.tasteProfile.cautionIntensity);

    // 문체 텍스트 차이 검증
    expect(resMild.data.styledExpressions.topMaComment).toContain('반짝이고 있는 기운');
    expect(resSpicy.data.styledExpressions.title).toContain('팩트 분석');
    expect(resSpicy.data.styledExpressions.topMaComment).toContain('똑바로 직시');
  });

  it('확장 맛 (냉정한맛, 현실적인맛, 보살맛, 직설맛) 지원 검증', () => {
    const maOutput = getMaOutput();

    const resCold = tasteEngine.execute({ maOutput, tasteType: 'cold' });
    expect(resCold.data.styledExpressions.title).toContain('객관적 지표에 기반한');

    const resRealistic = tasteEngine.execute({ maOutput, tasteType: 'realistic' });
    expect(resRealistic.data.styledExpressions.title).toContain('현실 맞춤형 조언');

    const resBodhisattva = tasteEngine.execute({ maOutput, tasteType: 'bodhisattva' });
    expect(resBodhisattva.data.styledExpressions.title).toContain('인연과 업의 흐름');
  });

  it('커스텀 맛 모듈 동적 등록 지원 검증', () => {
    const maOutput = getMaOutput();

    tasteEngine.registerCustomTaste({
      tasteId: 'humorous',
      koreanName: '유머러스맛',
      directnessLevel: 3,
      empathyLevel: 4,
      cautionIntensity: 2,
      speechStyle: '위트와 유머로 사주를 풀어내는 유쾌한 문체',
    });

    const resCustom = tasteEngine.execute({ maOutput, tasteType: 'humorous' });
    expect(resCustom.data.appliedTaste).toBe('humorous');
    expect(resCustom.data.tasteProfile.koreanName).toBe('유머러스맛');
  });
});
