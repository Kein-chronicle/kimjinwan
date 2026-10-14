// tests/content.test.mjs — /content/ (콘텐츠 허브): 랜딩 → 섹션 → 카테고리 → 쪽(20건) → 상세. 네트워크·형제 저장소를 읽지 않는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate} from '../scripts/lib/validate.mjs';
import {loadData, buildAll} from '../scripts/build.mjs';
import {PER_PAGE} from '../scripts/lib/hub.mjs';

const read = f => fs.readFileSync(f, 'utf8');
const D = loadData();
const hub = D.contentHub;
const out = buildAll({write: false});
const sec = id => hub.sections.find(s => s.id === id);
const flat = s => s.groups.flatMap(g => g.items);
const SITE = 'https://kimjinwan.com';
const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
const text = h => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
const noCode = h => h.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
const canon = h => h.match(/<link rel="canonical" href="([^"]*)">/)[1];
const contentFiles = Object.keys(out).filter(f => f.startsWith('content/'));
const pathOf = f => '/' + f.replace(/index\.html$/, '');
const ceilDiv = n => Math.max(1, Math.ceil(n / PER_PAGE));
const slugOf = u => u.split('/').filter(Boolean).pop();

const column = sec('column'), blog = sec('blog'), news = sec('gamenews'), gizmo = sec('gizmo'), games = sec('games'), tools = sec('tools'), apps = sec('apps');
// 데이터 섹션 순서 = 서브 메뉴 순서('전체' 뒤에 이 순서로 온다 — 보조 내비 시험 참고)
const NAV_IDS = ['column', 'blog', 'gamenews', 'gizmo', 'games', 'tools', 'apps'];
const BASE = {column: '/content/column/', blog: '/content/blog/', gamenews: '/content/game-news/', gizmo: '/content/gizmo/', games: '/content/games/', tools: '/content/tools/', apps: '/content/apps/'};
const SUBPATH = {column: '', blog: '', gamenews: '', gizmo: 'purpose/', games: 'genre/', tools: 'category/', apps: 'category/'};
const SINGLE = ['column', 'blog']; // 서브카테고리 없는 단일 목록(칩·카테고리 색인 없음): 케인칼럼, 에이전트 업무일지
const sections = {column, blog, gamenews: news,  gizmo, games, tools, apps};

// 기대하는 색인 경로 집합을 데이터에서 따로 계산한다(구현과 독립)
function expectedIndexPaths() {
  const set = new Set(['/content/']);
  const add = (base, n) => { for (let i = 1; i <= ceilDiv(n); i++) set.add(i === 1 ? base : `${base}page/${i}/`); };
  for (const id of NAV_IDS) {
    add(BASE[id], sections[id].count.value);
    if (SINGLE.includes(id)) continue; // 단일 목록 — 카테고리 색인이 없다(에이전트 업무일지의 ai·apps 는 출처 구분일 뿐)
    for (const g of sections[id].groups) add(`${BASE[id]}${SUBPATH[id]}${g.id}/`, g.items.length);
  }
  return set;
}
const detailOf = (id, it, g) => id === 'column' ? `/content/column/${slugOf(it.url)}/` : id === 'blog' ? `/content/blog/${it.url.split('/').slice(-3, -1).join('/')}/` : id === 'gamenews' ? `/content/game-news/${slugOf(it.url)}/` : id === 'gizmo' ? `/content/gizmo/${slugOf(it.url)}/` : `/content/${id}/${it.slug}/`;
const detailPaths = () => new Set(NAV_IDS.flatMap(id => flat(sections[id]).map(it => detailOf(id, it))));

test('콘텐츠 허브 데이터는 검증을 통과한다', () => assert.deepEqual(validate(D), []));
test('섹션 일곱 개(케인칼럼·블로그·게임 소식·AI 활용 가이드·웹게임·웹 도구·내 앱), 숫자마다 as_of·source, 항목 수 = 개수', () => {
  assert.deepEqual(hub.sections.map(s => s.id), NAV_IDS);
  for (const s of hub.sections) { assert.match(s.count.as_of, /^\d{4}-\d{2}-\d{2}$/, s.id); assert.ok(s.count.source.length > 20, s.id); assert.equal(flat(s).length, s.count.value, s.id); }
  assert.ok(games.count.total >= games.count.value && tools.count.total >= tools.count.value && apps.count.total >= apps.count.value);
  assert.deepEqual(blog.groups.map(g => g.id), ['ai', 'apps'], '블로그에는 게임 글도, 케인칼럼으로 옮겨 간 fiction 글도 없다');
  assert.ok(flat(blog).every(it => /\/ko\/(ai|apps)\//.test(it.url)));
  assert.equal(column.groups.length, 1, '케인칼럼은 서브카테고리 없는 단일 목록');
  assert.ok(flat(column).every(it => it.url.includes('/ko/fiction/')), '케인칼럼 원본은 블로그 fiction 폴더');
  for (const it of flat(gizmo)) assert.ok(it.summary.length >= 30, it.url);
});
test('색인 페이지 집합이 데이터에서 계산한 기대값과 정확히 같다(쪽 수 정합)', () => {
  const idx = new Set(contentFiles.map(pathOf)), det = detailPaths();
  const expected = expectedIndexPaths();
  assert.deepEqual([...idx].filter(p => !det.has(p)).sort(), [...expected].sort());
  assert.deepEqual([...idx].filter(p => det.has(p)).sort(), [...det].sort());
  assert.equal(contentFiles.length, expected.size + det.size);
});
test('경로 충돌이 없다: 상세 slug·분류 id 가 쪽·분류 경로 이름과 겹치지 않고, 출력 경로는 모두 유일하다', () => {
  for (const it of flat(blog)) assert.notEqual(slugOf(it.url), 'page');
  for (const it of flat(column)) assert.notEqual(slugOf(it.url), 'page');
  const newsSlugs = new Set(flat(news).map(it => slugOf(it.url)));
  for (const g of news.groups) { assert.ok(!newsSlugs.has(g.id) && g.id !== 'page', `game id ${g.id}`); }
  assert.ok(!newsSlugs.has('page'));
  for (const it of flat(gizmo)) assert.ok(!['page', 'purpose'].includes(slugOf(it.url)), slugOf(it.url));
  for (const it of flat(games)) assert.ok(!['page', 'genre'].includes(it.slug), it.slug);
  for (const it of flat(tools)) assert.ok(!['page', 'category'].includes(it.slug), it.slug);
  for (const it of flat(apps)) assert.ok(!['page', 'category'].includes(it.slug), it.slug);
  for (const g of apps.groups) assert.ok(!['page', 'category'].includes(g.id) && !flat(apps).some(it => it.slug === g.id), g.id);
  // /content/blog/apps/(앱 제작·심사 글)와 /content/apps/(내 앱)는 다른 경로다 — 어떤 출력 경로도 다른 쪽 아래에 있지 않다
  const blogApps = contentFiles.map(pathOf).filter(p => p.startsWith('/content/blog/apps/')), myApps = contentFiles.map(pathOf).filter(p => p.startsWith('/content/apps/'));
  assert.equal(blogApps.length, flat(blog).filter(it => /\/ko\/apps\//.test(it.url)).length, '/content/blog/apps/ 아래에는 글 상세만 있다(목록 없음)');
  assert.ok(blogApps.length > 0 && myApps.length > 0);
  assert.ok(blogApps.every(p => !p.startsWith('/content/apps/')) && myApps.every(p => !p.startsWith('/content/blog/')));
  const paths = contentFiles.map(pathOf);
  assert.equal(new Set(paths).size, paths.length);
  const det = detailPaths();
  for (const p of expectedIndexPaths()) assert.ok(!det.has(p), 'collision ' + p);
});
test('색인 페이지: 자기 canonical, 쪽당 20건 이하, prev/next 가 서로 맞물린다', () => {
  const bases = NAV_IDS.flatMap(id => [[BASE[id], sections[id].count.value], ...(SINGLE.includes(id) ? [] : sections[id].groups.map(g => [`${BASE[id]}${SUBPATH[id]}${g.id}/`, g.items.length]))]);
  const ITEM = /<li class="(?:hub-row|gcard|tcard)">/g;
  for (const [base, n] of bases) {
    const total = ceilDiv(n);
    for (let i = 1; i <= total; i++) {
      const p = i === 1 ? base : `${base}page/${i}/`, h = out[p.slice(1) + 'index.html'];
      assert.ok(h, p);
      assert.equal(canon(h), SITE + p, p);
      assert.ok((h.match(ITEM) || []).length <= PER_PAGE, p);
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
test('모든 항목이 각 분류 목록의 정확히 한 쪽에 한 번씩, 전체 목록에도 한 번씩 나온다(중복·누락 없음)', () => {
  const rows = h => [...h.matchAll(/<li class="(?:hub-row|gcard|tcard)">(?:<span class="hub-meta[^>]*>[^<]*<\/span>)?<a (?:class="hub-rt" )?href="([^"]*)"|<li class="acard"><div class="acard-top"><a class="acard-main" href="([^"]*)"/g)].map(m => m[1] || m[2]);
  const collect = (base, n) => { const all = []; for (let i = 1; i <= ceilDiv(n); i++) all.push(...rows(out[(i === 1 ? base : `${base}page/${i}/`).slice(1) + 'index.html'])); return all; };
  for (const id of NAV_IDS) {
    const s = sections[id], all = collect(BASE[id], s.count.value), want = flat(s).map(it => detailOf(id, it));
    assert.deepEqual([...all].sort(), [...want].sort(), id + ' 전체 목록');
    if (SINGLE.includes(id)) continue; // 서브카테고리 색인이 없다 — 전체 목록이 곧 글 전부
    const perCat = s.groups.flatMap(g => collect(`${BASE[id]}${SUBPATH[id]}${g.id}/`, g.items.length));
    assert.deepEqual([...perCat].sort(), [...all].sort(), id + ' 분류별 목록 합');
    for (const h of all) assert.ok(out[h.slice(1) + 'index.html'], h);
  }
});
test('랜딩: 섹션 카드 7장(케인칼럼이 첫 장), 각 카드 대표 3건 이하, 개수·기준일 표기, 긴 목록 없음', () => {
  const h = out['content/index.html'];
  const cards = h.match(/<article class="card hub-card">[\s\S]*?<\/article>/g);
  assert.equal(cards.length, NAV_IDS.length);
  cards.forEach((c, i) => { assert.ok((c.match(/<li>/g) || []).length <= 3); assert.match(c, /\d{4}-\d{2}-\d{2}/); assert.ok(c.includes(`href="${BASE[NAV_IDS[i]]}"`), NAV_IDS[i]); });
  assert.doesNotMatch(h, /class="hub-list"/);
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
});
test('보조 내비: 전체 → 케인칼럼 → 에이전트 업무일지 → 게임 소식 → AI 활용 가이드 → 웹게임 → 웹 도구 → 내 앱(개수 표기), 현재 위치 하나만 강조', () => {
  for (const f of contentFiles) {
    const h = out[f], nav = h.match(/<nav class="subnav"[\s\S]*?<\/nav>/);
    assert.ok(nav, f);
    const links = [...nav[0].matchAll(/<a href="([^"]*)"([^>]*)>/g)];
    assert.deepEqual(links.map(m => m[1]), ['/content/', ...NAV_IDS.map(id => BASE[id])], f); // '전체'가 맨 앞, 케인칼럼은 그 바로 뒤
    assert.equal(links.filter(m => m[2].includes('aria-current="page"')).length, 1, f);
    for (const id of NAV_IDS) assert.ok(nav[0].includes(`href="${BASE[id]}"`) && nav[0].includes(`>${sections[id].count.value}</span>`), f + id);
  }
  const labels = out['content/index.html'].match(/<nav class="subnav"[\s\S]*?<\/nav>/)[0];
  for (const l of ['케인칼럼', '에이전트 업무일지', '게임 소식', 'AI 활용 가이드', '웹게임', '웹 도구', '내 앱']) assert.ok(labels.includes(`<span data-lang-ko>${l}</span>`), l);
  assert.ok(labels.includes('Game news') && labels.includes('Kein Column') && labels.includes('Agent work log'));
  assert.ok(!labels.includes('>블로그<'), '옛 이름 블로그가 메뉴에 없다');
  const at = l => labels.indexOf(`<span data-lang-ko>${l}</span>`);
  assert.ok(at('전체') < at('케인칼럼') && at('케인칼럼') < at('에이전트 업무일지') && at('에이전트 업무일지') < at('게임 소식'), '전체 → 케인칼럼 → 에이전트 업무일지 → 게임 소식 순');
  assert.ok(labels.indexOf('<a href="/content/"') < labels.indexOf('<a href="/content/column/"'), '서브 메뉴 첫 항목은 전체');
  assert.ok(labels.lastIndexOf('내 앱') > labels.lastIndexOf('웹 도구'), '내 앱은 서브메뉴 맨 끝');
});
test('에이전트 업무일지: 이름 변경 반영, ai·apps 가 하나의 단일 목록(칩·카테고리 목록 없음), 글 상세 주소 보존', () => {
  const h = out['content/blog/index.html'];
  assert.match(h, /<title>에이전트 업무일지 전체 — 콘텐츠 허브/);
  assert.ok(h.includes('Agent work log') && /<h1[^>]*>[\s\S]*에이전트 업무일지/.test(h));
  assert.doesNotMatch(h, /class="chipbar"/, '서브카테고리 칩 없음');
  assert.deepEqual(blog.groups.map(g => g.id).sort(), ['ai', 'apps'], '데이터는 출처 폴더 둘 — 화면에선 합쳐 보인다');
  assert.equal(blog.count.value, flat(blog).length);
  // 한 목록에 ai·apps 글이 섞여 최신순으로 나온다
  const rowsOf = n => [...out[(n === 1 ? 'content/blog/' : `content/blog/page/${n}/`) + 'index.html'].matchAll(/<li class="hub-row"><span class="hub-meta mono">(\d{4}-\d{2}-\d{2})<\/span><a class="hub-rt" href="([^"]*)"/g)].map(m => [m[1], m[2]]);
  const all = []; for (let n = 1; n <= ceilDiv(blog.count.value); n++) all.push(...rowsOf(n));
  assert.equal(all.length, blog.count.value);
  assert.deepEqual(all.map(r => r[0]), [...all.map(r => r[0])].sort().reverse(), '최신순');
  assert.ok(all.some(r => r[1].startsWith('/content/blog/ai/')) && all.some(r => r[1].startsWith('/content/blog/apps/')), 'ai·apps 글이 한 목록에 섞여 있다');
  for (const f of ['content/blog/ai/index.html', 'content/blog/apps/index.html', 'content/blog/ai/page/2/index.html', 'content/blog/apps/page/2/index.html']) assert.ok(!out[f], '사라진 카테고리 목록: ' + f);
  // 글 상세: 주소는 그대로, 브레드크럼은 홈 > 콘텐츠 허브 > 에이전트 업무일지 > 글, 자기 canonical
  const d = flat(blog)[0], dp = `content/blog/${d.url.split('/').slice(-3, -1).join('/')}/index.html`;
  assert.ok(out[dp], dp); assert.equal(canon(out[dp]), SITE + pathOf(dp));
  assert.match(out[dp], /에이전트 업무일지/);
  assert.doesNotMatch(out[dp], /href="\/content\/blog\/(ai|apps)\/"/, '상세에서 카테고리 목록으로 가는 링크 없음');
  // 옛 이름이 화면 문구·메타·JSON-LD 어디에도 없다(글 본문·제목 속 문장은 고치지 않는다)
  for (const f of contentFiles) {
    const hh = out[f], chrome = hh.replace(/<div class="detail-body">[\s\S]*?<\/div>\s*<\/article>/, '').replace(/<li class="hub-row">[\s\S]*?<\/li>/g, '').replace(/<h1[\s\S]*?<\/h1>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(chrome.replace(/AI 사용기:/g, ''), /AI 사용기|에이전트 작업 회고|AI field notes|>블로그<|Journal/, f);
    for (const ld of hh.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) for (const x of JSON.parse(ld[1])['@graph'].filter(x => x['@type'] === 'BreadcrumbList' || x['@id']?.endsWith('#list-sections'))) assert.doesNotMatch(JSON.stringify(x.itemListElement.slice(0, x['@type'] === 'BreadcrumbList' && /\/content\/(column|blog\/(ai|apps)|game-news|gizmo|games|tools|apps)\/[\w-]+\//.test(f.replace('content/', '/content/')) ? -1 : undefined).map(e => e.name)), /블로그|Journal/, f + ' JSON-LD');
  }
  assert.doesNotMatch(read('docs/CONTENT_HUB_CHECKER.md'), /AI 사용기|에이전트 작업 회고/);
  assert.match(blog.groups.find(g => g.id === 'ai').blurb.ko, /기록한 일지/);
});
test('게임 소식: 블로그와 분리됐고(옛 경로 없음) 모든 글이 정확히 한 게임 서브카테고리에 속한다 — 게임별 개수표', () => {
  assert.ok(!contentFiles.some(f => f.startsWith('content/blog/games/')));
  assert.ok(!fs.existsSync('content/blog/games') && !fs.existsSync('content-src/blog/games'));
  const slugs = flat(news).map(i => slugOf(i.url));
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(news.groups.reduce((a, g) => a + g.items.length, 0), news.count.value);
  for (const g of news.groups) assert.equal(g.total, g.items.length);
  assert.deepEqual(news.groups.map(g => g.id), ['nikke', 'limbus', 'nte', 'zzz', 'wuwa', 'ananta', 'my-games', 'etc']);
  const idx = out['content/game-news/index.html'];
  for (const g of news.groups) assert.ok(idx.includes(`href="/content/game-news/${g.id}/"`) && idx.includes(`>${g.total}</span>`), g.id);
  // 글 본문 속 옛 게임 경로 링크는 새 경로로 바뀐다
  for (const [f, h] of Object.entries(out).filter(([f]) => f.startsWith('content/'))) assert.doesNotMatch(h, /href="\/content\/blog\/games\//, f);
});
test('케인칼럼: 블로그에서 독립한 단일 목록 — 옛 경로·옛 스냅샷 없음, 단일 목록(칩 없음), 상세 주소·브레드크럼, 본문 속 옛 주소 링크가 새 주소로', () => {
  assert.ok(!contentFiles.some(f => f.startsWith('content/blog/fiction/')));
  assert.ok(!fs.existsSync('content/blog/fiction') && !fs.existsSync('content-src/blog/fiction'));
  assert.ok(fs.readdirSync('content-src/column').length === column.count.value);
  const list = out['content/column/index.html'];
  assert.ok(list && !list.includes('class="chipbar"'), '서브카테고리 칩이 없다');
  const colFiles = contentFiles.filter(f => f.startsWith('content/column/')).sort();
  assert.deepEqual(colFiles, ['content/column/index.html', ...flat(column).map(i => `content/column/${slugOf(i.url)}/index.html`)].sort(), '칼럼 아래에는 색인 하나와 상세뿐');
  const dates = flat(column).map(i => i.date); // 목록은 최신순
  const order = [...list.matchAll(/<li class="hub-row"><span class="hub-meta mono">([^<]*)<\/span>/g)].map(m => m[1]);
  assert.deepEqual(order, [...dates].sort().reverse());
  for (const it of flat(column)) {
    const p = `/content/column/${slugOf(it.url)}/`, h = out[p.slice(1) + 'index.html'];
    assert.ok(h.includes('케인칼럼') && h.includes('Kein Column'), p);
    const bc = ldOf(h).find(x => x['@type'] === 'BreadcrumbList').itemListElement.map(x => x.name);
    assert.deepEqual(bc, ['홈', '콘텐츠 허브', '케인칼럼', it.title], p);
    assert.ok(list.includes(`href="${p}"`), p);
    assert.doesNotMatch(h, /href="\/content\/blog\/fiction\/|href="\/ko\/fiction\//, p);
  }
  for (const [f, h] of Object.entries(out).filter(([f]) => f.startsWith('content/'))) assert.doesNotMatch(h, /href="\/content\/blog\/fiction\//, f);
  // 같이 읽을 글 같은 본문 속 링크: 칼럼끼리는 새 주소로 이어진다
  const aside = out[`content/column/${slugOf(flat(column)[0].url)}/index.html`].match(/<aside>[\s\S]*?<\/aside>/);
  if (aside) for (const m of aside[0].matchAll(/href="([^"]*)"/g)) assert.match(m[1], /^\/content\/column\/[\w-]+\/$/);
});
test('옛→새 경로 매핑(data/content-redirects.json): 정합, 모든 to 가 실제 페이지, 모든 옛 글이 새 경로로 대체된다', () => {
  const r = JSON.parse(read('data/content-redirects.json')).redirects;
  const froms = r.map(x => x.from); assert.equal(new Set(froms).size, froms.length);
  for (const x of r) { assert.equal(x.status, 301); assert.ok(/^\/content\/blog\/(games|fiction|ai|apps)\//.test(x.from), x.from); assert.ok(out[x.to.slice(1) + 'index.html'], x.to); assert.ok(!out[x.from.slice(1) + 'index.html'], '옛 경로가 아직 있다: ' + x.from); }
  const wantPosts = flat(news).map(i => `/content/blog/games/${slugOf(i.url)}/`);
  for (const f of wantPosts) assert.ok(froms.includes(f), f);
  assert.ok(froms.includes('/content/blog/games/'));
  assert.equal(froms.filter(f => f.startsWith('/content/blog/games/') && /\/page\/\d+\/$/.test(f)).length, ceilDiv(news.count.value) - 1);
  // 옛 '이야기'(blog/fiction) → 케인칼럼(/content/column/): 글마다 + 색인 + 쪽
  for (const i of flat(column)) assert.deepEqual(r.find(x => x.from === `/content/blog/fiction/${slugOf(i.url)}/`)?.to, `/content/column/${slugOf(i.url)}/`);
  assert.equal(r.find(x => x.from === '/content/blog/fiction/')?.to, '/content/column/');
  // 사라진 에이전트 업무일지 카테고리 목록(/content/blog/ai/·apps/ + 쪽) → 단일 목록 /content/blog/
  const nCat = c => flat(blog).filter(it => it.url.includes(`/ko/${c}/`)).length;
  for (const c of ['ai', 'apps']) {
    assert.equal(r.find(x => x.from === `/content/blog/${c}/`)?.to, '/content/blog/', c);
    for (let n = 2; n <= ceilDiv(nCat(c)); n++) assert.equal(r.find(x => x.from === `/content/blog/${c}/page/${n}/`)?.to, '/content/blog/', `${c} ${n}쪽`);
  }
  assert.equal(r.filter(x => /^\/content\/blog\/(ai|apps)\//.test(x.from)).length, 2 + ceilDiv(nCat('ai')) - 1 + ceilDiv(nCat('apps')) - 1, '글 상세는 옮기지 않는다');
  assert.equal(r.length, (news.count.value + 1 + ceilDiv(news.count.value) - 1) + (column.count.value + 1 + ceilDiv(column.count.value) - 1) + 2 + ceilDiv(nCat('ai')) - 1 + ceilDiv(nCat('apps')) - 1);
});
const ldOf = h => JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const MAIN = {Article: 1, VideoGame: 1, SoftwareApplication: 1, MobileApplication: 1};
test('상세 페이지: canonical 은 자기 주소, 원문 링크·표기·원문 연결 JSON-LD 가 없다, 종류별 구조화 데이터', () => {
  const kindOf = p => p.split('/')[2];
  const TYPE = {column: 'Article', blog: 'Article', 'game-news': 'Article', gizmo: 'Article', games: 'VideoGame', tools: 'SoftwareApplication', apps: 'MobileApplication'};
  for (const p of detailPaths()) {
    const h = out[p.slice(1) + 'index.html'];
    assert.equal(canon(h), SITE + p, p);
    assert.ok(h.includes(`<meta property="og:url" content="${SITE + p}">`), p);
    assert.doesNotMatch(h, /isBasedOn|sameAs|detail-src|class="detail-note"/, p);
    const g = ldOf(h), main = g.find(x => MAIN[x['@type']]);
    assert.equal(main['@type'], TYPE[kindOf(p)], p);
    assert.equal(main.mainEntityOfPage['@id'], SITE + p, p); assert.equal(main.url, SITE + p, p);
    assert.deepEqual(main.author, {'@id': `${SITE}/#person`}); assert.equal(g.find(x => x['@type'] === 'Person').name, '김진완');
    if (main['@type'] === 'Article' && kindOf(p) !== 'gizmo') assert.ok(main.articleSection, p);
    if (main['@type'] !== 'Article') { assert.match(main.image, /^https:\/\/kimjinwan\.com\/assets\/content\/(?:(?:games|tools)\/[\w-]+-hero|apps\/[\w-]+-icon)\.webp$/, p); assert.ok(fs.existsSync(main.image.replace(SITE + '/', '')), p); }
    const bc = g.find(x => x['@type'] === 'BreadcrumbList').itemListElement;
    assert.ok(bc.length >= 4 && bc[0].name === '홈' && bc[1].name === '콘텐츠 허브' && bc.at(-1).item === SITE + p, p);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, p);
  }
});
test('/content/ 아래 어떤 HTML 에도 블로그 원문 링크(blog.kimjinwan.com/ko/…)·원문 표기 UI 가 없다(이미지 src 제외)', () => {
  for (const f of contentFiles) {
    const h = noCode(out[f]);
    for (const m of h.matchAll(/href="(https?:\/\/[^"]*)"/g)) assert.doesNotMatch(m[1], /blog\.kimjinwan\.com\/ko\//, f);
    assert.doesNotMatch(h, /data-lang-en>Original</, f);
    assert.doesNotMatch((h.match(/\s(?:class|id|aria-label)="[^"]*"/g) || []).join(''), /사본|미러|mirror/i, f + ' 마크업(클래스·속성)');
  }
  for (const f of ['src/content.html', 'src/content-list.html', 'src/detail.html', 'scripts/lib/hub.mjs', 'scripts/lib/render.mjs']) assert.doesNotMatch(read(f), /원문|사본|미러/, f);
});
test('웹게임·웹 도구 가시 텍스트에 원문·기즈모가 없고, 이용 버튼은 정해진 형식의 새 창 링크다', () => {
  const vis = h => { const x = h.replace(/<script[\s\S]*?<\/script>/g, ''); return text(x) + ' ' + [...x.matchAll(/\s(?:alt|aria-label|title|content)="([^"]*)"/g)].map(m => m[1]).join(' '); };
  for (const [kind, label, href] of [['games', '게임하러 가기', s => `https://games.kimjinwan.com/play/${s}/`], ['tools', '도구 열기', s => `https://apps.kimjinwan.com/${s}/`]]) {
    for (const it of flat(sections[kind])) {
      const h = out[`content/${kind}/${it.slug}/index.html`];
      assert.doesNotMatch(vis(h).replace(/https?:\/\/\S+/g, ''), /원문|기즈모|Gizmo/i, it.slug);
      const a = h.match(new RegExp(`<a class="btn btn-primary" href="${href(it.slug).replace(/[./]/g, '\\$&')}" target="_blank" rel="noopener noreferrer"><span data-lang-ko>${label}</span>`));
      assert.ok(a, `${it.slug} 이용 버튼`);
      assert.equal((h.match(/class="btn btn-primary"/g) || []).length, 1, it.slug);
    }
    const idx = out[`content/${kind}/index.html`];
    assert.doesNotMatch(vis(idx).replace(/https?:\/\/\S+/g, ''), /원문|기즈모|Gizmo/i, kind + ' 목록');
    const g0 = idx.indexOf('<ul class="hub-grid'); assert.doesNotMatch(idx.slice(g0, idx.indexOf('</ul>', g0)), /target="_blank"/, kind + ' 목록 카드는 허브 상세로 간다');
  }
});
test('웹게임·웹 도구 상세: 필수 섹션·본문 길이 하한·이미지(자체 호스팅, 크기 속성, alt)', () => {
  const MAXCARD = 60 * 1024, MAXHERO = 220 * 1024;
  for (const kind of ['games', 'tools']) for (const it of flat(sections[kind])) {
    const h = out[`content/${kind}/${it.slug}/index.html`], body = h.slice(h.indexOf('<div class="detail-body">'), h.indexOf('</main>'));
    const t = text(body).replace(/\s+/g, ' ');
    assert.ok(t.length >= (kind === 'games' ? 250 : 400), `${kind}/${it.slug}: ${t.length}`);
    assert.match(body, kind === 'games' ? /<h2><span data-lang-ko>게임 정보<\/span>/ : /<h2><span data-lang-ko>쓰는 방법<\/span>/, it.slug);
    const imgs = [...h.slice(h.indexOf('<main')).matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
    assert.ok(imgs.length >= 1, it.slug);
    for (const im of imgs) {
      const src = im.match(/src="([^"]*)"/)[1];
      assert.match(src, new RegExp(`^/assets/content/${kind}/[\\w-]+\\.webp$`), im);
      assert.ok(fs.existsSync(src.slice(1)), src);
      assert.match(im, /\swidth="\d+" height="\d+"/, im); assert.match(im, /\salt="[^"]{4,}"/, im);
      const rec = D.images[kind][it.slug], file = src.split('/').pop();
      assert.ok(file in rec.bytes, file);
      assert.ok(rec.bytes[file] <= (/-hero|-\d\.webp$/.test(file) ? MAXHERO : MAXCARD), `${file} ${rec.bytes[file]}`);
      assert.equal(fs.statSync(src.slice(1)).size, rec.bytes[file], file);
    }
    assert.doesNotMatch(h, /<img[^>]*src="https?:/, it.slug + ' 서브도메인 핫링크 금지');
  }
});
test('웹게임·웹 도구 목록 카드: 이미지·제목·한 줄 소개, 첫 줄 이미지는 즉시 로딩 나머지는 lazy, 카드 전체가 상세 링크', () => {
  for (const [kind, cls] of [['games', 'gcard'], ['tools', 'tcard']]) {
    const h = out[`content/${kind}/index.html`], cards = h.match(new RegExp(`<li class="${cls}">[\\s\\S]*?</li>`, 'g'));
    assert.ok(cards.length >= 15 || kind === 'games');
    cards.forEach((c, i) => {
      assert.equal((c.match(/<a /g) || []).length, 1); assert.match(c, new RegExp(`href="/content/${kind}/[\\w-]+/"`));
      assert.match(c, /<img [^>]*width="640" height="400" alt="[^"]+"/);
      assert.equal(/loading="lazy"/.test(c), i >= 3, `${kind} card ${i}`);
    });
  }
});
test('상세 본문끼리 문장이 겹치지 않는다(템플릿 문장으로 길이를 채우지 않았다)', () => {
  for (const kind of ['games', 'tools']) {
    const sets = new Map();
    for (const it of flat(sections[kind])) {
      const h = out[`content/${kind}/${it.slug}/index.html`], body = h.slice(h.indexOf('<div class="detail-body">'), h.indexOf('</main>'));
      sets.set(it.slug, new Set([...body.matchAll(/<(?:p|li|h3)\b[^>]*>([^<]{12,})<\/(?:p|li|h3)>/g)].map(m => m[1].trim())));
    }
    const count = new Map(); for (const s of sets.values()) for (const x of s) count.set(x, (count.get(x) || 0) + 1);
    let worst = 0, sum = 0;
    for (const [slug, s] of sets) { const dup = [...s].filter(x => count.get(x) > 1).length / Math.max(1, s.size); worst = Math.max(worst, dup); sum += dup; assert.ok(dup <= 0.4, `${kind}/${slug} 중복 문장 ${(dup * 100).toFixed(0)}%`); }
    assert.ok(sum / sets.size <= 0.12, `${kind} 평균 중복률 ${(sum / sets.size * 100).toFixed(1)}%`);
  }
});
test('이미지 용량 예산: 이미지 총량 40MB 이하(게임 편집 원본 게임당 약 0.4MB), 상세 HTML 평균 80KB 이하', () => {
  const files = fs.readdirSync('assets/content', {recursive: true}).filter(f => f.endsWith('.webp'));
  const sizeOf = list => list.reduce((a, f) => a + fs.statSync('assets/content/' + f).size, 0);
  const total = sizeOf(files.filter(f => !f.startsWith('apps/')));
  assert.ok(total <= 40 * 1024 * 1024, `images ${total}`);
  assert.ok(sizeOf(files.filter(f => f.startsWith('apps/'))) <= 3 * 1024 * 1024, '내 앱 이미지 총량 3MB 이하');
  const sizes = contentFiles.map(f => Buffer.byteLength(out[f])); assert.ok(sizes.reduce((a, b) => a + b, 0) / sizes.length <= 80 * 1024);
  const manifestFiles = ['games', 'tools', 'apps'].flatMap(k => Object.entries(D.images[k]).flatMap(([slug, r]) => Object.keys(r.bytes).map(f => `${k}/${f}`)));
  assert.deepEqual(files.sort(), manifestFiles.sort(), 'assets/content 와 images.json 이 일치한다');
});
test('상세 본문 길이 하한(블로그·게임 소식·가이드)과 스크립트 없음', () => {
  const MIN = {blog: 150, 'game-news': 150, gizmo: 250};
  for (const p of detailPaths()) {
    const h = out[p.slice(1) + 'index.html'], kind = p.split('/')[2];
    const body = text(h.slice(h.indexOf('<div class="detail-body">'), h.indexOf('</main>'))).replace(/\s+/g, ' ');
    if (MIN[kind]) assert.ok(body.length >= MIN[kind], `${p}: ${body.length}`);
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
    for (const m of h.matchAll(/<a\b[^>]*href="https:\/\/[^"]*"[^>]*>/g)) assert.match(m[0], /target="_blank"/, f + m[0]);
  }
});
test('사이트맵: 색인·상세 /content/ 페이지 전부(자기 canonical)와 핵심 페이지, 중복 없음', () => {
  const x = read('sitemap.xml'), locs = [...x.matchAll(/<loc>([^<]*)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(m => m[1]);
  assert.equal(new Set(locs).size, locs.length);
  const inMap = new Set(locs.filter(u => u.startsWith(`${SITE}/content/`)).map(u => u.slice(SITE.length)));
  assert.deepEqual([...inMap].sort(), contentFiles.map(pathOf).sort());
  for (const p of ['/', '/works/', '/factories/', '/career/', '/game/']) assert.ok(locs.includes(SITE + p), p);
  assert.equal(x, out['sitemap.xml'], 'sitemap.xml 은 build 산출물이다');
  assert.doesNotMatch(x, /\/content\/blog\/games\//);
  assert.doesNotMatch(x, /\/content\/blog\/fiction\//);
  assert.doesNotMatch(x, /<loc>[^<]*\/content\/blog\/(ai|apps)\/(page\/\d+\/)?<\/loc>/, '사라진 카테고리 목록은 사이트맵에 없다');
  assert.ok(x.includes(`<loc>${SITE}/content/blog/</loc>`));
  for (const i of flat(blog)) assert.ok(x.includes(`<loc>${SITE}/content/blog/${i.url.split('/').slice(-3, -1).join('/')}/</loc>`), i.url);
  for (const i of flat(column)) assert.ok(x.includes(`<loc>${SITE}/content/column/${slugOf(i.url)}/</loc>`), slugOf(i.url));
});
test('직접 쓴 허브 문구(템플릿·렌더러)에 1인칭·이모지·TODO 가 없다(옮겨 온 글은 고치지 않는다)', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  for (const f of ['src/content.html', 'src/content-list.html', 'src/detail.html', 'scripts/lib/render.mjs', 'scripts/lib/hub.mjs']) { const t = read(f); assert.equal(t.match(BAN), null, f); assert.ok(!emoji.test(t), f); assert.ok(!/TODO/.test(t), f); }
});
test('랜딩 JSON-LD 는 섹션 ItemList, 색인 쪽은 CollectionPage + ItemList(쪽당 항목 수와 일치, 주소는 허브 상세)', () => {
  const land = ldOf(out['content/index.html']);
  assert.ok(land.some(x => x['@type'] === 'CollectionPage'));
  const il = land.find(x => x['@type'] === 'ItemList').itemListElement; assert.equal(il.length, NAV_IDS.length);
  assert.equal(il[0].url, `${SITE}/content/column/`, '섹션 목록도 케인칼럼이 첫 항목');
  assert.deepEqual(il.map(x => x.name), ['케인칼럼', '에이전트 업무일지', '게임 소식', 'AI 활용 가이드', '웹게임', '웹 도구', '내 앱'], '메뉴 순서와 같다');
  assert.ok(il.some(x => x.url === `${SITE}/content/game-news/`));
  const g = ldOf(out['content/blog/page/2/index.html']);
  assert.ok(g.some(x => x['@type'] === 'CollectionPage' && x.url === `${SITE}/content/blog/page/2/`));
  const items = g.find(x => x['@type'] === 'ItemList'); assert.equal(items.numberOfItems, PER_PAGE);
  for (const it of items.itemListElement) assert.match(it.url, /^https:\/\/kimjinwan\.com\/content\//);
});
test('빌드는 형제 저장소·네트워크를 읽지 않는다(content-src 스냅샷만 본다), 홈에서 허브로 간다', () => {
  assert.doesNotMatch(read('scripts/build.mjs') + read('scripts/lib/render.mjs') + read('scripts/lib/hub.mjs'), /Projects\/|homedir|fetch\(|https?\.get/);
  assert.ok(read('index.html').includes('href="/content/"'));
});
test('검증 규칙: 요약이 짧거나 호스트가 다르거나 중복이면 잡는다', () => {
  const bad = JSON.parse(JSON.stringify(hub));
  const at = id => bad.sections.find(s => s.id === id);
  at('games').groups[0].items[0].summary = '짧음';
  at('tools').groups[0].items[0].url = 'https://example.com/x/';
  at('gamenews').groups[0].items[1].url = at('gamenews').groups[0].items[0].url;
  at('column').groups[0].items[0].url = 'https://blog.kimjinwan.com/ko/ai/not-a-column/'; // 케인칼럼은 fiction 주소만
  const e = validate({...D, contentHub: bad}).join('\n');
  assert.match(e, /summary needs at least/); assert.match(e, /does not match the tools pattern/); assert.match(e, /does not match the column pattern/); assert.match(e, /duplicate url/);
});

// ── AI 활용 가이드 상세·복사 버튼·이름 ──
test('기즈모 상세: text 항목은 프롬프트 전문을 pre/code 로 싣는다(길이 하한·이스케이프·줄바꿈 유지), web 항목은 전문 없이 써 보기 링크', () => {
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  let nText = 0, nWeb = 0;
  for (const f of fs.readdirSync('content-src/gizmo')) {
    const g = JSON.parse(read('content-src/gizmo/' + f)), h = out[`content/gizmo/${g.slug}/index.html`];
    if (g.kind === 'text') {
      nText++; assert.ok(g.prompt.length >= 100, g.slug);
      const m = h.match(/<pre lang="ko" tabindex="0"><code id="prompt-[\w-]+">([\s\S]*?)<\/code><\/pre>/);
      assert.ok(m, g.slug + ' pre'); assert.equal(unescape(m[1]), g.prompt, g.slug + ' 전문 일치'); assert.doesNotMatch(m[1], /<(?!\/)[a-z]/i, g.slug + ' 이스케이프');
      if (g.prompt.includes('\n')) assert.ok(m[1].includes('\n'), g.slug);
      assert.equal(g.download, `https://gizmo-store.com/tool/${g.slug}/download`, g.slug);
      assert.ok(h.includes(`href="${g.download}" target="_blank" rel="noopener noreferrer">`), g.slug + ' 다운로드 링크');
      assert.match(h, /<span data-lang-ko>다운로드<\/span><span data-lang-en>Download<\/span>/, g.slug);
      assert.match(h, new RegExp(`<button type="button" class="btn btn-primary copy-btn" data-copy-target="prompt-${g.slug}" hidden>`), g.slug + ' 복사 버튼');
      assert.match(h, /<span class="copy-status" role="status" aria-live="polite"><\/span>/, g.slug);
      assert.ok(h.includes('<script src="/js/copy.js" defer></script>'), g.slug + ' 스크립트');
      assert.match(h, /복사하기<\/span><span data-lang-en>Copy</, g.slug);
    } else { nWeb++; assert.doesNotMatch(h, /<pre|copy-btn|copy\.js|data-copy-target/, g.slug); assert.ok(g.toolUrl && h.includes(`href="${g.toolUrl}"`), g.slug); }
    assert.equal(g.url, `https://gizmo-store.com/tool/${g.slug}`, g.slug);
    assert.ok(!h.includes(`href="${g.url}"`), g.slug + ' 보조 보기 버튼은 없다');
    assert.doesNotMatch(h, /에서 보기|View on/, g.slug);
    assert.ok(g.audience && g.result && g.steps.length, g.slug);
    assert.ok(h.includes('<dl class="detail-facts">'), g.slug);
  }
  assert.equal(nText + nWeb, gizmo.count.value); assert.equal(nWeb, 6);
  const gh = [...Object.entries(out)].filter(([f]) => f.startsWith('content/gizmo/') && !f.includes('/page/') && !f.includes('/purpose/') && f !== 'content/gizmo/index.html');
  assert.equal(gh.length, 50); assert.equal(gh.filter(([, h]) => /href="https:\/\/gizmo-store\.com\/tool\/[\w-]+\/download"/.test(h)).length, 44);
  for (const [f, h] of gh) for (const m of h.matchAll(/href="(https:\/\/gizmo-store\.com[^"]*)"/g)) assert.match(m[1], /^https:\/\/gizmo-store\.com\/tool\/[\w-]+\/download$/, f);
  assert.equal(gh.filter(([, h]) => h.includes('/js/copy.js')).length, 44);
});
test('서비스 섹션은 허브에서 빠졌다: 경로·데이터·소스 읽기·사이트맵·내비·문구 어디에도 없다(서비스 소개는 /works/ 가 맡는다)', () => {
  assert.ok(!contentFiles.some(f => f.startsWith('content/services/')));
  assert.ok(!fs.existsSync('content/services') && !fs.existsSync('content-src/services'));
  assert.ok(!hub.sections.some(s => s.id === 'services'));
  assert.doesNotMatch(read('sitemap.xml'), /\/content\/services\//);
  assert.doesNotMatch(read('scripts/build_content_hub.mjs'), /kimjinwan-services|details\.js/);
  for (const f of contentFiles) { const h = out[f]; assert.doesNotMatch(h, /href="\/content\/services\//, f); assert.doesNotMatch(noCode(h.slice(h.indexOf('<nav class="subnav"'), h.indexOf('</nav>', h.indexOf('<nav class="subnav"')))), /서비스|Services/, f + ' 서브 내비'); }
  const land = text(out['content/index.html']);
  assert.doesNotMatch(land, /서비스 소개|서비스 \d+곳/);
  const home = out['index.html'], entry = home.slice(home.indexOf('id="content-hub"'), home.indexOf('id="content-hub"') + 1600);
  assert.doesNotMatch(entry, /서비스 소개|service write-ups/);
  assert.ok(fs.existsSync('works/index.html')); // 서비스 소개는 그대로
});
test('이름 변경: 사용자에게 보이는 곳은 AI 활용 가이드(영어 AI usage guides), URL 은 /content/gizmo/ 유지', () => {
  const nav = out['content/index.html'].match(/<nav class="subnav"[\s\S]*?<\/nav>/)[0];
  assert.ok(nav.includes('<span data-lang-ko>AI 활용 가이드</span><span data-lang-en>AI usage guides</span>'));
  assert.ok(nav.includes('href="/content/gizmo/"'));
  for (const f of contentFiles.filter(f => f.startsWith('content/gizmo/') || f === 'content/index.html')) {
    const h = out[f];
    const head = h.slice(0, h.indexOf('</head>')), chrome = h.slice(h.indexOf('<nav id="nav"'), h.indexOf('<div class="detail-body">') > 0 ? h.indexOf('<div class="detail-body">') : h.length);
    assert.doesNotMatch(head, /기즈모|Gizmo/, f + ' meta/JSON-LD');
  }
  assert.doesNotMatch(read('index.html').slice(read('index.html').indexOf('id="content-hub"'), read('index.html').indexOf('id="content-hub"') + 1600), /기즈모/);
  assert.match(out['content/gizmo/index.html'], /<title>AI 활용 가이드 전체 — 콘텐츠 허브/);
  const lock = JSON.parse(read('scripts/og-cards.lock.json')).content.text;
  assert.doesNotMatch(lock.headline, /서비스|기즈모/); assert.match(lock.headline, /AI 활용 가이드/);
  assert.doesNotMatch(out['content/blog/index.html'], /class="chipbar"/); // 에이전트 업무일지에는 칩이 없다
});

// 허브가 직접 쓴 화면 문구(내비·제목·메타·버튼·소개)에는 '기즈모'·'Gizmo' 가 남지 않는다. 가이드 항목 자체의 설명 본문(API 가 준 글)은 고치지 않는다.
const visible = h => { const x = h.replace(/<script[\s\S]*?<\/script>/g, ''); return (text(x) + ' ' + [...x.matchAll(/\s(?:alt|aria-label|title|content)="([^"]*)"/g)].map(m => m[1]).join(' ')).replace(/https?:\/\/\S+/g, ''); };
test('허브 화면 문구에 기즈모·Gizmo 가 없다(항목 본문 제외, URL 제외)', () => {
  for (const f of contentFiles) {
    let h = out[f];
    h = h.replace(/<div class="detail-body">[\s\S]*?<\/div>\s*<\/article>/, '').replace(/<li class="hub-row">[\s\S]*?<\/li>/g, '');
    assert.doesNotMatch(visible(h), /기즈모|Gizmo/i, f);
  }
  assert.doesNotMatch(visible(out['content/index.html']), /기즈모|Gizmo/i);
  for (const src of ['src/content.html', 'src/content-list.html', 'src/detail.html']) assert.doesNotMatch(read(src), /기즈모|Gizmo/i, src);
});
// ── 복사하기 버튼 ──
import {createRequire} from 'node:module';
const copy = createRequire(import.meta.url)('../js/copy.js');
test('copy.js: clipboard 성공 시 전문 그대로 writeText 로 넘기고 clipboard 를 돌려준다', async () => {
  let got; const r = await copy.copyText('줄1\n줄2', {writeText: async t => { got = t; }}, () => { throw new Error('no fallback'); });
  assert.equal(got, '줄1\n줄2'); assert.equal(r, 'clipboard');
});
test('copy.js: clipboard 거부·동기 예외·부재 → execCommand 대체, 대체도 실패하면 null', async () => {
  let fb = 0; const ok = t => { fb++; assert.equal(t, 'x'); return true; };
  assert.equal(await copy.copyText('x', {writeText: async () => { throw new Error('denied'); }}, ok), 'fallback');
  assert.equal(await copy.copyText('x', {writeText: () => { throw new Error('sync'); }}, ok), 'fallback');
  assert.equal(await copy.copyText('x', undefined, ok), 'fallback');
  assert.equal(await copy.copyText('x', null, ok), 'fallback'); assert.equal(fb, 4);
  assert.equal(await copy.copyText('x', undefined, () => false), null);
  assert.equal(await copy.copyText('x', {writeText: async () => { throw new Error('d'); }}, () => { throw new Error('exec'); }), null);
  assert.deepEqual(Object.keys(copy.MSG), ['ko', 'en']);
  assert.equal(copy.MSG.ko.done, '복사됐어요'); assert.equal(copy.MSG.en.done, 'Copied'); assert.match(copy.MSG.ko.fail, /직접 선택해 복사해 주세요/);
});
test('copy.js 는 인라인 스크립트 없이 외부 파일로만 로드되고, 버튼은 JS 없이는 hidden 이다', () => {
  for (const [f, h] of Object.entries(out).filter(([f]) => f.startsWith('content/gizmo/'))) {
    assert.doesNotMatch(h.slice(h.indexOf('<main'), h.indexOf('</main>')), /<script/, f);
    for (const m of h.matchAll(/<button type="button" class="btn btn-primary copy-btn"[^>]*>/g)) assert.match(m[0], / hidden>/, f);
  }
  assert.doesNotMatch(read('js/copy.js'), /innerHTML|eval\(/);
});
