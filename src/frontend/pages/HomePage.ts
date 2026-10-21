import { PageModule, PageContext } from './types.js';
import { renderLandingView } from '../components/views.js';
import { renderFunnelLandingView } from '../views/pages/FunnelLandingView.js';
import { AbTestService } from '../modules/ab-test/ab-test-service.js';

export const HomePage: PageModule = {
  id: 'home',
  render(ctx: PageContext): string {
    // A/B 테스트 분기 (URL 파라미터 ?ab=b 또는 관리자 마스터 토글 cro_funnel_ab_test)
    if (AbTestService.isFunnelVariantB()) {
      AbTestService.trackEvent('visit');
      return renderFunnelLandingView(ctx.state);
    }
    AbTestService.trackEvent('visit');
    return renderLandingView(ctx.state);
  },
};
