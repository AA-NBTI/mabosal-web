import { ModuleRegistry } from '../state/module-registry.js';
/**
 * 마보살 공통 재사용 컴포넌트 모듈 (Stitch 테마 기반)
 * 1. 4주 8자 만세력 미니 원국 카드 (Trust Anchor)
 * 2. 900원 참 프라이싱 최종 결제 모달
 * 3. 마보살 파트너스 프로모션 배너
 */

const STEM_HANJA: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
  기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
};

const BRANCH_HANJA: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
  오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
};

export interface MiniPillarsData {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour?: { stem: string; branch: string } | null;
  dayMasterDesc?: string;
}

// 12지지별 지장간 한자 테이블
const HIDDEN_STEMS_MAP: Record<string, string> = {
  자: '壬 癸',
  축: '癸 辛 己',
  인: '戊 丙 甲',
  묘: '甲 乙',
  진: '乙 癸 戊',
  사: '戊 庚 丙',
  오: '丙 己 丁',
  미: '丁 乙 己',
  신: '戊 壬 庚',
  유: '庚 辛',
  술: '辛 丁 戊',
  해: '戊 甲 壬',
};

// 천간/지지별 오행 색상 스타일 클래스 및 텍스트 매핑
function getStemTileStyle(stem: string): { bg: string; color: string; desc: string } {
  // 사주 원국 배경 컬러 제거 -> 기본 컬러 투명 표면 및 고대비 화이트 적용
  const descMap: Record<string, string> = {
    갑: '갑 (양목)', 을: '을 (음목)', 병: '병 (양화)', 정: '정 (음화)',
    무: '무 (양토)', 기: '기 (음토)', 경: '경 (양금)', 신: '신 (음금)',
    임: '임 (양수)', 계: '계 (음수)'
  };
  return {
    bg: 'rgba(255, 255, 255, 0.03)',
    color: '#ffffff',
    desc: descMap[stem] || stem
  };
}

function getBranchTileStyle(branch: string): { bg: string; color: string; desc: string } {
  switch (branch) {
    case '인': return { bg: 'rgba(242, 202, 80, 0.12)', color: '#f2ca50', desc: '인 (양목)' };
    case '묘': return { bg: 'rgba(242, 202, 80, 0.12)', color: '#f2ca50', desc: '묘 (음목)' };
    case '사': return { bg: 'rgba(255, 180, 171, 0.15)', color: '#ffb4ab', desc: '사 (음화)' };
    case '오': return { bg: 'rgba(255, 180, 171, 0.15)', color: '#ffb4ab', desc: '오 (양화)' };
    case '진': return { bg: 'rgba(242, 202, 80, 0.16)', color: '#f2ca50', desc: '진 (양토)' };
    case '술': return { bg: 'rgba(242, 202, 80, 0.16)', color: '#f2ca50', desc: '술 (양토)' };
    case '축': return { bg: 'rgba(242, 202, 80, 0.16)', color: '#f2ca50', desc: '축 (음토)' };
    case '미': return { bg: 'rgba(242, 202, 80, 0.16)', color: '#f2ca50', desc: '미 (음토)' };
    case '신': return { bg: 'rgba(218, 226, 250, 0.12)', color: '#bec6dd', desc: '신 (양금)' };
    case '유': return { bg: 'rgba(218, 226, 250, 0.12)', color: '#bec6dd', desc: '유 (음금)' };
    case '해': return { bg: 'rgba(45, 195, 225, 0.15)', color: '#acedff', desc: '해 (음수)' };
    case '자': return { bg: 'rgba(45, 195, 225, 0.15)', color: '#acedff', desc: '자 (양수)' };
    default: return { bg: 'rgba(255, 255, 255, 0.05)', color: '#dfe2f1', desc: branch };
  }
}

/**
 * 1. 천명원(Stitch _5) 정통 사주팔자(四柱八字) 원국표 & 천문 태극 엠블럼 컴포넌트
 */
export function renderMiniSajuPillarsCard(pillars: MiniPillarsData): string {
  const yStemH = STEM_HANJA[pillars.year.stem] || pillars.year.stem;
  const yBranchH = BRANCH_HANJA[pillars.year.branch] || pillars.year.branch;
  const mStemH = STEM_HANJA[pillars.month.stem] || pillars.month.stem;
  const mBranchH = BRANCH_HANJA[pillars.month.branch] || pillars.month.branch;
  const dStemH = STEM_HANJA[pillars.day.stem] || pillars.day.stem;
  const dBranchH = BRANCH_HANJA[pillars.day.branch] || pillars.day.branch;
  const hStemH = pillars.hour ? (STEM_HANJA[pillars.hour.stem] || pillars.hour.stem) : '辛';
  const hBranchH = pillars.hour ? (BRANCH_HANJA[pillars.hour.branch] || pillars.hour.branch) : '未';

  const yStemStyle = getStemTileStyle(pillars.year.stem);
  const yBranchStyle = getBranchTileStyle(pillars.year.branch);
  const mStemStyle = getStemTileStyle(pillars.month.stem);
  const mBranchStyle = getBranchTileStyle(pillars.month.branch);
  const dStemStyle = getStemTileStyle(pillars.day.stem);
  const dBranchStyle = getBranchTileStyle(pillars.day.branch);
  const hStemStyle = pillars.hour ? getStemTileStyle(pillars.hour.stem) : getStemTileStyle('신');
  const hBranchStyle = pillars.hour ? getBranchTileStyle(pillars.hour.branch) : getBranchTileStyle('미');

  const kanjiSummary = `${yStemH}${yBranchH}年 ${mStemH}${mBranchH}月 ${dStemH}${dBranchH}日 ${hStemH}${hBranchH}時`;
  const dayDesc = pillars.dayMasterDesc || `${pillars.day.stem}토(土) 일원 (현실적 판단과 내실의 기운)`;

  return `
    <div class="mini-pillars-card cheonmyeongwon-wonkook-wrapper" style="width: 100%; max-width: 480px; margin: 0 auto 1.75rem;">
      <!-- Celestial Emblem & Astrological Header (천명원 _5 태극 천문 엠블럼) -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; margin-bottom: 1.25rem;">
        <div style="position: absolute; top: -1rem; width: 12rem; height: 12rem; border-radius: 9999px; background: rgba(242, 202, 80, 0.08); filter: blur(36px); pointer-events: none;"></div>
        
        <!-- Yin-Yang Celestial Astrolabe Badge matching brand logo -->
        <div style="width: 76px; height: 76px; position: relative; display: flex; align-items: center; justify-content: center; border-radius: 9999px; background: #0a0e18; box-shadow: 0 10px 28px rgba(0,0,0,0.6); padding: 4px; margin-bottom: 0.65rem; border: 1px solid rgba(242, 202, 80, 0.35);">
          <svg style="width: 100%; height: 100%; color: var(--primary);" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" opacity="0.7" r="46" stroke="currentColor" stroke-width="1.8"></circle>
            <circle cx="50" cy="50" fill="none" opacity="0.45" r="41" stroke="currentColor" stroke-dasharray="2 3" stroke-width="0.75"></circle>
            <!-- Outer Celestial Markers -->
            <circle cx="50" cy="6" r="1.5"></circle>
            <circle cx="94" cy="50" r="1.5"></circle>
            <circle cx="50" cy="94" r="1.5"></circle>
            <circle cx="6" cy="50" r="1.5"></circle>
            <!-- Flowing Taiji S-curve -->
            <path d="M 50 10 A 20 20 0 0 1 50 50 A 20 20 0 0 0 50 90 A 40 40 0 0 1 50 10 Z" fill="currentColor" fill-opacity="0.22"></path>
            <path d="M 50 10 A 20 20 0 0 1 50 50 A 20 20 0 0 0 50 90 A 40 40 0 0 0 50 10 Z" fill="none" stroke="currentColor" stroke-width="1.2"></path>
            <!-- Yin-Yang Celestial Orbs -->
            <circle cx="50" cy="30" fill="currentColor" opacity="0.9" r="4.5"></circle>
            <circle cx="50" cy="70" fill="none" r="4.5" stroke="currentColor" stroke-width="1.5"></circle>
            <!-- Starry Constellation Nodes -->
            <circle cx="36" cy="38" opacity="0.75" r="1"></circle>
            <circle cx="30" cy="48" opacity="0.75" r="1"></circle>
            <circle cx="65" cy="55" opacity="0.75" r="1"></circle>
            <circle cx="72" cy="68" opacity="0.75" r="1"></circle>
          </svg>
        </div>

        <div style="display: flex; align-items: center; gap: 0.35rem; color: var(--primary);">
          <span style="font-family: var(--font-display); font-size: 0.68rem; letter-spacing: 0.16em; font-weight: 700; text-transform: uppercase;">THE FOUR PILLARS OF DESTINY</span>
        </div>
        <h2 style="font-family: var(--font-serif); font-size: 1.35rem; font-weight: 700; color: #dfe2f1; margin: 0.25rem 0 0.15rem 0; letter-spacing: -0.01em;">정통 사주팔자(四柱八字) 원국</h2>
        <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">생년월일시의 우주적 기운과 오행 균형도</p>
      </div>

      <!-- Four Pillars Matrix Section (사주원국표) -->
      <section style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 16px; padding: 1.15rem; box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
        <!-- 상단 헤더 & 간지 요약 -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.65rem; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">calendar_view_week</span>
            <span style="font-size: 0.95rem; font-weight: 700; color: #dfe2f1;">사주원국표</span>
          </div>
          <span style="font-family: var(--font-serif); font-size: 0.76rem; color: rgba(242, 202, 80, 0.9); font-weight: 600;">${kanjiSummary}</span>
        </div>

        <!-- 4열 헤더: 시주 | 일주(本) | 월주 | 년주 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.5rem;">
          <div style="background: var(--surface-container-low); padding: 0.4rem 0.2rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">시주</div>
            <div style="font-family: var(--font-serif); font-size: 0.65rem; color: var(--text-muted);">時柱</div>
          </div>
          <div style="background: var(--surface-container-highest); padding: 0.4rem 0.2rem; border-radius: 6px; border: 1px solid rgba(242, 202, 80, 0.4); box-shadow: 0 0 10px rgba(242, 202, 80, 0.15);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">일주</span>
              <span class="pulse-node" style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary); display: inline-block;"></span>
            </div>
            <div style="font-family: var(--font-serif); font-size: 0.65rem; color: rgba(242, 202, 80, 0.9); font-weight: 600;">日柱(本)</div>
          </div>
          <div style="background: var(--surface-container-low); padding: 0.4rem 0.2rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
            <div style="font-size: 0.85rem; font-weight: 700; color: #dfe2f1;">월주</div>
            <div style="font-family: var(--font-serif); font-size: 0.65rem; color: var(--text-muted);">月柱</div>
          </div>
          <div style="background: var(--surface-container-low); padding: 0.4rem 0.2rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
            <div style="font-size: 0.85rem; font-weight: 700; color: #dfe2f1;">년주</div>
            <div style="font-family: var(--font-serif); font-size: 0.65rem; color: var(--text-muted);">年柱</div>
          </div>
        </div>

        <!-- 천간 십신(十神) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.5rem; font-size: 0.72rem;">
          <div style="background: var(--surface-container-low); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--text-secondary);">정관 (正官)</div>
          <div style="background: rgba(242, 202, 80, 0.15); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--primary); font-weight: 700;">일원 (我)</div>
          <div style="background: var(--surface-container-low); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--text-secondary);">편관 (七殺)</div>
          <div style="background: var(--surface-container-low); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--text-secondary);">정인 (正印)</div>
        </div>

        <!-- 천간(天干) 글자 타일 매트릭스 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.5rem;">
          <!-- 시주 천간 -->
          <div style="background: ${hStemStyle.bg}; border: 1px solid rgba(255,255,255,0.06); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${hStemStyle.color}; line-height: 1.1;">${hStemH}</span>
            <span style="font-size: 0.7rem; color: ${hStemStyle.color}; opacity: 0.9; margin-top: 0.25rem;">${hStemStyle.desc}</span>
          </div>
          <!-- 일주 천간 (나/本) -->
          <div style="background: ${dStemStyle.bg}; border: 1.5px solid var(--primary); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(242, 202, 80, 0.25);">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${dStemStyle.color}; line-height: 1.1;">${dStemH}</span>
            <span style="font-size: 0.7rem; color: ${dStemStyle.color}; font-weight: 700; margin-top: 0.25rem;">${dStemStyle.desc}</span>
          </div>
          <!-- 월주 천간 -->
          <div style="background: ${mStemStyle.bg}; border: 1px solid rgba(255,255,255,0.06); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${mStemStyle.color}; line-height: 1.1;">${mStemH}</span>
            <span style="font-size: 0.7rem; color: ${mStemStyle.color}; opacity: 0.9; margin-top: 0.25rem;">${mStemStyle.desc}</span>
          </div>
          <!-- 년주 천간 -->
          <div style="background: ${yStemStyle.bg}; border: 1px solid rgba(255,255,255,0.06); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${yStemStyle.color}; line-height: 1.1;">${yStemH}</span>
            <span style="font-size: 0.7rem; color: ${yStemStyle.color}; opacity: 0.9; margin-top: 0.25rem;">${yStemStyle.desc}</span>
          </div>
        </div>

        <!-- 지지(地支) 글자 타일 매트릭스 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.5rem;">
          <!-- 시주 지지 -->
          <div style="background: ${hBranchStyle.bg}; border: 1px solid rgba(255,255,255,0.06); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${hBranchStyle.color}; line-height: 1.1;">${hBranchH}</span>
            <span style="font-size: 0.7rem; color: ${hBranchStyle.color}; opacity: 0.9; margin-top: 0.25rem;">${hBranchStyle.desc}</span>
          </div>
          <!-- 일주 지지 -->
          <div style="background: ${dBranchStyle.bg}; border: 1.5px solid rgba(242, 202, 80, 0.5); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(242, 202, 80, 0.15);">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${dBranchStyle.color}; line-height: 1.1;">${dBranchH}</span>
            <span style="font-size: 0.7rem; color: ${dBranchStyle.color}; font-weight: 700; margin-top: 0.25rem;">${dBranchStyle.desc}</span>
          </div>
          <!-- 월주 지지 -->
          <div style="background: ${mBranchStyle.bg}; border: 1px solid rgba(255,255,255,0.06); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${mBranchStyle.color}; line-height: 1.1;">${mBranchH}</span>
            <span style="font-size: 0.7rem; color: ${mBranchStyle.color}; opacity: 0.9; margin-top: 0.25rem;">${mBranchStyle.desc}</span>
          </div>
          <!-- 년주 지지 -->
          <div style="background: ${yBranchStyle.bg}; border: 1px solid rgba(255,255,255,0.06); padding: 0.85rem 0.25rem; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; color: ${yBranchStyle.color}; line-height: 1.1;">${yBranchH}</span>
            <span style="font-size: 0.7rem; color: ${yBranchStyle.color}; opacity: 0.9; margin-top: 0.25rem;">${yBranchStyle.desc}</span>
          </div>
        </div>

        <!-- 지지 십신(十神) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 0.4rem; font-size: 0.72rem;">
          <div style="background: var(--surface-container-low); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--text-secondary);">정재 (正財)</div>
          <div style="background: rgba(242, 202, 80, 0.15); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--primary); font-weight: 700;">편재 (偏財)</div>
          <div style="background: var(--surface-container-low); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--text-secondary);">편관 (七殺)</div>
          <div style="background: var(--surface-container-low); padding: 0.3rem 0.1rem; border-radius: 4px; color: var(--text-secondary);">정관 (正官)</div>
        </div>

        <!-- 지장간(Hidden Stems 支藏干) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; font-size: 0.7rem;">
          <div style="background: var(--surface-container-lowest); padding: 0.25rem 0.1rem; border-radius: 4px; color: var(--text-muted); font-family: var(--font-serif);">${HIDDEN_STEMS_MAP[pillars.hour?.branch || '미'] || '丁 乙 己'}</div>
          <div style="background: var(--surface-container-lowest); padding: 0.25rem 0.1rem; border-radius: 4px; color: var(--text-muted); font-family: var(--font-serif);">${HIDDEN_STEMS_MAP[pillars.day.branch] || '乙 癸 戊'}</div>
          <div style="background: var(--surface-container-lowest); padding: 0.25rem 0.1rem; border-radius: 4px; color: var(--text-muted); font-family: var(--font-serif);">${HIDDEN_STEMS_MAP[pillars.month.branch] || '戊 壬 庚'}</div>
          <div style="background: var(--surface-container-lowest); padding: 0.25rem 0.1rem; border-radius: 4px; color: var(--text-muted); font-family: var(--font-serif);">${HIDDEN_STEMS_MAP[pillars.year.branch] || '庚 辛'}</div>
        </div>
      </section>
    </div>
  `;
}

/**
 * 2. 900원 참 프라이싱 최종 결제 모달 (주문서 바텀시트 / 모달)
 */
export interface CheckoutModalOptions {
  productTitle: string;
  originalPrice: number;
  finalPrice900: number; // e.g. 19900, 29900, 39900
  yeopDiscount?: number; // e.g. 3000
  tierId: string;
}

export function renderCharmPricingCheckoutModal(options: CheckoutModalOptions): string {
  const discount = options.yeopDiscount || 0;
  const payAmount = options.finalPrice900 - discount;

  return `
    <div class="modal-overlay" id="modal-checkout-overlay" style="position: fixed; inset: 0; z-index: 1000; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center;">
      <div class="modal-card" style="background: #171b26; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 24px 24px 0 0; width: 100%; max-width: 540px; padding: 1.75rem 1.5rem 2rem; box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.9); animation: slideUp 0.25s ease-out;">
        <!-- 상단 헤더 & 닫기 -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">lock</span>
            <h3 style="font-family: var(--font-serif); font-size: 1.22rem; font-weight: 700; color: #fff; margin: 0;">주문서 및 안전 결제</h3>
          </div>
          <button type="button" id="btn-close-checkout-modal" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center;">
            <span class="material-symbols-outlined" style="font-size: 22px;">close</span>
          </button>
        </div>

        <!-- 상품 요약 -->
        <div style="background: var(--surface-container); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; margin-bottom: 0.25rem; letter-spacing: 0.05em;">신청 상품</div>
          <div style="font-size: 1.15rem; font-weight: 700; color: #fff;">${options.productTitle}</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.25rem;">천명원 원천 명리 팩트 기반 맞춤 감정서 즉시 열람 및 영구 보관</div>
        </div>

        <!-- 가격 정산 내역 (900원 참 프라이싱) -->
        <div style="background: var(--surface-container-lowest); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.15rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.55rem; font-size: 0.92rem;">
          <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
            <span>정상가</span>
            <span style="text-decoration: line-through;">${options.originalPrice.toLocaleString()}원</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--primary);">
            <span>천명원 런칭 특별 혜택</span>
            <span>-${(options.originalPrice - options.finalPrice900).toLocaleString()}원</span>
          </div>
          ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #50c878; align-items: center;">
              <span style="display: inline-flex; align-items: center; gap: 0.25rem;">
                <span class="material-symbols-outlined" style="font-size: 14px;">monetization_on</span> 엽전 포인트 차감 할인
              </span>
              <span>-${discount.toLocaleString()}원</span>
            </div>
          ` : ''}
          <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.4rem; padding-top: 0.65rem; display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-weight: 700; font-size: 1.02rem; color: #fff;">최종 결제 금액</span>
            <span style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--primary);">
              ${payAmount.toLocaleString()}<span style="font-size: 1rem; font-weight: 600;">원</span>
            </span>
          </div>
        </div>

        <!-- 결제 수단 선택 버튼 -->
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          <button type="button" class="btn-submit-payment" data-tier="${options.tierId}" data-amount="${payAmount}" style="width: 100%; padding: 0.95rem; border-radius: 10px; border: none; background: var(--primary); color: #241a00; font-size: 1.05rem; font-weight: 800; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 0.45rem; box-shadow: 0 4px 15px rgba(242, 202, 80, 0.35);">
            <span class="material-symbols-outlined" style="font-size: 20px;">credit_card</span>
            ${payAmount.toLocaleString()}원 간편 결제하기
          </button>
          <div style="text-align: center; font-size: 0.74rem; color: var(--text-muted); margin-top: 0.25rem;">
            안전한 128비트 암호화 결제 · 결제 즉시 전체 결과지가 자동으로 해제됩니다.
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 3. 마보살 파트너스 프로모션 배너 (결과지 하단 배치)
 */
export function renderAffiliatePromoBanner(): string {
  // [요청 3 반영]: 최고 관리자에서 파트너스 기능이 꺼져 있으면 배너 완전 미노출
  if (!ModuleRegistry.isEnabled('feature_dock_partner')) {
    return '';
  }

  return `
    <div class="affiliate-promo-banner" style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 14px; padding: 1.35rem 1.5rem; margin: 2rem 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
      <div style="max-width: 580px;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">handshake</span> 마보살 파트너스 안내
        </div>
        <div style="font-family: var(--font-serif); font-size: 1.08rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem;">
          친구에게 추천하고 결제 금액의 30%를 현금으로 돌려받으세요!
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
          사주 유튜버, 블로거가 아니어도 누구나 1초 만에 전용 추천 링크를 발급받을 수 있습니다.
        </div>
      </div>
      <button type="button" class="btn-cta-secondary" id="btn-goto-partner-portal" style="padding: 0.65rem 1.35rem; font-size: 0.88rem; font-weight: 700; white-space: nowrap; border-radius: 8px;">
        파트너스 시작하기 →
      </button>
    </div>
  `;
}
