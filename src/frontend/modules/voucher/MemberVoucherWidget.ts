/**
 * [이용자 대시보드 전용] 내 쿠폰 등록 & 무통장 입금 신청/승인 확인 위젯 모듈
 */
import { VoucherStore, UserVoucherWalletItem, BankTransferRequest } from './voucher-store.js';

export function renderMemberVoucherWidget(): string {
  const wallet = VoucherStore.getUserWallet();
  const transfers = VoucherStore.getBankTransfers();
  const cashBalance = VoucherStore.getUserCash();

  return `
  <div class="member-voucher-module" style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
    
    <!-- 상단: 보유 캐시 & 쿠폰 현황 바 -->
    <div style="background: linear-gradient(135deg, rgba(20, 24, 35, 0.95), rgba(35, 42, 60, 0.95)); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.25rem 1.4rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); display: flex; align-items: center; justify-content: center; color: var(--primary);">
          <span class="material-symbols-outlined" style="font-size: 24px;">wallet</span>
        </div>
        <div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">내 지갑 보유 잔액 & 행운쿠폰</div>
          <div style="display: flex; align-items: baseline; gap: 0.8rem; margin-top: 0.15rem;">
            <span style="font-size: 1.35rem; font-weight: 900; color: #ffffff;">
              잔액 캐시: <strong style="color: var(--primary);">${cashBalance.toLocaleString()}원</strong>
            </span>
            <span style="font-size: 0.85rem; color: #8fa0c7;">
              보유 행운쿠폰: <strong style="color: #4ade80;">${wallet.length}장</strong>
            </span>
          </div>
        </div>
      </div>
      <button type="button" id="btn-quick-store-link" style="padding: 0.55rem 1.15rem; font-size: 0.85rem; font-weight: 800; background: var(--primary); color: #241a00; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.3);">
        <span class="material-symbols-outlined" style="font-size: 18px;">storefront</span>
        스토어에서 사용하기
      </button>
    </div>

    <!-- 2단 그리드: 좌측(행운쿠폰 등록 & 보유 목록) <-> 우측(무통장 입금 신청 & 승인 상태) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem;">
      
      <!-- 패널 1: 행운쿠폰 & 상품권 등록 및 보유 목록 -->
      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1.25rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 1rem;">
          <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">confirmation_number</span>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #ffffff; margin: 0;">내 행운쿠폰 & 상품권 보관함</h3>
        </div>

        <!-- 행운쿠폰 등록 폼 -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
          <input type="text" id="input-member-voucher-code" placeholder="행운쿠폰 또는 상품권 코드 입력" style="flex: 1; min-width: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.6rem 0.8rem; color: #ffffff; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">
          <button type="button" id="btn-register-member-voucher" style="padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 800; background: rgba(242, 202, 80, 0.2); border: 1px solid rgba(242, 202, 80, 0.45); color: var(--primary); border-radius: 8px; cursor: pointer; white-space: nowrap;">
            등록하기
          </button>
        </div>

        <!-- 보유 행운쿠폰 목록 -->
        <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.65rem;">보유 중인 행운쿠폰 (${wallet.length})</div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; flex: 1;">
          ${wallet.length === 0 ? `
            <div style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.85rem;">보유 중인 행운쿠폰이 없습니다.</div>
          ` : wallet.map(w => `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(242, 202, 80, 0.2); border-radius: 10px; padding: 0.95rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                  <span style="font-family: monospace; font-size: 0.85rem; font-weight: 800; color: var(--primary); background: rgba(242,202,80,0.12); padding: 0.15rem 0.45rem; border-radius: 4px;">${w.code}</span>
                  <span style="font-size: 0.72rem; color: #4ade80; font-weight: 700;">사용가능</span>
                </div>
                <div style="font-size: 0.88rem; font-weight: 800; color: #ffffff; margin-bottom: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${w.name}</div>
                <div style="font-size: 0.76rem; color: #8fa0c7;">혜택: <strong style="color: #fff;">${w.discountDescription}</strong> (기한: ${w.expiryDate})</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 패널 2: 무통장 입금 신청 & 실시간 승인 상태 확인 -->
      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1.25rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.85rem;">
          <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">payments</span>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #ffffff; margin: 0;">무통장 입금 확인 및 신청</h3>
        </div>

        <!-- 공식 입금 계좌 카드 안내 -->
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 10px; padding: 0.85rem; margin-bottom: 1rem; font-size: 0.82rem;">
          <div style="color: var(--primary); font-weight: 800; margin-bottom: 0.25rem;">[공식 입금 계좌 안내]</div>
          <div style="font-size: 0.92rem; font-weight: 900; color: #ffffff;">기업은행 103-123733-04-012</div>
          <div style="color: #dfe2f1; font-size: 0.78rem; margin-top: 0.15rem;">예금주: <strong style="color: var(--primary);">템바보드 주식회사</strong> (입금자명 일치 필수)</div>
        </div>

        <!-- 간편 입금 확인 신청 폼 -->
        <form id="form-member-transfer-request" style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; background: rgba(0,0,0,0.2); padding: 0.85rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="font-size: 0.78rem; font-weight: 700; color: #fff;">입금 완료 후 확인 신청</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <input type="text" id="input-member-depositor" required placeholder="입금자 성함 (실명)" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #ffffff; font-size: 0.82rem;">
            <select id="select-member-transfer-product" style="background: #1c2230; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.5rem; color: #ffffff; font-size: 0.82rem;">
              <option value="40000|마보살 정통 유료 사주풀이 (39,900원)">사주풀이 40,000원 (잔액100원 적립)</option>
              <option value="39900|마보살 정통 유료 사주풀이 (39,900원)">정통 사주풀이 39,900원</option>
              <option value="19900|마보살 정통 사주 진단서 (19,900원)">사주 진단서 19,900원</option>
            </select>
          </div>
          <button type="submit" style="padding: 0.55rem; font-size: 0.82rem; font-weight: 800; background: var(--primary); color: #241a00; border: none; border-radius: 6px; cursor: pointer;">
            입금 확인 신청하기
          </button>
        </form>

        <!-- 내 입금 신청 현황 타임라인 -->
        <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.5rem;">내 입금 확인 처리 상태</div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto;">
          ${transfers.map(tr => `
            <div style="background: rgba(0,0,0,0.2); border: 1px solid ${tr.status === 'approved' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 107, 107, 0.3)'}; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.78rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-weight: 800; color: #fff;">${tr.depositorName} (${tr.requestedAmount.toLocaleString()}원)</span>
                <span style="font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem; background: ${tr.status === 'approved' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 107, 107, 0.15)'}; color: ${tr.status === 'approved' ? '#4ade80' : '#ff8585'};">
                  ${tr.status === 'approved' ? '승인완료 (쿠폰지급)' : tr.status === 'pending' ? '입금 확인중' : '반려'}
                </span>
              </div>
              <div style="color: #94a3b8; font-size: 0.72rem;">${tr.targetProduct} · ${tr.createdAt}</div>
              ${tr.appliedCouponCode ? `
                <div style="color: #4ade80; font-weight: 700; margin-top: 0.2rem; font-size: 0.74rem;">
                  발급 쿠폰: ${tr.appliedCouponCode} (보관함에 자동 등록됨)
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
  `;
}

export function bindMemberVoucherEvents(container: HTMLElement, onNavigateStore: () => void, onRefresh: () => void): void {
  // 1. 쿠폰 등록
  const regBtn = container.querySelector('#btn-register-member-voucher');
  const regInput = container.querySelector('#input-member-voucher-code') as HTMLInputElement;
  if (regBtn && regInput) {
    regBtn.addEventListener('click', () => {
      const code = regInput.value.trim();
      if (!code) {
        alert('쿠폰 코드를 입력해주세요.');
        return;
      }
      const res = VoucherStore.registerUserVoucher(code);
      alert(res.message);
      if (res.success) {
        regInput.value = '';
        onRefresh();
      }
    });
  }

  // 2. 무통장 입금 신청
  const form = container.querySelector('#form-member-transfer-request') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = container.querySelector('#input-member-depositor') as HTMLInputElement;
      const selectProduct = container.querySelector('#select-member-transfer-product') as HTMLSelectElement;

      const depositor = nameInput.value.trim();
      const [amtStr, prodName] = selectProduct.value.split('|');
      const amount = parseInt(amtStr, 10);

      VoucherStore.createBankTransferRequest(depositor, amount, prodName);
      alert(`[${depositor}] 님의 무통장 입금 확인 신청이 접수되었습니다.\n관리자 실사 확인 후 쿠폰이 즉시 지급됩니다.`);
      nameInput.value = '';
      onRefresh();
    });
  }

  // 3. 스토어로 바로가기
  const storeLink = container.querySelector('#btn-quick-store-link');
  if (storeLink) {
    storeLink.addEventListener('click', () => {
      onNavigateStore();
    });
  }
}
