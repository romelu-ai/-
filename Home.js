// HOME
// ────────────────────────────────────────
function renderHome(){
  var d=new Date();var ds=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  document.getElementById('homeDateDisp').textContent=d.getFullYear()+'.'+p2(d.getMonth()+1)+'.'+p2(d.getDate())+' '+ds[d.getDay()];
  var ls=S.logs[todayK()]||[];var tm=ls.reduce(function(a,l){return a+l.min},0);
  document.getElementById('hToday').textContent=Math.floor(tm/60)+':'+p2(tm%60);
  document.getElementById('hBadgeTimer').textContent=Math.floor(tm/60)+':'+p2(tm%60);
  var st=0;for(var i=0;i<365;i++){var x=S.logs[offK(i)]||[];if(x.length)st++;else if(i>0)break}
  document.getElementById('hStreak').textContent=st;
  document.getElementById('hBadgeStreak').textContent=st+'日連続';
  var allM=0,allS=0;
  Object.keys(S.logs).forEach(function(k){var ls2=S.logs[k];allS+=ls2.length;allM+=ls2.reduce(function(a,l){return a+l.min},0)});
  document.getElementById('hAllH').textContent=Math.round(allM/60)+'h';
  document.getElementById('hSessions').textContent=allS;
  document.getElementById('hBadgeBooks').textContent=blBooks.length+'冊';
  var todayEvs=S.events.filter(function(e){return e.date===todayK()});
  document.getElementById('hBadgeCal').textContent=todayEvs.length+'件';
  document.getElementById('hBadgeExam').textContent=S.exams.length+'回';
  document.getElementById('hBadgeLinks').textContent=S.links.length+'件';
}

function tick(){
  var d=new Date();var ds=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  document.getElementById('navClock').textContent=d.getFullYear()+'.'+p2(d.getMonth()+1)+'.'+p2(d.getDate())+' '+ds[d.getDay()]+' '+p2(d.getHours())+':'+p2(d.getMinutes());
}

// ────────────────────────────────────────
