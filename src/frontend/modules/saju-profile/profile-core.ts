/**
 * [saju-profile-core] 사주 프로필 순수 규칙 (저장소/DOM 비의존)
 *
 * - 저장 키는 항상 account.id 하나로 결정된다 (username 변경에도 프로필이 유실되지 않음).
 * - 출생시간/생년월일 정규화 규칙을 한 곳에 둔다 (가입·온보딩·정보수정 공통).
 */

export const SAJU_PROFILE_KEY_PREFIX = 'mm_user_saju_profile_';

export interface AccountRef { id: string; username: string; }

/**
 * 입력(id 또는 username 또는 undefined)을 account.id 로 정규화한다.
 * - 계정을 찾지 못하면 입력값을 그대로 쓰되, 비로그인은 'guest'.
 */
export function resolveProfileOwnerId(
  idOrUsername: string | undefined | null,
  accounts: AccountRef[],
  current: { id: string; username: string; isGuest: boolean }
): string {
  if (idOrUsername) {
    const hit = accounts.find(a => a.id === idOrUsername) ||
      accounts.find(a => a.username.toLowerCase() === idOrUsername.toLowerCase());
    return hit ? hit.id : idOrUsername;
  }
  return current.isGuest ? 'guest' : current.id;
}

export function profileStorageKey(ownerId: string): string {
  return `${SAJU_PROFILE_KEY_PREFIX}${ownerId}`;
}

/** '12' | '1330' | '13:30' | '13:30:00' → 'HH:mm', 빈값/잘못된 값 → null */
export function normalizeBirthTime(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  let h: number; let m = 0;
  if (s.includes(':')) {
    const parts = s.split(':');
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  } else if (/^\d{3,4}$/.test(s)) {
    const p = s.padStart(4, '0');
    h = parseInt(p.slice(0, 2), 10);
    m = parseInt(p.slice(2), 10);
  } else if (/^\d{1,2}$/.test(s)) {
    h = parseInt(s, 10);
  } else {
    return null;
  }
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' | 'YYYYMMDD' → 정규화된 날짜, 유효하지 않으면 null */
export function normalizeBirthDate(raw: string | null | undefined): { iso: string; year: number; month: number; day: number } | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.length !== 8) return null;
  const year = parseInt(digits.slice(0, 4), 10);
  const month = parseInt(digits.slice(4, 6), 10);
  const day = parseInt(digits.slice(6, 8), 10);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCMonth() !== month - 1) return null; // 2월 30일 등 거부
  return { iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, year, month, day };
}
