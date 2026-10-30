var CC = (globalThis.CC = globalThis.CC || {});

// Hand-drawn teaching figures, embedded in lessons and quiz questions with [[fig:name]].
// Colours come from CSS classes so they work in both themes.
CC.FIGS = (function () {
  const ax = (x0, y0, x1, y1, xl, yl) => `<line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0}" class="fa" marker-end="url(#fah)"/><line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" class="fa" marker-end="url(#fah)"/>
    <text x="${(x0 + x1) / 2}" y="${y1 + 18}" class="ft" text-anchor="middle">${xl}</text><text x="${x0 - 10}" y="${(y0 + y1) / 2}" class="ft" text-anchor="middle" transform="rotate(-90 ${x0 - 10} ${(y0 + y1) / 2})">${yl}</text>`;
  const defs = '<defs><marker id="fah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fah"/></marker></defs>';
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" class="figsvg">${defs}${body}</svg>`;
  const dim = (x, y0, y1, label, side) => `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" class="fd" marker-start="url(#fah)" marker-end="url(#fah)"/><text x="${x + (side || 8)}" y="${(y0 + y1) / 2 + 4}" class="ft" text-anchor="${side < 0 ? 'end' : 'start'}">${label}</text>`;

  return {
    energy: { cap: 'Reaction profile for an exothermic reaction. The catalysed route (dashed) has a lower activation energy; ΔH is unchanged.',
      svg: svg(340, 210, ax(40, 15, 320, 185, 'reaction progress', 'energy') +
        `<path d="M50,110 C110,110 120,30 165,30 C210,30 220,150 300,150" class="fc1"/>
         <path d="M50,110 C110,110 125,75 165,75 C205,75 220,150 300,150" class="fc2"/>
         <text x="55" y="102" class="ft">reactants</text><text x="245" y="168" class="ft">products</text>
         ${dim(128, 110, 32, 'Eₐ', -6)}${dim(290, 112, 150, 'ΔH', -6)}<line x1="110" y1="110" x2="300" y2="110" class="fg"/>
         <text x="172" y="72" class="ft">catalysed</text>`) },
    boltzmann: { cap: 'Maxwell–Boltzmann distribution. At a higher temperature T₂ the curve flattens and shifts right, so many more molecules have energy ≥ Eₐ (shaded).',
      svg: svg(340, 210, ax(40, 15, 320, 185, 'molecular energy', 'number of molecules') +
        `<path d="M42,184 C70,40 110,30 140,70 C180,130 240,170 315,180" class="fc1"/>
         <path d="M42,184 C80,90 130,70 170,95 C210,125 260,160 315,172" class="fc2"/>
         <path d="M230,184 L230,150 C260,163 290,170 315,172 L315,184 Z" class="fsh"/>
         <line x1="230" y1="30" x2="230" y2="184" class="fg"/><text x="234" y="40" class="ft">Eₐ</text>
         <text x="110" y="45" class="ft">T₁</text><text x="175" y="88" class="ft">T₂ &gt; T₁</text>`) },
    reflux: { cap: 'Heating under reflux: vapour condenses in the vertical condenser and drips back, so nothing is lost and the mixture can boil for as long as needed.',
      svg: svg(220, 230,
        `<circle cx="110" cy="170" r="38" class="fglass"/><path d="M80,160 h60 a38,38 0 0 1 -60 0 z" class="fliq"/>
         <rect x="100" y="40" width="20" height="100" class="fglass"/><rect x="92" y="55" width="36" height="70" rx="6" class="fjacket"/>
         <path d="M140,115 h22" class="fa" marker-end="url(#fah)"/><text x="166" y="119" class="ft">water in</text>
         <path d="M128,65 h34" class="fa" marker-start="url(#fah)"/><text x="166" y="69" class="ft">water out</text>
         <path d="M110,95 v20" class="fdrip"/><text x="20" y="30" class="ft">open top</text>
         <rect x="70" y="210" width="80" height="10" class="fheat"/><text x="160" y="218" class="ft">heat</text>`) },
    distil: { cap: 'Distillation: the condenser slopes down to a receiver, so volatile products (like ethanal, bp 21 °C) are removed as soon as they form.',
      svg: svg(340, 220,
        `<circle cx="70" cy="160" r="36" class="fglass"/><path d="M42,150 h56 a36,36 0 0 1 -56 0 z" class="fliq"/>
         <rect x="62" y="70" width="16" height="56" class="fglass"/><line x1="70" y1="40" x2="70" y2="100" class="fthermo"/><text x="78" y="46" class="ft">thermometer</text>
         <path d="M78,80 L250,150" class="fglassl"/><path d="M110,82 L235,132 L228,148 L103,98 Z" class="fjacket"/>
         <path d="M250,150 v18" class="fdrip"/><path d="M228,175 h44 v32 h-44 z" class="fglass"/><path d="M230,192 h40 v13 h-40 z" class="fliq2"/>
         <text x="232" y="218" class="ft">distillate</text><rect x="35" y="202" width="70" height="10" class="fheat"/>`) },
    equilibrium: { cap: 'Approaching equilibrium. Concentrations stop changing — but forward and reverse reactions continue at equal rates (dynamic equilibrium).',
      svg: svg(340, 210, ax(40, 15, 320, 185, 'time', 'concentration') +
        `<path d="M42,35 C90,110 140,125 315,128" class="fc1"/><path d="M42,183 C90,105 140,92 315,90" class="fc2"/>
         <line x1="185" y1="20" x2="185" y2="184" class="fg"/><text x="190" y="30" class="ft">equilibrium reached</text>
         <text x="250" y="122" class="ft">reactants</text><text x="250" y="84" class="ft">products</text>`) },
    sn1sn2: { cap: 'SN2 (left) has one transition state. SN1 (right) has two, with a carbocation intermediate in the dip; the first, higher step is rate-determining.',
      svg: svg(360, 190,
        `${ax(30, 15, 170, 165, 'SN2', 'energy')}<path d="M35,120 C70,120 80,40 100,40 C120,40 130,140 165,140" class="fc1"/><text x="88" y="32" class="ft">TS</text>
         ${ax(200, 15, 345, 165, 'SN1', '')}<path d="M205,125 C230,125 235,40 252,40 C268,40 270,85 280,85 C290,85 295,60 305,60 C318,60 325,145 340,145" class="fc1"/>
         <text x="240" y="32" class="ft">TS1</text><text x="298" y="52" class="ft">TS2</text><text x="265" y="100" class="ft">R⁺</text>`) },
    directing: { cap: 'Directing effects. Electron-donating groups (–OH, –NH₂, –CH₃, –OCH₃) activate the ring and direct to 2,4 (ortho/para); electron-withdrawing groups (–NO₂, –COOH, –CHO) deactivate and direct to 3 (meta).',
      svg: svg(360, 180,
        `<polygon points="90,60 125,80 125,120 90,140 55,120 55,80" class="fring"/><circle cx="90" cy="100" r="22" class="fring"/>
         <line x1="90" y1="60" x2="90" y2="35" class="fbond"/><text x="90" y="28" class="ft" text-anchor="middle">–OH (donor)</text>
         <text x="132" y="78" class="fok">o</text><text x="132" y="128" class="fno">m</text><text x="90" y="160" class="fok" text-anchor="middle">p</text><text x="40" y="78" class="fok">o</text>
         <polygon points="270,60 305,80 305,120 270,140 235,120 235,80" class="fring"/><circle cx="270" cy="100" r="22" class="fring"/>
         <line x1="270" y1="60" x2="270" y2="35" class="fbond"/><text x="270" y="28" class="ft" text-anchor="middle">–NO₂ (withdrawer)</text>
         <text x="312" y="128" class="fok">m</text><text x="222" y="128" class="fok">m</text><text x="312" y="78" class="fno">o</text>
         <text x="90" y="178" class="ft" text-anchor="middle">2,4-directing</text><text x="270" y="178" class="ft" text-anchor="middle">3-directing</text>`) },
    micelle: { cap: 'A soap micelle: hydrophobic tails dissolve in the grease at the centre, ionic heads face the water.',
      svg: svg(220, 220, '<circle cx="110" cy="110" r="38" class="fgrease"/><text x="110" y="114" class="ft" text-anchor="middle">grease</text>' +
        Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return `<path d="M${110 + c * 42},${110 + s * 42} L${110 + c * 70},${110 + s * 70}" class="ftail"/><circle cx="${110 + c * 78}" cy="${110 + s * 78}" r="8" class="fhead"/><text x="${110 + c * 78}" y="${110 + s * 78 + 4}" class="fsm" text-anchor="middle">−</text>`; }).join('')) },
    oxladder: { cap: 'The oxidation ladder. [O] = acidified K₂Cr₂O₇; [H] = NaBH₄ (aldehydes/ketones) or LiAlH₄ (also acids and esters). Tertiary alcohols are not oxidised.',
      svg: svg(360, 170,
        `${['primary alcohol', 'aldehyde', 'carboxylic acid'].map((t, i) => `<rect x="${10 + i * 120}" y="20" width="100" height="34" rx="8" class="fbox"/><text x="${60 + i * 120}" y="42" class="ft" text-anchor="middle">${t}</text>`).join('')}
         <path d="M112,32 h16" class="fa" marker-end="url(#fah)"/><path d="M232,32 h16" class="fa" marker-end="url(#fah)"/><text x="120" y="15" class="fok">[O]</text><text x="240" y="15" class="fok">[O]</text>
         <path d="M128,46 h-16" class="fa" marker-end="url(#fah)"/><path d="M248,46 h-16" class="fa" marker-end="url(#fah)"/><text x="118" y="66" class="fno">[H]</text><text x="238" y="66" class="fno">[H]</text>
         <rect x="10" y="100" width="100" height="34" rx="8" class="fbox"/><text x="60" y="122" class="ft" text-anchor="middle">secondary alcohol</text>
         <rect x="130" y="100" width="100" height="34" rx="8" class="fbox"/><text x="180" y="122" class="ft" text-anchor="middle">ketone</text>
         <path d="M112,112 h16" class="fa" marker-end="url(#fah)"/><text x="116" y="96" class="fok">[O]</text><path d="M128,126 h-16" class="fa" marker-end="url(#fah)"/>
         <rect x="250" y="100" width="100" height="34" rx="8" class="fbox"/><text x="300" y="122" class="ft" text-anchor="middle">tertiary alcohol</text><text x="300" y="152" class="fno" text-anchor="middle">✗ no oxidation</text>`) },
    radical: { cap: 'The radical chain. One photon makes two Br• radicals; each propagation cycle makes a product molecule and regenerates Br•, so the chain runs thousands of times before termination.',
      svg: svg(360, 190,
        `<rect x="10" y="10" width="110" height="40" rx="8" class="fbox"/><text x="65" y="28" class="ft" text-anchor="middle">initiation</text><text x="65" y="43" class="fsm" text-anchor="middle">Br₂ —hν→ 2 Br•</text>
         <ellipse cx="200" cy="100" rx="95" ry="60" class="fcycle"/>
         <text x="200" y="52" class="fsm" text-anchor="middle">Br• + CH₄ → HBr + •CH₃</text><text x="200" y="158" class="fsm" text-anchor="middle">•CH₃ + Br₂ → CH₃Br + Br•</text>
         <text x="200" y="104" class="ft" text-anchor="middle">propagation</text>
         <path d="M120,30 C150,30 160,40 165,45" class="fa" marker-end="url(#fah)"/>
         <rect x="245" y="10" width="110" height="40" rx="8" class="fbox"/><text x="300" y="28" class="ft" text-anchor="middle">termination</text><text x="300" y="43" class="fsm" text-anchor="middle">2 radicals → molecule</text>`) },
    diels: { cap: 'Diels–Alder [4+2]: three curly arrows move in a ring at once; two new σ bonds (dashed) form a cyclohexene.',
      svg: svg(360, 160,
        `<path d="M40,50 L70,30 L100,50 L130,30" class="fbond"/><path d="M43,56 L70,38" class="fbond"/><path d="M103,56 L130,38" class="fbond"/>
         <path d="M45,120 L125,120" class="fbond"/><path d="M45,128 L125,128" class="fbond"/>
         <text x="85" y="18" class="ft" text-anchor="middle">diene (s-cis)</text><text x="85" y="148" class="ft" text-anchor="middle">dienophile</text>
         <path d="M175,85 h40" class="fa" marker-end="url(#fah)"/><text x="195" y="78" class="fsm" text-anchor="middle">heat</text>
         <polygon points="290,40 325,60 325,100 290,120 255,100 255,60" class="fring"/><path d="M262,94 L262,66" class="fbond"/>
         <path d="M255,100 L290,120 M325,100 L290,120" class="fnew"/><text x="290" y="145" class="ft" text-anchor="middle">cyclohexene</text>`) },
    suzuki: { cap: 'The Suzuki catalytic cycle: oxidative addition (Pd⁰ → Pdᴵᴵ), transmetalation (boron hands over its aryl group), reductive elimination (Ar–Ar′ leaves, Pd⁰ is regenerated).',
      svg: svg(360, 220,
        `<circle cx="180" cy="110" r="70" class="fcycle"/><text x="180" y="114" class="ft" text-anchor="middle">Pd catalyst</text>
         <rect x="140" y="20" width="80" height="26" rx="6" class="fbox"/><text x="180" y="38" class="fsm" text-anchor="middle">Pd⁰L₂</text>
         <rect x="255" y="95" width="100" height="30" rx="6" class="fbox"/><text x="305" y="114" class="fsm" text-anchor="middle">Ar–Pdᴵᴵ–X</text>
         <rect x="5" y="95" width="100" height="30" rx="6" class="fbox"/><text x="55" y="114" class="fsm" text-anchor="middle">Ar–Pdᴵᴵ–Ar′</text>
         <text x="270" y="55" class="fok">oxidative addition</text><text x="275" y="70" class="fsm">+ Ar–X</text>
         <text x="140" y="200" class="fok" text-anchor="middle">transmetalation</text><text x="180" y="215" class="fsm" text-anchor="middle">+ Ar′B(OH)₂ / base</text>
         <text x="10" y="55" class="fok">reductive elimination</text><text x="10" y="70" class="fsm">→ Ar–Ar′</text>`) },
    chainstep: { cap: 'Chain growth (top): monomers add one at a time to a reactive chain end. Step growth (bottom): any two chains or monomers join, releasing a small molecule each time.',
      svg: svg(360, 160,
        `${Array.from({ length: 6 }, (_, i) => `<circle cx="${30 + i * 26}" cy="40" r="10" class="fhead"/>`).join('')}<circle cx="186" cy="40" r="5" class="fsh2"/><text x="200" y="44" class="fsm">• + monomer → longer chain</text>
         <path d="M30,40 H160" class="fbond"/>
         <circle cx="40" cy="110" r="10" class="fhead"/><circle cx="66" cy="110" r="10" class="fgrease"/><path d="M40,110 H66" class="fbond"/>
         <text x="90" y="114" class="fsm">+</text><circle cx="115" cy="110" r="10" class="fhead"/><circle cx="141" cy="110" r="10" class="fgrease"/><path d="M115,110 H141" class="fbond"/>
         <path d="M160,110 h20" class="fa" marker-end="url(#fah)"/>
         ${Array.from({ length: 4 }, (_, i) => `<circle cx="${200 + i * 26}" cy="110" r="10" class="${i % 2 ? 'fgrease' : 'fhead'}"/>`).join('')}<path d="M200,110 H278" class="fbond"/><text x="290" y="114" class="fsm">+ H₂O</text>`) },
  };
})();
