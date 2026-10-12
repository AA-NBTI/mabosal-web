/**
 * AnnualMonthlyDailyEngine: 세운(歲運), 월운(月運), 일운(日運) 간지 생성 모듈
 */

import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  MAJOR_SOLAR_TERMS,
  MONTH_BRANCH_BY_SOLAR_TERM,
  SIXTY_GANJI,
  YEAR_STEM_TO_START_MONTH_STEM,
} from '../../core/constants.js';
import { EarthlyBranch, HeavenlyStem, Pillar } from '../../core/types.js';
import { getSurroundingSolarTerms, getYearSolarTerms, toKSTComponents } from '../calendar/solar-term-engine.js';
import { DayPillarEngine } from '../pillar/day-pillar-engine.js';

export interface SolarTermMonthLuck {
  order: number;
  monthIndex: number;
  termName: string;
  nextTermName: string;
  ganji: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  startDate: string;
  startTime: string;
  startDateTime: string;
  endDate: string;
  endTime: string;
  endDateTime: string;
  status: 'PAST' | 'CURRENT' | 'FUTURE';
}

export class AnnualMonthlyDailyEngine {
  private dayEngine = new DayPillarEngine();

  /**
   * 세운(연운) 간지 산출
   */
  public getAnnualLuck(year: number): Pillar {
    const offset = year - 4;
    const sIdx = ((offset % 10) + 10) % 10;
    const bIdx = ((offset % 12) + 12) % 12;
    const stem = HEAVENLY_STEMS[sIdx];
    const branch = EARTHLY_BRANCHES[bIdx];
    return {
      stem,
      branch,
      name: `${stem}${branch}`,
    };
  }

  /**
   * 월운 간지 산출 (절기 기준 월지 + 세운 연간 기반 연상기월법)
   */
  public getMonthlyLuck(year: number, dateUtc: Date): Pillar {
    const annualPillar = this.getAnnualLuck(year);
    const surrounding = getSurroundingSolarTerms(dateUtc);
    const majorTerm = surrounding.previousMajorTerm;
    const monthBranch = MONTH_BRANCH_BY_SOLAR_TERM[majorTerm.termName] || '인';

    // 연상기월법
    const order: EarthlyBranch[] = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
    const branchOffset = order.indexOf(monthBranch);
    const startStem = YEAR_STEM_TO_START_MONTH_STEM[annualPillar.stem];
    const startStemIdx = HEAVENLY_STEMS.indexOf(startStem);
    const monthStemIdx = (startStemIdx + branchOffset) % 10;
    const monthStem = HEAVENLY_STEMS[monthStemIdx];

    return {
      stem: monthStem,
      branch: monthBranch,
      name: `${monthStem}${monthBranch}`,
    };
  }

  /**
   * 1개년 12개 월운 정밀 일정 및 PAST/CURRENT/FUTURE 분류
   */
  public getYearMonthlyLuckSchedule(year: number, currentDateStr: string = '2026-10-03'): SolarTermMonthLuck[] {
    const annualPillar = this.getAnnualLuck(year);
    const startStem = YEAR_STEM_TO_START_MONTH_STEM[annualPillar.stem];
    const startStemIdx = HEAVENLY_STEMS.indexOf(startStem);

    // 연말/익년 절기까지 포함
    const currYearTerms = getYearSolarTerms(year);
    const nextYearTerms = getYearSolarTerms(year + 1);
    const allTerms = [...currYearTerms, ...nextYearTerms].sort((a, b) => a.exactDateTimeUTC.getTime() - b.exactDateTimeUTC.getTime());

    const majorTermNames = ['입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한'];
    const orderBranches: EarthlyBranch[] = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];

    // year의 입춘부터 시작하는 12개 주요 절기 추출
    const filteredMajors = allTerms.filter(t => majorTermNames.includes(t.termName));
    const ipchunIdx = filteredMajors.findIndex(t => t.termName === '입춘' && t.kst.year === year);
    const target13Majors = filteredMajors.slice(ipchunIdx, ipchunIdx + 13);

    const pad = (n: number) => String(n).padStart(2, '0');
    const schedule: SolarTermMonthLuck[] = [];

    // 현재 기준 시점 (YYYY-MM-DD)
    const currentCompare = currentDateStr.length === 10 ? `${currentDateStr} 12:00` : currentDateStr;

    for (let i = 0; i < 12; i++) {
      const startTerm = target13Majors[i];
      const endTerm = target13Majors[i + 1] || target13Majors[i];

      const branch = orderBranches[i];
      const stem = HEAVENLY_STEMS[(startStemIdx + i) % 10];
      const ganji = `${stem}${branch}`;

      const sDate = `${startTerm.kst.year}-${pad(startTerm.kst.month)}-${pad(startTerm.kst.day)}`;
      const sTime = `${pad(startTerm.kst.hour)}:${pad(startTerm.kst.minute)}`;
      const startDateTime = `${sDate} ${sTime}`;

      const eDate = `${endTerm.kst.year}-${pad(endTerm.kst.month)}-${pad(endTerm.kst.day)}`;
      const eTime = `${pad(endTerm.kst.hour)}:${pad(endTerm.kst.minute)}`;
      const endDateTime = `${eDate} ${eTime}`;

      let status: 'PAST' | 'CURRENT' | 'FUTURE';
      if (currentCompare < startDateTime) {
        status = 'FUTURE';
      } else if (currentCompare >= endDateTime) {
        status = 'PAST';
      } else {
        status = 'CURRENT';
      }

      schedule.push({
        order: i + 1,
        monthIndex: (i + 1) === 12 ? 1 : i + 2, // 2월~12월, 1월
        termName: startTerm.termName,
        nextTermName: endTerm.termName,
        ganji,
        stem,
        branch,
        startDate: sDate,
        startTime: sTime,
        startDateTime,
        endDate: eDate,
        endTime: eTime,
        endDateTime,
        status,
      });
    }

    return schedule;
  }

  /**
   * 일운 간지 산출 (2000-01-01 무오일 Anchor)
   */
  public getDailyLuck(civilDateStr: string): Pillar {
    return this.dayEngine.calculate(civilDateStr, civilDateStr).dayPillar;
  }
}

