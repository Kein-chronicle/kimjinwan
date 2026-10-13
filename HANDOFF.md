# HANDOFF — kimjinwan.com 콘텐츠 허브 (2026-10-14 새벽 마감 기준)

이어받으면 `git log --oneline -3`, `cat VERSION`, 서버 `readlink /var/www/kimjinwan/current` 로 일치부터 확인한다.

## 0. 지금 상태
| 대상 | 상태 |
|---|---|
| kimjinwan.com | **1.3.44** 라이브(서버 current 일치). 브랜치 `static-site-2026`, 푸시 완료, 작업트리 깨끗. 시험 194 통과 |
| 허브 섹션 | 블로그 206, 게임 소식 79, AI 활용 가이드 50, **웹게임 77**(전부 직접 플레이 소개), 웹 도구 45, **내 앱 50** |
| 발행 | `scripts/publish.sh` 가 유일한 길(`docs/PUBLISH.md`). 이번 밤 1.3.38~1.3.44 전부 이 스크립트로 발행 |
| blog.kimjinwan.com | 0.2.88, 글 285편 canonical 은 허브 주소. 서브도메인은 유지·동결(새 글 배포 안 함) |
| service.kimjinwan.com | Kein Journal 제거 완료(4bbba7e) |
| kein-blog | `editorial.mjs published` 가 허브 URL 검증(d6c6573), deploy.md 는 허브 발행으로 교체 |
| 공장 허브 | `blog` 잡 **비활성(enabled:false)**. 체커 content-hub-sync 폐지. `prompts/_content-hub.md` 가 publish.sh 호출 절차 |
| AdSense | kimjinwan.com 재등록·소유권 확인 후 **검토 요청은 유저가 눌렀다(10-13 밤)**, 결과 대기. 3회 거절 이력. 서브도메인 단독 등록 불가. 계정 조작은 에이전트가 하지 않는다 |
| ads.txt·app-ads.txt | 불변 SHA-256 `422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0`, 배포 전후 확인 |
| `wip/games-rewrite` | 옛 WIP. 필요한 건 main 에 이식 끝. **합치지 말 것**, 폐기 후보 |

## 1. 다음 작업(우선순위순)
1. **AdSense 결과 확인**(유저). 거절이면 사유를 보고 콘텐츠 보강 방향 결정.
2. **블로그 전환(F)**: 시험 글 1편을 `kein-blog automation/prompts/deploy.md` 5·6단계로 끝까지 공개(허브 발행+`published` 허브 URL 검증)해 확인 → 유저가 `factories.json` blog 잡 `enabled:true`(21:15). 체크리스트는 공장 허브 `docs/blog-hub-registration.md` §3-1.
3. **웹 도구 12개 소개 제외** 해소: 정적 문구 300자 미만(social-image-resizer, image-crop-rotate, photo-collage, image-redactor, metadata-remover, id-photo-maker, app-icon-generator, palette-extractor, signature-maker, pdf-organizer, qr-generator, device-mockup). 웹툴 공장에서 도구 페이지 정적 문구 보강 후 `hub_check_tool.mjs <slug>` → 발행.
4. **웹게임 보강**: pulse-bat·neon-beat-operator 는 클리어를 못 봐 "클리어 확인 못 함"으로 적었다. 사람이 클리어해 보강하면 좋다. 소리·터치·후반 스테이지는 게임마다 `verified.notes` 에 "확인 못 함"으로 남아 있다.
5. **수치 정합**: 홈 히어로(collections.json 웹게임 77·도구 57)와 허브 도구 45 불일치(3번이 풀리면 줄어듦).
6. **검색 정리**: 블로그 사이트맵에서 글 URL 제거 여부, Search Console·네이버·IndexNow 등록 정리, 옛 경로 301(nginx, `data/content-redirects.json` 83건 매핑만 있음).
7. 블로그 글 이미지가 blog.kimjinwan.com 절대 주소를 가리킨다 — 서브도메인을 끄는 날 허브 자체 호스팅으로 이전 필요.
8. 기즈모 스토어 AdSense 등록은 **보류**(상표 위험: 111퍼센트(주) 출원). 허브 링크는 허용. 공개 전 앱(Keeply·PicSell·Koefit)·심사 중 앱은 내 앱에 미포함(스토어 공개 후 `build_content_apps.mjs --refresh-store`).

## 2. 허브 편집 원본·점검 도구
- 게임 `data/authoring/games/<id>.json`(+진행표 `_progress.json`), 앱 `data/authoring/apps/<slug>.json`. 점검 `node scripts/hub_check_game.mjs <id> [--online] [--raw <캡처 폴더>]`, `hub_check_tool.mjs <slug>`, `hub_check_app.mjs <slug>`. 문서 `docs/AUTHORING_GAMES.md`·`AUTHORING_TOOLS.md`·`AUTHORING_APPS.md`·`PUBLISH.md`. 게임 캡처 원본은 `~/Projects/kein-game-forge/output/hub-captures/<id>/`(gitignore).
- 구조: 상단 메뉴 홈·서비스·AI 공장·경력(홈 섹션 스크롤)·연락하기 | 콘텐츠 허브·서비스 허브. 콘텐츠 서브 메뉴 전체/블로그/게임 소식/AI 활용 가이드/웹게임/웹 도구/내 앱. 상세 canonical 은 자기 자신, '원문' 링크 없음. 이미지 자체 호스팅.
- 이전 체커 문서 `docs/CONTENT_HUB_CHECKER.md` 는 폐지 안내만 남겼다.

## 3. 알려진 한계·미결정
- 허브 본문이 blog.kimjinwan.com·gizmo-store.com 과 같아 중복 판정 위험(canonical 정리로 블로그 쪽은 해소 중, gizmo-store 는 별도 도메인). AdSense 통과 보장 없음.

## 4. 운영 메모
- **배포(허브)**: `scripts/publish.sh --reason "..."` 하나뿐(`docs/PUBLISH.md`, 수동 배포 불필요). 접속 `ssh -i ~/kjw.pem ubuntu@54.116.13.147`, 릴리스 `/var/www/kimjinwan/releases/<V>`. **ads.txt·app-ads.txt 는 절대 수정 금지(sha256 `422f460a…49a0`), 배포 전후 라이브 해시 확인.** 생성물은 직접 고치지 않고 `node scripts/build.mjs`. 시험 `node --test tests/*.test.mjs`(194). 스크린샷은 로컬 `python3 -m http.server` + CDP(file:// 금지). PATH 에 `/opt/homebrew/bin` 필요.
- 블로그 서브도메인 배포는 동결(새 글은 허브 발행). 서비스 허브 배포: kimjinwan-services `bash deploy/deploy.sh`(`node scripts/build_share.mjs`, playwright 는 ~/Projects/docloom).
- 하위 에이전트는 순차로(유저 규칙), 컨텍스트가 길면 진행표 파일에 상태를 남기고 재개할 것.
- 이 문서의 위쪽 표가 최신 커밋 기준이다. 세션을 이어받으면 `git log --oneline -3`, `git branch -a`, 라이브 `readlink /var/www/kimjinwan/current` 로 일치부터 확인.
