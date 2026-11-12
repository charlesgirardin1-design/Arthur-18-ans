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
  const revealEls = $$(".sh, .letter, .card-wrap, .dogcard, .stats-grid, .film, .penalty, .juggle, .wall, .cake-zone, .ticket, .locker-zone");
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
