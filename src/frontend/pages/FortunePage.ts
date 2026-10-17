import { PageModule, PageContext } from './types.js';
import { renderFortuneCategoryPage } from '../views/pages/FortuneCategoryPage.js';

export const FortunePage: PageModule = {
  id: 'fortune',
  render(ctx: PageContext): string {
    return renderFortuneCategoryPage(ctx.state);
  },
};
