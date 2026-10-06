import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseProjects, pickFeatured} from '../scripts/lib/projects.mjs';
import {strengthItem, timelineItem, projectLine, attachProjects, projectKind} from '../scripts/lib/render.mjs';
import {icon, ICON_NAMES} from '../scripts/lib/icons.mjs';

const read = f => fs.readFileSync(f, 'utf8');
const count = (h, re) => (h.match(re) || []).length;
const projects = parseProjects(read('js/data.js'));
const profile = JSON.parse(read('data/profile.json'));
const strip = h => h.replace(/<script[\s\S]*?<\/script>/g, '');

test('홈: 강점 4·타임라인 4·대표 프로젝트 6, 이야기 순서(경력→개인 프로젝트[서비스→공장→산출물]→도구·원칙→연락)와 번호', () => {
  const h = read('index.html');
  assert.equal(count(h, /<li class="strength">/g), 4);
  assert.equal(count(h, /<li class="tl-item">/g), 4);
  assert.equal(count(h, /class="tl-proj"/g), 6);
  const ids = ['top', 'experience', 'projects', 'services', 'factories', 'works', 'ai', 'contact'];
  const pos = ids.map(i => h.indexOf(`id="${i}"`)); assert.ok(pos.every(p => p > 0), 'all sections');
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  for (const i of ids) assert.equal(count(h, new RegExp(`id="${i}"`, 'g')), 1, 'unique id ' + i);
  const labels = [['01', 'Experience'], ['02', 'Projects'], ['03', 'Tools']];
  const at = labels.map(([n, w]) => h.search(new RegExp(`<b>${n}</b> ${w}<`)));
  assert.ok(at.every(p => p > 0), 'section numbers 01–03');
  assert.deepEqual([...at].sort((a, b) => a - b), at, 'numbers in reading order');
  assert.equal(count(h, /<b>0\d<\/b>/g), 3, 'exactly three numbered sections');
  assert.doesNotMatch(h, /<b>04<\/b>|그래서, AI로 직접 만든다/);
  assert.match(h, /href="\/career\/"/); assert.ok(h.includes(`${projects.length}개`));
});
test('홈 02 개인 프로젝트: 한 섹션 안에 큰 서비스 카드 4 → 공장 전부 → 컬렉션 행 4 순서, 03 은 그 뒤', () => {
  const h = read('index.html');
  const start = h.indexOf('<section class="block story" id="projects">');
  const end = h.indexOf('</section>', start);
  assert.ok(start > 0 && end > start);
  const sec = h.slice(start, end);
  assert.match(sec, /<h2 class="sec-title"><span data-lang-ko>끊임없이 해온 개인 프로젝트, 이제는 AI와 함께<\/span>/);
  const facs = JSON.parse(read('data/factories.json'));
  const cols = JSON.parse(read('data/collections.json'));
  const feat = JSON.parse(read('data/services.json')).filter(s => s.featured);
  assert.equal(count(sec, /<article class="card svc-wide"/g), feat.length);
  assert.equal(count(sec, /<article class="fac"/g), facs.length);
  assert.equal(count(sec, /<li class="col-row">/g), cols.length);
  const order = ['02-1', 'class="card svc-wide"', '02-2', 'class="fac"', '02-3', 'class="col-row"'].map(m => sec.indexOf(m));
  assert.ok(order.every(p => p > 0), String(order));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(sec.lastIndexOf('class="card svc-wide"') < sec.indexOf('class="fac"'), 'all services before factories');
  assert.ok(sec.lastIndexOf('class="fac"') < sec.indexOf('class="col-row"'), 'all factories before collections');
  for (const s of feat) {
    const card = sec.slice(sec.indexOf(`id="svc-${s.id}"`)).split('</article>')[0];
    assert.match(card, /<img src="[^"]+" alt="[^"]+ screenshot"/, s.id);
    assert.match(card, new RegExp(`href="${s.url.replace(/[./]/g, '\\$&')}"[^>]*target="_blank" rel="noopener noreferrer"`), s.id);
    for (const t of s.ai_tools) assert.ok(card.includes(`>${t}<`), s.id + t);
  }
  for (const c of cols) assert.ok(sec.includes(c.count.as_of), c.id);
  assert.ok(h.indexOf('id="ai"') > end, '03 after 02');
  assert.equal(count(h, /<section class="block story"/g), 3, 'experience, projects, tools — three story sections');
});
test('홈 연결 문장: 01 은 개인 프로젝트로, 02 는 도구·원칙으로 넘긴다(옛 순서 문장 없음)', () => {
  const h = read('index.html');
  assert.ok(h.includes('현장 밖에서도 개인 프로젝트를 쉬지 않고 이어 왔고, 이제는 AI와 함께 합니다.'));
  assert.ok(h.includes('서비스를 크게 만드는 데서 그치지 않고, 반복되는 생산을 자동화하는 공장도 만들었습니다.'));
  assert.ok(h.includes('그 공장에서 웹게임, 웹 도구, 앱, 글 같은 크고 작은 산출물이 계속 만들어집니다.'));
  assert.ok(h.includes('<span data-lang-ko>일하는 도구와 원칙</span><span data-lang-en>Tools and principles I work by</span>'));
  for (const old of ['같은 순서가 계속 반복됐습니다', '경험에서 AI, 공장, 결과물까지', '그 결과물, 직접 운영 중']) assert.ok(!h.includes(old), old);
});
test('홈: 대표 프로젝트는 회사가 같은 타임라인 항목 안에 붙는다', () => {
  const h = read('index.html');
  const items = h.split('<li class="tl-item">').slice(1);
  assert.equal(items.length, profile.timeline.length);
  for (const id of profile.featured_projects) {
    const p = projects.find(x => x.id === id);
    const i = profile.timeline.findIndex(t => t.company.ko === p.company);
    assert.ok(i > -1 && items[i].includes(`href="/career/#p${id}"`), `project ${id} under ${p.company}`);
  }
  assert.throws(() => attachProjects(profile.timeline, [{id: 1, company: '없는회사'}]), /matches 0/);
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
  assert.equal(count(h, /<li class="strength">/g), 4); assert.equal(count(h, /<li class="tl-item">/g), 4);
  for (const s of ['/js/data.js', '/js/main.js', '/js/site-metrics.js']) assert.ok(h.includes(`src="${s}"`), s);
  assert.doesNotMatch(h, /TODO-in-task/);
});
test('모든 페이지 푸터에 연락처가 있다', () => {
  for (const f of ['index.html', 'works/index.html', 'factories/index.html', 'career/index.html']) {
    const h = read(f); assert.match(h, /k_star_w@naver\.com/, f); assert.doesNotMatch(h, /youtube\.com|linkedin\.com/i, f + ' 연락은 이메일만(SNS 링크 없음)');
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
test('projectLine: 종류 아이콘·이름·연도·역할·/career/#p 링크, 한/영 span (타임라인 안 한 줄)', () => {
  const p = projects.find(x => x.id === 9);
  const h = projectLine(p);
  assert.match(h, /href="\/career\/#p9"/); assert.match(h, /2020 · <span data-lang-ko>메인 개발, 개발팀장<\/span><span data-lang-en>Lead developer, dev lead<\/span>/);
  assert.ok(h.includes('<span data-lang-ko>코인거래소(벤타스비트)</span><span data-lang-en>Crypto Exchange (VentasBit)</span>'));
  assert.doesNotMatch(h, /class="chip/); assert.match(h, /<svg/);
});
test('projectKind 는 main.js projIcon 과 같은 키워드 규칙이다', () => {
  const k = (name, desc = '', stack = []) => projectKind({name, desc, stack});
  assert.equal(k('벤츠 Live TV'), 'car'); assert.equal(k('게임플랫폼'), 'gamepad'); assert.equal(k('코인거래소'), 'blocks');
  assert.equal(k('독거노인 국책'), 'landmark'); assert.equal(k('쇼핑몰', '', ['React']), 'globe'); assert.equal(k('zzz'), 'layers');
  for (const n of ['car', 'gamepad', 'credit-card', 'landmark', 'bar-chart', 'vr', 'blocks', 'users', 'smartphone', 'globe', 'layers']) assert.ok(ICON_NAMES.includes(n), n);
  for (const p of projects) assert.ok(ICON_NAMES.includes(projectKind(p)), p.name);
});
test('strengthItem / timelineItem 은 한/영 span 과 아이콘을 렌더한다', () => {
  const s = profile.strengths[0], t = profile.timeline[0];
  const sh = strengthItem(s); assert.match(sh, /<svg/); assert.match(sh, /data-lang-ko/); assert.match(sh, /data-lang-en/);
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
test('대표 프로젝트 역할은 한·영을 모두 가진다 (EN 모드에 한국어 역할 노출 금지)', () => {
  for (const p of projects) assert.ok(p.roleEn && !/[가-힣]/.test(p.roleEn), `roleEn ${p.id}`);
  const h = read('index.html');
  assert.ok(h.includes('<span class="tl-proj-meta mono">2026 · <span data-lang-ko>총괄 PM</span><span data-lang-en>Lead PM</span></span>'));
});
test('컬렉션 미리보기 링크는 EN 모드용 영어 제목을 가진다 (구 사이트 한·영 라벨 보존)', () => {
  const cols = JSON.parse(read('data/collections.json'));
  for (const c of cols) for (const p of c.previews || [])
    if (/[가-힣]/.test(typeof p.name === 'string' ? p.name : p.name.ko))
      assert.ok(typeof p.name === 'object' && p.name.en && !/[가-힣]/.test(p.name.en), `${c.id}: ${JSON.stringify(p.name)}`);
  assert.ok(read('index.html').includes('<span data-lang-en>Unit price comparison</span>'));
});
