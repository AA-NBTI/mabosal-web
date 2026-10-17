import { PageModule, PageContext } from './types.js';
import { renderCheckoutBoardView } from '../modules/checkout/index.js';

export const CheckoutPage: PageModule = {
  id: 'checkout',
  render(_ctx: PageContext): string {
    return renderCheckoutBoardView();
  },
};
