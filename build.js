// build.js
import { copyFile, cp } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyFiles() {
  try {
    // Copy manifest.json
    await copyFile('manifest.json', 'dist/manifest.json');
    console.log('Copying manifest.json to dist...');

    // Copy icons directory
    await cp('icons', 'dist/icons', { recursive: true });
    console.log('Copying icons directory...');

    // Copy public directory if it exists
    await cp('public', 'dist/public', { recursive: true });
    console.log('Copying public directory...');

    // Copy audio directory if it exists
    await cp('audio', 'dist/audio', { recursive: true });
    console.log('Copying audio directory...');

    console.log('Build process completed successfully!');
  } catch (error) {
    console.error('Error during build process:', error);
    process.exit(1);
  }
}

copyFiles(); 