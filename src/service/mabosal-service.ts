/**
 * Phase 15: Mabosal Service Facade
 * 마보살 엔진 통합 서비스 파사드
 * 
 * 마보살의 15개 전체 모듈을 결함 격리(Fault-tolerant) 및 무결성 보장 하에
 * 엔드투엔드로 조율하는 단일 통합 서비스 진입점.
 */

import { CalendarEngine } from '../modules/calendar/calendar-engine.js';
import { PillarEngine } from '../modules/pillar/pillar-engine.js';
import { SajuCoreEngine } from '../modules/saju-core/saju-core-engine.js';
import { RelationshipEngine } from '../modules/relationship/relationship-engine.js';
import { BoundaryEngine } from '../modules/boundary/boundary-engine.js';
import { LuckEngine } from '../modules/luck/luck-engine.js';
import { SignalEngine } from '../modules/signal/signal-engine.js';
import { MaModuleEngine } from '../modules/ma/ma-module-engine.js';
import { InteractionEngine } from '../modules/interaction/interaction-engine.js';
import { QuestionEngine } from '../modules/question/question-engine.js';
import { InterpretationEngine } from '../modules/interpretation/interpretation-engine.js';
import { OutputPresenter } from '../modules/output/output-presenter.js';
import { MabosalPresentationResult, MabosalRequest } from '../modules/output/output-types.js';

export class MabosalService {
  private calEngine = new CalendarEngine();
  private pilEngine = new PillarEngine();
  private coreEngine = new SajuCoreEngine();
  private relEngine = new RelationshipEngine();
  private boundEngine = new BoundaryEngine();
  private luckEngine = new LuckEngine();
  private signalEngine = new SignalEngine();
  private maEngine = new MaModuleEngine();
  private interactionEngine = new InteractionEngine();
  private questionEngine = new QuestionEngine();
  private interpEngine = new InterpretationEngine();

  /**
   * 마보살 사주 및 마(Ma) 통합 분석 엔드포인트
   */
  public analyze(request: MabosalRequest): MabosalPresentationResult {
    // 1. 역법 엔진 (Calendar)
    const cal = this.calEngine.execute({
      birth_date: request.birthDate,
      birth_time: request.birthTime ?? null,
      region: request.region || 'Seoul',
    });

    // 2. 기둥 엔진 (Pillar)
    const pil = this.pilEngine.execute(cal.data);

    // 3. 사주 핵심 엔진 (Saju Core)
    const core = this.coreEngine.execute(pil.data);

    // 4. 관계 엔진 (Relationship)
    const rel = this.relEngine.execute({ four_pillars: pil.data.four_pillars });

    // 5. 경계 및 누락 데이터 엔진 (Boundary)
    const bound = this.boundEngine.execute({
      pillar_output: pil.data,
      saju_core_output: core.data,
    });

    // 6. 운 엔진 (Luck)
    const birthYear = parseInt(request.birthDate.split('-')[0], 10);
    const targetDateStr = request.targetDate || new Date().toISOString().split('T')[0];
    const luck = this.luckEngine.execute({
      four_pillars: pil.data.four_pillars,
      birth_date_utc: cal.data.solar_datetime,
      birth_year: birthYear,
      gender: request.gender || 'male',
      target_date: targetDateStr,
    });

    // 7. 신호 엔진 (Signal)
    const sig = this.signalEngine.execute({
      saju_core: core.data,
      relationship: rel.data,
    });

    // 8. 21개 마 모듈 엔진 (Ma Module)
    const ma = this.maEngine.execute({
      signals: sig.data,
      targetDateStr,
    });

    // 9. 상호작용 엔진 (Interaction)
    const interaction = this.interactionEngine.analyze(ma.data);

    // 10. 질문 엔진 (Question - 옵션)
    let questionOutput: any = undefined;
    if (request.question && request.question.trim().length > 0) {
      const qRes = this.questionEngine.execute({
        questionText: request.question,
        ma_output: ma.data,
      });
      questionOutput = qRes.data;
    }

    // 11. 해석 엔진 (Interpretation)
    const missingHour = bound.data.missing_hour;
    const interp = this.interpEngine.execute({
      maOutput: ma.data,
      questionOutput,
      interactionOutput: interaction,
      tasteType: request.taste || 'standard',
      characterType: request.character || 'default',
      timeDependency: {
        isMissingHour: missingHour.isMissingHour,
        timeDependencyScore: missingHour.timeDependencyScore,
        confidence: missingHour.confidence,
        sensitiveAreas: missingHour.sensitiveAreas.map(a => a.areaName),
        userGuidanceMessage: missingHour.userGuidanceMessage,
      },
    });

    // 12. 최종 프레젠테이션 계층 조립 (Output Presenter)
    return OutputPresenter.present(
      request,
      pil.data.four_pillars,
      core.data,
      ma.data,
      interp.data,
      bound.data
    );
  }
}
