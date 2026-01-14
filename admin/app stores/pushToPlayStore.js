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

if (!config.google) {
  console.error('Error: Google Play Store configuration not found in config.json');
  console.error('Please add a "google" section to config.json with:');
  console.error('  - keyPath: path to your Google Play service account JSON file');
  console.error('  - packageName: your app package name (e.g., com.yourcompany.sudoku)');
  console.error('\nSee README.md for setup instructions.');
  process.exit(1);
}

const { keyPath, packageName } = config.google;

if (!keyPath || !packageName) {
  console.error('Error: Google Play Store configuration is incomplete');
  console.error('config.json must include:');
  console.error('  - google.keyPath: path to service account JSON file');
  console.error('  - google.packageName: your app package name');
  process.exit(1);
}

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
 * Check for and delete any existing open edits
 * Google Play only allows one open edit at a time
 * Note: Google Play API doesn't have a list endpoint, so we handle conflicts on edit creation
 */
async function cleanupOpenEdits(androidPublisher) {
  // Google Play API doesn't provide a way to list edits
  // We'll handle existing edits when trying to create a new one
  console.log('Note: Will check for existing edits during creation...');
}

/**
 * Create a new edit, handling the case where an edit already exists
 */
async function createEdit(androidPublisher) {
  try {
    const editResponse = await androidPublisher.edits.insert({
      packageName: packageName
    });
    return editResponse.data.id;
  } catch (error) {
    // If edit already exists (409 Conflict or similar), provide helpful error
    const isEditConflict = error.response?.status === 409 || 
                          error.message?.toLowerCase().includes('edit') ||
                          error.message?.toLowerCase().includes('already exists') ||
                          error.message?.toLowerCase().includes('in progress');
    
    if (isEditConflict) {
      throw new Error(`An edit already exists in Google Play Console. Please delete it manually:\n` +
                     `   1. Go to Google Play Console → Your app\n` +
                     `   2. Navigate to: Release → Production (or Internal/Alpha/Beta)\n` +
                     `   3. Look for an "Edit" button or draft changes\n` +
                     `   4. Either commit or discard the existing edit\n` +
                     `   5. Then run this script again\n\n` +
                     `Original error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update app store metadata
 */
async function updateMetadata(androidPublisher, playLocale) {
  let editId = null;
  
  try {
    // Clean up any existing open edits first
    await cleanupOpenEdits(androidPublisher);
    
    console.log('Creating edit...');
    
    // Create an edit (draft changes) - handles existing edits automatically
    editId = await createEdit(androidPublisher);
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
    
    // Update app details (website, contact info) - only needs to be done once (not per locale)
    // NOTE: Contact website updates via API require contact email to be set via API (not just console UI)
    // If you get "contact email not set" errors, either:
    // 1. Set contact website manually in Google Play Console (Settings → App content → Contact details)
    // 2. Or ensure contact email is set via API (may require additional API permissions)
    // For now, we skip this to avoid blocking listing updates
    if (appStoreCopy.supportUrl) {
      const ENABLE_CONTACT_WEBSITE_UPDATE = false; // Set to true to enable (may require contact email via API)
      
      if (ENABLE_CONTACT_WEBSITE_UPDATE) {
        try {
          console.log('Updating contact website...');
          await androidPublisher.edits.details.update({
            packageName: packageName,
            editId: editId,
            requestBody: {
              contactWebsite: appStoreCopy.supportUrl
            }
          });
          console.log('✓ Contact website updated');
        } catch (detailsError) {
          const errorMsg = detailsError.response?.data?.error?.message || detailsError.message || '';
          if (errorMsg.includes('contact email') || errorMsg.includes('Contact email')) {
            console.warn('⚠️  Could not update contact website: Contact email must be set via API.');
            console.warn('   Set contact website manually in Google Play Console instead.');
          } else {
            console.warn('⚠️  Could not update contact website:', detailsError.message);
          }
          // Continue - listing update is more important
        }
      } else {
        console.log(`ℹ️  Contact website update skipped (set ENABLE_CONTACT_WEBSITE_UPDATE=true to enable)`);
        console.log(`   URL to set manually: ${appStoreCopy.supportUrl}`);
        console.log(`   Location: Google Play Console → Settings → App content → Contact details`);
      }
    }
    
    // Update release notes for the production track
    if (appStoreCopy.whatsNew) {
      try {
        console.log('Updating release notes...');
        
        // Get current production track
        const tracks = await androidPublisher.edits.tracks.list({
          packageName: packageName,
          editId: editId
        });
        
        const productionTrack = tracks.data.tracks?.find(t => t.track === 'production');
        
        if (productionTrack && productionTrack.releases && productionTrack.releases.length > 0) {
          const currentRelease = productionTrack.releases[0];
          
          // Add or update release notes for this locale
          const releaseNotes = Array.isArray(currentRelease.releaseNotes) 
            ? [...currentRelease.releaseNotes] 
            : [];
          
          const existingNoteIndex = releaseNotes.findIndex(note => note.language === playLocale);
          
          if (existingNoteIndex >= 0) {
            releaseNotes[existingNoteIndex].text = appStoreCopy.whatsNew;
          } else {
            releaseNotes.push({
              language: playLocale,
              text: appStoreCopy.whatsNew
            });
          }
          
          // Update the track with new release notes
          await androidPublisher.edits.tracks.update({
            packageName: packageName,
            editId: editId,
            track: 'production',
            requestBody: {
              releases: [{
                ...currentRelease,
                releaseNotes: releaseNotes
              }]
            }
          });
          
          console.log('✓ Release notes updated');
        } else {
          console.warn('⚠️  No production release found, skipping release notes');
        }
      } catch (notesError) {
        // Release notes update is not critical - continue even if it fails
        console.warn('⚠️  Could not update release notes:', notesError.message);
      }
    }
    
    // Commit the edit
    console.log('Committing changes...');
    await androidPublisher.edits.commit({
      packageName: packageName,
      editId: editId
    });
    
    console.log('✓ Changes committed');
    editId = null; // Mark as committed so we don't try to delete it
    
  } catch (error) {
    // Clean up the edit if it was created but not committed
    if (editId) {
      try {
        console.log(`\n⚠️  Cleaning up uncommitted edit ${editId}...`);
        await androidPublisher.edits.delete({
          packageName: packageName,
          editId: editId
        });
        console.log('✓ Edit cleaned up');
      } catch (cleanupError) {
        console.warn(`⚠️  Could not delete edit ${editId}:`, cleanupError.message);
      }
    }
    
    // Provide detailed error information
    const errorDetails = error.response?.data || error.message;
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      console.error('\n❌ API Error Details:');
      console.error(`   Code: ${apiError.code || 'unknown'}`);
      console.error(`   Message: ${apiError.message || error.message}`);
      if (apiError.errors) {
        console.error('   Errors:');
        apiError.errors.forEach(err => {
          console.error(`     - ${err.message || JSON.stringify(err)}`);
        });
      }
    } else {
      console.error('Error updating metadata:', errorDetails);
    }
    
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
    
    // Provide helpful error messages for common issues
    if (error.response?.status === 403) {
      const errorMessage = error.message?.toLowerCase() || '';
      const apiError = error.response?.data?.error?.message?.toLowerCase() || '';
      
      if (errorMessage.includes('contact email') || apiError.includes('contact email')) {
        console.error('\n💡 Required: Set contact email in Google Play Console');
        console.error('   This is required before you can commit any changes.');
        console.error('   Steps:');
        console.error('   1. Go to Google Play Console → Your app');
        console.error('   2. Navigate to: Settings → App content → Contact details');
        console.error('   3. Add a contact email address');
        console.error('   4. Save and run this script again');
      } else {
        console.error('\n💡 Tip: Check that your service account has the correct permissions in Google Play Console.');
        console.error('   Go to: Settings → API access → Grant "Release manager" permissions');
      }
    } else if (error.response?.status === 404) {
      console.error('\n💡 Tip: Verify that the package name in config.json matches your app in Google Play Console.');
    } else if (error.message?.includes('edit')) {
      console.error('\n💡 Tip: There may be an open edit in Google Play Console. Try deleting it manually.');
      console.error('   Go to: Google Play Console → Your app → Release → Production → Edit');
    }
    
    process.exit(1);
  }
}

main();

