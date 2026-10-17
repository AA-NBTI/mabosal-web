import { PageModule, PageContext } from './types.js';
import { renderLoveCategoryPage } from '../views/pages/LoveCategoryPage.js';

export const LovePage: PageModule = {
  id: 'love',
  render(ctx: PageContext): string {
    return renderLoveCategoryPage(ctx.state);
  },
};
