/**
 * Phase 13: 최종 블랙박스 검증 및 운영 준비 감사 타입 규격
 * 
 * 원칙:
 * 1. Phase 1~12의 완성된 엔진을 수정하지 않고 블랙박스 방식으로 전 과정(입력→계산→21Ma→RSI→6해석→상담→근거→시간축)을 총괄 오케스트레이션합니다.
 * 2. 잘못된 입력/누락/예외 상황에 대해 스택 트레이스 등 내부 정보를 노출하지 않는 안전한 Fallback을 제공합니다.
 * 3. 개인정보(PII) 마스킹 및 안전 감사 규격을 준수합니다.
 * 4. 상담 전후 데이터 불변성(Deep Immutability)을 검증합니다.
 */

import { FourPillars, HeavenlyStem } from '../../core/types.js';
import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { TimeModulatorSignal } from '../phase6/phase6-types.js';
import { Phase7Output } from '../phase7/phase7-pipeline.js';
import { MabosalFinalUserReport, ReportDepthMode } from '../phase10/phase10-types.js';
import { ConsultationAnswer, ConsultationDialogueContext } from '../phase11/phase11-types.js';

export interface MabosalSessionRequest {
  sessionId?: string;
  birthDate: string;           // YYYY-MM-DD
  birthTime?: string | null;   // HH:mm 또는 null (미상)
  region?: string;
  gender?: 'male' | 'female';
  depthMode?: ReportDepthMode;
  timeModulators?: TimeModulatorSignal[];
}

export interface MabosalSessionState {
  sessionId: string;
  createdAt: string;
  request: MabosalSessionRequest;
  fact: MaModuleInputFact;
  signalSet: MaSignalSet;
  phase7Output: Phase7Output;
  userReport: MabosalFinalUserReport;
  dialogueContext: ConsultationDialogueContext;
  isMissingHour: boolean;
}

export interface SessionOperationResult<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  userMessage?: string;
  internalErrorDetail?: string; // 운영자 로그용 (사용자 노출 금지)
}

export interface ImmutabilityAuditCheckResult {
  isPillarsUnchanged: boolean;
  isFactUnchanged: boolean;
  isSignalSetUnchanged: boolean;
  isActivationStateUnchanged: boolean;
  isRsiUnchanged: boolean;
  isCertaintyUnchanged: boolean;
  allPassed: boolean;
  auditDetails: string[];
}
