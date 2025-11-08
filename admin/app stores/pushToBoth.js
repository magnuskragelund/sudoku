#!/usr/bin/env node

/**
 * Push app store metadata to both Apple App Store and Google Play Store
 * Usage: node pushToBoth.js <locale>
 * Example: node pushToBoth.js en-us
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const locale = process.argv[2];
if (!locale) {
  console.error('Error: Please specify a locale (e.g., en-us, de-de)');
  console.error('Usage: node pushToBoth.js <locale>');
  process.exit(1);
}

// Verify locale file exists
const localePath = path.join(__dirname, 'locales', `${locale}.json`);
if (!fs.existsSync(localePath)) {
  console.error(`Error: locales/${locale}.json not found`);
  process.exit(1);
}

/**
 * Run a script and return a promise
 */
function runScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath, ...args], {
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
  console.log(`\n🚀 Pushing ${locale} metadata to both app stores...\n`);
  console.log('=' .repeat(60));
  
  try {
    // Push to App Store
    console.log('\n📱 APPLE APP STORE');
    console.log('=' .repeat(60));
    await runScript('pushToAppStore.js', [locale]);
    
    // Push to Play Store
    console.log('\n🤖 GOOGLE PLAY STORE');
    console.log('=' .repeat(60));
    await runScript('pushToPlayStore.js', [locale]);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Successfully pushed metadata to both stores!');
    console.log('=' .repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Failed to push to both stores:', error.message);
    process.exit(1);
  }
}

main();

