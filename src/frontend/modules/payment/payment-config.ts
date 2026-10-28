/**
 * [Payment Module] 포트원(PortOne, 구 아임포트) PG 결제 연동 설정 저장소
 *
 * 포트원 V2 표준:
 *  - storeId: 포트원 관리자 콘솔의 가맹점 식별코드 (예: store-xxxxxxxx-xxxx-xxxx)
 *  - channelKey: 각 결제 채널(카카오페이, 토스, KG이니시스 등)의 연동 채널 키 (예: channel-key-xxxxxxxx)
 *  - 보안 원칙: 브라우저에는 API Secret Key를 절대 저장하지 않습니다.
 */

export type PaymentMode = 'bank_only' | 'portone_test' | 'portone_live';

export interface PaymentConfig {
  mode: PaymentMode;
  /** 포트원 가맹점 상점 ID (Store ID) */
  storeId: string;
  /** 포트원 결제 채널 키 (Channel Key) */
  channelKey: string;
  /** 구 버전 호환용 필드 */
  clientKey?: string;
  /** 서버 측 결제 사후 검증/승인 API 주소 (웹훅 또는 자체 검증 서버) */
  confirmEndpoint: string;
}

const STORAGE_KEY = 'mabosal_portone_payment_config_v3';

const DEFAULT_CONFIG: PaymentConfig = {
  mode: 'portone_test',
  storeId: 'store-b7716cf1-fcc2-4b13-b637-868cee1e7d6d',
  channelKey: 'channel-key-0a515c8c-73dd-459c-8d57-b87df29ca0d5',
  clientKey: 'store-b7716cf1-fcc2-4b13-b637-868cee1e7d6d',
  confirmEndpoint: '',
};

export class PaymentConfigStore {
  static get(): PaymentConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          storeId: parsed.storeId || parsed.clientKey || '',
          channelKey: parsed.channelKey || '',
        };
      }
    } catch { /* fallthrough */ }
    return { ...DEFAULT_CONFIG };
  }

  static save(cfg: PaymentConfig): void {
    const toSave: PaymentConfig = {
      ...cfg,
      clientKey: cfg.storeId, // 하위 호환 유지
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  /** 오류 메시지를 반환한다. 문제 없으면 null. */
  static validate(cfg: PaymentConfig): string | null {
    if (cfg.mode === 'bank_only') return null;
    const storeId = (cfg.storeId || cfg.clientKey || '').trim();
    const channelKey = (cfg.channelKey || '').trim();

    if (!storeId) {
      return '포트원 상점 ID (Store ID)를 입력해 주세요. (포트원 콘솔 > 결제연동 > 상점 식별코드)';
    }
    if (!channelKey) {
      return '포트원 채널 키 (Channel Key)를 입력해 주세요. (포트원 콘솔 > 결제대행사/채널 관리)';
    }
    if (storeId.includes('secret') || channelKey.includes('secret')) {
      return '시크릿 키(Secret Key)는 브라우저에 입력할 수 없습니다. Store ID와 Channel Key만 입력하세요.';
    }
    if (cfg.mode === 'portone_live' && !cfg.confirmEndpoint.trim()) {
      // 실거래의 경우 웹훅 또는 승인 검증 서버 권장 안내
    }
    return null;
  }

  static isCardEnabled(cfg: PaymentConfig = PaymentConfigStore.get()): boolean {
    if (cfg.mode === 'bank_only') return false;
    const storeId = (cfg.storeId || cfg.clientKey || '').trim();
    const channelKey = (cfg.channelKey || '').trim();
    if (!storeId || !channelKey) return false;
    return PaymentConfigStore.validate(cfg) === null;
  }
}
