/* nav-spy.js — 홈에서 상단 메뉴의 서비스·AI 공장·경력을 같은 문서 스크롤로 처리하고, 보이는 섹션의 링크에 aria-current 를 준다.
 * JS 가 없으면 링크는 그냥 /#services 등으로 이동한다(다른 페이지에서도 홈으로 가서 그 앵커로 스크롤). 홈 링크만 정적 aria-current="page".
 * pickCurrent 는 순수 함수라 Node(require)에서도 단위 시험된다. */
(function (root) {
  var ORDER = ['top', 'services', 'factories', 'experience', 'contact'];
  // visible: {섹션id: 화면에 보이는 높이(px)} → 가장 크게 보이는 섹션 id. 모두 0 이면 null(링크 강조 없음).
  function pickCurrent(visible) {
    var best = null, h = 0;
    ORDER.forEach(function (id) { if ((visible[id] || 0) > h) { h = visible[id]; best = id; } });
    return best;
  }
  function init(win) {
    var doc = win.document, loc = win.location;
    if (loc.pathname !== '/' && loc.pathname !== '/index.html') return;
    var menu = doc.getElementById('nav-menu'); if (!menu) return;
    var links = {};
    [].forEach.call(menu.querySelectorAll('a[data-spy]'), function (a) { links[a.getAttribute('data-spy')] = a; });
    var smooth = !(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // 같은 문서 안 이동: 새로고침 없이 스크롤 + 주소 갱신
    menu.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-spy]'); if (!a) return;
      var id = a.getAttribute('data-spy'), el = doc.getElementById(id); if (!el) return;
      e.preventDefault();
      el.scrollIntoView({behavior: smooth ? 'smooth' : 'auto', block: id === 'top' ? 'start' : 'start'});
      win.history.pushState(null, '', id === 'top' ? '/' : '/#' + id);
    });
    var visible = {};
    function paint() {
      var cur = pickCurrent(visible);
      ORDER.forEach(function (id) {
        var a = links[id]; if (!a) return;
        if (id === cur) a.setAttribute('aria-current', id === 'top' ? 'page' : 'true'); else a.removeAttribute('aria-current');
      });
    }
    if (!('IntersectionObserver' in win)) return;
    var io = new win.IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRect.height : 0; });
      paint();
    }, {threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1], rootMargin: '-72px 0px 0px 0px'});
    ORDER.forEach(function (id) { var el = doc.getElementById(id); if (el) io.observe(el); });
  }
  var api = {pickCurrent: pickCurrent, ORDER: ORDER, init: init};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (root.document) { root.__navSpy = api; if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { init(root); }); else init(root); }
})(typeof window !== 'undefined' ? window : this);
