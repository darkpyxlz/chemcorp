var CC = (globalThis.CC = globalThis.CC || {});

(function () {
  const G = CC.Game;
  const away = G.load();
  CC.UI.init();

  const S = G.state();
  if (away && (away.money > 0.01 || away.rp > 0.01)) {
    CC.UI.toast(`Welcome back! In ${CC.time(away.sec)} away you earned ${CC.money(Math.max(0, away.money))} and ${CC.fmt(away.rp)} RP.`, 'good');
  }
  if (!S.stats.playTime) CC.UI.help();

  let last = performance.now();
  let saveTimer = 0;
  function loop() {
    const now = performance.now();
    let dt = (now - last) / 1000;
    last = now;
    // Background tabs throttle timers; treat long gaps as offline time.
    if (dt > 5) { G.catchUp(dt); dt = 0.1; }
    G.tick(Math.min(dt, 0.5));
    CC.UI.frame(dt);
    saveTimer += dt;
    if (saveTimer > 15) { saveTimer = 0; G.save(); }
  }
  setInterval(loop, 100);
  CC.UI.frame(0);
  window.addEventListener('beforeunload', () => G.save());
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });
})();
