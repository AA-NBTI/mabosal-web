/**
 * 마보살 인하우스 커머스 스토어 (최고 관리자 전용 상품 CMS & 실시간 주문 장부)
 * 하부 서브 카테고리 탭 구조 (상품 목록 / 신규 등록 / 주문 장부) 탑재
 */

import {
  deleteStoreProduct,
  getAllStoreOrders,
  getAllStoreProducts,
  getStoreProductById,
  saveStoreProduct,
  setStoreProductStatus,
  STORE_CATEGORIES,
  updateStoreProduct,
} from './store-service.js';
import type { DeliveryType, StoreCategoryType, StoreProduct } from './types.js';

let adminSubTab: 'products' | 'register' | 'orders' = 'products';
let adminFilterCategory: StoreCategoryType = 'all';
let adminSearchQuery: string = '';

export function setAdminStoreSubTab(tab: 'products' | 'register' | 'orders'): void {
  adminSubTab = tab;
}

export function setAdminStoreFilter(cat: StoreCategoryType): void {
  adminFilterCategory = cat;
}

export function setAdminStoreSearch(q: string): void {
  adminSearchQuery = q;
}

export function setAdminStoreSort(sort: any): void {
  // sort option helper
}

function esc(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CATEGORY_ORDER: StoreCategoryType[] = ['report', 'ebook', 'lecture', 'consulting', 'goods'];

const CATEGORY_META: Record<StoreCategoryType, { title: string; badgeColor: string; icon: string }> = {
  all: { title: '전체 상품', badgeColor: '#f2ca50', icon: 'apps' },
  report: { title: '특화 운세 리포트', badgeColor: '#f2ca50', icon: 'auto_awesome' },
  voucher: { title: '상품권 · 바우처', badgeColor: '#38bdf8', icon: 'confirmation_number' },
  ebook: { title: '전자책 · 실천 가이드', badgeColor: '#f2ca50', icon: 'menu_book' },
  lecture: { title: '강의 · 핵심 VOD', badgeColor: '#f2ca50', icon: 'smart_display' },
  consulting: { title: '1:1 심층 상담권', badgeColor: '#dfe2f1', icon: 'support_agent' },
  goods: { title: '부적 · 수호 굿즈', badgeColor: '#dfe2f1', icon: 'token' },
};

export function renderAdminStorePanel(editingProductId?: string | null): string {
  const allProducts = getAllStoreProducts();
  const orders = getAllStoreOrders();

  const activeCount = allProducts.filter(p => p.status === 'active').length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);

  const editItem = editingProductId ? getStoreProductById(editingProductId) : undefined;
  // 수정 중일 때는 자동으로 'register' 탭이 활성화되도록 지원
  const activeTab = editItem ? 'register' : adminSubTab;

  // 카테고리별 개수 카운트
  const categoryCounts: Record<string, number> = {
    all: allProducts.length,
    report: allProducts.filter(p => p.category === 'report').length,
    ebook: allProducts.filter(p => p.category === 'ebook').length,
    lecture: allProducts.filter(p => p.category === 'lecture').length,
    consulting: allProducts.filter(p => p.category === 'consulting').length,
    goods: allProducts.filter(p => p.category === 'goods').length,
  };

  // 검색 필터링
  let filtered = allProducts.filter(p => {
    if (adminFilterCategory !== 'all' && p.category !== adminFilterCategory) return false;
    if (adminSearchQuery) {
      const q = adminSearchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTag = p.tagLine.toLowerCase().includes(q);
      if (!matchTitle && !matchTag) return false;
    }
    return true;
  });

  // 카테고리 기준 우선 정렬 -> 그 다음 최신 등록순 정렬
  filtered.sort((a, b) => {
    const orderA = CATEGORY_ORDER.indexOf(a.category);
    const orderB = CATEGORY_ORDER.indexOf(b.category);
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 1.25rem; width: 100%; box-sizing: border-box;">
      
      <!-- 상단 헤더 & 설명 -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
        <div>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #dfe2f1; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 26px;">storefront</span>
            스토어 상품 &amp; 결제 집중 관리 센터
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.35rem 0 0 0;">
            5대 특화 운세 리포트, 전자책, VOD 특강, 1:1 상담권, 부적 굿즈를 하부 서브 메뉴별로 집중 관리합니다.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a href="/?view=store" target="_blank" style="background: rgba(242,202,80,0.15); border: 1px solid var(--primary); color: var(--primary); padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">launch</span>
            실제 고객 상점 바로가기
          </a>
        </div>
      </div>

      <!-- 요약 KPI 카드 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem;">
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">총 상품 수 (판매중 / 전체)</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">
            ${activeCount}개 <span style="font-size: 0.85rem; color: var(--text-muted);">/ 총 ${allProducts.length}개</span>
          </div>
        </div>
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">누적 결제 주문 건수</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: var(--primary); margin-top: 0.25rem;">
            ${orders.length}건
          </div>
        </div>
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">누적 스토어 매출액</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #dfe2f1; margin-top: 0.25rem;">
            ₩ ${totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <!-- [하부 카테고리 3대 서브 탭 네비게이션] -->
      <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem;">
        <button type="button" class="btn-store-subtab ${activeTab === 'products' ? 'active' : ''}" data-subtab="products" style="background: ${activeTab === 'products' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${activeTab === 'products' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">inventory_2</span>
          상품 목록 &amp; 카테고리 관리 (${allProducts.length})
        </button>
        <button type="button" class="btn-store-subtab ${activeTab === 'register' ? 'active' : ''}" data-subtab="register" style="background: ${activeTab === 'register' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${activeTab === 'register' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">${editItem ? 'edit' : 'add_circle'}</span>
          ${editItem ? '상품 정보 수정 중' : '+ 신규 상품 등록 (CMS)'}
        </button>
        <button type="button" class="btn-store-subtab ${activeTab === 'orders' ? 'active' : ''}" data-subtab="orders" style="background: ${activeTab === 'orders' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${activeTab === 'orders' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">receipt_long</span>
          실시간 결제 장부 (${orders.length})
        </button>
      </div>

      <!-- [서브 탭 1] 상품 목록 및 카테고리별 관리 -->
      <div style="display: ${activeTab === 'products' ? 'block' : 'none'};">
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.35rem;">
          
          <!-- 상단 카테고리 탭 & 검색 -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
            <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
              <button type="button" class="btn-admin-store-filter ${adminFilterCategory === 'all' ? 'active' : ''}" data-cat="all" style="background: ${adminFilterCategory === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${adminFilterCategory === 'all' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; border: 1px solid ${adminFilterCategory === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                <span class="material-symbols-outlined" style="font-size: 16px;">apps</span>
                전체 (${categoryCounts.all})
              </button>
              ${CATEGORY_ORDER.map(cat => {
                const meta = CATEGORY_META[cat];
                const isSel = adminFilterCategory === cat;
                return `
                  <button type="button" class="btn-admin-store-filter ${isSel ? 'active' : ''}" data-cat="${cat}" style="background: ${isSel ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${isSel ? '#1c1500' : '#cbd5e1'}; font-weight: ${isSel ? '800' : '600'}; border: 1px solid ${isSel ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">${meta.icon}</span>
                    ${meta.title} (${categoryCounts[cat]})
                  </button>
                `;
              }).join('')}
            </div>

            <!-- 검색창 -->
            <div>
              <input type="text" id="admin-store-search-input" value="${esc(adminSearchQuery)}" placeholder="상품명 검색..." style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.75rem; border-radius: 8px; font-size: 0.82rem; width: 180px;" />
            </div>
          </div>

          <!-- 상품 목록 테이블 -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; color: #dfe2f1;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                  <th style="padding: 0.75rem 0.6rem;">상품명 &amp; 한 줄 소개</th>
                  <th style="padding: 0.75rem 0.6rem;">카테고리 분류</th>
                  <th style="padding: 0.75rem 0.6rem;">판매 가격</th>
                  <th style="padding: 0.75rem 0.6rem;">누적 판매</th>
                  <th style="padding: 0.75rem 0.6rem;">판매 상태</th>
                  <th style="padding: 0.75rem 0.6rem; text-align: right;">관리 조치</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr><td colspan="6" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">등록된 상품이 없거나 검색 조건에 일치하지 않습니다.</td></tr>
                ` : filtered.map(p => {
                  const meta = CATEGORY_META[p.category] || { title: p.category, badgeColor: '#f2ca50', icon: 'menu_book' };
                  return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                      <td style="padding: 0.75rem 0.6rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                          <span class="material-symbols-outlined" style="color: var(--primary); font-size: 22px;">${p.thumbnailIcon || meta.icon}</span>
                          <div>
                            <strong style="color: #fff; font-size: 0.88rem;">${esc(p.title)}</strong>
                            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem;">${esc(p.tagLine)}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding: 0.75rem 0.6rem;">
                        <span style="background: rgba(242,202,80,0.12); color: ${meta.badgeColor}; padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.74rem; font-weight: 700;">
                          ${meta.title}
                        </span>
                      </td>
                      <td style="padding: 0.75rem 0.6rem; font-weight: 800; color: var(--primary); font-size: 0.9rem;">
                        ₩ ${p.price.toLocaleString()}
                      </td>
                      <td style="padding: 0.75rem 0.6rem; color: #dfe2f1; font-weight: 800;">
                        ${p.salesCount || 0}건
                      </td>
                      <td style="padding: 0.75rem 0.6rem;">
                        <select class="select-product-status-quick" data-product-id="${p.id}" style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: ${p.status === 'active' ? '#dfe2f1' : p.status === 'soldout' ? '#e2e8f0' : 'var(--text-muted)'}; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.76rem; font-weight: 700;">
                          <option value="active" ${p.status === 'active' ? 'selected' : ''}>판매중</option>
                          <option value="soldout" ${p.status === 'soldout' ? 'selected' : ''}>품절</option>
                          <option value="hidden" ${p.status === 'hidden' ? 'selected' : ''}>숨김</option>
                        </select>
                      </td>
                      <td style="padding: 0.75rem 0.6rem; text-align: right;">
                        <button type="button" class="btn-edit-store-product" data-product-id="${p.id}" style="background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer; margin-right: 0.3rem;">
                          수정
                        </button>
                        <button type="button" class="btn-delete-store-product" data-product-id="${p.id}" style="background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); color: #e2e8f0; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;">
                          삭제
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- [서브 탭 2] 상품 등록 / 수정 폼 -->
      <div style="display: ${activeTab === 'register' ? 'block' : 'none'};">
        <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.35rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
              <span class="material-symbols-outlined" style="color: var(--primary);">edit_document</span>
              ${editItem ? `[${editItem.title}] 상품 정보 수정 중` : '신규 상품 등록 (CMS)'}
            </h3>
            ${editItem ? `
              <button type="button" id="btn-cancel-edit-product" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer;">
                수정 취소하고 목록으로 돌아가기
              </button>
            ` : ''}
          </div>

          <form id="admin-product-cms-form" data-edit-id="${editItem ? editItem.id : ''}">
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">상품명 (Title) *</label>
                <input type="text" id="cms-title" required value="${editItem ? esc(editItem.title) : ''}" placeholder="예: [전자책] 손재마 탈출 30분 재무 방어 엑셀북" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">카테고리 분류 *</label>
                <select id="cms-category" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;">
                  <option value="report" ${editItem?.category === 'report' ? 'selected' : ''}> 특화 운세 리포트</option>
                  <option value="ebook" ${editItem?.category === 'ebook' ? 'selected' : ''}> 전자책 · 실천 가이드</option>
                  <option value="lecture" ${editItem?.category === 'lecture' ? 'selected' : ''}> 강의 · 핵심 VOD</option>
                  <option value="consulting" ${editItem?.category === 'consulting' ? 'selected' : ''}> 1:1 심층 상담권</option>
                  <option value="goods" ${editItem?.category === 'goods' ? 'selected' : ''}> 부적 · 수호 굿즈</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">판매 가격 (원) *</label>
                <input type="number" id="cms-price" required min="0" step="100" value="${editItem ? editItem.price : 19900}" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">정상 가격 (할인 전)</label>
                <input type="number" id="cms-original-price" min="0" step="100" value="${editItem?.originalPrice || 30000}" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">판매 상태 &amp; 뱃지</label>
                <div style="display: flex; gap: 0.4rem;">
                  <select id="cms-status" style="flex: 1; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.82rem;">
                    <option value="active" ${editItem?.status === 'active' ? 'selected' : ''}>판매중</option>
                    <option value="soldout" ${editItem?.status === 'soldout' ? 'selected' : ''}>품절</option>
                    <option value="hidden" ${editItem?.status === 'hidden' ? 'selected' : ''}>숨김</option>
                  </select>
                  <input type="text" id="cms-badge" value="${editItem ? esc(editItem.badge || '') : 'BEST'}" placeholder="뱃지(BEST)" style="width: 75px; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.82rem;" />
                </div>
              </div>
            </div>

            <div style="margin-bottom: 0.85rem;">
              <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">한 줄 소개 문구 *</label>
              <input type="text" id="cms-tagline" required value="${editItem ? esc(editItem.tagLine) : ''}" placeholder="예: 재물 누수를 막고 안전한 현금 흐름을 설계하는 실전 템플릿" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
            </div>

            <div style="margin-bottom: 0.85rem;">
              <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">상세 설명 (본문 내용) *</label>
              <textarea id="cms-desc" required rows="3" placeholder="상품의 핵심 구성과 가치를 입력하세요." style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem; resize: vertical;">${editItem ? esc(editItem.description) : ''}</textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">대표 썸네일 이미지 URL</label>
                <input type="url" id="cms-thumb-url" value="${editItem ? esc(editItem.thumbnailUrl) : ''}" placeholder="https://..." style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">구매자 제공 파일/열람 링크 (다운로드 URL) *</label>
                <input type="text" id="cms-content-payload" required value="${editItem ? esc(editItem.contentPayload) : ''}" placeholder="https://다운로드링크 또는 VOD주소" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem;">
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">제공 방식 (Delivery Type)</label>
                <select id="cms-delivery" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;">
                  <option value="saju_report" ${editItem?.deliveryType === 'saju_report' ? 'selected' : ''}>사주 맞춤 리포트</option>
                  <option value="digital_download" ${editItem?.deliveryType === 'digital_download' ? 'selected' : ''}>즉시 파일 다운로드</option>
                  <option value="digital_url" ${editItem?.deliveryType === 'digital_url' ? 'selected' : ''}>웹 링크/VOD 시청</option>
                  <option value="consulting_booking" ${editItem?.deliveryType === 'consulting_booking' ? 'selected' : ''}>상담 캘린더 예약</option>
                  <option value="shipping" ${editItem?.deliveryType === 'shipping' ? 'selected' : ''}>택배 배송</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">사주 연계 태그 (손재마/이직운 등 연계)</label>
                <input type="text" id="cms-target-signals" value="${editItem ? esc(editItem.targetSignals.join(',')) : 'money.loss'}" placeholder="예: money.loss, career.change" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.55rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
            </div>

            <div style="text-align: right;">
              <button type="submit" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 8px; padding: 0.65rem 1.6rem; font-size: 0.88rem; cursor: pointer;">
                ${editItem ? '상품 정보 수정 완료' : '신규 상품 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- [서브 탭 3] 실시간 결제 & 주문 장부 -->
      <div style="display: ${activeTab === 'orders' ? 'block' : 'none'};">
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.35rem;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 1rem 0;">
            스토어 실시간 결제 장부 (Orders)
          </h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; color: #dfe2f1;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                  <th style="padding: 0.6rem;">주문번호</th>
                  <th style="padding: 0.6rem;">구매자 성명</th>
                  <th style="padding: 0.6rem;">상품명</th>
                  <th style="padding: 0.6rem;">결제 금액</th>
                  <th style="padding: 0.6rem;">결제 수단</th>
                  <th style="padding: 0.6rem;">결제 일시</th>
                  <th style="padding: 0.6rem;">상태</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr><td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">아직 발생한 주문이 없습니다.</td></tr>
                ` : orders.map(o => {
                  return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                      <td style="padding: 0.6rem; font-family: monospace;">${o.orderId}</td>
                      <td style="padding: 0.6rem; font-weight: 700;">${esc(o.buyerName)} (${esc(o.buyerPhone)})</td>
                      <td style="padding: 0.6rem;">${esc(o.productTitle)}</td>
                      <td style="padding: 0.6rem; color: var(--primary); font-weight: 700;">₩ ${o.amount.toLocaleString()}</td>
                      <td style="padding: 0.6rem;"><span style="text-transform: uppercase;">${o.paymentMethod}</span></td>
                      <td style="padding: 0.6rem; color: var(--text-muted); font-size: 0.75rem;">${new Date(o.paidAt).toLocaleString()}</td>
                      <td style="padding: 0.6rem;">
                        <span style="background: rgba(52,211,153,0.15); color: #dfe2f1; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px;">결제완료</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  `;
}
