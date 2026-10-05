# kimjinwan.com — 개발자 · PM 김진완 허브 (정적 사이트)

AI로 만들고 운영하는 서비스, 웹게임, 웹 도구, 블로그, 11년 경력과 프로젝트 55개. 한·영 토글, 시간 기반 라이트/다크 테마.

## 구조
- `index.html` `works/` `factories/` `career/` — **생성물**(직접 수정 금지)
- `src/` — 페이지 템플릿(`home|works|factories|career.html`), `partials/`(head·nav·footer), `sections/`
- `data/` — SSOT: `services.json` · `collections.json` · `factories.json` · `profile.json`
- `scripts/build.mjs` + `scripts/lib/` — 데이터+템플릿 → HTML 빌더(아이콘·렌더·검증)
- `css/style.css` · `js/main.js` · `js/theme*.js` · `js/data.js`(프로젝트 55개 데이터)
- `assets/` — 포트레이트, 서비스·프로젝트 이미지, 이력서
- `game/` — Career Run 게임
- `tests/` — 데이터·렌더·사이트 계약·빌드 동기화 테스트
- `docs/` — 스펙과 구현 계획
- `build_data.py` + `trans_en.py` — projects.json → js/data.js 생성기(로컬용)

## 개발
```
node scripts/build.mjs          # src + data → 4개 HTML 생성(결정적)
node --test tests/*.test.mjs    # 전체 테스트
```
내용 수정은 `src/` 또는 `data/`에서 하고 다시 빌드한다. 빌드 결과가 커밋본과 다르면 `tests/build.test.mjs`가 실패한다.

## 배포
현재 버전: 1.1.0. 실제 운영 브랜치는 static-site-2026이다. [배포·광고 파일 보존·검색 설정](DEPLOYMENT.md)을 따른다. 공개 파일만 별도 릴리스로 배포하며(`data/ src/ scripts/ tests/ docs/` 제외) Git 체크아웃은 웹에서 제공하지 않는다.

## TODO
`_TODO.md` 참조 (이력서 PDF 교체, 배포 등).
