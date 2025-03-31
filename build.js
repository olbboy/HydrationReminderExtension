// build.js
const fs = require('fs');
const path = require('path');

// Đảm bảo thư mục dist tồn tại
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}

// Copy manifest.json
console.log('Copying manifest.json to dist...');
fs.copyFileSync('./manifest.json', './dist/manifest.json');

// Copy thư mục icons
console.log('Copying icons directory...');
const iconsDir = './icons';
const destIconsDir = './dist/icons';

if (fs.existsSync(iconsDir)) {
  if (!fs.existsSync(destIconsDir)) {
    fs.mkdirSync(destIconsDir, { recursive: true });
  }
  
  const iconFiles = fs.readdirSync(iconsDir);
  for (const file of iconFiles) {
    fs.copyFileSync(path.join(iconsDir, file), path.join(destIconsDir, file));
  }
}

// Copy thư mục public
console.log('Copying public directory...');
const publicDir = './public';
const destPublicDir = './dist/public';

if (fs.existsSync(publicDir)) {
  if (!fs.existsSync(destPublicDir)) {
    fs.mkdirSync(destPublicDir, { recursive: true });
  }
  
  function copyDir(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(publicDir, destPublicDir);
}

console.log('Build process completed successfully!'); 