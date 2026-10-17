/**
 * 장바구니 모달 & 결제 전 주문 내역 최종 확인(Order Review) 모달 컴포넌트
 */

import { CartStore, CartItem } from '../state/cart-store.js';
import { UserSajuStore, UserSajuProfile } from '../state/user-saju-store.js';

export function renderCartModal(): string {
  const items = CartStore.getItems();
  const totalAmount = CartStore.getTotalAmount();
  const count = CartStore.getCount();
  const hasPhysical = CartStore.hasPhysicalItems();

  return `
    <div class="modal-overlay" id="modal-cart-overlay" style="position: fixed; inset: 0; z-index: 10000; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div style="background: #0f1422; border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 18px; width: 100%; max-width: 540px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.8);">
        
        <!-- 모달 헤더 -->
        <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 24px;">shopping_bag</span>
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #fff;">마보살 장바구니 <span style="color: var(--primary); font-size: 0.95rem;">(${count}개)</span></h3>
          </div>
          <button type="button" id="btn-close-cart-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0.25rem;">&times;</button>
        </div>

        <!-- 상품 목록 본문 -->
        <div style="padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0.85rem;">
          ${items.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
              <span class="material-symbols-outlined" style="font-size: 48px; color: rgba(255,255,255,0.2); margin-bottom: 0.5rem;">production_quantity_limits</span>
              <p style="margin: 0 0 1rem 0; font-size: 0.95rem;">장바구니에 담긴 상품이 없습니다.</p>
              <button type="button" id="btn-cart-goto-store" style="background: var(--primary); color: #000; font-weight: 800; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">
                스토어 상품 둘러보기 →
              </button>
            </div>
          ` : `
            ${items.map(item => `
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.85rem 1rem; display: flex; gap: 0.85rem; align-items: center;">
                <img src="${item.thumbnailUrl}" alt="${item.title}" style="width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0;" />
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.title}
                  </div>
                  <div style="font-size: 0.85rem; color: var(--primary); font-weight: 800;">
                    ₩ ${(item.price * item.quantity).toLocaleString()}
                    ${item.quantity > 1 ? `<span style="font-size: 0.75rem; color: #94a3b8; font-weight: 400;">(개당 ₩ ${item.price.toLocaleString()})</span>` : ''}
                  </div>
                  ${item.deliveryType === 'saju_report' && item.sajuSnapshot ? `
                    <div style="font-size: 0.72rem; color: #38bdf8; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.25rem;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">person</span>
                      분석 대상: ${item.sajuSnapshot.userName} 님 (${item.sajuSnapshot.solarBirthDate})
                    </div>
                  ` : ''}
                  ${item.deliveryType === 'shipping' ? `
                    <div style="font-size: 0.72rem; color: #fbbf24; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.25rem;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">local_shipping</span>
                      실물 택배 배송 상품
                    </div>
                  ` : ''}
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
                  <button type="button" class="btn-remove-cart-item" data-id="${item.productId}" style="background: none; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; padding: 0.1rem 0.3rem;">
                    삭제
                  </button>
                  <div style="display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; overflow: hidden;">
                    <button type="button" class="btn-cart-qty-minus" data-id="${item.productId}" style="background: rgba(255,255,255,0.05); border: none; color: #fff; width: 24px; height: 24px; cursor: pointer; font-size: 0.85rem;">-</button>
                    <span style="font-size: 0.82rem; font-weight: 700; color: #fff; width: 28px; text-align: center;">${item.quantity}</span>
                    <button type="button" class="btn-cart-qty-plus" data-id="${item.productId}" style="background: rgba(255,255,255,0.05); border: none; color: #fff; width: 24px; height: 24px; cursor: pointer; font-size: 0.85rem;">+</button>
                  </div>
                </div>
              </div>
            `).join('')}
          `}
        </div>

        ${items.length > 0 ? `
          <!-- 모달 하단 결제 버튼부 -->
          <div style="padding: 1.25rem 1.5rem; background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <span style="color: #94a3b8; font-size: 0.9rem;">총 ${count}개 상품 결제 금액</span>
              <strong style="color: var(--primary); font-size: 1.35rem; font-weight: 800;">₩ ${totalAmount.toLocaleString()}</strong>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 0.65rem;">
              <button type="button" id="btn-cart-continue-shopping" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.8rem; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                쇼핑 계속하기
              </button>
              <button type="button" id="btn-cart-proceed-checkout" style="background: var(--primary); color: #1c1500; border: none; border-radius: 10px; padding: 0.8rem; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 16px rgba(242,202,80,0.35);">
                주문서 확인 및 결제하기 →
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;
}

export interface ReviewModalOptions {
  items: CartItem[];
  totalAmount: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  shippingAddress?: string;
  paymentMethod: string;
  sajuSnapshot: UserSajuProfile;
}

/**
 * 2단계: 결제 전 주문 내역 최종 확인(Order Review Confirmation) 모달
 */
export function renderOrderReviewModal(options: ReviewModalOptions): string {
  const hasPhysical = options.items.some(i => i.deliveryType === 'shipping');
  const hasSaju = options.items.some(i => i.deliveryType === 'saju_report');
  const prof = options.sajuSnapshot;

  return `
    <div class="modal-overlay" id="modal-review-overlay" style="position: fixed; inset: 0; z-index: 10001; background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div style="background: #0d121e; border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 18px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.9); padding: 1.75rem 1.5rem;">
        
        <div style="text-align: center; margin-bottom: 1.25rem;">
          <span class="material-symbols-outlined" style="font-size: 40px; color: var(--primary); margin-bottom: 0.25rem;">fact_check</span>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 0.35rem 0;">주문내역 최종 확인</h2>
          <p style="font-size: 0.82rem; color: #94a3b8; margin: 0;">결제 전 주문하시는 상품과 사주 정보가 맞는지 확인해 주세요.</p>
        </div>

        <!-- 1. 구매 상품 목록 -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; text-transform: uppercase;">
            1. 주문 상품 (${options.items.length}개)
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${options.items.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
                <span style="color: #e2e8f0; font-weight: 600;">${item.title} <span style="color: #94a3b8; font-size: 0.8rem;">x ${item.quantity}</span></span>
                <strong style="color: #fff;">₩ ${(item.price * item.quantity).toLocaleString()}</strong>
              </div>
            `).join('')}
          </div>
        </div>

        ${hasSaju ? `
          <!-- 2. 사주 분석 대상자 정보 -->
          <div style="background: rgba(242, 202, 80, 0.06); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary);">2. 사주 분석 대상자 확인</span>
              <span style="font-size: 0.72rem; padding: 0.1rem 0.4rem; background: rgba(242, 202, 80, 0.2); border-radius: 4px; color: var(--primary); font-weight: 700;">맞춤 감정서 생성용</span>
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">
              ${prof.userName} 님 (${prof.gender === 'female' ? '坤命 · 女性' : '乾命 · 男性'})
            </div>
            <div style="font-size: 0.82rem; color: #cbd5e1;">
              생년월일시: ${prof.solarBirthDate} ${prof.birthTime || '시간 미상'} (${prof.calendarType === 'lunar' ? '음력' : '양력'})
            </div>
          </div>
        ` : ''}

        ${hasPhysical ? `
          <!-- 3. 실물 택배 배송지 -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.4rem;">
              3. 실물 상품 수령 배송지
            </div>
            <div style="font-size: 0.88rem; color: #fff; font-weight: 600;">
              ${options.shippingAddress || '서울시 강남구 테헤란로 (기본 등록 배송지)'}
            </div>
            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.2rem;">
              수령인: ${options.buyerName} (${options.buyerPhone})
            </div>
          </div>
        ` : ''}

        <!-- 4. 결제 금액 및 결제수단 요약 -->
        <div style="border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.85rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.85rem; color: #94a3b8;">
            <span>주문자</span>
            <span style="color: #fff;">${options.buyerName} (${options.buyerPhone})</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.85rem; color: #94a3b8;">
            <span>결제수단</span>
            <span style="color: #fff;">${options.paymentMethod === 'bank_transfer' ? '무통장 입금' : '카드 · 간편결제 (토스)'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08);">
            <span style="font-size: 1rem; font-weight: 700; color: #fff;">최종 결제 금액</span>
            <strong style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">₩ ${options.totalAmount.toLocaleString()}</strong>
          </div>
        </div>

        <!-- 버튼부 -->
        <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 0.75rem;">
          <button type="button" id="btn-close-review-modal" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 0.85rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
            ← 주문 수정
          </button>
          <button type="button" id="btn-final-confirm-payment" style="background: var(--primary); color: #1c1500; border: none; padding: 0.85rem; border-radius: 10px; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 16px rgba(242,202,80,0.4);">
            최종 결제 승인 →
          </button>
        </div>

      </div>
    </div>
  `;
}
