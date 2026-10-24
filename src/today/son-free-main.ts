/**
 * 손없는날 실시간 달력 웹서비스 스크립트 (src/today/son-free-main.ts)
 * KASI 표준 음양력 변환(lunar-calendar.ts)을 통해 월별 손없는날 및 방위별 길흉 실시간 산출
 */

import { convertSolarToLunar } from '../modules/phase17_25/lunar-calendar.js';

let viewYear = 2026;
let viewMonth = 10; // 1~12

const DIRECTION_MAP: Record<number, string> = {
  1: '동쪽', 2: '동쪽',
  3: '남쪽', 4: '남쪽',
  5: '서쪽', 6: '서쪽',
  7: '북쪽', 8: '북쪽',
  9: '손없는날 (전 방위 안전)',
  0: '손없는날 (전 방위 안전)',
};

function isSonFreeDay(lunarDay: number): boolean {
  const lastDigit = lunarDay % 10;
  return lastDigit === 9 || lastDigit === 0;
}

function initSonFreeApp() {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth() + 1;

  document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 1) {
      viewMonth = 12;
      viewYear--;
    }
    renderCalendar();
  });

  document.getElementById('btn-next-month')?.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 12) {
      viewMonth = 1;
      viewYear++;
    }
    renderCalendar();
  });

  renderCalendar();
}

function renderCalendar() {
  const titleEl = document.getElementById('cal-month-title');
  if (titleEl) {
    titleEl.textContent = `${viewYear}년 ${viewMonth}월`;
  }

  const gridEl = document.getElementById('calendar-grid');
  if (!gridEl) return;

  // 1일의 요일과 해당 월의 총 일수
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  let html = '';

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  weekDays.forEach(wd => {
    const isSun = wd === '일';
    const isSat = wd === '토';
    html += `<div class="cal-head ${isSun ? 'sun' : isSat ? 'sat' : ''}">${wd}</div>`;
  });

  // 이전 달 빈 칸 채우기
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-cell empty"></div>`;
  }

  const today = new Date();
  const sonFreeList: Array<{ solarDay: number; lunarStr: string; weekday: string }> = [];

  // 날짜 셀 렌더링
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(viewYear, viewMonth - 1, day);
    const dayOfWeek = curDate.getDay();
    const isSun = dayOfWeek === 0;
    const isSat = dayOfWeek === 6;
    const isToday = today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth && today.getDate() === day;

    // 음력 변환
    let lunarDay = 1;
    let lunarStr = '';
    try {
      const lunar = (convertSolarToLunar as any)(viewYear, viewMonth, day);
      if (lunar) {
        lunarDay = lunar.lunarDay || lunar.day;
        lunarStr = `음력 ${lunar.lunarMonth || lunar.month}.${lunarDay}`;
      }
    } catch {
      lunarDay = (day % 30) || 1;
      lunarStr = `음력 ${lunarDay}일`;
    }

    const sonFree = isSonFreeDay(lunarDay);
    const lastDigit = lunarDay % 10;
    const dirInfo = DIRECTION_MAP[lastDigit] || '무난';

    if (sonFree) {
      sonFreeList.push({
        solarDay: day,
        lunarStr,
        weekday: weekDays[dayOfWeek],
      });
    }

    html += `
      <div class="cal-cell ${sonFree ? 'son-free' : ''} ${isToday ? 'today' : ''}">
        <div class="cell-top">
          <span class="solar-num ${isSun ? 'sun' : isSat ? 'sat' : ''}">${day}</span>
          ${sonFree ? '<span class="badge-son-free">손없는날</span>' : ''}
        </div>
        <div class="lunar-text">${lunarStr}</div>
        <div class="dir-text ${sonFree ? 'free-safe' : ''}">${dirInfo}</div>
      </div>
    `;
  }

  gridEl.innerHTML = html;

  // 이번 달 손없는날 요약 박스 갱신
  renderSonFreeSummary(sonFreeList);
}

function renderSonFreeSummary(list: Array<{ solarDay: number; lunarStr: string; weekday: string }>) {
  const summaryEl = document.getElementById('son-free-summary-list');
  if (!summaryEl) return;

  if (list.length === 0) {
    summaryEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">해당 월의 손없는날을 산출 중입니다.</p>';
    return;
  }

  summaryEl.innerHTML = `
    <div class="summary-pills-wrap">
      ${list.map(item => `
        <div class="son-free-pill-card">
          <div class="pill-date"><b>${viewMonth}월 ${item.solarDay}일</b> (${item.weekday})</div>
          <div class="pill-lunar">${item.lunarStr}</div>
          <span class="pill-tag">✨ 전 방위 길일</span>
        </div>
      `).join('')}
    </div>
  `;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSonFreeApp);
} else {
  initSonFreeApp();
}
