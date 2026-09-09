# 배포 및 검색 설정 — 2026-09-09

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
- 남색 K 모노그램: SVG, 96px PNG, 다중 크기 ICO, 180px 터치 아이콘. Pillow를 쓰는 scripts/build_icons.py로 재생성 가능.
- 블로그와 색상만 달리해 같은 운영자의 사이트임을 표현. 새 공유 이미지 생성은 하지 않음.

## 배포 경계와 보안

기존 Nginx root가 Git 체크아웃을 직접 제공해 /.git/HEAD가 HTTP200이었다. 공개 파일만 /var/www/kimjinwan/releases/1.0.1에 복사하고 /var/www/kimjinwan/current를 root로 지정했다. 기존 저장소는 보존했으며 Git·테스트·생성 스크립트는 배포하지 않는다. 변경 뒤 내부 경로404 확인.

공개 허용 목록: index.html, css/, js/, assets/, game/, app-ads.txt, ads.txt, favicon.svg, favicon.ico, favicon-96.png, apple-touch-icon.png, robots.txt, sitemap.xml. 기존 앱 광고 파일을 빼먹거나 저장소 전체를 배포하지 않는다.

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
