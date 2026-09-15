/* Estorake · componentes: habitaciones, galerías, itinerario, reseñas, clima y preguntas */
(function () {
  var A = window.APP, D = window.EST, $ = A.$, $$ = A.$$;
  var CHEV = { l: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>', r: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>' };

  /* ---------- tarjetas de habitación ---------- */
  function renderCards() {
    var t = A.t();
    $$('.rm').forEach(function (card) {
      var r = D.rooms[card.getAttribute('data-id')], L = r[A.lang];
      $('[data-rt="tag"]', card).textContent = L.tag;
      $('[data-rt="name"]', card).textContent = L.name;
      $('[data-rt="line"]', card).textContent = L.beds + ' · ' + r.size + ' m²';
      $('[data-rt="count"]', card).textContent = r.photos.length + ' ' + t.photos;
      $('[data-rt="price"]', card).innerHTML = r.rate
        ? '<small>' + t.from_night + '</small><b>' + A.cop(r.rate) + '</b>'
        : '<small>' + t.rate + '</small><b class="soft">' + t.byDates + '</b>';
    });
  }
  A.on(renderCards);

  $('#filters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var f = b.getAttribute('data-f');
    $$('#filters button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    var i = 0;
    $$('.rm').forEach(function (card) {
      var show = f === 'all' || D.rooms[card.getAttribute('data-id')].cat.indexOf(f) > -1;
      card.classList.toggle('hide', !show);
      card.classList.remove('enter');
      if (show) { card.classList.add('in'); void card.offsetWidth; card.style.animationDelay = (i++ * 70) + 'ms'; card.classList.add('enter'); }
    });
  });

  /* ---------- carrusel reutilizable ---------- */
  function carousel(root, items, start) {
    root.innerHTML = '<div class="car-track" tabindex="0"></div><span class="car-count"></span>' +
      '<button type="button" class="car-btn prev" aria-label="Anterior">' + CHEV.l + '</button>' +
      '<button type="button" class="car-btn next" aria-label="Siguiente">' + CHEV.r + '</button>' +
      '<div class="car-thumbs"></div>';
    var track = $('.car-track', root), thumbs = $('.car-thumbs', root), count = $('.car-count', root);
    var prev = $('.prev', root), next = $('.next', root), idx = 0;
    items.forEach(function (it, i) {
      var fig = document.createElement('figure');
      fig.innerHTML = '<img src="' + it.src + '" alt="' + it.alt + '" loading="' + (Math.abs(i - start) < 2 ? 'eager' : 'lazy') + '" decoding="async">' + (it.cap ? '<figcaption>' + it.cap + '</figcaption>' : '');
      track.appendChild(fig);
      var tb = document.createElement('button');
      tb.type = 'button'; tb.setAttribute('aria-label', (i + 1) + ' / ' + items.length);
      tb.innerHTML = '<img src="' + it.src + '" alt="" loading="lazy">';
      tb.addEventListener('click', function () { go(i); });
      thumbs.appendChild(tb);
    });
    var tbs = $$('button', thumbs);
    function update(i) {
      idx = i;
      count.textContent = (i + 1) + ' / ' + items.length;
      prev.disabled = i === 0; next.disabled = i === items.length - 1;
      tbs.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      if (tbs[i]) thumbs.scrollTo({ left: tbs[i].offsetLeft - thumbs.clientWidth / 2 + 38, behavior: A.reduced ? 'auto' : 'smooth' });
    }
    function go(i, instant) {
      i = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: instant || A.reduced ? 'auto' : 'smooth' });
      update(i);
    }
    var st;
    track.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(function () { update(Math.round(track.scrollLeft / track.clientWidth)); }, 60); }, { passive: true });
    prev.addEventListener('click', function () { go(idx - 1); });
    next.addEventListener('click', function () { go(idx + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    });
    requestAnimationFrame(function () { go(start || 0, true); });
    return { go: go, key: function (e) { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); } };
  }

  /* ---------- diálogos ---------- */
  function openDialog(dlg) {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('lock');
  }
  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('close', function () { document.body.classList.remove('lock'); dlg.car = null; });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (dlg.car && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('.car-track')) dlg.car.key(e); });
  });

  /* ficha de habitación */
  var roomDlg = $('#roomDlg'), current = null;
  function fillRoom() {
    if (!current) return;
    var t = A.t(), r = D.rooms[current], L = r[A.lang], n = A.nights();
    $('#rdTag').textContent = L.tag;
    $('#rdName').textContent = L.name;
    $('#rdDesc').textContent = L.desc;
    $('#rdBeds').textContent = L.beds;
    $('#rdSize').textContent = r.size + ' m²';
    $('#rdView').textContent = L.view;
    $('#rdAmen').innerHTML = L.amen.map(function (a) { return '<li>' + a + '</li>'; }).join('');
    $('#rdEst').innerHTML = !r.rate ? t.rate + '<b>' + t.byDates + '</b>'
      : n ? t.estFor(n) + '<b>' + A.cop(r.rate * n) + '</b>'
      : t.from_night + '<b>' + A.cop(r.rate) + '</b>';
  }
  function openRoom(id) {
    current = id;
    var L = D.rooms[id][A.lang];
    fillRoom();
    openDialog(roomDlg);
    roomDlg.car = carousel($('#rdCar'), D.rooms[id].photos.map(function (p, i) { return { src: 'img/g/' + p + '.webp', alt: L.name + ' · ' + (i + 1) }; }), 0);
  }
  A.on(function () { if (roomDlg.open) fillRoom(); });
  $('#rooms').addEventListener('click', function (e) {
    if (!e.target.closest('[data-room-open]')) return;
    openRoom(e.target.closest('.rm').getAttribute('data-id'));
  });
  $('#rdBook').addEventListener('click', function () {
    A.state.room = current; A.render(); roomDlg.close();
    $('#reservar').scrollIntoView({ behavior: A.reduced ? 'auto' : 'smooth' });
  });

  /* galería de la casa */
  var lb = $('#lb');
  $('#mos').addEventListener('click', function (e) {
    var b = e.target.closest('[data-gal]'); if (!b) return;
    openDialog(lb);
    lb.car = carousel($('#lbCar'), D.gallery.map(function (g) {
      var cap = A.lang === 'en' ? g[2] : g[1];
      return { src: 'img/g/' + g[0] + '.webp', alt: cap, cap: cap };
    }), +b.getAttribute('data-gal'));
  });

  /* ---------- itinerario ---------- */
  var ICON = {
    am: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#B4532F" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    pm: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#B4532F" stroke-width="2" stroke-linecap="round"><path d="M17 18a5 5 0 00-10 0M12 3v6M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1"/></svg>',
    ev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0F5B37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>'
  };
  var days = 1;
  function renderItin() {
    var t = A.t(), html = '', wa = t.itinWa(days) + '\n', k = 0;
    for (var d = 1; d <= days; d++) {
      html += '<li style="display:block;padding:0;animation:none"><p class="tl-day">' + t.day + ' ' + d + '</p></li>';
      D.itin[d].forEach(function (it) {
        var L = it[A.lang];
        html += '<li style="--dl:' + (k++ * 60) + 'ms"><span class="t-ic" aria-hidden="true">' + ICON[it.t] + '</span><div class="t-card"><span class="t-when">' + t[it.t] + '</span><h4>' + L[0] + '</h4><p>' + L[1] + '</p><span class="mode">' + L[2] + '</span></div></li>';
        wa += '\n• ' + t.day + ' ' + d + ' · ' + t[it.t] + ': ' + L[0];
      });
    }
    $('#tl').innerHTML = html;
    $('#itSum').textContent = t.itinSum(days);
    $('#itWa').href = A.wa(wa + '\n\n' + t.itinClose);
    movePill();
  }
  function movePill() {
    var sel = $('#tabs [aria-selected="true"]'), pill = $('#tabs .pill');
    if (!sel) return;
    pill.style.width = sel.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + sel.offsetLeft + 'px)';
  }
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-d]'); if (!b) return;
    days = +b.getAttribute('data-d');
    $$('#tabs [data-d]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    renderItin();
  });
  window.addEventListener('resize', movePill);
  document.fonts && document.fonts.ready.then(movePill);
  A.on(renderItin);

  /* ---------- carrusel de reseñas ---------- */
  var qt = $('#qtrack'), qcards = $$('.q', qt), qdots = $('#qdots'), qi = 0, qTimer = null, qVisible = false;
  qcards.forEach(function () { qdots.appendChild(document.createElement('i')); });
  var qd = $$('i', qdots);
  function qStep() { return qcards[1] ? qcards[1].offsetLeft - qcards[0].offsetLeft : qt.clientWidth; }
  function qUpdate() {
    qi = Math.round(qt.scrollLeft / qStep());
    if (qt.scrollLeft + qt.clientWidth >= qt.scrollWidth - 4) qi = qcards.length - 1;
    qd.forEach(function (d, k) { d.classList.toggle('on', k === qi); });
  }
  function qGo(i) {
    if (i >= qcards.length || (i > qi && qt.scrollLeft + qt.clientWidth >= qt.scrollWidth - 4)) i = 0;
    if (i < 0) i = qcards.length - 1;
    qt.scrollTo({ left: qcards[i].offsetLeft - qcards[0].offsetLeft, behavior: A.reduced ? 'auto' : 'smooth' });
  }
  qt.addEventListener('scroll', function () { requestAnimationFrame(qUpdate); }, { passive: true });
  $('#qPrev').addEventListener('click', function () { qGo(qi - 1); qAuto(); });
  $('#qNext').addEventListener('click', function () { qGo(qi + 1); qAuto(); });
  function qAuto() {
    clearInterval(qTimer);
    if (A.reduced || !qVisible) return;
    qTimer = setInterval(function () { qGo(qi + 1); }, 6000);
  }
  ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { qt.parentNode.addEventListener(ev, function () { clearInterval(qTimer); }, { passive: true }); });
  qt.parentNode.addEventListener('mouseleave', qAuto);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { qVisible = en[0].isIntersecting; qAuto(); }, { threshold: 0.3 }).observe(qt);
  }
  qUpdate();

  /* ---------- clima y hora en San Agustín ---------- */
  var wx = null;
  var WX_IC = {
    sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#B4532F" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#48534C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 00.5-8A6 6 0 006 9.5 4.3 4.3 0 007 18z"/></svg>',
    rain: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0F5B37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10a4 4 0 00.5-8A6 6 0 006 6.5 4.3 4.3 0 007 15zM8 19l-1 2M12 19l-1 2M16 19l-1 2"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#12301F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>'
  };
  function paintWx() {
    if (!wx) return;
    var t = A.t(), c = wx.weather_code;
    var near = Object.keys(t.wx).map(Number).filter(function (k) { return k <= c; }).pop();
    var time = new Intl.DateTimeFormat(t.loc, { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }).format(new Date());
    $('#wxLbl').textContent = t.wxNow;
    $('#wxT').textContent = Math.round(wx.temperature_2m) + ' °C';
    $('#wxD').textContent = (t.wx[near] || '') + ' · ' + time;
    $('#wxIc').innerHTML = c >= 51 ? WX_IC.rain : c >= 2 ? WX_IC.cloud : wx.is_day ? WX_IC.sun : WX_IC.moon;
    $('#wx').hidden = false;
  }
  if (window.fetch) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=1.8833&longitude=-76.2667&current=temperature_2m,weather_code,is_day&timezone=America%2FBogota')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.current) { wx = j.current; paintWx(); setInterval(paintWx, 60000); } })
      .catch(function () {});
  }
  A.on(paintWx);

  /* ---------- preguntas con animación ---------- */
  $$('#faq details').forEach(function (det) {
    var sum = $('summary', det), ans = $('.ans', det), anim = null;
    sum.addEventListener('click', function (e) {
      if (A.reduced || !ans.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (det.open) {
        anim = ans.animate({ height: [ans.offsetHeight + 'px', '0px'], opacity: [1, 0] }, { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { det.open = false; anim = null; };
      } else {
        det.open = true;
        anim = ans.animate({ height: ['0px', ans.offsetHeight + 'px'], opacity: [0, 1] }, { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { anim = null; };
      }
    });
  });

  /* ---------- paralaje de respaldo para la franja de noche ---------- */
  var band = $('.band'), bandImg = band && $('img', band);
  if (band && !A.reduced && !(window.CSS && CSS.supports('animation-timeline: view()'))) {
    var bt = false;
    window.addEventListener('scroll', function () {
      if (bt) return; bt = true;
      requestAnimationFrame(function () {
        var r = band.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom > 0 && r.top < vh) {
          var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
          bandImg.style.transform = 'translateY(' + (-p * 16) + '%)';
        }
        bt = false;
      });
    }, { passive: true });
  }
})();
