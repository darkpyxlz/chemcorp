var CC = (globalThis.CC = globalThis.CC || {});

// Chem School: five-question rounds generated from the game's data, with spaced repetition.
// An item (a molecule, a name, a reaction, a set of conditions, an Academy question) is
// "learned" after LEARN_BOX correct answers, but an answer only counts once that item's
// review interval has passed. Early answers pay nothing; a wrong answer drops two boxes.
(function () {
  const G = CC.Game;
  const K = (CC.School = {});
  const D = CC.SCHOOL_DATA;
  const ROUND = 5;
  const LEARN_BOX = 10;
  const MIN = 60e3, HOUR = 3600e3, DAY = 86400e3;
  const INTERVALS = [0, 10 * MIN, 30 * MIN, 2 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 2 * DAY, 4 * DAY, 7 * DAY, 14 * DAY];
  const PAY = { first: 2, due: 1, soon: 0, streakFrom: 3, streak: 1, perfect: 3 };
  K.ROUND = ROUND; K.LEARN_BOX = LEARN_BOX; K.INTERVALS = INTERVALS;

  K.CATS = {
    fg: { name: 'Functional groups', icon: '🧩', blurb: 'Spot alcohols, ketones, esters, amides…', value: 1 },
    name: { name: 'IUPAC naming', icon: '🏷️', blurb: 'Formula to name and back.', value: 1.5 },
    rxn: { name: 'Reactions', icon: '⚗️', blurb: 'Predict products and starting materials of reactions you have researched.', value: 2.5 },
    cond: { name: 'Conditions', icon: '🌡️', blurb: 'Catalysts, solvents, atmospheres and temperatures.', value: 2.5 },
    acad: { name: 'Academy review', icon: '🎓', blurb: 'Questions from courses you have studied.', value: 2 },
    mixed: { name: 'Mixed round', icon: '🎲', blurb: 'A bit of everything.' },
  };

  const st = () => {
    const S = G.state();
    if (!S.school) S.school = { items: { fg: {}, name: {}, rxn: {}, cond: {}, acad: {} }, stats: { rounds: 0, answered: 0, correct: 0, bestStreak: 0, perfect: 0, rpEarned: 0 } };
    return S.school;
  };
  const rec = (cat, id) => st().items[cat][id];
  const now = () => Date.now();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => G.shuffle(a.slice());
  const uniq = (a) => [...new Set(a)];

  function priority(cat, id, dueOnly) {
    const r = rec(cat, id);
    if (dueOnly) return r && !r.learned && now() >= r.due ? 40 : 0;
    if (!r) return 2;
    if (r.learned) return now() >= r.due ? 0.4 : 0.04;
    return now() >= r.due ? 3 : 0.12;
  }
  function sample(cat, ids, dueOnly) {
    const ws = ids.map((id) => priority(cat, id, dueOnly));
    const tot = ws.reduce((a, b) => a + b, 0);
    if (tot <= 0) return undefined;
    let x = Math.random() * tot;
    for (let i = 0; i < ids.length; i++) { x -= ws[i]; if (x <= 0) return ids[i]; }
    return ids[ids.length - 1];
  }
  function finish(q, right, wrongs) {
    const opts = shuffle([right, ...uniq(wrongs).filter((w) => w !== right).slice(0, 3)]);
    if (opts.length < 2) return null;
    q.options = opts;
    q.answer = opts.indexOf(right);
    return q;
  }

  // ───────── item pools ─────────
  const researched = () => CC.RECIPES.filter((r) => G.researched(r));
  K.pool = function (cat) {
    if (cat === 'fg') return D.groups.map((_, i) => i);
    if (cat === 'name') return D.names.map((_, i) => i);
    if (cat === 'rxn') return researched().map((r) => r.id);
    if (cat === 'cond') return researched().map((r) => r.id);
    if (cat === 'acad') {
      const out = [];
      for (const c of CC.COURSES) {
        const cs = G.state().courses[c.id];
        if (cs && (cs.passed || Object.keys(cs.read).length)) c.quiz.forEach((_, i) => out.push(c.id + ':' + i));
      }
      return out;
    }
    return [];
  };
  K.available = (cat) => (cat === 'mixed' ? ['fg', 'name', 'rxn', 'cond', 'acad'].some((c) => K.pool(c).length) : K.pool(cat).length >= (cat === 'rxn' || cat === 'cond' ? 1 : 1));

  const productName = (r) => CC.itemName(Object.keys(r.products)[0]);
  const reagentText = (r) => Object.entries(r.reagents).map(([id, n]) => (n !== 1 ? n + ' ' : '') + CC.itemName(id)).join(' + ');
  const allRecipes = () => CC.RECIPES;

  // ───────── question builders ─────────
  const BUILD = {
    fg(id) {
      const [f, nm, grp] = D.groups[id];
      const groups = uniq(D.groups.map((g) => g[2]));
      if (Math.random() < 0.5) {
        return finish({ cat: 'fg', id, prompt: `Which functional group does ${nm} contain?`, formula: f }, grp, shuffle(groups.filter((g) => g !== grp)));
      }
      const others = shuffle(D.groups.filter((g) => g[2] !== grp)).map((g) => g[0]);
      return finish({ cat: 'fg', id, prompt: `Which of these is ${/^[AEIOU]/.test(grp) ? 'an' : 'a'} ${grp.toLowerCase()}?` }, f, others);
    },
    name(id) {
      const [f, nm] = D.names[id];
      const sim = (x) => shuffle(D.names.filter((n) => n[1] !== nm)).sort((a, b) => sharedPrefix(b[1], nm) - sharedPrefix(a[1], nm));
      if (Math.random() < 0.5) return finish({ cat: 'name', id, prompt: 'What is the IUPAC name of this compound?', formula: f }, nm, sim().map((n) => n[1]));
      return finish({ cat: 'name', id, prompt: `Which structure is ${nm}?` }, f, sim().map((n) => n[0]));
    },
    rxn(id) {
      const r = CC.RECIPE[id];
      const kind = pick(['product', 'start', 'type']);
      const others = shuffle(allRecipes().filter((x) => x.id !== id));
      if (kind === 'product') {
        return finish({ cat: 'rxn', id, prompt: `${reagentText(r)} (${r.name.toLowerCase()}) gives which main product?` }, productName(r), others.map(productName));
      }
      if (kind === 'start') {
        return finish({ cat: 'rxn', id, prompt: `Which starting materials make ${productName(r)}?` }, reagentText(r), others.filter((x) => productName(x) !== productName(r)).map(reagentText));
      }
      return finish({ cat: 'rxn', id, prompt: `${reagentText(r)} → ${productName(r)} is what kind of reaction?` }, r.cls, uniq(others.map((x) => x.cls)).filter((c) => c !== r.cls));
    },
    cond(id) {
      const r = CC.RECIPE[id];
      const kinds = ['temp', 'solvent'];
      if (r.additive) kinds.push('cat', 'cat');
      if (r.atm) kinds.push('atm');
      const kind = pick(kinds);
      const others = shuffle(allRecipes().filter((x) => x.id !== id));
      const tt = (x) => `${x.temp[0]}–${x.temp[1]} °C`;
      const sv = (x) => x.solvents.map((s) => (s === 'none' ? 'no solvent (neat)' : CC.itemName(s))).join(' or ');
      if (kind === 'temp') return finish({ cat: 'cond', id, prompt: `What temperature range suits the ${r.name.toLowerCase()} (→ ${productName(r)})?` }, tt(r), others.filter((x) => Math.abs(x.temp[0] - r.temp[0]) > 10).map(tt));
      if (kind === 'solvent') return finish({ cat: 'cond', id, prompt: `Which solvent should you use for the ${r.name.toLowerCase()} (→ ${productName(r)})?` }, sv(r), others.map(sv));
      if (kind === 'cat') {
        const all = uniq(CC.ITEM_LIST.filter((it) => it.kind === 'additive').map((it) => it.name));
        return finish({ cat: 'cond', id, prompt: `Which catalyst or additive does the ${r.name.toLowerCase()} (→ ${productName(r)}) need?` }, CC.itemName(r.additive.id), shuffle(all.concat(['None'])));
      }
      return finish({ cat: 'cond', id, prompt: `Which atmosphere does the ${r.name.toLowerCase()} need?` }, G.ATMS[r.atm].name, Object.values(G.ATMS).map((a) => a.name));
    },
    acad(id) {
      const [cid, qi] = id.split(':');
      const q = CC.COURSE[cid].quiz[+qi];
      const res = finish({ cat: 'acad', id, prompt: q.q, course: cid }, q.o[q.a], q.o.filter((_, i) => i !== q.a));
      if (res) res.explain = q.e;
      return res;
    },
  };
  function sharedPrefix(a, b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i + (a.split('-').pop() === b.split('-').pop() ? 3 : 0); }

  function explain(q) {
    if (q.explain) return q.explain;
    if (q.cat === 'fg') { const [f, nm, g] = D.groups[q.id]; return `${nm} (${f}) is ${/^[AEIOU]/.test(g) ? 'an' : 'a'} ${g.toLowerCase()}.`; }
    if (q.cat === 'name') { const [f, nm] = D.names[q.id]; return `${f} is ${nm}.`; }
    const r = CC.RECIPE[q.id];
    const cat = r.additive ? `${CC.itemName(r.additive.id)}` : 'no catalyst';
    return `${r.name}: ${reagentText(r)} → ${Object.keys(r.products).map(CC.itemName).join(' + ')}; ${r.solvents.map((s) => (s === 'none' ? 'neat' : CC.itemName(s))).join('/')}, ${cat}${r.atm ? ', ' + G.ATMS[r.atm].name : ''}, ${r.temp[0]}–${r.temp[1]} °C. ${r.learn}`;
  }

  function question(cat, seen, dueOnly) {
    for (let tries = 0; tries < 25; tries++) {
      const pool = K.pool(cat).filter((id) => !seen.has(cat + ':' + id));
      const id = sample(cat, pool.length ? pool : K.pool(cat), dueOnly);
      if (id === undefined) return null;
      const q = BUILD[cat](id);
      if (!q) continue;
      q.explain = explain(q);
      return q;
    }
    return null;
  }

  // ───────── rounds ─────────
  K.start = function (cat, dueOnly) {
    const cats = cat === 'mixed' || dueOnly ? ['fg', 'name', 'rxn', 'cond', 'acad'].filter((c) => K.pool(c).length) : [cat];
    const qs = [], seen = new Set();
    for (let i = 0; i < ROUND * 4 && qs.length < ROUND; i++) {
      const c = pick(cats);
      const q = question(c, seen, dueOnly);
      if (!q) continue;
      seen.add(q.cat + ':' + q.id);
      qs.push(q);
    }
    if (!qs.length) return null;
    return { cat: dueOnly ? 'due' : cat, qs, i: 0, correct: 0, streak: 0, earned: 0, answers: [], done: false, bonus: 0 };
  };

  K.scale = () => (1 + 0.3 * Object.keys(G.state().tech).length) * G.rpMult();
  function payFor(q) {
    const r = rec(q.cat, q.id);
    if (!r || r.ok === 0) return { mult: PAY.first, counts: true, first: true };
    if (now() >= r.due) return { mult: PAY.due, counts: true };
    return { mult: PAY.soon, counts: false };
  }

  K.answer = function (round, choice) {
    if (round.done) return null;
    const q = round.qs[round.i];
    const correct = choice === q.answer;
    const s = st();
    s.stats.answered++;
    const store = s.items[q.cat];
    const r = store[q.id] || (store[q.id] = { ok: 0, bad: 0, box: 0, due: 0, learned: 0 });
    let rp = 0, counted = false, learnedNow = false, tooSoon = false;
    if (correct) {
      const p = payFor(q);
      round.streak++;
      const streak = p.mult > 0 && round.streak >= PAY.streakFrom ? PAY.streak : 0;
      rp = (p.mult * K.CATS[q.cat].value + streak) * K.scale();
      r.ok++;
      s.stats.correct++;
      tooSoon = !p.counts;
      if (p.counts) {
        counted = true;
        r.box = Math.min(LEARN_BOX, r.box + 1);
        r.due = now() + INTERVALS[r.box];
        if (r.box >= LEARN_BOX && !r.learned) { r.learned = now(); learnedNow = true; }
      }
      s.stats.bestStreak = Math.max(s.stats.bestStreak, round.streak);
      round.correct++;
    } else {
      r.bad++;
      round.streak = 0;
      r.box = Math.max(0, r.box - 2);
      r.due = now() + INTERVALS[r.box];
    }
    if (rp) { G.gainRp(rp); round.earned += rp; s.stats.rpEarned += rp; }
    round.answers.push({ choice, correct, rp });
    const last = round.i === round.qs.length - 1;
    round.i++;
    if (last) {
      round.done = true;
      s.stats.rounds++;
      if (round.correct === round.qs.length) {
        s.stats.perfect++;
        if (round.earned > 0) { round.bonus = PAY.perfect * K.scale(); G.gainRp(round.bonus); s.stats.rpEarned += round.bonus; }
      }
    }
    G.dirty();
    return { correct, rp, counted, tooSoon, learnedNow, box: r.box, next: r.due - now(), explain: q.explain, last };
  };

  // ───────── progress ─────────
  K.status = function (cat, id) {
    const r = rec(cat, id);
    if (!r) return 'new';
    if (r.learned) return 'learned';
    return now() >= r.due ? 'due' : 'learning';
  };
  K.dueCount = () => ['fg', 'name', 'rxn', 'cond', 'acad'].reduce((n, c) => n + K.pool(c).filter((id) => K.status(c, id) === 'due').length, 0);
  K.progress = function (cat) {
    const ids = K.pool(cat);
    const c = { total: ids.length, learned: 0, due: 0, started: 0 };
    for (const id of ids) { const s = K.status(cat, id); if (s !== 'new') c.started++; if (s === 'learned') c.learned++; if (s === 'due') c.due++; }
    return c;
  };
  K.label = function (cat, id) {
    if (cat === 'fg') return `${D.groups[id][1]} · ${D.groups[id][0]}`;
    if (cat === 'name') return `${D.names[id][1]} · ${D.names[id][0]}`;
    if (cat === 'acad') { const [c, i] = id.split(':'); return `${CC.COURSE[c].icon} ${CC.COURSE[c].quiz[+i].q}`; }
    return CC.RECIPE[id].name + ' → ' + productName(CC.RECIPE[id]);
  };
  K.items = function () {
    const out = [];
    for (const cat of ['fg', 'name', 'rxn', 'cond', 'acad']) {
      for (const id of K.pool(cat)) {
        const r = rec(cat, id);
        out.push({ cat, id, label: K.label(cat, id), status: K.status(cat, id), box: r ? r.box : 0, ok: r ? r.ok : 0, bad: r ? r.bad : 0, due: r ? r.due - now() : 0 });
      }
    }
    return out;
  };
  K.state = st;
})();
