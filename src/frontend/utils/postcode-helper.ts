/**
 * [PostcodeHelper] 다음(카카오) 우편번호 검색 API 동적 로더 및 연락처 자동 하이픈 유틸
 */

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          buildingName?: string;
          apartment?: string;
        }) => void;
      }) => { open: () => void };
    };
  }
}

let postcodeScriptPromise: Promise<void> | null = null;

function loadKakaoPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 주소 검색을 사용할 수 있습니다.'));
  }
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }
  if (postcodeScriptPromise) {
    return postcodeScriptPromise;
  }

  postcodeScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      postcodeScriptPromise = null;
      reject(new Error('우편번호 검색 스크립트를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  });

  return postcodeScriptPromise;
}

/**
 * 카카오(다음) 우편번호 검색 팝업 열기
 */
export async function openKakaoPostcode(
  onSelect: (result: { zipCode: string; address: string }) => void
): Promise<void> {
  try {
    await loadKakaoPostcodeScript();
    if (!window.daum?.Postcode) {
      alert('우편번호 검색 기능을 초기화하지 못했습니다. 주소를 직접 입력해 주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddr = data.roadAddress || data.jibunAddress || '';
        if (data.roadAddress && data.buildingName && data.apartment === 'Y') {
          fullAddr += ` (${data.buildingName})`;
        }
        onSelect({
          zipCode: data.zonecode || '',
          address: fullAddr.trim(),
        });
      },
    }).open();
  } catch (err) {
    console.warn('[PostcodeHelper] load error:', err);
    alert('우편번호 검색 창을 열지 못했습니다. 잠시 후 다시 시도하거나 직접 입력해 주세요.');
  }
}

/**
 * 한국 휴대폰/전화번호 자동 하이픈 정규화
 */
export function formatKoreanPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

