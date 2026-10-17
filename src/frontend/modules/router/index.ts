/**
 * Frontend Router & SEO Metadata Manager
 * 
 * 직관적 테마 경로 체계:
 * - / : 메인 홈
 * - /saju : 종합 사주 감정
 * - /fortune : 2027 신년운세
 * - /career : 직장·이직운
 * - /wealth : 재물·투자운
 * - /love : 연애·재회·궁합
 * - /calendar : 마기 & 길일 달력
 * - /store : 마보살 스토어
 * - /study : 명리학 스터디 허브
 * - /admin : 최고 관리자 대시보드
 * - /member-dashboard : 마이페이지
 */

import { AppViewType, appState } from '../../state/app-state.js';
import { getPageByPathname, PageModule } from '../../pages/index.js';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
}

export const ROUTE_SEO_CONFIG: Record<string, SeoMetadata> = {
  landing: {
    title: '마보살 | 당신의 사주를 읽고 지금 무엇이 중요한지 알려드립니다',
    description: '자신의 사주 구조를 이해하고, 궁금한 것을 마보살에게 직접 물어보는 정통 명리 데이터 분석 시스템. 실시간 사주 대화 및 맞춤 처방 리포트.',
    keywords: '사주, 사주팔자, 사주풀이, 사주분석, 명리학, 마보살, 명리상담, 운세, 처방',
    canonicalPath: '/',
    ogTitle: '마보살 | 정통 명리 분석 및 맞춤 처방 시스템',
    ogDescription: '사주 원국과 시기별 기운을 정밀 분석하여 삶의 방향과 현실 솔루션을 명쾌하게 짚어드립니다.',
  },
  'page-saju': {
    title: '종합 사주 감정 | 무료 진단 및 4대 정밀 분석서 - 마보살',
    description: '4주 8자와 일간의 본질, 오행 분포부터 12개월 월운 해설, 상충·마·살 특화 및 VIP 완결 리포트까지 마보살의 4대 정통 사주 감정을 만나보세요.',
    keywords: '정통 사주, 무료 사주, 사주풀이, 격국, 억부, 용신, 상충살, 사주분석, 명리감정',
    canonicalPath: '/saju',
    ogTitle: '마보살 종합 사주 감정 | 4대 정밀 분석 리포트',
    ogDescription: '내 타고난 그릇과 평생의 기운 흐름을 빈틈없이 분석해 드립니다.',
  },
  'page-fortune': {
    title: '2027 신년운세 | 정미년(丁未年) 신년 총운 & 12절기 월운 비책 - 마보살',
    description: '2027년 정미년(丁未年) 화기운과 조토가 내 사주에 미치는 영향! 상반기·하반기 대운 전환과 12개월 월별 기회 및 위험 완벽 분석.',
    keywords: '2027 신년운세, 정미년 운세, 신년 총운, 토정비결, 월별 운세, 새해 사주',
    canonicalPath: '/fortune',
    ogTitle: '2027 정미년 신년운세 총운 & 월운 비책 | 마보살',
    ogDescription: '새해를 맞이하는 가장 정확한 나침반, 정미년 신년운세 리포트.',
  },
  'page-career': {
    title: '직장운·이직운세 | 퇴사 vs 잔류 판정, 이직 골든타임 처방 - 마보살',
    description: '직장 내 인간관계 스트레스, 부서 이동 시점, 이직과 퇴사의 유불리를 명리학적 기운과 대운 타이밍으로 명쾌하게 판정해 드립니다.',
    keywords: '이직운, 직장운, 퇴사 시기, 취업운, 승진운, 커리어 사주, 직장 고민',
    canonicalPath: '/career',
    ogTitle: '직장운·이직운세 정밀 처방 | 마보살',
    ogDescription: '버텨야 할 때인가, 떠나야 할 때인가? 명리학 기반 실전 커리어 타이밍 솔루션.',
  },
  'page-wealth': {
    title: '재물운·투자운세 | 공격 투자 vs 현금 보유, 손재마 방비 - 마보살',
    description: '돈이 모이는 시기와 새어나가는 시기는 정해져 있습니다. 재정적 기회를 잡는 공격 투자 적기와 손재마(損財魔) 방어 전략을 확인하세요.',
    keywords: '재물운, 투자운, 돈복, 금전운, 사업운, 손재수 방지, 부자 사주',
    canonicalPath: '/wealth',
    ogTitle: '재물운·투자운세 타이밍 리포트 | 마보살',
    ogDescription: '현금 보유 최적기부터 투자 승부처까지, 당신의 재물 지도를 읽어드립니다.',
  },
  'page-love': {
    title: '연애·재회·궁합 | 재회 연락 골든타임 & 2인 정밀 궁합 - 마보살',
    description: '상대방의 속마음과 연락 가능성 지수, 이별 후 재회 골든타임 처방 및 두 사람의 충돌 요인을 해결하는 2인 정밀 궁합 분석.',
    keywords: '재회운, 연애운, 궁합, 사주 궁합, 상대방 속마음, 재회 타이밍, 결혼운',
    canonicalPath: '/love',
    ogTitle: '연애·재회·정밀 궁합 분석 | 마보살',
    ogDescription: '그 사람과 다시 닿을 수 있을까? 관계 회복을 위한 명리 처방전.',
  },
  'page-calendar': {
    title: '마기달력 & 길일 달력 | 매일의 마기 방비와 천을귀인 길일 - 마보살',
    description: '일진과 오행의 상극으로 발생하는 마(Ma)의 기운을 사전 차단하고, 계약·이사·약속에 최적화된 천을귀인 길일을 실시간 안내합니다.',
    keywords: '마기달력, 길일달력, 손없는날, 이사택일, 계약길일, 일진달력, 만세력 달력',
    canonicalPath: '/calendar',
    ogTitle: '마기달력 & 천을귀인 길일 안내 | 마보살',
    ogDescription: '흉한 기운은 피하고 길한 기운을 취하는 365일 마보살 달력.',
  },
  store: {
    title: '마보살 스토어 | 정통 맞춤 개운 부적 & 처방 굿즈 - 마보살',
    description: '명리 분석 결과에 따라 맞춤 제작되는 디지털/실물 부적, 개운 팔찌, 처방 굿즈 및 정밀 감정 바우처를 만나보세요.',
    keywords: '개운 부적, 사주 부적, 맞춤 부적, 개운 굿즈, 액막이, 행운 아이템, 마보살 스토어',
    canonicalPath: '/store',
    ogTitle: '마보살 스토어 | 맞춤 개운 부적 & 힐링 굿즈',
    ogDescription: '나쁜 기운을 정화하고 복을 부르는 엄선된 개운 처방 아이템.',
  },
  study: {
    title: '명리학 스터디 허브 | 사주팔자 기초부터 실전 해석 - 마보살',
    description: '천간 지지, 십성, 12운성, 오행의 상생상극 등 누구나 쉽게 이해할 수 있는 정통 명리학 지식 아카이브와 실전 해설 칼럼.',
    keywords: '사주 공부, 명리학 기초, 10천간, 12지지, 십신, 오행 공부, 사주 칼럼, 마보살 스터디',
    canonicalPath: '/study',
    ogTitle: '마보살 명리학 스터디 허브',
    ogDescription: '어렵던 사주 명리를 현대적인 감각으로 쉽고 명쾌하게 배우는 공간.',
  },
  admin: {
    title: '최고 관리자 대시보드 | 마보살',
    description: '마보살 통합 운영 관리 시스템.',
    canonicalPath: '/admin',
  },
  'member-dashboard': {
    title: '마이페이지 | 마보살',
    description: '내 사주 원국 정보, 구매 내역, 발급된 감정서 리포트 보관함.',
    canonicalPath: '/member-dashboard',
  },
  cart: {
    title: '장바구니 | 마보살',
    description: '선택하신 상품 및 감정서 목록입니다.',
    canonicalPath: '/cart',
  },
  checkout: {
    title: '주문 및 결제 | 마보살',
    description: '안전한 결제 시스템을 통해 마보살 감정서를 주문하세요.',
    canonicalPath: '/checkout',
  },
  analyze: {
    title: '사주 정보 입력 | 마보살',
    description: '생년월일시와 고민을 입력하여 정확한 명리 분석을 시작합니다.',
    canonicalPath: '/analyze',
  },
  result: {
    title: '사주 감정 결과서 | 마보살',
    description: '당신의 사주 원국과 시기별 기운 분석 결과 리포트입니다.',
    canonicalPath: '/result',
  },
};

/**
 * URL 경로(Pathname)를 기반으로 AppViewType 파싱
 */
export function parseRouteFromLocation(): { view: AppViewType; pathname: string; params: Record<string, string> } {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const urlParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  urlParams.forEach((val, key) => {
    params[key] = val;
  });

  // 1. Pathname 기준 매핑
  if (pathname === '/' || pathname === '') {
    const viewParam = urlParams.get('view');
    if (viewParam) {
      return { view: mapParamToView(viewParam), pathname, params };
    }
    return { view: 'landing', pathname, params };
  }

  // 스토어 서브 경로 및 쿼리 지원 (/store/prod-xxx 또는 /store?product=xxx)
  if (pathname === '/store' || pathname === '/mall' || pathname.startsWith('/store/')) {
    if (pathname.startsWith('/store/')) {
      params.product = decodeURIComponent(pathname.replace('/store/', ''));
    }
    return { view: 'store', pathname, params };
  }

  // 스터디 서브 경로 및 쿼리 지원 (/study/article-slug 또는 /study?article=xxx)
  if (pathname === '/study' || pathname.startsWith('/study/')) {
    if (pathname.startsWith('/study/')) {
      params.article = decodeURIComponent(pathname.replace('/study/', ''));
    }
    return { view: 'study', pathname, params };
  }

  // 관리자 서브 경로 (/admin/tab-store 등)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname.startsWith('/admin/')) {
      params.tab = decodeURIComponent(pathname.replace('/admin/', ''));
    }
    return { view: 'admin', pathname, params };
  }

  if (pathname === '/mypage' || pathname === '/member-dashboard' || pathname.startsWith('/mypage/') || pathname.startsWith('/member-dashboard/')) {
    return { view: 'member-dashboard', pathname, params };
  }

  if (pathname === '/saju') return { view: 'page-saju', pathname, params };
  if (pathname === '/fortune') return { view: 'page-fortune', pathname, params };
  if (pathname === '/career') return { view: 'page-career', pathname, params };
  if (pathname === '/wealth') return { view: 'page-wealth', pathname, params };
  if (pathname === '/love') return { view: 'page-love', pathname, params };
  if (pathname === '/calendar') {
    if (urlParams.get('tab') === 'lucky') return { view: 'lucky-calendar', pathname, params };
    return { view: 'page-calendar', pathname, params };
  }
  if (pathname === '/cart') return { view: 'cart', pathname, params };
  if (pathname === '/checkout') return { view: 'checkout', pathname, params };
  if (pathname === '/analyze') return { view: 'analyze', pathname, params };
  if (pathname === '/result' || pathname === '/report') return { view: 'result', pathname, params };
  if (pathname === '/consult') return { view: 'consult', pathname, params };
  if (pathname === '/partner') return { view: 'partner', pathname, params };

  return { view: 'landing', pathname, params };
}

function mapParamToView(param: string): AppViewType {
  switch (param) {
    case 'saju': return 'page-saju';
    case 'fortune': return 'page-fortune';
    case 'career': return 'page-career';
    case 'wealth': return 'page-wealth';
    case 'love': return 'page-love';
    case 'calendar': return 'page-calendar';
    case 'magi-calendar': return 'magi-calendar';
    case 'lucky-calendar': return 'lucky-calendar';
    case 'store':
    case 'mall': return 'store';
    case 'study': return 'study';
    case 'admin': return 'admin';
    case 'member-dashboard': return 'member-dashboard';
    case 'cart': return 'cart';
    case 'checkout': return 'checkout';
    case 'analyze': return 'analyze';
    case 'loading': return 'loading';
    case 'result': return 'result';
    case 'consult': return 'consult';
    case 'report': return 'report';
    case 'partner': return 'partner';
    default: return 'landing';
  }
}

/**
 * AppViewType을 대표 URL Pathname으로 변환
 */
export function getViewPath(view: AppViewType): string {
  switch (view) {
    case 'landing': return '/';
    case 'page-saju': return '/saju';
    case 'page-fortune': return '/fortune';
    case 'page-career': return '/career';
    case 'page-wealth': return '/wealth';
    case 'page-love': return '/love';
    case 'page-calendar': return '/calendar';
    case 'magi-calendar': return '/calendar?tab=magi';
    case 'lucky-calendar': return '/calendar?tab=lucky';
    case 'store': return '/store';
    case 'study': return '/study';
    case 'admin': return '/admin';
    case 'member-dashboard': return '/member-dashboard';
    case 'cart': return '/cart';
    case 'checkout': return '/checkout';
    case 'analyze': return '/analyze';
    case 'loading': return '/analyze';
    case 'result': return '/result';
    case 'consult': return '/consult';
    case 'report': return '/result';
    case 'partner': return '/partner';
    default: return '/';
  }
}

let activePageModule: PageModule | null = null;

/**
 * 독립 Page를 Page Outlet(#page-outlet)에 마운트
 */
export function mountPageToOutlet(pathname: string, outletEl: HTMLElement): void {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const page = getPageByPathname(cleanPath);

  if (activePageModule && activePageModule.onDestroy) {
    activePageModule.onDestroy();
  }

  const state = appState.getState();
  const urlParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  urlParams.forEach((v, k) => { params[k] = v; });

  outletEl.innerHTML = page.render({ state, params, pathname: cleanPath });
  activePageModule = page;

  if (page.onMount) {
    page.onMount(outletEl, { state, params, pathname: cleanPath });
  }

  // 내비게이션 active 스타일 동기화
  syncNavActiveState(cleanPath);
}

/**
 * 네비게이션 헤더 및 바텀 독 활성화 상태 동기화
 */
export function syncNavActiveState(pathname: string): void {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // PC 헤더 링크
  document.querySelectorAll('.pc-nav-item').forEach(el => {
    const navPath = el.getAttribute('data-nav') || el.getAttribute('href');
    if (navPath === cleanPath) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // 모바일 드로어 링크
  document.querySelectorAll('.mobile-drawer-item').forEach(el => {
    const navPath = el.getAttribute('data-nav') || el.getAttribute('href');
    if (navPath === cleanPath) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // 카테고리 상단 탭
  document.querySelectorAll('.cat-tab-btn').forEach(el => {
    const navPath = el.getAttribute('data-nav') || el.getAttribute('href');
    if (navPath === cleanPath) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

/**
 * 페이지 이동 함수 (History API pushState + Page Outlet 갱신 + SEO 갱신)
 */
export function navigateTo(target: AppViewType | string, options?: { replace?: boolean; query?: Record<string, string> }): void {
  let targetView: AppViewType;
  let targetPath = '';

  if (target.startsWith('/')) {
    targetPath = target;
    const dummyUrl = new URL(target, window.location.origin);
    const pathOnly = dummyUrl.pathname;
    if (pathOnly === '/saju') targetView = 'page-saju';
    else if (pathOnly === '/fortune') targetView = 'page-fortune';
    else if (pathOnly === '/career') targetView = 'page-career';
    else if (pathOnly === '/wealth') targetView = 'page-wealth';
    else if (pathOnly === '/love') targetView = 'page-love';
    else if (pathOnly === '/calendar') targetView = 'page-calendar';
    else if (pathOnly === '/store') targetView = 'store';
    else if (pathOnly === '/study') targetView = 'study';
    else if (pathOnly === '/admin') targetView = 'admin';
    else if (pathOnly === '/member-dashboard' || pathOnly === '/mypage') targetView = 'member-dashboard';
    else if (pathOnly === '/cart') targetView = 'cart';
    else if (pathOnly === '/checkout') targetView = 'checkout';
    else if (pathOnly === '/analyze') targetView = 'analyze';
    else if (pathOnly === '/result' || pathOnly === '/report') targetView = 'result';
    else if (pathOnly === '/consult') targetView = 'consult';
    else targetView = 'landing';
  } else {
    targetView = target as AppViewType;
    targetPath = getViewPath(targetView);
  }

  if (options?.query) {
    const qs = new URLSearchParams(options.query).toString();
    if (qs) targetPath += (targetPath.includes('?') ? '&' : '?') + qs;
  }

  if (options?.replace) {
    window.history.replaceState({ view: targetView }, '', targetPath);
  } else {
    window.history.pushState({ view: targetView }, '', targetPath);
  }

  updateSeoForView(targetView);
  appState.setView(targetView);

  const outlet = document.getElementById('page-outlet');
  if (outlet) {
    mountPageToOutlet(targetPath.split('?')[0], outlet);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 뷰 타입에 맞는 SEO 메타데이터를 문서 <head>에 실시간 반영
 */
export function updateSeoForView(view: AppViewType): void {
  const meta = ROUTE_SEO_CONFIG[view] || ROUTE_SEO_CONFIG['landing'];
  
  // 1. Document Title
  document.title = meta.title;

  // 2. Meta Description
  let descEl = document.querySelector('meta[name="description"]');
  if (!descEl) {
    descEl = document.createElement('meta');
    descEl.setAttribute('name', 'description');
    document.head.appendChild(descEl);
  }
  descEl.setAttribute('content', meta.description);

  // 3. Meta Keywords
  if (meta.keywords) {
    let kwEl = document.querySelector('meta[name="keywords"]');
    if (!kwEl) {
      kwEl = document.createElement('meta');
      kwEl.setAttribute('name', 'keywords');
      document.head.appendChild(kwEl);
    }
    kwEl.setAttribute('content', meta.keywords);
  }

  // 4. OpenGraph Tags
  const ogTitle = meta.ogTitle || meta.title;
  const ogDesc = meta.ogDescription || meta.description;

  setMetaProperty('og:title', ogTitle);
  setMetaProperty('og:description', ogDesc);
  setMetaProperty('og:url', `${window.location.origin}${meta.canonicalPath}`);

  // 5. Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', `${window.location.origin}${meta.canonicalPath}`);

  // 6. Admin 페이지의 경우 noindex, nofollow 추가
  let robotsEl = document.querySelector('meta[name="robots"]');
  if (view === 'admin') {
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.setAttribute('name', 'robots');
      document.head.appendChild(robotsEl);
    }
    robotsEl.setAttribute('content', 'noindex, nofollow');
  } else if (robotsEl) {
    robotsEl.setAttribute('content', 'index, follow');
  }
}

function setMetaProperty(prop: string, content: string): void {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
