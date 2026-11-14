import { PageModule, PageContext } from './types.js';
import { getAdminActiveTab, setAdminActiveTab } from '../state/admin-tab-state.js';
import { ensureAdminMembersLoaded } from '../views/AdminMembersPanel.js';
import { ensurePaymentLedgerSynced, setPaymentLedgerFilter } from '../modules/payment/AdminPaymentLedgerPanel.js';
import { syncOrdersFromSupabase } from '../extensions/commerce-store/store-service.js';
import { supabase } from '../modules/supabase/supabase-client.js';
import { AuthService } from '../state/auth-service.js';

let cachedRenderAdminDashboard: (() => string) | null = null;
let adminLoadPromise: Promise<void> | null = null;
let activeAdminContainer: HTMLElement | null = null;
let ordersUpdatedListenerBound = false;
let realtimeOrdersChannel: ReturnType<typeof supabase.channel> | null = null;

function rerenderAdminIfConnected(): void {
  if (cachedRenderAdminDashboard && activeAdminContainer && activeAdminContainer.isConnected) {
    activeAdminContainer.innerHTML = cachedRenderAdminDashboard();
  }
}

function showAdminRefundToast(orderId: string, reason?: string): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('admin-refund-realtime-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'admin-refund-realtime-toast';
  toast.style.cssText = [
    'position: fixed',
    'top: 1.25rem',
    'right: 1.25rem',
    'z-index: 99999',
    'max-width: 360px',
    'background: rgba(24, 18, 22, 0.96)',
    'border: 1px solid rgba(239, 68, 68, 0.75)',
    'box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45)',
    'border-radius: 12px',
    'padding: 0.9rem 1rem',
    'color: #fff',
    'cursor: pointer',
    'backdrop-filter: blur(10px)',
    'display: flex',
    'flex-direction: column',
    'gap: 0.25rem',
  ].join(';');

  toast.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
      <span style="font-size:0.82rem; font-weight:800; color:#fca5a5;">🔔 새 환불 신청이 접수되었습니다</span>
      <span style="font-size:0.7rem; color:#94a3b8;">클릭하여 확인</span>
    </div>
    <div style="font-size:0.76rem; color:#e2e8f0; font-family:monospace;">주문번호: ${orderId}</div>
    ${reason ? `<div style="font-size:0.73rem; color:#cbd5e1;">사유: ${reason}</div>` : ''}
  `;

  toast.addEventListener('click', () => {
    setPaymentLedgerFilter('refund_requested');
    setAdminActiveTab('tab-store-orders');
    rerenderAdminIfConnected();
    toast.remove();
  });

  document.body.appendChild(toast);
  window.setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 10000);
}

function ensureAdminOrdersRealtimeAndEvents(container: HTMLElement): void {
  activeAdminContainer = container;

  if (!ordersUpdatedListenerBound && typeof window !== 'undefined') {
    ordersUpdatedListenerBound = true;
    window.addEventListener('mabosal:orders-updated', () => {
      rerenderAdminIfConnected();
    });
  }

  if (!realtimeOrdersChannel && typeof (supabase as any)?.channel === 'function') {
    try {
      realtimeOrdersChannel = supabase
        .channel('admin-orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => {
            const nextRow = payload?.new;
            const prevRow = payload?.old;
            const becameRefundRequested =
              Boolean(nextRow?.refund_requested) &&
              nextRow?.status !== 'refunded' &&
              (!prevRow || !prevRow.refund_requested);

            void syncOrdersFromSupabase().then(changed => {
              if (changed) rerenderAdminIfConnected();
            });

            if (becameRefundRequested && nextRow?.id) {
              showAdminRefundToast(String(nextRow.id), nextRow.refund_reason ? String(nextRow.refund_reason) : undefined);
            }
          }
        )
        .subscribe();
    } catch {
      // Realtime 미지원 환경(테스트 등) 무시
    }
  }
}

function syncMembersIfActive(container: HTMLElement): void {
  if (getAdminActiveTab() !== 'tab-members') return;
  ensureAdminMembersLoaded(() => {
    if (cachedRenderAdminDashboard && container.isConnected && getAdminActiveTab() === 'tab-members') {
      container.innerHTML = cachedRenderAdminDashboard();
    }
  });
}

function syncPaymentLedgerOnAdminEnter(container: HTMLElement, force = false): void {
  // 대시보드 홈(tab-overview)에서도 환불 요청 배지/KPI를 최신화하기 위해 탭과 무관하게 주문 장부를 동기화
  ensurePaymentLedgerSynced(() => {
    if (cachedRenderAdminDashboard && container.isConnected) {
      container.innerHTML = cachedRenderAdminDashboard();
    }
  }, force);
}

export function cleanupAdminRealtime(): void {
  if (realtimeOrdersChannel && typeof (supabase as any)?.removeChannel === 'function') {
    try {
      void (supabase as any).removeChannel(realtimeOrdersChannel);
    } catch {}
  }
  realtimeOrdersChannel = null;
  activeAdminContainer = null;
}

export const AdminPage: PageModule = {
  id: 'admin',
  render(_ctx: PageContext): string {
    if (!AuthService.isAdmin()) {
      return `
        <div style="min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.95rem; text-align: center; padding: 2rem;">
          <p style="margin-bottom: 1rem;">최고 관리자 계정으로 로그인 후 이용하실 수 있습니다.</p>
          <a href="/" data-nav="/" class="btn-cta-primary" style="padding: 0.65rem 1.4rem; border-radius: 8px; text-decoration: none;">홈으로 이동</a>
        </div>
      `;
    }
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
    if (!AuthService.isAdmin()) return;
    ensureAdminOrdersRealtimeAndEvents(container);
    if (cachedRenderAdminDashboard) {
      syncMembersIfActive(container);
      syncPaymentLedgerOnAdminEnter(container, true);
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
        syncPaymentLedgerOnAdminEnter(container, true);
      }
    });
  },
};
