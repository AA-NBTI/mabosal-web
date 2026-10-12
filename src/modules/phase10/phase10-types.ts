/**
 * Phase 10: Final User Report Types
 * 
 * 원칙:
 * 1. 실제 사용자 관점에서 자신의 사주를 직관적으로 읽고 이해할 수 있는 서비스 리포트 규격입니다.
 * 2. 3단 리포트 모드 (QUICK / STANDARD / DEEP)를 지원하되, 판단 결과는 동일하고 표현 깊이만 차별화됩니다.
 * 3. 5대 핵심 섹션:
 *    ① 사주 기본 구조
 *    ② 전체 흐름 요약
 *    ③ 6대 핵심 테마 (한줄 결론 → 근거 → 구조 해석 → 현실 참고)
 *    ④ 전체 구조 연결 (강화, 충돌, 완충, 동시 관리 영역 종합)
 *    ⑤ 마보살 종합 해석 ("이 사주의 핵심 구조는 무엇인가?")
 */

import { InterpretationTheme } from '../phase6/phase6-types.js';
import { RenderedThemeInterpretation } from '../phase9/phase9-types.js';

export type ReportDepthMode = 'QUICK' | 'STANDARD' | 'DEEP';

/**
 * ① 사주 기본 구조
 */
export interface SajuBaseStructure {
  birthInfo: {
    birthDate: string;
    birthTime: string | null;
    isMissingHour: boolean;
  };
  fourPillars: {
    year: string;   // 예: "갑자(甲子)"
    month: string;  // 예: "기사(己巳)"
    day: string;    // 예: "기유(己酉)"
    hour: string;   // 예: "신미(辛未)" 또는 "시간 미상"
  };
  dayMaster: {
    stem: string;        // 예: "기(己)"
    element: string;     // 예: "토(土)"
    meaning: string;     // 예: "만물을 품고 기르는 부드러운 대지의 흙"
  };
  fiveElementsDistribution: {
    counts: Record<string, number>;
    dominantElement: string;
    missingElements: string[];
    balanceStatus: string; // 예: "화(火)와 토(土) 기운이 중심을 이루는 안정된 분포"
  };
  dayMasterStrength: {
    classification: string; // 예: "중화", "신강", "극약" 등
    score: number;
    description: string;    // 사용자 친화적 설명
  };
}

/**
 * ② 전체 흐름 요약
 */
export interface OverallFlowSummary {
  headline: string;          // 첫 화면에서 핵심이 꽂히는 한 줄 헤드라인
  keyTendency: string;       // 사주의 주도적 기운과 삶의 기본 성향 요약
  rsiBandStatus: {
    band: string;
    userExplanation: string; // RSI의 대중적 해석 ("안정된 구심점", "건전한 긴장과 도약" 등)
  };
}

/**
 * ③ 6대 핵심 테마 리포트 항목
 */
export interface ThemeReportItem {
  theme: InterpretationTheme;
  title: string;
  summary: string;              // 한줄 결론
  evidence?: string;            // 근거 (STANDARD / DEEP)
  structuralInterpretation?: string; // 구조적 해석 (STANDARD / DEEP)
  actionableCaution?: string;   // 현실적 참고사항
  deepFactDetails?: {           // DEEP 모드 전용 세부 Fact
    pillarsInvolved: string[];
    tenGods: string[];
    signals: string[];
    rawVerdict: string;
  };
  certaintyDescription: string;
}

/**
 * ④ 전체 구조 연결 (Structural Synthesis)
 */
export interface StructuralSynthesis {
  amplifiedAreas: string[];   // 서로 강화되는 영역 (예: 직장 역량과 문서 자격의 상생)
  conflictingAreas: string[]; // 서로 충돌·긴장하는 영역 (예: 조직 규율과 독자 실행 간 마찰)
  mitigatedAreas: string[];   // 완충·보호되는 영역 (예: 귀인과 지혜를 통한 변동성 감쇄)
  dualManagementAreas: string[]; // 동시에 균형 관리해야 하는 영역 (예: 사업적 기회와 유동성 리스크)
  synthesisNote: string;      // 구조적 연결 종합 서술문
}

/**
 * ⑤ 마보살 종합 해석 ("이 사주의 핵심 구조가 무엇인가?")
 */
export interface MabosalFinalSynthesis {
  coreStructureVerdict: string; // 핵심 명리 구조의 인간 중심 정의
  lifeStrategy: string;         // 사주를 활용하는 주도적 삶의 전략
  closingBlessing: string;      // 마보살의 품격 있는 맺음말
}

/**
 * 시간축 보조 설명 (원국 비간섭 원칙 준수)
 */
export interface TemporalModulationSummary {
  hasActiveTimeSignals: boolean;
  timeScopeDescriptions: {
    timeScope: 'DAEWOON' | 'SEWOON' | 'WOLWOON';
    targetThemeTitle: string;
    modulationEffect: string; // 원국 자체가 바뀐 것이 아니라 "현재 시점에서 어떤 환경이 조성되는가"
  }[];
  temporalDisclaimer: string; // "시간의 흐름은 원국의 잠재력을 일깨우는 환경적 계기입니다."
}

/**
 * 최종 사용자 사주 리포트 완성본
 */
export interface MabosalFinalUserReport {
  depthMode: ReportDepthMode;
  basicStructure: SajuBaseStructure;
  flowSummary: OverallFlowSummary;
  themes: ThemeReportItem[];
  structuralSynthesis?: StructuralSynthesis; // STANDARD / DEEP
  finalSynthesis: MabosalFinalSynthesis;
  temporalModulation?: TemporalModulationSummary;
  meta: {
    reportGeneratedAt: string;
    engineVersion: string;
    certaintyLevel: 'PROVISIONAL';
    safetyVerified: boolean;
  };
}
