// scripts/build_content_hub.mjs — 콘텐츠 허브(/content/) 데이터 스냅샷 생성기. 수동 실행:
//   node scripts/build_content_hub.mjs --as-of 2026-10-13     # data/content-hub.json 을 다시 쓴다
//   node scripts/build_content_hub.mjs --as-of 2026-10-13 --check   # 파일을 쓰지 않고 현재 파일과 같은지만 본다
// 산출: data/content-hub.json(색인) + content-src/{blog,gizmo,services}/**.json(개별 페이지 본문 스냅샷). 모두 메모리에서 끝까지 만든 뒤에 쓴다 — 어느 단계든 실패하면 기존 산출물은 그대로다.
// 시각을 읽지 않는다: 기준일은 --as-of 로 받고, 같은 입력 저장소 상태면 출력은 바이트까지 같다.
// 읽기만 하는 출처(형제 저장소, 수정 금지):
//   blog     ~/Projects/kein-blog/web/content/ko/{ai,apps,games,fiction}/*.md (frontmatter) + web/dist/ko/<카테고리>/<slug>/ 실존 확인
//   services ~/Projects/kimjinwan-services/js/details.js (서비스별 주요 기능·추천 대상)
//   games    ~/Projects/kein-web-games/src/games.json
//   tools    ~/Projects/kein-web-tools/lib/tool-catalog.ts
//   gizmo    https://gizmo-store.com/api/v1/items (공개 API, 네트워크 필요 — 실패하면 기존 JSON 을 건드리지 않고 exit 1). 색인엔 제목·한줄설명, 상세엔 설명류 필드와 text 항목의 download 본문 전문
// 이름·태그라인·URL 은 data/services.json 이 SSOT 라 여기에는 서비스 id 와 읽을거리 본문만 둔다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const BLOG = path.join(HOME, 'Projects/kein-blog/web');
const SERVICES_REPO = path.join(HOME, 'Projects/kimjinwan-services');
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
const BLOG_CATS = [
  {id: 'ai', limit: 10, label: {ko: 'AI 활용', en: 'AI in practice'}, blurb: {ko: 'AI 에이전트로 일하며 겪은 실패와 복구, 도구 사용 기록', en: 'Failures, recoveries and tool notes from working with AI agents'}},
  {id: 'apps', limit: 10, label: {ko: '앱 제작·심사', en: 'Apps'}, blurb: {ko: '앱을 만들고 심사에 제출하며 남긴 제작·심사 기록', en: 'Records of building apps and submitting them for review'}},
  {id: 'games', limit: 10, label: {ko: '게임', en: 'Games'}, blurb: {ko: '플레이 중인 게임의 공식 공지와 분석 글', en: 'Sourced updates and analysis of games I play'}},
  {id: 'fiction', limit: 10, label: {ko: '이야기', en: 'Essays'}, blurb: {ko: 'AI 시대의 일과 놀이에 대한 짧은 글', en: 'Short essays on work and play in the age of AI'}},
];
const BLOG_ORIGIN = 'https://blog.kimjinwan.com';
const EXTRA = new Map(); // 쓸 파일(상대경로 → 객체)
// 블로그 dist 의 <article class="reading"> 안쪽만 뽑아 허브용으로 다듬는다(의존성 없는 문자열 처리).
function articleBody(html, where) {
  const i = html.indexOf('<article class="reading"'), j = html.indexOf('</article>');
  if (i < 0 || j < i) throw new Error(`${where}: no <article class="reading"> in dist`);
  let a = html.slice(html.indexOf('>', i) + 1, j);
  a = a.replace(/<a class="back"[^>]*>[\s\S]*?<\/a>/, '')           // '← 전체 글로'
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '')                          // 제목은 허브 페이지가 h1 으로 다시 그린다
    .replace(/<label class="reader-control">[\s\S]*?<\/label>/g, '') // 본문 크기 선택(블로그 JS 용)
    .replace(/<p class="lede">[\s\S]*?<\/p>/, '')                    // 설명은 허브 상단에 따로 둔다
    .replace(/\sclass="[^"]*"/g, '').replace(/\sdata-[\w-]+="[^"]*"/g, '');
  if (/<script|<style|<iframe|\son\w+=/i.test(a)) throw new Error(`${where}: unexpected script/style/iframe in article`);
  return a.trim();
}
function blogSection() {
  const groups = [];
  let total = 0;
  const posts = [];
  for (const cat of BLOG_CATS) {
    const dir = path.join(BLOG, 'content/ko', cat.id);
    const items = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
      const fm = frontmatter(path.join(dir, f));
      if (!fm || fm.status !== 'published' || fm.approved !== 'true' || !fm.slug) continue;
      const date = (fm.publishedAt || fm.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > AS_OF) continue;
      const dist = path.join(BLOG, 'dist/ko', cat.id, fm.slug, 'index.html');
      if (!fs.existsSync(dist)) throw new Error(`published post has no dist page: ${cat.id}/${fm.slug} — build kein-blog first`);
      const title = oneLine(fm.title || ''), desc = oneLine(fm.description || '');
      if (!title) throw new Error(`${cat.id}/${fm.slug}: empty title`);
      let summary = desc;
      if (summary.length < 40 && fm.takeaway) summary = oneLine(`${desc} ${firstSentence(fm.takeaway)}`);
      if (summary.length < 20) throw new Error(`${cat.id}/${fm.slug}: description too short`);
      const url = `${BLOG_ORIGIN}/ko/${cat.id}/${fm.slug}/`;
      const body = articleBody(fs.readFileSync(dist, 'utf8'), `${cat.id}/${fm.slug}`);
      EXTRA.set(`content-src/blog/${cat.id}/${fm.slug}.json`, {category: cat.id, slug: fm.slug, title, description: summary, date, url, body});
      items.push({title, summary, date, url});
    }
    items.sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
    total += items.length;
    groups.push({id: cat.id, label: cat.label, blurb: cat.blurb, total: items.length, url: `${BLOG_ORIGIN}/ko/${cat.id}/`, items});
  }
  return {
    id: 'blog', url: `${BLOG_ORIGIN}/ko/`,
    count: {value: total, as_of: AS_OF, source: 'kein-blog/web/content/ko/{ai,apps,games,fiction}/*.md 중 frontmatter 가 status: published · approved: true 이고 발행일이 기준일 이하인 글 전부(draft·미승인 제외). 본문은 kein-blog/web/dist/ko/<카테고리>/<slug>/index.html 의 <article> 영역'},
    groups,
  };
}

// ── 서비스 읽을거리 ────────────────────────────────────────────────────
function servicesSection() {
  const services = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/services.json'), 'utf8'));
  const raw = fs.readFileSync(path.join(SERVICES_REPO, 'js/details.js'), 'utf8').trim().replace(/^window\.DETAILS=/, '').replace(/;$/, '');
  const details = JSON.parse(raw);
  const items = [];
  for (const s of services) {
    const d = details[s.id];
    if (!d) throw new Error(`no details for ${s.id}`);
    const text = {};
    for (const lang of ['ko', 'en']) {
      const feats = (d.features || []).slice(0, 2).map(f => `${f.d[lang]}`);
      const aud = (d.audience || [])[0];
      const lead = lang === 'ko' ? '이런 분께 맞습니다: ' : 'A good fit for: ';
      const end = x => (/[.!?]$/.test(x) ? x : x + '.');
      text[lang] = [end(s.summary[lang]), ...feats.map(end), aud ? lead + end(aud[lang]) : ''].filter(Boolean).join(' ');
    }
    if (!clean(text.ko)) throw new Error(`service ${s.id} text violates site rules`);
    const {tags, audience, features, steps, notes, facts} = d;
    EXTRA.set(`content-src/services/${s.id}.json`, {id: s.id, tags, audience, features, steps, notes, facts});
    items.push({id: s.id, text});
  }
  return {id: 'services', count: {value: services.length, as_of: AS_OF, source: 'kimjinwan/data/services.json 의 서비스 수; 읽을거리 본문은 kimjinwan-services/js/details.js 의 요약·주요 기능 2개·추천 대상 첫 항목'}, items};
}

// ── 웹게임 ─────────────────────────────────────────────────────────────
function gamesSection() {
  const all = JSON.parse(fs.readFileSync(path.join(GAMES, 'src/games.json'), 'utf8'));
  const live = all.filter(g => !g.legacy);
  const pool = [...live.filter(g => g.featured).sort((a, b) => a.slug.localeCompare(b.slug)), ...live.filter(g => !g.featured).sort((a, b) => a.slug.localeCompare(b.slug))];
  const items = [];
  for (const g of pool) {
    const bits = [];
    if (g.categories?.length) bits.push(`장르는 ${g.categories.join('·')}입니다.`);
    if (g.controls?.length) bits.push(`조작은 ${g.controls.join('·')}${g.session ? `, 한 판은 ${g.session} 정도입니다.` : '으로 합니다.'}`);
    else if (g.session) bits.push(`한 판은 ${g.session} 정도입니다.`);
    const summary = [oneLine(g.description || ''), ...bits].join(' ').trim();
    if (!g.titleKo || summary.length < 60 || !clean(g.titleKo, summary)) continue;
    items.push({title: {ko: g.titleKo, en: g.title}, summary, url: `https://games.kimjinwan.com/play/${g.slug}/`});
    if (items.length === 12) break;
  }
  return {id: 'games', url: 'https://games.kimjinwan.com/',
    count: {value: all.length, as_of: AS_OF, source: 'kein-web-games/src/games.json 배열 길이(legacy 표시 1개 포함). 대표 12개는 featured 우선, 이후 slug 순; legacy 는 제외'}, items};
}

// ── 웹 도구 ────────────────────────────────────────────────────────────
function toolsSection() {
  const src = fs.readFileSync(path.join(TOOLS, 'lib/tool-catalog.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const tools'));
  const entries = [...body.matchAll(/\{\s*href:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*description:\s*'((?:[^'\\]|\\.)*)',[\s\S]*?categories:\s*\[([^\]]*)\]/g)].map(m => ({
    href: m[1], name: m[2].replace(/\\'/g, "'"), description: m[3].replace(/\\'/g, "'"), categories: [...m[4].matchAll(/'([^']+)'/g)].map(x => x[1])}));
  const hrefCount = (body.match(/^\s+href:/gm) || []).length;
  if (entries.length !== hrefCount) throw new Error(`tool catalog parse mismatch: ${entries.length} parsed vs ${hrefCount} href`);
  // 도구 페이지 머리말의 설명 문단(app/<slug>/page.tsx 의 <h1>…</h1><p>…</p>)을 두 번째 문장으로 쓴다. 없거나 카탈로그 설명과 같으면 그 도구는 대표에서 뺀다.
  for (const e of entries) {
    const f = path.join(TOOLS, 'app', e.href.replace(/\//g, ''), 'page.tsx');
    const m = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').match(/<h1>[^<]*<\/h1><p>([^<{}]+)<\/p>/) : null;
    e.intro = m ? oneLine(m[1]) : '';
  }
  const usable = entries.filter(e => e.intro && e.intro !== e.description && clean(e.name, e.description, e.intro));
  const cats = ['이미지', 'PDF', 'QR', '게임', '생활·학습', '업무'];
  const picked = [];
  for (const c of cats) for (const e of usable.filter(e => e.categories.includes(c) && !picked.includes(e)).slice(0, 2)) picked.push(e);
  const items = picked.map(e => ({title: e.name, category: e.categories[0],
    summary: `${e.description} ${e.intro}`, url: `https://apps.kimjinwan.com${e.href}`}));
  return {id: 'tools', url: 'https://apps.kimjinwan.com/',
    count: {value: entries.length, as_of: AS_OF, source: 'kein-web-tools/lib/tool-catalog.ts 의 tools 배열 항목(href) 수. 대표는 분류(이미지·PDF·QR·게임·생활·학습·업무)별 카탈로그 앞 2개; 요약 = 카탈로그 설명 + 각 도구 페이지 머리말 문단'}, items};
}

// ── 기즈모 스토어(공개 API) ───────────────────────────────────────────
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

const out = {as_of: AS_OF, sections: [blogSection(), servicesSection(), gamesSection(), toolsSection(), await gizmoSection()]};
const files = new Map([['data/content-hub.json', JSON.stringify(out, null, 1) + '\n']]);
for (const [rel, obj] of [...EXTRA].sort((a, b) => a[0].localeCompare(b[0]))) files.set(rel, JSON.stringify(obj, null, 1) + '\n');
const existing = fs.existsSync(path.join(ROOT, 'content-src')) ? fs.readdirSync(path.join(ROOT, 'content-src'), {recursive: true}).filter(f => f.endsWith('.json')).map(f => 'content-src/' + f) : [];
const stale = existing.filter(f => !files.has(f));
const same = [...files].every(([rel, t]) => fs.existsSync(path.join(ROOT, rel)) && fs.readFileSync(path.join(ROOT, rel), 'utf8') === t) && !stale.length;
if (argv.includes('--check')) { console.log(same ? `up to date (${files.size} files)` : 'differs from sources'); process.exit(same ? 0 : 1); }
for (const [rel, t] of files) { const dest = path.join(ROOT, rel); fs.mkdirSync(path.dirname(dest), {recursive: true}); fs.writeFileSync(dest, t); }
for (const f of stale) fs.rmSync(path.join(ROOT, f));
const n = s => s.groups ? s.groups.map(g => `${g.id}:${g.items.length}`).join(' ') : s.items.length;
console.log(`wrote ${files.size} files (${stale.length} stale removed) —`, out.sections.map(s => `${s.id}(${n(s)}; count ${s.count.value})`).join(' | '));
