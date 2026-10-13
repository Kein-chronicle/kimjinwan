// scripts/hub_check_app.mjs — 내 앱 한 개의 허브 소개(편집 원본)가 올라갈 수 있는 상태인지 점검한다. 앱을 허브에 올리는 사람이 편집 원본을 쓴 뒤 스스로 확인하는 용도.
//   cd ~/Projects/kimjinwan && node scripts/hub_check_app.mjs <slug> [--json] [--online] [--root <허브 저장소>]
// 종료 코드: 0 = 통과(또는 _progress.json 에 제외가 기록됨), 1 = 실패(고칠 것이 있음), 2 = 사용법 오류.
// 규칙의 단일 출처는 scripts/lib/apps_authoring.mjs(validateApp·imageProblems) — 허브 빌드와 이 점검이 같은 함수를 쓴다. 필드 정의·작성 기준은 docs/AUTHORING_APPS.md.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Report, parseArgs} from './lib/check_report.mjs';
import {validateApp, imageProblems, readProgress, readStore, AUTH_DIR, MIN_BODY, IMG_BUDGET, APP_CATEGORIES, bodyChars, storeUrl, SRC_RE} from './lib/apps_authoring.mjs';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2), ['--root'], ['--json', '--online']);
const slug = args._[0];
if (!slug || args.unknown || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('사용법: node scripts/hub_check_app.mjs <앱 slug> [--json] [--online] [--root <허브 저장소>]' + (args.unknown ? `\n알 수 없는 옵션: ${args.unknown}` : ''));
  process.exit(2);
}
const ROOT = path.resolve(args.root || HERE);
const rep = new Report(`내 앱 허브 소개 점검: ${slug}`);
const out = (extra = {}) => {
  if (args.json) console.log(JSON.stringify(rep.toJSON(extra), null, 1)); else console.log(rep.text(extra.footer || ''));
  process.exit(rep.failed ? 1 : 0);
};
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const file = path.join(ROOT, AUTH_DIR, `${slug}.json`);
const prog = (() => { try { return readProgress(ROOT); } catch { return {excluded: []}; } })();
const excl = (prog.excluded || []).find(x => x.id === slug);

if (!fs.existsSync(file)) {
  if (excl) {
    rep.add('info', '제외 확정', `${AUTH_DIR}/_progress.json 에 제외로 기록됨: ${excl.reason}`);
    rep.add('info', '허브 동작', '이 앱은 허브 내 앱 목록에 나오지 않는다(excluded.json 에 사유가 남는다)');
    out({excluded: true});
  }
  rep.add('fail', '편집 원본 파일', `${AUTH_DIR}/${slug}.json 이 없다 — 이대로면 이 앱은 허브 소개 페이지가 만들어지지 않는다`,
    `확인되는 사실이 충분하면 docs/AUTHORING_APPS.md 의 템플릿으로 ${AUTH_DIR}/${slug}.json 을 쓴다. 사실이 부족해 쓰지 않기로 했다면 ${AUTH_DIR}/_progress.json 의 excluded 에 {"id": "${slug}", "reason": "…"} 를 추가하고 이 점검을 다시 돌린다(제외 확정)`);
  out({excluded: false});
}

let a;
try { a = rd(file); rep.add('ok', '편집 원본 파일', `${AUTH_DIR}/${slug}.json`); } catch (e) { rep.add('fail', 'JSON 문법', e.message, 'JSON 문법(따옴표·쉼표·이스케이프)을 고친다. docs/AUTHORING_APPS.md 템플릿을 복사해 시작하면 안전하다. 본문 안의 큰따옴표는 작은따옴표로 쓴다'); out(); }
if (excl) rep.add('warn', '제외 목록 중복', '_progress.json 의 제외 목록에도 이 앱이 있다 — 제외가 이긴다', `쓸 거면 _progress.json 에서 ${slug} 항목을 지운다`);

// 스토어 캐시: live 앱은 캐시에 storeId 가 있어야 한다
const store = readStore(ROOT), st = store.apps[String(a.storeId)] || null;
if (!store.as_of) rep.add('skip', '스토어 캐시', 'content-src/apps-store.json 이 없다 → node scripts/build_content_apps.mjs --refresh-store');
else if (a.status === 'live') {
  if (st) rep.add('ok', '스토어 캐시', `id${a.storeId} = ${st.name} (v${st.version}, ${st.genre}, 기준 ${store.as_of})`);
  else rep.add('fail', '스토어 캐시', `id${a.storeId} 가 캐시에 없다(스토어에서 내려갔거나 ID 오타)`, 'node scripts/build_content_apps.mjs --refresh-store 로 캐시를 갱신한다. 그래도 없으면 storeId·status 를 고친다(스토어에 없는 앱은 live 로 올릴 수 없다)');
  if (st && a.name !== st.name) rep.add('warn', '앱 이름', `name '${a.name}' ≠ 스토어 이름 '${st.name}'`, '스토어에 등록된 이름 그대로 쓴다');
} else rep.add('info', '스토어 캐시', `status ${a.status} — 스토어에 아직 없는 앱은 스토어 버튼 없이 '심사 중'으로 표시된다`);

// 편집 원본 검증(허브 빌드와 같은 함수) — 항목별로 묶어 보여 준다
const errs = validateApp(slug, a, {store: st}).map(e => e.replace(`${slug}: `, ''));
const GROUPS = [
  ['금지어(1인칭·이모지·원문·기즈모·내부 공정 용어)', /1인칭|이모지|원문|내부 공정/],
  [`본문 길이(${MIN_BODY}자 이상)`, /^본문 /],
  ['verified(확인 근거)', /^verified/],
  ['이미지 정의(아이콘 1장 + 화면 2~4장·src 형식·alt)', /^images|^role|^icon|images\[/],
  ['스토어 연결(storeId·status)', /storeId|status 가|스토어 캐시/],
  ['필수 필드(oneLiner·about·audience·features·howTo·notes)', /필수|배열|^oneLiner|^about|^audience|^category|^name|^slug|JSON 객체|guide/]];
const used = new Set();
for (const [label, re] of GROUPS) {
  const m = errs.filter(e => !used.has(e) && re.test(e)); m.forEach(e => used.add(e));
  const detail = label.startsWith('본문') ? `현재 ${bodyChars(a)}자` : '';
  if (m.length) m.forEach(e => rep.add('fail', label, e, e.includes('→') ? e.split('→')[1].trim() : '위 사유를 고친다')); else rep.add('ok', label, detail);
}
for (const e of errs.filter(e => !used.has(e))) rep.add('fail', '기타', e, '위 사유를 고친다');
if (a.category && !APP_CATEGORIES.some(c => c.id === a.category)) rep.add('info', '분류 추가', `새 분류가 필요하면 scripts/lib/apps_authoring.mjs 의 APP_CATEGORIES 에 추가한다(허브 저장소 담당)`);

// 이미지: 매니페스트·webp 파일·크기 예산
let man = null;
try { man = rd(path.join(ROOT, 'content-src/images.json')).apps?.[slug] || null; } catch { /* 매니페스트 없음 */ }
if (Array.isArray(a.images) && a.images.length) {
  const ip = imageProblems(ROOT, slug, a, man).map(e => e.replace(`${slug}: `, ''));
  if (ip.length) ip.forEach(e => rep.add('fail', '이미지 파일·매니페스트', e, e.includes('→') ? e.split('→')[1].trim() : '위 사유를 고친다'));
  else rep.add('ok', '이미지 파일·매니페스트', `images[].src ${a.images.length}장 ↔ assets/content/apps/${slug}{-icon,-1..${a.images.length - 1}}.webp 일치, 크기 예산(아이콘 ${IMG_BUDGET.icon / 1024}KB·화면 ${IMG_BUDGET.shot / 1024}KB) 이내`);
  const bad = a.images.filter(x => !SRC_RE.test(x.src || ''));
  if (!bad.length && a.images.some(x => x.src.startsWith('catalog:'))) rep.add('info', '이미지 원본', 'catalog: 원본은 앱 공장 카탈로그가 있을 때만 변환기가 읽는다 — 이미 만든 webp 가 있으면 문제없다');
} else rep.add('skip', '이미지 파일·매니페스트', 'images 정의가 없어 확인하지 못함');

// 스토어 주소
const url = storeUrl(a.storeId);
if (args.online) {
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${a.storeId}&country=kr`, {signal: AbortSignal.timeout(15000)}), j = await r.json();
    if (j.resultCount > 0) rep.add('ok', '스토어 조회(--online)', `${j.results[0].trackName} — ${url}`);
    else rep.add(a.status === 'live' ? 'fail' : 'info', '스토어 조회(--online)', `iTunes lookup(kr) 0건 — 심사 상태 미확인`, a.status === 'live' ? '스토어에 없는 앱은 live 로 올리지 않는다(status 를 in_review 로 하거나 제외)' : '');
  } catch (e) { rep.add('fail', '스토어 조회(--online)', `연결 못 함: ${e.message}`, '네트워크를 확인한다'); }
} else rep.add('skip', '스토어 조회', `${url} (공개 조회는 --online)`);

const built = fs.existsSync(path.join(ROOT, `content-src/apps/${slug}.json`));
rep.add('info', '허브 반영', built ? '스냅샷(content-src/apps)에 이미 반영됨' : '아직 스냅샷에 없음 — node scripts/build_content_apps.mjs 로 만든다(전체 발행은 scripts/publish.sh)');
out({footer: rep.failed ? '' : `커밋할 경로: ${AUTH_DIR}/${slug}.json · assets/content/apps/${slug}*.webp · content-src/images.json`});
