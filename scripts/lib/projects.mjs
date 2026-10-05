// scripts/lib/projects.mjs — js/data.js(window.PROJECTS = [...]) 파싱과 대표 프로젝트 선택
export function parseProjects(text) {
  const marker = 'window.PROJECTS = ';
  const at = text.indexOf(marker);
  if (at < 0) throw new Error('js/data.js: "window.PROJECTS = " not found');
  const start = text.indexOf('[', at);
  const end = text.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('js/data.js: array literal not found');
  try { return JSON.parse(text.slice(start, end + 1)); }
  catch (e) { throw new Error('js/data.js: PROJECTS is not valid JSON: ' + e.message); }
}

export function pickFeatured(ids, projects) {
  const byId = new Map(projects.map(p => [p.id, p]));
  const missing = ids.filter(id => !byId.has(id));
  if (missing.length) throw new Error(`featured_projects: id ${missing.join(', ')} not found in js/data.js`);
  return ids.map(id => byId.get(id));
}
