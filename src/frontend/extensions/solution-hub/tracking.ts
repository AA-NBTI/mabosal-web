/**
 * 추적 & 쿨다운: 노출/클릭 기록 (정산 근거) 및 재노출 억제.
 * 브라우저 localStorage에 안전하게 영속화되며, 통계 집계 및 입점 신청 데이터를 관리합니다.
 */

import type { Partner, PartnerApplication, SolutionItem, SolutionStatSummary } from './types.js';

const STORAGE_KEY = 'mabosal_solution_events';
const COOLDOWN_KEY = 'mabosal_solution_clicks_history';
const PARTNER_APPLY_KEY = 'mabosal_partner_applications';

const shownInMemory = new Set<string>();

export interface SolutionEvent {
  type: 'impression' | 'click';
  solutionId: string;
  sessionId: string;
  at: string;
}

function getStoredEvents(): SolutionEvent[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function append(event: SolutionEvent): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const list = getStoredEvents();
    list.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-1000)));
  } catch {
    // 추적 실패는 화면 동작에 영향을 주지 않는다.
  }
}

export function recordImpression(sessionId: string, solutionId: string): void {
  const key = `${sessionId}:${solutionId}`;
  if (shownInMemory.has(key)) return;
  shownInMemory.add(key);
  append({ type: 'impression', solutionId, sessionId, at: new Date().toISOString() });
}

export function recordClick(sessionId: string, solutionId: string): void {
  append({ type: 'click', solutionId, sessionId, at: new Date().toISOString() });

  // 쿨다운 기록: 클릭한 시점을 기록하여 재노출 억제
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(COOLDOWN_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[solutionId] = new Date().toISOString();
      localStorage.setItem(COOLDOWN_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }
}

/**
 * 재노출 쿨다운 확인: 사용자가 이미 클릭한 적이 있고, cooldownDays 이내라면 노출 억제(true 반환)
 */
export function isSuppressed(solutionId: string, cooldownDays: number = 7): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return false;
    const map: Record<string, string> = JSON.parse(raw);
    const lastClicked = map[solutionId];
    if (!lastClicked) return false;

    const clickedTime = new Date(lastClicked).getTime();
    const now = Date.now();
    const diffDays = (now - clickedTime) / (1000 * 60 * 60 * 24);
    return diffDays < cooldownDays;
  } catch {
    return false;
  }
}

/**
 * 관리자용: 솔루션별 노출 수, 클릭 수, 클릭률(CTR) 집계
 */
export function getSolutionStats(solutions: SolutionItem[], partners: Partner[]): SolutionStatSummary[] {
  const events = getStoredEvents();
  const partnerMap = new Map<string, string>();
  partners.forEach(p => partnerMap.set(p.id, p.name));

  const statsMap = new Map<string, { impressions: number; clicks: number }>();
  events.forEach(e => {
    const cur = statsMap.get(e.solutionId) || { impressions: 0, clicks: 0 };
    if (e.type === 'impression') cur.impressions++;
    else if (e.type === 'click') cur.clicks++;
    statsMap.set(e.solutionId, cur);
  });

  return solutions.map(s => {
    const st = statsMap.get(s.id) || { impressions: 0, clicks: 0 };
    const ctr = st.impressions > 0 ? Number(((st.clicks / st.impressions) * 100).toFixed(1)) : 0;
    return {
      solutionId: s.id,
      title: s.title,
      verticalId: (s as any).verticalId || 'finance',
      partnerName: partnerMap.get(s.partnerId) || '자체/미지정',
      impressions: st.impressions,
      clicks: st.clicks,
      ctr,
    };
  });
}

/**
 * 파트너 입점 신청 데이터 관리
 */
export function getPartnerApplications(): PartnerApplication[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PARTNER_APPLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePartnerApplication(app: Omit<PartnerApplication, 'id' | 'submittedAt' | 'status'>): PartnerApplication {
  const list = getPartnerApplications();
  const newApp: PartnerApplication = {
    ...app,
    id: 'APP-' + Date.now().toString(36).toUpperCase(),
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  list.unshift(newApp);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PARTNER_APPLY_KEY, JSON.stringify(list));
  }
  return newApp;
}

export function updatePartnerApplicationStatus(id: string, status: 'pending' | 'approved' | 'rejected'): void {
  const list = getPartnerApplications();
  const item = list.find(x => x.id === id);
  if (item) {
    item.status = status;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PARTNER_APPLY_KEY, JSON.stringify(list));
    }
  }
}
