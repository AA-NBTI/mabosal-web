/**
 * AuthService (정석 ID/비밀번호 기반 인증 및 회원가입 계정 저장소)
 */

import { getStorage } from '../modules/persistence/index.js';
import { supabase, SUPABASE_CONFIG } from '../modules/supabase/supabase-client.js';

export type UserRole = 'guest' | 'user' | 'partner' | 'admin';
export type PartnerType = 'AFFILIATE' | 'EXPERT' | 'HYBRID';
export type MemberStatus = 'active' | 'suspended' | 'deleted';

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
  status?: MemberStatus;
  suspendedReason?: string;
  suspendedAt?: string;
  lastSignInAt?: string;
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
   * 아이디 중복 여부 실시간 확인 (로컬 및 Supabase profiles)
   */
  public static async checkUsernameAvailable(username: string): Promise<{ available: boolean; message: string }> {
    this.init();
    const clean = username.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      return { available: false, message: '아이디는 최소 3자 이상 입력해 주세요.' };
    }

    const isCloudBrowser = typeof window !== 'undefined' && !SUPABASE_CONFIG.isLocal;

    // 1. 로컬/테스트 환경 전용 계정 확인 (클라우드 환경에서는 stale localStorage로 인한 재가입 차단을 방지)
    if (!isCloudBrowser) {
      const localAccounts = this.getAllAccounts();
      if (localAccounts.some(a => a.username.toLowerCase() === clean)) {
        return { available: false, message: '이미 사용 중인 아이디입니다.' };
      }
    }

    // 2. Supabase profiles 확인
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle();

      if (!error && data) {
        return { available: false, message: '이미 사용 중인 아이디입니다.' };
      }
    } catch (e) {
      console.warn('[AuthService] checkUsernameAvailable remote deferred:', e);
    }

    return { available: true, message: '사용 가능한 아이디입니다.' };
  }

  /**
   * 1. 정석 아이디 / 비밀번호 로그인 (Supabase Auth 연동 및 로컬 하위호환)
   */
  public static async login(username: string, password: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
    this.init();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      return { success: false, message: '아이디를 입력해주세요.' };
    }
    if (!cleanPassword) {
      return { success: false, message: '비밀번호를 입력해주세요.' };
    }

    // [Supabase Auth 클라우드 로그인 시도]
    // 아이디를 이메일 형식으로 변환 (아이디@mabosal.com 또는 직접 입력한 이메일)
    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@mabosal.com`;

    const isCloudBrowser = typeof window !== 'undefined' && !SUPABASE_CONFIG.isLocal;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: cleanPassword,
      });

      if (authError && authError.message.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          message: '이메일 인증이 완료되지 않은 계정입니다. Supabase에서 이메일 인증(Confirm email)을 끄거나 계정을 인증해주세요.',
        };
      }

      if (authError && authError.message.toLowerCase().includes('banned')) {
        return {
          success: false,
          message: '관리자에 의해 이용이 정지된 계정입니다.',
        };
      }

      if (!authError && authData.user) {
        // 프로필 정보 조회
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (prof?.status === 'suspended') {
          await supabase.auth.signOut();
          const reasonMsg = prof.suspended_reason ? ` (사유: ${prof.suspended_reason})` : '';
          return {
            success: false,
            message: `이용이 정지된 계정입니다.${reasonMsg}`,
          };
        }

        if (prof?.status === 'deleted') {
          await supabase.auth.signOut();
          return {
            success: false,
            message: '탈퇴 또는 삭제된 계정입니다.',
          };
        }

        const role: UserRole = (prof?.role as UserRole) || (cleanUsername === 'admin' ? 'admin' : 'user');
        const userAcc: UserAccount = {
          id: authData.user.id,
          username: prof?.username || cleanUsername,
          password: '', // 보안상 클라이언트 메모리에 비밀번호 보관하지 않음
          name: prof?.name || authData.user.user_metadata?.name || cleanUsername,
          email: authData.user.email || email,
          phone: prof?.phone || '',
          role,
          yeopBalance: 3000,
          joinedAt: authData.user.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          status: (prof?.status as MemberStatus) || 'active',
        };

        this.currentSession = userAcc;
        getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(userAcc));
        this.notifyAuthChange();
        return { success: true, message: `환영합니다, ${userAcc.name} 님!`, user: userAcc };
      }
    } catch (e) {
      console.warn('[AuthService] Supabase auth try failed, falling back to local:', e);
    }

    // [Fallback]: Supabase 실패 시 기존 로컬 계정 검증 (데모 시드 계정 및 테스트 환경)
    const accounts = this.getAllAccounts();
    const found = accounts.find(a => a.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!found) {
      return { success: false, message: '존재하지 않는 아이디입니다. 회원가입을 먼저 진행해주세요.' };
    }

    if (found.status === 'suspended') {
      const reasonMsg = found.suspendedReason ? ` (사유: ${found.suspendedReason})` : '';
      return { success: false, message: `이용이 정지된 계정입니다.${reasonMsg}` };
    }

    if (found.status === 'deleted') {
      return { success: false, message: '탈퇴 또는 삭제된 계정입니다.' };
    }

    // 클라우드 환경에서는 비밀번호가 비어있는 로컬 캐시 계정의 무조건 통과를 차단
    if (isCloudBrowser && !found.password) {
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다. 다시 확인해주세요.' };
    }

    if (found.password && found.password !== cleanPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.' };
    }

    // 로그인 성공 -> 세션 저장
    this.currentSession = found;
    getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(found));
    this.notifyAuthChange();
    return { success: true, message: `환영합니다, ${found.name} 님!`, user: found };
  }

  /**
   * 2. 정석 신규 회원가입 (Supabase Auth 생성 + 로컬 동기화)
   */
  public static async register(params: {
    username: string;
    password: string;
    passwordConfirm: string;
    name: string;
    phone?: string;
    role: UserRole;
    partnerType?: PartnerType;
  }): Promise<{ success: boolean; message: string; user?: UserAccount }> {
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

    const email = username.includes('@') ? username : `${username}@mabosal.com`;
    const isCloudBrowser = typeof window !== 'undefined' && !SUPABASE_CONFIG.isLocal;

    // [Supabase Auth 클라우드 회원가입 시도]
    let supabaseUserId: string | null = null;
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            name,
            phone: params.phone || '',
            role: params.role,
          },
        },
      });
      if (signUpError) {
        console.warn('[AuthService] Supabase signUp note:', signUpError.message);
        if (isCloudBrowser) {
          const msg = signUpError.message.toLowerCase();
          if (msg.includes('already registered') || msg.includes('already exists')) {
            return { success: false, message: '이미 가입된 아이디입니다. 로그인을 진행해주세요.' };
          }
          if (msg.includes('password') || msg.includes('at least')) {
            return { success: false, message: '비밀번호는 6자 이상으로 입력해주세요.' };
          }
          return { success: false, message: `회원가입 처리 중 오류가 발생했습니다: ${signUpError.message}` };
        }
      } else if (signUpData.user) {
        if (isCloudBrowser && signUpData.user.identities && signUpData.user.identities.length === 0) {
          return { success: false, message: '이미 가입된 아이디입니다. 로그인을 진행해주세요.' };
        }
        if (isCloudBrowser && !signUpData.session) {
          return {
            success: false,
            message: '서버의 이메일 인증(Confirm email) 설정이 켜져 있어 즉시 가입이 완료되지 않았습니다. Supabase 설정에서 Confirm email을 비활성화해주세요.',
          };
        }
        supabaseUserId = signUpData.user.id;
      }
    } catch (e) {
      console.warn('[AuthService] Supabase signUp failed:', e);
      if (isCloudBrowser) {
        return { success: false, message: '회원가입 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' };
      }
    }

    const accounts = this.getAllAccounts();
    const newAccount: UserAccount = {
      id: supabaseUserId || `acc_${Date.now()}`,
      username,
      password: supabaseUserId ? '' : password, // Supabase 연동 시 평문 미보관, 로컬/테스트 폴백 시 검증용 보관
      name,
      email,
      phone: params.phone?.trim() || '',
      role: params.role,
      partnerType: params.role === 'partner' ? (params.partnerType || 'HYBRID') : undefined,
      partnerCode: params.role === 'partner' ? username : undefined,
      yeopBalance: params.role === 'user' ? 3000 : 0,
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    accounts.push(newAccount);
    getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));

    // 가입 즉시 자동 로그인
    this.currentSession = newAccount;
    getStorage().setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(newAccount));
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

  /**
   * 8. 관리자용: 전체 회원 목록 조회 (Edge Function -> profiles RLS -> 로컬 폴백 순)
   */
  public static async fetchMembersForAdmin(): Promise<{ members: UserAccount[]; source: 'cloud' | 'local'; error?: string }> {
    this.init();
    const isCloudBrowser = typeof window !== 'undefined' && !SUPABASE_CONFIG.isLocal;

    if (isCloudBrowser) {
      // 1차: Edge Function (auth.users + profiles 통합 조회)
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('admin-members', {
          body: { action: 'list' },
        });
        if (!fnErr && Array.isArray(fnData?.members)) {
          const mapped: UserAccount[] = fnData.members.map((m: any) => ({
            id: m.id,
            username: m.username || (m.email ? m.email.split('@')[0] : m.id.slice(0, 8)),
            password: '',
            name: m.name || m.username || '회원',
            email: m.email || '',
            phone: m.phone || '',
            role: (m.role as UserRole) || 'user',
            yeopBalance: Number(m.yeop_balance ?? 3000),
            joinedAt: (m.created_at || new Date().toISOString()).slice(0, 10),
            status: (m.status as MemberStatus) || (m.banned_until ? 'suspended' : 'active'),
            suspendedReason: m.suspended_reason || undefined,
            suspendedAt: m.suspended_at ? String(m.suspended_at).slice(0, 10) : undefined,
            lastSignInAt: m.last_sign_in_at ? String(m.last_sign_in_at).slice(0, 10) : undefined,
          }));
          return { members: mapped, source: 'cloud' };
        }
      } catch (e) {
        console.warn('[AuthService] admin-members Edge Function unavailable, trying profiles table:', e);
      }

      // 2차: profiles 테이블 직접 조회 (관리자 RLS 정책 필요)
      try {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!profErr && Array.isArray(profs)) {
          const mapped: UserAccount[] = profs.map((m: any) => ({
            id: m.id,
            username: m.username || (m.email ? m.email.split('@')[0] : m.id.slice(0, 8)),
            password: '',
            name: m.name || m.username || '회원',
            email: m.email || '',
            phone: m.phone || '',
            role: (m.role as UserRole) || 'user',
            yeopBalance: Number(m.yeop_balance ?? 3000),
            joinedAt: (m.created_at || new Date().toISOString()).slice(0, 10),
            status: (m.status as MemberStatus) || 'active',
            suspendedReason: m.suspended_reason || undefined,
            suspendedAt: m.suspended_at ? String(m.suspended_at).slice(0, 10) : undefined,
          }));
          return { members: mapped, source: 'cloud' };
        }
        return {
          members: this.getAllAccounts(),
          source: 'local',
          error: profErr?.message || 'Supabase profiles 조회 권한이 없습니다.',
        };
      } catch (e: any) {
        return {
          members: this.getAllAccounts(),
          source: 'local',
          error: e?.message || '원격 회원 조회에 실패했습니다.',
        };
      }
    }

    return { members: this.getAllAccounts(), source: 'local' };
  }

  /**
   * 9. 관리자용: 회원 이용 정지 / 정지 해제
   */
  public static async setMemberStatusByAdmin(
    targetUserId: string,
    action: 'suspend' | 'unsuspend',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    this.init();
    const isCloudBrowser = typeof window !== 'undefined' && !SUPABASE_CONFIG.isLocal;
    const nextStatus: MemberStatus = action === 'suspend' ? 'suspended' : 'active';

    if (isCloudBrowser) {
      let edgeHandled = false;
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('admin-members', {
          body: { action, userId: targetUserId, reason },
        });
        if (!fnErr && fnData?.success) {
          edgeHandled = true;
        } else if (fnData?.error) {
          return { success: false, message: fnData.error };
        }
      } catch {
        // Edge Function 미배포 시 profiles 직접 업데이트로 폴백
      }

      if (!edgeHandled) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({
            status: nextStatus,
            suspended_reason: action === 'suspend' ? (reason || '관리자 직권 이용 정지') : null,
            suspended_at: action === 'suspend' ? new Date().toISOString() : null,
          })
          .eq('id', targetUserId);

        if (updErr) {
          return { success: false, message: `상태 변경 실패: ${updErr.message}` };
        }
      }
    }

    // 로컬 캐시 동기화
    const accounts = this.getAllAccounts();
    const target = accounts.find(a => a.id === targetUserId);
    if (target) {
      target.status = nextStatus;
      target.suspendedReason = action === 'suspend' ? (reason || '관리자 직권 이용 정지') : undefined;
      target.suspendedAt = action === 'suspend' ? new Date().toISOString().slice(0, 10) : undefined;
      getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    }

    return {
      success: true,
      message: action === 'suspend' ? '해당 회원의 이용을 정지했습니다.' : '이용 정지를 해제했습니다.',
    };
  }

  /**
   * 10. 관리자용: 회원 삭제
   */
  public static async deleteMemberByAdmin(targetUserId: string): Promise<{ success: boolean; message: string }> {
    this.init();
    const isCloudBrowser = typeof window !== 'undefined' && !SUPABASE_CONFIG.isLocal;

    if (isCloudBrowser) {
      let edgeHandled = false;
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('admin-members', {
          body: { action: 'delete', userId: targetUserId },
        });
        if (!fnErr && fnData?.success) {
          edgeHandled = true;
        } else if (fnData?.error) {
          return { success: false, message: fnData.error };
        }
      } catch {
        // Edge Function 미배포 시 profiles 삭제/soft-delete 폴백
      }

      if (!edgeHandled) {
        const { error: delErr } = await supabase
          .from('profiles')
          .delete()
          .eq('id', targetUserId);

        if (delErr) {
          return { success: false, message: `회원 삭제 실패: ${delErr.message}` };
        }
      }
    }

    const accounts = this.getAllAccounts().filter(a => a.id !== targetUserId);
    getStorage().setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));

    return { success: true, message: '회원이 삭제되었습니다.' };
  }

  /** 테스트/로그아웃 시 메모리 캐시 초기화 */
  public static resetForTest(): void {
    this.currentSession = null;
    this.initialized = false;
  }
}
