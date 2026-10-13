/* copy.js — 프롬프트 전문 '복사하기' 버튼 (의존성 없음, 인라인 스크립트 없음).
 * 버튼은 마크업에서 hidden 이고 이 스크립트가 켜진다 → JS 가 없으면 버튼은 안 보이고 <details> 본문만 읽힌다.
 * 복사 순서: navigator.clipboard.writeText → (없거나 거부되면) hidden textarea + document.execCommand('copy') → 둘 다 안 되면 안내 문구.
 * Node(require)와 브라우저 둘 다에서 로드된다(copyText 단위 시험용). */
(function (root) {
  var MSG = {ko: {done: '복사됐어요', fail: '직접 선택해 복사해 주세요'}, en: {done: 'Copied', fail: 'Please select the text and copy it manually'}};
  var RESET_MS = 2000;

  // 반환: Promise<'clipboard' | 'fallback' | null>
  function copyText(text, clipboard, fallback) {
    var viaFallback = function () { var ok = false; try { ok = !!fallback(text); } catch (e) {} return ok ? 'fallback' : null; };
    if (clipboard && typeof clipboard.writeText === 'function') {
      try { return Promise.resolve(clipboard.writeText(text)).then(function () { return 'clipboard'; }, viaFallback); } catch (e) { /* 동기 예외 → 대체 경로 */ }
    }
    return Promise.resolve(viaFallback());
  }

  function execCommandFallback(doc) {
    return function (text) {
      var ta = doc.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      doc.body.appendChild(ta);
      try { ta.select(); ta.setSelectionRange(0, text.length); return doc.execCommand('copy'); } finally { doc.body.removeChild(ta); }
    };
  }

  function init(doc, nav) {
    var fb = execCommandFallback(doc);
    [].forEach.call(doc.querySelectorAll('button[data-copy-target]'), function (btn) {
      var target = doc.getElementById(btn.getAttribute('data-copy-target'));
      var status = btn.parentNode.querySelector('.copy-status');
      if (!target) return;
      btn.hidden = false;
      var timer;
      btn.addEventListener('click', function () {
        var lang = doc.body.classList.contains('en') ? 'en' : 'ko';
        copyText(target.textContent, nav && nav.clipboard, fb).then(function (how) {
          clearTimeout(timer);
          btn.setAttribute('data-state', how ? 'done' : 'fail');
          if (status) status.textContent = MSG[lang][how ? 'done' : 'fail'];
          timer = setTimeout(function () { btn.removeAttribute('data-state'); if (status) status.textContent = ''; }, how ? RESET_MS : RESET_MS * 2);
        });
      });
    });
  }

  var api = {copyText: copyText, MSG: MSG, init: init};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.__copy = api;
    if (root.document) { if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { init(root.document, root.navigator); }); else init(root.document, root.navigator); }
  }
})(typeof window !== 'undefined' ? window : this);
