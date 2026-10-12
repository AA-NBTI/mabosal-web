/**
 * 24절기 정밀 계산 엔진 (SolarTermEngine)
 * 
 * 원칙 (지시서 지침):
 * 1. 한국 서비스의 절기 판정 기준은 KASI(한국천문연구원) 공식 역서 데이터를 최우선으로 적용합니다.
 * 2. 공식 데이터가 등록되지 않은 연도는 Jean Meeus의 고정밀 천문 계산 알고리즘을 fallback으로 사용합니다.
 * 3. 절기마다 공식값(KASI) / 계산값(Astro) / 차이(diffMinutes) / 최종 적용값을 투명하게 보존합니다.
 */

import { MAJOR_SOLAR_TERMS, SolarTermName } from '../../core/constants.js';
import { getKasiOfficialSolarTerm } from './kasi-solar-terms-table.js';

export interface KSTDateComponents {
  year: number;
  month: number; // 1 ~ 12
  day: number;
  hour: number;
  minute: number;
  second: number;
  formatted: string;
}

export function toKSTComponents(utcDate: Date): KSTDateComponents {
  const kstMillis = utcDate.getTime() + 9 * 3600 * 1000;
  const d = new Date(kstMillis);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const second = d.getUTCSeconds();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    formatted: `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`,
  };
}

export interface SolarTermRecord {
  termName: SolarTermName;
  solarLongitudeDeg: number;
  exactDateTimeUTC: Date;
  kst: KSTDateComponents;
  source: 'kasi_official_table' | 'astronomical_calculation';
  kasiDateTimeKST?: string;
  astronomicalDateTimeKST: string;
  diffMinutes?: number;
  appliedDateTimeKST: string;
}

/**
 * 율리우스일 (Julian Day) 계산 (UT 기준)
 */
export function getJulianDay(date: Date): number {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

/**
 * 특정 율리우스일에서의 태양 겉보기 황경(도 단위, 0~360) 계산
 */
export function getSolarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0; // J2000.0 기준 율리우스 세기

  // 태양의 기하학적 평균 황경 (L0)
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = ((L0 % 360) + 360) % 360;

  // 태양의 평균 근점이각 (M)
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = (M * Math.PI) / 180;

  // 중심차 (C)
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // 태양의 진황경
  const trueLong = L0 + C;

  // 장동(nutation) 및 광행차 보정 (겉보기 황경 lambda)
  const omega = 125.04 - 1934.136 * T;
  const omegaRad = (omega * Math.PI) / 180;
  let lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omegaRad);

  return ((lambda % 360) + 360) % 360;
}

// 24절기별 목표 태양 황경
export const SOLAR_TERM_DEGREES: Record<SolarTermName, number> = {
  춘분: 0,
  청명: 15,
  곡우: 30,
  입하: 45,
  소만: 60,
  망종: 75,
  하지: 90,
  소서: 105,
  대서: 120,
  입추: 135,
  처서: 150,
  백로: 165,
  추분: 180,
  한로: 195,
  상강: 210,
  입동: 225,
  소설: 240,
  대설: 255,
  동지: 270,
  소한: 285,
  대한: 300,
  입춘: 315,
  우수: 330,
  경칩: 345,
};

/**
 * 이분법(Bisection) 및 뉴턴-랩슨 반복으로 목표 황경에 도달하는 정확한 Date 계산
 */
export function findSolarTermDateTime(year: number, targetDeg: number, approxMonth: number, approxDay: number): Date {
  const approxDate = new Date(Date.UTC(year, approxMonth, approxDay, 12, 0, 0));
  let jd = getJulianDay(approxDate);

  for (let iter = 0; iter < 15; iter++) {
    const currentDeg = getSolarLongitude(jd);
    let diff = targetDeg - currentDeg;

    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const dtDays = diff / 0.9856473;
    jd += dtDays;

    if (Math.abs(dtDays * 86400) < 1) {
      break;
    }
  }

  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;

  let alpha = z;
  if (z >= 2299161) {
    const alphaFrac = Math.floor((z - 1867216.25) / 36524.25);
    alpha = z + 1 + alphaFrac - Math.floor(alphaFrac / 4);
  }

  const b = alpha + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const resYear = month > 2 ? c - 4716 : c - 4715;

  const dayInt = Math.floor(day);
  const dayFrac = day - dayInt;
  const totalSeconds = Math.round(dayFrac * 86400);
  const hour = Math.floor(totalSeconds / 3600);
  const min = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;

  return new Date(Date.UTC(resYear, month - 1, dayInt, hour, min, sec));
}

// 절기 대략 일자 맵
const APPROX_TERM_DATES: Record<SolarTermName, { month: number; day: number }> = {
  입춘: { month: 1, day: 4 }, // 2월 4일
  우수: { month: 1, day: 19 },
  경칩: { month: 2, day: 6 },  // 3월 6일
  춘분: { month: 2, day: 21 },
  청명: { month: 3, day: 5 },  // 4월 5일
  곡우: { month: 3, day: 20 },
  입하: { month: 4, day: 5 },  // 5월 5일
  소만: { month: 4, day: 21 },
  망종: { month: 5, day: 6 },  // 6월 6일
  하지: { month: 5, day: 21 },
  소서: { month: 6, day: 7 },  // 7월 7일
  대서: { month: 6, day: 23 },
  입추: { month: 7, day: 7 },  // 8월 7일
  처서: { month: 7, day: 23 },
  백로: { month: 8, day: 8 },  // 9월 8일
  추분: { month: 8, day: 23 },
  한로: { month: 9, day: 8 },  // 10월 8일
  상강: { month: 9, day: 23 },
  입동: { month: 10, day: 7 }, // 11월 7일
  소설: { month: 10, day: 22 },
  대설: { month: 11, day: 7 }, // 12월 7일
  동지: { month: 11, day: 22 },
  소한: { month: 0, day: 6 },  // 1월 6일
  대한: { month: 0, day: 20 },
};

/**
 * 특정 연도의 모든 24절기 계산 (KASI 공식 데이터 우선 + 천문 계산 fallback)
 */
export function getYearSolarTerms(year: number): SolarTermRecord[] {
  const result: SolarTermRecord[] = [];

  for (const [name, deg] of Object.entries(SOLAR_TERM_DEGREES) as [SolarTermName, number][]) {
    const approx = APPROX_TERM_DATES[name];
    const astroUtc = findSolarTermDateTime(year, deg, approx.month, approx.day);
    const astroKst = toKSTComponents(astroUtc);

    const kasiEntry = getKasiOfficialSolarTerm(year, name);
    let finalUtc = astroUtc;
    let source: SolarTermRecord['source'] = 'astronomical_calculation';
    let diffMinutes: number | undefined = undefined;

    if (kasiEntry) {
      finalUtc = kasiEntry.utcDate;
      source = 'kasi_official_table';
      diffMinutes = Math.round((astroUtc.getTime() - kasiEntry.utcDate.getTime()) / 60000);
    }

    const appliedKst = toKSTComponents(finalUtc);

    result.push({
      termName: name,
      solarLongitudeDeg: deg,
      exactDateTimeUTC: finalUtc,
      kst: appliedKst,
      source,
      kasiDateTimeKST: kasiEntry?.kstDateTimeStr,
      astronomicalDateTimeKST: astroKst.formatted,
      diffMinutes,
      appliedDateTimeKST: appliedKst.formatted,
    });
  }

  // KST 시각 기준 오름차순 정렬 (UTC getTime() 기준)
  result.sort((a, b) => a.exactDateTimeUTC.getTime() - b.exactDateTimeUTC.getTime());
  return result;
}

/**
 * 주어진 시각(UTC Date)의 직전 절기와 직후 절기 조회
 */
export function getSurroundingSolarTerms(targetDateUTC: Date): {
  previousTerm: SolarTermRecord;
  nextTerm: SolarTermRecord;
  previousMajorTerm: SolarTermRecord; // 12절 중 직전 절 (월지 결정용)
  nextMajorTerm: SolarTermRecord;     // 12절 중 직후 절
} {
  const kstComp = toKSTComponents(targetDateUTC);
  const year = kstComp.year;

  // 연말/연초 경계를 커버하기 위해 전년, 당해년, 익년 절기 합산
  const terms = [
    ...getYearSolarTerms(year - 1),
    ...getYearSolarTerms(year),
    ...getYearSolarTerms(year + 1),
  ].sort((a, b) => a.exactDateTimeUTC.getTime() - b.exactDateTimeUTC.getTime());

  const targetTime = targetDateUTC.getTime();
  let prevTerm = terms[0];
  let nextTerm = terms[terms.length - 1];

  for (let i = 0; i < terms.length; i++) {
    if (terms[i].exactDateTimeUTC.getTime() <= targetTime) {
      prevTerm = terms[i];
    } else {
      nextTerm = terms[i];
      break;
    }
  }

  // 12절(월지 변경 절) 필터링
  const majorTermNames = new Set(MAJOR_SOLAR_TERMS.map(m => m.term));
  const majorTerms = terms.filter(t => majorTermNames.has(t.termName));

  let prevMajor = majorTerms[0];
  let nextMajor = majorTerms[majorTerms.length - 1];
  for (let i = 0; i < majorTerms.length; i++) {
    if (majorTerms[i].exactDateTimeUTC.getTime() <= targetTime) {
      prevMajor = majorTerms[i];
    } else {
      nextMajor = majorTerms[i];
      break;
    }
  }

  return {
    previousTerm: prevTerm,
    nextTerm: nextTerm,
    previousMajorTerm: prevMajor,
    nextMajorTerm: nextMajor,
  };
}


/**
 * 입춘 시각 구하기 (KASI 공식 테이블 우선 + 천문 계산 fallback)
 */
export function getIpchun(year: number): {
  utcDate: Date;
  kst: KSTDateComponents;
  source: 'kasi_official_table' | 'astronomical_calculation';
  kasiDateTimeKST?: string;
  astronomicalDateTimeKST: string;
  diffMinutes?: number;
  appliedDateTimeKST: string;
} {
  const approx = APPROX_TERM_DATES['입춘'];
  const astroUtc = findSolarTermDateTime(year, 315, approx.month, approx.day);
  const astroKst = toKSTComponents(astroUtc);

  const kasiEntry = getKasiOfficialSolarTerm(year, '입춘');
  let finalUtc = astroUtc;
  let source: 'kasi_official_table' | 'astronomical_calculation' = 'astronomical_calculation';
  let diffMinutes: number | undefined = undefined;

  if (kasiEntry) {
    finalUtc = kasiEntry.utcDate;
    source = 'kasi_official_table';
    diffMinutes = Math.round((astroUtc.getTime() - kasiEntry.utcDate.getTime()) / 60000);
  }

  const appliedKst = toKSTComponents(finalUtc);

  return {
    utcDate: finalUtc,
    kst: appliedKst,
    source,
    kasiDateTimeKST: kasiEntry?.kstDateTimeStr,
    astronomicalDateTimeKST: astroKst.formatted,
    diffMinutes,
    appliedDateTimeKST: appliedKst.formatted,
  };
}
