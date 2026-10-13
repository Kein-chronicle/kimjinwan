# 콘텐츠 허브 동기화 체커 — 공장 허브에 넣을 내용

작성: 2026-10-13. 대상: kimjinwan.com `/content/`(블로그·기즈모 스토어·서비스 본문을 허브 도메인 안에서 읽게 하는 페이지, 398쪽).
이 문서는 **공장 허브(~/Projects/kein-factory-hub)에 체커를 등록할 때 쓸 내용**이다. 허브에는 아직 등록하지 않았다.
등록하려면 아래 1) 을 `factories.json` 의 jobs 에, 2) 를 `prompts/content-hub-sync.md` 로 넣는다.

## 왜 필요한가
허브 `/content/` 는 스냅샷(`content-src/`)을 빌드한 정적 페이지라서, 블로그 글·기즈모 항목·서비스가 새로 등록돼도 **생성기를 돌리고 빌드·배포하기 전에는 반영되지 않는다.** 이 체커가 그 일을 매일 한 번 대신한다.
웹 도구·웹게임은 상세 페이지 없이 대표 12개만 링크로 싣고 있어 이 체커의 범위 밖이다(범위 확장은 별도 결정).

## 1) 잡 등록(factories.json 의 jobs 에 추가)
```json
{
  "id": "content-hub-sync",
  "factory": "kein-blog",
  "kind": "checker",
  "enabled": true,
  "schedule": {"daily": ["06:20"]},
  "limit_min": 25,
  "model": "@worker",
  "prompt": "prompts/content-hub-sync.md",
  "cwd": "~/Projects/kimjinwan",
  "add_dirs": ["~/Projects/kein-blog", "~/Projects/kimjinwan-services", "~/Projects/gizmo-store"],
  "browser": false,
  "require_clean": true
}
```
- `factory` 는 허브에 이미 있는 항목(여기서는 블로그 쪽) 중 맞는 것으로 고른다. 새 공장 항목을 만들면 거기에 맞춘다.
- 시각은 블로그 발행 작업 뒤로 둔다(블로그 빌드 `dist/` 가 끝난 뒤에 읽어야 한다). 허브 시간표에서 블로그 슬롯 뒤로 조정한다.
- `require_clean`: 저장소 작업트리가 깨끗해야 시작한다. **1.3.33~1.3.34 변경은 아직 커밋 전이므로 먼저 커밋해야 한다.**
- 서비스 모아보기(kimjinwan-services)·기즈모 스토어 소스는 읽기만 한다.

## 2) 프롬프트(prompts/content-hub-sync.md 본문)

```
# content-hub-sync 체커 — kimjinwan.com 콘텐츠 허브 동기화

대상 저장소: /Users/kein/Projects/kimjinwan (브랜치 static-site-2026). 소스(읽기 전용): kein-blog/web/dist, kimjinwan-services, https://gizmo-store.com/api/v1/items.
먼저 README.md, DEPLOYMENT.md 상단 두 단락, docs/CONTENT_HUB_CHECKER.md 를 읽고 그 규칙을 그대로 따른다.

절대 규칙
- ads.txt·app-ads.txt 는 수정하지 않는다(SHA-256 422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0). 배포 전·후 서버 릴리스와 라이브 응답 모두에서 확인한다.
- 생성물(index.html, works/, factories/, career/, content/, sitemap.xml)은 직접 고치지 않고 build 로만 갱신한다.
- 허브 본문은 오리지널로 취급한다: /content/ 하위 어디에도 '원문' 링크·'원문:' 표기·'사본'·'미러' 문구를 넣지 않는다. 상세 canonical 은 자기 자신이다.
- AdSense 계정 조작(사이트 추가·삭제·검토 요청·설정)은 하지 않는다. 필요해 보이면 waiting 에 올린다.
- 하위 에이전트를 띄우지 않는다. 순차 진행.

절차
1. 잠금·상태 확인: 작업트리가 깨끗한지(git status) 확인한다. 더러우면 failed(원인 적기). 같은 시각 다른 배포가 진행 중이면(서버 releases 에 이번 버전 디렉터리가 이미 있으면) 건드리지 말고 nothing_to_do 로 보고한다.
2. 변경 감지: `node scripts/build_content_hub.mjs --check` 실행. "up to date" 이면 라이브 생존 확인(아래 7번 중 1~3)만 하고 outcome=nothing_to_do 로 끝낸다.
3. 스냅샷 갱신: 오늘(KST) 날짜로 `node scripts/build_content_hub.mjs --as-of YYYY-MM-DD`. 소스 접근 실패(네트워크·dist 부재)면 생성기가 기존 파일을 보존하고 실패한다 — 그 경우 failed 로 보고하고 중단(배포 금지).
4. 변동 게이트: 갱신 diff 에서 섹션별(블로그·기즈모·서비스) 추가·삭제·수정 건수를 센다.
   - 어느 섹션이든 감소가 있거나(삭제·draft 전환) 한 번에 20건 넘게 변하면 자동 반영하지 않고 waiting 에 "변동 확인 필요: 섹션·건수·대표 3건"을 올린 뒤 변경을 되돌린다(git checkout 으로 content-src·data 복원).
   - 추가만 있고 20건 이하이면 계속한다.
5. 신규 항목 품질: 신규 블로그 글은 본문 1,500자 이상·설명 비어 있지 않음, 기즈모 text 항목은 프롬프트 전문 100자 이상(없는 web 항목은 설명·사용 방법 있음). 기준 미달 항목은 생성기가 거르게 하고 건수와 slug 를 summary 에 적는다.
6. 빌드·시험: `node scripts/build.mjs && node --test tests/*.test.mjs` 전부 통과해야 한다. 하나라도 실패하면 배포하지 않고 failed(실패한 테스트명 적기). 변경은 되돌린다.
7. 배포(DEPLOYMENT.md 의 절차 그대로): VERSION 패치 +1 → DEPLOYMENT.md 맨 위에 배포 기록 한 단락 추가 → 커밋 → 공개 허용 목록(index.html works factories career content css js assets game favicon* apple-touch-icon.png manifest.json robots.txt sitemap.xml ads.txt app-ads.txt)만 스테이징 → rsync 로 서버 /tmp 업로드 → sudo mv 로 /var/www/kimjinwan/releases/<VERSION> → chown root, 디렉터리 755·파일 644 → `sudo ln -sfn releases/<VERSION> current.new && sudo mv -T current.new current`. 직전 릴리스는 복구용으로 남기고, 5개를 넘는 옛 릴리스만 삭제한다. 접속: ssh -i ~/kjw.pem ubuntu@54.116.13.147.
8. 배포 검증(전부 통과해야 done):
   (1) `/`·`/works/`·`/factories/`·`/career/`·`/game/`·`/content/` 가 200.
   (2) 이번에 추가된 항목 상세 최대 3개가 200이고 본문 길이가 로컬과 같다(라이브 HTML SHA-256 == 로컬).
   (3) sitemap.xml 에 새 URL 이 있고 `/content/` 하위 모든 페이지와 일치한다.
   (4) ads.txt·app-ads.txt 해시가 서버 릴리스와 라이브 모두 위 값과 같다.
   (5) /content/ 아래 canonical 이 전부 자기 URL, '원문' 링크·표기 없음(테스트가 이미 검사하므로 라이브 샘플 3쪽만 확인).
   하나라도 실패하면 즉시 `current` 를 직전 릴리스로 되돌리고(같은 sudo ln -sfn / mv -T) 되돌린 뒤 같은 검증을 다시 해 failed 로 보고한다.
9. 결과: outcome=done(추가·수정 건수와 새 VERSION, 커밋 해시), 변경 없으면 nothing_to_do, 게이트·사람 판단이 필요하면 waiting_human. outputs 에는 kind=commit 으로 커밋을 적는다.
```

## 3) 동작 요약(운영자용)
| 상황 | 결과 |
|---|---|
| 변경 없음 | `nothing_to_do` (라이브 생존만 확인) |
| 신규 추가만, 20건 이하, 시험·검증 통과 | 자동 배포 후 `done` |
| 삭제·감소 또는 20건 초과 변동 | 변경 되돌리고 `waiting_human` |
| 소스 접근 실패·시험 실패·검증 실패 | `failed`, 배포했다면 직전 릴리스로 롤백 |

## 4) 알아둘 한계
- 웹 도구 57개·웹게임 78개는 대표 12개 링크뿐이라 새로 등록돼도 허브에 상세가 생기지 않는다.
- 블로그와 기즈모 본문이 원 사이트와 같아 중복 콘텐츠로 볼 수 있다(허브를 오리지널로 취급하는 결정의 대가).
- 서버 접속·sudo·rsync 는 이 PC 에서만 된다. 허브가 이 PC 에서 돌 때만 동작한다.
- 블로그 발행과 동시에 `dist/` 가 빌드 중이면 일부 글이 빠질 수 있다. 4번 변동 게이트가 감소를 잡아 멈춘다.
