/**
 * 사이트 CMS / 콘텐츠 설정 저장소 (SiteContentStore)
 * 
 * - 로고 및 상단 구성
 * - 메인 화면 본문 히어로 타이틀, 서브 문구, 설명문
 * - 사이트 하단 푸터 정보 (상호, 대표자, 사업자번호, 고객센터, 저작권)
 * LocalStorage 기반 영구 보존 및 실시간 화면 반영
 */

export interface SiteContentConfig {
  header: {
    brandName: string;
    domainText: string;
  };
  hero: {
    mainTitle: string;
    subPill: string;
    description: string;
  };
  footer: {
    companyName: string;
    ceoName: string;
    bizNumber: string;
    mailOrderNumber: string;
    contactInfo: string;
    copyright: string;
  };
}

const STORAGE_KEY = 'mabosal_site_content_config_v2';

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  header: {
    brandName: '마보살',
    domainText: 'mabosal.com',
  },
  hero: {
    mainTitle: '당신의 사주를 읽고\n지금 무엇이 중요한지 알려드립니다',
    subPill: '하늘의 명(天命)을 읽고 때(時)를 분별하다',
    description: '단순한 미신이나 막연한 운세가 아닙니다. 4주 8자의 원천 기운과 시간의 흐름, Fact와 기운의 상호작용을 체계적으로 분석하여 지금 마주한 현실 고민의 매듭을 풀고 가장 이로운 방향을 명쾌하게 밝혀드립니다.',
  },
  footer: {
    companyName: '템바보드 주식회사',
    ceoName: '홍길동',
    bizNumber: '123-45-67890',
    mailOrderNumber: '제 2026-서울강남-01234호',
    contactInfo: '고객센터: contact@mabosal.com | 평일 10:00~18:00',
    copyright: '© 2026 Mabosal Inc. All rights reserved.',
  },
};

export class SiteContentStore {
  private static config: SiteContentConfig | null = null;

  public static getConfig(): SiteContentConfig {
    if (!this.config) {
      this.load();
    }
    return { ...this.config! };
  }

  public static updateConfig(newConfig: Partial<SiteContentConfig>): void {
    const current = this.getConfig();
    this.config = {
      header: { ...current.header, ...(newConfig.header || {}) },
      hero: { ...current.hero, ...(newConfig.hero || {}) },
      footer: { ...current.footer, ...(newConfig.footer || {}) },
    };
    this.save();
  }

  public static resetToDefault(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT));
    this.save();
  }

  private static load(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.config = {
            header: { ...DEFAULT_SITE_CONTENT.header, ...(parsed.header || {}) },
            hero: { ...DEFAULT_SITE_CONTENT.hero, ...(parsed.hero || {}) },
            footer: { ...DEFAULT_SITE_CONTENT.footer, ...(parsed.footer || {}) },
          };
          return;
        }
      }
    } catch (e) {
      console.warn('SiteContentStore load error:', e);
    }
    this.config = JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT));
  }

  private static save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage && this.config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('SiteContentStore save error:', e);
    }
  }
}
