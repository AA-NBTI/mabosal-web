/**
 * [최고 관리자 전용] 무통장 입금 승인 및 쿠폰 관리 통제탑 컴포넌트
 */
import { VoucherStore, VoucherCoupon, BankTransferRequest } from './voucher-store.js';

/**
 * [1] 무통장 입금 승인 전용 패널
 */
export function renderAdminBankTransferPanel(): string {
  const transfers = VoucherStore.getBankTransfers();
  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const approvedTransfers = transfers.filter(t => t.status === 'approved');
  const totalApprovedAmount = approvedTransfers.reduce((sum, t) => sum + t.requestedAmount, 0);

  return `
  <div class="admin-bank-transfer-panel" style="display: flex; flex-direction: column; gap: 1.25rem;">
    <!-- 입금 승인 요약 KPI -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
      <div style="background: rgba(20, 24, 35, 0.7); border: 1px solid ${pendingTransfers.length > 0 ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 12px; padding: 1.15rem; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: ${pendingTransfers.length > 0 ? '#ff8585' : 'var(--text-muted)'}; font-weight: 700; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 16px; color: ${pendingTransfers.length > 0 ? '#ff6b6b' : 'var(--primary)'};">pending_actions</span>
          입금 확인 대기
        </div>
        <div style="font-size: 1.65rem; font-weight: 900; color: ${pendingTransfers.length > 0 ? '#ff6b6b' : '#ffffff'};">
          ${pendingTransfers.length}<span style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-left: 0.25rem;">건</span>
        </div>
        <div style="font-size: 0.74rem; color: #8fa0c7; margin-top: 0.3rem;">승인 대기 건수</div>
      </div>

      <div style="background: rgba(20, 24, 35, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.15rem; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 16px; color: #ffffff;">account_balance_wallet</span>
          누적 입금 승인액
        </div>
        <div style="font-size: 1.65rem; font-weight: 900; color: #ffffff;">
          ${totalApprovedAmount.toLocaleString()}<span style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-left: 0.25rem;">원</span>
        </div>
        <div style="font-size: 0.74rem; color: #8fa0c7; margin-top: 0.3rem;">총 ${approvedTransfers.length}건 승인 완료</div>
      </div>
    </div>

    <!-- 무통장 입금 신청 목록 및 승인 센터 -->
    <div style="background: var(--surface-container); border: 1.5px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 1.35rem; box-shadow: var(--shadow-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0;">
            무통장 입금 승인
          </h3>
        </div>
        <div style="font-size: 0.8rem; color: #8fa0c7; background: rgba(255,255,255,0.05); padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
          공식 계좌: <strong style="color: #ffffff;">기업은행 103-123733-04-012 (템바보드 주식회사)</strong>
        </div>
      </div>

      ${pendingTransfers.length === 0 ? `
        <div style="padding: 2rem 1rem; text-align: center; background: rgba(0,0,0,0.25); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
          <span class="material-symbols-outlined" style="font-size: 32px; color: #64748b; margin-bottom: 0.4rem;">check_circle</span>
          <div style="font-size: 0.92rem; color: #94a3b8; font-weight: 600;">대기 중인 무통장 입금 신청이 없습니다.</div>
        </div>
      ` : `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.78rem;">
                <th style="padding: 0.6rem 0.75rem;">신청일시</th>
                <th style="padding: 0.6rem 0.75rem;">입금자명</th>
                <th style="padding: 0.6rem 0.75rem;">신청 금액</th>
                <th style="padding: 0.6rem 0.75rem;">대상 상품</th>
                <th style="padding: 0.6rem 0.75rem;">상태</th>
                <th style="padding: 0.6rem 0.75rem; text-align: right;">관리</th>
              </tr>
            </thead>
            <tbody>
              ${pendingTransfers.map(t => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255, 107, 107, 0.04);">
                  <td style="padding: 0.85rem 0.75rem; color: #94a3b8; font-size: 0.8rem;">${t.createdAt}</td>
                  <td style="padding: 0.85rem 0.75rem; font-weight: 800; color: #ffffff;">
                    ${t.depositorName}
                    <span style="font-size: 0.72rem; color: #8fa0c7; display: block; font-weight: normal;">(${t.userIdentifier})</span>
                  </td>
                  <td style="padding: 0.85rem 0.75rem; font-weight: 800; color: #ffffff; font-size: 0.95rem;">
                    ${t.requestedAmount.toLocaleString()}원
                    ${t.requestedAmount > 39900 ? `<span style="font-size: 0.7rem; color: #4ade80; display: block; font-weight: normal;">(잔액 ${(t.requestedAmount - 39900).toLocaleString()}원 적립)</span>` : ''}
                  </td>
                  <td style="padding: 0.85rem 0.75rem; color: #e2e8f0;">${t.targetProduct}</td>
                  <td style="padding: 0.85rem 0.75rem;">
                    <span style="background: rgba(255, 107, 107, 0.2); color: #ff8585; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                      확인 대기
                    </span>
                  </td>
                  <td style="padding: 0.85rem 0.75rem; text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                      <button type="button" class="btn-approve-transfer" data-transfer-id="${t.id}" style="padding: 0.4rem 0.75rem; background: #ffffff; color: #000000; font-weight: 800; font-size: 0.78rem; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
                        확인
                      </button>
                      <button type="button" class="btn-reject-transfer" data-transfer-id="${t.id}" style="padding: 0.4rem 0.6rem; background: rgba(255, 107, 107, 0.15); color: #ff8585; font-size: 0.78rem; border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 6px; cursor: pointer;">
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}

      <!-- 최근 승인 완료 내역 -->
      ${approvedTransfers.length > 0 ? `
        <div style="margin-top: 1.25rem; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 1rem;">
          <div style="font-size: 0.82rem; color: #8fa0c7; font-weight: 700; margin-bottom: 0.65rem;">
            최근 승인 완료 내역 (${approvedTransfers.length}건)
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.45rem;">
            ${approvedTransfers.slice(0, 5).map(at => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0.75rem; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.04);">
                <div>
                  <span style="font-weight: 800; color: #fff;">${at.depositorName}</span>
                  <span style="color: #64748b; margin: 0 0.4rem;">|</span>
                  <span style="color: #ffffff; font-weight: 700;">${at.requestedAmount.toLocaleString()}원</span>
                  <span style="color: #64748b; margin: 0 0.4rem;">|</span>
                  <span style="color: #94a3b8;">${at.targetProduct}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: #4ade80; font-size: 0.74rem; font-weight: 700;">${at.appliedCouponCode}</span>
                  <span style="color: #64748b; font-size: 0.72rem;">${at.approvedAt || ''}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  </div>
  `;
}

/**
 * [2] 쿠폰 관리 전용 패널
 */
export function renderAdminCouponPanel(): string {
  const coupons = VoucherStore.getCoupons();

  return `
  <div class="admin-coupon-panel" style="display: flex; flex-direction: column; gap: 1.25rem;">
    <!-- 쿠폰 KPI 요약 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
      <div style="background: rgba(20, 24, 35, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.15rem; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 16px; color: #ffffff;">confirmation_number</span>
          등록 쿠폰 수
        </div>
        <div style="font-size: 1.65rem; font-weight: 900; color: #ffffff;">
          ${coupons.length}<span style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-left: 0.25rem;">종</span>
        </div>
        <div style="font-size: 0.74rem; color: #8fa0c7; margin-top: 0.3rem;">활성 사용 가능: ${coupons.filter(c => c.enabled).length}종</div>
      </div>
    </div>

    <!-- 쿠폰 등록 및 목록 관리 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 1.35rem; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0;">
          쿠폰 관리
        </h3>
      </div>

      <!-- 신규 쿠폰 등록 폼 -->
      <form id="form-create-voucher" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; margin-bottom: 1.5rem;">
        <div style="font-size: 0.85rem; font-weight: 800; color: #ffffff; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: #ffffff;">add_circle</span>
          신규 쿠폰 등록
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">쿠폰 코드 (영문/숫자)</label>
            <input type="text" id="input-voucher-code" required placeholder="예: NEWYEAR-2027" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #ffffff; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">쿠폰 명칭</label>
            <input type="text" id="input-voucher-name" required placeholder="예: 신년 맞이 정밀사주 1만원 할인" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #ffffff; font-size: 0.85rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">할인 유형</label>
            <select id="select-voucher-type" style="width: 100%; box-sizing: border-box; background: #1c2230; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #ffffff; font-size: 0.85rem;">
              <option value="fixed_discount">정액 할인 (원 단위)</option>
              <option value="percent_discount">정률 할인 (% 단위)</option>
              <option value="free_pass">전액 무료 패스</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">할인 금액 or 비율</label>
            <input type="number" id="input-voucher-value" placeholder="예: 10000 or 30" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #ffffff; font-size: 0.85rem;">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; font-weight: 800; background: var(--primary); color: #241a00; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
            쿠폰 등록
          </button>
        </div>
      </form>

      <!-- 등록된 쿠폰 목록 테이블 -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.78rem;">
              <th style="padding: 0.6rem 0.75rem;">쿠폰 코드</th>
              <th style="padding: 0.6rem 0.75rem;">쿠폰 명칭</th>
              <th style="padding: 0.6rem 0.75rem;">할인 혜택</th>
              <th style="padding: 0.6rem 0.75rem;">적용 대상</th>
              <th style="padding: 0.6rem 0.75rem;">사용 횟수</th>
              <th style="padding: 0.6rem 0.75rem;">상태</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${coupons.map(c => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 0.8rem 0.75rem; font-weight: 800; color: #ffffff; font-family: monospace; font-size: 0.95rem;">
                  ${c.code}
                </td>
                <td style="padding: 0.8rem 0.75rem; color: #ffffff; font-weight: 600;">${c.name}</td>
                <td style="padding: 0.8rem 0.75rem; color: #e2e8f0;">
                  ${c.type === 'free_pass' ? '전액 무료' : c.type === 'percent_discount' ? `${c.discountRate}% 할인` : `${(c.discountAmount || 0).toLocaleString()}원 할인`}
                </td>
                <td style="padding: 0.8rem 0.75rem; color: #94a3b8; font-size: 0.8rem;">
                  ${c.targetProduct === 'all' ? '전 품목' : c.targetProduct}
                </td>
                <td style="padding: 0.8rem 0.75rem; color: #94a3b8; font-size: 0.8rem;">${c.usedCount}회</td>
                <td style="padding: 0.8rem 0.75rem;">
                  <button type="button" class="btn-toggle-voucher" data-voucher-id="${c.id}" style="padding: 0.2rem 0.55rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; border: none; cursor: pointer; background: ${c.enabled ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)'}; color: ${c.enabled ? '#4ade80' : '#94a3b8'};">
                    ${c.enabled ? '사용가능' : '사용중지'}
                  </button>
                </td>
                <td style="padding: 0.8rem 0.75rem; text-align: right;">
                  <button type="button" class="btn-delete-voucher" data-voucher-id="${c.id}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; color: #ff8585; background: none; border: 1px solid rgba(255,107,107,0.3); border-radius: 4px; cursor: pointer;">
                    삭제
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
}

/**
 * [3] 하위 호환용 통합 패널 (무통장 + 쿠폰)
 */
export function renderAdminVoucherPanel(): string {
  return `
  <div class="admin-voucher-control-panel" style="display: flex; flex-direction: column; gap: 1.5rem;">
    ${renderAdminBankTransferPanel()}
    ${renderAdminCouponPanel()}
  </div>
  `;
}

export function bindAdminVoucherEvents(container: HTMLElement, onRefresh: () => void): void {
  // 1. 원클릭 승인
  container.querySelectorAll('.btn-approve-transfer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.transferId;
      if (!id) return;
      const res = VoucherStore.approveBankTransfer(id);
      alert(res.message);
      onRefresh();
    });
  });

  // 2. 반려
  container.querySelectorAll('.btn-reject-transfer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.transferId;
      if (!id) return;
      if (confirm('해당 무통장 입금 신청을 반려 처리하시겠습니까?')) {
        VoucherStore.rejectBankTransfer(id);
        alert('신청이 반려 처리되었습니다.');
        onRefresh();
      }
    });
  });

  // 3. 신규 쿠폰 발행
  const form = container.querySelector('#form-create-voucher') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const codeInput = container.querySelector('#input-voucher-code') as HTMLInputElement;
      const nameInput = container.querySelector('#input-voucher-name') as HTMLInputElement;
      const typeSelect = container.querySelector('#select-voucher-type') as HTMLSelectElement;
      const valInput = container.querySelector('#input-voucher-value') as HTMLInputElement;

      const code = codeInput.value.trim();
      const name = nameInput.value.trim();
      const type = typeSelect.value as any;
      const val = parseInt(valInput.value || '0', 10);

      VoucherStore.createCoupon({
        code,
        name,
        type,
        discountAmount: type === 'fixed_discount' ? val : (type === 'free_pass' ? 19900 : 0),
        discountRate: type === 'percent_discount' ? val : 0,
        targetProduct: 'all',
        expiryDate: '2026-12-31',
        enabled: true
      });

      alert(`신규 쿠폰 [${code}] 이 성공적으로 등록되었습니다.`);
      onRefresh();
    });
  }

  // 4. 쿠폰 토글
  container.querySelectorAll('.btn-toggle-voucher').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.voucherId;
      if (id) {
        VoucherStore.toggleCoupon(id);
        onRefresh();
      }
    });
  });

  // 5. 쿠폰 삭제
  container.querySelectorAll('.btn-delete-voucher').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.voucherId;
      if (id && confirm('정말 이 쿠폰을 삭제하시겠습니까?')) {
        VoucherStore.deleteCoupon(id);
        onRefresh();
      }
    });
  });
}
