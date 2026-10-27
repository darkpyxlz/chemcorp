var CC = (globalThis.CC = globalThis.CC || {});

// Minigames: name a molecule, build a molecule from its name, push curly arrows, plan a synthesis route.
// All pay RP scaled like Chem School. No DOM here.
(function () {
  const G = CC.Game;
  const Mol = CC.Mol;
  const P = (CC.Puzzles = {});
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => G.shuffle(a.slice());

  P.state = function () {
    const S = G.state();
    if (!S.puzzles) S.puzzles = { named: 0, built: 0, mechs: {}, routes: 0, optimal: 0, rp: 0, streak: 0, best: 0 };
    return S.puzzles;
  };
  const scale = () => (CC.School ? CC.School.scale() : 1);
  function pay(base) {
    const rp = base * scale();
    G.gainRp(rp);
    P.state().rp += rp;
    G.dirty();
    return rp;
  }
  P.fromSpec = function (spec) {
    const m = Mol.make(spec[0]);
    for (const [i, g] of spec[1] || []) m.sub[i].push(g);
    m.db = (spec[2] || []).slice();
    return m;
  };

  // ───────── Name it ─────────
  P.newName = function (level) {
    const mol = Mol.random(level);
    const answer = Mol.name(mol);
    const options = shuffle([answer, ...Mol.distractors(mol, 3)]);
    return { mol, answer, options, done: false };
  };
  P.answerName = function (q, i) {
    if (q.done) return null;
    q.done = true;
    q.choice = i;
    const st = P.state();
    const ok = q.options[i] === q.answer;
    let rp = 0;
    if (ok) {
      st.named++;
      st.streak++;
      st.best = Math.max(st.best, st.streak);
      rp = pay(1.5 + Math.min(st.streak, 10) * 0.25);
    } else st.streak = 0;
    q.result = { ok, rp };
    return q.result;
  };

  // ───────── Build it ─────────
  P.newBuild = function () {
    let target;
    for (let k = 0; k < 50; k++) { target = Mol.random(k < 25 ? 2 : 1); if (target.n >= 2) break; }
    return { target, answer: Mol.name(target), mol: Mol.make(3), tries: 0, done: false, revealed: false };
  };
  P.setLength = function (q, n) {
    n = CC.clamp(n, 1, Mol.MAX_N);
    const m = Mol.make(n);
    m.db = q.mol.db.filter((d) => d < n - 1);
    for (let i = 0; i < Math.min(n, q.mol.n); i++) for (const g of q.mol.sub[i]) if (Mol.canAdd(m, i, g)) m.sub[i].push(g);
    q.mol = m;
  };
  P.addGroup = function (q, i, g) {
    if (Mol.canAdd(q.mol, i, g)) q.mol.sub[i].push(g);
  };
  P.removeGroup = function (q, i, k) {
    q.mol.sub[i].splice(k, 1);
  };
  P.toggleDb = function (q, i) {
    const at = q.mol.db.indexOf(i);
    if (at >= 0) { q.mol.db.splice(at, 1); return; }
    const t = Mol.clone(q.mol);
    t.db.push(i);
    if (Mol.valid(t)) q.mol.db.push(i);
  };
  P.checkBuild = function (q) {
    if (q.done) return q.result;
    q.tries++;
    const got = Mol.name(q.mol);
    const ok = got === q.answer;
    let rp = 0;
    if (ok) {
      q.done = true;
      P.state().built++;
      rp = q.revealed ? 0 : pay(q.tries === 1 ? 4 : 2);
    }
    q.result = { ok, got, rp };
    return q.result;
  };

  // ───────── Mechanisms ─────────
  P.startMech = function (id) {
    return { id, step: 0, drawn: [], pending: null, mistakes: 0, msg: '', done: false };
  };
  P.mechStep = (st) => CC.MECH[st.id].steps[st.step];
  P.mechStepDone = (st) => {
    const s = P.mechStep(st);
    return !s.arrows || s.arrows.every((a) => st.drawn.some((d) => d[0] === a[0] && d[1] === a[1]));
  };
  P.tryArrow = function (st, from, to) {
    const s = P.mechStep(st);
    if (!s.arrows) return 'none';
    if (st.drawn.some((d) => d[0] === from && d[1] === to)) return 'dup';
    if (s.arrows.some((a) => a[0] === from && a[1] === to)) {
      st.drawn.push([from, to]);
      st.msg = P.mechStepDone(st) ? '' : 'Good — keep going.';
      return 'ok';
    }
    st.mistakes++;
    const fromOk = s.arrows.some((a) => a[0] === from);
    st.msg = fromOk
      ? 'Right electrons, wrong destination. Where is the electron-poor atom, or where should the bonding pair end up?'
      : from.startsWith('a:')
        ? 'Arrows start where electrons are: a lone pair (• •) or a bond — not a bare atom.'
        : 'Those electrons don\'t move in this step. Look for a lone pair on a nucleophile or a bond that breaks.';
    return 'wrong';
  };
  P.nextMechStep = function (st) {
    if (!P.mechStepDone(st)) return null;
    const m = CC.MECH[st.id];
    st.step++;
    st.drawn = [];
    st.pending = null;
    st.msg = '';
    if (!P.mechStep(st).arrows) {
      st.done = true;
      const ps = P.state();
      const first = !ps.mechs[st.id];
      ps.mechs[st.id] = (ps.mechs[st.id] || 0) + 1;
      const nArrows = m.steps.reduce((n, s) => n + (s.arrows ? s.arrows.length : 0), 0);
      st.rp = pay(nArrows * (first ? 2 : 1) * (st.mistakes === 0 ? 1.5 : 1));
    }
    return st;
  };

  // ───────── Synthesis routes ─────────
  const R = CC.ROUTES;
  const out = {};
  for (const [a, b, c] of R.E) (out[a] = out[a] || []).push({ to: b, cond: c });
  P.routeEdges = (id) => out[id] || [];
  function dist(from) {
    const d = { [from]: 0 }, q = [from];
    while (q.length) {
      const x = q.shift();
      for (const e of out[x] || []) if (d[e.to] == null) { d[e.to] = d[x] + 1; q.push(e.to); }
    }
    return d;
  }
  P.dist = dist;
  P.newRoute = function (minLen) {
    minLen = minLen || 2;
    for (let k = 0; k < 200; k++) {
      const start = pick(Object.keys(out));
      const d = dist(start);
      const far = Object.keys(d).filter((x) => d[x] >= minLen && d[x] <= 4);
      if (!far.length) continue;
      const target = pick(far);
      const r = { start, target, cur: start, path: [{ id: start }], strikes: 0, optimal: d[target], done: false, failed: false, msg: '' };
      r.maxSteps = r.optimal + 3;
      P.routeOptions(r);
      return r;
    }
    return null;
  };
  P.routeOptions = function (r) {
    const good = [...new Set(P.routeEdges(r.cur).map((e) => e.cond))];
    const others = shuffle(Object.values(R.C).filter((c) => !good.includes(c)));
    r.opts = shuffle(good.concat(others.slice(0, Math.max(2, 7 - good.length))));
  };
  P.routeMove = function (r, cond) {
    if (r.done || r.failed) return;
    const e = P.routeEdges(r.cur).find((x) => x.cond === cond);
    if (!e) {
      r.strikes++;
      r.msg = `No useful reaction: ${R.M[r.cur].name} doesn't react that way.`;
      if (r.strikes >= 3) { r.failed = true; r.msg += ' Three strikes — route abandoned.'; }
      return;
    }
    r.path.push({ cond, id: e.to });
    r.cur = e.to;
    r.msg = '';
    const steps = r.path.length - 1;
    if (r.cur === r.target) {
      r.done = true;
      const st = P.state();
      st.routes++;
      const optimal = steps === r.optimal;
      if (optimal) st.optimal++;
      r.rp = pay(3 * r.optimal * (optimal ? 1.5 : 1) * (r.strikes ? 0.7 : 1));
      return;
    }
    if (steps >= r.maxSteps) { r.failed = true; r.msg = 'Too many steps — the route is too long to be practical.'; return; }
    P.routeOptions(r);
  };
  // A shortest route (for "show solution").
  P.solveRoute = function (from, to) {
    const prev = { [from]: null }, q = [from];
    while (q.length) {
      const x = q.shift();
      if (x === to) break;
      for (const e of out[x] || []) if (!(e.to in prev)) { prev[e.to] = { from: x, cond: e.cond }; q.push(e.to); }
    }
    const steps = [];
    let x = to;
    while (prev[x]) { steps.unshift({ from: prev[x].from, cond: prev[x].cond, to: x }); x = prev[x].from; }
    return steps;
  };
})();
