import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {K_PATH, K_DOT, breadcrumb, pageFoot} from '../scripts/lib/render.mjs';

const read = f => fs.readFileSync(f, 'utf8');
const PAGES = {'index.html': 'home', 'works/index.html': 'works', 'factories/index.html': 'factories', 'career/index.html': 'career'};
const SUB = {works: '/works/', factories: '/factories/', career: '/career/'};
const siteNav = h => h.match(/<nav id="nav" aria-label="Main">[\s\S]*?\n<\/nav>/)[0];
const main = h => h.slice(h.indexOf('<main'), h.indexOf('</main>'));

test('내비: 홈·경력·개인 프로젝트·도구·원칙·블로그·웹게임·웹 도구·연락하기 순서, aria-current 는 현재 페이지가 메뉴에 있을 때만 하나', () => {
  const WANT = [['/', '홈'], ['/career/', '경력'], ['/#projects', '개인 프로젝트'], ['/#ai', '도구·원칙'],
    ['https://blog.kimjinwan.com/ko/', '블로그'], ['https://games.kimjinwan.com/', '웹게임'], ['https://apps.kimjinwan.com/', '웹 도구'], ['#contact', '연락하기']];
  for (const [f, key] of Object.entries(PAGES)) {
    const nav = siteNav(read(f));
    const menu = nav.slice(nav.indexOf('id="nav-menu"'));
    const links = [...menu.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.deepEqual(links.map(m => m[1].match(/href="([^"]*)"/)[1]), WANT.map(w => w[0]), f);
    links.forEach((m, i) => assert.ok(m[2].includes(`<span data-lang-ko>${WANT[i][1]}</span>`), f + ' label ' + WANT[i][1]));
    const current = links.map(m => m[1]).filter(a => a.includes('aria-current="page"'));
    const own = key === 'home' ? '/' : SUB[key];
    if (WANT.some(w => w[0] === own)) { assert.equal(current.length, 1, f); assert.ok(current[0].includes(`href="${own}"`), f + ' current=' + current[0]); }
    else assert.equal(current.length, 0, f + ' (page not in menu: reached via in-page links, site map and page foot)');
  }
});
test('홈 섹션 앵커(/#ai 등)는 홈에 실존하는 id 로 간다', () => {
  const home = read('index.html');
  for (const f of Object.keys(PAGES)) for (const m of read(f).matchAll(/href="\/#([\w-]+)"/g)) assert.ok(home.includes(`id="${m[1]}"`), `${f}: /#${m[1]}`);
});
test('Kein 로고: 모든 페이지 내비에 "/" 링크·aria-label·실제 텍스트 Kein·인라인 마크', () => {
  for (const f of Object.keys(PAGES)) {
    const nav = siteNav(read(f));
    const m = nav.match(/<a href="\/" class="logo" aria-label="Kein — Home">([\s\S]*?)<\/a>/);
    assert.ok(m, f);
    assert.match(m[1], /<span class="logo-word">Kein<\/span>/, f);
    assert.match(m[1], /<svg class="kmark"[^>]*aria-hidden="true"/, f);
    assert.ok(m[1].includes(K_PATH), f);
    assert.doesNotMatch(m[1], /<img|linear-gradient|<linearGradient/, f);
  }
});
test('사람 이름(김진완)은 본문·메타·JSON-LD 에 남아 있다', () => {
  const h = read('index.html');
  assert.match(h, /<h1>[\s\S]*김진완[\s\S]*<\/h1>/);
  assert.ok(h.includes('<meta name="author" content="김진완">'));
  const person = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find(x => x['@type'] === 'Person');
  assert.equal(person.name, '김진완');
  assert.ok([].concat(person.alternateName).includes('Kein'));
});
test('모바일 메뉴 버튼은 aria-expanded/aria-controls 로 패널과 연결된다', () => {
  for (const f of Object.keys(PAGES)) {
    const nav = siteNav(read(f));
    const btn = nav.match(/<button type="button" class="menu-btn"[^>]*>/)[0];
    assert.match(btn, /aria-expanded="false"/, f); assert.match(btn, /aria-controls="nav-menu"/, f);
    assert.match(nav, /<div class="nav-links" id="nav-menu">/, f);
    assert.match(nav, /<span class="sr-only"><span data-lang-ko>메뉴<\/span><span data-lang-en>Menu<\/span><\/span>/, f);
  }
  const js = read('js/main.js');
  for (const s of ["getElementById('menuBtn')", "setAttribute('aria-expanded'", "e.key==='Escape'", 'btn.focus()']) assert.ok(js.includes(s), s);
  // JS 가 없을 때는 패널을 숨기지 않는다: 숨김 규칙은 .js 범위 안에만 있다
  const css = read('css/style.css');
  assert.ok(read('src/partials/head.html').includes("document.documentElement.classList.add('js')"));
  assert.match(css, /\.js \.nav-links\{display:none/);
  assert.doesNotMatch(css, /(^|[^s])\s\.nav-links( a:not\(\.nav-cta\))?\{display:none/m);
});
test('사이트 고정은 #nav 에만 — 브레드크럼·사이트맵 <nav> 는 고정되지 않는다', () => {
  assert.doesNotMatch(read('css/style.css'), /(^|[},\s])nav(\.scrolled)?\{/m);
});
test('하위 페이지: main 안 브레드크럼에 "/" 링크, 하단에 홈 복귀 버튼과 다른 하위 페이지 링크', () => {
  for (const [f, key] of Object.entries(PAGES)) {
    const h = read(f), m = main(h);
    if (key === 'home') { assert.doesNotMatch(h, /aria-label="breadcrumb"|class="page-foot"/); continue; }
    const crumb = m.match(/<nav class="crumbs" aria-label="breadcrumb">[\s\S]*?<\/nav>/);
    assert.ok(crumb, f + ' breadcrumb inside main');
    assert.ok(m.indexOf(crumb[0]) < m.indexOf('<h1'), f + ' breadcrumb before h1');
    assert.match(crumb[0], /<a href="\/">[\s\S]*<span data-lang-ko>홈<\/span><span data-lang-en>Home<\/span><\/a>/, f);
    assert.match(crumb[0], /<li aria-current="page">/, f);
    const foot = m.match(/<div class="page-foot">[\s\S]*?<\/p><\/div>/);
    assert.ok(foot, f + ' page-foot inside main');
    assert.ok(m.lastIndexOf('class="page-foot"') > m.lastIndexOf('</section>') || key !== 'career', f + ' at bottom');
    assert.match(foot[0], /<a class="btn btn-ghost back-home" href="\/">[\s\S]*홈으로 돌아가기[\s\S]*Back to home/, f);
    for (const [k, href] of Object.entries(SUB)) assert.equal(foot[0].includes(`href="${href}"`), k !== key, `${f} hop ${k}`);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, f);
  }
  assert.equal(breadcrumb('home'), ''); assert.equal(pageFoot('home'), '');
});
test('푸터 사이트맵: 모든 페이지에 홈·작업물·AI 공장·경력·블로그·웹게임·웹 도구, 외부는 새 창', () => {
  for (const f of Object.keys(PAGES)) {
    const map = read(f).match(/<nav class="foot-map" aria-label="Site map">[\s\S]*?<\/nav>/)[0];
    for (const u of ['/', '/works/', '/factories/', '/career/', 'https://blog.kimjinwan.com/ko/', 'https://games.kimjinwan.com/', 'https://apps.kimjinwan.com/'])
      assert.ok(map.includes(`href="${u}"`), f + u);
    for (const m of map.matchAll(/<a href="https:[^"]*"[^>]*>/g)) assert.match(m[0], /target="_blank" rel="noopener noreferrer"/);
  }
});
test('파비콘은 새 Kein 마크로 교체됐고 비어 있지 않다', async () => {
  const {createHash} = await import('node:crypto');
  const OLD = {'favicon.svg': 'a7e9455614ac09fee62827d5ffa10bb697ccfe2cebacf6101b79842cf356afc9', 'favicon-96.png': '77819b8942f8a0535f86076dbcee5045cac09d04186795047eb6c1c2b102f487',
    'apple-touch-icon.png': '0113beb3aea7a17f35f5f404fa129678a4fe06bd7f6ed098e649a2157f4a3ab5', 'favicon.ico': '21aeafa63206f45a0170937a8d60cd8c2351a180884850892111212cd0ced23a'};
  for (const [f, old] of Object.entries(OLD)) {
    const buf = fs.readFileSync(f);
    assert.ok(buf.length > 200, f);
    assert.notEqual(createHash('sha256').update(buf).digest('hex'), old, f + ' unchanged');
  }
  const svg = read('favicon.svg');
  assert.ok(svg.includes(K_PATH) && svg.includes(`cx="${K_DOT.cx}" cy="${K_DOT.cy}" r="${K_DOT.r}"`), 'favicon.svg = same mark');
  assert.match(svg, /fill="#3B4BDB"/);
  assert.doesNotMatch(svg, /<image|<text|Gradient|href=/);
  // build_icons.py 도 같은 기하를 쓴다
  const py = read('scripts/build_icons.py');
  assert.ok(py.includes('(19.1, 16.1), (22.5, 19.5), (18.5, 23.5)') && py.includes('DOT = (25.5, 25.5, 3.25)'));
});
