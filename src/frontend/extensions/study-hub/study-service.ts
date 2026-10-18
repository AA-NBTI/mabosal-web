import { StudyArticle, StudyCategory, StudyComment } from './types.js';

const STORAGE_KEY_CATEGORIES = 'mabosal_study_categories_v2';
const STORAGE_KEY_ARTICLES = 'mabosal_study_articles_v2';
const STORAGE_KEY_COMMENTS = 'mabosal_study_comments_v2';

export function generateKoreanSlug(title: string): string {
  const clean = title.trim()
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return clean || ('글-' + Date.now());
}

export const INITIAL_CATEGORIES: StudyCategory[] = [
  { id: 'saju_basics', name: '사주 기초 & 오행', slug: 'saju-basics', order: 1, description: '사주팔자 원국, 음양오행, 천간지지 입문' },
  { id: 'ten_gods', name: '십신 & 심리 분석', slug: 'ten-gods', order: 2, description: '비견·겁재, 식상, 재성, 관성, 인성 분석' },
  { id: 'fortune_flow', name: '대운 & 세운 흐름', slug: 'fortune-flow', order: 3, description: '10년 대운과 세운의 흐름, 삼재 개운법' },
  { id: 'qna_community', name: 'Q&A 명리 문답', slug: 'qna-community', order: 4, description: '명리학 실전 질문과 1:1 해설 문답' },
];

export const INITIAL_ARTICLES: StudyArticle[] = [
  {
    id: 'art-001',
    slug: '십신으로-읽어내는-나의-숨은-사회적-잠재력',
    title: '십신(十神)으로 읽어내는 나의 숨은 사회적 잠재력',
    summary: '비견·겁재부터 정재·편재까지, 10가지 성분이 내 일간(나 자신)과 맺는 관계를 알기 쉽게 해설합니다.',
    content: `사주명리학에서 십신(十神)은 나(일간)를 기준으로 음양오행의 생극제화(生剋制化) 관계를 인간관계와 사회적 역할로 풀어낸 핵심 개념입니다.

1. 비견(比肩) & 겁재(劫財) - 주체성과 자립심
나와 오행이 같고 음양이 같으면 비견, 음양이 다르면 겁재입니다. 나만의 뚜렷한 주관, 추진력, 승부욕의 원동력이 됩니다.

2. 식신(食神) & 상관(傷官) - 재능과 표현력
내가 생(生)하는 기운으로, 머릿속의 아이디어를 현실로 표현하고 기술과 언어로 세상과 소통하는 힘입니다.

3. 편재(偏財) & 정재(正財) - 결과물과 현실 감각
내가 극(剋)하는 기운으로, 노력의 결실과 재물, 사업적 결과물, 현실적 시스템을 구축하는 능력입니다.

4. 편관(偏官) & 정관(正官) - 사회적 책임과 명예
나를 극(剋)하는 기운으로, 절제력과 규범, 조직에서의 리더십과 공적인 명예를 뜻합니다.

5. 편인(偏印) & 정인(正印) - 지혜와 내적 자산
나를 생(生)해주는 기운으로, 학문, 통찰력, 문서 자산, 타인으로부터 받는 사랑과 후원입니다.

자신의 사주 원국에서 어떤 십신이 가장 강력한 중심축을 이루고 있는지 파악하면, 어떤 분야에서 가장 큰 두각을 나타낼 수 있는지 선명하게 보입니다.`,
    category: 'ten_gods',
    categoryName: '십신 & 심리 분석',
    author: '마보살 학술팀',
    views: 1240,
    commentsCount: 18,
    createdAt: '2026-10-10',
    tags: ['십신', '사주기초', '적성분석'],
    isPublished: true
  },
  {
    id: 'art-002',
    slug: '삼재와-대운의-진실-공포-마케팅에-속지-않는-법',
    title: '삼재(三災)와 대운(大運)의 진실: 공포 마케팅에 속지 않는 법',
    summary: '삼재라고 해서 무조건 나쁜 일이 생길까요? 대운의 흐름과 사주 밸런스로 살펴보는 올바른 액막이 가이드.',
    content: `많은 분들이 삼재(三災)라는 단어만 들으면 큰 불안감을 느끼십니다. 하지만 명리학의 정통 이치에서 삼재는 12년 주기 중 계절적 환절기에 해당하는 3년일 뿐이며, 공포의 대상이 아닙니다.

■ 삼재의 진짜 원리
삼재는 지지 삼합(三合)의 기운이 쇠퇴하고 다음 계절로 넘어가는 전환기에 발생합니다.
- 입삼재(들삼재): 기운이 교체되기 시작하는 시기
- 눌삼재(묵삼재): 변화의 기운이 머무르는 시기
- 날삼재: 묵은 기운이 완전히 빠져나가는 시기

■ 복삼재와 악삼재를 가르는 기준
내 사주 원국에서 현재 들어오는 삼재의 오행이 나에게 꼭 필요한 '용신(用神)'으로 작용한다면, 삼재 기간에 오히려 인생 최대의 도약과 재물 성취를 이루는 '복삼재(福三災)'가 됩니다. 반대로 불필요한 기신(忌神)으로 작용할 때는 무리한 투자나 과도한 확장을 삼가고 내실을 다지는 것이 현명합니다.

운명은 정해진 저주가 아니라 계절의 날씨와 같습니다. 비가 올 때는 우산을 준비하고, 햇살이 좋을 때는 씨앗을 뿌리는 지혜가 필요합니다.`,
    category: 'fortune_flow',
    categoryName: '대운 & 세운 흐름',
    author: '마보살 마스터',
    views: 2890,
    commentsCount: 32,
    createdAt: '2026-10-08',
    tags: ['삼재', '대운', '운세비책'],
    isPublished: true
  },
  {
    id: 'art-003',
    slug: '오행-목화토금수-자가-진단과-일상-속-개운법',
    title: '오행(五行) 목·화·토·금·수 자가 진단과 일상 속 개운법',
    summary: '내 사주에 부족하거나 과도한 기운을 색상, 방위, 음식, 생활 루틴으로 보완하는 실전 팁 모음.',
    content: `오행(木, 火, 土, 金, 水)은 우주 만물을 구성하는 다섯 가지 기운의 순환입니다. 내 사주에 부족한 오행을 일상에서 채워주는 것만으로도 운의 흐름을 긍정적으로 바꿀 수 있습니다.

1. 목(木) 기운이 부족할 때:
- 새벽 산책, 실내 화분 및 식물 기르기, 목재 인테리어, 초록색 의류 착용.

2. 화(火) 기운이 부족할 때:
- 밝은 조명 활용, 햇볕 쬐기, 열정적인 유산소 운동, 붉은색 계열 소품.

3. 토(土) 기운이 부족할 때:
- 흙 밟기(맨발 걷기), 규칙적인 식습관, 노란색/베이지색 계열, 중심 잡기 명상.

4. 금(金) 기운이 부족할 때:
- 정리정돈과 미니멀리즘, 금속 액세서리, 명확한 결단 연습, 흰색 계열 의류.

5. 수(水) 기운이 부족할 때:
- 충분한 수분 섭취, 수영이나 반신욕, 밤 시간 사색과 독서, 검정/네이비 색상.

자신의 부족한 기운을 의식적으로 채워주는 작은 습관이 쌓여 큰 운의 전환을 만듭니다.`,
    category: 'saju_basics',
    categoryName: '사주 기초 & 오행',
    author: '마보살 지식허브',
    views: 3120,
    commentsCount: 25,
    createdAt: '2026-10-05',
    tags: ['오행', '개운법', '일상명리'],
    isPublished: true
  },
  {
    id: 'art-004',
    slug: '사주에-역마살이-많으면-평생-방황하나요',
    title: 'Q&A: 사주에 역마살(驛馬殺)이 많으면 평생 방황하나요?',
    summary: '현대 사회에서 역마살은 글로벌 활동, 해외 비즈니스, 크리에이터의 강력한 엔진으로 재해석됩니다.',
    content: `[질문] 사주에 역마살이 3개나 있어서 평생 정착하지 못하고 떠돌게 될까 봐 걱정입니다. 정말 그런가요?

[마보살 마스터의 답변]
과거 농경 사회에서는 한 땅에 정착하여 농사를 짓는 것이 최고의 미덕이었기 때문에, 이곳저곳 움직여야 하는 역마살(驛馬)을 부정적으로 해석하는 경우가 많았습니다.

하지만 시공간의 제약이 사라진 현대 사회에서는 정반대입니다.
- 글로벌 무역 및 해외 비즈니스
- 출장과 이동이 잦은 전문직
- 전 세계를 무대로 활동하는 디지털 노마드 및 여행 크리에이터
- 온라인을 통해 공간을 초월하여 유통하고 연결하는 이커머스 사업가

이 모든 현대적 성공의 가장 핵심적인 추진력이 바로 역마살입니다. 역마의 기운을 억누르려 하면 답답증과 방황이 되지만, 이동성과 글로벌 네트워크를 활용하는 직업으로 승화시키면 최고의 성공 무기가 됩니다.`,
    category: 'qna_community',
    categoryName: 'Q&A 명리 문답',
    author: '마보살 연구소',
    views: 1850,
    commentsCount: 14,
    createdAt: '2026-10-02',
    tags: ['역마살', '신살', '질의응답'],
    isPublished: true
  }
];

export class StudyService {
  private static categories: StudyCategory[] = [];
  private static articles: StudyArticle[] = [];
  private static comments: StudyComment[] = [];
  private static initialized = false;

  static init(): void {
    if (this.initialized) return;

    // 카테고리 로드
    const rawCats = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (rawCats) {
      try {
        this.categories = JSON.parse(rawCats);
      } catch {
        this.categories = [...INITIAL_CATEGORIES];
      }
    } else {
      this.categories = [...INITIAL_CATEGORIES];
      this.saveCategoriesToStorage();
    }

    // 아티클 로드 (기존 v1 데이터 마이그레이션 지원)
    const rawA = localStorage.getItem(STORAGE_KEY_ARTICLES) || localStorage.getItem('mabosal_study_articles_v1');
    if (rawA) {
      try {
        this.articles = JSON.parse(rawA);
      } catch {
        this.articles = [...INITIAL_ARTICLES];
      }
    } else {
      this.articles = [...INITIAL_ARTICLES];
      this.saveArticlesToStorage();
    }

    // 카테고리 이름 보정
    this.articles.forEach(art => {
      const cat = this.categories.find(c => c.id === art.category || c.slug === art.category);
      if (cat) art.categoryName = cat.name;
    });

    // 댓글 로드
    const rawC = localStorage.getItem(STORAGE_KEY_COMMENTS);
    this.comments = rawC ? JSON.parse(rawC) : [];

    this.initialized = true;
  }

  // ==========================================
  // 1. 카테고리 관리 (Category CRUD)
  // ==========================================
  static getCategories(): StudyCategory[] {
    this.init();
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  static getCategoryById(id: string): StudyCategory | undefined {
    this.init();
    return this.categories.find(c => c.id === id || c.slug === id);
  }

  static addCategory(name: string, description: string = ''): StudyCategory {
    this.init();
    const trimmed = name.trim();
    if (!trimmed) throw new Error('카테고리 이름을 입력해 주세요.');

    const id = 'cat-' + Date.now();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-');
    const newCat: StudyCategory = {
      id,
      name: trimmed,
      slug: slug || id,
      order: this.categories.length + 1,
      description: description.trim(),
    };

    this.categories.push(newCat);
    this.saveCategoriesToStorage();
    return newCat;
  }

  static updateCategory(id: string, name: string, description: string = ''): StudyCategory | undefined {
    this.init();
    const cat = this.categories.find(c => c.id === id || c.slug === id);
    if (!cat) return undefined;

    cat.name = name.trim() || cat.name;
    cat.description = description.trim();
    this.saveCategoriesToStorage();

    // 해당 카테고리를 가진 글들의 categoryName 동기화
    this.articles.forEach(art => {
      if (art.category === id || art.category === cat.slug) {
        art.categoryName = cat.name;
      }
    });
    this.saveArticlesToStorage();

    return cat;
  }

  static deleteCategory(id: string): boolean {
    this.init();
    const idx = this.categories.findIndex(c => c.id === id || c.slug === id);
    if (idx === -1) return false;

    const deletedCat = this.categories[idx];
    this.categories.splice(idx, 1);
    this.saveCategoriesToStorage();

    // 해당 카테고리에 속한 글들은 'saju_basics' 또는 첫 번째 카테고리로 재할당
    const fallbackCat = this.categories[0]?.id || 'saju_basics';
    const fallbackName = this.categories[0]?.name || '일반';
    this.articles.forEach(art => {
      if (art.category === id || art.category === deletedCat.slug) {
        art.category = fallbackCat;
        art.categoryName = fallbackName;
      }
    });
    this.saveArticlesToStorage();

    return true;
  }

  // ==========================================
  // 2. 글 관리 (Article CRUD)
  // ==========================================
  static getArticles(categoryId?: string): StudyArticle[] {
    this.init();
    if (!categoryId || categoryId === 'all') {
      return [...this.articles];
    }
    return this.articles.filter(a => a.category === categoryId);
  }

  static getArticleById(id: string): StudyArticle | undefined {
    this.init();
    return this.articles.find(a => a.id === id);
  }

  static getArticleBySlug(slug: string): StudyArticle | undefined {
    this.init();
    return this.articles.find(a => a.slug === slug || a.id === slug);
  }

  static createArticle(data: {
    title: string;
    summary: string;
    content: string;
    category: string;
    author?: string;
    tags?: string[];
    slug?: string;
  }): StudyArticle {
    this.init();
    const now = new Date().toISOString().slice(0, 10);
    const id = 'art-' + Date.now();
    const autoSlug = (data.slug && data.slug.trim())
      ? data.slug.trim()
      : generateKoreanSlug(data.title);

    const catObj = this.getCategoryById(data.category);

    const newArt: StudyArticle = {
      id,
      slug: autoSlug,
      title: data.title.trim(),
      summary: data.summary.trim() || data.content.slice(0, 120) + '...',
      content: data.content.trim(),
      category: data.category,
      categoryName: catObj ? catObj.name : '일반',
      author: data.author?.trim() || '마보살 연구소',
      views: 0,
      commentsCount: 0,
      createdAt: now,
      tags: data.tags || ['명리학', '사주'],
      isPublished: true,
    };

    this.articles.unshift(newArt);
    this.saveArticlesToStorage();
    return newArt;
  }

  static updateArticle(id: string, updates: {
    title?: string;
    summary?: string;
    content?: string;
    category?: string;
    author?: string;
    tags?: string[];
    slug?: string;
  }): StudyArticle | undefined {
    this.init();
    const art = this.articles.find(a => a.id === id);
    if (!art) return undefined;

    if (updates.title !== undefined) art.title = updates.title.trim();
    if (updates.summary !== undefined) art.summary = updates.summary.trim();
    if (updates.content !== undefined) art.content = updates.content.trim();
    if (updates.author !== undefined) art.author = updates.author.trim();
    if (updates.tags !== undefined) art.tags = updates.tags;
    if (updates.slug !== undefined && updates.slug.trim()) art.slug = updates.slug.trim();

    if (updates.category !== undefined) {
      art.category = updates.category;
      const catObj = this.getCategoryById(updates.category);
      art.categoryName = catObj ? catObj.name : '일반';
    }

    art.updatedAt = new Date().toISOString().slice(0, 10);
    this.saveArticlesToStorage();
    return art;
  }

  static deleteArticle(id: string): boolean {
    this.init();
    const initialLen = this.articles.length;
    this.articles = this.articles.filter(a => a.id !== id);
    if (this.articles.length !== initialLen) {
      this.saveArticlesToStorage();
      return true;
    }
    return false;
  }

  static incrementViews(idOrSlug: string): void {
    this.init();
    const art = this.articles.find(a => a.id === idOrSlug || a.slug === idOrSlug);
    if (art) {
      art.views = (art.views || 0) + 1;
      this.saveArticlesToStorage();
    }
  }

  private static saveCategoriesToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(this.categories));
    }
  }

  private static saveArticlesToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(this.articles));
    }
  }
}
