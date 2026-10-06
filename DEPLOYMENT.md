# 배포 및 검색 설정 — 2026-09-09

## 메타데이터 · 공유 이미지 (1.3.1~)

공유 미리보기(카카오톡·슬랙·링크드인 등)는 페이지마다 명시한 `og:image`/`twitter:image` 카드만 쓴다. 이전에는 og:image 가 없어 스크래퍼가 본문 첫 이미지(Forge 스크린샷)를 집었다. **얼굴 사진(`portrait_full.png`)과 제품 스크린샷(`assets/services/`)은 메타·JSON-LD 어디에도 쓰지 않는다**(`tests/site.test.mjs` 가 검사).

- **카드**: `assets/og/{home,works,factories,career,game}.png` — 1200×630, 텍스트 카드(Kein 마크 + 김진완 · 개발자 · PM + 페이지 문구 + kimjinwan.com). 문구·숫자의 출처는 `scripts/lib/og.mjs`(공장 수 = `data/factories.json`, 프로젝트 수 = `js/data.js`)이며 페이지 제목·설명·og:image:alt 도 같은 곳에서 나온다.
- **재생성**(데이터 숫자나 카드 문구가 바뀌면 테스트가 실패한다): `node scripts/build_og.mjs` → `node scripts/build.mjs` → `node --test tests/*.test.mjs`. 헤드리스 Chrome(`/Applications/Google Chrome.app`)·Pillow·네트워크(Pretendard CDN)가 필요하다. 생성기는 `scripts/og-cards.lock.json` 에 문구와 PNG 해시를 적고, 손으로 쓴 `game/index.html` 의 `?v=` 도 맞춘다.
- **SNS 캐시 갱신**: og:image 주소의 `?v=` 는 PNG 내용 해시라 카드가 바뀌면 주소가 바뀐다. 그래도 각 서비스는 페이지 단위로 미리보기를 캐시하므로 배포 후 다시 긁게 한다 — 카카오 공유 디버거(https://developers.kakao.com/tool/debugger/sharing, 캐시 초기화), Facebook 공유 디버거(https://developers.facebook.com/tools/debug/, 다시 스크랩), LinkedIn Post Inspector(https://www.linkedin.com/post-inspector/). 슬랙은 링크를 새로 붙이면 대개 다시 읽는다.
- **배포 허용 목록 추가**: `manifest.json`(루트), `assets/og/`(이미 `assets/` 에 포함).

## 1.3.0 배포 기록 — 2026-10-05

허브 개편 최종본(홈 스토리 구성: 01 경력 → 02 개인 프로젝트[서비스 3·공장 5·산출물] → 03 도구와 원칙, Kein 로고, 홈 복귀 내비게이션, 시간 기반 라이트/다크)을 `/var/www/kimjinwan/releases/1.3.0` 으로 배포하고 `current` 심볼릭 링크를 `mv -T` 로 원자 전환했다. 직전 `releases/1.0.7` 은 복구용으로 유지한다(복구 = `current` 를 1.0.7 로 되돌림).

- 공개 허용 목록만 올렸다(81개 파일). `.git`·`src`·`data`·`scripts`·`tests`·`docs` 는 올리지 않았고 라이브에서 전부 404 로 확인했다.
- **광고 파일**: `ads.txt`·`app-ads.txt` 는 서버 릴리스 파일과 라이브 URL 응답 모두 SHA-256 `422f460a…49a0` 로 원본과 일치. 네 페이지 모두 `google-adsense-account` 메타(ca-pub-5544615855471151) 포함.
- 검증: `/`·`/works/`·`/factories/`·`/career/`·`/game/` 200, 라이브 HTML·CSS·JS 해시가 로컬 빌드와 일치, 사이트맵 5개 URL, 블로그·게임·도구·Forge 서브도메인 200. 로컬 테스트 112/112.
- 서버 접속 `ssh -i ~/kjw.pem ubuntu@43.200.180.39`, 릴리스 디렉터리는 root 소유라 업로드 후 `sudo mv` + `chown ubuntu`.

## 1.1.0 — 개발자 · PM 허브 개편

단일 페이지 포트폴리오를 4페이지 허브로 바꿨다: `/`(홈), `/works/`(작업물), `/factories/`(AI 공장), `/career/`(경력·프로젝트 55개·Career Run 진입). `/game/`은 그대로다.

- **빌드**: HTML 4개는 `src/`(페이지·파셜) + `data/*.json`(services·collections·factories·profile, SSOT) + `js/data.js`에서 `node scripts/build.mjs`로 생성한다. **생성된 `index.html`, `works/`, `factories/`, `career/` 는 직접 고치지 않는다** — `src/`나 `data/`를 고치고 다시 빌드한다. 출력은 입력만의 순수 함수이며(날짜는 데이터 안의 최대 `updated`/`as_of`), `tests/build.test.mjs`가 커밋본과 빌드 결과의 일치를 검사한다. CSS 캐시 구분(`?v=`)은 `VERSION`을 따른다.
- **공개 허용 목록**: `works/`, `factories/`, `career/`, `css/`, `js/`, `assets/`, `game/` 와 루트 파일(`index.html`, `favicon*`, `apple-touch-icon.png`, `manifest.json`(1.3.1~), `robots.txt`, `sitemap.xml`, `ads.txt`, `app-ads.txt`). `data/`, `src/`, `scripts/`, `tests/`, `docs/`는 배포하지 않는다.
- **광고 파일**: `ads.txt`·`app-ads.txt`는 변경하지 않는다(SHA-256 `422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0` 유지, 테스트가 검사).
- **테마**: 방문 시각 기반 라이트/다크 자동 적용(`js/theme-core.js`가 `<head>`에서 본문보다 먼저 실행해 깜박임을 막고, `js/theme.js`가 5분마다·탭 복귀 시 시각을 다시 평가한다. 수동 전환 버튼은 없다).
- **검증**: `node scripts/build.mjs && node --test tests/*.test.mjs`. sitemap에 네 페이지와 `/game/`을 포함한다.
- **복구**: 이전 릴리스 1.0.7(`/var/www/kimjinwan/releases/1.0.7`)이 남아 있으므로 `current` 심볼릭 링크를 1.0.7로 되돌리면 된다. 1.0.2~ 이후 섹션과 같은 방식이다.

## 1.0.6 — 웹게임 포털 연결

상단 탐색, 첫 화면, 공개 작업, 하단 콘텐츠 링크에서 `https://games.kimjinwan.com/`과 대표 게임으로 연결했다. `robots.txt`에 게임 포털 사이트맵을 추가했다. 기존 광고 파일은 변경하지 않는다.

## 1.0.5 — 공개 콘텐츠 허브와 AdSense 계정 연결

AdSense의 `가치가 별로 없는 콘텐츠` 판정 대응으로 루트 포트폴리오가 같은 도메인의
블로그 218편과 웹 도구 42개를 직접 설명하고 대표 콘텐츠로 연결하도록 공개 허브를 추가했다.
`robots.txt`에는 블로그·웹 도구 사이트맵도 명시했다. 세 사이트가 같은 게시자 계정에
속함을 알리는 `google-adsense-account` 메타 태그를 추가하되, 재승인 전 실제 광고 요청은
보내지 않는다.

## 1.0.4 — 자체 방문 통계

홈페이지 페이지 조회를 공용 site-metrics 백엔드에 익명 집계한다. 브라우저 무작위 식별값은
서버에서 일별 해시로 바뀌며 입력 내용과 원 IP를 통계 DB에 저장하지 않는다. 공개 릴리스에는
통계 스크립트와 짧은 개인정보 안내만 포함한다.

## 1.0.3 — 웹 도구 공장 연결

상단 메뉴, 첫 소개 영역, Kein Journal 영역에서 `https://apps.kimjinwan.com/`으로 이동하는 한·영 링크를 추가했다. 공개 릴리스는 `/var/www/kimjinwan/releases/1.0.3`이며 `app-ads.txt`와 `ads.txt`의 기존 SHA-256을 유지했다. 자동 검사 4개, Nginx 설정 검사, 홈페이지 링크와 백엔드 서비스 상태를 확인했다.

## 1.0.2 — 블로그 바로가기

상단 메뉴를 청록색 강조 버튼으로 바꾸고 첫 소개 영역에도 바로가기를 추가했다. 모바일에서도 상단 버튼을 유지하며 좁은 화면에서는 메뉴가 줄바꿈된다. 홈페이지 내 블로그 링크 4개 모두 중간 이동 없이 새 탭/창으로 연다. 새 창 안내와 키보드 포커스를 제공한다. CSS 버전 쿼리로 이전 스타일 캐시를 구분한다.

공개 릴리스는 /var/www/kimjinwan/releases/1.0.2, 이전 1.0.1은 복구용으로 유지한다. 광고 파일과 Nginx 설정은 변경하지 않는다. 회귀 검사는 node --test tests/*.test.mjs로 실행한다.

버전1.0.1. 실제 운영 브랜치는 static-site-2026이며 master는 이번에 변경하지 않았다.

## 광고 파일 우선 보존

서버 작업 트리의 app-ads.txt를 649a42c로 먼저 커밋했다. 서버에는 GitHub HTTPS 쓰기 인증이 없어 같은 커밋을 SSH로 로컬에 가져온 뒤 기존 인증으로 origin/static-site-2026에 먼저 푸시했다. 서버에 자격증명을 저장하지 않았다. 이후 홈페이지 변경을 진행했다.

ads.txt도 서버의 기존 공개 원본을 그대로 가져와 추적한다. 두 파일의 SHA-256은422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0이다. 광고 계정·단위 설정은 변경하지 않았다.

## 변경

- 기존 한·영 화면에 블로그 소개 영역과 내비게이션, 한국어 블로그·연재 목차 링크 추가.
- 홈페이지/게임에 canonical, robots, description, Open Graph, Twitter 메타; 홈페이지 WebSite·Person·ProfilePage 구조화 데이터.
- 홈페이지와 게임의 실제 주소만 sitemap에 등록. 동일 URL의 한·영 토글은 별도 번역 URL인 것처럼 hreflang을 생성하지 않음.
- Kein 마크(인디고 타일 + 기하 K + 앰버 점): 손으로 쓴 favicon.svg, 96px PNG, 다중 크기 ICO(크기별 직접 렌더), 180px 터치 아이콘(꽉 찬 사각). 재생성: `python3 scripts/build_icons.py . --background '#3B4BDB' --accent '#FFB547'` (Pillow). 기하는 scripts/lib/render.mjs 의 K_PATH/K_DOT 와 같다.
- 블로그와 색상만 달리해 같은 운영자의 사이트임을 표현. 새 공유 이미지 생성은 하지 않음.

## 배포 경계와 보안

기존 Nginx root가 Git 체크아웃을 직접 제공해 /.git/HEAD가 HTTP200이었다. 공개 파일만 /var/www/kimjinwan/releases/1.0.1에 복사하고 /var/www/kimjinwan/current를 root로 지정했다. 기존 저장소는 보존했으며 Git·테스트·생성 스크립트는 배포하지 않는다. 변경 뒤 내부 경로404 확인.

공개 허용 목록(1.0.x 기준 — 1.1.0 이후는 이 문서 맨 위 1.1.0 절의 목록이 우선): index.html, css/, js/, assets/, game/, app-ads.txt, ads.txt, favicon.svg, favicon.ico, favicon-96.png, apple-touch-icon.png, robots.txt, sitemap.xml. 기존 앱 광고 파일을 빼먹거나 저장소 전체를 배포하지 않는다.

Nginx 기본 설정의 홈페이지 root 한 줄만 변경했다(파일 끝 개행 정규화 포함). 이전 설정은 서버 /root/kimjinwan-backups/default-before-1.0.1.conf에 보존했다. 동시 변경을 덮지 않도록 원본 해시 대조 후 교체했다. 다른 가상 호스트 설정 변경 없음.

복구: 첫 이전 상태로 돌아갈 때는 백업과 현재 설정의 차이를 확인하고 홈페이지 root만 이전 체크아웃으로 돌릴 수 있으나 Git 노출이 재발하므로 비권장. 이후에는 별도 공개 릴리스를 보관하고 current 링크로 복구한다. 이번 배포는 Git 객체나 기존 파일을 삭제하지 않았다.

서버의 기존 소스 체크아웃은 광고 파일 보존 커밋 위치에 남아 있다. 이후 배포의 기준은 GitHub 운영 브랜치와 공개 릴리스이며, 예전 체크아웃에 바로 수정해도 사이트에 반영되지 않는다.

## 검증

node --test tests/*.test.mjs: 2개 통과. js/main.js·js/data.js 구문 검사 및 git diff --check 통과. 정적 사이트로 별도 번들 빌드 없음.

두 사이트 공개 파일/사이트맵 주소71건이 정상 응답·검사 통과. 홈페이지·www의 app-ads.txt가 원본과 일치한다. Nginx 검사·reload 성공, 백오피스 health=ok/ready=ready. 브라우저 조작 검수는 이번 요청 범위에서 실행하지 않았다. 파비콘 두 디자인은 파일을 직접 열어 확인했다.

기존 master 브랜치에 대한 GitHub 의존성 경고는 이번 정적 운영 브랜치의 런타임 검사와 별개이며 수정하지 않았다.

## 검색 노출 범위

기술 설정을 배포했으며 검색엔진 색인·순위나 파비콘 표시를 보장하지 않는다. Search Console/네이버 소유권 등록이나 색인 요청은 이번에 실행하지 않았다.

참고: [파비콘](https://developers.google.com/search/docs/appearance/favicon-in-search), [대표 주소](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## 1.0.7 — Forge · Prism Studio 중심 소개

2026-10-04 사용자 지시에 따라 메인 제목·첫 화면·대표 서비스 영역을 두 제품 중심으로 변경했다. 공개 초기 HTML에 기능·시작 방법·사용 예·한계를 한·영으로 제공하고 Forge 기능/예시 및 Prism 편집기로 직접 연결한다. 기존 포트폴리오와 블로그·도구·게임 연결은 유지한다. AdSense 재검토는 사용자 명시 요청으로 진행하며 승인 여부는 별도로 확인한다.

검증: node --test tests/*.test.mjs 5/5 통과, main/data JS 구문 검사와 git diff --check 통과. 공개 index.html SHA-256이 로컬과 일치하고 ads.txt/app-ads.txt 기존 해시 보존. Forge 홈·features·examples와 Prism 홈 HTTP 200, 브라우저에서 새 메인 서비스 노출 확인. /var/www/kimjinwan/current를 releases/1.0.7로 전환했고 이전 릴리스는 유지했다.

2026-10-04 10:28 KST 기존 AdSense 계정의 kimjinwan.com에서 개선 확인 후 검토 요청을 제출했다. 화면에서 승인 상태 `준비 중`, `사이트의 광고 게재 가능 여부 검토 중`, `리뷰가 요청됨`을 확인했다. 접수 완료이며 승인 완료는 아니다. 새 사이트 등록·광고 단위·지급 설정은 변경하지 않았다.
