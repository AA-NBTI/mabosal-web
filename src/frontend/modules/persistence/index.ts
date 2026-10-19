/**
 * [persistence] 저장 계층 단일 진입점
 *
 * - 서비스가 localStorage를 직접 만지지 않고 이 모듈의 Repository만 사용한다.
 * - 저장소 구현은 교체 가능(localStorage / 메모리 / 향후 Supabase).
 * - 파싱 실패는 삼키지 않고 fallback 반환 + 경고 로그를 남긴다.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** 단일 진실 공급원: 핵심 저장 키 레지스트리 */
export const PersistenceKeys = {
  accounts: 'mabosal_registered_accounts',
  session: 'mabosal_auth_session',
  orders: 'mabosal_store_orders',
  cart: 'mabosal_inhouse_cart',
  sajuProfilePrefix: 'mm_user_saju_profile_',
  sajuProfileGlobal: 'mm_user_saju_profile',
} as const;

class MemoryStorage implements KeyValueStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null { return this.map.has(key) ? (this.map.get(key) as string) : null; }
  setItem(key: string, value: string): void { this.map.set(key, String(value)); }
  removeItem(key: string): void { this.map.delete(key); }
}

let override: KeyValueStorage | null = null;
let memoryFallback: KeyValueStorage | null = null;

/** 테스트 또는 서버 전환 시 저장소 교체 (null이면 기본값 복원) */
export function setStorageBackend(storage: KeyValueStorage | null): void {
  override = storage;
}

export function getStorage(): KeyValueStorage {
  if (override) return override;
  if (typeof localStorage !== 'undefined') return localStorage;
  if (!memoryFallback) memoryFallback = new MemoryStorage();
  return memoryFallback;
}

export function createMemoryStorage(): KeyValueStorage {
  return new MemoryStorage();
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = getStorage().getItem(key);
    if (raw === null || raw === undefined || raw === '') return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[persistence] JSON 파싱 실패 (${key}) - fallback 사용`, err);
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): boolean {
  try {
    getStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[persistence] 저장 실패 (${key})`, err);
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    getStorage().removeItem(key);
  } catch (err) {
    console.warn(`[persistence] 삭제 실패 (${key})`, err);
  }
}

/** 키 하나를 타입 안전하게 다루는 Repository */
export class JsonRepository<T> {
  constructor(private readonly key: string, private readonly fallback: T) {}
  get(): T { return readJson<T>(this.key, this.fallback); }
  set(value: T): boolean { return writeJson<T>(this.key, value); }
  update(mutator: (current: T) => T): T {
    const next = mutator(this.get());
    this.set(next);
    return next;
  }
  remove(): void { removeKey(this.key); }
}
