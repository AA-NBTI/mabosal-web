/**
 * 고객센터 1:1 온라인 문의 저장소 (CustomerInquiryStore)
 * - 사용자 문의 접수, 관리자 답변 등록, 상태 추적 (접수대기/답변완료)
 * - LocalStorage 기반 영구 보존 및 실시간 화면 반응형 연동
 */

export interface CustomerInquiry {
  id: string;               // 예: INQ-20261015-8921
  userId?: string;          // 회원 ID (게스트일 경우 undefined)
  userName: string;         // 작성자명
  replyEmail: string;       // 회신받을 이메일
  phone?: string;           // 연락처 (선택)
  orderId?: string;         // 관련 주문번호 (선택)
  category: string;         // 문의 유형
  title: string;            // 문의 제목
  content: string;          // 문의 내용
  status: 'pending' | 'answered'; // 처리 상태
  createdAt: string;        // 접수 일시 ISO
  adminAnswer?: string;     // 관리자 답변 내용
  answeredAt?: string;      // 답변 일시 ISO
}

const STORAGE_KEY = 'mabosal_customer_inquiries_v1';

const INITIAL_INQUIRIES: CustomerInquiry[] = [
  {
    id: 'INQ-20261015-1001',
    userId: 'user_001',
    userName: '박지원',
    replyEmail: 'jiwon.park@example.com',
    phone: '010-3456-7890',
    orderId: 'ORD-2026-0001',
    category: '사주 분석 & 리포트 문의',
    title: '4대 정밀 사주 리포트 대운 해석 관련 문의드립니다.',
    content: '지난주 평생 정밀 사주 리포트를 결제하여 열람했습니다. 2027년 정묘년 상반기 재물운에서 방어 기간과 공격 시점이 나오는데, 이 시기 투자 전환점을 좀 더 자세히 상담받을 수 있는 바우처가 있을까요?',
    status: 'answered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    adminAnswer: '안녕하세요 박지원 고객님, 마보살 전문 상담 센터입니다. 고객님의 정밀 사주 분석 결과를 바탕으로 심층 상담을 진행하시려면 스토어 내 [1:1 상담권] 카테고리의 "천명원 1:1 집중 심층 상담권"을 이용하시면 전문 역학 상담사와 직접 맞춤 통화를 진행하실 수 있습니다. 이용해 주셔서 진심으로 감사드립니다.',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'INQ-20261015-1002',
    userId: 'user_002',
    userName: '이민호',
    replyEmail: 'minho.lee@example.com',
    phone: '010-8899-1122',
    orderId: 'ORD-2026-0003',
    category: '결제 & 입금 확인 문의',
    title: '무통장 입금 신청했는데 입금자명 확인 부탁드립니다.',
    content: '신년운세 유료 리포트 무통장 입금으로 신청하고 방금 토스뱅크로 40,000원 입금 완료했습니다. 입금자명 이민호로 보냈는데 확인 후 빠른 승인 부탁드립니다!',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'INQ-20261015-1003',
    userName: '박지훈',
    replyEmail: 'jihun.park@example.com',
    category: '서비스 이용 문의',
    title: '태어난 시를 정확히 모를 때 분석 정확도 문의',
    content: '부모님께서 제가 태어난 시를 낮 12시경으로만 기억하고 계시는데, 시를 정확히 모를 때도 4대 정밀 사주 리포트 생성이 문제없이 가능한가요?',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  }
];

export class CustomerInquiryStore {
  private static inquiries: CustomerInquiry[] | null = null;

  public static getInquiries(): CustomerInquiry[] {
    if (!this.inquiries) {
      this.load();
    }
    return [...this.inquiries!];
  }

  public static getPendingCount(): number {
    return this.getInquiries().filter(i => i.status === 'pending').length;
  }

  public static getInquiryById(id: string): CustomerInquiry | undefined {
    return this.getInquiries().find(i => i.id === id);
  }

  public static getInquiriesByEmail(email: string): CustomerInquiry[] {
    return this.getInquiries().filter(i => i.replyEmail.toLowerCase() === email.toLowerCase());
  }

  public static addInquiry(params: Omit<CustomerInquiry, 'id' | 'status' | 'createdAt'>): CustomerInquiry {
    const id = `INQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInquiry: CustomerInquiry = {
      ...params,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const list = this.getInquiries();
    list.unshift(newInquiry);
    this.inquiries = list;
    this.save();
    return newInquiry;
  }

  public static answerInquiry(id: string, answerText: string): boolean {
    const list = this.getInquiries();
    const target = list.find(i => i.id === id);
    if (!target) return false;

    target.adminAnswer = answerText.trim();
    target.status = 'answered';
    target.answeredAt = new Date().toISOString();
    this.inquiries = list;
    this.save();
    return true;
  }

  public static deleteInquiry(id: string): boolean {
    let list = this.getInquiries();
    const initialLen = list.length;
    list = list.filter(i => i.id !== id);
    if (list.length === initialLen) return false;

    this.inquiries = list;
    this.save();
    return true;
  }

  private static load(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.inquiries = JSON.parse(raw);
          return;
        }
      }
    } catch (e) {
      console.warn('CustomerInquiryStore load error:', e);
    }
    this.inquiries = JSON.parse(JSON.stringify(INITIAL_INQUIRIES));
    this.save();
  }

  private static save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage && this.inquiries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inquiries));
      }
    } catch (e) {
      console.warn('CustomerInquiryStore save error:', e);
    }
  }
}
