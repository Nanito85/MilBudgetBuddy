/**
 * Generates the MilBudgetBuddy app icon:
 * Dark navy background + green military helmet silhouette + dollar sign.
 *
 * Requires: sharp   (npm install --save-dev sharp)
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'assets', 'images');

// ── Shared helmet path (centred in 1024×1024, helmet occupies ~560px tall) ───
// Drawn as a proper military helmet silhouette using a path:
//   - rounded dome top
//   - straight sides tapering slightly
//   - wide brim that extends past the dome on both sides
// Dollar sign sits centred on the dome face.

// The helmet is built from basic SVG shapes so it renders without font issues.
const HELMET_SHAPES = (helmetFill, brimFill, accentFill) => `
  <!-- Dome: rounded top half using a half-ellipse clip -->
  <ellipse cx="512" cy="460" rx="280" ry="250" fill="${helmetFill}"/>

  <!-- Side walls (rectangle to square off the bottom of the dome) -->
  <rect x="232" y="460" width="560" height="110" fill="${helmetFill}"/>

  <!-- Brim: wide flat bar below the dome walls -->
  <rect x="148" y="558" width="728" height="68" rx="22" fill="${brimFill}"/>

  <!-- Highlight arc on dome top-left -->
  <ellipse cx="440" cy="340" rx="110" ry="55"
    fill="#FFFFFF" opacity="0.10" transform="rotate(-20 440 340)"/>

  <!-- Darker inner band at brim join for depth -->
  <rect x="232" y="540" width="560" height="30" fill="${brimFill}" opacity="0.6"/>

  <!-- Dollar sign disc backdrop -->
  <circle cx="512" cy="440" r="130" fill="#000000" opacity="0.30"/>

  <!-- Dollar sign -->
  <text
    x="512" y="496"
    text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="188"
    fill="${accentFill}">$</text>
`;

// ── Full colour icon (dark bg + teal helmet + amber $) ────────────────────────
const svgFull = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="180" fill="#04080F"/>
  ${HELMET_SHAPES('#00C8A8', '#00A88A', '#F0A500')}
  <ellipse cx="512" cy="512" rx="490" ry="490"
    fill="none" stroke="#00C8A8" stroke-width="5" opacity="0.15"/>
</svg>`.trim();

// ── Android foreground (transparent bg, teal helmet + amber $) ────────────────
const svgFg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${HELMET_SHAPES('#00C8A8', '#00A88A', '#F0A500')}
</svg>`.trim();

// ── Android monochrome (white silhouette, transparent bg) ─────────────────────
// Android tints this with the themed colour automatically; just needs white shapes.
const svgMono = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${HELMET_SHAPES('#FFFFFF', '#DDDDDD', '#FFFFFF')}
</svg>`.trim();

// ── Splash / notification icon: white helmet on transparent, 192px ─────────────
// Scale the helmet to fit neatly in a 192×192 canvas (scale factor ~0.1875).
// Using a dedicated small SVG for clarity at notification icon sizes.
const svgSplash = `
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <!-- Dome -->
  <ellipse cx="96" cy="86" rx="52" ry="47" fill="#FFFFFF"/>
  <!-- Walls -->
  <rect x="44" y="86" width="104" height="20" fill="#FFFFFF"/>
  <!-- Brim -->
  <rect x="26" y="102" width="140" height="14" rx="5" fill="#DDDDDD"/>
  <!-- $ disc -->
  <circle cx="96" cy="82" r="24" fill="#000000" opacity="0.20"/>
  <!-- $ sign -->
  <text x="96" y="94" text-anchor="middle"
    font-family="Arial Black, Arial" font-weight="900"
    font-size="34" fill="#04080F">$</text>
</svg>`.trim();

// ── Favicon (64px, dark bg version) ──────────────────────────────────────────
const svgFavicon = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#04080F"/>
  <!-- Dome -->
  <ellipse cx="32" cy="28" rx="18" ry="16" fill="#00C8A8"/>
  <!-- Walls -->
  <rect x="14" y="28" width="36" height="7" fill="#00C8A8"/>
  <!-- Brim -->
  <rect x="8" y="33" width="48" height="6" rx="3" fill="#00A88A"/>
  <!-- $ -->
  <text x="32" y="32" text-anchor="middle"
    font-family="Arial Black, Arial" font-weight="900"
    font-size="14" fill="#F0A500">$</text>
</svg>`.trim();

async function makeIcon(svgStr, outPath, size) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`  ✓  ${outPath}  (${size}×${size})`);
}

async function main() {
  console.log('Generating MilBudgetBuddy icons…');
  await makeIcon(svgFull,    join(OUT, 'icon.png'),                    1024);
  await makeIcon(svgFg,      join(OUT, 'android-icon-foreground.png'), 1024);
  await makeIcon(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#04080F"/></svg>`,
    join(OUT, 'android-icon-background.png'), 1024
  );
  await makeIcon(svgMono,    join(OUT, 'android-icon-monochrome.png'), 1024);
  await makeIcon(svgSplash,  join(OUT, 'splash-icon.png'),             192);
  await makeIcon(svgFavicon, join(OUT, 'favicon.png'),                 64);
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
