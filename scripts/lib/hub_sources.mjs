// scripts/lib/hub_sources.mjs — 웹게임·웹 도구 상세 소개글의 사실 수집기(생성기 전용, 로컬 저장소를 읽기만 한다).
// 원칙: 소스에서 확인되는 문장만 싣는다. 본문을 부풀리는 템플릿 문장은 만들지 않는다 — 사실이 모자라면 제외하고 사유를 남긴다.
import fs from 'node:fs';
import path from 'node:path';

const oneLine = s => String(s).replace(/\s+/g, ' ').trim();
const exists = p => { try { return fs.existsSync(p); } catch { return false; } };
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
// 마크다운 한 줄 → 평문(백틱·굵게·링크 제거)
export const plain = s => oneLine(String(s).replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^[-*]\s+/, ''));
// 내부 생산 공정 용어·파일 경로·명령이 든 줄은 소개글에 쓰지 않는다
export const INTERNAL = /npm |Forge|게이트|라이선스|CC0|OpenAI|localStorage|런타임|\bQA\b|DoD|DOD|스타터|starter|검증|public\/|\.json|\.md|\.ts\b|manifest|빌드|커밋|가이드라인 준수|원작|리서치|렌더|프레임 간격|파이프라인/;

// "## 제목" 아래 불릿/문단을 {제목: [줄…]} 로
export function mdSections(md) {
  const out = {}; let cur = null, intro = [], seenH1 = false;
  for (const raw of md.split('\n')) {
    const h2 = raw.match(/^##\s+(.+?)\s*$/);
    if (h2) { cur = h2[1]; out[cur] = []; continue; }
    if (/^#\s+/.test(raw)) { seenH1 = true; continue; }
    if (/^```/.test(raw)) { cur = cur && cur + '\u0000code'; if (cur && !out[cur]) out[cur] = []; continue; }
    if (!raw.trim()) continue;
    if (cur) (out[cur] = out[cur] || []).push(raw); else if (seenH1) intro.push(raw);
  }
  out.__intro = intro;
  return out;
}
const bullets = lines => (lines || []).filter(l => /^\s*[-*]\s+/.test(l)).map(plain).filter(l => l.length >= 6 && !INTERNAL.test(l));

// ── 웹게임 ────────────────────────────────────────────────────────────
const ROOT = h => (...p) => path.join(h, 'Projects', ...p);
function gameDocDirs(home, slug) {
  const P = ROOT(home);
  return [P('kein-game-forge/.workspaces', slug), P('kein-game-forge/.workspaces/arcade-coverage', slug), P(slug), P('kein-games', slug)].filter(exists);
}
export function collectGame(home, gamesRepo, g) {
  const slug = g.slug, facts = {sources: []};
  const P = ROOT(home);
  const cfgP = path.join(gamesRepo, 'published-games', slug, 'build/game.config.json');
  let cfg = null; if (exists(cfgP)) { cfg = readJson(cfgP); facts.sources.push('game.config'); }
  let spec = null, readme = null, design = null;
  for (const d of gameDocDirs(home, slug)) {
    const gj = path.join(d, 'game.generated.json');
    if (!spec && exists(gj)) { spec = readJson(gj).spec || null; if (spec) facts.sources.push('game.generated'); }
    const rm = path.join(d, 'README.md');
    if (!readme && exists(rm)) { readme = mdSections(fs.readFileSync(rm, 'utf8')); facts.sources.push('README'); }
    const ds = path.join(d, 'docs/DESIGN.md');
    if (!design && exists(ds)) { design = fs.readFileSync(ds, 'utf8'); facts.sources.push('DESIGN'); }
  }
  const gs = P('kein-game-forge/game-spec', slug, 'spec.json');
  if (!spec && exists(gs)) { spec = readJson(gs); facts.sources.push('game-spec'); }

  // 소개: README 첫 문단(있으면) — games.json 설명과 같으면 중복이라 뺀다
  if (readme?.__intro?.length) { const t = plain(readme.__intro.join(' ')); if (t.length >= 20 && !INTERNAL.test(t) && t !== g.description) facts.lead = t; }
  const sec = name => readme && Object.keys(readme).filter(k => k === name || k.startsWith(name)).flatMap(k => bullets(readme[k]));
  facts.rules = [...new Set([...(sec('핵심 규칙') || []), ...(sec('플레이') || [])])];
  facts.progress = [...new Set(sec('진행') || [])];
  facts.controlsDetail = [...new Set(sec('조작') || [])];
  if (!facts.controlsDetail.length && spec?.controls?.length) { const c = spec.controls.map(plain).filter(x => x.length > 3 && !INTERNAL.test(x)); if (c.some(x => /[ ·]/.test(x) && x.length > 6)) facts.controlsDetail = c; }
  // 스테이지 안내문(퍼즐류): 서로 다른 안내문 최대 6개
  const guides = [...new Set(((spec?.game?.stages) || []).map(s => s.guide && plain(s.guide)).filter(x => x && x.length >= 12 && !INTERNAL.test(x)))].slice(0, 6);
  if (guides.length) facts.stageGuides = guides;
  const stageCount = cfg?.stageCount ?? spec?.game?.stageCount; if (Number.isInteger(stageCount) && stageCount > 0) facts.stageCount = stageCount;
  const sub = cfg?.subtitle || spec?.subtitle; if (sub && sub.length >= 4) facts.subtitle = plain(sub);
  // 설계서의 판매 소개말(있으면 확정 문구 한 개)
  if (design) { const m = design.match(/##\s*판매 소개말[\s\S]*?\*\*최종 확정[^*]*\*\*:\s*"([^"]{30,400})"/) || design.match(/##\s*판매 소개말[\s\S]*?"([^"]{30,400})"/); if (m && !INTERNAL.test(m[1])) facts.pitch = plain(m[1]); }
  return facts;
}

// 본문(사실 문장) 글자 수 = 소개문에 실리는 소스 유래 문장의 합
export function gameFactChars(g, f) {
  const parts = [g.description, f.lead, f.pitch, ...(f.rules || []), ...(f.progress || []), ...(f.controlsDetail || []), ...(f.stageGuides || [])].filter(Boolean);
  return parts.join('').length;
}

// ── 웹 도구 ───────────────────────────────────────────────────────────
// 도구 분류(tool-catalog.ts categories[0]) → [허브 분류 id, 영문 라벨]. 새 분류는 여기에 추가한다.
export const TOOL_IDS = {'이미지': ['image', 'Image'], PDF: ['pdf', 'PDF'], QR: ['qr', 'QR'], '게임': ['game', 'Games & random'], '생활·학습': ['life-study', 'Life & study'], '업무': ['work', 'Work']};
// kein-web-tools/lib/tool-catalog.ts 의 도구 목록 → [{href, name, description, categories}]. 파싱 개수가 href 개수와 다르면 예외.
export function parseToolCatalog(src) {
  const body = src.slice(src.indexOf('export const tools'));
  const entries = [...body.matchAll(/\{\s*href:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*description:\s*'((?:[^'\\]|\\.)*)',[\s\S]*?categories:\s*\[([^\]]*)\]/g)].map(m => ({
    href: m[1], name: m[2].replace(/\\'/g, "'"), description: m[3].replace(/\\'/g, "'"), categories: [...m[4].matchAll(/'([^']+)'/g)].map(x => x[1])}));
  const hrefCount = (body.match(/^\s+href:/gm) || []).length;
  if (entries.length !== hrefCount) throw new Error(`tool catalog parse mismatch: ${entries.length} parsed vs ${hrefCount} href`);
  return entries;
}
// page.tsx 에서 사용자에게 보이는 한국어 문구를 역할별로 모은다.
export function collectTool(toolsRepo, item) {
  const slug = item.href.replace(/\//g, '');
  const f = path.join(toolsRepo, 'app', slug, 'page.tsx');
  const facts = {slug, sources: []};
  if (!exists(f)) return facts;
  const src = fs.readFileSync(f, 'utf8'); facts.sources.push('page.tsx');
  const dec = s => s.replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  const hasKo = s => /[가-힣]/.test(s);
  const ok = s => s.length >= 2 && s.length <= 140 && hasKo(s) && !/[{}=<>]|=>|function|\$\{/.test(s);
  const jsx = src.replace(/=>/g, '→'); // 화살표 함수의 '>' 가 태그 끝으로 오인되지 않게
  // 머리말: <h1>…</h1><p>…</p>
  const head = src.match(/<h1>([^<]+)<\/h1>\s*<p>([^<{}]+)<\/p>/); if (head) facts.intro = oneLine(dec(head[2]));
  // 입력 라벨: <label …>텍스트<Input / <legend>텍스트</legend> / <Label …>텍스트</Label>
  const labels = [...jsx.matchAll(/<(?:label|Label|legend)\b[^>]*>\s*([^<{}]+?)\s*(?:<|\{)/g)].map(m => oneLine(dec(m[1]))).filter(ok);
  // 입력 칸의 aria-label(라벨 태그가 없는 입력창)도 화면 항목으로 센다
  const aria = [...jsx.matchAll(/<(?:Textarea|Input|Select|textarea|input|select)\b[^>]*?aria-label="([^"{}]+)"/g)].map(m => oneLine(dec(m[1]))).filter(ok);
  facts.inputs = [...new Set([...labels, ...aria])].filter(x => !/^(삭제|추가|초기화|복사|인쇄)$/.test(x));
  // 버튼 문구
  const btns = [...jsx.matchAll(/<Button\b[^>]*>([\s\S]*?)<\/Button>/g)].map(m => oneLine(dec(m[1].replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ')))).filter(ok);
  facts.actions = [...new Set(btns)];
  // 본문 문구: 구조 태그(h2·h3·p·li·dd·summary)의 정적 한국어 문장과 긴 문자열 상수(안내·FAQ)를 페이지 등장 순서대로.
  // 오류 메시지(throw/Error)·상태 알림·동적 값({…} 포함)은 제외한다. 인라인 태그는 벗겨 문장이 끊기지 않게 한다.
  const strip = src.replace(/throw new Error\([^)]*\)/g, '').replace(/new Error\([^)]*\)/g, '').replace(/<\/?(?:strong|b|em|i|code|a|span|mark|kbd)\b[^>]*>/g, '');
  const found = [];
  for (const m of strip.matchAll(/<(h2|h3|p|li|dd|summary)\b[^>]*>([^<]*)<\/\1>/g)) { const t = oneLine(dec(m[2])); if (!/[{}]/.test(t) && hasKo(t)) found.push([m.index, t, m[1].startsWith('h') || m[1] === 'summary' ? 'h' : 'p']); }
  for (const m of strip.matchAll(/['"`]([^'"`\n]{24,260})['"`]/g)) { const t = oneLine(m[1]); if (hasKo(t) && /[.!?]$/.test(t) && !/[{}$=]|=>|import|className|mcp|MCP|data-|^(http|\/)/.test(t)) found.push([m.index, t, 'p']); }
  found.sort((a, b) => a[0] - b[0]);
  const NOISE = /복사했어요|복사 권한|저장했어요|저장하지 못|실패했어요|오류가 |불러오지 못|다시 시도|^에서|에서도 확인|^(결과 복사|삭제|추가|초기화)$/;
  const seen = new Set(), blocks = [];
  for (const [, t0, kind] of found) {
    const t = t0.replace(/원문/g, '원본');
    if (seen.has(t) || NOISE.test(t) || t.length < 6 || t.length > 420) continue;
    if (kind === 'p' && t.length < 14) continue;
    seen.add(t); blocks.push({t: kind, text: t});
  }
  facts.blocks = blocks;
  // 화면 항목·버튼 문구에도 같은 정규화
  facts.inputs = facts.inputs.map(x => x.replace(/원문/g, '원본')); facts.actions = facts.actions.map(x => x.replace(/원문/g, '원본'));
  // MCP 도구 설명(무엇을 받아 무엇을 내놓는지)
  const mcp = src.match(/registerWebMcpTool\(\{[\s\S]*?description:\s*'([^']+)'/); if (mcp && hasKo(mcp[1])) facts.does = oneLine(mcp[1]);
  return facts;
}

// ── 소개글 자격(사실 분량) ─────────────────────────────────────────────
export const GATE = {gameMin: 170, toolMin: 300};
// 도구: 설명 + 머리말 + 본문 문장 + 화면 항목·버튼 문구의 합(중복 제거). 사용 방법(입력·버튼 또는 본문 문장)이 있어야 한다.
export function toolBodyChars(item, f) {
  const parts = new Set([item.description, f.intro, ...(f.blocks || []).map(b => b.text), ...(f.inputs || []), ...(f.actions || [])].filter(Boolean));
  return [...parts].join('').length;
}
export const toolEligible = (item, f) => (f.sources || []).length > 0 && toolBodyChars(item, f) >= GATE.toolMin && ((f.inputs || []).length + (f.actions || []).length + (f.blocks || []).length > 0);
export const gameHasDetail = f => !!((f.controlsDetail || []).length || (f.rules || []).length || (f.progress || []).length || (f.stageGuides || []).length || f.pitch || f.lead);
export const gameEligible = (g, f) => gameHasDetail(f) && gameFactChars(g, f) >= GATE.gameMin;
