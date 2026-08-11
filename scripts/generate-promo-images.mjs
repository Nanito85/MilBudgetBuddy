/**
 * Generates the two App Store Connect promotional images for the Pro
 * subscription in-app purchases (mbb_pro_monthly / mbb_pro_annual).
 *
 * Apple rejected the submission (Guideline 2.3.2) because the promotional
 * image was identical to the app icon, and because the two IAP products
 * shared the same image. These are deliberately distinct from the icon
 * (marketing copy, plan-specific pricing/badge) and from each other
 * (different headline, badge, and accent color per plan).
 *
 * Spec: 1024×1024, PNG, no alpha channel (flattened to the bg color).
 * Requires: sharp   (npm install --save-dev sharp)
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'assets', 'images');

const BG = '#04080F';
const TEAL = '#00C8A8';
const AMBER = '#F0A500';

// Small helmet+$ mark (same silhouette as the app icon) used as a corner
// badge only — not the dominant element, so this doesn't read as "the icon".
const HELMET_MARK = (fill, accent) => `
  <g transform="translate(512,150) scale(0.34)">
    <ellipse cx="0" cy="-20" rx="280" ry="250" fill="${fill}"/>
    <rect x="-280" y="-20" width="560" height="110" fill="${fill}"/>
    <rect x="-364" y="78" width="728" height="68" rx="22" fill="${fill}" opacity="0.85"/>
    <circle cx="0" cy="-40" r="130" fill="#000000" opacity="0.30"/>
    <text x="0" y="16" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
      font-weight="900" font-size="188" fill="${accent}">$</text>
  </g>`;

function promoSvg({ badge, badgeColor, headline, price, sub, accent }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${BG}"/>
  <ellipse cx="512" cy="512" rx="500" ry="500" fill="none" stroke="${accent}" stroke-width="4" opacity="0.12"/>

  ${HELMET_MARK(accent, '#04080F')}

  <text x="512" y="380" text-anchor="middle" font-family="Arial, sans-serif"
    font-weight="800" font-size="34" letter-spacing="4" fill="#8FA3B8">MILBUDGETBUDDY PRO</text>

  <rect x="362" y="420" width="300" height="64" rx="32" fill="${badgeColor}"/>
  <text x="512" y="462" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="30" letter-spacing="1" fill="#04080F">${badge}</text>

  <text x="512" y="600" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="88" fill="#FFFFFF">${headline}</text>

  <text x="512" y="670" text-anchor="middle" font-family="Arial, sans-serif"
    font-weight="700" font-size="40" fill="${accent}">${price}</text>

  <text x="512" y="760" text-anchor="middle" font-family="Arial, sans-serif"
    font-weight="500" font-size="28" fill="#C7D2DD">${sub}</text>
</svg>`.trim();
}

const monthlySvg = promoSvg({
  badge: '7 DAYS FREE',
  badgeColor: TEAL,
  headline: 'PRO MONTHLY',
  price: '$4.99 / month',
  sub: 'Full pay, budget and benefits suite',
  accent: TEAL,
});

const annualSvg = promoSvg({
  badge: 'BEST VALUE',
  badgeColor: AMBER,
  headline: 'PRO ANNUAL',
  price: '$49.99 / year',
  sub: 'Save vs. paying monthly',
  accent: AMBER,
});

async function makePromo(svgStr, outPath) {
  await sharp(Buffer.from(svgStr))
    .resize(1024, 1024)
    .flatten({ background: BG }) // no alpha channel — ASC rejects images with transparency
    .png()
    .toFile(outPath);
  console.log(`  ✓  ${outPath}`);
}

async function main() {
  console.log('Generating IAP promotional images…');
  await makePromo(monthlySvg, join(OUT, 'promo-pro-monthly.png'));
  await makePromo(annualSvg, join(OUT, 'promo-pro-annual.png'));
  console.log('Done. Upload these in App Store Connect under each IAP product\'s "Promotional Image" field.');
}

main().catch((e) => { console.error(e); process.exit(1); });
