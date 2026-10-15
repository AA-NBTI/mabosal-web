/**
 * 사용자 사주 프로필 영구 저장 및 감정서 자동 복원(Rehydration) 매니저
 * 
 * 원칙:
 * 1. 사용자가 사주 정보를 한 번이라도 입력하면 LocalStorage('mm_user_saju_profile')에 영구 보존합니다.
 * 2. 결제 완료 후 또는 마이페이지에서 '감정서 열람' 클릭 시, 사주 입력창으로 되돌아가지 않고
 *    보존된 사주 정보를 바탕으로 즉시 감정서(Phase 83 4단계 결과물 및 세션)를 동기 복원하여 결과 화면을 표시합니다.
 */

import { appState, ProductTierTab } from './app-state.js';
import { AuthService } from './auth-service.js';
import { generateAllProductOutputs, CommonCaseInput } from '../../modules/product-output/index.js';
import { MabosalSessionEngine } from '../../modules/phase13/mabosal-session.js';
import { ReportRouterMapper } from '../modules/checkout/report-router-mapper.js';

export interface UserSajuProfile {
  userName: string;
  solarBirthDate: string; // e.g. "1993-08-15"
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthTime: string | null;
  isUnknownTime: boolean;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  birthRegion: string;
  userTroubleText: string;
  desiredQuestion: string;
  updatedAt: string;
}

const STORAGE_KEY_USER_SAJU = 'mm_user_saju_profile';

export const DEFAULT_USER_SAJU_PROFILE: UserSajuProfile = {
  userName: '의뢰인',
  solarBirthDate: '1993-08-15',
  birthYear: 1993,
  birthMonth: 8,
  birthDay: 15,
  birthTime: '14:30',
  isUnknownTime: false,
  gender: 'male',
  calendarType: 'solar',
  isLeapMonth: false,
  birthRegion: '서울',
  userTroubleText: '특별한 문제는 없고 올해 전체적인 운의 흐름과 기회를 알고 싶어요.',
  desiredQuestion: '앞으로 어떤 선택을 하는 것이 가장 유리할까요?',
  updatedAt: new Date().toISOString(),
};

export class UserSajuStore {
  /**
   * 사용자 사주 프로필을 LocalStorage에 영구 보존
   */
  public static saveProfile(profile: Partial<UserSajuProfile>): UserSajuProfile {
    const existing = this.getProfile() || DEFAULT_USER_SAJU_PROFILE;
    const merged: UserSajuProfile = {
      ...existing,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY_USER_SAJU, JSON.stringify(merged));
      } catch (err) {
        console.warn('[UserSajuStore] 프로필 저장 실패:', err);
      }
    }

    // appState 메모리 필드 동기화
    if (merged.userName) appState.setUserName(merged.userName);
    if (merged.gender) appState.setGender(merged.gender);
    if (merged.calendarType) appState.setCalendarType(merged.calendarType);
    if (merged.isLeapMonth !== undefined) appState.setLeapMonth(merged.isLeapMonth);
    if (merged.userTroubleText) appState.setUserTroubleText(merged.userTroubleText);
    if (merged.desiredQuestion) appState.setDesiredQuestion(merged.desiredQuestion);

    return merged;
  }

  /**
   * 보존된 사주 프로필 불러오기
   */
  public static getProfile(): UserSajuProfile | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER_SAJU);
      if (!raw) return null;
      return JSON.parse(raw) as UserSajuProfile;
    } catch {
      return null;
    }
  }

  /**
   * 보존된 프로필이 있으면 반환하고, 없으면 기본값 반환
   * (로그인 상태일 경우 로그인 회원 이름을 기본 프로필 이름으로 자동 동기화)
   */
  public static getProfileOrDefault(): UserSajuProfile {
    const profile = this.getProfile() || { ...DEFAULT_USER_SAJU_PROFILE };
    const currentUser = AuthService.getCurrentUser();
    if (currentUser?.name && (!profile.userName || profile.userName === '의뢰인')) {
      profile.userName = currentUser.name;
    }
    return profile;
  }

  /**
   * 특정 주문(Order)에 귀속된 고객 사주 스냅샷을 기반으로 맞춤 감정서를 즉시 조립
   */
  public static ensureAnalysisReadyFromOrder(order: { buyerName?: string; reportTier?: string; sajuInput?: Partial<UserSajuProfile>; productId?: string }): void {
    const defaultProfile = this.getProfileOrDefault();
    const currentUser = AuthService.getCurrentUser();
    const customerName = (order.sajuInput?.userName && order.sajuInput.userName !== '의뢰인')
      ? order.sajuInput.userName
      : (order.buyerName && order.buyerName !== '의뢰인' ? order.buyerName : (currentUser?.name || defaultProfile.userName || '김서연'));
    const profile: UserSajuProfile = {
      ...DEFAULT_USER_SAJU_PROFILE,
      ...defaultProfile,
      ...(order.sajuInput || {}),
      userName: customerName,
    };

    // 상품 전용 티어 결정 (신년운세, 직장운, 재물운, 궁합 등 1:1 직결)
    const targetTier: ProductTierTab = ReportRouterMapper.resolveTier(order.productId, order.reportTier);

    // 활성 주문 및 티어 영구 보존 (새로고침 시 100% 온전 복원용)
    if (typeof localStorage !== 'undefined') {
      if ((order as any).orderId) {
        localStorage.setItem('mm_last_active_order_id', (order as any).orderId);
      }
      localStorage.setItem('mm_last_active_tier', targetTier);
    }

    // 상태 동기화
    appState.setUserName(customerName);
    if (profile.gender) appState.setGender(profile.gender);
    if (profile.calendarType) appState.setCalendarType(profile.calendarType);
    if (profile.isLeapMonth !== undefined) appState.setLeapMonth(profile.isLeapMonth);
    if (profile.userTroubleText) appState.setUserTroubleText(profile.userTroubleText);

    appState.setPaidUser(true);
    appState.setActiveTierTab(targetTier);

    try {
      // 1. 고객 전용 4단계 상품 출력 세트 생성
      const commonInput: CommonCaseInput = {
        solarBirthDate: profile.solarBirthDate,
        birthTime: profile.birthTime || null,
        isUnknownTime: profile.isUnknownTime,
        gender: profile.gender,
        calendarType: profile.calendarType,
        isLeapMonth: profile.isLeapMonth,
        birthRegion: profile.birthRegion || '서울',
        coreTrouble: profile.userTroubleText || `${customerName} 님의 평생 사주 운의 흐름과 기회를 알고 싶어요.`,
        desiredQuestion: profile.desiredQuestion || '앞으로 어떤 선택을 하는 것이 가장 유리할까요?',
        targetYear: new Date().getFullYear(),
      };

      const productSet = generateAllProductOutputs(commonInput);
      appState.setProductOutputSet(productSet);

      // 2. 고객 전용 Phase 13 세션 엔진 구동
      const sessionEngine = new MabosalSessionEngine();
      const sessionRes = sessionEngine.createSession({
        birthDate: profile.solarBirthDate,
        birthTime: profile.birthTime || undefined,
        gender: profile.gender,
        region: profile.birthRegion,
        depthMode: 'DEEP',
      });

      if (sessionRes.success && sessionRes.data) {
        appState.setSession(sessionRes.data);
      }
    } catch (err) {
      console.warn('[UserSajuStore] 주문 맞춤 감정서 생성 경고:', err);
    }
  }

  /**
   * 감정서 열람을 위해 분석 데이터(SessionState 및 Phase 83 ProductOutputSet)가
   * appState에 완전히 적재되어 있는지 검사하고, 비어 있으면 저장된 사주를 바탕으로 즉시 복원 생성
   */
  public static ensureAnalysisReady(targetTier: ProductTierTab = 'PAID'): void {
    const state = appState.getState();
    const profile = this.getProfileOrDefault();

    // 프로필의 기본 인적 정보 동기화
    if (!state.userName && profile.userName) appState.setUserName(profile.userName);
    if (profile.gender) appState.setGender(profile.gender);
    if (profile.calendarType) appState.setCalendarType(profile.calendarType);
    if (profile.isLeapMonth !== undefined) appState.setLeapMonth(profile.isLeapMonth);
    if (profile.userTroubleText) appState.setUserTroubleText(profile.userTroubleText);

    // 유료 열람 권한 및 티어 탭 설정
    appState.setPaidUser(true);
    appState.setActiveTierTab(targetTier);

    // 만약 이미 세션과 상품 출력 세트가 온전히 존재한다면 추가 연산 없이 완료
    if (state.productOutputSet && state.sessionState) {
      return;
    }

    try {
      // 1. Phase 83 4단계 상품 출력 세트 생성
      const commonInput: CommonCaseInput = {
        solarBirthDate: profile.solarBirthDate,
        birthTime: profile.birthTime || null,
        isUnknownTime: profile.isUnknownTime,
        gender: profile.gender,
        calendarType: profile.calendarType,
        isLeapMonth: profile.isLeapMonth,
        birthRegion: profile.birthRegion || '서울',
        coreTrouble: profile.userTroubleText || '올해 전반적인 운의 흐름과 기회를 알고 싶어요.',
        desiredQuestion: profile.desiredQuestion || '앞으로 어떤 선택을 하는 것이 가장 유리할까요?',
        targetYear: new Date().getFullYear(),
      };

      const productSet = generateAllProductOutputs(commonInput);
      appState.setProductOutputSet(productSet);

      // 2. Phase 13 세션 엔진 구동
      const sessionEngine = new MabosalSessionEngine();
      const sessionRes = sessionEngine.createSession({
        birthDate: profile.solarBirthDate,
        birthTime: profile.birthTime || undefined,
        gender: profile.gender,
        region: profile.birthRegion,
        depthMode: 'DEEP',
      });

      if (sessionRes.success && sessionRes.data) {
        appState.setSession(sessionRes.data);
      }
    } catch (err) {
      console.warn('[UserSajuStore] 자동 복원 엔진 구동 중 경고:', err);
    }
  }

  /**
   * 새로고침 시 고객이 직전에 보던 특정 상품 감정서를 100% 온전하게 복원
   */
  public static restoreLastActiveAnalysis(orderIdParam?: string | null, tierParam?: string | null): void {
    if (typeof localStorage === 'undefined') {
      this.ensureAnalysisReady('PAID');
      return;
    }

    try {
      const rawOrders = localStorage.getItem('mabosal_store_orders');
      const allOrders: any[] = rawOrders ? JSON.parse(rawOrders) : [];
      const targetOrderId = orderIdParam || localStorage.getItem('mm_last_active_order_id');

      // 1. 주문 ID로 매칭되는 주문 복원
      if (targetOrderId) {
        const found = allOrders.find(o => o.orderId === targetOrderId);
        if (found) {
          this.ensureAnalysisReadyFromOrder(found);
          return;
        }
      }

      // 2. 가장 최근에 완료된 고객 주문이 있는지 탐색
      const latestCompleted = allOrders.find(o => o.status === 'completed');
      if (latestCompleted) {
        this.ensureAnalysisReadyFromOrder(latestCompleted);
        return;
      }

      // 3. 주문이 없으면 보존된 티어 또는 파라미터 기반 복원
      const savedTier = (tierParam || localStorage.getItem('mm_last_active_tier') || 'PAID') as ProductTierTab;
      this.ensureAnalysisReady(savedTier);
    } catch (err) {
      console.warn('[UserSajuStore] restoreLastActiveAnalysis 복원 중 예외:', err);
      this.ensureAnalysisReady('PAID');
    }
  }
}
