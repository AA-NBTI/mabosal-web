import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { mabosal4TierService } from '../src/modules/production/mabosal-4tier-service.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';
import { DaewoonEngine } from '../src/modules/luck/daewoon-engine.js';
import { AnnualMonthlyDailyEngine } from '../src/modules/luck/annual-monthly-daily.js';
import { salDiagnosisEngine } from '../src/modules/sinsal/index.js';
import { BranchClashEngine } from '../src/modules/relationship/branch-clash.js';
import { BranchSixHarmonyEngine, BranchTripleHarmonyEngine, BranchSemiHarmonyEngine } from '../src/modules/relationship/branch-harmony.js';
import { BranchPunishmentEngine } from '../src/modules/relationship/branch-punishment.js';
import { BranchDestructionEngine, BranchHarmEngine, BranchWonjinEngine } from '../src/modules/relationship/branch-harm-destruction.js';
import { SinsalCoreEngine } from '../src/modules/sinsal/sinsal-core-engine.js';
import * as fs from 'fs';
import * as path from 'path';

const outDir = './scratch/phase58';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const cases = [
  {
    id: 'CASE_02',
    name: 'CASE 02: 사업 부도 / 사업 위기',
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female' as const,
    calendarType: 'solar' as const,
    troubleCategory: 'business',
    userTroubleText: '최근 사업에서 거래처와 계약 문제로 심각한 다툼과 갈등이 발생하여 사업 부도 위기에 직면했습니다. 법적 분쟁을 해야 할지 대화로 풀어야 할지 판단이 어렵습니다.',
    clientId: 'tester-case02',
    currentDate: '2026-10-03',
  },
  {
    id: 'CASE_03',
    name: 'CASE 03: 직장 이직 / 승진 갈등',
    birthDate: '1995-05-20',
    birthTime: '18:30',
    gender: 'male' as const,
    calendarType: 'solar' as const,
    troubleCategory: 'career',
    userTroubleText: '회사 상사와 승진 및 인사 갈등으로 큰 마찰이 생겨 퇴사 및 이직을 고민 중입니다.',
    clientId: 'tester-case03',
    currentDate: '2026-10-03',
  },
  {
    id: 'CASE_04',
    name: 'CASE 04: 투자 손실 / 재물 위기',
    birthDate: '1982-04-05',
    birthTime: '06:00',
    gender: 'male' as const,
    calendarType: 'solar' as const,
    troubleCategory: 'wealth',
    userTroubleText: '무리한 투자로 인해 극심한 재물 손실이 커졌고 빚을 갚기가 막막하여 재물 위기에 처했습니다.',
    clientId: 'tester-case04',
    currentDate: '2026-10-03',
  },
  {
    id: 'CASE_05',
    name: 'CASE 05: 수술 / 건강 위기',
    birthDate: '1986-08-15',
    birthTime: '16:00',
    gender: 'male' as const,
    calendarType: 'solar' as const,
    troubleCategory: 'health',
    userTroubleText: '최근 심각한 질환으로 큰 수술을 앞두고 있어 건강 위기에 직면했습니다. 수술이 잘 끝나고 건강을 회복할 수 있을지 불안합니다.',
    clientId: 'tester-case05',
    currentDate: '2026-10-03',
  }
];

async function run() {
  const clashEng = new BranchClashEngine();
  const sixHapEng = new BranchSixHarmonyEngine();
  const triHapEng = new BranchTripleHarmonyEngine();
  const semiHapEng = new BranchSemiHarmonyEngine();
  const punishEng = new BranchPunishmentEngine();
  const destEng = new BranchDestructionEngine();
  const harmEng = new BranchHarmEngine();
  const wonjinEng = new BranchWonjinEngine();
  const sinsalEng = new SinsalCoreEngine();

  for (const c of cases) {
    console.log(`\n=================== Running ${c.id}: ${c.name} ===================`);
    const pipeRes = await productionPipelineEngine.executePipeline({
      calendarType: c.calendarType,
      isLeapMonth: false,
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      isUnknownTime: false,
      gender: c.gender,
      region: '서울',
      troubleCategory: c.troubleCategory,
      userTroubleText: c.userTroubleText,
      clientId: c.clientId,
      currentDate: c.currentDate,
    });

    const fourPillarsText = pipeRes.integratedResult.fourPillarsText;
    const [yText, mText, dText, hText] = fourPillarsText.split(' ');

    const pillarsObj = {
      year: { stem: yText[0] as any, branch: yText[1] as any },
      month: { stem: mText[0] as any, branch: mText[1] as any },
      day: { stem: dText[0] as any, branch: dText[1] as any },
      hour: { stem: hText[0] as any, branch: hText[1] as any },
    };

    const sajuAnalysis = SajuDynamicAnalyzer.analyze(fourPillarsText);

    // 8대 관계엔진 독립 실행
    const clashRes = clashEng.analyzeIndependent({ pillars: pillarsObj });
    const sixHapRes = sixHapEng.analyzeIndependent({ pillars: pillarsObj });
    const triHapRes = triHapEng.analyzeIndependent({ pillars: pillarsObj });
    const semiHapRes = semiHapEng.analyzeIndependent({ pillars: pillarsObj });
    const punishRes = punishEng.analyzeIndependent({ pillars: pillarsObj });
    const destRes = destEng.analyzeIndependent({ pillars: pillarsObj });
    const harmRes = harmEng.analyzeIndependent({ pillars: pillarsObj });
    const wonjinRes = wonjinEng.analyzeIndependent({ pillars: pillarsObj });

    // 신살 엔진 독립 실행
    const sinsalRes = sinsalEng.calculateNatalSinsals(pillarsObj).filter(s => s.presentInNatal);

    // 대운 정보
    const daewoonInfo = pipeRes.integratedResult.dualResult.general_saju.daewoon;

    const caseData = {
      caseId: c.id,
      name: c.name,
      input: c,
      fourPillarsText,
      pillarsObj,
      sajuAnalysis,
      relations: {
        clashes: clashRes.items,
        sixHarmonies: sixHapRes.items,
        tripleHarmonies: triHapRes.items,
        semiHarmonies: semiHapRes.items,
        punishments: punishRes.items,
        destructions: destRes.items,
        harms: harmRes.items,
        wonjin: wonjinRes.items,
      },
      sinsals: sinsalRes.natalSinsals,
      daewoon: daewoonInfo,
    };

    fs.writeFileSync(path.join(outDir, `${c.id.toLowerCase()}_data.json`), JSON.stringify(caseData, null, 2), 'utf-8');

    if (pipeRes.fourTierReports) {
      fs.writeFileSync(path.join(outDir, `${c.id.toLowerCase()}_free.txt`), pipeRes.fourTierReports.free.customerReport, 'utf-8');
      fs.writeFileSync(path.join(outDir, `${c.id.toLowerCase()}_standard.txt`), pipeRes.fourTierReports.standard.customerReport, 'utf-8');
      fs.writeFileSync(path.join(outDir, `${c.id.toLowerCase()}_sal.txt`), pipeRes.fourTierReports.sal.customerReport, 'utf-8');
      fs.writeFileSync(path.join(outDir, `${c.id.toLowerCase()}_premium.txt`), pipeRes.fourTierReports.premium.customerReport, 'utf-8');
    }

    console.log(`Saved ${c.id} outputs to ${outDir}`);
  }
}

run().catch(console.error);
