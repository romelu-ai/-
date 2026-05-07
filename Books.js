// BOOKS (STUDY OS 互換層 — タイマーログ用)
// ────────────────────────────────────────
function openLogModal(id){
  S.logModalBookId=id;
  var b=getBook(id);
  if(!b)return;
  document.getElementById('logModalTitle').textContent='LOG: '+b.title;
  ['mMin','mProb','mPage','mNote'].forEach(function(i){document.getElementById(i).value=''});
  document.getElementById('logOverlay').classList.add('on');
}
function closeLogModal(){document.getElementById('logOverlay').classList.remove('on')}
function submitLog(){var mins=parseInt(document.getElementById('mMin').value)||0;if(mins<1){alert('時間を入力してください');return}addSession(S.logModalBookId,mins,parseInt(document.getElementById('mProb').value)||0,parseInt(document.getElementById('mPage').value)||0,document.getElementById('mNote').value.trim());closeLogModal();}

var bookPhotoModalId=null;
function openBookPhotoModal(id){bookPhotoModalId=id;var b=getBook(id);if(!b)return;document.getElementById('bookPhotoTitle').textContent='📷 '+b.title+' — 写真';renderBookPhotoGrid();document.getElementById('bookPhotoOverlay').classList.add('on');}
function closeBookPhotoModal(){document.getElementById('bookPhotoOverlay').classList.remove('on');bookPhotoModalId=null;document.getElementById('bookPhotoInput').value='';}
function renderBookPhotoGrid(){var b=getBook(bookPhotoModalId);if(!b)return;var imgs=b.photos||[];var el=document.getElementById('bookPhotoGrid');if(!imgs.length){el.innerHTML='<div style="font-family:var(--mono);font-size:.62rem;color:var(--txD);padding:12px 0;width:100%">// まだ写真がありません</div>';return;}el.innerHTML=imgs.map(function(src,i){return'<div style="position:relative;flex-shrink:0"><img src="'+src+'" style="width:110px;height:110px;object-fit:cover;border-radius:2px;border:1px solid var(--bdB);cursor:pointer;display:block" onclick="openLB(this.src)"><button data-bi="'+i+'" onclick="deleteBookPhoto(this.dataset.bi)" style="position:absolute;top:3px;right:3px;background:rgba(10,12,16,.8);border:1px solid var(--bdB);color:var(--txD);font-size:.7rem;cursor:pointer;border-radius:2px;padding:1px 5px;line-height:1.4">&#215;</button></div>';}).join('');}
function deleteBookPhoto(idx){var b=getBook(bookPhotoModalId);if(!b)return;b.photos=b.photos||[];b.photos.splice(parseInt(idx),1);saveBookPhotos(bookPhotoModalId,b.photos);save();renderBookPhotoGrid();}
function onBookPhotoAdded(ev){var files=Array.from(ev.target.files);var b=getBook(bookPhotoModalId);if(!b)return;b.photos=b.photos||[];var pending=files.length;files.forEach(function(f){var r=new FileReader();r.onload=function(e){b.photos.push(e.target.result);pending--;if(pending===0){saveBookPhotos(bookPhotoModalId,b.photos);save();renderBookPhotoGrid();}};r.readAsDataURL(f);});ev.target.value='';}
function saveBookPhotos(id,photos){try{localStorage.setItem('sos5bp_'+id,JSON.stringify(photos));}catch(e){}}
function loadBookPhotos(){S.books.forEach(function(b){try{var raw=localStorage.getItem('sos5bp_'+b.id);b.photos=raw?JSON.parse(raw):[];}catch(e){b.photos=[];}});}

// ────────────────────────────────────────
// BOOKLOG — BOOKS PAGE
// ────────────────────────────────────────
var blPendingCover=null;
var blActiveUnit={}; // { bookId: unitName | null }

function blBuildPresets(){
  var bar=document.getElementById('bl-preset-bar');
  if(!bar)return;
  bar.innerHTML='';
  BL_PRESETS.forEach(function(p){
    var chip=document.createElement('button');
    chip.className='preset-chip';
    chip.textContent=p.title+(p.series?' ('+p.series+')':'');
    chip.addEventListener('click',function(){
      document.getElementById('blTitle').value=p.title;
      document.getElementById('blSubj').value=p.subject;
      document.getElementById('blTotalP').value=p.totalPage||'';
      document.getElementById('blTotalQ').value=p.totalProb||'';
      document.getElementById('blAddForm').classList.add('on');
    });
    bar.appendChild(chip);
  });
}

function blOpenAdd(){
  document.getElementById('blEditId').value='';
  document.getElementById('blFormTitle').textContent='NEW BOOK';
  document.getElementById('blSubmitBtn').textContent='✓ 追加';
  ['blTitle','blSubj','blTotalP','blTotalQ','blNote'].forEach(function(i){document.getElementById(i).value='';});
  blResetCover();
  document.getElementById('blAddForm').classList.add('on');
  document.getElementById('blAddForm').scrollIntoView({behavior:'smooth',block:'start'});
}
function blOpenEdit(id){
  var b=blBooks.find(function(x){return x.id===id});if(!b)return;
  document.getElementById('blEditId').value=id;
  document.getElementById('blFormTitle').textContent='EDIT BOOK';
  document.getElementById('blSubmitBtn').textContent='✓ 更新';
  document.getElementById('blTitle').value=b.title||'';
  document.getElementById('blSubj').value=b.subject||'';
  document.getElementById('blTotalP').value=b.totalPage||'';
  document.getElementById('blTotalQ').value=b.totalProb||'';
  document.getElementById('blNote').value=b.memo||'';
  if(b.coverImage)blSetCover(b.coverImage);else blResetCover();
  document.getElementById('blAddForm').classList.add('on');
  document.getElementById('blAddForm').scrollIntoView({behavior:'smooth',block:'start'});
}
function blCloseForm(){document.getElementById('blAddForm').classList.remove('on');}
function blResetCover(){
  blPendingCover=null;
  var wrap=document.getElementById('blCoverWrap');
  if(!wrap)return;
  wrap.innerHTML='<div id="blCoverEmpty" style="font-family:var(--mono);font-size:.58rem;color:var(--txD)">&#128247; クリックして書影を追加</div><input type="file" id="blCoverInput" accept="image/*" style="position:absolute;top:0;right:0;bottom:0;left:0;opacity:0;cursor:pointer">';
  blBindCover();
}
function blSetCover(url){
  blPendingCover=url;
  var wrap=document.getElementById('blCoverWrap');
  if(!wrap)return;
  wrap.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;display:block"><input type="file" id="blCoverInput" accept="image/*" style="position:absolute;top:0;right:0;bottom:0;left:0;opacity:0;cursor:pointer">';
  blBindCover();
}
function blBindCover(){
  var inp=document.getElementById('blCoverInput');
  if(!inp)return;
  inp.addEventListener('change',function(e){
    var f=e.target.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(ev){blSetCover(ev.target.result);};r.readAsDataURL(f);
  });
}
function blSubmit(){
  var title=document.getElementById('blTitle').value.trim();if(!title){alert('タイトルを入力してください');return;}
  var editId=document.getElementById('blEditId').value;
  var data={title:title,subject:document.getElementById('blSubj').value.trim(),totalPage:parseInt(document.getElementById('blTotalP').value)||0,totalProb:parseInt(document.getElementById('blTotalQ').value)||0,memo:document.getElementById('blNote').value.trim()};
  if(blPendingCover!==null)data.coverImage=blPendingCover;
  if(editId){blBooks=blBooks.map(function(b){if(b.id!==editId)return b;return Object.assign({},b,data);});}
  else{var bulkKey=blFindBulkKey(title);data.id=uid();data.currentPage=0;data.solvedProb=0;data.problems=bulkKey?JSON.parse(JSON.stringify(BL_BULK[bulkKey])):[];data.logs=[];blBooks.push(data);}
  blSave();blCloseForm();blRenderGrid();refreshBookSelects();refreshEvBookSelect();
}
function blDeleteBook(id){
  if(!confirm('この参考書を削除しますか？'))return;
  blBooks=blBooks.filter(function(b){return b.id!==id});
  blSave();blRenderGrid();refreshBookSelects();refreshEvBookSelect();
}

function blRenderGrid(){
  var grid=document.getElementById('blGrid');
  if(!blBooks.length){
    grid.innerHTML='<div style="font-family:var(--mono);font-size:.65rem;color:var(--txD);padding:16px 0">// まだ参考書が登録されていません。「&#43; 参考書を追加」か上のプリセットから追加してください。</div>';
    return;
  }
  grid.innerHTML=blBooks.map(function(book){
    var pagePct=blPct(book.currentPage||0,book.totalPage||0);
    var probPct=blPct(book.solvedProb||0,book.totalProb||0);
    var probs=book.problems||[];
    var solved=probs.filter(function(p){return p.checks&&p.checks[0]&&p.checks[0]!==''}).length;
    var logs=book.logs||[];

    var coverHtml='';
    if(book.coverImage){
      coverHtml='<div class="bcard-cover"><img src="'+book.coverImage+'" alt="書影"><input type="file" accept="image/*" data-bl-cover="'+book.id+'"></div>';
    }else{
      coverHtml='<div class="bcard-cover"><span class="bcard-cover-empty">&#128218;</span><input type="file" accept="image/*" data-bl-cover="'+book.id+'"></div>';
    }

    var pageBar=book.totalPage>0?'<div class="bprog-wrap"><div class="bprog-lbl"><span>PAGE</span><span>'+(book.currentPage||0)+'/'+book.totalPage+'p</span></div><div class="btrack"><div class="btrack-fill" style="width:'+pagePct+'%"></div></div></div>':'';
    var probBar=book.totalProb>0?'<div class="bprog-wrap"><div class="bprog-lbl"><span>PROBLEMS</span><span>'+(book.solvedProb||0)+'/'+book.totalProb+'問</span></div><div class="btrack"><div class="btrack-fill" style="width:'+probPct+'%"></div></div></div>':'';

    return '<div class="bcard" id="blcard_'+book.id+'">'
      +'<div class="bcard-hd">'
      +coverHtml
      +'<div style="flex:1;min-width:0">'
      +'<div class="bcard-title">'+esc(book.title)+'</div>'
      +(book.subject?'<span class="bcard-tag">'+esc(book.subject)+'</span>':'')
      +'</div>'
      +'<div style="display:flex;gap:5px;flex-shrink:0">'
      +'<button class="btn bc" style="font-size:.55rem;padding:3px 8px" data-bid="'+book.id+'" onclick="blToggleDetail(this.dataset.bid)">&#9660; 詳細</button>'
      +'<button class="btn bd2" style="font-size:.55rem;padding:3px 8px" data-bid="'+book.id+'" onclick="blOpenEdit(this.dataset.bid)">編集</button>'
      +'<button class="btn bdanger" style="font-size:.55rem;padding:3px 7px" data-bid="'+book.id+'" onclick="blDeleteBook(this.dataset.bid)">&#215;</button>'
      +'</div>'
      +'</div>'
      +'<div class="bcard-body">'
      +'<div class="bstats">'
      +'<div class="bstat"><div class="bstat-v">'+pagePct+'%</div><div class="bstat-l">PAGE</div></div>'
      +'<div class="bstat"><div class="bstat-v">'+probPct+'%</div><div class="bstat-l">PROB</div></div>'
      +'<div class="bstat"><div class="bstat-v" style="color:var(--gn)">'+solved+'</div><div class="bstat-l">CHECKED</div></div>'
      +'<div class="bstat"><div class="bstat-v" style="color:var(--or)">'+logs.length+'</div><div class="bstat-l">LOGS</div></div>'
      +'</div>'
      +pageBar+probBar
      +(book.memo?'<div style="font-size:.65rem;color:var(--txD);margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:italic">'+esc(book.memo)+'</div>':'')
      +'</div>'
      +'<div class="bl-detail" id="bldet_'+book.id+'">'
      +blRenderDetail(book)
      +'</div>'
      +'</div>';
  }).join('');

  // 書影アップロード
  document.querySelectorAll('[data-bl-cover]').forEach(function(inp){
    inp.addEventListener('change',function(e){
      var f=e.target.files[0];if(!f)return;
      var bid=inp.dataset.blCover;
      var b=blBooks.find(function(x){return x.id===bid});if(!b)return;
      var r=new FileReader();r.onload=function(ev){b.coverImage=ev.target.result;blSave();blRenderGrid();};r.readAsDataURL(f);
    });
  });

  // checkbox
  document.querySelectorAll('.check-box').forEach(function(box){
    box.addEventListener('click',function(){
      var bid=box.closest('.bcard').id.replace('blcard_','');
      var b=blBooks.find(function(x){return x.id===bid});if(!b)return;
      var pi=parseInt(box.dataset.pi);var ri=parseInt(box.dataset.ri);
      var p=b.problems[pi];if(!p)return;
      if(!p.checks)p.checks=['','',''];while(p.checks.length<3)p.checks.push('');
      p.checks[ri]=blCycleCheck(p.checks[ri]);
      b.solvedProb=b.problems.filter(function(x){return x.checks&&x.checks[0]&&x.checks[0]!==''}).length;
      blSave();
      // re-render just the detail panel
      var detEl=document.getElementById('bldet_'+bid);
      if(detEl&&detEl.classList.contains('on'))detEl.innerHTML=blRenderDetail(b);
      blReattachDetailEvents(bid);
    });
  });

  // prob-num-btn (detail panel toggle)
  document.querySelectorAll('[data-open-pd]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var pi=btn.dataset.openPd;
      var row=document.getElementById('pd-row-'+pi+'_'+btn.closest('.bcard').id.replace('blcard_',''));
      if(!row)return;
      var isOpen=row.style.display!=='none';
      btn.closest('.prob-list').querySelectorAll('.pd-row').forEach(function(r){r.style.display='none';});
      if(!isOpen)row.style.display='';
    });
  });
}

function blPct(v,t){if(!t)return 0;return Math.min(100,Math.round(v/t*100));}
function blCycleCheck(v){if(!v||v==='')return'ok';if(v==='ok')return'ng';if(v==='ng')return'sk';return'';}
function blCheckIcon(v){if(v==='ok')return'○';if(v==='ng')return'✕';if(v==='sk')return'△';return'';}

function blToggleDetail(id){
  var el=document.getElementById('bldet_'+id);
  if(!el)return;
  if(el.classList.contains('on')){
    el.classList.remove('on');
    blActiveUnit[id]=null; // 閉じたらリセット
    return;
  }
  var b=blBooks.find(function(x){return x.id===id});if(!b)return;
  blActiveUnit[id]=null; // 開くときは必ず目次から
  el.innerHTML=blRenderDetail(b);
  el.classList.add('on');
  blReattachDetailEvents(id);
}

function blRenderDetail(book){
  var pagePct=blPct(book.currentPage||0,book.totalPage||0);
  var probPct=blPct(book.solvedProb||0,book.totalProb||0);
  var probs=book.problems||[];
  var units=[],unitMap={};
  probs.forEach(function(p,i){var u=p.unit||'未分類';if(!unitMap[u]){unitMap[u]=[];units.push(u);}unitMap[u].push({p:p,i:i});});

  // progress
  var pageBox=book.totalPage>0
    ?'<div class="big-prog-box"><div class="big-prog-label">PAGE</div><div class="big-prog-nums">'+(book.currentPage||0)+'<span>/'+book.totalPage+'p</span></div><div class="big-prog-pct" style="color:var(--cy)">'+pagePct+'%</div><div class="btrack" style="margin-bottom:6px"><div class="btrack-fill" style="width:'+pagePct+'%"></div></div><div class="update-row"><input class="inp" id="blpi_'+book.id+'" type="number" min="0" max="'+book.totalPage+'" value="'+(book.currentPage||0)+'" style="font-size:.65rem;padding:4px 7px"><button class="btn-update" data-bid="'+book.id+'" data-type="page">更新</button></div></div>'
    :'<div class="big-prog-box" style="opacity:.4"><div class="big-prog-label">PAGE</div><div style="font-family:var(--mono);font-size:.6rem;color:var(--txD)">未設定</div></div>';
  var probBox=book.totalProb>0
    ?'<div class="big-prog-box"><div class="big-prog-label">PROBLEMS</div><div class="big-prog-nums">'+(book.solvedProb||0)+'<span>/'+book.totalProb+'問</span></div><div class="big-prog-pct" style="color:var(--gn)">'+probPct+'%</div><div class="btrack" style="margin-bottom:6px"><div class="btrack-fill" style="width:'+probPct+'%"></div></div><div class="update-row"><input class="inp" id="blqi_'+book.id+'" type="number" min="0" max="'+book.totalProb+'" value="'+(book.solvedProb||0)+'" style="font-size:.65rem;padding:4px 7px"><button class="btn-update" data-bid="'+book.id+'" data-type="prob">更新</button></div></div>'
    :'<div class="big-prog-box" style="opacity:.4"><div class="big-prog-label">PROBLEMS</div><div style="font-family:var(--mono);font-size:.6rem;color:var(--txD)">未設定</div></div>';

  // ── CHECK TABLE セクション ──
  var checkSection='';
  if(!probs.length){
    checkSection='<div style="font-family:var(--mono);font-size:.6rem;color:var(--txD);padding:8px 0">// 問題データなし</div>';
  } else {
    var activeUnit=blActiveUnit[book.id]||null;

    if(!activeUnit){
      // ── 目次モード ──
      var tocRows=units.map(function(u){
        var items=unitMap[u];
        var total=items.length;
        var done=items.filter(function(it){return it.p.checks&&it.p.checks[0]&&it.p.checks[0]!==''}).length;
        var pct=total>0?Math.round(done/total*100):0;
        var okCnt  =items.filter(function(it){return it.p.checks&&it.p.checks[0]==='ok'}).length;
        var ngCnt  =items.filter(function(it){return it.p.checks&&it.p.checks[0]==='ng'}).length;
        var skCnt  =items.filter(function(it){return it.p.checks&&it.p.checks[0]==='sk'}).length;
        return '<div class="bl-toc-row" data-unit="'+esc(u)+'" data-bid="'+book.id+'">'
          +'<div class="bl-toc-left">'
          +'<span class="bl-toc-arrow">▸</span>'
          +'<span class="bl-toc-name">'+esc(u)+'</span>'
          +'</div>'
          +'<div class="bl-toc-right">'
          +'<div class="bl-toc-badges">'
          +(okCnt?'<span class="bl-badge ok">○'+okCnt+'</span>':'')
          +(ngCnt?'<span class="bl-badge ng">✕'+ngCnt+'</span>':'')
          +(skCnt?'<span class="bl-badge sk">△'+skCnt+'</span>':'')
          +'</div>'
          +'<div class="bl-toc-prog">'
          +'<div class="bl-toc-pct">'+pct+'%</div>'
          +'<div class="btrack" style="width:80px"><div class="btrack-fill" style="width:'+pct+'%"></div></div>'
          +'<span style="font-family:var(--mono);font-size:.55rem;color:var(--txD);margin-left:5px">'+done+'/'+total+'</span>'
          +'</div>'
          +'</div>'
          +'</div>';
      }).join('');
      checkSection='<div class="bl-toc-wrap" id="bltoc_'+book.id+'">'+tocRows+'</div>';

    } else {
      // ── 問題一覧モード（章でフィルタ） ──
      var probRows='';
      var filteredItems=unitMap[activeUnit]||[];
      // unit-header（戻るボタン付き）
      probRows+='<div class="prob-row unit-header" data-unit-name="'+esc(activeUnit)+'">'
        +'<button class="bl-back-btn" data-bid="'+book.id+'" style="font-family:var(--mono);font-size:.6rem;padding:2px 7px;border:1px solid var(--cy);background:none;color:var(--cy);cursor:pointer;border-radius:2px;margin-right:6px;flex-shrink:0">◀ 目次</button>'
        +'<span class="unit-label">'+esc(activeUnit)+'</span>'
        +'<input class="unit-edit-input inp" data-unit="'+esc(activeUnit)+'" value="'+esc(activeUnit)+'" style="display:none">'
        +'</div>';
      filteredItems.forEach(function(item){
        var p=item.p;var i=item.i;
        var checks=p.checks||['','',''];while(checks.length<3)checks.push('');
        var cells='';for(var r=0;r<3;r++){var cv=checks[r]||'';cells+='<div class="check-box '+cv+'" data-pi="'+i+'" data-ri="'+r+'">'+blCheckIcon(cv)+'</div>';}
        var hasNote=!!(p.memo||p.score||(p.tags&&p.tags.length));
        var uid2=i+'_'+book.id;
        probRows+='<div class="prob-row" data-prob-row="'+i+'">'
          +'<div class="drag-handle" data-drag-pi="'+i+'">⠿</div>'
          +'<div class="prob-num-cell"><button class="prob-num-btn'+(hasNote?' has-note':'')+'" data-open-pd="'+i+'">'+esc(p.num)+'</button></div>'
          +'<div class="prob-page-cell">'+(p.page?'p.'+p.page:'')+'</div>'
          +'<div class="prob-checks-cell">'+cells+'</div>'
          +'<div class="prob-del-cell"><button class="prob-del" data-pi="'+i+'">✕</button></div>'
          +'</div>'
          +'<div class="pd-row" id="pd-row-'+uid2+'" style="display:none">'
          +blRenderProbDetail(p,i,book.id)
          +'</div>';
      });
      checkSection='<div class="check-table-wrap"><div class="prob-list" id="blpl_'+book.id+'">'+probRows+'</div></div>';
    }
  }

  // logs
  var logItems='';
  var logs=(book.logs||[]).slice().reverse();
  logs.forEach(function(log,ri){var i=(book.logs.length-1)-ri;logItems+='<div class="log-item"><span style="flex-shrink:0;color:var(--txD)">'+log.date+'</span><span class="log-note">'+esc(log.note)+'</span><button class="log-del" data-li="'+i+'">✕</button></div>';});

  return '<div class="bl-section-title">PROGRESS</div>'
    +'<div class="big-progress">'+pageBox+probBox+'</div>'
    +'<div class="bl-section-title" style="display:flex;align-items:center;gap:8px">CHECK TABLE'
    +(blActiveUnit[book.id]?'<button class="prob-edit-btn" id="bledit_'+book.id+'">✎ 編集モード</button>':'')
    +'</div>'
    +'<div class="check-legend"><span><span class="leg-dot" style="background:rgba(0,255,157,.2);border-color:#00ff9d"></span>○ 正解</span><span><span class="leg-dot" style="background:rgba(255,60,90,.2);border-color:#ff3c5a"></span>✕ 不正解</span><span><span class="leg-dot" style="background:rgba(255,209,102,.15);border-color:#ffd166"></span>△ 要復習</span></div>'
    +checkSection
    +'<div class="add-prob-section" style="margin-top:10px"><div class="add-prob-title">▸ 問題を追加（上書き）</div>'
    +'<div class="add-prob-row">'
    +'<input class="inp" id="np-unit_'+book.id+'" placeholder="単元名" style="font-size:.65rem">'
    +'<div class="add-prob-row-inner">'
    +'<input class="inp" id="np-pre_'+book.id+'" placeholder="接頭辞" style="font-size:.65rem">'
    +'<input class="inp" id="np-from_'+book.id+'" type="number" placeholder="開始" style="font-size:.65rem">'
    +'<span style="font-family:var(--mono);font-size:.8rem;color:var(--txD);align-self:center;flex-shrink:0">〜</span>'
    +'<input class="inp" id="np-to_'+book.id+'" type="number" placeholder="終了" style="font-size:.65rem">'
    +'</div>'
    +'<button class="btn-add-prob" data-bid="'+book.id+'">＋ 追加</button>'
    +'</div></div>'
    +'<div class="bl-section-title" style="margin-top:14px">STUDY LOG</div>'
    +'<div class="log-list">'+(logItems||'<div class="log-empty">ログなし</div>')+'</div>'
    +'<div class="log-add-row"><input class="inp" id="bllog_'+book.id+'" placeholder="例: p.120-140 完了" style="font-size:.65rem"><button class="btn-log" data-bid="'+book.id+'">記録</button></div>'
    +'<div class="bl-section-title" style="margin-top:14px">MEMO</div>'
    +'<div class="memo-display" id="blmemo_'+book.id+'">'+(esc(book.memo)||'<span style="opacity:.4">メモなし</span>')+'</div>'
    +'<textarea class="inp" id="bltarea_'+book.id+'" style="display:none;margin-top:6px;min-height:80px;font-size:.65rem;resize:vertical">'+esc(book.memo||'')+'</textarea>'
    +'<div style="display:flex;gap:6px;margin-top:6px"><button class="btn bd2" id="blmemoedit_'+book.id+'" style="font-size:.58rem;padding:4px 10px">編集</button><button class="btn-update" id="blmemosave_'+book.id+'" style="display:none" data-bid="'+book.id+'">保存</button></div>';
}

function blRenderProbDetail(p,i,bid){
  var score=p.score||0;
  var stars='';for(var s=1;s<=5;s++)stars+='<span class="score-star'+(s<=score?' lit':'')+'" data-star="'+s+'" data-pi="'+i+'" data-bid="'+bid+'">★</span>';
  var tags=p.tags||[];
  var tagHtml=BL_MISTAKE_TAGS.map(function(t){return'<span class="pd-tag'+(tags.indexOf(t)!==-1?' selected':'')+'" data-tag="'+esc(t)+'" data-pi="'+i+'" data-bid="'+bid+'">'+esc(t)+'</span>';}).join('');
  return '<div class="prob-detail-panel">'
    +'<div class="pd-title">// '+esc(p.num)+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'
    +'<div><div class="flbl">問題番号</div><input class="inline-edit-input" data-field="num" data-pi="'+i+'" data-bid="'+bid+'" value="'+esc(p.num||'')+'"></div>'
    +'<div><div class="flbl">ページ</div><input class="inline-edit-input" data-field="page" data-pi="'+i+'" data-bid="'+bid+'" value="'+esc(p.page||'')+'"></div>'
    +'</div>'
    +'<div style="margin-bottom:8px"><div class="flbl">単元名</div><input class="inline-edit-input" data-field="unit" data-pi="'+i+'" data-bid="'+bid+'" value="'+esc(p.unit||'')+'"></div>'
    +'<div class="pd-score-row"><label>理解度</label><div class="score-stars">'+stars+'</div><span style="font-family:var(--mono);font-size:.55rem;color:var(--txD);margin-left:4px">'+(score?score+'/5':'未評価')+'</span></div>'
    +'<div class="flbl" style="margin-bottom:5px">間違いパターン</div>'
    +'<div class="pd-mistake-tags">'+tagHtml+'</div>'
    +'<div class="flbl" style="margin-bottom:4px">メモ</div>'
    +'<textarea class="pd-memo-area" data-pi="'+i+'" data-bid="'+bid+'">'+esc(p.memo||'')+'</textarea>'
    +'<div class="pd-actions">'
    +'<button class="pd-close-btn" data-close-pd="'+i+'" data-bid="'+bid+'">閉じる</button>'
    +'<button class="pd-save" data-save-pd="'+i+'" data-bid="'+bid+'">保存</button>'
    +'</div></div>';
}

function blReattachDetailEvents(bid){
  var det=document.getElementById('bldet_'+bid);
  if(!det)return;
  var b=blBooks.find(function(x){return x.id===bid});if(!b)return;

  // ── 目次行クリック → 章を選択 ──
  det.querySelectorAll('.bl-toc-row').forEach(function(row){
    row.addEventListener('click',function(){
      blActiveUnit[bid]=row.dataset.unit;
      det.innerHTML=blRenderDetail(b);
      det.classList.add('on');
      blReattachDetailEvents(bid);
    });
  });

  // ── 「◀ 目次」戻るボタン ──
  det.querySelectorAll('.bl-back-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      blActiveUnit[bid]=null;
      det.innerHTML=blRenderDetail(b);
      det.classList.add('on');
      blReattachDetailEvents(bid);
    });
  });

  // progress update
  det.querySelectorAll('.btn-update').forEach(function(btn){
    btn.addEventListener('click',function(){
      var b2=blBooks.find(function(x){return x.id===btn.dataset.bid});if(!b2)return;
      if(btn.dataset.type==='page'){var v=parseInt(document.getElementById('blpi_'+bid).value)||0;b2.currentPage=Math.min(v,b2.totalPage);}
      if(btn.dataset.type==='prob'){var v2=parseInt(document.getElementById('blqi_'+bid).value)||0;b2.solvedProb=Math.min(v2,b2.totalProb);}
      blSave();blRenderGrid();var el=document.getElementById('bldet_'+bid);if(el){el.innerHTML=blRenderDetail(b2);el.classList.add('on');blReattachDetailEvents(bid);}
    });
  });

  // checkboxes
  det.querySelectorAll('.check-box').forEach(function(box){
    box.addEventListener('click',function(){
      var pi=parseInt(box.dataset.pi);var ri=parseInt(box.dataset.ri);
      var p=b.problems[pi];if(!p)return;
      if(!p.checks)p.checks=['','',''];while(p.checks.length<3)p.checks.push('');
      p.checks[ri]=blCycleCheck(p.checks[ri]);
      b.solvedProb=b.problems.filter(function(x){return x.checks&&x.checks[0]&&x.checks[0]!==''}).length;
      blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);
    });
  });

  // prob-num open
  det.querySelectorAll('[data-open-pd]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var pi=btn.dataset.openPd;
      var rowId='pd-row-'+pi+'_'+bid;
      var row=document.getElementById(rowId);if(!row)return;
      var isOpen=row.style.display!=='none';
      det.querySelectorAll('.pd-row').forEach(function(r){r.style.display='none';});
      if(!isOpen)row.style.display='';
    });
  });

  // pd close
  det.querySelectorAll('[data-close-pd]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var row=document.getElementById('pd-row-'+btn.dataset.closePd+'_'+bid);
      if(row)row.style.display='none';
    });
  });

  // stars
  det.querySelectorAll('.score-star').forEach(function(star){
    star.addEventListener('click',function(){
      var pi=parseInt(star.dataset.pi);var val=parseInt(star.dataset.star);
      var p=b.problems[pi];if(!p)return;
      p.score=(p.score===val)?0:val;
      blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);
    });
  });

  // tags
  det.querySelectorAll('.pd-tag').forEach(function(tag){
    tag.addEventListener('click',function(){
      var pi=parseInt(tag.dataset.pi);var p=b.problems[pi];if(!p)return;
      if(!p.tags)p.tags=[];var t=tag.dataset.tag;var idx=p.tags.indexOf(t);
      if(idx===-1)p.tags.push(t);else p.tags.splice(idx,1);
      blSave();tag.classList.toggle('selected',p.tags.indexOf(t)!==-1);
    });
  });

  // pd save
  det.querySelectorAll('[data-save-pd]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var pi=parseInt(btn.dataset.savePd);var p=b.problems[pi];if(!p)return;
      var panel=det.querySelector('.prob-detail-panel');
      if(!panel)return;
      var ni=panel.querySelector('[data-field="num"]');var pgi=panel.querySelector('[data-field="page"]');var ui=panel.querySelector('[data-field="unit"]');var ma=panel.querySelector('.pd-memo-area');
      if(ni)p.num=ni.value.trim()||p.num;if(pgi)p.page=pgi.value.trim();if(ui)p.unit=ui.value.trim()||p.unit;if(ma)p.memo=ma.value.trim();
      blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);
    });
  });

  // prob del
  det.querySelectorAll('.prob-del').forEach(function(btn){
    btn.addEventListener('click',function(){
      b.problems.splice(parseInt(btn.dataset.pi),1);
      b.totalProb=b.problems.length;
      blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);
    });
  });

  // add prob
  var addBtn=det.querySelector('.btn-add-prob');
  if(addBtn){
    addBtn.addEventListener('click',function(){
      var unit=document.getElementById('np-unit_'+bid).value.trim()||'未分類';
      var prefix=document.getElementById('np-pre_'+bid).value.trim();
      var from=parseInt(document.getElementById('np-from_'+bid).value);
      var to=parseInt(document.getElementById('np-to_'+bid).value);
      if(isNaN(from)){alert('開始番号を入力してください');return;}
      if(isNaN(to))to=from;if(to<from){alert('終了番号は開始番号以上');return;}if(to-from>500){alert('一度に500問まで');return;}
      b.problems=b.problems.filter(function(p){return p.unit!==unit;});
      for(var n=from;n<=to;n++)b.problems.push({unit:unit,num:prefix+n,checks:['','','']});
      b.totalProb=b.problems.length;
      blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);
    });
  }

  // log add
  var logBtn=det.querySelector('.btn-log');
  if(logBtn){
    logBtn.addEventListener('click',function(){
      var inp=document.getElementById('bllog_'+bid);var note=inp?inp.value.trim():'';if(!note)return;
      if(!b.logs)b.logs=[];
      var now=new Date();var d=now.getFullYear()+'/'+p2(now.getMonth()+1)+'/'+p2(now.getDate())+' '+p2(now.getHours())+':'+p2(now.getMinutes());
      b.logs.push({date:d,note:note});blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);
    });
  }

  // log del
  det.querySelectorAll('.log-del').forEach(function(btn){
    btn.addEventListener('click',function(){b.logs.splice(parseInt(btn.dataset.li),1);blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);});
  });

  // memo edit/save
  var memoEditBtn=document.getElementById('blmemoedit_'+bid);
  var memoSaveBtn=document.getElementById('blmemosave_'+bid);
  var memoDisp=document.getElementById('blmemo_'+bid);
  var memoTa=document.getElementById('bltarea_'+bid);
  if(memoEditBtn){memoEditBtn.addEventListener('click',function(){if(memoDisp)memoDisp.style.display='none';if(memoTa)memoTa.style.display='';if(memoEditBtn)memoEditBtn.style.display='none';if(memoSaveBtn)memoSaveBtn.style.display='inline-block';});}
  if(memoSaveBtn){memoSaveBtn.addEventListener('click',function(){b.memo=memoTa?memoTa.value.trim():'';blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);});}

  // edit mode & drag
  var editBtn=document.getElementById('bledit_'+bid);
  var probList=document.getElementById('blpl_'+bid);
  var isEditMode=false;
  if(editBtn&&probList){
    editBtn.addEventListener('click',function(){
      isEditMode=!isEditMode;
      editBtn.textContent=isEditMode?'✓ 完了':'✎ 編集モード';
      editBtn.classList.toggle('active',isEditMode);
      probList.classList.toggle('edit-mode',isEditMode);
      probList.querySelectorAll('.unit-header').forEach(function(hdr){
        var lbl=hdr.querySelector('.unit-label');var inp=hdr.querySelector('.unit-edit-input');
        if(!lbl||!inp)return;
        if(isEditMode){lbl.style.display='none';inp.style.display='';}
        else{
          var oldU=inp.dataset.unit;var newU=inp.value.trim()||oldU;
          if(newU!==oldU){b.problems.forEach(function(pr){if(pr.unit===oldU)pr.unit=newU;});blSave();}
          lbl.style.display='';inp.style.display='none';
        }
      });
      if(isEditMode)det.querySelectorAll('.pd-row').forEach(function(r){r.style.display='none';});
    });

    // drag
    var dragSrcPi=null,dragGhost=null,dragOverEl=null;
    function mkGhost(txt,x,y){var g=document.createElement('div');g.className='drag-ghost';g.textContent=txt;g.style.left=(x+16)+'px';g.style.top=(y-20)+'px';document.body.appendChild(g);return g;}
    function mvGhost(x,y){if(!dragGhost)return;dragGhost.style.left=(x+16)+'px';dragGhost.style.top=(y-20)+'px';}
    function rmGhost(){if(dragGhost){dragGhost.remove();dragGhost=null;}}
    function clrOver(){if(dragOverEl){dragOverEl.classList.remove('drag-over');dragOverEl=null;}}
    function getPi(row){return parseInt(row.dataset.probRow);}
    function findDrop(x,y){var els=probList.querySelectorAll('.prob-row[data-prob-row],.prob-row.unit-header');for(var i=0;i<els.length;i++){var rc=els[i].getBoundingClientRect();if(y>=rc.top&&y<=rc.bottom)return els[i];}return null;}
    function getUnitBefore(el){var cur=el.previousElementSibling;while(cur){if(cur.classList.contains('unit-header')){var ui=cur.querySelector('.unit-edit-input');return ui?(ui.value.trim()||ui.dataset.unit):(cur.dataset.unitName||b.problems[dragSrcPi].unit);}if(cur.dataset.probRow!==undefined){var pi2=getPi(cur);if(pi2!==dragSrcPi)return b.problems[pi2].unit;}cur=cur.previousElementSibling;}var fh2=probList.querySelector('.prob-row.unit-header');if(fh2){var ui2=fh2.querySelector('.unit-edit-input');return ui2?(ui2.value.trim()||ui2.dataset.unit):(fh2.dataset.unitName||b.problems[dragSrcPi].unit);}return b.problems[dragSrcPi].unit;}
    function doDrop(dropEl){if(!dropEl||dragSrcPi===null)return;var item=b.problems[dragSrcPi];if(dropEl.classList.contains('unit-header')){var ui3=dropEl.querySelector('.unit-edit-input');var nu=ui3?(ui3.value.trim()||ui3.dataset.unit):dropEl.dataset.unitName;var ns=dropEl.nextElementSibling;var ins=null;while(ns){if(ns.dataset.probRow!==undefined){ins=getPi(ns);break;}if(ns.classList.contains('unit-header'))break;ns=ns.nextElementSibling;}b.problems.splice(dragSrcPi,1);item.unit=nu;if(ins!==null){var adj=ins>dragSrcPi?ins-1:ins;b.problems.splice(adj,0,item);}else b.problems.push(item);}else{var tpi=getPi(dropEl);if(tpi===dragSrcPi){dragSrcPi=null;return;}var nu2=getUnitBefore(dropEl);b.problems.splice(dragSrcPi,1);var adj2=tpi>dragSrcPi?tpi-1:tpi;item.unit=nu2;b.problems.splice(adj2,0,item);}dragSrcPi=null;blSave();det.innerHTML=blRenderDetail(b);det.classList.add('on');blReattachDetailEvents(bid);}

    probList.addEventListener('touchstart',function(e){if(!isEditMode)return;var h=e.target.closest('.drag-handle');if(!h)return;var row=h.closest('.prob-row[data-prob-row]');if(!row)return;dragSrcPi=getPi(row);row.classList.add('dragging');var t=e.touches[0];dragGhost=mkGhost(b.problems[dragSrcPi].num,t.clientX,t.clientY);e.preventDefault();},{passive:false});
    probList.addEventListener('touchmove',function(e){if(dragSrcPi===null)return;var t=e.touches[0];mvGhost(t.clientX,t.clientY);var tgt=findDrop(t.clientX,t.clientY);clrOver();if(tgt){var tpi=tgt.dataset.probRow!==undefined?getPi(tgt):-1;if(tpi!==dragSrcPi){dragOverEl=tgt;tgt.classList.add('drag-over');}}e.preventDefault();},{passive:false});
    probList.addEventListener('touchend',function(e){if(dragSrcPi===null)return;var t=e.changedTouches[0];rmGhost();clrOver();var sr=probList.querySelector('.prob-row.dragging');if(sr)sr.classList.remove('dragging');doDrop(findDrop(t.clientX,t.clientY));},{passive:false});
    probList.addEventListener('mousedown',function(e){if(!isEditMode)return;var h=e.target.closest('.drag-handle');if(!h)return;var row=h.closest('.prob-row[data-prob-row]');if(!row)return;dragSrcPi=getPi(row);row.classList.add('dragging');dragGhost=mkGhost(b.problems[dragSrcPi].num,e.clientX,e.clientY);e.preventDefault();
      function onMv(ev){mvGhost(ev.clientX,ev.clientY);var tgt=findDrop(ev.clientX,ev.clientY);clrOver();if(tgt){var tpi=tgt.dataset.probRow!==undefined?getPi(tgt):-1;if(tpi!==dragSrcPi){dragOverEl=tgt;tgt.classList.add('drag-over');}}}
      function onUp(ev){document.removeEventListener('mousemove',onMv);document.removeEventListener('mouseup',onUp);rmGhost();clrOver();var sr=probList.querySelector('.prob-row.dragging');if(sr)sr.classList.remove('dragging');doDrop(findDrop(ev.clientX,ev.clientY));}
      document.addEventListener('mousemove',onMv);document.addEventListener('mouseup',onUp);
    });
  }
}

// ────────────────────────────────────────
