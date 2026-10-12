/**
 * Yeopjeon Calendar Modal Component (월간 엽전 수호 달력 모달)
 * 
 * - 월별 방비 실천 성공 내역 시각화 (도장/엽전 셀)
 * - 당월 달성률, 현재 연속 스트릭, 누적 엽전 표기
 * - 엽전 활용 혜택 안내 (2027 리포트 및 상담 결제 할인)
 */

import { yeopjeonTracker } from '../state/yeopjeon-tracker-state.js';

export function renderYeopjeonCalendarModal(currentDate: Date = new Date()): string {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const todayDateNum = currentDate.getDate();

  const monthStr = `${year}년 ${month + 1}월`;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const history = yeopjeonTracker.history;
  const currentStreak = yeopjeonTracker.currentStreak;
  const totalCoins = yeopjeonTracker.totalYeopjeon;

  // 당월 완료 일수 계산
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthCompletedCount = history.filter((h: any) => h.date.startsWith(prefix) && h.completed).length;

  return `
    <div id="modal-yeopjeon-calendar" class="mabosal-modal-overlay" style="position: fixed; inset: 0; background: rgba(8, 10, 16, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; box-sizing: border-box;">
      <div class="mabosal-modal-content" style="background: #141823; border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 18px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 1.5rem; box-shadow: 0 20px 50px rgba(0,0,0,0.6); position: relative;">
        
        <!-- 모달 닫기 버튼 -->
        <button type="button" id="btn-close-yeopjeon-modal" style="position: absolute; top: 1.25rem; right: 1.25rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease;">
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
        </button>

        <!-- 모달 헤더 -->
        <div style="margin-bottom: 1.25rem; padding-right: 2rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 100px; padding: 3px 10px; margin-bottom: 0.5rem;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #f2ca50; display: inline-flex; align-items: center; justify-content: center;">
              <span style="font-size: 7px; color: #1c1500; font-weight: 900;">通</span>
            </div>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary);">마기 방비 수호 캘린더</span>
          </div>
          <h3 style="font-family: var(--font-serif); font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 0.3rem 0;">
            나의 엽전 출석부 (${monthStr})
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
            매일 마기를 방어하고 하루를 무탈하게 지키면 엽전 1냥이 채워집니다.
          </p>
        </div>

        <!-- 당월 성과 요약 배너 -->
        <div style="background: rgba(242, 202, 80, 0.05); border: 1px solid rgba(242, 202, 80, 0.2); border-radius: 12px; padding: 0.85rem 1rem; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; gap: 0.5rem; margin-bottom: 1.25rem;">
          <div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px;">당월 성공</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">${monthCompletedCount}일</div>
          </div>
          <div style="border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px;">연속 스트릭</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #ff9800; display: flex; align-items: center; justify-content: center; gap: 2px;">
              <span class="material-symbols-outlined" style="font-size: 15px;">local_fire_department</span>
              ${currentStreak}일
            </div>
          </div>
          <div>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 2px;">누적 엽전</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #ffe680;">${totalCoins}냥</div>
          </div>
        </div>

        <!-- 달력 요일 헤더 (일 ~ 토) -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">
          <span style="color: #ff6b6b;">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span style="color: #74c0fc;">토</span>
        </div>

        <!-- 달력 일자 그리드 -->
        <div class="calendar-cells-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 1.25rem;">
          ${Array.from({ length: firstDayOfWeek }).map(() => `
            <div style="aspect-ratio: 1; border-radius: 8px; background: transparent;"></div>
          `).join('')}

          ${Array.from({ length: totalDaysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const record = history.find((h: any) => h.date === dateStr);
            const isCompleted = record?.completed ?? false;
            const isToday = dayNum === todayDateNum;

            let bgColor = 'rgba(255,255,255,0.02)';
            let borderColor = 'rgba(255,255,255,0.06)';
            if (isToday) {
              borderColor = 'var(--primary)';
              bgColor = isCompleted ? 'rgba(81, 207, 102, 0.12)' : 'rgba(242, 202, 80, 0.08)';
            } else if (isCompleted) {
              bgColor = 'rgba(242, 202, 80, 0.12)';
              borderColor = 'rgba(242, 202, 80, 0.3)';
            }

            return `
              <div style="aspect-ratio: 1; border-radius: 8px; background: ${bgColor}; border: 1px solid ${borderColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 2px;">
                <span style="font-size: 0.7rem; font-weight: ${isToday ? '800' : '500'}; color: ${isToday ? 'var(--primary)' : 'var(--text-secondary)'};">
                  ${dayNum}
                </span>
                ${isCompleted ? `
                  <div style="width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #f2ca50, #b8860b); display: flex; align-items: center; justify-content: center; margin-top: 2px; box-shadow: 0 0 6px rgba(242,202,80,0.5);">
                    <span style="font-size: 7px; color: #1c1500; font-weight: 900;">寶</span>
                  </div>
                ` : isToday ? `
                  <span style="font-size: 0.6rem; color: var(--primary); font-weight: 700; margin-top: 2px;">오늘</span>
                ` : `
                  <span style="width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.1); margin-top: 6px;"></span>
                `}
              </div>
            `;
          }).join('')}
        </div>

        <!-- 엽전 혜택 안내 카드 -->
        <div style="background: rgba(20, 24, 35, 0.9); border: 1px dashed rgba(242, 202, 80, 0.3); border-radius: 10px; padding: 0.85rem 1rem; font-size: 0.78rem; line-height: 1.5; color: var(--text-secondary);">
          <div style="font-weight: 700; color: #ffe680; display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">help</span>
            모은 엽전(葉錢)은 어디에 쓰나요?
          </div>
          <div>• <strong>2027 정미년 운세 리포트</strong> 결제 시 1냥당 100원 즉시 할인</div>
          <div>• <strong>1:1 명리 마스터 상담</strong> 신청 시 우선 배정 및 복채 차감 사용</div>
        </div>

      </div>
    </div>
  `;
}
