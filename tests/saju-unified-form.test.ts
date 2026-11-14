import { describe, it, expect } from 'vitest';
import { renderFortuneDetailModals } from '../src/frontend/components/FortuneDetailModals.js';
import { renderBirthInputView } from '../src/frontend/components/views.js';
import { renderUnifiedSajuGrid } from '../src/frontend/components/UnifiedSajuForm.js';
import { renderFreeResultView } from '../src/frontend/views/FreeResultView.js';
import { extractReportContext } from '../src/frontend/components/tier-templates.js';
import { appState } from '../src/frontend/state/app-state.js';

describe('Unified Baekse-style Simple Saju Form', () => {
  it('가입 직후/로그인 사주 온보딩 모달이 이름 옆 8자리 생년월일 및 지역 제거·출생시간 선택 구조를 제공한다', () => {
    const html = renderFortuneDetailModals();

    expect(html).toContain('onboarding-name');
    expect(html).toContain('onboarding-birthdate');
    expect(html).toContain('onboarding-gender');
    expect(html).toContain('onboarding-calendar');
    expect(html).not.toContain('onboarding-region');
    expect(html).toContain('onboarding-time-preset');
    expect(html).toContain('onboarding-time-input');
    expect(html).toContain('onboarding-missing-hour');
    expect(html).toContain('onboarding-leap-month');
    expect(html).not.toContain('id="onboarding-leap-month-wrap" style="display:none');
    expect(html).not.toContain('btn-preset-saju');
    expect(html.indexOf('id="onboarding-name"')).toBeLessThan(html.indexOf('id="onboarding-birthdate"'));
  });

  it('사주 입력 화면이 지역 없이 2행(성별-양력음력)/3행(출생시간: 시진 선택 또는 직접 입력) 구조를 제공한다', () => {
    const html = renderBirthInputView(appState.getState());

    expect(html).toContain('input-user-name');
    expect(html).toContain('input-birth-date');
    expect(html).toContain('analyze-gender');
    expect(html).toContain('analyze-calendar');
    expect(html).not.toContain('select-region');
    expect(html).toContain('출생시간');
    expect(html).not.toContain('출생 시분');
    expect(html).toContain('analyze-time-preset');
    expect(html).toContain('자시 (23:30~01:29)');
    expect(html).toContain('시간선택');
    expect(html).toContain('input-birth-time');
    expect(html).toContain('check-missing-hour');
    expect(html).toContain('출생시간 모름');
    expect(html).toContain('check-leap-month');
    expect(html).toContain('UNIFIED SAJU PROFILE');
    expect(html).toContain('<option value="female" selected>여성</option>');
    expect(html).not.toContain('auto_awesome');
    expect(html).not.toContain('사주원국표 명기');
    expect(html).not.toContain('btn-preset-saju');
    expect(html.indexOf('id="input-user-name"')).toBeLessThan(html.indexOf('id="input-birth-date"'));
    expect(html.indexOf('id="input-birth-date"')).toBeLessThan(html.indexOf('id="analyze-calendar"'));
    expect(html.indexOf('id="analyze-calendar"')).toBeLessThan(html.indexOf('id="analyze-gender"'));
    expect(html.indexOf('id="analyze-gender"')).toBeLessThan(html.indexOf('id="input-birth-time"'));
    expect(html.indexOf('id="input-birth-time"')).toBeLessThan(html.indexOf('id="analyze-time-preset"'));
  });

  it('이용자 개인정보(profile)와 백세인생(la) 폼도 동일한 공통 그리드 및 간결(compact) 모드를 지원한다', () => {
    const profileHtml = renderUnifiedSajuGrid({
      prefix: 'profile',
      nameField: { id: 'input-profile-name', label: '이름 *', value: '테스터' },
      birthDate: '1993-08-15',
    });
    expect(profileHtml).toContain('input-profile-name');
    expect(profileHtml).toContain('이름 *');
    expect(profileHtml).toContain('profile-birthdate');
    expect(profileHtml).toContain('19930815');
    expect(profileHtml).toContain('profile-gender');
    expect(profileHtml).toContain('profile-calendar');
    expect(profileHtml).not.toContain('profile-region');
    expect(profileHtml).toContain('profile-time-preset');
    expect(profileHtml).toContain('profile-time-input');
    expect(profileHtml).toContain('profile-missing-hour');
    expect(profileHtml).toContain('profile-leap-month');

    const laHtml = renderUnifiedSajuGrid({ prefix: 'la', compact: true, birthDate: '19980412' });
    expect(laHtml).toContain('la-birthdate');
    expect(laHtml).toContain('19980412');
    expect(laHtml).toContain('la-gender');
    expect(laHtml).toContain('la-calendar');
    expect(laHtml).not.toContain('la-region');
    expect(laHtml).not.toContain('la-time-preset');
    expect(laHtml).toContain('la-time-input');
    expect(laHtml).toContain('la-missing-hour');
    expect(laHtml).toContain('la-leap-month');
    expect(laHtml.indexOf('id="la-birthdate"')).toBeLessThan(laHtml.indexOf('id="la-time-input"'));
    expect(laHtml.indexOf('id="la-time-input"')).toBeLessThan(laHtml.indexOf('id="la-calendar"'));
    expect(laHtml.indexOf('id="la-calendar"')).toBeLessThan(laHtml.indexOf('id="la-gender"'));
  });

  it('비회원 사주체험 결과 화면은 원국표·간단 풀이(1~2섹션)와 회원가입 유도 카드를 표시한다', () => {
    const guestHtml = renderFreeResultView(appState.getState());
    expect(guestHtml).toContain('무료 사주 체험');
    expect(guestHtml).toContain('한눈에 보는 나의 사주');
    expect(guestHtml).toContain('오행으로 보는 나의 기본 구조');
    expect(guestHtml).not.toContain('내가 가진 가장 큰 장점');
    expect(guestHtml).toContain('btn-guest-signup-unlock');
    expect(guestHtml).toContain('무료 회원가입하고 전체 풀이 보기');
  });

  it('원국 4주와 오행 분포도({ count } 객체 포함)가 100% 일치하여 수(水) 누락이 발생하지 않는다', () => {
    const mockState = {
      ...appState.getState(),
      sessionState: {
        request: { birthDate: '1975-11-02', birthTime: '00:30', gender: 'male' },
        fact: {
          four_pillars: {
            year: { stem: '을', branch: '묘' },
            month: { stem: '정', branch: '해' },
            day: { stem: '갑', branch: '신' },
            hour: { stem: '갑', branch: '자' },
          },
          five_elements: {
            dominantElement: '목',
            distribution: {
              목: { count: 4 },
              화: { count: 1 },
              토: { count: 0 },
              금: { count: 1 },
              수: { count: 2 },
            },
          },
          day_master_strength: { classification: '신강' },
        },
      } as any,
    };

    const ctx = extractReportContext(mockState);
    expect(ctx.dayMaster).toBe('갑목');
    expect(ctx.dayMasterHanja).toBe('甲木');
    expect(ctx.woodCount).toBe(4);
    expect(ctx.fireCount).toBe(1);
    expect(ctx.earthCount).toBe(0);
    expect(ctx.metalCount).toBe(1);
    expect(ctx.waterCount).toBe(2);
    expect(ctx.dominantElement).toBe('목(木)');
    expect(ctx.deficientElement).toBe('토(土)');

    const html = renderFreeResultView(mockState);
    expect(html).toContain('목(木)</span>');
    expect(html).toContain('50%');
    expect(html).toContain('24%');
    expect(html).toContain('목(木) 4 · 화(火) 1 · 토(土) 0 · 금(金) 1 · 수(水) 2');
  });
});
