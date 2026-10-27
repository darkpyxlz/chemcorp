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
for (const f of ['js/util.js', 'js/data/items.js', 'js/data/recipes.js', 'js/data/tech.js', 'js/data/academy.js', 'js/data/goals.js', 'js/game.js', 'js/lab.js']) {
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
test('fresh game can run the first neutralisation', () => {
  CC.Lab.add('hcl'); CC.Lab.add('naoh'); CC.Lab.setSolvent('s_water'); CC.Lab.setTemp(25);
  for (let i = 0; i < 50; i++) G.tick(0.1);
  CC.Lab.start();
  assert(S().lab.run, 'run started');
  for (let i = 0; i < 100 && S().lab.run; i++) G.tick(0.1);
  const rep = S().lab.report;
  assert.strictEqual(rep.type, 'result');
  assert(rep.y > 0.85, 'yield ' + rep.y);
  assert(S().inv.nacl > 0.85, 'salt made');
  assert(S().rp > 10, 'rp ' + S().rp);
  assert(G.runs('neut') === 1);
});
test('wrong stoichiometry limits product', () => {
  CC.Lab.stepEq('hcl', -1); // 0.5 eq
  CC.Lab.start();
  for (let i = 0; i < 100 && S().lab.run; i++) G.tick(0.1);
  const rep = S().lab.report;
  assert(Math.abs(rep.extent - 0.5) < 1e-9, 'extent ' + rep.extent);
});
test('unknown combination gives no reaction and consumes nothing', () => {
  S().inv.acoh = 1;
  CC.Lab.clear(); CC.Lab.add('acoh'); CC.Lab.add('naoh');
  const before = S().inv.naoh;
  CC.Lab.start();
  assert.strictEqual(S().lab.report.type, 'none');
  assert.strictEqual(S().inv.naoh, before);
});
test('unresearched recipe is reported as locked', () => {
  S().inv.etoh = 1;
  CC.Lab.clear(); CC.Lab.add('acoh'); CC.Lab.add('etoh');
  CC.Lab.start();
  assert.strictEqual(S().lab.report.type, 'locked');
});
test('selling lowers demand and earns money', () => {
  const m = S().money;
  const v = G.sell('nacl', 0.5);
  assert(v > 0 && S().money > m);
  assert(G.demand('nacl') < 1);
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
  for (let i = 0; i < 300 && st.lab.run; i++) G.tick(0.1);
  assert.strictEqual(st.lab.report.y, 0);
  assert(st.lab.report.fatal);
});
test('automation produces and auto-sells', () => {
  const st = S();
  st.tech.t_automation = true; st.tech.t_autosell = true; st.tech.t_autobuy = true; G.recalc();
  st.recipes.neut.runs = 10; st.money = 1000;
  assert(G.buildReactor('neut'));
  st.autoSell.nacl = true;
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
    for (let i = 0; i < 2000 && st.lab.run; i++) {
      // crude operator: counter exotherms by lowering the setpoint
      const mid = (r.temp[0] + r.temp[1]) / 2;
      CC.Lab.setTemp(st.lab.set + (mid - st.lab.T) * 0.3);
      G.tick(0.05);
    }
    const rep = st.lab.report;
    assert(rep.type === 'result' && rep.success, `${r.id}: yield ${rep.y} ${JSON.stringify(rep.factors.filter((f) => f.f < 1))}`);
  }
});

console.log(failures ? `\n${failures} test(s) failed` : '\nAll tests passed');
process.exit(failures ? 1 : 0);
