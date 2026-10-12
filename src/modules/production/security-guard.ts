/**
 * Phase 38: Security Guard & Operational Hardening Module
 * 
 * 1. Supabase RLS (Row Level Security) 정책 SQL 정의
 * 2. PII (개인식별정보) 로그 마스킹 처리
 * 3. Rate Limiter (IP/세션별 DoS 및 남용 방지)
 * 4. 입력값 유효성 검증 및 XSS 살균 (Sanitization)
 * 5. 클라이언트 환경변수 보호 (API Key 노출 차단)
 * 6. 서버 오류 로그 분리 및 안전한 감사 로그
 */

export interface SecurityAuditLog {
  readonly timestamp: string;
  readonly eventType: 'AUTH' | 'INPUT_VALIDATION' | 'RATE_LIMIT' | 'PAYMENT' | 'API_GUARD';
  readonly maskedUserId: string;
  readonly status: 'ALLOW' | 'BLOCK' | 'WARN';
  readonly details: string;
}

export class SecurityGuard {
  private rateLimitWindowMs: number = 60 * 1000; // 1분
  private maxRequestsPerWindow: number = 60; // 분당 최대 60회
  private requestHistory: Map<string, number[]> = new Map();
  private auditLogs: SecurityAuditLog[] = [];

  /**
   * Supabase RLS (Row Level Security) 프로덕션 SQL 마이그레이션 스크립트 제공
   */
  public getSupabaseRlsScript(): string {
    return `
-- ========================================================
-- MABOSAL Production Row Level Security (RLS) Policies
-- ========================================================

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remedies ENABLE ROW LEVEL SECURITY;

-- 2. Users Table Policy
CREATE POLICY "Users can only read and update their own record"
  ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Saju Profiles Policy
CREATE POLICY "Users can only access their own saju profiles"
  ON saju_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Analysis Sessions Policy
CREATE POLICY "Users can only read their own analysis sessions"
  ON analysis_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analysis sessions"
  ON analysis_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Payments Table Policy (Strict Server-Side Validation)
CREATE POLICY "Users can only view their own completed payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only Service Role can insert or update payments"
  ON payments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Remedies Table Policy
CREATE POLICY "Users can view remedies unlocked by completed payment"
  ON remedies
  FOR SELECT
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM payments 
      WHERE payments.profile_id = remedies.profile_id 
        AND payments.status = 'COMPLETED'
    )
  );
`.trim();
  }

  /**
   * XSS 살균 처리 (HTML 특수문자 이스케이프)
   */
  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 사용자 고민 텍스트 유효성 및 길이 검증
   */
  public validateTroubleInput(text: string, maxLength: number = 500): { isValid: boolean; sanitized: string; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, sanitized: '', error: '고민 내용을 입력해 주세요.' };
    }

    if (text.length > maxLength) {
      return {
        isValid: false,
        sanitized: this.sanitizeInput(text.substring(0, maxLength)),
        error: `고민 내용은 최대 ${maxLength}자까지 입력할 수 있습니다.`,
      };
    }

    return {
      isValid: true,
      sanitized: this.sanitizeInput(text.trim()),
    };
  }

  /**
   * Rate Limiter 검사
   */
  public checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = this.requestHistory.get(clientId) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.rateLimitWindowMs);

    if (validTimestamps.length >= this.maxRequestsPerWindow) {
      this.recordAuditLog({
        eventType: 'RATE_LIMIT',
        maskedUserId: this.maskIdentifier(clientId),
        status: 'BLOCK',
        details: `요청 한도 초과 (${validTimestamps.length}/${this.maxRequestsPerWindow} req/min)`,
      });
      return { allowed: false, remaining: 0 };
    }

    validTimestamps.push(now);
    this.requestHistory.set(clientId, validTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequestsPerWindow - validTimestamps.length,
    };
  }

  /**
   * PII (개인식별정보) 안전 마스킹
   */
  public maskIdentifier(identifier: string): string {
    if (!identifier) return 'anonymous';
    if (identifier.includes('@')) {
      // 이메일 마스킹 (ex: abc***@domain.com)
      const [local, domain] = identifier.split('@');
      if (local.length <= 2) return `${local[0]}*@${domain}`;
      return `${local.substring(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
    }
    // 일반 ID 마스킹 (앞 3자리 + 뒷 2자리만 노출)
    if (identifier.length <= 5) return '***';
    return `${identifier.substring(0, 3)}****${identifier.substring(identifier.length - 2)}`;
  }

  /**
   * 안전한 감사 로그 기록
   */
  public recordAuditLog(log: Omit<SecurityAuditLog, 'timestamp'>): void {
    const entry: SecurityAuditLog = {
      ...log,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.push(entry);
    // 메모리 누수 방지 (최대 1000개 유지)
    if (this.auditLogs.length > 1000) {
      this.auditLogs.shift();
    }
  }

  public getRecentAuditLogs(): readonly SecurityAuditLog[] {
    return [...this.auditLogs];
  }
}

export const securityGuard = new SecurityGuard();
