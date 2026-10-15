/**
 * ReportRouterMapper - 상품 ID 및 티어 기반 전용 감정서 1:1 직결 라우팅 매퍼
 */
import { ProductTierTab } from '../../state/app-state.js';

export class ReportRouterMapper {
  /**
   * 상품 ID 또는 reportTier를 기반으로 정확한 결과 화면 ProductTierTab을 판별
   */
  public static resolveTier(productId?: string, reportTier?: string): ProductTierTab {
    const pId = (productId || '').toLowerCase();
    const tier = (reportTier || '').toUpperCase();

    // 1. 2027 신년운세 리포트
    if (tier === 'YEAR_2027' || pId.includes('year2027') || pId.includes('year-2027') || pId.includes('newyear')) {
      return 'YEAR_2027';
    }

    // 2. 직장 / 이직 특화 운세
    if (tier === 'CAREER' || pId.includes('career') || pId.includes('job')) {
      return 'CAREER';
    }

    // 3. 재물 / 사업 특화 운세
    if (tier === 'WEALTH' || pId.includes('wealth') || pId.includes('money')) {
      return 'WEALTH';
    }

    // 4. 궁합 / 상대방 심층 분석 리포트
    if (tier === 'CHEMISTRY' || pId.includes('chemistry') || pId.includes('match') || pId.includes('gunghap')) {
      return 'CHEMISTRY';
    }

    // 5. 마살 / 충형파해 심층 진단서
    if (tier === 'CONFLICT_MALSAL' || pId.includes('conflict') || pId.includes('malsal')) {
      return 'CONFLICT_MALSAL';
    }

    // 6. 애정 / 재회 특화 운세
    if (tier === 'LOVE_REUNION' || pId.includes('love') || pId.includes('reunion')) {
      return 'LOVE_REUNION';
    }

    // 7. VIP 14.9만원 정밀 감정서
    if (tier === 'PREMIUM' || pId.includes('vip') || pId === 'prod-paid-saju-premium') {
      return 'PREMIUM';
    }

    // 8. 3.9만원 정통 유료 사주 또는 입문 진단서
    if (tier === 'PAID' || tier === 'COMPREHENSIVE' || tier === 'ENTRY' || pId.includes('saju')) {
      return 'PAID';
    }

    // 기본값: PAID (유료 결제 완료 고객이므로 유료 사주 화면 우선 배정)
    return 'PAID';
  }

  /**
   * 주문 상품의 친화적 감정서 타이틀 반환
   */
  public static getReportTitle(tier: ProductTierTab): string {
    switch (tier) {
      case 'YEAR_2027':
        return '2027 정미년(丁未年) 신년운세 & 월별 대운 비책';
      case 'CAREER':
        return '직장·이직 특화 운세: 퇴사 vs 잔류 명리 판단 리포트';
      case 'WEALTH':
        return '평생 재물운 & 금전 대운 흐름 심층 감정서';
      case 'CHEMISTRY':
        return '마보살 정밀 인연 궁합 & 관계 처방서';
      case 'CONFLICT_MALSAL':
        return '마살(魔煞) 심층 진단 & 충·형·파·해 방어 비책';
      case 'PREMIUM':
        return '마보살 VIP 심층 사주 감정서 (149,000원 상당)';
      case 'PAID':
      default:
        return '마보살 정통 사주풀이 (평생 대운 & 정밀 심층 감정서)';
    }
  }
}
