import { describe, it, expect } from 'vitest';
import { renderFortuneDetailModals } from '../src/frontend/components/FortuneDetailModals.js';
import { renderBirthInputView } from '../src/frontend/components/views.js';
import { renderUnifiedSajuGrid } from '../src/frontend/components/UnifiedSajuForm.js';
import { renderFreeResultView } from '../src/frontend/views/FreeResultView.js';
import { renderYear2027SingleProductView } from '../src/frontend/views/SingleProductViews.js';
import { renderDaewunLifeCycleChart, renderSplineMonthlyChart } from '../src/frontend/components/VisualCharts.js';
import { buildDynamicDaewunProps, buildDynamicMonthlyScores, extractReportContext } from '../src/frontend/components/tier-templates.js';
import { dailyZodiacMagiEngine } from '../src/frontend/services/DailyZodiacMagiEngine.js';
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
    const guestState = {
      ...appState.getState(),
      sessionState: {
        request: { birthDate: '1993-08-15', birthTime: '14:30', gender: 'female' },
        fact: {
          four_pillars: {
            year: { stem: '계', branch: '유' },
            month: { stem: '경', branch: '신' },
            day: { stem: '을', branch: '미' },
            hour: { stem: '계', branch: '미' },
          },
        },
      } as any,
    };
    const guestHtml = renderFreeResultView(guestState);
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

  it('대운·월운 차트와 2027 단품 뷰가 사주 원국 및 만세력 엔진에 따라 동적으로 계산·렌더링된다', () => {
    const mockState = {
      ...appState.getState(),
      gender: 'male' as const,
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
            distribution: { 목: { count: 4 }, 화: { count: 1 }, 토: { count: 0 }, 금: { count: 1 }, 수: { count: 2 } },
          },
          day_master_strength: { classification: '신강' },
        },
      } as any,
    };

    const daewun = buildDynamicDaewunProps(mockState);
    expect(daewun.currentDaewun).not.toBe('병오(丙午) 대운');
    expect(daewun.nodes && daewun.nodes.length).toBeGreaterThanOrEqual(3);
    const daewunHtml = renderDaewunLifeCycleChart(daewun);
    expect(daewunHtml).toContain(daewun.currentDaewun!);
    expect(daewunHtml).not.toContain('태양과 같은 화(火)기운이 만개하는 10년');

    const monthly2027 = buildDynamicMonthlyScores(mockState, 2027);
    expect(monthly2027).toHaveLength(12);
    expect(monthly2027[0].stemBranch).toBe('壬寅'); // 2027 정미년(丁) 오호둔월법 1월=임인
    const monthlyHtml = renderSplineMonthlyChart({ yearTitle: '2027 정미년(丁未年)', data: monthly2027 });
    expect(monthlyHtml).toContain('2027 정미년(丁未年)');
    expect(monthlyHtml).toContain('壬寅');

    const singleHtml = renderYear2027SingleProductView(mockState);
    expect(singleHtml).toContain('갑신일주');
    expect(singleHtml).toContain('9월 (庚戌월)');
    expect(singleHtml).not.toContain('6월 (정미월)');
  });

  it('세션이 비어 있을 때 임의 샘플 사주 대신 입력 안내 화면을 표시하고, ⑥ 리포트 본문이 실제 원국·신살·대운과 연동된다', () => {
    const emptyHtml = renderFreeResultView({ ...appState.getState(), sessionState: null, productOutputSet: null });
    expect(emptyHtml).toContain('사주 입력이 필요합니다');
    expect(emptyHtml).not.toContain('무인 · 병진 · 기축 · 기사');

    const mockState = {
      ...appState.getState(),
      gender: 'male' as const,
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
            distribution: { 목: { count: 4 }, 화: { count: 1 }, 토: { count: 0 }, 금: { count: 1 }, 수: { count: 2 } },
          },
          day_master_strength: { classification: '신강' },
        },
      } as any,
    };
    const ctx = extractReportContext(mockState);
    expect(ctx.year2026Summary).not.toContain('축오원진');
    expect(ctx.year2027Summary).not.toContain('축미충');
    expect(ctx.sinsalTableMarkdown).toContain('| 신살 | 발생 위치 |');
  });

  it('오늘의 운세 · 행운달력 · 마기달력이 단일 점수 엔진으로 100% 연동되고 1점 단위 및 90점↑ 대길 변별력을 갖는다', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayDate = now.getDate();

    const reading = dailyZodiacMagiEngine.getReading('자', 1984);
    const luckyCal = dailyZodiacMagiEngine.getMonthlyLuckyCalendarData(year, month, '자', 1984);
    const magiCal = dailyZodiacMagiEngine.getMonthlyMagiCalendarData(year, month, '자', 1984);

    expect(reading.fortune.luckyRate + reading.fortune.magiRate).toBe(100);
    expect(luckyCal.days.length).toBe(magiCal.days.length);

    for (let i = 0; i < luckyCal.days.length; i++) {
      expect(luckyCal.days[i].luckyRate + magiCal.days[i].magiRate).toBe(100);
      if (luckyCal.days[i].isGoldenDay) {
        expect(luckyCal.days[i].luckyRate).toBeGreaterThanOrEqual(90);
      }
    }

    const todayLucky = luckyCal.days.find(d => d.date === todayDate)!;
    const todayMagi = magiCal.days.find(d => d.date === todayDate)!;
    expect(todayLucky.luckyRate).toBe(reading.fortune.luckyRate);
    expect(todayMagi.magiRate).toBe(reading.fortune.magiRate);

    // 1점 단위 다양성 및 대길일(90%+) 변별력 (한 달 0~5일 수준)
    const uniqueScores = new Set(luckyCal.days.map(d => d.luckyRate));
    expect(uniqueScores.size).toBeGreaterThanOrEqual(8);
    expect(luckyCal.bestDays.length).toBeLessThanOrEqual(5);

    // 회원용 1:1 개인화 행운달력·마기달력도 모든 날짜에서 합산 100% 보장
    const mockSajuCore = {
      four_pillars: {
        year: { stem: { char: '을', element: '목' }, branch: { char: '묘', element: '목' } },
        month: { stem: { char: '정', element: '화' }, branch: { char: '해', element: '수' } },
        day: { stem: { char: '갑', element: '목' }, branch: { char: '신', element: '금' } },
        hour: { stem: { char: '갑', element: '목' }, branch: { char: '자', element: '수' } },
      },
      day_master_strength: { yongshin: '금', heeshin: '수' },
    };
    const pLucky = dailyZodiacMagiEngine.getPersonalizedMonthlyLuckyCalendarData(year, month, { sajuCore: mockSajuCore });
    const pMagi = dailyZodiacMagiEngine.getPersonalizedMonthlyMagiCalendarData(year, month, { sajuCore: mockSajuCore });
    expect(pLucky.days.length).toBe(pMagi.days.length);
    for (let i = 0; i < pLucky.days.length; i++) {
      expect(pLucky.days[i].luckyRate + pMagi.days[i].magiRate).toBe(100);
    }
  });
});
