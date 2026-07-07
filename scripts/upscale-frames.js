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

const files = fs.readdirSync(framesDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));
console.log(`Found ${files.length} frames to check and upscale.`);

async function upscale() {
  if (files.length === 0) {
    console.log('No frame files found.');
    return;
  }

  // Get dimensions of the first frame to plan upscaling
  const samplePath = path.join(framesDir, files[0]);
  const metadata = await sharp(samplePath).metadata();
  console.log(`Current Frame Dimensions: ${metadata.width}x${metadata.height}`);

  // We want to upscale to Full HD (1920px width) if the resolution is smaller
  const targetWidth = 1920;
  if (metadata.width >= targetWidth) {
    console.log(`Frames are already at a high resolution (${metadata.width}px width). Doing a high-quality resampling and sharpening pass...`);
  } else {
    console.log(`Upscaling frames from ${metadata.width}px width to ${targetWidth}px width using high-quality Lanczos3 kernel...`);
  }

  let count = 0;
  for (const file of files) {
    const filePath = path.join(framesDir, file);
    const tempPath = path.join(framesDir, `upscale-${file}`);

    try {
      await sharp(filePath)
        // 1. Resize to target width (aspect ratio maintained) using high-quality Lanczos3 kernel
        .resize({
          width: targetWidth,
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false // Allow upscaling
        })
        // 2. Extra sharpening pass to clean up interpolation blur
        .sharpen({
          sigma: 1.0,
          m1: 1.5,
          m2: 2.5
        })
        // 3. High quality export
        .jpeg({
          quality: 92,
          progressive: true,
          chromaSubsampling: '4:4:4'
        })
        .toFile(tempPath);

      // Overwrite the original
      fs.renameSync(tempPath, filePath);
      count++;

      if (count % 100 === 0) {
        console.log(`Upscaled ${count}/${files.length} frames...`);
      }
    } catch (err) {
      console.error(`Error upscaling ${file}:`, err);
    }
  }

  console.log(`Successfully upscaled and resampled all ${count} background frames to high quality!`);
}

upscale().catch(err => {
  console.error('Upscaling script failed:', err);
});
