/**
 * [UserOrderHistoryWidget] 이용자 대시보드 전용 주문 & 결제 확인 위젯
 * 입금 대기 내역, 결제 완료 리포트 열람, 발급된 바우처 코드 보관함 제공
 */
import { AuthService } from '../../state/auth-service.js';
import { UserOrderService } from './user-order-service.js';
import { OFFICIAL_BANK_ACCOUNT } from '../../extensions/commerce-store/store-service.js';

export function renderUserOrderHistoryWidget(): string {
  const user = AuthService.getCurrentUser();
  if (user.role === 'guest') {
    return `
      <div style="background: var(--surface-container); border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 2rem; text-align: center; margin-bottom: 2rem;">
        <span class="material-symbols-outlined" style="font-size: 36px; color: var(--text-muted); margin-bottom: 0.5rem;">lock</span>
        <h3 style="font-size: 1.1rem; color: #fff; margin: 0 0 0.5rem 0;">로그인이 필요한 서비스입니다</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 1rem 0;">로그인하시면 나의 주문 내역, 입금 대기 현황, 구매한 감정서를 확인하실 수 있습니다.</p>
        <button type="button" id="btn-login-from-dashboard" style="background: var(--primary); color: #000; font-weight: 800; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer;">
          로그인 / 회원가입
        </button>
      </div>
    `;
  }

  // 로컬 동기화 기반 즉시 렌더링
  let userOrders: any[] = [];
  let userTransfers: any[] = [];
  try {
    const rawOrders = JSON.parse(localStorage.getItem('mabosal_store_orders') || '[]');
    userOrders = rawOrders.filter((o: any) => 
      o.userId === user.id || o.buyerEmail === user.email || o.buyerName === user.name
    );

    const rawTransfers = JSON.parse(localStorage.getItem('mabosal_bank_transfers') || '[]');
    userTransfers = rawTransfers.filter((t: any) =>
      t.depositorName === user.name || (t.orderId && userOrders.some(o => o.orderId === t.orderId))
    );
  } catch (e) {
    console.warn('[UserOrderHistoryWidget] local read error:', e);
  }

  const pendingTransfers = userTransfers.filter(t => t.status === 'pending');
  const completedOrders = userOrders.filter(o => o.status === 'completed');

  // 발급된 바우처 목록
  const issuedVouchers: any[] = [];
  userOrders.forEach(o => {
    if (o.status === 'completed' && (o.category === 'voucher' || o.deliveryType === 'voucher_code')) {
      let code = o.contentPayload || '';
      if (!code && o.accessUrl && o.accessUrl.includes('voucher=')) {
        code = o.accessUrl.split('voucher=')[1] || '';
      }
      const tr = userTransfers.find(t => t.orderId === o.orderId);
      if (!code && tr && tr.appliedCouponCode) code = tr.appliedCouponCode;
      
      if (code) {
        issuedVouchers.push({
          orderId: o.orderId,
          code,
          title: o.productTitle,
          amount: o.amount,
        });
      }
    }
  });

  return `
    <div class="user-order-history-widget" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.28); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: var(--shadow-sm);">
      
      <!-- 헤더 -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.85rem; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">receipt_long</span>
          <h2 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0;">나의 주문 &amp; 결제 내역</h2>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          총 주문 <strong style="color: var(--primary);">${userOrders.length}건</strong> (입금 대기 ${pendingTransfers.length}건 / 완료 ${completedOrders.length}건)
        </span>
      </div>

      <!-- 1. 무통장 입금 확인 대기 중인 주문 (있을 경우 최우선 노출) -->
      ${pendingTransfers.length > 0 ? `
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--primary); font-weight: 800; font-size: 0.88rem;">
              <span class="material-symbols-outlined" style="font-size: 18px;">hourglass_top</span>
              <span>입금 확인 대기 중인 주문 (${pendingTransfers.length}건)</span>
            </div>
            <span style="font-size: 0.75rem; background: rgba(242, 202, 80, 0.2); color: var(--primary); padding: 0.15rem 0.5rem; border-radius: 9999px; font-weight: 700;">
              관리자 확인 중
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${pendingTransfers.map(t => `
              <div style="background: rgba(0, 0, 0, 0.4); border-radius: 8px; padding: 0.85rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <div style="font-weight: 700; color: #fff; margin-bottom: 0.2rem;">${t.targetProduct}</div>
                  <div style="font-size: 0.78rem; color: #94a3b8;">
                    입금계좌: <strong style="color: #dfe2f1;">${OFFICIAL_BANK_ACCOUNT.bankName} ${OFFICIAL_BANK_ACCOUNT.accountNumber} (${OFFICIAL_BANK_ACCOUNT.holder})</strong>
                  </div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">
                    입금자명: <strong>${t.depositorName}</strong> | 주문번호: ${t.orderId || '-'}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary);">₩ ${t.requestedAmount.toLocaleString()}</div>
                  <span style="font-size: 0.7rem; color: #cbd5e1;">입금 완료 시 자동 승인됩니다</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 2. 구매한 상품권(바우처) 보관함 (있을 경우 노출) -->
      ${issuedVouchers.length > 0 ? `
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 12px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem; color: #818cf8; font-weight: 800; font-size: 0.88rem;">
              <span class="material-symbols-outlined" style="font-size: 18px;">card_giftcard</span>
              <span>보유 모바일 상품권 / 바우처 (${issuedVouchers.length}장)</span>
            </div>
            <span style="font-size: 0.72rem; color: #a5b4fc;">주문 결제 시 즉시 차감 사용 가능</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${issuedVouchers.map(v => `
              <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <div style="font-weight: 700; color: #fff; font-size: 0.88rem;">${v.title}</div>
                  <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.2rem;">
                    바우처 금액: <strong style="color: #818cf8;">₩ ${v.amount.toLocaleString()}</strong>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="text" readonly value="${v.code}" style="background: #1e293b; border: 1px solid #475569; color: #fff; font-family: monospace; font-size: 0.95rem; font-weight: 800; padding: 0.4rem 0.65rem; border-radius: 6px; width: 175px; text-align: center;" />
                  <button type="button" class="btn-copy-user-voucher" data-code="${v.code}" style="background: #6366f1; color: #fff; font-weight: 700; border: none; padding: 0.45rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                    복사
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 3. 전체 주문 내역 테이블/목록 -->
      ${userOrders.length === 0 ? `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size: 40px; color: rgba(255,255,255,0.2); margin-bottom: 0.5rem;">shopping_bag</span>
          <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">아직 주문하신 상품 내역이 없습니다.</p>
          <a href="/?view=store" style="display: inline-block; background: var(--primary); color: #000; font-weight: 800; padding: 0.55rem 1.15rem; border-radius: 8px; text-decoration: none; font-size: 0.85rem;">
            마보살 스토어 둘러보기 →
          </a>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${userOrders.map(o => `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.9rem 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.65rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                  <span style="font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 700; background: ${o.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(242, 202, 80, 0.15)'}; color: ${o.status === 'completed' ? '#4ade80' : 'var(--primary)'}; border: 1px solid ${o.status === 'completed' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(242, 202, 80, 0.3)'};">
                    ${o.status === 'completed' ? '결제완료' : '입금대기'}
                  </span>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">주문번호: ${o.orderId}</span>
                </div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #fff;">${o.productTitle}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                  결제수단: ${o.paymentMethod === 'bank_transfer' ? '무통장 입금' : '카드·간편결제'} | ₩ ${o.amount.toLocaleString()}
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${o.status === 'completed' && o.deliveryType === 'saju_report' ? `
                  <a href="/?view=report" style="background: var(--primary); color: #000; font-weight: 800; font-size: 0.8rem; padding: 0.45rem 0.9rem; border-radius: 6px; text-decoration: none;">
                    감정서 열람 →
                  </a>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}

    </div>
  `;
}

/**
 * 위젯 내부 이벤트 바인딩 (바우처 코드 복사 등)
 */
export function bindUserOrderHistoryEvents(container: HTMLElement): void {
  // 1. 바우처 복사 버튼
  container.querySelectorAll('.btn-copy-user-voucher').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = (e.currentTarget as HTMLElement).dataset.code;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          alert('바우처 코드가 복사되었습니다: ' + code);
        });
      }
    });
  });

  // 2. 로그인 모달 열기 버튼 (게스트 상태일 때)
  const loginBtn = container.querySelector('#btn-login-from-dashboard');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const modal = document.getElementById('modal-auth-container');
      if (modal) modal.style.display = 'flex';
    });
  }
}
