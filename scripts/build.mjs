// scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './lib/validate.mjs';
import {fill} from './lib/template.mjs';
import {serviceCard, collectionCard, factoryCard, heroStats, bi, esc} from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(rd(p));

export function loadData() {
  return {services: json('data/services.json'), collections: json('data/collections.json'), factories: json('data/factories.json')};
}

const SITE = 'https://kimjinwan.com';
const PAGES = [
  {src: 'src/home.html', out: 'index.html', path: '/',
    title: '김진완 — AI로 서비스를 만들고 직접 운영합니다',
    description: '소프트웨어 PM 김진완이 AI 공장·파이프라인으로 만들어 운영하는 서비스, 웹게임, 웹 도구, 블로그와 경력.'},
  {src: 'src/works.html', out: 'works/index.html', path: '/works/',
    title: '작업물 — 김진완', description: 'AI로 만들고 운영하는 서비스·웹게임·웹 도구·앱·블로그 전체 목록.'},
  {src: 'src/factories.html', out: 'factories/index.html', path: '/factories/',
    title: 'AI 공장 — 김진완', description: '앱·게임·콘텐츠를 양산하는 AI 공장과 파이프라인의 단계, 자동화 범위, 사람이 하는 일.'},
  {src: 'src/career.html', out: 'career/index.html', path: '/career/',
    title: '경력 — 김진완', description: '11년 경력과 수행 프로젝트 55개: 차량 SW PM, 풀스택 개발, 팀 리딩.'},
];

function schemaFor(page) {
  const g = [
    {'@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: '김진완 포트폴리오', alternateName: 'Kim Jinwan', inLanguage: ['ko', 'en'], publisher: {'@id': `${SITE}/#person`}},
    {'@type': 'Person', '@id': `${SITE}/#person`, name: '김진완', alternateName: 'Kein', url: `${SITE}/`, jobTitle: 'Software Product Manager'},
  ];
  if (page.path === '/') g.push({'@type': 'ProfilePage', '@id': `${SITE}/#profile`, url: `${SITE}/`, name: page.title, dateModified: new Date().toISOString().slice(0, 10), mainEntity: {'@id': `${SITE}/#person`}, isPartOf: {'@id': `${SITE}/#website`}, relatedLink: 'https://blog.kimjinwan.com/'});
  return `<script type="application/ld+json">${JSON.stringify({'@context': 'https://schema.org', '@graph': g})}</script>`;
}

export function buildAll({write = true} = {}) {
  const data = loadData();
  const errors = validate(data);
  if (errors.length) throw new Error('data validation failed:\n' + errors.join('\n'));

  const byId = new Map(data.services.map(s => [s.id, s]));
  const version = rd('VERSION').trim();
  const partials = {head: rd('src/partials/head.html'), nav: rd('src/partials/nav.html'), footer: rd('src/partials/footer.html'),
    ai: rd('src/sections/ai.html')};
  const featured = data.services.filter(s => s.featured);
  const ctxBase = {
    version,
    hero_stats: heroStats(data),
    featured: featured.map(serviceCard).join('\n'),
    all_services: data.services.map(serviceCard).join('\n'),
    collections: data.collections.map(collectionCard).join('\n'),
    factories: data.factories.map(f => factoryCard(f, byId)).join('\n'),
    factories_teaser: data.factories.map(f => `<li><a href="/factories/#${esc(f.id)}">${bi(f.name)}</a> — ${bi(f.role)}</li>`).join(''),
    updated: new Date().toISOString().slice(0, 10),
  };
  const out = {};
  for (const page of PAGES) {
    const ctx = {...ctxBase, title: esc(page.title), description: esc(page.description), canonical: `${SITE}${page.path}`, schema: schemaFor(page)};
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
