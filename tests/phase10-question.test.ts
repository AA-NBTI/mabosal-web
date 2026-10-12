import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaModuleEngine } from '../src/modules/ma/ma-module-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { QuestionEngine } from '../src/modules/question/question-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';

describe('Phase 10: Question Engine Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();
  const maEngine = new MaModuleEngine();
  const questionEngine = new QuestionEngine();

  const getMaOutput = () => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });
    const sig = signalEngine.execute({ saju_core: core.data, relationship: rel.data });
    return maEngine.execute({ signals: sig.data }).data;
  };

  it('지시서 제12원칙 예시: "요즘 일이 안 풀립니다" 질문 시 사업마·직장마·재물마·인마·구설마 관련도를 정확히 포착해야 한다', () => {
    const maOutput = getMaOutput();
    const result = questionEngine.execute({
      questionText: '요즘 일이 안 풀립니다.',
      ma_output: maOutput,
    });

    expect(result.metadata.status).toBe('active');
    const { data } = result;

    expect(data.detectedDomain).toBe('직장/사업/진로');
    expect(data.needsClarification).toBe(false); // 불필요하게 다시 되묻지 않음

    const topIds = [data.primaryTargetMa.maId, ...data.secondaryTargetMas.map(m => m.maId)];
    // 사업마, 직장마, 재물마, 인마, 구설마 중 다수가 상위권에 포함되어야 함
    const expected = ['ma_business', 'ma_career', 'ma_wealth', 'ma_social', 'ma_gossip'];
    const matchedCount = expected.filter(id => topIds.includes(id)).length;
    expect(matchedCount).toBeGreaterThanOrEqual(3);
  });

  it('명세서 제13원칙 예시: "돈 때문에 고민입니다" 질문 시 재물마·자산마 등이 1순위로 식별되어야 한다', () => {
    const maOutput = getMaOutput();
    const result = questionEngine.execute({
      questionText: '돈 때문에 고민입니다.',
      ma_output: maOutput,
    });

    expect(result.data.detectedDomain).toBe('재물/자산');
    expect(result.data.primaryTargetMa.maId).toBe('ma_wealth');
    expect(result.data.primaryTargetMa.koreanName).toBe('재물마');
    expect(result.data.needsClarification).toBe(false);
  });

  it('이직 및 시험 질문: "올해 이직이나 시험 합격운이 궁금합니다" 질문 분석 검증', () => {
    const maOutput = getMaOutput();
    const result = questionEngine.execute({
      questionText: '올해 이직이나 시험 합격운이 궁금합니다.',
      ma_output: maOutput,
    });

    const topIds = [result.data.primaryTargetMa.maId, ...result.data.secondaryTargetMas.map(m => m.maId)];
    expect(topIds.some(id => id === 'ma_exam' || id === 'ma_career')).toBe(true);
  });

  it('극단적으로 짧거나 모호한 질문("답답합니다")에서도 되묻지 않고 분석 가이던스를 산출해야 한다', () => {
    const maOutput = getMaOutput();
    const result = questionEngine.execute({
      questionText: '답답합니다',
      ma_output: maOutput,
    });

    expect(result.data.isAmbiguous).toBe(true);
    expect(result.data.needsClarification).toBe(false);
    expect(result.data.primaryTargetMa).toBeDefined();
    expect(result.data.interpretationGuidance).toContain('추가 질문을 강요하지 않고');
  });
});
