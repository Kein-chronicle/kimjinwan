# kimjinwan.com — 개인 포트폴리오 (정적 사이트)

소프트웨어 PM 김진완 포트폴리오. 다크+그래디언트, 한·영 토글, 프로젝트 55개.

## 구조
- `index.html` — 단일 페이지
- `css/style.css` · `js/main.js` · `js/data.js`(프로젝트 데이터)
- `assets/` — 포트레이트, 프로젝트 이미지, 이력서
- `build_data.py` + `trans_en.py` — projects.json → data.js 생성기(로컬 빌드용)

## 배포
정적 파일이라 그대로 호스팅 가능 (GitHub Pages 등). 빌드 불필요.

현재 버전: 1.0.2. 실제 운영 브랜치는 static-site-2026이다. [배포·광고 파일 보존·검색 설정](DEPLOYMENT.md)을 따른다. 공개 파일만 별도 릴리스로 배포하며 Git 체크아웃은 웹에서 제공하지 않는다.

## TODO
`_TODO.md` 참조 (이력서 PDF 교체, 배포 등).
