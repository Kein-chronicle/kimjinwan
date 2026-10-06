// scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './lib/validate.mjs';
import {fill} from './lib/template.mjs';
import {icon, ICON_NAMES} from './lib/icons.mjs';
import {serviceCard, serviceFeature, collectionCard, collectionRow, factoryCard, stageLegend, heroStats, worksFilters, factoryNav, strengthItem, timelineItem, attachProjects, bi, esc, logo, navLinks, footMap, breadcrumb, pageFoot, SUBPAGES} from './lib/render.mjs';
import {parseProjects, pickFeatured} from './lib/projects.mjs';
import {createHash} from 'node:crypto';
import {SITE, SITE_NAME, facts, pageMeta, cardPath, cardAlt} from './lib/og.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(rd(p));

export function loadData() {
  return {services: json('data/services.json'), collections: json('data/collections.json'), factories: json('data/factories.json'), profile: json('data/profile.json')};
}

// 페이지 표. 제목·설명·공유 카드 문구는 scripts/lib/og.mjs 의 pageMeta 한 곳에서 온다(카드 PNG 와 같은 출처).
const PAGE_FILES = [
  {key: 'home', src: 'src/home.html', out: 'index.html', path: '/'},
  {key: 'works', src: 'src/works.html', out: 'works/index.html', path: '/works/'},
  {key: 'factories', src: 'src/factories.html', out: 'factories/index.html', path: '/factories/'},
  {key: 'career', src: 'src/career.html', out: 'career/index.html', path: '/career/'},
];
export function pagesFor(meta) {
  return PAGE_FILES.map(p => ({...p, title: meta[p.key].title, description: meta[p.key].description,
    image: cardPath(p.key), imageAlt: cardAlt(meta[p.key])}));
}
// 공유 카드 절대 URL — ?v= 는 PNG 내용 해시라 카드가 바뀔 때만 SNS 캐시가 갈린다.
export const cardUrl = file => `${SITE}/${file}?v=${createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 10)}`;

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

// 외부 SNS 링크(sameAs)는 두지 않는다 — 연락은 이메일만. 얼굴 사진은 공유·구조화 데이터 어디에도 쓰지 않는다(Person.image 없음).
function schemaFor(page, stamp, {profile}) {
  const url = `${SITE}${page.path}`;
  const img = cardUrl(page.image);
  const image = {'@type': 'ImageObject', '@id': `${url}#primaryimage`, url: img, contentUrl: img, thumbnailUrl: img, width: 1200, height: 630, caption: page.imageAlt};
  const g = [
    {'@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: SITE_NAME, alternateName: ['김진완 포트폴리오', 'Kim Jinwan'], inLanguage: ['ko', 'en'], publisher: {'@id': `${SITE}/#person`}},
    {'@type': 'Person', '@id': `${SITE}/#person`, name: '김진완', alternateName: ['Kim Jinwan', 'Kein'], url: `${SITE}/`,
      jobTitle: ['Software Product Manager', 'Developer'], knowsAbout: profile.strengths.map(s => s.title.en)},
  ];
  if (page.path === '/') g.push({'@type': 'ProfilePage', '@id': `${SITE}/#profile`, url, name: page.title, description: page.description, inLanguage: 'ko', dateModified: stamp,
    mainEntity: {'@id': `${SITE}/#person`}, isPartOf: {'@id': `${SITE}/#website`}, relatedLink: 'https://blog.kimjinwan.com/', primaryImageOfPage: image, thumbnailUrl: img});
  else g.push(
    {'@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, inLanguage: 'ko', dateModified: stamp,
      isPartOf: {'@id': `${SITE}/#website`}, about: {'@id': `${SITE}/#person`}, breadcrumb: {'@id': `${url}#breadcrumb`}, primaryImageOfPage: image, thumbnailUrl: img},
    {'@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
      {'@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: SUBPAGES.find(x => x.key === page.key).label.ko, item: url}]});
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
    featured_wide: featured.map(serviceFeature).join('\n'),
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
    ...Object.fromEntries(Object.entries({ext: ['arrow-up-right', 14], mail: ['mail', 18], play: ['play', 18], user: ['user', 16], layers: ['layers', 16], factory: ['factory', 16], rocket: ['rocket', 16], globe: ['globe', 16], brain: ['brain', 16], briefcase: ['briefcase', 16], users: ['users', 16], terminal: ['terminal', 22], blocks: ['blocks', 22], cpu: ['cpu', 22], plug: ['plug', 22], gamepad: ['gamepad', 24], clock: ['clock', 13], workflow: ['workflow', 18]}).map(([k, [n, z]]) => ['ico_' + k, icon(n, {size: z, cls: k === 'ext' ? 'ico-ext' : ''})])),
    updated: STAMP,
    logo: logo(),
    logo_foot: logo('logo logo-foot'),
  };
  const out = {};
  for (const page of pagesFor(pageMeta(facts(data, projects)))) {
    const ctx = {...ctxBase, nav_links: navLinks(page.key), foot_map: footMap(page.key), breadcrumb: breadcrumb(page.key), page_foot: pageFoot(page.key), title: esc(page.title), description: esc(page.description), canonical: `${SITE}${page.path}`, schema: schemaFor(page, STAMP, data),
      site_name: esc(SITE_NAME), og_image: cardUrl(page.image), og_image_alt: esc(page.imageAlt)};
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
