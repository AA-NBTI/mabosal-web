/**
 * Phase 13: Interpretation Engine Types
 * 마보살 해석 엔진 타입 정의
 * 
 * 명세서 요구사항 (Section 16, 18, 19):
 * 1. 계산과 해석의 완전 분리: 수치(0~100)는 100% 보존되며 AI/해석기가 변경할 수 없음.
 * 2. 8단계 표준 출력 구조:
 *    (1) 핵심 결과
 *    (2) 가장 강한 마 및 작용 이유
 *    (3) 현재 운에서 활성화된 부분
 *    (4) 부담 요소 (Pressure/Risk)
 *    (5) 기회 요소 (Opportunity)
 *    (6) 생활 조언 (Actionable Guidance)
 *    (7) 정보 부족 및 시간 의존성
 * 3. 안전·표현 원칙 (Section 18) 가드레일:
 *    - 건강마: 질병 진단/발병 확률 표현 금지
 *    - 사고마: 사고 발생 확률 예측 금지
 *    - 재판마: 소송 승패 확정 예측 금지
 *    - 마 점수는 명리학적 신호 강도이며 현실 사건의 확률과 동일하지 않음을 명시
 */

import { EngineResult, TimeDependencyInfo } from '../../core/types.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { MaResult } from '../ma/ma-types.js';
import { QuestionAnalysisOutput } from '../question/question-engine.js';
import { InteractionOutput } from '../interaction/interaction-engine.js';
import { TasteType } from '../taste/taste-types.js';
import { CharacterType } from '../character/character-types.js';

export interface InterpretationSection {
  sectionId: string;
  title: string;
  content: string;
  bullets?: string[];
  disclaimer?: string;
}

export interface SafetyGuardrailCheck {
  isSafe: boolean;
  medicalDiagnosisFiltered: boolean;
  accidentProbabilityFiltered: boolean;
  legalOutcomeFiltered: boolean;
  disclaimerApplied: boolean;
}

export interface StructuredInterpretation {
  // 1. 핵심 결과
  keySummary: InterpretationSection;
  // 2. 가장 강한 마 및 작용 이유
  topMaAnalysis: InterpretationSection;
  // 3. 현재 운에서 활성화된 부분
  luckActivationAnalysis: InterpretationSection;
  // 4. 부담 요소
  pressureFactors: InterpretationSection;
  // 5. 기회 요소
  opportunityFactors: InterpretationSection;
  // 6. 생활 조언
  actionGuidance: InterpretationSection;
  // 7. 정보 부족·시간 의존성
  timeDependencyNotice: InterpretationSection;
  // 8. 질문 맞춤형 특별 해설 (질문 입력 시)
  questionSpecificAnalysis?: InterpretationSection;
  
  // 전체 안전 가드레일 검사 결과
  safetyCheck: SafetyGuardrailCheck;
  
  // 메타데이터
  appliedTaste: TasteType;
  appliedCharacter: CharacterType;
}

export interface InterpretationTimeDependency {
  isMissingHour: boolean;
  timeDependencyScore?: number;
  confidence?: number;
  sensitiveAreas?: string[];
  userGuidanceMessage?: string;
}

export interface InterpretationInput {
  maOutput: MaModuleEngineOutput;
  questionOutput?: QuestionAnalysisOutput;
  interactionOutput?: InteractionOutput;
  tasteType?: TasteType;
  characterType?: CharacterType;
  timeDependency?: InterpretationTimeDependency | TimeDependencyInfo;
}

export interface InterpretationOutput {
  // 원본 계산 결과 (완전 불변 보존)
  rawEngineResult: {
    top_ma: MaResult;
    ma_count: number;
    interactionRiskIndex?: number;
  };
  interpretation: StructuredInterpretation;
  fullNarrative: string; // 8개 섹션이 결합된 완성형 서사 텍스트
}

export type InterpretationEngineResult = EngineResult<InterpretationOutput>;
