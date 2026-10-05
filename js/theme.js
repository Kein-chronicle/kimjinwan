/* theme.js — 페이지를 열어 둔 채로도 해가 지면 테마를 바꾼다. (초기 적용은 <head> 의 theme-core.js) */
(function () {
  if (!window.__theme) return;
  var t = window.__theme;
  setInterval(t.apply, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) t.apply(); });
})();
