import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const UPLOADS_DIR = path.resolve('public/uploads');
const BG_FRAMES_DIR = path.resolve('public/compressedImages (1)');
const NEW_BG_DIR = path.resolve('public/bg-frames-webp');
const DB_PATH = path.resolve('data/db.json');

console.log('--- STARTING IMAGE OPTIMIZATION ---');

// 1. Optimize uploads referenced in db.json
let dbData = {};
try {
  dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to read db.json', e);
  process.exit(1);
}

// Helper to gather all referenced files in db.json
function getReferencedImages(db) {
  const list = new Set();
  
  if (db.personal && db.personal.profilePhoto) {
    list.add(db.personal.profilePhoto);
  }
  
  if (db.gallery) {
    db.gallery.forEach(item => {
      if (item.url) list.add(item.url);
      if (item.urls) item.urls.forEach(u => list.add(u));
    });
  }
  
  if (db.certificates) {
    db.certificates.forEach(item => {
      if (item.url) list.add(item.url);
      if (item.urls) item.urls.forEach(u => list.add(u));
    });
  }
  
  return Array.from(list)
    .filter(u => u.startsWith('/uploads/'))
    .map(u => u.replace('/uploads/', ''));
}

const referencedUploads = getReferencedImages(dbData);
console.log(`Found ${referencedUploads.length} referenced uploads in db.json.`);

// Ensure directories exist
if (!fs.existsSync(NEW_BG_DIR)) {
  fs.mkdirSync(NEW_BG_DIR, { recursive: true });
}

// Convert referenced uploads to WebP (if they are JPG/PNG)
const filenameMapping = {};
let uploadsOriginalSize = 0;
let uploadsWebpSize = 0;

for (const filename of referencedUploads) {
  const fullPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File ${fullPath} referenced in db but does not exist!`);
    continue;
  }
  
  const stats = fs.statSync(fullPath);
  uploadsOriginalSize += stats.size;
  
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    const baseName = path.basename(filename, ext);
    const newFilename = `${baseName}.webp`;
    const newFullPath = path.join(UPLOADS_DIR, newFilename);
    
    console.log(`Converting upload image: ${filename} -> ${newFilename}`);
    
    await sharp(fullPath)
      .webp({ quality: 80 })
      .toFile(newFullPath);
      
    filenameMapping[filename] = newFilename;
    uploadsWebpSize += fs.statSync(newFullPath).size;
  } else {
    // Already webp or other format, count it as is
    uploadsWebpSize += stats.size;
  }
}

// Update db.json with new WebP filenames
function updateDbReferences(db, mapping) {
  if (db.personal && db.personal.profilePhoto) {
    const orig = db.personal.profilePhoto.replace('/uploads/', '');
    if (mapping[orig]) {
      db.personal.profilePhoto = `/uploads/${mapping[orig]}`;
    }
  }
  
  if (db.gallery) {
    db.gallery.forEach(item => {
      if (item.url) {
        const orig = item.url.replace('/uploads/', '');
        if (mapping[orig]) item.url = `/uploads/${mapping[orig]}`;
      }
      if (item.urls) {
        item.urls = item.urls.map(u => {
          const orig = u.replace('/uploads/', '');
          return mapping[orig] ? `/uploads/${mapping[orig]}` : u;
        });
      }
    });
  }
  
  if (db.certificates) {
    db.certificates.forEach(item => {
      if (item.url) {
        const orig = item.url.replace('/uploads/', '');
        if (mapping[orig]) item.url = `/uploads/${mapping[orig]}`;
      }
      if (item.urls) {
        item.urls = item.urls.map(u => {
          const orig = u.replace('/uploads/', '');
          return mapping[orig] ? `/uploads/${mapping[orig]}` : u;
        });
      }
    });
  }
}

updateDbReferences(dbData, filenameMapping);
fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
console.log('✓ db.json references updated.');

// Delete original uploads that were converted
for (const origFilename of Object.keys(filenameMapping)) {
  const fullPath = path.join(UPLOADS_DIR, origFilename);
  try {
    fs.unlinkSync(fullPath);
  } catch (e) {
    console.error(`Failed to delete original file ${fullPath}`, e);
  }
}

// Delete unused uploads
const allUploadFiles = fs.readdirSync(UPLOADS_DIR);
let deletedUnusedCount = 0;
let deletedUnusedSize = 0;

const activeFiles = new Set(referencedUploads.map(f => filenameMapping[f] || f));

for (const file of allUploadFiles) {
  if (!activeFiles.has(file)) {
    const fullPath = path.join(UPLOADS_DIR, file);
    try {
      const stats = fs.statSync(fullPath);
      deletedUnusedSize += stats.size;
      fs.unlinkSync(fullPath);
      deletedUnusedCount++;
    } catch (e) {
      console.error(`Failed to delete unused upload file ${fullPath}`, e);
    }
  }
}
console.log(`✓ Deleted ${deletedUnusedCount} unused upload files (saved ${(deletedUnusedSize / 1024 / 1024).toFixed(2)} MB).`);


// 2. Convert background scroll PNG frames to WebP
console.log('Converting background PNG frames to WebP...');
const allPngFrames = fs.readdirSync(BG_FRAMES_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

console.log(`Found ${allPngFrames.length} PNG frames in ${BG_FRAMES_DIR}.`);

let framesOriginalSize = 0;
let framesWebpSize = 0;
let framesDone = 0;

for (const file of allPngFrames) {
  const inputPath = path.join(BG_FRAMES_DIR, file);
  const outputFile = file.replace('.png', '.webp');
  const outputPath = path.join(NEW_BG_DIR, outputFile);
  
  const stats = fs.statSync(inputPath);
  framesOriginalSize += stats.size;
  
  // Use smart compression for background webp frames
  await sharp(inputPath)
    .webp({
      quality: 75,
      effort: 6,
    })
    .toFile(outputPath);
    
  framesWebpSize += fs.statSync(outputPath).size;
  
  framesDone++;
  if (framesDone % 100 === 0) {
    console.log(`  ${framesDone}/${allPngFrames.length} frames converted...`);
  }
}
console.log('✓ All background frames converted.');
console.log(`  Original PNG size: ${(framesOriginalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Optimized WebP size: ${(framesWebpSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Saved: ${(((framesOriginalSize - framesWebpSize) / framesOriginalSize) * 100).toFixed(1)}%`);

// 3. Delete old PNG frames directory (Wait, let's delete files inside first, then dir)
console.log('Deleting original PNG frames...');
for (const file of allPngFrames) {
  const inputPath = path.join(BG_FRAMES_DIR, file);
  try {
    fs.unlinkSync(inputPath);
  } catch {}
}
try {
  fs.rmdirSync(BG_FRAMES_DIR);
  console.log(`✓ Deleted directory ${BG_FRAMES_DIR}`);
} catch (e) {
  console.error(`Failed to delete directory ${BG_FRAMES_DIR}`, e);
}


// 4. Delete unused public folders
const foldersToDelete = [
  'public/ezgif-4d1cb2eb12610626-jpg',
  'public/signature-frames-png',
  'public/signature-frames-webp',
];

foldersToDelete.forEach(dirName => {
  const dirPath = path.resolve(dirName);
  if (fs.existsSync(dirPath)) {
    console.log(`Deleting unused directory: ${dirName}`);
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach(f => fs.unlinkSync(path.join(dirPath, f)));
      fs.rmdirSync(dirPath);
      console.log(`✓ Deleted ${dirName}`);
    } catch (e) {
      console.error(`Failed to delete ${dirName}`, e);
    }
  }
});

// 5. Delete Firebase files
const firebaseFiles = ['.firebaserc', 'firebase.json'];
firebaseFiles.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    console.log(`Deleting unused Firebase file: ${file}`);
    try {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted ${file}`);
    } catch (e) {
      console.error(`Failed to delete ${file}`, e);
    }
  }
});

const firebaseDir = path.resolve('.firebase');
if (fs.existsSync(firebaseDir)) {
  console.log('Deleting unused .firebase directory');
  try {
    const cleanDir = (d) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          cleanDir(full);
        } else {
          fs.unlinkSync(full);
        }
      }
      fs.rmdirSync(d);
    };
    cleanDir(firebaseDir);
    console.log('✓ Deleted .firebase directory');
  } catch (e) {
    console.error('Failed to delete .firebase directory', e);
  }
}

console.log('--- IMAGE AND ASSET OPTIMIZATION COMPLETE ---');
console.log(`Total Uploads saved: ${((uploadsOriginalSize - uploadsWebpSize) / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total Frames saved: ${((framesOriginalSize - framesWebpSize) / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total Unused Assets deleted: ${(deletedUnusedSize / 1024 / 1024).toFixed(2)} MB`);
