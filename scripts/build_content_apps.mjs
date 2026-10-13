// scripts/build_content_apps.mjs — '내 앱' 섹션만 다시 만든다(블로그·기즈모·게임 소스 불필요). 편집 원본 data/authoring/apps/*.json + 스토어 캐시 content-src/apps-store.json + 이미지 매니페스트
//   → data/content-hub.json 의 apps 섹션 + content-src/apps/*.json + content-src/excluded.json 의 apps 목록.
//   node scripts/build_content_apps.mjs                  # 다시 쓴다
//   node scripts/build_content_apps.mjs --check          # 쓰지 않고 현재 산출물과 같은지만 본다(다르면 exit 1)
//   node scripts/build_content_apps.mjs --refresh-store [--as-of YYYY-MM-DD]   # iTunes lookup(공개 API, 네트워크)으로 스토어 캐시를 갱신한다(이 모드만 네트워크를 쓴다)
// 전체 스냅샷 생성기(build_content_hub.mjs)가 같은 함수(lib/apps_authoring.mjs buildApps)를 쓰므로 둘의 결과는 같다.
// 편집 원본에 문제가 있으면 stderr 에 경고를 내고 그 앱만 목록에서 뺀다(빌드는 계속). 자세한 이유는 node scripts/hub_check_app.mjs <slug> 로 본다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildApps, DEV_ID, STORE_CACHE, readAuthoring} from './lib/apps_authoring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : undefined; };

// 스토어 캐시 = iTunes lookup 응답에서 사실만 뽑은 것. 개발자 계정의 공개 앱 전체(entity=software) + 편집 원본에만 있는 storeId 는 개별 조회.
async function refreshStore(asOf) {
  const get = async url => { const r = await fetch(url, {signal: AbortSignal.timeout(30000)}); if (!r.ok) throw new Error(`lookup HTTP ${r.status}: ${url}`); return r.json(); };
  const dev = await get(`https://itunes.apple.com/lookup?id=${DEV_ID}&entity=software&country=kr&limit=200`);
  const list = dev.results.filter(r => r.wrapperType === 'software' || r.kind === 'software');
  if (list.length < 10) throw new Error(`developer listing looks wrong (${list.length} apps)`);
  const byId = new Map(list.map(r => [String(r.trackId), r]));
  for (const slug of readAuthoring(ROOT).keys()) {
    const id = String(readAuthoring(ROOT).get(slug).storeId || '');
    if (id && !byId.has(id)) { const one = await get(`https://itunes.apple.com/lookup?id=${id}&country=kr`); if (one.results[0]) byId.set(id, one.results[0]); }
  }
  const apps = {};
  for (const [id, r] of [...byId].sort((a, b) => a[0].localeCompare(b[0]))) {
    apps[id] = {name: r.trackName, bundleId: r.bundleId, version: r.version, genre: r.primaryGenreName, languages: r.languageCodesISO2A || [],
      devices: (r.supportedDevices || []).some(d => d.startsWith('iPad')) ? ['iPhone', 'iPad'] : ['iPhone'], minOs: r.minimumOsVersion, price: r.price,
      released: (r.releaseDate || '').slice(0, 10), updated: (r.currentVersionReleaseDate || '').slice(0, 10), rating: r.contentAdvisoryRating};
  }
  const out = {as_of: asOf, source: `https://itunes.apple.com/lookup?id=${DEV_ID}&entity=software&country=kr (공개 API) 응답에서 앱 이름·번들 ID·버전·분류·지원 언어·기기·최소 OS·가격·출시일·갱신일·연령 등급만 옮겼다`, developer_total: list.length, apps};
  fs.mkdirSync(path.join(ROOT, 'content-src'), {recursive: true});
  fs.writeFileSync(path.join(ROOT, STORE_CACHE), JSON.stringify(out, null, 1) + '\n');
  console.log(`store cache: ${Object.keys(apps).length} apps (developer total ${list.length}) as of ${asOf}`);
}

if (argv.includes('--refresh-store')) {
  const asOf = flag('--as-of') || rd('data/content-hub.json').as_of;
  await refreshStore(asOf);
  process.exit(0);
}

const hub = rd('data/content-hub.json'), images = rd('content-src/images.json'), excl = rd('content-src/excluded.json'), store = rd(STORE_CACHE);
const slugOf = u => u.split('/').filter(Boolean).pop();
const blogApps = new Map(hub.sections.find(s => s.id === 'blog').groups.find(g => g.id === 'apps').items.map(i => [slugOf(i.url), {title: i.title, path: `/content/blog/apps/${slugOf(i.url)}/`}]));
const r = buildApps({root: ROOT, asOf: hub.as_of, images, store, blogApps});
if (r.warnings.length) console.error('apps authoring 경고:\n  ' + r.warnings.join('\n  '));
const i = hub.sections.findIndex(s => s.id === 'apps');
if (i < 0) hub.sections.push(r.section); else hub.sections[i] = r.section;
const files = new Map([['data/content-hub.json', JSON.stringify(hub, null, 1) + '\n'], ['content-src/excluded.json', JSON.stringify({as_of: excl.as_of, games: excl.games, tools: excl.tools, apps: r.excluded}, null, 1) + '\n']]);
for (const [rel, obj] of [...r.extra].sort((a, b) => a[0].localeCompare(b[0]))) files.set(rel, JSON.stringify(obj, null, 1) + '\n');
const dir = path.join(ROOT, 'content-src/apps'), stale = fs.existsSync(dir) ? fs.readdirSync(dir).map(f => 'content-src/apps/' + f).filter(f => !files.has(f)) : [];
const same = [...files].every(([rel, t]) => fs.existsSync(path.join(ROOT, rel)) && fs.readFileSync(path.join(ROOT, rel), 'utf8') === t) && !stale.length;
if (argv.includes('--check')) { console.log(same ? 'up to date' : 'differs'); process.exit(same ? 0 : 1); }
for (const [rel, t] of files) { fs.mkdirSync(path.dirname(path.join(ROOT, rel)), {recursive: true}); fs.writeFileSync(path.join(ROOT, rel), t); }
for (const f of stale) fs.rmSync(path.join(ROOT, f));
console.log(`apps: ${r.section.count.value} (excluded ${r.excluded.length}; stale removed ${stale.length}) — ` + r.section.groups.map(g => `${g.id}:${g.items.length}`).join(' '));
