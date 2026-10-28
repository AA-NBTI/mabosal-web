/**
 * AuthService (정석 ID/비밀번호 기반 인증 및 회원가입 계정 저장소)
 */

import { getStorage } from '../modules/persistence/index.js';

export type UserRole = 'guest' | 'user' | 'partner' | 'admin';
export type PartnerType = 'AFFILIATE' | 'EXPERT' | 'HYBRID';

export interface UserAccount {
  id: string;          // 고유 ID
  username: string;    // 로그인 아이디
  password: string;    // 비밀번호
  name: string;        // 실명 / 활동명
  email: string;
  phone?: string;
  birthDate?: string;
  birthTime?: string;
  calendarType?: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  gender?: 'male' | 'female';
  role: UserRole;
  partnerType?: PartnerType;
  partnerCode?: string;
  yeopBalance: number;
  joinedAt: string;
}

const STORAGE_KEY_ACCOUNTS = 'mabosal_registered_accounts';
const STORAGE_KEY_CURRENT_SESSION = 'mabosal_auth_session';

export class AuthService {
  // 기본 시드(Seed) 계정 데이터베이스
  private static defaultAccounts: UserAccount[] = [
    {
      id: 'acc_admin_01',
      username: 'admin',
      password: 'aa1111',
      name: '최고관리자 (Master)',
      email: 'master@mabosal.com',
      phone: '010-0000-0000',
      role: 'admin',
      yeopBalance: 999999,
      joinedAt: '2026-01-01',
    },
    {
      id: 'acc_partner_01',
      username: 'partner1',
      password: '1234',
      name: '도선도사 (김도원)',
      email: 'creator@partner.mabosal.com',
      phone: '010-1234-5678',
      role: 'partner',
      partnerType: 'HYBRID',
      partnerCode: 'vip_creator',
      yeopBalance: 5000,
      joinedAt: '2026-08-01',
    },
    {
      id: 'acc_user_01',
      username: 'user1',
      password: '1234',
      name: '홍길동',
      email: 'hong@mabosal.com',
      phone: '010-9876-5432',
      birthDate: '1993-08-15',
      birthTime: '12',
      calendarType: 'solar',
      gender: 'male',
      role: 'user',
      yeopBalance: 3350,
      joinedAt: '2026-09-15',
    },
  ];

  private static currentSession: UserAccount | null = null;
  private static initialized = false;

  public static init(): void {
    if (this.initialized) return;

    if (true) {
      try {
        // 계정 DB 초기화 (없으면 기본 시드 삽입)
        const storedAccounts = getStorage().getItem(STORAGE_KEY_ACCOUNTS);
        if (!storedAccounts) {
          getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(this.defaultAccounts));
        } else {
          // 관리자 비밀번호 aa1111 최신 동기화 보장
          try {
            const list: UserAccount[] = JSON.parse(storedAccounts);
            let updated = false;
            for (const acc of list) {
              if (acc.username === 'admin' && acc.password !== 'aa1111') {
                acc.password = 'aa1111';
                updated = true;
              }
            }
            if (updated) {
              getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(list));
            }
          } catch {}
        }

        // 현재 로그인 세션 복원
        const storedSession = getStorage().getItem(STORAGE_KEY_CURRENT_SESSION);
        if (storedSession) {
          this.currentSession = JSON.parse(storedSession);
        }
      } catch (e) {
        console.warn('[AuthService] Init error', e);
      }
    }
    this.initialized = true;
  }

  /** 등록된 모든 계정 조회 */
  public static getAllAccounts(): UserAccount[] {
    this.init();
        try {
      const stored = getStorage().getItem(STORAGE_KEY_ACCOUNTS);
      return stored ? JSON.parse(stored) : this.defaultAccounts;
    } catch {
      return this.defaultAccounts;
    }
  }

  /** 현재 로그인 세션 사용자 (없으면 게스트) */
  public static getCurrentUser(): UserAccount {
    this.init();
    if (this.currentSession) return this.currentSession;
    return {
      id: 'guest_0',
      username: 'guest',
      password: '',
      name: '방문자',
      email: '',
      role: 'guest',
      yeopBalance: 0,
      joinedAt: new Date().toISOString(),
    };
  }

  public static isAuthenticated(): boolean {
    this.init();
    return this.currentSession !== null && this.currentSession.role !== 'guest';
  }

  public static isAdmin(): boolean {
    this.init();
    return this.currentSession?.role === 'admin';
  }

  public static isPartner(): boolean {
    this.init();
    return this.currentSession?.role === 'partner';
  }

  /**
   * 1. 정석 아이디 / 비밀번호 로그인
   */
  public static login(username: string, password: string): { success: boolean; message: string; user?: UserAccount } {
    this.init();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      return { success: false, message: '아이디를 입력해주세요.' };
    }
    if (!cleanPassword) {
      return { success: false, message: '비밀번호를 입력해주세요.' };
    }

    const accounts = this.getAllAccounts();
    const found = accounts.find(a => a.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!found) {
      return { success: false, message: '존재하지 않는 아이디입니다. 회원가입을 먼저 진행해주세요.' };
    }

    if (found.password !== cleanPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.' };
    }

    // 로그인 성공 -> 세션 저장
    this.currentSession = found;
    if (true) {
      getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(found));
    }
    this.notifyAuthChange();
    return { success: true, message: `환영합니다, ${found.name} 님!`, user: found };
  }

  /**
   * 2. 정석 신규 회원가입 (아이디, 비번, 비번확인, 이름, 역할)
   */
  public static register(params: {
    username: string;
    password: string;
    passwordConfirm: string;
    name: string;
    phone?: string;
    role: UserRole;
    partnerType?: PartnerType;
  }): { success: boolean; message: string; user?: UserAccount } {
    this.init();
    const username = params.username.trim();
    const password = params.password.trim();
    const name = params.name.trim();

    if (!username || username.length < 3) {
      return { success: false, message: '아이디는 3자 이상 입력해주세요.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: '비밀번호는 4자 이상 입력해주세요.' };
    }
    if (password !== params.passwordConfirm.trim()) {
      return { success: false, message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' };
    }
    if (!name) {
      return { success: false, message: '이름을 입력해주세요.' };
    }

    const accounts = this.getAllAccounts();
    if (accounts.some(a => a.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.' };
    }

    const newAccount: UserAccount = {
      id: `acc_${Date.now()}`,
      username,
      password,
      name,
      email: `${username}@mabosal.com`,
      phone: params.phone?.trim() || '',
      role: params.role,
      partnerType: params.role === 'partner' ? (params.partnerType || 'HYBRID') : undefined,
      partnerCode: params.role === 'partner' ? username : undefined,
      yeopBalance: params.role === 'user' ? 3000 : 0, // 가입 축하 3,000엽
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    accounts.push(newAccount);
    if (true) {
      getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    }

    // 가입 즉시 자동 로그인
    this.currentSession = newAccount;
    if (true) {
      getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(newAccount));
    }
    this.notifyAuthChange();

    return { success: true, message: `회원가입이 완료되었습니다! 환영합니다, ${name} 님!`, user: newAccount };
  }

  /**
   * 3. 로그아웃
   */

  public static notifyAuthChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mm-auth-changed'));
      window.dispatchEvent(new CustomEvent('mm-cart-changed'));
    }
  }
  public static logout(): void {
    this.currentSession = null;
    if (true) {
      getStorage().removeItem(STORAGE_KEY_CURRENT_SESSION);
    }
    this.notifyAuthChange();
  }

  /**
   * 4. 엽전(보너스 포인트) 적립 및 지급
   */
  public static awardYeop(amount: number, username?: string): number {
    this.init();
    const accounts = this.getAllAccounts();
    const targetUsername = username || this.currentSession?.username;
    if (!targetUsername) return 0;

    const acc = accounts.find(a => a.username.toLowerCase() === targetUsername.toLowerCase());
    if (acc) {
      acc.yeopBalance = (acc.yeopBalance || 0) + amount;
      if (true) {
        getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      }
      if (this.currentSession && this.currentSession.username.toLowerCase() === targetUsername.toLowerCase()) {
        this.currentSession.yeopBalance = acc.yeopBalance;
        if (true) {
          getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(this.currentSession));
        }
      }
      return acc.yeopBalance;
    }
    return 0;
  }
  /**
   * 5. 회원 계정 정보 (아이디, 비밀번호, 이용자 프로필) 수정
   */
  public static updateAccount(id: string, updates: {
    username?: string;
    password?: string;
    name?: string;
    phone?: string;
    birthDate?: string;
    birthTime?: string;
    calendarType?: 'solar' | 'lunar';
    isLeapMonth?: boolean;
    gender?: 'male' | 'female';
  }): { success: boolean; message: string; user?: UserAccount } {
    this.init();
    const accounts = this.getAllAccounts();
    const acc = accounts.find(a => a.id === id || a.username.toLowerCase() === id.toLowerCase());
    if (!acc) {
      return { success: false, message: '계정 정보를 찾을 수 없습니다.' };
    }

    // 아이디 변경 시 중복 검사
    if (updates.username && updates.username.trim() && updates.username.trim() !== acc.username) {
      const newUsername = updates.username.trim();
      if (newUsername.length < 3) {
        return { success: false, message: '아이디는 최소 3자 이상이어야 합니다.' };
      }
      if (accounts.some(a => a.id !== acc.id && a.username.toLowerCase() === newUsername.toLowerCase())) {
        return { success: false, message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.' };
      }
      acc.username = newUsername;
    }

    // 비밀번호 변경
    if (updates.password && updates.password.trim()) {
      if (updates.password.trim().length < 4) {
        return { success: false, message: '비밀번호는 최소 4자 이상이어야 합니다.' };
      }
      acc.password = updates.password.trim();
    }

    // 이용자 정보 변경
    if (updates.name && updates.name.trim()) acc.name = updates.name.trim();
    if (updates.phone !== undefined) acc.phone = updates.phone.trim();
    if (updates.birthDate !== undefined) acc.birthDate = updates.birthDate;
    if (updates.birthTime !== undefined) acc.birthTime = updates.birthTime;
    if (updates.calendarType !== undefined) acc.calendarType = updates.calendarType;
    if (updates.isLeapMonth !== undefined) acc.isLeapMonth = updates.isLeapMonth;
    if (updates.gender !== undefined) acc.gender = updates.gender;

    // 저장 및 세션 갱신
    if (true) {
      getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    }
    if (this.currentSession && this.currentSession.id === acc.id) {
      this.currentSession = { ...acc };
      if (true) {
        getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(this.currentSession));
      }
    }

    return { success: true, message: '회원 정보가 성공적으로 수정되었습니다.', user: acc };
  }

  /**
   * 6. 회원 탈퇴 (계정 영구 삭제 및 세션 로그아웃)
   */
  public static deleteAccount(id: string): { success: boolean; message: string } {
    this.init();
    let accounts = this.getAllAccounts();
    const target = accounts.find(a => a.id === id || a.username.toLowerCase() === id.toLowerCase());
    if (!target) {
      return { success: false, message: '탈퇴할 계정을 찾을 수 없습니다.' };
    }

    accounts = accounts.filter(a => a.id !== target.id);
    if (true) {
      getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    }

    // 현재 세션 로그아웃
    this.logout();
    return { success: true, message: '회원 탈퇴가 완료되었습니다.' };
  }


  /**
   * 7. 현재 로그인 회원의 프로필(사주 입력 항목 등) 갱신 - 계정 id 기준으로 DB와 메모리 세션을 함께 갱신
   */
  public static updateProfile(patch: Partial<Pick<UserAccount, 'name' | 'phone' | 'birthDate' | 'birthTime' | 'calendarType' | 'isLeapMonth' | 'gender'>>): { success: boolean; message: string } {
    this.init();
    const current = this.currentSession;
    if (!current || current.role === 'guest') {
      return { success: false, message: '로그인이 필요합니다.' };
    }
    const accounts = this.getAllAccounts();
    const acc = accounts.find(a => a.id === current.id);
    if (!acc) {
      return { success: false, message: '계정 정보를 찾을 수 없습니다.' };
    }
    Object.assign(acc, patch);
    getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    this.currentSession = { ...acc };
    getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(this.currentSession));
    return { success: true, message: '프로필이 갱신되었습니다.' };
  }

  /** 테스트/로그아웃 시 메모리 캐시 초기화 */
  public static resetForTest(): void {
    this.currentSession = null;
    this.initialized = false;
  }
}
