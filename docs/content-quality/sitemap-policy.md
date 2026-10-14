# 사이트맵 정리 기준 — 2026-10-14

- 허브는 상세 정본과 첫 목록을 싣는다. 2쪽 이후 목록은 사이트맵에서 제외하되 실제 페이지·탐색 링크·자기 canonical은 유지한다. 목록 제외는 운영상의 선택이며 Google의 필수 규칙이라고 주장하지 않는다.
- 블로그 한국어 글은 허브가 canonical이므로 서브도메인 사이트맵에서 제외한다. 자체 canonical인 목록·소개와 실제 번역 원고는 유지한다. 번역 준비 안내는 기존처럼 noindex이며 사이트맵에 없다.
- 허브 robots.txt에서는 동결 블로그의 사이트맵을 제거한다. 웹 도구·게임·문서 서비스·서비스 허브의 독립 사이트맵은 실제 HTTP 200/XML을 확인해 유지했다. 각 사이트의 robots 접근을 막지 않는다.
- 별도 Google Search Console·네이버·IndexNow 계정의 등록 상태는 파일 배포만으로 변경했다고 주장하지 않는다.

근거: [Google 사이트맵 지침](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)은 검색 결과에 노출하려는 정본 URL을 사이트맵에 두라고 설명한다. [페이지 분할 지침](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)은 다음 쪽으로 가는 링크와 쪽마다 독립 canonical을 설명한다. 두 공식 문서를 2026-10-14 열어 확인했다.
