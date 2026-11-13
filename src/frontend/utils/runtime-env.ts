/**
 * [RuntimeEnv] 실제 브라우저 운영 환경과 테스트(Vitest/jsdom/happy-dom/Node) 환경 구분 유틸
 */
export function isBrowserRuntime(): boolean {
  const isVitest =
    Boolean((import.meta as any).env?.VITEST) ||
    (typeof process !== 'undefined' && Boolean((process as any).env?.VITEST));
  if (isVitest || typeof window === 'undefined') return false;
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  return !/jsdom|happy-dom|node\.js/i.test(ua);
}

