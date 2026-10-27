
/** [요청 4 반영]: 특화 비책 전 상품 공통 소장용 TXT 및 PDF 다운로드 바 */
function renderSingleProductDownloadBar(productTitle: string): string {
 return `
 <div class="single-product-download-action-bar" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1.25rem 1.5rem; margin: 2rem 0 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
 <div>
 <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-bottom: 0.2rem;">
 분석 결과 리포트 저장 &amp; 인쇄
 </div>
 <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">
 ${productTitle} 결과를 소장하세요
 </div>
 </div>
 <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
 <button type="button" class="btn-cta-secondary btn-download-txt" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.6rem 1.15rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">
 <span class="material-symbols-outlined" style="font-size: 17px;">description</span>
 소장용 TXT 다운로드
 </button>
 <button type="button" class="btn-cta-secondary btn-download-pdf" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.6rem 1.15rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">
 <span class="material-symbols-outlined" style="font-size: 17px;">picture_as_pdf</span>
 PDF 리포트 저장
 </button>
 </div>
 </div>
 `;
}

import { gunghapEngine, GunghapAnalysisResult } from '../../modules/chemistry/gunghap-engine.js';
/**
 * 2027 정미년(丁未年) 5대 목적형 단품 독립 결과지 모듈
 * (내용 중복 0%, 전용 분석 프레임워크와 실전 산출물 제공)
 */

import { AppStateData } from '../state/app-state.js';
import { renderMiniSajuPillarsCard, renderAffiliatePromoBanner } from '../components/common-components.js';
import { renderSplineMonthlyChart, renderGoldProgressRing } from '../components/VisualCharts.js';

/**
 * 1. 2027 정미년 신년 총운 & 12절기 월운 비책 (19,900원)
 */
export function renderYear2027SingleProductView(state: AppStateData): string {
 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 return `
 <div class="result-view-container single-product-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 <div style="margin-bottom: 1.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem;">
 2027 YEARLY TIMING REPORT · 19,900원 완결본
 </span>
 <h1 style="font-size: 1.85rem; font-weight: 700; color: var(--text-gold); margin: 0.4rem 0 0.35rem 0;">
 2027 정미년(丁未年) 신년 총운 & 12절기 월운 비책
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 2027년 정미(丁未: 화기운과 조토)가 내 사주에 일으키는 화학 반응과 12개월 월별 타이밍 완결 분석서입니다.
 </p>
 </div>

 <!-- [천명원 핵심 비주얼 1] 2027 골드 프로그레스 성취 지수 링 -->
 ${renderGoldProgressRing(92, '2027 성취 지수', '도약과 결실의 해')}

 ${renderMiniSajuPillarsCard({
 year: pillars.year, month: pillars.month, day: pillars.day, hour: pillars.hour,
 dayMasterDesc: '2027년 축미충(丑未沖) 환경 적응 및 전환 중심',
 })}

 <!-- [천명원 핵심 비주얼 2] 12개월 월운 스플라인 추이 SVG 인터랙티브 차트 -->
 ${renderSplineMonthlyChart({
 yearTitle: '2027 정미년',
 subTitle: '12개월 월운 스플라인 에너지 곡선',
 })}

 <!-- 2027 독점 산출물 1: 12절기 월별 에너지 지수 곡선 -->
 <div class="result-section-box" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="color: var(--text-gold); font-size: 1.2rem; margin: 0 0 0.5rem 0;">
 1. 2027년 1월~12월(12절기) 월별 에너지 흐름 지수표
 </h3>
 <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5;">
 기운이 뻗어나가는 '도약월'과 무리한 확장을 멈추어야 하는 '조정월'을 명확히 구분했습니다.
 </p>
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.65rem; text-align: center;">
 <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted);">1월 (임인월)</div>
 <div style="font-size: 1.15rem; font-weight: 700; color: #50c878; margin: 0.2rem 0;">78점</div>
 <div style="font-size: 0.75rem; color: var(--text-secondary);">기반 다지기</div>
 </div>
 <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted);">4월 (을사월)</div>
 <div style="font-size: 1.15rem; font-weight: 700; color: #f39c12; margin: 0.2rem 0;">65점</div>
 <div style="font-size: 0.75rem; color: var(--text-secondary);">인간관계 주의</div>
 </div>
 <div style="background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.5); border-radius: 8px; padding: 0.75rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--text-gold); font-weight: 700;">6월 (정미월)</div>
 <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-gold); margin: 0.2rem 0;">92점</div>
 <div style="font-size: 0.75rem; color: var(--text-gold); font-weight: 600;">최고 도약기</div>
 </div>
 <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted);">10월 (신해월)</div>
 <div style="font-size: 1.15rem; font-weight: 700; color: #50c878; margin: 0.2rem 0;">88점</div>
 <div style="font-size: 0.75rem; color: var(--text-secondary);">성과 수확기</div>
 </div>
 </div>
 </div>

 <!-- 2027 독점 산출물 2: 상·하반기 Do & Don't 타임라인 -->
 <div class="result-section-box" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="color: var(--text-gold); font-size: 1.2rem; margin: 0 0 0.5rem 0;">
 2. 2027년 상·하반기 Do & Don't 행동 타임라인
 </h3>
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;">
 <div style="background: rgba(80, 200, 120, 0.05); border: 1px solid rgba(80, 200, 120, 0.3); border-radius: 8px; padding: 1rem;">
 <div style="font-weight: 700; color: #50c878; font-size: 0.95rem; margin-bottom: 0.5rem;"> 반드시 추진할 일 (DO)</div>
 <ul style="padding-left: 1.15rem; margin: 0; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.7;">
 <li>상반기: 자격증, 전문 지식 등 나만의 지적 자산 확보</li>
 <li>중반기: 기존 비효율적인 업무 시스템 전면 개편</li>
 <li>하반기: 검증된 파트너와의 협업 및 계약 마무리</li>
 </ul>
 </div>
 <div style="background: rgba(255, 107, 107, 0.05); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 8px; padding: 1rem;">
 <div style="font-weight: 700; color: #ff6b6b; font-size: 0.95rem; margin-bottom: 0.5rem;"> 절대 피해야 할 일 (DON'T)</div>
 <ul style="padding-left: 1.15rem; margin: 0; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.7;">
 <li>충동적인 신규 대출 및 고위험 레버리지 투자 금지</li>
 <li>감정이 격해진 상태에서 당일 퇴사 결정 보류</li>
 <li>검증되지 않은 구두 약속만 믿고 자금 선집행 금지</li>
 </ul>
 </div>
 </div>
 </div>

 ${renderSingleProductDownloadBar('2027 정미년 신년 총운 & 12절기 월운 비책')}
 ${renderAffiliatePromoBanner()}
 </div>
 `;
}

/**
 * 2. 마보살 2인 정밀 궁합 & 갈등 방어 처방전 (29,900원)
 */
export function renderChemistrySingleProductView(state: AppStateData): string {
 // 실제 분석 결과가 없으면 즉시 동적 산출하여 안전 보장
 let result: GunghapAnalysisResult = state.gunghapResult!;
 if (!result) {
 const myName = state.userName || '나 (본인)';
 const myGender = state.gender || 'male';
 const myBirthDate = state.sessionState?.request?.birthDate || 
 state.integratedResult?.standardBirthDate?.solar_date_string || 
 '1992-05-15';
 const myBirthTime = state.sessionState?.request?.birthTime || null;

 const pName = state.partnerInfo?.name || '상대방 (인연)';
 const pGender = state.partnerInfo?.gender || (myGender === 'male' ? 'female' : 'male');
 const pBirthDate = state.partnerInfo?.birthDate || '1993-08-20';
 const pBirthTime = state.partnerInfo?.isHourUnknown ? null : (state.partnerInfo?.birthTime || '14:30');
 const pRelation = state.partnerInfo?.relation || '연인';

 result = gunghapEngine.calculate(
 { name: myName, gender: myGender, birthDate: myBirthDate, birthTime: myBirthTime },
 { name: pName, gender: pGender as any, birthDate: pBirthDate, birthTime: pBirthTime, relation: pRelation }
 );
 }

 const pRelation = state.partnerInfo?.relation || '연인';
 const score = result.score;
 const primaryGold = 'var(--primary)'; // #f2ca50
 const goldBorder = 'rgba(242, 202, 80, 0.3)';

 return `
 <div class="result-view-container single-product-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 <!-- 헤더 배너 (마보살 정통 골드 & 네이비 컨셉) -->
 <div style="margin-bottom: 1.5rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.25rem 0.75rem; background: rgba(242, 202, 80, 0.12); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 9999px; font-weight: 700;">
 2인 정밀 궁합 분석 리포트 · 29,900원 완결본
 </span>
 <span style="font-size: 0.82rem; color: var(--text-muted);">
 산출 기준: 정밀 명리학 원국 대조 엔진
 </span>
 </div>
 <h1 style="font-family: var(--font-serif); font-size: 2rem; font-weight: 800; color: #fff; margin: 0.2rem 0 0.4rem 0; letter-spacing: -0.02em;">
 천명원 2인 정밀 궁합 & 갈등 방어 처방전
 </h1>
 <p style="color: var(--text-secondary); font-size: 0.98rem; margin: 0; line-height: 1.6;">
 ${result.personA.name}님과 ${result.personB.name}님의 사주 원국이 교차할 때 발생하는 기운의 상호작용과 반복되는 갈등의 실전 즉각 대처법 완결본입니다.
 </p>
 </div>

 <!-- 종합 궁합 점수 & 티어 카드 -->
 <div style="background: var(--surface-container); border: 1px solid ${goldBorder}; border-radius: 16px; padding: 1.75rem; margin-bottom: 1.75rem; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
 <div style="display: flex; align-items: center; gap: 1.5rem;">
 <div style="width: 96px; height: 96px; border-radius: 50%; background: conic-gradient(${primaryGold} ${score}%, rgba(255, 255, 255, 0.08) 0); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(242, 202, 80, 0.2);">
 <div style="width: 80px; height: 80px; border-radius: 50%; background: #13141f; display: flex; flex-direction: column; align-items: center; justify-content: center;">
 <span style="font-size: 1.65rem; font-weight: 900; color: #fff; line-height: 1;">${score}</span>
 <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">/ 100점</span>
 </div>
 </div>
 <div>
 <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
 <span style="font-size: 1.05rem; font-weight: 800; background: var(--primary); color: #1c1500; padding: 0.15rem 0.65rem; border-radius: 6px;">${result.tier}등급</span>
 <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0;">${result.tierTitle}</h2>
 </div>
 <p style="font-size: 0.92rem; color: #cbd5e1; margin: 0; max-width: 520px; line-height: 1.55;">
 ${result.tierSummary}
 </p>
 </div>
 </div>
 </div>

 <!-- 2인 사주 대조 카드 (Person A vs Person B) -->
 <div style="background: var(--surface-container); border: 1px solid ${goldBorder}; border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem; box-shadow: var(--shadow-sm);">
 <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.35rem;">
 <span class="material-symbols-outlined" style="font-size: 18px;">compare_arrows</span>
 두 사람의 명리 원국 기운 대조
 </div>

 <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center;">
 <!-- Person A -->
 <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(242, 202, 80, 0.2); border-radius: 12px; padding: 1.25rem; text-align: center;">
 <span style="font-size: 0.76rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 700;">본인</span>
 <div style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0.5rem 0 0.25rem 0;">${result.personA.name}</div>
 <div style="font-size: 0.92rem; color: var(--primary); font-weight: 700; margin-bottom: 0.25rem;">${result.personA.dayPillarName}</div>
 <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem;">(${result.personA.birthDate})</div>
 <div style="font-size: 0.84rem; color: #cbd5e1; text-align: left; line-height: 1.5; background: rgba(255, 255, 255, 0.03); padding: 0.65rem; border-radius: 6px;">
 ${result.personA.personalitySummary}
 </div>
 </div>

 <!-- 케미 아이콘 -->
 <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;">
 <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(251, 207, 232, 0.15); border: 1px solid rgba(251, 207, 232, 0.4); display: flex; align-items: center; justify-content: center;">
 <span class="material-symbols-outlined" style="font-size: 22px; color: rgba(242, 202, 80, 0.15);">favorite</span>
 </div>
 <span style="font-size: 0.74rem; color: rgba(242, 202, 80, 0.15); font-weight: 700;">2인 ${pRelation}</span>
 </div>

 <!-- Person B -->
 <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(251, 207, 232, 0.3); border-radius: 12px; padding: 1.25rem; text-align: center;">
 <span style="font-size: 0.76rem; background: rgba(251, 207, 232, 0.18); color: rgba(242, 202, 80, 0.15); padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 700;">상대방 (${pRelation})</span>
 <div style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0.5rem 0 0.25rem 0;">${result.personB.name}</div>
 <div style="font-size: 0.92rem; color: rgba(242, 202, 80, 0.15); font-weight: 700; margin-bottom: 0.25rem;">${result.personB.dayPillarName}</div>
 <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem;">(${result.personB.birthDate})</div>
 <div style="font-size: 0.84rem; color: #cbd5e1; text-align: left; line-height: 1.5; background: rgba(255, 255, 255, 0.03); padding: 0.65rem; border-radius: 6px;">
 ${result.personB.personalitySummary}
 </div>
 </div>
 </div>
 </div>

 <!-- 4대 세부 케미 지수 게이지 (기본 컨셉 컬러로 조화롭게 통일) -->
 <div style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem;">
 <h3 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">equalizer</span>
 4대 영역별 정밀 궁합 지수
 </h3>

 <div style="display: flex; flex-direction: column; gap: 1rem;">
 <div>
 <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
 <span style="color: #e2e8f0; font-weight: 600;">정신적 교감 & 가치관 일치도 (천간 합)</span>
 <span style="color: var(--primary); font-weight: 800;">${result.indices.mentalChemistry}점</span>
 </div>
 <div style="height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden;">
 <div style="width: ${result.indices.mentalChemistry}%; height: 100%; background: linear-gradient(90deg, #f2ca50, #d4af37); border-radius: 9999px;"></div>
 </div>
 </div>

 <div>
 <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
 <span style="color: #e2e8f0; font-weight: 600;">현실 생활 & 속궁합 조화도 (지지 육합/충)</span>
 <span style="color: var(--primary); font-weight: 800;">${result.indices.physicalChemistry}점</span>
 </div>
 <div style="height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden;">
 <div style="width: ${result.indices.physicalChemistry}%; height: 100%; background: linear-gradient(90deg, #e2b342, #b8860b); border-radius: 9999px;"></div>
 </div>
 </div>

 <div>
 <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
 <span style="color: #e2e8f0; font-weight: 600;">오행 상호 결핍 보완도 (부족한 기운 수혈)</span>
 <span style="color: var(--primary); font-weight: 800;">${result.indices.elementComplement}점</span>
 </div>
 <div style="height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden;">
 <div style="width: ${result.indices.elementComplement}%; height: 100%; background: linear-gradient(90deg, #f2ca50, #b8860b); border-radius: 9999px;"></div>
 </div>
 </div>

 <div>
 <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
 <span style="color: #e2e8f0; font-weight: 600;">장기적 인연 지속력 & 방어력 (백년해로 지수)</span>
 <span style="color: var(--primary); font-weight: 800;">${result.indices.longTermStability}점</span>
 </div>
 <div style="height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden;">
 <div style="width: ${result.indices.longTermStability}%; height: 100%; background: linear-gradient(90deg, #d4af37, #996515); border-radius: 9999px;"></div>
 </div>
 </div>
 </div>
 </div>

 <!-- 명리 정밀 상호작용 상세 카드 -->
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
 <div style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-bottom: 0.3rem;">천간(일간) 상호작용</div>
 <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${result.stemInteraction.type}</div>
 <p style="font-size: 0.86rem; color: #94a3b8; margin: 0; line-height: 1.55;">${result.stemInteraction.description}</p>
 </div>

 <div style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-bottom: 0.3rem;">지지(일지) 상호작용</div>
 <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${result.branchInteraction.type}</div>
 <p style="font-size: 0.86rem; color: #94a3b8; margin: 0; line-height: 1.55;">${result.branchInteraction.description}</p>
 </div>

 <div style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-bottom: 0.3rem;">오행 상호 보완성</div>
 <div style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">기운의 상호 조율</div>
 <p style="font-size: 0.86rem; color: #94a3b8; margin: 0 0 0.3rem 0; line-height: 1.45;">• ${result.complementInteraction.aGivesB}</p>
 <p style="font-size: 0.86rem; color: #94a3b8; margin: 0; line-height: 1.45;">• ${result.complementInteraction.bGivesA}</p>
 </div>
 </div>

 <!-- 3대 감정 폭발 버튼 및 실전 화해 스크립트 -->
 <div class="result-section-box" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.75rem; margin-bottom: 1.75rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem;">
 <h3 style="font-family: var(--font-serif); color: var(--primary); font-size: 1.25rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
 <span class="material-symbols-outlined" style="font-size: 24px; color: var(--primary);">warning</span>
 우리가 반복해서 부딪히는 '3대 감정 폭발 버튼' & 실전 화해 스크립트
 </h3>
 <span style="font-size: 0.76rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 700;">
 실전 갈등 방어 매뉴얼
 </span>
 </div>

 <div style="display: flex; flex-direction: column; gap: 1.25rem;">
 ${result.conflictButtons.map((btn, idx) => `
 <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 1.25rem;">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
 <span style="font-size: 0.76rem; background: rgba(242, 202, 80, 0.15); color: var(--primary); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">
 폭발 버튼 ${idx + 1} · ${btn.tag}
 </span>
 <span style="font-size: 0.76rem; color: #94a3b8;">
 ${btn.solution}
 </span>
 </div>
 <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 0.4rem 0;">
 ${btn.title}
 </h4>
 <p style="font-size: 0.88rem; color: #cbd5e1; margin: 0 0 0.6rem 0; line-height: 1.55;">
 ${btn.description}
 </p>
 <div style="font-size: 0.82rem; color: #e2e8f0; background: rgba(242, 202, 80, 0.08); border-left: 3px solid var(--primary); padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0; margin-bottom: 0.75rem; line-height: 1.45;">
 <strong style="color: var(--primary);">트리거 상황:</strong> ${btn.triggerDetail}
 </div>
 <div style="background: rgba(242, 202, 80, 0.12); border-left: 3px solid var(--primary); padding: 0.65rem 0.9rem; font-size: 0.88rem; color: #fff; border-radius: 0 6px 6px 0;">
 <strong style="color: var(--primary);">즉시 먹히는 실전 화해 멘트:</strong>
 <div style="margin-top: 0.25rem; font-style: italic; color: #fef08a; line-height: 1.5;">
 ${btn.script}
 </div>
 </div>
 </div>
 `).join('')}
 </div>
 </div>

 <!-- [4번 요구사항] 마보살 실전 궁합 수호 비책 & 관계 수호 멘트 -->
 <div style="background: var(--surface-container); border: 1px solid ${goldBorder}; border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem;">
 <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary); margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 22px;">verified</span>
 마보살 실전 궁합 수호 비책 & 처방전
 </h3>

 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
 <div style="background: rgba(0, 0, 0, 0.25); padding: 1rem; border-radius: 8px;">
 <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.25rem;">두 사람의 행운 방위 & 장소</div>
 <div style="font-size: 0.9rem; color: #fff; font-weight: 600;">${result.prescriptions.luckyDirection}</div>
 </div>

 <div style="background: rgba(0, 0, 0, 0.25); padding: 1rem; border-radius: 8px;">
 <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.25rem;">추천 힐링 액티비티</div>
 <div style="font-size: 0.9rem; color: #fff; font-weight: 600;">${result.prescriptions.luckyActivity}</div>
 </div>

 <div style="background: rgba(0, 0, 0, 0.25); padding: 1rem; border-radius: 8px;">
 <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.25rem;">절대로 피해야 할 금기 습관</div>
 <div style="font-size: 0.9rem; color: #fca5a5; font-weight: 600;">${result.prescriptions.prohibitedHabit}</div>
 </div>

 <div style="background: rgba(0, 0, 0, 0.25); padding: 1rem; border-radius: 8px; border: 1px solid rgba(242, 202, 80, 0.25);">
 <div style="font-size: 0.78rem; color: var(--primary); font-weight: 700; margin-bottom: 0.25rem;">상대방 기질 인정 & 관계 수호 멘트</div>
 <div style="font-size: 0.9rem; color: #fef08a; font-weight: 600; line-height: 1.5;">${result.prescriptions.secretKeyphrase}</div>
 <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">
 * 상대방의 일간 기질과 일지 관계(${result.branchInteraction.type})에서 결핍된 자존감과 안전감을 무조건적으로 채워주는 명리 처방문입니다.
 </div>
 </div>
 </div>
 </div>

 ${renderSingleProductDownloadBar('2인 정밀 궁합 & 갈등 방어 처방전')}
 ${renderAffiliatePromoBanner()}
 </div>
 `;
}

export function renderCareerSingleProductView(state: AppStateData): string {
 return `
 <div class="result-view-container single-product-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 <div style="margin-bottom: 1.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem;">
 CAREER & RESIGNATION REPORT · 19,900원 완결본
 </span>
 <h1 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: var(--primary); margin: 0.4rem 0 0.35rem 0;">
 직장·이직 타이밍 & 잔류 vs 퇴사 득실 비교 진단서
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 관성(조직)과 직장마, 구설마 신호를 분석하여 2027년 가장 승률 높은 이직 타이밍을 제시합니다.
 </p>
 </div>

 <!-- 이직 독점 산출물: 잔류 vs 이직 득실 비교표 -->
 <div class="result-section-box" style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="font-family: var(--font-serif); color: var(--primary); font-size: 1.18rem; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">balance</span>
 [현 직장 잔류 vs 이직 vs 독립] 3대 선택지 득실 비교표
 </h3>
 <div style="overflow-x: auto;">
 <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
 <thead>
 <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--primary);">
 <th style="padding: 0.65rem;">선택지</th>
 <th style="padding: 0.65rem;">얻는 것 (기회)</th>
 <th style="padding: 0.65rem;">치러야 할 대가 (위험)</th>
 <th style="padding: 0.65rem;">천명원 최종 권고</th>
 </tr>
 </thead>
 <tbody>
 <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
 <td style="padding: 0.75rem; font-weight: 700; color: #fff;">1. 현 직장 잔류</td>
 <td style="padding: 0.75rem; color: #50c878;">고정 급여 안정성 유지</td>
 <td style="padding: 0.75rem; color: var(--error);">상사와의 갈등 피로도 지속</td>
 <td style="padding: 0.75rem; color: var(--text-secondary);">2027년 5월까지 버티기 추천</td>
 </tr>
 <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(242, 202, 80, 0.08);">
 <td style="padding: 0.75rem; font-weight: 700; color: var(--primary);">2. 이직 (추천)</td>
 <td style="padding: 0.75rem; color: #50c878;">연봉 15% 상승 및 환경 리셋</td>
 <td style="padding: 0.75rem; color: var(--error);">초기 3개월 적응 스트레스</td>
 <td style="padding: 0.75rem; font-weight: 700; color: var(--primary);">2027년 6~7월 최적기</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 ${renderSingleProductDownloadBar('직장·이직 타이밍 & 잔류 vs 퇴사 득실 진단서')}
 ${renderAffiliatePromoBanner()}
 </div>
 `;
}

/**
 * 4. 재물·투자운 & 손재마 방어 처방전 (19,900원)
 */
export function renderWealthSingleProductView(state: AppStateData): string {
 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 return `
 <div class="result-view-container single-product-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 <div style="margin-bottom: 1.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem;">
 WEALTH & INVESTMENT REPORT · 19,900원 완결본
 </span>
 <h1 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: var(--primary); margin: 0.4rem 0 0.35rem 0;">
 재물·투자운 & 손재마(損財魔) 방어 처방전
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 재성(財星)과 재고(財庫), 손재마 신호를 입체 분석하여 2027년 현금 확보기와 공격 투자 골든타임을 제시합니다.
 </p>
 </div>

 ${renderMiniSajuPillarsCard({
 year: pillars.year, month: pillars.month, day: pillars.day, hour: pillars.hour,
 dayMasterDesc: '정재(正財) 보존력 우수 · 단기 레버리지 위험 방어 중심',
 })}

 <!-- 재물 독점 산출물 1: 현금 보유 최적기 vs 공격 투자 타이밍 -->
 <div class="result-section-box" style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="font-family: var(--font-serif); color: var(--primary); font-size: 1.18rem; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">trending_up</span>
 1. 2027년 분기별 자산 운용 전략표
 </h3>
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
 <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem;">
 <div style="font-size: 0.8rem; color: var(--text-muted);">1분기 (1~3월)</div>
 <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #50c878; margin: 0.25rem 0;">현금 비중 80% 유지</div>
 <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">불필요한 지출 통제 및 고금리 안전 자산 비축</p>
 </div>
 <div style="background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 8px; padding: 1rem;">
 <div style="font-size: 0.8rem; color: var(--primary); font-weight: 700;">2분기 (4~6월) · 골든타임</div>
 <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; color: var(--primary); margin: 0.25rem 0;">공격적 자산 매수</div>
 <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">저평가 부동산/핵심 우량주 집중 분할 매수 적기</p>
 </div>
 <div style="background: rgba(255, 180, 171, 0.08); border: 1px solid rgba(255, 180, 171, 0.35); border-radius: 8px; padding: 1rem;">
 <div style="font-size: 0.8rem; color: var(--error); font-weight: 700;">3분기 (7~9월) · 손재 주의</div>
 <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--error); margin: 0.25rem 0;">손재마 침투 경보</div>
 <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">지인 금전 거래 금지, 신규 사업 투자 보류</p>
 </div>
 <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem;">
 <div style="font-size: 0.8rem; color: var(--text-muted);">4분기 (10~12월)</div>
 <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #50c878; margin: 0.25rem 0;">수익 실현 및 결산</div>
 <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">원금 회수 및 2028년 대비 안정적 시드 머니 확정</p>
 </div>
 </div>
 </div>

 <!-- 재물 독점 산출물 2: 절대 금기 행동 -->
 <div class="result-section-box" style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="font-family: var(--font-serif); color: var(--error); font-size: 1.18rem; margin: 0 0 0.65rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 22px; color: var(--error);">block</span>
 재물운을 갉아먹는 3대 절대 금기 행동
 </h3>
 <ul style="padding-left: 1.25rem; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.75; margin: 0;">
 <li><strong>지인과의 동업 및 보증:</strong> 2027년 비견·겁재 기운이 중첩되어 금전 분쟁으로 인연이 끊어질 위험이 매우 큽니다.</li>
 <li><strong>단기 급등 테마주 추격 매수:</strong> 성급한 일확천금 심리는 손재마를 직접 활성화시킵니다.</li>
 <li><strong>감정적 소비성 대출:</strong> 카드론 및 무리한 리볼빙은 운의 흐름을 3년간 묶어둡니다.</li>
 </ul>
 </div>

 ${renderSingleProductDownloadBar('재물·투자운 & 손재마(損財魔) 방어 처방전')}
 ${renderAffiliatePromoBanner()}
 </div>
 `;
}

/**
 * 5. 연애·재회운 & 인연 타이밍 진단서 (19,900원)
 */
export function renderLoveReunionSingleProductView(state: AppStateData): string {
 const session = state.sessionState;
 const pillars = session?.fact?.four_pillars || {
 year: { stem: '무', branch: '인' },
 month: { stem: '병', branch: '진' },
 day: { stem: '기', branch: '축' },
 hour: { stem: '기', branch: '사' },
 };

 return `
 <div class="result-view-container single-product-view" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
 <div style="margin-bottom: 1.5rem;">
 <span class="card-badge gold-badge" style="font-size: 0.82rem; padding: 0.2rem 0.65rem; background: rgba(242, 202, 80, 0.15); color: var(--tertiary); border-color: rgba(242, 202, 80, 0.35);">
 LOVE & REUNION REPORT · 19,900원 완결본
 </span>
 <h1 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: var(--tertiary); margin: 0.4rem 0 0.35rem 0;">
 연애·재회운 & 인연 타이밍 진단서
 </h1>
 <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
 도화·홍염살과 연애마, 일지 배우자궁을 정밀 분석하여 상대방의 심리와 재회 골든타임을 명쾌하게 밝혀드립니다.
 </p>
 </div>

 ${renderMiniSajuPillarsCard({
 year: pillars.year, month: pillars.month, day: pillars.day, hour: pillars.hour,
 dayMasterDesc: '배우자궁 정화 필요 · 감정 집착 완화 및 주도권 회복',
 })}

 <!-- 연애 독점 산출물 1: 상대방 연락 가능성 월별 지수 -->
 <div class="result-section-box" style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="font-family: var(--font-serif); color: var(--tertiary); font-size: 1.18rem; margin: 0 0 0.85rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 22px; color: var(--tertiary);">mark_email_read</span>
 상대방 연락 가능성 & 재회 골든타임
 </h3>
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; text-align: center;">
 <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted);">지금~2개월 후</div>
 <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-muted); margin: 0.2rem 0;">35%</div>
 <div style="font-size: 0.75rem; color: var(--text-muted);">냉각 및 방어기제</div>
 </div>
 <div style="background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 8px; padding: 0.85rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--tertiary); font-weight: 700;">3~4개월 후 (골든타임)</div>
 <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--tertiary); margin: 0.2rem 0;">88%</div>
 <div style="font-size: 0.75rem; color: var(--tertiary); font-weight: 600;">그리움 증폭 시기</div>
 </div>
 <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.85rem 0.5rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted);">6개월 이후</div>
 <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #50c878; margin: 0.2rem 0;">새 인연</div>
 <div style="font-size: 0.75rem; color: #50c878;">귀인급 새 연인 도래</div>
 </div>
 </div>
 </div>

 <!-- 연애 독점 산출물 2: 재회 성공을 위한 실전 처방 -->
 <div class="result-section-box" style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
 <h3 style="font-family: var(--font-serif); color: var(--primary); font-size: 1.18rem; margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">lightbulb</span>
 재회 성사율을 3배 높이는 행동 수칙
 </h3>
 <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary);">
 <div style="background: rgba(0, 0, 0, 0.25); padding: 0.75rem 1rem; border-radius: 8px; border-left: 3px solid var(--tertiary);">
 <strong>절대 먼저 장문의 카톡을 보내지 마세요:</strong> 침묵할 때 상대방의 뇌 속에서 당신의 빈자리가 채워집니다.
 </div>
 <div style="background: rgba(0, 0, 0, 0.25); padding: 0.75rem 1rem; border-radius: 8px; border-left: 3px solid var(--primary);">
 <strong>SNS 프로필은 '일상의 안정'을 유지하세요:</strong> 감정적 우울이나 과장된 즐거움 대신 단정하고 품격 있는 모습이 최고의 유인책입니다.
 </div>
 </div>
 </div>

 ${renderSingleProductDownloadBar('연애·재회운 & 인연 타이밍 진단서')}
 ${renderAffiliatePromoBanner()}
 </div>
 `;
}

