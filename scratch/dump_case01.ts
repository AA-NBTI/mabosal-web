import { mabosal4TierService } from '../src/modules/production/mabosal-4tier-service.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';
import { DaewoonEngine } from '../src/modules/luck/daewoon-engine.js';
import { AnnualMonthlyDailyEngine } from '../src/modules/luck/annual-monthly-daily.js';
import { salDiagnosisEngine } from '../src/modules/sinsal/index.js';
import * as fs from 'fs';
import * as path from 'path';

const outDir = './scratch/phase56';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const birth = {
  birthYear: 1992,
  birthMonth: 3,
  birthDay: 15,
  birthHour: 8,
  birthMinute: 30,
  gender: 'male' as const,
  calendarType: 'solar' as const,
  fourPillarsText: '임신 계묘 경인 경진',
  userTroubleText: '연애 결별 후 재회 가능성이 궁금합니다.',
  curDate: '2026-10-03'
};

const sajuAnalysis = SajuDynamicAnalyzer.analyze(birth.fourPillarsText);
const daewoonEng = new DaewoonEngine();
const timeLuckEng = new AnnualMonthlyDailyEngine();

const pillars = {
  year: { stem: '임' as const, branch: '신' as const },
  month: { stem: '계' as const, branch: '묘' as const },
  day: { stem: '경' as const, branch: '인' as const },
  hour: { stem: '경' as const, branch: '진' as const }
};

const daewoonData = daewoonEng.calculate(
  '임',
  { stem: '계', branch: '묘' },
  new Date(Date.UTC(1992, 2, 14, 23, 30)), // 1992-03-15 08:30 KST -> UTC 1992-03-14 23:30
  1992,
  'male'
);


const sewoon2026 = timeLuckEng.getAnnualLuck(2026);
const monthly2026 = timeLuckEng.getYearMonthlyLuckSchedule(2026, '2026-10-03');



const salRes = salDiagnosisEngine.diagnose({
  fourPillars: pillars,
  luckContext: {
    daeun: { stem: '병' as const, branch: '오' as const, ganji: '병오' },
    seun: { stem: '병' as const, branch: '오' as const, ganji: '병오' },
    month: { stem: '정' as const, branch: '유' as const, ganji: '정유' },
    day: { stem: '경' as const, branch: '인' as const, ganji: '경인' }
  },
  userEvent: {
    eventText: birth.userTroubleText,
    eventDateKnown: false
  }
});

const tierRes = mabosal4TierService.generateAllTiers({
  ...birth,
  daewoonInfo: daewoonData,
  salDiagnosis: salRes
});

fs.writeFileSync(path.join(outDir, 'case01_saju_analysis.json'), JSON.stringify(sajuAnalysis, null, 2), 'utf-8');
fs.writeFileSync(path.join(outDir, 'case01_daewoon.json'), JSON.stringify(daewoonData, null, 2), 'utf-8');

fs.writeFileSync(path.join(outDir, 'case01_sewoon.json'), JSON.stringify({ sewoon2026, monthly2026 }, null, 2), 'utf-8');

fs.writeFileSync(path.join(outDir, 'case01_sal_diagnosis.json'), JSON.stringify(salRes, null, 2), 'utf-8');
fs.writeFileSync(path.join(outDir, 'case01_free.txt'), tierRes.free.customerReport, 'utf-8');
fs.writeFileSync(path.join(outDir, 'case01_standard.txt'), tierRes.standard.customerReport, 'utf-8');
fs.writeFileSync(path.join(outDir, 'case01_sal.txt'), tierRes.sal.customerReport, 'utf-8');
fs.writeFileSync(path.join(outDir, 'case01_premium.txt'), tierRes.premium.customerReport, 'utf-8');

console.log('CASE 01 data dumped successfully to ' + outDir);
