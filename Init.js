// INIT
// ────────────────────────────────────────
load();
blLoad();
ghLoadSettings();
ghWrapSave();
loadBookPhotos();
blBuildPresets();
blBindCover();
tick();setInterval(tick,15000);
refreshBookSelects();refreshEvBookSelect();
renderTimerStats();renderTodayLog();setRing(1);
document.getElementById('goalInp').value=S.goalH;
addExSubjRow();
initCal();
renderHome();
document.getElementById('tab-home').classList.add('on');
if(document.getElementById('memoTa'))document.getElementById('memoTa').value=S.memo;

document.getElementById('calOverlay').addEventListener('click',function(e){if(e.target===this)closeCalModal()});
document.getElementById('logOverlay').addEventListener('click',function(e){if(e.target===this)closeLogModal()});
document.getElementById('bookPhotoOverlay').addEventListener('click',function(e){if(e.target===this)closeBookPhotoModal()});
document.getElementById('pdfOverlay').addEventListener('click',function(e){if(e.target===this)closePdfViewer()});
document.getElementById('sessEditOverlay').addEventListener('click',function(e){if(e.target===this)closeSessEditModal()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeCalModal();closeLogModal();closeBookPhotoModal();closeSessEditModal();document.getElementById('lightbox').classList.remove('on');closePdfViewer();}});
window.addEventListener('beforeunload',function(e){if(S.running){e.preventDefault();e.returnValue=''}});
window.addEventListener('resize',function(){if(document.getElementById('page-exam').classList.contains('on'))renderExamChart();if(document.getElementById('page-stats').classList.contains('on'))renderWeekChart();});
