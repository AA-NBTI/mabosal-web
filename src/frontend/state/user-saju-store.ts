/**
 * 사용자 사주 프로필 영구 저장 및 리포트 자동 복원(Rehydration) 매니저
 * 
 * 원칙:
 * 1. 사용자가 사주 정보를 한 번이라도 입력하면 LocalStorage('mm_user_saju_profile')에 영구 보존합니다.
 * 2. 결제 완료 후 또는 마이페이지에서 '리포트 열람' 클릭 시, 사주 입력창으로 되돌아가지 않고
 *    보존된 사주 정보를 바탕으로 즉시 리포트(Phase 83 4단계 결과물 및 세션)를 동기 복원하여 결과 화면을 표시합니다.
 */

import { appState, ProductTierTab } from './app-state.js';
import { AuthService } from './auth-service.js';
import { generateAllProductOutputs, CommonCaseInput } from '../../modules/product-output/index.js';
import { MabosalSessionEngine } from '../../modules/phase13/mabosal-session.js';
import type { MabosalSessionState } from '../../modules/phase13/phase13-types.js';
import { ReportRouterMapper } from '../modules/checkout/report-router-mapper.js';
import { getStorage, readJson, writeJson, removeKey, PersistenceKeys } from '../modules/persistence/index.js';
import { getIdentity } from '../modules/identity/index.js';
import { profileStorageKey, resolveProfileOwnerId, normalizeBirthDate, normalizeBirthTime } from '../modules/saju-profile/profile-core.js';
import { resolveOrderForView, hasEntitlement } from '../modules/entitlement/entitlement-core.js';

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
   * 계정별 독립 저장소 키 산출
   */
  /** 프로필 소유자 id 단일 결정 (id/username 어느 쪽을 받아도 account.id 로 정규화) */
  private static ownerId(userId?: string): string {
    const me = getIdentity();
    return resolveProfileOwnerId(userId, AuthService.getAllAccounts(), {
      id: me.userId || '',
      username: me.username,
      isGuest: me.isGuest,
    });
  }

  private static getStorageKey(userId?: string): string {
    return profileStorageKey(this.ownerId(userId));
  }

  /**
   * 사용자 사주 프로필을 LocalStorage에 영구 보존 (계정별 독립 저장)
   */
  public static saveProfile(profile: Partial<UserSajuProfile>, targetUserId?: string): UserSajuProfile {
    const ownerId = this.ownerId(targetUserId);
    const me = getIdentity();
    const existing = this.getProfile(ownerId);
    const base = existing || {
      ...DEFAULT_USER_SAJU_PROFILE,
      userName: me.name || '의뢰인',
    };

    const merged: UserSajuProfile = {
      ...base,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    writeJson(profileStorageKey(ownerId), merged);
    // 비로그인 하위호환 키는 게스트 프로필에만 사용 (회원 데이터가 전역 키로 새지 않게 함)
    if (ownerId === 'guest') writeJson(STORAGE_KEY_USER_SAJU, merged);

    // appState 메모리 필드 동기화 (현재 로그인 사용자 본인 프로필일 때만)
    const isCurrent = ownerId === (me.userId || 'guest');
    if (isCurrent) {
      if (merged.userName) appState.setUserName(merged.userName);
      if (merged.gender) appState.setGender(merged.gender);
      if (merged.calendarType) appState.setCalendarType(merged.calendarType);
      if (merged.isLeapMonth !== undefined) appState.setLeapMonth(merged.isLeapMonth);
      if (merged.userTroubleText) appState.setUserTroubleText(merged.userTroubleText);
      if (merged.desiredQuestion) appState.setDesiredQuestion(merged.desiredQuestion);
    }

    return merged;
  }

  /**
   * 단일 진실 공급원(SSOT) 사주 프로필, 계정 및 세션 일괄 동기화
   */
  public static syncUserSajuProfile(params: {
    userId?: string;
    userName?: string;
    birthDate: string; // YYYY-MM-DD 또는 YYYYMMDD
    birthTime?: string | null;
    calendarType?: 'solar' | 'lunar';
    isLeapMonth?: boolean;
    gender?: 'male' | 'female';
    birthRegion?: string;
    userTroubleText?: string;
  }): MabosalSessionState | null {
    // 가입 · 온보딩 · 회원정보 수정이 모두 통과하는 단일 입력점
    const date = normalizeBirthDate(params.birthDate);
    if (!date) return null;

    const me = getIdentity();
    const ownerId = this.ownerId(params.userId);
    const time = normalizeBirthTime(params.birthTime);
    const name = (params.userName || me.name || '의뢰인').trim();
    const calendarType = params.calendarType || 'solar';
    const isLeapMonth = params.isLeapMonth || false;
    const gender = params.gender || 'male';

    // 1. 계정(AuthService) 동기화 - 본인 계정일 때만
    if (ownerId === me.userId) {
      AuthService.updateProfile({
        name,
        birthDate: date.iso,
        birthTime: time || undefined,
        calendarType,
        isLeapMonth,
        gender,
      });
    }

    // 2. 사주 프로필 영구 보존 (키 = account.id)
    this.saveProfile({
      userName: name,
      solarBirthDate: date.iso,
      birthYear: date.year,
      birthMonth: date.month,
      birthDay: date.day,
      birthTime: time,
      isUnknownTime: !time,
      gender,
      calendarType,
      isLeapMonth,
      birthRegion: params.birthRegion || 'Seoul',
      ...(params.userTroubleText !== undefined ? { userTroubleText: params.userTroubleText } : {}),
    }, ownerId);

    // 3. 과거 세션 캐시 파기 후 새 세션 즉시 계산
    appState.clearSession();
    const newSession = this.calculateSessionForUser(ownerId);
    if (newSession) {
      appState.setSession(newSession);
    }
    return newSession;
  }

  /**
   * 보존된 사주 프로필 불러오기 (호환용 alias)
   */
  public static getSajuProfile(targetUserId?: string): UserSajuProfile | null {
    return this.getProfile(targetUserId);
  }

  /**
   * 보존된 사주 프로필 불러오기 (계정별 분리 조회)
   */
  public static getProfile(targetUserId?: string): UserSajuProfile | null {
    const ownerId = this.ownerId(targetUserId);
    const key = profileStorageKey(ownerId);

    const saved = readJson<UserSajuProfile | null>(key, null);
    if (saved) return saved;

    // 게스트 전용 하위호환 키
    if (ownerId === 'guest') {
      return readJson<UserSajuProfile | null>(STORAGE_KEY_USER_SAJU, null);
    }

    const account = AuthService.getAllAccounts().find(a => a.id === ownerId);
    if (!account) return null;

    // 레거시 마이그레이션: 예전에는 username 키로 저장되었음 → account.id 키로 이전
    const legacyKey = profileStorageKey(account.username);
    const legacy = readJson<UserSajuProfile | null>(legacyKey, null);
    if (legacy) {
      writeJson(key, legacy);
      removeKey(legacyKey);
      return legacy;
    }

    // 계정에 등록된 생년월일이 있으면 프로필로 복원
    const date = normalizeBirthDate(account.birthDate);
    if (date) {
      const time = normalizeBirthTime(account.birthTime);
      const restored: UserSajuProfile = {
        ...DEFAULT_USER_SAJU_PROFILE,
        userName: account.name || '의뢰인',
        solarBirthDate: date.iso,
        birthYear: date.year,
        birthMonth: date.month,
        birthDay: date.day,
        birthTime: time,
        isUnknownTime: !time,
        gender: account.gender || 'male',
        calendarType: account.calendarType || 'solar',
        isLeapMonth: account.isLeapMonth || false,
        updatedAt: new Date().toISOString(),
      };
      writeJson(key, restored);
      return restored;
    }
    return null;
  }

  /**
   * 해당 이용자가 사주 정보(생년월일)를 정상 등록했는지 여부
   */
  public static hasSajuProfile(targetUserId?: string): boolean {
    const profile = this.getProfile(targetUserId);
    if (!profile) return false;
    if (!profile.solarBirthDate || profile.solarBirthDate.trim() === '') return false;
    return true;
  }

  /**
   * 보존된 프로필이 있으면 반환하고, 없으면 기본값 반환
   */
  public static getProfileOrDefault(targetUserId?: string): UserSajuProfile {
    const profile = this.getProfile(targetUserId) || { ...DEFAULT_USER_SAJU_PROFILE };
    const currentUser = AuthService.getCurrentUser();
    if (currentUser?.name && (!profile.userName || profile.userName === '의뢰인')) {
      profile.userName = currentUser.name;
    }
    return profile;
  }

  /**
   * 현재 로그인 회원의 사주 세션(sajuCore, signal, relationship)을 실시간 동기 계산
   */
  public static calculateSessionForUser(targetUserId?: string): MabosalSessionState | null {
    const profile = this.getProfile(targetUserId);
    if (!profile || !profile.solarBirthDate) return null;

    try {
      const birthTime = profile.isUnknownTime ? null : (profile.birthTime || null);
      const sessionEngine = new MabosalSessionEngine();
      const res = sessionEngine.createSession({
        birthDate: profile.solarBirthDate,
        birthTime: birthTime,
        gender: profile.gender || 'male',
        region: profile.birthRegion || 'Seoul',
      });

      if (res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('[UserSajuStore] 실시간 사주 세션 계산 경고:', e);
    }
    return null;
  }

  /**
   * 특정 주문(Order)에 귀속된 고객 사주 스냅샷을 기반으로 맞춤 리포트를 즉시 조립
   */
  public static ensureAnalysisReadyFromOrder(order: { buyerName?: string; reportTier?: string; sajuInput?: Partial<UserSajuProfile>; productId?: string }): void {
    if (getIdentity().isGuest) return; // 비로그인은 주문 기반 복원 불가
    const defaultProfile = this.getProfileOrDefault();
    const currentUser = AuthService.getCurrentUser();
    const customerName = (order.sajuInput?.userName && order.sajuInput.userName !== '의뢰인')
      ? order.sajuInput.userName
      : (order.buyerName && order.buyerName !== '의뢰인' ? order.buyerName : (currentUser?.name || defaultProfile.userName || '의뢰인'));
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

    const paidOrders = readJson<any[]>(PersistenceKeys.orders, []);
    const entitled = targetTier === 'FREE' ? false : hasEntitlement(paidOrders, getIdentity(), (o: any) =>
      ReportRouterMapper.resolveTier(o.productId, o.reportTier) === targetTier);
    appState.setPaidUser(entitled);
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
      console.warn('[UserSajuStore] 주문 맞춤 리포트 생성 경고:', err);
    }
  }

  /**
   * 리포트 열람을 위해 분석 데이터(SessionState 및 Phase 83 ProductOutputSet)가
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
   * 새로고침 시 고객이 직전에 보던 특정 상품 리포트를 100% 온전하게 복원
   */
  public static restoreLastActiveAnalysis(orderIdParam?: string | null, tierParam?: string | null): void {
    const me = getIdentity();
    // 비로그인은 어떤 경우에도 타인/과거 주문을 복원하지 않는다
    if (me.isGuest) {
      this.ensureAnalysisReady('FREE');
      return;
    }

    try {
      const orders = readJson<any[]>(PersistenceKeys.orders, []);
      const lastId = getStorage().getItem('mm_last_active_order_id');
      // 지정/직전 주문이 본인 소유가 아니면 본인의 최신 결제 완료 주문으로 대체
      const found = resolveOrderForView(orders, me, orderIdParam || lastId) || resolveOrderForView(orders, me, null);
      if (found) {
        this.ensureAnalysisReadyFromOrder(found);
        return;
      }
      this.ensureAnalysisReady((tierParam || 'FREE') as ProductTierTab);
    } catch (err) {
      console.warn('[UserSajuStore] restoreLastActiveAnalysis 복원 중 예외:', err);
      this.ensureAnalysisReady('FREE');
    }
  }
}
