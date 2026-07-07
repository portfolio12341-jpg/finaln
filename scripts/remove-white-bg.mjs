/**
 * Batch converts all JPG signature frames to PNG with transparent white background.
 * Uses only Node.js built-in http/fs modules + browser-compatible Canvas API via node-canvas.
 * Run: node scripts/remove-white-bg.mjs
 */

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

const INPUT_DIR  = 'C:/Users/solan/Downloads/New folder';
const OUTPUT_DIR = path.resolve('public/signature-frames-png');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.jpg'))
  .sort();

console.log(`Processing ${files.length} frames...`);

let done = 0;
for (const file of files) {
  const inputPath  = path.join(INPUT_DIR, file);
  const outputFile = file.replace('.jpg', '.png');
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  const img = await loadImage(inputPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);

  // Remove white background: set near-white pixels to transparent
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Aggressive white removal: threshold at 215, wide soft-edge range
    if (r > 215 && g > 215 && b > 215) {
      const whiteness = Math.min(r, g, b);
      // Wider transition range (215→255) = 40 steps for smooth anti-aliased edges
      const alpha = Math.round(((255 - whiteness) / 40) * 255);
      data[i + 3] = Math.min(255, Math.max(0, alpha));
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  done++;
  if (done % 50 === 0) console.log(`  ${done}/${files.length} done...`);
}

console.log(`✓ All ${done} frames converted to PNG with transparent background.`);
console.log(`  Output: ${OUTPUT_DIR}`);
