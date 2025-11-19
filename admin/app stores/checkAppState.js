#!/usr/bin/env node

/**
 * Check app store version states
 * Shows which versions are editable and which are not
 * Usage: node checkAppState.js
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json not found. Please create it with your API credentials.');
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
 * Get all app store versions with their states
 */
async function getAppVersions(token) {
  try {
    const response = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching app versions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Format state for display
 */
function formatState(state) {
  const states = {
    'PREPARE_FOR_SUBMISSION': { icon: '✅', color: 'green', editable: true },
    'DEVELOPER_REJECTED': { icon: '⚠️', color: 'yellow', editable: true },
    'WAITING_FOR_REVIEW': { icon: '⏳', color: 'yellow', editable: false },
    'IN_REVIEW': { icon: '⏳', color: 'yellow', editable: false },
    'PENDING_DEVELOPER_RELEASE': { icon: '🔒', color: 'red', editable: false },
    'READY_FOR_SALE': { icon: '🔴', color: 'red', editable: false },
    'REJECTED': { icon: '❌', color: 'red', editable: false },
    'METADATA_REJECTED': { icon: '❌', color: 'red', editable: true },
    'REPLACED_WITH_NEW_VERSION': { icon: '🔄', color: 'gray', editable: false },
  };
  
  const stateInfo = states[state] || { icon: '❓', color: 'gray', editable: false };
  return `${stateInfo.icon} ${state} ${stateInfo.editable ? '(Editable)' : '(Not Editable)'}`;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('\n🔍 CHECKING APP STORE VERSION STATES\n');
    console.log('='.repeat(70));
    
    const token = generateToken();
    const versions = await getAppVersions(token);
    
    if (versions.length === 0) {
      console.log('\n❌ No app store versions found.');
      console.log('Create a version in App Store Connect first.\n');
      return;
    }
    
    // Sort versions by version string (newest first)
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
    
    console.log(`\nFound ${versions.length} version(s):\n`);
    
    const editableVersions = [];
    const nonEditableVersions = [];
    
    versions.forEach((version, index) => {
      const state = version.attributes.appStoreState;
      const isEditable = state === 'PREPARE_FOR_SUBMISSION' || 
                        state === 'DEVELOPER_REJECTED' || 
                        state === 'METADATA_REJECTED';
      
      const stateDisplay = formatState(state);
      const versionString = version.attributes.versionString;
      const platform = version.attributes.platform || 'iOS';
      
      console.log(`${index + 1}. Version ${versionString} (${platform})`);
      console.log(`   State: ${stateDisplay}`);
      console.log(`   ID: ${version.id}\n`);
      
      if (isEditable) {
        editableVersions.push(version);
      } else {
        nonEditableVersions.push(version);
      }
    });
    
    // Summary
    console.log('='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    
    if (editableVersions.length > 0) {
      console.log(`\n✅ Editable versions: ${editableVersions.length}`);
      editableVersions.forEach(v => {
        console.log(`   - Version ${v.attributes.versionString} (${v.attributes.appStoreState})`);
      });
      console.log('\n💡 You can upload metadata to these versions now!');
    } else {
      console.log('\n❌ No editable versions found');
      console.log('\n💡 To upload metadata:');
      console.log('   1. Go to App Store Connect: https://appstoreconnect.apple.com');
      console.log('   2. Select your app → App Store tab');
      console.log('   3. Click "+" to create a new version (e.g., 1.0.9)');
      console.log('   4. Wait 1-2 minutes, then run: node pushAllToAppStore.js');
    }
    
    if (nonEditableVersions.length > 0) {
      console.log(`\n🔒 Non-editable versions: ${nonEditableVersions.length}`);
      nonEditableVersions.forEach(v => {
        console.log(`   - Version ${v.attributes.versionString} (${v.attributes.appStoreState})`);
      });
      console.log('\n⚠️  These versions cannot be edited via API');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error checking app state:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();

