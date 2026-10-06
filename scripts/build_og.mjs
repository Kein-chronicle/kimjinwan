// scripts/build_og.mjs — 공유 카드(og:image) 1200×630 PNG 생성기. 수동 실행:
//   node scripts/build_og.mjs                 # assets/og/{home,works,factories,career,game}.png + scripts/og-cards.lock.json
//   node scripts/build_og.mjs --thumbs <dir>  # 확인용 300px 썸네일도 <dir> 에 저장
// 문구는 scripts/lib/og.mjs(= build.mjs 와 같은 출처)에서, 숫자는 data/·js/data.js 에서 온다.
// 렌더: HTML → 헤드리스 Chrome(DevTools 프로토콜, deviceScaleFactor 1) 캡처 → Pillow 256색 양자화.
// Pretendard(CDN) 굵기 4종이 실제로 로드됐는지 페이지 안에서 확인하고, 아니면 실패한다(macOS 는 두부 대신 조용히 대체 글꼴을 쓴다).
// 실행 후: node scripts/build.mjs (og:image ?v= 해시 갱신) → node --test tests/*.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync, spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {loadData} from './build.mjs';
import {parseProjects} from './lib/projects.mjs';
import {K_PATH, K_DOT} from './lib/render.mjs';
import {facts, pageMeta, CARD_KEYS, cardPath, cardText} from './lib/og.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FONT_CSS = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
const W = 1200, H = 630;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function cardHtml(t) {
  const mark = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#3B4BDB"/><path d="${K_PATH}" fill="#fff"/><circle cx="${K_DOT.cx}" cy="${K_DOT.cy}" r="${K_DOT.r}" fill="#FFB547"/></svg>`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONT_CSS}">
<style>
*{box-sizing:border-box}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
body{background:#FAFAF7;color:#16181D;font-family:Pretendard,sans-serif;position:relative;-webkit-font-smoothing:antialiased}
.edge{position:absolute;left:0;top:0;bottom:0;width:14px;background:#3B4BDB}
.edge::after{content:"";position:absolute;left:0;bottom:0;width:14px;height:96px;background:#FFB547}
.frame{position:absolute;left:104px;right:104px;top:74px;bottom:70px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:18px}
.mark{width:60px;height:60px;display:block}
.word{font-weight:800;font-size:40px;letter-spacing:-.02em;line-height:1}
.kicker{margin-left:auto;font-weight:700;font-size:20px;letter-spacing:.18em;color:#3B4BDB;line-height:1}
.main{margin-top:auto;margin-bottom:auto}
.rule{width:72px;height:6px;border-radius:3px;background:#3B4BDB;margin-bottom:30px}
.headline{margin:0;font-weight:800;font-size:66px;line-height:1.2;letter-spacing:-.035em;word-break:keep-all;text-wrap:balance;max-width:960px}
.who{margin-top:30px;font-size:30px;font-weight:500;color:#515867;letter-spacing:-.01em}
.who b{color:#16181D;font-weight:700}
.bottom{display:flex;align-items:center;gap:12px;border-top:2px solid #E4E4DC;padding-top:22px;font-size:22px;font-weight:600;color:#666D7C;letter-spacing:.01em}
.dot{width:10px;height:10px;border-radius:50%;background:#FFB547}
</style></head><body>
<div class="edge"></div>
<div class="frame">
  <div class="top">${mark}<span class="word">${esc(t.wordmark)}</span>${t.kicker ? `<span class="kicker">${esc(t.kicker)}</span>` : ''}</div>
  <div class="main"><div class="rule"></div><h1 class="headline">${esc(t.headline)}</h1>
    <div class="who"><b>${esc(t.name)}</b> · ${esc(t.role)}</div></div>
  <div class="bottom"><span class="dot"></span>${esc(t.domain)}</div>
</div>
</body></html>`;
}

// Chrome 을 DevTools 프로토콜로 몬다(이 맥에서 --screenshot/--dump-dom 은 일을 끝내고도 프로세스가 안 끝난다).
async function launchChrome(tmp) {
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${tmp}/profile`, 'about:blank'], {stdio: 'ignore'});
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
  await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 1, mobile: false});
  return {send, close: () => { try { ws.close(); } catch {} proc.kill('SIGKILL'); }};
}

async function shoot(cdp, file) {
  await cdp.send('Page.navigate', {url: 'file://' + file});
  // load 이벤트 대신 폰트 로드까지 직접 기다린다
  const r = await cdp.send('Runtime.evaluate', {awaitPromise: true, returnByValue: true, expression: `(async () => {
    for (let i = 0; i < 100 && document.readyState !== 'complete'; i++) await new Promise(r => setTimeout(r, 100));
    await document.fonts.ready;
    await Promise.all([500, 600, 700, 800].map(w => document.fonts.load(w + ' 40px Pretendard', '김진완가나다')));
    await document.fonts.ready;
    const loaded = [...document.fonts].filter(f => /Pretendard/.test(f.family) && f.status === 'loaded').map(f => String(f.weight));
    const over = [...document.querySelectorAll('.frame *')].some(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible');
    const hl = document.querySelector('.headline').getBoundingClientRect();
    return {loaded: [...new Set(loaded)].sort(), lines: Math.round(hl.height / (parseFloat(getComputedStyle(document.querySelector('.headline')).lineHeight))), over};
  })()`});
  const info = r.result.value;
  const shot = await cdp.send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: W, height: H, scale: 1}});
  return {info, png: Buffer.from(shot.data, 'base64')};
}

function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error('not a PNG');
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

export async function render({thumbs} = {}) {
  const data = loadData();
  const projects = parseProjects(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8'));
  const meta = pageMeta(facts(data, projects));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kein-og-'));
  fs.mkdirSync(path.join(ROOT, 'assets/og'), {recursive: true});
  const lock = {};
  const cdp = await launchChrome(tmp);
  try {
    for (const key of CARD_KEYS) {
      const text = cardText(meta[key]);
      const html = path.join(tmp, key + '.html');
      fs.writeFileSync(html, cardHtml(text));
      const {info, png} = await shoot(cdp, html);
      for (const w of ['500', '600', '700', '800']) if (!info.loaded.includes(w)) throw new Error(`${key}: Pretendard ${w} not loaded (got ${info.loaded}) — check network/CDN`);
      if (info.lines > 2) throw new Error(`${key}: headline wraps to ${info.lines} lines`);
      const raw = path.join(tmp, key + '.raw.png');
      fs.writeFileSync(raw, png);
      const dest = path.join(ROOT, cardPath(key));
      execFileSync('python3', ['-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
assert im.size == (${W}, ${H}), im.size
im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(sys.argv[2], optimize=True)`, raw, dest]);
      const buf = fs.readFileSync(dest);
      const [w, h] = pngSize(buf);
      if (w !== W || h !== H) throw new Error(`${key}: ${w}x${h}`);
      lock[key] = {file: cardPath(key), text, sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length};
      if (thumbs) {
        fs.mkdirSync(thumbs, {recursive: true});
        execFileSync('sips', ['-Z', '300', dest, '--out', path.join(thumbs, key + '-300.png')], {stdio: 'ignore'});
      }
      console.log(`${cardPath(key)}  ${w}x${h}  ${(buf.length / 1024).toFixed(1)}KB  lines=${info.lines}  fonts=${info.loaded}`);
    }
  } finally { cdp.close(); await sleep(300); fs.rmSync(tmp, {recursive: true, force: true}); }
  fs.writeFileSync(path.join(ROOT, 'scripts/og-cards.lock.json'), JSON.stringify(lock, null, 2) + '\n');
  // 손으로 쓴 game/index.html 의 og:image·twitter:image ?v= 를 새 해시로 맞춘다(다른 내용은 건드리지 않는다).
  const gamePath = path.join(ROOT, 'game/index.html');
  const v = lock.game.sha256.slice(0, 10);
  const g = fs.readFileSync(gamePath, 'utf8');
  const g2 = g.replace(/(\/assets\/og\/game\.png\?v=)[0-9a-f]+/g, `$1${v}`);
  if (g2 !== g) fs.writeFileSync(gamePath, g2);
  return lock;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--thumbs');
  await render({thumbs: i > -1 ? path.resolve(process.argv[i + 1]) : undefined});
  console.log('wrote scripts/og-cards.lock.json — now run: node scripts/build.mjs');
}
