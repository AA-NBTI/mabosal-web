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
  getStoreCategories,
  addStoreCategory,
  deleteStoreCategory,
} from './store-service.js';
import type { DeliveryType, StoreCategoryType, StoreProduct } from './types.js';

const ADMIN_STORE_SUBTAB_KEY = 'mm_admin_store_subtab';
let adminSubTab: 'products' | 'register' | 'orders' | 'categories' =
  (typeof localStorage !== 'undefined' && (localStorage.getItem(ADMIN_STORE_SUBTAB_KEY) as any)) || 'products';
let adminFilterCategory: StoreCategoryType = 'all';
let adminFilterStatus: 'all' | 'active' | 'hidden' | 'soldout' = 'all';
let adminSearchQuery: string = '';

export function setAdminStoreSubTab(tab: 'products' | 'register' | 'orders' | 'categories'): void {
  adminSubTab = tab;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_STORE_SUBTAB_KEY, tab);
    } catch {}
  }
}

export function setAdminStoreFilter(cat: StoreCategoryType): void {
  adminFilterCategory = cat;
}

export function setAdminStoreStatusFilter(status: 'all' | 'active' | 'hidden' | 'soldout'): void {
  adminFilterStatus = status;
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

const CATEGORY_ORDER: StoreCategoryType[] = ['report', 'voucher', 'ebook', 'lecture', 'consulting', 'goods'];

const CATEGORY_META: Record<StoreCategoryType, { title: string; badgeColor: string; icon: string }> = {
  all: { title: '전체 상품', badgeColor: '#f2ca50', icon: 'apps' },
  report: { title: '4대 정밀 감정 리포트', badgeColor: '#f2ca50', icon: 'auto_awesome' },
  voucher: { title: '상품권 · 바우처', badgeColor: '#38bdf8', icon: 'confirmation_number' },
  ebook: { title: '전자책 · 가이드', badgeColor: '#f2ca50', icon: 'menu_book' },
  lecture: { title: '강의 · VOD', badgeColor: '#f2ca50', icon: 'smart_display' },
  consulting: { title: '1:1 상담권', badgeColor: '#dfe2f1', icon: 'support_agent' },
  goods: { title: '부적 · 굿즈', badgeColor: '#dfe2f1', icon: 'token' },
};

export function renderAdminStorePanel(editingProductId?: string | null, forcedSubTab?: 'products' | 'register' | 'orders' | 'categories'): string {
  const allProducts = getAllStoreProducts();
  const orders = getAllStoreOrders();

  const activeCount = allProducts.filter(p => p.status === 'active').length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);

  const editItem = editingProductId ? getStoreProductById(editingProductId) : undefined;
  const activeTab = forcedSubTab || (editItem ? 'register' : adminSubTab);

  const allCategories = getStoreCategories();
  // 카테고리별 개수 카운트
  const categoryCounts: Record<string, number> = {
    all: allProducts.length,
  };
  for (const c of allCategories) {
    categoryCounts[c.id] = allProducts.filter(p => p.category === c.id).length;
  }

  // 판매 상태별 개수 카운트
  const statusCounts = {
    all: allProducts.length,
    active: allProducts.filter(p => p.status === 'active').length,
    hidden: allProducts.filter(p => p.status === 'hidden').length,
    soldout: allProducts.filter(p => p.status === 'soldout').length,
  };

  // 검색 및 상태 필터링
  let filtered = allProducts.filter(p => {
    if (adminFilterCategory !== 'all' && p.category !== adminFilterCategory) return false;
    if (adminFilterStatus !== 'all' && p.status !== adminFilterStatus) return false;
    if (adminSearchQuery) {
      const q = adminSearchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTag = p.tagLine.toLowerCase().includes(q);
      if (!matchTitle && !matchTag) return false;
    }
    return true;
  });

  // 최신 등록순 우선 정렬
  filtered.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%; box-sizing: border-box;">
      
      <!-- [서브 탭 1] 상품 목록 및 카테고리별 관리 -->
      <div style="display: ${activeTab === 'products' ? 'block' : 'none'};">
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.35rem;">
          
          <!-- 상단 카테고리 탭 & 검색 -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
            <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
              <button type="button" class="btn-admin-store-filter ${adminFilterCategory === 'all' ? 'active' : ''}" data-cat="all" style="background: ${adminFilterCategory === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${adminFilterCategory === 'all' ? '#1c1500' : '#cbd5e1'}; font-weight: 800; border: 1px solid ${adminFilterCategory === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                <span class="material-symbols-outlined" style="font-size: 16px;">apps</span>
                전체 (${categoryCounts.all})
              </button>
              ${allCategories.filter(c => c.id !== 'all').map(cat => {
                const isSel = adminFilterCategory === cat.id;
                return `
                  <button type="button" class="btn-admin-store-filter ${isSel ? 'active' : ''}" data-cat="${cat.id}" style="background: ${isSel ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${isSel ? '#1c1500' : '#cbd5e1'}; font-weight: ${isSel ? '800' : '600'}; border: 1px solid ${isSel ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">${cat.icon || 'category'}</span>
                    ${cat.label} (${categoryCounts[cat.id] || 0})
                  </button>
                `;
              }).join('')}
            </div>

            <!-- 검색창 및 상품 등록 바로가기 -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="text" id="admin-store-search-input" value="${esc(adminSearchQuery)}" placeholder="상품명 검색..." style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.75rem; border-radius: 8px; font-size: 0.82rem; width: 170px;" />
              <button type="button" class="admin-tab-btn" data-tab="tab-store-register" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;">
                <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
                상품 등록
              </button>
            </div>
          </div>

          <!-- [판매 상태 필터 탭 (전체 / 판매중 / 숨김 / 품절)] -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.15rem; background: rgba(0, 0, 0, 0.2); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span style="font-size: 0.76rem; color: #94a3b8; font-weight: 700; margin-right: 0.25rem;">상태 필터:</span>
              <button type="button" class="btn-admin-status-filter ${adminFilterStatus === 'all' ? 'active' : ''}" data-status="all" style="background: ${adminFilterStatus === 'all' ? 'rgba(242, 202, 80, 0.15)' : 'transparent'}; border: 1px solid ${adminFilterStatus === 'all' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.12)'}; color: ${adminFilterStatus === 'all' ? 'var(--primary)' : '#cbd5e1'}; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; cursor: pointer;">
                전체 (${statusCounts.all})
              </button>
              <button type="button" class="btn-admin-status-filter ${adminFilterStatus === 'active' ? 'active' : ''}" data-status="active" style="background: ${adminFilterStatus === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'transparent'}; border: 1px solid ${adminFilterStatus === 'active' ? '#22c55e' : 'rgba(255, 255, 255, 0.12)'}; color: ${adminFilterStatus === 'active' ? '#4ade80' : '#cbd5e1'}; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; cursor: pointer;">
                판매중 (${statusCounts.active})
              </button>
              <button type="button" class="btn-admin-status-filter ${adminFilterStatus === 'hidden' ? 'active' : ''}" data-status="hidden" style="background: ${adminFilterStatus === 'hidden' ? 'rgba(148, 163, 184, 0.2)' : 'transparent'}; border: 1px solid ${adminFilterStatus === 'hidden' ? '#94a3b8' : 'rgba(255, 255, 255, 0.12)'}; color: ${adminFilterStatus === 'hidden' ? '#fff' : '#cbd5e1'}; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; cursor: pointer;">
                종료 (${statusCounts.hidden})
              </button>
              <button type="button" class="btn-admin-status-filter ${adminFilterStatus === 'soldout' ? 'active' : ''}" data-status="soldout" style="background: ${adminFilterStatus === 'soldout' ? 'rgba(239, 68, 68, 0.15)' : 'transparent'}; border: 1px solid ${adminFilterStatus === 'soldout' ? '#ef4444' : 'rgba(255, 255, 255, 0.12)'}; color: ${adminFilterStatus === 'soldout' ? '#f87171' : '#cbd5e1'}; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; cursor: pointer;">
                품절 (${statusCounts.soldout})
              </button>
            </div>
            <div style="font-size: 0.74rem; color: #94a3b8;">
              조회 결과: <strong style="color: #fff;">${filtered.length}</strong>개
            </div>
          </div>

          <!-- 상품 목록 테이블 -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; color: #dfe2f1;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                  <th style="padding: 0.75rem 0.6rem;">상품명 &amp; 한 줄 소개</th>
                  <th style="padding: 0.75rem 0.6rem;">카테고리</th>
                  <th style="padding: 0.75rem 0.6rem;">판매 가격</th>
                  <th style="padding: 0.75rem 0.6rem;">누적 판매</th>
                  <th style="padding: 0.75rem 0.6rem;">등록일</th>
                  <th style="padding: 0.75rem 0.6rem;">판매 상태 (즉시 저장)</th>
                  <th style="padding: 0.75rem 0.6rem; text-align: right;">관리 조치</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr><td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">조건에 일치하는 상품이 없습니다.</td></tr>
                ` : filtered.map(p => {
                  const catItem = allCategories.find(c => c.id === p.category);
                  const meta = CATEGORY_META[p.category] || { title: p.category, badgeColor: '#f2ca50', icon: 'menu_book' };
                  const displayCatTitle = catItem ? esc(catItem.label) : meta.title;
                  const displayIcon = p.thumbnailIcon || catItem?.icon || meta.icon || 'category';
                  const regDateStr = p.createdAt ? p.createdAt.slice(0, 10).replace(/-/g, '.') : '-';

                  return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                      <td style="padding: 0.75rem 0.6rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                          <span class="material-symbols-outlined" style="color: var(--primary); font-size: 22px;">${displayIcon}</span>
                          <div>
                            <strong style="color: #fff; font-size: 0.88rem;">${esc(p.title)}</strong>
                            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem;">${esc(p.tagLine)}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding: 0.75rem 0.6rem;">
                        <span style="background: rgba(242,202,80,0.12); color: ${meta.badgeColor}; padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.74rem; font-weight: 700; white-space: nowrap;">
                          ${displayCatTitle}
                        </span>
                      </td>
                      <td style="padding: 0.75rem 0.6rem; font-weight: 800; color: var(--primary); font-size: 0.9rem; white-space: nowrap;">
                        ₩ ${p.price.toLocaleString()}
                      </td>
                      <td style="padding: 0.75rem 0.6rem; color: #dfe2f1; font-weight: 800; white-space: nowrap;">
                        ${p.salesCount || 0}건
                      </td>
                      <td style="padding: 0.75rem 0.6rem; color: #94a3b8; font-size: 0.76rem; white-space: nowrap;">
                        ${regDateStr}
                      </td>
                      <td style="padding: 0.75rem 0.6rem;">
                        <select class="select-product-status-quick" data-product-id="${p.id}" data-product-title="${esc(p.title)}" style="background: var(--surface-container-low); border: 1px solid ${p.status === 'hidden' ? '#94a3b8' : p.status === 'active' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; color: ${p.status === 'active' ? '#4ade80' : p.status === 'soldout' ? '#f87171' : '#94a3b8'}; padding: 0.3rem 0.55rem; border-radius: 6px; font-size: 0.76rem; font-weight: 800; cursor: pointer;">
                          <option value="active" ${p.status === 'active' ? 'selected' : ''}>판매중</option>
                          <option value="hidden" ${p.status === 'hidden' ? 'selected' : ''}>종료</option>
                          <option value="soldout" ${p.status === 'soldout' ? 'selected' : ''}>품절</option>
                        </select>
                      </td>
                      <td style="padding: 0.75rem 0.6rem; text-align: right; white-space: nowrap;">
                        ${(p.category === 'ebook' || p.id.includes('book')) ? `
                          <a href="/reader?bookId=${p.id}" data-nav="/reader?bookId=${p.id}" style="background: rgba(59, 130, 246, 0.18); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.2rem; margin-right: 0.3rem;" title="관리자 권한으로 전 22페이지 고화질 뷰어 즉시 검수">
                            <span class="material-symbols-outlined" style="font-size: 14px;">visibility</span>
                            뷰어검수
                          </a>
                        ` : ''}
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
                <span class="material-symbols-outlined" style="color: var(--primary);">edit_document</span>
                ${editItem ? `[${esc(editItem.title)}] 상품 정보 수정` : '신규 상품 등록 (CMS)'}
              </h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 0 0;">
                네이버 쇼핑형 멀티 갤러리와 세로 상세페이지 이미지를 포함한 상품 정보를 등록합니다.
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${editItem ? `
                <button type="button" id="btn-cancel-edit-product" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.78rem; font-weight: 600; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                  <span class="material-symbols-outlined" style="font-size: 15px;">close</span>
                  수정 취소하고 목록으로
                </button>
              ` : `
                <button type="button" class="admin-tab-btn" data-tab="tab-store" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #dfe2f1; font-size: 0.78rem; font-weight: 600; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                  <span class="material-symbols-outlined" style="font-size: 15px;">format_list_bulleted</span>
                  상품 목록 보기
                </button>
              `}
            </div>
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
                  ${allCategories.filter(c => c.id !== 'all').map(c => `
                    <option value="${c.id}" ${editItem?.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>
                  `).join('')}
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
                    <option value="hidden" ${editItem?.status === 'hidden' ? 'selected' : ''}>종료</option>
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

            <!-- [네이버 쇼핑 스타일 멀티 이미지 업로드 센터 (스마트스토어 표준 대응)] -->
            <div style="background: rgba(0, 0, 0, 0.35); border: 1.5px dashed rgba(242, 202, 80, 0.45); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.15rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                <label style="font-size: 0.88rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.4rem;">
                  <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">collections</span>
                  네이버 쇼핑 표준 상품 사진 등록 센터
                </label>
                <span style="font-size: 0.72rem; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); padding: 0.15rem 0.5rem; border-radius: 4px;">
                  스마트스토어 표준 규격 (대표 1장 + 추가 9장 + 상세 5장)
                </span>
              </div>

              <!-- 1. 대표 썸네일 사진 (1장 필수) -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.95rem; margin-bottom: 0.85rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                  <span>① 대표 썸네일 사진 (목록 및 첫 화면 메인 노출) *</span>
                  <span style="font-size: 0.7rem; color: var(--text-muted);">네이버 쇼핑 권장 1:1 정방형 (1000x1000)</span>
                </div>
                
                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                  <!-- 미리보기 박스 -->
                  <div id="cms-thumb-preview-box" style="width: 100px; height: 100px; border-radius: 10px; border: 1.5px solid rgba(242, 202, 80, 0.35); background: #0c0f17; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                    <img id="cms-thumb-preview-img" src="${editItem?.thumbnailUrl || ''}" alt="대표 미리보기" style="width: 100%; height: 100%; object-fit: cover; display: ${editItem?.thumbnailUrl ? 'block' : 'none'};" />
                    <span id="cms-thumb-placeholder" class="material-symbols-outlined" style="font-size: 36px; color: var(--text-muted); display: ${editItem?.thumbnailUrl ? 'none' : 'block'};">add_photo_alternate</span>
                  </div>

                  <!-- 업로드 조작 버튼 및 URL 보조 -->
                  <div style="flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 0.45rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                      <label for="cms-thumb-file-input" style="background: var(--primary); color: #1c1500; font-weight: 800; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 2px 8px rgba(242,202,80,0.3);">
                        <span class="material-symbols-outlined" style="font-size: 16px;">upload_file</span>
                        대표 사진 파일 첨부하기
                      </label>
                      <input type="file" id="cms-thumb-file-input" accept="image/*" style="display: none;" />
                      <button type="button" id="btn-remove-thumb-img" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; font-size: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer;">
                        사진 지우기
                      </button>
                    </div>
                    <input type="text" id="cms-thumb-url" value="${editItem ? esc(editItem.thumbnailUrl) : ''}" placeholder="또는 이미지 웹 URL 직접 입력 (https://...)" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.45rem 0.65rem; border-radius: 6px; font-size: 0.78rem;" />
                  </div>
                </div>
              </div>

              <!-- 2. 네이버 쇼핑형 서브 갤러리 추가 사진 (최대 9장) -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.95rem; margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
                  <div>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1;">② 추가 갤러리 사진 (상세 뷰 슬라이드/썸네일 컷 - 최대 9장)</span>
                    <span style="font-size: 0.7rem; color: #94a3b8; margin-left: 0.35rem;">* 여러 장 한 번에 선택 가능</span>
                  </div>
                  <label for="cms-gallery-file-input" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-size: 0.76rem; font-weight: 800; padding: 0.35rem 0.8rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">library_add</span>
                    + 사진 추가 (다중 선택)
                  </label>
                  <input type="file" id="cms-gallery-file-input" accept="image/*" multiple style="display: none;" />
                </div>
                
                <!-- 갤러리 썸네일 프리뷰 컨테이너 -->
                <div id="cms-gallery-preview-container" style="display: flex; gap: 0.65rem; flex-wrap: wrap; min-height: 64px; align-items: center; background: rgba(0,0,0,0.25); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem;">
                  ${(editItem?.galleryImages || []).map((imgUrl, idx) => `
                    <div class="cms-gallery-thumb-chip" data-idx="${idx}" style="position: relative; width: 62px; height: 62px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
                      <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" class="btn-del-gallery-img" data-idx="${idx}" title="삭제" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.75); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
                    </div>
                  `).join('')}
                  ${(!editItem?.galleryImages || editItem.galleryImages.length === 0) ? `
                    <span id="cms-gallery-empty-msg" style="font-size: 0.74rem; color: var(--text-muted); padding: 0 0.5rem;">등록된 추가 갤러리 사진이 없습니다. [+ 사진 추가] 버튼을 눌러 최대 9장까지 등록하세요.</span>
                  ` : ''}
                </div>
                <input type="hidden" id="cms-gallery-data" value="${editItem?.galleryImages ? esc(JSON.stringify(editItem.galleryImages)) : '[]'}" />
              </div>

              <!-- 3. 상세페이지 본문 안내 이미지 (최대 5장) -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.95rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
                  <div>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1;">③ 상세페이지 본문 안내 이미지 (세로 긴 통이미지 - 최대 5장)</span>
                    <span style="font-size: 0.7rem; color: #94a3b8; margin-left: 0.35rem;">* 상세페이지 본문에 시원하게 스크롤 노출</span>
                  </div>
                  <label for="cms-detail-file-input" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 0.76rem; font-weight: 800; padding: 0.35rem 0.8rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">post_add</span>
                    + 상세 컷 추가 (다중 선택)
                  </label>
                  <input type="file" id="cms-detail-file-input" accept="image/*" multiple style="display: none;" />
                </div>
                
                <!-- 상세 이미지 썸네일 프리뷰 컨테이너 -->
                <div id="cms-detail-preview-container" style="display: flex; gap: 0.65rem; flex-wrap: wrap; min-height: 64px; align-items: center; background: rgba(0,0,0,0.25); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem;">
                  ${(editItem?.detailImages || []).map((imgUrl, idx) => `
                    <div class="cms-detail-thumb-chip" data-idx="${idx}" style="position: relative; width: 62px; height: 62px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
                      <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" class="btn-del-detail-img" data-idx="${idx}" title="삭제" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.75); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
                    </div>
                  `).join('')}
                  ${(!editItem?.detailImages || editItem.detailImages.length === 0) ? `
                    <span id="cms-detail-empty-msg" style="font-size: 0.74rem; color: var(--text-muted); padding: 0 0.5rem;">등록된 상세페이지 안내 이미지가 없습니다. [+ 상세 컷 추가] 버튼을 눌러 최대 5장까지 등록하세요.</span>
                  ` : ''}
                </div>
                <input type="hidden" id="cms-detail-data" value="${editItem?.detailImages ? esc(JSON.stringify(editItem.detailImages)) : '[]'}" />
              </div>
            </div>

            <!-- 제공 파일 링크 및 배송 설정 -->
            <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 1rem; margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <label style="font-size: 0.82rem; font-weight: 700; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">attach_file</span>
                  구매자 제공 파일 / 열람 링크 (다운로드 URL) *
                </label>
                <!-- 내 PC에서 PDF 직접 선택 버튼 -->
                <div>
                  <label for="cms-digital-file-input" style="background: rgba(242, 202, 80, 0.15); border: 1px solid var(--primary); color: var(--primary); padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <span class="material-symbols-outlined" style="font-size: 15px;">upload_file</span>
                    내 PC에서 PDF/전자책 파일 첨부
                  </label>
                  <input type="file" id="cms-digital-file-input" accept=".pdf,.epub,.zip,.txt" style="display: none;" />
                </div>
              </div>

              <input type="text" id="cms-content-payload" required value="${editItem ? esc(editItem.contentPayload) : ''}" placeholder="예: /downloads/내전자책.pdf 또는 구글 드라이브 다운로드 링크, VOD 웹 링크" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem; border-radius: 6px; font-size: 0.85rem;" />
              
              <div id="cms-digital-file-status" style="margin-top: 0.35rem; font-size: 0.74rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
                <span class="material-symbols-outlined" style="font-size: 14px; color: #38bdf8;">info</span>
                <span>💡 위 [내 PC에서 PDF 파일 첨부] 버튼을 누르시거나, 구글 드라이브 / 노션 / 클라우드 공유 링크를 직접 붙여넣으시면 됩니다.</span>
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
                <span class="material-symbols-outlined" style="color: var(--primary); font-size: 22px;">receipt_long</span>
                스토어 실시간 결제 장부 (Orders)
              </h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 0 0;">
                스토어에서 발생한 결제 내역, 주문 상태 및 환불 승인을 관리합니다.
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div style="background: rgba(242,202,80,0.1); border: 1px solid rgba(242,202,80,0.25); border-radius: 8px; padding: 0.35rem 0.75rem; font-size: 0.78rem; color: #dfe2f1;">
                총 주문 <strong style="color: var(--primary);">${orders.length}건</strong> / 누적 매출 <strong style="color: var(--primary);">₩ ${totalRevenue.toLocaleString()}</strong>
              </div>
            </div>
          </div>
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
                  <th style="padding: 0.6rem;">상태 / 환불 관리</th>
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
                        ${o.status === 'refunded' ? `
                          <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700;">환불완료</span>
                        ` : (o.refundRequested ? `
                          <button type="button" class="btn-admin-approve-refund" data-order-id="${o.orderId}" style="background: #ef4444; color: #fff; font-size: 0.74rem; font-weight: 800; border: none; border-radius: 6px; padding: 0.35rem 0.65rem; cursor: pointer;" title="사유: ${esc(o.refundReason || '')}">
                            환불 승인 (${esc(o.refundReason || '요청')})
                          </button>
                        ` : (o.status === 'pending' ? `
                          <div style="display: inline-flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                            <span style="background: rgba(242, 202, 80, 0.18); color: #f2ca50; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; border: 1px solid rgba(242, 202, 80, 0.35);">입금대기</span>
                            <button type="button" class="btn-admin-approve-bank-deposit" data-order-id="${o.orderId}" style="background: var(--primary); color: #000; font-size: 0.72rem; font-weight: 800; border: none; border-radius: 4px; padding: 0.25rem 0.55rem; cursor: pointer; transition: all 0.15s ease;" title="입금 확인 후 즉시 주문 승인">
                              입금 승인
                            </button>
                          </div>
                        ` : `
                          <span style="background: rgba(52,211,153,0.15); color: #4ade80; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">결제완료</span>
                        `))}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- [서브 탭 4] 스토어 카테고리 관리 패널 -->
      <div style="display: ${activeTab === 'categories' ? 'block' : 'none'};">
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.85rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 0.35rem 0; display: flex; align-items: center; gap: 0.45rem;">
              <span class="material-symbols-outlined" style="color: var(--primary);">category</span>
              스토어 카테고리 관리 (${allCategories.filter(c => c.id !== 'all').length}개)
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">스토어에 노출되는 카테고리를 자유롭게 추가하거나 삭제하여 상품 분류 체계를 구성합니다.</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 1.5rem; align-items: flex-start;">
            <!-- 신규 카테고리 등록 폼 -->
            <form id="form-admin-add-store-category" style="background: rgba(242,202,80,0.04); border: 1px solid rgba(242,202,80,0.25); border-radius: 12px; padding: 1.35rem; display: flex; flex-direction: column; gap: 1rem;">
              <h4 style="color: var(--primary); font-size: 0.95rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.35rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
                신규 스토어 카테고리 등록
              </h4>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.35rem;">카테고리 영문 식별자 (ID) *</label>
                <input type="text" id="store-cat-id" required placeholder="예: talisman, art, custom" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.85rem;" />
                <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem; display: block;">영문 소문자, 숫자, 하이픈(-)만 가능</span>
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.35rem;">카테고리 표시 명칭 *</label>
                <input type="text" id="store-cat-label" required placeholder="예: 개운 부적 · 아트웍" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.35rem;">Material 아이콘 명칭</label>
                <input type="text" id="store-cat-icon" value="category" placeholder="예: auto_awesome, token, menu_book" style="width: 100%; box-sizing: border-box; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.85rem;" />
              </div>
              <button type="submit" style="background: var(--primary); color: #1c1500; font-weight: 800; font-size: 0.85rem; border: none; padding: 0.65rem; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(242,202,80,0.25);">
                + 카테고리 추가하기
              </button>
            </form>

            <!-- 등록된 카테고리 목록 테이블 -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); background: rgba(255,255,255,0.02);">
                    <th style="padding: 0.75rem 1rem;">아이콘</th>
                    <th style="padding: 0.75rem 1rem;">표시 명칭</th>
                    <th style="padding: 0.75rem 1rem;">식별자 (ID)</th>
                    <th style="padding: 0.75rem 1rem;">상품 수</th>
                    <th style="padding: 0.75rem 1rem; text-align: right;">관리</th>
                  </tr>
                </thead>
                <tbody>
                  ${allCategories.filter(c => c.id !== 'all').map(c => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                      <td style="padding: 0.75rem 1rem;">
                        <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary); vertical-align: middle;">${c.icon || 'category'}</span>
                      </td>
                      <td style="padding: 0.75rem 1rem; font-weight: 700; color: #fff;">${esc(c.label)}</td>
                      <td style="padding: 0.75rem 1rem; font-family: monospace; color: #94a3b8;">${c.id}</td>
                      <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${categoryCounts[c.id] || 0}개</td>
                      <td style="padding: 0.75rem 1rem; text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-admin-edit-store-category" data-cat-id="${c.id}" data-cat-name="${esc(c.label)}" data-cat-icon="${c.icon || 'category'}" style="background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 6px; padding: 0.25rem 0.6rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; margin-right: 0.35rem;">
                          수정
                        </button>
                        <button type="button" class="btn-admin-del-store-category" data-cat-id="${c.id}" data-cat-name="${esc(c.label)}" data-product-count="${categoryCounts[c.id] || 0}" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.74rem; cursor: pointer;">
                          삭제
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
