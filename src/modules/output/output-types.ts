/**
 * Phase 15: Output Layer Types
 * 마보살 최종 프레젠테이션 및 서비스 통합 타입 정의
 * 
 * 명세서 요구사항 (Section 19, 21, 22):
 * 1. 내부 계산값(0~100 부동소수점)과 이용자용 표현을 엄격히 분리.
 * 2. 8단계 표준 출력:
 *    (1) 핵심 결과
 *    (2) 가장 강한 마
 *    (3) 작용 이유
 *    (4) 현재 운에서 활성화된 부분
 *    (5) 부담 요소
 *    (6) 기회 요소
 *    (7) 생활 조언
 *    (8) 정보 부족·시간 의존성
 * 3. 10점 단위 판정 라벨링은 프레젠테이션 계층에서만 적용.
 */

import { FourPillars, Score5Axis, TimeDependencyInfo } from '../../core/types.js';
import { MaId, MaResult } from '../ma/ma-types.js';
import { TasteType } from '../taste/taste-types.js';
import { CharacterType } from '../character/character-types.js';
import { StructuredInterpretation } from '../interpretation/interpretation-types.js';
import { BoundaryOutput } from '../boundary/boundary-engine.js';

export interface MabosalRequest {
  birthDate: string;           // YYYY-MM-DD
  birthTime?: string | null;   // HH:mm (null이면 시간 미상 분석)
  gender?: 'male' | 'female';  // 기본값: 'male'
  targetDate?: string;         // 운 분석 기준일 (기본값: 오늘)
  question?: string;           // 자연어 질문 (예: "이직 고민입니다", "사업을 해도 될까요?")
  taste?: TasteType;           // 'mild' | 'standard' | 'spicy' | 'cold' | 'realistic' | 'bodhisattva' | 'direct'
  character?: CharacterType;   // 'default' | 'direct' | 'warm' | 'analytical' | 'realistic'
  region?: string;             // 출생 지역 (기본값: 'Seoul')
}

export interface PillarDisplayItem {
  stemKorean: string;
  stemHanja: string;
  stemTenGod: string;
  branchKorean: string;
  branchHanja: string;
  branchTenGod: string;
  branchHiddenStems: string[];
}

export interface SajuPillarsTable {
  year: PillarDisplayItem;
  month: PillarDisplayItem;
  day: PillarDisplayItem;
  hour: PillarDisplayItem | null; // hour=null 완벽 보존
}

export interface MaRankItem {
  rank: number;
  maId: MaId;
  koreanName: string;
  score: number;               // 표시용 점수 (소수점 1자리)
  band: string;                // 10점 단위 판정 (예: "70점대 - 강한 작용")
  score5Axis: Score5Axis;
  dominantInfluence: string;
}

export interface MabosalPresentationResult {
  // 1. 사주 명식 기본표 (연·월·일·시)
  pillarsTable: SajuPillarsTable;
  dayMasterElement: string;    // 일간 오행
  dayMasterStrength: {
    score: number;
    category: string;
  };

  // 2. 8단계 표준 프레젠테이션
  sections: {
    keySummary: string;
    topMa: {
      name: string;
      score: number;
      band: string;
      description: string;
    };
    actionReason: string;
    luckActivation: string;
    pressureAndRisk: string;
    opportunity: string;
    actionAdvice: string;
    timeDependency: string;
  };

  // 3. 21개 전체 마 순위표 (정렬 완료)
  maRankings: MaRankItem[];

  // 4. 질문 맞춤형 답변 (질문 입력 시)
  questionAnswer?: {
    questionText: string;
    domain: string;
    topTargetMa: string;
    analysisText: string;
  };

  // 5. 경계시간 분석 결과 (경계구간인 경우)
  boundaryAnalysis?: {
    isBoundarySensitive: boolean;
    candidateA: { timeLabel: string; topMa: string; score: number };
    candidateB: { timeLabel: string; topMa: string; score: number };
    consensus: string;
  };

  // 6. 종합 완성형 서사 텍스트 (줄글)
  narrativeText: string;

  // 7. 엔진 메타데이터 및 신뢰도
  meta: {
    version: string;
    confidence: number;
    appliedTaste: TasteType;
    appliedCharacter: CharacterType;
    analyzedAt: string;
    isMissingHour: boolean;
  };
}
