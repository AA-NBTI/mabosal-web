/**
 * Daily Zodiac Fortune & Maga Defense View (오늘의 띠별 운세 × 마기 주의 × 방비 행동 3단 통합 뷰)
 * 
 * - 12간지 띠 & 출생연도 선택 탭
 * - 3단 일체형 카드:
 * 1. [오늘의 운세 — 기회와 활용] (비회원 완전 오픈)
 * 2. [오늘의 마기 — 주의할 조건] (회원 전용 잠금 / 해제)
 * 3. [오늘의 방비 — 실제 행동] (회원 전용 / 오늘 실천 완료 & 엽전 적립)
 * - 엽전 주머니 & 연속 스트릭 & 월별 캘린더 연동
 */

import { DailyZodiacMagaEngine, ZODIAC_LIST, DailyZodiacFortuneResult } from '../../modules/daily-fortune/daily-zodiac-maga-engine.js';
import { yeopjeonTracker } from '../state/yeopjeon-tracker-state.js';

export interface DailyZodiacViewOptions {
 selectedZodiacKey?: string;
 selectedBirthYear?: number;
}

export function renderDailyZodiacFortuneSection(options?: DailyZodiacViewOptions): string {
 const zodiacKey = options?.selectedZodiacKey || 'rat';
 const zodiac = ZODIAC_LIST.find((z) => z.key === zodiacKey) || ZODIAC_LIST[0];
 const birthYear = options?.selectedBirthYear || zodiac.years[3] || 1984; // 기본 1984

 const fortuneResult: DailyZodiacFortuneResult = DailyZodiacMagaEngine.calculate(
 zodiac.key,
 birthYear,
 new Date()
 );

 const isCompletedToday = yeopjeonTracker.isTodayCompleted();
 const isMember = yeopjeonTracker.isMemberUnlocked;
 const currentStreak = yeopjeonTracker.currentStreak;
 const totalCoins = yeopjeonTracker.totalYeopjeon;

 return `
 <section class="daily-zodiac-maga-section" style="width: 100%; max-width: 960px; margin: 0 auto 3rem auto; padding: 0 1rem; box-sizing: border-box;">
 
 <!-- 섹션 헤더 -->
 <div style="text-align: center; margin-bottom: 1.75rem;">
 <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 100px; padding: 4px 14px; margin-bottom: 0.75rem;">
 <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">wb_sunny</span>
 <span style="font-size: 0.76rem; font-weight: 700; color: var(--primary); letter-spacing: 0.04em;">
 ${fortuneResult.todayGanjiDateStr} (${fortuneResult.todayPillarName}) 천기 일진
 </span>
 </div>
 <h2 style="font-family: var(--font-serif); font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0; letter-spacing: -0.02em;">
 오늘의 띠별 운세 × 마기(魔氣) 방비
 </h2>
 <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0; line-height: 1.5;">
 기회를 포착하고, 실수가 커질 수 있는 마기를 사전 차단하여 하루를 수호하세요.
 </p>
 </div>

 <!-- 상단 엽전 주머니 & 스트릭 미니 바 -->
 <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; background: rgba(20, 24, 35, 0.85); border: 1px solid rgba(242, 202, 80, 0.2); border-radius: 14px; padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
 <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
 <div style="display: flex; align-items: center; gap: 0.45rem;">
 <div style="width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #f2ca50, #b8860b); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(242, 202, 80, 0.4); border: 1px solid #ffe680;">
 <span style="font-size: 9px; font-weight: 900; color: #1c1500; font-family: var(--font-serif);">通寶</span>
 </div>
 <span style="font-size: 0.82rem; color: var(--text-muted);">내 엽전:</span>
 <span id="label-yeopjeon-total" style="font-size: 0.95rem; font-weight: 800; color: #ffe680;">${totalCoins}냥</span>
 </div>

 <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.1);"></div>

 <div style="display: flex; align-items: center; gap: 0.35rem;">
 <span class="material-symbols-outlined" style="font-size: 18px; color: #ff9800;">local_fire_department</span>
 <span style="font-size: 0.82rem; color: var(--text-muted);">연속 실천:</span>
 <span id="label-streak-days" style="font-size: 0.95rem; font-weight: 800; color: #ff9800;">${currentStreak}일째</span>
 </div>
 </div>

 <button type="button" id="btn-open-yeopjeon-calendar" style="background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 8px; color: var(--primary); padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; transition: all 0.2s ease;">
 <span class="material-symbols-outlined" style="font-size: 16px;">calendar_month</span>
 월간 엽전 달력 보기
 </button>
 </div>

 <!-- 12간지 띠 선택 탭 (가로 스크롤 / 그리드 반응형) -->
 <div style="margin-bottom: 1.25rem;">
 <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.3rem;">
 <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">tune</span>
 나의 띠 선택
 </div>
 <div class="zodiac-tabs-container" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.4rem; margin-bottom: 0.75rem;">
 ${ZODIAC_LIST.map((z) => {
 const isSelected = z.key === zodiac.key;
 return `
 <button type="button" class="btn-zodiac-tab ${isSelected ? 'active' : ''}" data-zodiac="${z.key}" 
 style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.55rem 0.25rem; border-radius: 10px; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; background: ${isSelected ? 'rgba(242, 202, 80, 0.15)' : 'rgba(255,255,255,0.02)'}; color: ${isSelected ? 'var(--primary)' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s ease; box-shadow: ${isSelected ? '0 0 12px rgba(242,202,80,0.2)' : 'none'};">
 <span class="material-symbols-outlined" style="font-size: 20px; margin-bottom: 2px;">${z.icon}</span>
 <span style="font-size: 0.75rem; font-weight: 700;">${z.name}</span>
 <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-serif);">${z.branchChar}</span>
 </button>
 `;
 }).join('')}
 </div>

 <!-- 출생연도 선택 칩 -->
 <div style="display: flex; align-items: center; gap: 0.4rem; overflow-x: auto; padding-bottom: 4px;">
 <span style="font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; margin-right: 4px;">출생연도:</span>
 ${zodiac.years.map((y) => {
 const isYearSelected = y === birthYear;
 const ganjiLabel = DailyZodiacMagaEngine.getYearGanji(y);
 return `
 <button type="button" class="btn-year-chip ${isYearSelected ? 'active' : ''}" data-zodiac="${zodiac.key}" data-year="${y}"
 style="white-space: nowrap; padding: 0.3rem 0.65rem; border-radius: 100px; border: 1px solid ${isYearSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; background: ${isYearSelected ? 'var(--primary)' : 'rgba(255,255,255,0.03)'}; color: ${isYearSelected ? '#12151f' : 'var(--text-secondary)'}; font-size: 0.72rem; font-weight: ${isYearSelected ? '800' : '500'}; cursor: pointer; transition: all 0.2s ease;">
 ${y}년 (${ganjiLabel.slice(0, 2)})
 </button>
 `;
 }).join('')}
 </div>
 </div>

 <!-- 3단 일체형 카드 그리드 (오늘의 운세 × 오늘의 마기 × 오늘의 방비) -->
 <div class="trio-cards-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
 
 <!-- CARD 1: 오늘의 운세 (기회와 활용) - 비회원 완전 오픈 -->
 <div class="fortune-trio-card card-opportunity" style="background: rgba(20, 24, 35, 0.95); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
 <div style="position: absolute; top: -10px; right: -10px; width: 70px; height: 70px; background: radial-gradient(circle, rgba(242,202,80,0.12), transparent 70%); border-radius: 50%;"></div>
 
 <div>
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
 <span style="font-family: var(--font-display); font-size: 0.68rem; font-weight: 700; color: var(--primary); letter-spacing: 0.08em; text-transform: uppercase;">
 01 · CELESTIAL OPPORTUNITY
 </span>
 <span style="background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 4px; padding: 2px 7px; font-size: 0.7rem; font-weight: 700;">
 ${fortuneResult.opportunity.field}
 </span>
 </div>

 <h3 style="font-family: var(--font-serif); font-size: 1.12rem; font-weight: 700; color: #fff; margin: 0 0 0.6rem 0; line-height: 1.4;">
 ${fortuneResult.opportunity.title}
 </h3>

 <p style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 1rem 0;">
 ${fortuneResult.opportunity.description}
 </p>
 </div>

 <div style="background: rgba(242, 202, 80, 0.06); border-left: 3px solid var(--primary); padding: 0.65rem 0.85rem; border-radius: 0 8px 8px 0;">
 <div style="font-size: 0.7rem; color: var(--primary); font-weight: 700; margin-bottom: 2px;">
 오늘 추천 행동
 </div>
 <div style="font-size: 0.78rem; color: #fff; line-height: 1.4;">
 ${fortuneResult.opportunity.keyAction}
 </div>
 </div>
 </div>

 <!-- CARD 2: 오늘의 마기 (주의할 조건) - 회원 전용 잠금 -->
 <div class="fortune-trio-card card-maga" style="background: rgba(24, 20, 25, 0.95); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
 
 <div>
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
 <span style="font-family: var(--font-display); font-size: 0.68rem; font-weight: 700; color: #ff6b6b; letter-spacing: 0.08em; text-transform: uppercase;">
 02 · MAGA WARNING
 </span>
 <span style="background: rgba(255, 107, 107, 0.15); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 4px; padding: 2px 7px; font-size: 0.7rem; font-weight: 700;">
 ${fortuneResult.magaCaution.magaType}
 </span>
 </div>

 <!-- 블러 잠금 컨테이너 -->
 <div style="position: relative;">
 <div style="${!isMember ? 'filter: blur(5.5px); user-select: none; pointer-events: none;' : ''}">
 <h3 style="font-family: var(--font-serif); font-size: 1.12rem; font-weight: 700; color: #fff; margin: 0 0 0.6rem 0; line-height: 1.4;">
 ${fortuneResult.magaCaution.title}
 </h3>

 <p style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 1rem 0;">
 ${fortuneResult.magaCaution.description}
 </p>
 </div>

 ${!isMember ? `
 <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(15, 19, 29, 0.75); border-radius: 8px; padding: 1rem; z-index: 5;">
 <span class="material-symbols-outlined" style="font-size: 28px; color: #ff6b6b; margin-bottom: 4px;">lock</span>
 <div style="font-size: 0.82rem; font-weight: 700; color: #fff; margin-bottom: 2px;">
 오늘 주의할 마기 조건
 </div>
 <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.65rem;">
 회원가입 후 갈등·실수 패턴을 확인하세요
 </div>
 <button type="button" class="btn-unlock-maga-auth" style="background: linear-gradient(135deg, #ff6b6b, #c92a2a); border: none; color: #fff; font-size: 0.75rem; font-weight: 800; padding: 0.45rem 0.95rem; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,107,0.35);">
 1초 가입하고 마기 확인
 </button>
 </div>
 ` : ''}
 </div>
 </div>

 <div style="background: rgba(255, 107, 107, 0.08); border-left: 3px solid #ff6b6b; padding: 0.65rem 0.85rem; border-radius: 0 8px 8px 0; margin-top: 0.75rem; ${!isMember ? 'filter: blur(4px);' : ''}">
 <div style="font-size: 0.7rem; color: #ff6b6b; font-weight: 700; margin-bottom: 2px;">
 ️ 갈등·실수가 커지는 순간
 </div>
 <div style="font-size: 0.78rem; color: #fff; line-height: 1.4;">
 ${fortuneResult.magaCaution.triggerPattern}
 </div>
 </div>
 </div>

 <!-- CARD 3: 오늘의 방비 (실제 행동) - 회원 전용 & 완료 인터랙션 -->
 <div class="fortune-trio-card card-defense" style="background: rgba(18, 25, 23, 0.95); border: 1px solid rgba(81, 207, 102, 0.35); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
 
 <div>
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
 <span style="font-family: var(--font-display); font-size: 0.68rem; font-weight: 700; color: #51cf66; letter-spacing: 0.08em; text-transform: uppercase;">
 03 · CELESTIAL DEFENSE
 </span>
 <span style="background: rgba(81, 207, 102, 0.15); color: #51cf66; border: 1px solid rgba(81, 207, 102, 0.3); border-radius: 4px; padding: 2px 7px; font-size: 0.7rem; font-weight: 700;">
 당일 실천
 </span>
 </div>

 <!-- 블러 잠금 컨테이너 -->
 <div style="position: relative;">
 <div style="${!isMember ? 'filter: blur(5.5px); user-select: none; pointer-events: none;' : ''}">
 <h3 style="font-family: var(--font-serif); font-size: 1.12rem; font-weight: 700; color: #fff; margin: 0 0 0.6rem 0; line-height: 1.4;">
 오늘 하루를 지키는 단 하나의 방비
 </h3>

 <p style="font-size: 0.88rem; font-weight: 600; color: #d3f9d8; line-height: 1.5; margin: 0 0 0.75rem 0;">
 "${fortuneResult.defenseAction.actionText}"
 </p>

 <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem;">
 체크 기준: ${fortuneResult.defenseAction.verificationTip}
 </div>
 </div>

 ${!isMember ? `
 <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: rgba(15, 19, 29, 0.75); border-radius: 8px; padding: 1rem; z-index: 5;">
 <span class="material-symbols-outlined" style="font-size: 28px; color: #51cf66; margin-bottom: 4px;">verified</span>
 <div style="font-size: 0.82rem; font-weight: 700; color: #fff; margin-bottom: 2px;">
 오늘의 실천 방비 & 엽전 보상
 </div>
 <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.65rem;">
 로그인하고 방비 완료 시 엽전 1냥 적립
 </div>
 <button type="button" class="btn-unlock-maga-auth" style="background: linear-gradient(135deg, #51cf66, #2b8a3e); border: none; color: #fff; font-size: 0.75rem; font-weight: 800; padding: 0.45rem 0.95rem; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(81,207,102,0.35);">
 로그인하고 방비 실천하기
 </button>
 </div>
 ` : ''}
 </div>
 </div>

 <!-- 완료 체크 인터랙션 버튼 -->
 <div style="margin-top: 0.75rem;">
 ${isMember ? `
 ${isCompletedToday ? `
 <div style="background: rgba(81, 207, 102, 0.15); border: 1px solid rgba(81, 207, 102, 0.4); border-radius: 8px; padding: 0.7rem; text-align: center; color: #51cf66; font-size: 0.82rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
 <span class="material-symbols-outlined" style="font-size: 19px;">check_circle</span>
 오늘 방비 실천 완료! (+엽전 획득)
 </div>
 ` : `
 <button type="button" id="btn-complete-defense-action" 
 data-zodiac="${fortuneResult.zodiacKey}" 
 data-year="${fortuneResult.birthYear}" 
 data-maga="${fortuneResult.magaCaution.magaType}" 
 data-action="${fortuneResult.defenseAction.actionText}"
 class="btn-cta-primary" style="width: 100%; padding: 0.75rem; font-size: 0.84rem; font-weight: 800; border-radius: 8px; justify-content: center; background: linear-gradient(135deg, #f2ca50, #b8860b); color: #12151f;">
 <span class="material-symbols-outlined" style="font-size: 18px;">task_alt</span>
 오늘 방비 완료하기 (엽전 +1냥)
 </button>
 `}
 ` : `
 <button type="button" class="btn-unlock-maga-auth" style="width: 100%; padding: 0.7rem; font-size: 0.82rem; font-weight: 700; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); color: var(--text-muted); cursor: pointer;">
 회원가입 후 실천 완료 가능
 </button>
 `}
 </div>

 </div>

 </div>

 </section>
 `;
}
