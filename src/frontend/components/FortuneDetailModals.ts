/**
 * FortuneDetailModals.ts
 * 이용자 대시보드 및 메인 화면의 행운처방, 행운지수, 황금 길시, 심층 타로 인터랙티브 상세 모달 모음
 * - 정통 오리엔탈 디자인 시스템 적용 (다크 네이비 + 앤티크 골드 글로우)
 */

export function renderFortuneDetailModals(): string {
  return `
  <!-- ======================================================= -->
  <!-- 1. 오늘의 행운 처방 상세 모달 (색상/방위/숫자/지혜) -->
  <!-- ======================================================= -->
  <div id="modal-prescription-detail" class="mabosal-interactive-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 18px; width: 100%; max-width: 540px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.9); overflow: hidden; position: relative;">
      
      <!-- 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(242, 202, 80, 0.04);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">verified</span>
          <div>
            <span style="font-size: 0.68rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">LUCKY PRESCRIPTION GUIDE</span>
            <h3 id="prescription-modal-title" style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0.1rem 0 0 0;">행운 처방 정밀 해설</h3>
          </div>
        </div>
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-prescription-detail" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: color 0.15s ease;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 본문 -->
      <div id="prescription-modal-body" style="padding: 1.5rem; overflow-y: auto; color: #cbd5e1; font-size: 0.88rem; line-height: 1.7; flex: 1;">
        <!-- 동적으로 주입됨 -->
      </div>

      <!-- 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; background: rgba(255,255,255,0.02);">
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-prescription-detail" style="padding: 0.55rem 1.25rem; border-radius: 8px; background: var(--primary); border: none; color: #1a1400; font-weight: 800; font-size: 0.85rem; cursor: pointer;">
          확인 완료
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================= -->
  <!-- 2. 행운지수 (천기지수) 심층 분석 모달 -->
  <!-- ======================================================= -->
  <div id="modal-fortune-score-detail" class="mabosal-interactive-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 18px; width: 100%; max-width: 580px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <!-- 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(242, 202, 80, 0.04);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">auto_awesome</span>
          <div>
            <span style="font-size: 0.68rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">DAILY CELESTIAL SCORE</span>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0.1rem 0 0 0;">오늘의 천기(天氣) 행운지수 심층 분석</h3>
          </div>
        </div>
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-fortune-score-detail" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 본문 -->
      <div style="padding: 1.5rem; overflow-y: auto; color: #cbd5e1; font-size: 0.88rem; line-height: 1.7; flex: 1;">
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 12px; padding: 1.1rem 1.25rem; margin-bottom: 1.25rem;">
          <div>
            <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700;">오늘의 총운 등급</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">귀인조력 성취운 (78점)</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">천을귀인의 조력과 재물 통로가 열리는 길일</div>
          </div>
          <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(242,202,80,0.15); border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; font-weight: 900; color: var(--primary);">
            78
          </div>
        </div>

        <h4 style="color: #fff; font-size: 0.95rem; margin: 1.2rem 0 0.6rem 0; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">monitoring</span>
          3대 영역별 정밀 지수 가이드
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <span style="font-weight: 700; color: var(--primary); font-size: 0.88rem;">💰 금전운 (80점 / 최상급)</span>
              <span style="font-size: 0.72rem; color: #50c878; font-weight: 700;">투자 및 결실 유리</span>
            </div>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.55;">
              작은 노력으로도 실속을 거둘 수 있는 날입니다. 중요한 금융 거래나 지출 계약은 오후 13:30~15:30(미시) 사이에 진행하면 불필요한 누수를 막을 수 있습니다.
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <span style="font-weight: 700; color: #ff3385; font-size: 0.88rem;">💖 애정운 (75점 / 순항)</span>
              <span style="font-size: 0.72rem; color: #ff3385; font-weight: 700;">솔직한 대화 추천</span>
            </div>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.55;">
              상대방의 입장을 한 번 더 배려하는 태도가 오해를 막아줍니다. 가벼운 안부 연락이나 감사의 표현이 좋은 인연의 불씨를 키웁니다.
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <span style="font-weight: 700; color: #bec6dd; font-size: 0.88rem;">⚡ 활력도 (80점 / 안정)</span>
              <span style="font-size: 0.72rem; color: #93c5fd; font-weight: 700;">신체 리듬 쾌조</span>
            </div>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.55;">
              기운의 소모가 적고 집중력이 오래 유지됩니다. 따뜻한 차 한 잔으로 체온을 유지하며 오후 산책을 곁들이면 심신 균형이 극대화됩니다.
            </p>
          </div>
        </div>

        <div style="background: rgba(242, 202, 80, 0.05); border-left: 3px solid var(--primary); padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; font-size: 0.82rem; color: var(--text-secondary);">
          <strong style="color: var(--primary);">명리 처방 가이드:</strong> 오늘 발생한 사소한 마찰은 정면 대응하기보다 시간을 두고 유연하게 넘기는 것이 결과적으로 본인에게 가장 큰 이득으로 돌아옵니다.
        </div>
      </div>

      <!-- 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; background: rgba(255,255,255,0.02);">
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-fortune-score-detail" style="padding: 0.55rem 1.25rem; border-radius: 8px; background: var(--primary); border: none; color: #1a1400; font-weight: 800; font-size: 0.85rem; cursor: pointer;">
          확인 완료
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================= -->
  <!-- 3. 오늘의 황금 길시(吉時) 행동 가이드 모달 -->
  <!-- ======================================================= -->
  <div id="modal-auspicious-hour-detail" class="mabosal-interactive-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(242, 202, 80, 0.4); border-radius: 18px; width: 100%; max-width: 540px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <!-- 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(242, 202, 80, 0.04);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: var(--primary);">schedule</span>
          <div>
            <span style="font-size: 0.68rem; color: var(--primary); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">AUSPICIOUS HOURS GUIDE</span>
            <h3 id="auspicious-modal-title" style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0.1rem 0 0 0;">황금 길시 행동 비책</h3>
          </div>
        </div>
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-auspicious-hour-detail" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 본문 -->
      <div id="auspicious-modal-body" style="padding: 1.5rem; overflow-y: auto; color: #cbd5e1; font-size: 0.88rem; line-height: 1.7; flex: 1;">
        <!-- 동적으로 주입됨 -->
      </div>

      <!-- 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
        <button type="button" id="btn-goto-lucky-cal-from-modal" style="background: none; border: 1px solid rgba(242,202,80,0.3); color: var(--primary); font-size: 0.78rem; font-weight: 700; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer;">
          📅 이번 달 길일 달력 보기
        </button>
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-auspicious-hour-detail" style="padding: 0.55rem 1.25rem; border-radius: 8px; background: var(--primary); border: none; color: #1a1400; font-weight: 800; font-size: 0.85rem; cursor: pointer;">
          확인 완료
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================= -->
  <!-- 4. 심층 타로 3카드 리딩 준비 중 프리뷰 모달 -->
  <!-- ======================================================= -->
  <div id="modal-tarot-preview" class="mabosal-interactive-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10000; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box;">
    <div style="background: #0f131d; border: 1px solid rgba(190, 198, 221, 0.35); border-radius: 18px; width: 100%; max-width: 520px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <!-- 헤더 -->
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: #bec6dd;">style</span>
          <div>
            <span style="font-size: 0.68rem; color: #bec6dd; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">ORIENTAL TAROT SERVICE</span>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0.1rem 0 0 0;">심층 타로 3카드 리딩</h3>
          </div>
        </div>
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-tarot-preview" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.4rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
        </button>
      </div>

      <!-- 본문 -->
      <div style="padding: 1.5rem; text-align: center; color: #cbd5e1; font-size: 0.88rem; line-height: 1.7; flex: 1;">
        <div style="width: 68px; height: 68px; border-radius: 50%; background: rgba(190, 198, 221, 0.1); border: 2px dashed rgba(190, 198, 221, 0.35); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.2rem auto; color: #bec6dd;">
          <span class="material-symbols-outlined" style="font-size: 36px;">magic_button</span>
        </div>
        <h4 style="color: #fff; font-size: 1.1rem; font-weight: 800; margin: 0 0 0.5rem 0;">동양 명리와 서양 타로의 융합 엔진</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 1.25rem 0; line-height: 1.6;">
          사주 원국의 오행 균형과 현재의 질문 의도를 결합하는 <strong>마보살 심층 타로 3카드 점(과거·현재·미래)</strong> 서비스가 곧 공개됩니다. 현재 정밀 리딩 알고리즘의 최종 품질 검증을 진행 중입니다.
        </p>

        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.25); border-radius: 10px; padding: 0.85rem 1rem; text-align: left; margin-bottom: 1rem;">
          <span style="font-weight: 700; color: var(--primary); font-size: 0.82rem; display: block; margin-bottom: 0.25rem;">✨ 지금 이용 가능한 천명 비전</span>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: #dfe2f1; line-height: 1.6;">
            <li><strong>정통 사주 원국 풀이</strong>: 평생의 그릇과 격국 분석</li>
            <li><strong>2026/2027 신년 대운 비책</strong>: 다가오는 한 해의 재물·관운 흐름</li>
            <li><strong>인연 궁합 분석</strong>: 연인 및 동업자와의 오행 조화도</li>
          </ul>
        </div>
      </div>

      <!-- 푸터 -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
        <button type="button" id="btn-goto-saju-from-tarot" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: #dfe2f1; font-size: 0.78rem; font-weight: 700; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer;">
          정통 사주 보기
        </button>
        <button type="button" class="btn-close-fortune-modal" data-modal-id="modal-tarot-preview" style="padding: 0.55rem 1.25rem; border-radius: 8px; background: var(--primary); border: none; color: #1a1400; font-weight: 800; font-size: 0.85rem; cursor: pointer;">
          확인
        </button>
      </div>
    </div>
  </div>
  `;
}
