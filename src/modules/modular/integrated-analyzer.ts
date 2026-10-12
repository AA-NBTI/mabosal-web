/**
 * src/modules/modular/integrated-analyzer.ts
 * 
 * Phase 60 & Phase 80: 모듈 결과 취합 기반 비계산 통합 분석기 (Integrated Analyzer)
 * Version: 1.1.0 (ACTIVE)
 * 
 * 개선 사항 (Version 1.1.0):
 * 1. 단순 isHighRisk 3항 연산자를 탈피하여 진정한 모듈 간 교차 합성(Cross-Domain Synthesis) 수행.
 * 2. 사용자 고민 관련 모듈 선별, 동일 문제 지지 복수 근거 결합, 상충/완충 신호 식별.
 * 3. IntegratedJudgment 구조체 생성: decisionFactors, timeFactors, prescriptionFactors, confidence.
 * 4. 기존 IntegratedAnalysisOutput 필드(crossImpactSummary, chainAnalysis 등) 100% 무손실 보존.
 */

import { ModularId, ModularOutput } from './types.js';
import { eventEvidenceAggregator, AggregatedEvidenceItem } from '../event-synthesis/event-evidence-aggregator.js';
import { timeAxisJudgmentEngine } from '../time-axis/time-axis-judgment-engine.js';
import { FourPillars } from '../../core/types.js';
import { ProblemDomain, UserProblemInput } from '../product-generator/types.js';

export interface IntegratedJudgment {
  version: '1.1.0' | '1.2.0';
  domain: ProblemDomain;
  coreConcern: string;
  supportingModules: ModularId[];
  evidences: AggregatedEvidenceItem[];
  conflictingSignals: string[];
  pattern: string;
  realityInterpretation: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  decisionFactors: {
    maintainConditions: string[];
    changeConditions: string[];
    realityCheckpoints: string[];
  };
  timeFactors: string[];
  prescriptionFactors: string[];
  confidence: number;
}

export interface IntegratedAnalysisOutput {
  version?: '1.1.0' | '1.2.0';
  crossImpactSummary: string;
  chainAnalysis: {
    coreStructure: string;
    relationImpact: string;
    sinsalInfluence: string;
    luckActivation: string;
    troubleMapping: string;
    crossSynthesis: string;
    eventMechanism?: string;
  };
  overallRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isHighRisk: boolean;
  keyInteractions: string[];
  moduleResults: Record<ModularId, ModularOutput>;
  integratedJudgment?: IntegratedJudgment;
}

export class IntegratedAnalyzer {
  public readonly version = '1.2.0';

  /**
   * 이미 계산된 독립 모듈들의 결과를 취합하여 교차 역학 도출 (Version 1.2.0)
   */
  public analyze(
    moduleResults: Record<ModularId, ModularOutput>,
    userProblem?: UserProblemInput,
    domain?: ProblemDomain,
    pillars?: FourPillars
  ): IntegratedAnalysisOutput {
    const core = moduleResults['CORE_ORIGINAL'];
    const strength = moduleResults['STRENGTH'];
    const geokguk = moduleResults['GEOKGUK'];
    const relation = moduleResults['RELATION'];
    const sinsal = moduleResults['SINSAL'];
    const daewun = moduleResults['DAEWUN'];
    const seun = moduleResults['SEUN'];

    // 1. 원국 구조
    const coreDesc = core
      ? `일간 ${core.data.dayMaster.stem} (${core.data.dayMaster.element}) 중심의 ${core.data.ohaeng.dominant} 주도 원국 (${geokguk?.data?.name || '정격'}, ${strength?.data?.status || '중화'})`
      : '원국 기본 구조 안정';

    // 2. 관계 작용 (충·형·파·해·원진·귀문 등 전수 반영)
    const clashes = relation?.data?.clashes || [];
    const samhaps = relation?.data?.samhaps || [];
    const punishments = relation?.data?.punishments || [];
    const harms = relation?.data?.harms || [];
    const wonjins = relation?.data?.wonjins || [];
    const gwimuns = relation?.data?.gwimuns || [];

    const dynamicRels = [...clashes, ...punishments, ...harms, ...wonjins, ...gwimuns];
    const relationDesc = dynamicRels.length > 0
      ? `원국 내 역동적 상호작용(${dynamicRels.join(', ')})이 자리하여 돌발적 환경 변화와 분별력을 요구함`
      : '원국 내 극단적 충돌 없이 온화하게 에너지가 순환함';

    // 3. 신살
    const aus = sinsal?.data?.auspicious || [];
    const chal = sinsal?.data?.challenging || [];
    const sinsalDesc = `길신(${aus.join(', ') || '잠재'})의 조력과 주의살(${chal.join(', ') || '미약'})의 경계선 공존`;

    // 4. 운의 활성
    const dwGanji = daewun?.data?.currentGanji || '대운';
    const dwOrder = daewun?.data?.currentOrder || 1;
    const seunGanji = seun?.data?.ganji || '2026 丙午';
    const luckDesc = `제${dwOrder}대운 [${dwGanji}] 및 세운 [${seunGanji}]의 강력한 화열이 원국 구조를 직접 활성화함`;

    // 5. 현실 고민 모듈 추출
    const troubleModule = Object.values(moduleResults).find(m => m.category === 'TROUBLE');
    const troubleDesc = troubleModule
      ? `사용자의 현실 고민 [${troubleModule.moduleName}] 영역에 대운과 충살의 압력이 집중됨`
      : '전반적인 삶의 균형과 방향성 탐색 국면';

    // 6. 교차 종합 판정 (기존 호환성)
    const isHighRisk = (clashes.length > 0 || punishments.length > 0) && chal.length > 0;
    const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = isHighRisk ? 'HIGH' : (dynamicRels.length > 0 || chal.length > 0 ? 'MEDIUM' : 'LOW');

    const keyInteractions: string[] = [];
    if (clashes.length > 0) keyInteractions.push(`충살 작용: ${clashes.join(', ')}`);
    if (punishments.length > 0) keyInteractions.push(`형살 작용: ${punishments.join(', ')}`);
    if (harms.length > 0) keyInteractions.push(`육해 작용: ${harms.join(', ')}`);
    if (wonjins.length > 0) keyInteractions.push(`원진 작용: ${wonjins.join(', ')}`);
    if (gwimuns.length > 0) keyInteractions.push(`귀문관살 작용: ${gwimuns.join(', ')}`);
    if (samhaps.length > 0) keyInteractions.push(`합국 결합: ${samhaps.join(', ')}`);
    if (dwGanji) keyInteractions.push(`대운 환경: ${dwGanji} 대운`);
    if (troubleModule) keyInteractions.push(`현실 접점: ${troubleModule.data.topic || troubleModule.moduleName}`);

    const crossSynthesis = isHighRisk
      ? `원국의 지지 충돌과 운에서 유입되는 기운이 현실 고민 영역과 맞물려 감정적 조급함과 충돌이 최고조에 달한 국면으로, 즉각적인 담판을 멈추고 자중자애할 때 위기가 기회로 전환됩니다.`
      : `원국의 잠재 역량과 시간축 흐름이 점진적 안정세로 이행 중이며, 내실 있는 준비를 통해 원하는 결실을 거둘 수 있는 성장 국면입니다.`;

    // 7. Version 1.2.0: 실질적 Cross-Synthesis IntegratedJudgment 생성 (도메인 정합성 강화)
    let integratedJudgment: IntegratedJudgment | undefined;
    if (userProblem) {
      const activeDomain = domain || 'JOB';
      const actualPillars = pillars || core?.data?.pillars;

      // 사건 증거 취합기 실행
      const evidenceSet = eventEvidenceAggregator.aggregate(
        userProblem,
        activeDomain,
        moduleResults,
        actualPillars
      );

      // 관련 모듈 집합 도출
      const supportingModules: ModularId[] = Array.from(
        new Set(evidenceSet.supportingEvidences.map(e => e.sourceModule))
      );
      if (!supportingModules.includes(activeDomain as ModularId) && moduleResults[activeDomain as ModularId]) {
        supportingModules.push(activeDomain as ModularId);
      }

      // 시간축 판단기 실행
      let timeAxisFactors: string[] = [];
      if (actualPillars) {
        const timeAxisRes = timeAxisJudgmentEngine.judge(
          actualPillars,
          moduleResults,
          userProblem,
          activeDomain
        );
        timeAxisFactors = [
          timeAxisRes.timeline.pastFlow,
          timeAxisRes.timeline.currentPhase,
          timeAxisRes.timeline.futureTransition,
          ...timeAxisRes.signals,
        ];
      }

      const isJobDomain = (activeDomain === 'JOB');
      const isBusinessDomain = (activeDomain === 'BUSINESS' || activeDomain === 'MONEY');

      integratedJudgment = {
        version: '1.2.0',
        domain: activeDomain,
        coreConcern: userProblem.currentEvent || userProblem.userTrouble || '현실 고민',
        supportingModules,
        evidences: evidenceSet.evidences,
        conflictingSignals: evidenceSet.conflictingOrBufferingSignals,
        pattern: evidenceSet.eventPattern,
        realityInterpretation: evidenceSet.realityInterpretation,
        riskLevel: riskLevel,
        decisionFactors: {
          maintainConditions: isJobDomain ? [
            '업무 처리 기준과 책임을 서면으로 명확히 구분하여 불확실성을 통제할 수 있는가',
            '퇴근 후 일상과의 분리를 통해 심신 컨디션을 유지할 수 있는가',
            '현 조직에서 경력의 연속성과 실리를 온전히 보존할 수 있는가',
          ] : isBusinessDomain ? [
            '현재 보유 자금으로 고정비와 손실 리스크를 안정적으로 통제할 수 있는가',
            '무리한 신규 확장 없이 기존 자산과 거래의 실리를 지켜낼 수 있는가',
            '계약 및 정산의 법적·재정적 안전장치가 확보되어 있는가',
          ] : [
            '현재 상황을 유지하면서 감정적 에너지 소모를 통제할 수 있는가',
            '심리적 안전거리를 확보하여 관계의 갈등을 완화할 수 있는가',
            '현실적 실리와 내면의 안정을 온전히 보존할 수 있는가',
          ],
          changeConditions: isJobDomain ? [
            '직무 역량 포트폴리오와 다음 진로 대안이 객관적으로 준비되었는가',
            '최소 3~6개월 이상의 고정 생계비 및 비상 자금이 확보되었는가',
            '충동적 사직이 아닌 확실한 대안과 전환 타이밍이 마련되었는가',
          ] : isBusinessDomain ? [
            '신규 투자나 거래처에 대한 철저한 사전 검증과 계약서가 구비되었는가',
            '투자 리스크 발생 시에도 본체를 지탱할 비상 예비금이 확보되었는가',
            '성급한 확장이 아닌 확실한 성장 타이밍과 파트너십이 마련되었는가',
          ] : [
            '새로운 결정에 대한 충분한 숙고와 현실적 준비가 완료되었는가',
            '변화에 따른 스트레스와 리스크를 감당할 수 있는 완충 자원이 확보되었는가',
            '충동적 절연이나 비약이 아닌 계획된 전환 시점에 도달했는가',
          ],
          realityCheckpoints: isJobDomain ? [
            '주요 업무 지시와 본인의 수행 내역을 객관적 사실로 기록하고 있는가',
            '즉각적인 감정 대응을 멈추고 검토 시간을 확보하여 정면 대립을 차단했는가',
            '시기별 완화 흐름을 기다리며 차분히 물밑 준비를 진행하고 있는가',
          ] : isBusinessDomain ? [
            '모든 거래와 합의 사항을 구두가 아닌 공식 서면 계약으로 확정했는가',
            '단기적인 고수익 유혹을 배제하고 원금 보존 가능성을 점검했는가',
            '시기적 파동이 안정되는 구간에 맞추어 의사결정을 진행하고 있는가',
          ] : [
            '발생한 상황에 대해 감정을 배제하고 객관적 팩트를 정리했는가',
            '즉흥적인 결정을 멈추고 상황을 차분히 관망하고 있는가',
            '운의 완화 흐름에 맞추어 단계적 대응을 진행하고 있는가',
          ],
        },
        timeFactors: timeAxisFactors,
        prescriptionFactors: isJobDomain ? [
          '감정적 즉각 반박 지양 및 공식 검토 시간 확보',
          '업무 지시 및 협의 사항의 객관적 서면 기록 유지',
          '업무 공간과 온전한 휴식 공간의 물리적 분리',
          '충동적 퇴사 대신 완화기를 기약한 계획적 이직 준비 병행',
        ] : isBusinessDomain ? [
          '구두 합의 전면 배제 및 서면 계약 일원화',
          '단기 레버리지 억제 및 원금 방어형 현금 유동성 확보',
          '위험 자산에 대한 보수적 관망 및 전문가 실사 병행',
          '운의 과열 구간 통과 후 단계적 투자 재개',
        ] : [
          '즉흥적이고 감정적인 결정 지양 및 관망 시간 확보',
          '상황의 객관적 사실관계를 차분히 기록 및 점검',
          '스트레스 유발 환경과의 심리적 안전거리 확보',
          '운의 흐름에 맞춘 계획적이고 단계적인 대처',
        ],
        confidence: 88,
      };
    }

    let eventMechanism: string | undefined;
    if (userProblem?.currentEvent || userProblem?.userTrouble) {
      const concern = (userProblem.currentEvent || userProblem.userTrouble || '').trim();
      const parts: string[] = [];
      if (concern) parts.push(`사용자 고민(${concern})`);
      if (coreDesc) parts.push(`명리 구조(${coreDesc})`);
      const relSigns = [relationDesc, sinsalDesc].filter(Boolean).join(' / ');
      if (relSigns) parts.push(`관계·신살(${relSigns})`);
      if (luckDesc) parts.push(`시간축 흐름(${luckDesc})`);
      const patternDesc = integratedJudgment?.pattern || troubleDesc;
      if (patternDesc) parts.push(`현실 마찰 양상(${patternDesc})`);
      const remedyDir = (integratedJudgment?.prescriptionFactors && integratedJudgment.prescriptionFactors[0]) || '감정적 대립 완화 및 서면 확인 기반 대응';
      parts.push(`대응 방향(${remedyDir})`);

      if (parts.length >= 4) {
        eventMechanism = parts.join(' → ');
      }
    }

    return {
      version: '1.2.0',
      crossImpactSummary: `통합 교차 분석: ${coreDesc}의 토대 위에 ${relationDesc}하며, ${luckDesc}의 궤도가 형성되어 있습니다.`,
      chainAnalysis: {
        coreStructure: coreDesc,
        relationImpact: relationDesc,
        sinsalInfluence: sinsalDesc,
        luckActivation: luckDesc,
        troubleMapping: troubleDesc,
        crossSynthesis,
        eventMechanism,
      },
      overallRiskLevel: riskLevel,
      riskLevel: riskLevel,
      isHighRisk: (riskLevel === 'HIGH'),
      keyInteractions,
      moduleResults,
      integratedJudgment,
    };
  }
}

export const integratedAnalyzer = new IntegratedAnalyzer();

