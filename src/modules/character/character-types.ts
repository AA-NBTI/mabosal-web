/**
 * Phase 12: Character Module Types
 * 마보살 캐릭터 모듈 인터페이스 및 타입 정의
 * 
 * 원칙: 캐릭터는 계산값을 절대로 변경하지 않는다 (원국/마 점수 불변).
 */

import { EngineResult } from '../../core/types.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { TasteOutput } from '../taste/taste-types.js';

export type CharacterType =
  | 'default'      // 기본 마보살: 신비롭고 영험하면서도 핵심을 꿰뚫는 사주 도사
  | 'direct'       // 직설형: 돌려 말하지 않고 뼈를 때리는 단도직입 조언가
  | 'warm'         // 따뜻한형: 공감하고 보듬어주며 용기를 북돋는 힐러
  | 'analytical'   // 냉정분석형: 데이터와 논리, 확률과 메커니즘으로 해설하는 전략가
  | 'realistic'    // 현실조언형: 바로 실행할 수 있는 현실적 해법을 짚어주는 실무 멘토
  | string;        // 확장 캐릭터 슬롯

export interface CharacterProfile {
  characterId: CharacterType;
  name: string;
  title: string;
  persona: string;             // 페르소나 설명
  toneAndManner: string;       // 어조 및 문체 특징
  addressTitle: string;        // 사용자 호칭 (예: "보살님", "당신", "의뢰인", "선생님")
  greeting: string;            // 시작 인사
  closing: string;             // 맺음말
  adviceFocus: 'spiritual' | 'practical' | 'actionable' | 'strategic' | 'empathetic';
}

export interface CharacterExpressions {
  characterId: CharacterType;
  characterName: string;
  salutation: string;          // 맞춤형 첫인사 (호칭 포함)
  diagnosisLead: string;       // 마/명식 진단 서두
  topMaPersonaComment: string; // 캐릭터 시선으로 본 최상위 마 해설
  guidanceComment: string;     // 캐릭터 고유의 실행 제언
  farewell: string;            // 마무리 배웅 문구
}

export interface CharacterInput {
  maOutput: MaModuleEngineOutput;
  tasteOutput?: TasteOutput<MaModuleEngineOutput>;
  characterType?: CharacterType;
  customProfile?: CharacterProfile;
}

export interface CharacterOutput<T = MaModuleEngineOutput> {
  // 지시서 원칙: 계산 엔진 결과는 100% 온전하게 보존
  rawCalculationResult: T;
  characterProfile: CharacterProfile;
  characterExpressions: CharacterExpressions;
}

export type CharacterEngineOutput = EngineResult<CharacterOutput<MaModuleEngineOutput>>;
