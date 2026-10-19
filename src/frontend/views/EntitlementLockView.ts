/**
 * [EntitlementLockView] 미결제/비로그인 상태에서 유료 리포트 화면 대신 보여주는 단일 잠금 화면
 * - 모든 유료 티어가 이 화면 하나를 공유한다 (티어별 개별 가드 누락 방지).
 */
import { ProductTierTab } from '../state/app-state.js';
import { ReportRouterMapper } from '../modules/checkout/report-router-mapper.js';
import { getIdentity } from '../modules/identity/index.js';

export function renderEntitlementLockView(tier: ProductTierTab): string {
  const me = getIdentity();
  const title = ReportRouterMapper.getReportTitle(tier);
  const message = me.isGuest
    ? '이 리포트는 로그인 후 결제하시면 마이페이지 [주문내역]에서 열람하실 수 있습니다.'
    : '이 리포트는 결제가 완료된 주문에서만 열람하실 수 있습니다. 마이페이지 [주문내역]에서 구매 내역을 확인해 주세요.';
  const primary = me.isGuest
    ? `<button type="button" class="btn-entitlement-login" id="btn-entitlement-login" style="width: 100%; padding: 1rem; border-radius: 10px; background: var(--primary); color: #1c1500; font-size: 1.02rem; font-weight: 800; border: none; cursor: pointer;">로그인 / 회원가입</button>`
    : `<button type="button" class="btn-select-product" id="btn-entitlement-buy" data-tier="${tier}" style="width: 100%; padding: 1rem; border-radius: 10px; background: var(--primary); color: #1c1500; font-size: 1.02rem; font-weight: 800; border: none; cursor: pointer;">구매하기</button>`;

  return `
    <div class="result-view-container entitlement-lock-view" data-entitlement-lock="${tier}" style="max-width: 580px; margin: 3rem auto; padding: 2rem 1.5rem; text-align: center;">
      <div style="background: rgba(14, 18, 28, 0.85); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 18px; padding: 3rem 1.5rem; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(242, 202, 80, 0.12); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: var(--primary);">
          <span class="material-symbols-outlined" style="font-size: 32px;">lock</span>
        </div>
        <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.6rem 0;">${title}</h2>
        <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 1.75rem 0;">${message}</p>
        ${primary}
      </div>
    </div>
  `;
}
