/* theme-core.js — 시간 기반 테마 계산 (의존성 없음, <head> 에서 동기 로드).
 * 낮 = 라이트, 일몰 후~일출 전 = 다크. NOAA 일출 공식(고도 -0.833°), 위도·경도는 서울 기준.
 * 시각은 "서울의 태양 시계"를 방문자의 벽시계(로컬 시각)에 그대로 적용한다:
 * 방문자 시간대와 무관하게 서울과 같은 시계 시각에 해가 뜨고 진다고 근사한다.
 * 테스트·확인용 override: URL 에 ?theme=light 또는 ?theme=dark 를 붙이면 그 값을 강제한다.
 * Node(require)와 브라우저(window.__theme) 양쪽에서 쓴다. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.__theme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var LAT = 37.5665, LON = 126.978, KST = 540, RAD = Math.PI / 180;

  // date 가 속한 서울(KST) 달력일의 일출·일몰을 KST 시계 기준 '자정 이후 분'으로 돌려준다.
  function sunTimes(date) {
    var k = new Date(date.getTime() + KST * 60000);
    var y = k.getUTCFullYear();
    var doy = Math.round((Date.UTC(y, k.getUTCMonth(), k.getUTCDate()) - Date.UTC(y, 0, 1)) / 864e5) + 1;
    var days = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365;
    var g = 2 * Math.PI / days * (doy - 1 + 0.0); // 정오 기준
    var eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var c = (Math.cos(90.833 * RAD) / (Math.cos(LAT * RAD) * Math.cos(decl))) - Math.tan(LAT * RAD) * Math.tan(decl);
    c = Math.max(-1, Math.min(1, c));
    var ha = Math.acos(c) / RAD;
    return {
      sunrise: 720 - 4 * (LON + ha) - eqt + KST,
      sunset: 720 - 4 * (LON - ha) - eqt + KST,
      minutes: k.getUTCHours() * 60 + k.getUTCMinutes() // 지금 시각(KST 시계)
    };
  }

  // offsetMin(방문자 UTC 오프셋, 분)을 주면 방문자 시계로 환산해 같은 시계 시각 규칙을 적용한다.
  function isNight(date, offsetMin) {
    var d = date;
    if (typeof offsetMin === 'number') d = new Date(date.getTime() + (KST - offsetMin) * 60000);
    var t = sunTimes(d);
    return t.minutes < t.sunrise || t.minutes >= t.sunset;
  }

  function forced() {
    try {
      var m = /[?&]theme=(light|dark)\b/.exec(location.search);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function apply() {
    var theme = forced() || (isNight(new Date(), -new Date().getTimezoneOffset()) ? 'dark' : 'light');
    var el = document.documentElement;
    if (el.dataset.theme !== theme) el.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0F1115' : '#FAFAF7');
    return theme;
  }

  return {sunTimes: sunTimes, isNight: isNight, apply: apply};
});
