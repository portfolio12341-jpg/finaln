const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Sharp is not available. Please install it first.', e);
  process.exit(1);
}

const srcDir = path.join(__dirname, '..', 'public', 'bg-frames');
const tempDestDir = path.join(__dirname, '..', 'public', 'bg-frames-webp-temp');

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

if (!fs.existsSync(tempDestDir)) {
  fs.mkdirSync(tempDestDir, { recursive: true });
}

console.log('Reading background frames...');
const files = fs.readdirSync(srcDir)
  .filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

console.log(`Found ${files.length} total background frames.`);

// Downsample: Keep every 5th frame (e.g. 900 frames -> 180 frames)
const DOWNSAMPLE_STEP = 5;
const selectedFiles = files.filter((_, idx) => idx % DOWNSAMPLE_STEP === 0);

console.log(`Downsampled to ${selectedFiles.length} frames. Compressing to WebP (1280px width, Quality 65)...`);

async function compressAll() {
  let count = 0;
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const srcPath = path.join(srcDir, file);
    
    // Save sequentially as ezgif-frame-001.webp, ezgif-frame-002.webp, etc.
    const indexStr = (i + 1).toString().padStart(3, '0');
    const destFileName = `ezgif-frame-${indexStr}.webp`;
    const destPath = path.join(tempDestDir, destFileName);

    try {
      await sharp(srcPath)
        .resize(1280)         // Resize width to 1280px (lightweight for ambient background)
        .webp({ quality: 65 }) // Quality 65 (perfectly fine since it's blurred/faded)
        .toFile(destPath);
      
      count++;
      if (count % 30 === 0) {
        console.log(`Processed ${count}/${selectedFiles.length} frames...`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  console.log(`\nSuccessfully compressed ${count} frames to WebP.`);
  console.log('Replacing original high-res JPG files with compressed WebPs...');

  // Delete all old files in srcDir
  const oldFiles = fs.readdirSync(srcDir);
  for (const f of oldFiles) {
    fs.unlinkSync(path.join(srcDir, f));
  }

  // Move webp files from tempDestDir to srcDir
  const webpFiles = fs.readdirSync(tempDestDir);
  for (const f of webpFiles) {
    fs.renameSync(path.join(tempDestDir, f), path.join(srcDir, f));
  }

  // Remove temp directory
  fs.rmdirSync(tempDestDir);

  console.log('Replacement complete! Background directory now contains 180 compressed WebP frames.');
}

compressAll();
