/* ============================================================================
   Kawtar Belkacemi — Data Analyst
   1. Plongée      : progression du scroll → variable CSS --dive + rail
   2. Dérive       : particules en suspension, se raréfiant avec la profondeur
   3. Révélations  : apparition des blocs à l'entrée dans le champ
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Profondeur courante, 0 en surface → 1 dans l'abysse.
  // Partagée entre les modules pour éviter de relire le style calculé à chaque image.
  var state = { dive: 0 };

  /* ======================================================================
     1. Plongée
     ==================================================================== */
  (function dive() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[data-depth]'));
    if (!sections.length) return;

    var depthEl = document.getElementById('railDepth');
    var zoneEl = document.getElementById('railZone');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.links a'));
    var ticking = false;
    var lastZone = '';
    var lastDepth = -1;

    function format(metres) {
      return '−' + String(Math.round(metres)).padStart(4, '0') + ' m';
    }

    /* offsetTop est relatif au premier ancêtre positionné — ici <main> — et non au
       document. On mesure donc les sections dans le repère du document, et on
       remesure quand la mise en page bouge. */
    var tops = [];
    function measure() {
      tops = sections.map(function (el) {
        return el.getBoundingClientRect().top + window.scrollY;
      });
    }

    function update() {
      ticking = false;

      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      progress = Math.min(1, Math.max(0, progress));
      state.dive = progress;
      root.style.setProperty('--dive', progress.toFixed(4));

      // Section courante : celle qui contient le tiers haut de la fenêtre
      var probe = window.scrollY + window.innerHeight * 0.34;
      var index = 0;
      for (var i = 0; i < sections.length; i++) {
        if (tops[i] <= probe) index = i;
      }

      var current = sections[index];
      var from = parseFloat(current.getAttribute('data-depth'));
      var next = sections[index + 1];
      var to = next ? parseFloat(next.getAttribute('data-depth')) : from + 220;
      // La profondeur se lit sur le haut de la fenêtre : à scroll nul, on est à −0000 m
      var end = next ? tops[index + 1] : document.documentElement.scrollHeight;
      var span = end - tops[index];
      var within = span > 0 ? (window.scrollY - tops[index]) / span : 0;
      within = Math.min(1, Math.max(0, within));

      var metres = from + (to - from) * within;
      if (depthEl && Math.round(metres) !== lastDepth) {
        lastDepth = Math.round(metres);
        depthEl.textContent = format(metres);
      }

      var zone = current.getAttribute('data-zone') || '';
      if (zoneEl && zone !== lastZone) {
        lastZone = zone;
        zoneEl.textContent = zone;
      }

      var id = current.id;
      for (var j = 0; j < navLinks.length; j++) {
        navLinks[j].classList.toggle('current', navLinks[j].getAttribute('href') === '#' + id);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function remeasure() {
      measure();
      update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', remeasure, { passive: true });
    // Les polices arrivent après le premier calcul : elles déplacent tout le document.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    remeasure();
  })();

  /* ======================================================================
     2. Dérive — particules en suspension
     ==================================================================== */
  (function drift() {
    var canvas = document.getElementById('drift');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particles = [];
    var COUNT = 130;
    var mouse = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };
    var running = true;
    var frame = null;

    // Sprites pré-rendus : bien moins coûteux qu'un dégradé radial par image
    function sprite(rgb) {
      var size = 64;
      var c = document.createElement('canvas');
      c.width = c.height = size;
      var g = c.getContext('2d');
      var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(' + rgb + ',1)');
      grad.addColorStop(0.34, 'rgba(' + rgb + ',0.36)');
      grad.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      return c;
    }

    var sprites = [
      sprite('224,213,239'),  // Japan Blush
      sprite('198,168,200'),  // Tea Towel
      sprite('170,93,96')     // Italian Villa
    ];

    function seed() {
      particles = [];
      for (var i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.5 + Math.pow(Math.random(), 3.2) * 3.4,   // beaucoup de fines, quelques grosses
          speed: 0.000055 + Math.random() * 0.00019,
          sway: 0.25 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          depth: Math.random(),                       // 0 = proche, 1 = lointain
          alpha: 0.16 + Math.random() * 0.5,
          tint: sprites[(Math.random() * sprites.length) | 0]
        });
      }
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildShafts();
    }

    /* Puits de lumière traversant l'eau. Ils s'éteignent à mesure qu'on descend :
       la lumière du jour ne franchit pas la zone photique.
       Pré-rendus une fois par redimensionnement, flous compris — appliquer un flou
       à quatre grands polygones à chaque image coûterait bien trop cher. */
    var shaftLayer = null;

    function buildShafts() {
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      var g = c.getContext('2d');
      if (g.filter !== undefined) g.filter = 'blur(20px)';

      var ox = w * 0.74;
      var oy = -h * 0.42;
      var length = h * 2.4;

      for (var i = 0; i < 4; i++) {
        var half = 24 + i * 15;
        g.save();
        g.translate(ox, oy);
        g.rotate(-0.40 + i * 0.125);

        var grad = g.createLinearGradient(0, 0, 0, length);
        grad.addColorStop(0, 'rgba(224,213,239,.20)');
        grad.addColorStop(0.45, 'rgba(198,168,200,.075)');
        grad.addColorStop(1, 'rgba(198,168,200,0)');
        g.fillStyle = grad;

        g.beginPath();
        g.moveTo(-half, 0);
        g.lineTo(half, 0);
        g.lineTo(half * 4.6, length);
        g.lineTo(-half * 4.6, length);
        g.closePath();
        g.fill();
        g.restore();
      }
      shaftLayer = c;
    }

    function shafts(time) {
      var fade = Math.max(0, 1 - state.dive * 2.4);
      if (fade <= 0.002 || !shaftLayer) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = fade;
      ctx.drawImage(shaftLayer, Math.sin(time * 0.00007) * 16, 0, w, h);
      ctx.restore();
    }

    function render(time) {
      ctx.clearRect(0, 0, w, h);
      shafts(time);

      // Plus on descend, moins il y a de matière en suspension et moins elle brille
      var visible = Math.round(COUNT * (1 - state.dive * 0.55));
      var luminosity = 1 - state.dive * 0.45;

      eased.x += (mouse.x - eased.x) * 0.045;
      eased.y += (mouse.y - eased.y) * 0.045;

      for (var i = 0; i < visible; i++) {
        var p = particles[i];
        var parallax = 1 - p.depth * 0.75;
        var x = p.x * w
          + Math.sin(time * 0.00013 * p.sway + p.phase) * 22 * p.sway
          + eased.x * 26 * parallax;
        var y = p.y * h + eased.y * 16 * parallax;
        var size = p.r * (1.6 - p.depth * 0.6) * 3.4;

        ctx.globalAlpha = p.alpha * luminosity * (1 - p.depth * 0.45);
        ctx.drawImage(p.tint, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    function step(time) {
      // Les particules remontent : c'est nous qui descendons
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed * 16.7 * (1.6 - p.depth);
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      }
      render(time);
      if (running) frame = window.requestAnimationFrame(step);
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }, { passive: true });

    if (!reduceMotion) {
      window.addEventListener('pointermove', function (e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          running = false;
          if (frame) window.cancelAnimationFrame(frame);
        } else if (!running) {
          running = true;
          frame = window.requestAnimationFrame(step);
        }
      });
    }

    resize();
    seed();

    if (reduceMotion) {
      render(0);                                     // une seule image, figée
      window.addEventListener('resize', function () { resize(); render(0); }, { passive: true });
    } else {
      frame = window.requestAnimationFrame(step);
    }
  })();

  /* ======================================================================
     3. Révélations
     ==================================================================== */
  (function reveals() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    // Les filets des statistiques se tirent pour leur propre compte : une fiche projet
    // fait plus de 700 px de haut, la déclencher entière allumerait les chiffres
    // bien avant qu'ils n'arrivent à l'écran.
    var stats = Array.prototype.slice.call(document.querySelectorAll('.stat-row .stat'));

    if (reduceMotion || !('IntersectionObserver' in window)) {
      blocks.forEach(function (el) { el.classList.add('in'); });
      stats.forEach(function (el) { el.classList.add('drawn'); });
      return;
    }

    // Décalage progressif entre voisins immédiats : le regard suit une vague
    blocks.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentNode.children, function (n) {
        return n.classList && n.classList.contains('reveal');
      });
      var rank = siblings.indexOf(el);
      if (rank > 0) el.style.transitionDelay = Math.min(rank * 90, 320) + 'ms';
    });

    function watch(items, className, options) {
      if (!items.length) return;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        });
      }, options);
      items.forEach(function (el) { observer.observe(el); });
    }

    watch(blocks, 'in', { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    watch(stats, 'drawn', { threshold: 0.7, rootMargin: '0px 0px -10% 0px' });
  })();

})();
