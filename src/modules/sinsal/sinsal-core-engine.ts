/**
 * Phase 50: 신살 코어 엔진 (Sinsal Core Engine)
 * 
 * 원국 4주를 정밀 분석하여 25종 신살의 존재(presentInNatal), 위치(natalLocations),
 * 산출 근거(calculationEvidence), 신뢰도 및 상태를 명시적 Rule 기반으로 판정.
 */

import { FourPillars, HeavenlyStem, EarthlyBranch, Pillar } from '../../core/types.js';
import { SINSAL_DEFINITIONS } from './sinsal-db.js';
import { 
  SinsalCalculationResult, 
  PillarLocation, 
  SinsalCalculationBasis, 
  SinsalScoreBreakdown,
  ScoreModifier
} from './sinsal-types.js';

// 한글 <-> 한자 정규화 맵
export const STEM_MAP: Record<string, { hanja: string; hangul: string }> = {
  '갑': { hanja: '甲', hangul: '갑' }, '甲': { hanja: '甲', hangul: '갑' },
  '을': { hanja: '乙', hangul: '을' }, '乙': { hanja: '乙', hangul: '을' },
  '병': { hanja: '丙', hangul: '병' }, '丙': { hanja: '丙', hangul: '병' },
  '정': { hanja: '丁', hangul: '정' }, '丁': { hanja: '丁', hangul: '정' },
  '무': { hanja: '戊', hangul: '무' }, '戊': { hanja: '戊', hangul: '무' },
  '기': { hanja: '己', hangul: '기' }, '己': { hanja: '己', hangul: '기' },
  '경': { hanja: '庚', hangul: '경' }, '庚': { hanja: '庚', hangul: '경' },
  '신': { hanja: '辛', hangul: '신' }, '辛': { hanja: '辛', hangul: '신' },
  '임': { hanja: '壬', hangul: '임' }, '壬': { hanja: '壬', hangul: '임' },
  '계': { hanja: '癸', hangul: '계' }, '癸': { hanja: '癸', hangul: '계' },
};

export const BRANCH_MAP: Record<string, { hanja: string; hangul: string }> = {
  '자': { hanja: '子', hangul: '자' }, '子': { hanja: '子', hangul: '자' },
  '축': { hanja: '丑', hangul: '축' }, '丑': { hanja: '丑', hangul: '축' },
  '인': { hanja: '寅', hangul: '인' }, '寅': { hanja: '寅', hangul: '인' },
  '묘': { hanja: '卯', hangul: '묘' }, '卯': { hanja: '卯', hangul: '묘' },
  '진': { hanja: '辰', hangul: '진' }, '辰': { hanja: '辰', hangul: '진' },
  '사': { hanja: '巳', hangul: '사' }, '巳': { hanja: '巳', hangul: '사' },
  '오': { hanja: '午', hangul: '오' }, '午': { hanja: '午', hangul: '오' },
  '미': { hanja: '未', hangul: '미' }, '未': { hanja: '未', hangul: '미' },
  '신': { hanja: '申', hangul: '신' }, '申': { hanja: '申', hangul: '신' },
  '유': { hanja: '酉', hangul: '유' }, '酉': { hanja: '酉', hangul: '유' },
  '술': { hanja: '戌', hangul: '술' }, '戌': { hanja: '戌', hangul: '술' },
  '해': { hanja: '亥', hangul: '해' }, '亥': { hanja: '亥', hangul: '해' },
};

// 삼합 4국 정의
export const SAMHAP_GROUPS = {
  FIRE: ['인', '오', '술'], // 寅午戌 화국
  WATER: ['신', '자', '진'], // 申子辰 수국
  METAL: ['사', '유', '축'], // 巳酉丑 금국
  WOOD: ['해', '묘', '미'], // 亥卯未 목국
};

// 12신살 삼합별 지지 배치표 [겁, 재, 천, 지, 년, 월, 망, 장, 반, 역, 육, 화]
export const SINSAL_12_ORDER = [
  'geob_sal', 'jae_sal', 'cheon_sal', 'ji_sal',
  'nyeon_sal', 'wol_sal', 'mang_sin', 'jang_seong',
  'ban_an', 'yeok_ma', 'yuk_hae', 'hwa_gae'
] as const;

export const SAMHAP_12SINSAL_MAP: Record<string, Record<string, string>> = {
  FIRE: {
    '해': 'geob_sal', '자': 'jae_sal', '축': 'cheon_sal', '인': 'ji_sal',
    '묘': 'nyeon_sal', '진': 'wol_sal', '사': 'mang_sin', '오': 'jang_seong',
    '미': 'ban_an', '신': 'yeok_ma', '유': 'yuk_hae', '술': 'hwa_gae',
  },
  WATER: {
    '사': 'geob_sal', '오': 'jae_sal', '미': 'cheon_sal', '신': 'ji_sal',
    '유': 'nyeon_sal', '술': 'wol_sal', '해': 'mang_sin', '자': 'jang_seong',
    '축': 'ban_an', '인': 'yeok_ma', '묘': 'yuk_hae', '진': 'hwa_gae',
  },
  METAL: {
    '인': 'geob_sal', '묘': 'jae_sal', '진': 'cheon_sal', '사': 'ji_sal',
    '오': 'nyeon_sal', '미': 'wol_sal', '신': 'mang_sin', '유': 'jang_seong',
    '술': 'ban_an', '해': 'yeok_ma', '자': 'yuk_hae', '축': 'hwa_gae',
  },
  WOOD: {
    '신': 'geob_sal', '유': 'jae_sal', '술': 'cheon_sal', '해': 'ji_sal',
    '자': 'nyeon_sal', '축': 'wol_sal', '인': 'mang_sin', '묘': 'jang_seong',
    '진': 'ban_an', '사': 'yeok_ma', '오': 'yuk_hae', '미': 'hwa_gae',
  },
};

export class SinsalCoreEngine {
  /**
   * 지지가 속한 삼합 그룹 반환 ('FIRE' | 'WATER' | 'METAL' | 'WOOD')
   */
  public getSamhapGroup(branch: string): 'FIRE' | 'WATER' | 'METAL' | 'WOOD' {
    const b = BRANCH_MAP[branch]?.hangul || branch;
    if (SAMHAP_GROUPS.FIRE.includes(b)) return 'FIRE';
    if (SAMHAP_GROUPS.WATER.includes(b)) return 'WATER';
    if (SAMHAP_GROUPS.METAL.includes(b)) return 'METAL';
    if (SAMHAP_GROUPS.WOOD.includes(b)) return 'WOOD';
    return 'FIRE';
  }

  /**
   * 60갑자 순중공망 지지 2개 반환
   */
  public getGongmangBranches(stem: string, branch: string): [string, string] {
    const s = STEM_MAP[stem]?.hangul || stem;
    const b = BRANCH_MAP[branch]?.hangul || branch;

    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    const sIdx = stems.indexOf(s);
    const bIdx = branches.indexOf(b);
    if (sIdx === -1 || bIdx === -1) return ['오', '미'];

    // 순두(旬頭) 계산: (bIdx - sIdx + 12) % 12
    const leadBranchIdx = (bIdx - sIdx + 12) % 12;
    // 공망은 순의 마지막 2개 지지: leadBranchIdx + 10, leadBranchIdx + 11
    const gm1 = branches[(leadBranchIdx + 10) % 12];
    const gm2 = branches[(leadBranchIdx + 11) % 12];
    return [gm1, gm2];
  }

  /**
   * 원국 4주에서 25종 신살 산출
   */
  public calculateNatalSinsals(fourPillars: FourPillars, preferDayBasis = false): SinsalCalculationResult[] {
    const results: SinsalCalculationResult[] = [];

    const yearStem = STEM_MAP[fourPillars.year.stem]?.hangul || fourPillars.year.stem;
    const yearBranch = BRANCH_MAP[fourPillars.year.branch]?.hangul || fourPillars.year.branch;

    const monthStem = STEM_MAP[fourPillars.month.stem]?.hangul || fourPillars.month.stem;
    const monthBranch = BRANCH_MAP[fourPillars.month.branch]?.hangul || fourPillars.month.branch;

    const dayStem = STEM_MAP[fourPillars.day.stem]?.hangul || fourPillars.day.stem;
    const dayBranch = BRANCH_MAP[fourPillars.day.branch]?.hangul || fourPillars.day.branch;

    const hourStem = fourPillars.hour ? (STEM_MAP[fourPillars.hour.stem]?.hangul || fourPillars.hour.stem) : null;
    const hourBranch = fourPillars.hour ? (BRANCH_MAP[fourPillars.hour.branch]?.hangul || fourPillars.hour.branch) : null;

    const pillarBranches: { loc: PillarLocation; branch: string }[] = [
      { loc: 'year', branch: yearBranch },
      { loc: 'month', branch: monthBranch },
      { loc: 'day', branch: dayBranch },
    ];
    if (hourBranch) {
      pillarBranches.push({ loc: 'hour', branch: hourBranch });
    }

    const pillarStems: { loc: PillarLocation; stem: string }[] = [
      { loc: 'year', stem: yearStem },
      { loc: 'month', stem: monthStem },
      { loc: 'day', stem: dayStem },
    ];
    if (hourStem) {
      pillarStems.push({ loc: 'hour', stem: hourStem });
    }

    // 12신살 기준 지지 선정 (기본: 년지, 일지 기준 병용)
    const baseBranchFor12 = preferDayBasis ? dayBranch : yearBranch;
    const samhapGroup = this.getSamhapGroup(baseBranchFor12);
    const sinsal12Map = SAMHAP_12SINSAL_MAP[samhapGroup];

    // ==========================================
    // 1. 12신살 12종 계산
    // ==========================================
    for (const sinsalId of SINSAL_12_ORDER) {
      const def = SINSAL_DEFINITIONS[sinsalId];
      const matchingLocations: PillarLocation[] = [];

      for (const pb of pillarBranches) {
        if (sinsal12Map[pb.branch] === sinsalId) {
          matchingLocations.push(pb.loc);
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 60 : 0;
      const modifiers: ScoreModifier[] = [];

      if (presentInNatal) {
        if (matchingLocations.includes('day')) {
          modifiers.push({ ruleId: 'MOD_DAY_PILLAR_WEIGHT', reason: '일지 위치 가중치 적용', delta: 15 });
        }
        if (matchingLocations.includes('month')) {
          modifiers.push({ ruleId: 'MOD_MONTH_PILLAR_WEIGHT', reason: '월지 위치 가중치 적용', delta: 10 });
        }
        if (matchingLocations.length > 1) {
          modifiers.push({ ruleId: 'MOD_MULTIPLE_APPEARANCE', reason: '복수 기둥 출현 가중치 적용', delta: 10 });
        }
      }

      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: preferDayBasis ? 'day_branch' : 'year_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.4) : 0,
        supportScore: 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `${preferDayBasis ? '일지' : '년지'} 삼합 기준 (${baseBranchFor12} -> ${samhapGroup}국)`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음',
          referenceValue: baseBranchFor12,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // ==========================================
    // 2. 주요 신살 13종 개별 정밀 계산
    // ==========================================

    // (13) 도화 (dohwa_major)
    {
      const def = SINSAL_DEFINITIONS['dohwa_major'];
      // 일지 삼합 목욕지 또는 자오묘유
      const daySamhap = this.getSamhapGroup(dayBranch);
      const bathBranchMap: Record<string, string> = { FIRE: '묘', WATER: '유', METAL: '오', WOOD: '자' };
      const targetBathBranch = bathBranchMap[daySamhap];
      const matchingLocations: PillarLocation[] = [];

      for (const pb of pillarBranches) {
        if (pb.branch === targetBathBranch || ['자', '오', '묘', '유'].includes(pb.branch)) {
          if (!matchingLocations.includes(pb.loc)) {
            matchingLocations.push(pb.loc);
          }
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 65 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('day')) {
        modifiers.push({ ruleId: 'MOD_DOHWA_DAY_BRANCH', reason: '일지 도화(일기도화) 가중', delta: 15 });
      }
      if (matchingLocations.includes('month')) {
        modifiers.push({ ruleId: 'MOD_DOHWA_MONTH_BRANCH', reason: '월지 도화 가중', delta: 10 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.35) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.45) : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `일지(${dayBranch}) 삼합 목욕지(${targetBathBranch}) 및 자오묘유 탐지`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음',
          referenceValue: dayBranch,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (14) 천을귀인 (cheoneul_guiin)
    {
      const def = SINSAL_DEFINITIONS['cheoneul_guiin'];
      const cheoneulMap: Record<string, string[]> = {
        '갑': ['축', '미'], '무': ['축', '미'], '경': ['축', '미'],
        '을': ['자', '신'], '기': ['자', '신'],
        '병': ['해', '유'], '정': ['해', '유'],
        '임': ['사', '묘'], '계': ['사', '묘'],
        '신': ['오', '인'],
      };
      const targets = cheoneulMap[dayStem] || [];
      const matchingLocations: PillarLocation[] = [];
      for (const pb of pillarBranches) {
        if (targets.includes(pb.branch)) {
          matchingLocations.push(pb.loc);
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 80 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.length > 1) {
        modifiers.push({ ruleId: 'MOD_DUAL_CHEONEUL', reason: '쌍귀인 출현 가중', delta: 15 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_stem',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: 0,
        supportScore: presentInNatal ? scoreBreakdown.final : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `일간(${dayStem}) 기준 천을귀인 지지(${targets.join(',')})`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음(운에서 유입 가능)',
          referenceValue: dayStem,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (15) 문창귀인 (munchang_guiin)
    {
      const def = SINSAL_DEFINITIONS['munchang_guiin'];
      const munchangMap: Record<string, string> = {
        '갑': '사', '을': '오', '병': '신', '무': '신',
        '정': '유', '기': '유', '경': '해', '신': '자',
        '임': '인', '계': '묘',
      };
      const target = munchangMap[dayStem];
      const matchingLocations: PillarLocation[] = [];
      for (const pb of pillarBranches) {
        if (pb.branch === target) matchingLocations.push(pb.loc);
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 75 : 0;
      const scoreBreakdown = this.createScoreBreakdown(baseScore, []);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_stem',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: 0,
        supportScore: presentInNatal ? scoreBreakdown.final : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `일간(${dayStem}) 기준 식신 건록지(${target})`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음',
          referenceValue: dayStem,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (16) 천덕귀인 (cheondeok_guiin)
    {
      const def = SINSAL_DEFINITIONS['cheondeok_guiin'];
      const cheondeokMap: Record<string, { stemOrBranch: 'stem' | 'branch'; target: string }> = {
        '자': { stemOrBranch: 'branch', target: '사' },
        '丑': { stemOrBranch: 'stem', target: '경' },
        '축': { stemOrBranch: 'stem', target: '경' },
        '인': { stemOrBranch: 'stem', target: '정' },
        '묘': { stemOrBranch: 'branch', target: '신' },
        '진': { stemOrBranch: 'stem', target: '임' },
        '사': { stemOrBranch: 'stem', target: '신' }, // 辛
        '오': { stemOrBranch: 'branch', target: '해' },
        '미': { stemOrBranch: 'stem', target: '갑' },
        '신': { stemOrBranch: 'stem', target: '계' },
        '유': { stemOrBranch: 'branch', target: '인' },
        '술': { stemOrBranch: 'stem', target: '병' },
        '해': { stemOrBranch: 'stem', target: '을' },
      };
      const ruleTarget = cheondeokMap[monthBranch];
      const matchingLocations: PillarLocation[] = [];

      if (ruleTarget) {
        if (ruleTarget.stemOrBranch === 'stem') {
          for (const ps of pillarStems) {
            if (ps.loc !== 'month' && ps.stem === ruleTarget.target) {
              matchingLocations.push(ps.loc);
            }
          }
        } else {
          for (const pb of pillarBranches) {
            if (pb.loc !== 'month' && pb.branch === ruleTarget.target) {
              matchingLocations.push(pb.loc);
            }
          }
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 75 : 0;
      const scoreBreakdown = this.createScoreBreakdown(baseScore, []);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'month_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: 0,
        supportScore: presentInNatal ? scoreBreakdown.final : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `월지(${monthBranch}) 기준 천덕(${ruleTarget?.target || '미지'})`,
          matchedTarget: matchingLocations.map(l => `${l}`).join(', ') || '없음',
          referenceValue: monthBranch,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (17) 월덕귀인 (woldeok_guiin)
    {
      const def = SINSAL_DEFINITIONS['woldeok_guiin'];
      const monthSamhap = this.getSamhapGroup(monthBranch);
      const woldeokStemMap: Record<string, string> = {
        FIRE: '병', WATER: '임', METAL: '경', WOOD: '갑'
      };
      const targetStem = woldeokStemMap[monthSamhap];
      const matchingLocations: PillarLocation[] = [];
      for (const ps of pillarStems) {
        if (ps.stem === targetStem) matchingLocations.push(ps.loc);
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 75 : 0;
      const scoreBreakdown = this.createScoreBreakdown(baseScore, []);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'month_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: 0,
        supportScore: presentInNatal ? scoreBreakdown.final : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `월지(${monthBranch} -> ${monthSamhap}국) 기준 삼합 양간(${targetStem})`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.stem}`).join(', ') || '없음',
          referenceValue: monthBranch,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (18) 양인 (yang_in)
    {
      const def = SINSAL_DEFINITIONS['yang_in'];
      const yanginBranchMap: Record<string, string> = {
        '갑': '묘', '병': '오', '무': '오', '경': '유', '임': '자'
      };
      const targetBranch = yanginBranchMap[dayStem];
      const matchingLocations: PillarLocation[] = [];
      if (targetBranch) {
        for (const pb of pillarBranches) {
          if (pb.branch === targetBranch) matchingLocations.push(pb.loc);
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 70 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('day')) {
        modifiers.push({ ruleId: 'MOD_DAY_YANGIN', reason: '일지 양인(일인) 작용', delta: 15 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_stem',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.6) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.3) : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `일간(${dayStem}) 기준 제왕지(${targetBranch || '음간/미해당'})`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음(운에서 유입 가능)',
          referenceValue: dayStem,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (19) 백호 (baek_ho)
    {
      const def = SINSAL_DEFINITIONS['baek_ho'];
      const baekhoPillars = ['갑진', '을미', '병술', '정축', '무진', '임술', '계축'];
      const matchingLocations: PillarLocation[] = [];

      const checkPillar = (p: Pillar | null, loc: PillarLocation) => {
        if (!p) return;
        const s = STEM_MAP[p.stem]?.hangul || p.stem;
        const b = BRANCH_MAP[p.branch]?.hangul || p.branch;
        if (baekhoPillars.includes(`${s}${b}`)) {
          matchingLocations.push(loc);
        }
      };
      checkPillar(fourPillars.year, 'year');
      checkPillar(fourPillars.month, 'month');
      checkPillar(fourPillars.day, 'day');
      checkPillar(fourPillars.hour, 'hour');

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 70 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('day')) {
        modifiers.push({ ruleId: 'MOD_DAY_BAEKHO', reason: '일주 백호(자좌백호) 가중', delta: 15 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'fixed_pillar',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.55) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.3) : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: '60갑자 중 7대 백호 간지 탐지',
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.stem}${fourPillars[l]?.branch}`).join(', ') || '없음',
          referenceValue: '7대 백호 목록',
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (20) 괴강 (goe_gang)
    {
      const def = SINSAL_DEFINITIONS['goe_gang'];
      const goegangPillars = ['경진', '경술', '임진', '무술'];
      const matchingLocations: PillarLocation[] = [];

      const checkPillar = (p: Pillar | null, loc: PillarLocation) => {
        if (!p) return;
        const s = STEM_MAP[p.stem]?.hangul || p.stem;
        const b = BRANCH_MAP[p.branch]?.hangul || p.branch;
        if (goegangPillars.includes(`${s}${b}`)) {
          matchingLocations.push(loc);
        }
      };
      checkPillar(fourPillars.year, 'year');
      checkPillar(fourPillars.month, 'month');
      checkPillar(fourPillars.day, 'day');
      checkPillar(fourPillars.hour, 'hour');

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 70 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('day')) {
        modifiers.push({ ruleId: 'MOD_DAY_GOEGANG', reason: '일주 괴강(핵심 괴강) 가중', delta: 20 });
      }
      if (matchingLocations.includes('hour')) {
        modifiers.push({ ruleId: 'MOD_HOUR_GOEGANG', reason: '시주 괴강(결단력/추진력) 가중', delta: 10 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'fixed_pillar',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.45) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.4) : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: '4대 괴강 간지 (경진, 경술, 임진, 무술) 탐지',
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.stem}${fourPillars[l]?.branch}`).join(', ') || '없음',
          referenceValue: '4대 괴강 목록',
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (21) 원진 (won_jin)
    {
      const def = SINSAL_DEFINITIONS['won_jin'];
      const wonjinPairs: [string, string][] = [
        ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']
      ];
      const matchingLocations: PillarLocation[] = [];
      const evidencePairs: string[] = [];

      // 일지 기준 타 지지 검사 및 원국 내 모든 지지 쌍 검사
      for (let i = 0; i < pillarBranches.length; i++) {
        for (let j = i + 1; j < pillarBranches.length; j++) {
          const b1 = pillarBranches[i].branch;
          const b2 = pillarBranches[j].branch;
          const isWonjin = wonjinPairs.some(([x, y]) => (b1 === x && b2 === y) || (b1 === y && b2 === x));
          if (isWonjin) {
            if (!matchingLocations.includes(pillarBranches[i].loc)) matchingLocations.push(pillarBranches[i].loc);
            if (!matchingLocations.includes(pillarBranches[j].loc)) matchingLocations.push(pillarBranches[j].loc);
            evidencePairs.push(`${pillarBranches[i].loc}(${b1})-${pillarBranches[j].loc}(${b2})`);
          }
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 65 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('day')) {
        modifiers.push({ ruleId: 'MOD_DAY_WONJIN', reason: '일지 포함 원진(배우자궁 애증 갈등) 가중', delta: 15 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.6) : 0,
        supportScore: 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: evidencePairs.map(p => `원진(${p})`),
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: '6대 원진 지지 쌍 탐지',
          matchedTarget: evidencePairs.join(', ') || '없음',
          referenceValue: dayBranch,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (22) 귀문관 (gwi_mun)
    {
      const def = SINSAL_DEFINITIONS['gwi_mun'];
      const gwimunPairs: [string, string][] = [
        ['묘', '신'], ['인', '미'], ['자', '유'], ['축', '오'], ['진', '해'], ['사', '술']
      ];
      const matchingLocations: PillarLocation[] = [];
      const evidencePairs: string[] = [];

      for (let i = 0; i < pillarBranches.length; i++) {
        for (let j = i + 1; j < pillarBranches.length; j++) {
          const b1 = pillarBranches[i].branch;
          const b2 = pillarBranches[j].branch;
          const isGwimun = gwimunPairs.some(([x, y]) => (b1 === x && b2 === y) || (b1 === y && b2 === x));
          if (isGwimun) {
            if (!matchingLocations.includes(pillarBranches[i].loc)) matchingLocations.push(pillarBranches[i].loc);
            if (!matchingLocations.includes(pillarBranches[j].loc)) matchingLocations.push(pillarBranches[j].loc);
            evidencePairs.push(`${pillarBranches[i].loc}(${b1})-${pillarBranches[j].loc}(${b2})`);
          }
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 65 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('day')) {
        modifiers.push({ ruleId: 'MOD_DAY_GWIMUN', reason: '일지 포함 귀문(정신적 예민성/집착) 가중', delta: 15 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.55) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.3) : 0, // 천재성, 통찰
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: evidencePairs.map(p => `귀문관(${p})`),
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: '6대 귀문관 지지 쌍 탐지',
          matchedTarget: evidencePairs.join(', ') || '없음',
          referenceValue: dayBranch,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (23) 홍염 (hong_yeom)
    {
      const def = SINSAL_DEFINITIONS['hong_yeom'];
      const hongyeomMap: Record<string, string[]> = {
        '갑': ['오'], '을': ['오'], '병': ['인'], '정': ['미'],
        '무': ['진'], '기': ['진'], '경': ['술'], '신': ['유'],
        '임': ['신', '자'], '계': ['신'],
      };
      const targets = hongyeomMap[dayStem] || [];
      const matchingLocations: PillarLocation[] = [];
      for (const pb of pillarBranches) {
        if (targets.includes(pb.branch)) matchingLocations.push(pb.loc);
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 60 : 0;
      const scoreBreakdown = this.createScoreBreakdown(baseScore, []);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_stem',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.3) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.4) : 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `일간(${dayStem}) 기준 홍염 지지(${targets.join(',')})`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음',
          referenceValue: dayStem,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (24) 현침 (hyeon_chim)
    {
      const def = SINSAL_DEFINITIONS['hyeon_chim'];
      const hyeonchimStems = ['갑', '신']; // 甲, 辛
      const hyeonchimBranches = ['묘', '오', '신']; // 卯, 午, 申
      const matchingLocations: PillarLocation[] = [];
      const matchedCharacters: string[] = [];

      for (const ps of pillarStems) {
        if (hyeonchimStems.includes(ps.stem)) {
          if (!matchingLocations.includes(ps.loc)) matchingLocations.push(ps.loc);
          matchedCharacters.push(`${ps.loc}간(${ps.stem})`);
        }
      }
      for (const pb of pillarBranches) {
        if (hyeonchimBranches.includes(pb.branch)) {
          if (!matchingLocations.includes(pb.loc)) matchingLocations.push(pb.loc);
          matchedCharacters.push(`${pb.loc}지(${pb.branch})`);
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const count = matchedCharacters.length;
      const baseScore = presentInNatal ? Math.min(85, 40 + count * 15) : 0;
      const scoreBreakdown = this.createScoreBreakdown(baseScore, []);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'fixed_stem_branch',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.45) : 0,
        supportScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.45) : 0, // 전문 기술/의료/분석
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: '5대 현침 글자 (갑, 신, 묘, 오, 신) 탐지',
          matchedTarget: matchedCharacters.join(', ') || '없음',
          referenceValue: '5대 현침 목록',
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    // (25) 공망 (gong_mang)
    {
      const def = SINSAL_DEFINITIONS['gong_mang'];
      const [gm1, gm2] = this.getGongmangBranches(dayStem, dayBranch);
      const matchingLocations: PillarLocation[] = [];

      for (const pb of pillarBranches) {
        if (pb.loc !== 'day' && (pb.branch === gm1 || pb.branch === gm2)) {
          matchingLocations.push(pb.loc);
        }
      }

      const presentInNatal = matchingLocations.length > 0;
      const baseScore = presentInNatal ? 65 : 0;
      const modifiers: ScoreModifier[] = [];
      if (matchingLocations.includes('month')) {
        modifiers.push({ ruleId: 'MOD_MONTH_GONGMANG', reason: '월지 공망(사회적 터전 공허) 가중', delta: 15 });
      }
      if (matchingLocations.includes('hour')) {
        modifiers.push({ ruleId: 'MOD_HOUR_GONGMANG', reason: '시지 공망(말년/자식/귀착 공허) 가중', delta: 10 });
      }
      const scoreBreakdown = this.createScoreBreakdown(baseScore, modifiers);

      results.push({
        sinsalId: def.id,
        name: def.name,
        aliases: def.aliases,
        category: def.category,
        calculationBasis: 'day_pillar',
        presentInNatal,
        natalLocations: matchingLocations,
        activationByDaeun: false,
        activationBySeun: false,
        activationByMonth: false,
        activationByDay: false,
        activationScore: presentInNatal ? scoreBreakdown.final : 0,
        riskScore: presentInNatal ? Math.round(scoreBreakdown.final * 0.5) : 0,
        supportScore: 0,
        domainScores: presentInNatal ? { ...def.domainMapping } : {},
        triggerRelations: [],
        ruleIds: [def.ruleId, ...(presentInNatal ? ['RULE_NATAL_PRESENT'] : [])],
        calculationEvidence: {
          basis: `일주(${dayStem}${dayBranch}) 기준 순중공망 지지(${gm1}, ${gm2})`,
          matchedTarget: matchingLocations.map(l => `${l}:${fourPillars[l]?.branch}`).join(', ') || '없음(원국 내 표출 없음, 운에서 작용 가능)',
          referenceValue: `${gm1}, ${gm2}`,
          scoreBreakdown,
        },
        reliabilityLevel: def.reliabilityLevel,
        status: def.status,
      });
    }

    return results;
  }

  private createScoreBreakdown(base: number, modifiers: ScoreModifier[]): SinsalScoreBreakdown {
    const sum = modifiers.reduce((acc, m) => acc + m.delta, base);
    const final = Math.max(0, Math.min(100, sum));
    return {
      base,
      modifiers,
      caps: 100,
      floors: 0,
      final,
      ruleIds: modifiers.map(m => m.ruleId),
    };
  }
}

export const sinsalCoreEngine = new SinsalCoreEngine();
