# HANDOFF — kimjinwan.com 콘텐츠 허브 (2026-10-13 밤, 홀드)

유저 지시로 **웹게임 재작성을 중단하고 홀드**했다. 아래 순서대로 읽으면 이어갈 수 있다. 공장 정리 후 이어서 진행할 예정.

## 0. 지금 어디까지 왔나(라이브·커밋 기준)
| 대상 | 상태 | 커밋 |
|---|---|---|
| kimjinwan.com | **1.3.36 배포됨**(서버 `current`=releases/1.3.36). 메인 브랜치 `static-site-2026` 깨끗, 라이브와 동일 | kimjinwan `4c12af0` (푸시됨) |
| blog.kimjinwan.com | **0.2.88**: 한국어 글 285편 canonical·og:url·JSON-LD url 을 허브 정본 주소로 돌림(번역·목록·소개는 자기 주소). 서브도메인은 유지·동결. 사이트맵은 그대로(글 URL 포함) | kein-blog `b61e305` (푸시됨) |
| service.kimjinwan.com | **Kein Journal 제거**(13곳), 생성기 noscript 버그 수정. 옛 `/s/kein-journal/` 은 nginx SPA 폴백으로 홈을 200 반환(무해) | kimjinwan-services `4bbba7e` (푸시됨) |
| 공장 허브 | 블로그 글 등록 방식 변경 설계 문서(**구현 전**), `content-hub-sync`(매일 06:30) 등록됨 | kein-factory-hub `9a8d6cb`, 8d9bd2b (로컬, 원격 없음) |
| AdSense | kimjinwan.com **재등록·소유권 확인 완료, 검토 요청은 유저가 직접 눌렀다(2026-10-13 밤)**. 결과 대기. 기즈모 스토어는 등록 안 함 | — |
| WIP | 웹게임 재작성 중간 저장 브랜치 **`wip/games-rewrite`** (`6fde184`, 원격에 푸시) — **main 에 합치지 말 것** | |

AdSense 사실: 3회 거절(2026-10-04 정책 위반 / 이번 "가치가 별로 없는 콘텐츠"). **서브도메인은 AdSense 에서 따로 등록 불가**("URL은 올바른 최상위 도메인이어야 합니다")하고 루트에 합쳐 본다 → 허브(kimjinwan.com)가 읽을 거리를 직접 갖는 구조로 가는 것이 이번 작업의 이유. 계정 조작(검토 요청 등)은 에이전트가 하지 않는다.

## 1. 허브 구조 요약(/content/, 456쪽)
서브 메뉴: 전체 / 블로그(이야기·에이전트 업무일지(slug ai)·앱 제작·심사 206편) / 게임 소식(/content/game-news/, 게임별 서브카테고리, 79편) / AI 활용 가이드(/content/gizmo/, 50개, 프롬프트 전문+복사하기+다운로드→gizmo-store) / 웹게임(15) / 웹 도구(45). 상단 메뉴: 홈 · 서비스 · AI 공장 · 경력(홈 섹션 스크롤, js/nav-spy.js) · 연락하기 | 콘텐츠 허브 · 서비스 허브(구 서비스 모아보기, 점선 알약). 상세 canonical 은 자기 자신, '원문' 링크 없음(허브가 오리지널). 이미지는 허브 자체 호스팅(assets/content/). 자세한 URL 체계·체커는 `docs/CONTENT_HUB_CHECKER.md`, 배포 절차는 `DEPLOYMENT.md` 상단.

## 2. 홀드된 작업(우선순위순)
### A. 웹게임 77종 직접 확인·소개 전면 재작성 — `wip/games-rewrite`
- 목표: 지금 소스 문서에서 사실을 뽑아 15개만 실려 있다(제외 62개). 게임을 **직접 실행·관찰**해 내 말로 소개를 쓰고 모든 확인 가능한 웹게임(legacy 1개 제외 약 77개)에 상세 페이지를 준다. 편집 원본 = `data/authoring/games/<id>.json`(소개 필드 + `verified:{date,method,notes}` + 이미지 목록·alt), 진행표 `data/authoring/games/_progress.json`(완료=파일 존재, 제외=excluded[]).
- 완료: 3개(`clockwork-harbor`, `aim-trainer`, `arc-eel`). 나머지 74개 대기. 속도: 게임당 수 분 → 전체 몇 시간.
- 방법(그대로 지킬 것): 로컬 빌드(`~/Projects/kein-web-games/published-games/<slug>`) 또는 라이브 `https://games.kimjinwan.com/play/<id>/` 를 헤드리스 Chrome+CDP(`--remote-debugging-port`, `--remote-allow-origins=*`, page 타입 target, websocket-client `suppress_origin`)로 열어 타이틀·플레이 중·결과 화면 캡처, 키보드/마우스/터치 입력으로 실제 플레이, DOM 텍스트 수집. **관찰로 확인된 것만** 쓴다(허위 금지). 안 되는 게임은 제외하고 증거 기록. 소개: 한 줄 소개·어떤 게임인지(3~5문장)·조작(PC/터치)·목표와 규칙·진행·팁 2~3·플레이 화면 설명, **본문 500자 이상**, 게임마다 문장이 달라야 함(템플릿 복붙 금지), '제가·저는'·이모지·'원문'·'기즈모' 금지. 이미지는 플레이 화면 2~4장, 카드 640×400 webp·상세 ≤1280폭 ≤150KB, alt 필수, 서브도메인 핫링크 금지.
- WIP 브랜치 상태: 생성기 `scripts/build_content_games.mjs`·`scripts/lib/games_authoring.mjs` 가 편집 원본을 읽는다(구 추출 로직 교체 중). 빌드·테스트 149 통과하지만 **기존 15개 중 12개 이미지가 삭제된 상태(웹게임 3개만 남음)** — 전부 채우기 전에는 배포하지 말 것.
- 남은 일: 74개 작성, `docs/AUTHORING_GAMES.md`(필드 정의·작성 기준·새 게임 추가 절차) 작성, 테스트(장르·한 페이지·본문 하한·게임 간 중복률·이미지·verified), 랜딩·서브메뉴·사이트맵·JSON-LD·홈 수치 갱신, VERSION 1.3.37, DEPLOYMENT.md '1.3.37 배포 대기' 단락. 중간 배포를 하려면 완료분만 반영하되 기존 15개를 줄이지 않도록 구 소스 폴백을 유지하거나 완료 20개 이상일 때 배포.
- **06:30 `content-hub-sync` 와 충돌 주의**: 체커는 `~/Projects/kimjinwan` 작업트리에서 `static-site-2026` 이 깨끗하다고 가정한다. WIP 는 `git worktree add ~/Projects/kimjinwan-wip wip/games-rewrite` 로 **별도 작업트리**에서 이어가라(같은 폴더에서 브랜치를 바꾼 채 06:30 을 맞지 말 것).

### B. 서비스 페이지(/works/·홈)에서 Kein Journal 제거 — 일부 진행(WIP 브랜치에 data/services.json 삭제만 있음)
- 해야 할 일: `data/services.json` 에서 id `kein-journal` 삭제 + 전용 에셋(assets/services/kein-journal.*) 삭제, 서비스 수 14→13 반영(홈·/works/ 메타, `scripts/lib/og.mjs` pageMeta, 홈 JSON-LD ItemList numberOfItems·relatedLink 에서 blog.kimjinwan.com, 히어로/카드 문구), '게임·도구·글' 같은 블로그 암시 분류 라벨 정리(Kein Games·Kein Tools 카드는 유지), `collections.json` 의 제작 기록 블로그 행이 /works/ 에 나오는지 확인, 공유 카드 재생성(`node scripts/build_og.mjs` → 해시 변동 확인), 테스트(서비스 수 기대값·og lock) 갱신. `/content/` 하위와 콘텐츠 허브 문구는 건드리지 않는다. 서비스 허브 사이트(kimjinwan-services)는 이미 제거해 배포함.
- 작게 독립된 작업이라 **main 에서 따로 해서 먼저 1.3.37 로 배포해도 된다**(웹게임 WIP 와 분리). 그 경우 WIP 브랜치는 main 을 rebase.

### C. '내 앱' 카테고리 신설(웹 도구와 분리) — 미착수
- 유저 결정: 팩토리 밖 앱도 전부 포함, **이미지는 알아서 구해서** 넣는다. 카테고리별 목록 형태를 다르게(앱 = 아이콘 + 스크린샷 스트립 + 스토어 상태 카드, 웹게임 = 큰 썸네일 카드, 웹 도구 = 조밀 그리드, 블로그 = 텍스트 리스트).
- 소스: `~/Projects/app-factory/catalog/` 앱 52개(아이콘 `icon.png`·소개 이미지 `intro/01~03.jpg` 있는 것 48개), `apps/REGISTRY.json`(이름·번들 ID), `LISTING.json`(스토어 설명문), `ACTUALS.json`(스토어 상태), `REGISTRATION.json`. 팩토리 밖: Whale Survivors, PicSell(SellerPhotoTool), Keeply, 코에핏(Koefit) 등 + Faith factory(`~/Projects/af-faith`) 앱들 — 후보를 먼저 조사해 보고하고 범위 확정.
- 서브 메뉴에 '내 앱' 추가(구현은 확장 가능하게 돼 있음), 상세 `/content/apps/<id>/`(경로 충돌 주의: 현재 `/content/blog/apps/` 와 별개), 이미지 자체 호스팅, 스토어 링크 버튼('App Store에서 보기'), 사실 기반 소개(지어내기 금지).

### D. 허브에서 글을 직접 작성·발행하는 구조(공장 쪽) — 설계만 완료
- 설계 문서: `~/Projects/kein-factory-hub/docs/blog-hub-registration.md`(옛 방식 vs 새 방식, 단계 A~F, 위험). **전환 전에는 `prompts/blog.md`·kein-blog `automation/prompts/deploy.md` 를 바꾸지 말 것** — 매일 21:15 `blog` 잡이 옛 방식(블로그 서브도메인 배포, `published` 가 blog URL 검증)으로 계속 돈다. 구현 순서: 허브 배포 스크립트 → 입력 계약 → `editorial.mjs published` 허브 URL 검증 → 배포 문서·프롬프트 교체 → 시험 글 1편 → 전환.
- content-hub-sync(06:30) 는 지금 블로그 `dist` → 허브 스냅샷 → 빌드·시험 → 배포 → 롤백까지 하는 체커다(`~/Projects/kein-factory-hub/prompts/content-hub-sync.md`, `docs/CONTENT_HUB_CHECKER.md`). 소스에 웹게임·웹 도구가 들어가므로 WIP A/C 가 반영되면 이 문서·프롬프트도 갱신.

## 3. 알려진 한계·미결정
- 웹게임 목록이 짧다(15/77). 홈 히어로(collections.json 웹게임 77·도구 57)와 허브(15·45) 수치가 다르다.
- 옛 허브 경로(`/content/blog/games/…`, `/content/services/…`)는 404. 옛→새 매핑은 `data/content-redirects.json`(83건) — nginx 301 은 아직 안 만듦.
- 블로그 사이트맵에 글 URL 이 남아 있어 canonical(허브)과 약한 불일치. 검색 반영이 느리면 글 URL 을 사이트맵에서 빼기.
- 블로그 본문 이미지는 blog.kimjinwan.com 을 가리킨다(서브도메인을 끄는 날에는 허브로 옮겨야 함).
- 허브 본문이 blog.kimjinwan.com·gizmo-store.com 과 같아 중복 판정 위험(canonical 정리로 블로그 쪽은 해소 중, gizmo-store 는 별도 도메인). AdSense 통과 보장 없음.
- 기즈모 스토어는 AdSense 등록 보류(상표 위험: 111퍼센트(주) 출원). 허브는 '다운로드'·복사 버튼으로만 연결.

## 4. 운영 메모
- **배포(허브)**: `DEPLOYMENT.md` 상단 + 요약 — 허용 목록(index.html works factories career content css js assets game favicon* apple-touch-icon.png manifest.json robots.txt sitemap.xml ads.txt app-ads.txt)만 스테이징 → rsync 로 `ubuntu@54.116.13.147:/tmp/kj-<V>` → `sudo mv` `/var/www/kimjinwan/releases/<V>`, chown root, 디렉터리 755·파일 644 → `sudo ln -sfn releases/<V> current.new && sudo mv -T current.new current`. 접속 `ssh -i ~/kjw.pem`. **ads.txt·app-ads.txt 는 절대 수정 금지(sha256 `422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0`), 배포 전후 라이브 해시 확인.** 생성물은 직접 고치지 않고 `node scripts/build.mjs`. 검증: `node --test tests/*.test.mjs`(현재 149), 헤드리스 Chrome 스크린샷(로컬 `python3 -m http.server` + CDP; file:// 은 절대경로 CSS 가 깨진다).
- 블로그 배포: kein-blog `automation/prompts/deploy.md`(VERSION +1 → operations.md 한 단락 → 커밋 → `git push origin main` → rsync to /var/www/kein-blog/releases/<V> → `current` 전환 → 해시 대조). 서비스 허브 배포: kimjinwan-services `bash deploy/deploy.sh`(사이트 재생성은 `node scripts/build_share.mjs`, playwright 는 ~/Projects/docloom 사용).
- 하위 에이전트는 순차로(유저 규칙), 컨텍스트가 길면 진행표 파일에 상태를 남기고 재개할 것.
- 이 문서의 위쪽 표가 최신 커밋 기준이다. 세션을 이어받으면 `git log --oneline -3`, `git branch -a`, 라이브 `readlink /var/www/kimjinwan/current` 로 일치부터 확인.
