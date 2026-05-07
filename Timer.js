// TIMER
// ────────────────────────────────────────
var CIRC=2*Math.PI*70;
function setRing(r){document.getElementById('ringProg').style.strokeDashoffset=CIRC*(1-r)}
function setTimerMode(mode,el){
  if(S.timerMode==='countdown'&&S.running)stopTimer();
  if(S.timerMode==='stopwatch'&&swState.running)stopSW();
  S.timerMode=mode;
  document.querySelectorAll('.tmt').forEach(function(t){t.classList.remove('on')});
  if(el)el.classList.add('on');
  var isSW=(mode==='stopwatch');
  document.getElementById('cdBtns').style.display=isSW?'none':'flex';
  document.getElementById('swBtns').style.display=isSW?'flex':'none';
  document.getElementById('customPanel').style.display=(mode==='custom')?'block':'none';
  document.getElementById('swLapWrap').style.display=isSW?'block':'none';
  document.getElementById('pdots').style.display=isSW?'none':'';
  var pr=document.getElementById('ringProg');
  if(isSW){pr.style.stroke='var(--gn)';pr.style.filter='drop-shadow(0 0 6px var(--gn))';document.getElementById('tPhase').textContent='STOPWATCH';document.getElementById('tDig').textContent='00:00.0';setRing(0);}
  else{pr.style.stroke='';pr.style.filter='';document.getElementById('tPhase').textContent=S.pomo?'FOCUS':'TIMER';if(mode==='custom')document.getElementById('tPhase').textContent='CUSTOM';document.getElementById('tDig').textContent=fs(S.sec);setRing(1);}
}
function applyCustomTime(){if(S.running)stopTimer();var h=parseInt(document.getElementById('setHour').value)||0;var m=parseInt(document.getElementById('setMin').value)||0;var s=parseInt(document.getElementById('setSec').value)||0;var total=h*3600+m*60+s;if(total<=0){alert('時間を設定してください');return;}S.sec=total;S.ringTotal=total;document.getElementById('tDig').textContent=fs(S.sec);setRing(1);document.getElementById('tPhase').textContent='CUSTOM';}
function applyPreset(mins){if(S.running)stopTimer();S.sec=mins*60;S.ringTotal=S.sec;document.getElementById('tDig').textContent=fs(S.sec);setRing(1);document.getElementById('setHour').value=0;document.getElementById('setMin').value=mins;document.getElementById('setSec').value=0;document.getElementById('tPhase').textContent=mins+'MIN';}
function toggleTimer(){if(S.running)stopTimer();else startTimer()}
function startTimer(){S.running=true;S.sessionStart=new Date();S.curBookId=document.getElementById('timerBook').value||null;S.ringTotal=S.sec;document.getElementById('startBtn').innerHTML='&#9646;&#9646; PAUSE';document.getElementById('runInd').classList.add('on');document.getElementById('runLbl').textContent='REC: '+(S.curBookId?bookName(S.curBookId):'(未選択)');S.iv=setInterval(function(){S.sec--;document.getElementById('tDig').textContent=fs(S.sec);setRing(S.sec/S.ringTotal);if(S.sec<=0)onTimerEnd();},1000);}
function stopTimer(){S.running=false;clearInterval(S.iv);document.getElementById('startBtn').innerHTML='&#9654; START';document.getElementById('runInd').classList.remove('on');commitSession();}
function resetTimer(){stopTimer();if(S.pomo){S.sec=S.WORK;S.pomoPhase='work';document.getElementById('tPhase').textContent='FOCUS';document.getElementById('ringProg').classList.remove('brk');}else if(S.timerMode==='custom'){var h=parseInt(document.getElementById('setHour').value)||0;var m=parseInt(document.getElementById('setMin').value)||0;var s=parseInt(document.getElementById('setSec').value)||0;S.sec=Math.max(60,h*3600+m*60+s);}else{S.sec=1500;}document.getElementById('tDig').textContent=fs(S.sec);setRing(1);}
function onTimerEnd(){clearInterval(S.iv);S.running=false;document.getElementById('startBtn').innerHTML='&#9654; START';document.getElementById('runInd').classList.remove('on');commitSession();if(S.pomo){if(S.pomoPhase==='work'){S.pomoN++;S.pomoPhase='break';S.sec=S.BREAK;S.ringTotal=S.BREAK;document.getElementById('tPhase').textContent='BREAK';document.getElementById('ringProg').classList.add('brk');alert('セッション完了！休憩しましょう ☕');}else{S.pomoPhase='work';S.sec=S.WORK;S.ringTotal=S.WORK;document.getElementById('tPhase').textContent='FOCUS';document.getElementById('ringProg').classList.remove('brk');alert('休憩終了！');}renderPomoDots();}else{S.sec=S.ringTotal;alert('タイマー終了！お疲れ様 ✨');}document.getElementById('tDig').textContent=fs(S.sec);setRing(1);}
function commitSession(){if(!S.sessionStart)return;var el=Math.floor((new Date()-S.sessionStart)/1000);S.sessionStart=null;if(el<30)return;var mins=Math.round(el/60);if(mins<1)return;addSession(S.curBookId,mins,0,0,'');}
function togglePomo(){S.pomo=!S.pomo;document.getElementById('pomoBtn').style.background=S.pomo?'var(--orD)':'transparent';if(S.pomo){S.sec=S.WORK;S.pomoPhase='work';S.pomoN=0;document.getElementById('tPhase').textContent='FOCUS';document.getElementById('ringProg').classList.remove('brk');}else{S.sec=1500;document.getElementById('tPhase').textContent='TIMER';}if(S.running){clearInterval(S.iv);S.running=false;S.sessionStart=null;document.getElementById('startBtn').innerHTML='&#9654; START';document.getElementById('runInd').classList.remove('on');}document.getElementById('tDig').textContent=fs(S.sec);setRing(1);renderPomoDots();}
function renderPomoDots(){var el=document.getElementById('pdots');if(!S.pomo){el.innerHTML='';return;}var h='';for(var i=0;i<8;i++){var cc=i<S.pomoN?'done':(i===S.pomoN&&S.running&&S.pomoPhase==='work'?'cur':'');h+='<div class="pdot '+cc+'"></div>';}el.innerHTML=h;}
var swState={running:false,elapsed:0,lapStart:0,laps:[],iv:null,startTime:0};
function fsSW(ms){var s=Math.floor(ms/1000);var t=Math.floor((ms%1000)/100);return p2(Math.floor(s/60))+':'+p2(s%60)+'.'+t;}
function toggleSW(){if(swState.running)pauseSW();else startSW()}
function startSW(){swState.running=true;swState.startTime=Date.now()-swState.elapsed;S.sessionStart=new Date();S.curBookId=document.getElementById('timerBook').value||null;document.getElementById('swStartBtn').innerHTML='&#9646;&#9646; PAUSE';document.getElementById('swLapBtn').disabled=false;document.getElementById('runInd').classList.add('on');document.getElementById('runLbl').textContent='SW REC: '+(S.curBookId?bookName(S.curBookId):'(未選択)');swState.iv=setInterval(function(){swState.elapsed=Date.now()-swState.startTime;document.getElementById('tDig').textContent=fsSW(swState.elapsed);setRing((swState.elapsed%(60*60*1000))/(60*60*1000));},100);}
function pauseSW(){swState.running=false;clearInterval(swState.iv);document.getElementById('swStartBtn').innerHTML='&#9654; START';commitSwSession();}
function stopSW(){swState.running=false;clearInterval(swState.iv);commitSwSession();document.getElementById('swStartBtn').innerHTML='&#9654; START';document.getElementById('runInd').classList.remove('on');}
function resetSW(){stopSW();swState.elapsed=0;swState.lapStart=0;swState.laps=[];document.getElementById('tDig').textContent='00:00.0';document.getElementById('lapList').innerHTML='';document.getElementById('swLapBtn').disabled=true;setRing(0);}
function lapSW(){if(!swState.running)return;var lapTime=swState.elapsed-swState.lapStart;swState.lapStart=swState.elapsed;var n=swState.laps.length+1;swState.laps.push({n:n,lap:lapTime,total:swState.elapsed});var li=document.createElement('li');li.className='lap-item';li.innerHTML='<span class="lap-n">LAP '+p2(n)+'</span><span class="lap-t">'+fsSW(lapTime)+'</span><span class="lap-d">'+fsSW(swState.elapsed)+'</span>';var list=document.getElementById('lapList');list.insertBefore(li,list.firstChild);}
function commitSwSession(){if(!S.sessionStart)return;var el=Math.floor((new Date()-S.sessionStart)/1000);S.sessionStart=null;if(el<30)return;var mins=Math.round(el/60);if(mins<1)return;addSession(S.curBookId,mins,0,0,'SW');}
function saveGoal(){S.goalH=parseInt(document.getElementById('goalInp').value)||4;save();renderTimerStats()}
function renderTimerStats(){var ls=S.logs[todayK()]||[];var tm=ls.reduce(function(a,l){return a+l.min},0);document.getElementById('sTotal').textContent=Math.floor(tm/60)+':'+p2(tm%60);document.getElementById('sSess').textContent=ls.length;var st=0;for(var i=0;i<365;i++){var x=S.logs[offK(i)]||[];if(x.length)st++;else if(i>0)break}document.getElementById('sStreak').textContent=st;var pct=Math.min(100,Math.round(tm/(S.goalH*60)*100));document.getElementById('goalBar').style.width=pct+'%';document.getElementById('goalPct').textContent=pct+'%';}
function renderTodayLog(){var ls=(S.logs[todayK()]||[]).slice().reverse();document.getElementById('logList').innerHTML=ls.map(function(l){return'<li class="logi"><span class="logi-book">'+esc(bookName(l.bookId))+'</span><span class="logi-meta">'+fh(l.min)+(l.prob?' · '+l.prob+'問':'')+' · '+l.time+'</span></li>';}).join('')||'<li style="font-family:var(--mono);font-size:.6rem;color:var(--txD);padding:7px 0">// no sessions yet</li>';}
function manualLog(){var bId=document.getElementById('manBook').value||null;var mins=parseInt(document.getElementById('manMin').value)||0;if(mins<1){alert('時間を入力してください');return}addSession(bId,mins,parseInt(document.getElementById('manProb').value)||0,parseInt(document.getElementById('manPage').value)||0,document.getElementById('manNote').value.trim());['manMin','manProb','manPage','manNote'].forEach(function(i){document.getElementById(i).value=''});}
function addSession(bookId,mins,prob,page,note){var now=new Date();var dk=todayK();var ts=p2(now.getHours())+':'+p2(now.getMinutes());if(bookId){var b=getBook(bookId);if(b)b.sessions.push({date:dk,min:mins,prob:prob,page:page,note:note,time:ts});}if(!S.logs[dk])S.logs[dk]=[];S.logs[dk].push({bookId:bookId,min:mins,prob:prob,time:ts});save();renderTodayLog();renderTimerStats();if(document.getElementById('page-books').classList.contains('on'))blRenderGrid();}
function refreshBookSelects(){
  // タイマー用参考書セレクトはS.booksから（STUDY OS互換）
  // BOOKSページのtimerBookセレクトはblBooksから名前を使う
  var sosOpts=S.books.map(function(b){return'<option value="'+b.id+'">'+esc(b.title)+'</option>'}).join('');
  var blOpts=blBooks.map(function(b){return'<option value="bl_'+b.id+'">'+esc(b.title)+'</option>'}).join('');
  var none='<option value="">-- 参考書を選択 --</option>';
  ['timerBook','manBook'].forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML=none+sosOpts+blOpts;});
}

// ────────────────────────────────────────
