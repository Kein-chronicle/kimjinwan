# 2차 질적 평가 요약 (qual-summary)

기준: 사용자 지시에 따라 개정된 루브릭(Q1 얻어갈 것 / Q2 찾아볼 만함 / Q3 정보의 깊이와 종합 / Q4 대체 불가능성 / Q5 읽기 경험). 직접 체험 여부는 평가하지 않음. 최종 = 0.4×AUTO + 0.6×(Q합×5). 개정 전(직접 경험 중심) 결과는 `qual_v1_experience_rubric.jsonl`에 보존. 전체 근거는 `qual.jsonl`(281편).

## 1. 섹션 × 판정

| 섹션 | KEEP | REVISE | REWRITE | 계 |
|---|---|---|---|---|
| ai(에이전트 업무일지) | 36 | 30 | 6 | 72 |
| apps(업무일지 중 앱·도구) | 26 | 12 | 92 | 130 |
| news(게임 소식) | 27 | 32 | 20 | 79 |
| 합계 | 89 | 74 | 118 | 281 |

허브가 ai+apps를 한 섹션('에이전트 업무일지')으로 합쳤으므로 그 합계는 KEEP 62 / REVISE 42 / REWRITE 98 (202편).

## 2. 새로 쓰기(REWRITE) 전체 목록 (118편)

| id | 제목 | 최종 | 핵심 사유 |
|---|---|---|---|
| ai-ai-game-factory-10 | AI 게임 공장: 심사 제출까지 온 뒤 돌아본 AI 게임 공장 | 58.5 | (d) 앞선 9편의 요약 |
| ai-ai-writing-index | AI 사용기: 게임, 앱, 동료를 만들며 남긴 기록 | 59.6 | (b) 목차·링크 모음 |
| ai-career-03 | AI 커리어 관리 3 — 블로그를 다음 조사에 쓸 기록으로 만들기 | 55.9 | (d) 블로그 운영 자기참조 |
| ai-whale-survivors-01 | AI 게임 개발기: 러버블에서 고래 게임을 시작했다 | 49.1 | (d) 읽고 얻을 것 거의 없음 |
| ai-whale-survivors-03 | AI 게임 개발기: 스팀을 생각하니 조작부터 다시 봐야 했다 | 59.0 | 게임패드·키보드 지원 범위 점검 개요 |
| ai-whale-survivors-04 | AI 게임 개발기: 브라우저에서는 됐는데 실행 파일에서는 멈췄다 | 57.9 | 제목(브라우저 OK/실행 파일 멈춤)에 비해 내용이 상대경로 한 문장 |
| apps-animal-personality | Animal Personality: Duet — 상황별 동물 성격 테스트 | 44.4 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-app-archive | 만들었던 앱들 — 출시와 심사, 내려간 기록까지 | 62.5 | (b) 목록 허브+내부 점검 로그 |
| apps-app-icon-generator | 앱 아이콘·파비콘 생성 — 원본과 여백 준비법 | 49.0 | 약 500자 |
| apps-background-remover | 누끼·배경 제거 — 브라우저 AI 결과 품질 높이기 | 42.2 | (a) 틀 반복(DUP 0.58) |
| apps-bike-tire-pressure | Bike Tire Pressure: Any Width — 자전거 타이어 공기압 계산기 | 43.8 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-chess-clock | Chess Clock: Time Controls — 증가·딜레이 규칙 체스 시계 | 44.4 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-church-calendar | Church Calendar: East & West — 동방·서방 교회력 비교 달력 | 44.4 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-concrete-calculator | Concrete Bags and Yards — 콘크리트 부피·포대 수 계산기 | 44.6 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-crochet-row-counter | Crochet Row Counter: Repeat — 뜨개질 단수·반복 카운터 | 44.6 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-cut-list | Cut List: Named Parts — 부품 이름으로 만드는 재료 절단 목록 | 44.7 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-daily-challenge | Daily Challenge: Tiny Actions — 계획 대신 앱이 골라주는 오늘의  | 55.0 | (d) 심사 상태 중심 |
| apps-depth-of-field | Depth of Field: Two Subjects — 두 피사체 심도 계산기 | 44.5 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-device-mockup | 스마트폰 목업 생성 — 앱 스크린샷 홍보 이미지 만들기 | 46.7 | '중요 UI는 중앙'만 있음 |
| apps-dew-point | Dew Point: Vent Check — 실내외 온습도 이슬점 계산기 | 44.5 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-dicefeel | DiceFeel: D20 Dice Roller — 합산까지 읽어주는 테이블탑 주사위 | 52.8 | (c) 요약(9/28부터 다운로드 가능)과 본문(9/24 심사 대기)의 상태 모순 |
| apps-dream-meaning | Dream Meaning: Symbol Reader — 꿈 상징을 고르는 오프라인 해몽 앱 | 44.4 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-event-deadline | 게임 이벤트 마감 달력 — 공식 출처와 종료 시각을 함께 기록하기 | 58.0 | 게임 이벤트 종료 시각·시간대 관리 필요성은 수요 있음 |
| apps-expiration-tracker | Expiration Tracker: Use First — 유통기한·사용기한 우선순위 기록 | 44.7 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-five-shapes | Five Shapes — 도형을 탭하는 캐주얼 퍼즐 | 48.6 | (d) 얻어갈 것 없음 |
| apps-floe-steps | Floe Steps — 지나온 얼음이 무너지는 경로 퍼즐 | 43.9 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-focus-relay | Focus Relay: Team Timer — 차례를 넘기는 팀 집중 타이머 | 43.0 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-gblog | GBlog — 삭제된 개인 블로그 앱 기록 | 37.1 | (d) 내용 부재(삭제된 앱) |
| apps-gif-maker | 사진으로 GIF 만들기 — 프레임 순서와 속도 설정 | 40.6 | (a) DUP 0.52 |
| apps-give-me-random | RandomPick: Wheel & Teams — 룰렛과 팀 나누기 | 53.3 | 제목(룰렛·팀 나누기)과 본문(랜덤 숫자·상태 로그) 불일치 |
| apps-house-ledger | House Ledger: Maintenance — 집 수리·점검 공유 장부 | 43.1 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-id-photo-maker | 증명사진 제작 — 배경색·얼굴 위치·규격 맞추기 | 41.5 | (a) DUP 0.57 |
| apps-ikigai-map | Ikigai Map: Four Circles — 네 개의 원으로 정리하는 이키가이 지도 | 44.2 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-image-compressor | 이미지 용량 줄이기 — 품질과 크기를 조절하는 기준 | 47.2 | 품질 70~85% 근거와 형식별 용량 비교 자료를 리서치해 표로 정리하거나 이미지 도구 글로 병합 |
| apps-image-converter | 이미지 형식 변환 — HEIC·JPG·PNG·WebP 선택법 | 45.6 | JPG/PNG/WebP/HEIC 차이를 비교표로 확장하거나 compressor와 병합 |
| apps-image-crop-rotate | 이미지 자르기·회전 — 정사각형과 16:9 비율 맞추기 | 47.9 | SNS 비율(1:1, 4:5, 16:9) 표와 EXIF 회전 설명 추가 또는 병합 |
| apps-image-ocr | 이미지 글자 추출 OCR — 한국어 인식률 높이기 | 42.1 | (a) DUP 0.58 |
| apps-image-redactor | 사진 모자이크 — 얼굴·번호판·문서 정보 가리기 | 45.3 | 얼굴·번호판 가림 시 약한 블러 복원 위험 등 리서치 자료를 정리하면 가치 상승 |
| apps-image-to-pdf | 사진을 PDF로 변환 — 여러 장 순서와 A4 여백 | 42.1 | (a) DUP 0.58 |
| apps-image-watermark | 이미지 워터마크 넣기 — 사진에 출처 문구 표시 | 52.3 | 워터마크 위치·투명도 권장 정리로 보강하거나 병합 |
| apps-ink-fold | Ink Fold: Overlap makes darker — 겹칠수록 진해지는 색 퍼즐 | 43.9 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-jet-lag | Jet Lag: Both Clocks — 출발지·도착지 시차 일정 계산기 | 43.2 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-kim-howl | Kim Howl — 삭제된 개인 앱 기록 | 37.7 | (d) 내용 부재(삭제된 앱) |
| apps-lockin-message | Lockin Message — 코드로 보관하는 잠금 메시지 | 53.0 | (d) 심사·재배포 상태 로그가 대부분 |
| apps-math-worksheet | Math Worksheet: Answer Key — 문제지와 답안지 자동 생성 | 57.5 | (a 경계) DUP 0.53 |
| apps-merge-cat | Merge Cat — 같은 고양이를 합치는 물리 퍼즐 | 56.8 | (a) DUP 0.50 |
| apps-merge-whale | Merge Whale - 고래 합치기 — 같은 고래를 합치는 물리 퍼즐 | 43.9 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-metadata-remover | 사진 메타데이터 제거 — GPS·EXIF 없이 공유하기 | 49.0 | EXIF 제거 원리와 남는 정보(화면 속 개인정보) 구분 |
| apps-monster-survivors | 몬스터 살아남기 — 자동 공격 픽셀 생존 게임 | 37.8 | (d) 삭제된 앱 |
| apps-my-whale | My Whale - 고래 키우기 — 먹이고 진화시키는 고래 키우기 게임 | 43.9 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-note-reading | Sight Reading: Note Trainer! — 오선 음표·건반 초견 연습 | 44.1 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-pace-calculator | Pace Calculator: Race Plan — 달리기 페이스·구간 기록 계산기 | 43.3 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-palette-extractor | 사진 색상 팔레트 추출 — HEX·RGB 대표색 찾기 | 41.9 | (a) DUP 0.59 |
| apps-pdf-compressor | PDF 용량 줄이기 — 이미지 문서를 가볍게 압축 | 53.1 | 재렌더링으로 텍스트·링크가 사라진다는 한계가 유용 |
| apps-pdf-merge | PDF 합치기 — 여러 문서를 원하는 순서로 한 파일에 | 47.8 | 20개·100MB 한도 외 일반 안내 |
| apps-pdf-organizer | PDF 페이지 순서 변경·추출 — 번호 입력 사용법 | 50.9 | '3,1,2' 번호 입력 규칙 |
| apps-pdf-sign | PDF 서명 넣기 — 서명 이미지를 원하는 위치에 배치 | 42.4 | (a) DUP 0.52 |
| apps-pdf-split | PDF 분할·페이지 추출 — 필요한 범위만 새 파일로 | 48.3 | '인쇄 번호가 아닌 실제 순서' 팁 |
| apps-pdf-to-image | PDF JPG·PNG 변환 — 페이지를 이미지로 저장하기 | 42.4 | (a) DUP 0.51 |
| apps-pdf-watermark | PDF 워터마크 넣기 — 문구·투명도·각도 설정 | 41.6 | 보안 기능 아님 안내 외 정보 부족 |
| apps-photo-collage | 사진 여러 장 합치기 — 가로·세로·격자 콜라주 | 47.1 | 배치 3종 설명뿐 |
| apps-plate-calculator | Plate Calculator: What You Own — 보유 원판 기준 바벨 중량 계산 | 43.2 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-pocket-answer | 작은 답안지 - Pocket Answer — 질문 뒤 짧은 답을 뽑는 앱 | 44.4 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-pollytelly | 폴리텔리 - pollytelly — 위치 기반 동네 소셜 앱 기록 | 37.8 | (d) 삭제된 앱 |
| apps-pool-calculator | Pool Calculator: Own Chems — 보유 약품 기준 수영장 수질 계산기 | 44.8 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-project-checklist | 프로젝트 체크리스트 생성기 — 단계·작업·담당자 묶어 인쇄하기 | 45.8 | '단계 | 작업 | 담당자' 입력 규칙만 있음 |
| apps-pull-planner | 뽑기 재화 계획표 — 목표 횟수까지 하루 필요량 계산하기 | 58.1 | 뽑기 재화 계획은 검색 수요 있음 |
| apps-qr-generator | QR 코드 만들기 — URL·텍스트를 잘 스캔되게 저장하기 | 42.0 | (a) DUP 0.59 |
| apps-qr-reader | QR 코드 해석 — 사진·카메라 스캔 전 주소 확인 | 45.3 | (a) DUP 0.56 |
| apps-reaction-time | Reaction Time Test: Millis — 밀리초 반응속도 테스트 | 43.9 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-reading-pace | Bible Reading Plan: Pace — 마감일 기준 성경 읽기 계획 | 44.3 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-return-checklist | 게임 복귀 체크리스트 — 기간 한정과 영구 할 일 나누기 | 59.3 | 복귀 유저용 우선순위 정리는 검색 수요 있음 |
| apps-save-anything | Save Anything — 삭제된 정보 저장 앱 기록 | 37.7 | (d) 내용 부재(삭제된 앱) |
| apps-score-keeper | Score Keeper: Card & Board — 보드게임 라운드 점수판 | 44.6 | (a) 틀 반복(DUP 0.5↑)·고유 정보 거의 없음 |
| apps-signature-maker | 투명 서명 이미지 만들기 — 문서에 사인 넣기 | 38.3 | (a) DUP 0.59 |
| apps-social-image-resizer | SNS 이미지 리사이즈 — 게시물 규격과 크롭 확인 | 41.5 | (a) DUP 0.58 |
| apps-stair-calculator | Stair Calculator: Both Ways — 공간 기준 계단 단수 계산기 | 44.6 | (a) 틀 반복(DUP 0.77) |
| apps-sudden-note | 급노트 — 바로 쓰는 빠른 메모 앱 기록 | 49.4 | (d) 삭제→재제출 상태 로그가 본문 대부분 |
| apps-tournament-bracket | Tournament Bracket: Undo Safe — 결과 수정 가능한 토너먼트 대진표 | 44.8 | (a) 틀 반복(DUP 0.75) |
| apps-tradeoff-compass | Dilemma Compass: Priorities — 두 선택지의 우선순위 비교 | 51.4 | (a) DUP 0.50·심사 상태 중심 |
| apps-triangle-solver | Triangle Solver Two Answers — 두 해까지 보여주는 삼각형 계산기 | 44.6 | (a) 틀 반복(DUP 0.78) |
| apps-turnover-crew | Turnover Crew: Reset List — 공간 정리용 팀 체크리스트 | 43.1 | (a) 틀 반복(DUP 0.74) |
| apps-unit-price | Unit Price: Which Is Cheaper — 묶음·용량별 단가 비교 계산기 | 44.3 | (a) 틀 반복(DUP 0.70) |
| apps-ventas | 벤타스 — 가상자산 거래 앱 개발 기록 | 38.2 | (d) 삭제된 앱 |
| apps-ventas-wallet | VENTAS Modile 지갑 — 가상자산 지갑 앱 개발 기록 | 38.0 | (d) 삭제된 앱 |
| apps-ventasbit | 벤타스비트 — 가상자산 거래·입출금 앱 기록 | 37.1 | (d) 삭제된 앱 |
| apps-verse-memory | Scripture Memory: Your Text — 직접 붙여넣는 성경 암송 연습 | 44.4 | (a) 틀 반복(DUP 0.75) |
| apps-vigoright | VIGORIGHT - 비고라이트 — 눈 관리 정보·영상 앱 기록 | 37.7 | (d) 삭제된 앱 |
| apps-vocapuff-chinese | VocaPuff - Chinese — 매일 10개씩 외우는 중국어 단어 암기 앱 | 44.7 | (a) DUP 0.91(일본어·영어판과 언어 이름만 다름) |
| apps-vocapuff-english | VocaPuff - English — 매일 10개씩 외우는 영단어 암기 앱 | 44.8 | (a) DUP 0.79 |
| apps-vocapuff-japanese | VocaPuff - Japanese — 매일 10개씩 외우는 일본어 단어 암기 앱 | 44.7 | (a) DUP 0.91 |
| apps-vror | VROR — VR 안구 헬스케어 앱 기록 | 37.9 | (d) 삭제된 앱 |
| apps-waye | 웨이 - WA-YE — 지도 기반 사진·메시지 소통 앱 | 37.5 | (d) 삭제된 앱 |
| apps-whale-book | Whale Book - 고래 사전 — 고래를 찾아 읽는 모바일 사전 | 44.5 | (a) 틀 반복(DUP 0.75) |
| apps-whale-survivors | Whale Survivors - 픽셀 고래 살아남기 — 픽셀 고래 생존·성장 게임 | 43.9 | (a) 틀 반복(DUP 0.73) |
| apps-word-counter | Word Counter: Reading Time — 글자 수·읽는 시간 계산기 | 50.6 | (a) DUP 0.69 |
| apps-yok | YOK - 신개념 욕 추천 어플리케이션 — 상황별 표현 추천 앱 개발 기록 | 37.8 | (d) 삭제된 앱 |
| apps-yumyum-type-test | 냠냠 성격 테스트 — 음식 캐릭터로 보는 성격 유형 테스트 | 54.2 | 성격 테스트 앱 소개(등록 설명 요약) |
| news-cat-merge-devlog | 고양이 합치기 개발기 — 합쳐지는 것 다음에 남은 문제 | 58.2 | 고양이 합치기 개발 일지로 검색 의도가 없고 apps-merge-cat과 중복 |
| news-merge-whale-devlog | 고래 합치기 개발기 — 게임이 끝나야 기록도 남는다 | 57.0 | 고래 합치기 개발 일지로 검색 의도가 없음 |
| news-my-whale-devlog | 고래 키우기 개발기 — 돌봄 한 바퀴를 앱에서도 끝내기 | 56.8 | 고래 키우기 개발 일지로 검색 의도가 없음 |
| news-nikke-favorite-rosanna-phantom | 니케 로산나·팬텀 애장품 — 긴 전투와 타겟 조건을 따로 보는 이유 | 59.2 | 애장품 추가 해설이 추상적(전투 길이·타겟 조건) |
| news-nikke-favorite-sugar-flora | 니케 슈가·플로라 애장품 — 새 딜러보다 기존 지원 역할이 바뀐 날 | 59.3 | 위와 동일 |
| news-nikke-makoto-first-week | 니케 니지마 마코토 첫 주 — 유키코 출시 전 평가는 어디까지였나 | 56.6 | 협업 종료된 시점의 첫 주 평가 |
| news-nikke-maxwell-health-support | 니케 맥스웰 이격 — 체력 버프가 필요한 파티부터 보자 | 59.7 | 체력 버프 지원형 개요가 추상적 |
| news-nikke-persona-followup | 니케 마코토·유키코 후속 평가 — 레이드 성능을 범용 티어로 읽지 않기 | 59.6 | 솔로 레이드 순위를 범용 티어로 읽지 말라는 주의 위주 |
| news-nikke-summer-new-iron-pair | 니케 수영복 신데렐라·마르차나 — 같은 철갑 딜러를 어떻게 비교할까 | 56.4 | 종료된 7월 모집 비교 기록 |
| news-nikke-summer-rerun-dorothy-elegg | 니케 수영복 도로시·일레그 복각 — 메인 딜러와 보조 자리를 구분하기 | 55.5 | 종료된 복각 기록 |
| news-nikke-yukiko-team-slot | 니케 아마기 유키코 — 딜러의 회복이 파티 한 자리를 바꿀 수 있을까 | 56.5 | 유키코 회복이 전담 힐러를 대체하는지 판단 |
| news-nte-14-preview-broadcast | 이환 1.4 프리뷰 방송 9월 16일 20시 30분 | 50.9 | (d) 방송 전 예고 |
| news-nte-illoi-lifeline-record | 이환 일로이 — 생명선 보드와 금기의 문을 구분한 모집 기록 | 57.3 | 8/19 종료된 모집 기록으로 얻어갈 것이 적음 |
| news-nte-zanhong-nanari-board | 이환 잔홍 신규·나나리 복각 — 보드 특전 횟수를 합산하면 안 된다 | 57.2 | 종료된 보드의 특전 카운트 규칙 |
| news-summer-2026-game-timeline | 7~9월 게임 기록 38편 — 신규 캐릭터와 업데이트 주기 한눈에 보기 | 73.8 | (b) 본문이 38편 목록(링크 모음) |
| news-the-weapons-01 | 더 웨폰스 개발기 1 — 큰 기획에서 한 턴의 선택으로 | 56.0 | 게임 개발 일지로 검색 의도 없음 |
| news-the-weapons-02 | 더 웨폰스 개발기 2 — 전투가 보이게 만드는 작업 | 55.9 | 위와 병합 |
| news-the-weapons-03 | 더 웨폰스 개발기 3 — 기능 완성 다음의 기준 | 55.3 | 위와 병합 |
| news-zzz-31-existing-agent-conditions | 젠레스 존 제로 미야비·아리아·파이퍼 — 3.1에서 다시 볼 추가 능력 조건 | 56.0 | 3 |
| news-zzz-31-remielle-sigrid | 젠레스 3.1 레미엘·시그리드 — 신규 둘의 역할부터 나눠 보기 | 56.5 | 3 |

## 3. 보강(REVISE) 상위 20 (최종 점수 높은 순, 즉 가장 적은 손질로 유지권 진입 가능)

| id | 최종 | 처방 |
|---|---|---|
| ai-clean-clone-handoff-check | 71.9 | 유지 경계. 빈 클론 검증 체크리스트(설치·환경 진단·테스트)로 정리하면 가치 상승. |
| news-nikke-sep22-swift-bunny-official-confirm | 71.6 | '지난 글의 미확인이 사실은 공식이었다'는 정정 프레이밍이 독자에게 낯섦. sep17 글과 병합해 바니걸 시즌 일정표 하나로 정리하고 정정은 한 줄로. |
| ai-worker-done-operator-still-busy | 70.6 | 완료 시각·종료 시각·배정 시각 3분리. 내부 용어(운영자·작업자) 풀어쓰기. |
| news-wuwa-35-36-story-cycle | 70.6 | 3.5→3.6 지역 연속성 정리는 복귀 유저에게 유용. 3.7 예고 이후 갱신하고 현재 버전 기준 복귀 순서를 표로 정리. |
| news-limbus-rodion-alteration-shop-extraction | 70.4 | 9/24 추출 시작 예고. 이후 공개된 스킬표·코스트로 갱신하거나 아래 rodion 글(kit-and-update-sep24)과 병합. |
| news-limbus-tgs2026-booth-sellout | 70.4 | TGS 2026 현장 소식(디지털데일리 인용). 행사 종료 후 검색 수요 낮음. 공식 후기·공개 콘텐츠 정리로 보강하거나 삭제. |
| news-nikke-sep3-full-redownload | 70.4 | 9/3 업데이트 재다운로드 용량(17GB/22GB)은 유용했으나 일정 부분이 지남. '용량 요건' 중심으로 상시 가이드화하고 일정 표는 제거. |
| news-nte-pixel-burst-double-reward | 70.4 | 9/21 종료된 이벤트. 일일 120·누적 840 한도 계산은 유용하므로 '반복되는 2배 이벤트 계산법' 상시 가이드로 재구성하거나 종료 표기 후 보관. |
| news-limbus-dimension-shredder-yisang-preview | 70.2 | 7월 미리보기 해설. 현재 실장된 최종 스킬 수치로 갱신하지 않으면 낡은 정보. 갱신하거나 캐릭터 정리글로 병합. |
| news-limbus-don-aug6-ego-preview | 70.2 | 8월 미리보기. 합 승패 효과 구분은 좋으나 시점 경과. 최종 수치 갱신 또는 병합. |
| ai-ai-colleagues-10 | 69.8 | 무응답 4구간 진단(수신·실행·생성·송신)이 유용. 봇 운영 일반론으로 제목 정리. |
| ai-ai-game-factory-06 | 69.8 | '부분완성' 상태 정의가 쓸 만함. 05와 병합해 '프로젝트 중단·부분 출고 기록법'으로. |
| news-limbus-cinq-east-honglu-preview | 69.8 | 8월 17일 공식 스킬표 기반 해설. 현재 실장 이후 정보(실제 성능 평가)가 없어 구형 정보. 출시 후 공식 수치로 갱신하거나 병합. |
| news-limbus-dawn-passive-state | 69.8 | 7월 문구 정정 해설로 현재 검색 수요 낮음. 파우스트·그레고르 패시브의 현행 동작 요약과 편성 메모 표로 정리하거나 캐릭터 가이드로 병합. |
| news-zzz-31-returning-checklist | 69.7 | 복귀 체크리스트 형식은 유용(초보자 가이드·시즌3 제2장·베이글 프로젝트). 3.3 기준으로 갱신해 상시 복귀 가이드로 전환. |
| apps-brightpocket | 69.6 | 앱 소개로는 구체적(40개 프롬프트, 하루 한 장 카드). 심사 상태 문구를 제거하고 칭찬 기록 습관 연구 자료를 인용하면 가치 상승. |
| apps-one-thing-today | 69.6 | 유지 후보. 심사 상태 문구 제거, 하루 한 목표 접근의 근거 자료 인용. |
| news-limbus-gregor-move-in-ego | 69.5 | 9월 3일 적용된 E.G.O 미리보기. 현행 수치로 갱신하거나 그레고르 정리글에 병합. |
| ai-stt-cache-request-provenance | 69.4 | STT 캐시 키에 모델·언어 포함 원칙. 일반 캐시 키 설계 글로 확장하면 가치 상승. |
| news-nikke-laplace-july-operating-note | 69.4 | 풀차지 5회→머신건 전환이라는 핵심은 쓸 만함. 현행 스킬 설명과 장탄 옵션 우선순위를 여러 출처로 비교한 캐릭터 가이드로 확장하고 maxwell 글과 병합. |

## 4. 유지(KEEP) 대표 5

- ai-swift-int-double-fatal-error-nan-infinity (96.2): AI 활용기: Swift Int(Double) 크래시 'Double value cannot be converted to Int' 원인과 막는 법
- news-nikke-belorta-pumpkin-witch-guide (96.7): 니케 벨로타: 펌킨 위치, 뽑아야 할까 — 밀어줄 지속 대미지 딜러가 없다면 패스
- apps-gpa-calculator (93.2): 학점 계산기 — 4.5 만점 평점에 4.3/4.5를 곱하면 안 되는 이유
- ai-ios-home-screen-display-name-plist (92.2): iOS 홈 화면 앱 이름이 다를 때: 최종 Info.plist부터 확인하기
- news-limbus-1115-known-issues-save-restore (91.6): 림버스 1.115.0 퀘스트 막힘 — '세이브 복원' 위치와 쓰면 안 되는 경우

## 5. 공통 약점 패턴과 구조적 처방
1. **앱 소개 틀 글 대량 복제(apps 약 45편).** '필요한 상황/실제로 할 수 있는 일/다운로드와 제공 상태/사용 전에 알아둘 점' 틀에 앱 이름만 바뀌고, 본문 절반이 App Store Connect 심사 상태 로그다. 삭제된 앱 기록(약 13편)과 VocaPuff 3종(DUP 0.91)이 대표적. 처방: 개별 앱 페이지는 색인 제외하고 앱 허브 1개(카테고리별 한 줄 소개)로 통합. 남길 앱만 '앱이 푸는 문제를 설명하는 해설'(산식·기준표·비교)로 재작성. 삭제된 앱·심사 상태 문구는 공개 본문에서 제거. 같은 본문 안의 상태 모순(예: dicefeel, 스토어 페이지 확인됨 vs 심사 대기)도 이 정리로 해소.
2. **500자짜리 이미지·PDF 도구 글(약 25편).** 두 문단 일반론이라 검색 수요(이미지 용량 줄이기, PDF 합치기 등)는 있는데 정보가 없다. 처방: '이미지 용량·형식 가이드', 'PDF 도구 가이드', '개인정보 가리기 가이드', 'SNS 규격표' 4~5편으로 병합하고 규격 수치·권장값을 공식 출처와 함께 표로 정리. 도구 페이지 자체는 그대로 두되 해설 글을 링크.
3. **끝난 이벤트·모집의 회고성 게임 소식(news 상당수).** 8~9월 모집·이벤트·미리보기를 9월 9~10일에 몰아 공개해 지금(10월 14일)은 종료된 정보가 많다. 같은 캐릭터를 3~4편으로 쪼갠 것도 중복(DUP 0.3~0.4). 처방: ①종료 일정 글은 '캐릭터/시스템 상시 가이드'(역할 비교표, 획득 경로, 현행 수치)로 병합 재작성 ②니케 제재 논란 4편은 타임라인 총정리 1편으로 ③협업(마코토·유키코)·애장품·바니걸 시즌도 각각 1편으로 ④종료일이 지난 글은 종료 표기 또는 색인 제외. 현재 진행 중이고 근거가 풍부한 글(벨로타 가이드, 이환 1.4 첫날, 림버스 1.115 세이브 복원)을 기준 모델로 삼을 것.
4. **개발 일지·자기참조 글(고래·웨폰스·합치기·시리즈 회고, 약 35편).** 검색 의도가 없고 내부 용어(요카이·페어리·웅삐·외뿔고래)와 커밋 날짜 서술이 중심이라 독자가 얻어갈 것이 약하다. AI 동료/게임 공장/고래 연재는 각 10편이 한 틀이라 시리즈 단위 중복도 크다. 처방: 연재마다 3~4편으로 압축하고 제목을 독자 질문형('AI 에이전트 역할 나누는 법')으로 바꿀 것, 표·체크리스트로 정리, 작성 과정 회고(career-03, workbench-07)와 시리즈 요약(game-factory-10)은 삭제 또는 색인 제외. 목차 글(ai-writing-index, summer timeline)은 색인 제외.
5. **강점(유지할 구조).** 오류 증상→환경→재현→원인→해결→시험 범위로 쓴 기술 해설(Swift Int(Double), set -e, EXIF, iOS 표시 이름, ITMS-90474 등)과 검산 가능한 계산기 해설(학점·대출·적금·부가세·퇴직금 등)은 검색 수요와 완결성이 모두 높다. 신규 글은 이 두 틀을 기준으로 만들고, 제목에 독자의 질문(증상·검색어)을 담는 것이 좋다.

## 6. 평가의 한계
- 글 본문을 끝까지 읽고 글 안에서 판단했으며, 외부 사실(법령 조문, 게임 공식 공지, 인용 논문·이슈 번호, 스토어 상태)은 대조하지 않았다. 계산기 글은 산식을 직접 검산했지만(학점·대출·적금·비밀번호 엔트로피·부가세 등) 법적·세무 정확성은 별도다. 외부 인용은 flags에 '확인 불가'로 표기.
- '찾아볼 만함(Q2)'은 검색량 데이터 없이 주제·제목·시점으로 추정했다. 게임 소식의 시점 판정은 오늘(2026-10-14) 기준이라, 종료일이 지난 글이 낮게 나온다.
- 같은 틀의 글에서 DUP 수치(자동 계산)를 blocker 근거로 그대로 사용했다. 경계값(DUP 0.5 안팎)의 일부 글은 판정이 갈릴 수 있다.
- 루브릭이 한 번 바뀌어 개정 전(직접 경험 가산) 점수와 다르다. 분포는 개정 후 기준이며, 개정 전 결과는 별도 파일로 남겼다.
- 점수 간격(±3점)은 오차 범위로, 경계 근처(60·72점 전후) 판정은 보수적으로 읽어야 한다.
