#!/usr/bin/env node

/**
 * Set support URL at the app level (manual workaround)
 * Usage: node setSupportUrl.js
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { keyId, issuerId, keyPath, appId } = config.apple;

// Load app store copy for support URL
const copyPath = path.join(__dirname, 'locales', 'en-us.json');
const appStoreCopy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));

function generateToken() {
  const privateKey = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + (20 * 60),
    aud: 'appstoreconnect-v1'
  };
  
  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT'
    }
  });
}

async function checkAppAttributes(token) {
  console.log('\n🔍 Checking App-level attributes...\n');
  
  try {
    // Get app details
    const appResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const app = appResponse.data.data;
    console.log('📱 App Attributes:');
    console.log('   Name:', app.attributes.name);
    console.log('   Bundle ID:', app.attributes.bundleId);
    console.log('   SKU:', app.attributes.sku);
    console.log('\n   All attributes:', Object.keys(app.attributes));
    
    console.log('\n💡 Support URL Information:');
    console.log('   The support URL field in App Store Connect is NOT available via API.');
    console.log('   Apple requires this to be set manually in App Store Connect.');
    console.log('\n   To set it:');
    console.log('   1. Go to https://appstoreconnect.apple.com');
    console.log('   2. Select your app → App Information');
    console.log('   3. Scroll to "Support URL"');
    console.log('   4. Enter: ' + appStoreCopy.supportUrl);
    console.log('   5. Click "Save"');
    console.log('\n   This only needs to be done ONCE and applies to all versions.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function main() {
  const token = generateToken();
  await checkAppAttributes(token);
}

main();

