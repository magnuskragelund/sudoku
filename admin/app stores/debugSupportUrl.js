#!/usr/bin/env node

/**
 * Debug script to check current support URL status
 * Usage: node debugSupportUrl.js
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

async function checkSupportUrl(token) {
  console.log('\n🔍 Checking Support URL Status\n');
  console.log('='.repeat(70));
  
  try {
    // Check app store version
    console.log('\n📱 App Store Version:');
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
    if (version) {
      console.log(`   Version: ${version.attributes.versionString}`);
      console.log(`   State: ${version.attributes.appStoreState}`);
      console.log(`   Support URL: ${version.attributes.supportUrl || '(not set)'}`);
      console.log(`   Marketing URL: ${version.attributes.marketingUrl || '(not set)'}`);
      console.log(`   Copyright: ${version.attributes.copyright || '(not set)'}`);
      
      console.log('\n📝 Expected Support URL:', appStoreCopy.supportUrl);
      
      if (version.attributes.supportUrl === appStoreCopy.supportUrl) {
        console.log('✅ Support URL matches!');
      } else {
        console.log('❌ Support URL does NOT match or is not set');
      }
      
      // Try to update it
      console.log('\n🔧 Attempting to update support URL...');
      try {
        const updateResponse = await axios.patch(
          `https://api.appstoreconnect.apple.com/v1/appStoreVersions/${version.id}`,
          {
            data: {
              type: 'appStoreVersions',
              id: version.id,
              attributes: {
                supportUrl: appStoreCopy.supportUrl
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
        
        console.log('✅ Update succeeded!');
        console.log('   New Support URL:', updateResponse.data.data.attributes.supportUrl);
        
      } catch (updateError) {
        console.log('❌ Update failed:');
        if (updateError.response?.data?.errors) {
          updateError.response.data.errors.forEach(err => {
            console.log(`   - ${err.title}: ${err.detail}`);
          });
        } else {
          console.log(`   - ${updateError.message}`);
        }
      }
    }
    
    // Check app info
    console.log('\n📋 App Info:');
    const appInfoResponse = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const appInfo = appInfoResponse.data.data[0];
    if (appInfo) {
      console.log(`   State: ${appInfo.attributes.appStoreState}`);
      console.log(`   Age Rating: ${appInfo.attributes.contentRightsDeclaration || '(not set)'}`);
      console.log('\n   All attributes:', Object.keys(appInfo.attributes));
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function main() {
  const token = generateToken();
  await checkSupportUrl(token);
}

main();

