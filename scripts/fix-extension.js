/**
 * fix-extension.js
 * Script sửa chữa cấu trúc của extension sau khi build
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function fixExtension() {
  console.log('🔧 Đang sửa chữa cấu trúc extension...');
  
  try {
    // 1. Sửa tệp HTML
    const htmlPath = path.join(distDir, 'popup.html');
    
    if (await fileExists(htmlPath)) {
      let htmlContent = await fs.readFile(htmlPath, 'utf-8');
      
      // Loại bỏ các tham chiếu không cần thiết
      htmlContent = htmlContent.replace(/<link[^>]*modulepreload[^>]*>/g, '');
      
      // Đảm bảo chỉ giữ lại một thẻ CSS duy nhất
      const cssLinkMatches = htmlContent.match(/<link[^>]*stylesheet[^>]*href="\.\/assets\/popup\.css"[^>]*>/g) || [];
      if (cssLinkMatches.length > 1) {
        // Loại bỏ tất cả thẻ link CSS
        htmlContent = htmlContent.replace(/<link[^>]*stylesheet[^>]*href="\.\/assets\/popup\.css"[^>]*>/g, '');
        // Thêm lại một thẻ link CSS duy nhất
        htmlContent = htmlContent.replace(
          '</head>',
          '<link rel="stylesheet" href="./assets/popup.css">\n</head>'
        );
        console.log('✅ Đã xóa thẻ CSS trùng lặp');
      }
      
      // Thay thế script tag sai
      htmlContent = htmlContent.replace(
        /<script[^>]*src="\.\/popup\.js"[^>]*><\/script>/g,
        ''
      );
      
      // Đảm bảo đường dẫn JS đúng
      const scriptMatch = htmlContent.match(/<script[^>]*src="\.\/assets\/popup\.js"[^>]*><\/script>/);
      if (!scriptMatch) {
        // Thay thế bất kỳ script nào tham chiếu đến popup.js
        htmlContent = htmlContent.replace(
          /<script[^>]*src="[^"]*popup\.js"[^>]*><\/script>/,
          '<script type="module" crossorigin src="./assets/popup.js"></script>'
        );
        
        // Nếu không có script nào, thêm vào
        if (!htmlContent.includes('assets/popup.js')) {
          htmlContent = htmlContent.replace(
            '</head>',
            '<script type="module" crossorigin src="./assets/popup.js"></script>\n</head>'
          );
        }
      }
      
      // Ghi lại tệp HTML
      await fs.writeFile(htmlPath, htmlContent);
      console.log('✅ Đã sửa tệp HTML');
      
      // Kiểm tra kết quả sau khi sửa
      const updatedHtml = await fs.readFile(htmlPath, 'utf-8');
      const cssLinks = updatedHtml.match(/<link[^>]*stylesheet[^>]*href="\.\/assets\/popup\.css"[^>]*>/g) || [];
      const jsLinks = updatedHtml.match(/<script[^>]*src="\.\/assets\/popup\.js"[^>]*><\/script>/g) || [];
      
      console.log(`📊 Kiểm tra: Số thẻ link CSS: ${cssLinks.length}, Số thẻ script JS: ${jsLinks.length}`);
      
      if (cssLinks.length > 1) {
        console.warn('⚠️ Vẫn còn thẻ CSS trùng lặp!');
      }
      
      if (jsLinks.length === 0) {
        console.warn('⚠️ Không tìm thấy thẻ script JS!');
      }
    } else {
      console.error('❌ Không tìm thấy tệp HTML!');
    }
    
    // 2. Kiểm tra và xóa tệp popup.js thừa ở thư mục gốc
    const rootPopupJsPath = path.join(distDir, 'popup.js');
    if (await fileExists(rootPopupJsPath)) {
      await fs.unlink(rootPopupJsPath);
      console.log('✅ Đã xóa tệp popup.js thừa ở thư mục gốc');
    }
    
    console.log('🎉 Đã sửa chữa cấu trúc extension thành công!');
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi sửa chữa extension:', error);
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Chạy chức năng
fixExtension().then(success => {
  if (success) {
    console.log('✨ Extension đã sẵn sàng để sử dụng!');
  } else {
    console.error('⚠️ Có lỗi xảy ra khi sửa chữa extension!');
    process.exit(1);
  }
}); 