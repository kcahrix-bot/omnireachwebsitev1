/* OmniReach Studios — page interactions and scroll scenes (no dependencies) */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var smooth = function (t) { t = clamp(t); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- Header ---------- */
  var header = $('.site-header');
  function onHeader() { header.classList.toggle('is-scrolled', window.scrollY > 12); }
  onHeader();

  /* ---------- Mobile menu ---------- */
  var nav = $('.nav'), toggle = $('.nav__toggle'), links = $('#nav-links');
  var mobileQuery = window.matchMedia('(max-width: 900px)');
  function setMenu(open, returnFocus) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.visually-hidden').textContent = open ? 'Close menu' : 'Menu';
    if (mobileQuery.matches) { if (open) links.removeAttribute('inert'); else links.setAttribute('inert', ''); }
    if (open) {
      var first = links.querySelector('a');
      if (first) { first.focus(); if (document.activeElement !== first) setTimeout(function () { first.focus(); }, 60); }
    } else if (returnFocus) toggle.focus();
  }
  function syncMenu() {
    if (mobileQuery.matches) { if (!nav.classList.contains('is-open')) links.setAttribute('inert', ''); }
    else { links.removeAttribute('inert'); nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
  }
  syncMenu();
  mobileQuery.addEventListener('change', syncMenu);
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open'), false); });
  links.addEventListener('click', function (e) { if (e.target.closest('a') && nav.classList.contains('is-open')) setMenu(false, false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true); });
  document.addEventListener('click', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false, false); });

  /* ---------- In-page anchors ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    history.pushState(null, '', id === '#top' ? location.pathname : id);
    var f = id === '#top' ? $('#main') : target;
    if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1');
    f.focus({ preventScroll: true });
  });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav__links a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window) {
    var activeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) {
          var on = l.getAttribute('href') === '#' + en.target.id;
          l.classList.toggle('is-active', on);
          if (on) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    // watch every section so the highlight clears when you leave a linked one
    $$('main > section[id], .hero').forEach(function (s) { activeIO.observe(s); });
  }

  /* ---------- Small DOM preparation ---------- */
  // pipeline: wrap labels so the chip + connector can be styled, and stagger them
  $$('.pipeline li').forEach(function (li, i) {
    li.style.setProperty('--n', i);
    li.innerHTML = '<span>' + li.textContent + '</span>';
  });

  // odometer for 1,000,000
  $$('.odometer').forEach(function (od) {
    var k = 0;
    od.getAttribute('data-value').split('').forEach(function (ch) {
      if (!/\d/.test(ch)) { var s = document.createElement('span'); s.className = 'sep'; s.textContent = ch; od.appendChild(s); return; }
      var col = document.createElement('span');
      col.className = 'col';
      col.style.setProperty('--k', k++);
      col.dataset.to = String(10 + Number(ch));
      for (var r = 0; r < 20; r++) { var d = document.createElement('span'); d.textContent = String(r % 10); col.appendChild(d); }
      od.appendChild(col);
    });
  });
  function runOdometer(od) {
    $$('.col', od).forEach(function (c) { c.style.transform = 'translateY(-' + c.dataset.to + 'em)'; });
  }

  // connector lines drawn in real pixels (so strokes and dash animations stay true)
  function connect(svg, box, from, targets, withPulse) {
    var W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    var b = box.getBoundingClientRect();
    var centre = function (n) { var r = n.getBoundingClientRect(); return [r.left - b.left + r.width / 2, r.top - b.top + r.height / 2]; };
    var o = centre(from);
    targets.forEach(function (t, i) {
      var p = centre(t);
      var d = 'M' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) + ' L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      if (withPulse) {
        el('path', { d: d, class: 'base' }, svg);
        el('path', { d: d, class: 'pulse', pathLength: '1', style: '--i:' + i }, svg);
      } else {
        el('path', { d: d, pathLength: '1', style: 'transition-delay:' + (i * 0.15) + 's' }, svg);
      }
    });
  }
  var lev = $('.lev'), eco = $('.eco');
  function drawConnectors() {
    if (lev && window.innerWidth > 960) connect($('.lev__spokes'), lev, $('.lev__founder'), $$('.lev__node'), true);
    if (eco && window.innerWidth > 760) connect($('.eco__lines'), eco, $('.eco__core'), $$('.eco__mods li'), false);
  }
  drawConnectors();
  window.addEventListener('resize', drawConnectors);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawConnectors);

  /* ---------- GTM trust-layer diagram ---------- */
  var gtmBox = $('[data-gtm]');
  var CHANNELS = [['Paid Ads', 'i-ad'], ['Cold Email', 'i-mail'], ['Referrals', 'i-users'], ['Events', 'i-calendar'], ['Search', 'i-search'], ['Outbound Sales', 'i-phone']];
  function buildGTM(vertical) {
    gtmBox.innerHTML = '';
    var W = vertical ? 360 : 1000, H = vertical ? 600 : 500;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'gtm-svg', role: 'presentation' }, gtmBox);
    var defs = el('defs', {}, svg);
    var g = el('linearGradient', vertical ? { id: 'gtm-layer', x1: 0, y1: 0, x2: 1, y2: 0 } : { id: 'gtm-layer', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#2ee8cf', 'stop-opacity': 0.08 }, g);
    el('stop', { offset: 0.5, 'stop-color': '#2ee8cf', 'stop-opacity': 0.24 }, g);
    el('stop', { offset: 1, 'stop-color': '#2ee8cf', 'stop-opacity': 0.08 }, g);

    var routes = el('g', {}, svg), chans = el('g', {}, svg), avatars = el('g', {}, svg);
    var paths = [];
    CHANNELS.forEach(function (c, i) {
      var x, y, d, gc = el('g', { class: 'chan' }, chans);
      if (vertical) {
        var cx = i % 2 ? 265 : 95; y = 36 + Math.floor(i / 2) * 50;
        el('rect', { x: cx - 80, y: y - 20, width: 160, height: 40, rx: 20 }, gc);
        el('use', { href: '#' + c[1], x: cx - 68, y: y - 9, width: 18, height: 18 }, gc);
        var t = el('text', { x: cx - 44, y: y + 4.5, 'font-size': 12.5 }, gc); t.textContent = c[0];
        var mx = 180 + (cx - 180) * 0.35;
        d = 'M' + cx + ' ' + (y + 20) + ' C ' + cx + ' 235, ' + mx + ' 235, ' + mx + ' 295 C ' + mx + ' 380, 180 460, 180 520';
      } else {
        y = 50 + i * 80;
        el('rect', { x: 20, y: y - 22, width: 200, height: 44, rx: 22 }, gc);
        el('use', { href: '#' + c[1], x: 38, y: y - 11, width: 22, height: 22 }, gc);
        var t2 = el('text', { x: 72, y: y + 5, 'font-size': 15 }, gc); t2.textContent = c[0];
        var my = 250 + (y - 250) * 0.35;
        d = 'M220 ' + y + ' C 360 ' + y + ', 380 ' + my + ', 502 ' + my + ' C 620 ' + my + ', 680 250, 770 250';
      }
      var p = el('path', { d: d, class: 'route', id: 'gtm-r' + i }, routes);
      paths.push(p);
    });

    // trust layer
    var layer = el('g', {}, svg);
    if (vertical) {
      el('rect', { x: 20, y: 270, width: 320, height: 50, rx: 25, class: 'layer' }, layer);
      var lt = el('text', { x: 180, y: 300, 'text-anchor': 'middle', 'font-size': 13, class: 'layer-text' }, layer); lt.textContent = 'FOUNDER CONTENT';
    } else {
      el('rect', { x: 470, y: 24, width: 64, height: 452, rx: 32, class: 'layer' }, layer);
      var lt2 = el('text', { x: 502, y: 255, 'text-anchor': 'middle', 'font-size': 14, transform: 'rotate(-90 502 250)', class: 'layer-text' }, layer); lt2.textContent = 'FOUNDER CONTENT';
    }
    // sales conversation
    var conv = el('g', { class: 'conv' }, svg);
    if (vertical) {
      el('rect', { x: 60, y: 520, width: 240, height: 52, rx: 26 }, conv);
      el('use', { href: '#i-call', x: 88, y: 537, width: 18, height: 18 }, conv);
      var ct = el('text', { x: 116, y: 551, 'font-size': 14 }, conv); ct.textContent = 'Sales Conversation';
    } else {
      el('rect', { x: 770, y: 218, width: 210, height: 64, rx: 32 }, conv);
      el('use', { href: '#i-call', x: 794, y: 239, width: 22, height: 22 }, conv);
      var ct2 = el('text', { x: 826, y: 255, 'font-size': 15 }, conv); ct2.textContent = 'Sales Conversation';
    }
    // prospects travelling through the layer: grey before, teal after
    var r = vertical ? 9 : 11;
    for (var n = 0; n < 12; n++) {
      var i = n % 6, begin = (i * 1 + (n >= 6 ? 3 : 0)) + 's';
      var a = el('g', { class: 'avatar', opacity: 0 }, avatars);
      var circ = el('circle', { r: r, fill: '#59646a' }, a);
      el('use', { href: '#i-user', x: -r * 0.62, y: -r * 0.62, width: r * 1.24, height: r * 1.24 }, a);
      var mo = el('animateMotion', { dur: '6s', begin: begin, repeatCount: 'indefinite' }, a);
      el('mpath', { href: '#gtm-r' + i }, mo);
      el('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;0.06;0.9;1', dur: '6s', begin: begin, repeatCount: 'indefinite' }, a);
      el('animate', { attributeName: 'fill', values: '#59646a;#59646a;#2ee8cf;#2ee8cf', keyTimes: '0;0.5;0.56;1', dur: '6s', begin: begin, repeatCount: 'indefinite' }, circ);
    }
    if (reduced) freezeSMIL(svg);
  }
  function freezeSMIL(svg) {
    try { svg.setCurrentTime(3.2); svg.pauseAnimations(); } catch (e) { /* older engines */ }
  }
  if (gtmBox) {
    var gtmQuery = window.matchMedia('(max-width: 700px)');
    buildGTM(gtmQuery.matches);
    gtmQuery.addEventListener('change', function () { buildGTM(gtmQuery.matches); });
  }
  if (reduced) $$('svg.smil').forEach(freezeSMIL);

  /* ---------- Scroll reveals ---------- */
  var revealEls = $$('.reveal');
  $$('.hero .reveal').forEach(function (r) { requestAnimationFrame(function () { r.classList.add('is-visible'); }); });
  function onVisible(t) {
    t.classList.add('is-visible');
    var od = t.querySelector('.odometer');
    if (od) runOdometer(od);
  }
  if (!('IntersectionObserver' in window) || reduced) {
    revealEls.forEach(onVisible);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { onVisible(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (r) { io.observe(r); });
  }

  /* ---------- Scroll-driven scenes ---------- */
  var vh = window.innerHeight;
  // progress through a sticky scene: 0 when it pins, 1 when it unpins
  function stickyProgress(sec) {
    var r = sec.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - vh));
  }
  // progress of an element passing through the viewport
  function passProgress(node) {
    var r = node.getBoundingClientRect();
    return clamp((vh - r.top) / (vh + r.height));
  }

  var scenes = [];

  // 2. proof rail drifts sideways as you scroll
  var rail = $('[data-scene="rail"]');
  if (rail && !reduced) {
    var track = $('.rail__track', rail);
    scenes.push(function () {
      var over = track.scrollWidth - rail.clientWidth;
      var shift = over > 0 ? -over * passProgress(rail) : 0;
      track.style.setProperty('--shift', shift.toFixed(1) + 'px');
    });
  }

  // 3. opportunity: ideas spiral out, become platforms, then reach the market
  var opp = $('[data-scene="opp"]');
  if (opp) {
    var stage = $('.opp__stage', opp);
    var ideas = $$('.node--idea', stage), plats = $$('.node--platform', stage), market = $$('.node--market', stage);
    var phases = $$('.phase', opp);
    var place = function (n, x, y, s, o) {
      n.style.transform = 'translate(-50%, -50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      n.style.opacity = o.toFixed(3);
    };
    var renderOpp = function (p, staticLayout) {
      var R = stage.clientWidth / 2, TAU = Math.PI * 2;
      var small = stage.clientWidth < 460;
      var platPos = plats.map(function (_, j) {
        var a = j / 4 * TAU - Math.PI / 4 + (staticLayout ? 0 : p * 0.9);
        var rr = R * (staticLayout ? 0.66 : 0.5);
        return [Math.cos(a) * rr, Math.sin(a) * rr];
      });
      var tA = staticLayout ? 1 : smooth(p / 0.3);
      var tB = staticLayout ? 0 : smooth((p - 0.36) / 0.14);
      ideas.forEach(function (n, i) {
        var a = i / ideas.length * TAU - Math.PI / 2 + (1 - tA) * 1.8;
        var rr = R * (staticLayout ? 0.4 : (0.16 + (small ? 0.56 : 0.58) * tA));
        var x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        var tp = platPos[i % 4];
        place(n, lerp(x, tp[0], tB), lerp(y, tp[1], tB), (0.7 + 0.3 * tA) * (1 - 0.5 * tB), tA * (1 - tB));
      });
      var tP = staticLayout ? 1 : smooth((p - 0.42) / 0.1);
      plats.forEach(function (n, j) { place(n, platPos[j][0], platPos[j][1], 0.8 + 0.2 * tP, tP); });
      var tC = staticLayout ? 1 : smooth((p - 0.68) / 0.22);
      market.forEach(function (n, k) {
        var a = k / market.length * TAU - Math.PI / 2 + (1 - tC) * -0.9;
        var rr = R * lerp(0.5, small ? 0.8 : 0.88, tC);
        if (staticLayout) rr = R * (small ? 0.84 : 0.9);
        place(n, Math.cos(a) * rr, Math.sin(a) * rr, 0.85 + 0.15 * tC, tC);
      });
      if (!staticLayout) {
        var ph = p < 0.4 ? 0 : p < 0.68 ? 1 : 2;
        phases.forEach(function (li, i) { li.classList.toggle('is-active', i === ph); });
      }
    };
    if (reduced) { renderOpp(1, true); window.addEventListener('resize', function () { renderOpp(1, true); }); }
    else scenes.push(function () { renderOpp(stickyProgress(opp), false); });
  }

  // 4. Founder B accumulates signals; Founder A stays still
  var ladder = $('.ladder:not(.ladder--static)');
  if (ladder && !reduced) {
    var rungs = $$('li', ladder);
    scenes.push(function () {
      var r = ladder.getBoundingClientRect();
      var t = clamp((vh * 0.92 - r.top) / (r.height + vh * 0.35));
      var count = Math.round(t * rungs.length);
      rungs.forEach(function (li, i) { li.classList.toggle('on', i < count); });
    });
  }

  // 7. engine: five steps pinned to scroll
  var engine = $('[data-scene="engine"]');
  if (engine) {
    var eStage = $('.engine__stage', engine), eSteps = $$('.step', engine), eProg = $('.engine__progress', engine);
    if (reduced) { eStage.setAttribute('data-step', '5'); engine.classList.add('is-live'); }
    else scenes.push(function () {
      var r = engine.getBoundingClientRect();
      engine.classList.toggle('is-live', r.top < vh * 0.5);
      var p = stickyProgress(engine);
      var step = Math.min(5, Math.floor(p * 5) + 1);
      if (eStage.getAttribute('data-step') !== String(step)) {
        eStage.setAttribute('data-step', String(step));
        eSteps.forEach(function (s, i) { s.classList.toggle('is-active', i === step - 1); });
      }
      eProg.style.setProperty('--prog', p.toFixed(3));
    });
  }

  // 11. 1,000,000 breaks apart into what it actually means
  var burstScene = $('[data-scene="burst"]');
  if (burstScene && !reduced) {
    var digits = $$('.burst__num span', burstScene), words = $$('.burst__word', burstScene), num = $('.burst__num', burstScene);
    var WIDE = [[17, 18], [50, 9], [83, 18], [12, 50], [88, 50], [17, 82], [50, 91], [83, 82], [50, 50]];
    var NARROW = [[30, 8], [70, 19], [30, 30], [70, 41], [30, 61], [70, 72], [30, 83], [70, 94], [50, 50]];
    scenes.push(function () {
      var p = stickyProgress(burstScene);
      var t = smooth((p - 0.08) / 0.5);
      num.style.scale = (1 - 0.25 * t).toFixed(3);
      digits.forEach(function (d, i) {
        var dx = (i - 4) * 46 + Math.sin(i * 2.1) * 40, dy = Math.cos(i * 1.7) * 140;
        d.style.transform = 'translate(' + (dx * t).toFixed(1) + 'px,' + (dy * t).toFixed(1) + 'px) rotate(' + ((i % 2 ? 1 : -1) * 18 * t).toFixed(1) + 'deg)';
        d.style.opacity = clamp(1 - t * 1.3).toFixed(3);
      });
      var pos = window.innerWidth < 700 ? NARROW : WIDE;
      var tw = clamp((p - 0.25) / 0.55);
      words.forEach(function (w, k) {
        var o = smooth(tw * 1.7 - k * 0.08);
        w.style.left = lerp(50, pos[k][0], o) + '%';
        w.style.top = lerp(50, pos[k][1], o) + '%';
        w.style.opacity = o.toFixed(3);
        w.style.scale = (0.85 + 0.15 * o).toFixed(3);
      });
    });
  } else if (burstScene) {
    // static fallback handled in CSS
  }

  var ticking = false;
  function frame() {
    ticking = false;
    onHeader();
    for (var i = 0; i < scenes.length; i++) scenes[i]();
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; requestFrame(); });
  frame();

  /* ---------- Platforms: link roles to orbit nodes ---------- */
  $$('.role[data-plat]').forEach(function (role) {
    var node = $('.plat__node[data-plat="' + role.getAttribute('data-plat') + '"]');
    if (!node) return;
    var on = function () { node.classList.add('is-hot'); role.classList.add('is-hot'); };
    var off = function () { node.classList.remove('is-hot'); role.classList.remove('is-hot'); };
    role.addEventListener('mouseenter', on);
    role.addEventListener('mouseleave', off);
  });

  /* ---------- FAQ ---------- */
  $$('.faq__item').forEach(function (item) {
    var btn = $('.faq__btn', item), panel = $('.faq__a', item);
    panel.setAttribute('inert', '');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    });
  });

  /* ---------- Application form → email ---------- */
  var form = $('#apply-form');
  if (form) {
    var err = $('.form-error', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, problems = [], firstBad = null;
      [['name', 'your name'], ['email', 'a valid work email'], ['company', 'your company']].forEach(function (pair) {
        var input = f[pair[0]], v = input.value.trim();
        var bad = !v || (pair[0] === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        input.setAttribute('aria-invalid', String(bad));
        if (bad) { problems.push(pair[1]); if (!firstBad) firstBad = input; }
      });
      if (problems.length) {
        err.textContent = 'Please add ' + problems.join(', ') + '.';
        firstBad.focus();
        return;
      }
      err.textContent = '';
      var body = [
        'Name: ' + f.name.value.trim(),
        'Email: ' + f.email.value.trim(),
        'Company: ' + f.company.value.trim(),
        'Website: ' + (f.website.value.trim() || '-'),
        '',
        'What we are building / where we publish today:',
        f.about.value.trim() || '-'
      ].join('\n');
      var subject = '1M Views Pilot application — ' + f.company.value.trim();
      window.location.href = 'mailto:hello@omnireachstudios.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      $('.copy-status').textContent = 'Your email app should open with the application ready to send. If it didn’t, email hello@omnireachstudios.com directly.';
    });
  }

  /* ---------- Copy email ---------- */
  var status = $('.copy-status');
  $$('[data-copy]').forEach(function (btn) {
    var label = $('.copy-btn__label', btn);
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function (ok) {
        label.textContent = ok ? 'Copied' : 'Copy';
        status.textContent = ok ? 'Email address copied to clipboard.' : 'Copy failed — select the address and copy it manually.';
        setTimeout(function () { label.textContent = 'Copy'; status.textContent = ''; }, 2600);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      else done(fallbackCopy(text));
    });
  });
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
})();
