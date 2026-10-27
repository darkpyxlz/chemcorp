var CC = (globalThis.CC = globalThis.CC || {});

// The Academy: short lessons + a quiz per course. Passing a quiz (≥75%) awards RP and
// unlocks research that lists the course as a requirement. Passed courses also feed
// the repeatable Pop Quiz.
CC.COURSES = [
  {
    id: 'lab_basics', name: 'Lab Fundamentals', icon: '🥽', reward: 10,
    desc: 'Glassware, moles, limiting reagents and yield.',
    lessons: [
      { t: 'Welcome to the bench', b: `
<p>Most organic reactions happen in a <b>round-bottom flask</b>. To run them hot without boiling the solvent away, chemists fit a <b>reflux condenser</b>: vapour rises, is cooled by water flowing through the jacket, condenses and drips back. The reaction then sits at the solvent's boiling point.</p>
<p>Temperature matters a lot. A common rule of thumb: <b>rate roughly doubles for every 10 °C rise</b>. Too cold and nothing happens; too hot and side reactions or decomposition take over.</p>
<p>In ChemCorp, your bath has a <b>setpoint</b>. The flask drifts towards it — and exothermic reactions push it higher, so watch the thermometer and adjust!</p>` },
      { t: 'Moles & stoichiometry', b: `
<p>A <b>mole</b> is 6.022 × 10²³ particles. A balanced equation tells you the <b>mole ratio</b> in which things react:</p>
<div class="eq">2 C₆H₅CHO + (CH₃)₂CO → dibenzalacetone + 2 H₂O</div>
<p>Two benzaldehyde for every acetone. These ratios are often given as <b>equivalents (eq)</b>, relative to the main starting material.</p>
<p>In the Lab you choose how many equivalents of each reagent go into the vessel — match the balanced equation!</p>` },
      { t: 'Limiting reagent & yield', b: `
<p>The <b>limiting reagent</b> is the one that runs out first; it caps how much product can form (the <b>theoretical yield</b>). Anything left of the other reagents is <b>excess</b> — wasted money.</p>
<div class="eq">% yield = actual ÷ theoretical × 100</div>
<p>A <b>catalyst</b> speeds a reaction up without being consumed, so you only need a little — often quoted in <b>mol%</b> (5 mol% = 0.05 eq).</p>` },
    ],
    quiz: [
      { q: 'What does a reflux condenser let you do?', o: ['Cool the reaction to 0 °C', 'Heat at the solvent\'s boiling point without losing solvent', 'Remove water from the reaction', 'Run the reaction under pressure'], a: 1, e: 'Vapour condenses in the cooled jacket and drips back into the flask.' },
      { q: '2 PhCHO + 1 acetone → product. You add 1 eq of each. Which reagent is limiting?', o: ['Acetone', 'Benzaldehyde', 'Neither', 'The catalyst'], a: 1, e: '1 eq benzaldehyde can only consume 0.5 eq acetone, so benzaldehyde runs out first.' },
      { q: 'Theoretical yield 2.0 mol; you isolate 1.5 mol. Percent yield?', o: ['50%', '67%', '75%', '133%'], a: 2, e: '1.5 ÷ 2.0 = 0.75 → 75%.' },
      { q: 'A catalyst…', o: ['is consumed to drive the reaction', 'shifts the equilibrium towards products', 'speeds up the reaction without being consumed', 'raises the yield above 100%'], a: 2, e: 'Catalysts lower the activation energy; they don\'t change the equilibrium position.' },
    ],
  },
  {
    id: 'halo', name: 'Alkanes, Haloalkanes & Alcohols', icon: '⛓️', reward: 15, req: 'lab_basics',
    desc: 'Free radicals, substitution vs elimination, oxidation and the classic pathways.',
    lessons: [
      { t: 'Free-radical substitution', b: `
<p>Alkanes are unreactive, but UV light splits halogen molecules into <b>radicals</b> (species with an unpaired electron):</p>
<div class="eq">Initiation: Br₂ → 2 Br•<br>Propagation: Br• + CH₄ → HBr + •CH₃ ; •CH₃ + Br₂ → CH₃Br + Br•<br>Termination: Br• + Br• → Br₂ ; •CH₃ + Br• → CH₃Br ; 2 •CH₃ → C₂H₆</div>
<p>Each propagation step makes a new radical, so one photon can start a long <b>chain reaction</b>. Radical stability is <b>tertiary &gt; secondary &gt; primary</b>, and bromine is very selective for the most stable radical. Downsides: mixtures and further substitution (CH₂Br₂, CHBr₃…).</p>` },
      { t: 'Haloalkanes: substitution or elimination?', b: `
<p>The C–X bond is polar (C<sup>δ+</sup>), so nucleophiles attack the carbon. The conditions decide what happens:</p>
<ul><li><b>NaOH(aq)</b>, heat under reflux → <b>alcohol</b> (OH⁻ acts as a nucleophile)</li>
<li><b>KOH in ethanol</b>, heat → <b>alkene</b> (OH⁻ acts as a base and removes a β-H)</li>
<li><b>KCN in ethanol</b>, heat → <b>nitrile</b> (adds one carbon to the chain)</li>
<li><b>excess NH₃ in ethanol</b>, heat in a sealed tube → <b>amine</b></li></ul>
<p>Bond strength sets the rate: C–I is the weakest, so iodoalkanes react fastest; C–F barely reacts.</p>` },
      { t: 'Alkenes: electrophilic addition', b: `
<p>The C=C π bond is electron-rich and attacks electrophiles:</p>
<ul><li><b>HBr</b> → bromoalkane (Markovnikov: H goes to the carbon that already has more H)</li>
<li><b>Br₂</b> → 1,2-dibromoalkane — the test for C=C: <b>orange bromine water decolourises</b></li>
<li><b>steam, H₃PO₄, 300 °C, 60 atm</b> → alcohol (industrial ethanol)</li>
<li><b>H₂, Ni, 150 °C</b> → alkane</li></ul>
<p>The reverse of hydration is dehydration: alcohol + excess conc. H₂SO₄ at 170 °C → alkene.</p>` },
      { t: 'Alcohols, carbonyls & nitriles', b: `
<p>Acidified <b>K₂Cr₂O₇</b> (orange → green) oxidises alcohols:</p>
<ul><li>1° alcohol → <b>aldehyde</b> if you <b>distil it out immediately</b>; → <b>carboxylic acid</b> if you <b>heat under reflux</b></li>
<li>2° alcohol → <b>ketone</b></li><li>3° alcohol → no reaction</li></ul>
<p>Tests: <b>2,4-DNPH</b> gives an orange precipitate with any C=O; <b>Tollens' reagent</b> gives a silver mirror only with aldehydes; <b>I₂/NaOH</b> gives yellow CHI₃ with CH₃CO– or CH₃CH(OH)– groups.</p>
<p>HCN adds to C=O (nucleophilic addition) → <b>hydroxynitrile</b>. Nitriles hydrolyse (acid, reflux) to <b>carboxylic acids</b>, or are reduced (LiAlH₄) to <b>amines</b>.</p>` },
    ],
    quiz: [
      { q: 'What does UV light do in free-radical substitution?', o: ['Breaks C–H bonds heterolytically', 'Splits Br₂ into two Br• radicals', 'Acts as a catalyst for addition', 'Ionises the alkane'], a: 1, e: 'Homolytic fission of the weak Br–Br bond starts the chain (initiation).' },
      { q: 'Bromoethane + KOH dissolved in ethanol, heated. Main product?', o: ['Ethanol', 'Ethene', 'Ethylamine', 'Propanenitrile'], a: 1, e: 'In ethanol, OH⁻ acts as a base: elimination.' },
      { q: 'Which reagent lengthens a carbon chain by one carbon?', o: ['NaOH(aq)', 'NH₃', 'KCN', 'HBr'], a: 2, e: 'CN⁻ adds a carbon: R–Br → R–CN.' },
      { q: 'To make ethanal (not ethanoic acid) from ethanol with acidified dichromate you should…', o: ['heat under reflux for a long time', 'distil the product out as it forms', 'add excess dichromate', 'use concentrated NaOH'], a: 1, e: 'Distillation removes the volatile aldehyde before it is oxidised further.' },
      { q: 'Which compound gives a yellow precipitate with I₂ and NaOH?', o: ['Methanol', 'Propan-2-ol', 'Propan-1-ol', 'Methanal'], a: 1, e: 'Propan-2-ol has the CH₃CH(OH)– group.' },
    ],
  },
  {
    id: 'acids_bases', name: 'Organic Acids & Bases', icon: '⚗️', reward: 10, req: 'lab_basics',
    desc: 'Carboxylic acids, pKa and soap-making.',
    lessons: [
      { t: 'Carboxylic acids', b: `
<p>A <b>Brønsted acid</b> donates H⁺; a <b>base</b> accepts it. The –COOH group of a carboxylic acid gives up its proton to hydroxide, forming a water-soluble <b>carboxylate salt</b>:</p>
<div class="eq">CH₃COOH + NaOH → CH₃COO⁻Na⁺ + H₂O</div>
<p>The carboxylate is stabilised by <b>resonance</b>: the negative charge is shared equally between both oxygens. That's why carboxylic acids (pKa ≈ 5) are far more acidic than alcohols (pKa ≈ 16).</p>` },
      { t: 'pH and pKa', b: `
<p><b>pH = −log[H⁺]</b>. Strong acids dissociate completely; weak acids only partly. Acid strength is measured by <b>pKa</b> — the <i>lower</i> the pKa, the <i>stronger</i> the acid.</p>
<ul><li>HCl ≈ −6 (very strong)</li><li>acetic acid 4.76</li><li>phenol ≈ 10</li><li>water 15.7, ethanol ≈ 16</li><li>C–H next to a ketone ≈ 19–20</li></ul>
<p>A base can deprotonate an acid whose pKa is lower than its own conjugate acid's.</p>` },
      { t: 'Saponification', b: `
<p>Fats and oils are <b>triglycerides</b>: three fatty acids joined to glycerol by ester bonds. Hot NaOH hydrolyses all three:</p>
<div class="eq">triglyceride + 3 NaOH → 3 RCOO⁻Na⁺ (soap) + glycerol</div>
<p>This is irreversible — the carboxylate can't be attacked by an alcohol. Soap molecules have a polar, water-loving head and a long greasy tail; they form <b>micelles</b> around oil droplets so water can wash them away.</p>` },
    ],
    quiz: [
      { q: 'Products of CH₃COOH + NaOH?', o: ['CH₃CH₂OH + NaO', 'CH₃COO⁻Na⁺ + H₂O', 'CH₃COONa + H₂', 'No reaction'], a: 1, e: 'Acid + base → carboxylate salt + water.' },
      { q: 'Which is the strongest acid (lowest pKa)?', o: ['Ethanol', 'Phenol', 'Acetic acid', 'HCl'], a: 3, e: 'HCl ≈ −6, acetic 4.76, phenol ≈ 10, ethanol ≈ 16.' },
      { q: 'How many NaOH are needed to fully saponify one triglyceride?', o: ['1', '2', '3', '6'], a: 2, e: 'One per ester group — a triglyceride has three.' },
      { q: 'Why does soap remove grease?', o: ['It oxidises the grease', 'It has a polar head and nonpolar tail that form micelles', 'It is a strong acid', 'It evaporates the grease'], a: 1, e: 'Tails dissolve in the grease, heads face the water.' },
    ],
  },
  {
    id: 'carbonyl', name: 'Carbonyls & Esters', icon: '🍌', reward: 15, req: 'lab_basics',
    desc: 'The C=O group, Fischer esterification and Le Chatelier.',
    lessons: [
      { t: 'The carbonyl group', b: `
<p>The C=O bond is polarised: oxygen is δ−, carbon is δ+. That makes the carbon <b>electrophilic</b> — nucleophiles attack it.</p>
<p>The carbonyl family: aldehydes, ketones, carboxylic acids, esters, amides, anhydrides and acid chlorides. Much of organic chemistry is "what attacks the C=O, and what leaves afterwards".</p>` },
      { t: 'Fischer esterification', b: `
<div class="eq">RCOOH + R′OH ⇌ RCOOR′ + H₂O &nbsp; (H₂SO₄ cat.)</div>
<p>Mechanism: the acid catalyst protonates the C=O, making the carbon much more electrophilic → the alcohol attacks → a tetrahedral intermediate forms → proton shuffles turn an –OH into –OH₂⁺ → water leaves → deprotonation gives the ester.</p>
<p>Every step is reversible. For acetic acid + ethanol, K ≈ 4, which caps the yield at about <b>67%</b> with a 1:1 ratio.</p>` },
      { t: 'Le Chatelier to the rescue', b: `
<p>To push an equilibrium to the right, either add excess of a reactant or <b>remove a product</b>. In esterifications, removing water works beautifully — a <b>Dean–Stark trap</b> collects it as it distils.</p>
<p>Esters smell great: ethyl acetate (nail-polish remover), isoamyl acetate (banana), methyl salicylate (wintergreen), ethyl butanoate (pineapple).</p>` },
    ],
    quiz: [
      { q: 'In a C=O group, which atom is attacked by nucleophiles?', o: ['Oxygen', 'Carbon', 'Hydrogen', 'Neither'], a: 1, e: 'Carbon carries the δ+ charge.' },
      { q: 'The role of H₂SO₄ in Fischer esterification?', o: ['Solvent', 'Reducing agent', 'Catalyst that protonates the carbonyl', 'It becomes part of the ester'], a: 2, e: 'Protonation makes the carbonyl carbon much more electrophilic.' },
      { q: 'With 1:1 acid:alcohol and K ≈ 4, the maximum yield is about…', o: ['25%', '50%', '67%', '100%'], a: 2, e: 'Solve K = x²/(1−x)² = 4 → x = 2/3.' },
      { q: 'A Dean–Stark trap increases ester yield by…', o: ['adding more catalyst', 'removing water, shifting the equilibrium', 'cooling the reaction', 'adding pressure'], a: 1, e: 'Le Chatelier: remove a product and the equilibrium makes more.' },
    ],
  },
  {
    id: 'acylation', name: 'Acylation & Aspirin', icon: '💊', reward: 25, req: 'carbonyl',
    desc: 'Reactive acyl compounds, aspirin and amine selectivity.',
    lessons: [
      { t: 'Reactivity of acyl compounds', b: `
<p>Carboxylic acid derivatives differ in how good their <b>leaving group</b> is:</p>
<div class="eq">acid chloride &gt; anhydride &gt; ester ≈ acid &gt; amide</div>
<p>Cl⁻ and RCOO⁻ are stable, weakly basic anions — they leave easily. That's why anhydrides acylate alcohols, phenols and amines readily, while amides are very stable (good news for proteins!).</p>` },
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
    ],
  },
  {
    id: 'subst', name: 'Substitution & Elimination', icon: '🔄', reward: 40, req: 'carbonyl',
    desc: 'SN1, SN2, Williamson ether synthesis and E1.',
    lessons: [
      { t: 'SN2', b: `
<p>One concerted step: the nucleophile attacks from the <b>back side</b> as the leaving group departs, inverting the stereocentre. Rate = k[Nu][R–X].</p>
<p>Best for methyl and <b>primary</b> substrates; bulky groups block the back side. Polar aprotic solvents speed it up.</p>
<div class="eq">CH₃(CH₂)₃OH + HBr → CH₃(CH₂)₃Br + H₂O</div>
<p>Here H₂SO₄ + NaBr generate HBr; protonating the –OH turns it into water, a good leaving group.</p>` },
      { t: 'SN1', b: `
<p>Two steps: the leaving group departs to form a <b>carbocation</b>, then the nucleophile adds. Rate = k[R–X] only.</p>
<p>Carbocation stability rules: <b>tertiary &gt; secondary ≫ primary</b>. tert-Butanol + conc. HCl gives tert-butyl chloride within minutes at room temperature.</p>` },
      { t: 'Williamson ether synthesis', b: `
<p>Deprotonate an alcohol or phenol to an alkoxide/phenoxide, then let it do SN2 on an alkyl halide:</p>
<div class="eq">ArO⁻ + R–Br → Ar–O–R + Br⁻</div>
<p>2-Naphthol (pKa ≈ 9.5) is acidic enough for NaOH. Use a <b>primary</b> halide — with a tertiary one the alkoxide acts as a base and you get elimination instead.</p>` },
      { t: 'E1 dehydration', b: `
<p>Heat an alcohol with strong acid: the –OH is protonated, water leaves to give a carbocation, and loss of a neighbouring H⁺ gives an <b>alkene</b>.</p>
<p>Distilling the alkene out as it forms pulls the equilibrium over (Le Chatelier). <b>Zaitsev's rule</b>: the more substituted alkene usually wins. H₃PO₄ is preferred over H₂SO₄ because it doesn't oxidise or char the organics.</p>` },
    ],
    quiz: [
      { q: 'Which substrate reacts fastest by SN1?', o: ['Bromomethane', '1-Bromobutane', '2-Bromobutane', 'tert-Butyl bromide'], a: 3, e: 'It forms the most stable (tertiary) carbocation.' },
      { q: 'The SN2 rate depends on…', o: ['only the substrate', 'only the nucleophile', 'both nucleophile and substrate', 'neither'], a: 2, e: 'Both are in the single, rate-determining step.' },
      { q: 'Best alkyl halide for a Williamson ether synthesis?', o: ['Primary', 'Secondary', 'Tertiary', 'Aryl'], a: 0, e: 'SN2 needs an unhindered carbon; tertiary halides eliminate.' },
      { q: 'Why distil cyclohexene out as it forms?', o: ['It is toxic', 'It removes product, shifting the equilibrium forward', 'To cool the flask', 'To recover the catalyst'], a: 1, e: 'Le Chatelier again.' },
    ],
  },
  {
    id: 'redox', name: 'Redox: Oxidation & Reduction', icon: '🔋', reward: 60, req: 'acylation',
    desc: 'Oxidation levels, bleach oxidation, NaBH₄ and LiAlH₄.',
    lessons: [
      { t: 'Oxidation levels', b: `
<p>Carbon can be climbed up and down an oxidation ladder:</p>
<div class="eq">alkane → alcohol → aldehyde/ketone → carboxylic acid → CO₂</div>
<p>Going down (reduction) adds hydrogen. In the lab, the go-to sources of hydride (H⁻) are <b>NaBH₄</b> and <b>LiAlH₄</b>.</p>
<p>Going up (oxidation): <b>secondary alcohols → ketones</b>; primary alcohols → aldehydes → carboxylic acids; tertiary alcohols resist oxidation. Household bleach (NaOCl) in acetic acid forms HOCl, a cheap, green oxidant that turns cyclohexanol into cyclohexanone.</p>` },
      { t: 'Sodium borohydride', b: `
<p>NaBH₄ is mild and selective: it reduces <b>aldehydes and ketones</b> but generally leaves esters, acids and amides alone. It tolerates methanol, ethanol, even water.</p>
<p>Each BH₄⁻ can deliver up to <b>four</b> hydrides, so 0.25 eq is the theoretical minimum.</p>
<div class="eq">Ph₂C=O → Ph₂CH–OH &nbsp; (benzophenone → diphenylmethanol)</div>` },
      { t: 'LiAlH₄ vs NaBH₄', b: `
<p>LiAlH₄ is far more powerful — it also reduces esters, acids and amides — but it reacts violently with water and alcohols, so it needs dry ether or THF. The Al–H bond is more polar (Al is less electronegative than B), making the hydride more reactive.</p>` },
    ],
    quiz: [
      { q: 'NaBH₄ reduces a ketone to…', o: ['an aldehyde', 'a primary alcohol', 'a secondary alcohol', 'an alkane'], a: 2, e: 'R₂C=O + H⁻ → R₂CH–O⁻ → R₂CH–OH.' },
      { q: 'Maximum hydrides delivered by one BH₄⁻?', o: ['1', '2', '3', '4'], a: 3, e: 'Four B–H bonds.' },
      { q: 'Which solvent is fine for NaBH₄ but NOT for LiAlH₄?', o: ['THF', 'Diethyl ether', 'Methanol', 'Toluene'], a: 2, e: 'LiAlH₄ reacts violently with protic solvents.' },
      { q: 'Benzophenone + NaBH₄ gives…', o: ['benzoic acid', 'diphenylmethanol', 'triphenylmethanol', 'benzene'], a: 1, e: 'Ketone → secondary alcohol.' },
    ],
  },
  {
    id: 'organomet', name: 'Organometallics: Grignard', icon: '🧲', reward: 120, req: 'redox',
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
<div class="eq">PhMgBr + Ph₂C=O → Ph₃C–OH</div>` },
    ],
    quiz: [
      { q: 'Why must Grignard reactions be anhydrous?', o: ['Water oxidises Mg', 'Water protonates and destroys the Grignard reagent', 'Water freezes', 'Water is too polar'], a: 1, e: 'The carbanion-like carbon grabs H⁺ from water.' },
      { q: 'What does the iodine crystal do?', o: ['Catalyses C–C bond formation', 'Activates the Mg surface to start the reaction', 'Dries the solvent', 'Acts as the electrophile'], a: 1, e: 'It cleans off the passivating oxide.' },
      { q: 'Grignard + ketone (then workup) gives…', o: ['a primary alcohol', 'a secondary alcohol', 'a tertiary alcohol', 'a carboxylic acid'], a: 2, e: 'The carbonyl carbon ends up with three carbon groups.' },
      { q: 'A suitable Grignard solvent?', o: ['Water', 'Methanol', 'Diethyl ether', 'Acetic acid'], a: 2, e: 'Aprotic and Mg-coordinating.' },
    ],
  },
  {
    id: 'enolate', name: 'Enolates & Aldol', icon: '🌞', reward: 100, req: 'redox',
    desc: 'α-Acidity and the aldol condensation.',
    lessons: [
      { t: 'α-Hydrogens', b: `
<p>Hydrogens on the carbon next to a C=O (the α-carbon) are surprisingly acidic — acetone's pKa is about <b>19–20</b> — because the resulting <b>enolate</b> spreads its negative charge onto oxygen by resonance.</p>
<p>Hydroxide can't fully deprotonate acetone, but it makes enough enolate to react.</p>` },
      { t: 'The aldol reaction', b: `
<p>An enolate (nucleophile) attacks another carbonyl (electrophile) to form a β-hydroxy carbonyl — an "aldol". With heat or extra conjugation it loses water to give an <b>α,β-unsaturated carbonyl</b>: the aldol <i>condensation</i>.</p>` },
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
    ],
  },
  {
    id: 'pericyclic', name: 'Pericyclic: Diels–Alder', icon: '💍', reward: 120, req: 'subst',
    desc: 'The [4+2] cycloaddition.',
    lessons: [
      { t: '[4+2] cycloaddition', b: `
<p>A conjugated <b>diene</b> (4 π electrons) and a <b>dienophile</b> (2 π electrons) combine to form a cyclohexene ring, making <b>two new σ bonds</b> in a single concerted step — no intermediates.</p>
<p>Otto Diels and Kurt Alder won the 1950 Nobel Prize for it.</p>` },
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
    ],
  },
  {
    id: 'aromatic', name: 'Aromatic Substitution', icon: '⬡', reward: 250, req: 'enolate',
    desc: 'Aromaticity, nitration and Friedel–Crafts.',
    lessons: [
      { t: 'Aromaticity & EAS', b: `
<p>Benzene's 6 π electrons (Hückel's 4n+2 rule) make it unusually stable, so it does <b>substitution</b> rather than addition. In electrophilic aromatic substitution, an electrophile attacks the ring to give a <b>σ-complex</b> (arenium ion), and loss of H⁺ restores aromaticity.</p>` },
      { t: 'Nitration', b: `
<div class="eq">HNO₃ + 2 H₂SO₄ → NO₂⁺ + H₃O⁺ + 2 HSO₄⁻</div>
<p>The <b>nitronium ion</b> is the electrophile. Nitration is very exothermic: keep it at 0–15 °C to avoid dinitration and runaway reactions.</p>
<p><b>Directing effects</b>: electron-withdrawing groups like the ester in methyl benzoate are <b>meta</b> directors → methyl 3-nitrobenzoate.</p>` },
      { t: 'Friedel–Crafts acylation', b: `
<p>AlCl₃ pulls the leaving group off an acid chloride or anhydride, forming an <b>acylium ion</b> R–C≡O⁺. The product ketone complexes AlCl₃, so you need <b>at least one equivalent</b> (more with anhydrides). Everything must be dry.</p>
<p>Anisole's –OCH₃ is an <b>activating ortho/para director</b>; sterics favour para. Unlike alkylation, acylation doesn't over-react, because the ketone deactivates the ring.</p>` },
    ],
    quiz: [
      { q: 'The electrophile in nitration is…', o: ['NO₃⁻', 'NO₂⁺', 'HNO₂', 'NO'], a: 1, e: 'The nitronium ion, made by H₂SO₄ protonating HNO₃.' },
      { q: 'An ester group on benzene directs incoming electrophiles…', o: ['ortho/para', 'meta', 'ipso', 'nowhere'], a: 1, e: 'Electron-withdrawing → meta.' },
      { q: 'Why is ≥1 eq AlCl₃ needed in Friedel–Crafts acylation?', o: ['It is the solvent', 'The ketone product complexes AlCl₃', 'It is reduced', 'To dry the reaction'], a: 1, e: 'The Lewis basic C=O of the product ties it up.' },
      { q: 'An –OCH₃ substituent is…', o: ['deactivating, meta', 'activating, ortho/para', 'deactivating, ortho/para', 'activating, meta'], a: 1, e: 'Its lone pairs donate into the ring.' },
    ],
  },
  {
    id: 'azo', name: 'Diazonium Salts & Azo Dyes', icon: '🎨', reward: 400, req: 'aromatic',
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
    ],
  },
  {
    id: 'medchem', name: 'Medicinal Chemistry', icon: '⚕️', reward: 400, req: 'aromatic',
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
    ],
  },
  {
    id: 'green', name: 'Green & Industrial Chemistry', icon: '🌱', reward: 800, req: 'medchem',
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
    ],
  },
  {
    id: 'polymers', name: 'Polymer Chemistry', icon: '🧵', reward: 800, req: 'azo',
    desc: 'Chain-growth vs step-growth; nylon.',
    lessons: [
      { t: 'Chain vs step growth', b: `
<p><b>Addition (chain-growth)</b> polymers like polyethene grow by adding monomers to a reactive chain end. <b>Condensation (step-growth)</b> polymers like polyesters and polyamides form as monomers join and release a small molecule (H₂O or HCl).</p>` },
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
    ],
  },
  {
    id: 'xcoupling', name: 'Pd Cross-Coupling', icon: '💎', reward: 1500, req: 'organomet',
    desc: 'The Suzuki reaction and liquid crystals.',
    lessons: [
      { t: 'The catalytic cycle', b: `
<ol><li><b>Oxidative addition</b>: Pd(0) inserts into Ar–X → Ar–Pd(II)–X</li><li><b>Transmetalation</b>: the aryl group from boron moves to Pd → Ar–Pd–Ar′</li><li><b>Reductive elimination</b>: Ar–Ar′ is released and Pd(0) is regenerated</li></ol>
<p>Heck, Negishi and Suzuki shared the 2010 Nobel Prize for palladium-catalysed cross-couplings.</p>` },
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
    ],
  },
];

CC.COURSE = {};
for (const c of CC.COURSES) CC.COURSE[c.id] = c;
