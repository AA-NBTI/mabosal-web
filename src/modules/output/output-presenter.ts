/**
 * Phase 15: Output Presenter
 * 최종 프레젠테이션 생성기
 * 
 * 원칙 (명세서 Section 19):
 * 내부 계산값(연속 부동소수점)을 보존한 상태에서,
 * 최종 이용자용 프레젠테이션 계층에서만 10점 단위 판정 및 포맷팅을 수행합니다.
 */

import { FourPillars, Pillar } from '../../core/types.js';
import { SajuCoreOutput } from '../saju-core/saju-core-engine.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { MaResult } from '../ma/ma-types.js';
import { InterpretationOutput } from '../interpretation/interpretation-types.js';
import { BoundaryOutput } from '../boundary/boundary-engine.js';
import {
  MabosalPresentationResult,
  MabosalRequest,
  MaRankItem,
  PillarDisplayItem,
  SajuPillarsTable,
} from './output-types.js';

const STEM_HANJA: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
  기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
};

const BRANCH_HANJA: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
  오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
};

export class OutputPresenter {
  /**
   * 10점 단위 점수 밴드 판정 라벨
   */
  public static getScoreBand(score: number): string {
    if (score >= 90) return '90점대 - 압도적 작용력';
    if (score >= 80) return '80점대 - 매우 강한 작용력';
    if (score >= 70) return '70점대 - 강한 작용력';
    if (score >= 60) return '60점대 - 유의미한 영향력';
    if (score >= 50) return '50점대 - 중간 수준';
    if (score >= 40) return '40점대 - 보통 이하';
    if (score >= 30) return '30점대 - 미약한 작용';
    return '30점 미만 - 잠재/비활성 상태';
  }

  /**
   * 4주 기둥 표시용 아이템 구성
   */
  public static formatPillarItem(
    pillar: Pillar | null,
    position: 'year' | 'month' | 'day' | 'hour',
    sajuCore: SajuCoreOutput
  ): PillarDisplayItem | null {
    if (!pillar) return null;

    const tenGodEntry = sajuCore.ten_gods[position];
    const stemTenGod = tenGodEntry?.stemTenGod || (position === 'day' ? '일간' : '천간');
    const branchTenGod = tenGodEntry?.branchMainTenGod || '지지';
    const hiddenStems =
      tenGodEntry?.hiddenStemsTenGods?.map(h => `${h.stem}(${h.tenGod}, ${Math.round(h.ratio * 100)}%)`) || [];

    const stemHanja = STEM_HANJA[pillar.stem] || pillar.stem;
    const branchHanja = BRANCH_HANJA[pillar.branch] || pillar.branch;

    return {
      stemKorean: pillar.stem,
      stemHanja,
      stemTenGod,
      branchKorean: pillar.branch,
      branchHanja,
      branchTenGod,
      branchHiddenStems: hiddenStems,
    };
  }

  /**
   * 21개 전체 마 순위표 작성 (내림차순 정렬)
   */
  public static formatRankings(maOutput: MaModuleEngineOutput): MaRankItem[] {
    const list: MaResult[] = Object.values(maOutput.ma_results);
    list.sort((a, b) => b.presentation_score - a.presentation_score);

    return list.map((m, idx) => ({
      rank: idx + 1,
      maId: m.ma_id,
      koreanName: m.korean_name,
      score: Math.round(m.presentation_score * 10) / 10,
      band: this.getScoreBand(m.presentation_score),
      score5Axis: m.score_5axis,
      dominantInfluence:
        m.score_5axis.intensity > 70
          ? '강한 추진력'
          : m.score_5axis.pressure > 65
          ? '환경적 압박 주의'
          : m.score_5axis.opportunity > 65
          ? '개척 기회 풍부'
          : '안정적 유지',
    }));
  }

  /**
   * 전체 프레젠테이션 종합 조립
   */
  public static present(
    request: MabosalRequest,
    pillars: FourPillars,
    sajuCore: SajuCoreOutput,
    maOutput: MaModuleEngineOutput,
    interpOutput: InterpretationOutput,
    boundaryOutput?: BoundaryOutput
  ): MabosalPresentationResult {
    const interp = interpOutput.interpretation;
    const topMa = maOutput.top_ma;

    // 1. 사주 테이블
    const pillarsTable: SajuPillarsTable = {
      year: this.formatPillarItem(pillars.year, 'year', sajuCore)!,
      month: this.formatPillarItem(pillars.month, 'month', sajuCore)!,
      day: this.formatPillarItem(pillars.day, 'day', sajuCore)!,
      hour: this.formatPillarItem(pillars.hour, 'hour', sajuCore),
    };

    // 2. 8단계 프레젠테이션 섹션
    const sections = {
      keySummary: interp.keySummary.content,
      topMa: {
        name: topMa.korean_name,
        score: Math.round(topMa.presentation_score * 10) / 10,
        band: this.getScoreBand(topMa.presentation_score),
        description: interp.topMaAnalysis.content,
      },
      actionReason: interp.topMaAnalysis.bullets?.join('\n') || '',
      luckActivation: interp.luckActivationAnalysis.content,
      pressureAndRisk: interp.pressureFactors.content,
      opportunity: interp.opportunityFactors.content,
      actionAdvice: interp.actionGuidance.content,
      timeDependency: interp.timeDependencyNotice.content,
    };

    // 3. 21개 전체 마 순위표
    const maRankings = this.formatRankings(maOutput);

    // 4. 질문 맞춤 답변
    let questionAnswer: MabosalPresentationResult['questionAnswer'];
    if (interp.questionSpecificAnalysis) {
      const q = interp.questionSpecificAnalysis;
      questionAnswer = {
        questionText: request.question || '',
        domain: q.bullets?.[0] || '일반 상담',
        topTargetMa: q.bullets?.[1] || topMa.korean_name,
        analysisText: q.content,
      };
    }

    // 5. 경계시간 분석 결과
    let boundaryAnalysis: MabosalPresentationResult['boundaryAnalysis'];
    if (boundaryOutput && (boundaryOutput.is_boundary_sensitive || boundaryOutput.boundary_simulation.hasBoundaryIssue)) {
      const sim = boundaryOutput.boundary_simulation;
      const cands = sim.candidates;
      boundaryAnalysis = {
        isBoundarySensitive: boundaryOutput.is_boundary_sensitive,
        candidateA: {
          timeLabel: cands[0]?.label || '후보 A',
          topMa: cands[0]?.hourPillarName || '사시',
          score: cands[0]?.strengthScore || 70,
        },
        candidateB: {
          timeLabel: cands[1]?.label || '후보 B',
          topMa: cands[1]?.hourPillarName || '오시',
          score: cands[1]?.strengthScore || 70,
        },
        consensus: sim.consensusItems.join(' / ') || '공통 경향 유지',
      };
    }

    return {
      pillarsTable,
      dayMasterElement: sajuCore.day_element,
      dayMasterStrength: {
        score: Math.round(sajuCore.day_master_strength.totalStrengthScore * 10) / 10,
        category: sajuCore.day_master_strength.classification,
      },
      sections,
      maRankings,
      questionAnswer,
      boundaryAnalysis,
      narrativeText: interpOutput.fullNarrative,
      meta: {
        version: '1.0.0',
        confidence: Math.round((boundaryOutput?.overall_confidence ?? 100.0) * 10) / 10,
        appliedTaste: interp.appliedTaste,
        appliedCharacter: interp.appliedCharacter,
        analyzedAt: new Date().toISOString(),
        isMissingHour: pillars.hour === null,
      },
    };
  }
}
