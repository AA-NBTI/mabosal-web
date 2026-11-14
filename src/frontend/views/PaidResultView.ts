/**
 * 유료 사주풀이 — 심층 분석 독립 전용 결과지 화면 (39,900원)
 * - 4주 8자 만세력 미니 원국 카드 (Trust Anchor)
 * - 18개 심층 서술형 섹션 (12개월 월운, 3개년 직업/재물/연애, 금수 일상 처방)
 * - 상충마살 특화 및 1:1 상담 연결 CTA
 */

import { AppStateData } from '../state/app-state.js';
import { ModuleRegistry } from '../state/module-registry.js';
import { UserSajuStore } from '../state/user-saju-store.js';
import { AuthService } from '../state/auth-service.js';
import { canViewTier } from '../modules/entitlement/index.js';
import { ReportRouterMapper } from '../modules/checkout/report-router-mapper.js';
import { UserOrderService } from '../modules/order/user-order-service.js';
import { buildDynamicDaewunProps, buildDynamicMonthlyScores, buildDynamicVisualChartProps, extractNarrativeTocItems, extractReportContext, getPaidReportMarkdown, renderNarrativeReport, renderReportTocBox } from '../components/tier-templates.js';
import { renderMiniSajuPillarsCard, renderEmptySajuGuideView } from '../components/common-components.js';
import { renderPdfReportCover } from '../components/PdfPrintCover.js';
import {
 renderDaewunLifeCycleChart,
 renderSplineMonthlyChart,
 renderGoldProgressRing,
 renderCheonmyeongwonLifeAspectsAccordion,
 renderCheonmyeongwonFiveElementsMultiBar,
 renderCheonmyeongwonDayMasterArchetype,
 renderCheonmyeongwonDailyDashboard,
 renderCheonmyeongwonArchiveVault,
} from '../components/VisualCharts.js';

export function renderPaidResultView(state: AppStateData): string {
  // [보안 게이트키퍼] 정식 결제 완료 주문(StoreOrder) 검증
  const hasValidOrder = canViewTier('PAID');

  if (!hasValidOrder) {
    return `
      <div class="result-view-container" style="max-width: 580px; margin: 3rem auto; padding: 2rem 1.5rem; text-align: center;">
        <div style="background: rgba(14, 18, 28, 0.85); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 18px; padding: 3rem 1.5rem; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(242, 202, 80, 0.12); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: var(--primary);">
            <span class="material-symbols-outlined" style="font-size: 32px;">lock</span>
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: #fff; margin: 0 0 0.6rem 0;">
            마보살 정통 유료 사주풀이 (39,900원)
          </h2>
          <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 2rem 0;">
            본 리포트는 18개 전문 섹션과 12개월 월운 전체 해설이 포함되어 있으며, 정식 주문 및 결제 완료 후 열람하실 수 있습니다.
          </p>
          <button type="button" class="btn-select-product" data-tier="PAID" style="width: 100%; padding: 1rem; border-radius: 10px; background: var(--primary); color: #1c1500; font-size: 1.05rem; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 18px rgba(242,202,80,0.35);">
            구매하기
          </button>
        </div>
      </div>
    `;
  }

 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars;
 if (!pillars) {
  return renderEmptySajuGuideView('유료 심층 사주 리포트');
 }

 const reportCtx = extractReportContext(state);
 const narrativeMarkdown = getPaidReportMarkdown(reportCtx);
 const narrativeHtml = renderNarrativeReport(narrativeMarkdown);
 const tocHtml = renderReportTocBox(extractNarrativeTocItems(narrativeMarkdown), '심층 사주풀이 목차');

 const savedProf = UserSajuStore.getProfile();
 const user = AuthService.getCurrentUser();
  const userName = state.userName || savedProf?.userName || (user.role !== 'guest' ? user.name : '의뢰인');
 const curGender = state.gender || savedProf?.gender || 'female';
 const genderTag = curGender === 'female' ? '坤命 · 陰' : '乾命 · 陽';
 const bDate = state.sessionState?.request?.birthDate || savedProf?.solarBirthDate || '1995.04.12';
 const bTime = state.sessionState?.request?.birthTime || savedProf?.birthTime || '09:20';
 const calType = state.calendarType || savedProf?.calendarType || 'solar';
 const birthSummary = `${bDate} ${bTime} · ${calType === 'lunar' ? '음력' : '양력'}`;

 return `
 <div class="result-view-container paid-result-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 ${renderPdfReportCover({
   tierLabel: '유료 심층 분석 · 18 CHAPTERS',
   reportTitle: '마보살 유료 심층 사주풀이',
   reportSubtitle: '격국·용신·신강약 심층 규명, 12개월 월별 상세 운세, 재물·직업·연애 3개년 변화 순서와 실천 행동 처방 완결본입니다.',
   userName,
   genderTag,
   birthSummary,
   dayPillar: `${pillars.day.stem}${pillars.day.branch} 일주`,
   chapterCount: 18,
 })}
 <!-- 최상단 서비스 타이틀 & 다운로드 버튼군 -->
 <div class="no-print" style="margin-bottom: 1.5rem; text-align: left;">
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 6px; font-weight: 700;">
 심층 분석 리포트
 </span>
 <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
 <button class="btn-cta-secondary btn-download-txt" style="padding: 0.4rem 0.85rem; font-size: 0.82rem; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">description</span>
 소장용 TXT 다운로드
 </button>
 <button class="btn-cta-secondary btn-download-pdf" style="padding: 0.4rem 0.85rem; font-size: 0.82rem; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">picture_as_pdf</span>
 PDF 저장
 </button>
 
 </div>
 </div>
 <h1 style="font-size: 1.85rem; font-weight: 700; color: var(--primary); margin: 0 0 0.35rem 0;">
 마보살 유료 심층 사주풀이
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 격국·용신·신강약 심층 규명, 12개월 월별 상세 운세, 재물·직업·연애 3개년 변화 순서와 실천 행동 처방 완결본입니다.
 </p>
 </div>



 <!-- 리포트 최상단 숫자 목차 -->
 ${tocHtml}

 <!-- [천명원 핵심 비주얼 1] 사주 성취 지수 골드 링 -->
 ${renderGoldProgressRing(reportCtx.rsiScore, '성취지수', reportCtx.rsiScore >= 85 ? '대도약과 재물 결실기' : '균형 조율과 내실 성장기')}

 <!-- 공통 1: 사주 4주 8자 만세력 미니 원국 카드 -->
 ${renderMiniSajuPillarsCard({
 year: pillars.year,
 month: pillars.month,
 day: pillars.day,
 hour: pillars.hour,
 })}

 <!-- 천명원 _5 규격 1: 오행(五行) 에너지 분포도 (Segmented Multi-Bar + 5대 뱃지 + 진단 메시지) -->
 ${(() => {
 const dynCharts = buildDynamicVisualChartProps(reportCtx, `${pillars.day.stem}${pillars.day.branch} 일주`);
 return `
 ${ModuleRegistry.isEnabled('five_elements_multibar') ? renderCheonmyeongwonFiveElementsMultiBar(dynCharts.fiveElements) : ''}

 <!-- 천명원 _5 규격 2: 일주(日柱) 본원 핵심 성향 카드 & 기운 보완 처방 (풍수 & 라이프) -->
 ${ModuleRegistry.isEnabled('day_master_archetype') ? renderCheonmyeongwonDayMasterArchetype(dynCharts.dayMasterArchetype) : ''}
 `;
 })()}

 <!-- [천명원 핵심 비주얼 2] 대운 10년 주기 라이프사이클 곡선 차트 -->
 ${ModuleRegistry.isEnabled('daewun_lifecycle_curve') ? renderDaewunLifeCycleChart(buildDynamicDaewunProps(state)) : ''}

 <!-- [천명원 핵심 비주얼 3] 12개월 월운 스플라인 추이 SVG 차트 -->
 ${(() => {
 const targetYear = new Date().getFullYear();
 return ModuleRegistry.isEnabled('spline_monthly_chart') ? renderSplineMonthlyChart({
 yearTitle: `${targetYear}년 세운(歲運)`,
 subTitle: '12개월 월별 에너지 파동',
 data: buildDynamicMonthlyScores(state, targetYear),
 }) : '';
 })()}

 <!-- [천명원 핵심 비주얼 4] 4대 핵심 영역별 심층 분석 아코디언 (재물, 직업, 애정) -->
 ${renderCheonmyeongwonLifeAspectsAccordion()}

 <!-- 18개 심층 서술형 결과지 본문 -->
 <div class="product-sections-container paid-sections-body" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2.5rem;">
 ${narrativeHtml}
 </div>

 <!-- [천명원 6번 & 4번 규격] 사주 리포트 마이페이지 [주문내역] 단일 확인 시스템 -->
 ${(() => {
 const orderCount = Math.max(1, UserOrderService.getCurrentUserOrderSummarySync().orders.length);
 return `
 ${ModuleRegistry.isEnabled('archive_digital_vault') ? renderCheonmyeongwonArchiveVault({
 userName,
 totalRecordsCount: orderCount,
 }) : ''}
 `;
 })()}
 </div>
 `;
}
