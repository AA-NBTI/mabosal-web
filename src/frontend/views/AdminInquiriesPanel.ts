/**
 * 관리자 대시보드 - 1:1 온라인 고객 문의 관리 패널 (AdminInquiriesPanel)
 * - 고객 접수 문의 조회, 실시간 답변 등록, 삭제
 * - [요구사항 3] 기본 닫힘(Accordion) 형태의 컴팩트 고밀도 게시판 구조로 설계
 */

import { CustomerInquiryStore, CustomerInquiry } from '../state/customer-inquiry-store.js';

let activeInquiryFilter: 'all' | 'pending' | 'answered' = 'all';
const expandedInquiryIds = new Set<string>();

export function setInquiryFilter(filter: 'all' | 'pending' | 'answered'): void {
  activeInquiryFilter = filter;
}

export function toggleInquiryExpanded(inquiryId: string): void {
  if (expandedInquiryIds.has(inquiryId)) {
    expandedInquiryIds.delete(inquiryId);
  } else {
    expandedInquiryIds.add(inquiryId);
  }
}

export function expandSpecificInquiry(inquiryId: string): void {
  expandedInquiryIds.add(inquiryId);
}

export function renderAdminInquiriesPanel(): string {
  const allInquiries = CustomerInquiryStore.getInquiries();
  const pendingCount = CustomerInquiryStore.getPendingCount();
  const answeredCount = allInquiries.length - pendingCount;

  const filtered = allInquiries.filter(i => {
    if (activeInquiryFilter === 'pending') return i.status === 'pending';
    if (activeInquiryFilter === 'answered') return i.status === 'answered';
    return true;
  });

  return `
  <div style="display: flex; flex-direction: column; gap: 1.25rem;">
    
    <!-- 1. 상단 통계 요약 카드 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.25rem 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.18rem 0.55rem; border-radius: 9999px; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.3); margin-bottom: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 0.82rem; color: var(--primary);">support_agent</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">CUSTOMER SUPPORT INQUIRIES</span>
          </div>
          <h2 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 800; color: #dfe2f1; margin: 0 0 0.25rem;">
            고객센터 1:1 고객 문의 게시판
          </h2>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
            실시간 고객 접수 문의 목록입니다. 항목을 클릭하면 질문 본문과 답변 작성창이 펼쳐집니다.
          </p>
        </div>

        <!-- 필터 버튼 탭 -->
        <div style="display: flex; gap: 0.35rem; background: rgba(0,0,0,0.35); padding: 0.25rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
          <button type="button" class="btn-inquiry-filter ${activeInquiryFilter === 'all' ? 'active' : ''}" data-filter="all" style="background: ${activeInquiryFilter === 'all' ? 'var(--primary)' : 'transparent'}; color: ${activeInquiryFilter === 'all' ? '#0f172a' : '#cbd5e1'}; font-weight: 700; border: none; padding: 0.38rem 0.75rem; border-radius: 6px; font-size: 0.78rem; cursor: pointer;">
            전체 (${allInquiries.length})
          </button>
          <button type="button" class="btn-inquiry-filter ${activeInquiryFilter === 'pending' ? 'active' : ''}" data-filter="pending" style="background: ${activeInquiryFilter === 'pending' ? 'var(--primary)' : 'transparent'}; color: ${activeInquiryFilter === 'pending' ? '#0f172a' : '#cbd5e1'}; font-weight: 700; border: none; padding: 0.38rem 0.75rem; border-radius: 6px; font-size: 0.78rem; cursor: pointer;">
            답변 대기 (${pendingCount})
          </button>
          <button type="button" class="btn-inquiry-filter ${activeInquiryFilter === 'answered' ? 'active' : ''}" data-filter="answered" style="background: ${activeInquiryFilter === 'answered' ? 'var(--primary)' : 'transparent'}; color: ${activeInquiryFilter === 'answered' ? '#0f172a' : '#cbd5e1'}; font-weight: 700; border: none; padding: 0.38rem 0.75rem; border-radius: 6px; font-size: 0.78rem; cursor: pointer;">
            답변 완료 (${answeredCount})
          </button>
        </div>
      </div>

      <!-- 요약 수치 카드 그리드 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.75rem 1rem;">
          <div style="font-size: 0.74rem; color: var(--text-muted);">총 접수 문의</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #fff; margin-top: 0.15rem;">${allInquiries.length}건</div>
        </div>
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 8px; padding: 0.75rem 1rem;">
          <div style="font-size: 0.74rem; color: var(--primary); font-weight: 700;">답변 대기중</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary); margin-top: 0.15rem;">${pendingCount}건</div>
        </div>
        <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 0.75rem 1rem;">
          <div style="font-size: 0.74rem; color: #4ade80; font-weight: 700;">답변 완료</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #4ade80; margin-top: 0.15rem;">${answeredCount}건</div>
        </div>
      </div>
    </div>

    <!-- 2. [요구사항 3] 기본 닫힘 형태의 고밀도 게시판 목록 테이블 -->
    <div style="background: var(--surface-container); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem 1.5rem; overflow: hidden;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
        <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.4rem;">
          <span>문의 목록 (${filtered.length}건)</span>
        </h3>
        <span style="font-size: 0.74rem; color: var(--text-muted);">
          * 항목을 클릭하면 질문 내용과 관리자 답변 폼이 슬라이드로 펼쳐집니다.
        </span>
      </div>

      ${filtered.length === 0 ? `
        <div style="text-align: center; padding: 3.5rem 1rem; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: 10px;">
          <span class="material-symbols-outlined" style="font-size: 40px; color: rgba(255,255,255,0.2); margin-bottom: 0.4rem;">inbox</span>
          <p style="margin: 0; font-size: 0.9rem;">해당 상태의 접수된 문의가 없습니다.</p>
        </div>
      ` : `
        <div style="border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; background: rgba(0,0,0,0.25);">
          
          <!-- 테이블 헤더 (PC 전용 간결 타이틀) -->
          <div style="display: grid; grid-template-columns: 85px 95px 1fr 120px 130px 105px; gap: 0.5rem; padding: 0.65rem 1rem; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.75rem; font-weight: 700; color: var(--text-muted); align-items: center;">
            <div style="text-align: center;">상태</div>
            <div>유형</div>
            <div>문의 제목</div>
            <div>작성자</div>
            <div>접수일시</div>
            <div style="text-align: center;">관리</div>
          </div>

          <!-- 테이블 바디 (기본 닫힘형 아코디언 행) -->
          <div style="display: flex; flex-direction: column;">
            ${filtered.map((inq, idx) => {
              const isExpanded = expandedInquiryIds.has(inq.id);
              const isPending = inq.status === 'pending';

              return `
              <div class="inquiry-accordion-item" data-inquiry-id="${inq.id}" style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s ease;">
                
                <!-- 1) 닫힘형 기본 행 (클릭 시 토글) -->
                <div class="btn-toggle-inquiry-row" data-inquiry-id="${inq.id}" style="display: grid; grid-template-columns: 85px 95px 1fr 120px 130px 105px; gap: 0.5rem; padding: 0.75rem 1rem; cursor: pointer; align-items: center; background: ${isExpanded ? 'rgba(242, 202, 80, 0.05)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')}; user-select: none;">
                  
                  <!-- 상태 뱃지 -->
                  <div style="text-align: center;">
                    <span style="display: inline-block; font-size: 0.7rem; padding: 0.18rem 0.5rem; border-radius: 4px; font-weight: 800; background: ${isPending ? 'rgba(242, 202, 80, 0.18)' : 'rgba(34, 197, 94, 0.18)'}; color: ${isPending ? 'var(--primary)' : '#4ade80'}; border: 1px solid ${isPending ? 'rgba(242, 202, 80, 0.35)' : 'rgba(34, 197, 94, 0.35)'};">
                      ${isPending ? '답변대기' : '답변완료'}
                    </span>
                  </div>

                  <!-- 유형 -->
                  <div>
                    <span style="font-size: 0.74rem; background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">
                      ${inq.category}
                    </span>
                  </div>

                  <!-- 제목 (한눈에 확인) -->
                  <div style="font-size: 0.86rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 0.4rem;">
                    <span>${inq.title}</span>
                    <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace; font-weight: normal;">#${inq.id}</span>
                  </div>

                  <!-- 작성자 -->
                  <div style="font-size: 0.8rem; color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${inq.userName}
                  </div>

                  <!-- 접수일시 -->
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    ${new Date(inq.createdAt).toLocaleDateString()}
                  </div>

                  <!-- 펼침 토글 버튼 -->
                  <div style="display: flex; justify-content: center; align-items: center; gap: 0.3rem;">
                    <button type="button" class="btn-toggle-inquiry-arrow" data-inquiry-id="${inq.id}" style="background: ${isExpanded ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${isExpanded ? '#000' : '#cbd5e1'}; border: 1px solid ${isExpanded ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.2rem;">
                      <span>${isExpanded ? '접기' : '상세'}</span>
                      <span style="font-size: 0.68rem;">${isExpanded ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                <!-- 2) 펼쳐지는 상세 Drawer (질문 본문 + 답변 작성창) -->
                ${isExpanded ? `
                  <div class="inquiry-detail-drawer" style="padding: 1.15rem 1.25rem; background: rgba(0,0,0,0.4); border-top: 1px dashed rgba(242,202,80,0.25); display: flex; flex-direction: column; gap: 1rem;">
                    
                    <!-- 의뢰인 정보 요약 바 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: rgba(255,255,255,0.02); padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.8rem; color: #cbd5e1;">
                      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                        <span>작성자: <strong style="color: #fff;">${inq.userName}</strong></span>
                        <span style="color: rgba(255,255,255,0.2);">|</span>
                        <span>회신 이메일: <strong style="color: var(--primary); font-family: monospace;">${inq.replyEmail}</strong></span>
                        ${inq.phone ? `<span style="color: rgba(255,255,255,0.2);">|</span><span>연락처: ${inq.phone}</span>` : ''}
                        ${inq.orderId ? `<span style="color: rgba(255,255,255,0.2);">|</span><span style="color: #818cf8; font-family: monospace;">주문번호: ${inq.orderId}</span>` : ''}
                      </div>
                      <button type="button" class="btn-delete-inquiry" data-inquiry-id="${inq.id}" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; padding: 0.25rem 0.6rem; font-size: 0.74rem; cursor: pointer;">
                        문의 삭제
                      </button>
                    </div>

                    <!-- 질문 본문 내용 -->
                    <div>
                      <div style="font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.3rem;">
                        <span class="material-symbols-outlined" style="font-size: 15px; color: var(--primary);">question_answer</span>
                        <span>고객 문의 상세 내용</span>
                      </div>
                      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.85rem 1rem; font-size: 0.86rem; color: #e2e8f0; line-height: 1.6; white-space: pre-line;">
                        ${inq.content}
                      </div>
                    </div>

                    <!-- 관리자 답변 영역 -->
                    ${inq.adminAnswer ? `
                      <div style="background: rgba(34, 197, 94, 0.06); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 8px; padding: 0.85rem 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                          <div style="display: flex; align-items: center; gap: 0.35rem; color: #4ade80; font-weight: 800; font-size: 0.82rem;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
                            <span>관리자 공식 답변 등록 완료</span>
                          </div>
                          <span style="font-size: 0.74rem; color: #94a3b8;">
                            답변일시: ${inq.answeredAt ? new Date(inq.answeredAt).toLocaleString() : '-'}
                          </span>
                        </div>
                        <div style="font-size: 0.85rem; color: #dfe2f1; line-height: 1.6; white-space: pre-line;">
                          ${inq.adminAnswer}
                        </div>
                      </div>
                    ` : `
                      <!-- 답변 작성 폼 (답변 대기 상태일 때) -->
                      <div style="background: rgba(242, 202, 80, 0.04); border: 1px dashed rgba(242, 202, 80, 0.35); border-radius: 8px; padding: 0.85rem 1rem;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem;">
                          <span class="material-symbols-outlined" style="font-size: 16px;">edit_note</span>
                          <span>관리자 즉각 회신 답변 작성</span>
                        </div>
                        <textarea id="answer-input-${inq.id}" rows="3" placeholder="고객에게 안내할 친절하고 정확한 공식 회신 답변을 입력하세요..." style="width: 100%; box-sizing: border-box; background: #161b26; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.65rem; color: #fff; font-size: 0.84rem; outline: none; resize: vertical; margin-bottom: 0.5rem;"></textarea>
                        <div style="display: flex; justify-content: flex-end;">
                          <button type="button" class="btn-submit-inquiry-answer" data-inquiry-id="${inq.id}" style="background: var(--primary); color: #0f131d; font-weight: 800; border: none; padding: 0.45rem 1.15rem; border-radius: 6px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
                            <span class="material-symbols-outlined" style="font-size: 16px;">send</span>
                            <span>공식 답변 등록 완료</span>
                          </button>
                        </div>
                      </div>
                    `}

                  </div>
                ` : ''}

              </div>
              `;
            }).join('')}
          </div>

        </div>
      `}
    </div>

  </div>
  `;
}
