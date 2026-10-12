/**
 * Phase 13: Interpretation Engine Tests
 * 해석 엔진 검증 테스트
 */

import { describe, it, expect } from 'vitest';
import { InterpretationEngine } from '../src/modules/interpretation/interpretation-engine.js';
import { QuestionEngine } from '../src/modules/question/question-engine.js';
import { InteractionEngine } from '../src/modules/interaction/interaction-engine.js';
import { MaModuleEngine, MaModuleEngineOutput } from '../src/modules/ma/ma-module-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';

describe('Phase 13: Interpretation Engine Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();
  const maEngine = new MaModuleEngine();
  const questionEngine = new QuestionEngine();
  const interactionEngine = new InteractionEngine();
  const interpretationEngine = new InterpretationEngine();

  const getMaPipeline = () => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });
    const sig = signalEngine.execute({ saju_core: core.data, relationship: rel.data });
    const ma = maEngine.execute({ signals: sig.data });
    const interaction = interactionEngine.analyze(ma.data);
    return {
      cal: cal.data,
      pil: pil.data,
      core: core.data,
      rel: rel.data,
      sig: sig.data,
      ma: ma.data,
      interaction,
    };
  };

  it('8단계 표준 출력 구조(핵심결과, 최강마, 운활성, 부담, 기회, 조언, 시간의존성)가 누락 없이 생성되어야 한다', () => {
    const { ma, interaction } = getMaPipeline();

    const result = interpretationEngine.execute({
      maOutput: ma,
      interactionOutput: interaction,
      tasteType: 'standard',
      characterType: 'default',
    });

    const interp = result.data.interpretation;

    // 1. 핵심 결과
    expect(interp.keySummary.content).toContain(ma.top_ma.korean_name);
    expect(interp.keySummary.bullets?.length).toBeGreaterThan(0);

    // 2. 가장 강한 마
    expect(interp.topMaAnalysis.content).toContain(ma.top_ma.korean_name);
    expect(interp.topMaAnalysis.bullets?.length).toBe(5); // 5대 축 지표

    // 3. 운 활성화
    expect(interp.luckActivationAnalysis.content).toContain('대운(40%)과 세운(30%)');

    // 4. 부담 요소
    expect(interp.pressureFactors.content).toBeDefined();
    expect(interp.pressureFactors.bullets?.some(b => b.includes('리스크'))).toBe(true);

    // 5. 기회 요소
    expect(interp.opportunityFactors.content).toContain('기회');

    // 6. 생활 조언
    expect(interp.actionGuidance.content).toBeDefined();

    // 7. 시간 의존성
    expect(interp.timeDependencyNotice.content).toContain('4주');

    // 전체 결합 서사(fullNarrative) 생성 확인
    expect(result.data.fullNarrative).toContain(interp.keySummary.title);
    expect(result.data.fullNarrative).toContain(interp.actionGuidance.title);
  });

  it('지시서 제16/21원칙 준수: 해석 과정에서 엔진의 수치가 0.001점도 변조되지 않고 불변 보존되어야 한다', () => {
    const { ma, interaction } = getMaPipeline();

    const resStandard = interpretationEngine.execute({
      maOutput: ma,
      interactionOutput: interaction,
      tasteType: 'standard',
      characterType: 'default',
    });

    const resSpicyDirect = interpretationEngine.execute({
      maOutput: ma,
      interactionOutput: interaction,
      tasteType: 'spicy',
      characterType: 'direct',
    });

    // 최상위 마 점수 및 식별자 불변
    expect(resStandard.data.rawEngineResult.top_ma.presentation_score)
      .toBe(resSpicyDirect.data.rawEngineResult.top_ma.presentation_score);
    expect(resStandard.data.rawEngineResult.top_ma.ma_id)
      .toBe(resSpicyDirect.data.rawEngineResult.top_ma.ma_id);

    // 상호작용 위험 지수 불변
    expect(resStandard.data.rawEngineResult.interactionRiskIndex)
      .toBe(resSpicyDirect.data.rawEngineResult.interactionRiskIndex);
  });

  it('질문(Question) 결합 시 질문 맞춤형 특별 해설(8번째 섹션)이 유기적으로 연계되어야 한다', () => {
    const { ma, interaction } = getMaPipeline();

    const questionRes = questionEngine.execute({
      questionText: '이번에 새로 추진하는 사업에 투자해도 될까요?',
      ma_output: ma,
    });

    const result = interpretationEngine.execute({
      maOutput: ma,
      interactionOutput: interaction,
      questionOutput: questionRes.data,
      tasteType: 'realistic',
      characterType: 'realistic',
    });

    const interp = result.data.interpretation;

    // 질문 맞춤 섹션 존재 여부
    expect(interp.questionSpecificAnalysis).toBeDefined();
    expect(interp.questionSpecificAnalysis?.title).toContain('이번에 새로 추진하는 사업');
    expect(interp.questionSpecificAnalysis?.bullets?.[0]).toContain('도메인');
    expect(result.data.fullNarrative).toContain('8. 의뢰인 질문 맞춤 분석');
  });

  it('지시서 제18원칙 준수: 안전·표현 원칙 가드레일 및 면책 고지가 적용되어야 한다', () => {
    const { ma } = getMaPipeline();

    const result = interpretationEngine.execute({
      maOutput: ma,
      tasteType: 'standard',
      characterType: 'default',
    });

    const safety = result.data.interpretation.safetyCheck;
    expect(safety.isSafe).toBe(true);
    expect(safety.medicalDiagnosisFiltered).toBe(true);
    expect(safety.accidentProbabilityFiltered).toBe(true);
    expect(safety.legalOutcomeFiltered).toBe(true);
    expect(safety.disclaimerApplied).toBe(true);

    // 면책 조항 문구 포함 검증
    expect(result.data.interpretation.topMaAnalysis.disclaimer).toContain('신호 강도이며');
    expect(result.data.fullNarrative).toContain('실제 질병의 진단, 사고 발생 확률, 소송 승패의 법적 예측이 아닙니다');
  });

  it('출생시간 미상(hour=null) 입력 시 안내 문구 및 민감 영역이 적시되어야 한다', () => {
    const { ma } = getMaPipeline();

    const result = interpretationEngine.execute({
      maOutput: ma,
      timeDependency: {
        isMissingHour: true,
        confidence: 80.0,
        sensitiveAreas: ['자녀마', '직장마'],
      },
    });

    const notice = result.data.interpretation.timeDependencyNotice;
    expect(notice.content).toContain('출생시간을 제외한 세 기둥을 기준으로 분석');
    expect(notice.content).toContain('자녀마, 직장마');
    expect(notice.bullets?.[0]).toContain('미상 (3주 기준 분석)');
    expect(notice.bullets?.[1]).toContain('80.0%');
  });
});
