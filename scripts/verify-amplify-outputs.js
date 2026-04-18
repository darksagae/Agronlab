/**
 * Sanity-check amplify_outputs.json shape (run from repo root):
 *   node scripts/verify-amplify-outputs.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const candidates = [
  path.join(root, 'amplify_outputs.json'),
  path.join(root, 'agrof-main/mobile/app/amplify_outputs.json'),
];
const file = candidates.find((p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
});
if (!file) {
  console.error('FAIL: no amplify_outputs.json (try npm run sandbox:once or npm run amplify:copy-outputs)');
  process.exit(1);
}
const raw = fs.readFileSync(file, 'utf8');
const outputs = JSON.parse(raw);

const needAuth = ['user_pool_id', 'user_pool_client_id', 'identity_pool_id', 'aws_region'];
const missing = needAuth.filter((k) => !outputs.auth || outputs.auth[k] == null);
if (missing.length) {
  console.error('FAIL: auth missing:', missing.join(', '));
  process.exit(1);
}

if (!outputs.storage?.bucket_name && !outputs.storage?.buckets?.length) {
  console.error('FAIL: storage bucket not defined');
  process.exit(1);
}

console.log('OK: amplify_outputs.json has auth + storage');
console.log('  file:', file);
console.log('  user_pool_id:', outputs.auth.user_pool_id);
console.log('  bucket:', outputs.storage.bucket_name || outputs.storage.buckets[0]?.bucket_name);
