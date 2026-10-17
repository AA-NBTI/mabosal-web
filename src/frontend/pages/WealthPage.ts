import { PageModule, PageContext } from './types.js';
import { renderWealthCategoryPage } from '../views/pages/WealthCategoryPage.js';

export const WealthPage: PageModule = {
  id: 'wealth',
  render(ctx: PageContext): string {
    return renderWealthCategoryPage(ctx.state);
  },
};
