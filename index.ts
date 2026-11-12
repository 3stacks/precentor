// The entry point. Move an old hash link (#/psalm/023) to its path first, then
// start Expo Router, so that the router reads the new path.
import './src/lib/legacyHash'
import 'expo-router/entry'
