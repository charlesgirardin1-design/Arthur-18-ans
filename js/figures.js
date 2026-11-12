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
    // appel « split step » juste avant la frappe : plus bas, appuis larges
    set:     { head: [100, 64], neck: [100, 82], shL: [77, 99], shR: [123, 99], elL: [54, 128], elR: [146, 128], wrL: [50, 158], wrR: [150, 158], hipL: [87, 182], hipR: [113, 182], knL: [58, 222], knR: [142, 222], anL: [54, 268], anR: [146, 268], toeL: [42, 281], toeR: [158, 281] },
    // poings serrés vers le ciel après un arrêt
    celebrate: { head: [100, 38], neck: [100, 56], shL: [78, 74], shR: [122, 74], elL: [62, 42], elR: [138, 42], wrL: [58, 10], wrR: [142, 10], hipL: [89, 158], hipR: [111, 158], knL: [76, 210], knR: [124, 210], anL: [70, 264], anR: [130, 264], toeL: [58, 278], toeR: [142, 278] },
  };
  const KICKER = {
    stand: { head: [100, 40], neck: [100, 58], shL: [76, 78], shR: [124, 78], elL: [64, 118], elR: [136, 118], wrL: [63, 152], wrR: [137, 152], hipL: [89, 162], hipR: [111, 162], knL: [85, 214], knR: [115, 214], anL: [85, 266], anR: [115, 266], toeL: [85, 279], toeR: [115, 279] },
    run1:  { head: [100, 38], neck: [100, 56], shL: [76, 77], shR: [124, 77], elL: [62, 118], elR: [134, 104], wrL: [58, 150], wrR: [122, 84], hipL: [89, 160], hipR: [111, 160], knL: [88, 198], knR: [116, 222], anL: [93, 236], anR: [121, 266], toeL: [93, 242], toeR: [122, 280] },
    run2:  { head: [100, 38], neck: [100, 56], shL: [76, 77], shR: [124, 77], elL: [66, 104], elR: [138, 118], wrL: [78, 84], wrR: [142, 150], hipL: [89, 160], hipR: [111, 160], knL: [84, 222], knR: [112, 198], anL: [79, 266], anR: [107, 236], toeL: [78, 280], toeR: [107, 242] },
    windup:{ head: [96, 42], neck: [97, 60], shL: [73, 80], shR: [121, 79], elL: [52, 104], elR: [142, 112], wrL: [38, 104], wrR: [152, 134], hipL: [88, 163], hipR: [110, 163], knL: [84, 215], knR: [121, 222], anL: [83, 267], anR: [128, 276], toeL: [83, 280], toeR: [130, 290] },
    kick:  { head: [95, 44], neck: [96, 62], shL: [72, 82], shR: [120, 80], elL: [48, 96], elR: [150, 104], wrL: [28, 92], wrR: [168, 120], hipL: [88, 164], hipR: [110, 163], knL: [85, 215], knR: [121, 194], anL: [83, 267], anR: [127, 220], toeL: [83, 280], toeR: [130, 222] },
    // pied d'appui planté, jambe de frappe armée loin derrière
    plant: { head: [94, 46], neck: [95, 64], shL: [71, 84], shR: [119, 82], elL: [46, 100], elR: [146, 116], wrL: [26, 98], wrR: [156, 140], hipL: [87, 166], hipR: [110, 166], knL: [82, 216], knR: [126, 232], anL: [81, 268], anR: [136, 284], toeL: [81, 281], toeR: [140, 297] },
    // accompagnement : la jambe finit haute, le buste se redresse
    follow:{ head: [97, 42], neck: [98, 60], shL: [74, 80], shR: [122, 79], elL: [50, 92], elR: [146, 106], wrL: [30, 84], wrR: [158, 126], hipL: [89, 162], hipR: [111, 161], knL: [86, 214], knR: [122, 176], anL: [85, 267], anR: [128, 190], toeL: [85, 280], toeR: [131, 186] },
    // célébration : bras en V
    celebrate: { head: [100, 36], neck: [100, 54], shL: [76, 74], shR: [124, 74], elL: [58, 44], elR: [142, 44], wrL: [46, 12], wrR: [154, 12], hipL: [89, 158], hipR: [111, 158], knL: [83, 210], knR: [117, 210], anL: [80, 262], anR: [120, 262], toeL: [80, 276], toeR: [120, 276] },
    celebrate2:{ head: [100, 30], neck: [100, 48], shL: [76, 68], shR: [124, 68], elL: [62, 36], elR: [140, 46], wrL: [56, 2], wrR: [160, 20], hipL: [89, 152], hipR: [111, 152], knL: [82, 198], knR: [120, 206], anL: [84, 246], anR: [122, 254], toeL: [84, 258], toeR: [122, 268] },
    // les mains sur la tête après un raté
    despair: { head: [100, 46], neck: [100, 63], shL: [77, 82], shR: [123, 82], elL: [58, 52], elR: [142, 52], wrL: [84, 30], wrR: [116, 30], hipL: [89, 164], hipR: [111, 164], knL: [86, 216], knR: [114, 216], anL: [86, 268], anR: [114, 268], toeL: [86, 281], toeR: [114, 281] },
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
    s += `<path d="M${f(wL)} L${f(wR)} L${f(add(p.hipR, 13, 6))} Q${f(cr)} ${f(add(p.hipL, -13, 6))} Z" fill="${H}" ${line}/>`;
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
        // horloge « ralentissable » : FIG.speed < 1 = ralenti
        let el = 0, prev = performance.now();
        const a = { resolve, raf: 0 };
        const step = now => {
          el += (now - prev) * api.speed; prev = now;
          const t = Math.min(1, el / ms), e = ease(t);
          for (const k in target) this.pose[k] = pt(from[k], target[k], e);
          this.render();
          if (t < 1) a.raf = requestAnimationFrame(step); else { this.anim = null; resolve(); }
        };
        a.raf = requestAnimationFrame(step);
        this.anim = a;
      });
    }
  }


  const api = { ballSVG, Figure, easeOut, easeInOut, speed: 1 };
  return api;
})();
