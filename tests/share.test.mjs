import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAll, loadData, mirrorPages, cardUrl} from '../scripts/build.mjs';
import {esc} from '../scripts/lib/render.mjs';
import {shareButton} from '../scripts/lib/share.mjs';
const data = loadData(), pages = mirrorPages(data), out = buildAll({write:false});
const meta = (html, name) => html.match(new RegExp(`(?:property|name)="${name}" content="([^"]*)"`))?.[1];
test('모든 콘텐츠 상세: 공유 URL·제목·설명·이미지와 정적 OG/Twitter 메타가 일치한다', () => {
  for (const page of pages) {
    const h = out[page.path.slice(1) + 'index.html'];
    const image = cardUrl(page.image?.slice(1) || 'assets/og/content.png');
    for (const [key, value] of Object.entries({url:'https://kimjinwan.com'+page.path, title:page.title, description:page.description, image})) {
      assert.ok(h.includes(`data-share-${key}="${esc(value)}"`), page.path + key);
    }
    assert.equal(meta(h,'og:url'), 'https://kimjinwan.com'+page.path);
    assert.equal(meta(h,'og:image'), image);
    assert.equal(meta(h,'twitter:image'), image);
    assert.ok(meta(h,'og:title') && meta(h,'og:description'));
    assert.equal(meta(h,'og:type'), page.schemaType ? 'website' : 'article');
    const file = new URL(image).pathname.slice(1);
    assert.ok(fs.existsSync(file), file);
    if (page.image) {
      const slug = page.path.split('/').filter(Boolean).at(-1);
      const size = data.images[page.kind][slug][page.kind === 'apps' ? 'icon' : 'hero'];
      assert.equal(meta(h,'og:image:type'), 'image/webp');
      assert.equal(meta(h,'og:image:width'), String(size[0]));
      assert.equal(meta(h,'og:image:height'), String(size[1]));
    }
  }
});
test('공유 UI는 상세 본문 끝에 한 번만 나오고 허브·목록에는 없다', () => {
  const details = new Set(pages.map(p => p.path.slice(1) + 'index.html'));
  for (const [file, h] of Object.entries(out).filter(([f]) => f.startsWith('content/'))) {
    assert.doesNotMatch(h, /data-share-placeholder/);
    if (details.has(file)) {
      assert.equal((h.match(/data-share-url=/g)||[]).length, 1, file);
      assert.match(h, /<footer class="detail-share"[\s\S]*?data-share-url=[\s\S]*?<\/footer>\s*<\/article>/, file);
      assert.doesNotMatch(h.match(/<header class="detail-hd">[\s\S]*?<\/header>/)[0], /data-share-url=/, file);
      assert.equal((h.match(/class="share-dialog"/g)||[]).length,1,file);
    } else {
      assert.doesNotMatch(h, /data-share-url=|class="share-dialog"|src="\/js\/share/, file);
    }
  }
});
test('공유 메타데이터의 따옴표·태그를 이스케이프한다', () => {
  const h = shareButton({url:'https://example.com/?a=1&b=2', title:'"<img>', description:"' &", image:'https://example.com/a.png'});
  assert.doesNotMatch(h, /<img>/);
  assert.match(h, /&quot;&lt;img&gt;/);
  assert.match(h, /a=1&amp;b=2/);
});
