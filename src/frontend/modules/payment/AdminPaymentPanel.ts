/**
 * [Payment Module] 관리자 결제 연동 설정 패널 (포트원 PortOne V2 키 입력 / 모드 전환)
 */
import { PaymentConfigStore, PaymentMode } from './payment-config.js';
import { getAllStoreOrders } from '../../extensions/commerce-store/store-service.js';

const MODE_OPTIONS: { value: PaymentMode; label: string; desc: string }[] = [
  { value: 'bank_only', label: '무통장 입금 전용', desc: '카드 결제 비활성. 계좌 입금만 받습니다.' },
  { value: 'portone_test', label: '포트원 테스트 모드', desc: '가상 결제(실제 청구 없음). PG/카드사 가맹점 심사용.' },
  { value: 'portone_live', label: '포트원 실거래 모드', desc: '실제 결제. 포트원 실거래 Store ID + Channel Key 필요.' },
];

export function renderAdminPaymentPanel(): string {
  const cfg = PaymentConfigStore.get();
  const err = PaymentConfigStore.validate(cfg);
  const orders = getAllStoreOrders();
  const pending = orders.filter(o => o.status === 'pending').length;
  const completed = orders.filter(o => o.status === 'completed').length;

  const statusColor = err ? '#ff8585' : '#4ade80';
  const statusText = cfg.mode === 'bank_only'
    ? '무통장 전용 운영 중'
    : err ? `설정 오류: ${err}` : cfg.mode === 'portone_test' ? '포트원 테스트 연동 준비됨' : '포트원 실거래 연동 운영 중';

  const inputStyle = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:0.6rem;color:#fff;font-size:0.85rem;';

  return `
  <div style="display:flex;flex-direction:column;gap:1.25rem;">
    <!-- 3대 상태 카드 -->
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

    <!-- PG 설정 폼 -->
    <div style="background:var(--surface-container);border:1.5px solid rgba(242,202,80,0.3);border-radius:14px;padding:1.35rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 style="font-size:1.15rem;font-weight:800;color:#fff;margin:0;display:flex;align-items:center;gap:0.4rem;">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--primary);">credit_card</span>
          PG 전자결제 연동 설정 (포트원 PortOne V2)
        </h3>
        <a href="https://admin.portone.io" target="_blank" rel="noopener noreferrer" style="font-size:0.78rem;color:var(--primary);text-decoration:none;display:flex;align-items:center;gap:0.25rem;">
          포트원 콘솔 바로가기 ↗
        </a>
      </div>

      <div style="font-size:0.78rem;color:var(--text-muted);font-weight:700;margin-bottom:0.4rem;">운영 모드 선택</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.1rem;">
        ${MODE_OPTIONS.map(m => `
          <label style="display:flex;gap:0.6rem;align-items:flex-start;background:${cfg.mode === m.value ? 'rgba(242,202,80,0.12)' : 'rgba(0,0,0,0.2)'};border:1px solid ${cfg.mode === m.value ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};border-radius:8px;padding:0.7rem;cursor:pointer;">
            <input type="radio" name="pay-mode" value="${m.value}" ${cfg.mode === m.value ? 'checked' : ''} style="margin-top:0.2rem;" />
            <span>
              <strong style="color:#fff;font-size:0.88rem;">${m.label}</strong><br/>
              <span style="font-size:0.76rem;color:#94a3b8;">${m.desc}</span>
            </span>
          </label>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0.85rem;margin-bottom:1rem;">
        <div>
          <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">
            포트원 상점 ID (Store ID) <span style="color:#f87171;">*</span>
          </label>
          <input type="text" id="input-pay-store-id" value="${cfg.storeId || ''}" placeholder="store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off" style="${inputStyle}font-family:monospace;" />
          <span style="font-size:0.72rem;color:#94a3b8;margin-top:0.2rem;display:block;">포트원 콘솔 &gt; 결제 연동 &gt; 상점 식별코드</span>
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">
            포트원 채널 키 (Channel Key) <span style="color:#f87171;">*</span>
          </label>
          <input type="text" id="input-pay-channel-key" value="${cfg.channelKey || ''}" placeholder="channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off" style="${inputStyle}font-family:monospace;" />
          <span style="font-size:0.72rem;color:#94a3b8;margin-top:0.2rem;display:block;">포트원 콘솔 &gt; 결제대행사/채널 관리 &gt; 채널 키</span>
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:block;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">
          결제 사후 검증 / 웹훅 엔드포인트 URL (선택)
        </label>
        <input type="text" id="input-pay-confirm-endpoint" value="${cfg.confirmEndpoint || ''}" placeholder="https://your-api.com/api/payment/verify" autocomplete="off" style="${inputStyle}" />
        <span style="font-size:0.72rem;color:#94a3b8;margin-top:0.2rem;display:block;">포트원 웹훅 또는 자체 백엔드 위변조 검증용 URL</span>
      </div>

      <div style="background:rgba(242,202,80,0.06);border:1px solid rgba(242,202,80,0.25);border-radius:8px;padding:0.75rem 0.9rem;font-size:0.78rem;color:#cbd5e1;line-height:1.55;margin-bottom:1rem;">
        <strong style="color:var(--primary);">💡 포트원 연동 안내</strong><br/>
        • <strong>포트원(PortOne)</strong>은 신용카드, 카카오페이, 네이버페이, 토스페이, 휴대폰 소액결제 등 국내 모든 결제수단을 단일 SDK로 지원합니다.<br/>
        • <strong>시크릿 키(Secret Key)</strong>는 브라우저에 저장하지 않으며, 공개 식별자인 <strong>Store ID</strong>와 <strong>Channel Key</strong>만 사용하므로 안전합니다.
      </div>

      <button type="button" id="btn-save-payment-config" style="padding:0.65rem 1.6rem;font-size:0.9rem;font-weight:800;background:var(--primary);color:#241a00;border:none;border-radius:8px;cursor:pointer;">
        포트원 설정 저장
      </button>
    </div>
  </div>`;
}

/** 현재 DOM 입력값을 검증 후 저장한다. 성공 시 true */
export function savePaymentConfigFromDom(): boolean {
  const mode = (document.querySelector('input[name="pay-mode"]:checked') as HTMLInputElement | null)?.value as PaymentMode | undefined;
  const storeId = (document.getElementById('input-pay-store-id') as HTMLInputElement | null)?.value.trim() || '';
  const channelKey = (document.getElementById('input-pay-channel-key') as HTMLInputElement | null)?.value.trim() || '';
  const confirmEndpoint = (document.getElementById('input-pay-confirm-endpoint') as HTMLInputElement | null)?.value.trim() || '';

  if (!mode) {
    alert('운영 모드를 선택해 주세요.');
    return false;
  }

  const next = { mode, storeId, channelKey, confirmEndpoint };
  const err = PaymentConfigStore.validate(next);
  if (err) {
    alert(`저장할 수 없습니다.\n${err}`);
    return false;
  }

  PaymentConfigStore.save(next);
  alert('포트원 결제 연동 설정이 저장되었습니다.');
  return true;
}
