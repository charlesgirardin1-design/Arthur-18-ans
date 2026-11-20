/* =====================================================================
   PERFORMANCES — chargé avant les autres scripts
   1. Mode « léger » automatique sur les appareils modestes (ou si la
      cadence mesurée est basse) : html.perf-lite → effets coûteux retirés.
   2. Les sections hors de l'écran sont marquées .is-off : leurs
      animations CSS sont mises en pause (voir css/perf.css), et
      PERF.visible(el) permet aux boucles JS de s'arrêter.
   ===================================================================== */
window.PERF = (() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const save = navigator.connection && navigator.connection.saveData;
  let lite = params.has("lite") || save || cores <= 4 || mem <= 3;
  if (params.has("full")) lite = false;
  const setLite = v => { lite = v; root.classList.toggle("perf-lite", v); };
  setLite(lite);

  // mesure réelle de la cadence pendant 2 s après l'affichage : < 40 i/s → mode léger
  if (!lite && !params.has("full")) {
    let n = 0, t0 = 0;
    const probe = t => {
      if (!t0) t0 = t;
      n++;
      if (t - t0 < 2000) requestAnimationFrame(probe);
      else if (n / ((t - t0) / 1000) < 40) setLite(true);
    };
    addEventListener("load", () => setTimeout(() => requestAnimationFrame(probe), 1500), { once: true });
  }

  // sections hors écran : pause des animations
  const vis = new WeakMap();
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    vis.set(e.target, e.isIntersecting);
    e.target.classList.toggle("is-off", !e.isIntersecting);
  }), { rootMargin: "300px 0px" });
  const watch = () => document.querySelectorAll("main > section, footer.finale, .hero").forEach(s => io.observe(s));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();

  return {
    get lite() { return lite; },
    // vrai si l'élément (ou sa section) est à l'écran
    visible(el) {
      const s = el && (el.closest ? el.closest("main > section, footer.finale, .hero") : null);
      return s ? vis.get(s) !== false : true;
    },
  };
})();
