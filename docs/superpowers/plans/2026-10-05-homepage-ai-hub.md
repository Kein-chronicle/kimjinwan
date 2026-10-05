# kimjinwan.com AI 제작·운영 허브 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이력 중심 단일 페이지를 "AI로 만들고 운영하는 사람" 허브(`/`, `/works`, `/factories`, `/career`)로 개편하고, 작업물·공장 데이터를 JSON 두 개(+컬렉션 하나)에서 정적 HTML로 빌드한다.

**Architecture:** 의존성 없는 Node(ESM) 빌드 스크립트가 `data/*.json`을 검증하고 `src/` 템플릿에 채워 `index.html`, `works/`, `factories/`, `career/`를 생성·커밋한다. **렌더는 빌드 타임**이다. 애드센스 재검토 중이라 공개 콘텐츠가 초기 HTML에 있어야 하기 때문이다(DEPLOYMENT.md 1.0.7). 클라이언트 JS는 언어 토글, 경력 페이지의 프로젝트 그리드, `/works` 필터만 맡는다.

**Tech Stack:** Node 26 (`node --test`), 순수 HTML/CSS/JS, Pretendard, 외부 npm 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-05-homepage-ai-hub-design.md` (spec 보완: `data/collections.json` 추가 — 게임 44개·도구 42개를 서비스로 일일이 나열하지 않고 컬렉션 칸으로 요약하기 위함).

**작업 위치:** `~/Projects/kimjinwan`, 브랜치 `static-site-2026`. 모든 명령은 이 디렉터리에서 실행. 배포 전까지 서버·ads 파일은 건드리지 않는다.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `data/services.json` | 대표·개별 서비스 레지스트리 |
| `data/collections.json` | 게임/도구/앱/블로그 컬렉션 요약(개수·미리보기 3개) |
| `data/factories.json` | AI 공장 정의(단계, 역할 분리, 수치, 산출물) |
| `scripts/lib/validate.mjs` | 데이터 스키마 검증(순수 함수) |
| `scripts/lib/render.mjs` | 카드·지표·흐름도 HTML 생성(순수 함수) |
| `scripts/lib/template.mjs` | `{{key}}` / `{{>partial}}` 치환 |
| `scripts/build.mjs` | 검증 → 렌더 → 파일 출력 |
| `src/partials/{head,nav,footer}.html` | 공통 조각 |
| `src/{home,works,factories,career}.html` | 페이지 템플릿 |
| `src/sections/{ai,career-body}.html` | 기존 index.html에서 옮긴 본문 |
| `css/style.css` | 새 토큰 + 신규 컴포넌트(기존 컴포넌트는 토큰으로 재색칠) |
| `js/main.js` | 언어 토글, 경력 그리드(요소 있을 때만), 필터 |
| `tests/*.test.mjs` | 데이터·렌더·템플릿·빌드 동기화·사이트 계약 |

생성물(`index.html`, `works/index.html`, `factories/index.html`, `career/index.html`)은 직접 수정하지 않는다. 수정은 `src/`·`data/`에서 하고 `node scripts/build.mjs`를 돌린다.

---

### Task 1: 데이터 검증기

**Files:**
- Create: `scripts/lib/validate.mjs`
- Test: `tests/validate.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/validate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {validate} from '../scripts/lib/validate.mjs';

const bi = (ko, en) => ({ko, en});
const svc = (id, o = {}) => ({id, name: id, kind: 'service', status: 'live', featured: false,
  summary: bi('요약', 'summary'), ai_tools: ['Claude Code'], url: `https://${id}.example.com/`,
  thumb: '', updated: '2026-10-05', ...o});
const col = (id, o = {}) => ({id, kind: 'game', name: bi('게임', 'Games'), summary: bi('요약', 'summary'),
  url: 'https://games.example.com/', count: {value: 44, as_of: '2026-10-05', source: 'x'},
  previews: [{name: 'a', url: 'https://games.example.com/a'}], ...o});
const fac = (id, o = {}) => ({id, name: bi('공장', 'Factory'), role: bi('역할', 'role'),
  stages: [{name: bi('기획', 'Plan'), kind: 'ai'}, {name: bi('검증', 'Gate'), kind: 'gate'}, {name: bi('승인', 'Approve'), kind: 'human'}],
  human_role: bi('승인', 'approve'),
  metrics: [{label: bi('게이트', 'Gates'), value: '87', as_of: '2026-10-05', source: 'pipeline.json'}],
  outputs: [], ...o});
const good = () => ({
  services: [svc('a', {featured: true}), svc('b', {featured: true}), svc('c', {featured: true})],
  collections: [col('games')], factories: [fac('f1', {outputs: ['a']})]});

test('정상 데이터는 통과한다', () => assert.deepEqual(validate(good()), []));
test('대표 서비스는 3~4개여야 한다', () => {
  const d = good(); d.services[2].featured = false;
  assert.match(validate(d).join('\n'), /featured/);
});
test('id 중복을 잡는다', () => {
  const d = good(); d.services[1].id = 'a';
  assert.match(validate(d).join('\n'), /duplicate/);
});
test('잘못된 kind/status 를 잡는다', () => {
  const d = good(); d.services[0].kind = 'x'; d.services[1].status = 'y';
  const e = validate(d).join('\n'); assert.match(e, /kind/); assert.match(e, /status/);
});
test('url 은 https 여야 한다', () => {
  const d = good(); d.services[0].url = 'http://a'; assert.match(validate(d).join('\n'), /url/);
});
test('공장 outputs 는 존재하는 서비스 id 여야 한다', () => {
  const d = good(); d.factories[0].outputs = ['nope']; assert.match(validate(d).join('\n'), /outputs/);
});
test('수치는 as_of(YYYY-MM-DD)와 source 가 필수다', () => {
  const d = good(); d.factories[0].metrics[0].as_of = '오늘'; assert.match(validate(d).join('\n'), /as_of/);
  const e = good(); delete e.factories[0].metrics[0].source; assert.match(validate(e).join('\n'), /source/);
});
test('stage kind 는 ai|human|gate 이고 human 단계가 최소 1개', () => {
  const d = good(); d.factories[0].stages[2].kind = 'ai'; assert.match(validate(d).join('\n'), /human/);
});
test('ko/en 이 비어 있으면 잡는다', () => {
  const d = good(); d.services[0].summary.en = ''; assert.match(validate(d).join('\n'), /summary/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/validate.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/lib/validate.mjs'`

- [ ] **Step 3: 구현**

```js
// scripts/lib/validate.mjs
const KINDS = ['service', 'game', 'tool', 'app', 'blog'];
const STATUS = ['live', 'released', 'experiment'];
const STAGE = ['ai', 'human', 'gate'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS = /^https:\/\//;

const biOk = o => o && typeof o.ko === 'string' && o.ko.trim() && typeof o.en === 'string' && o.en.trim();

export function validate({services = [], collections = [], factories = []}) {
  const err = [];
  const dup = (list, label) => {
    const seen = new Set();
    for (const x of list) { if (seen.has(x.id)) err.push(`${label}: duplicate id ${x.id}`); seen.add(x.id); }
  };
  dup(services, 'services'); dup(collections, 'collections'); dup(factories, 'factories');

  for (const s of services) {
    const w = `services.${s.id}`;
    if (!KINDS.includes(s.kind)) err.push(`${w}: bad kind ${s.kind}`);
    if (!STATUS.includes(s.status)) err.push(`${w}: bad status ${s.status}`);
    if (!biOk(s.summary)) err.push(`${w}: summary needs ko/en`);
    if (!HTTPS.test(s.url || '')) err.push(`${w}: url must be https`);
    if (!DATE.test(s.updated || '')) err.push(`${w}: updated must be YYYY-MM-DD`);
    if (!Array.isArray(s.ai_tools)) err.push(`${w}: ai_tools must be array`);
  }
  const featured = services.filter(s => s.featured).length;
  if (featured < 3 || featured > 4) err.push(`services: featured must be 3-4, got ${featured}`);

  for (const c of collections) {
    const w = `collections.${c.id}`;
    if (!KINDS.includes(c.kind)) err.push(`${w}: bad kind ${c.kind}`);
    if (!biOk(c.name) || !biOk(c.summary)) err.push(`${w}: name/summary need ko/en`);
    if (!HTTPS.test(c.url || '')) err.push(`${w}: url must be https`);
    if (!c.count || !DATE.test(c.count.as_of || '') || !c.count.source) err.push(`${w}: count needs as_of and source`);
    for (const p of c.previews || []) if (!HTTPS.test(p.url || '')) err.push(`${w}: preview url must be https`);
  }

  const ids = new Set(services.map(s => s.id));
  for (const f of factories) {
    const w = `factories.${f.id}`;
    if (!biOk(f.name) || !biOk(f.role) || !biOk(f.human_role)) err.push(`${w}: name/role/human_role need ko/en`);
    for (const st of f.stages || []) {
      if (!STAGE.includes(st.kind)) err.push(`${w}: bad stage kind ${st.kind}`);
      if (!biOk(st.name)) err.push(`${w}: stage name needs ko/en`);
    }
    if (!(f.stages || []).some(st => st.kind === 'human')) err.push(`${w}: needs at least one human stage`);
    for (const m of f.metrics || []) {
      if (!DATE.test(m.as_of || '')) err.push(`${w}: metric as_of must be YYYY-MM-DD`);
      if (!m.source) err.push(`${w}: metric needs source`);
      if (!biOk(m.label) || m.value === undefined || m.value === '') err.push(`${w}: metric needs label and value`);
    }
    for (const o of f.outputs || []) if (!ids.has(o)) err.push(`${w}: outputs references unknown service ${o}`);
  }
  return err;
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/validate.test.mjs`
Expected: PASS (9 tests)

- [ ] **Step 5: 커밋**

```bash
git add scripts/lib/validate.mjs tests/validate.test.mjs
git commit -m "feat: add registry data validator"
```

---

### Task 2: 렌더 함수

**Files:**
- Create: `scripts/lib/render.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/render.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {esc, bi, serviceCard, collectionCard, factoryCard, heroStats} from '../scripts/lib/render.mjs';

const svc = {id: 'forge', name: 'Forge', kind: 'service', status: 'live', featured: true,
  summary: {ko: '요구사항에서 개발까지', en: 'From requirements to code'},
  ai_tools: ['Claude Code', 'Codex'], url: 'https://forge.example.com/', thumb: 'assets/services/forge.png', updated: '2026-10-05'};

test('esc 는 HTML 특수문자를 이스케이프한다', () => assert.equal(esc('<a href="x">&'), '&lt;a href=&quot;x&quot;&gt;&amp;'));
test('bi 는 ko/en span 쌍을 만든다', () =>
  assert.equal(bi({ko: '가', en: 'a'}), '<span data-lang-ko>가</span><span data-lang-en>a</span>'));
test('serviceCard 는 외부 링크 속성, 상태 배지, AI 툴 칩을 포함한다', () => {
  const h = serviceCard(svc);
  assert.match(h, /href="https:\/\/forge\.example\.com\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(h, /badge-live/); assert.match(h, /LIVE/);
  assert.match(h, />Claude Code</); assert.match(h, /<img src="assets\/services\/forge\.png"/);
});
test('serviceCard 는 thumb 가 없으면 img 를 만들지 않는다', () => {
  assert.doesNotMatch(serviceCard({...svc, thumb: ''}), /<img/);
});
test('collectionCard 는 개수와 미리보기 링크를 렌더한다', () => {
  const h = collectionCard({id: 'games', kind: 'game', name: {ko: '웹게임', en: 'Web games'},
    summary: {ko: '설명', en: 'desc'}, url: 'https://games.example.com/',
    count: {value: 44, as_of: '2026-10-05', source: 's'}, previews: [{name: 'A', url: 'https://games.example.com/a'}]});
  assert.match(h, /44/); assert.match(h, /2026-10-05/); assert.match(h, /href="https:\/\/games\.example\.com\/a"/);
});
test('factoryCard 는 단계 3종 클래스, 사람 역할, 수치, 산출물 링크를 렌더하고 source 는 노출하지 않는다', () => {
  const f = {id: 'af', name: {ko: '앱 공장', en: 'App Factory'}, role: {ko: '앱 양산', en: 'Ships apps'},
    stages: [{name: {ko: '기획', en: 'Plan'}, kind: 'ai'}, {name: {ko: '게이트', en: 'Gate'}, kind: 'gate'}, {name: {ko: '승인', en: 'Approve'}, kind: 'human'}],
    human_role: {ko: '제출 승인만', en: 'Approves submission only'},
    metrics: [{label: {ko: '게이트', en: 'Gates'}, value: '87', as_of: '2026-10-05', source: '/Users/kein/secret/pipeline.json'}],
    outputs: ['forge']};
  const h = factoryCard(f, new Map([['forge', svc]]));
  for (const c of ['stage-ai', 'stage-gate', 'stage-human']) assert.match(h, new RegExp(c));
  assert.match(h, /제출 승인만/); assert.match(h, />87</); assert.match(h, /href="https:\/\/forge\.example\.com\/"/);
  assert.doesNotMatch(h, /\/Users\/|secret|pipeline\.json/);
});
test('heroStats 는 데이터에서 개수를 집계한다', () => {
  const h = heroStats({
    services: [svc, {...svc, id: 'b', featured: false}],
    collections: [{kind: 'game', count: {value: 44}}, {kind: 'tool', count: {value: 42}}, {kind: 'blog', count: {value: 218}}]});
  assert.match(h, />2</); assert.match(h, />44</); assert.match(h, />42</); assert.match(h, />218</);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/render.test.mjs`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

```js
// scripts/lib/render.mjs
const EXT = 'target="_blank" rel="noopener noreferrer"';
const STATUS_LABEL = {live: 'LIVE', released: 'RELEASED', experiment: 'EXPERIMENT'};

export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
export const bi = o => `<span data-lang-ko>${esc(o.ko)}</span><span data-lang-en>${esc(o.en)}</span>`;
const open = {ko: '열기', en: 'Open'};
const asOf = {ko: '기준', en: 'as of'};

export function serviceCard(s) {
  const shot = s.thumb
    ? `<img src="${esc(s.thumb)}" alt="${esc(s.name)} screenshot" loading="lazy" width="640" height="400">`
    : `<span class="mono shot-fallback">${esc(s.name.slice(0, 2).toUpperCase())}</span>`;
  const chips = s.ai_tools.map(t => `<span class="chip mono">${esc(t)}</span>`).join('');
  return `<article class="card svc" data-kind="${esc(s.kind)}">
  <div class="svc-shot">${shot}</div>
  <div class="svc-body">
    <div class="svc-meta"><span class="badge badge-${esc(s.status)} mono">${STATUS_LABEL[s.status]}</span><span class="kind mono">${esc(s.kind)}</span></div>
    <h3>${esc(s.name)}</h3>
    <p>${bi(s.summary)}</p>
    <div class="chips">${chips}</div>
    <a class="more" href="${esc(s.url)}" ${EXT}>${bi(open)} ↗</a>
  </div>
</article>`;
}

export function collectionCard(c) {
  const links = (c.previews || []).map(p => `<li><a href="${esc(p.url)}" ${EXT}>${esc(p.name)} ↗</a></li>`).join('');
  return `<article class="card col" data-kind="${esc(c.kind)}">
  <div class="col-count mono">${esc(c.count.value)}</div>
  <h3>${bi(c.name)}</h3>
  <p>${bi(c.summary)}</p>
  <ul class="col-links">${links}</ul>
  <div class="col-foot"><a class="more" href="${esc(c.url)}" ${EXT}>${bi(open)} ↗</a><span class="asof mono">${bi(asOf)} ${esc(c.count.as_of)}</span></div>
</article>`;
}

export function factoryCard(f, servicesById) {
  const stages = f.stages.map(st => `<li class="stage stage-${st.kind}"><span class="mono">${bi(st.name)}</span></li>`).join('');
  const metrics = f.metrics.map(m => `<div class="metric"><dt>${bi(m.label)}</dt><dd class="mono">${esc(m.value)}</dd><span class="asof mono">${esc(m.as_of)}</span></div>`).join('');
  const outs = f.outputs.map(id => servicesById.get(id)).filter(Boolean)
    .map(s => `<li><a href="${esc(s.url)}" ${EXT}>${esc(s.name)} ↗</a></li>`).join('');
  return `<article class="card fac" id="${esc(f.id)}">
  <h3>${bi(f.name)}</h3>
  <p class="fac-role">${bi(f.role)}</p>
  <ol class="flow" aria-label="pipeline">${stages}</ol>
  <p class="legend mono"><i class="dot dot-ai"></i>AI <i class="dot dot-gate"></i>GATE <i class="dot dot-human"></i>HUMAN</p>
  <p class="fac-human"><strong>${bi({ko: '사람 몫', en: 'Human role'})}:</strong> ${bi(f.human_role)}</p>
  <dl class="metrics">${metrics}</dl>
  ${outs ? `<ul class="fac-outs">${outs}</ul>` : ''}
</article>`;
}

export function heroStats({services, collections}) {
  const n = k => collections.filter(c => c.kind === k).reduce((a, c) => a + Number(c.count.value), 0);
  const cell = (num, label) => `<div class="hstat"><div class="num mono">${num}</div><div class="lbl">${bi(label)}</div></div>`;
  return [
    cell(services.length, {ko: '서비스', en: 'Services'}),
    cell(n('game'), {ko: '웹게임', en: 'Web games'}),
    cell(n('tool'), {ko: '웹 도구', en: 'Web tools'}),
    cell(n('blog'), {ko: '블로그 글', en: 'Journal posts'}),
  ].join('');
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/render.test.mjs`
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add scripts/lib/render.mjs tests/render.test.mjs
git commit -m "feat: add card/flow/stat renderers"
```

---

### Task 3: 템플릿 엔진과 빌드 스크립트

**Files:**
- Create: `scripts/lib/template.mjs`, `scripts/build.mjs`, `src/partials/head.html`, `src/partials/nav.html`, `src/partials/footer.html`
- Test: `tests/template.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/template.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {fill} from '../scripts/lib/template.mjs';

test('변수와 파셜을 치환한다', () => {
  assert.equal(fill('<p>{{a}}</p>{{>x}}', {a: '1'}, {x: '[{{a}}]'}), '<p>1</p>[1]');
});
test('모르는 변수는 에러다', () => assert.throws(() => fill('{{nope}}', {}, {}), /nope/));
test('모르는 파셜은 에러다', () => assert.throws(() => fill('{{>nope}}', {}, {}), /nope/));
test('치환된 값 안의 {{}} 는 다시 해석하지 않는다(데이터 주입 방지)', () => {
  assert.equal(fill('{{a}}', {a: '{{b}}', b: 'X'}, {}), '{{b}}');
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/template.test.mjs`
Expected: FAIL — module not found

- [ ] **Step 3: 엔진 구현**

```js
// scripts/lib/template.mjs
// 파셜을 먼저 펼친 뒤 변수를 한 번만 치환한다. 치환 결과는 재해석하지 않는다.
export function fill(tpl, ctx, partials) {
  const expanded = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`unknown partial: ${name}`);
    return partials[name];
  });
  return expanded.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, key) => {
    if (!(key in ctx)) throw new Error(`unknown variable: ${key}`);
    return ctx[key];
  });
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/template.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: 공통 파셜 작성**

`src/partials/head.html` — 기존 index.html의 메타 구성을 변수화한다(애드센스 메타·파비콘·구조화데이터 보존).

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{title}}</title>
<meta name="description" content="{{description}}">
<meta name="robots" content="index,follow">
<meta name="author" content="김진완">
<meta name="google-adsense-account" content="ca-pub-5544615855471151">
<meta name="theme-color" content="#FAFAF7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1115" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="{{canonical}}">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="김진완 — AI로 만들고 운영합니다">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="{{title}}">
<meta property="og:description" content="{{description}}">
<meta property="og:url" content="{{canonical}}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{{title}}">
<meta name="twitter:description" content="{{description}}">
{{schema}}
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<link rel="stylesheet" href="/css/style.css?v={{version}}">
</head>
<body>
```

`src/partials/nav.html`:

```html
<nav id="nav">
  <div class="nav-in">
    <a href="/" class="logo"><span data-lang-ko>김진완</span><span data-lang-en>KIM JINWAN</span></a>
    <div class="nav-links">
      <a href="/works/"><span data-lang-ko>작업물</span><span data-lang-en>Works</span></a>
      <a href="/factories/"><span data-lang-ko>AI 공장</span><span data-lang-en>Factories</span></a>
      <a href="/#ai"><span data-lang-ko>AI 활용</span><span data-lang-en>AI</span></a>
      <a href="/career/"><span data-lang-ko>경력</span><span data-lang-en>Career</span></a>
      <a href="https://blog.kimjinwan.com/ko/" target="_blank" rel="noopener noreferrer"><span data-lang-ko>블로그 ↗</span><span data-lang-en>Journal ↗</span></a>
      <a href="https://games.kimjinwan.com/" target="_blank" rel="noopener noreferrer"><span data-lang-ko>웹게임 ↗</span><span data-lang-en>Games ↗</span></a>
      <a href="https://apps.kimjinwan.com/" target="_blank" rel="noopener noreferrer"><span data-lang-ko>웹 도구 ↗</span><span data-lang-en>Tools ↗</span></a>
      <a href="#contact" class="btn btn-primary nav-cta"><span data-lang-ko>연락하기</span><span data-lang-en>Contact</span></a>
      <div class="lang">
        <button id="ko" class="on" onclick="setLang('ko')">KO</button>
        <button id="en" onclick="setLang('en')">EN</button>
      </div>
    </div>
  </div>
</nav>
```

`src/partials/footer.html`: 기존 `index.html` 305~317행 `<footer id="contact">…</footer>` 블록을 그대로 복사한다(연락처 정확성 유지: 전화 `+82-10-4040-1824`, 이메일 `k_star_w@naver.com`). 복사 후 클래스 `btn-grad` 를 `btn-primary` 로만 치환한다.

```bash
sed -n '305,317p' index.html > src/partials/footer.html
sed -i '' 's/btn-grad/btn-primary/g' src/partials/footer.html
grep -c 'k_star_w@naver.com' src/partials/footer.html
```
Expected: `1` 이상

- [ ] **Step 6: 빌드 스크립트 작성**

```js
// scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './lib/validate.mjs';
import {fill} from './lib/template.mjs';
import {serviceCard, collectionCard, factoryCard, heroStats, bi, esc} from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(rd(p));

export function loadData() {
  return {services: json('data/services.json'), collections: json('data/collections.json'), factories: json('data/factories.json')};
}

const SITE = 'https://kimjinwan.com';
const PAGES = [
  {src: 'src/home.html', out: 'index.html', path: '/',
    title: '김진완 — AI로 서비스를 만들고 직접 운영합니다',
    description: '소프트웨어 PM 김진완이 AI 공장·파이프라인으로 만들어 운영하는 서비스, 웹게임, 웹 도구, 블로그와 경력.'},
  {src: 'src/works.html', out: 'works/index.html', path: '/works/',
    title: '작업물 — 김진완', description: 'AI로 만들고 운영하는 서비스·웹게임·웹 도구·앱·블로그 전체 목록.'},
  {src: 'src/factories.html', out: 'factories/index.html', path: '/factories/',
    title: 'AI 공장 — 김진완', description: '앱·게임·콘텐츠를 양산하는 AI 공장과 파이프라인의 단계, 자동화 범위, 사람이 하는 일.'},
  {src: 'src/career.html', out: 'career/index.html', path: '/career/',
    title: '경력 — 김진완', description: '11년 경력과 수행 프로젝트 55개: 차량 SW PM, 풀스택 개발, 팀 리딩.'},
];

function schemaFor(page) {
  const g = [
    {'@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: '김진완 포트폴리오', alternateName: 'Kim Jinwan', inLanguage: ['ko', 'en'], publisher: {'@id': `${SITE}/#person`}},
    {'@type': 'Person', '@id': `${SITE}/#person`, name: '김진완', alternateName: 'Kein', url: `${SITE}/`, jobTitle: 'Software Product Manager'},
  ];
  if (page.path === '/') g.push({'@type': 'ProfilePage', '@id': `${SITE}/#profile`, url: `${SITE}/`, name: page.title, dateModified: new Date().toISOString().slice(0, 10), mainEntity: {'@id': `${SITE}/#person`}, isPartOf: {'@id': `${SITE}/#website`}, relatedLink: 'https://blog.kimjinwan.com/'});
  return `<script type="application/ld+json">${JSON.stringify({'@context': 'https://schema.org', '@graph': g})}</script>`;
}

export function buildAll({write = true} = {}) {
  const data = loadData();
  const errors = validate(data);
  if (errors.length) throw new Error('data validation failed:\n' + errors.join('\n'));

  const byId = new Map(data.services.map(s => [s.id, s]));
  const version = rd('VERSION').trim();
  const partials = {head: rd('src/partials/head.html'), nav: rd('src/partials/nav.html'), footer: rd('src/partials/footer.html'),
    ai: rd('src/sections/ai.html')};
  const featured = data.services.filter(s => s.featured);
  const ctxBase = {
    version,
    hero_stats: heroStats(data),
    featured: featured.map(serviceCard).join('\n'),
    all_services: data.services.map(serviceCard).join('\n'),
    collections: data.collections.map(collectionCard).join('\n'),
    factories: data.factories.map(f => factoryCard(f, byId)).join('\n'),
    factories_teaser: data.factories.map(f => `<li><a href="/factories/#${esc(f.id)}">${bi(f.name)}</a> — ${bi(f.role)}</li>`).join(''),
    updated: new Date().toISOString().slice(0, 10),
  };
  const out = {};
  for (const page of PAGES) {
    const ctx = {...ctxBase, title: esc(page.title), description: esc(page.description), canonical: `${SITE}${page.path}`, schema: schemaFor(page)};
    out[page.out] = fill(rd(page.src), ctx, {...partials, head: fill(partials.head, ctx, {})});
  }
  if (write) for (const [file, html] of Object.entries(out)) {
    const dest = path.join(ROOT, file);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, html);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = buildAll();
  console.log('built:', Object.keys(out).join(', '));
}
```

Note: `{{ai}}` 파셜은 Task 6에서 만들어지며, 그 전까지 빌드는 `src/sections/ai.html` 부재로 실패한다. Task 3은 여기서 커밋만 하고 빌드는 Task 6 이후 처음 돈다.

- [ ] **Step 7: 커밋**

```bash
git add scripts/lib/template.mjs scripts/build.mjs src/partials tests/template.test.mjs
git commit -m "feat: add template engine, partials and build script"
```

---

### Task 4: 실데이터 수집 및 시드 (정확성 게이트)

**Files:**
- Create: `data/services.json`, `data/collections.json`, `data/factories.json`, `assets/services/*.png`
- Test: `tests/data.test.mjs`

규칙: **확인하지 못한 값은 넣지 않는다.** 모든 수치는 `source`(내부 경로 포함 가능, 렌더 시 노출 안 됨)와 `as_of`(오늘 날짜)를 단다. 수치 출처를 못 찾으면 그 metric 항목을 생략한다.

- [ ] **Step 1: 데이터 계약 테스트 작성**

```js
// tests/data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate} from '../scripts/lib/validate.mjs';

const load = n => JSON.parse(fs.readFileSync(`data/${n}.json`, 'utf8'));
const data = () => ({services: load('services'), collections: load('collections'), factories: load('factories')});

test('실데이터가 스키마를 통과한다', () => assert.deepEqual(validate(data()), []));
test('대표 서비스는 Forge, Prism Studio 를 포함한다', () => {
  const ids = data().services.filter(s => s.featured).map(s => s.id);
  assert.ok(ids.includes('forge') && ids.includes('prism-studio'));
});
test('컬렉션은 game/tool/app/blog 를 모두 가진다', () => {
  const kinds = new Set(data().collections.map(c => c.kind));
  for (const k of ['game', 'tool', 'app', 'blog']) assert.ok(kinds.has(k), k);
});
test('비공개 정보가 렌더 대상 필드에 없다', () => {
  const {services, collections, factories} = data();
  const strip = o => JSON.stringify(o, (k, v) => (k === 'source' ? undefined : v));
  for (const s of [strip(services), strip(collections), strip(factories)])
    assert.doesNotMatch(s, /\/Users\/|~\/|api[_-]?key|secret|token|ca-app-pub|pk_live|sk-/i);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/data.test.mjs`
Expected: FAIL — ENOENT `data/services.json`

- [ ] **Step 3: 라이브·수치 확인(읽기 전용)**

```bash
for u in https://forge.kimjinwan.com/ https://prism-studio.kimjinwan.com/ https://gizmo-store.com https://games.kimjinwan.com/ https://apps.kimjinwan.com/ https://blog.kimjinwan.com/ko/; do printf "%s " $u; curl -s -o /dev/null -w "%{http_code}\n" $u; done
# 컬렉션 개수: 사이트맵의 <loc> 수는 목록/인덱스 페이지를 포함하므로 그대로 쓰지 말고 각 사이트의 자체 매니페스트/목록에서 센다
ls ~/Projects/kein-web-games ~/Projects/kein-web-tools ~/Projects/kein-blog | head -60
```

각 컬렉션의 개수는 해당 프로젝트의 원장(예: 게임=포털 게임 목록 파일, 도구=도구 매니페스트, 블로그=발행 글 목록, 앱=app-factory `uploaded/` 및 앱 아카이브 글)에서 센다. 센 방법을 `count.source` 에 한 줄로 적는다.

**Gizmo Store 확인(중요):** 메모리에 "111퍼센트(주)가 기즈모/GIZMO 상표 출원 중" 기록이 있다. 대표 3번째로 올리기 전에 마스터에게 확인하고, 보류 시 `featured` 를 `false` 로 두고 대표 3번째는 이미 라이브인 다른 서비스(예: Forge·Prism Studio·웹게임 포털 대표작)로 바꾼다. 검증기가 대표 3~4개를 강제하므로 비워 둘 수 없다.

- [ ] **Step 4: `data/services.json` 작성** (Gizmo 결정 반영)

```json
[
  {"id": "forge", "name": "Forge", "kind": "service", "status": "live", "featured": true,
   "summary": {"ko": "요구사항 정의에서 디자인·화면설계·개발 보조·익스포트까지 하나의 흐름으로 잇는 웹서비스 제작 도구.", "en": "A web-service production tool that connects requirements, design, screen specs, development assistance and export in one flow."},
   "ai_tools": ["Claude Code", "Codex"], "url": "https://forge.kimjinwan.com/", "thumb": "assets/services/forge.png", "updated": "2026-10-05"},
  {"id": "prism-studio", "name": "Prism Studio", "kind": "service", "status": "live", "featured": true,
   "summary": {"ko": "브라우저에서 레이어·선택 영역·마스크로 이미지를 편집하는 독립 웹 편집기. PSD 열기·저장 지원.", "en": "An independent browser image editor with layers, selections and masks, including PSD open and save."},
   "ai_tools": ["Claude Code", "Codex"], "url": "https://prism-studio.kimjinwan.com/", "thumb": "assets/services/prism-studio.png", "updated": "2026-10-05"},
  {"id": "gizmo-store", "name": "Gizmo Store", "kind": "service", "status": "live", "featured": true,
   "summary": {"ko": "AI로 만든 앱을 모아 소개하는 한국어 앱스토어(웹앱·설치파일).", "en": "A Korean-language store for AI-built apps, as web apps and installers."},
   "ai_tools": ["Claude Code", "Codex"], "url": "https://gizmo-store.com", "thumb": "assets/services/gizmo-store.png", "updated": "2026-10-05"}
]
```

Step 3 에서 Gizmo가 보류되면 3번째 항목을 교체한다(같은 형식, `url` 은 curl 200 확인된 것).

- [ ] **Step 5: `data/collections.json` 작성**

미리보기 3개는 기존 `index.html` 의 `public-work` 섹션 링크를 그대로 재사용한다(블로그 3, 도구 3, 게임 3). 개수·as_of·source 는 Step 3 에서 센 값을 적는다. 아래는 구조 예시이며 `value`·`source` 는 Step 3 결과로 채운다 — 빈 값으로 커밋하면 Task 1 검증기와 Step 6 테스트가 실패한다.

```json
[
  {"id": "journal", "kind": "blog", "name": {"ko": "제작 기록 블로그", "en": "Production journal"},
   "summary": {"ko": "AI 자동화의 실패와 복구, 실제 앱 제작·심사, 플레이 중인 게임의 공식 공지를 출처와 날짜까지 구분해 기록합니다. AI 초안을 쓰고 사람이 승인해 발행합니다.", "en": "Notes on AI automation failures and recovery, real app production and review, and sourced game updates. AI drafts, a human approves and publishes."},
   "url": "https://blog.kimjinwan.com/ko/",
   "count": {"value": 0, "as_of": "2026-10-05", "source": "Step 3 에서 센 방법"},
   "previews": [
     {"name": "AdMob이 라이브 앱을 못 찾은 이유", "url": "https://blog.kimjinwan.com/ko/ai/admob-store-search-zero-results/"},
     {"name": "두 AI 세션의 커밋을 구별한 방법", "url": "https://blog.kimjinwan.com/ko/ai/same-day-two-sessions-one-trailer/"},
     {"name": "앱 73개의 출시·심사 기록", "url": "https://blog.kimjinwan.com/ko/apps/app-archive/"}]},
  {"id": "tools", "kind": "tool", "name": {"ko": "웹 도구", "en": "Web tools"},
   "summary": {"ko": "계산기부터 PDF·이미지 처리까지, 파일과 입력값은 가능한 한 사용자의 기기 안에서 처리합니다. 각 도구에 규칙과 한계를 함께 적었습니다.", "en": "Calculators and local PDF/image utilities keep files and inputs on your device whenever possible, with rules and limits explained."},
   "url": "https://apps.kimjinwan.com/",
   "count": {"value": 0, "as_of": "2026-10-05", "source": "Step 3 에서 센 방법"},
   "previews": [
     {"name": "단가 비교 계산기", "url": "https://apps.kimjinwan.com/unit-price/"},
     {"name": "토너먼트 대진표 생성기", "url": "https://apps.kimjinwan.com/tournament-bracket/"},
     {"name": "브라우저 PDF 합치기", "url": "https://apps.kimjinwan.com/pdf-merge/"}]},
  {"id": "games", "kind": "game", "name": {"ko": "웹게임", "en": "Web games"},
   "summary": {"ko": "설치 없이 브라우저에서 바로 플레이하는 게임 포털. 파이프라인으로 양산하고 품질 게이트를 통과한 게임만 올립니다.", "en": "A browser game portal. Games are produced by a pipeline and published only after passing quality gates."},
   "url": "https://games.kimjinwan.com/",
   "count": {"value": 0, "as_of": "2026-10-05", "source": "Step 3 에서 센 방법"},
   "previews": [
     {"name": "Capy Highlands", "url": "https://games.kimjinwan.com/play/capy-highlands/"},
     {"name": "Monster Throne", "url": "https://games.kimjinwan.com/play/monster-throne/"},
     {"name": "Whale Survivors", "url": "https://games.kimjinwan.com/play/whale-survivors/"}]},
  {"id": "apps", "kind": "app", "name": {"ko": "모바일 앱", "en": "Mobile apps"},
   "summary": {"ko": "앱 공장으로 만들어 App Store에 출시·심사 제출한 iOS 앱들. 출시와 심사 기록은 블로그에 남깁니다.", "en": "iOS apps built by the app factory and submitted to the App Store. Release and review records are kept in the journal."},
   "url": "https://blog.kimjinwan.com/ko/apps/app-archive/",
   "count": {"value": 0, "as_of": "2026-10-05", "source": "Step 3 에서 센 방법"},
   "previews": [
     {"name": "앱 출시·심사 기록", "url": "https://blog.kimjinwan.com/ko/apps/app-archive/"}]}
]
```

위 `"value": 0` 은 Step 3 의 실측값으로 반드시 교체한다. 교체 확인: `grep -c '"value": 0' data/collections.json` → `0`.

- [ ] **Step 6: `data/factories.json` 작성**

공장 5개(앱 공장, 신앙 앱 공장, 웹게임 파이프라인, 영상 자동화, 블로그). 단계명·사람 몫은 각 공장의 실제 문서에서 읽어 확인한다.

```bash
ls ~/Projects/app-factory ~/Projects/kein-games/rules/web-base ~/Projects/kein-tube/docs ~/Projects/kein-blog/docs 2>/dev/null | head -80
find ~/Projects/app-factory -maxdepth 2 -name 'pipeline*.json' -o -maxdepth 2 -name 'af.py' | head
```

수치는 아래 우선순위로 센다: 앱 공장=pipeline.json 의 게이트 정의 개수·`uploaded/` 앱 개수, 웹게임=게이트 문서 개수·편입 게임 수, 블로그=발행 글 수, 영상=발행 영상 수. 사람 개입 지점 수는 각 문서의 "사람 몫/HUMAN" 단계를 센다. 못 센 값은 항목 자체를 뺀다.

구조(첫 공장 예시, 나머지도 동일 형식. `value` 는 실측값):

```json
{
  "id": "app-factory",
  "name": {"ko": "앱 공장", "en": "App Factory"},
  "role": {"ko": "iOS 앱을 기획부터 App Store 제출까지 양산하는 파이프라인", "en": "A pipeline that ships iOS apps from planning to App Store submission"},
  "stages": [
    {"name": {"ko": "시장 조사·기획", "en": "Research & plan"}, "kind": "ai"},
    {"name": {"ko": "구현", "en": "Build"}, "kind": "ai"},
    {"name": {"ko": "품질 게이트", "en": "Quality gates"}, "kind": "gate"},
    {"name": {"ko": "스토어 등록·업로드", "en": "Store listing & upload"}, "kind": "ai"},
    {"name": {"ko": "제출 승인", "en": "Submission approval"}, "kind": "human"}
  ],
  "human_role": {"ko": "실기기 연결과 제출 승인만 사람이 합니다.", "en": "A human only connects a real device and approves submission."},
  "metrics": [
    {"label": {"ko": "품질 게이트", "en": "Quality gates"}, "value": "<pipeline.json 에서 센 값>", "as_of": "2026-10-05", "source": "app-factory pipeline.json 게이트 정의 개수"}
  ],
  "outputs": []
}
```

`<…>` 표기는 설명용이며 커밋 전에 숫자 문자열로 바꾼다. 확인: `grep -c '<' data/factories.json` → `0`. `outputs` 는 `services.json` 에 등록된 id 만 넣을 수 있다(없으면 빈 배열).

- [ ] **Step 7: 썸네일 확보**

각 대표 서비스를 Playwright 로 1280x800 캡처해 640x400 으로 저장한다.

```bash
mkdir -p assets/services
# playwright MCP: browser_navigate → browser_take_screenshot (filename: assets/services/<id>.png)
sips -z 400 640 assets/services/*.png
ls -la assets/services
```
Expected: 대표 서비스 수만큼 PNG, 각 300KB 이하(초과 시 `sips -s format jpeg` 후 `thumb` 경로 확장자 변경).

- [ ] **Step 8: 통과 확인**

Run: `node --test tests/data.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 9: 커밋**

```bash
git add data assets/services tests/data.test.mjs
git commit -m "feat: seed verified registry data"
```

---

### Task 5: 디자인 시스템 CSS + 홈 템플릿 → 시안 체크포인트

**Files:**
- Modify: `css/style.css`
- Create: `src/home.html`, `src/sections/ai.html`(Task 6 에서 본문 이동, 여기선 임시 최소본)

- [ ] **Step 1: 토큰 교체**

`css/style.css` 의 `:root{…}` 블록(2~10행)을 아래로 교체한다. 기존 변수명(`--bg --bg2 --card --card2 --line --text --muted --faint --accent`)은 유지해 기존 컴포넌트가 새 색으로 자동 전환되게 한다.

```css
:root{
  --bg:#FAFAF7; --bg2:#F2F2EC; --card:#FFFFFF; --card2:#F7F7F2;
  --line:#E4E4DC; --text:#16181D; --muted:#515867; --faint:#7A8191;
  --accent:#3B4BDB; --accent-ink:#FFFFFF; --accent-soft:rgba(59,75,219,.08);
  --ok:#1A7F4B; --warn:#9A6700;
  --stage-ai:#3B4BDB; --stage-gate:#9A6700; --stage-human:#1A7F4B;
  --mono:"JetBrains Mono","SF Mono",ui-monospace,Menlo,Consolas,monospace;
  --maxw:1120px; --r:10px;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0F1115; --bg2:#14171D; --card:#171A21; --card2:#1B1F27;
    --line:#262B35; --text:#ECEEF2; --muted:#A3AABA; --faint:#7C8497;
    --accent:#7C8CFF; --accent-ink:#0F1115; --accent-soft:rgba(124,140,255,.12);
    --ok:#4CC38A; --warn:#E2B04A;
    --stage-ai:#7C8CFF; --stage-gate:#E2B04A; --stage-human:#4CC38A;
  }
}
```

- [ ] **Step 2: 그래디언트·하드코딩 색 제거**

```bash
grep -n 'grad\|rgba(11,14,20\|#38BDF8\|#7C5CFF\|#22D3C4\|#08111A\|#0B0E14\|btn-ai\|hero-ring\|\.blob' css/style.css
```
위 목록의 각 규칙을 처리한다: `.grad-text`/`--grad` 사용처는 `color:var(--accent)` 로, `nav` 배경은 `color-mix(in srgb,var(--bg) 85%,transparent)` 로, `.btn-grad`/`.btn-blog` 는 아래 `.btn-primary` 로 통합, `.btn-ai`·`.hero-ring`·`.blob`·애니메이션 keyframes(`aisheen`,`aiblink`)는 삭제한다.
확인: `grep -c 'grad\|#38BDF8\|#7C5CFF' css/style.css` → `0`

- [ ] **Step 3: 신규 컴포넌트 CSS 추가**

`css/style.css` 끝에 추가:

```css
/* ===== v2: hub components ===== */
.mono{font-family:var(--mono);font-feature-settings:"tnum"}
.btn-primary{background:var(--accent);color:var(--accent-ink);border:1px solid var(--accent)}
.btn-primary:hover{filter:brightness(1.08)}
.btn:focus-visible,a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.sec-no{font-family:var(--mono);font-size:13px;color:var(--faint);letter-spacing:.04em}
.sec-no b{color:var(--accent);font-weight:600}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);transition:border-color .15s,transform .15s}
.card:hover{border-color:var(--accent);transform:translateY(-2px)}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.hero2{padding:128px 0 56px}
.hero2 h1{font-size:clamp(32px,5vw,52px);line-height:1.15;letter-spacing:-.025em;font-weight:800;max-width:18em}
.hero2 .lead{color:var(--muted);font-size:18px;max-width:40em;margin:18px 0 28px}
.hero2-grid{display:grid;grid-template-columns:1fr 160px;gap:40px;align-items:center}
.hero2 .portrait{width:160px;height:160px;border-radius:50%;object-fit:cover;object-position:top;border:1px solid var(--line);background:var(--bg2)}
.hstats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:var(--r);background:var(--card);margin-top:40px}
.hstat{padding:20px 24px;border-right:1px solid var(--line)}
.hstat:last-child{border-right:0}
.hstat .num{font-size:32px;font-weight:700;color:var(--text)}
.hstat .lbl{color:var(--muted);font-size:14px}
.svc{overflow:hidden;display:flex;flex-direction:column}
.svc-shot{aspect-ratio:8/5;background:var(--bg2);border-bottom:1px solid var(--line);display:grid;place-items:center}
.svc-shot img{width:100%;height:100%;object-fit:cover;display:block}
.shot-fallback{font-size:32px;color:var(--faint)}
.svc-body{padding:20px;display:flex;flex-direction:column;gap:10px;flex:1}
.svc-body h3{font-size:20px;letter-spacing:-.01em}
.svc-body p{color:var(--muted);font-size:15px;flex:1}
.svc-meta{display:flex;gap:8px;align-items:center;font-size:12px}
.badge{padding:2px 8px;border-radius:999px;border:1px solid currentColor;font-weight:600}
.badge-live{color:var(--ok)} .badge-released{color:var(--accent)} .badge-experiment{color:var(--warn)}
.kind{color:var(--faint);text-transform:uppercase}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{font-size:12px;padding:2px 8px;border-radius:6px;background:var(--bg2);color:var(--muted);border:1px solid var(--line)}
.more{color:var(--accent);font-weight:600;font-size:15px}
.col{padding:20px;display:flex;flex-direction:column;gap:10px}
.col-count{font-size:36px;font-weight:700}
.col p{color:var(--muted);font-size:14px;flex:1}
.col-links{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:14px}
.col-links a{color:var(--text);border-bottom:1px solid var(--line)}
.col-foot{display:flex;justify-content:space-between;align-items:center}
.asof{color:var(--faint);font-size:12px}
.fac{padding:24px;display:flex;flex-direction:column;gap:14px}
.fac h3{font-size:22px}
.fac-role{color:var(--muted)}
.flow{list-style:none;display:flex;flex-wrap:wrap;gap:0}
.stage{position:relative;padding:8px 14px;border:1px solid var(--line);border-left-width:3px;background:var(--card2);font-size:13px;margin-right:18px;margin-bottom:8px}
.stage:not(:last-child)::after{content:"→";position:absolute;right:-17px;top:50%;transform:translateY(-50%);color:var(--faint);font-family:var(--mono);font-size:12px}
.stage-ai{border-left-color:var(--stage-ai)} .stage-gate{border-left-color:var(--stage-gate)} .stage-human{border-left-color:var(--stage-human)}
.legend{font-size:12px;color:var(--faint);display:flex;gap:14px;align-items:center}
.dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}
.dot-ai{background:var(--stage-ai)} .dot-gate{background:var(--stage-gate)} .dot-human{background:var(--stage-human)}
.fac-human{font-size:15px}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;border-top:1px solid var(--line);padding-top:14px}
.metric dt{font-size:12px;color:var(--muted)} .metric dd{font-size:24px;font-weight:700}
.fac-outs{list-style:none;display:flex;flex-wrap:wrap;gap:12px;font-size:14px}
.fac-outs a{color:var(--accent);font-weight:600}
.teaser{list-style:none;display:grid;gap:8px;margin-top:16px}
.teaser a{color:var(--accent);font-weight:600}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.filters button{font:inherit;font-size:14px;padding:6px 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--muted);cursor:pointer}
.filters button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
@media (max-width:860px){
  .grid-3,.grid-2,.grid-4{grid-template-columns:1fr}
  .hero2{padding-top:104px}
  .hero2-grid{grid-template-columns:1fr}
  .hero2 .portrait{width:96px;height:96px;order:-1}
  .hstats{grid-template-columns:repeat(2,1fr)}
  .hstat:nth-child(2){border-right:0}
  .hstat:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .flow{flex-direction:column;align-items:flex-start}
  .stage{margin-right:0}
  .stage:not(:last-child)::after{content:"↓";right:auto;left:14px;top:auto;bottom:-14px;transform:none}
}
@media (prefers-reduced-motion:reduce){.card{transition:none}.card:hover{transform:none}}
```

- [ ] **Step 4: 홈 템플릿 작성**

`src/home.html` (경력 압축 타임라인과 AI 섹션은 Task 6 에서 채운다. 이 단계에선 자리만 두지 않고 실제 문구로 작성):

```html
{{>head}}
{{>nav}}

<header class="hero2" id="top"><div class="wrap hero2-grid">
  <div>
    <div class="sec-no">김진완 · Kim Jinwan</div>
    <h1><span data-lang-ko>AI로 서비스를 만들고,<br>직접 운영합니다.</span><span data-lang-en>I build services with AI<br>and run them myself.</span></h1>
    <p class="lead"><span data-lang-ko>소프트웨어 PM이자 풀스택 개발자입니다. 기획부터 출시·운영까지를 AI 공장과 파이프라인으로 자동화해 앱, 웹게임, 웹 도구, 블로그를 만들고 운영합니다.</span><span data-lang-en>I'm a software PM and full-stack developer. I automate planning through release and operations with AI factories and pipelines, and run the apps, web games, web tools and journal they produce.</span></p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="/works/"><span data-lang-ko>작업물 보기</span><span data-lang-en>See the work</span></a>
      <a class="btn btn-ghost" href="/factories/"><span data-lang-ko>AI 공장 보기</span><span data-lang-en>See the factories</span></a>
    </div>
  </div>
  <img class="portrait" src="/assets/portrait_full.png" alt="김진완" width="160" height="160">
</div>
<div class="wrap"><div class="hstats">{{hero_stats}}</div></div></header>

<section class="block" id="services"><div class="wrap">
  <div class="sec-head"><div class="sec-no"><b>01</b> Services</div>
    <h2 class="sec-title"><span data-lang-ko>직접 만들어 운영하는 서비스</span><span data-lang-en>Services I build and operate</span></h2></div>
  <div class="grid-3">{{featured}}</div>
</div></section>

<section class="block alt" id="factories"><div class="wrap">
  <div class="sec-head"><div class="sec-no"><b>02</b> Factories</div>
    <h2 class="sec-title"><span data-lang-ko>서비스를 찍어내는 AI 공장</span><span data-lang-en>The AI factories behind them</span></h2>
    <p class="sec-sub"><span data-lang-ko>각 공장은 단계가 정의돼 있고, 품질 게이트를 통과해야 다음 단계로 갑니다. 사람은 승인할 지점에만 개입합니다.</span><span data-lang-en>Each factory has defined stages and quality gates. A human steps in only at approval points.</span></p></div>
  <div class="grid-2">{{factories}}</div>
</div></section>

<section class="block" id="collections"><div class="wrap">
  <div class="sec-head"><div class="sec-no"><b>03</b> Collections</div>
    <h2 class="sec-title"><span data-lang-ko>계속 늘어나는 작업물</span><span data-lang-en>A growing body of work</span></h2>
    <p class="sec-sub"><span data-lang-ko>이 도메인은 이력서 한 장에서 끝나지 않습니다. 아래는 실제로 공개된 콘텐츠로 이어집니다.</span><span data-lang-en>This domain is more than a résumé. Every link below opens real public content.</span></p></div>
  <div class="grid-4">{{collections}}</div>
</div></section>

{{>ai}}

{{>footer}}
<script src="/js/data.js"></script>
<script src="/js/main.js"></script>
<script src="/js/site-metrics.js" defer></script>
</body>
</html>
```

그리고 임시로 `src/sections/ai.html` 을 빈 섹션 한 줄로 둔다(Task 6 에서 실제 본문으로 교체):

```html
<section class="block alt" id="ai"><div class="wrap"><div class="sec-head"><div class="sec-no"><b>04</b> AI</div></div></div></section>
```

그 외 `src/works.html`, `src/factories.html`, `src/career.html` 도 빌드가 돌도록 최소 골격을 둔다(Task 6~8에서 완성):

```html
{{>head}}
{{>nav}}
<main class="block"><div class="wrap"><h1>TODO-in-task-6-8</h1></div></main>
{{>footer}}
</body></html>
```
(이 골격은 Task 6~8 에서 반드시 교체하며, Task 9 의 테스트가 `TODO-in-task` 문자열 잔존을 실패 처리한다.)

- [ ] **Step 5: 빌드 및 시안 캡처**

```bash
node scripts/build.mjs
python3 -m http.server 8801 >/dev/null 2>&1 &
echo $! > /tmp/kj-server.pid
```
Playwright MCP 로 `http://localhost:8801/` 를 데스크톱(1280x900)과 모바일(390x844)로 캡처하고 라이트/다크 모두 확인한다(`browser_emulate_media` colorScheme).

Expected: 히어로 → 서비스 3카드 → 공장 카드 → 컬렉션 4칸 순서, 콘솔 에러 없음, 가로 스크롤 없음.

- [ ] **Step 6: 체크포인트 — 마스터 확인**

**여기서 멈춘다.** 캡처 4장(데스크톱/모바일 × 라이트/다크)을 마스터에게 보여주고, 분위기·컬러(인디고 `#3B4BDB`) 승인을 받는다. 수정 요청은 토큰·CSS 만 고치고 Step 5 를 반복한다. 승인 전에 Task 6 이후로 진행하지 않는다.

- [ ] **Step 7: 커밋**

```bash
kill $(cat /tmp/kj-server.pid)
git add css/style.css src index.html works factories career
git commit -m "feat: new design tokens, hub components and home template"
```

---

### Task 6: 기존 본문 이관 (경력 페이지 + AI 섹션 + 경력 압축본)

**Files:**
- Create: `src/sections/ai.html`(교체), `src/career.html`(교체)
- Modify: `js/main.js`
- Test: `tests/legacy.test.mjs`

기존 `index.html`(구버전)은 Task 3 이후 빌드가 덮어쓰므로, **구 내용은 git 에서 꺼낸다**: `git show HEAD~N:index.html`(Task 5 커밋 이전 버전). 아래 명령은 구 버전 해시를 변수로 잡는다.

- [ ] **Step 1: 구 index.html 확보**

```bash
OLD=$(git log --format=%h -n1 -- index.html --before="$(git log -1 --format=%cI HEAD~0 -- src/home.html)")
git show $OLD:index.html > /tmp/old-index.html
grep -n '^<!-- CAREER\|^<!-- PROJECTS\|^<!-- AI PRODUCTION\|^<section class="block alt" id="public-work"\|^<!-- WHAT I DO\|^<!-- FOOTER\|id="gameModal\|id="modal"' /tmp/old-index.html
```
Expected: 구 파일의 마커 행번호가 나온다(CAREER≈147, PROJECTS≈171, AI≈181, public-work≈250). 행번호가 다르면 아래 `sed` 범위를 출력된 값으로 맞춘다.

- [ ] **Step 2: 실패하는 테스트 작성**

```js
// tests/legacy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('경력 페이지는 경력·프로젝트·모달을 보존한다', () => {
  const h = fs.readFileSync('career/index.html', 'utf8');
  for (const id of ['id="about"', 'id="career"', 'id="projects"', 'id="pgrid"', 'id="filters"', 'id="modal"', 'id="gameModal"'])
    assert.ok(h.includes(id), id);
  assert.match(h, /\+82-10-4040-1824|k_star_w@naver\.com/);
});
test('홈 AI 섹션은 운영 체계와 지표를 보존한다', () => {
  const h = fs.readFileSync('index.html', 'utf8');
  assert.ok(h.includes('id="ai"')); assert.match(h, /740\+/); assert.match(h, /6원칙|six-principle/);
});
test('main.js 는 경력 요소가 없는 페이지에서 크래시하지 않도록 가드한다', () => {
  const js = fs.readFileSync('js/main.js', 'utf8');
  assert.match(js, /getElementById\('pgrid'\)/); assert.match(js, /if\s*\(!grid\)|if\(!grid\)/);
});
```

- [ ] **Step 3: 실패 확인**

Run: `node --test tests/legacy.test.mjs`
Expected: FAIL (career/index.html 이 골격 상태)

- [ ] **Step 4: AI 섹션 이관**

```bash
sed -n '181,249p' /tmp/old-index.html > src/sections/ai.html
sed -i '' 's/class="block alt" id="ai"/class="block alt" id="ai"/; s/btn-grad/btn-primary/g; s/grad-text//g' src/sections/ai.html
```
이어서 섹션 머리(`<div class="eyebrow">AI Production</div>`)를 `<div class="sec-no"><b>04</b> AI</div>` 로 바꾼다. 내용(운영 6원칙·지표 9/740+/51+/36K+)은 그대로 둔다. 단, 수치가 오래됐으면 마스터에게 갱신 여부를 묻고, 확인 못 하면 `as of 2026-09` 라벨을 붙인다.

- [ ] **Step 5: 경력 페이지 조립**

```bash
{
  echo '{{>head}}'; echo '{{>nav}}'
  echo '<main>'
  sed -n '132,180p' /tmp/old-index.html     # about + career + projects
  echo '</main>'
  echo '{{>footer}}'
  sed -n '318,339p' /tmp/old-index.html     # game button + game modal + modal
  echo '<script src="/js/data.js"></script><script src="/js/main.js"></script><script src="/js/site-metrics.js" defer></script>'
  echo '</body></html>'
} > src/career.html
sed -i '' 's/btn-grad/btn-primary/g; s/grad-text//g' src/career.html
```

- [ ] **Step 6: main.js 가드 추가**

`js/main.js` 의 `renderProjects()` 와 `buildFilters()` 시작부, `moreBtn` 핸들러에 요소 존재 가드를 넣는다.

```js
function buildFilters(){
  const f=document.getElementById('filters');
  if(!f) return;
  /* 이하 기존 본문 그대로 */
}

function renderProjects(){
  const grid=document.getElementById('pgrid');
  if(!grid) return;
  buildFilters();
  /* 이하 기존 본문(단, 첫 줄의 grid 선언은 위로 이동) */
}
const moreBtn0=document.getElementById('moreBtn');
if(moreBtn0) moreBtn0.onclick=()=>{shown+=9;renderProjects();};
```
기존 `renderProjects` 내부의 `const mb=document.getElementById('moreBtn'); mb.style.display=…` 는 `if(mb)` 로 감싼다. `nav` 스크롤 리스너와 언어 토글은 모든 페이지에서 동작해야 하므로 그대로 둔다. `js/data.js` 는 `window.PROJECTS` 만 정의하므로 홈에서 로드돼도 무해하나, 불필요 로드를 피하려고 `src/home.html` 의 `<script src="/js/data.js">` 줄을 삭제한다.

- [ ] **Step 7: 빌드·통과 확인**

Run: `node scripts/build.mjs && node --test tests/legacy.test.mjs`
Expected: PASS (3 tests)

브라우저로 `/career/` 를 열어 프로젝트 그리드·필터·모달·언어 토글이 동작하는지 확인한다(Playwright 클릭, 콘솔 에러 0).

- [ ] **Step 8: 홈의 경력 압축 타임라인 추가**

`src/home.html` 의 `{{>ai}}` 뒤, `{{>footer}}` 앞에 삽입. 항목은 `/tmp/old-index.html` 의 `tl-item` 상단 4개(오비고 2024~, 이전 3개 회사)에서 연도·회사·직함만 뽑아 쓴다.

```bash
grep -o '<div class="yr">[^<]*\(<span[^>]*>[^<]*</span>\)*[^<]*</div>\|<h3>.*</h3>' /tmp/old-index.html | sed -n '1,16p'
```
출력된 4개 항목으로 아래 형태를 채운다(문구는 출력 그대로, 임의 작성 금지):

```html
<section class="block" id="career-brief"><div class="wrap">
  <div class="sec-head"><div class="sec-no"><b>05</b> Career</div>
    <h2 class="sec-title"><span data-lang-ko>경력 — 11년</span><span data-lang-en>Career — 11 years</span></h2></div>
  <ol class="timeline brief">
    <li class="tl-item"><div class="yr">연도 · 회사</div><h3>직함</h3></li>
    <!-- 4개 항목 -->
  </ol>
  <p><a class="more" href="/career/"><span data-lang-ko>전체 경력과 프로젝트 55개 →</span><span data-lang-en>Full career and 55 projects →</span></a></p>
</div></section>
```
`<!-- 4개 항목 -->` 주석은 4개의 실제 `<li>` 로 교체하고 주석은 남기지 않는다.

- [ ] **Step 9: 커밋**

```bash
node scripts/build.mjs
git add src js tests/legacy.test.mjs index.html career
git commit -m "feat: move career and AI sections into new structure"
```

---

### Task 7: `/works` 페이지 (종류 필터)

**Files:**
- Modify: `src/works.html`, `js/main.js`, `css/style.css`(필터 이미 추가됨)
- Test: `tests/works.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/works.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const h = () => fs.readFileSync('works/index.html', 'utf8');
test('/works 는 JS 없이 모든 서비스와 컬렉션을 초기 HTML 에 포함한다', () => {
  const services = JSON.parse(fs.readFileSync('data/services.json', 'utf8'));
  const cols = JSON.parse(fs.readFileSync('data/collections.json', 'utf8'));
  for (const s of services) assert.ok(h().includes(s.url), s.id);
  for (const c of cols) assert.ok(h().includes(c.url), c.id);
});
test('/works 는 종류 필터 버튼을 가진다', () => {
  for (const k of ['all', 'service', 'game', 'tool', 'app', 'blog']) assert.ok(h().includes(`data-filter="${k}"`), k);
});
test('골격 TODO 가 남아 있지 않다', () => assert.doesNotMatch(h(), /TODO-in-task/));
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/works.test.mjs`
Expected: FAIL

- [ ] **Step 3: 템플릿 작성**

```html
{{>head}}
{{>nav}}
<main class="block" style="padding-top:112px"><div class="wrap">
  <div class="sec-head"><div class="sec-no"><b>Works</b></div>
    <h1 class="sec-title"><span data-lang-ko>작업물 전체</span><span data-lang-en>All work</span></h1>
    <p class="sec-sub"><span data-lang-ko>AI로 만들고 직접 운영하는 서비스, 웹게임, 웹 도구, 앱, 블로그입니다. 새 작업물이 생기면 이 목록이 함께 늘어납니다.</span><span data-lang-en>Services, web games, web tools, apps and a journal that I build with AI and operate myself. The list grows as new work ships.</span></p></div>
  <div class="filters" role="group" aria-label="filter">
    <button data-filter="all" aria-pressed="true">All</button>
    <button data-filter="service" aria-pressed="false">Services</button>
    <button data-filter="game" aria-pressed="false">Games</button>
    <button data-filter="tool" aria-pressed="false">Tools</button>
    <button data-filter="app" aria-pressed="false">Apps</button>
    <button data-filter="blog" aria-pressed="false">Journal</button>
  </div>
  <div class="grid-3" id="works-grid">
    {{all_services}}
    {{collections}}
  </div>
</div></main>
{{>footer}}
<script src="/js/main.js"></script>
<script src="/js/site-metrics.js" defer></script>
</body></html>
```

- [ ] **Step 4: 필터 JS (점진적 향상)**

`js/main.js` 끝에 추가:

```js
// ===== /works 종류 필터 (JS 없으면 전부 보임) =====
(function(){
  const grid=document.getElementById('works-grid');
  if(!grid) return;
  const btns=document.querySelectorAll('.filters [data-filter]');
  btns.forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.filter;
    btns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    grid.querySelectorAll('[data-kind]').forEach(el=>{el.hidden = !(k==='all'||el.dataset.kind===k);});
  }));
})();
```

- [ ] **Step 5: 통과 확인 및 브라우저 확인**

Run: `node scripts/build.mjs && node --test tests/works.test.mjs`
Expected: PASS (3 tests). 브라우저에서 필터 클릭 시 카드가 숨겨지고 모바일에서 1열인지 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/works.html js/main.js tests/works.test.mjs works
git commit -m "feat: add /works page with kind filter"
```

---

### Task 8: `/factories` 페이지

**Files:**
- Modify: `src/factories.html`
- Test: `tests/factories.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/factories.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const h = () => fs.readFileSync('factories/index.html', 'utf8');
const data = () => JSON.parse(fs.readFileSync('data/factories.json', 'utf8'));
test('모든 공장이 앵커 id 와 함께 렌더된다', () => { for (const f of data()) assert.ok(h().includes(`id="${f.id}"`), f.id); });
test('공장마다 사람 몫과 단계 3종 범례가 있다', () => {
  assert.equal((h().match(/class="fac-human"/g) || []).length, data().length);
  assert.ok(h().includes('dot-human'));
});
test('공개 수위: 내부 경로·비용·키 문자열이 출력에 없다', () => {
  assert.doesNotMatch(h(), /\/Users\/|~\/Projects|\$\d{2,}|토큰|api[_-]?key|ca-app-pub/i);
});
test('수치마다 기준일이 표시된다', () => {
  const metrics = data().flatMap(f => f.metrics);
  for (const m of metrics) assert.ok(h().includes(m.as_of));
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/factories.test.mjs`
Expected: FAIL

- [ ] **Step 3: 템플릿 작성**

```html
{{>head}}
{{>nav}}
<main class="block" style="padding-top:112px"><div class="wrap">
  <div class="sec-head"><div class="sec-no"><b>Factories</b></div>
    <h1 class="sec-title"><span data-lang-ko>서비스를 찍어내는 AI 공장</span><span data-lang-en>The AI factories</span></h1>
    <p class="sec-sub"><span data-lang-ko>공장은 "AI가 알아서 한다"가 아니라, 단계와 품질 게이트가 정의된 파이프라인입니다. 게이트를 통과하지 못하면 다음 단계로 가지 못하고, 사람은 승인할 지점에만 개입합니다. 수치는 기준일 시점의 실측값입니다.</span><span data-lang-en>A factory is not "AI does whatever"; it's a pipeline with defined stages and quality gates. Work cannot advance past a failing gate, and a human steps in only at approval points. Figures are measured as of the date shown.</span></p></div>
  <div class="grid-2">{{factories}}</div>
</div></main>
{{>footer}}
<script src="/js/main.js"></script>
<script src="/js/site-metrics.js" defer></script>
</body></html>
```

- [ ] **Step 4: 통과 확인**

Run: `node scripts/build.mjs && node --test tests/factories.test.mjs`
Expected: PASS (4 tests). 브라우저에서 모바일 흐름도가 세로 스택으로 접히는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/factories.html tests/factories.test.mjs factories
git commit -m "feat: add /factories page"
```

---

### Task 9: 사이트 계약 테스트 갱신, 빌드 동기화, sitemap, 배포 문서

**Files:**
- Modify: `tests/site.test.mjs`, `sitemap.xml`, `DEPLOYMENT.md`, `README.md`, `VERSION`
- Create: `tests/build.test.mjs`

- [ ] **Step 1: 빌드 동기화 테스트 작성**

```js
// tests/build.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAll} from '../scripts/build.mjs';

test('커밋된 생성물이 src+data 와 일치한다(수정은 src/data 에서)', () => {
  const out = buildAll({write: false});
  for (const [file, html] of Object.entries(out)) {
    const strip = s => s.replace(/"dateModified":"[\d-]+"/, '');
    assert.equal(strip(fs.readFileSync(file, 'utf8')), strip(html), `${file} is stale — run: node scripts/build.mjs`);
  }
});
test('생성물에 골격 TODO 가 없다', () => {
  for (const f of ['index.html', 'works/index.html', 'factories/index.html', 'career/index.html'])
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /TODO-in-task/);
});
```

주의: `updated` 가 빌드 날짜로 들어가면 날짜가 바뀐 날 이 테스트가 깨진다. 이를 막기 위해 `build.mjs` 의 `new Date()` 사용처(`dateModified`, `ctxBase.updated`)를 `git log -1 --format=%cs -- data src` 값 또는 `data/*.json` 의 최대 `updated`/`as_of` 로 대체한다.

- [ ] **Step 2: 날짜 결정화**

`scripts/build.mjs` 상단에 추가하고 `new Date().toISOString().slice(0,10)` 두 곳을 `STAMP` 로 교체:

```js
const dates = d => [...d.services.map(s => s.updated), ...d.collections.map(c => c.count.as_of), ...d.factories.flatMap(f => f.metrics.map(m => m.as_of))];
const stampOf = d => dates(d).sort().at(-1);
```
`buildAll` 안에서 `const STAMP = stampOf(data);` 로 계산해 `schemaFor(page, STAMP)` 와 `ctxBase.updated` 에 쓴다. 이후 테스트의 `strip` 정규식은 불필요하므로 제거해도 된다.

- [ ] **Step 3: 사이트 계약 테스트 갱신**

`tests/site.test.mjs` 는 구 단일 페이지 구조(`id="journal"`, `id="public-work"`, 버튼 클래스 `btn-blog`, 문구 "무료 웹 도구 쓰기" 등)에 묶여 있다. **새 계약으로 의도적으로 교체**한다(삭제가 아니라, 보존해야 할 본질만 남긴다).

```js
// tests/site.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const read = f => fs.readFileSync(f, 'utf8');
const PAGES = ['index.html', 'works/index.html', 'factories/index.html', 'career/index.html'];

test('외부 서브도메인 링크는 모두 새 창·noopener 로 연다', () => {
  for (const f of PAGES) for (const m of read(f).matchAll(/<a\b[^>]*href="https:\/\/(?:blog|apps|games|forge|prism-studio)\.kimjinwan\.com\/[^"]*"[^>]*>/g)) {
    assert.match(m[0], /target="_blank"/, f); assert.match(m[0], /rel="noopener noreferrer"/, f);
  }
});
test('홈이 블로그·웹도구·웹게임·Forge·Prism 으로 연결된다', () => {
  const h = read('index.html');
  for (const u of ['https://blog.kimjinwan.com/ko/', 'https://apps.kimjinwan.com/', 'https://games.kimjinwan.com/', 'https://forge.kimjinwan.com/', 'https://prism-studio.kimjinwan.com/'])
    assert.ok(h.includes(u), u);
  assert.ok(h.includes('https://blog.kimjinwan.com/ko/ai/ai-writing-index/') || h.includes('https://blog.kimjinwan.com/ko/apps/app-archive/'));
});
test('robots.txt 는 네 사이트맵을 명시한다', () => {
  const r = read('robots.txt');
  for (const s of ['https://kimjinwan.com', 'https://blog.kimjinwan.com', 'https://apps.kimjinwan.com', 'https://games.kimjinwan.com'])
    assert.ok(r.includes(`Sitemap: ${s}/sitemap.xml`), s);
});
test('서버에서 보존한 광고 파일을 유지한다', () => {
  for (const file of ['app-ads.txt', 'ads.txt'])
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), '422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0');
});
test('모든 페이지에 메타·파비콘·애드센스 계정 메타가 있다', () => {
  for (const f of PAGES) {
    const h = read(f);
    for (const t of ['name="description"', 'name="robots" content="index,follow"', 'rel="canonical"', 'property="og:title"', 'property="og:url"', 'name="twitter:card"', 'name="google-adsense-account" content="ca-pub-5544615855471151"'])
      assert.ok(h.includes(t), f + ' ' + t);
    for (const i of ['favicon.svg', 'favicon.ico', 'favicon-96.png', 'apple-touch-icon.png']) assert.ok(h.includes('/' + i), f + i);
    JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  }
  const home = read('index.html');
  const schema = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(schema['@graph'].some(x => x['@type'] === 'ProfilePage'));
});
test('sitemap 에 네 페이지와 게임이 있다', () => {
  const x = read('sitemap.xml');
  for (const p of ['/', '/works/', '/factories/', '/career/', '/game/']) assert.ok(x.includes(`<loc>https://kimjinwan.com${p}</loc>`), p);
});
test('canonical 은 페이지별 자기 URL 이다', () => {
  const want = {'index.html': '/', 'works/index.html': '/works/', 'factories/index.html': '/factories/', 'career/index.html': '/career/'};
  for (const [f, p] of Object.entries(want)) assert.ok(read(f).includes(`<link rel="canonical" href="https://kimjinwan.com${p}">`), f);
});
test('Career Run 게임 진입점이 경력 페이지에 남아 있다', () => {
  assert.ok(read('career/index.html').includes('openGame'));
  assert.ok(fs.existsSync('game/index.html'));
});
```

- [ ] **Step 4: sitemap 갱신**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kimjinwan.com/</loc><lastmod>2026-10-05</lastmod></url>
  <url><loc>https://kimjinwan.com/works/</loc><lastmod>2026-10-05</lastmod></url>
  <url><loc>https://kimjinwan.com/factories/</loc><lastmod>2026-10-05</lastmod></url>
  <url><loc>https://kimjinwan.com/career/</loc><lastmod>2026-10-05</lastmod></url>
  <url><loc>https://kimjinwan.com/game/</loc></url>
</urlset>
```

- [ ] **Step 5: 문서·버전 갱신**

- `VERSION` → `1.1.0`
- `DEPLOYMENT.md` 맨 위에 `## 1.1.0 — AI 제작·운영 허브 개편` 절 추가: 구조(`/ /works /factories /career`), 빌드 방식(`node scripts/build.mjs`, 생성물 직접 수정 금지), **공개 허용 목록에 `works/ factories/ career/` 추가**(`data/`·`src/`·`scripts/`·`tests/` 는 배포 제외), ads 파일 해시 불변.
- `README.md` 의 구조 절을 새 구조로 갱신하고 "수정은 src/data 에서, 이후 `node scripts/build.mjs`" 를 명시.

- [ ] **Step 6: 전체 테스트**

Run: `node scripts/build.mjs && node --test tests/*.test.mjs`
Expected: 전부 PASS (실패 시 해당 테스트 출력 확인 후 원인 수정; 테스트를 완화해서 통과시키지 않는다)

- [ ] **Step 7: 커밋**

```bash
git add tests sitemap.xml DEPLOYMENT.md README.md VERSION scripts/build.mjs index.html works factories career
git commit -m "feat: site contract tests, sitemap, docs for v1.1.0"
```

---

### Task 10: 최종 검증과 배포 (마스터 승인 필요)

- [ ] **Step 1: 로컬 전수 점검**

```bash
node scripts/build.mjs && node --test tests/*.test.mjs
python3 -m http.server 8801 >/dev/null 2>&1 & echo $! > /tmp/kj-server.pid
```
Playwright 로 4개 페이지 × (데스크톱·모바일) × (KO·EN) × (라이트·다크) 를 열어 확인한다: 콘솔 에러 0, 가로 스크롤 0, 깨진 이미지 0, 외부 링크 전부 200(`curl -s -o /dev/null -w "%{http_code}"`), 언어 토글 후 `/career/` 그리드·모달 동작, 키보드 Tab 으로 포커스 링 보임. 링크 검사는 생성된 HTML 의 `href` 를 추출해 일괄 curl 한다.

- [ ] **Step 2: 접근성·성능 스팟체크**

본문 텍스트 대비 AA(4.5:1) — 라이트/다크 토큰 쌍(`--muted` on `--bg`, `--accent` on `--bg`, `--faint` on `--bg`)을 계산해 확인한다. 미달 토큰은 값만 조정한다. 이미지 총량 페이지당 1MB 이하.

- [ ] **Step 3: 마스터 승인 요청 → 배포**

**여기서 멈춘다.** 로컬 검증 결과를 보고하고, 배포 승인을 받는다(서버 `/var/www/kimjinwan/releases/1.1.0` 신규 릴리스 + `current` 링크 전환, 직전 릴리스 1.0.7 유지, `DEPLOYMENT.md` 의 공개 허용 목록 규칙을 따른다). 승인 후에만 진행하며, 배포 직후 `ads.txt`·`app-ads.txt` SHA-256 이 불변인지, `/`, `/works/`, `/factories/`, `/career/` 가 200 인지, 구 앵커(`/#services` 등) 진입이 깨지지 않는지 확인한다.

- [ ] **Step 4: 서버 정리·커밋**

```bash
kill $(cat /tmp/kj-server.pid)
git status --short
git log --oneline | head -12
```
Expected: 작업 트리 clean.

---

## Self-Review

**Spec coverage**
- 정보 구조 4경로 → Task 5/6(홈·career), 7(works), 8(factories). 홈 6블록: 히어로+지표(5), 대표 서비스(5), 공장(5), 컬렉션(5), AI(6), 경력 압축(6), 연락(footer 파셜).
- 데이터 SSOT(`services.json`/`factories.json`) → Task 1, 4. 지표 자동 집계 → Task 2 `heroStats`. `collections.json` 은 spec 보완으로 명시.
- 공장 섹션 5요소(역할/흐름도/AI·사람 분리/수치+기준일/산출물) → Task 2 `factoryCard`, 테스트로 검증.
- 공개 수위 → Task 2·4·8 테스트가 내부 경로·키·비용 문자열을 차단.
- 디자인(인디고, 헤어라인, 모노, 그래디언트 제거, 다크 토큰, 모바일 스택, 모션 최소) → Task 5.
- 신뢰 장치(기준일, 라이브 링크) → `asof` 표기, Task 10 링크 전수 검사.
- 애드센스 제약(ads 해시, 공개 초기 HTML, 메타/구조화데이터) → 빌드 타임 렌더, Task 3 head 파셜, Task 9 테스트.
- 결정 3건(대표 3개, 인디고, 수치 4종) → Task 4(Gizmo 상표 확인 포함), Task 5, Task 4 수치 규칙. 수치 4종 중 "사람 개입 지점 수" 는 stages 의 human 개수로 도출 가능하나 metrics 로 명시 기재한다.

**Placeholder scan:** `Task 4` 의 `value: 0`·`<…>` 는 실측 입력 슬롯이며 각각 `grep` 검증 단계가 있다. `src/*.html` 골격의 `TODO-in-task` 는 Task 9 테스트가 잔존을 실패 처리한다.

**Type consistency:** `validate({services,collections,factories})`, `serviceCard(s)`, `collectionCard(c)`, `factoryCard(f, Map)`, `heroStats({services,collections})`, `fill(tpl, ctx, partials)`, `buildAll({write})`, `loadData()` — 정의와 사용처 일치. 템플릿 변수 `hero_stats, featured, all_services, collections, factories, factories_teaser, version, title, description, canonical, schema, updated` 는 `build.mjs` 의 `ctxBase`/페이지 ctx 에서 모두 제공된다(`factories_teaser` 는 현재 템플릿에서 미사용이며 `fill` 은 미사용 키를 허용하므로 무해, 불필요하면 삭제).

---

## 개정 태스크 (2026-10-05, 시안 확인 후 유저 지시) — Task 5b 를 Task 6 앞에 수행

Task 5b: 사람 중심 카피 재작성 + 시간 기반 테마 + 아이콘 시스템 (스펙 '개정' 절 참조). 이후 Task 6~8 의 모든 신규/이관 카피도 같은 톤(1인칭, 개발자 · PM 김진완)으로 쓴다. Task 7·8 의 제목/설명 문구와 테스트의 문구 의존은 5b 이후 값에 맞춘다.

### 개정 2 (2026-10-05, 유저: "경력·강점·프로젝트도 담겨야 한다") — Task 6 확장

홈 섹션 순서를 **히어로 → 01 강점 → 02 서비스 → 03 AI 공장 → 04 경력·대표 프로젝트 → 05 컬렉션 → 06 AI 활용 → 연락** 으로 바꾼다.

- `data/profile.json` 신설(SSOT): `strengths[4]`(icon, title{ko,en}, text{ko,en}), `timeline[4]`(period, company{ko,en}, title{ko,en}, role{ko,en}, text{ko,en}), `featured_projects` = `[46, 50, 9, 37, 26, 43]`(js/data.js 의 id: 벤츠 Live TV, 르노 PickJoy 게임플랫폼, 코인거래소 벤타스비트, 독거노인 모니터링 2차, PBL 의대생 교육, 제네시스 블룸버그 WebApp). 문구는 기존 index.html(#about, #career)의 한·영 내용을 **그대로 가져와 1인칭/사람 중심으로만 다듬는다**(사실·수치·회사·기간 불변).
- 빌드는 `js/data.js`(`window.PROJECTS = [...]`)를 JSON 으로 파싱해 대표 프로젝트 카드(연도·회사·역할·설명·스택 칩·종류 아이콘)를 서버 렌더한다. 전체 55개 + 필터 + 모달은 `/career` 에서 기존 동작 유지.
- 홈의 04 섹션 = 타임라인 4개(회사·기간·직함·핵심 성과) + 대표 프로젝트 6카드 + "전체 55개 보기 → /career".
- `/career` = 강점 4개 + 전체 타임라인 + 프로젝트 그리드(필터·모달) + Career Run 게임 진입.
- 테스트: profile.json 스키마(검증기 확장), 홈에 강점 4개·타임라인 4개·대표 프로젝트 6개 존재, 대표 id 가 data.js 에 실존, `/career` 에 전체 프로젝트 그리드·모달 존재.
