/**
 * Phase 35 & 38: Auth, Payment & Session Caching Service
 * 
 * 1. Supabase Auth 및 사용자 프로필 관리
 * 2. 동일 사주(생년월일 + 시간 + 성별 + 출생지) 반복 입력 시 기존 분석 재활용 (Profile Cache)
 * 3. 결제 상품 티어 (무료 / 정밀 사주 39,000원 / 마보살 정밀풀이 149,000원 / 디지털 처방 19,000원)
 * 4. 서버사이드 결제 검증 및 중복 결제 방지
 * 5. 세션 복구 및 권한 잠금 해제
 */

import { ProductTier } from '../phase17_25/types.js';

export interface UserAccount {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
  readonly isAnonymous: boolean;
}

export interface SajuProfileRecord {
  readonly profileId: string;
  readonly userId: string;
  readonly sajuKey: string; // birthDate_time_calendar_gender_region
  readonly birthData: {
    readonly calendarType: 'solar' | 'lunar';
    readonly isLeapMonth: boolean;
    readonly birthDate: string;
    readonly birthTime: string;
    readonly isUnknownTime: boolean;
    readonly gender: 'male' | 'female';
    readonly region: string;
  };
  readonly userTrouble: {
    readonly category: string;
    readonly text: string;
  };
  readonly unlockedTiers: ProductTier[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly analysisCache: Record<string, any>;
}

export interface PaymentTransaction {
  readonly transactionId: string;
  readonly userId: string;
  readonly profileId: string;
  readonly tier: ProductTier;
  readonly amountKrw: number;
  readonly status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  readonly paymentMethod: 'card' | 'kakaopay' | 'toss' | 'naverpay';
  readonly createdAt: string;
  readonly completedAt?: string;
  readonly receiptUrl?: string;
}

export class AuthPaymentService {
  private users: Map<string, UserAccount> = new Map();
  private profiles: Map<string, SajuProfileRecord> = new Map();
  private transactions: Map<string, PaymentTransaction> = new Map();
  private currentUser: UserAccount | null = null;

  constructor() {
    // 기본 게스트 세션 초기화
    this.createAnonymousUser();
  }

  /**
   * 익명 게스트 세션 생성 (비회원 무료 진단 지원)
   */
  public createAnonymousUser(): UserAccount {
    const user: UserAccount = {
      id: `anon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: 'guest@mabosal.local',
      createdAt: new Date().toISOString(),
      isAnonymous: true,
    };
    this.users.set(user.id, user);
    this.currentUser = user;
    return user;
  }

  /**
   * 회원가입 또는 로그인
   */
  public signInWithEmail(email: string): UserAccount {
    const existing = Array.from(this.users.values()).find(u => u.email === email);
    if (existing) {
      this.currentUser = existing;
      return existing;
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email,
      createdAt: new Date().toISOString(),
      isAnonymous: false,
    };
    this.users.set(newUser.id, newUser);
    this.currentUser = newUser;
    return newUser;
  }

  public getCurrentUser(): UserAccount {
    if (!this.currentUser) {
      return this.createAnonymousUser();
    }
    return this.currentUser;
  }

  /**
   * 사주 고유 캐시 키 생성 (동일 사주 반복 입력 감지용)
   */
  public generateSajuKey(params: {
    calendarType: 'solar' | 'lunar';
    isLeapMonth: boolean;
    birthDate: string;
    birthTime: string;
    isUnknownTime: boolean;
    gender: 'male' | 'female';
    region: string;
  }): string {
    const timeKey = params.isUnknownTime ? 'UNKNOWN' : params.birthTime;
    return `${params.calendarType}_${params.isLeapMonth ? 'LEAP' : 'NORM'}_${params.birthDate}_${timeKey}_${params.gender}_${params.region}`;
  }

  /**
   * 캐시된 사주 프로필 검색 또는 신규 등록
   */
  public getOrCreateSajuProfile(params: {
    birthData: SajuProfileRecord['birthData'];
    userTrouble: SajuProfileRecord['userTrouble'];
    analysisData?: any;
  }): { profile: SajuProfileRecord; isCached: boolean } {
    const sajuKey = this.generateSajuKey(params.birthData);
    const user = this.getCurrentUser();

    // 1. 동일 사용자의 동일 사주 프로필이 이미 존재하는지 확인 (캐싱)
    const existing = Array.from(this.profiles.values()).find(
      p => p.userId === user.id && p.sajuKey === sajuKey
    );

    if (existing) {
      // 고민 내용이 달라진 경우 업데이트
      if (existing.userTrouble.text !== params.userTrouble.text) {
        (existing as any).userTrouble = { ...params.userTrouble };
        (existing as any).updatedAt = new Date().toISOString();
      }
      return { profile: existing, isCached: true };
    }

    // 2. 신규 프로필 생성
    const newProfile: SajuProfileRecord = {
      profileId: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      sajuKey,
      birthData: { ...params.birthData },
      userTrouble: { ...params.userTrouble },
      unlockedTiers: ['free_diagnosis'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      analysisCache: params.analysisData || {},
    };

    this.profiles.set(newProfile.profileId, newProfile);
    return { profile: newProfile, isCached: false };
  }

  /**
   * 특정 프로필에서 상품 권한 확인
   */
  public isTierUnlocked(profileId: string, tier: ProductTier): boolean {
    if (tier === 'free_diagnosis') return true;
    const profile = this.profiles.get(profileId);
    if (!profile) return false;
    return profile.unlockedTiers.includes(tier) || profile.unlockedTiers.includes('paid_mabosal_full');
  }

  /**
   * 결제 주문 요청 생성
   */
  public createPaymentOrder(params: {
    profileId: string;
    tier: ProductTier;
    paymentMethod: PaymentTransaction['paymentMethod'];
  }): PaymentTransaction {
    const user = this.getCurrentUser();
    const profile = this.profiles.get(params.profileId);
    if (!profile) {
      throw new Error(`Profile not found for ID: ${params.profileId}`);
    }

    let amount = 0;
    if (params.tier === 'paid_detailed_saju') amount = 39000;
    else if (params.tier === 'paid_mabosal_full') amount = 149000;
    else if (params.tier === 'paid_digital_talisman') amount = 19000;
    else if (params.tier === 'free_diagnosis') amount = 0;

    const tx: PaymentTransaction = {
      transactionId: `TX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      userId: user.id,
      profileId: params.profileId,
      tier: params.tier,
      amountKrw: amount,
      status: 'PENDING',
      paymentMethod: params.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    this.transactions.set(tx.transactionId, tx);
    return tx;
  }

  /**
   * 결제 승인 및 권한 해제 (서버사이드 영수증 검증 시뮬레이션)
   */
  public verifyAndCompletePayment(transactionId: string): {
    success: boolean;
    profile: SajuProfileRecord;
    transaction: PaymentTransaction;
  } {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (tx.status === 'COMPLETED') {
      const profile = this.profiles.get(tx.profileId)!;
      return { success: true, profile, transaction: tx };
    }

    const profile = this.profiles.get(tx.profileId);
    if (!profile) {
      throw new Error(`Profile ${tx.profileId} not found`);
    }

    // 중복 추가 방지하며 티어 해제
    if (!profile.unlockedTiers.includes(tx.tier)) {
      profile.unlockedTiers.push(tx.tier);
    }

    // 만약 149,000원 풀패키지를 구매한 경우 39,000원 티어도 자동 포함 해제
    if (tx.tier === 'paid_mabosal_full' && !profile.unlockedTiers.includes('paid_detailed_saju')) {
      profile.unlockedTiers.push('paid_detailed_saju');
    }

    const completedTx: PaymentTransaction = {
      ...tx,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      receiptUrl: `https://mabosal.com/receipts/${tx.transactionId}`,
    };

    this.transactions.set(transactionId, completedTx);

    return {
      success: true,
      profile,
      transaction: completedTx,
    };
  }

  /**
   * 결제 실패 처리 (카드 한도 초과, 인증 실패 등)
   */
  public simulatePaymentFailure(transactionId: string, reason: string = '사용자 취소 또는 카드 한도 초과'): PaymentTransaction {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const failedTx: PaymentTransaction = {
      ...tx,
      status: 'FAILED',
    };
    this.transactions.set(transactionId, failedTx);
    return failedTx;
  }

  /**
   * 사용자 로그아웃 처리
   */
  public signOut(): void {
    this.currentUser = this.createAnonymousUser();
  }

  /**
   * 재로그인 시 구매 결과 및 언락 티어 전체 복구 (Scenario D)
   */
  public restoreUserPurchases(email: string): { user: UserAccount; restoredProfiles: SajuProfileRecord[] } {
    const user = this.signInWithEmail(email);
    const userProfiles = Array.from(this.profiles.values()).filter(p => p.userId === user.id);

    // 완료된 결제 건을 스캔하여 프로필의 언락 티어 권한 보장
    const userCompletedTxs = Array.from(this.transactions.values()).filter(
      t => t.userId === user.id && t.status === 'COMPLETED'
    );

    for (const tx of userCompletedTxs) {
      const profile = this.profiles.get(tx.profileId);
      if (profile) {
        if (!profile.unlockedTiers.includes(tx.tier)) {
          profile.unlockedTiers.push(tx.tier);
        }
        if (tx.tier === 'paid_mabosal_full' && !profile.unlockedTiers.includes('paid_detailed_saju')) {
          profile.unlockedTiers.push('paid_detailed_saju');
        }
      }
    }

    return {
      user,
      restoredProfiles: userProfiles,
    };
  }

  /**
   * 사용자 소유의 모든 프로필 목록 조회
   */
  public getUserProfiles(userId?: string): SajuProfileRecord[] {
    const targetUserId = userId || this.getCurrentUser().id;
    return Array.from(this.profiles.values()).filter(p => p.userId === targetUserId);
  }
}

export const authPaymentService = new AuthPaymentService();

