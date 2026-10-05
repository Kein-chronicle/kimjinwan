import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {icon, ICON_NAMES} from '../scripts/lib/icons.mjs';
import {serviceCard, collectionCard, factoryCard, stageLegend, heroStats} from '../scripts/lib/render.mjs';

const NEEDED = ['user', 'code', 'layers', 'cpu', 'sparkles', 'shield-check', 'hand', 'user-check', 'factory', 'gamepad', 'wrench',
  'smartphone', 'book-open', 'globe', 'mail', 'phone', 'link', 'play', 'arrow-up-right', 'workflow', 'clock', 'check-circle',
  'bar-chart', 'briefcase', 'image', 'file-text', 'rocket', 'bot', 'brain', 'calendar', 'arrow-right', 'repeat'];

test('필요한 아이콘이 모두 있다', () => { for (const n of NEEDED) assert.ok(ICON_NAMES.includes(n), n); });
test('모든 아이콘은 필수 속성을 가진 유효한 svg 로 렌더된다', () => {
  for (const n of ICON_NAMES) {
    const h = icon(n);
    assert.match(h, /^<svg /); assert.match(h, /<\/svg>$/);
    for (const a of ['viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="1.75"', 'stroke-linecap="round"',
      'stroke-linejoin="round"', 'aria-hidden="true"', 'focusable="false"', 'class="ico"']) assert.ok(h.includes(a), `${n}: ${a}`);
    assert.match(h, /<(path|circle|rect)\b/);
    assert.ok(h.length < 900, `${n} too large`);
  }
});
test('size 와 cls 옵션을 반영한다', () => {
  const h = icon('user', {size: 32, cls: 'x'}); assert.match(h, /width="32" height="32"/); assert.match(h, /class="ico x"/);
});
test('알 수 없는 이름은 던진다', () => { assert.throws(() => icon('nope'), /unknown icon/); assert.throws(() => icon('toString')); });
test('카드 렌더 결과에 아이콘이 들어간다', () => {
  const svc = {id: 'a', name: 'A', kind: 'service', status: 'live', summary: {ko: '가', en: 'a'}, ai_tools: [], url: 'https://a.example.com/', thumb: ''};
  assert.match(serviceCard(svc), /<svg/);
  assert.doesNotMatch(serviceCard(svc), /↗/);
  const col = {id: 'g', kind: 'game', name: {ko: '게임', en: 'Games'}, summary: {ko: '설명', en: 'd'}, url: 'https://g.example.com/', count: {value: 1, as_of: '2026-10-05', source: 's'}, previews: []};
  assert.match(collectionCard(col), /<svg/);
  const f = {id: 'af', icon: 'smartphone', name: {ko: '앱', en: 'App'}, role: {ko: '역할', en: 'r'}, stages: [{name: {ko: '기획', en: 'p'}, kind: 'ai'}, {name: {ko: '승인', en: 'a'}, kind: 'human'}], human_role: {ko: '승인', en: 'a'}, metrics: [{label: {ko: '게이트', en: 'g'}, value: '1', as_of: '2026-10-05', source: 's'}], outputs: []};
  const h = factoryCard(f, new Map());
  assert.match(h, /<svg/); assert.match(h, /fac-ico/);
  // 범례(AI/GATE/HUMAN)는 공장마다 반복하지 않고 섹션에 한 번 — stageLegend 로 분리됐다
  assert.ok((h.match(/<svg/g) || []).length >= 5);
  assert.equal((stageLegend().match(/<svg/g) || []).length, 3);
  assert.match(heroStats({services: [svc], collections: []}), /<svg/);
});
test('빌드된 index.html 에 외부 링크 화살표 글리프가 남지 않는다', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>/g, ''), /↗/);
});
