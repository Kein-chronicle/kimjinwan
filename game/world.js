// Career Run — 탑다운 월드 엔진 (씬 기반). Kenney Tiny Town/Dungeon (CC0) + 자작 컴퓨터.
const SHEET_COLS=12, TS=16, SCALE=3;
const town=new Image(), chars=new Image(), computer=new Image(), board=new Image();
let loaded=0; const need=4;
town.src='assets/town.png'; chars.src='assets/chars.png'; computer.src='assets/computer.png'; board.src='assets/board.png';
[town,chars,computer,board].forEach(im=>im.onload=()=>{ if(++loaded===need) boot(); });

// 타일 인덱스
const TOWN={grass:0,path:25,tree:16,tree2:4,bush:5,sign:83};
const DUN ={floor:0,floorB:12,wall:14,wall2:26,desk:72,rack:75,barrel:69,chest:89};
const CH={kein:98,c0:84,c1:99,c2:87,c3:97};
// 동료 개발자(데코용) 캐릭터
const COW={a:85,b:99,c:96,d:111};
// 개발팀 클러스터 데코: 책상(bx,by)(bx+1,by) 뒤에서 2명이 작업 + 책상 위 PC
function makeTeam(bx,by,a,b){ return [
  {kind:'npc',char:a,x:bx*TS,    y:(by-1)*TS},
  {kind:'npc',char:b,x:(bx+1)*TS,y:(by-1)*TS},
  {kind:'img',img:computer,x:bx*TS+8,    y:by*TS-2},
  {kind:'img',img:computer,x:(bx+1)*TS+8,y:by*TS-2},
]; }

// ───────── 씬 정의 ─────────
const SCENES={
  sales:{
    env:town, w:20,h:11,
    G:(c)=>c==='p'?TOWN.path:TOWN.grass,
    O:{T:TOWN.tree,t:TOWN.tree2,b:TOWN.bush,s:TOWN.sign},
    ground:[
"gggggggggggggggggggg","gggggggggggggggggggg","ggggppppppppppppgggg",
"ggggpgggggggggpggggg","ggggpgggggggggpggggg","ggggppppppppppppgggg",
"ggggpggggggggppppppg","ggggpgggggggggpggggg","ggggppppppppppgggggg",
"gggggggggggggggggggg","gggggggggggggggggggg"],
    obj:[
"TTTTTTTTTTTTTTTTTTTT","T..................T","T..s............s..T",
"T..................T","T...b.....t........T","T..................T",
"T.........s.......bT","T....t.............T","T..s..............bT",
"T....b....T....t...T","TTTTTTTTTTTTTTTTTTTT"],
    spawn:{x:8*TS,y:5*TS},
    actors:()=>[
      {x:6*TS,y:3*TS,kind:'talk',char:CH.c0,done:false,data:CLIENTS[0]},
      {x:14*TS,y:3*TS,kind:'talk',char:CH.c1,done:false,data:CLIENTS[1]},
      {x:9*TS,y:7*TS,kind:'talk',char:CH.c2,done:false,data:CLIENTS[2]},
      {x:16*TS,y:6*TS,kind:'talk',char:CH.c3,done:false,data:CLIENTS[3]},
    ],
    hud:{no:'①',title:'영업',sub:'홈페이지 SI회사',objective:'동네 사장님들의 진짜 속마음을 읽고 마음을 사세요'},
  },
  dev:{
    env:chars, w:16,h:10,
    G:(c)=>DUN.floor,
    O:{W:DUN.wall, D:DUN.desk, R:DUN.rack, B:DUN.barrel, C:DUN.chest},
    ground:Array.from({length:10},()=>'f'.repeat(16)),
    obj:[
"WWWWWWWWWWWWWWWW",
"WB............BW",
"W..DD....DD..R.W",
"W..............W",
"W......DD......W",
"W..............W",
"W..DD....DD....W",
"WB.........RR..W",
"W.............CW",
"WWWWWWWWWWWWWWWW"],
    spawn:{x:7*TS+8,y:8*TS},
    // 동료 개발자들 + 그들의 PC (데코, 상호작용 없음)
    decor:[
      {kind:'npc',char:COW.a,x:3*TS,    y:1*TS}, {kind:'img',img:computer,x:3*TS+8,y:2*TS-2},
      {kind:'npc',char:COW.b,x:9*TS,    y:1*TS}, {kind:'img',img:computer,x:9*TS+8,y:2*TS-2},
      {kind:'npc',char:COW.c,x:3*TS,    y:5*TS}, {kind:'img',img:computer,x:3*TS+8,y:6*TS-2},
      {kind:'npc',char:COW.d,x:9*TS,    y:5*TS}, {kind:'img',img:computer,x:9*TS+8,y:6*TS-2},
    ],
    actors:()=>[
      {x:7*TS+8,y:4*TS-2,kind:'station',img:computer,label:'내 PC',verb:'개발 시작하기',done:false,
       act:openDevPuzzle},
    ],
    hud:{no:'②',title:'개발',sub:'로직 빌더',objective:'내 자리 PC(▼)에 다가가 개발을 시작하세요 — 누수 없이 로직 잇기'},
  },
  lead:{
    env:chars, w:18,h:11,
    G:(c)=>DUN.floor,
    O:{W:DUN.wall, D:DUN.desk, R:DUN.rack},
    ground:Array.from({length:11},()=>'f'.repeat(18)),
    obj:[
"WWWWWWWWWWWWWWWWWW",
"W................W",
"W................W",
"W.DDR........RDD.W",
"W................W",
"W................W",
"W................W",
"W.DDR........RDD.W",
"W................W",
"W................W",
"WWWWWWWWWWWWWWWWWW"],
    spawn:{x:9*TS,y:9*TS},
    // 개발팀 4팀이 각자 작업 중 (데코)
    decor:[
      ...makeTeam(2,3,85,99), ...makeTeam(14,3,84,87),
      ...makeTeam(2,7,96,111),...makeTeam(14,7,97,100),
    ],
    actors:()=>[
      {x:8*TS+8,y:2*TS,kind:'station',img:board,label:'업무 지시 보드',verb:'업무 지시하기',done:false,
       act:openLeadGame},
    ],
    hud:{no:'③',title:'개발팀장',sub:'개발 디렉터',objective:'개발본부의 업무 지시 보드(▼)로 가서 각 팀에 업무를 배치하세요'},
  },
  pm:{
    env:chars, w:16,h:11,
    G:(c)=>DUN.floor,
    O:{W:DUN.wall, D:DUN.desk},
    ground:Array.from({length:11},()=>'f'.repeat(16)),
    obj:[
"WWWWWWWWWWWWWWWW",
"W..............W",
"W..............W",
"W..............W",
"W..............W",
"W....DDDDDD....W",
"W....DDDDDD....W",
"W..............W",
"W..............W",
"W..............W",
"WWWWWWWWWWWWWWWW"],
    spawn:{x:8*TS,y:9*TS},
    // 회의 테이블 둘러앉은 이해관계자들(클라이언트+팀)
    decor:[
      {kind:'npc',char:99,x:5*TS,y:4*TS}, {kind:'npc',char:87,x:7*TS,y:4*TS}, {kind:'npc',char:97,x:9*TS,y:4*TS},
      {kind:'npc',char:96,x:5*TS,y:7*TS}, {kind:'npc',char:111,x:7*TS,y:7*TS},{kind:'npc',char:85,x:9*TS,y:7*TS},
    ],
    actors:()=>[
      {x:8*TS+8,y:2*TS,kind:'station',img:board,label:'요구사항 보드',verb:'요구사항 정리하기',done:false,
       act:openPmGame},
    ],
    hud:{no:'④',title:'PM',sub:'요구→보고서',objective:'회의실의 요구사항 보드(▼)로 가서 두서없는 요구를 정리하고 보고서로 포장하세요'},
  }
};

// ───────── 상태 ─────────
const cv=document.getElementById('world'), ctx=cv.getContext('2d');
const $stage=document.getElementById('stage'), $prompt=document.getElementById('prompt'), $hud=document.getElementById('hud');
let state='boot', scene, player, actors, hearts, cfg;
const keys={}, touch={l:0,r:0,u:0,d:0};
// AI 오토플레이
let auto=false, autoT=0, autoBusy=false, curDlg=null;

// ───────── 입력 ─────────
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(e.key===' '||e.key==='Enter'){e.preventDefault();action();}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function dir(){let dx=0,dy=0;
  if(keys['arrowleft']||keys['a']||touch.l)dx--; if(keys['arrowright']||keys['d']||touch.r)dx++;
  if(keys['arrowup']||keys['w']||touch.u)dy--; if(keys['arrowdown']||keys['s']||touch.d)dy++; return{dx,dy};}
function buildDpad(){const d=document.getElementById('dpad');
  d.innerHTML=`<div class="pad">
      <button data-k="u" class="pu">▲</button>
      <button data-k="l" class="pl">◀</button>
      <button data-k="r" class="pr">▶</button>
      <button data-k="d" class="pd">▼</button>
    </div>
    <button class="act-big" data-k="act">선택</button>`;
  d.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;
    const on=e=>{e.preventDefault(); k==='act'?action():touch[k]=1;}; const off=e=>{e.preventDefault(); if(k!=='act')touch[k]=0;};
    b.addEventListener('touchstart',on);b.addEventListener('touchend',off);b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off);});}

// ───────── 그리기 ─────────
function resize(){cv.width=scene.w*TS*SCALE; cv.height=scene.h*TS*SCALE;}
function tile(sheet,idx,dx,dy){const sx=(idx%SHEET_COLS)*TS, sy=((idx/SHEET_COLS)|0)*TS;
  ctx.drawImage(sheet,sx,sy,TS,TS,dx,dy,TS*SCALE,TS*SCALE);}
function shadow(wx,wy){ctx.globalAlpha=.25;ctx.fillStyle='#000';ctx.beginPath();
  ctx.ellipse(wx*SCALE+TS*SCALE/2,(wy*SCALE)+TS*SCALE-3,TS*SCALE*0.3,4,0,0,7);ctx.fill();ctx.globalAlpha=1;}
function spriteSheet(idx,wx,wy,flip,bob){const dx=wx*SCALE,dy=(wy+(bob||0))*SCALE; shadow(wx,wy);
  ctx.save(); if(flip){ctx.translate(dx+TS*SCALE,dy);ctx.scale(-1,1);ctx.translate(-dx,-dy);}
  const sx=(idx%SHEET_COLS)*TS,sy=((idx/SHEET_COLS)|0)*TS; ctx.drawImage(chars,sx,sy,TS,TS,dx,dy,TS*SCALE,TS*SCALE); ctx.restore();}
function spriteImg(img,wx,wy,bob){const dx=wx*SCALE,dy=(wy+(bob||0))*SCALE; shadow(wx,wy);
  ctx.drawImage(img,dx,dy,TS*SCALE,TS*SCALE);}
function draw(){
  ctx.imageSmoothingEnabled=false;
  for(let y=0;y<scene.h;y++)for(let x=0;x<scene.w;x++) tile(scene.env, scene.G(scene.ground[y][x]), x*TS*SCALE,y*TS*SCALE);
  const list=[];
  for(let y=0;y<scene.h;y++)for(let x=0;x<scene.w;x++){const o=scene.obj[y][x]; if(o==='.')continue;
    const idx=scene.O[o]; if(idx!==undefined) list.push({y:y*TS,kind:'tile',idx,x:x*TS});}
  if(scene.decor) scene.decor.forEach(d=>list.push({y:d.y,kind:'decor',d}));
  actors.forEach(a=>list.push({y:a.y,kind:'actor',a}));
  list.push({y:player.y,kind:'pl'});
  list.sort((a,b)=>a.y-b.y);
  for(const it of list){
    if(it.kind==='tile') tile(scene.env,it.idx,it.x*SCALE,it.y*SCALE);
    else if(it.kind==='decor'){const d=it.d;
      if(d.kind==='img') spriteImg(d.img,d.x,d.y,Math.sin(Date.now()/420+d.x)*1);
      else spriteSheet(d.char,d.x,d.y,d.x>scene.w*TS/2,Math.sin(Date.now()/260+d.x)*1.4);
    }
    else if(it.kind==='actor'){const a=it.a;
      if(a.kind==='station'){ spriteImg(a.img,a.x,a.y,Math.sin(Date.now()/400)*1); }
      else spriteSheet(a.char,a.x,a.y,false,a.done?0:Math.sin(Date.now()/300+a.x)*1.2);
      label(a);
    } else spriteSheet(CH.kein,player.x,player.y,player.flip,player.bob);
  }
}
function label(a){
  const cx=(a.x+8)*SCALE, top=(a.y-8)*SCALE; ctx.textAlign='center';
  const name=a.kind==='talk'?a.data.name:a.label;
  ctx.font=`${5*SCALE}px Galmuri11, monospace`;
  const w=ctx.measureText(name).width+8; ctx.fillStyle='rgba(8,12,20,.82)'; ctx.fillRect(cx-w/2,top-13,w,16);
  ctx.fillStyle=a.done?'#7f8aa0':'#EDF1F7'; ctx.fillText(name,cx,top);
  if(a.done){ctx.fillStyle='#F2607A';ctx.font=`${7*SCALE}px serif`;ctx.fillText('❤',cx,top-18);}
  else{const b=Math.sin(Date.now()/180)*4; ctx.fillStyle='#F5B544';
    ctx.font=`bold ${9*SCALE}px Galmuri11, monospace`; ctx.fillText(a.kind==='station'?'▼':'!',cx,top-20+b);}
  ctx.textAlign='left';
}

// ───────── 루프/상호작용 ─────────
function near(){return actors.find(a=>!a.done && Math.hypot(a.x-player.x,a.y-player.y)<24);}
function blocked(tx,ty){if(tx<0||ty<0||tx>=scene.w||ty>=scene.h)return true; const o=scene.obj[ty][tx]; return 'TtfsbWDRBC'.includes(o);}
function loop(){
  if(auto) autoTick();
  const dp=document.getElementById('dpad'); if(dp) dp.classList.toggle('show', state==='world' && !auto);
  if(state==='world'){
    let dx=0,dy=0;
    if(auto){ const t=actors.find(a=>!a.done);
      if(t){ const tx=t.x, ty=t.y+(t.kind==='station'?14:12);
        const ddx=tx-player.x, ddy=ty-player.y, d=Math.hypot(ddx,ddy)||1;
        if(d>8){ dx=ddx/d; dy=ddy/d; }
        else if(Date.now()>autoT){ action(); autoT=Date.now()+700; } } }
    else { const dd=dir(); dx=dd.dx; dy=dd.dy; }
    const sp=auto?1.7:1.5;
    if(dx||dy){
      if(auto){ player.x+=dx*sp; player.y+=dy*sp; }
      else { const ft=(px,py)=>blocked(((px+8)/TS)|0,((py+14)/TS)|0);
        const nx=player.x+dx*sp, ny=player.y+dy*sp;
        if(!ft(nx,player.y))player.x=nx; if(!ft(player.x,ny))player.y=ny; }
      if(dx)player.flip=dx<0; player.walk+=0.25; player.bob=Math.abs(Math.sin(player.walk))*-2;}
    else player.bob=0;
    player.x=Math.max(8,Math.min(scene.w*TS-24,player.x)); player.y=Math.max(8,Math.min(scene.h*TS-18,player.y));
    draw();
    const n=near(); $prompt.style.display=(!auto&&n)?'block':'none';
    if(!auto&&n)$prompt.textContent=n.kind==='station'?`▲ ${n.label} — SPACE로 ${n.verb||'시작'}`:`▲ ${n.data.name} — SPACE로 말 걸기`;
  } else if(scene&&state!=='boot'){ /* keep last frame */ }
  requestAnimationFrame(loop);
}
// ── AI 오토파일럿: 화면 상태를 보고 다음 행동을 수행 ──
function autoTick(){
  const cg=document.getElementById('cgRoot'), ty=document.getElementById('tyRoot'), pm=document.getElementById('pmRoot');
  if(cg||ty||pm){ if(!autoBusy){ autoBusy=true; (cg?CodeGame:ty?DirectorGame:PMGame).auto(); } return; }
  autoBusy=false;
  if(Date.now()<autoT) return;
  if(state==='dialogue'){ autoDialogue(); return; }
  if(state==='over'||state==='cut'){ const b=$stage.querySelector('.btn'); if(b){ b.click(); autoT=Date.now()+850; } return; }
}
function autoDialogue(){
  const opts=$stage.querySelectorAll('.opt');
  if(opts.length){ if(curDlg){ const ok=curDlg.options.findIndex(o=>o.ok); const b=$stage.querySelector(`.opt[data-i="${ok}"]`); if(b&&!b.disabled){ b.click(); autoT=Date.now()+1700; } } return; }
  if(window._adv){ window._adv(); autoT=Date.now()+420; }
}
function action(){ if(state==='world'){const n=near(); if(n){ if(n.kind==='talk')openDialogue(n); else n.act(n); }}}

// ───────── HUD ─────────
function pips(){return Array.from({length:actors.filter(a=>a.kind!=='station').length||1},(_,k)=>`<span class="pip ${k<hearts?'full':''}">❤</span>`).join('');}
function renderHUD(){ if(!cfg){$hud.style.display='none';return;} $hud.style.display='block';
  const total=actors.length, done=actors.filter(a=>a.done).length, left=total-done;
  $hud.innerHTML=`<div class="hrow"><span class="chip">${cfg.no} ${cfg.title}<i> · ${cfg.sub}</i></span>
    <span class="obj">🎯 ${cfg.objective}</span></div>
    <div class="hrow prog"><span class="left">${left>0?`남은 목표 <b>${left}</b>`:'<b>완료!</b>'}</span></div>`;}

// ───────── 씬 로드 ─────────
function loadScene(key){ scene=SCENES[key]; cfg=scene.hud; resize();
  player={x:scene.spawn.x,y:scene.spawn.y,flip:false,walk:0,bob:0};
  actors=scene.actors(); hearts=0; state='world'; renderHUD(); }

// ───────── 대화(마음 읽기) ─────────
const el=(h)=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function type(node,text,cps=46){return new Promise(res=>{node.innerHTML='';let i=0;const cur=el('<span class="cursor"></span>');const sp=document.createElement('span');node.append(sp,cur);const iv=setInterval(()=>{sp.textContent=text.slice(0,++i);if(i>=text.length){clearInterval(iv);cur.remove();res();}},1000/cps);});}
function openDialogue(a){
  state='dialogue'; $prompt.style.display='none'; $hud.style.display='none'; const c=a.data; curDlg=c;
  const box=el(`<div class="dlg"><div class="char bob" id="cf">${c.face}</div><div class="cname">${c.name}</div>
    <div class="bubble" id="bub"></div><div class="tap" id="tap">▸ 대화 듣기 (클릭/SPACE)</div><div id="qz"></div></div>`);
  $stage.className='in'; $stage.innerHTML=''; $stage.appendChild(box); $stage.style.pointerEvents='auto';
  const bub=box.querySelector('#bub'),tap=box.querySelector('#tap'),qz=box.querySelector('#qz'),cf=box.querySelector('#cf');
  let beat=-1,busy=false;
  async function nx(){ if(busy||state!=='dialogue')return; busy=true; beat++;
    if(beat<=c.dialog.length){const line=beat===0?c.surface:c.dialog[beat-1]; const isClue=beat>0&&c.clue.includes(beat-1);
      bub.className='bubble'+(isClue?' clue':''); const tx=el(`<span class="${isClue?'tx':''}"></span>`); bub.innerHTML=''; bub.appendChild(tx);
      if(isClue)FX.shake(200,3); await type(tx,'"'+line+'"');
      if(beat>=c.dialog.length){tap.style.display='none';box.onclick=null;ask();}
      else tap.textContent=beat===c.dialog.length-1?'▸ 무엇을 건넬지 정하기':'▸ 더 듣기';} busy=false;}
  box.onclick=nx; window._adv=nx; nx();
  function ask(){ qz.innerHTML=`<div class="qline">무엇을 건넬까?</div><div class="opts">${c.options.map((o,i)=>`<button class="opt" data-i="${i}">${o.t}</button>`).join('')}</div><div class="verdict" id="vd"></div>`;
    qz.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const o=c.options[+b.dataset.i]; qz.querySelectorAll('.opt').forEach(x=>x.disabled=true); const vd=qz.querySelector('#vd');
      if(o.ok){b.classList.add('ok');cf.className='char hop';FX.hearts(cf,9);vd.className='verdict win';vd.innerHTML=`❤ 마음을 샀다!<div class="truth">${c.truth}</div>`;}
      else{b.classList.add('no');cf.className='char no';FX.shake(350,8);qz.querySelector(`.opt[data-i="${c.options.findIndex(x=>x.ok)}"]`).classList.add('ok');vd.className='verdict lose';vd.innerHTML=`… 어색한 침묵.<div class="truth">${c.truth}</div>`;}
      setTimeout(()=>finishTalk(a,o.ok),1500);});}
}
function finishTalk(a,win){ if(win&&!a.done){a.done=true;hearts++;}
  $stage.className='';$stage.innerHTML='';$stage.style.pointerEvents='none';window._adv=null;
  sceneCleared() || (state='world', renderHUD()); }
addEventListener('keydown',e=>{if(state==='dialogue'&&(e.key===' '||e.key==='Enter')&&window._adv){e.preventDefault();window._adv();}});

// ───────── ② 개발 PC → 로직 퍼즐 ─────────
function openDevPuzzle(station){
  state='over'; $prompt.style.display='none'; $hud.style.display='none'; cv.style.opacity=.25;
  const wrap=el(`<div class="cg-wrap"><div class="cg-stagebar"><span class="chip">② 개발 · 코딩 퍼즐</span></div><div id="cgRoot"></div></div>`);
  $stage.className='in full'; $stage.innerHTML=''; $stage.appendChild(wrap); $stage.style.pointerEvents='auto';
  CodeGame.start(wrap.querySelector('#cgRoot'), ()=>{
    station.done=true; $stage.className=''; $stage.innerHTML=''; $stage.style.pointerEvents='none'; cv.style.opacity=1;
    sceneCleared() || (state='world', renderHUD());
  });
}

// ───────── ③ 업무 지시 보드 → 배치 타이쿤 ─────────
function openLeadGame(station){
  state='over'; $prompt.style.display='none'; $hud.style.display='none'; cv.style.opacity=.25;
  const wrap=el(`<div class="ty-stage"><div class="ty-stagebar"><span class="chip">③ 개발 디렉터 · 배치 타이쿤</span></div><div id="tyRoot"></div></div>`);
  $stage.className='in full'; $stage.innerHTML=''; $stage.appendChild(wrap); $stage.style.pointerEvents='auto';
  DirectorGame.start(wrap.querySelector('#tyRoot'), ()=>{
    station.done=true; $stage.className=''; $stage.innerHTML=''; $stage.style.pointerEvents='none'; cv.style.opacity=1;
    sceneCleared() || (state='world', renderHUD());
  });
}

// ───────── ④ 요구사항 보드 → PM 정리·포장 게임 ─────────
function openPmGame(station){
  state='over'; $prompt.style.display='none'; $hud.style.display='none'; cv.style.opacity=.25;
  const wrap=el(`<div class="pm-stage"><div class="pm-stagebar"><span class="chip">④ PM · 요구사항 정리 → 보고서 포장</span></div><div id="pmRoot"></div></div>`);
  $stage.className='in full'; $stage.innerHTML=''; $stage.appendChild(wrap); $stage.style.pointerEvents='auto';
  PMGame.start(wrap.querySelector('#pmRoot'), ()=>{
    station.done=true; $stage.className=''; $stage.innerHTML=''; $stage.style.pointerEvents='none'; cv.style.opacity=1;
    sceneCleared() || (state='world', renderHUD());
  });
}

// ───────── 씬 클리어 판정 → 변신 ─────────
const SEQ=['sales','dev','lead','pm'];
let seqIdx=0;
function sceneCleared(){
  if(!actors.every(a=>a.done)) return false;
  state='cut'; FX.confetti();
  const msgs={sales:'거래 성사! 50여 프로젝트를 수주하며 영업을 익혔다.<br>이 ‘진짜 니즈 읽기’가 훗날 PM의 무기가 된다.',
              dev:'누수 없이 로직을 완성했다.<br>혼자 풀스택으로 쌓아올리는 개발자가 되었다.',
              lead:'각 팀에 일을 적재적소로 배치했다.<br>혼자 짜던 손을, 팀을 움직이는 머리로 바꿔냈다.',
              pm:'두서없던 요구를 정의서로, 다시 보고서로 묶어냈다.<br>사람과 사람 사이를 잇는 PM 그 자체가 되었다.'};
  const s=el(`<div class="center"><div class="big">단계 클리어!</div><div class="sub">${msgs[SEQ[seqIdx]]||''}</div><button class="btn" id="n">다음 →</button></div>`);
  overlay(s); s.querySelector('#n').onclick=()=>transform(seqIdx);
  return true;
}
async function transform(i){
  const faces=['🧒','🧑‍💻','🧑‍🏫','🧑‍✈️','🚀'];
  const s=el(`<div class="center"><div class="char" id="tc" style="font-size:60px">${faces[i]}</div><div class="big" id="tt">…</div></div>`);
  overlay(s); await wait(350); const tc=s.querySelector('#tc'),tt=s.querySelector('#tt');
  FX.sparkle(tc); await wait(250); FX.flash(); FX.shake(300,6); FX.burst(tc);
  tc.textContent=faces[i+1]||'🚀'; tt.innerHTML='<span class="grad">뾰로롱!</span>'; await wait(300); FX.sparkle(tc);
  const t=STAGES[i+1]?STAGES[i+1].title:''; tt.innerHTML=t?`<span class="grad">${t}</span>(으)로 성장!`:'';
  await wait(1000); seqIdx=i+1; STARTERS[i+1]?STARTERS[i+1]():ending();
}

// ───────── 스테이지 진입 ─────────
function startSales(){ seqIdx=0; cfg=null; $hud.style.display='none';
  introCard('STAGE ① / 4','당신은 홈페이지 SI회사의 <span class="grad">영업사원</span>이 되었습니다.',
    '🎯 동네 사장님들의 진짜 속마음을 읽고 마음을 사세요','사장님(!)에게 다가가 SPACE로 대화 → 단서를 읽고 알맞은 걸 건네세요.',
    '출근', ()=>loadScene('sales')); }
function startDev(){ seqIdx=1; cfg=null; $hud.style.display='none';
  introCard('STAGE ② / 4','당신은 직접 만들어 팔기 위해 <span class="grad">개발자</span>가 되었습니다.',
    '🎯 작업실의 PC로 가서 개발을 시작하세요','PC(▼)에 다가가 SPACE → 통로를 회전해 START→END 누수 없이 잇기 (3 레벨).',
    '작업실로', ()=>loadScene('dev')); }
function startLead(){ seqIdx=2; cfg=null; $hud.style.display='none';
  introCard('STAGE ③ / 4','당신은 직접 만들던 손을 떼고 <span class="grad">개발팀장</span>이 되었습니다.',
    '🎯 개발본부의 각 팀에 업무를 적재적소로 배치하세요','업무 지시 보드(▼)에 다가가 SPACE → 배치 타이쿤 시작 (제작 중).',
    '개발본부로', ()=>loadScene('lead')); }
function startPm(){ seqIdx=3; cfg=null; $hud.style.display='none';
  introCard('STAGE ④ / 4','이제 당신은 사람과 사람 사이를 잇는 <span class="grad">PM</span>이 되었습니다.',
    '🎯 두서없는 요구를 정의서로 정리하고, 보고서로 포장하세요','회의실의 요구사항 보드(▼)에 다가가 SPACE → 정리·포장 2단계.',
    '회의실로', ()=>loadScene('pm')); }
const STARTERS=[startSales,startDev,startLead,startPm];

function introCard(tag,title,obj,help,btn,go){
  const s=el(`<div class="center"><div class="tag">${tag}</div><div class="big">${title}</div>
    <div class="objbox">${obj}<br><span class="help">${help}</span></div><button class="btn" id="go">▶ ${btn}</button></div>`);
  overlay(s); s.querySelector('#go').onclick=()=>{clearOverlay();go();}; }
function stub(no,title,desc,nextIdx){ cfg=null; $hud.style.display='none';
  const s=el(`<div class="center"><div class="tag">STAGE ${no} / 4</div><div class="big">${title}</div>
    <div class="objbox">🛠 이 미니게임은 제작 중입니다.<br><span class="help">${desc}</span></div><button class="btn" id="go">다음 →</button></div>`);
  overlay(s); s.querySelector('#go').onclick=()=>transform(nextIdx); }
function ending(){
  if(auto){ auto=false;
    const s=el(`<div class="center">
      <img class="char bob facepic" src="assets/face.png" alt="">
      <div class="big" style="margin-top:12px">AI가 <span class="grad">김진완의 인생</span>을 완주했습니다</div>
      <div class="sub" style="margin-top:14px">이 게임은 <b>AI</b>로 만들었으나,<br>스토리 구상 · 게임 설계는 <span class="grad">김진완</span>이 했습니다.</div>
      <button class="btn" id="c">처음으로</button></div>`);
    overlay(s); FX.confetti(); FX.flash(); s.querySelector('#c').onclick=lobby; return; }
  const s=el(`<div class="center"><div class="big">다음을 채우는 중입니다<span class="grad">…</span></div>
  <div class="sub">①영업 · ②개발 · ③개발팀장 · ④PM — 11년을 한 층씩 올라왔다.<br>지금은 AI로 직접 만드는 PM. 다음 층은 — 당신의 팀.</div>
  <button class="btn" id="c">처음으로</button></div>`); overlay(s); FX.confetti(); s.querySelector('#c').onclick=lobby; }

// ───────── 오버레이/로비 ─────────
function overlay(node){state='over'; cv.style.opacity=.25; $prompt.style.display='none'; $hud.style.display='none';
  $stage.className='in full'; $stage.innerHTML=''; $stage.appendChild(node); $stage.style.pointerEvents='auto';}
function clearOverlay(){cv.style.opacity=1; $stage.className=''; $stage.innerHTML=''; $stage.style.pointerEvents='none';}
function lobby(){ clearOverlay(); cfg=null; seqIdx=0; auto=false; $hud.style.display='none'; scene=SCENES.sales; resize();
  const s=el(`<div class="center"><div class="tag">Kim Jinwan · Career Run</div>
    <img class="char bob facepic" src="assets/face.png" alt=""><div class="big">김진완 <span class="grad">인생게임</span></div>
    <div class="sub">방향키/WASD로 걷고, 대상(!,▼)에 다가가 SPACE로 상호작용하세요.</div>
    <button class="btn" id="go">▶ 사회생활 시작하기</button></div>`);
  overlay(s); s.querySelector('#go').onclick=()=>startSales(); }

function boot(){ scene=SCENES.sales; resize(); buildDpad(); lobby();
  if(/[?&]auto=1/.test(location.search)) auto=true;   // AI 오토플레이 진입 (lobby가 auto를 끄므로 그 뒤에 켠다)
  requestAnimationFrame(loop); }
