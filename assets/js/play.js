// Groupings in the browser: Daily, Practice (20+ puzzles at each difficulty), Blitz, Endless and Sudden Death,
// with the same rules as the app.
(function () {
  var DATA = window.GROUPINGS_PUZZLES;
  var root = document.getElementById('game');
  if (!DATA || !root) return;

  // "How to play" sheet (the page behind stops scrolling through CSS while the sheet is open)
  (function () {
    var sheet = document.getElementById('howto'), open = document.getElementById('howto-open');
    if (!sheet || !open) return;
    function show() { if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', ''); }
    function hide() { if (typeof sheet.close === 'function') sheet.close(); else sheet.removeAttribute('open'); }
    open.addEventListener('click', show);
    sheet.querySelector('.whatsnew-close').addEventListener('click', hide);
    var done = sheet.querySelector('.howto-done'); if (done) done.addEventListener('click', hide);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) hide(); });   // tap on the dimmed area
  })();

  var lang = document.documentElement.lang === 'ja' ? 'ja' : 'en';
  var STORE = 'https://apps.apple.com/us/app/groupings-4-word-puzzle/id6804228009';
  var MAX_MISTAKES = 3;                 // daily, practice and endless
  var BLITZ_START = 45, BLITZ_ADD = 5, BLITZ_PENALTY = 4;
  var REVEAL_MS = 1300;                 // pause on a finished grid in a run
  var EPOCH = Date.UTC(2026, 9, 28);    // daily #1 is 28 October 2026 (UTC)
  var DIFFS = ['easy', 'medium', 'hard', 'expert'];
  var RUNS = ['blitz', 'endless', 'sudden'];
  var MODES = [
    { id: 'daily', color: '#5b4fd9' }, { id: 'practice', color: '#1e9e6e' },
    { id: 'blitz', color: '#efa230' }, { id: 'endless', color: '#3b86de' }, { id: 'sudden', color: '#d93636' }
  ];

  var TXT = {
    en: {
      modes: { daily: ['Daily', 'One a day'], practice: ['Practice', 'Easy to Expert'], blitz: ['Blitz', 'Beat the clock'], endless: ['Endless', '3 mistakes'], sudden: ['Sudden Death', 'One mistake'] },
      submit: 'Submit', shuffle: 'Shuffle', deselect: 'Deselect all', mistakes: 'Mistakes left',
      oneAway: 'One away...', nope: 'Not a group. Try again.', already: 'You already tried that one.',
      pick: 'Pick four words that go together.', good: 'Nice! Keep going.', soundOn: 'Sound on', soundOff: 'Sound off',
      won: 'You solved it!', lost: 'Out of mistakes', winSub: 'You found all four groups', lostSub: 'Here is what you were looking for',
      next: 'Next puzzle', again: 'Play again', share: 'Share result', copied: 'Copied to your clipboard', puzzle: 'Puzzle',
      start: 'Start', cleared: 'Groups cleared', best: 'Best', newBest: 'New best!', timesUp: 'Time is up', runOver: 'Run over',
      intro: {
        blitz: 'You have 45 seconds. Every group you find adds 5 seconds. Every wrong guess costs 4. How many groups can you clear?',
        endless: 'Puzzle after puzzle with no finish line. You get 3 mistakes for the whole run. How far can you go?',
        sudden: 'One mistake and your run is over. Tricky puzzles, back to back. How many groups can you clear?'
      },
      cta: 'Want more? The app has a fresh daily puzzle, Blitz, Endless, puzzle packs and global leaderboards.',
      diff: { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' }, dailyName: 'Daily puzzle'
    },
    ja: {
      modes: { daily: ['デイリー', '毎日1問'], practice: ['練習', '初級〜達人'], blitz: ['ブリッツ', '時間との戦い'], endless: ['エンドレス', 'ミスは3回まで'], sudden: ['サドンデス', 'ミスは1回だけ'] },
      submit: '決定', shuffle: 'シャッフル', deselect: '選択をリセット', mistakes: '残りミス',
      oneAway: 'あと1つ!', nope: 'グループではありません。', already: 'その組み合わせは試しました。',
      pick: '関連する4つの言葉を選んでください。', good: 'いいですね!その調子!', soundOn: 'サウンド オン', soundOff: 'サウンド オフ',
      won: 'クリア!', lost: 'ミスの上限に達しました', winSub: '4つのグループをすべて見つけました', lostSub: '正解はこちらです',
      next: '次のパズル', again: 'もう一度', share: '結果をシェア', copied: 'クリップボードにコピーしました', puzzle: 'パズル',
      start: 'スタート', cleared: 'クリアしたグループ', best: 'ベスト', newBest: '自己ベスト更新!', timesUp: 'タイムアップ', runOver: 'ゲームオーバー',
      intro: {
        blitz: '制限時間は45秒。グループを見つけるたびに5秒追加、間違えると4秒減ります。いくつクリアできるでしょう?',
        endless: 'パズルが次々に続きます。ミスは全体で3回まで。どこまで行けるでしょう?',
        sudden: 'ミスは1回で終了。難しいパズルが続きます。いくつクリアできるでしょう?'
      },
      cta: 'もっと遊びたい方へ。アプリでは毎日の新しいパズル、ブリッツ、エンドレス、パズルパック、世界ランキングが楽しめます。',
      diff: { easy: '初級', medium: '中級', hard: '上級', expert: '達人' }, dailyName: '今日のパズル'
    }
  }[lang];

  var puzzles = DATA[lang];
  var dayNumber = Math.max(0, Math.floor((Date.now() - EPOCH) / 86400000));
  var dailyIndex = ((dayNumber % puzzles.daily.length) + puzzles.daily.length) % puzzles.daily.length;

  // ---- progress (per browser, optional) ----
  var DONE_KEY = 'groupings_web_done_' + lang;
  function loadDone() { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) { return {}; } }
  function saveDone(k, v) { try { var d = loadDone(); d[k] = v; localStorage.setItem(DONE_KEY, JSON.stringify(d)); } catch (e) {} }
  var soundOn = true;
  try { soundOn = localStorage.getItem('groupings_web_sound') !== 'off'; } catch (e) {}

  // ---- sound (WebAudio, only starts after a click) ----
  var ac;
  function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(f, t0, dur, gain, type) {
    var c = ctx(); if (!c || !soundOn) return;
    var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f;
    var t = c.currentTime + t0; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var sfx = {
    tap: function () { tone(760, 0, 0.07, 0.07); },
    solve: function (step) { var b = 72 + Math.min(step, 2) * 2; [0, 4, 7, 12].forEach(function (n, i) { tone(midi(b + n), i * 0.06, 0.55, 0.09); }); },
    wrong: function () { tone(160, 0, 0.3, 0.1, 'sawtooth'); },
    win: function () {
      tone(90, 0, 0.18, 0.2); tone(90, 0.09, 0.18, 0.18);
      [84, 88, 91, 96].forEach(function (m) { tone(midi(m), 0.02, 1.0, 0.07); });
      for (var k = 0; k < 14; k++) tone(midi([88, 91, 93, 96, 100][k % 5]), 0.12 + k * 0.055, 0.16, 0.035);
    },
    pop: function () { tone(90, 0, 0.18, 0.18); tone(90, 0.09, 0.18, 0.16); },
    over: function () { [64, 60, 55].forEach(function (m, i) { tone(midi(m), i * 0.14, 0.4, 0.09, 'triangle'); }); }
  };

  // ---- confetti: two cannons at the sides, up and inward, then down (as in the app) ----
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function confetti(light) {
    if (reduce) return;
    var cv = document.getElementById('confetti'); if (!cv) return;
    var W = cv.width = window.innerWidth, H = cv.height = window.innerHeight, c = cv.getContext('2d');
    var cols = ['#fcd040', '#50c488', '#50a4f8', '#a878f4', '#ff7eb6', '#ff9f43', '#ffffff'], P = [], N = light ? 60 : 150;
    for (var i = 0; i < N; i++) {
      var left = Math.random() < 0.5;
      P.push({ x: (left ? 0.02 + Math.random() * 0.15 : 0.83 + Math.random() * 0.15), y: 0.47 + Math.random() * 0.18,
        vx: (left ? 1 : -1) * (0.14 + Math.random() * 0.34), vy: -(0.47 + Math.random() * 0.42), rot: Math.random() * 6.28,
        spin: (Math.random() - 0.5) * 18, w: 6 + Math.random() * 7, h: 4 + Math.random() * 4, d: Math.random() * (light ? 0.15 : 0.25), c: cols[(Math.random() * cols.length) | 0] });
    }
    var t0 = performance.now(), DUR = light ? 2.2 : 3.1;
    (function frame(now) {
      var t = (now - t0) / 1000; c.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        var tt = t - p.d; if (tt <= 0) return;
        var x = (p.x + p.vx * tt) * W, y = (p.y + p.vy * tt + 0.885 * tt * tt) * H; if (y > H + 30) return;
        var a = tt > DUR - 0.7 ? Math.max(0, (DUR - tt) / 0.7) : 1; if (a <= 0) return;
        var w = Math.abs(Math.cos(p.rot + p.spin * tt)) * p.w + 1.2;
        c.globalAlpha = a; c.fillStyle = p.c; c.beginPath(); c.ellipse(x, y, w / 2, p.h / 2, 0, 0, 6.2832); c.fill();
      });
      if (t < DUR) requestAnimationFrame(frame); else c.clearRect(0, 0, W, H);
    })(t0);
  }

  // ---- the page skeleton: built once, so the pickers keep their scroll position and nothing flashes ----
  root.innerHTML =
    '<div class="modes" id="modes"></div>' +
    '<div class="diffs" id="diffs"></div>' +
    '<div class="nums" id="nums"></div>' +
    '<div class="board-meta"><span class="diff" id="diff"></span><button class="snd" id="snd" type="button"></button></div>' +
    '<div class="hud" id="hud"></div>' +
    '<div id="intro"></div>' +
    '<div class="board" id="board"></div>' +
    '<div class="msg" id="msg" role="status" aria-live="polite"></div>' +
    '<div class="lives" id="lives"></div>' +
    '<div class="controls" id="controls"></div>' +
    '<div id="result"></div>';
  var $ = function (id) { return document.getElementById(id); };

  // ---- state ----
  var cur, S, R = null, lastN = {}, lastDiff = 'easy', recent = [];
  function seeded(seed) { var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function groupOf(w) { for (var i = 0; i < cur.puzzle.groups.length; i++) if (cur.puzzle.groups[i].words.indexOf(w) >= 0) return i; return -1; }
  function isRun() { return RUNS.indexOf(cur.mode) >= 0; }
  function best(mode) { try { return +localStorage.getItem('groupings_web_best_' + lang + '_' + mode) || 0; } catch (e) { return 0; } }
  function setBest(mode, v) { try { localStorage.setItem('groupings_web_best_' + lang + '_' + mode, String(v)); } catch (e) {} }

  function runPool(mode) {
    return mode === 'sudden' ? puzzles.sudden : puzzles.sets.medium.concat(puzzles.sets.hard, puzzles.sets.expert);
  }
  function pickRun(mode) {   // random, avoiding the last few served
    var pool = runPool(mode), win = Math.max(1, Math.min(pool.length - 1, 5)), blocked = recent.slice(-win);
    var fresh = pool.filter(function (p) { return blocked.indexOf(p.id) < 0; });
    var c = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh : pool).length)];
    recent.push(c.id); if (recent.length > 20) recent.shift();
    return c;
  }

  function setPuzzle(puzzle) {
    var words = []; puzzle.groups.forEach(function (g) { g.words.forEach(function (w) { words.push(w); }); });
    cur.puzzle = puzzle;
    S = { remaining: shuffle(words, isRun() ? Math.random : seeded(puzzle.id)), selected: [], solved: [], missed: [], mistakes: S && isRun() ? S.mistakes : 0,
          tried: {}, over: false, won: false, msg: TXT.pick, msgKind: '', busy: false };
  }

  // mode: daily | practice | blitz | endless | sudden. For practice: diff and n (1-based).
  function open(mode, diff, n) {
    stopTimer(); R = null;
    cur = { mode: mode, diff: diff || lastDiff, n: n || 0, puzzle: null };
    S = null;
    if (mode === 'daily') { cur.n = 0; setPuzzle(puzzles.daily[dailyIndex]); cur.key = 'daily'; }
    else if (mode === 'practice') { lastDiff = cur.diff; cur.n = n || 1; setPuzzle(puzzles.sets[cur.diff][cur.n - 1]); cur.key = cur.diff + '-' + cur.n; }
    else { S = { remaining: [], selected: [], solved: [], missed: [], mistakes: 0, tried: {}, over: false, won: false, msg: '', msgKind: '', busy: false }; cur.puzzle = runPool(mode)[0]; cur.key = mode; cur.intro = true; }
    drawAll(true);
  }

  function startRun() {
    ctx();
    R = { groups: 0, puzzles: 0, time: BLITZ_START, over: false, advancing: false, flash: null };
    S = null; cur.intro = false;
    setPuzzle(pickRun(cur.mode)); S.mistakes = 0;
    drawAll(false);
    if (cur.mode === 'blitz') startTimer();
  }
  var timer = null;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startTimer() {
    stopTimer();
    timer = setInterval(function () {
      if (!R || R.over) return stopTimer();
      if (R.advancing) return;   // the clock waits while a finished grid is shown
      R.time = Math.max(0, R.time - 0.1); drawHud();
      if (R.time <= 0) endRun();
    }, 100);
  }

  // ---- drawing ----
  function drawAll(scrollToActive) { drawModes(); drawDiffs(); drawNums(scrollToActive); drawMeta(); drawHud(); drawIntro(); drawBoard({ enter: true }); drawStatus(); drawControls(); drawResult(); }

  function drawModes() {
    var done = loadDone(), html = '';
    MODES.forEach(function (m) {
      var t = TXT.modes[m.id], tick = (m.id === 'daily' && done.daily_date === String(dayNumber)) ? ' ✓' : '';
      html += '<button class="mode m-' + m.id + '" type="button" data-m="' + m.id + '" aria-current="' + (cur.mode === m.id) + '"><b><i style="background:' + m.color + '"></i>' + t[0] + tick + '</b><span>' + t[1] + '</span></button>';
    });
    $('modes').innerHTML = html;
    $('modes').querySelectorAll('.mode').forEach(function (b) { b.onclick = function () { ctx(); var m = b.getAttribute('data-m'); open(m, lastDiff, m === 'practice' ? (lastN[lastDiff] || 1) : 0); }; });
  }
  function drawDiffs() {
    var box = $('diffs');
    if (cur.mode !== 'practice') { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false; var html = '';
    DIFFS.forEach(function (d) { html += '<button class="seg" type="button" data-d="' + d + '" aria-current="' + (cur.diff === d) + '">' + TXT.diff[d] + '</button>'; });
    box.innerHTML = html;
    box.querySelectorAll('.seg').forEach(function (b) { b.onclick = function () { var d = b.getAttribute('data-d'); open('practice', d, lastN[d] || 1); }; });
  }
  function drawNums(scrollToActive) {
    var nums = $('nums');
    if (cur.mode !== 'practice') { nums.hidden = true; nums.innerHTML = ''; return; }
    nums.hidden = false;
    var done = loadDone(), html = '', list = puzzles.sets[cur.diff];
    for (var i = 1; i <= list.length; i++) {
      var st = done[cur.diff + '-' + i];
      html += '<button class="num' + (st ? ' ' + st : '') + '" type="button" data-n="' + i + '" aria-label="' + TXT.puzzle + ' ' + i + '" aria-current="' + (cur.n === i) + '">' + i + '</button>';
    }
    nums.innerHTML = html;
    nums.querySelectorAll('.num').forEach(function (b) { b.onclick = function () { open('practice', cur.diff, +b.getAttribute('data-n')); }; });
    // start the row at the puzzle in play (puzzle 1 shows the start of the row)
    var act = nums.querySelector('[aria-current="true"]');
    if (scrollToActive && act) {
      var a = act.getBoundingClientRect(), n = nums.getBoundingClientRect();
      nums.scrollLeft = Math.max(0, nums.scrollLeft + (a.left - n.left) - 40);
    }
  }
  function drawMeta() {
    var d = $('diff'), label;
    if (cur.mode === 'daily') { d.className = 'diff ' + cur.puzzle.difficulty; label = TXT.dailyName + ' #' + (dayNumber + 1) + '  ·  ' + TXT.diff[cur.puzzle.difficulty]; }
    else if (cur.mode === 'practice') { d.className = 'diff ' + cur.diff; label = TXT.diff[cur.diff] + '  ·  ' + cur.n + ' / ' + puzzles.sets[cur.diff].length; }
    else { d.className = 'diff run-' + cur.mode; label = TXT.modes[cur.mode][0]; }
    d.textContent = label;
    $('snd').textContent = soundOn ? '🔊 ' + TXT.soundOn : '🔇 ' + TXT.soundOff;
  }
  function drawHud() {
    var h = $('hud');
    if (!isRun() || cur.intro || !R) { h.hidden = true; h.innerHTML = ''; return; }
    h.hidden = false;
    var html = '';
    if (cur.mode === 'blitz') {
      var s = Math.ceil(R.time), low = R.time <= 10;
      html += '<div class="clock' + (low ? ' low' : '') + '">' + Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) + '</div>';
      if (R.flash) html += '<div class="flash ' + (R.flash > 0 ? 'gain' : 'loss') + '" id="flash">' + (R.flash > 0 ? '+' : '') + R.flash + 's</div>';
    }
    html += '<div class="cleared">' + TXT.cleared + ': <b>' + R.groups + '</b></div>';
    h.innerHTML = html;
  }
  function drawIntro() {
    var box = $('intro');
    if (!isRun() || !cur.intro) { box.innerHTML = ''; return; }
    var b = best(cur.mode);
    box.innerHTML = '<div class="intro"><h2>' + TXT.modes[cur.mode][0] + '</h2><p>' + TXT.intro[cur.mode] + '</p>' +
      (b ? '<p class="bestline">' + TXT.best + ': <b>' + b + '</b></p>' : '') +
      '<button class="btn" id="go" type="button">' + TXT.start + '</button></div>';
    $('go').onclick = startRun;
  }

  // The tiles are rebuilt only when the layout changes (open, solve, shuffle); picking and unpicking a tile just flips its state.
  function drawBoard(o) {
    o = o || {};
    var board = $('board');
    if (isRun() && cur.intro) { board.innerHTML = ''; return; }
    var p = cur.puzzle, html = '';
    S.solved.forEach(function (gi) {
      var g = p.groups[gi];
      html += '<div class="band t' + g.tier + (S.missed.indexOf(gi) >= 0 ? ' missed' : '') + (o.newBand === gi ? ' new' : '') + '"><b>' + esc(g.label) + '</b><span>' + g.words.map(esc).join(lang === 'ja' ? '、' : ', ') + '</span></div>';
    });
    for (var r = 0; r < S.remaining.length; r += 4) {
      html += '<div class="row">';
      S.remaining.slice(r, r + 4).forEach(function (w, i) {
        var small = lang === 'ja' && w.length > 6;
        html += '<button class="tile' + (small ? ' sm' : '') + (o.enter ? ' enter' : '') + '" type="button" style="--i:' + (r + i) + ';--len:' + w.length + '" data-w="' + esc(w) + '" aria-pressed="' + (S.selected.indexOf(w) >= 0) + '">' + esc(w) + '</button>';
      });
      html += '</div>';
    }
    board.innerHTML = html;
    board.querySelectorAll('.tile').forEach(function (b) { b.onclick = function () { ctx(); tap(b); }; });
  }
  function livesTotal() { return cur.mode === 'sudden' ? 1 : cur.mode === 'blitz' ? 0 : MAX_MISTAKES; }
  function drawStatus() {
    var lv = $('lives'), msg = $('msg');
    if (isRun() && cur.intro) { msg.textContent = ''; lv.innerHTML = ''; return; }
    msg.className = 'msg ' + S.msgKind; msg.textContent = S.msg;
    var total = livesTotal();
    if (!total) { lv.innerHTML = ''; return; }
    var l = '<span>' + TXT.mistakes + '</span>';
    for (var m = 0; m < total; m++) l += '<i class="' + (m >= total - S.mistakes ? 'gone' : '') + '"></i>';
    lv.innerHTML = l;
  }
  function drawControls() {
    var c = $('controls');
    if ((isRun() && (cur.intro || (R && R.over))) || S.over) { c.innerHTML = ''; return; }
    if (!c.firstChild) {
      c.innerHTML = '<button class="btn btn-ghost" id="shuf" type="button">' + TXT.shuffle + '</button>' +
        '<button class="btn btn-ghost" id="desel" type="button">' + TXT.deselect + '</button>' +
        '<button class="btn" id="sub" type="button">' + TXT.submit + '</button>';
      $('shuf').onclick = function () { if (S.busy) return; S.remaining = shuffle(S.remaining, Math.random); drawBoard(); };
      $('desel').onclick = function () { S.selected = []; syncSelection(); };
      $('sub').onclick = submit;
    }
    $('desel').disabled = !S.selected.length; $('sub').disabled = S.selected.length !== 4 || S.busy;
  }
  function syncSelection() {
    $('board').querySelectorAll('.tile').forEach(function (b) { b.setAttribute('aria-pressed', S.selected.indexOf(b.getAttribute('data-w')) >= 0); });
    drawControls();
  }

  function nextTarget() {   // daily and practice only
    if (cur.mode === 'daily') return { m: 'practice', d: 'easy', n: 1 };
    if (cur.n < puzzles.sets[cur.diff].length) return { m: 'practice', d: cur.diff, n: cur.n + 1 };
    var i = DIFFS.indexOf(cur.diff); return i < DIFFS.length - 1 ? { m: 'practice', d: DIFFS[i + 1], n: 1 } : null;
  }
  var ctaHtml = function () { return '<div class="cta-card"><p>' + TXT.cta + '</p><a class="badge-appstore" href="' + STORE + '" aria-label="App Store"><img src="' + (lang === 'ja' ? '../' : '') + 'assets/img/appstore-badge-' + (lang === 'ja' ? 'ja-' : '') + 'black.svg" alt="App Store" width="168" height="56"></a></div>'; };
  function drawResult() {
    var box = $('result');
    if (isRun()) {
      if (!R || !R.over) { box.innerHTML = ''; return; }
      var prev = R.prevBest, isBest = R.groups > prev;
      box.innerHTML = '<div class="result"><h2>' + (cur.mode === 'blitz' ? TXT.timesUp : TXT.runOver) + '</h2>' +
        '<div class="bigscore">' + R.groups + '</div><p>' + TXT.cleared + (isBest && R.groups > 0 ? ' · <b class="newbest">' + TXT.newBest + '</b>' : (best(cur.mode) ? ' · ' + TXT.best + ' ' + best(cur.mode) : '')) + '</p>' +
        '<div class="actions"><button class="btn" id="share" type="button">' + TXT.share + '</button><button class="btn btn-ghost" id="again" type="button">' + TXT.again + '</button></div>' + ctaHtml() + '</div>';
      $('share').onclick = function () { doShare($('share')); };
      $('again').onclick = function () { open(cur.mode); };
      return;
    }
    if (!S.over) { box.innerHTML = ''; return; }
    var nt = nextTarget();
    box.innerHTML = '<div class="result"><h2>' + (S.won ? TXT.won : TXT.lost) + '</h2><p>' + (S.won ? TXT.winSub : TXT.lostSub) + '</p>' +
      '<div class="actions"><button class="btn" id="share" type="button">' + TXT.share + '</button>' +
      (nt ? '<button class="btn btn-ghost" id="next" type="button">' + TXT.next + '</button>' : '') +
      '<button class="btn btn-ghost" id="again" type="button">' + TXT.again + '</button></div>' + ctaHtml() + '</div>';
    $('share').onclick = function () { doShare($('share')); };
    $('again').onclick = function () { open(cur.mode, cur.diff, cur.n); };
    if (nt) $('next').onclick = function () { open(nt.m, nt.d, nt.n); scrollToTop(); };
  }
  function scrollToTop() { var m = $('modes'); if (m && m.getBoundingClientRect().top < 0) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  // ---- actions ----
  function tap(btn) {
    if (S.over || S.busy) return;
    var w = btn.getAttribute('data-w'), i = S.selected.indexOf(w);
    if (i >= 0) S.selected.splice(i, 1);
    else if (S.selected.length < 4) { S.selected.push(w); sfx.tap(); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    syncSelection();
  }
  function submit() {
    if (S.over || S.busy || S.selected.length !== 4) return;
    var key = S.selected.slice().sort().join('|');
    if (S.tried[key]) { S.msg = TXT.already; S.msgKind = 'bad'; drawStatus(); return; }
    var counts = {}; S.selected.forEach(function (w) { var g = groupOf(w); counts[g] = (counts[g] || 0) + 1; });
    var best_ = -1, n = 0; Object.keys(counts).forEach(function (g) { if (counts[g] > n) { n = counts[g]; best_ = +g; } });
    if (n === 4) {
      S.solved.push(best_); S.remaining = S.remaining.filter(function (w) { return S.selected.indexOf(w) < 0; });
      sfx.solve(S.solved.length - 1); S.selected = []; S.msg = TXT.good; S.msgKind = 'good';
      if (isRun()) { R.groups++; if (cur.mode === 'blitz') { R.time += BLITZ_ADD; R.flash = BLITZ_ADD; clearFlash(); } }
      if (S.solved.length === 4) return gridDone(best_);
      drawBoard({ newBand: best_ }); drawStatus(); drawControls(); drawHud();
    } else {
      S.tried[key] = 1; sfx.wrong();
      S.msg = n === 3 ? TXT.oneAway : TXT.nope; S.msgKind = 'bad';
      var wrong = S.selected.slice(); S.selected = [];
      if (cur.mode === 'blitz') {
        R.time = Math.max(0, R.time - BLITZ_PENALTY); R.flash = -BLITZ_PENALTY; clearFlash();
        if (R.time <= 0) return endRun();
      } else {
        S.mistakes++;
        if (S.mistakes >= livesTotal()) return isRun() ? endRun() : finish(false);
      }
      syncSelection(); drawStatus(); drawHud();
      $('board').querySelectorAll('.tile').forEach(function (b) {
        if (wrong.indexOf(b.getAttribute('data-w')) >= 0) { b.classList.add('shake'); setTimeout(function () { b.classList.remove('shake'); }, 480); }
      });
    }
  }
  var flashT = null;
  function clearFlash() { clearTimeout(flashT); flashT = setTimeout(function () { if (R) { R.flash = null; drawHud(); } }, 900); }

  // a whole grid solved: single puzzles finish; in a run the next grid follows after a short pause
  function gridDone(lastBand) {
    if (!isRun()) return finish(true, lastBand);
    R.puzzles++; R.advancing = true; S.busy = true; S.selected = [];
    sfx.pop(); confetti(true);
    drawBoard({ newBand: lastBand }); drawStatus(); drawControls(); drawHud();
    setTimeout(function () {
      if (!R || R.over) return;
      var mistakes = S.mistakes; setPuzzle(pickRun(cur.mode)); S.mistakes = mistakes;
      R.advancing = false; drawBoard({ enter: true }); drawStatus(); drawControls(); drawHud();
    }, REVEAL_MS);
  }
  function endRun() {
    if (R.over) return;
    stopTimer(); R.over = true; R.time = Math.max(0, R.time); R.prevBest = best(cur.mode);
    if (R.groups > R.prevBest) setBest(cur.mode, R.groups);
    // show what was missed in the grid that was in play
    cur.puzzle.groups.forEach(function (g, i) { if (S.solved.indexOf(i) < 0) { S.solved.push(i); S.missed.push(i); } });
    S.remaining = []; S.selected = []; S.over = true; S.busy = false;
    S.msg = cur.mode === 'blitz' ? TXT.timesUp : TXT.runOver; S.msgKind = 'bad';
    sfx.over();
    drawBoard(); drawStatus(); drawControls(); drawHud(); drawResult();
  }
  function finish(won, lastBand) {
    S.over = true; S.won = won; S.selected = [];
    if (!won) cur.puzzle.groups.forEach(function (g, i) { if (S.solved.indexOf(i) < 0) { S.solved.push(i); S.missed.push(i); } });
    S.remaining = [];
    saveDone(cur.key, won ? 'win' : 'loss');
    if (cur.mode === 'daily') saveDone('daily_date', String(dayNumber)); else lastN[cur.diff] = cur.n;
    S.msg = won ? TXT.won : TXT.lost; S.msgKind = won ? 'good' : 'bad';
    if (won) { sfx.win(); confetti(false); }
    drawModes(); drawNums(false); drawBoard({ newBand: won ? lastBand : -1 }); drawStatus(); drawControls(); drawResult();
  }

  function shareText() {
    var url = lang === 'ja' ? 'https://groupingspuzzle.app/ja/play.html' : 'https://groupingspuzzle.app/play.html';
    if (isRun()) {
      var name = TXT.modes[cur.mode][0];
      return lang === 'ja' ? 'Groupings ' + name + 'で' + R.groups + 'グループをクリアしました!\nあなたはいくつ?\n' + url
                           : 'Groupings ' + name + ': I cleared ' + R.groups + (R.groups === 1 ? ' group.' : ' groups.') + '\nCan you beat it?\n' + url;
    }
    var what = cur.mode === 'daily' ? TXT.dailyName + ' #' + (dayNumber + 1) : TXT.diff[cur.diff] + ' ' + cur.n;
    if (lang === 'ja') return 'Groupings ' + what + (S.won ? 'をミス' + S.mistakes + '回でクリアしました!' : 'に挑戦しました。') + '\nあなたは解けますか?\n' + url;
    return 'Groupings ' + what + (S.won ? ': solved with ' + S.mistakes + (S.mistakes === 1 ? ' mistake.' : ' mistakes.') : ': I could not crack this one.') + '\nCan you do better?\n' + url;
  }
  function doShare(btn) {
    var text = shareText();
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { navigator.share({ text: text }).catch(function () {}); return; }
    var done = function () { var o = btn.textContent; btn.textContent = TXT.copied; setTimeout(function () { btn.textContent = o; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  }

  $('snd').onclick = function () { soundOn = !soundOn; try { localStorage.setItem('groupings_web_sound', soundOn ? 'on' : 'off'); } catch (e) {} ctx(); drawMeta(); };
  document.addEventListener('visibilitychange', function () { /* the clock keeps running like the app's, but never while the tab is hidden */ if (document.hidden && R && !R.over && cur.mode === 'blitz') R.advancing = true; else if (R && !R.over && !S.busy) R.advancing = false; });

  open('daily');
})();
