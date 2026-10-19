/**
 * [entitlement-core] 열람 권한 판정 순수 함수 (저장소/DOM 비의존 → 단위 테스트 가능)
 *
 * 원칙: "누가(identity) 어떤 주문(order)을 볼 수 있는가"는 이 파일의 함수로만 결정한다.
 * - 타인의 주문, 비로그인 상태, 미결제(pending/refunded) 주문은 절대 열람 불가.
 */
import { Identity, ownsRecord } from '../identity/index.js';

export interface EntitlementOrder {
  orderId: string;
  productId?: string;
  status?: string;
  deliveryType?: string;
  reportTier?: string;
  userId?: string;
  buyerEmail?: string;
  items?: { productId: string }[];
  refundRequested?: boolean;
}

export function filterOwnedOrders<T extends EntitlementOrder>(orders: T[], identity: Identity): T[] {
  if (identity.isGuest) return [];
  return orders.filter(o => ownsRecord(o, identity));
}

export function isReportOrderViewable(order: EntitlementOrder): boolean {
  return order.status === 'completed' && order.deliveryType === 'saju_report' && !order.refundRequested;
}

export function getViewableReportOrders<T extends EntitlementOrder>(orders: T[], identity: Identity): T[] {
  return filterOwnedOrders(orders, identity).filter(isReportOrderViewable);
}

/** 특정 주문을 이 사용자가 열람할 수 있는지 */
export function canViewOrder<T extends EntitlementOrder>(orders: T[], identity: Identity, orderId: string): boolean {
  return getViewableReportOrders(orders, identity).some(o => o.orderId === orderId);
}

/** 열람 대상 주문 선택: orderId 지정 시 본인 소유만 인정, 미지정 시 본인의 최신 결제 완료 리포트 */
export function resolveOrderForView<T extends EntitlementOrder>(orders: T[], identity: Identity, orderId?: string | null): T | null {
  const viewable = getViewableReportOrders(orders, identity);
  if (orderId) return viewable.find(o => o.orderId === orderId) || null;
  return viewable[0] || null;
}

/** 특정 상품(티어 판정은 호출자가 주입)을 이 사용자가 결제 완료했는지 */
export function hasEntitlement<T extends EntitlementOrder>(
  orders: T[],
  identity: Identity,
  matcher: (order: T) => boolean
): boolean {
  return getViewableReportOrders(orders, identity).some(matcher);
}
