/**
 * [Customer Inquiry Support Test Suite]
 * 고객센터 1:1 온라인 문의 접수, 관리자 답변 등록 및 모달 무결성 검증
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerInquiryStore } from '../src/frontend/state/customer-inquiry-store.js';
import { renderLegalAndSupportModals } from '../src/frontend/components/LegalAndSupportModals.js';
import { renderAdminInquiriesPanel } from '../src/frontend/views/AdminInquiriesPanel.js';

class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = { localStorage: mockStorage };

describe('Customer Inquiry Support Suite', () => {
  beforeEach(() => {
    mockStorage.clear();
    (CustomerInquiryStore as any).inquiries = null;
  });

  it('1. 고객 문의 접수 폼 모달에 필수 입력창(성함, 회신 이메일, 문의 유형)이 모두 포함되어야 한다', () => {
    const html = renderLegalAndSupportModals();
    expect(html).toContain('id="modal-support-container"');
    expect(html).toContain('id="form-customer-support"');
    expect(html).toContain('id="support-category"');
    expect(html).toContain('id="support-name"');
    expect(html).toContain('id="support-reply-email"');
    expect(html).toContain('id="support-title"');
    expect(html).toContain('id="support-content"');
  });

  it('2. 1:1 온라인 문의 등록 시 신규 ID와 pending 상태로 정상 적재되어야 한다', () => {
    const newInq = CustomerInquiryStore.addInquiry({
      userId: 'test_user_01',
      userName: '홍길동',
      replyEmail: 'hong@example.com',
      phone: '010-1234-5678',
      orderId: 'ORD-TEST-123',
      category: '결제 & 입금 확인 문의',
      title: '무통장 입금 승인 요청드립니다',
      content: '방금 토스뱅크로 50,000원 입금 완료했습니다.',
    });

    expect(newInq.id).toMatch(/^INQ-\d{8}-\d{4}$/);
    expect(newInq.status).toBe('pending');
    expect(newInq.userName).toBe('홍길동');
    expect(newInq.replyEmail).toBe('hong@example.com');

    const list = CustomerInquiryStore.getInquiries();
    expect(list.some(i => i.id === newInq.id)).toBe(true);
  });

  it('3. 관리자 공식 답변 등록 시 answered 상태와 일시가 정상 기록되어야 한다', () => {
    const newInq = CustomerInquiryStore.addInquiry({
      userName: '김철수',
      replyEmail: 'chulsoo@example.com',
      category: '사주 분석 & 리포트 문의',
      title: '대운 시기 관련 문의',
      content: '대운 변경 시점 상담 부탁드립니다.',
    });

    const answerSuccess = CustomerInquiryStore.answerInquiry(
      newInq.id,
      '안녕하세요 김철수 고객님, 관리자 검토 완료되어 이메일로 상세 가이드를 발송해 드렸습니다.'
    );

    expect(answerSuccess).toBe(true);
    const updated = CustomerInquiryStore.getInquiryById(newInq.id);
    expect(updated?.status).toBe('answered');
    expect(updated?.adminAnswer).toContain('관리자 검토 완료');
    expect(updated?.answeredAt).toBeDefined();
  });

  it('4. 관리자 고객센터 패널 렌더링 시 목록 및 답변 대기 카운트가 정상 노출되어야 한다', () => {
    const html = renderAdminInquiriesPanel();
    expect(html).toContain('고객센터 1:1 고객 문의 게시판');
    expect(html).toContain('답변대기');
    expect(html).toContain('btn-toggle-admin-inquiry-row');
  });

  it('5. 문의 내역 삭제 요청 시 정상 제거되어야 한다', () => {
    const newInq = CustomerInquiryStore.addInquiry({
      userName: '삭제대상',
      replyEmail: 'del@example.com',
      category: '기타 문의',
      title: '테스트 문의',
      content: '삭제할 테스트 문의입니다.',
    });

    expect(CustomerInquiryStore.getInquiryById(newInq.id)).toBeDefined();
    const delResult = CustomerInquiryStore.deleteInquiry(newInq.id);
    expect(delResult).toBe(true);
    expect(CustomerInquiryStore.getInquiryById(newInq.id)).toBeUndefined();
  });
});

