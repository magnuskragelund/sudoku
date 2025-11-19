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
    // Update subtitle (part of appInfoLocalization)
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
    // Get app store versions - only look for editable ones
    // PREPARE_FOR_SUBMISSION = can edit
    // DEVELOPER_REJECTED = can edit after rejection
    const versionsResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,DEVELOPER_REJECTED`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Sort versions by version string (newest first) since API doesn't support sort
    const versions = versionsResponse.data.data;
    versions.sort((a, b) => {
      const aVersion = a.attributes.versionString.split('.').map(Number);
      const bVersion = b.attributes.versionString.split('.').map(Number);
      for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
        const aVal = aVersion[i] || 0;
        const bVal = bVersion[i] || 0;
        if (bVal !== aVal) return bVal - aVal;
      }
      return 0;
    });
    
    const version = versions[0];
    if (!version) {
      console.error('\n❌ No editable app store version found!');
      console.error('\n📋 To fix this:');
      console.error('   1. Go to App Store Connect: https://appstoreconnect.apple.com');
      console.error('   2. Select your app → App Store tab');
      console.error('   3. Click "+" to create a new version (e.g., 1.0.9)');
      console.error('   4. Wait 1-2 minutes, then run this script again\n');
      return;
    }
    
    console.log(`Found editable app store version: ${version.attributes.versionString} (${version.attributes.appStoreState})`);
    
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
      const attributes = {
        locale: appleLocale,
        description: appStoreCopy.description,
        keywords: appStoreCopy.keywords,
        whatsNew: appStoreCopy.whatsNew
      };
      
      // Include promotionalText if it exists
      if (appStoreCopy.promotionalText) {
        attributes.promotionalText = appStoreCopy.promotionalText;
      }
      
      const createResponse = await axios.post(
        'https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations',
        {
          data: {
            type: 'appStoreVersionLocalizations',
            attributes: attributes,
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
    
    // Update description, keywords, what's new, and promotional text
    console.log('Updating description, keywords, release notes, and promotional text...');
    const updateAttributes = {
      description: appStoreCopy.description,
      keywords: appStoreCopy.keywords,
      whatsNew: appStoreCopy.whatsNew
    };
    
    // Include promotionalText if it exists
    if (appStoreCopy.promotionalText) {
      updateAttributes.promotionalText = appStoreCopy.promotionalText;
    }
    
    await axios.patch(
      `https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/${localization.id}`,
      {
        data: {
          type: 'appStoreVersionLocalizations',
          id: localization.id,
          attributes: updateAttributes
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ Description, keywords, release notes, and promotional text updated');
    
  } catch (error) {
    // Check for STATE_ERROR (version not editable)
    if (error.response?.status === 409) {
      const errors = error.response?.data?.errors || [];
      const stateError = errors.find(e => e.code === 'STATE_ERROR');
      
      if (stateError) {
        console.error('\n❌ Cannot edit metadata - app version is not in editable state');
        console.error(`\n📋 Error: ${stateError.detail || stateError.title}`);
        console.error('\n💡 Solution:');
        console.error('   1. Go to App Store Connect: https://appstoreconnect.apple.com');
        console.error('   2. Select your app → App Store tab');
        console.error('   3. Create a NEW version (e.g., 1.0.9)');
        console.error('   4. Wait 1-2 minutes for it to appear');
        console.error('   5. Run this script again\n');
        console.error('   Note: Metadata can only be edited when version is in "Prepare for Submission" state');
        throw new Error('Version not editable - create new version in App Store Connect');
      }
    }
    
    console.error('Error updating app store version localization:', error.response?.data || error.message);
    throw error;
  }
}

// Note: Support URL cannot be set via API - must be set manually in App Store Connect
// See README.md for instructions

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
    // Don't show duplicate error messages if we already showed helpful guidance
    if (!error.message.includes('Version not editable')) {
      console.error('\n❌ Failed to push metadata:', error.message);
    }
    process.exit(1);
  }
}

main();

