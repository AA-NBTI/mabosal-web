import { PageModule, PageContext } from './types.js';
import { renderSubscriptionView } from '../views/SubscriptionView.js';

export const SubscriptionPage: PageModule = {
  id: 'subscription',
  render(ctx: PageContext): string {
    return renderSubscriptionView(ctx.state);
  },
};

