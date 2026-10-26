/**
 * FunnelCheckoutHelper
 * 
 * B안 구매 전환 단일 퍼널 전용 결제 확인 모달 및 결제 트랜잭션 처리기
 * - 최종 주문 내역 확인 (상품명, 의뢰인 사주, 결제 금액 ₩39,900)
 * - 결제 성공·실패·취소 및 중복 결제 방지
 * - 서버/스토어 데이터 검증 및 마이페이지 영구 보관
 * - 결제 완료 후 8대 심층 리포트 즉시 해금
 */

import { appState } from '../../state/app-state.js';
import { AuthService } from '../../state/auth-service.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { createStoreOrder, isProductAlreadyPurchased, OFFICIAL_BANK_ACCOUNT } from '../../extensions/commerce-store/store-service.js';
import { frontendAdapter } from '../../adapter/engine-adapter.js';
import { AbTestService } from '../../modules/ab-test/ab-test-service.js';
import { VoucherStore } from '../../modules/voucher/voucher-store.js';

export class FunnelCheckoutHelper {
  public static readonly PRODUCT_ID = 'prod-paid-saju-premium';
  public static readonly PRODUCT_TITLE = '마보살 정통 유료 정밀 사주 분석서 (8대 심층 처방)';
  public static readonly PRICE = 39900;
  public static readonly ORIGINAL_PRICE = 79900;

  /**
   * 결제 확인 모달 HTML 렌더링
   */
  public static renderCheckoutModal(): string {
    const state = appState.getState();
    const userName = state.userName || '의뢰인';
    const sajuSnap = UserSajuStore.getProfileOrDefault();
    const troubleText = state.userTroubleText || '최근 답답한 문제의 원인과 해결책 분석';

    return `
    <div id="modal-funnel-checkout" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(6px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; animation: fadeIn 0.2s ease;">
      <div style="background: var(--surface-container, #141722); border: 1.5px solid var(--primary, #f2ca50); border-radius: 20px; max-width: 500px; width: 100%; padding: 1.75rem 1.5rem; box-shadow: 0 16px 50px rgba(0, 0, 0, 0.8); color: #dfe2f1; font-family: var(--font-body); position: relative;">
        
        <!-- 닫기 버튼 -->
        <button type="button" class="btn-close-funnel-modal" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; line-height: 1;">×</button>

        <!-- 상단 헤더 -->
        <div style="text-align: center; margin-bottom: 1.25rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 800; color: var(--primary); background: rgba(242,202,80,0.15); padding: 0.2rem 0.6rem; border-radius: 9999px; margin-bottom: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 14px;">verified_user</span> 결제 전 최종 주문 내역 확인
          </div>
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem; font-weight: 900; color: #ffffff; margin: 0;">
            ${FunnelCheckoutHelper.PRODUCT_TITLE}
          </h3>
        </div>

        <!-- 주문 정보 요약 카드 -->
        <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 1.25rem; font-size: 0.82rem; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #94a3b8;">분석 대상자:</span>
            <strong style="color: #fff;">${userName} (${sajuSnap.gender === 'female' ? '여성' : '남성'}, ${sajuSnap.solarBirthDate})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <span style="color: #94a3b8;">핵심 고민:</span>
            <span style="color: #dfe2f1; max-width: 280px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${troubleText}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="color: #94a3b8;">최종 결제 금액:</span>
            <span style="font-size: 1.35rem; font-weight: 900; color: var(--primary); font-family: var(--font-display);">₩ ${FunnelCheckoutHelper.PRICE.toLocaleString()}</span>
          </div>
        </div>

        <!-- 결제 수단 선택 -->
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.5rem;">
            결제 수단 선택
          </label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
            <label style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; padding: 0.75rem 0.5rem; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); cursor: not-allowed; text-align: center; opacity: 0.45;" title="현재 카드사 심사 준비 중입니다.">
              <input type="radio" name="funnel-pay-method" value="card" disabled style="display: none;" />
              <span class="material-symbols-outlined" style="font-size: 20px; color: #94a3b8;">credit_card</span>
              <span style="font-size: 0.78rem; font-weight: 700; color: #94a3b8;">신용/체크카드</span>
              <span style="font-size: 0.65rem; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 0.05rem 0.3rem; border-radius: 3px; font-weight: 800;">심사 준비중</span>
            </label>
            <label style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; padding: 0.75rem 0.5rem; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); cursor: not-allowed; text-align: center; opacity: 0.45;" title="현재 토스페이 심사 준비 중입니다.">
              <input type="radio" name="funnel-pay-method" value="tosspay" disabled style="display: none;" />
              <span class="material-symbols-outlined" style="font-size: 20px; color: #94a3b8;">wallet</span>
              <span style="font-size: 0.78rem; font-weight: 700; color: #94a3b8;">토스페이</span>
              <span style="font-size: 0.65rem; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 0.05rem 0.3rem; border-radius: 3px; font-weight: 800;">심사 준비중</span>
            </label>
            <label style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; padding: 0.75rem 0.5rem; border-radius: 10px; background: rgba(242,202,80,0.12); border: 1.5px solid var(--primary); cursor: pointer; text-align: center;">
              <input type="radio" name="funnel-pay-method" value="bank_transfer" checked style="display: none;" />
              <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">account_balance</span>
              <span style="font-size: 0.78rem; font-weight: 800; color: #fff;">무통장 입금</span>
              <span style="font-size: 0.65rem; color: #4ade80; background: rgba(74, 222, 128, 0.15); padding: 0.05rem 0.3rem; border-radius: 3px; font-weight: 800;">추천 · 접수</span>
            </label>
          </div>
        </div>

        <!-- 무통장 공식 입금 계좌 안내 -->
        <div style="background: rgba(12, 16, 26, 0.95); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px;">account_balance</span>
            공식 입금 계좌 안내
          </div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">
            ${OFFICIAL_BANK_ACCOUNT.bankName} <span style="color: var(--primary);">${OFFICIAL_BANK_ACCOUNT.accountNumber}</span>
          </div>
          <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 0.2rem;">
            예금주: <strong style="color: #fff;">${OFFICIAL_BANK_ACCOUNT.holder}</strong>
          </div>
          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 0.35rem; line-height: 1.4;">
            ※ 입금 신청 후 관리자가 입금을 확인하면 8대 심층 리포트가 즉시 해금됩니다.
          </div>
        </div>

        <!-- 최종 무통장 입금 신청 버튼 -->
        <button type="button" id="btn-confirm-funnel-pay" style="width: 100%; background: var(--primary); color: #1c1500; border: none; border-radius: 12px; padding: 1.1rem; font-size: 1.05rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 20px rgba(242, 202, 80, 0.4); transition: transform 0.15s ease;">
          <span class="material-symbols-outlined" style="font-size: 20px;">send</span>
          <span>₩ ${FunnelCheckoutHelper.PRICE.toLocaleString()} 무통장 입금 신청하기</span>
        </button>

      </div>
    </div>
    `;
  }

  /**
   * 결제 실행 및 권한 해금 처리 (무통장 입금 접수)
   */
  public static async executePayment(): Promise<{ success: boolean; message: string }> {
    const state = appState.getState();
    const userName = state.userName || '의뢰인';
    const currentUser = AuthService.getCurrentUser();

    // 중복 결제 방지 확인
    const already = isProductAlreadyPurchased(this.PRODUCT_ID, userName) || isProductAlreadyPurchased(this.PRODUCT_ID);
    if (already) {
      await frontendAdapter.upgradeTier('paid_detailed_saju');
      appState.setActiveTierTab('PAID');
      return { success: true, message: '이미 결제가 완료된 사주 분석입니다. 8대 심층 리포트를 즉시 열람합니다.' };
    }

    // 주문서 생성 (무통장 입금은 관리자 입금 확인 전까지 pending 상태 유지)
    try {
      const order = createStoreOrder({
        productId: this.PRODUCT_ID,
        buyerName: userName || (currentUser.role !== 'guest' ? currentUser.name : '의뢰인'),
        buyerPhone: currentUser.phone || '010-0000-0000',
        buyerEmail: currentUser.email || 'customer@mabosal.com',
        paymentMethod: 'bank_transfer',
        status: 'pending',
      });

      // 최고 관리자 무통장 입금 승인 패널 및 마이페이지 대기열에 신청서 등록
      VoucherStore.createBankTransferRequest(
        order.buyerName,
        order.amount,
        order.productTitle,
        order.buyerEmail,
        order.orderId
      );

      // A/B 테스트 성과 지표 기록
      AbTestService.trackEvent('purchase', this.PRICE);

      return {
        success: true,
        message: `[무통장 입금 신청 완료]\n주문번호: #${order.orderId.slice(-8)}\n입금계좌: ${OFFICIAL_BANK_ACCOUNT.bankName} ${OFFICIAL_BANK_ACCOUNT.accountNumber} (${OFFICIAL_BANK_ACCOUNT.holder})\n입금 확인 즉시 8대 심층 리포트가 정상 해금됩니다.`
      };
    } catch (err: any) {
      console.error('[FunnelCheckout] execution error:', err);
      return { success: false, message: '주문 접수 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
    }
  }
}
