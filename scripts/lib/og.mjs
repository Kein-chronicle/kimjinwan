// scripts/lib/og.mjs — 페이지 메타(제목·설명)와 공유 카드(og:image) 문구의 단일 출처.
// build.mjs(HTML 메타)와 build_og.mjs(카드 PNG)가 같은 함수를 쓴다 → 숫자가 따로 놀 수 없다.
// 카드 PNG 는 수동 생성이므로, build_og.mjs 가 렌더한 문구와 PNG 해시를 scripts/og-cards.lock.json 에 적고
// tests/site.test.mjs 가 "데이터에서 다시 계산한 문구 == lock == PNG 해시" 를 검사한다.

export const SITE = 'https://kimjinwan.com';
export const SITE_NAME = 'Kein — 김진완';
// 경력 연수: src/ 본문에 "11년" 이 문장으로 박혀 있어 데이터에서 따로 계산하지 않는다(따로 계산하면 본문과 어긋난다).
export const CAREER_YEARS = 11;
export const ROLE_LINE = '개발자 · PM';

export function facts(data, projects) {
  return {years: CAREER_YEARS, factories: data.factories.length, projects: projects.length};
}

// 페이지별 메타 + 카드 문구. key 는 assets/og/<key>.png 이름이기도 하다.
export function pageMeta(f) {
  return {
    home: {
      title: '김진완 — AI로 만들고 운영하는 개발자 · PM',
      description: `개발자·PM 김진완의 허브. ${f.years}년 현장 경력을 바탕으로 AI와 함께 직접 만들고 운영하는 서비스, 웹게임, 웹 도구, 블로그, 그리고 그 일을 돌리는 AI 공장 ${f.factories}곳을 한곳에 모았습니다.`,
      kicker: '',
      headline: 'AI로 만들고 운영하는 서비스 · 공장 · 기록',
    },
    works: {
      title: '작업물 — 직접 만들어 운영하는 서비스 · 김진완',
      description: '김진완이 AI와 함께 직접 만들어 운영하는 서비스, 웹게임, 웹 도구, 앱, 블로그를 한 페이지에 모았습니다. 종류별로 골라 보고 각 작업물의 현재 상태와 바로가기를 확인할 수 있습니다.',
      kicker: 'WORKS',
      headline: '직접 만들어 운영하는 서비스와 작업물',
    },
    factories: {
      title: `서비스를 만드는 AI 공장 ${f.factories}곳 — 김진완`,
      description: `앱, 웹게임, 쇼츠 영상, 블로그, 웹 도구를 꾸준히 만들어 내도록 직접 설계한 AI 공장 ${f.factories}곳. 공장마다 만드는 것과 거치는 단계, 출시 전에 확인하는 기준, 사람이 직접 맡는 일을 정리했습니다.`,
      kicker: 'AI FACTORIES',
      headline: `서비스를 만드는 AI 공장 ${f.factories}곳`,
    },
    career: {
      title: `경력 ${f.years}년과 프로젝트 ${f.projects}개 — 김진완`,
      description: `영업·기획에서 시작해 개발자, 개발팀장, 차량 소프트웨어 PM까지 이어진 ${f.years}년 경력과 수행 프로젝트 ${f.projects}개 전체. 시기별 역할과 대표 프로젝트, 경력을 게임으로 둘러보는 Career Run도 있습니다.`,
      kicker: 'CAREER',
      headline: `${f.years}년, 현장에서 쌓은 경력과 프로젝트 ${f.projects}개`,
    },
    // game/index.html 은 손으로 쓴 파일이다. 아래 문구와 같은지 site.test.mjs 가 검사한다.
    game: {
      title: '김진완 인생게임 — Career Run',
      description: `Career Run — 김진완의 ${f.years}년 경력과 프로젝트를 픽셀 게임으로 둘러봅니다. 영업사원, 개발자, 개발팀장, PM 네 스테이지를 지나며 시기별 역할과 대표 프로젝트를 만나 보세요.`,
      kicker: 'CAREER RUN',
      headline: 'Career Run — 김진완의 경력을 게임으로',
    },
  };
}

export const CARD_KEYS = ['home', 'works', 'factories', 'career', 'game'];
export const cardPath = key => `assets/og/${key}.png`;
export const cardAlt = m => `“${m.headline}” — Kein 로고와 김진완 · ${ROLE_LINE}, kimjinwan.com이 적힌 공유 카드`;
// 카드에 실제로 찍히는 문구(lock 대조 대상)
export const cardText = m => ({wordmark: 'Kein', name: '김진완', role: ROLE_LINE, kicker: m.kicker, headline: m.headline, domain: 'kimjinwan.com'});
