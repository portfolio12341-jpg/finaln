const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Sharp is not available. Please install it first.', e);
  process.exit(1);
}

const framesDir = path.join(__dirname, '..', 'public', 'bg-frames');

if (!fs.existsSync(framesDir)) {
  console.error(`Frames directory not found: ${framesDir}`);
  process.exit(1);
}

console.log('Reading frames directory...');
const files = fs.readdirSync(framesDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));

console.log(`Found ${files.length} frames to enhance. Processing...`);

async function processFrames() {
  let count = 0;
  for (const file of files) {
    const filePath = path.join(framesDir, file);
    const tempPath = path.join(framesDir, `temp-${file}`);

    try {
      await sharp(filePath)
        // 1. Sharpen to bring out crisp details (makes low-res frames look high-res)
        .sharpen({
          sigma: 1.2,
          m1: 1.0,
          m2: 2.0
        })
        // 2. Adjust color balance (slightly increase contrast and saturation for premium look)
        .modulate({
          brightness: 1.02,
          saturation: 1.08
        })
        // 3. Save as progressive JPEG with high quality
        .jpeg({
          quality: 90,
          progressive: true,
          chromaSubsampling: '4:4:4'
        })
        .toFile(tempPath);

      // Overwrite original file
      fs.renameSync(tempPath, filePath);
      count++;
      
      if (count % 100 === 0) {
        console.log(`Processed ${count}/${files.length} frames...`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  console.log(`Finished enhancing ${count} frames successfully!`);
}

processFrames();
