import { PageModule, PageContext } from './types.js';
import { renderLandingView } from '../components/views.js';

export const HomePage: PageModule = {
  id: 'home',
  render(ctx: PageContext): string {
    return renderLandingView(ctx.state);
  },
};
