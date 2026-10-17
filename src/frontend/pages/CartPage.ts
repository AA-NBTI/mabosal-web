import { PageModule, PageContext } from './types.js';
import { renderCartBoardView } from '../modules/cart/index.js';

export const CartPage: PageModule = {
  id: 'cart',
  render(_ctx: PageContext): string {
    return renderCartBoardView();
  },
};
