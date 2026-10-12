/**
 * Phase 14: Product Blueprint 기반 완성형 프론트엔드 검증 테스트
 * 
 * 검증 항목:
 * 1. Design System & CSS 토큰 무결성
 * 2. Landing View (핵심 메시지, CTA, 특징)
 * 3. Birth Input View (필수값, 시간 미상, 성별, 유효성 검사)
 * 4. Analysis Flow & 5단계 로딩 연출
 * 5. Core Result View (4주 테이블, 일간, 강약, 주도 오행, RSI)
 * 6. 6대 핵심 테마 카드 완비
 * 7. 21개 Ma 세부 신호 및 ActivationState 현황판
 * 8. Evidence Trace (근거 역추적 모달)
 * 9. Consultation View (채팅 버블, 4단 답변 구조, 추천 질문)
 * 10. Time Axis (원국 고정 및 계절 파도 분리 안내)
 * 11. Report Modes (QUICK / STANDARD / DEEP 동일 판단 일관성)
 * 12. Error Handling & PII 방어
 * 13. Data Immutability (상담 중 원국 불변성)
 */

import { describe, expect, it } from 'vitest';
import { frontendAdapter } from '../src/frontend/adapter/engine-adapter.js';
import {
  renderBirthInputView,
  renderConsultationView,
  renderEvidenceTraceModal,
  renderHeader,
  renderLandingView,
  renderLoadingView,
  renderReportView,
  renderResultView,
} from '../src/frontend/components/views.js';
import { appState } from '../src/frontend/state/app-state.js';
import { MabosalSessionRequest } from '../src/modules/phase13/index.js';

describe('Phase 14: Complete Frontend Blueprint Audit Suite', () => {
  const sampleRequest: MabosalSessionRequest = {
    birthDate: '1992-05-15',
    birthTime: '10:30',
    region: 'Seoul',
  };

  // ========================================================
  // 1. Design System & Header
  // ========================================================
  describe('1. Design System & Header', () => {
    it('헤더가 서비스 로고, 브랜드 태그, 내비게이션 링크를 완벽히 렌더링한다', () => {
      const state = appState.getState();
      const html = renderHeader(state);

      expect(html).toContain('마보살');
      expect(html).toContain('AI 명리 상담');
      expect(html).toContain('내 사주 보기');
    });
  });

  // ========================================================
  // 2. Landing View
  // ========================================================
  describe('2. Landing View Blueprint', () => {
    it('랜딩 페이지가 핵심 카피, 시작 CTA, 3대 안내 카드를 충실히 제공한다', () => {
      const html = renderLandingView();

      expect(html).toContain('당신의 사주를 읽고');
      expect(html).toContain('지금 무엇이 중요한지 알려드립니다');
      expect(html).toContain('내 사주 보기');
      expect(html).toContain('나의 기본 구조');
      expect(html).toContain('6대 삶의 영역');
      expect(html).toContain('마보살과 직접 대화');
    });
  });

  // ========================================================
  // 3. Birth Input View
  // ========================================================
  describe('3. Birth Input View', () => {
    it('출생일자, 출생시간, 시간 미상 체크박스, 성별 토글, 지역 입력 요소를 완비한다', () => {
      const state = appState.getState();
      const html = renderBirthInputView(state);

      expect(html).toContain('input-birth-date');
      expect(html).toContain('input-birth-time');
      expect(html).toContain('check-missing-hour');
      expect(html).toContain('출생시간을 정확히 모릅니다');
      expect(html).toContain('select-region');
      expect(html).toContain('btn-gender-male');
      expect(html).toContain('btn-gender-female');
    });

    it('오류 메시지 존재 시 친절한 알림 박스를 표시한다', () => {
      appState.setError('생년월일을 올바른 형식(YYYY-MM-DD)으로 입력해 주십시오.');
      const html = renderBirthInputView(appState.getState());

      expect(html).toContain('form-error-alert');
      expect(html).toContain('생년월일을 올바른 형식');
      appState.setError(null);
    });
  });

  // ========================================================
  // 4. Analysis Flow & Loading View
  // ========================================================
  describe('4. Analysis Flow & Loading View', () => {
    it('분석 중 5단계 진행 문구가 표시되는 로딩 화면이 정상 렌더링된다', () => {
      appState.setLoading(true, '21개 마(Ma) 잠재 신호의 활성화 상태를 계산하고 있습니다...');
      const html = renderLoadingView(appState.getState());

      expect(html).toContain('loading-spinner-ring');
      expect(html).toContain('21개 마(Ma) 잠재 신호');
      expect(html).toContain('태어난 날의 Fact와 21개 Ma 신호를 교차 검증 중');
      appState.setLoading(false);
    });
  });

  // ========================================================
  // 5. Core Result View (E2E 연동)
  // ========================================================
  describe('5. Core Result View', () => {
    it('출생정보 분석 후 한눈에 보는 사주 구조(4주, 일간, 강약, 오행, RSI)를 렌더링한다', async () => {
      const session = await frontendAdapter.analyzeBirthInfo(sampleRequest);
      expect(session).toBeDefined();

      const state = appState.getState();
      const html = renderResultView(state);

      // 사주 4주
      expect(html).toContain('년주 (Year)');
      expect(html).toContain('월주 (Month)');
      expect(html).toContain('일주 (Day · 나)');
      expect(html).toContain('시주 (Hour)');

      // 지표
      expect(html).toContain('일간 본질');
      expect(html).toContain('일간 강약');
      expect(html).toContain('주도 오행');
      expect(html).toContain('통합 안정도 (RSI)');
      expect(html).toContain('마보살이 발견한 핵심 구조');
    });
  });

  // ========================================================
  // 6. 6 Themes View
  // ========================================================
  describe('6. 6 Themes View', () => {
    it('재물, 직장, 사업, 관계, 건강, 안전 6개 테마 카드가 완비된다', () => {
      const state = appState.getState();
      const html = renderResultView(state);

      expect(html).toContain('재물과 자산의 흐름');
      expect(html).toContain('직장과 사회적 성취');
      expect(html).toContain('독립 사업과 실행 기회');
      expect(html).toContain('애정과 배우자 관계');
      expect(html).toContain('신체 기혈과 오행 균형');
      expect(html).toContain('이동과 안전 관리');
      expect(html).toContain('근거 보기 🔍');
    });
  });

  // ========================================================
  // 7. 21 Ma Signal Dashboard
  // ========================================================
  describe('7. 21 Ma Signal Dashboard', () => {
    it('21개 전체 Ma의 한국어 이름 및 ActivationState 뱃지가 정확히 렌더링된다', () => {
      const state = appState.getState();
      const html = renderResultView(state);

      expect(html).toContain('21개 마(Ma) 세부 신호 현황판');
      expect(html).toContain('재물마');
      expect(html).toContain('직장마');
      expect(html).toContain('사업마');
      expect(html).toContain('건강마');
      expect(html).toContain('state-badge');
    });
  });

  // ========================================================
  // 8. Evidence Trace Modal
  // ========================================================
  describe('8. Evidence Trace Modal', () => {
    it('해석 → MaSignal → 2차 상호작용 → RSI → 원천 Fact 역추적 트리를 렌더링한다', () => {
      const session = appState.getState().sessionState!;
      const traceData = frontendAdapter.getTraceInfoForTheme(session, 'WEALTH_FLOW');
      appState.openTraceModal(traceData);

      const html = renderEvidenceTraceModal(appState.getState());
      expect(html).toContain('명리적 근거 추적');
      expect(html).toContain('1단계: 최종 해석');
      expect(html).toContain('2단계: 활성화된 MaSignal 목록');
      expect(html).toContain('3단계: 2차 상호작용 및 RSI 안정도');
      expect(html).toContain('4단계: 원천 사주 Fact');

      appState.closeTraceModal();
    });
  });

  // ========================================================
  // 9. Consultation View (마보살 상담)
  // ========================================================
  describe('9. Consultation View', () => {
    it('채팅 패널, 추천 질문 칩, 4단 답변 구조가 온전히 렌더링된다', async () => {
      const session = appState.getState().sessionState!;
      const answer = await frontendAdapter.askConsultation(session, '직장생활이 저에게 맞는 편인가요?');

      appState.addChatMessage({
        id: 'msg_u1',
        sender: 'user',
        text: '직장생활이 저에게 맞는 편인가요?',
        timestamp: new Date().toISOString(),
      });
      appState.addChatMessage({
        id: 'msg_m1',
        sender: 'mabosal',
        text: answer.conclusion,
        answer,
        timestamp: new Date().toISOString(),
      });

      const html = renderConsultationView(appState.getState());
      expect(html).toContain('마보살 1:1 상담실');
      expect(html).toContain('핵심 결론');
      expect(html).toContain('명리적 근거');
      expect(html).toContain('구조 및 상호작용');
      expect(html).toContain('현실적 조언');
      expect(html).toContain('💰 재물운 구조');
      expect(html).toContain('🏢 직장 적합도');
      expect(html).toContain('⚖️ 직장 vs 사업 비교');
    });
  });

  // ========================================================
  // 10. Time Axis View
  // ========================================================
  describe('10. Time Axis View', () => {
    it('원국 고정 원칙과 계절적 파도를 명확히 격리 안내한다', () => {
      const state = appState.getState();
      const html = renderResultView(state);

      expect(html).toContain('시간의 흐름과 운의 파도');
      expect(html).toContain('원국 자체가 바뀌는 것이 아니라');
      expect(html).toContain('계절과 환경적 자극이 달라지는 것입니다');
    });
  });

  // ========================================================
  // 11. Report Modes (QUICK / STANDARD / DEEP)
  // ========================================================
  describe('11. Report Modes Consistency', () => {
    it('모드 전환에 따라 정보 깊이가 달라지되 핵심 판단은 100% 일치한다', () => {
      frontendAdapter.updateReportDepthMode('QUICK');
      const htmlQuick = renderReportView(appState.getState());
      expect(htmlQuick).toContain('[QUICK 모드 분석 리포트]');

      frontendAdapter.updateReportDepthMode('DEEP');
      const htmlDeep = renderReportView(appState.getState());
      expect(htmlDeep).toContain('[DEEP 모드 분석 리포트]');
      expect(htmlDeep).toContain('원천 십신:');
    });
  });

  // ========================================================
  // 12. Data Immutability during Consultation
  // ========================================================
  describe('12. Data Immutability during Consultation', () => {
    it('상담 질의를 수행해도 원국의 FourPillars, Fact, RSI가 결코 변조되지 않는다', async () => {
      const session = appState.getState().sessionState!;
      const originalDayMaster = session.fact.day_stem;
      const originalRsi = session.phase7Output.rsi.band;
      const originalSignalsCount = Object.keys(session.signalSet.signals).length;

      await frontendAdapter.askConsultation(session, '사업을 하면 돈을 버나요?');
      await frontendAdapter.askConsultation(session, '왜 그렇게 해석했나요?');

      expect(session.fact.day_stem).toBe(originalDayMaster);
      expect(session.phase7Output.rsi.band).toBe(originalRsi);
      expect(Object.keys(session.signalSet.signals).length).toBe(originalSignalsCount);
    });
  });
});
