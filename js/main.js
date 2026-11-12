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
    $("#dogStats").innerHTML = P.chien.stats.map((st, k) => `<div><span>${st.label}</span><i style="--v:${st.valeur}%;--k:${k}"></i><b>${st.valeur}</b></div>`).join("");

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
     FICHE BULLDOG : reflet qui suit la souris + compteurs des stats
     ================================================================= */
  (() => {
    const cardEl = $("#dogcard"); if (!cardEl) return;
    new IntersectionObserver(([en], io) => {
      if (!en.isIntersecting) return; io.disconnect();
      if (reduceMotion) return;
      $$("#dogStats b").forEach((b, k) => {
        const target = +b.textContent; if (!target) return;
        const t0 = performance.now() + 300 + k * 120;
        b.textContent = "0";
        (function step(t) {
          const p = Math.min(1, Math.max(0, (t - t0) / 1300));
          b.textContent = Math.round(target * (1 - (1 - p) ** 3));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.3 }).observe(cardEl);
    if (!reduceMotion && matchMedia("(hover: hover)").matches) {
      const shine = $(".dogcard__shine", cardEl);
      cardEl.addEventListener("pointermove", e => {
        const r = cardEl.getBoundingClientRect();
        shine.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        shine.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    }
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
     Scène en fausse 3D : tout est calculé en mètres puis projeté
     (caméra derrière le tireur), ce qui donne perspective, taille du
     ballon, ombre et filet cohérents. Ralenti + replay sur le dernier tir.
     ================================================================= */
  (() => {
    const TOTAL = 5, RM = reduceMotion;
    const scene = $("#pkScene"), world = $("#pkWorld"), zonesEl = $("#goalZones"), goalEl = $("#goal"),
          keeper = $("#keeper"), kicker = $("#kicker"), pkBall = $("#pkBall"), pkShadow = $("#pkShadow"),
          banner = $("#pkMsg"), hint = $("#pkHint"), flash = $("#pkFlash"), boards = $("#pkBoards"), result = $("#pkResult");
    const pitchCv = $("#pkPitch"), crowdCv = $("#pkCrowd"), netCv = $("#pkNet"), fxCv = $("#pkFx");
    const pctx = pitchCv.getContext("2d"), cctx = crowdCv.getContext("2d"), nctx = netCv.getContext("2d"), fctx = fxCv.getContext("2d");
    const keeperFig = new FIG.Figure($("#keeperFig"), "keeper");
    const kickerFig = new FIG.Figure($("#kickerFig"), "kicker");
    pkBall.innerHTML = FIG.ballSVG();
    const pkPattern = pkBall.querySelector(".ball-pattern");
    zonesEl.innerHTML = Array.from({ length: 6 }, (_, i) => `<button data-z="${i}" aria-label="Tirer ${i < 3 ? "en haut" : "en bas"} ${["à gauche", "au centre", "à droite"][i % 3]}"></button>`).join("");
    $("#pkDots").innerHTML = "<i></i>".repeat(TOTAL);
    const dots = $$("#pkDots i");

    /* ---------- géométrie (mètres) ---------- */
    const Z_SPOT = 10, Z_GOAL = 21, GW = 7.32, GH = 2.44, NET_D = 1.8, NET_HB = 2.05, Z_BACK = Z_GOAL + NET_D, Z_BOARD = Z_BACK + 3.6;
    const BALL_D = 0.22, KICK_SCALE = 0.76, Z_KREF = 9.5;
    const V = { W: 1, H: 1, cx: 0, yh: 0, K: 1, Kx: 1, kpx: 1, ballPx: 30, kickW: 100, kickH: 150, crowdH: 100, boardTop: 0, boardBot: 0 };
    const proj = (X, Y, Z) => [V.cx + V.Kx * X / Z, V.yh + (V.K - V.Kx * Y) / Z];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lin = t => t, eOut = FIG.easeOut, eInOut = FIG.easeInOut, eIn = t => t * t * t;
    const eBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

    /* ---------- état ---------- */
    const B = { X: 0, Y: BALL_D / 2, Z: Z_SPOT, vx: 0, vy: 0, vz: 0, rot: 0, spin: 0, op: 1, phys: null, trail: false };
    const KS = { X: -1.6, Z: 8.3, lift: 0, op: 1 };          // tireur
    const kIdleX = () => (V.W / V.H < 1.2 ? -1.1 : -1.6);
    const KP = { dx: 0, dy: 0, rot: 0 };                        // gardien (m, m, deg)
    let shots = 0, goals = 0, busy = false, results = [], speedTarget = 1, crowdE = 0;

    /* ---------- moteur de tweens « ralentissables » ---------- */
    let tweens = [];
    const tween = (ms, fn, ease = lin) => new Promise(res => { tweens.push({ t: 0, ms: Math.max(1, ms), fn, ease, res }); wake(); });
    const wait = ms => tween(ms, () => {});
    const lerpTo = (o, to, ms, ease = eOut) => { const fr = {}; for (const k in to) fr[k] = o[k]; return tween(ms, e => { for (const k in to) o[k] = fr[k] + (to[k] - fr[k]) * e; }, ease); };
    function runTweens(sdt) {
      if (!tweens.length) return;
      const list = tweens; tweens = [];
      const keep = [];
      for (const tw of list) {
        tw.t += sdt * 1000;
        const k = Math.min(1, tw.t / tw.ms);
        tw.fn(tw.ease(k));
        if (k < 1) keep.push(tw); else tw.res();
      }
      tweens = keep.concat(tweens);
    }

    /* ---------- mise en page / projection ---------- */
    let pdpr = 1, cdpr = 1, ndpr = 1;
    function layout() {
      const W = world.offsetWidth, H = world.offsetHeight;
      if (!W || !H) return false;
      const tall = W / H < 1.2;
      const gw = W * (tall ? 0.84 : 0.66);
      const ygl = H * (tall ? 0.57 : 0.6), ysp = H * (tall ? 0.84 : 0.86);
      Object.assign(V, { W, H, cx: W / 2 });
      V.Kx = gw / GW * Z_GOAL;
      V.K = (ysp - ygl) / (1 / Z_SPOT - 1 / Z_GOAL);
      V.yh = ygl - V.K / Z_GOAL;
      V.kpx = V.Kx / Z_GOAL;
      // but (cadre avant)
      const [gx0, gy0] = proj(-GW / 2, GH, Z_GOAL), [gx1, gy1] = proj(GW / 2, 0, Z_GOAL);
      Object.assign(goalEl.style, { left: gx0 + "px", top: gy0 + "px", width: gx1 - gx0 + "px", height: gy1 - gy0 + "px" });
      goalEl.style.setProperty("--post", Math.max(3, 0.12 * V.kpx).toFixed(1) + "px");
      // gardien : 2 m (avec la marge du dessin), pieds sur la ligne
      const hk = V.kpx * 2.0 * 300 / 260;
      Object.assign(keeper.style, { width: hk * 2 / 3 + "px", height: hk + "px", marginLeft: -hk / 3 + "px", bottom: -(18 / 300) * hk + "px" });
      // panneaux LED derrière le but
      V.boardTop = proj(0, 0.62, Z_BOARD)[1]; V.boardBot = proj(0, 0, Z_BOARD)[1];
      Object.assign(boards.style, { top: V.boardTop + "px", height: V.boardBot - V.boardTop + "px" });
      boards.style.setProperty("--bfs", ((V.boardBot - V.boardTop) * 0.6).toFixed(1) + "px");
      V.crowdH = Math.ceil(V.boardTop + 2);
      crowdCv.style.height = V.crowdH + "px";
      // ballon, tireur
      V.ballPx = BALL_D * V.Kx / Z_SPOT;
      pkBall.style.width = pkBall.style.height = V.ballPx + "px";
      pkShadow.style.width = V.ballPx * 1.3 + "px"; pkShadow.style.height = V.ballPx * 0.42 + "px";
      V.kickH = KICK_SCALE * 1.8 * V.Kx / Z_KREF * 300 / 257; V.kickW = V.kickH * 2 / 3;
      kicker.style.width = V.kickW + "px"; kicker.style.height = V.kickH + "px";
      const dpr = Math.min(2, devicePixelRatio || 1);
      pdpr = Math.min(2.5, dpr * 1.3); cdpr = dpr; ndpr = Math.min(2, dpr * 1.2);
      fxCv.width = W * ndpr; fxCv.height = H * ndpr;
      netCv.width = W * ndpr; netCv.height = H * ndpr;
      drawPitch(); buildCrowd(); netDirty = true; drawNet();
      return true;
    }

    /* ---------- pelouse (pré-rendue) ---------- */
    const Yz = z => V.yh + V.K / z;
    function quad(c, x0, z0, x1, z1, w) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w / 2, nz = dx / L * w / 2;
      const p = [proj(x0 + nx, 0, z0 + nz), proj(x1 + nx, 0, z1 + nz), proj(x1 - nx, 0, z1 - nz), proj(x0 - nx, 0, z0 - nz)];
      c.beginPath(); c.moveTo(...p[0]); for (let i = 1; i < 4; i++) c.lineTo(...p[i]); c.closePath(); c.fill(); c.stroke();
    }
    function drawPitch() {
      const { W, H } = V, c = pctx;
      pitchCv.width = W * pdpr; pitchCv.height = H * pdpr;
      c.setTransform(pdpr, 0, 0, pdpr, 0, 0);
      const top = V.boardBot - 1;
      let g = c.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, "#14532a"); g.addColorStop(0.35, "#1d7a3a"); g.addColorStop(1, "#2ea14f");
      c.fillStyle = g; c.fillRect(0, top, W, H - top);
      // bandes de tonte parallèles à la ligne de but
      for (let z = 60, i = 0; z > 2.5; z -= 2.75, i++) {
        const y0 = Math.max(top, Yz(z)), y1 = Math.min(H, Yz(z - 2.75));
        if (y1 <= top) continue;
        c.fillStyle = i % 2 ? "rgba(255,255,255,.055)" : "rgba(0,0,0,.05)"; c.fillRect(0, y0, W, y1 - y0);
      }
      // bandes de tonte en long, très légères
      for (let x = -40, i = 0; x < 40; x += 4, i++) {
        if (i % 2) continue;
        c.fillStyle = "rgba(255,255,255,.025)";
        c.beginPath(); c.moveTo(...proj(x, 0, 60)); c.lineTo(...proj(x + 4, 0, 60)); c.lineTo(...proj(x + 4, 0, 3)); c.lineTo(...proj(x, 0, 3)); c.fill();
      }
      // flaques de lumière des projecteurs
      c.save(); c.globalCompositeOperation = "lighter";
      for (const [lx, a] of [[0.2, .13], [0.8, .13], [0.5, .08]]) {
        const cx = W * lx, cy = Yz(13);
        c.save(); c.translate(cx, cy); c.scale(1, 0.32);
        const rg = c.createRadialGradient(0, 0, 0, 0, 0, W * 0.55);
        rg.addColorStop(0, `rgba(200,255,200,${a})`); rg.addColorStop(1, "rgba(200,255,200,0)");
        c.fillStyle = rg; c.fillRect(-W, -W * 2, W * 2, W * 4); c.restore();
      }
      c.restore();
      // ombre du but et du filet au sol
      c.save(); c.fillStyle = "rgba(0,10,0,.28)"; c.filter = `blur(${Math.max(2, V.kpx * 0.12)}px)`;
      c.beginPath(); c.moveTo(...proj(-GW / 2, 0, Z_GOAL)); c.lineTo(...proj(GW / 2, 0, Z_GOAL)); c.lineTo(...proj(GW / 2 + 0.6, 0, Z_BACK + 0.4)); c.lineTo(...proj(-GW / 2 - 0.2, 0, Z_BACK + 0.4)); c.fill();
      c.restore();
      // lignes
      c.fillStyle = c.strokeStyle = "rgba(255,255,255,.86)"; c.lineWidth = 0.7; c.lineJoin = "round";
      const w = 0.12;
      quad(c, -40, Z_GOAL, 40, Z_GOAL, w);
      quad(c, -9.16, Z_GOAL, -9.16, Z_GOAL - 5.5, w); quad(c, 9.16, Z_GOAL, 9.16, Z_GOAL - 5.5, w); quad(c, -9.16, Z_GOAL - 5.5, 9.16, Z_GOAL - 5.5, w);
      quad(c, -20.16, Z_GOAL, -20.16, 4.5, w); quad(c, 20.16, Z_GOAL, 20.16, 4.5, w);
      // point de penalty
      const [sx, sy] = proj(0, 0, Z_SPOT), rx = 0.13 * V.Kx / Z_SPOT, ry = (Yz(Z_SPOT - 0.13) - Yz(Z_SPOT + 0.13)) / 2;
      c.beginPath(); c.ellipse(sx, sy, rx, Math.max(1.2, ry), 0, 0, Math.PI * 2); c.fill();
      // vignette basse
      g = c.createLinearGradient(0, H * 0.7, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.28)");
      c.fillStyle = g; c.fillRect(0, H * 0.7, W, H * 0.3);
    }

    /* ---------- tribunes : foule animée + tifo ---------- */
    let fans = [], standBg = null, crowdFrame = 0, camFlashes = [];
    const SKIN = ["#f1c9a1", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#d9a173"];
    function buildCrowd() {
      const W = V.W, Hc = V.crowdH;
      crowdCv.width = W * cdpr; crowdCv.height = Hc * cdpr;
      standBg = document.createElement("canvas"); standBg.width = crowdCv.width; standBg.height = crowdCv.height;
      const g = standBg.getContext("2d"); g.scale(cdpr, cdpr);
      const roofY = Hc * 0.14;
      let gr = g.createLinearGradient(0, 0, 0, Hc);
      gr.addColorStop(0, "#01030c"); gr.addColorStop(0.18, "#050a22"); gr.addColorStop(1, "#14245e");
      g.fillStyle = gr; g.fillRect(0, 0, W, Hc);
      // toit + rampes de projecteurs
      g.fillStyle = "#02040d"; g.fillRect(0, 0, W, roofY);
      g.fillStyle = "rgba(255,255,255,.06)"; for (let x = 0; x < W; x += Math.max(14, W * 0.03)) g.fillRect(x, 0, 1.5, roofY);
      g.fillStyle = "rgba(120,140,200,.35)"; g.fillRect(0, roofY - 2, W, 2);
      g.save(); g.globalCompositeOperation = "lighter";
      for (const lx of [0.14, 0.38, 0.62, 0.86]) {
        const cx = W * lx, cy = roofY * 0.55, bw = W * 0.075, bh = roofY * 0.5;
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.16);
        rg.addColorStop(0, "rgba(230,240,255,.55)"); rg.addColorStop(0.25, "rgba(160,190,255,.18)"); rg.addColorStop(1, "rgba(120,150,255,0)");
        g.fillStyle = rg; g.fillRect(cx - W * 0.2, 0, W * 0.4, Hc);
        g.fillStyle = "rgba(255,255,255,.95)";
        const n = 6, cw = bw / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) g.fillRect(cx - bw / 2 + i * cw + 1, cy - bh / 2 + j * bh / 2 + 1, cw - 2, bh / 2 - 2);
      }
      g.restore();
      // balcons / séparations de tribunes
      for (const f of [0.5, 0.78]) {
        const y = roofY + (Hc - roofY) * f;
        g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, y, W, Math.max(2, Hc * 0.018));
        g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(0, y, W, 1);
      }
      // tifo : texte échantillonné sur les cartons du haut
      const tc = document.createElement("canvas"), tw = 84, th = 60;
      tc.width = tw; tc.height = th;
      const tg = tc.getContext("2d");
      tg.fillStyle = "#000"; tg.font = `${th * 0.95}px "Bebas Neue", Impact, sans-serif`; tg.textAlign = "center"; tg.textBaseline = "middle";
      tg.fillText("18", tw / 2, th * 0.56);
      const td = tg.getImageData(0, 0, tw, th).data;
      const goalTop = proj(0, GH, Z_GOAL)[1];
      const tifoTop = roofY + 2, tifoBot = Math.max(tifoTop + 20, Math.min(roofY + (Hc - roofY) * 0.55, goalTop - 4));
      const tw2 = Math.min(W * 0.4, (tifoBot - tifoTop) * 1.5), tx0 = W / 2 - tw2 / 2, tx1 = W / 2 + tw2 / 2;
      fans = [];
      const sBot = Math.max(4.2, W * 0.0105), sTop = sBot * 0.55;
      let y = Hc - sBot * 0.3, row = 0;
      while (y > roofY + sTop) {
        const f = (y - roofY) / (Hc - roofY), s = sTop + (sBot - sTop) * f;
        const people = y > tifoBot + s;
        for (let x = (row % 2) * s * 0.5 - s; x < W + s; x += s * 1.06) {
          const fan = { x: x + (Math.random() - 0.5) * s * 0.25, y, s, ph: Math.random() * Math.PI * 2, jump: 0.5 + Math.random() * 0.7 };
          if (!people) {
            fan.card = true;
            let col;
            const u = (x - tx0) / (tx1 - tx0), v = (y - tifoTop) / (tifoBot - tifoTop);
            const inText = u >= 0 && u < 1 && v >= 0 && v < 1 && td[((v * th | 0) * tw + (u * tw | 0)) * 4 + 3] > 100;
            const band = Math.abs(x - W / 2) / W;
            if (inText) col = "#f6f7fb";
            else if (band < 0.07) col = "#d9061a";
            else if (band < 0.085) col = "#e9ecf5";
            else col = Math.random() < 0.5 ? "#1a2f7a" : "#14266a";
            fan.c = col;
          } else {
            fan.c = Math.random() < 0.45 ? "#1d3584" : Math.random() < 0.55 ? "#d9061a" : Math.random() < 0.6 ? "#f2f4f8" : "#0b1640";
            fan.skin = SKIN[(Math.random() * SKIN.length) | 0];
            fan.arms = Math.random() < 0.45;
            fan.scarf = Math.random() < 0.3 ? (Math.random() < 0.5 ? "#e30613" : "#f2f4f8") : null;
          }
          fans.push(fan);
        }
        y -= s * 1.1; row++;
      }
      // les cartons d'abord (derrière), puis les supporters
      fans.sort((a, b) => a.y - b.y);
      crowdFrame = 0;
    }
    function drawCrowd(dt, now) {
      if (!standBg) return;
      crowdE = Math.max(0, crowdE - dt * 0.2);
      const active = crowdE > 0.02 && !RM;
      crowdFrame++;
      if (RM && crowdFrame > 2) return;                                   // image fixe
      if (!active && crowdFrame % 2) return;                             // 30 i/s au repos
      const c = cctx, W = V.W, Hc = V.crowdH, t = now / 1000;
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(standBg, 0, 0);
      c.setTransform(cdpr, 0, 0, cdpr, 0, 0);
      const waveX = ((t * 0.12) % 1.8 - 0.4) * W, waveW = W * 0.05;   // ola permanente
      for (const f of fans) {
        let dy = RM ? 0 : Math.sin(t * 1.7 + f.ph) * f.s * 0.07;
        const wv = RM ? 0 : Math.exp(-(((f.x - waveX) / waveW) ** 2));
        dy -= wv * f.s * 0.7;
        if (active) dy -= Math.max(0, Math.sin(t * 10 + f.ph * 3)) * f.s * crowdE * f.jump;
        if (f.card) {
          const flick = active && Math.sin(t * 14 + f.ph * 5) > 0.92;
          c.fillStyle = flick ? "#f5c542" : f.c;
          c.fillRect(f.x, f.y + dy, f.s * 0.94, f.s * 0.86);
        } else {
          const s = f.s, x = f.x, y = f.y + dy;
          c.fillStyle = f.c; c.fillRect(x, y + s * 0.42, s * 0.9, s * 0.75);
          c.fillStyle = f.skin; c.fillRect(x + s * 0.2, y, s * 0.5, s * 0.5);
          if ((active && f.arms) || wv > 0.4) {
            c.fillStyle = f.scarf || f.skin;
            c.fillRect(x - s * 0.05, y - s * 0.55, s * 0.18, s * 0.95);
            c.fillRect(x + s * 0.77, y - s * 0.55, s * 0.18, s * 0.95);
            if (f.scarf) c.fillRect(x - s * 0.05, y - s * 0.6, s, s * 0.18);
          }
        }
      }
      // drapeaux
      for (const [fx, col] of [[0.1, 0], [0.9, 1]]) {
        const px = W * fx, py = Hc - 1, ph = Hc * 0.42, fw = Hc * 0.34, fh = Hc * 0.2;
        c.fillStyle = "#c9ced9"; c.fillRect(px - 1, py - ph, 2, ph);
        const top = py - ph + 1, wave = (u, k) => Math.sin(t * (active ? 9 : 4) + u * 5 + k) * fh * 0.14 * u;
        const cols = col ? ["#1d3584", "#f2f4f8", "#e30613", "#f2f4f8", "#1d3584"] : ["#e30613", "#1d3584", "#e30613"];
        const N = 14;
        for (let i = 0; i < N; i++) {
          const u0 = i / N, u1 = (i + 1) / N;
          c.fillStyle = cols[Math.floor(u0 * cols.length)];
          c.beginPath();
          c.moveTo(px + u0 * fw, top + wave(u0, 0)); c.lineTo(px + u1 * fw + 0.6, top + wave(u1, 0));
          c.lineTo(px + u1 * fw + 0.6, top + fh + wave(u1, 0.6)); c.lineTo(px + u0 * fw, top + fh + wave(u0, 0.6));
          c.fill();
        }
      }
      // flashs d'appareils photo
      if (active && Math.random() < crowdE * 0.9) camFlashes.push({ x: Math.random() * W, y: Hc * (0.2 + Math.random() * 0.75), l: 1 });
      if (camFlashes.length) {
        c.globalCompositeOperation = "lighter";
        for (const fl of camFlashes) {
          const r = 6 * fl.l + 2;
          const rg = c.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, r);
          rg.addColorStop(0, `rgba(255,255,255,${fl.l})`); rg.addColorStop(1, "rgba(255,255,255,0)");
          c.fillStyle = rg; c.fillRect(fl.x - r, fl.y - r, r * 2, r * 2);
          fl.l -= dt * 5;
        }
        camFlashes = camFlashes.filter(f => f.l > 0);
        c.globalCompositeOperation = "source-over";
      }
      if (active) { c.fillStyle = `rgba(255,230,160,${crowdE * 0.08})`; c.fillRect(0, 0, W, Hc); }
    }

    /* ---------- filet : grille ressort, se déforme à l'impact ---------- */
    const NX = 27, NY = 11, nd = new Float32Array(NX * NY), nv = new Float32Array(NX * NY);
    let netDirty = true, netHit = null;
    const nX = i => -GW / 2 + i * GW / (NX - 1), nY = j => j * NET_HB / (NY - 1);
    function netReset() { nd.fill(0); nv.fill(0); netHit = null; netDirty = true; }
    function netImpulse(X, Y, amp) {
      netHit = { X, Y };
      for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
        const r2 = (nX(i) - X) ** 2 + ((nY(j) - Y) * 1.2) ** 2;
        nv[j * NX + i] += amp * Math.exp(-r2 / 0.55);
      }
      netDirty = true;
    }
    const netAt = (X, Y) => {
      const i = clamp(Math.round((X + GW / 2) / GW * (NX - 1)), 0, NX - 1), j = clamp(Math.round(Y / NET_HB * (NY - 1)), 0, NY - 1);
      return nd[j * NX + i];
    };
    function netStep(sdt) {
      if (!netDirty || sdt <= 0) return;
      const n = Math.min(12, Math.ceil(sdt / (1 / 240))), h = sdt / n;
      let e = 0;
      for (let s = 0; s < n; s++) {
        for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
          const k = j * NX + i;
          const lap = nd[k - 1] + nd[k + 1] + nd[k - NX] + nd[k + NX] - 4 * nd[k];
          nv[k] += (lap * 900 - nd[k] * 40 - nv[k] * 6) * h;
        }
        for (let k = 0; k < nd.length; k++) { nd[k] = clamp(nd[k] + nv[k] * h, -0.3, 1.1); }
      }
      for (let k = 0; k < nd.length; k++) e = Math.max(e, Math.abs(nd[k]) + Math.abs(nv[k]) * 0.05);
      drawNet();
      if (e < 0.002) { nd.fill(0); nv.fill(0); netDirty = false; drawNet(); }
    }
    function netPt(i, j) {
      const k = j * NX + i, d = nd[k], X = nX(i), Y = nY(j);
      let [x, y] = proj(X, Y, Z_BACK + d * 0.6);
      if (netHit && d > 0.001) {                                       // poche : les mailles convergent vers l'impact
        const [hx, hy] = proj(netHit.X, netHit.Y, Z_BACK + d);
        const pull = Math.min(0.45, d * 0.4);
        x += (hx - x) * pull; y += (hy - y) * pull + d * V.kpx * 0.12;
      }
      return [x, y];
    }
    function drawNet() {
      const c = nctx;
      c.setTransform(ndpr, 0, 0, ndpr, 0, 0); c.clearRect(0, 0, V.W, V.H);
      const P = [];
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) P.push(netPt(i, j));
      const at = (i, j) => P[j * NX + i];
      // fond du filet (léger voile sombre)
      const f0 = proj(-GW / 2, GH, Z_GOAL), f1 = proj(GW / 2, GH, Z_GOAL), f2 = proj(GW / 2, 0, Z_GOAL), f3 = proj(-GW / 2, 0, Z_GOAL);
      c.fillStyle = "rgba(4,10,30,.34)";
      c.beginPath(); c.moveTo(...f0); c.lineTo(...f1); c.lineTo(...f2); c.lineTo(...f3); c.fill();
      const lw = Math.max(0.6, 0.025 * V.kpx);
      c.lineWidth = lw; c.lineJoin = "round";
      // panneau du fond
      c.strokeStyle = "rgba(235,240,255,.42)";
      c.beginPath();
      for (let j = 0; j < NY; j++) { c.moveTo(...at(0, j)); for (let i = 1; i < NX; i++) c.lineTo(...at(i, j)); }
      for (let i = 0; i < NX; i++) { c.moveTo(...at(i, 0)); for (let j = 1; j < NY; j++) c.lineTo(...at(i, j)); }
      c.stroke();
      // côtés et toit (statiques)
      c.strokeStyle = "rgba(235,240,255,.3)";
      c.beginPath();
      const DS = 5;
      for (const sx of [-1, 1]) {
        const X = sx * GW / 2;
        for (let k = 1; k < DS; k++) { const u = k / DS, Z = Z_GOAL + NET_D * u, top = GH + (NET_HB - GH) * u; c.moveTo(...proj(X, 0, Z)); c.lineTo(...proj(X, top, Z)); }
        for (let j = 1; j < NY; j++) { const Yb = nY(j), Yf = Yb / NET_HB * GH; c.moveTo(...proj(X, Yf, Z_GOAL)); c.lineTo(...proj(X, Yb, Z_BACK)); }
      }
      for (let i = 1; i < NX - 1; i += 1) { c.moveTo(...proj(nX(i), GH, Z_GOAL)); c.lineTo(...at(i, NY - 1)); }
      for (let k = 1; k < DS; k++) { const u = k / DS, Z = Z_GOAL + NET_D * u, Y = GH + (NET_HB - GH) * u; c.moveTo(...proj(-GW / 2, Y, Z)); c.lineTo(...proj(GW / 2, Y, Z)); }
      c.stroke();
      // armature arrière
      c.strokeStyle = "rgba(220,226,240,.75)"; c.lineWidth = Math.max(1, 0.05 * V.kpx);
      c.beginPath();
      for (const sx of [-1, 1]) { const X = sx * GW / 2; c.moveTo(...proj(X, GH, Z_GOAL)); c.lineTo(...proj(X, NET_HB, Z_BACK)); c.lineTo(...proj(X, 0, Z_BACK)); }
      c.moveTo(...proj(-GW / 2, NET_HB, Z_BACK)); c.lineTo(...proj(GW / 2, NET_HB, Z_BACK));
      c.stroke();
    }

    /* ---------- effets : particules, traînée ---------- */
    let parts = [], trail = [], fxClear = true;
    function burst(x, y, n, kind) {
      if (RM) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) {
        const a = kind === "grass" ? -Math.PI / 2 + (Math.random() - 0.5) * 2.2 : Math.random() * Math.PI * 2;
        const sp = (kind === "grass" ? 90 : 160) * (0.4 + Math.random()) * (V.W / 800);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: kind === "grass" ? 520 : 140, life: 1, ttl: 0.5 + Math.random() * 0.5, kind,
          s: (kind === "grass" ? 2 + Math.random() * 2.5 : 1.5 + Math.random() * 2) * (V.W / 800) + 0.5,
          c: kind === "grass" ? (Math.random() < 0.5 ? "#3fae5a" : "#7a5a32") : kind === "gold" ? (Math.random() < 0.6 ? "#f5c542" : "#fff") : "#fff" });
      }
      wake();
    }
    function drawFx(sdt) {
      const c = fctx;
      if (!parts.length && !trail.length) { if (!fxClear) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, fxCv.width, fxCv.height); fxClear = true; } return; }
      fxClear = false;
      c.setTransform(ndpr, 0, 0, ndpr, 0, 0); c.clearRect(0, 0, V.W, V.H);
      // traînée du ballon
      for (let i = 0; i < trail.length; i++) {
        const tr = trail[i], a = (i + 1) / trail.length;
        c.globalAlpha = a * 0.28 * tr.l;
        c.fillStyle = "#fff";
        c.beginPath(); c.arc(tr.x, tr.y, tr.r * (0.35 + a * 0.6), 0, Math.PI * 2); c.fill();
        tr.l -= sdt * 3;
      }
      trail = trail.filter(t => t.l > 0);
      c.globalAlpha = 1;
      c.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.vy += p.g * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.life -= sdt / p.ttl;
        c.globalAlpha = Math.max(0, p.life);
        if (p.kind === "grass") { c.globalCompositeOperation = "source-over"; c.fillStyle = p.c; c.fillRect(p.x, p.y, p.s, p.s * 0.7); c.globalCompositeOperation = "lighter"; }
        else { c.strokeStyle = p.c; c.lineWidth = p.s; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); c.stroke(); }
      }
      c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      parts = parts.filter(p => p.life > 0);
    }

    /* ---------- caméra ---------- */
    const cam = { x: 0, y: 0, s: 1 }, camT = { px: 0, py: 0, s: 1, rate: 3 };
    let camFollow = false, shake = 0;
    function focus(px, py, s, rate = 3) { if (RM) { s = 1; } Object.assign(camT, { px, py, s, rate }); wake(); }
    function camHome(rate = 2.5) { focus(V.W / 2, V.H / 2, 1, rate); }
    function camera(dt) {
      if (camFollow) {
        const [bx, by] = proj(B.X, B.Y, B.Z), [gx, gy] = proj(0, GH * 0.5, Z_GOAL);
        camT.px = bx * 0.75 + gx * 0.25; camT.py = by * 0.75 + gy * 0.25;
      }
      const s = camT.s, k = 1 - Math.exp(-dt * camT.rate);
      cam.s += (s - cam.s) * k;
      const tx = clamp(V.W / 2 - camT.px * cam.s, V.W - V.W * cam.s, 0), ty = clamp(V.H / 2 - camT.py * cam.s, V.H - V.H * cam.s, 0);
      cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
      cam.x = clamp(cam.x, V.W - V.W * cam.s, 0); cam.y = clamp(cam.y, V.H - V.H * cam.s, 0);
      let ox = 0, oy = 0;
      if (shake > 0.2 && !RM) { ox = (Math.random() - 0.5) * shake; oy = (Math.random() - 0.5) * shake; shake *= Math.exp(-dt * 8); } else shake = 0;
      world.style.transform = `translate3d(${(cam.x + ox).toFixed(2)}px, ${(cam.y + oy).toFixed(2)}px, 0) scale(${cam.s.toFixed(4)})`;
    }

    /* ---------- rendu des acteurs ---------- */
    function render() {
      // ballon
      const s = Z_SPOT / B.Z, [x, y] = proj(B.X, B.Y, B.Z);
      pkBall.style.transform = `translate3d(${(x - V.ballPx / 2).toFixed(2)}px, ${(y - V.ballPx / 2).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      pkBall.style.opacity = B.op;
      pkPattern.style.transform = `rotate(${B.rot.toFixed(1)}deg)`;
      const [sx, sy] = proj(B.X, 0, B.Z), h = Math.max(0, B.Y - BALL_D / 2);
      const ss = s * (1 + h * 0.25);
      pkShadow.style.transform = `translate3d(${(sx - V.ballPx * 0.65).toFixed(2)}px, ${(sy - V.ballPx * 0.21).toFixed(2)}px, 0) scale(${ss.toFixed(4)})`;
      pkShadow.style.opacity = (B.op * clamp(1 - h / 2.6, 0.12, 1)).toFixed(3);
      if (B.trail && B.op > 0.5) trail.push({ x, y, r: V.ballPx * s / 2, l: 1 }), trail.length > 12 && trail.shift();
      // tireur
      const ks = Z_KREF / KS.Z, [kx, ky] = proj(KS.X, KS.lift, KS.Z);
      kicker.style.transform = `translate3d(${(kx - V.kickW / 2).toFixed(2)}px, ${(ky - V.kickH * 0.95).toFixed(2)}px, 0) scale(${ks.toFixed(4)})`;
      kicker.style.opacity = KS.op;
      // gardien
      keeper.style.transform = `translate(${(KP.dx * V.kpx).toFixed(2)}px, ${(-KP.dy * V.kpx).toFixed(2)}px) rotate(${KP.rot.toFixed(2)}deg)`;
    }

    /* ---------- physique du ballon libre ---------- */
    function physics(sdt) {
      B.rot += B.spin * sdt;
      if (!B.phys || sdt <= 0) return;
      const n = 3, h = sdt / n;
      for (let i = 0; i < n; i++) {
        B.vy -= 9.81 * h;
        B.X += B.vx * h; B.Y += B.vy * h; B.Z += B.vz * h;
        if (B.Y < BALL_D / 2) { B.Y = BALL_D / 2; if (B.vy < 0) { B.vy = -B.vy * 0.45; B.vx *= 0.8; B.vz *= 0.8; B.spin *= 0.7; } if (Math.abs(B.vy) < 0.4) B.vy = 0; }
        if (B.phys === "net") {
          const lim = Z_BACK - 0.12 + netAt(B.X, B.Y) * 0.6;
          if (B.Z > lim) { B.Z = lim; B.vz = -Math.abs(B.vz) * 0.25; }
          if (B.Z < Z_GOAL + 0.2) { B.Z = Z_GOAL + 0.2; B.vz = Math.abs(B.vz) * 0.3; }
          if (Math.abs(B.X) > GW / 2 - 0.15) { B.X = Math.sign(B.X) * (GW / 2 - 0.15); B.vx *= -0.3; }
          B.vx *= 1 - h * 1.5; B.vz *= 1 - h * 1.5;
        }
      }
      B.spin *= 1 - sdt * 0.6;
    }

    /* ---------- boucle principale ---------- */
    let raf = 0, lastNow = 0, visible = false, ready = false;
    function wake() { if (!raf && ready) { lastNow = performance.now(); raf = requestAnimationFrame(frame); } }
    function frame(now) {
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
      FIG.speed += (speedTarget - FIG.speed) * Math.min(1, dt * 9);
      if (Math.abs(FIG.speed - speedTarget) < 0.01) FIG.speed = speedTarget;
      const sdt = dt * FIG.speed;
      runTweens(sdt); physics(sdt); netStep(sdt); render(); camera(dt); drawFx(sdt); drawCrowd(dt, now);
      raf = visible || busy || tweens.length || parts.length ? requestAnimationFrame(frame) : 0;
    }

    /* ---------- bandeau TV ---------- */
    let bannerT;
    function showBanner(title, sub, kind = "") {
      banner.querySelector("b").textContent = title;
      banner.querySelector("small").textContent = sub;
      banner.className = "banner " + kind;
      void banner.offsetWidth; banner.classList.add("show");
      clearTimeout(bannerT); bannerT = setTimeout(() => banner.classList.remove("show"), 1700);
    }
    function doFlash(x, y) {
      if (RM) return;
      const r = scene.getBoundingClientRect(), wr = world.getBoundingClientRect();
      flash.style.setProperty("--fx", ((wr.left - r.left + x * cam.s) / r.width * 100).toFixed(1) + "%");
      flash.style.setProperty("--fy", ((wr.top - r.top + y * cam.s) / r.height * 100).toFixed(1) + "%");
      flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
    }
    const buzz = ms => { try { if (!RM && navigator.vibrate) navigator.vibrate(ms); } catch {} };

    /* ---------- le gardien ---------- */
    let breathT = null;
    function keeperIdle() {
      keeper.classList.add("idle");
      clearInterval(breathT);
      let b = false;
      breathT = setInterval(() => { if (!busy) { b = !b; keeperFig.to(b ? "readyB" : "ready", 900, FIG.easeInOut); } }, 950);
    }
    function dive(P) {
      keeper.classList.remove("idle");
      const L = 1.35, HIP = 0.92;
      if (P.kSide === 0) {
        if (P.kY > 1.3) { keeperFig.to("jump", 240); lerpTo(KP, { dx: P.kX * 0.6, dy: Math.max(0.15, P.kY - 2.1), rot: P.kX * 6 }, 260); }
        else { keeperFig.to("low", 200); lerpTo(KP, { dx: P.kX * 0.5, dy: -0.12, rot: 0 }, 220); }
        return wait(300);
      }
      const rot = P.kY > 1.2 ? 58 : 80, r = rot * Math.PI / 180;
      keeperFig.to("stretch", 250);
      return lerpTo(KP, { dx: P.kX - P.kSide * L * Math.sin(r), dy: P.kY - HIP - L * Math.cos(r), rot: P.kSide * rot }, 360, eOut);
    }
    async function keeperLand(P) {
      if (P.kSide === 0) { if (P.kY > 1.3) { await lerpTo(KP, { dy: 0, rot: 0 }, 320, eIn); keeperFig.to("crouch", 200); } return; }
      await lerpTo(KP, { dy: 0.28 - 0.92, rot: P.kSide * 88 }, 420, eIn);
      shake = Math.max(shake, 3);
      const [x, y] = proj(P.kX * 0.7, 0, Z_GOAL);
      burst(x, y, 10, "grass");
    }

    /* ---------- un tir ---------- */
    const bez = (a, b, c, t) => { const u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; };
    function plan(z) {
      const col = z % 3, row = z < 3 ? 0 : 1;
      let Xt = [-2.6, 0, 2.6][col] + (Math.random() - 0.5) * 0.7, Yt = row ? 0.38 + Math.random() * 0.3 : 1.72 + Math.random() * 0.4;
      const r = Math.random(), kCol = r < 0.38 ? 0 : r < 0.62 ? 1 : 2, kRow = Math.random() < 0.5 ? 0 : 1;
      let outcome = kCol === col && (kRow === row || Math.random() < 0.5) ? "save" : "goal";
      if (outcome === "goal" && row === 0 && col !== 1 && Math.random() < 0.13) { outcome = "post"; Xt = Math.sign(Xt) * (GW / 2 - 0.08); Yt = 1.5 + Math.random() * 0.7; }
      const kX = outcome === "save" ? Xt : (kCol - 1) * 2.4, kY = outcome === "save" ? Yt : kRow ? 0.5 : 1.85;
      const sgn = Xt === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(Xt);
      return {
        col, row, Xt, Yt, outcome, kX, kY, kSide: outcome === "save" ? (col - 1) : kCol - 1,
        curl: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.9), dur: 600 + Math.random() * 60, react: 70,
        defl: outcome === "save" ? { vx: sgn * (3 + Math.random() * 3), vy: 2.5 + Math.random() * 3, vz: -5 - Math.random() * 3 }
                                 : { vx: sgn * (1.5 + Math.random() * 2), vy: 1 + Math.random() * 2, vz: -7 },
      };
    }
    async function flight(P, replay) {
      const S = { X: 0, Y: BALL_D / 2, Z: Z_SPOT };
      const E = { X: P.Xt, Y: P.Yt, Z: P.outcome === "save" ? Z_GOAL - 0.4 : P.outcome === "post" ? Z_GOAL - 0.05 : Z_GOAL };
      const C = { X: P.Xt * 0.5 - P.curl, Y: Math.max(P.Yt, 0.25) * 0.8 + 0.42, Z: (Z_SPOT + Z_GOAL) / 2 };
      B.phys = null; B.trail = true; B.spin = P.curl * 1500;
      wait(P.react).then(() => dive(P));
      let slowArmed = !replay && P.decisive && !RM;
      const ease = t => 0.7 * t + 0.3 * (1 - (1 - t) * (1 - t));
      await tween(P.dur, t => {
        const tt = ease(t);
        B.X = bez(S.X, C.X, E.X, tt); B.Y = bez(S.Y, C.Y, E.Y, tt); B.Z = bez(S.Z, C.Z, E.Z, tt);
        if (slowArmed && t > 0.36) { slowArmed = false; slowmo(true); const [gx, gy] = proj(P.Xt * 0.45, P.Yt * 0.6 + 0.5, Z_GOAL); focus(gx, gy, 1.34, 2.2); }
      });
      const k = 0.7 * 2 * 1000 / P.dur;                                // vitesse à l'arrivée (m/s)
      const vel = { x: (E.X - C.X) * k, y: (E.Y - C.Y) * k, z: (E.Z - C.Z) * k };
      const [ix, iy] = proj(B.X, B.Y, B.Z);
      if (P.outcome === "goal") {
        await tween(80, t => { B.Z = Z_GOAL + (Z_BACK - 0.15 - Z_GOAL) * t; B.X = P.Xt + vel.x * 0.02 * t; });
        netImpulse(B.X, B.Y, 7.5);
        B.trail = false;
        Object.assign(B, { vx: vel.x * 0.05, vy: Math.min(0, vel.y * 0.1), vz: 2, phys: "net" }); B.spin *= 0.4;
        const [nx, ny] = proj(B.X, B.Y, Z_BACK);
        burst(nx, ny, 26, "gold"); doFlash(nx, ny); shake = 16; crowdE = 1;
        if (!replay) { SFX.cheer(); buzz(60); }
      } else if (P.outcome === "save") {
        B.trail = false;
        Object.assign(B, { vx: P.defl.vx, vy: P.defl.vy, vz: P.defl.vz, phys: "free" }); B.spin = -B.spin * 0.6;
        burst(ix, iy, 16, "spark"); shake = 7; crowdE = 0.35;
        SFX.kick(0.7); if (!replay) SFX.ooh();
      } else {
        B.trail = false;
        Object.assign(B, { vx: P.defl.vx, vy: P.defl.vy, vz: P.defl.vz, phys: "free" }); B.spin = -B.spin;
        goalEl.classList.remove("post-hit"); void goalEl.offsetWidth; goalEl.classList.add("post-hit");
        burst(ix, iy, 18, "spark"); shake = 9; crowdE = 0.3;
        SFX.kick(2.4); SFX.pop(1700); if (!replay) setTimeout(() => SFX.ooh(), 150);
      }
      keeperLand(P);
    }
    function slowmo(on) {
      if (RM) return;
      scene.classList.toggle("slowmo", on);
      speedTarget = on ? 0.22 : 1;
    }

    async function shoot(z) {
      busy = true; wake();
      scene.classList.remove("aiming"); hint.classList.add("off");
      $$("button", zonesEl).forEach(b => (b.disabled = true));
      const P = plan(z);
      P.decisive = shots === TOTAL - 1;
      dots[shots].classList.add("now");
      // 1) course d'élan
      SFX.whistle();
      focus(proj(-0.3, 0, Z_SPOT)[0], V.H * 0.62, 1.07, 1.6);
      await wait(380);
      let running = true;
      (async () => { let i = 0; while (running) await kickerFig.to(i++ % 2 ? "run2" : "run1", 150, FIG.easeInOut); })();
      const kFrom = { X: KS.X, Z: KS.Z };
      await tween(720, e => {
        KS.X = kFrom.X + (-0.24 - kFrom.X) * e; KS.Z = kFrom.Z + (9.45 - kFrom.Z) * e;
        KS.lift = Math.abs(Math.sin(e * Math.PI * 4.5)) * 0.05;
      }, t => t * (0.6 + 0.4 * t));
      running = false; KS.lift = 0;
      keeperFig.to("set", 180, FIG.easeInOut);                        // appel du gardien
      await kickerFig.to("plant", 140, FIG.easeInOut);
      await kickerFig.to("kick", 70, lin);
      // 2) frappe
      SFX.kick(); buzz(20);
      const [bx, by] = proj(0, 0, Z_SPOT);
      burst(bx, by, 14, "grass"); shake = 5;
      kickerFig.to("follow", 280);
      lerpTo(KS, { X: -0.42, Z: 9.3 }, 420, eOut);                    // il se laisse emporter par sa frappe
      focus(proj(P.Xt * 0.5, 0, Z_GOAL)[0], proj(0, GH * 0.4, Z_GOAL)[1], 1.16, 2.4);
      await flight(P, false);
      // 3) verdict
      shots++; results.push(P.outcome);
      const dot = dots[shots - 1]; dot.classList.remove("now");
      $("#pkShots").textContent = `${shots}/${TOTAL}`;
      if (P.outcome === "goal") {
        goals++; dot.classList.add("ok");
        const g = $("#pkGoals"); g.textContent = goals; g.classList.remove("bump"); void g.offsetWidth; g.classList.add("bump");
        scene.classList.add("roar");
        showBanner(P.decisive && goals >= 3 ? "QUALIFIÉ !" : "BUUUT !", `Arthur · tir n°${shots} · ${goals} but${goals > 1 ? "s" : ""}`);
        confetti(P.decisive ? 160 : 70, ["#e30613", "#ffffff", "#1d3584", "#f5c542"]);
        wait(380).then(async () => { await kickerFig.to("celebrate", 260, eOut); for (let i = 0; i < 3; i++) { await lerpTo(KS, { lift: 0.32 }, 190, eOut); kickerFig.to(i % 2 ? "celebrate" : "celebrate2", 180); await lerpTo(KS, { lift: 0 }, 170, eIn); } });
      } else {
        dot.classList.add("ko");
        if (P.outcome === "save") showBanner("ARRÊT !", "Le gardien sort le grand jeu", "alt");
        else showBanner("POTEAU !", "Ça sonne… si près du but", "post");
        wait(300).then(() => kickerFig.to("despair", 420, eInOut));
        if (P.outcome === "save") wait(900).then(() => { if (KP.rot === 0) keeperFig.to("celebrate", 300); });
      }
      if (P.decisive) { await wait(400); slowmo(false); }
      await wait(1700);
      scene.classList.remove("roar");
      // 4) replay du dernier tir
      if (P.decisive && !RM) await replay(P);
      if (shots >= TOTAL) { await resetShot(true); busy = false; pkEnd(); return; }
      await resetShot();
      busy = false;
      scene.classList.add("aiming");
      $$("button", zonesEl).forEach(b => (b.disabled = false));
    }

    async function replay(P) {
      // fondu, puis on rejoue l'action au ralenti, caméra qui suit le ballon
      await lerpTo(B, { op: 0 }, 200);
      scene.classList.add("slowmo", "replay");
      netReset(); trail = []; parts = [];
      Object.assign(B, { X: 0, Y: BALL_D / 2, Z: Z_SPOT, phys: null, trail: false, spin: 0, op: 1 });
      Object.assign(KP, { dx: 0, dy: 0, rot: 0 }); keeper.classList.remove("idle"); keeperFig.set("set");
      Object.assign(KS, { X: -0.24, Z: 9.45, lift: 0, op: 1 }); kickerFig.set("plant");
      speedTarget = FIG.speed = 0.32;
      const [bx, by] = proj(0, 0.4, Z_SPOT);
      Object.assign(camT, { px: bx, py: by, s: 1.55, rate: 30 }); camera(1);
      camT.rate = 3.2;
      await wait(220);
      await kickerFig.to("kick", 70, lin);
      SFX.kick();
      kickerFig.to("follow", 280);
      camFollow = true;
      await flight(P, true);
      await wait(800);
      camFollow = false; speedTarget = 1;
      await wait(500);
      scene.classList.remove("slowmo", "replay");
    }

    async function resetShot(final) {
      camHome(2.2);
      await Promise.all([lerpTo(KS, { op: 0 }, 260), lerpTo(B, { op: 0 }, 260)]);
      Object.assign(B, { X: 0, Y: BALL_D / 2, Z: Z_SPOT, vx: 0, vy: 0, vz: 0, phys: null, trail: false, spin: 0 });
      Object.assign(KS, { X: kIdleX(), Z: 8.3, lift: 0 });
      kickerFig.set("stand");
      keeperFig.to("ready", 420);
      lerpTo(KP, { dx: 0, dy: 0, rot: 0 }, 420, eInOut);
      if (final) return;
      await Promise.all([lerpTo(B, { op: 1 }, 300), lerpTo(KS, { op: 1 }, 360)]);
      keeperIdle();
    }

    /* ---------- écran de fin ---------- */
    const VERDICT = [
      ["Le gardien t'a lu…", "Même les légendes ont des jours sans. Allez, on remet ça !"],
      ["Le but de l'honneur", "Un but, c'est déjà une célébration. Retente ta chance !"],
      ["Pas loin !", "Deux réalisations : la qualif se joue à un tir près."],
      ["Qualifié !", "Sang-froid de capitaine : la séance est pour toi."],
      ["Champion !", "Quatre sur cinq, le Parc est debout pour toi !"],
      ["Ballon d'Or !", "5 sur 5, carton plein. Joyeux anniversaire, la légende !"],
    ];
    function pkEnd() {
      const [title, sub] = VERDICT[goals];
      $("#pkResTitle").textContent = title;
      $("#pkResSub").textContent = sub;
      $("#pkResShots").innerHTML = results.map((r, i) => r === "goal"
        ? `<i class="ok" style="--i:${i}" title="But">${FIG.ballSVG()}</i>`
        : `<i class="ko" style="--i:${i}" title="${r === "save" ? "Arrêt" : "Poteau"}">✕</i>`).join("");
      const sc = $("#pkResScore"); sc.textContent = "0";
      scene.classList.add("ended");
      result.hidden = false;
      let n = 0;
      const step = () => { if (n < goals) { n++; sc.textContent = n; SFX.pop(500 + n * 120); setTimeout(step, 220); } };
      setTimeout(step, 450);
      SFX.whistle("final");
      if (goals >= 3) { setTimeout(() => { confetti(goals === 5 ? 320 : 200); SFX.fanfare(); crowdE = 1; wake(); }, 600); }
      setTimeout(() => $("#pkReset").focus({ preventScroll: true }), 700);
    }
    $("#pkReset").addEventListener("click", async () => {
      shots = goals = 0; results = [];
      $("#pkShots").textContent = `0/${TOTAL}`; $("#pkGoals").textContent = "0";
      dots.forEach(d => (d.className = ""));
      result.hidden = true; scene.classList.remove("ended");
      SFX.whistle();
      await Promise.all([lerpTo(B, { op: 1 }, 300), lerpTo(KS, { op: 1 }, 360)]);
      keeperIdle();
      scene.classList.add("aiming"); hint.classList.remove("off");
      $$("button", zonesEl).forEach(b => (b.disabled = false));
    });

    zonesEl.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn || busy || shots >= TOTAL || !ready) return;
      shoot(+btn.dataset.z);
    });

    /* ---------- démarrage ---------- */
    function init() {
      if (!layout()) return;
      if (!ready) { ready = true; keeperIdle(); scene.classList.add("aiming"); }
      if (!busy && shots < TOTAL) KS.X = kIdleX();
      camHome(); Object.assign(cam, { x: 0, y: 0, s: 1 });
      render(); camera(0);
      wake();
    }
    let lastSize = "";
    new ResizeObserver(() => {
      const sz = world.offsetWidth + "x" + world.offsetHeight;
      if (sz === lastSize) return; lastSize = sz;
      init();
    }).observe(world);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }).observe(scene);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ready) { buildCrowd(); wake(); } });
  })();

  /* =================================================================
     DÉFI DES JONGLES
     Touche parfaite au centre = série, niveaux de difficulté (gravité,
     ballon plus petit, vent), effets à chaque touche, écran de fin.
     ================================================================= */
  (() => {
    const RM = reduceMotion;
    const cv = $("#jgCanvas"), ctx = cv.getContext("2d"), stage = $("#jgStage");
    const overlay = $("#jgOverlay"), text = $("#jgText"), startBtn = $("#jgStart"), bigEl = $("#jgBig"),
          kickerEl = $("#jgKicker"), statsEl = $("#jgStats"), barEl = $("#jgBar");
    const scoreEl = $("#jgScore"), bestEl = $("#jgBest"), lvlEl = $("#jgLvl");
    let W = 0, H = 0, dpr = 1, state = "idle", visible = false, raf = 0, last = 0, time = 0;
    let score = 0, best = +(store.get("arthur-jongles") || 0), level = 1, combo = 0, bestCombo = 0, perfects = 0;
    let countT = 0, countStep = -1, overT = 0, shake = 0, bump = 0, flashA = 0, windX = 0;
    const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 30, r0: 30, rot: 0, vr: 0, sq: 0, sqa: 0 };
    let parts = [], pops = [], rings = [], trail = [], swooshes = [], bg = null;
    const svgImg = svg => { const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); return im; };
    const imgPattern = svgImg(FIG.ballSVG({ part: "pattern", size: 200 }));
    const imgShade = svgImg(FIG.ballSVG({ part: "shade", size: 200 }));
    bestEl.textContent = best;
    cv._ball = ball;                                                       // utile pour les tests automatisés
    const ground = () => H * 0.86;
    const grav = () => H * 2.15 * (1 + Math.min(level - 1, 8) * 0.075);
    const font = px => `${Math.round(px)}px "Bebas Neue", Impact, sans-serif`;
    const bumpEl = el => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); };

    function resize() {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
      ball.r0 = Math.max(22, Math.min(40, Math.min(W, H) * 0.068));
      ball.r = ball.r0 * Math.max(0.72, 1 - (level - 1) * 0.04);
      if (state !== "play") { ball.x = W / 2; ball.y = ground() - ball.r; }
      buildBg();
      if (!raf) draw();
    }
    new ResizeObserver(resize).observe(cv);

    /* ---------- décor pré-rendu ---------- */
    function buildBg() {
      bg = document.createElement("canvas"); bg.width = cv.width; bg.height = cv.height;
      const g = bg.getContext("2d"); g.scale(dpr, dpr);
      const hz = H * 0.6;                                                  // bas des tribunes / panneaux
      let gr = g.createLinearGradient(0, 0, 0, hz);
      gr.addColorStop(0, "#01030c"); gr.addColorStop(0.5, "#08133d"); gr.addColorStop(1, "#162a6e");
      g.fillStyle = gr; g.fillRect(0, 0, W, hz);
      // tribunes : supporters en mosaïque
      const top = H * 0.12, s0 = Math.max(3, W * 0.0075);
      for (let y = hz - H * 0.06, row = 0; y > top; row++) {
        const f = (y - top) / (hz - top), s = s0 * (0.55 + 0.6 * f);
        for (let x = (row % 2) * s * 0.5; x < W; x += s * 1.15) {
          const r = Math.random(), band = Math.abs(x - W / 2) / W;
          g.fillStyle = band < 0.06 ? (r < 0.8 ? "#c8061a" : "#f2f4f8") : r < 0.55 ? "#1a2f7a" : r < 0.75 ? "#22398c" : r < 0.88 ? "#c8061a" : r < 0.95 ? "#e9ecf5" : "#e0ac69";
          g.globalAlpha = 0.5 + f * 0.45;
          g.fillRect(x, y, s, s * 0.9);
        }
        y -= s * 1.12;
      }
      g.globalAlpha = 1;
      // toit et projecteurs
      g.fillStyle = "#02040d"; g.fillRect(0, 0, W, top);
      g.fillStyle = "rgba(120,140,200,.35)"; g.fillRect(0, top - 2, W, 2);
      g.save(); g.globalCompositeOperation = "lighter";
      for (const lx of [0.12, 0.88]) {
        const cx = W * lx, cy = top * 0.5;
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.42);
        rg.addColorStop(0, "rgba(235,242,255,.6)"); rg.addColorStop(0.2, "rgba(170,195,255,.18)"); rg.addColorStop(1, "rgba(120,150,255,0)");
        g.fillStyle = rg; g.fillRect(0, 0, W, H);
        // faisceau
        const bm = g.createLinearGradient(cx, cy, W / 2, ground());
        bm.addColorStop(0, "rgba(220,230,255,.14)"); bm.addColorStop(1, "rgba(220,230,255,0)");
        g.fillStyle = bm; g.beginPath(); g.moveTo(cx - 6, cy); g.lineTo(cx + 6, cy); g.lineTo(W / 2 + W * 0.25, ground()); g.lineTo(W / 2 - W * 0.25, ground()); g.fill();
        g.fillStyle = "rgba(255,255,255,.95)";
        const bw = Math.max(26, W * 0.07), bh = top * 0.45;
        for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) g.fillRect(cx - bw / 2 + i * bw / 5 + 1, cy - bh / 2 + j * bh / 2 + 1, bw / 5 - 2, bh / 2 - 2);
      }
      g.restore();
      // pelouse en perspective
      const p0 = hz + H * 0.045;
      gr = g.createLinearGradient(0, p0, 0, H);
      gr.addColorStop(0, "#14532a"); gr.addColorStop(1, "#2ea14f");
      g.fillStyle = gr; g.fillRect(0, p0, W, H - p0);
      const yv = H * 0.3, A = (ground() - yv) * 6;                        // y = yv + A / z
      for (let z = 30, i = 0; z > 2; z -= 1.2, i++) {
        const y0 = Math.max(p0, yv + A / z), y1 = Math.min(H, yv + A / (z - 1.2));
        if (i % 2 && y1 > p0) { g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, y0, W, y1 - y0); }
      }
      // rond central + ligne médiane
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2;
      g.beginPath(); g.ellipse(W / 2, ground() + H * 0.02, Math.min(W * 0.36, H * 0.6), H * 0.075, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(0, ground() + H * 0.02); g.lineTo(W, ground() + H * 0.02); g.stroke();
      g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(W / 2, ground() + H * 0.02, 4, 2, 0, 0, Math.PI * 2); g.fill();
      // halo au sol sous les projecteurs
      g.save(); g.globalCompositeOperation = "lighter"; g.translate(W / 2, ground()); g.scale(1, 0.25);
      const lg = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.5);
      lg.addColorStop(0, "rgba(200,255,200,.16)"); lg.addColorStop(1, "rgba(200,255,200,0)");
      g.fillStyle = lg; g.fillRect(-W, -W * 2, W * 2, W * 4); g.restore();
      // vignette
      const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)");
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }

    /* ---------- partie ---------- */
    function setLevel(l) { level = l; lvlEl.textContent = l; ball.r = ball.r0 * Math.max(0.72, 1 - (l - 1) * 0.04); }
    function start() {
      score = 0; combo = 0; bestCombo = 0; perfects = 0; setLevel(1);
      scoreEl.textContent = 0; windX = 0;
      parts = []; pops = []; rings = []; trail = []; swooshes = [];
      ball.x = W / 2; ball.y = ground() - ball.r; ball.vx = ball.vy = ball.vr = 0;
      state = "count"; countT = 0; countStep = -1;
      overlay.classList.add("hidden"); stage.classList.add("playing");
      SFX.whistle();
      loop();
    }
    function launch() {
      state = "play";
      ball.vy = -Math.sqrt(2 * grav() * H * 0.42); ball.vx = 0; ball.vr = 2;
      ball.sq = 0.25;
      rings.push({ x: ball.x, y: ground(), life: 1, gold: false });
      SFX.kick(0.9);
    }
    function gameOver() {
      state = "over"; overT = 0; combo = 0;
      shake = 12; SFX.ooh(); SFX.kick(0.5);
      stage.classList.remove("playing");
      for (let i = 0; i < 14; i++) parts.push({ x: ball.x, y: ground(), vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 180, life: 1, c: Math.random() < 0.6 ? "#3fae5a" : "#7a5a32", g: 700, s: 3 });
    }
    const MEDALS = [[50, "Ballon d'Or"], [30, "Or"], [18, "Argent"], [10, "Bronze"]];
    function showEnd() {
      const record = score > best;
      if (record) { best = score; store.set("arthur-jongles", best); bestEl.textContent = best; bumpEl(bestEl); }
      const medal = (MEDALS.find(m => score >= m[0]) || [0, "—"])[1];
      kickerEl.textContent = record && score > 0 ? "Nouveau record !" : "Fin du défi";
      bigEl.hidden = false; bigEl.textContent = score;
      text.textContent = score >= 50 ? "Ballon d'Or du jongle !" : score >= 30 ? "Niveau freestyle !" : score >= 18 ? "18 ans, 18 jongles : validé !" : score >= 10 ? "Pas loin des 18 !" : "Encore un peu d'échauffement…";
      statsEl.hidden = false;
      statsEl.innerHTML = `<li><b>${best}</b>Record</li><li><b>${bestCombo}</b>Série parfaite</li><li><b>${level}</b>Niveau</li><li class="medal"><b>${medal}</b>Médaille</li>`;
      const goal = score >= 30 ? 50 : score >= 18 ? 30 : 18;
      barEl.hidden = false; barEl.querySelector("span").textContent = `Objectif ${goal}`;
      barEl.style.setProperty("--p", "0%");
      requestAnimationFrame(() => requestAnimationFrame(() => barEl.style.setProperty("--p", Math.min(100, score / goal * 100).toFixed(0) + "%")));
      startBtn.querySelector("span").textContent = "Rejouer";
      overlay.classList.add("end");
      overlay.classList.remove("hidden");
      if (record && score > 0) { confetti(160); SFX.fanfare(); }
    }

    function kick(px, py) {
      const off = (px - ball.x) / ball.r;                                  // -1 … 1
      const perfect = Math.abs(off) < 0.32;
      const g = grav();
      ball.vy = -Math.sqrt(2 * g * H * (perfect ? 0.5 : 0.4 + Math.random() * 0.1));
      ball.vx = perfect ? ball.vx * 0.25 + (Math.random() - 0.5) * W * 0.04 : -off * W * 0.42 + (Math.random() - 0.5) * W * 0.08;
      ball.vr = ball.vx / ball.r + (perfect ? 0 : -off * 6);
      ball.sq = perfect ? 0.32 : 0.24; ball.sqa = Math.atan2(py - ball.y, px - ball.x);
      score++; scoreEl.textContent = score; bumpEl(scoreEl);
      if (perfect) { combo++; perfects++; bestCombo = Math.max(bestCombo, combo); } else combo = 0;
      bump = 1;
      const hot = combo >= 3;
      SFX.kick(1 + Math.min(score, 30) * 0.02);
      if (perfect) SFX.pop(700 + Math.min(combo, 10) * 90);
      rings.push({ x: ball.x, y: ball.y + ball.r * 0.6, life: 1, gold: perfect });
      swooshes.push({ x: px, y: ball.y + ball.r * 0.7, life: 1, gold: perfect });
      const n = RM ? 4 : perfect ? 18 : 10;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, sp = 120 + Math.random() * 220;
        parts.push({ x: ball.x, y: ball.y + ball.r * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: perfect ? (Math.random() < 0.7 ? "#f5c542" : "#fff") : (Math.random() < 0.5 ? "#ffffff" : "#bfe8ff"), g: 500, s: perfect ? 3 : 2.4, spark: true });
      }
      if (perfect && combo > 1) shake = Math.min(8, 2 + combo);
      const newLvl = 1 + Math.floor(score / 8);
      const milestones = { 10: "10 JONGLES !", 18: "18 JONGLES = 18 ANS !", 25: "25 ! ÇA CHAUFFE", 30: "30 ! FREESTYLE", 50: "50 ! BALLON D'OR", 100: "100 ! LÉGENDE" };
      if (milestones[score]) {
        pops.push({ t: milestones[score], life: 2.2, big: true });
        flashA = 0.5;
        if (score === 18 || score === 50 || score === 100) { confetti(220); SFX.cheer(); } else SFX.cheer(0.5);
      } else if (newLvl > level) {
        pops.push({ t: `NIVEAU ${newLvl}`, life: 2.2, big: true, sub: newLvl >= 3 ? "Attention au vent !" : "Ça accélère !" });
        SFX.fanfare(); flashA = 0.35;
      }
      if (newLvl > level) { setLevel(newLvl); bumpEl(lvlEl); }
      pops.push({ t: perfect ? (combo > 1 ? `PARFAIT ×${combo}` : "PARFAIT !") : "+1", life: perfect ? 0.9 : 0.6, x: ball.x, y: ball.y - ball.r * 1.4, gold: perfect, hot });
    }
    cv.addEventListener("pointerdown", e => {
      if (state !== "play") return;
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const reach = ball.r * (e.pointerType === "touch" ? 2.3 : 1.9);
      if (Math.hypot(px - ball.x, py - ball.y) < reach && ball.vy > -H * 0.7) kick(px, py);
      else rings.push({ x: px, y: py, life: 0.6, miss: true });
    });
    startBtn.addEventListener("click", start);

    /* ---------- mise à jour ---------- */
    function update(dt) {
      time += dt;
      if (state === "count") {
        countT += dt;
        const step = Math.floor(countT / 0.42);
        if (step !== countStep && step <= 3) { countStep = step; if (step < 3) SFX.pop(520 + step * 80); }
        ball.y = ground() - ball.r - Math.abs(Math.sin(countT * 7)) * H * 0.03;
        if (countT >= 1.26) launch();
      } else if (state === "play") {
        const g = grav();
        windX = level >= 3 ? Math.sin(time * 0.55) * W * 0.11 * Math.min(1, (level - 2) * 0.5) : 0;
        ball.vy += g * dt; ball.vx += windX * dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += ball.vr * dt;
        ball.vx *= Math.pow(0.6, dt);
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.7; ball.vr *= -0.8; SFX.pop(260); }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.7; ball.vr *= -0.8; SFX.pop(260); }
        if (ball.y > ground() - ball.r) { ball.y = ground() - ball.r; gameOver(); }
      } else if (state === "over") {
        overT += dt;
        ball.vy += grav() * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += ball.vr * dt;
        ball.vx *= Math.pow(0.3, dt); ball.vr *= Math.pow(0.3, dt);
        ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x));
        if (ball.y > ground() - ball.r) { ball.y = ground() - ball.r; ball.vy = -Math.abs(ball.vy) * 0.42; if (Math.abs(ball.vy) < 40) ball.vy = 0; else ball.sq = 0.18; }
        if (overT > 0.95 && overlay.classList.contains("hidden")) { state = "idle"; showEnd(); }
      } else {
        ball.y = ground() - ball.r - Math.abs(Math.sin(time * 3.2)) * H * 0.05;
        ball.x += (W / 2 - ball.x) * Math.min(1, dt * 2);
        ball.rot += dt * 1.5;
      }
      ball.sq *= Math.pow(0.0015, dt);
      if (state === "play") { trail.push([ball.x, ball.y]); if (trail.length > (combo >= 3 ? 12 : 7)) trail.shift(); } else if (trail.length) trail.shift();
      shake *= Math.pow(0.002, dt); bump *= Math.pow(0.02, dt); flashA *= Math.pow(0.02, dt);
      rings.forEach(r => (r.life -= dt * 2.4)); rings = rings.filter(r => r.life > 0);
      swooshes.forEach(s => (s.life -= dt * 3.2)); swooshes = swooshes.filter(s => s.life > 0);
      parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt * 1.7; });
      parts = parts.filter(p => p.life > 0);
      pops.forEach(p => (p.life -= dt)); pops = pops.filter(p => p.life > 0);
    }

    /* ---------- rendu ---------- */
    function draw() {
      if (!bg) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sx = !RM && shake > 0.3 ? (Math.random() - 0.5) * shake : 0, sy = !RM && shake > 0.3 ? (Math.random() - 0.5) * shake : 0;
      ctx.drawImage(bg, sx * dpr, sy * dpr);
      if (sx || sy) { ctx.fillStyle = "#050a22"; }
      ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
      const hz = H * 0.6, gy = ground();
      // les tribunes s'illuminent à chaque touche / série
      const glow = Math.min(1, bump * 0.6 + (combo >= 3 ? 0.25 + Math.sin(time * 8) * 0.08 : 0));
      if (glow > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = combo >= 3 ? `rgba(255,190,80,${glow * 0.16})` : `rgba(160,190,255,${glow * 0.12})`;
        ctx.fillRect(0, H * 0.12, W, hz - H * 0.12); ctx.restore();
      }
      // panneaux LED défilants
      const bh = H * 0.045;
      ctx.fillStyle = "#02040f"; ctx.fillRect(0, hz, W, bh);
      ctx.save(); ctx.beginPath(); ctx.rect(0, hz, W, bh); ctx.clip();
      const msg = "  JOYEUX ANNIVERSAIRE ARTHUR  ·  18 ANS  ·  20.12.2008  ·  ICI C'EST ARTHUR  · ";
      ctx.font = font(bh * 0.72); ctx.textBaseline = "middle"; ctx.textAlign = "left";
      const mw = ctx.measureText(msg).width || 1, off = -((time * 50) % mw);
      for (let x = off, i = 0; x < W; x += mw, i++) {
        ctx.fillStyle = i % 2 ? "#1d3584" : "#c8061a"; ctx.fillRect(x, hz, mw, bh);
        ctx.fillStyle = "#fff"; ctx.fillText(msg, x, hz + bh * 0.54);
      }
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(0, hz, W, 1);
      // score fantôme géant
      ctx.save();
      ctx.globalAlpha = 0.07 + bump * 0.08; ctx.fillStyle = "#fff";
      ctx.font = font(H * 0.42 * (1 + bump * 0.08)); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(score, W / 2, H * 0.36); ctx.restore();
      // ombre
      const hgt = Math.max(0, gy - ball.y - ball.r), sc = Math.max(0.25, 1 - hgt / (H * 0.9));
      ctx.fillStyle = `rgba(0,0,0,${0.4 * sc})`; ctx.beginPath(); ctx.ellipse(ball.x, gy + 2, ball.r * 1.1 * sc, ball.r * 0.26 * sc, 0, 0, Math.PI * 2); ctx.fill();
      // éclair d'impact sous le ballon (la frappe)
      if (swooshes.length) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const s of swooshes) {
          const R = ball.r * (1.2 + (1 - s.life) * 0.8);
          const rg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R);
          rg.addColorStop(0, s.gold ? `rgba(255,220,120,${s.life * 0.9})` : `rgba(255,255,255,${s.life * 0.7})`);
          rg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = rg; ctx.fillRect(s.x - R, s.y - R, R * 2, R * 2);
          ctx.strokeStyle = s.gold ? `rgba(245,197,66,${s.life})` : `rgba(255,255,255,${s.life * 0.8})`; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath();
          for (let i = 0; i < 6; i++) { const a = Math.PI * (0.15 + i * 0.14), r1 = ball.r * 0.9, r2 = r1 + ball.r * (0.5 + (1 - s.life) * 0.6); ctx.moveTo(s.x + Math.cos(a) * r1 * 0.2, s.y + Math.sin(a) * r1 * 0.2 + 0); ctx.moveTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1 * 0.6); ctx.lineTo(s.x + Math.cos(a) * r2, s.y + Math.sin(a) * r2 * 0.6); }
          ctx.stroke();
        }
        ctx.restore();
      }
      // anneaux d'impact
      for (const r of rings) {
        ctx.globalAlpha = Math.max(0, r.life) * (r.miss ? 0.4 : 0.85);
        ctx.strokeStyle = r.gold ? "#f5c542" : "#fff"; ctx.lineWidth = r.gold ? 3 : 2;
        ctx.beginPath(); ctx.arc(r.x, r.y, (r.miss ? 18 : ball.r * 1.5) * (1.6 - r.life * 0.6), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // traînée (blanche, dorée, puis en feu)
      if (trail.length > 1) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < trail.length; i++) {
          const a = i / trail.length, [tx, ty] = trail[i];
          ctx.fillStyle = combo >= 6 ? `rgba(255,${(90 + a * 120) | 0},40,${a * 0.35})` : combo >= 3 ? `rgba(245,197,66,${a * 0.3})` : `rgba(255,255,255,${a * 0.14})`;
          ctx.beginPath(); ctx.arc(tx, ty, ball.r * (0.4 + a * 0.6), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      // particules
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c;
        if (p.spark) { ctx.strokeStyle = p.c; ctx.lineWidth = p.s; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke(); }
        else ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      // ballon (motif qui tourne + ombrage fixe + écrasement orienté)
      ctx.save(); ctx.translate(ball.x, ball.y);
      if (combo >= 3) { ctx.shadowColor = combo >= 6 ? "#ff6a2a" : "#f5c542"; ctx.shadowBlur = 18; }
      ctx.rotate(ball.sqa); ctx.scale(1 - ball.sq, 1 + ball.sq * 0.6); ctx.rotate(-ball.sqa);
      ctx.save(); ctx.rotate(ball.rot);
      if (imgPattern.complete) ctx.drawImage(imgPattern, -ball.r, -ball.r, ball.r * 2, ball.r * 2);
      else { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, ball.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.shadowBlur = 0;
      if (imgShade.complete) ctx.drawImage(imgShade, -ball.r, -ball.r, ball.r * 2, ball.r * 2);
      ctx.restore();
      // ballon hors champ (au-dessus)
      if (ball.y + ball.r < 0) {
        ctx.fillStyle = "#ffdf5a"; ctx.beginPath(); ctx.moveTo(ball.x, 6); ctx.lineTo(ball.x - 9, 20); ctx.lineTo(ball.x + 9, 20); ctx.fill();
      }
      // vent
      if (state === "play" && Math.abs(windX) > W * 0.01) {
        const dir = Math.sign(windX), len = Math.min(60, Math.abs(windX) / W * 400);
        ctx.save(); ctx.translate(W - 70, 26); ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#fff"; ctx.font = font(14); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("VENT", 0, -2);
        ctx.strokeStyle = "#bfe8ff"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-dir * len / 2, 14); ctx.lineTo(dir * len / 2, 14); ctx.lineTo(dir * len / 2 - dir * 7, 9); ctx.moveTo(dir * len / 2, 14); ctx.lineTo(dir * len / 2 - dir * 7, 19); ctx.stroke();
        ctx.restore();
      }
      // série parfaite
      if (state === "play" && combo >= 2) {
        const hc = combo >= 6 ? "#ff7a3a" : "#f5c542";
        ctx.save(); ctx.translate(14, 14); ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.font = font(20);
        const lw = ctx.measureText(`SÉRIE PARFAITE ×${combo}`).width + 22;
        ctx.fillStyle = "rgba(5,10,34,.78)"; ctx.fillRect(0, 0, lw, 30);
        ctx.fillStyle = hc; ctx.fillRect(0, 0, 4, 30);
        ctx.fillStyle = "#fff"; ctx.fillText("SÉRIE PARFAITE", 12, 16);
        ctx.fillStyle = hc; ctx.fillText(`×${combo}`, 12 + ctx.measureText("SÉRIE PARFAITE ").width, 16);
        ctx.restore();
      }
      // textes
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of pops) {
        if (p.big) {
          const k = Math.min(1, (2.2 - p.life) * 6), sc2 = 0.6 + 0.4 * (k < 1 ? 1 + Math.sin(k * Math.PI) * 0.4 : 1);
          ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 3); ctx.translate(W / 2, H * 0.24); ctx.scale(sc2, sc2);
          ctx.font = font(Math.min(W * 0.1, H * 0.13)); ctx.lineWidth = 8; ctx.strokeStyle = "#0b1640"; ctx.lineJoin = "round";
          ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
          ctx.strokeText(p.t, 0, 0); ctx.shadowColor = "transparent";
          ctx.fillStyle = "#fff"; ctx.fillText(p.t, 0, 0);
          if (p.sub) { ctx.font = font(Math.min(W * 0.045, H * 0.06)); ctx.fillStyle = "#ffdf5a"; ctx.fillText(p.sub, 0, H * 0.085); }
          ctx.restore();
        } else {
          ctx.globalAlpha = Math.min(1, p.life * 2.2);
          ctx.font = font(H * (p.gold ? 0.065 : 0.055));
          ctx.fillStyle = p.hot ? "#ff9a4a" : p.gold ? "#f5c542" : "#fff";
          ctx.fillText(p.t, p.x, p.y - (1 - p.life) * 60);
        }
      }
      ctx.globalAlpha = 1;
      // compte à rebours
      if (state === "count") {
        const step = Math.min(3, Math.floor(countT / 0.42)), k = (countT % 0.42) / 0.42;
        const label = step < 3 ? String(3 - step) : "GO !";
        ctx.save(); ctx.translate(W / 2, H * 0.4); const s3 = 1.4 - 0.4 * Math.min(1, k * 3); ctx.scale(s3, s3);
        ctx.globalAlpha = 1 - Math.max(0, k - 0.75) * 3;
        ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
        ctx.font = font(H * 0.24); ctx.lineWidth = 8; ctx.strokeStyle = "#0b1640"; ctx.lineJoin = "round"; ctx.strokeText(label, 0, 0);
        ctx.fillStyle = step < 3 ? "#fff" : "#f5c542"; ctx.fillText(label, 0, 0);
        ctx.restore();
      }
      if (flashA > 0.02 && !RM) { ctx.fillStyle = `rgba(255,255,255,${flashA * 0.4})`; ctx.fillRect(0, 0, W, H); }
    }
    function loop() {
      if (raf) return;
      last = performance.now();
      const frame = now => {
        const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
        update(dt); draw();
        raf = state !== "idle" || visible ? requestAnimationFrame(frame) : 0;
      };
      raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }).observe(cv);
  })();

  /* =================================================================
     PETITS SONS MAISON (souffle, grattage, carillon, grincement)
     — n'utilisés que si le son est activé
     ================================================================= */
  const ZFX = (() => {
    let ac = null, noise = null, sc = null;
    function ctx() {
      if (!SFX.enabled) return null;
      try {
        if (!ac) {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          const b = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          noise = b;
        }
        if (ac.state === "suspended") ac.resume();
        return ac;
      } catch { return null; }
    }
    function breath(dur = 0.9) {
      const c = ctx(); if (!c) return;
      const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = noise; s.loop = true; f.type = "bandpass"; f.Q.value = 0.7;
      f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur + 0.05);
    }
    function scratch(level) {
      const c = ctx(); if (!c) return;
      if (!sc) {
        const s = c.createBufferSource(), hp = c.createBiquadFilter(), pk = c.createBiquadFilter(), g = c.createGain();
        s.buffer = noise; s.loop = true; hp.type = "highpass"; hp.frequency.value = 2200;
        pk.type = "peaking"; pk.frequency.value = 5200; pk.gain.value = 9; g.gain.value = 0;
        s.connect(hp); hp.connect(pk); pk.connect(g); g.connect(c.destination); s.start();
        sc = { s, g };
      }
      sc.g.gain.setTargetAtTime(Math.min(0.2, level), c.currentTime, 0.03);
    }
    function scratchStop() {
      if (!sc || !ac) return;
      const s = sc.s; sc.g.gain.setTargetAtTime(0, ac.currentTime, 0.05); sc = null;
      setTimeout(() => { try { s.stop(); } catch {} }, 400);
    }
    function chime() {
      const c = ctx(); if (!c) return;
      [1568, 2093, 2637, 3136, 4186].forEach((f, i) => {
        const t = c.currentTime + i * 0.07, o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1.2);
      });
    }
    function creak() {
      const c = ctx(); if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), lp = c.createBiquadFilter(), g = c.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(115, t + 0.9);
      lfo.frequency.value = 26; lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain);
      lp.type = "lowpass"; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      o.connect(lp); lp.connect(g); g.connect(c.destination);
      o.start(t); lfo.start(t); o.stop(t + 1.05); lfo.stop(t + 1.05);
    }
    return { breath, scratch, scratchStop, chime, creak };
  })();
  const zrnd = (a, b) => a + Math.random() * (b - a);

  /* =================================================================
     MESSAGES : le mur des supporters
     ================================================================= */
  (() => {
    const wall = $("#wall");
    const NOTE_COLORS = ["#fff7a8", "#ffd1dc", "#c9f0ff", "#d7ffcf", "#ffe0b8"];
    const SKIP = /^(la|le|les|l'|du|de|des|d'|et|à|au|aux)$/i;
    const initials = a => (String(a).split(/\s+/).filter(w => w && !SKIP.test(w)).map(w => w[0]).join("").slice(0, 2) || String(a)[0] || "♥").toUpperCase();
    wall.innerHTML = D.messages.map((m, i) => `
      <blockquote class="note" tabindex="0" style="--i:${i};--r:${zrnd(-3, 3).toFixed(1)}deg;--c:${NOTE_COLORS[i % NOTE_COLORS.length]};--fx:${zrnd(-140, 140).toFixed(0)}px;--fr:${zrnd(-24, 24).toFixed(0)}deg;--tr:${zrnd(-6, 6).toFixed(1)}deg">
        <span class="note__tape" aria-hidden="true"></span>
        <p>${m.texte}</p><cite><span class="note__who" aria-hidden="true">${initials(m.auteur)}</span>— ${m.auteur}</cite>
      </blockquote>`).join("");
    const HEARTS = ["#e30613", "#f5c542", "#1d3584", "#ff5a8a"];
    function love(note) {
      note.classList.remove("loved"); void note.offsetWidth; note.classList.add("loved");
      SFX.pop(680 + Math.random() * 320);
      if (reduceMotion) return;
      for (let k = 0; k < 9; k++) {
        const h = document.createElement("span");
        h.className = "note__heart"; h.textContent = "♥"; h.setAttribute("aria-hidden", "true");
        h.style.cssText = `--hx0:${zrnd(20, 80).toFixed(0)}%;--hx:${zrnd(-90, 90).toFixed(0)}px;--hr:${zrnd(-40, 40).toFixed(0)}deg;--hs:${zrnd(1, 2.1).toFixed(2)}rem;--hc:${HEARTS[k % 4]};animation-delay:${k * 45}ms`;
        note.appendChild(h); setTimeout(() => h.remove(), 1500 + k * 45);
      }
    }
    wall.addEventListener("click", e => { const n = e.target.closest(".note"); if (n) love(n); });
    wall.addEventListener("keydown", e => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("note")) { e.preventDefault(); love(e.target); }
    });
    // flashs de téléphones dans la tribune
    const fl = $("#standFlashes");
    if (fl && !reduceMotion) fl.innerHTML = Array.from({ length: innerWidth < 640 ? 14 : 30 },
      () => `<i style="left:${zrnd(2, 98).toFixed(1)}%;top:${zrnd(4, 96).toFixed(1)}%;--d:${zrnd(3, 8).toFixed(1)}s;--w:${(-zrnd(0, 8)).toFixed(1)}s"></i>`).join("");
    // la tribune applaudit quand les messages arrivent
    new IntersectionObserver(([en], io) => { if (en.isIntersecting) { io.disconnect(); setTimeout(() => SFX.cheer(0.35), 500); } }, { threshold: 0.3 }).observe(wall);
  })();

  /* =================================================================
     BOUGIES : gâteau, flammes, fumée et le grand moment du vœu
     ================================================================= */
  (() => {
    const candlesEl = $("#candles");
    const cakeSec = $("#bougies"), cakeEl = $("#cake"), smokeEl = $("#cakeSmoke"), wishEl = $("#cakeWish"), relightBtn = $("#relight");
    // --- le gâteau, dessiné en SVG (deux étages, coulis de framboise, rosaces de crème, perles dorées)
    (() => {
      const CX = 220, el = (cy, rx, ry, t) => [CX + rx * Math.cos(t), cy + ry * Math.sin(t)];
      const f1 = n => n.toFixed(1);
      // coulis : couvre le dessus du 2e étage puis coule sur le devant
      let d = `M${CX - 124} 150 A124 28 0 0 1 ${CX + 124} 150 L${CX + 124} 158`;
      const N = 46;
      let drips = [5, 9, 14, 17, 21, 26, 30, 33, 38, 42];
      for (let i = 1; i <= N; i++) {
        const t = (i / N) * Math.PI;
        const [x, y] = el(158, 124, 28, t);
        if (drips.includes(i)) {
          const L = 10 + ((i * 37) % 30) * (Math.sin(t) * 0.8 + 0.4), w = 7 + ((i * 13) % 6);
          d += ` L${f1(x + w / 2)} ${f1(y)} L${f1(x + w / 2)} ${f1(y + L)} A${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${f1(x - w / 2)} ${f1(y + L)} L${f1(x - w / 2)} ${f1(y)}`;
        } else d += ` L${f1(x)} ${f1(y)}`;
      }
      d += " Z";
      const pearls = Array.from({ length: 44 }, (_, i) => { const [x, y] = el(360, 168, 36, (i / 43) * Math.PI); return `<circle cx="${f1(x)}" cy="${f1(y - 2)}" r="4.4" fill="url(#ckPearl)"/>`; }).join("");
      const ros = Array.from({ length: 11 }, (_, i) => { const t = 0.1 * Math.PI + (i / 10) * 0.8 * Math.PI, [x, y] = el(262, 146, 31, t); return [x, y]; });
      const rosettes = ros.map(([x, y], i) => `<use href="#ckRos" x="${f1(x)}" y="${f1(y)}"/>${i % 2 ? `<use href="#ckBerry" x="${f1(x)}" y="${f1(y - 9)}"/>` : ""}`).join("");
      const topBerries = [[-96, -6], [-70, -18], [92, -10], [60, -20], [-30, -24], [20, -25]].map(([dx, dy]) => `<use href="#ckBerry" x="${CX + dx}" y="${150 + dy}"/>`).join("");
      const leaves = [[-80, 4], [70, 6], [-20, 14], [100, -4], [-108, 0], [36, -6]].map(([dx, dy], i) => `<path d="M${CX + dx} ${150 + dy} l4 -3 l3 4 l-5 2z" fill="#f7d36a" opacity=".9" transform="rotate(${i * 47} ${CX + dx} ${150 + dy})"/>`).join("");
      const body = `M${CX - 168} 262 L${CX - 168} 360 A168 36 0 0 0 ${CX + 168} 360 L${CX + 168} 262 Z`;
      const top = `M${CX - 124} 150 L${CX - 124} 262 A124 28 0 0 0 ${CX + 124} 262 L${CX + 124} 150 Z`;
      $("#cakeBody").innerHTML = `
  <svg viewBox="0 0 440 400" aria-hidden="true">
    <defs>
      <linearGradient id="ckNavy" x1="0" x2="1"><stop offset="0" stop-color="#050a24"/><stop offset=".16" stop-color="#16286e"/><stop offset=".32" stop-color="#2d48a8"/><stop offset=".5" stop-color="#1a2d74"/><stop offset=".84" stop-color="#0b1442"/><stop offset="1" stop-color="#040820"/></linearGradient>
      <linearGradient id="ckCream" x1="0" x2="1"><stop offset="0" stop-color="#b9a48f"/><stop offset=".18" stop-color="#efe4d8"/><stop offset=".34" stop-color="#fffaf3"/><stop offset=".56" stop-color="#f1e5d8"/><stop offset=".86" stop-color="#cbb7a2"/><stop offset="1" stop-color="#9c8670"/></linearGradient>
      <radialGradient id="ckCoulis" cx=".42" cy=".3" r=".9"><stop offset="0" stop-color="#ff4a58"/><stop offset=".35" stop-color="#d40a20"/><stop offset=".8" stop-color="#8c0414"/><stop offset="1" stop-color="#5e020c"/></radialGradient>
      <linearGradient id="ckGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".45" stop-color="#f0c64a"/><stop offset="1" stop-color="#a87b14"/></linearGradient>
      <radialGradient id="ckPearl" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff6d0"/><stop offset=".5" stop-color="#e2b23a"/><stop offset="1" stop-color="#8a6010"/></radialGradient>
      <linearGradient id="ckBoard" x1="0" x2="1"><stop offset="0" stop-color="#8a6512"/><stop offset=".3" stop-color="#f7dc7a"/><stop offset=".55" stop-color="#c9a227"/><stop offset=".8" stop-color="#fff1b0"/><stop offset="1" stop-color="#8a6512"/></linearGradient>
      <radialGradient id="ckWarm" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#ffb35a" stop-opacity=".42"/><stop offset=".55" stop-color="#ff9a3a" stop-opacity=".16"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
      <clipPath id="ckClip"><path d="${body}"/><ellipse cx="${CX}" cy="262" rx="168" ry="36"/><path d="${top}"/><ellipse cx="${CX}" cy="150" rx="124" ry="28"/><path d="${d}"/></clipPath>
      <symbol id="ckRos" overflow="visible"><ellipse cx="0" cy="3" rx="13" ry="6" fill="#000" opacity=".22"/><circle r="11.5" fill="#fbf4ea"/><path d="M-8 2 C-9 -8 8 -9 8 -1 C8 6 -4 6 -4 0 C-4 -4 3 -4 3 0" fill="none" stroke="#dccbb6" stroke-width="2.2" stroke-linecap="round"/><circle cx="-3.5" cy="-5" r="3" fill="#fff" opacity=".9"/></symbol>
      <symbol id="ckBerry" overflow="visible"><circle r="6" fill="#b1081c"/><circle cx="-2.2" cy="-1.5" r="2" fill="#e8293c"/><circle cx="2.2" cy="-1.2" r="2" fill="#d81a2e"/><circle cx="0" cy="2" r="2" fill="#c4122a"/><circle cx="-2" cy="-2.6" r=".9" fill="#fff" opacity=".8"/></symbol>
    </defs>
    <ellipse cx="${CX}" cy="380" rx="206" ry="27" fill="#5a420c"/>
    <ellipse cx="${CX}" cy="373" rx="206" ry="27" fill="url(#ckBoard)"/>
    <ellipse cx="${CX}" cy="373" rx="190" ry="22" fill="none" stroke="#fff6cf" stroke-opacity=".35"/>
    <ellipse cx="${CX}" cy="366" rx="176" ry="30" fill="#000" opacity=".35"/>
    <path d="${body}" fill="url(#ckNavy)"/>
    <path d="M${CX - 168} 282 A168 36 0 0 0 ${CX + 168} 282 M${CX - 168} 340 A168 36 0 0 0 ${CX + 168} 340" fill="none" stroke="url(#ckGold)" stroke-width="2"/>
    <text x="${CX}" y="338" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="40" letter-spacing="9" fill="url(#ckGold)" stroke="#5a3d06" stroke-width=".6">ARTHUR</text>
    <g fill="#f5c542" opacity=".85"><path d="M${CX - 120} 322 l2.4 5 5.4 .6 -4 3.6 1.2 5.3 -5 -2.8 -5 2.8 1.2 -5.3 -4 -3.6 5.4 -.6z"/><path d="M${CX + 120} 322 l2.4 5 5.4 .6 -4 3.6 1.2 5.3 -5 -2.8 -5 2.8 1.2 -5.3 -4 -3.6 5.4 -.6z"/></g>
    ${pearls}
    <ellipse cx="${CX}" cy="262" rx="168" ry="36" fill="#f6eee4"/>
    <ellipse cx="${CX}" cy="264" rx="128" ry="28" fill="#000" opacity=".18"/>
    <path d="${top}" fill="url(#ckCream)"/>
    <path d="M${CX - 124} 236 A124 28 0 0 0 ${CX + 124} 236 L${CX + 124} 254 A124 28 0 0 1 ${CX - 124} 254 Z" fill="url(#ckNavy)"/>
    <path d="M${CX - 124} 240 A124 28 0 0 0 ${CX + 124} 240" fill="none" stroke="#e30613" stroke-width="2.2"/>
    <circle cx="${CX}" cy="273" r="14" fill="url(#ckGold)" stroke="#7a5608"/><text x="${CX}" y="279.5" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="17" fill="#13245f">18</text>
    <path d="${d}" fill="url(#ckCoulis)"/>
    <ellipse cx="${CX - 34}" cy="141" rx="58" ry="8" fill="#fff" opacity=".22"/>
    <ellipse cx="${CX + 52}" cy="160" rx="22" ry="3" fill="#fff" opacity=".18"/>
    ${leaves}${topBerries}
    ${rosettes}
    <g clip-path="url(#ckClip)">
      <rect class="cake__warm" x="0" y="80" width="440" height="320" fill="url(#ckWarm)"/>
      <rect class="cake__shade" x="0" y="80" width="440" height="320" fill="#03061a"/>
    </g>
  </svg>`;
    })();
    // --- les 18 bougies, plantées en deux couronnes sur le dessus
    const CANDLE_POS = [];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.26; CANDLE_POS.push([220 + 98 * Math.cos(a), 150 + 19 * Math.sin(a), Math.sin(a)]); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5; CANDLE_POS.push([220 + 50 * Math.cos(a), 150 + 9.5 * Math.sin(a), Math.sin(a) * 0.5]); }
    candlesEl.innerHTML = CANDLE_POS.map(([x, y, z], i) => `<button class="candle" aria-label="Bougie ${i + 1}" style="left:${(x / 4.4).toFixed(2)}%;top:${(y / 4).toFixed(2)}%;z-index:${Math.round(y * 10)};--s:${(0.88 + 0.12 * (z + 1) / 2).toFixed(3)};--cc:${i % 2 ? "#1d3fbf" : "#e30613"};--fd:${zrnd(1.3, 2.2).toFixed(2)}s;--fdl:${(-zrnd(0, 2)).toFixed(2)}s"><span class="candle__wax"></span><span class="flame"></span></button>`).join("");
    const candles = $$(".candle", candlesEl);
    const lit = () => candles.filter(c => !c.classList.contains("out"));
    const setLit = () => cakeSec.style.setProperty("--lit", (lit().length / candles.length).toFixed(3));
    function smoke(c, drift = 0) {
      if (reduceMotion) return;
      const wr = $(".candle__wax", c).getBoundingClientRect(), cr = cakeEl.getBoundingClientRect();
      const x = wr.left + wr.width / 2 - cr.left, y = wr.top - cr.top - 8;
      for (let k = 0; k < 4; k++) {
        const s = document.createElement("i");
        s.className = "smoke";
        s.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;--sw:${(k * 0.13).toFixed(2)}s;--sd:${zrnd(2.2, 3.4).toFixed(2)}s;--sx1:${(zrnd(-10, 10) + drift * 0.5).toFixed(0)}px;--sx2:${(zrnd(-28, 28) + drift).toFixed(0)}px;--sr:${zrnd(-120, 120).toFixed(0)}deg`;
        smokeEl.appendChild(s); setTimeout(() => s.remove(), 4200);
      }
    }
    function blow(c, drift = 0) {
      if (c.classList.contains("out")) return;
      c.classList.remove("relit"); c.classList.add("out"); smoke(c, drift);
      SFX.pop(300 + Math.random() * 300);
      setLit();
      if (!lit().length) allOut();
    }
    // --- le grand moment : la salle s'éteint, « Fais un vœu »
    let wishTimers = [];
    const wishLater = (fn, ms) => wishTimers.push(setTimeout(fn, ms));
    function clearWish() { wishTimers.forEach(clearTimeout); wishTimers = []; cakeSec.classList.remove("is-wishing", "wish-1", "wish-2", "wish-out"); }
    const WISH_DONE = "Que tous tes vœux se réalisent, Arthur !";
    const wishStars = $("#wishStars");
    if (wishStars && !reduceMotion) wishStars.innerHTML = Array.from({ length: 26 }, () => `<i style="left:${zrnd(4, 96).toFixed(1)}%;top:${zrnd(6, 94).toFixed(1)}%;--d:${zrnd(1.6, 3.4).toFixed(1)}s;--w:${zrnd(0, 2).toFixed(1)}s"></i>`).join("");
    function allOut() {
      stopMic(); clearWish();
      cakeEl.classList.remove("cake--wind");
      wishEl.classList.remove("show");
      wishEl.textContent = "Fais un vœu, Arthur…";
      if (reduceMotion) {
        setTimeout(() => { wishEl.textContent = WISH_DONE; wishEl.classList.add("show"); relightBtn.hidden = false; SFX.fanfare(); }, 300);
        return;
      }
      wishLater(() => cakeSec.classList.add("is-wishing"), 700);
      wishLater(() => cakeSec.classList.add("wish-1"), 1500);
      wishLater(() => { cakeSec.classList.add("wish-2"); ZFX.chime(); }, 2900);
      wishLater(() => cakeSec.classList.add("wish-out"), 6200);
      wishLater(() => {
        cakeSec.classList.remove("is-wishing");
        wishEl.textContent = WISH_DONE; void wishEl.offsetWidth; wishEl.classList.add("show");
        confetti(320); SFX.fanfare(); SFX.cheer(0.7);
        relightBtn.hidden = false;
      }, 6900);
      wishLater(() => cakeSec.classList.remove("wish-1", "wish-2", "wish-out"), 8200);
    }
    candlesEl.addEventListener("click", e => { const c = e.target.closest(".candle"); if (c) blow(c); });
    $("#blowAll").addEventListener("click", () => {
      const l = lit(); if (!l.length) return;
      ZFX.breath(1.1);
      cakeEl.classList.add("cake--wind");
      // le souffle arrive de face : les bougies du premier rang s'éteignent d'abord
      l.sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top))
        .forEach((c, i) => setTimeout(() => blow(c, 26), reduceMotion ? 0 : 260 + i * 55 + Math.random() * 70));
    });
    relightBtn.addEventListener("click", () => {
      clearWish();
      candles.forEach((c, i) => setTimeout(() => {
        c.classList.remove("out"); c.classList.add("relit"); setLit();
        if (i % 3 === 0) SFX.pop(1300 + i * 20);
        setTimeout(() => c.classList.remove("relit"), 1100);
      }, i * 90));
      wishEl.textContent = ""; wishEl.classList.remove("show"); relightBtn.hidden = true;
    });
    let micStream = null, micRaf = null;
    function stopMic() {
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      micStream = null; cancelAnimationFrame(micRaf);
      cakeEl.classList.remove("cake--wind");
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
      let lastBlow = 0, windUntil = 0;
      (function listen(t) {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
        const rms = Math.sqrt(sum / buf.length);
        if (rms > 9) windUntil = t + 250;                       // les flammes se couchent dès qu'on souffle
        cakeEl.classList.toggle("cake--wind", t < windUntil);
        if (rms > 18 && t - lastBlow > 90) { lastBlow = t; const l = lit(); if (l.length) blow(l[(Math.random() * l.length) | 0], 20); }
        if (micStream) micRaf = requestAnimationFrame(listen); else ac.close();
      })(0);
    });
  })();

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

    const wrap = $("#mticketWrap"), ticket = $("#mticket"), scratchEl = $("#scratch"), pctEl = $("#scratchPct");
    const cv = $("#scratchCanvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    let done = false, scratching = false, auto = false, lastPt = null, strokes = 0, paintedSize = "", brush = 40;
    function star(c, x, y, r) {
      c.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, rr = k % 2 ? r * 0.28 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath(); c.fill();
    }
    // la pellicule dorée : métal brossé, reflet holographique, filigrane « 18 », paillettes, texte en relief
    function paint(force) {
      if (done) return;
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      const size = `${Math.round(r.width)}x${Math.round(r.height)}`;
      if (!force && size === paintedSize) return;
      paintedSize = size;
      const dpr = Math.min(2, devicePixelRatio || 1), w = r.width, h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      brush = Math.max(28, Math.min(46, w * 0.11));
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, w, h);
      [[0, "#9c7218"], [0.18, "#f7dc7a"], [0.36, "#c9a227"], [0.52, "#fff1b0"], [0.7, "#b8892a"], [0.86, "#f5d36a"], [1, "#8a6212"]].forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 1.5) { ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${(Math.random() * 0.09).toFixed(3)})` : `rgba(90,60,0,${(Math.random() * 0.08).toFixed(3)})`; ctx.fillRect(0, y, w, 1); }
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.45);
      const hg = ctx.createLinearGradient(-w, 0, w, 0);
      hg.addColorStop(0.3, "rgba(255,255,255,0)"); hg.addColorStop(0.44, "rgba(150,230,255,.28)"); hg.addColorStop(0.5, "rgba(255,180,240,.3)"); hg.addColorStop(0.56, "rgba(255,255,190,.28)"); hg.addColorStop(0.7, "rgba(255,255,255,0)");
      ctx.fillStyle = hg; ctx.fillRect(-w, -h * 2, w * 2, h * 4); ctx.restore();
      ctx.save(); ctx.font = `${Math.round(h * 0.17)}px "Bebas Neue", Impact, sans-serif`; ctx.fillStyle = "rgba(110,72,0,.11)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let y = h * 0.12, row = 0; y < h + 10; y += h * 0.24, row++) for (let xx = row % 2 ? w * 0.04 : w * 0.12; xx < w + 10; xx += w * 0.16) ctx.fillText("18", xx, y);
      ctx.restore();
      for (let i = 0, n = (w * h) / 70; i < n; i++) {
        const s = Math.random() * 1.6 + 0.4;
        ctx.fillStyle = Math.random() < 0.72 ? `rgba(255,255,240,${(0.3 + Math.random() * 0.6).toFixed(2)})` : `rgba(255,${(170 + Math.random() * 70) | 0},70,.85)`;
        ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
      }
      ctx.fillStyle = "rgba(255,255,245,.9)";
      for (let i = 0; i < 12; i++) star(ctx, Math.random() * w, Math.random() * h, 2 + Math.random() * 4);
      ctx.strokeStyle = "rgba(255,250,220,.55)"; ctx.setLineDash([5, 4]); ctx.lineWidth = 1; ctx.strokeRect(7.5, 7.5, w - 15, h - 15); ctx.setLineDash([]);
      const fs = Math.min(w * 0.1, 50);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `${fs}px "Bebas Neue", Impact, sans-serif`;
      const label = "✦ GRATTE ICI ✦";
      ctx.fillStyle = "rgba(255,248,214,.9)"; ctx.fillText(label, w / 2, h / 2 - fs * 0.1 + 1.5);
      ctx.fillStyle = "rgba(72,46,0,.8)"; ctx.fillText(label, w / 2, h / 2 - fs * 0.1);
      ctx.font = `600 ${Math.min(w * 0.034, 14)}px Inter, sans-serif`;
      if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
      ctx.fillStyle = "rgba(255,248,214,.85)"; ctx.fillText("TICKET GAGNANT À 100 %", w / 2, h / 2 + fs * 0.62 + 1);
      ctx.fillStyle = "rgba(72,46,0,.75)"; ctx.fillText("TICKET GAGNANT À 100 %", w / 2, h / 2 + fs * 0.62);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    }
    new ResizeObserver(() => paint(strokes === 0)).observe(cv);
    if (document.fonts) document.fonts.ready.then(() => { if (!strokes) paint(true); });

    // paillettes qui s'envolent au grattage
    const fxc = $("#scratchFx"), fctx = fxc.getContext("2d");
    let parts = [], fxRaf = null, fxLast = 0, fxW = 0, fxH = 0;
    const GOLDS = ["#f5c542", "#fff1b0", "#d6a92c", "#ffe27a", "#ffffff", "#b8892a"];
    function fxSize() { const r = fxc.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); fxW = r.width; fxH = r.height; fxc.width = Math.round(r.width * dpr); fxc.height = Math.round(r.height * dpr); fctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    new ResizeObserver(fxSize).observe(fxc);
    function toFx(p) { const a = cv.getBoundingClientRect(), b = fxc.getBoundingClientRect(); return { x: p.x + a.left - b.left, y: p.y + a.top - b.top }; }
    function flakes(p, n, burst) {
      if (reduceMotion) return;
      const q = toFx(p);
      for (let i = 0; i < n && parts.length < 420; i++) {
        const a = burst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + zrnd(-1.5, 1.5), sp = burst ? zrnd(140, 560) : zrnd(30, 170);
        parts.push({ x: q.x + zrnd(-10, 10), y: q.y + zrnd(-10, 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (burst ? 120 : 20),
          s: zrnd(1.6, burst ? 5.5 : 3.6), r: Math.random() * 6, vr: zrnd(-14, 14), life: 1, decay: zrnd(0.45, burst ? 0.8 : 1.2),
          c: GOLDS[(Math.random() * GOLDS.length) | 0], star: burst && Math.random() < 0.3 });
      }
      if (!fxRaf) { fxLast = performance.now(); fxRaf = requestAnimationFrame(fxTick); }
    }
    function fxTick(t) {
      const dt = Math.min(0.05, (t - fxLast) / 1000); fxLast = t;
      fctx.clearRect(0, 0, fxW, fxH);
      for (const q of parts) {
        q.vy += 620 * dt; q.vx *= 0.985; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; q.life -= q.decay * dt;
        fctx.globalAlpha = Math.max(0, Math.min(1, q.life * 1.5)); fctx.fillStyle = q.c;
        fctx.save(); fctx.translate(q.x, q.y); fctx.rotate(q.r);
        if (q.star) star(fctx, 0, 0, q.s * 1.4);
        else { const fl = Math.abs(Math.cos(q.r * 1.7)); fctx.fillRect(-q.s / 2, (-q.s * fl) / 2, q.s, q.s * fl + 0.4); }
        fctx.restore();
      }
      fctx.globalAlpha = 1;
      parts = parts.filter(q => q.life > 0 && q.y < fxH + 20);
      fxRaf = parts.length ? requestAnimationFrame(fxTick) : null;
      if (!fxRaf) fctx.clearRect(0, 0, fxW, fxH);
    }

    function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function scratchAt(p) {
      const from = lastPt || p;
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = brush;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(p.x + zrnd(-brush * 0.6, brush * 0.6), p.y + zrnd(-brush * 0.6, brush * 0.6), zrnd(2, 6), 0, 7); ctx.fill(); }
      const dist = Math.hypot(p.x - from.x, p.y - from.y);
      lastPt = p;
      flakes(p, Math.min(7, 1 + dist / 7), false);
      ZFX.scratch(0.03 + Math.min(0.17, dist / 110));
      if (++strokes % 8 === 0) check();
    }
    function check() {
      if (done) return;
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 16) { total++; if (data[i] < 40) clear++; }
      const p = total ? clear / total : 0;
      pctEl.textContent = p > 0.02 ? `${Math.min(99, Math.round(p * 100 / 0.55))} %` : "";
      if (p > 0.55) reveal();
    }
    function reveal() {
      if (done) return; done = true; scratching = false;
      ZFX.scratchStop();
      scratchEl.classList.remove("scratching"); scratchEl.classList.add("done"); cv.classList.add("done");
      cv.setAttribute("aria-hidden", "true"); cv.tabIndex = -1;
      pctEl.textContent = "100 %";
      const r = cv.getBoundingClientRect();
      flakes({ x: r.width / 2, y: r.height / 2 }, 150, true);
      wrap.classList.add("revealed");
      ZFX.chime(); SFX.fanfare();
      confetti(260, ["#f5c542", "#ffffff", "#e30613"]);
      setTimeout(() => {
        ticket.classList.add("validated"); wrap.classList.remove("slam"); void wrap.offsetWidth; wrap.classList.add("slam");
        SFX.boom(); SFX.cheer(0.6);
      }, 900);
    }
    function autoScratch() {
      if (done || auto) return;
      if (reduceMotion) return reveal();
      auto = true;
      const r = cv.getBoundingClientRect(), pts = [];
      for (let i = 0; i <= 6; i++) { const y = r.height * (0.08 + 0.84 * i / 6); pts.push({ x: i % 2 ? r.width * 0.96 : r.width * 0.04, y }, { x: i % 2 ? r.width * 0.04 : r.width * 0.96, y: y + r.height * 0.06 }); }
      let k = 0; lastPt = pts[0];
      (function step() {
        if (done) return;
        const a = pts[k], b = pts[k + 1];
        for (let s = 1; s <= 5; s++) scratchAt({ x: a.x + (b.x - a.x) * s / 5, y: a.y + (b.y - a.y) * s / 5 });
        if (++k < pts.length - 1) setTimeout(step, 55);
        else { lastPt = null; ZFX.scratchStop(); reveal(); }
      })();
    }
    cv.addEventListener("pointerdown", e => {
      if (done) return;
      scratching = true; lastPt = null; scratchEl.classList.add("scratching"); ticket.style.rotate = "";
      cv.setPointerCapture(e.pointerId); scratchAt(pos(e));
    });
    cv.addEventListener("pointermove", e => { if (scratching) scratchAt(pos(e)); });
    const end = () => { if (scratching) { scratching = false; lastPt = null; scratchEl.classList.remove("scratching"); ZFX.scratchStop(); check(); } };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); autoScratch(); } });

    // reflet holographique et légère inclinaison qui suivent la souris
    if (!reduceMotion && matchMedia("(hover: hover)").matches) {
      const shine = $(".mticket__shine", ticket);
      wrap.addEventListener("pointermove", e => {
        const r = ticket.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        shine.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
        shine.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
        shine.style.setProperty("--sx", ((0.5 - x) * 100 + 50).toFixed(1) + "%");
        if (scratching) return;
        const mag = Math.min(1, Math.hypot(x, y) * 1.6) * 7;
        ticket.classList.add("tilting");
        ticket.style.rotate = `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${mag.toFixed(2)}deg`;
      });
      wrap.addEventListener("pointerleave", () => { ticket.classList.remove("tilting"); ticket.style.rotate = ""; });
    }
  })();

  /* =================================================================
     CASIER N°18
     ================================================================= */
  (() => {
    $("#lockerTitle").textContent = D.casier.titre;
    $("#lockerText").textContent = D.casier.texte;
    const locker = $("#locker"), lock = $("#lockerLock"), count = $("#lockerCount"), door = $("#lockerDoor"), zone = locker.closest(".locker-zone");
    const isOpen = () => D.casier.verrouille === false || isBirthdayPassed();
    let opening = false;
    function tick() {
      if (isOpen()) {
        count.textContent = (locker.classList.contains("open") || opening) ? "" : "Le casier est déverrouillé. Clique sur la porte.";
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
    function finish() {
      door.setAttribute("aria-label", "Casier ouvert : le maillot n°18 t'attend");
      door.setAttribute("aria-expanded", "true");
    }
    door.addEventListener("click", () => {
      if (!isOpen()) {
        lock.classList.remove("shake"); void lock.offsetWidth; lock.classList.add("shake");
        SFX.pop(160);
        const d = Math.ceil((majority - Date.now()) / 86400000);
        toast(`Fermé à clé. Patience… encore ${d} jour${d > 1 ? "s" : ""}.`);
        return;
      }
      if (locker.classList.contains("open") || opening) return;
      opening = true; count.textContent = "";
      if (reduceMotion) {
        locker.classList.add("open", "lit", "revealed"); zone.classList.add("is-open");
        SFX.fanfare(); finish(); return;
      }
      // 1. le cadenas saute  2. la porte s'entrouvre, la lumière filtre  3. elle s'ouvre en grand  4. le néon s'allume, le maillot apparaît
      locker.classList.add("unlocking"); SFX.pop(260); setTimeout(() => SFX.pop(170), 160);
      setTimeout(() => { locker.classList.add("cracking"); SFX.pop(120); }, 700);
      setTimeout(() => { locker.classList.add("open"); locker.classList.remove("cracking"); zone.classList.add("is-open"); ZFX.creak(); }, 1550);
      setTimeout(() => locker.classList.add("lit"), 1950);
      setTimeout(() => { locker.classList.add("revealed"); SFX.fanfare(); ZFX.chime(); finish(); }, 2400);
      setTimeout(() => { confetti(260); SFX.cheer(); }, 3300);
    });
  })();

  /* =================================================================
     FEU D'ARTIFICE FINAL
     ================================================================= */
  (() => {
    const fin = $("#finale"), cv = $("#fireworks"), ctx = cv.getContext("2d"), flashEl = $(".finale__flash", fin), big = $("#finaleBig");
    // le titre, lettre par lettre (le texte complet reste lisible pour les lecteurs d'écran)
    const lines = big.innerHTML.split(/<br\s*\/?>/i).map(t => t.trim()).filter(Boolean);
    let li = 0;
    big.innerHTML = `<span class="finale-sr">${lines.join(" ")}</span><span aria-hidden="true">${lines.map((line, n) =>
      line.split(/\s+/).map(word => `<span class="finale__word${n === lines.length - 1 ? " finale__word--name" : ""}">${[...word].map(ch => `<span class="finale__l" style="--i:${li++}">${ch}</span>`).join("")}</span>`).join(" ")
    ).join("<br />")}</span>`;
    fin.classList.add("finale--ready");

    const small = () => innerWidth < 640;
    let W = 0, H = 0;
    function resize() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(small() ? 1.5 : 2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    new ResizeObserver(resize).observe(cv);
    const PAL = [["#ff2a3a", "#ffc2c8"], ["#ffffff", "#bcd2ff"], ["#3a6bff", "#c8d8ff"], ["#f5c542", "#fff0b0"], ["#ff5ab4", "#ffd0ec"], ["#5affc8", "#d4fff1"], ["#ff9a2a", "#ffe2bf"]];
    const TYPES = ["peony", "peony", "chrys", "chrys", "willow", "ring", "crossette", "crackle", "heart", "double"];
    const MAX = () => (small() ? 1100 : 2600);
    let rockets = [], parts = [], raf = null, visible = false, last = 0, nextLaunch = 0, firstSeen = false, bouquetAt = 0, bouquetEnd = 0, lastBoom = 0, flash = 0, shownFlash = -1;

    function boom(power) {
      const t = performance.now();
      if (t - lastBoom > 110) { lastBoom = t; SFX.boom(); }
      flash = Math.min(1, flash + power);
    }
    function launch(o = {}) {
      if (!W) return;
      const x = o.x ?? W * zrnd(0.12, 0.88), ty = o.ty ?? H * zrnd(0.1, 0.42), g = 400;
      rockets.push({ x, y: H + 6, vx: zrnd(-25, 25), vy: -Math.sqrt(2 * g * (H - ty)), g, type: o.type || TYPES[(Math.random() * TYPES.length) | 0], pal: o.pal || PAL[(Math.random() * PAL.length) | 0], size: o.size || zrnd(0.85, 1.2) });
    }
    function add(p) { if (parts.length < MAX()) parts.push(p); }
    function P(x, y, vx, vy, c, c2, o = {}) {
      return { x, y, px: x, py: y, vx, vy, c, c2, life: 1, decay: o.decay ?? zrnd(0.55, 0.85), w: o.w ?? 1.8, grav: o.grav ?? 70, drag: o.drag ?? 0.982, strobe: !!o.strobe, split: !!o.split, mode: o.mode, tx: o.tx, ty: o.ty, t: 0, sx: x, sy: y };
    }
    let pts18 = null;
    function textPoints() {
      if (pts18) return pts18;
      const c = document.createElement("canvas"), cw = 170, ch = 110, step = small() ? 5 : 4;
      c.width = cw; c.height = ch;
      const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.font = '110px "Bebas Neue", Impact, sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("18", cw / 2, ch / 2 + 6);
      const d = x.getImageData(0, 0, cw, ch).data, out = [];
      for (let y = 0; y < ch; y += step) for (let xx = 0; xx < cw; xx += step) if (d[(y * cw + xx) * 4 + 3] > 128) out.push([(xx - cw / 2) / ch, (y - ch / 2) / ch]);
      if (!document.fonts || document.fonts.check('110px "Bebas Neue"')) pts18 = out;
      return out;
    }
    function explode(r) {
      const [c, c2] = r.pal, s = r.size, room = MAX() - parts.length;
      const k = room < 200 ? 0.4 : 1;
      const burst = (n, sp, o = {}) => {
        for (let i = 0; i < n * k; i++) {
          const a = Math.random() * Math.PI * 2, v = sp * (Math.random() < 0.75 ? zrnd(0.88, 1.08) : zrnd(0.3, 0.85));
          add(P(r.x, r.y, Math.cos(a) * v, Math.sin(a) * v, o.c || c, o.c2 || c2, o));
        }
      };
      // halo lumineux de l'explosion
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 90 * s);
      glow.addColorStop(0, "rgba(255,240,220,.55)"); glow.addColorStop(1, "rgba(255,240,220,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = glow; ctx.fillRect(r.x - 90 * s, r.y - 90 * s, 180 * s, 180 * s);
      switch (r.type) {
        case "chrys": burst(110, 210 * s, { decay: zrnd(0.4, 0.6), w: 2.2, c2: "#ffe7a0" }); break;
        case "willow": burst(80, 150 * s, { c: "#ffcf6a", c2: "#ff9a2a", decay: zrnd(0.28, 0.38), grav: 120, drag: 0.972, w: 1.5 }); break;
        case "ring": {
          const n = 70, tilt = zrnd(0.25, 1), rot = Math.random() * Math.PI;
          for (let i = 0; i < n * k; i++) {
            const a = (i / n) * Math.PI * 2, vx0 = Math.cos(a) * 200 * s, vy0 = Math.sin(a) * 200 * s * tilt;
            add(P(r.x, r.y, vx0 * Math.cos(rot) - vy0 * Math.sin(rot), vx0 * Math.sin(rot) + vy0 * Math.cos(rot), c, c2, { decay: 0.6 }));
          }
          burst(20, 60, { c: "#fff", c2: c, decay: 0.9 });
          break;
        }
        case "crossette": burst(26, 170 * s, { split: true, decay: 0.7, w: 2.2 }); break;
        case "crackle": burst(90, 190 * s, { c: "#ffffff", c2: "#fff2c0", strobe: true, decay: zrnd(0.6, 0.9), w: 1.4 }); break;
        case "heart": {
          const n = 80, sc = 10 * s;
          for (let i = 0; i < n * k; i++) {
            const t = (i / n) * Math.PI * 2;
            add(P(r.x, r.y, 16 * Math.sin(t) ** 3 * sc, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * sc, "#ff3a6a", "#ffc2d4", { decay: 0.6, grav: 30 }));
          }
          break;
        }
        case "double": burst(80, 220 * s); burst(40, 110 * s, { c: "#ffffff", c2: c }); break;
        case "t18": {
          const pts = textPoints(), S = Math.min(W * 0.5, H * 0.32);
          for (const [px, py] of pts) parts.push(P(r.x, r.y, 0, 0, "#ffe27a", "#fff3c0", { mode: "seek", tx: r.x + px * S, ty: r.y + py * S, decay: 0.4, w: 3, grav: 40 }));
          burst(60, 260, { c: "#fff", c2: "#ffd862", decay: 0.9 });
          break;
        }
        default: burst(95, 200 * s);
      }
      boom(r.type === "t18" ? 0.9 : 0.35 * s);
    }
    function bouquet() {
      if (!W) return;
      const n = small() ? 14 : 24;
      for (let i = 0; i < n; i++) setTimeout(() => launch({ x: W * (0.08 + 0.84 * ((i * 5) % 7) / 6) + zrnd(-25, 25), ty: H * zrnd(0.08, 0.42), type: i % 6 === 5 ? "willow" : undefined }), i * 105);
      setTimeout(() => launch({ x: W / 2, ty: H * 0.17, type: "t18", pal: PAL[3], size: 1 }), 700);
      setTimeout(() => { for (let j = 0; j < 6; j++) setTimeout(() => launch({ x: W * (0.12 + 0.152 * j), ty: H * zrnd(0.12, 0.28), type: "willow", pal: PAL[3], size: 1.25 }), j * 70); }, n * 105 + 250);
      setTimeout(() => { fin.classList.add("finale--gold"); flash = 1; }, n * 105 + 1500);
      bouquetEnd = performance.now() + n * 105 + 2500;
    }
    function frame(t) {
      const dt = Math.min(0.04, (t - (last || t)) / 1000); last = t;
      ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = 1; ctx.fillStyle = "rgba(0,0,0,.24)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      if (visible && !reduceMotion) {
        if (bouquetAt && t > bouquetAt) { bouquetAt = 0; bouquet(); }
        if (t > nextLaunch && t > bouquetEnd - 2000) { launch(); nextLaunch = t + (bouquetEnd && t > bouquetEnd ? zrnd(900, 1700) : zrnd(420, 820)); }
      }
      for (const r of rockets) {
        r.px = r.x; r.py = r.y; r.vy += r.g * dt; r.x += r.vx * dt; r.y += r.vy * dt;
        if (Math.random() < 0.7) add(P(r.x, r.y, zrnd(-18, 18), zrnd(10, 50), "#ffd38a", "#ff7a2a", { decay: zrnd(2.6, 3.6), w: 1.1, grav: 40, drag: 0.94 }));
        ctx.globalAlpha = 1; ctx.strokeStyle = "#fff6d8"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(r.px, r.py); ctx.lineTo(r.x, r.y); ctx.stroke();
      }
      rockets = rockets.filter(r => { if (r.vy >= -25) { explode(r); return false; } return true; });
      const born = [];
      for (const p of parts) {
        p.px = p.x; p.py = p.y; p.t += dt;
        if (p.mode === "seek") {
          const e = Math.min(1, p.t / 0.75), ee = 1 - (1 - e) ** 3;
          p.x = p.sx + (p.tx - p.sx) * ee; p.y = p.sy + (p.ty - p.sy) * ee;
          if (p.t > 1.9) { p.mode = null; p.vx = zrnd(-15, 15); p.vy = zrnd(0, 30); }
          else p.life = Math.max(p.life, 0.9);
        } else {
          const dr = Math.pow(p.drag, dt * 60);
          p.vx *= dr; p.vy = p.vy * dr + p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          p.life -= p.decay * dt;
        }
        if (p.split && p.life < 0.55) {
          p.split = false; p.life = 0;
          const a0 = Math.random() * Math.PI;
          for (let q = 0; q < 4; q++) { const a = a0 + q * Math.PI / 2; born.push(P(p.x, p.y, Math.cos(a) * 90, Math.sin(a) * 90, "#ffffff", p.c, { decay: 1.3, w: 1.4 })); }
          continue;
        }
        let a = Math.min(1, p.life * 1.5);
        if (p.strobe) a *= Math.random() < 0.4 ? 1 : 0.12;
        if (p.mode === "seek" || (p.t < 1.9 + 0.05 && p.tx != null)) a *= 0.7 + Math.random() * 0.3;
        if (a <= 0) continue;
        ctx.globalAlpha = a; ctx.strokeStyle = p.life > 0.45 ? p.c : p.c2; ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
      }
      for (const b of born) add(b);
      ctx.globalAlpha = 1;
      parts = parts.filter(p => p.life > 0 && p.y < H + 30);
      flash = Math.max(0, flash - dt * 1.6);
      const f = Math.round(flash * 100) / 100;
      if (f !== shownFlash) { shownFlash = f; flashEl.style.opacity = f; }
      raf = (visible || rockets.length || parts.length) ? requestAnimationFrame(frame) : null;
      if (!raf) { ctx.clearRect(0, 0, W, H); flashEl.style.opacity = 0; shownFlash = 0; last = 0; }
    }
    const run = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (!visible) return;
      if (!firstSeen) {
        firstSeen = true;
        fin.classList.add("finale--lit");
        SFX.whistle("final"); setTimeout(() => SFX.cheer(), 1200);
        const now = performance.now();
        nextLaunch = now + 1800;              // un instant de silence, puis le spectacle
        bouquetAt = now + 9500;               // et le bouquet final
      }
      run();
    }, { threshold: 0.35 }).observe(fin);
    let lastReplay = 0;
    $("#replayFireworks").addEventListener("click", () => {
      const now = performance.now();
      if (now - lastReplay < 2500) return;
      lastReplay = now;
      if (reduceMotion) { for (let i = 0; i < 3; i++) setTimeout(() => launch({ type: "peony" }), i * 500); }
      else { fin.classList.remove("finale--gold"); bouquetAt = 0; bouquet(); }
      run();
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
