#!/usr/bin/env node

/**
 * Add a new locale to a live app by updating the current live version
 * This script tries to add a locale to the existing app info
 * Usage: node addLocaleToLiveApp.js <locale>
 * Example: node addLocaleToLiveApp.js de-de
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Parse command line arguments
const locale = process.argv[2];
if (!locale) {
  console.error('Error: Please specify a locale (e.g., en-us, de-de)');
  console.error('Usage: node addLocaleToLiveApp.js <locale>');
  process.exit(1);
}

// Load configuration
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json not found. Please create it with your API credentials.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { keyId, issuerId, keyPath, appId } = config.apple;

// Load app store copy
const copyPath = path.join(__dirname, 'locales', `${locale}.json`);
if (!fs.existsSync(copyPath)) {
  console.error(`Error: locales/${locale}.json not found`);
  process.exit(1);
}

const appStoreCopy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));

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
 * Format locale for Apple API with special handling for Apple-specific codes
 */
function formatLocale(locale) {
  const lower = locale.toLowerCase();
  
  // Special cases for Apple's script-based Chinese locales
  if (lower === 'zh-hans' || lower === 'zh-cn') return 'zh-Hans';
  if (lower === 'zh-hant' || lower === 'zh-tw') return 'zh-Hant';
  
  // Special cases for language-only codes
  const languageOnlyCodes = ['da', 'it', 'ja', 'ko', 'sv', 'no', 'fi', 'nl', 'pl', 'ru', 'tr'];
  if (languageOnlyCodes.includes(lower)) {
    return lower;
  }
  
  // Standard format: language-COUNTRY
  const parts = locale.split('-');
  if (parts.length === 2) {
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  }
  
  return locale;
}

/**
 * Get the LIVE app info (not tied to a specific version)
 */
async function getLiveAppInfo(token) {
  try {
    // Get all app infos - we want the one for the live app
    const response = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // The live app typically has appStoreState of READY_FOR_SALE
    const liveAppInfo = response.data.data.find(
      info => info.attributes.appStoreState === 'READY_FOR_SALE'
    );
    
    if (liveAppInfo) {
      return liveAppInfo;
    }
    
    // If not found, just use the first one
    return response.data.data[0];
    
  } catch (error) {
    console.error('Error getting app info:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Add locale to live app info
 */
async function addLocaleToAppInfo(token, appleLocale) {
  try {
    console.log('Getting live app info...');
    const appInfo = await getLiveAppInfo(token);
    
    if (!appInfo) {
      console.error('❌ No app info found');
      return false;
    }
    
    console.log(`✓ Found app info (state: ${appInfo.attributes.appStoreState})`);
    
    // Check if locale already exists
    console.log('Checking existing localizations...');
    const localizationsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/appInfos/${appInfo.id}/appInfoLocalizations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const existingLocale = localizationsResponse.data.data.find(
      loc => loc.attributes.locale === appleLocale
    );
    
    if (existingLocale) {
      console.log(`✓ Locale ${appleLocale} already exists, updating...`);
      
      // Update existing localization
      await axios.patch(
        `https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/${existingLocale.id}`,
        {
          data: {
            type: 'appInfoLocalizations',
            id: existingLocale.id,
            attributes: {
              subtitle: appStoreCopy.subtitle
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✓ Subtitle updated successfully!');
      return true;
    }
    
    // Try to create new localization
    console.log(`Creating new localization for ${appleLocale}...`);
    console.log('Note: This requires the locale to be enabled in App Store Connect first.');
    
    await axios.post(
      'https://api.appstoreconnect.apple.com/v1/appInfoLocalizations',
      {
        data: {
          type: 'appInfoLocalizations',
          attributes: {
            locale: appleLocale,
            name: appStoreCopy.appName,
            subtitle: appStoreCopy.subtitle
          },
          relationships: {
            appInfo: {
              data: {
                type: 'appInfos',
                id: appInfo.id
              }
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ New localization created successfully!');
    return true;
    
  } catch (error) {
    if (error.response?.data?.errors?.[0]?.code === 'ENTITY_ERROR.RELATIONSHIP.INVALID') {
      console.error('\n❌ Cannot create new localization for live app via API');
      console.error('\n📝 To add a new language to your LIVE app:');
      console.error('   1. Go to App Store Connect');
      console.error('   2. Select your app → App Store tab');
      console.error('   3. Click "App Information" in the sidebar');
      console.error('   4. Under "Localizable Information", click "+ Add Locale"');
      console.error(`   5. Select "${appleLocale}" and fill in the subtitle`);
      console.error('   6. Save - changes go live immediately!');
      console.error('\n   Once added manually, you can use this script to UPDATE it.\n');
      return false;
    }
    
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const appleLocale = formatLocale(locale);
    console.log(`\n🌍 Adding ${appleLocale} locale to live app...\n`);
    
    const token = generateToken();
    console.log('✓ Generated JWT token');
    
    const success = await addLocaleToAppInfo(token, appleLocale);
    
    if (success) {
      console.log('\n✅ Successfully added/updated locale!');
      console.log('Changes are live immediately.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

main();

