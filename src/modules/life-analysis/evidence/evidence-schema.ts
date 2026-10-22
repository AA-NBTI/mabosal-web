/**
 * [L1] 마보살 사주 근거 패킷 (Saju Evidence Packet) 공개 규격 v1
 *
 * 원칙
 * 1. 문장 금지: 해석 문장은 담지 않는다. 코드(enum)·참여자·궁위·가중치만 담는다.
 * 2. 추적성: 모든 요인은 고유 id 를 가지며, 소비자(AI·술사·협력업체)는 [E:<id>] 로 인용한다.
 * 3. 결정성: 같은 입력 + 같은 ruleSet 이면 항상 같은 패킷이 생성된다.
 * 4. 개인정보 분리: 생년월일시 원문은 disclosure='internal' 일 때만 포함된다.
 */

export const EVIDENCE_SCHEMA_VERSION = 'mabosal.saju.evidence/v1';
export const EVIDENCE_RULESET_VERSION = 'MBS-RULES-2026.10-r1';

/** 시간 범위 유형 */
export type ScopeType = 'daewoon' | 'sewoon' | 'wolwoon';

/** 요인이 나온 출처 */
export type EvidenceSource = 'natal' | 'daewoon' | 'sewoon' | 'wolwoon';

/** 원국 기둥 위치 */
export type PillarPosition = 'year' | 'month' | 'day' | 'hour';

/** 궁위 코드 (원국 기둥 = 생활 영역의 자리) */
export type PalaceCode =
  | 'ANCESTOR_SOCIAL'   // 년주: 조상·대외 환경·유년
  | 'CAREER_PARENTS'    // 월주: 사회·직업·부모·청년기
  | 'SELF_SPOUSE'       // 일주: 본인·배우자·내면·중년기
  | 'CHILDREN_LEGACY';  // 시주: 자녀·부하·결실·말년

/** 생활 영역 코드 (사주를 모르는 소비자를 위한 축) */
export type DomainCode =
  | 'GENERAL'       // 전반 기세
  | 'WEALTH'        // 재물
  | 'CAREER'        // 직업·명예·조직
  | 'RELATIONSHIP'  // 대인·애정·배우자
  | 'FAMILY'        // 가족·가정
  | 'STUDY_DOCUMENT'// 학업·문서·계약·자격
  | 'HEALTH'        // 건강·체력
  | 'MOBILITY'      // 이동·변동·해외
  | 'MENTAL';       // 심리·내면

/** 요인 코드 (L2 해석 사전의 키) */
export type EvidenceCode =
  | 'REL_CHUNG'        // 지지 충
  | 'REL_PA'           // 지지 파
  | 'REL_HAE'          // 지지 해
  | 'REL_WONJIN'       // 원진
  | 'REL_YUKHAP'       // 지지 육합
  | 'GONGMANG'         // 공망
  | 'STAGE_STRONG'     // 12운성 왕지 (장생·관대·건록·제왕)
  | 'STAGE_WEAK'       // 12운성 쇠약지 (사·묘·절)
  | 'YONGSHIN_IN'      // 억부 주용신 오행 유입
  | 'HEESHIN_IN'       // 억부 희신 오행 유입
  | 'GISHIN_IN'        // 기신(비겁) 오행 유입
  | 'TENGOD_SUPPORT'   // 길성 십신 (정관·정재·식신·정인)
  | 'TENGOD_PRESSURE'  // 압박 십신 (편관·상관·겁재)
  | 'SINSAL_GUIIN'     // 천을귀인
  | 'SINSAL_YEOKMA'    // 역마
  | 'SINSAL_DOHWA'     // 도화
  | 'SINSAL_HWAGAE';   // 화개

/** 요인 참여자 (누가 누구와 작용하는가) */
export interface EvidenceParticipant {
  source: EvidenceSource;
  position: PillarPosition | 'incoming'; // incoming = 해당 운(대운/세운/월운) 자체
  slot: 'stem' | 'branch' | 'element';
  char: string;      // 한글 간지 또는 오행 ('오', '병', '화')
  hanja?: string;
  element?: string;  // 오행
  tenGod?: string;   // 일간 기준 십신
}

/** 지장간 상호작용 (지지 관계의 내부 기전) */
export interface HiddenStemInteraction {
  incoming: string;  // 운 지지의 지장간
  natal: string;     // 원국 지지의 지장간
  type: 'STEM_CHUNG' | 'STEM_HAP';
}

/** 단일 근거 요인 */
export interface EvidenceItem {
  id: string;                 // 예: 'SW2026-03', 'DW04-02', 'WW2026M05-01'
  scope: { type: ScopeType; year?: number; month?: number; daewoonOrder?: number };
  code: EvidenceCode;
  key: string;                // 구체 명칭: '축오해', '건록', '천을귀인', '화'
  polarity: 'up' | 'down' | 'neutral';
  weight: number;             // 가중치 (부호 포함)
  inScore: boolean;           // true = 해당 노드 점수에 실제 합산됨 / false = 배경(맥락) 요인
  participants: EvidenceParticipant[];
  palace?: PalaceCode;        // 관계 요인일 때 영향을 받는 원국 궁위
  hiddenStemInteractions?: HiddenStemInteraction[];
  domains: DomainCode[];      // 영역 태그 (L2 규칙으로 산출)
  legacyLabel: string;        // 그래프 뱃지에 표시되는 기존 라벨 (화면 ↔ 데이터 추적용)
}

/** 영역별 신호 집계 (문장 없는 정량 요약) */
export interface DomainSignal {
  domain: DomainCode;
  up: number;
  down: number;
  net: number;
  evidenceIds: string[];
}

/** 시간 노드 (대운 1개 / 세운 1년 / 월운 1개월) */
export interface TimelineNode {
  nodeId: string;             // 'DW04', 'SW2026', 'WW2026M05'
  type: ScopeType;
  year?: number;
  month?: number;             // 절기월 순번 (1 = 인월/입춘)
  solarTerm?: string;         // 월운 시작 절기
  approxGregorianStart?: string; // 월운 시작 양력 근사일 (MM-DD, 연도별 ±1일)
  startYear?: number;         // 대운 시작 연도
  endYear?: number;           // 대운 종료 연도
  age?: number;               // 세운 나이 (partner 공개 범위에서는 제거)
  ageRange?: [number, number];// 대운 나이 구간 (partner 공개 범위에서는 제거)
  daewoonOrder?: number;
  ganji: string;
  stemTenGod: string;
  branchTenGod: string;
  twelveStage: string;
  isGongmang: boolean;
  score: {
    raw: number;              // 가중치 순합 (inScore 요인 합)
    display: number;          // 그래프 표시 점수 (대운 -50~+50 / 세운·월운 -100~+100)
    level: string;            // 판정 등급
  };
  upSum: number;
  downSum: number;
  isCurrent: boolean;
  evidenceIds: string[];
  domainSignals: DomainSignal[];
}

/** 과거 검증 슬롯 (이용자 피드백 → 가중치 보정용) */
export interface VerificationSlot {
  slotId: string;             // 'VF-SW2019'
  nodeId: string;
  year: number;
  direction: 'up' | 'down';
  intensity: number;          // |display score|
  evidenceIds: string[];
  domains: DomainCode[];
  userAnswer: 'matched' | 'partial' | 'not_matched' | null;
  answeredAt: string | null;
}

export type DisclosureScope = 'internal' | 'paid' | 'free' | 'partner';

/** 소비 규약 (AI·협력업체·술사가 지켜야 할 규칙) */
export interface ConsumptionContract {
  citationFormat: string;     // '[E:<id>]'
  rules: string[];
}

/** 근거 패킷 본체 */
export interface SajuEvidencePacket {
  schema: typeof EVIDENCE_SCHEMA_VERSION;
  ruleSet: string;
  engineVersion: string;
  packetId: string;
  subjectRef: string;         // 입력 해시 (개인정보 아님)
  generatedAt: string;
  disclosure: DisclosureScope;
  subjectInput?: {            // internal 전용
    birthDate: string;
    birthTime: string | null;
    gender: 'male' | 'female';
    calendarType: 'solar' | 'lunar';
  };
  subject: {
    gender: 'male' | 'female';
    birthTimeKnown: boolean;
    dayMaster: { stem: string; hanja: string; element: string; polarity: string };
    strength: { classification: string; score: number };
    geokguk: string;
    yongshin: { primary: string; secondary: string; gishin: string; johu: string };
    fiveElements: { wood: number; fire: number; earth: number; metal: number; water: number; dominant: string; lacking: string[] };
    pillars: Array<{
      position: PillarPosition;
      palace: PalaceCode;
      stem: string; stemHanja: string; stemTenGod: string;
      branch: string; branchHanja: string; branchTenGod: string;
      twelveStage: string; isGongmang: boolean; hiddenStems: string[];
    }>;
    natalRelations: string[];
    natalSinsals: string[];
    flowChannels: { shiksangSaengJae: number; jaeSaengGwan: number; gwanInSaeng: number; biGeopBunsan: number };
  };
  timeline: {
    currentYear: number;
    currentDaewoonOrder: number;
    daewoon: TimelineNode[];
    sewoon: TimelineNode[];
    wolwoon: Array<{ year: number; months: TimelineNode[] }>;
  };
  evidence: EvidenceItem[];
  verificationSlots: VerificationSlot[];
  contract: ConsumptionContract;
}
