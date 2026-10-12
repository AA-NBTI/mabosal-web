/**
 * BranchClashEngine: 지지 육충(六沖) 분석 모듈
 * 
 * 4대 층위 원칙:
 * [Layer 1] 관계 존재 사실 (detected: true, branches, positions, clashCategory) - 거리와 무관하게 존재
 * [Layer 2] 관계 작용 강도 (intensity, distance, baseScore) - 거리에 따라 감쇄
 * [Layer 3] 상호작용 (interaction: ACTIVE / MITIGATED) - 합에 의해 완화될 수 있으나 삭제되지 않음
 * [Layer 4] 파생 지표
 */

import { EarthlyBranch, FourPillars } from '../../core/types.js';
import { BranchRelationInput, BranchRelationItem, IndependentRelationResult } from './relation-contract.js';


export interface BranchClashMatch {
  // Layer 1: 관계 존재 사실 (거리에 영향받지 않는 명리학적 사실)
  detected: boolean;
  category: 'BRANCH';
  type: 'six_clash';
  name: string;
  branches: [EarthlyBranch, EarthlyBranch];
  positions: ['year' | 'month' | 'day' | 'hour', 'year' | 'month' | 'day' | 'hour'];
  clashCategory: '왕지충 (자오, 묘유)' | '사생지충/역마충 (인신, 사해)' | '사묘지충/붕충 (진술, 축미)';
  priority: 'PRIMARY';
  description: string;

  // Layer 2: 관계 작용 강도 (파생 강도)
  intensity: number; // 0 ~ 100 연속값 (거리 감쇄 적용)
  distance: number;  // 1: 인접, 2: 1격, 3: 2격
  baseScore: number; // 기본 강도 (거리 적용 전 92.0)

  // Layer 3: 관계 상호작용 (합에 의한 완화 등)
  interaction: {
    status: 'ACTIVE' | 'MITIGATED';
    isMitigated: boolean;
    mitigatedBy?: string;
    description?: string;
  };
}

export const SIX_CLASHES: Record<string, { partner: EarthlyBranch; name: string; category: BranchClashMatch['clashCategory']; desc: string }> = {
  자: { partner: '오', name: '자오충', category: '왕지충 (자오, 묘유)', desc: '수화상쟁, 정신적 갈등 및 심장/신장 자극' },
  오: { partner: '자', name: '자오충', category: '왕지충 (자오, 묘유)', desc: '수화상쟁, 정신적 갈등 및 심장/신장 자극' },
  축: { partner: '미', name: '축미충', category: '사묘지충/붕충 (진술, 축미)', desc: '토오행 붕충, 창고 개방 및 내면적 마찰' },
  미: { partner: '축', name: '축미충', category: '사묘지충/붕충 (진술, 축미)', desc: '토오행 붕충, 창고 개방 및 내면적 마찰' },
  인: { partner: '신', name: '인신충', category: '사생지충/역마충 (인신, 사해)', desc: '역마 정면충돌, 급격한 이동 및 사고/마찰' },
  신: { partner: '인', name: '인신충', category: '사생지충/역마충 (인신, 사해)', desc: '역마 정면충돌, 급격한 이동 및 사고/마찰' },
  묘: { partner: '유', name: '묘유충', category: '왕지충 (자오, 묘유)', desc: '금목상쟁, 대인관계 단절 및 관절/신경 마찰' },
  유: { partner: '묘', name: '묘유충', category: '왕지충 (자오, 묘유)', desc: '금목상쟁, 대인관계 단절 및 관절/신경 마찰' },
  진: { partner: '술', name: '진술충', category: '사묘지충/붕충 (진술, 축미)', desc: '토오행 붕충, 부동산/문서 변동 및 소송 주의' },
  술: { partner: '진', name: '진술충', category: '사묘지충/붕충 (진술, 축미)', desc: '토오행 붕충, 부동산/문서 변동 및 소송 주의' },
  사: { partner: '해', name: '사해충', category: '사생지충/역마충 (인신, 사해)', desc: '수화 역마충, 주거/직장 변동 및 급작스러운 사건' },
  해: { partner: '사', name: '사해충', category: '사생지충/역마충 (인신, 사해)', desc: '수화 역마충, 주거/직장 변동 및 급작스러운 사건' },
};

export class BranchClashEngine {
  public analyze(pillars: FourPillars): BranchClashMatch[] {
    const matches: BranchClashMatch[] = [];

    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) {
        activeBranches.push({ pos, branch: pillar.branch, index: idx });
      }
    });

    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        const a = activeBranches[i];
        const b = activeBranches[j];
        const dist = Math.abs(a.index - b.index);

        const clash = SIX_CLASHES[a.branch];
        if (clash && clash.partner === b.branch) {
          // 거리 가중치: 거리 ≠ 관계 존재. 거리는 오직 intensity 계산에만 적용
          const distMultiplier = dist === 1 ? 1.0 : dist === 2 ? 0.55 : 0.3;
          matches.push({
            detected: true,
            category: 'BRANCH',
            type: 'six_clash',
            name: clash.name,
            branches: [a.branch, b.branch],
            positions: [a.pos, b.pos],
            clashCategory: clash.category,
            priority: 'PRIMARY',
            intensity: Math.round(92.0 * distMultiplier * 100) / 100,
            distance: dist,
            baseScore: 92.0,
            description: clash.desc,
            interaction: {
              status: 'ACTIVE',
              isMitigated: false,
              description: `육충 발동 (거리 ${dist})`,
            },
          });
        }
      }
    }

    return matches;
  }

  /**
   * Phase 55: 독립 모듈 최소 계약을 준수하는 충(沖) 분석 메서드
   * 원국 충 및 대운/세운/월운/일운 충 독립 판정
   */
  public analyzeIndependent(input: BranchRelationInput): IndependentRelationResult {
    const rawMatches = this.analyze(input.pillars);
    const items: BranchRelationItem[] = [];

    // 1. 원국 내 충
    for (const m of rawMatches) {
      items.push({
        name: m.name,
        branches: m.branches,
        positions: m.positions,
        source: 'NATAL',
        intensity: m.intensity,
        evidence: [m.description, `궁위: ${m.positions[0]} ↔ ${m.positions[1]}`, `거리: ${m.distance}칸`],
        temporalCompletion: false,
        description: `원국 지지 ${m.name}: ${m.description}`,
      });
    }

    // 2. 운(대운/세운/월운/일진)과의 충
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
        const clash = SIX_CLASHES[lBranch];
        if (!clash) continue;

        for (const nb of activeNatalBranches) {
          if (nb.branch === clash.partner) {
            const luckLabel = luckNames[key] || key;
            items.push({
              name: `${clash.name} (${luckLabel} 충)`,
              branches: [nb.branch, lBranch],
              positions: [nb.pos, luckLabel],
              source: 'NATAL_AND_LUCK',
              intensity: 85.0,
              evidence: [`${luckLabel}(${lBranch})이 원국 ${nb.pos}지(${nb.branch})를 충돌 촉발`],
              temporalCompletion: true,
              description: `${luckLabel} 유입 지지(${lBranch})와 원국 ${nb.pos}지(${nb.branch})의 ${clash.name} 격발`,
            });
          }
        }
      }
    }

    return {
      engineId: 'branch_clash_engine',
      relationType: 'CLASH',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}


