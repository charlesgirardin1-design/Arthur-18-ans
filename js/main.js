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
  function updateStats() {
    const ms = Date.now() - birth;
    const sec = ms / 1000, min = sec / 60, days = ms / 86400000;
    statEls.secondes.textContent = fmt.format(Math.floor(sec));
    statEls.jours.textContent = fmt.format(Math.floor(days));
    statEls.coeur.textContent = fmt.format(Math.floor(min * 80));
    statEls.nuits.textContent = fmt.format(Math.floor(days));
    statEls.weekends.textContent = fmt.format(Math.floor(days / 7));
    statEls.pas.textContent = fmt.format(Math.floor(days * 11000));
  }
  updateStats(); setInterval(updateStats, 1000);

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
  const zonesEl = $("#goalZones"), keeper = $("#keeper"), pkBall = $("#pkBall"), pkMsg = $("#pkMsg"), goal = $("#goal");
  let shots = 0, goals = 0, busy = false;
  const ZONE_X = [16.7, 50, 83.3];
  zonesEl.innerHTML = Array.from({ length: 6 }, (_, i) => `<button data-z="${i}" aria-label="Tirer zone ${i + 1}"></button>`).join("");
  $("#pkDots").innerHTML = "<i></i>".repeat(TOTAL);

  function pkShowMsg(text) {
    pkMsg.textContent = text; pkMsg.classList.add("show");
    setTimeout(() => pkMsg.classList.remove("show"), 1100);
  }
  function pkResetPositions() {
    pkBall.style.left = "50%"; pkBall.style.bottom = "-14%"; pkBall.style.transform = "";
    keeper.style.transform = "";
  }
  zonesEl.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn || busy || shots >= TOTAL) return;
    busy = true;
    const z = +btn.dataset.z, col = z % 3, top = z < 3;
    const kCol = (Math.random() * 3) | 0;
    const kTop = Math.random() < 0.5;
    // le gardien plonge
    const dx = (kCol - 1) * 150;
    const rot = kCol === 0 ? -55 : kCol === 2 ? 55 : 0;
    keeper.style.transform = `translateX(${dx}%) translateY(${kTop && kCol !== 1 ? -12 : 0}%) rotate(${rot}deg)`;
    // le ballon part
    pkBall.style.left = ZONE_X[col] + "%";
    pkBall.style.bottom = top ? "62%" : "14%";
    pkBall.style.transform = "scale(.7) rotate(540deg)";

    const saved = kCol === col;
    shots++;
    setTimeout(() => {
      const dot = $$("#pkDots i")[shots - 1];
      if (saved) { dot.classList.add("goal-ko"); pkShowMsg("ARRÊTÉ ! 🧤"); }
      else { goals++; dot.classList.add("goal-ok"); pkShowMsg("BUUUT ! ⚽"); goal.classList.add("shake"); confetti(60); }
      $("#pkShots").textContent = `${shots}/${TOTAL}`;
      $("#pkGoals").textContent = goals;
      setTimeout(() => {
        goal.classList.remove("shake");
        pkResetPositions(); busy = false;
        if (shots >= TOTAL) pkEnd();
      }, 1200);
    }, 500);
  });
  function pkEnd() {
    $$("button", zonesEl).forEach(b => (b.disabled = true));
    const verdict = goals === 5 ? "5/5, Ballon d'Or direct ! 🏆" : goals >= 3 ? `${goals}/5 — Qualifié, champion !` : `${goals}/5… même les légendes ratent, rejoue ! 😏`;
    toast(verdict);
    if (goals >= 4) confetti(220);
    $("#pkReset").hidden = false;
  }
  $("#pkReset").addEventListener("click", () => {
    shots = goals = 0;
    $("#pkShots").textContent = `0/${TOTAL}`; $("#pkGoals").textContent = "0";
    $$("#pkDots i").forEach(d => (d.className = ""));
    $$("button", zonesEl).forEach(b => (b.disabled = false));
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

  /* ================= NAV ACTIVE ================= */
  const navLinks = $$(".scorebar__nav a");
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => navIO.observe(s));
})();
