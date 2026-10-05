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
