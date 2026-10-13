// scripts/hub_check_game.mjs — 웹게임 한 개의 허브 소개(편집 원본)가 올라갈 수 있는 상태인지 점검한다. 공장(게임 포지)이 편집 원본을 쓴 뒤 스스로 확인하는 용도.
//   cd ~/Projects/kimjinwan && node scripts/hub_check_game.mjs <id> [--json] [--online] [--raw <캡처 폴더>] [--root <허브 저장소>] [--games-repo <kein-web-games>]
// 종료 코드: 0 = 통과(또는 _progress.json 에 제외가 기록됨), 1 = 실패(고칠 것이 있음), 2 = 사용법 오류.
// 규칙의 단일 출처는 scripts/lib/games_authoring.mjs(validateAuthoring·imageProblems) — 허브 빌드와 이 점검이 같은 함수를 쓴다. 필드 정의·작성 기준은 docs/AUTHORING_GAMES.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Report, parseArgs} from './lib/check_report.mjs';
import {validateAuthoring, imageProblems, readProgress, GENRE_IDS, AUTH_DIR, MIN_BODY, IMG_BUDGET, bodyChars} from './lib/games_authoring.mjs';
import {collectGame, gameEligible, gameFactChars} from './lib/hub_sources.mjs';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2), ['--root', '--games-repo', '--raw'], ['--json', '--online']);
const id = args._[0];
if (!id || args.unknown || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error('사용법: node scripts/hub_check_game.mjs <게임 id(slug)> [--json] [--online] [--raw <캡처 폴더>] [--root <허브 저장소>] [--games-repo <kein-web-games>]' + (args.unknown ? `\n알 수 없는 옵션: ${args.unknown}` : ''));
  process.exit(2);
}
const ROOT = path.resolve(args.root || HERE);
const GAMES = path.resolve(args['games-repo'] || path.join(os.homedir(), 'Projects/kein-web-games'));
const rep = new Report(`웹게임 허브 소개 점검: ${id}`);
const out = (extra = {}) => {
  if (args.json) console.log(JSON.stringify(rep.toJSON(extra), null, 1)); else console.log(rep.text(extra.footer || ''));
  process.exit(rep.failed ? 1 : 0);
};
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// games.json 메타(장르·존재 여부)
let meta = null, all = null;
const gj = path.join(GAMES, 'src/games.json');
if (fs.existsSync(gj)) { all = rd(gj); meta = all.find(g => g.slug === id) || null; }

const file = path.join(ROOT, AUTH_DIR, `${id}.json`);
const prog = (() => { try { return readProgress(ROOT); } catch { return {excluded: []}; } })();
const excl = (prog.excluded || []).find(x => x.id === id);

if (!fs.existsSync(file)) {
  if (excl) {
    rep.add('info', '제외 확정', `data/authoring/games/_progress.json 에 제외로 기록됨: ${excl.reason}`);
    rep.add('info', '허브 동작', '이 게임은 허브 웹게임 목록에 나오지 않는다(excluded.json 에 사유가 남는다)');
    out({excluded: true});
  }
  rep.add('fail', '편집 원본 파일', `${AUTH_DIR}/${id}.json 이 없다 — 제외 예정(이대로면 이 게임은 허브 소개 페이지가 만들어지지 않는다)`,
    `직접 실행해 확인한 사실이 충분하면 docs/AUTHORING_GAMES.md 의 템플릿으로 ${AUTH_DIR}/${id}.json 을 쓴다. 사실이 부족해 쓰지 않기로 했다면 ${AUTH_DIR}/_progress.json 의 excluded 에 {"id": "${id}", "reason": "…", "evidence": "…"} 를 추가하고 이 점검을 다시 돌린다(제외 확정)`);
  if (meta) {
    try {
      const f = collectGame(os.homedir(), GAMES, meta);
      rep.add('info', '소스 추출 폴백', gameEligible(meta, f) ? `편집 원본이 없어도 소스(README·설계 문서)에서 ${gameFactChars(meta, f)}자의 사실이 확인되어 기존 방식 소개글이 만들어질 수 있다(이미지 필요)` : `소스에서 확인되는 사실 ${gameFactChars(meta, f)}자 — 기준(170자 + 조작·규칙·진행 중 하나)에 못 미쳐 제외된다`);
    } catch (e) { rep.add('skip', '소스 추출 폴백 확인', e.message); }
  } else if (all) rep.add('warn', 'games.json', `${id} 가 kein-web-games/src/games.json 에 없다(legacy 이거나 slug 오타)`, 'slug 철자를 games.json 과 맞춘다');
  out({excluded: false, footer: ''});
}

// 1. 파싱
let a;
try { a = rd(file); rep.add('ok', '편집 원본 파일', `${AUTH_DIR}/${id}.json`); } catch (e) { rep.add('fail', 'JSON 문법', e.message, 'JSON 문법(따옴표·쉼표·이스케이프)을 고친다. docs/AUTHORING_GAMES.md 템플릿을 복사해 시작하면 안전하다'); out(); }
if (excl) rep.add('warn', '제외 목록 중복', '_progress.json 의 제외 목록에도 이 게임이 있다 — 제외가 이긴다', `쓸 거면 _progress.json 에서 ${id} 항목을 지운다`);

// 2. games.json 메타·장르
if (!all) rep.add('skip', 'games.json 메타', `${gj} 가 없다 — kein-web-games 위치를 --games-repo 로 알려 준다`);
else if (!meta) rep.add('fail', 'games.json 메타', `${id} 가 games.json 에 없거나 legacy 이다`, 'slug 가 kein-web-games/src/games.json 의 slug 와 같아야 한다(파일명 = slug = id)');
else {
  const genre = meta.categories?.[0];
  if (GENRE_IDS[genre]) rep.add('ok', '장르', `${genre} → 허브 장르 ${GENRE_IDS[genre][0]}`);
  else rep.add('fail', '장르', `games.json 의 첫 카테고리 '${genre}' 는 허브 허용 장르가 아니다(허용: ${Object.keys(GENRE_IDS).join('·')})`, `scripts/lib/games_authoring.mjs 의 GENRE_IDS 에 '${genre}' 를 추가한다(영문 라벨 포함) — 허브 저장소 담당에게 요청`);
}

// 3. 편집 원본 검증(허브 빌드와 같은 함수) — 항목별로 묶어 보여 준다
const errs = validateAuthoring(id, a).map(e => e.replace(`${id}: `, ''));
// 오류 하나는 처음 맞는 묶음에만 들어간다(순서가 의미 있다)
const GROUPS = [
  ['금지어(1인칭·이모지·원문·기즈모·내부 공정 용어)', /1인칭|이모지|원문|내부 공정/],
  [`본문 길이(${MIN_BODY}자 이상)`, /^본문 /],
  ['verified(직접 실행 관찰 메모)', /^verified/],
  ['이미지 정의(2~4장·역할·alt)', /^images|^cardIndex|^타이틀 외에/],
  ['필수 필드(oneLiner·about·controls·goal·rules·progress·tips·screens)', /필수|배열|^tips|^controls|^id 가|JSON 객체/]];
const used = new Set();
for (const [label, re] of GROUPS) {
  const m = errs.filter(e => !used.has(e) && re.test(e)); m.forEach(e => used.add(e));
  const detail = label.startsWith('본문') ? `현재 ${bodyChars(a)}자` : '';
  if (m.length) m.forEach(e => rep.add('fail', label, e, e.includes('→') ? e.split('→')[1].trim() : '위 사유를 고친다')); else rep.add('ok', label, detail);
}
for (const e of errs.filter(e => !used.has(e))) rep.add('fail', '기타', e, '위 사유를 고친다');

// 4. 이미지: 매니페스트·webp 파일·크기 예산(캡처 PNG 는 저장소에 없으므로 --raw 를 주면 존재만 본다)
const imgPath = path.join(ROOT, 'content-src/images.json');
let man = null;
try { man = rd(imgPath).games?.[id] || null; } catch { /* 매니페스트 없음 */ }
if (Array.isArray(a.images) && a.images.length) {
  const ip = imageProblems(ROOT, id, a, man).map(e => e.replace(`${id}: `, ''));
  if (ip.length) ip.forEach(e => rep.add('fail', '이미지 파일·매니페스트', e, e.includes('→') ? e.split('→')[1].trim() : '위 사유를 고친다'));
  else {
    rep.add('ok', '이미지 파일·매니페스트', `images[].src ${a.images.length}장 ↔ assets/content/games/${id}{,-hero,-1..${a.images.length - 1}}.webp 일치, 크기 예산(카드 ${IMG_BUDGET.card / 1024}KB·대표 ${IMG_BUDGET.hero / 1024}KB·화면 ${IMG_BUDGET.shot / 1024}KB) 이내`);
    if (man.card?.join('x') !== '640x400') rep.add('fail', '카드 이미지 크기', `${man.card} ≠ 640x400`, 'build_content_images.mjs 로 다시 만든다');
    if (!man.hero || man.hero[0] > 1280) rep.add('fail', '대표 이미지 크기', `${man.hero} — 폭 1280 이하여야 한다`, 'build_content_images.mjs 로 다시 만든다');
  }
  if (args.raw) {
    const miss = a.images.map(x => x.src).filter(f => !fs.existsSync(path.join(args.raw, f)));
    if (miss.length) rep.add('fail', '캡처 원본(--raw)', `${args.raw} 에 없음: ${miss.join(', ')}`, '캡처 PNG 파일명을 images[].src 와 맞춘다');
    else rep.add('ok', '캡처 원본(--raw)', '모든 PNG 존재');
  } else rep.add('skip', '캡처 원본', '캡처 PNG 는 저장소 밖에 있다 — 확인하려면 --raw <캡처 폴더>');
} else rep.add('skip', '이미지 파일·매니페스트', 'images 정의가 없어 확인하지 못함');

// 5. url
const url = `https://games.kimjinwan.com/play/${id}/`;
if (args.online) {
  try {
    const r = await fetch(url, {redirect: 'follow', signal: AbortSignal.timeout(15000)});
    if (r.status === 200) rep.add('ok', '게임 주소(--online)', `${url} → 200`);
    else rep.add('fail', '게임 주소(--online)', `${url} → HTTP ${r.status}`, '게임이 실제로 배포되어 있는지(slug·공개 상태) 확인한다. 배포 전이면 소개를 올리지 않는다');
  } catch (e) { rep.add('fail', '게임 주소(--online)', `${url} 에 연결 못 함: ${e.message}`, '네트워크를 확인하거나 배포 여부를 확인한다'); }
} else rep.add('skip', '게임 주소', `${url} (200 확인은 --online)`);

// 6. 허브 반영 상태(안내)
const built = fs.existsSync(path.join(ROOT, `content-src/games/${id}.json`));
rep.add('info', '허브 반영', built ? '스냅샷(content-src/games)에 이미 반영됨' : '아직 스냅샷에 없음 — 매일 06:30 content-hub-sync 의 허브 빌드에서 반영된다');
out({footer: rep.failed ? '' : `커밋할 경로: ${AUTH_DIR}/${id}.json · assets/content/games/${id}*.webp · content-src/images.json`});
