/* Estorake · núcleo: estado, idioma, encabezado, portada, calendario, huéspedes y reserva */
(function () {
  var D = window.EST, EN = window.EST_EN;
  var A = window.APP = {};
  var $ = A.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  A.lang = 'es';
  A.t = function () { return D.t[A.lang]; };
  A.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  A.state = { in: null, out: null, adults: 2, kids: 0, room: 'r0', extras: [], name: '' };
  var subs = [];
  A.on = function (fn) { subs.push(fn); };
  A.emit = function () { subs.forEach(function (f) { f(); }); };

  /* ---------- utilidades ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  A.nights = function () { var s = A.state; return s.in && s.out ? Math.round((parse(s.out) - parse(s.in)) / 864e5) : 0; };
  A.fmtShort = function (v) {
    var o = {};
    new Intl.DateTimeFormat(A.t().loc, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(parse(v))
      .forEach(function (p) { o[p.type] = p.value.replace('.', ''); });
    return A.lang === 'en' ? o.weekday + ', ' + o.month + ' ' + o.day : o.weekday + ' ' + o.day + ' ' + o.month;
  };
  A.fmtNum = function (v) { var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
  A.cop = function (n) { return 'COP ' + new Intl.NumberFormat('es-CO').format(n); };
  A.guestsText = function () { var t = A.t(), s = A.state; return t.adults(s.adults) + (s.kids ? ', ' + t.kids(s.kids) : ''); };
  A.roomName = function (id) { return id === 'r0' || !D.rooms[id] ? A.t().dAny : D.rooms[id][A.lang].name; };
  A.estimate = function () { var r = D.rooms[A.state.room], n = A.nights(); return r && r.rate && n ? r.rate * n : null; };
  A.wa = function (text) { return 'https://wa.me/' + D.phone + '?text=' + encodeURIComponent(text); };
  var toastT;
  A.toast = function (msg) { var el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 2600); };

  /* ---------- pintar el estado en todos los [data-show] ---------- */
  var last = {};
  A.render = function () {
    var t = A.t(), s = A.state, n = A.nights(), est = A.estimate(), room = D.rooms[s.room];
    var extras = $$('#planForm input[name="x"]:checked').map(function (c) { return c.nextElementSibling.textContent; });
    s.extras = extras;
    var v = {
      in: s.in ? A.fmtShort(s.in) : t.pick,
      out: s.out ? A.fmtShort(s.out) : t.pick,
      guests: A.guestsText(),
      adults: s.adults, kids: s.kids,
      nights: n ? t.nights(n) : '',
      range: s.in && s.out ? A.fmtNum(s.in) + t.from + A.fmtNum(s.out) + ' · ' + t.nights(n) : s.in ? A.fmtNum(s.in) + ' →' : t.tbd,
      room: A.roomName(s.room),
      extras: extras.length ? extras.join(', ') : t.none,
      estLbl: est ? t.estFor(n) : room && !room.rate ? t.rate : t.estHint,
      est: est ? A.cop(est) : room && !room.rate ? t.byDates : '—'
    };
    $$('[data-show]').forEach(function (el) {
      var k = el.getAttribute('data-show'), val = String(v[k]);
      if (el.textContent !== val) {
        el.textContent = val;
        if (el.tagName === 'DD' && last[k] !== undefined) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
      }
      if (k === 'in' || k === 'out') { el.classList.toggle(el.classList.contains('bb-val') ? 'empty' : 'ph', !s[k]); }
    });
    last = v;
    $('#fRoom').value = s.room;
    $$('[data-step]').forEach(function (b) {
      var key = b.getAttribute('data-step'), d = +b.getAttribute('data-d'), val = s[key];
      b.disabled = d < 0 ? val <= (key === 'adults' ? 1 : 0) : val >= (key === 'adults' ? 10 : 8);
    });
  };

  /* ---------- idioma ---------- */
  var cache = {};
  A.apply = function (lang) {
    A.lang = lang;
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!(k in cache)) cache[k] = el.innerHTML;
      el.innerHTML = lang === 'en' && EN[k] != null ? EN[k] : cache[k];
    });
    $$('#fRoom option').forEach(function (o) { if (o.value !== 'r0') o.textContent = D.rooms[o.value][lang].name; });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    $$('a.wa-link').forEach(function (a) { a.href = A.wa(A.t()[a.getAttribute('data-wa') || 'wa']); });
    A.render();
    A.emit();
    try { localStorage.setItem('est-lang', lang); } catch (e) {}
  };
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { A.apply(b.getAttribute('data-lang')); }); });

  /* ---------- encabezado: sólido al bajar, progreso, sección activa ---------- */
  var top = $('#top'), hero = $('#hero'), prog = $('#prog'), nav = $('#nav'), burger = $('#burger');
  var navLinks = $$('#nav a'), spy = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var mbar = $('#mbar'), totop = $('#totop'), ring = $('#totop circle');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    top.classList.toggle('solid', y > hero.offsetHeight - 110 || nav.classList.contains('open'));
    var p = h > 0 ? y / h : 0;
    prog.style.transform = 'scaleX(' + p + ')';
    var on = -1;
    spy.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top < 140) on = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('on', i === on); });
    mbar.classList.toggle('show', y > 500);
    totop.classList.toggle('show', y > 900);
    ring.style.setProperty('--p', String(125.6 * (1 - p)));
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(o));
    onScroll();
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: A.reduced ? 'auto' : 'smooth' }); });

  /* ---------- aparición al bajar ---------- */
  var revealTargets = $$('.rv, .ring, #sbars');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (en.target.id === 'route') { var c = $('#routeCover'); if (c) c.style.strokeDashoffset = '-100'; }
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
    var cover = $('#routeCover');
    if (cover && !A.reduced) { cover.style.strokeDashoffset = '0'; }
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- carrusel de la portada ---------- */
  var slidesEl = $('#slides'), dots = $('#dots'), cap = $('#slideCap'), cur = 0, timer = null, DUR = 7000;
  D.slides.forEach(function (sl, i) {
    if (i > 0) {
      var f = document.createElement('figure'); f.className = 'slide';
      f.innerHTML = '<img src="' + sl.src + '" alt="" decoding="async" loading="lazy">';
      slidesEl.appendChild(f);
    }
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', (i + 1) + ' / ' + D.slides.length); b.innerHTML = '<i></i>';
    b.style.setProperty('--dur', DUR + 'ms');
    b.addEventListener('click', function () { go(i); restart(); });
    dots.appendChild(b);
  });
  var slideEls = $$('.slide', slidesEl), dotEls = $$('button', dots);
  function go(i) {
    cur = (i + slideEls.length) % slideEls.length;
    slideEls.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
    dotEls.forEach(function (d, k) { d.classList.remove('on'); if (k === cur) { void d.offsetWidth; d.classList.add('on'); } });
    cap.textContent = D.slides[cur][A.lang];
  }
  function restart() {
    clearInterval(timer);
    if (A.reduced) { dots.classList.add('paused'); return; }
    timer = setInterval(function () { go(cur + 1); }, DUR);
  }
  window.addEventListener('load', function () {
    D.slides.slice(1).forEach(function (sl) { var im = new Image(); im.src = sl.src; });
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else restart(); });
  A.on(function () { cap.textContent = D.slides[cur][A.lang]; });
  go(0); restart();

  /* ---------- popovers (calendario y huéspedes) ---------- */
  var cal = $('#cal'), gp = $('#gp'), scrim = $('#scrim'), openTrigger = null, calField = 'in';
  var mobile = window.matchMedia('(max-width: 760px)');
  var calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);

  A.openPop = function (kind, trigger) {
    A.closePop(true);
    var pop = kind === 'cal' ? cal : gp;
    var host = mobile.matches ? document.body : trigger.closest('.bk') || (kind === 'cal' ? $('#fHost') : $('#gHost'));
    host.appendChild(pop);
    if (kind === 'cal') {
      calField = trigger.getAttribute('data-field') || (A.state.in ? 'out' : 'in');
      if (calField === 'out' && !A.state.in) calField = 'in';
      var ref = A.state[calField] || A.state.in;
      if (ref) { var r = parse(ref); calMonth = new Date(r.getFullYear(), r.getMonth(), 1); }
      renderCal();
    }
    pop.hidden = false;
    openTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    if (mobile.matches) { scrim.hidden = false; document.body.classList.add('lock'); }
    clearInterval(timer); dots.classList.add('paused');
    var first = pop.querySelector(kind === 'cal' ? '.d.start, .d:not(:disabled)' : 'button');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 30);
  };
  A.closePop = function (silent) {
    [cal, gp].forEach(function (p) { p.hidden = true; });
    $$('[data-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    scrim.hidden = true; document.body.classList.remove('lock');
    if (!silent && openTrigger) openTrigger.focus({ preventScroll: true });
    openTrigger = null;
    dots.classList.remove('paused'); restart();
  };
  document.addEventListener('click', function (e) {
    var trig = e.target.closest('[data-open]');
    if (trig) {
      e.preventDefault();
      var kind = trig.getAttribute('data-open'), pop = kind === 'cal' ? cal : gp;
      if (!pop.hidden && openTrigger === trig) { A.closePop(); return; }
      A.openPop(kind, trig);
      return;
    }
    if (e.target.closest('[data-close-pop]')) { A.closePop(); return; }
    if (openTrigger && !e.target.closest('.pop')) A.closePop(true);
  });
  scrim.addEventListener('click', function () { A.closePop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openTrigger) A.closePop(); });

  /* calendario */
  function renderCal() {
    var t = A.t(), s = A.state, loc = t.loc;
    var max = new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), 1);
    var wd = [];
    for (var i = 0; i < 7; i++) wd.push(new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
    var html = '<div class="cal-head"><button type="button" class="cal-nav" data-m="-1" aria-label="' + t.prevM + '"' + (calMonth <= new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) ? ' disabled' : '') + '><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<strong style="font-weight:600">' + (calField === 'in' ? t.selIn : t.selOut) + '</strong>' +
      '<button type="button" class="cal-nav" data-m="1" aria-label="' + t.nextM + '"' + (calMonth >= max ? ' disabled' : '') + '><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div><div class="cal-months">';
    for (var m = 0; m < 2; m++) {
      var first = new Date(calMonth.getFullYear(), calMonth.getMonth() + m, 1);
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      var offset = (first.getDay() + 6) % 7;
      html += '<div class="cal-m"><h4>' + new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(first) + '</h4><div class="cal-g">';
      wd.forEach(function (w) { html += '<span class="wd">' + w + '</span>'; });
      for (var o = 0; o < offset; o++) html += '<span></span>';
      for (var d = 1; d <= days; d++) {
        var date = new Date(first.getFullYear(), first.getMonth(), d), key = iso(date), cls = 'd';
        if (+date === +TODAY) cls += ' today';
        if (s.in === key) cls += ' start' + (s.out ? ' has-end' : '');
        if (s.out === key) cls += ' end';
        if (s.in && s.out && key > s.in && key < s.out) cls += ' mid';
        var label = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        html += '<button type="button" class="' + cls + '" data-date="' + key + '" aria-label="' + label + '"' + (date < TODAY || (calField === 'out' && s.in && key <= s.in) ? ' disabled' : '') + (s.in === key || s.out === key ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
      }
      html += '</div></div>';
    }
    var n = A.nights();
    html += '</div><div class="cal-foot"><p>' + (n ? '<b>' + t.nights(n) + '</b> · ' + A.fmtShort(s.in) + ' → ' + A.fmtShort(s.out) : s.in ? t.needOut : t.selIn) + '</p><div><button type="button" class="btn btn-line btn-sm" data-cal="clear">' + t.clear + '</button><button type="button" class="btn btn-monte btn-sm" data-cal="done">' + t.done + '</button></div></div>';
    cal.innerHTML = html;
  }
  cal.addEventListener('click', function (e) {
    e.stopPropagation();
    var nb = e.target.closest('.cal-nav');
    if (nb && !nb.disabled) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + (+nb.getAttribute('data-m')), 1); renderCal(); return; }
    var act = e.target.closest('[data-cal]');
    if (act) {
      if (act.getAttribute('data-cal') === 'clear') { A.state.in = A.state.out = null; calField = 'in'; A.render(); renderCal(); }
      else A.closePop();
      return;
    }
    var day = e.target.closest('.d');
    if (!day || day.disabled) return;
    var key = day.getAttribute('data-date'), s = A.state;
    if (calField === 'in' || !s.in || key <= s.in) {
      s.in = key; if (s.out && s.out <= key) s.out = null;
      calField = 'out';
    } else {
      s.out = key;
      setTimeout(function () { A.closePop(); }, 280);
    }
    clearErrors();
    A.render(); renderCal();
    var again = cal.querySelector('[data-date="' + key + '"]'); if (again) again.focus({ preventScroll: true });
  });
  cal.addEventListener('mouseover', function (e) {
    var s = A.state, day = e.target.closest('.d');
    if (!day || !s.in || s.out || calField !== 'out') return;
    var key = day.getAttribute('data-date');
    $$('.d', cal).forEach(function (b) { var k = b.getAttribute('data-date'); b.classList.toggle('mid', k > s.in && k < key); });
  });
  A.on(function () { if (!cal.hidden) renderCal(); });

  /* huéspedes */
  gp.addEventListener('click', function (e) {
    e.stopPropagation();
    var b = e.target.closest('[data-step]');
    if (b && !b.disabled) {
      var k = b.getAttribute('data-step');
      A.state[k] = Math.max(k === 'adults' ? 1 : 0, Math.min(k === 'adults' ? 10 : 8, A.state[k] + (+b.getAttribute('data-d'))));
      A.render();
    }
    if (e.target.closest('[data-close-pop]')) A.closePop();
  });

  /* ---------- enviar por WhatsApp ---------- */
  var bErr = $('#bErr'), fErr = $('#fErr');
  function clearErrors() { bErr.hidden = true; fErr.hidden = true; $$('.need').forEach(function (el) { el.classList.remove('need'); }); }
  function requireDates(errEl, scope) {
    var t = A.t(), s = A.state, field = !s.in ? 'in' : !s.out ? 'out' : null;
    if (!field) return true;
    var trig = $('[data-open="cal"][data-field="' + field + '"]', scope);
    errEl.textContent = field === 'in' ? t.need : t.needOut; errEl.hidden = false;
    trig.classList.add('need');
    A.openPop('cal', trig);
    return false;
  }
  function lines() {
    var t = A.t(), s = A.state;
    return '• ' + t.dates + ': ' + A.fmtNum(s.in) + t.from + A.fmtNum(s.out) + ' (' + t.nights(A.nights()) + ')' +
      '\n• ' + t.ppl + ': ' + A.guestsText() + '\n• ' + t.room + ': ' + A.roomName(s.room);
  }
  $('#bookbar').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!requireDates(bErr, $('#bookbar'))) return;
    window.open(A.wa(A.t().dQ + '\n\n' + lines() + '\n\n' + A.t().close), '_blank', 'noopener');
  });
  var form = $('#planForm');
  form.addEventListener('change', function (e) {
    if (e.target.id === 'fRoom') A.state.room = e.target.value;
    A.render();
  });
  $('#fName').addEventListener('input', function (e) { A.state.name = e.target.value.trim(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!requireDates(fErr, form)) return;
    var t = A.t(), s = A.state;
    var m = t.hi + (s.name ? t.im + s.name : '') + t.intro + '\n\n' + lines();
    if (s.extras.length) m += '\n• ' + t.add + ': ' + s.extras.join(', ');
    window.open(A.wa(m + '\n\n' + t.close), '_blank', 'noopener');
  });

  /* ---------- copiar y compartir ---------- */
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (err) { rej(err); }
      document.body.removeChild(ta);
    });
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { copyText(b.getAttribute('data-copy')).then(function () { A.toast(A.t().copied); }, function () { A.toast(A.t().copyFail); }); });
  });
  $$('.js-share').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.href.split('#')[0], data = { title: document.title, text: A.t().shareText, url: url };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      copyText(url).then(function () { A.toast(A.t().linkCopied); }, function () { A.toast(A.t().copyFail); });
    });
  });

  /* ---------- arranque ---------- */
  var saved = null; try { saved = localStorage.getItem('est-lang'); } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () {
    A.apply(saved === 'en' ? 'en' : 'es');
    onScroll();
  });
})();
