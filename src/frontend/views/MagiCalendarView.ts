import { dailyZodiacMagiEngine, ZODIAC_INFOS } from '../services/DailyZodiacMagiEngine.js';
import { getSelectedZodiac, getSelectedYear, setSelectedZodiac, setSelectedYear } from './TodayFortuneAndMagiWidget.js';

/**
 * [메인 홈페이지 전용] 월간 마기 달력 뷰 (MagiCalendarView)
 * - 일반 방문자 및 회원이 12간지 띠와 출생연도를 자유롭게 선택하여 탐색하는 공개형 피흉 달력
 * - 전체 테마 색상은 기본 컬러(골드/다크)로 유지
 * - 가장 심각한 날(일지 직접 충돌 등)에만 선명한 적색 "주의" 스티커 부착
 */
export function renderMagiCalendarView(state: any): string {
  const currentZodiac = getSelectedZodiac();
  const currentYear = getSelectedYear();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const calData = (dailyZodiacMagiEngine as any).getMonthlyMagiCalendarData(
    year, 
    month, 
    currentZodiac || '자', 
    currentYear
  );

  const years = currentZodiac ? dailyZodiacMagiEngine.getYearsForZodiac(currentZodiac) : [];

  return `
  <div class="calendar-page-container magi-calendar-view" style="width: 100%; max-width: 1440px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; box-sizing: border-box;">
    
    <!-- 상단 탭 전환: [마기 달력] ⟷ [행운 달력] -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(242, 202, 80, 0.25); padding-bottom: 0.85rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button type="button" id="tab-goto-magi-cal" class="cal-tab-btn active" style="background: rgba(242, 202, 80, 0.2); border: 1.5px solid var(--primary); color: #ffffff; padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 800; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">event_busy</span>
          <span>마기 달력</span>
        </button>
        <button type="button" id="tab-goto-lucky-cal" class="cal-tab-btn" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-muted); padding: 0.5rem 1.1rem; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px;">event_available</span>
          <span>행운 달력</span>
        </button>
      </div>
      <div>
        <button type="button" id="btn-cal-back-home" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: #dfe2f1; padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">arrow_back</span>
          <span>홈으로 돌아가기</span>
        </button>
      </div>
    </div>

    <!-- 타이틀 (보조 설명 제거) -->
    <div style="margin-bottom: 1.25rem;">
      <h2 style="font-size: 1.45rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.02em;">
        ${year}년 ${month}월 마기 달력
      </h2>
    </div>

    <!-- [1. 상단 배치] 12간지 띠 & 출생연도 선택 필터 -->
    <div style="background: rgba(20, 24, 35, 0.75); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
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

    <!-- [2. 달력 위쪽으로 이동] 이달의 요주의 피결정일 (마기 경보) 포인트 설명 박스 -->
    <div style="background: rgba(242, 202, 80, 0.08); border-left: 4px solid var(--primary); border-radius: 0 10px 10px 0; padding: 0.85rem 1.15rem; margin-bottom: 1.25rem;">
      <div style="font-size: 0.88rem; font-weight: 800; color: #ffffff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">warning</span>
        <span>${calData.zodiacAnimal}띠 이달의 요주의 피결정일 (마기 경보)</span>
      </div>
      <div style="font-size: 0.82rem; color: #dfe2f1; line-height: 1.55;">
        • <strong>경보 일자:</strong> ${calData.worstDays.length > 0 ? calData.worstDays.join(' · ') : '상충이 없는 평온한 달입니다.'}<br>
        • <strong>주의 행동:</strong> 중요한 계약서 날인, 확정적 구두 약속, 큰 투자 결정, 장거리 운전 및 감정적 언쟁을 피하는 등의 주의가 필요합니다.
      </div>
    </div>

    <!-- [3. 7열 월간 캘린더 그리드 (기본 컬러 + 가장 심각한 날에만 적색 '주의' 스티커 부착)] -->
    <div style="background: rgba(15, 19, 28, 0.95); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.25rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); margin-bottom: 1.25rem;">
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.45rem; text-align: center;">
        ${['일','월','화','수','목','금','토'].map((w, idx) => `
          <div style="padding: 0.5rem 0; color: ${idx === 0 ? '#ff6b6b' : idx === 6 ? '#4dabf7' : 'var(--text-muted)'}; font-weight: 800; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.25rem;">
            ${w}
          </div>
        `).join('')}

        ${Array.from({ length: new Date(year, month - 1, 1).getDay() }).map(() => `
          <div style="min-height: 70px; background: transparent;"></div>
        `).join('')}

        ${calData.days.map((d: any) => {
          const isCriticalClash = !!d.isClash; // 가장 심각한 일지 직접 충돌 날짜

          return `
          <div style="min-height: 74px; padding: 0.45rem 0.3rem; border-radius: 8px; background: ${isCriticalClash ? 'rgba(220, 38, 38, 0.12)' : d.isWarningDay ? 'rgba(242, 202, 80, 0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isCriticalClash ? 'rgba(220, 38, 38, 0.45)' : d.isWarningDay ? 'rgba(242, 202, 80, 0.35)' : 'rgba(255,255,255,0.06)'}; display: flex; flex-direction: column; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 0.2rem;">
              <span style="font-weight: 800; color: ${isCriticalClash ? '#f87171' : d.isWarningDay ? 'var(--primary)' : '#ffffff'}; font-size: 0.85rem;">${d.date}</span>
              ${isCriticalClash ? `
                <span style="font-size: 0.65rem; color: #ffffff; font-weight: 800; background: #dc2626; padding: 1px 5px; border-radius: 3px; box-shadow: 0 1px 3px rgba(220,38,38,0.5);">주의</span>
              ` : d.isWarningDay ? `
                <span style="font-size: 0.65rem; color: var(--primary); font-weight: 800; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px;">경보</span>
              ` : ''}
            </div>
            <div style="font-size: 0.72rem; color: ${isCriticalClash ? '#fca5a5' : '#dfe2f1'}; font-weight: 700; margin: 2px 0;">
              마기 ${d.magiRate}%
            </div>
            <div style="font-size: 0.65rem; color: ${isCriticalClash ? '#f87171' : d.isWarningDay ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: 600; line-height: 1.2; text-align: center;">
              ${d.avoidTag}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

  </div>
  `;
}
