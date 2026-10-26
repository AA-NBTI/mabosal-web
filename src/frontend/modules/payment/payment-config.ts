/**
 * [Payment Module] PG 결제 연동 설정 저장소
 *
 * 보안 원칙:
 *  - 브라우저에는 "클라이언트 키(ck)"만 저장한다. 시크릿 키(sk)는 절대 입력/저장하지 않는다.
 *  - 결제 승인(confirm)은 시크릿 키를 가진 서버 엔드포인트가 수행한다. (confirmEndpoint)
 */

export type PaymentMode = 'bank_only' | 'toss_test' | 'toss_live';

export interface PaymentConfig {
  mode: PaymentMode;
  clientKey: string;
  /** 서버 측 결제 승인 API 주소 (시크릿 키는 이 서버의 환경변수에만 보관) */
  confirmEndpoint: string;
}

const STORAGE_KEY = 'mabosal_payment_config_v1';

/** 토스페이먼츠 개발자센터 공개 문서의 테스트용 클라이언트 키 */
export const TOSS_DOCS_TEST_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

const DEFAULT_CONFIG: PaymentConfig = {
  mode: 'bank_only',
  clientKey: '',
  confirmEndpoint: '',
};

export class PaymentConfigStore {
  static get(): PaymentConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch { /* fallthrough */ }
    return { ...DEFAULT_CONFIG };
  }

  static save(cfg: PaymentConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  /** 오류 메시지를 반환한다. 문제 없으면 null. */
  static validate(cfg: PaymentConfig): string | null {
    if (cfg.mode === 'bank_only') return null;
    const key = cfg.clientKey.trim();
    if (!key) return '클라이언트 키를 입력해 주세요.';
    if (key.includes('_sk_')) return '시크릿 키(sk)는 브라우저에 입력할 수 없습니다. 클라이언트 키(ck)만 입력하세요.';
    if (cfg.mode === 'toss_test' && !key.startsWith('test_')) return '테스트 모드에는 test_ 로 시작하는 클라이언트 키가 필요합니다.';
    if (cfg.mode === 'toss_live') {
      if (!key.startsWith('live_')) return '실거래 모드에는 live_ 로 시작하는 클라이언트 키가 필요합니다.';
      if (!cfg.confirmEndpoint.trim()) return '실거래 모드에는 서버 결제 승인 API 주소가 반드시 필요합니다.';
    }
    return null;
  }

  static isCardEnabled(cfg: PaymentConfig = PaymentConfigStore.get()): boolean {
    // mode가 bank_only이면 무조건 비활성화
    if (cfg.mode === 'bank_only') return false;
    // 클라이언트 키가 비어있거나 유효성 검사 실패 시 비활성화
    if (!cfg.clientKey || !cfg.clientKey.trim()) return false;
    return PaymentConfigStore.validate(cfg) === null;
  }
}
