/**
 * upload-to-appetize.mjs
 *
 * Downloads the latest EAS preview APK and uploads it to Appetize.io.
 * Run: node scripts/upload-to-appetize.mjs --token YOUR_APPETIZE_TOKEN
 *
 * Prerequisites:
 *   npm install -g eas-cli
 *   node 18+
 *
 * First time: creates a new app on Appetize and prints the public key.
 * Re-runs:    update the existing app (pass --key EXISTING_KEY).
 */

import { execSync } from 'child_process';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import https from 'https';
import http from 'http';
import { parseArgs } from 'util';
import path from 'path';

// ── Parse CLI args ────────────────────────────────────────────────────────────
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    token: { type: 'string' },   // Appetize API token (required)
    key:   { type: 'string' },   // Existing Appetize public key (optional, for updates)
  },
});

if (!values.token) {
  console.error('Usage: node scripts/upload-to-appetize.mjs --token YOUR_TOKEN [--key EXISTING_KEY]');
  process.exit(1);
}

const APK_PATH = path.join(process.cwd(), 'build-preview.apk');

// ── Step 1: Get latest APK URL from EAS ───────────────────────────────────────
console.log('\n📡  Fetching latest EAS preview build...');
let apkUrl;
try {
  const raw = execSync(
    'npx eas build:list --platform android --status finished --limit 1 --json --non-interactive',
    { stdio: ['pipe', 'pipe', 'pipe'] },
  ).toString();
  const builds = JSON.parse(raw);
  if (!builds?.length) throw new Error('No finished builds found.');
  apkUrl = builds[0].artifacts?.buildUrl;
  if (!apkUrl) throw new Error('Build has no artifact URL yet.');
  console.log('✅  Build URL:', apkUrl);
} catch (err) {
  console.error('❌  Could not fetch EAS build list:', err.message);
  process.exit(1);
}

// ── Step 2: Download APK ──────────────────────────────────────────────────────
console.log('\n⬇️   Downloading APK...');
await new Promise((resolve, reject) => {
  const file = createWriteStream(APK_PATH);
  const get = apkUrl.startsWith('https') ? https.get : http.get;
  get(apkUrl, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      // Follow redirect
      const redir = apkUrl.startsWith('https') ? https.get : http.get;
      redir(res.headers.location, (r2) => { r2.pipe(file); file.on('finish', () => file.close(resolve)); })
        .on('error', reject);
    } else {
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }
  }).on('error', reject);
});
console.log('✅  Downloaded to', APK_PATH);

// ── Step 3: Upload to Appetize ────────────────────────────────────────────────
console.log('\n🚀  Uploading to Appetize.io...');

const isUpdate = !!values.key;
const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

function buildMultipart(filePath, existingKey) {
  const parts = [];
  // platform
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="platform"\r\n\r\nandroid`,
  );
  // note
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="note"\r\n\r\nMilBudgetBuddy preview`,
  );
  return parts.join('\r\n') + '\r\n';
}

const preamble = Buffer.from(
  `--${boundary}\r\nContent-Disposition: form-data; name="platform"\r\n\r\nandroid\r\n` +
  `--${boundary}\r\nContent-Disposition: form-data; name="note"\r\n\r\nMilBudgetBuddy preview\r\n` +
  `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="app.apk"\r\nContent-Type: application/octet-stream\r\n\r\n`,
);
const epilogue = Buffer.from(`\r\n--${boundary}--\r\n`);
const { size: apkSize } = await import('fs').then(m => Promise.resolve(m.statSync(APK_PATH)));
const contentLength = preamble.length + apkSize + epilogue.length;

const method = 'POST';
const path2 = isUpdate
  ? `/v1/apps/${values.key}`
  : '/v1/apps';

const result = await new Promise((resolve, reject) => {
  const req = https.request(
    {
      hostname: 'api.appetize.io',
      path: path2,
      method,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(values.token + ':').toString('base64'),
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': contentLength,
      },
    },
    (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ error: body }); }
      });
    },
  );
  req.on('error', reject);
  req.write(preamble);
  const fileStream = createReadStream(APK_PATH);
  fileStream.on('data', (chunk) => req.write(chunk));
  fileStream.on('end', () => { req.write(epilogue); req.end(); });
});

// ── Cleanup ───────────────────────────────────────────────────────────────────
if (existsSync(APK_PATH)) await unlink(APK_PATH);

// ── Print result ──────────────────────────────────────────────────────────────
if (result.publicKey) {
  console.log('\n✅  Upload successful!\n');
  console.log('🔑  Public key:', result.publicKey);
  console.log('🌐  Shareable link: https://appetize.io/app/' + result.publicKey);
  console.log('\nTo update the app next time, run:');
  console.log(`  node scripts/upload-to-appetize.mjs --token YOUR_TOKEN --key ${result.publicKey}`);
} else {
  console.error('\n❌  Upload failed:', JSON.stringify(result, null, 2));
  process.exit(1);
}
