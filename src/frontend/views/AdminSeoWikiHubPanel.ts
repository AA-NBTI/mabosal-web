/**
 * AdminSeoWikiHubPanel: 1순위 계층형 Topic Cluster (/fortune/...) 기반 
 * 고수요 검색 키워드 단일 페이지 웹서비스 및 위키 메쉬 통합 관제실
 * 
 * 구글 봇 지식그래프 엔티티(Fortune)와 네이버 고수요 키워드(오늘의운세, 띠별운세, 손없는날 등)를
 * 1순위 계층형 클린 URL (mabosal.com/fortune/[slug]/) 구조로 구축·통제합니다.
 */

export interface SeoKeywordPageItem {
  id: string;
  keyword: string;              // 대상 검색 키워드 (예: 오늘의운세)
  slug: string;                 // 1순위 계층형 URL 경로 (예: /fortune/today/)
  monthlySearchVolume: {        // 월간 검색수 (네이버 검색광고 실데이터)
    pc: number;
    mobile: number;
    total: number;
  };
  competition: '높음' | '중간' | '낮음';
  sajuFormType: 'no-time' | 'full' | 'zodiac-only' | 'none'; // 사주입력창 타입 (no-time: 백세인생 시간제외형)
  engineModule: string;         // 연동 마보살 정통 사주 엔진
  status: 'active' | 'draft' | 'archived'; // 운영 상태
  crossLinks: string[];         // 위키처럼 상호 연결된 타 키워드 ID 목록 (Topic Cluster Mesh)
  metaTitle: string;
  metaDescription: string;
  lastUpdated: string;
}

// 로컬 스토리지 키 (1순위 계층형 구조 v3)
const STORAGE_KEY = 'mabosal_seo_keyword_pages_v3';

// 1순위 계층형 구조 (/fortune/...) 표준 프리셋 데이터
export const FIRST_TIER_SEO_PAGES: SeoKeywordPageItem[] = [
  {
    id: 'page-today',
    keyword: '오늘의운세',
    slug: '/fortune/today/',
    monthlySearchVolume: { pc: 364300, mobile: 4840200, total: 5204500 },
    competition: '중간',
    sajuFormType: 'no-time',
    engineModule: 'DailyFortuneEngine + CalendarEngine',
    status: 'active',
    crossLinks: ['page-zodiac', 'page-son-free', 'page-free-fortune'],
    metaTitle: '오늘의 운세 - 사주로 보는 무료 오늘의 운세 | 마보살',
    metaDescription: '오늘의 일진과 생년월일 사주 명리 분석으로 확인하는 무료 오늘의 운세. 천기지수, 3대 세부지수, 길한 시간.',
    lastUpdated: '2026-10-24',
  },
  {
    id: 'page-zodiac',
    keyword: '띠별운세',
    slug: '/fortune/zodiac/',
    monthlySearchVolume: { pc: 138700, mobile: 1184800, total: 1323500 },
    competition: '높음',
    sajuFormType: 'zodiac-only',
    engineModule: 'DailyZodiacMagiEngine',
    status: 'active',
    crossLinks: ['page-today', 'page-son-free'],
    metaTitle: '띠별 오늘의 운세 - 12간지 나이대별 상세 풀이 | 마보살',
    metaDescription: '쥐띠, 소띠, 호랑이띠 등 12간지 출생연도별 오늘 하루 운세와 길흉 방비책 무료 확인.',
    lastUpdated: '2026-10-24',
  },
  {
    id: 'page-son-free',
    keyword: '손없는날',
    slug: '/fortune/son-free/',
    monthlySearchVolume: { pc: 14000, mobile: 75600, total: 89600 },
    competition: '중간',
    sajuFormType: 'none',
    engineModule: 'LunarCalendarEngine (KASI 천문연구원 표준)',
    status: 'active',
    crossLinks: ['page-today', 'page-zodiac'],
    metaTitle: '이번 달 손없는날 달력 - 이사·개업 길일 안내 | 마보살',
    metaDescription: '동서남북 방위별 악귀가 없는 날, 2026년 월별 이사하기 좋은 손없는날 실시간 달력.',
    lastUpdated: '2026-10-24',
  },
  {
    id: 'page-tojeong',
    keyword: '토정비결',
    slug: '/fortune/tojeong/',
    monthlySearchVolume: { pc: 24600, mobile: 256800, total: 281400 },
    competition: '높음',
    sajuFormType: 'no-time',
    engineModule: 'TojeongEngine + SajuCoreEngine',
    status: 'draft',
    crossLinks: ['page-today', 'page-saju'],
    metaTitle: '신년 토정비결 - 괘상으로 보는 12개월 월별 운세 | 마보살',
    metaDescription: '토정 이지함의 원작 역법 기반, 올해 나의 운세 흐름과 월별 길흉 처세 가이드.',
    lastUpdated: '2026-10-24',
  },
  {
    id: 'page-saju',
    keyword: '사주',
    slug: '/fortune/saju/',
    monthlySearchVolume: { pc: 11800, mobile: 83600, total: 95400 },
    competition: '높음',
    sajuFormType: 'full',
    engineModule: 'MabosalService (15대 엔진 통합 파사드)',
    status: 'draft',
    crossLinks: ['page-today', 'page-son-free'],
    metaTitle: '정통 인터넷 사주팔자 - 내 사주 원국과 대운의 흐름 | 마보살',
    metaDescription: '천문 역법 기반 사주팔자 8글자와 10년 대운, 오행 균형도 정밀 분석 리포트.',
    lastUpdated: '2026-10-20',
  },
  {
    id: 'page-constellation',
    keyword: '별자리운세',
    slug: '/fortune/constellation/',
    monthlySearchVolume: { pc: 98600, mobile: 717700, total: 816300 },
    competition: '높음',
    sajuFormType: 'none',
    engineModule: 'WesternZodiacEngine',
    status: 'draft',
    crossLinks: ['page-today', 'page-zodiac'],
    metaTitle: '오늘의 별자리 운세 - 12별자리 사랑·금전·행운 | 마보살',
    metaDescription: '물병자리부터 염소자리까지 매일 새롭게 갱신되는 12별자리 운세 가이드.',
    lastUpdated: '2026-10-18',
  },
];

let isModalOpen = false;
let editingPageId: string | null = null;

export function openAddSeoPageModal(pageId?: string | null): void {
  isModalOpen = true;
  editingPageId = pageId || null;
}

export function closeAddSeoPageModal(): void {
  isModalOpen = false;
  editingPageId = null;
}

/**
 * 1순위 계층형 슬러그 정규화 헬퍼 (/fortune/[slug]/)
 */
export function normalizeFirstTierSlug(input: string): string {
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^[./]+/, '').replace(/\.html$/, '');
  if (clean.startsWith('fortune/')) {
    clean = clean.substring('fortune/'.length);
  }
  clean = clean.replace(/\/+$/, '');
  return `/fortune/${clean}/`;
}

/**
 * 1순위 저장소에서 페이지 목록 불러오기 (v1, v2 자동 마이그레이션 포함)
 */
export function getSeoKeywordPages(): SeoKeywordPageItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 구버전(v2) 캐시 확인 및 1순위로 마이그레이션
      const oldRaw = localStorage.getItem('mabosal_seo_keyword_pages_v2');
      if (oldRaw) {
        try {
          const oldPages: SeoKeywordPageItem[] = JSON.parse(oldRaw);
          const migrated: SeoKeywordPageItem[] = oldPages.map(p => {
            let newSlug = p.slug;
            if (p.slug.includes('today')) newSlug = '/fortune/today/';
            else if (p.slug.includes('ddi') || p.slug.includes('zodiac')) newSlug = '/fortune/zodiac/';
            else if (p.slug.includes('son-free')) newSlug = '/fortune/son-free/';
            else if (p.slug.includes('saju')) newSlug = '/fortune/saju/';
            else if (p.slug.includes('constellation')) newSlug = '/fortune/constellation/';
            else newSlug = normalizeFirstTierSlug(p.slug);

            const newId = p.id === 'page-ddi' ? 'page-zodiac' : p.id;
            return {
              ...p,
              id: newId,
              slug: newSlug,
              crossLinks: p.crossLinks.map(c => (c === 'page-ddi' ? 'page-zodiac' : c)),
            };
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        } catch {
          // ignore
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(FIRST_TIER_SEO_PAGES));
      return FIRST_TIER_SEO_PAGES;
    }
    return JSON.parse(raw);
  } catch {
    return FIRST_TIER_SEO_PAGES;
  }
}

/**
 * 1순위 저장소에 저장
 */
export function saveSeoKeywordPages(pages: SeoKeywordPageItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch (err) {
    console.error('Failed to save SEO keyword pages:', err);
  }
}

/**
 * 1순위 기본 프리셋으로 초기화 복원
 */
export function resetToFirstTierDefaults(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(FIRST_TIER_SEO_PAGES));
}

/**
 * 페이지 삭제
 */
export function deleteSeoKeywordPage(pageId: string): void {
  const pages = getSeoKeywordPages().filter(p => p.id !== pageId);
  saveSeoKeywordPages(pages);
}

/**
 * 관리자 대시보드 SEO 위키 허브 패널 렌더링 (1순위 구조 특화)
 */
export function renderAdminSeoWikiHubPanel(): string {
  const pages = getSeoKeywordPages();

  // 총 검색량 합계
  const totalMonthlyTraffic = pages.reduce((acc, p) => acc + p.monthlySearchVolume.total, 0);
  const activeCount = pages.filter(p => p.status === 'active').length;
  const draftCount = pages.filter(p => p.status === 'draft').length;

  const editingPage = editingPageId ? pages.find(p => p.id === editingPageId) : null;

  return `
    <div class="admin-seo-wiki-hub-container" style="display: flex; flex-direction: column; gap: 1.25rem; width: 100%; box-sizing: border-box;">
      
      <!-- [상단 헤더 1]: 패널 타이틀 & 1순위 아키텍처 브리핑 -->
      <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
            <span class="material-symbols-outlined" style="color: #38bdf8; font-size: 1.5rem;">hub</span>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: #f8fafc; margin: 0;">
              SEO 키워드 웹서비스 &amp; 위키 메쉬 관제탑
            </h2>
            <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 20px;">
              1순위 계층형 구조: /fortune/...
            </span>
          </div>
          <p style="font-size: 0.82rem; color: #94a3b8; margin: 0; line-height: 1.45;">
            구글 지식그래프 엔티티(Fortune)와 네이버 검색 봇을 위한 <b>1순위 계층형 토픽 클러스터(mabosal.com/fortune/[slug]/)</b>입니다.<br>
            각 페이지는 헤더/푸터 없이 0.3초대 고속 작동하며, 하단 위키 메쉬를 통해 E-E-A-T 도메인 점수를 상호 증폭합니다.
          </p>
        </div>

        <!-- KPI 스탯 및 액션 버튼 -->
        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; align-items: center;">
          <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 0.5rem 0.85rem; text-align: right;">
            <div style="font-size: 0.68rem; color: #94a3b8; font-weight: 600;">공략 검색수 총합</div>
            <div style="font-size: 1.1rem; font-weight: 900; color: #38bdf8;">${totalMonthlyTraffic.toLocaleString()}회/월</div>
          </div>
          <div style="background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.25); border-radius: 8px; padding: 0.5rem 0.85rem; text-align: right;">
            <div style="font-size: 0.68rem; color: #94a3b8; font-weight: 600;">운영 중 서비스</div>
            <div style="font-size: 1.1rem; font-weight: 900; color: #2dd4bf;">${activeCount}개 <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 400;">(준비 ${draftCount})</span></div>
          </div>
          <button type="button" id="btn-reset-seo-defaults" style="background: rgba(255, 255, 255, 0.06); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0.55rem 0.85rem; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">restart_alt</span>
            1순위 프리셋 복원
          </button>
          <button type="button" class="btn-open-seo-modal" data-action="new" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);">
            <span class="material-symbols-outlined" style="font-size: 18px;">add_circle</span>
            새 키워드 서비스 등록
          </button>
        </div>
      </div>

      <!-- [상단 헤더 2]: 1순위 구조 빠른 접근 바로가기 바 -->
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span class="material-symbols-outlined" style="color: #f59e0b; font-size: 1.3rem;">verified</span>
          <div style="font-size: 0.82rem; color: #cbd5e1;">
            <b>1순위 Clean URL 서비스 중:</b> 모든 엔드포인트는 확장자 없이 폴더형 인덱스(<code style="color: #38bdf8; background: rgba(0,0,0,0.3); padding: 2px 5px; border-radius: 3px;">/fortune/[name]/</code>)로 표준화되어 있습니다.
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <a href="/fortune/today/" target="_blank" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; text-decoration: none; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px;">open_in_new</span>
            오늘의운세 (/fortune/today/)
          </a>
          <a href="/fortune/zodiac/" target="_blank" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; text-decoration: none; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px;">open_in_new</span>
            띠별운세 (/fortune/zodiac/)
          </a>
          <a href="/fortune/son-free/" target="_blank" style="background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.3); color: #2dd4bf; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; text-decoration: none; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px;">open_in_new</span>
            손없는날 (/fortune/son-free/)
          </a>
        </div>
      </div>

      <!-- [메인 영역 1]: 키워드 웹서비스 인벤토리 테이블 -->
      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; overflow-x: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: #f8fafc; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="color: #38bdf8; font-size: 1.1rem;">table_chart</span>
            1순위 계층형 서비스 매트릭스 (${pages.length}개)
          </h3>
          <span style="font-size: 0.73rem; color: #94a3b8;">
            * 네이버 월 750만+ 수요 공략 &middot; Topic Cluster 자동 연동
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.12); color: #94a3b8; font-size: 0.75rem;">
              <th style="padding: 0.65rem 0.75rem;">타겟 키워드</th>
              <th style="padding: 0.65rem 0.75rem;">1순위 URL 경로</th>
              <th style="padding: 0.65rem 0.75rem; text-align: right;">월간 검색수</th>
              <th style="padding: 0.65rem 0.75rem;">사주 입력창 방식</th>
              <th style="padding: 0.65rem 0.75rem;">연동 마보살 엔진</th>
              <th style="padding: 0.65rem 0.75rem;">위키 상호 링크</th>
              <th style="padding: 0.65rem 0.75rem; text-align: center;">상태</th>
              <th style="padding: 0.65rem 0.75rem; text-align: center;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${pages.map(p => {
              const sajuTypeBadge = p.sajuFormType === 'no-time' 
                ? '<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">백세인생(시간제외)</span>'
                : p.sajuFormType === 'zodiac-only'
                ? '<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">12간지 띠 전용</span>'
                : p.sajuFormType === 'full'
                ? '<span style="background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">전체 시/분 포함</span>'
                : '<span style="background: rgba(255, 255, 255, 0.08); color: #94a3b8; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">입력창 없음 (달력)</span>';

              const statusBadge = p.status === 'active'
                ? '<span style="background: rgba(45, 212, 191, 0.15); color: #2dd4bf; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">● 운영중</span>'
                : '<span style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem;">준비중</span>';

              // 연결된 링크 키워드 이름 표시
              const crossLinkNames = p.crossLinks.map(cid => {
                const target = pages.find(item => item.id === cid);
                return target ? target.keyword : cid;
              }).join(', ');

              return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                  <td style="padding: 0.75rem; font-weight: 800; color: #fff;">
                    <span style="display: flex; align-items: center; gap: 0.35rem;">
                      <span style="color: var(--primary);">#</span> ${p.keyword}
                    </span>
                  </td>
                  <td style="padding: 0.75rem; font-family: monospace;">
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                      <span style="color: #64748b; font-size: 0.72rem;">mabosal.com</span>
                      <span style="color: #38bdf8; font-weight: 700;">${p.slug}</span>
                    </div>
                  </td>
                  <td style="padding: 0.75rem; text-align: right; font-weight: 700; color: #fde68a;">
                    ${p.monthlySearchVolume.total.toLocaleString()}
                    <div style="font-size: 0.68rem; color: #94a3b8; font-weight: 400;">
                      (MO ${p.monthlySearchVolume.mobile.toLocaleString()})
                    </div>
                  </td>
                  <td style="padding: 0.75rem;">
                    ${sajuTypeBadge}
                  </td>
                  <td style="padding: 0.75rem; color: #cbd5e1; font-size: 0.75rem;">
                    ${p.engineModule}
                  </td>
                  <td style="padding: 0.75rem; color: #94a3b8; font-size: 0.73rem;">
                    🔗 ${crossLinkNames || '<span style="color:#ef4444;">고립됨</span>'}
                  </td>
                  <td style="padding: 0.75rem; text-align: center;">
                    ${statusBadge}
                  </td>
                  <td style="padding: 0.75rem; text-align: center;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      <a href="${p.slug}" target="_blank" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; padding: 0.25rem 0.5rem; text-decoration: none; font-size: 0.72rem; font-weight: 700;">
                        열기
                      </a>
                      <button type="button" class="btn-open-seo-modal" data-action="edit" data-page-id="${p.id}" style="background: rgba(255,255,255,0.06); color: #dfe2f1; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.72rem; cursor: pointer;">
                        편집
                      </button>
                      <button type="button" class="btn-delete-seo-page" data-page-id="${p.id}" data-keyword="${p.keyword}" style="background: rgba(244, 63, 94, 0.1); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 4px; padding: 0.25rem 0.45rem; font-size: 0.72rem; cursor: pointer;">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- [하단 영역]: 1순위 위키 메쉬 (Topic Cluster Link Matrix) 시각화 -->
      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem;">
        <h3 style="font-size: 0.95rem; font-weight: 800; color: #f8fafc; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="color: #f59e0b; font-size: 1.1rem;">account_tree</span>
          1순위 토픽 클러스터 상호 교차 링크망 (Topic Cluster Mesh)
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 1rem 0;">
          구글·네이버 봇이 어떤 단일 페이지로 진입하더라도 <code>/fortune/</code> 엔티티 내의 타 키워드로 크롤링이 끊김 없이 연결되도록 구축된 링크 구조입니다.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
          ${pages.map(p => `
            <div style="background: rgba(11, 15, 25, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="color: #fff; font-size: 0.85rem;">${p.keyword}</strong>
                <span style="font-size: 0.7rem; color: #38bdf8; font-family: monospace;">${p.slug}</span>
              </div>
              <div style="font-size: 0.74rem; color: #94a3b8; margin-bottom: 0.4rem;">
                발신 링크 (${p.crossLinks.length}개):
              </div>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                ${p.crossLinks.map(cid => {
                  const target = pages.find(item => item.id === cid);
                  return `
                    <span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 4px; padding: 2px 6px; font-size: 0.7rem;">
                      → ${target ? target.keyword : cid}
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- [팝업 모달]: 1순위 구조 새 키워드 서비스 등록 및 편집 모달 -->
      ${isModalOpen ? `
        <div id="modal-seo-page-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
          <div style="background: #111827; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; padding: 1.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.75rem;">
              <h3 style="margin: 0; font-size: 1.1rem; color: #fff; font-weight: 800; display: flex; align-items: center; gap: 0.4rem;">
                <span class="material-symbols-outlined" style="color: var(--primary);">edit_note</span>
                ${editingPage ? '1순위 키워드 웹서비스 편집' : '새 1순위 키워드 웹서비스 등록'}
              </h3>
              <button type="button" class="btn-close-seo-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">✕</button>
            </div>

            <form id="form-save-seo-page" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 1rem;">
              <input type="hidden" id="seo-page-id" value="${editingPage ? editingPage.id : ''}" />

              <!-- 타겟 키워드 & 1순위 URL 슬러그 -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div>
                  <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">타겟 키워드 *</label>
                  <input type="text" id="seo-input-keyword" required value="${editingPage ? editingPage.keyword : ''}" placeholder="예: 궁합, 신년운세, 사주" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;" />
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">1순위 슬러그명 * (소문자/영문)</label>
                  <div style="display: flex; align-items: center; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0 0.5rem;">
                    <span style="color: #38bdf8; font-size: 0.8rem; font-family: monospace; white-space: nowrap;">/fortune/</span>
                    <input type="text" id="seo-input-slug" required value="${editingPage ? editingPage.slug.replace(/^\/fortune\//, '').replace(/\/$/, '') : ''}" placeholder="today, gunghap 등" style="width: 100%; background: transparent; border: none; outline: none; padding: 0.5rem 0.25rem; color: #fff; font-size: 0.85rem; font-family: monospace;" />
                    <span style="color: #38bdf8; font-size: 0.8rem; font-family: monospace;">/</span>
                  </div>
                </div>
              </div>

              <!-- 사주 입력창 방식 & 운영 상태 -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div>
                  <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">사주 입력창 방식</label>
                  <select id="seo-input-saju-type" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;">
                    <option value="no-time" ${editingPage?.sajuFormType === 'no-time' ? 'selected' : ''}>백세인생 간편형 (시간 입력 제외)</option>
                    <option value="zodiac-only" ${editingPage?.sajuFormType === 'zodiac-only' ? 'selected' : ''}>12간지 띠 선택 전용</option>
                    <option value="full" ${editingPage?.sajuFormType === 'full' ? 'selected' : ''}>전체 시/분 포함 기본형</option>
                    <option value="none" ${editingPage?.sajuFormType === 'none' ? 'selected' : ''}>사주 입력창 없음 (단순 달력/조회)</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">운영 상태</label>
                  <select id="seo-input-status" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;">
                    <option value="active" ${editingPage?.status === 'active' ? 'selected' : ''}>운영중 (공개 색인)</option>
                    <option value="draft" ${(!editingPage || editingPage?.status === 'draft') ? 'selected' : ''}>준비중 (비공개)</option>
                  </select>
                </div>
              </div>

              <!-- 월간 검색수 (PC/모바일) -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div>
                  <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">월간 검색수 (PC)</label>
                  <input type="number" id="seo-input-vol-pc" value="${editingPage ? editingPage.monthlySearchVolume.pc : 10000}" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;" />
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">월간 검색수 (모바일)</label>
                  <input type="number" id="seo-input-vol-mo" value="${editingPage ? editingPage.monthlySearchVolume.mobile : 50000}" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;" />
                </div>
              </div>

              <!-- 연동 엔진 -->
              <div>
                <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">연동 마보살 엔진 모듈</label>
                <input type="text" id="seo-input-engine" value="${editingPage ? editingPage.engineModule : 'DailyFortuneEngine + CalendarEngine'}" placeholder="예: DailyFortuneEngine, GunghapEngine 등" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;" />
              </div>

              <!-- 위키 상호 교차 링크 선택 (체크박스 칩) -->
              <div>
                <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.35rem;">
                  위키 상호 교차 링크 (하단에 추천할 타 키워드 서비스 선택)
                </label>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.65rem;">
                  ${pages.filter(p => p.id !== editingPage?.id).map(p => {
                    const isChecked = editingPage ? editingPage.crossLinks.includes(p.id) : true;
                    return `
                      <label style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; color: #cbd5e1; cursor: pointer; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">
                        <input type="checkbox" name="seo-crosslink-item" value="${p.id}" ${isChecked ? 'checked' : ''} />
                        ${p.keyword} (${p.slug})
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- SEO 타이틀 & 설명 -->
              <div>
                <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">SEO 메타 타이틀</label>
                <input type="text" id="seo-input-meta-title" value="${editingPage ? editingPage.metaTitle : ''}" placeholder="예: 오늘의 운세 - 사주로 보는 무료 오늘의 운세 | 마보살" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;" />
              </div>

              <div>
                <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">SEO 메타 설명문</label>
                <textarea id="seo-input-meta-desc" rows="2" style="width: 100%; box-sizing: border-box; background: #1f2937; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #fff; font-size: 0.85rem;">${editingPage ? editingPage.metaDescription : ''}</textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                <button type="button" class="btn-close-seo-modal" style="background: rgba(255,255,255,0.08); color: #dfe2f1; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem 1rem; font-size: 0.82rem; cursor: pointer;">
                  취소
                </button>
                <button type="submit" id="btn-save-seo-page-submit" style="background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 6px; padding: 0.5rem 1.25rem; font-size: 0.82rem; cursor: pointer;">
                  저장하기
                </button>
              </div>
            </form>

          </div>
        </div>
      ` : ''}

    </div>
  `;
}
