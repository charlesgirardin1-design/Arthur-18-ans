/* =====================================================================
   SONS — tout est synthétisé en direct par le navigateur (Web Audio),
   aucun fichier audio à télécharger. Désactivé par défaut.
   ===================================================================== */
window.SFX = (() => {
  let ctx = null, master = null, enabled = false, crowd = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noiseBuffer(seconds = 2) {
    const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  const on = () => enabled && ensure();

  /* coup de sifflet : "court" ou "final" (trois coups) */
  function whistle(type = "court") {
    if (!on()) return;
    const pattern = type === "final" ? [[0, .22], [.32, .22], [.64, .9]] : [[0, .45]];
    pattern.forEach(([start, len]) => {
      const t = ctx.currentTime + start;
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator();
      const lg = ctx.createGain(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 2800; o2.type = "sine"; o2.frequency.value = 2860;
      lfo.frequency.value = 32; lg.gain.value = 90; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      o.connect(g); o2.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.setValueAtTime(0.12, t + len - 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + len + 0.05); });
    });
  }

  /* clameur de la foule (but !) */
  function cheer(power = 1) {
    if (!on()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(3);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.6;
    const g = ctx.createGain();
    src.connect(bp); bp.connect(g); g.connect(master);
    env(g, t, 0.15, 0.45 * power, 2.4);
    bp.frequency.linearRampToValueAtTime(1300, t + 0.4);
    src.start(t); src.stop(t + 2.8);
  }

  /* « ooooh » déçu (arrêt du gardien) */
  function ooh() {
    if (!on()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(2);
    const lp = ctx.createBiquadFilter(); lp.type = "bandpass"; lp.frequency.value = 420; lp.Q.value = 1.4;
    const g = ctx.createGain();
    src.connect(lp); lp.connect(g); g.connect(master);
    env(g, t, 0.25, 0.35, 1.3);
    lp.frequency.linearRampToValueAtTime(300, t + 1.4);
    src.start(t); src.stop(t + 1.7);
  }

  /* frappe de balle */
  function kick(pitch = 1) {
    if (!on()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(160 * pitch, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(g); g.connect(master); env(g, t, 0.004, 0.6, 0.14);
    o.start(t); o.stop(t + 0.2);
  }

  /* petit « pop » (bougie, bouton) */
  function pop(f = 520) {
    if (!on()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f / 3, t + 0.12);
    o.connect(g); g.connect(master); env(g, t, 0.005, 0.18, 0.14);
    o.start(t); o.stop(t + 0.2);
  }

  /* jingle de victoire */
  function fanfare() {
    if (!on()) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.12;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.value = f;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
      o.connect(lp); lp.connect(g); g.connect(master); env(g, t, 0.01, 0.08, i === 3 ? 0.7 : 0.18);
      o.start(t); o.stop(t + 1);
    });
  }

  /* explosion de feu d'artifice */
  function boom() {
    if (!on()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(1.5);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600 + Math.random() * 500;
    const g = ctx.createGain();
    src.connect(lp); lp.connect(g); g.connect(master);
    env(g, t, 0.01, 0.4, 1.1);
    src.start(t); src.stop(t + 1.3);
  }

  /* ambiance de stade en fond (boucle douce) */
  function crowdStart() {
    if (!on() || crowd) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(4); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 650; bp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.15; lg.gain.value = 0.012; lfo.connect(lg); lg.connect(g.gain);
    src.connect(bp); bp.connect(g); g.connect(master);
    g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 2);
    src.start(); lfo.start();
    crowd = { src, lfo, g };
  }
  function crowdStop() {
    if (!crowd) return;
    const c = crowd; crowd = null;
    c.g.gain.cancelScheduledValues(ctx.currentTime);
    c.g.gain.setValueAtTime(c.g.gain.value, ctx.currentTime);
    c.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => { try { c.src.stop(); c.lfo.stop(); } catch (e) {} }, 700);
  }

  function setEnabled(v) {
    enabled = v;
    if (v) { ensure(); crowdStart(); } else crowdStop();
  }

  return { setEnabled, get enabled() { return enabled; }, whistle, cheer, ooh, kick, pop, fanfare, boom };
})();
