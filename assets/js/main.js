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

// "What's new" sheet: focus trap, Escape to close, focus returns to the trigger
(function () {
  var bar = document.querySelector('.whatsnew-bar');
  var sheet = document.getElementById('whatsnew');
  if (!bar || !sheet) return;
  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function open() {
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    var first = sheet.querySelector('.whatsnew-close'); if (first) first.focus();
  }
  function close() {
    if (typeof sheet.close === 'function') sheet.close(); else { sheet.removeAttribute('open'); onClosed(); }
  }
  function onClosed() { document.body.style.overflow = ''; bar.focus(); }
  bar.addEventListener('click', open);
  sheet.querySelector('.whatsnew-close').addEventListener('click', close);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });   // click on the dimmed area
  sheet.addEventListener('close', onClosed);
  sheet.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var items = Array.prototype.filter.call(sheet.querySelectorAll(FOCUSABLE), function (el) { return el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

// Double-coins banner: only on Saturdays and Sundays (the app pays double coins on those days)
(function () {
  var bar = document.getElementById('weekend-bar');
  if (!bar) return;
  var day = new Date().getDay();   // 0 = Sunday, 6 = Saturday, in the visitor's own time
  if (day === 0 || day === 6) bar.hidden = false;
})();

// A friendly note that slides out beside the Buy Me a Coffee button on every page load
(function () {
  var ja = document.documentElement.lang === 'ja';
  var note = document.createElement('div');
  note.className = 'coffee-note';
  note.setAttribute('role', 'status');
  note.textContent = ja ? 'ご訪問ありがとうございます。応援はこちらから :)' : 'Thanks for visiting, support me here :)';
  function hide() { note.classList.remove('show'); setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 500); }
  note.addEventListener('click', function () {   // tapping it opens the coffee window
    var btn = document.getElementById('bmc-wbtn'); if (btn) btn.click(); hide();
  });
  setTimeout(function () {
    document.body.appendChild(note);
    requestAnimationFrame(function () { requestAnimationFrame(function () { note.classList.add('show'); }); });
    setTimeout(hide, 9000);
  }, 1500);
})();
