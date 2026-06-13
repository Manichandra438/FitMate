import sharp from 'sharp';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');

const SIZE = 1024;

// Heart + ECG pulse icon SVG (white on transparent, icon centered in safe zone ~680px)
function heartSvg(bgFill, iconFill, ecgFill, rounded = true) {
  const rx = rounded ? 230 : 0;
  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8A65"/>
      <stop offset="100%" stop-color="#F25C3F"/>
    </linearGradient>
  </defs>
  ${bgFill ? `<rect width="${SIZE}" height="${SIZE}" fill="${bgFill === 'gradient' ? 'url(#bg)' : bgFill}" rx="${rx}"/>` : ''}
  <!-- Heart shape -->
  <path d="M512 715
    C 395 632 228 545 228 398
    C 228 308 298 245 392 245
    C 438 245 482 268 512 308
    C 542 268 586 245 632 245
    C 726 245 796 308 796 398
    C 796 545 629 632 512 715 Z"
    fill="${iconFill}"/>
  <!-- ECG pulse line -->
  <polyline
    points="210,492 368,492 412,348 458,648 498,408 538,492 814,492"
    fill="none"
    stroke="${ecgFill}"
    stroke-width="34"
    stroke-linecap="round"
    stroke-linejoin="round"/>
</svg>`;
}

// Foreground only (transparent bg, white icon) for adaptive icon
function foregroundSvg() {
  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <path d="M512 715
    C 395 632 228 545 228 398
    C 228 308 298 245 392 245
    C 438 245 482 268 512 308
    C 542 268 586 245 632 245
    C 726 245 796 308 796 398
    C 796 545 629 632 512 715 Z"
    fill="white"/>
  <polyline
    points="210,492 368,492 412,348 458,648 498,408 538,492 814,492"
    fill="none"
    stroke="#FF7A59"
    stroke-width="34"
    stroke-linecap="round"
    stroke-linejoin="round"/>
</svg>`;
}

// Monochrome (white icon on black, no gradient)
function monochromeSvg() {
  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" fill="black"/>
  <path d="M512 715
    C 395 632 228 545 228 398
    C 228 308 298 245 392 245
    C 438 245 482 268 512 308
    C 542 268 586 245 632 245
    C 726 245 796 308 796 398
    C 796 545 629 632 512 715 Z"
    fill="white"/>
  <polyline
    points="210,492 368,492 412,348 458,648 498,408 538,492 814,492"
    fill="none"
    stroke="black"
    stroke-width="34"
    stroke-linecap="round"
    stroke-linejoin="round"/>
</svg>`;
}

async function svgToPng(svgString, outPath, size = SIZE) {
  await sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${path.basename(outPath)}`);
}

await svgToPng(heartSvg('gradient', 'white', '#FF7A59'), path.join(ASSETS, 'icon.png'));
await svgToPng(foregroundSvg(), path.join(ASSETS, 'android-icon-foreground.png'));
await svgToPng('<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#FF7A59"/></svg>', path.join(ASSETS, 'android-icon-background.png'));
await svgToPng(monochromeSvg(), path.join(ASSETS, 'android-icon-monochrome.png'));
await svgToPng(heartSvg('gradient', 'white', '#FF7A59'), path.join(ASSETS, 'splash-icon.png'));
await svgToPng(heartSvg('gradient', 'white', '#FF7A59', false), path.join(ASSETS, 'favicon.png'), 48);

console.log('\nAll icons generated!');
