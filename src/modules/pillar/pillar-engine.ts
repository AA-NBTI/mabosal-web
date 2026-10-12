/**
 * Phase 2: Pillar Engine (4주 산출 엔진)
 * 
 * 모듈 원칙:
 * INPUT (CalendarOutput) → PROCESS → OUTPUT (PillarOutput)
 * 독립 서브엔진(Year, Month, Day, Hour, Candidate)을 조합하여
 * 임의의 시주 선택 없이 hour=null 및 경계 후보를 온전히 보존합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { SolarTermName } from '../../core/constants.js';
import { BoundaryAnalysisResult, EarthlyBranch, FourPillars, Pillar } from '../../core/types.js';
import { CalendarOutput } from '../calendar/calendar-engine.js';
import { CandidateEngine, SolarTermCandidateOptions } from './candidate-engine.js';
import { DayPillarEngine, DayPillarResult } from './day-pillar-engine.js';
import { HourPillarEngine, HourPillarResult } from './hour-pillar-engine.js';
import { MonthBoundaryEngine, MonthBoundaryResult } from './month-boundary-engine.js';
import { YearBoundaryEngine, YearBoundaryResult } from './year-boundary-engine.js';

export interface PillarOutput {
  four_pillars: FourPillars;
  summary_string: string;
  year_result: YearBoundaryResult;
  month_result: MonthBoundaryResult;
  day_result: DayPillarResult;
  hour_result: HourPillarResult;
  boundary_analysis: BoundaryAnalysisResult;
}

export class PillarEngine extends BaseEngineModule<CalendarOutput, PillarOutput> {
  protected readonly moduleId = 'pillar_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'CalendarOutput';
  protected readonly outputSchemaName = 'PillarOutput';

  private yearBoundaryEngine = new YearBoundaryEngine();
  private monthBoundaryEngine = new MonthBoundaryEngine();
  private dayPillarEngine = new DayPillarEngine();
  private hourPillarEngine = new HourPillarEngine();
  private candidateEngine = new CandidateEngine();

  protected validateInput(input: CalendarOutput): { isValid: boolean; reason?: string } {
    if (!input || !input.year_boundary || !input.day_boundary || !input.solar_term) {
      return { isValid: false, reason: 'CalendarOutput 필수 필드가 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: CalendarOutput): {
    data: PillarOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];

    // 1. 연주 계산 (YearBoundaryEngine)
    const yearResult = this.yearBoundaryEngine.calculate(
      input.year_boundary.sajuYear,
      input.year_boundary.ipchunDateTimeKST,
      input.year_boundary.isBeforeIpchun
    );

    // 2. 월주 계산 (MonthBoundaryEngine - 연상기월법)
    const monthResult = this.monthBoundaryEngine.calculate(
      yearResult.yearPillar.stem,
      input.month_boundary.termName,
      input.month_boundary.termDateTimeKST,
      input.solar_term.monthBranch
    );

    // 3. 일주 계산 (DayPillarEngine - 2000-01-01 무오 Anchor)
    const dayResult = this.dayPillarEngine.calculate(
      input.day_boundary.civilDate,
      input.day_boundary.sajuDate
    );

    // 4. 시주 계산 (HourPillarEngine - 일상기시법, hour=null 완벽 보존)
    const hourResult = this.hourPillarEngine.calculate(
      dayResult.dayPillar.stem,
      input.hour_boundary.branch,
      input.hour_boundary.range
    );

    // 5. 절기 경계 분석 및 대안 연주/월주 계산
    let solarTermOptions: SolarTermCandidateOptions | undefined = undefined;

    const isNearYearTerm = input.year_boundary.isNearBoundary || input.solar_term.boundaryTermName === '입춘';
    const isNearMonthTerm = input.month_boundary.isNearBoundary || (input.solar_term.isNearSolarTermBoundary && !isNearYearTerm);

    if (isNearYearTerm) {
      // 입춘 경계 (연주 및 월주 동시 분기)
      const isBefore = input.year_boundary.isBeforeIpchun;
      const altSajuYear = isBefore ? input.year_boundary.sajuYear + 1 : input.year_boundary.sajuYear - 1;
      const altYearResult = this.yearBoundaryEngine.calculate(
        altSajuYear,
        input.year_boundary.ipchunDateTimeKST,
        !isBefore
      );
      // 입춘 전 출생자의 대안은 입춘 후(인월), 입춘 후 출생자의 대안은 입춘 전(축월)
      const altBranch: EarthlyBranch = isBefore ? '인' : '축';
      const altTermName: SolarTermName = isBefore ? '입춘' : '소한';
      const altMonthResult = this.monthBoundaryEngine.calculate(
        altYearResult.yearPillar.stem,
        altTermName,
        input.year_boundary.ipchunDateTimeKST,
        altBranch
      );

      solarTermOptions = {
        isNearSolarTermBoundary: true,
        diffMinutes: input.year_boundary.boundaryDiffMinutes,
        boundaryTermName: '입춘',
        alternativeYearPillar: altYearResult.yearPillar,
        alternativeMonthPillar: altMonthResult.monthPillar,
      };
    } else if (isNearMonthTerm) {
      // 월령 절기 경계 (월주 단독 분기)
      const majorBranches: EarthlyBranch[] = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
      const majorTerms: SolarTermName[] = ['입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한'];
      const currIdx = majorBranches.indexOf(input.solar_term.monthBranch);

      let altIdx: number;
      if (input.month_boundary.termName === input.solar_term.boundaryTermName) {
        // 현재 절기 직후 -> 이전 절기(prev)가 대안
        altIdx = (currIdx - 1 + 12) % 12;
      } else {
        // 다음 절기 직전 -> 다음 절기(next)가 대안
        altIdx = (currIdx + 1) % 12;
      }

      const altBranch = majorBranches[altIdx];
      const altTermName = majorTerms[altIdx];
      const altMonthResult = this.monthBoundaryEngine.calculate(
        yearResult.yearPillar.stem,
        altTermName,
        input.month_boundary.termDateTimeKST,
        altBranch
      );

      solarTermOptions = {
        isNearSolarTermBoundary: true,
        diffMinutes: input.solar_term.solarTermBoundaryDiffMinutes || input.month_boundary.boundaryDiffMinutes,
        boundaryTermName: input.solar_term.boundaryTermName ?? input.month_boundary.termName,
        alternativeYearPillar: yearResult.yearPillar,
        alternativeMonthPillar: altMonthResult.monthPillar,
      };
    }

    // 6. 경계시간 분석 및 복수 후보 생성 (CandidateEngine)
    const boundaryAnalysis = this.candidateEngine.generateCandidates(
      yearResult.yearPillar,
      monthResult.monthPillar,
      dayResult.dayPillar,
      input.hour_boundary.branch,
      input.hour_boundary.isNearBoundary,
      input.hour_boundary.boundaryDiffMinutes ?? 0,
      input.hour_boundary.range,
      input.hour_boundary.boundaryDirection,
      solarTermOptions
    );

    const fourPillars: FourPillars = {
      year: yearResult.yearPillar,
      month: monthResult.monthPillar,
      day: dayResult.dayPillar,
      hour: hourResult.hourPillar,
    };

    const hourStr = hourResult.hourPillar ? `${hourResult.hourPillar.name}시` : '시간미상';
    const summaryString = `${yearResult.yearPillar.name}년 ${monthResult.monthPillar.name}월 ${dayResult.dayPillar.name}일 ${hourStr}`;

    if (hourResult.timeDependency.is_missing_hour) {
      notes.push('출생시간 미상으로 3기둥(연/월/일)이 확정되었으며 시주는 null로 유지됩니다.');
    }
    if (boundaryAnalysis.has_boundary_issue) {
      notes.push(boundaryAnalysis.selection_reason ?? '경계시간 후보군이 생성되었습니다.');
    }

    const confidence = boundaryAnalysis.confidence;

    return {
      data: {
        four_pillars: fourPillars,
        summary_string: summaryString,
        year_result: yearResult,
        month_result: monthResult,
        day_result: dayResult,
        hour_result: hourResult,
        boundary_analysis: boundaryAnalysis,
      },
      confidence,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: CalendarOutput, errorReason: string): PillarOutput {
    const dummyPillar: Pillar = { stem: '갑', branch: '자', name: '갑자' };
    return {
      four_pillars: {
        year: dummyPillar,
        month: dummyPillar,
        day: dummyPillar,
        hour: null,
      },
      summary_string: '산출 실패',
      year_result: {
        sajuYear: 2000,
        yearPillar: dummyPillar,
        ipchunDateTimeKST: '',
        isBeforeIpchun: false,
      },
      month_result: {
        monthPillar: dummyPillar,
        termName: '입춘',
        termDateTimeKST: '',
        monthBranch: '인',
        monthOrder: 1,
      },
      day_result: {
        dayPillar: dummyPillar,
        civilDate: '',
        sajuDate: '',
        anchorDate: '2000-01-01',
        anchorGanjiIndex: 54,
        diffDaysFromAnchor: 0,
        ganjiIndex: 0,
      },
      hour_result: {
        hourPillar: null,
        timeDependency: {
          requires_hour: true,
          time_dependency: 100,
          is_missing_hour: true,
        },
        hourBranch: null,
        hourRange: null,
        calculationMethod: 'fallback',
      },
      boundary_analysis: {
        has_boundary_issue: false,
        candidates: [],
        selected_candidate: null,
        boundary_sensitivity: 0,
        confidence: 0,
      },
    };
  }
}
