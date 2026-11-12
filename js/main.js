(() => {
  "use strict";
  const D = window.ARTHUR;
  const SFX = window.SFX;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = new Intl.NumberFormat("fr-FR");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = n => String(n).padStart(2, "0");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  const birth = new Date(D.naissance);
  const majority = new Date(birth);
  majority.setFullYear(birth.getFullYear() + 18);
  const forceDay = /[?&]jourj\b/.test(location.search);
  const isBirthdayPassed = () => forceDay || Date.now() >= majority;

  /* =================================================================
     CONFETTIS
     ================================================================= */
  const cCanvas = $("#confetti"), cCtx = cCanvas.getContext("2d");
  let pieces = [], cRaf = null;
  const COLORS = ["#e30613", "#ffffff", "#0b1640", "#f5c542", "#3a5bd9"];
  function sizeConfetti() { cCanvas.width = innerWidth * devicePixelRatio; cCanvas.height = innerHeight * devicePixelRatio; }
  addEventListener("resize", sizeConfetti); sizeConfetti();
  function confetti(n = 160, colors = COLORS) {
    if (reduceMotion) return;
    const w = cCanvas.width, h = cCanvas.height;
    for (let i = 0; i < n; i++) pieces.push({
      x: Math.random() * w, y: -20 - Math.random() * h * 0.4, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
      s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0], t: Math.random() * 100,
    });
    if (!cRaf) cRaf = requestAnimationFrame(cTick);
  }
  function cTick() {
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    pieces = pieces.filter(p => p.y < cCanvas.height + 40);
    for (const p of pieces) {
      p.t++; p.x += p.vx + Math.sin(p.t / 12); p.y += p.vy; p.r += p.vr;
      cCtx.save(); cCtx.translate(p.x, p.y); cCtx.rotate(p.r); cCtx.scale(1, Math.cos(p.t / 8));
      cCtx.fillStyle = p.c; cCtx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cCtx.restore();
    }
    cRaf = pieces.length ? requestAnimationFrame(cTick) : null;
  }

  /* =================================================================
     TOAST
     ================================================================= */
  let toastTimer;
  function toast(msg, ms = 2800) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  /* =================================================================
     SON
     ================================================================= */
  const soundBtn = $("#soundToggle");
  function setSound(v) {
    SFX.setEnabled(v);
    soundBtn.innerHTML = v
      ? '<svg class="ico" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
      : '<svg class="ico" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    soundBtn.setAttribute("aria-pressed", String(v));
    soundBtn.setAttribute("aria-label", v ? "Couper le son" : "Activer le son");
  }
  setSound(false);
  soundBtn.addEventListener("click", () => { setSound(!SFX.enabled); if (SFX.enabled) SFX.whistle(); });

  /* =================================================================
     INTRO : LE TUNNEL
     ================================================================= */
  const intro = $("#intro");
  const hero = $("#accueil");
  const jersey = $("#jersey");
  // titre révélé lettre par lettre (le texte complet reste lisible par les lecteurs d'écran)
  const introTitle = $("#introTitle");
  if (introTitle) {
    const txt = introTitle.textContent.trim();
    let n = 0;
    introTitle.innerHTML = `<span class="intro__sr">${txt}</span>` + txt.split(" ").map(w =>
      `<span class="w" aria-hidden="true">${[...w].map(ch => `<span class="c" style="--i:${n++}">${ch}</span>`).join("")}</span>`).join(" ");
  }
  // tant que l'intro est affichée, le reste de la page n'est pas atteignable au clavier
  const behindIntro = $$("body > header, body > main, body > footer, body > nav, body > button");
  const setBehind = v => behindIntro.forEach(el => (el.inert = v));
  let entered = false;
  function enter(withSound) {
    if (entered) return; entered = true;
    setSound(withSound);
    SFX.whistle();
    intro.classList.add("leaving");
    setTimeout(() => {
      setBehind(false);
      document.body.classList.remove("locked");
      document.body.classList.add("entered");
      if (!reduceMotion) {
        // « clac » des projecteurs qui s'allument l'un après l'autre
        setTimeout(() => SFX.kick(0.55), 1250);
        setTimeout(() => SFX.kick(0.5), 1600);
      }
      setTimeout(() => { confetti(140); SFX.cheer(0.8); }, reduceMotion ? 300 : 2900);
    }, reduceMotion ? 150 : 650);
    setTimeout(() => intro.remove(), reduceMotion ? 900 : 1500);
  }
  $("#enterSound").addEventListener("click", () => enter(true));
  $("#enterMute").addEventListener("click", () => enter(false));
  // lien direct vers une section : on saute l'intro
  if (location.hash && location.hash.length > 1) {
    intro.remove(); entered = true;
    document.body.classList.remove("locked"); document.body.classList.add("entered");
  } else setBehind(true);

  /* =================================================================
     HERO : PROFONDEUR, PARALLAXE ET ÉCLAIRAGE DU MAILLOT
     ================================================================= */
  if (!reduceMotion) {
    const spot = $("#jsSpot");
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, heroOn = true, lastSy = -1, sRaf = 0;
    const setVar = (el, k, v) => el.style.setProperty(k, v);
    function frame() {
      raf = 0;
      cx += (tx - cx) * 0.075; cy += (ty - cy) * 0.075;
      setVar(hero, "--mx", cx.toFixed(3)); setVar(hero, "--my", cy.toFixed(3));
      setVar(jersey, "--ry", (cx * 14).toFixed(2) + "deg"); setVar(jersey, "--rx", (-cy * 9).toFixed(2) + "deg");
      // la lumière glisse sur le maillot du côté de la souris
      spot.setAttribute("cx", (200 + cx * 200).toFixed(1));
      spot.setAttribute("cy", (190 + cy * 170).toFixed(1));
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(frame);
    }
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      addEventListener("pointermove", e => {
        if (!heroOn) return;
        tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1;
        if (!raf) raf = requestAnimationFrame(frame);
      }, { passive: true });
      document.documentElement.addEventListener("pointerleave", () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(frame); });
    }
    addEventListener("scroll", () => {
      if (sRaf) return;
      sRaf = requestAnimationFrame(() => {
        sRaf = 0;
        const y = Math.round(Math.min(Math.max(scrollY, 0), hero.offsetHeight));
        if (y !== lastSy) { lastSy = y; setVar(hero, "--sy", y); }
      });
    }, { passive: true });
    // hors écran : on met en pause les animations du hero
    new IntersectionObserver(([en]) => {
      heroOn = en.isIntersecting; hero.classList.toggle("is-off", !heroOn);
    }).observe(hero);
  }

  /* =================================================================
     HERO : COMPTE À REBOURS (TABLEAU D'AFFICHAGE À VOLETS)
     ================================================================= */
  const board = $("#countdown");
  const units = {};
  $$(".cdboard__digits", board).forEach(el => (units[el.dataset.unit] = { el, cards: [] }));
  function makeCard() {
    const el = document.createElement("span");
    el.className = "cdflip";
    el.innerHTML = '<span class="cdflip__t"><b></b></span><span class="cdflip__b"><b></b></span><span class="cdflip__ft"><b></b></span><span class="cdflip__fb"><b></b></span>';
    const [t, b, ft, fb] = $$("b", el);
    const card = { el, t, b, ft, fb, v: null };
    el.lastElementChild.addEventListener("animationend", () => { b.textContent = card.v; el.classList.remove("go"); });
    return card;
  }
  function setCard(card, v, animate) {
    if (card.v === v) return;
    const old = card.v;
    card.v = v;
    if (!animate || old == null) { card.t.textContent = card.b.textContent = card.ft.textContent = card.fb.textContent = v; return; }
    // volet du haut : ancienne valeur qui tombe ; volet du bas : nouvelle valeur qui se pose
    card.t.textContent = v; card.fb.textContent = v; card.ft.textContent = old; card.b.textContent = old;
    card.el.classList.remove("go"); void card.el.offsetWidth; card.el.classList.add("go");
  }
  function setUnit(u, str, animate) {
    const U = units[u];
    while (U.cards.length < str.length) { const c = makeCard(); U.cards.unshift(c); U.el.prepend(c.el); }
    while (U.cards.length > str.length) U.cards.shift().el.remove();
    [...str].forEach((ch, i) => setCard(U.cards[i], ch, animate));
  }
  const plural = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;
  let cdLabel = "", cdDone = false;
  function updateCountdown() {
    const diff = forceDay ? 0 : majority - Date.now();
    if (diff > 0) {
      const s = Math.floor(diff / 1000);
      const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
      const anim = entered && !reduceMotion && !document.hidden;
      setUnit("d", pad(d), anim); setUnit("h", pad(h), anim); setUnit("m", pad(m), anim); setUnit("s", pad(s % 60), anim);
      const label = `Coup d'envoi dans ${plural(d, "jour")}, ${plural(h, "heure")} et ${plural(m, "minute")}`;
      if (label !== cdLabel) board.setAttribute("aria-label", (cdLabel = label));
    } else {
      board.classList.add("done");
      const days = Math.floor(-diff / 86400000);
      $("#heroSub").innerHTML = days === 0
        ? "<strong>C'EST AUJOURD'HUI ! JOYEUX ANNIVERSAIRE ARTHUR !</strong>"
        : `Tu es majeur depuis <strong>${fmt.format(days)}</strong> jour${days > 1 ? "s" : ""}`;
      cdDone = true;
    }
  }
  (function cdLoop() {
    updateCountdown();
    if (!cdDone) setTimeout(cdLoop, 1000 - (Date.now() % 1000) + 15);
  })();

  /* =================================================================
     HERO : LE BALLON
     ================================================================= */
  $("#heroBallInner").innerHTML = FIG.ballSVG();
  const flashes = $("#flashes");
  function burstFlashes() {
    if (reduceMotion) return;
    const frag = document.createDocumentFragment(), made = [];
    for (let i = 0; i < 18; i++) {
      const f = document.createElement("i");
      f.className = "burst";
      f.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--delay:${(0.35 + Math.random() * 0.9).toFixed(2)}s`;
      frag.appendChild(f); made.push(f);
    }
    flashes.appendChild(frag);
    setTimeout(() => made.forEach(f => f.remove()), 2600);
  }
  $("#heroBall").addEventListener("click", e => {
    const b = e.currentTarget;
    b.classList.remove("kick"); void b.offsetWidth; b.classList.add("kick");
    hero.classList.remove("hero--goal"); void hero.offsetWidth; hero.classList.add("hero--goal");
    SFX.kick();
    burstFlashes();
    setTimeout(() => { confetti(120); SFX.cheer(); toast("GOOOOOAAAAL !"); }, 500);
    dispatchEvent(new Event("ball-kick"));
  });

  flashes.innerHTML = Array.from({ length: 28 }, () =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--d:${(3 + Math.random() * 5).toFixed(1)}s;--delay:-${(Math.random() * 8).toFixed(1)}s"></i>`).join("");
  const tickerItems = ["JOYEUX ANNIVERSAIRE ARTHUR", "18 ANS", "20.12.2008", "ALLEZ PARIS", "LE MEILLEUR RESTE À JOUER", "FOOT · TENNIS · MULTISPORT"];
  const tk = tickerItems.map(t => `<span>${t}</span><i class="ticker__sep"></i>`).join("");
  $("#ticker").innerHTML = tk + tk;

  /* =================================================================
     EASTER EGGS CLAVIER
     ================================================================= */
  let keys = "";
  const EGGS = {
    psg: () => { confetti(300, ["#0b1640", "#e30613", "#ffffff"]); SFX.cheer(); toast("ALLEZ PARIS !"); },
    arthur: () => { confetti(200, ["#f5c542", "#ffffff"]); SFX.fanfare(); toast("Le GOAT, c'est toi."); },
    ace: () => { confetti(150, ["#d7ff3a", "#ffffff", "#c8643b"]); SFX.kick(2); toast("ACE ! Service gagnant."); },
  };
  addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    keys = (keys + e.key.toLowerCase()).slice(-10);
    for (const k in EGGS) if (keys.endsWith(k)) { EGGS[k](); keys = ""; }
  });

  /* =================================================================
     MENU « PROGRAMME DU MATCH »
     ================================================================= */
  const menu = $("#menu"), menuBtn = $("#menuBtn");
  const menuSections = $$("[data-menu]");
  const arrowIco = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  $("#menuList").innerHTML = menuSections.map((s, i) =>
    `<li style="--i:${i}"><a href="#${s.id}"><small>${pad(i)}</small><span>${s.dataset.menu}</span>${arrowIco}</a></li>`).join("");
  const menuLinks = $$("#menuList a");
  $("#menuList").style.setProperty("--rows", Math.ceil(menuLinks.length / 2));
  let menuTimer;
  function currentSection() {
    let cur = menuSections[0];
    for (const s of menuSections) if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s;
    return cur;
  }
  function setMenu(open) {
    clearTimeout(menuTimer);
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("menu-open", open);
    if (open) {
      const cur = currentSection();
      menuLinks.forEach(a => (a.hash === "#" + cur.id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      menu.classList.remove("closing");
      menu.hidden = false;
      SFX.pop(700);
      (menuLinks.find(a => a.hasAttribute("aria-current")) || menuLinks[0]).focus({ preventScroll: true });
    } else if (!menu.hidden) {
      if (reduceMotion) { menu.hidden = true; return; }
      menu.classList.add("closing");
      menuTimer = setTimeout(() => { menu.hidden = true; menu.classList.remove("closing"); }, 300);
    }
  }
  const menuOpen = () => !menu.hidden && !menu.classList.contains("closing");
  menuBtn.addEventListener("click", () => setMenu(!menuOpen()));
  menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", e => {
    if (!menuOpen()) return;
    if (e.key === "Escape") { setMenu(false); menuBtn.focus(); }
    else if (e.key === "Tab") {
      // le focus reste dans le menu (bouton Programme ↔ liens)
      const last = menuLinks[menuLinks.length - 1];
      if (e.shiftKey && document.activeElement === menuBtn) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); menuBtn.focus(); }
    }
  });

  /* =================================================================
     APPARITION AU DÉFILEMENT
     ================================================================= */
  const revealEls = $$(".sh, .letter, .card-wrap, .dogcard, .stats-grid, .film, .penalty, .juggle, .wall, .cake-zone, .ticket, .locker-zone");
  revealEls.forEach(el => el.classList.add("reveal"));
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("visible"); revealIO.unobserve(en.target); }
  }), { threshold: 0.12 });
  revealEls.forEach(el => revealIO.observe(el));

  /* =================================================================
     LETTRE (l'écriture se trace mot à mot, la plume suit, cachet de cire)
     ================================================================= */
  (() => {
    const letter = $("#letter"), body = $("#letterBody"), titleEl = $("#letterTitle"), signEl = $("#letterSign");
    const pen = $("#letterPen"), seal = $("#letterSeal"), skipBtn = $("#letterSkip");
    titleEl.textContent = D.lettre.titre;
    body.innerHTML = D.lettre.paragraphes.map(p => `<p>${p}</p>`).join("");
    signEl.textContent = "— " + D.lettre.signature;
    // découpe chaque nœud texte en mots (les espaces restent du texte : lecture d'écran intacte)
    const words = [];
    function splitWords(root) {
      [...root.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "lw"; w.textContent = part;
            frag.appendChild(w); words.push(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) splitWords(n);
      });
    }
    splitWords(titleEl);
    const titleCount = words.length;
    const paraStarts = new Set();
    $$("p", body).forEach(p => { paraStarts.add(words.length); splitWords(p); });
    const bodyEnd = words.length;
    splitWords(signEl);

    let i = 0, started = false, done = false, inView = false, nextAt = 0, raf = null;
    function finish() {
      if (done) return; done = true;
      words.forEach(w => w.classList.add("in", "instant"));
      letter.classList.add("written");
      pen.classList.remove("on");
      skipBtn.hidden = true;
      setTimeout(() => { letter.classList.add("sealed"); SFX.pop(300); }, reduceMotion ? 0 : 700);
    }
    function placePen(w) {
      const lr = letter.getBoundingClientRect(), r = w.getBoundingClientRect();
      pen.style.transform = `translate(${(r.right - lr.left - 6).toFixed(1)}px, ${(r.bottom - lr.top - 58).toFixed(1)}px)`;
    }
    function tick(now) {
      raf = null;
      if (done) return;
      if (inView && now >= nextAt) {
        const w = words[i];
        const len = w.textContent.length;
        const dur = Math.min(320, 50 + len * 17);
        w.style.setProperty("--wd", dur + "ms");
        w.classList.add("in");
        placePen(w);
        let pause = dur * 0.42 + 12;
        if (/[.!?:;,…]$/.test(w.textContent)) pause += /[,]$/.test(w.textContent) ? 120 : 280;
        if (i + 1 === titleCount || paraStarts.has(i + 1) || i + 1 === bodyEnd) pause += 450;
        nextAt = now + pause;
        i++;
        if (i >= words.length) { setTimeout(finish, 500); return; }
      }
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (started) return; started = true;
      letter.classList.add("writing");
      if (reduceMotion) return finish();
      pen.classList.add("on");
      nextAt = performance.now() + 900;
      raf = requestAnimationFrame(tick);
    }
    new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      if (inView) { start(); if (!raf && !done) raf = requestAnimationFrame(tick); }
    }, { threshold: 0.18 }).observe(letter);
    skipBtn.addEventListener("click", e => { e.stopPropagation(); finish(); });
    letter.addEventListener("dblclick", finish);
  })();

  /* =================================================================
     CARTE JOUEUR (entrée en scène, holographie, retournement 3D)
     ================================================================= */
  (() => {
    const c = D.carte;
    $("#cardRating").textContent = c.note;
    $("#cardPos").textContent = c.poste;
    $("#cardStats").innerHTML = c.stats.map((s, k) => `<div style="--k:${k}"><b>${s.valeur}</b><span>${s.label}</span></div>`).join("");
    $("#backSports").textContent = c.sports.join(" · ");
    if (D.photoProfil) $("#cardPhoto").innerHTML = `<img src="${D.photoProfil}" alt="Arthur" style="object-position:${D.photoProfilPos || "50% 35%"}" />`;
    const now0 = new Date();
    let age = now0.getFullYear() - birth.getFullYear();
    if (now0 < new Date(now0.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    $("#backAge").textContent = now0 < majority ? `${age} ans (18 le 20/12 !)` : `${age} ans`;

    const card = $("#playerCard"), wrap = card.closest(".card-wrap");
    card.addEventListener("click", () => {
      const f = card.classList.toggle("flipped");
      card.setAttribute("aria-pressed", String(f));
      card.classList.remove("lift"); void card.offsetWidth; card.classList.add("lift");
      SFX.pop(f ? 380 : 460);
    });
    // entrée en scène quand la carte arrive à l'écran
    new IntersectionObserver(([en], io) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      wrap.classList.add("is-in");
      setTimeout(() => wrap.classList.add("is-ready"), reduceMotion ? 0 : 1700);
    }, { threshold: 0.35 }).observe(wrap);

    // inclinaison fluide (interpolée) qui suit le pointeur
    if (reduceMotion) return;
    let tx = 0, ty = 0, rx = 0, ry = 0, px = 50, py = 50, tpx = 50, tpy = 50, raf = null, hover = false;
    function frame() {
      rx += (tx - rx) * 0.12; ry += (ty - ry) * 0.12;
      px += (tpx - px) * 0.14; py += (tpy - py) * 0.14;
      card.style.setProperty("--rx", rx.toFixed(2) + "deg");
      card.style.setProperty("--ry", ry.toFixed(2) + "deg");
      card.style.setProperty("--mx", px.toFixed(1) + "%");
      card.style.setProperty("--my", py.toFixed(1) + "%");
      card.style.setProperty("--hx", px.toFixed(1) + "%");
      card.style.setProperty("--hy", py.toFixed(1) + "%");
      card.style.setProperty("--d", (Math.hypot(px - 50, py - 50) / 70).toFixed(3));
      const still = Math.abs(tx - rx) < 0.05 && Math.abs(ty - ry) < 0.05 && Math.abs(tpx - px) < 0.1 && Math.abs(tpy - py) < 0.1;
      raf = still && !hover ? null : requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    card.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      const r = card.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      hover = true; card.classList.add("hovered");
      ty = (x - 0.5) * 26; tx = (0.5 - y) * 22; tpx = x * 100; tpy = y * 100;
      kick();
    });
    card.addEventListener("pointerleave", () => {
      hover = false; card.classList.remove("hovered");
      tx = ty = 0; tpx = tpy = 50; kick();
    });
  })();

  /* =================================================================
     LE BULLDOG (fiche + mascotte en photo)
     ================================================================= */
  (() => {
    const P = D.preferes;
    if (!P) return;
    $("#dogRace").textContent = P.chien.race;
    $("#dogText").textContent = P.chien.texte;
    $("#dogStats").innerHTML = P.chien.stats.map(st => `<div><span>${st.label}</span><i style="--v:${st.valeur}%"></i><b>${st.valeur}</b></div>`).join("");

    const dogEl = $("#bulldog"), bubble = $("#dogBubble"), cball = $("#chaseBall");
    cball.innerHTML = FIG.ballSVG();
    const ballPat = cball.querySelector(".ball-pattern");
    const lines = P.chien.repliques || ["WOUF !"];
    let li = 0, busy = false, chasing = false;
    const small = () => innerWidth < 640;
    const dog = new DOG.Dog($("#dogCanvas"), { scale: small() ? 0.2 : 0.3, x: -300, mover: dogEl });
    addEventListener("resize", () => dog.setScale(small() ? 0.2 : 0.3));
    const home = () => 8;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    function say(bub) {
      bub.textContent = lines[li++ % lines.length];
      bub.classList.add("show");
      clearTimeout(bub._t); bub._t = setTimeout(() => bub.classList.remove("show"), 1700);
    }
    function bark() { dog.bark(); SFX.bark(); say(bubble); }
    dogEl.addEventListener("click", () => bark());
    $("#dogcardFig").addEventListener("click", () => {
      const f = $("#dogcardFig"); f.classList.remove("barking"); void f.offsetWidth; f.classList.add("barking");
      SFX.bark(); say($("#dogcardBubble")); setTimeout(() => f.classList.remove("barking"), 700);
    });
    const WALK = () => (small() ? 70 : 105), TROT = () => (small() ? 150 : 220), RUN = () => (small() ? 300 : 460);

    // le ballon roule devant le chien et le chien le pousse
    let ballX = null, ballRaf = null;
    function ballFollow() {
      if (ballX == null) return;
      const r = cball.offsetWidth / 2;
      const nose = dog.x + dog.width * (dog.face > 0 ? 0.86 : 0.14);
      const targetX = nose + dog.face * (r + 6);
      if ((targetX - ballX) * dog.face > 0) ballX = targetX;        // poussé par le museau
      ballX += dog.face * Math.max(0, dog.speed) * 0.016 * 0.35;     // roule un peu en avance
      cball.style.transform = `translateX(${ballX - r}px)`;
      ballPat.style.transform = `rotate(${(ballX / (Math.PI * r * 2)) * 360}deg)`;
      ballRaf = requestAnimationFrame(ballFollow);
    }
    async function chase() {
      if (chasing || reduceMotion || !document.body.classList.contains("entered")) return;
      chasing = busy = true;
      const W = innerWidth;
      ballX = dog.x + dog.width + 30; cball.style.opacity = "1"; ballFollow();
      bark(); await wait(350);
      await dog.moveTo(W + 40, RUN());
      cball.style.opacity = "0"; cancelAnimationFrame(ballRaf); ballX = null;
      dog.x = -dog.width - 60;                 // revient par la gauche
      await wait(600);
      await dog.moveTo(home() + Math.random() * innerWidth * 0.4, TROT());
      await wait(250); bark();
      chasing = busy = false;
    }
    async function stroll() {                  // promenade : il traverse l'écran au pas, s'arrête, repart
      if (busy || chasing || reduceMotion || document.hidden || !document.body.classList.contains("entered")) return;
      busy = true;
      const maxX = Math.max(home(), innerWidth - dog.width - 8);
      let to = home() + Math.random() * (maxX - home());
      if (Math.abs(to - dog.x) < innerWidth * 0.2) to = dog.x > maxX / 2 ? home() + Math.random() * maxX * 0.3 : maxX - Math.random() * maxX * 0.3;
      await dog.moveTo(to, Math.random() < 0.25 ? TROT() : WALK());
      if (!chasing) busy = false;
    }
    addEventListener("ball-kick", () => setTimeout(chase, 250));
    const arrive = () => setTimeout(async () => {
      if (reduceMotion) { dog.x = home(); return; }
      busy = true; await dog.ready; dog.x = -dog.width - 40;
      await dog.moveTo(home(), WALK()); await wait(300); bark(); busy = false;
    }, 2400);
    if (document.body.classList.contains("entered")) arrive();
    else {
      const mo = new MutationObserver(() => { if (document.body.classList.contains("entered")) { mo.disconnect(); arrive(); } });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
    setInterval(stroll, 6500);
    setInterval(() => { if (!document.hidden && Math.random() < 0.5) chase(); }, 70000);
  })();

  /* =================================================================
     STATS EN DIRECT (compteurs à rouleaux, puis mise à jour chaque seconde)
     ================================================================= */
  (() => {
    const statEls = Object.fromEntries($$("[data-stat]").map(el => [el.dataset.stat, el]));
    const strip = '<span class="od__s">' + "01234567890".split("").map(d => `<i>${d}</i>`).join("") + "</span>";
    // compteur mécanique : un rouleau par chiffre, séparateurs fixes
    function odo(el, str) {
      const sig = str.replace(/\d/g, "0");
      if (el._sig !== sig) {
        el._sig = sig;
        el.innerHTML = `<span class="vh"></span><span class="od-row" aria-hidden="true">${[...str].map(ch => /\d/.test(ch)
          ? `<span class="od">${strip}</span>` : `<span class="od-sep">${ch === " " || ch === " " || ch === " " ? " " : ch}</span>`).join("")}</span>`;
        el._rolls = $$(".od__s", el);
        el._prev = el._rolls.map(() => 0);
        el._vh = $(".vh", el);
        void el.offsetWidth;
      }
      el._vh.textContent = str;
      const digits = str.replace(/\D/g, "");
      el._rolls.forEach((r, k) => {
        const v = +digits[k], prev = el._prev[k];
        if (v === prev) return;
        if (prev === 9 && v === 0 && !el.classList.contains("rolling")) {
          r.style.setProperty("--v", 10);
          r.addEventListener("transitionend", () => {
            r.style.transition = "none"; r.style.setProperty("--v", 0);
            void r.offsetWidth; r.style.transition = "";
          }, { once: true });
        } else r.style.setProperty("--v", v);
        el._prev[k] = v;
      });
    }
    function values() {
      const ms = Date.now() - birth;
      const sec = ms / 1000, min = sec / 60, days = ms / 86400000;
      return {
        secondes: Math.floor(sec), jours: Math.floor(days), coeur: Math.floor(min * 80),
        nuits: Math.floor(days), weekends: Math.floor(days / 7), pas: Math.floor(days * 11000),
      };
    }
    function render() { const v = values(); for (const k in statEls) odo(statEls[k], fmt.format(v[k])); }
    // état initial : rouleaux à zéro, à la bonne longueur
    const v0 = values();
    for (const k in statEls) odo(statEls[k], fmt.format(v0[k]).replace(/\d/g, "0"));
    let started = false;
    const grid = $(".stats-grid");
    new IntersectionObserver(([en], io) => {
      if (!en.isIntersecting || started) return;
      started = true; io.disconnect();
      grid.classList.add("is-live");
      if (reduceMotion) { render(); setInterval(render, 1000); return; }
      for (const k in statEls) {
        statEls[k].classList.add("rolling");
        // chaque rouleau a son propre délai : de droite à gauche, façon machine à sous
        const rolls = statEls[k]._rolls, n = rolls.length;
        rolls.forEach((r, j) => r.style.setProperty("--delay", ((n - 1 - j) * 70 + (+statEls[k].closest(".stat").style.getPropertyValue("--i") || 0) * 120) + "ms"));
      }
      setTimeout(render, 450);
      setTimeout(() => {
        for (const k in statEls) { statEls[k].classList.remove("rolling"); statEls[k]._rolls.forEach(r => r.style.removeProperty("--delay")); }
        render(); setInterval(render, 1000);
      }, 3600);
    }, { threshold: 0.3 }).observe(grid);
  })();

  /* =================================================================
     CARRIÈRE (la ligne se dessine au défilement, les étapes s'allument)
     ================================================================= */
  (() => {
    const tl = $("#timeline");
    tl.innerHTML = D.carriere.map((e, k) => `
      <li class="tl-item${e.photo ? " tl-item--photo" : ""}" style="--k:${k}">
        <span class="tl-dot" aria-hidden="true"></span>
        <span class="tl-ghost" aria-hidden="true">${e.annee}</span>
        <article class="tl-card">
          <div class="tl-text"><div class="tl-year">${e.annee}</div><h3>${e.titre}</h3><p>${e.texte}</p></div>
          ${e.photo ? `<figure class="tl-photo"><img src="${e.photo}" alt="${e.titre}" loading="lazy" decoding="async" /></figure>` : ""}
        </article>
      </li>`).join("");
    const items = $$(".tl-item", tl);
    const tlIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("visible"); tlIO.unobserve(en.target); }
    }), { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
    items.forEach(el => tlIO.observe(el));

    const wrap = $(".tl-wrap"), fill = $("#tlFill"), ball = $("#tlBall");
    ball.innerHTML = FIG.ballSVG();
    let active = false, raf = null, dots = [];
    const measure = () => { dots = items.map(it => it.offsetTop + $(".tl-dot", it).offsetTop + 10); };
    function update() {
      raf = null;
      const r = wrap.getBoundingClientRect();
      const h = wrap.offsetHeight;
      const y = reduceMotion ? h : Math.max(0, Math.min(h, innerHeight * 0.62 - r.top));
      fill.style.transform = `scaleY(${(y / h).toFixed(4)})`;
      ball.style.transform = `translate(-50%, ${(y - 14).toFixed(1)}px) rotate(${(y * 1.4).toFixed(0)}deg)`;
      wrap.classList.toggle("tl-done", y >= h - 2);
      items.forEach((it, k) => it.classList.toggle("lit", y >= dots[k] - 4));
    }
    const req = () => { if (active && !raf) raf = requestAnimationFrame(update); };
    new IntersectionObserver(([en]) => { active = en.isIntersecting; if (active) { measure(); req(); } }, { rootMargin: "20% 0px" }).observe(wrap);
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", () => { measure(); req(); });
    addEventListener("load", () => { measure(); req(); });
  })();

  /* =================================================================
     TA VIE EN 18 SAISONS (pellicule + visionneuse plein écran)
     ================================================================= */
  (() => {
    const strip = $("#filmStrip");
    const by = birth.getFullYear();
    const ans = a => a === 0 ? "Naissance" : `${a} an${a > 1 ? "s" : ""}`;
    const saison = a => `Saison ${by + a}-${String((by + a + 1) % 100).padStart(2, "0")}`;
    const photos = D.saisons.map((s, i) => ({ ...s, _i: i })).sort((x, y) => x.age - y.age || x._i - y._i);
    const withSrc = photos.filter(p => p.src);
    strip.innerHTML = photos.map((s, i) => `
      <button class="frame${s.src ? "" : " frame--empty"}" data-i="${i}" style="--n:${i}" ${s.src ? "" : 'tabindex="-1"'} aria-label="${ans(s.age)}${s.legende ? " — " + s.legende : ""}">
        <span class="frame__edge" aria-hidden="true"><b>${pad(i + 1)}</b><span>ARTHUR · 18</span><b>${pad(i + 1)}A</b></span>
        <div class="frame__img">${s.src
          ? `<img src="${s.src}" alt="Arthur à ${s.age} ans${s.legende ? " — " + s.legende : ""}" loading="lazy" decoding="async" draggable="false" style="object-position:${s.pos || "50% 35%"}" />`
          : `<div class="frame__ph"><b>${s.age}</b>photo à venir</div>`}</div>
        <div class="frame__meta"><b>${ans(s.age)}</b><span>${saison(s.age)}</span></div>
        <div class="frame__cap">${s.legende || ""}</div>
      </button>`).join("");
    const frames = $$(".frame", strip);
    const ages = [...new Set(photos.map(p => p.age))];
    $("#filmAges").innerHTML = ages.map(a => `<button data-age="${a}" tabindex="-1" aria-label="Aller à ${ans(a)}"><span>${a}</span></button>`).join("");
    const ageBtns = $$("#filmAges button");
    const centerOf = f => f.offsetLeft - (strip.clientWidth - f.offsetWidth) / 2;
    const goFrame = (i, smooth = true) => { const f = frames[i]; if (f) strip.scrollTo({ left: centerOf(f), behavior: smooth && !reduceMotion ? "smooth" : "auto" }); };
    $("#filmAges").addEventListener("click", e => { const b = e.target.closest("button"); if (b) goFrame(photos.findIndex(p => p.age === +b.dataset.age)); });
    let cur = 0;
    $("#filmPrev").addEventListener("click", () => goFrame(Math.max(0, cur - 2)));
    $("#filmNext").addEventListener("click", () => goFrame(Math.min(frames.length - 1, cur + 2)));
    // clavier : flèches = image par image, Début/Fin
    strip.addEventListener("keydown", e => {
      const map = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 0, End: frames.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      const k = Math.max(0, Math.min(frames.length - 1, map[e.key]));
      goFrame(k);
      frames[k].focus({ preventScroll: true });
    });
    // effet « projecteur » : l'image au centre est nette et lumineuse, les autres s'éloignent
    const progress = $("#filmProgress");
    let mRaf = null, centers = [];
    const measure = () => { centers = frames.map(f => f.offsetLeft + f.offsetWidth / 2); };
    function markActive() {
      mRaf = null;
      const mid = strip.scrollLeft + strip.clientWidth / 2;
      const half = strip.clientWidth / 2 || 1;
      let best = 0, bd = Infinity;
      centers.forEach((c, i) => {
        const d = c - mid;
        if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
        if (Math.abs(d) < half * 1.6) {
          const t = Math.max(-1, Math.min(1, d / (half * 1.15)));
          frames[i].style.setProperty("--t", t.toFixed(3));
          frames[i].style.setProperty("--a", Math.abs(t).toFixed(3));
        }
      });
      if (best !== cur || !frames[cur].classList.contains("current")) {
        frames.forEach((f, i) => f.classList.toggle("current", i === best));
        ageBtns.forEach(b => b.classList.toggle("active", +b.dataset.age === photos[best].age));
        cur = best;
      }
      const max = strip.scrollWidth - strip.clientWidth;
      progress.style.transform = `scaleX(${max > 0 ? (strip.scrollLeft / max).toFixed(4) : 0})`;
    }
    const reqMark = () => { if (!mRaf) mRaf = requestAnimationFrame(markActive); };
    strip.addEventListener("scroll", reqMark, { passive: true });
    addEventListener("resize", () => { measure(); reqMark(); });
    measure(); markActive();
    // glisser à la souris, avec inertie
    let drag = null, lastDrag = false, glide = null;
    strip.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(glide);
      drag = { x: e.clientX, left: strip.scrollLeft, moved: false, vx: 0, lx: e.clientX, lt: performance.now() };
    });
    addEventListener("pointermove", e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4 && !drag.moved) { drag.moved = true; strip.classList.add("dragging"); }
      if (!drag.moved) return;
      const t = performance.now();
      drag.vx = 0.8 * ((e.clientX - drag.lx) / Math.max(1, t - drag.lt)) + 0.2 * drag.vx;
      drag.lx = e.clientX; drag.lt = t;
      strip.scrollLeft = drag.left - dx;
    });
    addEventListener("pointerup", () => {
      if (!drag) return;
      lastDrag = drag.moved;
      let v = -drag.vx * 16; drag = null;
      if (!lastDrag) return;
      const end = () => { strip.classList.remove("dragging"); goFrame(cur); };
      if (reduceMotion || Math.abs(v) < 2) return end();
      (function step() {
        strip.scrollLeft += v; v *= 0.93;
        glide = Math.abs(v) > 0.6 ? requestAnimationFrame(step) : (end(), null);
      })();
    });

    // ---------- visionneuse ----------
    const lb = $("#lightbox"), lbImg = $("#lightboxImg"), lbBg = $("#lightboxBg"), lbFrame = $(".lightbox__frame", lb), lbBar = $("#lightboxBar");
    let lbIdx = 0, lastFocus = null, busy = false;
    const preload = k => { const s = withSrc[(k + withSrc.length) % withSrc.length]; if (s) { const im = new Image(); im.src = s.src; } };
    function setPhoto(k) {
      lbIdx = (k + withSrc.length) % withSrc.length;
      const s = withSrc[lbIdx];
      lbImg.src = s.src; lbImg.alt = `Arthur à ${s.age} ans${s.legende ? " — " + s.legende : ""}`;
      lbBg.style.backgroundImage = `url("${s.src}")`;
      $("#lightboxAge").textContent = ans(s.age);
      $("#lightboxCap").textContent = s.legende || "";
      $("#lightboxCount").textContent = `${pad(lbIdx + 1)} / ${withSrc.length}`;
      lbBar.style.transform = `scaleX(${((lbIdx + 1) / withSrc.length).toFixed(4)})`;
      preload(lbIdx + 1); preload(lbIdx - 1);
      return lbImg.decode ? lbImg.decode().catch(() => {}) : Promise.resolve();
    }
    async function showPhoto(k, dir) {
      if (busy) return;
      if (reduceMotion || !lbFrame.animate) { setPhoto(k); return; }
      busy = true;
      const out = lbFrame.animate([{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: `translateX(${-dir * 60}px) scale(.96)`, filter: "blur(6px)" }], { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
      $(".lightbox__fig figcaption", lb).animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 640 });
      await out.finished.catch(() => {});
      await setPhoto(k);
      out.cancel();
      await lbFrame.animate([{ opacity: 0, transform: `translateX(${dir * 60}px) scale(.96)`, filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" }).finished.catch(() => {});
      busy = false;
    }
    // ouverture : la photo « s'envole » depuis sa vignette (FLIP)
    function flipFrom(el, reverse) {
      if (!el || reduceMotion || !lbFrame.animate) return Promise.resolve();
      const a = el.getBoundingClientRect(), b = lbFrame.getBoundingClientRect();
      if (!a.width || !b.width) return Promise.resolve();
      const sx = a.width / b.width, sy = a.height / b.height;
      const from = { transform: `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${sx}, ${sy})`, opacity: 0.6 };
      const to = { transform: "none", opacity: 1 };
      return lbFrame.animate(reverse ? [to, from] : [from, to], { duration: reverse ? 380 : 560, easing: "cubic-bezier(.16,1,.3,1)", fill: reverse ? "forwards" : "none" }).finished.catch(() => {});
    }
    async function openLb(s, fromEl) {
      lastFocus = document.activeElement;
      await setPhoto(withSrc.indexOf(s));
      lb.hidden = false; document.body.style.overflow = "hidden";
      lb.classList.remove("closing"); void lb.offsetWidth; lb.classList.add("open");
      $(".lightbox__close", lb).focus({ preventScroll: true });
      flipFrom(fromEl && $("img", fromEl));
    }
    async function closeLb() {
      if (lb.hidden || lb.classList.contains("closing")) return;
      lb.classList.add("closing"); lb.classList.remove("open");
      const s = withSrc[lbIdx], f = frames[photos.indexOf(s)];
      const r = f && f.getBoundingClientRect();
      const visible = r && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
      await (visible ? flipFrom($("img", f), true) : new Promise(res => setTimeout(res, reduceMotion ? 0 : 300)));
      lb.hidden = true; lb.classList.remove("closing");
      lbFrame.getAnimations().forEach(a => a.cancel());
      document.body.style.overflow = "";
      if (f && photos.indexOf(s) !== cur) goFrame(photos.indexOf(s), false);
      (f || lastFocus)?.focus({ preventScroll: true });
    }
    strip.addEventListener("click", e => {
      if (lastDrag) { lastDrag = false; return; }
      const f = e.target.closest(".frame"); if (!f) return;
      const s = photos[+f.dataset.i]; if (!s.src) return;
      SFX.pop(620);
      openLb(s, f);
    });
    lb.addEventListener("click", e => {
      if (e.target.closest(".lightbox__prev")) return showPhoto(lbIdx - 1, -1);
      if (e.target.closest(".lightbox__next")) return showPhoto(lbIdx + 1, 1);
      if (e.target.closest(".lightbox__close") || !e.target.closest(".lightbox__frame, .lightbox__nav, figcaption")) closeLb();
    });
    addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") showPhoto(lbIdx - 1, -1);
      if (e.key === "ArrowRight") showPhoto(lbIdx + 1, 1);
      if (e.key === "Tab") {             // focus piégé dans la visionneuse
        const f = $$("button", lb).filter(b => b.offsetParent !== null);
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    let touchX = null, touchY = null;
    lb.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY; touchX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showPhoto(lbIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) closeLb();
    });
  })();

  /* =================================================================
     TIRS AU BUT — tireur (Arthur) + gardien articulés
     ================================================================= */
  const TOTAL = 5;
  const scene = $("#pkScene"), world = $("#pkWorld"), zonesEl = $("#goalZones"), keeper = $("#keeper"), kicker = $("#kicker"),
        pkBall = $("#pkBall"), pkShadow = $("#pkShadow"), banner = $("#pkMsg"), net = $("#goalNet"), ripple = $("#netRipple");
  const keeperFig = new FIG.Figure($("#keeperFig"), "keeper");
  const kickerFig = new FIG.Figure(kicker, "kicker");
  pkBall.innerHTML = FIG.ballSVG();
  const pkPattern = pkBall.querySelector(".ball-pattern");
  $("#pkFlashes").innerHTML = Array.from({ length: 26 }, () =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 90).toFixed(1)}%;--delay:${(Math.random() * .8).toFixed(2)}s"></i>`).join("");
  const KICK_START = "translate(-62%, 3%) scale(1.05)";
  kicker.style.transform = KICK_START;
  let shots = 0, goals = 0, busy = false, breathT = null;
  zonesEl.innerHTML = Array.from({ length: 6 }, (_, i) => `<button data-z="${i}" aria-label="Tirer ${i < 3 ? "en haut" : "en bas"} ${["à gauche", "au centre", "à droite"][i % 3]}"></button>`).join("");
  $("#pkDots").innerHTML = "<i></i>".repeat(TOTAL);
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const anim = (el, frames, opts) => el.animate(frames, { fill: "forwards", ...opts }).finished;

  function keeperIdle() {
    keeper.classList.add("idle");
    clearInterval(breathT);
    let b = false;
    breathT = setInterval(() => { if (!busy) { b = !b; keeperFig.to(b ? "readyB" : "ready", 900, FIG.easeInOut); } }, 950);
  }
  keeperIdle();
  function showBanner(title, sub, alt) {
    banner.querySelector("b").textContent = title;
    banner.querySelector("small").textContent = sub;
    banner.classList.toggle("alt", !!alt);
    banner.classList.add("show");
    setTimeout(() => banner.classList.remove("show"), 1500);
  }

  zonesEl.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn || busy || shots >= TOTAL) return;
    busy = true;
    $$("button", zonesEl).forEach(b => (b.disabled = true));
    const z = +btn.dataset.z, col = z % 3, row = z < 3 ? 0 : 1;
    const kCol = (Math.random() * 3) | 0, kRow = Math.random() < 0.5 ? 0 : 1;
    const saved = kCol === col && (kRow === row || Math.random() < 0.5);

    // géométrie mesurée avant le zoom caméra
    const sR = scene.getBoundingClientRect(), bR = btn.getBoundingClientRect(), ballR = pkBall.getBoundingClientRect(), gR = $("#goal").getBoundingClientRect();
    const tx = bR.left + bR.width * (col === 0 ? 0.42 : col === 2 ? 0.58 : 0.5) - (ballR.left + ballR.width / 2);
    const ty = bR.top + bR.height * (row === 0 ? 0.42 : 0.55) - (ballR.top + ballR.height / 2);

    // 1) course d'élan d'Arthur
    SFX.whistle();
    await wait(350);
    const runAnim = kicker.animate([{ transform: KICK_START }, { transform: "translate(0,0) scale(1)" }], { duration: 640, easing: "cubic-bezier(.45,0,.75,1)", fill: "forwards" });
    let running = true;
    (async () => { let i = 0; while (running) await kickerFig.to(i++ % 2 ? "run2" : "run1", 160, FIG.easeInOut); })();
    await runAnim.finished; running = false;
    keeperFig.to("crouch", 160);                       // le gardien se ramasse
    await kickerFig.to("windup", 120);
    world.classList.add("zoom");
    await kickerFig.to("kick", 85, t => t);
    SFX.kick();

    // 2) le gardien plonge
    setTimeout(() => {
      keeper.classList.remove("idle");
      const side = kCol - 1;
      if (side === 0) {
        if (kRow === 0) { keeperFig.to("jump", 260); keeper.style.transform = `translateY(${-gR.height * 0.17}px)`; }
        else keeperFig.to("low", 220);
      } else {
        keeperFig.to("stretch", 300);
        const rot = side * (kRow === 0 ? 70 : 84);
        const dy = kRow === 0 ? -gR.height * 0.2 : gR.height * 0.08;
        keeper.style.transform = `translate(${side * gR.width * 0.3}px, ${dy}px) rotate(${rot}deg)`;
      }
    }, 60);

    // 3) le ballon part en courbe, avec effet
    const curve = (Math.random() - 0.5) * sR.width * 0.08, flight = 560;
    pkBall.classList.add("flying");
    pkPattern.animate([{ transform: "rotate(0)" }, { transform: `rotate(${col === 0 ? -900 : 900}deg)` }], { duration: flight, easing: "ease-out", fill: "forwards" });
    anim(pkShadow, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${tx}px, ${ty * 0.18}px) scale(.45)`, opacity: .25 }], { duration: flight, easing: "ease-out" });
    await anim(pkBall, [
      { transform: "translate(0,0) scale(1)" },
      { transform: `translate(${tx * 0.45 + curve}px, ${ty * 0.6 - sR.height * 0.04}px) scale(.78)`, offset: 0.5 },
      { transform: `translate(${tx}px, ${ty}px) scale(.56)` },
    ], { duration: flight, easing: "cubic-bezier(.22,.6,.36,1)" });
    pkBall.classList.remove("flying");

    shots++;
    const dot = $$("#pkDots i")[shots - 1];
    if (saved) {
      dot.classList.add("ko"); SFX.ooh();
      showBanner("ARRÊT !", "Le gardien sort le grand jeu", true);
      const away = col === 1 ? (Math.random() < .5 ? -1 : 1) : (col === 0 ? -1 : 1);
      anim(pkBall, [
        { transform: `translate(${tx}px, ${ty}px) scale(.56)` },
        { transform: `translate(${tx + away * sR.width * 0.32}px, ${ty - sR.height * 0.12}px) scale(.62)`, offset: .45 },
        { transform: `translate(${tx + away * sR.width * 0.5}px, ${ty + sR.height * 0.25}px) scale(.7)`, opacity: 0 },
      ], { duration: 800, easing: "ease-out" });
    } else {
      goals++; dot.classList.add("ok"); SFX.cheer();
      showBanner("BUUUT !", `Arthur · tir n°${shots} · ${goals} but${goals > 1 ? "s" : ""}`);
      const gx = bR.left + bR.width / 2 - gR.left, gy = bR.top + bR.height / 2 - gR.top;
      ripple.style.left = gx + "px"; ripple.style.top = gy + "px";
      ripple.classList.remove("go"); void ripple.offsetWidth; ripple.classList.add("go");
      net.classList.remove("hit"); void net.offsetWidth; net.classList.add("hit");
      scene.classList.add("shake", "roar"); confetti(80);
      anim(pkBall, [
        { transform: `translate(${tx}px, ${ty}px) scale(.56)` },
        { transform: `translate(${tx * 1.02}px, ${ty * 0.94}px) scale(.5)`, offset: .3 },
        { transform: `translate(${tx * 1.02}px, ${gR.bottom - ballR.top - ballR.height * .6}px) scale(.5)` },
      ], { duration: 700, easing: "cubic-bezier(.3,0,.7,1)" });
    }
    // le gardien retombe
    setTimeout(() => {
      if (kCol !== 1 && kRow === 0) { keeper.classList.add("fall"); keeper.style.transform = keeper.style.transform.replace(/translate\(([^,]+), [^)]+\)/, `translate($1, ${gR.height * 0.1}px)`); }
      if (kCol === 1 && kRow === 0) { keeper.classList.add("fall"); keeper.style.transform = "translateY(0)"; keeperFig.to("ready", 400); }
    }, 260);

    $("#pkShots").textContent = `${shots}/${TOTAL}`;
    $("#pkGoals").textContent = goals;
    await wait(1700);

    // 4) remise en place
    scene.classList.remove("shake", "roar");
    world.classList.remove("zoom");
    keeper.classList.remove("fall"); keeper.classList.add("reset"); keeper.style.transform = "";
    keeperFig.to("ready", 450);
    await anim(kicker, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
    kicker.getAnimations().forEach(a => a.cancel());
    kicker.style.transform = KICK_START; kickerFig.set("stand");
    [pkBall, pkShadow, pkPattern].forEach(el => el.getAnimations().forEach(a => a.cancel()));
    anim(pkBall, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    anim(kicker, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
    await wait(450);
    keeper.classList.remove("reset"); keeperIdle();
    busy = false;
    if (shots >= TOTAL) pkEnd(); else $$("button", zonesEl).forEach(b => (b.disabled = false));
  });
  function pkEnd() {
    $$("button", zonesEl).forEach(b => (b.disabled = true));
    const verdict = goals === 5 ? "5/5 — Ballon d'Or direct !" : goals >= 3 ? `${goals}/5 — Qualifié, champion !` : `${goals}/5… même les légendes ratent. Rejoue !`;
    toast(verdict);
    if (goals >= 4) { confetti(220); SFX.fanfare(); }
    $("#pkReset").hidden = false;
  }
  $("#pkReset").addEventListener("click", () => {
    shots = goals = 0;
    $("#pkShots").textContent = `0/${TOTAL}`; $("#pkGoals").textContent = "0";
    $$("#pkDots i").forEach(d => (d.className = ""));
    $$("button", zonesEl).forEach(b => (b.disabled = false));
    $("#pkReset").hidden = true;
    SFX.whistle();
  });

  /* =================================================================
     DÉFI DES JONGLES
     ================================================================= */
  (() => {
    const cv = $("#jgCanvas"), ctx = cv.getContext("2d");
    const overlay = $("#jgOverlay"), text = $("#jgText"), startBtn = $("#jgStart");
    let W = 0, H = 0, dpr = 1, running = false, visible = false, raf = null, last = 0;
    let score = 0, best = +(store.get("arthur-jongles") || 0);
    const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 30, rot: 0, vr: 0, sq: 0 };
    let parts = [], popups = [], rings = [], trail = [];
    const svgImg = svg => { const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); return im; };
    const imgPattern = svgImg(FIG.ballSVG({ part: "pattern", size: 200 }));
    const imgShade = svgImg(FIG.ballSVG({ part: "shade", size: 200 }));
    $("#jgBest").textContent = best;
    const ground = () => H * 0.82;

    function resize() {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
      ball.r = Math.max(22, Math.min(38, W * 0.05));
      if (!running) { ball.x = W / 2; ball.y = ground() - ball.r; }
    }
    new ResizeObserver(resize).observe(cv);

    function start() {
      score = 0; $("#jgScore").textContent = 0;
      ball.x = W / 2; ball.y = H * 0.55; ball.vx = 0; ball.vy = -H * 0.9; ball.vr = 0;
      running = true; overlay.classList.add("hidden"); SFX.whistle();
      loop();
    }
    function gameOver() {
      running = false;
      const record = score > best;
      if (record) { best = score; store.set("arthur-jongles", best); $("#jgBest").textContent = best; }
      text.textContent = score >= 18
        ? `${score} jongles ! ${record ? "Nouveau record !" : "Digne de tes 18 ans."}`
        : `${score} jongle${score > 1 ? "s" : ""}… ${record ? "nouveau record !" : "encore un effort !"}`;
      startBtn.querySelector("span").textContent = "Rejouer";
      overlay.classList.remove("hidden");
      if (record && score > 0) { confetti(160); SFX.fanfare(); } else SFX.ooh();
    }
    function kick(px, py) {
      const dx = ball.x - px;
      const g = H * 2.3 * (1 + Math.min(score, 40) * 0.015);
      ball.vy = -Math.sqrt(2 * g * H * (0.42 + Math.random() * 0.12));
      ball.vx = (dx / ball.r) * W * 0.32 + (Math.random() - 0.5) * W * 0.1;
      ball.vr = ball.vx / ball.r;
      ball.sq = 0.22; rings.push({ x: px, y: py, life: 1 });
      score++; $("#jgScore").textContent = score;
      SFX.kick(1 + Math.min(score, 30) * 0.02);
      for (let i = 0; i < 10; i++) parts.push({ x: px, y: py, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260, life: 1 });
      const milestones = { 10: "10 JONGLES !", 18: "18 JONGLES = 18 ANS !", 30: "30 ! FREESTYLE", 50: "50 ! BALLON D'OR" };
      if (milestones[score]) { popups.push({ t: milestones[score], life: 1.6 }); if (score === 18) { confetti(200); SFX.cheer(); } }
      else popups.push({ t: "+1", life: 0.7, x: px, y: py });
    }
    cv.addEventListener("pointerdown", e => {
      if (!running) return;
      const r = cv.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (Math.hypot(px - ball.x, py - ball.y) < ball.r * 1.9 && ball.vy > -H * 0.6) kick(px, py);
    });
    startBtn.addEventListener("click", start);

    function update(dt) {
      if (running) {
        const g = H * 2.3 * (1 + Math.min(score, 40) * 0.015);
        ball.vy += g * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += ball.vr * dt;
        ball.vx *= 0.995;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.8; ball.vr *= -1; }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.8; ball.vr *= -1; }
        if (ball.y > ground() - ball.r) { ball.y = ground() - ball.r; gameOver(); }
      } else {
        ball.y = ground() - ball.r - Math.abs(Math.sin(performance.now() / 300)) * H * 0.06;
        ball.rot += dt * 1.5;
      }
      ball.sq *= Math.pow(0.002, dt);
      trail.push([ball.x, ball.y]); if (trail.length > 6) trail.shift();
      rings.forEach(r => (r.life -= dt * 2.2)); rings = rings.filter(r => r.life > 0);
      parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt * 1.8; });
      parts = parts.filter(p => p.life > 0);
      popups.forEach(p => (p.life -= dt)); popups = popups.filter(p => p.life > 0);
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0b1640"); sky.addColorStop(.8, "#1a2c78");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // projecteurs
      for (const lx of [0.12, 0.88]) {
        const gl = ctx.createRadialGradient(W * lx, H * 0.08, 0, W * lx, H * 0.08, W * 0.45);
        gl.addColorStop(0, "rgba(255,255,255,.35)"); gl.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      }
      // tribune
      ctx.fillStyle = "rgba(255,255,255,.08)";
      for (let y = H * 0.3; y < H * 0.62; y += 12) for (let x = (y / 12 % 2) * 7; x < W; x += 14) ctx.fillRect(x, y, 3, 3);
      ctx.fillStyle = "#e30613"; ctx.fillRect(0, H * 0.64, W, H * 0.04);
      // score géant
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.font = `${H * 0.4}px "Bebas Neue", Impact, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(score, W / 2, H * 0.4);
      // pelouse
      const gy = ground();
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#258c43" : "#2a9a4b"; ctx.fillRect(0, H * 0.68 + i * (H * 0.32 / 8), W, H * 0.32 / 8 + 1); }
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      // ombre
      const hgt = Math.max(0, gy - ball.y - ball.r), sc = Math.max(0.25, 1 - hgt / H);
      ctx.fillStyle = `rgba(0,0,0,${0.35 * sc})`; ctx.beginPath(); ctx.ellipse(ball.x, gy + 2, ball.r * sc, ball.r * 0.25 * sc, 0, 0, Math.PI * 2); ctx.fill();
      // particules
      parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "#cfffb0"; ctx.fillRect(p.x, p.y, 3, 3); });
      ctx.globalAlpha = 1;
      // anneaux d'impact
      rings.forEach(r => { ctx.globalAlpha = r.life * 0.8; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, ball.r * (1.6 - r.life * 0.6) * 1.2, 0, Math.PI * 2); ctx.stroke(); });
      ctx.globalAlpha = 1;
      // traînée (flou de mouvement)
      if (running) trail.forEach((t, i) => { ctx.globalAlpha = 0.05 * i; ctx.drawImage(imgShade, t[0] - ball.r, t[1] - ball.r, ball.r * 2, ball.r * 2); });
      ctx.globalAlpha = 1;
      // ballon : motif qui tourne + ombrage fixe + écrasement à l'impact
      ctx.save(); ctx.translate(ball.x, ball.y); ctx.scale(1 + ball.sq * 0.6, 1 - ball.sq);
      ctx.save(); ctx.rotate(ball.rot);
      if (imgPattern.complete) ctx.drawImage(imgPattern, -ball.r, -ball.r, ball.r * 2, ball.r * 2);
      ctx.restore();
      if (imgShade.complete) ctx.drawImage(imgShade, -ball.r, -ball.r, ball.r * 2, ball.r * 2);
      ctx.restore();
      // messages
      popups.forEach(p => {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        if (p.x != null) { ctx.fillStyle = "#ffdf5a"; ctx.font = `${H * 0.06}px "Bebas Neue", Impact`; ctx.fillText(p.t, p.x, p.y - (0.7 - p.life) * 80); }
        else { ctx.fillStyle = "#fff"; ctx.font = `${Math.min(W * 0.08, H * 0.12)}px "Bebas Neue", Impact`; ctx.fillText(p.t, W / 2, H * 0.2); }
      });
      ctx.globalAlpha = 1;
    }
    function loop(t = performance.now()) {
      cancelAnimationFrame(raf);
      const frame = now => {
        const dt = Math.min(0.033, (now - last) / 1000 || 0); last = now;
        update(dt); draw();
        if (running || visible) raf = requestAnimationFrame(frame);
      };
      last = t; raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }).observe(cv);
  })();

  /* =================================================================
     MESSAGES
     ================================================================= */
  const rot = () => `${(Math.random() * 6 - 3).toFixed(1)}deg`;
  const NOTE_COLORS = ["#fff7a8", "#ffd1dc", "#c9f0ff", "#d7ffcf", "#ffe0b8"];
  $("#wall").innerHTML = D.messages.map((m, i) => `
    <blockquote class="note" style="--r:${rot()};--c:${NOTE_COLORS[i % NOTE_COLORS.length]}">
      <p>${m.texte}</p><cite>— ${m.auteur}</cite>
    </blockquote>`).join("");

  /* =================================================================
     BOUGIES
     ================================================================= */
  const candlesEl = $("#candles");
  candlesEl.innerHTML = Array.from({ length: 18 }, (_, i) => `<button class="candle" aria-label="Bougie ${i + 1}"><span class="flame"></span></button>`).join("");
  const candles = $$(".candle", candlesEl);
  const lit = () => candles.filter(c => !c.classList.contains("out"));
  function blow(c) {
    if (c.classList.contains("out")) return;
    c.classList.add("out"); SFX.pop(300 + Math.random() * 300);
    if (!lit().length) allOut();
  }
  function allOut() {
    stopMic();
    setTimeout(() => {
      $("#cakeWish").textContent = "Fais un vœu, Arthur…";
      confetti(320); SFX.fanfare(); SFX.cheer(0.7);
      $("#relight").hidden = false;
    }, 300);
  }
  candlesEl.addEventListener("click", e => { const c = e.target.closest(".candle"); if (c) blow(c); });
  $("#blowAll").addEventListener("click", () => lit().forEach((c, i) => setTimeout(() => blow(c), i * 70 + Math.random() * 60)));
  $("#relight").addEventListener("click", () => {
    candles.forEach((c, i) => setTimeout(() => c.classList.remove("out"), i * 50));
    $("#cakeWish").textContent = ""; $("#relight").hidden = true;
  });
  let micStream = null, micRaf = null;
  function stopMic() {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    micStream = null; cancelAnimationFrame(micRaf);
    $("#blowMic").classList.remove("listening"); $("#blowMic span").textContent = "Souffler dans le micro";
  }
  $("#blowMic").addEventListener("click", async () => {
    if (micStream) return stopMic();
    try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { toast("Micro indisponible — clique sur les bougies."); return; }
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const an = ac.createAnalyser(); an.fftSize = 512;
    ac.createMediaStreamSource(micStream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    $("#blowMic").classList.add("listening"); $("#blowMic span").textContent = "Souffle fort !";
    let lastBlow = 0;
    (function listen(t) {
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
      if (Math.sqrt(sum / buf.length) > 18 && t - lastBlow > 90) { lastBlow = t; const l = lit(); if (l.length) blow(l[(Math.random() * l.length) | 0]); }
      if (micStream) micRaf = requestAnimationFrame(listen); else ac.close();
    })(0);
  });

  /* =================================================================
     TICKET À GRATTER
     ================================================================= */
  (() => {
    const B = D.billet || {};
    const setT = (id, v) => { const el = $(id); if (el && v != null) el.textContent = v; };
    setT("#tkSaison", B.saison); setT("#tkDate", B.date); setT("#tkComp", B.competition);
    setT("#tkHome", B.domicile); setT("#tkAway", B.exterieur); setT("#tkHolder", B.titulaire);
    setT("#tkMention", B.mention); setT("#tkTarif", B.tarif); setT("#tkAcces", B.acces); setT("#tkRang", B.rang); setT("#tkSiege", B.siege);
    // code-barres (barres générées à partir de la date de naissance et du 18e anniversaire)
    const code = "2012200818" + "20122026";
    setT("#tkBarNum", code.replace(/(\d{4})(?=\d)/g, "$1 "));
    let bars = "", x = 4;
    for (const ch of code + code.split("").reverse().join("")) {
      const n = +ch;
      bars += `<rect x="${x}" y="0" width="${1 + (n % 3)}" height="60" fill="#111"/>`;
      x += 2 + (n % 3) + ((n * 7) % 4);
    }
    $("#tkBarcode").setAttribute("viewBox", `0 0 ${x + 4} 60`);
    $("#tkBarcode").innerHTML = bars;
    $("#giftTitle").textContent = D.cadeau.titre;
    $("#giftText").textContent = D.cadeau.texte;
    const cv = $("#scratchCanvas"), ctx = cv.getContext("2d");
    let done = false, scratching = false, lastPt = null, strokes = 0;
    function paint() {
      if (done) return;
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, r.width, r.height);
      g.addColorStop(0, "#c9a227"); g.addColorStop(.3, "#f7dc7a"); g.addColorStop(.5, "#b8892a"); g.addColorStop(.75, "#f5d36a"); g.addColorStop(1, "#a87b1f");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * r.width, Math.random() * r.height, 2, 2);
      ctx.fillStyle = "rgba(60,40,0,.75)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `${Math.min(r.width * 0.09, 46)}px "Bebas Neue", Impact, sans-serif`;
      ctx.fillText("✦ GRATTE ICI ✦", r.width / 2, r.height / 2);
      ctx.font = `${Math.min(r.width * 0.035, 16)}px Inter, sans-serif`;
      ctx.fillText("ticket gagnant à 100 %", r.width / 2, r.height / 2 + Math.min(r.width * 0.07, 36));
    }
    new ResizeObserver(paint).observe(cv);
    if (document.fonts) document.fonts.ready.then(paint);
    function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function scratchAt(p) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineWidth = 46;
      ctx.beginPath(); ctx.moveTo((lastPt || p).x, (lastPt || p).y); ctx.lineTo(p.x, p.y); ctx.stroke();
      lastPt = p;
      if (++strokes % 12 === 0) { SFX.pop(900 + Math.random() * 400); check(); }
    }
    function check() {
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 16) { total++; if (data[i] < 40) clear++; }
      if (clear / total > 0.5) reveal();
    }
    function reveal() {
      if (done) return; done = true;
      cv.classList.add("done"); confetti(260, ["#f5c542", "#ffffff", "#e30613"]); SFX.fanfare(); SFX.cheer(0.6);
      setTimeout(() => $("#mticket").classList.add("validated"), 500);
    }
    cv.addEventListener("pointerdown", e => { scratching = true; lastPt = null; cv.setPointerCapture(e.pointerId); scratchAt(pos(e)); });
    cv.addEventListener("pointermove", e => { if (scratching) scratchAt(pos(e)); });
    const end = () => { if (scratching) { scratching = false; lastPt = null; check(); } };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  })();

  /* =================================================================
     CASIER N°18
     ================================================================= */
  (() => {
    $("#lockerTitle").textContent = D.casier.titre;
    $("#lockerText").textContent = D.casier.texte;
    const locker = $("#locker"), lock = $("#lockerLock"), count = $("#lockerCount");
    const isOpen = () => D.casier.verrouille === false || isBirthdayPassed();
    function tick() {
      if (isOpen()) {
        count.textContent = locker.classList.contains("open") ? "" : "Le casier est déverrouillé. Clique sur la porte.";
        $("#lockerLead").textContent = isBirthdayPassed()
          ? "C'est le grand jour : le casier n°18 est enfin déverrouillé."
          : "Le casier n°18 est déverrouillé : clique sur la porte pour l'ouvrir.";
        lock.classList.add("unlocked");
        return;
      }
      const s = Math.floor((majority - Date.now()) / 1000);
      count.textContent = `Ouverture dans ${Math.floor(s / 86400)} j ${pad(Math.floor(s / 3600) % 24)} h ${pad(Math.floor(s / 60) % 60)} min ${pad(s % 60)} s`;
    }
    tick(); setInterval(tick, 1000);
    $("#lockerDoor").addEventListener("click", () => {
      if (!isOpen()) {
        lock.classList.remove("shake"); void lock.offsetWidth; lock.classList.add("shake");
        SFX.pop(160);
        const d = Math.ceil((majority - Date.now()) / 86400000);
        toast(`Fermé à clé. Patience… encore ${d} jour${d > 1 ? "s" : ""}.`);
        return;
      }
      if (locker.classList.contains("open")) return;
      locker.classList.add("open"); count.textContent = "";
      SFX.fanfare(); setTimeout(() => { confetti(260); SFX.cheer(); }, 600);
    });
  })();

  /* =================================================================
     FEU D'ARTIFICE FINAL
     ================================================================= */
  (() => {
    const cv = $("#fireworks"), ctx = cv.getContext("2d");
    let W = 0, H = 0, rockets = [], sparks = [], visible = false, raf = null, lastLaunch = 0, whistled = false;
    const FW = ["#e30613", "#ffffff", "#3a5bd9", "#f5c542", "#ff5ab4", "#5affc8"];
    function resize() { const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * devicePixelRatio; cv.height = H * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
    new ResizeObserver(resize).observe(cv);
    function launch() {
      rockets.push({ x: W * (0.15 + Math.random() * 0.7), y: H, vx: (Math.random() - 0.5) * 60, vy: -(H * (0.9 + Math.random() * 0.45)), ty: H * (0.15 + Math.random() * 0.3), c: FW[(Math.random() * FW.length) | 0] });
    }
    function explode(r) {
      const n = 60 + (Math.random() * 40) | 0, sp = 120 + Math.random() * 140, heart = Math.random() < 0.15;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        let vx = Math.cos(a) * sp * (0.6 + Math.random() * 0.4), vy = Math.sin(a) * sp * (0.6 + Math.random() * 0.4);
        if (heart) { const t = a; vx = 16 * Math.sin(t) ** 3 * 9; vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 9; }
        sparks.push({ x: r.x, y: r.y, vx, vy, life: 1, c: Math.random() < 0.2 ? "#fff" : r.c });
      }
      SFX.boom();
    }
    function frame(t) {
      const dt = 1 / 60;
      ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      if (visible && !reduceMotion && t - lastLaunch > 650) { lastLaunch = t; launch(); }
      rockets.forEach(r => { r.x += r.vx * dt; r.y += r.vy * dt; r.vy += H * 0.5 * dt; ctx.fillStyle = "#ffe9a8"; ctx.fillRect(r.x - 1.5, r.y - 1.5, 3, 3); });
      rockets = rockets.filter(r => { if (r.y <= r.ty || r.vy >= 0) { explode(r); return false; } return true; });
      sparks.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 90 * dt; s.vx *= 0.985; s.vy *= 0.985; s.life -= dt * 0.75;
        ctx.globalAlpha = Math.max(0, s.life); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 1.8, 0, 6.3); ctx.fill(); });
      ctx.globalAlpha = 1;
      sparks = sparks.filter(s => s.life > 0);
      raf = (visible || rockets.length || sparks.length) ? requestAnimationFrame(frame) : null;
    }
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) {
        if (!whistled) { whistled = true; SFX.whistle("final"); setTimeout(() => SFX.cheer(), 1200); }
        if (!raf) raf = requestAnimationFrame(frame);
      }
    }, { threshold: 0.35 }).observe($("#finale"));
    $("#replayFireworks").addEventListener("click", () => {
      for (let i = 0; i < 9; i++) setTimeout(launch, i * 140);
      if (!raf) raf = requestAnimationFrame(frame);
    });
  })();

  /* =================================================================
     MINUTE DE MATCH + BARRE DE PROGRESSION
     ================================================================= */
  const minuteEl = $("#matchMinute"), progressEl = $("#progress"), halfEl = $("#matchHalf"), scorebarEl = $("#scorebar");
  let lastMinute = "", scrollRaf = 0;
  function onScroll() {
    scrollRaf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    progressEl.style.transform = `scaleX(${p.toFixed(4)})`;
    const m = Math.round(p * 93);
    const txt = m <= 90 ? `${m}'` : `90+${m - 90}'`;
    if (txt !== lastMinute) {
      minuteEl.textContent = txt;
      if (lastMinute && !reduceMotion && minuteEl.animate)
        minuteEl.animate([{ transform: "scale(1.3)", color: "#fff" }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.3,1.5,.5,1)" });
      lastMinute = txt;
    }
    halfEl.textContent = m < 45 ? "1re MT" : "2e MT";
    scorebarEl.classList.toggle("is-scrolled", scrollY > 24);
  }
  addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll); }, { passive: true }); onScroll();
})();
