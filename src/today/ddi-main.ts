/**
 * 띠별 운세 단일 페이지 웹서비스 진입점 (src/today/ddi-main.ts)
 * 마보살 DailyZodiacMagiEngine을 직접 연동하여 12간지 및 출생연도별 실시간 운세 산출
 */

import { dailyZodiacMagiEngine, ZODIAC_INFOS } from '../frontend/services/DailyZodiacMagiEngine.js';
import { DailyFortuneEngine } from '../modules/daily-fortune/daily-fortune-engine.js';

let selectedZodiacKey = '자'; // 기본 쥐띠
let selectedYear: number | null = 1996;

const todayDate = new Date();
const todayPillar = DailyFortuneEngine.getDailyPillar(todayDate);

function initDdiApp() {
  // 오늘 일진 표시
  const dateTextEl = document.getElementById('ddi-today-date');
  if (dateTextEl) {
    const y = todayDate.getFullYear();
    const m = todayDate.getMonth() + 1;
    const d = todayDate.getDate();
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    dateTextEl.textContent = `${y}년 ${m}월 ${d}일 ${dayNames[todayDate.getDay()]} · ${todayPillar.lunarDateStr} · ${todayPillar.pillarName}일`;
  }

  // 1. 12간지 띠 탭 렌더링
  const tabContainer = document.getElementById('zodiac-tabs');
  if (tabContainer) {
    tabContainer.innerHTML = ZODIAC_INFOS.map(z => {
      const isSelected = z.key === selectedZodiacKey;
      return `
        <button type="button" class="btn-zodiac-tab ${isSelected ? 'active' : ''}" data-zodiac="${z.key}">
          <span class="z-animal">${z.animal}띠</span>
          <span class="z-hanja">${z.hanja}(${z.element})</span>
        </button>
      `;
    }).join('');

    tabContainer.querySelectorAll('.btn-zodiac-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        selectedZodiacKey = target.dataset.zodiac || '자';
        const zInfo = ZODIAC_INFOS.find(z => z.key === selectedZodiacKey);
        selectedYear = zInfo && zInfo.years.length > 0 ? zInfo.years[zInfo.years.length - 3] || zInfo.years[0] : null;
        renderAll();
      });
    });
  }

  renderAll();
}

function renderYearChips() {
  const yearContainer = document.getElementById('year-chips');
  if (!yearContainer) return;

  const zInfo = ZODIAC_INFOS.find(z => z.key === selectedZodiacKey);
  if (!zInfo) return;

  const curYear = todayDate.getFullYear();
  yearContainer.innerHTML = zInfo.years.map(y => {
    const isSelected = y === selectedYear;
    const age = curYear - y + 1;
    return `
      <button type="button" class="btn-year-chip ${isSelected ? 'active' : ''}" data-year="${y}">
        ${String(y).slice(2)}년생 (${age}세)
      </button>
    `;
  }).join('');

  yearContainer.querySelectorAll('.btn-year-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      selectedYear = parseInt(target.dataset.year || '1996', 10);
      renderAll();
    });
  });
}

function renderResultCard() {
  const resultCard = document.getElementById('ddi-result-card');
  if (!resultCard) return;

  const zInfo = ZODIAC_INFOS.find(z => z.key === selectedZodiacKey);
  if (!zInfo) return;

  const curYear = todayDate.getFullYear();
  const birthYear = selectedYear || zInfo.years[zInfo.years.length - 2];
  const age = curYear - birthYear + 1;

  // 엔진 호출
  const reading = dailyZodiacMagiEngine.getReading(selectedZodiacKey, birthYear);
  const { fortune, evidence } = reading;

  const isLuckyHigh = fortune.luckyRate >= 65;
  const badgeClass = isLuckyHigh ? 'badge-lucky' : fortune.magiRate >= 50 ? 'badge-caution' : 'badge-neutral';
  const badgeText = isLuckyHigh ? '대길(大吉) 상승세' : fortune.magiRate >= 50 ? '방비(防備) 주의일' : '순탄(順坦) 평온일';

  resultCard.innerHTML = `
    <div class="ddi-res-header">
      <div class="ddi-res-title-box">
        <span class="ddi-res-badge ${badgeClass}">${badgeText}</span>
        <h3>${zInfo.animal}띠 · ${birthYear}년생 (${age}세) 오늘의 운세</h3>
      </div>
      <div class="ddi-res-meta">
        오늘 일진: <b>${todayPillar.pillarName}일</b> | 본원: <b>${evidence.yearGanji}년</b> (${evidence.stemRelation})
      </div>
    </div>

    <!-- 게이지 바 (행운 vs 마기) -->
    <div class="rate-gauge-section">
      <div class="rate-numbers">
        <span class="rate-lucky">행운 지수 <b>${fortune.luckyRate}%</b></span>
        <span class="rate-magi">마기·리스크 <b>${fortune.magiRate}%</b></span>
      </div>
      <div class="gauge-bar">
        <div class="gauge-fill-lucky" style="width: ${fortune.luckyRate}%;"></div>
        <div class="gauge-fill-magi" style="width: ${fortune.magiRate}%;"></div>
      </div>
    </div>

    <!-- 운세 요약 & 행동 조언 -->
    <div class="ddi-summary-box">
      <div class="ddi-theme-pill">${fortune.theme}</div>
      <p class="ddi-main-text">${fortune.summary}</p>
      <div class="ddi-tip-row">
        <b>💡 실전 조언:</b> <span>${fortune.actionTip}</span>
      </div>
    </div>

    <!-- 길시 & 실천 키워드 그리드 -->
    <div class="ddi-meta-grid">
      <div class="meta-card">
        <span class="m-label">제1 최적 길시</span>
        <span class="m-val">${fortune.firstHour}</span>
        <span class="m-sub">${fortune.firstHourAction}</span>
      </div>
      <div class="meta-card">
        <span class="m-label">제2 보조 길시</span>
        <span class="m-val">${fortune.secondHour}</span>
        <span class="m-sub">${fortune.secondHourAction}</span>
      </div>
      <div class="meta-card">
        <span class="m-label">주의할 리스크</span>
        <span class="m-val" style="color: #fb7185;">${fortune.riskArea}</span>
        <span class="m-sub">${fortune.riskDetail}</span>
      </div>
      <div class="meta-card">
        <span class="m-label">단 하나의 방비책</span>
        <span class="m-val" style="color: #fde68a;">[${reading.defense.defenseKeyword}]</span>
        <span class="m-sub">오늘 최우선 행동 지침</span>
      </div>
    </div>
  `;
}

function renderAllZodiacOverview() {
  const container = document.getElementById('all-zodiac-overview');
  if (!container) return;

  const curYear = todayDate.getFullYear();

  container.innerHTML = ZODIAC_INFOS.map(z => {
    const isCur = z.key === selectedZodiacKey;
    const sampleYear = z.years[z.years.length - 2];
    const reading = dailyZodiacMagiEngine.getReading(z.key, sampleYear);

    return `
      <div class="z-card-mini ${isCur ? 'active' : ''}" data-zodiac="${z.key}">
        <div class="z-mini-head">
          <strong>${z.animal}띠 (${z.hanja})</strong>
          <span class="z-mini-score">${reading.fortune.luckyRate}점</span>
        </div>
        <p class="z-mini-text">${reading.fortune.summary}</p>
        <div class="z-mini-years">
          ${z.years.slice(-5).map(y => `<span>${String(y).slice(2)}년(${curYear - y + 1}세)</span>`).join(' ')}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.z-card-mini').forEach(card => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      selectedZodiacKey = target.dataset.zodiac || '자';
      const zInfo = ZODIAC_INFOS.find(z => z.key === selectedZodiacKey);
      selectedYear = zInfo ? zInfo.years[zInfo.years.length - 3] : null;
      renderAll();
      document.getElementById('ddi-interactive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderAll() {
  // 탭 상태 업데이트
  document.querySelectorAll('.btn-zodiac-tab').forEach(btn => {
    const b = btn as HTMLElement;
    b.classList.toggle('active', b.dataset.zodiac === selectedZodiacKey);
  });

  renderYearChips();
  renderResultCard();
  renderAllZodiacOverview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDdiApp);
} else {
  initDdiApp();
}
