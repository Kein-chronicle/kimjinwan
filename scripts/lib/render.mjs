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

export function factoryCard(f, servicesById, {link = false} = {}) {
  const stages = f.stages.map(st => `<li class="stage stage-${st.kind}">${icon(STAGE_ICON[st.kind], {size: 16, cls: 'ico-stage'})}<span class="mono">${bi(st.name)}</span></li>`).join('');
  const metrics = f.metrics.map(m => `<div class="metric"><dt>${icon('bar-chart', {size: 14})}${bi(m.label)}</dt><dd class="mono">${esc(m.value)}</dd><span class="asof mono">${icon('clock', {size: 13})}${esc(m.as_of)}</span></div>`).join('');
  const outs = f.outputs.map(id => servicesById.get(id)).filter(Boolean)
    .map(s => `<li><a href="${esc(s.url)}" ${EXT}>${esc(s.name)}${ext}</a></li>`).join('');
  return `<article class="card fac" id="${esc(f.id)}">
  <h3>${f.icon ? icon(f.icon, {size: 22, cls: 'fac-ico'}) : ''}<span>${link ? `<a href="/factories/#${esc(f.id)}">${bi(f.name)}</a>` : bi(f.name)}</span></h3>
  <p class="fac-role">${bi(f.role)}</p>
  <ol class="flow" aria-label="pipeline">${stages}</ol>
  <p class="legend mono"><span class="lg lg-ai">${icon('sparkles', {size: 14})}AI</span><span class="lg lg-gate">${icon('shield-check', {size: 14})}GATE</span><span class="lg lg-human">${icon('hand', {size: 14})}HUMAN</span></p>
  <p class="fac-human"><strong>${icon('user-check', {size: 16})}${bi({ko: '제가 맡는 일', en: 'What I do'})}:</strong> ${bi(f.human_role)}</p>
  <dl class="metrics">${metrics}</dl>
  ${outs ? `<ul class="fac-outs">${outs}</ul>` : ''}
  ${link ? `<a class="more" href="/factories/#${esc(f.id)}">${bi({ko: '공장 상세', en: 'Factory details'})}${icon('arrow-up-right', {size: 14, cls: 'ico-ext'})}</a>` : ''}
</article>`;
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

export function strengthCard(s) {
  return `<article class="fcard strength">
  <div class="ic">${icon(s.icon, {size: 22})}</div>
  <h3>${bi(s.title)}</h3>
  <p>${bi(s.text)}</p>
</article>`;
}

export function timelineItem(t) {
  return `<li class="tl-item">
  <div class="yr mono">${esc(t.period)} · ${bi(t.company)}</div>
  <h3>${bi(t.title)}</h3>
  <div class="role">${bi(t.role)}</div>
  <p>${bi(t.text)}</p>
</li>`;
}

const pick = (p, k) => ({ko: p[k], en: p[k + 'En'] || p[k]});
export function featuredProjectCard(p) {
  const chips = (p.stack || []).slice(0, 4).map((s, i) => `<span class="chip mono">${bi({ko: s, en: (p.stackEn || p.stack)[i] || s})}</span>`).join('');
  return `<article class="card fproj" data-project="${esc(p.id)}">
  <a class="fproj-link" href="/career/#p${esc(p.id)}">
    <div class="fproj-top"><span class="fproj-ico">${icon(projectKind(p), {size: 22})}</span><span class="fproj-meta mono">${esc(p.year)} · ${bi(pick(p, 'company'))}</span></div>
    <div class="fproj-role mono">${bi(pick(p, 'role'))}</div>
    <h3>${bi(pick(p, 'name'))}</h3>
    <p>${bi(pick(p, 'desc'))}</p>
    <div class="chips">${chips}</div>
  </a>
</article>`;
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
