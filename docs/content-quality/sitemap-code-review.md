# 사이트맵·낡은 생성물 제거 독립 코드 검토

검토일: 2026-10-14. 최신 판정: **PASS**, 남은 차단 문제 0건. 아래 B1은 수정 전 발견 이력이다.

## 수정본 재검토

작성자가 recursive readdir를 제거하고 Dirent를 읽는 수동 walker로 바꾼 코드를 확인했다. content 자체가 심링크이면 정리 시작 전에 오류를 내고, 하위 디렉터리·파일 심링크는 탐색 대상에서 제외한다. 따라서 최초 재현의 루트/중첩 링크를 통한 외부 index 삭제가 차단됐다.

`node --test --test-name-pattern='내린 상세|심링크' tests/build.test.mjs`로 임시 폴더만 사용하는 **2개 시험을 실행해 모두 통과**했다. 일반 낡은 페이지 제거·현재 페이지/자산 보존, 루트 링크 거부·중첩 링크와 외부 파일 보존을 확인했다. 전체 빌드와 생성물 기반 시험은 실행하지 않았다. 빌더의 기존 파일 쓰기 경로까지 외부 프로세스의 동시 링크 교체에 안전하다는 의미는 아니며, 이번 판정은 정적인 저장소 트리의 정리 함수 범위다.

대상: 허브 scripts/build.mjs·robots.txt·build/content/site 시험 diff, 블로그 sitemap.xml.ts·seo/ai-publication/translations 시험 diff, 글 로더와 canonical 구성. 전체 빌드·커밋·배포·실제 원고 상태 변경은 하지 않았다. 부모 세션의 verify와 충돌하지 않도록 생성물 기반 시험도 실행하지 않았다.

## 통과한 설계

- 블로그 사이트맵은 publishedPosts에서 실제 발행된 원고만 받으며 한국어 상세를 제외한다. 외국어 실제 원고와 로케일/카테고리 목록은 남긴다. Layout.astro의 한국어 상세→허브 canonical 규칙과 일치한다. 번역 준비 안내는 publishedPosts에 실제 번역 원고로 들어가지 않으므로 상세 URL이 추가되지 않는다.
- 새 seo 시험은 사이트맵에 들어간 모든 URL의 실제 산출물·자기 canonical·noindex 부재를 확인한다. 단순 문자열 개수 비교보다 의미 있는 검사다. translations 시험은 실제 번역본 URL이 남고 한국어 URL은 빠지는 것을 검증한다.
- 허브 pagination 필터는 model.pages의 사이트맵 입력만 바꾸며 out 페이지 생성과 자기 canonical은 건드리지 않는다. 기존 content 시험이 페이지 존재, 자기 canonical, prev/next 및 탐색 링크를 검사하므로 후속 페이지까지 지우는 회귀를 잡을 수 있다. page/1은 원래 생성되지 않아 현재 정규식이 1을 포함하는 것은 실제 동작 문제는 아니다.
- 허브 robots.txt에서 블로그 사이트맵 선언만 제거하며 Disallow는 추가하지 않는다. 블로그 자체 robots.txt는 자기 사이트맵을 계속 선언하므로 남긴 외국어 정본을 발견할 경로가 있다.
- 일반 디렉터리에서 prune은 out에 존재하는 index.html을 보존하고 다른 이름의 자산은 지우지 않는다. 삭제 후 빈 상위 폴더만 content 경계까지 제거한다. 허브의 기존 생성물 시험은 content의 index.html 전체가 빌더 산출물이라는 저장소 계약을 확인한다.

## B1. 디렉터리 심링크를 따라 저장소 밖 index.html을 삭제 — 수정 완료

위치: scripts/build.mjs의 pruneStaleContent. recursive readdir 후 최종 index.html만 lstat하므로 그 상위 디렉터리의 심링크를 검사하지 않는다. Node v26.7.0에서 recursive readdir는 중첩 디렉터리 심링크도 따라간다.

두 경우를 독립 /tmp 폴더에서 실제 재현했다.

1. root/content를 external 폴더로 연결하고 external/index.html 생성. pruneStaleContent(root,{})는 `content/index.html`을 제거했다고 반환했고 external 파일이 실제로 사라졌다.
2. root/content는 일반 폴더, 그 아래 link만 external로 연결. recursive readdir 결과가 `link`, `link/index.html`이었다. prune은 external/index.html을 먼저 삭제하고, 이어 link를 rmdir하려다가 ENOTDIR로 실패했다. 실패 종료가 외부 삭제를 되돌려 주지 않는다.

출력:

```text
base link: [ 'content/index.html' ] external survives: false
nested entries [ 'link', 'link/index.html' ]
Error: ENOTDIR: not a directory, rmdir '.../root/content/link'
```

**최종 파일이 일반 파일이라는 확인만으로 안전한 경로가 되지 않는다.** 권장 수정은 content 자체가 일반 디렉터리인지 lstat로 검사하고, 각 하위 항목을 withFileTypes 또는 lstat로 확인하며 디렉터리 심링크를 탐색하지 않는 수동 walker를 쓰는 것이다. 빈 디렉터리 제거도 실제 탐색한 일반 디렉터리에 한정한다. 경로 이탈을 막고 싶다면 realpath containment 검사도 보조로 둔다. 루트 링크·중첩 링크·파일 링크 회귀 시험에서 외부 파일과 링크가 모두 보존되는지 확인해야 한다.

## 비차단 보강

- 일반 prune 시험은 자산과 현재 페이지 보존을 검사하지만 심링크, 빈 content, index.html 자체가 링크인 경우, 현재 페이지와 낡은 페이지가 같은 부모를 공유하는 경우를 추가하면 경계가 분명해진다.
- content 아래 index.html이 전부 생성물이라는 가정은 현재 저장소 검사와 일치한다. 향후 사람이 관리하는 페이지를 이 위치에 추가한다면 이번 prune은 이를 삭제하므로 소유권 정책 또는 생성물 manifest를 바꿔야 한다. 현재 요청의 경계 밖까지 삭제하도록 확대하지 않는다.
- ai-publication 시험 이름은 내림 수 증가에도 ‘33편/4편 제외’로 남아 있다. 동작의 실패는 아니지만 이름을 실제 배열에 맞추거나 개수를 빼는 편이 정확하다.
- translations 시험은 원고 파일 존재를 기준으로 번역 그룹을 만들고 발행 상태를 읽지 않는 기존 한계가 있다. 향후 번역 초안을 보존하면 실패할 수 있으므로 발행된 실제 번역을 기준으로 세는 개선을 권한다. 이번 diff가 새로 만든 버그는 아니다.

## 판정 범위

사이트맵과 canonical 분리 설계는 통과한다. 최초 B1 때문에 BLOCK했으나 수정본 코드와 두 격리 회귀 시험을 확인해 PASS로 변경했다. 이 보고서는 코드·임시 파일 재현에 대한 검토이며 실제 최신 빌드 산출물이나 라이브 삭제 완료를 증명하지 않는다.
