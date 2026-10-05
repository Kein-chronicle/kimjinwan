// tests/template.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {fill} from '../scripts/lib/template.mjs';

test('변수와 파셜을 치환한다', () => {
  assert.equal(fill('<p>{{a}}</p>{{>x}}', {a: '1'}, {x: '[{{a}}]'}), '<p>1</p>[1]');
});
test('모르는 변수는 에러다', () => assert.throws(() => fill('{{nope}}', {}, {}), /nope/));
test('모르는 파셜은 에러다', () => assert.throws(() => fill('{{>nope}}', {}, {}), /nope/));
test('치환된 값 안의 {{}} 는 다시 해석하지 않는다(데이터 주입 방지)', () => {
  assert.equal(fill('{{a}}', {a: '{{b}}', b: 'X'}, {}), '{{b}}');
});
