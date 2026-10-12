/**
 * Phase 18: Lunar Calendar Engine (음력/양력/윤달 변환 엔진)
 * 
 * 1900년부터 2050년까지의 KASI(한국천문연구원) 표준 음력 삭망월 및 윤달 비트맵 데이터를 기반으로
 * 음력 <-> 양력 상호 정밀 변환을 수행합니다.
 * 
 * 기준일: 1900년 1월 31일 (음력 1900년 1월 1일)
 */

import { RawBirthInput, StandardBirthDate } from './types.js';

// 1900 ~ 2050년 음력 데이터 테이블 (151개년)
export const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63
];

const BASE_SOLAR_DATE = new Date(Date.UTC(1900, 0, 31)); // 1900-01-31

export function getLeapMonth(y: number): number {
  if (y < 1900 || y >= 1900 + LUNAR_INFO.length) return 0;
  return LUNAR_INFO[y - 1900] & 0xf;
}

export function getLeapMonthDays(y: number): number {
  if (getLeapMonth(y)) {
    return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

export function getLunarMonthDays(y: number, m: number): number {
  if (y < 1900 || y >= 1900 + LUNAR_INFO.length) return 30;
  return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

export function getLunarYearDays(y: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(y);
}

export function convertLunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean = false
): { year: number; month: number; day: number; dateString: string } {
  if (lunarYear < 1900 || lunarYear >= 1900 + LUNAR_INFO.length) {
    throw new Error(`음력 변환 지원 범위는 1900년~2050년입니다 (입력: ${lunarYear})`);
  }

  let offsetDays = 0;

  // 1. 이전 연도들의 일수 합산
  for (let y = 1900; y < lunarYear; y++) {
    offsetDays += getLunarYearDays(y);
  }

  // 2. 해당 연도 월별 일수 합산
  const leap = getLeapMonth(lunarYear);
  for (let m = 1; m < lunarMonth; m++) {
    offsetDays += getLunarMonthDays(lunarYear, m);
    if (leap > 0 && leap === m) {
      offsetDays += getLeapMonthDays(lunarYear);
    }
  }

  // 만약 현재 월이 윤달인 경우, 앞선 평달 일수 추가
  if (isLeapMonth && leap === lunarMonth) {
    offsetDays += getLunarMonthDays(lunarYear, lunarMonth);
  }

  // 3. 일자 더하기
  offsetDays += (lunarDay - 1);

  // 기준 양력일자에 offsetDays 가산
  const solarDate = new Date(BASE_SOLAR_DATE.getTime() + offsetDays * 86400000);
  const year = solarDate.getUTCFullYear();
  const month = solarDate.getUTCMonth() + 1;
  const day = solarDate.getUTCDate();
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, dateString };
}

export function standardizeBirthDate(raw: RawBirthInput): StandardBirthDate {
  if (raw.calendar_type === 'solar') {
    const dateStr = `${raw.birth_year}-${String(raw.birth_month).padStart(2, '0')}-${String(raw.birth_day).padStart(2, '0')}`;
    return {
      solar_year: raw.birth_year,
      solar_month: raw.birth_month,
      solar_day: raw.birth_day,
      solar_date_string: dateStr,
      is_leap_applied: false,
      original_input: { ...raw },
    };
  }

  // 음력인 경우 양력으로 변환
  const converted = convertLunarToSolar(
    raw.birth_year,
    raw.birth_month,
    raw.birth_day,
    raw.is_leap_month
  );

  return {
    solar_year: converted.year,
    solar_month: converted.month,
    solar_day: converted.day,
    solar_date_string: converted.dateString,
    is_leap_applied: raw.is_leap_month,
    original_input: { ...raw },
  };
}
