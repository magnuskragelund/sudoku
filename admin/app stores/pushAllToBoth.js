#!/usr/bin/env node

/**
 * Push all available locale files to both Apple App Store and Google Play Store
 * Automatically detects all locale JSON files and pushes them to both stores
 * Usage: node pushAllToBoth.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Find all locale JSON files in the locales directory
 */
function findLocaleFiles() {
  const localesDir = path.join(__dirname, 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error('❌ locales/ directory not found!');
    return [];
  }
  
  const files = fs.readdirSync(localesDir);
  const localeFiles = files.filter(file => {
    // Match locale patterns:
    // - Standard: xx-xx.json (e.g., en-us.json, de-de.json)
    // - Language only: xx.json (e.g., da.json, it.json, ja.json, ko.json)
    // - Chinese scripts: zh-hans.json, zh-hant.json
    return /^([a-z]{2}(-[a-z]{2,4})?)\.json$/i.test(file) && !file.includes('prompt');
  });
  
  return localeFiles.map(file => file.replace('.json', ''));
}

/**
 * Run a script and return a promise
 */
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${scriptName} exited with code ${code}`));
      } else {
        resolve();
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🌍 PUSH ALL LOCALES TO BOTH APP STORES\n');
  
  // Find all locale files
  const locales = findLocaleFiles();
  
  if (locales.length === 0) {
    console.error('❌ No locale files found!');
    console.error('Expected files in locales/ directory like: en-us.json, de-de.json, etc.');
    process.exit(1);
  }
  
  console.log(`Found ${locales.length} locale(s): ${locales.join(', ')}\n`);
  console.log('Starting push to both stores...\n');
  
  try {
    // Push to App Store
    console.log('\n' + '='.repeat(70));
    console.log('📱 APPLE APP STORE');
    console.log('='.repeat(70) + '\n');
    await runScript('pushAllToAppStore.js');
    
    // Small delay between stores
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Push to Play Store
    console.log('\n' + '='.repeat(70));
    console.log('🤖 GOOGLE PLAY STORE');
    console.log('='.repeat(70) + '\n');
    await runScript('pushAllToPlayStore.js');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL LOCALES PUSHED TO BOTH STORES!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Failed to push to both stores:', error.message);
    process.exit(1);
  }
}

main();

