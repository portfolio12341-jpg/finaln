const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Sharp is not available. Please install it first.', e);
  process.exit(1);
}

const srcDir = path.join(__dirname, '..', 'public', 'ezgif-4d1cb2eb12610626-jpg');
const tempDestDir = path.join(__dirname, '..', 'public', 'ezgif-4d1cb2eb12610626-webp-temp');

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

if (!fs.existsSync(tempDestDir)) {
  fs.mkdirSync(tempDestDir, { recursive: true });
}

console.log('Reading signature frames...');
const files = fs.readdirSync(srcDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));

console.log(`Found ${files.length} frames. Compressing to WebP (500px width, Grayscale, Quality 60)...`);

async function compressAll() {
  let count = 0;
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destFileName = file.replace('.jpg', '.webp');
    const destPath = path.join(tempDestDir, destFileName);

    try {
      await sharp(srcPath)
        .resize(500)          // Resize width to 500px (retina sharp but compact)
        .grayscale()          // Convert to grayscale (since it's a black & white mask)
        .webp({ quality: 60 }) // Highly compressed WebP format
        .toFile(destPath);
      
      count++;
      if (count % 50 === 0) {
        console.log(`Compressed ${count}/${files.length} frames...`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  console.log(`\nSuccessfully compressed ${count} frames to WebP.`);
  console.log('Replacing original JPG files with WebPs...');

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

  console.log('Replacement complete! Original folder now contains compressed WebP frames.');
}

compressAll();
