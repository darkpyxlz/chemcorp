var CC = (globalThis.CC = globalThis.CC || {});

// Reactions. A run in the Lab matches a recipe by its exact set of reagents; everything
// else (solvent, additive, atmosphere, temperature, stoichiometry) only changes the yield.
//
//   reagents   {id: equivalents}          products {id: mol per batch}
//   solvents   acceptable solvents ('none' = neat). Others give ×0.4 unless listed in solventFx.
//   solventFx  {id: [factor, why]}         fatalSolvent {id: why}  (yield 0)
//   additive   {id, amt, missing?, why?}   amt = mol per batch; missing = factor without it (default 0.15)
//   alt        {additiveId: [factor, why]} acceptable substitutes
//   atm        required atmosphere ('n2' | 'h2' | 'co'); atmFx {atm: [factor, why]}
//   temp       [lo, hi] °C window; strict = narrow tolerance; exo = self-heating °C/s
//   eqm        equilibrium-limited (Dean–Stark trap helps)
CC.RECIPES = [
  // ───────────── Tier 1 ─────────────
  {
    id: 'sapon', name: 'Saponification', cls: 'Ester hydrolysis', tech: 't_sapon', tier: 1,
    reagents: { veg_oil: 1, naoh: 3 }, products: { soap: 3, glycerol: 1 },
    solvents: ['s_water', 's_etoh'], temp: [60, 100], exo: 0, time: 8, yield: 0.92,
    hint: 'Hydrolyse a fat (triglyceride) with a strong base. Each fat molecule has three ester groups to cleave. Heat in water or ethanol at 60–100 °C.',
    learn: 'Base hydrolysis is irreversible: the carboxylate anion can no longer be attacked by an alcohol. Glycerol is a valuable by-product.',
  },
  {
    id: 'etoac', name: 'Fischer esterification', cls: 'Esterification', tech: 't_basics', tier: 1,
    reagents: { acoh: 1, etoh: 1 }, products: { etoac: 1 },
    solvents: ['none'], solventFx: { s_water: [0.2, 'Adding water pushes the equilibrium backwards (Le Chatelier).'], s_etoh: [0.95, 'Excess ethanol works, but it is wasted as solvent.'] },
    additive: { id: 'a_h2so4', amt: 0.05, why: 'Fischer esterification needs a strong acid catalyst to activate the carbonyl.' },
    alt: { a_h3po4: [0.8, 'H₃PO₄ works but is a weaker catalyst than H₂SO₄.'] },
    temp: [65, 85], exo: 0, time: 8, yield: 0.67, eqm: true,
    hint: 'Fischer esterification: a carboxylic acid + an alcohol with a catalytic strong acid (5 mol%), heated close to the alcohol\'s boiling point (65–85 °C). No solvent.',
    learn: 'Fischer esterification is an equilibrium (K ≈ 4): with 1:1 reagents, yield stalls near 67% unless water is removed.',
  },
  // ───────────── Tier 2 ─────────────
  {
    id: 'isoamyl', name: 'Banana oil esterification', cls: 'Esterification', tech: 't_fischer', tier: 2,
    reagents: { acoh: 1, isoamyl_oh: 1 }, products: { isoamyl_ac: 1 },
    solvents: ['none'], solventFx: { s_water: [0.2, 'Adding water pushes the equilibrium backwards (Le Chatelier).'] },
    additive: { id: 'a_h2so4', amt: 0.05, why: 'Fischer esterification needs a strong acid catalyst.' },
    alt: { a_h3po4: [0.8, 'H₃PO₄ works but is a weaker catalyst than H₂SO₄.'] },
    temp: [110, 145], exo: 0, time: 10, yield: 0.7, eqm: true,
    hint: 'Another Fischer esterification — with isoamyl alcohol (bp 131 °C). Reflux hotter, 110–145 °C: a water bath can\'t get there.',
    learn: 'Isoamyl acetate is the main aroma of bananas — and honeybees release it as an alarm pheromone!',
  },
  {
    id: 'aspirin', name: 'Aspirin synthesis', cls: 'O-Acylation', tech: 't_acyl', tier: 2,
    reagents: { salicylic: 1, ac2o: 1 }, products: { aspirin: 1, acoh: 1 },
    solvents: ['none'], solventFx: { s_water: [0.1, 'Water hydrolyses acetic anhydride to acetic acid before it can react.'] },
    additive: { id: 'a_h3po4', amt: 0.05, missing: 0.4, why: 'Without an acid catalyst the acetylation is slow.' },
    alt: { a_h2so4: [0.95, 'H₂SO₄ works too, but chars the product slightly.'] },
    temp: [75, 95], exo: 1, time: 10, yield: 0.9,
    hint: 'Acetylate the phenol of salicylic acid with an acid anhydride. A few drops of phosphoric acid catalyse it. Warm to 75–95 °C, no solvent.',
    learn: 'Felix Hoffmann at Bayer made pure acetylsalicylic acid in 1897. The by-product acetic acid goes back into your stock.',
  },
  {
    id: 'tbucl', name: 'SN1 chlorination', cls: 'SN1', tech: 't_subst', tier: 2,
    reagents: { tbuoh: 1, hcl: 1 }, products: { tbucl: 1 },
    solvents: ['none', 's_water'], temp: [15, 30], exo: 0, time: 6, yield: 0.88,
    hint: 'SN1: shake a tertiary alcohol with concentrated hydrochloric acid at room temperature. No catalyst required.',
    learn: 'The tertiary carbocation (CH₃)₃C⁺ forms easily — tertiary substrates are SN1 champions.',
  },
  {
    id: 'bubr', name: 'SN2 bromination', cls: 'SN2', tech: 't_subst', tier: 2,
    reagents: { buoh: 1, nabr: 1 }, products: { bubr: 1 },
    solvents: ['s_water'],
    additive: { id: 'a_h2so4', amt: 1, missing: 0.05, why: 'Without strong acid there is no HBr and the –OH can\'t leave.' },
    alt: { a_h3po4: [0.5, 'Phosphoric acid is too weak to generate much HBr.'] },
    temp: [90, 110], exo: 0, time: 10, yield: 0.85,
    hint: 'SN2: turn a primary alcohol into an alkyl bromide using a bromide salt plus a full equivalent of sulfuric acid (makes HBr in situ). Reflux in water, 90–110 °C.',
    learn: 'H₂SO₄ protonates the –OH so it leaves as H₂O, a great leaving group; Br⁻ then attacks from the back side.',
  },
  {
    id: 'acetanilide', name: 'Acetanilide synthesis', cls: 'N-Acylation', tech: 't_acyl', tier: 2,
    reagents: { aniline: 1, ac2o: 1 }, products: { acetanilide: 1, acoh: 1 },
    solvents: ['s_water', 'none'], temp: [20, 50], exo: 2, time: 8, yield: 0.9,
    hint: 'Acylate an aromatic amine with acetic anhydride. Amines are good nucleophiles — no catalyst needed. Water or neat, 20–50 °C.',
    learn: 'Acetanilide (Antifebrin, 1886) was one of the first synthetic painkillers; the body turns it into paracetamol.',
  },
  // ───────────── Tier 3 ─────────────
  {
    id: 'cyclohexanone', name: 'Bleach oxidation', cls: 'Oxidation', tech: 't_reduct', tier: 3,
    reagents: { cyclohexanol: 1, naocl: 1 }, products: { cyclohexanone: 1 },
    solvents: ['s_hoac'], solventFx: { s_water: [0.4, 'Without acetic acid there is little HOCl, the real oxidant.'] },
    temp: [30, 45], exo: 3, time: 10, yield: 0.85,
    hint: 'Oxidise a secondary alcohol to a ketone with household bleach in glacial acetic acid (makes HOCl). Exothermic — hold 30–45 °C.',
    learn: 'Secondary alcohols oxidise to ketones; primary ones go to aldehydes and then acids. Bleach is a greener oxidant than chromium(VI).',
  },
  {
    id: 'nerolin', name: 'Williamson ether synthesis', cls: 'SN2', tech: 't_subst', tier: 3,
    reagents: { naphthol: 1, bubr: 1, naoh: 1 }, products: { nerolin: 1 },
    solvents: ['s_etoh'], solventFx: { s_meoh: [0.8, 'Methanol works but refluxes a little too cool.'] },
    temp: [70, 85], exo: 0, time: 12, yield: 0.82,
    hint: 'Williamson ether synthesis: deprotonate 2-naphthol with a stoichiometric base, then alkylate it with a primary alkyl bromide (make it yourself!). Reflux in ethanol, 70–85 °C.',
    learn: '2-Butoxynaphthalene (nerolin) has a sweet orange-blossom scent and is used in perfumes and soaps.',
  },
  {
    id: 'cyclohexene', name: 'Alcohol dehydration', cls: 'E1', tech: 't_elim', tier: 3,
    reagents: { cyclohexanol: 1 }, products: { cyclohexene: 1 },
    solvents: ['none'],
    additive: { id: 'a_h3po4', amt: 0.3, missing: 0.02, why: 'E1 dehydration needs a strong acid to protonate the –OH.' },
    alt: { a_h2so4: [0.75, 'H₂SO₄ works but oxidises and chars some of the material.'] },
    temp: [130, 170], exo: 0, time: 12, yield: 0.8,
    hint: 'E1 dehydration: heat a secondary alcohol with phosphoric acid (30 mol%) and distil the alkene out as it forms (130–170 °C). No solvent.',
    learn: 'Distilling cyclohexene (bp 83 °C) out of the flask pulls the equilibrium towards the alkene.',
  },
  {
    id: 'benzhydrol', name: 'Borohydride reduction', cls: 'Reduction', tech: 't_reduct', tier: 3,
    reagents: { benzophenone: 1, nabh4: 0.25 }, products: { benzhydrol: 1 },
    solvents: ['s_meoh', 's_etoh'], solventFx: { s_water: [0.5, 'Benzophenone barely dissolves in water.'] },
    temp: [0, 30], exo: 2, time: 10, yield: 0.95,
    hint: 'Reduce a diaryl ketone with a hydride donor in an alcohol solvent, 0–30 °C. One borohydride ion can deliver four hydrides — choose the amount accordingly.',
    learn: 'Only 0.25 eq of NaBH₄ is needed in theory, because each BH₄⁻ carries four hydrides.',
  },
  // ───────────── Tier 4 ─────────────
  {
    id: 'phmgbr', name: 'Grignard formation', cls: 'Organometallic', tech: 't_grignard', tier: 4,
    reagents: { phbr: 1, mg: 1 }, products: { phmgbr: 1 },
    solvents: ['s_et2o', 's_thf'],
    fatalSolvent: { s_water: 'Water protonated the Grignard reagent instantly — you made benzene.', s_meoh: 'Methanol (protic!) protonated the Grignard — you made benzene.', s_etoh: 'Ethanol (protic!) protonated the Grignard — you made benzene.', s_hoac: 'An acid solvent destroyed the Grignard reagent.' },
    additive: { id: 'a_i2', amt: 0.01, missing: 0.6, why: 'Without an iodine crystal the magnesium oxide layer makes initiation sluggish.' },
    atm: 'n2', atmFx: { air: [0, 'Moisture and O₂ from the air destroyed the Grignard reagent.'] },
    temp: [25, 45], exo: 4, time: 12, yield: 0.9,
    hint: 'Grignard formation: an aryl bromide + magnesium metal in a dry ether solvent under nitrogen. A crystal of iodine helps initiate. Gentle reflux, 25–45 °C.',
    learn: 'Mg inserts into the C–Br bond, flipping the carbon from electrophilic to strongly nucleophilic (umpolung).',
  },
  {
    id: 'trityl', name: 'Grignard addition', cls: 'Organometallic', tech: 't_grignard', tier: 4,
    reagents: { phmgbr: 1, benzophenone: 1 }, products: { trityl_oh: 1 },
    solvents: ['s_et2o', 's_thf'],
    fatalSolvent: { s_water: 'Water destroyed the Grignard reagent before it reached the ketone.', s_meoh: 'Methanol protonated the Grignard reagent.', s_etoh: 'Ethanol protonated the Grignard reagent.', s_hoac: 'An acid solvent destroyed the Grignard reagent.' },
    atm: 'n2', atmFx: { air: [0.3, 'Air moisture quenched much of the Grignard reagent.'] },
    temp: [0, 40], exo: 3, time: 14, yield: 0.85,
    hint: 'Add your phenyl Grignard reagent to a diaryl ketone. Keep it dry: ether solvent, nitrogen, 0–40 °C.',
    learn: 'Grignard + ketone → tertiary alcohol. The trityl cation, Ph₃C⁺, is so stable it glows yellow in sulfuric acid.',
  },
  {
    id: 'dba', name: 'Crossed aldol condensation', cls: 'Aldol', tech: 't_aldol', tier: 4,
    reagents: { phcho: 2, acetone: 1 }, products: { dba: 1 },
    solvents: ['s_etoh'], solventFx: { s_water: [0.5, 'Benzaldehyde is poorly soluble in pure water — ethanol is better.'], s_meoh: [0.85, 'Methanol works, but ethanol is the standard.'] },
    additive: { id: 'a_naoh', amt: 0.5, missing: 0.02, why: 'Without base there is no enolate, so no aldol.' },
    temp: [15, 35], exo: 1, time: 10, yield: 0.9,
    hint: 'Crossed aldol condensation: an aldehyde with no α-hydrogens + a small ketone that can react on both sides. Get the stoichiometry right! Aqueous NaOH in ethanol, room temperature.',
    learn: 'Two condensations build a long conjugated system — dibenzalacetone is yellow and absorbs UV.',
  },
  {
    id: 'da', name: 'Diels–Alder cycloaddition', cls: 'Pericyclic', tech: 't_diels', tier: 4,
    reagents: { anthracene: 1, maleic: 1 }, products: { da_adduct: 1 },
    solvents: ['s_xylene'], solventFx: { s_toluene: [0.85, 'Toluene works but refluxes cooler than xylene.'], s_water: [0.05, 'Water hydrolyses maleic anhydride to maleic acid.'] },
    temp: [130, 150], exo: 0, time: 14, yield: 0.9,
    hint: 'Diels–Alder [4+2]: a polycyclic aromatic diene that reacts across its central ring + a very electron-poor dienophile. Reflux in a high-boiling aromatic solvent (130–150 °C).',
    learn: 'Reacting at C9/C10 leaves two intact benzene rings — the smallest possible loss of aromaticity.',
  },
  {
    id: 'nitro', name: 'Aromatic nitration', cls: 'EAS', tech: 't_eas', tier: 4,
    reagents: { mebz: 1, hno3: 1 }, products: { nitro_ester: 1 },
    solvents: ['none'], solventFx: { s_water: [0.05, 'Water destroys the nitronium ion (NO₂⁺).'] },
    additive: { id: 'a_h2so4', amt: 2, missing: 0.05, why: 'Without sulfuric acid, nitric acid alone makes very little NO₂⁺.' },
    temp: [0, 15], strict: true, exo: 8, time: 14, yield: 0.8,
    hint: 'Nitration: the aromatic ester + nitric acid, with excess sulfuric acid (2 eq) to generate NO₂⁺. Violently exothermic — keep it at 0–15 °C!',
    learn: 'The ester is a meta-director, so the nitro group lands at C3. Overheating gives dinitration and runaway.',
  },
  {
    id: 'fc', name: 'Friedel–Crafts acylation', cls: 'EAS', tech: 't_eas', tier: 4,
    reagents: { anisole: 1, ac2o: 1 }, products: { mapone: 1, acoh: 1 },
    solvents: ['s_dcm'], fatalSolvent: { s_water: 'AlCl₃ reacted violently with water — no Lewis acid left.', s_meoh: 'Methanol destroyed the AlCl₃.', s_etoh: 'Ethanol destroyed the AlCl₃.' },
    additive: { id: 'a_alcl3', amt: 2.2, missing: 0, why: 'Friedel–Crafts acylation needs a Lewis acid to form the acylium ion.' },
    temp: [0, 25], exo: 4, time: 14, yield: 0.85,
    hint: 'Friedel–Crafts acylation: an activated arene (methoxybenzene) + acetic anhydride, with >2 eq of a strong Lewis acid, in a chlorinated solvent, 0–25 °C. Strictly no water.',
    learn: 'The product ketone binds AlCl₃, so the "catalyst" is really a stoichiometric reagent. OMe directs para.',
  },
  // ───────────── Tier 5 ─────────────
  {
    id: 'diazonium', name: 'Diazotization', cls: 'Diazonium', tech: 't_azo', tier: 5,
    reagents: { sulfanilic: 1, nano2: 1, hcl: 2 }, products: { diazonium: 1 },
    solvents: ['s_water'], temp: [0, 5], strict: true, exo: 3, time: 8, yield: 0.95,
    hint: 'Diazotization: an aromatic amine + sodium nitrite + 2 eq of hydrochloric acid in water. Must stay at 0–5 °C or it decomposes!',
    learn: 'Above ~5 °C diazonium salts lose N₂ gas. Industry uses them immediately in the next step.',
  },
  {
    id: 'mo', name: 'Azo coupling', cls: 'Azo dye', tech: 't_azo', tier: 5,
    reagents: { diazonium: 1, dma: 1, naoh: 1 }, products: { methyl_orange: 1 },
    solvents: ['s_water'], temp: [0, 10], strict: true, exo: 2, time: 10, yield: 0.9,
    hint: 'Azo coupling: your diazonium salt + an electron-rich tertiary aniline, then base to form the sodium salt. In water, 0–10 °C.',
    learn: 'Methyl orange turns from red (pH < 3.1) to yellow (pH > 4.4) — a classic titration indicator.',
  },
  {
    id: 'paracetamol', name: 'Paracetamol synthesis', cls: 'N-Acylation', tech: 't_pharma', tier: 5,
    reagents: { aminophenol: 1, ac2o: 1 }, products: { paracetamol: 1, acoh: 1 },
    solvents: ['s_water'], temp: [80, 100], exo: 1, time: 12, yield: 0.85,
    hint: 'Selectively acetylate the amine of 4-aminophenol with an anhydride. Water is fine as solvent, 80–100 °C.',
    learn: 'Nitrogen is the better nucleophile, so the amide forms even with a free phenol present.',
  },
  {
    id: 'benzocaine', name: 'Benzocaine synthesis', cls: 'Esterification', tech: 't_pharma', tier: 5,
    reagents: { paba: 1, etoh: 1 }, products: { benzocaine: 1 },
    solvents: ['none', 's_etoh'], solventFx: { s_water: [0.2, 'Adding water pushes the equilibrium backwards.'] },
    additive: { id: 'a_h2so4', amt: 1, why: 'Fischer esterification needs acid — and the basic amine soaks up the first equivalent.' },
    temp: [70, 85], exo: 0, time: 12, yield: 0.75, eqm: true,
    hint: 'Fischer esterification of 4-aminobenzoic acid with ethanol. The basic amine soaks up acid, so use a full equivalent of H₂SO₄. 70–85 °C.',
    learn: 'Benzocaine is the topical anaesthetic in many sore-throat lozenges and gels.',
  },
  {
    id: 'chloroamide', name: 'Lidocaine step 1: amide', cls: 'N-Acylation', tech: 't_lido', tier: 5,
    reagents: { xylidine: 1, clacc: 1 }, products: { chloroamide: 1 },
    solvents: ['s_hoac'], solventFx: { s_water: [0.3, 'Water hydrolyses chloroacetyl chloride.'] },
    temp: [20, 50], exo: 3, time: 12, yield: 0.85,
    hint: 'Acylate 2,6-dimethylaniline with chloroacetyl chloride in glacial acetic acid, 20–50 °C.',
    learn: 'The acid chloride reacts far faster than the alkyl chloride on the same molecule — chemoselectivity!',
  },
  {
    id: 'lidocaine', name: 'Lidocaine step 2: amination', cls: 'SN2', tech: 't_lido', tier: 5,
    reagents: { chloroamide: 1, et2nh: 3 }, products: { lidocaine: 1 },
    solvents: ['s_toluene'], solventFx: { s_xylene: [0.9, 'Xylene works, slightly too hot.'] },
    temp: [100, 115], exo: 0, time: 16, yield: 0.8,
    hint: 'SN2: displace the chloride of your α-chloroamide with diethylamine (3 eq) in refluxing toluene, 100–115 °C.',
    learn: 'The extra diethylamine mops up HCl as diethylammonium chloride.',
  },
  // ───────────── Tier 6 ─────────────
  {
    id: 'ibap', name: 'BHC step 1: acylation', cls: 'EAS', tech: 't_ibu', tier: 6,
    reagents: { ibb: 1, ac2o: 1 }, products: { ibap: 1, acoh: 1 },
    solvents: ['none'],
    additive: { id: 'a_hf', amt: 0.1, missing: 0, why: 'Acylation needs a strong acid catalyst.' },
    alt: { a_alcl3: [0.6, 'AlCl₃ works (the old Boots route) but creates lots of aluminium waste.'] },
    temp: [60, 85], exo: 2, time: 16, yield: 0.85,
    hint: 'BHC step 1: Friedel–Crafts acylation of isobutylbenzene with acetic anhydride, using anhydrous HF as recyclable catalyst. 60–85 °C, no other solvent.',
    learn: 'HF serves as both catalyst and solvent and is recovered — far less waste than stoichiometric AlCl₃.',
  },
  {
    id: 'ibpe', name: 'BHC step 2: hydrogenation', cls: 'Reduction', tech: 't_ibu', tier: 6,
    reagents: { ibap: 1 }, products: { ibpe: 1 },
    solvents: ['none', 's_etoh'],
    additive: { id: 'a_raney', amt: 0.05, missing: 0, why: 'H₂ does nothing without a hydrogenation catalyst.' },
    atm: 'h2', atmFx: { air: [0, 'No hydrogen source — hydrogenation needs H₂ gas.'], n2: [0, 'No hydrogen source — hydrogenation needs H₂ gas.'], co: [0, 'Wrong gas: this step needs H₂, not CO.'] },
    temp: [30, 70], exo: 2, time: 16, yield: 0.9,
    hint: 'BHC step 2: hydrogenate the ketone to an alcohol with H₂ gas over Raney nickel, 30–70 °C.',
    learn: 'Catalytic hydrogenation adds H₂ across C=O with 100% atom economy.',
  },
  {
    id: 'ibuprofen', name: 'BHC step 3: carbonylation', cls: 'Carbonylation', tech: 't_ibu', tier: 6,
    reagents: { ibpe: 1 }, products: { ibuprofen: 1 },
    solvents: ['none', 's_water'],
    additive: { id: 'a_pdcl2', amt: 0.02, missing: 0, why: 'CO insertion requires a palladium catalyst.' },
    alt: { a_pd4: [0.8, 'Pd(PPh₃)₄ works, but PdCl₂(PPh₃)₂ is the standard here.'] },
    atm: 'co', atmFx: { air: [0, 'No carbon monoxide — nothing to insert.'], n2: [0, 'No carbon monoxide — nothing to insert.'], h2: [0, 'Wrong gas: this step needs CO, not H₂.'] },
    temp: [110, 140], exo: 1, time: 20, yield: 0.85,
    hint: 'BHC step 3: palladium-catalysed carbonylation — insert CO into the C–O bond of your alcohol, 110–140 °C under CO pressure.',
    learn: 'The BHC route won the 1997 Presidential Green Chemistry Challenge Award.',
  },
  {
    id: 'nylon', name: 'Interfacial polymerisation', cls: 'Polymer', tech: 't_polymer', tier: 6,
    reagents: { hmda: 1, adipoyl: 1 }, products: { nylon: 1 },
    solvents: ['s_hexane', 's_water'],
    additive: { id: 'a_naoh', amt: 2, missing: 0.3, why: 'Without base, the HCl released protonates the amine and stops the chain.' },
    temp: [15, 30], exo: 1, time: 12, yield: 0.9,
    hint: 'Step-growth polymerisation: a diamine + a diacid chloride, with 2 eq of aqueous NaOH to neutralise HCl. Interfacial (water/hexane), room temperature.',
    learn: 'Nylon forms instantly at the interface — you can pull a continuous rope out of the beaker!',
  },
  {
    id: 'lc5cb', name: 'Suzuki coupling', cls: 'Cross-coupling', tech: 't_suzuki', tier: 6,
    reagents: { brbn: 1, pentylboronic: 1, k2co3: 2 }, products: { lc5cb: 1 },
    solvents: ['s_toluene', 's_thf', 's_etoh'],
    additive: { id: 'a_pd4', amt: 0.03, missing: 0, why: 'No palladium, no catalytic cycle.' },
    alt: { a_pdcl2: [0.75, 'Pd(II) must first be reduced to Pd(0) — works, but slower.'] },
    atm: 'n2', atmFx: { air: [0.3, 'O₂ oxidised much of the Pd(0) catalyst.'] },
    temp: [80, 100], exo: 0, time: 24, yield: 0.85,
    hint: 'Suzuki coupling: an aryl bromide + an arylboronic acid + 2 eq of carbonate base, with 3 mol% Pd(0), under N₂, 80–100 °C.',
    learn: '5CB (George Gray, 1972) was the first stable room-temperature liquid crystal — it launched the LCD industry.',
  },
];

CC.RECIPE = {};
CC.RECIPE_RP = [0, 1, 3, 6, 10, 16, 25];
for (const r of CC.RECIPES) {
  CC.RECIPE[r.id] = r;
  r.rp = CC.RECIPE_RP[r.tier];
  for (const p in r.products) {
    const it = CC.ITEMS[p];
    if (it && (it.tier == null || r.tier < it.tier)) it.tier = r.tier;
  }
}
