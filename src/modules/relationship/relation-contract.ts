import { EarthlyBranch, FourPillars } from '../../core/types.js';

export interface BranchRelationInput {
  pillars: FourPillars;
  luckBranches?: {
    daewoon?: EarthlyBranch;
    sewoon?: EarthlyBranch;
    monthWoon?: EarthlyBranch;
    dayWoon?: EarthlyBranch;
  };
}

export interface BranchRelationItem {
  name: string;
  branches: EarthlyBranch[];
  positions: string[];
  source: 'NATAL' | 'NATAL_AND_LUCK' | 'LUCK_ONLY';
  intensity: number;
  evidence: string[];
  temporalCompletion?: boolean; // 운에서 한시적 완성 여부 (원국 삼합과 철저히 구분)
  description: string;
}

export interface IndependentRelationResult {
  engineId: string;
  relationType: 'CLASH' | 'SIX_HARMONY' | 'TRIPLE_HARMONY' | 'SEMI_HARMONY' | 'PUNISHMENT' | 'DESTRUCTION' | 'HARM' | 'WONJIN';
  exists: boolean;
  count: number;
  items: BranchRelationItem[];
}
