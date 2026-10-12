/**
 * 마보살 인하우스 커머스 스토어 공용 타입
 */

export type StoreCategoryType = 'all' | 'report' | 'voucher' | 'ebook' | 'lecture' | 'consulting' | 'goods';

export interface StoreCategory {
  id: StoreCategoryType;
  label: string;
  icon: string;
}

export type DeliveryType = 'digital_url' | 'digital_download' | 'consulting_booking' | 'shipping' | 'saju_report' | 'voucher_code';

export interface StoreProduct {
  id: string;
  title: string;
  category: StoreCategoryType;
  price: number;
  originalPrice?: number;
  tagLine: string;
  description: string;
  detailsHtml?: string;
  thumbnailUrl: string;
  thumbnailIcon?: string;
  deliveryType: DeliveryType;
  /** 디지털 콘텐츠 열람/다운로드 링크 또는 사주 결과 리포트 연결 키 */
  contentPayload: string;
  /** 사주 연계 태그 (예: 'money.loss', 'career.change' 등 - 감지 시 '내 사주 맞춤' 배지 표기) */
  targetSignals: string[];
  status: 'active' | 'soldout' | 'hidden';
  badge?: string; // e.g. 'BEST', 'NEW', 'MD추천'
  createdAt: string;
  salesCount: number;
  reportTier?: string; // e.g. 'YEAR_2027', 'CAREER', 'WEALTH', 'CONFLICT_MALSAL'
}

export interface StoreOrder {
  userId?: string;
  orderId: string;
  productId: string;
  productTitle: string;
  category: StoreCategoryType;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  paymentMethod: 'card' | 'kakaopay' | 'tosspay' | 'transfer' | 'bank_transfer' | 'toss_card' | 'voucher';
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paidAt: string;
  deliveryType: DeliveryType;
  accessUrl: string;
  contentPayload?: string;
  /** PG 결제키 (카드/간편결제 승인 시) */
  paymentKey?: string;
}
