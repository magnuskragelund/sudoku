#!/usr/bin/env node

/**
 * List all available locale files
 * Usage: node listLocales.js
 */

const fs = require('fs');
const path = require('path');

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
  
  return localeFiles;
}

/**
 * Load and display locale info
 */
function displayLocaleInfo(filename) {
  try {
    const filePath = path.join(__dirname, 'locales', filename);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const locale = filename.replace('.json', '');
    
    // Format locale name for display
    let formattedLocale;
    if (locale === 'zh-hans') {
      formattedLocale = 'zh-Hans (Simplified Chinese)';
    } else if (locale === 'zh-hant') {
      formattedLocale = 'zh-Hant (Traditional Chinese)';
    } else if (locale.length === 2) {
      // Language-only codes like da, it, ja, ko
      formattedLocale = locale.toLowerCase();
    } else {
      // Standard format: xx-XX
      const parts = locale.split('-');
      formattedLocale = parts.length === 2 
        ? `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`
        : locale;
    }
    
    console.log(`\n📍 ${formattedLocale}`);
    console.log(`   File: locales/${filename}`);
    console.log(`   App Name: ${content.appName || 'N/A'}`);
    console.log(`   Subtitle: ${content.subtitle || 'N/A'}`);
    console.log(`   Description: ${(content.description || '').substring(0, 80)}...`);
    console.log(`   Keywords: ${content.keywords || 'N/A'}`);
    
  } catch (error) {
    console.error(`   ❌ Error reading ${filename}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('\n🌍 AVAILABLE LOCALES\n');
  console.log('='.repeat(70));
  
  const localeFiles = findLocaleFiles();
  
  if (localeFiles.length === 0) {
    console.log('\n❌ No locale files found!');
    console.log('Create locale files in locales/ directory in the format: en-us.json, de-de.json, etc.\n');
    process.exit(1);
  }
  
  console.log(`\nFound ${localeFiles.length} locale file(s):\n`);
  
  localeFiles.forEach(displayLocaleInfo);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Usage:');
  console.log('   Push single locale:  node pushToAppStore.js <locale>');
  console.log('   Push all locales:    node pushAllToAppStore.js');
  console.log('   Push to both stores: node pushAllToBoth.js\n');
}

main();

