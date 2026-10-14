// tests/apps.test.mjs — '내 앱'(/content/apps/) 섹션: 편집 원본·스냅샷·이미지·화면·점검 CLI.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadData, buildAll} from '../scripts/build.mjs';
import {PER_PAGE} from '../scripts/lib/hub.mjs';
import {validateApp, imageProblems, readAuthoring, readStore, buildApps, APP_CATEGORIES, MIN_BODY, bodyChars, sentences, bodyText, STATUSES} from '../scripts/lib/apps_authoring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = loadData(), hub = D.contentHub, out = buildAll({write: false});
const apps = hub.sections.find(s => s.id === 'apps'), items = apps.groups.flatMap(g => g.items);
const auth = readAuthoring(ROOT), store = readStore(ROOT);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const text = h => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
const mainOf = h => h.match(/<main[\s\S]*?<\/main>/)[0];
const appFiles = Object.keys(out).filter(f => f.startsWith('content/apps/'));
const detailFiles = items.map(it => `content/apps/${it.slug}/index.html`);
const cli = (args, opts = {}) => spawnSync('node', ['scripts/hub_check_app.mjs', ...args], {cwd: ROOT, encoding: 'utf8', ...opts});

test('내 앱: 섹션은 맨 끝이고 숫자마다 as_of·source, 항목 수 = 개수, 편집 원본 = 허브 항목(제외 사유는 _progress.json)', () => {
  assert.equal(hub.sections.at(-1).id, 'apps');
  assert.ok(apps.count.value >= 40 && apps.count.total >= apps.count.value && apps.count.source.length > 40);
  assert.equal(items.length, apps.count.value);
  assert.deepEqual(items.map(i => i.slug).sort(), [...auth.keys()].sort(), '편집 원본 파일과 허브 항목이 같다');
  const excl = JSON.parse(read('content-src/excluded.json')).apps;
  assert.ok(excl.length >= 10 && excl.every(x => x.id && x.reason.length > 10));
  assert.ok(!excl.some(x => items.some(i => i.slug === x.id)), '제외된 앱이 목록에 있다');
});
test('내 앱: 모든 편집 원본이 검증을 통과한다(필수 필드·본문 400자·금지어·이미지 2~4장+아이콘·상태·스토어 ID 숫자)', () => {
  for (const [slug, a] of auth) {
    assert.deepEqual(validateApp(slug, a, {store: store.apps[String(a.storeId)] || null}), [], slug);
    assert.ok(bodyChars(a) >= MIN_BODY, slug);
    assert.ok(STATUSES.includes(a.status) && /^\d+$/.test(a.storeId));
    assert.deepEqual(imageProblems(ROOT, slug, a, D.images.apps[slug]), [], slug);
  }
});
test('내 앱: 검증 규칙 — 금지어·본문 길이·이미지·상태를 일부러 깨뜨리면 잡는다', () => {
  const base = structuredClone(auth.get('dream-meaning')), st = store.apps[base.storeId];
  const bad = patch => validateApp('dream-meaning', {...structuredClone(base), ...patch}, {store: st}).join('\n');
  assert.match(bad({about: base.about + ' 제가 만들었다.'}), /1인칭/);
  assert.match(bad({about: base.about + ' 기즈모에서 왔다.'}), /원문|기즈모/);
  assert.match(bad({features: [...base.features, '공장 파이프라인으로 만들었다 확인용.']}), /내부 공정/);
  assert.match(bad({about: base.about + ' 😀'}), /이모지/);
  assert.match(bad({about: '짧다'.repeat(60), audience: '짧은 대상 설명입니다 정말로요.', features: ['기능 하나입니다 정말.', '기능 둘입니다 정말요.', '기능 셋입니다 정말요.'], howTo: ['방법 하나입니다 정말.', '방법 둘입니다 정말요.'], notes: ['알아둘 점입니다 정말.'], oneLiner: '한 줄 소개를 짧게 쓴 문장입니다.'}), /본문 \d+자 < 400자/);
  assert.match(bad({images: base.images.slice(0, 2)}), /screen 인 이미지는 2~4장/);
  assert.match(bad({images: base.images.map((x, i) => i ? x : {...x, role: 'screen'})}), /icon 인 이미지가 정확히 1장/);
  assert.match(bad({status: 'done'}), /status/);
  assert.match(bad({storeId: 'abc'}), /storeId/);
  assert.match(bad({category: 'nope'}), /category/);
  assert.match(bad({slug: 'x'}), /slug 가 파일명과 다르다/);
  assert.match(validateApp('dream-meaning', base, {store: null}).join('\n'), /스토어 캐시/); // live 인데 스토어에 없으면 잡힌다
});
test('내 앱: 모든 앱이 정확히 한 분류·한 분류 페이지에 있고 전체 목록에서 정확히 한 쪽에 한 번 나온다(20건 쪽)', () => {
  const cards = h => [...h.matchAll(/<li class="acard"><div class="acard-top"><a class="acard-main" href="([^"]*)"/g)].map(m => m[1]);
  const pages = (base, n) => { const all = []; for (let i = 1; i <= Math.max(1, Math.ceil(n / PER_PAGE)); i++) { const f = (i === 1 ? base : `${base}page/${i}/`).slice(1) + 'index.html'; const c = cards(out[f]); assert.ok(c.length <= PER_PAGE, f); all.push(...c); } return all; };
  const all = pages('/content/apps/', apps.count.value);
  assert.deepEqual([...all].sort(), items.map(i => `/content/apps/${i.slug}/`).sort());
  assert.equal(apps.count.value > PER_PAGE, true, '쪽 나누기가 실제로 일어난다');
  const seen = new Set();
  for (const g of apps.groups) {
    assert.ok(APP_CATEGORIES.some(c => c.id === g.id) && !['page', 'category'].includes(g.id));
    const c = pages(`/content/apps/category/${g.id}/`, g.items.length); assert.equal(c.length, g.items.length);
    for (const p of c) { assert.ok(!seen.has(p), `두 분류에 있다 ${p}`); seen.add(p); }
  }
  assert.equal(seen.size, items.length);
  for (const it of items) assert.equal(auth.get(it.slug).category, apps.groups.find(g => g.items.includes(it)).id);
});
test('내 앱: 목록 카드 = 아이콘 + 이름 + 한 줄 소개 + 분류/상태 배지 + 스토어 버튼 + 스크린샷 스트립(2열 큰 카드)', () => {
  const h = out['content/apps/index.html'];
  assert.match(read('css/style.css'), /\.hub-grid-apps\{grid-template-columns:repeat\(2/);
  assert.match(h, /<ul class="hub-grid hub-grid-apps">/);
  for (const li of h.match(/<li class="acard">[\s\S]*?<\/li>/g)) {
    assert.match(li, /<img class="acard-icon" src="\/assets\/content\/apps\/[\w-]+-icon\.webp" width="256" height="256" alt="[^"]{4,}"/);
    assert.match(li, /<strong class="acard-t" lang="(ko|en)">[^<]+<\/strong><span class="acard-s" lang="ko">[^<]{15,}<\/span>/);
    assert.match(li, /class="chip" lang="ko">[^<]+<\/span><span class="chip chip-status chip-live"/);
    assert.match(li, /<a class="btn btn-ghost acard-store" href="https:\/\/apps\.apple\.com\/kr\/app\/id\d+" target="_blank" rel="noopener noreferrer">/);
    const strip = li.match(/<a class="acard-strip"[^>]*>([\s\S]*?)<\/a>/)[1], imgs = strip.match(/<img [^>]*>/g);
    assert.ok(imgs.length >= 2 && imgs.length <= 4);
    for (const i of imgs) assert.match(i, /src="\/assets\/content\/apps\/[\w-]+-\d\.webp" width="\d+" height="\d+" alt="[^"]{6,}"/);
  }
  assert.doesNotMatch(h, /class="hub-list"|class="gcard"|class="tcard"/, '다른 섹션과 목록 형태가 다르다');
});
test('내 앱: 상세 — 아이콘·한 줄 소개·스토어 버튼·스크린샷 갤러리(2~4장)·소개 섹션·앱 정보, 스토어 링크 형식·새 창', () => {
  for (const f of detailFiles) {
    const h = out[f], slug = f.split('/')[2], a = auth.get(slug);
    assert.match(h, new RegExp(`<img class="app-icon" src="/assets/content/apps/${slug}-icon\\.webp" width="256" height="256" alt="[^"]{4,}"`), f);
    const shots = (h.match(/<div class="app-shots"[\s\S]*?<\/div>/)[0].match(/<img /g) || []).length;
    assert.ok(shots >= 2 && shots <= 4, f); assert.equal(shots, a.images.length - 1, f);
    for (const t of ['이런 앱입니다', '이런 분께 맞습니다', '핵심 기능', '사용 방법', '알아둘 점', '앱 정보']) assert.ok(h.includes(`<h2><span data-lang-ko>${t}</span>`), f + t);
    const buy = [...h.matchAll(/<a class="btn btn-primary" href="([^"]*)" target="_blank" rel="noopener noreferrer">/g)];
    assert.equal(buy.length, 1, f); assert.equal(buy[0][1], `https://apps.apple.com/kr/app/id${a.storeId}`, f);
    assert.ok(h.includes('App Store에서 보기'), f);
    const extLinks = [...h.matchAll(/<a [^>]*href="(https?:\/\/[^"]*)"/g)].map(m => m[1]).filter(u => !u.startsWith('https://kimjinwan.com') && !u.startsWith('https://apps.kimjinwan.com') && !u.startsWith('https://service.kimjinwan.com'));
    assert.deepEqual([...new Set(extLinks)], [buy[0][1]], f + ' 스토어 외 외부 링크 없음');
    assert.match(h, /<dt><span data-lang-ko>번들 ID<\/span>/, f); // 스토어 캐시에서 확인되는 사실
    assert.match(h, /<p class="detail-verified"/);
  }
});
test('내 앱: 상세 본문 한국어 400자 이상, 앱마다 문장이 다르다(문장 단위 자카드 상한), 같은 문장 반복 없음', () => {
  const sets = new Map();
  for (const [slug, a] of auth) {
    const body = text(out[`content/apps/${slug}/index.html`].match(/<div class="detail-body">([\s\S]*?)<\/div>\s*<\/article>/)[0]);
    assert.ok((body.match(/[가-힣]/g) || []).length >= 300, slug);
    assert.ok(bodyChars(a) >= MIN_BODY, slug);
    sets.set(slug, new Set(sentences(a)));
  }
  let worst = {j: 0}; const all = [...sets];
  for (let i = 0; i < all.length; i++) for (let k = i + 1; k < all.length; k++) {
    const [x, sx] = all[i], [y, sy] = all[k]; const inter = [...sx].filter(s => sy.has(s)).length, j = inter / (sx.size + sy.size - inter);
    if (j > worst.j) worst = {j, x, y};
    assert.ok(j <= 0.12, `${x}/${y} 문장 중복 자카드 ${j.toFixed(2)}`);
    const longShared = [...sx].filter(s => sy.has(s) && s.length > 40); assert.ok(longShared.length <= 1, `${x}/${y} 같은 긴 문장 ${longShared}`);
  }
  assert.ok(worst.j <= 0.12);
});
test('내 앱: 허브 가시 텍스트에 금지어(기즈모·원문·공장·게이트·파이프라인·R-G·제가/저는)·이모지가 없다', () => {
  const visible = h => { const x = mainOf(h).replace(/<script[\s\S]*?<\/script>/g, ''); return (text(x) + ' ' + [...x.matchAll(/\s(?:alt|aria-label|title|content)="([^"]*)"/g)].map(m => m[1]).join(' ')).replace(/\s+/g, ' '); };
  for (const f of appFiles) {
    const v = visible(out[f]);
    assert.doesNotMatch(v, /기즈모|Gizmo|원문|공장|게이트|파이프라인|R-G\d|L-G\d|제가|저는|저의|저희/, f);
    assert.doesNotMatch(v, /\p{Extended_Pictographic}/u, f);
  }
});
test('내 앱: 이미지 — 파일·매니페스트·크기 예산·alt·width/height, 아이콘 256 정사각, 서브도메인·스토어 핫링크 없음', () => {
  const man = D.images.apps;
  assert.deepEqual(Object.keys(man).sort(), [...auth.keys()].sort());
  const files = fs.readdirSync('assets/content/apps').sort(), want = Object.values(man).flatMap(r => Object.keys(r.bytes)).sort();
  assert.deepEqual(files, want);
  let total = 0;
  for (const [slug, r] of Object.entries(man)) {
    assert.deepEqual(r.icon, [256, 256]); assert.ok(r.bytes[`${slug}-icon.webp`] <= 15 * 1024, slug);
    assert.ok(r.shots.length >= 2 && r.shots.length <= 4, slug);
    r.shots.forEach((sz, i) => { assert.ok(sz[0] <= 900 && sz[0] > 100 && sz[1] > 100, slug); assert.ok(r.bytes[`${slug}-${i + 1}.webp`] <= 90 * 1024, slug); });
    total += Object.values(r.bytes).reduce((a, b) => a + b, 0);
  }
  assert.ok(total / Object.keys(man).length <= 80 * 1024, '앱당 평균 80KB 이하');
  for (const f of appFiles) {
    const h = out[f];
    for (const m of mainOf(h).matchAll(/<img [^>]*>/g)) { const t = m[0]; assert.match(t, /src="\/assets\/content\/apps\//, f); assert.match(t, /width="\d+" height="\d+"/, f); assert.match(t, /alt="[^"]{4,}"/, f); }
    assert.doesNotMatch(mainOf(h), /mzstatic|https:\/\/[\w.-]*kimjinwan\.com\/assets/, f);
  }
});
test('내 앱: 구조화 데이터 — 상세는 MobileApplication(스토어 주소·가격·버전), 목록은 CollectionPage + ItemList, 랜딩 ItemList(섹션 7개)', () => {
  const ld = h => JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const d = ld(out['content/apps/dream-meaning/index.html']), app = d.find(x => x['@type'] === 'MobileApplication');
  assert.equal(app.operatingSystem, 'iOS'); assert.equal(app.installUrl, 'https://apps.apple.com/kr/app/id6805266362'); assert.equal(app.offers.price, '0');
  assert.equal(app.url, 'https://kimjinwan.com/content/apps/dream-meaning/');
  const l = ld(out['content/apps/index.html']); assert.ok(l.some(x => x['@type'] === 'CollectionPage'));
  assert.equal(l.find(x => x['@type'] === 'ItemList').itemListElement.length, PER_PAGE);
  const land = ld(out['content/index.html']).find(x => x['@type'] === 'ItemList').itemListElement;
  assert.equal(land.length, 7); assert.equal(land.at(-1).url, 'https://kimjinwan.com/content/apps/');
});
test('내 앱: 사이트맵에 첫 색인·분류·상세가 있고 후속 쪽은 제외하며 경로가 겹치지 않는다', () => {
  const sm = out['sitemap.xml'], locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(locs).size, locs.length);
  for (const f of appFiles) assert.equal(locs.includes('https://kimjinwan.com/' + f.replace(/index\.html$/, '')), !/\/page\/\d+\//.test(f), f);
  const mine = appFiles.map(f => '/' + f.replace(/index\.html$/, '')), blogApps = Object.keys(out).filter(f => f.startsWith('content/blog/apps/')).map(f => '/' + f.replace(/index\.html$/, ''));
  assert.ok(blogApps.length > 5);
  assert.equal(mine.filter(p => blogApps.includes(p)).length, 0);
  const pagesOf = n => Math.max(1, Math.ceil(n / PER_PAGE));
  assert.equal(mine.length, pagesOf(items.length) + apps.groups.reduce((n, g) => n + pagesOf(g.items.length), 0) + items.length, '색인 쪽 + 분류 쪽 + 상세');
});
test('내 앱: 서브메뉴 개수·랜딩 카드·홈 문구·공유 카드 수치가 데이터와 일치한다', () => {
  const n = apps.count.value;
  assert.match(out['content/index.html'], new RegExp(`href="/content/apps/"[^>]*>(?:<span data-lang-ko>내 앱</span><span data-lang-en>My apps</span>)<span class="subnav-n mono">${n}</span>`));
  assert.match(out['index.html'], new RegExp(`앱스토어 앱 ${n}개`));
  const card = out['content/index.html'].match(/<article class="card hub-card">(?:(?!<\/article>)[\s\S])*href="\/content\/apps\/"[\s\S]*?<\/article>/)[0];
  assert.ok(card.includes(`<span><span data-lang-ko>${n}개</span>`), '랜딩 카드 개수');
  const lock = JSON.parse(read('scripts/og-cards.lock.json')).content.text;
  assert.match(lock.headline, /앱/);
});
test('내 앱: 상세의 제작·심사 기록 링크는 실제 존재하는 허브 글로 간다', () => {
  let n = 0;
  for (const f of detailFiles) {
    const m = out[f].match(/<a href="(\/content\/blog\/apps\/[\w-]+\/)" lang="ko">제작·심사 기록 읽기<\/a>/);
    if (m) { n++; assert.ok(out[m[1].slice(1) + 'index.html'], m[1]); }
  }
  assert.ok(n >= 10); // 2026-10-14 틀 반복 앱 소개 글을 내려 가이드 링크가 있는 앱이 줄었다(남은 글에만 링크)
});
test('내 앱: 스냅샷 생성기는 현재 산출물과 같다(--check)와 buildApps 는 같은 입력에서 같은 출력', () => {
  const r = spawnSync('node', ['scripts/build_content_apps.mjs', '--check'], {cwd: ROOT, encoding: 'utf8'});
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const blogApps = new Map(hub.sections.find(s => s.id === 'blog').groups.find(g => g.id === 'apps').items.map(i => [i.url.split('/').filter(Boolean).pop(), {title: i.title, path: `/content/blog/apps/${i.url.split('/').filter(Boolean).pop()}/`}]));
  const a = buildApps({root: ROOT, asOf: hub.as_of, images: D.images, store, blogApps}), b = buildApps({root: ROOT, asOf: hub.as_of, images: D.images, store, blogApps});
  assert.deepEqual(a.section, b.section); assert.deepEqual(a.section, apps);
});

// ── 점검 CLI ──
test('hub_check_app: 실제 앱은 통과(exit 0, 체크리스트·커밋 경로 안내), --json 도 같은 결과', () => {
  const r = cli(['dream-meaning']);
  assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /\[통과\] 본문 길이\(400자 이상\)/); assert.match(r.stdout, /결과: 통과/); assert.match(r.stdout, /커밋할 경로: data\/authoring\/apps\/dream-meaning\.json/);
  const j = JSON.parse(cli(['pocket-answer', '--json']).stdout); assert.equal(j.ok, true); assert.ok(j.checks.length >= 8);
});
function tmpRepo(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kj-apps-')); fs.mkdirSync(path.join(dir, 'data/authoring/apps'), {recursive: true}); fs.mkdirSync(path.join(dir, 'content-src'), {recursive: true}); fs.mkdirSync(path.join(dir, 'assets/content/apps'), {recursive: true});
  fs.copyFileSync(path.join(ROOT, 'content-src/apps-store.json'), path.join(dir, 'content-src/apps-store.json')); fs.copyFileSync(path.join(ROOT, 'content-src/images.json'), path.join(dir, 'content-src/images.json'));
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/content/apps')).filter(f => f.startsWith('dream-meaning-'))) fs.copyFileSync(path.join(ROOT, 'assets/content/apps', f), path.join(dir, 'assets/content/apps', f));
  const a = structuredClone(auth.get('dream-meaning')); mutate?.(a, dir);
  fs.writeFileSync(path.join(dir, 'data/authoring/apps/dream-meaning.json'), JSON.stringify(a)); return dir;
}
test('hub_check_app: 일부러 깨뜨린 케이스 — 항목별 실패와 다음 행동, exit 1', () => {
  const dir = tmpRepo(a => { a.about = '짧다 제가 만든 앱이다. 😀'; a.features = ['하나뿐인 기능 문장이다.']; a.images = a.images.slice(0, 2); a.status = 'maybe'; delete a.verified; });
  const r = cli(['dream-meaning', '--root', dir]); fs.rmSync(dir, {recursive: true, force: true});
  assert.equal(r.status, 1); assert.match(r.stdout, /\[실패\] 금지어/); assert.match(r.stdout, /\[실패\] 본문 길이/); assert.match(r.stdout, /\[실패\] verified/); assert.match(r.stdout, /\[실패\] 이미지 정의/); assert.match(r.stdout, /다음 행동:/);
});
test('hub_check_app: 스토어 캐시에 없는 live 앱·이미지 매니페스트 불일치·깨진 JSON을 잡는다', () => {
  let dir = tmpRepo(a => { a.storeId = '9999999999'; }), r = cli(['dream-meaning', '--root', dir]); fs.rmSync(dir, {recursive: true, force: true});
  assert.equal(r.status, 1); assert.match(r.stdout, /\[실패\] 스토어 캐시/);
  dir = tmpRepo(a => { a.images[1].src = 'store:3'; a.images[3].src = 'store:1'; }); r = cli(['dream-meaning', '--root', dir]); fs.rmSync(dir, {recursive: true, force: true});
  assert.equal(r.status, 1); assert.match(r.stdout, /이미지 매니페스트가 편집 원본의 images\[\]\.src 와 다르다/);
  dir = tmpRepo(); fs.writeFileSync(path.join(dir, 'data/authoring/apps/dream-meaning.json'), '{"slug": '); r = cli(['dream-meaning', '--root', dir]); fs.rmSync(dir, {recursive: true, force: true});
  assert.equal(r.status, 1); assert.match(r.stdout, /\[실패\] JSON 문법/);
});
test('hub_check_app: 편집 원본이 없으면 제외 예정(exit 1), _progress.json 에 제외를 적으면 제외 확정(exit 0), 사용법 오류는 exit 2', () => {
  const dir = tmpRepo(); fs.rmSync(path.join(dir, 'data/authoring/apps/dream-meaning.json'));
  let r = cli(['dream-meaning', '--root', dir]); assert.equal(r.status, 1); assert.match(r.stdout, /제외 예정|이 앱은 허브 소개 페이지가 만들어지지 않는다/);
  fs.writeFileSync(path.join(dir, 'data/authoring/apps/_progress.json'), JSON.stringify({excluded: [{id: 'dream-meaning', reason: '쓸 사실이 부족해 제외한다'}]}));
  r = cli(['dream-meaning', '--root', dir]); assert.equal(r.status, 0); assert.match(r.stdout, /제외 확정/); fs.rmSync(dir, {recursive: true, force: true});
  assert.equal(cli([]).status, 2); assert.equal(cli(['Bad_Slug']).status, 2); assert.equal(cli(['x', '--nope']).status, 2);
});
test('hub_check_app: 실제 저장소의 모든 앱이 통과한다(허브 빌드와 같은 판정)', () => {
  for (const slug of auth.keys()) { const r = cli([slug]); assert.equal(r.status, 0, slug + '\n' + r.stdout); }
});
