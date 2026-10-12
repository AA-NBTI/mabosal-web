/**
 * Taste Module Types (맛 모듈 타입 정의)
 * 
 * 원칙:
 * 1. 맛(Taste)은 계산 엔진의 점수나 수치를 0.001점도 변경하지 않습니다.
 * 2. 동일한 계산 결과에 대해 오직 언어적 표현 강도, 어조, 문체만을 변환합니다.
 */

export type StandardTasteType =
  | 'mild'         // 순한맛: 위로, 격려, 완곡한 표현, 안정감 중심
  | 'standard'     // 보통맛: 균형 잡힌 어조, 명확하고 친절한 설명
  | 'spicy'        // 매운맛: 날카로운 팩트 폭격, 직설적 경고, 뼈때리는 조언
  | 'cold'         // 냉정한맛: 감정 배제, 철저한 확률과 인과적 논리 분석
  | 'realistic'    // 현실적인맛: 생활 밀착형, 구체적인 현실 행동 지침
  | 'bodhisattva'  // 보살맛: 자비롭고 선문답 같은 지혜, 관조적 태도
  | 'direct';      // 직설맛: 군더더기 없는 단도직입적 요약

export type TasteType = StandardTasteType | string;

export interface TasteProfile {
  tasteId: TasteType;
  koreanName: string;
  directnessLevel: number;    // 1 (완곡) ~ 5 (직설 극대)
  empathyLevel: number;       // 1 (냉정) ~ 5 (극단적 공감)
  cautionIntensity: number;   // 1 (부드러운 주의) ~ 5 (엄중한 경고)
  speechStyle: string;        // 문체 스타일 설명
}

export interface StyledExpressionSet {
  title: string;
  topMaComment: string;
  cautionComment: string;
  actionAdvice: string;
}

export interface TasteOutput<T> {
  appliedTaste: TasteType;
  tasteProfile: TasteProfile;
  originalResult: T;          // 원본 계산 결과 (완전 불변 보존)
  styledExpressions: StyledExpressionSet;
}
