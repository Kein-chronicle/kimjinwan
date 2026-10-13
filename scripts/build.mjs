// scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './lib/validate.mjs';
import {fill} from './lib/template.mjs';
import {icon, ICON_NAMES} from './lib/icons.mjs';
import {serviceCard, serviceFeature, serviceGroups, sortServices, collectionCard, collectionRow, mirrorPath, rewriteBlogBody, gizmoBody, mirrorHead, mirrorCrumbs, mirrorFoot, crumbTrail, factoryCard, stageLegend, heroStats, worksFilters, factoryNav, strengthItem, timelineItem, attachProjects, bi, esc, logo, navLinks, footMap, breadcrumb, pageFoot, SUBPAGES} from './lib/render.mjs';
import {parseProjects, pickFeatured} from './lib/projects.mjs';
import {createHash} from 'node:crypto';
import {hubModel, contentNav, landingHtml, mirrorTrail} from './lib/hub.mjs';
import {SITE, SITE_NAME, facts, pageMeta, cardPath, cardAlt} from './lib/og.mjs';
const GAME_LASTMOD = '2026-10-06'; // /game/ 은 손으로 쓴 페이지 — 마지막 수정일 고정
const SERVICE_KINDS = ['blog', 'game', 'tool']; // 서비스 카드로 올라간 종류는 /works/ 컬렉션 카드에서 뺀다(중복 방지)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(rd(p));

export function loadData() {
  return {services: json('data/services.json'), collections: json('data/collections.json'), factories: json('data/factories.json'), profile: json('data/profile.json'), contentHub: json('data/content-hub.json')};
}

// 페이지 표. 제목·설명·공유 카드 문구는 scripts/lib/og.mjs 의 pageMeta 한 곳에서 온다(카드 PNG 와 같은 출처).
const PAGE_FILES = [
  {key: 'home', src: 'src/home.html', out: 'index.html', path: '/'},
  {key: 'works', src: 'src/works.html', out: 'works/index.html', path: '/works/'},
  {key: 'factories', src: 'src/factories.html', out: 'factories/index.html', path: '/factories/'},
  {key: 'career', src: 'src/career.html', out: 'career/index.html', path: '/career/'},
  {key: 'content', src: 'src/content.html', out: 'content/index.html', path: '/content/'},
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
function schemaFor(page, stamp, {profile, services = [], contentHub = null}) {
  const url = `${SITE}${page.path}`;
  const img = cardUrl(page.image);
  const image = {'@type': 'ImageObject', '@id': `${url}#primaryimage`, url: img, contentUrl: img, thumbnailUrl: img, width: 1200, height: 630, caption: page.imageAlt};
  const g = [
    {'@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: SITE_NAME, alternateName: ['김진완 포트폴리오', 'Kim Jinwan'], inLanguage: ['ko', 'en'], publisher: {'@id': `${SITE}/#person`}},
    {'@type': 'Person', '@id': `${SITE}/#person`, name: '김진완', alternateName: ['Kim Jinwan', 'Kein'], url: `${SITE}/`,
      jobTitle: ['Software Product Manager', 'Developer'], knowsAbout: profile.strengths.map(s => s.title.en)},
  ];
  if (page.path === '/') g.push({'@type': 'ProfilePage', '@id': `${SITE}/#profile`, url, name: page.title, description: page.description, inLanguage: 'ko', dateModified: stamp,
    mainEntity: {'@id': `${SITE}/#person`}, isPartOf: {'@id': `${SITE}/#website`}, relatedLink: ['https://service.kimjinwan.com/', 'https://blog.kimjinwan.com/', 'https://games.kimjinwan.com/', 'https://apps.kimjinwan.com/'], primaryImageOfPage: image, thumbnailUrl: img},
    {'@type': 'ItemList', '@id': `${SITE}/#services`, name: '김진완이 직접 만들어 제공하는 서비스', numberOfItems: services.length,
      itemListElement: services.map((s, i) => ({'@type': 'ListItem', position: i + 1, name: s.name, url: s.url}))});
  else g.push(
    {'@type': page.key === 'content' ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, inLanguage: 'ko', dateModified: stamp,
      isPartOf: {'@id': `${SITE}/#website`}, about: {'@id': `${SITE}/#person`}, breadcrumb: {'@id': `${url}#breadcrumb`}, primaryImageOfPage: image, thumbnailUrl: img},
    {'@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
      {'@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: SUBPAGES.find(x => x.key === page.key).label.ko, item: url}]});
  if (page.key === 'content' && contentHub) {
    const names = {blog: '블로그', gizmo: 'AI 활용 가이드', games: '웹게임', tools: '웹 도구'};
    g.push({'@type': 'ItemList', '@id': `${url}#list-sections`, name: '콘텐츠 허브 섹션', numberOfItems: 4,
      itemListElement: ['blog', 'gizmo', 'games', 'tools'].map((id, i) => ({'@type': 'ListItem', position: i + 1, name: names[id], url: `${SITE}/content/${id}/`}))});
  }
  return `<script type="application/ld+json">${JSON.stringify({'@context': 'https://schema.org', '@graph': g}).replace(/</g, '\\u003c')}</script>`;
}

// 콘텐츠 허브 개별 페이지(원문 사본). 본문 스냅샷은 content-src/(scripts/build_content_hub.mjs 가 만든다) — 빌드는 형제 저장소·네트워크를 읽지 않는다.
const jsonFiles = dir => fs.existsSync(path.join(ROOT, dir)) ? fs.readdirSync(path.join(ROOT, dir), {recursive: true}).filter(f => f.endsWith('.json')).sort().map(f => `${dir}/${f}`) : [];
export function mirrorPages(data) {
  const blogLabel = Object.fromEntries(data.contentHub.sections.find(x => x.id === 'blog').groups.map(g => [g.id, g.label]));
  const blog = jsonFiles('content-src/blog').map(f => json(f));
  const mirrored = new Set(blog.map(b => `${b.category}/${b.slug}`));
  const pages = [];
  for (const b of blog) pages.push({kind: 'blog', path: mirrorPath('blog', `${b.category}/${b.slug}`), title: b.title, description: b.description, date: b.date, catLabel: blogLabel[b.category],
    crumbs: mirrorTrail(data, 'blog', b.category), body: rewriteBlogBody(b.body, mirrored)});
  for (const f of jsonFiles('content-src/gizmo')) { const g = json(f);
    pages.push({kind: 'gizmo', path: mirrorPath('gizmo', g.slug), title: g.title, description: g.tagline, purpose: g.purpose, crumbs: mirrorTrail(data, 'gizmo', g.purpose), body: gizmoBody(g)}); }
  return pages;
}
// 상세·색인 페이지 공용 JSON-LD. 상세는 Article(허브 주소가 mainEntityOfPage), 색인은 CollectionPage + ItemList.
function hubSchema(m, stamp, {profile}, type) {
  const url = `${SITE}${m.path}`, img = cardUrl('assets/og/content.png');
  const trail = [{name: '홈', item: `${SITE}/`}, {name: '콘텐츠 허브', item: `${SITE}/content/`}, ...m.crumbs.map(c => ({name: c.name || c.label.replace(/<[^>]+>/g, ''), item: SITE + c.href})), ...(type === 'Article' ? [{name: m.shortTitle || m.title, item: url}] : [])];
  const g = [
    {'@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: SITE_NAME, inLanguage: ['ko', 'en'], publisher: {'@id': `${SITE}/#person`}},
    {'@type': 'Person', '@id': `${SITE}/#person`, name: '김진완', alternateName: ['Kim Jinwan', 'Kein'], url: `${SITE}/`, jobTitle: ['Software Product Manager', 'Developer'], knowsAbout: profile.strengths.map(s => s.title.en)},
    type === 'Article'
      ? {'@type': 'Article', '@id': `${url}#article`, url, headline: m.shortTitle || m.title, description: m.description, inLanguage: 'ko', ...(m.date ? {datePublished: m.date} : {}), dateModified: m.date || stamp,
        author: {'@id': `${SITE}/#person`}, publisher: {'@id': `${SITE}/#person`}, isPartOf: {'@id': `${SITE}/content/#webpage`}, mainEntityOfPage: {'@type': 'WebPage', '@id': url}, image: img, thumbnailUrl: img}
      : {'@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: m.title, description: m.description, inLanguage: 'ko', dateModified: stamp, isPartOf: {'@id': `${SITE}/#website`}, about: {'@id': `${SITE}/#person`}, breadcrumb: {'@id': `${url}#breadcrumb`}, primaryImageOfPage: img},
    {'@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: trail.map((t, i) => ({'@type': 'ListItem', position: i + 1, name: t.name, item: t.item}))},
  ];
  if (type !== 'Article') g.push({'@type': 'ItemList', '@id': `${url}#list`, name: m.jsonName, numberOfItems: m.jsonItems.length, itemListElement: m.jsonItems.map((it, i) => ({'@type': 'ListItem', position: i + 1, name: it.name, url: it.url}))});
  return `<script type="application/ld+json">${JSON.stringify({'@context': 'https://schema.org', '@graph': g}).replace(/</g, '\\u003c')}</script>`;
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
    featured_wide: serviceGroups(featured),
    all_services: sortServices(data.services).map(serviceCard).join('\n'),
    collections: data.collections.filter(c => !SERVICE_KINDS.includes(c.kind)).map(collectionCard).join('\n'),
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
    head_links: '',
    hub_blog_count: String(data.contentHub.sections.find(x => x.id === 'blog').count.value),
    hub_games_count: String(data.contentHub.sections.find(x => x.id === 'games').count.value),
    hub_gizmo_count: String(data.contentHub.sections.find(x => x.id === 'gizmo').count.value),
    hub_tools_count: String(data.contentHub.sections.find(x => x.id === 'tools').count.value),
    updated: STAMP,
    logo: logo(),
    logo_foot: logo('logo logo-foot'),
  };
  const out = {};
  const model = hubModel(data);
  for (const page of pagesFor(pageMeta(facts(data, projects)))) {
    const ctx = {...ctxBase, nav_links: navLinks(page.key), foot_map: footMap(page.key), breadcrumb: breadcrumb(page.key), page_foot: pageFoot(page.key), hub_subnav: contentNav('all', data.contentHub), hub_landing: landingHtml(data, model), title: esc(page.title), description: esc(page.description), canonical: `${SITE}${page.path}`, schema: schemaFor(page, STAMP, data),
      site_name: esc(SITE_NAME), og_image: cardUrl(page.image), og_image_alt: esc(page.imageAlt)};
    out[page.out] = fill(rd(page.src), ctx, {...partials, head: fill(partials.head, ctx, {})});
  }
  const hubMeta = pageMeta(facts(data, projects)).content;
  const shared = {og_image: cardUrl('assets/og/content.png'), og_image_alt: esc(cardAlt(hubMeta)), site_name: esc(SITE_NAME)};
  const clip = (t, n) => (t.length > n ? t.slice(0, n - 2) + '…' : t);
  // 색인 페이지(섹션·카테고리·쪽): 자기 자신이 canonical, 이전/다음 쪽은 rel 링크
  for (const m of model.pages) {
    const links = [m.prev ? `<link rel="prev" href="${m.prev}">\n` : '', m.next ? `<link rel="next" href="${m.next}">\n` : ''].join('');
    const ctx = {...ctxBase, ...shared, nav_links: navLinks('content'), foot_map: footMap('content'), title: esc(clip(m.title, 70)), description: esc(m.description), canonical: m.canonical, head_links: links,
      schema: hubSchema(m, STAMP, data, 'CollectionPage'), hub_subnav: contentNav(m.kind, data.contentHub), list_crumbs: crumbTrail(m.crumbs), list_body: m.body};
    out[`${m.path.slice(1)}index.html`] = fill(rd('src/content-list.html'), ctx, {...partials, head: fill(partials.head, ctx, {})});
  }
  // 상세 페이지(글·프롬프트): 허브가 원본이다 — canonical 은 자기 주소
  for (const m of mirrorPages(data)) {
    const ctx = {...ctxBase, ...shared, nav_links: navLinks('content'), foot_map: footMap('content'), title: esc(clip(m.title, 70)), description: esc(clip(m.description, 300)),
      canonical: `${SITE}${m.path}`, schema: hubSchema(m, STAMP, data, 'Article'), hub_subnav: contentNav(m.kind, data.contentHub),
      mirror_crumbs: mirrorCrumbs(m), mirror_head: mirrorHead(m), mirror_title: m.lang === 'bi' ? esc(m.name) : `<span lang="ko">${esc(m.shortTitle || m.title)}</span>`,
      mirror_kind: m.kind, mirror_body: m.body, page_foot: mirrorFoot(m),
      page_scripts: m.body.includes('data-copy-target=') ? '<script src="/js/copy.js" defer></script>\n' : ''};
    out[`${m.path.slice(1)}index.html`] = fill(rd('src/detail.html'), ctx, {...partials, head: fill(partials.head, ctx, {})});
  }
  // 사이트맵: 핵심 페이지 + 게임 + 허브 색인 + 허브 상세(모두 자기 canonical). 상세의 lastmod 는 글 날짜, 나머지는 데이터 스탬프.
  const urls = [['/', STAMP], ['/works/', STAMP], ['/factories/', STAMP], ['/career/', STAMP], ['/content/', STAMP], ['/game/', GAME_LASTMOD],
    ...model.pages.filter(p => p.path !== '/content/').map(p => [p.path, STAMP]), ...mirrorPages(data).map(m => [m.path, m.date || STAMP])];
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, d]) => `  <url><loc>${SITE}${p}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`;
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
