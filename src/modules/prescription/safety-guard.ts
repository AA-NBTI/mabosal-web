/**
 * src/modules/prescription/safety-guard.ts
 * 
 * Phase 70: 처방 엔진 안전성 가드 (Safety Guard)
 * 
 * 지침 21절:
 * - 처방만으로 운명이 바뀐다고 표현 금지
 * - 부적/처방물의 효능 보장 금지
 * - 특정 색/방향을 무조건 사용해야 한다고 표현 금지
 * - 질병 치료 주장 금지 (의료 상담 권고 필수)
 * - 투자 수익 보장 및 원금 보장 금지
 * - 사업 성공 보장 금지
 * - 연애/결혼 결과 보장 금지
 * - 미래 사건 확정(결정론) 금지
 * - 공포를 이용한 처방물 강매 금지
 * - 명리 근거 없는 처방 차단
 */

import { Prescription, PrescriptionCategory } from './types.js';

export interface SafetyCheckResult {
  isSafe: boolean;
  violations: string[];
  sanitizedText: string;
}

export class PrescriptionSafetyGuard {
  // 금지된 단정적/공포/보장 키워드 목록
  private static readonly FATALISTIC_PATTERNS = [
    /반드시\s*(파멸|파산|사망|이혼|망한다|실패한다|병에\s*걸린다)/g,
    /무조건\s*(문제가\s*생깁니다|망합니다|헤어집니다)/g,
    /운명이\s*(바뀝니다|결정되어\s*있습니다)/g,
    /부적(이|을\s*통해)\s*(모든\s*것을\s*해결|100%|효험을\s*보장)/g,
    /처방(만으로|을\s*통해)\s*인생이\s*180도\s*바뀝니다/g,
    /(100%|확실한)\s*(수익\s*보장|원금\s*보장|대박|치료|완치|재회)/g,
    /(사지\s*않으면|구입하지\s*않으면)\s*(큰\s*화|재앙|재난)/g,
  ];

  /**
   * 텍스트 내 결정론적/과장/공포 표현 필터링 및 순화
   */
  public sanitizeText(text: string): string {
    let sanitized = text;

    sanitized = sanitized.replace(/반드시 문제가 생깁니다/g, '이 시기에는 해당 영역에 대한 관리 수준을 높이는 것이 좋습니다');
    sanitized = sanitized.replace(/무조건 실패합니다/g, '신중한 사전 검토와 대비가 필요합니다');
    sanitized = sanitized.replace(/운명을 바꿉니다/g, '현실의 선택과 환경을 능동적으로 개선하도록 돕습니다');
    sanitized = sanitized.replace(/100% 완치됩니다/g, '전문 의료진의 진료 및 건강 습관 관리를 병행하십시오');
    sanitized = sanitized.replace(/수익을 보장합니다/g, '보수적인 자산 관리와 리스크 분산이 요구됩니다');
    sanitized = sanitized.replace(/무조건 재회합니다/g, '상대방과의 건강한 거리감 및 감정 냉각기 조성이 도움됩니다');

    return sanitized;
  }

  /**
   * 단일 처방에 대한 엄격한 안전성 검증
   */
  public validatePrescription(pres: Prescription): { isValid: boolean; safetyFlags: string[]; warnings: string[] } {
    const safetyFlags: string[] = ['SAFETY_VERIFIED_PHASE70'];
    const warnings: string[] = [];

    // 1. 명리 근거 필수 검증 (basis 누락 시 거부)
    if (!pres.basis || pres.basis.length === 0) {
      return {
        isValid: false,
        safetyFlags: ['REJECTED_NO_BASIS'],
        warnings: ['명리적 근거(basis)가 존재하지 않는 처방은 생성이 금지됩니다.'],
      };
    }

    // 2. 도메인별 안전성 검증
    if (pres.category === 'HEALTH') {
      safetyFlags.push('HEALTH_DISCLAIMER_ATTACHED');
      // 의료법 준수: 의학적 치료가 아님을 명시
      const hasMedicalCaution =
        pres.expectedPurpose.includes('의료') ||
        pres.behaviorActions.some(a => a.includes('의료') || a.includes('전문의') || a.includes('검진')) ||
        pres.environmentActions.some(a => a.includes('휴식') || a.includes('생활'));
      
      if (!hasMedicalCaution) {
        pres.behaviorActions.push('건강 이상 신호가 지속될 경우 반드시 공인 전문의 및 의료기관의 정확한 진단과 검진을 우선하십시오.');
      }
    }

    if (pres.category === 'MONEY') {
      safetyFlags.push('FINANCIAL_RISK_GUARDED');
      // 투자 보장 금지 및 리스크 분산 권고
      const hasMoneyCaution = pres.behaviorActions.some(a => a.includes('검토') || a.includes('분산') || a.includes('리스크'));
      if (!hasMoneyCaution) {
        pres.behaviorActions.push('투자 및 대규모 지출은 일방적 결정 대신 객관적 서류 검토와 리스크 분산을 최우선 원칙으로 삼으십시오.');
      }
    }

    if (pres.category === 'BUSINESS') {
      safetyFlags.push('BUSINESS_CONTRACT_GUARDED');
      const hasBizCaution = pres.behaviorActions.some(a => a.includes('계약') || a.includes('문서') || a.includes('자문'));
      if (!hasBizCaution) {
        pres.behaviorActions.push('동업 및 거래 계약 시 구두 약속을 배제하고 법률 전문가의 검토를 거친 서면 계약서를 작성하십시오.');
      }
    }

    if (pres.category === 'LOVE' || pres.category === 'MARRIAGE') {
      safetyFlags.push('RELATIONSHIP_RESPECT_GUARDED');
    }

    // 3. 텍스트 내 금지 패턴 스캔 및 정제
    pres.title = this.sanitizeText(pres.title);
    pres.expectedPurpose = this.sanitizeText(pres.expectedPurpose);
    pres.environmentActions = pres.environmentActions.map(a => this.sanitizeText(a));
    pres.behaviorActions = pres.behaviorActions.map(a => this.sanitizeText(a));

    for (const item of pres.remedyItems) {
      item.purpose = this.sanitizeText(item.purpose);
      if (!item.safetyNotice) {
        item.safetyNotice = '본 처방물은 상징적 보조 수단이며 운명을 바꾸거나 효능을 보장하지 않습니다.';
      }
    }

    return {
      isValid: true,
      safetyFlags,
      warnings,
    };
  }

  /**
   * 최종 고객용 면책 및 안전 안내 문구 생성
   */
  public getDomainSafetyDisclaimer(category: PrescriptionCategory): string {
    switch (category) {
      case 'HEALTH':
        return '※ 건강 관련 처방은 생활 습관 및 심신 안정을 돕는 보조 지침이며, 의학적 진단 및 치료를 대신할 수 없습니다. 신체적 이상 증상은 반드시 전문 의료기관 및 의사의 진료를 받으십시오.';
      case 'MONEY':
        return '※ 재물 관련 처방은 심리적 절제와 리스크 관리 지침이며, 특정 금융 상품의 수익률을 보장하거나 원금 보존을 약속하지 않습니다. 최종 투자 판단은 본인의 책임입니다.';
      case 'BUSINESS':
        return '※ 사업 관련 처방은 의사결정의 신중함과 리스크 분산을 돕는 지침이며, 사업 성공이나 계약 성사를 보장하지 않습니다. 법률 및 세무 사안은 전문가의 검토를 받으십시오.';
      case 'LOVE':
      case 'MARRIAGE':
        return '※ 애정 및 부부 처방은 감정 냉각과 건강한 소통을 돕는 가이드이며, 특정 관계의 강제적 성립이나 결과를 확정하지 않습니다.';
      default:
        return '※ 본 처방은 명리 구조 분석에 기반한 환경 및 행동 가이드로, 개인의 주도적인 실천을 돕기 위한 보조 수단입니다.';
    }
  }
}

export const prescriptionSafetyGuard = new PrescriptionSafetyGuard();
