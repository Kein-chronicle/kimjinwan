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
