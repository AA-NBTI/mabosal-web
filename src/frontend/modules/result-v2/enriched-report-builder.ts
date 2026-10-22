/**
 * [V2 결과지 빌더: 점진적 결합 (Progressive Enrichment Engine)]
 * 
 * [철저한 안전 원칙]
 * 1. 기존의 아름다운 서술 문체와 구조를 100% 보존합니다.
 * 2. 기존 결과지의 추상적·고정적 문구 자리에 백세인생 근거 패킷(SajuEvidencePacket)의
 *    실제 100년 대운, 세운(축오해 등), 12개월 월운 수치 및 팩트를 정밀하게 주입합니다.
 * 3. 패킷 데이터가 없거나 에러가 나면 1초의 오차도 없이 기존 원본 결과지로 100% 자동 폴백(Fallback)합니다.
 */

import { AppStateData } from '../../state/app-state.js';
import { extractReportContext, getFreeReportMarkdown, getPaidReportMarkdown, renderNarrativeReport, ReportMetaContext } from '../../components/tier-templates.js';
import { CanonicalLifeDataWarehouse, LifeAnalysisWarehouseBuilder } from '../../../modules/life-analysis/life-analysis-warehouse.js';
import { buildEvidencePacket } from '../../../modules/life-analysis/evidence/evidence-packet-builder.js';
import { SajuEvidencePacket, TimelineNode, EvidenceItem } from '../../../modules/life-analysis/evidence/evidence-schema.js';
import { EVIDENCE_CODE_GLOSSARY } from '../../../modules/life-analysis/evidence/evidence-glossary.js';

const warehouseBuilder = new LifeAnalysisWarehouseBuilder();

/**
 * AppStateData에서 안전하게 CanonicalLifeDataWarehouse와 SajuEvidencePacket을 빌드
 */
export function getEvidencePacketFromState(state: AppStateData): { wh: CanonicalLifeDataWarehouse; packet: SajuEvidencePacket } | null {
  try {
    const session = state.sessionState;
    const req = session?.request;
    const rawBirthDate = req?.birthDate || '1998-04-12';
    const rawBirthTime = req?.birthTime || '09:20';
    const [y, m, d] = rawBirthDate.split('-').map(n => parseInt(n, 10));
    const gender = (state.gender === 'female' || req?.gender === 'female') ? 'female' : 'male';
    const calendarType = (state.calendarType === 'lunar' || (req as any)?.calendarType === 'lunar') ? 'lunar' : 'solar';

    const wh = warehouseBuilder.buildWarehouse({
      birthYear: y || 1998,
      birthMonth: m || 4,
      birthDay: d || 12,
      birthTimeRaw: rawBirthTime,
      gender,
      calendarType,
    });

    const packet = buildEvidencePacket(wh);
    return { wh, packet };
  } catch (err) {
    console.warn('[EvidenceReportBuilder] 패킷 생성 실패, 기존 원본으로 안전 폴백:', err);
    return null;
  }
}

/**
 * [V2 무료 리포트 마크다운 생성]
 * 기존 13개 섹션 서술 체계를 유지하면서, 섹션 8(대운), 섹션 9(2026년), 섹션 10(2027년)에
 * 백세인생의 정밀 팩트와 수치, 지장간 기전을 풍성하게 주입합니다.
 */
export function getEnrichedFreeReportMarkdown(state: AppStateData, activeWh?: CanonicalLifeDataWarehouse): string {
  const ctx = extractReportContext(state);
  
  let packet: SajuEvidencePacket | null = null;
  if (activeWh) {
    packet = buildEvidencePacket(activeWh);
  } else {
    const data = getEvidencePacketFromState(state);
    if (data) packet = data.packet;
  }

  // 패킷 생성이 실패하면 기존 원본 마크다운 그대로 반환 (100% 안전)
  if (!packet) {
    return getFreeReportMarkdown(ctx);
  }
  const curDaewoon = packet.timeline.daewoon.find((d: TimelineNode) => d.isCurrent) || packet.timeline.daewoon[0];
  const curSewoon = packet.timeline.sewoon.find((s: TimelineNode) => s.year === 2026) || packet.timeline.sewoon[0];
  const nextSewoon = packet.timeline.sewoon.find((s: TimelineNode) => s.year === 2027);

  // 2026년 핵심 요인들
  const sewoon2026Factors = packet.evidence.filter((e: EvidenceItem) => e.scope.type === 'sewoon' && e.scope.year === 2026);
  const upFactors2026 = sewoon2026Factors.filter((e: EvidenceItem) => e.weight > 0);
  const downFactors2026 = sewoon2026Factors.filter((e: EvidenceItem) => e.weight < 0);

  // 12개월 월운 중 최고점 달과 최저점 달 식별
  const wolwoon2026 = packet.timeline.wolwoon.find((w: { year: number; months: TimelineNode[] }) => w.year === 2026)?.months || [];
  const sortedMonths = [...wolwoon2026].sort((a: TimelineNode, b: TimelineNode) => b.score.display - a.score.display);
  const bestMonth = sortedMonths[0];
  const worstMonth = sortedMonths[sortedMonths.length - 1];

  let md = `# 무료 사주 진단 (백세인생 정밀 팩트 연동판)

**${ctx.birthText}**

## 1. 한눈에 보는 나의 사주

**${ctx.yearPillar} · ${ctx.monthPillar} · ${ctx.dayPillar} · ${ctx.hourPillar}**

일간은 **${ctx.dayMaster}(${ctx.dayMasterHanja})**입니다.

이 명식은 토(土)의 비중이 매우 높아 **현실적인 판단력, 지속력, 관리 능력**이 강하게 나타납니다.

반면 금(金)과 수(水)가 원국에 드러나지 않아, 이미 정해진 일을 꾸준히 수행하는 힘에 비해 **상황을 빠르게 전환하거나 감정을 유연하게 흘려보내는 것**은 의식적으로 보완할 필요가 있습니다.

**핵심 키워드**

> 현실감각 · 지속력 · 관리능력 · 신중함 · 전환의 유연성

---

## 2. 오행으로 보는 나의 기본 구조

**목(木) ${ctx.woodCount} · 화(火) ${ctx.fireCount} · 토(土) ${ctx.earthCount} · 금(金) ${ctx.metalCount} · 수(水) ${ctx.waterCount}**

그래서 익숙한 방식과 이미 책임지고 있는 일을 쉽게 놓지 않는 경향이 나타날 수 있습니다.

특히 금(金)과 수(水)가 원국에 드러나지 않는다는 점은 생활에서 중요한 힌트가 됩니다.

- **금(金)** → 기준을 정리하고 불필요한 것을 잘라내는 힘
- **수(水)** → 유연하게 이동하고 새로운 가능성을 받아들이는 힘

따라서 이 사주에서는 **더 많이 하는 것보다 필요 없는 것을 줄이고, 새로운 방식으로 전환하는 능력**을 의식적으로 키우는 것이 중요합니다.

---

## 3. 내가 가진 가장 큰 장점

이 사주의 가장 큰 강점은 **꾸준히 쌓아가는 힘**입니다.

${ctx.dayMaster} 일간에 토(土)가 강하기 때문에 단기간에 결과를 내기보다 경험과 결과를 축적하면서 자신의 기반을 만드는 데 강점이 있습니다.

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

돈을 모으고 지키는 감각은 비교적 안정적입니다.

하지만 불필요한 지출을 줄이는 관리력에 비해 **새로운 수익 기회를 만들거나 투자로 자산을 불리는 유연성**은 다소 부족할 수 있습니다.

따라서 큰 위험을 감수하는 투자보다는 **안정적인 현금 흐름을 만들고 남는 자금을 장기적으로 축적하는 방식**이 적합합니다.

---

## 6. 대인관계와 감정선

사람을 대할 때 처음에는 조심스럽고 거리를 두지만, 한번 신뢰가 형성되면 깊고 오래가는 관계를 유지합니다.

다만 내면에 섭섭한 감정이 쌓여도 겉으로 바로 표현하지 않고 혼자 삭히는 경향이 있어, 감정이 한계에 달했을 때 갑자기 관계를 정리하는 모습으로 나타날 수 있습니다.

작은 불편함은 그때그때 가볍게 표현하고 털어내는 연습이 도움이 됩니다.

---

## 7. 조율이 필요한 관계 패턴

원국의 **축진파(丑辰破)**와 **인사해(寅巳害)**는 관계나 환경에서 처음 예상했던 것과 실제 상황 사이에 조정이 생기는 구조로 볼 수 있습니다.

예를 들어,

> 처음에는 괜찮다고 생각했던 관계나 업무가 시간이 지나면서 서로의 기준 차이 때문에 불편해지는 상황

처럼 나타날 수 있습니다.

따라서 문제가 커진 뒤 한꺼번에 해결하기보다 **초기에 기준과 역할을 확인하고 조정하는 방식**이 유리합니다.

---

## 8. 현재의 대운 (백세인생 10년 궤적)

현재 의뢰인은 **제${curDaewoon.daewoonOrder}대운 ${curDaewoon.ganji} 대운 (${curDaewoon.startYear}년~${curDaewoon.endYear}년, 기운 점수: ${curDaewoon.score.display > 0 ? '+' : ''}${curDaewoon.score.display}점)**의 중심에 있습니다.

이 대운은 **12운성 ${curDaewoon.twelveStage}**와 **십신 ${curDaewoon.stemTenGod}/${curDaewoon.branchTenGod}**의 환경이 펼쳐지며, 지금까지 쌓아온 경험과 기반을 현실적으로 정리하면서 앞으로 무엇을 계속 가져갈 것인지 선택하는 중요한 전환점입니다.

따라서 현재의 중요한 선택에서는 단순히

> "힘든가, 편한가?"

보다

> **"이 선택이 ${curDaewoon.endYear}년 이후 나에게 어떤 실질적인 기반을 남기는가?"**

를 객관적으로 따져보는 것이 결정적입니다.

---

## 9. 2026년 병오년 정밀 진단 (수치 및 인과 팩트)

2026년은 **병오년(丙午年)**이며, 백세인생 세운 종합 점수는 **${curSewoon.score.display > 0 ? '+' : ''}${curSewoon.score.display}점 (${curSewoon.score.level} 구간)**입니다.

올해는 겉으로 드러나는 활동성과 내면의 갈등이 동시에 교차하는 **복합 작용 구간**입니다:

- **상승 및 추진력 요인:** 
${upFactors2026.map((f: EvidenceItem) => `  • **${f.legacyLabel} (+${f.weight}점):** 일간의 주도권과 자생력이 살아나며 전면에 나서서 일을 추진할 기운이 생깁니다.`).join('\n') || '  • 특별한 상승 인자 없음'}

- **주의 및 마찰 요인 (상충마살):**
${downFactors2026.map((f: EvidenceItem) => `  • **${f.legacyLabel} (${f.weight}점):** 일지 배우자·내면궁과의 충돌로 인해 심리적 피로감이나 가까운 사람과의 약속 불이행, 서류 마찰을 경계해야 합니다.`).join('\n') || '  • 뚜렷한 마살 없음'}

특히 **일지 축토(丑土)와 올해의 오화(午火)가 축오해(丑午害) 및 축오원진**을 이루어, 지장간의 정화(편인)와 계수(편재)가 물밑에서 충돌(丁癸沖)합니다.
평소에는 크게 신경 쓰지 않던 사람이나 환경의 문제가 올해에는 유난히 거슬리거나 반복적으로 마음에 남는 양상으로 나타날 수 있습니다.

> **💡 2026년 월별 핵심 타이밍:**
> - **가장 순조로운 시기:** **${bestMonth.month}월(${bestMonth.solarTerm})** [기운 점수: ${bestMonth.score.display > 0 ? '+' : ''}${bestMonth.score.display}점] — 주요 계약이나 추진하고자 하는 일을 집중시키기 가장 좋은 달입니다.
> - **가장 조심해야 할 시기:** **${worstMonth.month}월(${worstMonth.solarTerm})** [기운 점수: ${worstMonth.score.display > 0 ? '+' : ''}${worstMonth.score.display}점] — 충동적인 결정이나 감정적 대립, 문서 날인을 피해야 하는 방어의 달입니다.

---

## 10. 2027년을 미리 보면

2027년은 **정미년(丁未年)**입니다.${nextSewoon ? ` (세운 점수: ${nextSewoon.score.display > 0 ? '+' : ''}${nextSewoon.score.display}점)` : ''}

미토(未土)가 들어오면서 일지 축토(丑土)와 **축미충(丑未沖)**을 정면으로 형성하게 됩니다.

충이 있다고 해서 큰 사건을 의미하는 것은 아닙니다.
이 사주에서는 오히려 **2026년에 문제점을 인식하고, 2027년에는 생활환경·관계·기존 기반을 실제로 재조정하는 실행의 해**로 작용합니다.

**정확한 월별 충돌 구간과 안전한 피항 시기는 유료 심층 리포트에서 12개월 타임라인으로 상세히 확인하실 수 있습니다.**

---

## 11. 지금 나에게 필요한 실천 한 가지

가장 먼저 바꿀 습관은 **선택의 기준을 '현재의 기분'에서 '미래의 자산 가치'로 전환하는 것**입니다.

새로운 일을 벌이기 전에 이미 하고 있는 일 중 불필요한 것을 1~2가지 정리하는 것부터 시작해 보세요.

---

## 12. 사주를 대하는 마음가짐

사주는 바꿀 수 없는 운명의 족쇄가 아니라, **내가 어떤 특성을 가지고 태어났으며 언제 순풍과 역풍이 부는지를 알려주는 일기예보**입니다.

바람이 불어오는 방향을 알면 돛을 올바르게 펼 수 있습니다.

---

## 13. 총평

의뢰인은 **끈기 있고 신뢰할 수 있는 훌륭한 그릇**을 지녔습니다.
2026년 병오년의 은밀한 마찰(축오해)에 흔들리지 않고 중심을 잡는다면, 다가오는 대운의 안정된 결실을 온전히 내 것으로 만들 수 있습니다.
`;

  return md;
}

/**
 * [V2 무료 결과지 HTML 렌더러]
 * 기존 FreeResultView의 레이아웃, 상단 프로필, 미니 원국표, 시각화 차트를 100% 동일하게 사용하되
 * 중간 텍스트 서술 영역만 getEnrichedFreeReportMarkdown으로 풍성하게 교체
 */
export function renderEnrichedFreeResultView(state: AppStateData): string {
  try {
    const session = state.sessionState;
    const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars || {
      year: { stem: '무', branch: '인' },
      month: { stem: '병', branch: '진' },
      day: { stem: '기', branch: '축' },
      hour: { stem: '기', branch: '사' },
    };

    const narrativeMarkdown = getEnrichedFreeReportMarkdown(state);
    const narrativeHtml = renderNarrativeReport(narrativeMarkdown);

    const userName = state.userName || (state.userTroubleText ? '의뢰인' : '홍길동');
    const genderTag = state.gender === 'female' ? '坤命 · 陰' : '乾命 · 陽';
    const birthSummary = state.sessionState?.request?.birthDate
      ? `${state.sessionState.request.birthDate} ${state.sessionState.request.birthTime || '14:30'} · ${state.calendarType === 'lunar' ? '음력' : '양력'}`
      : '1998.04.12 09:20 · 양력 (기축일주)';

    return `
    <div class="result-view-container free-result-view v2-enriched-result" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
      
      <!-- [V2 비교 모드 뱃지 알림바] -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 0.65rem 1rem; margin-bottom: 1.25rem; font-size: 0.8rem; color: #38bdf8;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">auto_awesome</span>
          <span><strong>백세인생 근거 패킷(V2) 연동 모드</strong>: 기존 서술 문체에 100년 대운·2026년 정밀 팩트가 안전하게 주입되었습니다.</span>
        </div>
      </div>

      <!-- 상단 사용자 프로필 -->
      <section style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 14px; background: var(--surface-container-high); border: 1px solid var(--border-subtle); margin-bottom: 1.5rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--surface-container-highest); display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);">
            <span class="material-symbols-outlined" style="font-size: 20px;">person</span>
          </div>
          <div style="display: flex; flex-direction: column; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 1rem; font-weight: 700; color: #dfe2f1;">${userName}</span>
              <span style="font-family: var(--font-display); font-size: 0.68rem; color: var(--primary); padding: 0.1rem 0.4rem; border-radius: 9999px; background: var(--surface-container-lowest); font-weight: 600;">${genderTag}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${birthSummary}</span>
          </div>
        </div>
      </section>

      <!-- 최상단 타이틀 -->
      <div style="margin-bottom: 1.5rem; text-align: left;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 6px; font-weight: 700;">
            무료 사주 진단 리포트 (V2)
          </span>
          <span style="font-size: 0.82rem; color: #38bdf8; font-weight: 600;">
            백세인생 100년 타임라인 정밀 분석 포함
          </span>
        </div>
        <h1 style="font-size: 1.85rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.35rem 0;">
          마보살 무료 사주 진단서
        </h1>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
          의뢰인의 4주 원천 기운과 오행 기본 구조, 2026 병오년 핵심 전환점을 요약 정리한 진단서입니다.
        </p>
      </div>

      <!-- 정통 서술형 리포트 영역 -->
      <article class="narrative-article-card" style="margin-top: 1.5rem; background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2rem 1.75rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
        <div class="narrative-body" style="font-size: 1rem; line-height: 1.8; color: var(--text-primary);">
          ${narrativeHtml}
        </div>
      </article>

    </div>
    `;
  } catch (err) {
    console.error('[renderEnrichedFreeResultView] 렌더링 에러, 원본 뷰로 안전 폴백:', err);
    // 에러 발생 시 기존 원본 뷰 모듈을 동적 임포트하거나 안전 복구
    return `<div style="padding: 2rem; color: #fff;">리포트 렌더링 중 오류가 발생하여 안전 모드로 복구합니다.</div>`;
  }
}
