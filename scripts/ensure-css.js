/**
 * ensure-css.js
 * Script đảm bảo file CSS tồn tại trước khi Vite build
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function ensureCssExists() {
  try {
    console.log('🔍 Kiểm tra file CSS trước khi build...');
    
    // Thư mục đích
    const distDir = path.join(rootDir, 'dist');
    const assetsDir = path.join(distDir, 'assets');
    
    // Đường dẫn đến file CSS đích
    const targetCssPath = path.join(assetsDir, 'popup.css');
    
    // Đảm bảo thư mục dist/assets tồn tại
    try {
      await fs.mkdir(assetsDir, { recursive: true });
      console.log('✅ Đảm bảo thư mục assets tồn tại');
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('❌ Không thể tạo thư mục assets:', err);
      }
    }
    
    // Kiểm tra nếu file CSS gốc tồn tại
    const srcCssPath = path.join(rootDir, 'src', 'styles.css');
    let cssContent;
    
    try {
      cssContent = await fs.readFile(srcCssPath, 'utf-8');
      console.log('✅ Đọc file CSS gốc thành công');
    } catch (err) {
      console.warn('⚠️ Không thể đọc file CSS gốc, tạo file mặc định');
      
      // Tạo CSS mặc định nếu file gốc không tồn tại
      cssContent = `/* Default CSS generated at ${new Date().toISOString()} */
:root {
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --text-color: #1f2937;
  --bg-color: #ffffff;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
}
`;
    }
    
    // Thêm timestamp để đảm bảo không bị cache
    cssContent = `/* Pre-built CSS - Generated at: ${new Date().toISOString()} */\n${cssContent}`;
    
    // Ghi file CSS vào thư mục đích
    await fs.writeFile(targetCssPath, cssContent);
    console.log('✅ Tạo file CSS tại', targetCssPath);
    
    // Tạo file marker để Vite biết là file đã tồn tại
    const markerPath = path.join(assetsDir, '.css-exists');
    await fs.writeFile(markerPath, new Date().toISOString());
    
    console.log('🎉 Tiền xử lý CSS hoàn tất');
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi đảm bảo CSS tồn tại:', error);
    return false;
  }
}

// Chạy hàm
ensureCssExists().then(success => {
  if (!success) {
    console.warn('⚠️ CSS có thể không tồn tại trong quá trình build');
  }
}); 