/**
 * src/modules/ma/maga-diagnosis-engine.ts
 * 
 * Phase 68: 마·살 진단 엔진 (Maga Diagnosis Engine)
 * 
 * "명리 계산 결과 → 마·살 후보 탐지 → 실제 문제와 연결 → 영향 해석 → 위험 인식 → 이해 → 처방 연결"
 * 
 * 핵심 원칙:
 * 1. SINSAL(전통 신살)과 MAGA_DIAGNOSIS(문제 중심 진단)의 분리:
 *    SINSAL 모듈의 계산 결과를 토대로 사용자 현실 고민과 1:1 인과 사슬 구축.
 * 2. 12단계 진단 파이프라인 준수.
 * 3. 100점 체계:
 *    - 명리 근거 강도(30) + 구조적 반복/중첩(20) + 시간축 활성도(20) + 사용자 문제 관련성(20) + 기타 보정(10)
 *    - intensityScore(명리 영향 강도)와 relevanceScore(문제 관련성)의 엄격한 분리 보존.
 * 4. 시간축 출처 보존 (NATAL, DAEWUN, SEUN, DAEWUN×SEUN).
 * 5. 공포 표현 완벽 차단 (미래 비결정론 및 안전 원칙).
 * 6. 한글 명칭 우선 표기 규칙: 인신충(寅申沖), 묘신원진(卯申怨嗔) 등.
 */

import { FourPillars, EarthlyBranch, HeavenlyStem } from '../../core/types.js';
import { UserProblemInput } from '../product-generator/types.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';
import { ModularId, ModularOutput } from '../modular/types.js';

// ============================================================================
// 1. 마·살 진단 데이터 구조
// ============================================================================
export type MagaCategory =
  | 'MONEY'         // 재물마
  | 'BUSINESS'      // 사업마
  | 'JOB'           // 직장마
  | 'RELATIONSHIP'  // 인마 / 관계마
  | 'LOVE'          // 연애마
  | 'MARRIAGE'      // 결혼마
  | 'HEALTH'        // 건강마
  | 'GENERAL'       // 생활마
  | string;         // 확장 가능: DIGITAL_AI_BOT, LEGAL, FAMILY, HOUSING 등

export interface MagaDiagnosisResultItem {
  magaId: string;
  magaName: string;
  category: MagaCategory;
  source: 'NATAL' | 'DAEWUN' | 'SEUN' | 'DAEWUN×SEUN' | 'COMPLEX';
  evidence: string[];
  relatedModules: ModularId[];
  affectedAreas: string[];
  traditionalMeaning: string;
  practicalMeaning: string;
  intensityScore: number;       // 명리 구조상 영향 강도 (0~100)
  relevanceScore: number;       // 사용자 사건과의 관련성 (0~100)
  timeAxisContext?: {
    source?: 'NATAL' | 'DAEWUN' | 'SEUN' | 'DAEWUN×SEUN';
    year?: number;
    daewun?: string;
    seun?: string;
    timingNarrative?: string;
  };
  userProblemMapping?: {
    currentEvent: string;
    targetDomain: string;
    connectionNarrative: string;
  };
  similarCase: string;
  riskAwareness: string;
  understanding: string;
  mitigationDirection: string;
  prescriptionCandidates: string[];
  confidence: number;
}

export interface ComplexMagaGroup {
  title: string;
  coreArea: string;
  integratedEvidences: string[];
  intensityScore: number;
  relevanceScore: number;
  summaryNarrative: string;
}

export interface MagaDiagnosisComprehensiveResult {
  primaryMaga: MagaDiagnosisResultItem;
  secondaryMagas: MagaDiagnosisResultItem[];
  allCandidates: MagaDiagnosisResultItem[];
  complexDiagnosis?: ComplexMagaGroup;
  overallSeverity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MILD';
  status: 'SUCCESS' | 'PARTIAL' | 'UNAVAILABLE';
}

// ============================================================================
// 2. 공포 표현 필터 (14절 공포 표현 가드)
// ============================================================================
const FEAR_PATTERNS: { regex: RegExp; replacement: string }[] = [
  { regex: /반드시\s*사고가?\s*난다?/g, replacement: '돌발적인 변수에 대비할 필요가 있습니다' },
  { regex: /파산한다?/g, replacement: '재정적 압박이 커질 수 있어 현금 흐름 관리가 중요합니다' },
  { regex: /이혼한다?/g, replacement: '관계의 피로감이 누적되어 정서적 거리두기가 요구됩니다' },
  { regex: /죽는다?/g, replacement: '심신의 에너지가 급격히 쇠진될 수 있으므로 절대 안정이 필요합니다' },
  { regex: /병에\s*걸린다?/g, replacement: '체력 저하와 면역력 약화에 각별한 관리가 필요합니다' },
  { regex: /반드시\s*망한다?/g, replacement: '무리한 확장은 손실을 유발하기 쉬우므로 보수적 접근이 권장됩니다' },
  { regex: /피할\s*수\s*없다?/g, replacement: '능동적이고 선제적인 대응이 결과를 크게 좌우합니다' },
  { regex: /확정된\s*사고/g, replacement: '주의가 요망되는 환경' },
  { regex: /확정된\s*손실/g, replacement: '보수적 관리가 필요한 구간' },
];

export function sanitizeFearExpressions(text: string): string {
  let sanitized = text;
  for (const p of FEAR_PATTERNS) {
    sanitized = sanitized.replace(p.regex, p.replacement);
  }
  return sanitized;
}

// ============================================================================
// 3. 마·살 진단 엔진 본체
// ============================================================================
export class MagaDiagnosisEngine {
  /**
   * 마·살 통합 진단 실행
   */
  public diagnose(
    userProblem: UserProblemInput,
    executedModules: Record<string, ModularOutput>,
    integratedAnalysis?: IntegratedAnalysisOutput
  ): MagaDiagnosisComprehensiveResult {
    // 1. 사용 가능한 모듈 상태 검증 (17절 독립 실행 원칙)
    const availableModuleCount = Object.keys(executedModules || {}).length;
    if (availableModuleCount === 0 && !integratedAnalysis) {
      return this.createFallbackResult(userProblem, 'UNAVAILABLE');
    }

    // 2. 원국 및 시간축 데이터 수집
    const rawNatalPillars = this.extractPillars(executedModules, userProblem);
    const targetDomain = (userProblem.targetDomain || this.inferDomain(userProblem.currentEvent || userProblem.userTrouble)).toUpperCase();
    const targetYear = userProblem.targetYear || 2026;

    // 3. 후보 탐지 (8대 마·살 + 확장 마·살)
    const candidates: MagaDiagnosisResultItem[] = [];

    // A. 재물마 탐지
    const moneyMaga = this.detectMoneyMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (moneyMaga) candidates.push(moneyMaga);

    // B. 사업마 탐지
    const businessMaga = this.detectBusinessMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (businessMaga) candidates.push(businessMaga);

    // C. 직장마 탐지
    const jobMaga = this.detectJobMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (jobMaga) candidates.push(jobMaga);

    // D. 연애마 탐지
    const loveMaga = this.detectLoveMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (loveMaga) candidates.push(loveMaga);

    // E. 결혼마 탐지
    const marriageMaga = this.detectMarriageMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (marriageMaga) candidates.push(marriageMaga);

    // F. 인마 / 관계마 탐지
    const relationMaga = this.detectRelationshipMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (relationMaga) candidates.push(relationMaga);

    // G. 건강마 탐지
    const healthMaga = this.detectHealthMaga(userProblem, executedModules, rawNatalPillars, targetYear);
    if (healthMaga) candidates.push(healthMaga);

    // H. 사용자 도메인이 확장이거나 매칭되지 않은 경우 커스텀 확장 마·살 생성
    if (candidates.length === 0 || !candidates.some(c => c.category === targetDomain)) {
      const customMaga = this.detectCustomDomainMaga(targetDomain, userProblem, executedModules, targetYear);
      candidates.push(customMaga);
    }

    // 4. 점수 정렬 및 우선순위 선정
    // targetDomain과의 관련성 높은 항목을 최상단 배치
    candidates.sort((a, b) => {
      // 도메인 일치 가중
      const aDomainMatch = a.category === targetDomain ? 100 : 0;
      const bDomainMatch = b.category === targetDomain ? 100 : 0;
      const aTotal = a.relevanceScore * 0.6 + a.intensityScore * 0.4 + aDomainMatch;
      const bTotal = b.relevanceScore * 0.6 + b.intensityScore * 0.4 + bDomainMatch;
      return bTotal - aTotal;
    });

    const primaryMaga = candidates[0];
    const secondaryMagas = candidates.slice(1);

    // 5. 복합 마·살(Complex Maga) 그룹화 (8절)
    let complexDiagnosis: ComplexMagaGroup | undefined;
    const allEvidences = Array.from(new Set(candidates.flatMap(c => c.evidence)));
    if (allEvidences.length >= 2 || candidates.length >= 2) {
      const avgIntensity = Math.round(candidates.reduce((acc, c) => acc + c.intensityScore, 0) / candidates.length);
      const avgRelevance = Math.round(candidates.reduce((acc, c) => acc + c.relevanceScore, 0) / candidates.length);

      complexDiagnosis = {
        title: `복합 진단: ${primaryMaga.magaName} 중심 다중 상호작용 활성`,
        coreArea: primaryMaga.category,
        integratedEvidences: allEvidences,
        intensityScore: Math.min(100, Math.max(primaryMaga.intensityScore, avgIntensity + 10)),
        relevanceScore: Math.min(100, Math.max(primaryMaga.relevanceScore, avgRelevance + 5)),
        summaryNarrative: sanitizeFearExpressions(
          `현재 의뢰인의 국면은 단일 살성의 작용을 넘어, [${allEvidences.slice(0, 3).join(', ')}] 등의 기운이 동시다발적으로 맞물려 ${primaryMaga.category} 영역의 환경적 변동성을 자극하는 복합 국면으로 진단됩니다.`
        ),
      };
    }

    // 6. 종합 심각도 결정
    const maxScore = Math.max(primaryMaga.intensityScore, primaryMaga.relevanceScore);
    const overallSeverity = maxScore >= 80 ? 'CRITICAL' : maxScore >= 65 ? 'MAJOR' : maxScore >= 50 ? 'MODERATE' : 'MILD';

    return {
      primaryMaga,
      secondaryMagas,
      allCandidates: candidates,
      complexDiagnosis,
      overallSeverity,
      status: availableModuleCount < 5 ? 'PARTIAL' : 'SUCCESS',
    };
  }

  // --------------------------------------------------------------------------
  // 세부 마·살 탐지기
  // --------------------------------------------------------------------------

  // 1. 재물마 (MONEY)
  private detectMoneyMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = [];
    const relatedModules: ModularId[] = ['MONEY'];

    // 관계 모듈에서 충/원진 확인
    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      relatedModules.push('RELATION');
      const clashes = relMod.calculation.rawMetrics?.clashes || [];
      const harms = relMod.calculation.rawMetrics?.harms || [];
      if (clashes.length > 0) evidences.push(`지지충(沖): ${clashes.join(', ')}`);
      if (harms.length > 0) evidences.push(`지지해(害): ${harms.join(', ')}`);
    }

    // 십신 모듈에서 겁재/비견 확인
    const tenMod = modules['TEN_GODS'];
    if (tenMod && tenMod.success) {
      relatedModules.push('TEN_GODS');
      const gods = tenMod.calculation.rawMetrics?.tenGods || [];
      if (gods.includes('겁재')) evidences.push('겁재(劫財) 기운에 의한 재물 누수 구조');
    }

    // 신살 모듈 확인
    const sinMod = modules['SINSAL'];
    if (sinMod && sinMod.success) {
      relatedModules.push('SINSAL');
      const list = sinMod.calculation.rawMetrics?.challenging || [];
      if (list.includes('겁살(劫煞)')) evidences.push('겁살(劫煞) 유입');
    }

    if (evidences.length === 0) {
      evidences.push('재성 오행의 계절적 설기 및 일시적 수축');
    }

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'MONEY',
      modules
    );

    return {
      magaId: 'MAGA_MONEY',
      magaName: '재물마(財物魔)',
      category: 'MONEY',
      source: 'NATAL',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['현금흐름', '투자자산', '채무구조', '유동성'],
      traditionalMeaning: '군겁쟁재(群劫爭財) 및 재성 충돌로 인한 재물 손실과 지출 압박',
      practicalMeaning: sanitizeFearExpressions(
        '무리한 레버리지나 조급한 투자 욕구가 이성적 판단을 흐려 현금 흐름의 경색을 초래하기 쉬운 구조적 환경'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      timeAxisContext: {
        source: 'SEUN',
        year: targetYear,
        timingNarrative: `${targetYear}년 세운의 열기가 투자 심리를 자극할 수 있어 냉각기 유지가 필요합니다.`,
      },
      userProblemMapping: {
        currentEvent: userProblem.currentEvent,
        targetDomain: 'MONEY',
        connectionNarrative: `의뢰인의 재물 고민("${userProblem.currentEvent}")과 맞물려 자산 동결과 방어적 현금 보존이 핵심 과제로 도출됩니다.`,
      },
      similarCase: '시장 변동기 무리한 추가 매수나 지인의 투자 제안에 성급히 응했다가 유동성이 묶인 일반적 금융 사례',
      riskAwareness: '원금을 단기간에 만회하겠다는 조급함으로 더 큰 변동성 상품에 진입하는 심리적 함정',
      understanding: '재성은 안정적인 담는 그릇이 필요한데, 격렬한 기운이 그릇을 흔들어 일시적으로 누수가 생기는 현상',
      mitigationDirection: '신규 투자 집행 즉시 보류, 현금 비중 80% 이상 확보, 고정비 긴축 및 채무 구조조정',
      prescriptionCandidates: ['신규 지출 결재권 위임', '자산 동결 및 3개월 관망', '재무 전문가 3자 객관 검토'],
      confidence: 0.9,
    };
  }

  // 2. 사업마 (BUSINESS)
  private detectBusinessMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = [];
    const relatedModules: ModularId[] = ['BUSINESS'];

    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      relatedModules.push('RELATION');
      const wonjins = relMod.calculation.rawMetrics?.wonjins || [];
      const gwimuns = relMod.calculation.rawMetrics?.gwimuns || [];
      const harms = relMod.calculation.rawMetrics?.harms || [];
      if (wonjins.length > 0) evidences.push(`원진(怨嗔): ${wonjins.join(', ')}`);
      if (gwimuns.length > 0) evidences.push(`귀문관살(鬼門關煞): ${gwimuns.join(', ')}`);
      if (harms.length > 0) evidences.push(`해(害): ${harms.join(', ')}`);
    }

    if (evidences.length === 0) {
      evidences.push('사업 거래처 및 파트너 간의 지분·책임 경계성 불협화음');
    }

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'BUSINESS',
      modules
    );

    return {
      magaId: 'MAGA_BUSINESS',
      magaName: '사업마(事業魔)',
      category: 'BUSINESS',
      source: 'NATAL',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['지분구조', '계약관계', '거래처신뢰', '법적리스크'],
      traditionalMeaning: '동업자 간의 불화, 계약 파기 및 사업체의 대외 명예 손상',
      practicalMeaning: sanitizeFearExpressions(
        '동업자나 거래처와의 기대치 불일치, 구두 합의의 허점 등으로 인해 신뢰가 금가고 마찰이 생기기 쉬운 구조'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      timeAxisContext: {
        source: 'DAEWUN',
        year: targetYear,
        timingNarrative: `${targetYear}년에는 사람 간의 계약 구조에서 오해가 생길 수 있으므로 서면 공증이 안전합니다.`,
      },
      userProblemMapping: {
        currentEvent: userProblem.currentEvent,
        targetDomain: 'BUSINESS',
        connectionNarrative: `사업 현장의 마찰("${userProblem.currentEvent}")은 무리한 사업 확장보다 내실 점검과 계약서 재정비 신호입니다.`,
      },
      similarCase: '구두 신뢰만 믿고 서면 계약을 미루다 주요 거래처의 납기 불이행 및 지분 갈등으로 번진 일반 사례',
      riskAwareness: '감정적 대립으로 번져 소송전에 휩쓸리거나 회사의 실질 가치를 훼손하는 성급한 법적 대응',
      understanding: '사업 환경의 계절적 겨울에 해당하여 무리한 확장이 조직의 내실을 갉아먹는 국면',
      mitigationDirection: '법적 리스크 사전 검토, 구두 약속의 공증 문서화, 분쟁 시 제3자 전문 중재 활용',
      prescriptionCandidates: ['계약서 전수 재검토', '감정적 언사 차단 및 공문 소통', '확장 계획 전면 동결'],
      confidence: 0.92,
    };
  }

  // 3. 직장마 (JOB)
  private detectJobMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = [];
    const relatedModules: ModularId[] = ['JOB'];

    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      relatedModules.push('RELATION');
      const clashes = relMod.calculation.rawMetrics?.clashes || [];
      const punishments = relMod.calculation.rawMetrics?.punishments || [];
      if (clashes.length > 0) evidences.push(`직장 환경 정면 충(沖): ${clashes.join(', ')}`);
      if (punishments.length > 0) evidences.push(`조직 내 형(刑) 작용: ${punishments.join(', ')}`);
    }

    if (evidences.length === 0) {
      evidences.push('관성(官星)의 위축 및 조직 위계와의 일시적 엇박자');
    }

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'JOB',
      modules
    );

    return {
      magaId: 'MAGA_JOB',
      magaName: '직장마(職場魔)',
      category: 'JOB',
      source: 'DAEWUN',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['상사관계', '인사평가', '업무배분', '커리어안정성'],
      traditionalMeaning: '관직의 불안정성 및 상사와의 마찰로 인한 관재구설',
      practicalMeaning: sanitizeFearExpressions(
        '상사나 조직의 방향성과 내 업무 가치관이 충돌하여 심리적 소진과 인사상 부담이 커지기 쉬운 상태'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      timeAxisContext: {
        source: 'SEUN',
        year: targetYear,
        timingNarrative: `${targetYear}년 상반기는 조직 내 갈등 가능성이 있으므로 충동적 퇴사보다 실리 중심 대응이 유효합니다.`,
      },
      userProblemMapping: {
        currentEvent: userProblem.currentEvent,
        targetDomain: 'JOB',
        connectionNarrative: `직장 내 고민("${userProblem.currentEvent}")에 대응해 즉각적 퇴사보다 플랜B 이직 준비가 추천됩니다.`,
      },
      similarCase: '조직 개편 후 상사의 독단적 지시에 정면 반발했다가 주요 프로젝트에서 배제된 사례',
      riskAwareness: '홧김에 대책 없는 즉시 퇴사를 결정하거나 조직 내에서 고립을 자초하는 감정적 반발',
      understanding: '명예와 틀을 상징하는 관성(官星)이 흔들려 내가 머무는 조직의 안정성이 일시 약화된 국면',
      mitigationDirection: '정면 승부 회피, 증거 중심의 업무 기록, 이직 시장 냉정한 탐색 후 차분한 플랜B 구축',
      prescriptionCandidates: ['업무 지시 이메일/메신저 아카이빙', '조직 내 중립적 멘토 확보', '야간 이직 스킬 준비'],
      confidence: 0.88,
    };
  }

  // 4. 연애마 (LOVE)
  private detectLoveMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = [];
    const relatedModules: ModularId[] = ['LOVE'];

    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      relatedModules.push('RELATION');
      const clashes = relMod.calculation.rawMetrics?.clashes || [];
      const wonjins = relMod.calculation.rawMetrics?.wonjins || [];
      if (clashes.length > 0) evidences.push(`배우자궁 충(沖): ${clashes.join(', ')}`);
      if (wonjins.length > 0) evidences.push(`정서적 원진(怨嗔): ${wonjins.join(', ')}`);
    }

    if (evidences.length === 0) {
      evidences.push('일지(日支)와 세운 간의 감정적 마찰 및 인연의 엇갈림');
    }

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'LOVE',
      modules
    );

    return {
      magaId: 'MAGA_LOVE',
      magaName: '연애마(戀愛魔)',
      category: 'LOVE',
      source: 'NATAL',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['정서적교감', '소통방식', '집착성심리', '인연유지'],
      traditionalMeaning: '인연의 엇갈림, 애증의 반복과 이별수',
      practicalMeaning: sanitizeFearExpressions(
        '서로에 대한 집착이나 오해가 감정의 격차를 벌려 사소한 말 한마디가 갈등으로 비화하기 쉬운 기류'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      timeAxisContext: {
        source: 'SEUN',
        year: targetYear,
        timingNarrative: `${targetYear}년은 연애 감정의 과열이 예상되므로 성급한 결단 대신 냉각 기간을 두는 것이 안전합니다.`,
      },
      userProblemMapping: {
        currentEvent: userProblem.currentEvent,
        targetDomain: 'LOVE',
        connectionNarrative: `연애의 어려움("${userProblem.currentEvent}")에 대해 상대방을 억지로 붙잡기보다 감정 정리와 자존감 회복이 선행되어야 합니다.`,
      },
      similarCase: '상대의 일상적 침묵을 불성실로 오해하여 감정적 장문의 메시지를 보낸 후 관계가 소원해진 사례',
      riskAwareness: '상대의 마음을 억지로 확인하려 들거나 반복적인 연락으로 상황을 악화시키는 조급함',
      understanding: '배우자궁(일지)의 기운이 흔들려 정서적 안전지대가 깨져 불안감이 투사되는 시기',
      mitigationDirection: '최소 2주간의 감정적 냉각기(No Contact), 나 자신의 일상 루틴 회복, 상대의 경계 존중',
      prescriptionCandidates: ['연락 주기 의도적 연장', '혼자만의 산책과 일기 쓰기', '감정 억측 멈추기'],
      confidence: 0.9,
    };
  }

  // 5. 결혼마 (MARRIAGE)
  private detectMarriageMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = ['일지 부부궁의 긴장성 기류'];
    const relatedModules: ModularId[] = ['MARRIAGE'];

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'MARRIAGE',
      modules
    );

    return {
      magaId: 'MAGA_MARRIAGE',
      magaName: '결혼마(結婚魔)',
      category: 'MARRIAGE',
      source: 'NATAL',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['부부소통', '가정내역할', '가치관차이', '정서적거리'],
      traditionalMeaning: '부부궁의 불협화음과 독수공방의 고독성 기운',
      practicalMeaning: sanitizeFearExpressions(
        '가정 내 역할 분담과 가치관 차이가 누적되어 배우자와의 정서적 교감이 일시 차단되는 국면'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      similarCase: '육아 및 경제권 갈등을 방치하다가 각방 생활과 별거 논의로 급진전된 사례',
      riskAwareness: '과거의 서운함을 한꺼번에 쏟아내며 배우자의 존재 자체를 부정하는 언어 습관',
      understanding: '일지 환경의 조후가 불균형해져 가장 가까운 사람에게 가시가 돋치는 시기',
      mitigationDirection: '비난 없는 대화법(I-message), 생활 동선 분리, 부부 상담 전문가 중재',
      prescriptionCandidates: ['주 1회 가사 감사 표현', '단독 수면 공간 분리', '제3자 가족 개입 차단'],
      confidence: 0.85,
    };
  }

  // 6. 인마 / 관계마 (RELATIONSHIP)
  private detectRelationshipMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = [];
    const relatedModules: ModularId[] = ['RELATIONSHIP'];

    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      relatedModules.push('RELATION');
      const punishments = relMod.calculation.rawMetrics?.punishments || [];
      const selfPunishments = relMod.calculation.rawMetrics?.selfPunishments || [];
      const harms = relMod.calculation.rawMetrics?.harms || [];
      if (punishments.length > 0) evidences.push(`형살(刑煞): ${punishments.join(', ')}`);
      if (selfPunishments.length > 0) evidences.push(`자형(自刑): ${selfPunishments.join(', ')}`);
      if (harms.length > 0) evidences.push(`해(害): ${harms.join(', ')}`);
    }

    if (evidences.length === 0) {
      evidences.push('신뢰의 과도한 노출로 인한 대인 구설수');
    }

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'RELATIONSHIP',
      modules
    );

    return {
      magaId: 'MAGA_RELATIONSHIP',
      magaName: '인마(人魔) · 관계마(關係魔)',
      category: 'RELATIONSHIP',
      source: 'NATAL',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['신뢰관계', '구설수', '사적경계', '동료관계'],
      traditionalMeaning: '가까운 사람으로 인한 손실과 배신, 시비구설',
      practicalMeaning: sanitizeFearExpressions(
        '선의로 베푼 호의가 왜곡되어 구설에 오르거나 가까운 지인과의 경계선이 무너져 피로감을 겪는 시기'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      similarCase: '동료의 험담에 맞장구쳤다가 모든 책임의 주동자로 지목되어 팀 내에서 고립된 사례',
      riskAwareness: '억울함을 풀기 위해 사방에 해명하러 다니다가 오히려 구설을 키우는 악순환',
      understanding: '형살과 해살이 작동하여 인간관계의 경계선이 느슨해진 틈으로 불협화음이 침투하는 현상',
      mitigationDirection: '사적 비밀 공유 금지, 업무 외 만남 축소, 침묵과 거리두기를 통한 상황 냉각',
      prescriptionCandidates: ['메신저 사담 단톡방 무음 처리', '비밀 토로 차단', '중립적 태도 견지'],
      confidence: 0.88,
    };
  }

  // 7. 건강마 (HEALTH)
  private detectHealthMaga(
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    pillars?: FourPillars,
    targetYear: number = 2026
  ): MagaDiagnosisResultItem {
    const evidences: string[] = [];
    const relatedModules: ModularId[] = ['HEALTH'];

    const strMod = modules['STRENGTH'];
    if (strMod && strMod.success) {
      relatedModules.push('STRENGTH');
      const st = strMod.calculation.rawMetrics?.strength;
      if (st === '극약' || st === '신약') evidences.push(`일간 체력 기반 약화 (${st})`);
    }

    const relMod = modules['RELATION'];
    if (relMod && relMod.success) {
      relatedModules.push('RELATION');
      const clashes = relMod.calculation.rawMetrics?.clashes || [];
      if (clashes.length > 0) evidences.push(`지각변동성 충(沖): ${clashes.join(', ')}`);
    }

    if (evidences.length === 0) {
      evidences.push('오행 밸런스 불균형에 의한 만성 신경성 피로');
    }

    const { intensity, relevance } = this.calculate100Score(
      evidences,
      userProblem,
      'HEALTH',
      modules
    );

    return {
      magaId: 'MAGA_HEALTH',
      magaName: '건강마(健康魔)',
      category: 'HEALTH',
      source: 'NATAL',
      evidence: evidences,
      relatedModules,
      affectedAreas: ['신체밸런스', '면역력', '수면리듬', '급성피로'],
      traditionalMeaning: '신체의 손상과 기력 쇠진, 수술수',
      practicalMeaning: sanitizeFearExpressions(
        '누적된 만성 피로와 스트레스가 신체 취약 부위에 염증이나 체력 저하로 발현되는 신호'
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      similarCase: '과로를 버티며 경고 증상을 무시하다가 급성 염증으로 응급 병원을 찾은 사례',
      riskAwareness: '의사의 전문 소견을 대수롭지 않게 넘기거나 검증되지 않은 방법에 의존하는 태도',
      understanding: '오행의 조화가 깨져 신체의 특정 장기나 신경계가 과열되거나 냉각된 상태',
      mitigationDirection: '조기 정밀 검진, 수면 8시간 확보, 격렬한 활동 대신 가벼운 스트레칭과 보양',
      prescriptionCandidates: ['상급 병원 2차 소견 의뢰', '야근 전면 중단', '자극적 식단 제한'],
      confidence: 0.91,
    };
  }

  // 8. 동적 커스텀 도메인 마·살 탐지 (확장성 5절 지원)
  private detectCustomDomainMaga(
    domain: string,
    userProblem: UserProblemInput,
    modules: Record<string, ModularOutput>,
    targetYear: number
  ): MagaDiagnosisResultItem {
    const evidences = [`[${domain}] 영역에 대한 환경적 기운 집중`];
    const { intensity, relevance } = this.calculate100Score(evidences, userProblem, domain, modules);

    return {
      magaId: `MAGA_${domain}`,
      magaName: `${domain}마(${domain}魔)`,
      category: domain,
      source: 'NATAL',
      evidence: evidences,
      relatedModules: ['MAGA_DIAGNOSIS'],
      affectedAreas: [domain, '환경변화', '대응전략'],
      traditionalMeaning: `${domain} 영역의 기운 편중으로 인한 일시적 장애`,
      practicalMeaning: sanitizeFearExpressions(
        `${domain} 관련 과도한 추진이 외부 환경과 마찰을 일으키기 쉬운 시점`
      ),
      intensityScore: intensity,
      relevanceScore: relevance,
      similarCase: `${domain} 영역에서 성급한 결단으로 불필요한 마찰을 겪은 일반 사회적 사례`,
      riskAwareness: '상황을 단번에 통제하려는 과욕과 성급한 판단',
      understanding: '기운의 흐름이 해당 영역으로 쏠려 냉정한 균형이 요구되는 국면',
      mitigationDirection: '신중한 사전 조사와 전문가 자문, 단계적 실행',
      prescriptionCandidates: ['현상 유지 및 모니터링', '신중한 2차 검토'],
      confidence: 0.8,
    };
  }

  // --------------------------------------------------------------------------
  // 100점 체계 점수 계산기 (7절, 11절)
  // --------------------------------------------------------------------------
  private calculate100Score(
    evidences: string[],
    userProblem: UserProblemInput,
    category: string,
    modules: Record<string, ModularOutput>
  ): { intensity: number; relevance: number } {
    // A. intensityScore (명리 구조상 영향 강도, 0~100)
    // 1. 명리 근거 강도 (최대 30)
    let groundScore = 15;
    for (const ev of evidences) {
      if (ev.includes('충')) groundScore += 8;
      if (ev.includes('형') || ev.includes('자형')) groundScore += 6;
      if (ev.includes('원진') || ev.includes('귀문')) groundScore += 5;
      if (ev.includes('겁살') || ev.includes('겁재')) groundScore += 5;
    }
    groundScore = Math.min(30, groundScore);

    // 2. 구조적 반복/중첩 (최대 20)
    const repetitionScore = Math.min(20, evidences.length * 7);

    // 3. 시간축 활성도 (최대 20)
    let timeAxisScore = 10;
    if (modules['SEUN'] && modules['SEUN'].success) timeAxisScore += 5;
    if (modules['DAEWUN'] && modules['DAEWUN'].success) timeAxisScore += 5;
    timeAxisScore = Math.min(20, timeAxisScore);

    // 4. 조후/강약 보정 (최대 10)
    let balanceScore = 5;
    if (modules['STRENGTH']?.calculation.rawMetrics?.strength === '신약') balanceScore += 5;

    // 5. 구조적 잠재력 (최대 20)
    const structuralPotential = 15;

    const intensity = Math.min(100, Math.max(25, groundScore + repetitionScore + timeAxisScore + balanceScore + structuralPotential));

    // B. relevanceScore (현재 사용자 문제와의 관련성, 0~100)
    let relevance = 30; // 기본 점수
    const targetDomain = (userProblem.targetDomain || this.inferDomain(userProblem.currentEvent || userProblem.userTrouble)).toUpperCase();

    // 도메인 완전 일치 시 대폭 가산
    if (category.toUpperCase() === targetDomain) {
      relevance += 45;
    }

    // 텍스트 키워드 매칭
    const text = `${userProblem.currentEvent || ''} ${userProblem.userTrouble || ''}`.toLowerCase();
    const domainKeywords: Record<string, string[]> = {
      MONEY: ['돈', '투자', '손실', '빚', '주식', '코인', '부채', '현금'],
      BUSINESS: ['사업', '동업', '계약', '거래처', '회사', '지분', '폐업', '매출'],
      JOB: ['직장', '상사', '이직', '퇴사', '승진', '회사원', '동료', '팀장'],
      LOVE: ['연인', '결별', '이별', '헤어', '애인', '남친', '여친', '재회'],
      MARRIAGE: ['결혼', '부부', '시가', '처가', '별거', '이혼', '가정'],
      RELATIONSHIP: ['인간관계', '배신', '구설', '친구', '지인', '싸움', '소통'],
      HEALTH: ['건강', '수술', '병원', '질병', '치료', '디스크', '피로', '통증'],
    };

    const keywords = domainKeywords[category.toUpperCase()] || [];
    let matchCount = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) matchCount++;
    }
    relevance += Math.min(25, matchCount * 8);

    relevance = Math.min(100, Math.max(15, relevance));

    return { intensity, relevance };
  }

  // --------------------------------------------------------------------------
  // 보조 도우미
  // --------------------------------------------------------------------------
  private inferDomain(text?: string): string {
    if (!text) return 'GENERAL';
    const t = text.toLowerCase();
    if (t.includes('돈') || t.includes('투자') || t.includes('손실') || t.includes('빚')) return 'MONEY';
    if (t.includes('사업') || t.includes('동업') || t.includes('계약') || t.includes('거래처')) return 'BUSINESS';
    if (t.includes('직장') || t.includes('이직') || t.includes('상사') || t.includes('퇴사')) return 'JOB';
    if (t.includes('연애') || t.includes('결별') || t.includes('이별') || t.includes('연인')) return 'LOVE';
    if (t.includes('결혼') || t.includes('부부') || t.includes('별거')) return 'MARRIAGE';
    if (t.includes('건강') || t.includes('수술') || t.includes('병원') || t.includes('아프')) return 'HEALTH';
    if (t.includes('친구') || t.includes('배신') || t.includes('구설') || t.includes('관계')) return 'RELATIONSHIP';
    return 'GENERAL';
  }

  private extractPillars(modules: Record<string, ModularOutput>, problem: UserProblemInput): FourPillars | undefined {
    const coreMod = modules['CORE_ORIGINAL'];
    if (coreMod && coreMod.data?.dayMaster) {
      // data에서 복원
      return coreMod.data?.pillars;
    }
    return undefined;
  }

  private createFallbackResult(userProblem: UserProblemInput, status: 'UNAVAILABLE'): MagaDiagnosisComprehensiveResult {
    const fallbackMaga: MagaDiagnosisResultItem = {
      magaId: 'MAGA_UNAVAILABLE',
      magaName: '생활마(生活魔) - 기본 진단',
      category: 'GENERAL',
      source: 'NATAL',
      evidence: ['입력 모듈 부재로 인한 기본 생활 리듬 점검'],
      relatedModules: [],
      affectedAreas: ['일상생활', '심신안정'],
      traditionalMeaning: '일상의 일시적 정체',
      practicalMeaning: '심신의 환절기성 피로 관리',
      intensityScore: 30,
      relevanceScore: 30,
      similarCase: '바쁜 일상 중 에너지 소진으로 무기력해진 사례',
      riskAwareness: '무리한 활동 추진',
      understanding: '에너지 재충전 국면',
      mitigationDirection: '충분한 수면과 휴식',
      prescriptionCandidates: ['명상 및 휴식'],
      confidence: 0.5,
    };

    return {
      primaryMaga: fallbackMaga,
      secondaryMagas: [],
      allCandidates: [fallbackMaga],
      overallSeverity: 'MILD',
      status,
    };
  }
}

export const magaDiagnosisEngine = new MagaDiagnosisEngine();
