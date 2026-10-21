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
import { extractReportContext, getPaidReportMarkdown, renderNarrativeReport } from '../components/tier-templates.js';
import { renderMiniSajuPillarsCard } from '../components/common-components.js';
import {
 renderDaewunLifeCycleChart,
 renderSplineMonthlyChart,
 renderGoldProgressRing,
 renderCheonmyeongwonLifeAspectsAccordion,
 renderCheonmyeongwonFiveElementsMultiBar,
 renderCheonmyeongwonDayMasterArchetype,
 renderCheonmyeongwonDailyDashboard,
 renderCheonmyeongwonTalismanCard,
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
 const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 const reportCtx = extractReportContext(state);
 const narrativeMarkdown = getPaidReportMarkdown(reportCtx);
 const narrativeHtml = renderNarrativeReport(narrativeMarkdown);

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
 <!-- 천명원 상단 사용자 프로필 & 퀵 전환 바 -->
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
 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <button type="button" aria-label="프로필 전환" id="switchUserBtn" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--surface-container-highest); color: var(--text-secondary); border: 1px solid var(--border-subtle); cursor: pointer;">
 <span class="material-symbols-outlined" style="font-size: 18px;">swap_vert</span>
 </button>
 <button type="button" id="addUserBtn" style="display: flex; align-items: center; gap: 0.2rem; padding: 0 0.65rem; height: 32px; border-radius: 8px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.35); color: var(--primary); font-size: 0.78rem; font-weight: 600; cursor: pointer;">
 <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
 <span>추가</span>
 </button>
 </div>
 </section>

 <!-- 최상단 서비스 타이틀 & 다운로드 버튼군 -->
 <div style="margin-bottom: 1.5rem; text-align: left;">
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



 <!-- [천명원 핵심 비주얼 1] 사주 성취 지수 골드 링 -->
 ${renderGoldProgressRing(95, '성취지수', '대도약과 재물 결실기')}

 <!-- 공통 1: 사주 4주 8자 만세력 미니 원국 카드 -->
 ${renderMiniSajuPillarsCard({
 year: pillars.year,
 month: pillars.month,
 day: pillars.day,
 hour: pillars.hour,
 })}

 <!-- 천명원 _5 규격 1: 오행(五行) 에너지 분포도 (Segmented Multi-Bar + 5대 뱃지 + 진단 메시지) -->
 ${ModuleRegistry.isEnabled('five_elements_multibar') ? renderCheonmyeongwonFiveElementsMultiBar({
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
 rsiScore: 95,
 }) : ''}

 <!-- 천명원 _5 규격 2: 일주(日柱) 본원 핵심 성향 카드 & 기운 보완 처방 (풍수 & 라이프) -->
 ${ModuleRegistry.isEnabled('day_master_archetype') ? renderCheonmyeongwonDayMasterArchetype({
 dayPillarTitle: `${pillars.day.stem}${pillars.day.branch} 일주`,
 archetypeEn: 'Golden Earth Master Archetype',
 heroCopy: '"기름진 땅 위에 뿌리내린 현실적 지혜와 신뢰의 기상"',
 keywords: ['#현실감각', '#지속력', '#관리능력', '#신중함', '#신뢰'],
 }) : ''}

 <!-- [천명원 핵심 비주얼 2] 대운 10년 주기 라이프사이클 곡선 차트 -->
 ${ModuleRegistry.isEnabled('daewun_lifecycle_curve') ? renderDaewunLifeCycleChart({
 currentDaewun: '병오(丙午) 대운',
 ageRange: 'AGE 34 ~ 43',
 score: 98,
 }) : ''}

 <!-- [천명원 핵심 비주얼 3] 12개월 월운 스플라인 추이 SVG 차트 -->
 ${ModuleRegistry.isEnabled('spline_monthly_chart') ? renderSplineMonthlyChart({
 yearTitle: '올해의 세운(歲運)',
 subTitle: '12개월 월별 에너지 파동',
 }) : ''}

 <!-- [천명원 핵심 비주얼 4] 4대 핵심 영역별 심층 분석 아코디언 (재물, 직업, 애정) -->
 ${renderCheonmyeongwonLifeAspectsAccordion()}

 <!-- 18개 심층 서술형 결과지 본문 -->
 <div class="product-sections-container paid-sections-body" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2.5rem;">
 ${narrativeHtml}
 </div>

 <!-- [천명원 12번 & 3번 규격] 대길 황금 결실 수호 부적 카드 (VIP 전용 고해상도) -->
 ${ModuleRegistry.isEnabled('talisman_harvest_card') ? renderCheonmyeongwonTalismanCard({
 userName,
 talismanTitle: '갑진일 VIP 황금 결실 부적',
 subTitle: '대운 황금 재고(財庫) 개방 • 대도약의 기운 완전 동기화',
 absorptionRate: 98,
 noblemanScore: 96,
 }) : ''}

 <!-- [천명원 6번 & 4번 규격] 사주 리포트 마이페이지 [주문내역] 단일 확인 시스템 -->
 ${ModuleRegistry.isEnabled('archive_digital_vault') ? renderCheonmyeongwonArchiveVault({
 userName,
 totalRecordsCount: 2,
 }) : ''}
 </div>
 `;
}
