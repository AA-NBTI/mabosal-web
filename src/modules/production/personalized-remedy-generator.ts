/**
 * Phase 36: Personalized Remedy Generator (개인 맞춤형 디지털 처방 생성기)
 * 
 * 최고 원칙:
 * 1. 단순 이미지 판매가 아니라 [사주 + 현재 상황 + 부족한 기운 + 문제 영역 + 마보살 처방]을
 *    유기적으로 결합하여 개인별 고유 디지털 처방물을 생성한다.
 * 2. 미신적 어휘('부적', '살풀이', '패가망신')는 철저히 배제하고,
 *    '오행 조율 카드', '마보살 디지털 처방 카드'라는 정돈된 명칭을 사용한다.
 * 3. 4가지 프리미엄 규격 지원:
 *    - 스마트폰 배경화면 (1080 x 1920)
 *    - 잠금화면 (1080 x 1920)
 *    - 디지털 카드 (800 x 1200)
 *    - 인쇄용 카드 (1200 x 1800 고해상도)
 */

export interface RemedyInputContext {
  readonly dayMaster: string;
  readonly dayMasterHanja: string;
  readonly dayMasterElement: '목' | '화' | '토' | '금' | '수';
  readonly lackingElement: '목' | '화' | '토' | '금' | '수';
  readonly troubleCategory: string; // 예: "연애/이별", "직장/이직"
  readonly corePrescriptionPhrase: string; // 예: "속도를 늦추고 경청의 수(水) 기운을 채우십시오"
  readonly actionItem: string;
  readonly avoidItem: string;
}

export interface DigitalRemedyArtifact {
  readonly remedyId: string;
  readonly formatType: 'PHONE_WALLPAPER' | 'LOCK_SCREEN' | 'DIGITAL_CARD' | 'PRINT_CARD';
  readonly title: string;
  readonly subtitle: string;
  readonly dimensions: { width: number; height: number };
  readonly colorPalette: {
    readonly background: string;
    readonly accentGold: string;
    readonly elementColor: string;
    readonly textPrimary: string;
  };
  readonly svgContent: string;
}

export class PersonalizedRemedyGenerator {
  private elementColors: Record<string, string> = {
    목: '#3B7A57', // 숲과 나무의 딥 에메랄드
    화: '#C0392B', // 정화와 온기의 딥 로즈
    토: '#C8963E', // 대지와 안정의 웜 골드
    금: '#7F8C8D', // 결단과 절제의 플래티넘 실버
    수: '#2471A3', // 지혜와 유연함의 딥 사파이어
  };

  private elementHanja: Record<string, string> = {
    목: '木',
    화: '火',
    토: '土',
    금: '金',
    수: '水',
  };

  /**
   * 개인 맞춤형 디지털 처방 세트 4종 일괄 생성
   */
  public generateFullRemedySet(context: RemedyInputContext): DigitalRemedyArtifact[] {
    return [
      this.generateWallpaper(context, 'PHONE_WALLPAPER', 1080, 1920),
      this.generateWallpaper(context, 'LOCK_SCREEN', 1080, 1920),
      this.generateCard(context, 'DIGITAL_CARD', 800, 1200),
      this.generateCard(context, 'PRINT_CARD', 1200, 1800),
    ];
  }

  /**
   * 모바일 배경화면 / 잠금화면 규격 생성 (SVG 벡터 그래픽)
   */
  public generateWallpaper(
    ctx: RemedyInputContext,
    format: 'PHONE_WALLPAPER' | 'LOCK_SCREEN',
    width: number,
    height: number
  ): DigitalRemedyArtifact {
    const remedyId = `RMD-${Date.now()}-${format}`;
    const elemColor = this.elementColors[ctx.lackingElement] || '#D4AF37';
    const hanjaElem = this.elementHanja[ctx.lackingElement] || ctx.lackingElement;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#141E34" />
      <stop offset="100%" stop-color="#080C16" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3E5AB" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA771C" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- 배경 -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- 기하학적 궤도 및 오행 엠블럼 -->
  <circle cx="${width / 2}" cy="${height * 0.42}" r="320" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.4" />
  <circle cx="${width / 2}" cy="${height * 0.42}" r="220" fill="none" stroke="${elemColor}" stroke-width="2" opacity="0.6" filter="url(#glow)" />
  <circle cx="${width / 2}" cy="${height * 0.42}" r="140" fill="#0D1527" stroke="url(#goldGrad)" stroke-width="2" />

  <!-- 중앙 한자 (부족한 보완 오행) -->
  <text x="${width / 2}" y="${height * 0.42 + 45}" font-family="'Noto Serif KR', serif" font-size="120" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">
    ${hanjaElem}
  </text>

  <!-- 상단 헤더 문구 -->
  <text x="${width / 2}" y="${height * 0.18}" font-family="'Pretendard', sans-serif" font-size="28" fill="#8E9EB8" letter-spacing="8" text-anchor="middle">
    MABOSAL PRESCRIPTION
  </text>
  <text x="${width / 2}" y="${height * 0.22}" font-family="'Pretendard', sans-serif" font-size="42" font-weight="600" fill="#F8FAFC" text-anchor="middle">
    ${ctx.dayMaster} 일간을 위한 ${ctx.troubleCategory} 조율 처방
  </text>

  <!-- 하단 처방 구절 -->
  <rect x="${width * 0.12}" y="${height * 0.65}" width="${width * 0.76}" height="280" rx="20" fill="#0B1323" stroke="#253554" stroke-width="1.5" />
  <text x="${width / 2}" y="${height * 0.65 + 70}" font-family="'Pretendard', sans-serif" font-size="34" font-weight="700" fill="url(#goldGrad)" text-anchor="middle">
    마보살 행동 지침
  </text>
  <text x="${width / 2}" y="${height * 0.65 + 130}" font-family="'Pretendard', sans-serif" font-size="28" fill="#E2E8F0" text-anchor="middle">
    ${ctx.corePrescriptionPhrase}
  </text>
  <text x="${width / 2}" y="${height * 0.65 + 190}" font-family="'Pretendard', sans-serif" font-size="24" fill="#94A3B8" text-anchor="middle">
    실천: ${ctx.actionItem} | 피할 것: ${ctx.avoidItem}
  </text>

  <!-- 하단 서명 워터마크 -->
  <text x="${width / 2}" y="${height * 0.94}" font-family="'Noto Serif KR', serif" font-size="22" fill="#4B5B75" letter-spacing="4" text-anchor="middle">
    마보살 (MABOSAL) · 고유 명리 조율 카드
  </text>
</svg>
`.trim();

    return {
      remedyId,
      formatType: format,
      title: `${ctx.dayMaster} 일간 맞춤 ${format === 'PHONE_WALLPAPER' ? '스마트폰 배경화면' : '잠금화면'}`,
      subtitle: `${ctx.troubleCategory} 흐름 완화 및 ${ctx.lackingElement}(${hanjaElem}) 기운 보강`,
      dimensions: { width, height },
      colorPalette: {
        background: '#080C16',
        accentGold: '#D4AF37',
        elementColor: elemColor,
        textPrimary: '#F8FAFC',
      },
      svgContent: svg,
    };
  }

  /**
   * 디지털 카드 / 인쇄용 카드 규격 생성
   */
  public generateCard(
    ctx: RemedyInputContext,
    format: 'DIGITAL_CARD' | 'PRINT_CARD',
    width: number,
    height: number
  ): DigitalRemedyArtifact {
    const remedyId = `RMD-${Date.now()}-${format}`;
    const elemColor = this.elementColors[ctx.lackingElement] || '#D4AF37';
    const hanjaElem = this.elementHanja[ctx.lackingElement] || ctx.lackingElement;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#090E1A" />
      <stop offset="100%" stop-color="#050810" />
    </linearGradient>
    <linearGradient id="borderGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#8C6D23" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
  </defs>

  <!-- 카드 본체 -->
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="24" fill="url(#cardBg)" stroke="url(#borderGold)" stroke-width="2" />
  <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="16" fill="none" stroke="#25334D" stroke-width="1" />

  <!-- 헤더 엠블럼 -->
  <text x="${width / 2}" y="100" font-family="'Noto Serif KR', serif" font-size="28" font-weight="700" fill="#D4AF37" letter-spacing="6" text-anchor="middle">
    마보살 명리 처방
  </text>
  <line x1="${width * 0.25}" y1="120" x2="${width * 0.75}" y2="120" stroke="#334766" stroke-width="1" />

  <!-- 중앙 오행 심볼 -->
  <circle cx="${width / 2}" cy="${height * 0.38}" r="90" fill="#131F37" stroke="${elemColor}" stroke-width="3" />
  <text x="${width / 2}" y="${height * 0.38 + 28}" font-family="'Noto Serif KR', serif" font-size="76" font-weight="bold" fill="#F8FAFC" text-anchor="middle">
    ${hanjaElem}
  </text>

  <text x="${width / 2}" y="${height * 0.52}" font-family="'Pretendard', sans-serif" font-size="26" font-weight="600" fill="#E2E8F0" text-anchor="middle">
    ${ctx.dayMaster} 일간 × ${ctx.lackingElement}(${hanjaElem}) 기운 조율
  </text>
  <text x="${width / 2}" y="${height * 0.56}" font-family="'Pretendard', sans-serif" font-size="18" fill="#8FA4C4" text-anchor="middle">
    문제 영역: ${ctx.troubleCategory}
  </text>

  <!-- 처방 내용 박스 -->
  <rect x="60" y="${height * 0.62}" width="${width - 120}" height="${height * 0.25}" rx="14" fill="#0D1629" stroke="#1E2E4A" stroke-width="1" />
  <text x="${width / 2}" y="${height * 0.62 + 45}" font-family="'Pretendard', sans-serif" font-size="20" font-weight="700" fill="#D4AF37" text-anchor="middle">
    핵심 실천 행동
  </text>
  <text x="${width / 2}" y="${height * 0.62 + 90}" font-family="'Pretendard', sans-serif" font-size="18" fill="#F1F5F9" text-anchor="middle">
    ${ctx.corePrescriptionPhrase}
  </text>
  <text x="${width / 2}" y="${height * 0.62 + 135}" font-family="'Pretendard', sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">
    권장: ${ctx.actionItem}
  </text>
  <text x="${width / 2}" y="${height * 0.62 + 170}" font-family="'Pretendard', sans-serif" font-size="16" fill="#E06C75" text-anchor="middle">
    금기: ${ctx.avoidItem}
  </text>

  <!-- 하단 인증 -->
  <text x="${width / 2}" y="${height - 50}" font-family="'Pretendard', sans-serif" font-size="14" fill="#475569" letter-spacing="3" text-anchor="middle">
    MABOSAL AUTHENTIC PRESCRIPTION CARD
  </text>
</svg>
`.trim();

    return {
      remedyId,
      formatType: format,
      title: `${ctx.dayMaster} 일간 ${format === 'DIGITAL_CARD' ? '디지털 보관 카드' : '인쇄용 고해상도 카드'}`,
      subtitle: `${ctx.lackingElement}(${hanjaElem}) 기운 조율 및 현실 처방`,
      dimensions: { width, height },
      colorPalette: {
        background: '#090E1A',
        accentGold: '#D4AF37',
        elementColor: elemColor,
        textPrimary: '#F8FAFC',
      },
      svgContent: svg,
    };
  }
}

export const personalizedRemedyGenerator = new PersonalizedRemedyGenerator();
