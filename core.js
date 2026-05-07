// UNIFIED HELPERS
// ────────────────────────────────────────
function p2(n){return String(n).padStart(2,'0')}
function fs(s){return p2(Math.floor(s/60))+':'+p2(s%60)}
function fh(m){var h=Math.floor(m/60),mm=m%60;return h?h+'h'+mm+'m':mm+'m'}
function todayK(){var d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function offK(n){var d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function getBook(id){return S.books.find(function(b){return String(b.id)===String(id)})}
function bookName(id){var b=getBook(id);return b?b.title:'(未設定)'}

// ────────────────────────────────────────
// SAVE / LOAD
// ────────────────────────────────────────
function save(){
  var exLite=S.exams.map(function(e){return{id:e.id,name:e.name,series:e.series||'',date:e.date,total:e.total,hensachi:e.hensachi,rank:e.rank,schoolRank:e.schoolRank||'',note:e.note,subjs:e.subjs,links:e.links||[],imgs:[]};});
  try{localStorage.setItem('sos5',JSON.stringify({books:S.books,logs:S.logs,events:S.events,goalH:S.goalH,exams:exLite,links:S.links,memo:S.memo}));}catch(e){}
  S.exams.forEach(function(e){
    if(e.imgs&&e.imgs.length){try{localStorage.setItem('sos5i_'+e.id,JSON.stringify(e.imgs));}catch(err){}}
    if(e.pdfs&&e.pdfs.length){try{localStorage.setItem('sos5p_'+e.id,JSON.stringify(e.pdfs));}catch(err){}}
  });
}
function load(){
  try{
    var r=localStorage.getItem('sos5');if(!r)return;
    var d=JSON.parse(r);
    if(d.books)S.books=d.books;
    if(d.logs)S.logs=d.logs;
    if(d.events)S.events=d.events;
    if(d.goalH)S.goalH=d.goalH;
    if(d.exams){S.exams=d.exams;S.exams.forEach(function(e){
      try{var img=localStorage.getItem('sos5i_'+e.id);e.imgs=img?JSON.parse(img):[];}catch(err){e.imgs=[];}
      try{var pdf=localStorage.getItem('sos5p_'+e.id);e.pdfs=pdf?JSON.parse(pdf):[];}catch(err){e.pdfs=[];}
      if(!e.series)e.series='';
    });}
    if(d.links)S.links=d.links;
    if(d.memo)S.memo=d.memo;
  }catch(err){}
}

function blSave(){try{localStorage.setItem(BL_KEY,JSON.stringify(blBooks));}catch(e){}}
function blLoad(){
  try{
    var r=localStorage.getItem(BL_KEY);
    if(r)blBooks=JSON.parse(r)||[];
  }catch(e){blBooks=[];}
}

// ────────────────────────────────────────
// PAGE ROUTING
// ────────────────────────────────────────
function goPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('on')});
  document.querySelectorAll('.ntab').forEach(function(t){t.classList.remove('on')});
  document.getElementById('page-'+id).classList.add('on');
  document.getElementById('tab-'+id).classList.add('on');
  if(id==='home')renderHome();
  if(id==='timer'){refreshBookSelects();renderTodayLog();renderTimerStats()}
  if(id==='books')blRenderGrid();
  if(id==='cal')renderCal();
  if(id==='exam'){renderExamList();renderExamChart()}
  if(id==='stats'){renderStats();renderWeekChart();logEditToday()}
  if(id==='other'){renderLinks();renderBackupInfo();ghRenderInfo();var mt=document.getElementById('memoTa');if(mt)mt.value=S.memo;}
}

// ────────────────────────────────────────
// BACKUP
// ────────────────────────────────────────
function renderBackupInfo(){
  var last=localStorage.getItem('sos5_lastExport');
  var el=document.getElementById('lastExportTime');if(el)el.textContent=last||'なし';
  var sz=0;try{var raw=localStorage.getItem('sos5');if(raw)sz+=raw.length;Object.keys(localStorage).forEach(function(k){if(k.startsWith('sos5i_')||k.startsWith('sos5p_'))sz+=localStorage.getItem(k).length;});}catch(e){}
  var kb=Math.round(sz/1024);var sEl=document.getElementById('storageSize');if(sEl)sEl.textContent=kb>1024?(kb/1024).toFixed(1)+'MB':kb+'KB';
}
function exportData(){
  var data={version:2,exportedAt:new Date().toISOString(),main:null,images:{},pdfs:{},booklog:null};
  try{data.main=JSON.parse(localStorage.getItem('sos5')||'{}');}catch(e){}
  try{data.booklog=JSON.parse(localStorage.getItem(BL_KEY)||'[]');}catch(e){}
  Object.keys(localStorage).forEach(function(k){
    if(k.startsWith('sos5i_'))data.images[k.slice(6)]=localStorage.getItem(k);
    if(k.startsWith('sos5p_'))data.pdfs[k.slice(6)]=localStorage.getItem(k);
    if(k.startsWith('sos5bp_')){data.bookPhotos=data.bookPhotos||{};data.bookPhotos[k.slice(7)]=localStorage.getItem(k);}
  });
  var json=JSON.stringify(data,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');var d=new Date();
  a.href=url;a.download='studyos_backup_'+d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  var ts=d.getFullYear()+'/'+p2(d.getMonth()+1)+'/'+p2(d.getDate())+' '+p2(d.getHours())+':'+p2(d.getMinutes());
  localStorage.setItem('sos5_lastExport',ts);renderBackupInfo();
  alert('エクスポートしました！\nJSONファイルを安全な場所に保存してください。');
}
function importData(ev){
  var file=ev.target.files[0];if(!file)return;
  if(!confirm('現在のデータにインポートで上書きされます。よろしいですか？'))return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(data.version===2&&data.main){
        localStorage.setItem('sos5',JSON.stringify(data.main));
        if(data.booklog)localStorage.setItem(BL_KEY,JSON.stringify(data.booklog));
        Object.keys(data.images||{}).forEach(function(id){localStorage.setItem('sos5i_'+id,data.images[id]);});
        Object.keys(data.pdfs||{}).forEach(function(id){localStorage.setItem('sos5p_'+id,data.pdfs[id]);});
        Object.keys(data.bookPhotos||{}).forEach(function(id){localStorage.setItem('sos5bp_'+id,data.bookPhotos[id]);});
      }else{localStorage.setItem('sos5',JSON.stringify(data));}
      alert('インポート完了！ページをリロードします。');location.reload();
    }catch(err){alert('読み込みに失敗しました。\n'+err.message);}
  };
  reader.readAsText(file);ev.target.value='';
}

// ────────────────────────────────────────
