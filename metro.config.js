// The native app carries the psalm data as assets with the extension ".corpus".
// See scripts/link-corpus.mjs.
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.resolver.assetExts.push('corpus')
module.exports = config
