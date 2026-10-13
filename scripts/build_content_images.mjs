// scripts/build_content_images.mjs — 웹게임·웹 도구 상세용 이미지를 허브에 자체 호스팅한다(수동 실행, 헤드리스 Chrome + Pillow).
//   node scripts/build_content_images.mjs            # 없는 이미지만 만든다(이미 있는 것은 그대로)
//   node scripts/build_content_images.mjs --force    # 전부 다시 만든다
// 출력: assets/content/games/<slug>.webp(카드 640×400) · <slug>-hero.webp(≤1280폭) · <slug>-1/2.webp(실제 플레이 화면)
//       assets/content/tools/<slug>.webp(카드 640×400) · <slug>-hero.webp(1200×750)
//       content-src/images.json (크기·바이트 매니페스트 — 텍스트 생성기와 빌드가 읽는다)
// 소스(하이브리드):
//   게임(편집 원본 있음) = 직접 플레이하며 찍은 캡처 PNG. 원본 data/authoring/games/<id>.json 의 images[].src 파일을 --raw <폴더>(또는 환경변수 GAME_SHOTS_DIR)에서 읽는다.
//     images[0] → <slug>-hero.webp(≤1280폭·≤150KB), images[1..] → <slug>-1..3.webp(≤150KB), 카드 <slug>.webp(640×400·≤40KB) = images[cardIndex ?? 첫 비-타이틀]. 원본 PNG 목록이 바뀌면(매니페스트 from) 그 게임만 다시 만든다.
//   (앱 이미지는 build_content_apps_images.mjs 가 만든다 — 이 스크립트는 매니페스트의 apps 항목을 그대로 보존한다)
//   게임(편집 원본 없음) = 포털 커버(kein-web-games/dist/covers) + 로컬 빌드(dist/builds/<slug>/)를 헤드리스로 띄운 실제 화면(기존 방식 그대로).
//   도구 = 라이브 페이지 화면.
// 편집 원본이 있는 게임의 이미지만 지우고 다시 만든다. 편집 원본이 없는 게임의 이미지·매니페스트는 건드리지 않는다.
// 서브도메인 핫링크는 쓰지 않는다 — 결과 파일만 허브가 가진다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync, spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {collectGame, gameEligible, collectTool, toolEligible, parseToolCatalog} from './lib/hub_sources.mjs';
import {readAuthoring, IMG_BUDGET} from './lib/games_authoring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const GAMES = path.join(HOME, 'Projects/kein-web-games'), TOOLS = path.join(HOME, 'Projects/kein-web-tools');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FORCE = process.argv.includes('--force');
const OUT = {games: path.join(ROOT, 'assets/content/games'), tools: path.join(ROOT, 'assets/content/tools')};
for (const d of Object.values(OUT)) fs.mkdirSync(d, {recursive: true});

// ── 대상: 소개글 자격이 있는 항목만 ──
const authoring = readAuthoring(ROOT);
const RAW = (() => { const i = process.argv.indexOf('--raw'); return i > -1 ? process.argv[i + 1] : process.env.GAME_SHOTS_DIR; })();
const games = JSON.parse(fs.readFileSync(path.join(GAMES, 'src/games.json'), 'utf8')).filter(g => !g.legacy)
  .filter(g => !authoring.has(g.slug)).filter(g => gameEligible(g, collectGame(HOME, GAMES, g)));
const tools = parseToolCatalog(fs.readFileSync(path.join(TOOLS, 'lib/tool-catalog.ts'), 'utf8')).filter(it => toolEligible(it, collectTool(TOOLS, it)));
console.log(`targets: ${games.length} legacy games + ${authoring.size} authored games, ${tools.length} tools`);

// ── Pillow 변환 ──
const PY = `
import sys, json
from PIL import Image, ImageFilter
mode, src, outdir, name = sys.argv[1:5]
im = Image.open(src).convert('RGB')
def save(img, path, qs):
    for q in qs:
        img.save(path, 'WEBP', quality=q, method=6)
        import os
        if os.path.getsize(path) <= LIMIT[0]: return
LIMIT = [60*1024]
def contain_on_blur(im, W, H):
    bg = im.resize((W, H), Image.LANCZOS) if False else im.copy()
    r = max(W / bg.width, H / bg.height)
    bg = bg.resize((max(W, round(bg.width*r)), max(H, round(bg.height*r))), Image.LANCZOS)
    l, t = (bg.width - W)//2, (bg.height - H)//2
    bg = bg.crop((l, t, l+W, t+H)).filter(ImageFilter.GaussianBlur(24))
    bg = Image.blend(bg, Image.new('RGB', (W, H), (14, 16, 22)), 0.45)
    r = min(W / im.width, H / im.height)
    fg = im.resize((max(1, round(im.width*r)), max(1, round(im.height*r))), Image.LANCZOS)
    bg.paste(fg, ((W-fg.width)//2, (H-fg.height)//2))
    return bg
out = {}
if mode == 'cover':
    card = contain_on_blur(im, 640, 400); save(card, f'{outdir}/{name}.webp', [74, 66, 58, 50, 42]); out['card'] = [640, 400]
    ratio = im.width / im.height
    if ratio >= 1.4:
        w = min(1280, im.width); h = round(im.height * w / im.width); hero = im.resize((w, h), Image.LANCZOS)
    else:
        hero = contain_on_blur(im, 1280, 720); w, h = 1280, 720
    LIMIT[0] = 220*1024; save(hero, f'{outdir}/{name}-hero.webp', [78, 70, 62, 54, 46]); out['hero'] = [hero.width, hero.height]
elif mode == 'shot':
    w, h = im.size
    if w > 1280: im = im.resize((1280, round(h*1280/w)), Image.LANCZOS)
    LIMIT[0] = ${IMG_BUDGET.shot}; save(im, f'{outdir}/{name}.webp', [76, 68, 60, 52, 44, 36, 28]); out['size'] = list(im.size)
elif mode == 'ghero':
    if im.width / im.height < 1.2: im = contain_on_blur(im, 1280, 720)
    elif im.width > 1280: im = im.resize((1280, round(im.height*1280/im.width)), Image.LANCZOS)
    LIMIT[0] = ${IMG_BUDGET.hero}; save(im, f'{outdir}/{name}.webp', [74, 66, 58, 50, 42, 34, 26]); out['size'] = list(im.size)
elif mode == 'gcard':
    LIMIT[0] = ${IMG_BUDGET.card}
    card = contain_on_blur(im, 640, 400); save(card, f'{outdir}/{name}.webp', [74, 66, 58, 50, 42, 34]); out['card'] = [640, 400]
elif mode == 'tool':
    card = im.resize((640, 400), Image.LANCZOS); save(card, f'{outdir}/{name}.webp', [74, 66, 58, 50, 42]); out['card'] = [640, 400]
    hero = im.resize((1200, 750), Image.LANCZOS); LIMIT[0] = 130*1024; save(hero, f'{outdir}/{name}-hero.webp', [76, 68, 60, 52, 44]); out['hero'] = [1200, 750]
print(json.dumps(out))
`;
const py = (mode, src, outdir, name) => JSON.parse(execFileSync('python3', ['-c', PY, mode, src, outdir, name], {encoding: 'utf8'}));
const stats = (file, mode = 'blank') => JSON.parse(execFileSync('python3', ['-c', `
import sys, json
from PIL import Image, ImageChops, ImageStat
a = Image.open(sys.argv[1]).convert('RGB').resize((160, 100))
colors = len(a.getcolors(160*100) or [])
sd = sum(ImageStat.Stat(a).stddev) / 3
diff = 0
if len(sys.argv) > 2:
    b = Image.open(sys.argv[2]).convert('RGB').resize((160, 100)); diff = sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3
print(json.dumps({'colors': colors, 'sd': sd, 'diff': diff}))`, file, ...(mode === 'blank' ? [] : [mode])], {encoding: 'utf8'}));

// ── Chrome(DevTools 프로토콜) ──
async function launchChrome(tmp) {
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
    '--remote-allow-origins=*', '--remote-debugging-port=0', `--user-data-dir=${tmp}/profile`, 'about:blank'], {stdio: 'ignore'});
  const portFile = path.join(tmp, 'profile', 'DevToolsActivePort');
  for (let i = 0; i < 200 && !fs.existsSync(portFile); i++) await sleep(100);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const [ok, ko] = pending.get(m.id); pending.delete(m.id); m.error ? ko(new Error(m.error.message)) : ok(m.result); } };
  const send = (method, params = {}) => new Promise((ok, ko) => { pending.set(++id, [ok, ko]); ws.send(JSON.stringify({id, method, params})); });
  await send('Page.enable');
  return {send, close: () => { try { ws.close(); } catch {} proc.kill('SIGKILL'); }};
}
async function shoot(cdp, url, w, h, file, {click = false, wait = 3500} = {}) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: 1, mobile: false});
  await cdp.send('Page.navigate', {url});
  await sleep(wait);
  if (click) {
    for (const [x, y] of [[w / 2, h * 0.6], [w / 2, h / 2]]) {
      await cdp.send('Input.dispatchMouseEvent', {type: 'mousePressed', x, y, button: 'left', clickCount: 1});
      await cdp.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x, y, button: 'left', clickCount: 1});
      await sleep(900);
    }
    await sleep(1800);
  }
  const shot = await cdp.send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: w, height: h, scale: 1}});
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
}

// 로컬 빌드 정적 서버(dist/ 루트 — /builds/<slug>/ 경로 그대로)
function serve(root) {
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wasm': 'application/wasm'};
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'content-type': types[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

const manifest = fs.existsSync(path.join(ROOT, 'content-src/images.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'content-src/images.json'), 'utf8')) : {games: {}, tools: {}};
const APPS_KEEP = manifest.apps; // 앱 이미지는 build_content_apps_images.mjs 가 관리한다 — 여기서는 그대로 보존
const have = (kind, slug, ...names) => !FORCE && manifest[kind]?.[slug] && names.every(n => fs.existsSync(path.join(OUT[kind], n)));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kein-img-'));
const cdp = await launchChrome(tmp);
const srv = await serve(path.join(GAMES, 'dist'));
const base = `http://127.0.0.1:${srv.address().port}`;
const skipped = [];
try {
  for (const g of games) {
    const cover = path.join(GAMES, 'dist/covers', `${g.slug}.webp`);
    if (!fs.existsSync(cover)) { skipped.push([`game:${g.slug}`, 'no cover']); continue; }
    if (have('games', g.slug, `${g.slug}.webp`, `${g.slug}-hero.webp`)) { console.log('keep game', g.slug); continue; }
    const rec = py('cover', cover, OUT.games, g.slug);
    rec.shots = [];
    // 실제 플레이 화면: 초기 화면 + 한 번 눌러 시작한 화면
    const portrait = g.orientation === '세로';
    const [w, h] = portrait ? [540, 960] : [1280, 720];
    const a = path.join(tmp, `${g.slug}-a.png`), b = path.join(tmp, `${g.slug}-b.png`);
    try {
      await shoot(cdp, `${base}/builds/${g.slug}/`, w, h, a);
      const sa = stats(a);
      if (sa.colors > 120 && sa.sd > 18) {
        rec.shots.push(py('shot', a, OUT.games, `${g.slug}-1`).size);
        await shoot(cdp, `${base}/builds/${g.slug}/`, w, h, b, {click: true});
        const sb = stats(b, a);
        if (sb.colors > 120 && sb.sd > 18 && sb.diff > 4) rec.shots.push(py('shot', b, OUT.games, `${g.slug}-2`).size);
      }
    } catch (e) { console.log('shot failed', g.slug, e.message); }
    manifest.games[g.slug] = rec;
    console.log('game', g.slug, JSON.stringify(rec));
  }
  // 편집 원본이 있는 게임: 캡처 PNG(--raw) → 웹 이미지. 이 slug 의 파일만 지우고 다시 만든다.
  for (const [slug, a] of authoring) {
    if (!Array.isArray(a.images) || !a.images.length) { skipped.push([`game:${slug}`, '편집 원본에 images 없음']); continue; }
    const srcs = a.images.map(x => x.src), cardI = a.cardIndex ?? Math.max(1, a.images.findIndex(x => x.role !== 'title'));
    const sig = JSON.stringify({srcs, cardI});
    const names = [`${slug}.webp`, `${slug}-hero.webp`, ...srcs.slice(1).map((_, i) => `${slug}-${i + 1}.webp`)];
    if (!FORCE && manifest.games[slug]?.from === sig && names.every(n => fs.existsSync(path.join(OUT.games, n)))) { console.log('keep game', slug); continue; }
    if (!RAW) { skipped.push([`game:${slug}`, '--raw <캡처 폴더> 가 필요(이미지가 없거나 images[].src 가 바뀜)']); continue; }
    const miss = srcs.filter(f => !fs.existsSync(path.join(RAW, f)));
    if (miss.length) { skipped.push([`game:${slug}`, `캡처 없음 ${miss}`]); continue; }
    for (const f of fs.readdirSync(OUT.games)) if (f === `${slug}.webp` || (f.startsWith(`${slug}-`) && /^-(hero|\d)\.webp$/.test(f.slice(slug.length)))) fs.rmSync(path.join(OUT.games, f));
    const rec = {from: sig};
    rec.card = py('gcard', path.join(RAW, srcs[cardI]), OUT.games, slug).card;
    rec.hero = py('ghero', path.join(RAW, srcs[0]), OUT.games, `${slug}-hero`).size;
    rec.shots = srcs.slice(1).map((f, i) => py('shot', path.join(RAW, f), OUT.games, `${slug}-${i + 1}`).size);
    manifest.games[slug] = rec;
    console.log('game', slug, JSON.stringify(rec));
  }
  for (const it of tools) {
    const slug = it.href.replace(/\//g, '');
    if (have('tools', slug, `${slug}.webp`, `${slug}-hero.webp`)) { console.log('keep tool', slug); continue; }
    const f = path.join(tmp, `${slug}.png`);
    try {
      await shoot(cdp, `https://apps.kimjinwan.com/${slug}/`, 1280, 800, f, {wait: 3500});
      const s = stats(f);
      if (s.colors < 40) { skipped.push([`tool:${slug}`, `blank capture (${s.colors} colors)`]); continue; }
      manifest.tools[slug] = py('tool', f, OUT.tools, slug);
      console.log('tool', slug, JSON.stringify(manifest.tools[slug]));
    } catch (e) { skipped.push([`tool:${slug}`, e.message]); }
  }
} finally { cdp.close(); srv.close(); await sleep(300); fs.rmSync(tmp, {recursive: true, force: true}); }

// 바이트 수를 매니페스트에 기록(결정적 정렬)
const sorted = {games: {}, tools: {}, ...(APPS_KEEP ? {apps: APPS_KEEP} : {})};
for (const kind of ['games', 'tools']) for (const slug of Object.keys(manifest[kind]).sort()) {
  const rec = manifest[kind][slug]; const files = fs.readdirSync(OUT[kind]).filter(f => f === `${slug}.webp` || f.startsWith(`${slug}-`) && /^-(hero|\d)\.webp$/.test(f.slice(slug.length)));
  rec.bytes = Object.fromEntries(files.sort().map(f => [f, fs.statSync(path.join(OUT[kind], f)).size])); sorted[kind][slug] = rec;
}
fs.mkdirSync(path.join(ROOT, 'content-src'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'content-src/images.json'), JSON.stringify(sorted, null, 1) + '\n');
const total = ['games', 'tools'].flatMap(k => Object.values(sorted[k]).flatMap(r => Object.values(r.bytes))).reduce((a, b) => a + b, 0);
console.log(`images.json: ${Object.keys(sorted.games).length} games, ${Object.keys(sorted.tools).length} tools, ${(total / 1024).toFixed(0)}KB total`);
if (skipped.length) console.log('skipped:', JSON.stringify(skipped));
