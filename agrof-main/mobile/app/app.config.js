import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "AGRON",
  slug: "agron",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/robot-icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/robot-icon.png",
      backgroundColor: "#FFFFFF"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-localization",
    "expo-sqlite",
  ],
});
