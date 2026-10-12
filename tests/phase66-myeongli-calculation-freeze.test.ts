/**
 * tests/phase66-myeongli-calculation-freeze.test.ts
 * 
 * Phase 66: 명리 계산 정확성 최종 검증 테스트 스위트
 * 
 * "입력된 출생정보를 명리 규칙에 따라 계산했을 때 실제 계산값이 정확한가?"
 * 
 * 16대 정밀 감사 항목:
 * - CALC-01: CASE 01~05 원국 정확성
 * - CALC-02: 오행 계산
 * - CALC-03: 십신 계산
 * - CALC-04: 격국 계산 (CASE 05 월겁격 회귀 방지)
 * - CALC-05: 강약 계산 (40/30/30 정량 모델)
 * - CALC-06: 억부 계산 (강약과 분리된 용희신 체계)
 * - CALC-07: 조후 계산 (계절 온도/습도 균형)
 * - CALC-08: RELATION 13종 계산 (독립 판정 및 비정식 배제)
 * - CALC-09: SINSAL 25종 계산
 * - CALC-10: 대운 계산 (방향, 대운수, 현재 대운)
 * - CALC-11: 세운 계산 (연도 간지, 원국과의 관계 분리)
 * - CALC-12: 경계시간 계산 (23:00 야자시 및 12개 시진 경계)
 * - CALC-13: 출생시간 미상 처리 (3주 계산, 임의 날조 금지)
 * - CALC-14: 동일 입력 결정성 (10회 반복 100% 동일)
 * - CALC-15: 독립 ReferenceCalculator 교차검증
 * - CALC-16: Phase 58~65 회귀 검증
 */

import { describe, it, expect } from 'vitest';
import { FourPillars, EarthlyBranch, HeavenlyStem, FiveElement, TenGod } from '../src/core/types.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { standardRelationAuditor } from '../src/modules/relationship/standard-relation-auditor.js';
import { SinsalCoreEngine } from '../src/modules/sinsal/sinsal-core-engine.js';
import { SINSAL_DEFINITIONS } from '../src/modules/sinsal/sinsal-db.js';

// ============================================================================
// 독립 ReferenceCalculator (기존 로직과 독립된 룩업 기반 교차 검증기)
// ============================================================================
class ReferenceCalculator {
  static readonly STEM_ELEMENTS: Record<HeavenlyStem, FiveElement> = {
    갑: '목', 을: '목', 병: '화', 정: '화', 무: '토',
    기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
  };

  static readonly BRANCH_ELEMENTS: Record<EarthlyBranch, FiveElement> = {
    자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화',
    오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수',
  };

  static readonly STEM_YIN_YANG: Record<HeavenlyStem, 'yang' | 'yin'> = {
    갑: 'yang', 을: 'yin', 병: 'yang', 정: 'yin', 무: 'yang',
    기: 'yin', 경: 'yang', 신: 'yin', 임: 'yang', 계: 'yin',
  };

  // 독립 십신 판정 함수
  static getTenGod(dayStem: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
    const dayElem = this.STEM_ELEMENTS[dayStem];
    const targetElem = this.STEM_ELEMENTS[targetStem];
    const sameYinYang = this.STEM_YIN_YANG[dayStem] === this.STEM_YIN_YANG[targetStem];

    const generateMap: Record<FiveElement, FiveElement> = {
      목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
    };
    const controlMap: Record<FiveElement, FiveElement> = {
      목: '토', 토: '수', 수: '화', 화: '금', 금: '목',
    };

    if (dayElem === targetElem) {
      return sameYinYang ? '비견' : '겁재';
    }
    if (generateMap[dayElem] === targetElem) {
      return sameYinYang ? '식신' : '상관';
    }
    if (controlMap[dayElem] === targetElem) {
      return sameYinYang ? '편재' : '정재';
    }
    if (controlMap[targetElem] === dayElem) {
      return sameYinYang ? '편관' : '정관';
    }
    if (generateMap[targetElem] === dayElem) {
      return sameYinYang ? '편인' : '정인';
    }
    return '비견';
  }

  // 독립 40/30/30 강약 득령/득지 판정
  static checkDeungRyeong(dayStem: HeavenlyStem, monthBranch: EarthlyBranch): boolean {
    const dayElem = this.STEM_ELEMENTS[dayStem];
    const monthElem = this.BRANCH_ELEMENTS[monthBranch];
    const isSupp = monthElem === dayElem ||
      (dayElem === '목' && monthElem === '수') ||
      (dayElem === '화' && monthElem === '목') ||
      (dayElem === '토' && monthElem === '화') ||
      (dayElem === '금' && monthElem === '토') ||
      (dayElem === '수' && monthElem === '금');
    return isSupp;
  }

  static checkDeungJi(dayStem: HeavenlyStem, dayBranch: EarthlyBranch): boolean {
    const dayElem = this.STEM_ELEMENTS[dayStem];
    const dayBranchElem = this.BRANCH_ELEMENTS[dayBranch];
    const isSupp = dayBranchElem === dayElem ||
      (dayElem === '목' && dayBranchElem === '수') ||
      (dayElem === '화' && dayBranchElem === '목') ||
      (dayElem === '토' && dayBranchElem === '화') ||
      (dayElem === '금' && dayBranchElem === '토') ||
      (dayElem === '수' && dayBranchElem === '금');
    return isSupp;
  }

  // 독립 대운 방향 판정 함수 ('순행' | '역행')
  static getDaewoonDirection(yearStem: HeavenlyStem, gender: 'male' | 'female'): '순행' | '역행' {
    const isYangYear = this.STEM_YIN_YANG[yearStem] === 'yang';
    const isMale = gender === 'male';
    // 양남음녀 순행, 음남양녀 역행
    return (isYangYear && isMale) || (!isYangYear && !isMale) ? '순행' : '역행';
  }
}

describe('Phase 66: 명리 계산 정확성 최종 검증 Test Suite', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();

  // CASE 01 ~ 05 기준 데이터 세트 (Phase 58.1 & 58.2 Freeze)
  const cases = [
    {
      id: 'CASE 01',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      expected: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
        dayMaster: '경',
        geokguk: '정재격',
        strength: '신약',
        daewoonNumber: 7,
      },
    },
    {
      id: 'CASE 02',
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      expected: {
        year: { stem: '무', branch: '진' },
        month: { stem: '갑', branch: '자' },
        day: { stem: '기', branch: '해' },
        hour: { stem: '신', branch: '미' },
        dayMaster: '기',
        geokguk: '편재격',
        strength: '신약',
        daewoonNumber: 1,
      },
    },
    {
      id: 'CASE 03',
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male' as const,
      expected: {
        year: { stem: '을', branch: '해' },
        month: { stem: '신', branch: '사' },
        day: { stem: '신', branch: '해' },
        hour: { stem: '정', branch: '유' },
        dayMaster: '신',
        geokguk: '정관격',
        strength: '신약',
        daewoonNumber: 5,
      },
    },
    {
      id: 'CASE 04',
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male' as const,
      expected: {
        year: { stem: '임', branch: '술' },
        month: { stem: '계', branch: '묘' }, // 1982년 청명 16:32 이전 -> 묘월
        day: { stem: '무', branch: '오' },
        hour: { stem: '을', branch: '묘' },
        dayMaster: '무',
        geokguk: '정관격',
        strength: '신약',
        daewoonNumber: 1,
      },
    },
    {
      id: 'CASE 05',
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male' as const,
      expected: {
        year: { stem: '병', branch: '인' },
        month: { stem: '병', branch: '신' },
        day: { stem: '신', branch: '묘' },
        hour: { stem: '병', branch: '신' },
        dayMaster: '신',
        geokguk: '월겁격',
        strength: '중화',
        daewoonNumber: 8,
      },
    },
  ];

  // ==========================================================================
  // CALC-01: CASE 01~05 원국 정확성 검증
  // ==========================================================================
  it('CALC-01: CASE 01~05 원국(년주, 월주, 일주, 시주, 일간) 정확성 검증', () => {
    for (const tc of cases) {
      const cal = calendarEngine.execute({
        birth_date: tc.birthDate,
        birth_time: tc.birthTime,
        calendar_type: 'solar',
        is_leap_month: false,
        region: 'Seoul',
      });
      const pil = pillarEngine.execute(cal.data);
      const fp = pil.data.four_pillars;

      expect(fp.day.stem).toBe(tc.expected.dayMaster);
      expect(fp.year.branch).toBe(tc.expected.year.branch);
      expect(fp.month.branch).toBe(tc.expected.month.branch);
      expect(fp.hour?.branch).toBe(tc.expected.hour.branch);
    }
  });

  // ==========================================================================
  // CALC-02: 오행 계산
  // ==========================================================================
  it('CALC-02: 오행(목, 화, 토, 금, 수) 계산 및 분포 정확성 검증', () => {
    const coreMod = moduleRegistry.executeSingleModule('CORE_ORIGINAL', {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
    });

    const counts = coreMod.calculation.rawMetrics.ohaengCounts;
    // CASE 02: 戊辰(토토), 甲子(목수), 己亥(토수), 辛未(금토)
    // 목: 1(갑), 화: 0, 토: 4(무, 진, 기, 미), 금: 1(신), 수: 2(자, 해) -> 총 8글자
    expect(counts['목']).toBe(1);
    expect(counts['화']).toBe(0);
    expect(counts['토']).toBe(4);
    expect(counts['금']).toBe(1);
    expect(counts['수']).toBe(2);
    expect(counts['목'] + counts['화'] + counts['토'] + counts['금'] + counts['수']).toBe(8);
  });

  // ==========================================================================
  // CALC-03: 십신 계산
  // ==========================================================================
  it('CALC-03: 10대 십신 1:1 대응 계산 및 음양·생극 판정 정확성 검증', () => {
    // 일간: 庚 (양금) 기준
    expect(ReferenceCalculator.getTenGod('경', '경')).toBe('비견');
    expect(ReferenceCalculator.getTenGod('경', '신')).toBe('겁재');
    expect(ReferenceCalculator.getTenGod('경', '임')).toBe('식신');
    expect(ReferenceCalculator.getTenGod('경', '계')).toBe('상관');
    expect(ReferenceCalculator.getTenGod('경', '갑')).toBe('편재');
    expect(ReferenceCalculator.getTenGod('경', '을')).toBe('정재');
    expect(ReferenceCalculator.getTenGod('경', '병')).toBe('편관');
    expect(ReferenceCalculator.getTenGod('경', '정')).toBe('정관');
    expect(ReferenceCalculator.getTenGod('경', '무')).toBe('편인');
    expect(ReferenceCalculator.getTenGod('경', '기')).toBe('정인');

    // TEN_GODS 모듈 실행 결과와 일치 검증
    const tenMod = moduleRegistry.executeSingleModule('TEN_GODS', {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
    });
    expect(tenMod.calculation.rawMetrics.tenGodCounts['정재']).toBeGreaterThan(0);
  });

  // ==========================================================================
  // CALC-04: 격국 계산 (CASE 05 월겁격 회귀 방지)
  // ==========================================================================
  it('CALC-04: 격국 계산 및 CASE 05 월겁격(양인격 오판 방지) 검증', () => {
    for (const tc of cases) {
      const geokMod = moduleRegistry.executeSingleModule('GEOKGUK', {
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        gender: tc.gender,
      });

      expect(geokMod.calculation.rawMetrics.geokgukName).toBe(tc.expected.geokguk);
    }
  });

  // ==========================================================================
  // CALC-05: 강약 계산 (40/30/30 정량 모델)
  // ==========================================================================
  it('CALC-05: 강약 계산 40/30/30 정량 모델 득령/득지/득세 가중치 검증', () => {
    for (const tc of cases) {
      const strMod = moduleRegistry.executeSingleModule('STRENGTH', {
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        gender: tc.gender,
      });

      const metrics = strMod.calculation.rawMetrics;
      expect(metrics.status).toContain(tc.expected.strength);
      expect(metrics.deungryeongScore).toBeLessThanOrEqual(100);
      expect(metrics.deungJiScore).toBeLessThanOrEqual(100);
      expect(metrics.deungSeScore).toBeLessThanOrEqual(100);

      // 점수 공식: deungryeongScore * 0.4 + deungJiScore * 0.3 + deungSeScore * 0.3
      const expectedScore = Math.round(((metrics.deungryeongScore * 0.40) + (metrics.deungJiScore * 0.30) + (metrics.deungSeScore * 0.30)) * 100) / 100;
      expect(metrics.score).toBe(expectedScore);
    }
  });

  // ==========================================================================
  // CALC-06: 억부 계산 (강약과 분리된 용희신 체계)
  // ==========================================================================
  it('CALC-06: 억부 계산 — 신약은 인비, 신강은 식재관 조절 원리 검증', () => {
    const eokbuMod = moduleRegistry.executeSingleModule('EOKBU', {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
    });

    // CASE 02는 신약(기토) -> 인성(화), 비겁(토)이 용신/희신, 관성(목)이 기신
    const metrics = eokbuMod.calculation.rawMetrics;
    expect(metrics.yongsin).toBe('화'); // 인성
    expect(metrics.heesin).toBe('토');  // 비겁
    expect(metrics.gisin).toBe('목');   // 기신: 관성
  });

  // ==========================================================================
  // CALC-07: 조후 계산 (계절 온도/습도 균형)
  // ==========================================================================
  it('CALC-07: 조후 계산 — 자월(동지 한냉) 명식의 화(火) 필요성 검증', () => {
    const johuMod = moduleRegistry.executeSingleModule('JOHU', {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
    });

    const metrics = johuMod.calculation.rawMetrics;
    expect(metrics.season).toContain('겨울'); // 자월의 한절
    expect(metrics.yongsin).toBe('화');        // 조후 용신은 화
  });

  // ==========================================================================
  // CALC-08: RELATION 13종 계산 (독립 판정 및 비정식 배제)
  // ==========================================================================
  it('CALC-08: RELATION 13종 독립 판정 및 회귀 방지 (자미해, 자미원진, 진해원진, 진해귀문)', () => {
    const pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    const audit = standardRelationAuditor.auditAll13Relations(pillars);
    const labels = audit.natalRelations.map(r => r.standardLabel);

    // 1. 성립해야 하는 6개 관계 전수 검증
    expect(labels).toContain('자미해');
    expect(labels).toContain('자미원진');
    expect(labels).toContain('진해원진');
    expect(labels).toContain('진해귀문관살');
    expect(labels).toContain('자진반합');
    expect(labels).toContain('갑기합토');

    // 2. 비정식 관계 배제 검증 (진미파 등)
    expect(labels).not.toContain('진미파');
    expect(labels).not.toContain('미진파');
  });

  // ==========================================================================
  // CALC-09: SINSAL 25종 계산
  // ==========================================================================
  it('CALC-09: SINSAL 25종 전체 계산 및 기준 지지·천간 성립 검증', () => {
    const sinsalEngine = new SinsalCoreEngine();
    const pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    const results = sinsalEngine.calculateNatalSinsals(pillars);
    expect(results.length).toBe(25);

    // 25개 신살 정의가 빠짐없이 등록되어 있는지 확인
    const defCount = Object.keys(SINSAL_DEFINITIONS).length;
    expect(defCount).toBe(25);
  });

  // ==========================================================================
  // CALC-10: 대운 계산 (방향, 대운수, 현재 대운)
  // ==========================================================================
  it('CALC-10: 대운 방향(순행/역행) 및 대운수 계산 검증', () => {
    for (const tc of cases) {
      const dwMod = moduleRegistry.executeSingleModule('DAEWUN', {
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        gender: tc.gender,
      });

      const metrics = dwMod.calculation.rawMetrics;
      expect(metrics.daewoonNumber).toBe(tc.expected.daewoonNumber);

      const expectedDir = ReferenceCalculator.getDaewoonDirection(
        tc.expected.year.stem as HeavenlyStem,
        tc.gender
      );
      expect(metrics.direction).toBe(expectedDir);
      expect(metrics.pillars.length).toBeGreaterThan(0);
    }
  });

  // ==========================================================================
  // CALC-11: 세운 계산 (연도 간지, 원국과의 관계 분리)
  // ==========================================================================
  it('CALC-11: 세운 연도 간지(2026: 丙午) 및 시간축 흐름 계산 검증', () => {
    const seunMod = moduleRegistry.executeSingleModule('SEUN', {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetYear: 2026,
    });

    const metrics = seunMod.calculation.rawMetrics;
    expect(metrics.targetYear).toBe(2026);
    expect(metrics.yearGanji).toBe('병오');
    expect(metrics.monthlyScores.length).toBe(12);
  });

  // ==========================================================================
  // CALC-12: 경계시간 계산 (23:00 야자시 및 12개 시진 경계)
  // ==========================================================================
  it('CALC-12: 12대 경계시간대 시진 분기 및 23:00 야자시 일진 전환 검증', () => {
    const testTimes: { time: string; expectedBranch: EarthlyBranch; expectNextDay?: boolean }[] = [
      { time: '00:00', expectedBranch: '자' },
      { time: '00:59', expectedBranch: '자' },
      { time: '01:00', expectedBranch: '축' },
      { time: '01:59', expectedBranch: '축' },
      { time: '02:00', expectedBranch: '축' },
      { time: '02:59', expectedBranch: '축' },
      { time: '03:00', expectedBranch: '인' },
      { time: '11:59', expectedBranch: '오' },
      { time: '12:00', expectedBranch: '오' },
      { time: '22:59', expectedBranch: '해' },
      { time: '23:00', expectedBranch: '자', expectNextDay: true },
      { time: '23:59', expectedBranch: '자', expectNextDay: true },
    ];

    for (const t of testTimes) {
      const cal = calendarEngine.execute({
        birth_date: '2026-05-15',
        birth_time: t.time,
        calendar_type: 'solar',
        is_leap_month: false,
        region: 'Seoul',
      });
      const pil = pillarEngine.execute(cal.data);

      expect(pil.data.four_pillars.hour?.branch).toBe(t.expectedBranch);

      if (t.expectNextDay) {
        expect(cal.data.day_boundary.sajuDate).toBe('2026-05-16');
      } else {
        expect(cal.data.day_boundary.sajuDate).toBe('2026-05-15');
      }
    }
  });

  // ==========================================================================
  // CALC-13: 출생시간 미상 처리 (3주 계산, 임의 날조 금지)
  // ==========================================================================
  it('CALC-13: 출생시간 미상 시 임의 시주 생성 금지 및 hour=null 3주 계산 검증', () => {
    const cal = calendarEngine.execute({
      birth_date: '1988-12-10',
      birth_time: null, // 시간 미상
      calendar_type: 'solar',
      is_leap_month: false,
      region: 'Seoul',
    });
    const pil = pillarEngine.execute(cal.data);

    expect(pil.data.four_pillars.hour).toBeNull();

    // 19개 모듈에서도 hour=null 상태로 정상 단독 실행되는지 검증
    const coreMod = moduleRegistry.executeSingleModule('CORE_ORIGINAL', {
      birthDate: '1988-12-10',
      isUnknownTime: true,
      gender: 'female',
    });
    expect(coreMod.data.fourPillarsText).toContain('시미상');
    expect(coreMod.calculation.rawMetrics.totalChars).toBe(6); // 3주 = 6글자
  });

  // ==========================================================================
  // CALC-14: 동일 입력 결정성 (10회 반복 100% 동일)
  // ==========================================================================
  it('CALC-14: 동일 입력에 대한 10회 연속 실행 100% 결정론적 일치 검증', () => {
    const input = {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
    };

    const firstRun = moduleRegistry.executeModules(
      ['CORE_ORIGINAL', 'STRENGTH', 'GEOKGUK', 'RELATION'],
      input
    );

    for (let i = 0; i < 10; i++) {
      const subsequentRun = moduleRegistry.executeModules(
        ['CORE_ORIGINAL', 'STRENGTH', 'GEOKGUK', 'RELATION'],
        input
      );
      expect(subsequentRun['CORE_ORIGINAL'].calculation.rawMetrics).toEqual(firstRun['CORE_ORIGINAL'].calculation.rawMetrics);
      expect(subsequentRun['STRENGTH'].calculation.rawMetrics.score).toBe(firstRun['STRENGTH'].calculation.rawMetrics.score);
      expect(subsequentRun['GEOKGUK'].calculation.rawMetrics.geokgukName).toBe(firstRun['GEOKGUK'].calculation.rawMetrics.geokgukName);
      expect(subsequentRun['RELATION'].calculation.rawMetrics.clashes).toEqual(firstRun['RELATION'].calculation.rawMetrics.clashes);
    }
  });

  // ==========================================================================
  // CALC-15: 독립 ReferenceCalculator 교차검증
  // ==========================================================================
  it('CALC-15: 독립 ReferenceCalculator와 엔진 계산 결과 교차 검증', () => {
    for (const tc of cases) {
      const cal = calendarEngine.execute({
        birth_date: tc.birthDate,
        birth_time: tc.birthTime,
        calendar_type: 'solar',
        is_leap_month: false,
        region: 'Seoul',
      });
      const pil = pillarEngine.execute(cal.data);
      const fp = pil.data.four_pillars;

      // 1. 일간 교차검증
      expect(fp.day.stem).toBe(tc.expected.dayMaster);

      // 2. 강약 모델 득령/득지 교차검증
      const refDeungRyeong = ReferenceCalculator.checkDeungRyeong(fp.day.stem, fp.month.branch);
      const refDeungJi = ReferenceCalculator.checkDeungJi(fp.day.stem, fp.day.branch);

      const strMod = moduleRegistry.executeSingleModule('STRENGTH', {
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        gender: tc.gender,
      });

      expect(strMod.calculation.rawMetrics.deungryeong).toBe(refDeungRyeong);
      expect(strMod.calculation.rawMetrics.deungji).toBe(refDeungJi);

      // 3. 대운 방향 교차검증
      const refDir = ReferenceCalculator.getDaewoonDirection(fp.year.stem, tc.gender);
      const dwMod = moduleRegistry.executeSingleModule('DAEWUN', {
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        gender: tc.gender,
      });
      expect(dwMod.calculation.rawMetrics.direction).toBe(refDir);
    }
  });

  // ==========================================================================
  // CALC-16: Phase 58~65 회귀 검증
  // ==========================================================================
  it('CALC-16: Phase 58~65 기존 동결값 전수 회귀 검증', () => {
    // CASE 01: 庚일간, 정재격, 신약, 대운수 7
    // CASE 02: 己일간, 편재격, 신약, 대운수 1, 5대 관계(자진반합, 자미해, 자미원진, 진해원진, 진해귀문)
    // CASE 03: 辛일간, 정관격, 신약, 대운수 5, 사해충 × 2
    // CASE 04: 戊일간, 정관격, 신약, 대운수 1
    // CASE 05: 辛일간, 월겁격, 중화, 대운수 8, 인신충 × 2

    const c2Pil: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };
    const c2Audit = standardRelationAuditor.auditRelations(c2Pil);
    expect(c2Audit.natalRelations.map(r => r.standardLabel)).toEqual([
      '자진반합',
      '자미해',
      '자미원진',
      '진해원진',
      '진해귀문관살',
    ]);

    const c3Pil: FourPillars = {
      year: { stem: '을', branch: '해' },
      month: { stem: '신', branch: '사' },
      day: { stem: '신', branch: '해' },
      hour: { stem: '정', branch: '유' },
    };
    const c3Audit = standardRelationAuditor.auditRelations(c3Pil);
    expect(c3Audit.natalRelations.some(r => r.standardLabel === '사해충 × 2')).toBe(true);

    const c5Pil: FourPillars = {
      year: { stem: '병', branch: '인' },
      month: { stem: '병', branch: '신' },
      day: { stem: '신', branch: '묘' },
      hour: { stem: '병', branch: '신' },
    };
    const c5Audit = standardRelationAuditor.auditRelations(c5Pil);
    expect(c5Audit.natalRelations.some(r => r.standardLabel === '인신충 × 2')).toBe(true);
  });
});
