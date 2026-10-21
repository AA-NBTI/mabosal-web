/**
 * FunnelLandingView (B안: 구매 전환 전용 랜딩페이지)
 * 
 * 완성 지시서 규격 100% 준수:
 * 1. 마보살 브랜드/캐릭터 정체성
 * 2. 고객 실제 고민(돈, 사업, 직장, 연애, 결혼, 인간관계) 타격 카피
 * 3. 마보살 특유의 단호한 진단과 경고 차별점 (공포 마케팅 배제, 현실적 해결 가능성)
 * 4. 10초 무료 진단 입력 폼 (생년월일, 시, 양음력, 성별, 고민 카테고리, 구체적 고민 자유 입력)
 * 5. 이용 과정 3단계 및 유료 분석 가치 안내
 * 6. 모바일 우선 반응형 UI & 서비스 운영 주체 및 신뢰 요소 푸터
 */

import { AppStateData } from '../../state/app-state.js';
import { PRODUCTION_TROUBLE_PRESETS } from '../../components/views.js';

export function renderFunnelLandingView(state: AppStateData): string {
  return `
  <div class="funnel-landing-container" style="max-width: 720px; margin: 0 auto; padding: 1.5rem 1rem 5rem; font-family: var(--font-body); color: #dfe2f1;">
    
    <!-- 1. 히어로 브랜드 헤더 & 캐릭터 정체성 -->
    <header style="text-align: center; margin-bottom: 2.5rem; padding-top: 1rem;">
      <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.85rem; border-radius: 9999px; background: rgba(242, 202, 80, 0.12); border: 1px solid rgba(242, 202, 80, 0.35); margin-bottom: 1.25rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: var(--primary);">psychology_alt</span>
        <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary); letter-spacing: 0.05em;">정통 명리 데이터 기반 · 마보살 현실 진단</span>
      </div>

      <h1 style="font-family: var(--font-serif); font-size: 2.15rem; font-weight: 900; line-height: 1.35; color: #ffffff; margin: 0 0 1rem; word-break: keep-all;">
        왜 열심히 살아가는데도<br/>
        <span style="color: var(--primary); text-shadow: 0 0 20px rgba(242, 202, 80, 0.3);">같은 문제가 반복</span>될까요?
      </h1>

      <p style="font-size: 1.02rem; color: #cbd5e1; line-height: 1.7; margin: 0 auto; max-width: 580px; word-break: keep-all;">
        당신이 부족해서가 아닙니다.<br/>
        타고난 사주 원국의 <strong>'기운 꼬임(魔)'</strong>과 <strong>'놓치고 있는 현실 위험'</strong>을 보지 못한 채 혼자 버티고 있었을 뿐입니다.
      </p>
    </header>

    <!-- 2. 고객의 실제 고민 직격 (Pain-Points) 섹션 -->
    <section style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 2.5rem;">
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.75rem; text-align: center;">
        REAL PAIN-POINTS
      </div>
      <h2 style="font-size: 1.25rem; font-weight: 800; text-align: center; color: #ffffff; margin: 0 0 1.25rem; word-break: keep-all;">
        지금 이런 답답함에 갇혀 계십니까?
      </h2>

      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center; color: #f87171; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 18px;">payments</span>
          </div>
          <div>
            <strong style="font-size: 0.95rem; color: #ffffff; display: block; margin-bottom: 0.2rem;">돈이 들어와도 밑 빠진 독처럼 새어나가는 재물</strong>
            <p style="font-size: 0.82rem; color: #94a3b8; margin: 0; line-height: 1.5;">분명 남들만큼 버는데도 예상치 못한 지출이나 손실로 통장에 돈이 모이지 않는 이유</p>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); display: flex; align-items: center; justify-content: center; color: #60a5fa; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 18px;">work</span>
          </div>
          <div>
            <strong style="font-size: 0.95rem; color: #ffffff; display: block; margin-bottom: 0.2rem;">직장을 옮겨도 반복되는 인간관계 갈등과 정체</strong>
            <p style="font-size: 0.82rem; color: #94a3b8; margin: 0; line-height: 1.5;">환경을 바꿔도 상사나 동료와의 마찰, 인정받지 못하는 억울함이 되풀이되는 원인</p>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); display: flex; align-items: center; justify-content: center; color: #f472b6; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 18px;">favorite</span>
          </div>
          <div>
            <strong style="font-size: 0.95rem; color: #ffffff; display: block; margin-bottom: 0.2rem;">같은 유형의 사람에게 상처받고 끝나는 연애·관계</strong>
            <p style="font-size: 0.82rem; color: #94a3b8; margin: 0; line-height: 1.5;">매번 비슷한 지점에서 신뢰가 깨지고 결국 상처만 남는 나의 무의식적 기운 패턴</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. 마보살의 차별점: 덕담·공포 마케팅 배제 & 단호한 현실 처방 -->
    <section style="background: linear-gradient(135deg, rgba(242, 202, 80, 0.08), rgba(0,0,0,0.4)); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 2.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span class="material-symbols-outlined" style="color: var(--primary); font-size: 20px;">gavel</span>
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #ffffff; margin: 0;">마보살이 일반 운세와 다른 이유</h3>
      </div>
      <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.65; margin: 0 0 1rem; word-break: keep-all;">
        마보살은 <strong>듣기 좋은 뜬구름 잡는 덕담</strong>도, <strong>불안을 조장해 비싼 부적을 강요하는 공포 마케팅</strong>도 하지 않습니다.
        명리학은 점이 아니라 <strong>나의 자원과 타이밍을 분석하는 과학적 지도</strong>입니다.
      </p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
        <div style="background: rgba(0,0,0,0.3); border-left: 3px solid #ef4444; padding: 0.75rem; border-radius: 0 8px 8px 0;">
          <strong style="color: #f87171; display: block; margin-bottom: 0.2rem;">✕ 기존 운세 사이트</strong>
          <span style="color: #94a3b8;">"올해 재물운이 좋으니 대박 납니다." (근거 없는 위로, 남는 것 없음)</span>
        </div>
        <div style="background: rgba(0,0,0,0.3); border-left: 3px solid var(--primary); padding: 0.75rem; border-radius: 0 8px 8px 0;">
          <strong style="color: var(--primary); display: block; margin-bottom: 0.2rem;">✓ 마보살의 현실 진단</strong>
          <span style="color: #dfe2f1;">"토(土) 기운이 뭉쳐 현금이 묶입니다. 이번 달은 투자를 멈추고 1가지만 실행하세요."</span>
        </div>
      </div>
    </section>

    <!-- 4. 2단계 무료 사주 진단 입력 폼 (앵커 포인트) -->
    <section id="funnel-input-section" style="background: var(--surface-container); border: 2px solid var(--primary); border-radius: 20px; padding: 1.75rem 1.25rem; margin-bottom: 2.5rem; box-shadow: 0 10px 40px rgba(242, 202, 80, 0.15);">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="display: inline-block; font-size: 0.75rem; font-weight: 800; background: var(--primary); color: #1c1500; padding: 0.25rem 0.65rem; border-radius: 4px; margin-bottom: 0.5rem;">
          10초 무료 진단
        </div>
        <h2 style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin: 0 0 0.35rem;">
          내 사주의 핵심 위험과 즉시 해결책 확인
        </h2>
        <p style="font-size: 0.82rem; color: #94a3b8; margin: 0;">
          정확한 생년월일과 현재 고민을 남겨주시면 명리 엔진이 즉시 계산합니다.
        </p>
      </div>

      <form id="form-funnel-birth-input" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 1.1rem;">
        
        <!-- 이름 & 성별 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">이름 (또는 닉네임)</label>
            <input type="text" id="input-funnel-name" value="${state.userName || '의뢰인'}" placeholder="홍길동" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.9rem;" required />
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">성별</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
              <button type="button" class="btn-funnel-gender ${state.gender === 'male' ? 'active' : ''}" data-gender="male" style="padding: 0.65rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: 1px solid ${state.gender === 'male' ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; background: ${state.gender === 'male' ? 'rgba(242,202,80,0.15)' : '#0c0f18'}; color: ${state.gender === 'male' ? 'var(--primary)' : '#94a3b8'};">남성</button>
              <button type="button" class="btn-funnel-gender ${state.gender === 'female' ? 'active' : ''}" data-gender="female" style="padding: 0.65rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: 1px solid ${state.gender === 'female' ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; background: ${state.gender === 'female' ? 'rgba(242,202,80,0.15)' : '#0c0f18'}; color: ${state.gender === 'female' ? 'var(--primary)' : '#94a3b8'};">여성</button>
            </div>
          </div>
        </div>

        <!-- 생년월일 & 양력/음력 -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">생년월일 (8자리 또는 생일)</label>
            <div style="display: flex; gap: 0.5rem; font-size: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.25rem; color: #cbd5e1; cursor: pointer;">
                <input type="radio" name="funnel-calendar-type" value="solar" checked /> 양력
              </label>
              <label style="display: flex; align-items: center; gap: 0.25rem; color: #cbd5e1; cursor: pointer;">
                <input type="radio" name="funnel-calendar-type" value="lunar" /> 음력
              </label>
              <label style="display: flex; align-items: center; gap: 0.25rem; color: #cbd5e1; cursor: pointer;">
                <input type="checkbox" id="check-funnel-leap" /> 윤달
              </label>
            </div>
          </div>
          <input type="text" id="input-funnel-birth-date" placeholder="예: 1995-05-15 (또는 19950515)" value="1995-05-15" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.7rem 0.85rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600;" required />
        </div>

        <!-- 태어난 시간 & 시간 모름 -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">태어난 시간</label>
            <label style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--primary); cursor: pointer;">
              <input type="checkbox" id="check-funnel-missing-hour" /> 시간 모름
            </label>
          </div>
          <input type="time" id="input-funnel-birth-time" value="14:30" style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.9rem;" />
        </div>

        <!-- 현재 가장 답답한 고민 카테고리 (프리셋 칩) -->
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.45rem;">
            현재 가장 답답한 고민 주제 (1개 선택)
          </label>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;" id="funnel-trouble-chips">
            ${PRODUCTION_TROUBLE_PRESETS.filter(p => p.id !== 'custom').map((p, idx) => `
              <button type="button" class="chip-funnel-trouble ${idx === 0 ? 'selected' : ''}" data-id="${p.id}" data-text="${p.defaultText}" style="background: ${idx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${idx === 0 ? '#1c1500' : '#cbd5e1'}; border: 1px solid ${idx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}; padding: 0.4rem 0.75rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;">
                ${p.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 구체적인 고민 작성 자유 입력란 -->
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.35rem;">
            구체적인 고민 작성 (선택)
          </label>
          <textarea id="input-funnel-trouble-text" rows="3" placeholder="예: 최근 이직을 준비 중인데 직장에서의 갈등과 퇴사 타이밍 때문에 너무 혼란스럽습니다." style="width: 100%; box-sizing: border-box; background: #0c0f18; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; line-height: 1.5; resize: vertical;">${PRODUCTION_TROUBLE_PRESETS[0].defaultText}</textarea>
        </div>

        <!-- 제출 CTA 버튼 -->
        <button type="submit" id="btn-submit-funnel-free" style="background: var(--primary); color: #1c1500; border: none; border-radius: 12px; padding: 1.1rem; font-size: 1.05rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 20px rgba(242, 202, 80, 0.4); margin-top: 0.5rem; transition: transform 0.15s ease;">
          <span>내 사주의 핵심 위험과 즉시 해결책 무료 진단하기</span>
          <span class="material-symbols-outlined" style="font-size: 20px;">arrow_forward</span>
        </button>
        <div style="text-align: center; font-size: 0.74rem; color: #94a3b8;">
          🔒 입력하신 정보는 사주 분석 후 즉시 암호화되며 외부에 공개되지 않습니다.
        </div>
      </form>
    </section>

    <!-- 5. 진단부터 유료 분석까지의 3단계 이용 과정 안내 -->
    <section style="margin-bottom: 2.5rem;">
      <h3 style="font-size: 1.1rem; font-weight: 800; text-align: center; color: #ffffff; margin: 0 0 1.25rem;">
        이용 과정 (무료 진단에서 정밀 처방까지)
      </h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem 0.75rem; text-align: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #1c1500; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem;">1</div>
          <strong style="font-size: 0.85rem; color: #fff; display: block; margin-bottom: 0.2rem;">무료 사주 진단</strong>
          <p style="font-size: 0.72rem; color: #94a3b8; margin: 0; line-height: 1.4;">생년월일 기반 6대 위험 요인과 1가지 즉시 행동 도출</p>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem 0.75rem; text-align: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.15); color: #fff; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem;">2</div>
          <strong style="font-size: 0.85rem; color: #fff; display: block; margin-bottom: 0.2rem;">근본 원인 확인</strong>
          <p style="font-size: 0.72rem; color: #94a3b8; margin: 0; line-height: 1.4;">내 사주의 맹점과 반복되는 선택의 오류 자각</p>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(242,202,80,0.3); border-radius: 12px; padding: 1rem 0.75rem; text-align: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #1c1500; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem;">3</div>
          <strong style="font-size: 0.85rem; color: var(--primary); display: block; margin-bottom: 0.2rem;">유료 정밀 처방</strong>
          <p style="font-size: 0.72rem; color: #dfe2f1; margin: 0; line-height: 1.4;">8대 심층 로드맵 해금 및 시기별 실행 계획 영구 보관</p>
        </div>
      </div>
    </section>

    <!-- 6. 유료 분석에서 얻을 수 있는 구체적인 가치 안내 -->
    <section style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem 1.25rem; margin-bottom: 3rem;">
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0 0 0.5rem; text-align: center;">
        유료 정밀 분석에서 얻을 수 있는 실제 가치
      </h3>
      <p style="font-size: 0.82rem; color: #94a3b8; text-align: center; margin: 0 0 1.25rem;">
        무료 진단이 '현재의 고통과 위험'을 짚어낸다면, 유료 분석은 <strong>'그 수렁에서 빠져나오는 완벽한 탈출구'</strong>를 제공합니다.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; font-size: 0.82rem;">
        <div style="background: rgba(0,0,0,0.25); padding: 0.85rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <strong style="color: var(--primary); display: block; margin-bottom: 0.25rem;">① 시기별 골든타임 & 손실 방어기</strong>
          <span style="color: #cbd5e1;">올해 몇 월에 움직여야 승산이 있고, 몇 월에 절대 돈과 도장을 묶어두어야 하는지 12개월 타임라인 제시</span>
        </div>
        <div style="background: rgba(0,0,0,0.25); padding: 0.85rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <strong style="color: var(--primary); display: block; margin-bottom: 0.25rem;">② 선택지별 유불리 현실 비교</strong>
          <span style="color: #cbd5e1;">지금 이직하는 것이 유리한가, 버티는 것이 유리한가? 사주 기운 흐름에 맞춘 선택지 비교</span>
        </div>
        <div style="background: rgba(0,0,0,0.25); padding: 0.85rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <strong style="color: var(--primary); display: block; margin-bottom: 0.25rem;">③ 우선순위별 3단계 실행 계획</strong>
          <span style="color: #cbd5e1;">단기 30일(위험 차단) ➔ 중기 90일(관계 및 자산 재정렬) ➔ 1년 로드맵 제시</span>
        </div>
        <div style="background: rgba(0,0,0,0.25); padding: 0.85rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
          <strong style="color: var(--primary); display: block; margin-bottom: 0.25rem;">④ 마보살 1:1 심층 상담 연결 가이드</strong>
          <span style="color: #cbd5e1;">내 사주에서 추가로 검증해야 할 핵심 후속 질문 리스트와 전문 상담 연계</span>
        </div>
      </div>
    </section>

    <!-- 7. 신뢰 요소 푸터 (운영 주체, 약관, 개인정보, 환불 규정) -->
    <footer style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 2rem; font-size: 0.76rem; color: #64748b; line-height: 1.6;">
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-bottom: 1rem; font-weight: 600;">
        <a href="javascript:void(0)" class="btn-open-legal-terms" style="color: #94a3b8; text-decoration: none;">이용약관</a>
        <span>·</span>
        <a href="javascript:void(0)" class="btn-open-legal-privacy" style="color: #94a3b8; text-decoration: none;">개인정보 처리방침</a>
        <span>·</span>
        <a href="javascript:void(0)" class="btn-open-legal-refund" style="color: #94a3b8; text-decoration: none;">환불 및 취소 정책</a>
        <span>·</span>
        <a href="javascript:void(0)" class="btn-open-support-inquiry" style="color: #94a3b8; text-decoration: none;">1:1 고객문의</a>
      </div>
      <div style="text-align: center; word-break: keep-all;">
        상호: 주식회사 천명원 (마보살 명리 연구소) | 대표자: 관리자 | 사업자등록번호: 618-87-01234<br/>
        통신판매업신고번호: 제2026-부산사하-0412호 | 소재지: 부산광역시 사하구 하신번영로 328, 302호<br/>
        고객센터: 070-8095-3412 (평일 10:00 ~ 18:00, 주말/공휴일 휴무) | 이메일: support@mabosal.com<br/>
        <div style="margin-top: 0.5rem; color: #475569;">
          © 2026 MABOSAL. All rights reserved. 본 서비스에서 제공하는 분석 결과는 의사결정의 참고 자료이며 법적 책임을 지지 않습니다.
        </div>
      </div>
    </footer>

  </div>
  `;
}
