// scripts/hub_check_tool.mjs — 웹 도구 한 개가 허브 소개글 자격을 갖췄는지 점검한다. 허브는 kein-web-tools 의 lib/tool-catalog.ts 와 app/<slug>/page.tsx 의 정적 한국어 문구에서 소개를 만든다(편집 원본 없음).
//   cd ~/Projects/kimjinwan && node scripts/hub_check_tool.mjs <slug> [--tools-repo <kein-web-tools>] [--root <허브 저장소>] [--json]
// 허브 빌드가 쓰는 함수(hub_sources.mjs 의 parseToolCatalog·collectTool·toolBodyChars·toolEligible)를 그대로 호출한다. 종료 코드: 0 = 자격 충족, 1 = 미달, 2 = 사용법 오류.
// 자격(빌드 기준): 읽은 출처 1개 이상(page.tsx) + 본문 사실 300자 이상 + 입력 라벨·버튼·본문 문장 중 1개 이상. 화면 이미지는 허브 쪽 스크립트가 라이브 페이지를 캡처해 만든다(자격 아님·안내만).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Report, parseArgs} from './lib/check_report.mjs';
import {parseToolCatalog, collectTool, toolBodyChars, toolEligible, GATE, TOOL_IDS} from './lib/hub_sources.mjs';
import {BAN, EMOJI} from './lib/games_authoring.mjs';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2), ['--tools-repo', '--root'], ['--json', '--online']);
const slug = args._[0];
if (!slug || args.unknown || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('사용법: node scripts/hub_check_tool.mjs <도구 slug> [--tools-repo <kein-web-tools 경로>] [--root <허브 저장소>] [--json] [--online]' + (args.unknown ? `\n알 수 없는 옵션: ${args.unknown}` : ''));
  process.exit(2);
}
const ROOT = path.resolve(args.root || HERE);
const TOOLS = path.resolve(args['tools-repo'] || path.join(os.homedir(), 'Projects/kein-web-tools'));
const rep = new Report(`웹 도구 허브 소개 자격 점검: ${slug}`);
const out = (extra = {}) => { if (args.json) console.log(JSON.stringify(rep.toJSON(extra), null, 1)); else console.log(rep.text()); process.exit(rep.failed ? 1 : 0); };
const cut = (s, n = 60) => (s.length > n ? s.slice(0, n) + '…' : s);

const catPath = path.join(TOOLS, 'lib/tool-catalog.ts');
if (!fs.existsSync(catPath)) { rep.add('fail', '도구 저장소', `${catPath} 가 없다`, '--tools-repo 로 kein-web-tools 경로를 알려 준다'); out(); }
let entries;
try { entries = parseToolCatalog(fs.readFileSync(catPath, 'utf8')); } catch (e) { rep.add('fail', '카탈로그 읽기', e.message, 'lib/tool-catalog.ts 의 각 항목이 {href, name, description, …, categories: […]} 형식인지 확인한다'); out(); }
const entry = entries.find(e => e.href.replace(/\//g, '') === slug);
if (!entry) {
  const near = entries.map(e => e.href.replace(/\//g, '')).filter(s => s.includes(slug.split('-')[0])).slice(0, 5);
  rep.add('fail', '카탈로그 등록', `lib/tool-catalog.ts 의 tools 목록에 href '/${slug}/' 항목이 없다${near.length ? ` (비슷한 slug: ${near.join(', ')})` : ''}`, `kein-web-tools/lib/tool-catalog.ts 의 tools 에 {href: '/${slug}/', name, description, …, categories: ['…']} 를 추가한다`);
  out();
}
rep.add('ok', '카탈로그 등록', `${entry.name} — ${cut(entry.description, 50)}`);

// 분류
const cat = entry.categories[0];
if (TOOL_IDS[cat]) rep.add('ok', '분류', `${cat} → 허브 분류 ${TOOL_IDS[cat][0]}`);
else rep.add('fail', '분류', `categories[0] '${cat}' 는 허브 허용 분류가 아니다(허용: ${Object.keys(TOOL_IDS).join('·')})`, `허용 분류 중 하나를 categories 맨 앞에 두거나, 새 분류면 scripts/lib/hub_sources.mjs 의 TOOL_IDS 에 추가를 요청한다(허브 빌드가 예외로 멈춘다)`);

// 출처
const f = collectTool(TOOLS, entry);
const page = `app/${slug}/page.tsx`;
if ((f.sources || []).length) rep.add('ok', '읽은 출처', `${page} + 카탈로그 설명`);
else rep.add('fail', '읽은 출처', `${page} 가 없다 — 허브가 읽을 정적 문구가 없다`, `kein-web-tools 에 ${page} 를 만든다(페이지 파일 경로는 카탈로그 href 와 같아야 한다)`);

// 읽은 문구 요약
const list = (arr, n = 4) => (arr.length ? arr.slice(0, n).map(x => `'${cut(typeof x === 'string' ? x : x.text, 28)}'`).join(', ') + (arr.length > n ? ` 외 ${arr.length - n}` : '') : '없음');
const inputs = f.inputs || [], actions = f.actions || [], blocks = f.blocks || [];
rep.add(f.intro ? 'ok' : 'warn', '머리말(<h1> 바로 뒤 <p>)', f.intro ? cut(f.intro, 70) : '없음', `${page} 의 <h1>도구 이름</h1> 바로 다음 <p>한 줄 설명</p> 을 정적 한국어로 둔다(없어도 자격엔 영향 없음)`);
rep.add(inputs.length ? 'ok' : 'warn', '입력 라벨', `${inputs.length}개: ${list(inputs)}`, `입력 라벨 없음 — <label>·<Label>·<legend> 텍스트 또는 입력 칸의 aria-label 을 정적 한국어로 넣으면 '무엇을 입력받는지'가 소개에 실린다(자격은 버튼·본문 문장으로도 채울 수 있다)`);
rep.add(actions.length ? 'ok' : 'warn', '버튼 문구', `${actions.length}개: ${list(actions)}`, `버튼 문구 없음 — <Button> 안의 정적 한국어 문구를 넣는다`);
rep.add(blocks.length ? 'ok' : 'warn', '본문 문장(h2·h3·p·li·dd·summary·긴 안내 문자열)', `${blocks.length}개: ${list(blocks)}`, `본문 문장 없음 — 사용 방법·주의점·한계를 <p>·<li> 정적 한국어 문장(14자 이상)으로 쓴다. {변수}가 섞인 문장과 오류·알림 문구는 읽히지 않는다`);
if (f.does) rep.add('info', 'MCP 설명', cut(f.does, 80));

// 자격 3요건
const chars = toolBodyChars(entry, f), n = inputs.length + actions.length + blocks.length;
if (chars >= GATE.toolMin) rep.add('ok', `본문 사실 분량(${GATE.toolMin}자 이상)`, `${chars}자`);
else rep.add('fail', `본문 사실 분량(${GATE.toolMin}자 이상)`, `${chars}자 — ${GATE.toolMin - chars}자 부족`, `${page} 에 사용 방법·입력 설명·한계를 정적 한국어 문장으로 ${GATE.toolMin - chars}자 이상 더 쓴다(설명 + 머리말 + 본문 문장 + 입력 라벨 + 버튼 문구의 합, 중복 제외). 억지 문장으로 늘리지 말고 실제 동작을 설명한다`);
if (n > 0) rep.add('ok', '입력·버튼·본문 중 1개 이상', `입력 ${inputs.length} + 버튼 ${actions.length} + 본문 ${blocks.length}`);
else rep.add('fail', '입력·버튼·본문 중 1개 이상', '하나도 없다 — 사용 방법을 설명할 거리가 없다', `입력 라벨 없음·버튼 없음·본문 없음. ${page} 에 입력 라벨이나 사용 안내 문장을 정적 한국어로 넣는다`);
const eligible = toolEligible(entry, f); // 허브 빌드의 최종 판정(위 세 요건과 같은 식)

// 허브 화면에 그대로 실리는 문구의 금지어(1인칭·이모지·TODO)
const shown = [entry.description, f.intro, ...blocks.map(b => b.text), ...inputs, ...actions].filter(Boolean).join('\n');
const bad = [BAN.test(shown) && '1인칭(제가·저는 …)', EMOJI.test(shown) && '이모지', /TODO/.test(shown) && 'TODO'].filter(Boolean);
if (bad.length) rep.add('fail', '금지어', `${bad.join('·')} 가 허브에 실릴 문구에 들어 있다`, `${page} 와 tool-catalog.ts 의 설명을 서술형 평서문으로 고친다(허브 시험이 1인칭을 막는다)`);
else rep.add('ok', '금지어', '1인칭·이모지·TODO 없음');

// 이미지(안내)
let man = null, ok = false;
try { man = JSON.parse(fs.readFileSync(path.join(ROOT, 'content-src/images.json'), 'utf8')).tools?.[slug]; ok = man && ['', '-hero'].every(s => fs.existsSync(path.join(ROOT, `assets/content/tools/${slug}${s}.webp`))); } catch { /* 없음 */ }
if (ok) rep.add('ok', '화면 이미지', `assets/content/tools/${slug}.webp · ${slug}-hero.webp 있음`);
else rep.add('info', '화면 이미지', `없음 — 허브 쪽 node scripts/build_content_images.mjs 가 라이브 페이지(https://apps.kimjinwan.com/${slug}/)를 헤드리스 Chrome 으로 캡처해 만든다(1280×800 → 카드 640×400·대표 1200×750). 도구가 배포되어 열려야 만들어지며, 이미지가 없으면 허브는 이 도구를 '이미지 없음'으로 제외한다. 공장이 캡처할 필요는 없다`);
if (args.online) {
  const u = `https://apps.kimjinwan.com/${slug}/`;
  try { const r = await fetch(u, {signal: AbortSignal.timeout(15000)}); rep.add(r.status === 200 ? 'ok' : 'fail', '도구 주소(--online)', `${u} → ${r.status}`, '도구가 배포되었는지 확인한다(미배포면 화면 이미지가 만들어지지 않는다)'); }
  catch (e) { rep.add('fail', '도구 주소(--online)', `${u} 연결 실패: ${e.message}`, '네트워크·배포 여부를 확인한다'); }
}
out({slug, eligible, chars, sources: f.sources || [], counts: {inputs: inputs.length, actions: actions.length, blocks: blocks.length}});
