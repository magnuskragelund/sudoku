#!/usr/bin/env node

/**
 * Check which locales are available for the current app version
 * This helps diagnose why a locale push might fail
 * Usage: node checkAvailableLocales.js
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json not found.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { keyId, issuerId, keyPath, appId } = config.apple;

/**
 * Generate JWT token for App Store Connect API authentication
 */
function generateToken() {
  const privateKey = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + (20 * 60), // 20 minutes
    aud: 'appstoreconnect-v1'
  };
  
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT'
    }
  });
  
  return token;
}

/**
 * Check available locales for app version
 */
async function checkLocales(token) {
  try {
    console.log('\n🔍 Checking available locales for your app...\n');
    
    // Get current app store version
    console.log('Fetching app store versions...');
    const versionsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,READY_FOR_SALE`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const version = versionsResponse.data.data[0];
    if (!version) {
      console.warn('⚠️  No editable app store version found.');
      return;
    }
    
    console.log(`✓ Found version: ${version.attributes.versionString}\n`);
    console.log('=' .repeat(70));
    
    // Get localizations for this version
    const localizationsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const localizations = localizationsResponse.data.data;
    
    if (localizations.length === 0) {
      console.log('❌ No localizations found for this version.\n');
      return;
    }
    
    console.log(`\n📍 Available localizations (${localizations.length}):\n`);
    
    localizations.forEach(loc => {
      const locale = loc.attributes.locale;
      const hasDescription = !!loc.attributes.description;
      const hasKeywords = !!loc.attributes.keywords;
      
      console.log(`   ${locale}`);
      console.log(`      Description: ${hasDescription ? '✓' : '✗'}`);
      console.log(`      Keywords: ${hasKeywords ? '✓' : '✗'}`);
      console.log('');
    });
    
    console.log('=' .repeat(70));
    
    // Check local locale files
    console.log('\n📂 Locale files in locales/ directory:\n');
    
    const localesDir = path.join(__dirname, 'locales');
    const files = fs.readdirSync(localesDir);
    const localeFiles = files.filter(file => /^[a-z]{2}-[a-z]{2}\.json$/i.test(file));
    
    localeFiles.forEach(file => {
      const locale = file.replace('.json', '');
      const parts = locale.split('-');
      const formattedLocale = `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
      
      const existsInAppStore = localizations.some(
        loc => loc.attributes.locale === formattedLocale
      );
      
      console.log(`   ${formattedLocale} (${file})`);
      console.log(`      Status: ${existsInAppStore ? '✓ Available in App Store' : '✗ NOT in App Store - needs to be added manually'}`);
      console.log('');
    });
    
    console.log('=' .repeat(70));
    console.log('\n💡 To add a missing locale:');
    console.log('   1. Go to App Store Connect');
    console.log('   2. Select your app → App Store tab');
    console.log(`   3. Select version ${version.attributes.versionString}`);
    console.log('   4. Click "+ Add Localization" or the language dropdown');
    console.log('   5. Select the language and fill in required fields');
    console.log('   6. Save, then run the push script again\n');
    
  } catch (error) {
    console.error('Error checking locales:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const token = generateToken();
    await checkLocales(token);
    
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

main();

