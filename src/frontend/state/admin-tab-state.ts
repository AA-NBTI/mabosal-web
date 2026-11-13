/**
 * 관리자 대시보드 탭·아코디언·편집 대상 ID 상태 관리 (경량 분리 모듈)
 * - main.ts가 AdminDashboardView.ts 전체를 정적 import하지 않도록 분리
 */

const ADMIN_TAB_STORAGE_KEY = 'mm_admin_active_tab';

let activeAdminTabId = (typeof localStorage !== 'undefined' && localStorage.getItem(ADMIN_TAB_STORAGE_KEY)) || 'tab-overview';
let activeEditingStudyArticleId: string | null = null;
let activeEditingStoreProductId: string | null = null;

const groupToggleState = new Map<string, boolean>();
const subGroupToggleState = new Map<string, boolean>();

export function setEditingStudyArticleId(id: string | null): void {
  activeEditingStudyArticleId = id;
}

export function getEditingStudyArticleId(): string | null {
  return activeEditingStudyArticleId;
}

export function setEditingStoreProductId(id: string | null): void {
  activeEditingStoreProductId = id;
}

export function getEditingStoreProductId(): string | null {
  return activeEditingStoreProductId;
}

export function setAdminActiveTab(tabId: string): void {
  activeAdminTabId = tabId;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tabId);
    } catch {}
  }
  if (typeof window !== 'undefined' && window.history && window.location) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({ ...window.history.state, adminTab: tabId }, '', url.toString());
    } catch {}
  }
}

export function getAdminActiveTab(): string {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      return tabParam.startsWith('tab-') ? tabParam : `tab-${tabParam}`;
    }
  }
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    if (saved) return saved;
  }
  return activeAdminTabId;
}

export function getActiveAdminTabIdSync(): string {
  return activeAdminTabId;
}

export function toggleAdminGroup(groupId: string, fallbackExpanded: boolean = false): void {
  const current = groupToggleState.has(groupId) ? groupToggleState.get(groupId)! : fallbackExpanded;
  groupToggleState.set(groupId, !current);
}

export function setAdminGroupExpanded(groupId: string, expanded: boolean): void {
  groupToggleState.set(groupId, expanded);
}

export function toggleAdminSubGroup(subGroupId: string, forceExpanded?: boolean): void {
  if (typeof forceExpanded === 'boolean') {
    subGroupToggleState.set(subGroupId, forceExpanded);
    return;
  }
  const current = subGroupToggleState.has(subGroupId) ? subGroupToggleState.get(subGroupId)! : true;
  subGroupToggleState.set(subGroupId, !current);
}

export function isGroupExpanded(groupId: string): boolean {
  return groupToggleState.get(groupId) === true;
}

export function getGroupToggleState(): Map<string, boolean> {
  return groupToggleState;
}

export function getSubGroupToggleState(): Map<string, boolean> {
  return subGroupToggleState;
}

