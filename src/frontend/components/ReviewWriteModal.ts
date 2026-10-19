/**
 * 상품 구매 후기(리뷰) 작성 모달 컴포넌트 (ReviewWriteModal)
 * - 실제 구매 완료 고객의 별점, 만족도 태그, 상세 후기 입력
 * - 작성 완료 시 500엽(엽전) 보너스 즉시 적립
 */

export interface ReviewWriteModalOptions {
  orderId: string;
  productId: string;
  productTitle: string;
}

export function renderReviewWriteModal(options: ReviewWriteModalOptions): string {
  const { orderId, productId, productTitle } = options;

  return `
  <div id="modal-review-write-container" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10005; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; width: 100%; max-width: 580px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden;">
      
      <!-- 모달 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: #121622;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <span class="material-symbols-outlined" style="font-size: 22px;">rate_review</span>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0;">구매 후기 작성</h2>
              
            </div>
            <p style="font-size: 0.78rem; color: #94a3b8; margin: 0.15rem 0 0 0;">소중한 고객님의 솔직한 후기를 남겨주세요.</p>
          </div>
        </div>
        <button type="button" id="btn-close-review-write-modal" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 모달 폼 본문 -->
      <form id="form-submit-product-review" style="margin: 0; padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.15rem; box-sizing: border-box;">
        <input type="hidden" id="review-order-id" value="${orderId}" />
        <input type="hidden" id="review-product-id" value="${productId}" />
        <input type="hidden" id="review-product-title" value="${productTitle}" />

        <!-- 구매 상품 정보 배너 -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">구매 인증 상품</div>
            <strong style="color: #fff; font-size: 0.95rem;">${productTitle}</strong>
          </div>
          <span style="font-size: 0.75rem; color: #818cf8; font-family: monospace;">${orderId}</span>
        </div>

        <!-- 1. 별점 평가 -->
        <div style="text-align: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.5rem;">
            전체적인 리포트 및 서비스 만족도를 평가해주세요
          </label>
          <div id="star-rating-selector" style="display: inline-flex; gap: 0.5rem; cursor: pointer;">
            ${[1, 2, 3, 4, 5].map(star => `
              <span class="star-rating-item" data-value="${star}" style="font-size: 32px; color: var(--primary); transition: transform 0.15s ease;">★</span>
            `).join('')}
          </div>
          <input type="hidden" id="input-review-rating" value="5" />
          <div id="star-rating-text" style="font-size: 0.82rem; font-weight: 800; color: var(--primary); margin-top: 0.4rem;">
            5점 - 최고예요! 매우 만족합니다.
          </div>
        </div>

        <!-- 2. 만족도 키워드 태그 (다중 선택 칩) -->
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.4rem;">
            어떤 점이 가장 마음에 드셨나요? (선택)
          </label>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${['명쾌한 해설', '시기 적중', '이직/진로 도움', '현실적 조언', '깊이있는 분석', '선물 추천', '평생 소장 가치', '체계적인 원리'].map(tag => `
              <label class="review-tag-chip" style="font-size: 0.76rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 0.35rem 0.65rem; border-radius: 9999px; cursor: pointer; user-select: none; transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 0.3rem;">
                <input type="checkbox" name="review-tag" value="${tag}" style="display: none;" />
                <span>#${tag}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- 3. 상세 후기 작성 -->
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.35rem;">
            상세 후기 내용 <span style="color: #f87171;">*</span>
          </label>
          <textarea id="review-content" required rows="4" placeholder="사주 리포트나 상품을 이용하신 솔직한 소감을 적어주세요. 다른 의뢰인분들에게 큰 도움이 됩니다. (최소 10자 이상)" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.75rem 0.85rem; color: #fff; font-size: 0.85rem; outline: none; resize: vertical; line-height: 1.5;"></textarea>
        </div>

        

        <!-- 폼 액션 버튼 -->
        <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 0.5rem;">
          <button type="button" id="btn-cancel-review-write" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 0.65rem 1.25rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px; cursor: pointer;">
            취소
          </button>
          <button type="submit" id="btn-submit-review" class="btn-cta-primary" style="padding: 0.65rem 1.6rem; font-size: 0.85rem; font-weight: 800; border-radius: 8px; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 18px;">check</span>
            <span>후기 등록하기</span>
          </button>
        </div>

      </form>
    </div>
  </div>
  `;
}
