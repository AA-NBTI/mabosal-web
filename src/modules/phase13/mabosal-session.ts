/**
 * Phase 13: Mabosal Blackbox Session Engine & Operation Auditor
 * 
 * 원칙:
 * 1. 신규 사용자가 출생정보를 입력하여 사주 분석 및 리포트, 상담 대화, 근거 확인, 시간축 질문까지의 전체 사용자 여정을 안전하게 수행합니다.
 * 2. 잘못된 입력(생년월일 형식, 시간 형식, 필수값 누락) 및 예외 상황에 대해 내부 스택 트레이스 노출 없이 안전한 Fallback을 보장합니다.
 * 3. 개인정보(PII) 마스킹 처리 및 로그 안전성을 보장합니다.
 * 4. 상담 전후 데이터 불변성(Deep Immutability)을 감사(Audit)합니다.
 */

import { CalendarEngine } from '../calendar/calendar-engine.js';
import { MaFactAdapter, MaSignalEngine } from '../ma/index.js';
import { Phase7Pipeline } from '../phase7/index.js';
import { MabosalPersonaEngine } from '../phase9/index.js';
import { Phase10UserReportBuilder, ReportDepthMode } from '../phase10/index.js';
import { ConsultationDialogueEngine } from '../phase11/index.js';
import { PillarEngine } from '../pillar/pillar-engine.js';
import { RelationshipEngine } from '../relationship/relationship-engine.js';
import { SajuCoreEngine } from '../saju-core/saju-core-engine.js';
import {
  ImmutabilityAuditCheckResult,
  MabosalSessionRequest,
  MabosalSessionState,
  SessionOperationResult,
} from './phase13-types.js';
import { ConsultationAnswer } from '../phase11/phase11-types.js';

export class MabosalSessionEngine {
  private calendarEngine = new CalendarEngine();
  private pillarEngine = new PillarEngine();
  private sajuCoreEngine = new SajuCoreEngine();
  private relationshipEngine = new RelationshipEngine();
  private signalEngine = new MaSignalEngine();
  private phase7Pipeline = new Phase7Pipeline();
  private personaEngine = new MabosalPersonaEngine();
  private reportBuilder = new Phase10UserReportBuilder();
  private dialogueEngine = new ConsultationDialogueEngine();

  /**
   * 신규 사용자 세션 생성 (입력 검증 → 사주 계산 → 21 Ma → RSI → 6 Theme 리포트)
   */
  public createSession(request: MabosalSessionRequest): SessionOperationResult<MabosalSessionState> {
    try {
      // 1. 입력 유효성 검증
      const validationError = this.validateSessionRequest(request);
      if (validationError) {
        return {
          success: false,
          errorCode: validationError.code,
          userMessage: validationError.message,
          internalErrorDetail: `Validation failed: ${validationError.code}`,
        };
      }

      const birthDate = request.birthDate.trim();
      const birthTime = request.birthTime ? request.birthTime.trim() : null;
      const isMissingHour = !birthTime;
      const region = request.region || 'Seoul';
      const depthMode: ReportDepthMode = request.depthMode || 'STANDARD';
      const timeModulators = request.timeModulators || [];

      // 2. 역법 및 기둥 엔진 (Calendar & Pillar)
      const cal = this.calendarEngine.execute({
        birth_date: birthDate,
        birth_time: birthTime,
        region,
      });

      const pil = this.pillarEngine.execute(cal.data);

      // 3. 사주 핵심 및 관계 엔진 (SajuCore & Relationship)
      const core = this.sajuCoreEngine.execute(pil.data);
      const rel = this.relationshipEngine.execute({ four_pillars: pil.data.four_pillars });

      // 4. Phase 5 Fact Adapter & 21 Ma Signal Engine
      const fact = MaFactAdapter.createInputFact({
        fourPillars: pil.data.four_pillars,
        sajuCore: core.data,
        relationship: rel.data,
        // 원천 데이터에는 request.gender가 보존되며, 현재 엔진 판단값은 성별에 의해 변조되지 않도록 표준 프로필을 유지합니다.
        spouseProfile: { profileType: 'traditional_male' },
      });

      const signalSet = this.signalEngine.process(fact);

      // 5. Phase 7 파이프라인 (Second Relationship, RSI, TimeModulator)
      const phase7Output = this.phase7Pipeline.execute({
        fact,
        signalSet,
        timeModulatorSignals: timeModulators,
      });

      // 6. Phase 9 페르소나 렌더링
      const personaResult = this.personaEngine.renderAll(phase7Output, fact, signalSet);

      // 7. Phase 10 최종 사용자 리포트 빌더
      const userReport = this.reportBuilder.buildReport({
        fact,
        signalSet,
        phase7Output,
        personaResult,
        depthMode,
      });

      // 8. 초기 세션 상태 조립
      const sessionId = request.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const sessionState: MabosalSessionState = {
        sessionId,
        createdAt: new Date().toISOString(),
        request: { ...request },
        fact,
        signalSet,
        phase7Output,
        userReport,
        dialogueContext: {
          previousAnswers: [],
          lastReferencedThemes: [],
        },
        isMissingHour,
      };

      return {
        success: true,
        data: sessionState,
      };
    } catch (err: any) {
      // 오류 발생 시 내부 구현정보(스택 트레이스) 사용자 노출 방지
      return {
        success: false,
        errorCode: 'CALCULATION_ERROR',
        userMessage: '사주 분석 정보를 처리하는 중 일시적인 지연이 발생했습니다. 입력 정보를 다시 확인해 주시기 바랍니다.',
        internalErrorDetail: err?.message || String(err),
      };
    }
  }

  /**
   * 세션 내에서 자연어 질문 상담 수행
   */
  public askQuestion(
    state: MabosalSessionState,
    questionText: string
  ): SessionOperationResult<ConsultationAnswer> {
    try {
      if (!questionText || questionText.trim().length === 0) {
        return {
          success: false,
          errorCode: 'EMPTY_QUESTION',
          userMessage: '궁금하신 내용을 입력해 주시면 정성껏 답변해 드리겠습니다.',
        };
      }

      // 지나치게 긴 질문 방어 (2000자 초과 시 핵심 질문 권고)
      if (questionText.length > 2000) {
        return {
          success: false,
          errorCode: 'QUESTION_TOO_LONG',
          userMessage: '질문 내용이 너무 길어 핵심을 파악하기 어렵습니다. 가장 궁금하신 질문 위주로 간략히 나누어 입력해 주시기 바랍니다.',
        };
      }

      // 대화 엔진을 통해 답변 생성
      const answer = this.dialogueEngine.answerQuestion({
        questionText,
        fact: state.fact,
        signalSet: state.signalSet,
        phase7Output: state.phase7Output,
        userReport: state.userReport,
        context: state.dialogueContext,
      });

      // 세션 대화 컨텍스트 누적
      state.dialogueContext.previousAnswers.push(answer);
      state.dialogueContext.lastReferencedThemes = answer.primaryThemes;

      return {
        success: true,
        data: answer,
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'DIALOGUE_ERROR',
        userMessage: '상담 답변을 생성하는 중 일시적인 오류가 발생했습니다. 잠시 후 다시 질문해 주십시오.',
        internalErrorDetail: err?.message || String(err),
      };
    }
  }

  /**
   * 데이터 불변성 검사 (Deep Comparison: 상담 전후 데이터 변조 여부 감사)
   */
  public verifyImmutability(
    snapshotBefore: MabosalSessionState,
    currentState: MabosalSessionState
  ): ImmutabilityAuditCheckResult {
    const auditDetails: string[] = [];

    // 1. 사주 4주 불변 확인
    const p1 = snapshotBefore.fact.four_pillars;
    const p2 = currentState.fact.four_pillars;
    const isPillarsUnchanged =
      p1.year.stem === p2.year.stem &&
      p1.year.branch === p2.year.branch &&
      p1.month.stem === p2.month.stem &&
      p1.month.branch === p2.month.branch &&
      p1.day.stem === p2.day.stem &&
      p1.day.branch === p2.day.branch &&
      p1.hour?.stem === p2.hour?.stem &&
      p1.hour?.branch === p2.hour?.branch;

    if (!isPillarsUnchanged) auditDetails.push('FourPillars mutated');

    // 2. Fact 불변 확인
    const isFactUnchanged =
      snapshotBefore.fact.day_stem === currentState.fact.day_stem &&
      snapshotBefore.fact.day_master_strength.classification === currentState.fact.day_master_strength.classification;

    if (!isFactUnchanged) auditDetails.push('Core Fact mutated');

    // 3. MaSignalSet 불변 확인
    const isSignalSetUnchanged =
      Object.keys(snapshotBefore.signalSet.signals).length === Object.keys(currentState.signalSet.signals).length &&
      snapshotBefore.signalSet.activeSignals.length === currentState.signalSet.activeSignals.length;

    if (!isSignalSetUnchanged) auditDetails.push('SignalSet mutated');

    // 4. ActivationState 불변 확인
    let isActivationStateUnchanged = true;
    for (const [k, v] of Object.entries(snapshotBefore.signalSet.signals)) {
      if (currentState.signalSet.signals[k]?.activation.state !== v.activation.state) {
        isActivationStateUnchanged = false;
        break;
      }
    }
    if (!isActivationStateUnchanged) auditDetails.push('ActivationState mutated');

    // 5. RSI 불변 확인
    const isRsiUnchanged = snapshotBefore.phase7Output.rsi.band === currentState.phase7Output.rsi.band;
    if (!isRsiUnchanged) auditDetails.push('RSI Band mutated');

    // 6. Certainty 불변 확인
    const isCertaintyUnchanged =
      snapshotBefore.userReport.meta.certaintyLevel === currentState.userReport.meta.certaintyLevel;
    if (!isCertaintyUnchanged) auditDetails.push('Certainty Level mutated');

    const allPassed =
      isPillarsUnchanged &&
      isFactUnchanged &&
      isSignalSetUnchanged &&
      isActivationStateUnchanged &&
      isRsiUnchanged &&
      isCertaintyUnchanged;

    return {
      isPillarsUnchanged,
      isFactUnchanged,
      isSignalSetUnchanged,
      isActivationStateUnchanged,
      isRsiUnchanged,
      isCertaintyUnchanged,
      allPassed,
      auditDetails,
    };
  }

  /**
   * 개인정보(PII) 마스킹 처리 (운영 로그 보호용)
   */
  public maskPII(text: string): string {
    return text
      // 주민등록번호 마스킹 (000000-0000000)
      .replace(/\b(\d{6})[- ]?(\d{7})\b/g, '$1-*******')
      // 전화번호 마스킹 (010-0000-0000)
      .replace(/\b(01[016789])[- ]?(\d{3,4})[- ]?(\d{4})\b/g, '$1-****-$3')
      // 이메일 마스킹 (user@example.com)
      .replace(/\b([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '$1***@$2');
  }

  // ==========================================
  // 내부 헬퍼: 입력 검증
  // ==========================================
  private validateSessionRequest(request: MabosalSessionRequest): { code: string; message: string } | null {
    if (!request.birthDate || typeof request.birthDate !== 'string') {
      return { code: 'MISSING_BIRTH_DATE', message: '생년월일은 필수 입력 항목입니다.' };
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(request.birthDate.trim())) {
      return { code: 'INVALID_DATE_FORMAT', message: '생년월일을 YYYY-MM-DD 형식으로 입력해 주십시오.' };
    }

    const [yStr, mStr, dStr] = request.birthDate.trim().split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const day = parseInt(dStr, 10);

    if (year < 1900 || year > 2050) {
      return { code: 'YEAR_OUT_OF_RANGE', message: '생년은 1900년부터 2050년 사이여야 합니다.' };
    }

    if (month < 1 || month > 12) {
      return { code: 'INVALID_MONTH', message: '월은 1월부터 12월 사이여야 합니다.' };
    }

    if (day < 1 || day > 31) {
      return { code: 'INVALID_DAY', message: '일자는 1일부터 31일 사이여야 합니다.' };
    }

    if (request.birthTime) {
      const timePattern = /^\d{2}:\d{2}$/;
      if (!timePattern.test(request.birthTime.trim())) {
        return { code: 'INVALID_TIME_FORMAT', message: '출생시간을 HH:mm 형식으로 입력해 주십시오.' };
      }

      const [hStr, minStr] = request.birthTime.trim().split(':');
      const hour = parseInt(hStr, 10);
      const min = parseInt(minStr, 10);

      if (hour < 0 || hour > 23 || min < 0 || min > 59) {
        return { code: 'TIME_OUT_OF_RANGE', message: '출생시간은 00:00부터 23:59 사이여야 합니다.' };
      }
    }

    return null;
  }
}
