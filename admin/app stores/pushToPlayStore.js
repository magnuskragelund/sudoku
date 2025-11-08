#!/usr/bin/env node

/**
 * Push app store metadata to Google Play Store via Google Play Developer API
 * Usage: node pushToPlayStore.js <locale>
 * Example: node pushToPlayStore.js en-us
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Parse command line arguments
const locale = process.argv[2];
if (!locale) {
  console.error('Error: Please specify a locale (e.g., en-us, de-de)');
  console.error('Usage: node pushToPlayStore.js <locale>');
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
const { keyPath, packageName } = config.google;

// Load app store copy
const copyPath = path.join(__dirname, 'locales', `${locale}.json`);
if (!fs.existsSync(copyPath)) {
  console.error(`Error: locales/${locale}.json not found`);
  process.exit(1);
}

const appStoreCopy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));

/**
 * Convert locale format for Google Play API
 * Google Play uses standard language-COUNTRY format
 */
function formatLocale(locale) {
  const lower = locale.toLowerCase();
  
  // Map Apple-specific codes to Google Play codes
  if (lower === 'zh-hans') return 'zh-CN';
  if (lower === 'zh-hant') return 'zh-TW';
  
  // Map language-only codes to default country
  const defaultCountries = {
    'da': 'da-DK',
    'it': 'it-IT',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'sv': 'sv-SE',
    'no': 'no-NO',
    'fi': 'fi-FI',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'ru': 'ru-RU',
    'tr': 'tr-TR'
  };
  
  if (defaultCountries[lower]) {
    return defaultCountries[lower];
  }
  
  // Standard format: language-COUNTRY (e.g., en-US, de-DE)
  const parts = locale.split('-');
  if (parts.length === 2) {
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  }
  
  return locale;
}

/**
 * Authenticate with Google Play Developer API
 */
async function authenticate() {
  try {
    const credentials = JSON.parse(
      fs.readFileSync(path.join(__dirname, keyPath), 'utf8')
    );
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
    const authClient = await auth.getClient();
    return google.androidpublisher({ version: 'v3', auth: authClient });
    
  } catch (error) {
    console.error('Error authenticating:', error.message);
    throw error;
  }
}

/**
 * Update app store metadata
 */
async function updateMetadata(androidPublisher, playLocale) {
  try {
    console.log('Creating edit...');
    
    // Create an edit (draft changes)
    const editResponse = await androidPublisher.edits.insert({
      packageName: packageName
    });
    
    const editId = editResponse.data.id;
    console.log(`✓ Edit created: ${editId}`);
    
    // Update listing for specified locale
    console.log(`Updating ${playLocale} listing...`);
    
    await androidPublisher.edits.listings.update({
      packageName: packageName,
      editId: editId,
      language: playLocale,
      requestBody: {
        title: appStoreCopy.appName,
        shortDescription: appStoreCopy.subtitle,
        fullDescription: appStoreCopy.description
      }
    });
    
    console.log('✓ Listing updated');
    
    // Commit the edit
    console.log('Committing changes...');
    await androidPublisher.edits.commit({
      packageName: packageName,
      editId: editId
    });
    
    console.log('✓ Changes committed');
    
  } catch (error) {
    console.error('Error updating metadata:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const playLocale = formatLocale(locale);
    console.log(`\n🚀 Pushing ${playLocale} metadata to Google Play Store...\n`);
    
    const androidPublisher = await authenticate();
    console.log('✓ Authenticated with Google Play Developer API');
    
    await updateMetadata(androidPublisher, playLocale);
    
    console.log('\n✅ Successfully pushed metadata to Google Play Store!');
    console.log('Note: Changes are live immediately but may take a few hours to appear.\n');
    
  } catch (error) {
    console.error('\n❌ Failed to push metadata:', error.message);
    if (error.response?.data?.error) {
      console.error('API Error:', JSON.stringify(error.response.data.error, null, 2));
    }
    process.exit(1);
  }
}

main();

