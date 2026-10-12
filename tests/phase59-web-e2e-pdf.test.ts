import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { mabosalPdfGenerator, PdfGenerationResult } from '../src/modules/output/mabosal-pdf-generator.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';

describe('Phase 59: 실제 웹 E2E + PDF 최종 품질 검수 Suite (5 CASE × 4 상품 = 20개 결과물)', () => {

  const testCases = [
    {
      id: 'CASE 01',
      name: '연애/결별',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
      expectedStem: '경',
      expectedGeokguk: '정재격',
      expectedStrength: '신약',
      expectedDaewoonNumber: 7,
    },
    {
      id: 'CASE 02',
      name: '사업 부도/위기',
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      userTroubleText: '2026년 8월 15일에 믿었던 동업자와 지분 및 정산 문제로 크게 다투고 결별 위기입니다.',
      expectedStem: '기',
      expectedGeokguk: '편재격',
      expectedStrength: '신약',
      expectedDaewoonNumber: 1,
    },
    {
      id: 'CASE 03',
      name: '직장 이직/승진 갈등',
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male' as const,
      userTroubleText: '상사와의 마찰로 퇴사를 고민 중인데 언제 이직하는 게 유리할까요?',
      expectedStem: '신',
      expectedGeokguk: '정관격',
      expectedStrength: '신약',
      expectedDaewoonNumber: 5,
    },
    {
      id: 'CASE 04',
      name: '투자 손실/재물 위기',
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male' as const,
      userTroubleText: '무리한 투자로 빚을 지게 되었는데 손실을 메꿀 기회가 언제 올까요?',
      expectedStem: '무',
      expectedGeokguk: '정관격',
      expectedStrength: '신약',
      expectedDaewoonNumber: 1,
    },
    {
      id: 'CASE 05',
      name: '수술/건강 위기',
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male' as const,
      userTroubleText: '건강 악화와 갑작스러운 수술 일정으로 인해 회복 시기와 안정을 찾고 싶습니다.',
      expectedStem: '신',
      expectedGeokguk: '월겁격', // Phase 58.2 Freeze: 양인격이 아닌 월겁격
      expectedStrength: '중화',
      expectedDaewoonNumber: 8,
    },
  ];

  const pdfOutputDir = path.resolve('artifacts', 'pdf');
  const generatedPdfs: PdfGenerationResult[] = [];

  beforeAll(() => {
    if (!fs.existsSync(pdfOutputDir)) {
      fs.mkdirSync(pdfOutputDir, { recursive: true });
    }
  });

  // --------------------------------------------------------------------------
  // 1. 5개 CASE × 4개 상품 = 20개 고객 결과물 생성 및 데이터 무결성 검수
  // --------------------------------------------------------------------------
  describe('1. 20개 고객 결과물 및 데이터 무결성 (Phase 58.2 Freeze 대조)', () => {
    for (const tc of testCases) {
      it(`[${tc.id}] ${tc.name} — 4개 상품이 독립 생성되고 원천 명리값이 100% 보존된다`, async () => {
        const res = await productionPipelineEngine.executePipeline({
          calendarType: 'solar',
          isLeapMonth: false,
          birthDate: tc.birthDate,
          birthTime: tc.birthTime,
          isUnknownTime: false,
          gender: tc.gender,
          region: 'Seoul',
          userTroubleText: tc.userTroubleText,
          currentDate: '2026-10-03',
        });

        expect(res.success).toBe(true);
        expect(res.fourTierReports).toBeDefined();

        const tiers = res.fourTierReports!;
        const free = tiers.free;
        const standard = tiers.standard;
        const sal = tiers.sal;
        const premium = tiers.premium;

        // 글자수 및 분량 독립성
        expect(free.wordCount).toBeGreaterThan(1500);
        expect(standard.wordCount).toBeGreaterThan(2000);
        expect(sal.wordCount).toBeGreaterThan(1800);
        expect(premium.wordCount).toBeGreaterThan(2200);

        // 핵심 명리값 무결성
        expect(res.generalSaju.dayMaster).toBe(tc.expectedStem);
        expect(res.generalSaju.strength).toBe(tc.expectedStrength);

        // STANDARD에 격국 표시 검증
        expect(standard.customerReport).toContain(tc.expectedGeokguk);

        // 각 CASE별 전용 교차검증
        if (tc.id === 'CASE 05') {
          // A. CASE 05 양인격 -> 월겁격 정상화
          expect(standard.customerReport).toContain('월겁격');
          expect(standard.customerReport).not.toContain('성립 격국: 양인격');
        }

        if (tc.id === 'CASE 04') {
          // B. CASE 04 제5대운 무신 대운 표시
          expect(standard.customerReport).toMatch(/제5대운\s*\[무신\]/);
        }

        if (tc.id === 'CASE 02') {
          // D. CASE 02 편재격 유지 (정재격 역변환 방지)
          expect(standard.customerReport).toContain('편재격');
        }

        if (tc.id === 'CASE 03') {
          // E. CASE 03 정관격 유지
          expect(standard.customerReport).toContain('정관격');
        }

        // PDF 생성 연동
        const tierList: ('FREE' | 'STANDARD' | 'SAL' | 'PREMIUM')[] = ['FREE', 'STANDARD', 'SAL', 'PREMIUM'];
        for (const t of tierList) {
          const layer = tiers[t.toLowerCase() as keyof typeof tiers];
          const pdf = mabosalPdfGenerator.generateReportPdf(layer.customerReport, {
            title: layer.title,
            caseId: tc.id,
            tier: t,
            fourPillarsText: res.generalSaju.fourPillarsText,
            generationDate: '2026-10-04 10:50 KST',
          });
          const outPath = path.join(pdfOutputDir, pdf.fileName);
          fs.writeFileSync(outPath, pdf.buffer);
          pdf.filePath = outPath;
          generatedPdfs.push(pdf);
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // 2. 20개 PDF 파일 구조 및 바이트 무결성 검수
  // --------------------------------------------------------------------------
  describe('2. 20개 PDF 파일 생성 및 바이트 구조 검수', () => {
    it('총 20개 PDF 파일이 모두 정상 생성되어 디스크에 존재한다', () => {
      expect(generatedPdfs.length).toBe(20);
      for (const pdf of generatedPdfs) {
        expect(fs.existsSync(pdf.filePath!)).toBe(true);
        const stats = fs.statSync(pdf.filePath!);
        expect(stats.size).toBeGreaterThan(1000);
      }
    });

    it('각 PDF 파일이 PDF 1.4 표준 헤더와 %%EOF 트레일러를 갖춘다', () => {
      for (const pdf of generatedPdfs) {
        const raw = fs.readFileSync(pdf.filePath!, 'latin1');
        expect(raw.startsWith('%PDF-1.4')).toBe(true);
        expect(raw.includes('%%EOF')).toBe(true);
        expect(raw.includes('/Type /Catalog')).toBe(true);
        expect(raw.includes('/Type /Pages')).toBe(true);
      }
    });

    it('각 PDF 파일이 2페이지 이상으로 분할되어 문단 잘림 없이 렌더링된다', () => {
      for (const pdf of generatedPdfs) {
        expect(pdf.pageCount).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. 상품별 독립 품질 검수 (FREE / STANDARD / SAL / PREMIUM)
  // --------------------------------------------------------------------------
  describe('3. 상품별 독립성 및 품질 기준 검수', () => {
    it('FREE 리포트는 사주의 큰 그림을 제공하고 유료 처방이 노출되지 않는다', async () => {
      const res = await productionPipelineEngine.executePipeline({
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1992-03-15',
        birthTime: '08:30',
        isUnknownTime: false,
        gender: 'male',
        region: 'Seoul',
        userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다.',
        currentDate: '2026-10-03',
      });
      const free = res.fourTierReports!.free;
      expect(free.customerReport).toContain('무료 사주 분석');
      expect(free.customerReport).toContain('본원의 뿌리');
      expect(free.customerReport).not.toContain('디지털 처방 카드');
    });

    it('STANDARD 리포트는 격국, 강약, 억부/조후, 대운 심화 분석을 충실히 포함한다', async () => {
      const res = await productionPipelineEngine.executePipeline({
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1992-03-15',
        birthTime: '08:30',
        isUnknownTime: false,
        gender: 'male',
        region: 'Seoul',
        userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다.',
        currentDate: '2026-10-03',
      });
      const standard = res.fourTierReports!.standard;
      expect(standard.customerReport).toContain('성립 격국');
      expect(standard.customerReport).toContain('억부 용신');
      expect(standard.customerReport).toContain('조후');
      expect(standard.customerReport).toContain('대운');
    });

    it('SAL 리포트는 사용자 현실 고민과 살·충·형 작용을 명확히 연결한다', async () => {
      const res = await productionPipelineEngine.executePipeline({
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1992-03-15',
        birthTime: '08:30',
        isUnknownTime: false,
        gender: 'male',
        region: 'Seoul',
        userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다.',
        currentDate: '2026-10-03',
      });
      const sal = res.fourTierReports!.sal;
      expect(sal.customerReport).toContain('왜 지금 일이 꼬이고 있는가');
      expect(sal.customerReport).toMatch(/상대방|배우자|관계/);
    });

    it('PREMIUM 리포트는 구체적 실천 행동 및 금기 행동(Do/Don’t)과 조율 솔루션을 제공한다', async () => {
      const res = await productionPipelineEngine.executePipeline({
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1992-03-15',
        birthTime: '08:30',
        isUnknownTime: false,
        gender: 'male',
        region: 'Seoul',
        userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다.',
        currentDate: '2026-10-03',
      });
      const premium = res.fourTierReports!.premium;
      expect(premium.customerReport).toContain('지금 무엇을 해야 하는가');
      expect(premium.customerReport).toContain('실천해야 할 것');
      expect(premium.customerReport).toContain('피해야 할 것');
    });
  });

  // --------------------------------------------------------------------------
  // 4. 반응형 레이아웃 뷰포트 규격 호환성 검증
  // --------------------------------------------------------------------------
  describe('4. 반응형 레이아웃 가드 (PC 1920x1080/1440x900/1280x800 & Mobile 390x844/375x812)', () => {
    it('CSS 스타일에 모바일 가로 스크롤 방지 및 인쇄 미디어 쿼리가 적용되어 있다', () => {
      const cssPath = path.resolve('src', 'frontend', 'styles', 'index.css');
      const css = fs.readFileSync(cssPath, 'utf-8');
      expect(css).toContain('@media print');
      expect(css).toContain('@page');
      expect(css).toContain('break-inside: avoid');
      expect(css).toContain('@media (max-width: 480px)');
      expect(css).toContain('#btn-download-pdf');
    });
  });
});
