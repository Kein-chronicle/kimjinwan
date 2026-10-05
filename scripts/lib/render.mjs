// scripts/lib/render.mjs
import {icon} from './icons.mjs';
const EXT = 'target="_blank" rel="noopener noreferrer"';
const STATUS_LABEL = {live: 'LIVE', released: 'RELEASED', experiment: 'EXPERIMENT'};

export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
export const bi = o => `<span data-lang-ko>${esc(o.ko)}</span><span data-lang-en>${esc(o.en)}</span>`;
const open = {ko: '열기', en: 'Open'};
const asOf = {ko: '기준', en: 'as of'};
const KIND_ICON = {service: 'layers', game: 'gamepad', tool: 'wrench', app: 'smartphone', blog: 'book-open'};
const STAGE_ICON = {ai: 'sparkles', gate: 'shield-check', human: 'hand'};
const ext = icon('arrow-up-right', {size: 14, cls: 'ico-ext'});

export function serviceCard(s) {
  const thumb = s.thumb && !/^(https?:)?\/\//.test(s.thumb) ? '/' + s.thumb.replace(/^\/+/, '') : s.thumb;
  const shot = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(s.name)} screenshot" loading="lazy" width="640" height="400">`
    : `<span class="mono shot-fallback">${esc(s.name.slice(0, 2).toUpperCase())}</span>`;
  const chips = s.ai_tools.map(t => `<span class="chip mono">${esc(t)}</span>`).join('');
  return `<article class="card svc" data-kind="${esc(s.kind)}">
  <div class="svc-shot">${shot}</div>
  <div class="svc-body">
    <div class="svc-meta"><span class="badge badge-${esc(s.status)} mono">${STATUS_LABEL[s.status]}</span><span class="kind mono">${icon(KIND_ICON[s.kind] || 'layers', {size: 14})}${esc(s.kind)}</span></div>
    <h3>${esc(s.name)}</h3>
    <p>${bi(s.summary)}</p>
    <div class="chips">${chips}</div>
    <a class="more" href="${esc(s.url)}" ${EXT}>${bi(open)}${ext}</a>
  </div>
</article>`;
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
    ${link ? `<a class="more" href="/factories/#${esc(f.id)}">${bi({ko: '공장 상세', en: 'Factory details'})}${icon('arrow-up-right', {size: 14, cls: 'ico-ext'})}</a>` : ''}
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
// 페이지 키: home | works | factories | career. 하위 페이지 순서는 홈 이야기 순서(경력→공장→작업물)와 같다.
export const SUBPAGES = [
  {key: 'career', href: '/career/', label: {ko: '경력', en: 'Career'}},
  {key: 'factories', href: '/factories/', label: {ko: 'AI 공장', en: 'Factories'}},
  {key: 'works', href: '/works/', label: {ko: '작업물', en: 'Works'}},
];
const HOME = {key: 'home', href: '/', label: {ko: '홈', en: 'Home'}};
const EXTERNAL = [
  {href: 'https://blog.kimjinwan.com/ko/', label: {ko: '블로그', en: 'Journal'}},
  {href: 'https://games.kimjinwan.com/', label: {ko: '웹게임', en: 'Games'}},
  {href: 'https://apps.kimjinwan.com/', label: {ko: '웹 도구', en: 'Tools'}},
];
const cur = (key, page) => key === page ? ' aria-current="page"' : '';
const extLink = l => `<a href="${l.href}" ${EXT}>${bi(l.label)}${ext}</a>`;

// Kein 마크: 둥근 사각 타일 + 기하 K + 앞으로 튀어나가는 점. 32 격자, 색은 CSS 토큰(.km-*)이 정한다.
export const K_PATH = 'M8 6H14V14L21 6H28L19.1 16.1L22.5 19.5L18.5 23.5L14 19V26H8Z';
export const K_DOT = {cx: 25, cy: 25, r: 3.5};
export function kMark(size = 28) {
  return `<svg class="kmark" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true" focusable="false"><rect class="km-tile" width="32" height="32" rx="8"/><path class="km-k" d="${K_PATH}"/><circle class="km-dot" cx="${K_DOT.cx}" cy="${K_DOT.cy}" r="${K_DOT.r}"/></svg>`;
}
export const logo = (cls = 'logo') => `<a href="/" class="${cls}" aria-label="Kein — Home">${kMark(28)}<span class="logo-word">Kein</span></a>`;

export function navLinks(page) {
  const items = [HOME, SUBPAGES[0], {key: 'ai', href: '/#ai', label: {ko: 'AI 활용', en: 'AI'}}, SUBPAGES[1], SUBPAGES[2]];
  return [
    ...items.map(l => `<a href="${l.href}"${cur(l.key, page)}>${bi(l.label)}</a>`),
    ...EXTERNAL.map(extLink),
    `<a href="#contact" class="btn btn-primary nav-cta">${bi({ko: '연락하기', en: 'Contact'})}</a>`,
  ].join('\n      ');
}

export function footMap(page) {
  const items = [HOME, SUBPAGES[2], SUBPAGES[1], SUBPAGES[0]].map(l => `<li><a href="${l.href}"${cur(l.key, page)}>${bi(l.label)}</a></li>`);
  return `<nav class="foot-map" aria-label="Site map"><ul>${[...items, ...EXTERNAL.map(l => `<li>${extLink(l)}</li>`)].join('')}</ul></nav>`;
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
