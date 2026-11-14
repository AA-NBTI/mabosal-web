/**
 * 마보살 코드상품 마스터 레지스트리 (전수 점검 + 가나다라 자동 코드 + 10개 페이지네이션)
 * - getAllStoreProducts() 실시간 연동: 신규 추가 상품 자동 포함
 * - 사주/티어 상품(가~카 및 신규 report 상품) 전부 [웹]/[PDF] 자동 생성
 */

import { getAllStoreProducts } from '../../extensions/commerce-store/store-service.js';
import type { StoreCategoryType, StoreProduct } from '../../extensions/commerce-store/types.js';
import { appState, type AppStateData, type TierType } from '../../state/app-state.js';
import { paginateAdminList, renderAdminPagination } from '../../utils/admin-pagination.js';
import { renderUnifiedSajuGrid } from '../../components/UnifiedSajuForm.js';
import { renderPdfReportCover } from '../../components/PdfPrintCover.js';
import { renderFreeResultView } from '../../views/FreeResultView.js';
import { renderPaidResultView } from '../../views/PaidResultView.js';
import { renderConflictResultView } from '../../views/ConflictResultView.js';
import { renderPremiumResultView } from '../../views/PremiumResultView.js';
import {
  renderYear2027SingleProductView,
  renderChemistrySingleProductView,
  renderCareerSingleProductView,
  renderWealthSingleProductView,
  renderLoveReunionSingleProductView,
} from '../../views/SingleProductViews.js';

export interface CodeProductMeta {
  code: string;
  shortName: string;
  tierLabel: string;
  chapters: number | null;
  previewTier?: string;
}

const FIXED_CODE_META_BY_ID: Record<string, CodeProductMeta> = {
  'prod-free-experience': { code: '가', shortName: '무료진단', tierLabel: 'FREE', chapters: 13, previewTier: 'FREE' },
  'prod-paid-saju-premium': { code: '다', shortName: '정통심층', tierLabel: 'PAID', chapters: 18, previewTier: 'PAID' },
  'prod-saju-conflict': { code: '라', shortName: '상충마살', tierLabel: 'CONFLICT_MALSAL', chapters: 20, previewTier: 'CONFLICT_MALSAL' },
  'prod-paid-saju-vip': { code: '마', shortName: 'VIP통합', tierLabel: 'PREMIUM', chapters: 29, previewTier: 'PREMIUM' },
  'prod-report-year2027': { code: '바', shortName: '신년운세', tierLabel: 'YEAR_2027', chapters: null, previewTier: 'YEAR_2027' },
  'prod-report-career': { code: '사', shortName: '직장운세', tierLabel: 'CAREER', chapters: null, previewTier: 'CAREER' },
  'prod-report-wealth': { code: '아', shortName: '재물운세', tierLabel: 'WEALTH', chapters: null, previewTier: 'WEALTH' },
  'prod-report-relation': { code: '자', shortName: '애정운세', tierLabel: 'RELATION', chapters: null, previewTier: 'RELATION' },
  'prod-report-reunion': { code: '차', shortName: '재회운세', tierLabel: 'REUNION', chapters: null, previewTier: 'REUNION' },
  'prod-report-chemistry': { code: '카', shortName: '궁합운세', tierLabel: 'CHEMISTRY', chapters: null, previewTier: 'CHEMISTRY' },
  'prod-ebook-saju-self-guide': { code: '타', shortName: '셀프리딩(도서)', tierLabel: 'ebook', chapters: null },
  'prod-ebook-wealth': { code: '파', shortName: '재무방어(도서)', tierLabel: 'ebook', chapters: null },
  'prod-vod-career': { code: '하', shortName: '이직비책(VOD)', tierLabel: 'lecture', chapters: null },
  'prod-lecture-payment-test': { code: '거', shortName: '결제테스트(강의)', tierLabel: 'lecture', chapters: null },
  'prod-goods-amulet': { code: '너', shortName: '황동엽전(굿즈)', tierLabel: 'goods', chapters: null },
};

const EXTRA_CODE_POOL = ['더', '러', '머', '버', '서', '어', '저', '처', '커', '터', '퍼', '허'];

const CATEGORY_LABELS: Record<StoreCategoryType, string> = {
  report: '사주',
  ebook: '도서',
  lecture: '강의',
  goods: '굿즈',
};

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CodeProductRow {
  code: string;
  shortName: string;
  product: StoreProduct;
  meta: CodeProductMeta;
}

/** 전체 커머스 상품 ID -> 코드명('가','다',...,'타','파',...) 매핑 반환 */
export function getStoreProductCodeMap(): Map<string, string> {
  const storeProducts = getAllStoreProducts();
  const orderIndex = Object.keys(FIXED_CODE_META_BY_ID);
  const sorted = [...storeProducts].sort((a, b) => {
    const ia = orderIndex.indexOf(a.id);
    const ib = orderIndex.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return 0;
  });

  const codeMap = new Map<string, string>();
  let extraIdx = 0;
  for (const prod of sorted) {
    const fixed = FIXED_CODE_META_BY_ID[prod.id];
    if (fixed) {
      codeMap.set(prod.id, fixed.code);
    } else {
      codeMap.set(prod.id, EXTRA_CODE_POOL[extraIdx] || `신${extraIdx + 1}`);
      extraIdx++;
    }
  }
  return codeMap;
}

export function getAllCodeProductRows(): CodeProductRow[] {
  const storeProducts = getAllStoreProducts().filter(prod => prod.category === 'report');
  const orderIndex = Object.keys(FIXED_CODE_META_BY_ID);
  let extraIdx = 0;

  const sorted = [...storeProducts].sort((a, b) => {
    const ia = orderIndex.indexOf(a.id);
    const ib = orderIndex.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return 0;
  });

  return sorted.map(prod => {
    const fixed = FIXED_CODE_META_BY_ID[prod.id];
    if (fixed) {
      return {
        code: fixed.code,
        shortName: fixed.shortName,
        product: prod,
        meta: fixed,
      };
    }

    const autoCode = EXTRA_CODE_POOL[extraIdx] || `신${extraIdx + 1}`;
    extraIdx++;
    const resolvedTier = prod.reportTier || (prod.category === 'report' ? 'PAID' : undefined);
    return {
      code: autoCode,
      shortName: prod.title.length > 14 ? `${prod.title.slice(0, 14)}…` : prod.title,
      product: prod,
      meta: {
        code: autoCode,
        shortName: prod.title,
        tierLabel: prod.reportTier || prod.category,
        chapters: null,
        previewTier: resolvedTier,
      },
    };
  });
}

export interface CodePreviewState {
  tier: string;
  mode: 'web' | 'pdf';
}

let activeCodePreview: CodePreviewState | null = null;

export function getActiveCodePreview(): CodePreviewState | null {
  return activeCodePreview;
}

export function setActiveCodePreview(next: CodePreviewState | null): void {
  activeCodePreview = next;
}

const CORE_TIERS_WITH_BUILTIN_COVER = new Set(['FREE', 'ENTRY', 'PAID', 'CONFLICT_MALSAL', 'PREMIUM']);

export function renderResultHtmlByTier(tier: string, state: AppStateData, includeCoverForSingle: boolean = false): string {
  if (tier === 'FREE') return renderFreeResultView(state);
  if (tier === 'ENTRY' || tier === 'PAID') return renderPaidResultView(state);
  if (tier === 'CONFLICT_MALSAL') return renderConflictResultView(state);
  if (tier === 'PREMIUM') return renderPremiumResultView(state);

  let innerHtml = '';
  if (tier === 'YEAR_2027') innerHtml = renderYear2027SingleProductView(state);
  else if (tier === 'CAREER') innerHtml = renderCareerSingleProductView(state);
  else if (tier === 'WEALTH') innerHtml = renderWealthSingleProductView(state);
  else if (tier === 'RELATION' || tier === 'REUNION' || tier === 'LOVE_REUNION') innerHtml = renderLoveReunionSingleProductView(state);
  else if (tier === 'CHEMISTRY') innerHtml = renderChemistrySingleProductView(state);
  else innerHtml = renderPaidResultView(state);

  if (!includeCoverForSingle || CORE_TIERS_WITH_BUILTIN_COVER.has(tier)) {
    return innerHtml;
  }

  const sess = state.sessionState;
  const pillars = sess?.fact?.four_pillars || state.productOutputSet?.common?.pillars;
  const row = getAllCodeProductRows().find(r => r.meta.previewTier === tier);
  const coverHtml = renderPdfReportCover({
    tierLabel: `${tier} · 테마 집중 리포트`,
    reportTitle: row ? row.product.title : `${tier} 사주 리포트`,
    reportSubtitle: row?.product.description || '의뢰인의 사주 원국과 테마별 핵심 흐름을 정밀 분석한 A4 정본 감정서입니다.',
    userName: state.userName || '의뢰인',
    genderTag: state.gender === 'female' ? '坤命 · 陰' : '乾命 · 陽',
    birthSummary: `${sess?.request?.birthDate || '1993-08-15'} ${sess?.request?.birthTime || '14:30'} · ${state.calendarType === 'lunar' ? '음력' : '양력'}`,
    dayPillar: pillars ? `${pillars.day.stem}${pillars.day.branch} 일주` : '원국 분석',
    chapterCount: 8,
  });

  return `<div class="result-view-container">${coverHtml}${innerHtml}</div>`;
}

function renderCodeProductOverlay(preview: CodePreviewState, state: AppStateData): string {
  const row = getAllCodeProductRows().find(r => r.meta.previewTier === preview.tier);
  const titleLabel = row ? `[${row.code}] ${row.shortName}` : preview.tier;
  const isPdf = preview.mode === 'pdf';
  const resultHtml = renderResultHtmlByTier(preview.tier, state, isPdf);

  return `
    <div id="code-pdf-preview-modal" class="pdf-preview-backdrop">
      <div class="pdf-preview-toolbar no-print">
        <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
          <span style="padding:3px 9px;border-radius:6px;background:rgba(242,202,80,0.18);color:var(--primary);border:1px solid rgba(242,202,80,0.4);font-weight:800;font-size:0.8rem;">${escapeHtml(titleLabel)}</span>
          <div style="display:inline-flex;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.14);border-radius:8px;padding:2px;gap:2px;">
            <button type="button" class="btn-switch-code-preview-mode" data-mode="web" style="padding:4px 10px;border-radius:6px;font-size:0.76rem;font-weight:700;border:none;cursor:pointer;background:${!isPdf ? 'var(--primary)' : 'transparent'};color:${!isPdf ? '#1c1500' : '#cbd5e1'};">웹 화면</button>
            <button type="button" class="btn-switch-code-preview-mode" data-mode="pdf" style="padding:4px 10px;border-radius:6px;font-size:0.76rem;font-weight:700;border:none;cursor:pointer;background:${isPdf ? '#3b82f6' : 'transparent'};color:${isPdf ? '#ffffff' : '#cbd5e1'};">A4 PDF 포맷</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          ${isPdf ? '<button type="button" id="btn-code-pdf-print" style="padding:0.45rem 0.9rem;border-radius:8px;background:var(--primary);color:#1c1500;font-weight:800;font-size:0.8rem;border:none;cursor:pointer;">인쇄 / PDF 저장</button>' : ''}
          <button type="button" id="btn-close-code-pdf-modal" style="padding:0.45rem 0.85rem;border-radius:8px;background:rgba(255,255,255,0.1);color:#f8fafc;font-weight:700;font-size:0.8rem;border:1px solid rgba(255,255,255,0.2);cursor:pointer;">닫기</button>
        </div>
      </div>
      <div class="pdf-preview-scroll">
        <div class="${isPdf ? 'pdf-preview-sheet' : 'web-preview-sheet'}" style="${!isPdf ? 'max-width:920px;margin:0 auto;background:#0b0e17;border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:1rem;' : ''}">
          ${resultHtml}
        </div>
      </div>
    </div>
  `;
}

export function renderAdminCodeProductsPanel(): string {
  const cur = appState.getState();
  const sess = cur.sessionState;
  const pillars = sess?.fact?.four_pillars || cur.productOutputSet?.common?.pillars;
  const curName = cur.userName || '김마보';
  const curGender = cur.gender || 'female';
  const curCal = cur.calendarType || 'solar';
  const curDate = sess?.request?.birthDate || '1993-08-15';
  const isUnknownTime = sess ? sess.request?.birthTime == null : false;
  const curTime = isUnknownTime ? '' : (sess?.request?.birthTime || '14:30');

  const sajuStatusBadge = pillars
    ? `<span style="padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;background:rgba(34,197,94,0.14);color:#4ade80;border:1px solid rgba(34,197,94,0.35);white-space:nowrap;">적용: ${escapeHtml(curName)} · ${pillars.day.stem}${pillars.day.branch}일주 (${curDate} ${curTime})</span>`
    : `<span style="padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;background:rgba(248,113,113,0.14);color:#f87171;border:1px solid rgba(248,113,113,0.35);white-space:nowrap;">사주 미적용</span>`;

  const allRows = getAllCodeProductRows();
  const paged = paginateAdminList('code_products', allRows, 10);

  const coreCount = allRows.filter(r => ['FREE', 'PAID', 'CONFLICT_MALSAL', 'PREMIUM'].includes(r.meta.tierLabel)).length;
  const singleCount = allRows.length - coreCount;

  const counts = {
    total: allRows.length,
    core: coreCount,
    single: singleCount,
  };

  const rowsHtml = paged.pagedItems.map(({ code, shortName, product, meta }) => {
    const priceText = `₩${product.price.toLocaleString()}`;
    const statusBadge = product.status === 'active'
      ? '<span style="padding:2px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;background:rgba(34,197,94,0.16);color:#4ade80;border:1px solid rgba(34,197,94,0.35);">판매</span>'
      : product.status === 'soldout'
        ? '<span style="padding:2px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;background:rgba(251,191,36,0.16);color:#fbbf24;border:1px solid rgba(251,191,36,0.35);">품절</span>'
        : '<span style="padding:2px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;background:rgba(248,113,113,0.16);color:#f87171;border:1px solid rgba(248,113,113,0.35);">숨김</span>';

    const catLabel = CATEGORY_LABELS[product.category] || product.category;
    const previewBtns = meta.previewTier
      ? `
        <button type="button" class="btn-preview-code-product" data-tier="${escapeHtml(meta.previewTier)}" style="padding:4px 9px;border-radius:6px;font-size:0.74rem;font-weight:700;background:rgba(242,202,80,0.14);color:var(--primary);border:1px solid rgba(242,202,80,0.35);cursor:pointer;">웹</button>
        <button type="button" class="btn-pdf-preview-code-product" data-tier="${escapeHtml(meta.previewTier)}" style="padding:4px 9px;border-radius:6px;font-size:0.74rem;font-weight:700;background:rgba(59,130,246,0.16);color:#93c5fd;border:1px solid rgba(59,130,246,0.38);cursor:pointer;">PDF</button>
      `
      : '';

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
        <td style="padding:0.7rem 0.55rem;text-align:center;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;padding:0 5px;border-radius:8px;background:rgba(242,202,80,0.16);color:var(--primary);border:1px solid rgba(242,202,80,0.45);font-weight:800;font-size:0.88rem;">${escapeHtml(code)}</span>
        </td>
        <td style="padding:0.7rem 0.55rem;font-size:0.75rem;color:#94a3b8;white-space:nowrap;">${escapeHtml(catLabel)}</td>
        <td style="padding:0.7rem 0.55rem;">
          <div style="font-weight:700;color:#f8fafc;line-height:1.3;" title="${escapeHtml(product.title)}">${escapeHtml(shortName)}${meta.chapters ? ` <span style="font-size:0.72rem;color:#94a3b8;font-weight:500;">(${meta.chapters}ch)</span>` : ''}</div>
          <div style="font-family:monospace;font-size:0.72rem;color:#64748b;margin-top:2px;">${escapeHtml(product.id)}</div>
        </td>
        <td style="padding:0.7rem 0.55rem;font-family:monospace;font-size:0.76rem;color:var(--primary);white-space:nowrap;">${escapeHtml(meta.tierLabel)}</td>
        <td style="padding:0.7rem 0.55rem;font-weight:700;color:#e2e8f0;text-align:right;white-space:nowrap;">${priceText}</td>
        <td style="padding:0.7rem 0.55rem;text-align:center;white-space:nowrap;">${statusBadge}</td>
        <td style="padding:0.7rem 0.55rem;text-align:right;white-space:nowrap;">
          <div style="display:inline-flex;gap:0.3rem;align-items:center;">
            ${previewBtns}
            <button type="button" class="btn-edit-code-product" data-product-id="${escapeHtml(product.id)}" style="padding:4px 9px;border-radius:6px;font-size:0.74rem;font-weight:600;background:rgba(255,255,255,0.06);color:#e2e8f0;border:1px solid rgba(255,255,255,0.14);cursor:pointer;">편집</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="display:flex;flex-direction:column;gap:0.9rem;width:100%;max-width:100%;box-sizing:border-box;">
      <!-- 상단 사주 입력 바 (기본 UnifiedSajuForm 통일) -->
      <div style="background:var(--surface-container);border:1px solid rgba(242,202,80,0.28);border-radius:14px;padding:0.95rem 1.15rem;box-sizing:border-box;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.65rem;margin-bottom:0.65rem;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span style="font-size:0.88rem;font-weight:800;color:var(--primary);">테스트 사주</span>
            ${sajuStatusBadge}
          </div>
        </div>
        ${renderUnifiedSajuGrid({
          prefix: 'code',
          compact: true,
          nameField: {
            id: 'code-saju-name',
            label: '성명',
            value: curName,
            placeholder: '성명',
          },
          gender: curGender,
          birthDate: curDate,
          birthTime: curTime,
          calendarType: curCal,
          isUnknownTime,
          isLeapMonth: Boolean(cur.isLeapMonth),
          trailingActionHtml: `
            <div style="display:flex;align-items:flex-end;">
              <button type="button" id="btn-apply-code-saju" style="width:auto;min-width:76px;padding:0.4rem 0.8rem;border-radius:6px;background:var(--primary);color:#1c1500;font-weight:800;font-size:0.78rem;border:none;cursor:pointer;white-space:nowrap;">적용</button>
            </div>
          `,
        })}
      </div>

      <!-- 코드상품 전수 테이블 (10개 페이지네이션) -->
      <div style="background:var(--surface-container);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:1.15rem;box-sizing:border-box;width:100%;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.85rem;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <h2 style="font-family:var(--font-serif);font-size:1.1rem;font-weight:700;color:#dfe2f1;margin:0;">코드상품</h2>
            <span style="padding:2px 8px;border-radius:6px;font-size:0.74rem;font-weight:700;background:rgba(242,202,80,0.15);color:var(--primary);border:1px solid rgba(242,202,80,0.35);">리포트 ${counts.total}종</span>
            <span style="font-size:0.74rem;color:#94a3b8;">핵심 ${counts.core} · 단품 ${counts.single}</span>
          </div>
        </div>

        <div style="width:100%;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid rgba(242,202,80,0.28);color:#94a3b8;font-size:0.74rem;">
                <th style="padding:0.55rem;text-align:center;">코드</th>
                <th style="padding:0.55rem;">구분</th>
                <th style="padding:0.55rem;">명칭 / 상품 ID</th>
                <th style="padding:0.55rem;">티어</th>
                <th style="padding:0.55rem;text-align:right;">판매가</th>
                <th style="padding:0.55rem;text-align:center;">상태</th>
                <th style="padding:0.55rem;text-align:right;">검토</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        ${renderAdminPagination('code_products', paged.currentPage, paged.totalPages, paged.totalItems, paged.pageSize)}
      </div>

      ${activeCodePreview ? renderCodeProductOverlay(activeCodePreview, cur) : ''}
    </div>
  `;
}
