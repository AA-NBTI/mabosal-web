/**
 * 관리자 대시보드 - 상품 후기(리뷰) 관리 패널 (AdminReviewsPanel)
 * - 전체 상품 구매 후기 조회, 베스트 리뷰 선정, 악성 리뷰 삭제
 */

import { ProductReviewStore, ProductReview } from '../state/product-review-store.js';

export function renderAdminReviewsPanel(): string {
  const reviews = ProductReviewStore.getReviews();
  const bestReviewsCount = reviews.filter(r => r.isBest).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return `
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    
    <!-- 1. 상단 통계 헤더 카드 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">rate_review</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">VERIFIED PRODUCT REVIEWS</span>
          </div>
          <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 800; color: #dfe2f1; margin: 0 0 0.3rem;">
            스토어 상품 구매 후기 & 평점 집중 관리
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
            실제 결제 완료 고객이 남긴 생생한 내돈내산 사주 감정서 및 상품 후기를 모니터링하고 베스트 리뷰를 지정합니다.
          </p>
        </div>
      </div>

      <!-- 요약 통계 카드 그리드 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem;">
        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">총 등록 구매 후기</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">${reviews.length}개</div>
        </div>
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 10px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">평균 고객 만족도 평점</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-top: 0.2rem; display: flex; align-items: center; gap: 0.3rem;">
            <span>★ ${avgRating}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">/ 5.0</span>
          </div>
        </div>
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 10px; padding: 0.85rem 1rem;">
          <div style="font-size: 0.75rem; color: #818cf8; font-weight: 700;">선정된 베스트 리뷰</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #818cf8; margin-top: 0.2rem;">${bestReviewsCount}개</div>
        </div>
      </div>
    </div>

    <!-- 2. 후기 목록 및 관리 조치 카드 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;">
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0 0 1rem; display: flex; align-items: center; justify-content: space-between;">
        <span>전체 구매 후기 목록 (${reviews.length}개)</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">* 베스트 리뷰로 지정 시 스토어 상품 상세 최상단에 골드 뱃지와 함께 노출됩니다.</span>
      </h3>

      ${reviews.length === 0 ? `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size: 40px; color: rgba(255,255,255,0.2); margin-bottom: 0.5rem;">rate_review</span>
          <p style="margin: 0; font-size: 0.9rem;">아직 등록된 상품 후기가 없습니다.</p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${reviews.map(r => `
            <div class="review-admin-card" style="background: rgba(0,0,0,0.3); border: 1px solid ${r.isBest ? 'rgba(242, 202, 80, 0.4)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 1.15rem; display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- 상단 메타 (상품명, 베스트 배지, 액션 버튼) -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  ${r.isBest ? `
                    <span style="font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 800; background: rgba(242, 202, 80, 0.2); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.4);">
                      ★ BEST 리뷰
                    </span>
                  ` : ''}
                  <strong style="color: #fff; font-size: 0.95rem;">${r.productTitle}</strong>
                  <span style="font-size: 0.75rem; color: var(--primary); font-family: monospace;">(${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)})</span>
                  ${r.orderId ? `<span style="font-size: 0.74rem; color: #94a3b8; font-family: monospace;">주문: ${r.orderId}</span>` : ''}
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <button type="button" class="btn-toggle-best-review" data-review-id="${r.id}" style="background: ${r.isBest ? 'rgba(242, 202, 80, 0.15)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${r.isBest ? 'rgba(242, 202, 80, 0.4)' : 'rgba(255,255,255,0.15)'}; color: ${r.isBest ? 'var(--primary)' : '#dfe2f1'}; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                    ${r.isBest ? '베스트 해제' : '베스트 지정'}
                  </button>
                  <button type="button" class="btn-delete-review" data-review-id="${r.id}" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                    삭제
                  </button>
                </div>
              </div>

              <!-- 작성자 정보 및 태그 -->
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.78rem; color: var(--text-muted);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span>작성자: <strong style="color: #e2e8f0;">${r.authorName} 님</strong></span>
                  <span style="color: rgba(255,255,255,0.2);">|</span>
                  <span>${new Date(r.createdAt).toLocaleDateString()}</span>
                </div>

                ${r.tags && r.tags.length > 0 ? `
                  <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                    ${r.tags.map(t => `
                      <span style="font-size: 0.72rem; background: rgba(255,255,255,0.05); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px;">
                        #${t}
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- 후기 본문 -->
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.85rem 1rem; font-size: 0.85rem; color: #dfe2f1; line-height: 1.6;">
                ${r.content}
              </div>

            </div>
          `).join('')}
        </div>
      `}
    </div>

  </div>
  `;
}
