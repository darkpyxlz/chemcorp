var CC = (globalThis.CC = globalThis.CC || {});

// The manual reaction vessel: setup, matching a recipe, temperature control and the yield report.
(function () {
  const G = CC.Game;
  const L = (CC.Lab = {});
  const AMBIENT = 22;
  const MAX_SLOTS = 3;

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
  // Fill the vessel with a known procedure (correct reagents, eq and conditions).
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

  // What the current setup needs, for display and the start check.
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

  // Most-overlapping researched recipe — used to nudge the player after a non-reaction.
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
      b.report = r
        ? { type: 'locked', rid: r.id }
        : { type: 'none', near: near ? near.id : null };
      S.stats.failed++;
      return;
    }
    const missing = req.reagents.filter((x) => x.have < x.need - 1e-9);
    if (missing.length) {
      b.report = { type: 'missing', missing };
      return;
    }
    if (!G.isOwned(b.solvent)) return G.toast(`You haven't stocked ${CC.itemName(b.solvent)}.`, 'bad');
    if (!G.isOwned(b.additive)) return G.toast(`You haven't stocked ${CC.itemName(b.additive)}.`, 'bad');
    if (S.money < req.money) return G.toast(`Solvent and additive cost ${CC.money(req.money)} — not enough money.`, 'bad');

    for (const x of req.reagents) {
      S.inv[x.id] -= x.need;
      if (S.inv[x.id] < 1e-9) delete S.inv[x.id];
    }
    S.money -= req.money;

    // Static factors, fixed at the start of the run.
    const factors = [];
    let fatal = false;
    // Solvent
    const sv = b.solvent;
    if (r.fatalSolvent && r.fatalSolvent[sv]) { factors.push({ k: 'Solvent', f: 0, msg: r.fatalSolvent[sv] }); fatal = true; }
    else if (r.solvents.includes(sv)) factors.push({ k: 'Solvent', f: 1, msg: `${CC.itemName(sv)} — suitable.` });
    else if (r.solventFx && r.solventFx[sv]) factors.push({ k: 'Solvent', f: r.solventFx[sv][0], msg: r.solventFx[sv][1] });
    else factors.push({ k: 'Solvent', f: 0.4, msg: `${CC.itemName(sv)} is a poor medium here. Try: ${r.solvents.map(CC.itemName).join(' or ')}.` });
    // Additive
    const ad = b.additive;
    if (!r.additive) {
      factors.push(ad === 'none'
        ? { k: 'Additive', f: 1, msg: 'None needed.' }
        : { k: 'Additive', f: 0.85, msg: `${CC.itemName(ad)} wasn't needed and caused side reactions.` });
    } else if (ad === r.additive.id) {
      factors.push({ k: 'Additive', f: 1, msg: `${CC.itemName(ad)} — correct.` });
    } else if (r.alt && r.alt[ad]) {
      factors.push({ k: 'Additive', f: r.alt[ad][0], msg: r.alt[ad][1] });
    } else if (ad === 'none') {
      const f = r.additive.missing != null ? r.additive.missing : 0.15;
      factors.push({ k: 'Additive', f, msg: r.additive.why || `Missing ${CC.itemName(r.additive.id)}.` });
      if (f === 0) fatal = true;
    } else {
      factors.push({ k: 'Additive', f: 0.2, msg: `${CC.itemName(ad)} is the wrong additive. ${r.additive.why || ''}` });
    }
    // Atmosphere
    if (r.atm) {
      if (b.atm === r.atm) factors.push({ k: 'Atmosphere', f: 1, msg: `${G.ATMS[b.atm].name} — correct.` });
      else {
        const fx = (r.atmFx && r.atmFx[b.atm]) || [0.5, `This reaction wants ${G.ATMS[r.atm].name}.`];
        factors.push({ k: 'Atmosphere', f: fx[0], msg: fx[1] });
        if (fx[0] === 0) fatal = true;
      }
    } else if (b.atm === 'h2' || b.atm === 'co') {
      factors.push({ k: 'Atmosphere', f: 0.8, msg: `${G.ATMS[b.atm].name} wasn't needed and interfered.` });
    }
    // Stoichiometry
    let extent = Infinity, limiting = null;
    for (const s of b.slots) {
      const ratio = s.eq / r.reagents[s.id];
      if (ratio < extent) { extent = ratio; limiting = s.id; }
    }
    extent = Math.min(1, extent);
    const excess = b.slots.filter((s) => s.eq / r.reagents[s.id] > extent + 1e-6).map((s) => s.id);
    const stoMsg = extent >= 1 && !excess.length
      ? 'Perfect ratio.'
      : `${extent < 1 ? `Limiting reagent: ${CC.ITEMS[limiting].name} (only ${CC.pct(extent)} of a full batch). ` : ''}${excess.length ? `Wasted excess: ${excess.map((x) => CC.ITEMS[x].name).join(', ')}.` : ''}`;
    factors.push({ k: 'Stoichiometry', f: extent, msg: stoMsg, sto: true });

    b.last = snapshot(b);
    b.report = null;
    b.run = { rid: r.id, t: 0, dur: G.manualTime(r), score: 0, below: 0, above: 0, tt: 0, noise: Math.random(), factors, extent, scale: req.sc, fatal };
    G.dirty();
  };

  L.stir = function () {
    const run = lab().run;
    if (run) run.t = Math.min(run.dur, run.t + run.dur * 0.04);
  };
  L.abort = function () {
    const b = lab();
    if (!b.run) return;
    b.report = { type: 'abort', rid: b.run.rid };
    b.run = null;
    G.dirty();
  };

  L.tempScore = function (r, T) {
    const [lo, hi] = r.temp;
    if (T >= lo && T <= hi) return 1;
    const d = T < lo ? lo - T : T - hi;
    return Math.max(0, 1 - d / (r.strict ? 6 : 20));
  };

  L.tick = function (dt) {
    const b = lab();
    const e = G.equip();
    if (b.set < e.tMin || b.set > e.tMax) b.set = CC.clamp(b.set, e.tMin, e.tMax);
    const run = b.run;
    const r = run ? CC.RECIPE[run.rid] : null;
    let exo = 0;
    if (run && r.exo) {
      run.noise = CC.clamp(run.noise + (Math.random() - 0.5) * dt * 1.5, 0, 1);
      const progress = run.t / run.dur;
      exo = r.exo * (0.5 + run.noise) * (1 - 0.6 * progress);
    }
    b.T += ((b.set - b.T) * e.rate + exo) * dt + (Math.random() - 0.5) * e.noise * dt;
    if (!run) return;
    run.t += dt;
    run.tt += dt;
    run.score += L.tempScore(r, b.T) * dt;
    if (b.T < r.temp[0]) run.below += dt;
    else if (b.T > r.temp[1]) run.above += dt;
    if (run.t >= run.dur) finish();
  };

  function finish() {
    const S = G.state();
    const b = lab();
    const run = b.run;
    const r = CC.RECIPE[run.rid];
    b.run = null;

    const tf = run.tt > 0 ? run.score / run.tt : 0;
    let tmsg = `${CC.pct(tf)} of the run spent in the ${r.temp[0]}–${r.temp[1]} °C window.`;
    if (tf < 0.9) {
      if (run.above > run.below) tmsg += r.strict ? ' Too hot — the product decomposed.' : ' Too hot — side reactions crept in.';
      else tmsg += ' Too cold — the reaction barely moved.';
    }
    const factors = run.factors.slice();
    factors.splice(factors.length - 1, 0, { k: 'Temperature', f: Math.max(0.03, tf), msg: tmsg });

    let y = G.baseYield(r) * G.yieldMult(r);
    for (const f of factors) if (!f.sto) y *= f.f;
    y = Math.min(0.99, y);
    if (run.fatal) y = 0;

    const out = [];
    for (const p in r.products) {
      const amt = r.products[p] * run.scale * run.extent * y;
      if (amt > 1e-9) { G.addInv(p, amt); out.push({ id: p, amt }); }
    }

    const success = y * run.extent >= 0.3;
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
    rec.best = Math.max(rec.best || 0, y * run.extent);
    S.stats.manualRuns++;

    b.report = { type: 'result', rid: r.id, y, extent: run.extent, factors, out, rp, first, success, fatal: run.fatal };
    G.dirty();
  }

  L.AMBIENT = AMBIENT;
})();
