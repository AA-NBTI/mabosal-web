import { PageModule, PageContext } from './types.js';
import { renderResultView } from '../components/views.js';
import { renderSolutionHub } from '../extensions/solution-hub/index.js';
import { renderFunnelResultView } from '../views/pages/FunnelResultView.js';
import { AbTestService } from '../modules/ab-test/ab-test-service.js';

export const ResultPage: PageModule = {
  id: 'result',
  render(ctx: PageContext): string {
    // A/B 테스트 분기 (URL 파라미터 ?ab=b 또는 관리자 마스터 토글 cro_funnel_ab_test)
    if (AbTestService.isFunnelVariantB()) {
      return renderFunnelResultView(ctx.state);
    }
    return renderResultView(ctx.state) + renderSolutionHub(ctx.state);
  },
};
