// tests/authoring.test.mjs — 웹게임 편집 원본(하이브리드) · 점검 CLI(hub_check_game / hub_check_tool) · 금지어·이미지 규칙 · 사이트맵/페이지 수 일치.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildGames, validateAuthoring, imageProblems, readAuthoring, GENRE_IDS, IMG_BUDGET, MIN_BODY, bodyChars} from '../scripts/lib/games_authoring.mjs';
import {parseToolCatalog} from '../scripts/lib/hub_sources.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8'));
const SAMPLE = rd('data/authoring/games/aim-trainer.json');
const clone = o => JSON.parse(JSON.stringify(o));

// ── fixture 만들기 ───────────────────────────────────────────────────────
const tmpdirs = [];
const mk = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-authoring-')); tmpdirs.push(d); return d; };
test.after(() => { for (const d of tmpdirs) fs.rmSync(d, {recursive: true, force: true}); });

const LONG_DESC = '설명이 충분히 긴 퍼즐 게임입니다. 열쇠를 모아 문을 열고 다음 방으로 이동하는 방식으로 진행하며 방마다 규칙이 하나씩 늘어납니다. 막히면 처음부터 다시 시도할 수 있습니다.';
// 허브 루트(편집 원본 + 이미지) + 가짜 games 저장소 + 가짜 홈(소스 추출용 README)
function fixture({games = ['alpha', 'beta'], authored = ['alpha'], images = authored} = {}) {
  const root = mk(), home = mk(), repo = path.join(home, 'Projects/kein-web-games');
  fs.mkdirSync(path.join(root, 'data/authoring/games'), {recursive: true}); fs.mkdirSync(path.join(root, 'assets/content/games'), {recursive: true});
  fs.mkdirSync(path.join(root, 'content-src'), {recursive: true}); fs.mkdirSync(path.join(repo, 'src'), {recursive: true});
  const all = games.map(slug => ({slug, title: slug, titleKo: slug.toUpperCase(), description: LONG_DESC, categories: ['퍼즐', '논리'], tags: [], controls: ['마우스'], orientation: '가로', session: '5분'}));
  fs.writeFileSync(path.join(repo, 'src/games.json'), JSON.stringify(all));
  const manifest = {games: {}, tools: {}};
  for (const slug of games) { // 소스 추출용 README(두 게임 모두 폴백 자격이 있다)
    fs.mkdirSync(path.join(home, 'Projects', slug), {recursive: true});
    fs.writeFileSync(path.join(home, 'Projects', slug, 'README.md'), `# ${slug}\n\n## 조작\n- 마우스로 칸을 눌러 열쇠를 옮긴다\n- 되돌리기 버튼으로 한 수를 취소한다\n\n## 핵심 규칙\n- 같은 색 열쇠를 같은 색 문에 가져가야 한다\n- 열쇠를 모두 쓰기 전에 출구에 도착하면 방이 열린다\n`);
  }
  for (const slug of authored) {
    const a = clone(SAMPLE); a.id = slug; a.images = a.images.map((x, i) => ({...x, src: `${slug}-${i}.png`}));
    fs.writeFileSync(path.join(root, 'data/authoring/games', `${slug}.json`), JSON.stringify(a));
  }
  const putImages = slug => {
    const n = 3, files = [`${slug}.webp`, `${slug}-hero.webp`, `${slug}-1.webp`, `${slug}-2.webp`];
    for (const f of files) fs.writeFileSync(path.join(root, 'assets/content/games', f), Buffer.alloc(2000));
    manifest.games[slug] = {from: JSON.stringify({srcs: [0, 1, 2].map(i => `${slug}-${i}.png`), cardI: 1}), card: [640, 400], hero: [1280, 720], shots: [[1280, 720], [1280, 720]], bytes: {}};
  };
  for (const slug of images) putImages(slug);
  // 폴백 게임도 이미지 매니페스트가 있어야 소개글 자격이 된다(기존 방식)
  for (const slug of games.filter(s => !authored.includes(s))) manifest.games[slug] = {card: [640, 400], hero: [1280, 720], shots: [[1280, 720]], bytes: {}};
  fs.writeFileSync(path.join(root, 'content-src/images.json'), JSON.stringify(manifest));
  return {root, home, repo, all, manifest};
}
const run = (fx, extra = {}) => buildGames({root: fx.root, all: fx.all, asOf: '2026-10-13', images: fx.manifest, home: fx.home, gamesRepo: fx.repo, ...extra});
const bySlug = r => new Map(r.section.groups.flatMap(g => g.items.map(i => [i.slug, i])));

// ── 하이브리드 병합 ──────────────────────────────────────────────────────
test('하이브리드: 편집 원본이 있는 게임은 편집 원본, 없는 게임은 소스 추출 폴백으로 둘 다 실린다', () => {
  const fx = fixture(), r = run(fx);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.section.count.value, 2);
  assert.deepEqual(r.sources, {authored: ['alpha'], legacy: ['beta']});
  const alpha = r.extra.get('content-src/games/alpha.json'), beta = r.extra.get('content-src/games/beta.json');
  assert.ok(alpha.verified && alpha.oneLiner && alpha.controls.pc, '편집 원본 형태');
  assert.ok(!beta.verified && beta.controlsDetail && beta.description, '폴백 형태(기존 필드)');
  assert.equal(bySlug(r).get('alpha').summary, SAMPLE.oneLiner);
  assert.equal(bySlug(r).get('beta').summary, LONG_DESC);
  assert.ok(alpha.title.ko === 'ALPHA' && alpha.description === alpha.oneLiner, '메타·description 이 채워져 메타 태그에 쓰인다');
});
test('하이브리드: 같은 게임이 양쪽(편집 원본 + 소스 추출 가능)에 있으면 편집 원본이 이긴다', () => {
  const fx = fixture({games: ['alpha'], authored: ['alpha']}), r = run(fx);
  assert.deepEqual(r.sources.authored, ['alpha']); assert.equal(r.sources.legacy.length, 0);
  assert.equal(r.extra.get('content-src/games/alpha.json').oneLiner, SAMPLE.oneLiner);
});
test('하이브리드: 편집 원본이 검증에 실패하면 경고와 함께 소스 추출로 되돌아가 게임 수가 줄지 않는다', () => {
  const fx = fixture(), f = path.join(fx.root, 'data/authoring/games/alpha.json');
  const bad = JSON.parse(fs.readFileSync(f, 'utf8')); Object.assign(bad, {about: '짧다', screens: '짧다', oneLiner: '짧다', rules: ['규칙 하나', '규칙 둘'], progress: ['진행'], tips: ['팁 하나', '팁 둘']}); fs.writeFileSync(f, JSON.stringify(bad));
  const r = run(fx);
  assert.equal(r.section.count.value, 2);
  assert.deepEqual(r.sources, {authored: [], legacy: ['alpha', 'beta']});
  assert.match(r.warnings.join('\n'), /alpha: 본문 .*자 < 500자.*소스 추출로 대체/);
  assert.ok(!r.extra.get('content-src/games/alpha.json').verified);
});
test('하이브리드: 편집 원본은 있는데 이미지가 없거나 목록이 바뀌면(매니페스트 from 불일치) 쓰지 않는다', () => {
  let fx = fixture({images: []}), r = run(fx);
  assert.match(r.warnings.join('\n'), /alpha: 이미지 매니페스트 없음/); assert.deepEqual(r.sources.authored, []);
  fx = fixture(); const a = JSON.parse(fs.readFileSync(path.join(fx.root, 'data/authoring/games/alpha.json'), 'utf8')); a.images[2].src = 'alpha-9.png';
  fs.writeFileSync(path.join(fx.root, 'data/authoring/games/alpha.json'), JSON.stringify(a)); r = run(fx);
  assert.match(r.warnings.join('\n'), /편집 원본의 images\[\]\.src·cardIndex 와 다르다/); assert.deepEqual(r.sources.authored, []);
});
test('하이브리드: 깨진 JSON·games.json 에 없는 편집 원본은 경고만 내고 빌드를 멈추지 않는다', () => {
  const fx = fixture();
  fs.writeFileSync(path.join(fx.root, 'data/authoring/games/alpha.json'), '{ 깨짐');
  fs.writeFileSync(path.join(fx.root, 'data/authoring/games/ghost.json'), JSON.stringify({id: 'ghost'}));
  const r = run(fx);
  assert.match(r.warnings.join('\n'), /alpha: JSON 문법 오류/); assert.match(r.warnings.join('\n'), /ghost: games\.json 에 없는 편집 원본/);
  assert.equal(r.section.count.value, 2);
});
test('하이브리드: _progress.json 제외는 편집 원본·소스 추출보다 우선하고 사유가 excluded 에 남는다', () => {
  const fx = fixture();
  fs.writeFileSync(path.join(fx.root, 'data/authoring/games/_progress.json'), JSON.stringify({excluded: [{id: 'beta', reason: '실행해 보니 시작되지 않음', evidence: '콘솔 오류'}]}));
  const r = run(fx);
  assert.deepEqual([...bySlug(r).keys()], ['alpha']);
  assert.deepEqual(r.excluded, [{id: 'beta', reason: '실행해 보니 시작되지 않음', evidence: '콘솔 오류'}]);
});
test('하이브리드: 편집 원본도 소스 사실도 없는 게임은 기존과 같은 사유로 제외된다', () => {
  const fx = fixture({games: ['alpha', 'gamma'], authored: ['alpha']});
  fs.rmSync(path.join(fx.home, 'Projects/gamma'), {recursive: true});
  const r = run(fx);
  assert.equal(r.excluded.length, 1); assert.match(r.excluded[0].reason, /^소스에서 확인되는 사실 부족\(\d+자 — 기준 170자/);
});

// ── 실제 저장소: 15개 보존·17개·페이지/사이트맵 일치 ──────────────────────────
const ORIGINAL_15 = ['clockwork-harbor', 'cloud-sheep-forest-words', 'comet-cafe-rush', 'cosmo-corgi-star-route', 'firefly-signal-school', 'four-sight', 'honeybee-garden-trail', 'luno-rune-vault', 'mandu-house', 'owl-hangul-detective', 'popo-pearl-sort', 'shadow-orbit-explorer', 'signal-tower-guard', 'soda-stack-signal', 'star-scout-survivors'];
const hub = rd('data/content-hub.json'), games = hub.sections.find(s => s.id === 'games');
const flatGames = games.groups.flatMap(g => g.items);
test('실제 허브: 기존 15개가 모두 남고 편집 원본 게임(aim-trainer·arc-eel)이 더해져 17개 이상이다', () => {
  const slugs = new Set(flatGames.map(i => i.slug));
  for (const s of ORIGINAL_15) assert.ok(slugs.has(s), `${s} 가 빠졌다`);
  for (const s of ['aim-trainer', 'arc-eel']) assert.ok(slugs.has(s), s);
  assert.ok(games.count.value >= 17 && games.count.value === flatGames.length);
});
test('실제 허브: 모든 게임에 상세 스냅샷·상세 페이지·이미지 파일·사이트맵 항목이 있다', () => {
  const imgs = rd('content-src/images.json').games, site = fs.readFileSync(path.join(REPO, 'sitemap.xml'), 'utf8');
  for (const it of flatGames) {
    assert.ok(fs.existsSync(path.join(REPO, `content-src/games/${it.slug}.json`)), `${it.slug} 스냅샷`);
    assert.ok(fs.existsSync(path.join(REPO, `content/games/${it.slug}/index.html`)), `${it.slug} 페이지`);
    assert.ok(site.includes(`/content/games/${it.slug}/</loc>`), `${it.slug} 사이트맵`);
    assert.ok(imgs[it.slug], `${it.slug} 이미지 매니페스트`);
    for (const f of [`${it.slug}.webp`, `${it.slug}-hero.webp`]) assert.ok(fs.existsSync(path.join(REPO, 'assets/content/games', f)), f);
  }
  // 상세 폴더 수 = 게임 수(남는 옛 페이지 없음)
  assert.equal(fs.readdirSync(path.join(REPO, 'content/games')).filter(d => fs.existsSync(path.join(REPO, 'content/games', d, 'index.html')) && !['genre', 'page'].includes(d)).length, flatGames.length);
});
test('실제 허브: 사이트맵 URL 수 = 페이지 수(+ 사이트맵에 없는 0), 서브메뉴·랜딩·홈 수치가 게임 수와 일치', () => {
  const site = fs.readFileSync(path.join(REPO, 'sitemap.xml'), 'utf8'), locs = [...site.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const pages = fs.readdirSync(path.join(REPO, 'content'), {recursive: true}).filter(f => f.endsWith('index.html')).map(f => `https://kimjinwan.com/content/${f.slice(0, -'index.html'.length)}`);
  for (const p of pages) assert.ok(locs.includes(p), `${p} 가 사이트맵에 없다`);
  const n = games.count.value;
  assert.match(fs.readFileSync(path.join(REPO, 'content/games/index.html'), 'utf8'), new RegExp(`subnav-n mono">${n}<`));
  assert.match(fs.readFileSync(path.join(REPO, 'content/index.html'), 'utf8'), new RegExp(`웹게임 ${n}개`));
  assert.match(fs.readFileSync(path.join(REPO, 'index.html'), 'utf8'), new RegExp(`웹게임 ${n}개`));
});
test('실제 허브: 편집 원본은 모두 검증·이미지 규칙을 통과하고 상세 페이지가 편집 원본 본문으로 만들어진다', () => {
  const auth = readAuthoring(REPO), imgs = rd('content-src/images.json').games;
  for (const id of ['aim-trainer', 'arc-eel', 'clockwork-harbor']) assert.ok(auth.has(id), `${id} 편집 원본 유지`);
  for (const [id, a] of auth) {
    assert.deepEqual(validateAuthoring(id, a), [], id); assert.deepEqual(imageProblems(REPO, id, a, imgs[id]), [], id);
    const html = fs.readFileSync(path.join(REPO, `content/games/${id}/index.html`), 'utf8');
    assert.ok(html.includes(a.oneLiner.slice(0, 20)) && html.includes('직접 실행해 확인한 내용'), id);
  }
});
test('실제 허브: 모든 편집 원본이 허용 장르이고 웹게임 장르 페이지 수가 장르 수와 같다', () => {
  const all = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Projects/kein-web-games/src/games.json'), 'utf8'));
  for (const id of readAuthoring(REPO).keys()) assert.ok(GENRE_IDS[all.find(g => g.slug === id).categories[0]], id);
  for (const g of games.groups) assert.ok(fs.existsSync(path.join(REPO, `content/games/genre/${g.id}/index.html`)), g.id);
});

// ── 금지어·이미지 규칙(validateAuthoring) ─────────────────────────────────
const errsOf = mut => { const a = clone(SAMPLE); mut(a); return validateAuthoring('aim-trainer', a).join('\n'); };
test('검증: 원본 샘플은 오류 0, 본문 길이 하한을 지킨다', () => { assert.deepEqual(validateAuthoring('aim-trainer', SAMPLE), []); assert.ok(bodyChars(SAMPLE) >= MIN_BODY); });
test('검증: 금지어 — 1인칭·이모지·원문·기즈모·내부 공정 용어(본문과 이미지 설명)', () => {
  assert.match(errsOf(a => { a.about += ' 제가 해 보니 재미있었다.'; }), /1인칭/);
  assert.match(errsOf(a => { a.tips[0] += ' 저는 이렇게 했다'; }), /1인칭/);
  assert.match(errsOf(a => { a.goal += ' 🎮'; }), /이모지/);
  assert.match(errsOf(a => { a.rules[0] += ' 원문 그대로'; }), /원문/);
  assert.match(errsOf(a => { a.images[0].alt += ' 기즈모 화면입니다'; }), /기즈모/);
  for (const w of ['Forge 로 만든', '게이트를 통과', '검증을 마친', '빌드 결과']) assert.match(errsOf(a => { a.about += ` ${w} 게임이다.`; }), /내부 공정 용어/, w);
  assert.match(errsOf(a => { a.images[1].alt = '파이프라인 화면 설명입니다 길게 씁니다'; }), /내부 공정 용어/);
  assert.equal(errsOf(a => { a.verified.method += ' 로컬 빌드를 열었다'; }), '', 'verified 는 화면에 안 나오므로 내부 용어 허용');
});
test('검증: 필수 필드·verified·본문 길이·이미지 장수와 역할·alt', () => {
  assert.match(errsOf(a => { delete a.goal; }), /goal 필수/);
  assert.match(errsOf(a => { a.rules = ['하나']; }), /rules 은 문장 2개/);
  assert.match(errsOf(a => { a.tips = ['a 문장', 'b 문장', 'c 문장', 'd 문장']; }), /tips 는 2~3개/);
  assert.match(errsOf(a => { a.controls = {}; }), /controls/);
  assert.match(errsOf(a => { a.verified.notes = ['하나']; }), /verified/);
  assert.match(errsOf(a => { a.verified.date = '10월 13일'; }), /verified/);
  assert.match(errsOf(a => { a.about = '짧다'; a.screens = '짧다'; a.oneLiner = '짧다'; a.rules = ['규칙 하나', '규칙 둘']; a.progress = ['진행']; a.tips = ['팁 하나', '팁 둘']; }), /본문 \d+자 < 500자/);
  assert.match(errsOf(a => { a.images = a.images.slice(0, 1); }), /images 는 2~4장/);
  assert.match(errsOf(a => { a.images.push(...a.images, a.images[0]); }), /images 는 2~4장/);
  assert.match(errsOf(a => { a.images[1].role = 'title'; a.images[2].role = 'title'; }), /플레이 중\/결과 화면/);
  assert.match(errsOf(a => { a.images[1].alt = '짧음'; }), /alt 12자 이상/);
  assert.match(errsOf(a => { a.images[1].role = 'menu'; }), /role/);
  assert.match(errsOf(a => { a.images[1].src = 'a.jpg'; }), /src/);
  assert.match(errsOf(a => { a.images[2].src = a.images[1].src; }), /중복/);
  assert.match(errsOf(a => { a.cardIndex = 7; }), /cardIndex/);
  assert.match(validateAuthoring('x', SAMPLE).join(), /id 가 파일명과 다르다/);
});
test('이미지 규칙: 크기 예산 초과·파일 없음·카드 크기를 잡는다', () => {
  const fx = fixture({games: ['alpha'], authored: ['alpha']}), a = JSON.parse(fs.readFileSync(path.join(fx.root, 'data/authoring/games/alpha.json'), 'utf8'));
  assert.deepEqual(imageProblems(fx.root, 'alpha', a, fx.manifest.games.alpha), []);
  fs.writeFileSync(path.join(fx.root, 'assets/content/games/alpha.webp'), Buffer.alloc(IMG_BUDGET.card + 1));
  assert.match(imageProblems(fx.root, 'alpha', a, fx.manifest.games.alpha).join(), /alpha\.webp .*KB > 40KB/);
  fs.rmSync(path.join(fx.root, 'assets/content/games/alpha-2.webp'));
  assert.match(imageProblems(fx.root, 'alpha', a, fx.manifest.games.alpha).join(), /alpha-2\.webp 없음/);
});

// ── 점검 CLI ─────────────────────────────────────────────────────────────
const cli = (script, args) => { const r = spawnSync(process.execPath, [path.join(REPO, 'scripts', script), ...args], {encoding: 'utf8'}); return {code: r.status, out: r.stdout, err: r.stderr}; };
const gameCli = (fx, id, extra = []) => cli('hub_check_game.mjs', [id, '--root', fx.root, '--games-repo', fx.repo, ...extra]);
test('hub_check_game: 통과 케이스(exit 0, 체크리스트·커밋 경로 안내)', () => {
  const fx = fixture(), r = gameCli(fx, 'alpha');
  assert.equal(r.code, 0, r.out); assert.match(r.out, /\[통과\] 본문 길이/); assert.match(r.out, /결과: 통과/); assert.match(r.out, /data\/authoring\/games\/alpha\.json/);
  const j = JSON.parse(gameCli(fx, 'alpha', ['--json']).out); assert.equal(j.ok, true); assert.ok(j.checks.some(c => c.label.startsWith('장르') && c.status === 'ok'));
});
test('hub_check_game: 일부러 깨뜨린 케이스 — 항목별 실패와 다음 행동, exit 1', () => {
  const fx = fixture(), f = path.join(fx.root, 'data/authoring/games/alpha.json'), a = JSON.parse(fs.readFileSync(f, 'utf8'));
  a.about = '제가 해 보니 😀 Forge 게이트 원문'; a.screens = '짧다'; a.rules = ['규칙 하나', '규칙 둘']; a.progress = ['진행']; a.tips = ['팁 하나', '팁 둘']; a.verified = {date: '오늘'}; a.images = a.images.slice(0, 1);
  fs.writeFileSync(f, JSON.stringify(a));
  const r = gameCli(fx, 'alpha'); assert.equal(r.code, 1);
  for (const re of [/\[실패\] 본문 길이/, /\[실패\] 금지어/, /\[실패\] verified/, /\[실패\] 이미지 정의/, /다음 행동:/, /1인칭/, /이모지/, /내부 공정 용어/]) assert.match(r.out, re);
  assert.match(r.out, /\[(통과|실패)\] 필수 필드/);
});
test('hub_check_game: 이미지 불일치·크기 초과·허용되지 않은 장르·깨진 JSON', () => {
  let fx = fixture(); fs.writeFileSync(path.join(fx.root, 'assets/content/games/alpha-hero.webp'), Buffer.alloc(IMG_BUDGET.hero + 10));
  let r = gameCli(fx, 'alpha'); assert.equal(r.code, 1); assert.match(r.out, /\[실패\] 이미지 파일·매니페스트 — alpha-hero\.webp/);
  fx = fixture(); const gj = path.join(fx.repo, 'src/games.json'); const list = JSON.parse(fs.readFileSync(gj, 'utf8')); list[0].categories = ['없는장르']; fs.writeFileSync(gj, JSON.stringify(list));
  r = gameCli(fx, 'alpha'); assert.equal(r.code, 1); assert.match(r.out, /\[실패\] 장르 — games\.json 의 첫 카테고리 '없는장르'/);
  fx = fixture(); fs.writeFileSync(path.join(fx.root, 'data/authoring/games/alpha.json'), '{ 깨짐');
  r = gameCli(fx, 'alpha'); assert.equal(r.code, 1); assert.match(r.out, /\[실패\] JSON 문법/);
  fx = fixture({images: []}); r = gameCli(fx, 'alpha'); assert.equal(r.code, 1); assert.match(r.out, /이미지 매니페스트 없음/);
});
test('hub_check_game: 편집 원본이 없으면 제외 예정(exit 1), _progress.json 에 제외를 적으면 제외 확정(exit 0)', () => {
  const fx = fixture(), r = gameCli(fx, 'beta');
  assert.equal(r.code, 1); assert.match(r.out, /제외 예정/); assert.match(r.out, /_progress\.json/); assert.match(r.out, /소스 추출 폴백/);
  fs.writeFileSync(path.join(fx.root, 'data/authoring/games/_progress.json'), JSON.stringify({excluded: [{id: 'beta', reason: '직접 실행했지만 시작 화면 뒤로 진행되지 않아 쓸 사실이 없음', evidence: '콘솔 오류'}]}));
  const r2 = gameCli(fx, 'beta'); assert.equal(r2.code, 0); assert.match(r2.out, /제외 확정/);
});
test('hub_check_game: 사용법 오류는 exit 2, 존재하지 않는 slug 는 games.json 경고', () => {
  assert.equal(cli('hub_check_game.mjs', []).code, 2); assert.equal(cli('hub_check_game.mjs', ['A B']).code, 2); assert.equal(cli('hub_check_game.mjs', ['x', '--bogus']).code, 2);
  const fx = fixture(), r = gameCli(fx, 'nonexistent-game'); assert.equal(r.code, 1); assert.match(r.out, /games\.json 에 없다/);
});
test('hub_check_game: 실제 aim-trainer·arc-eel·clockwork-harbor 가 통과한다', () => {
  for (const id of ['aim-trainer', 'arc-eel', 'clockwork-harbor']) { const r = cli('hub_check_game.mjs', [id]); assert.equal(r.code, 0, r.out); }
});

// 웹 도구 fixture: 가짜 kein-web-tools
function toolsRepo(pages) {
  const dir = mk(); fs.mkdirSync(path.join(dir, 'lib'), {recursive: true});
  const items = Object.keys(pages).map(s => `  {\n    href: '/${s}/',\n    name: '${s} 도구',\n    description: '짧은 설명입니다. 무엇을 하는지 한 줄로 적습니다.',\n    keywords: 'k',\n    icon: 'x',\n    categories: ['업무'],\n  },`).join('\n');
  fs.writeFileSync(path.join(dir, 'lib/tool-catalog.ts'), `export type X = {};\nexport const tools: ToolCatalogItem[] = [\n${items}\n];\n`);
  for (const [s, src] of Object.entries(pages)) if (src !== null) { fs.mkdirSync(path.join(dir, 'app', s), {recursive: true}); fs.writeFileSync(path.join(dir, 'app', s, 'page.tsx'), src); }
  return dir;
}
const RICH = `export default function P() { return (<main><h1>도구</h1><p>숫자를 넣으면 결과를 바로 계산해 보여 줍니다.</p>
<label htmlFor="a">금액을 입력하세요</label><Input id="a" /><label htmlFor="b">기간(개월)을 입력하세요</label><Input id="b" />
<Button>계산하기</Button><Button>결과 복사</Button>
<h2>사용 방법</h2><p>금액과 기간을 입력한 뒤 계산하기를 누르면 이자와 총액이 표로 나옵니다.</p><p>세금은 일반 과세 15.4퍼센트로 가정하며 우대금리는 반영하지 않습니다.</p>
<li>입력한 값은 서버로 전송하지 않고 브라우저 안에서만 계산합니다.</li><li>소수점 이하는 원 단위에서 반올림합니다.</li><li>기간이 길수록 복리 효과가 커지므로 개월 수를 바꿔 가며 결과를 비교해 볼 수 있습니다.</li><li>결과 복사를 누르면 표의 숫자가 클립보드에 담겨 메모장이나 메신저에 붙여 넣을 수 있습니다.</li></main>); }`;
const THIN = `export default function P() { return (<main><h1>도구</h1><p>짧은 안내입니다.</p></main>); }`;
const NOINPUT = `export default function P() { return (<main><h1>도구</h1><p>${'설명이 길게 이어지는 문장입니다. '.repeat(18)}</p></main>); }`;
test('hub_check_tool: 통과(입력·버튼·본문 모두 읽힘)와 미달(분량 부족·출처 없음·카탈로그 없음) 케이스', () => {
  const dir = toolsRepo({rich: RICH, thin: THIN, nopage: null, noinput: NOINPUT});
  const run = (slug, extra = []) => cli('hub_check_tool.mjs', [slug, '--tools-repo', dir, '--root', mk(), ...extra]);
  let r = run('rich'); assert.equal(r.code, 0, r.out); assert.match(r.out, /입력 라벨 — 2개/); assert.match(r.out, /app\/rich\/page\.tsx/); assert.match(r.out, /화면 이미지 — 없음/);
  r = run('thin'); assert.equal(r.code, 1); assert.match(r.out, /\[실패\] 본문 사실 분량\(300자 이상\)/); assert.match(r.out, /입력 라벨 없음/); assert.match(r.out, /다음 행동:/);
  r = run('nopage'); assert.equal(r.code, 1); assert.match(r.out, /\[실패\] 읽은 출처 — app\/nopage\/page\.tsx 가 없다/);
  r = run('missing'); assert.equal(r.code, 1); assert.match(r.out, /tool-catalog\.ts 의 tools 목록에 href '\/missing\/' 항목이 없다/);
  r = run('noinput'); assert.equal(r.code, 0, '본문 문장만으로도 자격은 된다'); assert.match(r.out, /\[주의\] 입력 라벨/);
  const j = JSON.parse(run('rich', ['--json']).out); assert.equal(j.eligible, true); assert.ok(j.counts.inputs === 2 && j.counts.actions === 2 && j.chars >= 300);
  assert.equal(JSON.parse(run('thin', ['--json']).out).eligible, false);
});
test('hub_check_tool: 1인칭·이모지가 실릴 문구에 있으면 실패, 사용법 오류는 exit 2', () => {
  const dir = toolsRepo({bad: RICH.replace('결과를 바로 계산해 보여 줍니다.', '제가 만든 결과를 바로 계산해 보여 줍니다.')});
  const r = cli('hub_check_tool.mjs', ['bad', '--tools-repo', dir, '--root', mk()]); assert.equal(r.code, 1); assert.match(r.out, /\[실패\] 금지어 — 1인칭/);
  assert.equal(cli('hub_check_tool.mjs', []).code, 2);
  assert.equal(cli('hub_check_tool.mjs', ['x', '--tools-repo', '/nonexistent/path']).code, 1);
});
test('hub_check_tool: 허브 빌드와 같은 판정 — 실제 저장소의 제외 도구는 미달, 포함 도구는 통과', () => {
  const ex = rd('content-src/excluded.json').tools[0].id, inc = Object.keys(rd('content-src/images.json').tools)[0];
  assert.equal(cli('hub_check_tool.mjs', [ex]).code, 1); assert.equal(cli('hub_check_tool.mjs', [inc]).code, 0);
});
test('parseToolCatalog: 항목 수가 href 수와 다르면 예외, 이스케이프된 따옴표를 푼다', () => {
  const ok = parseToolCatalog(`export const tools = [\n  {\n    href: '/a/',\n    name: '가\\'나',\n    description: '설명',\n    categories: ['업무'],\n  },\n];`);
  assert.equal(ok.length, 1); assert.equal(ok[0].name, "가'나");
  assert.throws(() => parseToolCatalog(`export const tools = [\n  {\n    href: '/a/',\n    name: 'x',\n    categories: ['업무'],\n  },\n];`), /parse mismatch/);
});
