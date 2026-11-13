import { PageModule, PageContext } from './types.js';

let cachedRenderAdminDashboard: (() => string) | null = null;
let adminLoadPromise: Promise<void> | null = null;

export const AdminPage: PageModule = {
  id: 'admin',
  render(_ctx: PageContext): string {
    if (cachedRenderAdminDashboard) {
      return cachedRenderAdminDashboard();
    }
    return `
      <div style="min-height: 60vh; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.95rem;">
        관리자 대시보드를 불러오는 중입니다...
      </div>
    `;
  },
  onMount(container: HTMLElement): void {
    if (cachedRenderAdminDashboard) return;
    if (!adminLoadPromise) {
      adminLoadPromise = import('../views/AdminDashboardView.js')
        .then(mod => {
          cachedRenderAdminDashboard = mod.renderAdminDashboardView;
        })
        .catch(err => {
          console.error('[AdminPage] Failed to load AdminDashboardView:', err);
        })
        .finally(() => {
          adminLoadPromise = null;
        });
    }
    void adminLoadPromise.then(() => {
      if (cachedRenderAdminDashboard) {
        container.innerHTML = cachedRenderAdminDashboard();
      }
    });
  },
};
