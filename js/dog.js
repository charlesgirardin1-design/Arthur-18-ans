/* =====================================================================
   BOULEDOGUE MASCOTTE — vraie photo découpée en pièces articulées
   (corps + 4 pattes), animée en canvas : marche, trot, course,
   demi-tour, saut d'aboiement. Le ballon est poussé devant lui.
   ===================================================================== */
window.DOG = (() => {
  const RIG = { // repère de la photo source, le chien regarde à gauche (pattes prolongées jusqu'aux pieds)
    w: 490, h: 318,
    legs: {
      front: { x: 146, y: 193, w: 100, h: 123, px: 204, py: 196 },
      back:  { x: 371, y: 179, w: 101, h: 137, px: 430, py: 182 },
    },
  };
  const SRC = {
    body: "images/bulldog/bd-body.png",
    front: "images/bulldog/bd-leg-front.png", frontFar: "images/bulldog/bd-leg-front-far.png",
    back: "images/bulldog/bd-leg-back.png", backFar: "images/bulldog/bd-leg-back-far.png",
  };
  const PAD_X = 40, PAD_TOP = 40, PAD_BOT = 14; // marge pour le balancement des pattes et le saut

  function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

  class Dog {
    constructor(host, opts = {}) {
      this.host = host;
      this.mover = opts.mover || host;   // élément déplacé à l'écran (le chien + sa bulle)
      this.scale = opts.scale || 0.3;
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d");
      host.appendChild(this.canvas);
      this.x = opts.x ?? -400;        // position à l'écran (px, bord gauche du chien)
      this.face = 1;                  // 1 = regarde à droite, -1 = à gauche
      this.speed = 0;                 // px/s affiché
      this.phase = 0;                 // cycle de foulée
      this.hop = 0;                   // saut (aboiement)
      this.t = 0;
      this.target = null;
      this.ready = this._load();
      this._resize();
      addEventListener("resize", () => this._resize());
      this._tick = this._tick.bind(this);
      this.last = performance.now();
      requestAnimationFrame(this._tick);
    }
    async _load() {
      const keys = Object.keys(SRC);
      const imgs = await Promise.all(keys.map(k => load(SRC[k])));
      this.img = Object.fromEntries(keys.map((k, i) => [k, imgs[i]]));
    }
    _resize() {
      this.dpr = Math.min(2, devicePixelRatio || 1);
      const s = this.scale;
      this.cw = (RIG.w + PAD_X * 2) * s; this.ch = (RIG.h + PAD_TOP + PAD_BOT) * s;
      this.canvas.width = Math.round(this.cw * this.dpr); this.canvas.height = Math.round(this.ch * this.dpr);
      this.canvas.style.width = this.cw + "px"; this.canvas.style.height = this.ch + "px";
      this.host.style.width = this.cw + "px";
    }
    get width() { return this.cw; }
    setScale(s) { this.scale = s; this._resize(); }

    /* se déplace jusqu'à x (px) à la vitesse v (px/s) ; résout la promesse à l'arrivée */
    moveTo(x, v) {
      return new Promise(res => {
        if (this.target) this.target.res();
        this.face = x >= this.x ? 1 : -1;
        this.target = { x, v, res };
      });
    }
    bark() { this.hop = 1; }

    _tick(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt;
      // déplacement avec accélération douce
      let want = 0;
      if (this.target) {
        const d = this.target.x - this.x;
        const dir = Math.sign(d);
        const brake = Math.min(1, Math.abs(d) / 60);           // ralentit à l'approche
        want = this.target.v * Math.max(0.25, brake);
        if (Math.abs(d) < 2) { this.x = this.target.x; const r = this.target.res; this.target = null; want = 0; r(); }
        else this.x += dir * Math.min(Math.abs(d), this.speed * dt);
      }
      this.speed += (want - this.speed) * Math.min(1, dt * 6);
      // fréquence de foulée liée à la vitesse (marche ~2 pas/s, course ~4.5)
      const stride = this.speed / (this.scale * 260);
      this.phase += dt * Math.PI * 2 * Math.min(4.6, stride * 1.6);
      this.hop = Math.max(0, this.hop - dt * 2.2);
      this.mover.style.transform = `translateX(${this.x - PAD_X * this.scale}px)`;
      if (this.img) this._draw();
      requestAnimationFrame(this._tick);
    }

    _draw() {
      const { ctx, img } = this, s = this.scale;
      const k = Math.min(1, this.speed / (this.scale * 900));    // 0 = arrêt, 1 = pleine course
      const moving = this.speed > 4;
      const amp = moving ? (0.32 + 0.38 * k) : 0;                 // amplitude des pattes (rad)
      const p = this.phase;
      // rebond du corps : 2 rebonds par cycle en trot, plus marqué en course
      const bob = moving ? Math.abs(Math.sin(p)) * (6 + 16 * k) : Math.sin(this.t * 2.2) * 1.4; // respiration à l'arrêt
      const hopY = Math.sin(this.hop * Math.PI) * 46;
      const pitch = moving ? Math.sin(p * 2) * 0.02 * (1 + k) : 0;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.cw, this.ch);
      // ombre au sol
      const gy = (PAD_TOP + RIG.h - 6) * s;
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.28 - hopY / 400})`;
      ctx.beginPath(); ctx.ellipse(this.cw / 2, gy, RIG.w * 0.38 * s * (1 - hopY / 200), 9 * s + 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // repère du chien : la photo regarde à gauche → miroir si face = 1
      ctx.save();
      ctx.translate(this.cw / 2, 0);
      ctx.scale(-this.face * s, s);
      ctx.translate(-RIG.w / 2, PAD_TOP - (bob + hopY) / s * 0.5);
      ctx.translate(RIG.w / 2, RIG.h * 0.6); ctx.rotate(pitch); ctx.translate(-RIG.w / 2, -RIG.h * 0.6);
      const leg = (name, image, ang, dx = 0, dy = 0) => {
        const L = RIG.legs[name];
        ctx.save();
        // une patte qui avance se soulève un peu
        const lift = moving ? Math.max(0, Math.sin(ang / (amp || 1) * Math.PI / 2)) * (5 + 9 * k) : 0;
        ctx.translate(L.px + dx, L.py + dy - lift);
        ctx.rotate(ang);
        ctx.drawImage(image, L.x - L.px, L.y - L.py, L.w, L.h);
        ctx.restore();
      };
      // trot : diagonales synchronisées (avant proche + arrière lointain)
      const a1 = Math.sin(p) * amp, a2 = Math.sin(p + Math.PI) * amp;
      // le chien regarde à gauche dans la source : angle négatif = patte vers l'avant
      leg("front", img.frontFar, -a2, 14, -3);
      leg("back", img.backFar, -a1 * 0.9, 14, -3);
      ctx.drawImage(img.body, 0, 0, RIG.w, RIG.h);
      leg("back", img.back, -a2 * 0.9);
      leg("front", img.front, -a1);
      ctx.restore();
    }
  }
  return { Dog };
})();
