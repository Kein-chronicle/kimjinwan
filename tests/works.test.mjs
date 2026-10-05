// tests/works.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const h = () => fs.readFileSync('works/index.html', 'utf8');
test('/works 는 JS 없이 모든 서비스와 컬렉션을 초기 HTML 에 포함한다', () => {
  const services = JSON.parse(fs.readFileSync('data/services.json', 'utf8'));
  const cols = JSON.parse(fs.readFileSync('data/collections.json', 'utf8'));
  for (const s of services) assert.ok(h().includes(s.url), s.id);
  for (const c of cols) assert.ok(h().includes(c.url), c.id);
});
test('/works 는 종류 필터 버튼을 가진다', () => {
  for (const k of ['all', 'service', 'game', 'tool', 'app', 'blog']) assert.ok(h().includes(`data-filter="${k}"`), k);
});
test('/works 는 메인 스크립트를 절대경로로 불러온다', () => {
  assert.match(h(), /src="\/js\/main\.js"/); assert.match(h(), /src="\/js\/site-metrics\.js"/);
});
test('골격 TODO 가 남아 있지 않다', () => assert.doesNotMatch(h(), /TODO-in-task/));
