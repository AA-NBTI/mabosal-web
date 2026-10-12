/**
 * src/modules/product-output/blocks.ts
 *
 * Phase 83: 출력 블록/섹션 빌더 + 고객 노출 텍스트 정제
 *
 * - 템플릿은 "구조"만 정의한다. 값은 항상 공통 결과 데이터에서 읽는다.
 * - 값이 없으면 블록을 missing 으로 표시한다 (임의 문장 생성 금지).
 * - 엔진 텍스트에 섞인 내부 코드(JOB, MONEY 등)는 고객용 한글로 치환한다.
 */

import type {
  FactRow,
  JudgmentType,
  OptionBlockItem,
  OutputBlock,
  OutputEvidence,
  OutputSection,
  ScoreEntry,
  SectionCoverage,
} from './types.js';
import {
  createEvidence,
  regulateJudgmentTone,
  sanitizeHallucinatedFacts,
  sanitizeHealthStatements,
} from './evidence-tracker.js';

// ============================================================================
// 1. 고객 노출 텍스트 정제
// ============================================================================
export const DOMAIN_KO: Record<string, string> = {
  JOB: '직장',
  MONEY: '재물',
  BUSINESS: '사업',
  LOVE: '연애',
  MARRIAGE: '결혼·가정',
  RELATIONSHIP: '인간관계',
  HEALTH: '건강',
  LIFE: '일반 생활',
};

export const LOCATION_KO: Record<string, string> = {
  year: '년주',
  month: '월주',
  day: '일주',
  hour: '시주',
};

/** 고객 화면에 나오면 안 되는 내부 용어 (테스트에서도 사용) */
export const INTERNAL_TERM_PATTERNS: RegExp[] = [
  /CORE_ORIGINAL/, /TEN_GODS/, /\bGEOKGUK\b/, /\bSTRENGTH\b/, /\bEOKBU\b/, /\bJOHU\b/,
  /\bRELATION\b/, /\bSINSAL\b/, /\bDAEWUN\b/, /\bSEUN\b/, /MAGA_DIAGNOSIS/, /\bPRESCRIPTION\b/,
  /\b(JOB|MONEY|BUSINESS|LOVE|MARRIAGE|RELATIONSHIP|HEALTH|LIFE)\b/,
  /모듈/, /\bModule\b/i, /\bFact\b/, /ruleId/, /\bMaSignal\b/, /\bMa\(/, /\bRSI\b/,
  /undefined/, /\bNaN\b/, /\[object/, /\bAI\b/,
];

/** 엔진 문자열을 고객 노출용으로 정제한다. 비어 있으면 '' */
export function cx(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value).replace(/\r/g, '').trim();
  if (!s) return '';
  // 1. 도메인 영문 코드 한글화
  s = s.replace(/\b(JOB|MONEY|BUSINESS|LOVE|MARRIAGE|RELATIONSHIP|HEALTH|LIFE)\b/g, (m) => DOMAIN_KO[m] || m);
  // 2. 내부 개발/모듈 용어 고객 친화적 치환
  s = s.replace(/\[([^\]]+)\s*모듈\]/g, '$1');
  s = s.replace(/\[([^\]]+)\]/g, '$1');
  s = s.replace(/\s*모듈\b/g, '');
  s = s.replace(/모듈/g, '분석');
  s = s.replace(/\bmodule\b/gi, '');
  s = s.replace(/\bAI\b/g, '정통 명리');
  s = s.replace(/\bFact\b/g, '근거');
  s = s.replace(/\bruleId\b/g, '규칙');
  s = s.replace(/\bMaSignal\b/g, '마살 징후');
  s = s.replace(/\bMa\(/g, '마살(');
  s = s.replace(/\bRSI\b/g, '흐름 지수');

  // 3. Phase 84: 판단 강도 제어, 건강 표현 제한, 허위 사실 필터링
  s = regulateJudgmentTone(s);
  s = sanitizeHealthStatements(s);
  s = sanitizeHallucinatedFacts(s);

  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function domainKo(code: string | undefined | null): string {
  if (!code) return '';
  return DOMAIN_KO[code] || cx(code);
}

export function locKo(loc: string): string {
  return LOCATION_KO[loc] || cx(loc);
}

export function nonEmpty(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(cx).filter(Boolean);
}

export function parseModulesFromSource(source: string): string[] {
  const matches = source.match(/[A-Z0-9_]{3,}/g) || [];
  if (matches.length === 0 && source && source.trim()) {
    const firstPart = source.split('.')[0]?.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
    return [firstPart || 'CORE_SYSTEM'];
  }
  return Array.from(new Set(matches));
}

// ============================================================================
// 2. 블록 빌더
// ============================================================================
const MISSING_DEFAULT = '현재 엔진 결과에 해당 정보가 없어 표시하지 않습니다.';

export function missingBlock(
  type: OutputBlock['type'],
  label: string,
  source: string,
  reason: string = MISSING_DEFAULT
): OutputBlock {
  return { type, label, missing: true, missingReason: reason, source };
}

export function textBlock(
  label: string,
  value: unknown,
  source: string,
  reason?: string,
  judgmentType: JudgmentType = 'interpretation',
  confidence: 'high' | 'medium' | 'low' = 'high'
): OutputBlock {
  const t = cx(value);
  if (!t) return missingBlock('text', label, source, reason);
  const evidence = createEvidence({
    statement: t,
    judgmentType,
    evidenceModules: parseModulesFromSource(source),
    sourceFields: [source],
    confidence,
  });
  return { type: 'text', label, text: t, source, evidence };
}

export function listBlock(
  label: string,
  items: unknown,
  source: string,
  limit?: number,
  reason?: string,
  judgmentType: JudgmentType = 'interpretation'
): OutputBlock {
  let list = nonEmpty(items);
  if (limit !== undefined) list = list.slice(0, limit);
  if (!list.length) return missingBlock('list', label, source, reason);

  const evidence = createEvidence({
    statement: list.join('; '),
    judgmentType,
    evidenceModules: parseModulesFromSource(source),
    sourceFields: [source],
  });
  return { type: 'list', label, items: list, source, evidence };
}

export function factsBlock(
  label: string,
  rows: Array<{ label: string; value: unknown }>,
  source: string,
  reason?: string,
  judgmentType: JudgmentType = 'fact'
): OutputBlock {
  const clean: FactRow[] = rows
    .map((r) => ({ label: r.label, value: cx(r.value) }))
    .filter((r) => r.value !== '');
  if (!clean.length) return missingBlock('facts', label, source, reason);

  const evidence = createEvidence({
    statement: clean.map((c) => `${c.label}: ${c.value}`).join(', '),
    judgmentType,
    evidenceModules: parseModulesFromSource(source),
    sourceFields: [source],
  });
  return { type: 'facts', label, rows: clean, source, evidence };
}

export function tableBlock(
  label: string,
  headers: string[],
  rows: unknown[][],
  source: string,
  reason?: string,
  judgmentType: JudgmentType = 'interpretation'
): OutputBlock {
  const clean = rows.map((r) => r.map((c) => cx(c) || '—'));
  if (!clean.length) return missingBlock('table', label, source, reason);

  const evidence = createEvidence({
    statement: `Table(${headers.join('|')} x ${clean.length} rows)`,
    judgmentType,
    evidenceModules: parseModulesFromSource(source),
    sourceFields: [source],
  });
  return { type: 'table', label, table: { headers, rows: clean }, source, evidence };
}

export function scoresBlock(label: string, entries: ScoreEntry[], source: string): OutputBlock {
  return entries.length
    ? { type: 'scores', label, scores: entries, source }
    : missingBlock('scores', label, source);
}

export function optionsBlock(
  label: string,
  options: Array<OptionBlockItem | null>,
  source: string,
  reason?: string
): OutputBlock {
  const clean = options.filter((o): o is OptionBlockItem => !!o);
  if (!clean.length) return missingBlock('options', label, source, reason);

  const evidence = createEvidence({
    statement: clean.map((o) => `Option(${o.name}: 장점=${o.pros}, 부담=${o.burdens})`).join(' vs '),
    judgmentType: 'decision',
    evidenceModules: parseModulesFromSource(source),
    sourceFields: [source],
  });
  return { type: 'options', label, options: clean, source, evidence };
}

// ============================================================================
// 3. 섹션 빌더
// ============================================================================
export function computeCoverage(blocks: OutputBlock[]): SectionCoverage {
  if (blocks.length === 0) return 'EMPTY';
  const missing = blocks.filter((b) => b.missing).length;
  if (missing === 0) return 'FULL';
  if (missing === blocks.length) return 'EMPTY';
  return 'PARTIAL';
}

export function section(id: string, no: number, title: string, blocks: OutputBlock[]): OutputSection {
  return { id, no, title, coverage: computeCoverage(blocks), blocks };
}

// ============================================================================
// 4. 공통 값 접근 헬퍼
// ============================================================================
export function pillarLabel(p: any): string {
  return p && p.stem && p.branch ? `${p.stem}${p.branch}` : '';
}
