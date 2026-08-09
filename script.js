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
    var COUNT = 26;  // bioluminescence : des points, pas des bulles. Voir seed() et render().
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
          r: 0.42 + Math.pow(Math.random(), 2.2) * 0.95,  // des points ; le plus gros fait 1,4
          speed: 0.000042 + Math.random() * 0.00013,
          sway: 0.25 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          depth: Math.random(),                       // 0 = proche, 1 = lointain
          alpha: 0.09 + Math.random() * 0.21,   // moitié de l'ancien maximum
          pulse: 0.00018 + Math.random() * 0.00042,   // chacune respire à son rythme
          pulsePhase: Math.random() * Math.PI * 2,
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

      /* La lumière du jour s'éteint avec la profondeur — c'est le rôle de shafts().
         Celle-ci fait l'inverse : sous la limite photique, la seule lumière restante
         est produite par ce qui vit là. Discrète en surface, présente en bas. */
      var visible = COUNT;
      var luminosity = 0.62 + state.dive * 0.50;

      eased.x += (mouse.x - eased.x) * 0.045;
      eased.y += (mouse.y - eased.y) * 0.045;

      for (var i = 0; i < visible; i++) {
        var p = particles[i];
        var parallax = 1 - p.depth * 0.75;
        var x = p.x * w
          + Math.sin(time * 0.00013 * p.sway + p.phase) * 22 * p.sway
          + eased.x * 26 * parallax;
        var y = p.y * h + eased.y * 16 * parallax;
        var size = p.r * (1.5 - p.depth * 0.5) * 5.2;   // moitié de l'ancienne taille
        var breath = 0.66 + 0.34 * Math.sin(time * p.pulse + p.pulsePhase);

        ctx.globalAlpha = p.alpha * luminosity * breath * (1 - p.depth * 0.4);
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

/* ============================================================================
   Parcours — roue chronologique pilotée par le scroll
   ========================================================================== */
(function(){
  var sec = document.getElementById('parcours');
  if (!sec) return;

  var EXP = [
   {y:"2016",period:"Octobre 2016 → aujourd'hui",role:"Fondatrice et directrice artistique",org:"Atelier Noctis",place:"Indépendante",
    detail:"Une pratique créative indépendante — écriture, photographie, direction artistique — étendue au management d'artistes et au conseil. C'est de là qu'est signé le contrat d'UUHAI avec Napalm Records.",
    gains:["Direction artistique","Écriture","Photographie","Autonomie","Développement d'artistes"]},
   {y:"2019",period:"Janvier 2019 → août 2024",role:"Agent d'artistes et chargée de production et de tournées",org:"Ginger",place:"Amiens",
    detail:"Seule agent et chargée de production pour EDGÄR, UUHAI et Sarah Olivier : booking, négociation de contrats, logistique de tournée. Production de la scène Tremplin Heroes Aesio au festival Retro C Trop — programmation menée par Patti Smith, Alice Cooper et Simple Minds. Production du festival Sama'Rock aux côtés du directeur technique.",
    gains:["Négociation","Gestion de contrats","Logistique","Parties prenantes","Travail sous contrainte"]},
   {y:"2024",period:"Septembre 2024 → septembre 2026",role:"Data Analyst",org:"Orange France",place:"Amiens",contract:"Alternance",
    detail:"Dashboard Power BI du déploiement Fibre Pro conçu de zéro, avec dictionnaires de données et cadres d'indicateurs construits en ateliers avec les métiers. Module de suivi santé au travail cité comme point fort dans le rapport d'audit externe ISO 45001. Dashboard réclamations clients intégrant BigQuery et des API internes, présenté en CODIR. Formations internes Excel, IA générative et PowerPoint.",
    gains:["Power BI","BigQuery / GCP","SQL","Recueil de besoin","Restitution en CODIR","Formation interne"]}
  ];
  var FORM = [
   {y:"2012",period:"2012",role:"Baccalauréat scientifique",org:"Lycée Cadi Ayyad",place:"Marrakech",mention:"Mention assez bien",
    detail:"Spécialité physique-chimie. Le socle scientifique — méthode, raisonnement, aisance avec les nombres — sur lequel tout le reste s'est construit, dix ans avant d'y revenir.",
    gains:["Mathématiques","Physique-chimie","Raisonnement scientifique"]},
   {y:"2014",period:"2014 → 2016",role:"Classe préparatoire aux grandes écoles",org:"Lycée Henri Martin",place:"Saint-Quentin",
    detail:"Lettres, sciences humaines et sociales. Deux ans à lire vite, à trancher, et à défendre une thèse en temps contraint.",
    gains:["Analyse critique","Synthèse","Argumentation","Endurance"]},
   {y:"2016",period:"2016 → 2017",role:"Licence Cinéma et audiovisuel",org:"Université de Picardie Jules Verne",place:"Amiens",
    detail:"L'analyse de l'image et la construction d'un récit — ce qui deviendra, bien plus tard, du data storytelling.",
    gains:["Narration","Analyse de l'image","Montage"]},
   {y:"2017",period:"2017 → 2018",role:"Master Arts numériques et médias",org:"Université de Picardie Jules Verne",place:"Amiens",
    detail:"Théories et pratiques artistiques. Le numérique abordé comme un objet à interroger, pas seulement comme un outil à utiliser.",
    gains:["Théorie critique","Pratiques numériques"]},
   {y:"2018",period:"2018 → 2019",role:"Master Produire, diffuser, administrer, communiquer",org:"Université de Picardie Jules Verne",place:"Amiens",mention:"Mention assez bien",
    detail:"La conduite d'un projet culturel de bout en bout : budget, contrats, diffusion, communication.",
    gains:["Gestion de projet","Budget","Communication"]},
   {y:"2021",period:"2021 → 2022",role:"Master Culture, patrimoine et innovation numérique",org:"Université de Picardie Jules Verne",place:"Amiens",mention:"Mention très bien",
    detail:"Menée en parallèle de l'activité chez Ginger. L'innovation numérique appliquée à un secteur qui n'y était pas préparé — la première fois que je me place entre un métier et une technologie.",
    gains:["Conduite du changement","Médiation technique","Innovation"]},
   {y:"2024",period:"2024 → 2026 · en cours",role:"MSc Data Analysis",org:"OpenClassrooms",place:"Diplôme américain accrédité",
    detail:"Menée de front avec le poste chez Orange. Python, statistiques et machine learning — et douze projets qui constituent ce portfolio.",
    gains:["Python","Statistiques","Machine learning","scikit-learn","Reproductibilité"]}
  ];

  var NS='http://www.w3.org/2000/svg', CX=350, CY=350, R=300, MARK=180;
  var spin=document.getElementById('pkSpin'), lit=document.getElementById('pkLit');
  var entry=document.getElementById('pkEntry');
  var countEl=document.getElementById('pkCount'), totalEl=document.getElementById('pkTotal');
  var gauge=document.getElementById('pkGauge'), gTxt=document.getElementById('pkTxt');
  var bExp=document.getElementById('pkExp'), bForm=document.getElementById('pkForm');
  var data=EXP, mode='exp', idx=-1;

  function step(){ return 360/data.length; }
  function pace(){ return mode==='exp' ? 0.85 : 0.5; }   // course de scroll par cran

  // La rotation n'est pilotée par le scroll que si la scène est épinglée.
  // En dessous, la section redevient un bloc normal : la roue ne bouge plus
  // toute seule, on change de cran en cliquant une année ou le sélecteur.
  var pinnedMQ = window.matchMedia('(min-width:1025px)');
  function pinned(){ return pinnedMQ.matches; }

  function sizeZone(){
    if (pinned()) sec.style.height = ((data.length-1)*pace()+1)*100 + 'vh';
    else sec.style.removeProperty('height');
  }

  function esc(t){ var d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

  function build(){
    spin.innerHTML=''; entry.innerHTML='';
    var st=step();
    data.forEach(function(d,i){
      var a=i*st*Math.PI/180, ux=Math.cos(a), uy=Math.sin(a);
      var g=document.createElementNS(NS,'g');
      var l=document.createElementNS(NS,'line');
      l.setAttribute('x1',CX+ux*(R-16)); l.setAttribute('y1',CY+uy*(R-16));
      l.setAttribute('x2',CX+ux*(R+16)); l.setAttribute('y2',CY+uy*(R+16));
      l.setAttribute('class','pk-notch'); l.dataset.i=i; g.appendChild(l);
      var r=document.createElementNS(NS,'line');
      r.setAttribute('x1',CX+ux*95); r.setAttribute('y1',CY+uy*95);
      r.setAttribute('x2',CX+ux*(R-30)); r.setAttribute('y2',CY+uy*(R-30));
      r.setAttribute('stroke','rgba(172,122,153,.13)'); r.setAttribute('stroke-width','1'); g.appendChild(r);
      var tg=document.createElementNS(NS,'g');
      tg.setAttribute('transform','translate('+(CX+ux*(R+46))+' '+(CY+uy*(R+46))+')');
      tg.dataset.upright='1';
      var t=document.createElementNS(NS,'text');
      t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','middle');
      t.setAttribute('class','pk-ylab'); t.dataset.i=i; t.textContent=d.y;
      t.addEventListener('click', function(){ jumpTo(i); });
      tg.appendChild(t); g.appendChild(tg); spin.appendChild(g);

      var art=document.createElement('article');
      art.className='pk-item'; art.dataset.i=i;
      art.innerHTML='<p class="pk-period">'+esc(d.period)+'</p>'+
        '<h3>'+esc(d.role)+'</h3>'+
        '<p class="pk-org"><b>'+esc(d.org)+'</b> · '+esc(d.place)+
        (d.contract?' <span class="pk-contract">'+esc(d.contract)+'</span>':'')+'</p>'+
        '<p class="pk-detail">'+esc(d.detail)+'</p>'+
        (d.mention?'<span class="pk-mention">'+esc(d.mention)+'</span>':'')+
        '<ul class="pk-gains">'+d.gains.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';
      entry.appendChild(art);
    });
    sizeZone();
  }

  function render(p){
    var n=data.length, st=step();
    var rot = MARK - p*(n-1)*st;
    spin.setAttribute('transform','rotate('+rot+' '+CX+' '+CY+')');
    Array.prototype.forEach.call(spin.querySelectorAll('[data-upright]'), function(g){
      var base=g.getAttribute('transform').split('rotate')[0].trim();
      g.setAttribute('transform', base+' rotate('+(-rot)+')');
    });
    var i=Math.min(n-1, Math.max(0, Math.round(p*(n-1))));
    if (i!==idx){
      idx=i;
      Array.prototype.forEach.call(spin.querySelectorAll('.pk-notch'), function(e){ e.classList.toggle('on', +e.dataset.i===i); });
      Array.prototype.forEach.call(spin.querySelectorAll('.pk-ylab'), function(e){ e.classList.toggle('on', +e.dataset.i===i); });
      Array.prototype.forEach.call(entry.querySelectorAll('.pk-item'), function(e){ e.classList.toggle('on', +e.dataset.i===i); });
      countEl.textContent=i+1;
    }
    totalEl.textContent='sur '+n;
    var C=2*Math.PI*R, seg=C/n*0.52;
    lit.style.strokeDasharray=seg+' '+(C-seg);
    lit.style.strokeDashoffset=seg/2;
    gauge.style.width=(p*100).toFixed(1)+'%';
    gTxt.textContent=(i+1)+' / '+n;
  }

  function progress(){
    var travel=sec.offsetHeight-window.innerHeight;
    if (travel < window.innerHeight * 0.5) return null;   // course trop courte : on ne pilote pas
    return Math.min(1, Math.max(0, (window.scrollY-sec.offsetTop)/travel));
  }
  function onScroll(){
    if (!pinned()) return;
    var p = progress();
    if (p !== null) render(p);
  }

  // position d'un cran, exprimée en avancement 0 → 1
  function posOf(i){ return data.length > 1 ? i/(data.length-1) : 0; }

  function jumpTo(i){
    i = Math.min(data.length-1, Math.max(0, i));
    if (pinned()) {
      var travel=sec.offsetHeight-window.innerHeight;
      window.scrollTo({top: sec.offsetTop + travel*posOf(i), behavior:'smooth'});
    } else {
      render(posOf(i));            // pas de scroll : on tourne la roue sur place
    }
  }

  function setMode(m){
    if (m===mode) return;
    mode=m; data=(m==='exp')?EXP:FORM; idx=-1;
    sec.style.setProperty('--pk-accent', m==='exp' ? 'var(--coral)' : 'var(--anemone)');
    bExp.setAttribute('aria-pressed', m==='exp');
    bForm.setAttribute('aria-pressed', m==='form');
    build();
    if (pinned()) { window.scrollTo({top: sec.offsetTop, behavior:'auto'}); }
    render(0);
  }
  bExp.addEventListener('click', function(){ setMode('exp'); });
  bForm.addEventListener('click', function(){ setMode('form'); });

  window.addEventListener('scroll', function(){ requestAnimationFrame(onScroll); }, {passive:true});
  window.addEventListener('resize', function(){ sizeZone(); refresh(); });

  // au franchissement du seuil, on remet la scène dans un état cohérent
  function onLayoutChange(){ sizeZone(); idx=-1; refresh(); }
  if (pinnedMQ.addEventListener) pinnedMQ.addEventListener('change', onLayoutChange);
  else if (pinnedMQ.addListener) pinnedMQ.addListener(onLayoutChange);

  function refresh(){
    if (pinned()) { var p=progress(); render(p === null ? 0 : p); }
    else { render(posOf(Math.max(0, idx))); }
  }

  build(); refresh();
})();

/* ============================================================================
   Fiches projets — les trois volets deviennent des onglets.
   Amélioration progressive : sans JS, les trois colonnes restent affichées.
   ========================================================================== */
(function(){
  var cards = document.querySelectorAll('.proof .proof-body');
  if (!cards.length) return;

  Array.prototype.forEach.call(cards, function(cols, ci){
    var panels = Array.prototype.slice.call(cols.querySelectorAll('.proof-col'));
    if (panels.length < 2) return;

    var tablist = document.createElement('div');
    tablist.className = 'proof-tabs';
    tablist.setAttribute('role','tablist');
    tablist.setAttribute('aria-label','Volets de la fiche projet');

    var tabs = panels.map(function(panel, i){
      var label = panel.querySelector('.mono-label');
      var name = label ? label.textContent.trim() : 'Volet ' + (i+1);
      if (label) label.remove();                    // le titre passe dans l'onglet

      var id = 'pf-' + ci + '-' + i;
      panel.id = id + '-panel';
      panel.setAttribute('role','tabpanel');
      panel.setAttribute('aria-labelledby', id);
      panel.hidden = i !== 0;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'proof-tab';
      b.id = id;
      b.textContent = name;
      b.setAttribute('role','tab');
      b.setAttribute('aria-controls', panel.id);
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.tabIndex = i === 0 ? 0 : -1;
      tablist.appendChild(b);
      return b;
    });

    function select(i){
      tabs.forEach(function(b, k){
        var on = k === i;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
    }

    tabs.forEach(function(b, i){
      b.addEventListener('click', function(){ select(i); });
      b.addEventListener('keydown', function(e){
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i+1) % tabs.length;
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   n = (i-1+tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End')  n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault(); select(n); tabs[n].focus();
      });
    });

    cols.parentNode.insertBefore(tablist, cols);
    cols.classList.add('is-tabbed');
  });
})();
