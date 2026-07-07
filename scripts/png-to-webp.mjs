/**
 * Converts signature PNG frames to WebP with transparent background.
 * Uses sharp for best-in-class compression. Outputs every other PNG = every 4th original frame.
 * Run: node scripts/png-to-webp.mjs
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const INPUT_DIR  = path.resolve('public/signature-frames-png');
const OUTPUT_DIR = path.resolve('public/signature-frames-webp');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Pick every other PNG (= every 4th original frame) to halve the count again
const allPngs = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

// Take every 2nd file → 143 → ~72 frames
const selectedPngs = allPngs.filter((_, i) => i % 2 === 0);

console.log(`Converting ${selectedPngs.length} frames to WebP...`);

let done = 0;
for (const file of selectedPngs) {
  const inputPath  = path.join(INPUT_DIR, file);
  const outputFile = file.replace('.png', '.webp');
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  await sharp(inputPath)
    .resize({ width: 180, withoutEnlargement: true }) // scale down to max 180px wide
    .webp({
      quality: 18,         // very aggressive compression
      lossless: false,
      alphaQuality: 60,    // compress alpha channel too
      smartSubsample: true,
      effort: 6,           // max compression effort
    })
    .toFile(outputPath);

  done++;
  if (done % 20 === 0) console.log(`  ${done}/${selectedPngs.length} done...`);
}

console.log(`✓ All ${done} frames converted to WebP.`);
console.log(`  Output: ${OUTPUT_DIR}`);

// Print size comparison
const pngSize = selectedPngs.reduce((sum, f) => {
  try { return sum + fs.statSync(path.join(INPUT_DIR, f)).size; } catch { return sum; }
}, 0);
const webpSize = fs.readdirSync(OUTPUT_DIR).reduce((sum, f) => {
  try { return sum + fs.statSync(path.join(OUTPUT_DIR, f)).size; } catch { return sum; }
}, 0);

console.log(`  PNG total: ${(pngSize / 1024).toFixed(0)} KB`);
console.log(`  WebP total: ${(webpSize / 1024).toFixed(0)} KB`);
console.log(`  Saved: ${(((pngSize - webpSize) / pngSize) * 100).toFixed(0)}%`);
