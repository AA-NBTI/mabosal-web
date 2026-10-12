/**
 * 솔루션 허브 공용 타입
 * 원칙: 마보살 코어 엔진은 읽기 전용으로만 참조하고, 이 폴더에서 엔진 파일은 수정하지 않는다.
 */

export type VerticalId = 'finance' | 'career' | 'home' | 'mind' | 'body' | 'legal';

export type SignalLevel = 1 | 2 | 3;

/** 엔진 결과를 번역한 신호 태그 */
export interface SignalTag {
  tag: string;
  level: SignalLevel;
  /** 근거가 된 마 모듈의 한글명 (카드 문구에서 결과 인용용) */
  sourceName: string;
}

export interface VerticalConfig {
  id: VerticalId;
  label: string;
  /** ModuleRegistry 스위치 ID */
  moduleId: string;
  icon: string;
  maxCards: number;
}

export type SettlementType = 'CPS' | 'CPA' | 'FLAT';

export interface Partner {
  id: string;
  name: string;
  verticalId: VerticalId;
  settlement: SettlementType;
  active: boolean;
}

export interface SolutionItem {
  id: string;
  partnerId: string;
  title: string;
  oneLine: string;
  priceText?: string;
  /** 실제 제휴 링크. 비어 있으면 카드는 '준비 중'으로 표시된다. */
  url: string;
  matchTags: { tag: string; minLevel: SignalLevel }[];
  /** {ma} 자리에 결과의 마 이름이 들어간다 */
  reasonTemplate: string;
  priority: number;
  /** 실제 파트너 확정 전 샘플 데이터 여부 */
  isSample?: boolean;
  /** 클릭 후 재노출 억제 쿨다운 기간(일 단위, 기본 7일) */
  cooldownDays?: number;
}

export interface Recommendation {
  solution: SolutionItem;
  partner: Partner;
  vertical: VerticalConfig;
  reason: string;
  level: SignalLevel;
}

/** 파트너 입점 신청 데이터 구조 */
export interface PartnerApplication {
  id: string;
  partnerName: string;
  contactName: string;
  email: string;
  phone: string;
  verticalId: VerticalId;
  solutionTitle: string;
  description: string;
  targetUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

/** 솔루션 노출/클릭 집계 통계 */
export interface SolutionStatSummary {
  solutionId: string;
  title: string;
  verticalId: VerticalId;
  partnerName: string;
  impressions: number;
  clicks: number;
  ctr: number; // 클릭률 (%)
}
