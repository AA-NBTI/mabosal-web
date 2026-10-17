/**
 * 마보살 프리미엄 정밀 사주 진단 독립 전용 결과지 화면 (149,900원) - 천명원 통일 디자인 시스템
 * - 천명원 폰트 (Noto Serif KR + Space Grotesk + Pretendard)
 * - 4주 8자 만세력 미니 원국 카드 + 오행 멀티바 + 일주 아키타입 카드
 * - 소장용 TXT 다운로드 + 정본 PDF 다운로드 버튼 완비
 * - 29개 VIP 전수 서술형 섹션 (원국/격국/신살/대운/세운, A/B 대안, 업무변경 기록표, 4주 로드맵)
 * - 디지털 금고 보관 UI
 */

import { AppStateData } from '../state/app-state.js';
import { UserSajuStore } from '../state/user-saju-store.js';
import { extractReportContext, getPremiumReportMarkdown, renderNarrativeReport } from '../components/tier-templates.js';
import { renderMiniSajuPillarsCard, renderAffiliatePromoBanner } from '../components/common-components.js';
import { renderCheonmyeongwonFiveElementsMultiBar, renderCheonmyeongwonDayMasterArchetype } from '../components/VisualCharts.js';

export function renderPremiumResultView(state: AppStateData): string {
 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || state.productOutputSet?.common?.pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 const reportCtx = extractReportContext(state);
 const narrativeMarkdown = getPremiumReportMarkdown(reportCtx);
 const narrativeHtml = renderNarrativeReport(narrativeMarkdown);

 const savedProf = UserSajuStore.getProfile();
 const userName = state.userName || savedProf?.userName || (state.userTroubleText ? '의뢰인' : '김서연');
 const curGender = state.gender || savedProf?.gender || 'female';
 const genderTag = curGender === 'female' ? '坤命 · 陰' : '乾命 · 陽';
 const bDate = state.sessionState?.request?.birthDate || savedProf?.solarBirthDate || '1995.04.12';
 const bTime = state.sessionState?.request?.birthTime || savedProf?.birthTime || '09:20';
 const calType = state.calendarType || savedProf?.calendarType || 'solar';
 const birthSummary = `${bDate} ${bTime} · ${calType === 'lunar' ? '음력' : '양력'}`;


 return `
 <div class="result-view-container premium-result-view" style="max-width: 580px; margin: 0 auto; padding: 1.25rem 1rem 4rem; font-family: var(--font-body);">
 <!-- 천명원 상단 사용자 프로필 바 -->
 <section style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 14px; background: var(--surface-container-high); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
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
 <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; background: rgba(242, 202, 80, 0.15); padding: 0.25rem 0.6rem; border-radius: 6px; border: 1px solid rgba(242, 202, 80, 0.4);">
 VIP 프리미엄
 </span>
 </div>
 </section>

 <!-- 최상단 서비스 타이틀 & 다운로드 버튼군 -->
 <div style="margin-bottom: 1.5rem; text-align: left;">
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
 <span class="card-badge gold-badge" style="font-family: var(--font-display); font-size: 0.78rem; padding: 0.2rem 0.65rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 6px; font-weight: 700;">
 VIP PREMIUM · 29 CHAPTERS
 </span>
 <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
 <button type="button" class="btn-cta-secondary btn-download-txt" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">description</span>
 소장용 TXT 다운로드
 </button>
 <button type="button" class="btn-cta-secondary btn-download-pdf" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">print</span>
 PDF 인쇄
 </button>
 </div>
 </div>
 <h1 style="font-family: var(--font-serif); font-size: 1.65rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.35rem 0;">
 마보살 프리미엄 정밀 사주 리포트
 </h1>
 <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0; line-height: 1.5;">
 원국·격국·신살·대운·세운 전수 분석, 현실 딜레마 A/B 대조표, 업무 변경 기록표 양식, 4주차 단계별 실행 로드맵 완결판입니다.
 </p>
 </div>

 <!-- 공통 1: 사주 4주 8자 만세력 미니 원국 카드 -->
 ${renderMiniSajuPillarsCard({
 year: pillars.year,
 month: pillars.month,
 day: pillars.day,
 hour: pillars.hour,
 dayMasterDesc: `${pillars.day.stem}토(土) 일원 (VIP 전수 정밀 감정)`,
 })}

 <!-- 천명원 5번 규격: 오행 에너지 분포도 (Multi-Bar) -->
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
 rsiScore: 92,
 })}

 <!-- 천명원 5번 규격: 일주 본원 핵심 성향 카드 & 기운 보완 처방 -->
 ${renderCheonmyeongwonDayMasterArchetype({
 dayPillarTitle: `${pillars.day.stem}${pillars.day.branch} 일주`,
 archetypeEn: 'Sovereign Destiny Archetype',
 heroCopy: '"천명을 주도하고 시대를 이끄는 고귀한 황금 리더십"',
 keywords: ['#천명주도', '#황금대운', '#위기돌파', '#최고의사결정', '#평생보관'],
 })}

 <!-- 29개 VIP 전수 서술형 결과지 본문 -->
 <div class="product-sections-container premium-sections-body" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2.5rem;">
 ${narrativeHtml}
 </div>

 <!-- 디지털 금고 및 영구 보관 카드 -->
 <div style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.12), rgba(15, 19, 29, 0.95)); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 14px; padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
 <div>
 <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary); margin-bottom: 0.25rem;">
 ️ 사주 리포트 온라인 영구 보관
 </div>
 <div style="font-family: var(--font-serif); font-size: 1.12rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.35rem;">
 평생 열람 가능한 A4 정본 문서 보관함
 </div>
 <div style="font-size: 0.82rem; color: var(--text-muted);">
 언제든 대시보드 주문내역에서 재열람하거나 PDF/TXT로 소장하실 수 있습니다.
 </div>
 </div>
 <div style="display: flex; gap: 0.5rem;">
 <button type="button" class="btn-cta-primary btn-download-txt" style="padding: 0.65rem 1rem; font-weight: 700; font-size: 0.85rem;">
 소장용 TXT 받기
 </button>
 <button type="button" class="btn-cta-secondary btn-download-pdf" style="padding: 0.65rem 1rem; font-weight: 700; font-size: 0.85rem;">
 ️ PDF 인쇄하기
 </button>
 </div>
 </div>

 <!-- 공통 2: 마보살 파트너스 제휴 마케팅 배너 -->
 ${renderAffiliatePromoBanner()}
 </div>
 `;
}
