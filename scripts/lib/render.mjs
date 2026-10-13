// scripts/lib/render.mjs
import {icon} from './icons.mjs';
export const EXT = 'target="_blank" rel="noopener noreferrer"';
const STATUS_LABEL = {live: 'LIVE', released: 'RELEASED', experiment: 'EXPERIMENT', prelaunch: 'PRE-LAUNCH'};

export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
export const bi = o => `<span data-lang-ko>${esc(o.ko)}</span><span data-lang-en>${esc(o.en)}</span>`;
export const open = {ko: '열기', en: 'Open'};
export const asOf = {ko: '기준', en: 'as of'};
const KIND_ICON = {service: 'layers', game: 'gamepad', tool: 'wrench', app: 'smartphone', blog: 'book-open'};
const STAGE_ICON = {ai: 'sparkles', gate: 'shield-check', human: 'hand'};
export const ext = icon('arrow-up-right', {size: 14, cls: 'ico-ext'});

// 서비스 분류: 순서가 곧 노출 순서. 새 분류는 여기와 validate.mjs 의 CATEGORIES 에 같이 추가한다.
export const CATEGORY = [
  {key: 'document', icon: 'file-text', label: {ko: '문서·업무', en: 'Documents & work'}, blurb: {ko: '문서를 쓰고 고치고 제출하는 일', en: 'Writing, editing and submitting documents'}},
  {key: 'creative', icon: 'sparkles', label: {ko: '디자인·창작', en: 'Design & creative'}, blurb: {ko: '이미지와 시각 작업', en: 'Images and visual work'}},
  {key: 'build', icon: 'wrench', label: {ko: '개발·제작', en: 'Build & make'}, blurb: {ko: '서비스를 만드는 도구', en: 'Tools for building services'}},
  {key: 'hub', icon: 'gamepad', label: {ko: '게임·도구·글', en: 'Games, tools & writing'}, blurb: {ko: '계속 늘어나는 웹게임·웹 도구·블로그', en: 'Ever-growing web games, tools and journal'}},
  {key: 'ai-tools', icon: 'layers', label: {ko: 'AI 도구 모음', en: 'AI tool collections'}, blurb: {ko: '일상 업무용 작은 AI 도구', en: 'Small AI tools for everyday work'}},
];
const catOf = s => CATEGORY.find(c => c.key === s.category);
const HOME_VISIBLE = Infinity; // 홈에서 먼저 보이는 카드 수. 지금은 전부 노출. 길어지면 숫자(3열 × 2줄 = 6)로 낮추면 나머지가 '더 보기'(details)로 접힌다.
// 이름순(대소문자 무시). 분류는 정렬이 아니라 칩 거르기로만 쓴다.
export function sortServices(services) {
  return [...services].sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
}

export function serviceCard(s) {
  const thumb = s.thumb && !/^(https?:)?\/\//.test(s.thumb) ? '/' + s.thumb.replace(/^\/+/, '') : s.thumb;
  const shot = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(s.name)} screenshot" loading="lazy" width="640" height="400">`
    : `<span class="mono shot-fallback">${esc(s.name.slice(0, 2).toUpperCase())}</span>`;
  const chips = s.ai_tools.map(t => `<span class="chip mono">${esc(t)}</span>`).join('');
  return `<article class="card svc" data-kind="${esc(s.kind)}" data-category="${esc(s.category)}">
  <div class="svc-shot">${shot}</div>
  <div class="svc-body">
    <div class="svc-meta"><span class="badge badge-${esc(s.status)} mono">${STATUS_LABEL[s.status]}</span><span class="kind mono">${icon(KIND_ICON[s.kind] || 'layers', {size: 14})}${catOf(s) ? bi(catOf(s).label) : esc(s.kind)}</span></div>
    <h3>${esc(s.name)}</h3>
    <p class="svc-tag">${bi(s.tagline)}</p>
    <p>${bi(s.summary)}</p>
    <div class="chips">${chips}</div>
    <a class="more" href="${esc(s.url)}" ${EXT}>${bi(open)}${ext}</a>
  </div>
</article>`;
}

// 홈 02-1: 대표 서비스를 크게, 같은 무게로 — 가로 한 행(스크린샷 + 설명). /works 의 serviceCard(data-kind 필터 대상)와 별개
export function serviceFeature(s) {
  const thumb = s.thumb && !/^(https?:)?\/\//.test(s.thumb) ? '/' + s.thumb.replace(/^\/+/, '') : s.thumb;
  const shot = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(s.name)} screenshot" loading="lazy" width="640" height="400">`
    : `<span class="mono shot-fallback">${esc(s.name.slice(0, 2).toUpperCase())}</span>`;
  const host = new URL(s.url).host;
  const chips = s.ai_tools.map(t => `<span class="chip mono">${esc(t)}</span>`).join('');
  return `<article class="card svc-wide" id="svc-${esc(s.id)}" data-category="${esc(s.category)}">
  <div class="svcw-shot">${shot}</div>
  <div class="svcw-body">
    <div class="svc-meta"><span class="badge badge-${esc(s.status)} mono">${STATUS_LABEL[s.status]}</span><span class="kind mono">${catOf(s) ? icon(catOf(s).icon, {size: 14}) + bi(catOf(s).label) : esc(s.kind)}</span></div>
    <h5>${esc(s.name)}</h5>
    <p class="svc-tag">${bi(s.tagline)}</p>
    <p>${bi(s.summary)}</p>
    <div class="svcw-tools"><span class="svcw-lbl mono">${bi({ko: '함께 만든 AI', en: 'Built with'})}</span><div class="chips">${chips}</div></div>
    <a class="btn btn-ghost svcw-open" href="${esc(s.url)}" ${EXT}>${bi(open)}<span class="mono svcw-host">${esc(host)}</span>${ext}</a>
  </div>
</article>`;
}

// 홈 02-1: 한 줄 3장 격자. 분류 칩은 거르기 버튼, 처음 HOME_VISIBLE 장만 보이고 나머지는 '더 보기'로 접힌다.
export function serviceGroups(services) {
  const sorted = sortServices(services);
  const cats = CATEGORY.filter(c => sorted.some(s => s.category === c.key));
  const chip = (k, ic, label, n, on) => `<button type="button" class="pill" data-svc-cat="${k}" aria-pressed="${on}">${ic ? icon(ic, {size: 16}) : ''}${bi(label)}<span class="pill-n mono">${n}</span></button>`;
  const chips = chip('all', 'layers', {ko: '전체', en: 'All'}, sorted.length, true)
    + cats.map(c => chip(c.key, c.icon, c.label, sorted.filter(s => s.category === c.key).length, false)).join('');
  const shown = sorted.slice(0, HOME_VISIBLE).map(serviceFeature).join('\n');
  const rest = sorted.slice(HOME_VISIBLE);
  const more = rest.length
    ? `\n<details class="fold svc-fold"><summary><span class="fold-open">${bi({ko: `${rest.length}개 더 보기`, en: `Show ${rest.length} more`})}</span><span class="fold-close">${bi({ko: '접기', en: 'Show less'})}</span></summary>\n<div class="svc-feature">${rest.map(serviceFeature).join('\n')}</div></details>`
    : '';
  return `<div class="svc-jump" role="group" aria-label="service categories">${chips}</div>\n<div class="svc-feature" id="svc-grid">${shown}</div>${more}`;
}

export function collectionCard(c) {
  const links = (c.previews || []).map(p => `<li><a href="${esc(p.url)}" ${EXT}>${typeof p.name === 'object' ? bi(p.name) : esc(p.name)}${ext}</a></li>`).join('');
  return `<article class="card col" data-kind="${esc(c.kind)}">
  <div class="col-count mono">${icon(KIND_ICON[c.kind] || 'layers', {size: 22, cls: 'col-ico'})}<span>${esc(c.count.value)}</span></div>
  <h3>${bi(c.name)}</h3>
  <p>${bi(c.summary)}</p>
  <ul class="col-links">${links}</ul>
  <div class="col-foot"><a class="more" href="${esc(c.url)}" ${EXT}>${bi(open)}${ext}</a><span class="asof mono">${icon('clock', {size: 13})}${bi(asOf)} ${esc(c.count.as_of)}</span></div>
</article>`;
}

export const stageLegend = () => `<p class="legend mono"><span class="lg lg-ai">${icon('sparkles', {size: 14})}AI</span><span class="lg lg-gate">${icon('shield-check', {size: 14})}GATE</span><span class="lg lg-human">${icon('hand', {size: 14})}HUMAN</span></p>`;

// 공장 1개 = 한 편의 짧은 글(행): 왼쪽 이름·역할, 오른쪽 흐름도·직접 맡는 일·수치
export function factoryCard(f, servicesById, {link = false} = {}) {
  const stages = f.stages.map(st => `<li class="stage stage-${st.kind}">${icon(STAGE_ICON[st.kind], {size: 16, cls: 'ico-stage'})}<span class="mono">${bi(st.name)}</span></li>`).join('');
  const metrics = f.metrics.map(m => `<div class="metric"><dt>${icon('bar-chart', {size: 14})}${bi(m.label)}</dt><dd class="mono">${esc(m.value)}</dd><span class="asof mono">${icon('clock', {size: 13})}${esc(m.as_of)}</span></div>`).join('');
  const outs = f.outputs.map(id => servicesById.get(id)).filter(Boolean)
    .map(s => `<li><a href="${esc(s.url)}" ${EXT}>${esc(s.name)}${ext}</a></li>`).join('');
  return `<article class="fac" id="${esc(f.id)}">
  <div class="fac-head">
    <h3>${f.icon ? icon(f.icon, {size: 22, cls: 'fac-ico'}) : ''}<span>${link ? `<a href="/factories/#${esc(f.id)}">${bi(f.name)}</a>` : bi(f.name)}</span></h3>
    <p class="fac-role">${bi(f.role)}</p>
    ${f.paused ? `<p class="fac-paused">${icon('clock', {size: 15})}<span><strong class="mono">${bi({ko: '운영 중단', en: 'ON HOLD'})}</strong> ${bi(f.paused.note)}</span></p>` : ''}
    ${f.showcase ? `<a class="more" href="${esc(f.showcase.url)}" ${EXT}>${bi({ko: '생성물 보기', en: 'See the output'})} <span class="fac-to">· ${bi(f.showcase.label)}</span>${ext}</a>` : ''}
  </div>
  <div class="fac-body">
    <ol class="flow" aria-label="pipeline">${stages}</ol>
    <p class="fac-human"><strong>${icon('user-check', {size: 16})}${bi({ko: '직접 맡는 일', en: 'What I do'})}</strong> ${bi(f.human_role)}</p>
    <dl class="metrics">${metrics}</dl>
    ${outs ? `<ul class="fac-outs">${outs}</ul>` : ''}
  </div>
</article>`;
}

// 홈용 컬렉션 행 — /works 의 collectionCard(data-kind 필터 대상)와 별개
export function collectionRow(c) {
  const links = (c.previews || []).map(p => `<li><a href="${esc(p.url)}" ${EXT}>${typeof p.name === 'object' ? bi(p.name) : esc(p.name)}${ext}</a></li>`).join('');
  return `<li class="col-row">
  <div class="col-row-count mono">${icon(KIND_ICON[c.kind] || 'layers', {size: 20, cls: 'col-ico'})}<span>${esc(c.count.value)}</span></div>
  <div class="col-row-body">
    <h4><a href="${esc(c.url)}" ${EXT}>${bi(c.name)}${ext}</a></h4>
    <p>${bi(c.summary)}</p>
    <ul class="col-row-links">${links}</ul>
  </div>
  <span class="asof mono">${icon('clock', {size: 13})}${bi(asOf)} ${esc(c.count.as_of)}</span>
</li>`;
}

export function heroStats({services, collections}) {
  const n = k => collections.filter(c => c.kind === k).reduce((a, c) => a + Number(c.count.value), 0);
  const cell = (ic, num, label) => `<div class="hstat"><div class="num mono">${num}</div><div class="lbl">${icon(ic, {size: 16})}${bi(label)}</div></div>`;
  return [
    cell('layers', services.length, {ko: '서비스', en: 'Services'}),
    cell('gamepad', n('game'), {ko: '웹게임', en: 'Web games'}),
    cell('wrench', n('tool'), {ko: '웹 도구', en: 'Web tools'}),
    cell('book-open', n('blog'), {ko: '블로그 글', en: 'Journal posts'}),
  ].join('');
}

// 프로젝트 종류 아이콘 — js/main.js projIcon 과 같은 키워드 순서(이름은 아이콘 이름으로 매핑)
export function projectKind(p) {
  const t = p.name + ' ' + p.desc + ' ' + (p.stack || []).join(' ');
  if (/블록체인|코인|토큰|Solidity|\bERC/.test(t)) return 'blocks';
  if (/벤츠|IVI|Live TV|커넥티드|단말|차량/.test(t)) return 'car';
  if (/게임|PickJoy|멀티게임|게임패드|AR/.test(t)) return 'gamepad';
  if (/결제|연동/.test(t)) return 'credit-card';
  if (/국책|과제|IITP/.test(t)) return 'landmark';
  if (/보고|유지보수|운영|M&S/.test(t)) return 'bar-chart';
  if (/VR|XR|Unity|Pico/.test(t)) return 'vr';
  if (/팀|빌딩|채용/.test(t)) return 'users';
  if (/앱|App|iOS|Swift|Flutter/.test(t)) return 'smartphone';
  if (/웹|Web|React|홈페이지/.test(t)) return 'globe';
  return 'layers';
}

export function strengthItem(s) {
  return `<li class="strength">
  <span class="st-ico">${icon(s.icon, {size: 20})}</span>
  <p><b>${bi(s.title)}</b> ${bi(s.text)}</p>
</li>`;
}

const pick = (p, k) => ({ko: p[k], en: p[k + 'En'] || p[k]});
// 타임라인 안에 붙는 대표 프로젝트 한 줄: 종류 아이콘 · 이름 · 연도 · 역할
export function projectLine(p) {
  return `<li><a class="tl-proj" data-project="${esc(p.id)}" href="/career/#p${esc(p.id)}"><span class="tl-proj-ico">${icon(projectKind(p), {size: 16})}</span><span class="tl-proj-name">${bi(pick(p, 'name'))}</span><span class="tl-proj-meta mono">${esc(p.year)} · ${bi(pick(p, 'role'))}</span></a></li>`;
}

export function timelineItem(t, projects = []) {
  const projs = projects.length
    ? `<div class="tl-projects"><div class="tl-projects-h mono">${bi({ko: '대표 프로젝트', en: 'Selected projects'})}</div><ul>${projects.map(projectLine).join('')}</ul></div>`
    : '';
  // 회사·직함·역할까지만 보이고, 설명과 대표 프로젝트는 '자세히 보기' 안에 접어 둔다.
  return `<li class="tl-item">
  <div class="yr mono">${esc(t.period)} · ${bi(t.company)}</div>
  <h3>${bi(t.title)}</h3>
  <div class="role">${bi(t.role)}</div>
  <p>${bi(t.text)}</p>${projs ? '\n  ' + projs : ''}
</li>`;
}

// 대표 프로젝트를 회사 이름으로 타임라인 항목에 붙인다(연도는 회사 경계에서 겹치므로 쓰지 않는다)
export function attachProjects(timeline, featured) {
  const groups = timeline.map(() => []);
  for (const p of featured) {
    const hits = timeline.map((t, i) => (t.company.ko === p.company ? i : -1)).filter(i => i > -1);
    if (hits.length !== 1) throw new Error(`featured project ${p.id} (${p.company}) matches ${hits.length} timeline entries`);
    groups[hits[0]].push(p);
  }
  return groups;
}

const FILTERS = [
  ['all', 'layers', {ko: '전체', en: 'All'}], ['service', 'rocket', {ko: '서비스', en: 'Services'}], ['game', 'gamepad', {ko: '게임', en: 'Games'}],
  ['tool', 'wrench', {ko: '도구', en: 'Tools'}], ['app', 'smartphone', {ko: '앱', en: 'Apps'}], ['blog', 'book-open', {ko: '블로그', en: 'Journal'}],
];
export function worksFilters() {
  return FILTERS.map(([k, ic, l], i) => `<button type="button" data-filter="${k}" aria-pressed="${i === 0}">${icon(ic, {size: 16})}${bi(l)}</button>`).join('');
}
export function factoryNav(factories) {
  return factories.map(f => `<a class="pill" href="#${esc(f.id)}">${f.icon ? icon(f.icon, {size: 16}) : ''}${bi(f.name)}</a>`).join('');
}

// ===== 사이트 내비게이션 · 로고 =====
// 페이지 키: home | works | factories | career. 홈 이야기 순서는 서비스 → 공장 → 경력이고, 내비는 각 하위 페이지로 간다.
export const SUBPAGES = [
  {key: 'career', href: '/career/', label: {ko: '경력', en: 'Career'}},
  {key: 'factories', href: '/factories/', label: {ko: 'AI 공장', en: 'Factories'}},
  {key: 'works', href: '/works/', label: {ko: '서비스', en: 'Services'}},
  {key: 'content', href: '/content/', label: {ko: '콘텐츠 허브', en: 'Content hub'}}, // 추가 순서가 곧 인덱스([3]) — navLinks·footMap 이 인덱스로 고른다
];
const HOME = {key: 'home', href: '/', label: {ko: '홈', en: 'Home'}};
const HUB = {href: 'https://service.kimjinwan.com/', label: {ko: '서비스 모아보기', en: 'Browse services'}}; // 서비스 스토어(별도 사이트)
const cur = (key, page) => key === page ? ' aria-current="page"' : '';

// Kein 마크: 둥근 사각 타일 + 기하 K + 앞으로 튀어나가는 점. 32 격자, 색은 CSS 토큰(.km-*)이 정한다.
export const K_PATH = 'M8 6H14V14L21 6H28L19.1 16.1L22.5 19.5L18.5 23.5L14 19V26H8Z';
export const K_DOT = {cx: 25.5, cy: 25.5, r: 3.25};
export function kMark(size = 28) {
  return `<svg class="kmark" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true" focusable="false"><rect class="km-tile" width="32" height="32" rx="8"/><path class="km-k" d="${K_PATH}"/><circle class="km-dot" cx="${K_DOT.cx}" cy="${K_DOT.cy}" r="${K_DOT.r}"/></svg>`;
}
export const logo = (cls = 'logo') => `<a href="/" class="${cls}" aria-label="Kein — Home">${kMark(28)}<span class="logo-word">Kein</span></a>`;

const extLink = l => `<a href="${l.href}" ${EXT}>${bi(l.label)}${ext}</a>`;

export function navLinks(page) {
  // 홈 → 서비스 모아보기(service.kimjinwan.com, 새 창) → 콘텐츠 허브 → AI 공장 → 경력. /works/ 는 홈 서비스 섹션의 '서비스 전체 보기'와 푸터 사이트맵으로 닿는다.
  const items = [SUBPAGES[3], SUBPAGES[1], SUBPAGES[0]];
  return [
    `<a href="${HOME.href}"${cur(HOME.key, page)}>${bi(HOME.label)}</a>`,
    extLink(HUB),
    ...items.map(l => `<a href="${l.href}"${cur(l.key, page)}>${bi(l.label)}</a>`),
    `<a href="#contact" class="btn btn-primary nav-cta">${bi({ko: '연락하기', en: 'Contact'})}</a>`,
  ].join('\n      ');
}

export function footMap(page) {
  const items = [HOME, SUBPAGES[2], SUBPAGES[3], SUBPAGES[1], SUBPAGES[0]].map(l => `<li><a href="${l.href}"${cur(l.key, page)}>${bi(l.label)}</a></li>`);
  return `<nav class="foot-map" aria-label="Site map"><ul>${[...items, `<li>${extLink(HUB)}</li>`].join('')}</ul></nav>`;
}

const sub = page => SUBPAGES.find(s => s.key === page);
export function breadcrumb(page) {
  const s = sub(page);
  if (!s) return '';
  return `<nav class="crumbs" aria-label="breadcrumb"><ol><li><a href="/">${icon('arrow-left', {size: 16})}${bi(HOME.label)}</a></li><li aria-current="page">${bi(s.label)}</li></ol></nav>`;
}
export function pageFoot(page) {
  if (!sub(page)) return '';
  const others = SUBPAGES.filter(x => x.key !== page).map(x => `<a href="${x.href}">${bi(x.label)}</a>`).join('<span class="dot" aria-hidden="true">·</span>');
  return `<div class="page-foot"><a class="btn btn-ghost back-home" href="/">${icon('arrow-left', {size: 16})}${bi({ko: '홈으로 돌아가기', en: 'Back to home'})}</a><p class="hop"><span class="hop-lbl">${bi({ko: '다른 페이지', en: 'Other pages'})}</span>${others}</p></div>`;
}

// ===== 콘텐츠 허브(/content/) =====
// 항목마다 제목 + 요약 본문이 HTML 에 그대로 실린다. 본문이 한국어뿐인 항목(블로그 글·게임 설명·도구 설명)은 영어 모드에서도 같은 한국어를 보여 주고 lang="ko" 로 밝힌다.
export const HUB_SECTIONS = [
  {id: 'blog', icon: 'book-open', title: {ko: '블로그', en: 'Journal'},
    intro: {ko: 'AI 자동화의 실패와 복구, 앱 제작과 심사, 플레이 중인 게임의 공식 공지를 출처와 날짜까지 남기는 블로그입니다. 모든 글을 이 사이트 안에서 한 편씩 전문으로 읽을 수 있습니다.',
      en: 'A journal of AI automation failures and recovery, app production and review, and sourced game updates. Read the title and summary of the latest posts in each category right here, then open the full post. The posts are written in Korean.'}},
  {id: 'services', icon: 'layers', title: {ko: '서비스', en: 'Services'},
    intro: {ko: '직접 만들어 제공하는 서비스입니다. 서비스마다 무엇을 하는지, 어떤 기능이 있는지, 어떤 분께 맞는지를 짧게 풀어 적었습니다.',
      en: 'The services I build and provide. Each one is described briefly: what it does, its main features and who it suits.'}},
  {id: 'games', icon: 'gamepad', title: {ko: '웹게임', en: 'Web games'},
    intro: {ko: '설치 없이 브라우저에서 바로 하는 게임입니다. 대표 게임의 장르, 조작 방법, 한 판 길이를 적었습니다. 게임 설명은 한국어입니다.',
      en: 'Games that run straight in the browser with no install. Each entry lists genre, controls and session length. Game descriptions are written in Korean.'}},
  {id: 'tools', icon: 'wrench', title: {ko: '웹 도구', en: 'Web tools'},
    intro: {ko: '브라우저에서 바로 쓰는 계산기와 변환기입니다. 분류별 대표 도구가 무엇을 입력받아 무엇을 내놓는지 적었습니다. 도구 설명은 한국어입니다.',
      en: 'Calculators and converters that work in the browser. Each entry says what the tool takes in and what it gives back. Tool descriptions are written in Korean.'}},
  {id: 'gizmo', icon: 'sparkles', title: {ko: '기즈모 스토어', en: 'Gizmo Store'},
    intro: {ko: '설치 없이 쓰는 작은 AI 도구와 스킬을 모은 가게입니다. 용도별로 묶어 도구 이름과 한 줄 설명을 적었고, 항목마다 설명·대상·사용 방법을 이 사이트 안에서 읽을 수 있습니다. 설명은 한국어입니다.',
      en: 'A shop of small AI tools and skills. Entries are grouped by purpose with a name and a one-line description; each has its own page here with description, audience and steps. Descriptions are written in Korean.'}},
];

// ===== 콘텐츠 허브 상세 페이지(/content/<종류>/…/) — 허브가 자기 주소를 canonical 로 가진다 =====
export const mirrorPath = (kind, key) => `/content/${kind}/${key}/`;
const BLOG_ORIGIN = 'https://blog.kimjinwan.com';
const GIZMO_PURPOSE_LABEL = Object.fromEntries([['research', {ko: '조사·리서치', en: 'Research'}], ['career', {ko: '업무·커리어', en: 'Work & career'}], ['creative', {ko: '창작', en: 'Creative'}], ['dev', {ko: '개발', en: 'Development'}], ['writing', {ko: '글쓰기', en: 'Writing'}]]);
const DIFFICULTY = {easy: {ko: '쉬움', en: 'Easy'}, normal: {ko: '보통', en: 'Normal'}, hard: {ko: '어려움', en: 'Hard'}};
const AI_LABEL = {'ai-assisted': {ko: 'AI 도움을 받아 만듦', en: 'Made with AI assistance'}};

// 블로그 본문 HTML: 같은 허브 안에 있는 글·목록은 허브 주소로 잇고, 허브에 없는 블로그 주소는 링크를 풀어 글자만 남긴다.
// 그 밖의 외부 주소는 새 창으로 연다. 이미지는 blog 서브도메인 절대 주소를 그대로 참조한다.
export function rewriteBlogBody(html, mirrored) {
  const cats = new Set(['ai', 'apps', 'games', 'fiction']);
  return html
    .replace(/<a\b([^>]*?)\shref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (m, pre, href, post, inner) => {
      if (href.startsWith('#') || href.startsWith('mailto:')) return m;
      const u = href.startsWith('/') ? BLOG_ORIGIN + href : href;
      if (/^https:\/\/blog\.kimjinwan\.com\//.test(u)) {
        const q = u.replace(BLOG_ORIGIN, '').match(/^\/ko\/(?:(ai|apps|games|fiction)\/(?:([^/#?]+)\/)?)?(#.*)?$/);
        if (q && !q[1]) return `<a${pre} href="/content/blog/${q[3] || ''}"${post}>${inner}</a>`;
        if (q && q[1] && !q[2] && cats.has(q[1])) return `<a${pre} href="/content/blog/${q[1]}/${q[3] || ''}"${post}>${inner}</a>`;
        if (q && q[2] && mirrored.has(`${q[1]}/${q[2]}`)) return `<a${pre} href="${mirrorPath('blog', `${q[1]}/${q[2]}`)}${q[3] || ''}"${post}>${inner}</a>`;
        return inner; // 허브에 없는 블로그 주소(소개·문의 등)는 링크를 풀어 글자만 남긴다
      }
      if (!/^https:\/\//.test(u)) return m;
      return `<a${pre} href="${u}"${post.replace(/\s(?:target|rel)="[^"]*"/g, '')} ${EXT}>${inner}</a>`;
    })
    .replace(/<img\b([^>]*?)\ssrc="(\/[^"]*)"/g, (m, pre, src) => `<img${pre} src="${BLOG_ORIGIN}${src}"`);
}
const li = (list, f = x => esc(x)) => `<ul>${list.map(x => `<li>${f(x)}</li>`).join('')}</ul>`;
const h2 = t => `<h2>${bi(t)}</h2>`;
const cta = (href, label) => `<p class="detail-cta"><a class="btn btn-primary" href="${esc(href)}" ${EXT}>${bi(label)}${ext}</a></p>`;
export function serviceBody(sv, d) {
  const L = (k, o) => ({ko: k, en: o});
  const fact = [['login', L('가입', 'Sign-up')], ['device', L('이용 환경', 'Environment')], ['ai', L('AI 연결', 'AI connection')]].filter(([k]) => d.facts?.[k]);
  return `<p class="detail-lead">${bi(sv.summary)}</p>
${cta(sv.url, {ko: '서비스 열기', en: 'Open the service'})}
${h2(L('주요 기능', 'Main features'))}<ul>${d.features.map(f => `<li><strong>${bi(f.t)}</strong> ${bi(f.d)}</li>`).join('')}</ul>
${h2(L('이런 분께 맞습니다', 'Who it is for'))}${li(d.audience, a => bi(a))}
${h2(L('사용 방법', 'How to use'))}<ol>${d.steps.map(x => `<li>${bi(x)}</li>`).join('')}</ol>
${h2(L('알아둘 점', 'Good to know'))}${li(d.notes, a => bi(a))}
${fact.length ? `${h2(L('이용 정보', 'Details'))}<dl class="detail-facts">${fact.map(([k, l]) => `<dt>${bi(l)}</dt><dd>${bi(d.facts[k])}</dd>`).join('')}</dl>` : ''}
${d.tags?.length ? `<div class="chips">${d.tags.map(t => `<span class="chip" lang="ko">${esc(t)}</span>`).join('')}</div>` : ''}`;
}
// 이용 진입 링크: text 는 기즈모 스토어 다운로드, web 은 서비스 열기. 보조로 스토어 상세 페이지. 값은 스냅샷 필드(url·download·toolUrl)에서 온다.
function gizmoCtas(g) {
  const slug = g.slug, page = g.url || `https://gizmo-store.com/tool/${slug}`;
  const main = g.kind === 'web' ? (g.toolUrl ? {href: g.toolUrl, label: {ko: '써 보기', en: 'Try it'}} : null)
    : {href: g.download || `${page}/download`, label: {ko: '기즈모 스토어에서 받기', en: 'Get it from Gizmo Store'}};
  return `<p class="detail-cta">${main ? `<a class="btn btn-primary" href="${esc(main.href)}" ${EXT}>${bi(main.label)}${ext}</a>` : ''}<a class="btn btn-ghost" href="${esc(page)}" ${EXT}>${bi({ko: '기즈모 스토어에서 보기', en: 'View on Gizmo Store'})}${ext}</a></p>`;
}
export function gizmoBody(g) {
  const part = (label, text) => text ? `${h2(label)}<p lang="ko">${esc(text)}</p>` : '';
  const info = [[{ko: '용도', en: 'Purpose'}, bi(GIZMO_PURPOSE_LABEL[g.purpose])], [{ko: '종류', en: 'Type'}, bi(g.kind === 'text' ? {ko: '프롬프트·스킬 문서', en: 'Prompt / skill document'} : {ko: '웹 서비스', en: 'Web service'})],
    g.difficulty && DIFFICULTY[g.difficulty] ? [{ko: '난이도', en: 'Difficulty'}, bi(DIFFICULTY[g.difficulty])] : null,
    g.aiLabel && AI_LABEL[g.aiLabel] ? [{ko: 'AI 표기', en: 'AI label'}, bi(AI_LABEL[g.aiLabel])] : null,
    g.hash ? [{ko: '버전 해시', en: 'Version hash'}, `<code>${esc(g.hash.slice(0, 12))}</code>`] : null].filter(Boolean);
  return `<p class="detail-lead" lang="ko">${esc(g.tagline)}</p>
${gizmoCtas(g)}
${part({ko: '설명', en: 'About'}, g.description === g.tagline ? '' : g.description)}${part({ko: '이런 분께 맞습니다', en: 'Who it is for'}, g.audience)}${part({ko: '결과물', en: 'What you get'}, g.result)}
${g.steps.length ? `${h2({ko: '쓰는 방법', en: 'How to use'})}<ol>${g.steps.map(x => `<li lang="ko">${esc(x)}</li>`).join('')}</ol>` : ''}
${g.prompt ? `${h2({ko: '프롬프트 전문', en: 'Full prompt'})}<details class="detail-prompt" open><summary><span data-lang-ko>전문 접기·펼치기</span><span data-lang-en>Show / hide the full text</span></summary><pre lang="ko" tabindex="0"><code>${esc(g.prompt)}</code></pre></details>` : ''}
${part({ko: '막힐 때', en: 'If you get stuck'}, g.trouble)}
${h2({ko: '정보', en: 'Info'})}<dl class="detail-facts">${info.map(([l, v]) => `<dt>${bi(l)}</dt><dd>${v}</dd>`).join('')}</dl>`;
}
// 상단: 용도·분류·날짜 줄
export function mirrorHead(m) {
  const meta = [m.kind === 'blog' ? bi(m.catLabel) : '', m.kind === 'gizmo' ? bi(GIZMO_PURPOSE_LABEL[m.purpose]) : '', m.date ? esc(m.date) : ''].filter(Boolean).join(' · ');
  return meta ? `<p class="hub-meta mono">${meta}</p>` : '';
}
export function mirrorCrumbs(m) {
  return crumbTrail([...m.crumbs, {label: `<span lang="ko">${esc(m.shortTitle || m.title)}</span>`}]);
}
// 홈 > 콘텐츠 허브 > … > 현재. 마지막 항목은 링크 없이 aria-current.
export function crumbTrail(items) {
  const all = [{label: bi(HOME.label), href: '/', first: true}, {label: bi({ko: '콘텐츠 허브', en: 'Content hub'}), href: '/content/'}, ...items];
  return `<nav class="crumbs" aria-label="breadcrumb"><ol>${all.map((c, i) => i === all.length - 1 ? `<li aria-current="page">${c.label}</li>`
    : `<li><a href="${esc(c.href)}">${c.first ? icon('arrow-left', {size: 16}) : ''}${c.label}</a></li>`).join('')}</ol></nav>`;
}
export function mirrorFoot(m) {
  const back = m.crumbs.at(-1);
  return `<div class="page-foot"><a class="btn btn-ghost back-home" href="${esc(back.href)}">${icon('arrow-left', {size: 16})}${bi({ko: '목록으로 돌아가기', en: 'Back to the list'})}</a></div>`;
}
