import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import * as Sentry from '@sentry/react-native';
import { theme } from './src/constants/theme';

Sentry.init({
  dsn: 'https://f31f99f675c0028efc6ed5257ce3a8f1@o4510673696849920.ingest.us.sentry.io/4510673698553856',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  // Set Android navigation bar background color to match app background
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(theme.colors.background);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
});