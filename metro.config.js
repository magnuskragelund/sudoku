const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Mock ws module for Supabase Realtime on native platforms only
// On web, use the native WebSocket implementation
// Only apply the alias when not building for web
const isWeb = process.env.WEB || process.argv.includes('--web');
if (!isWeb) {
  config.resolver.alias = {
    ...config.resolver.alias,
    ws: 'react-native-reanimated/lib/reanimated2/worklets',
  };
}

module.exports = config;

