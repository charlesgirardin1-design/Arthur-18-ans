/* =====================================================================
   ARTHUR · 18 ANS — MOTION
   Couche transversale : raccords entre sections, titres animés,
   ambiance « stade de nuit » (projecteurs, paillettes), curseur ballon,
   ancres propres. Un seul requestAnimationFrame partagé, en pause quand
   l'onglet est caché. Aucune librairie.
   ===================================================================== */
(() => {
  "use strict";

  const doc = document.documentElement;
  const mq = q => window.matchMedia(q).matches;
  const reduce = mq("(prefers-reduced-motion: reduce)");
  const finePointer = mq("(hover: hover) and (pointer: fine)");
  doc.classList.add("mx");
  if (reduce) doc.classList.add("mx-reduce");

  /* ---------------------------------------------------------------
     BOUCLE PARTAGÉE
     --------------------------------------------------------------- */
  const tasks = new Set();
  let raf = 0;
  let scrollY = window.scrollY, vh = window.innerHeight, vw = window.innerWidth;

  function tick(t) {
    raf = 0;
    tasks.forEach(fn => fn(t));
    if (tasks.size && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function wake() { if (!raf && tasks.size && !document.hidden) raf = requestAnimationFrame(tick); }
  function addTask(fn) { tasks.add(fn); wake(); }
  function removeTask(fn) { tasks.delete(fn); }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake();
  });
  window.addEventListener("scroll", () => { scrollY = window.scrollY; wake(); }, { passive: true });
  window.addEventListener("resize", () => { vh = window.innerHeight; vw = window.innerWidth; }, { passive: true });

  const el = (tag, cls, attrs) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------------------------------------------------------
     1. TITRES DE SECTION
     --------------------------------------------------------------- */
  function splitTitle(h) {
    if (h.dataset.mxSplit) return;
    h.dataset.mxSplit = "1";
    // on ne découpe que du texte brut ; sinon simple révélation par masque
    const onlyText = Array.from(h.childNodes).every(n => n.nodeType === 3 || (n.nodeType === 1 && n.tagName === "BR"));
    const text = h.textContent.replace(/\s+/g, " ").trim();
    if (!onlyText || !text) { h.classList.add("mx-title--block"); return; }

    const sr = el("span", "mx-sr");
    sr.textContent = text;
    const vis = el("span", "mx-split", { "aria-hidden": "true" });
    let i = 0;
    text.split(" ").forEach((word, wi, arr) => {
      const w = el("span", "mx-w");
      for (const ch of word) {
        const c = el("span", "mx-c");
        c.textContent = ch;
        c.style.setProperty("--i", i++);
        w.appendChild(c);
      }
      vis.appendChild(w);
      if (wi < arr.length - 1) { vis.appendChild(document.createTextNode(" ")); i++; }
    });
    h.replaceChildren(sr, vis);
  }

  function countUp(num) {
    const final = num.textContent.trim();
    const target = parseInt(final, 10);
    if (reduce || !Number.isFinite(target) || target <= 0) return;
    const width = final.length;
    const t0 = performance.now(), dur = 520 + target * 30;
    num.textContent = "0".padStart(width, "0");
    const step = t => {
      const p = clamp((t - t0) / dur, 0, 1);
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      num.textContent = String(v).padStart(width, "0");
      if (p >= 1) { num.textContent = final; removeTask(step); }
    };
    addTask(step);
  }

  function prepareHeaders() {
    const heads = document.querySelectorAll(".sh");
    heads.forEach(sh => {
      sh.classList.add("mx-sh");
      const title = sh.querySelector(".sh__title");
      if (title) splitTitle(title);
      const meta = sh.querySelector(".sh__meta");
      if (meta && !meta.querySelector(".mx-rule")) meta.appendChild(el("span", "mx-rule", { "aria-hidden": "true" }));
    });
    if (reduce || !("IntersectionObserver" in window)) {
      heads.forEach(sh => sh.classList.add("mx-in"));
      return;
    }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const sh = en.target;
      io.unobserve(sh);
      sh.classList.add("mx-in");
      const num = sh.querySelector(".sh__num");
      if (num) countUp(num);
    }), { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
    heads.forEach(sh => io.observe(sh));
  }

  /* ---------------------------------------------------------------
     2. RACCORDS ENTRE SECTIONS : la ligne médiane du match
     --------------------------------------------------------------- */
  const seams = [];
  function buildSeams() {
    const main = document.querySelector("main");
    if (!main) return;
    const blocks = Array.from(main.children).filter(n => n.matches("section"));
    const finale = document.querySelector("footer.finale, #finale");
    if (finale) blocks.push(finale);
    blocks.slice(1).forEach((sec, i) => {
      const prev = blocks[i];
      // le hero se termine déjà par son bandeau défilant : pas de raccord en plus
      if (prev.id === "accueil" || prev.classList.contains("hero")) return;
      if (sec.previousElementSibling && sec.previousElementSibling.classList.contains("mx-seam")) return;
      const s = el("div", "mx-seam", { "aria-hidden": "true" });
      s.innerHTML =
        '<span class="mx-seam__fade"></span>' +
        '<span class="mx-seam__line"></span>' +
        '<span class="mx-seam__flare"></span>' +
        '<span class="mx-seam__circle"></span>' +
        '<span class="mx-seam__tag"></span>';
      s._tag = s.lastChild;
      s._final = sec === finale;
      sec.parentNode.insertBefore(s, sec);
      seams.push(s);
    });
    labelSeams();
    if (reduce || !("IntersectionObserver" in window)) { seams.forEach(s => s.classList.add("mx-in")); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("mx-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -18% 0px" });
    seams.forEach(s => io.observe(s));
  }

  // la minute affichée correspond à celle du chrono de la barre quand le raccord arrive en haut
  function labelSeams() {
    if (!seams.length) return;
    const max = doc.scrollHeight - vh;
    let halfDone = false;
    seams.forEach(s => {
      const top = s.getBoundingClientRect().top + window.scrollY;
      const p = max > 0 ? clamp((top - 70) / max, 0, 1) : 0;
      const m = Math.min(90, Math.round(p * 93));
      let label = m + "'", mod = "";
      if (s._final) { label = "90'"; mod = "final"; }
      else if (!halfDone && m >= 42) { label = "Mi-temps"; mod = "half"; halfDone = true; }
      if (s._tag.textContent !== label) s._tag.textContent = label;
      s.dataset.mod = mod;
    });
  }

  /* ---------------------------------------------------------------
     3. AMBIANCE : projecteurs + paillettes
     --------------------------------------------------------------- */
  function buildStage() {
    const stage = el("div", "mx-stage", { "aria-hidden": "true" });
    const fade = el("div", "mx-stage__fade");
    const beams = [
      { cls: "mx-beam mx-beam--l", phase: 0, amp: 7, k: 0.00055 },
      { cls: "mx-beam mx-beam--r", phase: 2.1, amp: 6, k: 0.00047 },
      { cls: "mx-beam mx-beam--c", phase: 4.2, amp: 10, k: 0.00038 },
    ].map(b => { const n = el("span", b.cls); fade.appendChild(n); return Object.assign(b, { n }); });

    const count = reduce ? 0 : (finePointer ? 16 : 7);
    const sparks = [];
    for (let i = 0; i < count; i++) {
      const n = el("span", "mx-spark" + (i % 5 === 0 ? " mx-spark--red" : i % 3 === 0 ? " mx-spark--white" : ""));
      fade.appendChild(n);
      sparks.push({
        n,
        x: Math.random(),             // position relative (0..1)
        y: Math.random(),
        depth: 0.15 + Math.random() * 0.55,
        drift: (Math.random() - 0.5) * 0.000012,
        rise: 0.000006 + Math.random() * 0.000012,
        tw: 0.0006 + Math.random() * 0.0012,
        ph: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 0.9,
      });
    }
    stage.appendChild(fade);
    document.body.insertBefore(stage, document.body.firstChild);

    if (reduce) { fade.style.opacity = "0.7"; return; }

    let lastT = performance.now();
    const ambient = t => {
      const dt = Math.min(64, t - lastT); lastT = t;
      // apparition après le hero, discrète partout ailleurs
      const heroFade = clamp((scrollY - vh * 0.25) / (vh * 0.6), 0, 1);
      fade.style.opacity = (0.25 + heroFade * 0.75).toFixed(3);

      beams.forEach(b => {
        const sway = Math.sin(scrollY * b.k * 6 + b.phase + t * 0.00012) * b.amp;
        const y = -((scrollY * 0.06) % (vh * 0.25));
        b.n.style.transform = `translate3d(${sway.toFixed(2)}vw, ${y.toFixed(1)}px, 0) rotate(${(sway * 0.6).toFixed(2)}deg)`;
      });

      for (const p of sparks) {
        p.x += p.drift * dt;
        p.y -= p.rise * dt;
        if (p.x < -0.02) p.x += 1.04; else if (p.x > 1.02) p.x -= 1.04;
        // parallaxe : les paillettes proches défilent plus vite
        let yy = (p.y - (scrollY * p.depth) / vh) % 1;
        if (yy < 0) yy += 1;
        const tw = 0.5 + 0.5 * Math.sin(t * p.tw + p.ph);
        const op = Math.pow(tw, 3) * (0.35 + p.depth);
        p.n.style.transform = `translate3d(${(p.x * vw).toFixed(1)}px, ${(yy * vh).toFixed(1)}px, 0) scale(${(p.s * (0.6 + tw * 0.5)).toFixed(3)})`;
        p.n.style.opacity = op.toFixed(3);
      }
    };
    addTask(ambient);
  }

  /* ---------------------------------------------------------------
     4. CURSEUR : petit ballon qui suit (desktop uniquement)
     --------------------------------------------------------------- */
  function buildCursor() {
    if (reduce || !finePointer) return;
    const c = el("div", "mx-cursor", { "aria-hidden": "true" });
    c.innerHTML =
      '<span class="mx-cursor__ball"><svg viewBox="0 0 32 32">' +
      '<defs><radialGradient id="mxBallG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e4e8f4"/><stop offset="1" stop-color="#9aa3c7"/></radialGradient></defs>' +
      '<circle cx="16" cy="16" r="15" fill="url(#mxBallG)"/>' +
      '<g fill="#0b1640"><polygon points="16,9.5 21.6,13.6 19.5,20.2 12.5,20.2 10.4,13.6"/>' +
      '<path d="M16 1 L19 4 L13 4 Z M30.4 11.6 L27.6 15.3 L26.8 9.6 Z M24.8 28.6 L20 28.2 L24.6 24.6 Z M7.2 28.6 L7.4 24.6 L12 28.2 Z M1.6 11.6 L5.2 9.6 L4.4 15.3 Z"/></g>' +
      '<circle cx="16" cy="16" r="15" fill="none" stroke="#0b1640" stroke-opacity=".35"/></svg></span>';
    document.body.appendChild(c);
    const ball = c.firstChild;

    let tx = -100, ty = -100, x = -100, y = -100, rot = 0, shown = false, hot = false, hidden = false;
    const HIDE = "canvas, .goal, .goal__zones, .scratch, .juggle, .film__strip, input, textarea, select, iframe, .lightbox";
    const HOT = "a, button, [role='button'], label, summary, .frame, [data-hot]";

    window.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; x = tx; y = ty; c.classList.add("is-on"); }
      const tg = e.target instanceof Element ? e.target : null;
      const nh = !!(tg && tg.closest(HIDE));
      const nhot = !nh && !!(tg && tg.closest(HOT));
      if (nh !== hidden) { hidden = nh; c.classList.toggle("is-hidden", nh); }
      if (nhot !== hot) { hot = nhot; c.classList.toggle("is-hot", nhot); }
      wake();
    }, { passive: true });
    document.addEventListener("pointerleave", () => { shown = false; c.classList.remove("is-on"); });
    window.addEventListener("blur", () => { shown = false; c.classList.remove("is-on"); });
    window.addEventListener("pointerdown", () => { c.classList.remove("is-kick"); void c.offsetWidth; c.classList.add("is-kick"); }, { passive: true });

    addTask(() => {
      if (!shown) return;
      const dx = tx - x, dy = ty - y;
      x += dx * 0.2; y += dy * 0.2;
      rot += (dx + dy) * 0.6;
      c.style.transform = `translate3d(${(x + 14).toFixed(1)}px, ${(y + 16).toFixed(1)}px, 0)`;
      ball.style.transform = `rotate(${rot.toFixed(1)}deg)`;
    });
  }

  /* ---------------------------------------------------------------
     5. ANCRES : focus accessible + section courante dans le menu
     --------------------------------------------------------------- */
  function anchors() {
    document.addEventListener("click", e => {
      const a = e.target instanceof Element && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const id = decodeURIComponent(a.getAttribute("href").slice(1));
      const target = id && document.getElementById(id);
      if (!target) return;
      // après le défilement, on place le focus sur la section (lecteurs d'écran, clavier)
      const focus = () => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      };
      if ("onscrollend" in window && !reduce) {
        let done = false;
        const fin = () => { if (done) return; done = true; window.removeEventListener("scrollend", fin); focus(); };
        window.addEventListener("scrollend", fin);
        setTimeout(fin, 1600);
      } else setTimeout(focus, reduce ? 0 : 700);
    });

    if (!("IntersectionObserver" in window)) return;
    const secs = document.querySelectorAll("[data-menu][id]");
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      document.querySelectorAll("#menuList a, .menu a").forEach(a => {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "location");
        else if (a.getAttribute("aria-current") === "location") a.removeAttribute("aria-current");
      });
    }), { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(s => io.observe(s));
  }

  /* ---------------------------------------------------------------
     DÉMARRAGE (après main.js, qui remplit le contenu)
     --------------------------------------------------------------- */
  function init() {
    try { prepareHeaders(); } catch (e) { console.warn("[motion] titres", e); }
    try { buildSeams(); } catch (e) { console.warn("[motion] raccords", e); }
    try { buildStage(); } catch (e) { console.warn("[motion] ambiance", e); }
    try { buildCursor(); } catch (e) { console.warn("[motion] curseur", e); }
    try { anchors(); } catch (e) { console.warn("[motion] ancres", e); }
    // les images changent la hauteur de page : on recale les minutes des raccords
    let rl = 0;
    const relabel = () => { clearTimeout(rl); rl = setTimeout(labelSeams, 200); };
    window.addEventListener("load", relabel);
    window.addEventListener("resize", relabel, { passive: true });
    if ("ResizeObserver" in window && document.querySelector("main")) new ResizeObserver(relabel).observe(document.querySelector("main"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
