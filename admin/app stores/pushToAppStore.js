#!/usr/bin/env node

/**
 * Push app store metadata to Apple App Store Connect API
 * Usage: node pushToAppStore.js <locale>
 * Example: node pushToAppStore.js en-us
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Parse command line arguments
const locale = process.argv[2];
if (!locale) {
  console.error('Error: Please specify a locale (e.g., en-us, de-de)');
  console.error('Usage: node pushToAppStore.js <locale>');
  process.exit(1);
}

// Load configuration
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json not found. Please create it with your API credentials.');
  console.error('See README.md for setup instructions.');
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

// Define locales directory
const LOCALES_DIR = path.join(__dirname, 'locales');

/**
 * Format locale for Apple API with special handling for Apple-specific codes
 * Apple uses different codes for some locales:
 * - Chinese: zh-hans (Simplified), zh-hant (Traditional) - script-based, not country
 * - Some languages use just language code: da, it, ja, ko, etc.
 */
function formatLocale(locale) {
  const lower = locale.toLowerCase();
  
  // Special cases for Apple's script-based Chinese locales
  if (lower === 'zh-hans' || lower === 'zh-cn') return 'zh-Hans';
  if (lower === 'zh-hant' || lower === 'zh-tw') return 'zh-Hant';
  
  // Special cases for language-only codes (no country)
  const languageOnlyCodes = ['da', 'it', 'ja', 'ko', 'sv', 'no', 'fi', 'nl', 'pl', 'ru', 'tr'];
  if (languageOnlyCodes.includes(lower)) {
    return lower;
  }
  
  // Standard format: language-COUNTRY (e.g., en-US, de-DE)
  const parts = locale.split('-');
  if (parts.length === 2) {
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  }
  
  return locale;
}

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
 * Get app info localization ID for the specified locale (if possible)
 * Returns null if localization doesn't exist and can't be created
 */
async function getAppInfoLocalizationId(token, locale) {
  const appleLocale = formatLocale(locale); // Convert en-us to en-US
  
  try {
    const response = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Find the appInfo for current app state (usually PREPARE_FOR_SUBMISSION or READY_FOR_SALE)
    const appInfo = response.data.data[0];
    if (!appInfo) {
      console.warn('No app info found for this app');
      return null;
    }
    
    // Get localizations for this appInfo
    const localizationsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/appInfos/${appInfo.id}/appInfoLocalizations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Find localization for specified locale
    const localization = localizationsResponse.data.data.find(
      loc => loc.attributes.locale === appleLocale
    );
    
    if (localization) {
      return localization.id;
    }
    
    // Try to create localization if it doesn't exist
    // This may fail if app is in a non-editable state, which is okay
    try {
      console.log(`Attempting to create app info localization for ${appleLocale}...`);
      const createResponse = await axios.post(
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
      
      return createResponse.data.data.id;
    } catch (createError) {
      console.warn(`⚠️  Cannot create app info localization (app may be live). This is okay - we'll update version localization instead.`);
      return null;
    }
  } catch (error) {
    console.error('Error accessing app info:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Update app store metadata
 */
async function updateMetadata(token, localizationId) {
  if (!localizationId) {
    console.log('⚠️  Skipping app info update (no editable localization available)');
    return;
  }
  
  try {
    // Update subtitle and privacy policy (part of appInfoLocalization)
    console.log('Updating app info (subtitle)...');
    await axios.patch(
      `https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/${localizationId}`,
      {
        data: {
          type: 'appInfoLocalizations',
          id: localizationId,
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
    console.log('✓ Subtitle updated');
    
  } catch (error) {
    console.warn('⚠️  Could not update app info:', error.response?.data?.errors?.[0]?.detail || error.message);
  }
}

/**
 * Update app store version localization (description, keywords)
 */
async function updateAppStoreVersionLocalization(token, locale) {
  const appleLocale = formatLocale(locale);
  
  try {
    // Get current app store version
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
      console.warn('No editable app store version found. Create a new version in App Store Connect first.');
      return;
    }
    
    console.log(`Found app store version: ${version.attributes.versionString}`);
    
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
    
    let localization = localizationsResponse.data.data.find(
      loc => loc.attributes.locale === appleLocale
    );
    
    // Create localization if it doesn't exist
    if (!localization) {
      console.log(`Creating new version localization for ${appleLocale}...`);
      const createResponse = await axios.post(
        'https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations',
        {
          data: {
            type: 'appStoreVersionLocalizations',
            attributes: {
              locale: appleLocale,
              description: appStoreCopy.description,
              keywords: appStoreCopy.keywords
            },
            relationships: {
              appStoreVersion: {
                data: {
                  type: 'appStoreVersions',
                  id: version.id
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
      localization = createResponse.data.data;
    }
    
    // Update description and keywords
    console.log('Updating description and keywords...');
    await axios.patch(
      `https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/${localization.id}`,
      {
        data: {
          type: 'appStoreVersionLocalizations',
          id: localization.id,
          attributes: {
            description: appStoreCopy.description,
            keywords: appStoreCopy.keywords
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
    
    console.log('✓ Description and keywords updated');
    
  } catch (error) {
    console.error('Error updating app store version localization:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`\n🚀 Pushing ${locale} metadata to App Store Connect...\n`);
    
    const token = generateToken();
    console.log('✓ Generated JWT token');
    
    const localizationId = await getAppInfoLocalizationId(token, locale);
    if (localizationId) {
      console.log(`✓ Found app info localization ID: ${localizationId}`);
    }
    
    await updateMetadata(token, localizationId);
    await updateAppStoreVersionLocalization(token, locale);
    
    console.log('\n✅ Successfully pushed metadata to App Store Connect!');
    console.log('Note: Changes may need to be submitted for review depending on app state.\n');
    
  } catch (error) {
    console.error('\n❌ Failed to push metadata:', error.message);
    process.exit(1);
  }
}

main();

