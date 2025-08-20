#!/usr/bin/env node

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BYTES_IN_MB = 1024 * 1024;

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = [];

  try {
    const items = await readdir(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stats = await stat(itemPath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
        files.push({
          name: item,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size)
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
    return { totalSize: 0, files: [] };
  }

  return { totalSize, files };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function checkBundleSize() {
  const distPath = join(__dirname, '../dist');
  const assetsPath = join(distPath, 'assets');

  console.log('\n🔍 Bundle Size Report\n');
  console.log('='.repeat(50));

  try {
    const { totalSize, files } = await getDirectorySize(assetsPath);
    
    // Filter JS files
    const jsFiles = files.filter(file => file.name.endsWith('.js'));
    const cssFiles = files.filter(file => file.name.endsWith('.css'));
    
    const jsSize = jsFiles.reduce((acc, file) => acc + file.size, 0);
    const cssSize = cssFiles.reduce((acc, file) => acc + file.size, 0);

    console.log(`📦 Total Assets Size: ${formatBytes(totalSize)}`);
    console.log(`📄 JavaScript Size: ${formatBytes(jsSize)}`);
    console.log(`🎨 CSS Size: ${formatBytes(cssSize)}`);
    console.log('');

    // Bundle size warning
    const targetSize = 1 * BYTES_IN_MB; // 1MB target
    if (totalSize > targetSize) {
      console.log(`⚠️  WARNING: Bundle size (${formatBytes(totalSize)}) exceeds 1MB target!`);
    } else {
      console.log(`✅ Bundle size is within 1MB target (${formatBytes(totalSize)})`);
    }

    console.log('\n📂 Individual Files:');
    console.log('-'.repeat(50));
    
    [...jsFiles, ...cssFiles]
      .sort((a, b) => b.size - a.size)
      .forEach(file => {
        const type = file.name.endsWith('.js') ? 'JS' : 'CSS';
        console.log(`${file.sizeFormatted.padStart(8)} - ${file.name} (${type})`);
      });

    console.log('\n' + '='.repeat(50));
    
    // Return exit code based on bundle size
    if (totalSize > targetSize) {
      console.log(`❌ Bundle optimization needed. Current: ${formatBytes(totalSize)}, Target: ${formatBytes(targetSize)}`);
      process.exit(1);
    } else {
      console.log(`✅ Bundle size optimized successfully!`);
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error checking bundle size:', error.message);
    console.log('\n💡 Make sure to run "npm run build" first to generate the dist folder.');
    process.exit(1);
  }
}

checkBundleSize();