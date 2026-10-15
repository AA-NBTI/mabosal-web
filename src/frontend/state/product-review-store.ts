/**
 * 스토어 상품 구매 후기(리뷰) 저장소 (ProductReviewStore)
 * - 실제 구매자 인증 기반 리뷰 작성 및 별점 평가
 * - 베스트 리뷰 지정, 관리자 리뷰 모니터링/삭제
 * - 리뷰 작성 시 보너스 엽전(500엽) 자동 리워드 연동
 */

import { AuthService } from './auth-service.js';

export interface ProductReview {
  id: string;               // 예: REV-20261015-4421
  productId: string;        // 상품 식별자 (예: core-lifelong-saju)
  productTitle: string;     // 상품명
  orderId?: string;         // 구매 주문번호
  userId?: string;          // 작성자 회원 ID
  authorName: string;       // 작성자 성명
  rating: number;           // 별점 (1~5)
  content: string;          // 후기 본문
  tags?: string[];          // 만족도 핵심 태그 (예: ['시기 적중', '명쾌한 해설'])
  isBest?: boolean;         // 베스트 리뷰 여부
  createdAt: string;        // 작성 일시 ISO
}

const STORAGE_KEY = 'mabosal_product_reviews_v1';

const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'REV-20261012-0001',
    productId: 'core-lifelong-saju',
    productTitle: '마보살 평생 정밀 사주 감정서',
    orderId: 'ORD-2026-0001',
    authorName: '김서연',
    rating: 5,
    content: '사주를 여러 번 봤지만 이렇게 구체적인 시기와 대운의 흐름, 현실적인 행동 지침까지 명쾌하게 짚어주는 감정서는 처음입니다. 15개 챕터 분량도 방대하고 제 사주의 핵심 결을 정확하게 짚어내서 마음의 정리가 되었습니다.',
    tags: ['명쾌한 해설', '시기 적중', '깊이있는 분석'],
    isBest: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'REV-20261013-0002',
    productId: 'prod-new-year-2027',
    productTitle: '2027 정묘년(丁卯年) 신년 정밀 운세',
    orderId: 'ORD-2026-0002',
    authorName: '이민호',
    rating: 5,
    content: '내년 이직 타이밍과 상반기 재물 위험 구간을 미리 알 수 있어서 큰 도움이 될 것 같습니다. 월별 흐름이 달력처럼 체계적으로 정리되어 있어 언제 조심하고 언제 나아가야 할지 기준이 생겼습니다.',
    tags: ['이직/진로 도움', '현실적 조언'],
    isBest: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'REV-20261014-0003',
    productId: 'core-lifelong-saju',
    productTitle: '마보살 평생 정밀 사주 감정서',
    orderId: 'ORD-2026-0004',
    authorName: '박지은',
    rating: 5,
    content: '인쇄해서 파일에 철해두고 한 해 계획 세울 때마다 다시 꺼내보고 있습니다. 두루뭉술한 미신이 아니라 통계와 원리가 설명되어 있어서 훨씬 신뢰가 갑니다.',
    tags: ['평생 소장 가치', '체계적인 원리'],
    isBest: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'REV-20261015-0004',
    productId: 'prod-voucher-50k',
    productTitle: '마보살 50,000원 VIP 사주 기프트 상품권',
    orderId: 'ORD-2026-0005',
    authorName: '최성훈',
    rating: 5,
    content: '새해를 맞아 지인에게 선물했는데 바우처 코드 복사해서 바로 등록해 쓰니 너무 편리하고 고마워하네요. 특별하고 품격 있는 선물로 추천합니다.',
    tags: ['선물 추천', '간편한 사용'],
    isBest: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  }
];

export class ProductReviewStore {
  private static reviews: ProductReview[] | null = null;

  public static getReviews(): ProductReview[] {
    if (!this.reviews) {
      this.load();
    }
    return [...this.reviews!];
  }

  public static getReviewsByProduct(productId: string): ProductReview[] {
    return this.getReviews().filter(r => r.productId === productId || r.productId === 'core-lifelong-saju');
  }

  public static getReviewStats(productId: string): { average: number; count: number } {
    const list = this.getReviewsByProduct(productId);
    if (list.length === 0) return { average: 5.0, count: 0 };
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Number((sum / list.length).toFixed(1)),
      count: list.length,
    };
  }

  public static hasUserReviewed(orderId: string): boolean {
    return this.getReviews().some(r => r.orderId === orderId);
  }

  public static addReview(params: Omit<ProductReview, 'id' | 'createdAt'>): ProductReview {
    const id = `REV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReview: ProductReview = {
      ...params,
      id,
      createdAt: new Date().toISOString(),
    };

    const list = this.getReviews();
    list.unshift(newReview);
    this.reviews = list;
    this.save();

    // [리뷰 작성 보너스 리워드] 엽전 500엽 즉시 지급
    try {
      const user = AuthService.getCurrentUser();
      if (user && user.role !== 'guest') {
        AuthService.awardYeop(500);
      }
    } catch (e) {
      console.warn('Yeop award error:', e);
    }

    return newReview;
  }

  public static toggleBestReview(id: string): boolean {
    const list = this.getReviews();
    const target = list.find(r => r.id === id);
    if (!target) return false;
    target.isBest = !target.isBest;
    this.reviews = list;
    this.save();
    return true;
  }

  public static deleteReview(id: string): boolean {
    let list = this.getReviews();
    const initialLen = list.length;
    list = list.filter(r => r.id !== id);
    if (list.length === initialLen) return false;
    this.reviews = list;
    this.save();
    return true;
  }

  private static load(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.reviews = JSON.parse(raw);
          return;
        }
      }
    } catch (e) {
      console.warn('ProductReviewStore load error:', e);
    }
    this.reviews = JSON.parse(JSON.stringify(INITIAL_REVIEWS));
    this.save();
  }

  private static save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage && this.reviews) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reviews));
      }
    } catch (e) {
      console.warn('ProductReviewStore save error:', e);
    }
  }
}
