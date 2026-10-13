#!/usr/bin/env bash
# scripts/publish.sh — kimjinwan.com 허브 발행(빌드 → 시험 → 변동 게이트 → 커밋 → 배포 → 검증 → 실패 시 롤백)
#
#   cd ~/Projects/kimjinwan && scripts/publish.sh --reason "게임 <id> 허브 등록"
#   scripts/publish.sh --reason "..." --dry-run      # 업로드·전환·커밋 없이 끝까지 점검하고 작업트리를 원상복구
#
# 호출자: 게임 포지·웹툴 공장(허브 등록 직후), 기즈모 스토어 글 등록, 사람. 자세한 규칙은 docs/PUBLISH.md.
# 종료 코드: 0 발행함 · 10 바꿀 게 없음(nothing_to_do) · 75 다른 발행 진행 중 · 2 시작 조건 위반(더러운 작업트리·브랜치)
#            3 변동 게이트에 걸려 되돌림(사람 확인 필요) · 4 시험 실패(되돌림) · 5 배포 검증 실패(롤백함) · 6 서버 사전 점검 실패
set -uo pipefail

REASON=""; DRY=0; FORCE=0; NO_PUSH=0; AS_OF="$(date +%F)"
while [ $# -gt 0 ]; do
  case "$1" in
    --reason) REASON="${2:-}"; shift 2;;
    --dry-run) DRY=1; shift;;
    --force) FORCE=1; shift;;          # 소스 변화가 없어도 빌드·배포(점검용)
    --no-push) NO_PUSH=1; shift;;
    --as-of) AS_OF="${2:-}"; shift 2;;
    -h|--help) sed -n 2,12p "$0"; exit 0;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 2;;
  esac
done
[ -n "$REASON" ] || REASON="허브 발행"

export PATH=/opt/homebrew/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
BRANCH=static-site-2026
SRV=ubuntu@54.116.13.147; KEY="$HOME/kjw.pem"; REL=/var/www/kimjinwan
ADS_SHA=422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0
LOCK=/tmp/kimjinwan-publish.lock
LOG="/tmp/kimjinwan-publish-$(date +%Y%m%d-%H%M%S).log"
say() { echo "[publish] $*" | tee -a "$LOG"; }
ssh_() { ssh -i "$KEY" -o BatchMode=yes -o ConnectTimeout=10 "$SRV" "$@"; }

# ---- 잠금(원자적 mkdir). 살아 있는 소유자가 있으면 건드리지 않는다 ----
if ! mkdir "$LOCK" 2>/dev/null; then
  OWNER="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$OWNER" ] && kill -0 "$OWNER" 2>/dev/null; then say "다른 발행이 진행 중이다(pid $OWNER, $(cat "$LOCK/reason" 2>/dev/null)). 이번 요청은 건너뛴다."; exit 75; fi
  say "죽은 소유자의 낡은 잠금을 치운다"; rm -rf "$LOCK"; mkdir "$LOCK" || exit 75
fi
echo $$ > "$LOCK/pid"; echo "$REASON" > "$LOCK/reason"

restore() { git reset -q --hard HEAD && git clean -fdq; }          # 시작 때 깨끗했던 작업트리로만 쓴다
cleanup() { rm -rf "$LOCK"; [ -n "${STAGE:-}" ] && rm -rf "$STAGE"; }
trap cleanup EXIT

# ---- 1. 시작 조건 ----
[ "$(git branch --show-current)" = "$BRANCH" ] || { say "브랜치가 $BRANCH 가 아니다: $(git branch --show-current)"; exit 2; }
if [ -n "$(git status --porcelain)" ]; then say "작업트리가 깨끗하지 않다. 먼저 커밋하거나 정리해야 한다:"; git status --short | head -15 | tee -a "$LOG"; exit 2; fi
say "시작: $REASON (as-of $AS_OF, dry-run=$DRY)"; HEAD0="$(git rev-parse --short HEAD)"; V0="$(cat VERSION)"

# ---- 2. 소스 스냅샷 → 빌드 ----
node -e "const d=JSON.parse(require('fs').readFileSync('data/content-hub.json','utf8'));console.log(JSON.stringify(Object.fromEntries(d.sections.map(s=>[s.id,s.count.value]))))" > /tmp/kj-pub-before.json 2>/dev/null || echo '{}' > /tmp/kj-pub-before.json
if ! node scripts/build_content_hub.mjs --as-of "$AS_OF" >>"$LOG" 2>&1; then say "스냅샷 생성 실패(소스 접근/검증) — 변경을 되돌리고 멈춘다. 로그: $LOG"; restore; exit 4; fi
node scripts/build_content_images.mjs >>"$LOG" 2>&1 || { say "이미지 생성 실패 — 로그: $LOG"; restore; exit 4; }
node scripts/build.mjs >>"$LOG" 2>&1 || { say "빌드 실패 — 로그: $LOG"; restore; exit 4; }
# 공유 카드 문구에 글 편수가 들어 있다(og-cards.lock.json). 새 글이 들어오면 문구가 바뀌므로 카드를 다시 만들고(바뀐 카드만 PNG 가 달라진다) 해시를 반영해 다시 빌드한다.
node scripts/build_og.mjs >>"$LOG" 2>&1 || { say "공유 카드 생성 실패 — 로그: $LOG"; restore; exit 4; }
node scripts/build.mjs >>"$LOG" 2>&1 || { say "카드 반영 빌드 실패 — 로그: $LOG"; restore; exit 4; }
if [ -z "$(git status --porcelain)" ] && [ "$FORCE" -eq 0 ]; then say "바꿀 게 없다(nothing_to_do)."; exit 10; fi

# ---- 3. 변동 게이트(감소 또는 한 섹션 +20 초과면 자동 반영하지 않는다) ----
GATE="$(node -e "
const fs=require('fs');const b=JSON.parse(fs.readFileSync('/tmp/kj-pub-before.json','utf8'));
const d=JSON.parse(fs.readFileSync('data/content-hub.json','utf8'));const a=Object.fromEntries(d.sections.map(s=>[s.id,s.count.value]));
const bad=[];for(const k of Object.keys(a)){const x=a[k]-(b[k]??a[k]);if(x<0)bad.push(k+' 감소 '+x);else if(x>20)bad.push(k+' +'+x+' (20 초과)');}
console.log(bad.join('; '));")"
if [ -n "$GATE" ] && [ "$FORCE" -eq 0 ]; then say "변동 게이트: $GATE — 되돌리고 멈춘다(사람 확인 필요)."; restore; exit 3; fi

# ---- 4. 시험 ----
if ! node --test tests/*.test.mjs >>"$LOG" 2>&1; then say "시험 실패 — 되돌리고 멈춘다. 실패 항목: $(grep -E '^✖' "$LOG" | head -5 | tr '\n' ' ')"; restore; exit 4; fi
say "시험 통과: $(grep -E '^ℹ (tests|pass|fail)' "$LOG" | tail -3 | tr '\n' ' ')"
[ "$(shasum -a 256 ads.txt | cut -d' ' -f1)" = "$ADS_SHA" ] && [ "$(shasum -a 256 app-ads.txt | cut -d' ' -f1)" = "$ADS_SHA" ] || { say "ads.txt/app-ads.txt 가 바뀌었다 — 되돌리고 멈춘다"; restore; exit 3; }

# ---- 5. 서버 사전 점검 ----
V1="$(node -e "const [a,b,c]=process.argv[1].split('.').map(Number);console.log([a,b,c+1].join('.'))" "$V0")"
CUR="$(ssh_ "readlink $REL/current" 2>>"$LOG")" || { say "서버 접속 실패(ssh) — 되돌리고 멈춘다"; restore; exit 6; }
ssh_ "test ! -e $REL/releases/$V1" || { say "서버에 releases/$V1 이 이미 있다 — 되돌리고 멈춘다"; restore; exit 6; }
say "서버 현재 릴리스: $CUR → 새 릴리스 $V1"

STAGE="$(mktemp -d /tmp/kj-stage.XXXXXX)"
rsync -a --exclude='.DS_Store' index.html works factories career content css js assets game favicon* apple-touch-icon.png manifest.json robots.txt sitemap.xml ads.txt app-ads.txt "$STAGE/" >>"$LOG" 2>&1
say "스테이징 $(find "$STAGE" -type f | wc -l | tr -d ' ')개 파일, $(du -sh "$STAGE" | cut -f1)"
if [ "$DRY" -eq 1 ]; then say "dry-run 끝 — 업로드·전환·커밋 없이 작업트리를 원상복구한다. 로그: $LOG"; restore; exit 0; fi

# ---- 6. 버전·기록·커밋(배포 전에 만들어 배포본과 커밋을 일치시킨다) ----
echo "$V1" > VERSION
node scripts/build.mjs >>"$LOG" 2>&1 || { say "버전 반영 빌드 실패"; restore; exit 4; }
rsync -a --delete --exclude='.DS_Store' VERSION index.html works factories career content css js assets game favicon* apple-touch-icon.png manifest.json robots.txt sitemap.xml ads.txt app-ads.txt "$STAGE/" >>"$LOG" 2>&1
python3 - "$V1" "$REASON" "$AS_OF" "$V0" <<'PY'
import sys
v,reason,asof,prev=sys.argv[1:5]
p='DEPLOYMENT.md'; s=open(p).read()
add=f"## {v} 발행 기록 — {asof}\n\n자동 발행(scripts/publish.sh): {reason}. 시험 통과·ads.txt 해시 불변 확인 후 배포했다. 직전 {prev} 는 복구용 유지.\n\n"
i=s.index('\n## ')+1
open(p,'w').write(s[:i]+add+s[i:])
PY
git add -A && git commit -q -m "publish: $REASON ($V1)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" || { say "커밋 실패"; restore; exit 4; }
[ "$NO_PUSH" -eq 1 ] || git push -q origin "$BRANCH" >>"$LOG" 2>&1 || say "경고: 푸시 실패(배포는 계속, 나중에 push 필요)"

# ---- 7. 배포 ----
rsync -a -e "ssh -i $KEY" --delete "$STAGE/" "$SRV:/tmp/kj-$V1/" >>"$LOG" 2>&1 || { say "업로드 실패 — 커밋을 되돌린다"; git reset -q --hard "$HEAD0"; exit 5; }
ssh_ "set -e; sudo mv /tmp/kj-$V1 $REL/releases/$V1; sudo chown -R root:root $REL/releases/$V1; sudo find $REL/releases/$V1 -type d -exec chmod 755 {} +; sudo find $REL/releases/$V1 -type f -exec chmod 644 {} +; [ \"\$(sha256sum $REL/releases/$V1/ads.txt | cut -d' ' -f1)\" = $ADS_SHA ]; [ \"\$(sha256sum $REL/releases/$V1/app-ads.txt | cut -d' ' -f1)\" = $ADS_SHA ]; cd $REL; sudo ln -sfn releases/$V1 current.new; sudo mv -T current.new current" >>"$LOG" 2>&1 \
  || { say "서버 반영 실패 — 롤백 시도"; ssh_ "cd $REL && sudo ln -sfn $CUR current.new && sudo mv -T current.new current" >>"$LOG" 2>&1; exit 5; }

# ---- 8. 검증(실패하면 즉시 롤백) ----
FAIL=""
for p in / /works/ /factories/ /career/ /game/ /content/ /content/games/ /content/tools/ /content/apps/ /content/column/ /content/game-news/ /content/blog/ /content/gizmo/ /sitemap.xml /ads.txt /app-ads.txt; do
  c="$(curl -s -o /dev/null -w '%{http_code}' "https://kimjinwan.com$p")"; [ "$c" = 200 ] || FAIL="$FAIL $c:$p"
done
for p in "" content/ content/games/; do
  l="$(curl -s "https://kimjinwan.com/$p" | shasum -a 256 | cut -c1-12)"; f="$(shasum -a 256 "${p}index.html" | cut -c1-12)"; [ "$l" = "$f" ] || FAIL="$FAIL 해시불일치:/$p"
done
for u in ads.txt app-ads.txt; do [ "$(curl -s "https://kimjinwan.com/$u" | shasum -a 256 | cut -d' ' -f1)" = "$ADS_SHA" ] || FAIL="$FAIL ads해시:$u"; done
for f in $(git diff --name-only "$HEAD0" HEAD -- 'content/*/index.html' 'content/*/*/index.html' 2>/dev/null | head -3); do
  l="$(curl -s "https://kimjinwan.com/${f%index.html}" | shasum -a 256 | cut -c1-12)"; k="$(shasum -a 256 "$f" | cut -c1-12)"; [ "$l" = "$k" ] || FAIL="$FAIL 변경페이지해시:${f%index.html}"
done
if [ -n "$FAIL" ]; then
  say "검증 실패:$FAIL — 직전 릴리스($CUR)로 롤백"
  ssh_ "cd $REL && sudo ln -sfn $CUR current.new && sudo mv -T current.new current" >>"$LOG" 2>&1
  c="$(curl -s -o /dev/null -w '%{http_code}' https://kimjinwan.com/)"; say "롤백 후 홈 $c. 커밋 $V1 은 남아 있다(원인 확인 후 수정 커밋 필요). 로그: $LOG"; exit 5
fi

# ---- 9. 옛 릴리스 정리(최근 6개만 남김, current·직전은 절대 지우지 않음) ----
ssh_ "cd $REL/releases && cur=\$(readlink $REL/current | sed 's#.*/##') && ls | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\$' | sort -V | head -n -6 | grep -v -x \"\$cur\" | while read d; do sudo rm -rf \"\$d\"; done" >>"$LOG" 2>&1 || true
say "발행 완료: $V1 ($(git rev-parse --short HEAD)). 로그: $LOG"
exit 0
