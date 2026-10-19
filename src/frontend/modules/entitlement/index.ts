/**
 * [entitlement] 리포트 열람 권한 모듈 (단일 창구)
 *
 * - 결과 화면 접근 가능 여부, 마이페이지 [주문내역] 열람 대상 주문은 모두 여기서 결정한다.
 * - appState.setPaidUser 같은 전역 플래그에 의존하지 않는다.
 */
import { getAllStoreOrders } from '../../extensions/commerce-store/store-service.js';
import { getIdentity } from '../identity/index.js';
import { ReportRouterMapper } from '../checkout/report-router-mapper.js';
import {
  canViewOrder as _canViewOrder,
  getViewableReportOrders as _getViewable,
  hasEntitlement as _hasEntitlement,
  resolveOrderForView as _resolve,
} from './entitlement-core.js';

export * from './entitlement-core.js';

type StoreOrderLike = ReturnType<typeof getAllStoreOrders>[number];

/** 현재 로그인 회원이 열람 가능한(본인 + 결제 완료) 리포트 주문 */
export function getMyViewableReportOrders(): StoreOrderLike[] {
  return _getViewable(getAllStoreOrders() as any[], getIdentity()) as StoreOrderLike[];
}

export function canIViewOrder(orderId: string): boolean {
  return _canViewOrder(getAllStoreOrders() as any[], getIdentity(), orderId);
}

/** 열람할 주문 결정 (타인 주문/미결제/비로그인은 null) */
export function resolveMyOrderForView(orderId?: string | null): StoreOrderLike | null {
  return _resolve(getAllStoreOrders() as any[], getIdentity(), orderId) as StoreOrderLike | null;
}

/** 해당 티어(PAID/PREMIUM/...)의 리포트를 내가 결제했는지 */
export function hasMyEntitlementForTier(tier: string): boolean {
  return _hasEntitlement(getAllStoreOrders() as any[], getIdentity(), (o: any) =>
    ReportRouterMapper.resolveTier(o.productId, o.reportTier) === tier
  );
}

/**
 * 결과 화면 진입 단일 판정.
 * - FREE(무료 체험)는 누구나, 관리자는 미리보기 허용, 그 외는 본인 결제 완료 주문 필수.
 */
export function canViewTier(tier: string): boolean {
  if (tier === 'FREE') return true;
  if (getIdentity().role === 'admin') return true;
  return hasMyEntitlementForTier(tier);
}
