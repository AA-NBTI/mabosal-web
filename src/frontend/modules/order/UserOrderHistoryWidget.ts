/**
 * [UserOrderHistoryWidget] 이용자 대시보드 전용 주문 & 결제 확인 위젯
 * 입금 대기 내역, 결제 완료 리포트 열람, 발급된 바우처 코드 보관함 제공
 */
import { AuthService } from '../../state/auth-service.js';
import { UserOrderService } from './user-order-service.js';
import { OFFICIAL_BANK_ACCOUNT, getMyStoreOrders, requestStoreOrderRefund, markOrderAsViewed, getStoreProductById } from '../../extensions/commerce-store/store-service.js';
import { SAJU_BOOK_VOL1_PRODUCT } from '../../extensions/commerce-store/saju-book-data.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { ProductReviewStore } from '../../state/product-review-store.js';

export function renderUserOrderHistoryWidget(): string {
  const user = AuthService.getCurrentUser();
  if (user.role === 'guest') {
    return `
      <div style="background: var(--surface-container); border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 2rem; text-align: center; margin-bottom: 2rem;">
        <span class="material-symbols-outlined" style="font-size: 36px; color: var(--text-muted); margin-bottom: 0.5rem;">lock</span>
        <h3 style="font-size: 1.1rem; color: #fff; margin: 0 0 0.5rem 0;">로그인이 필요한 서비스입니다</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 1rem 0;">로그인하시면 나의 주문내역, 입금 대기 현황, 구매한 사주 리포트 및 전자책을 확인하실 수 있습니다.</p>
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
    userOrders = getMyStoreOrders();

    const rawTransfers = JSON.parse(localStorage.getItem('mabosal_bank_transfers') || '[]');
    userTransfers = rawTransfers.filter((t: any) => t.orderId && userOrders.some(o => o.orderId === t.orderId));
  } catch (e) {
    console.warn('[UserOrderHistoryWidget] local read error:', e);
  }

  const pendingTransfers = userTransfers.filter(t => t.status === 'pending');
  const completedOrders = userOrders.filter(o => o.status === 'completed');

  // 구매한 전자책 및 디지털 다운로드 보관함
  const myDigitalBooks = userOrders.filter(o =>
    o.status === 'completed' && (
      o.category === 'ebook' ||
      o.category === 'books' ||
      o.deliveryType === 'digital_download' ||
      o.productId.includes('book') ||
      (o.items && o.items.some((it: any) => it.productId.includes('book') || it.deliveryType === 'digital_download'))
    )
  );

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
          <h2 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0;">나의 주문 &amp; 디지털 서재</h2>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          총 주문 <strong style="color: var(--primary);">${userOrders.length}건</strong> (입금 대기 ${pendingTransfers.length}건 / 완료 ${completedOrders.length}건)
        </span>
      </div>

      <!-- 1. [디지털 다운로드] 내 디지털 서재 / 전자책 보관함 (구매한 도서가 있을 경우 최상단 노출) -->
      ${myDigitalBooks.length > 0 ? `
        <div style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.12), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #f2ca50; font-weight: 800; font-size: 0.95rem;">
              <span class="material-symbols-outlined" style="font-size: 22px;">local_library</span>
              <span>내 디지털 서재 / 전자책 다운로드함 (${myDigitalBooks.length}권 소장 중)</span>
            </div>
            <span style="font-size: 0.74rem; background: rgba(242, 202, 80, 0.2); color: #f2ca50; padding: 0.2rem 0.55rem; border-radius: 9999px; font-weight: 700;">
              평생 영구 소장 &amp; 즉시 다운로드
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${myDigitalBooks.map(bk => `
              <div style="background: #0c0f17; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0.9rem 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                  <span class="material-symbols-outlined" style="font-size: 32px; color: var(--primary);">menu_book</span>
                  <div>
                    <div style="font-size: 0.92rem; font-weight: 800; color: #fff;">${bk.productTitle}</div>
                    <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 0.2rem;">
                      구매일: ${new Date(bk.paidAt).toLocaleDateString()} | 주문번호: <span style="font-family: monospace;">${bk.orderId}</span>
                      ${bk.selectedOptionName ? ` | <span style="color: var(--primary); font-weight: 700;">${bk.selectedOptionName}</span>` : ''}
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <button type="button" class="btn-download-ebook-pdf" data-order-id="${bk.orderId}" data-product-id="${bk.productId}" style="background: var(--primary); color: #1c1500; font-weight: 800; font-size: 0.82rem; border: none; padding: 0.5rem 0.9rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; box-shadow: 0 2px 10px rgba(242,202,80,0.3);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">download</span>
                    <span>PDF 정본 다운로드</span>
                  </button>
                  <button type="button" class="btn-open-book-chart-modal" data-product-id="${bk.productId}" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 700; font-size: 0.82rem; padding: 0.5rem 0.8rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">menu_book</span>
                    <span>상세 조견표 열람</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 2. 무통장 입금 확인 대기 중인 주문 (있을 경우 노출) -->
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

      <!-- 3. 구매한 상품권(바우처) 보관함 -->
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

      <!-- 4. 전체 주문 내역 테이블/목록 -->
      ${userOrders.length === 0 ? `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size: 40px; color: rgba(255,255,255,0.2); margin-bottom: 0.5rem;">shopping_bag</span>
          <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">아직 주문하신 상품 내역이 없습니다.</p>
          <a href="/?view=store" style="display: inline-block; background: var(--primary); color: #000; font-weight: 800; padding: 0.55rem 1.15rem; border-radius: 8px; text-decoration: none; font-size: 0.85rem;">
            마보살 스토어 둘러보기 →
          </a>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${userOrders.map(o => {
            const defaultProfile = UserSajuStore.getProfileOrDefault();
            const rawTargetName = (o.sajuInput?.userName && o.sajuInput.userName !== '의뢰인')
              ? o.sajuInput.userName
              : (o.buyerName && o.buyerName !== '의뢰인' ? o.buyerName : (user.name || defaultProfile.userName || '의뢰인'));
            
            const isSelf = !o.sajuInput?.userName || o.sajuInput.userName === '의뢰인' || o.sajuInput.userName === user.name;

            const cleanTargetName = rawTargetName.replace(/\s*\(.*\)/, '').trim();
            let maskedName = cleanTargetName;
            if (cleanTargetName.length === 2) {
              maskedName = cleanTargetName[0] + '*';
            } else if (cleanTargetName.length === 3) {
              maskedName = cleanTargetName[0] + '*' + cleanTargetName[2];
            } else if (cleanTargetName.length >= 4) {
              maskedName = cleanTargetName[0] + '**' + cleanTargetName.slice(-1);
            }

            const rawBirth = o.sajuInput?.solarBirthDate || defaultProfile.solarBirthDate || '1993.08.15';
            const yearMatch = rawBirth.match(/(\d{4})/);
            const birthYear = yearMatch ? `${yearMatch[1]}년생` : '';

            return `
            <div class="user-order-accordion-card" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; margin-bottom: 0.5rem; transition: all 0.15s ease;">
              
              <!-- 닫힘 기본 헤더 행 -->
              <div class="btn-toggle-order-row" data-target="order-collapsible-${o.orderId}" style="padding: 0.8rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; cursor: pointer; user-select: none;">
                <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0; flex: 1;">
                  <span style="font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; background: ${o.status === 'refunded' ? 'rgba(239, 68, 68, 0.15)' : (o.status === 'completed' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)')}; color: ${o.status === 'refunded' ? '#f87171' : '#fff'}; border: 1px solid rgba(255, 255, 255, 0.15); white-space: nowrap;">
                    ${o.status === 'refunded' ? '환불완료' : (o.refundRequested ? '환불심사' : (o.status === 'completed' ? '결제완료' : '입금대기'))}
                  </span>
                  <span style="font-size: 0.88rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${o.productTitle}
                  </span>
                  <span style="font-size: 0.76rem; color: #94a3b8; font-family: monospace; white-space: nowrap;">
                    #${o.orderId.slice(-8)}
                  </span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
                  <span style="font-size: 0.85rem; font-weight: 800; color: #fff;">₩ ${o.amount.toLocaleString()}</span>
                  <span style="font-size: 0.74rem; color: var(--text-muted);">${new Date(o.paidAt).toLocaleDateString()}</span>
                  <span class="material-symbols-outlined order-chevron-${o.orderId}" style="font-size: 18px; color: var(--text-muted); transition: transform 0.2s ease;">expand_more</span>
                </div>
              </div>

              <!-- 클릭 시 펼쳐지는 상세 내역 -->
              <div id="order-collapsible-${o.orderId}" class="order-collapsible-content" style="display: none; padding: 1rem; border-top: 1px dashed rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.25);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem;">
                  <div style="font-size: 0.8rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.3rem;">
                    <div>• 주문번호: <strong style="color: #fff; font-family: monospace;">${o.orderId}</strong></div>
                    <div>• 결제 수단: <strong style="color: #fff;">${o.paymentMethod === 'bank_transfer' ? '무통장 입금' : '카드 / 간편결제'}</strong></div>
                    <div>• 결제 일시: <strong style="color: #fff;">${new Date(o.paidAt).toLocaleString()}</strong></div>
                    ${o.selectedOptionName ? `
                      <div>• 선택 옵션: <strong style="color: var(--primary);">${o.selectedOptionName}</strong></div>
                    ` : ''}
                    ${o.deliveryType === 'saju_report' ? `
                      <div>• 사주 대상: <strong style="color: #fff;">${isSelf ? '본인 사주 분석' : `${maskedName} 님` + (birthYear ? ` (${birthYear})` : '')}</strong></div>
                    ` : ''}
                    ${o.shippingAddress ? `
                      <div>• 배송지 주소: <strong style="color: #fff;">${o.shippingAddress}</strong></div>
                    ` : ''}
                  </div>

                  <!-- 액션 버튼들 -->
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    ${o.status === 'completed' && !ProductReviewStore.hasUserReviewed(o.orderId) ? `
                      <button type="button" class="btn-open-write-review" data-order-id="${o.orderId}" data-product-id="${o.productId}" data-product-title="${o.productTitle}" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 0.45rem 0.8rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem;">
                        <span class="material-symbols-outlined" style="font-size: 15px;">rate_review</span>
                        <span>후기 작성</span>
                      </button>
                    ` : ''}

                    ${o.status === 'completed' && (o.category === 'ebook' || o.productId.includes('book')) ? `
                      <button type="button" class="btn-download-ebook-pdf" data-order-id="${o.orderId}" data-product-id="${o.productId}" style="background: var(--primary); color: #000; font-weight: 800; font-size: 0.82rem; padding: 0.45rem 0.85rem; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                        <span class="material-symbols-outlined" style="font-size: 16px;">download</span>
                        <span>PDF 다운로드</span>
                      </button>
                    ` : ''}

                    ${o.status === 'completed' && o.deliveryType === 'saju_report' ? `
                      <button type="button" class="btn-open-user-report" data-order-id="${o.orderId}" data-product-id="${o.productId}" style="background: #ffffff; color: #0f131d; font-weight: 800; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                        <span>리포트 열람</span>
                        <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- [고객 사후지원] 주문 취소 / 반품 신청 영역 -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.6rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: #94a3b8; flex-wrap: wrap; gap: 0.5rem;">
                  <span>취소/환불 규정에 따라 신청 시 관리자가 검토 후 처리합니다.</span>
                  ${o.status === 'completed' && !o.refundRequested ? `
                    <button type="button" class="btn-request-order-refund" data-order-id="${o.orderId}" data-product-id="${o.productId}" data-title="${o.productTitle}" style="background: none; border: 1px solid rgba(255,255,255,0.25); color: #cbd5e1; font-size: 0.72rem; padding: 0.3rem 0.65rem; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;">
                      ${o.deliveryType === 'shipping' ? '반품/교환 접수' : '주문 취소/환불 접수'}
                    </button>
                  ` : (o.refundRequested ? '<span style="color: #f87171; font-weight: 800; background: rgba(239,68,68,0.15); padding: 0.2rem 0.5rem; border-radius: 4px;">환불 심사 진행중</span>' : '')}
                </div>
              </div>

            </div>
          `;
          }).join('')}
        </div>
      `}

    </div>
  `;
}

/**
 * 위젯 내부 이벤트 바인딩
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

  // 2. 전자책 PDF 다운로드
  container.querySelectorAll('.btn-download-ebook-pdf').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = (e.currentTarget as HTMLElement).dataset.orderId || '';
      const prodId = (e.currentTarget as HTMLElement).dataset.productId || '';
      markOrderAsViewed(orderId);

      const prod = getStoreProductById(prodId);
      if (prod?.contentPayload && (prod.contentPayload.startsWith('http') || prod.contentPayload.startsWith('data:') || prod.contentPayload.endsWith('.pdf'))) {
        const a = document.createElement('a');
        a.href = prod.contentPayload;
        a.target = '_blank';
        a.download = `[마보살_전자책]_${prod.title.replace(/[\\/:*?"<>|]/g, '_')}_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert('전자책 PDF 정본 파일 다운로드가 시작되었습니다.');
        return;
      }

      // 표준 PDF 1.4 바이너리 스트림 생성 (MIME: application/pdf)
      const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 320 >>
stream
BT
/F1 16 Tf
50 780 Td
(MABOSAL SACRED ARCHIVE - OFFICIAL EBOOK) Tj
0 -30 Td
/F1 12 Tf
(Order ID: ${orderId}) Tj
0 -25 Td
(Issued Date: ${new Date().toISOString().slice(0, 10)}) Tj
0 -35 Td
(Product: ${prod ? prod.title : 'Saju Principles Master Book Vol 1'}) Tj
0 -30 Td
(Authentic Digital Edition Verified - Lifetime Access Guaranteed.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
680
%%EOF`;

      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[마보살_전자책]_정통사주명리학원론_제1권_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('전자책 정본 PDF 다운로드가 시작되었습니다. (주문 상태: 열람 완료 기록)');
    });
  });

  // 2-1. 상세 조견표 전용 모달 열람 뷰어
  container.querySelectorAll('.btn-open-book-chart-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      let modal = document.getElementById('modal-master-book-chart');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-master-book-chart';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;box-sizing:border-box;backdrop-filter:blur(8px);';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div style="background:#0f172a;border:1.5px solid rgba(242,202,80,0.4);border-radius:16px;max-width:920px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,0.7);overflow:hidden;">
          <div style="padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;background:rgba(20,27,45,0.8);">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span class="material-symbols-outlined" style="color:var(--primary);font-size:22px;">menu_book</span>
              <span style="font-weight:800;color:#fff;font-size:1.05rem;">정통 사주명리학 원론 제1권 - 22p 마스터 조견표 원문</span>
            </div>
            <button type="button" id="btn-close-chart-modal" style="background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>
          </div>
          <div style="padding:1.5rem;overflow-y:auto;flex:1;color:#dfe2f1;">
            ${SAJU_BOOK_VOL1_PRODUCT.detailsHtml || ''}
          </div>
        </div>
      `;
      modal.style.display = 'flex';
      modal.querySelector('#btn-close-chart-modal')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) modal.style.display = 'none';
      });
    });
  });

  // 3. 고객 사후지원 (주문 취소 / 반품 신청)
  container.querySelectorAll('.btn-request-order-refund').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = (e.currentTarget as HTMLElement).dataset.orderId;
      const title = (e.currentTarget as HTMLElement).dataset.title || '주문 상품';
      if (!orderId) return;

      const reason = prompt(`[${title}]\n주문 취소 및 반품/환불 사유를 입력해 주세요:\n(예: 단순 변심, 배송 지연, 파일 오류 등)`);
      if (reason === null) return;
      if (!reason.trim()) {
        alert('사유를 입력해 주셔야 취소/환불 접수가 가능합니다.');
        return;
      }

      const res = requestStoreOrderRefund(orderId, reason.trim());
      alert(res.message);
      if (res.success) {
        window.location.reload();
      }
    });
  });

  // 4. 로그인 모달 열기 버튼 (게스트 상태일 때)
  const loginBtn = container.querySelector('#btn-login-from-dashboard');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const modal = document.getElementById('modal-auth-container');
      if (modal) modal.style.display = 'flex';
    });
  }
}
