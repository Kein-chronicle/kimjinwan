import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validate} from '../scripts/lib/validate.mjs';

const load = n => JSON.parse(fs.readFileSync(`data/${n}.json`, 'utf8'));
const data = () => ({services: load('services'), collections: load('collections'), factories: load('factories')});

test('실데이터가 스키마를 통과한다', () => assert.deepEqual(validate(data()), []));
test('대표 서비스는 Forge, Prism Studio 를 포함한다', () => {
  const ids = data().services.filter(s => s.featured).map(s => s.id);
  assert.ok(ids.includes('forge') && ids.includes('prism-studio'));
});
test('컬렉션은 game/tool/app/blog 를 모두 가진다', () => {
  const kinds = new Set(data().collections.map(c => c.kind));
  for (const k of ['game', 'tool', 'app', 'blog']) assert.ok(kinds.has(k), k);
});
test('비공개 정보가 렌더 대상 필드에 없다', () => {
  const {services, collections, factories} = data();
  const strip = o => JSON.stringify(o, (k, v) => (k === 'source' ? undefined : v));
  for (const s of [strip(services), strip(collections), strip(factories)])
    assert.doesNotMatch(s, /\/Users\/|~\/|api[_-]?key|secret|token|ca-app-pub|pk_live|sk-/i);
});
