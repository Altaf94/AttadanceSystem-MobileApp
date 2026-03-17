/**
 * Volunteer Attendance System
 * React Native Mobile App
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { ToastProvider } from './src/components';

// Suppress known warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ToastProvider>
        <AppNavigator />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default App;
