import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/frontend/state/auth-service.js';
import { appState } from '../src/frontend/state/app-state.js';
import { setStorageBackend, createMemoryStorage, getStorage } from '../src/frontend/modules/persistence/index.js';
import { renderMemberDashboardView, setMemberActiveTab, getMemberActiveTab } from '../src/frontend/views/MemberDashboardView.js';
import { AdminPage } from '../src/frontend/pages/AdminPage.js';

describe('Logout & Session Isolation Audit', () => {
  beforeEach(() => {
    setStorageBackend(createMemoryStorage());
    AuthService.resetForTest();
    AuthService.init();
    appState.resetAllUserData();
  });

  it('로그아웃 시 appState의 이전 사용자 분석·상담·뷰 상태와 활성 주문 키가 모두 초기화된다', async () => {
    const loginRes = await AuthService.login('user1', '1234');
    expect(loginRes.success).toBe(true);

    appState.setUserName('홍길동');
    appState.setPaidUser(true);
    appState.setView('member-dashboard');
    appState.setLatestProduct({ id: 'mock-product' });
    appState.setDeepResult({ summary: 'mock-deep' });
    appState.setProductOutputSet({ free: 'mock' });
    appState.setActiveTierTab('PREMIUM');
    appState.addChatMessage({
      id: 'msg-1',
      sender: 'user',
      text: '내년 운세가 궁금합니다',
      timestamp: new Date().toISOString(),
    });

    const storage = getStorage();
    storage.setItem('mm_last_active_order_id', 'ORD-TEST-1');
    storage.setItem('mm_last_active_tier', 'PREMIUM');

    AuthService.logout();

    const state = appState.getState();
    expect(AuthService.getCurrentUser().role).toBe('guest');
    expect(state.currentView).toBe('landing');
    expect(state.userName).toBe('');
    expect(state.isPaidUser).toBe(false);
    expect(state.sessionState).toBeNull();
    expect(state.integratedResult).toBeNull();
    expect(state.latestProduct).toBeNull();
    expect(state.deepResult).toBeNull();
    expect(state.productOutputSet).toBeNull();
    expect(state.gunghapResult).toBeNull();
    expect(state.partnerInfo).toBeUndefined();
    expect(state.calcResult).toBeUndefined();
    expect(state.chatMessages).toEqual([]);
    expect(state.activeTierTab).toBe('FREE');
    expect(storage.getItem('mabosal_auth_session')).toBeNull();
    expect(storage.getItem('mm_last_active_order_id')).toBeNull();
    expect(storage.getItem('mm_last_active_tier')).toBeNull();
  });

  it('비로그인(로그아웃) 상태에서 마이페이지 및 관리자 페이지 렌더링이 차단된다', async () => {
    setMemberActiveTab('tab-orders');
    expect(getMemberActiveTab()).toBe('tab-orders');

    const memberHtml = renderMemberDashboardView(appState.getState());
    expect(memberHtml).toContain('로그인이 필요한 서비스입니다');
    expect(memberHtml).not.toContain('주문내역');

    const adminHtml = AdminPage.render({
      state: appState.getState(),
      params: {},
      pathname: '/admin',
    });
    expect(adminHtml).toContain('최고 관리자 계정으로 로그인 후 이용하실 수 있습니다.');
  });
});

