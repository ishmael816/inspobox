import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspobox.app',
  appName: 'InspoBox',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fafafa',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#fafafa',
    },
  },
};

export default config;
