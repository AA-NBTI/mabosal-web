import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const errors = [];

function readRel(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

function listTsFiles(relDir) {
  const fullDir = path.join(ROOT, relDir);
  if (!fs.existsSync(fullDir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listTsFiles(rel));
    } else if (entry.name.endsWith('.ts')) {
      results.push(rel);
    }
  }
  return results;
}

// 1. 장바구니·결제·스토어·퍼널 영역에서 샘플 사주 자동 대입(getProfileOrDefault) 금지
const forbiddenDefaultProfileTargets = [
  ...listTsFiles('src/frontend/modules/cart'),
  ...listTsFiles('src/frontend/modules/checkout'),
  ...listTsFiles('src/frontend/extensions/commerce-store'),
  'src/frontend/components/CartAndReviewModal.ts',
  'src/frontend/views/pages/FunnelCheckoutHelper.ts',
  'src/frontend/main.ts',
];

for (const rel of forbiddenDefaultProfileTargets) {
  const content = readRel(rel);
  if (!content) continue;
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.includes('getProfileOrDefault(') && !line.trim().startsWith('//')) {
      errors.push(`[금지 패턴] ${rel}:${idx + 1} - 커머스/결제 경로에서 getProfileOrDefault() 사용 금지`);
    }
  });
}

// 2. 장바구니/주문서/스토어 UI에서 '등록 완료' 문구 사용 시 반드시 '미등록' 분기 동반 여부 검사
const sajuBadgeViews = [
  'src/frontend/components/CartAndReviewModal.ts',
  'src/frontend/modules/cart/CartBoardView.ts',
  'src/frontend/modules/checkout/CheckoutBoardView.ts',
  'src/frontend/extensions/commerce-store/ui-store-view.ts',
];

for (const rel of sajuBadgeViews) {
  const content = readRel(rel);
  if (!content) continue;
  if (content.includes('등록 완료') && !content.includes('미등록')) {
    errors.push(`[UI 하드코딩 의심] ${rel} - '등록 완료' 문구가 있으나 '미등록' 분기가 없습니다.`);
  }
}

// 3. AuthService 로컬 계정 목록 중복 방지 확인
const authContent = readRel('src/frontend/state/auth-service.ts');
if (authContent && !authContent.includes('dedupedAccounts')) {
  errors.push('[계정 무결성] src/frontend/state/auth-service.ts - register() 로컬 캐시 중복 제거(dedupedAccounts)가 누락되었습니다.');
}

if (errors.length > 0) {
  console.error('\n[Commerce Integrity Audit FAILED]');
  for (const err of errors) {
    console.error(' -', err);
  }
  process.exit(1);
}

console.log('[Commerce Integrity Audit PASSED] 금지 패턴 및 UI 상태 분기 검증 통과');

