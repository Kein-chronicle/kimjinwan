// ===== 언어 토글 =====
function setLang(l){
  document.body.classList.toggle('en', l==='en');
  document.documentElement.lang=l;
  document.getElementById('ko').classList.toggle('on', l==='ko');
  document.getElementById('en').classList.toggle('on', l==='en');
  localStorage.setItem('lang',l);
  renderProjects();
}
// ===== 네비 스크롤 =====
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>20));

// ===== 프로젝트 =====
const P=window.PROJECTS||[];
let curFilter='all', shown=9;
const COMP_ORDER=['오비고','엠투에스','에쿼티언','더팀지케이','지엔글로벌'];

const en=()=>document.body.classList.contains('en');
const pName=p=>en()&&p.nameEn?p.nameEn:p.name;
const pDesc=p=>en()&&p.descEn?p.descEn:p.desc;
const pStack=p=>(en()&&p.stackEn?p.stackEn:p.stack)||[];

// 픽토그램 (24x24 라인 아이콘, 그래디언트 stroke)
const ICONS={
 car:'<path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 21 8l2 5"/><path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1z"/><path d="M6 13v-1m12 1v-1"/>',
 game:'<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="11" r="1.1"/><circle cx="18.5" cy="13.5" r="1.1"/>',
 pay:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 9.5h20M5.5 15h4"/>',
 gov:'<path d="M12 3l9 5H3z"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
 report:'<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="7"/><rect x="12.5" y="7" width="3" height="11"/><rect x="18" y="13" width="3" height="5"/>',
 vr:'<rect x="2" y="7" width="20" height="10" rx="3"/><path d="M9 17a3 3 0 0 1 6 0"/><path d="M2 11h2m16 0h2"/>',
 chain:'<rect x="3" y="9" width="6" height="6" rx="1.5"/><rect x="15" y="9" width="6" height="6" rx="1.5"/><path d="M9 12h6"/>',
 app:'<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/>',
 web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
 team:'<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.4"/><path d="M3.5 19a5 5 0 0 1 10 0M14 19a4.2 4.2 0 0 1 6.5-1.2"/>',
 box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'
};
function projIcon(p){
  const t=(p.name+' '+p.desc+' '+(p.stack||[]).join(' '));
  let k='box';
  if(/벤츠|IVI|Live TV|커넥티드|단말|차량/.test(t))k='car';
  else if(/게임|PickJoy|멀티게임|게임패드|AR/.test(t))k='game';
  else if(/결제|연동/.test(t))k='pay';
  else if(/국책|과제|IITP/.test(t))k='gov';
  else if(/보고|유지보수|운영|M&S/.test(t))k='report';
  else if(/VR|XR|Unity|Pico/.test(t))k='vr';
  else if(/블록체인|코인|토큰|Solidity/.test(t))k='chain';
  else if(/팀|빌딩|채용/.test(t))k='team';
  else if(/앱|App|iOS|Swift|Flutter/.test(t))k='app';
  else if(/웹|Web|React|홈페이지/.test(t))k='web';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="url(#picg)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
}
function buildFilters(){
  const f=document.getElementById('filters');
  const comps=[...new Set(P.map(p=>p.company))].sort((a,b)=>COMP_ORDER.indexOf(a)-COMP_ORDER.indexOf(b));
  const en=document.body.classList.contains('en');
  const all=en?'All':'전체';
  let html=`<button data-f="all" class="${curFilter==='all'?'on':''}">${all} (${P.length})</button>`;
  comps.forEach(c=>{
    const n=P.filter(p=>p.company===c).length;
    const label=en?(P.find(p=>p.company===c).companyEn):c;
    html+=`<button data-f="${c}" class="${curFilter===c?'on':''}">${label} (${n})</button>`;
  });
  f.innerHTML=html;
  f.querySelectorAll('button').forEach(b=>b.onclick=()=>{curFilter=b.dataset.f;shown=9;renderProjects();});
}

function renderProjects(){
  buildFilters();
  const grid=document.getElementById('pgrid');
  let list=P.filter(p=>curFilter==='all'||p.company===curFilter);
  // 최신 회사/연도 우선 정렬
  list=list.slice().sort((a,b)=>(b.year+'').localeCompare(a.year+''));
  const vis=list.slice(0,shown);
  grid.innerHTML=vis.map(p=>{
    const comp=en()?p.companyEn:p.company;
    const ico=projIcon(p);
    const thumb=p.img?`<div class="thumb" style="background-image:url('${p.img}')"></div>`
                     :`<div class="thumb noimg"><span class="pico">${ico}</span><i class="wm">${comp}</i></div>`;
    const stack=pStack(p).slice(0,4).map(s=>`<span>${s}</span>`).join('');
    return `<div class="pcard" onclick="openModal(${p.id})">
      ${thumb}
      <div class="pbody">
        <div class="pmeta">${comp} · ${p.year}</div>
        <h3>${pName(p)}</h3>
        <p>${pDesc(p)}</p>
        <div class="pstack">${stack}</div>
      </div></div>`;
  }).join('');
  const mb=document.getElementById('moreBtn');
  mb.style.display = shown<list.length ? 'inline-flex':'none';
}
document.getElementById('moreBtn').onclick=()=>{shown+=9;renderProjects();};

// ===== 모달 =====
function openModal(id){
  const p=P.find(x=>x.id===id); if(!p)return;
  const comp=en()?p.companyEn:p.company;
  const meta=[comp,p.year,p.period,p.client].filter(Boolean).join(' · ');
  const img=p.img?`<img src="${p.img}" alt="${pName(p)}">`
                 :`<div class="modal-ico"><span class="pico">${projIcon(p)}</span></div>`;
  const stack=pStack(p).map(s=>`<span>${s}</span>`).join('');
  const hl=(p.highlights||[]).map(h=>`<p>• ${h}</p>`).join('');
  document.getElementById('modalContent').innerHTML=`
    <div class="mmeta">${meta}</div>
    <h2>${pName(p)}</h2>
    ${img}
    <div class="mrole">${p.role}</div>
    <p>${pDesc(p)}</p>
    ${hl}
    <div class="mstack">${stack}</div>`;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){document.getElementById('modal').classList.remove('open');document.body.style.overflow='';}
addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

// init
(function(){
  const saved=localStorage.getItem('lang');
  if(saved==='en'){setLang('en');} else {renderProjects();}
})();

// ===== Career Run 게임 팝업 =====
function openGame(){
  const f=document.getElementById('gameFrame');
  f.src='game/index.html?t='+Date.now();
  document.getElementById('gameModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeGame(){
  document.getElementById('gameModal').classList.remove('open');
  document.body.style.overflow='';
  document.getElementById('gameFrame').src='about:blank'; // 루프 정지
}
addEventListener('keydown',e=>{ if(e.key==='Escape'){ const gm=document.getElementById('gameModal'); if(gm&&gm.classList.contains('open')) closeGame(); }});

// ===== AI 오토플레이로 게임 실행 =====
function openGameAuto(){
  const f=document.getElementById('gameFrame');
  f.src='game/index.html?auto=1&t='+Date.now();
  document.getElementById('gameModal').classList.add('open');
  document.body.style.overflow='hidden';
}
