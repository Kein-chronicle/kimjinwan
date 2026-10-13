// scripts/lib/validate.mjs
import {ICON_NAMES} from './icons.mjs';
const KINDS = ['service', 'game', 'tool', 'app', 'blog'];
export const CATEGORIES = ['document', 'creative', 'build', 'hub', 'ai-tools'];
const STATUS = ['live', 'released', 'experiment', 'prelaunch'];
const STAGE = ['ai', 'human', 'gate'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS = /^https:\/\//;

const biOk = o => o && typeof o.ko === 'string' && o.ko.trim() && typeof o.en === 'string' && o.en.trim();

export function validate({services = [], collections = [], factories = [], profile = null, contentHub = null}) {
  const err = [];
  const dup = (list, label) => {
    const seen = new Set();
    for (const x of list) { if (seen.has(x.id)) err.push(`${label}: duplicate id ${x.id}`); seen.add(x.id); }
  };
  dup(services, 'services'); dup(collections, 'collections'); dup(factories, 'factories');

  for (const s of services) {
    const w = `services.${s.id}`;
    if (!KINDS.includes(s.kind)) err.push(`${w}: bad kind ${s.kind}`);
    if (!CATEGORIES.includes(s.category)) err.push(`${w}: bad category ${s.category}`);
    if (!STATUS.includes(s.status)) err.push(`${w}: bad status ${s.status}`);
    if (!biOk(s.tagline)) err.push(`${w}: tagline needs ko/en`);
    if (!biOk(s.summary)) err.push(`${w}: summary needs ko/en`);
    if (!HTTPS.test(s.url || '')) err.push(`${w}: url must be https`);
    if (!DATE.test(s.updated || '')) err.push(`${w}: updated must be YYYY-MM-DD`);
    if (!Array.isArray(s.ai_tools)) err.push(`${w}: ai_tools must be array`);
  }
  const featured = services.filter(s => s.featured).length;
  if (featured < 3 || featured > 24) err.push(`services: featured must be 3-24, got ${featured}`);

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
    if (f.paused && !biOk(f.paused.note)) err.push(`${w}: paused.note needs ko/en`);
    for (const st of f.stages || []) {
      if (!STAGE.includes(st.kind)) err.push(`${w}: bad stage kind ${st.kind}`);
      if (!biOk(st.name)) err.push(`${w}: stage name needs ko/en`);
    }
    if (f.icon !== undefined && !ICON_NAMES.includes(f.icon)) err.push(`${w}: unknown icon ${f.icon}`);
    if (!(f.stages || []).some(st => st.kind === 'human')) err.push(`${w}: needs at least one human stage`);
    for (const m of f.metrics || []) {
      if (!DATE.test(m.as_of || '')) err.push(`${w}: metric as_of must be YYYY-MM-DD`);
      if (!m.source) err.push(`${w}: metric needs source`);
      if (!biOk(m.label) || m.value === undefined || m.value === '') err.push(`${w}: metric needs label and value`);
    }
    if (f.showcase && (!/^https:\/\//.test(f.showcase.url || '') || !biOk(f.showcase.label))) err.push(`${w}: showcase needs https url and ko/en label`);
    for (const o of f.outputs || []) if (!ids.has(o)) err.push(`${w}: outputs references unknown service ${o}`);
  }
  if (profile) validateProfile(profile, err);
  if (contentHub) validateContentHub(contentHub, err);
  return err;
}

function validateProfile(p, err) {
  if (!biOk(p.pitch)) err.push('profile.pitch needs ko/en');
  if (!Array.isArray(p.strengths) || p.strengths.length !== 4) err.push('profile.strengths must have exactly 4 entries');
  (p.strengths || []).forEach((s, i) => {
    const w = `profile.strengths[${i}]`;
    if (!ICON_NAMES.includes(s.icon)) err.push(`${w}: unknown icon ${s.icon}`);
    if (!biOk(s.title) || !biOk(s.text)) err.push(`${w}: title/text need ko/en`);
  });
  if (!Array.isArray(p.timeline) || p.timeline.length !== 4) err.push('profile.timeline must have exactly 4 entries');
  (p.timeline || []).forEach((t, i) => {
    const w = `profile.timeline[${i}]`;
    if (typeof t.period !== 'string' || !t.period.trim()) err.push(`${w}: period required`);
    for (const k of ['company', 'title', 'role', 'text']) if (!biOk(t[k])) err.push(`${w}: ${k} needs ko/en`);
  });
  const f = p.featured_projects;
  if (!Array.isArray(f) || !f.length) err.push('profile.featured_projects must be a non-empty array');
  else {
    if (!f.every(Number.isInteger)) err.push('profile.featured_projects must be integers');
    if (new Set(f).size !== f.length) err.push('profile.featured_projects must be unique');
  }
}

// 콘텐츠 허브: 항목마다 제목 + 읽을 수 있는 요약 본문, 해당 서브도메인 https 링크, 중복 없음, 숫자엔 as_of·source.
export const HUB_MIN_SUMMARY = 40;
export const HUB_MIN_GIZMO_SUMMARY = 30; // 한 줄 설명 + 추천 대상 한 줄
export const HUB_MIN_BLOG_SUMMARY = 20; // 전체 글을 싣는 블로그·게임 소식은 짧은 설명이 있는 글도 있다
export const HUB_SECTION_IDS = ['blog', 'gamenews', 'gizmo', 'games', 'tools'];
const URL_RULE = {
  blog: u => /^https:\/\/blog\.kimjinwan\.com\/ko\/(ai|apps|fiction)\/[\w-]+\/$/.test(u),
  gamenews: u => /^https:\/\/blog\.kimjinwan\.com\/ko\/games\/[\w-]+\/$/.test(u),
  gizmo: u => /^https:\/\/gizmo-store\.com\/tool\/[\w-]+$/.test(u),
  games: u => /^https:\/\/games\.kimjinwan\.com\/play\/[\w-]+\/$/.test(u),
  tools: u => /^https:\/\/apps\.kimjinwan\.com\/[\w-]+\/$/.test(u),
};
function validateContentHub(hub, err) {
  if (!DATE.test(hub.as_of || '')) err.push('contentHub.as_of must be YYYY-MM-DD');
  const ids = (hub.sections || []).map(s => s.id);
  if (ids.join() !== HUB_SECTION_IDS.join()) err.push(`contentHub.sections must be ${HUB_SECTION_IDS} (got ${ids})`);
  const seen = new Set();
  const text = (w, t, min) => { if (typeof t !== 'string' || t.trim().length < min) err.push(`${w}: summary needs at least ${min} chars`); };
  for (const s of hub.sections || []) {
    const c = s.count, w0 = `contentHub.${s.id}`;
    if (!c || !Number.isInteger(c.value) || c.value < 1 || !DATE.test(c.as_of || '') || !c.source) err.push(`${w0}: count needs value, as_of and source`);
    if (!HTTPS.test(s.url || '')) err.push(`${w0}: url must be https`);
    if (!Array.isArray(s.groups) || !s.groups.length) { err.push(`${w0}: groups required`); continue; }
    let n = 0;
    for (const g of s.groups) {
      const w = `${w0}.${g.id}`;
      if (!biOk(g.label)) err.push(`${w}: label needs ko/en`);
      if (!g.items || !g.items.length) err.push(`${w}: needs items`);
      if (s.id === 'blog' || s.id === 'gamenews') { if (g.total !== g.items.length) err.push(`${w}: total must equal items`); }
      for (const it of g.items || []) {
        n++; const iw = `${w}.${it.url}`;
        if (!URL_RULE[s.id](it.url || '')) err.push(`${iw}: url does not match the ${s.id} pattern`);
        if (seen.has(it.url)) err.push(`${iw}: duplicate url`); seen.add(it.url);
        const title = s.id === 'games' ? (it.title && it.title.ko && it.title.en) : it.title;
        if (!title) err.push(`${iw}: title required`);
        if (s.id === 'blog' || s.id === 'gamenews') { if (!DATE.test(it.date || '')) err.push(`${iw}: date required`); text(iw, it.summary, HUB_MIN_BLOG_SUMMARY); }
        else if (s.id === 'gizmo') { if (typeof it.summary !== 'string' || it.summary.length < HUB_MIN_GIZMO_SUMMARY) err.push(`${iw}: summary (tagline + audience) needs at least ${HUB_MIN_GIZMO_SUMMARY} chars`); if ('download' in it) err.push(`${iw}: download link must not be stored`); }
        else { text(iw, it.summary, 20); if (!it.slug) err.push(`${iw}: slug required`); }
      }
    }
    if (c && n !== c.value) err.push(`${w0}: count ${c.value} != ${n} items`);
    if (c && c.total !== undefined && c.total < c.value) err.push(`${w0}: total must be >= value`);
  }
}
