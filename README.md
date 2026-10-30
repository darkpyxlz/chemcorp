# ⚗️ ChemCorp — an organic chemistry idle game

Run real reactions in a flask, sell the products, research new chemistry, learn it in the Academy, and automate your way to a chemical plant.

- **Lab** — pick reagents and equivalents, solvent, catalyst, atmosphere and bath temperature. Reactions follow simple kinetics: rate doubles every 10 °C, excess reagent speeds things up and shifts equilibria, overheating causes side reactions, and exothermic reactions heat themselves. A live yield-vs-time graph shows the rate (tangent) and projected yield; work up whenever you like — waiting longer gives more product with diminishing returns.
- **Market** — buy reagents, stock solvents/catalysts, sell products (prices drop as you flood a market), fill contracts.
- **Research** — a 50-node tech tree with 145 organic reactions and ~80 reagents: esters and fragrances, biodiesel, SN1/SN2/E1/E2, terpenes, Wittig, epoxidation, aldol/Claisen/Knoevenagel, benzoin → phenytoin, Biginelli and Hantzsch, sulfa drugs, dyes and indicators, Heck/Sonogashira/Suzuki, plastics, DEET, aspirin, Grignards, nitration, lidocaine, the BHC ibuprofen route and Suzuki coupling.
- **Research Points come only from learning** — the Lab and Plant earn money; RP (for research and RP-only *Know-how* techniques) comes from the Academy, Chem School and Puzzles.
- **Academy** — *Chem School*: five-question rounds (functional groups, IUPAC naming, reactions, conditions, course review) with spaced repetition — each item needs 10 counting reviews spread from 10 minutes to 2 weeks apart; answers pay RP (double the first time, nothing if too soon), plus streak and perfect-round bonuses, and a Learning list tracks everything. *Courses*: 16 lesson sets illustrated with figures (energy profiles, Maxwell–Boltzmann, reflux vs distillation, directing effects, catalytic cycles…), live skeletal formulas and curly-arrow mechanisms, each with an 8–9 question quiz that unlocks research.
- **Plant** — after enough manual runs, build reactors that run your procedures automatically (also offline, up to 8 h).
- **Upgrades** — incremental boosts.

- **Stepped pathways** — multi-step chains like alkane → haloalkane → alkene → alcohol → aldehyde/acid, haloalkane → nitrile → acid/amine, benzene → nitrobenzene → phenylamine. Choose *heat under reflux* or *distil* in the Lab (ethanol + dichromate gives ethanal or ethanoic acid).
- **Puzzles** — *Name it* (procedurally generated molecules drawn as skeletal formulas, IUPAC naming), *Build it* (draw the structure from a name), *Mechanisms* (click to draw curly arrows: SN1, SN2, E2, electrophilic and nucleophilic addition, addition–elimination, nitration, Grignard, NaBH₄), *Synthesis routes* (plan multi-step routes between compounds using A-level reagents & conditions).
- **Synthesis map** — a metro-style map of 55 compound types (alkanes to polyamides, plus an aromatic district) joined by 90+ reactions on colour-coded lines (substitution, elimination, addition, oxidation, reduction, hydrolysis, condensation, aromatic, organometallic, polymerisation). Click a station or line for reagents and conditions; reactions your lab knows link straight to the Lab.
- **Options** — save, export (clipboard or file), import (paste or file), autosave interval, light/dark theme, number notation, news ticker, offline progress, hotkeys.

The look is modelled on classic incremental games like Antimatter Dimensions: light theme, monospace type, boxed buttons, a news ticker, and "dimension"-style reactor rows with Build 1 / Max / Max all.

Play: open `index.html`, or serve the folder (`python3 -m http.server`). No build step.
Tests: `node tests/validate.js`.
