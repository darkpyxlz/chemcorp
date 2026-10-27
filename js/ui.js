var CC = (globalThis.CC = globalThis.CC || {});

// Rendering. Each tab renders to an HTML string when something structural changes;
// fast-moving numbers are refreshed in place every frame through data-live attributes.
(function () {
  const G = CC.Game;
  const L = CC.Lab;
  const U = (CC.UI = {});
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = CC.esc;
  let S;
  let tab = 'lab';
  let dirty = true;
  let pointerDown = 0;
  let forceRender = false;
  const sub = { mapSel: 'alcohol1', mapEdge: null, mapHide: {}, mapMine: false, mapZoom: 0.75, pz: 'name', pname: null, pbuild: null, pmech: null, proute: null, tech: null, course: null, lesson: 0, quiz: false, answers: {}, result: null, buyAmt: 1, nbOpen: {}, acTab: 'school', round: null, last: null, learnFilter: 'all' };

  const TABS = [
    ['lab', '🧪 Lab'], ['market', '🏪 Market'], ['upgrades', '🛠️ Upgrades'], ['plant', '🏭 Plant'],
    ['research', '🔬 Research'], ['academy', '🎓 Academy'], ['puzzles', '🧩 Puzzles'], ['map', '🚇 Map'], ['stats', '📊 Statistics'], ['options', '⚙️ Options'],
  ];

  const name = (id) => CC.itemName(id);
  const stars = (n) => (n ? `<span class="stars" title="Mastery ${n}">${'★'.repeat(Math.min(n, 5))}${n > 5 ? '+' + (n - 5) : ''}</span>` : '');
  const qty = (n) => CC.fmt(n || 0);
  const amtText = (a) => (a < 1 ? `${CC.fmt(a * 100)} mol%` : `${CC.fmt(a)} eq`);
  const tempText = (r) => `${r.temp[0]}–${r.temp[1]} °C`;

  U.markDirty = () => { dirty = true; };

  // ───────────────────────── init / events ─────────────────────────
  U.init = function () {
    S = G.state();
    G.on((type, data) => {
      if (type === 'dirty') dirty = true;
      else if (type === 'toast') U.toast(data.msg, data.kind);
    });
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);
    const file = document.createElement('input');
    file.type = 'file'; file.id = 'import-file'; file.accept = '.txt,text/plain'; file.hidden = true;
    file.addEventListener('change', () => {
      const f = file.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { doImport(String(rd.result)); file.value = ''; };
      rd.readAsText(f);
    });
    document.body.appendChild(file);
    document.addEventListener('pointerdown', (e) => { pointerDown = e.target.matches('input[type=range]') ? Date.now() : 0; });
    for (const ev of ['pointerup', 'pointercancel', 'touchend', 'touchcancel']) document.addEventListener(ev, () => { pointerDown = 0; });
    window.addEventListener('blur', () => { pointerDown = 0; });
    try { tab = localStorage.getItem('chemcorp-tab') || 'lab'; } catch (e) { /* ignore */ }
    if (!TABS.some((t) => t[0] === tab)) tab = 'lab';
  };

  const ACT = {
    tab: (d) => { tab = d.tab; forceRender = true; pointerDown = 0; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); try { localStorage.setItem('chemcorp-tab', tab); } catch (e) { /* ignore */ } window.scrollTo(0, 0); },
    help: () => U.help(),
    closeModal: () => { $('#modal').hidden = true; },
    // lab
    add: (d) => L.add(d.id),
    rm: (d) => L.remove(d.id),
    eq: (d) => L.stepEq(d.id, +d.d),
    atm: (d) => L.setAtm(d.a),
    app: (d) => L.setApp(d.a),
    // map
    mst: (d) => { sub.mapSel = d.id; sub.mapEdge = null; },
    medge: (d) => { sub.mapEdge = +d.i; },
    mline: (d) => { sub.mapHide[d.l] = !sub.mapHide[d.l]; },
    mmine: () => { sub.mapMine = !sub.mapMine; },
    mzoom: (d) => { sub.mapZoom = CC.clamp(+(sub.mapZoom + +d.d).toFixed(2), 0.5, 1.8); },
    mlab: (d) => { L.load(d.id); ACT.tab({ tab: 'lab' }); },
    // puzzles
    pz: (d) => { sub.pz = d.t; },
    pnameNew: (d) => { sub.pname = CC.Puzzles.newName(+d.l || 1); },
    pnameAns: (d) => { if (sub.pname) CC.Puzzles.answerName(sub.pname, +d.i); },
    pbuildNew: () => { sub.pbuild = CC.Puzzles.newBuild(); },
    pblen: (d) => CC.Puzzles.setLength(sub.pbuild, sub.pbuild.mol.n + +d.d),
    pbadd: (d) => { if (!sub.pbuild.done) CC.Puzzles.addGroup(sub.pbuild, +d.i, d.g); },
    pbrm: (d) => { if (!sub.pbuild.done) CC.Puzzles.removeGroup(sub.pbuild, +d.i, +d.k); },
    pbdb: (d) => { if (!sub.pbuild.done) CC.Puzzles.toggleDb(sub.pbuild, +d.i); },
    pbcheck: () => CC.Puzzles.checkBuild(sub.pbuild),
    pbreveal: () => { const q = sub.pbuild; q.revealed = true; q.mol = CC.Mol.clone(q.target); },
    pmech: (d) => { sub.pmech = CC.Puzzles.startMech(d.id); },
    pmechBack: () => { sub.pmech = null; },
    msite: (d) => {
      const st = sub.pmech;
      if (!st || CC.Puzzles.mechStepDone(st)) return;
      const site = d.site;
      if (!st.pending) {
        if (site.startsWith('a:')) { st.msg = 'Arrows start where electrons are: click a lone pair (• •) or a bond first.'; st.mistakes++; return; }
        st.pending = site; st.msg = 'Now click where those electrons go.';
      } else if (st.pending === site) { st.pending = null; st.msg = ''; }
      else { CC.Puzzles.tryArrow(st, st.pending, site); st.pending = null; }
    },
    mnext: () => CC.Puzzles.nextMechStep(sub.pmech),
    mreset: () => { const st = sub.pmech; st.drawn = []; st.pending = null; st.msg = ''; },
    prouteNew: (d) => { sub.proute = CC.Puzzles.newRoute(+d.l || 2); sub.routeSolve = false; },
    proute: (d) => CC.Puzzles.routeMove(sub.proute, sub.proute.opts[+d.i]),
    prouteSolve: () => { sub.routeSolve = true; },
    start: () => L.start(),
    workup: () => L.workup(),
    abort: () => L.abort(),
    repeat: () => L.repeat(),
    clear: () => L.clear(),
    buyMissing: () => { L.buyMissing(); S.lab.report = null; },
    dismiss: () => { S.lab.report = null; },
    load: (d) => { L.load(d.id); if (tab !== 'lab') ACT.tab({ tab: 'lab' }); },
    reveal: (d) => G.reveal(d.id),
    nb: (d) => { sub.nbOpen[d.id] = !sub.nbOpen[d.id]; },
    // market
    buy: (d) => G.buy(d.id, +d.q),
    buyMax: (d) => G.buyMax(d.id),
    sell: (d) => G.sell(d.id, d.q === 'all' ? Infinity : d.q === 'half' ? (S.inv[d.id] || 0) / 2 : +d.q),
    autoSell: (d) => { S.autoSell[d.id] = !S.autoSell[d.id]; },
    stock: (d) => G.stock(d.id),
    fulfil: (d) => G.fulfil(+d.id),
    buyAmt: (d) => { sub.buyAmt = +d.q; },
    upg: (d) => G.buyUpgrade(d.id),
    // plant
    reactor: (d) => G.buildReactor(d.id),
    rtoggle: (d) => G.toggleReactor(d.id),
    autoBuy: () => { S.autoBuy = !S.autoBuy; },
    // research
    tech: (d) => { sub.tech = d.id; },
    research: (d) => G.research(d.id),
    goCourse: (d) => { ACT.tab({ tab: 'academy' }); openCourse(d.id); },
    // academy
    course: (d) => openCourse(d.id),
    lesson: (d) => { sub.lesson = +d.i; sub.quiz = false; G.readLesson(sub.course, sub.lesson); },
    back: () => { sub.course = null; sub.quiz = false; sub.result = null; },
    quiz: () => { sub.quiz = true; sub.answers = {}; sub.result = null; },
    pick: (d) => { if (!sub.result) sub.answers[+d.q] = +d.o; },
    submitQuiz: () => { sub.result = G.submitQuiz(sub.course, sub.answers); },
    retake: () => { sub.answers = {}; sub.result = null; },
    acTab: (d) => { sub.acTab = d.t; sub.course = null; },
    school: (d) => { sub.round = CC.School.start(d.cat, d.due === '1'); sub.last = null; if (!sub.round) U.toast('Nothing to ask about yet in that category.', 'bad'); },
    schoolAns: (d) => { if (sub.round && !sub.last) sub.last = CC.School.answer(sub.round, +d.o); },
    schoolNext: () => { sub.last = null; },
    schoolQuit: () => { sub.round = null; sub.last = null; },
    learnFilter: (d) => { sub.learnFilter = d.f; },
    // options
    save: () => { G.save(); U.toast('Game saved.', 'good'); },
    exportCopy: () => {
      const str = G.exportSave();
      const fallback = () => U.modal(`<h3>Export save</h3><p class="note">Copy this text and keep it somewhere safe.</p><textarea id="export-text" readonly rows="8">${esc(str)}</textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-act="closeModal">Close</button></div>`);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(str).then(() => U.toast('Save copied to clipboard!', 'good'), fallback);
      else fallback();
    },
    exportFile: () => {
      const blob = new Blob([G.exportSave()], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ChemCorp save ${new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      U.toast('Save file downloaded.', 'good');
    },
    importOpen: () => U.modal(`<h3>Import save</h3><p class="note">Paste an exported save below. This replaces your current progress.</p><textarea id="import-text" rows="8" placeholder="Paste your save here"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="importDo">Import</button></div>`),
    importDo: () => doImport($('#import-text').value),
    importFile: () => $('#import-file').click(),
    reset: () => {
      if (!confirm('Erase ALL progress and start over? This cannot be undone.')) return;
      if (S.settings.confirm && prompt('Type RESET to confirm.') !== 'RESET') return;
      G.reset(); S = G.state(); U.toast('Progress erased.');
    },
    set: (d) => {
      const st = S.settings;
      const v = d.v === 'true' ? true : d.v === 'false' ? false : d.v;
      st[d.k] = d.k === 'autosave' ? +v : v;
    },
    maxAll: () => { const n = G.maxAll(); U.toast(n ? `Built ${n} reactor${n > 1 ? 's' : ''}.` : 'Nothing affordable.', n ? 'good' : 'bad'); },
    rmax: (d) => G.buildMax(d.id),
    allOn: () => G.setAllReactors(true),
    allOff: () => G.setAllReactors(false),
  };

  function doImport(str) {
    try {
      G.importSave(str);
      S = G.state();
      $('#modal').hidden = true;
      U.toast('Save imported!', 'good');
    } catch (e) { U.toast('That doesn\'t look like a valid ChemCorp save.', 'bad'); }
  }

  function openCourse(cid) {
    sub.course = cid;
    sub.lesson = 0;
    sub.quiz = false;
    sub.result = null;
    G.readLesson(cid, 0);
  }

  function onClick(e) {
    const t = e.target.closest('[data-act]');
    if (!t || t.disabled) return;
    if (t.tagName === 'A') e.preventDefault();
    const fn = ACT[t.dataset.act];
    if (!fn) return;
    S = G.state();
    fn(t.dataset, t, e);
    dirty = true;
  }
  function onChange(e) {
    const t = e.target;
    const k = t.dataset.change;
    if (!k) return;
    if (k === 'solvent') L.setSolvent(t.value);
    else if (k === 'additive') L.setAdditive(t.value);
    else if (k === 'loadProc' && t.value) L.load(t.value);
    dirty = true;
  }
  function onKey(e) {
    const t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    S = G.state();
    const n = e.key === '0' ? 10 : parseInt(e.key, 10);
    if (n >= 1 && n <= TABS.length) ACT.tab({ tab: TABS[n - 1][0] });
    else if (e.key === 'm' || e.key === 'M') ACT.maxAll();
    else if (e.key === 's' || e.key === 'S') ACT.save();
    else if (e.key === ' ' && tab === 'lab') { e.preventDefault(); if (S.lab.run) L.workup(); else L.start(); }
    else if (e.key === 'Escape') $('#modal').hidden = true;
    else return;
    dirty = true;
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.input === 'autosave') {
      S.settings.autosave = +t.value;
      const l = $('#autosave-val');
      if (l) l.textContent = t.value + 's';
      return;
    }
    if (t.dataset.input === 'temp') {
      L.setTemp(+t.value);
      const lbl = $('#lab-set');
      if (lbl) lbl.textContent = S.lab.set;
    }
  }

  // ───────────────────────── frame ─────────────────────────
  let badgeTimer = 0;
  U.frame = function (dt) {
    S = G.state();
    applySettings();
    header();
    badgeTimer += dt;
    if (dirty || badgeTimer > 1) { tabs(); goal(); badgeTimer = 0; }
    const active = document.activeElement;
    // Don't rebuild the page under a control the player is using (a slider drag, an open dropdown).
    // A tab switch always renders.
    const dragging = pointerDown && Date.now() - pointerDown < 4000;
    const editing = active && /^(SELECT|TEXTAREA)$/.test(active.tagName) && active.offsetParent !== null && ($('#view').contains(active) || $('#modal').contains(active));
    const busy = !forceRender && (dragging || editing);
    if (dirty && !busy) {
      forceRender = false;
      render();
      dirty = false;
    }
    live();
    if (tab === 'lab') updateVessel();
  };

  function header() {
    $('#h-money').textContent = CC.money(S.money);
    $('#h-rp').textContent = CC.fmt(S.rp);
    const mr = G.rates.money, rr = G.rates.rp;
    $('#h-mrate').textContent = mr > 0.005 ? `You are earning ${CC.money(mr)} per second.` : '\u00a0';
    $('#h-rrate').textContent = rr > 0.005 ? ` (+${CC.fmt(rr)}/s)` : '';
  }

  function tabs() {
    const badges = {
      research: CC.TECH.filter((t) => G.canResearch(t)).length,
      academy: CC.School.dueCount(),
      market: S.contracts.length,
    };
    $('#tabs').innerHTML = TABS.map(([id, label]) => {
      const b = badges[id];
      return `<button class="${tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}">${label}${b ? `<span class="badge${b === '!' ? ' warn' : ''}">${b}</span>` : ''}</button>`;
    }).join('');
  }

  function goal() {
    const g = G.currentGoal();
    $('#goal').innerHTML = g ? `🎯 <b>Objective:</b> ${esc(g.text)}` : '';
  }

  function render() {
    const view = $('#view');
    const scroll = {};
    view.querySelectorAll('[data-keep-scroll]').forEach((el) => { scroll[el.dataset.keepScroll] = [el.scrollTop, el.scrollLeft]; });
    const fn = { lab: renderLab, market: renderMarket, upgrades: renderUpgrades, plant: renderPlant, research: renderResearch, academy: renderAcademy, puzzles: renderPuzzles, map: renderMap, stats: renderStats, options: renderOptions }[tab];
    try {
      view.innerHTML = fn();
    } catch (e) {
      console.error(e);
      // Bad state from an older save: clear the bench and try once more.
      if (tab === 'lab' && !render.retried) {
        render.retried = true;
        S.lab.slots = []; S.lab.report = null; S.lab.run = null;
        render();
        render.retried = false;
        return;
      }
      view.innerHTML = `<section class="panel"><h3>⚠️ Something went wrong drawing this tab</h3><p class="note">${esc(e.message)}</p><button class="btn" data-act="tab" data-tab="lab">Back to the Lab</button></section>`;
    }
    view.querySelectorAll('[data-keep-scroll]').forEach((el) => {
      const s = scroll[el.dataset.keepScroll];
      if (s) { el.scrollTop = s[0]; el.scrollLeft = s[1]; }
    });
    if (tab === 'lab') initVessel();
  }

  // Update text/bars/disabled states in place.
  function live() {
    const view = $('#view');
    view.querySelectorAll('[data-live]').forEach((el) => {
      const [k, id] = el.dataset.live.split(':');
      switch (k) {
        case 'inv': el.textContent = qty(S.inv[id]); break;
        case 'price': el.textContent = CC.money(G.price(id)); break;
        case 'dem': el.style.width = CC.pct(G.demand(id)); el.parentNode.title = 'Demand ' + CC.pct(G.demand(id)); break;
        case 'rxp': { const g = S.reactors[id]; el.style.width = g ? CC.pct(Math.min(1, g.p)) : '0%'; break; }
        case 'rxs': { const g = S.reactors[id]; el.innerHTML = g ? rxStatus(g) : ''; break; }
        case 'ct': { const c = S.contracts.find((x) => x.id === +id); el.textContent = c ? CC.time((c.expires - Date.now()) / 1000) : ''; break; }
        case 'rp': el.textContent = CC.fmt(S.rp); break;
        case 'saved': el.textContent = G.lastSave ? CC.time((Date.now() - G.lastSave) / 1000) + ' ago' : 'not yet this session'; break;
        case 'rxa': { const g = S.reactors[id]; el.textContent = g ? g.n : 0; break; }
      }
    });
    view.querySelectorAll('[data-cost],[data-rp],[data-inv]').forEach((el) => {
      if (el.dataset.lock) return;
      let ok = true;
      if (el.dataset.cost && S.money < +el.dataset.cost - 1e-9) ok = false;
      if (el.dataset.rp && S.rp < +el.dataset.rp - 1e-9) ok = false;
      if (el.dataset.inv) { const [id, q] = el.dataset.inv.split('@'); if ((S.inv[id] || 0) < +q - 1e-9) ok = false; }
      el.disabled = !ok;
    });
  }

  // ───────────────────────── settings & news ─────────────────────────
  let appliedKey = '';
  function applySettings() {
    const st = S.settings;
    const key = st.theme + st.notation + st.news;
    if (key === appliedKey) return;
    appliedKey = key;
    document.documentElement.dataset.theme = st.theme;
    CC.notation = st.notation;
    $('#news').hidden = !st.news;
    dirty = true;
  }

  const NEWS = [
    'BREAKING: Local chemist adds water to acid, regrets it. Always add acid to water!',
    'Benzene ring spotted chasing its own tail — Kekulé "not surprised".',
    'Study finds 100% of reactions eventually reach equilibrium, or the chemist goes home.',
    'Avogadro\'s constant still 6.022 × 10²³; mole community relieved.',
    'Esters demand recognition as "the nice-smelling ones".',
    'Grignard reagent spotted near a glass of water. Authorities urge calm.',
    'Breaking: chemist forgets to stock H₂SO₄, Fischer esterification takes 3 weeks.',
    'Diazonium salt reaches 6 °C. There were no survivors (of the diazonium salt).',
    'Local free radical refuses to pair up, cites "independence".',
    'Palladium prices rise as Suzuki, Heck and Sonogashira enter the chat.',
    'Chemists confirm: the yield is always lower after recrystallisation, but your soul is purer.',
    'New study: 9 out of 10 TLC plates are run in the wrong eluent.',
    'Rotary evaporator bumps; entire product now on the ceiling.',
    'Le Chatelier\'s principle applied to sock drawer — equilibrium shifts towards odd socks.',
    'Aromaticity: still the most stable relationship in chemistry.',
    'Carbocation rearranges itself for the third time this week, says it "finally feels stable".',
  ];
  let newsBusy = false;
  function nextNews() {
    const el = $('#news-text');
    if (!el || !S.settings.news) { newsBusy = false; return; }
    const pool = NEWS.concat(CC.RECIPES.filter((r) => G.researched(r)).map((r) => 'Did you know? ' + r.learn));
    const txt = CC.pick(pool);
    el.textContent = txt;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = `ticker ${Math.round(12 + txt.length * 0.14)}s linear 1`;
    newsBusy = true;
  }
  U.startNews = function () {
    const el = $('#news-text');
    el.addEventListener('animationend', nextNews);
    nextNews();
  };

  // ───────────────────────── toasts / modal ─────────────────────────
  U.toast = function (msg, kind) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 5) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 4200);
  };
  U.modal = function (html) {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-box">${html}</div>`;
    m.hidden = false;
  };
  U.help = function () {
    U.modal(`
      <h2>⚗️ Welcome to ChemCorp</h2>
      <p>You run a tiny organic chemistry lab. Turn cheap reagents into valuable products, learn real chemistry, and grow into an automated chemical plant.</p>
      <ul>
        <li><b>🧪 Lab</b> — click reagents on your shelf to add them to the flask, set their <b>equivalents</b>, pick a <b>solvent</b>, <b>catalyst</b>, <b>atmosphere</b> and <b>bath temperature</b>, then start. Watch the yield-vs-time graph: hotter is faster (rate doubles every 10 °C) but overheating causes side reactions, and exothermic reactions heat themselves. <b>Work up</b> when the curve flattens — waiting longer gives more product, with diminishing returns.</li>
        <li>The <b>Notebook</b> (right column) gives hints for every reaction you've researched. Get one right and the full procedure is recorded so you can load it in one click.</li>
        <li><b>🏪 Market</b> — buy reagents, stock solvents/catalysts, sell products and fill contracts. Selling a lot of one product lowers its price for a while — diversify!</li>
        <li><b>🎓 Academy</b> — <b>Chem School</b> rounds (functional groups, naming, reactions, conditions) pay RP and use spaced repetition: each item needs 10 reviews, spread out over days, to be learned. <b>Courses</b> teach the theory and unlock research.</li>
        <li><b>🔬 Research</b> — spend RP and money to unlock reactions and equipment.</li>
        <li><b>🏭 Plant</b> — once you've run a reaction enough times by hand, build reactors that run it automatically, even while you're away.</li>
      </ul>
      <p class="note">Progress saves automatically in this browser. Export a backup from the Stats tab.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="closeModal">Let's do chemistry</button></div>`);
  };

  // ───────────────────────── LAB ─────────────────────────
  function renderLab() {
    const b = S.lab;
    const e = G.equip();
    const run = b.run;
    const req = L.requirements();
    const known = CC.RECIPES.filter((r) => G.researched(r) && G.known(r.id));
    const inSlots = new Set(L.slotIds());

    const shelf = Object.keys(S.inv)
      .filter((id) => S.inv[id] > 1e-6 && CC.ITEMS[id] && !inSlots.has(id))
      .sort((a, c) => name(a).localeCompare(name(c)))
      .map((id) => `<button class="chip ${CC.ITEMS[id].kind === 'product' ? 'prod' : ''}" data-act="add" data-id="${id}" title="${esc(CC.ITEMS[id].desc || '')}">${esc(name(id))} <small data-live="inv:${id}">${qty(S.inv[id])}</small></button>`)
      .join('') || '<span class="empty">Your shelf is empty — buy reagents in the Market.</span>';

    const slots = b.slots.map((s) => {
      const r = req.reagents.find((x) => x.id === s.id);
      const short = r.have < r.need - 1e-9;
      return `<div class="slot">
        <div><div class="nm">${esc(name(s.id))} <span class="f">${esc(CC.ITEMS[s.id].f)}</span></div>
        <div class="need ${short ? 'short' : ''}">uses ${qty(r.need)} mol · have <span data-live="inv:${s.id}">${qty(r.have)}</span></div></div>
        <div class="eq"><button class="btn sm" data-act="eq" data-id="${s.id}" data-d="-1">−</button><span>${CC.fmt(s.eq)} eq</span><button class="btn sm" data-act="eq" data-id="${s.id}" data-d="1">+</button></div>
        <button class="x" data-act="rm" data-id="${s.id}" title="Remove">×</button></div>`;
    }).join('');
    const emptySlots = Array.from({ length: 3 - b.slots.length }, () => '<div class="slot emptyslot">empty — click a shelf item</div>').join('');

    const ownedOf = (kind) => CC.ITEM_LIST.filter((it) => it.kind === kind && S.owned[it.id]);
    const solventOpts = ['none', ...ownedOf('solvent').map((it) => it.id)];
    if (!solventOpts.includes(b.solvent)) b.solvent = 'none';
    const additiveOpts = ['none', ...ownedOf('additive').map((it) => it.id)];
    if (!additiveOpts.includes(b.additive)) b.additive = 'none';

    const atmBtns = Object.entries(G.ATMS).map(([a, m]) =>
      `<button class="btn ${b.atm === a ? 'on' : ''}" data-act="atm" data-a="${a}" ${e.atms.has(a) ? '' : 'disabled data-lock="1" title="Requires research"'}>${m.icon} ${m.name}</button>`).join('');

    const missingCost = req.reagents.reduce((s, x) => s + Math.max(0, x.need - x.have) * (CC.ITEMS[x.id].kind === 'reagent' ? CC.ITEMS[x.id].cost : Infinity), 0);

    const setup = `<section class="panel">
      <h3>Reaction setup <span class="spacer"></span><span class="tag" title="Batch size multiplier from your vessel upgrade">batch ×${G.scale()}</span></h3>
      <fieldset ${run ? 'disabled' : ''}>
      <div class="field"><label>Load a known procedure</label>
        <div class="row"><select data-change="loadProc" style="flex:1"><option value="">${known.length ? '— choose —' : '— none recorded yet —'}</option>${known.map((r) => `<option value="${r.id}">${esc(r.name)} → ${esc(name(Object.keys(r.products)[0]))}</option>`).join('')}</select>
        <button class="btn" data-act="repeat" ${b.last ? '' : 'disabled data-lock="1"'} title="Repeat the last setup">↻ Repeat</button></div></div>
      <div class="field"><label>Reagents in the flask</label><div class="slots">${slots}${emptySlots}</div>
        <label class="lbl2">Shelf</label><div class="shelf" data-keep-scroll="shelf">${shelf}</div></div>
      <div class="field"><label>Solvent</label><select data-change="solvent">${solventOpts.map((id) => `<option value="${id}" ${b.solvent === id ? 'selected' : ''}>${esc(id === 'none' ? 'None (neat)' : name(id))}</option>`).join('')}</select></div>
      <div class="field"><label>Catalyst / additive</label><select data-change="additive">${additiveOpts.map((id) => `<option value="${id}" ${b.additive === id ? 'selected' : ''}>${esc(name(id))}</option>`).join('')}</select></div>
      <div class="field"><label>Atmosphere</label><div class="seg">${atmBtns}</div></div>
      <div class="field"><label>Apparatus</label><div class="seg"><button class="btn ${b.app !== 'distil' ? 'on' : ''}" data-act="app" data-a="reflux" title="Condenser vertical: vapour drips back, nothing escapes">🔁 Heat under reflux</button><button class="btn ${b.app === 'distil' ? 'on' : ''}" data-act="app" data-a="distil" title="Condenser angled away: volatile products are collected as they form">⚗️ Distil off product</button></div></div>
      </fieldset>
      <div class="field"><label>Bath setpoint: <b id="lab-set" style="color:var(--text)">${b.set}</b> °C <small>(${e.tMin} to ${e.tMax} °C)</small></label>
        <input type="range" min="${e.tMin}" max="${e.tMax}" step="1" value="${b.set}" data-input="temp" id="lab-temp" /></div>
      <div class="row between">
        <div class="note">Solvent + additive: <b class="c-money">${CC.money(req.money)}</b>${missingCost > 0 && isFinite(missingCost) ? ` · <button class="btn sm" data-act="buyMissing" data-cost="${missingCost}">Buy missing (${CC.money(missingCost)})</button>` : ''}</div>
        <div class="row"><button class="btn" data-act="clear" ${run || !b.slots.length ? 'disabled data-lock="1"' : ''}>Empty</button>
        <button class="btn primary big" data-act="start" ${run ? 'disabled data-lock="1"' : ''}>▶ Start</button></div>
      </div>
    </section>`;

    const r = run ? CC.RECIPE[run.rid] : null;
    const vessel = `<section class="panel">
      <h3>${r ? `⏳ ${esc(r.name)}` : 'Reaction vessel'}<span class="spacer"></span>${r ? `<span class="tag" title="Recommended range">${tempText(r)}</span>` : ''}</h3>
      <div class="vessel-wrap">${flaskSvg()}${thermoSvg()}</div>
      <div class="readouts"><span>Flask <b id="lab-T">${b.T.toFixed(1)}</b> °C</span>${r ? `<span>Time <b id="lab-time">—</b></span><span>Yield <b id="lab-y">—</b></span><span>Rate <b id="lab-rate">—</b></span>` : '<span>Set the bath before you start — it takes time to heat or cool.</span>'}</div>
      ${r || (S.lab.report && S.lab.report.hist) ? graphSvg() : ''}
      ${r ? `<div class="note" id="lab-proj" style="text-align:center"></div>` : ''}
      ${run ? `<div class="row run-controls"><button class="btn primary" data-act="workup" title="Stop the reaction and isolate the product">🧪 Work up now</button><button class="btn danger" data-act="abort">✖ Abort</button></div>` : ''}
      ${reportHtml()}
    </section>`;

    return `<div class="grid lab-grid">${setup}${vessel}${notebook()}</div>`;
  }

  function reportHtml() {
    const rep = S.lab.report;
    if (!rep) return '';
    const close = '<button class="x" data-act="dismiss" title="Dismiss" style="margin-left:auto">×</button>';
    if (rep.type === 'none') {
      const near = rep.near ? CC.RECIPE[rep.near] : null;
      return `<div class="report fail"><h4>🤷 No reaction ${close}</h4>
        <div>These starting materials don't react in any procedure your lab knows. Nothing was consumed.</div>
        ${near ? `<div class="learn">Closest reaction in your notebook — <b>${esc(near.name)}</b>: ${esc(near.hint)}</div>` : ''}</div>`;
    }
    if (rep.type === 'locked') {
      const r = CC.RECIPE[rep.rid];
      const t = CC.TECH_BY_ID[r.tech];
      return `<div class="report fail"><h4>🔒 Unknown chemistry ${close}</h4>
        <div>Something could happen with these reagents, but your chemists don't know how to control it yet. Research <b>${esc(t.name)}</b> first. Nothing was consumed.</div></div>`;
    }
    if (rep.type === 'missing') {
      const cost = rep.missing.reduce((s, x) => s + (x.need - x.have) * (CC.ITEMS[x.id].cost || 0), 0);
      const buyable = rep.missing.every((x) => CC.ITEMS[x.id].kind === 'reagent');
      return `<div class="report fail"><h4>📦 Not enough reagents ${close}</h4>
        <div>${rep.missing.map((x) => `${esc(name(x.id))}: need ${qty(x.need)} mol, have ${qty(x.have)}`).join('<br>')}</div>
        ${buyable ? `<div class="row" style="margin-top:8px"><button class="btn" data-act="buyMissing" data-cost="${cost}">Buy missing (${CC.money(cost)})</button></div>` : '<div class="note" style="margin-top:6px">Intermediates must be made in an earlier step.</div>'}</div>`;
    }
    if (rep.type === 'abort') return `<div class="report fail"><h4>✖ Run aborted ${close}</h4><div>The reagents were lost.</div></div>`;
    // result
    const r = CC.RECIPE[rep.rid];
    const overall = rep.y;
    const fx = rep.factors.map((f) => {
      const cls = f.f >= 0.95 ? 'c-good' : f.f >= 0.5 ? 'c-warn' : 'c-bad';
      const v = f.info ? 'ℹ' : f.pct ? CC.pct(f.f) : f.rate ? 'k×' + f.f.toFixed(2) : '×' + f.f.toFixed(2);
      return `<span class="k">${f.k}</span><span class="v ${f.info ? '' : cls}">${v}</span><span>${esc(f.msg)}</span>`;
    }).join('');
    const out = rep.out.length ? rep.out.map((o) => `<b>${qty(o.amt)} mol</b> ${esc(name(o.id))}`).join(', ') : 'nothing usable';
    return `<div class="report ${rep.success ? 'ok' : 'fail'}">
      <h4>${rep.fatal ? '💥' : rep.success ? '✅' : '⚠️'} ${CC.pct(overall)} isolated yield ${close}</h4>${rep.fatal ? `<div class="c-bad">${esc(rep.fatal)}</div>` : ''}
      <div>Made ${out}.${rep.rp ? ` <span class="c-rp">+${CC.fmt(rep.rp)} RP</span>` : ''}</div>
      <div class="fx">${fx}</div>
      ${rep.first ? '<div class="learn">📗 <b>New procedure recorded in your notebook!</b> You can now load it with one click.</div>' : ''}
      ${rep.success ? `<div class="learn">💡 ${esc(r.learn)}</div>` : '<div class="note">Below 30% yield the run doesn\'t count towards mastery. Check the factors above and your notebook hint.</div>'}
    </div>`;
  }

  function notebook() {
    const list = CC.RECIPES.filter((r) => G.researched(r));
    const items = list.map((r) => {
      const known = G.known(r.id);
      const open = sub.nbOpen[r.id] != null ? sub.nbOpen[r.id] : !known && G.runs(r.id) === 0;
      const main = Object.keys(r.products)[0];
      const it = CC.ITEMS[main];
      const sop = r.additive ? `${name(r.additive.id)} (${amtText(r.additive.amt)})` : 'none';
      const proc = known ? `<div class="proc">
          <span class="k">Reagents</span><span>${Object.entries(r.reagents).map(([id, eq]) => `${esc(name(id))} (${CC.fmt(eq)} eq)`).join(' + ')}</span>
          <span class="k">Solvent</span><span>${r.solvents.map((s) => esc(s === 'none' ? 'none (neat)' : name(s))).join(' or ')}</span>
          <span class="k">Additive</span><span>${esc(sop)}</span>
          <span class="k">Atmosphere</span><span>${r.atm ? G.ATMS[r.atm].name : 'any'}</span>
          ${r.app ? `<span class="k">Apparatus</span><span>${r.app === 'distil' ? 'distil the product off as it forms' : 'heat under reflux'}</span>` : ''}
          <span class="k">Best temp.</span><span>${tempText(r)}${r.exo ? ` <span class="tag warn">exothermic</span>` : ''}${r.strict ? ` <span class="tag bad">strict</span>` : ''}</span>
          <span class="k">Products</span><span>${Object.entries(r.products).map(([id, n]) => `${n > 1 ? n + ' ' : ''}${esc(name(id))}`).join(' + ')}</span>
        </div><button class="btn sm primary" data-act="load" data-id="${r.id}">Load into flask</button>`
        : `<button class="btn sm" data-act="reveal" data-id="${r.id}" data-rp="${G.revealCost(r)}">🔎 Look up full procedure (${CC.fmt(G.revealCost(r))} RP)</button>`;
      return `<div class="nb">
        <div class="nb-h" data-act="nb" data-id="${r.id}"><span class="nm">${esc(r.name)}</span>${stars(G.mastery(r.id))}<span class="tag">T${r.tier}</span><span>${open ? '▾' : '▸'}</span></div>
        ${open ? `<div class="nb-b"><div class="note">${esc(r.cls)} → <b>${esc(it.name)}</b>${it.sellable === false ? ' (intermediate)' : ` · sells ~${CC.money(G.price(main))}/mol`} · runs: ${Math.floor(G.runs(r.id))}</div>
          <div class="hint">${esc(r.hint)}</div>${proc}</div>` : ''}
      </div>`;
    }).join('');
    return `<section class="panel notebook"><h3>📓 Notebook <span class="spacer"></span><small>${list.length} reactions</small></h3>
      <div class="nb-list" data-keep-scroll="nb">${items}</div></section>`;
  }

  // ── vessel graphics ──
  function flaskSvg() {
    const bubbles = Array.from({ length: 9 }, (_, i) => `<circle class="bub" cx="${78 + ((i * 37) % 64)}" cy="${212 - (i % 3) * 8}" r="${2 + (i % 3)}" style="animation-delay:${(i * 0.17).toFixed(2)}s"/>`).join('');
    return `<svg class="flask" id="lab-flask" viewBox="0 0 220 260" aria-label="Reaction flask">
      <defs><clipPath id="flaskClip"><circle cx="110" cy="160" r="64"/><rect x="96" y="40" width="28" height="70"/></clipPath>
        <radialGradient id="shine" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#fff" stop-opacity="0.25"/><stop offset="60%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <ellipse id="lab-bath" cx="110" cy="236" rx="96" ry="18" fill="#a7b0bb"/>
      <rect class="hotplate" x="20" y="226" width="180" height="26" rx="4"/>
      <rect class="cond" x="98" y="0" width="24" height="40" rx="4"/>
      <line class="cond-in" x1="110" y1="2" x2="110" y2="40"/>
      <circle class="drip" cx="110" cy="40" r="2"/>
      <g clip-path="url(#flaskClip)">
        <rect id="lab-liquid" x="0" y="150" width="220" height="130" fill="#cfe8ff"/>
        <g>${bubbles}</g>
        <rect class="stirbar" x="98" y="214" width="24" height="6" rx="3"/>
      </g>
      <path class="glass" d="M96 40 V96.5 A64 64 0 1 0 124 96.5 V40 Z"/>
      <circle cx="110" cy="160" r="64" fill="url(#shine)" pointer-events="none"/>
      <rect x="92" y="36" width="36" height="6" rx="2" fill="rgba(200,225,255,0.7)"/>
    </svg>`;
  }
  const TY = (T) => 210 - ((CC.clamp(T, -20, 300) + 20) / 320) * 196;
  function thermoSvg() {
    const ticks = [0, 50, 100, 150, 200, 250, 300].map((t) => `<line x1="30" x2="35" y1="${TY(t)}" y2="${TY(t)}" /><text x="37" y="${TY(t) + 3}">${t}</text>`).join('');
    return `<svg class="thermo" viewBox="0 0 54 240" aria-label="Thermometer">
      <rect class="tube" x="15" y="8" width="12" height="206" rx="6"/>
      <rect id="lab-merc" x="18" y="200" width="6" height="20" rx="3"/>
      <circle class="bulb" cx="21" cy="222" r="11"/>
      <polygon id="lab-setmark" points="6,0 12,4 6,8"/>
      ${ticks}
    </svg>`;
  }
  function initVessel() { updateVessel(true); }

  function liquidColor() {
    const b = S.lab;
    const cols = b.slots.map((s) => CC.ITEMS[s.id].color || '#cfe8ff');
    let base = cols.length ? cols.reduce((a, c) => CC.mix(a, c, 0.5)) : '#cfe8ff';
    if (b.run) {
      const r = CC.RECIPE[b.run.rid];
      const prod = CC.ITEMS[Object.keys(r.products)[0]].color || '#ffffff';
      const t = b.run.fatal ? Math.min(1, b.run.t / r.time) : Math.min(1, CC.Lab.yieldNow(b.run));
      return b.run.fatal ? CC.mix(base, '#5a3b1e', t) : CC.mix(base, prod, t);
    }
    const rep = b.report;
    if (rep && rep.type === 'result') {
      const r = CC.RECIPE[rep.rid];
      return rep.fatal ? '#5a3b1e' : CC.ITEMS[Object.keys(r.products)[0]].color || '#ffffff';
    }
    return base;
  }

  let lastShake = null;
  function updateVessel() {
    const flask = $('#lab-flask');
    if (!flask) return;
    const b = S.lab;
    const run = b.run;
    const r = run ? CC.RECIPE[run.rid] : null;
    const T = b.T;
    const hasLiquid = b.slots.length || run || (b.report && b.report.type === 'result');
    const liq = $('#lab-liquid');
    liq.setAttribute('y', hasLiquid ? 150 : 260);
    liq.setAttribute('fill', liquidColor());
    flask.classList.toggle('boil', !!run && (T > 60 || (r && r.exo > 2)));
    flask.classList.toggle('stir', !!run);
    flask.classList.toggle('reflux', !!run && T > 55);
    if (b.report && b.report.fatal && lastShake !== b.report) { lastShake = b.report; flask.classList.remove('shake'); void flask.getBBox(); flask.classList.add('shake'); }
    const bath = $('#lab-bath');
    const hot = CC.clamp((b.set - 22) / 180, 0, 1), cold = CC.clamp((22 - b.set) / 27, 0, 1);
    bath.setAttribute('fill', cold > 0 ? CC.mix('#a7b0bb', '#5ab0ff', cold) : CC.mix('#a7b0bb', '#ff5a1f', hot));
    $('#lab-T').textContent = T.toFixed(1);
    const merc = $('#lab-merc');
    merc.setAttribute('y', TY(T));
    merc.setAttribute('height', 214 - TY(T));
    $('#lab-setmark').setAttribute('transform', `translate(0 ${TY(b.set) - 4})`);
    if (r) {
      const y = L.yieldNow(run), rate = L.rateNow(run, T);
      $('#lab-time').textContent = run.t.toFixed(1) + 's';
      $('#lab-y').textContent = CC.pct(y, 1);
      $('#lab-rate').textContent = (rate >= 0 ? '+' : '') + (rate * 100).toFixed(2) + ' %/s';
      projTimer -= 1;
      if (projTimer <= 0) {
        projTimer = 5;
        const p10 = L.project(run, T, 10), p30 = L.project(run, T, 30);
        $('#lab-proj').innerHTML = `Estimate at the current temperature: <b>${CC.pct(p10, 1)}</b> in 10 s · <b>${CC.pct(p30, 1)}</b> in 30 s · max ${CC.fmt(run.theo)} batch${run.theo === 1 ? '' : 'es'}${run.theo < 1 ? ' (limited by ' + esc(name(run.limiting)) + ')' : ''}`;
      }
      drawGraph(run.hist, run.t, y, rate, r);
    } else if (b.report && b.report.hist) drawGraph(b.report.hist, b.report.hist[b.report.hist.length - 1][0], null, null, CC.RECIPE[b.report.rid]);
  }

  // ── yield-vs-time graph ──
  const GW = 320, GH = 150, GL = 34, GB = 20, GT = 8, GR = 8;
  let projTimer = 0;
  function graphSvg() {
    const yt = [0, 25, 50, 75, 100].map((v) => { const y = GT + (GH - GT - GB) * (1 - v / 100); return `<line x1="${GL}" x2="${GW - GR}" y1="${y}" y2="${y}" class="grid"/><text x="${GL - 4}" y="${y + 3}" text-anchor="end">${v}%</text>`; }).join('');
    return `<svg class="graph" id="lab-graph" viewBox="0 0 ${GW} ${GH}" aria-label="Yield against time">
      ${yt}<line x1="${GL}" x2="${GL}" y1="${GT}" y2="${GH - GB}" class="axis"/><line x1="${GL}" x2="${GW - GR}" y1="${GH - GB}" y2="${GH - GB}" class="axis"/>
      <g id="g-xt"></g><polyline id="g-temp" class="tline"/><polyline id="g-line" class="yline"/><line id="g-tan" class="tan"/><circle id="g-dot" r="3" class="dot"/>
      <text x="${GW - GR}" y="${GH - GB - 4}" text-anchor="end">time (s)</text><text x="${GL + 6}" y="${GT + 9}" class="lg-y">— yield</text><text x="${GL + 46}" y="${GT + 9}" class="lg-t">- - temperature</text><text x="${GL + 118}" y="${GT + 9}" class="lg-r">- - rate (tangent)</text></svg>`;
  }
  function drawGraph(hist, t, y, rate, r) {
    const svg = $('#lab-graph');
    if (!svg || !hist.length) return;
    const tMax = Math.max(r.time * 1.5, t * 1.15);
    const X = (s) => GL + (GW - GL - GR) * (s / tMax);
    const Y = (v) => GT + (GH - GT - GB) * (1 - CC.clamp(v, 0, 1.05) / 1.05 * 1.05);
    const tMaxT = Math.max(...hist.map((h) => h[2]), 50);
    const YT = (T) => GT + (GH - GT - GB) * (1 - CC.clamp(T, 0, tMaxT) / tMaxT);
    $('#g-line').setAttribute('points', hist.map((h) => `${X(h[0]).toFixed(1)},${Y(h[1]).toFixed(1)}`).join(' ') + (y != null ? ` ${X(t).toFixed(1)},${Y(y).toFixed(1)}` : ''));
    $('#g-temp').setAttribute('points', hist.map((h) => `${X(h[0]).toFixed(1)},${YT(h[2]).toFixed(1)}`).join(' '));
    const step = tMax > 120 ? 30 : tMax > 60 ? 15 : tMax > 24 ? 5 : 2;
    let xt = '';
    for (let s = step; s < tMax; s += step) xt += `<text x="${X(s)}" y="${GH - GB + 11}" text-anchor="middle">${s}</text>`;
    $('#g-xt').innerHTML = xt;
    const dot = $('#g-dot'), tan = $('#g-tan');
    if (y != null) {
      dot.setAttribute('cx', X(t)); dot.setAttribute('cy', Y(y));
      const dt = tMax * 0.12;
      tan.setAttribute('x1', X(t - dt)); tan.setAttribute('y1', Y(y - rate * dt));
      tan.setAttribute('x2', X(t + dt)); tan.setAttribute('y2', Y(y + rate * dt));
      tan.style.display = '';
      dot.style.display = '';
    } else { tan.style.display = 'none'; dot.style.display = 'none'; }
  }

  // ───────────────────────── MARKET ─────────────────────────
  function renderMarket() {
    const rel = G.relevant();
    const contracts = S.contracts.length
      ? `<div class="cards">${S.contracts.map((c) => {
          const it = CC.ITEMS[c.item];
          return `<div class="contract"><div class="row between"><b>${esc(c.client)}</b><small>⏱ <span data-live="ct:${c.id}"></span></small></div>
            <div>Wants <b>${qty(c.qty)} mol</b> ${esc(it.name)} <small>(have <span data-live="inv:${c.item}">${qty(S.inv[c.item])}</span>)</small></div>
            <div>Pays <b class="c-money">${CC.money(c.reward)}</b> + <span class="c-rp">${CC.fmt(c.rp)} RP</span> <small>(market: ${CC.money(G.price(c.item) * c.qty)})</small></div>
            <button class="btn primary sm" data-act="fulfil" data-id="${c.id}" data-inv="${c.item}@${c.qty}">Deliver</button></div>`;
        }).join('')}</div>`
      : '<div class="empty">No open contracts. Clients post orders for products you know how to make every minute or two.</div>';

    const sellIds = Object.keys(S.inv).filter((id) => S.inv[id] > 1e-6 && G.canSell(id))
      .sort((a, b) => (CC.ITEMS[a].kind === b.kind ? 0 : CC.ITEMS[a].kind === 'product' ? -1 : 1) || name(a).localeCompare(name(b)));
    const autosell = G.flag('autosell');
    const sellRows = sellIds.map((id) => {
      const it = CC.ITEMS[id];
      const prod = it.kind === 'product';
      return `<tr><td><b>${esc(it.name)}</b> <span class="f">${esc(it.f)}</span>${prod ? '' : ' <span class="tag">surplus reagent · 50%</span>'}</td>
        <td class="mono" data-live="inv:${id}">${qty(S.inv[id])}</td>
        <td class="mono c-money" data-live="price:${id}">${CC.money(G.price(id))}</td>
        <td style="min-width:90px">${prod ? `<div class="bar thin dem"><i data-live="dem:${id}"></i></div>` : ''}</td>
        <td><div class="row"><button class="btn sm" data-act="sell" data-id="${id}" data-q="1" data-inv="${id}@1">1</button><button class="btn sm" data-act="sell" data-id="${id}" data-q="half">½</button><button class="btn sm" data-act="sell" data-id="${id}" data-q="all">All</button>
        ${prod && autosell ? `<button class="btn sm ${S.autoSell[id] ? 'on' : ''}" data-act="autoSell" data-id="${id}" title="Automatically sell what your reactors make">Auto ${S.autoSell[id] ? 'ON' : 'off'}</button>` : ''}</div></td></tr>`;
    }).join('');
    // Products whose auto-sell is on but have no stock still need a toggle.
    const autoOnly = autosell ? CC.RECIPES.filter((r) => G.researched(r)).flatMap((r) => Object.keys(r.products))
      .filter((p, i, a) => a.indexOf(p) === i && CC.ITEMS[p].kind === 'product' && G.canSell(p) && !sellIds.includes(p) && G.runs(CC.RECIPES.find((r) => r.products[p]).id) >= 1) : [];

    const amt = sub.buyAmt;
    const reagents = CC.ITEM_LIST.filter((it) => it.kind === 'reagent' && rel.has(it.id));
    const buyRows = reagents.map((it) => `<tr><td><b>${esc(it.name)}</b> <span class="f">${esc(it.f)}</span><div class="note">${esc(it.desc)}</div></td>
        <td class="mono" data-live="inv:${it.id}">${qty(S.inv[it.id])}</td>
        <td class="mono c-money">${CC.money(it.cost)}</td>
        <td><div class="row"><button class="btn sm" data-act="buy" data-id="${it.id}" data-q="${amt}" data-cost="${it.cost * amt}">+${CC.fmt(amt)} (${CC.money(it.cost * amt)})</button><button class="btn sm" data-act="buyMax" data-id="${it.id}" data-cost="${it.cost}">Max</button></div></td></tr>`).join('');

    const stock = CC.ITEM_LIST.filter((it) => (it.kind === 'solvent' || it.kind === 'additive') && (rel.has(it.id) || S.owned[it.id]));
    const stockCards = stock.map((it) => `<div class="panel upg"><div class="hd"><b>${esc(it.name)}</b> <span class="f">${esc(it.f)}</span><span class="lv">${it.kind}</span></div>
        <div class="note">${esc(it.desc)}</div>
        <div class="note">Per use: ${CC.money(it.use)} ${it.kind === 'solvent' ? 'per batch' : 'per mol'}</div>
        ${S.owned[it.id] ? '<span class="tag good">✓ In stock</span>' : `<button class="btn sm" data-act="stock" data-id="${it.id}" data-cost="${it.unlock}">Stock it (${CC.money(it.unlock)})</button>`}</div>`).join('');

    return `<div class="stack">
      <section class="panel"><h3>📜 Contracts</h3>${contracts}</section>
      <div class="grid two">
        <section class="panel"><h3>💰 Sell <span class="spacer"></span><small>prices drop as you flood a market and recover over time</small></h3>
          ${sellRows || autoOnly.length ? `<div class="tscroll"><table class="t"><thead><tr><th>Item</th><th>Have</th><th>Price/mol</th><th>Demand</th><th></th></tr></thead><tbody>${sellRows}
          ${autoOnly.map((p) => `<tr><td><b>${esc(name(p))}</b></td><td class="mono">0</td><td class="mono c-money" data-live="price:${p}">${CC.money(G.price(p))}</td><td><div class="bar thin dem"><i data-live="dem:${p}"></i></div></td><td><button class="btn sm ${S.autoSell[p] ? 'on' : ''}" data-act="autoSell" data-id="${p}">Auto ${S.autoSell[p] ? 'ON' : 'off'}</button></td></tr>`).join('')}
          </tbody></table></div>` : '<div class="empty">Nothing to sell yet — make something in the Lab.</div>'}
        </section>
        <section class="panel"><h3>🧴 Buy reagents <span class="spacer"></span><span class="row amt-sel">${[1, 10, 100, 1000, 10000].map((q) => `<button class="btn sm ${amt === q ? 'on' : ''}" data-act="buyAmt" data-q="${q}">${CC.fmt(q)}</button>`).join('')}</span></h3>
          <div class="tscroll"><table class="t"><thead><tr><th>Reagent</th><th>Have</th><th>$/mol</th><th></th></tr></thead><tbody>${buyRows}</tbody></table></div>
          <div class="note" style="margin-top:6px">Only reagents used by reactions you've researched are listed.</div>
        </section>
      </div>
      <section class="panel"><h3>🗄️ Stockroom — solvents & catalysts</h3><div class="note" style="margin-bottom:10px">Stock an item once; afterwards each use is charged automatically.</div><div class="cards">${stockCards}</div></section>
    </div>`;
  }

  // ───────────────────────── UPGRADES ─────────────────────────
  function renderUpgrades() {
    const cards = G.UPGRADES.filter((u) => G.upgradeVisible(u)).map((u) => {
      const l = G.lvl(u.id);
      const maxed = l >= u.max;
      const c = u.cost(l);
      return `<button class="upgbtn ${maxed ? 'bought' : ''}" data-act="upg" data-id="${u.id}" ${maxed ? 'disabled data-lock="1"' : `data-cost="${c}"`}>
        <span class="u-ic">${u.icon}</span><b>${esc(u.name)}</b>
        <span class="u-desc">${esc(u.desc(l))}</span>
        <span class="u-lv">${u.max > 1 ? `Level ${l}${u.max < 100 ? ' / ' + u.max : ''}` : l ? 'Owned' : ''}</span>
        ${maxed ? '<span class="u-cost">MAXED</span>' : `<span class="u-next">${esc(u.next(l))}</span><span class="u-cost">Cost: ${CC.money(c)}</span>`}
      </button>`;
    }).join('');
    return `<section class="panel"><h3>🛠️ Lab upgrades</h3><div class="note center" style="margin-bottom:14px">Spend money to make your whole operation bigger and faster.</div><div class="upggrid">${cards}</div></section>`;
  }

  // ───────────────────────── PLANT ─────────────────────────
  function rxStatus(g) {
    const map = { running: ['good', 'Running'], limited: ['warn', 'Limited'], starved: ['bad', 'Starved'], blocked: ['bad', 'Blocked'], paused: ['', 'Paused'], idle: ['', 'Starting'] };
    const [cls, txt] = map[g.status] || ['', g.status];
    return `<span class="tag ${cls}">${txt}</span> ${g.why ? `<small>${esc(g.why)}</small>` : ''}`;
  }
  function renderPlant() {
    if (!G.flag('automation')) {
      return `<section class="panel center"><h3 style="justify-content:center">🏭 Plant</h3><p>Automated reactors run your mastered procedures around the clock — even while you're away.</p>
        <p class="note">Research <b>Lab Automation</b> (🔬 Research tab) to unlock the plant. Meanwhile, keep running reactions by hand: each recipe needs a few successful manual runs before you can write an SOP for it.</p></section>`;
    }
    const list = CC.RECIPES.filter((r) => G.researched(r));
    const ready = list.filter((r) => G.canAutomate(r));
    const pending = list.filter((r) => !G.canAutomate(r));
    const rows = ready.map((r) => {
      const g = S.reactors[r.id];
      const n = g ? g.n : 0;
      const main = Object.keys(r.products)[0];
      const ct = G.cycleTime(r);
      const perSec = (n / ct) * G.scale() * r.products[main] * G.autoYield(r);
      const sop = G.sop(r);
      const cost = G.reactorCost(r);
      return `<div class="dim">
        <div class="dim-name"><b>${esc(name(main))}</b> reactor ${stars(G.mastery(r.id))}<span class="mult">×${G.autoYield(r).toFixed(2)}</span>
          <div class="note">${esc(r.name)} · ${esc(sop.solvent === 'none' ? 'neat' : name(sop.solvent))}${sop.additive !== 'none' ? ', ' + esc(name(sop.additive)) : ''} · ${ct.toFixed(1)}s/cycle</div></div>
        <div class="dim-amt"><span class="big" data-live="rxa:${r.id}">${n}</span>${n ? `<small>+${qty(perSec)} mol/s</small>` : ''}
          ${n ? `<div class="bar thin"><i data-live="rxp:${r.id}"></i></div><div class="st" data-live="rxs:${r.id}">${rxStatus(g)}</div>` : ''}</div>
        <div class="dim-btns"><button class="btn dimbtn" data-act="reactor" data-id="${r.id}" data-cost="${cost}">Build 1<br>Cost: ${CC.money(cost)}</button>
          <button class="btn dimbtn" data-act="rmax" data-id="${r.id}" data-cost="${cost}">Max</button>
          ${n ? `<button class="btn dimbtn sm" data-act="rtoggle" data-id="${r.id}" title="${g.on ? 'Pause' : 'Resume'}">${g.on ? '⏸' : '▶'}</button>` : ''}</div>
      </div>`;
    }).join('');
    const prow = pending.map((r) => {
      const runs = G.runs(r.id), need = G.automateAt(r);
      return `<div class="dim locked"><div class="dim-name"><b>${esc(name(Object.keys(r.products)[0]))}</b> reactor<div class="note">${esc(r.name)}</div></div>
        <div class="dim-amt"><div class="bar thin"><i style="width:${CC.pct(Math.min(1, runs / need))}"></i></div><small>${Math.floor(runs)}/${need} manual runs</small></div>
        <div class="dim-btns"><button class="btn dimbtn" disabled data-lock="1">Locked<br>Run it ${need - Math.floor(runs)} more time(s)</button></div></div>`;
    }).join('');
    return `<section class="panel"><div class="row center-row">
        <button class="btn" data-act="maxAll">Max all (M)</button><button class="btn" data-act="allOn">▶ Run all</button><button class="btn" data-act="allOff">⏸ Pause all</button>
        ${G.flag('autobuy') ? `<button class="btn ${S.autoBuy ? 'on' : ''}" data-act="autoBuy" title="Reactors buy missing reagents at +10%">📦 Auto-buy: ${S.autoBuy ? 'ON' : 'OFF'}</button>` : ''}</div>
      <div class="note center" style="margin:8px 0 4px">Reactors follow the SOP, take ${CC.fmt(1.5)}× the manual time and reach ${CC.pct(G.autoQuality())} of the ideal yield (the ×multiplier). ${G.flag('autosell') ? 'Toggle auto-sell per product in the Market.' : ''}${G.flag('autobuy') ? '' : ' Without <b>Procurement System</b> research, keep reagents stocked yourself.'}</div>
      <div class="dims">${rows || '<div class="empty center">No reaction is ready for automation yet.</div>'}</div>
      ${prow ? `<h3 style="margin-top:16px">🔒 Needs more manual runs</h3><div class="dims">${prow}</div>` : ''}</section>`;
  }

  // ───────────────────────── RESEARCH ─────────────────────────
  const NW = 180, NH = 76, CW = 212, RH = 92;
  function renderResearch() {
    const maxC = Math.max(...CC.TECH.map((t) => t.pos[0]));
    const maxR = Math.max(...CC.TECH.map((t) => t.pos[1]));
    const W = (maxC + 1) * CW + 10, H = (maxR + 1) * RH + 10;
    const xy = (t) => [t.pos[0] * CW + 12, t.pos[1] * RH + 10];
    const lines = CC.TECH.flatMap((t) => t.req.map((q) => {
      const a = xy(CC.TECH_BY_ID[q]), b = xy(t);
      const x1 = a[0] + NW, y1 = a[1] + NH / 2, x2 = b[0], y2 = b[1] + NH / 2;
      const mx = (x1 + x2) / 2;
      return `<path class="${S.tech[q] ? 'done' : ''}" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;
    })).join('');
    if (!sub.tech) sub.tech = (CC.TECH.find((t) => G.canResearch(t)) || CC.TECH.find((t) => G.techState(t) === 'open') || CC.TECH[0]).id;
    const nodes = CC.TECH.map((t) => {
      const st = G.techState(t);
      const ready = G.canResearch(t);
      const [x, y] = xy(t);
      const needCourse = t.course && !G.coursePassed(t.course);
      return `<button class="node ${st} ${ready ? 'ready' : ''} ${sub.tech === t.id ? 'sel' : ''}" style="left:${x}px;top:${y}px" data-act="tech" data-id="${t.id}">
        <span class="nm">${t.icon} ${esc(t.name)}</span>
        <span class="cost">${st === 'done' ? '<span class="c-good">✓ researched</span>' : `${CC.fmt(t.rp)} RP${t.money ? ' · ' + CC.money(t.money) : ''}${needCourse ? ' · 📘' : ''}`}</span></button>`;
    }).join('');

    const t = CC.TECH_BY_ID[sub.tech];
    const st = G.techState(t);
    const fx = t.fx || {};
    const effects = [];
    (fx.recipes || []).forEach((rid) => { const r = CC.RECIPE[rid]; effects.push(`🧪 ${esc(r.name)} → ${Object.keys(r.products).map((p) => esc(name(p))).join(' + ')}`); });
    if (fx.tempMin != null) effects.push(`🌡️ Bath down to ${fx.tempMin} °C`);
    if (fx.tempMax != null) effects.push(`🌡️ Bath up to ${fx.tempMax} °C`);
    (fx.atm || []).forEach((a) => effects.push(`${G.ATMS[a].icon} ${G.ATMS[a].name} atmosphere`));
    const reqs = t.req.map((q) => `<span class="${S.tech[q] ? 'c-good' : 'c-bad'}">${S.tech[q] ? '✓' : '✗'} ${esc(CC.TECH_BY_ID[q].name)}</span>`);
    if (t.course) {
      const c = CC.COURSE[t.course];
      const ok = G.coursePassed(t.course);
      reqs.push(`<span class="${ok ? 'c-good' : 'c-bad'}">${ok ? '✓' : '✗'} Academy: ${c.icon} ${esc(c.name)} ${ok ? '' : `<button class="btn sm" data-act="goCourse" data-id="${c.id}">Study it →</button>`}</span>`);
    }
    const detail = `<section class="panel"><div class="detail"><div>
        <h3>${t.icon} ${esc(t.name)} ${st === 'done' ? '<span class="tag good">researched</span>' : ''}</h3>
        <div>${esc(t.desc)}</div>
        ${effects.length ? `<div class="reqs" style="margin-top:8px">${effects.map((x) => `<span>${x}</span>`).join('')}</div>` : ''}
        ${reqs.length && st !== 'done' ? `<div class="lbl2" style="margin-top:10px">Requires</div><div class="reqs">${reqs.join('')}</div>` : ''}
      </div><div>${st === 'done' ? '' : `<button class="btn primary big" data-act="research" data-id="${t.id}" ${G.canResearch(t) ? '' : 'disabled'} data-rp="${t.rp}" data-cost="${t.money}" ${st !== 'open' || (t.course && !G.coursePassed(t.course)) ? 'data-lock="1"' : ''}>Research — ${CC.fmt(t.rp)} RP${t.money ? ' + ' + CC.money(t.money) : ''}</button>`}</div></div></section>`;

    return `<div class="stack">${detail}
      <div class="tree-wrap" data-keep-scroll="tree"><div class="tree" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}">${lines}</svg>${nodes}</div></div>
      <div class="note">📘 = needs an Academy course · Gold border = ready to research.</div></div>`;
  }

  // ───────────────────────── ACADEMY ─────────────────────────
  function unlocksOf(cid) {
    return CC.TECH.filter((t) => t.course === cid).map((t) => t.name);
  }
  function renderAcademy() {
    const due = CC.School.dueCount();
    const tabsH = `<div class="row" style="margin-bottom:12px">${[['school', '🧠 Chem School'], ['courses', '📚 Courses'], ['learning', `📈 Learning${due ? ' (' + due + ' due)' : ''}`]].map(([id, l]) => `<button class="btn ${sub.acTab === id ? 'on' : ''}" data-act="acTab" data-t="${id}">${l}</button>`).join('')}</div>`;
    if (sub.course) return tabsH + renderCourse();
    if (sub.acTab === 'school') return tabsH + renderSchool();
    if (sub.acTab === 'learning') return tabsH + renderLearning();
    return tabsH + renderCourses();
  }

  function renderSchool() {
    const K = CC.School;
    const ks = K.state().stats;
    const rd = sub.round;
    if (rd) {
      if (rd.done && !sub.last) {
        return `<section class="panel"><h3>🏁 Round complete — ${rd.correct}/${rd.qs.length}</h3>
          <div class="c-rp" style="font-size:16px">+${CC.fmt(rd.earned + rd.bonus)} RP${rd.bonus ? ` (incl. ${CC.fmt(rd.bonus)} perfect-round bonus)` : ''}</div>
          <div class="row" style="margin-top:12px"><button class="btn primary" data-act="school" data-cat="${rd.cat === 'due' ? 'mixed' : rd.cat}" ${rd.cat === 'due' ? 'data-due="1"' : ''}>Another round</button><button class="btn" data-act="schoolQuit">Back to Chem School</button></div></section>`;
      }
      const qi = sub.last ? rd.i - 1 : rd.i;
      const q = rd.qs[qi];
      const res = sub.last;
      const cat = K.CATS[q.cat];
      const opts = q.options.map((o, i) => {
        let cls = '';
        if (res) cls = i === q.answer ? 'right' : rd.answers[qi].choice === i ? 'wrong' : '';
        return `<button class="opt ${cls}" data-act="schoolAns" data-o="${i}" ${res ? 'disabled' : ''}>${'ABCD'[i]}. ${esc(o)}</button>`;
      }).join('');
      const fb = res ? `<div class="report ${res.correct ? 'ok' : 'fail'}" style="margin-top:10px">
          <h4>${res.correct ? '✅ Correct' : '❌ Not quite'} ${res.rp ? `<span class="c-rp">+${CC.fmt(res.rp)} RP</span>` : ''}</h4>
          <div class="explain">${esc(res.explain)}</div>
          <div class="note" style="margin-top:6px">${res.learnedNow ? '🌟 Learned for good!' : !res.correct ? `Dropped back to review ${res.box}/${K.LEARN_BOX} — it will come up again soon.` : res.tooSoon ? 'Answered too soon after the last review — no RP and no progress. Come back when it is due.' : `Review ${res.box}/${K.LEARN_BOX}` + (res.box < K.LEARN_BOX ? ` · next counting review in ${CC.time(res.next / 1000)}` : '')}</div>
          <div class="row" style="margin-top:8px"><button class="btn primary" data-act="schoolNext">${res.last ? 'See results' : 'Next question →'}</button></div></div>` : '';
      return `<section class="panel"><div class="row between"><h3 style="margin:0">${cat.icon} ${esc(cat.name)} · ${qi + 1}/${rd.qs.length}</h3><span class="row">${rd.streak >= 2 ? `<span class="tag warn">🔥 streak ${rd.streak}</span>` : ''}<span class="tag c-rp">+${CC.fmt(rd.earned)} RP</span><button class="btn sm" data-act="schoolQuit">Quit</button></span></div>
        <div class="q" style="margin-top:12px"><div class="qt" style="font-size:16px">${esc(q.prompt)}</div>${q.formula ? `<div class="eq-wrap" style="font-size:20px;text-align:center">${esc(q.formula)}</div>` : ''}<div class="opts">${opts}</div></div>${fb}</section>`;
    }
    const due = K.dueCount();
    const cards = ['mixed', 'fg', 'name', 'rxn', 'cond', 'acad'].map((c) => {
      const C = K.CATS[c];
      const ok = K.available(c);
      const p = c === 'mixed' ? null : K.progress(c);
      return `<button class="course" data-act="school" data-cat="${c}" ${ok ? '' : 'disabled'}><span class="ic">${C.icon}</span><span class="nm">${esc(C.name)}</span><span class="note">${esc(C.blurb)}</span>
        ${p ? `<span class="row"><span class="tag good">${p.learned}/${p.total} learned</span>${p.due ? `<span class="tag warn">${p.due} due</span>` : ''}</span>` : ''}
        ${!ok ? '<span class="note">🔒 ' + (c === 'acad' ? 'Read a course first.' : 'Research a reaction first.') + '</span>' : ''}</button>`;
    }).join('');
    return `<div class="stack"><section class="panel"><h3>🧠 Chem School <span class="spacer"></span><small>${ks.rounds} rounds · ${ks.correct}/${ks.answered} correct · best streak ${ks.bestStreak}</small></h3>
      <div class="note" style="margin-bottom:12px">Five-question rounds. Every correct answer pays RP: <b>double</b> the first time you get an item right, normal when its review is <b>due</b>, and <b>nothing</b> if you answer again too soon. Streaks (from the 3rd answer in a row) and perfect rounds pay a bonus. An item is <b>learned</b> after ${K.LEARN_BOX} counting reviews, spaced from 10 minutes up to 2 weeks apart.</div>
      ${due ? `<div class="row" style="margin-bottom:12px"><button class="btn primary" data-act="school" data-cat="mixed" data-due="1">🔁 Review ${due} due item${due > 1 ? 's' : ''}</button></div>` : ''}
      <div class="cards">${cards}</div></section></div>`;
  }

  function renderLearning() {
    const K = CC.School;
    const f = sub.learnFilter;
    const items = K.items().filter((it) => f === 'all' || it.status === f);
    const order = { due: 0, learning: 1, new: 2, learned: 3 };
    items.sort((a, b) => order[a.status] - order[b.status] || a.due - b.due);
    const tag = { new: '', learning: 'tag', due: 'tag warn', learned: 'tag good' };
    const rows = items.slice(0, 300).map((it) => `<tr><td>${K.CATS[it.cat].icon}</td><td>${esc(it.label)}</td><td style="min-width:90px"><div class="bar thin"><i style="width:${CC.pct(it.box / K.LEARN_BOX)}"></i></div></td><td><span class="${tag[it.status] || 'tag'}">${it.status}${it.status === 'learning' ? ' · ' + CC.time(it.due / 1000) : ''}</span></td><td class="mono">${it.ok}✓ ${it.bad}✗</td></tr>`).join('');
    const due = K.dueCount();
    return `<section class="panel"><h3>📈 Learning <span class="spacer"></span>${due ? `<button class="btn sm primary" data-act="school" data-cat="mixed" data-due="1">Review ${due} due</button>` : ''}</h3>
      <div class="row" style="margin-bottom:10px">${['all', 'due', 'learning', 'new', 'learned'].map((x) => `<button class="btn sm ${f === x ? 'on' : ''}" data-act="learnFilter" data-f="${x}">${x}</button>`).join('')}</div>
      ${rows ? `<div class="tscroll"><table class="t"><thead><tr><th></th><th>Item</th><th>Box</th><th>Status</th><th>Answers</th></tr></thead>${rows}</table></div>` : '<div class="empty">Nothing here yet.</div>'}</section>`;
  }

  function renderCourses() {
    const passedN = CC.COURSES.filter((c) => G.coursePassed(c.id)).length;
    const cards = CC.COURSES.map((c) => {
      const st = S.courses[c.id];
      const open = G.courseOpen(c);
      const read = st ? Object.keys(st.read).length : 0;
      const passed = G.coursePassed(c.id);
      const unl = unlocksOf(c.id);
      return `<button class="course ${passed ? 'passed' : ''}" data-act="course" data-id="${c.id}" ${open ? '' : 'disabled'}>
        <span class="ic">${c.icon}</span><span class="nm">${esc(c.name)}</span><span class="note">${esc(c.desc)}</span>
        ${unl.length ? `<span class="note">🔓 Unlocks: ${unl.map(esc).join(', ')}</span>` : ''}
        <span class="row">${passed ? `<span class="tag good">✓ Passed · best ${CC.pct(st.best)}</span>` : open ? `<span class="tag">${read}/${c.lessons.length} lessons</span><span class="tag c-rp">+${CC.fmt(c.reward)} RP</span>` : `<span class="tag">🔒 Requires ${esc(CC.COURSE[c.req].name)}</span>`}</span>
      </button>`;
    }).join('');
    return `<div class="stack">
      <section class="panel"><h3>📚 Courses <span class="spacer"></span><small>${passedN}/${CC.COURSES.length} courses passed</small></h3>
      <div class="note" style="margin-bottom:12px">Read the lessons, then take the quiz. Score 75%+ to pass (100% earns a 50% bonus). Passing is required for many research projects.</div>
      <div class="cards">${cards}</div></section></div>`;
  }

  function renderCourse() {
    const c = CC.COURSE[sub.course];
    const st = G.course(c.id);
    const done = G.lessonsDone(c);
    const nav = c.lessons.map((l, i) => `<button class="btn ${!sub.quiz && sub.lesson === i ? 'on' : ''}" data-act="lesson" data-i="${i}">${st.read[i] ? '✓' : '○'} ${i + 1}. ${esc(l.t)}</button>`).join('')
      + `<button class="btn ${sub.quiz ? 'on' : ''}" data-act="quiz" ${done ? '' : 'disabled title="Read every lesson first"'}>📝 Quiz${st.passed ? ' ✓' : ''}</button>`;
    let body;
    if (!sub.quiz) {
      const l = c.lessons[sub.lesson];
      const last = sub.lesson === c.lessons.length - 1;
      body = `<h2>${esc(l.t)}</h2><div class="lesson">${l.b}</div>
        <div class="row">${last ? `<button class="btn primary" data-act="quiz" ${done ? '' : 'disabled'}>Take the quiz →</button>` : `<button class="btn primary" data-act="lesson" data-i="${sub.lesson + 1}">Next lesson →</button>`}</div>`;
    } else {
      const res = sub.result;
      const qs = c.quiz.map((q, qi) => {
        const opts = q.o.map((o, oi) => {
          let cls = '';
          if (res) cls = oi === q.a ? 'right' : sub.answers[qi] === oi ? 'wrong' : '';
          else if (sub.answers[qi] === oi) cls = 'picked';
          return `<button class="opt ${cls}" data-act="pick" data-q="${qi}" data-o="${oi}" ${res ? 'disabled' : ''}>${esc(o)}</button>`;
        }).join('');
        return `<div class="q"><div class="qt">${qi + 1}. ${esc(q.q)}</div><div class="opts">${opts}</div>${res ? `<div class="explain">${sub.answers[qi] === q.a ? '✅' : '❌'} ${esc(q.e)}</div>` : ''}</div>`;
      }).join('');
      const all = c.quiz.every((_, i) => sub.answers[i] != null);
      const summary = res
        ? `<div class="report ${res.pass ? 'ok' : 'fail'}"><h4>${res.pass ? '🎉 Passed!' : '📚 Not yet'} — ${res.right}/${res.total}</h4>
            ${res.rp ? `<div class="c-rp">+${CC.fmt(res.rp)} RP</div>` : ''}
            ${res.pass && unlocksOf(c.id).length ? `<div>You can now research: ${unlocksOf(c.id).map(esc).join(', ')}</div>` : ''}
            ${res.pass ? '' : '<div>You need 75%. Review the lessons and try again.</div>'}
            <div class="row" style="margin-top:8px"><button class="btn" data-act="retake">Retake</button><button class="btn" data-act="back">Back to courses</button></div></div>`
        : `<button class="btn primary big" data-act="submitQuiz" ${all ? '' : 'disabled'}>Submit answers</button>`;
      body = `<h2>📝 ${esc(c.name)} — Quiz</h2>${qs}${summary}`;
    }
    return `<section class="panel"><div class="row" style="margin-bottom:12px"><button class="btn sm" data-act="back">← All courses</button><h3 style="margin:0">${c.icon} ${esc(c.name)}</h3></div>
      <div class="course-layout"><div class="lesson-nav">${nav}</div><div>${body}</div></div></section>`;
  }

  // ───────────────────────── STATS ─────────────────────────
  function renderStats() {
    const st = S.stats;
    const rows = [
      ['Lifetime earnings', CC.money(st.lifetimeEarned)],
      ['Manual reactions run', CC.fmt(st.manualRuns)],
      ['Failed / non-reactions', CC.fmt(st.failed)],
      ['Automated batches', CC.fmt(st.autoBatches)],
      ['Reagents bought (mol)', CC.fmt(st.bought)],
      ['Products sold (mol)', CC.fmt(st.sold)],
      ['Contracts delivered', CC.fmt(st.contracts)],
      ['Quiz answers correct', CC.fmt(st.quizCorrect)],
      ['Play time', CC.time(st.playTime)],
    ].map(([k, v]) => `<tr><td>${k}</td><td class="mono">${v}</td></tr>`).join('');
    const goals = CC.GOALS.map((g) => `<tr><td>${S.goals[g.id] ? '✅' : '⬜'}</td><td>${esc(g.text)}</td></tr>`).join('');
    const mastery = CC.RECIPES.filter((r) => G.runs(r.id) > 0).map((r) => `<tr><td>${esc(r.name)}</td><td>${stars(G.mastery(r.id))}</td><td class="mono">${Math.floor(G.runs(r.id))}</td><td class="mono">${CC.pct(S.recipes[r.id].best || 0)}</td></tr>`).join('');
    return `<div class="grid two">
      <div class="stack">
        <section class="panel"><h3>📊 Statistics</h3><table class="t">${rows}</table></section>
        <section class="panel"><h3>⭐ Reaction mastery</h3><div class="note">Mastery levels at 1, 5, 10, 25, 50, 100… runs: +2% yield and +6% speed each.</div>
          ${mastery ? `<table class="t"><thead><tr><th>Reaction</th><th>Mastery</th><th>Runs</th><th>Best</th></tr></thead>${mastery}</table>` : '<div class="empty">No reactions yet.</div>'}</section>
      </div>
      <div class="stack">
        <section class="panel"><h3>🎯 Objectives</h3><table class="t">${goals}</table></section>
      </div></div>`;
  }

  // ───────────────────────── SYNTHESIS MAP (metro style) ─────────────────────────
  const MU = 84, MV = 62, MPAD = 70;
  function metroGeom() {
    const { ST } = CC.METRO;
    const xs = Object.values(ST).map((s) => s.x), ys = Object.values(ST).map((s) => s.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    const P = (id) => [MPAD + 110 + (ST[id].x - x0) * MU, MPAD + (ST[id].y - y0) * MV];
    return { P, W: MPAD * 2 + 300 + (Math.max(...xs) - x0) * MU, H: MPAD * 2 + 20 + (Math.max(...ys) - y0) * MV };
  }
  // Octilinear routing: each edge bends once (45° then straight, or straight then 45°).
  // Pick the bend that keeps the line away from other stations.
  let routeCache = null;
  function metroRoutes() {
    if (routeCache) return routeCache;
    const { ST, E } = CC.METRO;
    const { P } = metroGeom();
    const pts = Object.keys(ST).map((id) => [id, P(id)]);
    const segDist = (p, a, b) => {
      const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy || 1;
      const t = CC.clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2, 0, 1);
      return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy);
    };
    routeCache = E.map(([a, b]) => {
      const A = P(a), B = P(b);
      const dx = B[0] - A[0], dy = B[1] - A[1];
      const d = Math.min(Math.abs(dx) / MU, Math.abs(dy) / MV);
      const diagFirst = [A[0] + Math.sign(dx) * d * MU, A[1] + Math.sign(dy) * d * MV];
      const straightFirst = [B[0] - Math.sign(dx) * d * MU, B[1] - Math.sign(dy) * d * MV];
      const score = (M) => pts.reduce((n, [id, p]) => (id === a || id === b ? n : n + (Math.min(segDist(p, A, M), segDist(p, M, B)) < 18 ? 1 : 0)), 0);
      return score(straightFirst) < score(diagFirst) ? straightFirst : diagFirst;
    });
    return routeCache;
  }
  function renderMap() {
    const { LINES, ST, E } = CC.METRO;
    const { P, W, H } = metroGeom();
    const deg = {};
    E.forEach(([a, b]) => { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; });
    const pairs = {};
    E.forEach(([a, b], i) => { const k = [a, b].sort().join('|'); (pairs[k] = pairs[k] || []).push(i); });
    const mineOk = (rx) => rx && G.researched(rx);
    const sel = sub.mapSel, selEdge = sub.mapEdge;
    const route = metroRoutes();
    let lines = '', marks = '';
    E.forEach(([a, b, l, cond, rx], i) => {
      if (sub.mapHide[l]) return;
      const A = P(a), B = P(b);
      const k = [a, b].sort().join('|');
      const grp = pairs[k], gi = grp.indexOf(i);
      const off = (gi - (grp.length - 1) / 2) * 7 * (a < b ? 1 : -1);
      const dx = B[0] - A[0], dy = B[1] - A[1];
      const M = route[i];
      const L0 = Math.hypot(dx, dy) || 1;
      const nx = (-dy / L0) * off, ny = (dx / L0) * off;
      const pts = [A, M, B].map((p) => [p[0] + nx, p[1] + ny]);
      const dim = (sub.mapMine && !mineOk(rx)) || (sel && sub.mapEdge == null && a !== sel && b !== sel && sub.mapFocus);
      const hl = selEdge === i || (selEdge == null && (a === sel || b === sel));
      const path = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)} L${pts[2][0].toFixed(1)},${pts[2][1].toFixed(1)}`;
      lines += `<path d="${path}" class="mline ${hl ? 'hl' : ''} ${dim ? 'dim' : ''}" stroke="${LINES[l].color}"/>`;
      lines += `<path d="${path}" class="mhit" data-act="medge" data-i="${i}"><title>${esc(LINES[l].name)}: ${esc(ST[a].name)} → ${esc(ST[b].name)} — ${esc(cond)}</title></path>`;
      // direction chevron on the longer segment
      const segs = [[pts[0], pts[1]], [pts[1], pts[2]]].sort((u, v) => Math.hypot(v[1][0] - v[0][0], v[1][1] - v[0][1]) - Math.hypot(u[1][0] - u[0][0], u[1][1] - u[0][1]));
      const [s0, s1] = segs[0];
      const ang = (Math.atan2(s1[1] - s0[1], s1[0] - s0[0]) * 180) / Math.PI;
      const cx = (s0[0] + s1[0]) / 2, cy = (s0[1] + s1[1]) / 2;
      if (Math.hypot(s1[0] - s0[0], s1[1] - s0[1]) > 30) marks += `<path d="M-3.5,-3 L2.5,0 L-3.5,3" class="chev ${dim ? 'dim' : ''}" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang.toFixed(0)})"/>`;
    });
    let stations = '';
    const LP = { n: [0, -16, 'middle'], s: [0, 24, 'middle'], e: [14, 5, 'start'], w: [-14, 5, 'end'], ne: [10, -12, 'start'], nw: [-10, -12, 'end'], se: [10, 20, 'start'], sw: [-10, 20, 'end'] };
    for (const id in ST) {
      const st = ST[id], [x, y] = P(id);
      const big = (deg[id] || 0) >= 6;
      const [lx, ly, anchor] = LP[st.lp || 'n'];
      stations += `<g class="mst ${id === sel ? 'sel' : ''}" data-act="mst" data-id="${id}"><title>${esc(st.name)} (${esc(st.f)})</title>
        ${big ? `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="11" class="mdot big"/>` : `<circle cx="${x}" cy="${y}" r="7.5" class="mdot"/>`}
        <text x="${x + lx}" y="${y + ly}" text-anchor="${anchor}" class="mlbl">${esc(st.name)}</text>
        <circle cx="${x}" cy="${y}" r="15" class="mhitst"/></g>`;
    }
    const districts = `<text x="${P('arene')[0] - 40}" y="${P('arene')[1] - 50}" class="mdist">AROMATIC DISTRICT</text>`;
    const legend = Object.entries(LINES).map(([k, l]) => `<button class="btn sm legend ${sub.mapHide[k] ? '' : 'on-l'}" data-act="mline" data-l="${k}" title="Show / hide this line"><i style="background:${l.color}"></i>${esc(l.name)}</button>`).join('');
    const svg = `<svg class="metro" viewBox="0 0 ${W} ${H}" style="width:${Math.round(W * sub.mapZoom)}px">${districts}${lines}${marks}${stations}</svg>`;

    // info panel
    let info = '';
    const rxLink = (rx) => {
      if (!rx || !CC.RECIPE[rx]) return '';
      const r = CC.RECIPE[rx];
      if (!G.researched(r)) return `<span class="tag">🔒 ${esc(CC.TECH_BY_ID[r.tech].name)}</span>`;
      return G.known(rx) ? `<button class="btn sm" data-act="mlab" data-id="${rx}" title="Load this procedure in the Lab">▶ ${esc(r.name)}</button>` : `<span class="tag good">🧪 in your Lab: ${esc(r.name)}</span>`;
    };
    const row = (i, dir) => {
      const [a, b, l, cond, rx] = E[i];
      const other = dir === 'out' ? b : a;
      return `<li class="${sub.mapEdge === i ? 'hl' : ''}"><span class="ldot" style="background:${LINES[l].color}"></span><a href="#" data-act="mst" data-id="${other}">${dir === 'out' ? '→' : '←'} ${esc(ST[other].name)}</a><div class="note">${esc(cond)}</div>${rxLink(rx)}</li>`;
    };
    if (sub.mapEdge != null) {
      const [a, b, l, cond, rx] = E[sub.mapEdge];
      info = `<h3><span class="ldot" style="background:${LINES[l].color}"></span>${esc(LINES[l].name)} line</h3>
        <div class="routehop"><a href="#" data-act="mst" data-id="${a}">${esc(ST[a].name)}</a> → <a href="#" data-act="mst" data-id="${b}">${esc(ST[b].name)}</a></div>
        <p>${esc(cond)}</p><div class="note">e.g. ${esc(ST[a].ex)} → ${esc(ST[b].ex)}</div><div style="margin-top:8px">${rxLink(rx)}</div>`;
    } else if (sel) {
      const st = ST[sel];
      const outs = E.map((e, i) => (e[0] === sel ? i : -1)).filter((i) => i >= 0);
      const ins = E.map((e, i) => (e[1] === sel ? i : -1)).filter((i) => i >= 0);
      info = `<h3>${esc(st.name)}</h3><div class="mformula">${esc(st.f)}</div><div class="note">Example: ${esc(st.ex)}</div>
        <div class="lbl2" style="margin-top:10px">Turns into (${outs.length})</div><ul class="mlist">${outs.map((i) => row(i, 'out')).join('') || '<li class="note">— end of the line —</li>'}</ul>
        <div class="lbl2" style="margin-top:10px">Made from (${ins.length})</div><ul class="mlist">${ins.map((i) => row(i, 'in')).join('') || '<li class="note">— a starting material —</li>'}</ul>`;
    }
    return `<section class="panel"><h3>🚇 Synthesis map <span class="spacer"></span><small>${Object.keys(ST).length} compound types · ${E.length} reactions</small></h3>
      <div class="note" style="margin-bottom:8px">Stations are compound types; each coloured line is a type of reaction, and the chevrons point the way it goes. Click a station or a line to see reagents and conditions. Reactions your lab can run link straight to the Lab.</div>
      <div class="row" style="margin-bottom:8px">${legend}</div>
      <div class="row" style="margin-bottom:8px"><button class="btn sm ${sub.mapMine ? 'on' : ''}" data-act="mmine">🧪 Highlight what my lab can do</button><button class="btn sm" data-act="mzoom" data-d="-0.15">−</button><span class="note">zoom ${Math.round(sub.mapZoom * 100)}%</span><button class="btn sm" data-act="mzoom" data-d="0.15">+</button></div>
      <div class="maplayout"><div class="mapwrap" data-keep-scroll="metro">${svg}</div><aside class="mapinfo">${info}</aside></div></section>`;
  }

  // ───────────────────────── PUZZLES ─────────────────────────
  function renderPuzzles() {
    const ps = CC.Puzzles.state();
    const tabsH = `<div class="row center-row" style="margin-bottom:12px">${[['name', '🏷️ Name it'], ['build', '✏️ Build it'], ['mech', '↪️ Mechanisms'], ['route', '🗺️ Synthesis routes']].map(([id, l]) => `<button class="btn ${sub.pz === id ? 'on' : ''}" data-act="pz" data-t="${id}">${l}</button>`).join('')}</div>
      <div class="note center" style="margin-bottom:12px">Named ${ps.named} · built ${ps.built} · mechanisms ${Object.keys(ps.mechs).length}/${CC.MECHANISMS.length} · routes ${ps.routes} (${ps.optimal} optimal) · <span class="c-rp">${CC.fmt(ps.rp)} RP earned</span></div>`;
    const body = { name: pzName, build: pzBuild, mech: pzMech, route: pzRoute }[sub.pz]();
    return tabsH + body;
  }

  function pzName() {
    if (!sub.pname) sub.pname = CC.Puzzles.newName(1);
    const q = sub.pname;
    const ps = CC.Puzzles.state();
    const opts = q.options.map((o, i) => {
      let cls = '';
      if (q.done) cls = o === q.answer ? 'right' : q.choice === i ? 'wrong' : '';
      return `<button class="opt" data-act="pnameAns" data-i="${i}" ${q.done ? 'disabled' : ''}><span class="${cls}">${'ABCD'[i]}. ${esc(o)}</span></button>`.replace('class="opt"', `class="opt ${cls}"`);
    }).join('');
    const res = q.result;
    return `<section class="panel"><h3>🏷️ Name this molecule <span class="spacer"></span><small>streak ${ps.streak} · best ${ps.best}</small></h3>
      <div class="center">${CC.Mol.svg(q.mol)}<div class="note">Condensed: <b>${esc(CC.Mol.condensed(q.mol))}</b></div></div>
      <div class="opts" style="max-width:560px;margin:12px auto">${opts}</div>
      ${res ? `<div class="report ${res.ok ? 'ok' : 'fail'}" style="max-width:560px;margin:0 auto"><h4>${res.ok ? `✅ Correct! <span class="c-rp">+${CC.fmt(res.rp)} RP</span>` : '❌ Not quite'}</h4>
        <div>It's <b>${esc(q.answer)}</b>. ${nameTip(q.mol)}</div></div>` : ''}
      <div class="row center-row" style="margin-top:12px"><button class="btn ${q.done ? 'primary' : ''}" data-act="pnameNew" data-l="1">Next (easier)</button><button class="btn ${q.done ? 'primary' : ''}" data-act="pnameNew" data-l="2">Next (harder)</button></div>
      <div class="note center" style="margin-top:10px">Rules: find the longest chain containing the main group · number from the end that gives the main group (then C=C, then substituents) the lowest locants · list substituents alphabetically.</div></section>`;
  }
  function nameTip(m) {
    const n = m.n;
    return `Longest chain: ${n} carbon${n > 1 ? 's' : ''} → “${CC.Mol.STEMS[n - 1]}-”.`;
  }

  const GLBL = { OH: '–OH', O: '=O', Cl: '–Cl', Br: '–Br', CH3: '–CH₃', NH2: '–NH₂' };
  function pzBuild() {
    if (!sub.pbuild) sub.pbuild = CC.Puzzles.newBuild();
    const q = sub.pbuild;
    const m = q.mol;
    const rows = Array.from({ length: m.n }, (_, i) => {
      const have = m.sub[i].map((g, k) => `<button class="chip" data-act="pbrm" data-i="${i}" data-k="${k}" title="Remove">${GLBL[g]} ×</button>`).join('');
      const add = CC.Mol.GROUPS.map((g) => `<button class="btn sm" data-act="pbadd" data-i="${i}" data-g="${g}" ${CC.Mol.canAdd(m, i, g) && !q.done ? '' : 'disabled data-lock="1"'}>${GLBL[g]}</button>`).join('');
      const db = i < m.n - 1 ? `<div class="bondrow"><button class="btn sm ${m.db.includes(i) ? 'on' : ''}" data-act="pbdb" data-i="${i}" ${q.done ? 'disabled data-lock="1"' : ''}>C${i + 1}${m.db.includes(i) ? '=' : '–'}C${i + 2} ${m.db.includes(i) ? 'double' : 'single'}</button></div>` : '';
      return `<div class="crow"><b>C${i + 1}</b><span class="row">${have || '<small>H only</small>'}</span><span class="row">${add}</span></div>${db}`;
    }).join('');
    const res = q.result;
    return `<section class="panel"><h3>✏️ Draw the structure</h3>
      <div class="center" style="font-size:22px;margin:6px 0 2px"><b>${esc(q.answer)}</b></div>
      <div class="grid two" style="margin-top:10px"><div>
        <div class="row" style="margin-bottom:8px"><span>Chain length:</span><button class="btn sm" data-act="pblen" data-d="-1" ${q.done ? 'disabled data-lock="1"' : ''}>−</button><b>${m.n}</b><button class="btn sm" data-act="pblen" data-d="1" ${q.done ? 'disabled data-lock="1"' : ''}>+</button><small>(${CC.Mol.STEMS[m.n - 1]}-)</small></div>
        <div class="builder">${rows}</div>
      </div><div class="center">${CC.Mol.svg(m, { numbers: true })}<div class="note">${esc(CC.Mol.condensed(m))}</div></div></div>
      ${res ? `<div class="report ${res.ok ? 'ok' : 'fail'}" style="margin-top:10px"><h4>${res.ok ? `✅ Correct!${res.rp ? ` <span class="c-rp">+${CC.fmt(res.rp)} RP</span>` : ''}` : '❌ Not that one'}</h4><div>Your structure is <b>${esc(res.got || 'invalid')}</b>.</div></div>` : ''}
      <div class="row center-row" style="margin-top:12px">${q.done ? '<button class="btn primary" data-act="pbuildNew">Next molecule</button>' : '<button class="btn primary" data-act="pbcheck">Check</button><button class="btn" data-act="pbreveal">Show answer</button><button class="btn" data-act="pbuildNew">Skip</button>'}</div>
      <div class="note center" style="margin-top:8px">Build the main chain, then add groups to each carbon. Methyl branches go on inner carbons. A terminal C with =O is an aldehyde; =O and –OH together make a carboxylic acid.</div></section>`;
  }

  function mechSvg(step, st) {
    const A = {};
    for (const a of step.atoms) A[a.id] = a;
    const r = (a) => (a.t ? 13 : 0);
    const pt = (site) => {
      const [k, id] = site.split(':');
      if (k === 'lp') { const a = A[id]; return [a.x + a.lp[0], a.y + a.lp[1]]; }
      if (k === 'b') { const b = step.bonds.find((x) => x.id === id); return [(A[b.a].x + A[b.b].x) / 2, (A[b.a].y + A[b.b].y) / 2]; }
      return [A[id].x, A[id].y];
    };
    let o = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahead"/></marker></defs>';
    for (const b of step.bonds) {
      const a1 = A[b.a], a2 = A[b.b];
      const vx = a2.x - a1.x, vy = a2.y - a1.y, L = Math.hypot(vx, vy), ux = vx / L, uy = vy / L;
      const p1 = [a1.x + ux * r(a1), a1.y + uy * r(a1)], p2 = [a2.x - ux * r(a2), a2.y - uy * r(a2)];
      const nx = -uy, ny = ux;
      const offs = b.o === 2 ? [-3, 3] : b.o === 3 ? [-4, 0, 4] : [0];
      for (const f of offs) o += `<line x1="${p1[0] + nx * f}" y1="${p1[1] + ny * f}" x2="${p2[0] + nx * f}" y2="${p2[1] + ny * f}" class="mb"/>`;
      if (step.arrows) o += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" class="site sb ${st && st.pending === 'b:' + b.id ? 'sel' : ''}" data-act="msite" data-site="b:${b.id}"><title>bond</title></line>`;
    }
    for (const a of step.atoms) {
      if (a.t) o += `<text x="${a.x}" y="${a.y + 5}" class="ma">${a.t}</text>`;
      if (a.ch) o += `<text x="${a.x + (a.t.length > 2 ? 20 : 12)}" y="${a.y - 9}" class="mc">${a.ch}</text>`;
      if (a.d) o += `<text x="${a.x}" y="${a.y + 26}" class="md">${a.d}</text>`;
      if (a.lp) {
        const [lx, ly] = [a.x + a.lp[0], a.y + a.lp[1]];
        const horiz = Math.abs(a.lp[1]) > Math.abs(a.lp[0]);
        o += `<circle cx="${lx + (horiz ? -3 : 0)}" cy="${ly + (horiz ? 0 : -3)}" r="1.8" class="lpd"/><circle cx="${lx + (horiz ? 3 : 0)}" cy="${ly + (horiz ? 0 : 3)}" r="1.8" class="lpd"/>`;
        if (step.arrows) o += `<circle cx="${lx}" cy="${ly}" r="9" class="site sl ${st && st.pending === 'lp:' + a.id ? 'sel' : ''}" data-act="msite" data-site="lp:${a.id}"><title>lone pair</title></circle>`;
      }
      if (step.arrows && a.t) o += `<circle cx="${a.x}" cy="${a.y}" r="13" class="site sa" data-act="msite" data-site="a:${a.id}"><title>${a.t}</title></circle>`;
    }
    for (const [f, t] of (st && st.drawn) || []) {
      const p = pt(f);
      let q = pt(t);
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1;
      if (t.startsWith('a:')) q = [q[0] - (dx / L) * 14, q[1] - (dy / L) * 14];
      let nx = -dy / L, ny = dx / L;
      if (ny > 0) { nx = -nx; ny = -ny; }
      const bend = Math.min(40, 12 + L * 0.25);
      const c = [(p[0] + q[0]) / 2 + nx * bend, (p[1] + q[1]) / 2 + ny * bend];
      o += `<path d="M${p[0].toFixed(1)},${p[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}" class="arrow" marker-end="url(#ah)"/>`;
    }
    return `<svg class="mech" viewBox="0 0 380 180">${o}</svg>`;
  }

  function pzMech() {
    const ps = CC.Puzzles.state();
    const st = sub.pmech;
    if (!st) {
      const cards = CC.MECHANISMS.map((m) => `<button class="course ${ps.mechs[m.id] ? 'passed' : ''}" data-act="pmech" data-id="${m.id}"><span class="nm">${esc(m.name)}</span><span class="note">${esc(m.cls)} · ${m.steps.filter((s) => s.arrows).length} step(s)</span>${ps.mechs[m.id] ? `<span class="tag good">✓ solved ×${ps.mechs[m.id]}</span>` : ''}</button>`).join('');
      return `<section class="panel"><h3>↪️ Curly-arrow mechanisms</h3><div class="note" style="margin-bottom:12px">Draw each curly arrow by clicking where a pair of electrons <b>starts</b> (a lone pair • • or a bond) and then where it <b>ends</b> (an atom, or between two atoms to make a new bond). Solve without mistakes for a bonus.</div><div class="cards">${cards}</div></section>`;
    }
    const m = CC.MECH[st.id];
    const step = CC.Puzzles.mechStep(st);
    const done = CC.Puzzles.mechStepDone(st);
    const total = m.steps.filter((s) => s.arrows).length;
    return `<section class="panel"><div class="row between"><h3 style="margin:0;border:0">${esc(m.name)}</h3><span class="row"><span class="tag">${st.done ? 'complete' : `step ${st.step + 1}/${total}`}</span><span class="tag ${st.mistakes ? 'bad' : 'good'}">${st.mistakes} mistake${st.mistakes === 1 ? '' : 's'}</span><button class="btn sm" data-act="pmechBack">← All mechanisms</button></span></div>
      <div class="note" style="margin:8px 0">${esc(step.text)}</div>
      <div class="mechwrap">${mechSvg(step, st)}</div>
      ${step.arrows ? `<div class="note center">${st.drawn.length}/${step.arrows.length} arrows drawn ${st.drawn.length ? '<button class="btn sm" data-act="mreset">Undo all</button>' : ''}</div>` : ''}
      ${st.msg ? `<div class="report ${/Good|Now/.test(st.msg) ? '' : 'fail'}" style="margin-top:8px">${esc(st.msg)}</div>` : ''}
      ${done && step.arrows ? `<div class="report ok" style="margin-top:8px"><h4>✅ Step complete</h4><div>${esc(step.explain || '')}</div><div class="row" style="margin-top:8px"><button class="btn primary" data-act="mnext">Next →</button></div></div>` : ''}
      ${st.done ? `<div class="report ok" style="margin-top:8px"><h4>🎉 Mechanism complete <span class="c-rp">+${CC.fmt(st.rp)} RP</span></h4><div class="row" style="margin-top:8px"><button class="btn primary" data-act="pmech" data-id="${st.id}">Again</button><button class="btn" data-act="pmechBack">Choose another</button></div></div>` : ''}
    </section>`;
  }

  function molBox(id, big) {
    const M = CC.ROUTES.M[id];
    const pic = M.mol ? CC.Mol.svg(CC.Puzzles.fromSpec(M.mol), { w: 240, h: 140 }) : `<div class="formula">${esc(M.f)}</div>`;
    return `<div class="molbox ${big ? 'big' : ''}">${pic}<b>${esc(M.name)}</b><small>${esc(M.f)}</small></div>`;
  }
  function pzRoute() {
    const r = sub.proute || (sub.proute = CC.Puzzles.newRoute(2));
    const path = r.path.map((p, i) => (i ? `<span class="step-arrow">→ <small>${esc(p.cond)}</small> →</span>` : '') + `<span class="pathmol">${esc(CC.ROUTES.M[p.id].name)}</span>`).join('');
    const opts = r.opts.map((c, i) => `<button class="opt" data-act="proute" data-i="${i}" ${r.done || r.failed ? 'disabled' : ''}>${esc(c)}</button>`).join('');
    const sol = sub.routeSolve || r.failed ? CC.Puzzles.solveRoute(r.start, r.target) : null;
    return `<section class="panel"><h3>🗺️ Plan a synthesis <span class="spacer"></span><small>shortest route: ${r.optimal} steps · strikes ${r.strikes}/3</small></h3>
      <div class="routehead">${molBox(r.start)}<div class="bigarrow">⟶ ? ⟶</div>${molBox(r.target)}</div>
      <div class="pathline">${path}</div>
      ${r.done ? `<div class="report ok"><h4>🎉 Target reached in ${r.path.length - 1} step${r.path.length > 2 ? 's' : ''} ${r.path.length - 1 === r.optimal ? '(optimal!)' : ''} <span class="c-rp">+${CC.fmt(r.rp)} RP</span></h4></div>` : `<div class="center" style="margin:8px 0"><div class="note">Current compound</div>${molBox(r.cur, true)}</div>
      <div class="note center" style="margin-bottom:6px">Choose reagents & conditions for the next step:</div><div class="opts routeopts">${opts}</div>`}
      ${r.msg ? `<div class="report ${r.failed ? 'fail' : ''}" style="margin-top:8px">${esc(r.msg)}</div>` : ''}
      ${sol ? `<div class="learn"><b>A shortest route:</b><br>${sol.map((x) => `${esc(CC.ROUTES.M[x.from].name)} → <i>${esc(x.cond)}</i> → ${esc(CC.ROUTES.M[x.to].name)}`).join('<br>')}</div>` : ''}
      <div class="row center-row" style="margin-top:12px"><button class="btn ${r.done || r.failed ? 'primary' : ''}" data-act="prouteNew" data-l="2">New route (2+ steps)</button><button class="btn" data-act="prouteNew" data-l="3">New route (3+ steps)</button>${!r.done && !sub.routeSolve ? '<button class="btn" data-act="prouteSolve">Show a solution</button>' : ''}</div></section>`;
  }

  // ───────────────────────── OPTIONS ─────────────────────────
  function opt(k, v, label) {
    return `<button class="btn ${String(S.settings[k]) === String(v) ? 'on' : ''}" data-act="set" data-k="${k}" data-v="${v}">${label}</button>`;
  }
  function renderOptions() {
    const st = S.settings;
    return `<div class="optgrid">
      <section class="panel"><h3>💾 Saving</h3>
        <div class="optbtns">
          <button class="btn optbtn" data-act="save">Save game</button>
          <button class="btn optbtn" data-act="exportCopy">Export (copy)</button>
          <button class="btn optbtn" data-act="exportFile">Export to file</button>
          <button class="btn optbtn" data-act="importOpen">Import (paste)</button>
          <button class="btn optbtn" data-act="importFile">Import from file</button>
          <button class="btn optbtn danger" data-act="reset">Hard reset</button>
        </div>
        <div class="field" style="margin-top:12px"><label>Autosave interval: <b id="autosave-val">${st.autosave}s</b></label>
          <input type="range" min="5" max="120" step="5" value="${st.autosave}" data-input="autosave" /></div>
        <div class="note">Last saved: <span data-live="saved"></span>. Saves live in this browser's local storage — export a backup to move between devices.</div>
      </section>
      <section class="panel"><h3>🎨 Display</h3>
        <div class="field"><label>Theme</label><div class="seg">${opt('theme', 'light', '☀️ Light')}${opt('theme', 'dark', '🌙 Dark')}</div></div>
        <div class="field"><label>Number notation</label><div class="seg">${opt('notation', 'standard', '1.23M')}${opt('notation', 'scientific', '1.23e6')}${opt('notation', 'engineering', '1.23e6 (eng.)')}</div></div>
        <div class="field"><label>News ticker</label><div class="seg">${opt('news', true, 'On')}${opt('news', false, 'Off')}</div></div>
      </section>
      <section class="panel"><h3>⚙️ Gameplay</h3>
        <div class="field"><label>Offline progress (plant keeps running, up to 8 h)</label><div class="seg">${opt('offline', true, 'On')}${opt('offline', false, 'Off')}</div></div>
        <div class="field"><label>Extra confirmation for hard reset</label><div class="seg">${opt('confirm', true, 'On')}${opt('confirm', false, 'Off')}</div></div>
        <div class="field"><label>Hotkeys</label><div class="note">1–9, 0 switch tabs · M = max all reactors · S = save · Space = start / work up in the Lab</div></div>
        <button class="btn" data-act="help">How to play</button>
      </section>
    </div>`;
  }
})();
