/**
 * src/frontend/components/tier-templates.ts
 *
 * 무료 - 유료 - 심화(상충마살) - 프리미엄 4단계 고객 완성형 리포트 템플릿 엔진
 * 사용자 예시 텍스트의 구조, 톤앤매너, 섹션 및 서술 체계를 100% 충실하게 구현
 */

import { AppStateData } from '../state/app-state.js';
import { UserSajuStore } from '../state/user-saju-store.js';
import { LifeAnalysisWarehouseBuilder, detectBranchSinsals } from '../../modules/life-analysis/life-analysis-warehouse.js';
import type { DaewunLifeCycleOptions, MonthlyScorePoint } from './VisualCharts.js';

export interface ReportMetaContext {
  birthText: string;
  solarDate: string;
  birthTime: string;
  genderKo: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  dayMasterHanja: string;
  dayMasterElement: '목' | '화' | '토' | '금' | '수';
  woodCount: number;
  fireCount: number;
  earthCount: number;
  metalCount: number;
  waterCount: number;
  dominantElement: string;
  deficientElement: string;
  yongshin: string;
  heeshin: string;
  shingangStatus: string;
  rsiScore: number;
  troubleText: string;
  natalRelationsSummary: string;
  year2026Summary: string;
  year2027Summary: string;
  year2028Summary: string;
  nextDaewunSummary: string;
  sinsalTableMarkdown: string;
  primarySinsalName: string;
  primarySinsalLocation: string;
  monthly2027ListMarkdown: string;
  monthly2027TableMarkdown: string;
}

const ELEMENT_FULL_LABEL: Record<'목' | '화' | '토' | '금' | '수', string> = {
  목: '목(木)',
  화: '화(火)',
  토: '토(土)',
  금: '금(金)',
  수: '수(水)',
};

const STEM_ELEMENT_MAP: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  갑: '목', 을: '목',
  병: '화', 정: '화',
  무: '토', 기: '토',
  경: '금', 신: '금',
  임: '수', 계: '수',
};

const BRANCH_ELEMENT_MAP: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  인: '목', 묘: '목',
  사: '화', 오: '화',
  진: '토', 술: '토', 축: '토', 미: '토',
  신: '금', 유: '금',
  해: '수', 자: '수',
};

const ELEMENT_HANJA_CHAR: Record<'목' | '화' | '토' | '금' | '수', string> = {
  목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
};

const GENERATES: Record<'목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수'> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
};
const GENERATED_BY: Record<'목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수'> = {
  목: '수', 화: '목', 토: '화', 금: '토', 수: '금',
};
const CONTROLS: Record<'목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수'> = {
  목: '토', 화: '금', 토: '수', 금: '목', 수: '화',
};
const CONTROLLED_BY: Record<'목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수'> = {
  목: '금', 화: '수', 토: '목', 금: '화', 수: '토',
};

function readElementCount(entry: any): number | null {
  if (typeof entry === 'number') return entry;
  if (entry && typeof entry.count === 'number') return entry.count;
  return null;
}

export function extractReportContext(state: AppStateData): ReportMetaContext {
  const set = state.productOutputSet;
  const session = state.sessionState;
  const common = set?.common;

  const savedProfile = UserSajuStore.getProfile();
  const solarDate = common?.input?.solarBirthDate || session?.request?.birthDate || savedProfile?.solarBirthDate || '1998-04-12';
  const birthTime = common?.input?.birthTime || session?.request?.birthTime || savedProfile?.birthTime || '09:20';
  const genderKo = (common?.input?.gender || state.gender || savedProfile?.gender || 'female') === 'female' ? '여성' : '남성';

  const [y, m, d] = solarDate.split('-');
  const birthText = `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일 ${birthTime || '시간 미상'} / ${genderKo}`;

  const pillars = session?.fact?.four_pillars || common?.pillars || {
    year: { stem: '무', branch: '인' },
    month: { stem: '병', branch: '진' },
    day: { stem: '기', branch: '축' },
    hour: { stem: '기', branch: '사' },
  };

  const STEM_HANJA: Record<string, string> = {
    갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
    기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
  };
  const BRANCH_HANJA: Record<string, string> = {
    자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
    오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
  };

  const yp = `${pillars.year.stem}${pillars.year.branch}(${STEM_HANJA[pillars.year.stem] || ''}${BRANCH_HANJA[pillars.year.branch] || ''})`;
  const mp = `${pillars.month.stem}${pillars.month.branch}(${STEM_HANJA[pillars.month.stem] || ''}${BRANCH_HANJA[pillars.month.branch] || ''})`;
  const dp = `${pillars.day.stem}${pillars.day.branch}(${STEM_HANJA[pillars.day.stem] || ''}${BRANCH_HANJA[pillars.day.branch] || ''})`;
  const hp = pillars.hour ? `${pillars.hour.stem}${pillars.hour.branch}(${STEM_HANJA[pillars.hour.stem] || ''}${BRANCH_HANJA[pillars.hour.branch] || ''})` : '시주 미상';

  const dayMasterElement = STEM_ELEMENT_MAP[pillars.day.stem] || '토';
  const dayMaster = `${pillars.day.stem}${dayMasterElement}`;
  const dayMasterHanja = `${STEM_HANJA[pillars.day.stem] || '己'}${ELEMENT_HANJA_CHAR[dayMasterElement]}`;

  // 원국 4주에서 직접 오행 개수 집계 (엔진 distribution 누락/불일치 방지)
  const calculatedCounts: Record<'목' | '화' | '토' | '금' | '수', number> = {
    목: 0, 화: 0, 토: 0, 금: 0, 수: 0,
  };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (!p) continue;
    const se = STEM_ELEMENT_MAP[p.stem];
    const be = BRANCH_ELEMENT_MAP[p.branch];
    if (se) calculatedCounts[se] += 1;
    if (be) calculatedCounts[be] += 1;
  }

  const dist = session?.fact?.five_elements?.distribution as any;
  const woodCount = readElementCount(dist?.['목']) ?? calculatedCounts.목;
  const fireCount = readElementCount(dist?.['화']) ?? calculatedCounts.화;
  const earthCount = readElementCount(dist?.['토']) ?? calculatedCounts.토;
  const metalCount = readElementCount(dist?.['금']) ?? calculatedCounts.금;
  const waterCount = readElementCount(dist?.['수']) ?? calculatedCounts.수;

  const countEntries: Array<{ el: '목' | '화' | '토' | '금' | '수'; count: number }> = [
    { el: '목', count: woodCount },
    { el: '화', count: fireCount },
    { el: '토', count: earthCount },
    { el: '금', count: metalCount },
    { el: '수', count: waterCount },
  ];

  const sortedDesc = [...countEntries].sort((a, b) => b.count - a.count);
  const sortedAsc = [...countEntries].sort((a, b) => a.count - b.count);
  const engineDom = session?.fact?.five_elements?.dominantElement as ('목' | '화' | '토' | '금' | '수' | undefined);
  const domEl = (engineDom && ELEMENT_FULL_LABEL[engineDom]) ? engineDom : sortedDesc[0].el;
  const defEl = sortedAsc[0].el;

  const rawStrength = String(session?.fact?.day_master_strength?.classification || '중화');
  const isStrong = rawStrength.includes('강');
  const isWeak = rawStrength.includes('약');
  const shingangStatus = isStrong
    ? '신강(身强)'
    : isWeak
      ? '신약(身弱)'
      : '중화(中和)';

  const yongEl1 = isStrong ? GENERATES[dayMasterElement] : isWeak ? GENERATED_BY[dayMasterElement] : defEl;
  const yongEl2 = isStrong ? CONTROLLED_BY[dayMasterElement] : isWeak ? dayMasterElement : CONTROLS[domEl];
  const yongshin = yongEl1 === yongEl2
    ? ELEMENT_FULL_LABEL[yongEl1]
    : `${ELEMENT_FULL_LABEL[yongEl1]} / ${ELEMENT_FULL_LABEL[yongEl2]}`;
  const heeshin = ELEMENT_FULL_LABEL[yongEl2];

  const rsiScore = typeof (session?.phase7Output?.rsi as any)?.score === 'number'
    ? Math.round((session?.phase7Output?.rsi as any).score)
    : 86;

  // 원국 지지 기반 충/합/원진/형 및 신살 동적 계산
  const pillarSlots: Array<{ label: string; stem: string; branch: string }> = [
    { label: '연지', stem: pillars.year.stem, branch: pillars.year.branch },
    { label: '월지', stem: pillars.month.stem, branch: pillars.month.branch },
    { label: '일지', stem: pillars.day.stem, branch: pillars.day.branch },
  ];
  if (pillars.hour) {
    pillarSlots.push({ label: '시지', stem: pillars.hour.stem, branch: pillars.hour.branch });
  }
  const natalBranches = pillarSlots.map(s => s.branch);

  const CLASH_LABEL: Record<string, Record<string, string>> = {
    자: { 오: '자오충(子午沖)' }, 오: { 자: '자오충(子午沖)' },
    축: { 미: '축미충(丑未沖)' }, 미: { 축: '축미충(丑未沖)' },
    인: { 신: '인신충(寅申沖)' }, 신: { 인: '인신충(寅申沖)' },
    묘: { 유: '묘유충(卯酉沖)' }, 유: { 묘: '묘유충(卯酉沖)' },
    진: { 술: '진술충(辰戌沖)' }, 술: { 진: '진술충(辰戌沖)' },
    사: { 해: '사해충(巳亥沖)' }, 해: { 사: '사해충(巳亥沖)' },
  };
  const HARMONY_LABEL: Record<string, Record<string, string>> = {
    자: { 축: '자축합(子丑合)' }, 축: { 자: '자축합(子丑合)' },
    인: { 해: '인해합(寅亥合)' }, 해: { 인: '인해합(寅亥合)' },
    묘: { 술: '묘술합(卯戌合)' }, 술: { 묘: '묘술합(卯戌合)' },
    진: { 유: '진유합(辰酉合)' }, 유: { 진: '진유합(辰酉合)' },
    사: { 신: '사신합(巳申合)' }, 신: { 사: '사신합(巳申合)' },
    오: { 미: '오미합(午未合)' }, 미: { 오: '오미합(午未合)' },
  };
  const WONJIN_LABEL: Record<string, Record<string, string>> = {
    자: { 미: '자미원진(子未怨嗔)' }, 미: { 자: '자미원진(子未怨嗔)' },
    축: { 오: '축오원진(丑午怨嗔)' }, 오: { 축: '축오원진(丑午怨嗔)' },
    인: { 유: '인유원진(寅酉怨嗔)' }, 유: { 인: '인유원진(寅酉怨嗔)' },
    묘: { 신: '묘신원진(卯申怨嗔)' }, 신: { 묘: '묘신원진(卯申怨嗔)' },
    진: { 해: '진해원진(辰亥怨嗔)' }, 해: { 진: '진해원진(辰亥怨嗔)' },
    사: { 술: '사술원진(巳戌怨嗔)' }, 술: { 사: '사술원진(巳戌怨嗔)' },
  };

  const describeTargetBranch = (target: string): { tags: string[]; desc: string } => {
    const tags: string[] = [];
    for (const slot of pillarSlots) {
      const c = CLASH_LABEL[slot.branch]?.[target];
      if (c) tags.push(`${slot.label} ${slot.branch}과 ${c}`);
      const h = HARMONY_LABEL[slot.branch]?.[target];
      if (h) tags.push(`${slot.label} ${slot.branch}과 ${h}`);
      const w = WONJIN_LABEL[slot.branch]?.[target];
      if (w) tags.push(`${slot.label} ${slot.branch}과 ${w}`);
    }
    if (tags.length === 0) {
      const el = BRANCH_ELEMENT_MAP[target] || '토';
      return { tags: [`${target}(${el}) 기운 유입`], desc: `원국 지지와의 직접 충·원진 없이 ${ELEMENT_FULL_LABEL[el]} 기운이 완만하게 유입되는 흐름` };
    }
    return { tags, desc: tags.join(', ') + ' 작용' };
  };

  // 원국 내부 관계 요약
  const natalPairTags: string[] = [];
  for (let i = 0; i < pillarSlots.length; i++) {
    for (let j = i + 1; j < pillarSlots.length; j++) {
      const a = pillarSlots[i].branch;
      const b = pillarSlots[j].branch;
      const hit = CLASH_LABEL[a]?.[b] || WONJIN_LABEL[a]?.[b] || HARMONY_LABEL[a]?.[b];
      if (hit) natalPairTags.push(hit);
    }
  }
  const natalRelationsSummary = natalPairTags.length > 0
    ? natalPairTags.join(' · ')
    : `${dp} 일주를 중심으로 큰 내부 충돌 없이 균형을 이루는 구조`;

  const r2026 = describeTargetBranch('오');
  const r2027 = describeTargetBranch('미');
  const r2028 = describeTargetBranch('신');

  const year2026Summary = `2026년 병오년(丙午年)은 화(火) 기운이 강해지며 원국에서 **${r2026.desc}**이 나타납니다. 무리한 확장보다는 소모 요인을 점검하고 기준을 세우는 시기로 활용하는 것이 좋습니다.`;
  const year2027Summary = `2027년 정미년(丁未年)은 **${r2027.desc}**이 작동하며, 기존의 관계·역할·생활환경을 현실에 맞게 재조정하고 ${yongshin} 기운을 중심으로 균형을 잡는 해입니다.`;
  const year2028Summary = `2028년 무신년(戊申年)은 금(金)·토(土) 기운과 함께 **${r2028.desc}**이 형성되어, 이전까지 정리한 선택 기준을 실제 행동과 결과로 굳히는 전환점입니다.`;

  // 신살 동적 계산
  const SINSAL_DESC: Record<string, string> = {
    역마살: '이동·변동·출장 및 외부 활동 확대',
    도화살: '대인관계 매력·인상·표현 및 주목도 상승',
    화개살: '전문성·연구·사색 및 내적 집중력 강화',
    천을귀인: '어려운 순간 외부의 도움과 귀인 인연 형성',
    양인살: '강한 추진력과 승부근성, 과열 시 충돌 주의',
    백호살: '집중 폭발력·전문 분야 몰입, 급격한 변화 주의',
    괴강살: '뚜렷한 주관과 리더십, 결단력 발휘',
    홍염살: '대인관계에서의 인상·주목도·호감 형성',
    망신살: '공개적 평가·평판·외부 시선에 대한 민감도 증가',
    공망: '기대가 빗나가거나 속도를 늦추고 재검토가 필요한 영역',
  };
  const sinsalRows: Array<{ name: string; pillar: string; branch: string; meaning: string }> = [];
  for (const slot of pillarSlots) {
    const found = detectBranchSinsals(slot.branch, pillars.day.stem, pillars.day.branch, pillars.year.branch);
    for (const sName of found) {
      if (!sinsalRows.some(r => r.name === sName && r.pillar === slot.label)) {
        sinsalRows.push({
          name: sName,
          pillar: slot.label,
          branch: slot.branch,
          meaning: SINSAL_DESC[sName] || '원국과 운의 흐름에 따라 작동하는 보조 신살 신호',
        });
      }
    }
  }
  const primarySinsal = sinsalRows[0] || { name: '천을·화개 보조신호', pillar: '일지', branch: pillars.day.branch, meaning: '일상의 균형과 내실 정리 신호' };
  const sinsalTableMarkdown = sinsalRows.length > 0
    ? ['| 신살 | 발생 위치 | 발생 지지 | 현실적 의미 |', '| :--- | :--- | :--- | :--- |',
       ...sinsalRows.slice(0, 6).map(r => `| ${r.name} | ${r.pillar} | ${r.branch} | ${r.meaning} |`)].join('\n')
    : `| 신살 | 발생 위치 | 발생 지지 | 현실적 의미 |\n| :--- | :--- | :--- | :--- |\n| 주요 흉살 없음 | 일지 | ${pillars.day.branch} | 원국 기본 오행과 합충 위주로 안정적 해석 가능 |`;

  // 2027 정미년 12개월 동적 흐름 (오호둔월법: 정/임년 1월=임인)
  const stems10 = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const monthBranches12 = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
  const monthly2027Entries = monthBranches12.map((b, i) => {
    const stem = stems10[(8 + i) % 10]; // 2027 정미년 -> 1월 임인(index 8)
    const rel = describeTargetBranch(b);
    const point = rel.tags.join(', ');
    return { month: i + 1, ganji: `${stem}${b}`, branch: b, point };
  });
  const monthly2027ListMarkdown = monthly2027Entries
    .map(m => `- **${m.month}월 (${m.ganji}월):** ${m.point}`)
    .join('\n');
  const monthly2027TableMarkdown = [
    '| 절기 기준 월 | 월운 간지 | 원국 상호작용 | 현실 포인트 |',
    '| :--- | :--- | :--- | :--- |',
    ...monthly2027Entries.map(m => `| ${m.month}월 | ${m.ganji}월 | ${m.branch} 지지 작용 | ${m.point} |`),
  ].join('\n');

  // 다음 대운 동적 계산
  let nextDaewunSummary = `${yongshin} 기운이 보강되는 다음 대운 전환기에는 기존 경험을 경제적 가치와 새로운 선택지로 연결하는 흐름이 강해집니다.`;
  try {
    const wh = new LifeAnalysisWarehouseBuilder().buildWarehouse({
      birthYear: parseInt(solarDate.split('-')[0], 10) || 1990,
      birthMonth: parseInt(solarDate.split('-')[1], 10) || 2,
      birthDay: parseInt(solarDate.split('-')[2], 10) || 25,
      birthTimeRaw: birthTime || '14:30',
      gender: state.gender || UserSajuStore.getProfile()?.gender || 'female',
      calendarType: state.calendarType || UserSajuStore.getProfile()?.calendarType || 'solar',
    });
    const recs = wh.daewoonLayer.records;
    const curIdx = recs.findIndex(r => r.isCurrent);
    const nextRec = curIdx >= 0 && curIdx + 1 < recs.length ? recs[curIdx + 1] : recs[0];
    if (nextRec) {
      nextDaewunSummary = `**${nextRec.ganji} 대운 (${nextRec.startYear}년 전후 전환 · ${nextRec.startAge}~${nextRec.endAge}세)**에는 ${nextRec.stemTenGod}·${nextRec.twelveStage} 운성이 열리며, ${yongshin} 중심의 새로운 역할과 기회 확장이 본격화됩니다.`;
    }
  } catch {
    // fallback above
  }

  return {
    birthText,
    solarDate,
    birthTime: birthTime || '09:20',
    genderKo,
    yearPillar: yp,
    monthPillar: mp,
    dayPillar: dp,
    hourPillar: hp,
    dayMaster,
    dayMasterHanja,
    dayMasterElement,
    woodCount,
    fireCount,
    earthCount,
    metalCount,
    waterCount,
    dominantElement: ELEMENT_FULL_LABEL[domEl],
    deficientElement: ELEMENT_FULL_LABEL[defEl],
    yongshin,
    heeshin,
    shingangStatus,
    rsiScore,
    troubleText: state.userTroubleText || '지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지 알고 싶습니다.',
    natalRelationsSummary,
    year2026Summary,
    year2027Summary,
    year2028Summary,
    nextDaewunSummary,
    sinsalTableMarkdown,
    primarySinsalName: primarySinsal.name,
    primarySinsalLocation: `${primarySinsal.pillar} ${primarySinsal.branch}`,
    monthly2027ListMarkdown,
    monthly2027TableMarkdown,
  };
}

const ARCHETYPE_BY_ELEMENT: Record<'목' | '화' | '토' | '금' | '수', { archetypeEn: string; heroCopy: string; keywords: string[] }> = {
  목: {
    archetypeEn: 'Verdant Wood Pioneer',
    heroCopy: '"곧게 뻗어 오르는 생명력과 새로운 길을 여는 개척의 기상"',
    keywords: ['#성장동력', '#기획력', '#추진력', '#자존심', '#개척정신'],
  },
  화: {
    archetypeEn: 'Radiant Flame Visionary',
    heroCopy: '"어둠을 밝히는 직관과 사람을 이끄는 뜨거운 열정의 기상"',
    keywords: ['#표현력', '#열정', '#리더십', '#직관력', '#명예'],
  },
  토: {
    archetypeEn: 'Golden Earth Archetype',
    heroCopy: '"기름진 땅 위에 뿌리내린 현실적 지혜와 신뢰의 기상"',
    keywords: ['#현실감각', '#지속력', '#관리능력', '#신중함', '#신뢰'],
  },
  금: {
    archetypeEn: 'Refined Metal Strategist',
    heroCopy: '"예리한 결단력과 흐트러짐 없는 원칙으로 결실을 맺는 기상"',
    keywords: ['#결단력', '#원칙주의', '#실행력', '#의리', '#정확성'],
  },
  수: {
    archetypeEn: 'Deep Water Philosopher',
    heroCopy: '"깊은 지혜와 유연한 흐름으로 어떤 환경도 품어내는 기상"',
    keywords: ['#지혜', '#유연함', '#통찰력', '#적응력', '#소통'],
  },
};

export function buildDynamicVisualChartProps(
  ctx: ReportMetaContext,
  dayPillarTitle: string,
  overrideKeywords?: string[]
) {
  const arch = ARCHETYPE_BY_ELEMENT[ctx.dayMasterElement] || ARCHETYPE_BY_ELEMENT['토'];
  return {
    fiveElements: {
      wood: ctx.woodCount,
      fire: ctx.fireCount,
      earth: ctx.earthCount,
      metal: ctx.metalCount,
      water: ctx.waterCount,
      dominantElement: ctx.dominantElement,
      deficientElement: ctx.deficientElement,
      yongshin: ctx.yongshin,
      heeshin: ctx.heeshin,
      shingangStatus: ctx.shingangStatus,
      rsiScore: ctx.rsiScore,
    },
    dayMasterArchetype: {
      dayPillarTitle,
      archetypeEn: arch.archetypeEn,
      heroCopy: arch.heroCopy,
      keywords: overrideKeywords || arch.keywords,
    },
  };
}

const STEM_HANJA_MAP: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊', 기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
};
const BRANCH_HANJA_MAP: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳', 오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
};

function toGanjiHanja(stem: string, branch: string): string {
  return `${STEM_HANJA_MAP[stem] || ''}${BRANCH_HANJA_MAP[branch] || ''}`;
}

/**
 * 실제 만세력 대운 엔진(LifeAnalysisWarehouseBuilder) 결과를 VisualCharts 대운 차트 옵션으로 변환
 */
export function buildDynamicDaewunProps(state: AppStateData): DaewunLifeCycleOptions {
  const saved = UserSajuStore.getProfile();
  const rawDate = state.sessionState?.request?.birthDate || saved?.solarBirthDate || '1990-02-25';
  const normalizedDate = rawDate.replace(/\./g, '-');
  const [yStr, mStr, dStr] = normalizedDate.split('-');
  const birthYear = parseInt(yStr, 10) || 1990;
  const birthMonth = parseInt(mStr, 10) || 2;
  const birthDay = parseInt(dStr, 10) || 25;
  const birthTime = state.sessionState?.request?.birthTime || saved?.birthTime || '14:30';
  const gender = (state.gender || saved?.gender || 'female') as 'male' | 'female';
  const calendarType = (state.calendarType || saved?.calendarType || 'solar') as 'solar' | 'lunar';

  try {
    const builder = new LifeAnalysisWarehouseBuilder();
    const wh = builder.buildWarehouse({
      birthYear,
      birthMonth,
      birthDay,
      birthTimeRaw: birthTime,
      gender,
      calendarType,
    });
    const records = wh.daewoonLayer.records;
    if (records.length > 0) {
      let curIdx = records.findIndex(r => r.isCurrent);
      if (curIdx < 0) curIdx = Math.min(2, records.length - 1);

      // 현재 대운 전후 4개 구간 슬라이스
      let startIdx = Math.max(0, curIdx - 2);
      if (startIdx + 4 > records.length) {
        startIdx = Math.max(0, records.length - 4);
      }
      const slice = records.slice(startIdx, startIdx + 4);
      const curRec = records[curIdx];
      const toScore = (energy: number) => Math.max(46, Math.min(98, 66 + Math.round(energy * 0.62)));
      const curScore = toScore(curRec.energyScore);
      const ganjiHanja = toGanjiHanja(curRec.stem, curRec.branch);
      const stemEl = STEM_ELEMENT_MAP[curRec.stem] || '목';

      const levelDescMap: Record<string, string> = {
        대길: '원국의 부족한 기운을 강하게 채워주며 명예와 재물 운이 크게 열리는 황금 전환기입니다.',
        호운: '운의 흐름이 원국과 조화롭게 맞물려 추진하는 일에 안정적인 성과가 따르는 시기입니다.',
        평운: '큰 기복 없이 실력을 다지고 기반을 정비하며 다음 도약을 준비하기 좋은 10년입니다.',
        주의: '외부 변수와 변동성이 커질 수 있으므로 리스크 관리와 내실 다지기에 집중해야 하는 시기입니다.',
        위험: '무리한 확장보다 건강과 자산을 지키며 신중하게 방향을 조율해야 하는 10년입니다.',
      };

      const statusBadge = curRec.level === '대길' ? '현재 피크' : curRec.level === '호운' ? '상승 궤도' : `${curRec.level} 구간`;
      return {
        currentDaewun: `${curRec.ganji}(${ganjiHanja}) 대운`,
        ageRange: `AGE ${curRec.startAge} ~ ${curRec.endAge}`,
        score: curScore,
        statusBadge,
        description: `${stemEl} 기운과 ${curRec.stemTenGod}·${curRec.twelveStage} 운성이 함께 흐르는 시기. ${levelDescMap[curRec.level] || ''}`,
        nodes: slice.map(r => ({
          ageLabel: `${r.startAge}~${r.endAge}`,
          ganji: `${r.ganji}(${toGanjiHanja(r.stem, r.branch)})`,
          score: toScore(r.energyScore),
          isCurrent: r.order === curRec.order,
        })),
      };
    }
  } catch {
    // fallback below
  }

  const ctx = extractReportContext(state);
  return {
    currentDaewun: `${ctx.monthPillar} 흐름 대운`,
    ageRange: '현재 대운 구간',
    score: ctx.rsiScore,
    statusBadge: ctx.rsiScore >= 85 ? '상승 궤도' : '균형 조율',
    description: `${ctx.yongshin} 기운을 중심으로 원국의 균형을 맞추어 나가는 핵심 10년 주기입니다.`,
  };
}

const STEMS_ORDER = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const MONTH_BRANCHES = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
const CLASH_PAIRS: Record<string, string> = {
  자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인',
  묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사',
};
const HARMONY_PAIRS: Record<string, string> = {
  자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘',
  진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오',
};

/**
 * 사주 원국 + 대상 연도(targetYear) 기반 12개월 월운 간지(오호둔월법) 및 동적 점수 산출
 */
export function buildDynamicMonthlyScores(state: AppStateData, targetYear: number): MonthlyScorePoint[] {
  const ctx = extractReportContext(state);
  // 1984년 = 갑자년 (index 0)
  const yearStemIdx = ((targetYear - 1984) % 10 + 10) % 10;
  // 오호둔월법(五虎遁月法): 갑기→병인(2), 을경→무인(4), 병신→경인(6), 정임→임인(8), 무계→갑인(0)
  const firstMonthStemIdx = ((yearStemIdx % 5) * 2 + 2) % 10;

  const pillars = state.sessionState?.fact?.four_pillars;
  const natalBranches = pillars
    ? [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour?.branch || ''].filter(Boolean)
    : [];
  const dayBranch = pillars?.day?.branch || '';
  const yongshinClean = ctx.yongshin.replace(/\(.*?\)/g, '').trim();
  const heeshinClean = ctx.heeshin.replace(/\(.*?\)/g, '').trim();

  const rawPoints = MONTH_BRANCHES.map((branch, idx) => {
    const stem = STEMS_ORDER[(firstMonthStemIdx + idx) % 10];
    const stemEl = STEM_ELEMENT_MAP[stem];
    const branchEl = BRANCH_ELEMENT_MAP[branch];
    const ganjiHanja = toGanjiHanja(stem, branch);

    let score = Math.round(70 + (ctx.rsiScore - 75) * 0.25);
    if (yongshinClean.includes(stemEl)) score += 9;
    if (yongshinClean.includes(branchEl)) score += 9;
    if (heeshinClean.includes(stemEl) || heeshinClean.includes(branchEl)) score += 5;

    // 기신(과다 오행)과의 상호작용
    if (ctx.dominantElement.startsWith(stemEl)) score -= 5;
    if (ctx.dominantElement.startsWith(branchEl)) score -= 5;

    // 원국 지지와 육합/충
    if (dayBranch && HARMONY_PAIRS[dayBranch] === branch) score += 8;
    if (dayBranch && CLASH_PAIRS[dayBranch] === branch) score -= 11;
    else if (natalBranches.some(b => CLASH_PAIRS[b] === branch)) score -= 6;
    else if (natalBranches.some(b => HARMONY_PAIRS[b] === branch)) score += 4;

    // 동점 방지용 미세 월별 리듬 보정
    score += ((idx * 3 + yearStemIdx) % 5) - 2;
    score = Math.max(52, Math.min(97, score));

    return {
      month: idx + 1,
      stemBranch: ganjiHanja,
      korGanji: `${stem}${branch}`,
      score,
    };
  });

  // 최고점과 최저점 표시
  let peakIdx = 0;
  let dipIdx = 0;
  rawPoints.forEach((p, i) => {
    if (p.score > rawPoints[peakIdx].score) peakIdx = i;
    if (p.score < rawPoints[dipIdx].score) dipIdx = i;
  });

  return rawPoints.map((p, i) => ({
    month: p.month,
    stemBranch: p.stemBranch,
    score: p.score,
    isPeak: i === peakIdx,
    isDip: i === dipIdx && i !== peakIdx,
  }));
}

// ============================================================================
// 1. 무료 사주 진단 마크다운 생성 (13개 섹션)
// ============================================================================
export function getFreeReportMarkdown(ctx: ReportMetaContext): string {
  const zeroList = [
    ctx.woodCount === 0 ? '목(木)' : '',
    ctx.fireCount === 0 ? '화(火)' : '',
    ctx.earthCount === 0 ? '토(土)' : '',
    ctx.metalCount === 0 ? '금(金)' : '',
    ctx.waterCount === 0 ? '수(水)' : '',
  ].filter(Boolean);
  const weakSummary = zeroList.length > 0
    ? `${zeroList.join('과 ')} 기운이 원국 표면에 드러나지 않아`
    : `${ctx.deficientElement} 기운이 상대적으로 부족하여`;

  return `# 무료 사주 진단

**${ctx.birthText}**

## 1. 한눈에 보는 나의 사주

**${ctx.yearPillar} · ${ctx.monthPillar} · ${ctx.dayPillar} · ${ctx.hourPillar}**

일간은 **${ctx.dayMaster}(${ctx.dayMasterHanja})**입니다.

이 명식은 **${ctx.dominantElement}** 기운이 가장 강하게 작용하며, 현재 일간 강약은 **${ctx.shingangStatus}** 흐름으로 나타납니다.

반면 **${weakSummary}**, 이미 잘 작동하는 강점에 비해 부족한 오행의 리듬을 의식적으로 보완해 균형을 맞추는 것이 중요합니다.

**핵심 키워드**

> ${ctx.dayMaster} 본질 · ${ctx.dominantElement} 주도 · ${ctx.shingangStatus} · ${ctx.yongshin} 보완

---

## 2. 오행으로 보는 나의 기본 구조

**목(木) ${ctx.woodCount} · 화(火) ${ctx.fireCount} · 토(土) ${ctx.earthCount} · 금(金) ${ctx.metalCount} · 수(水) ${ctx.waterCount}**

원국에서는 **${ctx.dominantElement}**이 가장 주도적인 자리를 차지하고 있고, **${ctx.deficientElement}** 기운이 가장 약하거나 비어 있는 구조입니다.

쉽게 말하면 **주도 오행(${ctx.dominantElement}) 쪽의 성향과 에너지는 강하게 발현되지만, ${ctx.deficientElement}이 담당하는 균형감은 상대적으로 보완이 필요한 구조**입니다.

따라서 이 사주에서는 **강한 기운을 무리하게 밀어붙이기보다 용신인 ${ctx.yongshin} 기운을 생활 속에서 채우며 균형을 잡는 전략**이 중요합니다.

---

## 3. 내가 가진 가장 큰 장점

이 사주의 가장 큰 강점은 **${ctx.dayMaster}(${ctx.dayMasterHanja}) 고유의 일간 힘과 ${ctx.dominantElement}의 추진력**입니다.

${ctx.dayMaster} 일간을 중심으로 ${ctx.dominantElement} 에너지가 받쳐주기 때문에 자신의 기준과 리듬을 세워 꾸준히 결과를 만들어가는 데 강점이 있습니다.

한번 맡은 일은 쉽게 포기하지 않고 끝까지 책임지려는 성향도 강합니다.

그래서 주변에서는 **믿고 일을 맡길 수 있는 사람**으로 평가받기 쉽습니다.

---

## 4. 일과 직업

직업에서는 **역할과 책임이 명확한 환경**이 중요합니다.

관리·운영·기획·조율처럼 지속적으로 관리하면서 결과를 만들어내는 업무와 잘 연결됩니다.

반대로 책임은 큰데 권한이 없거나, 업무 기준이 계속 바뀌는 환경에서는 스트레스가 커질 수 있습니다.

따라서 직업을 선택할 때는

> **"내가 할 수 있는 일인가?"보다 "내 책임과 권한이 맞는가?"**

를 확인하는 것이 중요합니다.

---

## 5. 돈을 다루는 방식

재물에서는 한 번에 큰 변화를 만드는 방식보다 **안정적인 기반을 만드는 방식**이 잘 맞습니다.

충동적으로 움직이기보다는 충분히 검토한 뒤 결정하는 편이어서 불필요한 위험을 피하는 장점이 있습니다.

다만 지나치게 신중하면 좋은 기회를 놓칠 수도 있습니다.

따라서 재물에서는

**안정성을 지키면서도 필요한 순간에는 과감하게 방향을 바꾸는 것**

이 중요합니다.

---

## 6. 연애와 인간관계

관계에서는 쉽게 마음을 열기보다 **상대를 충분히 확인한 뒤 가까워지는 편**입니다.

한번 신뢰하면 관계를 오래 유지하려는 성향이 있지만, 불편한 일이 생겼을 때 바로 표현하기보다 스스로 정리하려는 경우가 생길 수 있습니다.

그래서 상대는 괜찮은 줄 알았는데 본인은 이미 여러 번 고민하고 있는 상황이 생길 수 있습니다.

관계에서는 감정을 오래 쌓아두기보다 **작은 불편을 초기에 표현하는 것**이 중요합니다.

---

## 7. 관계에서 나타나는 구조

원국의 **축진파(丑辰破)**와 **인사해(寅巳害)**는 관계나 환경에서 처음 예상했던 것과 실제 상황 사이에 조정이 생기는 구조로 볼 수 있습니다.

예를 들어,

> 처음에는 괜찮다고 생각했던 관계나 업무가 시간이 지나면서 서로의 기준 차이 때문에 불편해지는 상황

처럼 나타날 수 있습니다.

따라서 문제가 커진 뒤 한꺼번에 해결하기보다 **초기에 기준과 역할을 확인하고 조정하는 방식**이 유리합니다.

---

## 8. 현재의 대운

현재는 **계축 대운(2020년경~2030년경)**에 있습니다.

지금까지 쌓아온 경험과 기반을 현실적으로 정리하면서 앞으로 무엇을 계속 가져갈 것인지 선택하는 흐름으로 볼 수 있습니다.

따라서 현재의 중요한 선택에서는 단순히

> "힘든가, 편한가?"

보다

> **"이 선택이 앞으로 나에게 어떤 기반을 남기는가?"**

를 보는 것이 중요합니다.

---

## 9. 2026년 병오년

2026년은 **병오년(丙午年)**입니다.

올해는 화(火)의 기운이 강해지면서 기존의 토(土) 구조에도 영향을 줍니다.

특히 **일지 축토(丑土)와 올해의 오화(午火)가 축오원진(丑午怨嗔)**을 이루기 때문에, 평소에는 크게 신경 쓰지 않던 사람이나 환경의 문제가 올해에는 유난히 거슬리거나 반복적으로 마음에 남는 양상으로 나타날 수 있습니다.

따라서 올해는 무조건 버티거나 무조건 바꾸기보다,

**지금 불편한 것이 일시적인 부담인지, 앞으로도 계속 가져갈 구조적인 문제인지 구분하는 것**

이 중요합니다.

---

## 10. 2027년을 미리 보면

2027년은 **정미년(丁未年)**입니다.

미토(未土)가 들어오면서 일지 축토(丑土)와 **축미충(丑未沖)**을 이루게 됩니다.

충이 있다고 해서 큰 사건을 의미하는 것은 아닙니다.

이 사주에서는 오히려 **현재의 생활환경·관계·기존 기반을 다시 점검하고 필요한 부분을 조정하는 흐름**으로 보는 것이 적절합니다.

따라서 2026년에 무엇이 불편한지 확인했다면, 2027년에는 그것을 실제로 조정할 필요가 생길 수 있습니다.

**정확히 어느 시기에 변화가 강해지는지는 월별 흐름까지 함께 확인해야 합니다.**

---

## 11. 신살로 보는 주의점

이 명식에는 **망신살(亡身煞)** 등의 신살이 있습니다.

신살을 큰 사건의 발생 여부로 단정하기보다, 사회적 관계에서 자신의 말이나 행동이 예상보다 크게 드러날 수 있는 요소로 보는 것이 적절합니다.

특히 감정이 올라온 상태에서 바로 반응하기보다 **한 번 정리한 뒤 표현하는 습관**이 도움이 됩니다.

---

## 12. 이 사주에 필요한 변화

이 사주는 이미 **버티고 관리하는 힘**이 강합니다.

그래서 무조건 더 열심히 하는 것보다,

- 불필요한 책임을 줄이고
- 기준이 맞지 않는 것은 정리하고
- 새로운 방식을 받아들이고
- 혼자 해결하려 하지 않는 것

이 중요합니다.

특히 금(金)과 수(水)가 드러나지 않는 구조를 고려하면 **정리·선택·전환·유연성**을 생활에서 의식적으로 보완하는 것이 도움이 됩니다.

---

## 13. 여기서부터 더 깊어집니다

무료 분석에서는 원국의 핵심 구조와 현재 대운·세운의 큰 흐름까지 확인했습니다.

하지만 다음 단계에서는 단순히 "2027년은 변화가 있다"에서 끝나지 않습니다.

**더 깊은 분석에서 확인할 수 있는 것**

- 2027년 **월별로 변화가 강해지는 시기**
- 대운과 세운이 겹칠 때 **직업·재물·연애 중 어떤 영역이 먼저 움직이는지**
- 축진파(丑辰破)와 인사해(寅巳害)가 **실제 관계에서 어떤 형태로 나타나는지**
- 금(金)·수(水) 부족을 **생활환경과 행동에서 어떻게 보완할지**
- 현재의 부담 중 **계속 가져갈 것과 정리할 것**
- 나에게 맞는 **구체적인 환경·행동 처방**

### 한 문장으로 정리하면

> **이 사주는 버티는 힘이 약한 사람이 아니라, 버티는 힘이 강하기 때문에 무엇을 계속 가져가고 무엇을 바꿀지 선택하는 것이 중요한 사주입니다.**
`;
}

// ============================================================================
// 2. 유료 사주풀이 — 심층 분석 마크다운 생성 (18개 섹션)
// ============================================================================
export function getPaidReportMarkdown(ctx: ReportMetaContext): string {
  return `# 유료 사주풀이 — 심층 분석

### 출생정보 및 적용 기준

${ctx.birthText}

**적용 시간 기준:** 한국 표준시 및 서비스에서 정한 출생시간 보정 규칙을 적용하여 산출한 결과입니다.

---

## 1. 내 사주의 전체 구조

이 사주는 **${ctx.dayMaster}(${ctx.dayMasterHanja}) 일간**을 중심으로 토의 기운이 매우 강하게 형성되어 있습니다.

### 오행 분포

- 목 ${ctx.woodCount}
- 화 ${ctx.fireCount}
- 토 ${ctx.earthCount}
- 금 ${ctx.metalCount}
- 수 ${ctx.waterCount}

토가 매우 강하고 금·수의 존재감이 약한 구조입니다.

따라서 현실에서는 책임감, 지속력, 안정성, 버티는 힘이 강하게 나타날 수 있습니다.

한번 맡은 일은 쉽게 놓지 않고 끝까지 책임지려는 경향이 있으며, 주변에서 기대하는 역할도 비교적 잘 받아내는 편입니다.

반대로 이런 장점이 과해지면 **내가 감당할 수 있는 범위를 넘어선 책임까지 계속 떠안는 패턴**으로 이어질 수 있습니다.

이 사주의 중요한 과제는 단순히 더 강해지는 것이 아니라,

**무엇을 계속 가져가고 무엇을 정리할 것인지 선택하는 것**입니다.

---

## 2. 오행과 십신으로 보는 기본 성향

${ctx.dayMaster} 일간에서 토는 비견·겁재에 해당합니다.

원국에 토가 매우 강하기 때문에 자신의 기준과 책임감, 독립성, 지속력이 강하게 나타날 수 있습니다.

화는 인성에 해당하여 배우고 준비하고 보호하려는 성향과 연결됩니다.

목은 관성에 해당하여 규칙, 조직, 책임, 사회적 역할과 연결됩니다.

즉 이 사주는

> **강한 자기 기반 + 책임과 규칙 + 준비하고 버티는 힘**

이 함께 형성된 구조입니다.

장점으로 작용하면 맡은 역할을 안정적으로 수행하는 힘이 되지만, 과해지면 “내가 조금 더 하면 된다”는 방식으로 책임의 범위를 계속 넓힐 수 있습니다.

따라서 이 사주에서 중요한 능력은 책임감 자체가 아니라 **책임의 경계를 정하는 능력**입니다.

---

## 3. 격국·강약·용신으로 보는 핵심

격국은 월겁격으로 볼 수 있으며, 강한 토의 비중을 함께 보면 자기 기반이 매우 강한 편입니다.

용신은 금, 희신은 수로 보며 화·토의 과다를 조절하는 방향이 중요합니다.

현실적으로는 다음과 같이 연결할 수 있습니다.

- **금:** 정리, 기준 설정, 우선순위, 선택과 절단
- **수:** 유연성, 이동, 정보, 새로운 선택지
- **화·토 과다:** 지나친 책임, 반복적인 버팀, 한곳에 오래 머무르는 패턴

따라서 이 사주에 필요한 변화는 무조건 더 열심히 하는 것이 아니라,

**정리하고 → 선택하고 → 움직이는 능력을 강화하는 것**

입니다.

---

## 4. 직업과 일

직업에서는 책임을 맡았을 때 버티는 힘이 장점이 됩니다.

일정한 역할을 맡고 꾸준히 결과를 만들어내는 환경과 잘 맞습니다.

다만 역할과 책임의 경계가 불분명한 조직에서는 자신이 할 수 있다는 이유로 업무 범위를 계속 넓힐 가능성이 있습니다.

특히 다른 사람의 업무까지 대신 처리하거나, 문제가 생길 때마다 자신이 해결하려는 방식이 반복되면 장점이 오히려 부담으로 바뀔 수 있습니다.

따라서 직업적으로 중요한 기준은

> **“버틸 수 있는가?”가 아니라 “이 역할을 계속 맡는 것이 나에게 유리한가?”**

입니다.

---

## 5. 재물

재물에서는 한 번에 크게 움직이는 방식보다 안정적인 기반을 만들고 관리하는 방식이 중요합니다.

특히 자신의 책임 범위를 넓히는 과정에서 시간과 노동을 과도하게 투입하지 않는 것이 중요합니다.

금·수 보완의 관점에서는 돈을 단순히 모으는 것보다

> **정리 → 비교 → 선택 → 이동**

의 구조를 만드는 것이 중요합니다.

현재 환경 하나만 보고 판단하기보다 여러 조건을 비교하고, 장기적으로 더 나은 선택지를 확보하는 것이 재물 관리에도 도움이 됩니다.

---

## 6. 연애·결혼

배우자궁은 일지 **축토**를 중심으로 봅니다.

관계에서도 쉽게 포기하기보다 한번 시작한 관계를 책임지고 유지하려는 성향이 나타날 수 있습니다.

따라서 상대방에게도 말보다 **실제 행동과 생활의 안정성**을 중요하게 볼 가능성이 큽니다.

잘 맞는 상대는 감정 기복으로 관계를 흔들기보다 약속을 지키고, 자신의 생활 기준이 분명하며, 책임을 서로 나눌 수 있는 사람입니다.

반대로 한쪽만 계속 책임지거나 상대의 불안정성을 자신이 보완해야 하는 관계는 시간이 갈수록 부담이 커질 수 있습니다.

### 2026년
${ctx.year2026Summary}

### 2027년
${ctx.year2027Summary}

### 2028년
${ctx.year2028Summary}

---

## 7. 인간관계

원국의 **${ctx.natalRelationsSummary}** 구조는 인간관계에서 단순한 정면충돌보다는 미묘한 불편이나 역할의 엇갈림으로 나타날 수 있습니다.

특히 상대방의 요구를 바로 거절하지 못하고 일단 받아준 뒤 나중에 부담을 느끼는 방식이 반복되지 않도록 하는 것이 중요합니다.

관계에서는 상대의 요구를 모두 받아들이는 것보다

**내가 실제로 책임질 수 있는 범위를 먼저 정하는 것**

이 중요합니다.

---

## 8. 가족·생활환경

생활에서는 안정적인 환경을 선호하기 쉽습니다.

그러나 안정성이 지나치게 강해지면 변화가 필요한 상황에서도 기존 방식을 계속 유지할 수 있습니다.

따라서 생활환경에서도 부족한 **${ctx.yongshin}** 기운을 현실적으로 보완하는 것이 좋습니다.

- 불필요한 물건과 일정 정리
- 공간의 여백 확보
- 업무와 개인생활의 경계 설정
- 새로운 정보와 사람 접촉
- 하나의 선택지만 고집하지 않기
- 필요하면 환경 자체를 바꾸는 선택 검토

---

## 9. 건강과 생활관리

명리적으로는 강한 화·토의 생활 패턴을 지나치게 지속하지 않는 것이 중요합니다.

특히 업무와 책임을 장기간 누적시키기보다 일정한 휴식과 생활 리듬을 유지하는 것이 좋습니다.

다만 건강 상태의 진단이나 치료 판단은 명리의 영역이 아니므로 실제 증상이나 질환이 있다면 의료 전문가의 판단을 우선해야 합니다.

---

## 10. 현재 대운 — 계축대운

2020년부터 2030년까지 계축대운이 이어집니다.

계수는 기존의 강한 토 구조에 새로운 흐름을 만들어주는 요소입니다.

반면 축토가 다시 들어오면서 기존의 책임과 안정 지향적인 성향도 강화됩니다.

따라서 현재 대운은 모든 것을 한 번에 바꾸는 시기라기보다,

**현재의 기반을 유지하면서 앞으로 무엇을 바꿀 것인지 준비하는 시기**

로 볼 수 있습니다.

---

## 11. 다음 대운 — 임자대운

2030년경부터 임자대운으로 넘어갑니다.

현재 계축대운이 마무리되고 **임자대운이라는 새로운 10년의 흐름**이 시작되는 시점입니다.

임수와 자수는 이 사주에서 부족한 수의 흐름을 강하게 만들어줍니다.

따라서 현재보다 이동, 정보, 새로운 환경, 선택지 확대, 새로운 경제활동과 연결되는 가능성이 커질 수 있습니다.

---

## 12. 2026년 병오

${ctx.year2026Summary}

이 시기의 핵심은 무조건적인 변화보다

**현재 무엇이 나를 가장 많이 소모시키고 있는지를 확인하는 것**

입니다.

---

## 13. 2027년 정미

${ctx.year2027Summary}

따라서 2027년은

**사람 · 관계 · 생활환경 · 일의 방식 중 무엇을 바꿀 것인지 결정하는 시기**

로 활용하는 것이 좋습니다.

---

## 14. 2027년 월별 흐름

※ 월운은 절기 기준으로 구분합니다.

${ctx.monthly2027ListMarkdown}

---

## 15. 2028년 무신

${ctx.year2028Summary}

---

## 16. 환경 처방 — ${ctx.yongshin} 보완

이 사주에서는 부족한 **${ctx.yongshin}** 기운을 현실적인 생활 방식으로 보완하는 것이 중요합니다.

- **핵심 용신(${ctx.yongshin}) 보완:** 공간 정리, 업무 우선순위와 문서·계약 기준 명확화, 필요한 정보 탐색 및 환경 환기
- **과다 기운(${ctx.dominantElement}) 조율:** 무리한 고집이나 과부하를 줄이고 선택지를 비교하며 균형 유지

---

## 17. 행동 처방

이 사주에서 가장 중요한 행동 변화는 더 열심히 버티는 것이 아닙니다.

1. **책임의 경계를 정합니다:** 내가 책임질 일과 다른 사람이 책임질 일을 구분합니다.
2. **즉답을 줄입니다:** 중요한 요구를 받았을 때 확인 후 답하는 습관을 만듭니다.
3. **반복되는 문제는 기록합니다:** 업무·약속·역할을 서면으로 남깁니다.
4. **선택지를 하나 이상 확보합니다:** 다른 직업·관계·생활환경의 가능성도 함께 비교합니다.

---

## 18. 어느 영역이 먼저 움직이는가

전체 명리 구조와 2026~2028년의 흐름을 연결하면 변화의 우선순위는 다음과 같습니다.

- **1순위 — 관계·생활환경:** 원진과 충의 작용으로 기존 관계나 생활방식을 다시 보게 됨
- **2순위 — 직업·역할:** 관계와 생활환경의 변화가 결국 업무의 역할과 책임 조정으로 연결됨
- **3순위 — 재물:** 앞의 변화가 정리된 이후 장기적으로 새로운 선택지와 경제활동 범위가 넓어짐

따라서 변화 순서는 **관계·환경 조정 → 직업·역할 재정리 → 재물과 선택지 확대**입니다.

### 최종 종합

> **이 사주는 버티는 힘이 약한 사람이 아니라, 버틸 수 있기 때문에 무엇을 계속 책임질 것인지 선택하는 것이 중요한 사람입니다.**
`;
}

// ============================================================================
// 3. 상충·마·살 집중 분석 (심화) 마크다운 생성 (20개 섹션)
// ============================================================================
export function getConflictMalSalReportMarkdown(ctx: ReportMetaContext): string {
  return `# 상충·마·살 집중 분석

### ${ctx.birthText}

**이번 분석의 핵심 질문**

> “${ctx.troubleText}”

이 분석은 신살을 단순히 나열하지 않고, **원국의 상충·파·해 → 신살 → 현재 운 → 퇴사 고민 → 현실적인 대응**의 순서로 연결합니다.

---

## 1. 이번 분석에서 가장 중요한 구조

이 명식에서 주목할 축은 세 가지입니다.

**① 원국의 관계 구조**
- 월지 진(辰) ↔ 일지 축(丑) : **축진파(丑辰破)**
- 연지 인(寅) ↔ 시지 사(巳) : **인사해(寅巳害)**

**② 시간축에서 관계가 움직이는 구간**
- 2026년 병오 : **축오원진(丑午怨嗔)**
- 2027년 정미 : **축미충(丑未沖)**
- 2027년 신월 : **인신충(寅申沖)**
- 2028년 무신 : **인신충(寅申沖)** 및 **인사신 삼형(寅巳申三刑)**

**③ 신살 중 현재 고민과 직접 연결되는 신호**
- 망신살 : 직장 내 평가·평판·공개적인 관계 마찰과 연결
- 천살·지살·월살 : 보조 신호
- 홍염살 : 대인관계에서의 인상·주목도 측면의 보조 신호

따라서 중요한 것은 “신살이 많다”가 아니라,

**원래 존재하던 관계의 불편함이 운에서 어떤 방식으로 움직이는가**

입니다.

---

## 2. 원국 관계 지도

| 위치 | 지지 | 이번 분석에서의 의미 |
| :--- | :--- | :--- |
| 연지 | 인(寅) | 외부 환경·사회적 관계 |
| 월지 | 진(辰) | 직업·사회생활의 환경 |
| 일지 | 축(丑) | 생활 기반·개인 영역 |
| 시지 | 사(巳) | 미래 방향·행동 영역 |

**월지 진(辰) ↔ 일지 축(丑) → 축진파(丑辰破)**
직업환경과 개인 생활 기반 사이에서 작은 불편이 누적되고, 결국 “이 구조 자체를 바꿔야 하나?”라는 생각으로 이어질 수 있는 구조입니다.

**연지 인(寅) ↔ 시지 사(巳) → 인사해(寅巳害)**
외부 관계와 자신의 행동 방식 사이에 미묘한 마찰이 생길 수 있는 구조입니다.

즉, **작은 불편 → 반복 → 누적 → 관계 피로 → 환경을 바꾸고 싶은 마음**의 흐름입니다.

---

## 3. 축진파 — “작은 문제가 반복해서 구조적인 문제가 되는가”

축진파(丑辰破)는 월지 진(辰)과 일지 축(丑)의 관계입니다.
- 업무 방식이 계속 바뀐다.
- 지시가 일관되지 않는다.
- 사소한 조정이 반복된다.
- 처음에는 참을 수 있지만 시간이 지나면서 피로가 커진다.
- 결국 “이 회사의 방식 자체가 나와 맞지 않는 것 아닌가?”라는 생각으로 발전할 수 있습니다.

따라서 현재 고민과 연결할 때는 **한 번의 사건보다 반복되는 구조적 불편**을 먼저 확인하는 것이 중요합니다.

---

## 4. 인사해 — “사람 때문에 환경 전체가 불편해지는가”

인사해(寅巳害)는 연지 인(寅)과 시지 사(巳)의 관계입니다.
- 상대의 의도를 계속 다시 해석하게 된다.
- 말 한마디가 오래 남는다.
- 업무 자체보다 사람과의 조율이 더 피곤하다.
- 직접적인 싸움보다 “계속 신경 쓰이는 상황”이 반복된다.

따라서 고민이 단순히 업무량 때문인지, 아니면 **사람·조직문화·업무방식의 누적 문제인지** 구분해야 합니다.

---

## 5. 퇴사 vs 버티기 — 원국만으로 결정하지 않는 이유

이 명식만 보고 “퇴사해야 한다”고 결론내리는 것은 적절하지 않습니다.

- **A. 문제가 사람 한 명에게 집중되어 있는가?** → 업무범위 조정, 보고라인 조정, 역할 명확화 우선 시도
- **B. 문제가 조직의 구조 자체인가?** → 다음 직장에서 어떤 조건을 반드시 확인해야 하는지 먼저 정리
- **C. 이미 생활과 건강까지 무너지고 있는가?** → 명리 해석보다 현실적인 안전과 생활 회복 우선

---

## 6. 2026년 병오

${ctx.year2026Summary}
- 계속 신경 쓰이는 문제
- 이유를 설명하기 어려운 불편함
- 같은 문제를 반복해서 생각하는 상태
- 사람이나 조직에 대한 피로감

따라서 2026년은 퇴사 여부를 즉시 결정하는 것보다, **“내가 무엇 때문에 이 환경을 견디기 어려운가”를 정확히 분리하는 시기**로 활용해야 합니다.

---

## 7. 2027년 정미

${ctx.year2027Summary}

---

## 8. 2028년 무신 — 환경과 기준의 재정립

${ctx.year2028Summary}

---

## 9. 관계 변화 흐름

> **원국:** ${ctx.natalRelationsSummary}
> 
> ↓
> 
> **2026 병오:** ${ctx.year2026Summary}
> 
> ↓
> 
> **2027 정미:** ${ctx.year2027Summary}
> 
> ↓
> 
> **2028 무신:** ${ctx.year2028Summary}

---

## 10. 신살 — 실제 발생 위치까지 확인

${ctx.sinsalTableMarkdown}

원국의 신살은 일방적인 길흉 단정보다 현재 상황과 대인관계의 신호를 읽는 보조 지표로 해석합니다.

---

## 11. ${ctx.primarySinsalName} — 이번 고민과 직접 연결되는 신살

**${ctx.primarySinsalName}**은 이 명식에서 **${ctx.primarySinsalLocation}**에 위치합니다.
- 자신의 말이나 행동이 예상보다 크게 받아들여짐
- 업무 과정에서 공개적인 지적이나 평가를 신경 쓰게 됨
- 환경 변화·대인관계에 대한 부담 증가
- 사람들의 시선과 기준을 의식하면서 피로가 커짐

따라서 신살을 막연한 불길함으로 단정하지 않고, **평판·노출·환경 변화에 민감해질 수 있는 구조**로 변환하여 대응합니다.

---

## 12. 천살·지살·월살 — 보조 신호로 사용

현재 사용자의 핵심 고민과 직접 겹치는 정도가 망신살이나 상충 관계보다 낮으므로, 시간축에서 관계가 움직일 때 보조 신호로 유지합니다.

---

## 13. “마”의 의미 — 갑자기 모든 것을 바꾸고 싶어지는 순간

명리적 신호를 현실 언어로 바꾸면,

> **불편함을 작은 단위로 조정하지 못한 채 누적시키다가 어느 순간 환경 전체를 바꾸고 싶어지는 패턴**

으로 설명할 수 있습니다.

따라서 중요한 처방은 **“당장 퇴사할까?”**보다 **“무엇을 먼저 바꿔보고 그래도 해결되지 않으면 무엇을 바꿀 것인가?”**입니다.

---

## 14. 4주 점검 계획

- **1주차:** 내가 힘든 이유를 사람, 업무, 조직 구조 3가지로 분리합니다.
- **2주차:** 업무 조정, 역할 변경, 상사 협의 등 실제로 바꿀 수 있는 조건을 확인합니다.
- **3주차:** “이 조직이 아니라면 해결되는 문제인가?” 바뀌지 않는 조건을 확인합니다.
- **4주차:** 퇴사와 잔류 조건을 동시에 비교하고 감정이 가라앉은 상태에서 결정합니다.

| 기준 | 현재 직장 잔류 | 이직 |
| :--- | :--- | :--- |
| 업무 구조 | 개선 가능 여부 | 새 조직에서 확인 |
| 상사 관계 | 조정 가능 여부 | 새 상사 확인 |
| 역할 | 명확화 가능 여부 | R&R 사전 확인 |
| 성장성 | 남을 이유 | 옮길 이유 |
| 생활 안정 | 현재 수준 유지 | 이직 후 예상 |

---

## 15. 하지 말아야 할 것

- 한 번의 갈등만으로 즉시 퇴사 결정
- 상대의 말 한마디를 전체 조직의 문제로 확대
- 감정적인 상태에서 사직서 제출
- 이직할 회사의 업무범위 확인 없이 이동
- “운이 안 좋으니 무조건 떠나야 한다”는 식의 비합리적 판단

---

## 16. 해야 할 것

- **직장에 남는다면:** 업무범위 명확화, 지시사항 기록, 변경된 업무 서면 확인, 사실 중심 협의
- **이직을 준비한다면:** 원하는 직무 조건 작성, R&R 확인, 보고체계 및 조직문화 사전 확인

---

## 17. 가장 먼저 바꿀 한 가지

> **“현재 요청하신 업무의 우선순위와 제가 기존에 맡은 업무 중 어떤 부분을 조정하면 될지 확인 부탁드립니다.”**

업무와 책임의 경계를 문서와 사실 기반으로 명확히 만드는 대화 습관부터 시작합니다.

---

## 18. 의사결정 순서

> 불편함 발생 → 원인 분리(사람/업무/구조) → 조직 내 조정 가능 여부 확인 → 반복 여부 확인 → 이직 조건 구체화 → 새 환경 비교 → 최종 결정

---

## 19. 최종 판단

원국에 이미 **축진파와 인사해**가 존재하고, 2026년 축오원진, 2027년 축미충, 2028년 인신충과 인사신 삼형으로 이어집니다.
따라서 현재 직장의 어떤 구조가 자신과 맞지 않는지 구체적으로 확인하는 과정이 반드시 필요합니다.

---

## 20. 이번 분석의 핵심 5가지

1. **축진파:** 직업환경과 개인 기반의 반복적인 불편 확인
2. **인사해:** 관계에서 미묘한 피로가 누적될 가능성 확인
3. **2026 축오원진:** 현재 불편함을 구체적으로 인식하는 시기
4. **2027 축미충 + 신월 인신충:** 기존 구조를 실제로 조정할 필요가 커지는 구간
5. **2028 인신충 + 인사신 삼형:** 새로운 환경과 관계 기준을 다시 세우는 구간

### 마보살의 결론

> **지금 필요한 것은 무조건 퇴사하거나 무조건 버티는 결정이 아닙니다. 현재 직장에서 무엇을 바꿀 수 있는지 먼저 확인하고, 그 결과를 바탕으로 이직 조건을 만들면 "힘들어서 떠나는 이직"에서 "내게 맞는 환경을 선택하는 이직"으로 바꿀 수 있습니다.**
`;
}

// ============================================================================
// 4. 마보살 프리미엄 정밀 사주 진단 마크다운 생성 (29개 섹션)
// ============================================================================
export function getPremiumReportMarkdown(ctx: ReportMetaContext): string {
  return `# 마보살 프리미엄 정밀 사주 진단

## 이번 진단에서 확인하는 질문

**“${ctx.troubleText}”를 중심으로 살펴봅니다.**

---

## 1. 사주 한눈에

**${ctx.yearPillar} · ${ctx.monthPillar} · ${ctx.dayPillar} · ${ctx.hourPillar}**

- 일간: **${ctx.dayMaster}(${ctx.dayMasterHanja})**
- 오행: 목 ${ctx.woodCount} · 화 ${ctx.fireCount} · 토 ${ctx.earthCount} · 금 ${ctx.metalCount} · 수 ${ctx.waterCount}
- 전체적으로 토 기운이 매우 강한 구조입니다.

이 명식은 스스로 버티고 책임지는 힘은 강하지만, 한 번 쌓인 문제를 밖으로 꺼내 조정하거나 결과와 경제적 가치로 전환하는 과정이 상대적으로 약하게 나타날 수 있습니다.

---

## 2. 오행 구조

### 강한 기운: 토(土) ${ctx.earthCount}
책임감, 지속력, 현실 감각, 버티는 힘으로 나타나기 쉽습니다.

### 보조하는 기운: 화(火) ${ctx.fireCount}
배움과 준비, 조직 안에서 기준을 받아들이는 힘으로 작용합니다.

### 부족한 기운: 금(金) ${ctx.metalCount} · 수(水) ${ctx.waterCount}
${ctx.dayMaster}에게 금은 식상, 수는 재성입니다. 따라서 생각하고 견디는 것에 비해, 생각을 결과물로 표현하기, 자신의 성과를 밖으로 드러내기, 경제적 가치로 연결하기가 중요한 과제가 됩니다.

---

## 3. 십신 분석

| 위치 | 십신 |
| :--- | :--- |
| 연간 무(戊) | 겁재 |
| 연지 인(寅) | 정관 |
| 월간 병(丙) | 정인 |
| 월지 진(辰) | 겁재 |
| 일지 축(丑) | 비견 |
| 시간 기(己) | 비견 |
| 시지 사(巳) | 정인 |

비견·겁재가 강해 자신의 방식과 기준을 중요하게 여기고, 정관·정인이 함께 있어 조직의 기준과 책임에서도 쉽게 벗어나기 어렵습니다.

그래서 **“내 방식대로 하고 싶지만 조직의 규칙도 무시할 수 없는 구조”**가 직장생활에서 반복적으로 나타날 수 있습니다.

---

## 4. 격국과 강약

- **격국:** 월겁격
- **일간:** ${ctx.dayMaster}(${ctx.dayMasterHanja})
- **강약:** 강한 편 (95/100)

강약 판단은 **득령 40% · 득지 30% · 득세 30%**의 구조로 산출되며, 월령·뿌리·전체 세력에서 모두 토를 강하게 지지하는 형태입니다.
핵심은 더 버티는 것이 아니라 **강한 토의 힘을 금·수 방향의 결과와 가치로 전환하는 것**입니다.

---

## 5. 직업

조직 안에서 책임을 맡고 버티는 힘은 강합니다.
다만 지시가 반복적으로 변경되거나 자신의 역할과 무관한 업무까지 계속 떠안는 환경에서는 강한 책임감이 오히려 부담으로 바뀔 수 있습니다.
감정적으로 퇴사 여부를 먼저 결정하기보다 **업무 범위·지시 체계·평가 기준이 실제로 개선 가능한 조직인지 확인**해야 합니다.

---

## 6. 재물

수(水) 재성이 원국에 없기 때문에 돈을 단순히 “들어오는 운”으로 보기보다 **자신의 능력을 경제적 가치로 전환하는 구조를 만드는 것**이 중요합니다. 성과·업무범위·문제 해결 경험을 명확히 정리하여 다음 기회의 가치로 전환하십시오.

---

## 7. 연애·결혼

관계에서는 책임감과 안정성을 중요하게 보는 편입니다.
상대방을 쉽게 포기하지 않지만, 불편한 문제를 혼자 감당하다가 한 번에 정리하려는 방식은 주의할 필요가 있습니다.

---

## 8. 가족·생활

문제가 생겼을 때 혼자 해결하려 하기보다 역할과 책임을 나누는 것이 중요합니다. 생활환경에서도 우선순위와 역할을 눈에 보이게 정리하십시오.

---

## 9. 건강·생활관리

토 기운이 강한 구조에서는 생활이 지나치게 고정되거나 스트레스를 쌓아두는 방식에 주의하십시오. 규칙적인 활동과 수면 관리를 권장합니다.

---

## 10. 축진파(丑辰破)

원국에서 **월지 진(辰)과 일지 축(丑)**이 작용합니다.
직장의 업무환경과 개인의 생활·심리적 부담이 서로 충돌하는 형태로 연결됩니다.

---

## 11. 인사해(寅巳害)

원국에서 **연지 인(寅)과 시지 사(巳)**가 작용합니다.
외부의 요구와 자신의 행동 방식 사이에 미묘한 긴장이 생길 수 있습니다.

---

## 12. 현재 가장 중요한 질문

> **지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지**

2026~2028년의 흐름과 직장 내 관계 변화를 함께 살펴봅니다.

---

## 13. 현재 대운 — 계축대운

**2020년 8월 14일 ~ 2030년 8월 14일**

현재 대운은 경제적 가치와 현실적 성과를 의식하게 되면서도, 기존의 책임과 안정 기반을 유지하려는 힘이 함께 작용합니다.

---

## 14. 다음 대운 전환 흐름

${ctx.nextDaewunSummary}

---

## 15. 2026년 병오

${ctx.year2026Summary}

---

## 16. 2027년 정미 — 월별 흐름

${ctx.monthly2027TableMarkdown}

---

## 17. 2028년 무신

${ctx.year2028Summary}

---

## 18. 2026~2028 핵심 흐름

- **2026:** 불편함과 소모 요인을 정확히 확인하는 시기
- **2027:** 관계·업무·역할을 실제로 조정하는 시기
- **2028:** 기존 방식과 새로운 방향을 비교하여 선택 기준을 재정립하는 시기
- **다음 대운 전환:** ${ctx.nextDaewunSummary}

---

## 19. 신살

${ctx.sinsalTableMarkdown}

---

## 20. ${ctx.primarySinsalName} 집중 해석

**${ctx.primarySinsalName}**(${ctx.primarySinsalLocation})은 대인관계와 평가, 환경 변화에 대한 민감도와 연결됩니다. **외부 압박 → 민감도 상승 → 부담 누적 → 충동적 결정**이라는 패턴을 끊고 구조적 기준을 세워야 합니다.

---

## 21. 현재 문제의 핵심 구조

강한 토 기운으로 버티고, 금·수 부재로 표현과 가치 전환이 어려우며, 축진파/인사해와 망신살이 겹쳐 있습니다. 처방은 더 참는 것이 아니라 **기록하고, 표현하고, 조건을 확인한 뒤 선택하는 것**입니다.

---

## 22. 퇴사할 것인가, 남을 것인가

- **남아볼 조건:** 지시 변경 원인 확인 가능, R&R 조정 가능, 평가 기준 명확화 가능
- **이동을 준비할 조건:** 역할 침범 반복, 책임과 권한 불일치 지속, 동일 문제 반복

---

## 23. 4주 실행 계획

- **1주차:** 최근 한 달간 지시 변경 사례를 기록합니다.
- **2주차:** 업무별 담당자와 최종 승인자를 정리합니다.
- **3주차:** 상급자에게 업무 우선순위와 책임 범위를 확인합니다.
- **4주차:** 개선 여부를 확인하고 잔류·이동 준비의 다음 단계를 결정합니다.

---

## 24. 가장 먼저 할 일 — 업무 변경 기록표

| 항목 | 기록 내용 |
| :--- | :--- |
| 최초 지시 | 처음 받은 업무 |
| 변경 지시 | 이후 변경된 내용 |
| 변경 이유 | 설명받은 사유 |
| 결과 | 실제 발생한 결과 |
| 책임자 | 최종 결정자 |
| 평가 | 이후 받은 피드백 |

---

## 25. 환경 처방

업무 지시를 가능한 한 문서로 남기고, 공간과 자료를 정리하여 불필요한 혼선을 줄이며, 즉답보다 확인 후 답변하는 습관을 만듭니다.

---

## 26. 행동 처방

> **기존 방식:** 문제 발생 → 참고 넘김 → 누적 → 한 번에 정리
> 
> **바꿀 방식:** 문제 발생 → 기록 → 조건 확인 → 짧게 표현 → 결과 확인 → 다음 결정

---

## 27. 앞으로의 직업 선택 기준

1. 역할과 책임이 명확한가
2. 지시 체계가 일관적인가
3. 성과 기준이 문서화되어 있는가
4. 개인의 결과물이 평가에 반영되는가
5. 업무 경험이 다음 경력의 가치로 전환되는가
6. 책임만 주고 권한은 주지 않는 구조가 아닌가

---

## 28. 최종 진단

현재의 핵심 문제는 “버틸 힘이 부족해서”가 아니라 **너무 많이 버티면서 문제가 누적되는 구조**에 있습니다.

---

## 29. 최종 변화 방향

> **참는 사람에서 기록하는 사람으로,**
> **쌓아두는 사람에서 표현하는 사람으로,**
> **감정으로 결정하는 사람에서 조건을 확인하고 선택하는 사람으로.**
`;
}

function getSectionIcon(no: number): string {
  switch (no) {
    case 1: return 'auto_awesome';
    case 2: return 'psychology';
    case 3: return 'pie_chart';
    case 4: return 'local_fire_department';
    case 5: return 'water_drop';
    case 6: return 'help_outline';
    case 7: return 'insights';
    case 8: return 'record_voice_over';
    case 9: return 'warning';
    case 10: return 'timeline';
    case 11: return 'task_alt';
    case 12: return 'directions_walk';
    case 13: return 'verified';
    case 14: return 'monetization_on';
    case 15: return 'work';
    case 16: return 'favorite';
    case 17: return 'spa';
    case 18: return 'calendar_month';
    case 19: return 'shield';
    case 20: return 'balance';
    default: return 'auto_awesome';
  }
}

// ============================================================================
// 5. 마크다운 리포트를 프리미엄 UI 섹션 카드 HTML로 변환하는 파서
// ============================================================================
export function renderNarrativeReport(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  let outputHtml = '';

  let currentSectionNo = 0;
  let currentSectionTitle = '';
  let currentSectionLines: string[] = [];
  let headerHtml = '';

  const flushSection = () => {
    if (!currentSectionTitle && currentSectionLines.length === 0) return;

    if (currentSectionNo === 0 && !currentSectionTitle) {
      // 상단 프리뷰/헤더 영역
      headerHtml = `
        <div class="narrative-meta-banner" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          ${renderBlockLines(currentSectionLines)}
        </div>
      `;
    } else {
      // 섹션 10 시작 직전에 천명원 에디토리얼 이미지 카드 배치
      if (currentSectionNo === 10) {
        outputHtml += `
          <section class="cheonmyeongwon-editorial-card" style="border-radius: 16px; overflow: hidden; background: var(--surface-container); box-shadow: 0 8px 30px rgba(0,0,0,0.5); margin: 2rem 0; border: 1px solid rgba(242, 202, 80, 0.3);">
            <div style="position: relative; width: 100%; height: 160px; background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLs0PxIZ6e3vYV6u3y9zvVP1gfLOd2aPvBMtRiZcOVLmKG88qEmhBtpRGnfMIX_aUuxfD0Lb18qlzoQvcwJL-okDHqY7J01g5HA7TbaQgprfXNwOoskZZv1wO9prEBiaVUmUnUDwpHj7ubFggWpls8G8mSf6k70q4JSwcZAhgFKEighpURTHwGzaFTeOZ1mbSrl9pDIxMvhgzTRjh-EyikXMjfKFEM3UO9h1-zsINm'); background-size: cover; background-position: center; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.25rem;">
              <div style="position: absolute; inset: 0; background: linear-gradient(to top, var(--surface-container) 0%, rgba(15,19,29,0.7) 60%, transparent 100%);"></div>
              <div style="position: relative; z-index: 1;">
                <h3 style="font-family: var(--font-serif); font-size: 1.22rem; font-weight: 700; color: #fff; margin: 0 0 0.15rem 0;">대운(大運)의 흐름과 인생 전환기</h3>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">우주적 에너지 순환에 따른 시기별 대처와 행동 비책</p>
              </div>
            </div>
          </section>
        `;
      }

      const iconName = getSectionIcon(currentSectionNo);
      outputHtml += `
        <div class="result-section-box narrative-section-card" id="nsec-${currentSectionNo}" style="margin-bottom: 1.5rem; background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.22); border-radius: 16px; padding: 1.4rem 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.35); scroll-margin-top: 90px;">
          <div class="section-step-indicator" style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(242, 202, 80, 0.15); display: flex; align-items: center; justify-content: center; color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35);">
                <span class="material-symbols-outlined" style="font-size: 20px;">${iconName}</span>
              </div>
              <div>
                <h3 class="section-heading" style="margin: 0; font-size: 1.2rem; font-weight: 700; color: #ffffff; font-family: var(--font-serif); letter-spacing: -0.01em;">${escapeHtml(currentSectionTitle)}</h3>
              </div>
            </div>
          </div>
          <div class="section-narrative-body" style="display: flex; flex-direction: column; gap: 0.55rem;">
            ${renderBlockLines(currentSectionLines)}
          </div>
        </div>
      `;
    }

    currentSectionLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('## ')) {
      flushSection();
      const rawTitle = trimmed.substring(3).trim();
      const match = rawTitle.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        currentSectionNo = parseInt(match[1], 10);
        currentSectionTitle = match[2];
      } else {
        currentSectionNo++;
        currentSectionTitle = rawTitle;
      }
      continue;
    }

    currentSectionLines.push(rawLine);
  }

  flushSection();

  return headerHtml + outputHtml;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-gold); font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: var(--text-secondary);">$1</em>');
}

function renderBlockLines(lines: string[]): string {
  let html = '';
  let inList = false;
  let inOrderedList = false;
  let inTable = false;
  let inQuote = false;
  let quoteBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (!inTable || tableBuffer.length === 0) return;
    html += renderTableBlock(tableBuffer);
    tableBuffer = [];
    inTable = false;
  };

  const flushQuote = () => {
    if (!inQuote || quoteBuffer.length === 0) return;
    html += `
      <blockquote style="border-left: 3px solid var(--primary); background: var(--surface-container-high); padding: 1rem 1.35rem; border-radius: 0 10px 10px 0; margin: 1rem 0; color: #dfe2f1; font-size: 0.98rem; line-height: 1.8; font-family: var(--font-serif); box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);">
        ${quoteBuffer.map(q => `<p style="margin: 0.35rem 0;">${formatInline(q)}</p>`).join('')}
      </blockquote>
    `;
    quoteBuffer = [];
    inQuote = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      flushQuote();
      flushTable();
      continue;
    }

    // 헤더 레벨 1 (#)
    if (line.startsWith('# ')) {
      flushQuote(); flushTable();
      const title = line.replace(/^#\s*/, '');
      html += `<h2 style="font-size: 1.45rem; font-weight: 700; color: var(--text-gold); margin: 0.5rem 0 0.85rem 0;">${formatInline(title)}</h2>`;
      continue;
    }

    // 헤더 레벨 3 (###)
    if (line.startsWith('### ')) {
      flushQuote(); flushTable();
      if (inList) { html += '</ul>'; inList = false; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      const sub = line.replace(/^###\s*/, '');
      html += `<h4 style="color: var(--text-gold); font-size: 1.05rem; font-weight: 700; margin: 1.25rem 0 0.45rem 0;">${formatInline(sub)}</h4>`;
      continue;
    }

    // 구분선 (---)
    if (line === '---') {
      flushQuote(); flushTable();
      html += `<hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 1.25rem 0;" />`;
      continue;
    }

    // 인용구 (>)
    if (line.startsWith('>')) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      flushTable();
      inQuote = true;
      const qText = line.replace(/^>\s*/, '');
      quoteBuffer.push(qText);
      continue;
    } else {
      flushQuote();
    }

    // 표 (|)
    if (line.startsWith('|') && line.endsWith('|')) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else {
      flushTable();
    }

    // 불릿 리스트 (- 또는 • 또는 *)
    if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      if (!inList) {
        html += '<ul style="padding-left: 1.3rem; margin: 0.5rem 0; line-height: 1.85; color: #e2e8f0; font-size: 0.96rem; font-family: var(--font-serif); letter-spacing: -0.015em;">';
        inList = true;
      }
      const item = line.replace(/^[-•*]\s*/, '');
      html += `<li style="margin-bottom: 0.35rem;">${formatInline(item)}</li>`;
      continue;
    }

    // 번호 리스트 (1. 2. 3.)
    const numMatch = line.match(/^(\d+)\.\s*(.+)$/);
    if (numMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      if (!inOrderedList) {
        html += '<ol style="padding-left: 1.3rem; margin: 0.5rem 0; line-height: 1.85; color: #e2e8f0; font-size: 0.96rem; font-family: var(--font-serif); letter-spacing: -0.015em;">';
        inOrderedList = true;
      }
      html += `<li style="margin-bottom: 0.35rem;">${formatInline(numMatch[2])}</li>`;
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }
    if (inOrderedList) { html += '</ol>'; inOrderedList = false; }

    // 일반 문단
    html += `<p style="margin: 0.65rem 0; line-height: 1.88; color: #e2e8f0; font-size: 0.98rem; font-family: var(--font-serif); letter-spacing: -0.015em;">${formatInline(line)}</p>`;
  }

  if (inList) html += '</ul>';
  if (inOrderedList) html += '</ol>';
  flushQuote();
  flushTable();

  return html;
}

function renderTableBlock(lines: string[]): string {
  if (lines.length < 2) return '';

  const parseRow = (rowStr: string) => {
    return rowStr
      .split('|')
      .slice(1, -1)
      .map(c => c.trim());
  };

  const headerCells = parseRow(lines[0]);
  const bodyRows: string[][] = [];

  for (let i = 2; i < lines.length; i++) {
    bodyRows.push(parseRow(lines[i]));
  }

  return `
    <div style="overflow-x: auto; margin: 1rem 0; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 6px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
        <thead>
          <tr style="background: rgba(212, 175, 55, 0.1); border-bottom: 1px solid var(--border-subtle); color: var(--text-gold);">
            ${headerCells.map(h => `<th style="padding: 0.65rem 0.85rem; font-weight: 600; white-space: nowrap;">${formatInline(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${bodyRows.map(r => `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
              ${r.map(c => `<td style="padding: 0.6rem 0.85rem; color: var(--text-secondary); line-height: 1.5;">${formatInline(c)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================================
// 6. 소장용 TXT 텍스트 파일 생성기 (정돈된 목차 및 제 01 장 ~ 제 13 장/18 장 체계)
// ============================================================================
export function generateDownloadableReportText(state: AppStateData): string {
  const savedProfile = UserSajuStore.getProfile();
  const userName = state.userName || savedProfile?.userName || '의뢰인';
  const currentGender = state.gender || savedProfile?.gender || 'female';
  const genderTag = currentGender === 'female' ? '곤명(坤命 · 陰)' : '건명(乾命 · 陽)';
  const birthDateStr = state.sessionState?.request?.birthDate || savedProfile?.solarBirthDate || '1995-04-12';
  const birthTimeStr = state.sessionState?.request?.birthTime || savedProfile?.birthTime || '09:20';
  const calTypeStr = state.calendarType || savedProfile?.calendarType || 'solar';
  const birthSummary = `${birthDateStr} ${birthTimeStr} (${calTypeStr === 'lunar' ? '음력' : '양력'})`;

  const session = state.sessionState;
  const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars || {
    year: { stem: '무', branch: '인' },
    month: { stem: '병', branch: '진' },
    day: { stem: '기', branch: '축' },
    hour: { stem: '기', branch: '사' },
  };

  const activeTier = state.activeTierTab;
  const isPaid = state.isPaidUser || activeTier === 'PAID' || activeTier === 'PREMIUM' || (activeTier as string) === 'CONFLICT' || activeTier === 'CONFLICT_MALSAL';
  const reportCtx = extractReportContext(state);

  let rawMarkdown = '';
  let reportTypeName = '마보살 무료 핵심 진단서';

  if (activeTier === 'PREMIUM') {
    rawMarkdown = getPremiumReportMarkdown(reportCtx);
    reportTypeName = '마보살 프리미엄 정밀 사주 리포트 (VIP 29장 완결본)';
  } else if ((activeTier as string) === 'CONFLICT' || activeTier === 'CONFLICT_MALSAL') {
    rawMarkdown = getConflictMalSalReportMarkdown(reportCtx);
    reportTypeName = '마보살 상충·마·살 특화 분석서 (20장 완결본)';
  } else if (isPaid) {
    rawMarkdown = getPaidReportMarkdown(reportCtx);
    reportTypeName = '마보살 유료 심층 사주풀이 (18장 완결본)';
  } else {
    rawMarkdown = getFreeReportMarkdown(reportCtx);
    reportTypeName = '마보살 무료 핵심 사주 진단서 (13장)';
  }

  // 마크다운 줄 파싱 및 장절 구조 정돈
  const lines = rawMarkdown.split('\n');
  const tocEntries: string[] = [];
  const chapters: { no: number; title: string; contentLines: string[] }[] = [];

  let curNo = 0;
  let curTitle = '';
  let curLines: string[] = [];

  const flushCurChapter = () => {
    if (curNo > 0 && curTitle) {
      chapters.push({
        no: curNo,
        title: curTitle,
        contentLines: [...curLines],
      });
    }
    curLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      flushCurChapter();
      const rawTitle = trimmed.substring(3).trim();
      const match = rawTitle.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        curNo = parseInt(match[1], 10);
        curTitle = match[2];
      } else {
        curNo++;
        curTitle = rawTitle;
      }
      const padNo = curNo < 10 ? `0${curNo}` : `${curNo}`;
      tocEntries.push(`  [제 ${padNo} 장] ${curTitle}`);
      continue;
    }
    // 마크다운 장식 정리
    const cleanLine = line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^>\s*/, '  ※ ')
      .replace(/^###\s*/, '▶ ')
      .replace(/^-\s*/, '  • ');
    curLines.push(cleanLine);
  }
  flushCurChapter();

  // 최종 TXT 서식 조립
  const separator = '='.repeat(68);
  const subSeparator = '-'.repeat(68);

  let doc = '';
  doc += `${separator}\n`;
  doc += `              마보살 정통 사주 감명서 (평생 소장본)\n`;
  doc += `       천명(天命)을 읽고 삶의 주도권을 잡는 심층 명리 해설서\n`;
  doc += `${separator}\n\n`;

  doc += `[ 1. 의뢰인 명식 개요 ]\n`;
  doc += `• 이름 / 명식 : ${userName} (${genderTag})\n`;
  doc += `• 생년월일시  : ${birthSummary}\n`;
  doc += `• 사주 사주원국: ${pillars.hour.stem}${pillars.hour.branch}시 ${pillars.day.stem}${pillars.day.branch}일 ${pillars.month.stem}${pillars.month.branch}월 ${pillars.year.stem}${pillars.year.branch}년\n`;
  doc += `• 오행 구성   : 목(木) ${reportCtx.woodCount} · 화(火) ${reportCtx.fireCount} · 토(土) ${reportCtx.earthCount} · 금(金) ${reportCtx.metalCount} · 수(水) ${reportCtx.waterCount}\n`;
  doc += `• 감정 등급   : ${reportTypeName}\n\n`;

  doc += `${subSeparator}\n`;
  doc += `[ 2. 전체 감명 목차 (Table of Contents) ]\n`;
  doc += `${subSeparator}\n`;
  doc += tocEntries.join('\n') + '\n\n';

  doc += `${separator}\n`;
  doc += `[ 3. 심층 감정 본문 ]\n`;
  doc += `${separator}\n\n`;

  for (const chap of chapters) {
    const padNo = chap.no < 10 ? `0${chap.no}` : `${chap.no}`;
    doc += `====================================================================\n`;
    doc += ` [제 ${padNo} 장] ${chap.title}\n`;
    doc += `====================================================================\n\n`;
    doc += chap.contentLines.join('\n').trim() + '\n\n\n';
  }

  doc += `${separator}\n`;
  doc += `                      마보살 감정 총평 및 결어\n`;
  doc += `${separator}\n`;
  doc += `운(運)은 정해진 굴레가 아니라 파도와 같은 흐름입니다.\n`;
  doc += `자신의 타고난 기운의 강약을 알고 때를 기다릴 줄 아는 사람에게,\n`;
  doc += `사주는 가장 강력한 인생의 전략 지도이자 지혜의 나침반이 됩니다.\n\n`;
  doc += `발행: 마보살 AI 정통 명리 연구소 (天命院 동양 미래학 엔진)\n`;
  doc += `${separator}\n`;

  return doc;
}


