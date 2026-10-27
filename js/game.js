var CC = (globalThis.CC = globalThis.CC || {});

// Game state and rules. No DOM access here — the UI listens through G.on().
(function () {
  const G = (CC.Game = {});
  const SAVE_KEY = 'chemcorp-save-v1';
  const OFFLINE_CAP = 8 * 3600;
  const DEMAND_FLOOR = 0.2;
  const DEMAND_RECOVERY = 0.01; // fraction of the gap recovered per second
  const MARKET_SIZE = 150; // batches a market absorbs before prices fall to the floor
  const AUTO_TIME = 1.5; // automated cycle = manual time × this
  const AUTOBUY_FEE = 1.1;

  G.SCALES = [
    { n: 1, name: '100 mL round-bottom flask', cost: 0 },
    { n: 2, name: '250 mL round-bottom flask', cost: 120 },
    { n: 5, name: '1 L round-bottom flask', cost: 700 },
    { n: 10, name: '2 L three-neck flask', cost: 3500 },
    { n: 25, name: '5 L jacketed reactor', cost: 18000 },
    { n: 50, name: '20 L jacketed reactor', cost: 90000 },
    { n: 100, name: '50 L kilo-lab reactor', cost: 450000 },
    { n: 250, name: '200 L pilot plant', cost: 2.5e6 },
    { n: 500, name: '1,000 L production vessel', cost: 1.5e7 },
    { n: 1000, name: '5,000 L production vessel', cost: 1e8 },
  ];
  G.MASTERY = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
  G.AUTOMATE_AT = [0, 5, 8, 10, 12, 15, 20];
  G.EQ_STEPS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6];
  G.ATMS = {
    air: { name: 'Air', icon: '🌬️' },
    n2: { name: 'N₂ (inert)', icon: '🫧' },
    h2: { name: 'H₂ (pressure)', icon: '🎈' },
    co: { name: 'CO (pressure)', icon: '☁️' },
  };
  G.CLIENTS = ['Sunrise Soaps', 'Orchard Flavours', 'Northgate Pharma', 'Helixa Biotech', 'Bluewater Labs', 'Crescent Coatings', 'Polaris Polymers', 'Meridian Health', 'Aurora Displays', 'Kestrel Dyes', 'Juniper Fragrances', 'Cobalt Materials'];

  G.UPGRADES = [
    { id: 'scale', name: 'Reaction vessel', icon: '⚗️', max: G.SCALES.length - 1,
      cost: (l) => (G.SCALES[l + 1] ? G.SCALES[l + 1].cost : Infinity),
      desc: (l) => `Every batch (manual and automated) uses ×${G.SCALES[l].n} the reagents and makes ×${G.SCALES[l].n} the product. Current: ${G.SCALES[l].name}.`,
      next: (l) => (G.SCALES[l + 1] ? `Upgrade to ${G.SCALES[l + 1].name} (×${G.SCALES[l + 1].n})` : '') },
    { id: 'techs', name: 'Lab technicians', icon: '🧑‍🔬', max: 20, cost: (l) => 60 * Math.pow(1.7, l),
      desc: (l) => `Manual reactions run ${15 * l}% faster.`, next: () => '+15% manual speed' },
    { id: 'sales', name: 'Sales team', icon: '📈', max: 60, cost: (l) => 150 * Math.pow(1.75, l),
      desc: (l) => `+${6 * l}% on all sale prices.`, next: () => '+6% sale prices' },
    { id: 'marketing', name: 'Marketing', icon: '📣', max: 40, cost: (l) => 400 * Math.pow(1.8, l),
      desc: (l) => `Markets absorb ${25 * l}% more product before prices drop.`, next: () => '+25% market size' },
    { id: 'postdoc', name: 'Postdoctoral researchers', icon: '🎓', max: 200, cost: (l) => 200 * Math.pow(1.45, l),
      desc: (l) => `Generate ${CC.fmt(0.2 * l)} RP per second.`, next: () => '+0.2 RP/s' },
    { id: 'rotavap', name: 'Rotary evaporator', icon: '🌀', max: 1, cost: () => 600,
      desc: (l) => (l ? 'Solvent is recovered and reused: solvent costs −60%.' : 'Recover and reuse solvent: −60% solvent costs.'), next: () => 'Solvent costs −60%' },
    { id: 'maint', name: 'Reactor maintenance', icon: '🔧', max: 40, req: 'automation', cost: (l) => 600 * Math.pow(1.8, l),
      desc: (l) => `Automated reactors cycle ${12 * l}% faster.`, next: () => '+12% reactor speed' },
  ];
  G.UPGRADE = {};
  for (const u of G.UPGRADES) G.UPGRADE[u.id] = u;

  // ───────── events ─────────
  const listeners = [];
  G.on = (fn) => listeners.push(fn);
  G.emit = (type, data) => { for (const fn of listeners) fn(type, data); };
  G.toast = (msg, kind) => G.emit('toast', { msg, kind: kind || 'info' });
  G.dirty = () => G.emit('dirty');

  let S = null;
  let D = null; // cache derived from researched tech
  G.state = () => S;

  function defaultSettings() {
    return { theme: 'light', notation: 'standard', autosave: 15, offline: true, news: true, confirm: true };
  }
  G.defaultSettings = defaultSettings;

  function fresh() {
    return {
      v: 1,
      money: 25,
      rp: 0,
      patents: 0,
      inv: { acoh: 4, etoh: 4 },
      owned: { s_water: true, a_h2so4: true },
      tech: { t_basics: true },
      up: {},
      recipes: {},
      reactors: {},
      autoSell: {},
      autoBuy: true,
      demand: {},
      courses: {},
      school: null,
      settings: defaultSettings(),
      contracts: [],
      nextContractAt: Date.now() + 45000,
      contractSeq: 0,
      goals: {},
      revealed: {},
      lab: { slots: [], solvent: 'none', additive: 'none', atm: 'air', set: 22, T: 22, run: null, last: null, report: null },
      stats: { lifetimeEarned: 0, runEarned: 0, manualRuns: 0, autoBatches: 0, bought: 0, sold: 0, quizCorrect: 0, playTime: 0, prestiges: 0, contracts: 0, failed: 0 },
      time: Date.now(),
      created: Date.now(),
    };
  }

  G.recalc = function () {
    D = { flags: new Set(), tMin: 15, tMax: 100, atms: new Set(['air']), recipes: new Set() };
    for (const t of CC.TECH) {
      if (!S.tech[t.id]) continue;
      const fx = t.fx || {};
      if (fx.flag) D.flags.add(fx.flag);
      if (fx.tempMin != null) D.tMin = Math.min(D.tMin, fx.tempMin);
      if (fx.tempMax != null) D.tMax = Math.max(D.tMax, fx.tempMax);
      (fx.atm || []).forEach((a) => D.atms.add(a));
      (fx.recipes || []).forEach((r) => D.recipes.add(r));
    }
  };

  // ───────── derived values ─────────
  G.flag = (f) => D.flags.has(f);
  G.researched = (r) => D.recipes.has(typeof r === 'string' ? r : r.id);
  G.equip = () => ({
    tMin: D.tMin, tMax: D.tMax, atms: D.atms,
    rate: D.flags.has('pid') ? 1.1 : 0.5,
    noise: D.flags.has('pid') ? 0.6 : 1.6,
  });
  G.lvl = (id) => S.up[id] || 0;
  G.scale = () => G.SCALES[G.lvl('scale')].n;
  G.manualSpeed = () => 1 + 0.15 * G.lvl('techs');
  G.autoSpeed = () => (1 + 0.12 * G.lvl('maint')) * (G.flag('flow') ? 1.5 : 1) * (G.flag('ai') ? 1.5 : 1);
  G.autoQuality = () => 0.75 + (G.flag('process') ? 0.1 : 0) + (G.flag('ai') ? 0.1 : 0);
  G.sellMult = () => (1 + 0.06 * G.lvl('sales')) * (1 + 0.1 * S.patents);
  G.rpMult = () => 1 + 0.1 * S.patents;
  G.marketSize = () => MARKET_SIZE * G.scale() * (1 + 0.25 * G.lvl('marketing'));
  G.rpPerSec = () => 0.2 * G.lvl('postdoc') * G.rpMult();

  G.rec = (rid) => S.recipes[rid] || (S.recipes[rid] = { runs: 0, manual: 0, best: 0 });
  G.runs = (rid) => (S.recipes[rid] ? S.recipes[rid].runs : 0);
  G.mastery = function (rid) {
    const n = G.runs(rid);
    let l = 0;
    while (l < G.MASTERY.length && n >= G.MASTERY[l]) l++;
    return l;
  };
  G.known = (rid) => G.runs(rid) >= 1 || !!S.revealed[rid];
  G.automateAt = (r) => G.AUTOMATE_AT[r.tier];
  G.canAutomate = (r) => G.flag('automation') && G.researched(r) && G.runs(r.id) >= G.automateAt(r);

  G.baseYield = (r) => (r.eqm && !r.noDean && G.flag('deanstark') ? Math.max(r.yield, 0.92) : r.yield);
  G.yieldMult = (r) => (G.flag('recryst') ? 1.08 : 1) * (1 + 0.02 * G.mastery(r.id));
  G.autoYield = (r) => Math.min(0.99, G.baseYield(r) * G.autoQuality() * G.yieldMult(r));
  G.manualTime = (r) => r.time / G.manualSpeed() / (1 + 0.06 * G.mastery(r.id));
  G.cycleTime = (r) => (r.time * AUTO_TIME) / G.autoSpeed() / (1 + 0.06 * G.mastery(r.id));

  G.solventCost = (id, scale) => (id === 'none' || !CC.ITEMS[id] ? 0 : CC.ITEMS[id].use * scale * (G.lvl('rotavap') ? 0.4 : 1));
  G.additiveCost = (id, amt, scale) => (id === 'none' || !CC.ITEMS[id] ? 0 : CC.ITEMS[id].use * amt * scale);
  G.isOwned = (id) => id === 'none' || !!S.owned[id];

  G.demand = (id) => (S.demand[id] == null ? 1 : S.demand[id]);
  G.price = function (id) {
    const it = CC.ITEMS[id];
    if (!it) return 0;
    if (it.kind === 'reagent') return it.cost * 0.5;
    if (it.sellable === false) return 0;
    return it.value * G.demand(id) * G.sellMult();
  };
  G.canSell = (id) => G.price(id) > 0;

  // Reagents & stockroom items whose use is relevant to something researched.
  G.relevant = function () {
    const set = new Set();
    for (const r of CC.RECIPES) {
      if (!G.researched(r)) continue;
      Object.keys(r.reagents).forEach((x) => set.add(x));
      r.solvents.forEach((x) => set.add(x));
      Object.keys(r.solventFx || {}).forEach((x) => set.add(x));
      if (r.additive) set.add(r.additive.id);
      Object.keys(r.alt || {}).forEach((x) => set.add(x));
    }
    for (const it of CC.ITEM_LIST) if (it.always) set.add(it.id);
    return set;
  };

  // ───────── money / RP ─────────
  let incomeAcc = 0, rpAcc = 0, rateTimer = 0;
  G.rates = { money: 0, rp: 0 };
  function earn(amount) {
    S.money += amount;
    S.stats.lifetimeEarned += amount;
    S.stats.runEarned += amount;
    incomeAcc += amount;
  }
  function gainRp(x) {
    S.rp += x;
    rpAcc += x;
  }
  G.earn = earn;
  G.gainRp = gainRp;

  // ───────── market ─────────
  G.buy = function (id, qty) {
    const it = CC.ITEMS[id];
    if (!it || it.kind !== 'reagent' || !(qty > 0)) return false;
    const cost = it.cost * qty;
    if (S.money < cost - 1e-9) return G.toast(`Not enough money for ${CC.fmt(qty)} mol ${it.name}.`, 'bad'), false;
    S.money -= cost;
    const isNew = !S.inv[id];
    S.inv[id] = (S.inv[id] || 0) + qty;
    S.stats.bought += qty;
    if (isNew) G.dirty();
    return true;
  };
  G.buyMax = function (id) {
    const it = CC.ITEMS[id];
    const q = Math.floor(S.money / it.cost);
    return q > 0 ? G.buy(id, q) : false;
  };

  G.stock = function (id) {
    const it = CC.ITEMS[id];
    if (!it || S.owned[id]) return false;
    if (S.money < it.unlock) return G.toast(`Stocking ${it.name} costs ${CC.money(it.unlock)}.`, 'bad'), false;
    S.money -= it.unlock;
    S.owned[id] = true;
    G.toast(`${it.name} added to your stockroom.`, 'good');
    G.dirty();
    return true;
  };

  // Revenue for selling qty, integrating the price drop as demand falls.
  function saleValue(id, qty, apply) {
    const it = CC.ITEMS[id];
    if (it.kind === 'reagent') return it.cost * 0.5 * qty;
    let d = G.demand(id);
    const M = G.marketSize();
    const delta = qty / M;
    let avg;
    if (d - delta >= DEMAND_FLOOR) {
      avg = d - delta / 2;
      d -= delta;
    } else {
      const q1 = Math.max(0, (d - DEMAND_FLOOR) * M);
      avg = q1 > 0 ? (q1 * (d + DEMAND_FLOOR) / 2 + (qty - q1) * DEMAND_FLOOR) / qty : DEMAND_FLOOR;
      d = DEMAND_FLOOR;
    }
    if (apply) S.demand[id] = d;
    return it.value * avg * G.sellMult() * qty;
  }
  G.quoteSale = (id, qty) => saleValue(id, qty, false);

  G.sell = function (id, qty) {
    if (!G.canSell(id)) return false;
    qty = Math.min(qty, S.inv[id] || 0);
    if (qty <= 1e-9) return false;
    const v = saleValue(id, qty, true);
    S.inv[id] -= qty;
    if (S.inv[id] < 1e-9) { delete S.inv[id]; G.dirty(); }
    S.stats.sold += qty;
    earn(v);
    return v;
  };

  function sellDirect(id, qty) {
    if (!G.canSell(id) || qty <= 0) return 0;
    const v = saleValue(id, qty, true);
    S.stats.sold += qty;
    earn(v);
    return v;
  }

  G.addInv = function (id, qty) {
    if (!(qty > 0)) return;
    const isNew = !S.inv[id];
    S.inv[id] = (S.inv[id] || 0) + qty;
    if (isNew) G.dirty();
  };

  // ───────── upgrades & research ─────────
  G.upgradeCost = (id) => G.UPGRADE[id].cost(G.lvl(id));
  G.upgradeVisible = (u) => !u.req || G.flag(u.req);
  G.buyUpgrade = function (id) {
    const u = G.UPGRADE[id];
    const l = G.lvl(id);
    if (!u || l >= u.max || !G.upgradeVisible(u)) return false;
    const c = u.cost(l);
    if (S.money < c) return false;
    S.money -= c;
    S.up[id] = l + 1;
    G.dirty();
    return true;
  };

  G.techState = function (t) {
    if (S.tech[t.id]) return 'done';
    if (!t.req.every((r) => S.tech[r])) return 'locked';
    return 'open';
  };
  G.coursePassed = (cid) => !!(S.courses[cid] && S.courses[cid].passed);
  G.canResearch = (t) =>
    G.techState(t) === 'open' && (!t.course || G.coursePassed(t.course)) && S.rp >= t.rp && S.money >= t.money;
  G.research = function (id) {
    const t = CC.TECH_BY_ID[id];
    if (!t || !G.canResearch(t)) return false;
    S.rp -= t.rp;
    S.money -= t.money;
    S.tech[id] = true;
    G.recalc();
    G.toast(`Researched: ${t.name}`, 'good');
    G.dirty();
    return true;
  };

  G.revealCost = (r) => r.rp * 10;
  G.reveal = function (rid) {
    const r = CC.RECIPE[rid];
    if (!r || G.known(rid)) return false;
    const c = G.revealCost(r);
    if (S.rp < c) return G.toast(`Need ${CC.fmt(c)} RP to look this procedure up.`, 'bad'), false;
    S.rp -= c;
    S.revealed[rid] = true;
    G.dirty();
    return true;
  };

  // ───────── plant (automation) ─────────
  G.reactorCost = function (r) {
    const n = S.reactors[r.id] ? S.reactors[r.id].n : 0;
    let v = 0;
    for (const p in r.products) v += (CC.ITEMS[p].value || 0) * r.products[p];
    if (!v) for (const x in r.reagents) v += (CC.ITEMS[x].cost || 40) * r.reagents[x] * 1.5;
    return Math.round(Math.max(50, v * 15) * Math.pow(1.5, n));
  };
  G.buildReactor = function (rid) {
    const r = CC.RECIPE[rid];
    if (!r || !G.canAutomate(r)) return false;
    const c = G.reactorCost(r);
    if (S.money < c) return false;
    S.money -= c;
    const g = S.reactors[rid] || (S.reactors[rid] = { n: 0, on: true, p: 0, status: 'idle', why: '' });
    g.n++;
    G.dirty();
    return true;
  };
  // Build as many reactors for one recipe as money allows.
  G.buildMax = function (rid) {
    let n = 0;
    while (n < 1000 && G.buildReactor(rid)) n++;
    return n;
  };
  // Spend money on reactors across every automatable recipe, cheapest first.
  G.maxAll = function () {
    const rs = CC.RECIPES.filter((r) => G.canAutomate(r) && S.reactors[r.id] && S.reactors[r.id].n > 0);
    let n = 0;
    while (n < 5000 && rs.length) {
      const r = rs.reduce((a, b) => (G.reactorCost(a) <= G.reactorCost(b) ? a : b));
      if (!G.buildReactor(r.id)) break;
      n++;
    }
    return n;
  };
  G.setAllReactors = function (on) {
    for (const id in S.reactors) S.reactors[id].on = on;
  };
  G.toggleReactor = function (rid) {
    const g = S.reactors[rid];
    if (g) g.on = !g.on;
  };

  // The SOP an automated reactor follows.
  G.sop = (r) => ({ solvent: r.solvents[0], additive: r.additive ? r.additive.id : 'none', amt: r.additive ? r.additive.amt : 0 });

  // Run up to `want` batches of recipe r; returns how many actually ran (fractional allowed).
  function autoRun(r, want, g) {
    const sc = G.scale();
    const sop = G.sop(r);
    if (!G.isOwned(sop.solvent) || !G.isOwned(sop.additive)) {
      g.status = 'blocked';
      g.why = `Stock ${CC.itemName(!G.isOwned(sop.solvent) ? sop.solvent : sop.additive)} in the Market`;
      return 0;
    }
    if (r.atm && !D.atms.has(r.atm)) { g.status = 'blocked'; g.why = 'Needs ' + G.ATMS[r.atm].name; return 0; }
    const fixed = G.solventCost(sop.solvent, sc) + G.additiveCost(sop.additive, sop.amt, sc);
    const autobuy = G.flag('autobuy') && S.autoBuy;
    const ids = Object.keys(r.reagents);
    let k = want;
    let limiter = '';
    // Reagents we cannot buy (intermediates) cap k directly.
    for (const id of ids) {
      const need = r.reagents[id] * sc;
      const have = S.inv[id] || 0;
      if (!(autobuy && CC.ITEMS[id].kind === 'reagent') && have / need < k) { k = have / need; limiter = CC.ITEMS[id].name; }
    }
    const cost = (kk) => {
      let c = fixed * kk;
      if (autobuy) for (const id of ids) {
        const it = CC.ITEMS[id];
        if (it.kind !== 'reagent') continue;
        c += Math.max(0, r.reagents[id] * sc * kk - (S.inv[id] || 0)) * it.cost * AUTOBUY_FEE;
      }
      return c;
    };
    if (cost(k) > S.money) {
      let lo = 0, hi = k;
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (cost(m) <= S.money) lo = m; else hi = m; }
      k = lo;
      limiter = 'funds';
    }
    if (k < 1e-4) {
      g.status = 'starved';
      g.why = limiter === 'funds' ? 'Out of money' : `Out of ${limiter}`;
      return 0;
    }
    // Execute.
    for (const id of ids) {
      const need = r.reagents[id] * sc * k;
      const have = S.inv[id] || 0;
      if (have < need) {
        const buy = need - have;
        S.money -= buy * CC.ITEMS[id].cost * AUTOBUY_FEE;
        S.stats.bought += buy;
        S.inv[id] = 0;
      } else S.inv[id] = have - need;
      if (S.inv[id] < 1e-9) delete S.inv[id];
    }
    S.money -= fixed * k;
    const y = G.autoYield(r);
    for (const p in r.products) {
      const amt = r.products[p] * sc * k * y;
      if (S.autoSell[p] && G.flag('autosell') && G.canSell(p)) sellDirect(p, amt);
      else G.addInv(p, amt);
    }
    const rec = G.rec(r.id);
    const before = G.mastery(r.id);
    rec.runs += k;
    if (G.mastery(r.id) > before) G.toast(`${r.name} reached mastery ★${G.mastery(r.id)}`, 'good');
    gainRp(r.rp * 0.15 * k * G.rpMult());
    S.stats.autoBatches += k;
    g.status = k < want - 1e-6 ? 'limited' : 'running';
    g.why = k < want - 1e-6 ? (limiter === 'funds' ? 'Limited by funds' : `Limited by ${limiter}`) : '';
    return k;
  }

  G.plantTick = function (dt) {
    if (!G.flag('automation')) return;
    for (const rid in S.reactors) {
      const g = S.reactors[rid];
      const r = CC.RECIPE[rid];
      if (!r || !g.n) continue;
      if (!g.on) { g.status = 'paused'; g.why = ''; continue; }
      g.p += dt / G.cycleTime(r);
      if (g.p < 1) continue;
      const cycles = Math.floor(g.p);
      const k = autoRun(r, cycles * g.n, g);
      g.p = k > 0 ? g.p - cycles : 1;
    }
  };

  // ───────── academy ─────────
  G.course = (cid) => S.courses[cid] || (S.courses[cid] = { read: {}, passed: false, best: 0 });
  G.courseOpen = (c) => !c.req || G.coursePassed(c.req);
  G.readLesson = function (cid, i) {
    const c = G.course(cid);
    c.read[i] = true;
  };
  G.lessonsDone = (c) => c.lessons.every((_, i) => S.courses[c.id] && S.courses[c.id].read[i]);
  G.submitQuiz = function (cid, answers) {
    const c = CC.COURSE[cid];
    const st = G.course(cid);
    let right = 0;
    c.quiz.forEach((q, i) => { if (answers[i] === q.a) right++; });
    const score = right / c.quiz.length;
    const pass = score >= 0.75;
    let rp = 0;
    if (pass && !st.passed) {
      rp = c.reward * (score === 1 ? 1.5 : 1) * G.rpMult();
      st.passed = true;
      gainRp(rp);
      G.toast(`Course passed: ${c.name}! +${CC.fmt(rp)} RP`, 'good');
    } else if (pass && score === 1 && st.best < 1) {
      rp = c.reward * 0.5 * G.rpMult();
      gainRp(rp);
    }
    st.best = Math.max(st.best, score);
    S.stats.quizCorrect += right;
    G.dirty();
    return { right, total: c.quiz.length, score, pass, rp };
  };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  G.shuffle = shuffle;

  // ───────── contracts ─────────
  function newContract() {
    const pool = new Set();
    for (const r of CC.RECIPES) {
      if (!G.researched(r) || G.runs(r.id) < 1) continue;
      for (const p in r.products) if (CC.ITEMS[p].kind === 'product' && CC.ITEMS[p].sellable !== false) pool.add(p);
    }
    if (!pool.size) return;
    const pid = CC.pick([...pool]);
    const it = CC.ITEMS[pid];
    const qty = Math.max(1, Math.round(G.scale() * (2 + Math.random() * 6)));
    const mult = 1.6 + Math.random() * 0.9;
    S.contracts.push({
      id: ++S.contractSeq,
      client: CC.pick(G.CLIENTS),
      item: pid,
      qty,
      reward: it.value * qty * mult * G.sellMult(),
      rp: (it.tier || 1) * 3,
      expires: Date.now() + (300 + Math.random() * 300) * 1000,
    });
    G.toast(`New contract: ${CC.fmt(qty)} mol ${it.name}`, 'info');
    G.dirty();
  }
  G.fulfil = function (cid) {
    const i = S.contracts.findIndex((c) => c.id === cid);
    if (i < 0) return false;
    const c = S.contracts[i];
    if ((S.inv[c.item] || 0) < c.qty - 1e-9) return false;
    S.inv[c.item] -= c.qty;
    if (S.inv[c.item] < 1e-9) delete S.inv[c.item];
    earn(c.reward);
    gainRp(c.rp * G.rpMult());
    S.contracts.splice(i, 1);
    S.stats.contracts++;
    G.toast(`Contract fulfilled for ${c.client}: +${CC.money(c.reward)}`, 'good');
    G.dirty();
    return true;
  };
  function contractTick() {
    const now = Date.now();
    const before = S.contracts.length;
    S.contracts = S.contracts.filter((c) => c.expires > now);
    if (S.contracts.length !== before) G.dirty();
    if (now >= S.nextContractAt) {
      if (S.contracts.length < 3) newContract();
      S.nextContractAt = now + (60 + Math.random() * 60) * 1000;
    }
  }

  // ───────── goals ─────────
  G.currentGoal = () => CC.GOALS.find((g) => !S.goals[g.id]);
  function goalTick() {
    const g = G.currentGoal();
    if (!g || !g.check(S, G)) return;
    S.goals[g.id] = true;
    const rw = [];
    if (g.reward.money) { S.money += g.reward.money; rw.push(CC.money(g.reward.money)); }
    if (g.reward.rp) { gainRp(g.reward.rp); rw.push(CC.fmt(g.reward.rp) + ' RP'); }
    G.toast(`🎯 Objective complete! ${rw.join(' + ')}`, 'good');
    G.dirty();
  }

  // ───────── prestige ─────────
  G.patentGain = () => Math.floor(Math.sqrt(S.stats.runEarned / 1e6));
  G.prestige = function () {
    const gain = G.patentGain();
    if (!G.flag('patent') || gain < 1) return false;
    const keep = { settings: S.settings, school: S.school, courses: S.courses, recipes: S.recipes, revealed: S.revealed, goals: S.goals, stats: S.stats, created: S.created, patents: S.patents + gain };
    S = Object.assign(fresh(), keep);
    S.stats.runEarned = 0;
    S.stats.prestiges++;
    G.recalc();
    G.toast(`Filed ${gain} patent${gain > 1 ? 's' : ''}! Permanent +${gain * 10}% sale prices and RP.`, 'good');
    G.dirty();
    G.save();
    return true;
  };

  // ───────── main tick ─────────
  let goalTimer = 0;
  G.tick = function (dt, offline) {
    S.stats.playTime += dt;
    for (const id in S.demand) {
      S.demand[id] += (1 - S.demand[id]) * Math.min(1, DEMAND_RECOVERY * dt);
      if (S.demand[id] > 0.999) delete S.demand[id];
    }
    const rps = G.rpPerSec();
    if (rps) gainRp(rps * dt);
    G.plantTick(dt);
    if (offline) return;
    if (CC.Lab) CC.Lab.tick(dt);
    contractTick();
    goalTimer += dt;
    if (goalTimer >= 0.5) { goalTimer = 0; goalTick(); }
    rateTimer += dt;
    if (rateTimer >= 1) {
      G.rates.money = G.rates.money * 0.8 + (incomeAcc / rateTimer) * 0.2;
      G.rates.rp = G.rates.rp * 0.8 + (rpAcc / rateTimer) * 0.2;
      incomeAcc = rpAcc = rateTimer = 0;
    }
  };

  // ───────── persistence ─────────
  G.serialize = () => JSON.stringify(S);
  G.lastSave = 0;
  G.save = function () {
    S.time = Date.now();
    G.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, G.serialize()); } catch (e) { /* storage unavailable */ }
  };
  function hydrate(obj) {
    const base = fresh();
    S = Object.assign(base, obj);
    S.stats = Object.assign(fresh().stats, obj.stats || {});
    S.lab = Object.assign(fresh().lab, obj.lab || {});
    S.settings = Object.assign(defaultSettings(), obj.settings || {});
    if (S.lab.run && S.lab.run.xi == null) S.lab.run = null; // run from an older version
    G.recalc();
  }
  // Returns a summary of offline earnings, or null.
  G.load = function () {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* ignore */ }
    if (!raw) { S = fresh(); G.recalc(); return null; }
    try { hydrate(JSON.parse(raw)); } catch (e) { console.warn('Bad save, starting fresh', e); S = fresh(); G.recalc(); return null; }
    return S.settings.offline ? G.catchUp((Date.now() - S.time) / 1000) : null;
  };
  G.catchUp = function (sec) {
    sec = Math.min(OFFLINE_CAP, sec);
    if (!(sec > 10)) return null;
    const m0 = S.money, r0 = S.rp;
    const steps = Math.ceil(sec / 2);
    for (let i = 0; i < steps; i++) G.tick(sec / steps, true);
    return { sec, money: S.money - m0, rp: S.rp - r0 };
  };
  G.exportSave = () => btoa(unescape(encodeURIComponent(G.serialize())));
  G.importSave = function (str) {
    const obj = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!obj || typeof obj !== 'object' || obj.money == null) throw new Error('Not a ChemCorp save');
    hydrate(obj);
    G.save();
    G.dirty();
  };
  G.reset = function () {
    const settings = S.settings;
    S = fresh();
    S.settings = settings;
    G.recalc();
    G.save();
    G.dirty();
  };
  G.newGame = () => { S = fresh(); G.recalc(); };
})();
