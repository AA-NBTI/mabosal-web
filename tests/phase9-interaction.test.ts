import { describe, expect, it } from 'vitest';
import { BoundaryEngine } from '../src/modules/boundary/boundary-engine.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { InteractionConfidenceEngine } from '../src/modules/interaction/interaction-confidence-engine.js';
import { MaModuleEngine } from '../src/modules/ma/ma-module-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';

describe('Phase 9: Interaction / Confidence Engine Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();
  const maEngine = new MaModuleEngine();
  const icEngine = new InteractionConfidenceEngine();

  const runPipeline = (birthDate: string, birthTime: string | null) => {
    const cal = calEngine.execute({ birth_date: birthDate, birth_time: birthTime });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });
    const bound = new BoundaryEngine().execute({ pillar_output: pil.data, saju_core_output: core.data });
    const sig = signalEngine.execute({ saju_core: core.data, relationship: rel.data });
    const ma = maEngine.execute({ signals: sig.data });

    return {
      maOutput: ma.data,
      boundaryOutput: bound.data,
    };
  };

  it('명세서 핵심 상호작용 (재성강도 × 감당부족 × 비겁분산)이 0~100 연속값으로 산출되어야 한다', () => {
    const { maOutput, boundaryOutput } = runPipeline('2024-02-05', '12:00');
    const result = icEngine.execute({ ma_output: maOutput, boundary: boundaryOutput });

    expect(result.metadata.status).toBe('active');
    const { interaction } = result.data;

    expect(interaction.coreWealthRiskIndex).toBeGreaterThanOrEqual(0.0);
    expect(interaction.coreWealthRiskIndex).toBeLessThanOrEqual(100.0);
    expect(interaction.interactionPairs.length).toBeGreaterThan(0);
  });

  it('마 간 상호작용 쌍(재물-사업, 직장-명예 등)이 올바른 유형과 점수로 도출되어야 한다', () => {
    const { maOutput, boundaryOutput } = runPipeline('2024-02-05', '12:00');
    const result = icEngine.execute({ ma_output: maOutput, boundary: boundaryOutput });

    const pairs = result.data.interaction.interactionPairs;
    const wealthBiz = pairs.find(p => p.sourceMaId === 'ma_wealth' && p.targetMaId === 'ma_business');
    expect(wealthBiz).toBeDefined();
    expect(wealthBiz?.interactionScore).toBeGreaterThan(0);

    const careerFame = pairs.find(p => p.sourceMaId === 'ma_career' && p.targetMaId === 'ma_fame');
    expect(careerFame).toBeDefined();
    expect(careerFame?.interactionType).toBe('synergy');
  });

  it('완전한 데이터(시간 있음, 안전 시각)에서는 신뢰도가 100점이어야 한다', () => {
    const { maOutput, boundaryOutput } = runPipeline('2024-02-05', '12:00');
    const result = icEngine.execute({ ma_output: maOutput, boundary: boundaryOutput });

    const conf = result.data.confidence;
    expect(conf.overallScore).toBe(100.0);
    expect(conf.confidenceGrade).toBe('매우 높음 (90점대)');
    expect(conf.deductions.length).toBe(0);
  });

  it('출생시간 미상(hour=null) 시 신뢰도가 20점 감점되어 투명하게 기록되어야 한다', () => {
    const { maOutput, boundaryOutput } = runPipeline('2024-02-05', null);
    const result = icEngine.execute({ ma_output: maOutput, boundary: boundaryOutput });

    const conf = result.data.confidence;
    expect(conf.overallScore).toBe(80.0);
    expect(conf.confidenceGrade).toBe('양호 (80점대)');
    expect(conf.deductions.some(d => d.factor === '출생시간 미상')).toBe(true);
  });
});
