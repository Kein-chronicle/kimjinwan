// ② 개발 — 교육용 코딩게임(Lightbot/Blockly Maze 식). 2D 미로 버전.
// 명령 블록을 코드에 쌓고 ▶실행 → 공이 프로그램대로 미로를 굴러가 깃발(종착지)에 도착하면 클리어.
const CodeGame=(()=>{
  const HEX={w:'#EDF1F7',r:'#F2607A',b:'#38BDF8',y:'#F5B544'};
  const NAME={w:'흰',r:'빨강',b:'파랑',y:'노랑'};
  const RND=['r','b','y','w'];
  // 방향 0=N 1=E 2=S 3=W
  const DELTA=[[0,-1],[1,0],[0,1],[-1,0]];
  // 블록 서랍
  const PAL={
    fwd    :{kind:'fwd',     label:'▸ 앞으로',                 cls:'b-move'},
    left   :{kind:'left',    label:'↰ 왼쪽으로',               cls:'b-turn'},
    right  :{kind:'right',   label:'↱ 오른쪽으로',             cls:'b-turn'},
    loopFwd:{kind:'loopFwd', label:'반복 N번 { 앞으로 }',      cls:'b-loop'},
    paint  :{kind:'paint',   label:'색칠( ) · 랜덤',           cls:'b-func'},
    loopRed:{kind:'loopRed', label:'반복: 빨강까지 { 색칠 }',  cls:'b-loop'},
  };
  // 미로: '#'벽 '.'길 'S'시작 'G'골 'r/b/y'색게이트(해당 색만 통과)
  const LEVELS=[
    {label:'Lv1 · 길 따라가기', face:1,
     grid:['S......',
           '######.',
           'G......'],
     pal:['fwd','right','left','loopFwd'],
     tip:'공은 화살표 방향만 본다. 긴 복도는 [반복 N번 {앞으로}](숫자 눌러 조절) + 모퉁이에서 회전으로'},
    {label:'Lv2 · 함수·반복', face:1,
     grid:['S......',
           '######.',
           '....r..',
           '.######',
           '......G'],
     pal:['fwd','right','left','loopFwd','paint','loopRed'],
     tip:'스네이크 길을 회전+반복으로 따라가다, 빨강 게이트 앞에서 [반복: 빨강까지 {색칠}]로 빨강을 만들고 통과'},
  ];

  let cur,L,prog,ball,start,goal,root,onClear,running,failReason;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const CW=44, PAD=7;

  function startGame(container,onClearCb){ cur=0; onClear=onClearCb; root=container; level(); }
  function level(){ L=LEVELS[cur]; L.rows=L.grid.length; L.cols=L.grid[0].length;
    scan(); prog=[]; resetBall(); running=false; render(); }
  function scan(){ for(let y=0;y<L.rows;y++)for(let x=0;x<L.cols;x++){
    const ch=L.grid[y][x]; if(ch==='S')start={x,y}; if(ch==='G')goal={x,y}; } }
  function resetBall(){ ball={x:start.x,y:start.y,f:L.face,color:'w'}; }
  function cellAt(x,y){ return (y<0||x<0||y>=L.rows||x>=L.cols)?'#':L.grid[y][x]; }
  function walkable(x,y){ return cellAt(x,y)!=='#'; }
  function recolor(){ let c; do{ c=RND[(Math.random()*RND.length)|0]; }while(c===ball.color); ball.color=c; }

  // ── 렌더 ──
  function render(){
    root.innerHTML=`
      <div class="cg-head"><span class="cg-lv">${L.label}</span><span class="cg-tip">${L.tip}</span></div>
      <div class="cg-main">
        <div class="cg-world" id="cgWorld"></div>
        <div class="cg-side">
          <div class="cg-label">내 코드 <i>(위 → 아래 순서로 실행)</i></div>
          <div class="cg-prog" id="cgProg"></div>
          <div class="cg-label">블록 서랍 <i>(눌러서 추가)</i></div>
          <div class="cg-palette" id="cgPal"></div>
          <div class="cg-btns"><button class="cg-run" id="cgRun">▶ 실행</button>
            <button class="cg-reset" id="cgReset">↺ 초기화</button></div>
        </div>
      </div>
      <div class="cg-msg" id="cgMsg"></div>`;
    renderWorld(); renderProg(); renderPalette();
    root.querySelector('#cgRun').onclick=run;
    root.querySelector('#cgReset').onclick=()=>{ if(running)return; prog=[]; resetBall(); placeBall(true); faceBall(true); paintBall(); renderProg(); setMsg(''); };
  }
  function renderWorld(){
    const w=root.querySelector('#cgWorld');
    w.style.gridTemplateColumns=`repeat(${L.cols},${CW}px)`;
    w.innerHTML='';
    for(let y=0;y<L.rows;y++)for(let x=0;x<L.cols;x++){
      const ch=L.grid[y][x]; const c=document.createElement('div'); c.className='cg-cell';
      if(ch==='#')c.classList.add('wall'); else c.classList.add('path');
      if(ch==='S')c.classList.add('start');
      if(ch==='G'){c.classList.add('goal'); c.innerHTML='<span class="cg-flag">⚑</span>';}
      if('rby'.includes(ch)){ c.classList.add('gate'); c.style.setProperty('--g',HEX[ch]);
        c.innerHTML=`<span class="cg-gatetag">${NAME[ch]}만</span>`; }
      w.appendChild(c);
    }
    const b=document.createElement('div'); b.className='cg-ball'; b.id='cgBall';
    b.innerHTML='<span class="cg-face"></span>'; w.appendChild(b);
    placeBall(true); faceBall(true); paintBall();
  }
  function renderPalette(){
    const p=root.querySelector('#cgPal'); p.innerHTML='';
    L.pal.forEach(k=>{ const d=PAL[k]; const el=document.createElement('button');
      el.className='cg-block '+d.cls; el.textContent=d.label;
      el.onclick=()=>{ if(running)return; const node={...d}; if(d.kind==='loopFwd')node.n=3; prog.push(node); renderProg(); setMsg(''); }; p.appendChild(el); });
  }
  function renderProg(){
    const g=root.querySelector('#cgProg'); g.innerHTML='';
    if(!prog.length){ g.innerHTML='<div class="cg-empty">서랍에서 블록을 눌러 코드를 쌓아</div>'; return; }
    prog.forEach((n,i)=>{ const el=document.createElement('div'); el.className='cg-block '+n.cls+' placed';
      const lbl = n.kind==='loopFwd' ? `반복 <b class="cg-cnt">${n.n}</b>번 { 앞으로 }` : n.label;
      el.innerHTML=`<span class="cg-num">${i+1}</span>${lbl}<span class="cg-x">✕</span>`;
      if(n.kind==='loopFwd'){ el.classList.add('tweak'); el.title='눌러서 횟수 +';
        el.onclick=(e)=>{ if(e.target.classList.contains('cg-x')||running)return; n.n=n.n>=6?2:n.n+1; renderProg(); }; }
      el.querySelector('.cg-x').onclick=(e)=>{ e.stopPropagation(); if(running)return; prog.splice(i,1); renderProg(); };
      g.appendChild(el); });
  }
  // ── 공 위치/방향/색 ──
  function placeBall(instant){ const b=root.querySelector('#cgBall'); if(!b)return;
    b.style.transition=instant?'none':'left .28s cubic-bezier(.4,1.3,.6,1), top .28s cubic-bezier(.4,1.3,.6,1)';
    b.style.left=(PAD+ball.x*CW+(CW-26)/2)+'px'; b.style.top=(PAD+ball.y*CW+(CW-26)/2)+'px';
    if(instant)void b.offsetWidth; }
  function faceBall(instant){ const f=root.querySelector('#cgBall .cg-face'); if(!f)return;
    f.style.transition=instant?'none':'transform .2s'; f.style.transform=`rotate(${ball.f*90}deg)`; if(instant)void f.offsetWidth; }
  function paintBall(){ const b=root.querySelector('#cgBall'); if(b)b.style.background=HEX[ball.color]; }
  function flashBall(){ paintBall(); const b=root.querySelector('#cgBall'); if(!b)return; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
  function bonk(){ FX&&FX.shake(280,6); const b=root.querySelector('#cgBall'); if(b){b.classList.add('bonk'); setTimeout(()=>b.classList.remove('bonk'),320);} }
  function hi(i){ root.querySelectorAll('.cg-prog .cg-block').forEach((e,k)=>e.classList.toggle('exec',k===i)); }
  function setMsg(t,cls){ const m=root.querySelector('#cgMsg'); m.className='cg-msg '+(cls||''); m.innerHTML=t; }

  // ── 실행 ──
  async function run(){
    if(running)return; running=true; resetBall(); placeBall(true); faceBall(true); paintBall(); setMsg('실행 중…'); failReason='';
    for(let i=0;i<prog.length;i++){ hi(i);
      const ok=await exec(prog[i]); if(!ok){ hi(-1); running=false; return setMsg('✗ '+failReason,'bad'); }
      if(atGoal())break; }
    hi(-1); await wait(160);
    if(atGoal()) win(); else setMsg('✗ 깃발에 못 닿았어 — 길을 다시 따라가 봐','bad') & (running=false);
    if(!atGoal())running=false;
  }
  function atGoal(){ return ball.x===goal.x && ball.y===goal.y; }
  async function exec(n){
    if(n.kind==='left'){ ball.f=(ball.f+3)%4; faceBall(false); await wait(210); return true; }
    if(n.kind==='right'){ ball.f=(ball.f+1)%4; faceBall(false); await wait(210); return true; }
    if(n.kind==='fwd')   return await stepFwd();
    if(n.kind==='loopFwd'){ for(let k=0;k<n.n;k++){ if(!await stepFwd())return false; if(atGoal())break; } return true; }
    if(n.kind==='paint'){ recolor(); flashBall(); await wait(320); return true; }
    if(n.kind==='loopRed'){ let k=0; while(ball.color!=='r'&&k<24){ recolor(); flashBall(); await wait(230); k++; } return true; }
    return true;
  }
  async function stepFwd(){
    const [dx,dy]=DELTA[ball.f], nx=ball.x+dx, ny=ball.y+dy, ch=cellAt(nx,ny);
    if(ch==='#'){ failReason='벽이야 — 방향을 돌려서 길을 따라가'; bonk(); return false; }
    if('rby'.includes(ch) && ball.color!==ch){ failReason=`게이트는 <b>${NAME[ch]}</b>만 통과 — 색을 맞춰`; bonk(); return false; }
    ball.x=nx; ball.y=ny; placeBall(false); await wait(290); return true;
  }
  function win(){ running=false; FX&&FX.confetti(); setMsg(`✓ 도착! <b>${L.label}</b> 클리어`,'good');
    setTimeout(()=>{ cur++; if(cur<LEVELS.length)level(); else{ root.innerHTML=''; onClear&&onClear(); } },1200); }

  // ── AI 오토솔버: BFS로 길 찾아 명령 블록 자동 구성 → 실행, 레벨마다 반복 ──
  function autoSolve(){
    const key=(x,y)=>x+','+y, q=[[start.x,start.y]], prev={}, seen=new Set([key(start.x,start.y)]);
    while(q.length){ const [x,y]=q.shift(); if(x===goal.x&&y===goal.y)break;
      for(const [dx,dy] of DELTA){ const nx=x+dx,ny=y+dy; if(cellAt(nx,ny)==='#')continue; const k=key(nx,ny); if(seen.has(k))continue; seen.add(k); prev[k]=[x,y]; q.push([nx,ny]); } }
    const path=[]; let c=[goal.x,goal.y];
    while(c){ path.unshift(c); const p=prev[key(c[0],c[1])]; if(!p)break; c=p; }
    const cmds=[]; let f=L.face, gated=false;
    const dirOf=(a,b)=>{ const dx=b[0]-a[0],dy=b[1]-a[1]; if(dy<0)return 0; if(dx>0)return 1; if(dy>0)return 2; return 3; };
    for(let i=0;i<path.length-1;i++){ const t=dirOf(path[i],path[i+1]), diff=((t-f)+4)%4;
      if(diff===1)cmds.push('right'); else if(diff===3)cmds.push('left'); else if(diff===2){cmds.push('right');cmds.push('right');}
      f=t; const nc=path[i+1], ch=cellAt(nc[0],nc[1]);
      if('rby'.includes(ch)&&!gated){ cmds.push('loopRed'); gated=true; }
      cmds.push('fwd'); }
    prog=cmds.map(k=>({...PAL[k]})); renderProg();
    const myCur=cur; setTimeout(run, 650);
    const poll=setInterval(()=>{ if(!document.getElementById('cgRoot')){ clearInterval(poll); return; }
      if(cur>myCur){ clearInterval(poll); setTimeout(autoSolve, 500); } }, 300);
  }

  return { start:startGame, count:()=>LEVELS.length, auto:autoSolve };
})();
