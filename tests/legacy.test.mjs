import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseProjects, pickFeatured} from '../scripts/lib/projects.mjs';
import {strengthCard, timelineItem, featuredProjectCard, projectKind} from '../scripts/lib/render.mjs';
import {icon, ICON_NAMES} from '../scripts/lib/icons.mjs';

const read = f => fs.readFileSync(f, 'utf8');
const count = (h, re) => (h.match(re) || []).length;
const projects = parseProjects(read('js/data.js'));
const profile = JSON.parse(read('data/profile.json'));
const strip = h => h.replace(/<script[\s\S]*?<\/script>/g, '');

test('홈: 강점 4·타임라인 4·대표 프로젝트 6, 섹션 순서와 번호', () => {
  const h = read('index.html');
  assert.equal(count(h, /class="fcard strength"/g), 4);
  assert.equal(count(h, /<li class="tl-item">/g), 4);
  assert.equal(count(h, /class="card fproj"/g), 6);
  const ids = ['top', 'strengths', 'services', 'factories', 'career-brief', 'collections', 'ai', 'contact'];
  const pos = ids.map(i => h.indexOf(`id="${i}"`)); assert.ok(pos.every(p => p > 0), 'all sections');
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  for (const [i, n] of ['01', '02', '03', '04', '05', '06'].entries())
    assert.ok(new RegExp(`<b>${n}</b> ${['Strengths', 'Services', 'Factories', 'Career &amp; Projects', 'Collections', 'AI'][i]}`).test(h), n);
  assert.match(h, /href="\/career\/"/); assert.ok(h.includes(`${projects.length}개`));
});
test('홈: 대표 프로젝트는 /career/#p<id> 로 연결되고 id 가 data.js 에 실존한다', () => {
  const h = read('index.html');
  for (const id of profile.featured_projects) {
    assert.ok(projects.some(p => p.id === id), `id ${id}`);
    assert.ok(h.includes(`href="/career/#p${id}"`), `link ${id}`);
  }
});
test('홈 AI 섹션은 운영 체계와 지표·기준일을 보존한다', () => {
  const h = read('index.html');
  assert.ok(h.includes('id="ai"'));
  for (const v of ['>9<', '>740+<', '>51+<', '>36K+<', '2026-09']) assert.ok(h.includes(v), v);
  for (const w of ['세션 검토', '하네스 구축', '실행', '다층 검증', '정리', '이월']) assert.ok(h.includes(w), w);
  assert.equal(count(h, /class="cap"/g), 6);
});
test('경력 페이지는 강점·전체 타임라인·그리드·모달·게임 모달을 가진다', () => {
  const h = read('career/index.html');
  for (const id of ['id="about"', 'id="career"', 'id="projects"', 'id="pgrid"', 'id="filters"', 'id="moreBtn"', 'id="modal"', 'id="modalContent"', 'id="gameModal"', 'onclick="openGame()"'])
    assert.ok(h.includes(id), id);
  assert.equal(count(h, /class="fcard strength"/g), 4); assert.equal(count(h, /<li class="tl-item">/g), 4);
  for (const s of ['/js/data.js', '/js/main.js', '/js/site-metrics.js']) assert.ok(h.includes(`src="${s}"`), s);
  assert.doesNotMatch(h, /TODO-in-task/);
});
test('모든 페이지 푸터에 연락처가 있다', () => {
  for (const f of ['index.html', 'works/index.html', 'factories/index.html', 'career/index.html']) {
    const h = read(f); assert.match(h, /k_star_w@naver\.com/, f); assert.match(h, /youtube\.com\/channel/, f);
  }
});
test('이관된 본문에 이모지·그래디언트·사라진 클래스가 없다', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  for (const f of ['index.html', 'career/index.html', 'src/sections/ai.html', 'src/career.html']) {
    const h = strip(read(f));
    assert.doesNotMatch(h.replace(/&#9733;/g, ''), emoji, f);
    assert.doesNotMatch(h, /btn-grad|grad-text|btn-blog|url\(#picg\)|linear-gradient/, f);
  }
  assert.doesNotMatch(read('js/main.js'), /#picg|linear-gradient/);
});
test('main.js 는 경력 요소가 없는 페이지에서 크래시하지 않도록 가드한다', () => {
  const js = read('js/main.js');
  assert.match(js, /getElementById\('pgrid'\)/); assert.match(js, /if\s*\(!grid\)/);
  assert.match(js, /if\s*\(!f\)/); assert.match(js, /id="p\$\{p\.id\}"/); assert.match(js, /hashchange/);
});
test('home/works/factories 는 data.js 를 불러오지 않는다', () => {
  for (const f of ['index.html', 'works/index.html', 'factories/index.html']) assert.doesNotMatch(read(f), /js\/data\.js/, f);
});
test('parseProjects / pickFeatured', () => {
  assert.equal(projects.length, 55);
  assert.throws(() => parseProjects('var x = 1'), /not found/);
  assert.throws(() => parseProjects('window.PROJECTS = [{bad}];'), /not valid JSON/);
  assert.deepEqual(pickFeatured([50, 46], projects).map(p => p.id), [50, 46]);
  assert.throws(() => pickFeatured([46, 9999], projects), /id 9999 not found/);
});
test('featuredProjectCard: 연도·회사·역할·이름·설명·칩 최대 4개·종류 아이콘·링크, 한/영 span', () => {
  const p = projects.find(x => x.id === 9);
  const h = featuredProjectCard(p);
  assert.match(h, /href="\/career\/#p9"/); assert.match(h, /2020 · <span data-lang-ko>에쿼티언<\/span><span data-lang-en>Equtian<\/span>/);
  assert.ok(h.includes('메인 개발, 개발팀장')); assert.ok(h.includes('Crypto Exchange (VentasBit)')); assert.ok(h.includes('Lead development of the exchange'));
  assert.equal(count(h, /class="chip mono"/g), 4); assert.ok(!h.includes('coin server'));
  assert.match(h, /<svg/);
});
test('projectKind 는 main.js projIcon 과 같은 키워드 규칙이다', () => {
  const k = (name, desc = '', stack = []) => projectKind({name, desc, stack});
  assert.equal(k('벤츠 Live TV'), 'car'); assert.equal(k('게임플랫폼'), 'gamepad'); assert.equal(k('코인거래소'), 'blocks');
  assert.equal(k('독거노인 국책'), 'landmark'); assert.equal(k('쇼핑몰', '', ['React']), 'globe'); assert.equal(k('zzz'), 'layers');
  for (const n of ['car', 'gamepad', 'credit-card', 'landmark', 'bar-chart', 'vr', 'blocks', 'users', 'smartphone', 'globe', 'layers']) assert.ok(ICON_NAMES.includes(n), n);
  for (const p of projects) assert.ok(ICON_NAMES.includes(projectKind(p)), p.name);
});
test('strengthCard / timelineItem 은 한/영 span 과 아이콘을 렌더한다', () => {
  const s = profile.strengths[0], t = profile.timeline[0];
  const sh = strengthCard(s); assert.match(sh, /<svg/); assert.match(sh, /data-lang-ko/); assert.match(sh, /data-lang-en/);
  const th = timelineItem(t); assert.ok(th.includes('2024 – Now')); assert.match(th, /오비고/); assert.match(th, /Obigo/);
});
test('profile 의 사실(회사·기간·수치)은 원문 그대로다', () => {
  assert.deepEqual(profile.timeline.map(t => t.period), ['2024 – Now', '2020 – 2023', '2017 – 2020', '2015 – 2016']);
  const all = JSON.stringify(profile);
  for (const f of ['특허 2종', 'WebRTC→Redis', 'ERC-20 토큰 6종', '50여 프로젝트', '3개년', '3회 이상', '단독개발 100%']) assert.ok(all.includes(f), f);
});
test('신규 아이콘이 유효하다', () => {
  for (const n of ['car', 'credit-card', 'landmark', 'vr', 'users', 'terminal', 'blocks', 'plug']) assert.match(icon(n), /<svg /);
});
