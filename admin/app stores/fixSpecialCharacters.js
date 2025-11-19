#!/usr/bin/env node

/**
 * Fix special characters that Apple App Store doesn't allow
 * Removes ✓ and 🎉 from all locale files
 * Usage: node fixSpecialCharacters.js
 */

const fs = require('fs');
const path = require('path');

function findLocaleFiles() {
  const localesDir = path.join(__dirname, 'locales');
  const files = fs.readdirSync(localesDir);
  return files.filter(file => {
    return /^([a-z]{2}(-[a-z]{2,4})?)\.json$/i.test(file) && !file.includes('prompt');
  });
}

function fixLocaleFile(filename) {
  const filePath = path.join(__dirname, 'locales', filename);
  const locale = filename.replace('.json', '');
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed = false;
    
    // Replace ✓ with bullet point or dash
    if (content.description && content.description.includes('✓')) {
      content.description = content.description.replace(/✓/g, '•');
      changed = true;
    }
    
    // Remove 🎉 from whatsNew
    if (content.whatsNew && content.whatsNew.includes('🎉')) {
      content.whatsNew = content.whatsNew.replace(/🎉\s*/g, '');
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
      console.log(`✅ Fixed ${locale}`);
      return true;
    } else {
      console.log(`✓  ${locale} (no changes needed)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${locale}:`, error.message);
    return false;
  }
}

function main() {
  console.log('\n🔧 FIXING SPECIAL CHARACTERS IN LOCALE FILES\n');
  console.log('='.repeat(70));
  console.log('\nRemoving characters not allowed by Apple App Store:');
  console.log('  - ✓ → • (checkmark to bullet)');
  console.log('  - 🎉 → (removed from What\'s New)\n');
  
  const localeFiles = findLocaleFiles();
  let fixed = 0;
  
  localeFiles.forEach(file => {
    if (fixLocaleFile(file)) {
      fixed++;
    }
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Fixed ${fixed} file(s)`);
  console.log(`✓  Checked ${localeFiles.length} file(s)\n`);
}

main();

