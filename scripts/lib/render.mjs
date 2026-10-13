// scripts/lib/render.mjs
import {icon} from './icons.mjs';
import {GENRE_KO, LANG_KO, STATUS_LABEL as APP_STATUS, APP_CATEGORIES} from './apps_authoring.mjs';
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
  {key: 'hub', icon: 'gamepad', label: {ko: '게임·도구', en: 'Games & tools'}, blurb: {ko: '계속 늘어나는 웹게임·웹 도구', en: 'Ever-growing web games and tools'}},
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
  ['tool', 'wrench', {ko: '도구', en: 'Tools'}], ['app', 'smartphone', {ko: '앱', en: 'Apps'}],
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
const HUB = {href: 'https://service.kimjinwan.com/', label: {ko: '서비스 허브', en: 'Service hub'}}; // 서비스 스토어(별도 사이트)
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
  // 홈 · 서비스 · AI 공장 · 경력 · 연락하기 | (구분선) | 콘텐츠 허브 · 서비스 허브. 뒤 두 항목은 일반 메뉴가 아니라 바로가기 알약(.nav-ext)이다.
  // 서비스·AI 공장·경력은 페이지 이동이 아니라 홈 섹션 앵커다(/#services …). 홈에서는 js/nav-spy.js 가 같은 문서 스크롤 + 현재 섹션 강조를 맡고,
  // 다른 페이지에서는 홈으로 이동한 뒤 앵커로 스크롤한다. 정적 aria-current 는 홈 링크(홈 페이지)와 콘텐츠 허브(콘텐츠 페이지)에만 둔다.
  const anchor = (id, label) => `<a href="/#${id}" data-spy="${id}">${bi(label)}</a>`;
  return [
    `<a href="${HOME.href}" data-spy="top"${cur(HOME.key, page)}>${bi(HOME.label)}</a>`,
    anchor('services', {ko: '서비스', en: 'Services'}),
    anchor('factories', {ko: 'AI 공장', en: 'Factories'}),
    anchor('experience', {ko: '경력', en: 'Career'}),
    `<a href="#contact" data-spy="contact">${bi({ko: '연락하기', en: 'Contact'})}</a>`,
    `<span class="nav-sep" aria-hidden="true"></span>`,
    // 콘텐츠 허브는 같은 사이트 안 페이지(새 창·↗ 없음), 서비스 허브는 외부 사이트(새 창·↗). 둘 다 .nav-ext 알약.
    `<a class="nav-ext" href="${SUBPAGES[3].href}"${cur(SUBPAGES[3].key, page)}>${icon('book-open', {size: 15})}${bi(SUBPAGES[3].label)}</a>`,
    `<a class="nav-ext" href="${HUB.href}" ${EXT} title="${esc(HUB.label.ko)} — service.kimjinwan.com">${icon('layers', {size: 15})}${bi(HUB.label)}${ext}</a>`,
  ].join('\n      ');
}

export function footMap(page) {
  const items = [HOME, SUBPAGES[2], SUBPAGES[1], SUBPAGES[0], SUBPAGES[3]].map(l => `<li><a href="${l.href}"${cur(l.key, page)}>${bi(l.label)}</a></li>`);
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
  {id: 'column', icon: 'file-text', title: {ko: '케인칼럼', en: 'Kein Column'},
    intro: {ko: 'AI 시대의 일과 놀이에 대한 짧은 칼럼입니다. 모든 글을 이 사이트 안에서 전문으로 읽을 수 있습니다.',
      en: 'Short columns on work and play in the age of AI. Every column can be read in full right here. The columns are written in Korean.'}},
  {id: 'blog', icon: 'book-open', title: {ko: '블로그', en: 'Journal'},
    intro: {ko: 'AI 에이전트가 직접 쓴 업무일지와 앱을 만들고 심사에 제출한 기록을 모았습니다. 모든 글을 이 사이트 안에서 한 편씩 전문으로 읽을 수 있습니다.',
      en: 'Work logs that AI agents wrote themselves and records of building and submitting apps. Every post can be read in full right here. The posts are written in Korean.'}},
  {id: 'gamenews', icon: 'globe', title: {ko: '게임 소식', en: 'Game news'},
    intro: {ko: '즐기는 게임의 공식 공지와 업데이트, 공략 정리와 직접 만든 게임의 개발기를 출처와 날짜까지 남겼습니다. 게임별로 골라 볼 수 있고, 모든 글을 이 사이트 안에서 전문으로 읽을 수 있습니다.',
      en: 'Sourced notes on official announcements, updates and guides for the games I play, plus devlogs of the games I make. Pick a game to filter, and read every post in full here. The posts are written in Korean.'}},
  {id: 'gizmo', icon: 'sparkles', title: {ko: 'AI 활용 가이드', en: 'AI usage guides'},
    intro: {ko: '설치 없이 쓰는 프롬프트·스킬 가이드입니다. 용도별로 묶어 이름과 한 줄 설명을 적었고, 항목마다 설명·대상·사용 방법과 프롬프트 전문을 이 사이트 안에서 읽을 수 있습니다. 설명은 한국어입니다.',
      en: 'Prompt and skill guides you can use without installing anything. Entries are grouped by purpose with a name and a one-line description; each has its own page with description, audience, steps and the full prompt. Descriptions are written in Korean.'}},
  {id: 'games', icon: 'gamepad', title: {ko: '웹게임', en: 'Web games'},
    intro: {ko: '설치 없이 브라우저에서 바로 하는 게임입니다. 게임마다 소개와 조작 방법, 진행 규칙, 플레이 화면을 실었고 마음에 들면 바로 시작할 수 있습니다. 설명은 한국어입니다.',
      en: 'Games that run straight in the browser with no install. Each page has an introduction, controls, rules and gameplay screens, and a button to start playing. Descriptions are written in Korean.'}},
  {id: 'tools', icon: 'wrench', title: {ko: '웹 도구', en: 'Web tools'},
    intro: {ko: '브라우저에서 바로 쓰는 계산기와 변환기입니다. 도구마다 무엇을 입력받아 무엇을 내놓는지, 알아둘 한계는 무엇인지 화면 캡처와 함께 적었습니다. 설명은 한국어입니다.',
      en: 'Calculators and converters that work in the browser. Each page shows a screen capture and says what the tool takes in, what it gives back and what limits to know. Descriptions are written in Korean.'}},
  {id: 'apps', icon: 'smartphone', title: {ko: '내 앱', en: 'My apps'},
    intro: {ko: '앱스토어에서 내려받아 쓰는 모바일 앱입니다. 앱마다 아이콘과 화면, 무슨 앱인지, 어떤 사람에게 맞는지, 핵심 기능과 사용 방법, 알아둘 점을 적었고 앱스토어 바로가기를 달았습니다. 설명은 한국어입니다.',
      en: 'Mobile apps you get from the App Store. Each page has the icon and screens, what the app is, who it suits, key features, how to use it and what to know, with a link to the App Store. Descriptions are written in Korean.'}},
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
  const cats = new Set(['ai', 'apps']); // 블로그 카테고리 색인. fiction 은 허브에서 케인칼럼(/content/column/)으로 독립했다
  return html
    .replace(/<a\b([^>]*?)\shref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (m, pre, href, post, inner) => {
      if (href.startsWith('#') || href.startsWith('mailto:')) return m;
      const u = href.startsWith('/') ? BLOG_ORIGIN + href : href;
      if (/^https:\/\/blog\.kimjinwan\.com\//.test(u)) {
        const q = u.replace(BLOG_ORIGIN, '').match(/^\/ko\/(?:(ai|apps|games|fiction)\/(?:([^/#?]+)\/)?)?(#.*)?$/);
        const a = to => `<a${pre} href="${to}"${post}>${inner}</a>`;
        if (q && !q[1]) return a(`/content/blog/${q[3] || ''}`);
        if (q && q[1] === 'games') return q[2] ? (mirrored.has(`games/${q[2]}`) ? a(`${mirrorPath('game-news', q[2])}${q[3] || ''}`) : inner) : a(`/content/game-news/${q[3] || ''}`);
        if (q && q[1] === 'fiction') return q[2] ? (mirrored.has(`fiction/${q[2]}`) ? a(`${mirrorPath('column', q[2])}${q[3] || ''}`) : inner) : a(`/content/column/${q[3] || ''}`);
        if (q && q[1] && !q[2] && cats.has(q[1])) return a(`/content/blog/${q[1]}/${q[3] || ''}`);
        if (q && q[2] && mirrored.has(`${q[1]}/${q[2]}`)) return a(`${mirrorPath('blog', `${q[1]}/${q[2]}`)}${q[3] || ''}`);
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
// 이용 진입 링크: text 는 '다운로드'(받는 기능은 스토어 쪽 주소로 연결), web 은 '써 보기'. 값은 스냅샷 필드(url·download·toolUrl)에서 온다.
function gizmoCtas(g) {
  const main = g.kind === 'web' ? (g.toolUrl ? {href: g.toolUrl, label: {ko: '써 보기', en: 'Try it'}} : null)
    : {href: g.download || `${g.url}/download`, label: {ko: '다운로드', en: 'Download'}};
  return main ? `<p class="detail-cta"><a class="btn btn-primary" href="${esc(main.href)}" ${EXT}>${bi(main.label)}${ext}</a></p>` : '';
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
${g.prompt ? `${h2({ko: '프롬프트 전문', en: 'Full prompt'})}<div class="copy-bar"><button type="button" class="btn btn-primary copy-btn" data-copy-target="prompt-${esc(g.slug)}" hidden><span class="cb-idle">${bi({ko: '복사하기', en: 'Copy'})}</span><span class="cb-done">${bi({ko: '복사됐어요', en: 'Copied'})}</span></button><span class="copy-status" role="status" aria-live="polite"></span></div><details class="detail-prompt" open><summary><span data-lang-ko>전문 접기·펼치기</span><span data-lang-en>Show / hide the full text</span></summary><pre lang="ko" tabindex="0"><code id="prompt-${esc(g.slug)}">${esc(g.prompt)}</code></pre></details>` : ''}
${part({ko: '막힐 때', en: 'If you get stuck'}, g.trouble)}
${h2({ko: '정보', en: 'Info'})}<dl class="detail-facts">${info.map(([l, v]) => `<dt>${bi(l)}</dt><dd>${v}</dd>`).join('')}</dl>`;
}
// 상단: 용도·분류·날짜 줄
export function mirrorHead(m) {
  const meta = [m.metaLabel ? bi(m.metaLabel) : '', m.kind === 'gizmo' ? bi(GIZMO_PURPOSE_LABEL[m.purpose]) : '', m.date ? esc(m.date) : ''].filter(Boolean).join(' · ');
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

// ── 웹게임 · 웹 도구 상세 본문 ───────────────────────────────────────────
const IMG = '/assets/content';
const figure = (kind, slug, name, rec, alt, cls = 'detail-hero') => `<figure class="${cls}"><img src="${IMG}/${kind}/${slug}-hero.webp" width="${rec.hero[0]}" height="${rec.hero[1]}" alt="${esc(alt)}" fetchpriority="high"></figure>`;
const ORIENT = {'가로': {ko: '가로 화면', en: 'Landscape'}, '세로': {ko: '세로 화면', en: 'Portrait'}, '세로·가로': {ko: '세로·가로 모두', en: 'Portrait or landscape'}, '반응형': {ko: '화면 크기에 맞춰 바뀜', en: 'Adapts to the screen'}};
export function gameBody(g, rec) {
  if (g.verified) return authoredGameBody(g, rec); // 편집 원본(data/authoring/games)에서 온 게임
  const title = g.title.ko;
  const info = [[{ko: '분류', en: 'Genre'}, esc(g.categories.join('·'))], g.tags?.length ? [{ko: '태그', en: 'Tags'}, esc(g.tags.join(' · '))] : null,
    g.session ? [{ko: '한 판 길이', en: 'Session'}, esc(g.session)] : null, g.orientation ? [{ko: '화면', en: 'Screen'}, bi(ORIENT[g.orientation] || {ko: g.orientation, en: g.orientation})] : null,
    g.stageCount ? [{ko: '스테이지', en: 'Stages'}, `${g.stageCount}`] : null, g.controls?.length ? [{ko: '조작 방식', en: 'Input'}, esc(g.controls.join(', '))] : null].filter(Boolean);
  const list = items => `<ul>${items.map(x => `<li lang="ko">${esc(x)}</li>`).join('')}</ul>`;
  const sec = (label, inner) => inner ? `${h2(label)}${inner}` : '';
  const shots = (rec.shots || []).map((sz, i) => `<figure><img src="${IMG}/games/${g.slug}-${i + 1}.webp" width="${sz[0]}" height="${sz[1]}" alt="${esc(`${title} 플레이 화면 ${i + 1}`)}" loading="lazy"></figure>`).join('');
  return `${figure('games', g.slug, title, rec, `${title} 대표 이미지`)}
<p class="detail-cta"><a class="btn btn-primary" href="https://games.kimjinwan.com/play/${esc(g.slug)}/" ${EXT}>${bi({ko: '게임하러 가기', en: 'Play now'})}${ext}</a></p>
<p class="detail-lead" lang="ko">${esc(g.description)}</p>
${g.pitch ? `<p lang="ko">${esc(g.pitch)}</p>` : ''}${g.lead ? `<p lang="ko">${esc(g.lead)}</p>` : ''}
${sec({ko: '게임 정보', en: 'Game info'}, `<dl class="detail-facts">${info.map(([l, v]) => `<dt>${bi(l)}</dt><dd lang="ko">${v}</dd>`).join('')}</dl>`)}
${sec({ko: '조작 방법', en: 'Controls'}, g.controlsDetail?.length ? list(g.controlsDetail) : '')}
${sec({ko: '규칙', en: 'Rules'}, g.rules?.length ? list(g.rules) : '')}
${sec({ko: '진행', en: 'Progress'}, g.progress?.length ? list(g.progress) : '')}
${sec({ko: '스테이지 안내 예시', en: 'Stage hints'}, g.stageGuides?.length ? list(g.stageGuides) : '')}
${shots ? `${h2({ko: '플레이 화면', en: 'Gameplay'})}<div class="detail-gallery">${shots}</div>` : ''}`;
}
// 편집 원본 형태(oneLiner·about·controls{pc,touch}·goal·rules·progress·tips·screens·verified·images)의 게임 상세 본문
function authoredGameBody(g, rec) {
  const title = g.title.ko, A = g.images || [];
  const info = [[{ko: '분류', en: 'Genre'}, esc(g.categories.join('·'))], g.tags?.length ? [{ko: '태그', en: 'Tags'}, esc(g.tags.join(' · '))] : null,
    g.session ? [{ko: '한 판 길이', en: 'Session'}, esc(g.session)] : null, g.orientation ? [{ko: '화면', en: 'Screen'}, bi(ORIENT[g.orientation] || {ko: g.orientation, en: g.orientation})] : null,
    g.controlLabels?.length ? [{ko: '조작 방식', en: 'Input'}, esc(g.controlLabels.join(', '))] : null].filter(Boolean);
  const list = items => `<ul>${items.map(x => `<li lang="ko">${esc(x)}</li>`).join('')}</ul>`;
  const sub = (label, items) => items?.length ? `<h3 lang="ko">${esc(label)}</h3>${list(items)}` : '';
  const shots = (rec.shots || []).map((sz, i) => `<figure><img src="${IMG}/games/${g.slug}-${i + 1}.webp" width="${sz[0]}" height="${sz[1]}" alt="${esc(A[i + 1]?.alt || `${title} 플레이 화면 ${i + 1}`)}" loading="lazy"></figure>`).join('');
  return `${figure('games', g.slug, title, rec, A[0]?.alt || `${title} 대표 이미지`)}
<p class="detail-cta"><a class="btn btn-primary" href="https://games.kimjinwan.com/play/${esc(g.slug)}/" ${EXT}>${bi({ko: '게임하러 가기', en: 'Play now'})}${ext}</a></p>
<p class="detail-lead" lang="ko">${esc(g.oneLiner)}</p>
${h2({ko: '이런 게임입니다', en: 'About'})}${g.about.split(/\n+/).map(x => `<p lang="ko">${esc(x)}</p>`).join('')}
${h2({ko: '게임 정보', en: 'Game info'})}<dl class="detail-facts">${info.map(([l, v]) => `<dt>${bi(l)}</dt><dd lang="ko">${v}</dd>`).join('')}</dl>
${h2({ko: '조작 방법', en: 'Controls'})}${sub('PC(키보드·마우스)', g.controls.pc)}${sub('터치(모바일)', g.controls.touch)}
${h2({ko: '목표와 규칙', en: 'Goal and rules'})}<p lang="ko">${esc(g.goal)}</p>${list(g.rules)}
${h2({ko: '진행', en: 'Progress'})}${list(g.progress)}
${h2({ko: '처음 하는 사람을 위한 팁', en: 'Tips'})}${list(g.tips)}
${h2({ko: '플레이 화면', en: 'Gameplay'})}<p lang="ko">${esc(g.screens)}</p>${shots ? `<div class="detail-gallery">${shots}</div>` : ''}
<p class="detail-verified" lang="ko">${esc(g.verified.date)} 직접 실행해 확인한 내용입니다.</p>`;
}
// ── 내 앱 상세 본문(편집 원본 → content-src/apps/<slug>.json) ──
const APP_IMG = '/assets/content/apps';
const fmtDate = d => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d.slice(0, 4)}년 ${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일` : '');
export const hasHangul = v => /[가-힣]/.test(v);
export function appBody(a, rec) {
  const A = a.images || [], cat = APP_CATEGORIES.find(c => c.id === a.category);
  const st = a.store || {}, list = items => `<ul>${items.map(x => `<li lang="ko">${esc(x)}</li>`).join('')}</ul>`;
  const shots = (rec.shots || []).map((sz, i) => `<figure${sz[0] > sz[1] ? ' class="wide"' : ''}><img src="${APP_IMG}/${a.slug}-${i + 1}.webp" width="${sz[0]}" height="${sz[1]}" alt="${esc(A[i + 1]?.alt || `${a.name} 화면 ${i + 1}`)}"${i ? ' loading="lazy"' : ''}></figure>`).join('');
  const langs = (st.languages || []).map(l => LANG_KO[l]).filter(Boolean);
  const facts = [[{ko: '분류', en: 'Category'}, bi(cat.label)], st.genre ? [{ko: '스토어 분류', en: 'Store category'}, esc(GENRE_KO[st.genre] || st.genre)] : null,
    [{ko: '제공 상태', en: 'Status'}, bi(APP_STATUS[a.status])], st.price === 0 ? [{ko: '가격', en: 'Price'}, '무료'] : null,
    st.released ? [{ko: '출시일', en: 'Released'}, esc(fmtDate(st.released))] : null, st.updated ? [{ko: '최근 갱신', en: 'Last updated'}, esc(fmtDate(st.updated))] : null,
    st.version ? [{ko: '현재 버전', en: 'Version'}, esc(st.version)] : null, st.devices?.length ? [{ko: '지원 기기', en: 'Devices'}, esc(st.devices.join('·'))] : null,
    st.minOs ? [{ko: '필요 OS', en: 'Requires'}, `iOS ${esc(st.minOs)} 이상`] : null, langs.length ? [{ko: '스토어 표기 언어', en: 'Store languages'}, esc(langs.join(', '))] : null,
    st.rating ? [{ko: '연령 등급', en: 'Age rating'}, esc(st.rating)] : null, st.bundleId ? [{ko: '번들 ID', en: 'Bundle ID'}, `<code>${esc(st.bundleId)}</code>`] : null].filter(Boolean);
  const buy = a.storeUrl ? `<p class="detail-cta"><a class="btn btn-primary" href="${esc(a.storeUrl)}" ${EXT}>${bi({ko: 'App Store에서 보기', en: 'View on the App Store'})}${ext}</a></p>`
    : `<p class="detail-cta"><span class="btn btn-ghost" aria-disabled="true">${bi({ko: '심사 중 · 아직 스토어에 없음', en: 'In review · not on the store yet'})}</span></p>`;
  return `<div class="app-hero"><img class="app-icon" src="${APP_IMG}/${a.slug}-icon.webp" width="${rec.icon[0]}" height="${rec.icon[1]}" alt="${esc(A[0]?.alt || `${a.name} 앱 아이콘`)}" fetchpriority="high">
<div class="app-hero-b"><p class="detail-lead" lang="ko">${esc(a.oneLiner)}</p><p class="app-badges"><span class="chip" lang="ko">${esc(cat.label.ko)}</span><span class="chip chip-status chip-${a.status}">${bi(APP_STATUS[a.status])}</span></p>${buy}</div></div>
<div class="app-shots" role="group" aria-label="screens">${shots}</div>
${h2({ko: '이런 앱입니다', en: 'About'})}${a.about.split(/\n+/).map(x => `<p lang="ko">${esc(x)}</p>`).join('')}
${h2({ko: '이런 분께 맞습니다', en: 'Who it is for'})}<p lang="ko">${esc(a.audience)}</p>
${h2({ko: '핵심 기능', en: 'Key features'})}${list(a.features)}
${h2({ko: '사용 방법', en: 'How to use'})}<ol>${a.howTo.map(x => `<li lang="ko">${esc(x)}</li>`).join('')}</ol>
${h2({ko: '알아둘 점', en: 'Good to know'})}${list(a.notes)}
${h2({ko: '앱 정보', en: 'App info'})}<dl class="detail-facts">${facts.map(([l, v]) => `<dt>${bi(l)}</dt><dd lang="ko">${v}</dd>`).join('')}</dl>
${a.guide ? `<p class="detail-more"><a href="${esc(a.guide.path)}" lang="ko">제작·심사 기록 읽기</a></p>` : ''}
<p class="detail-verified" lang="ko">${esc(a.verified.date)} 앱스토어 공개 정보와 앱 구성 기록으로 확인한 내용입니다.</p>`;
}
export function toolBody(t, rec) {
  const name = t.title;
  const steps = [];
  if (t.inputs?.length) steps.push(`화면의 항목(${t.inputs.join(', ')})을 채우거나 고릅니다.`);
  if (t.actions?.length) steps.push(`필요하면 버튼(${t.actions.join(', ')})을 눌러 결과를 가져갑니다.`);
  const blocks = (t.blocks || []).filter(b => b.text !== t.intro && b.text !== t.description && b.text !== t.does);
  return `${figure('tools', t.slug, name, rec, `${name} 화면`)}
<p class="detail-cta"><a class="btn btn-primary" href="https://apps.kimjinwan.com/${esc(t.slug)}/" ${EXT}>${bi({ko: '도구 열기', en: 'Open the tool'})}${ext}</a></p>
<p class="detail-lead" lang="ko">${esc(t.description)}</p>
${t.intro && t.intro !== t.description ? `<p lang="ko">${esc(t.intro)}</p>` : ''}
${steps.length ? `${h2({ko: '쓰는 방법', en: 'How to use'})}<ol>${steps.map(x => `<li lang="ko">${esc(x)}</li>`).join('')}</ol>` : ''}
${blocks.length ? `${h2({ko: '알아두면 좋은 점', en: 'Good to know'})}${blocks.map(b => b.t === 'h' ? `<h3 lang="ko">${esc(b.text)}</h3>` : `<p lang="ko">${esc(b.text)}</p>`).join('')}` : ''}
${h2({ko: '정보', en: 'Info'})}<dl class="detail-facts"><dt>${bi({ko: '분류', en: 'Category'})}</dt><dd lang="ko">${esc(t.categories.join(' · '))}</dd></dl>
${t.guide ? `<p class="detail-more"><a href="${esc(t.guide.path)}" lang="ko">자세한 사용 가이드 읽기</a></p>` : ''}`;
}
