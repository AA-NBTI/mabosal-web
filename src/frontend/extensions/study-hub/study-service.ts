import { StudyArticle, StudyComment } from './types.js';

const STORAGE_KEY_ARTICLES = 'mabosal_study_articles_v1';
const STORAGE_KEY_COMMENTS = 'mabosal_study_comments_v1';

const INITIAL_ARTICLES: StudyArticle[] = [
  {
    id: 'art-001',
    slug: 'ten-gods-potential',
    title: '십신(十神)으로 읽어내는 나의 숨은 사회적 잠재력',
    summary: '비견·겁재부터 정재·편재까지, 10가지 성분이 내 일간(나 자신)과 맺는 관계를 알기 쉽게 해설합니다.',
    content: '사주명리학에서 십신(十神)은 나(일간)를 기준으로 음양오행의 생극제화(生剋制化) 관계를 인간관계와 사회적 역할로 풀어낸 핵심 개념입니다. 비겁은 주체성과 독립심, 식상은 표현력과 재능 표출, 재성은 현실적 실행과 성과, 관성은 사회적 규범과 명예, 인성은 지혜와 내적 자산을 뜻합니다...',
    category: 'ten_gods',
    author: '마보살 학술팀',
    views: 1240,
    commentsCount: 18,
    createdAt: '2026-10-10',
    tags: ['십신', '사주기초', '적성분석'],
    isPublished: true
  },
  {
    id: 'art-002',
    slug: 'fortune-flow-truth',
    title: '삼재(三災)와 대운(大運)의 진실: 공포 마케팅에 속지 않는 법',
    summary: '삼재라고 해서 무조건 나쁜 일이 생길까요? 대운의 흐름과 사주 밸런스로 살펴보는 올바른 액막이 가이드.',
    content: '많은 분들이 삼재라는 단어만 들으면 큰 불안감을 느끼십니다. 하지만 명리학의 정통 이치에서 삼재는 12년 주기 중 계절적 환절기에 해당하는 3년일 뿐이며, 내 사주에서 용신(필요한 기운)과 기신(부담되는 기운)이 어떻게 작용하느냐에 따라 오히려 복삼재(福三災)로 큰 도약의 발판이 되기도 합니다...',
    category: 'fortune_flow',
    author: '마보살 마스터',
    views: 2890,
    commentsCount: 32,
    createdAt: '2026-10-08',
    tags: ['삼재', '대운', '운세비책'],
    isPublished: true
  },
  {
    id: 'art-003',
    slug: 'five-elements-diagnosis',
    title: '오행(五行) 목·화·토·금·수 자가 진단과 일상 속 개운법',
    summary: '내 사주에 부족하거나 과도한 기운을 색상, 방위, 음식, 생활 루틴으로 보완하는 실전 팁 모음.',
    content: '오행은 우주 만물을 구성하는 다섯 가지 기운의 순환입니다. 목(木) 기운이 부족할 때는 아침 산책과 푸른 식물, 화(火) 기운이 부족할 때는 밝은 조명과 활동적인 운동, 토(土)는 신뢰와 중심, 금(金)은 결단력과 정리정돈, 수(水)는 유연한 사색과 수분 섭취가 도움이 됩니다...',
    category: 'saju_basics',
    author: '마보살 지식허브',
    views: 3120,
    commentsCount: 25,
    createdAt: '2026-10-05',
    tags: ['오행', '개운법', '일상명리'],
    isPublished: true
  },
  {
    id: 'art-004',
    slug: 'horse-star-travel-qna',
    title: 'Q&A: 사주에 역마살(驛馬殺)이 많으면 평생 방황하나요?',
    summary: '현대 사회에서 역마살은 글로벌 활동, 해외 비즈니스, 크리에이터의 강력한 엔진으로 재해석됩니다.',
    content: '전통 명리에서 역마살은 한곳에 정착하지 못한다는 부정적 시선도 있었으나, 시공간의 경계가 허물어진 현대 사회에서는 글로벌 무역, 해외 파견, 원격 디지털 노마드, 유튜버 등에게 최고의 길신으로 작용합니다...',
    category: 'qna_community',
    author: '마보살 연구소',
    views: 1850,
    commentsCount: 14,
    createdAt: '2026-10-02',
    tags: ['역마살', '신살', '질의응답'],
    isPublished: true
  }
];

export class StudyService {
  private static articles: StudyArticle[] = [];
  private static comments: StudyComment[] = [];

  static init(): void {
    const rawA = localStorage.getItem(STORAGE_KEY_ARTICLES);
    this.articles = rawA ? JSON.parse(rawA) : [...INITIAL_ARTICLES];

    const rawC = localStorage.getItem(STORAGE_KEY_COMMENTS);
    this.comments = rawC ? JSON.parse(rawC) : [];
  }

  static getArticles(category?: string): StudyArticle[] {
    if (!this.articles.length) this.init();
    if (!category || category === 'all') return this.articles;
    return this.articles.filter(a => a.category === category);
  }

  static getArticleBySlug(slug: string): StudyArticle | undefined {
    if (!this.articles.length) this.init();
    return this.articles.find(a => a.slug === slug || a.id === slug);
  }

  static getArticleById(id: string): StudyArticle | undefined {
    if (!this.articles.length) this.init();
    return this.articles.find(a => a.id === id);
  }

  static saveArticle(article: Omit<StudyArticle, 'id' | 'views' | 'commentsCount' | 'createdAt'>): StudyArticle {
    if (!this.articles.length) this.init();
    const newArt: StudyArticle = {
      ...article,
      id: 'art-' + Date.now(),
      views: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    this.articles.unshift(newArt);
    localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(this.articles));
    return newArt;
  }

  static deleteArticle(id: string): void {
    if (!this.articles.length) this.init();
    this.articles = this.articles.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(this.articles));
  }
}
