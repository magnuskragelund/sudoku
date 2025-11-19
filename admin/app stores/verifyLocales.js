#!/usr/bin/env node

/**
 * Verify all locale files are ready for upload
 * Checks that all required fields are present and valid
 * Usage: node verifyLocales.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = ['appName', 'subtitle', 'description', 'keywords'];
const OPTIONAL_FIELDS = ['whatsNew', 'promotionalText', 'supportUrl'];

/**
 * Find all locale JSON files
 */
function findLocaleFiles() {
  const localesDir = path.join(__dirname, 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error('❌ locales/ directory not found!');
    return [];
  }
  
  const files = fs.readdirSync(localesDir);
  return files.filter(file => {
    return /^([a-z]{2}(-[a-z]{2,4})?)\.json$/i.test(file) && !file.includes('prompt');
  });
}

/**
 * Validate a locale file
 */
function validateLocaleFile(filename) {
  const filePath = path.join(__dirname, 'locales', filename);
  const locale = filename.replace('.json', '');
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const errors = [];
    const warnings = [];
    
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!content[field]) {
        errors.push(`Missing required field: ${field}`);
      } else if (typeof content[field] !== 'string') {
        errors.push(`Field ${field} must be a string`);
      }
    }
    
    // Check optional fields
    for (const field of OPTIONAL_FIELDS) {
      if (content[field] && typeof content[field] !== 'string') {
        warnings.push(`Optional field ${field} should be a string`);
      }
    }
    
    // Validate subtitle length (max 30 chars for App Store)
    if (content.subtitle && content.subtitle.length > 30) {
      warnings.push(`Subtitle is ${content.subtitle.length} chars (max 30 recommended)`);
    }
    
    // Validate keywords length (max 100 chars for App Store)
    if (content.keywords) {
      const keywordLength = content.keywords.length;
      if (keywordLength > 100) {
        errors.push(`Keywords are ${keywordLength} chars (max 100 allowed)`);
      } else if (keywordLength < 50) {
        warnings.push(`Keywords are only ${keywordLength} chars (consider using full 100 chars)`);
      }
    }
    
    // Check for common issues
    if (content.subtitle && content.subtitle.includes('adds')) {
      errors.push(`Subtitle contains typo: "adds" should be "ads"`);
    }
    
    if (content.keywords && content.keywords.includes('soduko')) {
      errors.push(`Keywords contain misspelling: "soduko" should be "sudoku"`);
    }
    
    // Check description has content
    if (content.description && content.description.length < 100) {
      warnings.push(`Description is very short (${content.description.length} chars)`);
    }
    
    return {
      locale,
      filename,
      content,
      errors,
      warnings,
      valid: errors.length === 0
    };
    
  } catch (error) {
    return {
      locale,
      filename,
      errors: [`Failed to parse JSON: ${error.message}`],
      warnings: [],
      valid: false
    };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('\n🔍 VERIFYING LOCALE FILES FOR UPLOAD\n');
  console.log('='.repeat(70));
  
  const localeFiles = findLocaleFiles();
  
  if (localeFiles.length === 0) {
    console.error('\n❌ No locale files found!');
    process.exit(1);
  }
  
  console.log(`\nFound ${localeFiles.length} locale file(s)\n`);
  
  const results = localeFiles.map(validateLocaleFile);
  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);
  
  // Display results
  results.forEach(result => {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.locale}`);
    
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }
    
    if (result.valid && result.warnings.length === 0) {
      console.log(`   ✓ All checks passed`);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Valid: ${valid.length}/${results.length}`);
  console.log(`❌ Invalid: ${invalid.length}/${results.length}`);
  
  if (invalid.length > 0) {
    console.log('\n⚠️  Please fix errors before uploading!\n');
    process.exit(1);
  } else {
    console.log('\n✅ All locale files are ready for upload!');
    console.log('\n💡 Next steps:');
    console.log('   Push single locale:  node pushToAppStore.js <locale>');
    console.log('   Push all locales:    node pushAllToAppStore.js');
    console.log('   Push to both stores: node pushAllToBoth.js\n');
  }
}

main();

