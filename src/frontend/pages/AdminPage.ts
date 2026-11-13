import { PageModule, PageContext } from './types.js';
import { getAdminActiveTab } from '../state/admin-tab-state.js';
import { ensureAdminMembersLoaded } from '../views/AdminMembersPanel.js';
import { ensurePaymentLedgerSynced } from '../modules/payment/AdminPaymentLedgerPanel.js';

let cachedRenderAdminDashboard: (() => string) | null = null;
let adminLoadPromise: Promise<void> | null = null;

function syncMembersIfActive(container: HTMLElement): void {
  if (getAdminActiveTab() !== 'tab-members') return;
  ensureAdminMembersLoaded(() => {
    if (cachedRenderAdminDashboard && container.isConnected && getAdminActiveTab() === 'tab-members') {
      container.innerHTML = cachedRenderAdminDashboard();
    }
  });
}

function syncPaymentLedgerIfActive(container: HTMLElement): void {
  const tab = getAdminActiveTab();
  if (tab !== 'tab-store-orders' && tab !== 'tab-orders') return;
  ensurePaymentLedgerSynced(() => {
    const active = getAdminActiveTab();
    if (cachedRenderAdminDashboard && container.isConnected && (active === 'tab-store-orders' || active === 'tab-orders')) {
      container.innerHTML = cachedRenderAdminDashboard();
    }
  });
}

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
    if (cachedRenderAdminDashboard) {
      syncMembersIfActive(container);
      syncPaymentLedgerIfActive(container);
      return;
    }
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
      if (cachedRenderAdminDashboard && container.isConnected) {
        container.innerHTML = cachedRenderAdminDashboard();
        syncMembersIfActive(container);
        syncPaymentLedgerIfActive(container);
      }
    });
  },
};
