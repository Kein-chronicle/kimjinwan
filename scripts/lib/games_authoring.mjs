// scripts/lib/games_authoring.mjs — 웹게임 소개의 편집 원본(data/authoring/games/<id>.json) 읽기·검증·합치기.
// 이 파일들이 SSOT 이다: 손으로 쓴 소개 필드 + 직접 실행한 관찰 메모(verified) + 이미지 목록. 필드 정의와 작성 기준은 docs/AUTHORING_GAMES.md.
// games.json(kein-web-games)에서는 장르·한 판 길이·조작 라벨·화면 방향 같은 메타만 가져오고, 서술은 전부 편집 원본에서 온다. 사실이 충돌하면 관찰 결과(편집 원본)가 이긴다.
import fs from 'node:fs';
import path from 'node:path';

export const GENRE_IDS = {퍼즐: ['puzzle', 'Puzzle'], 액션: ['action', 'Action'], 전략: ['strategy', 'Strategy'], 아케이드: ['arcade', 'Arcade'], 단어: ['word', 'Word'], 리듬: ['rhythm', 'Rhythm'], 운영: ['ops', 'Operations'], 훈련: ['training', 'Training'], 보드: ['board', 'Board'], 육성: ['raising', 'Raising']};
export const MIN_BODY = 500;
export const AUTH_DIR = 'data/authoring/games';
const SCALAR = ['oneLiner', 'about', 'goal', 'screens'];
const LISTS = {rules: 2, progress: 1, tips: 2};
const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
const EMOJI = /\p{Extended_Pictographic}/u;
const BAD_WORDS = /원문|기즈모|gizmo/i;

// 본문 전체(검증·길이·중복 검사 대상). 순서는 화면 순서와 같다.
export function bodyParts(a) {
  return [a.oneLiner, a.about, ...(a.controls?.pc || []), ...(a.controls?.touch || []), a.goal, ...(a.rules || []), ...(a.progress || []), ...(a.tips || []), a.screens].filter(Boolean);
}
export const bodyText = a => bodyParts(a).join(' ');
export const bodyChars = a => bodyText(a).replace(/\s+/g, '').length;
export const sentences = a => bodyParts(a).flatMap(p => p.split(/(?<=[.!?。])\s+/)).map(s => s.trim()).filter(s => s.length > 8);

export function validateAuthoring(id, a) {
  const e = [];
  const w = m => e.push(`${id}: ${m}`);
  if (a.id !== id) w(`id 가 파일명과 다르다(${a.id})`);
  for (const k of SCALAR) if (typeof a[k] !== 'string' || !a[k].trim()) w(`${k} 필수`);
  for (const [k, min] of Object.entries(LISTS)) if (!Array.isArray(a[k]) || a[k].length < min || a[k].some(x => typeof x !== 'string' || !x.trim())) w(`${k} 은 문장 ${min}개 이상 배열`);
  if (Array.isArray(a.tips) && (a.tips.length < 2 || a.tips.length > 3)) w('tips 는 2~3개');
  if (!a.controls || (!(a.controls.pc || []).length && !(a.controls.touch || []).length)) w('controls.pc / controls.touch 중 하나 이상 필요');
  const v = a.verified;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v.date || '') || !v.method || !Array.isArray(v.notes) || v.notes.length < 2) w('verified {date, method, notes[2+]} 필수');
  const im = a.images;
  if (!Array.isArray(im) || im.length < 2 || im.length > 4) w('images 는 2~4장');
  else {
    if (!im.some((x, i) => i > 0 && ['play', 'result'].includes(x.role))) w('타이틀 외에 플레이 중/결과 화면이 1장 이상 필요');
    for (const x of im) { if (!x.src || !x.alt || x.alt.length < 12 || !['title', 'play', 'result'].includes(x.role)) w(`images 항목은 {src, role(title|play|result), alt 12자+}: ${JSON.stringify(x)}`); }
    if (a.cardIndex !== undefined && !(a.cardIndex in im)) w('cardIndex 범위 밖');
  }
  const text = bodyText(a);
  if (BAN.test(text)) w('1인칭(제가·저는 …) 금지');
  if (EMOJI.test(text)) w('이모지 금지');
  if (BAD_WORDS.test(text + JSON.stringify(a.verified || {}))) w("'원문'·'기즈모' 어휘 금지");
  if (bodyChars(a) < MIN_BODY) w(`본문 ${bodyChars(a)}자 < ${MIN_BODY}자`);
  return e;
}

export function readAuthoring(root) {
  const dir = path.join(root, AUTH_DIR), out = new Map();
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort()) out.set(f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  return out;
}
export const readProgress = root => {
  const f = path.join(root, AUTH_DIR, '_progress.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {excluded: []};
};

// games.json 메타 + 편집 원본 → 콘텐츠 허브의 games 섹션 + content-src/games/<id>.json 맵 + 제외 목록
export function buildGames({root, all, asOf, images, pendingOk = false}) {
  const auth = readAuthoring(root), prog = readProgress(root);
  const excludedIds = new Map((prog.excluded || []).map(x => [x.id, x]));
  const extra = new Map(), excluded = [], errors = [], groups = new Map(); let n = 0;
  for (const g of all) {
    const a = auth.get(g.slug), ex = excludedIds.get(g.slug);
    if (ex) { if (a) errors.push(`${g.slug}: 제외 목록과 편집 원본이 동시에 있다`); excluded.push({id: g.slug, reason: ex.reason, evidence: ex.evidence}); continue; }
    if (!a) { if (!pendingOk) errors.push(`${g.slug}: 편집 원본도 제외 사유도 없다(미처리)`); excluded.push({id: g.slug, reason: '작성 대기(아직 직접 실행·관찰하지 않음)'}); continue; }
    errors.push(...validateAuthoring(g.slug, a));
    if (!images.games?.[g.slug]) { errors.push(`${g.slug}: 이미지 매니페스트 없음(node scripts/build_content_images.mjs 실행)`); continue; }
    const genre = g.categories?.[0]; if (!GENRE_IDS[genre]) throw new Error(`game ${g.slug}: unknown genre ${genre} — add it to GENRE_IDS`);
    const fact = {slug: g.slug, title: {ko: g.titleKo || g.title, en: g.title}, categories: g.categories || [], tags: g.tags || [], controlLabels: g.controls || [], orientation: g.orientation, session: g.session,
      oneLiner: a.oneLiner, about: a.about, controls: a.controls, goal: a.goal, rules: a.rules, progress: a.progress, tips: a.tips, screens: a.screens, verified: a.verified, images: a.images.map(({role, alt}) => ({role, alt}))};
    extra.set(`content-src/games/${g.slug}.json`, fact);
    const [gid, gen] = GENRE_IDS[genre];
    if (!groups.has(gid)) groups.set(gid, {id: gid, label: {ko: genre, en: gen}, items: []});
    groups.get(gid).items.push({slug: g.slug, title: fact.title, summary: a.oneLiner, session: g.session, controls: g.controls || [], url: `https://games.kimjinwan.com/play/${g.slug}/`}); n++;
  }
  for (const id of auth.keys()) if (!all.some(g => g.slug === id)) errors.push(`${id}: games.json 에 없는 편집 원본`);
  const section = {id: 'games', url: 'https://games.kimjinwan.com/', count: {value: n, total: all.length, as_of: asOf, source: `kein-web-games/src/games.json(legacy 제외 ${all.length}개) 중 직접 실행해 플레이를 확인한 ${n}개. 서술은 허브 편집 원본 data/authoring/games/<id>.json(관찰 메모 verified 포함), 메타(장르·한 판 길이·조작 라벨)는 games.json. 이미지는 content-src/images.json`},
    groups: [...groups.values()].sort((x, y) => y.items.length - x.items.length || x.id.localeCompare(y.id))};
  return {section, extra, excluded, errors};
}
