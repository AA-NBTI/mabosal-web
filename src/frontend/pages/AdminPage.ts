import { PageModule, PageContext } from './types.js';
import { renderAdminDashboardView } from '../views/AdminDashboardView.js';

export const AdminPage: PageModule = {
  id: 'admin',
  render(_ctx: PageContext): string {
    return renderAdminDashboardView();
  },
};
