/**
 * 마보살 명리 지식 아카데미 & 스터디 허브 (CMS 전면 개편 버전)
 * - 동적 카테고리 자유 추가, 수정, 삭제 (Category Manager)
 * - 스터디 글(Article) 등록, 수정, 삭제 (Full CRUD)
 * - SEO 친화적 슬러그 라우팅 및 독립 페이지 구조
 * - 깔끔한 딥 다크 & 골드 미니멀 프리미엄 디자인
 */

import { StudyService } from './study-service.js';
import { AuthService } from '../../state/auth-service.js';
import { StudyArticle, StudyCategory } from './types.js';

let activeCategory: string = 'all';
let currentArticleSlug: string | null = null;
let editingArticleId: string | null = null;

export function setStudyCategory(cat: string) {
  activeCategory = cat;
  currentArticleSlug = null;
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.pathname = '/study';
    url.searchParams.delete('article');
    if (cat === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', cat);
    window.history.pushState({ view: 'study', category: cat }, '', url.toString());
    document.title = '마보살 스터디 & 사주 인사이트 허브';
  }
}

export function selectStudyArticle(slugOrId: string | null, updateHistory: boolean = true) {
  currentArticleSlug = slugOrId;
  if (typeof window !== 'undefined') {
    if (slugOrId) {
      const art = StudyService.getArticleBySlug(slugOrId) || StudyService.getArticleById(slugOrId);
      if (art) {
        currentArticleSlug = art.slug;
        StudyService.incrementViews(art.id);
        if (updateHistory) {
          const newPath = `/study/${encodeURIComponent(art.slug)}`;
          window.history.pushState({ view: 'study', article: art.slug }, '', newPath);
        }
        document.title = `${art.title} | 마보살 명리학 스터디`;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', art.summary);
      }
    } else {
      if (updateHistory) {
        window.history.pushState({ view: 'study' }, '', '/study');
      }
      document.title = '마보살 스터디 & 사주 인사이트 허브';
    }
  }
}

function triggerAppRerender() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('study-state-changed'));
  }
}

export function renderStudyView(): string {
  StudyService.init();

  // URL에서 파라미터 파싱 및 명시적 리셋
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const slugParam = urlParams.get('article');
    const catParam = urlParams.get('category');
    const pathname = window.location.pathname;

    if (slugParam) {
      currentArticleSlug = slugParam;
    } else if (pathname.startsWith('/study/') && pathname !== '/study/' && pathname !== '/study') {
      const pathSlug = decodeURIComponent(pathname.replace('/study/', '').replace(/\/+$/, ''));
      currentArticleSlug = pathSlug || null;
    } else {
      // /study 기본 경로로 접근하거나 상단 메뉴 클릭 시에는 상세 글 상태를 확실히 리셋하여 목록 표시!
      currentArticleSlug = null;
    }

    if (catParam) {
      activeCategory = catParam;
    }
  }

  const categories = StudyService.getCategories();
  const articles = StudyService.getArticles(activeCategory);
  const selectedArticle = currentArticleSlug
    ? (StudyService.getArticleBySlug(currentArticleSlug) || StudyService.getArticleById(currentArticleSlug))
    : null;

  const editingArticle = editingArticleId ? StudyService.getArticleById(editingArticleId) : null;

  return `
  <style>
    .study-card-hover {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .study-card-hover:hover {
      transform: translateY(-3px);
      border-color: rgba(242, 202, 80, 0.45) !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .study-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      box-sizing: border-box;
    }
    .study-action-btn:hover {
      filter: brightness(1.1);
    }
    .study-tab-item {
      background: none;
      border: none;
      padding: 0.75rem 1.15rem;
      cursor: pointer;
      font-size: 0.98rem;
      position: relative;
      transition: all 0.2s ease;
      letter-spacing: -0.01em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .study-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      box-sizing: border-box;
    }
    .study-modal-content {
      background: #141824;
      border: 1px solid rgba(242, 202, 80, 0.35);
      border-radius: 16px;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2rem;
      box-sizing: border-box;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
      position: relative;
    }
    .study-form-group {
      margin-bottom: 1.25rem;
    }
    .study-form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 0.45rem;
    }
    .study-form-input, .study-form-select, .study-form-textarea {
      width: 100%;
      padding: 0.75rem 0.95rem;
      background: #0d101a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #ffffff;
      font-size: 0.9rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .study-form-input:focus, .study-form-select:focus, .study-form-textarea:focus {
      border-color: var(--primary);
    }
  </style>

  <div class="study-container" style="width: 100%; max-width: 1440px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; box-sizing: border-box;">
    
    <!-- 상단 헤더 & 액션 워크스페이스 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 14px; padding: 1.75rem 2rem; margin-bottom: 1.75rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.25rem;">
      <div>
        <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.75rem; background: rgba(242, 202, 80, 0.12); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.65rem;">
          마보살 명리 지식 아카데미
        </div>
        <h1 style="color: #ffffff; font-size: 1.65rem; font-weight: 800; margin: 0 0 0.45rem; letter-spacing: -0.02em;">
          스터디 &amp; 사주 인사이트 허브
        </h1>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0; line-height: 1.6;">
          어려운 한자 명리학을 현대적인 언어로 쉽게 풀었습니다. 자유롭게 카테고리를 구성하고 스터디 글을 공유해보세요.
        </p>
      </div>

      <!-- 우측 컨트롤: 최고 관리자에게만 노출되는 바로가기 -->
      ${AuthService.isAdmin() ? `
        <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
          <a href="/admin?tab=tab-study-write" class="study-action-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; background: var(--primary); color: #1c1500; font-weight: 800; border: none; padding: 0.5rem 1rem; font-size: 0.82rem; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.28); border-radius: 8px;">
            <span class="material-symbols-outlined" style="font-size: 16px;">edit_document</span>
            글 작성 CMS
          </a>
          <a href="/admin?tab=tab-study-categories" class="study-action-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.18); color: #dfe2f1; padding: 0.5rem 0.9rem; font-size: 0.82rem; border-radius: 8px;">
            <span class="material-symbols-outlined" style="font-size: 16px;">category</span>
            카테고리 관리
          </a>
        </div>
      ` : ''}
    </div>

    <!-- 동적 카테고리 탭 네비게이션 바 -->
    <nav class="study-text-category-bar" style="display: flex; align-items: center; justify-content: flex-start; gap: 0.35rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.25rem; margin-bottom: 2.25rem; overflow-x: auto; scrollbar-width: none;">
      <!-- '전체' 탭 -->
      <button type="button" class="study-tab-item btn-study-category ${activeCategory === 'all' && !selectedArticle ? 'active' : ''}" data-cat="all" style="font-weight: ${activeCategory === 'all' && !selectedArticle ? '800' : '600'}; color: ${activeCategory === 'all' && !selectedArticle ? 'var(--primary)' : '#94a3b8'};">
        <span>전체 글 (${StudyService.getArticles().length})</span>
        ${activeCategory === 'all' && !selectedArticle ? '<span style="position: absolute; bottom: 0; left: 1rem; right: 1rem; height: 2.5px; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px rgba(242, 202, 80, 0.5);"></span>' : ''}
      </button>

      <!-- 동적 카테고리 탭 목록 -->
      ${categories.map(c => {
        const isActive = activeCategory === c.id && !selectedArticle;
        const count = StudyService.getArticles(c.id).length;
        return `
          <button type="button" class="study-tab-item btn-study-category ${isActive ? 'active' : ''}" data-cat="${c.id}" style="font-weight: ${isActive ? '800' : '600'}; color: ${isActive ? 'var(--primary)' : '#94a3b8'};">
            <span>${c.name} (${count})</span>
            ${isActive ? '<span style="position: absolute; bottom: 0; left: 1rem; right: 1rem; height: 2.5px; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px rgba(242, 202, 80, 0.5);"></span>' : ''}
          </button>
        `;
      }).join('')}
    </nav>

    <!-- 메인 워크스페이스 (상세 뷰 또는 카드 리스트) -->
    <main class="study-content-area" style="width: 100%; min-width: 0;">
      ${selectedArticle ? renderArticleDetail(selectedArticle) : renderArticleList(articles, activeCategory, categories)}
    </main>
  </div>

  `;
}

function renderArticleList(articles: StudyArticle[], currentCat: string, categories: StudyCategory[]): string {
  if (!articles.length) {
    return `
      <div style="background: var(--surface-container); border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 4.5rem 2rem; text-align: center; color: var(--text-muted);">
        <p style="font-size: 1.1rem; color: #ffffff; font-weight: 700; margin: 0 0 0.5rem;">
          이 카테고리에 등록된 스터디 글이 없습니다.
        </p>
        <p style="font-size: 0.88rem; margin: 0 0 1.5rem;">
          가장 먼저 실전 명리학 아티클을 등록해보세요!
        </p>
        <button type="button" class="study-action-btn btn-open-write-shortcut" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; padding: 0.6rem 1.25rem;">
          + 첫 스터디 글 작성하기
        </button>
      </div>
    `;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1.35rem;">
      ${articles.map(art => {
        const catObj = categories.find(c => c.id === art.category);
        const catName = catObj ? catObj.name : (art.categoryName || art.category);
        return `
        <article class="study-card study-card-hover" data-slug="${art.slug}" data-article-id="${art.id}" style="
          background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; box-sizing: border-box;
        ">
          <div>
            <!-- 상단 카테고리 뱃지 & 액션 버튼군 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
              <span style="font-size: 0.75rem; font-weight: 700; padding: 0.22rem 0.6rem; background: rgba(242, 202, 80, 0.12); color: var(--primary); border-radius: 6px; border: 1px solid rgba(242, 202, 80, 0.25);">
                ${catName}
              </span>

              <!-- 카드 우측 관리자 액션 (관리자에게만 노출) -->
              ${AuthService.isAdmin() ? `
                <div style="display: flex; gap: 0.35rem;" onclick="event.stopPropagation();">
                  <a href="/admin?tab=tab-study-write" class="btn-card-edit-article" data-id="${art.id}" title="관리자에서 글 수정" style="text-decoration: none; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.72rem; cursor: pointer;">
                    수정
                  </a>
                  <button type="button" class="btn-card-delete-article" data-id="${art.id}" data-title="${art.title.replace(/"/g, '&quot;')}" title="글 삭제" style="background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.25); color: #f87171; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.72rem; cursor: pointer;">
                    삭제
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- 제목 -->
            <h2 style="color: #ffffff; font-size: 1.18rem; font-weight: 700; margin: 0 0 0.65rem; line-height: 1.42; letter-spacing: -0.01em;">
              ${art.title}
            </h2>

            <!-- 요약문 -->
            <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin: 0 0 1.25rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${art.summary}
            </p>
          </div>

          <div>
            <!-- 태그 칩 -->
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.95rem;">
              ${art.tags.map(t => `<span style="font-size: 0.72rem; color: var(--primary); background: rgba(242,202,80,0.08); padding: 0.15rem 0.45rem; border-radius: 4px;">#${t}</span>`).join('')}
            </div>

            <!-- 하단 메타정보 -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.85rem; font-size: 0.78rem; color: var(--text-muted);">
              <span>${art.author} · ${art.createdAt}</span>
              <span>조회 ${art.views.toLocaleString()}</span>
            </div>
          </div>
        </article>
      `}).join('')}
    </div>
  `;
}

function renderArticleDetail(art: StudyArticle): string {
  return `
    <div style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 2.25rem; box-sizing: border-box;">
      
      <!-- 상세 상단 내비게이션 & 수정/삭제 컨트롤 바 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
        <button type="button" class="btn-back-to-study-list study-action-btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-weight: 700;">
          ← 목록으로 돌아가기
        </button>

        ${AuthService.isAdmin() ? `
          <div style="display: flex; gap: 0.5rem;">
            <a href="/admin?tab=tab-study-write" class="study-action-btn btn-goto-admin-edit" data-id="${art.id}" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(242, 202, 80, 0.14); border: 1px solid rgba(242, 202, 80, 0.35); color: var(--primary); padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.82rem; font-weight: 700;">
              ✏ 관리자에서 수정
            </a>
            <button type="button" class="btn-delete-current-article study-action-btn" data-id="${art.id}" data-title="${art.title.replace(/"/g, '&quot;')}" style="background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); color: #f87171;">
              🗑 글 삭제
            </button>
          </div>
        ` : ''}
      </div>

      <!-- 카테고리 뱃지 & 발행 메타정보 -->
      <div style="font-size: 0.82rem; color: var(--primary); font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase;">
        ${art.categoryName || art.category}
      </div>

      <h1 style="color: #ffffff; font-size: 1.85rem; font-weight: 800; margin: 0 0 1.15rem; line-height: 1.35; letter-spacing: -0.02em;">
        ${art.title}
      </h1>

      <div style="display: flex; gap: 1.25rem; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 2.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.15rem; flex-wrap: wrap;">
        <span>작성자: <strong style="color: #fff;">${art.author}</strong></span>
        <span>등록일: ${art.createdAt}</span>
        ${art.updatedAt ? `<span>최근 수정: ${art.updatedAt}</span>` : ''}
        <span>조회수: ${art.views.toLocaleString()}회</span>
        <span>SEO 한글 고유주소: <code style="color: var(--primary); background: rgba(242,202,80,0.1); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">/study/${art.slug}</code></span>
      </div>

      <!-- 본문 영역 -->
      <div style="color: #dfe2f1; font-size: 1.02rem; line-height: 1.85; margin-bottom: 3.5rem; white-space: pre-wrap; word-break: break-word;">
        ${art.content}
      </div>

      <!-- 태그 섹션 -->
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2.5rem;">
        ${art.tags.map(t => `<span style="font-size: 0.8rem; color: var(--primary); background: rgba(242,202,80,0.1); border: 1px solid rgba(242,202,80,0.25); padding: 0.25rem 0.65rem; border-radius: 6px;">#${t}</span>`).join('')}
      </div>

      <!-- 하단 목록 복귀 버튼 -->
      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 2rem; display: flex; justify-content: center;">
        <button type="button" class="btn-back-to-study-list study-action-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; padding: 0.75rem 1.75rem; font-size: 0.95rem;">
          목록으로 돌아가기
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 스터디 허브 전역 이벤트 바인딩 (Event Delegation)
// ==========================================
let studyEventsBound = false;

export function bindStudyHubEvents(): void {
  if (typeof window !== 'undefined' && studyEventsBound) return;
  studyEventsBound = true;

  // 1. 클릭 이벤트 위임
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // 카테고리 탭 클릭
    const catBtn = target.closest('.btn-study-category') as HTMLElement | null;
    if (catBtn) {
      const cat = catBtn.dataset.cat;
      if (cat) {
        setStudyCategory(cat);
        triggerAppRerender();
      }
      return;
    }

    // 아티클 카드 클릭 -> 상세 진입
    const card = target.closest('.study-card') as HTMLElement | null;
    if (card && !target.closest('.btn-card-edit-article') && !target.closest('.btn-card-delete-article')) {
      const slugOrId = card.dataset.slug || card.dataset.articleId;
      if (slugOrId) {
        selectStudyArticle(slugOrId);
        triggerAppRerender();
      }
      return;
    }

    // 목록으로 돌아가기
    if (target.closest('.btn-back-to-study-list')) {
      selectStudyArticle(null);
      triggerAppRerender();
      return;
    }

    // [중요: 글 화면에서 수정 클릭 시 팝업이 아니라 관리자 대시보드 풀스크린 에디터로 즉시 전환]
    const editBtn = target.closest('.btn-card-edit-article, .btn-goto-admin-edit, .btn-edit-current-article') as HTMLElement | null;
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = editBtn.dataset.id;
      if (id) {
        StudyService.setEditingArticleId(id);
        const adminUrl = '/admin?tab=tab-study-write&editId=' + encodeURIComponent(id);
        window.location.href = adminUrl;
      }
      return;
    }

    // 글 삭제 클릭 (고객 화면에서 관리자 접근 시)
    const deleteBtn = (target.closest('.btn-card-delete-article') || target.closest('.btn-delete-current-article')) as HTMLElement | null;
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      const title = deleteBtn.dataset.title || '해당 글';
      if (id && confirm(`정말로 [${title}] 글을 삭제하시겠습니까?\n삭제 시 복구할 수 없습니다.`)) {
        StudyService.deleteArticle(id);
        alert(`[${title}] 글이 삭제되었습니다.`);
        if (currentArticleSlug) {
          selectStudyArticle(null);
        }
        triggerAppRerender();
      }
      return;
    }
  });
}

function openArticleModal(id?: string) {
  const modal = document.getElementById('modal-study-article-form');
  if (!modal) return;

  const titleEl = document.getElementById('study-modal-title');
  const idInput = document.getElementById('study-input-id') as HTMLInputElement;
  const titleInput = document.getElementById('study-input-title') as HTMLInputElement;
  const catSelect = document.getElementById('study-select-category') as HTMLSelectElement;
  const authorInput = document.getElementById('study-input-author') as HTMLInputElement;
  const summaryInput = document.getElementById('study-input-summary') as HTMLInputElement;
  const tagsInput = document.getElementById('study-input-tags') as HTMLInputElement;
  const contentInput = document.getElementById('study-textarea-content') as HTMLTextAreaElement;

  if (id) {
    const art = StudyService.getArticleById(id);
    if (art) {
      if (titleEl) titleEl.textContent = '스터디 글 수정';
      if (idInput) idInput.value = art.id;
      if (titleInput) titleInput.value = art.title;
      if (catSelect) catSelect.value = art.category;
      if (authorInput) authorInput.value = art.author;
      if (summaryInput) summaryInput.value = art.summary;
      if (tagsInput) tagsInput.value = art.tags.join(', ');
      if (contentInput) contentInput.value = art.content;
    }
  } else {
    if (titleEl) titleEl.textContent = '새 스터디 글 작성';
    if (idInput) idInput.value = '';
    if (titleInput) titleInput.value = '';
    if (catSelect && activeCategory !== 'all') catSelect.value = activeCategory;
    if (authorInput) authorInput.value = '마보살 연구소';
    if (summaryInput) summaryInput.value = '';
    if (tagsInput) tagsInput.value = '';
    if (contentInput) contentInput.value = '';
  }

  modal.style.display = 'flex';
}

function closeArticleModal() {
  const modal = document.getElementById('modal-study-article-form');
  if (modal) modal.style.display = 'none';
  editingArticleId = null;
}

function openCategoryModal() {
  const modal = document.getElementById('modal-study-category-manager');
  if (modal) modal.style.display = 'flex';
}

function closeCategoryModal() {
  const modal = document.getElementById('modal-study-category-manager');
  if (modal) modal.style.display = 'none';
}
