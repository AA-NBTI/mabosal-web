import { AuthService, UserAccount } from '../state/auth-service.js';
import { paginateAdminList, renderAdminPagination, setAdminListPage } from '../utils/admin-pagination.js';

let cachedMembers: UserAccount[] = [];
let membersSource: 'cloud' | 'local' = 'local';
let membersLoadError: string | null = null;
let isMembersLoading = false;
let hasLoadedOnce = false;

let memberSearchQuery = '';
let memberStatusFilter: 'all' | 'active' | 'suspended' = 'all';
let memberRoleFilter: 'all' | 'user' | 'partner' | 'admin' = 'all';
let memberDatePreset: 'all' | 'today' | '7d' | '30d' | 'custom' = 'all';
let memberDateFrom = '';
let memberDateTo = '';

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function esc(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setAdminMemberSearch(q: string): void {
  memberSearchQuery = q;
  setAdminListPage('admin-members', 1);
}

export function setAdminMemberStatusFilter(status: 'all' | 'active' | 'suspended'): void {
  memberStatusFilter = status;
  setAdminListPage('admin-members', 1);
}

export function setAdminMemberRoleFilter(role: 'all' | 'user' | 'partner' | 'admin'): void {
  memberRoleFilter = role;
  setAdminListPage('admin-members', 1);
}

export function setAdminMemberDatePreset(preset: 'all' | 'today' | '7d' | '30d' | 'custom'): void {
  memberDatePreset = preset;
  const now = new Date();
  const today = formatLocalDate(now);
  if (preset === 'all') {
    memberDateFrom = '';
    memberDateTo = '';
  } else if (preset === 'today') {
    memberDateFrom = today;
    memberDateTo = today;
  } else if (preset === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    memberDateFrom = formatLocalDate(from);
    memberDateTo = today;
  } else if (preset === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    memberDateFrom = formatLocalDate(from);
    memberDateTo = today;
  }
  setAdminListPage('admin-members', 1);
}

export function setAdminMemberDateRange(from: string, to: string): void {
  memberDateFrom = from.trim();
  memberDateTo = to.trim();
  memberDatePreset = (memberDateFrom || memberDateTo) ? 'custom' : 'all';
  setAdminListPage('admin-members', 1);
}

export function resetAdminMembersCache(): void {
  cachedMembers = [];
  membersSource = 'local';
  membersLoadError = null;
  isMembersLoading = false;
  hasLoadedOnce = false;
  memberSearchQuery = '';
  memberStatusFilter = 'all';
  memberRoleFilter = 'all';
  memberDatePreset = 'all';
  memberDateFrom = '';
  memberDateTo = '';
}

export async function syncAdminMembersFromCloud(onDone?: () => void): Promise<void> {
  if (isMembersLoading) return;
  isMembersLoading = true;
  membersLoadError = null;
  try {
    const res = await AuthService.fetchMembersForAdmin();
    cachedMembers = res.members;
    membersSource = res.source;
    membersLoadError = res.error || null;
    hasLoadedOnce = true;
  } catch (e: any) {
    membersLoadError = e?.message || '회원 목록을 불러오지 못했습니다.';
  } finally {
    isMembersLoading = false;
    if (onDone) onDone();
  }
}

export function ensureAdminMembersLoaded(onDone?: () => void): void {
  if (!hasLoadedOnce && !isMembersLoading) {
    void syncAdminMembersFromCloud(onDone);
  }
}

export function renderAdminMembersPanel(): string {
  const baseList = hasLoadedOnce ? cachedMembers : AuthService.getAllAccounts();
  const totalCount = baseList.length;
  const activeCount = baseList.filter(m => (m.status || 'active') === 'active').length;
  const suspendedCount = baseList.filter(m => m.status === 'suspended').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayJoinedCount = baseList.filter(m => m.joinedAt === todayStr).length;

  const q = memberSearchQuery.trim().toLowerCase();
  const filtered = baseList.filter(m => {
    const status = m.status || 'active';
    if (memberStatusFilter !== 'all' && status !== memberStatusFilter) return false;
    if (memberRoleFilter !== 'all' && m.role !== memberRoleFilter) return false;
    if (memberDateFrom || memberDateTo) {
      const joinedDay = String(m.joinedAt || '').slice(0, 10);
      if (!joinedDay) return false;
      if (memberDateFrom && joinedDay < memberDateFrom) return false;
      if (memberDateTo && joinedDay > memberDateTo) return false;
    }
    if (q) {
      const hay = `${m.username} ${m.name} ${m.email} ${m.phone || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const {
    pagedItems: pagedMembers,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
  } = paginateAdminList('admin-members', filtered);

  const roleBadge = (role: string) => {
    if (role === 'admin') {
      return '<span style="background: rgba(242,202,80,0.18); color: var(--primary); border: 1px solid rgba(242,202,80,0.4); font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 5px;">관리자</span>';
    }
    if (role === 'partner') {
      return '<span style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.35); font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 5px;">파트너</span>';
    }
    return '<span style="background: rgba(148,163,184,0.12); color: #cbd5e1; border: 1px solid rgba(148,163,184,0.25); font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 5px;">일반회원</span>';
  };

  const statusBadge = (m: UserAccount) => {
    if (m.status === 'suspended') {
      return `<span title="${esc(m.suspendedReason || '이용 정지')}" style="background: rgba(239,68,68,0.16); color: #f87171; border: 1px solid rgba(239,68,68,0.4); font-size: 0.72rem; font-weight: 800; padding: 0.18rem 0.5rem; border-radius: 9999px;">이용 정지</span>`;
    }
    return `<span style="background: rgba(34,197,94,0.14); color: #4ade80; border: 1px solid rgba(34,197,94,0.35); font-size: 0.72rem; font-weight: 800; padding: 0.18rem 0.5rem; border-radius: 9999px;">정상</span>`;
  };

  return `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- 상단 헤더 & 새로고침 -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 0.2rem 0;">전체 회원 관리</h2>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
            데이터 소스:
            <strong style="color: ${membersSource === 'cloud' ? '#4ade80' : '#facc15'};">
              ${membersSource === 'cloud' ? 'Supabase 클라우드 실시간 연동' : '로컬 캐시(폴백)'}
            </strong>
            ${isMembersLoading ? ' · 불러오는 중...' : ''}
          </p>
        </div>
        <button type="button" id="btn-admin-members-refresh" style="background: rgba(242,202,80,0.14); border: 1px solid rgba(242,202,80,0.4); color: var(--primary); font-size: 0.82rem; font-weight: 800; padding: 0.5rem 0.95rem; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 17px;">refresh</span>
          새로고침
        </button>
      </div>

      ${membersLoadError ? `
        <div style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.82rem; line-height: 1.5;">
          <strong>원격 조회 안내:</strong> ${esc(membersLoadError)}<br/>
          <span style="color: #cbd5e1;">Supabase 마이그레이션(<code>20261113000000_admin_member_management.sql</code>) 및 Edge Function(<code>admin-members</code>) 배포 후 전체 회원이 실시간 동기화됩니다.</span>
        </div>
      ` : ''}

      <!-- KPI 요약 카드 4개 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.85rem;">
        <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">전체 회원</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #fff;">${totalCount}명</div>
        </div>
        <div style="background: var(--surface-container); border: 1px solid rgba(34,197,94,0.22); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">정상 이용</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #4ade80;">${activeCount}명</div>
        </div>
        <div style="background: var(--surface-container); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">이용 정지</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #f87171;">${suspendedCount}명</div>
        </div>
        <div style="background: var(--surface-container); border: 1px solid rgba(242,202,80,0.25); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">오늘 신규 가입</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: var(--primary);">${todayJoinedCount}명</div>
        </div>
      </div>

      <!-- 검색 & 필터 바 -->
      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.9rem 1rem; display: flex; flex-wrap: wrap; gap: 0.65rem; align-items: center; justify-content: space-between;">
        <input
          type="text"
          id="input-admin-member-search"
          value="${esc(memberSearchQuery)}"
          placeholder="아이디, 이름, 이메일, 연락처 검색..."
          style="flex: 1; min-width: 210px; background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.14); color: #fff; border-radius: 7px; padding: 0.5rem 0.8rem; font-size: 0.85rem;"
        />
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <select id="select-admin-member-status" style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 7px; padding: 0.45rem 0.7rem; font-size: 0.82rem;">
            <option value="all" ${memberStatusFilter === 'all' ? 'selected' : ''}>전체 상태</option>
            <option value="active" ${memberStatusFilter === 'active' ? 'selected' : ''}>정상</option>
            <option value="suspended" ${memberStatusFilter === 'suspended' ? 'selected' : ''}>이용 정지</option>
          </select>
          <select id="select-admin-member-role" style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 7px; padding: 0.45rem 0.7rem; font-size: 0.82rem;">
            <option value="all" ${memberRoleFilter === 'all' ? 'selected' : ''}>전체 권한</option>
            <option value="user" ${memberRoleFilter === 'user' ? 'selected' : ''}>일반회원</option>
            <option value="partner" ${memberRoleFilter === 'partner' ? 'selected' : ''}>파트너</option>
            <option value="admin" ${memberRoleFilter === 'admin' ? 'selected' : ''}>관리자</option>
          </select>
          <select id="select-admin-member-date-preset" style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 7px; padding: 0.45rem 0.7rem; font-size: 0.82rem;">
            <option value="all" ${memberDatePreset === 'all' ? 'selected' : ''}>전체 가입일</option>
            <option value="today" ${memberDatePreset === 'today' ? 'selected' : ''}>오늘 가입</option>
            <option value="7d" ${memberDatePreset === '7d' ? 'selected' : ''}>최근 7일</option>
            <option value="30d" ${memberDatePreset === '30d' ? 'selected' : ''}>최근 30일</option>
            <option value="custom" ${memberDatePreset === 'custom' ? 'selected' : ''}>기간 직접 선택</option>
          </select>
          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <input type="date" id="input-admin-member-date-from" value="${esc(memberDateFrom)}" title="가입 시작일" style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 7px; padding: 0.4rem 0.55rem; font-size: 0.8rem;" />
            <span style="color: #64748b; font-size: 0.8rem;">~</span>
            <input type="date" id="input-admin-member-date-to" value="${esc(memberDateTo)}" title="가입 종료일" style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 7px; padding: 0.4rem 0.55rem; font-size: 0.8rem;" />
          </div>
        </div>
      </div>

      <!-- 회원 테이블 -->
      <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.76rem;">
              <th style="padding: 0.8rem 0.9rem;">아이디</th>
              <th style="padding: 0.8rem 0.9rem;">이름 / 이메일</th>
              <th style="padding: 0.8rem 0.9rem;">권한</th>
              <th style="padding: 0.8rem 0.9rem;">가입일</th>
              <th style="padding: 0.8rem 0.9rem;">상태</th>
              <th style="padding: 0.8rem 0.9rem; text-align: right;">관리 조치</th>
            </tr>
          </thead>
          <tbody>
            ${pagedMembers.length === 0 ? `
              <tr>
                <td colspan="6" style="padding: 2.5rem 1rem; text-align: center; color: #94a3b8;">
                  조건에 일치하는 회원이 없습니다.
                </td>
              </tr>
            ` : pagedMembers.map(m => {
              const isAdminAccount = m.role === 'admin' || m.username === 'admin';
              const isSuspended = m.status === 'suspended';
              return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 0.75rem 0.9rem; font-weight: 800; color: #fff; white-space: nowrap;">
                    ${esc(m.username)}
                  </td>
                  <td style="padding: 0.75rem 0.9rem;">
                    <div style="font-weight: 700; color: #e2e8f0;">${esc(m.name)}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">${esc(m.email || '-')}</div>
                    ${isSuspended && m.suspendedReason ? `<div style="font-size: 0.72rem; color: #f87171; margin-top: 0.15rem;">사유: ${esc(m.suspendedReason)}</div>` : ''}
                  </td>
                  <td style="padding: 0.75rem 0.9rem; white-space: nowrap;">
                    ${roleBadge(m.role)}
                  </td>
                  <td style="padding: 0.75rem 0.9rem; color: #94a3b8; white-space: nowrap; font-size: 0.78rem;">
                    ${esc(m.joinedAt || '-')}
                    ${m.lastSignInAt ? `<div style="font-size: 0.7rem; color: #64748b;">최근: ${esc(m.lastSignInAt)}</div>` : ''}
                  </td>
                  <td style="padding: 0.75rem 0.9rem; white-space: nowrap;">
                    ${statusBadge(m)}
                  </td>
                  <td style="padding: 0.75rem 0.9rem; text-align: right; white-space: nowrap;">
                    ${isAdminAccount ? `
                      <span style="font-size: 0.74rem; color: #64748b;">보호 계정</span>
                    ` : `
                      <button
                        type="button"
                        class="btn-admin-member-toggle-suspend"
                        data-user-id="${esc(m.id)}"
                        data-username="${esc(m.username)}"
                        data-action="${isSuspended ? 'unsuspend' : 'suspend'}"
                        style="background: ${isSuspended ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}; border: 1px solid ${isSuspended ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}; color: ${isSuspended ? '#4ade80' : '#fbbf24'}; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer; margin-right: 0.35rem;"
                      >
                        ${isSuspended ? '정지 해제' : '이용 정지'}
                      </button>
                      <button
                        type="button"
                        class="btn-admin-member-delete"
                        data-user-id="${esc(m.id)}"
                        data-username="${esc(m.username)}"
                        style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer;"
                      >
                        삭제
                      </button>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${renderAdminPagination('admin-members', currentPage, totalPages, totalItems, pageSize)}
      </div>
    </div>
  `;
}

