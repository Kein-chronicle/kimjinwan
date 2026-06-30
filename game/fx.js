// 이펙트 엔진 — 파티클(스파클/하트/별), 스크린 셰이크, 플래시
const FX = (()=>{
  const app = document.getElementById('app');
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  let W,H, parts=[], running=false;
  const C = {accent:'#38BDF8', violet:'#7C5CFF', teal:'#22D3C4', gold:'#F5B544', red:'#F2607A', green:'#4ADE80', white:'#FFFFFF'};

  function resize(){ const r=app.getBoundingClientRect(); cv.width=W=r.width; cv.height=H=r.height; }
  new ResizeObserver(resize).observe(app); resize();

  function loop(){
    ctx.clearRect(0,0,W,H);
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i];
      p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.life--; p.rot+=p.vr;
      const a=Math.max(0,p.life/p.max);
      ctx.save(); ctx.globalAlpha=a; ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      if(p.kind==='heart'){ ctx.font=`${p.size}px serif`; ctx.fillText('❤',-p.size/2,p.size/2); }
      else if(p.kind==='star'){ ctx.font=`${p.size}px serif`; ctx.fillText('✦',-p.size/2,p.size/2); ctx.fillStyle=p.color; }
      else { ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); } // 픽셀 사각 파티클
      ctx.restore();
      if(p.life<=0) parts.splice(i,1);
    }
    if(parts.length) requestAnimationFrame(loop); else running=false;
  }
  function go(){ if(!running){running=true; requestAnimationFrame(loop);} }

  function spawn(n,x,y,opt){
    for(let i=0;i<n;i++){
      const ang=opt.ang!==undefined?opt.ang: Math.random()*Math.PI*2;
      const sp=(opt.spMin||1)+Math.random()*((opt.spMax||5)-(opt.spMin||1));
      parts.push({x,y,vx:Math.cos(ang)*sp*(opt.dx||1),vy:Math.sin(ang)*sp - (opt.up||0),
        g:opt.g!==undefined?opt.g:0.12, size:(opt.sMin||3)+Math.random()*((opt.sMax||7)-(opt.sMin||3)),
        color:opt.colors[(Math.random()*opt.colors.length)|0], life:opt.life||50, max:opt.life||50,
        rot:0, vr:(Math.random()-.5)*0.3, kind:opt.kind||'sq'});
    }
    go();
  }
  // 좌표(요소 기준) → 캔버스 좌표
  function at(elOrXY){
    if(elOrXY.getBoundingClientRect){ const a=app.getBoundingClientRect(), r=elOrXY.getBoundingClientRect();
      return {x:r.left-a.left+r.width/2, y:r.top-a.top+r.height/2}; }
    return elOrXY;
  }

  return {
    burst(el, colors=[C.accent,C.violet,C.teal,C.white]){ const{x,y}=at(el); spawn(40,x,y,{colors,spMin:2,spMax:8,life:55,g:0.18,sMin:3,sMax:8,kind:'sq'}); },
    sparkle(el){ const{x,y}=at(el); spawn(26,x,y,{colors:[C.gold,C.white,C.accent,C.teal],spMin:1,spMax:6,life:60,g:0.05,kind:'star',sMin:8,sMax:16}); },
    hearts(el,k=8){ const{x,y}=at(el); spawn(k,x,y,{colors:[C.red],up:4,spMin:1,spMax:3,life:70,g:0.08,kind:'heart',sMin:16,sMax:26,dx:1}); },
    confetti(){ for(let i=0;i<60;i++) spawn(1, Math.random()*W, -10, {colors:[C.accent,C.violet,C.teal,C.gold,C.red],vy:0,spMin:1,spMax:3,ang:Math.PI/2,life:120,g:0.06,sMin:4,sMax:8}); },
    shake(ms=350,px=8){ app.style.setProperty('--shk',px+'px'); app.classList.add('shaking'); setTimeout(()=>app.classList.remove('shaking'), ms); },
    flash(ms=480){ const f=document.getElementById('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),ms); }
  };
})();
