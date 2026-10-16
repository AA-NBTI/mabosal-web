/**
 * src/core/version-registry.ts
 * 
 * Phase 72: 마보살 버전 레지스트리 및 실행 추적성 엔진 (Version Registry & Execution Traceability)
 * 
 * 핵심 원칙:
 * "하나의 Engine Version으로 모든 것을 관리하지 않는다."
 * 
 * 4대 독립 버전 체계:
 * 1. Engine Release Version: 전체 릴리스 버전 (MAJOR.MINOR.PATCH)
 * 2. Module Version: 19개 독립 모듈 각각의 개별 버전 및 동결 상태 (FROZEN)
 * 3. Rule Spec Version: Phase 58.2 & Phase 66 명리 계산 규칙 사양 버전
 * 4. ProductConfig Version: 동적 상품 구성 아키텍처 규칙 버전
 */
function pureSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 312; i += candidate) {
        isComposite[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  for (let blockIndex = 0; blockIndex < words.length; blockIndex += 16) {
    const w = words.slice(blockIndex, blockIndex + 16);
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15] || 0, w2 = w[i - 2] || 0;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? (w[i] || 0) : ((w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = ((hash[7] || 0) + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function safeHashString(str: string): string {
  const utf8 = unescape(encodeURIComponent(str));
  return pureSha256(utf8);
}

// ============================================================================
// 1. 버전 인터페이스 규격 (Section 3, 5, 8)
// ============================================================================
export type ModuleFreezeStatus = 'FROZEN' | 'ACTIVE' | 'DEPRECATED';

export interface ModuleVersionEntry {
  moduleId: string;
  version: string;
  status: ModuleFreezeStatus;
  updatedAt?: string;
  description?: string;
}

export interface EngineVersionInfo {
  engineReleaseVersion: string;
  ruleSpecVersion: string;
  productConfigVersion: string;
  moduleVersions: Record<string, string>;
  moduleEntries: Record<string, ModuleVersionEntry>;
}

export interface ExecutionTrace {
  executionId: string;
  generatedAt: string;

  engineReleaseVersion: string;
  ruleSpecVersion: string;
  productConfigVersion: string;

  moduleVersions: Record<string, string>;
  synthesisLayers?: Record<string, string>;

  inputHash: string;
  snapshotHash?: string;
  problemDomain?: string;
  productId?: string;
  selectedModuleIds?: string[];
  insightDepth?: number;
}

// ============================================================================
// 2. Phase 72 동결 초기 버전 상수 (Section 12) & Phase 80 신규 합성 계층
// ============================================================================
export const FROZEN_ENGINE_RELEASE_VERSION = '1.0.0';
export const FROZEN_RULE_SPEC_VERSION = '1.0.0';
export const FROZEN_PRODUCT_CONFIG_VERSION = '2.0.0';

export const INITIAL_19_MODULE_VERSIONS: Record<string, ModuleVersionEntry> = {
  // CORE 10
  CORE_ORIGINAL: { moduleId: 'CORE_ORIGINAL', version: '1.0.0', status: 'FROZEN', description: '원국 및 일간 본질 모듈' },
  TEN_GODS: { moduleId: 'TEN_GODS', version: '1.0.0', status: 'FROZEN', description: '십신 및 십이운성 모듈' },
  GEOKGUK: { moduleId: 'GEOKGUK', version: '1.0.0', status: 'FROZEN', description: '격국 판정 모듈' },
  STRENGTH: { moduleId: 'STRENGTH', version: '1.0.0', status: 'FROZEN', description: '신강신약 강약 판정 모듈' },
  EOKBU: { moduleId: 'EOKBU', version: '1.0.0', status: 'FROZEN', description: '억부용신 모듈' },
  JOHU: { moduleId: 'JOHU', version: '1.0.0', status: 'FROZEN', description: '조후용신 모듈' },
  RELATION: { moduleId: 'RELATION', version: '1.0.0', status: 'FROZEN', description: '합충형파해 13대 관계 모듈' },
  SINSAL: { moduleId: 'SINSAL', version: '1.0.0', status: 'FROZEN', description: '12신살 및 특수신살 모듈' },
  DAEWUN: { moduleId: 'DAEWUN', version: '1.0.0', status: 'FROZEN', description: '대운 계산 모듈' },
  SEUN: { moduleId: 'SEUN', version: '1.0.0', status: 'FROZEN', description: '세운 계산 모듈' },

  // TROUBLE 7
  MONEY: { moduleId: 'MONEY', version: '1.0.0', status: 'FROZEN', description: '재물 고민 모듈' },
  BUSINESS: { moduleId: 'BUSINESS', version: '1.0.0', status: 'FROZEN', description: '사업 고민 모듈' },
  JOB: { moduleId: 'JOB', version: '1.0.0', status: 'FROZEN', description: '직장/커리어 고민 모듈' },
  LOVE: { moduleId: 'LOVE', version: '1.0.0', status: 'FROZEN', description: '연애 고민 모듈' },
  MARRIAGE: { moduleId: 'MARRIAGE', version: '1.0.0', status: 'FROZEN', description: '결혼/가정 고민 모듈' },
  RELATIONSHIP: { moduleId: 'RELATIONSHIP', version: '1.0.0', status: 'FROZEN', description: '인간관계 고민 모듈' },
  HEALTH: { moduleId: 'HEALTH', version: '1.0.0', status: 'FROZEN', description: '건강 고민 모듈' },

  // MABOSAL 2
  MAGA_DIAGNOSIS: { moduleId: 'MAGA_DIAGNOSIS', version: '1.0.0', status: 'FROZEN', description: '마보살 마·살 진단 모듈' },
  PRESCRIPTION: { moduleId: 'PRESCRIPTION', version: '1.0.0', status: 'FROZEN', description: '마보살 맞춤 행동 처방 모듈' },
};

// Phase 80 & Phase 82: 신규 사건/통합/시간축/처방 연결 및 무결성 감사 계층 모듈 버전
export const SYNTHESIS_LAYER_MODULE_VERSIONS: Record<string, ModuleVersionEntry> = {
  EventEvidenceAggregator: { moduleId: 'EventEvidenceAggregator', version: '1.0.0', status: 'ACTIVE', description: '사건 증거 취합 및 교차 근거 엔진' },
  IntegratedAnalyzer: { moduleId: 'IntegratedAnalyzer', version: '1.1.0', status: 'ACTIVE', description: '교차 도메인 비계산 통합 분석기' },
  TimeAxisJudgmentEngine: { moduleId: 'TimeAxisJudgmentEngine', version: '1.0.0', status: 'ACTIVE', description: '동적 시계열 판단 엔진' },
  PrescriptionSynthesizer: { moduleId: 'PrescriptionSynthesizer', version: '1.0.0', status: 'ACTIVE', description: '맞춤 처방 종합 엔진' },
  OutputValidator: { moduleId: 'OutputValidator', version: '1.0.0', status: 'ACTIVE', description: '고객 출력 무결성 감사 검증기' },
  EVENT_EVIDENCE_AGGREGATOR: { moduleId: 'EVENT_EVIDENCE_AGGREGATOR', version: '1.0.0', status: 'ACTIVE', description: '사건 증거 취합 및 교차 근거 엔진' },
  INTEGRATED_ANALYZER: { moduleId: 'INTEGRATED_ANALYZER', version: '1.1.0', status: 'ACTIVE', description: '교차 도메인 비계산 통합 분석기' },
  TIME_AXIS_JUDGMENT_ENGINE: { moduleId: 'TIME_AXIS_JUDGMENT_ENGINE', version: '1.0.0', status: 'ACTIVE', description: '동적 시계열 판단 엔진' },
  PRESCRIPTION_SYNTHESIZER: { moduleId: 'PRESCRIPTION_SYNTHESIZER', version: '1.0.0', status: 'ACTIVE', description: '맞춤 처방 종합 엔진' },
  OUTPUT_VALIDATOR: { moduleId: 'OUTPUT_VALIDATOR', version: '1.0.0', status: 'ACTIVE', description: '고객 출력 무결성 감사 검증기' },
  ProductOutputLayer: { moduleId: 'ProductOutputLayer', version: '1.0.0', status: 'ACTIVE', description: 'Phase 83 4단계 고객 상품 출력 계층' },
  PRODUCT_OUTPUT_LAYER: { moduleId: 'PRODUCT_OUTPUT_LAYER', version: '1.0.0', status: 'ACTIVE', description: 'Phase 83 4단계 고객 상품 출력 계층' },
};

// ============================================================================
// 3. VersionRegistry 클래스 구현
// ============================================================================
export class VersionRegistry {
  private engineReleaseVersion = FROZEN_ENGINE_RELEASE_VERSION;
  private ruleSpecVersion = FROZEN_RULE_SPEC_VERSION;
  private productConfigVersion = FROZEN_PRODUCT_CONFIG_VERSION;
  private moduleVersions: Map<string, ModuleVersionEntry> = new Map();
  private synthesisLayers: Map<string, string> = new Map();

  constructor() {
    this.resetToFrozenDefaults();
  }

  /**
   * 동결 기본값으로 전체 버전 초기화
   */
  public resetToFrozenDefaults(): void {
    this.engineReleaseVersion = FROZEN_ENGINE_RELEASE_VERSION;
    this.ruleSpecVersion = FROZEN_RULE_SPEC_VERSION;
    this.productConfigVersion = FROZEN_PRODUCT_CONFIG_VERSION;
    this.moduleVersions.clear();
    this.synthesisLayers.clear();

    for (const [id, entry] of Object.entries(INITIAL_19_MODULE_VERSIONS)) {
      this.moduleVersions.set(id, { ...entry });
    }
    for (const [id, entry] of Object.entries(SYNTHESIS_LAYER_MODULE_VERSIONS)) {
      this.synthesisLayers.set(id, entry.version);
    }
  }

  // --- 조회 메서드 ---
  public getEngineReleaseVersion(): string {
    return this.engineReleaseVersion;
  }

  public getRuleSpecVersion(): string {
    return this.ruleSpecVersion;
  }

  public getProductConfigVersion(): string {
    return this.productConfigVersion;
  }

  public getModuleVersion(moduleId: string): string {
    return this.moduleVersions.get(moduleId)?.version || '1.0.0';
  }

  public getModuleEntry(moduleId: string): ModuleVersionEntry | undefined {
    return this.moduleVersions.get(moduleId);
  }

  public getAllModuleVersions(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [id, entry] of this.moduleVersions.entries()) {
      result[id] = entry.version;
    }
    return result;
  }

  public getAllModuleEntries(): Record<string, ModuleVersionEntry> {
    const result: Record<string, ModuleVersionEntry> = {};
    for (const [id, entry] of this.moduleVersions.entries()) {
      result[id] = { ...entry };
    }
    return result;
  }

  public getEngineVersionInfo(): EngineVersionInfo {
    return {
      engineReleaseVersion: this.engineReleaseVersion,
      ruleSpecVersion: this.ruleSpecVersion,
      productConfigVersion: this.productConfigVersion,
      moduleVersions: this.getAllModuleVersions(),
      moduleEntries: this.getAllModuleEntries(),
    };
  }

  // --- 변경 메서드 (버전 추적성 및 시뮬레이션용) ---
  public setEngineReleaseVersion(version: string): void {
    this.engineReleaseVersion = version;
  }

  public setRuleSpecVersion(version: string): void {
    this.ruleSpecVersion = version;
  }

  public setProductConfigVersion(version: string): void {
    this.productConfigVersion = version;
  }

  public setModuleVersion(
    moduleId: string,
    version: string,
    status: ModuleFreezeStatus = 'ACTIVE',
    description?: string
  ): void {
    const existing = this.moduleVersions.get(moduleId);
    this.moduleVersions.set(moduleId, {
      moduleId,
      version,
      status,
      updatedAt: new Date().toISOString(),
      description: description || existing?.description || `${moduleId} module`,
    });
  }

  // ==========================================================================
  // 4. Input Hash 계산기 (Section 9)
  // ==========================================================================
  /**
   * 개인정보를 노출하지 않고 입력과 설정을 바탕으로 결정론적 SHA-256 해시를 생성
   */
  public computeInputHash(input: any, config?: any): string {
    const canonicalPayload = {
      birthDate: input.birthDate || input.birthData?.birthDate || '',
      birthTime: input.birthTime !== undefined ? input.birthTime : (input.birthData?.birthTime ?? ''),
      gender: input.gender || input.birthData?.gender || '',
      isUnknownTime: Boolean(input.isUnknownTime ?? input.birthData?.isUnknownTime),
      currentEvent: (input.currentEvent || input.concern || input.userTrouble || '').trim(),
      userTrouble: (input.userTrouble || input.concern || input.currentEvent || '').trim(),
      desiredQuestion: (input.desiredQuestion || '').trim(),
      eventDate: input.eventDate || '',
      // Config 관련 항목
      selectedModules: config?.selectedModules ? [...config.selectedModules].sort() : [],
      insightDepth: config?.insightDepth || 3,
      caseExplanation: Boolean(config?.caseExplanation),
      personalizedMapping: Boolean(config?.personalizedMapping),
      timingAnalysis: Boolean(config?.timingAnalysis),
      responseGuidance: Boolean(config?.responseGuidance),
      prescription: Boolean(config?.prescription),
    };

    // 정렬된 키 기반 순수 결정론적 직렬화
    const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
    return safeHashString(canonicalString);
  }

  // ==========================================================================
  // 5. Execution Trace 생성 및 검증 (Section 8, 14)
  // ==========================================================================
  /**
   * 실행 당시의 4대 버전 정보와 입력 해시를 담은 ExecutionTrace 생성
   */
  public createExecutionTrace(params: {
    input: any;
    config?: any;
    domain?: string;
  }): ExecutionTrace {
    const { input, config, domain } = params;
    const inputHash = this.computeInputHash(input, config);

    // 실행에 선택된 모듈 버전만 선별 또는 전체 모듈 버전 매핑
    const activeModuleVersions: Record<string, string> = {};
    const modulesToRecord: string[] = config?.selectedModules || Object.keys(INITIAL_19_MODULE_VERSIONS);
    for (const modId of modulesToRecord) {
      activeModuleVersions[modId] = this.getModuleVersion(modId);
    }

    // Phase 80: 합성 계층 버전 정보 수집
    const activeSynthesisLayers: Record<string, string> = {};
    for (const [k, v] of this.synthesisLayers.entries()) {
      activeSynthesisLayers[k] = v;
    }

    const snapshotPayload = {
      inputHash,
      engineReleaseVersion: this.engineReleaseVersion,
      ruleSpecVersion: this.ruleSpecVersion,
      productConfigVersion: this.productConfigVersion,
      moduleVersions: activeModuleVersions,
      synthesisLayers: activeSynthesisLayers,
    };
    const snapshotHash = safeHashString(JSON.stringify(snapshotPayload));

    return {
      executionId: `EXEC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      engineReleaseVersion: this.engineReleaseVersion,
      ruleSpecVersion: this.ruleSpecVersion,
      productConfigVersion: this.productConfigVersion,
      moduleVersions: activeModuleVersions,
      synthesisLayers: activeSynthesisLayers,
      inputHash,
      snapshotHash,
      problemDomain: domain,
      productId: config?.productId,
      selectedModuleIds: config?.selectedModules,
      insightDepth: config?.insightDepth,
    };
  }

  public getSynthesisLayerVersions(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.synthesisLayers.entries()) {
      result[k] = v;
    }
    return result;
  }

  public getSynthesisLayerVersion(layerId: string): string | undefined {
    return this.synthesisLayers.get(layerId);
  }

  /**
   * 이전 실행 트레이스와 현재 환경의 버전 호환성 검증
   */
  public verifyTraceCompatibility(trace: ExecutionTrace): {
    isCompatible: boolean;
    diffs: string[];
  } {
    const diffs: string[] = [];

    if (trace.engineReleaseVersion !== this.engineReleaseVersion) {
      diffs.push(`Engine Release Version 불일치: trace(${trace.engineReleaseVersion}) vs current(${this.engineReleaseVersion})`);
    }
    if (trace.ruleSpecVersion !== this.ruleSpecVersion) {
      diffs.push(`Rule Spec Version 불일치: trace(${trace.ruleSpecVersion}) vs current(${this.ruleSpecVersion})`);
    }
    if (trace.productConfigVersion !== this.productConfigVersion) {
      diffs.push(`ProductConfig Version 불일치: trace(${trace.productConfigVersion}) vs current(${this.productConfigVersion})`);
    }

    for (const [modId, recordedVer] of Object.entries(trace.moduleVersions)) {
      const currentVer = this.getModuleVersion(modId);
      if (currentVer !== recordedVer) {
        diffs.push(`Module [${modId}] Version 불일치: trace(${recordedVer}) vs current(${currentVer})`);
      }
    }

    return {
      isCompatible: diffs.length === 0,
      diffs,
    };
  }
}

export const versionRegistry = new VersionRegistry();
