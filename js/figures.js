/* =====================================================================
   PERSONNAGES & BALLON
   - Ballon de foot vectoriel réaliste (motif qui tourne + ombrage fixe)
   - Personnages articulés (squelette) animés de façon fluide :
     le gardien (vu de face) et Arthur, le tireur (vu de dos).
   ===================================================================== */
window.FIG = (() => {
  let uid = 0;
  const f = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const lerp = (a, b, t) => a + (b - a) * t;
  const pt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const ext = (a, b, d) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [b[0] + dx / L * d, b[1] + dy / L * d]; };
  const add = (p, x, y) => [p[0] + x, p[1] + y];

  /* ---------------- BALLON ---------------- */
  function ballSVG({ part = "full", size } = {}) {
    const id = "bl" + (++uid);
    const C = 50, pr = 13;
    const pent = (cx, cy, r, rot, sx = 1) => Array.from({ length: 5 }, (_, i) => {
      const a = rot + i * 2 * Math.PI / 5;
      return `${(cx + r * Math.cos(a) * sx).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    let patt = `<polygon points="${pent(C, C, pr, -Math.PI / 2)}"/>`;
    let seams = "";
    const outer = [];
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * 2 * Math.PI / 5;
      const ox = C + Math.cos(a) * 39, oy = C + Math.sin(a) * 39;
      const verts = Array.from({ length: 5 }, (_, i) => { const b = a + Math.PI + i * 2 * Math.PI / 5; return [ox + Math.cos(b) * 13, oy + Math.sin(b) * 13]; });
      outer.push(verts);
      patt += `<polygon points="${verts.map(v => v.map(n => n.toFixed(2)).join(",")).join(" ")}"/>`;
      seams += `<line x1="${(C + Math.cos(a) * pr).toFixed(2)}" y1="${(C + Math.sin(a) * pr).toFixed(2)}" x2="${verts[0][0].toFixed(2)}" y2="${verts[0][1].toFixed(2)}"/>`;
    }
    for (let k = 0; k < 5; k++) {
      const v1 = outer[k][1], v2 = outer[(k + 1) % 5][4];
      const m = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2];
      const mm = [C + (m[0] - C) * 1.18, C + (m[1] - C) * 1.18];
      seams += `<polyline points="${v1.map(n => n.toFixed(2))} ${mm.map(n => n.toFixed(2))} ${v2.map(n => n.toFixed(2))}"/>`;
      seams += `<line x1="${mm[0].toFixed(2)}" y1="${mm[1].toFixed(2)}" x2="${(C + (mm[0] - C) * 1.6).toFixed(2)}" y2="${(C + (mm[1] - C) * 1.6).toFixed(2)}"/>`;
    }
    const wh = size ? `width="${size}" height="${size}"` : "";
    const defs = `<defs>
      <radialGradient id="${id}b" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef0f4"/><stop offset="1" stop-color="#c9ced9"/></radialGradient>
      <radialGradient id="${id}p" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#3a3f4d"/><stop offset="1" stop-color="#11131a"/></radialGradient>
      <radialGradient id="${id}s" cx="36%" cy="30%" r="72%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".22" stop-color="#fff" stop-opacity=".12"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
      <clipPath id="${id}c"><circle cx="50" cy="50" r="48"/></clipPath></defs>`;
    const pattern = `<g clip-path="url(#${id}c)"><g class="ball-pattern"><circle cx="50" cy="50" r="48" fill="url(#${id}b)"/><g fill="url(#${id}p)">${patt}</g><g stroke="#9aa1b1" stroke-width=".9" fill="none" stroke-linecap="round">${seams}</g></g></g>`;
    const shade = `<circle cx="50" cy="50" r="48" fill="url(#${id}s)"/><circle cx="50" cy="50" r="47.6" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`;
    const body = part === "pattern" ? pattern : part === "shade" ? shade : pattern + shade;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${wh} class="ballsvg" aria-hidden="true">${defs}${body}</svg>`;
  }

  /* ---------------- GÉOMÉTRIE DES MEMBRES ---------------- */
  // « capsule » effilée d'un point a à un point b (épaisseurs w1 → w2)
  function cap(a, b, w1, w2) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const r1 = w1 / 2, r2 = w2 / 2;
    const A1 = [a[0] + nx * r1, a[1] + ny * r1], A2 = [a[0] - nx * r1, a[1] - ny * r1];
    const B1 = [b[0] + nx * r2, b[1] + ny * r2], B2 = [b[0] - nx * r2, b[1] - ny * r2];
    return `M${f(A1)} L${f(B1)} A${r2.toFixed(1)} ${r2.toFixed(1)} 0 0 0 ${f(B2)} L${f(A2)} A${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 0 ${f(A1)}Z`;
  }
  const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
  // bande perpendiculaire au membre, entre les fractions t1 et t2 du segment a→b
  function band(a, b, t1, t2, w) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2;
    const p1 = pt(a, b, t1), p2 = pt(a, b, t2);
    return `M${f([p1[0] + nx, p1[1] + ny])} L${f([p2[0] + nx, p2[1] + ny])} L${f([p2[0] - nx, p2[1] - ny])} L${f([p1[0] - nx, p1[1] - ny])}Z`;
  }

  /* ---------------- POSES (repère 200 × 300) ---------------- */
  const KEEPER = {
    ready:   { head: [100, 40], neck: [100, 58], shL: [78, 77], shR: [122, 77], elL: [58, 112], elR: [142, 112], wrL: [52, 146], wrR: [148, 146], hipL: [89, 160], hipR: [111, 160], knL: [71, 212], knR: [129, 212], anL: [66, 266], anR: [134, 266], toeL: [54, 280], toeR: [146, 280] },
    readyB:  { head: [100, 43], neck: [100, 61], shL: [78, 80], shR: [122, 80], elL: [56, 114], elR: [144, 114], wrL: [52, 148], wrR: [148, 148], hipL: [89, 163], hipR: [111, 163], knL: [70, 214], knR: [130, 214], anL: [66, 266], anR: [134, 266], toeL: [54, 280], toeR: [146, 280] },
    crouch:  { head: [100, 60], neck: [100, 78], shL: [78, 95], shR: [122, 95], elL: [57, 128], elR: [143, 128], wrL: [60, 160], wrR: [140, 160], hipL: [88, 178], hipR: [112, 178], knL: [64, 222], knR: [136, 222], anL: [66, 268], anR: [134, 268], toeL: [54, 281], toeR: [146, 281] },
    stretch: { head: [100, 46], neck: [100, 64], shL: [86, 80], shR: [114, 80], elL: [82, 40], elR: [118, 40], wrL: [80, 4], wrR: [120, 4], hipL: [92, 162], hipR: [108, 162], knL: [90, 214], knR: [119, 206], anL: [90, 266], anR: [112, 252], toeL: [88, 281], toeR: [103, 265] },
    jump:    { head: [100, 46], neck: [100, 64], shL: [86, 80], shR: [114, 80], elL: [80, 42], elR: [120, 42], wrL: [77, 6], wrR: [123, 6], hipL: [91, 162], hipR: [109, 162], knL: [82, 206], knR: [118, 206], anL: [88, 252], anR: [112, 252], toeL: [84, 266], toeR: [116, 266] },
    low:     { head: [100, 70], neck: [100, 88], shL: [80, 104], shR: [120, 104], elL: [62, 140], elR: [138, 140], wrL: [74, 176], wrR: [126, 176], hipL: [88, 186], hipR: [112, 186], knL: [62, 230], knR: [138, 230], anL: [68, 270], anR: [132, 270], toeL: [56, 282], toeR: [144, 282] },
  };
  const KICKER = {
    stand: { head: [100, 40], neck: [100, 58], shL: [76, 78], shR: [124, 78], elL: [64, 118], elR: [136, 118], wrL: [63, 152], wrR: [137, 152], hipL: [89, 162], hipR: [111, 162], knL: [85, 214], knR: [115, 214], anL: [85, 266], anR: [115, 266], toeL: [85, 279], toeR: [115, 279] },
    run1:  { head: [100, 38], neck: [100, 56], shL: [76, 77], shR: [124, 77], elL: [62, 118], elR: [134, 104], wrL: [58, 150], wrR: [122, 84], hipL: [89, 160], hipR: [111, 160], knL: [88, 198], knR: [116, 222], anL: [93, 236], anR: [121, 266], toeL: [93, 242], toeR: [122, 280] },
    run2:  { head: [100, 38], neck: [100, 56], shL: [76, 77], shR: [124, 77], elL: [66, 104], elR: [138, 118], wrL: [78, 84], wrR: [142, 150], hipL: [89, 160], hipR: [111, 160], knL: [84, 222], knR: [112, 198], anL: [79, 266], anR: [107, 236], toeL: [78, 280], toeR: [107, 242] },
    windup:{ head: [96, 42], neck: [97, 60], shL: [73, 80], shR: [121, 79], elL: [52, 104], elR: [142, 112], wrL: [38, 104], wrR: [152, 134], hipL: [88, 163], hipR: [110, 163], knL: [84, 215], knR: [121, 222], anL: [83, 267], anR: [128, 276], toeL: [83, 280], toeR: [130, 290] },
    kick:  { head: [95, 44], neck: [96, 62], shL: [72, 82], shR: [120, 80], elL: [48, 96], elR: [150, 104], wrL: [28, 92], wrR: [168, 120], hipL: [88, 164], hipR: [110, 163], knL: [85, 215], knR: [121, 194], anL: [83, 267], anR: [127, 220], toeL: [83, 280], toeR: [130, 222] },
  };

  const KITS = {
    keeper: { j1: "#e6ff5c", j2: "#b8d92a", j3: "#7d9a12", shorts: "#15171f", shorts2: "#2a2e3a", sock: "#c9e83a", band: "#15171f", skin1: "#f2c9a0", skin2: "#d9a173", skin3: "#b77e55", hair: "#2a1a10", boot: "#111317", boot2: "#e30613", glove: true, long: true, number: "1", numColor: "#3a4a08" },
    kicker: { j1: "#1d3584", j2: "#13245f", j3: "#0a1640", shorts: "#13245f", shorts2: "#1d3584", sock: "#13245f", band: "#e30613", skin1: "#f3cda6", skin2: "#ddaa80", skin3: "#ba875f", hair: "#4a2c17", boot: "#f4f5f7", boot2: "#e30613", glove: false, long: false, stripe: "#e30613", name: "ARTHUR", number: "18" },
  };

  function defsFor(id, K) {
    const lg = (n, a, b, c) => `<linearGradient id="${id}${n}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
    return `<defs>
      ${lg("j", K.j1, K.j2, K.j3)}${lg("s", K.skin1, K.skin2, K.skin3)}${lg("h", K.shorts2, K.shorts, "#07080c")}
      ${lg("k", K.sock, K.sock, K.j3)}
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e9ecf2"/><stop offset="1" stop-color="#aab1c0"/></linearGradient>
      <radialGradient id="${id}f" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="${K.skin1}"/><stop offset=".7" stop-color="${K.skin2}"/><stop offset="1" stop-color="${K.skin3}"/></radialGradient>
      <radialGradient id="${id}hr" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="${K.hair}" stop-opacity=".85"/><stop offset="1" stop-color="#0c0704"/></radialGradient>
      <filter id="${id}sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-opacity=".35"/></filter>
    </defs>`;
  }

  function draw(p, K, id, view) {
    const line = 'stroke="rgba(0,0,0,.28)" stroke-width="1" stroke-linejoin="round"';
    const J = `url(#${id}j)`, S = `url(#${id}s)`, H = `url(#${id}h)`, SK = `url(#${id}k)`;
    let s = "";
    // ombre au sol
    const gy = Math.max(p.toeL[1], p.toeR[1]) + 6;
    s += `<ellipse cx="${((p.toeL[0] + p.toeR[0]) / 2).toFixed(1)}" cy="${gy.toFixed(1)}" rx="${(Math.abs(p.toeR[0] - p.toeL[0]) / 2 + 20).toFixed(1)}" ry="5" fill="rgba(0,0,0,.28)"/>`;

    // jambes
    for (const sd of ["L", "R"]) {
      const hip = p["hip" + sd], kn = p["kn" + sd], an = p["an" + sd], toe = p["toe" + sd];
      s += P(cap(hip, kn, 23, 16), S, line);
      s += P(cap(kn, an, 16, 10.5), S, line);
      s += P(cap(pt(kn, an, 0.18), an, 16.5, 11.5), SK, line);              // chaussette
      s += P(band(kn, an, 0.2, 0.3, 15.6), K.band);                         // bande
      s += P(cap(an, toe, 12, 10), K.boot, line);                          // chaussure
      s += P(cap(pt(an, toe, 0.15), pt(an, toe, 0.75), 4, 3.5), K.boot2);
      s += P(cap(hip, pt(hip, kn, 0.42), 28, 23), H, line);               // short
    }
    // bassin
    const wL = add(p.hipL, -13, -16), wR = add(p.hipR, 13, -16);
    const cr = add(pt(p.hipL, p.hipR, 0.5), 0, 12);
    s += `<path d="M${f(wL)} L${f(wR)} L${f(add(p.hipR, 13, 6))} Q${f(cr)} ${f(add(cr, 0, 0))} ${f(add(p.hipL, -13, 6))} Z" fill="${H}" ${line}/>`;
    if (K.stripe) s += `<path d="M${f(add(p.hipR, 12, -12))} L${f(add(p.hipR, 13, 4))}" stroke="${K.stripe}" stroke-width="3"/><path d="M${f(add(p.hipL, -12, -12))} L${f(add(p.hipL, -13, 4))}" stroke="${K.stripe}" stroke-width="3"/>`;
    else s += `<path d="M${f(add(p.hipR, 12, -12))} L${f(add(p.hipR, 13, 4))}" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><path d="M${f(add(p.hipL, -12, -12))} L${f(add(p.hipL, -13, 4))}" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`;

    // torse
    const tL = add(p.shL, -5, -3), tR = add(p.shR, 5, -3), bL = add(p.hipL, -12, -13), bR = add(p.hipR, 12, -13);
    const midL = add(pt(tL, bL, 0.5), 3, 0), midR = add(pt(tR, bR, 0.5), -3, 0);
    const torso = `M${f(tL)} Q${f(add(pt(tL, tR, 0.5), 0, -6))} ${f(tR)} Q${f(midR)} ${f(bR)} L${f(bL)} Q${f(midL)} ${f(tL)} Z`;
    s += `<path d="${torso}" fill="${J}" ${line}/>`;
    if (K.stripe) {
      // bande centrale rouge façon maillot parisien (dos)
      const cT = pt(tL, tR, 0.5), cB = pt(bL, bR, 0.5);
      s += `<clipPath id="${id}tc"><path d="${torso}"/></clipPath><g clip-path="url(#${id}tc)">
        <path d="${band(add(cT, 0, -10), add(cB, 0, 6), 0, 1, 17)}" fill="#fff"/>
        <path d="${band(add(cT, 0, -10), add(cB, 0, 6), 0, 1, 12)}" fill="${K.stripe}"/></g>`;
    }
    // détails du maillot
    const ang = Math.atan2(p.hipL[1] + p.hipR[1] - p.shL[1] - p.shR[1], p.hipL[0] + p.hipR[0] - p.shL[0] - p.shR[0]) * 180 / Math.PI - 90;
    const cT = pt(tL, tR, 0.5);
    if (view === "back") {
      const nP = add(pt(cT, pt(bL, bR, 0.5), 0.17), 0, 0), numP = add(pt(cT, pt(bL, bR, 0.5), 0.52), 0, 0);
      s += `<g transform="rotate(${ang.toFixed(1)} ${f(cT).replace(" ", ",")})" font-family="Bebas Neue, Impact, sans-serif" text-anchor="middle" fill="#fff" stroke="${K.j3}" stroke-width="2.2" paint-order="stroke" stroke-linejoin="round">
        <text x="${nP[0].toFixed(1)}" y="${nP[1].toFixed(1)}" font-size="10.5" letter-spacing=".8">${K.name}</text>
        <text x="${numP[0].toFixed(1)}" y="${(numP[1] + 12).toFixed(1)}" font-size="36">${K.number}</text></g>`;
      // col (dos)
      s += P(cap(add(cT, -9, 0), add(cT, 9, 0), 4, 4), K.j3);
    } else {
      s += `<path d="M${f(add(cT, -9, -1))} L${f(add(cT, 0, 9))} L${f(add(cT, 9, -1))}" fill="none" stroke="${K.j3}" stroke-width="3"/>`;
      const numP = pt(cT, pt(bL, bR, 0.5), 0.45);
      s += `<text x="${(numP[0] + 11).toFixed(1)}" y="${(numP[1] + 6).toFixed(1)}" font-family="Bebas Neue, Impact, sans-serif" font-size="20" text-anchor="middle" fill="${K.numColor}" transform="rotate(${ang.toFixed(1)} ${f(cT).replace(" ", ",")})">${K.number}</text>`;
      s += `<path d="M${f(add(midL, 4, 4))} Q${f(add(pt(midL, midR, .5), 0, 10))} ${f(add(midR, -4, 4))}" fill="none" stroke="${K.j3}" stroke-opacity=".35" stroke-width="2"/>`;
    }

    // cou + tête
    s += P(cap(p.neck, add(p.head, 0, 8), 12, 12), S, line);
    const hx = p.head[0], hy = p.head[1];
    if (view === "back") {
      s += `<ellipse cx="${hx - 14.5}" cy="${hy + 2}" rx="3" ry="5" fill="${K.skin2}"/><ellipse cx="${hx + 14.5}" cy="${hy + 2}" rx="3" ry="5" fill="${K.skin2}"/>`;
      s += `<ellipse cx="${hx}" cy="${hy}" rx="14.5" ry="17.5" fill="url(#${id}f)" ${line}/>`;
      s += `<path d="M${hx - 15} ${hy + 4} Q${hx - 17} ${hy - 19} ${hx} ${hy - 19} Q${hx + 17} ${hy - 19} ${hx + 15} ${hy + 4} Q${hx + 12} ${hy + 13} ${hx} ${hy + 13} Q${hx - 12} ${hy + 13} ${hx - 15} ${hy + 4} Z" fill="url(#${id}hr)"/>`;
      s += `<path d="M${hx - 8} ${hy - 12} q4 -3 8 -1 M${hx + 2} ${hy - 9} q4 -3 8 0 M${hx - 6} ${hy - 2} q5 -2 9 0" stroke="rgba(255,255,255,.12)" stroke-width="1.2" fill="none"/>`;
    } else {
      s += `<ellipse cx="${hx - 14}" cy="${hy + 2}" rx="3" ry="5" fill="${K.skin2}"/><ellipse cx="${hx + 14}" cy="${hy + 2}" rx="3" ry="5" fill="${K.skin2}"/>`;
      s += `<ellipse cx="${hx}" cy="${hy}" rx="14" ry="17.5" fill="url(#${id}f)" ${line}/>`;
      s += `<path d="M${hx - 14.5} ${hy - 1} Q${hx - 16} ${hy - 20} ${hx} ${hy - 19.5} Q${hx + 16} ${hy - 20} ${hx + 14.5} ${hy - 1} Q${hx + 11} ${hy - 11} ${hx + 2} ${hy - 11.5} Q${hx - 9} ${hy - 12} ${hx - 14.5} ${hy - 1} Z" fill="url(#${id}hr)"/>`;
      // traits du visage, sobres
      s += `<path d="M${hx - 9} ${hy - 4} l5.5 -.8 M${hx + 9} ${hy - 4} l-5.5 -.8" stroke="#3b2414" stroke-width="1.6" stroke-linecap="round"/>`;
      s += `<ellipse cx="${hx - 5.5}" cy="${hy}" rx="2" ry="1.3" fill="#1d130c"/><ellipse cx="${hx + 5.5}" cy="${hy}" rx="2" ry="1.3" fill="#1d130c"/>`;
      s += `<path d="M${hx} ${hy + 1} l-1.8 5.5 h3" stroke="${K.skin3}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${hx - 4} ${hy + 10} q4 1.5 8 0" stroke="#8a4a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    }

    // bras
    for (const sd of ["L", "R"]) {
      const sh = p["sh" + sd], el = p["el" + sd], wr = p["wr" + sd];
      if (K.long) {
        s += P(cap(sh, el, 17, 14), J, line);
        s += P(cap(el, wr, 14, 12), J, line);
      } else {
        s += P(cap(sh, el, 15, 12.5), S, line);
        s += P(cap(el, wr, 12.5, 10), S, line);
        s += P(cap(sh, pt(sh, el, 0.55), 19, 16), J, line);
        s += P(band(sh, el, 0.46, 0.53, 16.6), K.stripe || K.j3);
      }
      if (K.glove) {
        const tip = ext(el, wr, 17);
        s += P(cap(pt(el, wr, 0.88), tip, 15, 21), `url(#${id}g)`, line);
        s += P(band(el, ext(el, wr, 17), 0.83, 0.88, 17), "#e30613");
        const g0 = ext(el, wr, 8), g1 = ext(el, wr, 16);
        s += `<path d="M${f(g0)} L${f(g1)}" stroke="#1b1e27" stroke-opacity=".25" stroke-width="1.2"/>`;
      } else {
        s += P(cap(wr, ext(el, wr, 9), 10, 9), S, line);
      }
    }
    return s;
  }

  /* ---------------- FIGURE ANIMÉE ---------------- */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  class Figure {
    constructor(host, kind) {
      this.kind = kind;
      this.poses = kind === "keeper" ? KEEPER : KICKER;
      this.K = KITS[kind];
      this.view = kind === "keeper" ? "front" : "back";
      this.id = "fg" + (++uid);
      host.innerHTML = `<svg viewBox="0 0 200 300" overflow="visible" aria-hidden="true">${defsFor(this.id, this.K)}<g filter="url(#${this.id}sh)"></g></svg>`;
      this.g = host.querySelector("g");
      this.pose = JSON.parse(JSON.stringify(this.poses[kind === "keeper" ? "ready" : "stand"]));
      this.anim = null;
      this.render();
    }
    render() { this.g.innerHTML = draw(this.pose, this.K, this.id, this.view); }
    set(name) { this.cancel(); this.pose = JSON.parse(JSON.stringify(this.poses[name])); this.render(); }
    cancel() { if (this.anim) { cancelAnimationFrame(this.anim.raf); this.anim.resolve(); this.anim = null; } }
    to(name, ms = 300, ease = easeOut) {
      this.cancel();
      const from = JSON.parse(JSON.stringify(this.pose)), target = this.poses[name];
      return new Promise(resolve => {
        const t0 = performance.now();
        const a = { resolve, raf: 0 };
        const step = now => {
          const t = Math.min(1, (now - t0) / ms), e = ease(t);
          for (const k in target) this.pose[k] = pt(from[k], target[k], e);
          this.render();
          if (t < 1) a.raf = requestAnimationFrame(step); else { this.anim = null; resolve(); }
        };
        a.raf = requestAnimationFrame(step);
        this.anim = a;
      });
    }
  }

  /* ---------------- BULLDOG (bouledogue, vu de profil, tête de face) ---------------- */
  function bulldogSVG() {
    const id = "bd" + (++uid);
    const leg = (cls, x, y, w, h, fill, paw) => `<g class="bd-leg ${cls}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${fill}"/>
        <ellipse cx="${x + w / 2 + 2}" cy="${y + h - 2}" rx="${w / 2 + 3}" ry="5" fill="${paw}"/></g>`;
    return `<svg viewBox="0 0 220 170" class="bd" aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6b47c"/><stop offset=".6" stop-color="#cc9055"/><stop offset="1" stop-color="#a86d39"/></linearGradient>
        <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b47a44"/><stop offset="1" stop-color="#8a5528"/></linearGradient>
        <radialGradient id="${id}h" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#f0c693"/><stop offset=".6" stop-color="#d69d61"/><stop offset="1" stop-color="#ad723e"/></radialGradient>
        <radialGradient id="${id}m" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#5e4536"/><stop offset="1" stop-color="#271b14"/></radialGradient>
      </defs>
      <ellipse class="bd-shadow" cx="106" cy="156" rx="74" ry="7" fill="rgba(0,0,0,.28)"/>
      <g class="bd-body">
        ${leg("bd-leg--bl", 54, 114, 16, 38, `url(#${id}d)`, "#8a5528")}
        ${leg("bd-leg--fl", 130, 114, 15, 38, `url(#${id}d)`, "#e9dfd2")}
        <g class="bd-tail"><path d="M42 92 Q26 90 28 76 Q38 78 46 86 Z" fill="url(#${id}f)"/></g>
        <path d="M40 92 Q40 64 80 62 L134 60 Q166 62 168 94 Q170 126 142 130 L64 132 Q38 128 40 92 Z" fill="url(#${id}f)"/>
        <path d="M58 124 Q100 136 142 126" fill="none" stroke="#8a5528" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
        <path d="M138 78 Q164 84 162 112 Q156 128 140 126 Q132 102 138 78 Z" fill="#f7f0e7"/>
        <ellipse cx="72" cy="104" rx="22" ry="22" fill="url(#${id}f)"/>
        <path d="M58 92 Q72 84 88 94" fill="none" stroke="#8a5528" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
        ${leg("bd-leg--br", 64, 116, 19, 38, `url(#${id}f)`, "#b47a44")}
        ${leg("bd-leg--fr", 142, 116, 18, 38, `url(#${id}f)`, "#f7f0e7")}
        <g class="bd-head">
          <path d="M132 52 Q118 14 128 12 Q144 20 150 42 Z" fill="url(#${id}h)"/>
          <path d="M135 46 Q126 22 130 19 Q140 26 145 40 Z" fill="#e7a3a0"/>
          <path d="M188 52 Q202 14 192 12 Q176 20 170 42 Z" fill="url(#${id}h)"/>
          <path d="M185 46 Q194 22 190 19 Q180 26 175 40 Z" fill="#e7a3a0"/>
          <ellipse cx="160" cy="66" rx="40" ry="34" fill="url(#${id}h)"/>
          <ellipse cx="142" cy="84" rx="17" ry="13" fill="url(#${id}h)"/>
          <ellipse cx="178" cy="84" rx="17" ry="13" fill="url(#${id}h)"/>
          <path d="M157 34 Q160 32 163 34 L162 60 Q160 63 158 60 Z" fill="#f7f0e7" opacity=".9"/>
          <path d="M142 46 Q160 38 178 46 M146 52 Q160 47 174 52" fill="none" stroke="#99602f" stroke-width="2" stroke-linecap="round" opacity=".7"/>
          <path d="M135 76 Q137 58 160 58 Q183 58 185 76 Q187 98 160 100 Q133 98 135 76 Z" fill="url(#${id}m)"/>
          <path d="M146 70 Q160 63 174 70" fill="none" stroke="#120b08" stroke-width="1.6" opacity=".7"/>
          <g class="bd-eye"><ellipse cx="144" cy="62" rx="7.5" ry="7.5" fill="#1a110c"/><circle cx="146.5" cy="59.5" r="2.4" fill="#fff"/></g>
          <g class="bd-eye"><ellipse cx="176" cy="62" rx="7.5" ry="7.5" fill="#1a110c"/><circle cx="178.5" cy="59.5" r="2.4" fill="#fff"/></g>
          <path d="M151 73 Q160 68 169 73 Q169 81 160 82 Q151 81 151 73 Z" fill="#120b08"/>
          <ellipse cx="156" cy="72.5" rx="3.2" ry="1.4" fill="#fff" opacity=".35"/>
          <path class="bd-tongue" d="M154 92 Q160 110 166 92 Z" fill="#e8667a"/>
          <path d="M148 91 Q160 101 172 91 Q170 98 160 99 Q150 98 148 91 Z" fill="#2b1e17"/>
          <rect x="153.5" y="90" width="2.6" height="3.2" rx=".8" fill="#fff"/><rect x="164" y="90" width="2.6" height="3.2" rx=".8" fill="#fff"/>
          <path d="M160 82 L160 87 M147 89 Q153 93 160 88 Q167 93 173 89" fill="none" stroke="#120b08" stroke-width="2" stroke-linecap="round"/>
        </g>
        <path d="M134 100 Q160 113 186 100" fill="none" stroke="#13245f" stroke-width="9" stroke-linecap="round"/>
        <path d="M134 100 Q160 113 186 100" fill="none" stroke="#e30613" stroke-width="3" stroke-linecap="round"/>
        <g class="bd-tag"><circle cx="160" cy="115" r="7.5" fill="#f5c542" stroke="#b8892a" stroke-width="1.5"/><text x="160" y="118.5" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="9.5" fill="#5a3d00">18</text></g>
      </g>
    </svg>`;
  }

  /* ---------------- PLATS PRÉFÉRÉS ---------------- */
  function foodSVG(kind) {
    const id = "fd" + (++uid);
    if (kind === "pizza") {
      const C = [80, 72], R = 60;
      const wedge = (a1, a2, r) => {
        const p = a => [C[0] + Math.cos(a * Math.PI / 180) * r, C[1] + Math.sin(a * Math.PI / 180) * r].map(n => n.toFixed(1)).join(" ");
        return `M${C[0]} ${C[1]} L${p(a1)} A${r} ${r} 0 0 1 ${p(a2)} Z`;
      };
      const tops = `
        <circle cx="80" cy="72" r="${R}" fill="url(#${id}c)"/>
        <circle cx="80" cy="72" r="51" fill="#c43a22"/>
        <g fill="#f7d774">${[[60, 52, 14], [98, 50, 12], [112, 78, 13], [86, 92, 15], [56, 86, 12], [80, 70, 11], [70, 108, 9], [104, 104, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
        <g fill="#a3241a">${[[66, 62], [100, 64], [92, 100], [62, 98], [118, 92], [84, 42], [48, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/><circle cx="${x - 2}" cy="${y - 2}" r="1.4" fill="#7a150f"/>`).join("")}</g>
        <g fill="#2f8a3a">${[[78, 58, 20], [110, 66, -30], [72, 92, 60], [96, 84, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g>`;
      return `<svg viewBox="0 0 160 150" class="food food--pizza" aria-hidden="true">
        <defs><radialGradient id="${id}c" cx=".45" cy=".4" r=".7"><stop offset=".72" stop-color="#e2a95c"/><stop offset=".86" stop-color="#d08f3e"/><stop offset="1" stop-color="#a86a28"/></radialGradient>
        <clipPath id="${id}w"><path d="${wedge(-25, 35, 70)}"/></clipPath></defs>
        <ellipse cx="80" cy="138" rx="58" ry="7" fill="rgba(0,0,0,.25)"/>
        <g class="pz-whole">${tops}
          <g stroke="#7a3a12" stroke-opacity=".25" stroke-width="1.4">${[35, 95, 155, 215, 275, 335].map(a => `<line x1="80" y1="72" x2="${(80 + Math.cos(a * Math.PI / 180) * 60).toFixed(1)}" y2="${(72 + Math.sin(a * Math.PI / 180) * 60).toFixed(1)}"/>`).join("")}</g>
          <path d="${wedge(-25, 35, 61)}" fill="#3a2a1e"/>
        </g>
        <g class="pz-slice"><g clip-path="url(#${id}w)">${tops}</g>
          <g class="pz-cheese" stroke="#f7d774" stroke-width="2" stroke-linecap="round"><path d="M86 66 q-6 4 -12 2"/><path d="M90 78 q-7 3 -13 0"/></g></g>
      </svg>`;
    }
    if (kind === "pates") {
      const curls = Array.from({ length: 16 }, (_, i) => {
        const x = 34 + (i % 8) * 12 + (i > 7 ? 6 : 0), y = i > 7 ? 46 : 56;
        return `<path d="M${x} ${y} q8 -12 14 0 q6 12 12 -2" />`;
      }).join("");
      return `<svg viewBox="0 0 160 150" class="food food--pates" aria-hidden="true">
        <defs><linearGradient id="${id}b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d2e8"/></linearGradient></defs>
        <ellipse cx="80" cy="138" rx="56" ry="7" fill="rgba(0,0,0,.25)"/>
        <g class="pt-steam" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round">
          <path d="M60 30 q-6 -8 0 -16 q6 -8 0 -16"/><path d="M80 26 q-6 -8 0 -16 q6 -8 0 -16"/><path d="M100 30 q-6 -8 0 -16 q6 -8 0 -16"/></g>
        <g fill="none" stroke="#f0c95f" stroke-width="4" stroke-linecap="round">${curls}</g>
        <g fill="none" stroke="#d9ab3f" stroke-width="2" stroke-linecap="round" opacity=".8">${curls}</g>
        <path d="M58 52 Q80 38 102 52 Q96 62 80 62 Q64 62 58 52 Z" fill="#c43a22"/>
        <circle cx="70" cy="50" r="7" fill="#7a3b1e"/><circle cx="90" cy="48" r="7" fill="#7a3b1e"/><circle cx="80" cy="56" r="6" fill="#6a3218"/>
        <circle cx="68" cy="48" r="2" fill="#a0583a"/><circle cx="88" cy="46" r="2" fill="#a0583a"/>
        <ellipse cx="80" cy="42" rx="6" ry="3" fill="#2f8a3a" transform="rotate(-20 80 42)"/>
        <path d="M18 70 Q80 62 142 70 Q136 124 80 128 Q24 124 18 70 Z" fill="url(#${id}b)"/>
        <ellipse cx="80" cy="70" rx="62" ry="10" fill="none" stroke="#fff" stroke-width="4"/>
        <path d="M30 92 Q80 100 130 92" fill="none" stroke="#13245f" stroke-width="5" stroke-linecap="round" opacity=".8"/>
        <path d="M30 100 Q80 108 130 100" fill="none" stroke="#e30613" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        <g class="pt-fork"><path d="M118 4 L96 52" stroke="#c7ccd6" stroke-width="5" stroke-linecap="round"/>
          <path d="M92 50 l-4 10 M96 52 l-4 10 M100 54 l-4 10" stroke="#c7ccd6" stroke-width="2.4" stroke-linecap="round"/></g>
      </svg>`;
    }
    // burger
    return `<svg viewBox="0 0 160 150" class="food food--burger" aria-hidden="true">
      <defs><linearGradient id="${id}t" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f0b36a"/><stop offset="1" stop-color="#c87a32"/></linearGradient></defs>
      <ellipse cx="80" cy="138" rx="58" ry="7" fill="rgba(0,0,0,.25)"/>
      <g class="bg-l bg-bottom"><path d="M26 112 Q26 128 44 128 L116 128 Q134 128 134 112 Z" fill="#d18a43"/></g>
      <g class="bg-l bg-patty"><rect x="22" y="94" width="116" height="20" rx="10" fill="#5a2f1b"/><path d="M30 100 h100 M34 108 h92" stroke="#3e1f10" stroke-width="2" stroke-dasharray="6 5"/></g>
      <g class="bg-l bg-cheese"><path d="M22 90 L138 90 L134 98 L122 98 L116 108 L110 98 L60 98 L54 110 L48 98 L26 98 Z" fill="#f7c242"/></g>
      <g class="bg-l bg-tomato"><rect x="30" y="82" width="100" height="9" rx="4" fill="#d9362b"/></g>
      <g class="bg-l bg-salad"><path d="M20 80 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 l0 6 l-112 0 Z" fill="#5fb548"/></g>
      <g class="bg-l bg-top"><path d="M22 76 Q22 26 80 26 Q138 26 138 76 Z" fill="url(#${id}t)"/>
        <g fill="#fff6dc">${[[60, 44], [80, 38], [100, 46], [70, 58], [92, 60], [110, 62], [50, 62]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.8" transform="rotate(${i * 25} ${x} ${y})"/>`).join("")}</g>
        <path d="M40 46 Q60 32 84 32" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/></g>
    </svg>`;
  }

  return { ballSVG, bulldogSVG, foodSVG, Figure, easeOut, easeInOut };
})();
