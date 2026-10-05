// tests/factories.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const h = () => fs.readFileSync('factories/index.html', 'utf8');
const data = () => JSON.parse(fs.readFileSync('data/factories.json', 'utf8'));
test('모든 공장이 앵커 id 와 함께 렌더된다', () => { for (const f of data()) assert.ok(h().includes(`id="${f.id}"`), f.id); });
test('상단 앵커 내비게이션이 공장마다 있다', () => { for (const f of data()) assert.ok(h().includes(`href="#${f.id}"`), f.id); });
test('공장마다 사람 몫과 단계 3종 범례가 있다', () => {
  assert.equal((h().match(/class="fac-human"/g) || []).length, data().length);
  assert.ok(h().includes('lg-human'));
});
test('공개 수위: 내부 경로·비용·키 문자열이 출력에 없다', () => {
  assert.doesNotMatch(h(), /\/Users\/|~\/Projects|\$\d{2,}|토큰|api[_-]?key|ca-app-pub/i);
});
test('수치마다 기준일이 표시된다', () => {
  for (const m of data().flatMap(f => f.metrics)) assert.ok(h().includes(m.as_of));
});
test('골격 TODO 가 남아 있지 않다', () => assert.doesNotMatch(h(), /TODO-in-task/));
test('공장 5곳(앱·웹게임·영상·블로그·웹 도구)이 /factories/ 와 홈 모두에 렌더된다', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  assert.deepEqual(data().map(f => f.id), ['app-factory', 'web-games', 'video', 'blog', 'web-tools']);
  for (const page of [h(), home]) assert.equal((page.match(/<article class="fac"/g) || []).length, 5);
  for (const f of data()) assert.ok(home.includes(`href="/factories/#${f.id}"`), f.id);
  assert.ok(home.includes('직접 설계한 공장 5곳'));
  assert.ok(!home.includes('공장 6곳'));
});
test('신앙 앱 공장은 앱 공장에 편입됐다: 별도 공장·앵커가 없고, 앱 공장이 신앙 전용 게이트 수치를 출처와 함께 가진다', () => {
  assert.ok(!data().some(f => f.id === 'faith-factory'));
  const home = fs.readFileSync('index.html', 'utf8');
  for (const page of [h(), home]) {
    assert.doesNotMatch(page, /faith-factory/);
    assert.ok(!page.includes('신앙 앱 공장'));
  }
  const af = data().find(f => f.id === 'app-factory');
  const m = af.metrics.find(x => x.label.ko === '신앙 앱 전용 게이트');
  assert.ok(m, 'faith gates metric on app-factory');
  assert.equal(m.label.en, 'Faith-profile gates');
  assert.equal(m.value, '13');
  assert.equal(m.as_of, '2026-10-05');
  assert.match(m.source, /^app-factory\/profiles\/faith\/profile\.json /);
  assert.match(af.role.ko, /기독교인 대상 앱도 같은 엔진에 신앙 전용 프로필/);
  assert.match(af.role.en, /same engine with a faith-specific profile/);
  for (const page of [h(), home]) assert.ok(page.includes('신앙 앱 전용 게이트') && page.includes('Faith-profile gates'));
});
test('웹 도구 공장: 단계에 사람 단계가 있고 공개 전 사람 승인이 없음을 밝히며, 수치마다 source·as_of 가 있다', () => {
  const f = data().find(x => x.id === 'web-tools');
  assert.equal(f.icon, 'wrench');
  assert.ok(f.stages.length >= 4 && f.stages.length <= 7);
  assert.ok(f.stages.some(s => s.kind === 'human') && f.stages.some(s => s.kind === 'gate'));
  assert.match(f.human_role.ko, /공개 전 사람 승인은 두지 않/); assert.match(f.human_role.en, /no pre-publish human approval/);
  const tools = JSON.parse(fs.readFileSync('data/collections.json', 'utf8')).find(c => c.id === 'tools');
  const pub = f.metrics.find(m => m.label.ko === '공개한 도구');
  assert.equal(pub.value, String(tools.count.value), 'factory metric = collection count');
  for (const m of f.metrics) { assert.match(m.as_of, /^\d{4}-\d{2}-\d{2}$/); assert.ok(m.source.includes('kein-web-tools/')); }
  assert.deepEqual(f.outputs, []);
  assert.match(tools.summary.ko, /웹 도구 공장/);
});
