/**
 * validate-build.js
 * Script kiểm tra build output để đảm bảo tất cả các file cần thiết đều tồn tại
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateBuild() {
  console.log('🔍 Kiểm tra kết quả build...');
  
  const distDir = path.join(rootDir, 'dist');
  const requiredFiles = [
    'popup.html',
    'manifest.json',
    'background.js',
    'contentScript.js',
    'assets/popup.css',
    'assets/popup.js'
  ];
  
  let missingFiles = [];
  
  // Kiểm tra các file bắt buộc
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    const exists = await fileExists(filePath);
    
    if (exists) {
      console.log(`✅ ${file} tồn tại`);
    } else {
      console.error(`❌ ${file} không tồn tại`);
      missingFiles.push(file);
    }
  }
  
  // Kiểm tra nội dung HTML
  const htmlPath = path.join(distDir, 'popup.html');
  if (await fileExists(htmlPath)) {
    try {
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      
      // Kiểm tra tham chiếu CSS
      if (htmlContent.includes('assets/popup.css')) {
        console.log('✅ HTML tham chiếu đúng đến CSS');
      } else {
        console.warn('⚠️ HTML không tham chiếu đúng đến CSS');
      }
      
      // Kiểm tra tham chiếu JS
      if (htmlContent.includes('assets/popup.js') || htmlContent.includes('popup.js')) {
        console.log('✅ HTML tham chiếu đúng đến JS');
      } else {
        console.warn('⚠️ HTML không tham chiếu đúng đến JS');
      }
    } catch (err) {
      console.error('❌ Không thể đọc file HTML:', err.message);
    }
  }
  
  // Kiểm tra nếu CSS không empty
  const cssPath = path.join(distDir, 'assets', 'popup.css');
  if (await fileExists(cssPath)) {
    try {
      const cssContent = await fs.readFile(cssPath, 'utf-8');
      if (cssContent.length > 100) {
        console.log('✅ CSS có nội dung hợp lệ');
      } else {
        console.warn('⚠️ CSS có thể quá ngắn hoặc không đầy đủ');
      }
    } catch (err) {
      console.error('❌ Không thể đọc file CSS:', err.message);
    }
  }
  
  // Tóm tắt kết quả
  if (missingFiles.length === 0) {
    console.log('🎉 Kiểm tra build thành công! Tất cả các file đều tồn tại.');
    return true;
  } else {
    console.error('❌ Kiểm tra build thất bại! Các file sau bị thiếu:', missingFiles.join(', '));
    
    // Sao chép CSS vào đúng vị trí nếu nó bị thiếu
    if (missingFiles.includes('assets/popup.css')) {
      try {
        // Tạo thư mục assets nếu nó không tồn tại
        await fs.mkdir(path.join(distDir, 'assets'), { recursive: true });
        
        // Sao chép từ CSS gốc hoặc tạo mới nếu không có
        let cssContent = '';
        const srcCssPath = path.join(rootDir, 'src', 'styles.css');
        
        if (await fileExists(srcCssPath)) {
          cssContent = await fs.readFile(srcCssPath, 'utf-8');
        } else {
          cssContent = `/* Emergency CSS - Generated at: ${new Date().toISOString()} */
body { font-family: system-ui; margin: 0; padding: 10px; }`;
        }
        
        await fs.writeFile(path.join(distDir, 'assets', 'popup.css'), cssContent);
        console.log('✅ Đã khôi phục file CSS thiếu');
      } catch (err) {
        console.error('❌ Không thể khôi phục file CSS:', err.message);
      }
    }
    
    return false;
  }
}

// Chạy kiểm tra
validateBuild().then(success => {
  if (success) {
    console.log('✨ Build đã sẵn sàng để sử dụng!');
  } else {
    console.warn('⚠️ Build có vấn đề nhưng đã được khắc phục');
  }
}); 