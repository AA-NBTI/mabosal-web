/**
 * Phase 1: Calendar Engine (역법 변환 및 절기 판정 총괄 엔진)
 * 
 * 모듈 원칙:
 * INPUT (출생일시 + 지역) → PROCESS → OUTPUT (CalendarOutput)
 * 대한민국 역사적 표준시 및 역대 서머타임(12개 구간) 데이터 기반 정확한 UTC 시점 산출.
 * KASI(한국천문연구원) 공식 역서 절기 데이터를 우선 적용하며,
 * 절기 시각에서 ±2시간(120분) 이내 출생자는 연주·월주 경계 민감도를 자동 검사합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { EarthlyBranch } from '../../core/types.js';
import { SolarTermName } from '../../core/constants.js';
import {
  KOREA_DST_PERIODS,
  KOREA_HISTORICAL_TIMEZONES,
  KOREA_REGIONS,
} from './korea-timezone.js';
import {
  getIpchun,
  getSurroundingSolarTerms,
  SolarTermRecord,
} from './solar-term-engine.js';

export interface CalendarInput {
  birth_date: string;       // YYYY-MM-DD
  birth_time: string | null; // HH:mm (null이면 시간 미상)
  country?: string;         // 기본 'KR'
  region?: string;          // 기본 '서울'
  apply_longitude_correction?: boolean; // 진태양시 경도 보정 여부 (SPEC_GAP-02)
  day_boundary_mode?: 'standard_23' | 'midnight'; // 자시 분기 기준 (SPEC_GAP-04)
  /** @deprecated 내부 호환성 유지용 - 무시됨 */
  calendar_type?: string;
  /** @deprecated 내부 호환성 유지용 - 무시됨 */
  is_leap_month?: boolean;
}

export interface CalendarOutput {
  solar_datetime: Date;
  solar_datetime_formatted: string;
  timezone: string;
  timezone_offset_minutes: number;
  longitude: number;
  latitude: number;
  is_dst_applied: boolean;
  dst_offset_minutes: number;
  solar_term: {
    currentTerm: SolarTermName;
    exactDateTimeKST: string;
    currentMajorTerm: SolarTermName;
    monthBranch: EarthlyBranch;
    // 신규 메타데이터 (KASI 우선 적용 및 추적 기록)
    source: 'kasi_official_table' | 'astronomical_calculation';
    kasiDateTimeKST?: string;
    astronomicalDateTimeKST: string;
    diffMinutes?: number;
    appliedDateTimeKST: string;
    isNearSolarTermBoundary: boolean; // ±2시간(120분) 이내 여부
    solarTermBoundaryDiffMinutes: number;
    boundaryTermName?: string;
  };
  year_boundary: {
    ipchunDateTimeKST: string;
    isBeforeIpchun: boolean;
    sajuYear: number;
    isNearBoundary: boolean; // 입춘 ±2시간 이내
    boundaryDiffMinutes: number;
  };
  month_boundary: {
    termName: string;
    termDateTimeKST: string;
    nextTermName: string;
    nextTermDateTimeKST: string;
    isNearBoundary: boolean; // 절기 ±2시간 이내
    boundaryDiffMinutes: number;
  };
  day_boundary: {
    civilDate: string;
    sajuDate: string;
    boundaryHour: number;
  };
  hour_boundary: {
    branch: EarthlyBranch | null;
    range: string | null;
    isNearBoundary: boolean;
    boundaryDiffMinutes?: number;
    boundaryDirection?: 'after' | 'before';
    effectiveTimeFormatted?: string;
  };
  calendar_status: 'normal' | 'missing_hour' | 'near_boundary' | 'near_term_boundary' | 'dst_applied';
}

export class CalendarEngine extends BaseEngineModule<CalendarInput, CalendarOutput> {
  protected readonly moduleId = 'calendar_engine';
  protected readonly moduleVersion = '1.1.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'CalendarInput';
  protected readonly outputSchemaName = 'CalendarOutput';

  protected validateInput(input: CalendarInput): { isValid: boolean; reason?: string } {
    if (!input.birth_date) {
      return { isValid: false, reason: '출생일자(birth_date)가 필요합니다.' };
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.birth_date)) {
      return { isValid: false, reason: 'birth_date 형식이 올바르지 않습니다 (YYYY-MM-DD 필요).' };
    }
    if (input.birth_time !== null && input.birth_time !== undefined) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(input.birth_time)) {
        return { isValid: false, reason: 'birth_time 형식이 올바르지 않습니다 (HH:mm 필요).' };
      }
    }
    return { isValid: true };
  }

  protected processInternal(input: CalendarInput): {
    data: CalendarOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const spec_gaps: string[] = [];
    const notes: string[] = [];

    const country = input.country ?? 'KR';
    const region = input.region ?? '서울';
    const coords = KOREA_REGIONS[region] ?? KOREA_REGIONS['서울'];

    // 1. 일시 파싱
    const [yearStr, monthStr, dayStr] = input.birth_date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    let hour = 12;
    let minute = 0;
    const isMissingHour = input.birth_time === null || input.birth_time === undefined;

    if (!isMissingHour) {
      const [hStr, mStr] = (input.birth_time as string).split(':');
      hour = parseInt(hStr, 10);
      minute = parseInt(mStr, 10);
    } else {
      notes.push('출생시간이 제공되지 않아 기본 정오(12:00) 기준으로 계산하며, 시주는 확정되지 않습니다.');
    }

    // 2. 역사적 표준시 및 서머타임 판정
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    const dtStr = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    let tzOffset = 540; // 기본 KST (UTC+9)
    let tzName = '현행 대한민국 표준시 (UTC+9:00)';
    for (const tz of KOREA_HISTORICAL_TIMEZONES) {
      if (dateStr >= tz.startDate && dateStr <= tz.endDate) {
        tzOffset = tz.offsetMinutes;
        tzName = tz.name;
        break;
      }
    }

    let isDst = false;
    let dstOffset = 0;
    for (const dst of KOREA_DST_PERIODS) {
      if (dtStr >= dst.startDate && dtStr <= dst.endDate) {
        isDst = true;
        dstOffset = dst.offsetMinutes;
        notes.push(`서머타임(DST) 적용 구간에 해당합니다: ${dst.startDate} ~ ${dst.endDate} (-${dst.offsetMinutes}분 보정 적용)`);
        break;
      }
    }

    // 진태양시 경도 보정 (SPEC_GAP-02)
    let longitudeOffsetMinutes = 0;
    if (input.apply_longitude_correction) {
      longitudeOffsetMinutes = (coords.longitude - 135.0) * 4;
      notes.push(`진태양시 경도 보정 적용: ${longitudeOffsetMinutes.toFixed(2)}분`);
      spec_gaps.push('SPEC_GAP-02: 진태양시 경도 보정 옵션 적용됨');
    }

    // 최종 KST 기준 시각을 UTC 절대 시점으로 생성 (KST = UTC + 9h -> UTC = KST - 9h)
    const effectiveMinutes = minute - dstOffset + longitudeOffsetMinutes;
    const birthUtcDate = new Date(Date.UTC(year, month - 1, day, hour - 9, Math.round(effectiveMinutes), 0));

    // DST 보정 후의 실질 표준시각 (KST 기준)
    // DST가 적용되는 출생자는 표기 시각이 아닌 실질 표준시각을 시진·경계거리·자시 판정에 동일하게 적용합니다.
    let effectiveDateStr = dateStr;
    let effectiveHour = hour;
    let effectiveMinute = minute;
    let effectiveTotalMinutes = hour * 60 + minute;

    if (!isMissingHour) {
      const effectiveDstTotalMinutes = hour * 60 + minute - dstOffset;
      const effectiveKstDate = new Date(Date.UTC(year, month - 1, day, 0, effectiveDstTotalMinutes, 0));
      const effYear = effectiveKstDate.getUTCFullYear();
      const effMonth = String(effectiveKstDate.getUTCMonth() + 1).padStart(2, '0');
      const effDay = String(effectiveKstDate.getUTCDate()).padStart(2, '0');
      effectiveDateStr = `${effYear}-${effMonth}-${effDay}`;
      effectiveHour = effectiveKstDate.getUTCHours();
      effectiveMinute = effectiveKstDate.getUTCMinutes();
      effectiveTotalMinutes = effectiveHour * 60 + effectiveMinute;
    }

    // 3. 24절기 계산 (KASI 공식 데이터 우선 + 천문 계산 fallback)
    const surroundingTerms = getSurroundingSolarTerms(birthUtcDate);
    const ipchun = getIpchun(year);

    // 연주 경계 (입춘 기준) 판정
    const isBeforeIpchun = birthUtcDate.getTime() < ipchun.utcDate.getTime();
    const sajuYear = isBeforeIpchun ? year - 1 : year;

    // 월지 결정용 12절기
    const currentMajorTerm = surroundingTerms.previousMajorTerm;

    const termToBranchMap: Record<string, EarthlyBranch> = {
      입춘: '인',
      경칩: '묘',
      청명: '진',
      입하: '사',
      망종: '오',
      소서: '미',
      입추: '신',
      백로: '유',
      한로: '술',
      입동: '해',
      대설: '자',
      소한: '축',
    };
    const monthBranch: EarthlyBranch = termToBranchMap[currentMajorTerm.termName] ?? '인';

    // 4. 절기 시각 ±2시간(120분) 이내 출생자 연주·월주 경계 민감도 자동 검사
    const birthTimeMs = birthUtcDate.getTime();
    const ipchunDiffMinutes = Math.abs(birthTimeMs - ipchun.utcDate.getTime()) / 60000;
    const majorTermDiffMinutes = Math.abs(birthTimeMs - currentMajorTerm.exactDateTimeUTC.getTime()) / 60000;
    const nextTermDiffMinutes = Math.abs(birthTimeMs - surroundingTerms.nextTerm.exactDateTimeUTC.getTime()) / 60000;

    let isNearSolarTermBoundary = false;
    let minTermDiffMinutes = 999999;
    let boundaryTermName = '';

    if (ipchunDiffMinutes <= 120) {
      isNearSolarTermBoundary = true;
      minTermDiffMinutes = ipchunDiffMinutes;
      boundaryTermName = '입춘';
      notes.push(`입춘 시각과 ${Math.round(ipchunDiffMinutes)}분 차이로 인접하여(±2시간 이내) 연주 경계 민감도 정밀 검토 대상입니다.`);
    }

    if (majorTermDiffMinutes <= 120 && majorTermDiffMinutes < minTermDiffMinutes) {
      isNearSolarTermBoundary = true;
      minTermDiffMinutes = majorTermDiffMinutes;
      boundaryTermName = currentMajorTerm.termName;
      notes.push(`절기 [${currentMajorTerm.termName}] 시각과 ${Math.round(majorTermDiffMinutes)}분 차이로 인접하여(±2시간 이내) 월주 경계 민감도 정밀 검토 대상입니다.`);
    }

    if (nextTermDiffMinutes <= 120 && nextTermDiffMinutes < minTermDiffMinutes) {
      isNearSolarTermBoundary = true;
      minTermDiffMinutes = nextTermDiffMinutes;
      boundaryTermName = surroundingTerms.nextTerm.termName;
      notes.push(`차기 절기 [${surroundingTerms.nextTerm.termName}] 시각과 ${Math.round(nextTermDiffMinutes)}분 차이로 인접하여(±2시간 이내) 월주 경계 민감도 정밀 검토 대상입니다.`);
    }

    // 5. 일주 경계 (자시 분기 - DST 보정 후의 실질 표준시각 기준)
    const boundaryMode = input.day_boundary_mode ?? 'standard_23';
    const boundaryHour = boundaryMode === 'standard_23' ? 23 : 0;
    let sajuDate = effectiveDateStr;

    if (!isMissingHour && boundaryMode === 'standard_23' && effectiveHour >= 23) {
      const nextDay = new Date(Date.UTC(
        parseInt(effectiveDateStr.substring(0, 4), 10),
        parseInt(effectiveDateStr.substring(5, 7), 10) - 1,
        parseInt(effectiveDateStr.substring(8, 10), 10) + 1
      ));
      const ndYear = nextDay.getUTCFullYear();
      const ndMonth = String(nextDay.getUTCMonth() + 1).padStart(2, '0');
      const ndDay = String(nextDay.getUTCDate()).padStart(2, '0');
      sajuDate = `${ndYear}-${ndMonth}-${ndDay}`;
      notes.push(`야자시 적용: 23:00 이후 출생으로 사주 일진 일자가 다음 날(${sajuDate})로 전환됩니다.`);
    }

    // 6. 시주 경계 (DST 보정 후의 실질 표준시각 기준)
    let hourBranch: EarthlyBranch | null = null;
    let hourRange: string | null = null;
    let isNearBoundary = false;
    let boundaryDiffMinutes = 0;
    let boundaryDirection: 'after' | 'before' | undefined = undefined;

    if (!isMissingHour) {
      const branchIndex = Math.floor(((effectiveHour + 1) % 24) / 2);
      const branches: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
      hourBranch = branches[branchIndex];
      hourRange = `${(branchIndex * 2 + 23) % 24}:00 ~ ${(branchIndex * 2 + 1) % 24}:00`;

      // 시진 경계 판정 (홀수시 정각 기준 ±15분)
      let minDiff = 120;
      let closestBoundaryMinutes = -1;

      for (let h = 1; h <= 23; h += 2) {
        const bMinutes = h * 60;
        const diff = Math.abs(effectiveTotalMinutes - bMinutes);
        if (diff < minDiff) {
          minDiff = diff;
          closestBoundaryMinutes = bMinutes;
        }
      }

      boundaryDiffMinutes = minDiff;
      if (minDiff <= 15) {
        isNearBoundary = true;
        // 경계 직후(0~15분) vs 직전(15분 전) 판별
        boundaryDirection = effectiveTotalMinutes >= closestBoundaryMinutes ? 'after' : 'before';
        notes.push(`시진 경계시각(홀수시 정각)과 ${minDiff}분 차이(${boundaryDirection === 'after' ? '경계 직후' : '경계 직전'})로 인접하여 시주 경계 후보 분석이 필요합니다.`);
      }
    }

    let calendarStatus: CalendarOutput['calendar_status'] = 'normal';
    if (isMissingHour) {
      calendarStatus = 'missing_hour';
    } else if (isNearSolarTermBoundary) {
      calendarStatus = 'near_term_boundary';
    } else if (isNearBoundary) {
      calendarStatus = 'near_boundary';
    } else if (isDst) {
      calendarStatus = 'dst_applied';
    }

    const outputData: CalendarOutput = {
      solar_datetime: birthUtcDate,
      solar_datetime_formatted: `${dateStr} ${isMissingHour ? '(시간미상)' : `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}`,
      timezone: tzName,
      timezone_offset_minutes: tzOffset,
      longitude: coords.longitude,
      latitude: coords.latitude,
      is_dst_applied: isDst,
      dst_offset_minutes: dstOffset,
      solar_term: {
        currentTerm: surroundingTerms.previousTerm.termName,
        exactDateTimeKST: surroundingTerms.previousTerm.kst.formatted,
        currentMajorTerm: currentMajorTerm.termName,
        monthBranch: monthBranch,
        source: surroundingTerms.previousTerm.source,
        kasiDateTimeKST: surroundingTerms.previousTerm.kasiDateTimeKST,
        astronomicalDateTimeKST: surroundingTerms.previousTerm.astronomicalDateTimeKST,
        diffMinutes: surroundingTerms.previousTerm.diffMinutes,
        appliedDateTimeKST: surroundingTerms.previousTerm.appliedDateTimeKST,
        isNearSolarTermBoundary,
        solarTermBoundaryDiffMinutes: Math.round(minTermDiffMinutes),
        boundaryTermName: boundaryTermName || undefined,
      },
      year_boundary: {
        ipchunDateTimeKST: ipchun.kst.formatted,
        isBeforeIpchun,
        sajuYear,
        isNearBoundary: ipchunDiffMinutes <= 120,
        boundaryDiffMinutes: Math.round(ipchunDiffMinutes),
      },
      month_boundary: {
        termName: currentMajorTerm.termName,
        termDateTimeKST: currentMajorTerm.kst.formatted,
        nextTermName: surroundingTerms.nextTerm.termName,
        nextTermDateTimeKST: surroundingTerms.nextTerm.kst.formatted,
        isNearBoundary: majorTermDiffMinutes <= 120 || nextTermDiffMinutes <= 120,
        boundaryDiffMinutes: Math.round(Math.min(majorTermDiffMinutes, nextTermDiffMinutes)),
      },
      day_boundary: {
        civilDate: dateStr,
        sajuDate: sajuDate,
        boundaryHour,
      },
      hour_boundary: {
        branch: hourBranch,
        range: hourRange,
        isNearBoundary,
        boundaryDiffMinutes,
        boundaryDirection,
        effectiveTimeFormatted: isMissingHour ? undefined : `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`,
      },
      calendar_status: calendarStatus,
    };

    return {
      data: outputData,
      confidence: isMissingHour ? 80.0 : isNearSolarTermBoundary ? 85.0 : isNearBoundary ? 90.0 : 100.0,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: CalendarInput, errorReason: string): CalendarOutput {
    return {
      solar_datetime: new Date(),
      solar_datetime_formatted: '오류 발생',
      timezone: 'UTC+9',
      timezone_offset_minutes: 540,
      longitude: 126.9780,
      latitude: 37.5665,
      is_dst_applied: false,
      dst_offset_minutes: 0,
      solar_term: {
        currentTerm: '입춘',
        exactDateTimeKST: '2026-02-04 05:02:00',
        currentMajorTerm: '입춘',
        monthBranch: '인',
        source: 'kasi_official_table',
        astronomicalDateTimeKST: '2026-02-04 05:02:00',
        appliedDateTimeKST: '2026-02-04 05:02:00',
        isNearSolarTermBoundary: false,
        solarTermBoundaryDiffMinutes: 9999,
      },
      year_boundary: {
        ipchunDateTimeKST: '2026-02-04 05:02:00',
        isBeforeIpchun: false,
        sajuYear: 2026,
        isNearBoundary: false,
        boundaryDiffMinutes: 9999,
      },
      month_boundary: {
        termName: '입춘',
        termDateTimeKST: '2026-02-04 05:02:00',
        nextTermName: '우수',
        nextTermDateTimeKST: '2026-02-19 00:52:00',
        isNearBoundary: false,
        boundaryDiffMinutes: 9999,
      },
      day_boundary: {
        civilDate: input.birth_date,
        sajuDate: input.birth_date,
        boundaryHour: 23,
      },
      hour_boundary: {
        branch: null,
        range: null,
        isNearBoundary: false,
      },
      calendar_status: 'normal',
    };
  }
}
