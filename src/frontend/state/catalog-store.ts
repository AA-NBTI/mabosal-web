/**
 * CatalogStore (판매 상품 및 협력업체/상담사 관리 CRUD 스토어)
 * 최고 관리자 대시보드에서 클릭으로 넣었다 뺐다(추가/삭제/토글) 할 수 있는 플랫폼 코어 저장소
 */

export interface CatalogProduct {
  id: string;
  tierId: string;
  title: string;
  price: number;
  originalPrice: number;
  description: string;
  badge?: string;
  enabled: boolean;
  category: 'core' | 'seasonal' | 'specialized';
  chaptersCount: number;
}

export interface PartnerVendor {
  id: string;
  name: string;
  specialty: string;
  vendorType: '상담사' | '마케터' | '통합협력사';
  contact: string;
  commissionRate: string; // e.g. "상담 80%" or "홍보 30%"
  avatarUrl: string;
  enabled: boolean; // 활성화/노출 여부
  rating: number;
  consultationCount: number;
  statusText: string;
}

const STORAGE_KEY_PRODUCTS = 'mabosal_catalog_products_v2';
const STORAGE_KEY_VENDORS = 'mabosal_partner_vendors_v2';

export class CatalogStore {
  private static defaultProducts: CatalogProduct[] = [
    {
      id: 'prod_free',
      tierId: 'FREE',
      title: '마보살 무료 핵심 사주 진단서',
      price: 0,
      originalPrice: 0,
      description: '사주 4주 8자 만세력 + 오행 에너지 + 핵심 13개 진단 섹션',
      badge: '기본제공',
      enabled: true,
      category: 'core',
      chaptersCount: 13,
    },
    {
      id: 'prod_paid',
      tierId: 'PAID',
      title: '마보살 정통 심층 사주풀이 (완결본)',
      price: 39900,
      originalPrice: 80000,
      description: '18개 심층 서술 섹션 + 12개월 월운 스플라인 + 대운 주기 곡선',
      badge: 'BEST',
      enabled: true,
      category: 'core',
      chaptersCount: 18,
    },
    {
      id: 'prod_conflict',
      tierId: 'CONFLICT',
      title: '상충·마·살 특화 분석서 (인간관계·직장)',
      price: 79900,
      originalPrice: 150000,
      description: '축진파/인사해 정밀 진단, 퇴사 vs 잔류 4주 점검표, 갈등 방어 대화법',
      badge: 'SPECIAL',
      enabled: true,
      category: 'specialized',
      chaptersCount: 20,
    },
    {
      id: 'prod_premium',
      tierId: 'PREMIUM',
      title: '마보살 프리미엄 정밀 사주 리포트 (VIP)',
      price: 149900,
      originalPrice: 250000,
      description: '29개 VIP 전수 분석, 현실 딜레마 A/B 대조표, 온라인 영구 보관',
      badge: 'VIP',
      enabled: true,
      category: 'core',
      chaptersCount: 29,
    },
    {
      id: 'prod_2027_newyear',
      tierId: 'NEWYEAR2027',
      title: '2027 정미년(丁未年) 붉은 양띠 신년 대운서',
      price: 49900,
      originalPrice: 90000,
      description: '2027년 12개월 월별 재물·직장·건강 기운과 천을귀인 월운 종합 비책',
      badge: '신년기획',
      enabled: true,
      category: 'seasonal',
      chaptersCount: 15,
    },
  ];

  private static defaultVendors: PartnerVendor[] = [
    {
      id: 'ven_01',
      name: '도선도사 (김도원)',
      specialty: '직장 이직 · 사업 재물운 · 사주 심층 상담',
      vendorType: '상담사',
      contact: '010-3456-7890',
      commissionRate: '상담 80% / 홍보 30%',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
      enabled: true,
      rating: 4.98,
      consultationCount: 1420,
      statusText: '실시간 상담 가능',
    },
    {
      id: 'ven_02',
      name: '백운선생 (이백운)',
      specialty: '인연 궁합 · 결혼 택일 · 상충마살 해원',
      vendorType: '상담사',
      contact: '010-4567-8901',
      commissionRate: '상담 80%',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      enabled: true,
      rating: 4.95,
      consultationCount: 980,
      statusText: '실시간 상담 가능',
    },
    {
      id: 'ven_03',
      name: '명리연구소 미디어 (이명리)',
      specialty: '사주 전문 유튜브 채널 (구독자 18만) 제휴',
      vendorType: '마케터',
      contact: '010-9876-5432',
      commissionRate: '홍보 커미션 30%',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      enabled: true,
      rating: 5.0,
      consultationCount: 3400,
      statusText: '제휴 링크 활성 중',
    },
    {
      id: 'ven_04',
      name: '혜담보살 (박혜담)',
      specialty: '진로·취업·시험합격운 정밀 추명',
      vendorType: '상담사',
      contact: '010-2345-6789',
      commissionRate: '상담 80%',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
      enabled: true,
      rating: 4.92,
      consultationCount: 650,
      statusText: '상담 예약 대기',
    },
  ];

  public static getProducts(): CatalogProduct[] {
    if (typeof window === 'undefined') return this.defaultProducts;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(this.defaultProducts));
        return this.defaultProducts;
      }
      return JSON.parse(stored);
    } catch {
      return this.defaultProducts;
    }
  }

  public static addProduct(p: Omit<CatalogProduct, 'id'>): CatalogProduct {
    const list = this.getProducts();
    const newProduct: CatalogProduct = {
      ...p,
      id: `prod_${Date.now()}`,
    };
    list.push(newProduct);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
    }
    return newProduct;
  }

  public static toggleProduct(id: string): boolean {
    const list = this.getProducts();
    const item = list.find(x => x.id === id);
    if (item) {
      item.enabled = !item.enabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
      }
      return item.enabled;
    }
    return false;
  }

  public static updateProduct(id: string, updates: Partial<CatalogProduct>): boolean {
    const list = this.getProducts();
    const index = list.findIndex(x => x.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
      }
      return true;
    }
    return false;
  }

  public static deleteProduct(id: string): boolean {
    let list = this.getProducts();
    list = list.filter(x => x.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
    }
    return true;
  }

  // =================== 협력업체 / 상담사 관리 CRUD ===================

  public static getVendors(): PartnerVendor[] {
    if (typeof window === 'undefined') return this.defaultVendors;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VENDORS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(this.defaultVendors));
        return this.defaultVendors;
      }
      return JSON.parse(stored);
    } catch {
      return this.defaultVendors;
    }
  }

  public static addVendor(v: Omit<PartnerVendor, 'id'>): PartnerVendor {
    const list = this.getVendors();
    const newVendor: PartnerVendor = {
      ...v,
      id: `ven_${Date.now()}`,
    };
    list.push(newVendor);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(list));
    }
    return newVendor;
  }

  public static toggleVendor(id: string): boolean {
    const list = this.getVendors();
    const item = list.find(x => x.id === id);
    if (item) {
      item.enabled = !item.enabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(list));
      }
      return item.enabled;
    }
    return false;
  }

  public static deleteVendor(id: string): boolean {
    let list = this.getVendors();
    list = list.filter(x => x.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(list));
    }
    return true;
  }
}
