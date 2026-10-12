/**
 * StemRelationshipEngine: 천간합(干合) 및 천간충(干沖) 분석 모듈
 * 
 * 4대 층위 원칙:
 * [Layer 1] 관계 존재 사실 (detected: boolean, participants, positions)
 * [Layer 2] 관계 작용 강도 (intensity, distance, baseScore)
 * [Layer 3] 합화(Transformation) 정밀 평가 (COMBINED / TRANSFORMABLE / TRANSFORMED)
 * [Layer 4] 관계 상호작용 (interaction: ACTIVE / MITIGATED / TIED)
 */

import { BRANCH_INFO, STEM_INFO } from '../../core/constants.js';
import { EarthlyBranch, FiveElement, FourPillars, HeavenlyStem } from '../../core/types.js';

export interface StemTransformationResult {
  possible: boolean;
  transformed: boolean;
  status: 'COMBINED' | 'TRANSFORMABLE' | 'TRANSFORMED';
  targetElement: FiveElement;
  evidence: string[];
  blockers: string[];
}

export interface StemRelationMatch {
  // Layer 1: 관계 존재 사실
  detected: boolean;
  category: 'STEM';
  type: 'stem_combination' | 'stem_clash';
  stems: [HeavenlyStem, HeavenlyStem];
  positions: ['year' | 'month' | 'day' | 'hour', 'year' | 'month' | 'day' | 'hour'];
  name: string;             // 예: "갑기합토", "갑경충"
  priority: 'PRIMARY';

  // Layer 2: 관계 작용 강도
  intensity: number;        // 0 ~ 100 연속값 (거리 감쇄 반영)
  distance: number;         // 거리 (1: 인접, 2: 1격, 3: 2격)
  baseScore: number;        // 기본 강도 (거리 적용 전)

  // Layer 3: 합화 정밀 평가 (오합 전용)
  transformation?: StemTransformationResult;
  transformedElement?: FiveElement; // 실제 합화가 완료된 경우에만 유효 오행 기록

  // Layer 4: 상호작용
  interaction: {
    status: 'ACTIVE' | 'MITIGATED' | 'TIED';
    isMitigated: boolean;
    mitigatedBy?: string;
    description?: string;
  };
}

// 천간합 5종
export const STEM_COMBINATIONS: Record<string, { partner: HeavenlyStem; element: FiveElement; name: string }> = {
  갑: { partner: '기', element: '토', name: '갑기합토' },
  기: { partner: '갑', element: '토', name: '갑기합토' },
  을: { partner: '경', element: '금', name: '을경합금' },
  경: { partner: '을', element: '금', name: '을경합금' },
  병: { partner: '신', element: '수', name: '병신합수' },
  신: { partner: '병', element: '수', name: '병신합수' },
  정: { partner: '임', element: '목', name: '정임합목' },
  임: { partner: '정', element: '목', name: '정임합목' },
  무: { partner: '계', element: '화', name: '무계합화' },
  계: { partner: '무', element: '화', name: '무계합화' },
};

// 천간 7살 충 (정면 충돌 4종)
export const STEM_CLASHES: Record<string, { partner: HeavenlyStem; name: string }> = {
  갑: { partner: '경', name: '갑경충' },
  경: { partner: '갑', name: '갑경충' },
  을: { partner: '신', name: '을신충' },
  신: { partner: '을', name: '을신충' },
  병: { partner: '임', name: '병임충' },
  임: { partner: '병', name: '병임충' },
  정: { partner: '계', name: '정계충' },
  계: { partner: '정', name: '정계충' },
};

export class StemRelationshipEngine {
  private readonly POSITION_ORDER: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];

  public analyze(pillars: FourPillars): StemRelationMatch[] {
    const results: StemRelationMatch[] = [];

    const activeStems: { pos: 'year' | 'month' | 'day' | 'hour'; stem: HeavenlyStem; index: number }[] = [];
    this.POSITION_ORDER.forEach((pos, idx) => {
      if (pos === 'hour' && !pillars.hour) return;
      const pillar = pillars[pos];
      if (pillar) {
        activeStems.push({ pos, stem: pillar.stem, index: idx });
      }
    });

    const monthBranch = pillars.month.branch;
    const monthBranchElement = BRANCH_INFO[monthBranch].element;

    for (let i = 0; i < activeStems.length; i++) {
      for (let j = i + 1; j < activeStems.length; j++) {
        const a = activeStems[i];
        const b = activeStems[j];
        const dist = Math.abs(a.index - b.index);

        // 거리 가중치 (파생 강도 계산에만 적용되며, 존재 여부와는 완전 분리)
        const distanceMultiplier = dist === 1 ? 1.0 : dist === 2 ? 0.55 : 0.3;

        // 1. 천간합 검사
        const combo = STEM_COMBINATIONS[a.stem];
        if (combo && combo.partner === b.stem) {
          // 합화 조건 다각도 정밀 평가
          const evidence: string[] = [];
          const blockers: string[] = [];
          const targetEl = combo.element;

          // (1) 월령 지원 검사 (월지 본기 오행이 목표 오행과 같거나 생함)
          const isMonthMatch = monthBranchElement === targetEl;
          if (isMonthMatch) {
            evidence.push(`월령 [${monthBranch}(${monthBranchElement})]이 합화 오행 [${targetEl}]을 직접 사령함`);
          }

          // (2) 원국 내 합화 오행 세력 검사
          const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour ? pillars.hour.branch : null];
          const rootCount = allBranches.filter(br => br && BRANCH_INFO[br].element === targetEl).length;
          if (rootCount >= 2) {
            evidence.push(`지지 ${rootCount}곳에서 합화 오행 [${targetEl}]의 지지 기반 형성`);
          }

          // (3) 쟁합(爭合) 및 투합(妬合) 검사
          const sameCountA = activeStems.filter(s => s.stem === a.stem).length;
          const sameCountB = activeStems.filter(s => s.stem === b.stem).length;
          if (sameCountA >= 2 || sameCountB >= 2) {
            blockers.push(`동일 천간 중복으로 인한 쟁합(爭合)/투합(妬合) 발생 (합화 방해)`);
          }

          // (4) 인접성 검사
          if (dist > 1) {
            blockers.push(`격위(거리 ${dist})로 떨어져 있어 합화 기운이 약화됨`);
          }

          // 최종 합화 판정
          let transformStatus: StemTransformationResult['status'] = 'COMBINED';
          let isTransformed = false;
          let isPossible = false;

          if (isMonthMatch && blockers.length === 0) {
            transformStatus = 'TRANSFORMED';
            isTransformed = true;
            isPossible = true;
          } else if (isMonthMatch || rootCount >= 2) {
            transformStatus = 'TRANSFORMABLE';
            isPossible = true;
            isTransformed = false;
          } else {
            transformStatus = 'COMBINED';
            isPossible = false;
            isTransformed = false;
          }

          results.push({
            detected: true,
            category: 'STEM',
            type: 'stem_combination',
            stems: [a.stem, b.stem],
            positions: [a.pos, b.pos],
            name: combo.name,
            priority: 'PRIMARY',
            intensity: Math.round(90.0 * distanceMultiplier * 100) / 100,
            distance: dist,
            baseScore: 90.0,
            transformation: {
              possible: isPossible,
              transformed: isTransformed,
              status: transformStatus,
              targetElement: targetEl,
              evidence,
              blockers,
            },
            // 실제 합화 성공 시에만 유효값 기록 (합이 성립해도 불화 시 undefined)
            transformedElement: isTransformed ? targetEl : undefined,
            interaction: {
              status: isTransformed ? 'ACTIVE' : 'TIED',
              isMitigated: false,
              description: isTransformed
                ? `합화 성공: [${combo.name}]으로 오행 ${targetEl}의 기운으로 변화`
                : `합이불화(合而不化): 합으로 묶여 본래 작용력이 정체됨(기반)`,
            },
          });
        }

        // 2. 천간충 검사
        const clash = STEM_CLASHES[a.stem];
        if (clash && clash.partner === b.stem) {
          results.push({
            detected: true,
            category: 'STEM',
            type: 'stem_clash',
            stems: [a.stem, b.stem],
            positions: [a.pos, b.pos],
            name: clash.name,
            priority: 'PRIMARY',
            intensity: Math.round(85.0 * distanceMultiplier * 100) / 100,
            distance: dist,
            baseScore: 85.0,
            interaction: {
              status: 'ACTIVE',
              isMitigated: false,
              description: `천간 정면 충돌 (거리 ${dist})`,
            },
          });
        }
      }
    }

    return results;
  }
}
