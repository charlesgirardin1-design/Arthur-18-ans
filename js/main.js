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
  // maillot du hero : inclinaison 3D qui suit la souris
  const jersey = $("#jersey");
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    addEventListener("pointermove", e => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      jersey.style.setProperty("--ry", (x * 16).toFixed(2) + "deg");
      jersey.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
    }, { passive: true });
  }
  let entered = false;
  function enter(withSound) {
    if (entered) return; entered = true;
    setSound(withSound);
    SFX.whistle();
    intro.classList.add("leaving");
    setTimeout(() => {
      document.body.classList.remove("locked");
      document.body.classList.add("entered");
      setTimeout(() => { confetti(140); SFX.cheer(0.8); }, 1300);
    }, 250);
    setTimeout(() => intro.remove(), 1400);
  }
  $("#enterSound").addEventListener("click", () => enter(true));
  $("#enterMute").addEventListener("click", () => enter(false));
  // lien direct vers une section : on saute l'intro
  if (location.hash && location.hash.length > 1) {
    intro.remove(); entered = true;
    document.body.classList.remove("locked"); document.body.classList.add("entered");
  }

  /* =================================================================
     HERO : COMPTE À REBOURS
     ================================================================= */
  function updateCountdown() {
    const diff = forceDay ? 0 : majority - Date.now();
    if (diff > 0) {
      const s = Math.floor(diff / 1000);
      $("#cdD").textContent = pad(Math.floor(s / 86400));
      $("#cdH").textContent = pad(Math.floor(s / 3600) % 24);
      $("#cdM").textContent = pad(Math.floor(s / 60) % 60);
      $("#cdS").textContent = pad(s % 60);
    } else {
      $("#countdown").classList.add("done");
      const days = Math.floor(-diff / 86400000);
      $("#heroSub").innerHTML = days === 0
        ? "<strong>C'EST AUJOURD'HUI ! JOYEUX ANNIVERSAIRE ARTHUR !</strong>"
        : `Tu es majeur depuis <strong>${fmt.format(days)}</strong> jour${days > 1 ? "s" : ""}`;
    }
  }
  updateCountdown(); setInterval(updateCountdown, 1000);

  $("#heroBallInner").innerHTML = FIG.ballSVG();
  $("#heroBall").addEventListener("click", e => {
    const b = e.currentTarget;
    b.classList.remove("kick"); void b.offsetWidth; b.classList.add("kick");
    SFX.kick();
    setTimeout(() => { confetti(120); SFX.cheer(); toast("GOOOOOAAAAL !"); }, 500);
    dispatchEvent(new Event("ball-kick"));
  });

  $("#flashes").innerHTML = Array.from({ length: 28 }, () =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--d:${(3 + Math.random() * 5).toFixed(1)}s;--delay:-${(Math.random() * 8).toFixed(1)}s"></i>`).join("");
  const tickerItems = ["JOYEUX ANNIVERSAIRE ARTHUR", "18 ANS", "20.12.2008", "ALLEZ PARIS", "LE MEILLEUR RESTE À JOUER", "FOOT · TENNIS · MULTISPORT"];
  const tk = tickerItems.map(t => `<span>${t}</span><span class="ticker__dot">●</span>`).join("");
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
  $("#menuList").innerHTML = $$("[data-menu]").map((s, i) =>
    `<li style="--i:${i}"><a href="#${s.id}"><small>${pad(i)}</small>${s.dataset.menu}</a></li>`).join("");
  function setMenu(open) {
    menu.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) SFX.pop(700);
  }
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  /* =================================================================
     APPARITION AU DÉFILEMENT
     ================================================================= */
  const revealEls = $$(".sh, .letter, .card-wrap, .buvette, .dogcard, .stats-grid, .film, .penalty, .juggle, .wall, .cake-zone, .ticket, .locker-zone");
  revealEls.forEach(el => el.classList.add("reveal"));
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("visible"); revealIO.unobserve(en.target); }
  }), { threshold: 0.12 });
  revealEls.forEach(el => revealIO.observe(el));

  /* =================================================================
     LETTRE
     ================================================================= */
  $("#letterTitle").textContent = D.lettre.titre;
  $("#letterBody").innerHTML = D.lettre.paragraphes.map(p => `<p>${p}</p>`).join("");
  $("#letterSign").textContent = "— " + D.lettre.signature;
  const letterIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    $$("#letterBody p").forEach((p, i) => setTimeout(() => p.classList.add("visible"), 400 + i * 700));
    letterIO.disconnect();
  }, { threshold: 0.25 });
  letterIO.observe($("#letter"));

  /* =================================================================
     CARTE JOUEUR
     ================================================================= */
  const c = D.carte;
  $("#cardRating").textContent = c.note;
  $("#cardPos").textContent = c.poste;
  $("#cardStats").innerHTML = c.stats.map(s => `<div><b>${s.valeur}</b><span>${s.label}</span></div>`).join("");
  $("#backSports").textContent = c.sports.join(" · ");
  if (D.photoProfil) $("#cardPhoto").innerHTML = `<img src="${D.photoProfil}" alt="Arthur" style="object-position:${D.photoProfilPos || "50% 35%"}" />`;
  const now0 = new Date();
  let age = now0.getFullYear() - birth.getFullYear();
  if (now0 < new Date(now0.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  $("#backAge").textContent = now0 < majority ? `${age} ans (18 le 20/12 !)` : `${age} ans`;

  const card = $("#playerCard");
  card.addEventListener("click", () => { card.classList.toggle("flipped"); SFX.pop(380); });
  if (!reduceMotion) {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.transform = `rotateY(${(x - 0.5) * 22}deg) rotateX(${(0.5 - y) * 22}deg)`;
      card.style.setProperty("--mx", x * 100 + "%"); card.style.setProperty("--my", y * 100 + "%"); card.style.setProperty("--hx", x * 100 + "%");
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  }

  /* =================================================================
     TES PRÉFÉRÉS + LE BULLDOG MASCOTTE
     ================================================================= */
  (() => {
    const P = D.preferes;
    if (!P) return;
    $("#menuItems").innerHTML = P.plats.map(m => `
      <article class="dish" tabindex="0">
        <div class="dish__illu">${FIG.foodSVG(m.illu)}</div>
        <h3>${m.nom}</h3><p>${m.texte}</p><span class="dish__price">${m.prix}</span>
      </article>`).join("");
    $("#dogRace").textContent = P.chien.race;
    $("#dogText").textContent = P.chien.texte;
    $("#dogStats").innerHTML = P.chien.stats.map(st => `<div><span>${st.label}</span><i style="--v:${st.valeur}%"></i><b>${st.valeur}</b></div>`).join("");
    $("#dogcardSvg").innerHTML = FIG.bulldogSVG();

    const dog = $("#bulldog"), bubble = $("#dogBubble"), cball = $("#chaseBall");
    $("#dogFig").innerHTML = FIG.bulldogSVG();
    cball.innerHTML = FIG.ballSVG();
    const lines = P.chien.repliques || ["WOUF !"];
    let li = 0, busy = false;
    function bark(el, bub) {
      el.classList.remove("barking"); void el.offsetWidth; el.classList.add("barking");
      SFX.bark();
      if (bub) {
        bub.textContent = lines[li++ % lines.length];
        bub.classList.add("show");
        clearTimeout(bub._t); bub._t = setTimeout(() => bub.classList.remove("show"), 1700);
      }
      setTimeout(() => el.classList.remove("barking"), 700);
    }
    dog.addEventListener("click", () => { if (!busy) bark(dog, bubble); });
    $("#dogcardFig").addEventListener("click", () => bark($("#dogcardFig"), $("#dogcardBubble")));

    const run = (el, frames, ms, easing) => el.animate(frames, { duration: ms, easing, fill: "forwards" }).finished;
    async function trotIn() {
      dog.classList.add("running");
      await run(dog, [{ transform: `translateX(${-dog.offsetWidth - 40}px)` }, { transform: "translateX(0)" }], 1400, "cubic-bezier(.2,.8,.3,1)");
      dog.getAnimations().forEach(a => a.cancel());
      dog.classList.remove("running");
    }
    async function chase() {
      if (busy || reduceMotion || !document.body.classList.contains("entered")) return;
      busy = true;
      const W = innerWidth, start = dog.getBoundingClientRect();
      cball.style.opacity = "1";
      const ballRun = cball.animate([
        { transform: `translateX(${start.right - 10}px) rotate(0deg)` },
        { transform: `translateX(${W + 80}px) rotate(1260deg)` },
      ], { duration: 2100, easing: "cubic-bezier(.25,.6,.45,1)", fill: "forwards" });
      await new Promise(r => setTimeout(r, 260));
      dog.classList.add("running", "panting");
      await run(dog, [{ transform: "translateX(0)" }, { transform: `translateX(${W + 40}px)` }], 2300, "cubic-bezier(.45,0,.65,1)");
      ballRun.cancel(); cball.style.opacity = "0";
      dog.getAnimations().forEach(a => a.cancel());
      await trotIn();
      bark(dog, bubble);
      setTimeout(() => dog.classList.remove("panting"), 2500);
      busy = false;
    }
    addEventListener("ball-kick", () => setTimeout(chase, 300));
    // arrivée du bulldog après l'entrée sur le terrain
    const arrive = () => setTimeout(async () => { if (reduceMotion) return; busy = true; await trotIn(); bark(dog, bubble); busy = false; }, 2600);
    if (document.body.classList.contains("entered")) arrive();
    else {
      const mo = new MutationObserver(() => { if (document.body.classList.contains("entered")) { mo.disconnect(); arrive(); } });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
    // de temps en temps, il part chercher un ballon
    setInterval(() => { if (!document.hidden && Math.random() < 0.7) chase(); }, 75000);
  })();

  /* =================================================================
     STATS EN DIRECT (comptage animé puis mise à jour chaque seconde)
     ================================================================= */
  const statEls = Object.fromEntries($$("[data-stat]").map(el => [el.dataset.stat, el]));
  let statsStart = null;
  function updateStats() {
    if (!statsStart) return;
    const p = reduceMotion ? 1 : Math.min(1, (performance.now() - statsStart) / 2000);
    const ms = (Date.now() - birth) * (1 - Math.pow(1 - p, 4));
    const sec = ms / 1000, min = sec / 60, days = ms / 86400000;
    statEls.secondes.textContent = fmt.format(Math.floor(sec));
    statEls.jours.textContent = fmt.format(Math.floor(days));
    statEls.coeur.textContent = fmt.format(Math.floor(min * 80));
    statEls.nuits.textContent = fmt.format(Math.floor(days));
    statEls.weekends.textContent = fmt.format(Math.floor(days / 7));
    statEls.pas.textContent = fmt.format(Math.floor(days * 11000));
    return p;
  }
  const statsIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting || statsStart) return;
    statsStart = performance.now(); statsIO.disconnect();
    (function loop() { updateStats() < 1 ? requestAnimationFrame(loop) : setInterval(updateStats, 1000); })();
  }, { threshold: 0.3 });
  statsIO.observe($("#compteur"));

  /* =================================================================
     CARRIÈRE
     ================================================================= */
  $("#timeline").innerHTML = D.carriere.map(e => `
    <li class="tl-item"><article class="tl-card">
      <div><div class="tl-year">${e.annee}</div><h3>${e.titre}</h3><p>${e.texte}</p></div>
      ${e.photo ? `<img class="tl-photo" src="${e.photo}" alt="${e.titre}" loading="lazy" />` : ""}
    </article></li>`).join("");
  const tlIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("visible"); tlIO.unobserve(en.target); }
  }), { threshold: 0.2 });
  $$(".tl-item").forEach(el => tlIO.observe(el));

  /* =================================================================
     TA VIE EN 18 SAISONS (pellicule)
     ================================================================= */
  const strip = $("#filmStrip");
  const by = birth.getFullYear();
  const ans = a => a === 0 ? "Naissance" : `${a} an${a > 1 ? "s" : ""}`;
  const saison = a => `Saison ${by + a}-${String((by + a + 1) % 100).padStart(2, "0")}`;
  const photos = D.saisons.map((s, i) => ({ ...s, _i: i })).sort((x, y) => x.age - y.age || x._i - y._i);
  const withSrc = photos.filter(p => p.src);
  strip.innerHTML = photos.map((s, i) => `
    <button class="frame${s.src ? "" : " frame--empty"}" data-i="${i}" ${s.src ? "" : 'tabindex="-1"'} aria-label="${ans(s.age)}${s.legende ? " — " + s.legende : ""}">
      <div class="frame__img">${s.src
        ? `<img src="${s.src}" alt="Arthur à ${s.age} ans${s.legende ? " — " + s.legende : ""}" loading="lazy" decoding="async" draggable="false" style="object-position:${s.pos || "50% 35%"}" />`
        : `<div class="frame__ph"><b>${s.age}</b>photo à venir</div>`}</div>
      <div class="frame__meta"><b>${ans(s.age)}</b><span>${saison(s.age)}</span></div>
      <div class="frame__cap">${s.legende || ""}</div>
    </button>`).join("");
  const frames = $$(".frame", strip);
  const ages = [...new Set(photos.map(p => p.age))];
  $("#filmAges").innerHTML = ages.map(a => `<button data-age="${a}" aria-label="Aller à ${ans(a)}">${a}</button>`).join("");
  const ageBtns = $$("#filmAges button");
  const goFrame = i => { const f = frames[i]; if (f) strip.scrollTo({ left: f.offsetLeft - (strip.clientWidth - f.offsetWidth) / 2, behavior: "smooth" }); };
  $("#filmAges").addEventListener("click", e => { const b = e.target.closest("button"); if (b) goFrame(photos.findIndex(p => p.age === +b.dataset.age)); });
  const step = () => (frames[0]?.offsetWidth || 240) * 2;
  $("#filmPrev").addEventListener("click", () => strip.scrollBy({ left: -step(), behavior: "smooth" }));
  $("#filmNext").addEventListener("click", () => strip.scrollBy({ left: step(), behavior: "smooth" }));
  function markActive() {
    const mid = strip.scrollLeft + strip.clientWidth / 2;
    let best = 0, bd = Infinity;
    frames.forEach((f, i) => { const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    frames.forEach((f, i) => f.classList.toggle("current", i === best));
    ageBtns.forEach(b => b.classList.toggle("active", +b.dataset.age === photos[best].age));
  }
  strip.addEventListener("scroll", () => requestAnimationFrame(markActive), { passive: true });
  markActive();
  // glisser à la souris
  let drag = null, lastDrag = false;
  strip.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; drag = { x: e.clientX, left: strip.scrollLeft, moved: false }; });
  addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) { drag.moved = true; strip.classList.add("dragging"); }
    strip.scrollLeft = drag.left - dx;
  });
  addEventListener("pointerup", () => { if (drag) { setTimeout(() => strip.classList.remove("dragging"), 0); lastDrag = drag.moved; drag = null; } });
  // visionneuse plein écran (flèches, clavier, balayage)
  const lb = $("#lightbox"), lbImg = $("#lightboxImg");
  let lbIdx = 0;
  function showPhoto(k) {
    lbIdx = (k + withSrc.length) % withSrc.length;
    const s = withSrc[lbIdx];
    lbImg.classList.remove("in"); void lbImg.offsetWidth;
    lbImg.src = s.src; lbImg.alt = s.legende || "";
    lbImg.classList.add("in");
    $("#lightboxCap").textContent = `${ans(s.age)}${s.legende ? " — " + s.legende : ""}`;
    $("#lightboxCount").textContent = `${lbIdx + 1} / ${withSrc.length}`;
  }
  strip.addEventListener("click", e => {
    if (lastDrag) { lastDrag = false; return; }
    const f = e.target.closest(".frame"); if (!f) return;
    const s = photos[+f.dataset.i]; if (!s.src) return;
    showPhoto(withSrc.indexOf(s)); lb.hidden = false; document.body.style.overflow = "hidden";
  });
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; };
  lb.addEventListener("click", e => {
    if (e.target.closest(".lightbox__prev")) return showPhoto(lbIdx - 1);
    if (e.target.closest(".lightbox__next")) return showPhoto(lbIdx + 1);
    if (e.target === lb || e.target.closest(".lightbox__close")) closeLb();
  });
  addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showPhoto(lbIdx - 1);
    if (e.key === "ArrowRight") showPhoto(lbIdx + 1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 50) showPhoto(lbIdx + (dx < 0 ? 1 : -1));
  });

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
  const minuteEl = $("#matchMinute"), progressEl = $("#progress");
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    progressEl.style.width = p * 100 + "%";
    const m = Math.round(p * 93);
    minuteEl.textContent = m <= 90 ? `${m}'` : `90+${m - 90}'`;
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
})();
