/**
 * Phase 17~25 통합 타입 정의
 * 
 * 최우선 원칙:
 * 1. 마보살은 AI가 사주를 대신 봐주는 서비스가 아님.
 * 2. 일반 사주풀이 + 현실의 문제 상황 + 명리학적 분석 + 마보살식 문제 진단 + 시기 분석 + 현실적 처방
 * 3. '마'는 사주풀이의 전부가 아니라 독자적 문제 진단 레이어.
 * 4. 사용자에게 내부 엔진 용어(연애마, 직장마 등)를 직접 노출하지 않고
 *    '명리 근거 -> 현실 언어 -> 마보살식 진단' 순서로 표현.
 */

import { HeavenlyStem, EarthlyBranch } from '../../core/types.js';

export type Gender = 'male' | 'female';

// ==========================================
// Phase 18: 출생정보 입력 시스템
// ==========================================
export type CalendarType = 'solar' | 'lunar';

export interface RawBirthInput {
  calendar_type: CalendarType;  // 양력 / 음력
  is_leap_month: boolean;        // 윤달 여부 (음력일 때만 적용)
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_time: string | null;     // 'HH:mm' 또는 null (출생시간 미상)
  is_time_unknown: boolean;
  birth_city: string;            // 출생지 (예: 서울, 부산 등)
  gender: Gender;                // 성별 (원천 보존)
}

export interface StandardBirthDate {
  solar_year: number;
  solar_month: number;
  solar_day: number;
  solar_date_string: string;    // 'YYYY-MM-DD'
  is_leap_applied: boolean;
  original_input: RawBirthInput;
}

// ==========================================
// Phase 17: 일반 사주 해석 엔진
// ==========================================
export interface GeneralSajuReport {
  day_master: {
    stem: HeavenlyStem;
    name: string;
    nature: string;            // 일간 본질 및 물상
    keywords: string[];
    psychological_trait: string; // 심리적 성향
  };
  five_elements: {
    distribution: Record<string, number>;
    dominant: string;
    dominantByPower?: string;
    dominantByCount?: string;
    dominantDefinition?: string;
    lacking: string[];
    lackingElement?: string;
    lackingDefinition?: string;
    temperature_balance: string; // 조후 및 균형 상태
    commentary: string;
  };
  strength: {
    status: '극강' | '신강' | '중화' | '신약' | '극약';
    reasons: {
      deungryeong: boolean; // 득령 (월지 득여부)
      deungji: boolean;    // 득지 (일지 득여부)
      deungse: boolean;    // 득세 (타 세력 득여부)
    };
    description: string;
  };
  themes: {
    wealth: GeneralThemeDetail;       // 재물
    career: GeneralThemeDetail;       // 직장
    business: GeneralThemeDetail;     // 사업
    relationship: GeneralThemeDetail; // 연애
    marriage: GeneralThemeDetail;     // 결혼
    interpersonal: GeneralThemeDetail;// 인간관계
    health: GeneralThemeDetail;       // 건강
  };
  daewoon: {
    cycle_years: number;             // 대운수
    direction: '순행' | '역행';
    current_daewoon: {
      pillar: string;
      age_range: string;
      flow_summary: string;
    };
  };
  sewoon: {
    current_year: number;
    current_pillar: string;
    flow_summary: string;
    critical_opportunities: string[];
    caution_points: string[];
  };
  key_timing_periods: TimingPeriod[];
}

export interface GeneralThemeDetail {
  title: string;
  rating: '최상' | '우수' | '안정' | '주의' | '변화기';
  summary: string;
  foundation_analysis: string;       // 원국 기반 타고난 성향
  current_flow: string;              // 현재 운의 흐름
  action_guideline: string;          // 권장 태도
}

export interface TimingPeriod {
  period_label: string;              // 예: '2026년 가을 (9~11월)'
  event_type: '기회' | '안정' | '전환점' | '조율';
  description: string;
  basis: string;
}

// ==========================================
// Phase 19: 현실 문제 입력 시스템
// ==========================================
export type ProblemCategory = 
  | 'breakup'          // 애인과 헤어졌어요 / 연애 갈등
  | 'marriage_block'   // 결혼이 잘 안 돼요
  | 'job_loss'         // 직장에서 잘렸어요 / 이직 / 번아웃
  | 'business_struggle'// 사업이 계속 꼬여요
  | 'financial_drain'  // 돈이 계속 새요 / 투자 실패
  | 'people_conflict'  // 사람 때문에 힘들어요 (인간관계, 배신, 구설)
  | 'family_burden'    // 가족 갈등 / 부모, 자녀
  | 'sudden_block'     // 갑자기 일이 다 안 풀려요 / 원인 모를 정체
  | 'general_fortune'  // 특별한 문제는 없고 올해 운을 보고 싶어요
  | 'custom';          // 기타 사용자 직접 작성

export interface UserLifeTrouble {
  raw_text: string;
  category: ProblemCategory;
  category_label: string;
  urgency_level: 'high' | 'medium' | 'low';
  context_tags: string[];
  timestamp: string;
}

// ==========================================
// Phase 20: 일반 사주 + 마 진단 이중 엔진
// ==========================================
export type MaDomain = 
  | 'relationship'    // 연애 / 이별
  | 'marriage'        // 결혼
  | 'workplace'       // 직장 / 조직
  | 'business'        // 사업 / 창업
  | 'wealth'          // 재물 / 투자
  | 'interpersonal'   // 인간관계 / 평판
  | 'family'          // 가족
  | 'movement'        // 이동 / 이사 / 해외
  | 'contract'        // 계약 / 문서
  | 'reputation'      // 구설 / 평판
  | 'digital_tech'    // 디지털 환경 / AI
  | 'general_stagnation' // 전반적 침체
  | 'custom_domain';

export interface MaInternalSignal {
  domain: MaDomain;
  intensity: 'critical' | 'strong' | 'moderate' | 'mild' | 'none';
  activation_state: 'ACTIVE' | 'POTENTIAL' | 'DORMANT';
  structural_cause: string;         // 명리적 원인 (예: 편관 과다 + 세운 충)
  active_months_range: string;      // 지속 구간
  recovery_point: string;           // 완화/변화 시기
}

export interface DualEngineResult {
  general_saju: GeneralSajuReport;
  user_trouble: UserLifeTrouble;
  ma_signal: MaInternalSignal;
  is_ma_detected: boolean;
  problem_match_score: number;      // 현실 문제와 명리 구조의 일치도 (0~100)
}

// ==========================================
// Phase 21: 사용자 언어 출력 엔진
// ==========================================
export interface UserFacingPresentation {
  step1_current_situation: {
    heading: string;
    empathy_summary: string;        // "사용자가 가져온 문제를 이해했다는 것을 먼저 보여준다"
  };
  step2_saju_insight: {
    heading: string;
    structural_explanation: string; // "왜 이런 시점에 이런 일이 발생하기 쉬운지 설명"
    underlying_energy: string;
  };
  step3_mabosal_diagnosis: {
    heading: string;
    compressed_diagnosis: string;   // "쉽게 말하면 지금은 ○○에 마가 낀 시기로 볼 수 있습니다."
    diagnosis_detail: string;
  };
  step4_period: {
    heading: string;
    onset_time: string;             // 언제부터 강해졌는가
    peak_time: string;              // 강도가 최고조인 시기
    easing_time: string;            // 언제 완화되는가
  };
  step5_opportunity: {
    heading: string;
    breakthrough_moment: string;    // 어떤 시점에 흐름이 좋아지는가
    positive_signs: string[];
  };
  step6_action_prescription: {
    heading: string;
    immediate_action: string;       // 지금 피해야 할 행동 & 취해야 할 행동
    future_strategy: string;        // 좋은 시기에 취할 행동
  };
}

// ==========================================
// Phase 22: 시기 분석 엔진 고도화
// ==========================================
export interface TimingAnalysisReport {
  current_phase: string;
  crisis_peak_period: string;       // 문제의 강도가 높아지는 시기
  relief_period: string;            // 완화되는 시기
  action_opportune_period: string;  // 움직이기 좋은 시기
  waiting_recommended_period: string;// 기다리는 것이 좋은 시기
  meeting_people_period: string;    // 사람을 만나기 좋은 시기
  new_venture_period: string;       // 새로운 일을 시작하기 좋은 시기
  reconciliation_period: string;    // 관계 회복을 시도하기 좋은 시기
  monthly_timeline: MonthlyTimelineItem[];
}

export interface MonthlyTimelineItem {
  year_month: string;               // '2026-04'
  energy_flow: '상승' | '정체' | '전환' | '변동' | '안정';
  intensity_score: number;          // 1~10
  action_advice: string;
  astrological_basis: string;       // 명리적 근거 (예: 진월 상관생재, 신금 충)
}

// ==========================================
// Phase 23: 마보살 처방 시스템
// ==========================================
export interface PrescriptionReport {
  current_trouble_summary: string;
  root_cause: string;
  weakening_timeline: string;
  actions_to_avoid: string[];       // 지금 피해야 할 행동
  actions_to_take: string[];        // 지금 해야 할 행동
  timing_strategic_action: string;  // 좋은 시기에 취할 행동
  digital_remedy?: DigitalRemedySpec; // 디지털 처방 (부적, 카드, 배경화면)
}

export interface DigitalRemedySpec {
  remedy_id: string;
  title: string;                    // 예: "감정 정화와 관계 회복의 옥청부"
  color_theme: string;              // 오행 보완 컬러
  recommended_usage: string;        // "휴대폰 잠금화면으로 설정하여 시각적 안정감을 유지하세요"
  symbolic_meaning: string;
  downloadable_url?: string;
}

// ==========================================
// Phase 24: 상품 구조
// ==========================================
export type ProductTier = 
  | 'free_diagnosis'       // 무료: 기본 사주 진단
  | 'paid_detailed_saju'   // 유료 1: 정밀 사주풀이 (약 3~5만원)
  | 'paid_mabosal_full'    // 유료 2: 마보살 정밀풀이 (약 $100 / 15만원)
  | 'paid_deep_remedy'     // 유료 3: 마보살 심화 처방
  | 'paid_digital_talisman';// 디지털 처방/부적 상품

export interface ProductDetail {
  tier: ProductTier;
  title: string;
  subtitle: string;
  price_krw: number;
  price_usd: number;
  features: string[];
  cta_label: string;
}
