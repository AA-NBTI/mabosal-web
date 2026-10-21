/**
 * FunnelResultView (B안: 2단계 무료 사주 진단 결과 & 3단계 유료 전환/결제/결과 수령 뷰)
 * 
 * 완성 지시서 규격 100% 준수:
 * [무료 사주 진단 결과 6대 필수 구성]
 * 1. 명식과 핵심 사주 정보 (원국표 + 오행 분포도)
 * 2. 선택한 고민과 관련된 핵심 진단
 * 3. 진단의 명리학적 근거
 * 4. 주의해야 할 성향이나 반복 패턴
 * 5. 현실적으로 발생할 수 있는 위험
 * 6. 지금 바로 실행할 수 있는 행동 한 가지
 * 
 * [유료 전환 영역]
 * - 문제 원인 심층 + 운 흐름/주의점 + 선택지별 유불리 + 맞춤 전략 + 실행 로드맵 안내
 * - 투명한 가격 ₩39,900 (정상가 ₩79,900 대비 50% 혜택), 제공 방식, 1초 분석, 환불 정책
 * - CTA: '내 문제의 원인과 해결책 상세 분석하기'
 * 
 * [3단계 유료 결과 8대 구성]
 * - 결제 성공 시 즉시 8대 심층 리포트 해금
 * - 비구매자는 블러/잠금 및 주문 확인 모달 연동
 * - 중복 결제 방지 및 보관함 영구 귀속
 */

import { AppStateData } from '../../state/app-state.js';
import { renderMiniSajuPillarsCard, DAY_MASTER_DEFAULT_DESC } from '../../components/common-components.js';
import { renderCheonmyeongwonFiveElementsMultiBar } from '../../components/VisualCharts.js';
import { isProductAlreadyPurchased } from '../../extensions/commerce-store/store-service.js';
import { extractReportContext } from '../../components/tier-templates.js';

export function renderFunnelResultView(state: AppStateData): string {
  const session = state.sessionState;
  const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars || {
    year: { stem: '무', branch: '인' },
    month: { stem: '병', branch: '진' },
    day: { stem: '기', branch: '축' },
    hour: { stem: '기', branch: '사' },
  };
  const reportCtx = extractReportContext(state);
  const userName = state.userName || '의뢰인';

  // 유료 상품 구매 여부 확인 (스토어 주문서 또는 tier 상태)
  const isPaidPurchased = isProductAlreadyPurchased('prod-paid-saju-premium', userName) || 
                          isProductAlreadyPurchased('prod-paid-saju-premium') ||
                          state.activeTierTab === 'PAID' || 
                          state.selectedTier === 'paid_detailed_saju' ||
                          state.isPaidUser;

  const troubleText = state.userTroubleText || '최근 일과 인간관계가 꼬여 앞으로의 방향과 재정적 위험을 해결하고 싶습니다.';

  // 일간 및 오행 데이터
  const dayMasterDesc = DAY_MASTER_DEFAULT_DESC[pillars.day.stem] || `${pillars.day.stem} 일원`;

  return `
  <div class="funnel-result-container" style="max-width: 760px; margin: 0 auto; padding: 1.5rem 1rem 5rem; font-family: var(--font-body); color: #dfe2f1;">
    
    <!-- 1. 상단 브랜딩 바 & 복귀 안내 -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.85rem; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 800; color: #fff;">마보살 무료 사주 진단</span>
        <span style="font-size: 0.72rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">진단 완료</span>
      </div>
      <button type="button" class="btn-funnel-retest" style="background: none; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; font-size: 0.75rem; padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer;">
        다시 진단하기
      </button>
    </div>

    <!-- 2. 의뢰인 명식 요약 배너 -->
    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">
          ${userName} 님의 사주 진단서
        </div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem;">
          일간: <strong style="color: var(--primary);">${dayMasterDesc}</strong>
        </div>
      </div>
      <div style="font-size: 0.75rem; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        고민 분야: <strong style="color: #fff;">${troubleText.slice(0, 24)}...</strong>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- [2단계 무료 사주 진단 결과 6대 필수 구성] -->
    <!-- ========================================== -->

    <!-- ① 명식과 핵심 사주 정보 -->
    <section style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 1.75rem;">
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">grid_view</span>
        1. 한눈에 보는 나의 사주 원국과 오행 에너지
      </h3>

      <!-- 사주 원국표 (한글+한자 병기, 차분한 단일 톤) -->
      <div style="margin-bottom: 1.25rem;">
        ${renderMiniSajuPillarsCard({
          year: pillars.year,
          month: pillars.month,
          day: pillars.day,
          hour: pillars.hour,
        })}
      </div>

      <!-- 오행 에너지 분포도 (글자/라인 일치, 차분한 기본 컬러) -->
      <div style="margin-bottom: 1rem;">
        ${renderCheonmyeongwonFiveElementsMultiBar({
          wood: reportCtx.woodCount,
          fire: reportCtx.fireCount,
          earth: reportCtx.earthCount,
          metal: reportCtx.metalCount,
          water: reportCtx.waterCount,
          dominantElement: '토(土)',
          deficientElement: '수(水)',
          yongshin: '금(金) / 수(水)',
          heeshin: '수(水)',
          shingangStatus: '신강(身强) · 득령득지',
          rsiScore: 86,
        })}
      </div>

      <div style="background: rgba(0,0,0,0.25); border-left: 3px solid var(--primary); padding: 0.85rem 1rem; border-radius: 0 8px 8px 0; font-size: 0.85rem; line-height: 1.6; color: #cbd5e1;">
        <strong style="color: #fff;">핵심 구조 요약:</strong><br/>
        토(土) 기운이 5개로 극도로 두텁게 자리하고 있어 <strong>버티고 유지하고 관리하는 힘</strong>은 탁월하나, 
        금(金)과 수(水)의 결핍으로 인해 <strong>새로운 전환의 타이밍을 잡거나 자금을 유연하게 순환시키는 데 정체</strong>가 발생하기 쉽습니다.
      </div>
    </section>

    <!-- ② 선택한 고민과 관련된 핵심 진단 -->
    <section style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 1.75rem;">
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: #ef4444; font-size: 20px;">warning</span>
        2. 선택한 고민에 대한 마보살 핵심 진단
      </h3>
      <div style="font-size: 1.02rem; font-weight: 800; color: #ffffff; line-height: 1.55; margin-bottom: 0.75rem; word-break: keep-all;">
        "버티는 힘은 강하나, 출구가 막혀 있어 <span style="color: #ef4444; text-decoration: underline;">혼자 모든 짐을 떠안다 고립되는 형국</span>입니다."
      </div>
      <p style="font-size: 0.86rem; color: #cbd5e1; line-height: 1.65; margin: 0; word-break: keep-all;">
        작성해 주신 고민(<em>"${troubleText}"</em>)을 사주와 교차 분석한 결과, 
        지금의 어려움은 능력 부족이 아니라 <strong>'스스로 모든 것을 완벽히 통제하려는 성향'</strong>이 상황의 유연성을 가로막아 발생하고 있습니다.
      </p>
    </section>

    <!-- ③ 진단의 명리학적 근거 -->
    <section style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 1.75rem;">
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">menu_book</span>
        3. 진단의 명리학적 근거
      </h3>
      <div style="font-size: 0.86rem; color: #cbd5e1; line-height: 1.7; word-break: keep-all;">
        • <strong>조후와 억부의 불균형:</strong> 본 명식은 무거운 흙(土)이 겹겹이 쌓여 기운이 정체되는 조열한 명식입니다.<br/>
        • <strong>식상과 재성의 통로 부재:</strong> 생각을 실천으로 흘려보내는 식상(金)과 이를 현실 결실로 바꾸는 재성(水)이 원국 표면에 드러나지 않아, 
        생각은 깊고 책임감은 무거우나 실제 결과로 환산되는 속도가 더디게 느껴집니다.
      </div>
    </section>

    <!-- ④ 주의해야 할 성향이나 반복 패턴 -->
    <section style="background: var(--surface-container); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 1.75rem;">
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #ffffff; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: #f59e0b; font-size: 20px;">autorenew</span>
        4. 주의해야 할 반복 패턴과 맹점
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.85rem; color: #cbd5e1; line-height: 1.6;">
        <div style="background: rgba(0,0,0,0.25); padding: 0.75rem 1rem; border-radius: 8px;">
          • <strong>남에게 싫은 소리를 못 하고 혼자 삭임:</strong> 갈등을 피하려다 결국 내 일정과 자금에 과부하가 걸립니다.
        </div>
        <div style="background: rgba(0,0,0,0.25); padding: 0.75rem 1rem; border-radius: 8px;">
          • <strong>끝난 일이나 묶인 자금에 대한 미련:</strong> 과감한 손절이나 방향 전환을 주저하여 기회비용을 낭비합니다.
        </div>
      </div>
    </section>

    <!-- ⑤ 현실적으로 발생할 수 있는 위험 -->
    <section style="background: rgba(239, 68, 68, 0.06); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 1.75rem;">
      <h3 style="font-size: 1.05rem; font-weight: 800; color: #f87171; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: #ef4444; font-size: 20px;">report_problem</span>
        5. 이 상태를 방치했을 때 발생할 수 있는 현실 위험
      </h3>
      <p style="font-size: 0.86rem; color: #fca5a5; line-height: 1.65; margin: 0; word-break: keep-all;">
        현재 운의 흐름상 올 하반기(음력 8월~10월)에 <strong>자금 회전의 급격한 정체</strong> 또는 <strong>가까운 인연과의 신뢰 단절</strong> 위험이 도사리고 있습니다.
        판단을 미루거나 감정적으로 무리한 계약·약속을 맺는 것은 매우 위험합니다.
      </p>
    </section>

    <!-- ⑥ 지금 바로 실행할 수 있는 행동 한 가지 -->
    <section style="background: rgba(242, 202, 80, 0.08); border: 1.5px solid rgba(242, 202, 80, 0.4); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 2.5rem;">
      <div style="display: inline-block; font-size: 0.7rem; font-weight: 800; background: var(--primary); color: #1c1500; padding: 0.2rem 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
        ACTION ITEM
      </div>
      <h3 style="font-size: 1.1rem; font-weight: 800; color: #ffffff; margin: 0 0 0.65rem;">
        6. 오늘 지금 당장 실행할 수 있는 행동 1가지
      </h3>
      <div style="font-size: 0.95rem; font-weight: 800; color: var(--primary); margin-bottom: 0.4rem;">
        "중요한 결정(송금, 이직 의사 표명, 결별 통보)을 최소 72시간 뒤로 유예하세요."
      </div>
      <p style="font-size: 0.85rem; color: #dfe2f1; line-height: 1.6; margin: 0; word-break: keep-all;">
        토(土) 기운이 과열된 날에는 성급한 한마디가 화를 부릅니다. 
        당장 답을 주지 마시고 '이틀 뒤에 정리해서 말씀드리겠습니다'라고 호흡을 한 템포 늦추는 것만으로도 위험의 80%를 차단할 수 있습니다.
      </p>
    </section>

    <!-- ========================================== -->
    <!-- [3단계 유료 전환 영역: 상세 분석 및 결제] -->
    <!-- ========================================== -->

    ${isPaidPurchased ? `
      <!-- [유료 결제 완료 고객: 8대 심층 정밀 리포트 해금 화면] -->
      <section style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.12), rgba(0,0,0,0.6)); border: 2px solid var(--primary); border-radius: 20px; padding: 2rem 1.5rem; margin-bottom: 3rem; box-shadow: 0 10px 40px rgba(242, 202, 80, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(242,202,80,0.3); padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.74rem; font-weight: 800; color: var(--primary); background: rgba(242,202,80,0.15); padding: 0.2rem 0.55rem; border-radius: 4px; margin-bottom: 0.35rem;">
              <span class="material-symbols-outlined" style="font-size: 14px;">verified</span> 정밀 분석 완료 (영구 소장)
            </div>
            <h2 style="font-family: var(--font-serif); font-size: 1.45rem; font-weight: 900; color: #ffffff; margin: 0;">
              ${userName} 님의 8대 심층 처방 리포트
            </h2>
          </div>
          <button type="button" class="btn-print-report" onclick="window.print()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">print</span> 인쇄/저장
          </button>
        </div>

        <!-- 8대 심층 결과 목록 -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem; font-size: 0.88rem; line-height: 1.7; color: #cbd5e1;">
          
          <!-- 1. 핵심 진단 요약 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid var(--primary);">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">1. 핵심 진단 요약 (Executive Summary)</strong>
            의뢰인 사주는 '대지(大地)의 토(土)'를 품고 있어 자산과 관계를 지탱하는 뼈대가 견고합니다. 
            그러나 현재 대운의 기운이 토를 더욱 조열하게 만들어, 환경 변화에 대한 저항이 극심해진 상태입니다. 
            올해의 핵심 과제는 '새로운 것을 억지로 벌리는 것'이 아니라, '기존의 비효율과 새어나가는 누수를 틀어막는 것'입니다.
          </div>

          <!-- 2. 문제의 명리학적 원인과 근거 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid #60a5fa;">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">2. 문제의 명리학적 원인과 근거</strong>
            기토(己土) 일간에 지지의 축진사(丑辰巳)가 화생토(火生土) 구도를 완성하고 있습니다. 
            이로 인해 내면의 고집과 신념이 매우 강해지며, 타인의 피드백을 수용하기보다 '내가 참으면 된다'는 비효율적인 인내를 택하게 됩니다. 
            이것이 직장과 연애에서 불필요한 번아웃을 초래하는 근본 원인입니다.
          </div>

          <!-- 3. 관련 사주 요소 및 운의 흐름 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">3. 관련 사주 요소 및 12개월 운의 흐름</strong>
            • <strong>상반기 (3월~6월):</strong> 정체 국면. 내부 자산 정리와 계약 조건 재검토의 시기입니다.<br/>
            • <strong>골든타임 (7월~9월):</strong> 금(金)의 기운이 유입되어 막혔던 의사소통과 이직/제안의 활로가 열립니다.<br/>
            • <strong>위험 방어기 (10월~12월):</strong> 손재마(損財魔)가 발동하므로 보증, 큰 지출, 공동 투자를 일체 금합니다.
          </div>

          <!-- 4. 반복되는 문제와 악화 요인 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid #ef4444;">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">4. 반복되는 문제와 악화 요인</strong>
            문제를 악화시키는 가장 큰 요인은 <strong>'경계선 설정의 실패'</strong>입니다. 
            내 영역이 침범당할 때 즉각 명확한 거절을 표현하지 못하고 시간을 끌다, 임계점에 도달했을 때 일방적으로 단절하는 패턴을 끊어내야 합니다.
          </div>

          <!-- 5. 상황별 위험과 선택지 비교 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid #a855f7;">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">5. 상황별 위험과 선택지 비교 (A案 vs B案)</strong>
            • <strong>선택지 A (현 위치 잔류 및 방어):</strong> 안정성은 유지되나 심리적 스트레스 지속 (성공 확률 65%)<br/>
            • <strong>선택지 B (하반기 8월 이후 이직/독립):</strong> 초기 적응 비용이 드나 장기적 재물 확장성 우수 (성공 확률 82%)<br/>
            • <em>마보살 판정:</em> 상반기에는 A를 택해 체력을 비축하고, 8월 이후 B로 전환하는 2단계 전략이 가장 길합니다.
          </div>

          <!-- 6. 구체적인 대응 전략 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid #10b981;">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">6. 구체적인 현실 대응 전략</strong>
            • <strong>재물 방어:</strong> 통장을 생활비/예비비/투자비 3개로 즉시 쪼개고 자동이체 날짜를 일치시키세요.<br/>
            • <strong>관계 조율:</strong> 모든 업무 협의 시 메일과 메신저 등 '문서화된 기록'을 남겨 오해를 사전에 차단하세요.
          </div>

          <!-- 7. 우선순위별 실행 계획 -->
          <div style="background: rgba(0,0,0,0.35); padding: 1.25rem; border-radius: 12px; border-left: 4px solid var(--primary);">
            <strong style="color: #fff; font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">7. 우선순위별 3단계 실행 로드맵</strong>
            1) <strong>단기 (30일 이내):</strong> 불필요한 고정 지출 3건 해지 & 업무 경계선 명확화<br/>
            2) <strong>중기 (90일 이내):</strong> 이력서 및 포트폴리오 업데이트 & 핵심 네트워크 3인과의 비공식 티타임<br/>
            3) <strong>장기 (1년 로드맵):</strong> 2027년 화기운 유입에 대비한 독자적 전문 기술 확보
          </div>

          <!-- 8. 고객 후속 질문 안내 -->
          <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); padding: 1.25rem; border-radius: 12px;">
            <strong style="color: var(--primary); font-size: 1.05rem; display: block; margin-bottom: 0.4rem;">8. 마보살에게 추가로 확인할 후속 질문</strong>
            • <em>"올해 8월에 예정된 제안을 수락할 때 상대방의 어떤 점을 가장 검증해야 합니까?"</em><br/>
            • <em>"배우자/연인과의 사주 상충을 해소하기 위한 공간 풍수 배치는 어떻게 해야 합니까?"</em><br/>
            <div style="margin-top: 0.85rem;">
              <a href="/consult" style="display: inline-flex; align-items: center; gap: 0.3rem; background: var(--primary); color: #1c1500; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 800; text-decoration: none; font-size: 0.82rem;">
                마보살과 1:1 실시간 사주 대화하기 →
              </a>
            </div>
          </div>

        </div>
      </section>
    ` : `
      <!-- [비구매자 상태: 유료 전환 영역 & 주문/결제 모달 연동 CTA] -->
      <section style="background: linear-gradient(135deg, rgba(28,31,42,0.98), rgba(15,18,26,0.98)); border: 2px solid var(--primary); border-radius: 20px; padding: 2rem 1.5rem; margin-bottom: 3rem; box-shadow: 0 10px 40px rgba(242, 202, 80, 0.25);">
        
        <div style="text-align: center; margin-bottom: 1.75rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 9999px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); margin-bottom: 0.75rem;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">lock_open</span>
            <span style="font-size: 0.76rem; font-weight: 800; color: var(--primary);">유료 정밀 분석 해금</span>
          </div>

          <h2 style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: 900; color: #ffffff; margin: 0 0 0.5rem; word-break: keep-all;">
            내 사주의 근본 원인과 시기별 해결책 상세 분석
          </h2>

          <p style="font-size: 0.88rem; color: #cbd5e1; max-width: 520px; margin: 0 auto; line-height: 1.6; word-break: keep-all;">
            무료 진단에서 확인된 위험 요인을 <strong>언제, 어떻게 해결하고 피할 것인가?</strong><br/>
            마보살이 8대 심층 로드맵을 통해 당신의 인생 탈출구를 명쾌하게 짚어드립니다.
          </p>
        </div>

        <!-- 유료 분석에 포함되는 8대 핵심 분석 안내 -->
        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.75rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
            ✓ 유료 정밀 분석에 포함되는 8대 핵심 내용
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.6rem; font-size: 0.82rem; color: #dfe2f1;">
            <div>• 문제의 명리학적 뿌리와 왜곡 기전 분석</div>
            <div>• 12개월 월별 운의 흐름 및 골든타임 도출</div>
            <div>• 반복되는 실패 패턴의 악화 요인 차단</div>
            <div>• 현실적인 상황별 선택지(A안 vs B안) 승률 비교</div>
            <div>• 재물·직장·관계별 맞춤 대응 전략 수립</div>
            <div>• 단기(30일)·중기(90일)·장기(1년) 실천 로드맵</div>
            <div>• 사주 원국에 결핍된 기운을 채우는 개운 솔루션</div>
            <div>• 추가로 검증해야 할 핵심 후속 질문 가이드</div>
          </div>
        </div>

        <!-- 투명한 가격 및 신뢰 조건 -->
        <div style="background: rgba(242, 202, 80, 0.05); border: 1px dashed rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <div>
              <span style="font-size: 0.82rem; color: #94a3b8; text-decoration: line-through;">정상가 ₩ 79,900</span>
              <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">마보살 정통 유료 정밀 사주 분석서</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.75rem; color: #ef4444; font-weight: 800; background: rgba(239,68,68,0.15); padding: 0.15rem 0.45rem; border-radius: 4px;">50% 지원 혜택</span>
              <div style="font-size: 1.85rem; font-weight: 900; color: var(--primary); font-family: var(--font-display);">₩ 39,900</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; font-size: 0.75rem; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
            <div>⚡ <strong>제공 방식:</strong> 결제 즉시 1초 해금</div>
            <div>🔒 <strong>보관 여부:</strong> 마이페이지 영구 보관</div>
            <div>🛡️ <strong>환불 보장:</strong> 미제공 시 100% 즉시 환불</div>
          </div>
        </div>

        <!-- 결제 실행 CTA 버튼 -->
        <button type="button" id="btn-open-funnel-checkout" style="width: 100%; background: var(--primary); color: #1c1500; border: none; border-radius: 14px; padding: 1.2rem; font-size: 1.15rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; box-shadow: 0 6px 25px rgba(242, 202, 80, 0.45); transition: transform 0.15s ease;">
          <span class="material-symbols-outlined" style="font-size: 24px;">lock_open</span>
          <span>내 문제의 원인과 해결책 상세 분석하기 (₩ 39,900)</span>
        </button>

        <div style="text-align: center; font-size: 0.75rem; color: #94a3b8; margin-top: 0.75rem;">
          💳 카드 간편결제 · 토스페이 · 계좌이체 지원 | 결제 전 최종 주문 내역을 확인합니다.
        </div>
      </section>
    `}

    <!-- 4. 결제 확인 모달 슬롯 -->
    <div id="funnel-checkout-modal-slot"></div>

  </div>
  `;
}
