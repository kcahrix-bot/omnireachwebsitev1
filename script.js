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

    var routes = el('g', {}, svg), chans = el('g', {}, svg);
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
    var layerEl = document.createElement('div');
    layerEl.className = 'flow-layer';
    gtmBox.appendChild(layerEl);
    var set = { box: gtmBox, W: W, items: [] }, r = vertical ? 9 : 11;
    for (var n = 0; n < (vertical ? 6 : 12); n++) {
      var i = n % 6;
      var av = document.createElement('span');
      av.className = 'flow-item gtm-av';
      av.style.setProperty('--size', (2 * r / W * 100).toFixed(3) + 'cqw');
      av.innerHTML = '<span class="gtm-av__cold"></span><span class="gtm-av__warm"></span><svg viewBox="0 0 24 24"><use href="#i-user"/></svg>';
      layerEl.appendChild(av);
      set.items.push({ node: av, path: paths[i], dur: 6000, delay: -(i + (n >= 6 ? 3 : 0)) * 1000, fade: [0.06, 0.9], warm: $('.gtm-av__warm', av), rest: 0.14 + i * 0.13 + (n >= 6 ? 0.06 : 0) });
    }
    startFlow(set);
  }

  /* ---------- Travellers along SVG paths ----------
     Moving dots/cards are HTML layered over the SVG and animated with transform/opacity
     (Web Animations API), so the browser composites them on the GPU instead of re-laying-out
     the SVG every frame the way SVG <animateMotion> does. Paths are sampled at constant speed. */
  var flowSets = [];
  function startFlow(set) {
    if (flowSets.indexOf(set) < 0) flowSets.push(set);
    // drop sets whose box was rebuilt
    flowSets = flowSets.filter(function (s) { return s === set || s.box.isConnected && s.items.every(function (it) { return it.node.isConnected; }); });
    var scale = set.box.clientWidth / set.W;
    if (!scale) return;
    set.items.forEach(function (it) {
      var len, pts = [];
      try { len = it.path.getTotalLength(); } catch (e) { return; }
      var N = 48;
      for (var k = 0; k <= N; k++) {
        var pt = it.path.getPointAtLength(len * k / N);
        pts.push({ transform: 'translate3d(' + (pt.x * scale).toFixed(1) + 'px,' + (pt.y * scale).toFixed(1) + 'px,0) translate(-50%,-50%)' });
      }
      var keep = it.move ? it.move.currentTime : null;
      (it.anims || []).forEach(function (a) { a.cancel(); });
      if (reduced) {
        // one calm, still frame: each traveller parked partway along its route
        it.node.style.transform = pts[Math.round(N * it.rest)].transform;
        it.node.style.opacity = 1;
        if (it.warm) it.warm.style.opacity = it.rest > 0.53 ? 1 : 0;
        return;
      }
      var timing = { duration: it.dur, delay: it.delay, iterations: Infinity, easing: 'linear', fill: 'backwards' };
      it.move = it.node.animate(pts, timing);
      var fade = it.node.animate([{ opacity: 0 }, { opacity: 1, offset: it.fade[0] }, { opacity: 1, offset: it.fade[1] }, { opacity: 0 }], timing);
      it.anims = [it.move, fade];
      if (it.warm) it.anims.push(it.warm.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.56 }, { opacity: 1 }], timing));
      it.anims.forEach(function (a) { a.id = 'flow'; if (keep !== null) a.currentTime = keep; });
    });
  }
  var flowTimer;
  window.addEventListener('resize', function () {
    clearTimeout(flowTimer);
    flowTimer = setTimeout(function () { flowSets.forEach(startFlow); }, 150);
  });

  // hero VSL preview: content packets travel from the founder to each platform; thoughts orbit
  var vslFrame = $('.vsl__frame');
  if (vslFrame) {
    var vsvg = $('.vsl__art', vslFrame), vlayer = $('.vsl__flow', vslFrame);
    var vset = { box: vslFrame, W: 960, items: [] };
    ['vp1', 'vp2', 'vp3', 'vp4'].forEach(function (id, k) {
      var pk = document.createElement('span');
      pk.className = 'flow-item vsl__packet';
      pk.innerHTML = '<svg viewBox="-19 -14 38 28"><rect x="-17" y="-12" width="34" height="24" rx="6"/>' +
        (k % 2 ? '<path class="fill" d="M-4 -5l8 5-8 5z"/>' : '<path d="M-8 -3h16M-8 3h10"/>') + '</svg>';
      vlayer.appendChild(pk);
      vset.items.push({ node: pk, path: vsvg.querySelector('#' + id), dur: 3600, delay: -k * 900, fade: [0.12, 0.85], rest: 0.35 + k * 0.12 });
    });
    startFlow(vset);
  }

  if (gtmBox) {
    var gtmQuery = window.matchMedia('(max-width: 700px)');
    buildGTM(gtmQuery.matches);
    gtmQuery.addEventListener('change', function () { buildGTM(gtmQuery.matches); });
  }

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

  /* ---------- Scroll-driven scenes ----------
     Geometry is measured once (and again only when the layout changes), so scrolling
     never forces a layout: each frame reads scrollY and writes transform/opacity only,
     and only for scenes that are near the viewport and whose progress has changed. */
  var vh = window.innerHeight, vw = window.innerWidth;
  var scenes = [];
  function addScene(sel, opts) {
    var node = $(sel);
    if (!node) return null;
    var s = { el: node, sticky: !!opts.sticky, render: opts.render, measure: opts.measure, top: 0, h: 0, last: -1 };
    scenes.push(s);
    return s;
  }
  function progressOf(s, y) {
    if (s.sticky) return clamp((y - s.top) / Math.max(1, s.h - vh)); // 0 when it pins, 1 when it unpins
    return clamp((y + vh - s.top) / (vh + s.h));                       // passing through the viewport
  }
  function measureAll() {
    vh = window.innerHeight; vw = window.innerWidth;
    var y = window.scrollY;
    scenes.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      s.top = r.top + y; s.h = r.height; s.last = -1;
      if (s.measure) s.measure.call(s);
    });
  }

  if (!reduced) {
    // 2. proof rail drifts sideways as you scroll
    var track = $('.rail__track'), railW = 0, trackW = 0;
    addScene('[data-scene="rail"]', {
      measure: function () { railW = this.el.clientWidth; trackW = track.scrollWidth; },
      render: function (p) {
        var over = trackW - railW;
        track.style.transform = 'translate3d(' + (over > 0 ? -over * p : 0).toFixed(1) + 'px,0,0)';
      }
    });

    // 4. Founder B accumulates signals; Founder A stays still
    var rungs = $$('.ladder:not(.ladder--static) li'), lastCount = -1;
    addScene('.ladder:not(.ladder--static)', {
      render: function (p) {
        var count = Math.round(clamp((p - 0.22) / 0.5) * rungs.length);
        if (count === lastCount) return;
        lastCount = count;
        rungs.forEach(function (li, i) { li.classList.toggle('on', i < count); });
      }
    });

    // 7. engine: five steps pinned to scroll
    var engine = $('[data-scene="engine"]');
    if (engine) {
      var eStage = $('.engine__stage', engine), eSteps = $$('.step', engine), eBar = $('.engine__progress span', engine), eStep = 0, eLive = null;
      addScene('[data-scene="engine"]', {
        sticky: true,
        render: function (p, y) {
          var live = y > this.top - vh * 0.5;
          if (live !== eLive) { eLive = live; engine.classList.toggle('is-live', live); }
          var step = Math.min(5, Math.floor(p * 5) + 1);
          if (step !== eStep) {
            eStep = step;
            eStage.setAttribute('data-step', String(step));
            eSteps.forEach(function (st, i) { st.classList.toggle('is-active', i === step - 1); });
          }
          eBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        }
      });
    }

    // 11. 1,000,000 breaks apart into what it actually means
    var burst = $('[data-scene="burst"]');
    if (burst) {
      var bBox = $('.burst', burst), digits = $$('.burst__num span', burst), words = $$('.burst__word', burst), num = $('.burst__num', burst);
      var bW = 0, bH = 0;
      var WIDE = [[17, 18], [50, 9], [83, 18], [12, 50], [88, 50], [17, 82], [50, 91], [83, 82], [50, 50]];
      var NARROW = [[30, 8], [70, 19], [30, 30], [70, 41], [30, 61], [70, 72], [30, 83], [70, 94], [50, 50]];
      addScene('[data-scene="burst"]', {
        sticky: true,
        measure: function () { bW = bBox.clientWidth; bH = bBox.clientHeight; },
        render: function (p) {
          var t = smooth((p - 0.08) / 0.5);
          num.style.transform = 'scale(' + (1 - 0.25 * t).toFixed(3) + ')';
          digits.forEach(function (d, i) {
            var dx = (i - 4) * 46 + Math.sin(i * 2.1) * 40, dy = Math.cos(i * 1.7) * 140;
            d.style.transform = 'translate3d(' + (dx * t).toFixed(1) + 'px,' + (dy * t).toFixed(1) + 'px,0) rotate(' + ((i % 2 ? 1 : -1) * 18 * t).toFixed(1) + 'deg)';
            d.style.opacity = clamp(1 - t * 1.3).toFixed(3);
          });
          var pos = vw < 700 ? NARROW : WIDE, tw = clamp((p - 0.25) / 0.55);
          words.forEach(function (w, k) {
            var o = smooth(tw * 1.7 - k * 0.08);
            var x = (pos[k][0] - 50) / 100 * bW * o, yy = (pos[k][1] - 50) / 100 * bH * o;
            w.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0) scale(' + (0.85 + 0.15 * o).toFixed(3) + ')';
            w.style.opacity = o.toFixed(3);
          });
        }
      });
    }
  }

  // 3. opportunity: ideas spiral out, become platforms, then reach the market
  var opp = $('[data-scene="opp"]');
  if (opp) {
    var stage = $('.opp__stage', opp), R = 0, small = false;
    var ideas = $$('.node--idea', stage), plats = $$('.node--platform', stage), market = $$('.node--market', stage);
    var phases = $$('.phase', opp), lastPhase = -1;
    var place = function (n, x, y, s, o) {
      n.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
      n.style.opacity = o.toFixed(3);
    };
    var renderOpp = function (p, staticLayout) {
      var TAU = Math.PI * 2;
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
        var tp = platPos[i % 4];
        place(n, lerp(Math.cos(a) * rr, tp[0], tB), lerp(Math.sin(a) * rr, tp[1], tB), (0.7 + 0.3 * tA) * (1 - 0.5 * tB), tA * (1 - tB));
      });
      var tP = staticLayout ? 1 : smooth((p - 0.42) / 0.1);
      plats.forEach(function (n, j) { place(n, platPos[j][0], platPos[j][1], 0.8 + 0.2 * tP, tP); });
      var tC = staticLayout ? 1 : smooth((p - 0.68) / 0.22);
      market.forEach(function (n, k) {
        var a = k / market.length * TAU - Math.PI / 2 + (1 - tC) * -0.9;
        var rr = staticLayout ? R * (small ? 0.84 : 0.9) : R * lerp(0.5, small ? 0.8 : 0.88, tC);
        place(n, Math.cos(a) * rr, Math.sin(a) * rr, 0.85 + 0.15 * tC, tC);
      });
      if (!staticLayout) {
        var ph = p < 0.4 ? 0 : p < 0.68 ? 1 : 2;
        if (ph !== lastPhase) { lastPhase = ph; phases.forEach(function (li, i) { li.classList.toggle('is-active', i === ph); }); }
      }
    };
    var measureOpp = function () { R = stage.clientWidth / 2; small = stage.clientWidth < 460; };
    if (reduced) {
      var staticOpp = function () { measureOpp(); renderOpp(1, true); };
      staticOpp();
      window.addEventListener('resize', staticOpp);
    } else {
      addScene('[data-scene="opp"]', { sticky: true, measure: measureOpp, render: function (p) { renderOpp(p, false); } });
    }
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY;
    onHeader();
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (y + vh < s.top - vh * 0.5 || y > s.top + s.h + vh * 0.5) continue; // far from view: skip entirely
      var p = progressOf(s, y);
      if (p === s.last) continue;
      s.last = p;
      s.render(p, y);
    }
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function remeasure() { measureAll(); requestFrame(); }
  var remeasureTimer;
  function remeasureSoon() { clearTimeout(remeasureTimer); remeasureTimer = setTimeout(remeasure, 120); }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', remeasureSoon);
  // anything that changes the page height (fonts, FAQ, diagram rebuilds, the booking widget) re-measures
  if ('ResizeObserver' in window) new ResizeObserver(remeasureSoon).observe($('main'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  measureAll();
  frame();

  /* ---------- Pause looping animations while they're off-screen ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    var animIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var off = !en.isIntersecting;
        en.target.classList.toggle('is-paused', off);
        if (en.target.getAnimations) en.target.getAnimations({ subtree: true }).forEach(function (a) {
          if (a.id === 'flow') { if (off) a.pause(); else a.play(); }
        });
      });
    }, { rootMargin: '120px 0px' });
    $$('[data-anim]').forEach(function (n) { animIO.observe(n); });
  }

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

  /* ---------- Cal.com booking widget ----------
     Loaded only when the booking section approaches (or a "See If You Qualify" link is used),
     so the calendar never slows down the top of the page. */
  var calBox = $('#cal-booking');
  if (calBox) {
    var calStarted = false;
    var loadCal = function () {
      if (calStarted) return;
      calStarted = true;
      // official Cal.com embed loader
      (function (C, A, L) {
        var p = function (a, ar) { a.q.push(ar); };
        var d = C.document;
        C.Cal = C.Cal || function () {
          var cal = C.Cal, ar = arguments;
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
          if (ar[0] === L) {
            var api = function () { p(api, arguments); };
            var namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); }
            else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(window, 'https://app.cal.com/embed/embed.js', 'init');

      // Prefill whatever we already know. Links in outbound emails can carry details,
      // e.g. ?name=Jane%20Doe&email=jane@acme.com, plus utm_* campaign tags.
      var q = new URLSearchParams(window.location.search);
      var config = { layout: 'month_view', theme: 'dark', 'metadata[source]': 'omnireach-landing-page' };
      ['name', 'email', 'notes', 'guests'].forEach(function (k) { if (q.get(k)) config[k] = q.get(k); });
      q.forEach(function (v, k) { if (/^utm_/.test(k)) config[k] = v; });

      window.Cal('init', 'audit', { origin: 'https://cal.com' });
      window.Cal.ns.audit('inline', { elementOrSelector: '#cal-booking', calLink: 'k-c-gd52m2/30min', config: config });
      window.Cal.ns.audit('ui', { theme: 'dark', styles: { body: { background: 'transparent' } }, cssVarsPerTheme: { dark: { 'cal-brand': '#2ee8cf' } }, hideEventTypeDetails: false, layout: 'month_view' });
      window.Cal.ns.audit('on', { action: 'linkReady', callback: function () { calBox.classList.add('is-ready'); calBox.removeAttribute('aria-busy'); } });
      window.Cal.ns.audit('on', { action: 'linkFailed', callback: function () { calBox.classList.add('is-slow'); } });
      setTimeout(function () { if (!calBox.classList.contains('is-ready')) calBox.classList.add('is-slow'); }, 12000);
    };
    if ('IntersectionObserver' in window) {
      var calIO = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { calIO.disconnect(); loadCal(); }
      }, { rootMargin: '1200px 0px' });
      calIO.observe(calBox);
    } else {
      loadCal();
    }
    $$('a[href="#apply"]').forEach(function (a) { a.addEventListener('click', loadCal); });
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
