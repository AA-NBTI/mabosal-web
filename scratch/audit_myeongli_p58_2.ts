import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';
import { DaewoonEngine as CoreDaewoonEngine } from '../src/modules/saju-core/daewoon-engine.js';

const calendarEngine = new CalendarEngine();
const pillarEngine = new PillarEngine();
const daewoonEngine = new CoreDaewoonEngine();

interface CaseDef {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
}

const cases: CaseDef[] = [
  { id: 'CASE 01', name: '연애 결별', birthDate: '1992-03-15', birthTime: '08:30', gender: 'male' },
  { id: 'CASE 02', name: '사업 부도 / 위기', birthDate: '1988-12-10', birthTime: '14:00', gender: 'female' },
  { id: 'CASE 03', name: '직장 이직 / 승진 갈등', birthDate: '1995-05-20', birthTime: '18:30', gender: 'male' },
  { id: 'CASE 04', name: '투자 손실 / 재물 위기', birthDate: '1982-04-05', birthTime: '06:00', gender: 'male' },
  { id: 'CASE 05', name: '수술 / 건강 위기', birthDate: '1986-08-15', birthTime: '16:00', gender: 'male' },
];

for (const c of cases) {
  const cal = calendarEngine.execute({ birth_date: c.birthDate, birth_time: c.birthTime, region: 'Seoul' });
  const pil = pillarEngine.execute(cal.data);
  const p = pil.data.four_pillars;
  const pillarStr = `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour?.stem}${p.hour?.branch}`;
  const dyn = SajuDynamicAnalyzer.analyze(pillarStr);

  const [by, bm, bd] = c.birthDate.split('-').map(Number);
  const [bh, bmin] = c.birthTime.split(':').map(Number);

  const dw = daewoonEngine.calculateDaewoon({
    gender: c.gender,
    birthYear: by,
    birthMonth: bm,
    birthDay: bd,
    birthHour: bh,
    birthMinute: bmin,
    yearStem: p.year.stem,
    monthStem: p.month.stem,
    monthBranch: p.month.branch,
  });

  console.log(`=== [${c.id}] ${c.name} ===`);
  console.log(`원국: ${p.year.stem}${p.year.branch} / ${p.month.stem}${p.month.branch} / ${p.day.stem}${p.day.branch} / ${p.hour?.stem}${p.hour?.branch}`);
  console.log(`일간: ${p.day.stem} (${dyn.dayMaster.element}/${dyn.dayMaster.yinYang})`);
  console.log(`격국: [${dyn.geokguk.name}] (규칙 ID: ${dyn.geokguk.ruleId || 'GEOKGUK-V1'}, 근거: ${dyn.geokguk.basis})`);
  console.log(`강약: [${dyn.strength.status}] (규칙 ID: ${dyn.strength.ruleId || 'STRENGTH-V1'}, 점수: ${dyn.strength.score}점, 득령:${dyn.strength.deungryeong}, 득지:${dyn.strength.deungji}, 득세:${dyn.strength.deungse})`);
  console.log(`억부: 용신=${dyn.yongshin.eokbu.primary}, 희신=${dyn.yongshin.eokbu.secondary}, 기신=${dyn.yongshin.eokbu.tertiary} (규칙 ID: ${dyn.yongshin.eokbu.ruleId || 'EOKBU-V1'})`);
  console.log(`조후: 용신=${dyn.yongshin.johu.primary}, 희신=${dyn.yongshin.johu.secondary}, 기신=${dyn.yongshin.johu.tertiary} (규칙 ID: ${dyn.yongshin.johu.ruleId || 'JOHU-V1'})`);
  console.log(`대운: 대운수=${dw.daewoonNumber}, 순행/역행=${dw.direction}, 현재대운순서=${dw.currentDaewoonOrder}, 1대운=${dw.pillars[0].stem}${dw.pillars[0].branch}(${dw.pillars[0].startAge}세)`);
  console.log(`규칙버전: DAEWUN=${dw.ruleVersion || 'DAEWUN-V1'}`);
  console.log('');
}
