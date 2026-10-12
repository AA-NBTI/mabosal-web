/**
 * BranchHarmDestructionEngine: 지지 파(破), 해(害), 원진(怨嗔) 분석 모듈
 * 
 * Phase 55: 독립 모듈화 아키텍처
 * - BranchDestructionEngine (파 독립)
 * - BranchHarmEngine (해 독립)
 * - BranchWonjinEngine (원진 독립)
 * - BranchHarmDestructionEngine (위 독립 모듈들의 결과를 조합하는 Aggregator)
 */

import { EarthlyBranch, FourPillars } from '../../core/types.js';
import { BranchRelationInput, BranchRelationItem, IndependentRelationResult } from './relation-contract.js';

export interface MinorRelationMatch {
  // Layer 1: 관계 존재 사실 (파·해·원진은 보조적 SECONDARY 계층)
  detected: boolean;
  category: 'BRANCH';
  type: 'destruction_po' | 'harm_hae' | 'wonjin';
  name: string;
  branches: [EarthlyBranch, EarthlyBranch];
  positions: ['year' | 'month' | 'day' | 'hour', 'year' | 'month' | 'day' | 'hour'];
  priority: 'SECONDARY';
  description: string;

  // Layer 2: 관계 작용 강도
  intensity: number; // 0 ~ 100 연속값 (거리 감쇄 반영)
  distance: number;
  baseScore: number;

  // Layer 3: 상호작용
  interaction: {
    status: 'ACTIVE' | 'MITIGATED';
    isMitigated: boolean;
    description?: string;
  };
}

// 육파 (六破)
export const SIX_DESTRUCTIONS: Record<string, { partner: EarthlyBranch; name: string; desc: string }> = {
  자: { partner: '유', name: '자유파', desc: '금생수가 원활하지 못하고 깨짐, 중도 변경' },
  유: { partner: '자', name: '자유파', desc: '금생수가 원활하지 못하고 깨짐, 중도 변경' },
  오: { partner: '묘', name: '오묘파', desc: '목생화의 균열, 도화성 분쟁/파탄' },
  묘: { partner: '오', name: '오묘파', desc: '목생화의 균열, 도화성 분쟁/파탄' },
  사: { partner: '신', name: '사신파', desc: '합중유파, 결합 후 깨짐' },
  신: { partner: '사', name: '사신파', desc: '합중유파, 결합 후 깨짐' },
  인: { partner: '해', name: '인해파', desc: '합중유파, 친밀함 속 파괴' },
  해: { partner: '인', name: '인해파', desc: '합중유파, 친밀함 속 파괴' },
  축: { partner: '진', name: '축진파', desc: '습토끼리의 엉킴, 부동산/동료 마찰' },
  진: { partner: '축', name: '축진파', desc: '습토끼리의 엉킴, 부동산/동료 마찰' },
  술: { partner: '미', name: '술미파', desc: '조토끼리의 건조한 충돌, 고집과 갈등' },
  미: { partner: '술', name: '술미파', desc: '조토끼리의 건조한 충돌, 고집과 갈등' },
};

// 육해 (六害)
export const SIX_HARMS: Record<string, { partner: EarthlyBranch; name: string; desc: string }> = {
  자: { partner: '미', name: '자미해', desc: '육합 방해, 은밀한 훼손 및 질투' },
  미: { partner: '자', name: '자미해', desc: '육합 방해, 은밀한 훼손 및 질투' },
  축: { partner: '오', name: '축오해', desc: '탕화/원진 겸해 신경과민 및 불화' },
  오: { partner: '축', name: '축오해', desc: '탕화/원진 겸해 신경과민 및 불화' },
  인: { partner: '사', name: '인사해', desc: '형해 동시작용, 급변과 마찰' },
  사: { partner: '인', name: '인사해', desc: '형해 동시작용, 급변과 마찰' },
  묘: { partner: '진', name: '묘진해', desc: '동방 목국의 틈, 친밀한 자의 배신' },
  진: { partner: '묘', name: '묘진해', desc: '동방 목국의 틈, 친밀한 자의 배신' },
  신: { partner: '해', name: '신해해', desc: '사맹지 해, 이동 중 구설과 손재' },
  해: { partner: '신', name: '신해해', desc: '사맹지 해, 이동 중 구설과 손재' },
  유: { partner: '술', name: '유술해', desc: '서방 금국의 틈, 의리 손상 및 구설' },
  술: { partner: '유', name: '유술해', desc: '서방 금국의 틈, 의리 손상 및 구설' },
};

// 원진 (怨嗔)
export const WONJIN_PAIRS: Record<string, { partner: EarthlyBranch; name: string; desc: string }> = {
  자: { partner: '미', name: '자미 원진', desc: '애증의 교차, 까다로운 감정선' },
  미: { partner: '자', name: '자미 원진', desc: '애증의 교차, 까다로운 감정선' },
  축: { partner: '오', name: '축오 원진', desc: '격렬한 감정 기복, 탕화 겸비' },
  오: { partner: '축', name: '축오 원진', desc: '격렬한 감정 기복, 탕화 겸비' },
  인: { partner: '유', name: '인유 원진', desc: '금목의 암투, 서늘한 대인 갈등' },
  유: { partner: '인', name: '인유 원진', desc: '금목의 암투, 서늘한 대인 갈등' },
  묘: { partner: '신', name: '묘신 원진', desc: '을경 암합 겸해 집착과 원망' },
  신: { partner: '묘', name: '묘신 원진', desc: '을경 암합 겸해 집착과 원망' },
  진: { partner: '해', name: '진해 원진', desc: '음습한 수토 혼탁, 은밀한 우울' },
  해: { partner: '진', name: '진해 원진', desc: '음습한 수토 혼탁, 은밀한 우울' },
  사: { partner: '술', name: '사술 원진', desc: '화토 건조열, 갑작스러운 분노와 갈등' },
  술: { partner: '사', name: '사술 원진', desc: '화토 건조열, 갑작스러운 분노와 갈등' },
};

/**
 * 1. 파(破) 전용 독립 계산 엔진
 */
export class BranchDestructionEngine {
  public analyze(pillars: FourPillars): MinorRelationMatch[] {
    const matches: MinorRelationMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        const a = activeBranches[i];
        const b = activeBranches[j];
        const dist = Math.abs(a.index - b.index);
        const distMultiplier = dist === 1 ? 1.0 : dist === 2 ? 0.6 : 0.35;

        const po = SIX_DESTRUCTIONS[a.branch];
        if (po && po.partner === b.branch) {
          matches.push({
            detected: true,
            category: 'BRANCH',
            type: 'destruction_po',
            name: po.name,
            branches: [a.branch, b.branch],
            positions: [a.pos, b.pos],
            priority: 'SECONDARY',
            intensity: Math.round(60.0 * distMultiplier * 100) / 100,
            distance: dist,
            baseScore: 60.0,
            description: po.desc,
            interaction: {
              status: 'ACTIVE',
              isMitigated: false,
              description: '파(破) 작용',
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
      evidence: [m.description, `궁위: ${m.positions[0]} ↔ ${m.positions[1]}`, `거리: ${m.distance}칸`],
      temporalCompletion: false,
      description: `원국 지지 ${m.name}: ${m.description}`,
    }));

    return {
      engineId: 'branch_destruction_engine',
      relationType: 'DESTRUCTION',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}

/**
 * 2. 해(害) 전용 독립 계산 엔진
 */
export class BranchHarmEngine {
  public analyze(pillars: FourPillars): MinorRelationMatch[] {
    const matches: MinorRelationMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        const a = activeBranches[i];
        const b = activeBranches[j];
        const dist = Math.abs(a.index - b.index);
        const distMultiplier = dist === 1 ? 1.0 : dist === 2 ? 0.6 : 0.35;

        const hae = SIX_HARMS[a.branch];
        if (hae && hae.partner === b.branch) {
          matches.push({
            detected: true,
            category: 'BRANCH',
            type: 'harm_hae',
            name: hae.name,
            branches: [a.branch, b.branch],
            positions: [a.pos, b.pos],
            priority: 'SECONDARY',
            intensity: Math.round(65.0 * distMultiplier * 100) / 100,
            distance: dist,
            baseScore: 65.0,
            description: hae.desc,
            interaction: {
              status: 'ACTIVE',
              isMitigated: false,
              description: '해(害) 작용',
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
      evidence: [m.description, `궁위: ${m.positions[0]} ↔ ${m.positions[1]}`, `거리: ${m.distance}칸`],
      temporalCompletion: false,
      description: `원국 지지 ${m.name}: ${m.description}`,
    }));

    return {
      engineId: 'branch_harm_engine',
      relationType: 'HARM',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}

/**
 * 3. 원진(怨嗔) 전용 독립 계산 엔진
 * 신살 태그와 독립적으로 지지 상호작용으로서의 원진 관계만 계산
 */
export class BranchWonjinEngine {
  public analyze(pillars: FourPillars): MinorRelationMatch[] {
    const matches: MinorRelationMatch[] = [];
    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) activeBranches.push({ pos, branch: pillar.branch, index: idx });
    });

    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        const a = activeBranches[i];
        const b = activeBranches[j];
        const dist = Math.abs(a.index - b.index);
        const distMultiplier = dist === 1 ? 1.0 : dist === 2 ? 0.6 : 0.35;

        const won = WONJIN_PAIRS[a.branch];
        if (won && won.partner === b.branch) {
          matches.push({
            detected: true,
            category: 'BRANCH',
            type: 'wonjin',
            name: won.name,
            branches: [a.branch, b.branch],
            positions: [a.pos, b.pos],
            priority: 'SECONDARY',
            intensity: Math.round(55.0 * distMultiplier * 100) / 100,
            distance: dist,
            baseScore: 55.0,
            description: won.desc,
            interaction: {
              status: 'ACTIVE',
              isMitigated: false,
              description: '원진 작용',
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
      evidence: [m.description, `궁위: ${m.positions[0]} ↔ ${m.positions[1]}`, `거리: ${m.distance}칸`],
      temporalCompletion: false,
      description: `원국 지지 ${m.name}: ${m.description}`,
    }));

    return {
      engineId: 'branch_wonjin_engine',
      relationType: 'WONJIN',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}

/**
 * 4. BranchHarmDestructionEngine (Aggregator)
 * 파, 해, 원진 독립 엔진들을 호출하여 조합하는 Aggregator 역할 수행
 */
export class BranchHarmDestructionEngine {
  private destructionEngine = new BranchDestructionEngine();
  private harmEngine = new BranchHarmEngine();
  private wonjinEngine = new BranchWonjinEngine();

  public analyze(pillars: FourPillars): MinorRelationMatch[] {
    const poMatches = this.destructionEngine.analyze(pillars);
    const haeMatches = this.harmEngine.analyze(pillars);
    const wonMatches = this.wonjinEngine.analyze(pillars);

    return [...poMatches, ...haeMatches, ...wonMatches];
  }
}
