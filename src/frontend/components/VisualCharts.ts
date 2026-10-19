/**
 * VisualCharts.ts
 * 천명원(天命院) 정통 오리엔탈 비주얼 차트 및 인터랙티브 시각화 컴포넌트 모음
 * - 순수 경량 SVG + 모던 CSS 기반 (외부 무거운 라이브러리 의존성 0%)
 * - 12개월 월운 스플라인 에너지 추이 SVG 차트
 * - 대운(大運) 10년 주기 라이프사이클 곡선 SVG 차트
 * - 골드 프로그레스 링 (성취 지수 / RSI 안정도)
 * - 당일 2대 길시(吉時) 실시간 타임라인 위젯
 */

import { calculateLuckyCodex } from '../../modules/prescription/lucky-codex.js';
import { CatalogStore } from '../state/catalog-store.js';
import { DailyFortuneEngine } from '../../modules/daily-fortune/daily-fortune-engine.js';
import { ModuleRegistry } from '../state/module-registry.js';

export interface MonthlyScorePoint {
 month: number;
 stemBranch: string;
 score: number;
 isDip?: boolean;
 isPeak?: boolean;
}

export interface MonthlyChartOptions {
 yearTitle?: string;
 subTitle?: string;
 data?: MonthlyScorePoint[];
}

/**
 * 1. 12개월 월운 스플라인 추이 SVG 차트
 * 천명원 고유의 골드 글로우 스플라인 곡선과 주의(4월)/피크(10월) 하이라이트 시스템
 */
export function renderSplineMonthlyChart(options?: MonthlyChartOptions): string {
 const yearTitle = options?.yearTitle || '2027 정미년(丁未年)';
 const subTitle = options?.subTitle || '12개월 에너지 스플라인 추이';

 return `
 <div class="spline-chart-card" style="background: rgba(15, 20, 34, 0.95); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 16px; padding: 1.25rem; box-shadow: 0 8px 32px rgba(0,0,0,0.5); margin-bottom: 1.5rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <span style="font-size: 1.15rem; color: var(--text-gold);"></span>
 <div>
 <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0;">${yearTitle} ${subTitle}</h3>
 <span style="font-size: 0.72rem; color: var(--text-muted);">사주 원국과 세운의 12절기 에너지 파동</span>
 </div>
 </div>
 <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.72rem;">
 <div style="display: flex; align-items: center; gap: 0.3rem;">
 <span style="width: 12px; height: 3px; background: var(--text-gold); border-radius: 2px; display: inline-block;"></span>
 <span style="color: var(--text-secondary);">종합운</span>
 </div>
 <div style="display: flex; align-items: center; gap: 0.3rem;">
 <span style="width: 12px; height: 2px; border-top: 2px dashed #93c5fd; display: inline-block;"></span>
 <span style="color: #93c5fd;">재물/문서</span>
 </div>
 </div>
 </div>

 <!-- SVG 차트 뷰포트 -->
 <div style="width: 100%; overflow-x: auto; padding-top: 0.5rem;">
 <svg class="spline-chart-svg" viewBox="0 0 340 185" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; display: block; overflow: visible;">
 <defs>
 <linearGradient id="splineAreaGrad" x1="0" x2="0" y1="0" y2="1">
 <stop offset="0%" stop-color="#f2ca50" stop-opacity="0.35" />
 <stop offset="70%" stop-color="#f2ca50" stop-opacity="0.05" />
 <stop offset="100%" stop-color="#f2ca50" stop-opacity="0.0" />
 </linearGradient>
 <filter id="goldChartGlow" x="-20%" y="-20%" width="140%" height="140%">
 <feGaussianBlur stdDeviation="2.5" result="glow" />
 <feMerge>
 <feMergeNode in="glow" />
 <feMergeNode in="SourceGraphic" />
 </feMerge>
 </filter>
 </defs>

 <!-- 수평 가이드선 (95점, 75점, 50점) -->
 <line x1="16" y1="36" x2="330" y2="36" stroke="#313540" stroke-width="0.8" stroke-dasharray="3 3" />
 <text x="10" y="39" fill="#99907c" font-size="7.5" font-family="'Outfit', sans-serif" text-anchor="end">95</text>
 
 <line x1="16" y1="60" x2="330" y2="60" stroke="#313540" stroke-width="0.8" stroke-dasharray="3 3" />
 <text x="10" y="63" fill="#99907c" font-size="7.5" font-family="'Outfit', sans-serif" text-anchor="end">75</text>
 
 <line x1="16" y1="96" x2="330" y2="96" stroke="#313540" stroke-width="0.8" stroke-dasharray="3 3" />
 <text x="10" y="99" fill="#99907c" font-size="7.5" font-family="'Outfit', sans-serif" text-anchor="end">50</text>

 <!-- 4월 주의 구간 하이라이트 -->
 <rect x="91" y="24" width="24" height="126" rx="4" fill="#ffb4ab" fill-opacity="0.08" />
 <text x="103" y="20" fill="#ff8a80" font-size="7.5" font-weight="700" text-anchor="middle">주의</text>

 <!-- 10월 연간 최고 피크 골든 하이라이트 -->
 <rect x="261" y="16" width="24" height="134" rx="4" fill="#f2ca50" fill-opacity="0.12" />
 <line x1="273" y1="28" x2="273" y2="150" stroke="#f2ca50" stroke-width="1.2" stroke-dasharray="2 2" />

 <!-- 보조선 (재물/문서운 점선) -->
 <path d="M 18,65 C 46,62 74,55 102,68 C 131,80 159,48 187,46 C 216,45 244,66 273,34 C 301,48 316,44 330,42"
 fill="none" stroke="#93c5fd" stroke-width="1.4" stroke-dasharray="3 3" opacity="0.65" />

 <!-- 주 스플라인 면적 그라데이션 -->
 <path d="M 18,56.4 C 32,54 39,52.5 46.4,51.6 C 60,50 67,49 74.7,48 C 88,46.5 95,60 103,61.2 C 117,63 124,42 131.4,40.8 C 145,39 152,43.5 159.7,44.4 C 173,46 181,46 188,46.8 C 202,48 209,53 216.4,54 C 230,56 238,58 244.7,58.8 C 258,60 265,37 273,36 C 287,35 294,48 301.4,49.2 C 315,51 322,44 330,43.2 L 330,150 L 18,150 Z"
 fill="url(#splineAreaGrad)" />

 <!-- 주 스플라인 황금 곡선 (글로우 효과) -->
 <path d="M 18,56.4 C 32,54 39,52.5 46.4,51.6 C 60,50 67,49 74.7,48 C 88,46.5 95,60 103,61.2 C 117,63 124,42 131.4,40.8 C 145,39 152,43.5 159.7,44.4 C 173,46 181,46 188,46.8 C 202,48 209,53 216.4,54 C 230,56 238,58 244.7,58.8 C 258,60 265,37 273,36 C 287,35 294,48 301.4,49.2 C 315,51 322,44 330,43.2"
 fill="none" stroke="#f2ca50" stroke-width="2.6" filter="url(#goldChartGlow)" />

 <!-- 월별 노드 포인트 (1월 ~ 12월) -->
 <circle cx="18" cy="56.4" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <circle cx="46.4" cy="51.6" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <circle cx="74.7" cy="48" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <!-- 4월 주의 노드 -->
 <circle cx="103" cy="61.2" r="3.4" fill="#ff8a80" stroke="#0f131d" stroke-width="1.5" />
 <!-- 5월 상승 노드 -->
 <circle cx="131.4" cy="40.8" r="3.4" fill="#f2ca50" stroke="#0f131d" stroke-width="1.5" />
 <text x="131.4" y="33" fill="#f2ca50" font-size="8" font-weight="700" text-anchor="middle">91</text>
 
 <circle cx="159.7" cy="44.4" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <circle cx="188" cy="46.8" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <circle cx="216.4" cy="54" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <circle cx="244.7" cy="58.8" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <!-- 10월 최고 정점 노드 & 펄스 링 -->
 <circle cx="273" cy="36" r="6" fill="#f2ca50" fill-opacity="0.3" class="pulse-node" />
 <circle cx="273" cy="36" r="3.8" fill="#f2ca50" stroke="#0f131d" stroke-width="2" />
 <!-- 10월 플로팅 배지 -->
 <g transform="translate(254, 8)">
 <rect width="38" height="17" rx="8.5" fill="#d4af37" />
 <text x="19" y="11.5" fill="#0f131d" font-size="8.5" font-weight="800" text-anchor="middle"> 95점</text>
 </g>

 <circle cx="301.4" cy="49.2" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />
 <circle cx="330" cy="43.2" r="2.8" fill="#0f131d" stroke="#f2ca50" stroke-width="1.8" />

 <!-- 하단 월 라벨 (1월 ~ 12월) -->
 <text x="18" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">1월</text>
 <text x="46.4" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">2월</text>
 <text x="74.7" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">3월</text>
 <text x="103" y="165" fill="#ff8a80" font-size="8" font-weight="700" text-anchor="middle">4월</text>
 <text x="131.4" y="165" fill="#f2ca50" font-size="8" font-weight="700" text-anchor="middle">5월</text>
 <text x="159.7" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">6월</text>
 <text x="188" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">7월</text>
 <text x="216.4" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">8월</text>
 <text x="244.7" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">9월</text>
 <text x="273" y="165" fill="#f2ca50" font-size="8.5" font-weight="800" text-anchor="middle">10월</text>
 <text x="301.4" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">11월</text>
 <text x="330" y="165" fill="#d0c5af" font-size="8" text-anchor="middle">12월</text>

 <!-- 하단 간지 라벨 (임인, 계묘, 갑진, 을사, 병오, 정미...) -->
 <text x="18" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">壬寅</text>
 <text x="46.4" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">癸卯</text>
 <text x="74.7" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">甲辰</text>
 <text x="103" y="176" fill="#ff8a80" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">乙巳</text>
 <text x="131.4" y="176" fill="#f2ca50" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">丙午</text>
 <text x="159.7" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">丁未</text>
 <text x="188" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">戊申</text>
 <text x="216.4" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">己酉</text>
 <text x="244.7" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">庚戌</text>
 <text x="273" y="176" fill="#f2ca50" font-size="6.5" font-weight="700" font-family="'Noto Serif KR', serif" text-anchor="middle">辛亥</text>
 <text x="301.4" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">壬子</text>
 <text x="330" y="176" fill="#99907c" font-size="6.5" font-family="'Noto Serif KR', serif" text-anchor="middle">癸丑</text>
 </svg>
 </div>

 <!-- 월운 요약 바텀 콜아웃 -->
 <div style="margin-top: 0.85rem; padding: 0.75rem 0.95rem; background: rgba(212, 175, 55, 0.08); border-radius: 10px; border-left: 3px solid var(--text-gold); display: flex; justify-content: space-between; align-items: center;">
 <span style="font-size: 0.8rem; color: #fff;">
 <strong>상반기 5월(도약)</strong>과 <strong>하반기 10월(연간 최고 정점)</strong>에 계약·투자 골든타임 도래
 </span>
 <span style="font-size: 0.72rem; color: var(--text-gold); font-weight: 700; white-space: nowrap;">비책 해설 →</span>
 </div>
 </div>
 `;
}

/**
 * 2. 대운(大運) 10년 주기 라이프사이클 곡선 SVG 차트
 * 10년 주기 상승 곡선 및 현재 맞이한 대운 펄스 하이라이트
 */
export function renderDaewunLifeCycleChart(options?: { currentDaewun?: string; ageRange?: string; score?: number }): string {
 const currentDaewun = options?.currentDaewun || '병오(丙午) 대운';
 const ageRange = options?.ageRange || 'AGE 34 ~ 43';
 const score = options?.score || 98;

 return `
 <div class="daewun-chart-card" style="background: rgba(15, 20, 34, 0.95); border: 1px solid rgba(255, 51, 133, 0.25); border-radius: 16px; padding: 1.25rem; box-shadow: 0 8px 32px rgba(0,0,0,0.5); margin-bottom: 1.5rem;">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <span style="font-size: 1.15rem; color: #ff3385;"></span>
 <div>
 <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0;">대운(大運) 10년 주기 인생 곡선</h3>
 <span style="font-size: 0.72rem; color: var(--text-muted);">평생을 관통하는 운명적 상승 파동과 전환점</span>
 </div>
 </div>
 <span style="background: rgba(212, 175, 55, 0.2); color: var(--text-gold); font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 6px; font-weight: 700;">
 현재 피크
 </span>
 </div>

 <!-- 현재 활성 대운 콜아웃 카드 -->
 <div style="background: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 0.85rem 1rem; display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem; border: 1px solid rgba(255, 255, 255, 0.07);">
 <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--text-gold); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
 
 </div>
 <div>
 <div style="display: flex; align-items: center; gap: 0.4rem;">
 <span style="font-size: 0.98rem; font-weight: 800; color: var(--text-gold);">${currentDaewun}</span>
 <span style="font-size: 0.72rem; color: var(--text-muted);">${ageRange}</span>
 </div>
 <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0.2rem 0 0 0; line-height: 1.4;">
 태양과 같은 화(火)기운이 만개하는 10년. 명예와 사회적 입지가 가장 가파르게 치솟는 황금기입니다.
 </p>
 </div>
 </div>

 <!-- SVG 곡선 차트 -->
 <div style="width: 100%; overflow: hidden; padding-top: 0.5rem;">
 <svg viewBox="0 0 320 125" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; display: block; overflow: visible;">
 <defs>
 <linearGradient id="daewunGrad" x1="0" x2="0" y1="0" y2="1">
 <stop offset="0%" stop-color="#ff3385" stop-opacity="0.4" />
 <stop offset="100%" stop-color="#ff3385" stop-opacity="0.0" />
 </linearGradient>
 </defs>

 <!-- 가이드선 -->
 <line x1="20" y1="20" x2="300" y2="20" stroke="#313540" stroke-width="0.8" stroke-dasharray="3 3" />
 <line x1="20" y1="65" x2="300" y2="65" stroke="#313540" stroke-width="0.8" stroke-dasharray="3 3" />
 <line x1="20" y1="110" x2="300" y2="110" stroke="#313540" stroke-width="1" />

 <!-- 영역 채움 -->
 <path d="M 30,95 Q 85,85 110,70 T 190,25 T 270,55 L 270,110 L 30,110 Z" fill="url(#daewunGrad)" />

 <!-- 곡선 라인 -->
 <path d="M 30,95 Q 85,85 110,70 T 190,25 T 270,55" fill="none" stroke="#ff3385" stroke-width="3" stroke-linecap="round" />

 <!-- 노드 1: 14~23 -->
 <circle cx="30" cy="95" r="4.5" fill="#0f1422" stroke="#64748b" stroke-width="2" />
 <text x="30" y="122" fill="#a0aec0" font-size="9" text-anchor="middle">14~23</text>

 <!-- 노드 2: 24~33 -->
 <circle cx="110" cy="70" r="4.5" fill="#0f1422" stroke="#64748b" stroke-width="2" />
 <text x="110" y="122" fill="#a0aec0" font-size="9" text-anchor="middle">24~33</text>

 <!-- 노드 3 (현재 피크): 34~43 -->
 <circle cx="190" cy="25" r="11" fill="rgba(212, 175, 55, 0.2)" class="pulse-node" />
 <circle cx="190" cy="25" r="6" fill="#f2ca50" stroke="#080b12" stroke-width="2" />
 <text x="190" y="14" fill="#f2ca50" font-size="9.5" font-weight="800" text-anchor="middle">현재 (${score}점)</text>
 <text x="190" y="122" fill="#f2ca50" font-size="9.5" font-weight="700" text-anchor="middle">34~43</text>

 <!-- 노드 4: 44~53 -->
 <circle cx="270" cy="55" r="4.5" fill="#0f1422" stroke="#64748b" stroke-width="2" />
 <text x="270" y="122" fill="#a0aec0" font-size="9" text-anchor="middle">44~53</text>
 </svg>

 <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); padding: 0.2rem 0.5rem 0 0.5rem;">
 <span>기반 형성기</span>
 <span style="color: var(--text-gold); font-weight: 700;">전성기 (현재)</span>
 <span>수확 및 안정기</span>
 </div>
 </div>
 </div>
 `;
}

/**
 * 3. 골드 프로그레스 링 & 성취 지수 컴포넌트
 */
export function renderGoldProgressRing(score: number = 92, title: string = '성취 지수', sub: string = '도약과 결실의 해'): string {
 const radius = 38;
 const circumference = 2 * Math.PI * radius; // ~238.76
 const offset = circumference - (circumference * (score / 100));

 return `
 <div class="gold-ring-card" style="background: rgba(15, 20, 34, 0.85); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 14px; padding: 1.1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem;">
 <div style="flex: 1;">
 <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
 <span style="background: rgba(212, 175, 55, 0.2); color: var(--text-gold); font-size: 0.68rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">丁未 2027</span>
 <span style="font-size: 0.75rem; color: var(--text-muted);">${sub}</span>
 </div>
 <h3 style="font-size: 1.12rem; font-weight: 800; color: #fff; margin: 0 0 0.3rem 0;">
 기운 대도약과 결실의 시기
 </h3>
 <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0; line-height: 1.45;">
 오랫동안 묻혀 있던 잠재력이 일어나는 형국. 준비된 자에게 명예와 금전이 동시에 깃듭니다.
 </p>
 </div>

 <!-- 골드 링 SVG -->
 <div style="position: relative; width: 84px; height: 84px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
 <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-90deg);">
 <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="rgba(255,255,255,0.08)" stroke-width="7" />
 <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="#f2ca50" stroke-width="7"
 stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
 stroke-linecap="round" style="transition: stroke-dashoffset 1s ease-out;" />
 </svg>
 <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
 <span style="font-size: 1.15rem; font-weight: 900; color: var(--text-gold); line-height: 1;">
 ${score}<span style="font-size: 0.75rem; font-weight: 600;">%</span>
 </span>
 <span style="font-size: 0.62rem; color: var(--text-muted); margin-top: 0.15rem;">${title}</span>
 </div>
 </div>
 </div>
 `;
}

/**
 * 4. 당일 2대 길시(吉時) 실시간 타임라인 위젯
 * 사시(巳時 09:30~11:30) & 미시(未時 13:30~15:30) 실시간 타임라인 & 엽전 퀘스트
 */
export function renderDailyAuspiciousHoursWidget(): string {
  return `
  <div class="auspicious-hours-card" style="background: rgba(15, 20, 34, 0.9); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 14px; padding: 1.1rem; margin-bottom: 1.5rem; text-align: left;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
      <div style="display: flex; align-items: center; gap: 0.45rem;">
        <span class="material-symbols-outlined" style="font-size: 19px; color: var(--primary);">schedule</span>
        <h3 style="font-size: 1.02rem; font-weight: 800; color: #fff; margin: 0;">오늘의 황금 길시(吉時)</h3>
      </div>
      <span style="background: rgba(242, 202, 80, 0.12); color: var(--primary); font-size: 0.68rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; border: 1px solid rgba(242, 202, 80, 0.2);">
        실시간 기운 추적
      </span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.65rem;">
      <!-- 제1 길시: 사시 (클릭 시 상세 가이드 모달) -->
      <div class="interactive-auspicious-item" data-auspicious-hour="sashi" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 0.75rem 0.9rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s ease;" title="클릭하여 상세 행동 가이드 보기">
        <div>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span style="font-weight: 800; font-size: 0.88rem; color: #fff;">사시(巳時 · 09:30 ~ 11:30)</span>
            <span style="font-size: 0.65rem; color: var(--primary); background: rgba(242, 202, 80, 0.15); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">계약·문서 길시</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            중요 미팅 및 협상 타결 확률이 가장 높은 시간대
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.2rem; color: var(--primary); font-size: 0.72rem; font-weight: 700; flex-shrink: 0; padding-left: 0.5rem;">
          <span>가이드</span>
          <span class="material-symbols-outlined" style="font-size: 15px;">chevron_right</span>
        </div>
      </div>

      <!-- 제2 길시: 미시 (현재 활성 하이라이트 + 클릭 시 상세 가이드 모달) -->
      <div class="interactive-auspicious-item" data-auspicious-hour="mishi" style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 10px; padding: 0.75rem 0.9rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s ease;" title="클릭하여 상세 행동 가이드 보기">
        <div>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span style="font-weight: 800; font-size: 0.88rem; color: var(--primary);">미시(未時 · 13:30 ~ 15:30)</span>
            <span style="font-size: 0.65rem; color: #241a00; background: var(--primary); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 800;">진행 중</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">
            황금 재물 결실 타임 — 투자 판단 및 송금에 최적
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.2rem; color: var(--primary); font-size: 0.72rem; font-weight: 700; flex-shrink: 0; padding-left: 0.5rem;">
          <span>가이드</span>
          <span class="material-symbols-outlined" style="font-size: 15px;">chevron_right</span>
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * 5. 천명원 4대 핵심 영역별 심층 분석 아코디언 카드 (재물, 직업·사업, 애정·인연, 건강·활력)
 * 천명원(Stitch) 실제 프로덕션 마크업 및 데이터 소스 100% 이식
 */
export function renderCheonmyeongwonLifeAspectsAccordion(): string {
 return `
 <section class="life-aspects-section" style="margin-bottom: 2rem;">
 <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.85rem;">
 <div>
 <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em;">4-PILLAR DEEP ASPECTS</span>
 <h3 style="font-family: var(--font-serif); font-size: 1.22rem; font-weight: 700; color: #fff; margin: 0.15rem 0 0 0;">
 4대 핵심 영역별 심층 분석
 </h3>
 </div>
 <span style="font-size: 0.75rem; color: var(--text-muted);">원국과 세운의 정밀 풀이</span>
 </div>

 <div style="display: flex; flex-direction: column; gap: 0.75rem;">
 <!-- 1. 재물운 (Wealth) -->
 <div class="aspect-card" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.15rem; box-shadow: var(--shadow-sm);">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
 <div style="display: flex; align-items: center; gap: 0.65rem;">
 <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(242, 202, 80, 0.15); display: flex; align-items: center; justify-content: center; color: var(--primary);">
 <span class="material-symbols-outlined" style="font-size: 22px;">savings</span>
 </div>
 <div>
 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <span style="font-size: 1rem; font-weight: 700; color: #fff;">재물운 (財運)</span>
 <div style="display: flex; color: var(--primary);">
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star_half</span>
 </div>
 </div>
 <div style="font-size: 0.75rem; color: var(--text-muted);">뜻밖의 횡재수와 투자 결실</div>
 </div>
 </div>
 <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">상승기</span>
 </div>
 <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 0.85rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">
 하반기 8월~11월 사이 현금 흐름이 가장 왕성하며 문서운과 결합되어 부동산 또는 장기 보유 자산에서 큰 반등이 예상됩니다. 다만 음력 7월에는 충동적 지출이나 보증 요구가 발생할 수 있으니 자금 인출 창구를 엄격히 묶어두는 것이 현명합니다.
 </div>
 <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); background: var(--surface-container-lowest); padding: 0.45rem 0.75rem; border-radius: 6px;">
 <span>행운의 투자 방위</span>
 <span style="color: var(--primary); font-weight: 700;">동남방 (木·火 기운 합치)</span>
 </div>
 </div>

 <!-- 2. 직업·사업운 (Career) -->
 <div class="aspect-card" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.15rem; box-shadow: var(--shadow-sm);">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
 <div style="display: flex; align-items: center; gap: 0.65rem;">
 <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(242, 202, 80, 0.15); display: flex; align-items: center; justify-content: center; color: var(--primary);">
 <span class="material-symbols-outlined" style="font-size: 22px;">domain</span>
 </div>
 <div>
 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <span style="font-size: 1rem; font-weight: 700; color: #fff;">직업 · 사업운 (官運)</span>
 <div style="display: flex; color: var(--primary);">
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 </div>
 </div>
 <div style="font-size: 0.75rem; color: var(--text-muted);">이직 및 프로젝트 주도 길운</div>
 </div>
 </div>
 <span style="background: rgba(80, 200, 120, 0.15); color: #50c878; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">대길운</span>
 </div>
 <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 0.85rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">
 새로운 환경으로 이동하거나 독자적 비즈니스를 론칭하기에 최적화된 기운입니다. 손윗사람이나 경력직 멘토와의 협업에서 돌파구가 열립니다. 본인의 전문성을 대외적으로 공표할 때 계약 성사율이 극대화됩니다.
 </div>
 <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); background: var(--surface-container-lowest); padding: 0.45rem 0.75rem; border-radius: 6px;">
 <span>승진 및 계약 길일</span>
 <span style="color: var(--primary); font-weight: 700;">양력 5월 12일, 9월 21일</span>
 </div>
 </div>

 <!-- 3. 애정·인연운 (Love) -->
 <div class="aspect-card" style="background: var(--surface-container); border: 1px solid rgba(255, 51, 133, 0.25); border-radius: 12px; padding: 1.15rem; box-shadow: var(--shadow-sm);">
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
 <div style="display: flex; align-items: center; gap: 0.65rem;">
 <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(255, 51, 133, 0.15); display: flex; align-items: center; justify-content: center; color: var(--tertiary);">
 <span class="material-symbols-outlined" style="font-size: 22px;">favorite</span>
 </div>
 <div>
 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <span style="font-size: 1rem; font-weight: 700; color: #fff;">애정 · 인연운 (緣運)</span>
 <div style="display: flex; color: var(--primary);">
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 1;">star</span>
 <span class="material-symbols-outlined" style="font-size: 13px; font-variation-settings: 'FILL' 0;">star</span>
 </div>
 </div>
 <div style="font-size: 0.75rem; color: var(--text-muted);">기존 결속 심화 및 4월·10월 귀인</div>
 </div>
 </div>
 <span style="background: rgba(255, 51, 133, 0.15); color: var(--tertiary); font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">조화로움</span>
 </div>
 <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 0.85rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">
 상반기에는 감정적 기복을 줄이고 상호 신뢰를 다지는 대화가 요구됩니다. 솔로는 봄철(4월)과 가을철(10월)에 취미·직무 모임에서 오래 갈 귀인을 마주하게 됩니다.
 </div>
 <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); background: var(--surface-container-lowest); padding: 0.45rem 0.75rem; border-radius: 6px;">
 <span>최적의 데이트·만남 일진</span>
 <span style="color: var(--tertiary); font-weight: 700;">주말 미시(13:30 ~ 15:30)</span>
 </div>
 </div>
 </div>
 </section>
 `;
}

// ============================================================================
// 8. 천명원 5번 규격: 오행(五行) 에너지 분포도 (Segmented Multi-Bar + 5대 뱃지 + 진단 메시지 + 마보살 심층 명리 지표)
// ============================================================================
export interface CheonmyeongwonFiveElementsOptions {
 wood?: number;
 fire?: number;
 earth?: number;
 metal?: number;
 water?: number;
 woodPct?: number;
 firePct?: number;
 earthPct?: number;
 metalPct?: number;
 waterPct?: number;
 dominantElement?: string;
 deficientElement?: string;
 yongshin?: string;
 heeshin?: string;
 shingangStatus?: string;
 rsiScore?: number;
}

export function renderCheonmyeongwonFiveElementsMultiBar(options?: CheonmyeongwonFiveElementsOptions): string {
 const w = options?.wood ?? 1;
 const f = options?.fire ?? 1;
 const e = options?.earth ?? 4;
 const m = options?.metal ?? 1;
 const wa = options?.water ?? 1;
 const total = (w + f + e + m + wa) || 8;

 const wPct = options?.woodPct ?? Math.round((w / total) * 100);
 const fPct = options?.firePct ?? Math.round((f / total) * 100);
 const ePct = options?.earthPct ?? Math.round((e / total) * 100);
 const mPct = options?.metalPct ?? Math.round((m / total) * 100);
 const waPct = options?.waterPct ?? Math.max(0, 100 - (wPct + fPct + ePct + mPct));

 const dominant = options?.dominantElement || '토(土)';
 const deficient = options?.deficientElement || '수(水)';
 const yongshin = options?.yongshin || '금(金) / 수(水)';
 const heeshin = options?.heeshin || '수(水)';
 const shingangStatus = options?.shingangStatus || '신강(身强) · 득령득지';
 const rsiScore = options?.rsiScore ?? 86;

 return `
 <!-- 천명원 5번 규격: 오행(五行) 에너지 분포도 -->
 <section class="cheonmyeongwon-ohaeng-card" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.22); border-radius: 16px; padding: 1.25rem 1.35rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); margin-bottom: 1.5rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">pie_chart</span>
 <h3 style="font-size: 1.05rem; font-weight: 700; color: #dfe2f1; margin: 0;">오행(五行) 에너지 분포도</h3>
 </div>
 <div style="display: flex; align-items: center; gap: 0.4rem;">
 <span style="font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 9999px; background: rgba(255, 51, 133, 0.12); color: var(--tertiary); font-weight: 600;">8개 글자 기준</span>
 <span style="font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 9999px; background: rgba(242, 202, 80, 0.12); color: var(--primary); font-weight: 600;">마보살 정밀 분석</span>
 </div>
 </div>

 <!-- Segmented Multi-Bar Visualizer -->
 <div style="width: 100%; height: 12px; border-radius: 9999px; overflow: hidden; display: flex; background: var(--surface-container-lowest); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); margin-bottom: 1rem;">
 <div style="height: 100%; width: ${wPct}%; background: #ff3385; transition: width 0.6s ease;" title="목(木) ${wPct}%"></div>
 <div style="height: 100%; width: ${fPct}%; background: #ffb4ab; transition: width 0.6s ease;" title="화(火) ${fPct}%"></div>
 <div style="height: 100%; width: ${ePct}%; background: #f2ca50; transition: width 0.6s ease;" title="토(土) ${ePct}%"></div>
 <div style="height: 100%; width: ${mPct}%; background: #bec6dd; transition: width 0.6s ease;" title="금(金) ${mPct}%"></div>
 <div style="height: 100%; width: ${waPct}%; background: #3e475a; transition: width 0.6s ease;" title="수(水) ${waPct}%"></div>
 </div>

 <!-- Elemental Detail Badges Grid (5열) -->
 <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem; text-align: center; margin-bottom: 1rem;">
 <!-- Wood -->
 <div style="display: flex; flex-direction: column; align-items: center; padding: 0.55rem 0.2rem; border-radius: 10px; background: var(--surface-container-low); border: 1px solid rgba(255, 51, 133,0.15);">
 <span style="font-family: var(--font-display); font-size: 0.72rem; color: #22c55e; font-weight: 700;">목(木)</span>
 <span style="font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.15rem 0 0.1rem;">${wPct}%</span>
 <span style="font-size: 0.68rem; color: var(--text-muted);">성장 · 온화</span>
 </div>
 <!-- Fire -->
 <div style="display: flex; flex-direction: column; align-items: center; padding: 0.55rem 0.2rem; border-radius: 10px; background: var(--surface-container-low); border: 1px solid rgba(255,180,171,0.15);">
 <span style="font-family: var(--font-display); font-size: 0.72rem; color: #ef4444; font-weight: 700;">화(火)</span>
 <span style="font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.15rem 0 0.1rem;">${fPct}%</span>
 <span style="font-size: 0.68rem; color: var(--text-muted);">열정 · 표현</span>
 </div>
 <!-- Earth (Dominant) -->
 <div style="display: flex; flex-direction: column; align-items: center; padding: 0.55rem 0.2rem; border-radius: 10px; background: var(--surface-container-highest); border: 1px solid rgba(242,202,80,0.4); box-shadow: 0 2px 8px rgba(242,202,80,0.15);">
 <span style="font-family: var(--font-display); font-size: 0.72rem; color: #f59e0b; font-weight: 700;">토(土)</span>
 <span style="font-size: 0.95rem; font-weight: 800; color: var(--primary); margin: 0.15rem 0 0.1rem;">${ePct}%</span>
 <span style="font-size: 0.68rem; color: var(--primary); font-weight: 600;">포용 · 신용</span>
 </div>
 <!-- Metal -->
 <div style="display: flex; flex-direction: column; align-items: center; padding: 0.55rem 0.2rem; border-radius: 10px; background: var(--surface-container-low); border: 1px solid rgba(190,198,221,0.15);">
 <span style="font-family: var(--font-display); font-size: 0.72rem; color: #94a3b8; font-weight: 700;">금(金)</span>
 <span style="font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.15rem 0 0.1rem;">${mPct}%</span>
 <span style="font-size: 0.68rem; color: var(--text-muted);">결단 · 의리</span>
 </div>
 <!-- Water (Deficient) -->
 <div style="display: flex; flex-direction: column; align-items: center; padding: 0.55rem 0.2rem; border-radius: 10px; background: var(--surface-container-low); border: 1px solid rgba(62,71,90,0.4);">
 <span style="font-family: var(--font-display); font-size: 0.72rem; color: #3b82f6; font-weight: 700;">수(水) ▼</span>
 <span style="font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.15rem 0 0.1rem;">${waPct}%</span>
 <span style="font-size: 0.68rem; color: var(--text-muted);">지혜 · 유연</span>
 </div>
 </div>

 <!-- Elemental Balance Diagnostic Message -->
 <div style="display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.85rem 1rem; border-radius: 12px; background: var(--surface-container-high); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.85rem;">
 <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary); margin-top: 2px; flex-shrink: 0;">balance</span>
 <div style="display: flex; flex-direction: column; gap: 0.25rem;">
 <div style="font-size: 0.85rem; color: #dfe2f1; font-weight: 600; line-height: 1.5;">
 <strong style="color: var(--primary);">${dominant}</strong> 기운이 가장 왕성하고, 
 <strong style="color: #93c5fd;">${deficient}</strong> 기운이 다소 부족하여 균형이 필요한 사주입니다.
 </div>
 <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.45;">
 포용력과 현실적 신뢰감이 뛰어난 반면, 유연한 소통과 감정적 환기를 채우는 것이 운세 상승의 핵심입니다.
 </div>
 </div>
 </div>

 <!-- 마보살만의 독보적 심층 명리 메트릭 (천명원 초월 지표) -->
 <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: var(--surface-container-lowest); border-radius: 10px; padding: 0.65rem 0.85rem; border: 1px solid rgba(242, 202, 80, 0.18);">
 <div style="display: flex; flex-direction: column; align-items: center; border-right: 1px solid rgba(255,255,255,0.06);">
 <span style="font-size: 0.68rem; color: var(--text-muted);">명리 신강약</span>
 <span style="font-size: 0.82rem; font-weight: 700; color: var(--primary); margin-top: 0.15rem;">${shingangStatus}</span>
 </div>
 <div style="display: flex; flex-direction: column; align-items: center; border-right: 1px solid rgba(255,255,255,0.06);">
 <span style="font-size: 0.68rem; color: var(--text-muted);">길신 용신(用神)</span>
 <span style="font-size: 0.82rem; font-weight: 700; color: #ff3385; margin-top: 0.15rem;">${yongshin}</span>
 </div>
 <div style="display: flex; flex-direction: column; align-items: center;">
 <span style="font-size: 0.68rem; color: var(--text-muted);">마보살 RSI 안정도</span>
 <span style="font-size: 0.82rem; font-weight: 700; color: #50c878; margin-top: 0.15rem;">${rsiScore}점 (최상급)</span>
 </div>
 </div>
 </section>
 `;
}

// ============================================================================
// 9. 천명원 5번 규격: 일주(日柱) 본원 핵심 성향 카드 & 기운 보완 처방 (풍수 & 라이프)
// ============================================================================
export interface CheonmyeongwonDayMasterOptions {
 dayPillarTitle?: string;
 archetypeEn?: string;
 heroCopy?: string;
 keywords?: string[];
 descriptionP1?: string;
 descriptionP2?: string;
 remedyWater?: string;
 remedyMetal?: string;
 luckyDirection?: string;
}

export function renderCheonmyeongwonDayMasterArchetype(options?: CheonmyeongwonDayMasterOptions): string {
 const title = options?.dayPillarTitle || '기축(己丑) 비옥한 전답';
 const archetypeEn = options?.archetypeEn || 'Golden Earth Fertile Field';
 const heroCopy = options?.heroCopy || '"만물을 싹틔우고 품어내는 비옥하고 묵직한 대지의 어머니 같은 포용력"';
 const keywords = options?.keywords || ['#신중함', '#현실감각', '#지속력', '#포용력', '#신뢰의아이콘'];
 const p1 = options?.descriptionP1 || '기축(己丑) 일주는 차분하고 비옥한 습토(濕土)가 지지의 축토(丑土) 금고(金庫)를 품고 있는 형상으로, 겉으로는 온화하고 순박해 보이지만 내면에는 거대한 끈기와 불굴의 결단력을 감추고 있습니다.';
 const p2 = options?.descriptionP2 || '신용과 약속을 목숨처럼 여기며 현실적 실리를 확실하게 챙기는 재능이 탁월합니다. 다만 한번 고집을 부리면 타협이 어려울 수 있으니, 유연한 소통과 감정의 환기를 의식적으로 챙길 때 대운의 기회가 만개합니다.';
 const remedyWater = options?.remedyWater || '미온수 자주 마시기, 호수나 바다 산책, 네이비·블루 계열 포인트 패션';
 const remedyMetal = options?.remedyMetal || '메탈 시계나 실버 액세서리 착용, 명확한 기록 및 정리정돈 루틴';
 const luckyDirection = options?.luckyDirection || '북쪽(水)과 서쪽(金) 서재 및 침대 머리 방향 권장';

 return `
 <!-- 일주(日柱) 본원 핵심 성향 카드 -->
 <section class="cheonmyeongwon-daymaster-card" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.22); border-radius: 16px; padding: 1.25rem 1.35rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); margin-bottom: 1.5rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
 <div style="display: flex; align-items: center; gap: 0.5rem;">
 <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">psychology</span>
 <h3 style="font-size: 1.05rem; font-weight: 700; color: #dfe2f1; margin: 0;">일주(日柱) 본원 핵심 성향</h3>
 </div>
 <span style="font-family: var(--font-display); font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 9999px; background: var(--surface-container-highest); color: var(--primary); font-weight: 700;">본원(本源) 아키타입</span>
 </div>

 <!-- Personality Title & Archetype Hero -->
 <div style="background: var(--surface-container-low); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.15rem 1.25rem; margin-bottom: 1rem; position: relative; overflow: hidden;">
 <div style="display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;">
 <span style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: var(--primary);">${title}</span>
 <span style="font-family: var(--font-display); font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;">${archetypeEn}</span>
 </div>
 <p style="font-size: 0.9rem; font-weight: 600; color: #dfe2f1; margin: 0.45rem 0 0.75rem 0; line-height: 1.5;">
 ${heroCopy}
 </p>
 <!-- Keywords Tags -->
 <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
 ${keywords.map(kw => `<span style="padding: 0.2rem 0.6rem; border-radius: 9999px; background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); color: var(--primary); font-size: 0.72rem; font-weight: 600;">${kw}</span>`).join('')}
 </div>
 </div>

 <!-- Deep Dive Analysis -->
 <div style="display: flex; flex-direction: column; gap: 0.65rem; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.65; margin-bottom: 1rem;">
 <p style="margin: 0;">${p1}</p>
 <p style="margin: 0;">${p2}</p>
 </div>

 <!-- Prescriptive Remedy Card (보완 처방) -->
 <div style="background: var(--surface-container-high); border: 1px solid rgba(242, 202, 80, 0.2); border-radius: 12px; padding: 0.95rem 1.15rem;">
 <div style="display: flex; align-items: center; gap: 0.45rem; color: var(--primary); margin-bottom: 0.6rem;">
 <span class="material-symbols-outlined" style="font-size: 18px;">spa</span>
 <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin: 0;">기운 보완 처방 (풍수 & 라이프)</h4>
 </div>
 <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.8rem; color: #dfe2f1;">
 <li style="display: flex; align-items: center; gap: 0.5rem;">
 <span style="width: 6px; height: 6px; border-radius: 50%; background: #ff3385; flex-shrink: 0;"></span>
 <span><strong style="color: #ff3385;">수(水) 기운 보완:</strong> ${remedyWater}</span>
 </li>
 <li style="display: flex; align-items: center; gap: 0.5rem;">
 <span style="width: 6px; height: 6px; border-radius: 50%; background: #bec6dd; flex-shrink: 0;"></span>
 <span><strong style="color: #bec6dd;">금(金) 기운 보완:</strong> ${remedyMetal}</span>
 </li>
 <li style="display: flex; align-items: center; gap: 0.5rem;">
 <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary); flex-shrink: 0;"></span>
 <span><strong style="color: var(--primary);">행운의 방위:</strong> ${luckyDirection}</span>
 </li>
 </ul>
 </div>
 </section>
 `;
}

// ============================================================================
// 10. 천명원 10번 규격: 메인 홈 일진 대시보드 (Celestial Reading + 천기지수 서클 게이지 + LUCKY CODEX + 4대 비전)
// ============================================================================
export interface CheonmyeongwonDailyDashboardOptions {
 calcResult?: any;
 sajuCore?: any;
 signal?: any;
 relationship?: any;
 userName?: string;
 gender?: 'male' | 'female';
 lunarDate?: string;
 ganjiDate?: string;
 score?: number;
 gradeBadge?: string;
 summaryTitle?: string;
 summaryDesc?: string;
 moneyScore?: number;
 loveScore?: number;
 vitalityScore?: number;
 targetElement?: string;
 yongshin?: string;
 luckyColor?: string;
 luckyDirection?: string;
 luckyNumber?: string;
 wiseQuote?: string;
}

/**
 * 오늘 실제 접속 날짜의 음력 및 60갑자 일진 실시간 산출
 */
export function getTodayCalendarContext(): { lunarDateStr: string; ganjiDateStr: string; todayPillarName: string } {
 const p = DailyFortuneEngine.getDailyPillar();
 return {
 lunarDateStr: p.lunarDateStr,
 ganjiDateStr: `${p.ganjiDateStr} (오늘의 일진)`,
 todayPillarName: p.pillarName,
 };
}

export function renderCheonmyeongwonDailyDashboard(options?: CheonmyeongwonDailyDashboardOptions): string {
 const sajuCore = options?.sajuCore || options?.calcResult?.saju_core;
 const signal = options?.signal || options?.calcResult?.signal;
 const relationship = options?.relationship || options?.calcResult?.relationships;
 const userName = options?.userName || '의뢰인';

 // 마보살 DailyFortuneEngine을 통한 실시간 천기지수 & 3대 세부 지수 정밀 산출
 const dynamicScores = DailyFortuneEngine.calculate({
 sajuCore,
 signal,
 relationship,
 userName,
 gender: options?.gender,
 });

 const now = new Date();
 const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
 const solarDateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${dayNames[now.getDay()]})`;
 const rawLunar = options?.lunarDate || dynamicScores.lunarDateStr;
 const lunarDate = rawLunar.includes('음력') ? rawLunar : `음력 ${rawLunar}`;
 const combinedDateBadge = `양력 ${solarDateStr} · ${lunarDate}`;
 const ganjiDate = options?.ganjiDate || `${dynamicScores.ganjiDateStr} (오늘의 일진)`;
 const score = options?.score ?? dynamicScores.celestialScore;
 const gradeBadge = options?.gradeBadge || dynamicScores.gradeBadge;
 const summaryTitle = options?.summaryTitle || dynamicScores.summaryTitle;
 const summaryDesc = options?.summaryDesc || dynamicScores.summaryDesc;
 const moneyScore = options?.moneyScore ?? dynamicScores.moneyScore;
 const moneyDesc = dynamicScores.moneyDesc;
 const loveScore = options?.loveScore ?? dynamicScores.loveScore;
 const loveDesc = dynamicScores.loveDesc;
 const vitalityScore = options?.vitalityScore ?? dynamicScores.vitalityScore;
 const vitalityDesc = dynamicScores.vitalityDesc;
 const isPersonalized = dynamicScores.isPersonalized;

 // 원형 게이지 둘레 계산 (둘레: 263.89)
 const strokeOffset = Math.max(0, Math.min(263.89, 263.89 * (1 - score / 100)));

 // 정통 명리학 오행·하도낙서 기반 실시간 행운 코드 산출
 const stemObj = sajuCore?.pillars?.day?.stem || sajuCore?.four_pillars?.day?.stem;
 let detectedTargetEl: string = '토';
 if (typeof stemObj === 'object' && stemObj?.element) {
   detectedTargetEl = stemObj.element;
 } else if (sajuCore?.day_element) {
   detectedTargetEl = sajuCore.day_element;
 } else if ((sajuCore as any)?.fact?.day_element) {
   detectedTargetEl = (sajuCore as any).fact.day_element;
 } else if (typeof stemObj === 'string' || typeof (sajuCore as any)?.day_stem === 'string') {
   const sChar = typeof stemObj === 'string' ? stemObj : (sajuCore as any).day_stem;
   const stemMap: Record<string, string> = {
     '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토', '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
     '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토', '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수'
   };
   detectedTargetEl = stemMap[sChar] || '토';
 }
 const codex = calculateLuckyCodex(options?.yongshin || options?.targetElement || detectedTargetEl);
 const luckyColor = options?.luckyColor || codex.luckyColor.name;
 const luckyColorHex = codex.luckyColor.hex;
 const luckyDirection = options?.luckyDirection || codex.luckyDirection.name;
 const luckyNumber = options?.luckyNumber || codex.luckyNumbers;
 const wiseQuote = options?.wiseQuote || codex.wiseQuote;

 // SPECIAL EDITION 배너 개인화 변수 산출
 let dayMasterChar = (typeof stemObj === 'object' ? stemObj?.char : stemObj) || (sajuCore as any)?.day_stem;
 let dayMasterEl = (typeof stemObj === 'object' ? stemObj?.element : undefined) || (sajuCore as any)?.day_element || detectedTargetEl;
 if (typeof dayMasterChar === 'object') {
   dayMasterChar = (dayMasterChar as any)?.char || (dayMasterChar as any)?.name;
 }
 const dayMasterDesc = dayMasterChar && dayMasterEl ? `${dayMasterChar}${dayMasterEl}` : '';
 const specialBadgeText = isPersonalized ? `SPECIAL EDITION · ${userName} 님 1:1 맞춤 본명궁` : `SPECIAL EDITION · 신년 정밀 대운 비책`;
 const specialTitle = isPersonalized && dayMasterDesc
 ? `병오년(丙午年) 붉은 말의 해 · ${dayMasterDesc} 본원 정밀 비책`
 : `병오년(丙午年) 붉은 말의 해`;
 const specialSubDesc = isPersonalized
 ? `${userName} 님의 본명궁과 오행 균형에 최적화된 2026/2027 재물운 &amp; 관운 정밀 분석서`
 : `의뢰인의 본명궁에 맞춘 재물운 &amp; 관운 정밀 분석서 (출생정보 입력 시 1:1 맞춤 전환)`;

 return `
 <!-- 천명원 10번 규격: Celestial Reading 메인 홈 일진 대시보드 -->
 <div class="cheonmyeongwon-daily-dashboard" style="margin-bottom: 2rem;">

 <!-- [1. 최상단 배치] 오늘의 행운 처방 (LUCKY CODEX 제거하고 날짜 배치) -->
 <div style="border-radius: 14px; background: var(--surface-container-low); padding: 1rem 1.15rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid rgba(242, 202, 80, 0.25); margin-bottom: 1.25rem;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.45rem;">
        <span class="material-symbols-outlined" style="font-size: 19px; color: var(--primary);">verified</span>
        <h3 style="font-size: 1rem; font-weight: 800; color: #dfe2f1; margin: 0;">오늘의 행운 처방</h3>
      </div>
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="font-size: 0.75rem; color: var(--primary); background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.25); padding: 0.2rem 0.65rem; border-radius: 9999px; font-weight: 600;">${combinedDateBadge}</span>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
      <!-- 행운의 색 -->
      <div class="interactive-prescription-card" data-prescription-card="color" data-val="${luckyColor}" data-hex="${luckyColorHex}" style="display: flex; flex-direction: column; padding: 0.6rem; border-radius: 8px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease; position: relative;" title="클릭하여 행운의 색 코디 &amp; 풍수 비책 보기">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.68rem; color: var(--text-muted);">행운의 색</span>
          <span class="material-symbols-outlined" style="font-size: 13px; color: var(--primary); opacity: 0.7;">touch_app</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${luckyColorHex}; box-shadow: 0 0 6px ${luckyColorHex}; display: inline-block;"></span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #dfe2f1;">${luckyColor}</span>
        </div>
      </div>
      
      <!-- 행운의 방위 -->
      <div class="interactive-prescription-card" data-prescription-card="direction" data-val="${luckyDirection}" style="display: flex; flex-direction: column; padding: 0.6rem; border-radius: 8px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease; position: relative;" title="클릭하여 행운의 방위 개운법 보기">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.68rem; color: var(--text-muted);">행운의 방위</span>
          <span class="material-symbols-outlined" style="font-size: 13px; color: var(--primary); opacity: 0.7;">touch_app</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
          <span class="material-symbols-outlined" style="font-size: 13px; color: var(--primary);">explore</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #dfe2f1;">${luckyDirection}</span>
        </div>
      </div>
      
      <!-- 행운의 수 -->
      <div class="interactive-prescription-card" data-prescription-card="number" data-val="${luckyNumber}" style="display: flex; flex-direction: column; padding: 0.6rem; border-radius: 8px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease; position: relative;" title="클릭하여 행운의 수 활용 가이드 보기">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.68rem; color: var(--text-muted);">행운의 수</span>
          <span class="material-symbols-outlined" style="font-size: 13px; color: var(--primary); opacity: 0.7;">touch_app</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
          <span class="material-symbols-outlined" style="font-size: 13px; color: var(--primary);">pin</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #dfe2f1;">${luckyNumber}</span>
        </div>
      </div>
    </div>
    
    <!-- 지혜의 한 줄 (클릭 시 마인드셋 모달) -->
    <div class="interactive-prescription-card" data-prescription-card="quote" data-val="${wiseQuote}" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.65rem; padding: 0.75rem 0.85rem; border-radius: 8px; background: rgba(38, 42, 53, 0.7); border: 1px solid rgba(255,255,255,0.06); color: #dfe2f1; cursor: pointer; transition: all 0.2s ease;" title="클릭하여 지혜의 한 줄 상세 해설 보기">
      <div style="display: flex; align-items: flex-start; gap: 0.5rem; flex: 1;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary); flex-shrink: 0; margin-top: 1px;">tips_and_updates</span>
        <p style="font-size: 0.78rem; line-height: 1.5; margin: 0; color: rgba(223,226,241,0.92);">
          <strong style="color: var(--primary);">지혜의 한 줄:</strong> ${wiseQuote}
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 0.15rem; color: var(--primary); font-size: 0.7rem; font-weight: 700; flex-shrink: 0;">
        <span>해설</span>
        <span class="material-symbols-outlined" style="font-size: 14px;">chevron_right</span>
      </div>
    </div>
  </div>

  <!-- [2. 중간 배치] 행운지수 게이지 카드 (클릭 시 심층 분석 모달 오픈 - 그라데이션 제거 단색 배경) -->
  <div class="interactive-fortune-score-card" data-open-score-modal="true" 
       data-score="${score}"
       data-grade="${gradeBadge}"
       data-title="${summaryTitle}"
       data-desc="${summaryDesc}"
       data-money-score="${moneyScore}"
       data-money-desc="${moneyDesc}"
       data-love-score="${loveScore}"
       data-love-desc="${loveDesc}"
       data-vitality-score="${vitalityScore}"
       data-vitality-desc="${vitalityDesc}"
       style="position: relative; overflow: hidden; border-radius: 16px; background: var(--surface-container); padding: 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 1.25rem; cursor: pointer; transition: all 0.2s ease;" title="클릭하여 오늘의 천기지수 심층 분석 보기">

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 1.15rem; position: relative; z-index: 1;">
      <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.5rem; border-radius: 6px; background: rgba(242, 202, 80, 0.15); color: var(--primary); font-size: 0.72rem; font-weight: 700; width: fit-content;">
            <span class="material-symbols-outlined" style="font-size: 13px;">auto_awesome</span>
            <span>${gradeBadge}</span>
          </div>
          <span style="font-size: 0.7rem; color: var(--primary); font-weight: 700; display: inline-flex; align-items: center; gap: 0.1rem;">
            상세 보기 <span class="material-symbols-outlined" style="font-size: 13px;">chevron_right</span>
          </span>
        </div>
        <p style="font-size: 0.98rem; font-weight: 700; color: #dfe2f1; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${summaryTitle}
        </p>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0.25rem 0 0 0; line-height: 1.4;">
          ${summaryDesc}
        </p>
      </div>

      <!-- SVG Circle Gauge (우측 배치) -->
      <div style="position: relative; width: 88px; height: 88px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-90deg);">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-container-highest)" stroke-width="7" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" stroke-width="7.5" stroke-linecap="round" stroke-dasharray="263.89" stroke-dashoffset="${strokeOffset.toFixed(1)}" style="transition: stroke-dashoffset 1s ease-out;" />
        </svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <span style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; color: var(--primary); line-height: 1;">${score}</span>
          <span style="font-family: var(--font-display); font-size: 0.62rem; color: var(--text-muted); letter-spacing: 0.05em; margin-top: 2px;">행운지수</span>
        </div>
      </div>
    </div>

    <!-- 3대 세부 메트릭 (금전 / 애정 / 활력) - 마보살 명리 엔진 동적 연동 -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 1;">
      <div class="interactive-metric-item" data-open-score-modal="true" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 8px; background: rgba(38, 42, 53, 0.6); text-align: center; cursor: pointer; transition: all 0.2s ease;">
        <span style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.15rem;">금전운</span>
        <div style="display: flex; align-items: center; gap: 0.2rem; color: var(--primary);">
          <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">payments</span>
          <span style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 700;">${moneyScore}점</span>
        </div>
        <span style="font-size: 0.6rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${moneyDesc}</span>
      </div>
      <div class="interactive-metric-item" data-open-score-modal="true" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 8px; background: rgba(38, 42, 53, 0.6); text-align: center; cursor: pointer; transition: all 0.2s ease;">
        <span style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.15rem;">애정운</span>
        <div style="display: flex; align-items: center; gap: 0.2rem; color: var(--tertiary);">
          <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">favorite</span>
          <span style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 700;">${loveScore}점</span>
        </div>
        <span style="font-size: 0.6rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${loveDesc}</span>
      </div>
      <div class="interactive-metric-item" data-open-score-modal="true" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 8px; background: rgba(38, 42, 53, 0.6); text-align: center; cursor: pointer; transition: all 0.2s ease;">
        <span style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.15rem;">활력도</span>
        <div style="display: flex; align-items: center; gap: 0.2rem; color: #bec6dd;">
          <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">bolt</span>
          <span style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 700;">${vitalityScore}점</span>
        </div>
        <span style="font-size: 0.6rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${vitalityDesc}</span>
      </div>
    </div>
  </div>

  <!-- [3. 비전 바로가기 위쪽 배치] 오늘의 황금 길시(吉時) -->
  ${renderDailyAuspiciousHoursWidget()}

  <!-- [4. 비전(秘傳) 바로가기 4대 퀵 액션 그리드] -->
  <div style="margin-bottom: 1.5rem;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
      <h3 style="font-size: 0.95rem; font-weight: 700; color: #dfe2f1; margin: 0;">비전(秘傳) 바로가기</h3>
      <span style="font-size: 0.7rem; color: var(--text-muted);">4대 천명 분석 바로가기</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
      <button type="button" class="btn-quick-nav" data-action="goto-saju" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem 0.25rem; border-radius: 12px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease;" title="정통 사주 원국 분석 열기">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 22px;">grid_view</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 600; color: #dfe2f1;">정통 사주</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 1px;">원국 풀이</span>
      </button>
      <button type="button" class="btn-quick-nav" data-action="goto-chemistry" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem 0.25rem; border-radius: 12px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease;" title="인연 궁합 분석 열기">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center; color: var(--tertiary); margin-bottom: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 22px;">diversity_1</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 600; color: #dfe2f1;">인연 궁합</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 1px;">연인·동업</span>
      </button>
      <button type="button" class="btn-quick-nav" data-action="goto-tarot" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem 0.25rem; border-radius: 12px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease;" title="심층 타로 3카드 리딩 열기">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center; color: #bec6dd; margin-bottom: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 22px;">style</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 600; color: #dfe2f1;">심층 타로</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 1px;">3카드 점</span>
      </button>
      <button type="button" class="btn-quick-nav" data-action="goto-daeun" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem 0.25rem; border-radius: 12px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s ease;" title="10년 주기 대운 흐름 분석 열기">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 22px;">cyclone</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 600; color: #dfe2f1;">대운 흐름</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 1px;">10년 주기</span>
      </button>
    </div>
  </div>

  <!-- [천명원 10번 복원 요소 1] Special 신년 심층 대운 배너 (개별 사주 맞춤 연동 + 전체 클릭 가능) -->
  <div class="btn-goto-newyear-2027 special-newyear-banner-card" data-action="goto-newyear" style="position: relative; overflow: hidden; border-radius: 16px; background: linear-gradient(135deg, rgba(62,71,90,0.6) 0%, rgba(28,31,42,0.95) 50%, rgba(38,42,53,0.8) 100%); padding: 1.15rem 1.25rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 1.5rem; cursor: pointer; transition: all 0.25s ease;" title="클릭하여 신년 심층 대운 풀이 열람하기">
    <div style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1;">
      <div style="display: flex; flex-direction: column; max-width: 68%;">
        <div style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background: rgba(242,202,80,0.2); color: var(--primary); font-family: var(--font-display); font-size: 0.68rem; font-weight: 700; width: fit-content; margin-bottom: 0.35rem;">
          ${specialBadgeText}
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: #dfe2f1; margin: 0;">
          ${specialTitle}
        </h3>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0.25rem 0 0.65rem 0; line-height: 1.4;">
          ${specialSubDesc}
        </p>
        <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--primary); font-size: 0.78rem; font-weight: 700;">
          <span>신년 심층 대운 풀이 열람하기</span>
          <span class="material-symbols-outlined" style="font-size: 15px;">arrow_forward</span>
        </div>
      </div>
      <div style="position: relative; width: 72px; height: 72px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(242,202,80,0.15); filter: blur(10px);"></div>
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXCUSPiOryMj_SxhWUc8IdjmjcPSitkxidRX35fm1KAfrQVczqvUIh1X7sT9SP6LZqW1S73Xb3uzk0MQq6O6sLhNZTzOhQOHCsp81c0p6TarG9CC7H-jOOPdKymubI0IoQABhNzLERO5J6I00HaokVPkcbNRwqfKJ7-E4aKipYZBcYIh2DWYcUex8EeivOqJv8yijuwImpYgjSeD7iQZVX101gqByM46705NqgPJwR" alt="Celestial Emblem" style="width: 64px; height: 64px; object-fit: contain; position: relative; z-index: 1; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" />
      </div>
    </div>
  </div>

 <!-- [천명원 10번 복원 요소 2] 실시간 명리 마스터 가로 스크롤 캐러셀 (관리자 제어) -->
 ${ModuleRegistry.isEnabled('feature_realtime_masters') ? `
 <div style="margin-bottom: 1.5rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
 <div style="display: flex; align-items: center; gap: 0.45rem;">
 <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
 <h3 style="font-size: 0.95rem; font-weight: 700; color: #dfe2f1; margin: 0;">실시간 명리 마스터</h3>
 </div>
 <a href="#master-list" class="btn-quick-nav" data-target="sajuFormCard" style="font-size: 0.72rem; color: var(--primary); display: flex; align-items: center; text-decoration: none;">
 전체 보기 <span class="material-symbols-outlined" style="font-size: 14px;">chevron_right</span>
 </a>
 </div>
 <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none;">
 ${(() => {
 const activeVendors = CatalogStore.getVendors().filter(v => v.enabled);
 if (activeVendors.length === 0) {
 return `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">현재 대기 중인 상담사가 없습니다.</div>`;
 }
 return activeVendors.map(v => `
 <div style="min-width: 250px; max-width: 250px; border-radius: 14px; background: var(--surface-container); padding: 0.95rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; justify-content: space-between;">
 <div>
 <div style="display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: 0.65rem;">
 <div style="position: relative; flex-shrink: 0;">
 <img src="${v.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'}" alt="${v.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
 <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background: #10b981; border: 2px solid var(--surface-container);"></span>
 </div>
 <div style="display: flex; flex-direction: column; min-width: 0;">
 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <span style="font-size: 0.95rem; font-weight: 700; color: #dfe2f1;">${v.name}</span>
 <span style="font-size: 0.65rem; color: #34d399; background: rgba(5,46,22,0.6); padding: 0.1rem 0.35rem; border-radius: 4px;">상담중</span>
 </div>
 <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">${v.specialty}</span>
 <div style="display: flex; align-items: center; gap: 0.2rem; margin-top: 2px;">
 <span class="material-symbols-outlined" style="font-size: 13px; color: var(--primary); font-variation-settings: 'FILL' 1;">star</span>
 <span style="font-family: var(--font-display); font-size: 0.72rem; font-weight: 700; color: #dfe2f1;">${v.rating}</span>
 <span style="font-size: 0.68rem; color: var(--text-muted);">(${v.consultationCount.toLocaleString()}회)</span>
 </div>
 </div>
 </div>
 <p style="font-size: 0.75rem; color: rgba(223,226,241,0.85); background: rgba(38,42,53,0.6); border-radius: 8px; padding: 0.5rem; margin: 0; line-height: 1.4;">
 "타고난 명리의 흐름을 읽고 최적의 대처 비책을 안내합니다."
 </p>
 </div>
 <div style="margin-top: 0.75rem; padding-top: 0.65rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between;">
 <span style="font-family: var(--font-display); font-size: 0.8rem; font-weight: 700; color: var(--primary);">${ModuleRegistry.isEnabled('feature_yeop_wallet') ? '1,800엽' : '₩ 18,000'} <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: normal;">/ 10분</span></span>
 <button type="button" class="btn-quick-nav" data-target="sajuFormCard" style="padding: 0.3rem 0.65rem; border-radius: 6px; background: var(--primary); color: #241a00; font-size: 0.72rem; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.2rem;">
 <span class="material-symbols-outlined" style="font-size: 13px;">call</span> 상담 연결
 </button>
 </div>
 </div>
 `).join('');
 })()}
 </div>
 </div>
 ` : ''}

 <!-- [천명원 10번 복원 요소 3] 오늘 자정 마감 운세 퀴즈 배너 -->
 <div style="position: relative; overflow: hidden; border-radius: 14px; background: linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface-container) 100%); padding: 1rem 1.15rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between;">
 <div style="display: flex; align-items: center; gap: 0.75rem;">
 <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(242,202,80,0.2); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
 <span class="material-symbols-outlined" style="font-size: 22px;">psychology_alt</span>
 </div>
 <div style="display: flex; flex-direction: column;">
 <div style="display: flex; align-items: center; gap: 0.4rem;">
 <span style="font-size: 0.92rem; font-weight: 700; color: #dfe2f1;">오늘 자정 마감 운세 퀴즈</span>
 </div>
 <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.15rem 0 0 0;">
 내 사주 원국에서 가장 왕성한 오행과 결핍된 오행은?
 </p>
 </div>
 </div>
 <button type="button" class="btn-quick-nav" data-target="sajuFormCard" style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface-container-highest); display: flex; align-items: center; justify-content: center; color: #dfe2f1; border: none; cursor: pointer;">
 <span class="material-symbols-outlined" style="font-size: 18px;">play_arrow</span>
 </button>
 </div>
 </div>
 `;
}

// ============================================================================
// 11. 천명원 12번 & 3번 규격: 대길(大吉) 황금 결실 부적 카드 (Amulet Specimen)
// ============================================================================
export interface CheonmyeongwonTalismanOptions {
 userName?: string;
 talismanTitle?: string;
 charSymbol?: string;
 subTitle?: string;
 absorptionRate?: number;
 noblemanScore?: number;
}

export function renderCheonmyeongwonTalismanCard(options?: CheonmyeongwonTalismanOptions): string {
 const userName = options?.userName || '의뢰인';
 const title = options?.talismanTitle || '갑진일 황금 결실 부적';
 const charSymbol = options?.charSymbol || '結';
 const subTitle = options?.subTitle || '대운 황금 재고(財庫) 개방 • 만사형통';
 const rate = options?.absorptionRate ?? 96;
 const nobleman = options?.noblemanScore ?? 94;

 return `
 <!-- [천명원 12번 규격] 대길 황금 결실 수호 부적 카드 -->
 <section class="cheonmyeongwon-talisman-card" style="position: relative; overflow: hidden; border-radius: 20px; background: linear-gradient(180deg, #1c1f2a 0%, #0f131d 100%); border: 1.5px solid rgba(242, 202, 80, 0.4); padding: 1.5rem 1.25rem; box-shadow: 0 16px 40px rgba(0,0,0,0.6); margin-bottom: 2rem;">
 <!-- Corner Sparks Decoration -->
 <div style="position: absolute; top: 10px; left: 12px; color: rgba(242,202,80,0.6); font-size: 14px;"></div>
 <div style="position: absolute; top: 10px; right: 12px; color: rgba(242,202,80,0.6); font-size: 14px;"></div>
 <div style="position: absolute; bottom: 10px; left: 12px; color: rgba(242,202,80,0.6); font-size: 14px;"></div>
 <div style="position: absolute; bottom: 10px; right: 12px; color: rgba(242,202,80,0.6); font-size: 14px;"></div>

 <!-- Celestial Top Tag -->
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
 <span style="font-family: var(--font-display); font-size: 0.7rem; color: var(--primary); background: rgba(242,202,80,0.15); padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 700; border: 1px solid rgba(242,202,80,0.3);">
 天命院 • 大吉 結實符
 </span>
 <span style="font-family: var(--font-display); font-size: 0.68rem; color: var(--text-muted); letter-spacing: 0.08em;">SACRED TALISMAN</span>
 </div>

 <div style="text-align: center; margin: 0.75rem 0 1.25rem;">
 <h3 style="font-family: var(--font-serif); font-size: 1.35rem; font-weight: 800; color: var(--primary); margin: 0 0 0.25rem;">
 ${title}
 </h3>
 <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">
 ${subTitle}
 </p>
 </div>

 <!-- Sacred Rotating Astrological Emblem (結) -->
 <div style="position: relative; width: 110px; height: 110px; margin: 0 auto 1.25rem; display: flex; align-items: center; justify-content: center;">
 <svg viewBox="0 0 120 120" style="position: absolute; inset: 0; width: 100%; height: 100%; animation: spin 30s linear infinite;">
 <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(242,202,80,0.25)" stroke-width="1.5" stroke-dasharray="3 3" />
 <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(242,202,80,0.5)" stroke-width="1" />
 <circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255, 51, 133,0.3)" stroke-width="1.5" stroke-dasharray="6 4" />
 <circle cx="60" cy="6" r="3" fill="#f2ca50" />
 <circle cx="114" cy="60" r="2.5" fill="#ff3385" />
 <circle cx="6" cy="60" r="2.5" fill="#f2ca50" />
 <circle cx="60" cy="114" r="2" fill="#ffe088" />
 </svg>
 <div style="width: 68px; height: 68px; border-radius: 50%; background: rgba(38,42,53,0.92); box-shadow: 0 0 24px rgba(242,202,80,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1; border: 1px solid rgba(242,202,80,0.5);">
 <span style="font-family: var(--font-serif); font-size: 2rem; font-weight: 800; color: var(--primary); line-height: 1;">${charSymbol}</span>
 <span style="font-family: var(--font-display); font-size: 0.6rem; color: #ff3385; letter-spacing: 0.1em; font-weight: 700;">HARVEST</span>
 </div>
 </div>

 <!-- Master Ledger Bar -->
 <div style="background: rgba(15,19,29,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
 <div style="display: flex; align-items: baseline; gap: 0.4rem;">
 <span style="font-size: 0.75rem; color: var(--text-muted);">명주(命主)</span>
 <span style="font-size: 0.95rem; font-weight: 700; color: #dfe2f1;">${userName} 님</span>
 </div>
 <span style="font-size: 0.72rem; color: #ff3385; background: rgba(255, 51, 133,0.12); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 600;">
 천기 감응 완료
 </span>
 </div>
 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.5rem;">
 <div style="display: flex; flex-direction: column; gap: 0.2rem;">
 <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted);">
 <span>호운(好運) 흡수율</span>
 <span style="color: var(--primary); font-weight: 700;">${rate}%</span>
 </div>
 <div style="width: 100%; height: 5px; border-radius: 9999px; background: rgba(255,255,255,0.08); overflow: hidden;">
 <div style="width: ${rate}%; height: 100%; background: linear-gradient(90deg, #d4af37, #f2ca50); border-radius: 9999px;"></div>
 </div>
 </div>
 <div style="display: flex; flex-direction: column; gap: 0.2rem;">
 <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted);">
 <span>귀인(貴人) 감응도</span>
 <span style="color: #ff3385; font-weight: 700;">${nobleman}%</span>
 </div>
 <div style="width: 100%; height: 5px; border-radius: 9999px; background: rgba(255,255,255,0.08); overflow: hidden;">
 <div style="width: ${nobleman}%; height: 100%; background: linear-gradient(90deg, #2dc3e1, #ff3385); border-radius: 9999px;"></div>
 </div>
 </div>
 </div>
 </div>

 <!-- Dual Action Buttons -->
 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
 <button type="button" id="btn-save-talisman" class="btn-cta-secondary" style="padding: 0.65rem; border-radius: 10px; background: rgba(38,42,53,0.9); border: 1px solid rgba(255,255,255,0.12); color: #dfe2f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">download</span>
 부적 이미지 저장
 </button>
 <button type="button" id="btn-open-share-modal" class="btn-cta-primary" style="padding: 0.65rem; border-radius: 10px; background: var(--primary); color: #241a00; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem; box-shadow: 0 4px 14px rgba(242,202,80,0.3);">
 <span class="material-symbols-outlined" style="font-size: 16px;">share</span>
 길운 나누기 (+100엽)
 </button>
 </div>
 </section>
 `;
}

// ============================================================================
// 12. 천명원 3번 규격: 부적 길운 나누기 바텀시트 공유 모달
// ============================================================================
export function renderCheonmyeongwonShareModal(): string {
 return `
 <div id="cheonmyeongwon-share-modal" style="display: none; position: fixed; inset: 0; z-index: 1000; background: rgba(10,14,24,0.85); backdrop-filter: blur(12px); align-items: flex-end; justify-content: center;">
 <div style="width: 100%; max-width: 480px; background: var(--surface-container-low); border-top-left-radius: 24px; border-top-right-radius: 24px; border-top: 1px solid rgba(242,202,80,0.3); padding: 1.25rem 1.25rem 2.5rem; box-shadow: 0 -12px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out;">
 <!-- Drag Handle -->
 <div style="width: 44px; height: 4px; border-radius: 9999px; background: rgba(255,255,255,0.2); margin: 0 auto 1rem;"></div>

 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
 <div style="display: flex; align-items: center; gap: 0.35rem; color: var(--primary); font-size: 0.72rem; font-weight: 700;">
 <span class="material-symbols-outlined" style="font-size: 16px;">stars</span>
 <span>天命院 • 大吉 結實符 공유</span>
 </div>
 <button type="button" id="btn-close-share-modal" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center;">
 <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
 </button>
 </div>

 <h3 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.35rem; text-align: center;">
 부적의 길운(吉運)을 나누어보세요
 </h3>
 <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 0 0 1.25rem;">
 지인에게 황금 결실 부적을 공유하면 <strong>+100 엽전</strong>이 즉시 적립됩니다.
 </p>

 <!-- Social Share Channels -->
 <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1rem;">
 <!-- KakaoTalk -->
 <button type="button" class="btn-share-channel" data-channel="kakao" style="width: 100%; padding: 0.85rem 1rem; border-radius: 14px; background: #fee500; color: #191919; border: none; font-size: 0.92rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
 <div style="display: flex; align-items: center; gap: 0.65rem;">
 <span class="material-symbols-outlined" style="font-size: 22px;">chat_bubble</span>
 <span>카카오톡으로 부적 보내기</span>
 </div>
 <span style="font-size: 0.75rem; background: rgba(0,0,0,0.1); padding: 0.2rem 0.5rem; border-radius: 6px;">+100엽</span>
 </button>

 <!-- Instagram Story -->
 <button type="button" class="btn-share-channel" data-channel="instagram" style="width: 100%; padding: 0.85rem 1rem; border-radius: 14px; background: linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045); color: #fff; border: none; font-size: 0.92rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
 <div style="display: flex; align-items: center; gap: 0.65rem;">
 <span class="material-symbols-outlined" style="font-size: 22px;">auto_stories</span>
 <span>인스타그램 스토리 공유</span>
 </div>
 <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 0.2rem 0.5rem; border-radius: 6px;">+100엽</span>
 </button>
 </div>

 <!-- Copy Link & Image -->
 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
 <button type="button" class="btn-share-channel" data-channel="copy-link" style="padding: 0.75rem; border-radius: 12px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); color: #dfe2f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">link</span>
 링크 복사
 </button>
 <button type="button" class="btn-share-channel" data-channel="copy-image" style="padding: 0.75rem; border-radius: 12px; background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); color: #dfe2f1; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
 <span class="material-symbols-outlined" style="font-size: 16px;">photo_library</span>
 이미지 복사
 </button>
 </div>
 </div>
 </div>
 `;
}

// ============================================================================
// 13. 천명원 6번 & 4번 규격: 리포트 디지털 금고 & 백업 아카이브 (Archive Vault)
// ============================================================================
export interface CheonmyeongwonVaultOptions {
 userName?: string;
 totalRecordsCount?: number;
}

export function renderCheonmyeongwonArchiveVault(options?: CheonmyeongwonVaultOptions): string {
 const userName = options?.userName || '의뢰인';
 const count = options?.totalRecordsCount ?? 1;

 return `
 <!-- [천명원 6번 & 4번 규격] 리포트 디지털 금고(보관함) & 백업 시스템 -->
 <section class="cheonmyeongwon-archive-vault" style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.25rem 1.35rem; margin-bottom: 2rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
 <div style="display: flex; align-items: center; gap: 0.45rem;">
 <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">lock</span>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: #dfe2f1; margin: 0;">사주 분석 리포트 보관함</h3>
      </div>
      <span style="font-family: var(--font-display); font-size: 0.68rem; color: #34d399; background: rgba(52, 211, 153, 0.12); padding: 0.15rem 0.5rem; border-radius: 9999px; font-weight: 700;">
        안전 보관
      </span>
    </div>

 <div style="background: var(--surface-container-low); border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
 <div>
 <div style="font-size: 0.9rem; font-weight: 700; color: #dfe2f1;">
 ${userName} 님의 평생 사주 분석 리포트
 </div>
 <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
 전체 사주 분석 결과 • 소장용 TXT 파일 저장 지원
 </div>
 </div>
 <span style="font-family: var(--font-display); font-size: 0.72rem; color: #34d399; font-weight: 700;">
 보관 중 (${count}건)
 </span>
 </div>

 <!-- Backup Actions -->
 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
 <button type="button" class="btn-download-txt" style="padding: 0.65rem; border-radius: 10px; background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.35); color: var(--primary); font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 15px;">description</span>
 소장용 TXT 다운로드
 </button>
 <button type="button" id="btn-vault-backup-zip" style="padding: 0.65rem; border-radius: 10px; background: var(--surface-container-high); border: 1px solid rgba(255,255,255,0.1); color: #dfe2f1; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 15px;">folder_zip</span>
 암호화 ZIP 일괄 백업
 </button>
 </div>
 </section>
 `;
}


