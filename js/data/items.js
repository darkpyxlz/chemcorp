var CC = (globalThis.CC = globalThis.CC || {});

// Every material in the game. Four kinds:
//   reagent  – bought by the mol, consumed by reactions
//   product  – made by reactions, sold by the mol (some are intermediates for later steps)
//   solvent  – stocked once (unlock), then charged per batch
//   additive – catalysts & auxiliaries, stocked once, then charged per mol used
CC.ITEMS = {};

(function () {
  function reg(kind, list) {
    for (const it of list) {
      it.kind = kind;
      CC.ITEMS[it.id] = it;
    }
  }

  reg('reagent', [
    { id: 'hcl', name: 'Hydrochloric acid', f: 'HCl', cost: 1, desc: 'Strong mineral acid, supplied as a concentrated aqueous solution.' },
    { id: 'naoh', name: 'Sodium hydroxide', f: 'NaOH', cost: 1, desc: 'Strong base, a.k.a. lye or caustic soda.' },
    { id: 'veg_oil', name: 'Vegetable oil', f: 'triglyceride', cost: 5, color: '#f2d36b', desc: 'A fat: three fatty-acid chains joined to glycerol by ester bonds.' },
    { id: 'acoh', name: 'Acetic acid', f: 'CH₃COOH', cost: 2, desc: 'A weak carboxylic acid (pKa 4.76) — the sour in vinegar.' },
    { id: 'etoh', name: 'Ethanol', f: 'C₂H₅OH', cost: 2, desc: 'A primary alcohol.' },
    { id: 'isoamyl_oh', name: 'Isoamyl alcohol', f: '(CH₃)₂CHCH₂CH₂OH', cost: 6, desc: '3-Methylbutan-1-ol, a primary alcohol (bp 131 °C).' },
    { id: 'salicylic', name: 'Salicylic acid', f: 'HOC₆H₄COOH', cost: 9, desc: 'Has both a phenol –OH and a carboxylic acid. Originally isolated from willow bark.' },
    { id: 'ac2o', name: 'Acetic anhydride', f: '(CH₃CO)₂O', cost: 5, desc: 'A reactive acetylating agent; acetate is its leaving group.' },
    { id: 'tbuoh', name: 'tert-Butanol', f: '(CH₃)₃COH', cost: 4, desc: 'A tertiary alcohol.' },
    { id: 'buoh', name: '1-Butanol', f: 'CH₃(CH₂)₃OH', cost: 3, desc: 'A primary alcohol.' },
    { id: 'nabr', name: 'Sodium bromide', f: 'NaBr', cost: 2, desc: 'A source of bromide ions (Br⁻).' },
    { id: 'naphthol', name: '2-Naphthol', f: 'C₁₀H₇OH', cost: 15, desc: 'A phenol (pKa ≈ 9.5) built on a naphthalene ring.' },
    { id: 'cyclohexanol', name: 'Cyclohexanol', f: 'C₆H₁₁OH', cost: 6, desc: 'A secondary alcohol.' },
    { id: 'benzophenone', name: 'Benzophenone', f: '(C₆H₅)₂CO', cost: 20, desc: 'A diaryl ketone.' },
    { id: 'nabh4', name: 'Sodium borohydride', f: 'NaBH₄', cost: 40, desc: 'A mild hydride reducing agent. Each BH₄⁻ can deliver four H⁻.' },
    { id: 'phbr', name: 'Bromobenzene', f: 'C₆H₅Br', cost: 15, desc: 'An aryl bromide.' },
    { id: 'mg', name: 'Magnesium turnings', f: 'Mg', cost: 4, color: '#c9ced6', desc: 'A reactive metal whose surface is passivated by a thin oxide layer.' },
    { id: 'phcho', name: 'Benzaldehyde', f: 'C₆H₅CHO', cost: 8, desc: 'An aromatic aldehyde with no α-hydrogens. Smells of almonds.' },
    { id: 'acetone', name: 'Acetone', f: '(CH₃)₂CO', cost: 2, desc: 'The simplest ketone, with α-hydrogens on both sides.' },
    { id: 'anthracene', name: 'Anthracene', f: 'C₁₄H₁₀', cost: 30, desc: 'Three linearly fused benzene rings.' },
    { id: 'maleic', name: 'Maleic anhydride', f: 'C₄H₂O₃', cost: 10, desc: 'An electron-poor C=C flanked by two carbonyl groups.' },
    { id: 'mebz', name: 'Methyl benzoate', f: 'C₆H₅CO₂CH₃', cost: 12, desc: 'An aromatic ester.' },
    { id: 'hno3', name: 'Nitric acid', f: 'HNO₃', cost: 3, color: '#fff3c4', desc: 'A concentrated oxidising acid.' },
    { id: 'anisole', name: 'Anisole', f: 'C₆H₅OCH₃', cost: 10, desc: 'Methoxybenzene — an electron-rich (activated) arene.' },
    { id: 'sulfanilic', name: 'Sulfanilic acid', f: 'H₂NC₆H₄SO₃H', cost: 10, desc: 'An aromatic amine bearing a sulfonic acid group.' },
    { id: 'nano2', name: 'Sodium nitrite', f: 'NaNO₂', cost: 3, desc: 'Forms nitrous acid (HNO₂) when acidified.' },
    { id: 'dma', name: 'N,N-Dimethylaniline', f: 'C₆H₅N(CH₃)₂', cost: 15, desc: 'A very electron-rich tertiary aromatic amine.' },
    { id: 'aminophenol', name: '4-Aminophenol', f: 'H₂NC₆H₄OH', cost: 25, desc: 'Carries both an amine and a phenol.' },
    { id: 'paba', name: '4-Aminobenzoic acid', f: 'H₂NC₆H₄COOH', cost: 20, desc: 'PABA — an amine and a carboxylic acid on one ring.' },
    { id: 'ibb', name: 'Isobutylbenzene', f: 'C₆H₅CH₂CH(CH₃)₂', cost: 30, desc: 'The starting material for ibuprofen.' },
    { id: 'xylidine', name: '2,6-Dimethylaniline', f: '(CH₃)₂C₆H₃NH₂', cost: 40, desc: 'An aniline with both ortho positions blocked by methyl groups.' },
    { id: 'clacc', name: 'Chloroacetyl chloride', f: 'ClCH₂COCl', cost: 20, desc: 'An acid chloride that also carries an alkyl chloride.' },
    { id: 'et2nh', name: 'Diethylamine', f: '(C₂H₅)₂NH', cost: 8, desc: 'A secondary amine: nucleophile and base.' },
    { id: 'hmda', name: 'Hexamethylenediamine', f: 'H₂N(CH₂)₆NH₂', cost: 40, desc: 'A six-carbon diamine monomer.' },
    { id: 'adipoyl', name: 'Adipoyl chloride', f: 'ClCO(CH₂)₄COCl', cost: 50, desc: 'A six-carbon diacid chloride monomer.' },
    { id: 'brbn', name: '4-Bromobenzonitrile', f: 'BrC₆H₄CN', cost: 120, desc: 'An aryl bromide carrying a nitrile.' },
    { id: 'pentylboronic', name: '4-Pentylphenylboronic acid', f: 'C₅H₁₁C₆H₄B(OH)₂', cost: 200, desc: 'An arylboronic acid — air- and water-stable.' },
    { id: 'naocl', name: 'Sodium hypochlorite (bleach)', f: 'NaOCl', cost: 1, color: '#f4ffd8', desc: 'Household bleach — a cheap, green oxidant.' },
    { id: 'aniline', name: 'Aniline', f: 'C₆H₅NH₂', cost: 6, desc: 'The simplest aromatic amine.' },
    { id: 'k2co3', name: 'Potassium carbonate', f: 'K₂CO₃', cost: 3, desc: 'A mild inorganic base.' },
  ]);

  // value = base sell price per mol. sellable:false = too unstable to ship.
  reg('product', [
    { id: 'cyclohexanone', name: 'Cyclohexanone', f: 'C₆H₁₀O', value: 25, color: '#f1f8ff', desc: 'A cyclic ketone — precursor to nylon-6.' },
    { id: 'acetanilide', name: 'Acetanilide', f: 'C₆H₅NHCOCH₃', value: 30, color: '#ffffff', desc: 'An amide; once sold as the painkiller "Antifebrin".' },
    { id: 'soap', name: 'Soap', f: 'C₁₇H₃₅COO⁻Na⁺', value: 6, color: '#f5e6c8', desc: 'Sodium stearate — a surfactant with a polar head and greasy tail.' },
    { id: 'glycerol', name: 'Glycerol', f: 'C₃H₅(OH)₃', value: 4, color: '#eef6ff', desc: 'A sweet, viscous triol used in cosmetics and food.' },
    { id: 'etoac', name: 'Ethyl acetate', f: 'CH₃COOC₂H₅', value: 16, color: '#dff4ff', desc: 'A fruity-smelling solvent (nail-polish remover, decaf coffee).' },
    { id: 'isoamyl_ac', name: 'Isoamyl acetate', f: 'CH₃COO(CH₂)₂CH(CH₃)₂', value: 28, color: '#fff2a0', desc: '"Banana oil" — the main aroma of bananas.' },
    { id: 'aspirin', name: 'Aspirin', f: 'C₉H₈O₄', value: 45, color: '#ffffff', desc: 'Acetylsalicylic acid — painkiller, anti-inflammatory, anti-clotting.' },
    { id: 'tbucl', name: 'tert-Butyl chloride', f: '(CH₃)₃CCl', value: 18, color: '#e8f2ff', desc: '2-Chloro-2-methylpropane, a tertiary alkyl halide.' },
    { id: 'bubr', name: '1-Bromobutane', f: 'CH₃(CH₂)₃Br', value: 25, color: '#f0e8ff', desc: 'A primary alkyl bromide — great SN2 substrate.' },
    { id: 'nerolin', name: '2-Butoxynaphthalene', f: 'C₁₀H₇OC₄H₉', value: 85, color: '#f8f1ff', desc: 'An ether with a sweet orange-blossom scent used in perfumery.' },
    { id: 'cyclohexene', name: 'Cyclohexene', f: 'C₆H₁₀', value: 65, color: '#e9fbff', desc: 'A cyclic alkene (bp 83 °C).' },
    { id: 'benzhydrol', name: 'Diphenylmethanol', f: '(C₆H₅)₂CHOH', value: 80, color: '#fafafa', desc: 'Benzhydrol — a secondary alcohol and pharmaceutical building block.' },
    { id: 'phmgbr', name: 'Phenylmagnesium bromide', f: 'C₆H₅MgBr', value: 0, sellable: false, color: '#9a8f7a', desc: 'A Grignard reagent. Destroyed by air and water — use it, don\'t ship it.' },
    { id: 'trityl_oh', name: 'Triphenylmethanol', f: '(C₆H₅)₃COH', value: 240, color: '#ffffff', desc: 'A tertiary alcohol made by Grignard addition.' },
    { id: 'dba', name: 'Dibenzalacetone', f: '(C₆H₅CH=CH)₂CO', value: 80, color: '#ffd84d', desc: 'A bright yellow, UV-absorbing enone.' },
    { id: 'da_adduct', name: 'Anthracene–maleic anhydride adduct', f: 'C₁₈H₁₂O₃', value: 160, color: '#fffbea', desc: 'The Diels–Alder adduct formed across anthracene\'s central ring.' },
    { id: 'nitro_ester', name: 'Methyl 3-nitrobenzoate', f: 'O₂NC₆H₄CO₂CH₃', value: 75, color: '#f6efc2', desc: 'The meta-nitration product of methyl benzoate.' },
    { id: 'mapone', name: '4-Methoxyacetophenone', f: 'CH₃OC₆H₄COCH₃', value: 100, color: '#fff8ee', desc: 'An aromatic ketone with a sweet hawthorn-like odour.' },
    { id: 'diazonium', name: 'Diazonium salt', f: '⁻O₃SC₆H₄N₂⁺', value: 0, sellable: false, color: '#fff7dc', desc: 'Explosive when dry and decomposes above ~5 °C. Use immediately.' },
    { id: 'methyl_orange', name: 'Methyl orange', f: 'C₁₄H₁₄N₃NaO₃S', value: 180, color: '#ff7a1a', desc: 'An azo dye and pH indicator.' },
    { id: 'paracetamol', name: 'Paracetamol', f: 'C₈H₉NO₂', value: 200, color: '#ffffff', desc: 'Acetaminophen — analgesic and antipyretic.' },
    { id: 'benzocaine', name: 'Benzocaine', f: 'H₂NC₆H₄CO₂C₂H₅', value: 160, color: '#ffffff', desc: 'A topical local anaesthetic.' },
    { id: 'chloroamide', name: 'α-Chloro-2,6-dimethylacetanilide', f: 'ClCH₂CONHC₆H₃(CH₃)₂', value: 180, color: '#f7f7f0', desc: 'The lidocaine intermediate.' },
    { id: 'lidocaine', name: 'Lidocaine', f: 'C₁₄H₂₂N₂O', value: 700, color: '#ffffff', desc: 'An amide-type local anaesthetic and antiarrhythmic.' },
    { id: 'ibap', name: '4-Isobutylacetophenone', f: 'C₁₂H₁₆O', value: 105, color: '#fdf6e3', desc: 'Ibuprofen intermediate #1.' },
    { id: 'ibpe', name: '1-(4-Isobutylphenyl)ethanol', f: 'C₁₂H₁₈O', value: 170, color: '#fbfbf2', desc: 'Ibuprofen intermediate #2.' },
    { id: 'ibuprofen', name: 'Ibuprofen', f: 'C₁₃H₁₈O₂', value: 900, color: '#ffffff', desc: 'A non-steroidal anti-inflammatory drug (NSAID).' },
    { id: 'nylon', name: 'Nylon-6,6', f: '[–NH(CH₂)₆NHCO(CH₂)₄CO–]ₙ', value: 500, color: '#f2f2f2', desc: 'A tough polyamide fibre.' },
    { id: 'lc5cb', name: '5CB liquid crystal', f: 'C₅H₁₁C₆H₄C₆H₄CN', value: 2500, color: '#bfe9ff', desc: '4-Cyano-4′-pentylbiphenyl, a room-temperature nematic liquid crystal for displays.' },
  ]);

  // unlock = one-time stocking cost; use = $ per batch (scaled by vessel size).
  reg('solvent', [
    { id: 's_water', name: 'Water', f: 'H₂O', unlock: 0, use: 0.1, always: true, desc: 'Polar protic, bp 100 °C. Dissolves salts; destroys water-sensitive reagents.' },
    { id: 's_etoh', name: 'Ethanol', f: 'EtOH', unlock: 20, use: 0.5, always: true, desc: 'Polar protic, bp 78 °C. A versatile, cheap solvent.' },
    { id: 's_meoh', name: 'Methanol', f: 'MeOH', unlock: 40, use: 0.5, always: true, desc: 'Polar protic, bp 65 °C. Toxic.' },
    { id: 's_et2o', name: 'Diethyl ether (anhydrous)', f: 'Et₂O', unlock: 150, use: 2, desc: 'Aprotic, bp 35 °C. Oxygen lone pairs coordinate metals. Extremely flammable.' },
    { id: 's_thf', name: 'THF (anhydrous)', f: 'C₄H₈O', unlock: 300, use: 3, desc: 'Tetrahydrofuran: polar aprotic cyclic ether, bp 66 °C.' },
    { id: 's_dcm', name: 'Dichloromethane', f: 'CH₂Cl₂', unlock: 250, use: 2, desc: 'Polar aprotic, bp 40 °C. Dissolves most organics.' },
    { id: 's_xylene', name: 'Xylene', f: 'C₆H₄(CH₃)₂', unlock: 400, use: 2, desc: 'Nonpolar aromatic, bp ~140 °C. For high-temperature reflux.' },
    { id: 's_toluene', name: 'Toluene', f: 'C₆H₅CH₃', unlock: 500, use: 2, desc: 'Nonpolar aromatic, bp 111 °C.' },
    { id: 's_hexane', name: 'Hexane', f: 'C₆H₁₄', unlock: 300, use: 1.5, desc: 'Nonpolar alkane, bp 69 °C. Immiscible with water.' },
    { id: 's_hoac', name: 'Glacial acetic acid', f: 'CH₃COOH', unlock: 200, use: 1.5, desc: 'Polar protic acidic solvent, bp 118 °C.' },
  ]);

  // use = $ per mol of additive consumed (amount comes from the recipe).
  reg('additive', [
    { id: 'a_h2so4', name: 'Sulfuric acid', f: 'H₂SO₄', unlock: 30, use: 2, always: true, desc: 'Strong acid catalyst and dehydrating agent.' },
    { id: 'a_h3po4', name: 'Phosphoric acid (85%)', f: 'H₃PO₄', unlock: 50, use: 3, always: true, desc: 'Strong-ish, non-oxidising acid catalyst.' },
    { id: 'a_naoh', name: 'Sodium hydroxide (aq. 10%)', f: 'NaOH', unlock: 20, use: 1, always: true, desc: 'Aqueous base, used as a catalyst or acid scavenger.' },
    { id: 'a_i2', name: 'Iodine crystal', f: 'I₂', unlock: 100, use: 20, desc: 'Etches the oxide layer off magnesium to initiate Grignard formation.' },
    { id: 'a_alcl3', name: 'Aluminium chloride', f: 'AlCl₃', unlock: 400, use: 8, desc: 'A strong Lewis acid. Reacts violently with water.' },
    { id: 'a_hf', name: 'Anhydrous hydrogen fluoride', f: 'HF', unlock: 8000, use: 5, desc: 'Superacidic catalyst/solvent for industrial acylation. Recyclable — and extremely hazardous.' },
    { id: 'a_raney', name: 'Raney nickel', f: 'Ni(Al)', unlock: 5000, use: 100, desc: 'Porous nickel hydrogenation catalyst. Pyrophoric when dry.' },
    { id: 'a_pdcl2', name: 'PdCl₂(PPh₃)₂', f: 'PdCl₂(PPh₃)₂', unlock: 15000, use: 1500, desc: 'Palladium(II) pre-catalyst for carbonylation.' },
    { id: 'a_pd4', name: 'Pd(PPh₃)₄', f: 'Pd(PPh₃)₄', unlock: 25000, use: 2000, desc: 'Tetrakis — an air-sensitive Pd(0) cross-coupling catalyst.' },
  ]);


  // ───────── expansion: more organic chemistry ─────────
  reg('reagent', [
    { id: 'meoh', name: 'Methanol', f: 'CH₃OH', cost: 1.5, desc: 'The simplest alcohol (bp 65 °C). Toxic.' },
    { id: 'butyric', name: 'Butanoic acid', f: 'CH₃(CH₂)₂COOH', cost: 4, desc: 'Butyric acid — smells of rancid butter, but its esters smell of fruit.' },
    { id: 'octanol', name: '1-Octanol', f: 'CH₃(CH₂)₇OH', cost: 6, desc: 'A long-chain primary alcohol.' },
    { id: 'bnoh', name: 'Benzyl alcohol', f: 'C₆H₅CH₂OH', cost: 5, desc: 'A primary alcohol on a benzylic carbon.' },
    { id: 'tamyl', name: '2-Methylbutan-2-ol', f: 'CH₃CH₂C(CH₃)₂OH', cost: 5, desc: 'tert-Amyl alcohol — a tertiary alcohol.' },
    { id: 'nai', name: 'Sodium iodide', f: 'NaI', cost: 8, desc: 'Soluble in acetone, unlike NaBr and NaCl.' },
    { id: 'pinacol', name: 'Pinacol', f: '(CH₃)₂C(OH)C(OH)(CH₃)₂', cost: 12, desc: 'A 1,2-diol with two tertiary carbons.' },
    { id: 'borneol', name: 'Borneol', f: 'C₁₀H₁₇OH', cost: 25, desc: 'A bicyclic terpene alcohol from camphor trees.' },
    { id: 'vanillin', name: 'Vanillin', f: 'C₈H₈O₃', cost: 12, color: '#fffbe8', desc: 'The flavour of vanilla: an aldehyde, a phenol and an ether.' },
    { id: 'mcpba', name: 'mCPBA', f: 'ClC₆H₄CO₃H', cost: 30, desc: 'meta-Chloroperoxybenzoic acid — a peroxyacid oxidant.' },
    { id: 'kmno4', name: 'Potassium permanganate', f: 'KMnO₄', cost: 6, color: '#a21caf', desc: 'A deep purple oxidant.' },
    { id: 'koh', name: 'Potassium hydroxide', f: 'KOH', cost: 1.5, desc: 'A strong base.' },
    { id: 'bnpph3cl', name: 'Benzyltriphenylphosphonium chloride', f: 'C₆H₅CH₂P(C₆H₅)₃⁺Cl⁻', cost: 35, desc: 'A Wittig salt: deprotonate it to get a phosphorus ylide.' },
    { id: 'pyrbr3', name: 'Pyridinium tribromide', f: 'C₅H₅NH⁺Br₃⁻', cost: 18, color: '#f59e0b', desc: 'A safe, solid source of Br₂.' },
    { id: 'acetophenone', name: 'Acetophenone', f: 'C₆H₅COCH₃', cost: 6, desc: 'An aryl methyl ketone with α-hydrogens.' },
    { id: 'naoet', name: 'Sodium ethoxide', f: 'NaOC₂H₅', cost: 6, desc: 'A strong alkoxide base.' },
    { id: 'salald', name: 'Salicylaldehyde', f: 'HOC₆H₄CHO', cost: 10, desc: '2-Hydroxybenzaldehyde.' },
    { id: 'toluidine', name: 'p-Toluidine', f: 'CH₃C₆H₄NH₂', cost: 8, desc: '4-Methylaniline, an aromatic amine.' },
    { id: 'urea', name: 'Urea', f: '(NH₂)₂CO', cost: 1, desc: 'The first organic compound made from inorganic materials (Wöhler, 1828).' },
    { id: 'nh4oac', name: 'Ammonium acetate', f: 'CH₃COONH₄', cost: 2, desc: 'A convenient source of ammonia.' },
    { id: 'clso3h', name: 'Chlorosulfonic acid', f: 'ClSO₃H', cost: 6, desc: 'A ferocious sulfonating agent. Reacts violently with water.' },
    { id: 'nh3', name: 'Aqueous ammonia', f: 'NH₃(aq)', cost: 1, desc: 'A nucleophile and base.' },
    { id: 'phthalic', name: 'Phthalic anhydride', f: 'C₆H₄(CO)₂O', cost: 6, desc: 'A cyclic aromatic anhydride.' },
    { id: 'resorcinol', name: 'Resorcinol', f: 'C₆H₄(OH)₂', cost: 14, desc: 'Benzene-1,3-diol — a very electron-rich arene.' },
    { id: 'phenol', name: 'Phenol', f: 'C₆H₅OH', cost: 5, desc: 'Hydroxybenzene. Corrosive.' },
    { id: 'onba', name: '2-Nitrobenzaldehyde', f: 'O₂NC₆H₄CHO', cost: 30, color: '#fde68a', desc: 'An aldehyde with an ortho nitro group.' },
    { id: 'ki', name: 'Potassium iodide', f: 'KI', cost: 8, desc: 'A source of iodide (I⁻).' },
    { id: 'macrylate', name: 'Methyl acrylate', f: 'CH₂=CHCO₂CH₃', cost: 6, desc: 'An electron-poor alkene.' },
    { id: 'et3n', name: 'Triethylamine', f: '(C₂H₅)₃N', cost: 5, desc: 'A hindered amine base.' },
    { id: 'phenylacetylene', name: 'Phenylacetylene', f: 'C₆H₅C≡CH', cost: 25, desc: 'A terminal alkyne.' },
    { id: 'styrene', name: 'Styrene', f: 'C₆H₅CH=CH₂', cost: 3, desc: 'Vinylbenzene — a monomer.' },
    { id: 'mma', name: 'Methyl methacrylate', f: 'CH₂=C(CH₃)CO₂CH₃', cost: 4, desc: 'The monomer of Perspex/Plexiglas.' },
    { id: 'lactide', name: 'Lactide', f: 'C₆H₈O₄', cost: 15, desc: 'The cyclic dimer of lactic acid (from corn starch).' },
    { id: 'tpa', name: 'Terephthalic acid', f: 'C₆H₄(COOH)₂', cost: 4, desc: 'Benzene-1,4-dicarboxylic acid.' },
    { id: 'eg', name: 'Ethylene glycol', f: 'HOCH₂CH₂OH', cost: 2, desc: 'Ethane-1,2-diol — antifreeze and a diol monomer.' },
    { id: 'toluic', name: 'm-Toluic acid', f: 'CH₃C₆H₄COOH', cost: 10, desc: '3-Methylbenzoic acid.' },
    { id: 'socl2', name: 'Thionyl chloride', f: 'SOCl₂', cost: 5, desc: 'Turns carboxylic acids into acid chlorides.' },
    { id: 'dmb', name: '1,4-Dimethoxybenzene', f: 'C₆H₄(OCH₃)₂', cost: 12, desc: 'A strongly activated arene.' },
    { id: 'etbr', name: 'Bromoethane', f: 'CH₃CH₂Br', cost: 8, desc: 'A primary alkyl halide.' },
    { id: 'cpd', name: 'Cyclopentadiene', f: 'C₅H₆', cost: 8, desc: 'A diene locked s-cis. Dimerises at room temperature, so it is "cracked" fresh.' },
    { id: 'glucose', name: 'Glucose', f: 'C₆H₁₂O₆', cost: 2, desc: 'A sugar with five –OH groups.' },
  ]);

  reg('product', [
    { id: 'mesal', name: 'Methyl salicylate', f: 'HOC₆H₄CO₂CH₃', value: 40, color: '#f0fff4', desc: 'Oil of wintergreen.' },
    { id: 'etbut', name: 'Ethyl butanoate', f: 'CH₃(CH₂)₂CO₂C₂H₅', value: 26, color: '#fff7d6', desc: 'Pineapple aroma.' },
    { id: 'octylac', name: 'Octyl acetate', f: 'CH₃CO₂C₈H₁₇', value: 30, color: '#ffedd5', desc: 'Orange aroma.' },
    { id: 'bnac', name: 'Benzyl acetate', f: 'CH₃CO₂CH₂C₆H₅', value: 32, color: '#fdf4ff', desc: 'Jasmine aroma.' },
    { id: 'biodiesel', name: 'Biodiesel (FAME)', f: 'RCO₂CH₃', value: 9, color: '#fde68a', desc: 'Fatty acid methyl esters — renewable diesel fuel.' },
    { id: 'camphor', name: 'Camphor', f: 'C₁₀H₁₆O', value: 85, color: '#ffffff', desc: 'A bicyclic terpene ketone with a medicinal smell.' },
    { id: 'isoborneol', name: 'Isoborneol', f: 'C₁₀H₁₇OH', value: 150, color: '#ffffff', desc: 'The exo alcohol from reducing camphor.' },
    { id: 'stilbene', name: 'Stilbene', f: 'C₆H₅CH=CHC₆H₅', value: 155, color: '#fafaff', desc: '1,2-Diphenylethene.' },
    { id: 'stilbene_br2', name: 'meso-Stilbene dibromide', f: 'C₆H₅CHBrCHBrC₆H₅', value: 300, color: '#fff7ed', desc: '1,2-Dibromo-1,2-diphenylethane.' },
    { id: 'dpa', name: 'Diphenylacetylene', f: 'C₆H₅C≡CC₆H₅', value: 550, color: '#ffffff', desc: 'Tolan — an internal alkyne.' },
    { id: 'epoxide', name: 'Cyclohexene oxide', f: 'C₆H₁₀O', value: 130, color: '#f0f9ff', desc: 'A strained three-membered cyclic ether.' },
    { id: 'diol', name: 'cis-Cyclohexane-1,2-diol', f: 'C₆H₁₀(OH)₂', value: 75, color: '#faf5ff', desc: 'A syn diol.' },
    { id: 'chalcone', name: 'Chalcone', f: 'C₆H₅CH=CHCOC₆H₅', value: 65, color: '#fef08a', desc: 'An α,β-unsaturated ketone — the flavonoid skeleton.' },
    { id: 'eaa', name: 'Ethyl acetoacetate', f: 'CH₃COCH₂CO₂C₂H₅', value: 80, color: '#f0fdf4', desc: 'A β-keto ester: a versatile building block.' },
    { id: 'coumarin', name: '3-Acetylcoumarin', f: 'C₁₁H₈O₃', value: 155, color: '#fefce8', desc: 'A coumarin — the scent of fresh hay.' },
    { id: 'imine', name: 'Vanillin imine', f: 'C₁₅H₁₅NO₂', value: 60, color: '#fde047', desc: 'A Schiff base from vanillin and p-toluidine.' },
    { id: 'benzoin', name: 'Benzoin', f: 'C₆H₅CH(OH)COC₆H₅', value: 70, color: '#ffffff', desc: 'An α-hydroxy ketone.' },
    { id: 'benzil', name: 'Benzil', f: 'C₆H₅COCOC₆H₅', value: 115, color: '#fde047', desc: 'A yellow 1,2-diketone.' },
    { id: 'phenytoin', name: 'Phenytoin', f: 'C₁₅H₁₂N₂O₂', value: 260, color: '#ffffff', desc: 'An anticonvulsant used to treat epilepsy.' },
    { id: 'benzilic', name: 'Benzilic acid', f: '(C₆H₅)₂C(OH)COOH', value: 200, color: '#ffffff', desc: 'An α-hydroxy acid made by rearrangement.' },
    { id: 'dhpm', name: 'Biginelli dihydropyrimidinone', f: 'C₁₄H₁₆N₂O₃', value: 210, color: '#ffffff', desc: 'A heterocycle related to calcium-channel drugs.' },
    { id: 'dhp', name: 'Hantzsch dihydropyridine', f: 'C₁₉H₂₃NO₄', value: 310, color: '#fef9c3', desc: 'The scaffold of nifedipine-type blood-pressure drugs.' },
    { id: 'nitroacetanilide', name: '4-Nitroacetanilide', f: 'O₂NC₆H₄NHCOCH₃', value: 75, color: '#fef3c7', desc: 'Para-nitration product of acetanilide.' },
    { id: 'nitroaniline', name: '4-Nitroaniline', f: 'O₂NC₆H₄NH₂', value: 120, color: '#facc15', desc: 'A yellow dye intermediate.' },
    { id: 'bromoacetanilide', name: '4-Bromoacetanilide', f: 'BrC₆H₄NHCOCH₃', value: 65, color: '#ffffff', desc: 'Para-bromination product of acetanilide.' },
    { id: 'dtbdmb', name: '1,4-Di-tert-butyl-2,5-dimethoxybenzene', f: 'C₁₆H₂₆O₂', value: 70, color: '#ffffff', desc: 'A Friedel–Crafts alkylation product.' },
    { id: 'asc', name: '4-Acetamidobenzenesulfonyl chloride', f: 'CH₃CONHC₆H₄SO₂Cl', value: 0, sellable: false, color: '#f5f5f4', desc: 'Moisture-sensitive sulfonyl chloride. Use it straight away.' },
    { id: 'asa', name: '4-Acetamidobenzenesulfonamide', f: 'CH₃CONHC₆H₄SO₂NH₂', value: 150, color: '#ffffff', desc: 'Protected sulfanilamide.' },
    { id: 'sulfanilamide', name: 'Sulfanilamide', f: 'H₂NC₆H₄SO₂NH₂', value: 320, color: '#ffffff', desc: 'The original sulfa antibacterial drug.' },
    { id: 'phn2', name: 'Benzenediazonium chloride', f: 'C₆H₅N₂⁺Cl⁻', value: 0, sellable: false, color: '#fefce8', desc: 'Unstable above 5 °C. Use immediately.' },
    { id: 'sudan', name: 'Sudan I', f: 'C₁₆H₁₂N₂O', value: 140, color: '#f97316', desc: 'An orange azo solvent dye (for waxes and oils — not food!).' },
    { id: 'phi', name: 'Iodobenzene', f: 'C₆H₅I', value: 70, color: '#fefce8', desc: 'The most reactive aryl halide for cross-coupling.' },
    { id: 'fluorescein', name: 'Fluorescein', f: 'C₂₀H₁₂O₅', value: 260, color: '#facc15', desc: 'Glows bright green under UV light.' },
    { id: 'phenolphthalein', name: 'Phenolphthalein', f: 'C₂₀H₁₄O₄', value: 150, color: '#ffffff', desc: 'Colourless in acid, pink in base (pH 8.2–10).' },
    { id: 'indigo', name: 'Indigo', f: 'C₁₆H₁₀N₂O₂', value: 280, color: '#3730a3', desc: 'The blue of denim jeans.' },
    { id: 'mecinn', name: 'Methyl cinnamate', f: 'C₆H₅CH=CHCO₂CH₃', value: 270, color: '#fff7ed', desc: 'Strawberry/cinnamon aroma made by a Heck reaction.' },
    { id: 'polystyrene', name: 'Polystyrene', f: '[–CH₂CH(C₆H₅)–]ₙ', value: 30, color: '#f5f5f5', desc: 'Cheap, rigid plastic (and Styrofoam).' },
    { id: 'pmma', name: 'PMMA (acrylic glass)', f: '[–CH₂C(CH₃)(CO₂CH₃)–]ₙ', value: 45, color: '#f0f9ff', desc: 'Perspex / Plexiglas.' },
    { id: 'pla', name: 'Polylactic acid (PLA)', f: '[–OCH(CH₃)CO–]ₙ', value: 90, color: '#fefce8', desc: 'A biodegradable plastic from plants; 3D-printer filament.' },
    { id: 'pet', name: 'PET', f: '[–OCH₂CH₂OCOC₆H₄CO–]ₙ', value: 60, color: '#f0fdfa', desc: 'Polyethylene terephthalate — drinks bottles and polyester fibre.' },
    { id: 'toluoylcl', name: 'm-Toluoyl chloride', f: 'CH₃C₆H₄COCl', value: 40, color: '#fefce8', desc: 'An acid chloride.' },
    { id: 'deet', name: 'DEET', f: 'C₁₂H₁₇NO', value: 180, color: '#fefce8', desc: 'N,N-Diethyl-m-toluamide — insect repellent.' },
    { id: 'tamylcl', name: '2-Chloro-2-methylbutane', f: 'CH₃CH₂C(CH₃)₂Cl', value: 20, color: '#f0f9ff', desc: 'A tertiary alkyl chloride.' },
    { id: 'bui', name: '1-Iodobutane', f: 'CH₃(CH₂)₃I', value: 55, color: '#fdf2f8', desc: 'A primary alkyl iodide.' },
    { id: 'methylbutene', name: '2-Methylbut-2-ene', f: '(CH₃)₂C=CHCH₃', value: 18, color: '#f0f9ff', desc: 'The Zaitsev alkene (bp 39 °C).' },
    { id: 'pinacolone', name: 'Pinacolone', f: '(CH₃)₃CCOCH₃', value: 45, color: '#f8fafc', desc: '3,3-Dimethylbutan-2-one.' },
    { id: 'vanillyl', name: 'Vanillyl alcohol', f: 'C₈H₁₀O₃', value: 65, color: '#ffffff', desc: 'The alcohol from reducing vanillin.' },
    { id: 'phenacetin', name: 'Phenacetin', f: 'C₁₀H₁₃NO₂', value: 280, color: '#ffffff', desc: 'A historic painkiller (withdrawn for kidney toxicity).' },
    { id: 'norbornene', name: 'Norbornene anhydride (endo)', f: 'C₉H₈O₃', value: 90, color: '#ffffff', desc: 'cis-Norbornene-5,6-endo-dicarboxylic anhydride.' },
    { id: 'gpa', name: 'Glucose pentaacetate', f: 'C₁₆H₂₂O₁₁', value: 85, color: '#ffffff', desc: 'Glucose with all five –OH groups acetylated.' },
  ]);

  reg('solvent', [
    { id: 's_acetone', name: 'Acetone', f: '(CH₃)₂CO', unlock: 100, use: 1, desc: 'Polar aprotic, bp 56 °C. Dissolves NaI but not NaBr.' },
    { id: 's_eg', name: 'Ethylene glycol', f: 'HOCH₂CH₂OH', unlock: 300, use: 1.5, desc: 'Polar protic, bp 197 °C — for very hot reactions.' },
    { id: 's_mecn', name: 'Acetonitrile', f: 'CH₃CN', unlock: 600, use: 2, desc: 'Polar aprotic, bp 82 °C. Popular for Pd chemistry.' },
  ]);

  reg('additive', [
    { id: 'a_koh', name: 'Potassium hydroxide (cat.)', f: 'KOH', unlock: 150, use: 2, desc: 'Base catalyst for transesterification.' },
    { id: 'a_piperidine', name: 'Piperidine', f: 'C₅H₁₁N', unlock: 500, use: 10, desc: 'A secondary amine catalyst for Knoevenagel condensations.' },
    { id: 'a_thiamine', name: 'Thiamine (vitamin B₁)', f: 'C₁₂H₁₇N₄OS⁺', unlock: 1500, use: 20, desc: 'A green, non-toxic catalyst for the benzoin condensation.' },
    { id: 'a_hcl', name: 'Hydrochloric acid (cat.)', f: 'HCl', unlock: 200, use: 1, desc: 'Brønsted acid catalyst.' },
    { id: 'a_zncl2', name: 'Zinc chloride', f: 'ZnCl₂', unlock: 2000, use: 5, desc: 'A Lewis acid condensing agent.' },
    { id: 'a_naoac', name: 'Sodium acetate', f: 'CH₃COONa', unlock: 150, use: 2, desc: 'A mild base catalyst for acetylations.' },
    { id: 'a_bpo', name: 'Benzoyl peroxide', f: '(C₆H₅CO₂)₂', unlock: 4000, use: 30, desc: 'Radical initiator: splits into radicals on heating.' },
    { id: 'a_snoct', name: 'Tin(II) octoate', f: 'Sn(C₈H₁₅O₂)₂', unlock: 8000, use: 60, desc: 'Catalyst for ring-opening polymerisation.' },
    { id: 'a_sb2o3', name: 'Antimony trioxide', f: 'Sb₂O₃', unlock: 8000, use: 40, desc: 'The industrial PET polycondensation catalyst.' },
    { id: 'a_pdoac', name: 'Palladium(II) acetate', f: 'Pd(OAc)₂', unlock: 30000, use: 1800, desc: 'The workhorse Heck-reaction catalyst.' },
    { id: 'a_pdcu', name: 'PdCl₂(PPh₃)₂ / CuI', f: 'Pd/Cu', unlock: 40000, use: 2000, desc: 'Palladium + copper co-catalyst for Sonogashira couplings.' },
  ]);


  // ───────── expansion 2: stepped A-level style pathways ─────────
  reg('reagent', [
    { id: 'cyclohexane', name: 'Cyclohexane', f: 'C₆H₁₂', cost: 3, desc: 'A cycloalkane — saturated and unreactive.' },
    { id: 'isobutane', name: '2-Methylpropane', f: '(CH₃)₃CH', cost: 2, desc: 'Isobutane: an alkane with one tertiary C–H.' },
    { id: 'toluene', name: 'Methylbenzene', f: 'C₆H₅CH₃', cost: 2, desc: 'Toluene, as a reagent. Its CH₃ is a benzylic position.' },
    { id: 'br2', name: 'Bromine', f: 'Br₂', cost: 6, color: '#b45309', desc: 'A red-brown, corrosive liquid halogen.' },
    { id: 'hbr', name: 'Hydrogen bromide', f: 'HBr', cost: 3, desc: 'A strong acid gas.' },
    { id: 'kcn', name: 'Potassium cyanide', f: 'KCN', cost: 5, desc: 'Source of the cyanide nucleophile. Extremely toxic.' },
    { id: 'lialh4', name: 'Lithium aluminium hydride', f: 'LiAlH₄', cost: 50, desc: 'A powerful hydride reductant. Reacts violently with water.' },
    { id: 'k2cr2o7', name: 'Potassium dichromate', f: 'K₂Cr₂O₇', cost: 6, color: '#f97316', desc: 'Orange oxidant; turns green (Cr³⁺) when it oxidises something.' },
    { id: 'i2', name: 'Iodine', f: 'I₂', cost: 10, color: '#4c1d95', desc: 'A purple-black solid halogen.' },
    { id: 'benzene', name: 'Benzene', f: 'C₆H₆', cost: 3, desc: 'The parent aromatic hydrocarbon. Carcinogenic.' },
    { id: 'sn', name: 'Tin', f: 'Sn', cost: 8, color: '#cbd5e1', desc: 'A metal reducing agent (with HCl).' },
    { id: 'accl', name: 'Ethanoyl chloride', f: 'CH₃COCl', cost: 6, desc: 'Acetyl chloride — a reactive acyl chloride.' },
    { id: 'dnph', name: '2,4-Dinitrophenylhydrazine', f: '(O₂N)₂C₆H₃NHNH₂', cost: 25, color: '#f59e0b', desc: "Brady's reagent: tests for C=O groups." },
  ]);

  reg('product', [
    { id: 'bromocyclohexane', name: 'Bromocyclohexane', f: 'C₆H₁₁Br', value: 35, color: '#fff7ed', desc: 'A secondary haloalkane.' },
    { id: 'tbubr', name: '2-Bromo-2-methylpropane', f: '(CH₃)₃CBr', value: 30, color: '#fff7ed', desc: 'A tertiary haloalkane.' },
    { id: 'bnbr', name: '(Bromomethyl)benzene', f: 'C₆H₅CH₂Br', value: 30, color: '#fff7ed', desc: 'Benzyl bromide — a lachrymator (tear gas).' },
    { id: 'methylpropene', name: '2-Methylpropene', f: '(CH₃)₂C=CH₂', value: 50, color: '#f0f9ff', desc: 'Isobutylene — an alkene gas.' },
    { id: 'ethene', name: 'Ethene', f: 'CH₂=CH₂', value: 13, color: '#f0f9ff', desc: 'The simplest alkene; the world\'s top petrochemical.' },
    { id: 'ethanal', name: 'Ethanal', f: 'CH₃CHO', value: 25, color: '#f0f9ff', desc: 'Acetaldehyde (bp 21 °C).' },
    { id: 'cyanohydrin', name: '2-Hydroxypropanenitrile', f: 'CH₃CH(OH)CN', value: 55, color: '#f8fafc', desc: 'A hydroxynitrile (cyanohydrin).' },
    { id: 'lactic', name: '2-Hydroxypropanoic acid', f: 'CH₃CH(OH)COOH', value: 90, color: '#fefce8', desc: 'Lactic acid — monomer of PLA.' },
    { id: 'dbe', name: '1,2-Dibromoethane', f: 'BrCH₂CH₂Br', value: 40, color: '#fff7ed', desc: 'The product that forms when ethene decolourises bromine.' },
    { id: 'ethylamine', name: 'Ethylamine', f: 'CH₃CH₂NH₂', value: 45, color: '#f8fafc', desc: 'Ethanamine — a primary amine.' },
    { id: 'propanenitrile', name: 'Propanenitrile', f: 'CH₃CH₂CN', value: 40, color: '#f8fafc', desc: 'A nitrile: one carbon longer than the haloalkane it came from.' },
    { id: 'propanoic', name: 'Propanoic acid', f: 'CH₃CH₂COOH', value: 70, color: '#f8fafc', desc: 'A preservative (E280).' },
    { id: 'propylamine', name: 'Propan-1-amine', f: 'CH₃CH₂CH₂NH₂', value: 150, color: '#f8fafc', desc: 'Propylamine — a primary amine.' },
    { id: 'bncn', name: 'Phenylacetonitrile', f: 'C₆H₅CH₂CN', value: 60, color: '#f8fafc', desc: 'Benzyl cyanide.' },
    { id: 'phenylacetic', name: 'Phenylacetic acid', f: 'C₆H₅CH₂COOH', value: 100, color: '#ffffff', desc: 'Precursor to penicillin G.' },
    { id: 'iodoform', name: 'Triiodomethane', f: 'CHI₃', value: 110, color: '#facc15', desc: 'Iodoform: yellow crystals with an antiseptic smell.' },
    { id: 'nitrobenzene', name: 'Nitrobenzene', f: 'C₆H₅NO₂', value: 30, color: '#fef3c7', desc: 'A pale yellow oil smelling of almonds.' },
    { id: 'benzoic', name: 'Benzoic acid', f: 'C₆H₅COOH', value: 55, color: '#ffffff', desc: 'A food preservative (E210).' },
    { id: 'dnp_hydrazone', name: 'Propanone 2,4-DNP-hydrazone', f: 'C₉H₁₀N₄O₄', value: 80, color: '#f97316', desc: "The orange precipitate of Brady's test." },
    { id: 'tribromophenol', name: '2,4,6-Tribromophenol', f: 'C₆H₂Br₃OH', value: 65, color: '#ffffff', desc: 'The white precipitate from phenol + bromine water.' },
  ]);

  reg('additive', [
    { id: 'a_uv', name: 'UV lamp (hν)', f: 'hν', unlock: 120, use: 0.5, always: true, desc: 'Ultraviolet light splits halogen molecules into radicals.' },
    { id: 'a_febr3', name: 'Iron(III) bromide', f: 'FeBr₃', unlock: 300, use: 3, desc: 'A halogen carrier: polarises Br₂ into an electrophile.' },
  ]);


  // ───────── expansion 3: filling the map ─────────
  reg('reagent', [
    { id: 'nash', name: 'Sodium hydrosulfide', f: 'NaSH', cost: 4, desc: 'Source of the HS⁻ nucleophile. Smells of rotten eggs.' },
    { id: 'tollens', name: "Tollens' reagent", f: '[Ag(NH₃)₂]⁺', cost: 8, desc: 'Ammoniacal silver nitrate — a gentle oxidant that plates out a silver mirror.' },
    { id: 'ipa', name: 'Propan-2-ol', f: 'CH₃CH(OH)CH₃', cost: 2, desc: 'Isopropyl alcohol — a secondary alcohol.' },
    { id: 'dryice', name: 'Dry ice', f: 'CO₂(s)', cost: 1, desc: 'Solid carbon dioxide (−78 °C) — an electrophile for Grignards.' },
    { id: 'oleum', name: 'Fuming sulfuric acid', f: 'H₂SO₄·SO₃', cost: 4, desc: 'Oleum: sulfuric acid with dissolved SO₃, the sulfonating electrophile.' },
    { id: 'cubr', name: 'Copper(I) bromide', f: 'CuBr', cost: 12, desc: 'The Sandmeyer reagent.' },
    { id: 'vcm', name: 'Chloroethene', f: 'CH₂=CHCl', cost: 3, desc: 'Vinyl chloride monomer.' },
    { id: 'tpcl', name: 'Terephthaloyl chloride', f: 'C₆H₄(COCl)₂', cost: 30, desc: 'An aromatic diacid chloride.' },
    { id: 'ppd', name: 'Benzene-1,4-diamine', f: 'C₆H₄(NH₂)₂', cost: 25, desc: 'p-Phenylenediamine — an aromatic diamine.' },
    { id: 'hcho', name: 'Methanal (formalin)', f: 'HCHO', cost: 2, desc: 'Formaldehyde as a 37% aqueous solution.' },
  ]);
  reg('product', [
    { id: 'butanethiol', name: 'Butane-1-thiol', f: 'CH₃(CH₂)₃SH', value: 50, color: '#fefce8', desc: 'A thiol — part of skunk spray.' },
    { id: 'diethylether', name: 'Ethoxyethane', f: 'C₂H₅OC₂H₅', value: 50, color: '#f0f9ff', desc: 'Diethyl ether — once the classic anaesthetic.' },
    { id: 'acetal', name: '1,1-Diethoxyethane', f: 'CH₃CH(OC₂H₅)₂', value: 55, color: '#f0f9ff', desc: 'An acetal: an aldehyde protected from nucleophiles.' },
    { id: 'silver', name: 'Silver (mirror)', f: 'Ag', value: 30, color: '#d1d5db', desc: 'Metallic silver from the Tollens test.' },
    { id: 'acetonecn', name: '2-Hydroxy-2-methylpropanenitrile', f: '(CH₃)₂C(OH)CN', value: 35, color: '#f8fafc', desc: 'Acetone cyanohydrin — the route to Perspex (MMA).' },
    { id: 'ethanamide', name: 'Ethanamide', f: 'CH₃CONH₂', value: 25, color: '#ffffff', desc: 'Acetamide, a primary amide.' },
    { id: 'nethylamide', name: 'N-Ethylethanamide', f: 'CH₃CONHC₂H₅', value: 145, color: '#ffffff', desc: 'A secondary (N-substituted) amide.' },
    { id: 'phenylacetate', name: 'Phenyl ethanoate', f: 'CH₃COOC₆H₅', value: 40, color: '#fefce8', desc: 'Phenols are esterified with acyl chlorides, not acids.' },
    { id: 'aminonitrile', name: '2-Aminopropanenitrile', f: 'CH₃CH(NH₂)CN', value: 60, color: '#f8fafc', desc: 'The Strecker intermediate.' },
    { id: 'alanine', name: 'Alanine', f: 'CH₃CH(NH₂)COOH', value: 100, color: '#ffffff', desc: 'An amino acid (made racemic here).' },
    { id: 'sulfonic', name: 'Benzenesulfonic acid', f: 'C₆H₅SO₃H', value: 25, color: '#ffffff', desc: 'A strong organic acid; detergent precursor.' },
    { id: 'ethylbenzoate', name: 'Ethyl benzoate', f: 'C₆H₅COOC₂H₅', value: 110, color: '#fefce8', desc: 'A fruity aromatic ester.' },
    { id: 'pvc', name: 'PVC', f: '[–CH₂CHCl–]ₙ', value: 25, color: '#f5f5f5', desc: 'Poly(chloroethene) — pipes and window frames.' },
    { id: 'kevlar', name: 'Kevlar', f: '[–NHC₆H₄NHCOC₆H₄CO–]ₙ', value: 220, color: '#facc15', desc: 'An aromatic polyamide five times stronger than steel by weight.' },
    { id: 'bakelite', name: 'Bakelite', f: '(C₆H₆O·CH₂O)ₙ', value: 30, color: '#92400e', desc: 'The first fully synthetic plastic (1907): a phenol–methanal resin.' },
  ]);
  reg('solvent', [
    { id: 's_nmp', name: 'N-Methylpyrrolidone', f: 'NMP', unlock: 1500, use: 3, desc: 'Polar aprotic, bp 202 °C. Dissolves rigid polymers like Kevlar.' },
  ]);
  reg('additive', [
    { id: 'a_lindlar', name: 'Lindlar catalyst', f: 'Pd/CaCO₃/Pb', unlock: 12000, use: 300, desc: 'A "poisoned" palladium catalyst that stops alkyne hydrogenation at the cis-alkene.' },
    { id: 'a_pdc', name: 'Palladium on carbon', f: 'Pd/C', unlock: 15000, use: 400, desc: 'The everyday hydrogenation catalyst.' },
  ]);

  CC.ITEM_LIST = Object.values(CC.ITEMS);

  // 'none' is a valid choice for both the solvent and additive slots.
  CC.itemName = (id) => (id === 'none' ? 'None' : CC.ITEMS[id] ? CC.ITEMS[id].name : id);
})();
