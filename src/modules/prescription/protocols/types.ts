/**
 * src/modules/prescription/protocols/types.ts
 * 
 * 실전 처방 프로토콜(Prescription Protocol) 모듈 타입 정의
 * 
 * 목적:
 * 하드코딩된 일률적 처방을 탈피하고, 상황별 표준 전술(대화 멘트, 서면 증빙 템플릿, 조직문화 기준표)을
 * 독립된 플러그인 모듈로 등록/교체할 수 있는 Plug-and-Play 아키텍처 제공.
 */

import { ProblemDomain } from '../../product-generator/types.js';
import { HeavenlyStem } from '../../../core/types.js';

export type ConflictPatternId = 
  | 'VERBAL_REVERSAL'      // 구두 지시 번복 / 책임 전가
  | 'PUBLIC_REPRIMAND'     // 공개 질책 / 인격 모독 / 감정적 비난
  | 'UNCLEAR_RNR'          // 불합리한 업무 배정 / 업무 폭탄 / 성과 가로채기
  | 'UNFAIR_EVALUATION'    // 승진 누락 / 불공정 평가 / 연봉 갈등
  | 'POLITICS_ISOLATION'   // 사내 정치 / 은근한 따돌림 / 정보 차단
  | 'UNIVERSAL_JOB';       // 직장 도메인 20% 범용 대응 프로토콜 (Fallback)

export interface ProtocolContext {
  domain: ProblemDomain;
  userTroubleText: string;
  dayStem?: HeavenlyStem;
  dayStemKorean?: string;
  strengthStatus?: string;
  strengthScore?: number;
  timePhase?: 'PRESSURE' | 'TRANSITION' | 'RELIEF' | 'OPPORTUNITY';
  targetYear?: number;
}

export interface DialogueScriptItem {
  triggerScenario: string;   // 이 말이 필요한 순간
  spokenScript: string;      // 실제 면전에서 구사할 3단 대화 멘트
  toneCaution: string;       // 기질별 말할 때의 태도/주의점
  objective: string;         // 이 발언으로 달성하는 전략적 목적
}

export interface EmailTemplateItem {
  purpose: string;           // 템플릿 목적
  subject: string;           // 이메일 제목 (복사해서 바로 쓸 수 있는 형태)
  bodyTemplate: string;      // 이메일 본문 템플릿
  recipientsGuide: string;   // 수신/참조자 가이드
  timingGuide: string;       // 발송 타이밍 가이드 (골든타임)
}

export interface OrgCultureCriteria {
  avoidCultureTypes: string[];       // 절대 피해야 할 조직 문화 유형
  recommendedCultureTypes: string[]; // 기질을 살릴 수 있는 추천 조직 문화 유형
  interviewCheckpoints: string[];    // 면접에서 상대 회사를 역검증할 수 있는 핵심 질문
}

export interface IPrescriptionProtocol {
  id: ConflictPatternId;
  title: string;
  domain: ProblemDomain;
  matches(rawText: string, context?: ProtocolContext): boolean;
  getDialogueScript(context?: ProtocolContext): DialogueScriptItem;
  getEmailTemplate(context?: ProtocolContext): EmailTemplateItem;
  getOrgCultureCriteria(context?: ProtocolContext): OrgCultureCriteria;
  getActionChecklist(context?: ProtocolContext): string[];
}
