import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Plugin tùy chỉnh để xử lý CSS trước khi Vite build
const preBuildCssPlugin = () => {
  return {
    name: 'vite-plugin-pre-build-css',
    enforce: 'pre', // Chạy trước tất cả các plugin khác
    
    // Hook chạy trước khi Vite bắt đầu build
    buildStart() {
      const cssDir = path.resolve(__dirname, 'dist/assets');
      const cssFile = path.resolve(cssDir, 'popup.css');
      
      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, { recursive: true });
        console.log('✅ Đã tạo thư mục dist/assets');
      }
      
      // Đọc file CSS gốc
      try {
        const srcCssPath = path.resolve(__dirname, 'src/styles.css');
        if (fs.existsSync(srcCssPath)) {
          const cssContent = fs.readFileSync(srcCssPath, 'utf-8');
          // Thêm timestamp để tránh caching
          const cssWithTimestamp = `/* Pre-built by Vite plugin: ${new Date().toISOString()} */\n${cssContent}`;
          
          // Ghi file CSS
          fs.writeFileSync(cssFile, cssWithTimestamp);
          console.log('✅ Đã tạo file CSS trước khi build:', cssFile);
        } else {
          // Tạo file CSS mặc định
          fs.writeFileSync(cssFile, `/* Default CSS generated at ${new Date().toISOString()} */
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
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
}`);
          console.log('✅ Đã tạo file CSS mặc định trước khi build');
        }
      } catch (error) {
        console.error('❌ Lỗi khi tạo trước file CSS:', error);
      }
    },
    
    // Chặn cảnh báo CSS không tồn tại
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.css')) {
        console.log('🔄 CSS file được cập nhật:', file);
        return [];
      }
    },
    
    // Sửa HTML sau khi build
    closeBundle() {
      try {
        const htmlPath = path.resolve(__dirname, 'dist/popup.html');
        if (fs.existsSync(htmlPath)) {
          let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
          
          // Loại bỏ tất cả thẻ link modulepreload
          htmlContent = htmlContent.replace(/<link[^>]*modulepreload[^>]*>/g, '');
          
          // Đảm bảo chỉ có một thẻ script
          htmlContent = htmlContent.replace(
            /<script[^>]*src="\.\/popup\.js"[^>]*><\/script>/g, 
            ''
          );
          
          // Đảm bảo chỉ có một thẻ CSS
          htmlContent = htmlContent.replace(
            /<link[^>]*stylesheet[^>]*assets\/popup\.css[^>]*>/g,
            '<link rel="stylesheet" href="./assets/popup.css">'
          );
          
          // Thêm script đến tệp JavaScript đúng
          if (!htmlContent.includes('assets/popup.js')) {
            htmlContent = htmlContent.replace(
              '</head>', 
              '<script type="module" src="./assets/popup.js"></script>\n</head>'
            );
          }
          
          fs.writeFileSync(htmlPath, htmlContent);
          console.log('✅ Đã sửa chữa HTML sau khi build');
        }
      } catch (error) {
        console.error('❌ Lỗi khi sửa HTML:', error);
      }
    }
  };
};

// Xoá cảnh báo CSS trong console
const suppressCssWarningsPlugin = () => {
  return {
    name: 'vite-plugin-suppress-css-warnings',
    enforce: 'post',
    
    // Ghi đè console.warn để lọc cảnh báo CSS
    configResolved(config) {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes("doesn't exist at build time") && 
            message.includes('.css')) {
          // Bỏ qua cảnh báo liên quan đến CSS không tồn tại
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  };
};

export default defineConfig({
  base: '',
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Chuyển lại thành true để xóa hoàn toàn trước khi build
    minify: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.js'),
        contentScript: resolve(__dirname, 'src/contentScript.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'popup' ? 'assets/popup.js' : '[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/popup.css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    cssMinify: true,
    sourcemap: false
  },
  css: {
    devSourcemap: false
  },
  plugins: [
    preBuildCssPlugin(),
    suppressCssWarningsPlugin()
  ],
  optimizeDeps: {
    include: ['tailwindcss', 'autoprefixer']
  },
  publicDir: 'public'
}); 