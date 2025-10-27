const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Mock ws module for Supabase Realtime
config.resolver.alias = {
  ...config.resolver.alias,
  ws: 'react-native-reanimated/lib/reanimated2/worklets',
};

module.exports = config;

