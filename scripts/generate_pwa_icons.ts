import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');

// Standard icon SVG (TuStudyHub Clay & Kaolin)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#8A3E12"/>
  <rect x="28" y="28" width="456" height="456" rx="88" fill="#1C1A17" stroke="#A84D16" stroke-width="4"/>
  <!-- Book / Knowledge Pages in Kaolin -->
  <path d="M128 176c48-24 96-24 128 0 32-24 80-24 128 0v168c-48-24-96-24-128 0-32-24-80-24-128 0V176z" fill="#EDE9E2"/>
  <path d="M256 176v168" stroke="#8A3E12" stroke-width="8" stroke-linecap="round"/>
  <!-- Verification Seal in Clay 500 & Clay 100 -->
  <circle cx="256" cy="240" r="44" fill="#C2691D" stroke="#F7E4D0" stroke-width="6"/>
  <path d="M240 240l12 12 24-24" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Brand Initials TSH -->
  <text x="256" y="388" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#F7E4D0" text-anchor="middle" letter-spacing="4">TUSTUDYHUB</text>
  <text x="256" y="418" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#DDD8CF" text-anchor="middle" letter-spacing="3">LEARN • SHARE • VERIFY</text>
</svg>`;

// Maskable icon: Needs full-bleed background (no rounded corners) and all key content within the central safe area (radius ~200px)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#8A3E12"/>
  <circle cx="256" cy="256" r="236" fill="#1C1A17" stroke="#A84D16" stroke-width="4"/>
  <!-- Book pages scaled to fit safely within 75% circle -->
  <g transform="translate(40, 20) scale(0.84)">
    <path d="M128 176c48-24 96-24 128 0 32-24 80-24 128 0v168c-48-24-96-24-128 0-32-24-80-24-128 0V176z" fill="#EDE9E2"/>
    <path d="M256 176v168" stroke="#8A3E12" stroke-width="8" stroke-linecap="round"/>
    <circle cx="256" cy="240" r="44" fill="#C2691D" stroke="#F7E4D0" stroke-width="6"/>
    <path d="M240 240l12 12 24-24" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="256" y="386" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" fill="#F7E4D0" text-anchor="middle" letter-spacing="4">TUSTUDYHUB</text>
    <text x="256" y="414" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#DDD8CF" text-anchor="middle" letter-spacing="3">LEARN • SHARE • VERIFY</text>
  </g>
</svg>`;

// Apple Touch Icon: 180x180, square, no alpha transparency (iOS fills transparent areas black)
const appleTouchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="#8A3E12"/>
  <rect x="8" y="8" width="164" height="164" rx="28" fill="#1C1A17" stroke="#A84D16" stroke-width="2"/>
  <g transform="translate(18, 12) scale(0.28)">
    <path d="M128 176c48-24 96-24 128 0 32-24 80-24 128 0v168c-48-24-96-24-128 0-32-24-80-24-128 0V176z" fill="#EDE9E2"/>
    <path d="M256 176v168" stroke="#8A3E12" stroke-width="8" stroke-linecap="round"/>
    <circle cx="256" cy="240" r="44" fill="#C2691D" stroke="#F7E4D0" stroke-width="6"/>
    <path d="M240 240l12 12 24-24" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="256" y="388" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="900" fill="#F7E4D0" text-anchor="middle" letter-spacing="4">TUSTUDYHUB</text>
  </g>
</svg>`;

async function main() {
  console.log('Generating PWA icons...');

  // 192x192
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 512x512
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 512x512 maskable
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 180x180 apple-touch-icon
  await sharp(Buffer.from(appleTouchSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  console.log('All PWA icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
