const { createHash } = require('crypto');
const chain = JSON.parse(require('fs').readFileSync('data/chain.json', 'utf8'));
let valid = true;
for (let i = 1; i < chain.length; i++) {
  const b = chain[i];
  const prev = chain[i - 1];
  const input = b.index + b.previousHash + b.timestamp + JSON.stringify(b.data) + b.nonce;
  const recalc = createHash('sha256').update(input).digest('hex');
  const hashMatch = recalc === b.hash;
  const linkMatch = b.previousHash === prev.hash;
  if (!hashMatch || !linkMatch) {
    valid = false;
    console.log('BROKEN at block', i);
    console.log('  hashMatch:', hashMatch, 'linkMatch:', linkMatch);
    if (!hashMatch) {
      console.log('  stored:', b.hash);
      console.log('  recalc:', recalc);
      console.log('  keys:', Object.keys(b.data));
    }
  }
}
console.log(valid ? 'Chain VALID' : 'Chain BROKEN');
