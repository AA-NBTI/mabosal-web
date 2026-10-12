/**
 * BranchHarmonyEngine: 지지 육합, 삼합(완전삼합/반합/가합), 방합 분석 모듈
 * 
 * Phase 55: 독립 모듈화 아키텍처
 * - BranchSixHarmonyEngine (육합 독립)
 * - BranchTripleHarmonyEngine (완전 삼합 독립 - 원국 삼합 vs 운 유입 한시적 완성 삼합 분리)
 * - BranchSemiHarmonyEngine (반합/가합 독립)
 * - BranchDirectionalHarmonyEngine (방합 독립)
 * - BranchHarmonyEngine (위 독립 모듈들의 결과를 조합하는 Aggregator)
 */

import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem } from '../../core/types.js';
import { SIX_CLASHES } from './branch-clash.js';
import { BranchRelationInput, BranchRelationItem, IndependentRelationResult } from './relation-contract.js';

export interface BranchTransformationResult {
  possible: boolean;
  transformed: boolean;
  status: 'COMBINED' | 'TRANSFORMABLE' | 'TRANSFORMED';
  targetElement: FiveElement;
  evidence: string[];
  blockers: string[];
}

export interface BranchHarmonyMatch {
  // Layer 1: 관계 존재 사실
  detected: boolean;
  category: 'BRANCH';
  type: 'six_harmony' | 'triple_harmony' | 'semi_triple_harmony' | 'directional_harmony';
  harmonySubType:
    | 'TRIPLE_HARMONY'           // 완전 삼합
    | 'PARTIAL_HARMONY'          // 생왕/왕묘 반합
    | 'WEAK_OR_FALSE_HARMONY'    // 가합 (생지+묘지, 왕지 결여)
    | 'DIRECTIONAL_HARMONY'      // 완전 방합
    | 'SEMI_DIRECTIONAL_HARMONY' // 준방합 (2글자)
    | 'SIX_HARMONY';             // 육합
  name: string;
  branches: EarthlyBranch[];
  positions: ('year' | 'month' | 'day' | 'hour')[];
  priority: 'PRIMARY';

  // Layer 2: 관계 작용 강도
  element: FiveElement;
  intensity: number; // 0 ~ 100 연속값
  baseScore: number;
  distance?: number;
  details: string;

  // Layer 3: 합화 평가
  transformation: BranchTransformationResult;
  transformedElement?: FiveElement;

  // Layer 4: 상호작용
  interaction: {
    status: 'ACTIVE' | 'MITIGATED' | 'TIED' | 'COMPETING';
    isMitigated: boolean;
    mitigatedBy?: string;
    description?: string;
  };
}

// 육합 6종 (마보살 v1.0 규칙: 오미합의 합화 후보 = 火 확정)
export const SIX_HARMONIES: Record<string, { partner: EarthlyBranch; element: FiveElement; name: string }> = {
  자: { partner: '축', element: '토', name: '자축합토' },
  축: { partner: '자', element: '토', name: '자축합토' },
  인: { partner: '해', element: '목', name: '인해합목' },
  해: { partner: '인', element: '목', name: '인해합목' },
  묘: { partner: '술', element: '화', name: '묘술합화' },
  술: { partner: '묘', element: '화', name: '묘술합화' },
  진: { partner: '유', element: '금', name: '진유합금' },
  유: { partner: '진', element: '금', name: '진유합금' },
  사: { partner: '신', element: '수', name: '사신합수' },
  신: { partner: '사', element: '수', name: '사신합수' },
  오: { partner: '미', element: '화', name: '오미합화' },
  미: { partner: '오', element: '화', name: '오미합화' },
};

// 삼합 4국
export const TRIPLE_HARMONIES: { name: string; element: FiveElement; birth: EarthlyBranch; peak: EarthlyBranch; grave: EarthlyBranch }[] = [
  { name: '신자진 수국', element: '수', birth: '신', peak: '자', grave: '진' },
  { name: '해묘미 목국', element: '목', birth: '해', peak: '묘', grave: '미' },
  { name: '인오술 화국', element: '화', birth: '인', peak: '오', grave: '술' },
  { name: '사유축 금국', element: '금', birth: '사', peak: '유', grave: '축' },
];

// 방합 4방
export const DIRECTIONAL_HARMONIES: { name: string; element: FiveElement; branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch] }[] = [
  { name: '인묘진 동방목국', element: '목', branches: ['인', '묘', '진'] },
  { name: '사오미 남방화국', element: '화', branches: ['사', '오', '미'] },
  { name: '신유술 서방금국', element: '금', branches: ['신', '유', '술'] },
  { name: '해자축 북방수국', element: '수', branches: ['해', '자', '축'] },
];

/**
 * 1. 육합(六合) 전용 독립 계산 엔진
 */
export class BranchSixHarmonyEngine {
  public analyze(pillars: FourPillars): BranchHarmonyMatch[] {
    const matches: BranchHarmonyMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    const monthBranch = pillars.month.branch;
    const monthBranchElement = BRANCH_INFO[monthBranch].element;

    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        const a = activeBranches[i];
        const b = activeBranches[j];
        const dist = Math.abs(a.index - b.index);
        const distanceMultiplier = dist === 1 ? 1.0 : dist === 2 ? 0.6 : 0.35;

        const six = SIX_HARMONIES[a.branch];
        if (six && six.partner === b.branch) {
          const isMonthMatch = monthBranchElement === six.element;
          matches.push({
            detected: true,
            category: 'BRANCH',
            type: 'six_harmony',
            harmonySubType: 'SIX_HARMONY',
            name: six.name,
            branches: [a.branch, b.branch],
            positions: [a.pos, b.pos],
            priority: 'PRIMARY',
            element: six.element,
            intensity: Math.round(85.0 * distanceMultiplier * 100) / 100,
            baseScore: 85.0,
            distance: dist,
            details: `육합 성립 (거리 ${dist})`,
            transformation: {
              possible: isMonthMatch,
              transformed: isMonthMatch && dist === 1,
              status: isMonthMatch && dist === 1 ? 'TRANSFORMED' : isMonthMatch ? 'TRANSFORMABLE' : 'COMBINED',
              targetElement: six.element,
              evidence: isMonthMatch ? [`월령 [${monthBranch}] 사령 지원`] : [],
              blockers: isMonthMatch ? (dist > 1 ? [`거리 격위(거리 ${dist})`] : []) : ['월령 비사령으로 합이불화'],
            },
            transformedElement: isMonthMatch && dist === 1 ? six.element : undefined,
            interaction: {
              status: isMonthMatch && dist === 1 ? 'ACTIVE' : 'TIED',
              isMitigated: false,
              description: isMonthMatch && dist === 1
                ? `육합 합화: 오행 ${six.element} 기운 생성`
                : `육합 기반: 두 지지가 결합하여 본래 기능 유보`,
            },
          });
        }
      }
    }
    return matches;
  }

  public analyzeIndependent(input: BranchRelationInput): IndependentRelationResult {
    const rawMatches = this.analyze(input.pillars);
    const items: BranchRelationItem[] = rawMatches.map(m => ({
      name: m.name,
      branches: m.branches,
      positions: m.positions,
      source: 'NATAL',
      intensity: m.intensity,
      evidence: [m.details, ...m.transformation.evidence],
      temporalCompletion: false,
      description: `원국 지지 ${m.name} 육합`,
    }));

    // 운과의 육합 검사
    if (input.luckBranches) {
      const activeNatalBranches: { pos: string; branch: EarthlyBranch }[] = [];
      const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
      positions.forEach(pos => {
        const pillar = input.pillars[pos];
        if (pillar) activeNatalBranches.push({ pos, branch: pillar.branch });
      });

      const luckKeys: (keyof NonNullable<BranchRelationInput['luckBranches']>)[] = [
        'daewoon', 'sewoon', 'monthWoon', 'dayWoon'
      ];
      const luckNames: Record<string, string> = {
        daewoon: '대운', sewoon: '세운', monthWoon: '월운', dayWoon: '일운'
      };

      for (const key of luckKeys) {
        const lBranch = input.luckBranches[key];
        if (!lBranch) continue;
        const six = SIX_HARMONIES[lBranch];
        if (!six) continue;

        for (const nb of activeNatalBranches) {
          if (nb.branch === six.partner) {
            const luckLabel = luckNames[key] || key;
            items.push({
              name: `${six.name} (${luckLabel} 육합)`,
              branches: [nb.branch, lBranch],
              positions: [nb.pos, luckLabel],
              source: 'NATAL_AND_LUCK',
              intensity: 75.0,
              evidence: [`${luckLabel}(${lBranch})이 원국 ${nb.pos}지(${nb.branch})와 육합 형성`],
              temporalCompletion: true,
              description: `${luckLabel} 유입 지지(${lBranch})와 원국 ${nb.pos}지(${nb.branch})의 ${six.name} 결합`,
            });
          }
        }
      }
    }

    return {
      engineId: 'branch_six_harmony_engine',
      relationType: 'SIX_HARMONY',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}

/**
 * 2. 삼합(三合) 전용 독립 계산 엔진
 * 완전 삼합(생+왕+묘) 전용이며, 원국 삼합과 운에서 한시적 완성되는 삼합을 엄격히 구분
 */
export class BranchTripleHarmonyEngine {
  public analyze(pillars: FourPillars): BranchHarmonyMatch[] {
    const matches: BranchHarmonyMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    const monthBranch = pillars.month.branch;
    const monthBranchElement = BRANCH_INFO[monthBranch].element;
    const branchList = activeBranches.map(b => b.branch);
    const branchSet = new Set(branchList);

    const STEM_NORM: Record<string, HeavenlyStem> = {
      갑: '갑', 을: '을', 병: '병', 정: '정', 무: '무', 기: '기', 경: '경', 신: '신', 임: '임', 계: '계',
      甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
    };

    const activeStems = [
      pillars.year.stem,
      pillars.month.stem,
      pillars.day.stem,
      pillars.hour ? pillars.hour.stem : null,
    ].filter((s): s is HeavenlyStem => s !== null);

    const stemElements = new Set<FiveElement>(
      activeStems
        .map(s => {
          const norm = STEM_NORM[s] || s;
          return STEM_INFO[norm]?.element;
        })
        .filter((e): e is FiveElement => Boolean(e))
    );


    for (const trip of TRIPLE_HARMONIES) {
      const hasBirth = branchSet.has(trip.birth);
      const hasPeak = branchSet.has(trip.peak);
      const hasGrave = branchSet.has(trip.grave);

      if (hasBirth && hasPeak && hasGrave) {
        const involved = activeBranches.filter(b => [trip.birth, trip.peak, trip.grave].includes(b.branch)).map(b => b.pos);
        const evidence: string[] = ['생·왕·묘 3자 원국 완비로 삼합국 완성'];
        const blockers: string[] = [];

        const isMonthMatch = monthBranchElement === trip.element;
        if (isMonthMatch) {
          evidence.push(`월령 [${monthBranch}] 사령 지원`);
        } else {
          blockers.push(`월령 [${monthBranch}]이 삼합 오행 [${trip.element}]을 직접 사령하지 않음`);
        }

        const isStemTuGan = stemElements.has(trip.element);
        if (isStemTuGan) {
          evidence.push(`천간에 합화 오행 [${trip.element}] 투출(투간)`);
        } else {
          blockers.push(`천간에 합화 오행 [${trip.element}] 투간 부재`);
        }

        for (const b of [trip.birth, trip.peak, trip.grave]) {
          const clashInfo = SIX_CLASHES[b];
          if (clashInfo && branchSet.has(clashInfo.partner)) {
            blockers.push(`삼합 글자 [${b}]와 [${clashInfo.partner}]의 육충 충돌로 삼합 결합 방해`);
          }
        }

        const isTransformed = isMonthMatch && isStemTuGan && blockers.length === 0;

        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'triple_harmony',
          harmonySubType: 'TRIPLE_HARMONY',
          name: trip.name,
          branches: [trip.birth, trip.peak, trip.grave],
          positions: involved,
          priority: 'PRIMARY',
          element: trip.element,
          intensity: 95.0,
          baseScore: 95.0,
          details: '완전 삼합 국 형성 (원국 성립)',
          transformation: {
            possible: true,
            transformed: isTransformed,
            status: isTransformed ? 'TRANSFORMED' : 'TRANSFORMABLE',
            targetElement: trip.element,
            evidence,
            blockers,
          },
          transformedElement: isTransformed ? trip.element : undefined,
          interaction: { status: 'ACTIVE', isMitigated: false },
        });
      }
    }
    return matches;
  }

  public analyzeIndependent(input: BranchRelationInput): IndependentRelationResult {
    const rawMatches = this.analyze(input.pillars);
    const items: BranchRelationItem[] = rawMatches.map(m => ({
      name: m.name,
      branches: m.branches,
      positions: m.positions,
      source: 'NATAL',
      intensity: m.intensity,
      evidence: [m.details, ...m.transformation.evidence],
      temporalCompletion: false,
      description: `원국 완전 삼합 성립: ${m.name}`,
    }));

    // 운과의 결합으로 한시적 완성되는 삼합 평가
    if (input.luckBranches) {
      const activeNatalBranches: { pos: string; branch: EarthlyBranch }[] = [];
      const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
      positions.forEach(pos => {
        const pillar = input.pillars[pos];
        if (pillar) activeNatalBranches.push({ pos, branch: pillar.branch });
      });

      const luckBranchesMap: Record<string, EarthlyBranch | undefined> = {
        daewoon: input.luckBranches.daewoon,
        sewoon: input.luckBranches.sewoon,
        monthWoon: input.luckBranches.monthWoon,
        dayWoon: input.luckBranches.dayWoon,
      };

      for (const trip of TRIPLE_HARMONIES) {
        // 이미 원국에서 완전 삼합이면 스킵
        if (items.some(it => it.source === 'NATAL' && it.name.startsWith(trip.name))) continue;

        const tripleReq = [trip.birth, trip.peak, trip.grave];
        const natalPresent = activeNatalBranches.filter(nb => tripleReq.includes(nb.branch));
        const natalBranches = natalPresent.map(nb => nb.branch);

        // 원국에 최소 1글자 이상 있어야 함
        if (natalBranches.length === 0) continue;

        const missing = tripleReq.filter(b => !natalBranches.includes(b));
        const luckContributors: { label: string; branch: EarthlyBranch }[] = [];

        for (const [key, lBranch] of Object.entries(luckBranchesMap)) {
          if (lBranch && missing.includes(lBranch)) {
            const label = key === 'daewoon' ? '대운' : key === 'sewoon' ? '세운' : key === 'monthWoon' ? '월운' : '일운';
            luckContributors.push({ label, branch: lBranch });
          }
        }

        // 운의 글자들을 합쳐서 3자가 모두 채워지는지 확인
        const totalBranches = new Set([...natalBranches, ...luckContributors.map(c => c.branch)]);
        if (tripleReq.every(b => totalBranches.has(b))) {
          const luckDesc = luckContributors.map(c => `${c.label}(${c.branch})`).join(' + ');
          const natalDesc = natalPresent.map(p => `${p.pos}지(${p.branch})`).join(', ');
          items.push({
            name: `${trip.name} (운중 완성)`,
            branches: [trip.birth, trip.peak, trip.grave],
            positions: [...natalPresent.map(p => p.pos), ...luckContributors.map(c => c.label)],
            source: 'NATAL_AND_LUCK',
            intensity: 85.0,
            evidence: [
              `원국 ${natalDesc}와 운 ${luckDesc}의 결합으로 삼합 완성`,
              '원국에는 삼합이 없으며, 운에서 한시적으로 완성되는 구조',
            ],
            temporalCompletion: true,
            description: `운에서 한시적으로 완성되는 삼합: 원국 ${natalDesc}에 ${luckDesc}이 결합하여 ${trip.name} 완성`,
          });
        }
      }
    }

    return {
      engineId: 'branch_triple_harmony_engine',
      relationType: 'TRIPLE_HARMONY',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}

/**
 * 3. 반합(半合) / 가합(假合) 전용 독립 계산 엔진
 */
export class BranchSemiHarmonyEngine {
  public analyze(pillars: FourPillars): BranchHarmonyMatch[] {
    const matches: BranchHarmonyMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    const monthBranch = pillars.month.branch;
    const monthBranchElement = BRANCH_INFO[monthBranch].element;
    const branchList = activeBranches.map(b => b.branch);
    const branchSet = new Set(branchList);

    for (const trip of TRIPLE_HARMONIES) {
      const hasBirth = branchSet.has(trip.birth);
      const hasPeak = branchSet.has(trip.peak);
      const hasGrave = branchSet.has(trip.grave);

      // 3자 모두 있으면 완전삼합이므로 반합에서는 제외
      if (hasBirth && hasPeak && hasGrave) continue;

      // (1) 생왕 반합 (생 + 왕)
      if (hasBirth && hasPeak) {
        const involved = activeBranches.filter(b => [trip.birth, trip.peak].includes(b.branch)).map(b => b.pos);
        const isMonthMatch = monthBranchElement === trip.element;

        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'semi_triple_harmony',
          harmonySubType: 'PARTIAL_HARMONY',
          name: `${trip.name} (생왕 반합)`,
          branches: [trip.birth, trip.peak],
          positions: involved,
          priority: 'PRIMARY',
          element: trip.element,
          intensity: 75.0,
          baseScore: 75.0,
          details: `왕지(${trip.peak})를 포함한 생왕 반합`,
          transformation: {
            possible: isMonthMatch,
            transformed: isMonthMatch,
            status: isMonthMatch ? 'TRANSFORMED' : 'TRANSFORMABLE',
            targetElement: trip.element,
            evidence: [`왕지(${trip.peak}) 포함 반합 결합`, isMonthMatch ? `월령 득령 지원` : ''],
            blockers: isMonthMatch ? [] : ['고지 묘목 결여 및 월령 비사령'],
          },
          transformedElement: isMonthMatch ? trip.element : undefined,
          interaction: { status: 'ACTIVE', isMitigated: false },
        });
      }

      // (2) 왕묘 반합 (왕 + 묘)
      if (hasPeak && hasGrave) {
        const involved = activeBranches.filter(b => [trip.peak, trip.grave].includes(b.branch)).map(b => b.pos);
        const isMonthMatch = monthBranchElement === trip.element;

        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'semi_triple_harmony',
          harmonySubType: 'PARTIAL_HARMONY',
          name: `${trip.name} (왕묘 반합)`,
          branches: [trip.peak, trip.grave],
          positions: involved,
          priority: 'PRIMARY',
          element: trip.element,
          intensity: 65.0,
          baseScore: 65.0,
          details: `왕지(${trip.peak})를 포함한 왕묘 반합`,
          transformation: {
            possible: isMonthMatch,
            transformed: isMonthMatch,
            status: isMonthMatch ? 'TRANSFORMED' : 'TRANSFORMABLE',
            targetElement: trip.element,
            evidence: [`왕지(${trip.peak}) 포함 반합 결합`, isMonthMatch ? `월령 득령 지원` : ''],
            blockers: isMonthMatch ? [] : ['생지 결여 및 월령 비사령'],
          },
          transformedElement: isMonthMatch ? trip.element : undefined,
          interaction: { status: 'ACTIVE', isMitigated: false },
        });
      }

      // (3) 가합 / 생묘합 (생 + 묘, 왕지 없음)
      if (hasBirth && hasGrave && !hasPeak) {
        const involved = activeBranches.filter(b => [trip.birth, trip.grave].includes(b.branch)).map(b => b.pos);
        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'semi_triple_harmony',
          harmonySubType: 'WEAK_OR_FALSE_HARMONY',
          name: `${trip.name} (가합)`,
          branches: [trip.birth, trip.grave],
          positions: involved,
          priority: 'PRIMARY',
          element: trip.element,
          intensity: 35.0,
          baseScore: 35.0,
          details: `왕지 없는 가합 (${trip.birth}+${trip.grave})`,
          transformation: {
            possible: false,
            transformed: false,
            status: 'COMBINED',
            targetElement: trip.element,
            evidence: [`생지(${trip.birth})와 묘지(${trip.grave})의 약한 연결`],
            blockers: ['중심 왕지 결여로 합화 불가'],
          },
          transformedElement: undefined,
          interaction: { status: 'ACTIVE', isMitigated: false },
        });
      }
    }

    return matches;
  }

  public analyzeIndependent(input: BranchRelationInput): IndependentRelationResult {
    const rawMatches = this.analyze(input.pillars);
    const items: BranchRelationItem[] = rawMatches.map(m => ({
      name: m.name,
      branches: m.branches,
      positions: m.positions,
      source: 'NATAL',
      intensity: m.intensity,
      evidence: [m.details, ...m.transformation.evidence],
      temporalCompletion: false,
      description: `원국 반합 성립: ${m.name}`,
    }));

    return {
      engineId: 'branch_semi_harmony_engine',
      relationType: 'SEMI_HARMONY',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}

/**
 * 4. 방합(方合) 전용 독립 계산 엔진
 */
export class BranchDirectionalHarmonyEngine {
  public analyze(pillars: FourPillars): BranchHarmonyMatch[] {
    const matches: BranchHarmonyMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    const monthBranch = pillars.month.branch;
    const monthBranchElement = BRANCH_INFO[monthBranch].element;
    const branchList = activeBranches.map(b => b.branch);
    const branchSet = new Set(branchList);

    const STEM_NORM: Record<string, HeavenlyStem> = {
      갑: '갑', 을: '을', 병: '병', 정: '정', 무: '무', 기: '기', 경: '경', 신: '신', 임: '임', 계: '계',
      甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
    };

    const activeStems = [
      pillars.year.stem,
      pillars.month.stem,
      pillars.day.stem,
      pillars.hour ? pillars.hour.stem : null,
    ].filter((s): s is HeavenlyStem => s !== null);

    const stemElements = new Set<FiveElement>(
      activeStems
        .map(s => {
          const norm = STEM_NORM[s] || s;
          return STEM_INFO[norm]?.element;
        })
        .filter((e): e is FiveElement => Boolean(e))
    );


    for (const dir of DIRECTIONAL_HARMONIES) {
      const present = dir.branches.filter(b => branchSet.has(b));
      if (present.length === 3) {
        const involvedPositions = activeBranches.filter(b => dir.branches.includes(b.branch)).map(b => b.pos);
        const evidence: string[] = ['3계절 글자 전원 집결로 방합국 완성'];
        const blockers: string[] = [];

        const isMonthMatch = monthBranchElement === dir.element;
        if (isMonthMatch) {
          evidence.push(`월령 [${monthBranch}] 사령 지원`);
        } else {
          blockers.push(`월령 [${monthBranch}]이 방합 오행 [${dir.element}]을 직접 사령하지 않음`);
        }

        const isStemTuGan = stemElements.has(dir.element);
        if (isStemTuGan) {
          evidence.push(`천간에 합화 오행 [${dir.element}] 투출(투간)`);
        } else {
          blockers.push(`천간에 합화 오행 [${dir.element}] 투간 부재`);
        }

        for (const b of dir.branches) {
          const clashInfo = SIX_CLASHES[b];
          if (clashInfo && branchSet.has(clashInfo.partner)) {
            blockers.push(`방합 글자 [${b}]와 [${clashInfo.partner}]의 육충 충돌로 방합 결합 방해`);
          }
        }

        const isTransformed = isMonthMatch && isStemTuGan && blockers.length === 0;

        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'directional_harmony',
          harmonySubType: 'DIRECTIONAL_HARMONY',
          name: dir.name,
          branches: dir.branches,
          positions: involvedPositions,
          priority: 'PRIMARY',
          element: dir.element,
          intensity: 100.0,
          baseScore: 100.0,
          details: '방합 완전성립 (계절의 강력한 오행 세력 형성)',
          transformation: {
            possible: true,
            transformed: isTransformed,
            status: isTransformed ? 'TRANSFORMED' : 'TRANSFORMABLE',
            targetElement: dir.element,
            evidence,
            blockers,
          },
          transformedElement: isTransformed ? dir.element : undefined,
          interaction: { status: 'ACTIVE', isMitigated: false },
        });
      } else if (present.length === 2) {
        const involvedPositions = activeBranches.filter(b => present.includes(b.branch)).map(b => b.pos);
        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'directional_harmony',
          harmonySubType: 'SEMI_DIRECTIONAL_HARMONY',
          name: `${dir.name} (준방합)`,
          branches: present,
          positions: involvedPositions,
          priority: 'PRIMARY',
          element: dir.element,
          intensity: 55.0,
          baseScore: 55.0,
          details: `준방합 성립 (${present.join(', ')})`,
          transformation: {
            possible: monthBranchElement === dir.element,
            transformed: false,
            status: monthBranchElement === dir.element ? 'TRANSFORMABLE' : 'COMBINED',
            targetElement: dir.element,
            evidence: [`방합 2글자 인접 형성 (${present.join(', ')})`],
            blockers: ['3자 중 1자 결여'],
          },
          transformedElement: undefined,
          interaction: { status: 'ACTIVE', isMitigated: false },
        });
      }
    }
    return matches;
  }
}

/**
 * 5. BranchHarmonyEngine (Aggregator)
 * 육합, 삼합, 반합, 방합 독립 엔진들을 호출하여 조합하는 Aggregator 역할 수행
 */
export class BranchHarmonyEngine {
  private sixHarmonyEngine = new BranchSixHarmonyEngine();
  private tripleHarmonyEngine = new BranchTripleHarmonyEngine();
  private semiHarmonyEngine = new BranchSemiHarmonyEngine();
  private directionalHarmonyEngine = new BranchDirectionalHarmonyEngine();

  public analyze(pillars: FourPillars): BranchHarmonyMatch[] {
    const dirMatches = this.directionalHarmonyEngine.analyze(pillars);
    const tripMatches = this.tripleHarmonyEngine.analyze(pillars);
    const semiMatches = this.semiHarmonyEngine.analyze(pillars);
    const sixMatches = this.sixHarmonyEngine.analyze(pillars);

    return [...dirMatches, ...tripMatches, ...semiMatches, ...sixMatches];
  }
}
