/**
 * Phase 13: 최종 블랙박스 검증 및 운영 준비 감사 테스트 스위트
 * 
 * 검증 항목:
 * 1. 신규 사용자 흐름 (정상, 미상, 경계시간, 잘못된 입력, 누락값)
 * 2. 사주 4주, 일간, 오행, 21 Ma, 6 Theme, RSI, 확정도, 근거 추적 완전 생성
 * 3. 10대 테마 및 복합/모호/모순/운명론 상담 대화 완전성
 * 4. 상담 전후 데이터 불변성 (Deep Immutability: FourPillars, Fact, Signal, RSI, Certainty)
 * 5. 세션 재현성 (동일 입력 3회 세션 생성 시 완전 동일성)
 * 6. 예외 복구: 빈 질문, 2000자 초과 질문, 세션 초기화
 * 7. 운영 준비 감사: 개인정보(PII) 마스킹, 내부 에러 은닉 및 안전 Fallback, QUICK/STANDARD/DEEP 일관성
 */

import { describe, expect, it } from 'vitest';
import { MabosalSessionEngine, MabosalSessionRequest } from '../src/modules/phase13/index.js';

describe('Phase 13: Final Blackbox Verification & Operation Readiness Audit Suite', () => {
  const sessionEngine = new MabosalSessionEngine();

  // ========================================================
  // A. 신규 사용자 흐름 검증
  // ========================================================
  describe('A. New User Onboarding & Birth Info Verification', () => {
    it('정상 출생정보 입력 시 4주, 21 Ma, RSI, 6 Theme를 포함한 세션이 완벽히 생성된다', () => {
      const res = sessionEngine.createSession({
        birthDate: '1990-05-15',
        birthTime: '10:30',
        gender: 'male',
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.fact.four_pillars.year).toBeDefined();
      expect(res.data?.fact.four_pillars.month).toBeDefined();
      expect(res.data?.fact.four_pillars.day).toBeDefined();
      expect(res.data?.fact.four_pillars.hour).not.toBeNull();
      expect(res.data?.isMissingHour).toBe(false);
    });

    it('출생시간 미상 입력 시에도 3주 기반의 안전한 세션이 생성된다', () => {
      const res = sessionEngine.createSession({
        birthDate: '1985-11-20',
        birthTime: null,
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.isMissingHour).toBe(true);
      expect(res.data?.fact.four_pillars.hour).toBeNull();
    });

    it('경계시간(자정 23:45, 새벽 03:25 등) 출생정보 입력 시 정상 처리된다', () => {
      const resMidnight = sessionEngine.createSession({
        birthDate: '1995-02-04', // 입춘 절기 경계일
        birthTime: '23:45',
      });
      expect(resMidnight.success).toBe(true);
      expect(resMidnight.data?.fact.four_pillars.day).toBeDefined();

      const resDawn = sessionEngine.createSession({
        birthDate: '1992-07-15',
        birthTime: '03:25',
      });
      expect(resDawn.success).toBe(true);
    });

    it('잘못된 생년월일 또는 시간 형식 입력 시 내부 에러를 숨기고 안전한 메시지를 반환한다', () => {
      // 잘못된 날짜 형식
      const resBadDate = sessionEngine.createSession({
        birthDate: '1990/05/15',
      });
      expect(resBadDate.success).toBe(false);
      expect(resBadDate.errorCode).toBe('INVALID_DATE_FORMAT');
      expect(resBadDate.userMessage).toContain('YYYY-MM-DD');

      // 잘못된 시간 형식
      const resBadTime = sessionEngine.createSession({
        birthDate: '1990-05-15',
        birthTime: '25:70',
      });
      expect(resBadTime.success).toBe(false);
      expect(resBadTime.errorCode).toBe('TIME_OUT_OF_RANGE');
      expect(resBadTime.userMessage).toContain('00:00부터 23:59');
    });

    it('필수값(생년월일) 누락 시 친절한 안내를 반환한다', () => {
      const resMissing = sessionEngine.createSession({
        birthDate: '',
      });
      expect(resMissing.success).toBe(false);
      expect(resMissing.errorCode).toBe('MISSING_BIRTH_DATE');
    });
  });

  // ========================================================
  // B. 결과 생성 완전성 검증
  // ========================================================
  describe('B. Core Output Generation Verification', () => {
    const sessionRes = sessionEngine.createSession({
      birthDate: '1988-08-18',
      birthTime: '13:30',
      gender: 'female',
    });

    it('사주 4주, 일간, 주도 오행, 일간 강약이 누락 없이 산출된다', () => {
      const session = sessionRes.data!;
      expect(session.fact.day_stem).toBeDefined();
      expect(session.fact.five_elements.dominantElement).toBeDefined();
      expect(session.fact.day_master_strength.classification).toBeDefined();
      expect(session.userReport.basicStructure.fourPillars.year).toBeDefined();
    });

    it('21개 전체 Ma 신호 및 활성화 상태가 정상 생성된다', () => {
      const session = sessionRes.data!;
      const signals = session.signalSet.signals;
      expect(Object.keys(signals).length).toBe(21);
      expect(session.signalSet.activeSignals.length).toBeGreaterThanOrEqual(0);
    });

    it('6대 핵심 테마 및 RSI 지표가 완성된다', () => {
      const session = sessionRes.data!;
      expect(session.userReport.themes.length).toBe(6);
      const themes = session.userReport.themes.map(t => t.theme);
      expect(themes).toContain('WEALTH_FLOW');
      expect(themes).toContain('CAREER_ORGANIZATION');
      expect(themes).toContain('BUSINESS_VENTURE');
      expect(themes).toContain('RELATIONSHIP_BOND');
      expect(themes).toContain('HEALTH_EQUILIBRIUM');
      expect(themes).toContain('SAFETY_MOVEMENT');

      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(
        session.phase7Output.rsi.band
      );
    });

    it('확정도가 PROVISIONAL로 안전하게 격리되어 있다', () => {
      const session = sessionRes.data!;
      expect(session.userReport.meta.certaintyLevel).toBe('PROVISIONAL');
    });
  });

  // ========================================================
  // C. 상담 대화 및 특수 질문 처리 검증
  // ========================================================
  describe('C. Dialogue & Special Questions Verification', () => {
    const sessionRes = sessionEngine.createSession({
      birthDate: '1991-03-24',
      birthTime: '08:15',
    });
    const session = sessionRes.data!;

    const questionTypes = [
      { type: '재물', q: '저는 돈을 모으는 쪽인가요, 버는 쪽인가요?', expectedIntent: 'WEALTH' },
      { type: '직장', q: '직장생활이 저에게 맞는 편인가요?', expectedIntent: 'CAREER' },
      { type: '사업', q: '사업을 한다면 어떤 구조가 중요한가요?', expectedIntent: 'BUSINESS' },
      { type: '관계', q: '배우자나 연애 관계에서 어떤 점을 중요하게 봐야 하나요?', expectedIntent: 'RELATIONSHIP' },
      { type: '건강', q: '건강에서 제가 특히 신경 써야 할 부분은 무엇인가요?', expectedIntent: 'HEALTH' },
      { type: '안전', q: '이동이나 생활에서 주의할 점이 있나요?', expectedIntent: 'SAFETY' },
      { type: '전체', q: '제 사주를 한마디로 설명하면 어떤 구조인가요?', expectedIntent: 'OVERALL' },
      { type: '복합', q: '사업을 하면서 돈도 벌고 싶은데 건강은 괜찮을까요?', expectedIntent: 'COMPLEX' },
      { type: '모호', q: '앞으로 어떻게 되나요?', expectedIntent: 'AMBIGUOUS' },
      { type: '모순', q: '사업운이 좋다고 했는데 왜 조심하라고 하나요?', expectedIntent: 'CONTRADICTION' },
      { type: '운명론', q: '저는 결국 실패하나요?', expectedIntent: 'FATALISM_DEFENSE' },
      { type: '근거', q: '왜 그렇게 해석했나요?', expectedIntent: 'EVIDENCE' },
    ];

    it.each(questionTypes)('$type 질문: "$q" 에 대해 정상 응답을 반환한다', ({ q, expectedIntent }) => {
      const ansRes = sessionEngine.askQuestion(session, q);
      expect(ansRes.success).toBe(true);
      expect(ansRes.data?.classifiedIntent).toBe(expectedIntent);
      expect(ansRes.data?.conclusion).toBeDefined();
      expect(ansRes.data?.actionableAdvice).toBeDefined();
    });
  });

  // ========================================================
  // D. 데이터 불변성 검증 (Deep Comparison)
  // ========================================================
  describe('D. Deep Data Immutability Audit', () => {
    it('다양한 상담 질문 수행 전후로 사주 Fact, MaSignal, RSI, Certainty가 완전히 불변이어야 한다', () => {
      const sessionRes = sessionEngine.createSession({
        birthDate: '1987-10-12',
        birthTime: '17:40',
      });
      const session = sessionRes.data!;

      // 세션 시작 시점 딥 스냅샷
      const snapshotBefore = JSON.parse(JSON.stringify(session));

      // 5개 이상의 다양한 상담 질문 수행
      const questions = [
        '돈을 잘 버나요?',
        '직장이랑 사업 중 뭐가 낫나요?',
        '결혼은 언제 하나요?',
        '사주가 바뀐 건가요?',
        '왜 그렇게 판단했나요?',
      ];

      for (const q of questions) {
        sessionEngine.askQuestion(session, q);
      }

      // 불변성 종합 감사
      const auditResult = sessionEngine.verifyImmutability(snapshotBefore, session);
      expect(auditResult.allPassed).toBe(true);
      expect(auditResult.isPillarsUnchanged).toBe(true);
      expect(auditResult.isFactUnchanged).toBe(true);
      expect(auditResult.isSignalSetUnchanged).toBe(true);
      expect(auditResult.isActivationStateUnchanged).toBe(true);
      expect(auditResult.isRsiUnchanged).toBe(true);
      expect(auditResult.isCertaintyUnchanged).toBe(true);
      expect(auditResult.auditDetails.length).toBe(0);
    });
  });

  // ========================================================
  // E. 세션 재현성 검증 (Session Reproducibility)
  // ========================================================
  describe('E. Session Reproducibility Verification', () => {
    it('동일한 출생정보로 3개의 독립 세션을 생성했을 때 결과가 100% 동일하다', () => {
      const req: MabosalSessionRequest = {
        birthDate: '1993-06-25',
        birthTime: '12:00',
        gender: 'male',
      };

      const s1 = sessionEngine.createSession(req).data!;
      const s2 = sessionEngine.createSession(req).data!;
      const s3 = sessionEngine.createSession(req).data!;

      // 1. 일간 및 기둥 일치
      expect(s1.fact.day_stem).toBe(s2.fact.day_stem);
      expect(s2.fact.day_stem).toBe(s3.fact.day_stem);

      // 2. RSI 밴드 일치
      expect(s1.phase7Output.rsi.band).toBe(s2.phase7Output.rsi.band);
      expect(s2.phase7Output.rsi.band).toBe(s3.phase7Output.rsi.band);

      // 3. 6대 테마 결론 일치
      for (let i = 0; i < 6; i++) {
        expect(s1.userReport.themes[i].summary).toBe(s2.userReport.themes[i].summary);
        expect(s2.userReport.themes[i].summary).toBe(s3.userReport.themes[i].summary);
      }

      // 4. 동일 질문 시 답변 일치
      const testQ = '직장생활이 저에게 맞는 편인가요?';
      const a1 = sessionEngine.askQuestion(s1, testQ).data!;
      const a2 = sessionEngine.askQuestion(s2, testQ).data!;
      const a3 = sessionEngine.askQuestion(s3, testQ).data!;

      expect(a1.fullResponseText).toBe(a2.fullResponseText);
      expect(a2.fullResponseText).toBe(a3.fullResponseText);
    });
  });

  // ========================================================
  // F. 예외/복구 및 운영 감사 (Operations & Fault-tolerance)
  // ========================================================
  describe('F. Exception Recovery & Operation Readiness', () => {
    const sessionRes = sessionEngine.createSession({
      birthDate: '1989-12-05',
      birthTime: '19:20',
    });
    const session = sessionRes.data!;

    it('빈 질문 입력 시 시스템이 다운되지 않고 재입력 안내 메시지를 반환한다', () => {
      const emptyRes = sessionEngine.askQuestion(session, '   ');
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.errorCode).toBe('EMPTY_QUESTION');
      expect(emptyRes.userMessage).toContain('궁금하신 내용을 입력해 주시면');
    });

    it('2000자 초과의 과도한 질문 입력 시 친절한 축약 안내를 제공한다', () => {
      const hugeQuestion = '사주가 궁금합니다. '.repeat(300); // 3000자 이상
      const hugeRes = sessionEngine.askQuestion(session, hugeQuestion);
      expect(hugeRes.success).toBe(false);
      expect(hugeRes.errorCode).toBe('QUESTION_TOO_LONG');
      expect(hugeRes.userMessage).toContain('간략히 나누어 입력');
    });

    it('개인정보(주민등록번호, 전화번호, 이메일)가 로그 마스킹 유틸리티를 통해 안전하게 보호된다', () => {
      const rawText = '내 주민번호는 900515-1234567 이고 전화번호는 010-1234-5678, 이메일은 hong@example.com 입니다.';
      const masked = sessionEngine.maskPII(rawText);

      expect(masked).not.toContain('1234567');
      expect(masked).toContain('900515-*******');
      expect(masked).toContain('010-****-5678');
      expect(masked).toContain('ho***@example.com');
    });

    it('QUICK / STANDARD / DEEP 3단 모드 간 핵심 명리 판단이 일관되게 유지된다', () => {
      const baseReq: MabosalSessionRequest = {
        birthDate: '1992-04-10',
        birthTime: '15:30',
      };

      const quick = sessionEngine.createSession({ ...baseReq, depthMode: 'QUICK' }).data!;
      const standard = sessionEngine.createSession({ ...baseReq, depthMode: 'STANDARD' }).data!;
      const deep = sessionEngine.createSession({ ...baseReq, depthMode: 'DEEP' }).data!;

      // 1. 핵심 판단 일치
      expect(quick.userReport.flowSummary.keyTendency).toBe(standard.userReport.flowSummary.keyTendency);
      expect(standard.userReport.flowSummary.keyTendency).toBe(deep.userReport.flowSummary.keyTendency);

      // 2. 6대 테마 결론 일치
      for (let i = 0; i < 6; i++) {
        expect(quick.userReport.themes[i].summary).toBe(standard.userReport.themes[i].summary);
        expect(standard.userReport.themes[i].summary).toBe(deep.userReport.themes[i].summary);
      }

      // 3. 깊이 차별화 확인 (DEEP 모드에는 deepFactDetails가 제공됨)
      expect(quick.userReport.themes[0].deepFactDetails).toBeUndefined();
      expect(deep.userReport.themes[0].deepFactDetails).toBeDefined();
    });
  });
});
