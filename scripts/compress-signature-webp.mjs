import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import os from 'os';

const INPUT_DIR = path.resolve('public/signature-frames-png');
const OUTPUT_DIR = path.resolve('public/signature-frames-webp');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('--- STARTING COMPRESSION OF SIGNATURE FRAMES TO WEBP ---');
const allPngs = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

console.log(`Found ${allPngs.length} PNG signature frames to convert.`);

const CONCURRENCY = Math.max(2, os.cpus().length - 1);
console.log(`Using concurrency limit: ${CONCURRENCY}`);

let done = 0;
const chunks = [];
for (let i = 0; i < allPngs.length; i += CONCURRENCY) {
  chunks.push(allPngs.slice(i, i + CONCURRENCY));
}

const startTime = Date.now();

for (const chunk of chunks) {
  await Promise.all(chunk.map(async (file) => {
    const inputPath = path.join(INPUT_DIR, file);
    const outputFile = file.replace('.png', '.webp');
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    try {
      await sharp(inputPath)
        .webp({
          quality: 80,
          lossless: false // WebP lossy handles transparency perfectly at a fraction of size
        })
        .toFile(outputPath);
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }

    done++;
  }));

  if (done % 50 === 0 || done === allPngs.length) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Progress: ${done}/${allPngs.length} frames converted (${((done / allPngs.length) * 100).toFixed(0)}%) | Elapsed: ${elapsed}s...`);
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('--- SIGNATURE WEBP COMPRESSION COMPLETE ---');
console.log(`Total Time: ${totalTime}s`);
console.log(`Output: ${OUTPUT_DIR}`);
