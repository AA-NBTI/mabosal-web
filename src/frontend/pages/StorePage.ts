import { PageModule, PageContext } from './types.js';
import { renderCommerceStoreView } from '../extensions/commerce-store/index.js';

export const StorePage: PageModule = {
  id: 'store',
  render(ctx: PageContext): string {
    return renderCommerceStoreView(ctx.state);
  },
};
