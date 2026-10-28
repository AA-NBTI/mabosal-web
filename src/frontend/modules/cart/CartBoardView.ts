/**
 * CartBoardView - 마보살 정식 쇼핑몰 전체 보드형 장바구니 뷰
 */
import { CartStore, SHIPPING_FREE_THRESHOLD, DEFAULT_SHIPPING_FEE } from './cart-store.js';
import { getStoreProductById } from '../../extensions/commerce-store/store-service.js';
import { AuthService } from '../../state/auth-service.js';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderCartBoardView(): string {
  const currentUser = AuthService.getCurrentUser();
  if (currentUser.role === 'guest') {
    return `
      <div class="cart-board-view" style="max-width: 900px; margin: 0 auto; padding: 3rem 1rem 5rem 1rem; text-align: center;">
        <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 18px; padding: 4rem 1.5rem;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
            <span class="material-symbols-outlined" style="font-size: 36px; color: var(--primary);">lock</span>
          </div>
          <h2 style="font-size: 1.35rem; color: #fff; margin: 0 0 0.5rem 0;">로그인이 필요한 서비스입니다</h2>
          <p style="font-size: 0.9rem; color: #94a3b8; margin: 0 0 1.75rem 0; line-height: 1.6;">
            장바구니는 마보살 회원 전용 공간입니다.<br/>로그인 후 안전하게 주문을 진행해 보세요.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button type="button" class="btn-cart-trigger-login" id="btn-cart-login-prompt" style="background: var(--primary); color: #0f131d; border: none; border-radius: 10px; padding: 0.85rem 2rem; font-size: 0.95rem; font-weight: 800; cursor: pointer;">
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

  const items = CartStore.getItems();
  const summary = CartStore.getSummary();
  const isAllSelected = items.length > 0 && items.every(it => it.selected);
  const hasUnavailableItems = items.some(it => {
    const p = getStoreProductById(it.productId);
    return p && (p.status === 'hidden' || p.status === 'soldout');
  });

  if (items.length === 0) {
    return `
      <div class="cart-board-view" style="max-width: 1100px; margin: 0 auto; padding: 2.5rem 1rem 4rem 1rem;">
        <!-- 상단 내비 브레드크럼 -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
          <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 28px;">shopping_cart</span>
            장바구니
          </h1>
          <button type="button" class="btn-goto-store" style="background: none; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #e2e8f0; padding: 0.4rem 0.8rem; font-size: 0.85rem; cursor: pointer;">
            ← 스토어 계속 둘러보기
          </button>
        </div>

        <!-- 텅 빈 상태 안내 -->
        <div style="background: var(--surface-container); border: 1px dashed rgba(242, 202, 80, 0.25); border-radius: 20px; padding: 4.5rem 1.5rem; text-align: center; box-shadow: var(--shadow-sm);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
            <span class="material-symbols-outlined" style="font-size: 36px; color: var(--primary);">remove_shopping_cart</span>
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 0.5rem 0;">장바구니가 비어 있습니다</h2>
          <p style="font-size: 0.9rem; color: #94a3b8; margin: 0 0 1.75rem 0; line-height: 1.6;">
            신년운세, 재물/직장 특화 리포트, 맞춤 부적 등<br/>마보살의 엄선된 명리 솔루션을 장바구니에 담아보세요.
          </p>
          <button type="button" class="btn-goto-store" style="background: var(--primary); color: #0f131d; border: none; border-radius: 10px; padding: 0.85rem 2rem; font-size: 0.95rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(242, 202, 80, 0.3);">
            스토어 상품 보러가기 →
          </button>
        </div>
      </div>
    `;
  }

  // 실물 상품 금액 및 무료배송 게이지 계산
  const physicalItemsAmount = items
    .filter(it => it.selected && (it.deliveryType === 'shipping' || it.category === 'goods'))
    .reduce((sum, it) => sum + it.price * it.quantity, 0);
  const remainingForFreeShipping = Math.max(0, SHIPPING_FREE_THRESHOLD - physicalItemsAmount);
  const freeShippingProgress = Math.min(100, Math.round((physicalItemsAmount / SHIPPING_FREE_THRESHOLD) * 100));

  return `
    <div class="cart-board-view" style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem 5rem 1rem;">
      
      <!-- 상단 헤더 & 스텝 인디케이터 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">HOME &gt; STORE &gt; CART</span>
          <h1 style="font-size: 1.65rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 28px;">shopping_cart</span>
            장바구니
            <span style="font-size: 1rem; color: var(--primary); font-weight: 700;">(${summary.totalItemsCount})</span>
          </h1>
        </div>

        <!-- 3단계 쇼핑몰 프로세스 바 -->
        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.82rem; font-weight: 700;">
          <span style="color: var(--primary); display: flex; align-items: center; gap: 0.3rem;">
            <span style="background: var(--primary); color: #000; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">1</span>
            장바구니
          </span>
          <span style="color: rgba(255,255,255,0.3);">&gt;</span>
          <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
            <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">2</span>
            주문서 작성/결제
          </span>
          <span style="color: rgba(255,255,255,0.3);">&gt;</span>
          <span style="color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
            <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">3</span>
            결제 완료
          </span>
        </div>
      </div>

      <!-- 2컬럼 레이아웃: 좌측 품목 리스트 + 우측 최종 주문 요약 -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; align-items: start;" class="cart-board-grid">
        <style>
          @media (min-width: 900px) {
            .cart-board-grid {
              grid-template-columns: 1fr 360px !important;
            }
          }
        </style>

        <!-- 좌측: 장바구니 컨트롤 바 & 상품 목록 -->
        <div>
          <!-- 일괄 제어 바 (전체선택 / 선택삭제 / 판매불가정리) -->
          <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1.25rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #fff; font-size: 0.9rem; font-weight: 700;">
              <input type="checkbox" id="cart-check-all" ${isAllSelected ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;" />
              전체 선택 (${summary.selectedItemsCount}/${summary.totalItemsCount})
            </label>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${hasUnavailableItems ? `
                <button type="button" id="btn-cart-delete-unavailable" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; color: #f87171; font-size: 0.8rem; padding: 0.35rem 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;" title="숨김 또는 품절된 상품을 장바구니에서 일괄 삭제합니다.">
                  <span class="material-symbols-outlined" style="font-size: 16px;">remove_shopping_cart</span>
                  판매 불가 상품 정리
                </button>
              ` : ''}
              <button type="button" id="btn-cart-delete-selected" style="background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #cbd5e1; font-size: 0.8rem; padding: 0.35rem 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                선택 삭제
              </button>
            </div>
          </div>

          <!-- 상품 리스트 -->
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${items.map(it => {
              const itemTotal = it.price * it.quantity;
              const isPhysical = it.deliveryType === 'shipping' || it.category === 'goods';
              const liveProd = getStoreProductById(it.productId);
              const isHidden = liveProd?.status === 'hidden';
              const isSoldOut = liveProd?.status === 'soldout';
              const isUnavailable = isHidden || isSoldOut;
              const cardBorder = isUnavailable 
                ? 'rgba(239, 68, 68, 0.45)' 
                : (it.selected ? 'rgba(242, 202, 80, 0.35)' : 'rgba(255,255,255,0.08)');
              return `
                <div class="cart-item-card" data-cart-id="${esc(it.id)}" style="background: var(--surface-container); border: 1px solid ${cardBorder}; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; transition: border-color 0.2s ease; ${isUnavailable ? 'opacity: 0.85;' : ''}">
                  
                  <!-- 품목 상단: 체크박스 + 썸네일 + 정보 + 삭제버튼 -->
                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <!-- 개별 체크박스 (판매 불가 품목은 체크 불가) -->
                    <input type="checkbox" class="cart-item-checkbox" data-id="${esc(it.id)}" ${it.selected && !isUnavailable ? 'checked' : ''} ${isUnavailable ? 'disabled' : ''} title="${isUnavailable ? '판매 불가 상품은 결제할 수 없습니다' : ''}" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: ${isUnavailable ? 'not-allowed' : 'pointer'}; margin-top: 4px;" />

                    <!-- 썸네일 -->
                    <div style="width: 76px; height: 76px; border-radius: 10px; overflow: hidden; background: #0c0f17; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); position: relative;">
                      ${it.thumbnailUrl ? `
                        <img src="${esc(it.thumbnailUrl)}" alt="${esc(it.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';" />
                      ` : `
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(242,202,80,0.06);">
                          <span class="material-symbols-outlined" style="color: var(--primary); font-size: 32px;">inventory_2</span>
                        </div>
                      `}
                    </div>

                    <!-- 제목 & 태그 -->
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                        <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px;">
                          ${isPhysical ? '실물 배송' : (it.deliveryType === 'voucher_code' ? '모바일 상품권' : '디지털 리포트')}
                        </span>
                        <span style="font-size: 0.72rem; color: #94a3b8;">
                          ${isPhysical ? '배송비 3,000원 (5만원↑ 무료)' : '즉시 열람 / 무료 배송'}
                        </span>
                        ${isHidden ? `
                          <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.45); font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.2rem;">
                            <span class="material-symbols-outlined" style="font-size: 13px;">visibility_off</span> 판매 중단 (숨김)
                          </span>
                        ` : ''}
                        ${isSoldOut ? `
                          <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45); font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.2rem;">
                            <span class="material-symbols-outlined" style="font-size: 13px;">block</span> 일시 품절
                          </span>
                        ` : ''}
                      </div>

                      <h3 style="font-size: 1.02rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem 0; line-height: 1.4;">
                        ${esc(it.title)}
                      </h3>

                      ${isUnavailable ? `
                        <div style="font-size: 0.78rem; color: #f87171; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; padding: 0.4rem 0.65rem; margin-top: 0.35rem; display: flex; align-items: center; gap: 0.35rem;">
                          <span class="material-symbols-outlined" style="font-size: 15px;">info</span>
                          <span>관리자에 의해 ${isHidden ? '숨김(판매 중단)' : '품절'} 처리된 상품입니다. 결제할 수 없으므로 장바구니에서 삭제해 주세요.</span>
                        </div>
                      ` : ''}

                      <!-- 사주 분석 대상자 스냅샷 배지 -->
                      ${!isPhysical && it.sajuSnapshot ? `
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.35rem 0.65rem; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #cbd5e1; margin-top: 0.2rem;">
                          <span class="material-symbols-outlined" style="font-size: 14px; color: var(--primary);">person</span>
                          <span>사주 대상: <strong style="color: #fff;">${esc(it.sajuSnapshot.userName || '의뢰인')}</strong> (${it.sajuSnapshot.solarBirthDate || '생년월일 미상'}${it.sajuSnapshot.gender === 'female' ? ' · 여' : ' · 남'})</span>
                        </div>
                      ` : ''}
                    </div>

                    <!-- 삭제 버튼 -->
                    <button type="button" class="btn-cart-remove-single" data-id="${esc(it.id)}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.2rem;" title="품목 삭제">
                      <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                    </button>
                  </div>

                  <!-- 품목 하단: 수량 조절 & 가격 표시 -->
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.85rem; margin-top: 0.25rem;">
                    <!-- 수량 증감 버튼 -->
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden;">
                      <button type="button" class="btn-board-qty-minus" data-id="${esc(it.id)}" style="background: none; border: none; color: #fff; width: 32px; height: 30px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">-</button>
                      <span style="width: 36px; text-align: center; color: #fff; font-size: 0.88rem; font-weight: 700;">${it.quantity}</span>
                      <button type="button" class="btn-board-qty-plus" data-id="${esc(it.id)}" style="background: none; border: none; color: #fff; width: 32px; height: 30px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>

                    <!-- 가격 -->
                    <div style="text-align: right;">
                      <span style="font-size: 0.78rem; color: var(--text-muted); margin-right: 0.4rem;">단가 ₩ ${it.price.toLocaleString()}</span>
                      <strong style="font-size: 1.15rem; color: var(--primary); font-family: var(--font-display);">₩ ${itemTotal.toLocaleString()}</strong>
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>

          <!-- 하단 버튼: 쇼핑 계속하기 -->
          <div style="margin-top: 1.5rem;">
            <button type="button" class="btn-goto-store" style="background: none; border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; color: #e2e8f0; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
              <span class="material-symbols-outlined" style="font-size: 18px;">arrow_back</span>
              다른 상품 더 둘러보기
            </button>
          </div>
        </div>

        <!-- 우측: Sticky 최종 결제 요약 패널 -->
        <div style="position: sticky; top: 80px;">
          <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 18px; padding: 1.5rem; box-shadow: var(--shadow-md);">
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 1.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
              <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">receipt</span>
              주문 결제 요약
            </h2>

            <!-- 실물 상품 무료배송 달성 프로그레스 바 (실물 상품이 있는 경우) -->
            ${summary.hasPhysicalItems ? `
              <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 10px; padding: 0.85rem; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.4rem;">
                  <span style="color: #cbd5e1;">실물 상품 무료배송 혜택</span>
                  <strong style="color: var(--primary);">${freeShippingProgress}%</strong>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 9999px; overflow: hidden; margin-bottom: 0.4rem;">
                  <div style="width: ${freeShippingProgress}%; height: 100%; background: var(--primary); transition: width 0.3s ease;"></div>
                </div>
                <div style="font-size: 0.74rem; color: #94a3b8;">
                  ${remainingForFreeShipping === 0 
                    ? '<span style="color: #4ade80; font-weight: 700;">✓ 무료 배송 혜택이 적용되었습니다!</span>' 
                    : `₩ ${remainingForFreeShipping.toLocaleString()} 추가 담기 시 <strong>무료배송</strong>`}
                </div>
              </div>
            ` : ''}

            <!-- 금액 상세 행 -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; color: #cbd5e1;">
                <span>선택 상품 금액 (${summary.selectedItemsCount}개)</span>
                <strong style="color: #fff;">₩ ${summary.selectedProductAmount.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; color: #cbd5e1;">
                <span>배송비</span>
                <strong style="color: ${summary.shippingFee === 0 ? '#4ade80' : '#fff'};">
                  ${summary.shippingFee === 0 ? '무료' : `₩ ${summary.shippingFee.toLocaleString()}`}
                </strong>
              </div>
              <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin-top: 0.25rem; padding-top: 0.85rem; display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-weight: 700; color: #fff;">총 결제 예정 금액</span>
                <strong style="font-size: 1.5rem; color: var(--primary); font-family: var(--font-display);">
                  ₩ ${summary.totalPayAmount.toLocaleString()}
                </strong>
              </div>
            </div>

            <!-- 주문서 작성 진행 CTA 버튼 -->
            <button type="button" id="btn-proceed-to-checkout" ${summary.selectedItemsCount === 0 ? 'disabled' : ''} style="width: 100%; background: ${summary.selectedItemsCount > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; color: ${summary.selectedItemsCount > 0 ? '#0f131d' : 'var(--text-muted)'}; border: none; border-radius: 12px; padding: 1rem; font-size: 1.05rem; font-weight: 800; cursor: ${summary.selectedItemsCount > 0 ? 'pointer' : 'not-allowed'}; box-shadow: ${summary.selectedItemsCount > 0 ? '0 4px 18px rgba(242, 202, 80, 0.35)' : 'none'}; transition: all 0.2s ease;">
              총 ${summary.selectedItemsCount}건 주문서 작성하기 →
            </button>

            <!-- 안심 안내 -->
            <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
              <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle; color: var(--primary);">verified_user</span>
              개인 사주 정보 암호화 보존 &amp; 안전 결제 보장
            </div>
          </div>
        </div>

      </div>

    </div>
  `;
}
