// Runs the game's own advise() against known basic-strategy answers.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const grab = name => { const i = src.indexOf(name); let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); } };
const lineOf = re => src.match(re)[0];
const code = [lineOf(/const rk = .*;/), lineOf(/const cv = .*;/), grab('function val('), lineOf(/const WORD = .*;/), grab('function advise(')].join('\n');
// card codes: rank index 0=A,1=2..9=10,10=J. Spades suit (0..12).
const C = r => ({ c: r === 'A' ? 0 : r === 'T' ? 9 : Number(r) - 1 });
const run = (rulesObj, cards, up, opts = {}) => {
  const f = new Function('R', 'rules', 'canDouble', 'canSplit', 'canSurrender', code + '\nreturn advise;');
  const R = { dealer: [C(up)] };
  const h = { cards: cards.map(C) };
  const adv = f(R, () => rulesObj, () => opts.d !== false && cards.length === 2, () => opts.p !== false && cards.length === 2 && cards[0] === cards[1], () => opts.s !== false && cards.length === 2);
  return adv(h);
};
const H17 = { h17: true, das: true }, S17 = { h17: false, das: true };
const cases = [
  // [rules, cards, dealer up, expected, opts]
  [H17, ['T','6'], 'T', 'surrender'], [H17, ['T','6'], '9', 'surrender'], [H17, ['T','6'], '7', 'hit'], [H17, ['T','6'], '6', 'stand'],
  [H17, ['T','6'], 'T', 'hit', { s: false }], [H17, ['T','5'], 'T', 'surrender'], [S17, ['T','5'], 'A', 'hit'], [H17, ['T','5'], 'A', 'surrender'],
  [H17, ['T','7'], 'A', 'surrender'], [S17, ['T','7'], 'A', 'stand'], [H17, ['T','2'], '3', 'hit'], [H17, ['T','2'], '4', 'stand'],
  [H17, ['T','3'], '2', 'stand'], [H17, ['6','5'], 'A', 'double'], [S17, ['6','5'], 'A', 'hit'], [H17, ['6','4'], 'T', 'hit'],
  [H17, ['6','4'], '9', 'double'], [H17, ['5','4'], '2', 'hit'], [H17, ['5','4'], '3', 'double'], [H17, ['5','3'], '6', 'hit'],
  [H17, ['A','7'], '2', 'double'], [S17, ['A','7'], '2', 'stand'], [H17, ['A','7'], '7', 'stand'], [H17, ['A','7'], '9', 'hit'],
  [H17, ['A','7'], '3', 'stand', { d: false }], [H17, ['A','8'], '6', 'double'], [S17, ['A','8'], '6', 'stand'], [H17, ['A','6'], '2', 'hit'],
  [H17, ['A','6'], '3', 'double'], [H17, ['A','2'], '4', 'hit'], [H17, ['A','2'], '5', 'double'], [H17, ['A','4'], '4', 'double'],
  [H17, ['A','A'], 'T', 'split'], [H17, ['8','8'], 'T', 'split'], [H17, ['8','8'], 'A', 'surrender'], [S17, ['8','8'], 'A', 'split'],
  [H17, ['9','9'], '7', 'stand'], [H17, ['9','9'], '8', 'split'], [H17, ['T','T'], '6', 'stand'], [H17, ['5','5'], '9', 'double'],
  [H17, ['4','4'], '5', 'split'], [{ h17: true, das: false }, ['4','4'], '5', 'hit'], [H17, ['2','2'], '2', 'split'], [{ h17: true, das: false }, ['2','2'], '2', 'hit'],
  [H17, ['7','7'], '8', 'hit'], [H17, ['6','6'], '2', 'split'], [H17, ['3','4','5'], 'T', 'hit'], [H17, ['T','2','4'], 'T', 'hit', { s: false }],
];
const bad = [];
for (const [r, cards, up, want, opts] of cases) { const got = run(r, cards, up, opts); if (got !== want) bad.push({ rules: r.h17 ? 'H17' : 'S17', cards: cards.join(','), up, want, got }); }
console.log(JSON.stringify({ cases: cases.length, wrong: bad }));
