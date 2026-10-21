/**
 * ModuleRegistry (기능 모듈 & 상품화 오케스트레이션 레지스트리)
 * 
 * 최고 관리자가:
 * 1. 현재 구현 완료된 모듈과 미착수 잔여 과제를 한눈에 추적하고
 * 2. 화면 노출을 ON/OFF 스위치로 실시간 제어하며
 * 3. 필요한 모듈만 조합하여 상품화(Productization)할 수 있는 중앙 통제 엔진
 */

export interface SystemModuleItem {
  id: string;
  name: string;
  category: 'core_engine' | 'visual_dashboard' | 'report_section' | 'commerce_affiliate' | 'future_backlog' | 'ui_feature_toggle';
  status: 'ready' | 'beta' | 'backlog'; // ready: 실제 작동, backlog: 미착수
  enabled: boolean;                      // 화면 노출 ON/OFF
  description: string;
  tags: string[];
}

export interface ProductTierConfig {
  tierId: string;
  title: string;
  price: number;
  originalPrice: number;
  enabled: boolean;
  includedModuleIds: string[];
}

export interface MasterServiceToggle {
  key: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  enabled: boolean;
  subModuleIds: string[];
}

const STORAGE_KEY_MODULES = 'mabosal_system_modules_config';
const STORAGE_KEY_PRODUCTS = 'mabosal_product_tiers_config';
const STORAGE_KEY_MASTER_TOGGLES = 'mabosal_master_toggles_config';

export const INITIAL_MASTER_TOGGLES: MasterServiceToggle[] = [
  {
    key: 'yeop_system',
    title: '엽전(葉錢) 지갑 & 충전 결제 시스템',
    category: '금융/화폐',
    icon: 'paid',
    description: '상단 헤더 잔액 표시, 충전 모달, 유료 리포트 엽전 결제 기능 전역 제어',
    enabled: true,
    subModuleIds: ['feature_yeop_wallet', 'talisman_harvest_card'],
  },
  {
    key: 'vendors_system',
    title: '협력업체 & 전문 상담사 마켓',
    category: '제휴/상담',
    icon: 'handshake',
    description: '공인 역술가 1:1 상담 연결, 협력업체 목록 및 메인 추천 노출 전역 제어',
    enabled: true,
    subModuleIds: ['feature_vendor_marketplace', 'feature_realtime_masters', 'feature_dock_consult'],
  },
  {
    key: 'affiliate_system',
    title: '제휴 파트너스 30% 커미션 시스템',
    category: '마케팅/영업',
    icon: 'share_reviews',
    description: '쿠팡형 레퍼럴 추적, 독립 분양점, 파트너스 센터 메뉴 노출 전역 제어',
    enabled: true,
    subModuleIds: ['affiliate_partners_portal', 'feature_affiliate_banner', 'feature_dock_partner'],
  },
  {
    key: 'settlement_system',
    title: '정산 & 출금 승인 관리 시스템',
    category: '정산/회계',
    icon: 'account_balance',
    description: '파트너스 커미션 출금 승인 장부 및 실시간 판매 정산 기능 전역 제어',
    enabled: true,
    subModuleIds: [],
  },
  {
    key: 'today_retention_system',
    title: '오늘의 운세 × 마기 × 방비 리텐션 엔진',
    category: '데일리/리텐션',
    icon: 'calendar_today',
    description: '12간지 띠별 출생연도 운세(무료) 및 마기/방비(회원 전용) 위젯 노출 전역 제어',
    enabled: true,
    subModuleIds: ['feature_today_fortune', 'feature_today_magi'],
  },
  {
    key: 'cro_funnel_ab_test',
    title: '구매 전환 전용 단일 퍼널 (A/B 테스트 B안)',
    category: '전환/CRO',
    icon: 'conversion_path',
    description: '랜딩(고객 고민 타격) ➔ 무료 6대 진단 ➔ 유료 39,900원 결제 ➔ 8대 정밀 처방 단일 퍼널로 즉시 전환 (OFF시 기존 종합 대시보드형 A안)',
    enabled: false,
    subModuleIds: [],
  },
];

export const INITIAL_MODULES: SystemModuleItem[] = [
  {
    id: 'solution_hub',
    name: '솔루션 허브 (전체 스위치)',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '결과 화면 하단 제휴 솔루션 카드 영역 전체 노출 제어',
    tags: ["솔루션","제휴"],
  },
  {
    id: 'solution_finance',
    name: '솔루션: 경제 · 재테크',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '재물 신호 기반 경제/재테크 솔루션 카드 노출 제어',
    tags: ["경제","재테크"],
  },
  {
    id: 'solution_career',
    name: '솔루션: 커리어 · 창업',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '직장 신호 기반 커리어/창업 솔루션 카드 노출 제어',
    tags: ["커리어","창업"],
  },
  {
    id: 'solution_home',
    name: '솔루션: 부동산 · 공간',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '이동/집 신호 기반 부동산 솔루션 카드 노출 제어',
    tags: ["부동산","이사"],
  },
  {
    id: 'solution_mind',
    name: '솔루션: 정서 · 마음 돌봄',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '스트레스 신호 기반 마음 돌봄 카드 노출 제어',
    tags: ["정서","마음돌봄"],
  },
  {
    id: 'solution_body',
    name: '솔루션: 건강 · 체질',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '건강 솔루션 카드 노출 제어 (표시광고 검토 후 사용)',
    tags: ["건강","체질"],
  },
  {
    id: 'solution_legal',
    name: '솔루션: 법률 · 분쟁',
    category: 'commerce_affiliate',
    status: 'beta',
    enabled: false, // 실제 제휴 파트너 확정 전까지 OFF (관리자에서 ON/OFF 제어)
    description: '법률 솔루션 카드 노출 제어 (변호사법 검토 후 사용)',
    tags: ["법률","분쟁"],
  },
  // 1. 핵심 명리 엔진 (Core Engine)
  {
    id: 'saju_calendar_engine',
    name: '정통 만세력 & 절기 경계 엔진',
    category: 'core_engine',
    status: 'ready',
    enabled: true,
    description: 'KASI 천문연구원 데이터 기반 4주 8자 및 실시간 음력/간지 산출',
    tags: ['만세력', '절기', '음력'],
  },
  {
    id: 'ma_signals_engine',
    name: '21개 마(魔) 징후 & RSI 판정 엔진',
    category: 'core_engine',
    status: 'ready',
    enabled: true,
    description: '재물마, 직장마, 인마 등 21대 징후 강도 및 86점 안정도 평가',
    tags: ['21Ma', 'RSI', '신호'],
  },
  {
    id: 'lucky_codex_engine',
    name: '정통 명리학 LUCKY CODEX 행운 처방 엔진',
    category: 'core_engine',
    status: 'ready',
    enabled: true,
    description: '용신 및 일진 기반 5대 오행 수비학(3·8, 2·7 등) 색상/방위/수 실시간 도출',
    tags: ['행운처방', '하도낙서', '오행'],
  },

  // 2. 비주얼 대시보드 (Visual Dashboards)
  {
    id: 'daily_celestial_dashboard',
    name: 'VIP 일진 대시보드 (Celestial Reading)',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '88점 서클 게이지, 3대 세부 메트릭, LUCKY CODEX, 4대 비전 퀵 카드',
    tags: ['일진', '서클게이지', '대시보드'],
  },
  {
    id: 'five_elements_multibar',
    name: '오행(五行) 에너지 5색 세그먼트 멀티바',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '목화토금수 에너지 분포 시각화 및 과다/결핍 밸런스 진단',
    tags: ['오행분포', '멀티바'],
  },
  {
    id: 'day_master_archetype',
    name: '일주(日柱) 본원 아키타입 & 풍수 보완 카드',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '의뢰인 성향 해설, #키워드 칩, 결핍 오행 일상 라이프 처방',
    tags: ['일주일원', '아키타입', '풍수보완'],
  },
  {
    id: 'talisman_harvest_card',
    name: '대길(大吉) 황금 결실 수호 부적 카드 & 공유 모달',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '結 천문 회전 SVG 링, 갤러리 저장, 카카오톡/인스타 공유 및 +100엽 적립',
    tags: ['황금부적', '소셜공유', '엽전리워드'],
  },
  {
    id: 'archive_digital_vault',
    name: '사주 리포트 보관함 & 소장용 다운로드',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '소장용 TXT 다운로드 및 안전 파일 백업 지원',
    tags: ['리포트보관함', 'TXT다운로드'],
  },
  {
    id: 'spline_monthly_chart',
    name: '12개월 월운 스플라인 에너지 곡선 차트',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '1~12월 고저 흐름 SVG 스플라인 시각화 (유료 전용)',
    tags: ['12개월월운', 'SVG차트'],
  },
  {
    id: 'daewun_lifecycle_curve',
    name: '10년 주기 대운(大運) 라이프사이클 곡선',
    category: 'visual_dashboard',
    status: 'ready',
    enabled: true,
    description: '인생 전반 10년 단위 대도약/수성 곡선 시각화 (유료 전용)',
    tags: ['대운곡선', '라이프사이클'],
  },

  // 3. 서술형 리포트 (Report Section)
  {
    id: 'narrative_13_sections',
    name: '13개 장절 정본 사주 리포트 (화면 및 TXT)',
    category: 'report_section',
    status: 'ready',
    enabled: true,
    description: '잡다한 섹션 번호 없이 세련된 소제목으로 읽는 13개 무료 리포트',
    tags: ['무료리포트', '13장절'],
  },
  {
    id: 'narrative_18_sections',
    name: '18개 장절 심층 정본 사주 리포트',
    category: 'report_section',
    status: 'ready',
    enabled: true,
    description: '월별 세운 12개월 해설 및 3개년 변화 순서가 포함된 심층 리포트',
    tags: ['유료리포트', '18장절'],
  },

  // 4. 커머스 & 제휴 마케팅 (Commerce & Affiliate)
  {
    id: 'affiliate_partners_portal',
    name: '마보살 파트너스 쿠팡형 제휴 마케팅 포털',
    category: 'commerce_affiliate',
    status: 'ready',
    enabled: true,
    description: '30일 귀속 레퍼럴 추적 링크(?ref=), 30% 커미션 적립, 성과 대시보드',
    tags: ['파트너스', '제휴수수료', '레퍼럴'],
  },

  // 5. 화면 기능 노출 제어 (UI Feature Toggle - 최고 관리자 스위치로 넣었다 뺐다)
  {
    id: 'feature_realtime_masters',
    name: '실시간 명리 상담 마스터 캐러셀',
    category: 'ui_feature_toggle',
    status: 'backlog',
    enabled: false, // 현재 개발 단계 아니므로 기본값 OFF (관리자에서 ON/OFF 제어 가능)
    description: '메인 일진 대시보드의 실시간 대기 역술가(도선도사, 백운선생) 상담 카드 노출 제어',
    tags: ['실시간상담', '마스터캐러셀', '역술가'],
  },
  {
    id: 'feature_yeop_wallet',
    name: '헤더 엽전(葉錢) 지갑 및 잔액·충전 표시',
    category: 'ui_feature_toggle',
    status: 'backlog',
    enabled: false, // 현재 개발 단계 아니므로 기본값 OFF (관리자에서 ON/OFF 제어 가능)
    description: '상단 헤더의 엽전 잔액 뱃지 및 지갑 충전 모달 노출 여부 제어',
    tags: ['헤더', '엽전', '지갑', '코인시스템'],
  },
  {
    id: 'feature_vendor_marketplace',
    name: '메인 홈 협력 상담사 & 입점 업체 목록',
    category: 'ui_feature_toggle',
    status: 'backlog',
    enabled: false, // 현재 개발 단계 아니므로 기본값 OFF (관리자에서 ON/OFF 제어 가능)
    description: '메인 랜딩 하단의 공인 수석 상담사 그리드 및 협력 제휴사 노출 여부 제어',
    tags: ['상담사', '협력업체', '마켓플레이스'],
  },
  {
    id: 'feature_dock_consult',
    name: '1:1 상담 메뉴 노출 (도크바 & PC 상단바)',
    category: 'ui_feature_toggle',
    status: 'backlog',
    enabled: false, // 현재 개발 단계 아니므로 기본값 OFF
    description: '하단 도크바 및 PC 헤더 메뉴에서 1:1 상담 바로가기 노출 여부 제어',
    tags: ['1:1상담', '메뉴제어', '도크바'],
  },
  {
    id: 'feature_dock_partner',
    name: '파트너스 제휴 메뉴 노출 (도크바 & PC 상단바)',
    category: 'ui_feature_toggle',
    status: 'backlog',
    enabled: false, // 현재 개발 단계 아니므로 기본값 OFF
    description: '하단 도크바 및 PC 헤더 메뉴에서 파트너스 바로가기 노출 여부 제어',
    tags: ['파트너스', '메뉴제어', '도크바'],
  },
  {
    id: 'feature_today_fortune',
    name: '오늘의 운세 & 황금 길시 위젯',
    category: 'ui_feature_toggle',
    status: 'ready',
    enabled: true,
    description: '메인 랜딩의 12간지 띠별 오늘의 운세 및 2대 길시(사시/미시) 노출',
    tags: ['오늘의운세', '길시', '12간지'],
  },
  {
    id: 'feature_today_magi',
    name: '오늘의 마기(魔氣) & 액막이 수칙 위젯',
    category: 'ui_feature_toggle',
    status: 'ready',
    enabled: true,
    description: '메인 랜딩의 12간지 띠별 주의 마(구설/손재/관재) 및 1대 금기 수칙 노출',
    tags: ['오늘의마기', '액막이', '금기수칙'],
  },
  {
    id: 'feature_2027_showcase',
    name: '2027 정미년 특화 비책 5대 쇼케이스',
    category: 'ui_feature_toggle',
    status: 'ready',
    enabled: true,
    description: '메인 랜딩의 2027 신년운세, 궁합, 직장, 재물, 연애 5대 단품 카드 목록 노출',
    tags: ['2027정미년', '신년운세', '특화비책'],
  },
  {
    id: 'feature_affiliate_banner',
    name: '마보살 파트너스 30% 제휴 프로모션 배너',
    category: 'ui_feature_toggle',
    status: 'ready',
    enabled: false, // 기본값 OFF (관리자에서 활성화 가능)
    description: '메인 랜딩 하단의 파트너스 제휴 독립점 분양 홍보 배너 노출',
    tags: ['파트너스', '제휴배너'],
  },

  // 6. 미착수 / 향후 로드맵 (Future Backlog)
  {
    id: 'backlog_monthly_month_sheet',
    name: '[미착수] 월운 특정 월 클릭 시 상세 분석 바텀시트',
    category: 'future_backlog',
    status: 'backlog',
    enabled: false,
    description: '월운 차트에서 4월(74점), 5월(91점) 터치 시 비보 처방 바텀시트 팝업',
    tags: ['월운상세', '팝업'],
  },
  {
    id: 'backlog_consultation_3q_modal',
    name: '[미착수] 1:1 역술가 상담 사전 질문지(3문 3답) 모달',
    category: 'future_backlog',
    status: 'backlog',
    enabled: false,
    description: '상담 10분 전 역술가에게 전달할 이직/재물/연애 3대 고민 작성 폼',
    tags: ['상담사전질문', '예약모달'],
  },
  {
    id: 'backlog_time_correction_modal',
    name: '[미착수] 출생시간 미확인자 생시 추명(보정) 모달',
    category: 'future_backlog',
    status: 'backlog',
    enabled: false,
    description: '생시를 모를 때 생활 패턴 문답을 통해 시주(時柱)를 역추적 보정',
    tags: ['생시추명', '시주보정'],
  },
  {
    id: 'backlog_pdf_magazine_viewer',
    name: '[미착수] 인앱 6페이지 고해상도 PDF 매거진 뷰어',
    category: 'future_backlog',
    status: 'backlog',
    enabled: false,
    description: '브라우저 인쇄창 대신 화면 내에서 책장 넘기며 목차 점프하는 뷰어',
    tags: ['인앱PDF', '매거진뷰어'],
  },
  {
    id: 'backlog_interactive_quiz_wallet',
    name: '[미착수] 실시간 운세 퀴즈 팝업 및 지갑 연동',
    category: 'future_backlog',
    status: 'backlog',
    enabled: false,
    description: '배너 클릭 시 실제 O/X 퀴즈 팝업이 뜨고 상단 엽전 잔액에 +50엽 실시간 합산',
    tags: ['운세퀴즈', '엽전지갑'],
  },
];

export const INITIAL_PRODUCTS: ProductTierConfig[] = [
  {
    tierId: 'FREE',
    title: '마보살 평생 사주 정본 진단 (무료)',
    price: 0,
    originalPrice: 0,
    enabled: true,
    includedModuleIds: ['saju_calendar_engine', 'daily_celestial_dashboard', 'five_elements_multibar', 'day_master_archetype', 'narrative_13_sections', 'talisman_harvest_card', 'archive_digital_vault'],
  },
  {
    tierId: 'PAID',
    title: '유료 사주풀이 — 심층 정본 리포트',
    price: 39900,
    originalPrice: 59000,
    enabled: true,
    includedModuleIds: ['saju_calendar_engine', 'ma_signals_engine', 'daily_celestial_dashboard', 'spline_monthly_chart', 'daewun_lifecycle_curve', 'five_elements_multibar', 'day_master_archetype', 'narrative_18_sections', 'talisman_harvest_card', 'archive_digital_vault'],
  },
  {
    tierId: 'YEAR_2027',
    title: '2027 정미년 신년운세 & 월운 비책',
    price: 19900,
    originalPrice: 30000,
    enabled: true,
    includedModuleIds: ['saju_calendar_engine', 'daily_celestial_dashboard', 'spline_monthly_chart', 'narrative_13_sections'],
  },
  {
    tierId: 'CONFLICT_MALSAL',
    title: '상충·마·살 특화 분석 & 관계 갈등 방어 스크립트',
    price: 79900,
    originalPrice: 120000,
    enabled: true,
    includedModuleIds: ['ma_signals_engine', 'narrative_18_sections', 'archive_digital_vault'],
  },
];

export class ModuleRegistry {
  private static modules: Map<string, SystemModuleItem> = new Map();
  private static products: Map<string, ProductTierConfig> = new Map();
  private static masterToggles: Map<string, MasterServiceToggle> = new Map();
  private static initialized: boolean = false;

  public static init(): void {
    if (this.initialized) return;

    // 마스터 토글 로드
    let loadedMaster: MasterServiceToggle[] = INITIAL_MASTER_TOGGLES;
    if (typeof window !== 'undefined') {
      try {
        const storedMaster = localStorage.getItem(STORAGE_KEY_MASTER_TOGGLES);
        if (storedMaster) {
          const parsed: MasterServiceToggle[] = JSON.parse(storedMaster);
          const map = new Map(parsed.map(m => [m.key, m]));
          loadedMaster = INITIAL_MASTER_TOGGLES.map(m => map.get(m.key) || m);
        }
      } catch (e) {
        console.warn('[ModuleRegistry] Failed to load master toggles', e);
      }
    }
    this.masterToggles.clear();
    for (const mt of loadedMaster) {
      this.masterToggles.set(mt.key, mt);
    }

    // 모듈 로드
    let loadedModules: SystemModuleItem[] = INITIAL_MODULES;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_MODULES);
        if (stored) {
          const parsed: SystemModuleItem[] = JSON.parse(stored);
          const map = new Map(parsed.map(m => [m.id, m]));
          loadedModules = INITIAL_MODULES.map(m => map.get(m.id) || m);
        }
      } catch (e) {
        console.warn('[ModuleRegistry] Failed to load modules from localStorage', e);
      }
    }
    this.modules.clear();
    for (const m of loadedModules) {
      this.modules.set(m.id, m);
    }

    // 상품 티어 로드
    let loadedProducts: ProductTierConfig[] = INITIAL_PRODUCTS;
    if (typeof window !== 'undefined') {
      try {
        const storedProd = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (storedProd) {
          loadedProducts = JSON.parse(storedProd);
        }
      } catch (e) {
        console.warn('[ModuleRegistry] Failed to load products from localStorage', e);
      }
    }
    this.products.clear();
    for (const p of loadedProducts) {
      this.products.set(p.tierId, p);
    }

    this.initialized = true;
  }

  /** 중간 단계 마스터 서비스 토글 활성화 여부 확인 */
  public static isMasterFeatureEnabled(key: string): boolean {
    this.init();
    const item = this.masterToggles.get(key);
    return item ? item.enabled : true;
  }

  public static isMasterEnabled(key: string): boolean {
    return this.isMasterFeatureEnabled(key);
  }

  /** 중간 단계 마스터 서비스 토글 변경 (하위 관련 모듈 일괄 반영) */
  public static toggleMasterFeature(key: string, enabled: boolean): void {
    this.init();
    const item = this.masterToggles.get(key);
    if (item) {
      item.enabled = enabled;
      // 하위 모듈이 정의되어 있으면 함께 동기화
      for (const subId of item.subModuleIds) {
        const sub = this.modules.get(subId);
        if (sub) {
          sub.enabled = enabled;
        }
      }
      this.saveMasterToggles();
      this.saveModules();
    }
  }

  public static getAllMasterToggles(): MasterServiceToggle[] {
    this.init();
    return Array.from(this.masterToggles.values());
  }

  public static isEnabled(moduleId: string): boolean {
    this.init();
    const item = this.modules.get(moduleId);
    return item ? item.enabled : false;
  }

  public static toggleModule(moduleId: string, enabled: boolean): void {
    this.init();
    const item = this.modules.get(moduleId);
    if (item) {
      item.enabled = enabled;
      this.saveModules();
    }
  }

  public static getAllModules(): SystemModuleItem[] {
    this.init();
    return Array.from(this.modules.values());
  }

  public static getAllProducts(): ProductTierConfig[] {
    this.init();
    return Array.from(this.products.values());
  }

  public static updateProductPrice(tierId: string, price: number, enabled?: boolean): void {
    this.init();
    const prod = this.products.get(tierId);
    if (prod) {
      prod.price = price;
      if (enabled !== undefined) prod.enabled = enabled;
      this.saveProducts();
    }
  }

  private static saveMasterToggles(): void {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.masterToggles.values());
      localStorage.setItem(STORAGE_KEY_MASTER_TOGGLES, JSON.stringify(arr));
    } catch (e) {
      console.warn('[ModuleRegistry] Failed to save master toggles', e);
    }
  }

  private static saveModules(): void {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.modules.values());
      localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(arr));
    } catch (e) {
      console.warn('[ModuleRegistry] Failed to save modules', e);
    }
  }

  private static saveProducts(): void {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.products.values());
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(arr));
    } catch (e) {
      console.warn('[ModuleRegistry] Failed to save products', e);
    }
  }

  /** 공장 초기화 */
  public static resetToDefault(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_MODULES);
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem(STORAGE_KEY_MASTER_TOGGLES);
    }
    this.initialized = false;
    this.init();
  }
}
