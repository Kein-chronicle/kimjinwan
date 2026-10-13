# 내 앱 소개 작성 원본 — 앱을 허브에 올리는 사람용

이 문서만 읽고 `data/authoring/apps/<slug>.json` 을 쓰고 점검까지 끝낸다. 대상 사이트: kimjinwan.com `/content/apps/<slug>/`(앱스토어에서 받는 모바일 앱 목록. 웹 도구 `apps.kimjinwan.com` 과 별개이고, 앱 제작·심사 글 `/content/blog/apps/` 와도 별개다).
규칙의 단일 출처는 코드다: `scripts/lib/apps_authoring.mjs`(`validateApp`·`imageProblems`). 허브 빌드와 점검 CLI 가 같은 함수를 쓰므로 CLI 가 통과하면 빌드도 통과한다.

## 1. 큰 그림
- **목록에 오르는 앱** = 앱스토어 공개 조회(iTunes lookup, `country=kr`)에서 1건으로 확인되는 앱 중 편집 원본이 검증·이미지까지 통과한 앱. 조회 0건이면 "심사 상태 미확인"이지 "심사 중"이 아니다 — 올리지 않는다(스토어 버튼이 열리지 않는다).
- 편집 원본이 없거나 검증에 실패하면 그 앱은 **조용히 빠진다**(빌드는 계속, stderr 경고와 `content-src/excluded.json` 에 사유). 쓰기만 하고 점검을 안 돌리면 목록에 안 나온다 — 그래서 반드시 점검 CLI 를 돌린다.
- 편집 원본은 **사람(또는 에이전트)이 소스에서 확인한 사실로 직접 쓴 문장**이다. 생성기는 템플릿으로 문장을 찍어내지 않는다. 스토어에서 오는 사실(이름·번들 ID·버전·분류·언어·가격·출시일·갱신일·최소 OS·연령 등급)은 `content-src/apps-store.json` 캐시에서 자동으로 붙는다 — 편집 원본에 쓰지 않는다.
- 분류(`category`)와 상태(`status`)만 편집 원본이 정한다. 노출 순서는 최신 출시순(스토어 출시일), 쪽당 20건.

## 2. 작성 기준(가장 중요)
1. **소스에서 확인되는 사실만 쓴다.** 읽은 자료: 스토어 설명문·스크린샷, 앱 저장소(README·화면 정의·소스), 앱을 직접 실행해 본 결과. 확인 못 한 것은 쓰지 않고 `verified.method` 에 "직접 실행하지는 않았다"처럼 솔직히 적는다. 이 날짜·방법은 화면에 "앱스토어 공개 정보와 앱 구성 기록으로 확인한 내용입니다"라는 한 줄과 날짜로만 나온다.
2. 본문은 **400자 이상**(공백 제외, `oneLiner`·`about`·`audience`·`features`·`howTo`·`notes` 합계). 억지로 늘리지 않는다. 쓸 사실이 모자라면 편집 원본을 만들지 말고 제외한다(5절).
3. 서술형 평서문(`~다`). **1인칭 금지**: 제가·저는·저의·저를·저에게·제게·저희·"제 …". 주의: 검사는 글자 그대로라 **"문제가"·"제가" 같은 낱말 속 연속 글자도 걸린다** — "문제들이"처럼 바꿔 쓴다. 이모지 금지.
4. 금지어: '원문'·'기즈모'·'gizmo'. 만드는 공정을 가리키는 말도 본문·이미지 설명에 쓰지 않는다: 공장·게이트·파이프라인·R-G/L-G·QA·DoD·Forge·스타터·검증·빌드·커밋·리서치·렌더·`.json`·`.md`·`.ts`·manifest·런타임·OpenAI·ASC·심사 노트·반려·4.3 (정확한 목록은 `INTERNAL_APPS`). 사용자가 쓰는 말로 쓴다. `verified` 는 화면에 안 나오므로 적용되지 않는다(단 '원문'·'기즈모'는 여기도 금지).
5. 앱마다 문장이 달라야 한다. 같은 틀로 찍어낸 문장은 시험(앱 간 문장 자카드 12% 이하, 같은 긴 문장 1개 이하)에서 잡힌다. 자매 앱(언어만 다른 앱)도 화면·예시 단어 등 실제로 다른 점을 써서 구분한다.
6. 근거 없는 홍보 문구("최고", "누구나 즐길 수 있는")를 쓰지 않는다. 숫자·화면 이름·버튼 이름·스토어에 적힌 한계(예: "의학 조언이 아니다", "영어 화면")를 쓴다. 광고(배너·보상형)가 있으면 있다고 쓴다.
7. 내부 규칙·정책 용어를 사용자 앞에 쓰지 않는다(위 4항). 그 앱의 제작·심사 글이 허브에 있으면 상세 하단에 '제작·심사 기록 읽기' 링크가 자동으로 붙는다.

## 3. 필드 정의
파일명 = `<slug>.json`. slug 는 소문자·숫자·하이픈이고 `page`·`category` 는 쓸 수 없다.

| 필드 | 형식 | 규칙 | 화면에서의 위치 |
|---|---|---|---|
| `slug` | 문자열 | 파일명과 같아야 한다 | URL |
| `name` | 문자열 | 스토어에 등록된 이름 그대로 | 제목·카드 |
| `storeId` | 숫자 문자열 | App Store ID(주소의 `id` 뒤 숫자) | 'App Store에서 보기' 버튼 `https://apps.apple.com/kr/app/id<ID>` |
| `status` | `live` \| `in_review` | `live` = 스토어 조회 1건. `in_review` = 제출 사실이 확인되고 아직 스토어에 없음(스토어 버튼 없이 '심사 중' 표시, 지금은 쓰지 않는다) | 상태 배지·버튼 |
| `category` | `calc` `table` `game` `learn` `faith` `life` `mind` | 정확히 하나. 새 분류가 필요하면 `APP_CATEGORIES` 에 추가(URL `/content/apps/category/<id>/`) | 분류 칩·목록 |
| `oneLiner` | 문자열 | 15~110자 한 문장. 앱이 무엇을 하는지 | 카드 소개·상세 첫 줄·메타 설명 |
| `about` | 문자열 | 100자 이상, 문단은 `\n`. 무슨 앱이고 화면·동작이 어떤지 | "이런 앱입니다" |
| `audience` | 문자열 | 20자 이상. 어떤 사람이 어떤 때 쓰는지 | "이런 분께 맞습니다" |
| `features` | 문자열 배열 | 3~7개, 각 8자 이상. 핵심 기능 | "핵심 기능" |
| `howTo` | 문자열 배열 | 2개 이상. 화면 이름·버튼 이름으로 순서대로 | "사용 방법"(번호 목록) |
| `notes` | 문자열 배열 | 1개 이상. 한계·광고·언어·데이터 보관·주의 | "알아둘 점" |
| `images` | 배열 | 아이콘 1장(맨 앞, `role: icon`) + 화면 2~4장(`role: screen`), 6절 | 아이콘·스트립·갤러리 |
| `guide` | 문자열(선택) | 앱 slug 와 다른 제작·심사 글의 blog slug | '제작·심사 기록 읽기' |
| `verified` | 객체 | `{date, method, sources[]}` — 확인한 날짜(YYYY-MM-DD)·방법·읽은 자료 | 날짜만 표시 |

## 4. 복사해서 쓰는 템플릿
`<slug>` 와 `…` 를 채운다. 완성 예시: [`dream-meaning.json`](../data/authoring/apps/dream-meaning.json)(심리·재미), [`plate-calculator.json`](../data/authoring/apps/plate-calculator.json)(계산).
```json
{
  "slug": "<slug>",
  "name": "스토어에 등록된 이름",
  "storeId": "<App Store ID>",
  "status": "live",
  "category": "calc",
  "oneLiner": "…를 …하면 …를 알려 주는 …앱이다.",
  "about": "…를 입력하면 …가 나온다. …\n두 번째 문단: 화면 구성·특징.",
  "audience": "…한 사람, …할 때 쓰는 사람에게 맞는다.",
  "features": ["…할 수 있다.", "…를 지원한다.", "…를 보여 준다."],
  "howTo": ["첫 화면에서 '…'를 눌러 …를 입력한다.", "…화면에서 …를 확인한다."],
  "notes": ["…는 앱이 하지 않는다.", "화면 문구는 …이고 …한 광고가 붙는다."],
  "images": [
    {"src": "store:icon", "role": "icon", "alt": "<앱 이름> 앱 아이콘, …색 바탕에 …가 그려져 있다"},
    {"src": "store:1", "role": "screen", "alt": "…화면. …가 보이고 …버튼이 있다"},
    {"src": "store:2", "role": "screen", "alt": "…화면. …"}
  ],
  "verified": {"date": "2026-10-14", "method": "스토어 설명문·스크린샷과 앱 화면 정의를 대조해 썼다. 앱을 직접 실행해 보지는 않았다.", "sources": ["iTunes lookup id<ID> (kr)", "…"]}
}
```

## 5. 새 앱 추가 절차
1. 앱이 스토어에 올라와 조회되는지 확인한다: `https://itunes.apple.com/lookup?id=<ID>&country=kr` 가 `resultCount: 1`(공개 API, 키 불필요).
2. 스토어 캐시를 갱신한다(네트워크 필요): `cd ~/Projects/kimjinwan && node scripts/build_content_apps.mjs --refresh-store`. 개발자 계정의 공개 앱 전체와 편집 원본에 적힌 storeId 를 읽어 `content-src/apps-store.json` 을 다시 쓴다.
3. 자료를 읽는다(스토어 설명문, 화면 정의, 앱 저장소, 가능하면 직접 실행). 6절 이미지를 고른다. 스토어 스크린샷은 `store:N`(1부터)이고, 어느 번호가 어느 화면인지는 눈으로 보고 `alt` 를 쓴다.
4. 4절 템플릿으로 `data/authoring/apps/<slug>.json` 을 쓴다.
5. 이미지를 만든다: `node scripts/build_content_apps_images.mjs --only <slug>` (Pillow·python3 필요, `store:` 원본이면 네트워크). 이 slug 의 파일만 다시 만들고 `content-src/images.json` 의 `apps` 항목을 갱신한다. `--force` 는 전부 다시.
6. 점검한다: `node scripts/hub_check_app.mjs <slug> --online` → **exit 0 이어야 한다.** 실패하면 출력 하단 '다음 행동'을 따른다.
7. 스냅샷을 만든다: `node scripts/build_content_apps.mjs`(허브 `data/content-hub.json` 의 apps 섹션과 `content-src/apps/<slug>.json` 갱신). 이어 `node scripts/build.mjs >/dev/null` 과 `node --test tests/*.test.mjs`.
8. 아래 경로를 커밋한다.
   - `data/authoring/apps/<slug>.json`
   - `assets/content/apps/<slug>-icon.webp`·`<slug>-1..4.webp`
   - `content-src/images.json`·`content-src/apps-store.json`·`content-src/apps/<slug>.json`·`data/content-hub.json`
   - 빌드 산출물(`content/` 등)과 공유 카드: 개수가 바뀌므로 `node scripts/build_og.mjs` 를 돌린 뒤 `scripts/build.mjs` 를 다시 돌려 함께 커밋한다.
9. 발행은 `scripts/publish.sh --reason "앱 <이름> 허브 등록"`(docs/PUBLISH.md).

**사실이 모자라 쓰지 않기로 했을 때**: 파일을 만들지 말고 `data/authoring/apps/_progress.json` 의 `excluded` 에 `{"id": "<slug>", "reason": "…"}` 를 적는다. 허브는 이 앱을 목록에 넣지 않고 사유를 `excluded.json` 에 남긴다. 점검 CLI 는 "제외 확정"(exit 0)으로 답한다. 스토어에서 내려간 앱도 편집 원본을 지우고 같은 방식으로 적는다(옛 URL 은 404 가 되므로 `data/content-redirects.json` 에 이유와 함께 옮길 곳을 정한다).

## 6. 이미지 규칙
- 아이콘 1장(맨 앞) + 화면 2~4장. 항목: `{"src": "…", "role": "icon|screen", "alt": "…"}`, `src` 는 서로 달라야 한다.
- `src` 형식: `store:icon`(스토어 아이콘 512), `store:N`(스토어 스크린샷 N번, 1부터 — 한국 스토어 기준이라 한글화된 화면이 있으면 그것이 온다), `catalog:<경로>`(앱 공장 카탈로그의 파일, 그 폴더가 있을 때만), `repo:<경로>`(홈 디렉터리 기준 상대 경로의 파일). 우선순위는 ① 앱 저장소의 자료 ② 스토어 스크린샷. 표지·합성 이미지는 쓰지 않는다 — 실제 앱 화면이어야 한다.
- `alt` 는 **12자 이상**, 그 화면에 실제로 보이는 것을 문장으로 설명한다(본문과 같은 금지어 규칙).
- 결과물과 예산(`IMG_BUDGET`): 아이콘 `<slug>-icon.webp` 256×256 **15KB 이하**, 화면 `<slug>-1..4.webp` 세로 이미지 폭 400·가로 이미지 폭 800 이하 **90KB 이하**(비율 유지). 변환기가 화질을 낮춰 맞춘다.
- 서브도메인·스토어(mzstatic) 핫링크를 쓰지 않는다. 허브가 변환본을 자체 호스팅하고 `width`·`height` 를 단다.
- 이미지 목록(`images[].src`)을 바꾸면 변환기를 다시 돌려야 한다. 매니페스트의 `from` 서명이 편집 원본과 다르면 허브는 그 앱을 목록에서 뺀다.

## 7. 점검 CLI
```
node scripts/hub_check_app.mjs <slug> [--json] [--online] [--root <허브 저장소>]
```
통과 시 exit 0 + 커밋할 경로, 실패 시 exit 1 + 항목별 `[실패]`·`다음 행동`, 사용법 오류는 exit 2. `--online` 은 iTunes lookup 으로 스토어 공개 여부를 본다. 검사 항목: 편집 원본 파일·JSON 문법, 스토어 캐시(live 인 앱의 storeId), 금지어, 본문 길이, verified, 이미지 정의, 필수 필드, 이미지 파일·매니페스트·크기 예산.

## 8. 흔한 실패
| 증상 | 원인 → 고치는 법 |
|---|---|
| `1인칭(제가·저는 …) 금지` 인데 안 썼다 | "문제가", "제가" 같은 낱말 속 글자도 걸린다 → "문제들이"·"과제가 아니라"처럼 바꾼다 |
| `내부 공정 용어('검증') 금지` | '검증'·'빌드'·'렌더' 같은 공정어가 일반 낱말로도 걸린다 → "확인", "계산"으로 쓴다 |
| `스토어 캐시에 이 storeId 가 없다` | ID 오타이거나 캐시가 낡았다 → `build_content_apps.mjs --refresh-store`. 그래도 없으면 스토어에 아직 없는 앱이다(올리지 않는다) |
| `이미지 매니페스트가 … src 와 다르다` | `images` 를 고치고 변환기를 안 돌렸다 → `build_content_apps_images.mjs --only <slug>` |
| `role 이 screen 인 이미지는 2~4장` | 아이콘 외 화면이 1장이거나 5장 이상 → 개수를 맞춘다 |
| 한국어인데 `oneLiner` 가 영어 | 소개는 한국어로 쓴다(앱 이름만 영어 가능) |
| 허브에 앱이 안 나온다 | 편집 원본이 검증·이미지에서 실패했다 → `node scripts/build_content_apps.mjs` 의 stderr 경고와 점검 CLI 를 본다 |
| 시험 `문장 중복 자카드` 실패 | 자매 앱에 같은 문장을 복붙했다 → 앱마다 실제로 다른 화면·기능·예시로 다시 쓴다 |

## 도입 기록
2026-10-14: 콘텐츠 허브에 '내 앱' 섹션(`/content/apps/`)을 신설했다. 웹 도구(apps.kimjinwan.com)와 분리된 모바일 앱 목록이고, 앱스토어 공개 조회(iTunes lookup, kr)에서 확인되는 50개 전부(앱 공장 산출 37개, 공장 밖 기존 앱 13개 = VocaPuff 3종·매일 성경 필사·냠냠 성격 테스트·Merge Cat·Merge Whale·My Whale·Whale Book·작은 답안지·Whale Survivors·얼음 발자국·먹빛 겹치기)를 실었다. 심사 중으로 기록됐으나 스토어 조회가 0건인 앱, 준비 중·반려된 앱은 제외했다(`_progress.json`). 편집 원본 50개는 스토어 설명문·스크린샷·앱 화면 정의·핵심 기능 기록을 읽고 직접 쓴 한국어 소개이며, 앱을 직접 실행해 확인하지는 않았다. 목록은 아이콘과 스크린샷 3장 스트립을 가진 2열 카드, 분류 7개(계산·측정, 모임·보드게임 도구, 게임, 배움·연습, 신앙생활, 생활·기록, 테스트·재미), 쪽당 20건이다. 새 파일: `scripts/lib/apps_authoring.mjs`, `scripts/build_content_apps.mjs`(섹션 재생성·`--check`·`--refresh-store`), `scripts/build_content_apps_images.mjs`, `scripts/hub_check_app.mjs`, `tests/apps.test.mjs`, 스토어 캐시 `content-src/apps-store.json`. 허브 전체 페이지는 458쪽에서 늘었다(색인 3쪽+분류 7곳 쪽, 상세 50). 이미지 변환본은 약 2.1MB(앱당 평균 43KB).
