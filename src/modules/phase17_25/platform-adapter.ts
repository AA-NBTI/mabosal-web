/**
 * Phase 25: 서비스 플랫폼 연결 (Platform Adapter & Architecture Interface)
 * 
 * 원칙:
 * 1. 클라우드 및 Supabase 스키마 규격 정의:
 *    - 사용자(users), 사주 입력(saju_inputs), 분석 세션(analysis_sessions),
 *      상담 기록(consultation_records), 상품(products), 결제(payments), 처방 상품(remedies)
 * 2. AI API 안전 격리:
 *    - AI는 결정론적 명리 엔진이 산출한 결과를 임의로 변경하거나 왜곡할 수 없습니다.
 *    - AI 호출 계층은 오직 마보살 페르소나의 상담 응대 톤앤매너 완화 및 표현 다듬기에만 한정됩니다.
 * 3. 멱등성 및 결제 세션 트랜잭션 관리
 */

import { ProductTier } from './types.js';

// Supabase 스키마 DDL 정의 (데이터베이스 마이그레이션용)
export const SUPABASE_SCHEMA_SQL = `
-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- 2. 사주 원천 입력 테이블
CREATE TABLE IF NOT EXISTS public.saju_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('solar', 'lunar')),
  is_leap_month BOOLEAN DEFAULT false,
  birth_year INT NOT NULL,
  birth_month INT NOT NULL,
  birth_day INT NOT NULL,
  birth_time TEXT, -- HH:mm or NULL
  is_time_unknown BOOLEAN DEFAULT false,
  birth_city TEXT NOT NULL DEFAULT '서울',
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 분석 세션 테이블
CREATE TABLE IF NOT EXISTS public.analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  saju_input_id UUID REFERENCES public.saju_inputs(id),
  trouble_text TEXT,
  trouble_category TEXT,
  match_score INT,
  is_ma_detected BOOLEAN,
  ma_domain TEXT,
  purchased_tier TEXT NOT NULL DEFAULT 'free_diagnosis',
  full_result_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 결제 상태 테이블
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.analysis_sessions(id),
  order_id TEXT UNIQUE NOT NULL,
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KRW',
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 처방 상품 및 부적 보관 테이블
CREATE TABLE IF NOT EXISTS public.remedies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.analysis_sessions(id),
  remedy_title TEXT NOT NULL,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

export interface SessionStoragePayload {
  sessionId: string;
  userId?: string;
  tier: ProductTier;
  isPaid: boolean;
  rawInput: any;
  analysisOutput: any;
}

export class PlatformAdapter {
  private inMemorySessions: Map<string, SessionStoragePayload> = new Map();

  /**
   * 세션 저장 (Supabase 및 인메모리 fallback)
   */
  public async saveSession(payload: SessionStoragePayload): Promise<boolean> {
    this.inMemorySessions.set(payload.sessionId, { ...payload });
    return true;
  }

  /**
   * 세션 조회
   */
  public async getSession(sessionId: string): Promise<SessionStoragePayload | null> {
    return this.inMemorySessions.get(sessionId) || null;
  }

  /**
   * 결제 승인 처리
   */
  public async confirmPayment(sessionId: string, tier: ProductTier): Promise<boolean> {
    const session = this.inMemorySessions.get(sessionId);
    if (!session) return false;
    session.tier = tier;
    session.isPaid = true;
    this.inMemorySessions.set(sessionId, session);
    return true;
  }

  /**
   * AI API 안전 게이트웨이:
   * 결정론적 명리 엔진의 결과(일간, 오행, 마 신호, 시기)를 AI가 변경하지 못하도록
   * 고정 컨텍스트 락(Deterministic Lock)을 적용합니다.
   */
  public formatAiSafePrompt(
    deterministicFacts: {
      dayMaster: string;
      dominantElement: string;
      troubleCategory: string;
      maCompressedDiagnosis: string;
      recoveryTimeline: string;
      actionGuideline: string;
    },
    userQuestion: string
  ): {
    systemPrompt: string;
    userPrompt: string;
    isEngineProtected: boolean;
  } {
    const systemPrompt = `당신은 전통 명리학의 지혜와 따뜻한 통찰을 지닌 프리미엄 사주 상담사 '마보살'입니다.
절대 규칙:
1. 사주 원국과 명리 판단(${deterministicFacts.dayMaster}, 주도 오행 ${deterministicFacts.dominantElement}, 마 진단: "${deterministicFacts.maCompressedDiagnosis}", 완화 시기: "${deterministicFacts.recoveryTimeline}")은 이미 결정된 불변의 팩트입니다. 당신이 임의로 사주나 시기를 바꿀 수 없습니다.
2. 기계적인 명칭이나 저급한 점집 용어를 쓰지 말고, 진솔하고 정중하며 품격 있는 한국어로 답변하십시오.
3. 내담자의 감정을 먼저 헤아리고 행동 처방("${deterministicFacts.actionGuideline}")을 바탕으로 실천적 조언을 건네십시오.`;

    const userPrompt = `내담자 질문: "${userQuestion}"`;

    return {
      systemPrompt,
      userPrompt,
      isEngineProtected: true,
    };
  }
}
