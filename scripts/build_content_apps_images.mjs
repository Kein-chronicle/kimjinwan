// scripts/build_content_apps_images.mjs — '내 앱' 아이콘·화면 이미지를 허브에 자체 호스팅한다(수동 실행, Pillow + 필요 시 iTunes lookup 공개 API).
//   node scripts/build_content_apps_images.mjs               # 없는(또는 편집 원본 src 목록이 바뀐) 앱만 만든다
//   node scripts/build_content_apps_images.mjs --force       # 전부 다시 만든다
//   node scripts/build_content_apps_images.mjs --only <slug>[,<slug>]   # 해당 앱만
// 출력: assets/content/apps/<slug>-icon.webp(정사각 256px·15KB 이하) · <slug>-1..4.webp(세로 이미지는 폭 400·가로 이미지는 폭 800 이하 웹피, 장당 90KB 이하, 세로 비율 유지)
//       content-src/images.json 의 apps[slug] = {from(src 목록 서명), icon:[w,h], shots:[[w,h]…], bytes{…}} (다른 키 games·tools 는 그대로 둔다)
// 원본(편집 원본 images[].src): catalog:<경로> = ~/Projects/app-factory/catalog/<slug>/<경로>(앱 소개 이미지·아이콘), store:<N> = 앱스토어 스크린샷 N번(1부터), store:icon = 스토어 아이콘(artworkUrl512),
//   repo:<경로> = 홈 디렉터리 기준 상대 경로(앱 저장소의 파일). store: 은 iTunes lookup(공개 API, kr)에서 주소를 읽어 내려받는다(mzstatic 이미지, 허브에는 변환본만 둔다). 결정적: 같은 원본 → 같은 출력.
// 서브도메인·스토어 핫링크는 쓰지 않는다 — 결과 파일만 허브가 가진다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readAuthoring, IMG_BUDGET} from './lib/apps_authoring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const CATALOG = path.join(HOME, 'Projects/app-factory/catalog');
const OUT = path.join(ROOT, 'assets/content/apps');
const CACHE = process.env.APPS_IMG_CACHE || path.join(os.tmpdir(), 'kj-apps-img-cache');
const FORCE = process.argv.includes('--force');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? new Set(process.argv[i + 1].split(',')) : null; })();
fs.mkdirSync(OUT, {recursive: true}); fs.mkdirSync(CACHE, {recursive: true});

const PY = `
import sys, json, os
from PIL import Image
mode, src, dest = sys.argv[1:4]
im = Image.open(src).convert('RGB')
def save(img, limit, qs):
    for q in qs:
        img.save(dest, 'WEBP', quality=q, method=6)
        if os.path.getsize(dest) <= limit: return
if mode == 'icon':
    s = min(im.width, im.height); l, t = (im.width - s)//2, (im.height - s)//2
    im = im.crop((l, t, l+s, t+s)).resize((256, 256), Image.LANCZOS)
    save(im, ${IMG_BUDGET.icon}, [82, 74, 66, 58, 50]); print(json.dumps([256, 256]))
else:
    mw = 400 if im.height >= im.width else 800
    if im.width > mw: im = im.resize((mw, max(1, round(im.height*mw/im.width))), Image.LANCZOS)
    save(im, ${IMG_BUDGET.shot}, [72, 64, 56, 48, 40, 32]); print(json.dumps(list(im.size)))
`;
const py = (mode, src, dest) => JSON.parse(execFileSync('python3', ['-c', PY, mode, src, dest], {encoding: 'utf8'}));

const lookups = new Map();
async function lookup(id) {
  if (lookups.has(id)) return lookups.get(id);
  const f = path.join(CACHE, `lookup-${id}.json`);
  let r;
  if (fs.existsSync(f)) r = JSON.parse(fs.readFileSync(f, 'utf8'));
  else {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=kr`, {signal: AbortSignal.timeout(30000)});
    if (!res.ok) throw new Error(`lookup HTTP ${res.status} (${id})`);
    r = (await res.json()).results[0];
    if (!r) throw new Error(`lookup 0건: ${id}`);
    fs.writeFileSync(f, JSON.stringify(r));
  }
  lookups.set(id, r); return r;
}
async function download(url, name) {
  const f = path.join(CACHE, name);
  if (!fs.existsSync(f)) {
    const res = await fetch(url, {signal: AbortSignal.timeout(60000)});
    if (!res.ok) throw new Error(`download HTTP ${res.status}: ${url}`);
    fs.writeFileSync(f, Buffer.from(await res.arrayBuffer()));
  }
  return f;
}
async function resolve(slug, a, src) {
  const [kind, rest] = [src.slice(0, src.indexOf(':')), src.slice(src.indexOf(':') + 1)];
  if (kind === 'catalog') return path.join(CATALOG, slug, rest);
  if (kind === 'repo') return path.join(HOME, rest);
  const r = await lookup(a.storeId);
  if (rest === 'icon') return download(r.artworkUrl512.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/512x512bb.png'), `${a.storeId}-icon.png`);
  const n = Number(rest); const u = (r.screenshotUrls || [])[n - 1];
  if (!u) throw new Error(`${slug}: 스토어 스크린샷 ${n}번 없음(총 ${(r.screenshotUrls || []).length}장)`);
  return download(u.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x1300bb.jpg'), `${a.storeId}-s${n}.jpg`);
}

const manifestPath = path.join(ROOT, 'content-src/images.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {games: {}, tools: {}};
manifest.apps = manifest.apps || {};
const auth = readAuthoring(ROOT), problems = []; let made = 0;
for (const [slug, a] of auth) {
  if (ONLY && !ONLY.has(slug)) continue;
  if (a.__parseError || !Array.isArray(a.images) || !a.images.length) { problems.push([slug, '편집 원본 images 없음']); continue; }
  const srcs = a.images.map(x => x.src), sig = JSON.stringify(srcs);
  const names = [`${slug}-icon.webp`, ...srcs.slice(1).map((_, i) => `${slug}-${i + 1}.webp`)];
  if (!FORCE && manifest.apps[slug]?.from === sig && names.every(n => fs.existsSync(path.join(OUT, n)))) continue;
  try {
    const files = []; for (const s of srcs) { const f = await resolve(slug, a, s); if (!fs.existsSync(f)) throw new Error(`원본 없음: ${s} → ${f}`); files.push(f); }
    for (const f of fs.readdirSync(OUT)) if (f === `${slug}-icon.webp` || new RegExp(`^${slug.replace(/[-.]/g, '\\$&')}-\\d\\.webp$`).test(f)) fs.rmSync(path.join(OUT, f));
    const rec = {from: sig};
    rec.icon = py('icon', files[0], path.join(OUT, names[0]));
    rec.shots = files.slice(1).map((f, i) => py('shot', f, path.join(OUT, names[i + 1])));
    manifest.apps[slug] = rec; made++;
  } catch (e) { problems.push([slug, e.message]); }
}
// 바이트 수 기록(결정적 정렬). 편집 원본이 없어진 앱의 매니페스트·파일은 지운다(ONLY 모드가 아닐 때).
const sorted = {};
for (const slug of Object.keys(manifest.apps).sort()) {
  if (!ONLY && !auth.has(slug)) { for (const f of fs.readdirSync(OUT)) if (f.startsWith(`${slug}-`)) fs.rmSync(path.join(OUT, f)); continue; }
  const rec = manifest.apps[slug];
  rec.bytes = Object.fromEntries(fs.readdirSync(OUT).filter(f => f === `${slug}-icon.webp` || new RegExp(`^${slug.replace(/[-.]/g, '\\$&')}-\\d\\.webp$`).test(f)).sort().map(f => [f, fs.statSync(path.join(OUT, f)).size]));
  sorted[slug] = rec;
}
const out = {games: manifest.games || {}, tools: manifest.tools || {}, apps: sorted};
fs.writeFileSync(manifestPath, JSON.stringify(out, null, 1) + '\n');
const total = Object.values(sorted).flatMap(r => Object.values(r.bytes)).reduce((x, y) => x + y, 0), cnt = Object.keys(sorted).length;
console.log(`apps images: ${cnt} apps, made ${made}, ${(total / 1024).toFixed(0)}KB total, avg ${(total / Math.max(1, cnt) / 1024).toFixed(0)}KB/app`);
if (problems.length) { console.log('problems:', JSON.stringify(problems)); process.exitCode = 1; }
