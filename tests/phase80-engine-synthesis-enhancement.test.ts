import { describe, it, expect } from 'vitest';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { UserProblemInput } from '../src/modules/product-generator/types.js';
import { eventEvidenceAggregator } from '../src/modules/event-synthesis/event-evidence-aggregator.js';
import { timeAxisJudgmentEngine } from '../src/modules/time-axis/time-axis-judgment-engine.js';
import { prescriptionSynthesizer } from '../src/modules/prescription/prescription-synthesizer.js';
import { integratedAnalyzer } from '../src/modules/modular/integrated-analyzer.js';
import { versionRegistry } from '../src/core/version-registry.js';

describe('Phase 80: 사건·통합·시간축·처방 연결 계층 보완 Test Suite', () => {
  const generator = new ProductGenerator();

  // 대표 CASE: 1998-04-12 09:20 양력 여성 직장인
  const representativeCase: UserProblemInput = {
    birthDate: '1998-04-12',
    birthTime: '09:20',
    gender: 'female' as const,
    currentEvent: '직장에서 상사와 계속 충돌하고 있습니다. 업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복됩니다. 일을 제대로 하고 있다고 생각하지만 인정받지 못하는 느낌입니다.',
    targetDomain: 'JOB',
    userTrouble: '직장에서 상사와 계속 충돌하고 있습니다. 업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복됩니다. 일을 제대로 하고 있다고 생각하지만 인정받지 못하는 느낌입니다.',
    desiredQuestion: '지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지 알고 싶습니다.',
    targetYear: 2024,
  };

  // 대조군 CASE (1990-11-20 남성 사업가, 다른 명식/다른 년도)
  const comparisonCase: UserProblemInput = {
    birthDate: '1990-11-20',
    birthTime: '14:30',
    gender: 'male' as const,
    currentEvent: '신규 사업 투자 유치 및 해외 지사 설립 건으로 자금 흐름이 묶이고 있습니다.',
    targetDomain: 'BUSINESS',
    userTrouble: '신규 사업 투자 유치 및 해외 지사 설립 건으로 자금 흐름이 묶이고 있습니다.',
    desiredQuestion: '올해 투자를 공격적으로 밀고 가야 할지, 아니면 긴축으로 돌아서야 할지 판단하고 싶습니다.',
    targetYear: 2025,
  };

  // ==========================================================================
  // A. 사건 통합 (Event Evidence Aggregator 1.0.0) 검증
  // ==========================================================================
  describe('A. 사건 통합 검증', () => {
    it('단일 명리 요소만으로 특정 사건을 확정하지 않고 복수 근거를 결합해야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5, prescription: true });
      const evidence = res.evidenceResult;

      expect(evidence).toBeDefined();
      expect(evidence?.domain).toBe('JOB');

      // 단일 요소 확정 방지: 복수의 증거가 수집되어야 함
      expect(evidence?.evidences.length).toBeGreaterThanOrEqual(3);

      // 교차 검증된 모듈군에 다양한 명리 요소가 포함되어야 함
      const sourceModules = evidence?.evidences.map((e: any) => e.sourceModule) || [];
      expect(sourceModules).toContain('STRENGTH');
      expect(sourceModules).toContain('GEOKGUK');
      expect(sourceModules).toContain('RELATION');

      // 현실 해석에서 단일 요소 1:1 확정이 아닌 복수 원인 가설군이 생성되어야 함
      expect(evidence?.causalCandidates.length).toBeGreaterThanOrEqual(2);
      expect(evidence?.causalCandidates[0].rank).toBe(1);
    });

    it('증거 종합 엔진의 독립 실행 및 신뢰도 평가가 정상 동작해야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const aggResult = eventEvidenceAggregator.aggregate({
        userProblem: representativeCase,
        domain: 'JOB',
        executedModules: res.executedModules,
      });

      expect(aggResult.confidence).toBeGreaterThan(0.5);
      expect(aggResult.realityInterpretation).toBeTruthy();
      expect(aggResult.realityInterpretation).not.toContain('축진파 = 업무 지시 변경');
      expect(aggResult.realityInterpretation).not.toContain('인사해 = 상급자 소통 왜곡');
      expect(aggResult.realityInterpretation).not.toContain('망신살 = 공개 질책');
    });
  });

  // ==========================================================================
  // B. 교차 통합 (IntegratedAnalyzer 1.1.0) 검증
  // ==========================================================================
  describe('B. 교차 통합 검증', () => {
    it('19개 모듈 결과 중 관련 모듈을 선별하고 상충/완충 신호를 식별해야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5, prescription: true });
      const integrated = res.integratedAnalysis;

      expect(integrated).toBeDefined();
      if (!integrated) return;
      expect(integrated.integratedJudgment).toBeDefined();

      const judgment = integrated.integratedJudgment!;
      expect(judgment.domain).toBe('JOB');

      // 상충 또는 완충 신호 식별 여부
      expect(judgment.conflictingSignals).toBeDefined();
      expect(judgment.conflictingSignals.length).toBeGreaterThanOrEqual(1);

      // 현실 의사결정 요소 도출 확인
      expect(judgment.decisionFactors.maintainConditions.length).toBeGreaterThanOrEqual(1);
      expect(judgment.confidence).toBeGreaterThan(0.6);
    });

    it('기존 IntegratedAnalysisOutput 구조와의 100% 하위 호환성을 보장해야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const integrated = res.integratedAnalysis;

      expect(integrated?.crossImpactSummary).toBeDefined();
      expect(integrated?.chainAnalysis).toBeDefined();
      expect(integrated?.riskLevel).toBeDefined();
      expect(integrated?.isHighRisk).toBeDefined();
    });
  });

  // ==========================================================================
  // C. 시간축 엔진 (TimeAxisJudgmentEngine 1.0.0) 검증
  // ==========================================================================
  describe('C. 시간축 엔진 검증', () => {
    it('정적 하드코딩 문구가 아닌 실제 원국, 대운, 세운, 월운 역학 상호작용으로 시간축이 동적 계산되어야 한다', () => {
      const resRep = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const resComp = generator.generateProduct(comparisonCase, { insightDepth: 5 });

      const timeRep = resRep.timeAxisJudgment;
      const timeComp = resComp.timeAxisJudgment;

      expect(timeRep).toBeDefined();
      expect(timeComp).toBeDefined();

      // 서로 다른 명식 및 연도에서 시간축 판단이 완전히 차별화되어야 함
      expect(timeRep?.periodTitle).toContain('2024');
      expect(timeComp?.periodTitle).toContain('2025');

      expect(timeRep?.timeline.pastFlow).not.toBe(timeComp?.timeline.pastFlow);
      expect(timeRep?.timeline.currentPhase).not.toBe(timeComp?.timeline.currentPhase);
      expect(timeRep?.timeline.futureTransition).not.toBe(timeComp?.timeline.futureTransition);

      // 12개월 동적 타임라인이 계산되어야 함
      expect(timeRep?.monthlyTimeline.length).toBe(12);
      expect(timeComp?.monthlyTimeline.length).toBe(12);

      // 각 월별로 계산된 역학 흐름 상태와 점수가 존재해야 함
      const sampleMonth = timeRep?.monthlyTimeline[0];
      expect(sampleMonth).toHaveProperty('month');
      expect(sampleMonth).toHaveProperty('monthGanji');
      expect(sampleMonth).toHaveProperty('flowStatus');
      expect(sampleMonth).toHaveProperty('intensityScore');
    });

    it('시간축 결과가 의사결정 타이밍 및 현재 상태와 유기적으로 연결되어야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const time = res.timeAxisJudgment!;

      expect(time.decisionTiming).toBeDefined();
      expect(time.decisionTiming.immediateJudgments.length).toBeGreaterThanOrEqual(1);
      expect(time.decisionTiming.waitableFactors.length).toBeGreaterThanOrEqual(1);
      expect(time.decisionTiming.conditionalCheckpoints.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // D. 처방 엔진 (PrescriptionSynthesizer 1.0.0) 검증
  // ==========================================================================
  describe('D. 처방 엔진 검증', () => {
    it('직장 문제에 직장·상사·업무지시·기록 등 현실 대응 중심의 맞춤 처방이 생성되어야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5, prescription: true });
      const pres = res.prescriptionSynthesis;

      expect(pres).toBeDefined();
      expect(pres?.remedyObjective).toBeTruthy();

      // 환경 처방의 현실적 구체성
      expect(pres?.environmentRemedy.spaceGuidance).toBeTruthy();
      expect(pres?.environmentRemedy.lightingAndAtmosphere).toBeTruthy();

      // 행동 처방의 직장 고민 특화 프로토콜 (24시간 유예, 서면 크로스체크 등)
      const doListStr = pres?.behaviorRemedy.mustDoRules.join(' ') || '';
      expect(doListStr).toContain('서면');

      // 의사결정 선택지 비교 (선택지 A vs 선택지 B) 생성 확인
      expect(pres?.decisionAnalysis.optionA_maintain.optionName).toContain('유지');
      expect(pres?.decisionAnalysis.optionB_move.optionName).toContain('이직');
      expect(pres?.decisionAnalysis.optionA_maintain.pros).toBeTruthy();
      expect(pres?.decisionAnalysis.optionB_move.risks).toBeTruthy();
    });

    it('사업 문제와 직장 문제의 처방이 확연히 구분되어야 한다', () => {
      const resJob = generator.generateProduct(representativeCase, { insightDepth: 5, prescription: true });
      const resBiz = generator.generateProduct(comparisonCase, { insightDepth: 5, prescription: true });

      const presJob = resJob.prescriptionSynthesis!;
      const presBiz = resBiz.prescriptionSynthesis!;

      expect(presJob.remedyObjective).not.toBe(presBiz.remedyObjective);
      expect(presJob.decisionAnalysis.optionA_maintain.optionName).not.toBe(presBiz.decisionAnalysis.optionA_maintain.optionName);
    });
  });

  // ==========================================================================
  // E. 고객 출력 계층 및 내부 용어 배제 검증
  // ==========================================================================
  describe('E. 고객 출력 계층 및 내부 용어 배제 검증', () => {
    it('15개 표준 고정 포맷이 모두 유지되어야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const report = res.customerDeliverable?.standard15Report || '';

      for (let i = 1; i <= 15; i++) {
        expect(report).toMatch(new RegExp(`## ${i}\\.`));
      }
    });

    it('내부 모듈명과 원시적인 1:1 기계적 매핑 라벨이 노출되지 않아야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const report = res.customerDeliverable?.standard15Report || '';

      // 금지된 내부 라벨
      expect(report).not.toContain('[일간 본원]');
      expect(report).not.toContain('[일간 감당력]');
      expect(report).not.toContain('[사회적 성취 틀]');
      expect(report).not.toContain('[핵심 기운 구조]');
      expect(report).not.toContain('[직장 및 이직 고민 모듈]');
      expect(report).not.toContain('[직장운 진단에 따르면]');

      // 금지된 기계적 1:1 매핑 단정 표현
      expect(report).not.toContain('축진파 = 업무 지시 변경');
      expect(report).not.toContain('인사해 = 상급자 소통 왜곡');
      expect(report).not.toContain('망신살 = 공개 질책');

      // 미신성 부적(탈리스만) 금지 확인 (부적합 환경 등 어휘 제외)
      expect(report).not.toMatch(/상징[ \t]*부적|액운.*부적/);
    });

    it('실전 처방 도구(대화 스크립트, 이메일 템플릿, 조직문화 기준표) 및 현재/과거 시간 분리가 표준 보고서에 포함되어야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const report = res.customerDeliverable?.standard15Report || '';

      // 실전 처방 도구 1 & 2 확인
      expect(report).toContain('[실전 대응 도구 1] 면전 갈등 탈출을 위한 3단 대화 스크립트');
      expect(report).toContain('[실전 대응 도구 2] 상사 말 번복 및 책임 전가 방어용 이메일 템플릿');
      expect(report).toContain('의뢰인 기질 맞춤 조직 문화 타겟팅 기준표 (이직 성공용)');

      // 시간축 시제 명확화 확인
      expect(report).toContain('현재 상담 시점');
      expect(report).toContain('사건 발단 및 분석 기준 시기');
    });
  });

  // ==========================================================================
  // F. 버전 레지스트리 및 모듈 추적성 검증
  // ==========================================================================
  describe('F. 버전 레지스트리 및 모듈 추적성 검증', () => {
    it('신규 계층의 버전과 변경된 통합 모듈 버전이 명확히 등록 및 관리되어야 한다', () => {
      const synLayers = versionRegistry.getSynthesisLayerVersions();

      // 신규 계층 독립 버전 1.0.0 확인
      expect(synLayers['EVENT_EVIDENCE_AGGREGATOR']).toBe('1.0.0');
      expect(synLayers['TIME_AXIS_JUDGMENT_ENGINE']).toBe('1.0.0');
      expect(synLayers['PRESCRIPTION_SYNTHESIZER']).toBe('1.0.0');

      // 변경된 통합 모듈 Version 1.1.0 확인
      expect(synLayers['INTEGRATED_ANALYZER']).toBe('1.1.0');
    });

    it('ExecutionTrace에 합성 계층 버전 정보와 불변 스냅샷 해시가 포함되어야 한다', () => {
      const res = generator.generateProduct(representativeCase, { insightDepth: 5 });
      const trace = res.trace;

      expect(trace).toBeDefined();
      expect(trace?.synthesisLayers).toBeDefined();
      expect(trace?.synthesisLayers?.['INTEGRATED_ANALYZER']).toBe('1.1.0');
      expect(trace?.snapshotHash).toBeTruthy();
    });
  });
});
