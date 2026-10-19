/**
 * Yeopjeon Tracker State (엽전 및 데일리 마기 방어 기록 상태 관리자)
 * 
 * LocalStorage 기반 영구 보존:
 * - 날짜별 방비 실천 완료 기록
 * - 누적 엽전 포인트 잔액 및 스트릭(Streak)
 * - 방어한 마기 유형 히스토리 누적 및 월별/연간 통계 집계
 */

import { YeopjeonEngine, StreakEvaluationResult } from '../../modules/daily-fortune/yeopjeon-engine.js';
import { getIdentity } from '../modules/identity/index.js';
import { getStorage } from '../modules/persistence/index.js';

export interface DailyDefenseRecord {
  date: string; // YYYY-MM-DD
  zodiacKey: string;
  birthYear: number;
  magaType: string;
  defenseActionText: string;
  earnedYeopjeon: number;
  completedAt: number; // timestamp
}

export interface MonthlyDefenseSummary {
  year: number;
  month: number;
  completedDaysCount: number;
  totalDaysInMonth: number;
  earnedYeopjeonInMonth: number;
  completedDatesSet: Set<string>; // YYYY-MM-DD
  topDefendedMagaTypes: Array<{ type: string; count: number }>;
  insightReport: string;
}

const STORAGE_KEY = 'mabosal_yeopjeon_tracker_v1';

export class YeopjeonTrackerState {
  private static instance: YeopjeonTrackerState;

  public totalYeopjeon: number = 0;
  public currentStreak: number = 0;
  public maxStreak: number = 0;
  public lastCompletedDate: string | null = null;
  public records: Record<string, DailyDefenseRecord> = {};
  public isMemberUnlocked: boolean = false; // 회원가입/로그인 여부 (마기/방비 열람 권한)

  private constructor() {
    this.loadFromStorage();
  }

  public static getStorageKey(): string {
    const me = getIdentity();
    const ownerId = me.isGuest ? 'guest' : (me.userId || 'guest');
    return `${STORAGE_KEY}_${ownerId}`;
  }

  public static getInstance(): YeopjeonTrackerState {
    if (!YeopjeonTrackerState.instance) {
      YeopjeonTrackerState.instance = new YeopjeonTrackerState();
    }
    return YeopjeonTrackerState.instance;
  }

  /** 계정 전환 시 최신 데이터로 인메모리 상태 재동기화 */
  public reload(): void {
    this.loadFromStorage();
  }

  public loadFromStorage(): void {
    try {
      const key = YeopjeonTrackerState.getStorageKey();
      const raw = getStorage().getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.totalYeopjeon = parsed.totalYeopjeon || 0;
        this.currentStreak = parsed.currentStreak || 0;
        this.maxStreak = parsed.maxStreak || 0;
        this.lastCompletedDate = parsed.lastCompletedDate || null;
        this.records = parsed.records || {};
        this.isMemberUnlocked = parsed.isMemberUnlocked ?? false;
      } else {
        this.totalYeopjeon = 0;
        this.currentStreak = 0;
        this.maxStreak = 0;
        this.lastCompletedDate = null;
        this.records = {};
        this.isMemberUnlocked = false;
      }
    } catch (e) {
      console.warn('YeopjeonTrackerState load error:', e);
    }
  }

  public saveToStorage(): void {
    try {
      const key = YeopjeonTrackerState.getStorageKey();
      const payload = {
        totalYeopjeon: this.totalYeopjeon,
        currentStreak: this.currentStreak,
        maxStreak: this.maxStreak,
        lastCompletedDate: this.lastCompletedDate,
        records: this.records,
        isMemberUnlocked: this.isMemberUnlocked,
      };
      getStorage().setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('YeopjeonTrackerState save error:', e);
    }
  }

  /**
   * 오늘 방비 완료 여부 확인
   */
    public getBalance(): number {
    return this.totalYeopjeon;
  }

  public get history(): any[] {
    return Object.values(this.records || {});
  }

  public get isMember(): boolean {
    return this.isMemberUnlocked;
  }

  public isCompletedToday(targetDate: Date = new Date()): boolean {
    return this.isTodayCompleted(targetDate);
  }

  public isActionCompletedToday(actionKey?: string, targetDate: Date = new Date()): boolean {
    return this.isTodayCompleted(targetDate);
  }

  public isTodayCompleted(targetDate: Date = new Date()): boolean {
    const todayStr = YeopjeonEngine.getTodayDateString(targetDate);
    return !!this.records[todayStr];
  }

  /**
   * 회원가입/로그인 언락 처리
   */
  public unlockMemberAccess(): void {
    this.isMemberUnlocked = true;
    this.saveToStorage();
  }

  /**
   * 오늘 방비 실천 완료 및 엽전 적립
   */
  public completeTodayDefense(
    zodiacKey: string,
    birthYear: number,
    magaType: string,
    defenseActionText: string,
    targetDate: Date = new Date()
  ): {
    success: boolean;
    evalResult: StreakEvaluationResult;
    alreadyCompleted: boolean;
  } {
    const todayStr = YeopjeonEngine.getTodayDateString(targetDate);
    const evalResult = YeopjeonEngine.evaluateDailyReward(
      this.lastCompletedDate,
      this.currentStreak,
      targetDate
    );

    if (evalResult.isAlreadyCompletedToday) {
      return { success: false, evalResult, alreadyCompleted: true };
    }

    // 기록 추가 및 포인트 누적
    const record: DailyDefenseRecord = {
      date: todayStr,
      zodiacKey,
      birthYear,
      magaType,
      defenseActionText,
      earnedYeopjeon: evalResult.totalReward,
      completedAt: Date.now(),
    };

    this.records[todayStr] = record;
    this.totalYeopjeon += evalResult.totalReward;
    this.currentStreak = evalResult.newStreak;
    this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
    this.lastCompletedDate = todayStr;

    this.saveToStorage();

    return {
      success: true,
      evalResult,
      alreadyCompleted: false,
    };
  }

  /**
   * 특정 월의 방어 히스토리 및 마기 패턴 통계 산출
   */
  public getMonthlySummary(year: number, month: number): MonthlyDefenseSummary {
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const completedDatesSet = new Set<string>();
    const magaCounts: Record<string, number> = {};
    let earnedYeopjeonInMonth = 0;

    Object.values(this.records).forEach((rec) => {
      if (rec.date.startsWith(prefix)) {
        completedDatesSet.add(rec.date);
        earnedYeopjeonInMonth += rec.earnedYeopjeon;
        magaCounts[rec.magaType] = (magaCounts[rec.magaType] || 0) + 1;
      }
    });

    const topDefendedMagaTypes = Object.entries(magaCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    let insightReport = '아직 이 달의 방어 기록이 충분하지 않습니다. 매일 실천을 쌓아보세요.';
    if (topDefendedMagaTypes.length > 0) {
      const top1 = topDefendedMagaTypes[0];
      insightReport = `이번 달은 [${top1.type}]을(를) 총 ${top1.count}회 방어하여 가장 큰 위기를 사전 차단했습니다.`;
    }

    return {
      year,
      month,
      completedDaysCount: completedDatesSet.size,
      totalDaysInMonth,
      earnedYeopjeonInMonth,
      completedDatesSet,
      topDefendedMagaTypes,
      insightReport,
    };
  }
}

export const yeopjeonTracker = YeopjeonTrackerState.getInstance();
