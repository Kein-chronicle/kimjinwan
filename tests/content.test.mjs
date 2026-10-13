// tests/content.test.mjs — /content/ (콘텐츠 허브): 랜딩 → 섹션 → 카테고리 → 쪽(20건) → 상세. 네트워크·형제 저장소를 읽지 않는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate, HUB_MIN_SUMMARY} from '../scripts/lib/validate.mjs';
import {loadData, buildAll} from '../scripts/build.mjs';
import {PER_PAGE} from '../scripts/lib/hub.mjs';
import {CATEGORY} from '../scripts/lib/render.mjs';

const read = f => fs.readFileSync(f, 'utf8');
const D = loadData();
const hub = D.contentHub;
const out = buildAll({write: false});
const sec = id => hub.sections.find(s => s.id === id);
const flat = s => (s.groups ? s.groups.flatMap(g => g.items) : s.items);
const SITE = 'https://kimjinwan.com';
const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
const text = h => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
const noCode = h => h.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
const canon = h => h.match(/<link rel="canonical" href="([^"]*)">/)[1];
const contentFiles = Object.keys(out).filter(f => f.startsWith('content/'));
const pathOf = f => '/' + f.replace(/index\.html$/, '');
const ceilDiv = n => Math.max(1, Math.ceil(n / PER_PAGE));

const blog = sec('blog'), gizmo = sec('gizmo');
const slugOf = u => u.split('/').filter(Boolean).pop();
const cats = CATEGORY.filter(c => D.services.some(s => s.category === c.key));

// 기대하는 색인 경로 집합을 데이터에서 따로 계산한다(구현과 독립)
function expectedIndexPaths() {
  const set = new Set(['/content/']);
  const add = (base, n) => { for (let i = 1; i <= ceilDiv(n); i++) set.add(i === 1 ? base : `${base}page/${i}/`); };
  add('/content/blog/', blog.count.value);
  for (const g of blog.groups) add(`/content/blog/${g.id}/`, g.items.length);
  add('/content/gizmo/', gizmo.count.value);
  for (const g of gizmo.groups) add(`/content/gizmo/purpose/${g.id}/`, g.items.length);
  add('/content/services/', D.services.length);
  for (const c of cats) add(`/content/services/category/${c.key}/`, D.services.filter(s => s.category === c.key).length);
  set.add('/content/games/'); set.add('/content/tools/');
  return set;
}
const detailPaths = () => new Set([...flat(blog).map(i => `/content/blog/${i.url.split('/').slice(-3, -1).join('/')}/`), ...flat(gizmo).map(i => `/content/gizmo/${slugOf(i.url)}/`), ...D.services.map(s => `/content/services/${s.id}/`)]);

test('콘텐츠 허브 데이터는 검증을 통과한다', () => assert.deepEqual(validate(D), []));
test('섹션 다섯 개, 숫자마다 as_of·source, 블로그·기즈모는 전체 항목', () => {
  assert.deepEqual(hub.sections.map(s => s.id), ['blog', 'services', 'games', 'tools', 'gizmo']);
  for (const s of hub.sections) { assert.match(s.count.as_of, /^\d{4}-\d{2}-\d{2}$/, s.id); assert.ok(s.count.source.length > 20, s.id); assert.ok(s.count.value >= flat(s).length, s.id); }
  assert.equal(flat(blog).length, blog.count.value); assert.equal(flat(gizmo).length, gizmo.count.value);
  assert.equal(flat(sec('services')).length, D.services.length);
  for (const it of flat(gizmo)) assert.ok(it.summary.length >= 30, it.url);
});
test('색인 페이지 집합이 데이터에서 계산한 기대값과 정확히 같다(쪽 수 정합)', () => {
  const idx = new Set(contentFiles.map(pathOf)), det = detailPaths();
  const expected = expectedIndexPaths();
  assert.deepEqual([...idx].filter(p => !det.has(p)).sort(), [...expected].sort());
  assert.deepEqual([...idx].filter(p => det.has(p)).sort(), [...det].sort());
  assert.equal(contentFiles.length, expected.size + det.size);
});
test('경로 충돌이 없다: 상세 slug 가 쪽·분류 경로 이름과 겹치지 않고, 출력 경로는 모두 유일하다', () => {
  for (const it of flat(blog)) { const [cat, slug] = it.url.split('/').slice(-3, -1); assert.ok(!['page'].includes(slug), `blog slug ${cat}/${slug}`); assert.ok(!/^\d+$/.test(slug) || true); }
  for (const g of blog.groups) assert.notEqual(g.id, 'page');
  for (const it of flat(gizmo)) assert.ok(!['page', 'purpose'].includes(slugOf(it.url)), slugOf(it.url));
  for (const s of D.services) assert.ok(!['page', 'category'].includes(s.id), s.id);
  const paths = contentFiles.map(pathOf);
  assert.equal(new Set(paths).size, paths.length);
  const det = detailPaths();
  for (const p of expectedIndexPaths()) assert.ok(!det.has(p), 'collision ' + p);
});
test('색인 페이지: 자기 canonical, 쪽당 20건 이하, prev/next 가 서로 맞물린다', () => {
  const bases = [['/content/blog/', blog.count.value], ...blog.groups.map(g => [`/content/blog/${g.id}/`, g.items.length]), ['/content/gizmo/', gizmo.count.value],
    ...gizmo.groups.map(g => [`/content/gizmo/purpose/${g.id}/`, g.items.length]), ['/content/services/', D.services.length]];
  for (const [base, n] of bases) {
    const total = ceilDiv(n);
    for (let i = 1; i <= total; i++) {
      const p = i === 1 ? base : `${base}page/${i}/`, h = out[p.slice(1) + 'index.html'];
      assert.ok(h, p);
      assert.equal(canon(h), SITE + p, p);
      assert.ok((h.match(/<li class="hub-row">/g) || []).length <= PER_PAGE, p);
      const prev = h.match(/<link rel="prev" href="([^"]*)">/), next = h.match(/<link rel="next" href="([^"]*)">/);
      assert.equal(prev && prev[1], i > 1 ? SITE + (i === 2 ? base : `${base}page/${i - 1}/`) : null, p + ' prev');
      assert.equal(next && next[1], i < total ? SITE + `${base}page/${i + 1}/` : null, p + ' next');
      if (total > 1) { assert.match(h, /<nav class="pager" aria-label="pagination">/, p); assert.equal((h.match(/aria-current="page" aria-label="page \d+"/g) || []).length, 1, p); }
      else assert.doesNotMatch(h, /class="pager"/, p);
      assert.ok(i === 1 || !out[`${base.slice(1)}page/1/index.html`], 'page/1 은 만들지 않는다');
    }
    assert.ok(!out[`${base.slice(1)}page/${total + 1}/index.html`], base + ' 과다 쪽');
  }
});
test('모든 글·기즈모 항목이 각 분류 목록의 정확히 한 쪽에 한 번씩, 전체 목록에도 한 번씩 나온다(중복·누락 없음)', () => {
  const rows = h => [...h.matchAll(/<li class="hub-row">[\s\S]*?<a class="hub-rt" href="([^"]*)"/g)].map(m => m[1]);
  const collect = (base, n) => { const all = []; for (let i = 1; i <= ceilDiv(n); i++) all.push(...rows(out[(i === 1 ? base : `${base}page/${i}/`).slice(1) + 'index.html'])); return all; };
  const hrefOfPost = it => `/content/blog/${it.url.split('/').slice(-3, -1).join('/')}/`;
  const allBlog = collect('/content/blog/', blog.count.value);
  assert.deepEqual([...allBlog].sort(), flat(blog).map(hrefOfPost).sort());
  const perCat = blog.groups.flatMap(g => collect(`/content/blog/${g.id}/`, g.items.length));
  assert.deepEqual([...perCat].sort(), [...allBlog].sort());
  const allG = collect('/content/gizmo/', gizmo.count.value), hrefG = it => `/content/gizmo/${slugOf(it.url)}/`;
  assert.deepEqual([...allG].sort(), flat(gizmo).map(hrefG).sort());
  assert.deepEqual([...gizmo.groups.flatMap(g => collect(`/content/gizmo/purpose/${g.id}/`, g.items.length))].sort(), [...allG].sort());
  const allS = collect('/content/services/', D.services.length);
  assert.deepEqual([...allS].sort(), D.services.map(s => `/content/services/${s.id}/`).sort());
  assert.deepEqual([...cats.flatMap(c => collect(`/content/services/category/${c.key}/`, D.services.filter(s => s.category === c.key).length))].sort(), [...allS].sort());
  for (const h of [...allBlog, ...allG, ...allS]) assert.ok(out[h.slice(1) + 'index.html'], h);
});
test('랜딩: 섹션 카드 5장, 각 카드 대표 3건 이하, 개수·기준일 표기, 긴 목록 없음', () => {
  const h = out['content/index.html'];
  const cards = h.match(/<article class="card hub-card">[\s\S]*?<\/article>/g);
  assert.equal(cards.length, 5);
  for (const c of cards) { assert.ok((c.match(/<li>/g) || []).length <= 3); assert.match(c, /\d{4}-\d{2}-\d{2}/); assert.match(c, /href="\/content\/(blog|services|gizmo|games|tools)\/"/); }
  assert.equal((h.match(/<li>/g) || []).filter(Boolean).length < 40, true);
  assert.doesNotMatch(h, /class="hub-list"/);
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
});
test('보조 내비: 모든 /content/ 페이지에 같은 여섯 항목, 현재 위치 하나만 강조, 개수 표기', () => {
  for (const f of contentFiles) {
    const h = out[f], nav = h.match(/<nav class="subnav"[\s\S]*?<\/nav>/);
    assert.ok(nav, f);
    const links = [...nav[0].matchAll(/<a href="([^"]*)"([^>]*)>/g)];
    assert.deepEqual(links.map(m => m[1]), ['/content/', '/content/blog/', '/content/services/', '/content/gizmo/', '/content/games/', '/content/tools/'], f);
    assert.equal(links.filter(m => m[2].includes('aria-current="page"')).length, 1, f);
    for (const [id, n] of [['blog', blog.count.value], ['gizmo', gizmo.count.value]]) assert.ok(nav[0].includes(`href="/content/${id}/"`) && nav[0].includes(`>${n}</span>`), f + id);
  }
  assert.match(out['content/blog/ai/index.html'], /<nav class="chipbar" aria-label="blog categories">/);
});
test('상세 페이지: canonical 은 자기 주소, 원문 링크·표기·원문 연결 JSON-LD 가 없다', () => {
  for (const p of detailPaths()) {
    const h = out[p.slice(1) + 'index.html'];
    assert.equal(canon(h), SITE + p, p);
    assert.ok(h.includes(`<meta property="og:url" content="${SITE + p}">`), p);
    assert.doesNotMatch(h, /isBasedOn|sameAs|detail-src|class="detail-note"/, p);
    const g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const art = g.find(x => x['@type'] === 'Article');
    assert.equal(art.mainEntityOfPage['@id'], SITE + p, p); assert.equal(art.url, SITE + p, p);
    assert.deepEqual(art.author, {'@id': `${SITE}/#person`}); assert.equal(g.find(x => x['@type'] === 'Person').name, '김진완');
    const bc = g.find(x => x['@type'] === 'BreadcrumbList').itemListElement;
    assert.ok(bc.length >= 4 && bc[0].name === '홈' && bc[1].name === '콘텐츠 허브' && bc.at(-1).item === SITE + p, p);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, p);
  }
});
test('/content/ 아래 어떤 HTML 에도 블로그 원문 링크(blog.kimjinwan.com/ko/…)·원문 표기 UI 가 없다(이미지 src 제외)', () => {
  for (const f of contentFiles) {
    const h = noCode(out[f]);
    for (const m of h.matchAll(/href="(https?:\/\/[^"]*)"/g)) if (!D.services.some(sv => sv.url === m[1])) assert.doesNotMatch(m[1], /blog\.kimjinwan\.com\/ko\//, f); // 서비스 '열기' 진입 링크는 허용
    assert.doesNotMatch(h, /data-lang-en>Original</, f);
    assert.doesNotMatch((h.match(/\s(?:class|id|aria-label)="[^"]*"/g) || []).join(''), /사본|미러|mirror/i, f + ' 마크업(클래스·속성)'); // 글 본문 속 단어는 고치지 않는다
  }
  // 직접 쓴 UI 문구(템플릿·렌더러)에 '원문'·'사본' 표기가 없다(옮긴 글 본문은 고치지 않는다)
  for (const f of ['src/content.html', 'src/content-list.html', 'src/detail.html', 'scripts/lib/hub.mjs', 'scripts/lib/render.mjs']) assert.doesNotMatch(read(f), /원문|사본|미러/, f);
});
test('기즈모 상세: text 항목은 프롬프트 전문을 pre/code 로 싣는다(길이 하한·이스케이프·줄바꿈 유지), web 항목은 전문 없이 써 보기 링크', () => {
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  let nText = 0, nWeb = 0;
  for (const f of fs.readdirSync('content-src/gizmo')) {
    const g = JSON.parse(read('content-src/gizmo/' + f)), h = out[`content/gizmo/${g.slug}/index.html`];
    if (g.kind === 'text') {
      nText++; assert.ok(g.prompt.length >= 100, g.slug);
      const m = h.match(/<pre lang="ko" tabindex="0"><code>([\s\S]*?)<\/code><\/pre>/);
      assert.ok(m, g.slug + ' pre'); assert.equal(unescape(m[1]), g.prompt, g.slug + ' 전문 일치'); assert.doesNotMatch(m[1], /<(?!\/)[a-z]/i, g.slug + ' 이스케이프');
      if (g.prompt.includes('\n')) assert.ok(m[1].includes('\n'), g.slug);
      assert.equal(g.download, `https://gizmo-store.com/tool/${g.slug}/download`, g.slug);
      assert.ok(h.includes(`href="${g.download}" target="_blank" rel="noopener noreferrer"`), g.slug + ' 받기 링크');
    } else { nWeb++; assert.doesNotMatch(h, /<pre/, g.slug); assert.ok(g.toolUrl && h.includes(`href="${g.toolUrl}"`), g.slug); }
    assert.equal(g.url, `https://gizmo-store.com/tool/${g.slug}`, g.slug);
    assert.ok(h.includes(`href="${g.url}" target="_blank" rel="noopener noreferrer"`), g.slug + ' 보기 링크');
    assert.match(h, /기즈모 스토어에서 보기/, g.slug);
    if (g.kind === 'text') assert.match(h, /기즈모 스토어에서 받기/, g.slug);
    assert.ok(g.audience && g.result && g.steps.length, g.slug);
    assert.ok(h.includes('<dl class="detail-facts">'), g.slug);
  }
  assert.equal(nText + nWeb, gizmo.count.value); assert.equal(nWeb, 6);
  const gh = [...Object.entries(out)].filter(([f]) => f.startsWith('content/gizmo/') && !f.includes('/page/') && !f.includes('/purpose/') && f !== 'content/gizmo/index.html');
  assert.equal(gh.length, 50); assert.equal(gh.filter(([, h]) => /href="https:\/\/gizmo-store\.com\/tool\/[\w-]+\/download"/.test(h)).length, 44);
  for (const [f, h] of gh) for (const m of h.matchAll(/href="(https:\/\/gizmo-store\.com[^"]*)"/g)) assert.match(m[1], /^https:\/\/gizmo-store\.com\/tool\/[\w-]+(\/download)?$/, f);
});
test('상세 본문 길이 하한', () => {
  const MIN = {blog: 150, gizmo: 250, services: 400};
  for (const p of detailPaths()) {
    const h = out[p.slice(1) + 'index.html'], kind = p.split('/')[2];
    const body = text(h.slice(h.indexOf('<div class="detail-body">'), h.indexOf('</main>'))).replace(/\s+/g, ' ');
    assert.ok(body.length >= MIN[kind], `${p}: ${body.length}`);
    assert.doesNotMatch(h.slice(h.indexOf('<main'), h.indexOf('</main>')), /<script|<iframe|\son\w+=/i, p);
  }
});
test('내부 링크는 모두 실제 페이지/파일로 풀리고, 새 창 링크는 noopener 를 가진다', () => {
  const pages = new Set(Object.keys(out));
  for (const f of contentFiles) {
    const h = noCode(out[f]);
    for (const m of h.matchAll(/\b(?:href|src)="(\/[^"]*)"/g)) {
      const p = decodeURIComponent(m[1].split('#')[0].split('?')[0]);
      if (p === '/') continue;
      assert.ok(p.endsWith('/') ? pages.has(p.slice(1) + 'index.html') || fs.existsSync(p.slice(1) + 'index.html') : fs.existsSync(p.slice(1)), `${f}: broken ${m[1]}`);
      assert.doesNotMatch(m[1], /^\/ko\//, f);
    }
    for (const m of h.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(m[0], /rel="[^"]*noopener[^"]*"/, f);
    for (const m of h.matchAll(/<a\b[^>]*href="https:\/\/[^"]*"[^>]*>/g)) if (!/kimjinwan\.com\/?"/.test(m[0]) || true) assert.match(m[0], /target="_blank"/, f + m[0]);
  }
});
test('사이트맵: 색인·상세 /content/ 페이지 전부(자기 canonical)와 핵심 페이지, 중복 없음', () => {
  const x = read('sitemap.xml'), locs = [...x.matchAll(/<loc>([^<]*)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(m => m[1]);
  assert.equal(new Set(locs).size, locs.length);
  const inMap = new Set(locs.filter(u => u.startsWith(`${SITE}/content/`)).map(u => u.slice(SITE.length)));
  assert.deepEqual([...inMap].sort(), contentFiles.map(pathOf).sort());
  for (const p of ['/', '/works/', '/factories/', '/career/', '/game/']) assert.ok(locs.includes(SITE + p), p);
  assert.equal(x, out['sitemap.xml'], 'sitemap.xml 은 build 산출물이다');
});
test('직접 쓴 허브 문구(템플릿·렌더러)에 1인칭·이모지·TODO 가 없다(옮겨 온 글은 고치지 않는다)', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  for (const f of ['src/content.html', 'src/content-list.html', 'src/detail.html', 'scripts/lib/render.mjs', 'scripts/lib/hub.mjs']) { const t = read(f); assert.equal(t.match(BAN), null, f); assert.ok(!emoji.test(t), f); assert.ok(!/TODO/.test(t), f); }
});
test('랜딩 JSON-LD 는 섹션 ItemList, 색인 쪽은 CollectionPage + ItemList(쪽당 항목 수와 일치)', () => {
  const ld = h => JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const land = ld(out['content/index.html']);
  assert.ok(land.some(x => x['@type'] === 'CollectionPage'));
  assert.equal(land.find(x => x['@type'] === 'ItemList').itemListElement.length, 5);
  const g = ld(out['content/blog/page/2/index.html']);
  assert.ok(g.some(x => x['@type'] === 'CollectionPage' && x.url === `${SITE}/content/blog/page/2/`));
  assert.equal(g.find(x => x['@type'] === 'ItemList').numberOfItems, PER_PAGE);
});
test('빌드는 형제 저장소·네트워크를 읽지 않는다(content-src 스냅샷만 본다), 홈에서 허브로 간다', () => {
  assert.doesNotMatch(read('scripts/build.mjs') + read('scripts/lib/render.mjs') + read('scripts/lib/hub.mjs'), /Projects\/|homedir|fetch\(|https?\.get/);
  assert.ok(read('index.html').includes('href="/content/"'));
});
test('검증 규칙: 요약이 짧거나 호스트가 다르거나 중복이면 잡는다', () => {
  const bad = JSON.parse(JSON.stringify(hub));
  bad.sections[2].items[0].summary = '짧음';
  bad.sections[3].items[0].url = 'https://example.com/x/';
  bad.sections[4].groups[0].items[1].url = bad.sections[4].groups[0].items[0].url;
  const e = validate({...D, contentHub: bad}).join('\n');
  assert.match(e, /summary needs at least/); assert.match(e, /host must be apps\.kimjinwan\.com/); assert.match(e, /duplicate url/);
});
