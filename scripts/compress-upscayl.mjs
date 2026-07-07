import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const INPUT_DIR = path.resolve('public/upscayl_png_upscayl-lite-4x_2x');
const OUTPUT_DIR = path.resolve('public/bg-frames-webp');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('--- COMPRESSING UPSCAYL FRAMES ---');
const allPngs = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

console.log(`Found ${allPngs.length} frames to convert.`);

let done = 0;
let originalTotalSize = 0;
let compressedTotalSize = 0;

for (const file of allPngs) {
  const inputPath = path.join(INPUT_DIR, file);
  const stats = fs.statSync(inputPath);
  originalTotalSize += stats.size;

  const outputFile = file.replace('.png', '.webp');
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  // Compress using sharp webp with effort 4 for fast, high-quality compression
  await sharp(inputPath)
    .webp({ 
      quality: 75, 
      effort: 4 
    })
    .toFile(outputPath);

  compressedTotalSize += fs.statSync(outputPath).size;
  done++;

  if (done % 50 === 0) {
    console.log(`  Progress: ${done}/${allPngs.length} frames converted (${((done / allPngs.length) * 100).toFixed(0)}%)...`);
  }
}

console.log('--- COMPRESSION COMPLETE ---');
console.log(`Original size: ${(originalTotalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP size: ${(compressedTotalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduction: ${(((originalTotalSize - compressedTotalSize) / originalTotalSize) * 100).toFixed(1)}%`);
