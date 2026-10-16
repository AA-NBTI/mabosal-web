import { dailyZodiacMagiEngine } from '../services/DailyZodiacMagiEngine.js';
import { AuthService } from '../state/auth-service.js';
import { AppStateData } from '../state/app-state.js';

/**
 * [이용자 대시보드 전용] 1:1 개인화 행운 달력 위젯
 * - 7열 월간 캘린더 그리드를 맨 위쪽에 우선 배치
 * - 하단에 이달의 대길일 요약 박스 배치
 */
export function renderMemberLuckyCalendarWidget(state: AppStateData): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 개인 사주 원국 정보 확인 및 fallback
  const sajuCore = state?.calcResult?.saju_core || (state?.sessionState as any)?.sajuCore || (state?.calcResult as any)?.sajuCore || {
    four_pillars: {
      day: { stem: { char: '갑', element: '목' }, branch: { char: '자', element: '수' } }
    },
    day_master_strength: { yongshin: '화', heeshin: '토' }
  };
  const signal = state?.calcResult?.signal;
  const relationship = state?.calcResult?.relationships;
  const currentUser = AuthService.getCurrentUser();
  const userName = state?.userName || (currentUser && currentUser.role !== 'guest' ? currentUser.name : '회원');
  const gender = state?.gender || (currentUser?.gender === 'female' ? 'female' : 'male');

  const calData = (dailyZodiacMagiEngine as any).getPersonalizedMonthlyLuckyCalendarData(year, month, {
    sajuCore,
    signal,
    relationship,
    userName,
    gender,
  });

  return `
  <div class="member-calendar-container member-lucky-calendar" style="width: 100%; box-sizing: border-box;">
    
    <!-- [1. 최상단 배치] 7열 월간 캘린더 그리드 -->
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
          const isToday = (year === now.getFullYear() && month === (now.getMonth() + 1) && d.date === now.getDate());
          return `
          <div style="min-height: 82px; padding: 0.45rem 0.3rem; border-radius: 8px; background: ${isToday ? 'rgba(96, 165, 250, 0.14)' : d.isGoldenDay ? 'rgba(242, 202, 80, 0.18)' : 'rgba(255,255,255,0.03)'}; border: ${isToday ? '2px solid #60a5fa' : d.isGoldenDay ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)'}; box-shadow: ${isToday ? '0 0 12px rgba(96, 165, 250, 0.4)' : 'none'}; display: flex; flex-direction: column; align-items: center; justify-content: space-between; transition: all 0.2s ease; position: relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 0.2rem;">
              <span style="font-weight: 800; color: ${isToday ? '#60a5fa' : d.isGoldenDay ? 'var(--primary)' : '#ffffff'}; font-size: 0.88rem;">${d.date}</span>
              <div style="display: flex; align-items: center; gap: 2px;">
                ${isToday ? '<span style="font-size: 0.6rem; color: #0f172a; font-weight: 900; background: #60a5fa; padding: 1px 4px; border-radius: 3px; display: inline-flex; align-items: center; gap: 1px;"><span class="material-symbols-outlined" style="font-size: 10px;">check</span>오늘</span>' : ''}
                ${d.isGoldenDay ? '<span style="font-size: 0.65rem; color: var(--primary); font-weight: 800; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px;">대길</span>' : ''}
              </div>
            </div>
            <div style="font-size: 0.72rem; color: ${isToday ? '#93c5fd' : '#dfe2f1'}; font-weight: 700; margin: 2px 0;">
              행운지수 ${d.luckyRate}%
            </div>
            <div style="font-size: 0.65rem; color: ${isToday ? '#93c5fd' : d.isGoldenDay ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: 600; line-height: 1.2; text-align: center;">
              ${d.actionTag}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- [2. 달력 아래 배치] 타이틀 및 안내문 -->
    <div style="margin-bottom: 1rem; padding: 0 0.25rem;">
      <h2 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0 0 0.25rem 0;">
        ${year}년 ${month}월 행운 달력
      </h2>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
        이달의 대길일과 행운지수를 한눈에 확인하고 중요한 일정을 계획해 보세요.
      </p>
    </div>

    <!-- [3. 하단 배치] 이달의 황금 길일 요약 박스 -->
    <div style="background: rgba(242, 202, 80, 0.08); border-left: 4px solid var(--primary); border-radius: 0 10px 10px 0; padding: 0.9rem 1.15rem;">
      <div style="font-size: 0.88rem; font-weight: 800; color: #ffffff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">stars</span>
        <span>${userName} 님 이달의 황금 길일 (골든 데이)</span>
      </div>
      <div style="font-size: 0.82rem; color: #dfe2f1; line-height: 1.55;">
        • <strong>대길 일자:</strong> ${calData.bestDays.length > 0 ? calData.bestDays.join(' · ') : '순차적 안정을 도모하는 달입니다.'}<br>
        • <strong>추천 행동:</strong> 계약 체결, 신규 사업 런칭, 중요한 제안, 귀인과의 회동 및 자금 운용에 가장 유리합니다.
      </div>
    </div>

  </div>
  `;
}

/**
 * [이용자 대시보드 전용] 1:1 개인화 마기 달력 위젯
 * - 7열 월간 캘린더 그리드를 맨 위쪽에 우선 배치
 * - 당일 날짜(오늘) 체크 표시 제공
 * - 타이틀 및 요약 박스를 달력 아래에 배치
 * - 지시형 표현 대신 제안/주의 권고 형태 적용
 */
export function renderMemberMagiCalendarWidget(state: AppStateData): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 개인 사주 원국 정보 확인 및 fallback
  const sajuCore = state?.calcResult?.saju_core || (state?.sessionState as any)?.sajuCore || (state?.calcResult as any)?.sajuCore || {
    four_pillars: {
      day: { stem: { char: '갑', element: '목' }, branch: { char: '자', element: '수' } }
    },
    day_master_strength: { yongshin: '화', heeshin: '토' }
  };
  const signal = state?.calcResult?.signal;
  const relationship = state?.calcResult?.relationships;
  const currentUser = AuthService.getCurrentUser();
  const userName = state?.userName || (currentUser && currentUser.role !== 'guest' ? currentUser.name : '회원');
  const gender = state?.gender || (currentUser?.gender === 'female' ? 'female' : 'male');

  const calData = (dailyZodiacMagiEngine as any).getPersonalizedMonthlyMagiCalendarData(year, month, {
    sajuCore,
    signal,
    relationship,
    userName,
    gender,
  });

  return `
  <div class="member-calendar-container member-magi-calendar" style="width: 100%; box-sizing: border-box;">
    
    <!-- [1. 최상단 배치] 7열 월간 캘린더 그리드 (기본 컬러 + 가장 심각한 날에만 적색 '주의' 스티커 부착) -->
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
          const isToday = (year === now.getFullYear() && month === (now.getMonth() + 1) && d.date === now.getDate());

          return `
          <div style="min-height: 82px; padding: 0.45rem 0.3rem; border-radius: 8px; background: ${isToday ? 'rgba(96, 165, 250, 0.14)' : isCriticalClash ? 'rgba(220, 38, 38, 0.12)' : d.isWarningDay ? 'rgba(242, 202, 80, 0.12)' : 'rgba(255,255,255,0.03)'}; border: ${isToday ? '2px solid #60a5fa' : isCriticalClash ? '1px solid rgba(220, 38, 38, 0.45)' : d.isWarningDay ? '1px solid rgba(242, 202, 80, 0.35)' : '1px solid rgba(255,255,255,0.06)'}; box-shadow: ${isToday ? '0 0 12px rgba(96, 165, 250, 0.4)' : 'none'}; display: flex; flex-direction: column; align-items: center; justify-content: space-between; transition: all 0.2s ease; position: relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 0.2rem;">
              <span style="font-weight: 800; color: ${isToday ? '#60a5fa' : isCriticalClash ? '#f87171' : d.isWarningDay ? 'var(--primary)' : '#ffffff'}; font-size: 0.88rem;">${d.date}</span>
              <div style="display: flex; align-items: center; gap: 2px;">
                ${isToday ? '<span style="font-size: 0.6rem; color: #0f172a; font-weight: 900; background: #60a5fa; padding: 1px 4px; border-radius: 3px; display: inline-flex; align-items: center; gap: 1px;"><span class="material-symbols-outlined" style="font-size: 10px;">check</span>오늘</span>' : ''}
                ${isCriticalClash ? `
                  <span style="font-size: 0.65rem; color: #ffffff; font-weight: 800; background: #dc2626; padding: 1px 5px; border-radius: 3px; box-shadow: 0 1px 3px rgba(220,38,38,0.5);">주의</span>
                ` : d.isWarningDay ? `
                  <span style="font-size: 0.65rem; color: var(--primary); font-weight: 800; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px;">경보</span>
                ` : ''}
              </div>
            </div>
            <div style="font-size: 0.72rem; color: ${isToday ? '#93c5fd' : isCriticalClash ? '#fca5a5' : '#dfe2f1'}; font-weight: 700; margin: 2px 0;">
              마기 ${d.magiRate}%
            </div>
            <div style="font-size: 0.65rem; color: ${isToday ? '#93c5fd' : isCriticalClash ? '#f87171' : d.isWarningDay ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: 600; line-height: 1.2; text-align: center;">
              ${d.avoidTag}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- [2. 달력 아래 배치] 타이틀 및 안내문 -->
    <div style="margin-bottom: 1rem; padding: 0 0.25rem;">
      <h2 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0 0 0.25rem 0;">
        ${year}년 ${month}월 마기 달력
      </h2>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
        이달의 피해야 할 요주의 결정일과 마기지수를 확인하여 리스크를 사전에 예방하세요.
      </p>
    </div>

    <!-- [3. 하단 배치] 이달의 요주의 피결정일 요약 박스 (기본 컬러 적용 & 제안형 문구) -->
    <div style="background: rgba(242, 202, 80, 0.08); border-left: 4px solid var(--primary); border-radius: 0 10px 10px 0; padding: 0.9rem 1.15rem;">
      <div style="font-size: 0.88rem; font-weight: 800; color: #ffffff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">warning</span>
        <span>${userName} 님 이달의 요주의 피결정일 (마기 경보)</span>
      </div>
      <div style="font-size: 0.82rem; color: #dfe2f1; line-height: 1.55;">
        • <strong>경보 일자:</strong> ${calData.worstDays.length > 0 ? calData.worstDays.join(' · ') : '상충이 없는 평온한 달입니다.'}<br>
        • <strong>주의 행동:</strong> 중요한 계약서 날인, 확정적 구두 약속, 큰 투자 결정, 장거리 이동 및 감정적 언쟁을 피하는 등의 주의가 필요합니다.
      </div>
    </div>

  </div>
  `;
}
