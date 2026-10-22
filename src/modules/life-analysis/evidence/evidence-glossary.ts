/**
 * [L2] 근거 코드 해석 사전 (Evidence Glossary)
 *
 * - 사주를 모르는 협력업체·AI 가 L1 코드를 읽을 수 있도록 코드별 "중립 의미 키워드"와 "영역 연결 규칙"을 제공한다.
 * - 운세 문장(예: "올해는 대박")은 담지 않는다. 의미의 방향과 키워드만 담는다.
 * - 이 사전의 개정은 반드시 EVIDENCE_RULESET_VERSION 개정과 함께 이뤄져야 한다 (술사 검수 이력).
 */

import { DomainCode, EvidenceCode, PalaceCode } from './evidence-schema.js';

export interface GlossaryEntry {
  label: string;
  hanja?: string;
  keywords: string[];       // 중립 의미 키워드
  technical: string;        // 명리 기술 정의 (술사용)
  defaultDomains: DomainCode[];
}

export const EVIDENCE_CODE_GLOSSARY: Record<EvidenceCode, GlossaryEntry> = {
  REL_CHUNG: { label: '충', hanja: '沖', keywords: ['정면 충돌', '급변', '이동·교체', '기반 동요'], technical: '대칭 지지(6칸 차이)의 정면 대립. 궁위의 안정이 흔들림.', defaultDomains: ['GENERAL'] },
  REL_PA: { label: '파', hanja: '破', keywords: ['균열', '중도 변경', '계획 틀어짐'], technical: '지지 육파. 결속이 깨지고 진행 중인 일이 어그러짐.', defaultDomains: ['GENERAL'] },
  REL_HAE: { label: '해', hanja: '害', keywords: ['은밀한 마찰', '신뢰 손상', '약속 불이행'], technical: '지지 육해. 합을 방해하는 관계로 드러나지 않는 훼손.', defaultDomains: ['RELATIONSHIP'] },
  REL_WONJIN: { label: '원진', hanja: '怨嗔', keywords: ['불편한 감정', '오해', '원망'], technical: '원진 관계. 서로 꺼리고 감정적 거리감이 생김.', defaultDomains: ['RELATIONSHIP', 'MENTAL'] },
  REL_YUKHAP: { label: '육합', hanja: '六合', keywords: ['결속', '협력', '묶임'], technical: '지지 육합. 결합·협력이 생기나 묶여서 움직임이 둔해질 수 있음.', defaultDomains: ['RELATIONSHIP'] },
  GONGMANG: { label: '공망', hanja: '空亡', keywords: ['결실 누수', '허망함', '기대 대비 실속 부족'], technical: '일주 순중 공망 지지 도래. 해당 기운이 비어 작용력이 약화.', defaultDomains: ['MENTAL'] },
  STAGE_STRONG: { label: '12운성 왕지', keywords: ['자생력', '주도권', '활동성 상승'], technical: '일간 기준 장생·관대·건록·제왕 지지. 일간 기세가 강해짐.', defaultDomains: ['GENERAL', 'HEALTH'] },
  STAGE_WEAK: { label: '12운성 쇠약지', keywords: ['에너지 침체', '내실·휴식', '정리 국면'], technical: '일간 기준 사·묘·절 지지. 일간 기세가 약해짐.', defaultDomains: ['GENERAL', 'HEALTH'] },
  YONGSHIN_IN: { label: '주용신 유입', keywords: ['균형 회복', '순풍', '기회 확대'], technical: '억부 주용신 오행이 운에서 들어옴.', defaultDomains: ['GENERAL'] },
  HEESHIN_IN: { label: '희신 유입', keywords: ['보조 순풍', '조력', '협력'], technical: '억부 희신(용신을 돕는 오행)이 운에서 들어옴.', defaultDomains: ['GENERAL'] },
  GISHIN_IN: { label: '기신 유입', keywords: ['과열', '경쟁 격화', '분탈 압력'], technical: '일간과 같은 오행(비겁 기신)이 운에서 들어와 과다해짐.', defaultDomains: ['GENERAL', 'WEALTH'] },
  TENGOD_SUPPORT: { label: '길성 십신', keywords: ['안정', '정당한 보상', '체계'], technical: '정관·정재·식신·정인이 운의 천간에 옴.', defaultDomains: ['GENERAL'] },
  TENGOD_PRESSURE: { label: '압박 십신', keywords: ['압박', '돌발 변수', '경쟁'], technical: '편관·상관·겁재가 운의 천간에 옴.', defaultDomains: ['GENERAL'] },
  SINSAL_GUIIN: { label: '천을귀인', hanja: '天乙貴人', keywords: ['조력자', '위기 완충', '도움'], technical: '일간 기준 천을귀인 지지 도래.', defaultDomains: ['RELATIONSHIP', 'GENERAL'] },
  SINSAL_YEOKMA: { label: '역마', hanja: '驛馬', keywords: ['이동', '변동', '출장·이사·해외'], technical: '일지/년지 삼합 기준 역마 지지 도래.', defaultDomains: ['MOBILITY'] },
  SINSAL_DOHWA: { label: '도화', hanja: '桃花', keywords: ['매력', '인기', '이성 관계'], technical: '일지/년지 삼합 기준 도화(연살) 지지 도래.', defaultDomains: ['RELATIONSHIP'] },
  SINSAL_HWAGAE: { label: '화개', hanja: '華蓋', keywords: ['몰입', '학문·예술·종교', '고독'], technical: '일지/년지 삼합 기준 화개 지지 도래.', defaultDomains: ['STUDY_DOCUMENT', 'MENTAL'] },
};

export const PALACE_GLOSSARY: Record<PalaceCode, { label: string; keywords: string[]; lifeStage: string; domains: DomainCode[] }> = {
  ANCESTOR_SOCIAL: { label: '년주(조상·대외궁)', keywords: ['조상', '대외 환경', '유년'], lifeStage: '0~19세', domains: ['FAMILY'] },
  CAREER_PARENTS: { label: '월주(사회·부모궁)', keywords: ['직업', '사회 활동', '부모·형제'], lifeStage: '20~39세', domains: ['CAREER', 'FAMILY'] },
  SELF_SPOUSE: { label: '일주(본인·배우자궁)', keywords: ['본인', '배우자', '가정', '내면'], lifeStage: '40~59세', domains: ['RELATIONSHIP', 'MENTAL'] },
  CHILDREN_LEGACY: { label: '시주(자녀·결실궁)', keywords: ['자녀', '부하', '결실', '말년'], lifeStage: '60세 이후', domains: ['FAMILY', 'CAREER'] },
};

/** 십신 → 영역 연결 규칙 */
export const TENGOD_DOMAIN_RULES: Record<string, { keywords: string[]; domains: DomainCode[] }> = {
  비견: { keywords: ['자립', '동료', '경쟁'], domains: ['RELATIONSHIP', 'WEALTH'] },
  겁재: { keywords: ['경쟁', '분탈', '승부'], domains: ['WEALTH', 'RELATIONSHIP'] },
  식신: { keywords: ['표현', '생산', '여유'], domains: ['CAREER', 'HEALTH'] },
  상관: { keywords: ['재능 발산', '반발', '말·구설'], domains: ['CAREER', 'RELATIONSHIP'] },
  편재: { keywords: ['유동 재물', '사업', '활동 반경'], domains: ['WEALTH'] },
  정재: { keywords: ['고정 수입', '관리', '성실 보상'], domains: ['WEALTH'] },
  편관: { keywords: ['압박', '책임', '돌파'], domains: ['CAREER', 'HEALTH'] },
  정관: { keywords: ['조직', '명예', '규범'], domains: ['CAREER'] },
  편인: { keywords: ['직관', '특수 지식', '고립'], domains: ['STUDY_DOCUMENT', 'MENTAL'] },
  정인: { keywords: ['학습', '문서', '보호'], domains: ['STUDY_DOCUMENT'] },
};

/** 12운성 키워드 */
export const TWELVE_STAGE_KEYWORDS: Record<string, string[]> = {
  장생: ['시작', '성장', '보호'], 목욕: ['불안정', '노출', '시행착오'], 관대: ['자신감', '확장', '과시'],
  건록: ['자립', '실행력', '안정적 기반'], 제왕: ['정점', '주도권', '과신 경계'], 쇠: ['완숙', '속도 저하'],
  병: ['피로', '관리 필요'], 사: ['정지', '마무리'], 묘: ['저장', '축적', '잠복'],
  절: ['단절', '전환', '리셋'], 태: ['구상', '잉태'], 양: ['준비', '양육'],
};

export const DOMAIN_GLOSSARY: Record<DomainCode, string> = {
  GENERAL: '전반 기세', WEALTH: '재물', CAREER: '직업·명예', RELATIONSHIP: '대인·애정',
  FAMILY: '가족·가정', STUDY_DOCUMENT: '학업·문서·계약', HEALTH: '건강·체력', MOBILITY: '이동·변동', MENTAL: '심리·내면',
};

/**
 * 요인의 영역 태그 산출 규칙
 * 코드 기본 영역 + (관계 요인이면) 궁위 영역 + (십신이 있으면) 십신 영역 → 중복 제거
 */
export function resolveDomains(code: EvidenceCode, palace?: PalaceCode, tenGod?: string): DomainCode[] {
  const set = new Set<DomainCode>(EVIDENCE_CODE_GLOSSARY[code].defaultDomains);
  if (palace) PALACE_GLOSSARY[palace].domains.forEach(d => set.add(d));
  if (tenGod && TENGOD_DOMAIN_RULES[tenGod]) TENGOD_DOMAIN_RULES[tenGod].domains.forEach(d => set.add(d));
  return Array.from(set);
}
