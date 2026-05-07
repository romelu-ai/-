// GITHUB CLOUD SYNC
// ────────────────────────────────────────
var GH = {
  token: '',
  owner: '',
  repo:  '',
  path:  'studyos-data.json',
  autoUpload: false
};
var GH_KEY = 'sos5_gh';

function ghLoadSettings() {
  try {
    var r = localStorage.getItem(GH_KEY);
    if (r) {
      var d = JSON.parse(r);
      GH.token      = d.token      || '';
      GH.owner      = d.owner      || '';
      GH.repo       = d.repo       || '';
      GH.path       = d.path       || 'studyos-data.json';
      GH.autoUpload = d.autoUpload || false;
    }
  } catch(e) {}
}

function ghSaveSettings() {
  GH.token = document.getElementById('ghTokenInp').value.trim();
  GH.owner = document.getElementById('ghOwnerInp').value.trim();
  GH.repo  = document.getElementById('ghRepoInp').value.trim();
  GH.path  = document.getElementById('ghPathInp').value.trim() || 'studyos-data.json';
  if (!GH.token || !GH.owner || !GH.repo) {
    ghStatus('conn', '&#10007; トークン・ユーザー名・リポジトリ名を全て入力してください', '#ff3c5a');
    return;
  }
  try {
    localStorage.setItem(GH_KEY, JSON.stringify({
      token: GH.token, owner: GH.owner, repo: GH.repo,
      path: GH.path, autoUpload: GH.autoUpload
    }));
  } catch(e) {}
  ghStatus('conn', '&#10003; 設定を保存しました', '#00ff9d');
  ghRenderInfo();
}

function ghClearSettings() {
  if (!confirm('GitHub連携設定を削除しますか？（データ本体は消えません）')) return;
  GH.token = ''; GH.owner = ''; GH.repo = ''; GH.autoUpload = false;
  localStorage.removeItem(GH_KEY);
  document.getElementById('ghTokenInp').value = '';
  document.getElementById('ghOwnerInp').value = '';
  document.getElementById('ghRepoInp').value  = '';
  document.getElementById('ghPathInp').value  = '';
  document.getElementById('ghAutoUpload').checked = false;
  ghStatus('conn', '設定を削除しました', 'var(--txD)');
}

function ghRenderInfo() {
  var inp = document.getElementById('ghOwnerInp');
  if (inp && GH.owner) inp.value = GH.owner;
  var ri = document.getElementById('ghRepoInp');
  if (ri && GH.repo) ri.value = GH.repo;
  var pi = document.getElementById('ghPathInp');
  if (pi && GH.path) pi.value = GH.path;
  // tokenは表示しない（入力欄はplaceholderのまま）
  var au = document.getElementById('ghAutoUpload');
  if (au) au.checked = GH.autoUpload;

  var lu = localStorage.getItem('gh_last_upload');
  var ld = localStorage.getItem('gh_last_download');
  var lue = document.getElementById('ghLastUpload');
  var lde = document.getElementById('ghLastDownload');
  if (lue) lue.textContent = lu || '--';
  if (lde) lde.textContent = ld || '--';
}

function ghToggleTokenVisible() {
  var inp = document.getElementById('ghTokenInp');
  var btn = document.getElementById('ghTokenToggle');
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '隠す'; }
  else { inp.type = 'password'; btn.textContent = '表示'; }
}

function ghToggleAuto(checked) {
  GH.autoUpload = checked;
  try {
    var r = localStorage.getItem(GH_KEY);
    var d = r ? JSON.parse(r) : {};
    d.autoUpload = checked;
    localStorage.setItem(GH_KEY, JSON.stringify(d));
  } catch(e) {}
}

function ghStatus(type, msg, color) {
  var id = type === 'conn' ? 'ghConnStatus' : 'ghSyncStatus';
  var el = document.getElementById(id);
  if (el) { el.innerHTML = '<span style="color:' + (color||'var(--txD)') + '">' + msg + '</span>'; }
}

function ghReady() {
  if (!GH.token || !GH.owner || !GH.repo) {
    ghStatus('sync', '&#9888; GitHub設定が未完了です。接続設定を入力してください。', 'var(--yw)');
    return false;
  }
  return true;
}

// GitHubからファイルのSHAを取得
async function ghGetFileSHA() {
  var url = 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + GH.path;
  try {
    var res = await fetch(url, {
      headers: {
        'Authorization': 'token ' + GH.token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'StudyOS-App'
      }
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined; // エラー
    var json = await res.json();
    return json.sha || null;
  } catch(e) { return undefined; }
}

// テキストデータのみ収集（画像除外）
function ghCollectData() {
  // S.examsから画像データを除外した軽量版
  var exLite = S.exams.map(function(e) {
    return {
      id:e.id, name:e.name, series:e.series||'',
      date:e.date, total:e.total, hensachi:e.hensachi,
      rank:e.rank, schoolRank:e.schoolRank||'',
      note:e.note, subjs:e.subjs, links:e.links||[],
      imgs:[], pdfs:[]   // 画像・PDFは除外
    };
  });
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    main: {
      books:  S.books,
      logs:   S.logs,
      events: S.events,
      goalH:  S.goalH,
      exams:  exLite,
      links:  S.links,
      memo:   S.memo
    },
    booklog: blBooks
  };
}

// アップロード
async function ghUpload() {
  if (!ghReady()) return;
  ghStatus('sync', '&#9650; アップロード中...', 'var(--cy)');
  var btn = document.querySelector('[onclick="ghUpload()"]');
  if (btn) { btn.disabled = true; btn.textContent = '処理中...'; }

  try {
    var data = ghCollectData();
    // Base64エンコード（UTF-8対応）
    var json = JSON.stringify(data, null, 2);
    var b64  = btoa(unescape(encodeURIComponent(json)));

    var sha = await ghGetFileSHA();
    if (sha === undefined) {
      ghStatus('sync', '&#10007; 接続に失敗しました。トークン・リポジトリ名を確認してください。', '#ff3c5a');
      return;
    }

    var body = { message: 'StudyOS data update ' + new Date().toISOString(), content: b64 };
    if (sha) body.sha = sha;

    var url = 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + GH.path;
    var res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + GH.token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'StudyOS-App'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      var ts = new Date().toLocaleString('ja-JP');
      localStorage.setItem('gh_last_upload', ts);
      ghStatus('sync', '&#10003; アップロード完了 — ' + ts + '　（画像・PDFはlocalStorageに保持）', '#00ff9d');
      ghRenderInfo();
    } else {
      var err = await res.json().catch(function(){return {};});
      ghStatus('sync', '&#10007; アップロード失敗: ' + (err.message || res.status), '#ff3c5a');
    }
  } catch(e) {
    ghStatus('sync', '&#10007; エラー: ' + e.message, '#ff3c5a');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '&#9650; アップロード'; btn.innerHTML = '&#9650; アップロード'; }
  }
}

// ダウンロード（復元）
async function ghDownload() {
  if (!ghReady()) return;
  if (!confirm('GitHubからデータを読み込みます。\n現在のデータに上書きされます。よろしいですか？')) return;
  ghStatus('sync', '&#9660; ダウンロード中...', 'var(--cy)');

  try {
    var url = 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + GH.path;
    var res = await fetch(url, {
      headers: {
        'Authorization': 'token ' + GH.token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'StudyOS-App'
      }
    });

    if (res.status === 404) {
      ghStatus('sync', '&#10007; ファイルが見つかりません。先にアップロードしてください。', '#ff3c5a');
      return;
    }
    if (!res.ok) {
      ghStatus('sync', '&#10007; 取得失敗: ' + res.status, '#ff3c5a');
      return;
    }

    var json = await res.json();
    // Base64デコード（UTF-8対応）
    var decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))));
    var data = JSON.parse(decoded);

    // データ復元
    if (data.version === 3) {
      if (data.main) {
        localStorage.setItem('sos5', JSON.stringify(data.main));
      }
      if (data.booklog) {
        localStorage.setItem(BL_KEY, JSON.stringify(data.booklog));
      }
    } else if (data.version === 2 && data.main) {
      // 旧フォーマット互換
      localStorage.setItem('sos5', JSON.stringify(data.main));
      if (data.booklog) localStorage.setItem(BL_KEY, JSON.stringify(data.booklog));
    }

    var ts = new Date().toLocaleString('ja-JP');
    localStorage.setItem('gh_last_download', ts);
    ghStatus('sync', '&#10003; ダウンロード完了 — ' + ts + '　ページをリロードして反映します。', '#00ff9d');
    ghRenderInfo();

    setTimeout(function() { location.reload(); }, 1800);
  } catch(e) {
    ghStatus('sync', '&#10007; エラー: ' + e.message, '#ff3c5a');
  }
}

// 接続テスト
async function ghTestConnection() {
  var token = document.getElementById('ghTokenInp').value.trim() || GH.token;
  var owner = document.getElementById('ghOwnerInp').value.trim() || GH.owner;
  var repo  = document.getElementById('ghRepoInp').value.trim()  || GH.repo;
  if (!token || !owner || !repo) {
    ghStatus('conn', '&#9888; トークン・ユーザー名・リポジトリ名を入力してください', 'var(--yw)');
    return;
  }
  ghStatus('conn', '接続テスト中...', 'var(--cy)');
  var btn = document.getElementById('ghTestBtn');
  if (btn) btn.disabled = true;
  try {
    var url = 'https://api.github.com/repos/' + owner + '/' + repo;
    var res = await fetch(url, {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'StudyOS-App'
      }
    });
    if (res.ok) {
      var d = await res.json();
      ghStatus('conn',
        '&#10003; 接続成功！ リポジトリ: ' + d.full_name +
        (d.private ? ' <span style="color:var(--yw)">[Private]</span>' : ' <span style="color:var(--gn)">[Public]</span>'),
        '#00ff9d');
    } else if (res.status === 401) {
      ghStatus('conn', '&#10007; 認証失敗: トークンが無効か期限切れです', '#ff3c5a');
    } else if (res.status === 404) {
      ghStatus('conn', '&#10007; リポジトリが見つかりません: ' + owner + '/' + repo, '#ff3c5a');
    } else {
      ghStatus('conn', '&#10007; エラー: HTTP ' + res.status, '#ff3c5a');
    }
  } catch(e) {
    ghStatus('conn', '&#10007; 接続エラー: ' + e.message, '#ff3c5a');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// 自動アップロード（save()のラッパー）
var _origSave = null;
function ghWrapSave() {
  _origSave = save;
  save = function() {
    _origSave();
    if (GH.autoUpload && GH.token && GH.owner && GH.repo) {
      // 非同期で静かにアップロード（UIをブロックしない）
      ghUploadSilent();
    }
  };
}
async function ghUploadSilent() {
  try {
    var data = ghCollectData();
    var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    var sha = await ghGetFileSHA();
    if (sha === undefined) return;
    var body = { message: 'auto update', content: b64 };
    if (sha) body.sha = sha;
    var url = 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + GH.path;
    var res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + GH.token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'StudyOS-App'
      },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      var ts = new Date().toLocaleString('ja-JP');
      localStorage.setItem('gh_last_upload', ts);
      // ステータスが表示されているなら更新
      var el = document.getElementById('ghLastUpload');
      if (el) el.textContent = ts;
    }
  } catch(e) { /* サイレントに失敗 */ }
}

// ────────────────────────────────────────
