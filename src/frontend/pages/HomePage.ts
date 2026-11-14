import { PageModule, PageContext } from './types.js';
import { renderLandingView } from '../components/views.js';
import { AbTestService } from '../modules/ab-test/ab-test-service.js';

export const HomePage: PageModule = {
  id: 'home',
  render(ctx: PageContext): string {
    AbTestService.trackEvent('visit');
    return renderLandingView(ctx.state);
  },
};
