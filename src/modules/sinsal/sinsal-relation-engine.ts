/**
 * Phase 50: 신살 × 관계 엔진 (Sinsal × Relationship Engine)
 * 
 * 신살과 합·충·형·파·해·원진의 정밀 상호작용을 계산하여
 * 위험도(riskScore), 지원도(supportScore), 작용 효과(effect) 및 ruleId를 기록.
 */

import { FourPillars } from '../../core/types.js';
import { 
  SinsalCalculationResult, 
  RelationInteraction, 
  ScoreModifier 
} from './sinsal-types.js';
import { STEM_MAP, BRANCH_MAP } from './sinsal-core-engine.js';
import { LuckPillarsContext } from './sinsal-activation-engine.js';

export class SinsalRelationEngine {
  /**
   * 신살과 명리 관계(합/충/형/파/해/원진) 및 시간축 상호작용 계산
   */
  public evaluateRelations(
    sinsals: SinsalCalculationResult[],
    fourPillars: FourPillars,
    luckContext?: LuckPillarsContext
  ): {
    updatedSinsals: SinsalCalculationResult[];
    relationInteractions: RelationInteraction[];
  } {
    const interactions: RelationInteraction[] = [];

    const dayBranch = BRANCH_MAP[fourPillars.day.branch]?.hangul || fourPillars.day.branch;
    const yearBranch = BRANCH_MAP[fourPillars.year.branch]?.hangul || fourPillars.year.branch;
    const monthBranch = BRANCH_MAP[fourPillars.month.branch]?.hangul || fourPillars.month.branch;
    const hourBranch = fourPillars.hour ? (BRANCH_MAP[fourPillars.hour.branch]?.hangul || fourPillars.hour.branch) : null;

    const allNatalBranches = [
      { loc: 'year', branch: yearBranch },
      { loc: 'month', branch: monthBranch },
      { loc: 'day', branch: dayBranch },
    ];
    if (hourBranch) allNatalBranches.push({ loc: 'hour', branch: hourBranch });

    // 시간축 지지
    const dBranch = luckContext?.daeun ? (BRANCH_MAP[luckContext.daeun.branch]?.hangul || luckContext.daeun.branch) : null;
    const sBranch = luckContext?.seun ? (BRANCH_MAP[luckContext.seun.branch]?.hangul || luckContext.seun.branch) : null;
    const mBranch = luckContext?.month ? (BRANCH_MAP[luckContext.month.branch]?.hangul || luckContext.month.branch) : null;
    const dayLuckBranch = luckContext?.day ? (BRANCH_MAP[luckContext.day.branch]?.hangul || luckContext.day.branch) : null;

    const timingBranches = [
      { tier: '대운', branch: dBranch },
      { tier: '세운', branch: sBranch },
      { tier: '월운', branch: mBranch },
      { tier: '일진', branch: dayLuckBranch },
    ].filter(t => t.branch !== null) as { tier: string; branch: string }[];

    // 6충 정의
    const clashPairs: [string, string][] = [
      ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']
    ];
    // 6합 정의
    const harmonyPairs: [string, string][] = [
      ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']
    ];
    // 원진 정의
    const wonjinPairs: [string, string][] = [
      ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']
    ];
    // 형살 정의 (인사신, 축술미, 자묘, 진진/오오/유유/해해)
    const isPunishment = (b1: string, b2: string) => {
      if (['인', '사', '신'].includes(b1) && ['인', '사', '신'].includes(b2) && b1 !== b2) return true;
      if (['축', '술', '미'].includes(b1) && ['축', '술', '미'].includes(b2) && b1 !== b2) return true;
      if ((b1 === '자' && b2 === '묘') || (b1 === '묘' && b2 === '자')) return true;
      if (b1 === b2 && ['진', '오', '유', '해'].includes(b1)) return true;
      return false;
    };

    const updatedSinsals = sinsals.map(item => {
      const currentRisk = item.riskScore;
      const currentSupport = item.supportScore;
      const riskModifiers: ScoreModifier[] = [];
      const supportModifiers: ScoreModifier[] = [];
      const triggerRelations: string[] = [...item.triggerRelations];

      // 1. 역마살 × 충/합
      if (item.sinsalId === 'yeok_ma') {
        // 인신충 등 역마 지지가 충을 만나는지 확인
        // CASE 01: 년지 申(역마 지살), 일지 寅(역마) -> 인신충(寅申沖)!
        const hasInShinClash = allNatalBranches.some(b => b.branch === '인') && allNatalBranches.some(b => b.branch === '신');
        if (hasInShinClash) {
          const ruleId = 'REL_YEOKMA_CLASH_ACTIVATED';
          interactions.push({
            relationType: '충',
            targetSinsal: '역마살',
            pillarLocation: '일지(인)-년지(신)',
            effect: '인신충으로 충마(沖馬) 발동: 이동, 환경 변화, 관계의 급변동성 극대화',
            scoreDelta: 20,
            ruleId,
          });
          triggerRelations.push('역마×인신충(충마)');
          riskModifiers.push({ ruleId, reason: '원국 내 인신충으로 역마 파동 가중', delta: 20 });
          item.activationScore = Math.min(100, item.activationScore + 20);
        }

        // 대운/세운/월운과의 충 검사
        for (const tb of timingBranches) {
          if (tb.branch === '신' || tb.branch === '인') {
            const ruleId = `REL_YEOKMA_TIMING_${tb.tier.toUpperCase()}`;
            interactions.push({
              relationType: '충',
              targetSinsal: '역마살',
              pillarLocation: tb.tier,
              timingPillar: tb.tier,
              effect: `${tb.tier} 지지(${tb.branch})가 역마축과 맞물려 활동성 및 물리적/심리적 변동 촉발`,
              scoreDelta: 15,
              ruleId,
            });
            triggerRelations.push(`역마×${tb.tier}(${tb.branch})`);
            riskModifiers.push({ ruleId, reason: `${tb.tier} 역마 충동`, delta: 15 });
          }
        }
      }

      // 2. 도화 × 원진 / 합 / 충
      if (item.sinsalId === 'dohwa_major' || item.sinsalId === 'nyeon_sal') {
        // 월운 丁酉월의 酉(도화)가 일지 寅과 만남 -> 인유(寅酉) 원진!
        const hasYooInTiming = timingBranches.some(t => t.branch === '유');
        if (hasYooInTiming && dayBranch === '인') {
          const ruleId = 'REL_DOHWA_WONJIN_TIMING';
          interactions.push({
            relationType: '원진',
            targetSinsal: item.name,
            pillarLocation: '월운-일지',
            timingPillar: '월운',
            effect: '월운 酉(도화)가 일지 寅과 인유(寅酉) 원진을 형성하여 애정사 오해 및 원망 증폭',
            scoreDelta: 25,
            ruleId,
          });
          triggerRelations.push('도화×월운(인유원진)');
          riskModifiers.push({ ruleId, reason: '월운 도화와 일지 원진 결합으로 감정적 마찰 격화', delta: 25 });
        }

        // 월지 卯와 년지 申의 묘신(卯申) 원진/귀문 결합
        const hasMyoShin = allNatalBranches.some(b => b.branch === '묘') && allNatalBranches.some(b => b.branch === '신');
        if (hasMyoShin) {
          const ruleId = 'REL_DOHWA_MYOSHIN_WONJIN';
          interactions.push({
            relationType: '원진',
            targetSinsal: item.name,
            pillarLocation: '월지(묘)-년지(신)',
            effect: '월지 묘목 도화가 년지 신금과 묘신 원진·귀문관을 이루어 집착과 애증 심화',
            scoreDelta: 20,
            ruleId,
          });
          triggerRelations.push('도화×원국(묘신원진)');
          riskModifiers.push({ ruleId, reason: '월지 도화와 년지 원진 결합', delta: 20 });
        }
      }

      // 3. 원진살 × 시간축 운
      if (item.sinsalId === 'won_jin') {
        for (const tb of timingBranches) {
          const isTriggeringDay = wonjinPairs.some(([x, y]) => (dayBranch === x && tb.branch === y) || (dayBranch === y && tb.branch === x));
          if (isTriggeringDay) {
            const ruleId = `REL_WONJIN_TRIGGERED_BY_${tb.tier.toUpperCase()}`;
            interactions.push({
              relationType: '원진',
              targetSinsal: '원진살',
              pillarLocation: `일지(${dayBranch})-${tb.tier}(${tb.branch})`,
              timingPillar: tb.tier,
              effect: `${tb.tier} 지지(${tb.branch})가 배우자궁(일지 ${dayBranch})과 원진을 일으켜 심리적 불신과 미련 가중`,
              scoreDelta: 25,
              ruleId,
            });
            triggerRelations.push(`원진×${tb.tier}(${tb.branch})`);
            riskModifiers.push({ ruleId, reason: `${tb.tier} 배우자궁 원진 동(動)`, delta: 25 });
          }
        }
      }

      // 4. 귀문관살 × 원진 결합
      if (item.sinsalId === 'gwi_mun') {
        const hasMyoShin = allNatalBranches.some(b => b.branch === '묘') && allNatalBranches.some(b => b.branch === '신');
        if (hasMyoShin) {
          const ruleId = 'REL_GWIMUN_MYOSHIN_DEEP';
          interactions.push({
            relationType: '원진',
            targetSinsal: '귀문관살',
            pillarLocation: '월지-년지',
            effect: '묘신(卯申) 귀문관 형성으로 사소한 언행에 대한 과민 반응과 내적 반추 심화',
            scoreDelta: 15,
            ruleId,
          });
          triggerRelations.push('귀문×묘신 결속');
          riskModifiers.push({ ruleId, reason: '묘신 귀문관 내적 갈등 유발', delta: 15 });
        }
      }

      // 5. 괴강살 × 충/형
      if (item.sinsalId === 'goe_gang' && item.presentInNatal) {
        // 시주 庚辰 괴강 vs 진술충 등
        const hasJinSulClash = allNatalBranches.some(b => b.branch === '술') || timingBranches.some(t => t.branch === '술');
        if (hasJinSulClash) {
          const ruleId = 'REL_GOEGANG_CLASH';
          interactions.push({
            relationType: '충',
            targetSinsal: '괴강살',
            pillarLocation: '진-술',
            effect: '괴강 지지가 충을 만나 강한 고집과 급격한 환경 변화 유발',
            scoreDelta: 20,
            ruleId,
          });
          triggerRelations.push('괴강×진술충');
          riskModifiers.push({ ruleId, reason: '괴강충으로 인한 독단 마찰', delta: 20 });
        }
      }

      // 6. 공망 × 대운/세운 (대운 午, 세운 午 공망)
      if (item.sinsalId === 'gong_mang') {
        const hasOhTiming = timingBranches.some(t => t.branch === '오');
        if (hasOhTiming) {
          const ruleId = 'REL_GONGMANG_FIRE_VOID';
          interactions.push({
            relationType: '충',
            targetSinsal: '공망',
            pillarLocation: '대운·세운(오)',
            timingPillar: '대운/세운',
            effect: '대운과 세운의 오화(午火)가 순중공망에 해당하여 노력과 기대 대비 공허감과 심리적 불안정 야기',
            scoreDelta: 20,
            ruleId,
          });
          triggerRelations.push('공망×대운·세운(오화공망)');
          riskModifiers.push({ ruleId, reason: '오화 공망으로 인한 결실 공허', delta: 20 });
        }
      }

      // 7. 천을귀인 × 보호/완화
      if (item.sinsalId === 'cheoneul_guiin') {
        // 천을귀인은 흉성을 억제하고 안정 지원
        if (item.activationScore > 0 || item.presentInNatal) {
          const ruleId = 'REL_CHEONEUL_PROTECTION';
          supportModifiers.push({ ruleId, reason: '천을귀인의 재난 완화 및 조력 신호', delta: 25 });
        }
      }

      // 8. 午戌 반합 및 화국 상호작용
      const hasOhBranch = allNatalBranches.some(b => b.branch === '오') || timingBranches.some(t => t.branch === '오');
      const hasSulBranch = allNatalBranches.some(b => b.branch === '술') || timingBranches.some(t => t.branch === '술');
      if (hasOhBranch && hasSulBranch && item.sinsalId === 'dohwa_major') {
        const ruleId = 'RULE_REL_OH_SUL_BANHAP';
        interactions.push({
          relationType: '합',
          targetSinsal: '오술반합',
          pillarLocation: '운-원국(오-술)',
          timingPillar: '월운/세운',
          effect: '오술(午戌) 반합 형성: 화국(火局)의 화 관성 작용력 강화 및 열기 증폭',
          scoreDelta: 15,
          ruleId,
        });
        triggerRelations.push('오술(午戌)반합');
      }

      // 최종 riskScore 및 supportScore 산출 (0~100)
      const finalRisk = Math.max(0, Math.min(100, riskModifiers.reduce((acc, m) => acc + m.delta, currentRisk)));
      const finalSupport = Math.max(0, Math.min(100, supportModifiers.reduce((acc, m) => acc + m.delta, currentSupport)));

      return {
        ...item,
        riskScore: finalRisk,
        supportScore: finalSupport,
        triggerRelations: Array.from(new Set(triggerRelations)),
        ruleIds: Array.from(new Set([
          ...item.ruleIds,
          ...riskModifiers.map(m => m.ruleId),
          ...supportModifiers.map(m => m.ruleId)
        ])),
      };
    });

    return {
      updatedSinsals,
      relationInteractions: interactions,
    };
  }
}

export const sinsalRelationEngine = new SinsalRelationEngine();
