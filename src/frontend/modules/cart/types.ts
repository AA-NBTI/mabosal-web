import { StoreProduct, DeliveryType } from '../../extensions/commerce-store/types.js';
import { UserSajuProfile } from '../../state/user-saju-store.js';

export interface CartItem {
  id: string; // unique cart item id (e.g. `${productId}_${timestamp}`)
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  deliveryType: DeliveryType;
  thumbnailUrl?: string;
  category: string;
  reportTier?: string;
  contentPayload?: string;
  /** 품목별로 지정된 사주 대상자 스냅샷 */
  sajuSnapshot: UserSajuProfile;
  /** 선택된 옵션명 */
  selectedOptionName?: string;
  /** 체크박스 선택 여부 */
  selected: boolean;
  addedAt: string;
}

export interface CartSummary {
  totalItemsCount: number;
  selectedItemsCount: number;
  selectedProductAmount: number;
  shippingFee: number;
  totalPayAmount: number;
  hasPhysicalItems: boolean;
  hasSajuReportItems: boolean;
}
