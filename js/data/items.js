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
    { id: 'soap', name: 'Soap', f: 'C₁₇H₃₅COO⁻Na⁺', value: 3, color: '#f5e6c8', desc: 'Sodium stearate — a surfactant with a polar head and greasy tail.' },
    { id: 'glycerol', name: 'Glycerol', f: 'C₃H₅(OH)₃', value: 4, color: '#eef6ff', desc: 'A sweet, viscous triol used in cosmetics and food.' },
    { id: 'etoac', name: 'Ethyl acetate', f: 'CH₃COOC₂H₅', value: 12, color: '#dff4ff', desc: 'A fruity-smelling solvent (nail-polish remover, decaf coffee).' },
    { id: 'isoamyl_ac', name: 'Isoamyl acetate', f: 'CH₃COO(CH₂)₂CH(CH₃)₂', value: 28, color: '#fff2a0', desc: '"Banana oil" — the main aroma of bananas.' },
    { id: 'aspirin', name: 'Aspirin', f: 'C₉H₈O₄', value: 45, color: '#ffffff', desc: 'Acetylsalicylic acid — painkiller, anti-inflammatory, anti-clotting.' },
    { id: 'tbucl', name: 'tert-Butyl chloride', f: '(CH₃)₃CCl', value: 18, color: '#e8f2ff', desc: '2-Chloro-2-methylpropane, a tertiary alkyl halide.' },
    { id: 'bubr', name: '1-Bromobutane', f: 'CH₃(CH₂)₃Br', value: 16, color: '#f0e8ff', desc: 'A primary alkyl bromide — great SN2 substrate.' },
    { id: 'nerolin', name: '2-Butoxynaphthalene', f: 'C₁₀H₇OC₄H₉', value: 75, color: '#f8f1ff', desc: 'An ether with a sweet orange-blossom scent used in perfumery.' },
    { id: 'cyclohexene', name: 'Cyclohexene', f: 'C₆H₁₀', value: 20, color: '#e9fbff', desc: 'A cyclic alkene (bp 83 °C).' },
    { id: 'benzhydrol', name: 'Diphenylmethanol', f: '(C₆H₅)₂CHOH', value: 70, color: '#fafafa', desc: 'Benzhydrol — a secondary alcohol and pharmaceutical building block.' },
    { id: 'phmgbr', name: 'Phenylmagnesium bromide', f: 'C₆H₅MgBr', value: 0, sellable: false, color: '#9a8f7a', desc: 'A Grignard reagent. Destroyed by air and water — use it, don\'t ship it.' },
    { id: 'trityl_oh', name: 'Triphenylmethanol', f: '(C₆H₅)₃COH', value: 180, color: '#ffffff', desc: 'A tertiary alcohol made by Grignard addition.' },
    { id: 'dba', name: 'Dibenzalacetone', f: '(C₆H₅CH=CH)₂CO', value: 80, color: '#ffd84d', desc: 'A bright yellow, UV-absorbing enone.' },
    { id: 'da_adduct', name: 'Anthracene–maleic anhydride adduct', f: 'C₁₈H₁₂O₃', value: 160, color: '#fffbea', desc: 'The Diels–Alder adduct formed across anthracene\'s central ring.' },
    { id: 'nitro_ester', name: 'Methyl 3-nitrobenzoate', f: 'O₂NC₆H₄CO₂CH₃', value: 75, color: '#f6efc2', desc: 'The meta-nitration product of methyl benzoate.' },
    { id: 'mapone', name: '4-Methoxyacetophenone', f: 'CH₃OC₆H₄COCH₃', value: 100, color: '#fff8ee', desc: 'An aromatic ketone with a sweet hawthorn-like odour.' },
    { id: 'diazonium', name: 'Diazonium salt', f: '⁻O₃SC₆H₄N₂⁺', value: 0, sellable: false, color: '#fff7dc', desc: 'Explosive when dry and decomposes above ~5 °C. Use immediately.' },
    { id: 'methyl_orange', name: 'Methyl orange', f: 'C₁₄H₁₄N₃NaO₃S', value: 180, color: '#ff7a1a', desc: 'An azo dye and pH indicator.' },
    { id: 'paracetamol', name: 'Paracetamol', f: 'C₈H₉NO₂', value: 200, color: '#ffffff', desc: 'Acetaminophen — analgesic and antipyretic.' },
    { id: 'benzocaine', name: 'Benzocaine', f: 'H₂NC₆H₄CO₂C₂H₅', value: 160, color: '#ffffff', desc: 'A topical local anaesthetic.' },
    { id: 'chloroamide', name: 'α-Chloro-2,6-dimethylacetanilide', f: 'ClCH₂CONHC₆H₃(CH₃)₂', value: 125, color: '#f7f7f0', desc: 'The lidocaine intermediate.' },
    { id: 'lidocaine', name: 'Lidocaine', f: 'C₁₄H₂₂N₂O', value: 700, color: '#ffffff', desc: 'An amide-type local anaesthetic and antiarrhythmic.' },
    { id: 'ibap', name: '4-Isobutylacetophenone', f: 'C₁₂H₁₆O', value: 70, color: '#fdf6e3', desc: 'Ibuprofen intermediate #1.' },
    { id: 'ibpe', name: '1-(4-Isobutylphenyl)ethanol', f: 'C₁₂H₁₈O', value: 120, color: '#fbfbf2', desc: 'Ibuprofen intermediate #2.' },
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

  CC.ITEM_LIST = Object.values(CC.ITEMS);

  // 'none' is a valid choice for both the solvent and additive slots.
  CC.itemName = (id) => (id === 'none' ? 'None' : CC.ITEMS[id] ? CC.ITEMS[id].name : id);
})();
