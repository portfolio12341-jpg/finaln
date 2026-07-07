const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\solan\\Downloads\\New folder';
const destDir = 'e:\\website resu\\public\\bg-frames';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Reading source directory...');
const files = fs.readdirSync(srcDir);
const frameFiles = files.filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));

console.log(`Found ${frameFiles.length} frame files. Starting copy...`);

let copiedCount = 0;
frameFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  fs.copyFileSync(srcPath, destPath);
  copiedCount++;
  if (copiedCount % 100 === 0) {
    console.log(`Copied ${copiedCount}/${frameFiles.length} frames...`);
  }
});

console.log(`Successfully copied ${copiedCount} frames to public/bg-frames!`);
