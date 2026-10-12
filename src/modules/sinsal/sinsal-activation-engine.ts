/**
 * Phase 50: 신살 시간축 활성화 엔진 (Sinsal Activation Engine)
 * 
 * 원국(Natal) 존재 여부와 시간축(대운, 세운, 월운, 일진)에 의한 활성화를 엄격히 분리하여 계산.
 * 원국에 있는 신살이 운에서 동(動)하는 경우뿐만 아니라,
 * 원국에 없던 신살이 운에서 새롭게 유입(流人)되어 일시 작동하는 경우도 독립적으로 판정.
 */

import { FourPillars, Pillar } from '../../core/types.js';
import { 
  SinsalCalculationResult, 
  ScoreModifier, 
  SinsalScoreBreakdown 
} from './sinsal-types.js';
import { SINSAL_DEFINITIONS } from './sinsal-db.js';
import { 
  STEM_MAP, 
  BRANCH_MAP, 
  SAMHAP_12SINSAL_MAP, 
  SinsalCoreEngine 
} from './sinsal-core-engine.js';

export interface LuckPillarsContext {
  daeun?: { stem: string; branch: string; ganji?: string };
  seun?: { stem: string; branch: string; ganji?: string };
  month?: { stem: string; branch: string; ganji?: string };
  day?: { stem: string; branch: string; ganji?: string };
}

export class SinsalActivationEngine {
  private coreEngine = new SinsalCoreEngine();

  /**
   * 시간축 운(대운/세운/월운/일진)에 따른 신살 활성화 계산
   */
  public evaluateActivation(
    natalResults: SinsalCalculationResult[],
    fourPillars: FourPillars,
    luckContext: LuckPillarsContext
  ): SinsalCalculationResult[] {
    const dayStem = STEM_MAP[fourPillars.day.stem]?.hangul || fourPillars.day.stem;
    const dayBranch = BRANCH_MAP[fourPillars.day.branch]?.hangul || fourPillars.day.branch;
    const yearBranch = BRANCH_MAP[fourPillars.year.branch]?.hangul || fourPillars.year.branch;
    const monthBranch = BRANCH_MAP[fourPillars.month.branch]?.hangul || fourPillars.month.branch;

    const dStem = luckContext.daeun ? (STEM_MAP[luckContext.daeun.stem]?.hangul || luckContext.daeun.stem) : null;
    const dBranch = luckContext.daeun ? (BRANCH_MAP[luckContext.daeun.branch]?.hangul || luckContext.daeun.branch) : null;

    const sStem = luckContext.seun ? (STEM_MAP[luckContext.seun.stem]?.hangul || luckContext.seun.stem) : null;
    const sBranch = luckContext.seun ? (BRANCH_MAP[luckContext.seun.branch]?.hangul || luckContext.seun.branch) : null;

    const mStem = luckContext.month ? (STEM_MAP[luckContext.month.stem]?.hangul || luckContext.month.stem) : null;
    const mBranch = luckContext.month ? (BRANCH_MAP[luckContext.month.branch]?.hangul || luckContext.month.branch) : null;

    const dailyStem = luckContext.day ? (STEM_MAP[luckContext.day.stem]?.hangul || luckContext.day.stem) : null;
    const dailyBranch = luckContext.day ? (BRANCH_MAP[luckContext.day.branch]?.hangul || luckContext.day.branch) : null;

    // 12신살 맵 (년지 기준)
    const yearSamhap = this.coreEngine.getSamhapGroup(yearBranch);
    const sinsal12MapYear = SAMHAP_12SINSAL_MAP[yearSamhap];

    // 공망 지지
    const [gm1, gm2] = this.coreEngine.getGongmangBranches(dayStem, dayBranch);

    return natalResults.map(item => {
      const def = SINSAL_DEFINITIONS[item.sinsalId];
      let actDaeun = false;
      let actSeun = false;
      let actMonth = false;
      let actDay = false;

      const actModifiers: ScoreModifier[] = [];

      // A. 12신살 활성화 평가
      if (item.category === '12sinsal') {
        if (dBranch && sinsal12MapYear[dBranch] === item.sinsalId) {
          actDaeun = true;
          actModifiers.push({ ruleId: 'ACT_DAEUN_12SINSAL', reason: `대운 지지(${dBranch})에 ${item.name} 도래`, delta: 25 });
        }
        if (sBranch && sinsal12MapYear[sBranch] === item.sinsalId) {
          actSeun = true;
          actModifiers.push({ ruleId: 'ACT_SEUN_12SINSAL', reason: `세운 지지(${sBranch})에 ${item.name} 도래`, delta: 20 });
        }
        if (mBranch && sinsal12MapYear[mBranch] === item.sinsalId) {
          actMonth = true;
          actModifiers.push({ ruleId: 'ACT_MONTH_12SINSAL', reason: `월운 지지(${mBranch})에 ${item.name} 도래`, delta: 15 });
        }
        if (dailyBranch && sinsal12MapYear[dailyBranch] === item.sinsalId) {
          actDay = true;
          actModifiers.push({ ruleId: 'ACT_DAY_12SINSAL', reason: `일진 지지(${dailyBranch})에 ${item.name} 도래`, delta: 10 });
        }
      }

      // B. 주요 신살 개별 활성화 평가
      if (item.sinsalId === 'dohwa_major') {
        const checkDohwa = (b: string | null) => b && ['자', '오', '묘', '유'].includes(b);
        if (checkDohwa(dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_DOHWA', reason: `대운 지지(${dBranch}) 도화 활성`, delta: 20 }); }
        if (checkDohwa(sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_DOHWA', reason: `세운 지지(${sBranch}) 도화 활성`, delta: 15 }); }
        if (checkDohwa(mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_DOHWA', reason: `월운 지지(${mBranch}) 도화 활성`, delta: 15 }); }
        if (checkDohwa(dailyBranch)) { actDay = true; actModifiers.push({ ruleId: 'ACT_DAY_DOHWA', reason: `일진 지지(${dailyBranch}) 도화 활성`, delta: 10 }); }
      } else if (item.sinsalId === 'cheoneul_guiin') {
        const targets = ['갑', '무', '경'].includes(dayStem) ? ['축', '미']
          : ['을', '기'].includes(dayStem) ? ['자', '신']
          : ['병', '정'].includes(dayStem) ? ['해', '유']
          : ['임', '계'].includes(dayStem) ? ['사', '묘']
          : ['오', '인']; // 辛
        const checkGuiin = (b: string | null) => b && targets.includes(b);
        if (checkGuiin(dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_CHEONEUL', reason: `대운 지지(${dBranch}) 천을귀인 도래`, delta: 30 }); }
        if (checkGuiin(sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_CHEONEUL', reason: `세운 지지(${sBranch}) 천을귀인 도래`, delta: 25 }); }
        if (checkGuiin(mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_CHEONEUL', reason: `월운 지지(${mBranch}) 천을귀인 도래`, delta: 20 }); }
        if (checkGuiin(dailyBranch)) { actDay = true; actModifiers.push({ ruleId: 'ACT_DAY_CHEONEUL', reason: `일진 지지(${dailyBranch}) 천을귀인 도래`, delta: 15 }); }
      } else if (item.sinsalId === 'yang_in') {
        const yanginMap: Record<string, string> = { '갑': '묘', '병': '오', '무': '오', '경': '유', '임': '자' };
        const target = yanginMap[dayStem];
        if (target) {
          if (dBranch === target) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_YANGIN', reason: `대운 지지(${dBranch}) 양인 활성`, delta: 25 }); }
          if (sBranch === target) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_YANGIN', reason: `세운 지지(${sBranch}) 양인 활성`, delta: 20 }); }
          if (mBranch === target) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_YANGIN', reason: `월운 지지(${mBranch}) 양인 활성`, delta: 20 }); }
          if (dailyBranch === target) { actDay = true; actModifiers.push({ ruleId: 'ACT_DAY_YANGIN', reason: `일진 지지(${dailyBranch}) 양인 활성`, delta: 10 }); }
        }
      } else if (item.sinsalId === 'goe_gang') {
        const goegangList = ['경진', '경술', '임진', '무술'];
        const checkG = (s: string | null, b: string | null) => s && b && goegangList.includes(`${s}${b}`);
        if (checkG(dStem, dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_GOEGANG', reason: `대운 간지(${dStem}${dBranch}) 괴강 운 도래`, delta: 20 }); }
        if (checkG(sStem, sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_GOEGANG', reason: `세운 간지(${sStem}${sBranch}) 괴강 운 도래`, delta: 15 }); }
        if (checkG(mStem, mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_GOEGANG', reason: `월운 간지(${mStem}${mBranch}) 괴강 운 도래`, delta: 15 }); }
      } else if (item.sinsalId === 'baek_ho') {
        const baekhoList = ['갑진', '을미', '병술', '정축', '무진', '임술', '계축'];
        const checkB = (s: string | null, b: string | null) => s && b && baekhoList.includes(`${s}${b}`);
        if (checkB(dStem, dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_BAEKHO', reason: `대운 간지(${dStem}${dBranch}) 백호 운 도래`, delta: 20 }); }
        if (checkB(sStem, sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_BAEKHO', reason: `세운 간지(${sStem}${sBranch}) 백호 운 도래`, delta: 15 }); }
        if (checkB(mStem, mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_BAEKHO', reason: `월운 간지(${mStem}${mBranch}) 백호 운 도래`, delta: 15 }); }
      } else if (item.sinsalId === 'won_jin') {
        const wonjinPairs: [string, string][] = [
          ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']
        ];
        const checkWJWithDay = (b: string | null) => b && wonjinPairs.some(([x, y]) => (dayBranch === x && b === y) || (dayBranch === y && b === x));
        if (checkWJWithDay(dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_WONJIN', reason: `대운 지지(${dBranch})가 일지(${dayBranch})와 원진 형성`, delta: 25 }); }
        if (checkWJWithDay(sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_WONJIN', reason: `세운 지지(${sBranch})가 일지(${dayBranch})와 원진 형성`, delta: 20 }); }
        if (checkWJWithDay(mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_WONJIN', reason: `월운 지지(${mBranch})가 일지(${dayBranch})와 원진 형성`, delta: 20 }); }
        if (checkWJWithDay(dailyBranch)) { actDay = true; actModifiers.push({ ruleId: 'ACT_DAY_WONJIN', reason: `일진 지지(${dailyBranch})가 일지(${dayBranch})와 원진 형성`, delta: 10 }); }
      } else if (item.sinsalId === 'gwi_mun') {
        const gwimunPairs: [string, string][] = [
          ['묘', '신'], ['인', '미'], ['자', '유'], ['축', '오'], ['진', '해'], ['사', '술']
        ];
        const checkGMWithDay = (b: string | null) => b && gwimunPairs.some(([x, y]) => (dayBranch === x && b === y) || (dayBranch === y && b === x));
        if (checkGMWithDay(dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_GWIMUN', reason: `대운 지지(${dBranch})가 일지(${dayBranch})와 귀문관 형성`, delta: 20 }); }
        if (checkGMWithDay(sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_GWIMUN', reason: `세운 지지(${sBranch})가 일지(${dayBranch})와 귀문관 형성`, delta: 15 }); }
        if (checkGMWithDay(mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_GWIMUN', reason: `월운 지지(${mBranch})가 일지(${dayBranch})와 귀문관 형성`, delta: 15 }); }
        if (checkGMWithDay(dailyBranch)) { actDay = true; actModifiers.push({ ruleId: 'ACT_DAY_GWIMUN', reason: `일진 지지(${dailyBranch})가 일지(${dayBranch})와 귀문관 형성`, delta: 10 }); }
      } else if (item.sinsalId === 'gong_mang') {
        if (dBranch && (dBranch === gm1 || dBranch === gm2)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_GONGMANG', reason: `대운 지지(${dBranch})가 순중공망에 해당`, delta: 25 }); }
        if (sBranch && (sBranch === gm1 || sBranch === gm2)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_GONGMANG', reason: `세운 지지(${sBranch})가 순중공망에 해당`, delta: 20 }); }
        if (mBranch && (mBranch === gm1 || mBranch === gm2)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_GONGMANG', reason: `월운 지지(${mBranch})가 순중공망에 해당`, delta: 15 }); }
        if (dailyBranch && (dailyBranch === gm1 || dailyBranch === gm2)) { actDay = true; actModifiers.push({ ruleId: 'ACT_DAY_GONGMANG', reason: `일진 지지(${dailyBranch})가 순중공망에 해당`, delta: 10 }); }
      } else if (item.sinsalId === 'hyeon_chim') {
        const checkHC = (s: string | null, b: string | null) => (s && ['갑', '신'].includes(s)) || (b && ['묘', '오', '신'].includes(b));
        if (checkHC(dStem, dBranch)) { actDaeun = true; actModifiers.push({ ruleId: 'ACT_DAEUN_HYEONCHIM', reason: `대운에 현침 글자(${dStem || ''}${dBranch || ''}) 도래`, delta: 15 }); }
        if (checkHC(sStem, sBranch)) { actSeun = true; actModifiers.push({ ruleId: 'ACT_SEUN_HYEONCHIM', reason: `세운에 현침 글자(${sStem || ''}${sBranch || ''}) 도래`, delta: 15 }); }
        if (checkHC(mStem, mBranch)) { actMonth = true; actModifiers.push({ ruleId: 'ACT_MONTH_HYEONCHIM', reason: `월운에 현침 글자(${mStem || ''}${mBranch || ''}) 도래`, delta: 10 }); }
      }

      // 활성화 점수 계산
      const isAnyTimeActive = actDaeun || actSeun || actMonth || actDay;
      const baseScore = item.presentInNatal ? 50 : 0;
      const totalSum = actModifiers.reduce((acc, m) => acc + m.delta, baseScore);
      const finalActScore = Math.max(0, Math.min(100, isAnyTimeActive ? Math.max(item.presentInNatal ? 40 : 25, totalSum) : (item.presentInNatal ? 35 : 0)));

      const updatedEvidence = { ...item.calculationEvidence };
      updatedEvidence.scoreBreakdown = {
        base: baseScore,
        modifiers: [...item.calculationEvidence.scoreBreakdown.modifiers, ...actModifiers],
        caps: 100,
        floors: 0,
        final: finalActScore,
        ruleIds: [...item.ruleIds, ...actModifiers.map(m => m.ruleId)],
      };

      return {
        ...item,
        activationByDaeun: actDaeun,
        activationBySeun: actSeun,
        activationByMonth: actMonth,
        activationByDay: actDay,
        activationScore: finalActScore,
        ruleIds: Array.from(new Set([...item.ruleIds, ...actModifiers.map(m => m.ruleId)])),
        calculationEvidence: updatedEvidence,
      };
    });
  }
}

export const sinsalActivationEngine = new SinsalActivationEngine();
