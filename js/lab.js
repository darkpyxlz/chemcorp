var CC = (globalThis.CC = globalThis.CC || {});

// The manual reaction vessel. Reactions follow simple kinetics:
//   rate = k(T) · Π (remaining reagent)^order − reverse (for equilibria)
//   k(T) doubles every 10 °C; above the recommended window, side reactions destroy product.
// The reaction keeps going until the player works it up, so waiting longer gives more
// product with diminishing returns.
(function () {
  const G = CC.Game;
  const L = (CC.Lab = {});
  const MAX_SLOTS = 3;
  const K_EQ = 4; // equilibrium constant for esterifications
  const HIST_DT = 0.25;

  const lab = () => G.state().lab;

  L.slotIds = () => lab().slots.map((s) => s.id);

  L.add = function (id) {
    const b = lab();
    if (b.run || b.slots.some((s) => s.id === id)) return;
    if (b.slots.length >= MAX_SLOTS) return G.toast('The flask only has room for 3 reagents.', 'bad');
    b.slots.push({ id, eq: 1 });
    b.report = null;
  };
  L.remove = function (id) {
    const b = lab();
    if (b.run) return;
    b.slots = b.slots.filter((s) => s.id !== id);
    b.report = null;
  };
  L.stepEq = function (id, dir) {
    const s = lab().slots.find((x) => x.id === id);
    if (!s || lab().run) return;
    const i = G.EQ_STEPS.indexOf(s.eq);
    s.eq = G.EQ_STEPS[CC.clamp((i < 0 ? 2 : i) + dir, 0, G.EQ_STEPS.length - 1)];
  };
  L.setSolvent = (id) => { lab().solvent = id; };
  L.setAdditive = (id) => { lab().additive = id; };
  L.setAtm = function (a) {
    if (G.equip().atms.has(a) && !lab().run) lab().atm = a;
  };
  L.setTemp = function (t) {
    const e = G.equip();
    lab().set = CC.clamp(Math.round(t), e.tMin, e.tMax);
  };
  L.clear = function () {
    const b = lab();
    if (b.run) return;
    b.slots = [];
    b.report = null;
  };

  function snapshot(b) {
    return { slots: b.slots.map((s) => ({ ...s })), solvent: b.solvent, additive: b.additive, atm: b.atm, set: b.set };
  }
  function apply(setup) {
    const b = lab();
    b.slots = setup.slots.map((s) => ({ ...s }));
    b.solvent = setup.solvent;
    b.additive = setup.additive;
    b.atm = G.equip().atms.has(setup.atm) ? setup.atm : 'air';
    L.setTemp(setup.set);
    b.report = null;
  }
  L.repeat = function () {
    const b = lab();
    if (b.run || !b.last) return;
    apply(b.last);
  };
  L.load = function (rid) {
    const r = CC.RECIPE[rid];
    if (!r || !G.known(rid) || lab().run) return;
    apply({
      slots: Object.entries(r.reagents).map(([id, eq]) => ({ id, eq })),
      solvent: r.solvents[0],
      additive: r.additive ? r.additive.id : 'none',
      atm: r.atm || 'air',
      set: Math.round((r.temp[0] + r.temp[1]) / 2),
    });
    const miss = [];
    if (!G.isOwned(lab().solvent)) miss.push(CC.itemName(lab().solvent));
    if (!G.isOwned(lab().additive)) miss.push(CC.itemName(lab().additive));
    if (miss.length) G.toast(`Stock ${miss.join(' and ')} in the Market first.`, 'bad');
  };

  L.match = function (ids) {
    const key = [...ids].sort().join('|');
    return CC.RECIPES.find((r) => Object.keys(r.reagents).sort().join('|') === key) || null;
  };

  L.requirements = function () {
    const b = lab();
    const sc = G.scale();
    const r = L.match(L.slotIds());
    const reagents = b.slots.map((s) => ({ id: s.id, need: s.eq * sc, have: G.state().inv[s.id] || 0 }));
    const amt = r && r.additive && (b.additive === r.additive.id || (r.alt && r.alt[b.additive])) ? r.additive.amt : 0.1;
    const money = G.solventCost(b.solvent, sc) + G.additiveCost(b.additive, amt, sc);
    return { r, reagents, money, amt, sc };
  };

  L.buyMissing = function () {
    for (const x of L.requirements().reagents) {
      if (x.have < x.need && CC.ITEMS[x.id].kind === 'reagent') G.buy(x.id, x.need - x.have);
    }
  };

  function closest(ids) {
    let best = null, score = 0;
    for (const r of CC.RECIPES) {
      if (!G.researched(r)) continue;
      const keys = Object.keys(r.reagents);
      const common = keys.filter((k) => ids.includes(k)).length;
      const s = common / (keys.length + ids.length - common);
      if (common && s > score) { score = s; best = r; }
    }
    return best;
  }

  // ───────── kinetics ─────────
  // ~90% conversion at 4 × r.time for a perfect 1:1 run; technicians and mastery speed it up.
  L.k0 = (r) => ((Object.keys(r.reagents).length === 1 ? 2.3 : 9) / (r.time * 4)) * (r.eqm ? 0.3 : 1) * G.manualSpeed() * (1 + 0.06 * G.mastery(r.id));
  L.mid = (r) => (r.temp[0] + r.temp[1]) / 2;
  L.kT = (r, T) => Math.pow(2, (T - L.mid(r)) / 10);
  // Rate constant for product destruction (side reactions / decomposition) above the window.
  L.kSide = function (r, T) {
    if (T <= r.temp[1]) return 0;
    return L.k0(r) * (r.strict ? 0.5 : 0.01) * (Math.pow(2, (T - r.temp[1]) / 10) - 1);
  };
  // Isolation efficiency at work-up (filtration, recrystallisation losses).
  L.isolation = (r) => Math.min(0.99, (r.eqm ? 0.95 : Math.min(0.98, r.yield / 0.9)) * G.yieldMult(r));

  // d(extent)/dt at temperature T for run state {a, xi}.
  function rates(run, r, T) {
    const n = Object.keys(r.reagents).length;
    const order = n === 1 ? 1 : 2 / n;
    let f = 1;
    for (const id in r.reagents) f *= Math.pow(Math.max(0, run.a[id] / r.reagents[id] - run.xi), order);
    const k = L.k0(r) * L.kT(r, T) * run.kfac;
    let fwd = k * f;
    if (r.eqm) {
      const water = run.xi * (run.dean ? 0.05 : 1) + run.extraWater;
      fwd -= (k / K_EQ) * run.xi * water;
    }
    return { fwd, side: L.kSide(r, T) * Math.max(0, run.xi - run.lost) };
  }
  function step(run, r, T, dt) {
    const { fwd, side } = rates(run, r, T);
    const dx = Math.max(-run.xi, fwd * dt);
    run.xi = Math.min(run.theo, run.xi + dx);
    run.lost = Math.min(run.xi, run.lost + side * dt);
    return { fwd, side, dx };
  }
  L.yieldNow = (run) => (run.theo > 0 ? (run.xi - run.lost) / run.theo : 0);
  // Net rate of change of the yield fraction (per second).
  L.rateNow = function (run, T) {
    const r = CC.RECIPE[run.rid];
    const { fwd, side } = rates(run, r, T);
    return run.theo > 0 ? (fwd - side) / run.theo : 0;
  };
  // Predict the yield after `sec` more seconds at constant temperature T.
  L.project = function (run, T, sec) {
    const r = CC.RECIPE[run.rid];
    const c = { ...run };
    const dt = 0.1;
    for (let t = 0; t < sec; t += dt) step(c, r, T, dt);
    return L.yieldNow(c);
  };

  L.start = function () {
    const S = G.state();
    const b = lab();
    if (b.run) return;
    const ids = L.slotIds();
    if (!ids.length) return G.toast('Add some reagents to the flask first.', 'bad');
    const req = L.requirements();
    const r = req.r;

    if (!r || !G.researched(r)) {
      const near = closest(ids);
      b.report = r ? { type: 'locked', rid: r.id } : { type: 'none', near: near ? near.id : null };
      S.stats.failed++;
      return;
    }
    const missing = req.reagents.filter((x) => x.have < x.need - 1e-9);
    if (missing.length) { b.report = { type: 'missing', missing }; return; }
    if (!G.isOwned(b.solvent)) return G.toast(`You haven't stocked ${CC.itemName(b.solvent)}.`, 'bad');
    if (!G.isOwned(b.additive)) return G.toast(`You haven't stocked ${CC.itemName(b.additive)}.`, 'bad');
    if (S.money < req.money) return G.toast(`Solvent and additive cost ${CC.money(req.money)} — not enough money.`, 'bad');

    for (const x of req.reagents) {
      S.inv[x.id] -= x.need;
      if (S.inv[x.id] < 1e-9) delete S.inv[x.id];
    }
    S.money -= req.money;

    // Conditions set a multiplier on the rate constant (kfac). 0 = nothing happens.
    const factors = [];
    let fatal = null;
    const sv = b.solvent;
    if (r.fatalSolvent && r.fatalSolvent[sv]) { factors.push({ k: 'Solvent', f: 0, msg: r.fatalSolvent[sv] }); fatal = r.fatalSolvent[sv]; }
    else if (r.solvents.includes(sv)) factors.push({ k: 'Solvent', f: 1, msg: `${CC.itemName(sv)} — suitable.` });
    else if (r.solventFx && r.solventFx[sv]) factors.push({ k: 'Solvent', f: r.solventFx[sv][0], msg: r.solventFx[sv][1] });
    else factors.push({ k: 'Solvent', f: 0.4, msg: `${CC.itemName(sv)} is a poor medium here. Try: ${r.solvents.map(CC.itemName).join(' or ')}.` });

    const ad = b.additive;
    if (!r.additive) {
      factors.push(ad === 'none' ? { k: 'Catalyst', f: 1, msg: 'None needed.' } : { k: 'Catalyst', f: 0.85, msg: `${CC.itemName(ad)} wasn't needed and slowed things down.` });
    } else if (ad === r.additive.id) {
      factors.push({ k: 'Catalyst', f: 1, msg: `${CC.itemName(ad)} — correct.` });
    } else if (r.alt && r.alt[ad]) {
      factors.push({ k: 'Catalyst', f: r.alt[ad][0], msg: r.alt[ad][1] });
    } else if (ad === 'none') {
      const f = r.additive.missing != null ? r.additive.missing : 0.15;
      factors.push({ k: 'Catalyst', f, msg: r.additive.why || `Missing ${CC.itemName(r.additive.id)}.` });
    } else {
      factors.push({ k: 'Catalyst', f: 0.2, msg: `${CC.itemName(ad)} is the wrong additive. ${r.additive.why || ''}` });
    }

    if (r.atm) {
      if (b.atm === r.atm) factors.push({ k: 'Atmosphere', f: 1, msg: `${G.ATMS[b.atm].name} — correct.` });
      else {
        const fx = (r.atmFx && r.atmFx[b.atm]) || [0.5, `This reaction wants ${G.ATMS[r.atm].name}.`];
        factors.push({ k: 'Atmosphere', f: fx[0], msg: fx[1] });
      }
    } else if (b.atm === 'h2' || b.atm === 'co') {
      factors.push({ k: 'Atmosphere', f: 0.8, msg: `${G.ATMS[b.atm].name} wasn't needed and interfered.` });
    }
    const kfac = fatal ? 0 : factors.reduce((p, f) => p * f.f, 1);

    const a = {};
    for (const s of b.slots) a[s.id] = s.eq;
    let theo = Infinity, limiting = null;
    for (const id in r.reagents) { const v = a[id] / r.reagents[id]; if (v < theo) { theo = v; limiting = id; } }
    const excess = Object.keys(r.reagents).filter((id) => a[id] / r.reagents[id] > theo + 1e-6);

    b.last = snapshot(b);
    b.report = null;
    b.run = {
      rid: r.id, t: 0, xi: 0, lost: 0, theo, limiting, excess, a, kfac, fatal, factors, scale: req.sc,
      dean: !!(r.eqm && !r.noDean && G.flag('deanstark')), extraWater: r.eqm && sv === 's_water' ? 3 : 0,
      hist: [[0, 0, b.T]], histT: 0, sumT: 0, peak: 0, r0: null,
    };
    G.dirty();
  };

  L.workup = function () {
    if (lab().run) finish();
  };
  L.abort = function () {
    const b = lab();
    if (!b.run) return;
    b.report = { type: 'abort', rid: b.run.rid };
    b.run = null;
    G.dirty();
  };

  L.maxTime = (r) => r.time * 60;

  L.tick = function (dt) {
    const b = lab();
    const e = G.equip();
    if (b.set < e.tMin || b.set > e.tMax) b.set = CC.clamp(b.set, e.tMin, e.tMax);
    const run = b.run;
    let exo = 0;
    if (run) {
      const r = CC.RECIPE[run.rid];
      // integrate in small sub-steps for stability
      const n = Math.max(1, Math.ceil(dt / 0.05));
      for (let i = 0; i < n; i++) {
        const h = dt / n;
        const { dx } = step(run, r, b.T, h);
        exo = r.exo * Math.max(0, dx / h) * r.time * 0.15;
        b.T += ((b.set - b.T) * e.rate + exo) * h + (Math.random() - 0.5) * e.noise * h;
        b.T = CC.clamp(b.T, -40, 320);
      }
      run.t += dt;
      run.sumT += b.T * dt;
      if (run.r0 == null && run.t >= 0.5) run.r0 = L.yieldNow(run) / run.t;
      const y = L.yieldNow(run);
      run.peak = Math.max(run.peak, y);
      if (run.t - run.histT >= HIST_DT) {
        run.histT = run.t;
        run.hist.push([+run.t.toFixed(2), +y.toFixed(4), +b.T.toFixed(1)]);
        if (run.hist.length > 600) run.hist = run.hist.filter((_, i) => i % 2 === 0);
      }
      if (run.t >= L.maxTime(r)) finish();
      return;
    }
    b.T += (b.set - b.T) * e.rate * dt + (Math.random() - 0.5) * e.noise * dt;
  };

  function finish() {
    const S = G.state();
    const b = lab();
    const run = b.run;
    const r = CC.RECIPE[run.rid];
    b.run = null;

    const conv = Math.max(0, L.yieldNow(run)); // fraction of theoretical in the flask
    const iso = L.isolation(r);
    const y = conv * iso; // isolated yield vs limiting reagent
    const made = run.theo * conv * iso; // batch units of product

    const out = [];
    for (const p in r.products) {
      const amt = r.products[p] * run.scale * made;
      if (amt > 1e-9) { G.addInv(p, amt); out.push({ id: p, amt }); }
    }

    const avgT = run.t > 0 ? run.sumT / run.t : b.T;
    const lostFrac = run.xi > 0 ? run.lost / run.theo : 0;
    const success = y >= 0.3 && made >= 0.3;
    const rec = G.rec(r.id);
    const first = success && rec.runs < 1;
    let rp = 0;
    if (success) {
      const before = G.mastery(r.id);
      rec.runs += 1;
      rec.manual += 1;
      rp = r.rp * y * G.rpMult() + (first ? r.rp * 10 : 0);
      G.gainRp(rp);
      if (!first && G.mastery(r.id) > before) G.toast(`${r.name} reached mastery ★${G.mastery(r.id)}`, 'good');
      if (G.runs(r.id) === G.automateAt(r) && G.flag('automation')) G.toast(`${r.name} can now be automated in the Plant!`, 'good');
    } else S.stats.failed++;
    rec.best = Math.max(rec.best || 0, y);
    S.stats.manualRuns++;

    // half-time: first time the curve reached half of its peak
    const half = run.hist.find((h) => h[1] >= run.peak / 2);
    let tmsg = `Average ${avgT.toFixed(0)} °C (recommended ${r.temp[0]}–${r.temp[1]} °C).`;
    if (avgT < r.temp[0] - 5) tmsg += ` Too cold: the rate constant was ~${CC.fmt(1 / L.kT(r, avgT), 1)}× lower than at the midpoint.`;
    else if (lostFrac > 0.02) tmsg += ` Too hot: side reactions destroyed ${CC.pct(lostFrac)} of the product.`;
    const kin = { k: 'Kinetics', f: conv, msg: `${CC.pct(conv)} conversion after ${run.t.toFixed(1)} s${half && run.peak > 0.05 ? ` · t½ ≈ ${half[0].toFixed(1)} s` : ''}${run.r0 ? ` · initial rate ${CC.fmt(run.r0 * 100, 1)} %/s` : ''}.`, pct: true };
    const sto = {
      k: 'Stoichiometry', f: Math.min(1, run.theo), pct: true,
      msg: `Limiting reagent: ${CC.ITEMS[run.limiting].name} (${CC.fmt(run.theo)} batch${run.theo === 1 ? '' : 'es'} max).${run.excess.length ? ` Excess ${run.excess.map((x) => CC.ITEMS[x].name).join(', ')} sped things up${r.eqm ? ' and pushed the equilibrium' : ''}; the leftover is lost.` : ''}`,
    };
    const factors = run.factors.map((f) => ({ ...f, rate: true }));
    factors.push({ k: 'Temperature', f: Math.max(0, 1 - lostFrac), msg: tmsg }, kin, sto, { k: 'Isolation', f: iso, msg: 'Work-up and purification losses (better with mastery and recrystallisation).' });
    if (r.eqm) factors.push({ k: 'Equilibrium', f: 1, msg: run.dean ? 'The Dean–Stark trap removed water, so the equilibrium kept moving to products.' : 'Esterification is reversible (K ≈ 4): water builds up and the reverse reaction catches up. Excess alcohol or a Dean–Stark trap helps.', info: true });

    b.report = { type: 'result', rid: r.id, y, made, conv, factors, out, rp, first, success, fatal: run.fatal, hist: run.hist, theo: run.theo };
    G.dirty();
  }
})();
