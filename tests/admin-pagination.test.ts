import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ADMIN_PAGE_SIZE,
  paginateAdminList,
  renderAdminPagination,
  setAdminListPage,
  getAdminListPage,
  resetAdminListPages,
} from '../src/frontend/utils/admin-pagination.js';
import {
  renderAdminMembersPanel,
  resetAdminMembersCache,
  setAdminMemberDateRange,
  setAdminMemberDatePreset,
} from '../src/frontend/views/AdminMembersPanel.js';
import { renderAdminDashboardView } from '../src/frontend/views/AdminDashboardView.js';
import { AuthService } from '../src/frontend/state/auth-service.js';
import { setStorageBackend, createMemoryStorage, getStorage } from '../src/frontend/modules/persistence/index.js';

describe('Admin List Pagination (10 items per page)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    resetAdminListPages();
    setStorageBackend(createMemoryStorage());
    AuthService.resetForTest();
    resetAdminMembersCache();
    AuthService.init();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('10개 이하일 때는 페이지네이션 바를 렌더링하지 않고 전체 항목을 반환한다', () => {
    const items = Array.from({ length: 10 }, (_, i) => i + 1);
    const res = paginateAdminList('test-list', items);

    expect(res.pageSize).toBe(ADMIN_PAGE_SIZE);
    expect(res.totalItems).toBe(10);
    expect(res.totalPages).toBe(1);
    expect(res.pagedItems).toHaveLength(10);
    expect(renderAdminPagination('test-list', res.currentPage, res.totalPages, res.totalItems)).toBe('');
  });

  it('10개 초과 시 10개 단위로 분할되고 다음 페이지로 이동할 수 있다', () => {
    const items = Array.from({ length: 23 }, (_, i) => `item-${i + 1}`);

    const page1 = paginateAdminList('test-list', items);
    expect(page1.totalPages).toBe(3);
    expect(page1.currentPage).toBe(1);
    expect(page1.pagedItems).toHaveLength(10);
    expect(page1.pagedItems[0]).toBe('item-1');
    expect(page1.pagedItems[9]).toBe('item-10');

    const html1 = renderAdminPagination('test-list', page1.currentPage, page1.totalPages, page1.totalItems);
    expect(html1).toContain('총 <strong style="color: #fff;">23</strong>건 중');
    expect(html1).toContain('1-10');
    expect(html1).toContain('다음');

    setAdminListPage('test-list', 2);
    const page2 = paginateAdminList('test-list', items);
    expect(page2.currentPage).toBe(2);
    expect(page2.pagedItems).toHaveLength(10);
    expect(page2.pagedItems[0]).toBe('item-11');
    expect(page2.pagedItems[9]).toBe('item-20');

    setAdminListPage('test-list', 3);
    const page3 = paginateAdminList('test-list', items);
    expect(page3.currentPage).toBe(3);
    expect(page3.pagedItems).toHaveLength(3);
    expect(page3.pagedItems[0]).toBe('item-21');
    expect(page3.pagedItems[2]).toBe('item-23');

    // 총 페이지보다 큰 페이지 요청 시 마지막 페이지로 보정
    setAdminListPage('test-list', 99);
    const clamped = paginateAdminList('test-list', items);
    expect(clamped.currentPage).toBe(3);
    expect(getAdminListPage('test-list')).toBe(3);
  });

  it('관리자 회원 관리 패널에서 회원이 10명을 초과하면 10명씩 끊어서 다음 페이지로 넘긴다', () => {
    const accounts = Array.from({ length: 13 }, (_, i) => ({
      id: `u_${i + 1}`,
      username: `member_${String(i + 1).padStart(2, '0')}`,
      password: '1234',
      name: `회원${i + 1}`,
      email: `m${i + 1}@mabosal.com`,
      role: 'user' as const,
      yeopBalance: 0,
      joinedAt: '2026-11-14',
      status: 'active' as const,
    }));
    getStorage().setItem('mabosal_registered_accounts', JSON.stringify(accounts));

    const htmlPage1 = renderAdminMembersPanel();
    expect(htmlPage1).toContain('member_01');
    expect(htmlPage1).toContain('member_10');
    expect(htmlPage1).not.toContain('member_11');
    expect(htmlPage1).toContain('data-page-key="admin-members"');
    expect(htmlPage1).toContain('1-10');

    setAdminListPage('admin-members', 2);
    const htmlPage2 = renderAdminMembersPanel();
    expect(htmlPage2).toContain('member_11');
    expect(htmlPage2).toContain('member_13');
    expect(htmlPage2).not.toContain('member_01');
    expect(htmlPage2).toContain('11-13');
  });

  it('회원관리 가입날짜별 필터(기간 지정 및 프리셋)가 정상 동작한다', () => {
    const accounts = [
      {
        id: 'u_oct',
        username: 'oct_user',
        password: '1234',
        name: '시월회원',
        email: 'oct@mabosal.com',
        role: 'user' as const,
        yeopBalance: 0,
        joinedAt: '2026-10-05',
        status: 'active' as const,
      },
      {
        id: 'u_nov1',
        username: 'nov1_user',
        password: '1234',
        name: '십일월1',
        email: 'nov1@mabosal.com',
        role: 'user' as const,
        yeopBalance: 0,
        joinedAt: '2026-11-10',
        status: 'active' as const,
      },
      {
        id: 'u_nov2',
        username: 'nov2_user',
        password: '1234',
        name: '십일월2',
        email: 'nov2@mabosal.com',
        role: 'user' as const,
        yeopBalance: 0,
        joinedAt: '2026-11-14',
        status: 'active' as const,
      },
    ];
    getStorage().setItem('mabosal_registered_accounts', JSON.stringify(accounts));

    setAdminMemberDateRange('2026-11-01', '2026-11-12');
    const htmlRange = renderAdminMembersPanel();
    expect(htmlRange).toContain('nov1_user');
    expect(htmlRange).not.toContain('oct_user');
    expect(htmlRange).not.toContain('nov2_user');

    setAdminMemberDatePreset('all');
    const htmlAll = renderAdminMembersPanel();
    expect(htmlAll).toContain('oct_user');
    expect(htmlAll).toContain('nov1_user');
    expect(htmlAll).toContain('nov2_user');
  });

  it('관리자 사이드바가 대시보드-회원관리-결제관리 순서와 명칭/구분선/이모티콘/스토어버튼 제거 요구사항을 반영한다', () => {
    const html = renderAdminDashboardView();
    const sidebarEnd = html.indexOf('</aside>');
    const sidebar = html.slice(0, sidebarEnd);

    expect(sidebar).not.toContain('마보살 관리자');
    expect(sidebar).toContain('관리자');
    expect(sidebar).not.toContain('결제 · 환불');
    expect(sidebar).toContain('결제관리');
    expect(sidebar).not.toContain('border-left: 1px dashed');
    expect(sidebar).not.toContain('border-left: 1px dotted');
    expect(sidebar).not.toContain('inventory_2');
    expect(sidebar).not.toContain('menu_book');
    expect(sidebar).not.toContain('href="/?view=store"');

    const idxOverview = sidebar.indexOf('data-tab="tab-overview"');
    const idxMembers = sidebar.indexOf('data-group-id="group-members"');
    const idxPayment = sidebar.indexOf('data-group-id="group-payment"');
    expect(idxOverview).toBeGreaterThan(-1);
    expect(idxMembers).toBeGreaterThan(idxOverview);
    expect(idxPayment).toBeGreaterThan(idxMembers);
  });
});

