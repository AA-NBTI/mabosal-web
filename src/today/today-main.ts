/**
 * 오늘의 운세 단일 페이지 웹서비스 진입점
 * 마보살 명리 엔진(DailyFortuneEngine, SajuCoreEngine, CalendarEngine 등)을 직접 연동하여
 * 백세인생 사주 입력창(시간 입력 제외)을 통해 1:1 맞춤 오늘의 운세를 즉시 산출합니다.
 */

import { CalendarEngine } from '../modules/calendar/calendar-engine.js';
import { PillarEngine } from '../modules/pillar/pillar-engine.js';
import { SajuCoreEngine } from '../modules/saju-core/saju-core-engine.js';
import { RelationshipEngine } from '../modules/relationship/relationship-engine.js';
import { SignalEngine } from '../modules/signal/signal-engine.js';
import { DailyFortuneEngine, DailyFortuneScores } from '../modules/daily-fortune/daily-fortune-engine.js';
import { standardizeBirthDate } from '../modules/phase17_25/lunar-calendar.js';

// 12간지 상수 정의
const ZODIAC_LIST = [
  { key: 'rat', name: '쥐띠', branch: '자', element: '수', hanja: '子' },
  { key: 'ox', name: '소띠', branch: '축', element: '토', hanja: '丑' },
  { key: 'tiger', name: '호랑이띠', branch: '인', element: '목', hanja: '寅' },
  { key: 'rabbit', name: '토끼띠', branch: '묘', element: '목', hanja: '卯' },
  { key: 'dragon', name: '용띠', branch: '진', element: '토', hanja: '辰' },
  { key: 'snake', name: '뱀띠', branch: '사', element: '화', hanja: '巳' },
  { key: 'horse', name: '말띠', branch: '오', element: '화', hanja: '午' },
  { key: 'sheep', name: '양띠', branch: '미', element: '토', hanja: '未' },
  { key: 'monkey', name: '원숭이띠', branch: '신', element: '금', hanja: '申' },
  { key: 'rooster', name: '닭띠', branch: '유', element: '금', hanja: '酉' },
  { key: 'dog', name: '개띠', branch: '술', element: '토', hanja: '戌' },
  { key: 'pig', name: '돼지띠', branch: '해', element: '수', hanja: '亥' },
];

const STEM_CHARS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCH_CHARS = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const STEM_ELEMENT_MAP: Record<string, string> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
};

const ELEMENT_COLOR_MAP: Record<string, string> = {
  목: '청색(초록)', 화: '적색(빨강)', 토: '황색(노랑)', 금: '백색(흰색)', 수: '흑색(남색)',
};

const ELEMENT_NUMBER_MAP: Record<string, string> = {
  목: '3 · 8', 화: '2 · 7', 토: '5 · 10', 금: '4 · 9', 수: '1 · 6',
};

// 12간지 시간 매핑
function getBranchHourName(branchIdx: number): string {
  const s = (23 + 2 * branchIdx) % 24;
  return `${BRANCH_CHARS[branchIdx]}시(${s}시~${(s + 2) % 24}시)`;
}

// 엔진 인스턴스 초기화
const calEngine = new CalendarEngine();
const pilEngine = new PillarEngine();
const coreEngine = new SajuCoreEngine();
const relEngine = new RelationshipEngine();
const sigEngine = new SignalEngine();

// 오늘 날짜 계산
const todayDate = new Date();
const todayPillar = DailyFortuneEngine.getDailyPillar(todayDate);
const todayBranchIdx = BRANCH_CHARS.indexOf(todayPillar.branch);
const todayStemEl = STEM_ELEMENT_MAP[todayPillar.stem] || '화';

// 길시 및 흉시 계산 (일지와 합이 되는 시간 & 충이 되는 시간)
const luckyHourIdx = (13 - todayBranchIdx) % 12;
const cautionHourIdx = (todayBranchIdx + 6) % 12;
const luckyHourStr = getBranchHourName(luckyHourIdx);
const cautionHourStr = getBranchHourName(cautionHourIdx);
const luckyColorStr = ELEMENT_COLOR_MAP[todayStemEl] || '노랑';
const luckyNumberStr = ELEMENT_NUMBER_MAP[todayStemEl] || '5 · 10';

/**
 * 띠별 오늘의 운세 텍스트 생성
 */
function buildZodiacFortuneList() {
  const container = document.getElementById('zodiac-fortune-list');
  if (!container) return;

  const currentYear = todayDate.getFullYear();
  let html = '';

  ZODIAC_LIST.forEach((z, idx) => {
    // 합/충/평 관계
    let relType: 'hap' | 'chung' | 'py' = 'py';
    let relDesc = '오늘의 일지와 특별한 합·충 없이 무난하게 흐르는 날';
    let baseScore = 72;

    if ((idx + todayBranchIdx) % 12 === 1) {
      relType = 'hap';
      relDesc = '오늘의 일지와 합(合)이 되어 도움과 협력이 따르는 날';
      baseScore = 88;
    } else if ((idx - todayBranchIdx + 12) % 12 === 6) {
      relType = 'chung';
      relDesc = '오늘의 일지와 충(沖)이 되어 변화와 마찰에 유의할 날';
      baseScore = 54;
    }

    const moneyScore = Math.max(35, Math.min(98, baseScore + ((idx * 3) % 9) - 4));
    const healthScore = Math.max(40, Math.min(95, baseScore + ((idx * 5) % 7) - 3));
    const loveScore = Math.max(45, Math.min(99, baseScore + ((idx * 7) % 11) - 5));

    // 출생연도 목록 (최근 8개 연도)
    const birthYears: number[] = [];
    for (let y = currentYear; y >= currentYear - 90; y--) {
      if (((y - 4) % 12 + 12) % 12 === idx) {
        birthYears.push(y);
      }
    }

    const yearLines = birthYears.slice(0, 8).map(by => {
      const age = currentYear - by + 1;
      let advice = '';
      if (relType === 'hap') {
        advice = age > 60 
          ? '오랜 지인과 훈훈한 교류가 오가며 마음의 평안을 얻는 날입니다.'
          : age > 40
          ? '주변의 협조로 난관을 타개하고 실질적인 결실을 맺습니다.'
          : '적극적으로 뜻을 밝히면 든든한 조력자를 만나게 됩니다.';
      } else if (relType === 'chung') {
        advice = age > 60
          ? '무리한 외출이나 무거운 일은 피하고 휴식을 최우선하세요.'
          : age > 40
          ? '순간적인 감정 대립을 피하고 서류와 계약은 재검토하세요.'
          : '예상치 못한 변동이 생길 수 있으니 침착하게 속도를 조절하세요.';
      } else {
        advice = age > 60
          ? '가벼운 산책과 단정한 일상 유지가 활력을 돋워줍니다.'
          : age > 40
          ? '기본에 충실하며 순서대로 일을 처리하면 순조롭습니다.'
          : '평소 해오던 노력이 차분히 밑거름이 되어주는 날입니다.';
      }
      return `<li><b>${String(by).slice(2)}년생 (${age}세)</b> ${advice}</li>`;
    }).join('');

    html += `
      <article id="ddi-${z.key}" class="ddi-card">
        <div class="ddi-card-header">
          <h3>${z.name}(${z.branch}) 오늘의 운세</h3>
          <span class="ddi-badge ddi-badge-${relType}">${relType === 'hap' ? '합(合)' : relType === 'chung' ? '충(沖)' : '평(平)'}</span>
        </div>
        <p class="ddi-meta">${z.name}는 <b>${z.element}(${z.hanja})</b>의 기운이며, ${relDesc}입니다.</p>
        <div class="ddi-score-bar">
          <span class="ddi-score-pill">운세지수 <b>${baseScore}점</b></span>
          <span class="ddi-sub-score">금전 <b>${moneyScore}</b> · 건강 <b>${healthScore}</b> · 애정 <b>${loveScore}</b></span>
        </div>
        <ul class="ddi-year-list">
          ${yearLines}
        </ul>
      </article>
    `;
  });

  container.innerHTML = html;
}

/**
 * 마보살 사주 엔진 실행 함수 (시간 미상 3주 안전 계산)
 */
function runMabosalEngine(params: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
}): {
  scores: DailyFortuneScores;
  dayMaster: string;
  dayMasterElement: string;
  strength: string;
  pillarsFormatted: string;
  solarDateStr: string;
} {
  // 1. 음력/양력 표준화
  const std = standardizeBirthDate({
    birth_year: params.birthYear,
    birth_month: params.birthMonth,
    birth_day: params.birthDay,
    calendar_type: params.calendarType,
  });

  // 2. 역법 엔진 (시간 입력 제외 -> birth_time: null)
  const calOut = calEngine.execute({
    birth_date: std.solar_date_string,
    birth_time: null,
    region: 'Seoul',
  });

  // 3. 기둥 엔진 (Four Pillars)
  const pilOut = pilEngine.execute(calOut.data);

  // 4. 사주 핵심 엔진 (Saju Core)
  const coreOut = coreEngine.execute(pilOut.data);

  // 5. 관계 엔진 (Relationship)
  const relOut = relEngine.execute({ four_pillars: pilOut.data.four_pillars });

  // 6. 신호 엔진 (Signal)
  const sigOut = sigEngine.execute({
    saju_core: coreOut.data,
    relationship: relOut.data,
  });

  // 7. 오늘의 운세 계산 (Daily Fortune Engine)
  const scores = DailyFortuneEngine.calculate({
    sajuCore: coreOut.data,
    signal: sigOut.data,
    relationship: relOut.data,
    gender: params.gender,
    targetDate: todayDate,
  });

  const dayStem = pilOut.data.four_pillars.day.stem;
  const dayBranch = pilOut.data.four_pillars.day.branch;
  const dayMaster = `${dayStem}${dayBranch}`;
  const dayMasterElement = STEM_ELEMENT_MAP[dayStem] || '목';
  const strength = coreOut.data.day_master_strength.classification || '중화';

  const pillarsFormatted = `
    연주: ${pilOut.data.four_pillars.year.stem}${pilOut.data.four_pillars.year.branch} · 
    월주: ${pilOut.data.four_pillars.month.stem}${pilOut.data.four_pillars.month.branch} · 
    일주: ${dayMaster}
  `;

  return {
    scores,
    dayMaster,
    dayMasterElement,
    strength,
    pillarsFormatted,
    solarDateStr: std.solar_date_string,
  };
}

/**
 * 운세 결과 렌더링
 */
function renderResult(data: ReturnType<typeof runMabosalEngine>, params: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
}) {
  const resCard = document.getElementById('personal-result-card');
  if (!resCard) return;

  const { scores, dayMaster, dayMasterElement, strength, pillarsFormatted, solarDateStr } = data;

  // 점수별 배지 색상
  const isHigh = scores.celestialScore >= 80;
  const isCaution = scores.celestialScore < 60;
  const badgeClass = isHigh ? 'badge-high' : isCaution ? 'badge-caution' : 'badge-normal';

  const genderStr = params.gender === 'female' ? '여성' : '남성';
  const calStr = params.calendarType === 'lunar' ? `음력 (${solarDateStr} 양력 환산)` : '양력';

  resCard.innerHTML = `
    <div class="result-header">
      <div class="result-profile">
        <span class="result-profile-badge">사주 분석 완료</span>
        <span class="result-profile-info">${params.birthYear}년 ${params.birthMonth}월 ${params.birthDay}일 (${genderStr}, ${calStr})</span>
      </div>
      <div class="result-pillars">
        <span><b>내 사주 삼주:</b> ${pillarsFormatted}</span>
        <span class="result-daymaster-pill">일간 본원: <b>${dayMaster} (${dayMasterElement})</b> · ${strength}</span>
      </div>
    </div>

    <!-- 천기지수 메인 게이지 -->
    <div class="score-hero">
      <div class="score-circle-box">
        <div class="score-number">${scores.celestialScore}</div>
        <div class="score-unit">점</div>
      </div>
      <div class="score-summary-box">
        <div class="score-badge-row">
          <span class="celestial-badge ${badgeClass}">${scores.gradeBadge}</span>
          <span class="score-date">${todayPillar.ganjiDateStr} (${todayPillar.lunarDateStr})</span>
        </div>
        <h3 class="score-title">${scores.summaryTitle}</h3>
        <p class="score-desc">${scores.summaryDesc}</p>
      </div>
    </div>

    <!-- 3대 세부 지수 그리드 -->
    <div class="sub-scores-grid">
      <div class="sub-score-item">
        <div class="sub-score-head">
          <span class="sub-icon">💰</span>
          <span class="sub-name">금전운</span>
          <span class="sub-val">${scores.moneyScore}점</span>
        </div>
        <div class="sub-bar"><div class="sub-bar-fill" style="width: ${scores.moneyScore}%"></div></div>
        <p class="sub-desc">${scores.moneyDesc}</p>
      </div>

      <div class="sub-score-item">
        <div class="sub-score-head">
          <span class="sub-icon">❤️</span>
          <span class="sub-name">애정운</span>
          <span class="sub-val">${scores.loveScore}점</span>
        </div>
        <div class="sub-bar"><div class="sub-bar-fill" style="width: ${scores.loveScore}%"></div></div>
        <p class="sub-desc">${scores.loveDesc}</p>
      </div>

      <div class="sub-score-item">
        <div class="sub-score-head">
          <span class="sub-icon">🌿</span>
          <span class="sub-name">활력·건강</span>
          <span class="sub-val">${scores.vitalityScore}점</span>
        </div>
        <div class="sub-bar"><div class="sub-bar-fill" style="width: ${scores.vitalityScore}%"></div></div>
        <p class="sub-desc">${scores.vitalityDesc}</p>
      </div>
    </div>

    <!-- 실전 행동 지침 & 행운 요소 -->
    <div class="action-guide-box">
      <h4>💡 오늘 나를 돕는 실전 명리 가이드</h4>
      <div class="action-guide-grid">
        <div class="guide-item">
          <b>최적의 길한 시간</b>
          <span>${luckyHourStr}</span>
        </div>
        <div class="guide-item">
          <b>주의할 시간</b>
          <span>${cautionHourStr}</span>
        </div>
        <div class="guide-item">
          <b>행운의 색상</b>
          <span>${luckyColorStr}</span>
        </div>
        <div class="guide-item">
          <b>행운의 숫자</b>
          <span>${luckyNumberStr}</span>
        </div>
      </div>
      <p class="guide-bottom-tip">
        * 본 결과는 마보살 정통 사주 명리 엔진을 통해 귀하의 일간(본원)과 오늘 일진(${todayPillar.pillarName}) 간의 오행 상생·상극 및 합충 관계를 실시간 분석한 맞춤 운세입니다.
      </p>
    </div>
  `;

  resCard.style.display = 'block';
  resCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 초기화 및 이벤트 리스너 바인딩
 */
function initApp() {
  // 1. 오늘 날짜 및 일진 헤더 바인딩
  const todayDateEl = document.getElementById('today-date-text');
  if (todayDateEl) {
    const y = todayDate.getFullYear();
    const m = todayDate.getMonth() + 1;
    const d = todayDate.getDate();
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayName = dayNames[todayDate.getDay()];
    todayDateEl.textContent = `${y}년 ${m}월 ${d}일 ${dayName} · ${todayPillar.lunarDateStr} · ${todayPillar.pillarName}일`;
  }

  // 2. 오늘의 일진 해설 바인딩
  const iljinSummaryEl = document.getElementById('iljin-summary-text');
  if (iljinSummaryEl) {
    iljinSummaryEl.innerHTML = `
      오늘은 천간 <b>${todayPillar.stem}(${todayStemEl})</b>과 지지 <b>${todayPillar.branch}</b>가 만나는 <b>${todayPillar.pillarName}일</b>입니다.
      천기의 흐름이 조화롭게 흐르는 날이며, 일진과의 상호작용에 따라 각 띠별·사주별로 서로 다른 기운이 작용합니다.
    `;
  }

  const luckyMetaEl = document.getElementById('lucky-meta-text');
  if (luckyMetaEl) {
    luckyMetaEl.innerHTML = `
      길한 시간: <b>${luckyHourStr}</b> · 조심할 시간: <b>${cautionHourStr}</b><br>
      행운의 색: <b>${luckyColorStr}</b> · 행운의 숫자: <b>${luckyNumberStr}</b>
    `;
  }

  // 3. 12간지 띠별 운세 리스트 생성
  buildZodiacFortuneList();

  // 4. 출생 연도 옵션 채우기 (백세인생 기준 1920 ~ 2030)
  const yearSelect = document.getElementById('input-year') as HTMLSelectElement | null;
  if (yearSelect && yearSelect.options.length === 0) {
    const curYear = todayDate.getFullYear();
    for (let y = curYear; y >= 1925; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = `${y}년`;
      if (y === 1998) opt.selected = true;
      yearSelect.appendChild(opt);
    }
  }

  // 5. 출생 월 옵션 채우기
  const monthSelect = document.getElementById('input-month') as HTMLSelectElement | null;
  if (monthSelect && monthSelect.options.length === 0) {
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement('option');
      opt.value = String(m);
      opt.textContent = `${m}월`;
      if (m === 4) opt.selected = true;
      monthSelect.appendChild(opt);
    }
  }

  // 6. 출생 일 옵션 채우기
  const daySelect = document.getElementById('input-day') as HTMLSelectElement | null;
  if (daySelect && daySelect.options.length === 0) {
    for (let d = 1; d <= 31; d++) {
      const opt = document.createElement('option');
      opt.value = String(d);
      opt.textContent = `${d}일`;
      if (d === 12) opt.selected = true;
      daySelect.appendChild(opt);
    }
  }

  // 7. 사주 빠른 프리셋 버튼 핸들러
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const y = target.dataset.year;
      const m = target.dataset.month;
      const d = target.dataset.day;
      const g = target.dataset.gender;
      const c = target.dataset.calendar || 'solar';

      if (yearSelect && y) yearSelect.value = y;
      if (monthSelect && m) monthSelect.value = m;
      if (daySelect && d) daySelect.value = d;

      const genderSelect = document.getElementById('input-gender') as HTMLSelectElement | null;
      if (genderSelect && g) genderSelect.value = g;

      const calSelect = document.getElementById('input-calendar') as HTMLSelectElement | null;
      if (calSelect && c) calSelect.value = c;

      // 자동 계산 트리거
      submitForm();
    });
  });

  // 8. 폼 제출 핸들러 (시간 입력 제외!)
  const form = document.getElementById('form-today-saju');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });
  }

  const submitBtn = document.getElementById('btn-submit-saju');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitForm();
    });
  }

  function submitForm() {
    const genderSelect = document.getElementById('input-gender') as HTMLSelectElement | null;
    const yearEl = document.getElementById('input-year') as HTMLSelectElement | null;
    const monthEl = document.getElementById('input-month') as HTMLSelectElement | null;
    const dayEl = document.getElementById('input-day') as HTMLSelectElement | null;
    const calSelect = document.getElementById('input-calendar') as HTMLSelectElement | null;

    const gender = (genderSelect?.value || 'female') as 'male' | 'female';
    const birthYear = parseInt(yearEl?.value || '1998', 10);
    const birthMonth = parseInt(monthEl?.value || '4', 10);
    const birthDay = parseInt(dayEl?.value || '12', 10);
    const calendarType = (calSelect?.value || 'solar') as 'solar' | 'lunar';

    const result = runMabosalEngine({
      birthYear,
      birthMonth,
      birthDay,
      gender,
      calendarType,
    });

    renderResult(result, {
      birthYear,
      birthMonth,
      birthDay,
      gender,
      calendarType,
    });
  }
}

// DOM 로드 완료 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
