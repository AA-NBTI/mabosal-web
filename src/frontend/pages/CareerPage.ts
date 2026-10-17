import { PageModule, PageContext } from './types.js';
import { renderCareerCategoryPage } from '../views/pages/CareerCategoryPage.js';

export const CareerPage: PageModule = {
  id: 'career',
  render(ctx: PageContext): string {
    return renderCareerCategoryPage(ctx.state);
  },
};
