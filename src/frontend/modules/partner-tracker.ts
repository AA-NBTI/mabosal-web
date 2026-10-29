/**
 * 마보살 파트너스 (쿠팡형 제휴 마케팅) 레퍼럴 추적 및 정산 관리 모듈
 * 
 * 최고 관리자 개별 수수료율 차등 부여 & 기본값 미제공(비활성화) 정책 준수
 */

export interface PartnerStats {
  partnerCode: string;
  name: string;
  clicks: number;
  conversions: number;
  totalSalesAmount: number;
  commissionRate: number; // e.g. 0.0 (기본 0% 미제공), 관리자가 0.15, 0.30 등 개별 부여
  earnedCommission: number;
  availablePayout: number;
  status: 'active' | 'inactive'; // 기본: inactive (현재 제공하지 않음)
  memo?: string;
}

const STORAGE_KEY_REF = 'mabosal_partner_ref';
const STORAGE_KEY_REF_EXPIRY = 'mabosal_partner_ref_expiry';
const STORAGE_KEY_PARTNER_DATA = 'mabosal_partner_portal_data';
const STORAGE_KEY_DELETED_PARTNERS = 'mabosal_partner_deleted_v1';
const ATTRIBUTION_DAYS = 30;

// 기본 파트너 목록 (기본 설정: 현재 수수료 미제공 / inactive)
const DEFAULT_PARTNERS: Record<string, PartnerStats> = {
  vip_creator: {
    partnerCode: 'vip_creator',
    name: '사주 전문 크리에이터 김도원',
    clicks: 142,
    conversions: 8,
    totalSalesAmount: 399000,
    commissionRate: 0.0, // 기본 미제공
    earnedCommission: 0,
    availablePayout: 0,
    status: 'inactive',
    memo: '최고 관리자 수수료율 개별 심사 대기',
  },
  saju_master: {
    partnerCode: 'saju_master',
    name: '명리연구소 이명리 블로거',
    clicks: 89,
    conversions: 5,
    totalSalesAmount: 149500,
    commissionRate: 0.0, // 기본 미제공
    earnedCommission: 0,
    availablePayout: 0,
    status: 'inactive',
    memo: '최고 관리자 수수료율 개별 심사 대기',
  },
};

export class PartnerTracker {
  /** 페이지 로드 시 URL에서 ?ref=CODE 감지 후 30일간 브라우저에 저장 */
  public static initFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || urlParams.get('partner');

      if (ref && ref.trim()) {
        const cleanRef = ref.trim().toLowerCase();
        const expiryTime = Date.now() + ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY_REF, cleanRef);
        localStorage.setItem(STORAGE_KEY_REF_EXPIRY, expiryTime.toString());
        this.recordClick(cleanRef);
        return cleanRef;
      }
    } catch (e) {
      console.warn('[PartnerTracker] Failed to read URL params', e);
    }

    return this.getActiveReferralCode();
  }

  /** 현재 유효한 추천인 파트너 코드 조회 */
  public static getActiveReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const ref = localStorage.getItem(STORAGE_KEY_REF);
      const expiry = localStorage.getItem(STORAGE_KEY_REF_EXPIRY);

      if (!ref || !expiry) return null;

      if (Date.now() > parseInt(expiry, 10)) {
        localStorage.removeItem(STORAGE_KEY_REF);
        localStorage.removeItem(STORAGE_KEY_REF_EXPIRY);
        return null;
      }

      return ref;
    } catch {
      return null;
    }
  }

  /** 클릭 수 카운트 */
  private static recordClick(partnerCode: string): void {
    const stats = this.getPartnerStats(partnerCode);
    stats.clicks += 1;
    this.savePartnerStats(stats);
  }

  /** 결제 완료 시 파트너 커미션 적립 (관리자가 활성화하고 수수료율을 부여한 경우에만 적립) */
  public static recordConversion(paidAmount: number): { partnerCode: string; commission: number } | null {
    const ref = this.getActiveReferralCode();
    if (!ref) return null;

    const stats = this.getPartnerStats(ref);
    stats.conversions += 1;
    stats.totalSalesAmount += paidAmount;

    // 수수료 미제공(inactive 또는 0%)인 경우 커미션 0원
    if (stats.status !== 'active' || stats.commissionRate <= 0) {
      this.savePartnerStats(stats);
      return { partnerCode: ref, commission: 0 };
    }

    const commission = Math.round(paidAmount * stats.commissionRate);
    stats.earnedCommission += commission;
    stats.availablePayout += commission;

    this.savePartnerStats(stats);
    return { partnerCode: ref, commission };
  }

  /** 삭제된 파트너 코드 세트 조회 (기본 파트너 부활 방지) */
  private static getDeletedPartnerCodes(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_PARTNERS);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  /** 최고 관리자: 파트너 삭제 (기본 파트너도 다시 살아나지 않도록 삭제 목록에 영구 기록) */
  public static deletePartner(partnerCode: string): boolean {
    try {
      const deleted = this.getDeletedPartnerCodes();
      deleted.add(partnerCode);
      localStorage.setItem(STORAGE_KEY_DELETED_PARTNERS, JSON.stringify([...deleted]));

      const allDataStr = localStorage.getItem(STORAGE_KEY_PARTNER_DATA);
      const allData: Record<string, PartnerStats> = allDataStr ? JSON.parse(allDataStr) : {};
      delete allData[partnerCode];
      localStorage.setItem(STORAGE_KEY_PARTNER_DATA, JSON.stringify(allData));

      // 삭제된 파트너의 활성 추천 코드가 남아있으면 해제
      if (localStorage.getItem(STORAGE_KEY_REF) === partnerCode) {
        localStorage.removeItem(STORAGE_KEY_REF);
        localStorage.removeItem(STORAGE_KEY_REF_EXPIRY);
      }
      return true;
    } catch (e) {
      console.warn('[PartnerTracker] Failed to delete partner', e);
      return false;
    }
  }

  /** 모든 파트너 목록 조회 (관리자 대시보드용) */
  public static getAllPartners(): Record<string, PartnerStats> {
    const deleted = this.getDeletedPartnerCodes();
    try {
      const allDataStr = localStorage.getItem(STORAGE_KEY_PARTNER_DATA);
      let allData: Record<string, PartnerStats> = allDataStr ? JSON.parse(allDataStr) : {};

      // 기본 파트너 병합 (관리자가 삭제한 파트너는 복원하지 않음)
      let modified = false;
      Object.keys(DEFAULT_PARTNERS).forEach((key) => {
        if (!allData[key] && !deleted.has(key)) {
          allData[key] = { ...DEFAULT_PARTNERS[key] };
          modified = true;
        }
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEY_PARTNER_DATA, JSON.stringify(allData));
      }
      return allData;
    } catch {
      const fallback = { ...DEFAULT_PARTNERS };
      deleted.forEach((code) => delete fallback[code]);
      return fallback;
    }
  }

  /** 파트너 통계 조회 */
  public static getPartnerStats(partnerCode: string): PartnerStats {
    const allData = this.getAllPartners();
    if (!allData[partnerCode]) {
      const fresh: PartnerStats = {
        partnerCode,
        name: partnerCode.toUpperCase(),
        clicks: 1,
        conversions: 0,
        totalSalesAmount: 0,
        commissionRate: 0.0, // 기본 미제공
        earnedCommission: 0,
        availablePayout: 0,
        status: 'inactive', // 기본 비활성화
        memo: '신규 등록 (수수료 미제공 상태)',
      };
      // 삭제된 파트너 코드는 목록에 다시 저장하지 않음 (임시 객체만 반환)
      if (this.getDeletedPartnerCodes().has(partnerCode)) return fresh;
      allData[partnerCode] = fresh;
      this.savePartnerStats(allData[partnerCode]);
    }
    return allData[partnerCode];
  }

  /** 최고 관리자: 특정 파트너 수수료율 & 상태 개별 설정 */
  public static updatePartnerCommission(
    partnerCode: string, 
    commissionRate: number, 
    status: 'active' | 'inactive',
    memo?: string
  ): boolean {
    const stats = this.getPartnerStats(partnerCode);
    stats.commissionRate = Math.max(0, Math.min(1, commissionRate));
    stats.status = status;
    if (memo !== undefined) stats.memo = memo;
    this.savePartnerStats(stats);
    return true;
  }

  private static savePartnerStats(stats: PartnerStats): void {
    try {
      const allDataStr = localStorage.getItem(STORAGE_KEY_PARTNER_DATA);
      const allData: Record<string, PartnerStats> = allDataStr ? JSON.parse(allDataStr) : {};
      allData[stats.partnerCode] = stats;
      localStorage.setItem(STORAGE_KEY_PARTNER_DATA, JSON.stringify(allData));
    } catch (e) {
      console.warn('[PartnerTracker] Failed to save partner stats', e);
    }
  }

  /** 내 고유 추천 링크 생성 */
  public static generatePartnerUrl(partnerCode: string): string {
    if (typeof window === 'undefined') return `https://mabosal.com?ref=${partnerCode}`;
    const base = window.location.origin + window.location.pathname;
    return `${base}?ref=${encodeURIComponent(partnerCode)}`;
  }
}
