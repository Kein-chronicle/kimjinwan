// scripts/lib/check_report.mjs — 점검 CLI(hub_check_game / hub_check_tool)의 체크리스트 출력. 사람이 읽는 표 + --json.
export class Report {
  constructor(title) { this.title = title; this.items = []; this.next = []; }
  // status: ok | fail | warn | skip | info
  add(status, label, detail = '', hint = '') { this.items.push({status, label, detail, hint}); if (hint && status === 'fail') this.next.push(hint); return this; }
  get failed() { return this.items.some(i => i.status === 'fail'); }
  toJSON(extra = {}) { return {title: this.title, ok: !this.failed, ...extra, checks: this.items, next: [...new Set(this.next)]}; }
  text(extra = '') {
    const TAG = {ok: '[통과]', fail: '[실패]', warn: '[주의]', skip: '[건너뜀]', info: '[안내]'};
    const lines = [this.title, ''];
    for (const i of this.items) {
      lines.push(`${TAG[i.status]} ${i.label}${i.detail ? ' — ' + i.detail : ''}`);
      if (i.hint && i.status === 'warn') lines.push(`        → ${i.hint}`);
    }
    lines.push('', this.failed ? `결과: 실패 (${this.items.filter(i => i.status === 'fail').length}건)` : '결과: 통과');
    if (extra) lines.push(extra);
    if (this.failed && this.next.length) lines.push('', '다음 행동:', ...[...new Set(this.next)].map((h, n) => `  ${n + 1}. ${h}`));
    return lines.join('\n');
  }
}
export const parseArgs = (argv, valueFlags = [], boolFlags = []) => {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (valueFlags.includes(a)) out[a.slice(2)] = argv[++i];
    else if (boolFlags.includes(a)) out[a.slice(2)] = true;
    else if (a.startsWith('--')) { out.unknown = (out.unknown || []).concat(a); }
    else out._.push(a);
  }
  return out;
};
