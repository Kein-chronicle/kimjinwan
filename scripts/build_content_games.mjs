// scripts/build_content_games.mjs — 웹게임 섹션만 다시 만든다(네트워크·블로그·기즈모 불필요). 편집 원본 data/authoring/games/*.json + games.json 메타 → data/content-hub.json 의 games 섹션 + content-src/games/*.json + content-src/excluded.json 의 games 목록.
//   node scripts/build_content_games.mjs [--allow-pending]   # 작성 중에는 --allow-pending(미처리 게임을 '작성 대기'로 제외 표시), 완료 후에는 없이 — 미처리가 있으면 실패한다
//   node scripts/build_content_games.mjs --check
// 전체 스냅샷 생성기(build_content_hub.mjs)가 같은 함수(lib/games_authoring.mjs)를 쓰므로 둘의 결과는 같다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGames} from './lib/games_authoring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const argv = process.argv.slice(2);
const hub = rd('data/content-hub.json'), images = rd('content-src/images.json'), excl = rd('content-src/excluded.json');
const all = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Projects/kein-web-games/src/games.json'), 'utf8')).filter(g => !g.legacy).sort((a, b) => a.slug.localeCompare(b.slug));
const r = buildGames({root: ROOT, all, asOf: hub.as_of, images, pendingOk: argv.includes('--allow-pending')});
if (r.errors.length) { console.error('games authoring:\n  ' + r.errors.join('\n  ')); process.exit(1); }
const i = hub.sections.findIndex(s => s.id === 'games');
hub.sections[i] = r.section;
const files = new Map([['data/content-hub.json', JSON.stringify(hub, null, 1) + '\n'], ['content-src/excluded.json', JSON.stringify({as_of: excl.as_of, games: r.excluded, tools: excl.tools}, null, 1) + '\n']]);
for (const [rel, obj] of [...r.extra].sort((a, b) => a[0].localeCompare(b[0]))) files.set(rel, JSON.stringify(obj, null, 1) + '\n');
const dir = path.join(ROOT, 'content-src/games'), stale = fs.existsSync(dir) ? fs.readdirSync(dir).map(f => 'content-src/games/' + f).filter(f => !files.has(f)) : [];
const same = [...files].every(([rel, t]) => fs.existsSync(path.join(ROOT, rel)) && fs.readFileSync(path.join(ROOT, rel), 'utf8') === t) && !stale.length;
if (argv.includes('--check')) { console.log(same ? 'up to date' : 'differs'); process.exit(same ? 0 : 1); }
for (const [rel, t] of files) { fs.mkdirSync(path.dirname(path.join(ROOT, rel)), {recursive: true}); fs.writeFileSync(path.join(ROOT, rel), t); }
for (const f of stale) fs.rmSync(path.join(ROOT, f));
console.log(`games: ${r.section.count.value}/${r.section.count.total} (excluded ${r.excluded.length}; stale removed ${stale.length}) — ` + r.section.groups.map(g => `${g.id}:${g.items.length}`).join(' '));
