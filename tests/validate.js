// Data integrity + engine smoke tests. Run: node tests/validate.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const store = {};
const ctx = {
  console, Date, Math, JSON, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  unescape, escape, encodeURIComponent, decodeURIComponent,
  localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/util.js', 'js/data/items.js', 'js/data/recipes.js', 'js/data/tech.js', 'js/data/academy.js', 'js/data/goals.js', 'js/data/school.js', 'js/game.js', 'js/lab.js', 'js/school.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
const CC = ctx.CC;
const G = CC.Game;
let failures = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓', name); } catch (e) { failures++; console.log('  ✗', name, '\n    ', e.message); }
}

console.log('Data integrity');
test('recipe references exist', () => {
  for (const r of CC.RECIPES) {
    assert(CC.TECH_BY_ID[r.tech], `${r.id}: tech ${r.tech}`);
    for (const id in r.reagents) assert(CC.ITEMS[id], `${r.id}: reagent ${id}`);
    for (const id in r.products) assert(CC.ITEMS[id], `${r.id}: product ${id}`);
    for (const id of r.solvents) assert(id === 'none' || CC.ITEMS[id].kind === 'solvent', `${r.id}: solvent ${id}`);
    for (const id in r.solventFx || {}) assert(id === 'none' || CC.ITEMS[id].kind === 'solvent', `${r.id}: solventFx ${id}`);
    for (const id in r.fatalSolvent || {}) assert(CC.ITEMS[id].kind === 'solvent', `${r.id}: fatal ${id}`);
    if (r.additive) assert(CC.ITEMS[r.additive.id].kind === 'additive', `${r.id}: additive`);
    for (const id in r.alt || {}) assert(CC.ITEMS[id].kind === 'additive', `${r.id}: alt ${id}`);
    assert(r.temp[0] < r.temp[1], `${r.id}: temp window`);
    assert(r.hint && r.learn, `${r.id}: text`);
    assert(r.tech === CC.TECH.find((t) => (t.fx.recipes || []).includes(r.id)).id, `${r.id}: tech fx mismatch`);
  }
});
test('reagent sets are unique', () => {
  const seen = new Set();
  for (const r of CC.RECIPES) {
    const k = Object.keys(r.reagents).sort().join('|');
    assert(!seen.has(k), `duplicate reagent set ${k}`);
    seen.add(k);
  }
});
test('every intermediate is made by an earlier-or-same tier recipe', () => {
  for (const r of CC.RECIPES) for (const id in r.reagents) {
    if (CC.ITEMS[id].kind !== 'product') continue;
    const maker = CC.RECIPES.find((m) => m.products[id]);
    assert(maker && maker.tier <= r.tier, `${id} for ${r.id}`);
  }
});
test('tech tree: prereqs exist, acyclic, unique positions, courses exist', () => {
  const pos = new Set();
  for (const t of CC.TECH) {
    t.req.forEach((q) => assert(CC.TECH_BY_ID[q], `${t.id} req ${q}`));
    if (t.course) assert(CC.COURSE[t.course], `${t.id} course ${t.course}`);
    const k = t.pos.join(',');
    assert(!pos.has(k), `position clash ${k}`);
    pos.add(k);
    for (const q of t.req) assert(CC.TECH_BY_ID[q].pos[0] < t.pos[0], `${t.id} should be right of ${q}`);
  }
});
test('every recipe-required temperature/atmosphere is reachable', () => {
  let tMin = 15, tMax = 100; const atms = new Set(['air']);
  for (const t of CC.TECH) { if (t.fx.tempMin != null) tMin = Math.min(tMin, t.fx.tempMin); if (t.fx.tempMax != null) tMax = Math.max(tMax, t.fx.tempMax); (t.fx.atm || []).forEach((a) => atms.add(a)); }
  for (const r of CC.RECIPES) {
    assert(r.temp[1] >= tMin && r.temp[0] <= tMax, `${r.id} temp`);
    if (r.atm) assert(atms.has(r.atm), `${r.id} atm`);
  }
});
test('courses: valid quizzes and prerequisites', () => {
  for (const c of CC.COURSES) {
    if (c.req) assert(CC.COURSE[c.req], `${c.id} req`);
    assert(c.lessons.length >= 2, `${c.id} lessons`);
    assert(c.quiz.length >= 4, `${c.id} quiz`);
    for (const q of c.quiz) assert(q.a >= 0 && q.a < q.o.length && q.e, `${c.id}: ${q.q}`);
  }
});
test('sellable final products are profitable when automated', () => {
  for (const r of CC.RECIPES) {
    let input = 0;
    for (const id in r.reagents) {
      const it = CC.ITEMS[id];
      input += r.reagents[id] * (it.kind === 'reagent' ? it.cost * 1.1 : 0);
    }
    if (r.additive) input += CC.ITEMS[r.additive.id].use * r.additive.amt;
    input += r.solvents[0] === 'none' ? 0 : CC.ITEMS[r.solvents[0]].use;
    let out = 0;
    for (const p in r.products) out += (CC.ITEMS[p].kind === 'product' ? CC.ITEMS[p].value : 0) * r.products[p];
    if (!out) continue; // intermediates
    const hasIntermediate = Object.keys(r.reagents).some((id) => CC.ITEMS[id].kind === 'product');
    if (hasIntermediate) continue;
    assert(out * r.yield * 0.75 > input, `${r.id}: out ${out * r.yield * 0.75} vs in ${input}`);
  }
});

console.log('Engine');
G.newGame();
const S = () => G.state();
CC.Game.on(() => {});
function runFor(sec, setT) {
  for (let i = 0; i < sec * 10 && S().lab.run; i++) { if (setT != null) CC.Lab.setTemp(setT); G.tick(0.1); }
}
function esterRun(eqEtoh, T, sec) {
  const st = S();
  st.inv.acoh = 10; st.inv.etoh = 10;
  CC.Lab.clear(); CC.Lab.add('acoh'); CC.Lab.add('etoh');
  while (st.lab.slots[1].eq < eqEtoh) CC.Lab.stepEq('etoh', 1);
  CC.Lab.setSolvent('none'); CC.Lab.setAdditive('a_h2so4'); CC.Lab.setTemp(T); st.lab.T = T;
  CC.Lab.start();
  runFor(sec, T);
  CC.Lab.workup();
  return st.lab.report;
}
test('fresh game can make the first ester', () => {
  const rep = esterRun(1, 75, 90);
  assert.strictEqual(rep.type, 'result');
  assert(rep.y > 0.5 && rep.y < 0.68, 'equilibrium-limited yield ' + rep.y);
  assert(S().inv.etoac > 0.5, 'ester made');
  assert(S().rp > 10, 'rp ' + S().rp);
  assert(G.runs('etoac') === 1);
});
test('excess alcohol raises the equilibrium yield', () => {
  const y1 = esterRun(1, 75, 200).y, y3 = esterRun(3, 75, 200).y;
  assert(y3 > y1 + 0.15, `1 eq ${y1} vs 3 eq ${y3}`);
});
test('waiting longer gives more product with diminishing returns', () => {
  const a = esterRun(1, 75, 10).y, b = esterRun(1, 75, 20).y, c = esterRun(1, 75, 40).y;
  assert(b > a && c > b, `${a} ${b} ${c}`);
  assert(c - b < b - a, `diminishing returns ${a} ${b} ${c}`);
});
test('moderate overheating speeds the reaction instead of wrecking it', () => {
  const cool = esterRun(1, 75, 10).y, hot = esterRun(1, 100, 10).y;
  assert(hot > 0.4, `hot run still gives product ${hot} (cool ${cool})`);
  assert(hot >= cool - 0.05, `hot ${hot} vs cool ${cool}`);
});
test('half the limiting reagent halves the product', () => {
  const st = S();
  st.inv.acoh = 10; st.inv.etoh = 10;
  CC.Lab.clear(); CC.Lab.add('acoh'); CC.Lab.add('etoh'); CC.Lab.stepEq('acoh', -1);
  CC.Lab.setAdditive('a_h2so4'); CC.Lab.start();
  assert(Math.abs(st.lab.run.theo - 0.5) < 1e-9);
  CC.Lab.workup();
});
test('unknown combination gives no reaction and consumes nothing', () => {
  S().inv.naoh = 1;
  CC.Lab.clear(); CC.Lab.add('acoh'); CC.Lab.add('naoh');
  const before = S().inv.naoh;
  CC.Lab.start();
  assert.strictEqual(S().lab.report.type, 'none');
  assert.strictEqual(S().inv.naoh, before);
});
test('unresearched recipe is reported as locked', () => {
  S().inv.isoamyl_oh = 1;
  CC.Lab.clear(); CC.Lab.add('acoh'); CC.Lab.add('isoamyl_oh');
  CC.Lab.start();
  assert.strictEqual(S().lab.report.type, 'locked');
});
test('selling lowers demand and earns money', () => {
  const m = S().money;
  const v = G.sell('etoac', 0.5);
  assert(v > 0 && S().money > m);
  assert(G.demand('etoac') < 1);
});
test('quiz pass awards RP and unlocks research', () => {
  const r0 = S().rp;
  const res = G.submitQuiz('acids_bases', CC.COURSE.acids_bases.quiz.map((q) => q.a));
  assert(res.pass && S().rp > r0);
  S().rp += 100;
  assert(G.research('t_sapon'));
  assert(G.researched('sapon'));
});
test('fatal conditions zero the yield (Grignard in water)', () => {
  const st = S();
  st.tech.t_grignard = true; st.tech.t_schlenk = true; G.recalc();
  st.inv.phbr = 1; st.inv.mg = 1;
  CC.Lab.clear(); CC.Lab.add('phbr'); CC.Lab.add('mg'); CC.Lab.setSolvent('s_water'); CC.Lab.setAdditive('none'); CC.Lab.setAtm('n2');
  CC.Lab.start();
  runFor(20); CC.Lab.workup();
  assert.strictEqual(st.lab.report.y, 0);
  assert(st.lab.report.fatal);
});
test('automation produces and auto-sells', () => {
  const st = S();
  st.tech.t_automation = true; st.tech.t_autosell = true; st.tech.t_autobuy = true; G.recalc();
  st.recipes.etoac.runs = 10; st.money = 1000;
  assert(G.buildReactor('etoac'));
  st.autoSell.etoac = true;
  const m = st.stats.lifetimeEarned;
  for (let i = 0; i < 600; i++) G.tick(0.1);
  assert(st.stats.autoBatches > 1, 'batches ' + st.stats.autoBatches);
  assert(st.stats.lifetimeEarned > m, 'earned');
});
test('save / export / import round-trip', () => {
  G.save();
  const ex = G.exportSave();
  const money = S().money;
  G.reset();
  assert(S().money !== money);
  G.importSave(ex);
  assert(Math.abs(S().money - money) < 1e-6);
});
test('offline catch-up runs the plant', () => {
  const b = S().stats.autoBatches;
  const res = G.catchUp(600);
  assert(res && S().stats.autoBatches > b);
});
test('every recipe can be completed with its documented procedure', () => {
  G.newGame();
  const st = S();
  for (const t of CC.TECH) st.tech[t.id] = true;
  G.recalc();
  st.money = 1e9;
  for (const it of CC.ITEM_LIST) if (it.kind === 'solvent' || it.kind === 'additive') st.owned[it.id] = true;
  for (const r of CC.RECIPES) {
    for (const id in r.reagents) st.inv[id] = 10;
    st.revealed[r.id] = true;
    CC.Lab.load(r.id);
    st.lab.T = st.lab.set;
    CC.Lab.start();
    assert(st.lab.run, r.id + ' did not start: ' + JSON.stringify(st.lab.report));
    const mid = (r.temp[0] + r.temp[1]) / 2;
    for (let i = 0; i < r.time * 100 && st.lab.run; i++) {
      // crude operator: counter exotherms by lowering the setpoint
      CC.Lab.setTemp(st.lab.set + (mid - st.lab.T) * 0.3);
      G.tick(0.05);
    }
    CC.Lab.workup();
    const rep = st.lab.report;
    assert(rep.type === 'result' && rep.success, `${r.id}: yield ${rep.y} ${JSON.stringify(rep.factors.filter((f) => f.f < 1))}`);
  }
});

console.log('Chem School');
test('rounds build for every category and pay RP with spaced repetition', () => {
  G.newGame();
  const st = S();
  for (const t of CC.TECH) st.tech[t.id] = true;
  G.recalc();
  G.readLesson('lab_basics', 0);
  for (const cat of ['fg', 'name', 'rxn', 'cond', 'acad', 'mixed']) {
    for (let k = 0; k < 20; k++) {
      const rd = CC.School.start(cat);
      assert(rd && rd.qs.length === 5, cat + ' round');
      for (const q of rd.qs) {
        assert(q.options.length >= 2 && q.options.length <= 4 && new Set(q.options).size === q.options.length, cat + ' options ' + JSON.stringify(q));
        assert(q.answer >= 0 && q.explain, cat + ' answer');
      }
    }
  }
  const rd = CC.School.start('fg');
  const rp0 = st.rp;
  const first = CC.School.answer(rd, rd.qs[0].answer);
  assert(first.correct && first.rp > 0 && st.rp > rp0);
  // same item again immediately: too soon, no pay
  const id = rd.qs[0].id;
  const again = { qs: [Object.assign({}, rd.qs[0])], i: 0, correct: 0, streak: 0, earned: 0, answers: [], done: false, bonus: 0 };
  const r2 = CC.School.answer(again, again.qs[0].answer);
  assert(r2.tooSoon && r2.rp === 0, 'too soon');
  assert.strictEqual(CC.School.state().items.fg[id].box, 1);
});

console.log(failures ? `\n${failures} test(s) failed` : '\nAll tests passed');
process.exit(failures ? 1 : 0);
