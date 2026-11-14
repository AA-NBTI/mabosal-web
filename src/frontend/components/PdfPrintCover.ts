/**
 * 마보살 A4 정본 PDF 인쇄용 표지 및 인쇄 헬퍼 모듈
 * - 평소 웹 화면에서는 .pdf-print-only 로 숨김 처리됨
 * - window.print() 호출 시 @media print 에서 A4 1페이지 정본 표지로 활성화됨
 */

export interface PdfCoverOptions {
  tierLabel: string;
  reportTitle: string;
  reportSubtitle: string;
  userName: string;
  genderTag: string;
  birthSummary: string;
  dayPillar: string;
  chapterCount: number;
  documentCode?: string;
}

function escapePdfHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPdfReportCover(options: PdfCoverOptions): string {
  const now = new Date();
  const issuedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const docCode = options.documentCode || `MB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  return `
    <section class="pdf-print-only pdf-cover-page" aria-hidden="true">
      <div class="pdf-cover-inner">
        <div class="pdf-cover-top">
          <div class="pdf-cover-emblem">MABOSAL · 天命院 正本 鑑定書</div>
          <div class="pdf-cover-meta-line">
            <span>문서번호 ${escapePdfHtml(docCode)}</span>
            <span>발행일 ${issuedDate}</span>
          </div>
        </div>

        <div class="pdf-cover-center">
          <div class="pdf-cover-tier-pill">${escapePdfHtml(options.tierLabel)}</div>
          <h1 class="pdf-cover-title">${escapePdfHtml(options.reportTitle)}</h1>
          <div class="pdf-cover-divider"></div>
          <p class="pdf-cover-subtitle">${escapePdfHtml(options.reportSubtitle)}</p>
        </div>

        <div class="pdf-cover-bottom">
          <table class="pdf-cover-client-table">
            <tbody>
              <tr>
                <th>의뢰인 성명</th>
                <td><strong>${escapePdfHtml(options.userName)}</strong> <span class="pdf-cover-gender">(${escapePdfHtml(options.genderTag)})</span></td>
              </tr>
              <tr>
                <th>생년월일시</th>
                <td>${escapePdfHtml(options.birthSummary)}</td>
              </tr>
              <tr>
                <th>타고난 일주</th>
                <td><strong>${escapePdfHtml(options.dayPillar)}</strong></td>
              </tr>
              <tr>
                <th>수록 분량</th>
                <td>총 ${options.chapterCount}개 정밀 분석 챕터 · 원국·오행·운세 시각화 포함</td>
              </tr>
            </tbody>
          </table>

          <div class="pdf-cover-footer-note">
            본 문서는 마보살 정통 명리 엔진을 기반으로 작성된 개인 맞춤형 A4 정본 감정서입니다.<br/>
            © MABOSAL ARCHIVE · All Rights Reserved.
          </div>
        </div>
      </div>
    </section>
  `;
}

export function printReportWithTitle(reportTitle?: string): void {
  const prevTitle = document.title;
  if (reportTitle) {
    const clean = reportTitle.replace(/[\\/:*?"<>|]/g, '_').trim();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    document.title = `[마보살]_${clean}_${today}`;
  }

  let restored = false;
  const restoreTitle = () => {
    if (restored) return;
    restored = true;
    document.title = prevTitle;
  };

  window.addEventListener('afterprint', restoreTitle, { once: true });
  window.print();
  setTimeout(restoreTitle, 1500);
}

