// tests/render.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {esc, bi, serviceCard, collectionCard, factoryCard, heroStats} from '../scripts/lib/render.mjs';

const svc = {id: 'forge', name: 'Forge', kind: 'service', status: 'live', featured: true,
  summary: {ko: '요구사항에서 개발까지', en: 'From requirements to code'},
  ai_tools: ['Claude Code', 'Codex'], url: 'https://forge.example.com/', thumb: 'assets/services/forge.png', updated: '2026-10-05'};

test('esc 는 HTML 특수문자를 이스케이프한다', () => assert.equal(esc('<a href="x">&'), '&lt;a href=&quot;x&quot;&gt;&amp;'));
test('bi 는 ko/en span 쌍을 만든다', () =>
  assert.equal(bi({ko: '가', en: 'a'}), '<span data-lang-ko>가</span><span data-lang-en>a</span>'));
test('serviceCard 는 외부 링크 속성, 상태 배지, AI 툴 칩을 포함한다', () => {
  const h = serviceCard(svc);
  assert.match(h, /href="https:\/\/forge\.example\.com\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(h, /badge-live/); assert.match(h, /LIVE/);
  assert.match(h, />Claude Code</); assert.match(h, /<img src="assets\/services\/forge\.png"/);
});
test('serviceCard 는 thumb 가 없으면 img 를 만들지 않는다', () => {
  assert.doesNotMatch(serviceCard({...svc, thumb: ''}), /<img/);
});
test('collectionCard 는 개수와 미리보기 링크를 렌더한다', () => {
  const h = collectionCard({id: 'games', kind: 'game', name: {ko: '웹게임', en: 'Web games'},
    summary: {ko: '설명', en: 'desc'}, url: 'https://games.example.com/',
    count: {value: 44, as_of: '2026-10-05', source: 's'}, previews: [{name: 'A', url: 'https://games.example.com/a'}]});
  assert.match(h, /44/); assert.match(h, /2026-10-05/); assert.match(h, /href="https:\/\/games\.example\.com\/a"/);
});
test('factoryCard 는 단계 3종 클래스, 사람 역할, 수치, 산출물 링크를 렌더하고 source 는 노출하지 않는다', () => {
  const f = {id: 'af', name: {ko: '앱 공장', en: 'App Factory'}, role: {ko: '앱 양산', en: 'Ships apps'},
    stages: [{name: {ko: '기획', en: 'Plan'}, kind: 'ai'}, {name: {ko: '게이트', en: 'Gate'}, kind: 'gate'}, {name: {ko: '승인', en: 'Approve'}, kind: 'human'}],
    human_role: {ko: '제출 승인만', en: 'Approves submission only'},
    metrics: [{label: {ko: '게이트', en: 'Gates'}, value: '87', as_of: '2026-10-05', source: '/Users/kein/secret/pipeline.json'}],
    outputs: ['forge']};
  const h = factoryCard(f, new Map([['forge', svc]]));
  for (const c of ['stage-ai', 'stage-gate', 'stage-human']) assert.match(h, new RegExp(c));
  assert.match(h, /제출 승인만/); assert.match(h, /제가 맡는 일/); assert.match(h, /What I do/); assert.doesNotMatch(h, /사람 몫|Human role/); assert.match(h, />87</); assert.match(h, /href="https:\/\/forge\.example\.com\/"/);
  assert.doesNotMatch(h, /\/Users\/|secret|pipeline\.json/);
});
test('heroStats 는 데이터에서 개수를 집계한다', () => {
  const h = heroStats({
    services: [svc, {...svc, id: 'b', featured: false}],
    collections: [{kind: 'game', count: {value: 44}}, {kind: 'tool', count: {value: 42}}, {kind: 'blog', count: {value: 218}}]});
  assert.match(h, />2</); assert.match(h, />44</); assert.match(h, />42</); assert.match(h, />218</);
});
