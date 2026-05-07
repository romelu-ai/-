// STUDY OS — STATE
// ════════════════════════════════════════
var S={
  books:[],logs:{},exams:[],events:[],
  goalH:4,
  sec:1500,running:false,sessionStart:null,iv:null,
  pomo:false,pomoPhase:'work',pomoN:0,WORK:1500,BREAK:300,ringTotal:1500,
  timerMode:'countdown',
  curBookId:null,logModalBookId:null,
  calView:'month',calY:0,calM:0,
  calEditId:null,calEditDate:null,evColor:0,
  exSubjN:0,exPendingImgs:[],exPendingPdfs:[],exPendingLinks:[],
  links:[],memo:''
};
var ECOLS=['#00d4ff','#00ff9d','#ff6b2b','#ffd166','#a78bfa','#f472b6'];
var ECLBL=['シアン','グリーン','オレンジ','イエロー','パープル','ピンク'];

// グラフ状態
var chartViewMode='series';
var chartMetric='total';
var seriesVisible={};
var SERIES_COLORS=['#00d4ff','#00ff9d','#ff6b2b','#ffd166','#a78bfa','#f472b6','#fb923c','#34d399','#60a5fa','#f87171'];
var seriesColorMap={};

function getSeriesColor(name){if(!seriesColorMap[name]){var idx=Object.keys(seriesColorMap).length%SERIES_COLORS.length;seriesColorMap[name]=SERIES_COLORS[idx];}return seriesColorMap[name];}
function getAllSeriesNames(){var map={};S.exams.forEach(function(e){var s=(e.series||'').trim()||'未分類';map[s]=1;});return Object.keys(map).sort();}
function getAllSubjNames(){var map={};S.exams.forEach(function(e){(e.subjs||[]).forEach(function(s){map[s.name]=1;});});return Object.keys(map);}

// ────────────────────────────────────────
// BOOKLOG — DATA
// ────────────────────────────────────────
var BL_KEY='booklog_v3';
var blBooks=[];

var BL_PRESETS=[
  {title:'鉄壁',subject:'英語',totalPage:480,totalProb:2176,series:''},
  {title:'英文解釈の透視図',subject:'英語',totalPage:208,totalProb:40,series:''},
  {title:'英語長文ポラリス',subject:'英語',totalPage:192,totalProb:10,series:'2'},
  {title:'英語長文ポラリス',subject:'英語',totalPage:192,totalProb:10,series:'3'},
  {title:'文系数学の良問プラチカ',subject:'数学',totalPage:240,totalProb:149,series:''},
  {title:'やさしい理系数学',subject:'数学',totalPage:352,totalProb:160,series:''},
  {title:'標準問題精講 数学IIIC',subject:'数学',totalPage:296,totalProb:120,series:''},
  {title:'化学の新演習',subject:'化学',totalPage:320,totalProb:331,series:''},
  {title:'セミナー化学',subject:'化学',totalPage:416,totalProb:600,series:''},
  {title:'名門の森',subject:'物理',totalPage:240,totalProb:120,series:'上・下巻'},
  {title:'新物理入門問題演習',subject:'物理',totalPage:304,totalProb:200,series:''},
];

var BL_BULK={
  '鉄壁':(function(){var s=['SECTION #1 重要な・ささいな','SECTION #2 特徴・明確さ・点','SECTION #3 構造・構成','SECTION #4 動詞をイメージする・1','SECTION #5 制約・強制・禁止','SECTION #6 阻害・除去・供給・促進','SECTION #7 目的・実行・達成','SECTION #8 時間','SECTION #9 金・経済','SECTION #10 場所・領域・範囲','SECTION #11 発生・繁栄・衰退・消滅','SECTION #12 多義語・1','SECTION #13 基本単語の確認','SECTION #14 関係・対立・一致','SECTION #15 言語・文学','SECTION #16 調査・研究','SECTION #17 議論・主張・要求','SECTION #18 語源から覚える','SECTION #19 力関係','SECTION #20 知覚・感覚・感情','SECTION #21 善悪・犯罪','SECTION #22 数・量','SECTION #23 思考・認識・知','SECTION #24 人・人生','SECTION #25 人間関係','SECTION #26 価値・基準・選択・出来事・参加','SECTION #27 政治','SECTION #28 産業','SECTION #29 医学・化学','SECTION #30 宗教・民族・慣習','SECTION #31 自然・環境','SECTION #32 短い単語','SECTION #33 傾向・可能性・反応','SECTION #34 衣食住・日常','SECTION #35 程度・割合','SECTION #36 動詞をイメージする・2','SECTION #37 熟語表現・1','SECTION #38 熟語表現・2','SECTION #39 熟語表現・3','SECTION #40 心・身体','SECTION #41 コロケーションで覚える形容詞','SECTION #42 カタカナ英語','SECTION #43 教育・テクノロジー','SECTION #44 多義語・2','SECTION #45 歴史・軍事','SECTION #46 接続詞・副詞・前置詞','SECTION #47 難単語・1','SECTION #48 難単語・2','SECTION #49 難単語・3','SECTION #50 （最終セクション）'];var o=[];s.forEach(function(x){o.push({unit:x,num:'テスト',checks:['','','']});});return o;})(),
  '英語長文ポラリス':(function(){var o=[];for(var i=1;i<=12;i++)o.push({unit:'長文演習',num:'第'+i+'問',checks:['','','']});return o;})(),
  '文系数学の良問プラチカ':(function(){var u=[{n:'数と式・方程式・不等式',r:[1,8]},{n:'2次関数・三角関数・指数対数',r:[9,17]},{n:'図形と方程式',r:[18,28]},{n:'場合の数・確率',r:[29,42]},{n:'図形の性質・整数',r:[43,53]},{n:'式と証明・複素数',r:[54,60]},{n:'微分法・積分法',r:[61,76]},{n:'数列',r:[77,90]},{n:'ベクトル',r:[91,106]},{n:'統計・その他',r:[107,149]}];var o=[];u.forEach(function(x){for(var i=x.r[0];i<=x.r[1];i++)o.push({unit:x.n,num:String(i),checks:['','','']});});return o;})(),
  '化学の新演習':(function(){var c=[{n:'第1編 第1章 物質の構成と化学結合',cnt:20},{n:'第1編 第2章 物質量と化学反応式',cnt:16},{n:'第2編 第3章 物質の三態と状態変化',cnt:10},{n:'第2編 第4章 気体の法則',cnt:18},{n:'第2編 第5章 溶液の性質',cnt:14},{n:'第3編 第6章 化学反応と熱・光',cnt:12},{n:'第3編 第7章 反応の速さ',cnt:8},{n:'第3編 第8章 化学平衡',cnt:18},{n:'第3編 第9章 酸と塩基の反応',cnt:16},{n:'第3編 第10章 電離平衡',cnt:12},{n:'第3編 第11章 酸化還元反応',cnt:12},{n:'第3編 第12章 電池と電気分解',cnt:10},{n:'第4編 第13章 非金属とその化合物',cnt:18},{n:'第4編 第14章 金属とその化合物',cnt:18},{n:'第4編 第15章 無機化学総合',cnt:11},{n:'第5編 第16章 脂肪族化合物',cnt:40},{n:'第5編 第17章 芳香族化合物',cnt:32},{n:'第6編 第18章 天然高分子化合物',cnt:24},{n:'第6編 第19章 合成高分子化合物',cnt:22}];var o=[],n=1;c.forEach(function(x){for(var i=0;i<x.cnt;i++){o.push({unit:x.n,num:String(n),checks:['','','']});n++;}});return o;})(),
  '名門の森':(function(){var s=[{n:'【上巻】力学 - 運動の法則・摩擦',ns:['力1','力2','力3','力4','力5','力6','力7','力8']},{n:'【上巻】力学 - 運動量・エネルギー',ns:['力9','力10','力11','力12','力13','力14','力15','力16','力17']},{n:'【上巻】力学 - 円運動・万有引力',ns:['力18','力19','力20','力21','力22','力23','力24']},{n:'【上巻】力学 - 単振動',ns:['力25','力26','力27','力28','力29','力30']},{n:'【上巻】力学 - 剛体・総合',ns:['力31','力32','力33','力34','力35','力36','力37','力38','力39','力40','力41','力42','力43','力44','力45']},{n:'【上巻】熱力学',ns:['熱1','熱2','熱3','熱4','熱5','熱6','熱7','熱8','熱9','熱10','熱11','熱12','熱13','熱14','熱15','熱16']},{n:'【上巻】波動Ⅰ',ns:['波1','波2','波3','波4','波5','波6','波7','波8','波9','波10','波11','波12','波13','波14']},{n:'【下巻】波動Ⅱ',ns:['光1','光2','光3','光4','光5','光6','光7','光8','光9','光10','光11','光12','光13','光14']},{n:'【下巻】電磁気 - 電場・電位・コンデンサー',ns:['電1','電2','電3','電4','電5','電6','電7','電8','電9','電10','電11']},{n:'【下巻】電磁気 - 直流回路',ns:['電12','電13','電14','電15','電16','電17']},{n:'【下巻】電磁気 - 電流と磁場',ns:['電18','電19','電20','電21','電22','電23','電24','電25']},{n:'【下巻】電磁気 - 電磁誘導・交流',ns:['電26','電27','電28','電29','電30','電31','電32','電33','電34','電35','電36','電37','電38']},{n:'【下巻】原子',ns:['原1','原2','原3','原4','原5','原6','原7','原8','原9','原10']}];var o=[];s.forEach(function(x){x.ns.forEach(function(num){o.push({unit:x.n,num:num,checks:['','','']});});});return o;})(),
};

var BL_MISTAKE_TAGS=['計算ミス','読み間違い','知識不足','解法忘れ','時間不足','ケアレス','応用できず','初見殺し'];

function blFindBulkKey(title){
  var key=Object.keys(BL_BULK).find(function(k){return title===k||title.indexOf(k)!==-1||k.indexOf(title)!==-1;});
  if(!key&&title.indexOf('ポラリス')!==-1)key='英語長文ポラリス';
  return key||null;
}

// ────────────────────────────────────────
