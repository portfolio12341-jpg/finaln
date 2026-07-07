import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import os from 'os';

const INPUT_DIR  = 'C:/Users/solan/Downloads/New folder';
const OUTPUT_DIR = path.resolve('public/signature-frames-png');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('--- STARTING FAST PARALLEL BACKGROUND REMOVAL ---');
const files = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.jpg'))
  .sort();

console.log(`Processing ${files.length} frames...`);

const CONCURRENCY = Math.max(2, os.cpus().length - 1);
console.log(`Using concurrency limit: ${CONCURRENCY}`);

let done = 0;
const chunks = [];
for (let i = 0; i < files.length; i += CONCURRENCY) {
  chunks.push(files.slice(i, i + CONCURRENCY));
}

const startTime = Date.now();

for (const chunk of chunks) {
  await Promise.all(chunk.map(async (file) => {
    const inputPath  = path.join(INPUT_DIR, file);
    const outputFile = file.replace('.jpg', '.png');
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    try {
      const img = await loadImage(inputPath);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 215 && g > 215 && b > 215) {
          const whiteness = Math.min(r, g, b);
          const alpha = Math.round(((255 - whiteness) / 40) * 255);
          data[i + 3] = Math.min(255, Math.max(0, alpha));
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }

    done++;
  }));

  if (done % 50 === 0 || done === files.length) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Progress: ${done}/${files.length} frames processed (${((done / files.length) * 100).toFixed(0)}%) | Elapsed: ${elapsed}s...`);
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('--- BACKGROUND REMOVAL COMPLETE ---');
console.log(`Total Time: ${totalTime}s`);
console.log(`Output: ${OUTPUT_DIR}`);
