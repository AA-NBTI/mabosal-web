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
 </div>

 <!-- 로그인 / 회원가입 2대 탭 -->
 <div style="display: flex; gap: 0.35rem; margin-bottom: 1.5rem; background: var(--surface-container-low); padding: 0.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
 <button type="button" class="auth-main-tab-btn active" id="tab-btn-show-login" style="flex: 1; padding: 0.6rem; border-radius: 8px; border: none; font-size: 0.88rem; font-weight: 700; background: var(--primary); color: #241a00; cursor: pointer;">
 로그인
 </button>
 <button type="button" class="auth-main-tab-btn" id="tab-btn-show-register" style="flex: 1; padding: 0.6rem; border-radius: 8px; border: none; font-size: 0.88rem; font-weight: 600; background: transparent; color: #dfe2f1; cursor: pointer;">
 회원가입
 </button>
 </div>

 <!-- 1. [로그인 폼] -->
 <div id="auth-panel-login" style="display: block;">
 <form id="form-auth-login" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.85rem;">
 <div>
 <label for="input-login-username" style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; display: block; margin-bottom: 0.35rem;">
 아이디 <span style="color: #ef4444;">*</span>
 </label>
 <input type="text" id="input-login-username" placeholder="" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.75rem 1rem; color: #dfe2f1; font-size: 0.92rem;" autocomplete="username" />
 </div>

 <div>
 <label for="input-login-password" style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; display: block; margin-bottom: 0.35rem;">
 비밀번호 <span style="color: #ef4444;">*</span>
 </label>
 <input type="password" id="input-login-password" placeholder="" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.75rem 1rem; color: #dfe2f1; font-size: 0.92rem;" autocomplete="current-password" />
 </div>

 <button type="submit" id="btn-submit-login" class="btn-cta-primary" style="width: 100%; padding: 0.85rem; font-weight: 800; border-radius: 10px; font-size: 0.95rem; margin-top: 0.25rem; background: var(--primary); color: #241a00; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.35); transition: opacity 0.15s ease;">
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
 <label for="input-reg-username" style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; display: block; margin-bottom: 0.25rem;">
 아이디 <span style="color: #ef4444;">*</span>
 </label>
 <div style="display: flex; gap: 0.5rem;">
   <input type="text" id="input-reg-username" placeholder="" style="flex: 1; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
   <button type="button" id="btn-check-username-dup" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #dfe2f1; padding: 0.65rem 0.85rem; border-radius: 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap;">
     중복 확인
   </button>
 </div>
 <div id="msg-username-check" style="font-size: 0.76rem; margin-top: 0.25rem; display: none;"></div>
 </div>

 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
 <div>
 <label for="input-reg-password" style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; display: block; margin-bottom: 0.25rem;">
 비밀번호 <span style="color: #ef4444;">*</span>
 </label>
 <input type="password" id="input-reg-password" placeholder="" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>
 <div>
 <label for="input-reg-password-confirm" style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; display: block; margin-bottom: 0.25rem;">
 비밀번호 확인 <span style="color: #ef4444;">*</span>
 </label>
 <input type="password" id="input-reg-password-confirm" placeholder="" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>
 </div>

 <div>
 <label for="input-reg-name" style="font-size: 0.8rem; font-weight: 700; color: #dfe2f1; display: block; margin-bottom: 0.25rem;">
 이름 <span style="color: #ef4444;">*</span>
 </label>
 <input type="text" id="input-reg-name" placeholder="" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.65rem 0.85rem; color: #dfe2f1; font-size: 0.88rem;" />
 </div>

 <button type="submit" id="btn-submit-register" style="width: 100%; padding: 0.85rem; font-weight: 800; border-radius: 10px; font-size: 0.95rem; margin-top: 0.35rem; background: var(--primary); color: #241a00; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(242, 202, 80, 0.35); transition: opacity 0.15s ease;">
 회원가입
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
