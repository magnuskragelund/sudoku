#!/usr/bin/env node

/**
 * Push all available locale files to Google Play Store
 * Automatically detects all locale JSON files and pushes them
 * Usage: node pushAllToPlayStore.js
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
 * Run pushToPlayStore.js for a specific locale
 */
function pushLocale(locale) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🤖 PUSHING: ${locale.toUpperCase()}`);
    console.log('='.repeat(70));
    
    const scriptPath = path.join(__dirname, 'pushToPlayStore.js');
    const child = spawn('node', [scriptPath, locale], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Failed to push ${locale} (exit code: ${code})`);
        resolve({ locale, success: false, code });
      } else {
        console.log(`\n✅ Successfully pushed ${locale}`);
        resolve({ locale, success: true });
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Error pushing ${locale}:`, error.message);
      resolve({ locale, success: false, error: error.message });
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🌍 PUSH ALL LOCALES TO GOOGLE PLAY STORE\n');
  
  // Find all locale files
  const locales = findLocaleFiles();
  
  if (locales.length === 0) {
    console.error('❌ No locale files found!');
    console.error('Expected files in locales/ directory like: en-us.json, de-de.json, etc.');
    process.exit(1);
  }
  
  console.log(`Found ${locales.length} locale(s): ${locales.join(', ')}\n`);
  
  // Ask for confirmation (optional - comment out if you want auto-push)
  console.log('Starting push for all locales...\n');
  
  // Push all locales sequentially
  const results = [];
  for (const locale of locales) {
    const result = await pushLocale(locale);
    results.push(result);
    
    // Small delay between pushes to avoid rate limiting
    if (locales.indexOf(locale) < locales.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   - ${r.locale}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`   - ${r.locale}`));
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  if (failed.length > 0) {
    process.exit(1);
  }
}

main();

