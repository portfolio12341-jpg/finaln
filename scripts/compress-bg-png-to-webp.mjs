import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import os from 'os';

const INPUT_DIR = path.resolve('public/CompressImage.com');
const OUTPUT_DIR = path.resolve('public/bg-frames-webp');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('--- COMPRESSING BACKGROUND JPG FRAMES TO WEBP ---');
const allJpgs = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.jpg'))
  .sort();

console.log(`Found ${allJpgs.length} frames to convert.`);

const CONCURRENCY = Math.max(2, os.cpus().length - 1);
console.log(`Using concurrency limit: ${CONCURRENCY}`);

let done = 0;
let originalTotalSize = 0;
let compressedTotalSize = 0;

const chunks = [];
for (let i = 0; i < allJpgs.length; i += CONCURRENCY) {
  chunks.push(allJpgs.slice(i, i + CONCURRENCY));
}

const startTime = Date.now();

for (const chunk of chunks) {
  await Promise.all(chunk.map(async (file) => {
    const inputPath = path.join(INPUT_DIR, file);
    const stats = fs.statSync(inputPath);
    originalTotalSize += stats.size;

    const outputFile = file.replace('.jpg', '.webp');
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    try {
      await sharp(inputPath)
        .resize({ width: 1280 })
        .webp({ 
          quality: 50, 
          effort: 4 
        })
        .toFile(outputPath);

      compressedTotalSize += fs.statSync(outputPath).size;
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }
    
    done++;
  }));
  
  if (done % 50 === 0 || done === allJpgs.length) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Progress: ${done}/${allJpgs.length} frames converted (${((done / allJpgs.length) * 100).toFixed(0)}%) | Elapsed: ${elapsed}s...`);
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('--- WEBP COMPRESSION COMPLETE ---');
console.log(`Total Time: ${totalTime}s`);
console.log(`Original size: ${(originalTotalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP size: ${(compressedTotalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduction: ${(((originalTotalSize - compressedTotalSize) / originalTotalSize) * 100).toFixed(1)}%`);
