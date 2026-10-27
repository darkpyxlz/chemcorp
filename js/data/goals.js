var CC = (globalThis.CC = globalThis.CC || {});

// Sequential objectives that guide new players. check(S, G) → boolean.
CC.GOALS = (function () {
  const runs = (S, id) => (S.recipes[id] ? S.recipes[id].runs : 0);
  const passed = (S) => Object.values(S.courses).filter((c) => c.passed).length;
  return [
    { id: 'g_first', text: 'Make your first ester: acetic acid + ethanol with a drop of H₂SO₄, warmed to ~75 °C. Work it up when the yield curve flattens.', check: (S) => runs(S, 'etoac') >= 1, reward: { money: 20 } },
    { id: 'g_sell', text: 'Sell some ethyl acetate on the Market.', check: (S) => S.stats.sold > 0, reward: { rp: 3 } },
    { id: 'g_study', text: 'Study "Lab Fundamentals" in the Academy and pass its quiz.', check: (S) => !!(S.courses.lab_basics && S.courses.lab_basics.passed), reward: { money: 30 } },
    { id: 'g_research', text: 'Research a new technology (try Saponification — it needs the Organic Acids & Bases course).', check: (S) => Object.keys(S.tech).length > 1, reward: { money: 50 } },
    { id: 'g_school', text: 'Play a Chem School round in the Academy.', check: (S) => S.school && S.school.stats.rounds > 0, reward: { rp: 5 } },
    { id: 'g_puzzle', text: 'Try the Puzzles tab: name a molecule or push curly arrows in a mechanism.', check: (S) => !!S.puzzles && (S.puzzles.named > 0 || Object.keys(S.puzzles.mechs).length > 0), reward: { rp: 8 } },
    { id: 'g_buy', text: 'Buy reagents on the Market to keep your lab supplied.', check: (S) => S.stats.bought > 0, reward: { rp: 5 } },
    { id: 'g_500', text: 'Earn $500 in total.', check: (S) => S.stats.lifetimeEarned >= 500, reward: { rp: 10 } },
    { id: 'g_five', text: 'Successfully run 5 different reactions.', check: (S) => Object.values(S.recipes).filter((r) => r.runs >= 1).length >= 5, reward: { money: 300 } },
    { id: 'g_auto', text: 'Research Lab Automation.', check: (S) => !!S.tech.t_automation, reward: { money: 200 } },
    { id: 'g_reactor', text: 'Build your first automated reactor in the Plant.', check: (S) => Object.values(S.reactors).some((g) => g.n > 0), reward: { rp: 25 } },
    { id: 'g_route', text: 'Plan a complete synthesis route in the Puzzles tab.', check: (S) => !!S.puzzles && S.puzzles.routes > 0, reward: { rp: 40 } },
    { id: 'g_10k', text: 'Earn $10K in total.', check: (S) => S.stats.lifetimeEarned >= 1e4, reward: { rp: 60 } },
    { id: 'g_courses5', text: 'Pass 5 Academy courses.', check: (S) => passed(S) >= 5, reward: { money: 2000 } },
    { id: 'g_grignard', text: 'Make triphenylmethanol via a Grignard reaction.', check: (S) => runs(S, 'trityl') >= 1, reward: { rp: 400 } },
    { id: 'g_100k', text: 'Earn $100K in total.', check: (S) => S.stats.lifetimeEarned >= 1e5, reward: { rp: 800 } },
    { id: 'g_ibu', text: 'Synthesise ibuprofen by the three-step BHC route.', check: (S) => runs(S, 'ibuprofen') >= 1, reward: { money: 100000 } },
    { id: 'g_1m', text: 'Earn $1M in total.', check: (S) => S.stats.lifetimeEarned >= 1e6, reward: { rp: 3000 } },
    { id: 'g_5cb', text: 'Make 5CB liquid crystal with a Suzuki coupling.', check: (S) => runs(S, 'lc5cb') >= 1, reward: { rp: 5000 } },
    { id: 'g_all', text: 'Pass every Academy course.', check: (S) => passed(S) >= CC.COURSES.length, reward: { rp: 5000 } },
    { id: 'g_patent', text: 'File your first patents (prestige).', check: (S) => S.patents > 0, reward: { rp: 1000 } },
  ];
})();
