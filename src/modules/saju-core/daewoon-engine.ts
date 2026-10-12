/**
 * DaewoonEngine: 정통 명리학 기준 정밀 대운 계산기
 * 
 * [단일 권위 천문력/절기 데이터 기준 명시]
 * - 사용 데이터셋: 한국천문연구원(KASI) 역서(曆書) 및 NASA JPL DE405 / VSOP87 천문력 기준 데이터셋
 * - 기준 시간대: KST (대한민국 표준시, UTC+9, 동경 135° 자오선)
 * - 천문 계산 기준: 태양의 겉보기 황경(Apparent Ecliptic Longitude)이 절기 기준각(청명: 15°00'00")에 정확히 도달하는 순간
 *   (예: 1992년 청명 시각 = 1992-04-04 12:44:54 UTC = 1992-04-04 21:44:54 KST)
 * - 적용 이유: 대한민국 표준시를 준수하는 공인 천문학적 절기 전환점으로서 사주 명리학의 대운 계산 및 월운 절기 구분의 단일 권위 척도로 채택함.
 * 
 * 1. 대운 순행/역행 판정:
 *    - 양남음녀(陽男陰女): 순행 (Forward)
 *    - 음남양녀(陰男陽女): 역행 (Backward)
 * 2. 대운수 계산 (1~10):
 *    - 순행: 출생 시각부터 다음 절기(節氣) 시각까지의 시간차를 일수로 환산하여 3으로 나눔
 *    - 역행: 이전 절기 시각부터 출생 시각까지의 시간차를 일수로 환산하여 3으로 나눔
 * 3. 10년 주기 대운 간지 도출:
 *    - 월주를 기준으로 순행/역행 순서로 10개 대운 간지 생성
 * 4. 현재 대운 및 다음 대운 판정
 */

import { HeavenlyStem, EarthlyBranch } from '../../core/types.js';
import { getSurroundingSolarTerms, getYearSolarTerms, toKSTComponents } from '../calendar/solar-term-engine.js';
import { MAJOR_SOLAR_TERMS } from '../../core/constants.js';
import { MYEONGLI_RULE_VERSIONS } from '../../core/myeongli-rule-spec.js';

export interface DaewoonPillar {
  order: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  ganji: string;
  startAge: number; // 한국 나이 기준 시작 나이
  endAge: number;   // 한국 나이 기준 종료 나이
  startDate: string;     // YYYY-MM-DD
  startTime: string;     // HH:mm
  startDateTime: string; // YYYY-MM-DD HH:mm
  endDate: string;       // YYYY-MM-DD
  endTime: string;       // HH:mm
  endDateTime: string;   // YYYY-MM-DD HH:mm
  startYear: number;
  endYear: number;
}

export interface DaewoonResult {
  ruleVersion: string;
  direction: '순행' | '역행';
  daewoonNumber: number; // 대운수 (1~10)
  pillars: DaewoonPillar[];
  currentDaewoonOrder: number; // 현재 대운 번호 (제N대운)
  currentDaewoon: DaewoonPillar;
  nextDaewoon: DaewoonPillar;
  birthDateTimeKST: string;
  targetTermName: string;
  targetTermDateTimeKST: string;
  elapsedDays: number;
  offsetYears: number;
  offsetMonths: number;
  offsetDays: number;
}

const HEAVENLY_STEMS: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const EARTHLY_BRANCHES: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const YANG_STEMS: HeavenlyStem[] = ['갑', '병', '무', '경', '임'];

export class DaewoonEngine {
  /**
   * 대운 계산 메인 함수
   */
  public calculateDaewoon(params: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour?: number;
    birthMinute?: number;
    gender: 'male' | 'female';
    yearStem: HeavenlyStem;
    monthStem: HeavenlyStem;
    monthBranch: EarthlyBranch;
    currentDate?: string; // 'YYYY-MM-DD'
    currentYear?: number;
  }): DaewoonResult {
    const isYangYear = YANG_STEMS.includes(params.yearStem);
    const isMale = params.gender === 'male';

    // 1. 순행 / 역행 판정 (양남음녀 순행, 음남양녀 역행)
    const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);
    const direction: '순행' | '역행' = isForward ? '순행' : '역행';

    const bHour = params.birthHour ?? 12;
    const bMinute = params.birthMinute ?? 0;
    // UTC Date representing KST birth time
    const birthKstMs = Date.UTC(params.birthYear, params.birthMonth - 1, params.birthDay, bHour - 9, bMinute, 0);
    const birthDateUtc = new Date(birthKstMs);

    // 2. 절기 기준 정밀 일수 및 시간차 계산
    // 12절(월의 시작을 알리는 절기) 목록을 수집
    const allTerms = [
      ...getYearSolarTerms(params.birthYear - 1),
      ...getYearSolarTerms(params.birthYear),
      ...getYearSolarTerms(params.birthYear + 1),
    ].sort((a, b) => a.exactDateTimeUTC.getTime() - b.exactDateTimeUTC.getTime());

    const majorTermNames = new Set(MAJOR_SOLAR_TERMS.map(m => m.term));
    const majorTerms = allTerms.filter(t => majorTermNames.has(t.termName));

    const birthTime = birthDateUtc.getTime();
    let targetTerm = majorTerms[0];

    if (isForward) {
      // 순행: 출생일 이후의 첫 번째 절기
      for (const term of majorTerms) {
        if (term.exactDateTimeUTC.getTime() > birthTime) {
          targetTerm = term;
          break;
        }
      }
    } else {
      // 역행: 출생일 이전의 직전 절기
      for (let i = majorTerms.length - 1; i >= 0; i--) {
        if (majorTerms[i].exactDateTimeUTC.getTime() < birthTime) {
          targetTerm = majorTerms[i];
          break;
        }
      }
    }

    const diffMs = Math.abs(targetTerm.exactDateTimeUTC.getTime() - birthTime);
    const elapsedDays = diffMs / (24 * 3600 * 1000);

    // 명리학 전통 대운수 및 도달 시간 환산:
    // 3일 = 1년 (12개월), 1일 = 4개월 (120일), 1시간 = 5일, 12분 = 1일
    // 1년 = 365.2422일이므로 1일 당 (365.2422 / 3) = 121.7474일의 인생 시간
    const offsetMs = diffMs * (365.2422 / 3);
    const daewoonNumber = Math.max(1, Math.min(10, Math.round(elapsedDays / 3)));

    const offsetTotalDays = Math.floor(offsetMs / (24 * 3600 * 1000));
    const offsetYears = Math.floor(offsetTotalDays / 365.2422);
    const remainDaysAfterYears = offsetTotalDays - Math.floor(offsetYears * 365.2422);
    const offsetMonths = Math.floor(remainDaysAfterYears / 30.4375);
    const offsetDays = Math.floor(remainDaysAfterYears - Math.floor(offsetMonths * 30.4375));

    // 제1대운 시작 시점: birthKstMs + offsetMs
    const daewoon1StartUtc = new Date(birthDateUtc.getTime() + offsetMs);

    // 3. 월주 기준 대운 간지 10개 생성
    let stemIdx = HEAVENLY_STEMS.indexOf(params.monthStem);
    let branchIdx = EARTHLY_BRANCHES.indexOf(params.monthBranch);

    const pillars: DaewoonPillar[] = [];

    const pad = (n: number) => String(n).padStart(2, '0');

    for (let i = 1; i <= 10; i++) {
      if (isForward) {
        stemIdx = (stemIdx + 1) % 10;
        branchIdx = (branchIdx + 1) % 12;
      } else {
        stemIdx = (stemIdx - 1 + 10) % 10;
        branchIdx = (branchIdx - 1 + 12) % 12;
      }

      const stem = HEAVENLY_STEMS[stemIdx];
      const branch = EARTHLY_BRANCHES[branchIdx];

      // 대운 시작/종료 시점 (10 solar years per Daewoon)
      const pStartUtc = new Date(daewoon1StartUtc.getTime() + (i - 1) * 10 * 365.2422 * 24 * 3600 * 1000);
      const pEndUtc = new Date(daewoon1StartUtc.getTime() + i * 10 * 365.2422 * 24 * 3600 * 1000);

      const pStartKst = toKSTComponents(pStartUtc);
      const pEndKst = toKSTComponents(pEndUtc);

      const startAge = (i - 1) * 10 + daewoonNumber;
      const endAge = startAge + 9;

      const startDate = `${pStartKst.year}-${pad(pStartKst.month)}-${pad(pStartKst.day)}`;
      const startTime = `${pad(pStartKst.hour)}:${pad(pStartKst.minute)}`;
      const startDateTime = `${startDate} ${startTime}`;

      const endDate = `${pEndKst.year}-${pad(pEndKst.month)}-${pad(pEndKst.day)}`;
      const endTime = `${pad(pEndKst.hour)}:${pad(pEndKst.minute)}`;
      const endDateTime = `${endDate} ${endTime}`;

      pillars.push({
        order: i,
        stem,
        branch,
        ganji: `${stem}${branch}`,
        startAge,
        endAge,
        startDate,
        startTime,
        startDateTime,
        endDate,
        endTime,
        endDateTime,
        startYear: pStartKst.year,
        endYear: pEndKst.year,
      });
    }

    // 4. 현재 대운 및 다음 대운 판정
    const targetDateStr = params.currentDate || (params.currentYear ? `${params.currentYear}-01-01` : '2026-10-03');
    let currentIdx = pillars.findIndex(p => targetDateStr >= p.startDate && targetDateStr < p.endDate);
    if (currentIdx === -1) {
      currentIdx = targetDateStr < pillars[0].startDate ? 0 : pillars.length - 1;
    }

    const currentDaewoon = pillars[currentIdx];
    const nextDaewoon = pillars[Math.min(currentIdx + 1, pillars.length - 1)];

    const birthKst = toKSTComponents(birthDateUtc);

    return {
      ruleVersion: MYEONGLI_RULE_VERSIONS.DAEWUN,
      direction,
      daewoonNumber,
      pillars,
      currentDaewoonOrder: currentDaewoon.order,
      currentDaewoon,
      nextDaewoon,
      birthDateTimeKST: `${birthKst.year}-${pad(birthKst.month)}-${pad(birthKst.day)} ${pad(birthKst.hour)}:${pad(birthKst.minute)}`,
      targetTermName: targetTerm.termName,
      targetTermDateTimeKST: targetTerm.appliedDateTimeKST,
      elapsedDays: Number(elapsedDays.toFixed(2)),
      offsetYears,
      offsetMonths,
      offsetDays,
    };
  }
}

export const daewoonEngine = new DaewoonEngine();

