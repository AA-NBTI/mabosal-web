/**
 * BranchPunishmentEngine: 지지 삼형(三刑), 상형(相刑), 자형(自刑) 분석 모듈
 * 
 * 4대 층위 원칙:
 * [Layer 1] 관계 존재 사실 (detected: true, punishmentSubType, branches, positions)
 * [Layer 2] 관계 작용 강도 (intensity, baseScore)
 * [Layer 3] 상호작용 (interaction: ACTIVE / MITIGATED)
 * [Layer 4] 파생 지표
 */

import { EarthlyBranch, FourPillars } from '../../core/types.js';
import { BranchRelationInput, BranchRelationItem, IndependentRelationResult } from './relation-contract.js';


export interface BranchPunishmentMatch {
  // Layer 1: 관계 존재 사실
  detected: boolean;
  category: 'BRANCH';
  type: 'triple_punishment' | 'mutual_punishment' | 'self_punishment';
  punishmentSubType:
    | 'COMPLETE_TRIPUNISHMENT' // 완전 삼형 (인사신, 축술미 3자 전원 집결)
    | 'PARTIAL_TRIPUNISHMENT'  // 부분 삼형 (인사, 사신, 인신, 축술, 술미, 축미 2자 결합)
    | 'MUTUAL_PUNISHMENT'     // 상형 (자묘 무례지형)
    | 'SELF_PUNISHMENT';       // 자형 (진진, 오오, 유유, 해해 4종 전용)
  name: string;
  branches: EarthlyBranch[];
  positions: ('year' | 'month' | 'day' | 'hour')[];
  priority: 'PRIMARY';
  categoryType: '무은지형 (인사신)' | '지세지형 (축술미)' | '무례지형 (자묘)' | '자형 (진진, 오오, 유유, 해해)';
  description: string;

  // Layer 2: 관계 작용 강도
  intensity: number; // 0 ~ 100 연속값
  baseScore: number;

  // Layer 3: 상호작용
  interaction: {
    status: 'ACTIVE' | 'MITIGATED';
    isMitigated: boolean;
    description?: string;
  };
}

export class BranchPunishmentEngine {
  public analyze(pillars: FourPillars): BranchPunishmentMatch[] {
    const matches: BranchPunishmentMatch[] = [];

    const activeBranches: { pos: 'year' | 'month' | 'day' | 'hour'; branch: EarthlyBranch; index: number }[] = [];
    const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
    positions.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) {
        activeBranches.push({ pos, branch: pillar.branch, index: idx });
      }
    });

    const branchList = activeBranches.map(b => b.branch);
    const branchSet = new Set(branchList);

    // 1. 인사신 삼형 (무은지형)
    const insasin: EarthlyBranch[] = ['인', '사', '신'];
    const presentInsasin = insasin.filter(b => branchSet.has(b));
    if (presentInsasin.length === 3) {
      const posList = activeBranches.filter(b => insasin.includes(b.branch)).map(b => b.pos);
      matches.push({
        detected: true,
        category: 'BRANCH',
        type: 'triple_punishment',
        punishmentSubType: 'COMPLETE_TRIPUNISHMENT',
        name: '인사신 삼형 (완전성립)',
        branches: ['인', '사', '신'],
        positions: posList,
        priority: 'PRIMARY',
        categoryType: '무은지형 (인사신)',
        baseScore: 95.0,
        intensity: 95.0,
        description: '강력한 형살 작용, 수술/사고/법적 분쟁/권력성 직업 집중',
        interaction: {
          status: 'ACTIVE',
          isMitigated: false,
          description: '완전 삼형 활성',
        },
      });
    }

    // 2. 축술미 삼형 (지세지형: 축, 술, 미 3자 전원 집결 시에만 성립)
    const chuksulmi: EarthlyBranch[] = ['축', '술', '미'];
    const presentChuksulmi = chuksulmi.filter(b => branchSet.has(b));
    if (presentChuksulmi.length === 3) {
      const posList = activeBranches.filter(b => chuksulmi.includes(b.branch)).map(b => b.pos);
      matches.push({
        detected: true,
        category: 'BRANCH',
        type: 'triple_punishment',
        punishmentSubType: 'COMPLETE_TRIPUNISHMENT',
        name: '축술미 삼형 (완전성립)',
        branches: ['축', '술', '미'],
        positions: posList,
        priority: 'PRIMARY',
        categoryType: '지세지형 (축술미)',
        baseScore: 95.0,
        intensity: 95.0,
        description: '토의 격돌, 부동산/동료 배신/법적 다툼 및 내면 마찰',
        interaction: {
          status: 'ACTIVE',
          isMitigated: false,
          description: '완전 삼형 활성',
        },
      });
    }


    // 3. 자묘 상형 (무례지형)
    if (branchSet.has('자') && branchSet.has('묘')) {
      const posList = activeBranches.filter(b => b.branch === '자' || b.branch === '묘').map(b => b.pos);
      matches.push({
        detected: true,
        category: 'BRANCH',
        type: 'mutual_punishment',
        punishmentSubType: 'MUTUAL_PUNISHMENT',
        name: '자묘 상형',
        branches: ['자', '묘'],
        positions: posList,
        priority: 'PRIMARY',
        categoryType: '무례지형 (자묘)',
        baseScore: 70.0,
        intensity: 70.0,
        description: '도화성 형살, 대인관계 예의/구설/성격적 까다로움',
        interaction: {
          status: 'ACTIVE',
          isMitigated: false,
          description: '상형 발동',
        },
      });
    }

    // 4. 자형 (진진, 오오, 유유, 해해 중복 4종 전용 - 술술 등은 절대 불포함)
    const selfPunishCandidates: EarthlyBranch[] = ['진', '오', '유', '해'];
    for (const target of selfPunishCandidates) {
      const found = activeBranches.filter(b => b.branch === target);
      if (found.length >= 2) {
        matches.push({
          detected: true,
          category: 'BRANCH',
          type: 'self_punishment',
          punishmentSubType: 'SELF_PUNISHMENT',
          name: `${target}${target} 자형`,
          branches: found.map(f => f.branch),
          positions: found.map(f => f.pos),
          priority: 'PRIMARY',
          categoryType: '자형 (진진, 오오, 유유, 해해)',
          baseScore: 65.0,
          intensity: 65.0,
          description: '스스로를 옭아매거나 자책/과열되는 심리적 작용',
          interaction: {
            status: 'ACTIVE',
            isMitigated: false,
            description: '자형 발동',
          },
        });
      }
    }

    return matches;
  }

  /**
   * Phase 55: 독립 모듈 최소 계약을 준수하는 형(刑) 분석 메서드
   * 인사신 삼형, 축술미 삼형, 자묘 상형, 자형(진진/오오/유유/해해) 독립 판정
   */
  public analyzeIndependent(input: BranchRelationInput): IndependentRelationResult {
    const rawMatches = this.analyze(input.pillars);
    const items: BranchRelationItem[] = rawMatches.map(m => ({
      name: m.name,
      branches: m.branches,
      positions: m.positions,
      source: 'NATAL',
      intensity: m.intensity,
      evidence: [m.description, `유형: ${m.categoryType}`, `궁위: ${m.positions.join(', ')}`],
      temporalCompletion: false,
      description: `원국 ${m.name} (${m.categoryType}): ${m.description}`,
    }));

    return {
      engineId: 'branch_punishment_engine',
      relationType: 'PUNISHMENT',
      exists: items.length > 0,
      count: items.length,
      items,
    };
  }
}


