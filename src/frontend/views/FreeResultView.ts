/**
 *  무료 사주 진단 독립 전용 결과지 화면
 * - 4주 8자 만세력 미니 원국 카드 (Trust Anchor)
 * - 13개 무료 서술형 섹션만 단독 전시 (유료 노출 절대 차단)
 * - 하단 유료 심층(18섹션) / 2027 단품 업그레이드 페이월 & 파트너스 배너
 */

import { AppStateData } from '../state/app-state.js';
import { AuthService } from '../state/auth-service.js';
import { ModuleRegistry } from '../state/module-registry.js';
import { UserOrderService } from '../modules/order/user-order-service.js';
import { buildDynamicVisualChartProps, extractReportContext, getFreeReportMarkdown, renderNarrativeReport } from '../components/tier-templates.js';
import { renderMiniSajuPillarsCard, renderEmptySajuGuideView } from '../components/common-components.js';
import {
 renderCheonmyeongwonFiveElementsMultiBar,
 renderCheonmyeongwonDayMasterArchetype,
 renderCheonmyeongwonDailyDashboard,
 renderCheonmyeongwonTalismanCard,
 renderCheonmyeongwonArchiveVault,
} from '../components/VisualCharts.js';

export function renderFreeResultView(state: AppStateData): string {
 const currentUser = AuthService.getCurrentUser();
 const isGuest = !currentUser || currentUser.role === 'guest';
 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars;
 if (!pillars) {
  return renderEmptySajuGuideView('무료 사주 진단 리포트');
 }

 const reportCtx = extractReportContext(state);
 const narrativeMarkdown = getFreeReportMarkdown(reportCtx);
 const markdownSections = narrativeMarkdown.split(/\n---\n/);
 const guestPreviewMarkdown = markdownSections.slice(0, 2).join('\n\n---\n\n');
 const narrativeHtml = renderNarrativeReport(isGuest ? guestPreviewMarkdown : narrativeMarkdown);

 const userName = state.userName || (state.userTroubleText ? '의뢰인' : '홍길동');
 const genderTag = state.gender === 'female' ? '坤命 · 陰' : '乾命 · 陽';
 const birthSummary = state.sessionState?.request?.birthDate
 ? `${state.sessionState.request.birthDate} ${state.sessionState.request.birthTime || '14:30'} · ${state.calendarType === 'lunar' ? '음력' : '양력'}`
 : '1993.08.15 14:30 · 양력 (31세)';

 return `
 <div class="result-view-container free-result-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 <!-- 최상단 서비스 타이틀 -->
 <div style="margin-bottom: 1.5rem; text-align: left;">
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 6px; font-weight: 700;">
 ${isGuest ? '무료 사주 체험' : '무료 사주 진단 리포트'}
 </span>
 ${isGuest ? `
 <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 600;">
 사주 원국 · 핵심 풀이 미리보기
 </span>
 ` : ''}
 </div>
 <h1 style="font-size: 1.85rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.35rem 0;">
 ${isGuest ? '마보살 무료 사주 체험' : '마보살 무료 사주 진단서'}
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 ${isGuest
 ? '타고난 사주 원국과 오행 기본 구조를 먼저 확인해 보세요. 전체 상세 풀이와 맞춤 처방은 회원가입 후 무료로 열람할 수 있습니다.'
 : '의뢰인의 4주 원천 기운과 오행 기본 구조, 2026 병오년 핵심 전환점을 요약 정리한 진단서입니다.'}
 </p>
 </div>



 <!-- 공통 1: 사주 4주 8자 만세력 정통 원국표 & 천문 태극 엠블럼 (천명원 _5 규격) -->
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

 <!-- 13개 순수 무료 서술형 결과지 본문 (유료 내용 혼입 제로) -->
 <div class="product-sections-container free-sections-body" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2.5rem;">
 ${narrativeHtml}
 </div>

 <!-- [천명원 12번 & 3번 규격] 대길 황금 결실 수호 부적 카드 (갤러리 저장 & 공유) -->
 <!-- [유료/무료 차별화]: 무료 사주에서는 결실부적 제거 완료 -->

 <!-- [천명원 6번 & 4번 규격] 사주 리포트 마이페이지 [주문내역] 단일 확인 시스템 / 비회원 가입 유도 게이트 -->
 ${isGuest ? `
 <section style="background: linear-gradient(145deg, rgba(20, 26, 42, 0.96), rgba(12, 16, 28, 0.98)); border: 1px solid rgba(242, 202, 80, 0.45); border-radius: 16px; padding: 1.85rem 1.5rem; text-align: center; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);">
 <span class="material-symbols-outlined" style="font-size: 36px; color: var(--primary); margin-bottom: 0.65rem;">lock_open</span>
 <h3 style="font-size: 1.18rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0;">
 나머지 상세 사주 풀이와 맞춤 처방 확인하기
 </h3>
 <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; max-width: 560px; margin: 0 auto 1.25rem auto;">
 내가 가진 장점·주의할 흐름·2026년 핵심 전환점·현실 행동 전략(총 13개 섹션)과 일일 행운처방은<br/>
 <strong style="color: var(--primary);">무료 회원가입</strong> 후 방금 입력한 사주 그대로 바로 확인하실 수 있습니다.
 </p>
 <div style="display: flex; justify-content: center; gap: 0.65rem; flex-wrap: wrap;">
 <button type="button" id="btn-guest-signup-unlock" style="background: linear-gradient(135deg, #f6d365 0%, #e4b537 100%); color: #1c1500; font-weight: 800; font-size: 0.92rem; padding: 0.72rem 1.65rem; border-radius: 999px; border: 1px solid rgba(255, 232, 160, 0.55); cursor: pointer; box-shadow: 0 6px 18px rgba(242, 202, 80, 0.28);">
 무료 회원가입하고 전체 풀이 보기
 </button>
 <button type="button" id="btn-guest-login-unlock" style="background: rgba(255,255,255,0.06); color: #e2e8f0; font-weight: 700; font-size: 0.86rem; padding: 0.72rem 1.25rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); cursor: pointer;">
 이미 회원이신가요? 로그인
 </button>
 </div>
 </section>
 ` : (ModuleRegistry.isEnabled('archive_digital_vault') ? renderCheonmyeongwonArchiveVault({
 userName,
 totalRecordsCount: Math.max(1, UserOrderService.getCurrentUserOrderSummarySync().orders.length),
 }) : '')}
 </div>
 `;
}
