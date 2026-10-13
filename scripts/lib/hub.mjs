// scripts/lib/hub.mjs — 콘텐츠 허브(/content/) 색인 페이지 모델. data/content-hub.json → 페이지 목록.
// 한 페이지에 길게 나열하지 않는다: 랜딩(/content/) → 섹션 → 카테고리 → 페이지(20건) → 상세(/content/<종류>/…/).
// 색인·상세 모두 자기 자신이 canonical 이다.
import {icon} from './icons.mjs';
import {esc, bi, EXT, ext, open, asOf, HUB_SECTIONS, mirrorPath, crumbTrail} from './render.mjs';

export const PER_PAGE = 20;
export const SITE = 'https://kimjinwan.com';
const READ = {ko: '읽기', en: 'Read'};
const def = id => HUB_SECTIONS.find(s => s.id === id);
export const secPath = id => `/content/${id}/`;
export const pageHref = (base, n) => (n === 1 ? base : `${base}page/${n}/`);
const slugOf = url => url.split('/').filter(Boolean).pop();

// 섹션 순서 = 보조 내비 순서
export const NAV = [['blog', 'blog'], ['gizmo', 'gizmo'], ['games', 'games'], ['tools', 'tools']];
const sec = (hub, id) => hub.sections.find(s => s.id === id);

// 보조 내비(콘텐츠 영역 전용). 모바일에서는 CSS 가 가로 스크롤 칩으로 만든다.
export function contentNav(active, hub) {
  const items = [{href: '/content/', label: {ko: '전체', en: 'All'}, n: null, on: active === 'all'},
    ...NAV.map(([id]) => ({href: secPath(id), label: def(id).title, n: sec(hub, id).count.value, on: active === id}))];
  return `<nav class="subnav" aria-label="content sections"><ul>${items.map(i => `<li><a href="${i.href}"${i.on ? ' aria-current="page"' : ''}>${bi(i.label)}${i.n != null ? `<span class="subnav-n mono">${i.n}</span>` : ''}</a></li>`).join('')}</ul></nav>`;
}
function chipBar(label, items) {
  return `<nav class="chipbar" aria-label="${esc(label)}"><ul>${items.map(i => `<li><a href="${i.href}"${i.on ? ' aria-current="page"' : ''}>${bi(i.label)}<span class="subnav-n mono">${i.n}</span></a></li>`).join('')}</ul></nav>`;
}
function pager(base, page, total) {
  if (total < 2) return '';
  const nums = [...new Set([1, total, page - 1, page, page + 1].filter(n => n >= 1 && n <= total))].sort((a, b) => a - b);
  const parts = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) parts.push('<li class="gap" aria-hidden="true">…</li>');
    parts.push(n === page ? `<li><a class="on" aria-current="page" aria-label="page ${n}" href="${pageHref(base, n)}">${n}</a></li>` : `<li><a aria-label="page ${n}" href="${pageHref(base, n)}">${n}</a></li>`);
  });
  const step = (n, rel, label) => n >= 1 && n <= total ? `<li><a class="step" aria-label="${rel}" href="${pageHref(base, n)}">${bi(label)}</a></li>` : `<li><span class="step off" aria-hidden="true">${bi(label)}</span></li>`;
  return `<nav class="pager" aria-label="pagination"><ul>${step(page - 1, 'prev', {ko: '이전', en: 'Prev'})}${parts.join('')}${step(page + 1, 'next', {ko: '다음', en: 'Next'})}</ul></nav>`;
}
const row = ({meta = '', title, titleHtml, body, bodyHtml, href, external = false, cta}) => `<li class="hub-row">${meta ? `<span class="hub-meta mono">${meta}</span>` : ''}<a class="hub-rt" href="${esc(href)}"${external ? ` ${EXT}` : ''}${titleHtml ? '' : ' lang="ko"'}>${titleHtml || esc(title)}${external ? ext : ''}</a><p class="hub-sum"${bodyHtml ? '' : ' lang="ko"'}>${bodyHtml || esc(body)}</p></li>`;
const countLine = (c, label) => `<p class="hub-count mono">${icon('clock', {size: 13})}${bi(label)} · ${bi(asOf)} ${esc(c.as_of)}</p>`;

// 한 목록(+ 쪽 나누기)을 페이지들로.
function listPages({kind, base, tName, heading, lead, unit, order, items, rowOf, chips, trail, jsonOf, hub, count}) {
  const total = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pages = [];
  for (let n = 1; n <= total; n++) {
    const slice = items.slice((n - 1) * PER_PAGE, n * PER_PAGE);
    const range = items.length ? `${(n - 1) * PER_PAGE + 1}–${(n - 1) * PER_PAGE + slice.length}` : '0';
    const path = pageHref(base, n);
    const crumbs = n === 1 ? trail : trail.map((t, i) => (i === trail.length - 1 ? {...t, href: base} : t)).concat([{label: bi({ko: `${n}쪽`, en: `Page ${n}`}), name: `${n}쪽`}]);
    pages.push({
      kind, path, canonical: SITE + path, crumbs,
      title: `${tName.ko} — 콘텐츠 허브 · 김진완${n > 1 ? ` (${n}쪽)` : ''}`,
      description: `${tName.ko} ${items.length}${unit.ko}의 제목과 요약을 ${order.ko}으로 훑어보고 전문을 바로 읽어 보세요.${total > 1 ? ` ${n}/${total}쪽.` : ''}`,
      prev: n > 1 ? SITE + pageHref(base, n - 1) : null, next: n < total ? SITE + pageHref(base, n + 1) : null,
      jsonName: `${tName.ko}${n > 1 ? ` ${n}쪽` : ''}`, jsonItems: slice.map(jsonOf),
      body: `<div class="sec-head hub-head"><div class="sec-no">${icon(def(kind).icon, {size: 16})}<b>Content</b></div>
    <h1 class="sec-title">${bi(heading)}</h1>
    ${lead ? `<p class="sec-sub">${bi(lead)}</p>` : ''}</div>
  ${chips || ''}
  ${countLine(count, {ko: `${tName.ko} ${items.length}${unit.ko} 중 ${range}번째`, en: `${tName.en}: ${range} of ${items.length}`})}
  <ul class="hub-list">${slice.map(rowOf).join('\n')}</ul>
  ${pager(base, n, total)}`,
    });
  }
  return pages;
}

export function hubModel(data) {
  const hub = data.contentHub;
  const blog = sec(hub, 'blog'), gizmo = sec(hub, 'gizmo'), games = sec(hub, 'games'), tools = sec(hub, 'tools');
  const pages = [];

  // ── 블로그 ──
  const trailBlog = [{label: bi(def('blog').title), href: secPath('blog'), name: '블로그'}];
  const posts = blog.groups.flatMap(g => g.items.map(it => ({...it, cat: g.id, slug: slugOf(it.url)})))
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
  const blogRow = it => row({meta: esc(it.date), title: it.title, body: it.summary, href: mirrorPath('blog', `${it.cat}/${it.slug}`)});
  const blogChips = on => chipBar('blog categories', [{href: secPath('blog'), label: {ko: '전체', en: 'All'}, n: blog.count.value, on: on === 'all'},
    ...blog.groups.map(g => ({href: `/content/blog/${g.id}/`, label: g.label, n: g.total, on: on === g.id}))]);
  const jsonPost = it => ({name: it.title, url: it.url});
  pages.push(...listPages({kind: 'blog', base: secPath('blog'), tName: {ko: '블로그 글 전체', en: 'All journal posts'}, heading: def('blog').title, lead: def('blog').intro, unit: {ko: '편'}, order: {ko: '최신순'},
    items: posts, rowOf: blogRow, chips: blogChips('all'), trail: trailBlog, jsonOf: jsonPost, count: blog.count}));
  for (const g of blog.groups) {
    const items = posts.filter(p => p.cat === g.id);
    pages.push(...listPages({kind: 'blog', base: `/content/blog/${g.id}/`, tName: {ko: `블로그 · ${g.label.ko}`, en: `Journal · ${g.label.en}`}, heading: g.label, lead: g.blurb, unit: {ko: '편'}, order: {ko: '최신순'},
      items, rowOf: blogRow, chips: blogChips(g.id), trail: [...trailBlog, {label: bi(g.label), href: `/content/blog/${g.id}/`, name: g.label.ko}], jsonOf: jsonPost, count: blog.count}));
  }

  // ── AI 활용 가이드(기즈모 스토어 항목) ──
  const trailGizmo = [{label: bi(def('gizmo').title), href: secPath('gizmo'), name: 'AI 활용 가이드'}];
  const gitems = gizmo.groups.flatMap(g => g.items.map(it => ({...it, purpose: g.id, slug: slugOf(it.url)})));
  const gRow = it => row({title: it.title, body: it.tagline, href: mirrorPath('gizmo', it.slug)});
  const gChips = on => chipBar('guide purposes', [{href: secPath('gizmo'), label: {ko: '전체', en: 'All'}, n: gizmo.count.value, on: on === 'all'},
    ...gizmo.groups.map(g => ({href: `/content/gizmo/purpose/${g.id}/`, label: g.label, n: g.items.length, on: on === g.id}))]);
  const jsonG = it => ({name: it.title, url: it.url});
  pages.push(...listPages({kind: 'gizmo', base: secPath('gizmo'), tName: {ko: 'AI 활용 가이드 전체', en: 'All AI usage guides'}, heading: def('gizmo').title, lead: def('gizmo').intro, unit: {ko: '개'}, order: {ko: '용도순'},
    items: gitems, rowOf: gRow, chips: gChips('all'), trail: trailGizmo, jsonOf: jsonG, count: gizmo.count}));
  for (const g of gizmo.groups)
    pages.push(...listPages({kind: 'gizmo', base: `/content/gizmo/purpose/${g.id}/`, tName: {ko: `AI 활용 가이드 · ${g.label.ko}`, en: `AI usage guides · ${g.label.en}`}, heading: g.label, lead: def('gizmo').intro, unit: {ko: '개'}, order: {ko: '이름순'},
      items: gitems.filter(i => i.purpose === g.id), rowOf: gRow, chips: gChips(g.id), trail: [...trailGizmo, {label: bi(g.label), href: `/content/gizmo/purpose/${g.id}/`, name: g.label.ko}], jsonOf: jsonG, count: gizmo.count}));

  // ── 웹게임 · 웹 도구(대표 항목만 — 원본 저장소의 일부) ──
  const featureList = (kind, s, name, rowOf, jsonOf, note) => listPages({kind, base: secPath(kind), tName: {ko: `${name.ko} 대표 작품`, en: `${name.en}: selected`}, heading: def(kind).title, lead: def(kind).intro, unit: {ko: '개'}, order: {ko: '기준일 선별'},
    items: s.items, rowOf, chips: '', trail: [{label: bi(def(kind).title), href: secPath(kind), name: name.ko}], jsonOf, count: {...s.count}})
    .map(p => ({...p, body: p.body.replace('</ul>', `</ul>\n  <p class="hub-note">${bi(note)}</p>\n  <p class="more-line"><a class="more" href="${esc(s.url)}" ${EXT}>${bi({ko: `${name.ko} 전체 보기`, en: `All ${name.en}`})}${ext}</a></p>`)}));
  pages.push(...featureList('games', games, {ko: '웹게임', en: 'Web games'},
    it => row({titleHtml: bi(it.title), body: it.summary, href: it.url, external: true}), it => ({name: it.title.ko, url: it.url}),
    {ko: `전체 ${games.count.value}개 중 대표 ${games.items.length}개만 실었습니다. 나머지는 웹게임 사이트에서 볼 수 있습니다.`, en: `Only ${games.items.length} of ${games.count.value} games are listed here; the rest are on the web games site.`}));
  pages.push(...featureList('tools', tools, {ko: '웹 도구', en: 'Web tools'},
    it => row({meta: esc(it.category), title: it.title, body: it.summary, href: it.url, external: true}), it => ({name: it.title, url: it.url}),
    {ko: `전체 ${tools.count.value}개 중 분류별 대표 ${tools.items.length}개만 실었습니다. 나머지는 웹 도구 사이트에서 볼 수 있습니다.`, en: `Only ${tools.items.length} of ${tools.count.value} tools are listed here; the rest are on the web tools site.`}));

  return {pages, posts, gitems};
}

// 상세 페이지의 상위 경로(브레드크럼 중간 단계). m.crumbs 로 쓴다.
export function mirrorTrail(data, kind, catKey) {
  const hub = data.contentHub;
  if (kind === 'blog') { const g = sec(hub, 'blog').groups.find(x => x.id === catKey); return [{label: bi(def('blog').title), href: secPath('blog'), name: '블로그'}, {label: bi(g.label), href: `/content/blog/${catKey}/`, name: g.label.ko}]; }
  if (kind === 'gizmo') { const g = sec(hub, 'gizmo').groups.find(x => x.id === catKey); return [{label: bi(def('gizmo').title), href: secPath('gizmo'), name: 'AI 활용 가이드'}, {label: bi(g.label), href: `/content/gizmo/purpose/${catKey}/`, name: g.label.ko}]; }
  throw new Error(`mirrorTrail: unknown kind ${kind}`);
}

// 랜딩(/content/): 섹션 카드 5장, 항목은 대표 3건만.
export function landingHtml(data, model) {
  const hub = data.contentHub;
  const card = (id, items, blurb) => {
    const s = sec(hub, id), d = def(id);
    return `<article class="card hub-card">
    <h2>${icon(d.icon, {size: 20})}<span>${bi(d.title)}</span></h2>
    <p class="hub-count mono">${icon('clock', {size: 13})}<span>${bi({ko: `${s.count.value}${id === 'blog' ? '편' : '개'}`, en: `${s.count.value}`})}</span> · ${bi(asOf)} ${esc(s.count.as_of)}</p>
    <p class="hub-blurb">${bi(blurb)}</p>
    <ul class="hub-prev">${items.slice(0, 3).map(i => `<li>${i.html}</li>`).join('')}</ul>
    <a class="more" href="${secPath(id)}">${bi({ko: '전체 보기', en: 'See all'})}${ext}</a>
  </article>`;
  };
  const loc = (href, text, external) => `<a href="${esc(href)}"${external ? ` ${EXT}` : ''} lang="ko">${esc(text)}</a>`;
  return `<div class="hub-cards">
  ${card('blog', model.posts.map(p => ({html: loc(mirrorPath('blog', `${p.cat}/${p.slug}`), p.title)})), {ko: 'AI 사용기, 앱 제작·심사, 게임 소식과 짧은 글. 최신 글부터 보여 줍니다.', en: 'AI field notes, app production and review, game updates and short essays, newest first.'})}
  ${card('gizmo', model.gitems.map(i => ({html: loc(mirrorPath('gizmo', i.slug), i.title)})), {ko: '설치 없이 쓰는 프롬프트·스킬. 용도별로 묶었고 전문을 읽을 수 있습니다.', en: 'Prompts and skills you can use without installing anything, grouped by purpose, with the full text.'})}
  ${card('games', sec(hub, 'games').items.map(i => ({html: `<a href="${esc(i.url)}" ${EXT}>${bi(i.title)}</a>`})), {ko: '브라우저에서 바로 하는 게임 가운데 대표 작품.', en: 'Selected browser games.'})}
  ${card('tools', sec(hub, 'tools').items.map(i => ({html: loc(i.url, i.title, true)})), {ko: '브라우저에서 쓰는 계산기와 변환기 가운데 대표 도구.', en: 'Selected calculators and converters.'})}
</div>`;
}
