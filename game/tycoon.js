// ③ 개발 디렉터 — 적재적소 배치 타이쿤 (개발 에디터 콘솔 테마).
// 빈 모듈(코드파일 티켓)에 분야×난이도 맞는 개발자를 배치 → 코드가 빌드되어 출시.
// 마감 타이머 안에 목표 수만큼 출시하면 클리어. 완료되면 재배치하며 완급 조절.
const DirectorGame=(()=>{
  const FIELDS={
    FE:{label:'프론트',color:'#38BDF8'},
    BE:{label:'백엔드',color:'#7C5CFF'},
    DS:{label:'디자인',color:'#F5B544'},
    QA:{label:'테스트',color:'#4ADE80'},
  };
  const NAMES={
    FE:['login.ui','cart.view','home.page','feed.tsx','nav.css'],
    BE:['auth.api','pay.server','db.query','cache.go','queue.rb'],
    DS:['icon.set','theme.fig','banner.psd','flow.sk','logo.ai'],
    QA:['login.test','pay.spec','e2e.run','smoke.qa','load.jmx'],
  };
  const CODE=['export function build(t){','  const spec = load(t);','  const out = render(spec);','  assert(out.ok);','  return ship(out);','}'];
  const DEVS=[
    {id:1,name:'진우',field:'FE',lv:2},
    {id:2,name:'민지',field:'BE',lv:3},
    {id:3,name:'현',  field:'DS',lv:2},
    {id:4,name:'수아',field:'QA',lv:2},
    {id:5,name:'테오',field:'FE',lv:1},
    {id:6,name:'가람',field:'BE',lv:2},
  ];
  const TARGET=6, TIME=80, SLOTS=3, BASE=26;
  const rand=n=>(Math.random()*n)|0;

  let modules,pool,shipped,timeLeft,sel,root,onClear,timer,mid,over;

  function start(container,onClearCb){
    root=container; onClear=onClearCb; mid=1; shipped=0; timeLeft=TIME; sel=null; over=false;
    pool=DEVS.map(d=>({...d,busy:false}));
    modules=[]; for(let i=0;i<SLOTS;i++) modules.push(spawn());
    render();
    clearInterval(timer); timer=setInterval(tick,100);
  }
  function spawn(){ const fk=Object.keys(FIELDS)[rand(4)]; const diff=1+rand(3);
    return {id:mid++,field:fk,diff,name:NAMES[fk][rand(NAMES[fk].length)],need:60+diff*48,work:0,dev:null}; }

  // 배치된 개발자 → 빌드 속도
  function eff(m){ if(!m.dev)return null; const match=m.dev.field===m.field; const lvOk=m.dev.lv>=m.diff;
    const mult=(match?1:0.35)*(lvOk?1:0.5);
    return {mult, match, lvOk, tag: !match?'↓ 분야 안맞음':(!lvOk?'★ 난이도 부족':'⚡ 적합')}; }
  function speed(m){ const e=eff(m); return e?BASE*e.mult:0; }

  // ── 루프 ──
  function tick(){
    if(over)return;
    timeLeft-=0.1;
    let changed=false;
    modules.forEach(m=>{ if(m.dev){ m.work+=speed(m)*0.1; if(m.work>=m.need){ complete(m); changed=true; } } });
    if(!changed) update();
    if(shipped>=TARGET) return end(true);
    if(timeLeft<=0) return end(false);
  }
  function complete(m){ shipped++; if(m.dev){ m.dev.busy=false; pool.push(m.dev); }
    const i=modules.indexOf(m); modules[i]=spawn(); FX&&FX.confetti(); render(); }

  function assign(dev,m){ if(m.dev||dev.busy)return; dev.busy=true; m.dev=dev; pool=pool.filter(d=>d!==dev); sel=null; render(); }
  function unassign(m){ if(!m.dev)return; m.dev.busy=false; pool.push(m.dev); m.dev=null; render(); }

  // ── 렌더 ──
  function render(){
    root.innerHTML=`
      <div class="ty-ide">
        <div class="ty-bar">
          <span class="ty-dot r"></span><span class="ty-dot y"></span><span class="ty-dot g"></span>
          <span class="ty-path">career-run — 디렉터 콘솔</span>
          <span class="ty-stat">출시 <b id="tyShip">${shipped}</b>/${TARGET}</span>
          <span class="ty-stat">마감 <b id="tyTime">${Math.ceil(timeLeft)}s</b></span>
          <span class="ty-tbar"><i id="tyTimeBar" style="width:${timeLeft/TIME*100}%"></i></span>
        </div>
        <div class="ty-hint">대기 개발자를 골라 → 모듈에 배치. 분야가 맞으면 빌드가 빠르다. 완료되면 빠진 인원을 다시 배치해 마감 전 ${TARGET}개 출시!</div>
        <div class="ty-board" id="tyBoard"></div>
        <div class="ty-dock">
          <div class="ty-dock-t">대기 개발자 <i>(눌러 선택)</i></div>
          <div class="ty-pool" id="tyPool"></div>
        </div>
      </div>
      <div class="ty-msg" id="tyMsg"></div>`;
    renderBoard(); renderPool();
  }
  function badge(fk){ const f=FIELDS[fk]; return `<span class="ty-fld" style="--c:${f.color}">${f.label}</span>`; }
  function stars(d){ return '★'.repeat(d)+'<span class="ty-dim">'+'★'.repeat(3-d)+'</span>'; }
  function renderBoard(){
    const b=root.querySelector('#tyBoard'); b.innerHTML='';
    modules.forEach(m=>{ const e=eff(m); const pct=Math.min(100,m.work/m.need*100);
      const card=document.createElement('div'); card.className='ty-mod'; card.dataset.id=m.id;
      card.style.setProperty('--c',FIELDS[m.field].color);
      card.innerHTML=`
        <div class="ty-tab"><span class="ty-file">${m.name}</span>${badge(m.field)}<span class="ty-diff">${stars(m.diff)}</span></div>
        <div class="ty-code">${CODE.map(l=>`<div class="ln"><span class="lc"></span>${esc(l)}</div>`).join('')}</div>
        <div class="ty-foot">
          <div class="ty-prog"><i class="ty-fill" style="width:${pct}%"></i></div>
          ${m.dev
            ? `<button class="ty-seat on" title="빼기">${devChip(m.dev,true)}<span class="ty-eff ${e.match&&e.lvOk?'ok':(e.match?'warn':'bad')}">${e.tag}</span></button>`
            : `<button class="ty-seat empty">${sel?'＋ 여기 배치':'비어있음'}</button>`}
        </div>`;
      const seat=card.querySelector('.ty-seat');
      if(m.dev) seat.onclick=()=>unassign(m);
      else seat.onclick=()=>{ if(sel) assign(sel,m); };
      b.appendChild(card);
    });
    update();
  }
  function devChip(d,seated){ const f=FIELDS[d.field];
    return `<span class="ty-dev ${seated?'seated':''}" style="--c:${f.color}">
      <span class="ty-av">${d.name[0]}</span>
      <span class="ty-meta"><span class="ty-dn">${d.name}</span><span class="ty-dt">${f.label} Lv${d.lv}</span></span></span>`; }
  function renderPool(){
    const p=root.querySelector('#tyPool'); p.innerHTML='';
    if(!pool.length){ p.innerHTML='<span class="ty-empty">모두 투입 중 — 완료되면 돌아옴</span>'; return; }
    pool.forEach(d=>{ const el=document.createElement('button'); el.className='ty-chip'+(sel===d?' sel':'');
      el.innerHTML=devChip(d,false); el.onclick=()=>{ sel=(sel===d?null:d); render(); }; p.appendChild(el); });
  }
  function update(){
    const t=root.querySelector('#tyTime'); if(t)t.textContent=Math.max(0,Math.ceil(timeLeft))+'s';
    const tb=root.querySelector('#tyTimeBar'); if(tb){ tb.style.width=Math.max(0,timeLeft/TIME*100)+'%'; tb.parentElement.classList.toggle('warn',timeLeft<15); }
    const sh=root.querySelector('#tyShip'); if(sh)sh.textContent=shipped;
    modules.forEach(m=>{ const card=root.querySelector(`.ty-mod[data-id="${m.id}"]`); if(!card)return;
      const pct=Math.min(100,m.work/m.need*100);
      card.querySelector('.ty-fill').style.width=pct+'%';
      const lines=card.querySelectorAll('.ty-code .ln'); const rev=Math.round(pct/100*lines.length);
      lines.forEach((l,i)=>l.classList.toggle('on',i<rev));
      card.classList.toggle('active',!!m.dev);
    });
  }
  function esc(s){ return s.replace(/</g,'&lt;'); }

  function end(win){ over=true; clearInterval(timer);
    const m=root.querySelector('#tyMsg');
    if(win){ FX&&FX.confetti(); m.className='ty-msg good'; m.innerHTML=`✓ 마감 전 <b>${shipped}</b>개 출시! 적재적소 배치 성공`;
      setTimeout(()=>{ onClear&&onClear(); },1400); }
    else { m.className='ty-msg bad'; m.innerHTML=`✗ 마감! <b>${shipped}/${TARGET}</b> — 배치를 더 빠르게. <button class="ty-retry" id="tyRetry">다시</button>`;
      const r=root.querySelector('#tyRetry'); r.onclick=()=>start(root,onClear); }
  }

  return { start };
})();
