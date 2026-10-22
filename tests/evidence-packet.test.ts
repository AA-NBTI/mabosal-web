import { describe, it, expect } from 'vitest';
import { LifeAnalysisWarehouseBuilder } from '../src/modules/life-analysis/life-analysis-warehouse.js';
import { buildEvidencePacket, scopeEvidencePacket } from '../src/modules/life-analysis/evidence/evidence-packet-builder.js';
import { EVIDENCE_CODE_GLOSSARY, resolveDomains } from '../src/modules/life-analysis/evidence/evidence-glossary.js';

describe('Saju Evidence Packet (L1/L2) System Verification', () => {
  const builder = new LifeAnalysisWarehouseBuilder();
  const wh = builder.buildWarehouse({
    birthYear: 1998,
    birthMonth: 4,
    birthDay: 12,
    birthHour: 9,
    birthMinute: 20,
    gender: 'female',
    calendarType: 'solar',
  });

  it('기존 Warehouse로부터 완전한 Evidence Packet(L1)이 생성되어야 한다', () => {
    const packet = buildEvidencePacket(wh, { wolwoonYears: [2026, 2027] });
    expect(packet.schema).toBe('mabosal.saju.evidence/v1');
    expect(packet.subject.dayMaster.stem).toBe('기');
    expect(packet.subject.dayMaster.element).toBe('토');
    expect(packet.timeline.daewoon.length).toBe(10);
    expect(packet.timeline.sewoon.length).toBe(101); // 0~100세
    expect(packet.timeline.wolwoon.length).toBe(2); // 2026, 2027
    expect(packet.timeline.wolwoon[0].months.length).toBe(12);

    // 요인 검증: 모든 요인은 id를 가지며, domain과 participants가 누락 없이 연결되어야 함
    expect(packet.evidence.length).toBeGreaterThan(50);
    const firstFactor = packet.evidence[0];
    expect(firstFactor.id).toBeDefined();
    expect(firstFactor.domains.length).toBeGreaterThan(0);
    expect(firstFactor.participants.length).toBeGreaterThan(0);
  });

  it('2026년(병오년) 세운의 핵심 팩터(축오해, 건록 등) 및 지장간 기전이 정확히 추출되어야 한다', () => {
    const packet = buildEvidencePacket(wh, { wolwoonYears: [2026] });
    const sw2026 = packet.timeline.sewoon.find(s => s.year === 2026);
    expect(sw2026).toBeDefined();
    expect(sw2026?.ganji).toBe('병오');

    // 2026년 요인들 조회
    const factors = packet.evidence.filter(e => e.scope.type === 'sewoon' && e.scope.year === 2026);
    
    // 축오해 요인 검사
    const chukOhHae = factors.find(f => f.code === 'REL_HAE' && f.key.includes('축오해'));
    expect(chukOhHae).toBeDefined();
    expect(chukOhHae?.palace).toBe('SELF_SPOUSE'); // 일지 축토 ↔ 세운 오화
    expect(chukOhHae?.weight).toBe(-12);
    expect(chukOhHae?.domains).toContain('RELATIONSHIP');

    // 12운성 건록 검사 (기토 일간 -> 오화 = 건록)
    const geonrok = factors.find(f => f.code === 'STAGE_STRONG' && f.key === '건록');
    expect(geonrok).toBeDefined();
    expect(geonrok?.weight).toBe(20);
    expect(geonrok?.polarity).toBe('up');
  });

  it('L2 해석 사전(Glossary)의 모든 코드가 올바르게 정의되어 있어야 한다', () => {
    const chung = EVIDENCE_CODE_GLOSSARY.REL_CHUNG;
    expect(chung.label).toBe('충');
    expect(chung.keywords).toContain('정면 충돌');

    const domains = resolveDomains('REL_CHUNG', 'SELF_SPOUSE', '비견');
    expect(domains).toContain('GENERAL');
    expect(domains).toContain('RELATIONSHIP');
    expect(domains).toContain('WEALTH');
  });

  it('공개 범위별(scopeEvidencePacket) 필터링이 안전하게 작동해야 한다', () => {
    const packet = buildEvidencePacket(wh, { wolwoonYears: [2026] });
    
    // Partner 범위: 생년월일시 및 나이 정보 마스킹 확인
    const partnerPacket = scopeEvidencePacket(packet, 'partner');
    expect(partnerPacket.disclosure).toBe('partner');
    expect(partnerPacket.subjectInput).toBeUndefined();
    expect(partnerPacket.timeline.sewoon[0].age).toBeUndefined();

    // Free 범위: 현재 대운 및 올해/내년 세운만 노출
    const freePacket = scopeEvidencePacket(packet, 'free');
    expect(freePacket.disclosure).toBe('free');
    expect(freePacket.timeline.daewoon.length).toBe(1);
    expect(freePacket.timeline.sewoon.length).toBe(2);
    expect(freePacket.timeline.wolwoon.length).toBe(0);
  });
});
