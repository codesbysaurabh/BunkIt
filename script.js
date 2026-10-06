(function(){
  const LOGO="https://lh3.googleusercontent.com/aida/AEtjO1V4IW3fGtJCVuatkk7jUtpbp2FqG8GoCgdRiigUh9xq_cwVrZVvvFkW1sjjuqqHQ_47oxfAd_AqKriO7R8tgT7ZUJfAog3Ive3ckOF-RARZzrAjJKcChQev6ukTmwgfXQGw6cDpMJNt2D7irQy-YBUz4HChnY5LbvHsPN-olKWV3DEZvZ_SNqe3Lha2sVH0YIG5wohIvw0rLrhU3BqF1SVAqN7STkzj_JqB9UZh8aV6A7wNXvxS97V5Au2w";
  document.querySelectorAll('[data-logo]').forEach(i=>{i.onerror=()=>{i.style.display='none';};i.src=LOGO;});
  const fav=document.createElement('link'); fav.rel='icon'; fav.href=LOGO; document.head.appendChild(fav);

  // GL Bajaj odd-semester 2026: dates with no lectures (besides every Sat/Sun)
  const offDates=new Set(['2026-08-28','2026-09-04','2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-10-02','2026-10-20','2026-11-06','2026-11-07','2026-11-08','2026-11-09','2026-11-10','2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21']);
  const iso=d=>d.toISOString().slice(0,10);
  for(let d=new Date(Date.UTC(2026,10,24)),e=Date.UTC(2026,11,27);d<=e;d.setUTCDate(d.getUTCDate()+1)) offDates.add(iso(d));
  const CAL_START=new Date(Date.UTC(2026,6,20)), CAL_END=new Date(Date.UTC(2026,11,27));
  const DAYS=['Mon','Tue','Wed','Thu','Fri'], FULL=['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const DEMO={mon:4,tue:5,wed:4,thu:5,fri:3};
  const counts={1:4,2:5,3:4,4:5,5:3};
  const $=id=>document.getElementById(id);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const today=()=>{const n=new Date();return new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()));};
  const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));};
  let mode='long', prevHero=0, last=null;

  // academic progress (real, from today)
  const pr=Math.min(100,Math.max(0,Math.round((today()-CAL_START)/(CAL_END-CAL_START)*100)));
  $('progressPct').textContent=pr+'%';
  const mn=iso(today()); if(mn>$('targetDate').min) $('targetDate').min=mn;

  function project(start,end){
    let total=0,active=0;
    for(let d=new Date(start);d<=end;d.setUTCDate(d.getUTCDate()+1)){
      const w=d.getUTCDay();
      if(w!==0&&w!==6&&!offDates.has(iso(d))){total+=counts[w]||0;active++;}
    }
    return {total,active};
  }

  // steppers
  DAYS.forEach((n,i)=>{
    const k=i+1,el=document.createElement('div'); el.className='day';
    el.innerHTML=`<div class="n">${n}</div><div class="v" id="v${k}">${counts[k]}</div><div class="b"><button type="button" aria-label="Decrease ${FULL[i]} lectures" data-k="${k}" data-s="-1">−</button><button type="button" aria-label="Increase ${FULL[i]} lectures" data-k="${k}" data-s="1">+</button></div>`;
    $('days').appendChild(el);
  });
  $('days').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    const k=b.dataset.k,n=counts[k]+Number(b.dataset.s); if(n<0||n>12) return;
    counts[k]=n; const v=$('v'+k); v.textContent=n; v.classList.add('bump'); setTimeout(()=>v.classList.remove('bump'),180);
    weekSum(); calc();
  });
  const weekSum=()=>$('weekSum').textContent=Object.values(counts).reduce((a,b)=>a+b,0)+' lectures/wk';

  const chips=[...document.querySelectorAll('#chips button')];
  const markChip=()=>chips.forEach(c=>c.classList.toggle('on',c.dataset.t===$('target').value));
  $('chips').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; $('target').value=b.dataset.t; markChip(); calc(); burst();});

  function burst(){
    const box=$('pass'); box.classList.remove('stamp'); void box.offsetWidth; box.classList.add('stamp');
    if(reduce) return;
    const cols=['#f59e0b','#10b981','#3b82f6','#f43f5e','#fbbf24','#6366f1'];
    for(let i=0;i<16;i++){
      const p=document.createElement('div'),s=4+Math.random()*6,a=Math.random()*6.283,d=40+Math.random()*110;
      p.className='confetti'; p.style.cssText=`width:${s}px;height:${s}px;background:${cols[i%6]};top:35px;left:50%;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-25}px;--rot:${Math.random()*360-180}deg`;
      $('passContainer').appendChild(p); setTimeout(()=>p.remove(),850);
    }
  }
  function toast(m){const t=$('toast');$('toastMsg').textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
  function tick(el,from,to){
    if(reduce||from===to){el.textContent=to;return;}
    const t0=performance.now();(function f(n){const p=Math.min((n-t0)/250,1);el.textContent=Math.round(from+(to-from)*p);if(p<1)requestAnimationFrame(f);})(t0);
  }
  const err=m=>{$('error').textContent=m||'';return null;};
  function setBadge(el,cls,html){el.className=cls;el.innerHTML=html;}

  function calc(){
    err('');
    const aS=$('attended').value,hS=$('held').value,tS=$('target').value;
    if(aS===''||hS==='') return err('Enter both attended and held class counts.');
    const a=Number(aS),h=Number(hS),tp=Number(tS);
    if(!Number.isInteger(a)||!Number.isInteger(h)) return err('Class counts must be whole numbers.');
    if(a<0||h<0) return err("Class counts can't be negative.");
    if(a>h) return err("Attended can't be more than held — check your numbers.");
    if(!Number.isInteger(tp)||tp<1||tp>100) return err('Enter a whole-number target between 1 and 100.');
    if(!$('targetDate').value) return err('Pick the date you need to maintain that target until.');
    if(!Object.values(counts).some(v=>v>0)) return err('Set your weekly timetable with the + buttons.');
    let start=today(),end=parse($('targetDate').value),note='';
    if(start>CAL_END) return err('This calendar only covers through 27 Dec 2026.');
    if(end<start) return err('Target date is in the past — pick today or later.');
    if(end>CAL_END){end=CAL_END;note=' Calendar ends 27 Dec 2026, so the projection stops there.';}
    if($('todayCounted').checked) start.setUTCDate(start.getUTCDate()+1);
    const {total:r,active}=project(start,end);
    if(r===0) return err('No lecture days between now and your target date with this timetable.');

    const T=h+r,cur=h>0?a/h*100:0,num=100*(a+r)-tp*T; // integer math
    $('floorChip').textContent=tp;$('footZone').textContent='Safe Zone: ≥'+tp+'%';
    const cls=cur>=tp?['b-safe','Currently Safe']:cur>=tp-5?['b-ok','Near Warning']:['b-bad','Below Target'];
    setBadge($('statusBadge'),'status '+cls[0],`<i></i><b>${cur.toFixed(1)}%</b> ${cls[1]}`);

    const reachable=num>=0, skip=reachable?Math.min(Math.floor(num/100),r):0, must=reachable?r-skip:r;
    const proj=100*(a+r-skip)/T, ceil=100*(a+r)/T, avg=r/active, daysOff=(skip/avg).toFixed(1);
    $('pass').classList.toggle('s-bad',!reachable); $('pass').classList.toggle('s-safe',reachable&&num>=100*r);

    if(reachable){tick($('heroSkipCount'),prevHero,skip);prevHero=skip;$('heroLbl').textContent=skip===1?'Lecture Safe to Skip':'Lectures Safe to Skip';}
    else{$('heroSkipCount').textContent=ceil.toFixed(1)+'%';prevHero=0;$('heroLbl').textContent='Best Possible — target unreachable';}
    const dq=$('dayEquiv'),bv=$('badgeVerdict');
    if(!reachable){dq.textContent='Even attending all '+r+' lectures';dq.style.color='var(--bad)';setBadge(bv,'badge b-bad','Critical Debt 🚨');$('bufferMsg').textContent=`Need ${Math.ceil(tp*T/100)} of ${T}; max reachable ${a+r}`;}
    else if(skip>2){dq.textContent=`~${daysOff} Full Days Off`;dq.style.color='var(--safe)';setBadge(bv,'badge b-safe',num>=100*r?'Already Ahead 🌴':'Safe to Bunk 🌴');$('bufferMsg').textContent=`${skip} lecture cushion available`;}
    else if(skip>0){dq.textContent=`~${daysOff} Days (Very Tight)`;dq.style.color='#B45309';setBadge(bv,'badge b-ok','Borderline Caution ⚠️');$('bufferMsg').textContent=`Warning: only ${skip} lecture cushion left`;}
    else{dq.textContent='0 Days Off (Zero Buffer)';dq.style.color='var(--bad)';setBadge(bv,'badge b-bad','Critical Debt 🚨');$('bufferMsg').textContent=`Need ${must} lectures to hit ${tp}%`;}

    $('gaugeTargetFloor').textContent=tp+'%'; $('gaugeProjected').textContent=(reachable?proj:ceil).toFixed(1)+'%';
    $('gaugeBar').style.width=Math.min(100,reachable?proj:ceil)+'%'; $('gaugeTick').style.left=tp+'%';
    $('statRemaining').textContent=r; $('statDays').textContent=`Classes ahead · ${active} days`; $('statTotal').textContent=T;
    $('statMustAttend').textContent=must; $('statMaxBunk').textContent=skip;

    $('ceilScore').textContent=ceil.toFixed(1)+'%'; $('ceilBar').style.width=ceil+'%';
    $('ceilDesc').innerHTML=`If you attend all <strong>${r}</strong> remaining lectures without missing any, your score goes from ${cur.toFixed(1)}% to <strong class="green">${ceil.toFixed(1)}%</strong> (${a+r} / ${T} classes).${note}`;
    const k=tp<100?tp/(100-tp):Infinity;
    $('catchDesc').innerHTML=tp<100?`Whenever your attendance dips below ${tp}%, every missed lecture requires attending <strong>${Number.isInteger(k)?k:k.toFixed(1)} consecutive lectures</strong> without a single absence to get back above the line.`:'At a 100% target, any missed lecture can never be recovered.';
    $('formula').textContent=tp<100?`Required = (${(tp/100)}·Total − Attended) / ${(1-tp/100).toFixed(2).replace(/0$/,'')}`:'n/a'; $('safeThr').textContent=tp+'% Safe Threshold';

    last={a,h,tp,r,T,skip,cur,ceil,daysOff,reachable,must,date:$('targetDate').value};
    strategy(); return true;
  }

  function strategy(){
    if(!last) return;
    $('pillLong').classList.toggle('on',mode==='long'); $('pillLight').classList.toggle('on',mode==='light');
    const {skip,reachable,must,r}=last, el=$('strategyAdvice');
    if(!reachable){el.innerHTML=`Target isn't reachable by this date. Attend all <strong>${r}</strong> lectures to get as close as possible.`;return;}
    if(skip===0){el.innerHTML=`You have zero skip allowance. Attend the next <strong>${must} lectures</strong> to stay at target.`;return;}
    const lit=DAYS.map((n,i)=>({n:FULL[i],c:counts[i+1]})).filter(x=>x.c>0).sort((x,y)=>x.c-y.c)[0];
    if(mode==='long'){
      const f=counts[5];
      el.innerHTML=f===0?'You have no Friday lectures, so your weekend is already a long one.':f<=skip?`🏖️ <strong>Long Weekend:</strong> skipping Friday (${f} classes) gives you a continuous Fri–Sun break and uses ${f} skips, leaving <strong>${skip-f}</strong> in reserve.`:`Skipping a full Friday (${f} classes) needs more than your <strong>${skip}</strong>-lecture buffer. Keep it for emergencies.`;
    } else {
      el.innerHTML=lit.c<=skip?`☕ <strong>Lightest Day:</strong> ${lit.n} has only ${lit.c} classes. Skip it for minimum penalty and keep <strong>${skip-lit.c}</strong> in reserve.`:`Your lightest day (${lit.n}, ${lit.c}) is larger than your <strong>${skip}</strong>-lecture buffer. Reserve it for illness.`;
    }
  }
  $('pillLong').onclick=()=>{mode='long';strategy();}; $('pillLight').onclick=()=>{mode='light';strategy();};

  ['attended','held','targetDate','todayCounted'].forEach(id=>$(id).addEventListener('input',calc));
  $('target').addEventListener('input',()=>{markChip();calc();});
  $('calcBtn').onclick=()=>{if(calc()){burst();toast('⚡ Skip budget recalculated live!');if(matchMedia('(max-width:900px)').matches)$('pass').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});}};

  $('resetBtn').onclick=()=>{
    $('attended').value=92;$('held').value=110;$('target').value=75;$('targetDate').value='2026-11-20';$('todayCounted').checked=false;
    Object.keys(DEMO).forEach((d,i)=>{counts[i+1]=DEMO[d];$('v'+(i+1)).textContent=DEMO[d];});
    weekSum();markChip();calc();burst();toast('Demo defaults restored');
  };
  const summary=()=>last?(last.reachable?`🎟️ BunkIt Plan: I can skip ${last.skip} lecture${last.skip===1?'':'s'} (~${last.daysOff} full days) and still hold ≥ ${last.tp}% until ${last.date}. ${last.r} lectures left, now ${last.cur.toFixed(1)}%.`:`🎟️ BunkIt: I can't reach ${last.tp}% by ${last.date}; best case is ${last.ceil.toFixed(1)}%.`):'';
  $('copyBtn').onclick=()=>{const s=summary();(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast('📋 Summary copied to clipboard!'),()=>toast('Copy not available in this browser'));};
  $('exportBtn').onclick=()=>{
    if(!last) return;
    const txt=`BUNKIT PASS · GL Bajaj Odd Sem 2026\n(Unofficial — not issued by the college)\n\n${summary()}\n\nAttended: ${last.a} / ${last.h}\nTarget: ${last.tp}% until ${last.date}\nRemaining lectures: ${last.r}\nTotal projected: ${last.T}\nMust attend: ${last.must}\nMax skips: ${last.skip}\nCeiling: ${last.ceil.toFixed(1)}%\n`;
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='bunkit-pass.txt';a.click();URL.revokeObjectURL(a.href);
    burst();toast('🎟️ Pass downloaded');
  };

  weekSum();markChip();calc();
})();