/**
 *  무료 사주 진단 독립 전용 결과지 화면
 * - 4주 8자 만세력 미니 원국 카드 (Trust Anchor)
 * - 13개 무료 서술형 섹션만 단독 전시 (유료 노출 절대 차단)
 * - 하단 유료 심층(18섹션) / 2027 단품 업그레이드 페이월 & 파트너스 배너
 */

import { AppStateData } from '../state/app-state.js';
import { ModuleRegistry } from '../state/module-registry.js';
import { extractReportContext, getFreeReportMarkdown, renderNarrativeReport } from '../components/tier-templates.js';
import { renderMiniSajuPillarsCard } from '../components/common-components.js';
import {
 renderCheonmyeongwonFiveElementsMultiBar,
 renderCheonmyeongwonDayMasterArchetype,
 renderCheonmyeongwonDailyDashboard,
 renderCheonmyeongwonTalismanCard,
 renderCheonmyeongwonArchiveVault,
} from '../components/VisualCharts.js';

export function renderFreeResultView(state: AppStateData): string {
 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 const reportCtx = extractReportContext(state);
 const narrativeMarkdown = getFreeReportMarkdown(reportCtx);
 const narrativeHtml = renderNarrativeReport(narrativeMarkdown);

 const userName = state.userName || (state.userTroubleText ? '의뢰인' : '홍길동');
 const genderTag = state.gender === 'female' ? '坤命 · 陰' : '乾命 · 陽';
 const birthSummary = state.sessionState?.request?.birthDate
 ? `${state.sessionState.request.birthDate} ${state.sessionState.request.birthTime || '14:30'} · ${state.calendarType === 'lunar' ? '음력' : '양력'}`
 : '1993.08.15 14:30 · 양력 (31세)';

 return `
 <div class="result-view-container free-result-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
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

 <!-- 최상단 서비스 타이틀 & 소장용 TXT 다운로드 버튼 -->
 <div style="margin-bottom: 1.5rem; text-align: left;">
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 6px; font-weight: 700;">
 무료 사주 진단 리포트
 </span>
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <button class="btn-cta-secondary btn-download-txt" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">description</span>
 소장용 TXT 다운로드
 </button>
 <button type="button" class="btn-cta-secondary btn-download-pdf" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">picture_as_pdf</span>
 PDF 리포트 저장
 </button>
 <span style="font-size: 0.82rem; color: #50c878; font-weight: 600;">
 13개 핵심 진단 섹션 무료 제공
 </span>
 </div>
 </div>
 <h1 style="font-size: 1.85rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.35rem 0;">
 마보살 무료 사주 진단서
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 의뢰인의 4주 원천 기운과 오행 기본 구조, 2026 병오년 핵심 전환점을 요약 정리한 진단서입니다.
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
 rsiScore: 86,
 }) : ''}

 <!-- 천명원 _5 규격 2: 일주(日柱) 본원 핵심 성향 카드 & 기운 보완 처방 (풍수 & 라이프) -->
 ${ModuleRegistry.isEnabled('day_master_archetype') ? renderCheonmyeongwonDayMasterArchetype({
 dayPillarTitle: `${pillars.day.stem}${pillars.day.branch} 일주`,
 archetypeEn: 'Golden Earth Archetype',
 heroCopy: '"기름진 땅 위에 뿌리내린 현실적 지혜와 신뢰의 기상"',
 keywords: ['#현실감각', '#지속력', '#관리능력', '#신중함', '#신뢰'],
 }) : ''}

 <!-- 13개 순수 무료 서술형 결과지 본문 (유료 내용 혼입 제로) -->
 <div class="product-sections-container free-sections-body" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2.5rem;">
 ${narrativeHtml}
 </div>

 <!-- [천명원 12번 & 3번 규격] 대길 황금 결실 수호 부적 카드 (갤러리 저장 & 공유) -->
 <!-- [유료/무료 차별화]: 무료 사주에서는 결실부적 제거 완료 -->

 <!-- [천명원 6번 & 4번 규격] 사주 리포트 마이페이지 [주문내역] 단일 확인 시스템 -->
 ${ModuleRegistry.isEnabled('archive_digital_vault') ? renderCheonmyeongwonArchiveVault({
 userName,
 totalRecordsCount: 1,
 }) : ''}
 </div>
 `;
}
