(function(){

  // ---- GL Bajaj odd-semester 2026 calendar: dates with no attendance-marked lectures ----
  // (in addition to every Saturday and Sunday, which are always off)
  const offDates = new Set([
    '2026-08-28', // Rakshabandhan
    '2026-09-04', // Krishna Janmashtami
    '2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12', // ST-1
    '2026-10-02', // Gandhi Jayanti
    '2026-10-20', // Dussehra
    '2026-11-06','2026-11-07','2026-11-08','2026-11-09','2026-11-10', // Diwali
    '2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21', // PUT
  ]);

  // End-semester exam block: 24 Nov – 27 Dec, every day off (covers Guru Nanak + Christmas too)
  (function addRange(){
    let d = new Date(Date.UTC(2026,10,24));
    const end = new Date(Date.UTC(2026,11,27));
    while(d <= end){
      offDates.add(isoOf(d));
      d.setUTCDate(d.getUTCDate()+1);
    }
  })();

  const CALENDAR_END = new Date(Date.UTC(2026,11,27));

  function isoOf(d){ return d.toISOString().slice(0,10); }

  function todayUTC(){
    const n = new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  }

  function parseDateInput(str){
    const [y,m,d] = str.split('-').map(Number);
    return new Date(Date.UTC(y, m-1, d));
  }

  // walk from start to end (inclusive), summing lecture counts on non-weekend, non-off-list days
  function projectRemaining(start, end, weekdayCounts){
    let total = 0, activeDays = 0;
    let d = new Date(start.getTime());
    while(d <= end){
      const dow = d.getUTCDay(); // 0 Sun .. 6 Sat
      if(dow !== 0 && dow !== 6 && !offDates.has(isoOf(d))){
        total += weekdayCounts[dow] || 0;
        activeDays++;
      }
      d.setUTCDate(d.getUTCDate()+1);
    }
    return { total, activeDays };
  }

  const $ = (id) => document.getElementById(id);
  const errorLine = $('errorLine');
  const ticket = $('ticket');

  function setError(msg){
    errorLine.textContent = msg || '';
  }

  function renderPlaceholder(msg){
    ticket.className = 'ticket placeholder';
    ticket.innerHTML = msg;
  }

  function renderTicket(state, html){
    ticket.className = 'ticket state-' + state + ' pop';
    ticket.innerHTML = html;
  }

  $('calcBtn').addEventListener('click', function(){
    setError('');

    const attended = Number($('attended').value);
    const held = Number($('held').value);
    const targetPct = Number($('target').value);
    const targetDateStr = $('targetDate').value;
    const weekdayCounts = {};
    document.querySelectorAll('[data-day]').forEach(inp => {
      weekdayCounts[Number(inp.dataset.day)] = Number(inp.value) || 0;
    });

    if(!$('attended').value || !$('held').value){
      setError('Enter both attended and held class counts.'); return;
    }
    if(attended < 0 || held < 0){
      setError("Class counts can't be negative."); return;
    }
    if(attended > held){
      setError("Attended can't be more than held — check your numbers."); return;
    }
    if(!targetPct || targetPct <= 0 || targetPct > 100){
      setError('Enter a target attendance between 1 and 100.'); return;
    }
    if(!targetDateStr){
      setError('Pick the date you need to maintain that target until.'); return;
    }

    const start = todayUTC();
    let end = parseDateInput(targetDateStr);
    let clampedNote = '';

    if(start > CALENDAR_END){
      setError("This calendar only covers through 27 Dec 2026 — check back next semester."); return;
    }
    if(end < start){
      setError('Target date is in the past — pick a date from today onward.'); return;
    }
    if(end > CALENDAR_END){
      end = CALENDAR_END;
      clampedNote = 'Calendar data only runs to 27 Dec 2026, so the projection stops there.';
    }

    const { total: r, activeDays } = projectRemaining(start, end, weekdayCounts);
    const T = held + r;
    const t = targetPct / 100;

    if(T <= 0){
      renderPlaceholder('No lecture days between today and your target date with this timetable — nothing to project.');
      return;
    }

    const currentPct = held > 0 ? (attended/held)*100 : 0;
    const rawSkip = attended + r - t*T;

    if(rawSkip < 0){
      const bestPct = ((attended + r)/T)*100;
      renderTicket('danger', `
        <div class="ticket-top">
          <div class="stat"><div class="k">current</div><div class="v">${currentPct.toFixed(1)}%</div></div>
          <div class="stat"><div class="k">target</div><div class="v">${targetPct}%</div></div>
        </div>
        <div class="perforation"></div>
        <div class="ticket-main">
          <div class="k">Not reachable by this date</div>
          <div class="headline-number">${bestPct.toFixed(1)}%</div>
          <div class="headline-sub">is the highest you can hit — even attending every one of your ${r} remaining lectures.</div>
          <div class="ticket-note">${activeDays} class days left between now and your target date. ${clampedNote}</div>
        </div>
      `);
      return;
    }

    const skip = Math.min(Math.floor(rawSkip), r);
    const avgPerDay = activeDays > 0 ? r/activeDays : 0;
    const skipDays = avgPerDay > 0 ? Math.floor(skip/avgPerDay) : 0;
    const safe = rawSkip >= r;

    renderTicket(safe ? 'safe' : 'ok', `
      <div class="ticket-top">
        <div class="stat"><div class="k">current</div><div class="v">${currentPct.toFixed(1)}%</div></div>
        <div class="stat"><div class="k">target</div><div class="v">${targetPct}%</div></div>
      </div>
      <div class="perforation"></div>
      <div class="ticket-main">
        <div class="k">${safe ? "You're already ahead" : 'Skip budget'}</div>
        <div class="headline-number">${skip} lecture${skip===1?'':'s'}</div>
        <div class="headline-sub">≈ ${skipDays} full day${skipDays===1?'':'s'} off, and you'll still hold ${targetPct}%+ by your target date.</div>
        <div class="ticket-note">${activeDays} class days left (${r} lectures) between now and your target date. ${clampedNote}</div>
      </div>
    `);
  });

  // sensible default: today's date as min for the date picker
  const t = todayUTC();
  const minStr = t.toISOString().slice(0,10);
  const dateInput = $('targetDate');
  if(minStr > dateInput.min) dateInput.min = minStr;

})();
