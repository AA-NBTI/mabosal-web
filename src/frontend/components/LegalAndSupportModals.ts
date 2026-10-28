/**
 * 이용약관, 개인정보처리방침, 고객센터 1:1 문의 모달 컴포넌트
 * 법인: 템바보드 주식회사 (대표 박경민, 사업자등록번호 107-88-44796)
 * 고객센터 수신 이메일: anbtiteam@gmail.com
 */

import { SiteContentStore } from '../state/site-content-store.js';

export function renderLegalAndSupportModals(): string {
  const cms = SiteContentStore.getConfig();
  const companyName = cms.footer.companyName || '템바보드 주식회사';
  const ceoName = cms.footer.ceoName || '박경민';
  const bizNumber = cms.footer.bizNumber || '107-88-44796';
  const mailOrderNumber = cms.footer.mailOrderNumber || '제 2026-부산사하-0589호';
  const address = cms.footer.address || '부산광역시 사하구 하신번영로 328, 302호 (하단동)';
  const supportEmail = 'anbtiteam@gmail.com';

  return `
  <!-- ======================================================= -->
  <!-- 1. 이용약관 모달 (Terms of Service) -->
  <!-- ======================================================= -->
  <div id="modal-terms-container" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 16px; width: 100%; max-width: 720px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.8); overflow: hidden;">
      
      <!-- 모달 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
        <div>
          <span style="font-size: 0.72rem; color: #ffffff; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">Mabosal Terms</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">전자상거래 서비스 이용약관</h2>
        </div>
        <button type="button" class="btn-close-legal-modal" data-modal="modal-terms-container" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 모달 본문 (스크롤) -->
      <div style="padding: 1.5rem; overflow-y: auto; color: #cbd5e1; font-size: 0.85rem; line-height: 1.7; flex: 1;">
        <div style="background: rgba(242,202,80,0.06); border: 1px solid rgba(242,202,80,0.2); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
          <strong style="color: #ffffff;">[운영 사업자 정보]</strong><br/>
          • 상호: <strong>${companyName}</strong> | 대표자: <strong>${ceoName}</strong><br/>
          • 사업자등록번호: <strong>${bizNumber}</strong> | 통신판매업신고: <strong>${mailOrderNumber}</strong><br/>
          • 사업장 소재지: ${address}<br/>
          • 대표전화: <strong>051-208-8746</strong> | 고객센터 문의: <strong>${supportEmail}</strong>
        </div>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제1조 (목적)</h3>
        <p>본 약관은 ${companyName}(이하 "회사"라 함)이 운영하는 온라인 플랫폼 "마보살"(이하 "몰" 또는 "서비스"라 함)에서 제공하는 인터넷 관련 명리학 사주 분석 정보, 전자상거래 서비스 및 제반 부가서비스를 이용함에 있어 "회사"와 "이용자"의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제2조 (정의)</h3>
        <p>
          1. "몰"이란 회사가 재화 또는 용역(디지털 사주 리포트, VOD, 전자책, 상담 바우처 등)을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.<br/>
          2. "이용자"란 "몰"에 접속하여 본 약관에 따라 "몰"이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br/>
          3. "디지털 컨텐츠"란 부호·문자·음성·음향·이미지 또는 영상 등으로 표현된 데이터로서 전자적 형태로 제작 또는 처리된 사주 분석 리포트, PDF 전자책, 디지털 운세 결과물 등을 의미합니다.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제3조 (약관의 명시와 개정)</h3>
        <p>회사는 본 약관의 내용과 상호, 대표자 성명, 영업소 소재지 주소, 사업자등록번호, 통신판매업 신고번호, 고객센터 연락처 등을 이용자가 쉽게 알 수 있도록 몰의 초기 서비스화면(푸터)에 게시합니다. 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제4조 (서비스의 내용 및 성격)</h3>
        <p>
          1. 회사가 제공하는 명리학 사주 분석 결과 및 감정 리포트는 전통 사주명리학과 천문 역학 데이터베이스를 바탕으로 산출된 <strong>인생 길흉화복 참고 자료</strong>입니다.<br/>
          2. 본 서비스에서 제공하는 분석 결과는 의학적, 법률적, 금융투자적 전문 조언을 대체하지 아니하며, 이용자 본인의 인생 결정과 실행에 대한 최종 책임은 이용자 본인에게 있습니다.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제5조 (청약철회 및 환불 특칙)</h3>
        <p>
          1. 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따라, <strong>이용자의 주문 후 즉시 연산·생성되어 제공되는 디지털 사주 리포트 및 열람 개시된 전자책/컨텐츠는 청약철회(환불)가 제한</strong>됩니다.<br/>
          2. 단, 시스템 장애나 전산 오류로 인해 리포트가 정상 생성되지 않거나 열람이 불가능한 경우, 회사는 즉시 재전송 또는 전액 환불 조치합니다.<br/>
          3. 실물 배송 상품(굿즈 등)의 경우 상품 수령일로부터 7일 이내에 청약철회를 요청할 수 있습니다.<br/>
          4. 모바일 바우처/상담권은 사용 전 상태에서 유효기간 내 환불을 요청할 수 있으며, 관련 기준에 따라 전액 또는 수수료를 공제한 금액이 환불됩니다.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제6조 (분쟁 해결 및 관할 법원)</h3>
        <p>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 단, 제소 당시 이용자의 주소 또는 거소가 분명하지 아니한 경우에는 민사소송법상의 관할법원에 제기합니다.</p>

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem; color: #94a3b8;">
          부칙: 본 약관은 2026년 10월 15일부터 시행됩니다.
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; background: rgba(0,0,0,0.2);">
        <button type="button" class="btn-close-legal-modal btn-cta-primary" data-modal="modal-terms-container" style="padding: 0.55rem 1.5rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">
          확인 및 닫기
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================= -->
  <!-- 2. 개인정보처리방침 모달 (Privacy Policy) -->
  <!-- ======================================================= -->
  <div id="modal-privacy-container" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 16px; width: 100%; max-width: 720px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.8); overflow: hidden;">
      
      <!-- 모달 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
        <div>
          <span style="font-size: 0.72rem; color: #818cf8; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">Privacy Protection</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">개인정보처리방침</h2>
        </div>
        <button type="button" class="btn-close-legal-modal" data-modal="modal-privacy-container" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 모달 본문 (스크롤) -->
      <div style="padding: 1.5rem; overflow-y: auto; color: #cbd5e1; font-size: 0.85rem; line-height: 1.7; flex: 1;">
        <p>${companyName}(이하 '회사')은 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.</p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제1조 (개인정보의 처리 목적)</h3>
        <p>
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법률에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.<br/>
          1. <strong>정밀 사주 분석 서비스 제공</strong>: 사주 원국 산출, 대운/세운 분석, 4대 정밀 감정 리포트 생성 및 재열람<br/>
          2. <strong>회원 관리 및 본인 식별</strong>: 회원제 서비스 이용에 따른 본인확인, 부정이용 방지, 가입의사 확인<br/>
          3. <strong>대금 결제 및 주문 배송</strong>: 유료 컨텐츠 결제, 무통장 입금 확인, 실물 상품 배송 및 환불 처리<br/>
          4. <strong>고객 상담 및 민원 처리</strong>: 1:1 온라인 문의 응대, 서비스 불편사항 개선, 공지사항 전달
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제2조 (처리하는 개인정보의 항목)</h3>
        <p>
          1. <strong>사주 분석 필수 항목</strong>: 성별, 생년월일(양력/음력/윤달 여부), 태어난 시(時), 의뢰인 성명 또는 닉네임<br/>
          2. <strong>주문 및 결제 정보</strong>: 주문자 성명, 연락처, 이메일 주소, 입금자명, 결제 승인 번호, 배송지 주소(실물 상품 구매 시)<br/>
          3. <strong>서비스 이용 과정에서 자동 생성되는 항목</strong>: IP Address, 접속 로그, 서비스 이용 기록, 쿠키(Cookie)
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제3조 (개인정보의 보유 및 이용 기간)</h3>
        <p>
          회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br/>
          • 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)<br/>
          • 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)<br/>
          • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)<br/>
          • 웹사이트 방문기록: 3개월 (통신비밀보호법)
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제4조 (개인정보 처리 업무의 위탁)</h3>
        <p>
          1. 회사는 원활하고 안전한 전자결제 및 서비스 제공을 위하여 「개인정보 보호법」 제26조에 따라 다음과 같이 개인정보 처리 업무를 외부 전문기관에 위탁하고 있습니다.
        </p>
        <div style="overflow-x: auto; margin: 0.85rem 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.12); text-align: left; background: rgba(255,255,255,0.02); border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: rgba(242, 202, 80, 0.1); border-bottom: 1px solid rgba(255,255,255,0.15);">
                <th style="padding: 0.65rem 0.75rem; color: #fff; font-weight: 700; width: 30%;">수탁업체</th>
                <th style="padding: 0.65rem 0.75rem; color: #fff; font-weight: 700; width: 40%;">위탁 업무 내용</th>
                <th style="padding: 0.65rem 0.75rem; color: #fff; font-weight: 700; width: 30%;">보유 및 이용 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                <td style="padding: 0.65rem 0.75rem; color: #f2ca50; font-weight: 700;">(주)코리아포트원 (PortOne)</td>
                <td style="padding: 0.65rem 0.75rem; color: #cbd5e1;">결제 연동 서비스 제공, 전자결제(신용카드/간편결제 등) 승인 및 중계 대행</td>
                <td style="padding: 0.65rem 0.75rem; color: #94a3b8;">회원 탈퇴 또는 위탁 계약 종료 시까지 (단, 전자상거래법 등 관계 법령에 따른 보존 의무 기간 동안 보관)</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                <td style="padding: 0.65rem 0.75rem; color: #cbd5e1; font-weight: 700;">Vercel Inc. / Supabase Inc.</td>
                <td style="padding: 0.65rem 0.75rem; color: #cbd5e1;">웹 호스팅 인프라 제공 및 클라우드 데이터베이스 저장/운영</td>
                <td style="padding: 0.65rem 0.75rem; color: #94a3b8;">서비스 이용 해지 또는 위탁 계약 종료 시까지</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          2. 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 명시하고 있으며, 수탁자가 개인정보를 안전하게 처리하도록 철저히 관리·감독하고 있습니다.<br/>
          3. 위탁하는 업무의 내용이나 수탁자가 변경될 경우 지체 없이 본 개인정보처리방침을 통하여 공개하도록 하겠습니다.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.5rem 0;">제5조 (개인정보 보호책임자)</h3>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1rem; margin-top: 0.5rem;">
          • 성명: <strong>${ceoName}</strong><br/>
          • 직책: <strong>대표이사 / 개인정보 보호책임자</strong><br/>
          • 소속: <strong>${companyName}</strong><br/>
          • 이메일: <strong>${supportEmail}</strong><br/>
          • 전화번호: <strong>051-208-8746</strong>
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem; color: #94a3b8;">
          공고일자: 2026년 10월 15일 | 개정일자: 2026년 10월 28일 | 시행일자: 2026년 10월 28일
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; background: rgba(0,0,0,0.2);">
        <button type="button" class="btn-close-legal-modal btn-cta-secondary" data-modal="modal-privacy-container" style="padding: 0.55rem 1.5rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">
          확인 및 닫기
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================= -->
  <!-- 3. 고객센터 1:1 온라인 이메일 문의 접수 모달 -->
  <!-- (수신 이메일: anbtiteam@gmail.com 연결 구조) -->
  <!-- ======================================================= -->
  <div id="modal-support-container" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.78); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden;">
      
      <!-- 모달 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(180deg, rgba(242,202,80,0.08), rgba(0,0,0,0.2));">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #ffffff;">
            <span class="material-symbols-outlined" style="font-size: 22px;">support_agent</span>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0;">고객센터</h2>
              <span style="font-size: 0.7rem; background: rgba(255, 255, 255, 0.1); color: #e2e8f0; border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.1rem 0.45rem; border-radius: 9999px; font-weight: 600;">상담 접수</span>
            </div>
            <p style="font-size: 0.78rem; color: #94a3b8; margin: 0.15rem 0 0 0;">관리자 대시보드로 즉시 접수되며 영업일 기준 신속히 회신드립니다.</p>
          </div>
        </div>
        <button type="button" class="btn-close-legal-modal" data-modal="modal-support-container" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 모달 폼 본문 (스크롤) -->
      <form id="form-customer-support" style="margin: 0; padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem; box-sizing: border-box;">
        
        <!-- 고객센터 안내 -->

        <!-- 연락처 및 주문번호 (선택) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
          <div>
            <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.35rem;">
              연락처 (선택)
            </label>
            <input type="tel" id="support-phone" placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem 0.85rem; color: #fff; font-size: 0.85rem; outline: none;" />
          </div>
          <div>
            <label style="display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.35rem;">
              주문번호 (결제 문의 시 필수)
            </label>
            <input type="text" id="support-order-id" placeholder="ORD-2026..." style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem 0.85rem; color: #fff; font-size: 0.85rem; outline: none;" />
          </div>
        </div>

        <!-- 문의 제목 -->
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.35rem;">
            문의 제목 <span style="color: #f87171;">*</span>
          </label>
          <input type="text" id="support-title" required placeholder="문의하실 내용의 핵심을 적어주세요." style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.65rem 0.85rem; color: #fff; font-size: 0.85rem; outline: none;" />
        </div>

        <!-- 상세 문의 내용 -->
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #dfe2f1; margin-bottom: 0.35rem;">
            상세 문의 내용 <span style="color: #f87171;">*</span>
          </label>
          <textarea id="support-content" required rows="5" placeholder="궁금하신 내용이나 요청사항을 상세히 적어주시면 보다 정확하고 빠른 처리가 가능합니다." style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 0.75rem 0.85rem; color: #fff; font-size: 0.85rem; outline: none; resize: vertical; line-height: 1.5;"></textarea>
        </div>

        <!-- 개인정보 수집 및 처리 동의 -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.75rem;">
          <label style="display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer; font-size: 0.76rem; color: #94a3b8; line-height: 1.4;">
            <input type="checkbox" id="support-agree-privacy" required checked style="margin-top: 2px; accent-color: #ffffff;" />
            <span>[필수] 고객 문의 처리 및 회신을 위한 개인정보(이름, 이메일, 연락처) 수집 및 이용에 동의합니다. (목적 달성 시 파기)</span>
          </label>
        </div>

        <!-- 완료/알림 박스 (전송 성공 시 노출) -->
        <div id="support-success-message" style="display: none; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 10px; padding: 1rem; text-align: center; color: #4ade80;">
          <span class="material-symbols-outlined" style="font-size: 32px; display: block; margin: 0 auto 0.25rem;">check_circle</span>
          <strong style="font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">문의가 정상적으로 접수되었습니다!</strong>
          <span style="font-size: 0.78rem; color: #bbf7d0;">
            접수처: <strong>${supportEmail}</strong> | 대표전화: <strong>051-208-8746</strong><br/>
            담당자가 신속히 확인 후 입력하신 이메일로 답변을 전송해 드리겠습니다.
          </span>
        </div>

        <!-- 폼 버튼 -->
        <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 0.5rem;">
          <button type="button" class="btn-close-legal-modal btn-cta-secondary" data-modal="modal-support-container" style="padding: 0.65rem 1.25rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">
            취소
          </button>
          <button type="submit" id="btn-submit-support" class="btn-cta-primary" style="padding: 0.65rem 1.6rem; font-size: 0.85rem; font-weight: 800; border-radius: 8px; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
            <span>문의 접수하기</span>
          </button>
        </div>

      </form>
    </div>
  </div>

  <!-- ======================================================= -->
  <!-- 4. 취소 및 환불/교환 정책 모달 (Refund & Return Policy) -->
  <!-- ======================================================= -->
  <div id="modal-refund-container" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.78); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 16px; width: 100%; max-width: 720px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden;">
      
      <!-- 모달 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
        <div>
          <span style="font-size: 0.72rem; color: #f2ca50; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">Refund &amp; Return Policy</span>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0.15rem 0 0 0;">취소 및 환불 / 반품 규정</h2>
        </div>
        <button type="button" class="btn-close-legal-modal" data-modal="modal-refund-container" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 모달 본문 (스크롤) -->
      <div style="padding: 1.5rem; overflow-y: auto; color: #cbd5e1; font-size: 0.86rem; line-height: 1.75; flex: 1;">
        <div style="background: rgba(242,202,80,0.06); border: 1px solid rgba(242,202,80,0.25); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
          <strong style="color: #f2ca50;">전자상거래 소비자보호법 기준 환불 안내</strong><br/>
          마보살은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 공정거래위원회 표준약관을 엄격히 준수합니다.
        </div>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.4rem 0;">1. 디지털 콘텐츠 (사주 분석 리포트 · PDF 전자책)</h3>
        <p>
          • <strong>청약철회 제한 고지</strong>: 「전자상거래법」 제17조 제2항 제5호 및 「콘텐츠산업 진흥법」에 따라, <strong>열람 또는 다운로드가 개시되었거나 맞춤 분석이 완료된 디지털 콘텐츠는 청약철회(환불)가 제한</strong>됩니다.<br/>
          • 결제 완료 후 열람이나 다운로드를 개시하지 않은 주문은 결제일로부터 7일 이내 전액 환불이 가능합니다.<br/>
          • 전산 시스템 오류, 파일 손상 등으로 정상적인 열람이 불가능한 경우 고객센터 접수 즉시 재발송 또는 전액 환불해 드립니다.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.4rem 0;">2. 실물 배송 상품 (수제 부적 · 굿즈 소품)</h3>
        <p>
          • 상품 수령일로부터 <strong>7일 이내</strong> 청약철회(반품/교환)를 신청하실 수 있습니다.<br/>
          • <strong>반품 배송비</strong>: 단순 변심에 의한 반품 시 편도 3,000원(최초 무료배송인 경우 왕복 6,000원)은 고객 부담입니다.<br/>
          • <strong>반품 불가 사유</strong>: 고객 귀책으로 상품이 멸실/훼손된 경우, 개봉 후 사용 흔적으로 재판매가 불가능한 경우, 고객 맞춤형으로 단독 제작된 주문 제작 수제 부적.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.4rem 0;">3. 1:1 심층 상담권 및 모바일 바우처</h3>
        <p>
          • 미사용 모바일 바우처: 발행일로부터 유효기간 내 언제든 전액 환불 가능합니다.<br/>
          • 1:1 상담 예약권: 상담 예정 시각 24시간 전 취소 시 전액 환불되며, 상담 당일 무단 불참(노쇼) 또는 상담 개시 후에는 환불이 불가합니다.
        </p>

        <h3 style="color: #fff; font-size: 1rem; margin: 1.2rem 0 0.4rem 0;">4. 취소 및 환불 신청 방법</h3>
        <p>
          • 마이페이지 [주문 내역] → 해당 주문의 [주문 취소/반품 접수] 버튼을 통해 24시간 온라인 접수<br/>
          • 고객센터 유선 문의: <strong>051-208-8746</strong> (평일 10:00 ~ 18:00)<br/>
          • 고객센터 이메일 접수: <strong>anbtiteam@gmail.com</strong>
        </p>
      </div>

      <!-- 모달 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; background: rgba(0,0,0,0.2);">
        <button type="button" class="btn-close-legal-modal btn-cta-primary" data-modal="modal-refund-container" style="padding: 0.55rem 1.5rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px;">
          확인 및 닫기
        </button>
      </div>
    </div>
  </div>
  `;
}
