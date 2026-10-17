import { PageModule, PageContext } from './types.js';
import { renderMemberDashboardView } from '../views/MemberDashboardView.js';

export const MemberDashboardPage: PageModule = {
  id: 'member-dashboard',
  render(ctx: PageContext): string {
    return renderMemberDashboardView(ctx.state);
  },
};
