// ② 로직 빌더 — 누수 없이 START→END 통로 연결(회전 퍼즐). 3 레벨.
// 통로 조각을 회전시켜 끊김 없는 경로를 만들면 데이터(사람)가 도착 → 클리어.
const LogicGame = (()=>{
  // 방향 비트: N=1 E=2 S=4 W=8
  const N=1,E=2,S=4,W=8;
  const DIRV={[N]:[0,-1],[E]:[1,0],[S]:[0,1],[W]:[-1,0]}, OPP={[N]:S,[E]:W,[S]:N,[W]:E};
  // 타입별 기본 개구부(rot0)
  const TYPES={ I:N|S, L:N|E, T:N|E|S, X:N|E|S|W, ENDP:N };
  function rot(open,r){ r=((r%4)+4)%4; let o=open; for(let i=0;i<r;i++){ let n=0; if(o&N)n|=E; if(o&E)n|=S; if(o&S)n|=W; if(o&W)n|=N; o=n; } return o; }
  function findRot(type,want){ for(let r=0;r<4;r++) if(rot(TYPES[type],r)===want) return r; return 0; }

  // 레벨: 솔루션 경로로부터 조각 생성 → 회전 스크램블
  // path = [[x,y]...] START→END 인접 셀. 외부 START/END 방향은 자동.
  const LEVELS=[
    { cols:5, rows:3, label:'Lv1 · 순차', path:[[0,1],[1,1],[2,1],[3,1],[4,1]] },
    { cols:5, rows:4, label:'Lv2 · 분기', path:[[0,1],[1,1],[1,2],[2,2],[3,2],[3,1],[4,1]] },
    { cols:6, rows:4, label:'Lv3 · 반복·함수', path:[[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[4,1],[5,1]] },
  ];

  function buildCells(L){
    const cells={}; const key=(x,y)=>x+','+y;
    const p=L.path;
    for(let i=0;i<p.length;i++){
      const [x,y]=p[i]; let open=0;
      if(i>0){ const [px,py]=p[i-1]; open|=dirTo(x,y,px,py); }
      if(i<p.length-1){ const [nx,ny]=p[i+1]; open|=dirTo(x,y,nx,ny); }
      // 끝 셀은 한쪽만 → 화면 밖 START/END 표시
      let type='I', startEnd=null;
      if(i===0){ startEnd='start'; open|= outward(x,y,L); }
      if(i===p.length-1){ startEnd='end'; open|= outward(x,y,L); }
      // 타입 판정 + 정답 회전(솔루션)
      type = classify(open);
      const solRot = findRot(type, open);
      cells[key(x,y)]={x,y,type,startEnd,rot:solRot};
    }
    return cells;
  }
  function dirTo(x,y,tx,ty){ if(tx>x)return E; if(tx<x)return W; if(ty>y)return S; return N; }
  function outward(x,y,L){ // 그리드 밖으로 향하는 개구부(START/END 진입로)
    if(x===0)return W; if(x===L.cols-1)return E; if(y===0)return N; return S; }
  function classify(open){ const n=(open&N?1:0)+(open&E?1:0)+(open&S?1:0)+(open&W?1:0);
    if(n>=4)return 'X'; if(n===3)return 'T';
    if((open===(N|S))||(open===(E|W)))return 'I'; return 'L'; }

  // SVG 조각
  function pieceSVG(open){
    const c=24, t=8, seg=[];
    const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5AD0FF" stroke-width="${t}" stroke-linecap="round"/>`;
    if(open&N)seg.push(line(c,c,c,0)); if(open&S)seg.push(line(c,c,c,48));
    if(open&E)seg.push(line(c,c,48,c)); if(open&W)seg.push(line(c,c,0,c));
    seg.push(`<circle cx="${c}" cy="${c}" r="6" fill="#7C5CFF"/>`);
    return `<svg viewBox="0 0 48 48">${seg.join('')}</svg>`;
  }

  let cur, cells, root, onClear, solvedFlag;
  function start(container, onClearCb){
    cur=0; onClear=onClearCb; root=container; level();
  }
  function level(){
    const L=LEVELS[cur]; cells=buildCells(L); solvedFlag=false;
    // 회전 스크램블(정답에서 1~3칸 어긋나게). 끝점(START/END)은 고정.
    Object.values(cells).forEach(c=>{ if(c.startEnd)return; c.rot=(c.rot+1+Math.floor(Math.random()*3))%4; });
    render(L);
  }
  function render(L){
    root.innerHTML=`<div class="lg-head"><span class="lg-lv">${L.label}</span>
      <span class="lg-tip">통로를 눌러 회전 · START→END 누수 없이 잇기</span></div>
      <div class="lg-grid" id="lgGrid"></div>`;
    const g=root.querySelector('#lgGrid');
    g.style.gridTemplateColumns=`repeat(${L.cols},48px)`;
    for(let y=0;y<L.rows;y++)for(let x=0;x<L.cols;x++){
      const c=cells[x+','+y];
      const cell=document.createElement('div'); cell.className='lg-cell';
      if(c){ cell.classList.add('has'); if(c.startEnd)cell.classList.add(c.startEnd);
        cell.innerHTML=pieceSVG(TYPES[c.type]);
        const svg=cell.firstElementChild; svg.style.transform=`rotate(${c.rot*90}deg)`;
        if(!c.startEnd) cell.onclick=()=>{ c.rot=(c.rot+1)%4; svg.style.transform=`rotate(${c.rot*90}deg)`;
          FX&&FX.shake(80,2); check(L,g); };
        if(c.startEnd){ const lbl=document.createElement('span'); lbl.className='lg-tag';
          lbl.textContent=c.startEnd==='start'?'START':'END'; cell.appendChild(lbl); }
      }
      g.appendChild(cell);
    }
    // 데이터 토큰
    const tok=document.createElement('div'); tok.className='lg-token'; tok.id='lgTok'; tok.textContent='🧑'; tok.style.display='none';
    g.appendChild(tok);
  }
  function curOpen(c){ return rot(TYPES[c.type], c.rot); }
  function connected(L){
    const start=Object.values(cells).find(c=>c.startEnd==='start');
    const end=Object.values(cells).find(c=>c.startEnd==='end');
    const seen=new Set(); const stack=[start]; const path=[start];
    while(stack.length){ const c=stack.pop(); const k=c.x+','+c.y; if(seen.has(k))continue; seen.add(k);
      for(const d of [N,E,S,W]){ if(!(curOpen(c)&d))continue; const [dx,dy]=DIRV[d];
        const nb=cells[(c.x+dx)+','+(c.y+dy)]; if(!nb)continue; if(curOpen(nb)&OPP[d]){ if(!seen.has(nb.x+','+nb.y)){stack.push(nb);} } } }
    return seen.has(end.x+','+end.y);
  }
  function orderedPath(L){ // START→END BFS 경로(토큰 이동용)
    const start=Object.values(cells).find(c=>c.startEnd==='start');
    const end=Object.values(cells).find(c=>c.startEnd==='end');
    const prev={}, q=[start], seen=new Set([start.x+','+start.y]);
    while(q.length){ const c=q.shift(); if(c===end)break;
      for(const d of [N,E,S,W]){ if(!(curOpen(c)&d))continue; const [dx,dy]=DIRV[d];
        const nb=cells[(c.x+dx)+','+(c.y+dy)]; if(!nb||!(curOpen(nb)&OPP[d]))continue;
        const k=nb.x+','+nb.y; if(!seen.has(k)){seen.add(k);prev[k]=c;q.push(nb);} } }
    const out=[]; let c=end; while(c){ out.unshift(c); c=prev[c.x+','+c.y]; if(c===start){out.unshift(start);break;} } return out;
  }
  function check(L,g){
    if(solvedFlag)return;
    if(connected(L)){ solvedFlag=true; runToken(L,g); }
  }
  function runToken(L,g){
    const path=orderedPath(L); const tok=g.querySelector('#lgTok'); tok.style.display='flex';
    g.querySelectorAll('.lg-cell.has').forEach(c=>c.classList.add('lit'));
    let i=0;
    const step=()=>{ if(i>=path.length){ done(L); return; } const c=path[i++];
      tok.style.left=(c.x*48+12)+'px'; tok.style.top=(c.y*48+10)+'px'; setTimeout(step,160); };
    step();
  }
  function done(L){
    FX&&FX.confetti();
    root.querySelector('.lg-grid').insertAdjacentHTML('afterend',
      `<div class="lg-clear">✓ 누수 없이 연결! <b>${L.label}</b> 클리어</div>`);
    setTimeout(()=>{ cur++; if(cur<LEVELS.length) level(); else { root.innerHTML=''; onClear&&onClear(); } }, 1100);
  }
  return { start, count:()=>LEVELS.length, cur:()=>cur };
})();
