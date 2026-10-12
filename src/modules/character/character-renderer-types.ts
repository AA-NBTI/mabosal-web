/**
 * src/modules/character/character-renderer-types.ts
 * 
 * Phase 76: 캐릭터 표현 계층 분리 타입 정의 (Character Presentation Layer Types)
 * 
 * 핵심 구조:
 * 명리 계산 → 판정 → 출력 대상 결정 → 캐릭터 표현 → 고객 출력
 * 
 * "판정 데이터(StructuredDeliverableJudgments)를 입력으로만 사용하여,
 * 캐릭터는 표현(말투, 문장 길이, 설명 방식, 직접성, 공감도)만 변경한다."
 */

import { StructuredDeliverableJudgments, CustomerDeliverable } from '../product-generator/types.js';

export type CharacterTone = 'mystic' | 'warm' | 'direct' | 'analytical' | 'realistic';
export type CharacterIntensity = 'high' | 'medium' | 'low';
export type ExplanationStyle = 'storytelling' | 'analytical' | 'metaphorical' | 'concise';
export type SentenceStyle = 'formal' | 'intimate' | 'authoritative' | 'conversational';
export type EmphasisStyle = 'bold' | 'gentle' | 'logical';
export type WarningStyle = 'cautious' | 'sharp' | 'protective';

export interface CharacterPresentationProfile {
  characterId: string;
  name: string;
  tone: CharacterTone;
  directness: CharacterIntensity;
  empathy: CharacterIntensity;
  explanationStyle: ExplanationStyle;
  sentenceStyle: SentenceStyle;
  emphasisStyle: EmphasisStyle;
  warningStyle: WarningStyle;
  greetingPrefix?: string;
  closingSuffix?: string;
}

export interface CharacterRenderInput {
  judgments: StructuredDeliverableJudgments;
  characterProfile?: CharacterPresentationProfile;
  insightDepth?: number;
  birthDate?: string;
  targetYear?: number;
  safeguardNotice?: string;
}

export interface ICharacterRenderer {
  render(input: CharacterRenderInput): CustomerDeliverable;
}
