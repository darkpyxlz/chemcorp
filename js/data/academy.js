var CC = (globalThis.CC = globalThis.CC || {});

// The Academy: short lessons + a quiz per course. Passing a quiz (≥75%) awards RP and
// unlocks research that lists the course as a requirement. Passed courses also feed
// the repeatable Pop Quiz.
CC.COURSES = [
  {
    id: 'lab_basics', name: 'Lab Fundamentals', icon: '🥽', reward: 15,
    desc: 'Glassware, moles, limiting reagents and yield.',
    lessons: [
      { t: 'Welcome to the bench', b: `
<p>Most organic reactions happen in a <b>round-bottom flask</b>. To run them hot without boiling the solvent away, chemists fit a <b>reflux condenser</b>: vapour rises, is cooled by water flowing through the jacket, condenses and drips back. The reaction then sits at the solvent's boiling point.</p>
<p>Temperature matters a lot. A common rule of thumb: <b>rate roughly doubles for every 10 °C rise</b>. Too cold and nothing happens; too hot and side reactions or decomposition take over.</p>
<p>In ChemCorp, your bath has a <b>setpoint</b>. The flask drifts towards it — and exothermic reactions push it higher, so watch the thermometer and adjust!</p>
[[fig:reflux]][[fig:boltzmann]]` },
      { t: 'Moles & stoichiometry', b: `
<p>A <b>mole</b> is 6.022 × 10²³ particles. A balanced equation tells you the <b>mole ratio</b> in which things react:</p>
<div class="eq">2 C₆H₅CHO + (CH₃)₂CO → dibenzalacetone + 2 H₂O</div>
<p>Two benzaldehyde for every acetone. These ratios are often given as <b>equivalents (eq)</b>, relative to the main starting material.</p>
<p>In the Lab you choose how many equivalents of each reagent go into the vessel — match the balanced equation!</p>` },
      { t: 'Limiting reagent & yield', b: `
<p>The <b>limiting reagent</b> is the one that runs out first; it caps how much product can form (the <b>theoretical yield</b>). Anything left of the other reagents is <b>excess</b> — wasted money.</p>
<div class="eq">% yield = actual ÷ theoretical × 100</div>
<p>A <b>catalyst</b> speeds a reaction up without being consumed, so you only need a little — often quoted in <b>mol%</b> (5 mol% = 0.05 eq).</p>
[[fig:energy]]` },
    ],
    quiz: [
      { q: 'What does a reflux condenser let you do?', o: ['Cool the reaction to 0 °C', 'Heat at the solvent\'s boiling point without losing solvent', 'Remove water from the reaction', 'Run the reaction under pressure'], a: 1, e: 'Vapour condenses in the cooled jacket and drips back into the flask.' },
      { q: '2 PhCHO + 1 acetone → product. You add 1 eq of each. Which reagent is limiting?', o: ['Acetone', 'Benzaldehyde', 'Neither', 'The catalyst'], a: 1, e: '1 eq benzaldehyde can only consume 0.5 eq acetone, so benzaldehyde runs out first.' },
      { q: 'Theoretical yield 2.0 mol; you isolate 1.5 mol. Percent yield?', o: ['50%', '67%', '75%', '133%'], a: 2, e: '1.5 ÷ 2.0 = 0.75 → 75%.' },
      { q: 'A catalyst…', o: ['is consumed to drive the reaction', 'shifts the equilibrium towards products', 'speeds up the reaction without being consumed', 'raises the yield above 100%'], a: 2, e: 'Catalysts lower the activation energy; they don\'t change the equilibrium position.' },
      { q: "Which set-up collects a volatile product as soon as it forms?", o: ["A separating funnel", "Heating under reflux", "A burette", "Distillation (condenser sloping down to a receiver)"], a: 3, e: "Distillation removes the vapour and condenses it into a separate flask.", fig: "[[fig:distil]]" },
      { q: "In the profile shown, the reaction is…", o: ["impossible without a catalyst", "thermoneutral", "exothermic — products are lower in energy", "endothermic — products are higher"], a: 2, e: "Energy is released: ΔH is negative.", fig: "[[fig:energy]]" },
      { q: "Raising the temperature speeds up a reaction mainly because…", o: ["Eₐ gets smaller", "the molecules get bigger", "the equilibrium constant always increases", "a larger fraction of collisions have energy ≥ Eₐ"], a: 3, e: "The Maxwell–Boltzmann curve shifts right: many more molecules exceed Eₐ.", fig: "[[fig:boltzmann]]" },
      { q: "0.10 mol of limiting reagent, 1:1 ratio, product M = 88 g/mol. Theoretical yield?", o: ["0.88 g", "88 g", "8.8 g", "4.4 g"], a: 2, e: "0.10 mol × 88 g/mol = 8.8 g." },
      { q: "Why heat flammable organic mixtures with a water bath or heating mantle, not a Bunsen?", o: ["It makes the reaction exothermic", "Water is a catalyst", "It keeps the flask below 0 °C", "Gentle, controlled heating with no naked flame"], a: 3, e: "Most organic solvents are highly flammable." },
    ],
  },
  {
    id: 'halo', name: 'Alkanes, Haloalkanes & Alcohols', icon: '⛓️', reward: 22, req: 'lab_basics',
    desc: 'Free radicals, substitution vs elimination, oxidation and the classic pathways.',
    lessons: [
      { t: 'Free-radical substitution', b: `
<p>Alkanes are unreactive, but UV light splits halogen molecules into <b>radicals</b> (species with an unpaired electron):</p>
<div class="eq">Initiation: Br₂ → 2 Br•<br>Propagation: Br• + CH₄ → HBr + •CH₃ ; •CH₃ + Br₂ → CH₃Br + Br•<br>Termination: Br• + Br• → Br₂ ; •CH₃ + Br• → CH₃Br ; 2 •CH₃ → C₂H₆</div>
<p>Each propagation step makes a new radical, so one photon can start a long <b>chain reaction</b>. Radical stability is <b>tertiary &gt; secondary &gt; primary</b>, and bromine is very selective for the most stable radical. Downsides: mixtures and further substitution (CH₂Br₂, CHBr₃…).</p>
[[fig:radical]]` },
      { t: 'Haloalkanes: substitution or elimination?', b: `
<p>The C–X bond is polar (C<sup>δ+</sup>), so nucleophiles attack the carbon. The conditions decide what happens:</p>
<ul><li><b>NaOH(aq)</b>, heat under reflux → <b>alcohol</b> (OH⁻ acts as a nucleophile)</li>
<li><b>KOH in ethanol</b>, heat → <b>alkene</b> (OH⁻ acts as a base and removes a β-H)</li>
<li><b>KCN in ethanol</b>, heat → <b>nitrile</b> (adds one carbon to the chain)</li>
<li><b>excess NH₃ in ethanol</b>, heat in a sealed tube → <b>amine</b></li></ul>
<p>Bond strength sets the rate: C–I is the weakest, so iodoalkanes react fastest; C–F barely reacts.</p>
[[mech:sn2:0]][[mech:e2:0]]` },
      { t: 'Alkenes: electrophilic addition', b: `
<p>The C=C π bond is electron-rich and attacks electrophiles:</p>
<ul><li><b>HBr</b> → bromoalkane (Markovnikov: H goes to the carbon that already has more H)</li>
<li><b>Br₂</b> → 1,2-dibromoalkane — the test for C=C: <b>orange bromine water decolourises</b></li>
<li><b>steam, H₃PO₄, 300 °C, 60 atm</b> → alcohol (industrial ethanol)</li>
<li><b>H₂, Ni, 150 °C</b> → alkane</li></ul>
<p>The reverse of hydration is dehydration: alcohol + excess conc. H₂SO₄ at 170 °C → alkene.</p>
[[mech:eadd:0]][[mech:eadd:1]]` },
      { t: 'Alcohols, carbonyls & nitriles', b: `
<p>Acidified <b>K₂Cr₂O₇</b> (orange → green) oxidises alcohols:</p>
<ul><li>1° alcohol → <b>aldehyde</b> if you <b>distil it out immediately</b>; → <b>carboxylic acid</b> if you <b>heat under reflux</b></li>
<li>2° alcohol → <b>ketone</b></li><li>3° alcohol → no reaction</li></ul>
<p>Tests: <b>2,4-DNPH</b> gives an orange precipitate with any C=O; <b>Tollens' reagent</b> gives a silver mirror only with aldehydes; <b>I₂/NaOH</b> gives yellow CHI₃ with CH₃CO– or CH₃CH(OH)– groups.</p>
<p>HCN adds to C=O (nucleophilic addition) → <b>hydroxynitrile</b>. Nitriles hydrolyse (acid, reflux) to <b>carboxylic acids</b>, or are reduced (LiAlH₄) to <b>amines</b>.</p>
[[mech:nadd:0]][[fig:oxladder]]` },
    ],
    quiz: [
      { q: 'What does UV light do in free-radical substitution?', o: ['Breaks C–H bonds heterolytically', 'Splits Br₂ into two Br• radicals', 'Acts as a catalyst for addition', 'Ionises the alkane'], a: 1, e: 'Homolytic fission of the weak Br–Br bond starts the chain (initiation).' },
      { q: 'Bromoethane + KOH dissolved in ethanol, heated. Main product?', o: ['Ethanol', 'Ethene', 'Ethylamine', 'Propanenitrile'], a: 1, e: 'In ethanol, OH⁻ acts as a base: elimination.' },
      { q: 'Which reagent lengthens a carbon chain by one carbon?', o: ['NaOH(aq)', 'NH₃', 'KCN', 'HBr'], a: 2, e: 'CN⁻ adds a carbon: R–Br → R–CN.' },
      { q: 'To make ethanal (not ethanoic acid) from ethanol with acidified dichromate you should…', o: ['heat under reflux for a long time', 'distil the product out as it forms', 'add excess dichromate', 'use concentrated NaOH'], a: 1, e: 'Distillation removes the volatile aldehyde before it is oxidised further.' },
      { q: 'Which compound gives a yellow precipitate with I₂ and NaOH?', o: ['Methanol', 'Propan-2-ol', 'Propan-1-ol', 'Methanal'], a: 1, e: 'Propan-2-ol has the CH₃CH(OH)– group.' },
      { q: "Which is a propagation step?", o: ["Br• + Br• → Br₂", "Br₂ → 2 Br•", "Br• + CH₄ → HBr + •CH₃", "CH₄ → C + 2 H₂"], a: 2, e: "Propagation steps use one radical and make another.", fig: "[[fig:radical]]" },
      { q: "Ethene + steam with H₃PO₄ at 300 °C gives…", o: ["ethanal", "ethane", "ethanol", "ethanoic acid"], a: 2, e: "Electrophilic addition of water (industrial ethanol)." },
      { q: "Propanone + HCN (trace KCN) gives…", o: ["propanal", "propanenitrile", "propan-2-ol", "2-hydroxy-2-methylpropanenitrile"], a: 3, e: "Nucleophilic addition of CN⁻ to C=O.", fig: "[[mech:nadd:0]]" },
    ],
  },
  {
    id: 'acids_bases', name: 'Organic Acids & Bases', icon: '⚗️', reward: 15, req: 'lab_basics',
    desc: 'Carboxylic acids, pKa and soap-making.',
    lessons: [
      { t: 'Carboxylic acids', b: `
<p>A <b>Brønsted acid</b> donates H⁺; a <b>base</b> accepts it. The –COOH group of a carboxylic acid gives up its proton to hydroxide, forming a water-soluble <b>carboxylate salt</b>:</p>
<div class="eq">CH₃COOH + NaOH → CH₃COO⁻Na⁺ + H₂O</div>
<p>The carboxylate is stabilised by <b>resonance</b>: the negative charge is shared equally between both oxygens. That's why carboxylic acids (pKa ≈ 5) are far more acidic than alcohols (pKa ≈ 16).</p>
[[mol:2;0:O,0:OH]]` },
      { t: 'pH and pKa', b: `
<p><b>pH = −log[H⁺]</b>. Strong acids dissociate completely; weak acids only partly. Acid strength is measured by <b>pKa</b> — the <i>lower</i> the pKa, the <i>stronger</i> the acid.</p>
<ul><li>HCl ≈ −6 (very strong)</li><li>acetic acid 4.76</li><li>phenol ≈ 10</li><li>water 15.7, ethanol ≈ 16</li><li>C–H next to a ketone ≈ 19–20</li></ul>
<p>A base can deprotonate an acid whose pKa is lower than its own conjugate acid's.</p>` },
      { t: 'Saponification', b: `
<p>Fats and oils are <b>triglycerides</b>: three fatty acids joined to glycerol by ester bonds. Hot NaOH hydrolyses all three:</p>
<div class="eq">triglyceride + 3 NaOH → 3 RCOO⁻Na⁺ (soap) + glycerol</div>
<p>This is irreversible — the carboxylate can't be attacked by an alcohol. Soap molecules have a polar, water-loving head and a long greasy tail; they form <b>micelles</b> around oil droplets so water can wash them away.</p>
[[fig:micelle]]` },
    ],
    quiz: [
      { q: 'Products of CH₃COOH + NaOH?', o: ['CH₃CH₂OH + NaO', 'CH₃COO⁻Na⁺ + H₂O', 'CH₃COONa + H₂', 'No reaction'], a: 1, e: 'Acid + base → carboxylate salt + water.' },
      { q: 'Which is the strongest acid (lowest pKa)?', o: ['Ethanol', 'Phenol', 'Acetic acid', 'HCl'], a: 3, e: 'HCl ≈ −6, acetic 4.76, phenol ≈ 10, ethanol ≈ 16.' },
      { q: 'How many NaOH are needed to fully saponify one triglyceride?', o: ['1', '2', '3', '6'], a: 2, e: 'One per ester group — a triglyceride has three.' },
      { q: 'Why does soap remove grease?', o: ['It oxidises the grease', 'It has a polar head and nonpolar tail that form micelles', 'It is a strong acid', 'It evaporates the grease'], a: 1, e: 'Tails dissolve in the grease, heads face the water.' },
      { q: "Which is the strongest acid?", o: ["CH₃COOH", "H₂O", "CH₃CH₂OH", "ClCH₂COOH"], a: 3, e: "The electron-withdrawing Cl stabilises the carboxylate anion, so chloroethanoic acid (pKa 2.9) is stronger than ethanoic acid (4.8)." },
      { q: "Why is ethanoic acid far more acidic than ethanol?", o: ["Ethanoic acid is a bigger molecule", "Ethanol has no O–H bond", "Its anion is stabilised by delocalisation over two oxygens", "Ethanol is an alkali"], a: 2, e: "Ethoxide keeps its charge on one oxygen; ethanoate shares it.", fig: "[[mol:2;0:O,0:OH]]" },
      { q: "Soap molecules in water cluster into…", o: ["a giant ionic lattice", "a polymer chain", "micelles, with tails inside and heads outside", "a covalent network with water"], a: 2, e: "Tails dissolve in grease; ionic heads face the water.", fig: "[[fig:micelle]]" },
      { q: "A carboxylic acid is added to Na₂CO₃(aq). You see…", o: ["fizzing (CO₂ given off)", "a fruity smell of ester", "a white precipitate of NaCl", "no change"], a: 0, e: "Carboxylic acids are strong enough to release CO₂ from carbonates — a standard test." },
      { q: "Ethanol (pKa ≈ 16) reacts with…", o: ["Na₂CO₃ only", "all bases equally", "sodium metal only", "NaOH and Na₂CO₃"], a: 2, e: "Ethanol is too weak an acid to react with hydroxide or carbonate, but sodium metal gives sodium ethoxide + H₂." },
    ],
  },
  {
    id: 'carbonyl', name: 'Carbonyls & Esters', icon: '🍌', reward: 22, req: 'lab_basics',
    desc: 'The C=O group, Fischer esterification and Le Chatelier.',
    lessons: [
      { t: 'The carbonyl group', b: `
<p>The C=O bond is polarised: oxygen is δ−, carbon is δ+. That makes the carbon <b>electrophilic</b> — nucleophiles attack it.</p>
<p>The carbonyl family: aldehydes, ketones, carboxylic acids, esters, amides, anhydrides and acid chlorides. Much of organic chemistry is "what attacks the C=O, and what leaves afterwards".</p>
[[mol:3;1:O]][[mol:2;0:O]]` },
      { t: 'Fischer esterification', b: `
<div class="eq">RCOOH + R′OH ⇌ RCOOR′ + H₂O &nbsp; (H₂SO₄ cat.)</div>
<p>Mechanism: the acid catalyst protonates the C=O, making the carbon much more electrophilic → the alcohol attacks → a tetrahedral intermediate forms → proton shuffles turn an –OH into –OH₂⁺ → water leaves → deprotonation gives the ester.</p>
<p>Every step is reversible. For acetic acid + ethanol, K ≈ 4, which caps the yield at about <b>67%</b> with a 1:1 ratio.</p>
[[fig:equilibrium]]` },
      { t: 'Le Chatelier to the rescue', b: `
<p>To push an equilibrium to the right, either add excess of a reactant or <b>remove a product</b>. In esterifications, removing water works beautifully — a <b>Dean–Stark trap</b> collects it as it distils.</p>
<p>Esters smell great: ethyl acetate (nail-polish remover), isoamyl acetate (banana), methyl salicylate (wintergreen), ethyl butanoate (pineapple).</p>
[[fig:distil]]` },
    ],
    quiz: [
      { q: 'In a C=O group, which atom is attacked by nucleophiles?', o: ['Oxygen', 'Carbon', 'Hydrogen', 'Neither'], a: 1, e: 'Carbon carries the δ+ charge.' },
      { q: 'The role of H₂SO₄ in Fischer esterification?', o: ['Solvent', 'Reducing agent', 'Catalyst that protonates the carbonyl', 'It becomes part of the ester'], a: 2, e: 'Protonation makes the carbonyl carbon much more electrophilic.' },
      { q: 'With 1:1 acid:alcohol and K ≈ 4, the maximum yield is about…', o: ['25%', '50%', '67%', '100%'], a: 2, e: 'Solve K = x²/(1−x)² = 4 → x = 2/3.' },
      { q: 'A Dean–Stark trap increases ester yield by…', o: ['adding more catalyst', 'removing water, shifting the equilibrium', 'cooling the reaction', 'adding pressure'], a: 1, e: 'Le Chatelier: remove a product and the equilibrium makes more.' },
      { q: "What is CH₃COOCH₂CH₃ called?", o: ["methyl propanoate", "ethyl propanoate", "propyl ethanoate", "ethyl ethanoate"], a: 3, e: "The alcohol part (ethyl) is named first, then the acid part (ethanoate)." },
      { q: "The ester from propanoic acid + methanol is…", o: ["propyl propanoate", "methyl ethanoate", "propyl methanoate", "methyl propanoate"], a: 3, e: "Alkyl group from the alcohol + '-oate' from the acid." },
      { q: "Adding excess ethanol to an esterification…", o: ["makes it exothermic", "lowers the equilibrium constant", "shifts the equilibrium right and raises the yield", "stops the reaction"], a: 2, e: "Le Chatelier: more reactant → more product; K is unchanged.", fig: "[[fig:equilibrium]]" },
      { q: "Which molecule shown is a ketone?", o: ["propan-2-ol", "propanoic acid", "propanal", "propanone (as drawn)"], a: 3, e: "The C=O is on an inner carbon: a ketone.", fig: "[[mol:3;1:O]]" },
    ],
  },
  {
    id: 'acylation', name: 'Acylation & Aspirin', icon: '💊', reward: 38, req: 'carbonyl',
    desc: 'Reactive acyl compounds, aspirin and amine selectivity.',
    lessons: [
      { t: 'Reactivity of acyl compounds', b: `
<p>Carboxylic acid derivatives differ in how good their <b>leaving group</b> is:</p>
<div class="eq">acid chloride &gt; anhydride &gt; ester ≈ acid &gt; amide</div>
<p>Cl⁻ and RCOO⁻ are stable, weakly basic anions — they leave easily. That's why anhydrides acylate alcohols, phenols and amines readily, while amides are very stable (good news for proteins!).</p>
[[mech:addel:0]][[mech:addel:1]]` },
      { t: 'Making aspirin', b: `
<div class="eq">salicylic acid + (CH₃CO)₂O → acetylsalicylic acid + CH₃COOH</div>
<p>A few drops of H₃PO₄ catalyse it at ~85 °C. Because acetate is a decent leaving group and no water is formed, it's not limited by equilibrium like Fischer esterification.</p>
<p>Purity test: <b>FeCl₃</b> turns violet with phenols — a violet colour means unreacted salicylic acid.</p>` },
      { t: 'Amines beat alcohols', b: `
<p>Nitrogen is less electronegative than oxygen, so its lone pair is more available: <b>amines are better nucleophiles</b> than alcohols or phenols.</p>
<p>Give 4-aminophenol one equivalent of acetic anhydride and the <i>nitrogen</i> gets acetylated — that's paracetamol. It even works in water.</p>` },
    ],
    quiz: [
      { q: 'Which is the most reactive acylating agent?', o: ['Acetamide', 'Ethyl acetate', 'Acetic anhydride', 'Acetyl chloride'], a: 3, e: 'Chloride is the best leaving group of the set.' },
      { q: 'By-product of aspirin synthesis with acetic anhydride?', o: ['Water', 'Acetic acid', 'Ethanol', 'HCl'], a: 1, e: 'The acetate leaving group picks up a proton.' },
      { q: 'A violet colour with FeCl₃ indicates…', o: ['a phenol is present', 'an amide is present', 'pure aspirin', 'acetic acid'], a: 0, e: 'Unreacted salicylic acid still has its free phenol.' },
      { q: '4-Aminophenol + 1 eq Ac₂O is acetylated mainly on…', o: ['the oxygen', 'the nitrogen', 'the ring', 'both equally'], a: 1, e: 'Nitrogen is the stronger nucleophile.' },
      { q: "Order of reactivity with water:", o: ["acyl chloride > anhydride > ester > amide", "amide > ester > anhydride > acyl chloride", "they are all the same", "ester > acyl chloride > amide > anhydride"], a: 0, e: "Better leaving group → more reactive." },
      { q: "Ethanoyl chloride + ethanol gives…", o: ["no reaction", "ethyl ethanoate + HCl", "ethanal + HCl", "ethanoic acid + chloroethane"], a: 1, e: "Nucleophilic addition–elimination; HCl fumes are released." },
      { q: "In the mechanism shown, what leaves in the elimination step?", o: ["NH₃", "H₂", "O²⁻", "Cl⁻"], a: 3, e: "Chloride is a good, stable leaving group.", fig: "[[mech:addel:1]]" },
      { q: "Why is ethanoic anhydride preferred to ethanoyl chloride for making aspirin industrially?", o: ["It is more reactive", "It is a catalyst", "It is cheaper, safer and gives no HCl fumes", "It makes a different product"], a: 2, e: "Anhydrides react less violently with water and their by-product is ethanoic acid." },
      { q: "What does recrystallisation do?", o: ["Speeds up the reaction", "Dries a liquid", "Increases the yield above 100%", "Purifies a solid: dissolve in minimum hot solvent, cool, filter"], a: 3, e: "Impurities stay dissolved in the cold solvent." },
    ],
  },
  {
    id: 'subst', name: 'Substitution & Elimination', icon: '🔄', reward: 60, req: 'carbonyl',
    desc: 'SN1, SN2, Williamson ether synthesis and E1.',
    lessons: [
      { t: 'SN2', b: `
<p>One concerted step: the nucleophile attacks from the <b>back side</b> as the leaving group departs, inverting the stereocentre. Rate = k[Nu][R–X].</p>
<p>Best for methyl and <b>primary</b> substrates; bulky groups block the back side. Polar aprotic solvents speed it up.</p>
<div class="eq">CH₃(CH₂)₃OH + HBr → CH₃(CH₂)₃Br + H₂O</div>
<p>Here H₂SO₄ + NaBr generate HBr; protonating the –OH turns it into water, a good leaving group.</p>
[[mech:sn2:0]]` },
      { t: 'SN1', b: `
<p>Two steps: the leaving group departs to form a <b>carbocation</b>, then the nucleophile adds. Rate = k[R–X] only.</p>
<p>Carbocation stability rules: <b>tertiary &gt; secondary ≫ primary</b>. tert-Butanol + conc. HCl gives tert-butyl chloride within minutes at room temperature.</p>
[[mech:sn1:0]][[mech:sn1:1]][[fig:sn1sn2]]` },
      { t: 'Williamson ether synthesis', b: `
<p>Deprotonate an alcohol or phenol to an alkoxide/phenoxide, then let it do SN2 on an alkyl halide:</p>
<div class="eq">ArO⁻ + R–Br → Ar–O–R + Br⁻</div>
<p>2-Naphthol (pKa ≈ 9.5) is acidic enough for NaOH. Use a <b>primary</b> halide — with a tertiary one the alkoxide acts as a base and you get elimination instead.</p>` },
      { t: 'E1 dehydration', b: `
<p>Heat an alcohol with strong acid: the –OH is protonated, water leaves to give a carbocation, and loss of a neighbouring H⁺ gives an <b>alkene</b>.</p>
<p>Distilling the alkene out as it forms pulls the equilibrium over (Le Chatelier). <b>Zaitsev's rule</b>: the more substituted alkene usually wins. H₃PO₄ is preferred over H₂SO₄ because it doesn't oxidise or char the organics.</p>
[[mech:e2:0]]` },
    ],
    quiz: [
      { q: 'Which substrate reacts fastest by SN1?', o: ['Bromomethane', '1-Bromobutane', '2-Bromobutane', 'tert-Butyl bromide'], a: 3, e: 'It forms the most stable (tertiary) carbocation.' },
      { q: 'The SN2 rate depends on…', o: ['only the substrate', 'only the nucleophile', 'both nucleophile and substrate', 'neither'], a: 2, e: 'Both are in the single, rate-determining step.' },
      { q: 'Best alkyl halide for a Williamson ether synthesis?', o: ['Primary', 'Secondary', 'Tertiary', 'Aryl'], a: 0, e: 'SN2 needs an unhindered carbon; tertiary halides eliminate.' },
      { q: 'Why distil cyclohexene out as it forms?', o: ['It is toxic', 'It removes product, shifting the equilibrium forward', 'To cool the flask', 'To recover the catalyst'], a: 1, e: 'Le Chatelier again.' },
      { q: "Which hydrolyses fastest with NaOH(aq)?", o: ["1-iodobutane", "1-bromobutane", "1-chlorobutane", "1-fluorobutane"], a: 0, e: "The C–I bond is the weakest, so it breaks most easily." },
      { q: "SN2 at a chiral carbon gives…", o: ["inversion of configuration", "retention", "an alkene", "a racemic mixture"], a: 0, e: "Back-side attack flips the carbon like an umbrella in the wind.", fig: "[[mech:sn2:0]]" },
      { q: "SN1 at a chiral carbon gives…", o: ["a racemic mixture", "no product", "retention only", "inversion only"], a: 0, e: "The planar carbocation is attacked from both faces equally.", fig: "[[fig:sn1sn2]]" },
      { q: "2-bromo-2-methylpropane is hydrolysed mainly by…", o: ["SN2", "electrophilic addition", "free-radical substitution", "SN1"], a: 3, e: "Tertiary: stable carbocation, and the back side is blocked." },
      { q: "Which conditions favour elimination over substitution?", o: ["cold water", "dilute acid", "KOH in ethanol, hot", "dilute NaOH(aq), warm"], a: 2, e: "Strong base, ethanol solvent, high temperature → alkene." },
    ],
  },
  {
    id: 'redox', name: 'Redox: Oxidation & Reduction', icon: '🔋', reward: 90, req: 'acylation',
    desc: 'Oxidation levels, bleach oxidation, NaBH₄ and LiAlH₄.',
    lessons: [
      { t: 'Oxidation levels', b: `
<p>Carbon can be climbed up and down an oxidation ladder:</p>
<div class="eq">alkane → alcohol → aldehyde/ketone → carboxylic acid → CO₂</div>
<p>Going down (reduction) adds hydrogen. In the lab, the go-to sources of hydride (H⁻) are <b>NaBH₄</b> and <b>LiAlH₄</b>.</p>
<p>Going up (oxidation): <b>secondary alcohols → ketones</b>; primary alcohols → aldehydes → carboxylic acids; tertiary alcohols resist oxidation. Household bleach (NaOCl) in acetic acid forms HOCl, a cheap, green oxidant that turns cyclohexanol into cyclohexanone.</p>
[[fig:oxladder]]` },
      { t: 'Sodium borohydride', b: `
<p>NaBH₄ is mild and selective: it reduces <b>aldehydes and ketones</b> but generally leaves esters, acids and amides alone. It tolerates methanol, ethanol, even water.</p>
<p>Each BH₄⁻ can deliver up to <b>four</b> hydrides, so 0.25 eq is the theoretical minimum.</p>
<div class="eq">Ph₂C=O → Ph₂CH–OH &nbsp; (benzophenone → diphenylmethanol)</div>
[[mech:nabh4:0]]` },
      { t: 'LiAlH₄ vs NaBH₄', b: `
<p>LiAlH₄ is far more powerful — it also reduces esters, acids and amides — but it reacts violently with water and alcohols, so it needs dry ether or THF. The Al–H bond is more polar (Al is less electronegative than B), making the hydride more reactive.</p>` },
    ],
    quiz: [
      { q: 'NaBH₄ reduces a ketone to…', o: ['an aldehyde', 'a primary alcohol', 'a secondary alcohol', 'an alkane'], a: 2, e: 'R₂C=O + H⁻ → R₂CH–O⁻ → R₂CH–OH.' },
      { q: 'Maximum hydrides delivered by one BH₄⁻?', o: ['1', '2', '3', '4'], a: 3, e: 'Four B–H bonds.' },
      { q: 'Which solvent is fine for NaBH₄ but NOT for LiAlH₄?', o: ['THF', 'Diethyl ether', 'Methanol', 'Toluene'], a: 2, e: 'LiAlH₄ reacts violently with protic solvents.' },
      { q: 'Benzophenone + NaBH₄ gives…', o: ['benzoic acid', 'diphenylmethanol', 'triphenylmethanol', 'benzene'], a: 1, e: 'Ketone → secondary alcohol.' },
      { q: "Which alcohol is NOT oxidised by acidified dichromate?", o: ["propan-1-ol", "2-methylpropan-2-ol", "propan-2-ol", "ethanol"], a: 1, e: "Tertiary alcohols have no H on the carbinol carbon.", fig: "[[fig:oxladder]]" },
      { q: "Colour change when acidified K₂Cr₂O₇ oxidises an alcohol:", o: ["green → orange", "colourless → yellow", "orange → green", "purple → colourless"], a: 2, e: "Cr₂O₇²⁻ (orange) is reduced to Cr³⁺ (green)." },
      { q: "Oxidising the molecule shown gives…", o: ["propene", "propanoic acid", "propanal", "propanone"], a: 3, e: "Propan-2-ol is secondary → ketone.", fig: "[[mol:3;1:OH]]" },
      { q: "LiAlH₄ reduces an ester RCOOR′ to…", o: ["RCHO only", "an alkane", "RCH₂OH + R′OH", "RCOOH"], a: 2, e: "The ester is cleaved and the acyl part reduced to a primary alcohol." },
      { q: "Which test tells an aldehyde from a ketone?", o: ["litmus", "2,4-DNPH", "Tollens' reagent (silver mirror)", "bromine water"], a: 2, e: "2,4-DNPH reacts with both; only aldehydes reduce Tollens'." },
    ],
  },
  {
    id: 'organomet', name: 'Organometallics: Grignard', icon: '🧲', reward: 180, req: 'redox',
    desc: 'Making and using carbon nucleophiles.',
    lessons: [
      { t: 'Making a Grignard reagent', b: `
<div class="eq">R–Br + Mg → R–MgBr &nbsp; (dry ether)</div>
<p>Ether oxygens coordinate to magnesium and stabilise the reagent; diethyl ether and THF are standard. Magnesium is coated in MgO, so initiation can be stubborn — a crystal of <b>iodine</b> etches the surface. Once it starts, it's exothermic enough to reflux the ether (35 °C).</p>` },
      { t: 'Why so dry?', b: `
<p>The C–Mg bond is very polar: the carbon behaves like a carbanion and is a ferociously strong base (benzene's pKa ≈ 43). Water (pKa 15.7) protonates it instantly:</p>
<div class="eq">PhMgBr + H₂O → PhH + Mg(OH)Br</div>
<p>So: anhydrous solvent, dried glassware, and an inert <b>N₂</b> atmosphere (O₂ and CO₂ react too). No alcohols, no acids.</p>` },
      { t: 'Building C–C bonds', b: `
<p>Grignards attack carbonyls, then acid workup gives an alcohol:</p>
<ul><li>formaldehyde → primary alcohol</li><li>aldehyde → secondary alcohol</li><li>ketone → <b>tertiary</b> alcohol</li><li>ester (2 eq) → tertiary alcohol</li><li>CO₂ → carboxylic acid</li></ul>
<div class="eq">PhMgBr + Ph₂C=O → Ph₃C–OH</div>
[[mech:grignard:0]]` },
    ],
    quiz: [
      { q: 'Why must Grignard reactions be anhydrous?', o: ['Water oxidises Mg', 'Water protonates and destroys the Grignard reagent', 'Water freezes', 'Water is too polar'], a: 1, e: 'The carbanion-like carbon grabs H⁺ from water.' },
      { q: 'What does the iodine crystal do?', o: ['Catalyses C–C bond formation', 'Activates the Mg surface to start the reaction', 'Dries the solvent', 'Acts as the electrophile'], a: 1, e: 'It cleans off the passivating oxide.' },
      { q: 'Grignard + ketone (then workup) gives…', o: ['a primary alcohol', 'a secondary alcohol', 'a tertiary alcohol', 'a carboxylic acid'], a: 2, e: 'The carbonyl carbon ends up with three carbon groups.' },
      { q: 'A suitable Grignard solvent?', o: ['Water', 'Methanol', 'Diethyl ether', 'Acetic acid'], a: 2, e: 'Aprotic and Mg-coordinating.' },
      { q: "A Grignard reagent + CO₂, then H₃O⁺, gives…", o: ["a carboxylic acid with one more carbon", "an alcohol", "an alkane", "an ester"], a: 0, e: "R–MgX + CO₂ → RCOO⁻ → RCOOH." },
      { q: "To make a secondary alcohol, add a Grignard reagent to…", o: ["a ketone", "an aldehyde (other than methanal)", "CO₂", "methanal"], a: 1, e: "Aldehyde → 2°, ketone → 3°, methanal → 1°." },
      { q: "Ethylmagnesium bromide + water gives…", o: ["ethane", "bromoethane", "ethene", "ethanol"], a: 0, e: "The carbanion-like carbon takes H⁺ from water." },
      { q: "In the step shown, why is the CH₃ carbon nucleophilic?", o: ["Mg is electropositive, so the C–Mg carbon is δ−", "Carbon has a positive charge", "Mg withdraws electron density from oxygen", "The carbon is aromatic"], a: 0, e: "The C–Mg bonding pair attacks the δ+ carbonyl carbon.", fig: "[[mech:grignard:0]]" },
    ],
  },
  {
    id: 'enolate', name: 'Enolates & Aldol', icon: '🌞', reward: 150, req: 'redox',
    desc: 'α-Acidity and the aldol condensation.',
    lessons: [
      { t: 'α-Hydrogens', b: `
<p>Hydrogens on the carbon next to a C=O (the α-carbon) are surprisingly acidic — acetone's pKa is about <b>19–20</b> — because the resulting <b>enolate</b> spreads its negative charge onto oxygen by resonance.</p>
<p>Hydroxide can't fully deprotonate acetone, but it makes enough enolate to react.</p>` },
      { t: 'The aldol reaction', b: `
<p>An enolate (nucleophile) attacks another carbonyl (electrophile) to form a β-hydroxy carbonyl — an "aldol". With heat or extra conjugation it loses water to give an <b>α,β-unsaturated carbonyl</b>: the aldol <i>condensation</i>.</p>
[[mol:4;0:O,2:OH]]` },
      { t: 'Crossed aldol: dibenzalacetone', b: `
<p>Mixing two different enolisable carbonyls gives a mess of products. The trick: use an aldehyde with <b>no α-H</b> — benzaldehyde — so it can only be the electrophile.</p>
<p>Acetone has α-H on both sides and reacts twice: <b>2 PhCHO : 1 acetone</b>.</p>
<div class="eq">2 PhCHO + (CH₃)₂CO → (PhCH=CH)₂CO + 2 H₂O</div>
<p>The extended conjugation makes it yellow and UV-absorbing.</p>` },
    ],
    quiz: [
      { q: 'Approximate pKa of acetone\'s α-hydrogens?', o: ['4.8', '19–20', '35', '50'], a: 1, e: 'Enolate resonance makes them far more acidic than ordinary C–H.' },
      { q: 'Why use benzaldehyde in a crossed aldol?', o: ['It is cheap', 'It has no α-hydrogens, so it can\'t self-condense', 'It is a strong base', 'It is a solvent'], a: 1, e: 'It can only act as the electrophile.' },
      { q: 'Ratio benzaldehyde : acetone for dibenzalacetone?', o: ['1:1', '1:2', '2:1', '3:1'], a: 2, e: 'Acetone reacts on both sides.' },
      { q: 'An aldol condensation product is…', o: ['an ester', 'an α,β-unsaturated carbonyl', 'an ether', 'an alkane'], a: 1, e: 'Dehydration of the aldol gives a conjugated enone.' },
      { q: "Ethanal + dilute NaOH (cold) gives…", o: ["butanal", "ethanoic acid", "3-hydroxybutanal", "ethyl ethanoate"], a: 2, e: "The aldol addition product: β-hydroxy aldehyde.", fig: "[[mol:4;0:O,2:OH]]" },
      { q: "A Claisen condensation joins two…", o: ["alkenes", "amines", "esters", "haloalkanes"], a: 2, e: "An ester enolate attacks a second ester → β-keto ester." },
      { q: "Why is a full equivalent of base needed in a Claisen condensation?", o: ["The base becomes part of the product", "To dissolve the ester", "To neutralise CO₂", "The β-keto ester product is deprotonated, which drives the equilibrium"], a: 3, e: "The product's α-H between two C=O (pKa 11) is removed irreversibly." },
      { q: "Which compound can NOT form an enolate?", o: ["propanone", "benzaldehyde", "ethanal", "ethyl ethanoate"], a: 1, e: "Benzaldehyde has no α-hydrogens." },
    ],
  },
  {
    id: 'pericyclic', name: 'Pericyclic: Diels–Alder', icon: '💍', reward: 180, req: 'subst',
    desc: 'The [4+2] cycloaddition.',
    lessons: [
      { t: '[4+2] cycloaddition', b: `
<p>A conjugated <b>diene</b> (4 π electrons) and a <b>dienophile</b> (2 π electrons) combine to form a cyclohexene ring, making <b>two new σ bonds</b> in a single concerted step — no intermediates.</p>
<p>Otto Diels and Kurt Alder won the 1950 Nobel Prize for it.</p>
[[fig:diels]]` },
      { t: 'Making it go', b: `
<p>The diene must adopt the <b>s-cis</b> conformation. Electron-poor dienophiles react fastest: maleic anhydride, with two carbonyls pulling on its C=C, is a classic.</p>
<p>Anthracene reacts across its central ring (C9 and C10), leaving two intact benzene rings. It needs heat — refluxing xylene (~140 °C).</p>` },
      { t: 'Stereochemistry', b: `
<p>The reaction is <b>stereospecific</b>: groups that are cis on the dienophile end up cis in the ring. With cyclic dienes, the <b>endo</b> product usually dominates, thanks to secondary orbital interactions.</p>` },
    ],
    quiz: [
      { q: 'How many new σ bonds form in a Diels–Alder reaction?', o: ['1', '2', '3', '4'], a: 1, e: 'Two new C–C σ bonds close the ring.' },
      { q: 'The best dienophile here?', o: ['Ethene', 'Cyclohexane', 'Maleic anhydride', 'Ethanol'], a: 2, e: 'Electron-withdrawing carbonyls activate the C=C.' },
      { q: 'Required diene conformation?', o: ['s-trans', 's-cis', 'chair', 'boat'], a: 1, e: 'The ends of the diene must be close enough to bond.' },
      { q: 'Anthracene reacts at which positions?', o: ['1 and 4', '2 and 3', '9 and 10', '1 and 8'], a: 2, e: 'The central ring — preserving two aromatic benzene rings.' },
      { q: "Buta-1,3-diene + ethene (Diels–Alder) gives…", o: ["cyclohexene", "cyclobutane", "benzene", "hexa-1,3,5-triene"], a: 0, e: "Four + two carbons close a six-membered ring with one C=C.", fig: "[[fig:diels]]" },
      { q: "The endo rule states that…", o: ["the exo product always forms", "the dienophile's substituents end up tucked under the new ring", "the diene must be s-trans", "only trans products form"], a: 1, e: "Secondary orbital overlap favours the endo transition state." },
      { q: "Why is cyclopentadiene such a reactive diene?", o: ["It has no π bonds", "It is aromatic", "It is a radical", "It is locked in the s-cis conformation"], a: 3, e: "No energy is spent rotating into the reactive shape." },
      { q: "A Diels–Alder reaction is…", o: ["an acid–base reaction", "a two-step reaction via a carbocation", "concerted — all bonds form in one step", "a radical chain"], a: 2, e: "No intermediates: a single cyclic transition state." },
    ],
  },
  {
    id: 'aromatic', name: 'Aromatic Substitution', icon: '⬡', reward: 375, req: 'enolate',
    desc: 'Aromaticity, nitration and Friedel–Crafts.',
    lessons: [
      { t: 'Aromaticity & EAS', b: `
<p>Benzene's 6 π electrons (Hückel's 4n+2 rule) make it unusually stable, so it does <b>substitution</b> rather than addition. In electrophilic aromatic substitution, an electrophile attacks the ring to give a <b>σ-complex</b> (arenium ion), and loss of H⁺ restores aromaticity.</p>
[[mech:nitration:0]][[mech:nitration:1]]` },
      { t: 'Nitration', b: `
<div class="eq">HNO₃ + 2 H₂SO₄ → NO₂⁺ + H₃O⁺ + 2 HSO₄⁻</div>
<p>The <b>nitronium ion</b> is the electrophile. Nitration is very exothermic: keep it at 0–15 °C to avoid dinitration and runaway reactions.</p>
<p><b>Directing effects</b>: electron-withdrawing groups like the ester in methyl benzoate are <b>meta</b> directors → methyl 3-nitrobenzoate.</p>` },
      { t: 'Friedel–Crafts acylation', b: `
<p>AlCl₃ pulls the leaving group off an acid chloride or anhydride, forming an <b>acylium ion</b> R–C≡O⁺. The product ketone complexes AlCl₃, so you need <b>at least one equivalent</b> (more with anhydrides). Everything must be dry.</p>
<p>Anisole's –OCH₃ is an <b>activating ortho/para director</b>; sterics favour para. Unlike alkylation, acylation doesn't over-react, because the ketone deactivates the ring.</p>
[[fig:directing]]` },
    ],
    quiz: [
      { q: 'The electrophile in nitration is…', o: ['NO₃⁻', 'NO₂⁺', 'HNO₂', 'NO'], a: 1, e: 'The nitronium ion, made by H₂SO₄ protonating HNO₃.' },
      { q: 'An ester group on benzene directs incoming electrophiles…', o: ['ortho/para', 'meta', 'ipso', 'nowhere'], a: 1, e: 'Electron-withdrawing → meta.' },
      { q: 'Why is ≥1 eq AlCl₃ needed in Friedel–Crafts acylation?', o: ['It is the solvent', 'The ketone product complexes AlCl₃', 'It is reduced', 'To dry the reaction'], a: 1, e: 'The Lewis basic C=O of the product ties it up.' },
      { q: 'An –OCH₃ substituent is…', o: ['deactivating, meta', 'activating, ortho/para', 'deactivating, ortho/para', 'activating, meta'], a: 1, e: 'Its lone pairs donate into the ring.' },
      { q: "Why does benzene substitute rather than add?", o: ["Addition is faster", "Benzene has no π electrons", "Substitution keeps the stable delocalised ring", "Benzene is saturated"], a: 2, e: "Addition would destroy aromatic stabilisation (~150 kJ/mol).", fig: "[[mech:nitration:1]]" },
      { q: "Which substituent directs to the 2- and 4-positions?", o: ["–CHO", "–NO₂", "–COOH", "–CH₃"], a: 3, e: "Electron-donating groups activate and direct ortho/para.", fig: "[[fig:directing]]" },
      { q: "Phenol decolourises bromine water without a catalyst because…", o: ["phenol is acidic", "the O lone pair strongly activates the ring", "bromine water contains a catalyst", "phenol is an alkene"], a: 1, e: "Delocalised O lone pair raises the ring's electron density; 2,4,6-tribromophenol forms." },
      { q: "Which is a halogen carrier for chlorinating benzene?", o: ["UV light", "AlCl₃ (or FeCl₃)", "H₂/Ni", "NaOH"], a: 1, e: "It polarises Cl₂ into an electrophile; UV would give radicals instead." },
    ],
  },
  {
    id: 'azo', name: 'Diazonium Salts & Azo Dyes', icon: '🎨', reward: 600, req: 'aromatic',
    desc: 'Cold chemistry that makes colour.',
    lessons: [
      { t: 'Diazotization', b: `
<div class="eq">ArNH₂ + NaNO₂ + 2 HCl → ArN₂⁺Cl⁻ + NaCl + 2 H₂O</div>
<p>Nitrous acid (from NaNO₂ + HCl) converts an aromatic amine into a <b>diazonium salt</b>. These are unstable: above ~5 °C they lose <b>N₂ gas</b> (forming phenols), and dry solids can explode. Keep it at <b>0–5 °C</b> and use it immediately.</p>` },
      { t: 'Azo coupling', b: `
<p>ArN₂⁺ is a weak electrophile, so it only attacks very electron-rich rings — phenoxides and anilines like N,N-dimethylaniline — usually <b>para</b>. The product Ar–N=N–Ar′ has a long conjugated π system that absorbs <b>visible light</b>: it's coloured.</p>` },
      { t: 'Methyl orange', b: `
<p>Sulfanilic acid → diazonium salt → couple with N,N-dimethylaniline → add NaOH for the sodium salt.</p>
<p>Methyl orange is a pH indicator: <b>red below pH 3.1</b>, <b>yellow above 4.4</b>. Protonation changes the conjugated system and hence the colour.</p>` },
    ],
    quiz: [
      { q: 'Temperature for diazotization?', o: ['0–5 °C', '25 °C', '60 °C', '100 °C'], a: 0, e: 'Warmer and the diazonium salt decomposes.' },
      { q: 'Which gas is released when a diazonium salt decomposes?', o: ['O₂', 'NO₂', 'N₂', 'H₂'], a: 2, e: 'N₂ is a superb leaving group.' },
      { q: 'Why are azo compounds coloured?', o: ['They contain metals', 'Extended conjugation absorbs visible light', 'They fluoresce', 'They are radicals'], a: 1, e: 'Conjugation shrinks the HOMO–LUMO gap into the visible range.' },
      { q: 'Methyl orange in strong acid is…', o: ['yellow', 'colourless', 'red', 'blue'], a: 2, e: 'Red below pH 3.1.' },
      { q: "A diazonium salt + phenol in NaOH(aq) at 5 °C gives…", o: ["chlorobenzene", "an azo dye", "phenylamine", "phenol + N₂"], a: 1, e: "Electrophilic substitution of the activated phenoxide ring." },
      { q: "Warming benzenediazonium chloride in water gives…", o: ["an azo dye", "phenylamine", "benzene", "phenol + N₂"], a: 3, e: "Why they must be kept below 5 °C." },
      { q: "The Sandmeyer reaction converts ArN₂⁺ to ArBr using…", o: ["KI", "Sn/HCl", "CuBr", "AlBr₃"], a: 2, e: "Copper(I) catalyses the radical replacement of N₂." },
      { q: "Why does azo coupling happen at the para position?", o: ["It is random", "It is activated by –OH/–NR₂ and the least hindered", "It is deactivated", "The ortho positions are already substituted"], a: 1, e: "Both electronics and sterics favour para." },
    ],
  },
  {
    id: 'medchem', name: 'Medicinal Chemistry', icon: '⚕️', reward: 600, req: 'aromatic',
    desc: 'Painkillers and anaesthetics.',
    lessons: [
      { t: 'Amides in drugs', b: `
<p>The amide bond is stable and forms hydrogen bonds — perfect for drugs. <b>Paracetamol</b> (acetaminophen) is made by acetylating the nitrogen of 4-aminophenol. It relieves pain and fever.</p>` },
      { t: 'Local anaesthetics', b: `
<p>Local anaesthetics block <b>voltage-gated sodium channels</b> in nerves, so pain signals can't travel.</p>
<p><b>Benzocaine</b> is ethyl 4-aminobenzoate — a Fischer esterification of PABA. <b>Lidocaine</b> (Löfgren, 1943) is made in two steps: 2,6-dimethylaniline + chloroacetyl chloride gives an α-chloroamide; then diethylamine displaces the chloride by SN2 (3 eq: one to react, the rest to neutralise HCl).</p>
<p>The two ortho-methyl groups shield lidocaine's amide from hydrolysis, so it lasts longer.</p>` },
      { t: 'Ibuprofen', b: `
<p>Ibuprofen is an NSAID: it inhibits the <b>COX enzymes</b> that make inflammatory prostaglandins. It's sold as a racemate; the (S)-enantiomer is the active one, and the body converts much of the (R) into (S).</p>` },
    ],
    quiz: [
      { q: 'Paracetamol is made by acetylating…', o: ['phenol', 'aniline', '4-aminophenol', 'salicylic acid'], a: 2, e: 'The amine nitrogen gets the acetyl group.' },
      { q: 'Benzocaine is made by which reaction?', o: ['Fischer esterification', 'Grignard', 'Diels–Alder', 'Nitration'], a: 0, e: 'PABA + ethanol, acid catalyst.' },
      { q: 'In lidocaine step 2, diethylamine acts as…', o: ['an electrophile', 'a nucleophile displacing chloride', 'a catalyst', 'a solvent'], a: 1, e: 'SN2 on the α-chloroamide.' },
      { q: 'Local anaesthetics block…', o: ['COX enzymes', 'opioid receptors', 'voltage-gated sodium channels', 'histamine receptors'], a: 2, e: 'No Na⁺ influx, no nerve signal.' },
      { q: "Two enantiomers of a drug can…", o: ["never differ in effect", "have different molecular formulae", "have different boiling points", "have very different biological effects"], a: 3, e: "Receptors and enzymes are chiral — thalidomide is the tragic example." },
      { q: "Sulfanilamide kills bacteria by mimicking…", o: ["DNA", "glucose", "penicillin", "PABA (4-aminobenzoic acid)"], a: 3, e: "It blocks the enzyme that turns PABA into folic acid." },
      { q: "Which functional groups are in paracetamol?", o: ["an ester and a carboxylic acid", "a ketone and an amine", "a nitrile and an alcohol", "an amide and a phenol"], a: 3, e: "HO–C₆H₄–NH–CO–CH₃." },
      { q: "Why does aspirin irritate the stomach?", o: ["It is acidic and blocks protective prostaglandins", "It contains chlorine", "It is radioactive", "It is a strong base"], a: 0, e: "COX inhibition also removes prostaglandins that protect the stomach lining." },
    ],
  },
  {
    id: 'green', name: 'Green & Industrial Chemistry', icon: '🌱', reward: 1200, req: 'medchem',
    desc: 'Atom economy and the BHC ibuprofen process.',
    lessons: [
      { t: 'Atom economy', b: `
<div class="eq">atom economy = M(desired product) ÷ Σ M(reactants) × 100%</div>
<p>Additions and rearrangements are 100% atom-economical; substitutions and eliminations always make by-products. The <b>12 Principles of Green Chemistry</b> (Anastas & Warner, 1998) include: prevent waste, prefer catalysts to stoichiometric reagents, use safer solvents.</p>` },
      { t: 'Boots vs BHC ibuprofen', b: `
<p>The original Boots route (1960s) took <b>six steps</b> with ~40% atom economy. The BHC route (1990s) takes <b>three catalytic steps</b>:</p>
<ol><li>Friedel–Crafts acylation with recyclable HF</li><li>Hydrogenation, H₂ / Raney nickel</li><li>Pd-catalysed carbonylation with CO</li></ol>
<p>Atom economy ~77% (≈99% counting the recovered acetic acid). It won the 1997 Presidential Green Chemistry Challenge Award.</p>` },
      { t: 'Gases under pressure', b: `
<p>Hydrogenation and carbonylation use gases. By <b>Henry's law</b>, more pressure means more gas dissolved in the liquid, so the reaction goes faster. Industry uses steel autoclaves (Parr reactors) for this.</p>` },
    ],
    quiz: [
      { q: 'Atom economy of an addition reaction?', o: ['50%', '77%', '100%', 'It depends on yield'], a: 2, e: 'All reactant atoms end up in the product.' },
      { q: 'How many steps in the BHC ibuprofen synthesis?', o: ['2', '3', '6', '10'], a: 1, e: 'Acylation, hydrogenation, carbonylation.' },
      { q: 'Catalyst for the BHC hydrogenation step?', o: ['AlCl₃', 'Raney nickel', 'H₂SO₄', 'Iodine'], a: 1, e: 'Porous nickel catalyses H₂ addition.' },
      { q: 'Why run hydrogenations under pressure?', o: ['To raise the boiling point', 'More dissolved H₂ (Henry\'s law)', 'To stop side reactions', 'To cool the reaction'], a: 1, e: 'Concentration of gas in solution scales with pressure.' },
      { q: "Why are catalysts 'green'?", o: ["They are not used up, so less waste and lower energy", "They raise yields above 100%", "They replace all solvents", "They are always non-toxic"], a: 0, e: "Catalysis is principle 9 of the 12 Principles of Green Chemistry." },
      { q: "A + B → C + D, with M(C) = 60 and M(D) = 40. Atom economy for C?", o: ["150%", "60%", "100%", "40%"], a: 1, e: "60 ÷ (60 + 40) × 100." },
      { q: "Which is the greenest solvent?", o: ["water", "tetrachloromethane", "dichloromethane", "benzene"], a: 0, e: "Non-toxic, non-flammable, cheap." },
      { q: "Hydrogenating an alkene has an atom economy of…", o: ["100%", "50%", "it depends on the yield", "0%"], a: 0, e: "Addition: every atom ends up in the product." },
    ],
  },
  {
    id: 'polymers', name: 'Polymer Chemistry', icon: '🧵', reward: 1200, req: 'azo',
    desc: 'Chain-growth vs step-growth; nylon.',
    lessons: [
      { t: 'Chain vs step growth', b: `
<p><b>Addition (chain-growth)</b> polymers like polyethene grow by adding monomers to a reactive chain end. <b>Condensation (step-growth)</b> polymers like polyesters and polyamides form as monomers join and release a small molecule (H₂O or HCl).</p>
[[fig:chainstep]]` },
      { t: 'Nylon-6,6', b: `
<div class="eq">n H₂N(CH₂)₆NH₂ + n ClCO(CH₂)₄COCl → [–NH(CH₂)₆NH–CO(CH₂)₄CO–]ₙ + 2n HCl</div>
<p>"6,6" counts the <b>carbons in each monomer</b>. Wallace Carothers made it at DuPont in 1935. In the classic "nylon rope trick", the diamine (with NaOH to neutralise HCl) is in water and the diacid chloride in hexane; nylon forms at the interface.</p>` },
      { t: 'Why nylon is strong', b: `
<p>Amide groups on neighbouring chains <b>hydrogen-bond</b> to each other, making nylon tough with a high melting point. Kevlar is an aromatic polyamide with even stronger, more ordered interactions.</p>` },
    ],
    quiz: [
      { q: 'Small molecule lost making nylon from adipoyl chloride?', o: ['H₂O', 'HCl', 'CO₂', 'NH₃'], a: 1, e: 'Amine + acid chloride → amide + HCl.' },
      { q: 'What does "6,6" mean in nylon-6,6?', o: ['6 repeat units', 'Carbons in each monomer', '6% water', 'Melting point 66 °C'], a: 1, e: 'Six carbons in the diamine and six in the diacid.' },
      { q: 'Why add NaOH to the aqueous layer?', o: ['To neutralise HCl', 'As a catalyst', 'To dissolve hexane', 'To colour the nylon'], a: 0, e: 'Otherwise HCl protonates the amine and stops polymerisation.' },
      { q: 'Polyethene is made by…', o: ['condensation', 'addition (chain growth)', 'saponification', 'Diels–Alder'], a: 1, e: 'Ethene monomers add to a growing chain.' },
      { q: "The repeat unit of PVC is…", o: ["–CH₂–CH₂–", "–CF₂–CF₂–", "–CH₂–CH(CH₃)–", "–CH₂–CHCl–"], a: 3, e: "Poly(chloroethene)." },
      { q: "Which polymer is biodegradable?", o: ["PVC", "polystyrene", "poly(ethene)", "PLA, poly(lactic acid)"], a: 3, e: "Its ester bonds can be hydrolysed; addition polymers' C–C backbones cannot.", fig: "[[fig:chainstep]]" },
      { q: "A polyester is made from…", o: ["an amine and an alkene", "a diol and a dicarboxylic acid", "a diamine and a diol", "two alkenes"], a: 1, e: "Condensation polymerisation losing water." },
      { q: "Why is Kevlar so strong?", o: ["It is cross-linked by sulfur", "It is ionic", "It contains metal atoms", "Rigid aromatic chains line up and hydrogen-bond"], a: 3, e: "Aligned chains + inter-chain H-bonds." },
    ],
  },
  {
    id: 'xcoupling', name: 'Pd Cross-Coupling', icon: '💎', reward: 2250, req: 'organomet',
    desc: 'The Suzuki reaction and liquid crystals.',
    lessons: [
      { t: 'The catalytic cycle', b: `
<ol><li><b>Oxidative addition</b>: Pd(0) inserts into Ar–X → Ar–Pd(II)–X</li><li><b>Transmetalation</b>: the aryl group from boron moves to Pd → Ar–Pd–Ar′</li><li><b>Reductive elimination</b>: Ar–Ar′ is released and Pd(0) is regenerated</li></ol>
<p>Heck, Negishi and Suzuki shared the 2010 Nobel Prize for palladium-catalysed cross-couplings.</p>
[[fig:suzuki]]` },
      { t: 'Suzuki practicalities', b: `
<p>Boronic acids are stable to air and water and have low toxicity. A <b>base</b> (e.g. K₂CO₃) is required to activate boron as a boronate for transmetalation. Pd(0) catalysts and their phosphine ligands are oxidised by O₂, so reactions are degassed and run under <b>N₂</b>.</p>
<p>Aryl halide reactivity: Ar–I &gt; Ar–Br &gt; Ar–Cl. Typical catalyst loading: 1–5 mol%.</p>` },
      { t: 'Liquid crystals', b: `
<p><b>5CB</b> (4-cyano-4′-pentylbiphenyl), made by George Gray's group in 1972, was the first stable room-temperature nematic liquid crystal. Its rigid rod-like biphenyl core, polar nitrile and flexible tail let the molecules line up — and re-align in an electric field. Hello, LCD screens.</p>` },
    ],
    quiz: [
      { q: 'The first step of the Suzuki catalytic cycle?', o: ['Reductive elimination', 'Transmetalation', 'Oxidative addition', 'β-Hydride elimination'], a: 2, e: 'Pd(0) inserts into the C–X bond.' },
      { q: 'The role of K₂CO₃?', o: ['Solvent', 'Activates the boronic acid for transmetalation', 'Oxidises Pd', 'Drying agent'], a: 1, e: 'It forms a more nucleophilic boronate.' },
      { q: 'Why run Suzuki couplings under N₂?', o: ['N₂ is a reagent', 'O₂ oxidises the Pd(0) catalyst and phosphines', 'To cool the reaction', 'To raise the pressure'], a: 1, e: 'Dead catalyst, no cycle.' },
      { q: 'The most reactive aryl halide for oxidative addition?', o: ['Ar–F', 'Ar–Cl', 'Ar–Br', 'Ar–I'], a: 3, e: 'The weakest C–X bond breaks easiest.' },
      { q: "A catalyst loading of 2 mol% means…", o: ["a 2% yield", "2 mol of Pd", "0.02 mol Pd per mol of substrate", "2 g of Pd"], a: 2, e: "mol% = moles of catalyst per 100 mol of limiting reagent." },
      { q: "The Heck reaction couples an aryl halide with…", o: ["a boronic acid", "CO₂", "an alkene", "a Grignard reagent"], a: 2, e: "Pd(0), base, alkene → substituted alkene." },
      { q: "The Sonogashira coupling joins an aryl halide and…", o: ["a terminal alkyne, with Pd and Cu catalysts", "an alkene", "CO₂", "an alcohol"], a: 0, e: "Copper forms the acetylide that transmetalates to Pd." },
      { q: "Which step of the cycle forms the new C–C bond?", o: ["ligand exchange", "reductive elimination", "transmetalation", "oxidative addition"], a: 1, e: "Ar and Ar′ leave Pd together as Ar–Ar′.", fig: "[[fig:suzuki]]" },
    ],
  },
];

CC.COURSE = {};
for (const c of CC.COURSES) CC.COURSE[c.id] = c;
