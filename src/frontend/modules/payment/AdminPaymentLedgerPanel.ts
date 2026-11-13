/**
 * [Payment Module] 독립 결제 확인 · 환불 관리 패널 (스토어 상품관리와 분리된 결제 전용 장부)
 */
import { getAllStoreOrders } from '../../extensions/commerce-store/store-service.js';

export type PaymentLedgerFilter = 'all' | 'completed' | 'pending' | 'refunded';

let ledgerFilter: PaymentLedgerFilter = 'all';
let ledgerSearch = '';

export function setPaymentLedgerFilter(filter: PaymentLedgerFilter): void {
  ledgerFilter = filter;
}

export function getPaymentLedgerFilter(): PaymentLedgerFilter {
  return ledgerFilter;
}

export function setPaymentLedgerSearch(query: string): void {
  ledgerSearch = query;
}

function esc(str: string | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMethodLabel(method: string): string {
  switch (method) {
    case 'bank_transfer':
      return '무통장 입금';
    case 'voucher':
      return '상품권/바우처';
    case 'portone_card':
    case 'toss_card':
    case 'card':
      return '카드 · 간편결제';
    case 'kakaopay':
      return '카카오페이';
    case 'tosspay':
      return '토스페이';
    default:
      return method || '기타';
  }
}

export function renderAdminPaymentLedgerPanel(): string {
  const allOrders = getAllStoreOrders();

  const completedOrders = allOrders.filter(o => o.status === 'completed');
  const pendingOrders = allOrders.filter(o => o.status === 'pending');
  const refundedOrders = allOrders.filter(o => o.status === 'refunded');
  const completedAmount = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  const q = ledgerSearch.trim().toLowerCase();
  const filtered = allOrders.filter(o => {
    if (ledgerFilter !== 'all' && o.status !== ledgerFilter) return false;
    if (q) {
      const hay = [
        o.orderId,
        o.paymentKey,
        o.buyerName,
        o.buyerPhone,
        o.buyerEmail,
        o.productTitle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const filterButtons: { id: PaymentLedgerFilter; label: string; count: number }[] = [
    { id: 'all', label: '전체', count: allOrders.length },
    { id: 'completed', label: '결제완료', count: completedOrders.length },
    { id: 'pending', label: '입금대기', count: pendingOrders.length },
    { id: 'refunded', label: '환불완료', count: refundedOrders.length },
  ];

  return `
  <div style="display: flex; flex-direction: column; gap: 1.25rem;">
    <!-- 상단 요약 KPI -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.9rem;">
      <div style="background: rgba(20,24,35,0.75); border: 1px solid rgba(242,202,80,0.25); border-radius: 12px; padding: 1rem;">
        <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700;">결제완료 누적</div>
        <div style="font-size: 1.35rem; font-weight: 900; color: #4ade80; margin-top: 0.25rem;">
          ₩ ${completedAmount.toLocaleString()}
          <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">(${completedOrders.length}건)</span>
        </div>
      </div>
      <div style="background: rgba(20,24,35,0.75); border: 1px solid rgba(242,202,80,0.25); border-radius: 12px; padding: 1rem;">
        <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700;">입금 확인 대기</div>
        <div style="font-size: 1.35rem; font-weight: 900; color: #f2ca50; margin-top: 0.25rem;">${pendingOrders.length}<span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.2rem;">건</span></div>
      </div>
      <div style="background: rgba(20,24,35,0.75); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 1rem;">
        <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700;">환불 · 취소 완료</div>
        <div style="font-size: 1.35rem; font-weight: 900; color: #f87171; margin-top: 0.25rem;">${refundedOrders.length}<span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.2rem;">건</span></div>
      </div>
    </div>

    <!-- 결제 내역 & 환불 테이블 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.35rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.9rem;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 22px;">receipt_long</span>
            결제 내역 · 환불 관리
          </h3>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0.25rem 0 0 0;">
            포트원(KG이니시스) 카드결제·무통장 주문 내역을 바로 조회하고, 포트원 실시간 검증 및 환불(카드 취소)을 실행합니다.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" id="btn-refresh-payment-ledger" style="background: rgba(242,202,80,0.14); border: 1px solid rgba(242,202,80,0.35); color: var(--primary); font-size: 0.78rem; font-weight: 700; padding: 0.42rem 0.8rem; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px;">refresh</span>
            DB · 포트원 동기화
          </button>
          <a href="https://admin.portone.io" target="_blank" rel="noopener noreferrer" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; font-size: 0.78rem; font-weight: 700; padding: 0.42rem 0.8rem; border-radius: 7px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem;">
            포트원 콘솔 ↗
          </a>
        </div>
      </div>

      <!-- 필터 & 검색 -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${filterButtons.map(btn => {
            const active = ledgerFilter === btn.id;
            return `<button type="button" class="btn-payment-ledger-filter" data-filter="${btn.id}" style="background: ${active ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${active ? '#1c1500' : '#cbd5e1'}; border: 1px solid ${active ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; font-size: 0.76rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 999px; cursor: pointer;">${btn.label} (${btn.count})</button>`;
          }).join('')}
        </div>
        <input type="text" id="input-payment-ledger-search" value="${esc(ledgerSearch)}" placeholder="주문번호 · 구매자 · 상품명 · 결제키 검색" style="min-width: 240px; flex: 1; max-width: 320px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 7px; padding: 0.42rem 0.7rem; color: #fff; font-size: 0.8rem;" />
      </div>

      <!-- 테이블 -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.81rem; color: #dfe2f1;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
              <th style="padding: 0.6rem;">주문번호 / 결제키</th>
              <th style="padding: 0.6rem;">구매자</th>
              <th style="padding: 0.6rem;">상품명</th>
              <th style="padding: 0.6rem;">금액</th>
              <th style="padding: 0.6rem;">수단</th>
              <th style="padding: 0.6rem;">결제 일시</th>
              <th style="padding: 0.6rem;">상태 / 환불 · 검증</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">조건에 맞는 결제 내역이 없습니다.</td></tr>
            ` : filtered.map(o => {
              const isPg = o.paymentMethod !== 'bank_transfer' && o.paymentMethod !== 'voucher' && (o.amount || 0) > 0;
              const pgKey = o.paymentKey || o.orderId;
              return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <td style="padding: 0.6rem; font-family: monospace; font-size: 0.76rem;">
                    <div style="color: #fff; font-weight: 700;">${esc(o.orderId)}</div>
                    ${o.paymentKey && o.paymentKey !== o.orderId ? `<div style="color: #94a3b8; font-size: 0.7rem;">PG: ${esc(o.paymentKey)}</div>` : ''}
                  </td>
                  <td style="padding: 0.6rem;">
                    <div style="font-weight: 700; color: #fff;">${esc(o.buyerName)}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8;">${esc(o.buyerPhone)}</div>
                  </td>
                  <td style="padding: 0.6rem;">${esc(o.productTitle)}</td>
                  <td style="padding: 0.6rem; color: var(--primary); font-weight: 800;">₩ ${(o.amount || 0).toLocaleString()}</td>
                  <td style="padding: 0.6rem; font-size: 0.76rem;">${esc(formatMethodLabel(o.paymentMethod))}</td>
                  <td style="padding: 0.6rem; color: var(--text-muted); font-size: 0.74rem;">${new Date(o.paidAt).toLocaleString()}</td>
                  <td style="padding: 0.6rem;">
                    ${o.status === 'refunded' ? `
                      <div style="display: flex; flex-direction: column; gap: 0.15rem; align-items: flex-start;">
                        <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700;">환불완료</span>
                        ${o.refundedAt ? `<span style="font-size: 0.68rem; color: #94a3b8;">취소: ${new Date(o.refundedAt).toLocaleString()}</span>` : ''}
                      </div>
                    ` : (o.refundRequested ? `
                      <button type="button" class="btn-admin-approve-refund" data-order-id="${esc(o.orderId)}" style="background: #ef4444; color: #fff; font-size: 0.72rem; font-weight: 800; border: none; border-radius: 6px; padding: 0.3rem 0.6rem; cursor: pointer;" title="사유: ${esc(o.refundReason || '')}">
                        환불 승인 (${esc(o.refundReason || '요청')})
                      </button>
                    ` : (o.status === 'pending' ? `
                      <div style="display: inline-flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                        <span style="background: rgba(242, 202, 80, 0.18); color: #f2ca50; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; border: 1px solid rgba(242, 202, 80, 0.35);">입금대기</span>
                        <button type="button" class="btn-admin-approve-bank-deposit" data-order-id="${esc(o.orderId)}" style="background: var(--primary); color: #000; font-size: 0.72rem; font-weight: 800; border: none; border-radius: 4px; padding: 0.25rem 0.55rem; cursor: pointer;">
                          입금 승인
                        </button>
                      </div>
                    ` : `
                      <div style="display: inline-flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                        <span style="background: rgba(52,211,153,0.15); color: #4ade80; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">결제완료</span>
                        ${isPg ? `<button type="button" class="btn-admin-verify-portone" data-payment-id="${esc(pgKey)}" style="background: rgba(56,189,248,0.15); color: #7dd3fc; font-size: 0.71rem; font-weight: 700; border: 1px solid rgba(56,189,248,0.35); border-radius: 4px; padding: 0.2rem 0.45rem; cursor: pointer;">포트원 확인</button>` : ''}
                        <button type="button" class="btn-admin-approve-refund" data-order-id="${esc(o.orderId)}" style="background: rgba(239, 68, 68, 0.18); color: #fca5a5; font-size: 0.71rem; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 4px; padding: 0.2rem 0.5rem; cursor: pointer;">
                          결제취소
                        </button>
                      </div>
                    `))}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

