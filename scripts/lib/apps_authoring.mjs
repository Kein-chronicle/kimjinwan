// scripts/lib/apps_authoring.mjs — '내 앱' 섹션(/content/apps/) 소개 만들기: 편집 원본(data/authoring/apps/<slug>.json) + 스토어 공개 정보 캐시(content-src/apps-store.json) → 허브 apps 섹션 + content-src/apps/<slug>.json.
// 편집 원본 = 사람이 소스에서 확인되는 사실만으로 쓴 한국어 소개 + 이미지 목록 + 확인 근거(verified). 생성기가 문장을 찍어내지 않는다. 필드 정의·작성 기준은 docs/AUTHORING_APPS.md.
// 스토어 캐시는 iTunes lookup(공개 API) 결과에서 사실만 뽑은 것이다(node scripts/build_content_apps.mjs --refresh-store 로만 갱신, 네트워크 필요). 빌드는 캐시만 읽는다.
import fs from 'node:fs';
import path from 'node:path';

export const AUTH_DIR = 'data/authoring/apps';
export const STORE_CACHE = 'content-src/apps-store.json';
export const DEV_ID = '1446513824'; // 개발자 계정(iTunes artistId) — 앱 개수 근거
export const DEV_URL = `https://apps.apple.com/kr/developer/jinwan-kim/id${DEV_ID}`;
export const MIN_BODY = 400;
export const STATUSES = ['live', 'in_review']; // live = 스토어 공개 조회(lookup)로 확인됨, in_review = 심사 제출 사실이 확인되고 아직 스토어에 없음(스토어 버튼 없음)
export const STATUS_LABEL = {live: {ko: '앱스토어 제공 중', en: 'On the App Store'}, in_review: {ko: '심사 중', en: 'In review'}};
// 분류: 순서가 곧 칩·색인 순서. id 는 URL(/content/apps/category/<id>/)이라 바꾸지 않는다. 'page'·'category' 는 쓰지 않는다.
export const APP_CATEGORIES = [
  {id: 'calc', label: {ko: '계산·측정', en: 'Calculators'}, blurb: {ko: '운동·공사·촬영·장보기처럼 숫자를 맞춰야 하는 순간에 쓰는 계산기', en: 'Calculators for moments when the numbers have to add up'}},
  {id: 'table', label: {ko: '모임·보드게임 도구', en: 'Table & group tools'}, blurb: {ko: '점수판·시계·대진표·추첨처럼 여럿이 모일 때 쓰는 도구', en: 'Scoreboards, clocks, brackets and pickers for gatherings'}},
  {id: 'game', label: {ko: '게임', en: 'Games'}, blurb: {ko: '짧게 즐기는 퍼즐·생존·키우기 게임', en: 'Short puzzle, survival and raising games'}},
  {id: 'learn', label: {ko: '배움·연습', en: 'Learning'}, blurb: {ko: '단어, 악보, 연산 문제처럼 반복해서 익히는 앱', en: 'Apps for drilling words, notes and arithmetic'}},
  {id: 'faith', label: {ko: '신앙생활', en: 'Faith'}, blurb: {ko: '성경 읽기·암송·교회력·금식처럼 신앙생활을 돕는 앱', en: 'Apps that support Bible reading, memorization and the church year'}},
  {id: 'life', label: {ko: '생활·기록', en: 'Daily life'}, blurb: {ko: '메모·목표·유통기한·취미 기록처럼 일상을 가볍게 남기는 앱', en: 'Light apps for notes, goals, expiry dates and hobby counts'}},
  {id: 'mind', label: {ko: '테스트·재미', en: 'Tests & fun'}, blurb: {ko: '꿈 해석·성격 테스트·반응속도 측정처럼 가볍게 해 보는 앱', en: 'Dream readings, personality tests and reaction timing for a light moment'}},
];
export const CATEGORY_IDS = APP_CATEGORIES.map(c => c.id);
export const RESERVED = ['page', 'category'];

export const BAN = /제가|저는|저의|저를|저에게|제게|저희|(?:^|[\s>("'])제\s/m;
export const EMOJI = /\p{Extended_Pictographic}/u;
export const BAD_WORDS = /원문|기즈모|gizmo/i;
// 앱 소개에 쓰지 않는 말: 허브 공통 내부 용어(hub_sources INTERNAL 과 같은 취지) + 만드는 공정을 가리키는 말.
export const INTERNAL_APPS = /공장|게이트|파이프라인|R-G\d|L-G\d|\bQA\b|DoD|DOD|Forge|스타터|검증|빌드|커밋|리서치|렌더|\.json|\.md|\.ts\b|manifest|런타임|localStorage|OpenAI|ASC\b|심사 노트|반려|4\.3/;
export const IMG_BUDGET = {icon: 15 * 1024, shot: 90 * 1024};
export const SRC_RE = /^(catalog|store|repo):[\w./@-]+$/; // catalog:intro/01.jpg · store:1(스토어 스크린샷 번호) · repo:<~/ 기준 상대 경로>

const LIST = {features: 3, howTo: 2, notes: 1};
export const bodyParts = a => [a.oneLiner, a.about, a.audience, ...(a.features || []), ...(a.howTo || []), ...(a.notes || [])].filter(x => typeof x === 'string' && x);
export const bodyText = a => bodyParts(a).join(' ');
export const bodyChars = a => bodyText(a).replace(/\s+/g, '').length;
export const sentences = a => bodyParts(a).flatMap(p => p.split(/(?<=[.!?。])\s+/)).map(s => s.trim()).filter(s => s.length > 8);
export const altText = a => (Array.isArray(a.images) ? a.images : []).map(x => x?.alt || '').join(' ');
export const hasHangul = s => /[가-힣]/.test(s);

// 편집 원본 한 개의 검증. 오류 문자열 배열(비면 통과). 모든 메시지는 "<slug>: 무엇이 문제 → 어떻게 고치나" 형식.
export function validateApp(slug, a, {store = null} = {}) {
  const e = [];
  const w = m => e.push(`${slug}: ${m}`);
  if (!a || typeof a !== 'object') return [`${slug}: JSON 객체가 아니다 → docs/AUTHORING_APPS.md 의 템플릿을 복사해 다시 쓴다`];
  if (a.slug !== slug) w(`slug 가 파일명과 다르다(${a.slug}) → "slug": "${slug}" 로 맞춘다`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || RESERVED.includes(slug)) w(`slug 는 소문자·숫자·하이픈이고 ${RESERVED.join('·')} 는 쓸 수 없다`);
  if (a.guide !== undefined && !/^[a-z0-9][a-z0-9-]*$/.test(a.guide)) w('guide 는 블로그 앱 제작·심사 글의 slug(선택) → 철자를 고친다');
  if (typeof a.name !== 'string' || !a.name.trim()) w('name 필수(스토어에 등록된 앱 이름) → 채운다');
  if (!/^\d{6,12}$/.test(String(a.storeId || ''))) w('storeId 는 숫자 문자열(App Store ID) → App Store 주소의 id 뒤 숫자를 적는다');
  if (!STATUSES.includes(a.status)) w(`status 는 ${STATUSES.join('|')} 중 하나 → 고친다`);
  if (!CATEGORY_IDS.includes(a.category)) w(`category 는 ${CATEGORY_IDS.join('|')} 중 하나 → 고친다`);
  if (typeof a.oneLiner !== 'string' || a.oneLiner.trim().length < 15 || a.oneLiner.length > 110) w('oneLiner 는 15~110자 한 문장 → 앱이 무엇을 하는지 한 문장으로 쓴다');
  if (typeof a.about !== 'string' || a.about.replace(/\s+/g, '').length < 100) w('about 는 100자 이상(문단은 \\n) → 무슨 앱이고 어떤 화면·동작을 하는지 쓴다');
  if (typeof a.audience !== 'string' || a.audience.trim().length < 20) w('audience 는 20자 이상 → 어떤 사람이 어떤 때 쓰는지 쓴다');
  for (const [k, min] of Object.entries(LIST)) if (!Array.isArray(a[k]) || a[k].length < min || a[k].some(x => typeof x !== 'string' || x.trim().length < 8)) w(`${k} 은 문장(8자 이상) ${min}개 이상 배열 → 문장을 추가한다`);
  if (Array.isArray(a.features) && a.features.length > 7) w('features 는 7개 이하 → 핵심만 남긴다');
  const v = a.verified;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v.date || '') || typeof v.method !== 'string' || !v.method.trim() || !Array.isArray(v.sources) || !v.sources.length || v.sources.some(x => typeof x !== 'string' || !x.trim()))
    w('verified {date(YYYY-MM-DD), method, sources[1개 이상]} 필수 → 사실을 확인한 방법과 읽은 자료를 적는다');
  const im = a.images;
  if (!Array.isArray(im)) w('images 필수 → 아이콘 1장 + 화면 2~4장');
  else {
    const icons = im.filter(x => x?.role === 'icon'), shots = im.filter(x => x?.role === 'screen');
    if (icons.length !== 1) w('role 이 icon 인 이미지가 정확히 1장 필요 → 아이콘 1장을 추가한다');
    if (shots.length < 2 || shots.length > 4) w(`role 이 screen 인 이미지는 2~4장(현재 ${shots.length}장) → 개수를 맞춘다`);
    if (im.length !== icons.length + shots.length) w("images[].role 은 'icon' | 'screen' 만 쓴다");
    if (im[0]?.role !== 'icon') w('images[0] 은 아이콘 → 아이콘을 맨 앞에 둔다');
    if (new Set(im.map(x => x?.src)).size !== im.length) w('images[].src 가 중복된다');
    for (const x of im) if (!x || !SRC_RE.test(x.src || '') || typeof x.alt !== 'string' || x.alt.length < 12) w(`images 항목은 {src(catalog:… | store:N | repo:…), role, alt 12자 이상}: ${JSON.stringify(x)}`);
  }
  const text = bodyText(a) + ' ' + altText(a);
  if (BAN.test(text)) w('1인칭(제가·저는 …) 금지 → 서술형 평서문으로 고친다');
  if (EMOJI.test(text + a.name)) w('이모지 금지 → 지운다');
  if (BAD_WORDS.test(text + JSON.stringify(a.verified || {}))) w("'원문'·'기즈모' 어휘 금지(verified 포함) → '원본' 등으로 바꾼다");
  const bad = text.match(INTERNAL_APPS);
  if (bad) w(`내부 공정 용어('${bad[0]}') 금지 → 사용자가 쓰는 말로 바꾼다(본문·이미지 설명에만 적용, verified 는 화면에 안 나온다)`);
  if (!hasHangul(a.oneLiner || '')) w('oneLiner 는 한국어로 쓴다');
  if (bodyChars(a) < MIN_BODY) w(`본문 ${bodyChars(a)}자 < ${MIN_BODY}자 → 소스에서 확인되는 사실을 ${MIN_BODY - bodyChars(a)}자 이상 더 쓴다. 쓸 사실이 모자라면 억지로 늘리지 말고 제외(_progress.json)한다`);
  if (store !== undefined && a.status === 'live') {
    if (!store) w('status 가 live 인데 스토어 캐시(content-src/apps-store.json)에 이 storeId 가 없다 → node scripts/build_content_apps.mjs --refresh-store 를 실행한다(스토어에서 내려갔다면 status 를 고치거나 제외한다)');
  }
  return e;
}

// 이미지 매니페스트(content-src/images.json 의 apps[slug])·실제 webp 파일이 편집 원본과 맞는지.
export function imageProblems(root, slug, a, rec, budget = IMG_BUDGET) {
  const p = [], im = a.images || [];
  if (!rec) return [`${slug}: 이미지 매니페스트 없음 → node scripts/build_content_apps_images.mjs 를 실행한다`];
  if (rec.from !== JSON.stringify(im.map(x => x.src))) p.push(`${slug}: 이미지 매니페스트가 편집 원본의 images[].src 와 다르다 → build_content_apps_images.mjs 를 다시 실행한다`);
  if ((rec.shots || []).length !== im.length - 1) p.push(`${slug}: 화면 ${(rec.shots || []).length}장 ≠ images ${im.length - 1}장 → build_content_apps_images.mjs 를 다시 실행한다`);
  const files = [[`${slug}-icon.webp`, budget.icon], ...im.slice(1).map((_, i) => [`${slug}-${i + 1}.webp`, budget.shot])];
  for (const [f, max] of files) {
    const fp = path.join(root, 'assets/content/apps', f);
    if (!fs.existsSync(fp)) { p.push(`${slug}: assets/content/apps/${f} 없음 → build_content_apps_images.mjs 를 실행한다`); continue; }
    const sz = fs.statSync(fp).size;
    if (sz > max) p.push(`${slug}: ${f} ${(sz / 1024).toFixed(0)}KB > ${(max / 1024).toFixed(0)}KB → 원본 이미지를 바꾸거나 해상도를 낮춘다`);
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
export const readStore = root => {
  const f = path.join(root, STORE_CACHE);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {as_of: null, apps: {}};
};

// 스토어 장르(영문) → 한국어 표기 · schema.org 앱 분류
export const GENRE_KO = {Utilities: '유틸리티', Lifestyle: '라이프스타일', 'Health & Fitness': '건강 및 피트니스', Education: '교육', Productivity: '생산성', Sports: '스포츠', 'Food & Drink': '음식 및 음료', Games: '게임', Book: '도서', Travel: '여행', 'Photo & Video': '사진 및 비디오', Reference: '참고', Entertainment: '엔터테인먼트', Music: '음악'};
export const GENRE_SCHEMA = {Utilities: 'UtilitiesApplication', Lifestyle: 'LifestyleApplication', 'Health & Fitness': 'HealthApplication', Education: 'EducationalApplication', Productivity: 'BusinessApplication', Sports: 'SportsApplication', 'Food & Drink': 'LifestyleApplication', Games: 'GameApplication', Book: 'ReferenceApplication', Travel: 'TravelApplication', 'Photo & Video': 'MultimediaApplication', Reference: 'ReferenceApplication', Entertainment: 'EntertainmentApplication', Music: 'MusicApplication'};
export const LANG_KO = {EN: '영어', KO: '한국어', JA: '일본어', ZH: '중국어', DE: '독일어', FR: '프랑스어', ES: '스페인어', PT: '포르투갈어', RU: '러시아어', IT: '이탈리아어', AR: '아랍어', ID: '인도네시아어', TH: '태국어', VI: '베트남어', TR: '튀르키예어', NL: '네덜란드어', SV: '스웨덴어', HI: '힌디어', UK: '우크라이나어', PL: '폴란드어'};
export const storeUrl = id => `https://apps.apple.com/kr/app/id${id}`;

// 편집 원본 + 스토어 캐시 + 블로그 제작·심사 글 매핑 → 상세 페이지 사실 객체
function appFact(a, st, guide) {
  const fact = {slug: a.slug, name: a.name, storeId: String(a.storeId), storeUrl: a.status === 'live' ? storeUrl(a.storeId) : undefined, status: a.status, category: a.category,
    oneLiner: a.oneLiner, about: a.about, audience: a.audience, features: a.features, howTo: a.howTo, notes: a.notes,
    images: a.images.map(({role, alt}) => ({role, alt})), verified: a.verified,
    store: st ? {bundleId: st.bundleId, version: st.version, genre: st.genre, languages: st.languages, devices: st.devices, minOs: st.minOs, price: st.price, released: st.released, updated: st.updated, rating: st.rating} : undefined,
    guide};
  for (const k of Object.keys(fact)) if (fact[k] === undefined) delete fact[k];
  return fact;
}

// 반환: {section, extra(Map rel→fact), excluded[], warnings[], sources}
export function buildApps({root, asOf, images, store, blogApps = new Map()}) {
  const auth = readAuthoring(root), prog = readProgress(root);
  const exclMap = new Map((prog.excluded || []).map(x => [x.id, x]));
  const extra = new Map(), excluded = [], warnings = [], groups = new Map(); let n = 0;
  const items = [];
  for (const [slug, a] of auth) {
    const ex = exclMap.get(slug);
    if (ex) { warnings.push(`${slug}: _progress.json 제외 목록과 편집 원본이 동시에 있다 → 둘 중 하나만 둔다(제외가 이긴다)`); excluded.push({id: slug, reason: ex.reason}); continue; }
    const errs = a.__parseError ? [`${slug}: JSON 문법 오류(${a.__parseError})`] : validateApp(slug, a, {store: store.apps[String(a.storeId)] || null});
    if (!errs.length) errs.push(...imageProblems(root, slug, a, images.apps?.[slug]));
    if (errs.length) { warnings.push(...errs.map(x => `${x} (이 앱은 허브 목록에서 빠진다)`)); excluded.push({id: slug, reason: `편집 원본 검증 실패: ${errs[0].replace(`${slug}: `, '')}`}); continue; }
    const st = store.apps[String(a.storeId)] || null;
    const gslug = a.guide || slug; // 제작·심사 글의 블로그 slug — 앱 slug 와 같으면 생략 가능
    if (a.guide && !blogApps.has(a.guide)) warnings.push(`${slug}: guide '${a.guide}' 에 해당하는 허브 앱 제작·심사 글이 없다 → 링크 없이 진행`);
    const guide = blogApps.has(gslug) ? {title: blogApps.get(gslug).title, path: blogApps.get(gslug).path} : undefined;
    extra.set(`content-src/apps/${slug}.json`, appFact(a, st, guide));
    items.push({slug, title: a.name, summary: a.oneLiner, category: a.category, status: a.status, released: st?.released || '', url: a.status === 'live' ? storeUrl(a.storeId) : undefined});
  }
  for (const [id, ex] of exclMap) if (!auth.has(id)) excluded.push({id, reason: ex.reason});
  // 최신 출시순(같으면 slug) — 색인 순서의 단일 기준
  items.sort((x, y) => y.released.localeCompare(x.released) || x.slug.localeCompare(y.slug));
  for (const it of items) {
    const cat = APP_CATEGORIES.find(c => c.id === it.category);
    if (!groups.has(cat.id)) groups.set(cat.id, {id: cat.id, label: cat.label, blurb: cat.blurb, items: []});
    const {released, ...pub} = it;
    groups.get(cat.id).items.push({...pub, released: released || undefined}); n++;
  }
  const section = {id: 'apps', url: DEV_URL, count: {value: n, total: Math.max(n, store.developer_total || n), as_of: asOf,
    source: `App Store 개발자 계정(Jinwan Kim, id${DEV_ID})의 공개 앱 ${store.developer_total ?? '?'}개(iTunes lookup, 기준 ${store.as_of}) 중 소개글에 쓸 사실이 확인되는 ${n}개. 우선순위: 허브 편집 원본 data/authoring/apps/<slug>.json(앱 소스·스토어 설명에서 확인한 사실로 쓴 한국어 소개) + 스토어 공개 정보 캐시 content-src/apps-store.json(이름·버전·분류·언어·가격·출시일). 이미지는 content-src/images.json 의 apps`},
    groups: APP_CATEGORIES.filter(c => groups.has(c.id)).map(c => ({...groups.get(c.id), total: groups.get(c.id).items.length}))};
  return {section, extra, excluded, warnings, sources: {authored: [...auth.keys()]}};
}
