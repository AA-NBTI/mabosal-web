/**
 * 근거 패킷 빌더 (Evidence Packet Builder)
 *
 * CanonicalLifeDataWarehouse(L0) → SajuEvidencePacket(L1) 변환.
 * - 세운: 창고 빌더와 동일 규칙·동일 가중치로 요인을 재구성하되, 참여자·궁위·지장간 기전을 추가로 기록
 *   (테스트에서 창고 요인 합계와 1:1 대조)
 * - 대운: 점수(energyScore)를 구성하는 용신/희신/기신 요인 = inScore, 그래프 뱃지 요인 = 배경(inScore=false)
 * - 월운: 기존 관리자 패널 계산을 모듈로 이전 (용신 오행 문자열 비교 버그 수정, 십신 실제 산출)
 */

import {
  CanonicalLifeDataWarehouse,
  NatalPillarSpec,
  getTwelveStage,
  detectBranchSinsals,
} from '../life-analysis-warehouse.js';
import { STEM_INFO, BRANCH_INFO, HIDDEN_STEMS } from '../../../core/constants.js';
import { HeavenlyStem, EarthlyBranch } from '../../../core/types.js';
import { STEM_MAP, BRANCH_MAP } from '../../sinsal/sinsal-core-engine.js';
import { TenGodsEngine } from '../../saju-core/ten-gods.js';
import { SIX_CLASHES } from '../../relationship/branch-clash.js';
import { SIX_DESTRUCTIONS, SIX_HARMS, WONJIN_PAIRS } from '../../relationship/branch-harm-destruction.js';
import { SIX_HARMONIES } from '../../relationship/branch-harmony.js';
import {
  EVIDENCE_SCHEMA_VERSION,
  EVIDENCE_RULESET_VERSION,
  EvidenceItem,
  EvidenceCode,
  EvidenceParticipant,
  HiddenStemInteraction,
  PalaceCode,
  PillarPosition,
  ScopeType,
  TimelineNode,
  DomainSignal,
  DomainCode,
  VerificationSlot,
  SajuEvidencePacket,
  DisclosureScope,
} from './evidence-schema.js';
import { resolveDomains } from './evidence-glossary.js';

const tenGods = new TenGodsEngine();

const POSITIONS: PillarPosition[] = ['year', 'month', 'day', 'hour'];
const POSITION_LABEL: Record<PillarPosition, string> = { year: '년지', month: '월지', day: '일지', hour: '시지' };
export const PALACE_BY_POSITION: Record<PillarPosition, PalaceCode> = {
  year: 'ANCESTOR_SOCIAL',
  month: 'CAREER_PARENTS',
  day: 'SELF_SPOUSE',
  hour: 'CHILDREN_LEGACY',
};

const STEM_CHUNG_PAIRS = new Set(['갑경', '경갑', '을신', '신을', '병임', '임병', '정계', '계정']);
const STEM_HAP_PAIRS = new Set(['갑기', '기갑', '을경', '경을', '병신', '신병', '정임', '임정', '무계', '계무']);

const SOLAR_TERMS_12 = ['입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한'];
const SOLAR_TERM_APPROX = ['02-04', '03-06', '04-05', '05-06', '06-06', '07-07', '08-08', '09-08', '10-08', '11-07', '12-07', '01-06'];
const MONTH_BRANCHES = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// ───────────────────────── 공통 유틸 ─────────────────────────

/** FNV-1a 32bit (식별용 해시, 암호학적 용도 아님) */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const elemOfStem = (s: string) => STEM_INFO[s as HeavenlyStem]?.element || '토';
const elemOfBranch = (b: string) => BRANCH_INFO[b as EarthlyBranch]?.element || '토';
const stemTenGod = (dm: string, s: string) => tenGods.getTenGodForStem(dm as HeavenlyStem, s as HeavenlyStem);
const branchTenGod = (dm: string, b: string) => tenGods.getTenGodForBranchMain(dm as HeavenlyStem, b as EarthlyBranch);

function hiddenStemsOf(b: string): string[] {
  const h = HIDDEN_STEMS[b as EarthlyBranch];
  if (!h) return [];
  return [h.initial, h.middle, h.main].filter(Boolean) as string[];
}

/** 두 지지의 지장간 사이 천간충·천간합 기전 */
export function hiddenStemInteractions(incomingBranch: string, natalBranch: string): HiddenStemInteraction[] {
  const out: HiddenStemInteraction[] = [];
  for (const a of hiddenStemsOf(incomingBranch)) {
    for (const b of hiddenStemsOf(natalBranch)) {
      if (STEM_CHUNG_PAIRS.has(a + b)) out.push({ incoming: a, natal: b, type: 'STEM_CHUNG' });
      else if (STEM_HAP_PAIRS.has(a + b)) out.push({ incoming: a, natal: b, type: 'STEM_HAP' });
    }
  }
  return out;
}

/** 창고의 용신 문자열('금 (억부 주용신)')에서 오행 한 글자 추출 */
export function parseElement(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const m = raw.trim().match(/^[목화토금수]/);
  return m ? m[0] : fallback;
}

interface NatalContext {
  dayStem: string;
  dayElement: string;
  primary: string;
  secondary: string;
  gishin: string;
  gongmang: string[];
  branches: Array<{ pos: PillarPosition; spec: NatalPillarSpec }>;
  dayBranch: string;
  monthBranch: string;
  yearBranch: string;
}

function buildNatalContext(wh: CanonicalLifeDataWarehouse): NatalContext {
  const dm = wh.natalLayer.dayMaster;
  const branches = wh.natalLayer.pillars
    .map((spec, i) => ({ pos: POSITIONS[i], spec }))
    .filter(x => x.spec.branch && x.spec.branch !== '미상');
  return {
    dayStem: dm.stem,
    dayElement: dm.element,
    primary: parseElement(wh.natalLayer.yongshin.yongshin, '금'),
    secondary: parseElement(wh.natalLayer.yongshin.heeshin, '수'),
    gishin: parseElement(wh.natalLayer.yongshin.gishin, dm.element),
    gongmang: wh.deepStructure.gongmang.dayBased,
    branches,
    dayBranch: wh.natalLayer.pillars[2].branch,
    monthBranch: wh.natalLayer.pillars[1].branch,
    yearBranch: wh.natalLayer.pillars[0].branch,
  };
}

function incomingBranchP(source: EvidenceItem['scope']['type'], b: string, ctx: NatalContext): EvidenceParticipant {
  return { source, position: 'incoming', slot: 'branch', char: b, hanja: BRANCH_MAP[b]?.hanja, element: elemOfBranch(b), tenGod: branchTenGod(ctx.dayStem, b) };
}
function incomingStemP(source: EvidenceItem['scope']['type'], s: string, ctx: NatalContext): EvidenceParticipant {
  return { source, position: 'incoming', slot: 'stem', char: s, hanja: STEM_MAP[s]?.hanja, element: elemOfStem(s), tenGod: stemTenGod(ctx.dayStem, s) };
}
function natalBranchP(pos: PillarPosition, spec: NatalPillarSpec): EvidenceParticipant {
  return { source: 'natal', position: pos, slot: 'branch', char: spec.branch, hanja: spec.branchHanja, element: spec.branchElement, tenGod: spec.branchTenGod };
}

/** 요인 수집기 (id 자동 부여) */
class EvidenceCollector {
  items: EvidenceItem[] = [];
  constructor(private prefix: string, private scope: EvidenceItem['scope']) {}
  add(e: Omit<EvidenceItem, 'id' | 'scope' | 'domains'> & { tenGodForDomain?: string }): EvidenceItem {
    const { tenGodForDomain, ...rest } = e;
    const item: EvidenceItem = {
      id: `${this.prefix}-${String(this.items.length + 1).padStart(2, '0')}`,
      scope: this.scope,
      ...rest,
      domains: resolveDomains(rest.code, rest.palace, tenGodForDomain),
    };
    this.items.push(item);
    return item;
  }
}

/** 지지 관계 요인 공통 추가 */
function addRelation(
  col: EvidenceCollector,
  source: ScopeType,
  code: EvidenceCode,
  key: string,
  polarity: EvidenceItem['polarity'],
  weight: number,
  inScore: boolean,
  incomingBranch: string,
  pos: PillarPosition,
  spec: NatalPillarSpec,
  ctx: NatalContext,
  legacyLabel: string,
) {
  const inc = incomingBranchP(source, incomingBranch, ctx);
  col.add({
    code, key, polarity, weight, inScore,
    participants: [inc, natalBranchP(pos, spec)],
    palace: PALACE_BY_POSITION[pos],
    hiddenStemInteractions: hiddenStemInteractions(incomingBranch, spec.branch),
    legacyLabel,
    tenGodForDomain: inc.tenGod,
  });
}

function domainSignals(items: EvidenceItem[]): DomainSignal[] {
  const map = new Map<DomainCode, DomainSignal>();
  for (const e of items) {
    for (const d of e.domains) {
      const s = map.get(d) || { domain: d, up: 0, down: 0, net: 0, evidenceIds: [] };
      if (e.weight > 0) s.up += e.weight;
      if (e.weight < 0) s.down += e.weight;
      s.net = s.up + s.down;
      s.evidenceIds.push(e.id);
      map.set(d, s);
    }
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

const sumInScore = (items: EvidenceItem[]) => {
  const up = items.filter(e => e.inScore && e.weight > 0).reduce((a, e) => a + e.weight, 0);
  const down = items.filter(e => e.inScore && e.weight < 0).reduce((a, e) => a + e.weight, 0);
  return { up, down, raw: up + down };
};

// ───────────────────────── 세운 ─────────────────────────

const STAGE_HANJA: Record<string, string> = { 사: '死', 묘: '墓', 절: '絶', 건록: '建祿', 제왕: '帝旺', 장생: '長生' };

function buildSewoon(wh: CanonicalLifeDataWarehouse, ctx: NatalContext) {
  const nodes: TimelineNode[] = [];
  const evidence: EvidenceItem[] = [];

  for (const rec of wh.sewoonLayer.records) {
    const s = rec.stem;
    const b = rec.branch;
    const col = new EvidenceCollector(`SW${rec.year}`, { type: 'sewoon', year: rec.year });
    const sElem = elemOfStem(s);
    const bElem = elemOfBranch(b);

    // 1) 원국 지지와 충·파·해 (창고 규칙과 동일)
    for (const { pos, spec } of ctx.branches) {
      const pName = POSITION_LABEL[pos];
      if (SIX_CLASHES[b]?.partner === spec.branch) {
        addRelation(col, 'sewoon', 'REL_CHUNG', SIX_CLASHES[b].name, 'down', pos === 'day' ? -25 : -18, true, b, pos, spec, ctx, `${pName} ${SIX_CLASHES[b].name}`);
      }
      if (SIX_DESTRUCTIONS[b]?.partner === spec.branch) {
        addRelation(col, 'sewoon', 'REL_PA', SIX_DESTRUCTIONS[b].name, 'down', -12, true, b, pos, spec, ctx, `${pName} ${SIX_DESTRUCTIONS[b].name}`);
      }
      if (SIX_HARMS[b]?.partner === spec.branch) {
        addRelation(col, 'sewoon', 'REL_HAE', SIX_HARMS[b].name, 'down', -12, true, b, pos, spec, ctx, `${pName} ${SIX_HARMS[b].name}`);
      }
    }

    // 2) 공망
    if (ctx.gongmang.includes(b)) {
      col.add({ code: 'GONGMANG', key: b, polarity: 'down', weight: -15, inScore: true, participants: [incomingBranchP('sewoon', b, ctx)], legacyLabel: `세운 ${b} 공망(空亡)` });
    }

    // 3) 12운성
    const stage = getTwelveStage(ctx.dayStem, b);
    if (['사', '묘', '절'].includes(stage)) {
      col.add({ code: 'STAGE_WEAK', key: stage, polarity: 'down', weight: -15, inScore: true, participants: [incomingBranchP('sewoon', b, ctx)], legacyLabel: `12운성 ${stage}(${STAGE_HANJA[stage]})` });
    } else if (['건록', '제왕', '장생'].includes(stage)) {
      col.add({ code: 'STAGE_STRONG', key: stage, polarity: 'up', weight: 20, inScore: true, participants: [incomingBranchP('sewoon', b, ctx)], legacyLabel: `12운성 ${stage}(${STAGE_HANJA[stage]})` });
    }

    // 4) 용신 / 희신 / 기신
    const elemParticipants = (target: string): EvidenceParticipant[] => {
      const ps: EvidenceParticipant[] = [];
      if (sElem === target) ps.push(incomingStemP('sewoon', s, ctx));
      if (bElem === target) ps.push(incomingBranchP('sewoon', b, ctx));
      return ps;
    };
    if (sElem === ctx.primary || bElem === ctx.primary) {
      col.add({ code: 'YONGSHIN_IN', key: ctx.primary, polarity: 'up', weight: 25, inScore: true, participants: elemParticipants(ctx.primary), legacyLabel: `주용신 ${ctx.primary} 유입` });
    } else if (sElem === ctx.secondary || bElem === ctx.secondary) {
      col.add({ code: 'HEESHIN_IN', key: ctx.secondary, polarity: 'up', weight: 15, inScore: true, participants: elemParticipants(ctx.secondary), legacyLabel: `희신 ${ctx.secondary} 유입` });
    }
    if (sElem === ctx.dayElement && bElem === ctx.dayElement) {
      col.add({ code: 'GISHIN_IN', key: ctx.dayElement, polarity: 'down', weight: -15, inScore: true, participants: elemParticipants(ctx.dayElement), legacyLabel: '비겁 기신 과다' });
    }

    // 5) 신살 (천을귀인 = 점수 반영, 나머지 = 배경)
    const sins = detectBranchSinsals(b, ctx.dayStem, ctx.dayBranch, ctx.yearBranch);
    for (const sn of sins) {
      if (sn.includes('천을귀인')) {
        col.add({ code: 'SINSAL_GUIIN', key: '천을귀인', polarity: 'up', weight: 22, inScore: true, participants: [incomingBranchP('sewoon', b, ctx)], legacyLabel: sn });
      } else {
        const code: EvidenceCode = sn.includes('역마') ? 'SINSAL_YEOKMA' : sn.includes('도화') ? 'SINSAL_DOHWA' : 'SINSAL_HWAGAE';
        col.add({ code, key: sn.replace(/\(.*\)/, ''), polarity: 'neutral', weight: 0, inScore: false, participants: [incomingBranchP('sewoon', b, ctx)], legacyLabel: sn });
      }
    }

    // 6) 배경 요인: 육합·원진 (현 그래프 점수 미반영)
    for (const { pos, spec } of ctx.branches) {
      if (SIX_HARMONIES[b]?.partner === spec.branch) {
        addRelation(col, 'sewoon', 'REL_YUKHAP', SIX_HARMONIES[b].name, 'neutral', 0, false, b, pos, spec, ctx, `${POSITION_LABEL[pos]}(${spec.branch})와 육합(六合)`);
      }
      if (WONJIN_PAIRS[b]?.partner === spec.branch) {
        addRelation(col, 'sewoon', 'REL_WONJIN', WONJIN_PAIRS[b].name, 'neutral', 0, false, b, pos, spec, ctx, `${POSITION_LABEL[pos]} ${WONJIN_PAIRS[b].name}`);
      }
    }

    const sum = sumInScore(col.items);
    nodes.push({
      nodeId: `SW${rec.year}`,
      type: 'sewoon',
      year: rec.year,
      age: rec.age,
      daewoonOrder: rec.daewoonOrder,
      ganji: rec.ganji,
      stemTenGod: rec.stemTenGod,
      branchTenGod: rec.branchTenGod,
      twelveStage: rec.twelveStage,
      isGongmang: rec.isGongmang,
      score: { raw: sum.raw, display: rec.stepHeight, level: rec.level },
      upSum: sum.up,
      downSum: sum.down,
      isCurrent: rec.isCurrentYear,
      evidenceIds: col.items.map(e => e.id),
      domainSignals: domainSignals(col.items),
    });
    evidence.push(...col.items);
  }
  return { nodes, evidence };
}

// ───────────────────────── 대운 ─────────────────────────

function buildDaewoon(wh: CanonicalLifeDataWarehouse, ctx: NatalContext) {
  const nodes: TimelineNode[] = [];
  const evidence: EvidenceItem[] = [];

  for (const d of wh.daewoonLayer.records) {
    const prefix = `DW${String(d.order).padStart(2, '0')}`;
    const col = new EvidenceCollector(prefix, { type: 'daewoon', daewoonOrder: d.order });

    // [점수 구성 요인] 창고 energyScore 규칙 그대로 (천간·지지 각각)
    const scoreSlot = (slot: 'stem' | 'branch') => {
      const ch = slot === 'stem' ? d.stem : d.branch;
      const el = slot === 'stem' ? elemOfStem(ch) : elemOfBranch(ch);
      const p = slot === 'stem' ? incomingStemP('daewoon', ch, ctx) : incomingBranchP('daewoon', ch, ctx);
      const where = slot === 'stem' ? '천간' : '지지';
      if (el === ctx.primary) col.add({ code: 'YONGSHIN_IN', key: el, polarity: 'up', weight: 25, inScore: true, participants: [p], legacyLabel: `${where} 주용신 ${el}` });
      else if (el === ctx.secondary) col.add({ code: 'HEESHIN_IN', key: el, polarity: 'up', weight: 15, inScore: true, participants: [p], legacyLabel: `${where} 희신 ${el}` });
      else if (el === ctx.dayElement) col.add({ code: 'GISHIN_IN', key: el, polarity: 'down', weight: -15, inScore: true, participants: [p], legacyLabel: `${where} 비겁 기신 ${el}` });
    };
    scoreSlot('stem');
    scoreSlot('branch');

    // [배경 요인] 그래프 대운 뱃지 규칙 (extractDaewoonFactors 와 동일 가중치, 점수 미반영)
    const bp = incomingBranchP('daewoon', d.branch, ctx);
    if (['건록', '제왕', '장생', '관대'].includes(d.twelveStage)) {
      col.add({ code: 'STAGE_STRONG', key: d.twelveStage, polarity: 'up', weight: 15, inScore: false, participants: [bp], legacyLabel: `12운성 ${d.twelveStage}` });
    } else if (['사', '묘', '절'].includes(d.twelveStage)) {
      col.add({ code: 'STAGE_WEAK', key: d.twelveStage, polarity: 'down', weight: -12, inScore: false, participants: [bp], legacyLabel: `12운성 ${d.twelveStage}` });
    }
    if (['정관', '정재', '식신', '정인'].includes(d.stemTenGod)) {
      col.add({ code: 'TENGOD_SUPPORT', key: d.stemTenGod, polarity: 'up', weight: 12, inScore: false, participants: [incomingStemP('daewoon', d.stem, ctx)], legacyLabel: d.stemTenGod, tenGodForDomain: d.stemTenGod });
    } else if (['편관', '상관', '겁재'].includes(d.stemTenGod)) {
      col.add({ code: 'TENGOD_PRESSURE', key: d.stemTenGod, polarity: 'down', weight: -10, inScore: false, participants: [incomingStemP('daewoon', d.stem, ctx)], legacyLabel: d.stemTenGod, tenGodForDomain: d.stemTenGod });
    }
    for (const sn of d.activeSinsals) {
      if (sn.includes('귀인')) col.add({ code: 'SINSAL_GUIIN', key: '천을귀인', polarity: 'up', weight: 15, inScore: false, participants: [bp], legacyLabel: sn });
      else if (sn.includes('도화')) col.add({ code: 'SINSAL_DOHWA', key: '도화살', polarity: 'up', weight: 8, inScore: false, participants: [bp], legacyLabel: sn });
      else if (sn.includes('화개')) col.add({ code: 'SINSAL_HWAGAE', key: '화개살', polarity: 'up', weight: 8, inScore: false, participants: [bp], legacyLabel: sn });
      else if (sn.includes('역마')) col.add({ code: 'SINSAL_YEOKMA', key: '역마살', polarity: 'down', weight: -10, inScore: false, participants: [bp], legacyLabel: sn });
    }
    for (const { pos, spec } of ctx.branches) {
      const label = POSITION_LABEL[pos];
      if (SIX_HARMONIES[d.branch]?.partner === spec.branch) {
        addRelation(col, 'daewoon', 'REL_YUKHAP', SIX_HARMONIES[d.branch].name, 'up', 14, false, d.branch, pos, spec, ctx, `${label}(${spec.branch})와 육합(六合)`);
      }
      if (SIX_CLASHES[d.branch]?.partner === spec.branch) {
        addRelation(col, 'daewoon', 'REL_CHUNG', SIX_CLASHES[d.branch].name, 'down', -20, false, d.branch, pos, spec, ctx, `${label}(${spec.branch})와 충(沖)`);
      }
    }
    if (d.isGongmang) {
      col.add({ code: 'GONGMANG', key: d.branch, polarity: 'down', weight: -15, inScore: false, participants: [bp], legacyLabel: `대운 ${d.branch} 공망` });
    }

    const sum = sumInScore(col.items);
    nodes.push({
      nodeId: prefix,
      type: 'daewoon',
      daewoonOrder: d.order,
      startYear: d.startYear,
      endYear: d.endYear,
      ageRange: [d.startAge, d.endAge],
      ganji: d.ganji,
      stemTenGod: d.stemTenGod,
      branchTenGod: d.branchTenGod,
      twelveStage: d.twelveStage,
      isGongmang: d.isGongmang,
      score: { raw: sum.raw, display: d.energyScore, level: d.level },
      upSum: sum.up,
      downSum: sum.down,
      isCurrent: d.isCurrent,
      evidenceIds: col.items.map(e => e.id),
      domainSignals: domainSignals(col.items),
    });
    evidence.push(...col.items);
  }
  return { nodes, evidence };
}

// ───────────────────────── 월운 ─────────────────────────

function monthLevel(step: number): string {
  if (step >= 80) return '최상';
  if (step >= 50) return '길';
  if (step <= -75) return '대흉';
  if (step <= -40) return '흉';
  return '평';
}

/**
 * 특정 연도의 12개월(절기월) 월운 노드 + 근거 산출
 * (관리자 패널 calculate12MonthsWoon 의 공식 모듈 버전)
 */
export function buildWolwoonForYear(wh: CanonicalLifeDataWarehouse, targetYear: number): { nodes: TimelineNode[]; evidence: EvidenceItem[] } {
  const ctx = buildNatalContext(wh);
  const nodes: TimelineNode[] = [];
  const evidence: EvidenceItem[] = [];

  const yearStemIdx = ((targetYear - 4) % 10 + 10) % 10;
  const firstStemIdx = ((yearStemIdx % 5) * 2 + 2) % 10;
  const daySpec = ctx.branches.find(x => x.pos === 'day');
  const monthSpec = ctx.branches.find(x => x.pos === 'month');
  const now = new Date();
  const curYear = wh.sewoonLayer.currentYear;

  for (let m = 0; m < 12; m++) {
    const s = STEMS[(firstStemIdx + m) % 10];
    const b = MONTH_BRANCHES[m];
    const monthNum = m + 1;
    const mm = String(monthNum).padStart(2, '0');
    const prefix = `WW${targetYear}M${mm}`;
    const col = new EvidenceCollector(prefix, { type: 'wolwoon', year: targetYear, month: monthNum });
    const sElem = elemOfStem(s);
    const bElem = elemOfBranch(b);
    const bp = () => incomingBranchP('wolwoon', b, ctx);

    // 12운성
    const stage = getTwelveStage(ctx.dayStem, b);
    if (['건록', '제왕', '장생'].includes(stage)) {
      col.add({ code: 'STAGE_STRONG', key: stage, polarity: 'up', weight: stage === '제왕' ? 22 : 18, inScore: true, participants: [bp()], legacyLabel: `12운성 ${stage}` });
    } else if (['사', '묘', '절'].includes(stage)) {
      col.add({ code: 'STAGE_WEAK', key: stage, polarity: 'down', weight: -15, inScore: true, participants: [bp()], legacyLabel: `12운성 ${stage}` });
    }

    // 일지 / 월지 충 (일지 우선)
    if (daySpec && SIX_CLASHES[b]?.partner === daySpec.spec.branch) {
      addRelation(col, 'wolwoon', 'REL_CHUNG', SIX_CLASHES[b].name, 'down', -25, true, b, 'day', daySpec.spec, ctx, `일지 충(${b}${daySpec.spec.branch}충)`);
    } else if (monthSpec && SIX_CLASHES[b]?.partner === monthSpec.spec.branch) {
      addRelation(col, 'wolwoon', 'REL_CHUNG', SIX_CLASHES[b].name, 'down', -18, true, b, 'month', monthSpec.spec, ctx, `월지 충(${b}${monthSpec.spec.branch}충)`);
    }
    if (daySpec) {
      const db = daySpec.spec.branch;
      if (SIX_HARMS[b]?.partner === db) addRelation(col, 'wolwoon', 'REL_HAE', SIX_HARMS[b].name, 'down', -12, true, b, 'day', daySpec.spec, ctx, `일지 해(${b}${db}해)`);
      if (SIX_DESTRUCTIONS[b]?.partner === db) addRelation(col, 'wolwoon', 'REL_PA', SIX_DESTRUCTIONS[b].name, 'down', -10, true, b, 'day', daySpec.spec, ctx, `일지 파(${b}${db}파)`);
      if (WONJIN_PAIRS[b]?.partner === db) addRelation(col, 'wolwoon', 'REL_WONJIN', WONJIN_PAIRS[b].name, 'down', -15, true, b, 'day', daySpec.spec, ctx, `일지 원진(${b}${db}원진)`);
    }

    // 공망
    if (ctx.gongmang.includes(b)) {
      col.add({ code: 'GONGMANG', key: b, polarity: 'down', weight: -15, inScore: true, participants: [bp()], legacyLabel: `월운 ${b} 공망` });
    }

    // 용신 / 희신 / 기신 (오행 한 글자 기준 비교)
    const elemParticipants = (target: string): EvidenceParticipant[] => {
      const ps: EvidenceParticipant[] = [];
      if (sElem === target) ps.push(incomingStemP('wolwoon', s, ctx));
      if (bElem === target) ps.push(bp());
      return ps;
    };
    if (sElem === ctx.primary || bElem === ctx.primary) {
      col.add({ code: 'YONGSHIN_IN', key: ctx.primary, polarity: 'up', weight: 24, inScore: true, participants: elemParticipants(ctx.primary), legacyLabel: `주용신 ${ctx.primary} 유입` });
    } else if (sElem === ctx.secondary || bElem === ctx.secondary) {
      col.add({ code: 'HEESHIN_IN', key: ctx.secondary, polarity: 'up', weight: 14, inScore: true, participants: elemParticipants(ctx.secondary), legacyLabel: `희신 ${ctx.secondary} 유입` });
    }
    if (sElem === ctx.gishin && bElem === ctx.gishin) {
      col.add({ code: 'GISHIN_IN', key: ctx.gishin, polarity: 'down', weight: -16, inScore: true, participants: elemParticipants(ctx.gishin), legacyLabel: `기신 ${ctx.gishin} 중첩` });
    }

    const sum = sumInScore(col.items);
    const display = sum.raw >= 0
      ? Math.min(80, Math.round((sum.raw / 40) * 65))
      : Math.max(-80, Math.round((sum.raw / 40) * 65));

    nodes.push({
      nodeId: prefix,
      type: 'wolwoon',
      year: targetYear,
      month: monthNum,
      solarTerm: SOLAR_TERMS_12[m],
      approxGregorianStart: SOLAR_TERM_APPROX[m],
      ganji: `${s}${b}`,
      stemTenGod: stemTenGod(ctx.dayStem, s),
      branchTenGod: branchTenGod(ctx.dayStem, b),
      twelveStage: stage,
      isGongmang: ctx.gongmang.includes(b),
      score: { raw: sum.raw, display, level: monthLevel(display) },
      upSum: sum.up,
      downSum: sum.down,
      isCurrent: targetYear === curYear && monthNum === ((now.getMonth() + 11) % 12 || 12),
      evidenceIds: col.items.map(e => e.id),
      domainSignals: domainSignals(col.items),
    });
    evidence.push(...col.items);
  }
  return { nodes, evidence };
}

// ───────────────────────── 과거 검증 슬롯 ─────────────────────────

function buildVerificationSlots(sewoon: TimelineNode[], evidence: EvidenceItem[], currentYear: number): VerificationSlot[] {
  const byId = new Map(evidence.map(e => [e.id, e]));
  const past = sewoon.filter(n => (n.year ?? 0) < currentYear && (n.age ?? 0) >= 7 && Math.abs(n.score.display) >= 50);
  const pick = (dir: 'up' | 'down') => past
    .filter(n => (dir === 'up' ? n.score.display > 0 : n.score.display < 0))
    .sort((a, b) => Math.abs(b.score.display) - Math.abs(a.score.display))
    .slice(0, 3);
  return [...pick('up'), ...pick('down')]
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
    .map(n => {
      const ids = n.evidenceIds.filter(id => byId.get(id)?.inScore);
      const domains = Array.from(new Set(ids.flatMap(id => byId.get(id)?.domains || [])));
      return {
        slotId: `VF-${n.nodeId}`,
        nodeId: n.nodeId,
        year: n.year as number,
        direction: n.score.display > 0 ? 'up' : 'down',
        intensity: Math.abs(n.score.display),
        evidenceIds: ids,
        domains,
        userAnswer: null,
        answeredAt: null,
      } as VerificationSlot;
    });
}

// ───────────────────────── 패킷 조립 ─────────────────────────

export const EVIDENCE_CONTRACT_RULES: string[] = [
  '패킷에 없는 명리 요인(충·합·신살·십신 등)을 새로 만들어 언급하지 않는다.',
  '해석 문장마다 근거 요인 id 를 [E:<id>] 형식으로 붙인다.',
  '요인의 방향(polarity)과 가중치 부호를 뒤집어 해석하지 않는다.',
  'inScore=false 요인은 점수에 반영되지 않은 배경 요인으로만 다룬다.',
  '노드 점수(score.display)의 상승·하강 판정과 모순되는 결론을 내리지 않는다.',
  '의료·법률·투자에 대한 단정적 지시는 하지 않는다.',
  '말투·비유·분량은 자유이나, 근거와 시기는 패킷과 일치해야 한다.',
];

export function buildEvidencePacket(
  wh: CanonicalLifeDataWarehouse,
  options: { wolwoonYears?: number[] } = {},
): SajuEvidencePacket {
  const ctx = buildNatalContext(wh);
  const currentYear = wh.sewoonLayer.currentYear;
  const inp = wh.metadata.input;
  const subjectRef = `subj_${fnv1a(`${inp.birthDate}|${inp.birthTime ?? ''}|${inp.gender}|${inp.calendarType}`)}`;

  const dw = buildDaewoon(wh, ctx);
  const sw = buildSewoon(wh, ctx);
  const years = options.wolwoonYears ?? [currentYear, currentYear + 1];
  const ww = years.map(y => ({ year: y, ...buildWolwoonForYear(wh, y) }));

  const evidence = [...dw.evidence, ...sw.evidence, ...ww.flatMap(w => w.evidence)];

  return {
    schema: EVIDENCE_SCHEMA_VERSION,
    ruleSet: EVIDENCE_RULESET_VERSION,
    engineVersion: wh.metadata.engineVersion,
    packetId: `PKT-${fnv1a(`${subjectRef}|${EVIDENCE_RULESET_VERSION}|${currentYear}|${years.join(',')}`)}`,
    subjectRef,
    generatedAt: new Date().toISOString(),
    disclosure: 'internal',
    subjectInput: { ...inp },
    subject: {
      gender: inp.gender,
      birthTimeKnown: !!inp.birthTime,
      dayMaster: {
        stem: wh.natalLayer.dayMaster.stem,
        hanja: wh.natalLayer.dayMaster.hanja,
        element: wh.natalLayer.dayMaster.element,
        polarity: wh.natalLayer.dayMaster.polarity,
      },
      strength: { classification: wh.natalLayer.strength.classification, score: wh.natalLayer.strength.score },
      geokguk: wh.natalLayer.geokguk.name,
      yongshin: { primary: ctx.primary, secondary: ctx.secondary, gishin: ctx.gishin, johu: parseElement(wh.natalLayer.yongshin.johuYongshin, '') },
      fiveElements: {
        wood: wh.natalLayer.fiveElements.wood,
        fire: wh.natalLayer.fiveElements.fire,
        earth: wh.natalLayer.fiveElements.earth,
        metal: wh.natalLayer.fiveElements.metal,
        water: wh.natalLayer.fiveElements.water,
        dominant: wh.natalLayer.fiveElements.dominant,
        lacking: wh.natalLayer.fiveElements.lacking,
      },
      pillars: wh.natalLayer.pillars.map((p, i) => ({
        position: POSITIONS[i],
        palace: PALACE_BY_POSITION[POSITIONS[i]],
        stem: p.stem, stemHanja: p.stemHanja, stemTenGod: p.stemTenGod,
        branch: p.branch, branchHanja: p.branchHanja, branchTenGod: p.branchTenGod,
        twelveStage: p.twelveStage, isGongmang: p.isGongmang, hiddenStems: p.hiddenStems,
      })),
      natalRelations: wh.natalLayer.natalRelations,
      natalSinsals: wh.natalLayer.natalSinsals,
      flowChannels: {
        shiksangSaengJae: wh.deepStructure.flowChannels.shiksangSaengJae,
        jaeSaengGwan: wh.deepStructure.flowChannels.jaeSaengGwan,
        gwanInSaeng: wh.deepStructure.flowChannels.gwanInSaeng,
        biGeopBunsan: wh.deepStructure.flowChannels.biGeopBunsan,
      },
    },
    timeline: {
      currentYear,
      currentDaewoonOrder: wh.daewoonLayer.currentDaewoonOrder,
      daewoon: dw.nodes,
      sewoon: sw.nodes,
      wolwoon: ww.map(w => ({ year: w.year, months: w.nodes })),
    },
    evidence,
    verificationSlots: buildVerificationSlots(sw.nodes, sw.evidence, currentYear),
    contract: { citationFormat: '[E:<id>]', rules: EVIDENCE_CONTRACT_RULES },
  };
}

// ───────────────────────── 공개 범위 필터 ─────────────────────────

/**
 * 공개 범위별 패킷 축소
 * - internal: 전체 (생년월일시 포함)
 * - paid: 생년월일시 제외, 전체 타임라인
 * - partner: 생년월일시·나이 제외, 검증 슬롯 제외
 * - free: 현재 대운 + 올해·내년 세운만, 월운·검증 슬롯 제외
 */
export function scopeEvidencePacket(packet: SajuEvidencePacket, scope: DisclosureScope): SajuEvidencePacket {
  const p: SajuEvidencePacket = JSON.parse(JSON.stringify(packet));
  p.disclosure = scope;
  if (scope === 'internal') return p;
  delete p.subjectInput;

  if (scope === 'partner') {
    const strip = (n: TimelineNode) => { delete n.age; delete n.ageRange; };
    p.timeline.daewoon.forEach(strip);
    p.timeline.sewoon.forEach(strip);
    p.timeline.wolwoon.forEach(w => w.months.forEach(strip));
    p.verificationSlots = [];
  }

  if (scope === 'free') {
    const cy = p.timeline.currentYear;
    p.timeline.daewoon = p.timeline.daewoon.filter(n => n.isCurrent);
    p.timeline.sewoon = p.timeline.sewoon.filter(n => n.year === cy || n.year === cy + 1);
    p.timeline.wolwoon = [];
    p.verificationSlots = [];
  }

  if (scope === 'free' || scope === 'partner') {
    const used = new Set<string>([
      ...p.timeline.daewoon.flatMap(n => n.evidenceIds),
      ...p.timeline.sewoon.flatMap(n => n.evidenceIds),
      ...p.timeline.wolwoon.flatMap(w => w.months.flatMap(n => n.evidenceIds)),
    ]);
    p.evidence = p.evidence.filter(e => used.has(e.id));
  }
  return p;
}
