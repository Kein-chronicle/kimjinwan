// scripts/build_content_hub.mjs — 콘텐츠 허브(/content/) 데이터 스냅샷 생성기. 수동 실행:
//   node scripts/build_content_hub.mjs --as-of 2026-10-13     # data/content-hub.json 을 다시 쓴다
//   node scripts/build_content_hub.mjs --as-of 2026-10-13 --check   # 파일을 쓰지 않고 현재 파일과 같은지만 본다
// 산출: data/content-hub.json(색인) + data/content-redirects.json(옛→새 경로) + content-src/excluded.json(제외 사유) + content-src/{blog,gizmo}/**.json(개별 페이지 본문 스냅샷). 모두 메모리에서 끝까지 만든 뒤에 쓴다 — 어느 단계든 실패하면 기존 산출물은 그대로다.
// 시각을 읽지 않는다: 기준일은 --as-of 로 받고, 같은 입력 저장소 상태면 출력은 바이트까지 같다.
// 읽기만 하는 출처(형제 저장소, 수정 금지):
//   blog     ~/Projects/kein-blog/web/content/ko/{ai,apps,games,fiction}/*.md (frontmatter) + web/dist/ko/<카테고리>/<slug>/ 실존 확인
//   games    ~/Projects/kein-web-games/src/games.json(메타만) + 허브 편집 원본 data/authoring/games/*.json(서술·관찰 메모)
//   tools    ~/Projects/kein-web-tools/lib/tool-catalog.ts
//   gizmo    https://gizmo-store.com/api/v1/items (공개 API, 네트워크 필요 — 실패하면 기존 JSON 을 건드리지 않고 exit 1). 색인엔 제목·한줄설명, 상세엔 설명류 필드와 text 항목의 download 본문 전문
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectTool, toolBodyChars, toolEligible} from './lib/hub_sources.mjs';
import {buildGames} from './lib/games_authoring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const BLOG = path.join(HOME, 'Projects/kein-blog/web');
const GAMES = path.join(HOME, 'Projects/kein-web-games');
const TOOLS = path.join(HOME, 'Projects/kein-web-tools');

const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : undefined; };
const AS_OF = flag('--as-of');
if (!/^\d{4}-\d{2}-\d{2}$/.test(AS_OF || '')) { console.error('usage: node scripts/build_content_hub.mjs --as-of YYYY-MM-DD [--check]'); process.exit(2); }

// 사이트 규칙(tests/site.test.mjs 의 BAN 과 같은 것) + 이모지·TODO 가 든 글은 고쳐 쓰지 않고 건너뛴다.
const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
const EMOJI = /\p{Extended_Pictographic}/u;
const clean = (...texts) => texts.every(t => t && !BAN.test(t) && !EMOJI.test(t) && !/TODO/.test(t));
const oneLine = s => String(s).replace(/\s+/g, ' ').trim();
const firstSentence = s => oneLine(s).split(/(?<=[.!?])\s+/)[0];

// ── 블로그 ─────────────────────────────────────────────────────────────
function frontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"') && v.length > 1) v = v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    else if (v.startsWith("'") && v.endsWith("'") && v.length > 1) v = v.slice(1, -1).replace(/''/g, "'");
    fm[kv[1]] = v;
  }
  return fm;
}
const BLOG_ORIGIN = 'https://blog.kimjinwan.com';
const EXTRA = new Map(); // 쓸 파일(상대경로 → 객체)
// 블로그 카테고리: 이 배열의 순서가 칩·색인·랜딩 나열의 단일 기준이다(전체 → 이야기 → 에이전트 업무일지 → 앱 제작·심사).
const BLOG_CATS = [
  {id: 'fiction', label: {ko: '이야기', en: 'Essays'}, blurb: {ko: 'AI 시대의 일과 놀이에 대한 짧은 글', en: 'Short essays on work and play in the age of AI'}},
  {id: 'ai', label: {ko: '에이전트 업무일지', en: 'Agent work log'}, blurb: {ko: 'AI 에이전트가 자기 업무에서 겪은 실패와 복구, 검증 결과를 직접 기록한 일지', en: 'A log that AI agents kept themselves of the failures, recoveries and verification results from their own work'}},
  {id: 'apps', label: {ko: '앱 제작·심사', en: 'Apps'}, blurb: {ko: '앱을 만들고 심사에 제출하며 남긴 제작·심사 기록', en: 'Records of building apps and submitting them for review'}},
];
// 게임 소식(구 블로그 '게임' 카테고리): frontmatter topic → 게임별 서브카테고리. 모든 글이 정확히 하나에 속한다.
const NEWS_GAMES = [
  {topic: '니케', id: 'nikke', label: {ko: '니케', en: 'NIKKE'}},
  {topic: '림버스 컴퍼니', id: 'limbus', label: {ko: '림버스 컴퍼니', en: 'Limbus Company'}},
  {topic: '이환', id: 'nte', label: {ko: '이환', en: 'Neverness to Everness'}},
  {topic: '젠레스 존 제로', id: 'zzz', label: {ko: '젠레스 존 제로', en: 'Zenless Zone Zero'}},
  {topic: '명조', id: 'wuwa', label: {ko: '명조', en: 'Wuthering Waves'}},
  {topic: '무한대', id: 'ananta', label: {ko: '무한대', en: 'Ananta'}},
  {topic: '직접 만든 게임', id: 'my-games', label: {ko: '내 게임 개발기', en: 'My game devlogs'}},
  {topic: '게임 기록 목차', id: 'etc', label: {ko: '기타', en: 'Other'}},
];
function articleBody(html, where) {
  const i = html.indexOf('<article class="reading"'), j = html.indexOf('</article>');
  if (i < 0 || j < i) throw new Error(`${where}: no <article class="reading"> in dist`);
  let a = html.slice(html.indexOf('>', i) + 1, j);
  a = a.replace(/<a class="back"[^>]*>[\s\S]*?<\/a>/, '')           // '← 전체 글로'
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '')                          // 제목은 허브 페이지가 h1 으로 다시 그린다
    .replace(/<label class="reader-control">[\s\S]*?<\/label>/g, '') // 본문 크기 선택(블로그 JS 용)
    .replace(/<p class="lede">[\s\S]*?<\/p>/, '')                    // 설명은 허브 상단에 따로 둔다
    .replace(/<p class="eyebrow">[\s\S]*?<\/p>/, '')                  // 블로그 쪽 카테고리 이름표 — 허브는 자기 카테고리 이름을 쓴다
    .replace(/\sclass="[^"]*"/g, '').replace(/\sdata-[\w-]+="[^"]*"/g, '');
  if (/<script|<style|<iframe|\son\w+=/i.test(a)) throw new Error(`${where}: unexpected script/style/iframe in article`);
  return a.trim();
}
// 한 카테고리 폴더의 발행 글을 읽는다(본문 포함). 반환: [{slug, title, summary, date, url, body, fm}]
function readPosts(dirName) {
  const dir = path.join(BLOG, 'content/ko', dirName), out = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
    const fm = frontmatter(path.join(dir, f));
    if (!fm || fm.status !== 'published' || fm.approved !== 'true' || !fm.slug) continue;
    const date = (fm.publishedAt || fm.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > AS_OF) continue;
    const dist = path.join(BLOG, 'dist/ko', dirName, fm.slug, 'index.html');
    if (!fs.existsSync(dist)) throw new Error(`published post has no dist page: ${dirName}/${fm.slug} — build kein-blog first`);
    const title = oneLine(fm.title || ''), desc = oneLine(fm.description || '');
    if (!title) throw new Error(`${dirName}/${fm.slug}: empty title`);
    let summary = desc;
    if (summary.length < 40 && fm.takeaway) summary = oneLine(`${desc} ${firstSentence(fm.takeaway)}`);
    if (summary.length < 20) throw new Error(`${dirName}/${fm.slug}: description too short`);
    out.push({slug: fm.slug, title, summary, date, url: `${BLOG_ORIGIN}/ko/${dirName}/${fm.slug}/`, body: articleBody(fs.readFileSync(dist, 'utf8'), `${dirName}/${fm.slug}`), fm});
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
}
const BLOG_SRC = 'kein-blog/web/content/ko/<카테고리>/*.md 중 frontmatter 가 status: published · approved: true 이고 발행일이 기준일 이하인 글 전부(draft·미승인 제외). 본문은 kein-blog/web/dist/ko/<카테고리>/<slug>/index.html 의 <article> 영역';
function blogSection() {
  const groups = []; let total = 0;
  for (const cat of BLOG_CATS) {
    const posts = readPosts(cat.id);
    for (const p of posts) EXTRA.set(`content-src/blog/${cat.id}/${p.slug}.json`, {category: cat.id, slug: p.slug, title: p.title, description: p.summary, date: p.date, url: p.url, body: p.body});
    total += posts.length;
    groups.push({id: cat.id, label: cat.label, blurb: cat.blurb, total: posts.length, url: `${BLOG_ORIGIN}/ko/${cat.id}/`, items: posts.map(p => ({title: p.title, summary: p.summary, date: p.date, url: p.url}))});
  }
  return {id: 'blog', url: `${BLOG_ORIGIN}/ko/`, count: {value: total, as_of: AS_OF, source: `카테고리 ${BLOG_CATS.map(c => c.id).join('·')}: ${BLOG_SRC}`}, groups};
}
const REDIRECTS = [];
function newsSection() {
  const posts = readPosts('games'), byGame = new Map(NEWS_GAMES.map(g => [g.topic, []]));
  for (const p of posts) {
    const topic = oneLine(p.fm.topic || '');
    if (!byGame.has(topic)) throw new Error(`game news ${p.slug}: unknown topic "${topic}" — add it to NEWS_GAMES`);
    byGame.get(topic).push(p);
    EXTRA.set(`content-src/gamenews/${p.slug}.json`, {game: NEWS_GAMES.find(g => g.topic === topic).id, slug: p.slug, title: p.title, description: p.summary, date: p.date, url: p.url, body: p.body});
    REDIRECTS.push([`/content/blog/games/${p.slug}/`, `/content/game-news/${p.slug}/`]);
  }
  const groups = NEWS_GAMES.map(g => ({id: g.id, label: g.label, total: byGame.get(g.topic).length, items: byGame.get(g.topic).map(p => ({title: p.title, summary: p.summary, date: p.date, url: p.url}))})).filter(g => g.total);
  const pages = Math.max(1, Math.ceil(posts.length / 20));
  REDIRECTS.push(['/content/blog/games/', '/content/game-news/']);
  for (let n = 2; n <= pages; n++) REDIRECTS.push([`/content/blog/games/page/${n}/`, `/content/game-news/page/${n}/`]);
  return {id: 'gamenews', url: `${BLOG_ORIGIN}/ko/games/`, count: {value: posts.length, as_of: AS_OF, source: `게임 소식 = 구 블로그 '게임' 카테고리. ${BLOG_SRC}. 게임별 서브카테고리는 frontmatter topic 으로 분류`}, groups};
}

// ── 웹게임 · 웹 도구: 로컬 저장소의 실제 자료에서 소개글을 만든다(사실이 모자라면 제외) ──
const TOOL_IDS = {'이미지': ['image', 'Image'], PDF: ['pdf', 'PDF'], QR: ['qr', 'QR'], '게임': ['game', 'Games & random'], '생활·학습': ['life-study', 'Life & study'], '업무': ['work', 'Work']};
const EXCLUDED = {games: [], tools: []};
// 허브 화면에는 '원문' 표기를 쓰지 않는다 — 소스 문구 속 일반 낱말 '원문'은 같은 뜻의 '원본'으로 바꿔 싣는다.
const nw = v => (typeof v === 'string' ? v.replace(/원문/g, '원본') : Array.isArray(v) ? v.map(nw) : v);
const IMAGES = fs.existsSync(path.join(ROOT, 'content-src/images.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'content-src/images.json'), 'utf8')) : {games: {}, tools: {}};
// 웹게임: 소개는 허브 편집 원본(data/authoring/games/<id>.json)이 SSOT 이다 — games.json 은 메타(장르·시간·조작 라벨)만 준다. 소스 문서에서 사실을 뽑지 않는다.
function gamesSection() {
  const all = JSON.parse(fs.readFileSync(path.join(GAMES, 'src/games.json'), 'utf8')).filter(g => !g.legacy).sort((a, b) => a.slug.localeCompare(b.slug));
  const r = buildGames({root: ROOT, all, asOf: AS_OF, images: IMAGES, pendingOk: argv.includes('--allow-pending')});
  if (r.errors.length) throw new Error('games authoring:\n  ' + r.errors.join('\n  '));
  for (const [k, v] of r.extra) EXTRA.set(k, v);
  EXCLUDED.games.push(...r.excluded);
  return r.section;
}
function toolsSection(blogApps) {
  const src = fs.readFileSync(path.join(TOOLS, 'lib/tool-catalog.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const tools'));
  const entries = [...body.matchAll(/\{\s*href:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*description:\s*'((?:[^'\\]|\\.)*)',[\s\S]*?categories:\s*\[([^\]]*)\]/g)].map(m => ({
    href: m[1], name: m[2].replace(/\\'/g, "'"), description: m[3].replace(/\\'/g, "'"), categories: [...m[4].matchAll(/'([^']+)'/g)].map(x => x[1])}));
  const hrefCount = (body.match(/^\s+href:/gm) || []).length;
  if (entries.length !== hrefCount) throw new Error(`tool catalog parse mismatch: ${entries.length} parsed vs ${hrefCount} href`);
  const groups = new Map(); let n = 0;
  for (const e of entries) {
    const slug = e.href.replace(/\//g, ''), f = collectTool(TOOLS, e);
    if (!toolEligible(e, f)) { EXCLUDED.tools.push({id: slug, reason: `소스(page.tsx)에서 확인되는 사실 부족(${toolBodyChars(e, f)}자 < 300)`}); continue; }
    if (!IMAGES.tools[slug]) { EXCLUDED.tools.push({id: slug, reason: '이미지 없음(라이브 화면 캡처 실패 또는 미실행)'}); continue; }
    const cat = e.categories[0]; if (!TOOL_IDS[cat]) throw new Error(`tool ${slug}: unknown category ${cat}`);
    const guide = blogApps.get(slug);
    const fact = {slug, title: nw(e.name), description: nw(e.description), categories: e.categories, intro: nw(f.intro), does: nw(f.does), inputs: f.inputs, actions: f.actions, blocks: f.blocks, ...(guide ? {guide} : {})};
    for (const k of Object.keys(fact)) if (fact[k] === undefined) delete fact[k];
    EXTRA.set(`content-src/tools/${slug}.json`, fact);
    const [gid, gen] = TOOL_IDS[cat];
    if (!groups.has(gid)) groups.set(gid, {id: gid, label: {ko: cat, en: gen}, items: []});
    groups.get(gid).items.push({slug, title: nw(e.name), summary: nw(e.description), category: cat, url: `https://apps.kimjinwan.com${e.href}`}); n++;
  }
  return {id: 'tools', url: 'https://apps.kimjinwan.com/', count: {value: n, total: entries.length, as_of: AS_OF, source: `kein-web-tools/lib/tool-catalog.ts 의 도구 ${entries.length}개 중 소개글에 쓸 사실이 확인되는 ${n}개. 사실 출처: 카탈로그 설명 + app/<slug>/page.tsx 의 정적 한국어 문구(머리말·입력 항목·버튼·안내 문단). 화면 이미지는 content-src/images.json`},
    groups: [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.id.localeCompare(b.id))};
}

// ── AI 활용 가이드 = 기즈모 스토어(공개 API) ───────────────────────────────────────────
const GIZMO_PURPOSE = [
  ['research', {ko: '조사·리서치', en: 'Research'}], ['career', {ko: '업무·커리어', en: 'Work & career'}], ['creative', {ko: '창작', en: 'Creative'}],
  ['dev', {ko: '개발', en: 'Development'}], ['writing', {ko: '글쓰기', en: 'Writing'}]];
async function getJson(url) {
  let res;
  try { res = await fetch(url, {signal: AbortSignal.timeout(30000)}); } catch (e) { throw new Error(`gizmo API unreachable (${url}): ${e.message}`); }
  if (!res.ok) throw new Error(`gizmo API HTTP ${res.status} (${url})`);
  return res.json();
}
async function gizmoSection() {
  const items = (await getJson('https://gizmo-store.com/api/v1/items')).items;
  if (!Array.isArray(items) || items.length < 10) throw new Error('gizmo API returned an unexpected payload');
  const known = new Set(GIZMO_PURPOSE.map(x => x[0]));
  const unknown = items.filter(i => !known.has(i.purpose));
  if (unknown.length) throw new Error(`gizmo: unknown purpose ${[...new Set(unknown.map(i => i.purpose))]} — add it to GIZMO_PURPOSE`);
  const sorted = [...items].sort((a, b) => a.slug.localeCompare(b.slug));
  const details = new Map();
  for (let i = 0; i < sorted.length; i += 8) // 8개씩 — 서버에 부담을 주지 않는다
    await Promise.all(sorted.slice(i, i + 8).map(async it => details.set(it.slug, await getJson(`https://gizmo-store.com/api/v1/items/${encodeURIComponent(it.slug)}`))));
  const groups = [];
  for (const [id, label] of GIZMO_PURPOSE) {
    const list = [];
    for (const i of sorted.filter(i => i.purpose === id)) {
      const d = details.get(i.slug);
      if (!/^https:\/\/gizmo-store\.com\/tool\/[\w-]+$/.test(i.page || '') || !oneLine(i.title || '') || oneLine(i.tagline || '').length < 15) throw new Error(`gizmo: bad item ${i.slug}`);
      if (d.slug !== i.slug || !d.description) throw new Error(`gizmo: bad detail ${i.slug}`);
      const pick = v => (typeof v === 'string' && v.trim() ? oneLine(v) : undefined);
      // text 항목은 /tool/<slug>/download 가 프롬프트·스킬 본문 전체(text/plain)를 준다. 줄바꿈을 그대로 보존한다. web 항목은 다운로드가 없다(바이너리는 싣지 않는다).
      let prompt;
      if (i.kind === 'text') {
        let r;
        try { r = await fetch(`${i.page}/download`, {signal: AbortSignal.timeout(30000)}); } catch (e) { throw new Error(`gizmo download unreachable (${i.slug}): ${e.message}`); }
        if (!r.ok || !/^text\/plain/.test(r.headers.get('content-type') || '')) throw new Error(`gizmo download not text/plain (${i.slug}): HTTP ${r.status} ${r.headers.get('content-type')}`);
        prompt = (await r.text()).replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').trimEnd();
        if (prompt.length < 100 || prompt.includes('\u0000')) throw new Error(`gizmo download looks wrong (${i.slug}): ${prompt.length} chars`);
      }
      EXTRA.set(`content-src/gizmo/${i.slug}.json`, {slug: i.slug, kind: i.kind, purpose: id, title: oneLine(i.title), tagline: oneLine(i.tagline), url: i.page, download: i.kind === 'text' ? (typeof i.download === 'string' && /^https:\/\/gizmo-store\.com\/tool\/[\w-]+\/download$/.test(i.download) ? i.download : `${i.page}/download`) : undefined, toolUrl: i.kind === 'web' ? i.url : undefined,
        difficulty: i.difficulty, aiLabel: i.ai_label, hash: i.hash,
        description: pick(d.description), audience: pick(d.audience), result: pick(d.result), steps: Array.isArray(d.steps) ? d.steps.map(oneLine) : [], prompt, trouble: pick(d.trouble)});
      list.push({title: oneLine(i.title), tagline: oneLine(i.tagline), summary: oneLine(`${i.tagline} ${pick(d.audience) || ''}`), url: i.page});
    }
    if (list.length) groups.push({id, label, items: list});
  }
  return {id: 'gizmo', url: 'https://gizmo-store.com/',
    count: {value: items.length, as_of: AS_OF, source: 'https://gizmo-store.com/api/v1/items 응답 items 배열 길이. 개별 페이지 = /api/v1/items/<slug> 상세의 설명류 필드 + text 항목의 /tool/<slug>/download 본문(text/plain, 프롬프트·스킬 전문). web 항목은 다운로드가 없다. 바이너리는 싣지 않는다. 용도별·slug 순'}, groups};
}

const blog = blogSection();
const slugOf = u => u.split('/').filter(Boolean).pop();
const blogApps = new Map(blog.groups.find(g => g.id === 'apps').items.map(i => [slugOf(i.url), {title: i.title, path: `/content/blog/apps/${slugOf(i.url)}/`}]));
const news = newsSection(), gizmo = await gizmoSection();
const out = {as_of: AS_OF, sections: [blog, news, gizmo, gamesSection(), toolsSection(blogApps)]};
const files = new Map([['data/content-hub.json', JSON.stringify(out, null, 1) + '\n']]);
// 옛 경로 → 새 경로 매핑(서버 쪽 301 에 쓴다 — 여기서는 매핑만 남긴다)
files.set('data/content-redirects.json', JSON.stringify({as_of: AS_OF, note: '이미 배포된 /content/blog/games/… 를 게임 소식(/content/game-news/…)으로 옮긴 매핑. nginx 301 용.', redirects: REDIRECTS.sort((a, b) => a[0].localeCompare(b[0])).map(([from, to]) => ({from, to, status: 301}))}, null, 1) + '\n');
files.set('content-src/excluded.json', JSON.stringify({as_of: AS_OF, games: EXCLUDED.games, tools: EXCLUDED.tools}, null, 1) + '\n');
for (const [rel, obj] of [...EXTRA].sort((a, b) => a[0].localeCompare(b[0]))) files.set(rel, JSON.stringify(obj, null, 1) + '\n');
const KEEP = new Set(['content-src/images.json']); // build_content_images.mjs 가 관리하는 파일
const existing = fs.existsSync(path.join(ROOT, 'content-src')) ? fs.readdirSync(path.join(ROOT, 'content-src'), {recursive: true}).filter(f => f.endsWith('.json')).map(f => 'content-src/' + f) : [];
const stale = existing.filter(f => !files.has(f) && !KEEP.has(f));
const same = [...files].every(([rel, t]) => fs.existsSync(path.join(ROOT, rel)) && fs.readFileSync(path.join(ROOT, rel), 'utf8') === t) && !stale.length;
if (argv.includes('--check')) { console.log(same ? `up to date (${files.size} files)` : 'differs from sources'); process.exit(same ? 0 : 1); }
for (const [rel, t] of files) { const dest = path.join(ROOT, rel); fs.mkdirSync(path.dirname(dest), {recursive: true}); fs.writeFileSync(dest, t); }
for (const f of stale) fs.rmSync(path.join(ROOT, f));
for (const d of fs.readdirSync(path.join(ROOT, 'content-src'), {recursive: true}).map(f => path.join(ROOT, 'content-src', f)).filter(d => fs.statSync(d).isDirectory()).sort((a, b) => b.length - a.length)) if (!fs.readdirSync(d).length) fs.rmdirSync(d); // 비어 버린 폴더 정리
const n = s => s.groups.map(g => `${g.id}:${g.items.length}`).join(' ');
console.log(`wrote ${files.size} files (${stale.length} stale removed) —`, out.sections.map(s => `${s.id}(${n(s)}; count ${s.count.value}${s.count.total ? '/' + s.count.total : ''})`).join(' | '));
console.log(`excluded: games ${EXCLUDED.games.length}, tools ${EXCLUDED.tools.length}`);
