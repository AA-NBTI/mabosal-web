/**
 * src/modules/modular/module-registry.ts
 * 
 * Phase 60: 독립 명리 모듈 중앙 레지스트리 (Module Registry)
 * 
 * 기능:
 * 1. 19개 표준 모듈 기본 등록 및 인덱싱
 * 2. OCP(Open-Closed Principle): 외부/신규 모듈 동적 플러그인 등록(registerModule)
 * 3. 개별 모듈 단독 실행(executeSingleModule) 및 배치 실행(executeModules)
 * 4. 모듈 메타데이터 및 가격 정보 조회
 */

import { BaseModularEngine } from './base-modular-engine.js';
import { ModularId, ModularInput, ModularOutput, ModuleCategory } from './types.js';

// 1. 핵심 모듈 (10종)
import { CoreOriginalModule } from './core-modules/core-original-module.js';
import { TenGodsModule } from './core-modules/ten-gods-module.js';
import { GeokgukModule } from './core-modules/geokguk-module.js';
import { StrengthModule } from './core-modules/strength-module.js';
import { EokbuModule } from './core-modules/eokbu-module.js';
import { JohuModule } from './core-modules/johu-module.js';
import { RelationModule } from './core-modules/relation-module.js';
import { SinsalModule } from './core-modules/sinsal-module.js';
import { DaewunModule } from './core-modules/daewun-module.js';
import { SeunModule } from './core-modules/seun-module.js';

// 2. 현실 고민 모듈 (7종)
import { MoneyModule } from './trouble-modules/money-module.js';
import { BusinessModule } from './trouble-modules/business-module.js';
import { JobModule } from './trouble-modules/job-module.js';
import { LoveModule } from './trouble-modules/love-module.js';
import { MarriageModule } from './trouble-modules/marriage-module.js';
import { RelationshipTroubleModule } from './trouble-modules/relationship-trouble-module.js';
import { HealthModule } from './trouble-modules/health-module.js';

// 3. 마보살 고유 모듈 (2종)
import { MagaDiagnosisModule } from './mabosal-modules/maga-diagnosis-module.js';
import { PrescriptionModule } from './mabosal-modules/prescription-module.js';

export class ModuleRegistry {
  private modules = new Map<ModularId, BaseModularEngine>();

  constructor() {
    this.registerBuiltinModules();
  }

  /**
   * 19개 기본 내장 모듈 일괄 등록
   */
  private registerBuiltinModules() {
    // Core
    this.register(new CoreOriginalModule());
    this.register(new TenGodsModule());
    this.register(new GeokgukModule());
    this.register(new StrengthModule());
    this.register(new EokbuModule());
    this.register(new JohuModule());
    this.register(new RelationModule());
    this.register(new SinsalModule());
    this.register(new DaewunModule());
    this.register(new SeunModule());

    // Trouble
    this.register(new MoneyModule());
    this.register(new BusinessModule());
    this.register(new JobModule());
    this.register(new LoveModule());
    this.register(new MarriageModule());
    this.register(new RelationshipTroubleModule());
    this.register(new HealthModule());

    // Mabosal
    this.register(new MagaDiagnosisModule());
    this.register(new PrescriptionModule());
  }

  /**
   * 신규/외부 모듈 등록 (OCP 지원)
   */
  public register(engine: BaseModularEngine): void {
    this.modules.set(engine.moduleId, engine);
  }

  /**
   * 모듈 조회
   */
  public get(moduleId: ModularId): BaseModularEngine | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * 등록된 모든 모듈 ID 목록
   */
  public getAllModuleIds(): ModularId[] {
    return Array.from(this.modules.keys());
  }

  /**
   * 카테고리별 모듈 목록 조회
   */
  public getModulesByCategory(category: ModuleCategory): BaseModularEngine[] {
    return Array.from(this.modules.values()).filter(m => m.category === category);
  }

  /**
   * 단일 모듈 단독 실행
   */
  public executeSingleModule(moduleId: ModularId, input: ModularInput): ModularOutput {
    const engine = this.get(moduleId);
    if (!engine) {
      throw new Error(`[ModuleRegistry] 등록되지 않은 모듈입니다: ${moduleId}`);
    }
    return engine.execute(input);
  }

  /**
   * 지정된 복수 모듈 일괄 독립 실행
   */
  public executeModules(moduleIds: ModularId[], input: ModularInput): Record<ModularId, ModularOutput> {
    const results: Record<ModularId, ModularOutput> = {};
    for (const id of moduleIds) {
      results[id] = this.executeSingleModule(id, input);
    }
    return results;
  }
}

export const moduleRegistry = new ModuleRegistry();
