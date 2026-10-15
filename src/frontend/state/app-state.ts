/**
 * Phase 14~26: Frontend Application State Management
 * 
 * 원칙:
 * 1. View 상태, 분석 결과(ResultState), 상담 상태(ConsultationState), 리포트 모드(ReportState)를 분리 관리합니다.
 * 2. 원국 분석 결과(MabosalSessionState)는 상담(Consultation) 중에도 절대 변조되지 않습니다.
 * 3. Phase 17~25의 IntegratedAnalysisResult 및 상품 티어, 결제 상태를 보존합니다.
 * 4. 상태 변경 시 구독자에게 알림을 전송하는 경량 옵저버 패턴을 채택합니다.
 */

import { ConsultationAnswer } from '../../modules/phase11/phase11-types.js';
import { MabosalSessionState } from '../../modules/phase13/phase13-types.js';
import { ReportDepthMode } from '../../modules/phase10/phase10-types.js';
import { IntegratedAnalysisResult, ProductTier, CalendarType } from '../../modules/phase17_25/index.js';
import { GunghapAnalysisResult } from '../../modules/chemistry/gunghap-engine.js';

export type AppViewType = 'landing' | 'analyze' | 'loading' | 'result' | 'consult' | 'report' | 'partner' | 'admin' | 'member-dashboard' | 'magi-calendar' | 'lucky-calendar' | 'store' | 'study' | 'cart' | 'checkout';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mabosal';
  text: string;
  answer?: ConsultationAnswer;
  timestamp: string;
}

export interface ActiveTraceData {
  title: string;
  summary: string;
  signals: string[];
  activationStates: Record<string, string>;
  secondRelationships: string[];
  rsiBand: string;
  originFacts: string[];
}

export type ProductTierTab = 'FREE' | 'PAID' | 'CONFLICT_MALSAL' | 'PREMIUM' | 'YEAR_2027' | 'CHEMISTRY' | 'CAREER' | 'WEALTH' | 'LOVE_REUNION';

export interface AppStateData {
  currentView: AppViewType;
  sessionState: MabosalSessionState | null;
  integratedResult: IntegratedAnalysisResult | null;
  reportMode: ReportDepthMode;
  chatMessages: ChatMessage[];
  isAnalyzing: boolean;
  loadingStepText: string;
  activeTraceData: ActiveTraceData | null;
  errorMessage: string | null;
  // Phase 18~26 신규 상태
  calendarType: CalendarType;
  isLeapMonth: boolean;
  gender: 'male' | 'female';
  userName?: string;
  userTroubleText: string;
  selectedTier: ProductTier;
  isPaidUser: boolean;
  // Phase 78: 고객 상황 연결 및 심층 결과 상태
  selectedSituation: string;
  additionalContext: string;
  desiredQuestion: string;
  deepResult: any | null;
  // Phase 82: 15대 섹션 무결성 엔진 산출물
  latestProduct: any | null;
  // Phase 83: 4단계 상품 출력 세트
  productOutputSet: any | null;
  activeTierTab: ProductTierTab;
  calcResult?: any;
  gunghapResult?: GunghapAnalysisResult | null;
  // 8번 요구사항: 2인 궁합(CHEMISTRY) 상대방 사주 정보
  partnerInfo?: {
    name: string;
    gender: 'male' | 'female';
    calendarType: 'solar' | 'lunar';
    isLeapMonth: boolean;
    birthDate: string;
    birthTime: string;
    isHourUnknown: boolean;
    relation: string;
  };
}

export type StateListener = (state: AppStateData) => void;

class AppStateManager {
  private state: AppStateData = {
    currentView: 'landing',
    sessionState: null,
    integratedResult: null,
    reportMode: 'STANDARD',
    chatMessages: [],
    isAnalyzing: false,
    loadingStepText: '',
    activeTraceData: null,
    errorMessage: null,
    calendarType: 'solar',
    isLeapMonth: false,
    gender: 'male',
    userName: '',
    userTroubleText: '특별한 문제는 없고 올해 전체적인 운의 흐름과 기회를 알고 싶어요.',
    selectedTier: 'free_diagnosis',
    isPaidUser: false,
    selectedSituation: '',
    additionalContext: '',
    desiredQuestion: '',
    deepResult: null,
    latestProduct: null,
    productOutputSet: null,
    activeTierTab: 'FREE',
  };

  private listeners: StateListener[] = [];

  public getState(): AppStateData {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  public setView(view: AppViewType) {
    this.state.currentView = view;
    this.state.errorMessage = null;
    this.notify();
  }

  public setReportMode(mode: ReportDepthMode) {
    this.state.reportMode = mode;
    this.notify();
  }

  public setSession(session: MabosalSessionState) {
    this.state.sessionState = session;
    this.state.isAnalyzing = false;
    this.notify();
  }

  public setIntegratedResult(result: IntegratedAnalysisResult) {
    this.state.integratedResult = result;
    this.notify();
  }

  public setSelectedTier(tier: ProductTier) {
    this.state.selectedTier = tier;
    this.notify();
  }

  public setPaidUser(isPaid: boolean) {
    this.state.isPaidUser = isPaid;
    this.notify();
  }

  public setCalendarType(type: CalendarType) {
    this.state.calendarType = type;
    this.notify();
  }

  public setLeapMonth(isLeap: boolean) {
    this.state.isLeapMonth = isLeap;
    this.notify();
  }

  public setGender(gender: 'male' | 'female') {
    this.state.gender = gender;
    this.notify();
  }

  public setUserName(name: string) {
    this.state.userName = name;
    this.notify();
  }

  public setUserTroubleText(text: string) {
    this.state.userTroubleText = text;
    this.notify();
  }

  public setLoading(isAnalyzing: boolean, stepText = '') {
    this.state.isAnalyzing = isAnalyzing;
    this.state.loadingStepText = stepText;
    if (isAnalyzing) {
      this.state.currentView = 'loading';
    }
    this.notify();
  }

  public addChatMessage(message: ChatMessage) {
    this.state.chatMessages.push(message);
    this.notify();
  }

  public openTraceModal(data: ActiveTraceData) {
    this.state.activeTraceData = data;
    this.notify();
  }

  public closeTraceModal() {
    this.state.activeTraceData = null;
    this.notify();
  }

  public setSelectedSituation(sit: string) {
    this.state.selectedSituation = sit;
    this.notify();
  }

  public setAdditionalContext(ctx: string) {
    this.state.additionalContext = ctx;
    this.notify();
  }

  public setDesiredQuestion(q: string) {
    this.state.desiredQuestion = q;
    this.notify();
  }

  public setDeepResult(res: any) {
    this.state.deepResult = res;
    this.notify();
  }

  public setLatestProduct(product: any) {
    this.state.latestProduct = product;
    this.notify();
  }

  public setProductOutputSet(set: any) {
    this.state.productOutputSet = set;
    this.notify();
  }

  public setGunghapResult(result: GunghapAnalysisResult | null) {
    this.state.gunghapResult = result;
    this.notify();
  }

  public setPartnerInfo(info: any) {
    this.state.partnerInfo = info;
    this.notify();
  }

  public setActiveTierTab(tab: ProductTierTab) {
    this.state.activeTierTab = tab;
    this.notify();
  }

  public getActiveTierTab(): ProductTierTab | undefined {
    return this.state.activeTierTab;
  }

  public setError(error: string | null) {
    this.state.errorMessage = error;
    this.notify();
  }

  public resetSession() {
    this.state.sessionState = null;
    this.state.integratedResult = null;
    this.state.latestProduct = null;
    this.state.deepResult = null;
    this.state.chatMessages = [];
    this.state.currentView = 'landing';
    this.state.errorMessage = null;
    this.notify();
  }

  /**
   * 로그아웃 또는 최고관리자 접속 시 이전 이용자의 입력 및 분석 정보를 완벽히 초기화
   */
  public resetAllUserData() {
    this.state.userName = '';
    this.state.userTroubleText = '특별한 문제는 없고 올해 전체적인 운의 흐름과 기회를 알고 싶어요.';
    this.state.selectedSituation = '';
    this.state.additionalContext = '';
    this.state.desiredQuestion = '';
    this.state.isPaidUser = false;
    this.state.sessionState = null;
    this.state.integratedResult = null;
    this.state.latestProduct = null;
    this.state.deepResult = null;
    this.state.productOutputSet = null;
    this.state.chatMessages = [];
    this.state.currentView = 'landing';
    this.state.errorMessage = null;
    this.state.activeTraceData = null;
    this.notify();
  }
}

export const appState = new AppStateManager();
