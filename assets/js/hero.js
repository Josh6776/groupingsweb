// Home page: instant-play demo and the device stage
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ja = document.documentElement.lang === 'ja';

  /* ---------- Instant play demo (real puzzles from the daily set) ---------- */
  var gridEl = document.getElementById('demo-grid');
  if (gridEl && window.GROUPINGS_HERO) {
    var rowsEl = document.getElementById('demo-rows');
    var msgEl = document.getElementById('demo-msg');
    var countEl = document.getElementById('demo-count');
    var nextBtn = document.getElementById('demo-next');
    var soundBtn = document.getElementById('demo-sound');
    var list = window.GROUPINGS_HERO[ja ? 'ja' : 'en'] || window.GROUPINGS_HERO.en;
    var T = ja
      ? { pick: '関連する4つの言葉を選んでください。', one: 'あと1つです。', no: '残念、違います。', done: function (m) { return m ? 'クリア! ミスは' + m + '回。毎日のパズルはアプリで。' : 'ノーミスでクリア! 毎日のパズルはアプリで。'; }, off: 'サウンド オフ', on: 'サウンド オン', mist: function (n) { return 'ミス ' + n; }, sel: function (n) { return n + '/4 選択中'; } }
      : { pick: 'Select four words that belong together.', one: 'One away.', no: 'Not quite. Try again.', done: function (m) { return m ? 'Solved with ' + m + (m === 1 ? ' mistake' : ' mistakes') + '. A new puzzle lands in the app every day.' : 'Solved with no mistakes. A new puzzle lands in the app every day.'; }, off: 'Sound off', on: 'Sound on', mist: function (n) { return n + (n === 1 ? ' mistake' : ' mistakes'); }, sel: function (n) { return n + ' of 4 selected'; } };

    var index = Math.floor(Date.now() / 86400000) % list.length;
    var puzzle, tiles, selected, solved, mistakes, busy, sound = false, ctx;

    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

    function chime(step) {
      if (!sound) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        var notes = [659.25, 783.99, 987.77, 1318.51];
        var f = notes[Math.min(step, 3)], t0 = ctx.currentTime;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.55);
      } catch (e) {}
    }

    function setup() {
      puzzle = list[index % list.length];
      var words = [];
      puzzle.groups.forEach(function (g, gi) { g.words.forEach(function (w) { words.push({ w: w, g: gi }); }); });
      shuffle(words);
      tiles = words; selected = []; solved = 0; mistakes = 0; busy = false;
      rowsEl.innerHTML = '';
      render(false);
      msgEl.textContent = T.pick;
      countEl.textContent = '';
    }

    function render(animate) {
      var before = {};
      if (animate && !reduce) Array.prototype.forEach.call(gridEl.children, function (b) { before[b.dataset.w] = b.getBoundingClientRect(); });
      gridEl.innerHTML = '';
      tiles.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tile'; b.textContent = t.w; b.dataset.w = t.w;
        b.setAttribute('aria-pressed', selected.indexOf(t) > -1 ? 'true' : 'false');
        b.addEventListener('click', function () { toggle(t); });
        gridEl.appendChild(b);
      });
      if (animate && !reduce) {
        Array.prototype.forEach.call(gridEl.children, function (b) {
          var r0 = before[b.dataset.w]; if (!r0) return;
          var r1 = b.getBoundingClientRect(), dx = r0.left - r1.left, dy = r0.top - r1.top;
          if (!dx && !dy) return;
          b.style.transition = 'none'; b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            b.style.transition = 'transform .55s cubic-bezier(0.32, 0.72, 0, 1)'; b.style.transform = '';
            setTimeout(function () { b.style.transition = ''; }, 600);
          }); });
        });
      }
    }

    function toggle(t) {
      if (busy || solved === 4) return;
      var i = selected.indexOf(t);
      if (i > -1) selected.splice(i, 1); else if (selected.length < 4) selected.push(t); else return;
      Array.prototype.forEach.call(gridEl.children, function (b, k) { b.setAttribute('aria-pressed', selected.indexOf(tiles[k]) > -1 ? 'true' : 'false'); });
      countEl.textContent = selected.length ? T.sel(selected.length) : '';
      if (selected.length === 4) { busy = true; setTimeout(check, reduce ? 0 : 220); }
    }

    function check() {
      var counts = {}; selected.forEach(function (t) { counts[t.g] = (counts[t.g] || 0) + 1; });
      var gi = -1, top = 0;
      Object.keys(counts).forEach(function (k) { if (counts[k] > top) { top = counts[k]; gi = +k; } });
      if (top === 4) {
        var g = puzzle.groups[gi];
        var row = document.createElement('div');
        row.className = 'demo-banner t' + (g.tier % 4);
        row.innerHTML = '<b></b><span></span>';
        row.firstChild.textContent = g.label; row.lastChild.textContent = g.words.join(', ');
        rowsEl.appendChild(row);
        var sel = selected.slice();
        tiles = tiles.filter(function (t) { return sel.indexOf(t) < 0; });
        selected = []; solved++; busy = false; countEl.textContent = '';
        render(true); chime(solved - 1);
        if (solved === 4) {
          msgEl.textContent = T.done(mistakes); countEl.textContent = mistakes ? T.mist(mistakes) : '';
        } else msgEl.textContent = g.label;
      } else {
        mistakes++;
        msgEl.textContent = top === 3 ? T.one : T.no; countEl.textContent = T.mist(mistakes);
        Array.prototype.forEach.call(gridEl.children, function (b, k) { if (selected.indexOf(tiles[k]) > -1) { b.classList.remove('shake'); void b.offsetWidth; if (!reduce) b.classList.add('shake'); } });
        setTimeout(function () {
          selected = []; busy = false;
          Array.prototype.forEach.call(gridEl.children, function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('shake'); });
        }, reduce ? 0 : 450);
      }
    }

    nextBtn.addEventListener('click', function () { index++; setup(); });
    soundBtn.addEventListener('click', function () {
      sound = !sound; soundBtn.setAttribute('aria-pressed', sound ? 'true' : 'false'); soundBtn.textContent = sound ? T.on : T.off;
      if (sound) chime(1);
    });
    setup();
  }

  /* ---------- Device stage: segmented control ---------- */
  var seg = document.getElementById('seg');
  var screen = document.getElementById('device-screen');
  if (seg && screen) {
    var tabs = Array.prototype.slice.call(seg.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      var key = tab.id.replace('tab-', '');
      tabs.forEach(function (t) {
        var on = t === tab, k = t.id.replace('tab-', '');
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById('panel-' + k);
        if (panel) { panel.dataset.active = on ? 'true' : 'false'; panel.setAttribute('aria-hidden', on ? 'false' : 'true'); }
      });
      Array.prototype.forEach.call(screen.querySelectorAll('picture'), function (p) { p.dataset.active = p.dataset.for === key ? 'true' : 'false'; });
      if (focus) tab.focus();
      if (tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }
})();
