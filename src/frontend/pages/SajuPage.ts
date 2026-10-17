import { PageModule, PageContext } from './types.js';
import { renderSajuCategoryPage } from '../views/pages/SajuCategoryPage.js';

export const SajuPage: PageModule = {
  id: 'saju',
  render(ctx: PageContext): string {
    return renderSajuCategoryPage(ctx.state);
  },
};
