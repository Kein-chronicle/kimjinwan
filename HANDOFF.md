# HANDOFF — kimjinwan.com 콘텐츠 품질 (2026-10-14, 15시 마감)

## 현재 상태

- 사용자 지시: **15시까지 검토·검증된 것만 등록하고, 미완료는 핸드오프·커밋·푸시 후 종료.** 완료 숫자를 맞추려고 검토를 생략하거나 글을 임의로 내리지 않는다.
- 허브 `1.3.105`. `static-site-2026`. 정확한 라이브 릴리스는 서버 current와 `VERSION` 대조.
- 블로그 소스 `0.2.101`, `main`. 동결 라이브도 `0.2.101`: 한국어25편·총175페이지 제거, 새 파일0, 본문153편 보존, 사이트맵203→37. 새 글의 발행처는 허브. 동결 서브도메인은 유지보수 산출물만 배포한다.
- 최초 53개 항목 중 **43개 완료, 10개 남음**. 장부 `docs/content-quality/execution-2026-10-14.json`, 남은 목록 `revise-queue-remaining.json`.
- AI 원본28개는 16개 대표글로 전부 보강·병합 완료. 게임 글은 아래 남은 목록 참조.
- 블로그 품질 공정 v1 완료: 1차≥60, DUP<0.5, 독립Q1~Q5와 최종≥72, 명시적release=true. ready/check/verify/published에서 현행 코퍼스 재검사. 블로그87시험·공장390시험·독립코드검토 통과.
- 허브 사이트맵: 2쪽 이후 목록 제외. robots의 블로그 사이트맵 나열 제거. 동결 블로그 상세 canonical은 허브이며 한국어 상세는 사이트맵에서 제외한다.
- 웹게임 neon-beat-operator와 pulse-bat: 라이브 실제입력 성공 화면 확인, 독립검토와 소개/이미지점검 통과. 네온1·2세트100%/6500점, 펄스1세트1680RPM후성공. 최소성공RPM·전체완주·터치·소리 미확인. 사용자는 타이밍게임을 더 무리하게 시험하지 말고 코드예측을 구분해 쓰라고 지시했다.

## 바로 이어서 할 일

남은 원고는 **초안과 공식 근거 준비 완료, 공개 승인 아님**. `kein-blog/production/<ID>/work/candidate-config.json`, `candidate-body.md`, 원문텍스트·공식이미지를 읽는다. 도구 사본과 재개 주의는 `kein-blog/docs/editorial/reviews/2026-10-14-resume/README.md`.

순서: 원고별 brief/research/outline/draft 계약 → 순차 독립 내용검토 → 별도 공개검토 → check/verify → 블로그커밋푸시 → 허브발행 → published HTTP본문검증 → 장부완료. **release=false면 게시 금지.** 중단된 후보의 존재를 공개완료로 세지 않는다.

- `news-nikke-second-burst-roster`: 2버스트 파티 자리 비용 관점은 유용. 후보별(크라운·마스트·앵커·프리카·민트) 역할 비교표를 출처와 함께 추가하면 가치 상승.
- `news-nikke-drake-ammo-trap`: 장탄 옵션을 그대로 옮기지 말라는 결론은 있으나 단일 출처(인벤)·수치 없음. 드레이크 스킬·무기 전환 구조와 추천 장비 옵션을 출처 여러 개로 비교 정리하면 대표 글 가능.
- `news-zzz-32-claret-roxy-engines`: S급 엔진 vs A·B급 Armorer 엔진 획득 경로 구분은 쓸 만함. 엔진별 효과·획득 경로를 표로 정리하고 3.3 이후 갱신.
- `news-ananta-silence-rumor-followup`: 지난 루머 회고로 지금 검색 수요가 낮음. 출시일 글에 한 단락으로 병합하거나 삭제.
- `news-wuwa-35-yangyang-susu`: 3.5 신규(양양·현령·수수) 구분 정리. 3.5 종료로 낡음. 속성·역할 비교표를 출처와 함께 정리해 캐릭터 요약글로 전환하거나 3.5/3.6 글과 병합.
- `news-wuwa-36-qingxiao-jingran`: 3.6 신규 둘의 속성·무기 차이. 위와 병합해 '명조 3.5~3.7 신규 공명자 정리표'로.
- `news-nikke-oct8-belorta-pumpkin-witch-recruitment`: 벨로타 가이드(10/13)가 이 정보를 포함하므로 중복. 가이드로 병합하고 이 글은 리다이렉트하거나 삭제.
- `news-nikke-laplace-july-operating-note`: 풀차지 5회→머신건 전환이라는 핵심은 쓸 만함. 현행 스킬 설명과 장탄 옵션 우선순위를 여러 출처로 비교한 캐릭터 가이드로 확장하고 maxwell 글과 병합.
- `news-zzz-31-returning-checklist`: 복귀 체크리스트 형식은 유용(초보자 가이드·시즌3 제2장·베이글 프로젝트). 3.3 기준으로 갱신해 상시 복귀 가이드로 전환.
- `news-nikke-sep22-swift-bunny-official-confirm`: '지난 글의 미확인이 사실은 공식이었다'는 정정 프레이밍이 독자에게 낯섦. sep17 글과 병합해 바니걸 시즌 일정표 하나로 정리하고 정정은 한 줄로.

### 준비된 통합 방향

- 니케 드레이크+라플라스→드레이크 탄약/종료조건. Crown/Anchor 2버스트목록은 별도.
- 니케 벨로타 모집→기존 벨로타 가이드. 풀차지 공격 vs 유령분장 중 풀차지 명중 구분. 시전자 기준92.4%≠최종피해증가.
- 니케 신 모집→길티·신 일정비교. 두 모집공지9/12, 신프로필9/13. 10/14에 신모집까지종료했다고쓰지않는다.
- ZZZ3.2엔진은5종획득경로 비교. 3.1복귀글은3.2일정과상시시스템을정리하고 비큐zzz-32-first-check의잘못된시간대안내도병합.
- 명조는3.5방랑자+3.5~3.6스토리,3.5양양수수+3.6청효경연 두대표.
- 무한대 침묵추측→기존출시일기록. 공식사이트의2027-01-15표기와행사부재추측을분리.
- 림버스6개→그레고르대표의6사례조건읽기. 로쟈비큐공지의잘못된점검시각도통합. 원장에complete인지확인.

## 남은 운영 항목

- nginx 옛주소301 적용: data/content-redirects.json 매핑은 생성되지만 서버규칙은 아직 미적용. /content/blog/ai/·apps/ 목록403도 이때정리.
- 블로그 본문이미지의 blog.kimjinwan.com 절대주소 의존은 남음. 서브도메인 종료 전 자체호스팅 필요.
- Search Console·네이버·IndexNow 등록정리는 사용자와 진행. AdSense검토결과는 사용자확인, 계정조작금지.
- 공장 kein-factory-hub 0.1.9 로컬커밋5dc4091, 원격없어push불가. blog잡enabled21:15, 스케줄러는이번작업에서변경하지않음.

## 배포와 검증

- 허브 `scripts/publish.sh --reason "..." --force`가검증·패치버전·커밋푸시·업로드·HTTP검증수행. clean트리필수. 동시서비스작업이있었으므로남의변경을되돌리지않는다.
- SSH `ssh -i ~/kjw.pem ubuntu@54.116.13.147`. 허브 `/var/www/kimjinwan/current`, 블로그 `/var/www/kein-blog/current`.
- ads.txt·app-ads.txt 불변SHA256 `422f460a35c48c91e8ed9709c539a251055739f6adaefd3356db6ee502cd49a0`.
- 유지보수는독립node_modules. 새원고본문이동결산출물에섞이지않게기존라이브본문과전수대조. `kein-blog/docs/maintenance/0.2.101/`에내림목록·검증·전파일해시·HTTP기록.
- 수정원고후보/공식근거는저장소에보존. /tmp의작업사본이사라져도내용검토를재개할수있다.

최종 검증: 블로그 build·87시험, 허브202시험, 공장390시험 통과. 공장은 원격이 없어 로컬커밋만 존재한다.
