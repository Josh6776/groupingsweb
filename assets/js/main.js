// Mobile nav toggle
(function () {
  var btn = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () {
      links.classList.toggle('open');
      btn.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Remember language preference for the home links
  try {
    var path = location.pathname;
    if (path.indexOf('/ja/') !== -1) localStorage.setItem('groupings_lang', 'ja');
    else if (/index\.html$|\/$|\.html$/.test(path)) localStorage.setItem('groupings_lang', 'en');
  } catch (e) {}
})();

// "What's new" sheet
(function () {
  var bar = document.querySelector('.whatsnew-bar');
  var sheet = document.getElementById('whatsnew');
  if (!bar || !sheet) return;
  function open() {
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (typeof sheet.close === 'function') sheet.close(); else sheet.removeAttribute('open');
    document.body.style.overflow = '';
  }
  bar.addEventListener('click', open);
  sheet.querySelector('.whatsnew-close').addEventListener('click', close);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });   // click on the dimmed area
  sheet.addEventListener('close', function () { document.body.style.overflow = ''; });
})();

// Double-coins banner: only on Saturdays and Sundays (the app pays double coins on those days)
(function () {
  var bar = document.getElementById('weekend-bar');
  if (!bar) return;
  var day = new Date().getDay();   // 0 = Sunday, 6 = Saturday, in the visitor's own time
  if (day === 0 || day === 6) bar.hidden = false;
})();

// A friendly note beside the Buy Me a Coffee button: shown once per visit, a moment after the page loads
(function () {
  try { if (sessionStorage.getItem('groupings_coffee_note')) return; } catch (e) {}
  var ja = document.documentElement.lang === 'ja';
  var note = document.createElement('div');
  note.className = 'coffee-note';
  note.setAttribute('role', 'status');
  note.innerHTML = '<span></span><button type="button" aria-label="' + (ja ? '閉じる' : 'Close') + '">✕</button>';
  note.firstChild.textContent = ja ? 'ご訪問ありがとうございます。応援はこちらから 🙂' : 'Thanks for visiting, support me here 🙂';
  function remember() { try { sessionStorage.setItem('groupings_coffee_note', '1'); } catch (e) {} }
  function hide() { note.classList.remove('show'); remember(); setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 400); }
  note.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); hide(); });
  note.firstChild.addEventListener('click', function () {   // tapping the note opens the coffee window
    var btn = document.getElementById('bmc-wbtn'); if (btn) btn.click(); hide();
  });
  setTimeout(function () {
    document.body.appendChild(note);
    requestAnimationFrame(function () { note.classList.add('show'); });
    setTimeout(hide, 9000);
  }, 1800);
})();
