/**
 * 마보살 명리 지식 아카데미 & 스터디 허브
 * - SEO 친화적 슬러그(Slug) 아티클 라우팅
 * - 모바일 좌측 슬라이드 드로어 네비게이션
 * - 이모티콘 제거 및 엄격한 딥 다크 & 골드 컨셉 일원화
 */

import { StudyService } from './study-service.js';
import { StudyArticle } from './types.js';

let activeCategory: string = 'all';
let currentArticleSlug: string | null = null;

export function setStudyCategory(cat: string) {
  activeCategory = cat;
  currentArticleSlug = null;
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'study');
    url.searchParams.delete('article');
    window.history.pushState({}, '', url.toString());
    document.title = '마보살 스터디 & 사주 인사이트 허브';
  }
}

export function selectStudyArticle(slugOrId: string | null) {
  currentArticleSlug = slugOrId;
  if (typeof window !== 'undefined' && slugOrId) {
    const art = StudyService.getArticleBySlug(slugOrId) || StudyService.getArticleById(slugOrId);
    if (art) {
      currentArticleSlug = art.slug;
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'study');
      url.searchParams.set('article', art.slug);
      window.history.pushState({}, '', url.toString());
      document.title = `${art.title} | 마보살 명리학 스터디`;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', art.summary);
    }
  }
}

const CATEGORIES = [
  { key: 'all', label: '전체 아티클', icon: 'auto_stories' },
  { key: 'saju_basics', label: '사주 기초 & 오행', icon: 'brightness_low' },
  { key: 'ten_gods', label: '십신 & 심리 분석', icon: 'psychology' },
  { key: 'fortune_flow', label: '대운 & 세운 흐름', icon: 'trending_up' },
  { key: 'qna_community', label: 'Q&A 명리 문답', icon: 'forum' }
];

const STUDY_SHORT_LABELS: Record<string, { short: string; desc: string; subItems: string[]; tags: string[] }> = {
  all: {
    short: '전체',
    desc: '마보살 인하우스 실전 명리학 아티클 · 해설서 · Q&A 문답 전편',
    subItems: ['사주팔자 보는 법 입문', '천간과 지지 22글자의 비밀', '십신 심리 분석', '10년 대운과 세운 흐름', '명리 Q&A'],
    tags: ['#전체글', '#실전자료', '#기초부터심화까지']
  },
  saju_basics: {
    short: '기초',
    desc: '사주팔자 원국 보는 법, 음양오행 상생상극, 천간과 지지의 근본 원리',
    subItems: ['내 사주 8글자 세우기', '음양오행 목화토금수의 균형', '천간 합충과 지지 삼합·방합'],
    tags: ['#사주기초', '#음양오행', '#천간지지', '#입문필독']
  },
  ten_gods: {
    short: '십신',
    desc: '비견·겁재, 식신·상관, 편재·정재, 편관·정관, 인성 10대 별의 심리와 적성',
    subItems: ['십신으로 읽는 나의 숨은 성격', '재성과 관성의 사회적 성공', '식상과 인성의 창의력과 지혜'],
    tags: ['#십신분석', '#적성심리', '#인간관계', '#직업적성']
  },
  fortune_flow: {
    short: '대운',
    desc: '10년 주기 인생의 계절 대운(大運)의 변곡점과 1년 세운(歲運), 삼재 개운법',
    subItems: ['대운이 바뀔 때 나타나는 징조', '삼재와 아홉수의 진실과 방비책', '인생의 황금기 포착법'],
    tags: ['#10년대운', '#세운흐름', '#삼재개운', '#타이밍']
  },
  qna_community: {
    short: '문답',
    desc: '실전에서 가장 많이 묻는 명리학 질문과 전문가의 명쾌한 1:1 답변 모음',
    subItems: ['자주 묻는 사주 질문 Best 10', '사주에 없는 오행 보완법', '사주 궁합의 진실'],
    tags: ['#명리문답', '#QnA', '#실전노하우', '#궁금증해결']
  }
};


export function renderStudyView(): string {
  StudyService.init();

  // URL에서 article slug 감지
  if (typeof window !== 'undefined' && !currentArticleSlug) {
    const urlParams = new URLSearchParams(window.location.search);
    const slugParam = urlParams.get('article');
    if (slugParam) {
      currentArticleSlug = slugParam;
    }
  }

  const articles = StudyService.getArticles(activeCategory);
  const selectedArticle = currentArticleSlug
    ? (StudyService.getArticleBySlug(currentArticleSlug) || StudyService.getArticleById(currentArticleSlug))
    : null;

  return `
  <style>
    /* Study Professional 2-Column & Mobile Left Drawer */
    .study-two-col-layout {
      display: flex;
      gap: 1.75rem;
      align-items: flex-start;
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
    }
    .study-sidebar-nav {
      width: 240px;
      min-width: 240px;
      flex-shrink: 0;
      background: var(--surface-container);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 0.75rem;
      box-sizing: border-box;
    }
    .study-content-area {
      flex: 1;
      min-width: 0;
      width: 100%;
    }
    .btn-study-category {
      width: 100%;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      text-align: left !important;
      padding: 0.8rem 1rem !important;
      gap: 0.65rem !important;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: #cbd5e1;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .btn-study-category:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #ffffff;
    }
    .btn-study-category.active {
      background: rgba(242, 202, 80, 0.14) !important;
      border-color: rgba(242, 202, 80, 0.35) !important;
      color: var(--primary) !important;
      font-weight: 800 !important;
    }

    /* 모바일 전용 트리거 바 & 좌측 슬라이드 드로어 */
    .study-mobile-filter-bar {
      display: none;
    }
    .study-drawer-backdrop {
      display: none;
    }

    @media (max-width: 860px) {
      .study-two-col-layout {
        flex-direction: column !important;
        gap: 1rem !important;
      }
      .study-mobile-filter-bar {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 1rem;
        padding: 0.6rem 0.85rem;
        background: var(--surface-container);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        box-sizing: border-box;
      }
      .btn-toggle-study-drawer {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        background: rgba(242, 202, 80, 0.14);
        border: 1px solid rgba(242, 202, 80, 0.4);
        color: var(--primary);
        padding: 0.45rem 0.85rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
      }
      .study-sidebar-nav {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        width: 280px !important;
        height: 100vh !important;
        z-index: 99999 !important;
        border-radius: 0 !important;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 10px 0 40px rgba(0, 0, 0, 0.85);
        background: #0d111a !important;
        overflow-y: auto !important;
        padding: 1.25rem !important;
      }
      .study-sidebar-nav.drawer-open {
        transform: translateX(0) !important;
      }
      .study-drawer-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 99998;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .study-drawer-backdrop.active {
        opacity: 1;
        pointer-events: auto;
      }
    }
  </style>

  <div class="study-container" style="width: 100%; max-width: 1440px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; box-sizing: border-box;">
    <!-- 상단 배너 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 14px; padding: 1.75rem 2rem; margin-bottom: 1.75rem; position: relative; overflow: hidden;">
      <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.75rem; background: rgba(242, 202, 80, 0.12); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.65rem;">
        <span class="material-symbols-outlined" style="font-size: 15px;">school</span>
        마보살 명리 지식 아카데미
      </div>
      <h1 style="color: #ffffff; font-size: 1.65rem; font-weight: 800; margin: 0 0 0.45rem; letter-spacing: -0.02em;">
        스터디 &amp; 사주 인사이트 허브
      </h1>
      <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0; line-height: 1.6;">
        어려운 한자 명리학을 현대적인 언어로 쉽게 풀었습니다. 운의 원리를 공부하고 사주 정보를 교류해보세요.
      </p>
    </div>

    <!-- [깔끔한 순수 텍스트 스터디 카테고리 메뉴 바 (설명/아이콘/박스 제거)] -->
    <nav class="study-text-category-bar" style="display: flex; align-items: center; justify-content: flex-start; gap: 0.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.25rem; margin-bottom: 2.5rem; overflow-x: auto; scrollbar-width: none;">
      ${CATEGORIES.map(c => {
        const isActive = activeCategory === c.key && !selectedArticle;
        const meta = STUDY_SHORT_LABELS[c.key] || { short: c.label };
        return `
          <button type="button" class="btn-study-category ${isActive ? 'active' : ''}" data-cat="${c.key}" style="background: none; border: none; padding: 0.65rem 1.1rem; cursor: pointer; font-size: 1.05rem; font-weight: ${isActive ? '800' : '600'}; color: ${isActive ? 'var(--primary)' : '#94a3b8'}; position: relative; transition: all 0.2s ease; letter-spacing: -0.01em; display: inline-flex; align-items: center; justify-content: center;">
            <span>${meta.short}</span>
            ${isActive ? '<span style="position: absolute; bottom: 0; left: 1rem; right: 1rem; height: 2.5px; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px rgba(242, 202, 80, 0.5);"></span>' : ''}
          </button>
        `;
      }).join('')}
    </nav>

    <!-- [하단 풀-위드 워크스페이스 (PC 시원한 그리드)] -->
    <main class="study-content-area" style="width: 100%; min-width: 0;">
      ${selectedArticle ? renderArticleDetail(selectedArticle) : renderArticleList(articles)}
    </main>
  </div>
  `;
}

function renderArticleList(articles: StudyArticle[]): string {
  if (!articles.length) {
    return `
      <div style="background: var(--surface-container); border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 4rem 2rem; text-align: center; color: var(--text-muted);">
        등록된 스터디 글이 없습니다.
      </div>
    `;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
      ${articles.map(art => `
        <article class="study-card" data-slug="${art.slug}" data-article-id="${art.id}" style="
          background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s, border-color 0.2s;
        " onmouseover="this.style.borderColor='rgba(242, 202, 80, 0.4)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.08)'; this.style.transform='translateY(0)';" >
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; background: rgba(242, 202, 80, 0.12); color: var(--primary); border-radius: 6px;">
                ${art.category}
              </span>
              <span style="font-size: 0.78rem; color: var(--text-muted);">${art.createdAt}</span>
            </div>
            <h2 style="color: #ffffff; font-size: 1.15rem; font-weight: 700; margin: 0 0 0.65rem; line-height: 1.4;">
              ${art.title}
            </h2>
            <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin: 0 0 1.25rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${art.summary}
            </p>
          </div>
          <div>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
              ${art.tags.map(t => `<span style="font-size: 0.72rem; color: var(--primary); background: rgba(242,202,80,0.08); padding: 0.15rem 0.45rem; border-radius: 4px;">#${t}</span>`).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem; font-size: 0.78rem; color: var(--text-muted);">
              <span style="display: flex; align-items: center; gap: 0.25rem;">
                <span class="material-symbols-outlined" style="font-size: 15px;">person</span> ${art.author}
              </span>
              <span style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="display: inline-flex; align-items: center; gap: 0.2rem;"><span class="material-symbols-outlined" style="font-size: 14px;">visibility</span> ${art.views}</span>
                <span style="display: inline-flex; align-items: center; gap: 0.2rem;"><span class="material-symbols-outlined" style="font-size: 14px;">chat</span> ${art.commentsCount}</span>
              </span>
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderArticleDetail(art: StudyArticle): string {
  return `
    <div style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 2rem;">
      <button class="btn-back-to-study-list" style="padding: 0.5rem 0.95rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #cbd5e1; font-size: 0.85rem; font-weight: 700; cursor: pointer; margin-bottom: 1.5rem; display: inline-flex; align-items: center; gap: 0.35rem;">
        <span class="material-symbols-outlined" style="font-size: 17px;">arrow_back</span>
        목록으로 돌아가기
      </button>

      <div style="font-size: 0.8rem; color: var(--primary); font-weight: 700; margin-bottom: 0.4rem; text-transform: uppercase;">
        ${art.category}
      </div>
      <h1 style="color: #ffffff; font-size: 1.7rem; font-weight: 800; margin: 0 0 1rem; line-height: 1.35;">
        ${art.title}
      </h1>
      <div style="display: flex; gap: 1.25rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem; flex-wrap: wrap;">
        <span>작성: ${art.author}</span>
        <span>등록일: ${art.createdAt}</span>
        <span>조회수: ${art.views.toLocaleString()}회</span>
        <span>슬러그(SEO): <code style="color: var(--primary); background: rgba(242,202,80,0.1); padding: 0.1rem 0.4rem; border-radius: 4px;">/${art.slug}</code></span>
      </div>

      <div style="color: #dfe2f1; font-size: 0.98rem; line-height: 1.8; margin-bottom: 3rem; white-space: pre-wrap;">
        ${art.content}
      </div>

      <!-- 커뮤니티 의견/댓글 섹션 -->
      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.75rem;">
        <h3 style="color: #ffffff; font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">forum</span>
          스터디 문답 &amp; 커뮤니티 댓글 (${art.commentsCount})
        </h3>
        <div style="display: flex; gap: 0.65rem; margin-bottom: 1.5rem;">
          <input type="text" placeholder="명리학적 궁금증이나 의견을 남겨보세요..." style="flex: 1; padding: 0.75rem 1rem; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 0.88rem;" />
          <button style="padding: 0.75rem 1.25rem; background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 8px; cursor: pointer;">
            등록
          </button>
        </div>
      </div>
    </div>
  `;
}
