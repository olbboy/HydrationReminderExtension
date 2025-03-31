// setup.js - Script để kiểm tra và cài đặt môi trường
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('┌─────────────────────────────────────────────┐');
console.log('│  Hydration Reminder Extension Setup Tool    │');
console.log('└─────────────────────────────────────────────┘');
console.log('');

// Kiểm tra các thư mục cần thiết
const requiredDirs = ['public/sounds', 'icons', 'src'];
let missingDirs = [];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    missingDirs.push(dir);
    console.log(`❌ Thư mục ${dir} không tồn tại`);
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✅ Đã tạo thư mục ${dir}`);
    } catch (err) {
      console.log(`   ❌ Không thể tạo thư mục ${dir}: ${err.message}`);
    }
  } else {
    console.log(`✅ Thư mục ${dir} đã tồn tại`);
  }
}

// Kiểm tra các file âm thanh
const soundFiles = ['water-drop.mp3', 'bell.mp3', 'chime.mp3', 'birds.mp3', 'stream.mp3'];
let missingSounds = [];

console.log('\nKiểm tra các file âm thanh:');
for (const sound of soundFiles) {
  const soundPath = path.join('public/sounds', sound);
  if (!fs.existsSync(soundPath)) {
    missingSounds.push(sound);
    console.log(`❌ File âm thanh ${sound} không tồn tại`);
  } else {
    console.log(`✅ File âm thanh ${sound} đã tồn tại`);
  }
}

// Kiểm tra các file icon
const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];
let missingIcons = [];

console.log('\nKiểm tra các file icon:');
for (const icon of iconFiles) {
  const iconPath = path.join('icons', icon);
  if (!fs.existsSync(iconPath)) {
    missingIcons.push(icon);
    console.log(`❌ File icon ${icon} không tồn tại`);
  } else {
    console.log(`✅ File icon ${icon} đã tồn tại`);
  }
}

// Kiểm tra dependencies
console.log('\nKiểm tra các dependencies:');
try {
  execSync('npm list rimraf --depth=0', { stdio: 'ignore' });
  console.log('✅ rimraf đã được cài đặt');
} catch {
  console.log('❌ rimraf chưa được cài đặt');
  console.log('   🔄 Đang cài đặt rimraf...');
  try {
    execSync('npm install --save-dev rimraf@^5.0.5', { stdio: 'inherit' });
    console.log('   ✅ Đã cài đặt rimraf thành công');
  } catch (err) {
    console.log(`   ❌ Không thể cài đặt rimraf: ${err.message}`);
  }
}

// Tóm tắt các vấn đề
console.log('\n┌─────────────────────────────────────────────┐');
console.log('│  Tóm tắt kiểm tra                           │');
console.log('└─────────────────────────────────────────────┘');

if (missingSounds.length > 0) {
  console.log('\n❌ Các file âm thanh sau đây cần được thêm vào thư mục public/sounds:');
  for (const sound of missingSounds) {
    console.log(`   - ${sound}`);
  }
  console.log('\n   Gợi ý: Bạn có thể tìm file âm thanh miễn phí tại https://freesound.org');
}

if (missingIcons.length > 0) {
  console.log('\n❌ Các file icon sau đây cần được thêm vào thư mục icons:');
  for (const icon of missingIcons) {
    console.log(`   - ${icon}`);
  }
  console.log('\n   Gợi ý: Bạn có thể tìm icon nước miễn phí tại https://www.flaticon.com');
}

console.log('\nBước tiếp theo:');
console.log('1. npm install   - Để cài đặt tất cả dependencies');
console.log('2. npm run build - Để build extension');
console.log('3. Bật "Developer mode" trong chrome://extensions/');
console.log('4. Nhấp "Load unpacked" và chọn thư mục dist');

if (missingSounds.length > 0 || missingIcons.length > 0) {
  console.log('\n⚠️ Hãy thêm các file còn thiếu trước khi build extension');
} else {
  console.log('\n✅ Tất cả các file cần thiết đã sẵn sàng, bạn có thể tiến hành build extension');
} 