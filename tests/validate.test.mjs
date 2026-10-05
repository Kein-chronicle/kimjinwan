// tests/validate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {validate} from '../scripts/lib/validate.mjs';

const bi = (ko, en) => ({ko, en});
const svc = (id, o = {}) => ({id, name: id, kind: 'service', status: 'live', featured: false,
  summary: bi('요약', 'summary'), ai_tools: ['Claude Code'], url: `https://${id}.example.com/`,
  thumb: '', updated: '2026-10-05', ...o});
const col = (id, o = {}) => ({id, kind: 'game', name: bi('게임', 'Games'), summary: bi('요약', 'summary'),
  url: 'https://games.example.com/', count: {value: 44, as_of: '2026-10-05', source: 'x'},
  previews: [{name: 'a', url: 'https://games.example.com/a'}], ...o});
const fac = (id, o = {}) => ({id, name: bi('공장', 'Factory'), role: bi('역할', 'role'),
  stages: [{name: bi('기획', 'Plan'), kind: 'ai'}, {name: bi('검증', 'Gate'), kind: 'gate'}, {name: bi('승인', 'Approve'), kind: 'human'}],
  human_role: bi('승인', 'approve'),
  metrics: [{label: bi('게이트', 'Gates'), value: '87', as_of: '2026-10-05', source: 'pipeline.json'}],
  outputs: [], ...o});
const good = () => ({
  services: [svc('a', {featured: true}), svc('b', {featured: true}), svc('c', {featured: true})],
  collections: [col('games')], factories: [fac('f1', {outputs: ['a']})]});

test('정상 데이터는 통과한다', () => assert.deepEqual(validate(good()), []));
test('대표 서비스는 3~4개여야 한다', () => {
  const d = good(); d.services[2].featured = false;
  assert.match(validate(d).join('\n'), /featured/);
});
test('id 중복을 잡는다', () => {
  const d = good(); d.services[1].id = 'a';
  assert.match(validate(d).join('\n'), /duplicate/);
});
test('잘못된 kind/status 를 잡는다', () => {
  const d = good(); d.services[0].kind = 'x'; d.services[1].status = 'y';
  const e = validate(d).join('\n'); assert.match(e, /kind/); assert.match(e, /status/);
});
test('url 은 https 여야 한다', () => {
  const d = good(); d.services[0].url = 'http://a'; assert.match(validate(d).join('\n'), /url/);
});
test('공장 outputs 는 존재하는 서비스 id 여야 한다', () => {
  const d = good(); d.factories[0].outputs = ['nope']; assert.match(validate(d).join('\n'), /outputs/);
});
test('수치는 as_of(YYYY-MM-DD)와 source 가 필수다', () => {
  const d = good(); d.factories[0].metrics[0].as_of = '오늘'; assert.match(validate(d).join('\n'), /as_of/);
  const e = good(); delete e.factories[0].metrics[0].source; assert.match(validate(e).join('\n'), /source/);
});
test('stage kind 는 ai|human|gate 이고 human 단계가 최소 1개', () => {
  const d = good(); d.factories[0].stages[2].kind = 'ai'; assert.match(validate(d).join('\n'), /human/);
});
test('ko/en 이 비어 있으면 잡는다', () => {
  const d = good(); d.services[0].summary.en = ''; assert.match(validate(d).join('\n'), /summary/);
});
test('공장 icon 은 허용된 아이콘 이름이어야 한다', () => {
  const ok = good(); ok.factories[0].icon = 'gamepad'; assert.deepEqual(validate(ok), []);
  const bad = good(); bad.factories[0].icon = 'nope'; assert.match(validate(bad).join('\n'), /icon/);
});

const prof = () => ({
  pitch: bi('소개', 'pitch'),
  strengths: [0, 1, 2, 3].map(i => ({icon: 'code', title: bi('제목' + i, 't' + i), text: bi('내용', 'text')})),
  timeline: [0, 1, 2, 3].map(i => ({period: '2020 – 2021', company: bi('회사', 'Co'), title: bi('직함', 'Title'), role: bi('역할', 'Role'), text: bi('내용', 'text')})),
  featured_projects: [46, 50, 9]});
test('profile 정상 데이터는 통과한다', () => assert.deepEqual(validate({...good(), profile: prof()}), []));
test('profile 은 강점 4개·타임라인 4개를 요구한다', () => {
  const a = prof(); a.strengths.pop(); assert.match(validate({...good(), profile: a}).join('\n'), /strengths must have exactly 4/);
  const b = prof(); b.timeline.pop(); assert.match(validate({...good(), profile: b}).join('\n'), /timeline must have exactly 4/);
});
test('profile ko/en 이 비면 잡는다', () => {
  const a = prof(); a.strengths[1].text.en = ''; assert.match(validate({...good(), profile: a}).join('\n'), /strengths\[1\]/);
  const b = prof(); b.timeline[2].company.ko = ' '; assert.match(validate({...good(), profile: b}).join('\n'), /timeline\[2\]: company/);
  const c = prof(); c.pitch.en = ''; assert.match(validate({...good(), profile: c}).join('\n'), /pitch/);
});
test('profile 강점 아이콘은 허용된 이름이어야 한다', () => {
  const a = prof(); a.strengths[0].icon = 'nope'; assert.match(validate({...good(), profile: a}).join('\n'), /unknown icon/);
});
test('featured_projects 는 중복 없는 정수여야 한다', () => {
  const a = prof(); a.featured_projects = [1, 1]; assert.match(validate({...good(), profile: a}).join('\n'), /unique/);
  const b = prof(); b.featured_projects = [1, '2']; assert.match(validate({...good(), profile: b}).join('\n'), /integers/);
  const c = prof(); c.featured_projects = []; assert.match(validate({...good(), profile: c}).join('\n'), /non-empty/);
});
