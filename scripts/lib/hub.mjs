// scripts/lib/hub.mjs — 콘텐츠 허브(/content/) 색인 페이지 모델. data/content-hub.json → 페이지 목록.
// 한 페이지에 길게 나열하지 않는다: 랜딩(/content/) → 섹션 → 카테고리 → 페이지(20건) → 상세(/content/<종류>/…/).
// 색인·상세 모두 자기 자신이 canonical 이다.
import {icon} from './icons.mjs';
import {esc, bi, EXT, ext, open, asOf, HUB_SECTIONS, mirrorPath, crumbTrail} from './render.mjs';

export const PER_PAGE = 20;
export const SITE = 'https://kimjinwan.com';
const READ = {ko: '읽기', en: 'Read'};
const def = id => HUB_SECTIONS.find(s => s.id === id);
const PATH_NAME = {gamenews: 'game-news'};
export const secPath = id => `/content/${PATH_NAME[id] || id}/`;
export const pageHref = (base, n) => (n === 1 ? base : `${base}page/${n}/`);
const slugOf = url => url.split('/').filter(Boolean).pop();

// 섹션 순서 = 보조 내비 순서
export const NAV = [['blog', 'blog'], ['gamenews', 'gamenews'], ['gizmo', 'gizmo'], ['games', 'games'], ['tools', 'tools']];
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

// 한 목록(+ 쪽 나누기)을 페이지들로. wrap: 'list'(텍스트 행) | 'games' | 'tools'(이미지 카드 그리드)
function listPages({kind, base, tName, heading, lead, unit, order, items, rowOf, chips, trail, jsonOf, count, wrap = 'list', note = ''}) {
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
  <ul class="${wrap === 'list' ? 'hub-list' : `hub-grid hub-grid-${wrap}`}">${slice.map((it, i) => rowOf(it, i + (n - 1) * PER_PAGE)).join('\n')}</ul>
  ${note}
  ${pager(base, n, total)}`,
    });
  }
  return pages;
}

// 이미지 카드(웹게임·웹 도구). 카드 전체가 허브 상세로 가는 링크 하나다. 첫 줄 이미지는 지연 로딩하지 않는다.
const img = (kind, slug, rec, alt, i) => `<img src="/assets/content/${kind}/${slug}.webp" width="${rec.card[0]}" height="${rec.card[1]}" alt="${esc(alt)}"${i < 3 ? '' : ' loading="lazy"'}>`;
const chip = t => `<span class="chip" lang="ko">${esc(t)}</span>`;

export function hubModel(data) {
  const hub = data.contentHub, imgs = data.images;
  const blog = sec(hub, 'blog'), news = sec(hub, 'gamenews'), gizmo = sec(hub, 'gizmo'), games = sec(hub, 'games'), tools = sec(hub, 'tools');
  const pages = [];
  const textRows = (kind, pathOf) => it => row({meta: esc(it.date), title: it.title, body: it.summary, href: pathOf(it)});

  // ── 블로그(카테고리 칩 순서 = data 의 groups 순서 = BLOG_CATS) ──
  const trailBlog = [{label: bi(def('blog').title), href: secPath('blog'), name: '블로그'}];
  const posts = blog.groups.flatMap(g => g.items.map(it => ({...it, cat: g.id, slug: slugOf(it.url)}))).sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
  const blogRow = textRows('blog', it => mirrorPath('blog', `${it.cat}/${it.slug}`));
  const blogChips = on => chipBar('blog categories', [{href: secPath('blog'), label: {ko: '전체', en: 'All'}, n: blog.count.value, on: on === 'all'},
    ...blog.groups.map(g => ({href: `/content/blog/${g.id}/`, label: g.label, n: g.total, on: on === g.id}))]);
  const jsonPost = it => ({name: it.title, url: SITE + mirrorPath('blog', `${it.cat}/${it.slug}`)});
  pages.push(...listPages({kind: 'blog', base: secPath('blog'), tName: {ko: '블로그 글 전체', en: 'All journal posts'}, heading: def('blog').title, lead: def('blog').intro, unit: {ko: '편'}, order: {ko: '최신순'},
    items: posts, rowOf: blogRow, chips: blogChips('all'), trail: trailBlog, jsonOf: jsonPost, count: blog.count}));
  for (const g of blog.groups)
    pages.push(...listPages({kind: 'blog', base: `/content/blog/${g.id}/`, tName: {ko: `블로그 · ${g.label.ko}`, en: `Journal · ${g.label.en}`}, heading: g.label, lead: g.blurb, unit: {ko: '편'}, order: {ko: '최신순'},
      items: posts.filter(p => p.cat === g.id), rowOf: blogRow, chips: blogChips(g.id), trail: [...trailBlog, {label: bi(g.label), href: `/content/blog/${g.id}/`, name: g.label.ko}], jsonOf: jsonPost, count: blog.count}));

  // ── 게임 소식(게임별 서브카테고리) ──
  const trailNews = [{label: bi(def('gamenews').title), href: secPath('gamenews'), name: '게임 소식'}];
  const nposts = news.groups.flatMap(g => g.items.map(it => ({...it, game: g.id, slug: slugOf(it.url)}))).sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
  const newsRow = textRows('news', it => mirrorPath('game-news', it.slug));
  const newsChips = on => chipBar('game news games', [{href: secPath('gamenews'), label: {ko: '전체', en: 'All'}, n: news.count.value, on: on === 'all'},
    ...news.groups.map(g => ({href: `/content/game-news/${g.id}/`, label: g.label, n: g.total, on: on === g.id}))]);
  const jsonNews = it => ({name: it.title, url: SITE + mirrorPath('game-news', it.slug)});
  pages.push(...listPages({kind: 'gamenews', base: secPath('gamenews'), tName: {ko: '게임 소식 전체', en: 'All game news'}, heading: def('gamenews').title, lead: def('gamenews').intro, unit: {ko: '편'}, order: {ko: '최신순'},
    items: nposts, rowOf: newsRow, chips: newsChips('all'), trail: trailNews, jsonOf: jsonNews, count: news.count}));
  for (const g of news.groups)
    pages.push(...listPages({kind: 'gamenews', base: `/content/game-news/${g.id}/`, tName: {ko: `게임 소식 · ${g.label.ko}`, en: `Game news · ${g.label.en}`}, heading: g.label, lead: def('gamenews').intro, unit: {ko: '편'}, order: {ko: '최신순'},
      items: nposts.filter(p => p.game === g.id), rowOf: newsRow, chips: newsChips(g.id), trail: [...trailNews, {label: bi(g.label), href: `/content/game-news/${g.id}/`, name: g.label.ko}], jsonOf: jsonNews, count: news.count}));

  // ── AI 활용 가이드(기즈모 스토어 항목) ──
  const trailGizmo = [{label: bi(def('gizmo').title), href: secPath('gizmo'), name: 'AI 활용 가이드'}];
  const gitems = gizmo.groups.flatMap(g => g.items.map(it => ({...it, purpose: g.id, slug: slugOf(it.url)})));
  const gRow = it => row({title: it.title, body: it.summary || it.tagline, href: mirrorPath('gizmo', it.slug)});
  const gChips = on => chipBar('guide purposes', [{href: secPath('gizmo'), label: {ko: '전체', en: 'All'}, n: gizmo.count.value, on: on === 'all'},
    ...gizmo.groups.map(g => ({href: `/content/gizmo/purpose/${g.id}/`, label: g.label, n: g.items.length, on: on === g.id}))]);
  const jsonG = it => ({name: it.title, url: SITE + mirrorPath('gizmo', it.slug)});
  pages.push(...listPages({kind: 'gizmo', base: secPath('gizmo'), tName: {ko: 'AI 활용 가이드 전체', en: 'All AI usage guides'}, heading: def('gizmo').title, lead: def('gizmo').intro, unit: {ko: '개'}, order: {ko: '용도순'},
    items: gitems, rowOf: gRow, chips: gChips('all'), trail: trailGizmo, jsonOf: jsonG, count: gizmo.count}));
  for (const g of gizmo.groups)
    pages.push(...listPages({kind: 'gizmo', base: `/content/gizmo/purpose/${g.id}/`, tName: {ko: `AI 활용 가이드 · ${g.label.ko}`, en: `AI usage guides · ${g.label.en}`}, heading: g.label, lead: def('gizmo').intro, unit: {ko: '개'}, order: {ko: '이름순'},
      items: gitems.filter(i => i.purpose === g.id), rowOf: gRow, chips: gChips(g.id), trail: [...trailGizmo, {label: bi(g.label), href: `/content/gizmo/purpose/${g.id}/`, name: g.label.ko}], jsonOf: jsonG, count: gizmo.count}));

  // ── 웹게임: 큰 썸네일 카드 그리드 + 장르 칩 ──
  const trailGames = [{label: bi(def('games').title), href: secPath('games'), name: '웹게임'}];
  const gm = games.groups.flatMap(g => g.items.map(it => ({...it, genre: g.id, genreLabel: g.label})));
  const gameCard = (it, i) => `<li class="gcard"><a href="${mirrorPath('games', it.slug)}">${img('games', it.slug, imgs.games[it.slug], `${it.title.ko} 게임 화면`, i)}<span class="gcard-b"><strong class="gcard-t">${bi(it.title)}</strong><span class="gcard-s" lang="ko">${esc(it.summary)}</span><span class="gcard-c">${bi(it.genreLabel).replace(/^/, '<span class="chip">') + '</span>'}${it.session ? chip(it.session) : ''}${it.controls.length ? chip(it.controls.join('·')) : ''}</span></span></a></li>`;
  const gmChips = on => chipBar('game genres', [{href: secPath('games'), label: {ko: '전체', en: 'All'}, n: games.count.value, on: on === 'all'},
    ...games.groups.map(g => ({href: `/content/games/genre/${g.id}/`, label: g.label, n: g.items.length, on: on === g.id}))]);
  const jsonGm = it => ({name: it.title.ko, url: SITE + mirrorPath('games', it.slug)});
  const gmNote = {ko: `웹게임 ${games.count.total}개 중 소개글에 쓸 사실이 확인되는 ${games.count.value}개를 실었습니다.`, en: `${games.count.value} of ${games.count.total} web games are listed here, those with enough verified facts for a write-up.`};
  const noteHtml = n => `<p class="hub-note">${bi(n)}</p>`;
  pages.push(...listPages({kind: 'games', base: secPath('games'), tName: {ko: '웹게임 전체', en: 'All web games'}, heading: def('games').title, lead: def('games').intro, unit: {ko: '개'}, order: {ko: '이름순'},
    items: [...gm].sort((a, b) => a.slug.localeCompare(b.slug)), rowOf: gameCard, chips: gmChips('all'), trail: trailGames, jsonOf: jsonGm, count: games.count, wrap: 'games', note: noteHtml(gmNote)}));
  for (const g of games.groups)
    pages.push(...listPages({kind: 'games', base: `/content/games/genre/${g.id}/`, tName: {ko: `웹게임 · ${g.label.ko}`, en: `Web games · ${g.label.en}`}, heading: g.label, lead: def('games').intro, unit: {ko: '개'}, order: {ko: '이름순'},
      items: gm.filter(i => i.genre === g.id).sort((a, b) => a.slug.localeCompare(b.slug)), rowOf: gameCard, chips: gmChips(g.id), trail: [...trailGames, {label: bi(g.label), href: `/content/games/genre/${g.id}/`, name: g.label.ko}], jsonOf: jsonGm, count: games.count, wrap: 'games', note: noteHtml(gmNote)}));

  // ── 웹 도구: 조밀한 4열 그리드 + 분류 칩 ──
  const trailTools = [{label: bi(def('tools').title), href: secPath('tools'), name: '웹 도구'}];
  const tl = tools.groups.flatMap(g => g.items.map(it => ({...it, cat: g.id, catLabel: g.label})));
  const toolCard = (it, i) => `<li class="tcard"><a href="${mirrorPath('tools', it.slug)}">${img('tools', it.slug, imgs.tools[it.slug], `${it.title} 화면`, i)}<span class="tcard-b"><strong class="tcard-t" lang="ko">${esc(it.title)}</strong><span class="tcard-s" lang="ko">${esc(it.summary)}</span></span></a></li>`;
  const tlChips = on => chipBar('tool categories', [{href: secPath('tools'), label: {ko: '전체', en: 'All'}, n: tools.count.value, on: on === 'all'},
    ...tools.groups.map(g => ({href: `/content/tools/category/${g.id}/`, label: g.label, n: g.items.length, on: on === g.id}))]);
  const jsonTl = it => ({name: it.title, url: SITE + mirrorPath('tools', it.slug)});
  const tlNote = {ko: `웹 도구 ${tools.count.total}개 중 소개글에 쓸 사실이 확인되는 ${tools.count.value}개를 실었습니다.`, en: `${tools.count.value} of ${tools.count.total} web tools are listed here, those with enough verified facts for a write-up.`};
  pages.push(...listPages({kind: 'tools', base: secPath('tools'), tName: {ko: '웹 도구 전체', en: 'All web tools'}, heading: def('tools').title, lead: def('tools').intro, unit: {ko: '개'}, order: {ko: '이름순'},
    items: [...tl].sort((a, b) => a.slug.localeCompare(b.slug)), rowOf: toolCard, chips: tlChips('all'), trail: trailTools, jsonOf: jsonTl, count: tools.count, wrap: 'tools', note: noteHtml(tlNote)}));
  for (const g of tools.groups)
    pages.push(...listPages({kind: 'tools', base: `/content/tools/category/${g.id}/`, tName: {ko: `웹 도구 · ${g.label.ko}`, en: `Web tools · ${g.label.en}`}, heading: g.label, lead: def('tools').intro, unit: {ko: '개'}, order: {ko: '이름순'},
      items: tl.filter(i => i.cat === g.id).sort((a, b) => a.slug.localeCompare(b.slug)), rowOf: toolCard, chips: tlChips(g.id), trail: [...trailTools, {label: bi(g.label), href: `/content/tools/category/${g.id}/`, name: g.label.ko}], jsonOf: jsonTl, count: tools.count, wrap: 'tools', note: noteHtml(tlNote)}));

  return {pages, posts, nposts, gitems, gm, tl};
}

// 상세 페이지의 상위 경로(브레드크럼 중간 단계). m.crumbs 로 쓴다.
export function mirrorTrail(data, kind, catKey) {
  const hub = data.contentHub, g = id => sec(hub, id).groups.find(x => x.id === catKey);
  const top = (id, name) => ({label: bi(def(id).title), href: secPath(id), name});
  if (kind === 'blog') return [top('blog', '블로그'), {label: bi(g('blog').label), href: `/content/blog/${catKey}/`, name: g('blog').label.ko}];
  if (kind === 'gamenews') return [top('gamenews', '게임 소식'), {label: bi(g('gamenews').label), href: `/content/game-news/${catKey}/`, name: g('gamenews').label.ko}];
  if (kind === 'gizmo') return [top('gizmo', 'AI 활용 가이드'), {label: bi(g('gizmo').label), href: `/content/gizmo/purpose/${catKey}/`, name: g('gizmo').label.ko}];
  if (kind === 'games') return [top('games', '웹게임'), {label: bi(g('games').label), href: `/content/games/genre/${catKey}/`, name: g('games').label.ko}];
  if (kind === 'tools') return [top('tools', '웹 도구'), {label: bi(g('tools').label), href: `/content/tools/category/${catKey}/`, name: g('tools').label.ko}];
  throw new Error(`mirrorTrail: unknown kind ${kind}`);
}

// 랜딩(/content/): 섹션 카드, 항목은 대표 3건만.
export function landingHtml(data, model) {
  const hub = data.contentHub;
  const unitOf = id => (id === 'blog' || id === 'gamenews' ? '편' : '개');
  const card = (id, items, blurb) => {
    const s = sec(hub, id), d = def(id);
    return `<article class="card hub-card">
    <h2>${icon(d.icon, {size: 20})}<span>${bi(d.title)}</span></h2>
    <p class="hub-count mono">${icon('clock', {size: 13})}<span>${bi({ko: `${s.count.value}${unitOf(id)}`, en: `${s.count.value}`})}</span> · ${bi(asOf)} ${esc(s.count.as_of)}</p>
    <p class="hub-blurb">${bi(blurb)}</p>
    <ul class="hub-prev">${items.slice(0, 3).map(i => `<li>${i}</li>`).join('')}</ul>
    <a class="more" href="${secPath(id)}">${bi({ko: '전체 보기', en: 'See all'})}${ext}</a>
  </article>`;
  };
  const loc = (href, text) => `<a href="${esc(href)}" lang="ko">${esc(text)}</a>`;
  return `<div class="hub-cards">
  ${card('blog', model.posts.map(p => loc(mirrorPath('blog', `${p.cat}/${p.slug}`), p.title)), {ko: '에이전트 업무일지, 앱 제작·심사 기록, 짧은 이야기. 최신 글부터 보여 줍니다.', en: 'Agent work logs, app production and review records and short essays, newest first.'})}
  ${card('gamenews', model.nposts.map(p => loc(mirrorPath('game-news', p.slug), p.title)), {ko: '즐기는 게임의 공식 공지·업데이트·공략 정리와 내 게임 개발기. 게임별로 골라 볼 수 있습니다.', en: 'Official notices, updates and guides for the games I play, plus my own game devlogs, by game.'})}
  ${card('gizmo', model.gitems.map(i => loc(mirrorPath('gizmo', i.slug), i.title)), {ko: '설치 없이 쓰는 프롬프트·스킬. 용도별로 묶었고 전문을 읽을 수 있습니다.', en: 'Prompts and skills you can use without installing anything, grouped by purpose, with the full text.'})}
  ${card('games', model.gm.map(i => `<a href="${mirrorPath('games', i.slug)}">${bi(i.title)}</a>`), {ko: '브라우저에서 바로 하는 게임. 소개와 조작 방법, 규칙, 플레이 화면을 실었습니다.', en: 'Browser games with an introduction, controls, rules and gameplay screens.'})}
  ${card('tools', model.tl.map(i => loc(mirrorPath('tools', i.slug), i.title)), {ko: '브라우저에서 쓰는 계산기와 변환기. 쓰는 방법과 알아둘 한계를 화면과 함께 적었습니다.', en: 'Calculators and converters for the browser, with usage steps, limits and a screen capture.'})}
</div>`;
}
