import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAll} from '../scripts/build.mjs';

const GENERATED_HTML = ['index.html', 'works/index.html', 'factories/index.html', 'career/index.html', 'content/index.html'];
const GENERATED = [...GENERATED_HTML, 'sitemap.xml'];

test('커밋된 생성물이 src+data+content-src 와 일치한다(수정은 src/data 에서)', () => {
  const out = buildAll({write: false});
  const files = Object.keys(out).sort();
  assert.deepEqual(files.filter(f => !f.startsWith('content/') || f === 'content/index.html'), [...GENERATED].sort());
  for (const [file, html] of Object.entries(out))
    assert.equal(fs.readFileSync(file, 'utf8'), html, `${file} is stale — run: node scripts/build.mjs (생성물을 직접 고치지 말 것)`);
  // 허브 원문 사본(content/blog|gizmo|services/**)은 빌드 산출물만 있어야 한다(지워진 글의 낡은 페이지가 남지 않게)
  const onDisk = fs.readdirSync('content', {recursive: true}).filter(f => f.endsWith('index.html')).map(f => 'content/' + f).sort();
  assert.deepEqual(onDisk, files.filter(f => f.startsWith('content/')));
});
test('빌드는 결정적이다(같은 입력 → 같은 출력, 날짜 의존 없음)', () => {
  assert.deepEqual(buildAll({write: false}), buildAll({write: false}));
});
test('빌드 스크립트는 현재 시각을 출력에 쓰지 않는다', () => {
  assert.doesNotMatch(fs.readFileSync('scripts/build.mjs', 'utf8'), /new Date\(|Date\.now\(/);
});
test('생성물에 골격 TODO 가 없다', () => {
  for (const f of GENERATED_HTML) assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /TODO/);
  for (const f of fs.readdirSync('src', {recursive: true}).filter(f => f.endsWith('.html')))
    assert.doesNotMatch(fs.readFileSync('src/' + f, 'utf8'), /TODO/, f);
});
test('캐시 버스팅 ?v= 가 VERSION 파일을 따른다', () => {
  const v = fs.readFileSync('VERSION', 'utf8').trim();
  for (const f of GENERATED_HTML) assert.ok(fs.readFileSync(f, 'utf8').includes(`/css/style.css?v=${v}`), f);
});
