// scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './lib/validate.mjs';
import {fill} from './lib/template.mjs';
import {icon, ICON_NAMES} from './lib/icons.mjs';
import {serviceCard, collectionCard, collectionRow, factoryCard, stageLegend, heroStats, worksFilters, factoryNav, strengthItem, timelineItem, attachProjects, bi, esc} from './lib/render.mjs';
import {parseProjects, pickFeatured} from './lib/projects.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(rd(p));

export function loadData() {
  return {services: json('data/services.json'), collections: json('data/collections.json'), factories: json('data/factories.json'), profile: json('data/profile.json')};
}

const SITE = 'https://kimjinwan.com';
const PAGES = [
  {src: 'src/home.html', out: 'index.html', path: '/',
    title: '김진완 — AI로 만들고 운영하는 개발자 · PM',
    description: '개발자·PM 김진완이 AI로 만들고 직접 운영하는 서비스, 웹게임, 웹 도구, 블로그와 11년 경력.'},
  {src: 'src/works.html', out: 'works/index.html', path: '/works/',
    title: '작업물 — 김진완', description: '개발자·PM 김진완이 AI로 만들어 직접 운영하는 서비스·웹게임·웹 도구·앱·블로그 전체 목록.'},
  {src: 'src/factories.html', out: 'factories/index.html', path: '/factories/',
    title: '직접 설계한 AI 공장 — 김진완', description: '앱·게임·콘텐츠를 양산하도록 직접 설계한 AI 공장: 파이프라인의 단계, 품질 게이트, 사람이 직접 맡는 일.'},
  {src: 'src/career.html', out: 'career/index.html', path: '/career/',
    title: '경력 — 김진완', description: '11년 경력과 수행 프로젝트 55개: 차량 SW PM, 풀스택 개발, 팀 리딩.'},
];

// 출력은 src+data+js/data.js+VERSION 의 순수 함수여야 한다: 시각(new Date) 대신 데이터 안의 최대 날짜를 쓴다.
function collectDates(v, acc = []) {
  if (Array.isArray(v)) v.forEach(x => collectDates(x, acc));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if ((k === 'updated' || k === 'as_of') && typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)) acc.push(x);
    else collectDates(x, acc);
  }
  return acc;
}
export const stampOf = d => collectDates(d).sort().at(-1);

function schemaFor(page, stamp) {
  const g = [
    {'@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: '김진완 포트폴리오', alternateName: 'Kim Jinwan', inLanguage: ['ko', 'en'], publisher: {'@id': `${SITE}/#person`}},
    {'@type': 'Person', '@id': `${SITE}/#person`, name: '김진완', alternateName: 'Kein', url: `${SITE}/`, jobTitle: 'Software Product Manager'},
  ];
  if (page.path === '/') g.push({'@type': 'ProfilePage', '@id': `${SITE}/#profile`, url: `${SITE}/`, name: page.title, dateModified: stamp, mainEntity: {'@id': `${SITE}/#person`}, isPartOf: {'@id': `${SITE}/#website`}, relatedLink: 'https://blog.kimjinwan.com/'});
  return `<script type="application/ld+json">${JSON.stringify({'@context': 'https://schema.org', '@graph': g})}</script>`;
}

export function buildAll({write = true} = {}) {
  const data = loadData();
  const errors = validate(data);
  if (errors.length) throw new Error('data validation failed:\n' + errors.join('\n'));

  const projects = parseProjects(rd('js/data.js'));
  const featuredProjects = pickFeatured(data.profile.featured_projects, projects);
  const projectsByEntry = attachProjects(data.profile.timeline, featuredProjects);
  const byId = new Map(data.services.map(s => [s.id, s]));
  const version = rd('VERSION').trim();
  const STAMP = stampOf(data);
  if (!STAMP) throw new Error('no dates found in data/*.json');
  const partials = {head: rd('src/partials/head.html'), nav: rd('src/partials/nav.html'), footer: rd('src/partials/footer.html'),
    ai: rd('src/sections/ai.html')};
  const featured = data.services.filter(s => s.featured);
  const ctxBase = {
    version,
    hero_stats: heroStats(data),
    featured: featured.map(serviceCard).join('\n'),
    all_services: data.services.map(serviceCard).join('\n'),
    collections: data.collections.map(collectionCard).join('\n'),
    collection_rows: data.collections.map(collectionRow).join('\n'),
    stage_legend: stageLegend(),
    factory_count: String(data.factories.length),
    factories: data.factories.map(f => factoryCard(f, byId)).join('\n'),
    factories_home: data.factories.map(f => factoryCard(f, byId, {link: true})).join('\n'),
    works_filters: worksFilters(),
    factory_nav: factoryNav(data.factories),
    pitch: bi(data.profile.pitch),
    strengths: data.profile.strengths.map(strengthItem).join('\n'),
    timeline: data.profile.timeline.map(t => timelineItem(t)).join('\n'),
    timeline_projects: data.profile.timeline.map((t, i) => timelineItem(t, projectsByEntry[i])).join('\n'),
    project_count: String(projects.length),
    ...Object.fromEntries(ICON_NAMES.map(n => ['ico_' + n, icon(n, {size: 18})])),
    ...Object.fromEntries(Object.entries({ext: ['arrow-up-right', 14], mail: ['mail', 18], play: ['play', 18], user: ['user', 16], layers: ['layers', 16], factory: ['factory', 16], globe: ['globe', 16], brain: ['brain', 16], briefcase: ['briefcase', 16], users: ['users', 16], terminal: ['terminal', 22], blocks: ['blocks', 22], cpu: ['cpu', 22], plug: ['plug', 22], gamepad: ['gamepad', 24], clock: ['clock', 13], workflow: ['workflow', 18]}).map(([k, [n, z]]) => ['ico_' + k, icon(n, {size: z, cls: k === 'ext' ? 'ico-ext' : ''})])),
    updated: STAMP,
  };
  const out = {};
  for (const page of PAGES) {
    const ctx = {...ctxBase, title: esc(page.title), description: esc(page.description), canonical: `${SITE}${page.path}`, schema: schemaFor(page, STAMP)};
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
