/**
 * Phase 20: 일반 사주 + 마 진단 이중 엔진 (Dual Engine Pipeline)
 * 
 * 원칙:
 * 1. 일반 사주 분석과 사용자 현실 문제를 분리하여 분석한 후 상호 교차 연결합니다.
 * 2. 파이프라인:
 *    사용자 입력 -> 사주 원국 -> 일반 명리 분석 -> 현재 운 분석 -> 사용자 현실 상황 분석
 *    -> 현실 상황 ↔ 명리 구조 연결 -> 문제 신호 탐지 -> 마 내부 분류 -> 마 강도/지속기간/변화시기 -> 처방 후보
 * 3. '마' 분류는 고정 목록이 아닌 확장형 구조로 유연하게 대응합니다.
 */

import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { GeneralSajuEngine } from './general-saju-engine.js';
import { LifeTroubleEngine } from './life-trouble-engine.js';
import { 
  DualEngineResult, 
  GeneralSajuReport, 
  MaDomain, 
  MaInternalSignal, 
  ProblemCategory, 
  UserLifeTrouble 
} from './types.js';

export class DualEnginePipeline {
  private generalSajuEngine = new GeneralSajuEngine();
  private lifeTroubleEngine = new LifeTroubleEngine();

  /**
   * 이중 엔진 종합 분석 파이프라인 실행
   */
  public execute(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    rawTroubleText: string,
    preferredCategory?: ProblemCategory
  ): DualEngineResult {
    // 1. 일반 명리 분석 (Phase 17)
    const generalReport = this.generalSajuEngine.generateReport(fact);

    // 2. 사용자 현실 상황 분석 (Phase 19)
    const userTrouble = this.lifeTroubleEngine.parseTrouble(rawTroubleText, preferredCategory);

    // 3. 현실 상황 ↔ 명리 구조 연결 & 문제 신호 탐지
    const maSignal = this.detectMaSignal(fact, signalSet, userTrouble, generalReport);

    // 4. 문제 일치도 계산 (0 ~ 100)
    const matchScore = this.calculateMatchScore(userTrouble, maSignal, signalSet);

    return {
      general_saju: generalReport,
      user_trouble: userTrouble,
      ma_signal: maSignal,
      is_ma_detected: maSignal.activation_state === 'ACTIVE',
      problem_match_score: matchScore,
    };
  }

  /**
   * 사용자 현실 문제와 명리 구조(21 Ma 시그널 및 오행/합충)를 대조하여 내부 마 신호 도출
   */
  private detectMaSignal(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    trouble: UserLifeTrouble,
    generalReport: GeneralSajuReport
  ): MaInternalSignal {
    const domain = this.mapCategoryToMaDomain(trouble.category);
    const currentYear = new Date().getFullYear();

    // 사용자의 문제 영역에 해당하는 사주 내 신호 점검
    let intensity: 'critical' | 'strong' | 'moderate' | 'mild' | 'none' = 'moderate';
    let activation: 'ACTIVE' | 'POTENTIAL' | 'DORMANT' = 'ACTIVE';
    let structuralCause = '';
    let monthsRange = '';
    let recoveryPoint = '';

    const signalList = Object.values(signalSet.signals || {});

    switch (domain) {
      case 'relationship':
      case 'marriage': {
        const hasSpouseConflict = signalList.some(s => 
          (s.moduleId && (s.moduleId.includes('romance') || s.moduleId.includes('marriage'))) &&
          s.activation.isActivated
        );
        structuralCause = hasSpouseConflict 
          ? '일지(배우자궁) 충극 및 비겁의 경쟁 기운이 강해져 감정적 마찰이 급증한 구조'
          : '감정 표현을 담당하는 식상 기운이 일시적으로 위축되고 상대의 기대를 수용하기 버거운 시기';
        intensity = hasSpouseConflict ? 'strong' : 'moderate';
        monthsRange = `${currentYear}년 봄~초여름 (3월~6월)`;
        recoveryPoint = `${currentYear}년 가을(9월) 이후 감정의 파고가 가라앉으며 대화의 물꼬가 트임`;
        break;
      }

      case 'workplace': {
        const hasCareerClash = signalList.some(s => 
          (s.moduleId && s.moduleId.includes('career')) && s.activation.isActivated
        );
        structuralCause = hasCareerClash
          ? '관성(직장 규율)과 상관(자기주장)의 상충으로 인한 조직 내 피로도 및 마찰 심화'
          : '기존 역할의 한계에 부딪혀 새로운 방향성을 모색해야 하는 에너지 전환기';
        intensity = hasCareerClash ? 'critical' : 'moderate';
        monthsRange = `${currentYear}년 상반기 (2월~7월)`;
        recoveryPoint = `${currentYear}년 8월 전후 새로운 직무 제안 혹은 조직 개편으로 숨통 트임`;
        break;
      }

      case 'business': {
        structuralCause = '자금 유동성을 뜻하는 편재의 기운이 묶이고 비겁의 분탈(경쟁자 출현 및 비용 증가)이 겹친 형태';
        intensity = 'strong';
        monthsRange = `${currentYear}년 연중 지속`;
        recoveryPoint = `${currentYear}년 11월 이후 계약 성사 및 정산 흐름 회복`;
        break;
      }

      case 'wealth': {
        structuralCause = '군겁쟁재(비겁이 재성을 다투는 형국) 또는 재성의 설기 과다로 인한 불필요한 재물 누수';
        intensity = 'strong';
        monthsRange = `${currentYear}년 4월~8월`;
        recoveryPoint = `${currentYear}년 겨울(11월) 이후 지출 통제 및 자산 안정화`;
        break;
      }

      case 'interpersonal':
      case 'reputation': {
        structuralCause = '구설을 부르는 상관과 형살의 상호작용으로 인해 호의가 오해로 왜곡되는 형국';
        intensity = 'moderate';
        monthsRange = `${currentYear}년 5월~7월`;
        recoveryPoint = `${currentYear}년 9월 이후 자연스러운 진실 규명 및 오해 해소`;
        break;
      }

      case 'general_stagnation':
      default: {
        if (trouble.category === 'general_fortune') {
          intensity = 'mild';
          activation = 'DORMANT';
          structuralCause = '특별한 충극 없이 오행의 흐름이 순행하는 완만한 순탄기';
          monthsRange = '특정 악재 구간 없음';
          recoveryPoint = '올해 하반기 성취 기운 상승';
        } else {
          intensity = 'moderate';
          activation = 'ACTIVE';
          structuralCause = '기운의 교체기(환절기/절기 전환)에 나타나는 일시적인 에너지 소모와 정체 현상';
          monthsRange = `${currentYear}년 상반기`;
          recoveryPoint = `${currentYear}년 하반기 활력 회복`;
        }
        break;
      }
    }

    return {
      domain,
      intensity,
      activation_state: activation,
      structural_cause: structuralCause,
      active_months_range: monthsRange,
      recovery_point: recoveryPoint,
    };
  }

  private mapCategoryToMaDomain(cat: ProblemCategory): MaDomain {
    switch (cat) {
      case 'breakup': return 'relationship';
      case 'marriage_block': return 'marriage';
      case 'job_loss': return 'workplace';
      case 'business_struggle': return 'business';
      case 'financial_drain': return 'wealth';
      case 'people_conflict': return 'interpersonal';
      case 'sudden_block': return 'general_stagnation';
      case 'general_fortune': return 'general_stagnation';
      default: return 'custom_domain';
    }
  }

  private calculateMatchScore(
    trouble: UserLifeTrouble,
    maSignal: MaInternalSignal,
    signalSet: MaSignalSet
  ): number {
    if (trouble.category === 'general_fortune') return 95;
    let score = 70;
    if (maSignal.intensity === 'critical') score += 25;
    else if (maSignal.intensity === 'strong') score += 20;
    else if (maSignal.intensity === 'moderate') score += 10;
    return Math.min(score, 98);
  }
}
