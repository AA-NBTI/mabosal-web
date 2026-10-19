import { describe, it, expect, beforeEach } from 'vitest';
import { ownsRecord, toIdentity, Identity } from '../src/frontend/modules/identity/index.js';
import {
  filterOwnedOrders,
  isReportOrderViewable,
  canViewOrder,
  resolveOrderForView,
  hasEntitlement,
  EntitlementOrder,
} from '../src/frontend/modules/entitlement/entitlement-core.js';
import {
  normalizeBirthDate,
  normalizeBirthTime,
  resolveProfileOwnerId,
  profileStorageKey,
} from '../src/frontend/modules/saju-profile/profile-core.js';
import {
  toDailyFortuneInput,
  deriveYongshin,
} from '../src/frontend/modules/fortune-adapter/index.js';
import { DailyFortuneEngine } from '../src/modules/daily-fortune/daily-fortune-engine.js';
import { MabosalSessionEngine } from '../src/modules/phase13/mabosal-session.js';

describe('[Architecture 1단계] identity & ownership', () => {
  const user1: Identity = {
    userId: 'acc_001',
    role: 'user',
    isGuest: false,
    username: 'user1',
    name: '김철수',
    email: 'chulsoo@mabosal.com',
    phone: '010-1111-2222',
  };

  const guest: Identity = {
    userId: null,
    role: 'guest',
    isGuest: true,
    username: '',
    name: '',
    email: '',
    phone: '',
  };

  it('게스트는 어떤 레코드도 소유할 수 없다', () => {
    expect(ownsRecord({ userId: 'acc_001' }, guest)).toBe(false);
    expect(ownsRecord({ buyerEmail: 'guest@mabosal.com' }, guest)).toBe(false);
    expect(ownsRecord({}, guest)).toBe(false);
  });

  it('userId가 일치할 때만 본인 소유로 인정하며, 타인 레코드는 차단한다', () => {
    expect(ownsRecord({ userId: 'acc_001' }, user1)).toBe(true);
    expect(ownsRecord({ userId: 'acc_999' }, user1)).toBe(false);
  });

  it('동명이인(buyerName)만으로는 소유권을 인정하지 않는다', () => {
    const recordOther = { userId: 'acc_999', buyerName: '김철수' } as any;
    expect(ownsRecord(recordOther, user1)).toBe(false);
  });
});

describe('[Architecture 2단계] entitlement & result gate', () => {
  const user1: Identity = {
    userId: 'acc_001',
    role: 'user',
    isGuest: false,
    username: 'user1',
    name: '김철수',
    email: 'chulsoo@mabosal.com',
    phone: '010-1111-2222',
  };

  const orders: EntitlementOrder[] = [
    { orderId: 'ORD-1', userId: 'acc_001', status: 'completed', deliveryType: 'saju_report', reportTier: 'PAID', productId: 'prod-paid-saju-premium' },
    { orderId: 'ORD-2', userId: 'acc_001', status: 'pending', deliveryType: 'saju_report', reportTier: 'PREMIUM' },
    { orderId: 'ORD-3', userId: 'acc_OTHER', status: 'completed', deliveryType: 'saju_report', reportTier: 'PREMIUM', productId: 'prod-paid-saju-vip' },
  ];

  it('본인 소유 주문만 필터링되며 타인의 주문(ORD-3)은 접근할 수 없다', () => {
    const owned = filterOwnedOrders(orders, user1);
    expect(owned.map(o => o.orderId)).toEqual(['ORD-1', 'ORD-2']);
  });

  it('결제 완료(completed) 리포트만 열람 가능하며, 입금대기(pending)는 열람할 수 없다', () => {
    expect(canViewOrder(orders, user1, 'ORD-1')).toBe(true);
    expect(canViewOrder(orders, user1, 'ORD-2')).toBe(false);
    expect(canViewOrder(orders, user1, 'ORD-3')).toBe(false); // 타인 주문
  });

  it('resolveOrderForView: 타인 주문 번호를 요청하면 무시하고 본인의 결제완료 주문으로 안전하게 대체하거나 null을 반환한다', () => {
    const resolved = resolveOrderForView(orders, user1, 'ORD-3');
    expect(resolved).toBeNull(); // ORD-3은 타인 주문이므로 접근 불가

    const valid = resolveOrderForView(orders, user1, 'ORD-1');
    expect(valid?.orderId).toBe('ORD-1');
  });

  it('hasEntitlement: 본인이 결제 완료한 티어만 true를 반환한다', () => {
    const hasPaid = hasEntitlement(orders, user1, o => o.reportTier === 'PAID');
    const hasVip = hasEntitlement(orders, user1, o => o.reportTier === 'PREMIUM');
    expect(hasPaid).toBe(true);
    expect(hasVip).toBe(false); // ORD-2는 pending, ORD-3은 타인 주문
  });
});

describe('[Architecture 2단계] saju-profile normalization', () => {
  it('생년월일 정규화 (YYYYMMDD / YYYY-MM-DD)', () => {
    expect(normalizeBirthDate('19900321')).toEqual({ iso: '1990-03-21', year: 1990, month: 3, day: 21 });
    expect(normalizeBirthDate('1990-03-21')).toEqual({ iso: '1990-03-21', year: 1990, month: 3, day: 21 });
    expect(normalizeBirthDate('invalid')).toBeNull();
    expect(normalizeBirthDate('1990-02-31')).toBeNull(); // 존재하지 않는 일자 거부
  });

  it('출생시간 정규화 (HH:mm)', () => {
    expect(normalizeBirthTime('14:30')).toBe('14:30');
    expect(normalizeBirthTime('1430')).toBe('14:30');
    expect(normalizeBirthTime('9')).toBe('09:00');
    expect(normalizeBirthTime('25:00')).toBeNull();
    expect(normalizeBirthTime('')).toBeNull();
  });

  it('소유자 ID 단일 정규화 (username 변경 시에도 account.id 키 유지)', () => {
    const accounts = [{ id: 'acc_100', username: 'initial_name' }];
    const owner = resolveProfileOwnerId('initial_name', accounts, { id: 'acc_100', username: 'new_name', isGuest: false });
    expect(owner).toBe('acc_100');
    expect(profileStorageKey(owner)).toBe('mm_user_saju_profile_acc_100');
  });
});

describe('[Architecture 3단계] fortune-adapter & personal score engine', () => {
  const engine = new MabosalSessionEngine();

  it('용신/희신 도출 규칙 검증', () => {
    // 목 일간 + 신약 -> 인성(수) 용신, 비겁(목) 희신
    const weakWood = deriveYongshin('중화신약', '목');
    expect(weakWood.yongshin).toBe('수');
    expect(weakWood.heeshin).toBe('목');

    // 화 일간 + 신강 -> 식상(토) 용신, 재성(금) 희신
    const strongFire = deriveYongshin('신강', '화');
    expect(strongFire.yongshin).toBe('토');
    expect(strongFire.heeshin).toBe('금');
  });

  it('서로 다른 두 명의 사주 세션은 행운/금전/애정/활력 지수와 용신이 1:1 개인화되어 산출된다', () => {
    // 인물 A: 1985-05-12 08:30 (신금 일간)
    const sessionA = engine.createSession({ birthDate: '1985-05-12', birthTime: '08:30', gender: 'male', region: 'Seoul' }).data;
    // 인물 B: 1993-02-15 14:00 (갑목 일간)
    const sessionB = engine.createSession({ birthDate: '1993-02-15', birthTime: '14:00', gender: 'female', region: 'Seoul' }).data;

    expect(sessionA).toBeDefined();
    expect(sessionB).toBeDefined();

    const adaptedA = toDailyFortuneInput(sessionA, { userName: '의뢰인A', gender: 'male' });
    const adaptedB = toDailyFortuneInput(sessionB, { userName: '의뢰인B', gender: 'female' });

    expect(adaptedA).not.toBeNull();
    expect(adaptedB).not.toBeNull();

    const scoresA = DailyFortuneEngine.calculate(adaptedA!.input);
    const scoresB = DailyFortuneEngine.calculate(adaptedB!.input);

    // 개인화 플래그 참 확인
    expect(scoresA.isPersonalized).toBe(true);
    expect(scoresB.isPersonalized).toBe(true);

    // 서로 다른 사주 원국이므로 일간 오행과 용신이 달라야 함
    expect(adaptedA?.input.sajuCore?.day_element).not.toEqual(adaptedB?.input.sajuCore?.day_element);

    // 금전운, 애정운, 활력도 중 최소 하나 이상의 지수가 1:1 맞춤 연산으로 점수 차이가 발생해야 함
    const hasDifference =
      scoresA.celestialScore !== scoresB.celestialScore ||
      scoresA.moneyScore !== scoresB.moneyScore ||
      scoresA.loveScore !== scoresB.loveScore ||
      scoresA.vitalityScore !== scoresB.vitalityScore;

    expect(hasDifference).toBe(true);
  });
});
