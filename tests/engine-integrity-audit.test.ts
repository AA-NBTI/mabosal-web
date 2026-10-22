import { describe, it, expect } from 'vitest';
import { standardizeBirthDate } from '../src/modules/phase17_25/lunar-calendar.js';
import { LifeAnalysisWarehouseBuilder } from '../src/modules/life-analysis/life-analysis-warehouse.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { daewoonEngine } from '../src/modules/saju-core/daewoon-engine.js';

interface TestCase {
  id: number;
  type: string;
  year: number;
  month: number;
  day: number;
  time: string;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  isLeapMonth?: boolean;
}

const TEST_CASES: TestCase[] = [
  { id: 1, type: '양력 일반 女 (순행)', year: 1998, month: 4, day: 12, time: '09:20', gender: 'female', calendarType: 'solar' },
  { id: 2, type: '양력 일반 男 (순행)', year: 1985, month: 2, day: 15, time: '14:30', gender: 'male', calendarType: 'solar' },
  { id: 3, type: '음력 평달 男 (사용자 케이스, 역행)', year: 1975, month: 11, day: 2, time: '23:40', gender: 'male', calendarType: 'lunar' },
  { id: 4, type: '음력 평달 女 (순행)', year: 1992, month: 6, day: 15, time: '10:30', gender: 'female', calendarType: 'lunar' },
  { id: 5, type: '음력 윤달 男 (1984년 윤달)', year: 1984, month: 10, day: 15, time: '14:00', gender: 'male', calendarType: 'lunar', isLeapMonth: true },
  { id: 6, type: '음력 윤달 女 (1995년 윤달)', year: 1995, month: 8, day: 20, time: '18:20', gender: 'female', calendarType: 'lunar', isLeapMonth: true },
  { id: 7, type: '자시 23:35 경계 男 (조자시)', year: 1988, month: 3, day: 20, time: '23:35', gender: 'male', calendarType: 'solar' },
  { id: 8, type: '자시 00:25 초입 女', year: 2000, month: 7, day: 7, time: '00:25', gender: 'female', calendarType: 'solar' },
  { id: 9, type: '24절기 교입 당일 女 (입춘 직후)', year: 2026, month: 2, day: 4, time: '05:00', gender: 'female', calendarType: 'solar' },
  { id: 10, type: '24절기 교입 당일 男 (대설 당일)', year: 1980, month: 12, day: 7, time: '08:15', gender: 'male', calendarType: 'solar' },
];

describe('[통제 규정 준수] 사주 엔진 vs 백세인생 창고 10대 극한 케이스 전수조사', () => {
  const warehouseBuilder = new LifeAnalysisWarehouseBuilder();
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();

  TEST_CASES.forEach(tc => {
    it(`Case #${tc.id} [${tc.type}] ${tc.year}-${tc.month}-${tc.day} ${tc.time} (${tc.gender}, ${tc.calendarType})`, () => {
      // 1. 마보살 정규 기준 엔진 (Ground Truth)
      const std = standardizeBirthDate({
        calendar_type: tc.calendarType,
        is_leap_month: tc.isLeapMonth || false,
        birth_year: tc.year,
        birth_month: tc.month,
        birth_day: tc.day,
        birth_time: tc.time,
        is_time_unknown: false,
        gender: tc.gender,
        birth_city: '서울',
      });

      const calRes = calEngine.execute({
        birth_date: std.solar_date_string,
        birth_time: tc.time,
        region: '서울',
      });
      const pilRes = pilEngine.execute(calRes.data);
      const gtFour = pilRes.data.four_pillars;

      const [bHour, bMin] = tc.time.split(':').map(Number);
      const gtDw = daewoonEngine.calculateDaewoon({
        birthYear: std.solar_year,
        birthMonth: std.solar_month,
        birthDay: std.solar_day,
        birthHour: bHour,
        birthMinute: bMin,
        gender: tc.gender,
        yearStem: gtFour.year.stem,
        monthStem: gtFour.month.stem,
        monthBranch: gtFour.month.branch,
        currentYear: 2026,
      });

      // 2. 백세인생 창고 엔진 실행
      const wh = warehouseBuilder.buildWarehouse({
        birthYear: tc.year,
        birthMonth: tc.month,
        birthDay: tc.day,
        birthTimeRaw: tc.time,
        gender: tc.gender,
        calendarType: tc.calendarType,
        isLeapMonth: tc.isLeapMonth,
      });

      const whPillars = wh.natalLayer.pillars;
      const whDw = wh.daewoonLayer;

      // 3. 기계적 1:1 필드 Diff 전수 검증
      // (1) 년주 일치 검증
      expect(`${whPillars[0].stem}${whPillars[0].branch}`).toBe(`${gtFour.year.stem}${gtFour.year.branch}`);
      // (2) 월주 일치 검증 (절기 및 음양력 변환 무결성)
      expect(`${whPillars[1].stem}${whPillars[1].branch}`).toBe(`${gtFour.month.stem}${gtFour.month.branch}`);
      // (3) 일주 일치 검증
      expect(`${whPillars[2].stem}${whPillars[2].branch}`).toBe(`${gtFour.day.stem}${gtFour.day.branch}`);
      // (4) 대운수 일치 검증
      expect(whDw.daewoonNumber).toBe(gtDw.daewoonNumber);
      // (5) 대운 순역 방향 일치 검증
      expect(whDw.direction).toBe(gtDw.direction);
      // (6) 제1대운 간지 일치 검증
      expect(whDw.records[0].ganji).toBe(gtDw.pillars[0].ganji);
      // (7) 현재 대운 순번 일치 검증
      expect(whDw.currentDaewoonOrder).toBe(gtDw.currentDaewoonOrder);
    });
  });
});
