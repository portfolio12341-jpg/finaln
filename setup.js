const fs = require('fs');
const path = require('path');

const srcDir = 'e:\\new web';
const destDir = 'e:\\website resu';

const filesToCopy = [
  'tsconfig.json',
  'next.config.ts',
  'postcss.config.mjs',
  'eslint.config.mjs',
  '.gitignore',
  'next-env.d.ts'
];

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip node_modules, .next, .git
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy configuration files
filesToCopy.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file}`);
  }
});

// Copy and modify package.json
const pkgPath = path.join(srcDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkgContent.name = 'nency-portfolio'; // Rename to legal URL name
  fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(pkgContent, null, 2));
  console.log('Copied and updated package.json');
}

// Create initial folders
['src', 'public', 'data'].forEach(dir => {
  const dirPath = path.join(destDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory ${dir}`);
  }
});

console.log('Project configuration setup complete!');
