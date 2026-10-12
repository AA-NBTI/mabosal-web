/**
 * [Payment Module] 결제수단 선택 UI (스토어 주문서용)
 * - CSS :has() 로 선택 상태/계좌 안내 노출을 처리하므로 별도 JS 이벤트가 필요 없다.
 */
import { PaymentConfigStore } from './payment-config.js';
import { OFFICIAL_BANK_ACCOUNT } from '../../extensions/commerce-store/store-service.js';

export function renderPaymentMethodSelector(amount: number): string {
  const cfg = PaymentConfigStore.get();
  const cardOn = PaymentConfigStore.isCardEnabled(cfg);
  const testBadge = cfg.mode === 'toss_test'
    ? '<span style="font-size:0.66rem;background:rgba(96,165,250,0.2);color:#93c5fd;border:1px solid rgba(96,165,250,0.4);border-radius:4px;padding:0.05rem 0.35rem;margin-left:0.3rem;">TEST</span>'
    : '';

  return `
  <style>
    .pay-selector .pay-opt{background:var(--surface-container);border:1px solid rgba(255,255,255,0.12);padding:0.7rem;border-radius:8px;cursor:pointer;font-size:0.82rem;color:#94a3b8;display:flex;align-items:center;gap:0.4rem;transition:all .18s ease}
    .pay-selector .pay-opt:has(input:checked){border-color:var(--primary);background:rgba(242,202,80,0.12);color:#fff}
    .pay-selector .pay-opt.disabled{opacity:.45;cursor:not-allowed}
    .pay-selector .pay-bank-box{display:none}
    .pay-selector:has(input[value="bank_transfer"]:checked) .pay-bank-box{display:block}
  </style>
  <div class="pay-selector" id="pay-method-selector" style="margin-bottom:0;">
    <label style="font-size:0.76rem;color:var(--text-muted);display:block;margin-bottom:0.35rem;">결제 수단 · 결제 금액 ₩ ${amount.toLocaleString()}</label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.65rem;">
      <label class="pay-opt">
        <input type="radio" name="order-pay-method" value="bank_transfer" checked />
        무통장 입금
      </label>
      <label class="pay-opt ${cardOn ? '' : 'disabled'}">
        <input type="radio" name="order-pay-method" value="toss_card" ${cardOn ? '' : 'disabled'} />
        카드 · 간편결제${cardOn ? testBadge : ' (준비중)'}
      </label>
    </div>

    <div class="pay-bank-box" style="background:rgba(12,16,26,0.95);border:1px solid rgba(242,202,80,0.35);border-radius:10px;padding:0.85rem 1rem;">
      <div style="font-size:0.76rem;color:var(--primary);font-weight:700;margin-bottom:0.25rem;display:flex;align-items:center;gap:0.3rem;">
        <span class="material-symbols-outlined" style="font-size:15px;">account_balance</span>
        공식 입금 계좌 안내
      </div>
      <div style="font-size:0.95rem;font-weight:800;color:#fff;">
        ${OFFICIAL_BANK_ACCOUNT.bankName} <span style="color:var(--primary);">${OFFICIAL_BANK_ACCOUNT.accountNumber}</span>
      </div>
      <div style="font-size:0.8rem;color:#cbd5e1;margin-top:0.2rem;">예금주: <strong style="color:#fff;">${OFFICIAL_BANK_ACCOUNT.holder}</strong></div>
      <div style="font-size:0.72rem;color:#94a3b8;margin-top:0.35rem;line-height:1.4;">
        ※ 주문자명과 입금자명이 같아야 합니다. 주문 후 관리자가 입금을 확인하면 열람 권한이 부여됩니다. (그 전까지 주문은 '입금 확인 대기' 상태)
      </div>
    </div>

    ${cardOn ? `
    <div style="font-size:0.72rem;color:#94a3b8;line-height:1.4;margin-top:0.2rem;">
      신용·체크카드, 토스페이·카카오페이·네이버페이 등은 토스페이먼츠 결제창에서 선택합니다.
    </div>` : ''}
  </div>`;
}
