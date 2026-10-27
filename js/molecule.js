var CC = (globalThis.CC = globalThis.CC || {});

// A tiny acyclic-molecule model used by the naming and drawing puzzles.
//   { n: chain length, sub: [[groups on C1], [groups on C2], …], db: [i, …] }
// Groups: 'OH', 'O' (=O), 'Cl', 'Br', 'CH3', 'NH2'. db holds i for a C(i)=C(i+1) double bond (0-based).
// The drawn chain is always the principal chain, so methyl groups are only allowed on inner carbons.
(function () {
  const M = (CC.Mol = {});
  const STEMS = ['meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];
  const MULT = ['', '', 'di', 'tri', 'tetra'];
  const GROUPS = ['OH', 'O', 'Cl', 'Br', 'CH3', 'NH2'];
  M.STEMS = STEMS;
  M.GROUPS = GROUPS;
  M.MAX_N = 8;

  M.make = (n) => ({ n, sub: Array.from({ length: n }, () => []), db: [] });
  M.clone = (m) => ({ n: m.n, sub: m.sub.map((s) => s.slice()), db: m.db.slice() });

  const isEnd = (m, i) => i === 0 || i === m.n - 1;
  M.bondsUsed = function (m, i) {
    let b = (i > 0 ? 1 : 0) + (i < m.n - 1 ? 1 : 0);
    if (m.db.includes(i - 1)) b++;
    if (m.db.includes(i)) b++;
    for (const g of m.sub[i]) b += g === 'O' ? 2 : 1;
    return b;
  };
  M.valid = function (m) {
    for (let i = 0; i < m.n; i++) {
      if (M.bondsUsed(m, i) > 4) return false;
      if (m.sub[i].includes('CH3') && isEnd(m, i)) return false;
      if (m.sub[i].filter((g) => g === 'O').length > 1) return false;
    }
    for (const d of m.db) if (d < 0 || d >= m.n - 1) return false;
    return true;
  };
  // Can group g be added to carbon i?
  M.canAdd = function (m, i, g) {
    if (g === 'CH3' && isEnd(m, i)) return false;
    const t = M.clone(m);
    t.sub[i].push(g);
    return M.valid(t);
  };

  // Classify each group: returns list of {type, i}. Types: acid, al, one, ol, amine, Cl, Br, CH3.
  function classify(m) {
    const out = [];
    for (let i = 0; i < m.n; i++) {
      const s = m.sub[i];
      const hasO = s.includes('O');
      const nOH = s.filter((g) => g === 'OH').length;
      let ohUsed = 0;
      if (hasO) {
        if (isEnd(m, i) && m.n >= 1 && nOH > 0) { out.push({ type: 'acid', i }); ohUsed = 1; }
        else if (isEnd(m, i)) out.push({ type: 'al', i });
        else out.push({ type: 'one', i });
      }
      for (let k = ohUsed; k < nOH; k++) out.push({ type: 'ol', i });
      for (const g of s) {
        if (g === 'NH2') out.push({ type: 'amine', i });
        else if (g === 'Cl' || g === 'Br' || g === 'CH3') out.push({ type: g, i });
      }
    }
    return out;
  }
  const PRIORITY = ['acid', 'al', 'one', 'ol', 'amine'];
  const SUFFIX = { acid: 'oic acid', al: 'al', one: 'one', ol: 'ol', amine: 'amine' };
  const PREFIX = { acid: 'carboxy', al: 'oxo', one: 'oxo', ol: 'hydroxy', amine: 'amino', Cl: 'chloro', Br: 'bromo', CH3: 'methyl' };

  function cmpLoc(a, b) {
    for (let k = 0; k < Math.max(a.length, b.length); k++) {
      if (a[k] !== b[k]) return (a[k] || 99) - (b[k] || 99);
    }
    return 0;
  }

  // IUPAC name. opts.dir forces numbering direction (+1 or -1) to build plausible wrong answers.
  M.name = function (m, opts) {
    opts = opts || {};
    if (!m || !M.valid(m)) return null;
    const groups = classify(m);
    const principal = PRIORITY.find((p) => groups.some((g) => g.type === p)) || null;
    const n = m.n;
    const loc = (i, dir) => (dir > 0 ? i + 1 : n - i);
    const dbLoc = (i, dir) => (dir > 0 ? i + 1 : n - i - 1);
    function describe(dir) {
      const pr = groups.filter((g) => g.type === principal).map((g) => loc(g.i, dir)).sort((a, b) => a - b);
      const dbs = m.db.map((i) => dbLoc(i, dir)).sort((a, b) => a - b);
      const pre = groups.filter((g) => g.type !== principal).map((g) => ({ name: PREFIX[g.type], l: loc(g.i, dir) }));
      const allPre = pre.map((p) => p.l).sort((a, b) => a - b);
      const alpha = pre.slice().sort((a, b) => a.name.localeCompare(b.name) || a.l - b.l).map((p) => p.l);
      return { pr, dbs, pre, allPre, alpha };
    }
    const f = describe(1), r = describe(-1);
    let dir = opts.dir;
    if (!dir) {
      const c = cmpLoc(f.pr, r.pr) || cmpLoc(f.dbs, r.dbs) || cmpLoc(f.allPre, r.allPre) || cmpLoc(f.alpha, r.alpha);
      dir = c <= 0 ? 1 : -1;
    }
    const d = dir > 0 ? f : r;
    const stemIdx = n - 1 + (opts.stemShift || 0);
    const stem = STEMS[stemIdx];
    if (!stem) return null;
    const total = groups.length + m.db.length;
    const tiny = n <= 2 && total <= 1; // ethanol, chloroethane, ethene…

    // prefixes
    const byName = {};
    for (const p of d.pre) (byName[p.name] = byName[p.name] || []).push(p.l);
    const prefix = Object.keys(byName).sort().map((nm) => {
      const ls = byName[nm].sort((a, b) => a - b);
      return (tiny ? '' : ls.join(',') + '-') + MULT[ls.length] + nm;
    }).join('-');

    let base = stem;
    if (!m.db.length) base += 'an';
    else base += (m.db.length > 1 ? 'a' : '') + (tiny ? '' : '-' + d.dbs.join(',') + '-') + (m.db.length > 1 ? 'dien' : 'en');
    if ((tiny || (n === 3 && total === 1)) && m.db.length) base = stem + 'en'; // ethene, propene

    let name;
    if (!principal) name = base + 'e';
    else {
      const k = d.pr.length;
      const suf = MULT[k] + SUFFIX[principal];
      const vowel = /^[aeiou]/.test(suf);
      let b = base + (vowel ? '' : 'e');
      let locs = '';
      const implied = principal === 'acid' || principal === 'al';
      const ketoneShort = principal === 'one' && k === 1 && (n === 3 || (n === 4 && total === 1));
      if (!implied && !tiny && !ketoneShort) locs = '-' + d.pr.join(',') + '-';
      if (locs && b.endsWith('e') && !vowel) { /* ethane-1,2-diol keeps its e */ }
      name = b + locs + suf;
    }
    return prefix ? prefix + (/^[0-9]/.test(name) || name.startsWith('-') ? '-' : '') + name : name;
  };

  // Condensed structural formula, e.g. CH₃CH(OH)CH₂CH₃
  const SUBS = { 0: '₀', 1: '', 2: '₂', 3: '₃', 4: '₄' };
  M.condensed = function (m) {
    let s = '';
    for (let i = 0; i < m.n; i++) {
      const g = m.sub[i].slice();
      const h = 4 - M.bondsUsed(m, i);
      const hasO = g.includes('O');
      const nOH = g.filter((x) => x === 'OH').length;
      let part;
      if (hasO && isEnd(m, i) && nOH && m.n >= 1) {
        part = i === 0 && m.n > 1 ? 'HOOC' : 'COOH';
        g.splice(g.indexOf('O'), 1);
        g.splice(g.indexOf('OH'), 1);
        if (m.n === 1) part = 'H' + 'COOH';
      } else if (hasO && isEnd(m, i)) {
        part = i === 0 && m.n > 1 ? 'OHC' : 'CHO';
        if (m.n === 1) part = 'HCHO';
        g.splice(g.indexOf('O'), 1);
      } else if (hasO) {
        part = 'CO';
        g.splice(g.indexOf('O'), 1);
      } else part = 'C' + (h ? 'H' + SUBS[h] : '');
      const rest = {};
      for (const x of g) rest[x] = (rest[x] || 0) + 1;
      const txt = { OH: 'OH', Cl: 'Cl', Br: 'Br', CH3: 'CH₃', NH2: 'NH₂' };
      for (const x in rest) part += rest[x] === 1 && (x === 'Cl' || x === 'Br') && m.n > 1 ? `(${txt[x]})` : rest[x] === 1 ? `(${txt[x]})` : `(${txt[x]})${SUBS[rest[x]]}`;
      if (m.n === 1 || (isEnd(m, i) && Object.keys(rest).length === 1 && Object.values(rest)[0] === 1)) part = part.replace(/\(([^)]+)\)/g, '$1');
      s += part;
      if (i < m.n - 1) s += m.db.includes(i) ? '=' : '';
    }
    return s;
  };

  // Skeletal formula as SVG.
  M.svg = function (m, opts) {
    opts = opts || {};
    const W = opts.w || 360, H = opts.h || 170;
    const dx = 46, dy = 26;
    const w0 = (m.n - 1) * dx;
    const x0 = W / 2 - w0 / 2;
    const yMid = H / 2;
    const P = Array.from({ length: m.n }, (_, i) => [x0 + i * dx, yMid + (i % 2 ? -dy / 2 : dy / 2)]);
    if (m.n === 1) P[0] = [W / 2, yMid];
    let out = '';
    const line = (a, b, cls) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls || 'bd'}"/>`;
    const shorten = (a, b, s) => { const vx = b[0] - a[0], vy = b[1] - a[1], L = Math.hypot(vx, vy); return [b[0] - (vx / L) * s, b[1] - (vy / L) * s]; };
    // chain bonds
    for (let i = 0; i < m.n - 1; i++) {
      out += line(P[i], P[i + 1]);
      if (m.db.includes(i)) {
        const a = P[i], b = P[i + 1];
        const vx = b[0] - a[0], vy = b[1] - a[1], L = Math.hypot(vx, vy);
        let nx = -vy / L, ny = vx / L;
        const midY = (a[1] + b[1]) / 2;
        if ((midY + ny * 6 > yMid) !== (i % 2 === 0)) { nx = -nx; ny = -ny; }
        const s = 0.18;
        out += line([a[0] + vx * s + nx * 6, a[1] + vy * s + ny * 6], [b[0] - vx * s + nx * 6, b[1] - vy * s + ny * 6]);
      }
    }
    if (m.n === 1) out += `<text x="${P[0][0]}" y="${P[0][1] + 5}" class="al">C</text>`;
    // substituents
    const LBL = { OH: 'OH', O: 'O', Cl: 'Cl', Br: 'Br', NH2: 'NH₂', CH3: '' };
    for (let i = 0; i < m.n; i++) {
      const used = [];
      if (i > 0) used.push(Math.atan2(P[i - 1][1] - P[i][1], P[i - 1][0] - P[i][0]));
      if (i < m.n - 1) used.push(Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]));
      const up = m.n === 1 ? true : i % 2 === 1;
      let deg = up ? [-90, -150, -30, 180, 0, 90, 150, 30] : [90, 150, 30, 180, 0, -90, -150, -30];
      // end carbons: carry on the zigzag first, then point away vertically
      if (m.n === 1) deg = [0, 180, -90, 90];
      else if (i === 0) deg = up ? [150, -90, 180, -150] : [-150, 90, 180, 150];
      else if (i === m.n - 1) deg = up ? [30, -90, 0, -30] : [-30, 90, 0, 30];
      const cands = deg.map((a) => (a * Math.PI) / 180);
      for (const g of m.sub[i]) {
        const ang = cands.find((a) => used.every((u) => Math.abs(Math.atan2(Math.sin(a - u), Math.cos(a - u))) > 1.0)) || cands[0];
        used.push(ang);
        const L = g === 'CH3' ? 40 : 38;
        const end = [P[i][0] + Math.cos(ang) * L, P[i][1] + Math.sin(ang) * L];
        const lbl = LBL[g];
        const tip = lbl ? shorten(P[i], end, 10) : end;
        const base = m.n === 1 ? [P[i][0] + Math.cos(ang) * 9, P[i][1] + Math.sin(ang) * 9] : P[i];
        out += line(base, tip);
        if (g === 'O') {
          const nx = -Math.sin(ang) * 5, ny = Math.cos(ang) * 5;
          out += line([P[i][0] + nx, P[i][1] + ny], [tip[0] + nx, tip[1] + ny]);
        }
        if (lbl) out += `<text x="${end[0].toFixed(1)}" y="${(end[1] + 5).toFixed(1)}" class="al">${lbl}</text>`;
      }
    }
    if (opts.numbers) P.forEach((p, i) => { out += `<text x="${p[0]}" y="${p[1] + (i % 2 ? -12 : 20)}" class="num">${i + 1}</text>`; });
    return `<svg class="mol" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skeletal formula">${out}</svg>`;
  };

  // ───────── random molecules for the naming puzzles ─────────
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  M.random = function (level) {
    level = level || 1;
    for (let tries = 0; tries < 200; tries++) {
      const n = pick(level < 2 ? [1, 2, 2, 3, 3, 4, 4, 5] : [2, 3, 4, 4, 5, 5, 6, 6, 7]);
      const m = M.make(n);
      const kind = pick(['alkane', 'alkene', 'ol', 'ol', 'al', 'one', 'acid', 'amine', 'halo', 'halo']);
      const inner = () => 1 + Math.floor(Math.random() * Math.max(1, n - 2));
      const any = () => Math.floor(Math.random() * n);
      if (kind === 'alkene') { if (n < 2) continue; m.db.push(Math.floor(Math.random() * (n - 1))); }
      if (kind === 'ol') m.sub[any()].push('OH');
      if (kind === 'amine') m.sub[any()].push('NH2');
      if (kind === 'halo') m.sub[any()].push(pick(['Cl', 'Br']));
      if (kind === 'al') m.sub[Math.random() < 0.5 ? 0 : n - 1].push('O');
      if (kind === 'acid') { const e = Math.random() < 0.5 ? 0 : n - 1; m.sub[e].push('O', 'OH'); }
      if (kind === 'one') { if (n < 3) continue; m.sub[inner()].push('O'); }
      const extras = level < 2 ? (Math.random() < 0.5 ? 1 : 0) : 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < extras; k++) {
        const g = pick(n >= 3 ? ['CH3', 'CH3', 'Cl', 'Br', 'OH'] : ['Cl', 'Br']);
        const i = g === 'CH3' ? inner() : any();
        if (M.canAdd(m, i, g)) m.sub[i].push(g);
      }
      if (!M.valid(m)) continue;
      // no enols/enamines: OH or NH2 on a C=C carbon tautomerise away
      if (m.db.some((d) => [d, d + 1].some((i) => m.sub[i].includes('OH') || m.sub[i].includes('NH2')))) continue;
      const nm = M.name(m);
      if (nm) return m;
    }
    return M.make(2);
  };

  // Plausible wrong names for a molecule.
  M.distractors = function (m, k) {
    const right = M.name(m);
    const out = new Set();
    const rev = M.name(m, { dir: M.name(m, { dir: 1 }) === right ? -1 : 1 });
    if (rev && rev !== right) out.add(rev);
    for (const sh of [1, -1]) { const x = M.name(m, { stemShift: sh }); if (x && x !== right) out.add(x); }
    const swaps = [['ol', 'al'], ['one', 'al'], ['oic acid', 'ol'], ['al', 'one'], ['chloro', 'bromo'], ['bromo', 'chloro'], ['amine', 'amide'], ['ene', 'ane'], ['ane', 'ene'], ['methyl', 'ethyl']];
    for (const [a, b] of swaps) if (right.includes(a)) out.add(right.replace(a, b));
    let guard = 0;
    while (out.size < k + 2 && guard++ < 50) { const o = M.name(M.random(2)); if (o && o !== right) out.add(o); }
    out.delete(right);
    for (const x of [...out]) if (/[a-z]en-\d/.test(x) || /-\d+-ane\b/.test(x) || /\d-al$/.test(x) || /\d-(oic acid|al)\b/.test(x)) out.delete(x);
    while (out.size < k) { const o = M.name(M.random(2)); if (o && o !== right) out.add(o); }
    return [...out].sort(() => Math.random() - 0.5).slice(0, k);
  };
})();
