/**
 * NOT CURRENTLY USED — the promotional images this script generates were
 * REMOVED from both IAP products in App Store Connect (Sept 2026) rather
 * than fixed a 4th time. Round 3 fixed the "small/hard to read text"
 * complaint (Guideline 2.3.2), but Apple's actual follow-up rejection
 * revealed the real issue all along: the image displayed the price
 * ($4.99/mo, $49.99/yr), which Apple doesn't allow in this metadata since
 * pricing can vary by country/territory and is already shown on the
 * product page. Apple's own rejection explicitly names "delete the
 * promotional image" as a valid resolution when there's no active plan to
 * promote the product — that's the path taken here. Left in the repo in
 * case promotion is revisited later, but DO NOT price-reference the image
 * again if it's ever regenerated and re-uploaded.
 *
 * Generates the two App Store Connect promotional images for the Pro
 * subscription in-app purchases (mbb_pro_monthly / mbb_pro_annual).
 *
 * Round 1 rejection (Guideline 2.3.2): the promotional image was identical
 * to the app icon, and the two IAP products shared the same image. Fixed by
 * making these distinct from the icon (marketing copy, plan-specific
 * pricing/badge) and from each other (different headline, badge, and accent
 * color per plan).
 *
 * Round 2 rejection (Guideline 2.3.2, again): "promotional image includes
 * text that is small or otherwise hard to read." Cut from five text
 * elements to three (badge, plan name, price) and enlarged them — still
 * rejected with the identical wording. Confirmed (asked the user directly)
 * that the v2 images actually were uploaded to ASC before that submission,
 * so this wasn't a stale-metadata issue — the v2 sizing genuinely wasn't
 * legible enough at whatever small size Apple surfaces this image at
 * (App Store placements show it much smaller than a 1024px canvas suggests
 * — closer to app-icon size in some contexts).
 *
 * Round 3 fix: stopped treating 1024px canvas space as a budget to spend
 * mostly on background/decoration. Removed the helmet/icon mark entirely
 * (redundant — the app icon already appears next to this on the product
 * page) and the thin decorative ring, freeing the whole canvas for content.
 * Every text element is now dramatically larger and the layout fills most
 * of the frame edge-to-edge instead of sitting in a small centered block:
 * badge 42→72px, headline 108→190px, price 64→120px. Even the SMALLEST
 * text on the canvas (the badge) is now ~7% of the image height, vs. ~4%
 * in v2 — nothing on this image is "small" at any plausible display size.
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

// The headline uses textLength+lengthAdjust to force an exact 900px render
// width regardless of the word — a first pass at 190px/no constraint let
// "MONTHLY" (wider glyphs than "ANNUAL") overflow past the canvas edge and
// get clipped. This guarantees no clipping and consistent sizing between
// plans no matter what the plan name text ends up being in the future.
function promoSvg({ badge, badgeColor, headline, price, accent }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${BG}"/>

  <rect x="182" y="180" width="660" height="130" rx="65" fill="${badgeColor}"/>
  <text x="512" y="268" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="72" letter-spacing="1" fill="#04080F">${badge}</text>

  <text x="512" y="560" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="150" textLength="900" lengthAdjust="spacingAndGlyphs" fill="#FFFFFF">${headline}</text>

  <text x="512" y="740" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="120" fill="${accent}">${price}</text>
</svg>`.trim();
}

// Same two products, same distinguishing badge/headline/price/accent per
// plan as before — only the sizing and layout changed in round 3.
const monthlySvg = promoSvg({
  badge: '7 DAYS FREE',
  badgeColor: TEAL,
  headline: 'MONTHLY',
  price: '$4.99/mo',
  accent: TEAL,
});

const annualSvg = promoSvg({
  badge: 'BEST VALUE',
  badgeColor: AMBER,
  headline: 'ANNUAL',
  price: '$49.99/yr',
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
