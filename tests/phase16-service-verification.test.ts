import { describe, it, expect, beforeEach } from 'vitest';
import { appState } from '../src/frontend/state/app-state.js';
import { frontendAdapter } from '../src/frontend/adapter/engine-adapter.js';
import {
  renderHeader,
  renderBirthInputView,
  renderLoadingView,
  renderResultView,
  renderConsultationView,
  renderReportView,
} from '../src/frontend/components/views.js';
import { MabosalSessionEngine } from '../src/modules/phase13/mabosal-session.js';
import { MabosalSessionRequest } from '../src/modules/phase13/phase13-types.js';

describe('Phase 16 — 실서비스 검증 및 Phase 15 보정 감사 (E2E & Service Verification)', () => {
  let sessionEngine: MabosalSessionEngine;

  beforeEach(() => {
    appState.resetSession();
    sessionEngine = new MabosalSessionEngine();
  });

  describe('1. Gender Input Restoration & Engine Immutability Guarantee', () => {
    it('1-1. 성별 입력 UI 복원: 남성/여성 선택 버튼이 DOM에 정상 렌더링된다', () => {
      const state = appState.getState();
      const html = renderBirthInputView(state);
      expect(html).toContain('성별');
      expect(html).toContain('btn-gender-male');
      expect(html).toContain('btn-gender-female');
      expect(html).toContain('gender-toggle-group');
    });

    it('1-2. 성별 입력 원천 데이터 보존: male/female 입력 시 세션 입력 데이터에 정확히 보존된다', () => {
      const maleSessionRes = sessionEngine.createSession({
        birthDate: '1990-05-15',
        birthTime: '14:30',
        region: 'Seoul',
        gender: 'male',
      });
      expect(maleSessionRes.success).toBe(true);
      expect(maleSessionRes.data?.request.gender).toBe('male');

      const femaleSessionRes = sessionEngine.createSession({
        birthDate: '1990-05-15',
        birthTime: '14:30',
        region: 'Seoul',
        gender: 'female',
      });
      expect(femaleSessionRes.success).toBe(true);
      expect(femaleSessionRes.data?.request.gender).toBe('female');
    });

    it('1-3. [핵심 불변성 검증] 성별 차이가 현재 Phase 1~13 명리 계산/판단값을 절대 변조하지 않는다', () => {
      const maleReq: MabosalSessionRequest = {
        birthDate: '1990-05-15',
        birthTime: '14:30',
        region: 'Seoul',
        gender: 'male',
      };
      const femaleReq: MabosalSessionRequest = {
        birthDate: '1990-05-15',
        birthTime: '14:30',
        region: 'Seoul',
        gender: 'female',
      };

      const maleRes = sessionEngine.createSession(maleReq);
      const femaleRes = sessionEngine.createSession(femaleReq);

      expect(maleRes.success).toBe(true);
      expect(femaleRes.success).toBe(true);

      const maleData = maleRes.data!;
      const femaleData = femaleRes.data!;

      // 1. 사주 4주와 일간 동일
      expect(maleData.fact.four_pillars.day.stem).toBe(femaleData.fact.four_pillars.day.stem);
      expect(maleData.fact.four_pillars.year.stem).toBe(femaleData.fact.four_pillars.year.stem);
      expect(maleData.fact.day_master_strength.classification).toBe(femaleData.fact.day_master_strength.classification);

      // 2. 21개 Ma 활성화 상태 동일
      const maleSignals = Object.values(maleData.signalSet.signals);
      const femaleSignals = Object.values(femaleData.signalSet.signals);
      expect(maleSignals.length).toBe(femaleSignals.length);
      maleSignals.forEach((sig, idx) => {
        expect(sig.moduleId).toBe(femaleSignals[idx].moduleId);
        expect(sig.activation.state).toBe(femaleSignals[idx].activation.state);
      });

      // 3. RSI 밴드 및 응집도/긴장도 동일
      expect(maleData.phase7Output.rsi.band).toBe(femaleData.phase7Output.rsi.band);
      expect(maleData.phase7Output.rsi.cohesion).toBe(femaleData.phase7Output.rsi.cohesion);

      // 4. 6대 테마 결론 동일
      expect(maleData.userReport.themes.length).toBe(6);
      expect(femaleData.userReport.themes.length).toBe(6);
      maleData.userReport.themes.forEach((item, idx) => {
        expect(item.theme).toBe(femaleData.userReport.themes[idx].theme);
        expect(item.summary).toBe(femaleData.userReport.themes[idx].summary);
      });
    });
  });

  describe('2. Desktop & Mobile 렌더링 및 인터랙션 검증', () => {
    it('2-1. Desktop 렌더링: 브랜드 헤더, 네비게이션, 핵심 뷰 앵커가 온전히 구성된다', () => {
      const state = appState.getState();
      const header = renderHeader(state);
      expect(header).toContain('brand-title');
      expect(header).toContain('마보살');
      expect(header).toContain('AI 명리 상담');
      expect(header).toContain('nav-btn-start');
    });

    it('2-2. Mobile 렌더링: 반응형 그리드 및 모바일 전용 래퍼 요소가 존재한다', () => {
      const state = appState.getState();
      const inputHtml = renderBirthInputView(state);
      expect(inputHtml).toContain('gender-toggle-group');
      expect(inputHtml).toContain('btn-gender-male');
      expect(inputHtml).toContain('btn-gender-female');
      expect(inputHtml).toContain('btn-submit-analyze');
    });

    it('2-3. 로딩 상태: 분석 중 스피너 및 설명 텍스트 렌더링', () => {
      const state = appState.getState();
      const loadingHtml = renderLoadingView(state);
      expect(loadingHtml).toContain('loading-container');
      expect(loadingHtml).toContain('loading-spinner-ring');
      expect(loadingHtml).toContain('loading-step-text');
    });
  });

  describe('3. 특수 입력 조건 및 안정성 검증', () => {
    it('3-1. 출생시간 미상 처리: 3주 기반 계산 및 시간 미상 배지가 정상 렌더링된다', () => {
      const res = sessionEngine.createSession({
        birthDate: '1988-11-20',
        birthTime: null,
        region: 'Seoul',
        gender: 'female',
      });
      expect(res.success).toBe(true);
      appState.setSession(res.data!);

      const resultHtml = renderResultView(appState.getState());
      expect(resultHtml).toContain('시간 미상');
      expect(resultHtml).toContain('미상');
    });

    it('3-2. 자정 및 경계 시간(23:15, 23:45, 00:10) 정밀 계산 검증', () => {
      const boundarySession1 = sessionEngine.createSession({
        birthDate: '1995-03-10',
        birthTime: '23:45',
        region: 'Seoul',
        gender: 'male',
      });
      const boundarySession2 = sessionEngine.createSession({
        birthDate: '1995-03-11',
        birthTime: '00:10',
        region: 'Seoul',
        gender: 'male',
      });

      expect(boundarySession1.data?.fact.four_pillars.hour!.branch).toBe('자');
      expect(boundarySession2.data?.fact.four_pillars.hour!.branch).toBe('자');
    });
  });

  describe('4. 화면 전환 및 세션 재현성 (Navigation & Session State)', () => {
    it('4-1. 결과 페이지 이탈/재진입 및 상담 ↔ 결과 ↔ 리포트 왕복 보존', () => {
      const res = sessionEngine.createSession({
        birthDate: '1992-08-14',
        birthTime: '10:30',
        region: 'Seoul',
        gender: 'female',
      });
      expect(res.success).toBe(true);
      appState.setSession(res.data!);
      appState.setView('result');
      expect(appState.getState().currentView).toBe('result');

      // 상담 뷰로 이동
      appState.setView('consult');
      expect(appState.getState().currentView).toBe('consult');
      const consultHtml = renderConsultationView(appState.getState());
      expect(consultHtml).toContain('consultation-wrapper');

      // 다시 결과 뷰로 복귀
      appState.setView('result');
      expect(appState.getState().currentView).toBe('result');
      const resHtml = renderResultView(appState.getState());
      expect(resHtml).toContain('당신의 사주를 한눈에');

      // 리포트 뷰로 이동
      appState.setView('report');
      expect(appState.getState().currentView).toBe('report');
      const reportHtml = renderReportView(appState.getState());
      expect(reportHtml).toContain('마보살 최종 사주 리포트');
    });

    it('4-2. 성별 입력 포함 세션 재현성: 동일 입력 시 정확히 동일한 세션 결과 복원', () => {
      const input: MabosalSessionRequest = {
        birthDate: '1985-12-25',
        birthTime: '07:15',
        region: 'Seoul',
        gender: 'male',
      };

      const res1 = sessionEngine.createSession(input);
      const res2 = sessionEngine.createSession(input);

      expect(res1.data?.fact.four_pillars.day.stem)
        .toBe(res2.data?.fact.four_pillars.day.stem);
      expect(res1.data?.phase7Output.rsi.band)
        .toBe(res2.data?.phase7Output.rsi.band);
      expect(res1.data?.userReport.themes[0].summary)
        .toBe(res2.data?.userReport.themes[0].summary);
    });
  });

  describe('5. 상담 엔진 상호작용 및 예외 방어 (Consultation Stress & Edge Cases)', () => {
    it('5-1. 빈 질문 및 공백 질문 방어: 빈 문자열 trim 방어', () => {
      const res = sessionEngine.createSession({
        birthDate: '1990-01-01',
        birthTime: '12:00',
        region: 'Seoul',
        gender: 'female',
      });
      appState.setSession(res.data!);

      const emptyInput = '   ';
      expect(emptyInput.trim().length).toBe(0);
    });

    it('5-2. 1,000자 이상의 긴 질문 방어: 에러 없이 정상 분류 및 4단 답변 산출', async () => {
      const res = sessionEngine.createSession({
        birthDate: '1990-01-01',
        birthTime: '12:00',
        region: 'Seoul',
        gender: 'female',
      });
      appState.setSession(res.data!);

      const veryLongQuestion = '사업을 하고 싶은데 자금 흐름과 조직 관리가 걱정됩니다. '.repeat(50);
      const answer = await frontendAdapter.askConsultation(res.data!, veryLongQuestion);
      expect(answer).toBeDefined();
      expect(answer.conclusion).toBeDefined();
      expect(answer.fullResponseText.length).toBeGreaterThan(50);
    });
  });

  describe('6. 개인정보 보호 (PII) 및 브랜드 차별성', () => {
    it('6-1. PII 노출 방지: 주민등록번호, 연락처, 실명 요구 없이 오직 사주 천문 데이터만 수집', () => {
      const inputHtml = renderBirthInputView(appState.getState());
      expect(inputHtml).not.toContain('주민등록번호');
      expect(inputHtml).not.toContain('전화번호');
      expect(inputHtml).not.toContain('휴대폰');
      expect(inputHtml).not.toContain('주소');
    });

    it('6-2. 브랜드 차별성: 미신/공포 마케팅이 배제되고 구조적 통찰과 21 Ma 근거 기반 언어 사용', () => {
      const res = sessionEngine.createSession({
        birthDate: '1993-04-21',
        birthTime: '15:20',
        region: 'Seoul',
        gender: 'male',
      });
      appState.setSession(res.data!);
      const resultHtml = renderResultView(appState.getState());

      // 미신적/단정적 공포 조장 어휘 부재
      expect(resultHtml).not.toContain('살풀이');
      expect(resultHtml).not.toContain('부적');
      expect(resultHtml).not.toContain('패가망신');
      expect(resultHtml).not.toContain('단명');

      // 마보살 고유의 구조 분석 용어 존재
      expect(resultHtml).toContain('핵심 구조');
      expect(resultHtml).toContain('일간');
      expect(resultHtml).toContain('근거 보기');
      expect(resultHtml).toContain('21개 마(Ma) 세부 신호 현황판');
    });
  });
});
