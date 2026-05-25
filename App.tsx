/**
 * Volunteer Attendance System
 * React Native Mobile App
 *
 * @format
 */

import React from 'react';
import { StatusBar, LogBox, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { ToastProvider } from './src/components';
import { BRAND_TEAL } from './src/theme/brand';

// Suppress known warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

function App(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={BRAND_TEAL}
          translucent={false}
        />
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_TEAL,
  },
});

export default App;
