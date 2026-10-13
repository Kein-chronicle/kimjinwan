// scripts/lib/games_authoring.mjs — 웹게임 소개 만들기(하이브리드): 편집 원본(data/authoring/games/<id>.json) 우선, 없으면 기존 소스 추출(hub_sources.mjs).
// 편집 원본 = 손으로 쓴 소개 필드 + 직접 실행한 관찰 메모(verified) + 이미지 목록. 필드 정의·작성 기준은 docs/AUTHORING_GAMES.md.
// games.json(kein-web-games)에서는 장르·한 판 길이·조작 라벨·화면 방향 같은 메타만 가져오고, 서술은 편집 원본(또는 소스 추출)에서 온다. 사실이 충돌하면 관찰 결과(편집 원본)가 이긴다.
// 편집 원본이 검증을 통과하지 못하거나 이미지가 맞지 않으면 그 게임은 편집 원본을 쓰지 않고(경고를 낸다) 소스 추출로 되돌아간다 — 허브 전체 빌드는 멈추지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {collectGame, gameFactChars, gameEligible, INTERNAL} from './hub_sources.mjs';

// 장르(games.json categories[0]) → [허브 장르 id, 영문 라벨]. 기존 id 는 URL(/content/games/genre/<id>/)이라 바꾸지 않는다. 새 장르는 여기에 추가.
export const GENRE_IDS = {
  보드: ['board', 'Board'], 퍼즐: ['puzzle', 'Puzzle'], 액션: ['action', 'Action'], 전략: ['strategy', 'Strategy'], 아케이드: ['arcade', 'Arcade'], 시뮬레이션: ['sim', 'Simulation'], 경영: ['management', 'Management'],
  캐주얼: ['casual', 'Casual'], 롤플레잉: ['rpg', 'RPG'], 단어: ['word', 'Word'], 리듬: ['rhythm', 'Rhythm'], 운영: ['ops', 'Operations'], 훈련: ['training', 'Training'], 육성: ['raising', 'Raising']};
export const MIN_BODY = 500;
export const AUTH_DIR = 'data/authoring/games';
// 이미지 크기 예산(바이트). 변환기(build_content_images.mjs)와 점검 CLI 가 같은 값을 쓴다.
export const IMG_BUDGET = {card: 40 * 1024, hero: 150 * 1024, shot: 150 * 1024};
export const IMG_ROLES = ['title', 'play', 'result'];
const SCALAR = ['oneLiner', 'about', 'goal', 'screens'];
const LISTS = {rules: 2, progress: 1, tips: 2};
export const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
export const EMOJI = /\p{Extended_Pictographic}/u;
export const BAD_WORDS = /원문|기즈모|gizmo/i;
const nw = v => (typeof v === 'string' ? v.replace(/원문/g, '원본') : Array.isArray(v) ? v.map(nw) : v);

// 본문 전체(검증·길이·중복 검사 대상). 순서는 화면 순서와 같다.
export function bodyParts(a) {
  return [a.oneLiner, a.about, ...(a.controls?.pc || []), ...(a.controls?.touch || []), a.goal, ...(a.rules || []), ...(a.progress || []), ...(a.tips || []), a.screens].filter(Boolean);
}
export const bodyText = a => bodyParts(a).join(' ');
export const bodyChars = a => bodyText(a).replace(/\s+/g, '').length;
export const sentences = a => bodyParts(a).flatMap(p => p.split(/(?<=[.!?。])\s+/)).map(s => s.trim()).filter(s => s.length > 8);
export const altText = a => (Array.isArray(a.images) ? a.images : []).map(x => x?.alt || '').join(' ');

// 편집 원본 한 개의 검증. 오류 문자열 배열(비면 통과). 모든 메시지는 "<id>: 무엇이 문제 → 어떻게 고치나" 형식.
export function validateAuthoring(id, a) {
  const e = [];
  const w = m => e.push(`${id}: ${m}`);
  if (!a || typeof a !== 'object') return [`${id}: JSON 객체가 아니다 → 문서의 템플릿을 복사해 다시 쓴다`];
  if (a.id !== id) w(`id 가 파일명과 다르다(${a.id}) → "id": "${id}" 로 맞춘다`);
  for (const k of SCALAR) if (typeof a[k] !== 'string' || !a[k].trim()) w(`${k} 필수(문자열) → 채운다`);
  for (const [k, min] of Object.entries(LISTS)) if (!Array.isArray(a[k]) || a[k].length < min || a[k].some(x => typeof x !== 'string' || !x.trim())) w(`${k} 은 문장 ${min}개 이상 배열 → 문장을 추가한다`);
  if (Array.isArray(a.tips) && (a.tips.length < 2 || a.tips.length > 3)) w('tips 는 2~3개 → 개수를 맞춘다');
  const c = a.controls;
  if (!c || (!(c.pc || []).length && !(c.touch || []).length)) w('controls.pc / controls.touch 중 하나 이상 필요 → 실제로 확인한 입력 방식을 적는다');
  else for (const k of ['pc', 'touch']) if (c[k] !== undefined && (!Array.isArray(c[k]) || c[k].some(x => typeof x !== 'string' || !x.trim()))) w(`controls.${k} 는 문자열 배열이어야 한다`);
  const v = a.verified;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v.date || '') || typeof v.method !== 'string' || !v.method.trim() || !Array.isArray(v.notes) || v.notes.length < 2 || v.notes.some(x => typeof x !== 'string' || !x.trim()))
    w('verified {date(YYYY-MM-DD), method, notes[2개 이상]} 필수 → 직접 실행한 방법과 관찰 결과를 적는다(확인 못 한 것도 notes 에 적는다)');
  const im = a.images;
  if (!Array.isArray(im) || im.length < 2 || im.length > 4) w('images 는 2~4장 → 캡처를 2~4장으로 맞춘다');
  else {
    if (!im.some((x, i) => i > 0 && ['play', 'result'].includes(x.role))) w('타이틀 외에 플레이 중/결과 화면이 1장 이상 필요 → role 이 play 또는 result 인 캡처를 추가한다');
    if (new Set(im.map(x => x.src)).size !== im.length) w('images[].src 가 중복된다');
    for (const x of im) if (!x.src || !/^[\w.-]+\.png$/.test(x.src) || !x.alt || x.alt.length < 12 || !IMG_ROLES.includes(x.role)) w(`images 항목은 {src(파일명.png), role(title|play|result), alt 12자 이상}: ${JSON.stringify(x)}`);
    if (a.cardIndex !== undefined && !(Number.isInteger(a.cardIndex) && a.cardIndex in im)) w('cardIndex 범위 밖 → 0~images.length-1 정수');
  }
  const text = bodyText(a) + ' ' + altText(a);
  if (BAN.test(text)) w('1인칭(제가·저는 …) 금지 → 서술형 평서문으로 고친다');
  if (EMOJI.test(text)) w('이모지 금지 → 지운다');
  if (BAD_WORDS.test(text + JSON.stringify(a.verified || {}))) w("'원문'·'기즈모' 어휘 금지(verified 포함) → '원본' 등으로 바꾼다");
  const bad = text.match(INTERNAL);
  if (bad) w(`내부 공정 용어('${bad[0]}') 금지 → 플레이어가 쓰는 말로 바꾼다(본문·이미지 설명에만 적용, verified 는 화면에 안 나온다)`);
  if (bodyChars(a) < MIN_BODY) w(`본문 ${bodyChars(a)}자 < ${MIN_BODY}자 → 실제로 확인한 내용을 ${MIN_BODY - bodyChars(a)}자 이상 더 쓴다. 쓸 사실이 모자라면 억지로 늘리지 말고 제외(_progress.json)한다`);
  return e;
}

// 이미지 매니페스트(content-src/images.json 의 games[id])·실제 webp 파일이 편집 원본과 맞는지. 문제 문자열 배열(비면 맞음).
export function imageProblems(root, id, a, rec, budget = IMG_BUDGET) {
  const p = [], n = (a.images || []).length;
  if (!rec) return [`${id}: 이미지 매니페스트 없음 → node scripts/build_content_images.mjs --raw <캡처 폴더> 를 실행한다`];
  const srcs = (a.images || []).map(x => x.src), cardI = a.cardIndex ?? Math.max(1, (a.images || []).findIndex(x => x.role !== 'title'));
  if (rec.from !== JSON.stringify({srcs, cardI})) p.push(`${id}: 이미지 매니페스트가 편집 원본의 images[].src·cardIndex 와 다르다 → build_content_images.mjs --raw <캡처 폴더> 를 다시 실행한다`);
  if ((rec.shots || []).length !== n - 1) p.push(`${id}: 플레이 화면 ${(rec.shots || []).length}장 ≠ images ${n - 1}장 → build_content_images.mjs 를 다시 실행한다`);
  const files = [[`${id}.webp`, budget.card], [`${id}-hero.webp`, budget.hero], ...srcs.slice(1).map((_, i) => [`${id}-${i + 1}.webp`, budget.shot])];
  for (const [f, max] of files) {
    const fp = path.join(root, 'assets/content/games', f);
    if (!fs.existsSync(fp)) { p.push(`${id}: assets/content/games/${f} 없음 → build_content_images.mjs 를 실행한다`); continue; }
    const sz = fs.statSync(fp).size;
    if (sz > max) p.push(`${id}: ${f} ${(sz / 1024).toFixed(0)}KB > ${(max / 1024).toFixed(0)}KB → 캡처를 단순화해 다시 만든다`);
  }
  return p;
}

export function readAuthoring(root) {
  const dir = path.join(root, AUTH_DIR), out = new Map();
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort()) {
    try { out.set(f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch (e) { out.set(f.slice(0, -5), {__parseError: e.message}); }
  }
  return out;
}
export const readProgress = root => {
  const f = path.join(root, AUTH_DIR, '_progress.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {excluded: []};
};

// 소스 추출(기존 방식 그대로): games.json + kein-game-forge/README/설계 문서에서 소개 사실을 모은다. 반환 {fact} | {reason}
function legacyFact({home, gamesRepo, g, images}) {
  const f = collectGame(home, gamesRepo, g);
  if (!gameEligible(g, f)) return {reason: `소스에서 확인되는 사실 부족(${gameFactChars(g, f)}자 — 기준 170자와 조작·규칙·진행 상세 중 하나 이상 미달)`};
  if (!images.games?.[g.slug]) return {reason: '이미지 없음(build_content_images.mjs 를 먼저 실행)'};
  const fact = {slug: g.slug, title: {ko: g.titleKo || g.title, en: g.title}, description: nw(g.description), categories: g.categories || [], tags: g.tags || [], controls: g.controls || [], orientation: g.orientation, session: g.session,
    lead: nw(f.lead), pitch: nw(f.pitch), subtitle: nw(f.subtitle), stageCount: f.stageCount, controlsDetail: nw(f.controlsDetail), rules: nw(f.rules), progress: nw(f.progress), stageGuides: nw(f.stageGuides)};
  for (const k of Object.keys(fact)) if (fact[k] === undefined || (Array.isArray(fact[k]) && !fact[k].length && !['categories', 'tags', 'controls'].includes(k))) delete fact[k];
  return {fact, summary: nw(g.description)};
}

// 편집 원본 → 상세 페이지 사실 객체. 구분 표지는 verified(= 편집 원본 형태): render.gameBody 가 이것으로 갈린다.
function authoredFact(g, a) {
  return {slug: g.slug, title: {ko: g.titleKo || g.title, en: g.title}, description: a.oneLiner, categories: g.categories || [], tags: g.tags || [], controlLabels: g.controls || [], orientation: g.orientation, session: g.session,
    oneLiner: a.oneLiner, about: a.about, controls: a.controls, goal: a.goal, rules: a.rules, progress: a.progress, tips: a.tips, screens: a.screens, verified: a.verified, images: a.images.map(({role, alt}) => ({role, alt}))};
}

// games.json 메타 + 편집 원본(우선) + 소스 추출(폴백) → 콘텐츠 허브의 games 섹션 + content-src/games/<id>.json 맵 + 제외 목록 + 경고
// 경고가 있어도 빌드는 계속된다(해당 게임만 편집 원본을 안 쓴다). 경고 = 공장이 고쳐야 할 것.
export function buildGames({root, all, asOf, images, home, gamesRepo}) {
  const auth = readAuthoring(root), prog = readProgress(root);
  const exclMap = new Map((prog.excluded || []).map(x => [x.id, x]));
  const extra = new Map(), excluded = [], warnings = [], groups = new Map(), sources = {authored: [], legacy: []}; let n = 0;
  const put = (g, fact, summary) => {
    const genre = g.categories?.[0]; if (!GENRE_IDS[genre]) throw new Error(`game ${g.slug}: unknown genre ${genre} — add it to GENRE_IDS (scripts/lib/games_authoring.mjs)`);
    extra.set(`content-src/games/${g.slug}.json`, fact);
    const [gid, gen] = GENRE_IDS[genre];
    if (!groups.has(gid)) groups.set(gid, {id: gid, label: {ko: genre, en: gen}, items: []});
    groups.get(gid).items.push({slug: g.slug, title: fact.title, summary, session: g.session, controls: g.controls || [], url: `https://games.kimjinwan.com/play/${g.slug}/`}); n++;
  };
  for (const g of all) {
    const a = auth.get(g.slug), ex = exclMap.get(g.slug);
    if (ex) {
      if (a) warnings.push(`${g.slug}: _progress.json 제외 목록과 편집 원본이 동시에 있다 → 둘 중 하나만 둔다(제외가 이긴다)`);
      excluded.push({id: g.slug, reason: ex.reason, ...(ex.evidence ? {evidence: ex.evidence} : {})}); continue;
    }
    if (a) {
      const errs = a.__parseError ? [`${g.slug}: JSON 문법 오류(${a.__parseError})`] : validateAuthoring(g.slug, a);
      if (!errs.length) errs.push(...imageProblems(root, g.slug, a, images.games?.[g.slug]));
      if (!errs.length) { put(g, authoredFact(g, a), a.oneLiner); sources.authored.push(g.slug); continue; }
      warnings.push(...errs.map(x => `${x} (편집 원본을 쓰지 않고 소스 추출로 대체)`));
    }
    const r = legacyFact({home, gamesRepo, g, images});
    if (r.reason) { excluded.push({id: g.slug, reason: a ? `편집 원본 검증 실패 + ${r.reason}` : r.reason}); continue; }
    put(g, r.fact, r.summary); sources.legacy.push(g.slug);
  }
  for (const id of auth.keys()) if (!all.some(g => g.slug === id)) warnings.push(`${id}: games.json 에 없는 편집 원본(파일명이 slug 와 같아야 한다)`);
  const section = {id: 'games', url: 'https://games.kimjinwan.com/', count: {value: n, total: all.length, as_of: asOf,
    source: `kein-web-games/src/games.json(legacy 제외 ${all.length}개) 중 소개글에 쓸 사실이 확인되는 ${n}개. 우선순위: ① 허브 편집 원본 data/authoring/games/<id>.json(직접 실행해 확인한 서술·관찰 메모 verified) ② 없으면 소스 추출 — games.json 필드 + published-games/<slug>/build/game.config.json + kein-game-forge 작업공간의 README·game.generated.json + kein-games/<slug> README·DESIGN 의 판매 소개말. 메타(장르·한 판 길이·조작 라벨)는 games.json. 이미지는 content-src/images.json`},
    groups: [...groups.values()].sort((x, y) => y.items.length - x.items.length || x.id.localeCompare(y.id))};
  return {section, extra, excluded, warnings, sources};
}
