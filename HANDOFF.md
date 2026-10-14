# HANDOFF — kimjinwan.com 콘텐츠 허브 (2026-10-14, 블로그 서브도메인 0.2.99 정리 배포 완료)

이어받으면 `git log --oneline -3`, `cat VERSION`, 서버 `ssh -i ~/kjw.pem ubuntu@54.116.13.147 readlink /var/www/kimjinwan/current` 로 일치부터 확인한다. 작업 파일이 어디 있는지는 이 문서 §0 표, 작업 지침은 §1.

## 0. 지금 상태
| 대상 | 상태 |
|---|---|
| kimjinwan.com | **1.3.81** 라이브(서버 current 일치). 브랜치 `static-site-2026`, 푸시 완료, 작업트리 깨끗 |
| 허브 섹션(서브 메뉴 순서) | 전체 / **케인칼럼**(`/content/column/` 5) / **에이전트 업무일지**(`/content/blog/`, 옛 '블로그', 칩 없는 단일 목록, 약 110편) / 게임 소식(약 55편) / AI 활용 가이드 50 / 웹게임 77 / 웹 도구 57 / 내 앱 50 |
| 발행 | `scripts/publish.sh --reason "..."`(docs/PUBLISH.md). 섹션 감소는 변동 게이트(종료 코드 3 또는 10) → 이전 커밋과 직접 비교해 의도된 것이면 `--force` |
| **콘텐츠 평가 자료** | **`docs/content-quality/`** : README(채점표·판정 기준·처리 현황), `auto.py`(1차 기계 채점), `qual.jsonl`(281편 2차 채점+처방), `qual-summary.md`, `revise-queue-remaining.json`(남은 보강 53편, 점수 낮은 순) |
| kein-blog | 소스 0.2.99(8편 내림·이동 링크 정리 유지보수), main 푸시 완료, 작업트리 깨끗. `production/active.json` = `ko-ai-ai-colleagues-02`(발행 완료 상태) |
| **blog.kimjinwan.com** | 서버 current = **0.2.99**. **3단계-B 게임 소식 7편 + ai-colleagues-03의 한국어 상세·번역 안내 56개 제거 완료**. 새 글 0, 사이트맵 211→203. HTTP 103경로·광고 파일 불변 확인, 0.2.98 롤백용 보존. |
| 웹앱 도구 사이트 | apps.kimjinwan.com v0.1.82(푸터·헤더의 옛 블로그 글 링크 59곳을 허브 주소로 교체) |
| 공장 허브 | **`blog` 잡 enabled:true**(21:15, 커밋 8df74aa, 원격 없음·로컬 커밋). 허브 자체는 유저가 따로 켠다. 체커 content-hub-sync 폐지. game-forge·web-tools·blog 잡은 허브 등록 절차 연결 완료 |
| AdSense | kimjinwan.com 검토 요청은 유저가 눌렀고(10-13 밤) 결과 대기. 3회 거절 이력('가치가 별로 없는 콘텐츠'). **계정 조작은 에이전트가 하지 않는다**. 서브도메인 단독 등록 불가 |
| ads.txt·app-ads.txt | 불변 SHA-256 `422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0`. 배포 전후 라이브 해시 확인 |

## 1. 이어서 할 일(우선순위순)
1. **완료 — 블로그 서브도메인 정리 배포(0.2.99)**: 내린 게임 소식 7편·ai-colleagues-03과 번역 안내 56개 제거, 목록·추천·연재 이전/다음·사이트맵 정리. 178편 본문은 기존 라이브와 일치(삭제 대상 이동 링크 제외), 새 글은 서브도메인에 올리지 않았다. 현재 소스 82/82 시험, 산출물 1,329파일 서버 SHA-256, HTTP 103경로 검증 통과. 재현·검증 기록은 `kein-blog/docs/maintenance/0.2.99/`. 다음 우선순위는 아래 53편 보강이다.
   - 재발 방지: 유지보수 사본은 node_modules를 독립 설치/복사한다. 공유 심링크로 동시에 빌드하면 Astro 캐시가 섞여 최신 본문이 과거 소스 빌드에 들어간다. 본문별 비교로 잡았고 오염 산출물은 배포하지 않았다.
2. **남은 보강 53편**(`docs/content-quality/revise-queue-remaining.json`): 점수 낮은 순. 하위 것은 연재·개발일지(ai-colleagues-01·04·05·06·07·09·10, whale-survivors-02·05~10, ai-game-factory-01·02·05·06·08, career-01·02, ai-workbench-01·04·07)와 게임 소식. 처방 원칙: **연재는 3~4편으로 압축·독자 질문형 제목·내부 용어 풀이, 게임 소식은 시점·확정/미확정 구분·기준일·상시 정보 보강, 종료된 건 병합 또는 내림**. 공정은 kein-blog 계약 v3(기존 글 수정은 글마다 `production/ko-*` 계약 만들기·지문 재산출·독립 검토 1~3회·check/verify, **검토 release=false 면 발행 금지**), 중간 발행은 10편 정도씩.
   - `ai-colleagues-05` 재작성 시 독립 검토(3차, release=false)가 짚은 것: ①"활동이 바뀔 때 식사 필드를 지운다"는 5월 23일 커밋(2f9cc8d)부터 있던 코드인데 5월 26일 문단에 붙어 있음 → 삭제하거나 출처 분리 ②"바쁨 상태에도 같은 문제가 있었다"와 소제목 "끝나지 않으면 남는다"는 근거 없음(69a3942·fed73f2는 기능 추가) → "같은 계열의 설계 사례"로 ③5월 29~30일 설정 교체 "같은 문제다"는 추정 → "같은 부류로 볼 수 있다" ④점검표 '충돌' 칸에 "프롬프트 규칙으로 추가, 효과 미검증", "큐를 비운다"는 "비우도록 유도한다" ⑤"음식 사진"은 "먹는 캡션이 달린 사진".
   - 중단 시점에 `ai-colleagues-05` 가 수정 중이었다. 반쯤 쓴 작업(production/ko-ai-ai-colleagues-05)은 되돌렸고 부분 산출물은 scratchpad 에 따로 있다(없어도 무방). 처음부터 다시 한다.
3. **블로그 공장에 평가 공정 추가**(유저 요청): `docs/content-quality/auto.py` 의 1차 채점을 `editorial.mjs check` 게이트로(기준 미달·기존 글과 DUP≥0.5 면 ready 불가), 독립 검토 호출이 Q1~Q5 를 채점해 최종 ≥72 여야 발행(미달이면 처방과 함께 revise), 소재 선정 단계에서 '사람이 찾아볼 질문인가'·기존 글과 겹침 선검사. `docs/editorial/PIPELINE.md`·공장 허브 `prompts/blog.md` 에 단계 추가, 채점기 단위 시험. 기준 사례: KEEP 대표(`qual-summary.md` §KEEP).
4. **사이트맵 정리**: 허브 사이트맵(약 480건)에서 2쪽 이후 목록 페이지 제외 검토, 블로그 서브도메인 사이트맵에서 글 URL 제거(canonical 이 허브), robots.txt 의 서브도메인 사이트맵 목록 정리. 검색 등록(Search Console·네이버·IndexNow) 정리는 유저와 함께.
5. 기타(급하지 않음): 옛 경로 301(nginx, `data/content-redirects.json`·`content-withdrawn.json` 매핑만 있음), 블로그 글 이미지가 blog.kimjinwan.com 절대 주소를 가리킴(서브도메인 끄는 날 자체 호스팅 필요), 웹게임 pulse-bat·neon-beat-operator 클리어 보강, `/content/blog/ai/`·`/content/blog/apps/` 목록 주소가 404 가 아니라 403(nginx 디렉터리 동작, 무해), 공장 허브 커밋은 원격이 없어 푸시 안 됨.
6. **AdSense 결과 확인**(유저). 결과에 따라 방향 결정. 우리 쪽 작업은 가치 있는 글 비율을 높이는 것(§2 참고).

## 2. 이번 작업의 요지(2026-10-14)
- 목표: 애드센스 검토 크롤러가 볼 만큼 양과 **질**을 갖춘다. 유저 기준: "사람들이 찾아볼 만하고 얻어갈 게 있는 글인가"(직접 경험·허위 여부보다 가치).
- 281편(업무일지 202 + 게임 소식 79)을 채점 → 새로 쓰기 118편은 처리 완료: 앱 소개 틀 글 42·삭제된 앱/상태 로그 16·목차 3편 내림(61), 이미지·PDF·QR 도구 글 26편을 깊은 가이드 5편으로 병합(`data/tool-guides.json` 이 도구 소개 페이지의 가이드 링크를 만든다, 가이드가 사라지면 생성 실패), 게임 소식·연재 24편 내림과 가이드 3편 신설, REWRITE 7편 재작성·앱 REVISE 12편 보강. 내린 글은 원고 보존(`status: draft`, `approved: false`), 옛→새 주소는 `data/content-withdrawn.json`(생성기가 `content-redirects.json` 에 합침).
- 후처리 `web/src/unpublished-links.mjs`(kein-blog)가 내린 글을 가리키는 본문 링크를 dist 에서 걷어 낸다(원고 지문을 건드리지 않으려고).

## 3. 허브 편집 원본·점검 도구
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
