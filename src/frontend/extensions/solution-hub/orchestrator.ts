import type { MabosalSessionState } from '../../../modules/phase13/phase13-types.js';
import { ModuleRegistry } from '../../state/module-registry.js';
import { getAllPartners, getAllSolutions, VERTICALS } from './catalog.js';
import { extractSignalTags } from './signal-adapter.js';
import { isSuppressed } from './tracking.js';
import type { Recommendation, SignalTag, VerticalId } from './types.js';

/**
 * 솔루션 오케스트레이터:
 * 신호 태그와 카탈로그를 매칭해 사용자에게 보여줄 추천 목록을 만든다.
 * 
 * 원칙:
 * - 한 화면 최대 3개 카드
 * - 버티컬당 최대 카드 수 준수
 * - ModuleRegistry 스위치가 꺼진 버티컬은 완전 제외
 * - 재노출 쿨다운(isSuppressed) 적용: 이미 클릭/반응한 솔루션은 일정 기간 숨김
 * - 심리적 압박(mind.stress >= 2) 감지 시 정서 케어 우선 정렬
 */

const GLOBAL_MAX_CARDS = 3;

function findTag(tags: SignalTag[], target: string): SignalTag | undefined {
  return tags.find(t => t.tag === target);
}

/** 정서적 고위험/극심 스트레스 상태인지 확인 (모달 트리거용) */
export function checkHighMentalStress(session: MabosalSessionState | null | undefined): { isHigh: boolean; sourceName: string } {
  const tags = extractSignalTags(session);
  const mind = findTag(tags, 'mind.stress');
  if (mind && mind.level >= 2) {
    return { isHigh: true, sourceName: mind.sourceName };
  }
  return { isHigh: false, sourceName: '' };
}

export function recommendSolutions(session: MabosalSessionState | null | undefined): Recommendation[] {
  if (!session) return [];

  // 1. 솔루션 허브 마스터 스위치 확인
  if (!ModuleRegistry.isEnabled('solution_hub')) return [];

  const tags = extractSignalTags(session);
  if (tags.length === 0) return [];

  const verticalMap = new Map<VerticalId, (typeof VERTICALS)[number]>();
  for (const v of VERTICALS) {
    if (ModuleRegistry.isEnabled(v.moduleId)) {
      verticalMap.set(v.id, v);
    }
  }

  const partners = getAllPartners();
  const partnerMap = new Map(partners.map(p => [p.id, p]));
  const allSolutions = getAllSolutions();

  const candidates: Recommendation[] = [];

  for (const solution of allSolutions) {
    const partner = partnerMap.get(solution.partnerId);
    if (!partner || !partner.active) continue;

    const vertical = verticalMap.get(partner.verticalId);
    if (!vertical) continue;

    // 쿨다운 검사: 이미 클릭하여 쿨다운 중인 솔루션은 제외
    if (isSuppressed(solution.id, solution.cooldownDays ?? 7)) {
      continue;
    }

    for (const rule of solution.matchTags) {
      const hit = findTag(tags, rule.tag);
      if (hit && hit.level >= rule.minLevel) {
        candidates.push({
          solution,
          partner,
          vertical,
          reason: solution.reasonTemplate.replace('{ma}', hit.sourceName),
          level: hit.level,
        });
        break;
      }
    }
  }

  const mindStress = findTag(tags, 'mind.stress');
  const mindFirst = !!mindStress && mindStress.level >= 2;

  candidates.sort((a, b) => {
    if (mindFirst) {
      const am = a.vertical.id === 'mind' ? 1 : 0;
      const bm = b.vertical.id === 'mind' ? 1 : 0;
      if (am !== bm) return bm - am;
    }
    if (b.level !== a.level) return b.level - a.level;
    return b.solution.priority - a.solution.priority;
  });

  const perVertical = new Map<VerticalId, number>();
  const picked: Recommendation[] = [];

  for (const c of candidates) {
    if (picked.length >= GLOBAL_MAX_CARDS) break;
    const used = perVertical.get(c.vertical.id) ?? 0;
    if (used >= c.vertical.maxCards) continue;
    perVertical.set(c.vertical.id, used + 1);
    picked.push(c);
  }

  return picked;
}
