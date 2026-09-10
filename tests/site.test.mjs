import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('블로그 버튼은 강조되고 새 창으로 직접 연결된다',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const links=[...html.matchAll(/<a\b[^>]*href="https:\/\/blog\.kimjinwan\.com\/[^\"]*"[^>]*>/g)].map(m=>m[0]);
 assert.equal(links.length,4);
 for(const link of links){assert.match(link,/target="_blank"/);assert.match(link,/rel="noopener noreferrer"/);}
 assert.ok(!html.includes('href="#journal"'));
 assert.match(html, /class="btn btn-blog nav-cta"/);
 assert.match(html, /<div class="hero-cta">\s*<a[^>]+class="btn btn-blog"/);
 const css=fs.readFileSync('css/style.css','utf8');
 assert.ok(css.includes('.nav-links a.btn-blog'));
 assert.ok(css.includes('.btn-blog:focus-visible'));
});
test('웹 도구 공장이 탐색과 첫 화면에서 연결된다',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const links=[...html.matchAll(/<a\b[^>]*href="https:\/\/apps\.kimjinwan\.com\/"[^>]*>/g)].map(m=>m[0]);
 assert.equal(links.length,3);
 for(const link of links){assert.match(link,/target="_blank"/);assert.match(link,/rel="noopener noreferrer"/);}
 assert.match(html,/무료 웹 도구 쓰기/);
});
test('서버에서 보존한 광고 파일을 유지한다',()=>{
 for(const file of ['app-ads.txt','ads.txt'])assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),'422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0');
});
test('홈페이지·게임 메타데이터와 파비콘',()=>{
 for(const file of ['index.html','game/index.html']){
  const html=fs.readFileSync(file,'utf8');
  for(const text of ['name="description"','name="robots" content="index,follow"','rel="canonical"','property="og:title"','property="og:url"','name="twitter:card"'])assert.ok(html.includes(text),file+text);
  for(const icon of ['favicon.svg','favicon.ico','favicon-96.png','apple-touch-icon.png']){assert.ok(html.includes('/'+icon));assert.ok(fs.statSync(icon).size>0);}
 }
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(html.includes('id="journal"'));assert.ok(html.includes('https://blog.kimjinwan.com/ko/ai/ai-writing-index/'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.ok(schema['@graph'].some(x=>x['@type']==='ProfilePage'));
 const xml=fs.readFileSync('sitemap.xml','utf8');assert.ok(xml.includes('https://kimjinwan.com/'));assert.ok(xml.includes('https://kimjinwan.com/game/'));
 assert.ok(fs.readFileSync('robots.txt','utf8').includes('Sitemap: https://kimjinwan.com/sitemap.xml'));
});
