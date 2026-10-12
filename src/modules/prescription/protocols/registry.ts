/**
 * src/modules/prescription/protocols/registry.ts
 * 
 * 처방 프로토콜 레지스트리 (Plug-and-Play Hub)
 * 
 * 도메인별 프로토콜을 등록하고, 사용자 입력 텍스트와 컨텍스트에 따라
 * 가장 최적화된 처방 프로토콜 모듈을 반환한다.
 */

import { ProblemDomain } from '../../product-generator/types.js';
import { IPrescriptionProtocol, ProtocolContext } from './types.js';
import { verbalReversalProtocol } from './job/verbal-reversal-protocol.js';
import { publicReprimandProtocol } from './job/public-reprimand-protocol.js';
import { unclearRnrProtocol } from './job/unclear-rnr-protocol.js';
import { universalJobProtocol } from './job/universal-job-protocol.js';

export class PrescriptionProtocolRegistry {
  private protocols: IPrescriptionProtocol[] = [];

  constructor() {
    // 직장 도메인 프로토콜 등록 (우선순위 순서대로 등록)
    this.register(verbalReversalProtocol);
    this.register(publicReprimandProtocol);
    this.register(unclearRnrProtocol);
    this.register(universalJobProtocol); // 최하위 Fallback
  }

  public register(protocol: IPrescriptionProtocol): void {
    this.protocols.push(protocol);
  }

  /**
   * 사용자 텍스트 및 컨텍스트에 매칭되는 최적 프로토콜 탐색
   */
  public resolveProtocol(rawText: string, context?: ProtocolContext): IPrescriptionProtocol {
    const domain = context?.domain || 'JOB';

    // 1. 도메인 일치 및 패턴 매칭 검사
    for (const proto of this.protocols) {
      if (proto.domain === domain && proto.id !== 'UNIVERSAL_JOB') {
        if (proto.matches(rawText, context)) {
          return proto;
        }
      }
    }

    // 2. 일치하는 패턴이 없으면 도메인별 범용 프로토콜(Fallback) 반환
    const fallback = this.protocols.find(p => p.domain === domain && p.id === 'UNIVERSAL_JOB');
    if (fallback) {
      return fallback;
    }

    // 3. 최종 안전망
    return universalJobProtocol;
  }
}

export const protocolRegistry = new PrescriptionProtocolRegistry();
