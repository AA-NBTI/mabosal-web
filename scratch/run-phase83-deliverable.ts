/**
 * scratch/run-phase83-deliverable.ts
 *
 * Phase 83 실제 CASE 1건 실행 및 4단계 상품 실제 출력 추출
 */

import { generateAllProductOutputs, CommonCaseInput } from '../src/modules/product-output/index.js';

const testCase: CommonCaseInput = {
  solarBirthDate: '1988-05-20',
  birthTime: '14:30',
  gender: 'male',
  calendarType: 'solar',
  birthRegion: '서울',
  coreTrouble: '직장에서 상사의 잦은 지시 번복과 팀 내 R&R 모호함으로 심한 스트레스를 받고 있습니다.',
  desiredQuestion: '올해 하반기에 이직을 추진해야 할지, 아니면 현재 부서에서 버티는 것이 유리할까요?',
  occupation: 'IT 서비스 기획자',
  currentSituation: '팀장 교체 후 6개월간 업무 방향이 수시로 바뀌고 성과 평가에 불안감이 큽니다.',
  relationshipSituation: '상사와 잦은 이견으로 대화가 단절된 상태입니다.',
  financialSituation: '이직 준비 기간 6개월 정도를 버틸 수 있는 비상금은 확보되어 있습니다.',
  healthLifeSituation: '만성 피로와 수면 부족이 지속되고 있습니다.',
  additionalContext: '이전 직장에서도 상사와의 소통 마찰로 퇴사한 경험이 있어 제 패턴인지 궁금합니다.',
  targetYear: 2026,
  targetMonth: 10,
  flowYears: [2026, 2027, 2028],
};

const result = generateAllProductOutputs(testCase);

function formatProduct(p: any): string {
  let out = `================================================================================\n`;
  out += `[상품] ${p.tierLabel} (${p.tier})\n`;
  out += `태그라인: ${p.tagline}\n`;
  out += `총 섹션 수: ${p.meta.sectionCount}개 (완전: ${p.meta.coverage.full}, 부분: ${p.meta.coverage.partial}, 빈블록: ${p.meta.coverage.empty})\n`;
  out += `================================================================================\n\n`;

  for (const sec of p.sections) {
    out += `--------------------------------------------------------------------------------\n`;
    out += `섹션 ${sec.no}. ${sec.title} [커버리지: ${sec.coverage}]\n`;
    out += `--------------------------------------------------------------------------------\n`;
    for (const b of sec.blocks) {
      if (b.missing) {
        out += `  [미산출/정보 없음] ${b.label || b.type}: ${b.missingReason} (출처: ${b.source})\n`;
      } else if (b.type === 'text') {
        out += `  [텍스트] ${b.label ? `[${b.label}] ` : ''}${b.text} (출처: ${b.source})\n`;
      } else if (b.type === 'list') {
        out += `  [리스트] ${b.label ? `[${b.label}] ` : ''}\n`;
        for (const it of b.items || []) {
          out += `    - ${it}\n`;
        }
      } else if (b.type === 'facts') {
        out += `  [팩트] ${b.label ? `[${b.label}] ` : ''}\n`;
        for (const r of b.rows || []) {
          out += `    * ${r.label}: ${r.value}\n`;
        }
      } else if (b.type === 'table') {
        out += `  [표] ${b.label ? `[${b.label}] ` : ''}\n`;
        out += `    헤더: ${(b.table?.headers || []).join(' | ')}\n`;
        for (const row of b.table?.rows || []) {
          out += `    행: ${row.join(' | ')}\n`;
        }
      } else if (b.type === 'scores') {
        out += `  [점수] ${b.label ? `[${b.label}] ` : ''}\n`;
        for (const s of b.scores || []) {
          out += `    * ${s.label}: ${s.value !== null ? `${s.value}점` : '미산출'} [${s.status}] - ${s.basis}\n`;
        }
      } else if (b.type === 'options') {
        out += `  [선택지 비교] ${b.label ? `[${b.label}] ` : ''}\n`;
        for (const opt of b.options || []) {
          out += `    <선택: ${opt.name}>\n`;
          out += `      - 장점: ${opt.pros}\n`;
          out += `      - 부담: ${opt.burdens}\n`;
          if (opt.conditions?.length) {
            out += `      - 전제조건:\n`;
            for (const c of opt.conditions) {
              out += `        * ${c}\n`;
            }
          }
        }
      }
    }
    out += `\n`;
  }
  return out;
}

console.log(formatProduct(result.free));
console.log(formatProduct(result.paid));
console.log(formatProduct(result.conflictMalSal));
console.log(formatProduct(result.premium));
