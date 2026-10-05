import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const read = f => fs.readFileSync(f, 'utf8');
const PAGES = ['index.html', 'works/index.html', 'factories/index.html', 'career/index.html'];
const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;

test('외부 서브도메인 링크는 모두 새 창·noopener 로 연다', () => {
  for (const f of PAGES) {
    const links = [...read(f).matchAll(/<a\b[^>]*href="https:\/\/(?:blog|apps|games|forge|prism-studio)\.kimjinwan\.com\/[^"]*"[^>]*>/g)];
    assert.ok(links.length >= 3, f + ' has external subdomain links');
    for (const m of links) { assert.match(m[0], /target="_blank"/, f); assert.match(m[0], /rel="noopener noreferrer"/, f); }
  }
});
test('target=_blank 링크는 모두 noopener 를 가진다', () => {
  for (const f of PAGES) for (const m of read(f).matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(m[0], /rel="[^"]*noopener[^"]*"/, f + ' ' + m[0]);
});
test('홈이 블로그·웹도구·웹게임·Forge·Prism 으로 연결된다', () => {
  const h = read('index.html');
  for (const u of ['https://blog.kimjinwan.com/ko/', 'https://apps.kimjinwan.com/', 'https://games.kimjinwan.com/', 'https://forge.kimjinwan.com/', 'https://prism-studio.kimjinwan.com/'])
    assert.ok(h.includes(`href="${u}`), u);
  assert.ok(h.includes('https://blog.kimjinwan.com/ko/ai/ai-writing-index/') || h.includes('https://blog.kimjinwan.com/ko/apps/app-archive/'));
});
test('robots.txt 는 네 사이트맵을 명시한다', () => {
  const r = read('robots.txt');
  for (const s of ['https://kimjinwan.com', 'https://blog.kimjinwan.com', 'https://apps.kimjinwan.com', 'https://games.kimjinwan.com'])
    assert.ok(r.includes(`Sitemap: ${s}/sitemap.xml`), s);
});
test('서버에서 보존한 광고 파일을 유지한다', () => {
  for (const file of ['app-ads.txt', 'ads.txt'])
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), '422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0');
});
test('모든 페이지에 메타·파비콘·애드센스 계정 메타·JSON-LD 가 있다', () => {
  for (const f of [...PAGES, 'game/index.html']) {
    const h = read(f);
    for (const t of ['name="description"', 'name="robots" content="index,follow"', 'rel="canonical"', 'property="og:title"', 'property="og:url"', 'name="twitter:card"'])
      assert.ok(h.includes(t), f + ' ' + t);
    for (const i of ['favicon.svg', 'favicon.ico', 'favicon-96.png', 'apple-touch-icon.png']) { assert.ok(h.includes('/' + i), f + i); assert.ok(fs.statSync(i).size > 0); }
  }
  for (const f of PAGES) {
    const h = read(f);
    assert.ok(h.includes('name="google-adsense-account" content="ca-pub-5544615855471151"'), f);
    const schema = JSON.parse(h.match(LD)[1]);
    assert.equal(schema['@context'], 'https://schema.org', f);
    assert.ok(schema['@graph'].some(x => x['@type'] === 'Person'), f);
  }
  const schema = JSON.parse(read('index.html').match(LD)[1]);
  assert.ok(schema['@graph'].some(x => x['@type'] === 'ProfilePage'));
});
test('sitemap 에 네 페이지와 게임이 있다', () => {
  const x = read('sitemap.xml');
  for (const p of ['/', '/works/', '/factories/', '/career/', '/game/']) assert.ok(x.includes(`<loc>https://kimjinwan.com${p}</loc>`), p);
});
test('canonical 은 페이지별 자기 URL 이다', () => {
  const want = {'index.html': '/', 'works/index.html': '/works/', 'factories/index.html': '/factories/', 'career/index.html': '/career/'};
  for (const [f, p] of Object.entries(want)) assert.ok(read(f).includes(`<link rel="canonical" href="https://kimjinwan.com${p}">`), f);
  assert.ok(read('game/index.html').includes('rel="canonical"'));
});
test('Career Run 게임 진입점이 경력 페이지에 남아 있다', () => {
  assert.ok(read('career/index.html').includes('openGame'));
  assert.ok(fs.existsSync('game/index.html'));
});
test('모든 페이지에 h1 이 정확히 하나 있다', () => {
  for (const f of PAGES) assert.equal((read(f).match(/<h1[\s>]/g) || []).length, 1, f);
});
test('모든 img 에 alt 속성이 있다', () => {
  for (const f of PAGES) for (const m of read(f).matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\salt="/, f + ' ' + m[0]);
});
test('내부 링크는 저장소 안의 실제 파일/디렉터리 인덱스로 해석된다', () => {
  for (const f of PAGES) for (const m of read(f).matchAll(/\b(?:href|src)="(\/[^"]*)"/g)) {
    const p = decodeURIComponent(m[1].split('#')[0].split('?')[0]);
    if (p === '' || p === '/') continue;
    const rel = p.slice(1);
    const ok = p.endsWith('/') ? fs.existsSync(path.join(rel, 'index.html')) : fs.existsSync(rel) && (fs.statSync(rel).isFile() || fs.existsSync(path.join(rel, 'index.html')));
    assert.ok(ok, `${f}: broken internal ref ${m[1]}`);
  }
});
test('페이지에 TODO 문자열이 없다', () => {
  for (const f of PAGES) assert.doesNotMatch(read(f), /TODO/, f);
});
test('모든 페이지에 내비게이션이 있다', () => {
  for (const f of PAGES) {
    const h = read(f);
    const nav = h.match(/<nav id="nav" aria-label="Main">[\s\S]*?<\/nav>/);
    assert.ok(nav, f + ' site nav (labelled landmark)');
    for (const p of ['/', '/works/', '/factories/', '/career/']) assert.ok(nav[0].includes(`href="${p}"`), f + p);
  }
});
test('theme-core 는 head 안에서 본문보다 먼저 실행된다', () => {
  for (const f of PAGES) {
    const h = read(f);
    const head = h.slice(h.indexOf('<head>'), h.indexOf('</head>'));
    const core = head.indexOf('<script src="/js/theme-core.js"></script>');
    assert.ok(core > -1, f);
    assert.ok(core > head.indexOf('rel="stylesheet"'), f + ' theme-core after stylesheet');
    assert.ok(head.indexOf('__theme.apply()') > core, f);
    assert.ok(h.indexOf('<body') > h.indexOf('</head>'), f);
  }
});
test('한국어 1인칭 대명사(제가·저는·저의 등)가 화면·데이터·메타 어디에도 없다 — "직접 …" 표현을 쓴다', () => {
  const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
  const files = [...PAGES, 'js/data.js', 'js/main.js', 'scripts/build.mjs', 'scripts/lib/render.mjs',
    ...fs.readdirSync('data').map(f => 'data/' + f), ...fs.readdirSync('src', {recursive: true}).filter(f => f.endsWith('.html')).map(f => 'src/' + f)];
  for (const f of files) {
    const m = read(f).match(BAN);
    assert.equal(m, null, `${f}: "${m && read(f).slice(Math.max(0, m.index - 20), m.index + 20)}"`);
  }
});
