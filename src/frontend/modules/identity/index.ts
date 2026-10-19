/**
 * [identity] 사용자 식별·권한 단일 기준
 *
 * 규칙
 * 1. 사용자 식별자는 오직 account.id (userId) 하나다. username/name 으로 소유를 판정하지 않는다.
 * 2. 비로그인(guest)은 userId = null.
 * 3. 로그인 필요 여부 판단은 isGuest()/requireLogin() 으로만 한다.
 */
import { AuthService, UserRole } from '../../state/auth-service.js';

export interface Identity {
  userId: string | null;
  role: UserRole;
  isGuest: boolean;
  username: string;
  name: string;
  email: string;
  phone: string;
}

/** 순수 변환: 계정 → Identity (테스트 용이) */
export function toIdentity(user: { id?: string; role?: UserRole; username?: string; name?: string; email?: string; phone?: string } | null | undefined): Identity {
  const role: UserRole = (user?.role as UserRole) || 'guest';
  const isGuest = !user || role === 'guest';
  return {
    userId: isGuest ? null : (user!.id || null),
    role: isGuest ? 'guest' : role,
    isGuest,
    username: isGuest ? '' : (user!.username || ''),
    name: isGuest ? '' : (user!.name || ''),
    email: isGuest ? '' : (user!.email || ''),
    phone: isGuest ? '' : (user!.phone || ''),
  };
}

export function getIdentity(): Identity {
  return toIdentity(AuthService.getCurrentUser());
}

export function isGuest(): boolean {
  return getIdentity().isGuest;
}

export function getUserId(): string | null {
  return getIdentity().userId;
}

/**
 * 소유권 판정 (순수 함수)
 * - 레코드에 userId가 있으면 userId 일치만 인정한다.
 * - userId 없는 과거 레코드는 이메일이 정확히 일치할 때만 본인 것으로 본다.
 * - 이름(buyerName)·전화번호 일치는 소유 근거로 쓰지 않는다 (동명이인 오인 방지).
 */
export function ownsRecord(
  record: { userId?: string; buyerEmail?: string } | null | undefined,
  identity: Identity
): boolean {
  if (!record || identity.isGuest || !identity.userId) return false;
  if (record.userId) return record.userId === identity.userId;
  return !!identity.email && !!record.buyerEmail && record.buyerEmail.toLowerCase() === identity.email.toLowerCase();
}

type LoginPromptHandler = (reason?: string) => void;
let loginPrompt: LoginPromptHandler = (reason) => {
  if (typeof window === 'undefined') return;
  if (reason) alert(reason);
  const modal = document.getElementById('modal-auth-container');
  if (modal) modal.style.display = 'flex';
};

/** UI 계층이 로그인 안내 방식을 교체할 수 있게 한다 (toast 등) */
export function setLoginPromptHandler(handler: LoginPromptHandler): void {
  loginPrompt = handler;
}

/**
 * 로그인 필요 가드. 로그인 상태면 true, 아니면 안내를 띄우고 false.
 * 사용: if (!requireLogin('유료 리포트는 로그인 후 이용할 수 있습니다.')) return;
 */
export function requireLogin(reason?: string): boolean {
  if (!isGuest()) return true;
  loginPrompt(reason);
  return false;
}
