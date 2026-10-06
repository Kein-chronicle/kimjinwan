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
    for (const p of ['/', '/career/', '/#projects', '/#ai']) assert.ok(nav[0].includes(`href="${p}"`), f + p);
    // /works/·/factories/ 는 내비에서 빠졌지만 푸터 사이트맵에는 남는다
    const map = h.match(/<nav class="foot-map" aria-label="Site map">[\s\S]*?<\/nav>/)[0];
    for (const p of ['/works/', '/factories/']) assert.ok(map.includes(`href="${p}"`), f + ' foot-map ' + p);
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
test('AI로 만든 것들 쇼케이스는 02-3(컬렉션 행 뒤)에 있고 03 섹션에는 없다', () => {
  const h = read('index.html');
  const s02 = h.slice(h.indexOf('id="projects"'), h.indexOf('id="ai"'));
  const s03 = h.slice(h.indexOf('id="ai"'));
  const works = s02.slice(s02.indexOf('id="works"'));
  const rows = works.indexOf('class="col-rows"');
  const show = works.indexOf('class="ai-showcase"');
  assert.ok(rows > -1 && show > rows, 'showcase after collection rows');
  assert.ok(works.indexOf('class="ai-subh"') > rows);
  assert.ok(!s03.includes('ai-showcase') && !s03.includes('acard') && !s03.includes('/assets/ai/'), '03 has no showcase');
  assert.ok(s03.includes('class="cap-list"') && s03.includes('class="ai-stats"') && s03.includes('class="tools"'));
});
test('쇼케이스 카드 여섯 제목은 홈에 정확히 한 번씩, 이미지 카드는 대체 텍스트가 있다', () => {
  const h = read('index.html');
  const titles = ['AI 캐릭터·컴패니언', '게임', '앱', 'AI 이미지·에셋', '사내 문서·자동화', 'AI 운영 인프라'];
  const found = [...h.matchAll(/<div class="abody"><h4><span data-lang-ko>([^<]+)<\/span>/g)].map(m => m[1]);
  assert.deepEqual(found, titles);
  const cards = h.match(/<div class="acard">[\s\S]*?<\/div>\s*<div class="abody">/g) || [];
  assert.equal(cards.length, 6);
  for (const c of cards) assert.ok(/role="img"|aria-label=|<img[^>]+alt=|noimg/.test(c), c.slice(0, 120));
});

// ── 메타데이터 · 공유 이미지(og:image) ──────────────────────────────────────────
import {loadData, stampOf, cardUrl} from '../scripts/build.mjs';
import {parseProjects} from '../scripts/lib/projects.mjs';
import {facts, pageMeta, cardText, cardPath, cardAlt, CARD_KEYS, SITE_NAME} from '../scripts/lib/og.mjs';

const ALL = {'index.html': 'home', 'works/index.html': 'works', 'factories/index.html': 'factories', 'career/index.html': 'career', 'game/index.html': 'game'};
const headOf = h => h.slice(h.indexOf('<head>'), h.indexOf('</head>'));
const metaOf = (h, attr, name) => { const m = h.match(new RegExp(`<meta ${attr}="${name.replace(/[.:]/g, '\\$&')}" content="([^"]*)">`)); return m && m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); };
const ogm = (h, n) => metaOf(h, 'property', n);
const nm = (h, n) => metaOf(h, 'name', n);
const META = pageMeta(facts(loadData(), parseProjects(read('js/data.js'))));
const pngDims = buf => {
  assert.equal(buf.readUInt32BE(0), 0x89504e47, 'PNG signature');
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR');
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
};

test('모든 페이지(+게임)가 자기 공유 카드를 og:image·twitter:image 로 명시한다(첫 번째 <img> 에 맡기지 않는다)', () => {
  for (const [f, key] of Object.entries(ALL)) {
    const h = read(f);
    const img = ogm(h, 'og:image');
    assert.ok(img, f + ' og:image');
    assert.match(img, /^https:\/\/kimjinwan\.com\/assets\/og\/[a-z]+\.png\?v=[0-9a-f]{10}$/, f);
    assert.equal(img, cardUrl(cardPath(key)), f + ' og:image ?v= 는 카드 PNG 내용 해시와 같아야 한다');
    assert.equal(ogm(h, 'og:image:secure_url'), img, f);
    assert.equal(nm(h, 'twitter:image'), img, f);
    assert.equal(ogm(h, 'og:image:type'), 'image/png', f);
    assert.equal(ogm(h, 'og:image:width'), '1200', f);
    assert.equal(ogm(h, 'og:image:height'), '630', f);
    assert.equal(nm(h, 'twitter:card'), 'summary_large_image', f);
    assert.equal(ogm(h, 'og:image:alt'), cardAlt(META[key]), f);
    assert.equal(nm(h, 'twitter:image:alt'), cardAlt(META[key]), f);
    assert.equal(ogm(h, 'og:site_name'), SITE_NAME, f);
    assert.equal(ogm(h, 'og:locale'), 'ko_KR', f);
    assert.ok(h.includes('<meta name="author" content="김진완">'), f + ' author');
    assert.ok(h.includes('<link rel="manifest" href="/site.webmanifest">'), f + ' manifest');
    assert.equal((h.match(/property="og:image"/g) || []).length, 1, f + ' og:image 는 하나');
  }
});
test('공유 카드 파일: PNG, 정확히 1200×630, 200KB 이하', () => {
  for (const key of CARD_KEYS) {
    const buf = fs.readFileSync(cardPath(key));
    assert.deepEqual(pngDims(buf), [1200, 630], key);
    assert.ok(buf.length <= 200 * 1024, `${key}: ${buf.length} bytes`);
  }
});
test('공유 카드 문구가 데이터와 어긋나지 않는다(lock = 데이터에서 다시 계산한 문구, PNG 해시 = lock)', () => {
  const lock = JSON.parse(read('scripts/og-cards.lock.json'));
  assert.deepEqual(Object.keys(lock).sort(), [...CARD_KEYS].sort());
  for (const key of CARD_KEYS) {
    assert.deepEqual(lock[key].text, cardText(META[key]), `${key}: 카드 문구가 데이터와 다르다 — node scripts/build_og.mjs 로 다시 생성`);
    assert.equal(createHash('sha256').update(fs.readFileSync(cardPath(key))).digest('hex'), lock[key].sha256, `${key}: PNG 가 lock 과 다르다 — node scripts/build_og.mjs`);
  }
  const d = loadData();
  assert.ok(META.factories.headline.includes(`${d.factories.length}곳`));
  assert.ok(META.career.headline.includes(`${parseProjects(read('js/data.js')).length}개`));
});
test('제목·설명: 페이지마다 다르고 길이가 적당하며, og/twitter 가 같은 문구를 쓴다', () => {
  const titles = new Set(), descs = new Set();
  for (const [f, key] of Object.entries(ALL)) {
    const h = read(f);
    const title = h.match(/<title>([^<]*)<\/title>/)[1];
    const desc = nm(h, 'description');
    assert.equal(title, META[key].title, f);
    assert.equal(desc, META[key].description, f);
    assert.ok(title.length <= 60, `${f} title ${title.length}`);
    assert.ok(desc.length >= 80 && desc.length <= 160, `${f} description ${desc.length}`);
    assert.equal(ogm(h, 'og:title'), title, f); assert.ok(title.length <= 70);
    assert.equal(nm(h, 'twitter:title'), title, f);
    assert.equal(ogm(h, 'og:description'), desc, f);
    assert.equal(nm(h, 'twitter:description'), desc, f);
    assert.doesNotMatch(desc, /게이트|SSOT|파이프라인|DoD|lock/i, f + ' 설명에 내부 용어 금지');
    titles.add(title); descs.add(desc);
  }
  assert.equal(titles.size, Object.keys(ALL).length, 'titles unique');
  assert.equal(descs.size, Object.keys(ALL).length, 'descriptions unique');
});
test('얼굴 사진·제품 스크린샷은 메타/JSON-LD 어디에도 쓰지 않는다, 연락처도 없다', () => {
  for (const f of Object.keys(ALL)) {
    const h = read(f);
    const head = headOf(h);
    assert.doesNotMatch(head, /portrait_full|assets\/services\//, f + ' head');
    for (const m of head.matchAll(/<meta [^>]*content="([^"]*)"/g)) assert.doesNotMatch(m[1], /@[a-z0-9-]+\.[a-z]|mailto:|\b01[016789]-?\d{3,4}-?\d{4}\b/i, f + ' meta ' + m[1]);
    const ld = h.match(LD)[1];
    const json = JSON.parse(ld);
    assert.equal(json['@context'], 'https://schema.org', f);
    assert.doesNotMatch(ld, /portrait_full|assets\/services\/|mailto:|"email"|"telephone"|@naver|@gmail/, f + ' JSON-LD');
    const urls = [...ld.matchAll(/"(?:url|item|contentUrl|thumbnailUrl|@id|relatedLink)":"([^"]+)"/g)].map(m => m[1]);
    assert.ok(urls.length > 3, f);
    for (const u of urls) assert.match(u, /^https:\/\//, f + ' ' + u);
    assert.equal((h.match(/application\/ld\+json/g) || []).length, 1, f + ' JSON-LD 블록 하나');
  }
});
test('JSON-LD: Person 은 sameAs·knowsAbout·jobTitle 을 갖고 image 는 없다, 하위 페이지는 Breadcrumb + 대표 이미지', () => {
  const profile = loadData().profile;
  for (const [f, key] of Object.entries(ALL)) {
    const g = JSON.parse(read(f).match(LD)[1])['@graph'];
    const page = g.find(x => ['WebPage', 'ProfilePage'].includes(x['@type']));
    assert.ok(page, f);
    assert.equal(page.primaryImageOfPage.url, cardUrl(cardPath(key)), f);
    assert.equal(page.thumbnailUrl, cardUrl(cardPath(key)), f);
    if (key === 'game') continue;
    const person = g.find(x => x['@type'] === 'Person');
    assert.ok(!('image' in person), f + ' Person.image 없음');
    assert.ok(person.sameAs.length >= 1 && person.sameAs.every(u => u.startsWith('https://')), f);
    for (const u of person.sameAs) assert.ok(read('src/partials/footer.html').includes(`href="${u}"`), f + ' sameAs 는 푸터에 실제로 걸린 주소');
    assert.deepEqual(person.knowsAbout, profile.strengths.map(s => s.title.en));
    assert.ok(person.jobTitle);
    assert.equal(g.find(x => x['@type'] === 'WebSite').name, SITE_NAME);
    if (key === 'home') { assert.equal(page['@type'], 'ProfilePage'); assert.ok(!g.some(x => x['@type'] === 'BreadcrumbList')); continue; }
    const bc = g.find(x => x['@type'] === 'BreadcrumbList');
    assert.equal(page.breadcrumb['@id'], bc['@id'], f);
    assert.deepEqual(bc.itemListElement.map(x => x.position), [1, 2]);
    assert.equal(bc.itemListElement.at(-1).item, page.url);
  }
});
test('sitemap lastmod 는 데이터 스탬프를 따른다, 매니페스트는 유효하다', () => {
  const x = read('sitemap.xml'), stamp = stampOf(loadData());
  for (const p of ['/', '/works/', '/factories/', '/career/']) assert.ok(x.includes(`<loc>https://kimjinwan.com${p}</loc><lastmod>${stamp}</lastmod>`), p);
  const mf = JSON.parse(read('site.webmanifest'));
  assert.equal(mf.short_name, 'Kein');
  for (const i of mf.icons) assert.ok(fs.existsSync(i.src.slice(1)), i.src);
});
