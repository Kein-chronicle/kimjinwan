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
