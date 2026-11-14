import { KOREA_REGIONS } from '../../modules/calendar/korea-timezone.js';

export type UnifiedSajuPrefix = 'onboarding' | 'analyze' | 'profile' | 'la';

export interface UnifiedSajuRegionOption {
  value: string;
  label: string;
}

export interface UnifiedSajuNameFieldOption {
  id: string;
  label?: string;
  value?: string;
  placeholder?: string;
}

export interface UnifiedSajuFormOptions {
  prefix: UnifiedSajuPrefix;
  gender?: 'male' | 'female';
  /** YYYYMMDD 또는 YYYY-MM-DD */
  birthDate?: string;
  birthTime?: string;
  calendarType?: 'solar' | 'lunar';
  birthRegion?: string;
  isUnknownTime?: boolean;
  isLeapMonth?: boolean;
  /** 지역 선택 표시 여부 (기본 false: 국내 표준시 통합) */
  showRegion?: boolean;
  /** 백세인생 등 관리자용 초간결 1줄 컴팩트 모드 */
  compact?: boolean;
  /** 지정 시 1행에 [이름 | 생년월일(8자리)] 나란히 배치 */
  nameField?: UnifiedSajuNameFieldOption;
  /** 지역 옵션 커스터마이즈 (showRegion=true일 때 사용) */
  regionOptions?: UnifiedSajuRegionOption[];
  /** 그리드 마지막 칸(compact) 또는 하단에 배치할 액션 버튼 HTML */
  trailingActionHtml?: string;
}

export interface ParsedUnifiedSajuInput {
  ok: true;
  year: number;
  month: number;
  day: number;
  birthDate: string;
  birthTime: string | null;
  isUnknownTime: boolean;
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  gender: 'male' | 'female';
  birthRegion: string;
}

export interface ParsedUnifiedSajuError {
  ok: false;
  message: string;
}

const SIJIN_PRESETS: Array<{ value: string; label: string }> = [
  { value: '00:30', label: '자시 (23:30~01:29)' },
  { value: '02:30', label: '축시 (01:30~03:29)' },
  { value: '04:30', label: '인시 (03:30~05:29)' },
  { value: '06:30', label: '묘시 (05:30~07:29)' },
  { value: '08:30', label: '진시 (07:30~09:29)' },
  { value: '10:30', label: '사시 (09:30~11:29)' },
  { value: '12:30', label: '오시 (11:30~13:29)' },
  { value: '14:30', label: '미시 (13:30~15:29)' },
  { value: '16:30', label: '신시 (15:30~17:29)' },
  { value: '18:30', label: '유시 (17:30~19:29)' },
  { value: '20:30', label: '술시 (19:30~21:29)' },
  { value: '22:30', label: '해시 (21:30~23:29)' },
];

export function getUnifiedFieldIds(prefix: UnifiedSajuPrefix) {
  if (prefix === 'analyze') {
    return {
      gender: 'analyze-gender',
      birthDate: 'input-birth-date',
      time: 'input-birth-time',
      timePreset: 'analyze-time-preset',
      calendar: 'analyze-calendar',
      region: 'select-region',
      missingHour: 'check-missing-hour',
      leapMonth: 'check-leap-month',
      leapWrap: 'group-leap-month',
    };
  }
  return {
    gender: `${prefix}-gender`,
    birthDate: `${prefix}-birthdate`,
    time: `${prefix}-time-input`,
    timePreset: `${prefix}-time-preset`,
    calendar: `${prefix}-calendar`,
    region: `${prefix}-region`,
    missingHour: `${prefix}-missing-hour`,
    leapMonth: `${prefix}-leap-month`,
    leapWrap: `${prefix}-leap-month-wrap`,
  };
}

const INPUT_STYLE =
  'width: 100%; box-sizing: border-box; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.48rem 0.55rem; color: #fff; font-size: 0.84rem;';
const COMPACT_INPUT_STYLE =
  'width: 100%; box-sizing: border-box; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.36rem 0.45rem; color: #fff; font-size: 0.78rem;';
const LABEL_STYLE =
  'display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 700;';

/**
 * 공통 사주 입력 UI
 * - 일반/모달/프로필:
 *   1행: 이름 · 생년월일(8자리)
 *   2행: 성별 · 양력/음력 (옵션 showRegion 시 지역 포함)
 *   3행: 출생시간 (시간대 선택 + 직접입력) · 출생시간 모름 · 음력 윤달
 * - compact(백세인생): 1줄 간결 그리드 + 작은 입력/버튼 폭
 */
export function renderUnifiedSajuGrid(opts: UnifiedSajuFormOptions): string {
  const {
    prefix,
    gender = 'female',
    birthDate = '',
    birthTime = '',
    calendarType = 'solar',
    birthRegion = '서울',
    isUnknownTime = false,
    isLeapMonth = false,
    showRegion = false,
    compact = false,
    nameField,
    regionOptions,
    trailingActionHtml = '',
  } = opts;

  const ids = getUnifiedFieldIds(prefix);
  const cleanBirth = birthDate ? birthDate.replace(/[^0-9]/g, '').slice(0, 8) : '';
  const inputStyle = compact ? COMPACT_INPUT_STYLE : INPUT_STYLE;
  const matchedPreset = !isUnknownTime && SIJIN_PRESETS.some((p) => p.value === birthTime) ? birthTime : 'direct';

  if (compact) {
    return `
      <div aria-label="생년월일 및 출생 정보" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); gap: 0.5rem; align-items: flex-end;">
        <div>
          <label for="${ids.birthDate}" style="${LABEL_STYLE}">생년월일 (8자리)</label>
          <input type="text" id="${ids.birthDate}" class="unified-saju-birthdate-input" value="${cleanBirth}" maxlength="10" inputmode="numeric" placeholder="19980412" autocomplete="off" style="${inputStyle}" />
        </div>
        <div>
          <label for="${ids.gender}" style="${LABEL_STYLE}">성별</label>
          <select id="${ids.gender}" style="${inputStyle}">
            <option value="female" ${gender === 'female' ? 'selected' : ''}>여성</option>
            <option value="male" ${gender === 'male' ? 'selected' : ''}>남성</option>
          </select>
        </div>
        <div>
          <label for="${ids.time}" style="${LABEL_STYLE}">출생시간</label>
          <input type="text" id="${ids.time}" class="unified-saju-time-input" data-prefix="${prefix}" maxlength="5" value="${isUnknownTime ? '' : birthTime}" placeholder="09:20" autocomplete="off" ${isUnknownTime ? 'disabled' : ''} style="${inputStyle}" />
        </div>
        <div>
          <label for="${ids.calendar}" style="${LABEL_STYLE}">양력/음력</label>
          <select id="${ids.calendar}" class="unified-saju-calendar" data-prefix="${prefix}" style="${inputStyle}">
            <option value="solar" ${calendarType === 'solar' ? 'selected' : ''}>양력</option>
            <option value="lunar" ${calendarType === 'lunar' ? 'selected' : ''}>음력</option>
          </select>
        </div>
        ${trailingActionHtml}
      </div>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.85rem; margin-top: 0.5rem;">
        <label style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.74rem; color: #cbd5e1; cursor: pointer;">
          <input type="checkbox" id="${ids.missingHour}" class="unified-saju-missing-hour" data-prefix="${prefix}" ${isUnknownTime ? 'checked' : ''} />
          <span>출생시간 모름</span>
        </label>
        <div id="${ids.leapWrap}" style="display: inline-flex;">
          <label style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.74rem; color: #cbd5e1; cursor: pointer;">
            <input type="checkbox" id="${ids.leapMonth}" class="unified-saju-leap-month" data-prefix="${prefix}" ${isLeapMonth ? 'checked' : ''} />
            <span>음력 윤달</span>
          </label>
        </div>
      </div>
    `;
  }

  const regions: UnifiedSajuRegionOption[] =
    regionOptions ||
    Object.keys(KOREA_REGIONS).map((name) => ({ value: name, label: name }));

  const birthDateFieldHtml = `
    <div>
      <label for="${ids.birthDate}" style="${LABEL_STYLE}">생년월일 (8자리) <span style="color: #f87171;">*</span></label>
      <input type="text" id="${ids.birthDate}" class="unified-saju-birthdate-input" value="${cleanBirth}" maxlength="10" inputmode="numeric" placeholder="예: 19900321" autocomplete="off" style="${inputStyle}" />
    </div>
  `;

  const row1Html = nameField
    ? `
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; align-items: flex-end; margin-bottom: 0.75rem;">
        <div>
          <label for="${nameField.id}" style="${LABEL_STYLE}">${nameField.label || '이름 *'}</label>
          <input type="text" id="${nameField.id}" value="${nameField.value || ''}" placeholder="${nameField.placeholder || '예: 홍길동'}" autocomplete="name" style="${inputStyle}" />
        </div>
        ${birthDateFieldHtml}
      </div>
    `
    : `<div style="margin-bottom: 0.75rem;">${birthDateFieldHtml}</div>`;

  const row2Cols = showRegion ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))';

  return `
    <div aria-label="생년월일 및 출생 정보">
      ${row1Html}

      <div style="display: grid; grid-template-columns: ${row2Cols}; gap: 0.65rem; align-items: flex-end;">
        <div>
          <label for="${ids.gender}" style="${LABEL_STYLE}">성별 <span style="color: #f87171;">*</span></label>
          <select id="${ids.gender}" style="${inputStyle}">
            <option value="female" ${gender === 'female' ? 'selected' : ''}>여성</option>
            <option value="male" ${gender === 'male' ? 'selected' : ''}>남성</option>
          </select>
        </div>
        <div>
          <label for="${ids.calendar}" style="${LABEL_STYLE}">양력/음력 <span style="color: #f87171;">*</span></label>
          <select id="${ids.calendar}" class="unified-saju-calendar" data-prefix="${prefix}" style="${inputStyle}">
            <option value="solar" ${calendarType === 'solar' ? 'selected' : ''}>양력</option>
            <option value="lunar" ${calendarType === 'lunar' ? 'selected' : ''}>음력</option>
          </select>
        </div>
        ${showRegion ? `
          <div>
            <label for="${ids.region}" style="${LABEL_STYLE}">출생 지역</label>
            <select id="${ids.region}" style="${inputStyle}">
              ${regions.map((r) => `
                <option value="${r.value}" ${r.value === birthRegion || r.label === birthRegion ? 'selected' : ''}>${r.label}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      <div style="margin-top: 0.75rem;">
        <label for="${ids.time}" style="${LABEL_STYLE}">출생시간</label>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; align-items: center;">
          <input type="text" id="${ids.time}" class="unified-saju-time-input" data-prefix="${prefix}" maxlength="5" value="${isUnknownTime ? '' : birthTime}" placeholder="예: 09:20" autocomplete="off" ${isUnknownTime ? 'disabled' : ''} style="${inputStyle}" />
          <select id="${ids.timePreset}" class="unified-saju-time-preset" data-prefix="${prefix}" ${isUnknownTime ? 'disabled' : ''} style="${inputStyle}">
            <option value="direct" ${matchedPreset === 'direct' ? 'selected' : ''}>시간선택</option>
            ${SIJIN_PRESETS.map((p) => `
              <option value="${p.value}" ${matchedPreset === p.value ? 'selected' : ''}>${p.label}</option>
            `).join('')}
          </select>
        </div>
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.95rem; margin-top: 0.55rem;">
          <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #cbd5e1; cursor: pointer;">
            <input type="checkbox" id="${ids.missingHour}" class="unified-saju-missing-hour" data-prefix="${prefix}" ${isUnknownTime ? 'checked' : ''} />
            <span>출생시간 모름</span>
          </label>
          <div id="${ids.leapWrap}" style="display: inline-flex;">
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="${ids.leapMonth}" class="unified-saju-leap-month" data-prefix="${prefix}" ${isLeapMonth ? 'checked' : ''} />
              <span>음력 윤달</span>
            </label>
          </div>
        </div>
      </div>
      ${trailingActionHtml ? `<div style="margin-top: 0.75rem;">${trailingActionHtml}</div>` : ''}
    </div>
  `;
}

/**
 * 공통 사주 입력 폼 DOM 값을 읽어 단일 규칙으로 검증·정규화합니다.
 */
export function parseUnifiedSajuForm(prefix: UnifiedSajuPrefix): ParsedUnifiedSajuInput | ParsedUnifiedSajuError {
  const ids = getUnifiedFieldIds(prefix);
  const rawDate = (document.getElementById(ids.birthDate) as HTMLInputElement | null)?.value?.trim() || '';
  let cleanDate = rawDate.replace(/[^0-9]/g, '');

  if (cleanDate.length === 6) {
    const yy = parseInt(cleanDate.slice(0, 2), 10);
    const currentYearTwoDigits = new Date().getFullYear() % 100;
    const century = yy <= currentYearTwoDigits ? '20' : '19';
    cleanDate = `${century}${cleanDate}`;
  }

  if (cleanDate.length !== 8) {
    return { ok: false, message: '생년월일 8자리(예: 19900321)를 정확히 입력해 주세요.' };
  }

  const yearVal = parseInt(cleanDate.slice(0, 4), 10);
  const monthVal = parseInt(cleanDate.slice(4, 6), 10);
  const dayVal = parseInt(cleanDate.slice(6, 8), 10);

  if (
    isNaN(yearVal) ||
    isNaN(monthVal) ||
    isNaN(dayVal) ||
    yearVal < 1900 ||
    yearVal > 2100 ||
    monthVal < 1 ||
    monthVal > 12 ||
    dayVal < 1 ||
    dayVal > 31
  ) {
    return { ok: false, message: '올바른 생년월일(1900~2100년, 1~12월, 1~31일)을 입력해 주세요.' };
  }

  const birthDate = `${yearVal}-${String(monthVal).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
  const isUnknownTime = Boolean((document.getElementById(ids.missingHour) as HTMLInputElement | null)?.checked);
  const rawTime = (document.getElementById(ids.time) as HTMLInputElement | null)?.value?.trim() || '';

  let birthTime: string | null = null;
  if (!isUnknownTime && rawTime) {
    const cleanTime = rawTime.replace(/[^0-9:]/g, '');
    let h = 0;
    let min = 0;
    if (cleanTime.includes(':')) {
      const parts = cleanTime.split(':');
      h = parseInt(parts[0], 10);
      min = parseInt(parts[1] || '0', 10);
    } else if (cleanTime.length === 4) {
      h = parseInt(cleanTime.slice(0, 2), 10);
      min = parseInt(cleanTime.slice(2, 4), 10);
    } else {
      h = parseInt(cleanTime, 10);
    }

    if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
      return { ok: false, message: '출생시간을 24시간 기준(예: 09:20 또는 0920)으로 입력해 주세요.' };
    }
    birthTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const gVal = (document.getElementById(ids.gender) as HTMLSelectElement | null)?.value;
  const gender: 'male' | 'female' = gVal === 'male' ? 'male' : 'female';

  const cVal = (document.getElementById(ids.calendar) as HTMLSelectElement | null)?.value;
  const calendarType: 'solar' | 'lunar' = cVal === 'lunar' ? 'lunar' : 'solar';

  const isLeapMonth =
    calendarType === 'lunar' &&
    Boolean((document.getElementById(ids.leapMonth) as HTMLInputElement | null)?.checked);

  const birthRegion =
    (document.getElementById(ids.region) as HTMLSelectElement | null)?.value || '서울';

  return {
    ok: true,
    year: yearVal,
    month: monthVal,
    day: dayVal,
    birthDate,
    birthTime,
    isUnknownTime,
    calendarType,
    isLeapMonth,
    gender,
    birthRegion,
  };
}
