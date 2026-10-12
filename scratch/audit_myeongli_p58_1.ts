import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';
import { getSurroundingSolarTerms } from '../src/modules/calendar/solar-term-engine.js';
import { DaewoonEngine as CoreDaewoonEngine } from '../src/modules/saju-core/daewoon-engine.js';
import { HIDDEN_STEMS_DETAIL } from '../src/modules/saju-core/hidden-stems.js';
import { TenGodsEngine } from '../src/modules/saju-core/ten-gods.js';
import { STEM_INFO, BRANCH_INFO, HIDDEN_STEMS } from '../src/core/constants.js';

const calendarEng = new CalendarEngine();
const pillarEng = new PillarEngine();
const sajuCoreEng = new SajuCoreEngine();
const coreDwEng = new CoreDaewoonEngine();
const tenGodsEng = new TenGodsEngine();

const HANJA_MAP: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊', 기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳', 오: '午', 미: '未', 신_: '申', 유: '酉', 술: '戌', 해: '亥',
};
const toHanja = (stemOrBranch: string, isBranch = false) => {
  if (isBranch && stemOrBranch === '신') return '申';
  if (!isBranch && stemOrBranch === '신') return '辛';
  return HANJA_MAP[stemOrBranch] || stemOrBranch;
};

const cases = [
  { id: 'CASE_02', date: '1988-12-10', time: '14:00', gender: 'female' as const, trouble: '사업 부도 / 사업 위기' },
  { id: 'CASE_03', date: '1995-05-20', time: '18:30', gender: 'male' as const, trouble: '직장 이직 / 승진 갈등' },
  { id: 'CASE_04', date: '1982-04-05', time: '06:00', gender: 'male' as const, trouble: '투자 손실 / 재물 위기' },
  { id: 'CASE_05', date: '1986-08-15', time: '16:00', gender: 'male' as const, trouble: '수술 / 건강 위기' },
];

console.log('================================================================================');
console.log('Phase 58.1 — 원천 명리 독립 감사 (CASE 02 ~ CASE 05)');
console.log('================================================================================\n');

for (const c of cases) {
  console.log(`\n################################################################################`);
  console.log(`### ${c.id}: ${c.trouble}`);
  console.log(`### 입력: ${c.date} ${c.time} | 성별: ${c.gender}`);
  console.log(`################################################################################\n`);

  const [year, month, day] = c.date.split('-').map(Number);
  const [hour, minute] = c.time.split(':').map(Number);
  const birthKstMs = Date.UTC(year, month - 1, day, hour - 9, minute, 0);
  const birthUtc = new Date(birthKstMs);

  // 1. 만세력 & 절기 독립 검증
  const terms = getSurroundingSolarTerms(birthUtc);
  console.log(`[1. 만세력 & 절기 독립 검증]`);
  console.log(`  출생 시각(KST): ${c.date} ${c.time}`);
  console.log(`  직전 절(Major) : ${terms.previousMajorTerm?.termName} (${terms.previousMajorTerm?.appliedDateTimeKST})`);
  console.log(`  직후 절(Major) : ${terms.nextMajorTerm?.termName} (${terms.nextMajorTerm?.appliedDateTimeKST})`);
  console.log(`  직전 기/절(All) : ${terms.previousTerm?.termName} (${terms.previousTerm?.appliedDateTimeKST})`);
  console.log(`  직후 기/절(All) : ${terms.nextTerm?.termName} (${terms.nextTerm?.appliedDateTimeKST})`);

  // 순수 엔진 실행
  const calRes = calendarEng.execute({
    birth_date: c.date,
    birth_time: c.time,
    region: 'Seoul',
  });
  const pilRes = pillarEng.execute(calRes.data);
  const coreRes = sajuCoreEng.execute(pilRes.data);

  const pillars = pilRes.data.four_pillars;
  const fourPillarsText = `${pillars.year.stem}${pillars.year.branch} ${pillars.month.stem}${pillars.month.branch} ${pillars.day.stem}${pillars.day.branch} ${pillars.hour ? `${pillars.hour.stem}${pillars.hour.branch}` : ''}`;
  const dayMaster = pillars.day.stem;
  console.log(`  엔진 산출 4주   : ${fourPillarsText}`);
  console.log(`    년주: ${pillars.year.stem}${pillars.year.branch} (${toHanja(pillars.year.stem)}${toHanja(pillars.year.branch, true)})`);
  console.log(`    월주: ${pillars.month.stem}${pillars.month.branch} (${toHanja(pillars.month.stem)}${toHanja(pillars.month.branch, true)})`);
  console.log(`    일주: ${pillars.day.stem}${pillars.day.branch} (${toHanja(pillars.day.stem)}${toHanja(pillars.day.branch, true)})`);
  console.log(`    시주: ${pillars.hour?.stem}${pillars.hour?.branch} (${toHanja(pillars.hour?.stem || '')}${toHanja(pillars.hour?.branch || '', true)})`);
  console.log(`  일간           : ${dayMaster} (${toHanja(dayMaster)}) - ${STEM_INFO[dayMaster].element} / ${STEM_INFO[dayMaster].yinYang}`);

  // Dynamic Analysis
  const dynamic = SajuDynamicAnalyzer.analyze(fourPillarsText);

  // 2. 십신 독립 검증
  console.log(`\n[2. 십신 독립 검증]`);
  console.log(`  일간: ${dayMaster}`);
  const stems = [
    { pos: '년주 천간', stem: pillars.year.stem },
    { pos: '월주 천간', stem: pillars.month.stem },
    { pos: '일주 천간', stem: pillars.day.stem },
    { pos: '시주 천간', stem: pillars.hour?.stem || '?' },
  ];
  for (const s of stems) {
    const ts = s.stem !== '?' ? tenGodsEng.getTenGodForStem(dayMaster, s.stem as any) : '?';
    console.log(`    ${s.pos} [${s.stem}] -> ${ts} (음양: ${STEM_INFO[s.stem as any]?.yinYang}, 오행: ${STEM_INFO[s.stem as any]?.element})`);
  }

  const branches = [
    { pos: '년지', branch: pillars.year.branch },
    { pos: '월지', branch: pillars.month.branch },
    { pos: '일지', branch: pillars.day.branch },
    { pos: '시지', branch: pillars.hour?.branch || '?' },
  ];
  console.log(`  지지 본기 십신:`);
  for (const b of branches) {
    const mainStem = (HIDDEN_STEMS as any)[b.branch]?.main;
    const ts = mainStem ? tenGodsEng.getTenGodForStem(dayMaster, mainStem) : '?';
    console.log(`    ${b.pos} [${b.branch}] (본기 ${mainStem}) -> ${ts}`);
  }

  console.log(`  전체 지장간 십신:`);
  for (const b of branches) {
    const entries = HIDDEN_STEMS_DETAIL[b.branch as any] || [];
    const list = entries.map(e => {
      const ts = tenGodsEng.getTenGodForStem(dayMaster, e.stem);
      return `${e.type}:${e.stem}(${ts}, ${(e.ratio * 100).toFixed(0)}%)`;
    }).join(' | ');
    console.log(`    ${b.pos} [${b.branch}] -> ${list}`);
  }

  // 3. 격국 독립 검증
  console.log(`\n[3. 격국 독립 검증]`);
  const monthBranch = pillars.month.branch;
  const monthMainStem = HIDDEN_STEMS[monthBranch].main;
  const monthHidden = HIDDEN_STEMS_DETAIL[monthBranch];
  const monthMainElem = STEM_INFO[monthMainStem].element;
  const dayElem = STEM_INFO[dayMaster].element;
  const monthShipshin = tenGodsEng.getTenGodForStem(dayMaster, monthMainStem);

  const openStems = [pillars.year.stem, pillars.month.stem, pillars.hour?.stem].filter(Boolean);
  const isMainExposed = openStems.includes(monthMainStem);

  console.log(`  ① 월지: ${monthBranch}`);
  console.log(`  ② 월지 본기: ${monthMainStem}`);
  console.log(`  ③ 월지 지장간: ${monthHidden.map(h => `${h.type}=${h.stem}(${tenGodsEng.getTenGodForStem(dayMaster, h.stem)})`).join(', ')}`);
  console.log(`  ④ 본기 투출 여부: ${isMainExposed ? '투출됨 (' + monthMainStem + ')' : '미투출 (월령 자체의 본기 채택)'}`);
  console.log(`  ⑤ 일간과의 오행 관계: 일간=${dayElem} vs 본기=${monthMainElem}`);
  console.log(`  ⑥ 음양 관계: 일간=${STEM_INFO[dayMaster].yinYang} vs 본기=${STEM_INFO[monthMainStem].yinYang} (${STEM_INFO[dayMaster].yinYang === STEM_INFO[monthMainStem].yinYang ? '동일 음양' : '이음양이양'})`);
  console.log(`  ⑦ 격국 후보: 본기 십신=[${monthShipshin}] -> ${monthShipshin}격`);
  console.log(`  ⑧ 엔진 산출 최종 격국: [${dynamic.geokguk.name}]`);

  // 4. 강약 독립 검증
  console.log(`\n[4. 강약 독립 검증]`);
  const coreStrength = coreRes.data.day_master_strength;
  console.log(`  [SajuCore 엔진 강약]`);
  console.log(`    총점: ${coreStrength.totalStrengthScore.toFixed(2)} | 판정: ${coreStrength.classification}`);
  console.log(`    득령: ${coreStrength.isDeukRyeong} (${coreStrength.deukRyeongScore.toFixed(2)}점)`);
  console.log(`    득지: ${coreStrength.isDeukJi} (${coreStrength.deukJiScore.toFixed(2)}점)`);
  console.log(`    득세: ${coreStrength.isDeukSe} (${coreStrength.deukSeScore.toFixed(2)}점)`);
  console.log(`    통근 점수: ${coreRes.data.rootings.dayStem.rootingScore.toFixed(2)}점 | 통근 지지: ${coreRes.data.rootings.dayStem.rootedBranches.map(r => `${r.branch}(${r.rootType})`).join(', ') || '무통근'}`);
  
  console.log(`  [DynamicAnalyzer 엔진 강약]`);
  console.log(`    점수: ${dynamic.strength.score.toFixed(2)} | 판정: ${dynamic.strength.status}`);
  console.log(`    득령: ${dynamic.strength.deungryeong} (${dynamic.strength.deungryeongScore}점)`);
  console.log(`    득지: ${dynamic.strength.deungji} (${dynamic.strength.deungJiScore}점)`);
  console.log(`    득세: ${dynamic.strength.deungse} (${dynamic.strength.deungSeScore.toFixed(2)}점)`);

  // 5. 용신 독립 검증
  console.log(`\n[5. 용신 독립 검증]`);
  console.log(`  [억부 용신]: 용신=${dynamic.yongshin.eokbu.primary} | 희신=${dynamic.yongshin.eokbu.secondary}`);
  console.log(`    근거: ${dynamic.yongshin.eokbu.reason}`);
  console.log(`  [조후 용신]: 계절=${dynamic.yongshin.johu.season} | 용신=${dynamic.yongshin.johu.primary}`);
  console.log(`    근거: ${dynamic.yongshin.johu.reason}`);

  // 6. 대운 독립 검증
  console.log(`\n[6. 대운 독립 검증]`);
  const yearStem = pillars.year.stem;
  const isYangYear = STEM_INFO[yearStem].yinYang === '양';
  const isMale = c.gender === 'male';
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);

  const coreDaewoon = coreDwEng.calculateDaewoon({
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    birthHour: hour,
    birthMinute: minute,
    gender: c.gender,
    yearStem: yearStem as any,
    monthStem: pillars.month.stem as any,
    monthBranch: pillars.month.branch as any,
    currentDate: '2026-10-03',
  });

  const curAge = 2026 - year - (10 < month || (10 === month && 3 < day) ? 1 : 0);
  console.log(`  성별: ${c.gender === 'male' ? '남성' : '여성'} | 년간: ${yearStem} (${STEM_INFO[yearStem].yinYang})`);
  console.log(`  대운 방향: ${isForward ? '순행(Forward)' : '역행(Backward)'} (엔진 결과: ${coreDaewoon.direction})`);
  console.log(`  기준 절기: ${coreDaewoon.targetTermName} (${coreDaewoon.targetTermDateTimeKST})`);
  console.log(`  출생 시각 ~ 기준 절기 경과 일수: ${coreDaewoon.elapsedDays.toFixed(4)} 일 (${(coreDaewoon.elapsedDays * 24).toFixed(2)} 시간)`);
  console.log(`  대운수 환산식: ${coreDaewoon.elapsedDays.toFixed(4)} / 3 = ${(coreDaewoon.elapsedDays / 3).toFixed(4)} -> 만 ${coreDaewoon.daewoonNumber}세`);
  console.log(`  현재 나이 (2026-10-03 기준): 만 ${curAge}세`);
  console.log(`  현재 대운 번호: 제${coreDaewoon.currentDaewoon?.order}대운`);
  console.log(`  현재 대운: ${coreDaewoon.currentDaewoon?.ganji} (${coreDaewoon.currentDaewoon?.stem}${coreDaewoon.currentDaewoon?.branch}) (만 ${coreDaewoon.currentDaewoon?.startAge}세 ~ ${coreDaewoon.currentDaewoon?.endAge}세)`);
  console.log(`  전체 대운 흐름:`);
  for (const d of coreDaewoon.pillars.slice(0, 8)) {
    const isCurrent = d.order === coreDaewoon.currentDaewoon?.order;
    const tsStem = tenGodsEng.getTenGodForStem(dayMaster, d.stem);
    const mainJiStem = (HIDDEN_STEMS as any)[d.branch]?.main;
    const tsJi = mainJiStem ? tenGodsEng.getTenGodForStem(dayMaster, mainJiStem) : '?';
    console.log(`    ${isCurrent ? '▶ ' : '  '}제${d.order}대운: ${d.ganji} (${d.stem}${d.branch}) (만 ${d.startAge}세 ~ ${d.endAge}세) [십신: ${tsStem}/${tsJi}]`);
  }
}
