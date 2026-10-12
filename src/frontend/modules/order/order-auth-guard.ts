/**
 * [OrderAuthGuard] 주문 프로세스 회원 인증 가드
 * 비회원(게스트) 주문 차단, 로그인 창 팝업, 로그인 후 원래 주문서로 자동 연결
 */
import { AuthService } from '../../state/auth-service.js';

const STORAGE_PENDING_ORDER_PRODUCT = 'mabosal_pending_order_prod_id';

export class OrderAuthGuard {
  /**
   * 주문 시도 시 회원 인증 확인
   * @param productId 주문하려는 상품 ID
   * @returns true: 회원 인증됨 (주문서 오픈 가능), false: 비회원 (로그인 모달 팝업됨)
   */
  static checkOrderAuth(productId: string): boolean {
    const user = AuthService.getCurrentUser();
    
    // 게스트(비로그인) 상태이면 로그인 모달 팝업
    if (user.role === 'guest') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_PENDING_ORDER_PRODUCT, productId);
      }

      // 로그인/회원가입 모달 열기
      const modal = document.getElementById('modal-auth-container');
      if (modal) {
        modal.style.display = 'flex';
      }

      // 사용자 친화적 안내 알림
      setTimeout(() => {
        alert('주문 및 결제를 진행하시려면 먼저 로그인 또는 회원가입을 완료해 주세요.\n로그인 완료 후 선택하신 상품의 주문서로 자동 연결됩니다.');
      }, 50);

      return false;
    }

    return true;
  }

  /**
   * 로그인 완료 후 대기 중인 상품이 있는지 확인하고 가져옴
   */
  static consumePendingOrderProduct(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    const prodId = sessionStorage.getItem(STORAGE_PENDING_ORDER_PRODUCT);
    if (prodId) {
      sessionStorage.removeItem(STORAGE_PENDING_ORDER_PRODUCT);
      return prodId;
    }
    return null;
  }
}
