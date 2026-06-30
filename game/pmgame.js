// ④ PM 오케스트레이터 — 2단계 정리/포장 타이쿤 (기획 문서 에디터 테마).
// 1단계: 두서없이 쌓인 요구 단어들을 일정/요구사항/목표/목적 칸으로 분류 → 요구사항정의서 완성.
// 2단계: 정의서를 보고서 섹션 순서대로 끼워 문서로 포장 → 발행하면 클리어.
const PMGame=(()=>{
  const CATS=[
    {k:'PURP', label:'목적',   color:'#7C5CFF', hint:'왜 하는가'},
    {k:'GOAL', label:'목표',   color:'#22D3C4', hint:'성공 지표'},
    {k:'REQ',  label:'요구사항',color:'#38BDF8', hint:'무엇을 만드나'},
    {k:'SCHED',label:'일정',   color:'#F5B544', hint:'언제까지'},
  ];
  const CHIPS=[
    {t:'2030 핵심고객 확보',k:'PURP'}, {t:'브랜드 충성도 강화',k:'PURP'},
    {t:'이탈률 30% 감소',k:'GOAL'},   {t:'MAU 10만 달성',k:'GOAL'},
    {t:'간편결제 연동',k:'REQ'},      {t:'다크모드 지원',k:'REQ'},
    {t:'다음 분기 오픈',k:'SCHED'},    {t:'6월 말 베타',k:'SCHED'},
  ];
  // 보고서 포장 순서
  const REPORT=['표지','배경·목적','목표','요구사항','일정','맺음'];

  let phase, pool, placed, sel, tray, built, root, onClear, over;
  const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const catOf=k=>CATS.find(c=>c.k===k);

  function start(container,onClearCb){ root=container; onClear=onClearCb; over=false;
    phase=1; pool=shuffle(CHIPS.map((c,i)=>({...c,id:i}))); placed={PURP:[],GOAL:[],REQ:[],SCHED:[]}; sel=null;
    render1(); }

  // ── 1단계: 요구 분류 ──
  function render1(){
    root.innerHTML=`
      <div class="pm-doc">
        <div class="pm-bar"><span class="pm-dot r"></span><span class="pm-dot y"></span><span class="pm-dot g"></span>
          <span class="pm-file">요구사항정의서.doc</span><span class="pm-step">1 / 2 · 요구 분류</span></div>
        <div class="pm-said">고객·팀이 던진 말들 — 순서 없이 쌓였다. 단어를 골라 알맞은 칸에 넣어 정의서를 완성하라.</div>
        <div class="pm-pool" id="pmPool"></div>
        <div class="pm-boxes" id="pmBoxes"></div>
      </div>
      <div class="pm-msg" id="pmMsg"></div>`;
    drawPool(); drawBoxes();
  }
  function drawPool(){
    const p=root.querySelector('#pmPool'); p.innerHTML = pool.length?'':'<span class="pm-empty">전부 분류 완료!</span>';
    pool.forEach(c=>{ const b=document.createElement('button'); b.className='pm-chip'+(sel===c.id?' sel':'');
      b.textContent=c.t; b.onclick=()=>{ sel=(sel===c.id?null:c.id); drawPool(); }; p.appendChild(b); });
  }
  function drawBoxes(){
    const wrap=root.querySelector('#pmBoxes'); wrap.innerHTML='';
    CATS.forEach(cat=>{ const box=document.createElement('div'); box.className='pm-box'; box.style.setProperty('--c',cat.color);
      box.innerHTML=`<div class="pm-box-h">${cat.label}<i>${cat.hint}</i></div><div class="pm-box-b"></div>`;
      const body=box.querySelector('.pm-box-b');
      placed[cat.k].forEach(c=>{ const t=document.createElement('span'); t.className='pm-tag'; t.textContent=c.t; body.appendChild(t); });
      box.onclick=()=>tryPlace(cat);
      wrap.appendChild(box);
    });
  }
  function tryPlace(cat){
    if(sel===null){ msg('먼저 위에서 단어를 하나 골라.',''); return; }
    const c=pool.find(x=>x.id===sel);
    if(c.k===cat.k){ placed[cat.k].push(c); pool=pool.filter(x=>x.id!==sel); sel=null; FX&&FX.shake(60,1);
      drawPool(); drawBoxes(); msg('',''); if(!pool.length) setTimeout(toPhase2,500); }
    else { FX&&FX.shake(260,5); flashBox(cat); msg(`그건 <b>${cat.label}</b>이 아니야 — 다시 봐.`,'bad'); }
  }
  function flashBox(cat){ const boxes=[...root.querySelectorAll('.pm-box')]; const i=CATS.indexOf(cat);
    const el=boxes[i]; if(el){ el.classList.add('no'); setTimeout(()=>el.classList.remove('no'),300); } }

  // ── 2단계: 보고서 포장 ──
  function toPhase2(){ FX&&FX.confetti(); msg('정의서 완성! 이제 보고서로 포장하자.','good');
    setTimeout(()=>{ phase=2; tray=shuffle(REPORT.map((t,i)=>({t,i}))); built=[]; render2(); },900); }
  function render2(){
    root.innerHTML=`
      <div class="pm-doc">
        <div class="pm-bar"><span class="pm-dot r"></span><span class="pm-dot y"></span><span class="pm-dot g"></span>
          <span class="pm-file">최종보고서.doc</span><span class="pm-step">2 / 2 · 보고서 포장</span></div>
        <div class="pm-said">정의서를 보고서로 — 표지부터 맺음까지 순서대로 끼워 문서를 완성하라.</div>
        <div class="pm-report" id="pmReport"></div>
        <div class="pm-tray-t">남은 섹션 <i>(순서대로 눌러 추가)</i></div>
        <div class="pm-tray" id="pmTray"></div>
        <button class="pm-pub" id="pmPub" disabled>📄 보고서 발행</button>
      </div>
      <div class="pm-msg" id="pmMsg"></div>`;
    drawReport(); drawTray();
    root.querySelector('#pmPub').onclick=()=>{ if(built.length===REPORT.length) win(); };
  }
  function drawReport(){
    const r=root.querySelector('#pmReport'); r.innerHTML='';
    REPORT.forEach((t,i)=>{ const row=document.createElement('div'); row.className='pm-line'+(i<built.length?' on':'');
      row.innerHTML=`<span class="pm-no">${i+1}</span><span class="pm-ln">${i<built.length?REPORT[i]:'<span class=\"pm-blank\"></span>'}</span>`;
      r.appendChild(row); });
  }
  function drawTray(){
    const t=root.querySelector('#pmTray'); t.innerHTML='';
    tray.forEach(s=>{ const b=document.createElement('button'); b.className='pm-sec'; b.textContent=s.t;
      b.onclick=()=>tryOrder(s,b); t.appendChild(b); });
    const pub=root.querySelector('#pmPub'); if(pub)pub.disabled=built.length!==REPORT.length;
  }
  function tryOrder(s,btn){
    const need=REPORT[built.length];
    if(s.t===need){ built.push(s.t); tray=tray.filter(x=>x!==s); FX&&FX.shake(60,1); drawReport(); drawTray();
      msg('',''); if(built.length===REPORT.length) msg('문서 완성 — 발행만 남았다!','good'); }
    else { FX&&FX.shake(240,5); btn.classList.add('no'); setTimeout(()=>btn.classList.remove('no'),300);
      msg(`순서가 달라 — 다음은 <b>${need}</b>.`,'bad'); }
  }

  function msg(t,cls){ const m=root.querySelector('#pmMsg'); if(m){ m.className='pm-msg '+(cls||''); m.innerHTML=t; } }
  function win(){ if(over)return; over=true; FX&&FX.confetti(); FX&&FX.flash();
    msg('✓ 보고서 발행 완료 — 사람과 사람 사이의 일을 하나의 문서로 묶어냈다.','good');
    setTimeout(()=>{ onClear&&onClear(); },1500); }

  // ── AI 오토: 1단계 단어 정분류 → 2단계 보고서 순서대로 → 발행 ──
  function auto(){ autoStep(); }
  function autoStep(){ if(over)return;
    if(phase===1){
      if(pool.length){ const c=pool[0], cat=CATS.find(x=>x.k===c.k); sel=c.id; tryPlace(cat); }
      setTimeout(autoStep, 380);
    } else if(phase===2){
      if(built.length<REPORT.length){ const next=REPORT[built.length], s=tray.find(x=>x.t===next);
        if(s) tryOrder(s,{classList:{add(){},remove(){}}}); setTimeout(autoStep, 380); }
      else { const pub=root.querySelector('#pmPub'); if(pub&&!pub.disabled) pub.click(); else setTimeout(autoStep,300); }
    } else setTimeout(autoStep, 380);
  }

  return { start, auto };
})();
