# AI 연결 기준 (2026-10-14)

제작에 사용한 AI 도구(`ai_tools`)와 실행 시 연결 요구사항(`ai_connection`)은 별개다. 원본은 kimjinwan/data/services.json이며 서비스 허브 js/data.js와 동기화한다.

- none: 모델 없이 사용
- optional: 모델 없이 사용 + AI 연결 지원
- required: AI 연결 지원 + AI 연결 필수

필수 여부는 단순 방문·설정·이전 결과 조회가 아닌 주요 작업을 기준으로 판단한다. 기기 내 모델을 사용하는 기능이 있어도 별도 모델·에이전트 연결이 필요하지 않으면 독립 사용으로 분류할 수 있다.

선택 연결: Prism Studio(README AI 연결, 기본 편집), DocLoom(README AI 연결 선택), Proofdesk(apps/web/src/review/landing-content.ts 및 apps/server/src/review/routes.ts의 코드 전용 검사).

필수 연결: Forge, Pitchwright, Casewright, Fitwright, CodeMotionMaker. 각 프로젝트 README, 에이전트 실행 흐름과 기존 상세 안내를 확인했다.

연결 없이 사용: Cel Studio, Kein Games, Kein Tools, Pagefold, Diffnook, Gizmo Store. Gizmo Store는 탐색·설명·다운로드 기준이며 개별 도구 실행은 각 안내를 따른다. 이 예외는 상세 설명에도 표시한다.

기존 용도 카테고리와 AI 기준을 함께 선택하면 교집합을 표시한다. 선택 연결은 중복 집계하므로 AI 분류별 수의 합은 전체 서비스 수와 다르다.
