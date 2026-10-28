/**
 * AuthModal (정석 아이디/비밀번호 로그인 및 회원가입 모달)
 */

export function renderAuthModal(): string {
 return `
 <div id="modal-auth-container" style="display: none; position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); align-items: center; justify-content: center; padding: 1.25rem;">
 <div style="background: var(--surface-container); border: 1px solid rgba(242,202,80,0.4); border-radius: 20px; width: 100%; max-width: 420px; padding: 2rem; box-shadow: 0 25px 70px rgba(0,0,0,0.85); position: relative;">
 <!-- 닫기 버튼 -->
 <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.25rem;">
 <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
 </button>

 <!-- 모달 헤더 -->
 <div style="text-align: center; margin-bottom: 1.5rem;">
 <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: rgba(242,202,80,0.15); border: 1px solid rgba(242,202,80,0.4); margin-bottom: 0.75rem; color: var(--primary);">
 <span class="material-symbols-outlined" style="font-size: 26px;">lock</span>
 </div>
 <h2 style="font-family: var(--font-serif); font-size: 1.45rem; font-weight: 700; color: #dfe2f1; margin: 0 0 0.35rem;">
 마보살 통합 멤버십
 </h2>
 <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
 아이디와 비밀번호로 안전하게 로그인하세요.
 </p>
 </div>

 <!-- 로그인 / 회원가입 2대 탭 -->
 <div style="display: flex; gap: 0.35rem; margin-bottom: 1.5rem; background: var(--surface-container-low); padding: 0.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
 <button type="button" class="auth-main-tab-btn active" id="tab-btn-show-login" style="flex: 1; padding: 0.6rem; border-radius: 8px; border: none; font-size: 0.88rem; font-weight: 700; background: var(--primary); color: #241a00; cursor: pointer;">
 로그인
 </button>
 <button type="button" class="auth-main-tab-btn" id="tab-btn-show-register" style="flex: 1; padding: 0.6rem; border-radius: 8px; border: none; font-size: 0.88rem; font-weight: 600; background: transparent; color: #dfe2f1; cursor: pointer;">
 신규 회원가입
 </button>
 </div>

 <!-- 1. [로그인 폼] -->
 <div id="auth-panel-login" style="display: block;">
 <form id="form-auth-login" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.85rem;">
 <div>
 <label for="input-login-username" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
 아이디 (Username)
 </label>
 <input type="text" id="input-login-username" placeholder="아이디 입력 (예: user1 또는 admin)" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.75rem 1rem; color: #dfe2f1; font-size: 0.92rem;" autocomplete="username" />
 </div>

 <div>
 <label for="input-login-password" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
 비밀번호 (Password)
 </label>
 <input type="password" id="input-login-password" placeholder="비밀번호 입력" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.75rem 1rem; color: #dfe2f1; font-size: 0.92rem;" autocomplete="current-password" />
 </div>

 <!-- 테스트 계정 원클릭 프리셋 칩 -->
 <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.65rem 0.75rem;">
 <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.4rem;">빠른 테스트 계정 자동 입력:</div>
 <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
 <button type="button" class="btn-preset-login" data-user="user1" data-pass="1234" style="background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.3); color: var(--primary); font-size: 0.72rem; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer;">
 일반회원 (user1)
 </button>
 <button type="button" class="btn-preset-login" data-user="partner1" data-pass="1234" style="background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.3); color: #f2ca50; font-size: 0.72rem; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer;">
 파트너 (partner1)
 </button>
 </div>
 </div>

 <button type="submit" id="btn-submit-login" class="btn-cta-primary" style="width: 100%; padding: 0.85rem; font-weight: 700; border-radius: 10px; font-size: 0.95rem; margin-top: 0.25rem;">
 로그인
 </button>
 </form>

 <div style="text-align: center; margin-top: 1.25rem; font-size: 0.8rem; color: var(--text-muted);">
 아직 마보살 계정이 없으신가요? 
 <button type="button" id="btn-link-to-register" style="background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline; margin-left: 0.25rem;">
 회원가입하기
 </button>
 </div>
 </div>

 <!-- 2. [신규 회원가입 폼] -->
 <div id="auth-panel-register" style="display: none;">
 <form id="form-auth-register" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.75rem;">
 <div>
 <label for="input-reg-username" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">
 아이디 (3자 이상)
 </label>
 <input type="text" id="input-reg-username" placeholder="사용할 아이디" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>

 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
 <div>
 <label for="input-reg-password" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">
 비밀번호
 </label>
 <input type="password" id="input-reg-password" placeholder="4자 이상" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>
 <div>
 <label for="input-reg-password-confirm" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">
 비밀번호 확인
 </label>
 <input type="password" id="input-reg-password-confirm" placeholder="비밀번호 재입력" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>
 </div>

 <div>
 <label for="input-reg-name" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">
 이름 (실명 또는 활동명)
 </label>
 <input type="text" id="input-reg-name" placeholder="이름 입력 (예: 홍길동)" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>

 <div>
 <label for="input-reg-phone" style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">
 휴대폰 번호
 </label>
 <input type="tel" id="input-reg-phone" placeholder="010-0000-0000" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>

 

 <button type="submit" id="btn-submit-register" class="btn-cta-primary" style="width: 100%; padding: 0.85rem; font-weight: 700; border-radius: 10px; font-size: 0.95rem; margin-top: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
 <span>회원가입 진행 (사주 입력 단계로 이동)</span>
 <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
 </button>
 </form>

 <div style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
 이미 계정이 있으신가요? 
 <button type="button" id="btn-link-to-login" style="background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline; margin-left: 0.25rem;">
 로그인하기
 </button>
 </div>
 </div>
 </div>
 </div>
 `;
}
