/**
 * src/modules/modular/index.ts
 * 
 * Phase 60: Modular Product Architecture 공개 인터페이스
 */

export * from './types.js';
export * from './base-modular-engine.js';
export * from './module-registry.js';
export * from './integrated-analyzer.js';
export * from './product-combiner.js';

// Core Modules
export * from './core-modules/core-original-module.js';
export * from './core-modules/ten-gods-module.js';
export * from './core-modules/geokguk-module.js';
export * from './core-modules/strength-module.js';
export * from './core-modules/eokbu-module.js';
export * from './core-modules/johu-module.js';
export * from './core-modules/relation-module.js';
export * from './core-modules/sinsal-module.js';
export * from './core-modules/daewun-module.js';
export * from './core-modules/seun-module.js';

// Trouble Modules
export * from './trouble-modules/money-module.js';
export * from './trouble-modules/business-module.js';
export * from './trouble-modules/job-module.js';
export * from './trouble-modules/love-module.js';
export * from './trouble-modules/marriage-module.js';
export * from './trouble-modules/relationship-trouble-module.js';
export * from './trouble-modules/health-module.js';

// Mabosal Modules
export * from './mabosal-modules/maga-diagnosis-module.js';
export * from './mabosal-modules/prescription-module.js';
