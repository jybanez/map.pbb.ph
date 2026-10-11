import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const repo = 'C:/wamp64/www/hotline-helpers';
const revision = '62b019895917d1d8e67fe3fa864763ec97473e8b';
const manifest = JSON.parse(execFileSync('git', ['-C', repo, 'show', `${revision}:docs/signal-strength-runtime.json`], { encoding: 'utf8' }));
const vendor = JSON.parse(readFileSync('vendor/manifest.json', 'utf8'));
for (const artifact of manifest.artifacts) {
  const bytes = execFileSync('git', ['-C', repo, 'show', `${revision}:${artifact.path}`], { maxBuffer: 4000000 }).toString('utf8').replace(/\r\n/g, '\n');
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== artifact.sha256) throw new Error(`Approved artifact mismatch: ${artifact.path}`);
  const path = `vendor/helpers/${artifact.path}`;
  writeFileSync(path, bytes); vendor.files[path] = hash;
}
vendor.signalStateChange = { revision, version: '0.21.285', checksumEncoding: manifest.checksumEncoding };
writeFileSync('vendor/manifest.json', JSON.stringify(vendor, null, 2) + '\n');
console.log('Verified and adopted five approved Helper signal artifacts.');
