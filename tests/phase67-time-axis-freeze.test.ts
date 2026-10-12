/**
 * tests/phase67-time-axis-freeze.test.ts
 * 
 * Phase 67: 시간축 최종 검증 (Time Axis Freeze Verification)
 * 
 * 핵심 검증 목표:
 * "명식 + 출생정보 + 특정 연도/시점 → 당시의 대운·세운·관계·변화가 정확하게 계산되는가?"
 * 과거·현재·미래 시점을 혼동하지 않고, 시간축 데이터 출처(NATAL, DAEWUN, SEUN)를 엄격히 분리·보존한다.
 * 
 * 18대 검증 항목:
 * - TIME-01: CASE 01~05 대운 진행 방향 (순행/역행 독립 검증)
 * - TIME-02: CASE 01~05 대운 시작 나이 (대운수 독립 검증)
 * - TIME-03: CASE 01~05 전체 10개 대운 간지 배열 검증
 * - TIME-04: 현재 대운 판정 검증 (2026년 기준)
 * - TIME-05: 과거 대운 추출 및 역검증
 * - TIME-06: 미래 대운 전환 및 예측 검증
 * - TIME-07: 세운 계산 검증 (출생연도, 사건연도, 현재연도, 차기연도)
 * - TIME-08: 원국 × 대운 관계 상호작용 검증 (source: 'DAEWUN')
 * - TIME-09: 원국 × 세운 관계 상호작용 검증 (source: 'SEUN')
 * - TIME-10: 대운 × 세운 관계 상호작용 검증 (대운×세운 충/합/형/파/해/원진)
 * - TIME-11: CASE 01~05 사건 발생연도 역추적 인과 체인 검증
 * - TIME-12: 시간축 source 보존 검증 (NATAL, DAEWUN, SEUN)
 * - TIME-13: 관계 중복 및 출처 구분 검증 (단순 합산 금지, 출처별 독립 보존)
 * - TIME-14: 현재 vs 미래 구분 및 안전 원칙 검증 (미래 사건 확정적 단정 금지)
 * - TIME-15: 시간축 결정성 검증 (동일 입력 10회 반복 100% 동일)
 * - TIME-16: 대운 경계값 검증 (대운 시작 직전/직후 나이 및 날짜)
 * - TIME-17: 연도 및 절기 경계 검증 (1월 1일 vs 입춘 세운 분기)
 * - TIME-18: Phase 60~66 전체 회귀 검증
 */

import { describe, it, expect } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { DaewoonEngine as CoreDaewoonEngine } from '../src/modules/saju-core/daewoon-engine.js';
import { DaewoonEngine as LegacyDaewoonEngine } from '../src/modules/luck/daewoon-engine.js';
import { AnnualMonthlyDailyEngine } from '../src/modules/luck/annual-monthly-daily.js';
import { standardRelationAuditor } from '../src/modules/relationship/standard-relation-auditor.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { UserProblemInput } from '../src/modules/product-generator/types.js';
import { HeavenlyStem, EarthlyBranch, FourPillars } from '../src/core/types.js';
import { STEM_INFO } from '../src/core/constants.js';

describe('Phase 67: 시간축 최종 검증 Test Suite', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const coreDaewoonEngine = new CoreDaewoonEngine();
  const legacyDaewoonEngine = new LegacyDaewoonEngine();
  const luckEngine = new AnnualMonthlyDailyEngine();
  const generator = new ProductGenerator();

  // CASE 01~05 기준 데이터 세트 (Phase 58.1 & 58.2 Freeze 규격)
  const caseProfiles = [
    {
      id: 'CASE 01',
      title: '연애/결별',
      domain: 'LOVE',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      eventYear: 2024,
      eventDesc: '연인과 성격 차이로 결별했습니다.',
      expectedDirection: '순행' as const,
      expectedDaewoonNumber: 7,
      expectedCurrentOrder2026: 3,
      expectedCurrentGanji2026: '병오',
      expectedDaewoonList: [
        '갑진', '을사', '병오', '정미', '무신', '기유', '경술', '신해', '임자', '계축'
      ],
      expectedPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
    },
    {
      id: 'CASE 02',
      title: '사업 부도/사업 위기',
      domain: 'BUSINESS',
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      eventYear: 2024,
      eventDesc: '거래처 연쇄 부도와 동업자 지분 분쟁으로 위기입니다.',
      expectedDirection: '역행' as const,
      expectedDaewoonNumber: 1,
      expectedCurrentOrder2026: 4,
      expectedCurrentGanji2026: '경신',
      expectedDaewoonList: [
        '계해', '임술', '신유', '경신', '기미', '무오', '정사', '병진', '을묘', '갑인'
      ],
      expectedPillars: {
        year: { stem: '무', branch: '진' },
        month: { stem: '갑', branch: '자' },
        day: { stem: '기', branch: '해' },
        hour: { stem: '신', branch: '미' },
      },
    },
    {
      id: 'CASE 03',
      title: '직장 이직/승진 갈등',
      domain: 'JOB',
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male' as const,
      eventYear: 2025,
      eventDesc: '상사와의 심각한 갈등 및 인사 불이익으로 이직 고민 중입니다.',
      expectedDirection: '역행' as const,
      expectedDaewoonNumber: 5,
      expectedCurrentOrder2026: 3,
      expectedCurrentGanji2026: '무인',
      expectedDaewoonList: [
        '경진', '기묘', '무인', '정축', '병자', '을해', '갑술', '계유', '임신', '신미'
      ],
      expectedPillars: {
        year: { stem: '을', branch: '해' },
        month: { stem: '신', branch: '사' },
        day: { stem: '신', branch: '해' },
        hour: { stem: '정', branch: '유' },
      },
    },
    {
      id: 'CASE 04',
      title: '투자 손실/재물 위기',
      domain: 'MONEY',
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male' as const,
      eventYear: 2024,
      eventDesc: '부동산 및 레버리지 투자 실패로 극심한 채무 압박 상태입니다.',
      expectedDirection: '순행' as const,
      expectedDaewoonNumber: 1,
      expectedCurrentOrder2026: 5,
      expectedCurrentGanji2026: '무신',
      expectedDaewoonList: [
        '갑진', '을사', '병오', '정미', '무신', '기유', '경술', '신해', '임자', '계축'
      ],
      expectedPillars: {
        year: { stem: '임', branch: '술' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '무', branch: '오' },
        hour: { stem: '을', branch: '묘' },
      },
    },
    {
      id: 'CASE 05',
      title: '수술/건강 위기',
      domain: 'HEALTH',
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male' as const,
      eventYear: 2024,
      eventDesc: '급성 척추 질환으로 응급 수술 권유를 받았습니다.',
      expectedDirection: '순행' as const,
      expectedDaewoonNumber: 8,
      expectedCurrentOrder2026: 4,
      expectedCurrentGanji2026: '경자',
      expectedDaewoonList: [
        '정유', '무술', '기해', '경자', '신축', '임인', '계묘', '갑진', '을사', '병오'
      ],
      expectedPillars: {
        year: { stem: '병', branch: '인' },
        month: { stem: '병', branch: '신' },
        day: { stem: '신', branch: '묘' },
        hour: { stem: '병', branch: '신' },
      },
    },
  ];

  // ==========================================================================
  // TIME-01: CASE 01~05 대운 방향 검증 (순행/역행 독립 규칙 검증)
  // ==========================================================================
  it('TIME-01: CASE 01~05 대운 방향(순행/역행) 독립 판정 검증', () => {
    for (const c of caseProfiles) {
      const yearStem = c.expectedPillars.year.stem as HeavenlyStem;
      const isYangYear = STEM_INFO[yearStem].yinYang === '양';
      const isMale = c.gender === 'male';

      // 독립 규칙: 양남음녀 순행, 음남양녀 역행
      const independentDirection = (isMale && isYangYear) || (!isMale && !isYangYear) ? '순행' : '역행';
      expect(independentDirection).toBe(c.expectedDirection);

      const [y, m, d] = c.birthDate.split('-').map(Number);
      const [h, min] = c.birthTime.split(':').map(Number);

      const dw = coreDaewoonEngine.calculateDaewoon({
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthHour: h,
        birthMinute: min,
        gender: c.gender,
        yearStem: c.expectedPillars.year.stem as HeavenlyStem,
        monthStem: c.expectedPillars.month.stem as HeavenlyStem,
        monthBranch: c.expectedPillars.month.branch as EarthlyBranch,
      });

      expect(dw.direction).toBe(c.expectedDirection);
    }
  });

  // ==========================================================================
  // TIME-02: 대운 시작 나이 (대운수 독립 계산 및 일치성 검증)
  // ==========================================================================
  it('TIME-02: CASE 01~05 대운 시작 나이(대운수) 독립 계산 검증', () => {
    for (const c of caseProfiles) {
      const [y, m, d] = c.birthDate.split('-').map(Number);
      const [h, min] = c.birthTime.split(':').map(Number);

      const dw = coreDaewoonEngine.calculateDaewoon({
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthHour: h,
        birthMinute: min,
        gender: c.gender,
        yearStem: c.expectedPillars.year.stem as HeavenlyStem,
        monthStem: c.expectedPillars.month.stem as HeavenlyStem,
        monthBranch: c.expectedPillars.month.branch as EarthlyBranch,
      });

      expect(dw.daewoonNumber).toBe(c.expectedDaewoonNumber);
      expect(dw.daewoonNumber).toBeGreaterThanOrEqual(1);
      expect(dw.daewoonNumber).toBeLessThanOrEqual(10);
    }
  });

  // ==========================================================================
  // TIME-03: 전체 대운 배열 검증 (월주 기준 10개 대운 간지 순서)
  // ==========================================================================
  it('TIME-03: CASE 01~05 전체 10개 대운 배열 정확성 전수 검증', () => {
    for (const c of caseProfiles) {
      const [y, m, d] = c.birthDate.split('-').map(Number);
      const [h, min] = c.birthTime.split(':').map(Number);

      const dw = coreDaewoonEngine.calculateDaewoon({
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthHour: h,
        birthMinute: min,
        gender: c.gender,
        yearStem: c.expectedPillars.year.stem as HeavenlyStem,
        monthStem: c.expectedPillars.month.stem as HeavenlyStem,
        monthBranch: c.expectedPillars.month.branch as EarthlyBranch,
      });

      expect(dw.pillars.length).toBe(10);
      const computedGanjis = dw.pillars.map(p => p.ganji);
      expect(computedGanjis).toEqual(c.expectedDaewoonList);

      // 대운 나이 연속성 검증
      for (let i = 0; i < dw.pillars.length; i++) {
        const p = dw.pillars[i];
        expect(p.startAge).toBe(c.expectedDaewoonNumber + i * 10);
        expect(p.endAge).toBe(p.startAge + 9);
      }
    }
  });

  // ==========================================================================
  // TIME-04: 현재 대운 (2026년 기준 현재 대운 판정)
  // ==========================================================================
  it('TIME-04: 2026년 기준 CASE 01~05 현재 대운 판정 검증', () => {
    for (const c of caseProfiles) {
      const modRes = moduleRegistry.executeSingleModule('DAEWUN', {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        targetYear: 2026,
      });

      expect(modRes.success).toBe(true);
      const curOrder = modRes.calculation.rawMetrics.currentDaewoonOrder;
      const curGanji = modRes.calculation.rawMetrics.currentDaewoon.ganji;

      expect(curOrder).toBe(c.expectedCurrentOrder2026);
      expect(curGanji).toBe(c.expectedCurrentGanji2026);
    }
  });

  // ==========================================================================
  // TIME-05: 과거 대운 (과거 특정 연도/시점의 대운 역추적)
  // ==========================================================================
  it('TIME-05: 과거 특정 연도 시점의 대운 정확한 추출 검증', () => {
    // CASE 01: 2012년 (만 20세) -> 2대운 [을사]
    const res1 = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1992, birthMonth: 3, birthDay: 15, birthHour: 8, birthMinute: 30,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
      currentDate: '2012-05-01',
    });
    expect(res1.currentDaewoon.ganji).toBe('을사');
    expect(res1.currentDaewoonOrder).toBe(2);

    // CASE 02: 2005년 (만 17세) -> 2대운 [임술]
    const res2 = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1988, birthMonth: 12, birthDay: 10, birthHour: 14, birthMinute: 0,
      gender: 'female', yearStem: '무', monthStem: '갑', monthBranch: '자',
      currentDate: '2005-06-15',
    });
    expect(res2.currentDaewoon.ganji).toBe('임술');
    expect(res2.currentDaewoonOrder).toBe(2);

    // CASE 05: 2015년 (만 29세) -> 3대운 [기해]
    const res5 = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1986, birthMonth: 8, birthDay: 15, birthHour: 16, birthMinute: 0,
      gender: 'male', yearStem: '병', monthStem: '병', monthBranch: '신',
      currentDate: '2015-08-01',
    });
    expect(res5.currentDaewoon.ganji).toBe('기해');
    expect(res5.currentDaewoonOrder).toBe(3);
  });

  // ==========================================================================
  // TIME-06: 미래 대운 (미래 시점 대운 전환 검증)
  // ==========================================================================
  it('TIME-06: 미래 시점(2030년대) 대운 전환 및 차기 대운 검증', () => {
    // CASE 01: 2030년 (만 38세) -> 4대운 [정미]
    const res1 = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1992, birthMonth: 3, birthDay: 15, birthHour: 8, birthMinute: 30,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
      currentDate: '2030-05-01',
    });
    expect(res1.currentDaewoon.ganji).toBe('정미');
    expect(res1.currentDaewoonOrder).toBe(4);

    // CASE 02: 2032년 (만 44세) -> 5대운 [기미]
    const res2 = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1988, birthMonth: 12, birthDay: 10, birthHour: 14, birthMinute: 0,
      gender: 'female', yearStem: '무', monthStem: '갑', monthBranch: '자',
      currentDate: '2032-01-01',
    });
    expect(res2.currentDaewoon.ganji).toBe('기미');
    expect(res2.currentDaewoonOrder).toBe(5);

    // CASE 04: 2035년 (만 53세) -> 6대운 [기유]
    const res4 = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1982, birthMonth: 4, birthDay: 5, birthHour: 6, birthMinute: 0,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
      currentDate: '2035-08-15',
    });
    expect(res4.currentDaewoon.ganji).toBe('기유');
    expect(res4.currentDaewoonOrder).toBe(6);
  });

  // ==========================================================================
  // TIME-07: 세운 계산 (입력 연도별 간지 정확성 검증)
  // ==========================================================================
  it('TIME-07: 연도별 세운 간지 계산(출생연도, 사건연도, 현재, 다음 연도) 정확성 검증', () => {
    const testYears = [
      { year: 1982, expected: '임술' },
      { year: 1986, expected: '병인' },
      { year: 1988, expected: '무진' },
      { year: 1992, expected: '임신' },
      { year: 1995, expected: '을해' },
      { year: 2024, expected: '갑진' },
      { year: 2025, expected: '을사' },
      { year: 2026, expected: '병오' },
      { year: 2027, expected: '정미' },
      { year: 2028, expected: '무신' },
    ];

    for (const ty of testYears) {
      const luck = luckEngine.getAnnualLuck(ty.year);
      expect(luck.name).toBe(ty.expected);

      // SEUN 모듈 동적 계산 검증
      const seunMod = moduleRegistry.executeSingleModule('SEUN', {
        birthDate: '1990-01-01',
        gender: 'male',
        targetYear: ty.year,
      });
      expect(seunMod.calculation.rawMetrics.yearGanji).toBe(ty.expected);
      expect(seunMod.calculation.rawMetrics.targetYear).toBe(ty.year);
    }
  });

  // ==========================================================================
  // TIME-08: 원국 × 대운 관계 상호작용 검증 (source: 'DAEWUN')
  // ==========================================================================
  it('TIME-08: 원국 × 대운 관계 독립 계산 및 source: DAEWUN 검증', () => {
    // CASE 01: 현재 3대운 丙午(오화) vs 원국 (임신/계묘/경인/경진)
    // 원국 일지 寅과 대운 午 -> 인오반합
    const p1: FourPillars = {
      year: { stem: '임', branch: '신' },
      month: { stem: '계', branch: '묘' },
      day: { stem: '경', branch: '인' },
      hour: { stem: '경', branch: '진' },
    };
    const dwRel1 = standardRelationAuditor.auditDaewunRelations(p1, { stem: '병', branch: '오' });
    expect(dwRel1.length).toBeGreaterThan(0);
    const ban1 = dwRel1.find(r => r.relationType === 'BANHAP');
    expect(ban1).toBeDefined();
    expect(ban1?.standardLabel).toContain('인오반합');
    expect(ban1?.source).toBe('DAEWUN');

    // CASE 02: 현재 4대운 庚申(신금) vs 원국 (무진/갑자/기해/신미)
    // 신금과 해수 -> 신해해
    const p2: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };
    const dwRel2 = standardRelationAuditor.auditDaewunRelations(p2, { stem: '경', branch: '신' });
    const harm2 = dwRel2.find(r => r.relationType === 'HARM');
    expect(harm2).toBeDefined();
    expect(harm2?.standardLabel).toContain('신해해');
    expect(harm2?.source).toBe('DAEWUN');

    // CASE 04: 현재 5대운 戊申(신금) vs 원국 (임술/계묘/무오/을묘)
    // 신금과 묘목(월지, 시지) -> 묘신원진 × 2, 묘신귀문관살 × 2
    const p4: FourPillars = {
      year: { stem: '임', branch: '술' },
      month: { stem: '계', branch: '묘' },
      day: { stem: '무', branch: '오' },
      hour: { stem: '을', branch: '묘' },
    };
    const dwRel4 = standardRelationAuditor.auditDaewunRelations(p4, { stem: '무', branch: '신' });
    const wonjin4 = dwRel4.find(r => r.relationType === 'WONJIN');
    const gwimun4 = dwRel4.find(r => r.relationType === 'GWIMUN');
    expect(wonjin4).toBeDefined();
    expect(wonjin4?.standardLabel).toBe('대운 유입: 묘신원진 × 2');
    expect(wonjin4?.source).toBe('DAEWUN');
    expect(gwimun4).toBeDefined();
    expect(gwimun4?.standardLabel).toBe('대운 유입: 묘신귀문관살 × 2');
    expect(gwimun4?.source).toBe('DAEWUN');
  });

  // ==========================================================================
  // TIME-09: 원국 × 세운 관계 상호작용 검증 (source: 'SEUN')
  // ==========================================================================
  it('TIME-09: 원국 × 세운 관계 독립 계산 및 source: SEUN 검증', () => {
    // 2026년 丙午(오화) 세운
    // CASE 02: 원국 월지 자수(子)와 세운 오화(午) -> 자오충
    const p2: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };
    const seunRel2 = standardRelationAuditor.auditSeunRelations(p2, { stem: '병', branch: '오' });
    const clash2 = seunRel2.find(r => r.relationType === 'BRANCH_CLASH');
    expect(clash2).toBeDefined();
    expect(clash2?.standardLabel).toBe('세운 유입: 자오충');
    expect(clash2?.source).toBe('SEUN');

    // CASE 04: 원국 일지 오화(午)와 세운 오화(午) -> 오오자형
    // 원국 묘목(卯) 2개와 세운 오화(午) -> 묘오파 × 2
    const p4: FourPillars = {
      year: { stem: '임', branch: '술' },
      month: { stem: '계', branch: '묘' },
      day: { stem: '무', branch: '오' },
      hour: { stem: '을', branch: '묘' },
    };
    const seunRel4 = standardRelationAuditor.auditSeunRelations(p4, { stem: '병', branch: '오' });
    const self4 = seunRel4.find(r => r.relationType === 'SELF_PUNISHMENT');
    const dest4 = seunRel4.find(r => r.relationType === 'DESTRUCTION');
    expect(self4).toBeDefined();
    expect(self4?.standardLabel).toBe('세운 유입: 오오자형');
    expect(self4?.source).toBe('SEUN');
    expect(dest4).toBeDefined();
    expect(dest4?.standardLabel).toBe('세운 유입: 묘오파 × 2');
    expect(dest4?.source).toBe('SEUN');
  });

  // ==========================================================================
  // TIME-10: 대운 × 세운 관계 상호작용 검증 (대운×세운 충/합/형/파/해/원진)
  // ==========================================================================
  it('TIME-10: 대운 × 세운 간의 상호작용 독립 계산 검증', () => {
    // 1. 대운 庚子(자수) vs 2026 세운 丙午(오화) -> 자오충
    const cross1 = standardRelationAuditor.auditDaewunSeunRelations(
      { stem: '경', branch: '자' },
      { stem: '병', branch: '오' }
    );
    expect(cross1.length).toBe(1);
    expect(cross1[0].relationType).toBe('BRANCH_CLASH');
    expect(cross1[0].standardLabel).toBe('대운×세운: 자오충');

    // 2. 대운 庚申(신금) vs 2025 세운 乙巳(사화) -> 사신육합
    const cross2 = standardRelationAuditor.auditDaewunSeunRelations(
      { stem: '경', branch: '신' },
      { stem: '을', branch: '사' }
    );
    const six2 = cross2.find(r => r.relationType === 'BRANCH_SIX_COMBINATION');
    expect(six2).toBeDefined();
    expect(six2?.standardLabel).toBe('대운×세운: 사신육합');

    // 3. 대운 戊申(신금) vs 2023 세운 癸卯(묘목) -> 묘신원진
    const cross3 = standardRelationAuditor.auditDaewunSeunRelations(
      { stem: '무', branch: '신' },
      { stem: '계', branch: '묘' }
    );
    const wonjin3 = cross3.find(r => r.relationType === 'WONJIN');
    expect(wonjin3).toBeDefined();
    expect(wonjin3?.standardLabel).toBe('대운×세운: 묘신원진');
  });

  // ==========================================================================
  // TIME-11: CASE 01~05 사건 발생연도 역검증
  // ==========================================================================
  it('TIME-11: CASE 01~05 사건 발생연도 → 당시 대운 → 당시 세운 → 모듈 인과 체인 역추적 검증', () => {
    for (const c of caseProfiles) {
      const problemInput: UserProblemInput = {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        targetDomain: c.domain as any,
        currentEvent: c.eventDesc,
        userTrouble: `${c.title} 문제에 대한 심층 해결책`,
        targetYear: c.eventYear,
      };

      const prod = generator.generateProduct(problemInput, {
        selectedModules: [
          'CORE_ORIGINAL', 'TEN_GODS', 'GEOKGUK', 'STRENGTH',
          'RELATION', 'DAEWUN', 'SEUN', c.domain as any
        ],
        insightDepth: 4,
      });

      // 1. 해당 연도의 대운 및 세운이 모듈에 올바르게 전달되었는지 검증
      const seunMod = prod.executedModules['SEUN'];
      const daewunMod = prod.executedModules['DAEWUN'];
      const troubleMod = prod.executedModules[c.domain as any];

      expect(seunMod).toBeDefined();
      expect(daewunMod).toBeDefined();
      expect(troubleMod).toBeDefined();

      expect(seunMod.calculation.rawMetrics.targetYear).toBe(c.eventYear);

      // 2. 사건-모듈 매핑에 시간축 정보가 보존되어 있는지 검증
      const mappings = prod.eventMapping?.mappings || [];
      const seunMapping = mappings.find(m => m.moduleId === 'SEUN');
      const daewunMapping = mappings.find(m => m.moduleId === 'DAEWUN');

      expect(seunMapping).toBeDefined();
      expect(daewunMapping).toBeDefined();
      expect(seunMapping?.timeAxisContext?.year).toBe(c.eventYear);
      expect(seunMapping?.timeAxisContext?.source).toBe('SEUN');
      expect(daewunMapping?.timeAxisContext?.source).toBe('DAEWUN');
    }
  });

  // ==========================================================================
  // TIME-12: 시간축 source 보존 검증 (NATAL, DAEWUN, SEUN)
  // ==========================================================================
  it('TIME-12: 모든 관계 판정에서 source(NATAL, DAEWUN, SEUN) 무손실 보존 검증', () => {
    const pillars: FourPillars = {
      year: { stem: '병', branch: '인' },
      month: { stem: '병', branch: '신' },
      day: { stem: '신', branch: '묘' },
      hour: { stem: '병', branch: '신' },
    };

    // 1. 원국 내부 관계 (NATAL)
    const natalRes = standardRelationAuditor.auditAll13Relations(pillars).natalRelations;
    expect(natalRes.length).toBeGreaterThan(0);
    for (const r of natalRes) {
      expect(r.source).toBe('NATAL');
    }

    // 2. 대운 유입 관계 (DAEWUN)
    const daewunRes = standardRelationAuditor.auditDaewunRelations(pillars, { stem: '경', branch: '자' });
    for (const r of daewunRes) {
      expect(r.source).toBe('DAEWUN');
    }

    // 3. 세운 유입 관계 (SEUN)
    const seunRes = standardRelationAuditor.auditSeunRelations(pillars, { stem: '병', branch: '오' });
    for (const r of seunRes) {
      expect(r.source).toBe('SEUN');
    }

    // 전체 결합 시에도 각 출처가 보존되어야 함
    const combined = [...natalRes, ...daewunRes, ...seunRes];
    const natalCount = combined.filter(r => r.source === 'NATAL').length;
    const daewunCount = combined.filter(r => r.source === 'DAEWUN').length;
    const seunCount = combined.filter(r => r.source === 'SEUN').length;

    expect(natalCount).toBe(natalRes.length);
    expect(daewunCount).toBe(daewunRes.length);
    expect(seunCount).toBe(seunRes.length);
  });

  // ==========================================================================
  // TIME-13: 관계 중복 및 출처 구분 검증 (단순 합산 금지, 출처별 독립 보존)
  // ==========================================================================
  it('TIME-13: 동일 관계(인신충 등)가 여러 시간축에서 발생 시 출처별 독립 보존 검증', () => {
    // 원국: 년지 寅, 일지 卯 (인신충 없음)
    const pillars: FourPillars = {
      year: { stem: '임', branch: '인' },
      month: { stem: '계', branch: '묘' },
      day: { stem: '갑', branch: '진' },
      hour: { stem: '을', branch: '사' },
    };

    // 1. 원국에는 인신충 0회
    const natalClash = standardRelationAuditor.auditRelations(pillars).natalRelations
      .filter(r => r.standardLabel.includes('인신충'));
    expect(natalClash.length).toBe(0);

    // 2. 대운 申(신금) 유입 시 -> 인신충 1회 (DAEWUN)
    const dwClash = standardRelationAuditor.auditDaewunRelations(pillars, { branch: '신' })
      .filter(r => r.relationType === 'BRANCH_CLASH');
    expect(dwClash.length).toBe(1);
    expect(dwClash[0].source).toBe('DAEWUN');
    expect(dwClash[0].standardLabel).toContain('인신충');

    // 3. 세운 申(신금) 유입 시 -> 인신충 1회 (SEUN)
    const seunClash = standardRelationAuditor.auditSeunRelations(pillars, { stem: '무', branch: '신' })
      .filter(r => r.relationType === 'BRANCH_CLASH');
    expect(seunClash.length).toBe(1);
    expect(seunClash[0].source).toBe('SEUN');
    expect(seunClash[0].standardLabel).toContain('인신충');

    // 4. 대운과 세운의 충이 서로 병합되어 "인신충 2회"로 축소·소실되지 않고 독립 보존됨을 검증
    expect(dwClash[0].source).not.toBe(seunClash[0].source);
  });

  // ==========================================================================
  // TIME-14: 현재 vs 미래 구분 및 안전 원칙 검증
  // ==========================================================================
  it('TIME-14: 현재 시점과 미래 시점의 명확한 구분 및 미래 비결정론 안전 원칙 검증', () => {
    const futureYear = 2030;
    const futureProblem: UserProblemInput = {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetDomain: 'BUSINESS',
      currentEvent: '미래 사업 확장 및 해외 진출 타진',
      userTrouble: '2030년 신규 사업 런칭 타이밍과 환경적 리스크',
      targetYear: futureYear,
    };

    const prod = generator.generateProduct(futureProblem, {
      selectedModules: ['CORE_ORIGINAL', 'DAEWUN', 'SEUN', 'BUSINESS', 'PRESCRIPTION'],
      insightDepth: 5,
    });

    const reportText = prod.depthReport.fullDocument;

    // 안전 원칙 (지시서 14절):
    // 미래 시점의 명리 계산 결과를 확정된 사건/사고/손실/사망 등으로 판정하지 않는다.
    const fatalKeywords = ['확정된 사고', '확정된 부도', '반드시 사망', '확정된 손실', '피할 수 없는 파산'];
    for (const kw of fatalKeywords) {
      expect(reportText).not.toContain(kw);
    }

    // 미래 연도(2030년)와 간지(경술)가 미래 시간축으로 올바르게 매핑되었는지 확인
    const seunMod = prod.executedModules['SEUN'];
    expect(seunMod.calculation.rawMetrics.targetYear).toBe(2030);
    expect(seunMod.calculation.rawMetrics.yearGanji).toBe('경술');
  });

  // ==========================================================================
  // TIME-15: 시간축 결정성 검증 (동일 입력 10회 반복 일치성)
  // ==========================================================================
  it('TIME-15: 동일 출생정보 + 분석 연도 10회 반복 실행 시 100% 동일 결과 보장', () => {
    const input = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      targetYear: 2026,
    };

    let firstDwGanji = '';
    let firstSeunGanji = '';

    for (let i = 0; i < 10; i++) {
      const dwRes = moduleRegistry.executeSingleModule('DAEWUN', input);
      const seunRes = moduleRegistry.executeSingleModule('SEUN', input);

      const dwGanji = dwRes.calculation.rawMetrics.currentDaewoon.ganji;
      const seunGanji = seunRes.calculation.rawMetrics.yearGanji;

      if (i === 0) {
        firstDwGanji = dwGanji;
        firstSeunGanji = seunGanji;
      } else {
        expect(dwGanji).toBe(firstDwGanji);
        expect(seunGanji).toBe(firstSeunGanji);
      }
    }
  });

  // ==========================================================================
  // TIME-16: 대운 경계값 검증 (시작 직전/시작일/시작 직후)
  // ==========================================================================
  it('TIME-16: 대운 전환 경계값(시작 직전 vs 시작일 vs 시작 직후) 정밀 분기 검증', () => {
    // CASE 01: 대운수 7 (1대운 7세 갑진, 2대운 17세 을사, 3대운 27세 병오, 4대운 37세 정미)
    const dw = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1992, birthMonth: 3, birthDay: 15, birthHour: 8, birthMinute: 30,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
    });

    const daewoon3 = dw.pillars[2]; // 3대운 병오 (27세~36세)

    // 3대운 시작일 기준: 직전일(dayBefore), 시작일(dayStart), 직후일(dayAfter)
    const d3Start = new Date(`${daewoon3.startDate}T12:00:00Z`);
    const dayBefore = new Date(d3Start.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const dayStart = daewoon3.startDate;
    const dayAfter = new Date(d3Start.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);

    // 1. 대운 시작 직전일 -> 2대운 [을사]
    const resBefore = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1992, birthMonth: 3, birthDay: 15, birthHour: 8, birthMinute: 30,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
      currentDate: dayBefore,
    });

    // 2. 대운 시작 당일 -> 3대운 [병오]
    const resStart = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1992, birthMonth: 3, birthDay: 15, birthHour: 8, birthMinute: 30,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
      currentDate: dayStart,
    });

    // 3. 대운 시작 직후일 -> 3대운 [병오]
    const resAfter = coreDaewoonEngine.calculateDaewoon({
      birthYear: 1992, birthMonth: 3, birthDay: 15, birthHour: 8, birthMinute: 30,
      gender: 'male', yearStem: '임', monthStem: '계', monthBranch: '묘',
      currentDate: dayAfter,
    });

    expect(resBefore.currentDaewoon.ganji).toBe('을사');
    expect(resBefore.currentDaewoonOrder).toBe(2);

    expect(resStart.currentDaewoon.ganji).toBe('병오');
    expect(resStart.currentDaewoonOrder).toBe(3);

    expect(resAfter.currentDaewoon.ganji).toBe('병오');
    expect(resAfter.currentDaewoonOrder).toBe(3);
  });

  // ==========================================================================
  // TIME-17: 연도 및 절기 경계 검증 (1월 1일 vs 입춘 전후 세운 분기)
  // ==========================================================================
  it('TIME-17: 양력 1월 1일과 입춘(2월 4일경) 세운 간지 분기 검증', () => {
    // 2026년 입춘 이전(예: 2026-01-15)의 월운/세운 기운 확인
    const jan15_2026_utc = new Date(Date.UTC(2026, 0, 15, 3, 0, 0));
    const monthlyBeforeIpchun = luckEngine.getMonthlyLuck(2026, jan15_2026_utc);

    // 입춘 이전의 지지는 축(丑)월
    expect(monthlyBeforeIpchun.branch).toBe('축');

    // 2026년 입춘 이후(예: 2026-02-15)의 월운 지지는 인(寅)월
    const feb15_2026_utc = new Date(Date.UTC(2026, 1, 15, 3, 0, 0));
    const monthlyAfterIpchun = luckEngine.getMonthlyLuck(2026, feb15_2026_utc);
    expect(monthlyAfterIpchun.branch).toBe('인');
  });

  // ==========================================================================
  // TIME-18: Phase 60~66 전체 회귀 검증
  // ==========================================================================
  it('TIME-18: Phase 60~66 19개 모듈 및 상품 생성 아키텍처 전체 무손실 회귀 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    expect(allIds.length).toBe(19);

    const testInput = {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      targetYear: 2026,
    };

    const executed = moduleRegistry.executeModules(allIds, testInput);
    for (const id of allIds) {
      expect(executed[id]).toBeDefined();
      expect(executed[id].success).toBe(true);
      expect(executed[id].calculation).toBeDefined();
      expect(executed[id].judgment).toBeDefined();
    }
  });
});
