var CC = (globalThis.CC = globalThis.CC || {});

(function () {
  const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

  // Compact number formatting: 12.5, 1.23K, 4.56M ...
  CC.notation = 'standard';
  CC.fmt = function (n, dp) {
    if (n === Infinity) return '∞';
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    const neg = n < 0;
    n = Math.abs(n);
    let s;
    if (n < 1000) {
      const d = dp != null ? dp : n === 0 ? 0 : n < 10 ? 2 : n < 100 ? 1 : 0;
      s = n.toFixed(d);
      if (dp == null && s.indexOf('.') >= 0) s = s.replace(/\.?0+$/, '');
    } else {
      const x = Math.floor(Math.log10(n));
      if (CC.notation === 'scientific') {
        let m = n / Math.pow(10, x), ex = x;
        if (m >= 9.995) { m /= 10; ex++; }
        s = m.toFixed(2) + 'e' + ex;
      } else {
        let e = Math.floor(x / 3);
        let v = n / Math.pow(1000, e);
        if (v >= 999.995) { e++; v /= 1000; }
        if (CC.notation === 'engineering') s = v.toFixed(2) + 'e' + e * 3;
        else s = e < SUF.length ? v.toFixed(2) + SUF[e] : n.toExponential(2);
      }
    }
    return (neg ? '-' : '') + s;
  };

  CC.money = function (n) {
    return (n < 0 ? '-$' : '$') + CC.fmt(Math.abs(n), Math.abs(n) < 1000 ? 2 : undefined);
  };

  CC.time = function (s) {
    s = Math.max(0, Math.round(s));
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
    const h = Math.floor(s / 3600);
    return h + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  };

  CC.pct = (x, d) => (x * 100).toFixed(d == null ? 0 : d) + '%';

  CC.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  CC.clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  CC.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Linear blend between two #rrggbb colours.
  CC.mix = function (a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (p, s) => (p >> s) & 255;
    const r = (s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
    return '#' + ((1 << 24) | (r(16) << 16) | (r(8) << 8) | r(0)).toString(16).slice(1);
  };
})();
