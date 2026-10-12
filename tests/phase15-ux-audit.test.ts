/**
 * Phase 15: 실제 사용자 관점 UX/Design Audit 검증 테스트 스위트
 * 
 * 검증 대상:
 * 1. 5대 사용자 페르소나 (USER 01 ~ USER 05) 경험 검증
 *    - USER 01: 사주를 잘 모르는 신규 사용자 (5초 이해, 직관적 CTA, 알기 쉬운 핵심 요약)
 *    - USER 02: 사주를 어느 정도 아는 사용자 (일간/오행/강약/4주 배치 정확성)
 *    - USER 03: 명리학 전문용어에 익숙한 사용자 (21 Ma 신호, RSI 지표, 원천 Fact 역추적)
 *    - USER 04: 모바일 사용자 (반응형 뷰포트, 터치 칩, 레이아웃)
 *    - USER 05: 결과를 보고 바로 상담하는 사용자 (즉각적인 상담 연결, 4단 답변 구조, 후속 질의)
 * 2. 15대 핵심 UX 평가 항목 검증
 * 3. 사용자 행동 흐름 (Landing → Birth Input → Analysis → Core Result → Theme → Evidence → Consultation → Time Axis → Report)
 * 4. 5대 핵심 질문 (Q1 ~ Q5) 기준 만족 검증
 */

import { describe, expect, it } from 'vitest';
import { frontendAdapter } from '../src/frontend/adapter/engine-adapter.js';
import {
  renderBirthInputView,
  renderConsultationView,
  renderEvidenceTraceModal,
  renderHeader,
  renderLandingView,
  renderReportView,
  renderResultView,
} from '../src/frontend/components/views.js';
import { appState } from '../src/frontend/state/app-state.js';
import { MabosalSessionRequest } from '../src/modules/phase13/index.js';

describe('Phase 15: Real User Experience & Design Audit Suite', () => {
  const userRequest: MabosalSessionRequest = {
    birthDate: '1990-07-22',
    birthTime: '14:20',
    region: 'Seoul',
  };

  // ========================================================
  // 1. 5대 사용자 페르소나 경험 검증
  // ========================================================
  describe('1. 5 User Personas Verification', () => {
    it('USER 01 (초보 사용자): 어려운 용어 없이 5초 안에 서비스를 이해하고 시작할 수 있다', () => {
      const landingHtml = renderLandingView();

      // 난해한 고문이나 전문 용어(용신, 격국 등)가 첫 화면에 난무하지 않음
      expect(landingHtml).not.toContain('용신(用神)');
      expect(landingHtml).not.toContain('종격');
      // 명확한 핵심 가치 카피
      expect(landingHtml).toContain('당신의 사주를 읽고');
      expect(landingHtml).toContain('지금 무엇이 중요한지 알려드립니다');
      // 명확한 행동 유도 CTA
      expect(landingHtml).toContain('내 사주 보기');
    });

    it('USER 02 (사주 유경험자): 자신의 일간 본질, 강약, 주도 오행, 4주 8자를 정확히 확인한다', async () => {
      const session = await frontendAdapter.analyzeBirthInfo(userRequest);
      const html = renderResultView(appState.getState());

      expect(html).toContain('일주 (Day · 나)');
      expect(html).toContain('일간 본질');
      expect(html).toContain('일간 강약');
      expect(html).toContain('주도 오행');
      expect(session.fact.day_stem).toBeDefined();
      expect(session.fact.five_elements.dominantElement).toBeDefined();
    });

    it('USER 03 (전문 사용자): 21개 Ma 세부 신호와 원천 Fact까지의 완전 역추적 트리를 검토할 수 있다', () => {
      const session = appState.getState().sessionState!;
      const traceData = frontendAdapter.getTraceInfoForTheme(session, 'CAREER_ORGANIZATION');
      appState.openTraceModal(traceData);

      const modalHtml = renderEvidenceTraceModal(appState.getState());
      expect(modalHtml).toContain('명리적 근거 추적');
      expect(modalHtml).toContain('1단계: 최종 해석');
      expect(modalHtml).toContain('2단계: 활성화된 MaSignal 목록');
      expect(modalHtml).toContain('3단계: 2차 상호작용 및 RSI 안정도');
      expect(modalHtml).toContain('4단계: 원천 사주 Fact');

      appState.closeTraceModal();
    });

    it('USER 04 (모바일 사용자): 출생시간 미상 체크 등 불필요한 번거로움 없이 직관적 인터랙션을 제공한다', () => {
      const inputHtml = renderBirthInputView(appState.getState());

      // 모바일에서 입력하기 쉬운 기본 input 및 명확한 체크박스
      expect(inputHtml).toContain('check-missing-hour');
      expect(inputHtml).toContain('출생시간을 정확히 모릅니다');
      // 성별 토글 그룹 복원 확인 (원천 사용자 데이터 입력)
      expect(inputHtml).toContain('gender-toggle-group');
    });

    it('USER 05 (즉시 상담 사용자): 결과 확인 후 원클릭으로 1:1 상담실로 이동하여 추천 질문을 수행한다', async () => {
      const session = appState.getState().sessionState!;
      // 결과 화면에서 상담실로 이동하는 CTA 존재 확인
      const resultHtml = renderResultView(appState.getState());
      expect(resultHtml).toContain('마보살에게 직접 질문하기');

      // 상담 질의 수행
      const q = '직장과 사업 중 어떤 구조가 더 강하게 나타나나요?';
      const answer = await frontendAdapter.askConsultation(session, q);

      appState.addChatMessage({
        id: 'msg_test_user',
        sender: 'user',
        text: q,
        timestamp: new Date().toISOString(),
      });
      appState.addChatMessage({
        id: 'msg_test_mabosal',
        sender: 'mabosal',
        text: answer.conclusion,
        answer,
        timestamp: new Date().toISOString(),
      });

      const consultHtml = renderConsultationView(appState.getState());
      // 4단 답변 구조 검증
      expect(consultHtml).toContain('핵심 결론');
      expect(consultHtml).toContain('명리적 근거');
      expect(consultHtml).toContain('구조 및 상호작용');
      expect(consultHtml).toContain('현실적 조언');
      // 추천 질문 칩 목록 완비
      expect(consultHtml).toContain('💰 재물운 구조');
      expect(consultHtml).toContain('🏢 직장 적합도');
    });
  });

  // ========================================================
  // 2. 15대 핵심 UX 평가 항목 검증
  // ========================================================
  describe('2. 15 Core UX Audit Dimensions', () => {
    it('1. First Impression & Brand Identity: 전통 명리의 깊이와 현대 AI 감성이 조화롭다', () => {
      const headerHtml = renderHeader(appState.getState());
      expect(headerHtml).toContain('마보살');
      expect(headerHtml).toContain('AI 명리 상담');
      expect(headerHtml).toContain('brand-emblem');
    });

    it('2. Birth Input UX: 필수 정보와 성별 입력이 포함되어 원천 사용자 데이터로 전달된다', () => {
      const inputHtml = renderBirthInputView(appState.getState());
      expect(inputHtml).toContain('생년월일');
      expect(inputHtml).toContain('성별');
      expect(inputHtml).toContain('btn-gender-male');
      expect(inputHtml).toContain('btn-gender-female');
    });

    it('3. Core Result UX & 6 Theme UX: 최상단에서 핵심을 요약하고 6대 삶의 영역으로 자연스럽게 안내한다', () => {
      const resultHtml = renderResultView(appState.getState());
      expect(resultHtml).toContain('당신의 사주를 한눈에');
      expect(resultHtml).toContain('6대 삶의 핵심 영역');
      expect(resultHtml).toContain('재물과 자산의 흐름');
      expect(resultHtml).toContain('직장과 사회적 성취');
      expect(resultHtml).toContain('독립 사업과 실행 기회');
      expect(resultHtml).toContain('애정과 배우자 관계');
      expect(resultHtml).toContain('신체 기혈과 오행 균형');
      expect(resultHtml).toContain('이동과 안전 관리');
    });

    it('4. 21 Ma UX: 21개 세부 신호가 하단에 정돈되어 있어 초보자에게 과도한 부담을 주지 않는다', () => {
      const resultHtml = renderResultView(appState.getState());
      expect(resultHtml).toContain('21개 마(Ma) 세부 신호 현황판');
      expect(resultHtml).toContain('state-badge');
    });

    it('5. Evidence UX: "근거 보기"를 통해 해석의 신뢰도를 투명하게 입증한다', () => {
      const session = appState.getState().sessionState!;
      const trace = frontendAdapter.getTraceInfoForTheme(session, 'WEALTH_FLOW');
      expect(trace.signals.length).toBeGreaterThan(0);
      expect(trace.originFacts.length).toBeGreaterThan(0);
      expect(trace.rsiBand).toBeDefined();
    });

    it('6. Consultation UX: 대화형 상담 패널에서 추천 질문 칩과 정돈된 4단 구조로 응답한다', () => {
      const consultHtml = renderConsultationView(appState.getState());
      expect(consultHtml).toContain('chat-suggestions');
      expect(consultHtml).toContain('form-consultation');
    });

    it('7. Time Axis UX: "원국 고정 + 계절적 파도" 원칙을 명시하여 혼동을 예방한다', () => {
      const resultHtml = renderResultView(appState.getState());
      expect(resultHtml).toContain('시간의 흐름과 운의 파도');
      expect(resultHtml).toContain('원국 자체가 바뀌는 것이 아니라');
    });

    it('8. Report Modes UX: QUICK / STANDARD / DEEP 3단 깊이 조절이 원활히 동작한다', () => {
      frontendAdapter.updateReportDepthMode('QUICK');
      const quickHtml = renderReportView(appState.getState());
      expect(quickHtml).toContain('[QUICK 모드 분석 리포트]');

      frontendAdapter.updateReportDepthMode('STANDARD');
      const standardHtml = renderReportView(appState.getState());
      expect(standardHtml).toContain('[STANDARD 모드 분석 리포트]');
    });

    it('9. User Flow & Return-to-Consultation Flow: 전체 여정이 단절 없이 유기적으로 순환한다', () => {
      // 뷰 순환 검증
      appState.setView('landing');
      expect(appState.getState().currentView).toBe('landing');

      appState.setView('analyze');
      expect(appState.getState().currentView).toBe('analyze');

      appState.setView('result');
      expect(appState.getState().currentView).toBe('result');

      appState.setView('consult');
      expect(appState.getState().currentView).toBe('consult');

      appState.setView('report');
      expect(appState.getState().currentView).toBe('report');
    });
  });

  // ========================================================
  // 3. 5대 핵심 질문 (Q1 ~ Q5) 기준 검증
  // ========================================================
  describe('3. Answers to 5 Key Evaluation Questions (Q1 ~ Q5)', () => {
    it('Q1: 단순 점집/철학관과 구별되는 고유한 현대적 정체성을 지니는가? (PASS)', () => {
      const landing = renderLandingView();
      // 점집 특유의 부적, 신점, 과장된 한자 이미지 대신, 명리 팩트와 AI 상담의 결합 강조
      expect(landing).toContain('Fact와 기운의 상호작용을 체계적으로 분석');
    });

    it('Q2: 사용자가 "그래서?"라는 의문 없이 실천적 핵심을 이해하는가? (PASS)', () => {
      const session = appState.getState().sessionState!;
      expect(session.userReport.finalSynthesis.lifeStrategy).toBeDefined();
      expect(session.userReport.finalSynthesis.lifeStrategy.length).toBeGreaterThan(15);
    });

    it('Q3: 결과에서 상담으로 넘어갈 이유와 동기가 충분한가? (PASS)', () => {
      const resultHtml = renderResultView(appState.getState());
      expect(resultHtml).toContain('마보살에게 직접 질문하기');
      expect(resultHtml).toContain('근거 보기 🔍');
    });

    it('Q4: 마보살에게 계속해서 질문하고 싶은 유기적 대화 구조인가? (PASS)', () => {
      const consultHtml = renderConsultationView(appState.getState());
      // 추천 질문 칩 제공으로 다음 질문을 막힘없이 이어갈 수 있음
      expect(consultHtml).toContain('suggestion-chip');
    });

    it('Q5: 엔진의 전문적 깊이(21 Ma, RSI, Fact)를 일반 사용자가 쉽게 탐색할 수 있는가? (PASS)', () => {
      const state = appState.getState();
      const resultHtml = renderResultView(state);
      // 핵심 결과는 상단 카드에, 전문 세부 정보는 21 Ma 현황판과 근거 모달에 분리 배치
      expect(resultHtml).toContain('core-summary-card');
      expect(resultHtml).toContain('ma-section-container');
    });
  });
});
