# 콘텐츠 허브 동기화 체커 — 폐지됨

2026-10-14 유저 지시로 `content-hub-sync`(매일 06:30 체커)는 **폐지**했다. 이 문서에 있던 잡 등록·프롬프트 내용은 더 쓰지 않는다(공장 허브 `prompts/content-hub-sync.md`·잡 등록도 쓰지 않는다).

## 지금의 방식
- 허브(kimjinwan.com/content/)는 각 공장이 **등록할 때 직접 발행**한다. 발행은 `scripts/publish.sh` 하나뿐이다 → `docs/PUBLISH.md`.
- 공장별 등록 절차: 게임 포지·웹툴·기즈모 스토어 저장소의 `docs/HUB_REGISTRATION.md`, 공장 허브 `prompts/_content-hub.md`.
- 소개 작성 기준: `docs/AUTHORING_GAMES.md`·`AUTHORING_TOOLS.md`·`AUTHORING_APPS.md`.
- 블로그 글 등록 전환: 공장 허브 `docs/blog-hub-registration.md`.
- 변동 게이트(섹션 감소·+20 초과는 종료 코드 3으로 멈춤)와 롤백은 발행 스크립트가 맡는다.
