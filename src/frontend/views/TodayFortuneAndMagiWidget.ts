import { AuthService } from '../state/auth-service.js';
/**
 * [오늘의 운세 & 마기 방비] 통합 위젯
 * 
 * [완전 개편 원칙]
 * 1. 상품 상단 구조와 동일한 헤더 포맷 적용 (DAILY CELESTIAL & MAGI / 일일 천기·마기 분석 / 오늘의 운세 & 마기 방비)
 * 2. 엽전 보유 현황 및 사주 입력 유도 블록 완전 제거
 * 3. 모든 유니코드 이모티콘(이모지) 전수 제거 -> 정규 아이콘 및 텍스트 배지 대체
 * 4. 마기와 방비의 통합 -> 마기 지수가 30% 이상일 때만 방비책을 조건부 노출
 * 5. 첨부 레이아웃 준수: 좌측 설명/배지 <-> 우측 원형 도넛 게이지
 * 6. 12간지 띠(1단계) -> 출생연도(2단계) 순서 준수 (기본 미선택)
 */

import { ModuleRegistry } from '../state/module-registry.js';
import { 
  dailyZodiacMagiEngine, 
  ZODIAC_INFOS, 
  DailyReadingResult 
} from '../services/DailyZodiacMagiEngine.js';
import { DailyFortuneEngine } from '../../modules/daily-fortune/daily-fortune-engine.js';

export interface ZodiacDailyReading {
  key: string;
  hanja: string;
  animal: string;
  score: number;
  scoreLabel: string;
  fortuneSummary: string;
  firstHour: string;
  firstHourAction: string;
  secondHour: string;
  secondHourAction: string;
  magiPercent: number;
  magiType: string;
  magiTrigger: string;
  magiRisk: string;
  tabooAction: string;
}

export const ZODIAC_DAILY_DATA: Record<string, ZodiacDailyReading> = {};

// 초기 상태: 띠와 출생연도 모두 미선택(Neutral) 상태
let currentSelectedZodiac: string | undefined = undefined;
let currentSelectedYear: number | undefined = undefined;

// 카드별 펼침 상태 (기본값: 모두 닫힘)
// 카드 1: 'fortune' (오늘의 운세)
// 카드 2: 'magi_defense' (오늘의 마기 & 방비 통합)
const expandedCardState: Record<string, boolean> = {
  fortune: false,
  magi_defense: false,
};

export function toggleCardExpanded(cardKey: 'fortune' | 'magi_defense' | 'magi' | 'defense'): boolean {
  const targetKey = (cardKey === 'magi' || cardKey === 'defense') ? 'magi_defense' : cardKey;
  expandedCardState[targetKey] = !expandedCardState[targetKey];
  return expandedCardState[targetKey];
}

export function isCardExpanded(cardKey: 'fortune' | 'magi_defense' | 'magi' | 'defense'): boolean {
  const targetKey = (cardKey === 'magi' || cardKey === 'defense') ? 'magi_defense' : cardKey;
  return !!expandedCardState[targetKey];
}

export function getSelectedZodiac(): string | undefined {
  return currentSelectedZodiac;
}

export function setSelectedZodiac(zodiac: string | undefined): void {
  currentSelectedZodiac = zodiac;
}

export function getSelectedYear(): number | undefined {
  return currentSelectedYear;
}

export function setSelectedYear(year: number | undefined): void {
  currentSelectedYear = year;
}

/**
 * [첨부 이미지 형식] 원형 도넛 게이지 (오른쪽 배치용, 이모티콘 일체 미사용)
 */
function renderCircularGauge(score: number, label: string, color: string = '#f2ca50'): string {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference * (1 - clamped / 100);

  return `
  <div class="circular-donut-gauge-right" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; width: 104px; height: 104px; flex-shrink: 0;">
    <svg width="104" height="104" viewBox="0 0 104 104" style="transform: rotate(-90deg); display: block;">
      <circle 
        cx="52" cy="52" r="${r}" 
        fill="none" 
        stroke="#222736" 
        stroke-width="8" 
      />
      <circle 
        cx="52" cy="52" r="${r}" 
        fill="none" 
        stroke="${color}" 
        stroke-width="8" 
        stroke-dasharray="${circumference.toFixed(2)}" 
        stroke-dashoffset="${offset.toFixed(2)}" 
        stroke-linecap="round" 
        style="transition: stroke-dashoffset 0.8s ease;"
      />
    </svg>
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
      <span style="font-size: 1.65rem; font-weight: 900; color: ${color}; line-height: 1; letter-spacing: -0.02em;">${clamped}</span>
      <span style="font-size: 0.72rem; font-weight: 700; color: #dfe2f1; margin-top: 4px; letter-spacing: 0.02em;">${label}</span>
    </div>
  </div>
  `;
}

/**
 * [오늘의 운세 전용] 선택 전: 대길 띠 및 대박 연도 추천 브리핑 (이모티콘 완전 배제)
 */
function renderLuckyRecommendationBriefing(): string {
  const lucky = (dailyZodiacMagiEngine as any).getDailyLuckySummary ? 
    (dailyZodiacMagiEngine as any).getDailyLuckySummary() : {
      todayGanjiLabel: '병신(丙申)',
      luckyZodiac: { animal: '쥐', hanja: '子', reason: '신자진 수국 삼합 - 재물과 귀인 조력', years: [1972, 1984, 1996, 2008] },
      subLuckyZodiac: { animal: '용', hanja: '辰', years: [1976, 1988, 2000] },
      message: '오늘 일진은 삼합과 육합의 기운이 모여 성과와 귀인의 기회가 열려 있습니다.',
    };

  const luckyYearsStr = lucky.luckyZodiac.years.map((y: number) => `${y}년생`).join(', ');
  const subYearsStr = lucky.subLuckyZodiac.years.map((y: number) => `${y}년생`).join(', ');

  return `
  <div class="today-fortune-lucky-briefing" style="background: rgba(20, 24, 35, 0.85); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1.15rem; margin-top: 0.9rem;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; padding-bottom: 0.65rem; border-bottom: 1px solid rgba(242, 202, 80, 0.2); flex-wrap: wrap; gap: 0.4rem;">
      <div style="display: inline-flex; align-items: center; gap: 0.45rem; color: var(--primary); font-size: 0.88rem; font-weight: 800;">
        <span class="material-symbols-outlined" style="font-size: 20px;">stars</span>
        <span>[오늘의 대길 운세 추천] 특히 기운이 좋은 띠와 대박 연도</span>
      </div>
      <div style="font-size: 0.75rem; color: #ffffff; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(242, 202, 80, 0.3); padding: 0.2rem 0.65rem; border-radius: 9999px; font-weight: 700;">
        오늘 일진: ${lucky.todayGanjiLabel}
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.95rem;">
      <div style="background: rgba(242, 202, 80, 0.08); border-left: 3.5px solid var(--primary); border-radius: 0 8px 8px 0; padding: 0.75rem 0.9rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem;">
          <span style="font-size: 0.86rem; font-weight: 800; color: #ffffff;">
            [1순위 대길 띠] <strong style="color: var(--primary);">${lucky.luckyZodiac.animal}띠(${lucky.luckyZodiac.hanja})</strong>
          </span>
          <span style="font-size: 0.72rem; color: var(--primary); background: rgba(0,0,0,0.4); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">합(合)의 조화</span>
        </div>
        <div style="font-size: 0.8rem; color: #ffffff; line-height: 1.55;">
          • <strong style="color: var(--primary);">대표 대박 출생연도:</strong> ${luckyYearsStr}
        </div>
        <div style="font-size: 0.76rem; color: #dfe2f1; margin-top: 0.25rem;">
          협상이나 계약이 순조롭게 체결되고, 귀인의 조력으로 실질적인 재물과 성과의 기회가 열립니다.
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border-left: 3.5px solid rgba(242, 202, 80, 0.5); border-radius: 0 8px 8px 0; padding: 0.75rem 0.9rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem;">
          <span style="font-size: 0.86rem; font-weight: 800; color: #ffffff;">
            [2순위 협력 띠] <strong style="color: var(--primary);">${lucky.subLuckyZodiac.animal}띠(${lucky.subLuckyZodiac.hanja})</strong>
          </span>
          <span style="font-size: 0.72rem; color: #dfe2f1; background: rgba(0,0,0,0.4); padding: 0.15rem 0.5rem; border-radius: 4px;">조력과 결실</span>
        </div>
        <div style="font-size: 0.8rem; color: #ffffff; line-height: 1.55;">
          • <strong style="color: var(--primary);">대표 추진 출생연도:</strong> ${subYearsStr}
        </div>
      </div>
    </div>

    <div style="background: rgba(0, 0, 0, 0.4); border-radius: 8px; padding: 0.75rem 0.9rem; text-align: center; border: 1px dashed rgba(242, 202, 80, 0.25);">
      <p style="font-size: 0.82rem; color: #ffffff; margin: 0; line-height: 1.55;">
        위의 <strong>[1. 12간지 띠]</strong>와 <strong>[2. 출생연도]</strong>를 선택하시면<br>
        <span style="color: var(--primary); font-weight: 700;">귀하의 1:1 맞춤형 행운지수와 성과 비결, 제1·제2 길시</span>를 즉시 확인하실 수 있습니다.
      </p>
    </div>
  </div>
  `;
}

/**
 * [오늘의 마기 & 방비 전용] 선택 전: 요주의 띠 및 연도 경고 브리핑 (이모티콘 완전 배제)
 */
function renderCautionWarningBriefing(): string {
  const caution = (dailyZodiacMagiEngine as any).getDailyCautionSummary ? 
    (dailyZodiacMagiEngine as any).getDailyCautionSummary() : {
      todayGanjiLabel: '병신(丙申)',
      cautionZodiac: { animal: '호랑이', hanja: '寅', reason: '인신충(寅申沖) - 역마와 금목의 격돌', years: [1962, 1974, 1986, 1998] },
      secondaryCautionZodiac: { animal: '뱀', hanja: '巳', reason: '인사신(寅巳申) 삼형 - 관재구설과 계약 위기', years: [1965, 1977, 1989, 2001] },
      warningMessage: '오늘 일진은 상충과 삼형의 기운이 지배적이므로 충돌과 돌발 행동을 경계해야 합니다.',
    };

  const cautionYearsStr = caution.cautionZodiac.years.map((y: number) => `${y}년생`).join(', ');
  const secondaryYearsStr = caution.secondaryCautionZodiac.years.map((y: number) => `${y}년생`).join(', ');

  return `
  <div class="today-magi-caution-briefing" style="background: rgba(20, 24, 35, 0.85); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1.15rem; margin-top: 0.9rem;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; padding-bottom: 0.65rem; border-bottom: 1px solid rgba(242, 202, 80, 0.2); flex-wrap: wrap; gap: 0.4rem;">
      <div style="display: inline-flex; align-items: center; gap: 0.45rem; color: var(--primary); font-size: 0.88rem; font-weight: 800;">
        <span class="material-symbols-outlined" style="font-size: 20px;">warning</span>
        <span>[오늘의 마기 경보] 특히 조심해야 할 띠와 요주의 연도</span>
      </div>
      <div style="font-size: 0.75rem; color: #ffffff; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(242, 202, 80, 0.3); padding: 0.2rem 0.65rem; border-radius: 9999px; font-weight: 700;">
        오늘 일진: ${caution.todayGanjiLabel}
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.95rem;">
      <div style="background: rgba(242, 202, 80, 0.08); border-left: 3.5px solid var(--primary); border-radius: 0 8px 8px 0; padding: 0.75rem 0.9rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem;">
          <span style="font-size: 0.86rem; font-weight: 800; color: #ffffff;">
            [1순위 요주의 띠] <strong style="color: var(--primary);">${caution.cautionZodiac.animal}띠(${caution.cautionZodiac.hanja})</strong>
          </span>
          <span style="font-size: 0.72rem; color: #dfe2f1; background: rgba(0,0,0,0.4); padding: 0.15rem 0.5rem; border-radius: 4px;">${caution.cautionZodiac.reason.split('-')[0].trim()}</span>
        </div>
        <div style="font-size: 0.8rem; color: #ffffff; line-height: 1.55;">
          • <strong style="color: var(--primary);">특히 조심할 출생연도:</strong> ${cautionYearsStr}
        </div>
        <div style="font-size: 0.76rem; color: #dfe2f1; margin-top: 0.25rem;">
          감정적인 언쟁, 이동 중 돌발 사고, 성급한 금전 결정을 각별히 경계해야 합니다.
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border-left: 3.5px solid rgba(242, 202, 80, 0.5); border-radius: 0 8px 8px 0; padding: 0.75rem 0.9rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem;">
          <span style="font-size: 0.86rem; font-weight: 800; color: #ffffff;">
            [2순위 경계 띠] <strong style="color: var(--primary);">${caution.secondaryCautionZodiac.animal}띠(${caution.secondaryCautionZodiac.hanja})</strong>
          </span>
          <span style="font-size: 0.72rem; color: #dfe2f1; background: rgba(0,0,0,0.4); padding: 0.15rem 0.5rem; border-radius: 4px;">${caution.secondaryCautionZodiac.reason.split('-')[0].trim()}</span>
        </div>
        <div style="font-size: 0.8rem; color: #ffffff; line-height: 1.55;">
          • <strong style="color: var(--primary);">특히 조심할 출생연도:</strong> ${secondaryYearsStr}
        </div>
      </div>
    </div>

    <div style="background: rgba(0, 0, 0, 0.4); border-radius: 8px; padding: 0.75rem 0.9rem; text-align: center; border: 1px dashed rgba(242, 202, 80, 0.25);">
      <p style="font-size: 0.82rem; color: #ffffff; margin: 0; line-height: 1.55;">
        위의 <strong>[1. 12간지 띠]</strong>와 <strong>[2. 출생연도]</strong>를 선택하시면<br>
        <span style="color: var(--primary); font-weight: 700;">귀하의 1:1 맞춤형 마기지수와 위험 트리거, 그리고 필요 시 실전 방비책</span>을 즉시 확인하실 수 있습니다.
      </p>
    </div>
  </div>
  `;
}

/**
 * 띠 먼저 선택(1단계) -> 출생연도 선택(2단계)
 */
function renderInternalZodiacPicker(cardKey: string, currentKey?: string, selectedYear?: number): string {
  const years = currentKey ? dailyZodiacMagiEngine.getYearsForZodiac(currentKey) : [];

  return `
  <div class="internal-zodiac-picker" style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 12px; padding: 0.95rem; margin-bottom: 1rem;">
    
    <!-- [1단계] 12간지 띠 선택 (상단) -->
    <div style="margin-bottom: 0.85rem;">
      <div style="font-size: 0.76rem; color: var(--primary); font-weight: 800; margin-bottom: 0.45rem; display: flex; align-items: center; justify-content: space-between;">
        <span style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 15px;">pets</span>
          <span>1. 12간지 띠를 먼저 선택하세요</span>
        </span>
        <span style="font-size: 0.7rem; color: #dfe2f1; font-weight: 500;">
          ${currentKey ? `선택됨: ${ZODIAC_INFOS.find(z => z.key === currentKey)?.animal || currentKey}띠` : '미선택 (아래 띠 클릭)'}
        </span>
      </div>

      <div class="zodiac-chips-container" style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
        ${ZODIAC_INFOS.map(z => {
          const isSelected = !!currentKey && z.key === currentKey;
          return `
          <button 
            type="button" 
            class="zodiac-tab-chip ${isSelected ? 'active' : ''}" 
            data-zodiac="${z.key}"
            style="display: inline-flex; align-items: center; justify-content: center; text-align: center; padding: 0.35rem 0.65rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; background: ${isSelected ? 'rgba(242,202,80,0.22)' : 'rgba(255,255,255,0.03)'}; color: ${isSelected ? 'var(--primary)' : '#ffffff'}; min-height: 32px;"
          >
            <span>${z.animal}(${z.hanja})</span>
          </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 구분선 -->
    <div style="border-top: 1px dashed rgba(255,255,255,0.1); margin: 0.75rem 0;"></div>

    <!-- [2단계] 출생연도 선택 (하단) -->
    <div>
      <div style="font-size: 0.76rem; color: var(--primary); font-weight: 800; margin-bottom: 0.45rem; display: flex; align-items: center; justify-content: space-between;">
        <span style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 15px;">calendar_month</span>
          <span>2. 출생연도를 선택하세요</span>
        </span>
        <span style="font-size: 0.7rem; color: #dfe2f1; font-weight: 500;">
          ${selectedYear ? `선택됨: ${selectedYear}년생` : (currentKey ? '연도를 클릭하세요' : '띠를 먼저 선택해 주세요')}
        </span>
      </div>

      <div class="zodiac-years-container" style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
        ${!currentKey ? `
          <div style="font-size: 0.75rem; color: var(--text-muted); padding: 0.3rem 0;">
            위에서 띠를 선택하시면 해당 띠의 전체 출생연도(8세~100세)가 나타납니다.
          </div>
        ` : years.map(y => {
          const isSelected = selectedYear === y;
          return `
          <button 
            type="button" 
            class="zodiac-year-chip ${isSelected ? 'active' : ''}" 
            data-year="${y}"
            style="display: inline-flex; align-items: center; justify-content: center; text-align: center; padding: 0.28rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; background: ${isSelected ? 'rgba(242,202,80,0.22)' : 'rgba(255,255,255,0.03)'}; color: ${isSelected ? 'var(--primary)' : '#ffffff'};"
          >
            ${y}년생
          </button>
          `;
        }).join('')}
      </div>
    </div>
  </div>
  `;
}

/**
 * 01. 오늘의 운세 카드
 * - [좌측: 배지 + 제목 + 설명] <-> [우측: 원형 도넛 게이지]
 */
export function renderTodayFortuneWidget(zodiacKey?: string, birthYear?: number): string {
  const isExpanded = isCardExpanded('fortune');
  const headerSummary = '오늘 나의 운세는 어떨까?';
  const hasSelected = !!zodiacKey && !!birthYear;

  let reading: DailyReadingResult | null = null;
  if (hasSelected && zodiacKey) {
    reading = dailyZodiacMagiEngine.getReading(zodiacKey, birthYear);
  }

  return `
  <div class="today-accordion-item today-fortune-card" data-card-key="fortune" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
    <div 
      class="today-card-header-toggle" 
      data-toggle-card="fortune" 
      style="padding: 1.1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; gap: 0.75rem; background: ${isExpanded ? 'rgba(242, 202, 80, 0.08)' : 'transparent'}; border-bottom: ${isExpanded ? '1px solid rgba(242, 202, 80, 0.2)' : 'none'};"
    >
      <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 160px; flex-shrink: 0;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.35); display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">auto_awesome</span>
        </div>
        <div>
          <h3 style="font-size: 1rem; font-weight: 800; color: #ffffff; margin: 0;">오늘의 운세</h3>
        </div>
      </div>

      <div style="flex: 1; min-width: 0; padding: 0 0.5rem;">
        <span style="font-size: 0.84rem; color: #ffffff; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
          ${headerSummary}
        </span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0;">
        <button type="button" class="btn-toggle-accordion" style="background: none; border: none; color: var(--primary); font-size: 0.82rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.2rem; padding: 0;">
          <span>${isExpanded ? '닫기' : '열기'}</span>
          <span class="material-symbols-outlined" style="font-size: 18px; transition: transform 0.2s ease; transform: ${isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};">
            keyboard_arrow_down
          </span>
        </button>
      </div>
    </div>

    ${isExpanded ? `
    <div class="today-card-content" style="padding: 1.15rem;">
      ${renderInternalZodiacPicker('fortune', zodiacKey, birthYear)}

      ${!reading ? renderLuckyRecommendationBriefing() : `
      
      <!-- 첨부 레이아웃: 좌측 설명 <-> 우측 도넛 게이지 -->
      <div style="background: rgba(20, 24, 35, 0.85); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1.2rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <div style="margin-bottom: 0.45rem;">
            <span style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-size: 0.74rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px;">
              <span class="material-symbols-outlined" style="font-size: 14px;">auto_awesome</span>
              <span>대길의 기운</span>
            </span>
          </div>
          <h4 style="font-size: 1.08rem; font-weight: 900; color: #ffffff; margin: 0 0 0.5rem 0; line-height: 1.4;">
            ${reading.info.animal}띠 ${birthYear ? `${birthYear}년생` : ''} — ${reading.fortune.opportunityArea}의 호조
          </h4>
          <p style="font-size: 0.86rem; color: #dfe2f1; line-height: 1.6; margin: 0;">
            ${reading.fortune.summary}
          </p>
        </div>

        <div style="display: flex; align-items: center; justify-content: center;">
          ${renderCircularGauge(reading.fortune.luckyRate, '행운지수', '#f2ca50')}
        </div>
      </div>

      <!-- 명리 팩트 근거 -->
      <div style="background: rgba(242, 202, 80, 0.08); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.4rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--primary); font-weight: 800; letter-spacing: 0.04em;">
            <span class="material-symbols-outlined" style="font-size: 17px;">fact_check</span>
            <span>명리 팩트 근거 (Fact Evidence)</span>
          </div>
          <div style="font-size: 0.75rem; color: #ffffff; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 600;">
            ${reading.evidence?.yearGanji || ''} × ${reading.evidence?.todayGanji || ''}
          </div>
        </div>
        <div style="font-size: 0.82rem; color: #ffffff; line-height: 1.65; display: flex; flex-direction: column; gap: 0.35rem;">
          <div>• <strong style="color: var(--primary);">천간 작용:</strong> ${reading.evidence?.stemRelation || ''}</div>
          <div>• <strong style="color: var(--primary);">지지 결속:</strong> ${reading.evidence?.branchRelation || ''}</div>
          <div style="color: #dfe2f1; font-size: 0.76rem; margin-top: 0.15rem; line-height: 1.5;">• <strong>역학 원리:</strong> ${reading.evidence?.coreMechanic || ''}</div>
        </div>
      </div>

      <!-- 세부 길시 안내 -->
      <div style="background: rgba(0, 0, 0, 0.35); border-radius: 8px; padding: 0.75rem 0.95rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #ffffff; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">schedule</span>
            제1 길시 (${reading.fortune.firstHour})
          </span>
          <span style="color: var(--primary); font-weight: 700;">${reading.fortune.firstHourAction}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 0.4rem;">
          <span style="color: #ffffff; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">schedule</span>
            제2 길시 (${reading.fortune.secondHour})
          </span>
          <span style="color: var(--primary); font-weight: 700;">${reading.fortune.secondHourAction}</span>
        </div>
      </div>
      `}
    </div>
    ` : ''}
  </div>
  `;
}

/**
 * 02. [통합 카드] 오늘의 마기 & 방비
 * - 마기가 확인되고 30% 이상일 때만 방비책을 조건부 노출!
 * - 30% 미만일 때는 평온한 상태임을 명시하고 방비책은 숨김 처리
 */
export function renderTodayMagiAndDefenseWidget(zodiacKey?: string, birthYear?: number): string {
  const isExpanded = isCardExpanded('magi_defense');
  const headerSummary = '오늘의 마기 위험과 명리적 영향은?';
  const hasSelected = !!zodiacKey && !!birthYear;

  let reading: DailyReadingResult | null = null;
  if (hasSelected && zodiacKey) {
    reading = dailyZodiacMagiEngine.getReading(zodiacKey, birthYear);
  }

  // 마기 수준 판별: 30% 이상일 때만 방비책 노출
  const isMagiHigh = reading ? (reading.magi.magiRate >= 30) : false;

  return `
  <div class="today-accordion-item today-magi-defense-card" data-card-key="magi_defense" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
    <div 
      class="today-card-header-toggle" 
      data-toggle-card="magi_defense" 
      style="padding: 1.1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; gap: 0.75rem; background: ${isExpanded ? 'rgba(242, 202, 80, 0.08)' : 'transparent'}; border-bottom: ${isExpanded ? '1px solid rgba(242, 202, 80, 0.2)' : 'none'};"
    >
      <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 160px; flex-shrink: 0;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.35); display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">shield</span>
        </div>
        <div>
          <h3 style="font-size: 1rem; font-weight: 800; color: #ffffff; margin: 0;">오늘의 마기</h3>
        </div>
      </div>

      <div style="flex: 1; min-width: 0; padding: 0 0.5rem;">
        <span style="font-size: 0.84rem; color: #ffffff; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
          ${headerSummary}
        </span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0;">
        <button type="button" class="btn-toggle-accordion" style="background: none; border: none; color: var(--primary); font-size: 0.82rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.2rem; padding: 0;">
          <span>${isExpanded ? '닫기' : '열기'}</span>
          <span class="material-symbols-outlined" style="font-size: 18px; transition: transform 0.2s ease; transform: ${isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};">
            keyboard_arrow_down
          </span>
        </button>
      </div>
    </div>

    ${isExpanded ? `
    <div class="today-card-content" style="padding: 1.15rem;">
      ${renderInternalZodiacPicker('magi_defense', zodiacKey, birthYear)}

      ${!reading ? renderCautionWarningBriefing() : `

      <!-- 1. 마기 진단: 좌측 설명 <-> 우측 도넛 게이지 -->
      <div style="background: rgba(20, 24, 35, 0.85); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1.2rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <div style="margin-bottom: 0.45rem;">
            <span style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.4); color: var(--primary); font-size: 0.74rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px;">
              <span class="material-symbols-outlined" style="font-size: 14px;">warning</span>
              <span>마기 진단 레벨</span>
            </span>
          </div>
          <h4 style="font-size: 1.08rem; font-weight: 900; color: #ffffff; margin: 0 0 0.5rem 0; line-height: 1.4;">
            ${reading.info.animal}띠 ${birthYear ? `${birthYear}년생` : ''} — ${reading.magi.name}
          </h4>
          <p style="font-size: 0.86rem; color: #dfe2f1; line-height: 1.6; margin: 0 0 0.5rem 0;">
            • <strong>발생 원인:</strong> ${reading.magi.trigger}
          </p>
          <div style="background: rgba(242, 202, 80, 0.08); border-left: 3px solid var(--primary); padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0; font-size: 0.82rem; color: #ffffff;">
            <strong>주의할 리스크:</strong> ${reading.magi.risk}
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: center;">
          ${renderCircularGauge(reading.magi.magiRate, '마기지수', '#f2ca50')}
        </div>
      </div>

      <!-- 2. 조건부 방비책 노출 영역: 마기가 30% 이상일 때만 방비책 노출 -->
      ${isMagiHigh ? `
      <!-- [실전 방비 비책] -->
      <div style="margin-bottom: 1rem; background: rgba(0, 0, 0, 0.45); border: 1.5px solid var(--primary); border-radius: 12px; padding: 1.15rem; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; color: var(--primary); font-weight: 800; margin-bottom: 0.45rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">shield</span>
          <span>마기 감지: 맞춤 실전 방비 비책</span>
        </div>
        <div style="margin: 0.25rem 0 0.75rem 0;">
          <div style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(242, 202, 80, 0.2); border: 1.5px solid var(--primary); color: #ffffff; padding: 0.45rem 1.25rem; border-radius: 9999px; font-size: 1.25rem; font-weight: 900; letter-spacing: 0.05em; box-shadow: 0 0 16px rgba(242, 202, 80, 0.25);">
            <span class="material-symbols-outlined" style="color: var(--primary); font-size: 24px;">key</span>
            <span>실전 방비: ${reading.defense.defenseKeyword}</span>
          </div>
        </div>
        <div style="font-size: 0.84rem; color: #ffffff; line-height: 1.6; text-align: left; background: rgba(255,255,255,0.03); padding: 0.75rem 0.95rem; border-radius: 8px;">
          • <strong>실천 행동:</strong> ${reading.defense.actionStrategy}<br>
          • <strong style="color: var(--primary);">오늘 절대 피할 금기:</strong> ${reading.defense.coreTaboo}<br>
          • <strong>보완 기운:</strong> 방어 소품(${reading.defense.shieldItem}) · 행운 색상(${reading.defense.fortuneColor})
        </div>
      </div>
      ` : `
      <!-- 마기가 낮고 평온한 날 -->
      <div style="background: rgba(20, 24, 35, 0.6); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.82rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.65rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">task_alt</span>
        <span>
          <strong>[안정]</strong> 오늘의 마기 기운이 매우 미약하여 별도의 방비책이 필요하지 않습니다. 평소의 기조대로 순탄하게 일상을 보내시면 됩니다.
        </span>
      </div>
      `}

      <!-- 3. 명리 팩트 근거 -->
      <div style="background: rgba(242, 202, 80, 0.08); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 12px; padding: 1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.4rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--primary); font-weight: 800; letter-spacing: 0.04em;">
            <span class="material-symbols-outlined" style="font-size: 17px;">warning</span>
            <span>마기 발생 역학 근거 (Fact Evidence)</span>
          </div>
          <div style="font-size: 0.75rem; color: #ffffff; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 600;">
            ${reading.evidence?.yearGanji || ''} × ${reading.evidence?.todayGanji || ''}
          </div>
        </div>
        <div style="font-size: 0.82rem; color: #ffffff; line-height: 1.65;">
          <div>• <strong style="color: var(--primary);">지지 충·형·파·해:</strong> ${reading.evidence?.branchRelation || ''}</div>
          <div style="color: #dfe2f1; font-size: 0.76rem; margin-top: 0.2rem; line-height: 1.5;">• <strong>마기 원리:</strong> ${reading.magi.mechanicEvidence}</div>
        </div>
      </div>
      `}
    </div>
    ` : ''}
  </div>
  `;
}

/**
 * 대분류 표준 규격 포맷을 적용한 오늘의 운세 & 마기 방비 섹션
 * - 첨부된 상품 상단 구조와 100% 동일한 디자인 적용
 */
export function renderTodayFortuneAndMagiWidget(
  selectedZodiac: string | undefined = currentSelectedZodiac,
  selectedYear: number | undefined = currentSelectedYear
): string {
  currentSelectedZodiac = selectedZodiac;
  currentSelectedYear = selectedYear;

  const now = new Date();
  const solarDateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${['일','월','화','수','목','금','토'][now.getDay()]})`;
  
  const pillar = DailyFortuneEngine.getDailyPillar(now);
  const lunarMonth = now.getMonth();
  const lunarDay = now.getDate();
  const lunarDateStr = `음력 ${lunarMonth}월 ${lunarDay}일`;
  const pillarStr = `${pillar.stem}${pillar.branch}일`;

  return `
  <section class="today-integrated-card" style="margin-bottom: 2.5rem; width: 100%; box-sizing: border-box;">
    
    <!-- 첨부 파일과 100% 일치하는 상품 상단 규격 헤더 구조 -->
    <div class="today-section-header" style="margin-bottom: 1.25rem;">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 0.45rem;">
        <div style="font-size: 0.78rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.06em;">
          DAILY CELESTIAL & MAGI
        </div>
        <div style="font-size: 0.84rem; color: var(--primary); font-weight: 700; background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.3); padding: 0.2rem 0.65rem; border-radius: 9999px; display: inline-flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">calendar_today</span>
          ${solarDateStr} · ${lunarDateStr}
        </div>
      </div>
      <h2 style="font-size: 1.65rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.02em;">
        오늘의 운세
      </h2>
    </div>

    <!-- 2단 카드 아코디언 목록 (1: 오늘의 운세, 2: 오늘의 마기 & 방비 통합) -->
    <div class="today-accordions-wrapper" style="display: flex; flex-direction: column; gap: 0.95rem;">
      ${renderTodayFortuneWidget(currentSelectedZodiac, currentSelectedYear)}
      ${renderTodayMagiAndDefenseWidget(currentSelectedZodiac, currentSelectedYear)}
    </div>
  </section>
  `;
}
