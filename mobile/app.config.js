const baseConfig = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const plugins = [
  'expo-router',
  [
    'expo-location',
    {
      locationWhenInUsePermission: 'Allow PRAVAHA to use your location to center the map and show nearby routes.',
    },
  ],
  [
    'expo-splash-screen',
    {
      backgroundColor: '#208AEF',
      image: './assets/images/splash-icon.png',
      imageWidth: 76,
    },
  ],
];

if (googleMapsApiKey) {
  plugins.push([
    'react-native-maps',
    {
      androidGoogleMapsApiKey: googleMapsApiKey,
      iosGoogleMapsApiKey: googleMapsApiKey,
    },
  ]);
}

module.exports = () => ({
  ...baseConfig.expo,
  plugins,
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
});
