/**
 * [Payment Module] 관리자 결제 연동 설정 패널 (PG 키 입력 / 모드 전환)
 */
import { PaymentConfigStore, PaymentMode } from './payment-config.js';
import { getAllStoreOrders } from '../../extensions/commerce-store/store-service.js';

const MODE_OPTIONS: { value: PaymentMode; label: string; desc: string }[] = [
  { value: 'bank_only', label: '무통장 입금 전용', desc: '카드 결제 비활성. 기업은행 계좌 입금만 받습니다.' },
  { value: 'toss_test', label: '토스 테스트 모드', desc: '가상 결제(실제 청구 없음). 가맹점 심사 전 개발/심사용.' },
  { value: 'toss_live', label: '토스 실거래 모드', desc: '실제 결제. live 키 + 서버 승인 API 필수.' },
];

export function renderAdminPaymentPanel(): string {
  const cfg = PaymentConfigStore.get();
  const err = PaymentConfigStore.validate(cfg);
  const orders = getAllStoreOrders();
  const pending = orders.filter(o => o.status === 'pending').length;
  const completed = orders.filter(o => o.status === 'completed').length;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const statusColor = err ? '#ff8585' : '#4ade80';
  const statusText = cfg.mode === 'bank_only'
    ? '무통장 전용 운영 중'
    : err ? `설정 오류: ${err}` : cfg.mode === 'toss_test' ? '토스 테스트 연결 준비됨' : '토스 실거래 연결 준비됨';

  const input = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:0.55rem;color:#fff;font-size:0.85rem;';

  return `
  <div style="display:flex;flex-direction:column;gap:1.25rem;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
      <div style="background:rgba(20,24,35,0.7);border:1px solid rgba(242,202,80,0.25);border-radius:12px;padding:1.1rem;">
        <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;">연동 상태</div>
        <div style="font-size:0.95rem;font-weight:800;color:${statusColor};margin-top:0.35rem;">${statusText}</div>
      </div>
      <div style="background:rgba(20,24,35,0.7);border:1px solid rgba(255,107,107,0.35);border-radius:12px;padding:1.1rem;">
        <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;">입금 확인 대기 주문</div>
        <div style="font-size:1.5rem;font-weight:900;color:#ff8585;">${pending}<span style="font-size:0.85rem;color:var(--text-muted);margin-left:0.25rem;">건</span></div>
      </div>
      <div style="background:rgba(20,24,35,0.7);border:1px solid rgba(74,222,128,0.3);border-radius:12px;padding:1.1rem;">
        <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;">결제 완료 주문</div>
        <div style="font-size:1.5rem;font-weight:900;color:#4ade80;">${completed}<span style="font-size:0.85rem;color:var(--text-muted);margin-left:0.25rem;">건</span></div>
      </div>
    </div>

    <div style="background:var(--surface-container);border:1.5px solid rgba(242,202,80,0.3);border-radius:14px;padding:1.35rem;">
      <h3 style="font-size:1.15rem;font-weight:800;color:#fff;margin:0 0 1rem 0;">PG 결제 연동 설정 (토스페이먼츠)</h3>

      <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;margin-bottom:0.4rem;">운영 모드</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.1rem;">
        ${MODE_OPTIONS.map(m => `
          <label style="display:flex;gap:0.6rem;align-items:flex-start;background:${cfg.mode === m.value ? 'rgba(242,202,80,0.12)' : 'rgba(0,0,0,0.2)'};border:1px solid ${cfg.mode === m.value ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};border-radius:8px;padding:0.7rem;cursor:pointer;">
            <input type="radio" name="pay-mode" value="${m.value}" ${cfg.mode === m.value ? 'checked' : ''} style="margin-top:0.2rem;" />
            <span><strong style="color:#fff;font-size:0.88rem;">${m.label}</strong><br/><span style="font-size:0.76rem;color:#94a3b8;">${m.desc}</span></span>
          </label>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0.85rem;margin-bottom:1rem;">
        <div>
          <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">클라이언트 키 (test_ck_… / live_ck_…)</label>
          <input type="text" id="input-pay-client-key" value="${cfg.clientKey}" autocomplete="off" style="${input}font-family:monospace;" />
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">서버 결제 승인 API 주소 (실거래 필수)</label>
          <input type="text" id="input-pay-confirm-endpoint" value="${cfg.confirmEndpoint}" placeholder="https://api.example.com/payments/confirm" autocomplete="off" style="${input}" />
        </div>
      </div>

      <div style="background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.35);border-radius:8px;padding:0.75rem 0.9rem;font-size:0.78rem;color:#fda4a4;line-height:1.5;margin-bottom:1rem;">
        <strong>시크릿 키(sk)는 이 화면에 입력하지 마세요.</strong> 브라우저에 저장되면 누구나 탈취할 수 있습니다.
        시크릿 키는 위 "서버 결제 승인 API"의 환경변수에만 보관하고, 그 서버가 토스 승인 API(/v1/payments/confirm)를 호출해야 합니다.
      </div>

      <div style="font-size:0.76rem;color:#94a3b8;line-height:1.6;margin-bottom:1rem;">
        토스 개발자센터에 등록할 리다이렉트 경로: <code style="color:var(--primary);">${origin}/?view=store&amp;payment=success</code> /
        <code style="color:var(--primary);">${origin}/?view=store&amp;payment=fail</code>
      </div>

      <button type="button" id="btn-save-payment-config" style="padding:0.6rem 1.4rem;font-size:0.88rem;font-weight:800;background:var(--primary);color:#241a00;border:none;border-radius:8px;cursor:pointer;">
        결제 설정 저장
      </button>
    </div>
  </div>`;
}

/** 현재 DOM 입력값을 검증 후 저장한다. 성공 시 true */
export function savePaymentConfigFromDom(): boolean {
  const mode = (document.querySelector('input[name="pay-mode"]:checked') as HTMLInputElement | null)?.value as PaymentMode | undefined;
  const clientKey = (document.getElementById('input-pay-client-key') as HTMLInputElement | null)?.value.trim() || '';
  const confirmEndpoint = (document.getElementById('input-pay-confirm-endpoint') as HTMLInputElement | null)?.value.trim() || '';
  if (!mode) {
    alert('운영 모드를 선택해 주세요.');
    return false;
  }
  const next = { mode, clientKey, confirmEndpoint };
  const err = PaymentConfigStore.validate(next);
  if (err) {
    alert(`저장할 수 없습니다.\n${err}`);
    return false;
  }
  PaymentConfigStore.save(next);
  alert('결제 설정이 저장되었습니다.');
  return true;
}
