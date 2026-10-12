/**
 * src/modules/product-output/evidence-tracker.ts
 *
 * Phase 84: 4단계 출력 근거 추적(Evidence Tracker) 및 생성 정확성 제어 엔진
 *
 * 원칙:
 * 1. 모든 핵심 판단 문장은 실제 명리 데이터/모듈 결과에 근거(OutputEvidence)를 둔다.
 * 2. 입력에 없는 사실(재정 버퍼 6개월 확보, 임의 생활조건 등)을 임의 생성하지 않는다.
 * 3. 근거 수준(HIGH/MEDIUM/LOW)에 따라 표현 강도를 제어하며, "최적", "가장 불리", "반드시" 등 단정을 차단한다.
 * 4. 마·살은 사건의 직접 원인으로 단정하지 않고 [존재 → 영역 → 구조 결합 → 현실 양상] 체인으로만 연결한다.
 * 5. 건강 표현은 질병/장기 단정을 전면 배제하고 명리적 생활관리(오행 균형, 수면, 스트레스 완화) 수준으로 제한한다.
 */

import type { JudgmentType, OutputEvidence } from './types.js';

let evidenceIdCounter = 0;

export interface CreateEvidenceParams {
  statement: string;
  judgmentType: JudgmentType;
  evidenceModules: string[];
  sourceFields: string[];
  timeAxis?: OutputEvidence['timeAxis'];
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * 판단 문장에 대한 출력 근거(OutputEvidence) 객체 생성
 */
export function createEvidence(params: CreateEvidenceParams): OutputEvidence {
  evidenceIdCounter++;
  const statementId = `EVD-${Date.now().toString(36)}-${String(evidenceIdCounter).padStart(4, '0')}`;
  const confidence = params.confidence ?? (params.evidenceModules.length >= 2 ? 'high' : 'medium');
  const supported = params.evidenceModules.length > 0 && params.sourceFields.length > 0 && !!params.statement.trim();

  return {
    statementId,
    statement: params.statement.trim(),
    judgmentType: params.judgmentType,
    evidenceModules: params.evidenceModules,
    sourceFields: params.sourceFields,
    timeAxis: params.timeAxis,
    confidence,
    supported,
  };
}

/**
 * 문제 B: 근거보다 강한 판단 완화 (Judgment Tone Controller)
 * - '최적', '가장 불리', '가장 유리', '반드시', '최악' 등 과격한 결정적 단정 표현 제거 및 완화
 */
export function regulateJudgmentTone(
  statement: string,
  confidence: 'high' | 'medium' | 'low' = 'high'
): string {
  if (!statement) return '';

  let s = statement;

  // 1. 최상급/단정적 표현 완화
  s = s.replace(/가장\s*불리합니다/g, '부담과 리스크가 커질 수 있습니다');
  s = s.replace(/가장\s*불리하다/g, '부담이 가중될 수 있다');
  s = s.replace(/가장\s*불리한/g, '상대적으로 부담이 큰');

  s = s.replace(/최적의\s*해법입니다/g, '합리적인 대안이 될 수 있습니다');
  s = s.replace(/최적의\s*선택입니다/g, '안정적인 선택지로 검토할 수 있습니다');
  s = s.replace(/최적입니다/g, '안정적입니다');
  s = s.replace(/최적이다/g, '안정적이다');

  s = s.replace(/가장\s*안전합니다/g, '비교적 안정적인 방안으로 권장됩니다');
  s = s.replace(/가장\s*유리합니다/g, '유리한 기회가 열릴 수 있습니다');
  s = s.replace(/가장\s*유리한/g, '유리한 국면의');

  s = s.replace(/반드시\s*(발생|일어|나타|부딪)/g, '높은 확률로 $1');
  s = s.replace(/반드시\s*/g, '각별히 ');

  s = s.replace(/최악의\s*결과/g, '상당한 리스크');
  s = s.replace(/확정적으로/g, '유력하게');

  // 2. 확신도(Confidence)에 따른 어조 조절
  if (confidence === 'medium') {
    // 단정적 서술을 가능성/경향 서술로 완화
    s = s.replace(/으로\s*진단됩니다\./g, '으로 분석될 가능성이 큽니다.');
    s = s.replace(/으로\s*판정됩니다\./g, '으로 나타나는 경향이 있습니다.');
  } else if (confidence === 'low') {
    s = s.replace(/합니다\./g, '할 수 있으니 참고하시기 바랍니다.');
    s = s.replace(/됩니다\./g, '될 가능성을 염두에 두십시오.');
  }

  return s.trim();
}

/**
 * 문제 A: 입력에 없는 사실 생성 차단 (No-Hallucination Guard)
 * - 사용자가 명시하지 않은 '재정 버퍼 N개월 확보', '비상금 확보 완료' 등 기정사실화 차단
 */
export function sanitizeHallucinatedFacts(
  statement: string,
  userProvidedFacts: { financialSituation?: string; currentSituation?: string } = {}
): string {
  if (!statement) return '';

  let s = statement;

  // 사용자가 financialSituation에 비상금이나 자금을 명시하지 않은 경우
  const hasUserFinancialInput = !!userProvidedFacts.financialSituation?.trim();
  if (!hasUserFinancialInput) {
    // 단정적으로 "비상 자금이 확보된 상태를 반영하여" 식의 문구를 객관적 점검 가이드로 치환
    s = s.replace(/재정\s*버퍼\s*\d+개월\s*확보\s*상태\s*반영/g, '이동 전 비상 자금 확보 여부 점검 필요');
    s = s.replace(/비상금\s*\d+개월\s*확보\s*상태/g, '비상 자금 확보 여부');
    s = s.replace(/자금이\s*완비되는\s*단계에\s*맞춰/g, '자금 대책을 점검하며');
  }

  return s;
}

/**
 * 문제 D: 건강 표현의 명리적 생활관리 제한 (Health Scope Guard)
 * - 질병명, 장기 이상 등 의학적 상태 단정 완전 배제
 */
export function sanitizeHealthStatements(statement: string): string {
  if (!statement) return '';

  let s = statement;

  // 장기 이상/질환 단정 어휘를 오행 균형 및 일상 컨디션 조절 표현으로 정제
  s = s.replace(/(간|신장|방광|심장|폐|위장|대장|비장)\s*(질환|이상|병|악화|파괴)/g, '해당 오행 기운의 편중');
  s = s.replace(/토극수(로 인한|및)\s*목 기운 소모로 인한 간\/수면 피로/g, '오행의 수·목 기운 불균형에 따른 일상 피로와 컨디션 저하');
  s = s.replace(/장기\s*(이상|손상)/g, '기운의 불균형');

  // 의학적 진단처럼 서술된 문장 완화
  s = s.replace(/(발병|치료|투약|진료)가?\s*필요합니다/g, '일상적인 휴식과 컨디션 관리가 권장됩니다');

  return s;
}

/**
 * 문제 C: 마·살의 직접 원인화 차단 (Malsal Chain Formatter)
 * 마·살 존재 → 관련 영역 → 다른 명리 구조와의 결합 → 현실에서 나타날 수 있는 양상
 */
export function formatMalsalChain(params: {
  maName: string;
  domainName: string;
  baseStructure: string;
  manifestation: string;
  remedy?: string;
}): string {
  const parts: string[] = [
    `[원국 및 운의 작용] ${params.maName}의 기운이 감지되며`,
    `[영역 접점] ${params.domainName} 영역에서`,
    `[구조적 결합] 원국의 ${params.baseStructure}과 교차하면서`,
    `[현실 양상] ${params.manifestation} 형태로 나타날 수 있습니다.`,
  ];
  if (params.remedy) {
    parts.push(`[대응 방향] ${params.remedy}`);
  }
  return parts.join(' ');
}
