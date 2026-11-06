/* =====================================================================
   VERROU DU SITE (exécuté par Vercel, côté serveur, avant chaque requête)

   Tant que l'heure d'ouverture n'est pas atteinte (heure du serveur) :
   - l'accueil affiche uniquement la page d'attente (« Le match n'a pas
     encore commencé ») avec un compte à rebours synchronisé sur le serveur ;
   - tout le reste du site (photos, textes, scripts) est inaccessible ;
   - un lien d'aperçu secret (?apercu=CLÉ) permet aux parents de voir le
     site. Seule l'empreinte SHA-256 de la clé figure ici, pas la clé.

   À l'heure d'ouverture, le site s'ouvre tout seul, pour tout le monde.
   ===================================================================== */

// ⬇️ RÉGLAGES
const VERROU_ACTIF = true;
const OUVERTURE = "2026-12-20T00:00:00+01:00"; // heure de Paris — à remplacer par l'heure exacte de naissance
// ⬆️ RÉGLAGES

const APERCU_SHA256 = "abb2df2d6038f0b0998f17ffd6b480265cb0e78b55819e77a8d4e01d61b8776a";

const T_OUVERTURE = Date.parse(OUVERTURE);
const COOKIE = "apercu";

export const config = { matcher: "/:path*" };

const continuer = (headers = {}) => new Response(null, { headers: { "x-middleware-next": "1", ...headers } });

async function sha256(texte) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const maintenant = Date.now();
  const ouvert = !VERROU_ACTIF || maintenant >= T_OUVERTURE;

  // horloge du serveur, pour synchroniser le compte à rebours
  if (url.pathname === "/__heure") {
    return new Response(JSON.stringify({ maintenant, ouverture: T_OUVERTURE, ouvert }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  if (ouvert) return continuer();

  // accès aperçu pour les parents
  const essai = url.searchParams.get("apercu");
  if (essai && (await sha256(essai)) === APERCU_SHA256) {
    url.searchParams.delete("apercu");
    return new Response(null, {
      status: 302,
      headers: {
        location: url.pathname + (url.search || ""),
        "set-cookie": `${COOKIE}=${essai}; Path=/; Max-Age=${60 * 60 * 24 * 120}; HttpOnly; Secure; SameSite=Lax`,
        "cache-control": "no-store",
      },
    });
  }
  const cookie = (request.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  if (cookie && (await sha256(cookie.slice(COOKIE.length + 1))) === APERCU_SHA256) return continuer({ "cache-control": "no-store" });

  // tout le monde d'autre : page d'attente uniquement
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(PAGE_ATTENTE, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }
  return new Response("Le match n'a pas encore commencé.", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

const PAGE_ATTENTE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Arthur · 18 ans</title>
<meta name="robots" content="noindex" />
<meta name="theme-color" content="#050a22" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
<style>
  :root { --red: #e30613; --navy: #0b1640; --muted: #9aa3c7; --gold: #ffdf5a; --display: "Bebas Neue", Impact, sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: Inter, system-ui, sans-serif; color: #fff; background: #000; overflow: hidden; -webkit-font-smoothing: antialiased; }
  .scene { position: fixed; inset: 0; display: grid; place-items: center; text-align: center; padding: 1.5rem;
    background: radial-gradient(ellipse at 50% 50%, #1a2a6e 0%, #050a22 45%, #000 100%); }
  .tunnel { position: absolute; inset: 0; overflow: hidden; }
  .tunnel::after { content: ""; position: absolute; left: 50%; top: 50%; width: 40vmin; height: 26vmin; translate: -50% -50%;
    background: radial-gradient(ellipse, rgba(255,255,255,.9), rgba(160,200,255,.35) 40%, transparent 70%); filter: blur(10px); animation: glow 3s ease-in-out infinite alternate; }
  .tunnel i { position: absolute; left: 50%; top: 50%; width: 60vmin; height: 40vmin; translate: -50% -50%; opacity: 0;
    border: 2px solid rgba(255,255,255,.14); border-radius: 30% 30% 4px 4px / 40% 40% 4px 4px; animation: tunnel 4.8s linear infinite; }
  .tunnel i:nth-child(2) { animation-delay: -.8s; } .tunnel i:nth-child(3) { animation-delay: -1.6s; } .tunnel i:nth-child(4) { animation-delay: -2.4s; }
  .tunnel i:nth-child(5) { animation-delay: -3.2s; } .tunnel i:nth-child(6) { animation-delay: -4s; }
  @keyframes tunnel { 0% { transform: scale(.15); opacity: 0; } 20% { opacity: 1; } 100% { transform: scale(3.2); opacity: 0; } }
  @keyframes glow { to { opacity: .6; transform: scale(1.15); } }
  .content { position: relative; z-index: 2; display: grid; gap: .8rem; justify-items: center; }
  .line { font-family: var(--display); letter-spacing: .32em; color: var(--muted); font-size: clamp(1rem, 3vw, 1.3rem); opacity: 0; transform: translateY(16px); animation: up .9s cubic-bezier(.16,1,.3,1) var(--d, 0s) forwards; }
  .big { font-size: clamp(3rem, 12vw, 7.5rem); letter-spacing: .03em; color: #fff; line-height: .95; text-shadow: 0 0 40px rgba(120,160,255,.5); }
  @keyframes up { to { opacity: 1; transform: none; } }
  .btn { margin-top: 1.4rem; display: inline-flex; align-items: center; gap: .5rem; background: var(--red); color: #fff; border: 0; padding: 1.05rem 2rem; border-radius: 999px;
    font: 800 1.15rem Inter, system-ui, sans-serif; cursor: pointer; box-shadow: 0 6px 0 #9c0410, 0 12px 24px rgba(227,6,19,.25); transition: transform .12s, box-shadow .12s; }
  .btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #9c0410; }
  .btn.shake { animation: shake .45s; }
  @keyframes shake { 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(4px); } }
  .wait { margin-top: 1.2rem; display: grid; gap: .9rem; justify-items: center; max-height: 0; opacity: 0; overflow: hidden; transition: max-height .8s cubic-bezier(.16,1,.3,1), opacity .6s; }
  .wait.show { max-height: 420px; opacity: 1; }
  .wait h2 { font-family: var(--display); font-weight: 400; font-size: clamp(1.8rem, 6vw, 2.8rem); letter-spacing: .04em; line-height: 1; }
  .wait h2 b { font-weight: 400; color: var(--red); }
  .board { display: flex; gap: .5rem; justify-content: center; }
  .board div { background: #070707; border: 1px solid #2c2c2c; border-radius: 10px; padding: .55rem .3rem .45rem; min-width: 70px; box-shadow: inset 0 0 22px rgba(0,0,0,.9), 0 10px 30px rgba(0,0,0,.4); }
  .board b { display: block; font-family: var(--display); font-weight: 400; font-size: clamp(2rem, 8vw, 2.7rem); line-height: 1; color: var(--gold); text-shadow: 0 0 14px rgba(255,223,90,.55); font-variant-numeric: tabular-nums; }
  .board small { color: var(--muted); font-size: .64rem; text-transform: uppercase; letter-spacing: .14em; }
  .ms { font-family: var(--display); letter-spacing: .2em; color: var(--muted); min-height: 1.3em; }
  .note { color: #c9d0ef; max-width: 34ch; font-size: .95rem; }
  .flash { position: fixed; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 5; }
  .flash.go { animation: flash 1.2s ease-out forwards; }
  @keyframes flash { 15% { opacity: 1; } 100% { opacity: 1; } }
  @media (max-width: 420px) { .board div { min-width: 62px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
</style>
</head>
<body>
  <main class="scene">
    <div class="tunnel" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="content">
      <p class="line" style="--d:.3s">20 décembre 2026</p>
      <h1 class="line big" style="--d:1.1s">Le match de ta vie</h1>
      <p class="line" style="--d:1.9s">Les joueurs entrent sur le terrain…</p>
      <div class="line" style="--d:2.6s; letter-spacing: normal">
        <button class="btn" id="enter" type="button">Entrer sur le terrain</button>
      </div>
      <section class="wait" id="wait" aria-live="polite">
        <h2>Le match n'a <b>pas encore commencé</b></h2>
        <div class="board">
          <div><b id="d">--</b><small>jours</small></div>
          <div><b id="h">--</b><small>heures</small></div>
          <div><b id="m">--</b><small>min</small></div>
          <div><b id="s">--</b><small>sec</small></div>
        </div>
        <p class="ms" id="ms"></p>
        <p class="note">Patience, champion. Le terrain s'ouvrira tout seul à la seconde près : laisse cette page ouverte.</p>
      </section>
    </div>
  </main>
  <div class="flash" id="flash"></div>
<script>
(function () {
  "use strict";
  var ouverture = ${T_OUVERTURE};
  var decalage = 0;            // heure serveur - heure de l'appareil (ms)
  var ouvertureLancee = false;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function maintenant() { return Date.now() + decalage; }

  // synchronisation sur l'horloge du serveur (meilleur de 4 mesures)
  function mesurer() {
    var t0 = performance.now(), d0 = Date.now();
    return fetch("/__heure", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      var rtt = performance.now() - t0;
      return { rtt: rtt, decalage: j.maintenant + rtt / 2 - (d0 + rtt), ouverture: j.ouverture, ouvert: j.ouvert };
    });
  }
  function synchroniser() {
    var mesures = [];
    var chaine = Promise.resolve();
    for (var i = 0; i < 4; i++) chaine = chaine.then(function () { return mesurer().then(function (m) { mesures.push(m); }); });
    return chaine.then(function () {
      mesures.sort(function (a, b) { return a.rtt - b.rtt; });
      decalage = mesures[0].decalage; ouverture = mesures[0].ouverture;
      if (mesures[0].ouvert) ouvrir();
    }).catch(function () {});
  }

  function ouvrir() {
    if (ouvertureLancee) return; ouvertureLancee = true;
    document.getElementById("flash").classList.add("go");
    // le serveur confirme l'ouverture, puis on entre sur le terrain
    (function essai(n) {
      fetch("/__heure", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
        if (j.ouvert) location.replace("/?coup-d-envoi=" + j.maintenant);
        else setTimeout(function () { essai(n + 1); }, 40);
      }).catch(function () { setTimeout(function () { essai(n + 1); }, 200); });
    })(0);
  }

  function tic() {
    var reste = ouverture - maintenant();
    if (reste <= 0) { ouvrir(); return; }
    var s = Math.floor(reste / 1000);
    document.getElementById("d").textContent = pad(Math.floor(s / 86400));
    document.getElementById("h").textContent = pad(Math.floor(s / 3600) % 24);
    document.getElementById("m").textContent = pad(Math.floor(s / 60) % 60);
    document.getElementById("s").textContent = pad(s % 60);
    document.getElementById("ms").textContent = reste < 60000 ? (reste / 1000).toFixed(3).replace(".", ",") + " s" : "";
    if (reste < 1500) setTimeout(tic, Math.max(0, Math.min(16, reste)));
    else requestAnimationFrame(tic);
  }

  document.getElementById("enter").addEventListener("click", function () {
    var b = this;
    b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
    document.getElementById("wait").classList.add("show");
  });

  synchroniser().then(tic);
  setInterval(synchroniser, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) synchroniser(); });
})();
</script>
</body>
</html>`;
