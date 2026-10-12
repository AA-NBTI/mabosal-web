/**
 * Yeopjeon Reward & Streak Engine (엽전 포인트 및 연속 실천 보상 엔진)
 * 
 * 원칙:
 * 1. 일일 방비 실천 완료 시 기본 1냥 적립
 * 2. 연속 실천(Streak) 달성 시 특별 보너스 엽전 지급 (3일: +2냥, 7일: +5냥, 30일: +20냥)
 * 3. 날짜 연속성 엄밀 검증 및 연속 일수 계산
 */

export interface StreakEvaluationResult {
  isAlreadyCompletedToday: boolean;
  newStreak: number;
  baseReward: number;
  bonusReward: number;
  totalReward: number;
  bonusMessage?: string;
  badgeTitle: string;
}

export class YeopjeonEngine {
  /**
   * 오늘 날짜 문자열 YYYY-MM-DD
   */
  public static getTodayDateString(targetDate: Date = new Date()): string {
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 두 날짜 간의 일수 차이 계산
   */
  public static getDaysDifference(prevDateStr: string, currentDateStr: string): number {
    const prev = new Date(`${prevDateStr}T00:00:00Z`).getTime();
    const curr = new Date(`${currentDateStr}T00:00:00Z`).getTime();
    return Math.round((curr - prev) / (1000 * 60 * 60 * 24));
  }

  /**
   * 스트릭 뱃지 타이틀 도출
   */
  public static getStreakBadgeTitle(streak: number): string {
    if (streak >= 30) return '30일 무결 방어의 도사';
    if (streak >= 14) return '2주 연속 쾌도난마';
    if (streak >= 7) return '7일 연속 수호 마스터';
    if (streak >= 3) return '3일 작심삼일 돌파사';
    return '마기 방비 입문자';
  }

  /**
   * 일일 방비 완료 시 엽전 보상 및 신규 스트릭 계산
   */
  public static evaluateDailyReward(
    lastCompletedDateStr: string | null,
    currentStreak: number,
    targetDate: Date = new Date()
  ): StreakEvaluationResult {
    const todayStr = this.getTodayDateString(targetDate);

    // 1. 이미 오늘 완료한 경우
    if (lastCompletedDateStr === todayStr) {
      return {
        isAlreadyCompletedToday: true,
        newStreak: currentStreak,
        baseReward: 0,
        bonusReward: 0,
        totalReward: 0,
        badgeTitle: this.getStreakBadgeTitle(currentStreak),
      };
    }

    // 2. 신규 스트릭 계산
    let newStreak = 1;
    if (lastCompletedDateStr) {
      const diff = this.getDaysDifference(lastCompletedDateStr, todayStr);
      if (diff === 1) {
        // 어제 완료하고 오늘 완료 -> 연속 지속!
        newStreak = currentStreak + 1;
      } else if (diff > 1) {
        // 2일 이상 경과 -> 스트릭 리셋 후 1일부터 재시작
        newStreak = 1;
      }
    }

    // 3. 보상 계산 (기본 1냥)
    const baseReward = 1;
    let bonusReward = 0;
    let bonusMessage: string | undefined;

    if (newStreak === 3) {
      bonusReward = 2;
      bonusMessage = '🎉 3일 연속 마기 방어 성공! 보너스 2냥 추가 적립!';
    } else if (newStreak === 7) {
      bonusReward = 5;
      bonusMessage = '🔥 7일 연속 수호 달성! 보너스 5냥 추가 적립!';
    } else if (newStreak === 14) {
      bonusReward = 10;
      bonusMessage = '⚡ 14일 연속 무결 수호! 보너스 10냥 추가 적립!';
    } else if (newStreak === 30) {
      bonusReward = 20;
      bonusMessage = '👑 30일 무결 방어의 도사 등극! 보너스 20냥 대박 적립!';
    }

    const totalReward = baseReward + bonusReward;
    const badgeTitle = this.getStreakBadgeTitle(newStreak);

    return {
      isAlreadyCompletedToday: false,
      newStreak,
      baseReward,
      bonusReward,
      totalReward,
      bonusMessage,
      badgeTitle,
    };
  }
}
