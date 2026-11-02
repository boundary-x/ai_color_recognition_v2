/* Color app help: tours only explain controls. */
(()=>{'use strict';const $=id=>document.getElementById(id);const support=$('support-card');support.innerHTML="<summary><span><strong>사용 가이드 및 지원</strong><small>사용법 · 예제 코드 · 문제 해결</small></span><span class=\"support-chevron\" aria-hidden=\"true\">⌄</span></summary><div class=\"support-content\"><p class=\"support-intro\">색상을 학습하고 ID·위치·크기 데이터를 프로젝트에 활용해보세요. 블루투스 연결 없이 인식하고 전송할 데이터를 먼저 확인할 수 있습니다. 기기를 연결하면 실제 데이터를 전송합니다.</p><div class=\"support-actions\"><button type=\"button\" data-tour=\"all\" class=\"support-primary\">사용법 둘러보기 <span aria-hidden=\"true\">→</span></button></div><details class=\"support-section\" id=\"help-examples\"><summary>내 기기에 맞는 예제</summary><div class=\"support-answer device-examples\"><p class=\"device-intro\">마이크로비트만 있어도 사용할 수 있어요.<br>사용할 기기에 맞는 예제를 선택해주세요.</p><div class=\"device-prepare\"><span class=\"prepare-label\">공통 준비</span><a href=\"https://makecode.microbit.org/S49771-77509-50114-72682\" target=\"_blank\" rel=\"noopener noreferrer\">블루투스 이름 확인 코드 ↗</a><p>연결할 마이크로비트의 LED에 표시되는 이름(알파벳 소문자 5자리)을 확인하세요. 아래에서 사용할 기기의 프로젝트 예제를 선택하세요.</p></div><div class=\"device-example-list\"><article class=\"device-example-card\"><div class=\"device-example-heading\"><h4>마이크로비트 기본</h4><span class=\"device-tag\">마이크로비트만 사용</span></div><p>컬러 인식 프로젝트 예제를 준비 중입니다.</p><div class=\"device-example-links\"><span class=\"device-coming-soon\">예제 준비 중</span></div></article><article class=\"device-example-card\"><div class=\"device-example-heading\"><h4>AI 포니봇</h4><span class=\"device-tag\">포니봇 사용</span></div><p>학습한 색상의 위치와 크기에 따라 회전·전후진합니다. 스마트폰 전면 카메라가 포니봇의 전방을 향하도록 장착하고, 좌우 반전은 OFF로 설정하세요.</p><div class=\"device-example-links\"><a href=\"https://makecode.microbit.org/#pub:29399-81115-85262-76898\" target=\"_blank\" rel=\"noopener noreferrer\">학습한 색상을 따라 움직이는 컬러 트래킹 로봇 <span aria-hidden=\"true\">↗</span></a></div></article><article class=\"device-example-card\"><div class=\"device-example-heading\"><h4>비트런(이족보행로봇)</h4><span class=\"device-tag\">비트런 사용</span></div><p>학습한 색상의 화면 위치에 따라 좌우로 회전합니다. 노트북 카메라와 비트런이 같은 방향을 바라보도록 놓고, 좌우 반전은 OFF로 설정하세요.</p><div class=\"device-example-links\"><a href=\"https://makecode.microbit.org/#pub:81616-55155-76639-96722\" target=\"_blank\" rel=\"noopener noreferrer\">학습한 색상을 따라 움직이는 컬러 트래킹 로봇 <span aria-hidden=\"true\">↗</span></a></div></article></div><p class=\"device-note\">기기 연결 없이도 색상을 학습하고 전송할 데이터를 먼저 확인할 수 있습니다.</p></div></details><details class=\"support-section\" id=\"help-troubleshooting\"><summary>문제 해결 <span class=\"support-meta\">증상별 안내</span></summary><div class=\"support-answer support-faq\"><details ><summary>카메라가 켜지지 않아요</summary><p>카메라 권한을 허용하세요. 카메라를 사용하는 다른 앱이나 탭을 닫고 페이지를 새로고침하세요. HTTPS 또는 localhost에서 접속해야 합니다.</p></details><details ><summary>샘플 추가 버튼이 비활성화돼요</summary><p>중앙 사각형을 한 가지 색으로 채우세요. 여러 색이 섞인 샘플은 차단됩니다. 이미 10개를 수집했다면 학습 완료를 누르세요.</p></details><details ><summary>배경까지 인식되거나 색상을 잘 구분하지 못해요</summary><p>반사광과 배경이 섞이지 않게 해당 ID를 다시 학습하세요. 색상 허용 차이를 낮추면 판정 범위가 좁아집니다. 같은 색상의 다른 물건도 검출될 수 있습니다.</p></details><details ><summary>인식 시작 버튼이 비활성화돼요</summary><p>카메라를 준비하고 학습을 완료한 ID를 선택하세요. 샘플 수집 중이면 학습을 완료하거나 취소해야 합니다.</p></details><details id=\"help-connection\"><summary>블루투스가 연결되지 않거나 기기가 반응하지 않아요</summary><p>Web Bluetooth 지원 브라우저와 마이크로비트 전원을 확인하세요. 다른 앱의 연결은 해제하세요. 수신 코드는 i·x·y·w·h·d와 stop을 처리해야 합니다. 화면의 전송 완료 표시는 기기의 동작 확인과는 다릅니다.</p></details><details ><summary>모델 가져오기나 파일 공유가 안 돼요</summary><p>이 앱에서 다운로드한 색상 모델 JSON을 선택하세요. 다른 KNN 앱의 모델 파일은 호환되지 않습니다. 공유 미지원 브라우저에서는 모델 다운로드를 사용하세요.</p></details><details ><summary>여러 영역이 있는데 좌표는 하나만 나와요</summary><p>선택한 ID 중 색상 픽셀 수가 가장 많은 영역의 중심 좌표와 크기를 전송합니다. d는 선택한 ID의 검출 영역 개수입니다.</p></details></div></details><details class=\"support-section\" id=\"help-materials\"><summary>수업 자료</summary><div class=\"support-answer\"><p>수업 자료를 준비 중입니다.</p></div></details><details class=\"support-section\" id=\"help-updates\"><summary>업데이트 노트 <span class=\"support-meta\">최근 변경</span></summary><div class=\"support-answer\"><p class=\"support-release\">2026.11.02 · 기기별 예제 카드 구성 통일</p><ul><li>공통 준비와 마이크로비트 기본·AI 포니봇·비트런(이족보행로봇) 카드를 구분</li><li>AI 포니봇·비트런 컬러 트래킹 MakeCode 예제 추가</li><li>기기별 카메라 배치와 좌우 반전 OFF 안내</li><li>다른 웹앱과 카드 디자인 및 모바일 배치 통일</li></ul><p class=\"support-release\">색상 영역 학습 및 인식</p><ul><li>ID마다 샘플 10개 수동 수집 · 혼합 색상 샘플 차단</li><li>선택한 ID의 영역 검출과 위치·크기 전송</li><li>모델 다운로드 · 파일 공유 · 가져오기</li><li>카메라 자동 시작과 반응형 화면 안내</li></ul></div></details></div>";
const recognition=[[".canvas-container","카메라를 준비하세요","페이지를 열면 카메라를 시작합니다. 브라우저의 카메라 권한을 허용하세요."],["#camera-control-buttons","촬영 화면을 설정하세요","전후방 전환과 좌우 반전을 사용할 수 있습니다. 카메라가 켜지지 않으면 권한을 확인하고 페이지를 새로고침하세요."],["#add","학습 ID를 추가하세요","ID는 ID1부터 자동으로 추가됩니다. 중앙 사각형을 한 가지 색으로 채운 뒤 샘플 추가를 눌러 10개를 수집하고 학습 완료를 누르세요. 여러 색이 섞인 샘플은 차단됩니다."],["#model-file-buttons","모델을 저장하고 가져오세요","학습한 데이터를 JSON으로 다운로드하거나 공유하세요. 가져오면 기존 모델을 교체합니다. 새로고침 전에 저장하세요."]];const device=[["#connection-buttons","마이크로비트를 연결하세요","호환되는 수신 코드를 준비한 장치를 선택하세요. 기기 연결 없이도 화면에서 색상 인식을 시험할 수 있습니다."],["#target","인식할 ID를 선택하세요","10개 샘플의 학습을 완료한 ID 중 하나를 선택하세요. 선택한 ID만 화면 전체에서 인식합니다."],["#recognition-buttons","인식을 시작하고 중지하세요","인식 시작을 누르면 선택한 색상을 검출합니다. 인식 중지 또는 미검출 시에는 stop 전송을 시도합니다."]];const data=[["#result","인식 결과를 확인하세요","굵은 파란색 박스는 전송 대상이고 얇은 초록색 박스는 나머지 영역입니다. 선택한 ID와 검출 영역 수를 확인하세요. 물체를 화면 밖으로 빼서 미검출인지도 확인하세요."],["#transmission","전송 데이터를 확인하세요","i는 ID, x·y는 중심, w·h는 크기, d는 영역 수입니다. 좌표는 400×300 기준이며 가장 큰 색상 영역 하나를 전송합니다. 실제 기기의 수신과 동작도 확인하세요."]];const allSteps=[...recognition,...device,...data];const chapters=[{label:'학습·저장',start:0},{label:'연결·인식',start:recognition.length},{label:'결과 확인',start:recognition.length+device.length}];
  const dialog = document.createElement('dialog');
  dialog.id = 'guide-dialog';
  dialog.setAttribute('aria-labelledby', 'guide-title');
  dialog.setAttribute('aria-describedby', 'guide-description');
  dialog.innerHTML = `<div id="guide-spotlight" aria-hidden="true"></div><section id="guide-panel"><div class="guide-topline"><span id="guide-progress"></span><button id="guide-close" type="button" aria-label="화면 안내 종료">닫기 ×</button></div><nav class="guide-chapters" aria-label="안내 구간">${chapters.map((chapter, i) => `<button type="button" data-chapter="${i}" aria-pressed="false">${chapter.label}</button>`).join('')}</nav><div aria-live="polite" aria-atomic="true"><h2 id="guide-title"></h2><p id="guide-description"></p></div><p class="guide-caption">화면 안내입니다. 닫은 뒤 직접 눌러보세요.</p><button id="guide-skip-device" type="button" hidden>기기 연결 건너뛰기 →</button><div class="guide-navigation"><button id="guide-prev" type="button">이전</button><button id="guide-next" type="button">다음</button></div></section>`;
  document.body.appendChild(dialog);
  let steps = [], index = 0, target = null, opener = null, originalScroll = 0, pendingFrame = 0;

  let examplesWereOpen = false;

  function openHelp(section) {
    support.open = true;
    if (section) {
      $('help-troubleshooting').open = true;
      $(section).open = true;
    }
    const heading = (section ? $(section) : support).querySelector('summary');
    heading.scrollIntoView({block: 'center', behavior: 'instant'});
    heading.focus({preventScroll: true});
  }
  document.querySelectorAll('[data-help]').forEach(button => button.addEventListener('click', () => openHelp(button.dataset.help || null)));

  function renderStep() {
    const [selector, title, description] = steps[index];
    if (selector === '#project-example-link') $('help-examples').open = true;
    target = document.querySelector(selector);
    const chapterIndex = index < chapters[1].start ? 0 : index < chapters[2].start ? 1 : 2;
    dialog.querySelectorAll('[data-chapter]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === chapterIndex)));
    $('guide-skip-device').hidden = chapterIndex !== 1;
    $('guide-progress').textContent = `${chapters[chapterIndex].label}${chapterIndex === 1 ? ' · 선택' : ''} · ${index + 1} / ${steps.length}`;
    $('guide-title').textContent = title;
    $('guide-description').textContent = description;
    $('guide-prev').disabled = index === 0;
    $('guide-next').textContent = index === steps.length - 1 ? '안내 마치기' : '다음';
    if (target) target.scrollIntoView({block: 'center', behavior: 'instant'});
    positionGuide(true);
  }

  function positionGuide(reveal = false) {
    if (!dialog.open) return;
    const panel = $('guide-panel'), spot = $('guide-spotlight');
    const width = window.innerWidth, height = window.innerHeight, gap = 16;
    panel.style.width = Math.min(360, width - 24) + 'px';
    const ph = panel.getBoundingClientRect().height, pw = panel.getBoundingClientRect().width;
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
    let r = target ? target.getBoundingClientRect() : null;
    // Narrow screens reserve the lower area for the explanation. A temporary bottom
    // spacer allows the last control to scroll above it without altering saved data.
    const narrow = width < 700;
    if (reveal && r && narrow) {
      const top = Math.max(12, headerBottom + 16);
      window.scrollBy({top: r.top - top, behavior: 'instant'});
      r = target.getBoundingClientRect();
    }
    let x = width - pw - 12, y = height - ph - 12;
    if (r && !narrow) {
      const candidates = [
        [r.left - pw - gap, Math.max(12, Math.min(r.top, height - ph - 12))],
        [r.right + gap, Math.max(12, Math.min(r.top, height - ph - 12))],
        [Math.max(12, Math.min(r.left, width - pw - 12)), r.bottom + gap],
        [Math.max(12, Math.min(r.left, width - pw - 12)), r.top - ph - gap]
      ];
      const fit = candidates.find(([cx, cy]) => cx >= 12 && cy >= 12 && cx + pw <= width - 12 && cy + ph <= height - 12);
      if (fit) [x,y] = fit;
    }
    panel.style.left = x + 'px'; panel.style.top = Math.max(12, y) + 'px';
    if (r) {
      const top = Math.max(4, r.top - 5), left = Math.max(4, r.left - 5);
      const bottom = Math.min(height - 4, narrow ? y - 12 : height - 4, r.bottom + 5);
      spot.hidden = bottom <= top || r.right <= 0 || r.left >= width;
      Object.assign(spot.style, {left: left + 'px', top: top + 'px', width: Math.max(0, Math.min(width - 4, r.right + 5) - left) + 'px', height: Math.max(0, bottom - top) + 'px'});
    } else spot.hidden = true;
  }
  function startTour(kind, button) {
    if (kind !== 'all') return;
    opener = button; originalScroll = window.scrollY;
    steps = allSteps; index = 0;
    examplesWereOpen = $('help-examples').open;
    document.body.classList.add('guide-active');
    dialog.showModal();
    renderStep();
    $('guide-next').focus({preventScroll:true});
  }
  support.querySelectorAll('[data-tour]').forEach(button => button.addEventListener('click', () => startTour(button.dataset.tour, button)));
  $('guide-prev').addEventListener('click', () => { if (index > 0) { index--; renderStep(); } });
  $('guide-next').addEventListener('click', () => { if (index === steps.length - 1) dialog.close(); else { index++; renderStep(); } });
  dialog.querySelectorAll('[data-chapter]').forEach(button => button.addEventListener('click', () => { index = chapters[Number(button.dataset.chapter)].start; renderStep(); }));
  $('guide-skip-device').addEventListener('click', () => { index = chapters[2].start; renderStep(); $('guide-next').focus({preventScroll:true}); });
  $('guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('guide-active');
    $('help-examples').open = examplesWereOpen;
    window.scrollTo({top:originalScroll, behavior:'instant'});
    if (opener) opener.focus({preventScroll:true});
  });
  const reposition = () => {
    if (!dialog.open || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => { pendingFrame = 0; positionGuide(); });
  };
  window.addEventListener('resize', () => { if (dialog.open) renderStep(); });
  window.addEventListener('scroll', reposition, {passive:true});
  if (location.hash === '#support-card') requestAnimationFrame(() => openHelp());
})();


