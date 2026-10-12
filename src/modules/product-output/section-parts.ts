/**
 * src/modules/product-output/section-parts.ts
 *
 * Phase 83: 상품 공통 섹션 부품 (Section Parts)
 *
 * 공통 결과 데이터(CommonResultData)의 필드를 읽어 출력 블록으로 옮기는 "배선"만 담당한다.
 * - 문장은 만들지 않는다. 엔진이 제공한 값/문장만 사용한다.
 * - 값이 없으면 missing 블록으로 남긴다.
 */

import {
  cx,
  domainKo,
  factsBlock,
  listBlock,
  locKo,
  missingBlock,
  nonEmpty,
  optionsBlock,
  pillarLabel,
  scoresBlock,
  tableBlock,
  textBlock,
} from './blocks.js';
import { flattenScores } from './result-score-builder.js';
import type { CommonResultData, OutputBlock, YearFlow } from './types.js';

const POS_ORDER: Array<['year' | 'month' | 'day' | 'hour', string]> = [
  ['year', '년주'],
  ['month', '월주'],
  ['day', '일주'],
  ['hour', '시주'],
];

const SEVERITY_KO: Record<string, string> = {
  CRITICAL: '매우 높음',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

const RISK_KO: Record<string, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

function basisKo(raw: unknown): string {
  const m = String(raw ?? '').match(/^(year|month|day|hour)_(branch|stem)$/);
  if (!m) return '';
  const pos = { year: '년', month: '월', day: '일', hour: '시' }[m[1] as 'year'];
  const kind = m[2] === 'branch' ? '지' : '간';
  return `${pos}${kind} 기준`;
}

export function trouble(cr: CommonResultData): string {
  return cx(cr.input.coreTrouble);
}

export function question(cr: CommonResultData): string {
  return cx(cr.input.desiredQuestion);
}

export function isPrimaryDomain(cr: CommonResultData, code: string): boolean {
  return cr.classification?.primaryDomain === code;
}

// ============================================================================
// 1. 출생 정보 / 원국
// ============================================================================
export function birthFacts(cr: CommonResultData): OutputBlock {
  const i = cr.input;
  const [y, m, d] = (i.solarBirthDate || '').split('-');
  const dateText = y && m && d ? `${y}년 ${Number(m)}월 ${Number(d)}일` : '';
  return factsBlock(
    '출생 정보',
    [
      { label: '역법', value: i.calendarType === 'lunar' ? `음력${i.isLeapMonth ? '(윤달)' : ''} 입력 → 양력 환산` : '양력' },
      { label: '생년월일(양력)', value: dateText },
      { label: '출생시간', value: i.birthTime || (i.isUnknownTime ? '시간 미상' : '') },
      { label: '성별', value: i.gender === 'male' ? '남성' : i.gender === 'female' ? '여성' : '' },
      { label: '출생지', value: i.birthRegion },
    ],
    'input'
  );
}

export function pillarsTable(cr: CommonResultData): OutputBlock {
  const p = cr.pillars;
  if (!p) return missingBlock('table', '사주 4주', 'CORE_ORIGINAL.pillars');
  const row = (key: 'year' | 'month' | 'day' | 'hour') => pillarLabel(p[key]) || (key === 'hour' ? '시간 미상' : '—');
  return tableBlock(
    '사주 4주',
    ['시주', '일주', '월주', '년주'],
    [[row('hour'), row('day'), row('month'), row('year')]],
    'CORE_ORIGINAL.pillars'
  );
}

export function dayMasterFacts(cr: CommonResultData): OutputBlock {
  const c = cr.modules['CORE_ORIGINAL'];
  const dm = c?.dayMaster;
  return factsBlock(
    '일간(나)',
    [
      { label: '일간', value: dm ? `${dm.stem}` : '' },
      { label: '오행', value: dm?.element },
      { label: '음양', value: dm?.yinYang },
    ],
    'CORE_ORIGINAL.dayMaster'
  );
}

export function ohaengBlocks(cr: CommonResultData): OutputBlock[] {
  const o = cr.modules['CORE_ORIGINAL']?.ohaeng;
  const dist = o?.distribution;
  const rows = dist
    ? (['목', '화', '토', '금', '수'] as const).map((e) => ({ label: e, value: dist[e] !== undefined ? `${dist[e]}` : '' }))
    : [];
  return [
    factsBlock('오행 분포', rows, 'CORE_ORIGINAL.ohaeng.distribution'),
    factsBlock(
      '오행 특징',
      [
        { label: '가장 강한 오행', value: o?.dominant },
        { label: '부족한 오행', value: Array.isArray(o?.lacking) ? (o.lacking.length ? o.lacking.join(', ') : '없음') : '' },
      ],
      'CORE_ORIGINAL.ohaeng'
    ),
    textBlock('원국 요약', cr.modules['CORE_ORIGINAL']?.summary, 'CORE_ORIGINAL.summary'),
  ];
}

export function strengthBlocks(cr: CommonResultData): OutputBlock[] {
  const s = cr.modules['STRENGTH'];
  const b = s?.breakdown;
  const yn = (v: unknown) => (v === true ? '해당' : v === false ? '해당 없음' : '');
  return [
    factsBlock(
      '일간 강약',
      [
        { label: '판정', value: s?.status },
        { label: '점수', value: typeof s?.score === 'number' ? `${s.score}점` : '' },
        { label: '월령(계절의 도움)', value: yn(b?.deungryeong) },
        { label: '일지(뿌리)', value: yn(b?.deungji) },
        { label: '주변 세력', value: yn(b?.deungse) },
      ],
      'STRENGTH'
    ),
    textBlock('강약 해설', s?.summary, 'STRENGTH.summary'),
  ];
}

export function geokgukBlocks(cr: CommonResultData): OutputBlock[] {
  const g = cr.modules['GEOKGUK'];
  return [
    factsBlock('격국', [{ label: '격국', value: g?.name }, { label: '구분', value: g?.isSpecialPattern === true ? '특수 격국' : g?.isSpecialPattern === false ? '일반 격국' : '' }], 'GEOKGUK'),
    textBlock('격국 해설', g?.summary, 'GEOKGUK.summary'),
  ];
}

export function sipsinBlocks(cr: CommonResultData): OutputBlock[] {
  const t = cr.modules['TEN_GODS'];
  const groups = t?.groups;
  const counts = t?.counts;
  return [
    factsBlock(
      '십신 그룹 분포',
      groups ? Object.keys(groups).map((k) => ({ label: k, value: `${groups[k]}` })) : [],
      'TEN_GODS.groups'
    ),
    factsBlock(
      '십신 세부 개수',
      counts ? Object.keys(counts).map((k) => ({ label: k, value: `${counts[k]}` })) : [],
      'TEN_GODS.counts'
    ),
    factsBlock(
      '십신 특징',
      [
        { label: '가장 강한 그룹', value: t?.dominantGroup },
        { label: '부족한 그룹', value: Array.isArray(t?.lackingGroups) ? (t.lackingGroups.length ? t.lackingGroups.join(', ') : '없음') : '' },
      ],
      'TEN_GODS'
    ),
    textBlock('십신 해설', t?.summary, 'TEN_GODS.summary'),
  ];
}

export function yongsinBlocks(cr: CommonResultData): OutputBlock[] {
  const e = cr.modules['EOKBU'];
  const j = cr.modules['JOHU'];
  return [
    factsBlock(
      '균형을 맞추는 기운 (억부)',
      [
        { label: '도움이 되는 기운', value: e?.yongsin },
        { label: '보조하는 기운', value: e?.heesin },
        { label: '경계할 기운', value: e?.gisin },
      ],
      'EOKBU'
    ),
    textBlock('억부 근거', e?.reason, 'EOKBU.reason'),
    factsBlock(
      '계절 균형 (조후)',
      [
        { label: '태어난 계절', value: j?.season },
        { label: '도움이 되는 기운', value: j?.yongsin },
        { label: '보조하는 기운', value: j?.heesin },
        { label: '경계할 기운', value: j?.gisin },
      ],
      'JOHU'
    ),
    textBlock('조후 근거', j?.reason, 'JOHU.reason'),
  ];
}

// ============================================================================
// 2. 영역별 (직업/재물/연애/관계/가족/건강)
// ============================================================================
type TopicCode = 'JOB' | 'MONEY' | 'BUSINESS' | 'LOVE' | 'MARRIAGE' | 'RELATIONSHIP' | 'HEALTH';

export function topicBlocks(cr: CommonResultData, code: TopicCode): OutputBlock[] {
  const d = cr.modules[code];
  const blocks: OutputBlock[] = [];
  const extra: Array<{ label: string; value: unknown }> = [];
  if (code === 'JOB') {
    extra.push({ label: '직장·조직 기운(관성)', value: d?.officerElement });
    extra.push({ label: '관성 개수', value: typeof d?.officerCount === 'number' ? `${d.officerCount}개` : '' });
  } else if (code === 'MONEY') {
    extra.push({ label: '재물 기운(재성)', value: d?.wealthElement });
    extra.push({ label: '재성 개수', value: typeof d?.wealthCount === 'number' ? `${d.wealthCount}개` : '' });
  } else if (code === 'LOVE') {
    extra.push({ label: '인연 기운', value: d?.partnerElement });
  } else if (code === 'MARRIAGE') {
    extra.push({ label: '배우자궁', value: d?.spousePalace });
  } else if (code === 'HEALTH') {
    extra.push({ label: '오행상 보완 기운', value: d?.weakestElement });
  }
  blocks.push(factsBlock(`${domainKo(code)} 기본 구조`, extra, `${code}`));
  blocks.push(textBlock(`${domainKo(code)} 진단`, d?.verdict, `${code}.verdict`));
  if (d?.level) blocks.push(textBlock(`${domainKo(code)} 국면`, d.level, `${code}.level`));
  if (code === 'HEALTH') {
    blocks.push(textBlock('생활관리 안내', d?.medicalDisclaimer || '명리학적 건강 안내는 오행의 왕쇠와 조화에 기초한 일상 컨디션 조절 참고용이며, 질병의 진단이나 의학적 치료를 대체하지 않습니다.', 'HEALTH.medicalDisclaimer'));
  }
  return blocks;
}

/** 현재 고민 영역이 해당 영역일 때만 사용할 수 있는 근거 블록 */
export function primaryDomainEvidenceBlocks(cr: CommonResultData, code: TopicCode): OutputBlock[] {
  if (!isPrimaryDomain(cr, code)) {
    return [
      missingBlock(
        'text',
        `${domainKo(code)} 영역 맞춤 근거`,
        'evidence',
        `현재 고민은 ${domainKo(cr.classification?.primaryDomain)} 영역으로 분류되어, ${domainKo(code)} 영역의 맞춤 근거는 별도로 생성되지 않았습니다.`
      ),
    ];
  }
  const ev = cr.evidence;
  return [
    listBlock('타고난 성향', (ev?.supportingEvidences || []).map((e: any) => e?.innateTendency), 'evidence.supportingEvidences.innateTendency', 3),
    listBlock('현재 고민과의 연결', (ev?.supportingEvidences || []).map((e: any) => e?.relevanceToConcern), 'evidence.supportingEvidences.relevanceToConcern', 3),
    listBlock('완충·보완 요소', ev?.conflictingOrBufferingSignals, 'evidence.conflictingOrBufferingSignals', 3),
    textBlock('반복되는 갈등 패턴', ev?.eventPattern, 'evidence.eventPattern'),
  ];
}

// ============================================================================
// 3. 관계 (합·충·형·파·해)
// ============================================================================
function relationLink(cr: CommonResultData, item: any): string {
  const ctx: any[] = Array.isArray(cr.event?.timeAxisContext) ? cr.event.timeAxisContext : [];
  const labels = [item?.standardLabel, item?.relationName].filter(Boolean);
  for (const c of ctx) {
    const rl: string[] = Array.isArray(c?.relationLabels) ? c.relationLabels : [];
    if (rl.some((l) => labels.some((x: string) => l.includes(String(x).replace(/\s*×\s*\d+/, ''))))) {
      return cx(c?.roleDescription);
    }
  }
  return '';
}

export function relationFactsBlock(cr: CommonResultData): OutputBlock {
  const r = cr.modules['RELATION'];
  if (!r) return missingBlock('facts', '원국 관계 요약', 'RELATION');
  const j = (a: unknown) => (Array.isArray(a) ? (a.length ? a.join(', ') : '없음') : '');
  return factsBlock(
    '원국 관계 요약',
    [
      { label: '합(육합·삼합·반합·방합)', value: [r.sixHarmonies, r.samhaps, r.banhaps, r.banghaps].every((a) => Array.isArray(a)) ? ([...r.sixHarmonies, ...r.samhaps, ...r.banhaps, ...r.banghaps].join(', ') || '없음') : '' },
      { label: '충', value: j(r.clashes) },
      { label: '형', value: Array.isArray(r.punishments) && Array.isArray(r.selfPunishments) ? ([...r.punishments, ...r.selfPunishments].join(', ') || '없음') : '' },
      { label: '파', value: j(r.destructions) },
      { label: '해', value: j(r.harms) },
      { label: '원진·귀문', value: Array.isArray(r.wonjins) && Array.isArray(r.gwimuns) ? ([...r.wonjins, ...r.gwimuns].join(', ') || '없음') : '' },
      { label: '천간 합·충', value: Array.isArray(r.stemCombinations) && Array.isArray(r.stemClashes) ? ([...r.stemCombinations, ...r.stemClashes].join(', ') || '없음') : '' },
    ],
    'RELATION'
  );
}

export function relationTable(cr: CommonResultData, withLink: boolean): OutputBlock {
  const items: any[] = cr.modules['RELATION']?.standardItems;
  if (!Array.isArray(items)) return missingBlock('table', '원국 관계 상세', 'RELATION.standardItems');
  if (items.length === 0) {
    return missingBlock('table', '원국 관계 상세', 'RELATION.standardItems', '원국에서 감지된 합·충·형·파·해 관계가 없습니다.');
  }
  const pillars = cr.pillars || {};
  const rows = items.map((it) => {
    const parts: string[] = Array.isArray(it.participants) ? it.participants : [];
    const hanja: string[] = Array.isArray(it.participantsHanja) ? it.participantsHanja : [];
    const where = POS_ORDER
      .filter(([k]) => pillars[k] && parts.includes(pillars[k].branch))
      .map(([, label]) => label)
      .join('·');
    const base = [
      it.relationName,
      parts.map((p, i) => (hanja[i] ? `${p}(${hanja[i]})` : p)).join('·'),
      where || '—',
      it.traditionalMeaning,
    ];
    return withLink ? [...base, relationLink(cr, it) || '—'] : base;
  });
  const headers = ['관계', '구성', '위치', '의미'];
  if (withLink) headers.push('현재 고민과의 연결');
  return tableBlock('원국 관계 상세', headers, rows, 'RELATION.standardItems');
}

export function relationLinkNote(cr: CommonResultData): OutputBlock {
  const items: any[] = cr.modules['RELATION']?.standardItems || [];
  const linked = items.some((it) => relationLink(cr, it));
  if (linked) return textBlock('관계와 현재 고민의 연결', cr.event?.practicalExplanation, 'event.practicalExplanation');
  return missingBlock(
    'text',
    '관계와 현재 고민의 연결',
    'event.timeAxisContext',
    '엔진이 원국 관계를 현재 고민과 직접 연결한 근거를 제공하지 않았습니다.'
  );
}

// ============================================================================
// 4. 마·살
// ============================================================================
export function sinsalBlocks(cr: CommonResultData): OutputBlock[] {
  const s = cr.modules['SINSAL'];
  const items: any[] = s?.items;
  const table = Array.isArray(items) && items.length
    ? tableBlock(
        '원국에서 감지된 살',
        ['이름', '위치', '위험 점수', '도움 점수', '기준'],
        items.map((it) => [
          it.name,
          (Array.isArray(it.locations) ? it.locations : []).map(locKo).join('·'),
          typeof it.riskScore === 'number' ? `${it.riskScore}` : '',
          typeof it.supportScore === 'number' ? `${it.supportScore}` : '',
          basisKo(it.basis),
        ]),
        'SINSAL.items'
      )
    : missingBlock('table', '원국에서 감지된 살', 'SINSAL.items');
  return [
    table,
    listBlock('길한 작용', s?.auspicious, 'SINSAL.auspicious'),
    listBlock('주의가 필요한 작용', s?.challenging, 'SINSAL.challenging'),
  ];
}

export function magaBlocks(cr: CommonResultData): OutputBlock[] {
  const m = cr.modules['MAGA_DIAGNOSIS'];
  if (!m) return [missingBlock('facts', '마(魔) 진단', 'MAGA_DIAGNOSIS')];
  return [
    factsBlock(
      '① 마·살 감지 및 관련 영역',
      [
        { label: '작용 영역', value: domainKo(m.category) },
        { label: '감지된 마의 유형', value: m.maType },
        { label: '영향 민감도', value: SEVERITY_KO[m.severity] || '보통' },
      ],
      'MAGA_DIAGNOSIS.category',
      undefined,
      'malsal'
    ),
    textBlock(
      '② 원국 명리 구조와의 결합 기전 (근거)',
      m.rootCause ? `원국의 취약 오행 및 대운 기운과 결합: ${m.rootCause}` : '',
      'MAGA_DIAGNOSIS.rootCause',
      undefined,
      'malsal'
    ),
    textBlock(
      '③ 현실에서 나타날 수 있는 마찰 양상',
      m.punchline,
      'MAGA_DIAGNOSIS.punchline',
      undefined,
      'event'
    ),
  ];
}

// ============================================================================
// 5. 시간축 (대운 / 세운 / 월별)
// ============================================================================
export function daewunBlocks(cr: CommonResultData): OutputBlock[] {
  const d = cr.modules['DAEWUN'];
  const cur = d?.currentDaewoon;
  const nxt = d?.nextDaewoon;
  return [
    factsBlock(
      '현재 대운',
      [
        { label: '대운 간지', value: cur?.ganji },
        { label: '나이 구간', value: cur ? `${cur.startAge}세 ~ ${cur.endAge}세` : '' },
        { label: '기간', value: cur ? `${cur.startDate} ~ ${cur.endDate}` : '' },
        { label: '진행 방향', value: d?.direction },
        { label: '대운수', value: typeof d?.daewoonNumber === 'number' ? `${d.daewoonNumber}` : '' },
      ],
      'DAEWUN.currentDaewoon'
    ),
    factsBlock(
      '다음 대운',
      [
        { label: '대운 간지', value: nxt?.ganji },
        { label: '나이 구간', value: nxt ? `${nxt.startAge}세 ~ ${nxt.endAge}세` : '' },
        { label: '시작', value: nxt?.startDate },
      ],
      'DAEWUN.nextDaewoon'
    ),
    textBlock('대운 해설', d?.summary, 'DAEWUN.summary'),
  ];
}

export function daewunLuckActivation(cr: CommonResultData): OutputBlock {
  return textBlock('대운·세운과 원국의 작용', cr.integrated?.chainAnalysis?.luckActivation, 'integrated.chainAnalysis.luckActivation');
}

export function yearBlocks(flow: YearFlow | undefined, label: string): OutputBlock[] {
  if (!flow) return [missingBlock('facts', label, 'yearFlows')];
  return [
    factsBlock(
      `${flow.year}년 개요`,
      [
        { label: '세운 간지', value: flow.ganji },
        { label: '부담이 큰 구간', value: flow.peakPeriod },
        { label: '완화 구간', value: flow.reliefPeriod },
        { label: '회복 구간', value: flow.recoveryPeriod },
      ],
      `SEUN(${flow.year})`
    ),
    textBlock(`${flow.year}년 해설`, flow.summary, `SEUN(${flow.year}).summary`),
  ];
}

export function monthlyTable(flow: YearFlow | undefined, relationFocus: boolean): OutputBlock {
  if (!flow || !flow.monthly.length) {
    return missingBlock('table', `${flow?.year ?? ''}년 월별 흐름`, 'yearFlows.monthly');
  }
  if (relationFocus) {
    if (!flow.relationsAvailable) {
      return {
        ...tableBlock(
          `${flow.year}년 월별 흐름`,
          ['월', '흐름', '근거'],
          flow.monthly.map((m) => [m.label, m.flow, m.basis]),
          `SEUN(${flow.year}).monthlyTimeline`
        ),
        missingReason: undefined,
      };
    }
    return tableBlock(
      `${flow.year}년 월별 흐름과 원국 관계`,
      ['월', '흐름', '원국과의 관계', '근거'],
      flow.monthly.map((m) => [m.label, m.flow, (m.relationWithNatal || []).join(', ') || '특이 관계 없음', m.basis]),
      'timeAxis.monthlyDynamicFlow'
    );
  }
  return tableBlock(
    `${flow.year}년 월별 흐름`,
    ['월', '흐름', '근거'],
    flow.monthly.map((m) => [m.label, m.flow, m.basis]),
    flow.relationsAvailable ? 'timeAxis.monthlyDynamicFlow' : `SEUN(${flow.year}).monthlyTimeline`
  );
}

export function relationAvailabilityNote(flow: YearFlow | undefined): OutputBlock {
  if (!flow) return missingBlock('text', '월별 원국 관계', 'yearFlows');
  if (flow.relationsAvailable) {
    return { type: 'text', label: '월별 원국 관계', text: `${flow.year}년은 월별로 원국과 맞닿는 관계를 함께 표시했습니다.`, source: 'timeAxis.monthlyDynamicFlow' };
  }
  return missingBlock(
    'text',
    `${flow.year}년 월별 원국 관계`,
    'timeAxis.monthlyDynamicFlow',
    `엔진이 월별 원국 관계를 제공하는 연도는 현재 연도뿐이라 ${flow.year}년은 월별 흐름만 표시합니다.`
  );
}

export function currentTimeAxisBlocks(cr: CommonResultData): OutputBlock[] {
  const t = cr.timeAxis;
  return [
    textBlock('지나온 흐름', t?.timeline?.pastFlow, 'timeAxis.timeline.pastFlow'),
    textBlock('지금의 국면', t?.timeline?.currentPhase, 'timeAxis.timeline.currentPhase'),
    textBlock('앞으로의 전환', t?.timeline?.futureTransition, 'timeAxis.timeline.futureTransition'),
  ];
}

export function pressureMonthsBlock(flow: YearFlow | undefined): OutputBlock {
  if (!flow) return missingBlock('table', '압박 구간', 'yearFlows');
  const rows = flow.monthly
    .filter((m) => m.flow === '압박')
    .map((m) => [m.label, (m.relationWithNatal || []).join(', ') || '—', m.basis, m.advice]);
  if (!rows.length) {
    return missingBlock('table', `${flow.year}년 압박 구간`, 'timeAxis.monthlyDynamicFlow', `${flow.year}년 월별 흐름에서 압박으로 판정된 달이 없습니다.`);
  }
  return tableBlock(`${flow.year}년 압박 구간`, ['월', '원국과의 관계', '근거', '대응'], rows, 'timeAxis.monthlyDynamicFlow');
}

// ============================================================================
// 6. 현재 문제 / 진단 사슬 / 처방
// ============================================================================
export function currentIssueBlocks(cr: CommonResultData): OutputBlock[] {
  return [
    textBlock('입력한 고민', cr.input.coreTrouble, 'input.coreTrouble'),
    textBlock('가장 알고 싶은 질문', cr.input.desiredQuestion, 'input.desiredQuestion'),
    factsBlock(
      '고민 분류',
      [
        { label: '주요 영역', value: domainKo(cr.classification?.primaryDomain) },
        { label: '세부 유형', value: cr.event?.eventSubType },
        { label: '함께 보이는 영역', value: (cr.classification?.secondaryDomains || []).map(domainKo).join(', ') },
      ],
      'classification'
    ),
    textBlock('핵심 진단', cr.event?.primaryDiagnosis, 'event.primaryDiagnosis'),
  ];
}

export function diagnosisChainBlocks(cr: CommonResultData): OutputBlock[] {
  const ev = cr.evidence;
  const ch = cr.integrated?.chainAnalysis;
  const evidenceSigns = (ev?.supportingEvidences || []).map((e: any) => e?.myeongliSign);
  return [
    listBlock('① 명리 근거', [ch?.coreStructure, ...evidenceSigns], 'integrated.chainAnalysis.coreStructure + evidence.supportingEvidences', 4, undefined, 'fact'),
    textBlock('② 현재 상황', ch?.troubleMapping, 'integrated.chainAnalysis.troubleMapping', undefined, 'event'),
    textBlock('③ 왜 문제가 반복되는가', ev?.eventPattern, 'evidence.eventPattern', undefined, 'event'),
    textBlock('④ 어떤 방향으로 대응해야 하는가', ev?.strategicOrientation || cr.event?.mitigationDirection, 'evidence.strategicOrientation', undefined, 'prescription'),
  ];
}

export function behaviorBlocks(cr: CommonResultData): OutputBlock[] {
  const b = cr.prescription?.behaviorRemedy;
  return [
    listBlock('기본 원칙', b?.corePrinciples, 'prescription.behaviorRemedy.corePrinciples', undefined, undefined, 'prescription'),
    listBlock('꼭 해야 할 일', b?.mustDoRules, 'prescription.behaviorRemedy.mustDoRules', undefined, undefined, 'prescription'),
    listBlock('피해야 할 일', b?.mustAvoidRules, 'prescription.behaviorRemedy.mustAvoidRules', undefined, undefined, 'prescription'),
    textBlock('소통 방식', b?.communicationProtocol, 'prescription.behaviorRemedy.communicationProtocol', undefined, 'prescription'),
  ];
}

export function environmentBlocks(cr: CommonResultData): OutputBlock[] {
  const e = cr.prescription?.environmentRemedy;
  return [
    factsBlock(
      '환경 처방',
      [
        { label: '공간', value: e?.spaceGuidance },
        { label: '방향', value: e?.direction },
        { label: '색', value: Array.isArray(e?.colorTones) ? e.colorTones.join(', ') : '' },
        { label: '소재', value: Array.isArray(e?.materials) ? e.materials.join(', ') : '' },
        { label: '조명·분위기', value: e?.lightingAndAtmosphere },
        { label: '생활 환경', value: e?.lifestyleEnvironment },
        { label: '활동 환경', value: e?.activityEnvironment },
      ],
      'prescription.environmentRemedy',
      undefined,
      'prescription'
    ),
  ];
}

export function scoreBlocks(cr: CommonResultData, mode: 'summary' | 'detail'): OutputBlock[] {
  const s = cr.scores;
  const list = flattenScores(s);
  if (mode === 'summary') {
    return [scoresBlock('기본 점수', [s.overall, s.career, s.money, s.relationship, s.currentIssue], 'scores')];
  }
  return [scoresBlock('점수 상세', list, 'scores')];
}

export function optionBlocks(cr: CommonResultData): OutputBlock {
  const d = cr.prescription?.decisionAnalysis;
  const userFin = cr.input.financialSituation;
  const toOpt = (o: any) => {
    if (!o || !o.optionName) return null;
    let pros = cx(o.pros);
    let burdens = cx(o.risks);
    let conditions = nonEmpty(o.realityCheckConditions);

    if (!userFin?.trim()) {
      conditions = conditions.map((c) =>
        c.replace(/재정\s*버퍼\s*\d+개월\s*확보\s*상태\s*반영/g, '이동 전 비상 자금 확보 여부 점검')
      );
    }

    return {
      name: cx(o.optionName),
      pros,
      burdens,
      conditions,
    };
  };

  return optionsBlock(
    '선택지 비교',
    [toOpt(d?.optionA_maintain), toOpt(d?.optionB_move)],
    'prescription.decisionAnalysis',
    '현재 고민 영역에서 엔진이 선택지 비교를 제공하지 않았습니다.'
  );
}

export function rsk(v: unknown): string {
  return RISK_KO[String(v)] || '';
}

export function executionPlanBlocks(cr: CommonResultData): OutputBlock[] {
  const ex = cr.prescription?.executionRoadmap;
  if (!ex) return [missingBlock('list', '4주 실행 계획', 'prescription.executionRoadmap')];
  return [
    listBlock('최우선 실행 순위', ex.priorities, 'prescription.executionRoadmap.priorities', undefined, undefined, 'prescription'),
    listBlock('1~2주차 실행 계획 (단기 집중)', ex.shortTermPlan, 'prescription.executionRoadmap.shortTermPlan', undefined, undefined, 'prescription'),
    listBlock('3~4주차 실행 계획 (확장 및 안정)', ex.midTermPlan, 'prescription.executionRoadmap.midTermPlan', undefined, undefined, 'prescription'),
    listBlock('실행 점검 체크리스트', ex.actionChecklist, 'prescription.executionRoadmap.actionChecklist', undefined, undefined, 'prescription'),
  ];
}

export function choiceCriteriaBlocks(cr: CommonResultData): OutputBlock[] {
  const d = cr.prescription?.decisionAnalysis;
  const p = cr.prescription?.protocolResult;
  const blocks: OutputBlock[] = [];
  if (d?.timeAxisAlignment) {
    blocks.push(textBlock('시기적 적합도', d.timeAxisAlignment, 'prescription.decisionAnalysis.timeAxisAlignment', undefined, 'decision'));
  }
  if (d?.firstPriorityAction) {
    blocks.push(textBlock('최우선 의사결정 기준', d.firstPriorityAction, 'prescription.decisionAnalysis.firstPriorityAction', undefined, 'decision'));
  }
  if (p?.orgCultureCriteria) {
    const oc = p.orgCultureCriteria;
    if (oc.avoidCultureTypes?.length) {
      blocks.push(listBlock('피해야 할 환경 유형', oc.avoidCultureTypes, 'prescription.protocolResult.orgCultureCriteria.avoidCultureTypes', undefined, undefined, 'prescription'));
    }
    if (oc.recommendedCultureTypes?.length) {
      blocks.push(listBlock('나에게 맞는 권장 환경 유형', oc.recommendedCultureTypes, 'prescription.protocolResult.orgCultureCriteria.recommendedCultureTypes', undefined, undefined, 'prescription'));
    }
    if (oc.interviewCheckpoints?.length) {
      blocks.push(listBlock('의사결정 시 검증 질문', oc.interviewCheckpoints, 'prescription.protocolResult.orgCultureCriteria.interviewCheckpoints', undefined, undefined, 'decision'));
    }
  }
  if (blocks.length === 0) {
    blocks.push(missingBlock('text', '앞으로의 선택 기준', 'prescription.decisionAnalysis'));
  }
  return blocks;
}

export function finalDiagnosisBlocks(cr: CommonResultData): OutputBlock[] {
  const ch = cr.integrated?.chainAnalysis;
  return [
    textBlock('핵심 판단 결론', cr.event?.primaryDiagnosis, 'event.primaryDiagnosis', undefined, 'event'),
    textBlock('현실 문제와 명리 작용의 연결', cr.event?.practicalExplanation, 'event.practicalExplanation', undefined, 'interpretation'),
    textBlock('발생 기전 및 인과 관계 (사건 메커니즘)', ch?.eventMechanism, 'integrated.chainAnalysis.eventMechanism', undefined, 'event'),
    textBlock('궁극적 해결 방향', cr.evidence?.strategicOrientation || cr.event?.mitigationDirection, 'evidence.strategicOrientation', undefined, 'prescription'),
  ];
}
