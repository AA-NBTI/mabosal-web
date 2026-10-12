/**
 * Phase 50 Post-Calibration: 마보살 확장 플랫폼 아키텍처 (Extension Registry)
 * 
 * 기존 사주/살진단 엔진을 독립 보존하면서
 * 향후 궁합, 작명, 택일, 부적/처방, 상담(전문가/AI) 모듈을
 * 동적으로 추가/제거해도 코어 엔진이 손상되지 않는 플러그인 아키텍처.
 */

import { FourPillars } from '../../core/types.js';

export type ServiceDomainType =
  | 'saju_core'         // 사주 코어
  | 'sal_diagnosis'     // 살진단 엔진
  | 'gunghap_couple'    // 커플/연인 궁합
  | 'gunghap_marriage'  // 부부 궁합
  | 'gunghap_family'    // 자녀/부모 궁합
  | 'gunghap_business'  // 사업/동업 파트너 궁합
  | 'naming_person'     // 개인 작명/개명
  | 'naming_brand'      // 상호/브랜드명 작명
  | 'taekil_move'       // 이사 택일
  | 'taekil_business'   // 개업 택일
  | 'taekil_marriage'   // 결혼 택일
  | 'digital_remedy'    // 디지털 처방 및 보완
  | 'talisman_remedy'   // 부적/처방 물상대체
  | 'expert_consult'    // 1:1 역학 전문가 상담
  | 'ai_consultation';  // 심층 대화형 AI 상담

export interface ExtensionModule<TInput = any, TOutput = any> {
  id: string;
  domain: ServiceDomainType;
  version: string;
  name: string;
  description: string;
  isAvailable: boolean;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

export class ExtensionRegistry {
  private modules = new Map<string, ExtensionModule>();

  public registerModule(mod: ExtensionModule): void {
    this.modules.set(mod.id, mod);
  }

  public unregisterModule(moduleId: string): boolean {
    return this.modules.delete(moduleId);
  }

  public getModule<TInput, TOutput>(moduleId: string): ExtensionModule<TInput, TOutput> | undefined {
    return this.modules.get(moduleId) as ExtensionModule<TInput, TOutput> | undefined;
  }

  public listAvailableDomains(): ServiceDomainType[] {
    return Array.from(this.modules.values())
      .filter(m => m.isAvailable)
      .map(m => m.domain);
  }

  public executeExtension<TInput, TOutput>(moduleId: string, input: TInput): Promise<TOutput> | TOutput {
    const mod = this.modules.get(moduleId);
    if (!mod) {
      throw new Error(`등록되지 않은 확장 모듈입니다: ${moduleId}`);
    }
    if (!mod.isAvailable) {
      throw new Error(`현재 비활성화된 확장 모듈입니다: ${moduleId}`);
    }
    return mod.execute(input);
  }
}

export const extensionRegistry = new ExtensionRegistry();

// 기본 확장 슬롯 예시 등록 (플러그인 독립성 검증용)
extensionRegistry.registerModule({
  id: 'ext_gunghap_couple',
  domain: 'gunghap_couple',
  version: '1.0.0',
  name: '연인 궁합 모듈',
  description: '두 사주의 일지·일간 조화 및 합충 분석',
  isAvailable: true,
  execute: (input: { person1: FourPillars; person2: FourPillars }) => ({
    harmonyScore: 85,
    summary: '일지 상생 및 식신생재의 온화한 흐름',
  }),
});

extensionRegistry.registerModule({
  id: 'ext_taekil_move',
  domain: 'taekil_move',
  version: '1.0.0',
  name: '이사 택일 모듈',
  description: '손 없는 날 및 일진 길일 판정',
  isAvailable: true,
  execute: (input: { yearMonth: string }) => ({
    recommendedDays: ['2026-11-12', '2026-11-22'],
    cautionDays: ['2026-11-05'],
  }),
});
