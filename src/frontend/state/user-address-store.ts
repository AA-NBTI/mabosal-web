/**
 * [UserAddressStore] 회원 배송지 주소록 저장소
 * - 다중 배송지 등록/관리 및 기본 배송지 설정
 * - 주문 결제창에서 원클릭 자동 완성 연동
 */

import { AuthService } from './auth-service.js';
import { supabase } from '../modules/supabase/supabase-client.js';
import { formatKoreanPhone } from '../utils/postcode-helper.js';

export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  zipCode?: string;
  address: string;
  detailAddress: string;
  deliveryMemo?: string;
  isDefault: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'mabosal_user_addresses_v1';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UserAddressStore {
  private static syncedUsers = new Set<string>();
  private static syncingUsers = new Set<string>();
  private static loadAll(): UserAddress[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveAll(list: UserAddress[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[UserAddressStore] save error:', e);
    }
  }

  /**
   * 특정 회원(또는 현재 로그인 회원)의 배송지 목록 조회
   */
  public static getAddresses(userId?: string): UserAddress[] {
    const uid = userId || AuthService.getCurrentUser().id;
    if (uid && UUID_REGEX.test(uid) && !this.syncedUsers.has(uid) && !this.syncingUsers.has(uid)) {
      void this.syncFromSupabase(uid);
    }
    const all = this.loadAll();
    return all.filter(a => a.userId === uid);
  }

  /**
   * Supabase user_addresses 테이블에서 현재 회원 주소록 동기화
   */
  public static async syncFromSupabase(userId?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUid = sessionData?.session?.user?.id;
      const uid = userId || authUid || AuthService.getCurrentUser().id;
      if (!authUid || !uid || !UUID_REGEX.test(authUid)) return;
      if (this.syncingUsers.has(uid)) return;

      this.syncingUsers.add(uid);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('id, user_id, recipient_name, recipient_phone, zip_code, address, detail_address, delivery_memo, is_default, updated_at')
        .eq('user_id', authUid)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false });

      this.syncedUsers.add(uid);
      if (error || !Array.isArray(data)) return;

      const remoteList: UserAddress[] = data.map((row: any) => ({
        id: row.id,
        userId: uid,
        recipientName: row.recipient_name || '',
        recipientPhone: formatKoreanPhone(row.recipient_phone || ''),
        zipCode: row.zip_code || '',
        address: row.address || '',
        detailAddress: row.detail_address || '',
        deliveryMemo: row.delivery_memo || '',
        isDefault: Boolean(row.is_default),
        updatedAt: row.updated_at || new Date().toISOString(),
      }));

      const others = this.loadAll().filter(a => a.userId !== uid);
      // 로컬에만 있던 주소가 있고 서버가 비어있다면 서버로 백필
      const localOnly = this.loadAll().filter(a => a.userId === uid);
      if (remoteList.length === 0 && localOnly.length > 0) {
        for (const item of localOnly) {
          void this.pushUpsertToSupabase(item);
        }
        return;
      }

      this.saveAll([...remoteList, ...others]);
      window.dispatchEvent(new CustomEvent('mabosal:addresses-updated'));
    } catch (e) {
      console.warn('[UserAddressStore] sync error:', e);
    } finally {
      const uid = userId || AuthService.getCurrentUser().id;
      if (uid) this.syncingUsers.delete(uid);
    }
  }

  private static async pushUpsertToSupabase(addr: UserAddress): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUid = sessionData?.session?.user?.id;
      if (!authUid || !UUID_REGEX.test(authUid)) return;

      if (addr.isDefault) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', authUid)
          .neq('id', addr.id);
      }

      await supabase.from('user_addresses').upsert({
        id: addr.id,
        user_id: authUid,
        recipient_name: addr.recipientName,
        recipient_phone: addr.recipientPhone,
        zip_code: addr.zipCode || '',
        address: addr.address,
        detail_address: addr.detailAddress || '',
        delivery_memo: addr.deliveryMemo || '',
        is_default: addr.isDefault,
        updated_at: addr.updatedAt,
      });
    } catch (e) {
      console.warn('[UserAddressStore] upsert sync deferred:', e);
    }
  }

  private static async pushDeleteToSupabase(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUid = sessionData?.session?.user?.id;
      if (!authUid || !UUID_REGEX.test(authUid)) return;

      await supabase.from('user_addresses').delete().eq('id', id).eq('user_id', authUid);
    } catch (e) {
      console.warn('[UserAddressStore] delete sync deferred:', e);
    }
  }

  /**
   * 회원의 기본 개인정보(성함·연락처·생년월일·기본 주소) 완성도 점검
   */
  public static getProfileCompleteness(user?: {
    id?: string;
    role?: string;
    name?: string;
    phone?: string;
    birthDate?: string;
  }): { isComplete: boolean; missingFields: string[]; completionRate: number } {
    const target = user || AuthService.getCurrentUser();
    if (!target || target.role === 'guest') {
      return { isComplete: true, missingFields: [], completionRate: 100 };
    }

    const missingFields: string[] = [];
    const trimmedName = (target.name || '').trim();
    if (!trimmedName || trimmedName === '회원') {
      missingFields.push('성함');
    }

    const trimmedPhone = (target.phone || '').trim();
    if (!trimmedPhone || trimmedPhone === '010-0000-0000' || trimmedPhone === '010-1234-5678') {
      missingFields.push('연락처');
    }

    if (!(target.birthDate || '').trim()) {
      missingFields.push('생년월일');
    }

    if (this.getAddresses(target.id).length === 0) {
      missingFields.push('기본 주소');
    }

    const total = 4;
    const completed = total - missingFields.length;
    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionRate: Math.round((completed / total) * 100),
    };
  }

  /**
   * 기본 배송지 1건 조회
   */
  public static getDefaultAddress(userId?: string): UserAddress | undefined {
    const list = this.getAddresses(userId);
    return list.find(a => a.isDefault) || list[0];
  }

  /**
   * 배송지 신규 등록 또는 수정
   */
  public static saveAddress(addr: {
    id?: string;
    recipientName: string;
    recipientPhone: string;
    zipCode?: string;
    address: string;
    detailAddress: string;
    deliveryMemo?: string;
    isDefault?: boolean;
    userId?: string;
  }): UserAddress {
    const uid = addr.userId || AuthService.getCurrentUser().id || 'guest';
    const all = this.loadAll();
    const formattedPhone = formatKoreanPhone(addr.recipientPhone) || addr.recipientPhone.trim();

    if (addr.isDefault) {
      // 기존 기본 배송지 해제
      all.forEach(a => {
        if (a.userId === uid) a.isDefault = false;
      });
    }

    if (addr.id) {
      const existing = all.find(a => a.id === addr.id);
      if (existing) {
        existing.recipientName = addr.recipientName.trim();
        existing.recipientPhone = formattedPhone;
        existing.zipCode = addr.zipCode !== undefined ? addr.zipCode.trim() : existing.zipCode;
        existing.address = addr.address.trim();
        existing.detailAddress = addr.detailAddress.trim();
        existing.deliveryMemo = addr.deliveryMemo?.trim();
        existing.isDefault = addr.isDefault ?? existing.isDefault;
        existing.updatedAt = new Date().toISOString();
        this.saveAll(all);
        void this.pushUpsertToSupabase(existing);
        return existing;
      }
    }

    const newAddr: UserAddress = {
      id: 'addr-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      userId: uid,
      recipientName: addr.recipientName.trim(),
      recipientPhone: formattedPhone,
      zipCode: addr.zipCode?.trim() || '',
      address: addr.address.trim(),
      detailAddress: addr.detailAddress.trim(),
      deliveryMemo: addr.deliveryMemo?.trim(),
      isDefault: addr.isDefault ?? (all.filter(a => a.userId === uid).length === 0),
      updatedAt: new Date().toISOString(),
    };

    all.unshift(newAddr);
    this.saveAll(all);
    void this.pushUpsertToSupabase(newAddr);
    return newAddr;
  }

  /**
   * 배송지 삭제
   */
  public static deleteAddress(id: string): void {
    const all = this.loadAll();
    const filtered = all.filter(a => a.id !== id);
    this.saveAll(filtered);
    void this.pushDeleteToSupabase(id);
  }

  /**
   * 기본 배송지 변경
   */
  public static setDefaultAddress(id: string, userId?: string): void {
    const uid = userId || AuthService.getCurrentUser().id;
    const all = this.loadAll();
    let updated: UserAddress | undefined;
    all.forEach(a => {
      if (a.userId === uid) {
        a.isDefault = (a.id === id);
        if (a.isDefault) updated = a;
      }
    });
    this.saveAll(all);
    if (updated) void this.pushUpsertToSupabase(updated);
  }
}
