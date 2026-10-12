/**
 * Phase 5: Luck Engine (대운·세운·월운·일운 총괄 엔진)
 * 
 * 모듈 원칙:
 * INPUT (FourPillars + 대상 일시 + 성별) → PROCESS → OUTPUT (LuckOutput)
 * 대운수 산출, 10년 주기 대운, 세운, 월운, 일운을 구성하고
 * 원국 신호에 대한 40%-30%-20%-10% 활성화 지표를 산출합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { FourPillars, Pillar, TimeDependencyInfo } from '../../core/types.js';
import { AnnualMonthlyDailyEngine } from './annual-monthly-daily.js';
import { DaewoonEngine, DaewoonResult, Gender, SingleDaewoon } from './daewoon-engine.js';
import { LuckActivationEngine, LuckActivationResult } from './luck-activation-engine.js';

export interface LuckInput {
  four_pillars: FourPillars;
  birth_date_utc: Date;
  birth_year: number;
  gender?: Gender;
  target_date: string; // YYYY-MM-DD
  target_theme?: '재성' | '관성' | '인성' | '식상' | '비겁';
}

export interface LuckOutput {
  daewoon_result: DaewoonResult;
  current_daewoon: SingleDaewoon;
  current_sewoon: Pillar;
  current_wolwoon: Pillar;
  current_ilwoon: Pillar;
  activation: LuckActivationResult;
  time_dependency: TimeDependencyInfo;
}

export class LuckEngine extends BaseEngineModule<LuckInput, LuckOutput> {
  protected readonly moduleId = 'luck_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'LuckInput';
  protected readonly outputSchemaName = 'LuckOutput';

  private daewoonEngine = new DaewoonEngine();
  private amdEngine = new AnnualMonthlyDailyEngine();
  private activationEngine = new LuckActivationEngine();

  protected validateInput(input: LuckInput): { isValid: boolean; reason?: string } {
    if (!input || !input.four_pillars || !input.target_date || !input.birth_date_utc) {
      return { isValid: false, reason: 'LuckInput 필수 필드 누락' };
    }
    return { isValid: true };
  }

  protected processInternal(input: LuckInput): {
    data: LuckOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];
    const pillars = input.four_pillars;
    const gender = input.gender || 'male';

    if (!input.gender) {
      spec_gaps.push('SPEC_GAP-12: 성별 미지정으로 대운 순/역행 기본값(남성)이 적용됨');
    }

    // 1. 대운 산출
    const daewoonResult = this.daewoonEngine.calculate(
      pillars.year.stem,
      pillars.month,
      input.birth_date_utc,
      input.birth_year,
      gender
    );

    // 2. 대상 연도/월/일 파싱 및 현재 대운 탐색
    const [tYStr, tMStr, tDStr] = input.target_date.split('-');
    const targetYear = parseInt(tYStr, 10);
    const targetAge = targetYear - input.birth_year + 1; // 한국 세는 나이 기준

    // 나이에 해당하는 현재 대운 찾기
    let currentDaewoon = daewoonResult.daewoonList.find(
      d => targetAge >= d.startAge && targetAge <= d.endAge
    );
    if (!currentDaewoon) {
      currentDaewoon = daewoonResult.daewoonList[0];
    }

    // 3. 세운, 월운, 일운 간지 산출
    const currentSewoon = this.amdEngine.getAnnualLuck(targetYear);
    const targetDateUtc = new Date(Date.UTC(targetYear, parseInt(tMStr, 10) - 1, parseInt(tDStr, 10), 12, 0, 0));
    const currentWolwoon = this.amdEngine.getMonthlyLuck(targetYear, targetDateUtc);
    const currentIlwoon = this.amdEngine.getDailyLuck(input.target_date);

    // 4. 운 활성화(Activation) 점수 산출
    const activation = this.activationEngine.evaluate(
      pillars,
      currentDaewoon.pillar,
      currentSewoon,
      currentWolwoon,
      currentIlwoon,
      input.target_date,
      input.target_theme
    );

    const timeDependency: TimeDependencyInfo = {
      requires_hour: pillars.hour === null,
      time_dependency: pillars.hour === null ? 20.0 : 0.0,
      is_missing_hour: pillars.hour === null,
      notes: pillars.hour === null
        ? '시주 미상이나 대운/세운/월운/일운은 연월일 기준으로 완벽하게 산출되었습니다.'
        : undefined,
    };

    const data: LuckOutput = {
      daewoon_result: daewoonResult,
      current_daewoon: currentDaewoon,
      current_sewoon: currentSewoon,
      current_wolwoon: currentWolwoon,
      current_ilwoon: currentIlwoon,
      activation,
      time_dependency: timeDependency,
    };

    return {
      data,
      confidence: 100.0,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: LuckInput, errorReason: string): LuckOutput {
    const dummyPillar: Pillar = { stem: '갑', branch: '자', name: '갑자' };
    const dummyDaewoon: SingleDaewoon = {
      step: 1,
      startAge: 1,
      endAge: 10,
      startYear: 2000,
      endYear: 2009,
      pillar: dummyPillar,
    };
    return {
      daewoon_result: {
        isForward: true,
        directionReason: '',
        daewoonNumber: 1,
        targetMajorTerm: { name: '', exactDateTimeKST: '', diffDays: 0 },
        daewoonList: [dummyDaewoon],
      },
      current_daewoon: dummyDaewoon,
      current_sewoon: dummyPillar,
      current_wolwoon: dummyPillar,
      current_ilwoon: dummyPillar,
      activation: {
        targetDateStr: input.target_date,
        daewoon: {} as any,
        sewoon: {} as any,
        wolwoon: {} as any,
        ilwoon: {} as any,
        totalActivationScore: 50,
        overlapBonus: 0,
        cancellationPenalty: 0,
        finalActivationScore: 50,
        activeTenGodTheme: '',
        volatilityTrigger: false,
        clashTriggerCount: 0,
        harmonyTriggerCount: 0,
      },
      time_dependency: {
        requires_hour: true,
        time_dependency: 100,
        is_missing_hour: true,
        notes: errorReason,
      },
    };
  }
}
