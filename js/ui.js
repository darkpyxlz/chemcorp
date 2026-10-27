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
  let pointerDown = false;
  const sub = { tech: null, course: null, lesson: 0, quiz: false, answers: {}, result: null, popResult: null, buyAmt: 1, nbOpen: {} };

  const TABS = [
    ['lab', '🧪 Lab'], ['market', '🏪 Market'], ['upgrades', '🛠️ Upgrades'], ['plant', '🏭 Plant'],
    ['research', '🔬 Research'], ['academy', '🎓 Academy'], ['stats', '📊 Stats'],
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
    document.addEventListener('pointerdown', (e) => { if (e.target.matches('input[type=range]')) pointerDown = true; });
    document.addEventListener('pointerup', () => { pointerDown = false; });
    try { tab = localStorage.getItem('chemcorp-tab') || 'lab'; } catch (e) { /* ignore */ }
    if (!TABS.some((t) => t[0] === tab)) tab = 'lab';
  };

  const ACT = {
    tab: (d) => { tab = d.tab; try { localStorage.setItem('chemcorp-tab', tab); } catch (e) { /* ignore */ } window.scrollTo(0, 0); },
    help: () => U.help(),
    closeModal: () => { $('#modal').hidden = true; },
    // lab
    add: (d) => L.add(d.id),
    rm: (d) => L.remove(d.id),
    eq: (d) => L.stepEq(d.id, +d.d),
    atm: (d) => L.setAtm(d.a),
    start: () => L.start(),
    stir: () => L.stir(),
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
    popStart: () => { sub.popResult = null; G.popQuestion(); },
    popAns: (d) => { sub.popResult = G.answerPop(+d.o); },
    popOk: () => { sub.popResult = null; },
    // stats
    save: () => { G.save(); U.toast('Game saved.', 'good'); },
    exportSave: () => { const t = $('#save-text'); t.value = G.exportSave(); t.select(); U.toast('Save copied into the box below — keep it somewhere safe.'); },
    importSave: () => {
      try { G.importSave($('#save-text').value); S = G.state(); U.toast('Save imported!', 'good'); } catch (e) { U.toast('That doesn\'t look like a valid save.', 'bad'); }
    },
    reset: () => { if (confirm('Erase ALL progress and start over? This cannot be undone.')) { G.reset(); S = G.state(); } },
    prestige: () => {
      const n = G.patentGain();
      if (confirm(`File ${n} patent(s)?\n\nYou keep: Academy progress, reaction mastery, notebook, stats and patents.\nYou reset: money, RP, inventory, research, upgrades and reactors.`)) { G.prestige(); S = G.state(); }
    },
  };

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
  function onInput(e) {
    const t = e.target;
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
    header();
    badgeTimer += dt;
    if (dirty || badgeTimer > 1) { tabs(); goal(); badgeTimer = 0; }
    const active = document.activeElement;
    const busy = pointerDown || (active && active.tagName === 'SELECT' && $('#view').contains(active)) || (active && active.tagName === 'TEXTAREA');
    if (dirty && !busy) {
      render();
      dirty = false;
    }
    live();
    if (tab === 'lab') updateVessel();
  };

  function header() {
    $('#h-money').textContent = CC.money(S.money);
    $('#h-rp').textContent = CC.fmt(S.rp) + ' RP';
    const mr = G.rates.money, rr = G.rates.rp;
    $('#h-mrate').textContent = mr > 0.005 ? `+${CC.money(mr)}/s` : '';
    $('#h-rrate').textContent = rr > 0.005 ? `+${CC.fmt(rr)} RP/s` : '';
    $('#h-patents-wrap').hidden = !S.patents;
    $('#h-patents').textContent = S.patents;
  }

  function tabs() {
    const badges = {
      research: CC.TECH.filter((t) => G.canResearch(t)).length,
      academy: G.popReady() ? '!' : 0,
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
    const fn = { lab: renderLab, market: renderMarket, upgrades: renderUpgrades, plant: renderPlant, research: renderResearch, academy: renderAcademy, stats: renderStats }[tab];
    view.innerHTML = fn();
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
        case 'pop': el.textContent = CC.time((S.popAt - Date.now()) / 1000); break;
        case 'rp': el.textContent = CC.fmt(S.rp); break;
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
        <li><b>🧪 Lab</b> — click reagents on your shelf to add them to the flask, set their <b>equivalents</b>, pick a <b>solvent</b>, <b>catalyst</b>, <b>atmosphere</b> and <b>bath temperature</b>, then start. Keep the thermometer inside the green window — exothermic reactions heat themselves!</li>
        <li>The <b>Notebook</b> (right column) gives hints for every reaction you've researched. Get one right and the full procedure is recorded so you can load it in one click.</li>
        <li><b>🏪 Market</b> — buy reagents, stock solvents/catalysts, sell products and fill contracts. Selling a lot of one product lowers its price for a while — diversify!</li>
        <li><b>🎓 Academy</b> — short lessons and quizzes. Passing earns Research Points (RP) and is required for many technologies. Pop quizzes give bonus RP.</li>
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
      <h3>${r ? `⏳ ${esc(r.name)}` : 'Reaction vessel'}<span class="spacer"></span>${r ? `<span class="tag">${tempText(r)}</span>` : ''}</h3>
      <div class="vessel-wrap">${flaskSvg()}${thermoSvg()}</div>
      <div class="bar"><i id="lab-prog"></i></div>
      <div class="readouts"><span>Flask <b id="lab-T">${b.T.toFixed(1)}</b> °C</span><span id="lab-win-wrap">${r ? `In window <b id="lab-win">—</b>` : 'Set the bath before you start — it takes time to heat or cool.'}</span>${r ? `<span>Time <b id="lab-time">—</b></span>` : ''}</div>
      ${run ? `<div class="row run-controls"><button class="btn" data-act="stir" title="Vigorous stirring speeds things up a little">🌀 Stir</button><button class="btn danger" data-act="abort">✖ Abort</button></div>` : ''}
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
    const overall = rep.y * rep.extent;
    const fx = rep.factors.map((f) => {
      const cls = f.f >= 0.95 ? 'c-good' : f.f >= 0.5 ? 'c-warn' : 'c-bad';
      return `<span class="k">${f.k}</span><span class="v ${cls}">${f.sto ? CC.pct(f.f) : '×' + f.f.toFixed(2)}</span><span>${esc(f.msg)}</span>`;
    }).join('');
    const out = rep.out.length ? rep.out.map((o) => `<b>${qty(o.amt)} mol</b> ${esc(name(o.id))}`).join(', ') : 'nothing usable';
    return `<div class="report ${rep.success ? 'ok' : 'fail'}">
      <h4>${rep.fatal ? '💥' : rep.success ? '✅' : '⚠️'} ${CC.pct(overall)} yield ${close}</h4>
      <div>Made ${out}.${rep.rp ? ` <span class="c-rp">+${CC.fmt(rep.rp)} RP</span>` : ''}</div>
      <div class="fx">${fx}</div>
      ${rep.first ? '<div class="learn">📗 <b>New procedure recorded in your notebook!</b> You can now load it with one click.</div>' : ''}
      ${rep.success ? `<div class="learn">💡 ${esc(r.learn)}</div>` : '<div class="note">Below 30% overall yield the run doesn\'t count towards mastery. Check the factors above and your notebook hint.</div>'}
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
          <span class="k">Temperature</span><span>${tempText(r)}${r.exo ? ` <span class="tag warn">exothermic</span>` : ''}${r.strict ? ` <span class="tag bad">strict</span>` : ''}</span>
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
      <ellipse id="lab-bath" cx="110" cy="236" rx="96" ry="18" fill="#3a465e"/>
      <rect x="20" y="226" width="180" height="26" rx="8" fill="#232c3d" stroke="#33415c"/>
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
  const TY = (T) => 210 - ((CC.clamp(T, -20, 220) + 20) / 240) * 196;
  function thermoSvg() {
    const ticks = [0, 50, 100, 150, 200].map((t) => `<line x1="30" x2="35" y1="${TY(t)}" y2="${TY(t)}" stroke="#55627d"/><text x="37" y="${TY(t) + 3}">${t}</text>`).join('');
    return `<svg class="thermo" viewBox="0 0 54 240" aria-label="Thermometer">
      <rect id="lab-band" x="12" y="0" width="18" height="0" rx="3" visibility="hidden"/>
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
      const t = b.run.t / b.run.dur;
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
    bath.setAttribute('fill', cold > 0 ? CC.mix('#3a465e', '#5ab0ff', cold) : CC.mix('#3a465e', '#ff5a1f', hot));
    $('#lab-T').textContent = T.toFixed(1);
    const merc = $('#lab-merc');
    merc.setAttribute('y', TY(T));
    merc.setAttribute('height', 214 - TY(T));
    $('#lab-setmark').setAttribute('transform', `translate(0 ${TY(b.set) - 4})`);
    const band = $('#lab-band');
    if (r) {
      band.setAttribute('visibility', 'visible');
      band.setAttribute('y', TY(r.temp[1]));
      band.setAttribute('height', Math.max(2, TY(r.temp[0]) - TY(r.temp[1])));
      const inside = T >= r.temp[0] && T <= r.temp[1];
      const w = $('#lab-win');
      if (w) { w.textContent = CC.pct(run.tt ? run.score / run.tt : 1); w.parentNode.className = inside ? 'inwin' : 'outwin'; }
      const tm = $('#lab-time');
      if (tm) tm.textContent = Math.max(0, run.dur - run.t).toFixed(1) + 's';
      $('#lab-prog').style.width = CC.pct(run.t / run.dur, 1);
    } else {
      band.setAttribute('visibility', 'hidden');
      $('#lab-prog').style.width = b.report && b.report.type === 'result' ? '100%' : '0%';
    }
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
      return `<div class="panel upg"><div class="hd"><span class="ic">${u.icon}</span><b>${esc(u.name)}</b><span class="lv">${u.max > 1 ? `Lv ${l}${u.max < 100 ? '/' + u.max : ''}` : l ? 'owned' : ''}</span></div>
        <div class="note">${esc(u.desc(l))}</div>
        ${maxed ? '<span class="tag good">Maxed</span>' : `<button class="btn" data-act="upg" data-id="${u.id}" data-cost="${c}">${esc(u.next(l))} — <b class="c-money">${CC.money(c)}</b></button>`}</div>`;
    }).join('');
    return `<section class="panel"><h3>🛠️ Lab upgrades</h3><div class="note" style="margin-bottom:12px">Spend money to make your whole operation bigger and faster. Research (🔬) unlocks new equipment; these are the incremental boosts.</div><div class="cards">${cards}</div></section>`;
  }

  // ───────────────────────── PLANT ─────────────────────────
  function rxStatus(g) {
    const map = { running: ['good', 'Running'], limited: ['warn', 'Limited'], starved: ['bad', 'Starved'], blocked: ['bad', 'Blocked'], paused: ['', 'Paused'], idle: ['', 'Starting'] };
    const [cls, txt] = map[g.status] || ['', g.status];
    return `<span class="tag ${cls}">${txt}</span> ${g.why ? `<small>${esc(g.why)}</small>` : ''}`;
  }
  function renderPlant() {
    if (!G.flag('automation')) {
      return `<section class="panel"><h3>🏭 Plant</h3><p>Automated reactors run your mastered procedures around the clock — even while you're away.</p>
        <p class="note">Research <b>Lab Automation</b> (🔬 Research tab) to unlock the plant. Meanwhile, keep running reactions by hand: each recipe needs a few successful manual runs before you can write an SOP for it.</p></section>`;
    }
    const rows = CC.RECIPES.filter((r) => G.researched(r)).map((r) => {
      const g = S.reactors[r.id];
      const runs = G.runs(r.id), need = G.automateAt(r);
      const main = Object.keys(r.products)[0];
      if (!G.canAutomate(r)) {
        return `<div class="rx"><div><b>${esc(r.name)}</b> ${stars(G.mastery(r.id))}<div class="note">→ ${esc(name(main))}</div></div>
          <div><div class="bar thin"><i style="width:${CC.pct(Math.min(1, runs / need))}"></i></div><small>${Math.floor(runs)}/${need} successful manual runs to write an SOP</small></div>
          <div class="note">Run it ${need - Math.floor(runs)} more time(s) in the Lab.</div></div>`;
      }
      const n = g ? g.n : 0;
      const ct = G.cycleTime(r);
      const perMin = (60 / ct) * n * G.scale() * r.products[main] * G.autoYield(r);
      const sop = G.sop(r);
      return `<div class="rx"><div><b>${esc(r.name)}</b> ${stars(G.mastery(r.id))}<div class="note">→ ${esc(name(main))} · SOP: ${esc(sop.solvent === 'none' ? 'neat' : name(sop.solvent))}${sop.additive !== 'none' ? ', ' + esc(name(sop.additive)) : ''}</div>
          <div class="note">Yield ${CC.pct(G.autoYield(r))} · cycle ${ct.toFixed(1)}s${n ? ` · ≈${qty(perMin)} mol/min` : ''}</div></div>
        <div>${n ? `<div class="bar"><i data-live="rxp:${r.id}"></i></div><div class="st" data-live="rxs:${r.id}">${rxStatus(g)}</div>` : '<small>No reactors yet</small>'}</div>
        <div class="row"><span class="tag">×${n}</span><button class="btn sm primary" data-act="reactor" data-id="${r.id}" data-cost="${G.reactorCost(r)}">+ Reactor (${CC.money(G.reactorCost(r))})</button>
        ${n ? `<button class="btn sm" data-act="rtoggle" data-id="${r.id}">${g.on ? '⏸ Pause' : '▶ Resume'}</button>` : ''}</div></div>`;
    }).join('');
    return `<section class="panel"><h3>🏭 Plant <span class="spacer"></span>
      ${G.flag('autobuy') ? `<button class="btn sm ${S.autoBuy ? 'on' : ''}" data-act="autoBuy" title="Reactors buy missing reagents at +10%">📦 Auto-buy ${S.autoBuy ? 'ON' : 'off'}</button>` : ''}</h3>
      <div class="note">Reactors follow the SOP (first listed solvent & the right catalyst), take ${CC.fmt(1.5)}× the manual time, and reach ${CC.pct(G.autoQuality())} of the ideal yield. Products go to your inventory${G.flag('autosell') ? ' or are auto-sold (toggle per product in the Market)' : ''}.
      ${G.flag('autobuy') ? '' : ' Without <b>Procurement System</b> research, keep reagents stocked yourself.'}</div>
      <div>${rows}</div></section>`;
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
  function popCard() {
    if (sub.popResult) {
      const { ok, rp, q } = sub.popResult;
      return `<section class="panel pop"><h3>⚡ Pop quiz</h3><div class="q"><div class="qt">${esc(q.q)}</div>
        <div class="${ok ? 'c-good' : 'c-bad'}"><b>${ok ? `Correct! +${CC.fmt(rp)} RP` : `Not quite — the answer is: ${esc(q.o[q.a])}`}</b></div>
        <div class="explain">${esc(q.e)}</div></div><button class="btn" data-act="popOk">OK</button></section>`;
    }
    if (S.pop) {
      const c = CC.COURSE[S.pop.cid];
      const q = c.quiz[S.pop.qi];
      return `<section class="panel pop"><h3>⚡ Pop quiz <span class="spacer"></span><small>${c.icon} ${esc(c.name)}</small></h3>
        <div class="q"><div class="qt">${esc(q.q)}</div><div class="opts">${S.pop.order.map((i) => `<button class="opt" data-act="popAns" data-o="${i}">${esc(q.o[i])}</button>`).join('')}</div></div></section>`;
    }
    if (G.popReady()) return `<section class="panel pop"><div class="row between"><div><b>⚡ Pop quiz ready!</b> <span class="note">Answer a question from a course you've passed for bonus RP.</span></div><button class="btn primary" data-act="popStart">Take it</button></div></section>`;
    if (!Object.values(S.courses).some((c) => c.passed)) return '<section class="panel"><span class="note">⚡ Pass a course to unlock repeatable pop quizzes for bonus RP.</span></section>';
    return '<section class="panel"><span class="note">⚡ Next pop quiz in <b data-live="pop"></b>.</span></section>';
  }

  function renderAcademy() {
    if (sub.course) return renderCourse();
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
    return `<div class="stack">${popCard()}
      <section class="panel"><h3>🎓 The Academy <span class="spacer"></span><small>${passedN}/${CC.COURSES.length} courses passed</small></h3>
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
      ['Earned since last patent filing', CC.money(st.runEarned)],
      ['Manual reactions run', CC.fmt(st.manualRuns)],
      ['Failed / non-reactions', CC.fmt(st.failed)],
      ['Automated batches', CC.fmt(st.autoBatches)],
      ['Reagents bought (mol)', CC.fmt(st.bought)],
      ['Products sold (mol)', CC.fmt(st.sold)],
      ['Contracts delivered', CC.fmt(st.contracts)],
      ['Quiz answers correct', CC.fmt(st.quizCorrect)],
      ['Play time', CC.time(st.playTime)],
      ['Patents filed', CC.fmt(S.patents)],
    ].map(([k, v]) => `<tr><td>${k}</td><td class="mono">${v}</td></tr>`).join('');
    const goals = CC.GOALS.map((g) => `<tr><td>${S.goals[g.id] ? '✅' : '⬜'}</td><td>${esc(g.text)}</td></tr>`).join('');
    const mastery = CC.RECIPES.filter((r) => G.runs(r.id) > 0).map((r) => `<tr><td>${esc(r.name)}</td><td>${stars(G.mastery(r.id))}</td><td class="mono">${Math.floor(G.runs(r.id))}</td><td class="mono">${CC.pct(S.recipes[r.id].best || 0)}</td></tr>`).join('');
    const gain = G.patentGain();
    const prestige = G.flag('patent')
      ? `<p>File patents on your processes and start a new company with what you've learned. You'll gain <b class="c-warn">${gain}</b> patent(s) (√ of earnings since your last filing ÷ $1M). Each patent permanently gives +10% sale prices and +10% RP.</p>
         <button class="btn primary" data-act="prestige" ${gain >= 1 ? '' : 'disabled'}>📜 File ${gain} patent(s) & restart</button>`
      : '<p class="note">Research the <b>Patent Office</b> to unlock prestige: restart with permanent bonuses, keeping your Academy progress and reaction mastery.</p>';
    return `<div class="grid two">
      <div class="stack">
        <section class="panel"><h3>📊 Statistics</h3><table class="t">${rows}</table></section>
        <section class="panel"><h3>⭐ Reaction mastery</h3><div class="note">Mastery levels at 1, 5, 10, 25, 50, 100… runs: +2% yield and +6% speed each.</div>
          ${mastery ? `<table class="t"><thead><tr><th>Reaction</th><th>Mastery</th><th>Runs</th><th>Best</th></tr></thead>${mastery}</table>` : '<div class="empty">No reactions yet.</div>'}</section>
      </div>
      <div class="stack">
        <section class="panel"><h3>🎯 Objectives</h3><table class="t">${goals}</table></section>
        <section class="panel"><h3>📜 Patents (prestige)</h3>${prestige}</section>
        <section class="panel"><h3>💾 Save</h3><div class="row"><button class="btn" data-act="save">Save now</button><button class="btn" data-act="exportSave">Export</button><button class="btn" data-act="importSave">Import</button><button class="btn danger" data-act="reset">Hard reset</button></div>
          <textarea id="save-text" placeholder="Exported save appears here. Paste a save here, then press Import." style="margin-top:8px"></textarea>
          <div class="note">Autosaves every 15 seconds. Offline progress (plant only) is credited for up to 8 hours.</div></section>
      </div></div>`;
  }
})();
