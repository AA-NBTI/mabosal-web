import { dailyZodiacMagiEngine, ZODIAC_INFOS } from '../services/DailyZodiacMagiEngine.js';
import { getSelectedZodiac, getSelectedYear, setSelectedZodiac, setSelectedYear } from './TodayFortuneAndMagiWidget.js';

export function renderLuckyCalendarView(state: any): string {
  const currentZodiac = getSelectedZodiac();
  const currentYear = getSelectedYear();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const calData = (dailyZodiacMagiEngine as any).getMonthlyLuckyCalendarData(
    year, 
    month, 
    currentZodiac || '자', 
    currentYear
  );

  const years = currentZodiac ? dailyZodiacMagiEngine.getYearsForZodiac(currentZodiac) : [];

  return `
  <div class="calendar-page-container lucky-calendar-view" style="width: 100%; max-width: 1440px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; box-sizing: border-box;">
    
    <!-- 상단 탭 전환: [행운 달력] ⟷ [마기 달력] -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(242, 202, 80, 0.25); padding-bottom: 0.85rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button type="button" id="tab-goto-lucky-cal" class="cal-tab-btn active" style="background: rgba(242, 202, 80, 0.2); border: 1.5px solid var(--primary); color: #ffffff; padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 800; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">event_available</span>
          <span>행운 달력 (대길·골든데이)</span>
        </button>
        <button type="button" id="tab-goto-magi-cal" class="cal-tab-btn" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-muted); padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">event_busy</span>
          <span>마기 달력 (피흉·결정보류)</span>
        </button>
      </div>
      <div>
        <button type="button" id="btn-cal-back-home" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: #dfe2f1; padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
          <span>홈으로 돌아가기</span>
        </button>
      </div>
    </div>

    <!-- 첨부 상품 상단 포맷 일치 헤더 구조 -->
    <div class="calendar-section-header" style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 0.45rem;">
        <div style="font-size: 0.78rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.06em;">
          MONTHLY CELESTIAL RADAR
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">
          월간 천기 대길 나침반
        </div>
      </div>
      <h2 style="font-size: 1.65rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.02em;">
        ${year}년 ${month}월 행운 달력 — 이달의 대길일 & 황금 기회
      </h2>
      <p style="font-size: 0.85rem; color: #dfe2f1; margin: 0.45rem 0 0 0; line-height: 1.5;">
        당월 30일간의 육합(六合)과 삼합(三合) 길신을 분석하여 계약 체결, 사업 추진, 중요 미팅, 투자를 진행하기 가장 유리한 대길일을 엄선합니다.
      </p>
    </div>

    <!-- 12간지 띠 & 출생연도 선택 필터 -->
    <div style="background: rgba(20, 24, 35, 0.75); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem;">
      <div style="font-size: 0.76rem; color: var(--primary); font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
        <span style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">pets</span>
          <span>1. 확인할 12간지 띠를 선택하세요</span>
        </span>
        <span style="font-size: 0.72rem; color: #dfe2f1;">
          ${currentZodiac ? `선택됨: ${calData.zodiacAnimal}띠` : '기본: 쥐띠 기준'}
        </span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.75rem;">
        ${ZODIAC_INFOS.map(z => {
          const isSelected = (currentZodiac || '자') === z.key;
          return `
          <button 
            type="button" 
            class="cal-zodiac-btn ${isSelected ? 'active' : ''}" 
            data-zodiac="${z.key}"
            style="padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; background: ${isSelected ? 'rgba(242,202,80,0.22)' : 'rgba(255,255,255,0.03)'}; color: ${isSelected ? 'var(--primary)' : '#ffffff'};"
          >
            ${z.animal}(${z.hanja})
          </button>
          `;
        }).join('')}
      </div>

      <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.65rem; font-size: 0.76rem; color: var(--primary); font-weight: 800; margin-bottom: 0.45rem; display: flex; align-items: center; justify-content: space-between;">
        <span style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">calendar_month</span>
          <span>2. 출생연도를 선택하세요</span>
        </span>
        <span style="font-size: 0.72rem; color: #dfe2f1;">
          ${currentYear ? `${currentYear}년생` : '전체 대표 연도'}
        </span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
        ${years.map(y => {
          const isSelected = currentYear === y;
          return `
          <button 
            type="button" 
            class="cal-year-btn ${isSelected ? 'active' : ''}" 
            data-year="${y}"
            style="padding: 0.25rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; background: ${isSelected ? 'rgba(242,202,80,0.22)' : 'rgba(255,255,255,0.03)'}; color: ${isSelected ? 'var(--primary)' : '#ffffff'};"
          >
            ${y}년생
          </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 이달의 황금 길일 요약 박스 -->
    <div style="background: rgba(242, 202, 80, 0.08); border-left: 4px solid var(--primary); border-radius: 0 10px 10px 0; padding: 0.9rem 1.15rem; margin-bottom: 1.25rem;">
      <div style="font-size: 0.88rem; font-weight: 800; color: #ffffff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">stars</span>
        <span>${calData.zodiacAnimal}띠 이달의 황금 길일 (골든 데이)</span>
      </div>
      <div style="font-size: 0.82rem; color: #dfe2f1; line-height: 1.55;">
        • <strong>대길 일자:</strong> ${calData.bestDays.length > 0 ? calData.bestDays.join(' · ') : '순차적 안정을 도모하는 달입니다.'}<br>
        • <strong>추천 행동:</strong> 계약 체결, 신규 사업 런칭, 중요한 제안, 귀인과의 회동 및 자금 운용에 가장 유리합니다.
      </div>
    </div>

    <!-- 7열 월간 캘린더 그리드 -->
    <div style="background: rgba(15, 19, 28, 0.95); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.25rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.45rem; text-align: center;">
        ${['일','월','화','수','목','금','토'].map((w, idx) => `
          <div style="padding: 0.5rem 0; color: ${idx === 0 ? '#ff6b6b' : idx === 6 ? '#4dabf7' : 'var(--text-muted)'}; font-weight: 800; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.25rem;">
            ${w}
          </div>
        `).join('')}

        ${Array.from({ length: new Date(year, month - 1, 1).getDay() }).map(() => `
          <div style="min-height: 70px; background: transparent;"></div>
        `).join('')}

        ${calData.days.map((d: any) => `
          <div style="min-height: 74px; padding: 0.45rem 0.3rem; border-radius: 8px; background: ${d.isGoldenDay ? 'rgba(242, 202, 80, 0.18)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${d.isGoldenDay ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; display: flex; flex-direction: column; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 0.2rem;">
              <span style="font-weight: 800; color: ${d.isGoldenDay ? 'var(--primary)' : '#ffffff'}; font-size: 0.85rem;">${d.date}</span>
              ${d.isGoldenDay ? '<span style="font-size: 0.65rem; color: var(--primary); font-weight: 800; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px;">대길</span>' : ''}
            </div>
            <div style="font-size: 0.72rem; color: #dfe2f1; font-weight: 700; margin: 2px 0;">
              천기 ${d.luckyRate}%
            </div>
            <div style="font-size: 0.65rem; color: ${d.isGoldenDay ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: 600; line-height: 1.2; text-align: center;">
              ${d.actionTag}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

  </div>
  `;
}
