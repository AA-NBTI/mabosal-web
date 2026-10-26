/**
 * CheckoutBoardView - 마보살 정식 쇼핑몰 주문서 작성 & 결제 보드 뷰
 */
import { CartStore } from '../cart/cart-store.js';
import { AuthService } from '../../state/auth-service.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { VoucherStore } from '../voucher/voucher-store.js';
import { UserAddressStore } from '../../state/user-address-store.js';
import { PaymentConfigStore } from '../payment/payment-config.js';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderCheckoutBoardView(): string {
  const currentUser = AuthService.getCurrentUser();
  if (currentUser.role === 'guest') {
    return `
      <div class="checkout-board-view" style="max-width: 900px; margin: 0 auto; padding: 3rem 1rem 5rem 1rem; text-align: center;">
        <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 18px; padding: 4rem 1.5rem;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
            <span class="material-symbols-outlined" style="font-size: 36px; color: var(--primary);">lock</span>
          </div>
          <h2 style="font-size: 1.35rem; color: #fff; margin: 0 0 0.5rem 0;">로그인이 필요한 서비스입니다</h2>
          <p style="font-size: 0.9rem; color: #94a3b8; margin: 0 0 1.75rem 0; line-height: 1.6;">
            주문서 작성 및 결제는 안전한 리포트 확인 및 주문내역 보관을 위해 회원 로그인 후 진행 가능합니다.<br/>로그인하시거나 간편 회원가입 후 이용해 주세요.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button type="button" class="btn-checkout-trigger-login" id="btn-checkout-login-prompt" style="background: var(--primary); color: #0f131d; border: none; border-radius: 10px; padding: 0.85rem 2rem; font-size: 0.95rem; font-weight: 800; cursor: pointer;">
              로그인하기 →
            </button>
            <button type="button" class="btn-goto-store" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; border-radius: 10px; padding: 0.85rem 1.5rem; font-size: 0.95rem; cursor: pointer;">
              스토어로 돌아가기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const selectedItems = CartStore.getSelectedItems();
  const summary = CartStore.getSummary();
  const defaultProfile = UserSajuStore.getProfileOrDefault();
  const primaryItem = selectedItems[0];
  const availableCoupons = VoucherStore.getEnabledCouponsForProduct(primaryItem?.productId);

  // 만약 장바구니에 선택된 상품이 없으면 안내
  if (selectedItems.length === 0) {
    return `
      <div class="checkout-board-view" style="max-width: 900px; margin: 0 auto; padding: 3rem 1rem 5rem 1rem; text-align: center;">
        <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 18px; padding: 3.5rem 1.5rem;">
          <span class="material-symbols-outlined" style="font-size: 48px; color: var(--primary); margin-bottom: 1rem;">shopping_bag</span>
          <h2 style="font-size: 1.3rem; color: #fff; margin: 0 0 0.5rem 0;">주문할 상품이 선택되지 않았습니다</h2>
          <p style="font-size: 0.9rem; color: #94a3b8; margin: 0 0 1.5rem 0;">장바구니에서 주문하실 상품을 먼저 선택해 주세요.</p>
          <button type="button" class="btn-goto-cart" style="background: var(--primary); color: #000; border: none; border-radius: 8px; padding: 0.75rem 1.75rem; font-weight: 800; cursor: pointer;">
            장바구니로 돌아가기 →
          </button>
        </div>
      </div>
    `;
  }

  const buyerName = currentUser.name || defaultProfile.userName;
  const buyerPhone = currentUser.phone || '010-0000-0000';
  const buyerEmail = currentUser.email || 'user@mabosal.com';

  return `
    <div class="checkout-board-view" style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem 6rem 1rem;">
      
      <!-- 상단 헤더 & 스텝 인디케이터 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">HOME &gt; STORE &gt; CART &gt; CHECKOUT</span>
          <h1 style="font-size: 1.65rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 28px;">check_circle</span>
            주문서 작성 및 결제
          </h1>
        </div>

        <!-- 3단계 프로세스 바 -->
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.82rem; font-weight: 700;">
          <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
            <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">1</span>
            장바구니
          </span>
          <span style="color: rgba(255,255,255,0.3);">&gt;</span>
          <span style="color: var(--primary); display: flex; align-items: center; gap: 0.3rem;">
            <span style="background: var(--primary); color: #000; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">2</span>
            주문서 작성/결제
          </span>
          <span style="color: rgba(255,255,255,0.3);">&gt;</span>
          <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
            <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">3</span>
            결제 완료
          </span>
        </div>
      </div>

      <form id="checkout-main-form">
        <!-- 2컬럼 레이아웃: 좌측 상세 입력 폼 + 우측 최종 결제 패널 -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; align-items: start;" class="checkout-grid">
          <style>
            @media (min-width: 900px) {
              .checkout-grid {
                grid-template-columns: 1fr 380px !important;
              }
            }
          </style>

          <!-- 좌측: 입력 블록들 -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- 1. 주문 상품 확인 블록 -->
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; display: flex; justify-content: space-between; align-items: center;">
                <span style="display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">inventory_2</span>
                  주문 상품 목록 (${selectedItems.length}종)
                </span>
                <span style="font-size: 0.75rem; color: #94a3b8;">(주문서에서 수량 변경 가능)</span>
              </h2>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${selectedItems.map(it => `
                  <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                      <div style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem;">
                        ${esc(it.title)}
                      </div>
                      ${it.selectedOptionName ? `
                        <div style="font-size: 0.78rem; color: var(--primary); margin-bottom: 0.2rem; font-weight: 700;">
                          [선택 옵션] ${esc(it.selectedOptionName)}
                        </div>
                      ` : ''}
                      <div style="font-size: 0.78rem; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span>단가: ₩ ${it.price.toLocaleString()}</span>
                        ${it.sajuSnapshot ? `
                          <span>•</span>
                          <span style="color: var(--primary);">사주 대상: ${esc(it.sajuSnapshot.userName || '의뢰인')} (${it.sajuSnapshot.solarBirthDate})</span>
                        ` : ''}
                      </div>
                    </div>

                    <!-- 수량 실시간 조절 컨트롤러 -->
                    <div style="display: inline-flex; align-items: center; gap: 0.75rem;">
                      <div style="display: inline-flex; align-items: center; border: 1px solid rgba(255,255,255,0.18); border-radius: 6px; overflow: hidden; background: #0c0f17;">
                        <button type="button" class="btn-checkout-qty-minus" data-cart-id="${esc(it.id)}" style="background: transparent; border: none; color: #cbd5e1; width: 28px; height: 26px; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;">-</button>
                        <span style="font-size: 0.85rem; font-weight: 800; color: #fff; width: 30px; text-align: center;">${it.quantity}</span>
                        <button type="button" class="btn-checkout-qty-plus" data-cart-id="${esc(it.id)}" style="background: transparent; border: none; color: #cbd5e1; width: 28px; height: 26px; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;">+</button>
                      </div>

                      <strong style="font-size: 1.05rem; color: #f2ca50; font-family: var(--font-display); min-width: 90px; text-align: right;">
                        ₩ ${(it.price * it.quantity).toLocaleString()}
                      </strong>

                      <button type="button" class="btn-checkout-remove-item" data-cart-id="${esc(it.id)}" title="항목 삭제" style="background: transparent; border: none; color: #64748b; font-size: 1.1rem; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px;">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 2. 주문자 정보 블록 (수정 가능) -->
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1.25rem 0; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">badge</span>
                  주문자 정보
                </span>
                <span style="font-size: 0.75rem; color: #94a3b8;">(주문 시 수정 가능)</span>
              </h2>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                <div>
                  <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 700;">
                    성함 <span style="color: var(--primary);">*</span>
                  </label>
                  <input type="text" id="checkout-buyer-name" value="${esc(buyerName)}" required placeholder="주문자 성명" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.7rem; color: #fff; font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 700;">
                    연락처 (휴대폰) <span style="color: var(--primary);">*</span>
                  </label>
                  <input type="tel" id="checkout-buyer-phone" value="${esc(buyerPhone)}" required placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.7rem; color: #fff; font-size: 0.9rem;" />
                </div>
                <div style="grid-column: 1 / -1;">
                  <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 700;">
                    이메일 (전자 영수증 및 주문 안내 발송) <span style="color: var(--primary);">*</span>
                  </label>
                  <input type="email" id="checkout-buyer-email" value="${esc(buyerEmail)}" required placeholder="example@email.com" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.7rem; color: #fff; font-size: 0.9rem;" />
                </div>
              </div>
            </div>

            <!-- 3. 배송지 주소 및 수령 정보 블록 (언제든 수정 가능 & 회원 주소록 연동) -->
            <div style="background: var(--surface-container); border: 1px solid ${summary.hasPhysicalItems ? 'rgba(242, 202, 80, 0.4)' : 'rgba(255,255,255,0.1)'}; border-radius: 16px; padding: 1.5rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                <span style="display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">local_shipping</span>
                  배송지 주소 / 수령 정보
                </span>
                <label style="font-size: 0.8rem; color: #cbd5e1; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; font-weight: normal;">
                  <input type="checkbox" id="check-same-as-buyer" checked />
                  주문자 정보와 동일
                </label>
              </h2>

              ${(currentUser.role as string) !== 'guest' ? (() => {
                const addresses = UserAddressStore.getAddresses();
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                return `
                  <!-- 회원 등록 배송지 주소록 선택 바 -->
                  <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(242, 202, 80, 0.3); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: #cbd5e1;">
                      <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">bookmark</span>
                      <span>회원 배송지 불러오기:</span>
                    </div>
                    <select id="select-saved-address" style="background: #0c0f17; border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.82rem; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer; max-width: 320px;">
                      ${addresses.map(a => `
                        <option value="${a.id}" data-recipient="${esc(a.recipientName)}" data-phone="${esc(a.recipientPhone)}" data-address="${esc(a.address + (a.detailAddress ? ' ' + a.detailAddress : ''))}" data-memo="${esc(a.deliveryMemo || '')}" ${a.isDefault ? 'selected' : ''}>
                          ${a.isDefault ? '[기본] ' : ''}${esc(a.recipientName)} (${esc(a.address.slice(0, 16))}...)
                        </option>
                      `).join('')}
                      <option value="new">+ 신규 주소 직접 입력</option>
                    </select>
                  </div>
                `;
              })() : ''}

              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div>
                    <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.3rem;">수령인 성명</label>
                    <input type="text" id="checkout-receiver-name" value="${esc(buyerName)}" placeholder="수령인 성명" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem; color: #fff; font-size: 0.88rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.3rem;">수령인 연락처</label>
                    <input type="tel" id="checkout-receiver-phone" value="${esc(buyerPhone)}" placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem; color: #fff; font-size: 0.88rem;" />
                  </div>
                </div>

                <div>
                  <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 700;">
                    배송받으실 주소 (도로명 / 지번 및 상세 동/호수)
                  </label>
                  <input type="text" id="checkout-shipping-address" placeholder="예: 서울시 강남구 테헤란로 152, 강남파이낸스센터 12층" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.7rem; color: #fff; font-size: 0.9rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.3rem;">배송 시 요청사항 (선택)</label>
                  <input type="text" id="checkout-shipping-memo" placeholder="예: 부재 시 문 앞에 놓아주세요." style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem; color: #fff; font-size: 0.88rem;" />
                </div>

                ${(currentUser.role as any) !== 'guest' ? `
                  <div style="margin-top: 0.25rem;">
                    <label style="font-size: 0.78rem; color: #cbd5e1; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                      <input type="checkbox" id="check-save-to-address-book" checked />
                      <span>이 배송지를 내 기본 배송지로 주소록에 자동 등록/저장</span>
                    </label>
                  </div>
                ` : ''}

                ${!summary.hasPhysicalItems ? `
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.76rem; color: #94a3b8; line-height: 1.4;">
                    ※ 현재 주문 상품 중 디지털 상품은 결제 즉시 마이페이지 '내 디지털 서재'에서 다운로드 및 열람 가능합니다.
                  </p>
                ` : ''}
              </div>
            </div>

            <!-- 4. 할인 & 쿠폰 적용 블록 (관리자 CMS 연동 동적 쿠폰 인터페이스) -->
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
                <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">redeem</span>
                할인 및 혜택 적용
              </h2>

              <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${availableCoupons.length > 0 ? `
                  <div>
                    <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.5rem; font-weight: 700;">
                      적용 가능한 쿠폰 및 혜택 선택
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      ${availableCoupons.map((c, cIdx) => `
                        <label class="checkout-coupon-option-label" style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.65rem 0.95rem; cursor: pointer; transition: border-color 0.15s ease;">
                          <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <input type="radio" name="checkout-selected-coupon-radio" value="${c.code}" class="radio-auto-coupon" style="accent-color: var(--primary); width: 16px; height: 16px; cursor: pointer;" />
                            <span style="font-size: 0.88rem; font-weight: 700; color: #ffffff;">${c.name}</span>
                          </div>
                          <span style="font-size: 0.8rem; color: #4ade80; font-weight: 800; white-space: nowrap;">
                            ${c.type === 'free_pass' ? '전액 무료 승인' : (c.type === 'percent_discount' ? c.discountRate + '% 할인' : (c.discountAmount || 0).toLocaleString() + '원 할인')}
                          </span>
                        </label>
                      `).join('')}

                      <label class="checkout-coupon-option-label" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.65rem; cursor: pointer; color: var(--text-muted); font-size: 0.82rem;">
                        <input type="radio" name="checkout-selected-coupon-radio" value="" checked class="radio-auto-coupon" style="accent-color: var(--primary); width: 15px; height: 15px; cursor: pointer;" />
                        <span>혜택 적용 안 함 (정규 결제 진행)</span>
                      </label>
                    </div>
                  </div>
                ` : ''}

                <!-- 쿠폰 코드 직접 입력 -->
                <div>
                  <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 700;">
                    쿠폰 코드 직접 입력
                  </label>
                  <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="checkout-coupon-code" placeholder="보유하신 쿠폰 코드가 있으시면 입력해 주세요" style="flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.7rem; color: #fff; font-size: 0.88rem; text-transform: uppercase;" />
                    <button type="button" id="btn-apply-coupon" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-weight: 700; border-radius: 8px; padding: 0 1.25rem; cursor: pointer; white-space: nowrap;">
                      코드 확인
                    </button>
                  </div>
                  <div id="checkout-coupon-msg" style="font-size: 0.8rem; margin-top: 0.35rem; display: none;"></div>
                </div>
              </div>
            </div>

            <!-- 5. 결제 수단 선택 블록 -->
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1.25rem 0; display: flex; align-items: center; gap: 0.4rem;">
                <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">credit_card</span>
                결제 수단 선택
              </h2>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">
                ${(() => {
                  const cardEnabled = PaymentConfigStore.isCardEnabled();
                  return `
                    <label style="border: 1px solid ${!cardEnabled ? 'rgba(255,255,255,0.08)' : 'rgba(242, 202, 80, 0.4)'}; border-radius: 10px; padding: 0.85rem; cursor: ${cardEnabled ? 'pointer' : 'not-allowed'}; text-align: center; background: ${!cardEnabled ? 'rgba(255,255,255,0.02)' : 'rgba(242, 202, 80, 0.05)'}; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; opacity: ${!cardEnabled ? '0.45' : '1'};" ${!cardEnabled ? 'title="현재 카드사 심사 준비 중입니다."' : ''}>
                      <input type="radio" name="checkout-pay-method" value="card" ${cardEnabled ? 'checked' : 'disabled'} style="accent-color: var(--primary);" />
                      <span style="font-size: 0.85rem; font-weight: 700; color: #fff;">신용/체크카드</span>
                      ${!cardEnabled ? '<span style="font-size: 0.68rem; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 800;">심사 준비중</span>' : ''}
                    </label>

                    <label style="border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.85rem; cursor: ${cardEnabled ? 'pointer' : 'not-allowed'}; text-align: center; background: rgba(255,255,255,0.02); display: flex; flex-direction: column; align-items: center; gap: 0.35rem; opacity: ${!cardEnabled ? '0.45' : '1'};" ${!cardEnabled ? 'title="현재 카카오페이 심사 준비 중입니다."' : ''}>
                      <input type="radio" name="checkout-pay-method" value="kakaopay" ${cardEnabled ? '' : 'disabled'} style="accent-color: var(--primary);" />
                      <span style="font-size: 0.85rem; font-weight: 700; color: #fff;">카카오페이</span>
                      ${!cardEnabled ? '<span style="font-size: 0.68rem; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 800;">심사 준비중</span>' : ''}
                    </label>

                    <label style="border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.85rem; cursor: ${cardEnabled ? 'pointer' : 'not-allowed'}; text-align: center; background: rgba(255,255,255,0.02); display: flex; flex-direction: column; align-items: center; gap: 0.35rem; opacity: ${!cardEnabled ? '0.45' : '1'};" ${!cardEnabled ? 'title="현재 토스페이 심사 준비 중입니다."' : ''}>
                      <input type="radio" name="checkout-pay-method" value="tosspay" ${cardEnabled ? '' : 'disabled'} style="accent-color: var(--primary);" />
                      <span style="font-size: 0.85rem; font-weight: 700; color: #fff;">토스페이</span>
                      ${!cardEnabled ? '<span style="font-size: 0.68rem; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 800;">심사 준비중</span>' : ''}
                    </label>

                    <label style="border: 1px solid rgba(242, 202, 80, 0.55); border-radius: 10px; padding: 0.85rem; cursor: pointer; text-align: center; background: rgba(242, 202, 80, 0.08); display: flex; flex-direction: column; align-items: center; gap: 0.35rem;">
                      <input type="radio" name="checkout-pay-method" value="bank_transfer" checked style="accent-color: var(--primary);" />
                      <span style="font-size: 0.85rem; font-weight: 700; color: #fff;">무통장 입금</span>
                      <span style="font-size: 0.68rem; color: #4ade80; background: rgba(74, 222, 128, 0.15); padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 800;">추천 · 즉시승인</span>
                    </label>
                  `;
                })()}
              </div>

              ${!PaymentConfigStore.isCardEnabled() ? `
                <div style="margin-top: 0.85rem; background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.78rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">info</span>
                  <span>현재 카드사 및 간편결제 연동 심사 준비 중으로, <strong>[무통장 입금]</strong>으로 안전하게 주문 접수 후 입금 확인 즉시 처리해 드립니다.</span>
                </div>
              ` : ''}
            </div>

            <!-- 6. 전자상거래 법적 필수 약관 동의 블록 -->
            <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
                <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">gavel</span>
                주문 내용 확인 및 결제 동의 (필수)
              </h2>

              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #fff; font-size: 0.95rem; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
                  <input type="checkbox" id="check-agree-all-terms" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;" />
                  아래 약관 및 결제 진행에 전체 동의합니다.
                </label>

                <div style="display: flex; flex-direction: column; gap: 0.5rem; padding-left: 0.5rem; font-size: 0.82rem; color: #94a3b8;">
                  <label style="display: flex; align-items: flex-start; gap: 0.4rem; cursor: pointer;">
                    <input type="checkbox" class="term-sub-check" required checked style="width: 15px; height: 15px; margin-top: 2px; accent-color: var(--primary);" />
                    <span>[필수] 구매 조건 확인 및 결제 진행 동의</span>
                  </label>
                  <label style="display: flex; align-items: flex-start; gap: 0.4rem; cursor: pointer;">
                    <input type="checkbox" class="term-sub-check" required checked style="width: 15px; height: 15px; margin-top: 2px; accent-color: var(--primary);" />
                    <span>[필수] 개인정보 수집 및 결제 대행을 위한 제3자 제공 동의</span>
                  </label>
                  <label style="display: flex; align-items: flex-start; gap: 0.4rem; cursor: pointer;">
                    <input type="checkbox" class="term-sub-check" required checked style="width: 15px; height: 15px; margin-top: 2px; accent-color: var(--primary);" />
                    <span>[필수] 디지털 컨텐츠 특성상 열람/다운로드 즉시 전자상거래법에 따라 청약철회(환불)가 제한됨을 확인하였습니다.</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          <!-- 우측: Sticky 최종 주문 결제 요약 패널 -->
          <div style="position: sticky; top: 80px;">
            <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 18px; padding: 1.5rem; box-shadow: var(--shadow-md);">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
                최종 결제 금액
              </h2>

              <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; color: #cbd5e1;">
                  <span>총 상품 금액</span>
                  <strong style="color: #fff;">₩ <span id="summary-product-amount">${summary.selectedProductAmount.toLocaleString()}</span></strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #cbd5e1;">
                  <span>배송비</span>
                  <strong style="color: ${summary.shippingFee === 0 ? '#4ade80' : '#fff'};">
                    ${summary.shippingFee === 0 ? '무료' : `₩ ${summary.shippingFee.toLocaleString()}`}
                  </strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #f87171;">
                  <span>할인 금액</span>
                  <strong>- ₩ <span id="summary-discount-amount">0</span></strong>
                </div>

                <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin-top: 0.25rem; padding-top: 1rem; display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-weight: 800; color: #fff; font-size: 1rem;">최종 결제 금액</span>
                  <strong style="font-size: 1.65rem; color: var(--primary); font-family: var(--font-display);">
                    ₩ <span id="summary-final-amount">${summary.totalPayAmount.toLocaleString()}</span>
                  </strong>
                </div>
              </div>

              <!-- 최종 결제 버튼 -->
              <button type="submit" id="btn-submit-final-order" style="width: 100%; background: var(--primary); color: #0f131d; border: none; border-radius: 12px; padding: 1.1rem; font-size: 1.15rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 20px rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: transform 0.15s ease;">
                <span class="material-symbols-outlined" style="font-size: 20px;">lock</span>
                결제하기
              </button>

              <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
                안전한 SSL 보안 암호화 결제 엔진이 적용되어 있습니다.
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  `;
}
