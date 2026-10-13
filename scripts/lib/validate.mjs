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
  if (contentHub) validateContentHub(contentHub, services, err);
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
const HUB_HOST = {blog: 'blog.kimjinwan.com', games: 'games.kimjinwan.com', tools: 'apps.kimjinwan.com', gizmo: 'gizmo-store.com'};
export const HUB_MIN_SUMMARY = 40;
export const HUB_MIN_GIZMO_SUMMARY = 30; // 한 줄 설명 + 추천 대상 한 줄
export const HUB_MIN_BLOG_SUMMARY = 20; // 전체 글을 싣는 블로그는 짧은 설명이 있는 글도 있다
function validateContentHub(hub, services, err) {
  if (!DATE.test(hub.as_of || '')) err.push('contentHub.as_of must be YYYY-MM-DD');
  const ids = (hub.sections || []).map(s => s.id);
  if (ids.join() !== 'blog,services,games,tools,gizmo') err.push(`contentHub.sections must be blog,services,games,tools,gizmo (got ${ids})`);
  const seen = new Set();
  const url = (w, u, host) => {
    if (!HTTPS.test(u || '')) { err.push(`${w}: url must be https`); return; }
    if (host && new URL(u).host !== host) err.push(`${w}: url host must be ${host}`);
    if (seen.has(u)) err.push(`${w}: duplicate url ${u}`);
    seen.add(u);
  };
  const text = (w, t, min = HUB_MIN_SUMMARY) => { if (typeof t !== 'string' || t.trim().length < min) err.push(`${w}: summary needs at least ${min} chars`); };
  for (const s of hub.sections || []) {
    const c = s.count;
    if (!c || !Number.isInteger(c.value) || c.value < 1 || !DATE.test(c.as_of || '') || !c.source) err.push(`contentHub.${s.id}: count needs value, as_of and source`);
    if (s.id !== 'services') url(`contentHub.${s.id}`, s.url, HUB_HOST[s.id]);
    if (s.id === 'gizmo') {
      let n = 0;
      for (const g of s.groups || []) {
        if (!biOk(g.label)) err.push(`contentHub.gizmo.${g.id}: label needs ko/en`);
        for (const it of g.items || []) {
          n++; const iw = `contentHub.gizmo.${it.url}`;
          if (!it.title || typeof it.tagline !== 'string' || it.tagline.length < 15) err.push(`${iw}: title and tagline (15+ chars) required`);
          if (typeof it.summary !== 'string' || it.summary.length < HUB_MIN_GIZMO_SUMMARY) err.push(`${iw}: summary (tagline + audience) needs at least ${HUB_MIN_GIZMO_SUMMARY} chars`);
          url(iw, it.url, HUB_HOST.gizmo);
          if (!/^https:\/\/gizmo-store\.com\/tool\/[\w-]+$/.test(it.url || '')) err.push(`${iw}: must be a /tool/<slug> page`);
          if ('download' in it) err.push(`${iw}: download link must not be stored`);
        }
      }
      if (c && n !== c.value) err.push(`contentHub.gizmo: count ${c.value} != ${n} items`);
    } else if (s.id === 'blog') {
      if (!Array.isArray(s.groups) || !s.groups.length) err.push('contentHub.blog: groups required');
      let total = 0;
      for (const g of s.groups || []) {
        const w = `contentHub.blog.${g.id}`;
        if (!biOk(g.label) || !biOk(g.blurb)) err.push(`${w}: label/blurb need ko/en`);
        if (!Number.isInteger(g.total) || g.total < g.items.length) err.push(`${w}: total must be >= items`);
        total += g.total;
        if (!g.items.length) err.push(`${w}: needs items`);
        for (const it of g.items) {
          const iw = `${w}.${it.url}`;
          if (!it.title || !DATE.test(it.date || '')) err.push(`${iw}: title and date required`);
          text(iw, it.summary, HUB_MIN_BLOG_SUMMARY); url(iw, it.url, HUB_HOST.blog);
          if (!(it.url || '').startsWith(`https://blog.kimjinwan.com/ko/${g.id}/`)) err.push(`${iw}: url must be under /ko/${g.id}/`);
        }
      }
      if (c && total !== c.value) err.push(`contentHub.blog: count ${c.value} != sum of group totals ${total}`);
    } else if (s.id === 'services') {
      const have = new Set(services.map(x => x.id));
      for (const it of s.items || []) {
        if (!have.has(it.id)) err.push(`contentHub.services: unknown service ${it.id}`);
        if (!biOk(it.text) || it.text.ko.length < HUB_MIN_SUMMARY || it.text.en.length < HUB_MIN_SUMMARY) err.push(`contentHub.services.${it.id}: text needs ko/en`);
      }
      const got = new Set((s.items || []).map(x => x.id));
      for (const id of have) if (!got.has(id)) err.push(`contentHub.services: missing ${id}`);
      if (got.size !== (s.items || []).length) err.push('contentHub.services: duplicate id');
      if (c && c.value !== services.length) err.push(`contentHub.services: count ${c.value} != ${services.length} services`);
    } else {
      if (!(s.items || []).length) err.push(`contentHub.${s.id}: needs items`);
      if (c && (s.items || []).length > c.value) err.push(`contentHub.${s.id}: more items than count`);
      for (const it of s.items || []) {
        const iw = `contentHub.${s.id}.${it.url}`;
        const t = s.id === 'games' ? (it.title && it.title.ko && it.title.en) : it.title;
        if (!t) err.push(`${iw}: title required`);
        text(iw, it.summary); url(iw, it.url, HUB_HOST[s.id]);
      }
    }
  }
}
