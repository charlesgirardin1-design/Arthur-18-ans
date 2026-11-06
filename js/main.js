(() => {
  "use strict";
  const D = window.ARTHUR;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = new Intl.NumberFormat("fr-FR");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const birth = new Date(D.naissance);
  const majority = new Date(birth);
  majority.setFullYear(birth.getFullYear() + 18);

  /* ================= CONFETTIS ================= */
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let pieces = [];
  let rafId = null;
  const COLORS = ["#e30613", "#ffffff", "#0b1640", "#f5c542", "#3a5bd9"];
  function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; }
  addEventListener("resize", resize); resize();

  function confetti(n = 160, colors = COLORS) {
    if (reduceMotion) return;
    const w = canvas.width, h = canvas.height;
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.4,
        vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
        s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: colors[(Math.random() * colors.length) | 0], t: 0,
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces = pieces.filter(p => p.y < canvas.height + 40);
    for (const p of pieces) {
      p.t++; p.x += p.vx + Math.sin(p.t / 12); p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    rafId = pieces.length ? requestAnimationFrame(tick) : null;
  }

  /* ================= TOAST ================= */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ================= HERO : COMPTE À REBOURS ================= */
  const pad = n => String(n).padStart(2, "0");
  function updateCountdown() {
    const now = new Date();
    const diff = majority - now;
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
        ? "<strong>C'EST AUJOURD'HUI ! JOYEUX ANNIVERSAIRE ARTHUR ! 🎉</strong>"
        : `Tu es majeur depuis <strong>${fmt.format(days)}</strong> jour${days > 1 ? "s" : ""} 🏆`;
      if (!updateCountdown.celebrated) { updateCountdown.celebrated = true; setTimeout(() => confetti(260), 600); }
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  $("#heroBall").addEventListener("click", e => {
    const b = e.currentTarget;
    b.classList.remove("kick"); void b.offsetWidth; b.classList.add("kick");
    setTimeout(() => { confetti(120); toast("GOOOOOAAAAL ! ⚽"); }, 450);
  });

  /* ================= EASTER EGGS CLAVIER ================= */
  let keys = "";
  const EGGS = {
    psg: () => { confetti(300, ["#0b1640", "#e30613", "#ffffff"]); toast("ALLEZ PARIS ! 🔴🔵"); },
    arthur: () => { confetti(200, ["#f5c542", "#ffffff"]); toast("Le GOAT 🐐 c'est toi."); },
    ace: () => { confetti(150, ["#d7ff3a", "#ffffff", "#c8643b"]); toast("ACE ! 🎾 Service gagnant."); },
  };
  addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    keys = (keys + e.key.toLowerCase()).slice(-10);
    for (const k in EGGS) if (keys.endsWith(k)) { EGGS[k](); keys = ""; }
  });

  /* ================= CARTE JOUEUR ================= */
  const c = D.carte;
  $("#cardRating").textContent = c.note;
  $("#cardPos").textContent = c.poste;
  $("#cardStats").innerHTML = c.stats.map(s => `<div><b>${s.valeur}</b><span>${s.label}</span></div>`).join("");
  $("#backSports").textContent = c.sports.join(" · ");
  if (D.photoProfil) $("#cardPhoto").innerHTML = `<img src="${D.photoProfil}" alt="Arthur" />`;

  const now0 = new Date();
  let age = now0.getFullYear() - birth.getFullYear();
  if (now0 < new Date(now0.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  $("#backAge").textContent = now0 < majority ? `${age} ans (18 le 20/12 !)` : `${age} ans`;

  const card = $("#playerCard");
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  if (!reduceMotion) {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  }

  /* ================= STATS EN DIRECT ================= */
  const statEls = Object.fromEntries($$("[data-stat]").map(el => [el.dataset.stat, el]));
  let statsStart = null;
  const statsIO = new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !statsStart) { statsStart = performance.now(); statsIO.disconnect(); }
  }, { threshold: 0.3 });
  statsIO.observe($("#compteur"));
  function updateStats() {
    if (!statsStart) return;
    const p = reduceMotion ? 1 : Math.min(1, (performance.now() - statsStart) / 1800);
    const ease = 1 - Math.pow(1 - p, 4);
    const ms = (Date.now() - birth) * ease;
    const sec = ms / 1000, min = sec / 60, days = ms / 86400000;
    statEls.secondes.textContent = fmt.format(Math.floor(sec));
    statEls.jours.textContent = fmt.format(Math.floor(days));
    statEls.coeur.textContent = fmt.format(Math.floor(min * 80));
    statEls.nuits.textContent = fmt.format(Math.floor(days));
    statEls.weekends.textContent = fmt.format(Math.floor(days / 7));
    statEls.pas.textContent = fmt.format(Math.floor(days * 11000));
  }
  (function statsLoop() { updateStats(); const p = statsStart ? (performance.now() - statsStart) / 1800 : 0; p < 1 ? requestAnimationFrame(statsLoop) : setInterval(updateStats, 1000); })();

  /* ================= CARRIÈRE ================= */
  $("#timeline").innerHTML = D.carriere.map(e => `
    <li class="tl-item">
      <article class="tl-card">
        <div>
          <div class="tl-year">${e.annee}</div>
          <h3>${e.titre}</h3>
          <p>${e.texte}</p>
        </div>
        ${e.photo ? `<img class="tl-photo" src="${e.photo}" alt="${e.titre}" loading="lazy" />` : ""}
      </article>
    </li>`).join("");

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); } });
  }, { threshold: 0.2 });
  $$(".tl-item").forEach(el => io.observe(el));

  /* ================= TIRS AU BUT ================= */
  const TOTAL = 5;
  const scene = $("#pkScene"), zonesEl = $("#goalZones"), keeper = $("#keeper"), pkBall = $("#pkBall"),
        pkShadow = $("#pkShadow"), pkMsg = $("#pkMsg"), net = $("#goalNet");
  let shots = 0, goals = 0, busy = false;
  zonesEl.innerHTML = Array.from({ length: 6 }, (_, i) => `<button data-z="${i}" aria-label="Tirer ${["en haut", "en bas"][i < 3 ? 0 : 1]} ${["à gauche", "au centre", "à droite"][i % 3]}"></button>`).join("");
  $("#pkDots").innerHTML = "<i></i>".repeat(TOTAL);
  keeper.classList.add("idle");

  function pkShowMsg(text, saved) {
    pkMsg.textContent = text; pkMsg.classList.toggle("saved", saved); pkMsg.classList.add("show");
    setTimeout(() => pkMsg.classList.remove("show"), 1200);
  }
  const anim = (el, frames, opts) => el.animate(frames, { fill: "forwards", ...opts }).finished;

  zonesEl.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn || busy || shots >= TOTAL) return;
    busy = true;
    const z = +btn.dataset.z, col = z % 3, row = z < 3 ? 0 : 1;
    const kCol = (Math.random() * 3) | 0, kRow = Math.random() < 0.5 ? 0 : 1;
    const saved = kCol === col && (kRow === row || Math.random() < 0.5);

    // géométrie : du point de penalty vers le centre de la zone visée
    const sR = scene.getBoundingClientRect(), bR = btn.getBoundingClientRect(), ballR = pkBall.getBoundingClientRect();
    const tx = bR.left + bR.width * (col === 0 ? 0.4 : col === 2 ? 0.6 : 0.5) - (ballR.left + ballR.width / 2);
    const ty = bR.top + bR.height * 0.5 - (ballR.top + ballR.height / 2);
    const gR = $("#goal").getBoundingClientRect();

    // le gardien plonge (petit temps de réaction)
    setTimeout(() => {
      keeper.classList.remove("idle"); keeper.classList.add("dive");
      const dx = (kCol - 1) * gR.width * 0.3;
      const rot = kCol === 0 ? -68 : kCol === 2 ? 68 : 0;
      const dy = kRow === 0 ? -gR.height * (kCol === 1 ? 0.1 : 0.12) : (kCol === 1 ? gR.height * 0.04 : 0);
      keeper.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    }, 120);

    // le ballon part en courbe
    const curve = (Math.random() - 0.5) * 60;
    const flight = 520;
    const ballFrames = [
      { transform: "translate(0,0) scale(1) rotate(0)" },
      { transform: `translate(${tx * 0.5 + curve}px, ${ty * 0.55 - 30}px) scale(.8) rotate(300deg)`, offset: 0.5 },
      { transform: `translate(${tx}px, ${ty}px) scale(.58) rotate(600deg)` },
    ];
    anim(pkShadow, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${tx}px, ${ty * 0.15}px) scale(.5)`, opacity: .3 }], { duration: flight, easing: "ease-out" });
    await anim(pkBall, ballFrames, { duration: flight, easing: "cubic-bezier(.25,.6,.4,1)" });

    shots++;
    const dot = $$("#pkDots i")[shots - 1];
    if (saved) {
      dot.classList.add("goal-ko"); pkShowMsg("ARRÊTÉ ! 🧤", true);
      // le ballon est repoussé
      const away = col === 1 ? (Math.random() < .5 ? -1 : 1) : (col === 0 ? -1 : 1);
      anim(pkBall, [
        { transform: `translate(${tx}px, ${ty}px) scale(.58) rotate(600deg)` },
        { transform: `translate(${tx + away * sR.width * 0.35}px, ${ty + sR.height * 0.35}px) scale(.8) rotate(200deg)`, opacity: 0 },
      ], { duration: 650, easing: "ease-out" });
    } else {
      goals++; dot.classList.add("goal-ok"); pkShowMsg("BUUUT ! ⚽", false);
      net.classList.remove("hit"); void net.offsetWidth; net.classList.add("hit");
      scene.classList.add("shake", "roar"); confetti(70);
      anim(pkBall, [
        { transform: `translate(${tx}px, ${ty}px) scale(.58) rotate(600deg)` },
        { transform: `translate(${tx * 1.04}px, ${ty * 0.9}px) scale(.5) rotate(640deg)` },
      ], { duration: 300, easing: "ease-out" });
    }
    $("#pkShots").textContent = `${shots}/${TOTAL}`;
    $("#pkGoals").textContent = goals;

    setTimeout(() => {
      scene.classList.remove("shake", "roar");
      keeper.classList.remove("dive"); keeper.style.transform = ""; keeper.classList.add("idle");
      pkBall.getAnimations().forEach(a => a.cancel()); pkShadow.getAnimations().forEach(a => a.cancel());
      anim(pkBall, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 250 });
      busy = false;
      if (shots >= TOTAL) pkEnd();
    }, 1500);
  });
  function pkEnd() {
    $$("button", zonesEl).forEach(b => (b.disabled = true));
    const verdict = goals === 5 ? "5/5, Ballon d'Or direct ! 🏆" : goals >= 3 ? `${goals}/5 — Qualifié, champion !` : `${goals}/5… même les légendes ratent, rejoue ! 😏`;
    toast(verdict);
    if (goals >= 4) confetti(220);
    if (goals >= 3) keeper.classList.add("sad"); // le gardien fait la tête
    $("#pkReset").hidden = false;
  }
  $("#pkReset").addEventListener("click", () => {
    shots = goals = 0;
    $("#pkShots").textContent = `0/${TOTAL}`; $("#pkGoals").textContent = "0";
    $$("#pkDots i").forEach(d => (d.className = ""));
    $$("button", zonesEl).forEach(b => (b.disabled = false));
    keeper.classList.remove("sad");
    $("#pkReset").hidden = true;
  });

  /* ================= QUIZ TENNIS ================= */
  const POINTS = ["0", "15", "30", "40", "JEU", "SET", "MATCH"];
  let qi = 0, qOk = 0, qKo = 0;
  const quizCard = $("#quizCard");
  const tennisScore = n => POINTS[Math.min(n, POINTS.length - 1)];
  function renderQuestion() {
    $("#qScore").textContent = tennisScore(qOk);
    $("#qScoreA").textContent = tennisScore(qKo);
    if (qi >= D.quiz.length) return renderQuizEnd();
    const q = D.quiz[qi];
    quizCard.innerHTML = `
      <div class="quiz__num">Question ${qi + 1} / ${D.quiz.length}</div>
      <p class="quiz__q">${q.q}</p>
      <div class="quiz__choices">${q.choix.map((ch, i) => `<button data-i="${i}">${ch}</button>`).join("")}</div>`;
  }
  quizCard.addEventListener("click", e => {
    const btn = e.target.closest(".quiz__choices button");
    if (btn) {
      const q = D.quiz[qi], i = +btn.dataset.i;
      $$(".quiz__choices button", quizCard).forEach(b => (b.disabled = true));
      if (i === q.bonne) { qOk++; btn.classList.add("ok"); confetti(40, ["#d7ff3a", "#ffffff"]); }
      else { qKo++; btn.classList.add("ko"); $$(".quiz__choices button", quizCard)[q.bonne].classList.add("ok"); }
      qi++;
      setTimeout(renderQuestion, 1100);
    }
    if (e.target.closest("#quizRestart")) { qi = qOk = qKo = 0; renderQuestion(); }
  });
  function renderQuizEnd() {
    const n = D.quiz.length;
    const [title, txt] = qOk === n ? ["JEU, SET ET MATCH !", "Sans faute. Tu connais Arthur par cœur. 🏆"]
      : qOk >= n / 2 ? ["BEAU MATCH !", `${qOk}/${n} — pas mal du tout, mais Arthur a sauvé quelques balles de break.`]
      : ["DOUBLE FAUTE…", `${qOk}/${n} — il va falloir passer plus de temps avec Arthur 😅`];
    quizCard.innerHTML = `<div class="quiz__end"><h3>${title}</h3><p>${txt}</p><button class="btn" id="quizRestart">Revanche</button></div>`;
    if (qOk === n) confetti(250);
  }
  renderQuestion();

  /* ================= GALERIE ================= */
  const rot = () => `${(Math.random() * 8 - 4).toFixed(1)}deg`;
  const gallery = $("#gallery");
  const photos = D.photos.length ? D.photos : Array.from({ length: D.nbEmplacementsVides }, () => null);
  gallery.innerHTML = photos.map((p, i) => p
    ? `<button class="polaroid" style="--r:${rot()}" data-i="${i}"><img src="${p.src}" alt="${p.legende || "Photo d'Arthur"}" loading="lazy" /><figcaption>${p.legende || ""}</figcaption></button>`
    : `<figure class="polaroid" style="--r:${rot()}"><div class="ph"><div><span>📸</span>Photo à venir</div></div><figcaption>Souvenir n°${i + 1}</figcaption></figure>`
  ).join("");
  const lb = $("#lightbox");
  gallery.addEventListener("click", e => {
    const b = e.target.closest("button.polaroid");
    if (!b) return;
    const p = D.photos[+b.dataset.i];
    $("#lightboxImg").src = p.src; $("#lightboxImg").alt = p.legende || "";
    $("#lightboxCap").textContent = p.legende || "";
    lb.hidden = false;
  });
  lb.addEventListener("click", e => { if (e.target === lb || e.target.closest(".lightbox__close")) lb.hidden = true; });
  addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });

  /* ================= MUR DES SUPPORTERS ================= */
  const NOTE_COLORS = ["#fff7a8", "#ffd1dc", "#c9f0ff", "#d7ffcf", "#ffe0b8"];
  $("#wall").innerHTML = D.messages.map((m, i) => `
    <blockquote class="note" style="--r:${rot()};--c:${NOTE_COLORS[i % NOTE_COLORS.length]}">
      <p>${m.texte}</p><cite>— ${m.auteur}</cite>
    </blockquote>`).join("");

  /* ================= MINUTE DE MATCH + BARRE DE PROGRESSION ================= */
  const minuteEl = $("#matchMinute"), progressEl = $("#progress");
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    progressEl.style.width = p * 100 + "%";
    const m = Math.round(p * 93);
    minuteEl.textContent = m <= 90 ? `${m}'` : `90+${m - 90}'`;
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ================= FLASHS PHOTO DANS LES TRIBUNES ================= */
  $("#flashes").innerHTML = Array.from({ length: 26 }, () =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--d:${(3 + Math.random() * 5).toFixed(1)}s;--delay:-${(Math.random() * 8).toFixed(1)}s"></i>`).join("");

  /* ================= BANDEAU LED ================= */
  const tickerItems = ["JOYEUX ANNIVERSAIRE ARTHUR", "⚽", "18 ANS", "🎾", "20.12.2008", "🔴🔵", "LE MEILLEUR RESTE À JOUER", "🏆"];
  const tickerHTML = tickerItems.map(t => `<span>${t}</span>`).join("");
  $("#ticker").innerHTML = tickerHTML + tickerHTML;

  /* ================= APPARITION AU DÉFILEMENT ================= */
  const revealEls = $$(".section__title, .section__lead, .card-wrap, .stats-grid, .penalty, .quiz, .gallery, .wall, .cake-zone");
  revealEls.forEach(el => el.classList.add("reveal"));
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("visible"); revealIO.unobserve(en.target); }
  }), { threshold: 0.12 });
  revealEls.forEach(el => revealIO.observe(el));

  /* ================= BOUGIES ================= */
  const candlesEl = $("#candles");
  candlesEl.innerHTML = Array.from({ length: 18 }, (_, i) => `<button class="candle" aria-label="Bougie ${i + 1}"><span class="flame"></span></button>`).join("");
  const candles = $$(".candle", candlesEl);
  const lit = () => candles.filter(c => !c.classList.contains("out"));
  function blow(c) {
    if (c.classList.contains("out")) return;
    c.classList.add("out");
    if (!lit().length) allOut();
  }
  function allOut() {
    stopMic();
    $("#cakeWish").textContent = "Fais un vœu, Arthur… ✨";
    confetti(320);
    $("#relight").hidden = false;
  }
  candlesEl.addEventListener("click", e => { const c = e.target.closest(".candle"); if (c) blow(c); });
  $("#blowAll").addEventListener("click", () => {
    lit().forEach((c, i) => setTimeout(() => blow(c), i * 70 + Math.random() * 60));
  });
  $("#relight").addEventListener("click", () => {
    candles.forEach((c, i) => setTimeout(() => c.classList.remove("out"), i * 50));
    $("#cakeWish").textContent = ""; $("#relight").hidden = true;
  });

  // souffler dans le micro (le son n'est jamais enregistré, juste mesuré en direct)
  let micStream = null, micRaf = null;
  function stopMic() {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    micStream = null; cancelAnimationFrame(micRaf);
    $("#blowMic").classList.remove("listening"); $("#blowMic").textContent = "🎤 Souffler dans le micro";
  }
  $("#blowMic").addEventListener("click", async () => {
    if (micStream) return stopMic();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { toast("Micro indisponible — clique sur les bougies 😉"); return; }
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const an = ac.createAnalyser(); an.fftSize = 512;
    ac.createMediaStreamSource(micStream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    $("#blowMic").classList.add("listening"); $("#blowMic").textContent = "🎤 Souffle fort !";
    let last = 0;
    (function listen(t) {
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
      const rms = Math.sqrt(sum / buf.length);
      if (rms > 18 && t - last > 90) { last = t; const l = lit(); if (l.length) blow(l[(Math.random() * l.length) | 0]); }
      if (micStream) micRaf = requestAnimationFrame(listen); else ac.close();
    })(0);
  });

  /* ================= NAV ACTIVE ================= */
  const navLinks = $$(".scorebar__nav a");
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => navIO.observe(s));
})();
