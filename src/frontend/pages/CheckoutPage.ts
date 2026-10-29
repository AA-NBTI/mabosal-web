import { PageModule, PageContext } from './types.js';
import { renderCheckoutBoardView } from '../modules/checkout/index.js';

export const CheckoutPage: PageModule = {
  id: 'checkout',
  render(_ctx: PageContext): string {
    return renderCheckoutBoardView();
  },
  onMount(outletEl: HTMLElement): void {
    const couponInput = outletEl.querySelector('#checkout-coupon-code') as HTMLInputElement | null;
    const applyBtn = outletEl.querySelector('#btn-apply-coupon') as HTMLElement | null;
    if (couponInput && couponInput.value.trim() && applyBtn) {
      applyBtn.click();
    }
  },
};
