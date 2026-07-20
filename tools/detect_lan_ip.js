const os = require('os');

const candidates = [];
for (const entries of Object.values(os.networkInterfaces())) {
  for (const entry of entries || []) {
    if (!entry || entry.family !== 'IPv4' || entry.internal) continue;
    const address = String(entry.address || '').trim();
    if (!address || address === '127.0.0.1' || address.startsWith('169.254.')) continue;
    const isPrivate = /^10\./.test(address) ||
      /^192\.168\./.test(address) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address);
    candidates.push({ address, score: isPrivate ? 2 : 1 });
  }
}

candidates.sort((left, right) => right.score - left.score);
if (candidates[0]) {
  process.stdout.write(candidates[0].address);
}