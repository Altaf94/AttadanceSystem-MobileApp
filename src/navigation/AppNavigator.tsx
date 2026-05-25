import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { SplashScreen } from '../components';
import { BRAND_TEAL } from '../theme/brand';
import { getUser } from '../utils';
import {
  LoginScreen,
  DashboardScreen,
  CheckInScreen,
  RegisterUserScreen,
  ReportsScreen,
  AddEventScreen,
  ManageEventsScreen,
  GenerateQRScreen,
  QRScannerScreen,
  UserManagementScreen,
  BackdatedAttendanceScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BRAND_TEAL,
    card: BRAND_TEAL,
  },
};

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkLoginStatus = async () => {
      try {
        const user = await getUser();
        if (!cancelled) {
          setIsLoggedIn(!!user?.id);
        }
      } catch {
        if (!cancelled) {
          setIsLoggedIn(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkLoginStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const showSplash = isLoading || splashVisible;

  return (
    <View style={styles.root}>
      {!isLoading ? (
        <NavigationContainer
          theme={navTheme}
          onReady={() => setSplashVisible(false)}
        >
          <Stack.Navigator
            initialRouteName={isLoggedIn ? 'Dashboard' : 'Login'}
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: BRAND_TEAL },
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="CheckIn"
              component={CheckInScreen}
              options={{
                headerShown: true,
                headerTitle: 'Check In',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: COLORS.white,
                },
                headerTintColor: '#0b5a79',
              }}
            />
            <Stack.Screen
              name="RegisterUser"
              component={RegisterUserScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="AddEvent"
              component={AddEventScreen}
              options={{
                headerShown: true,
                headerTitle: 'Add Event',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: COLORS.white,
                },
                headerTintColor: '#0b5a79',
              }}
            />
            <Stack.Screen
              name="ManageEvents"
              component={ManageEventsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="GenerateQR"
              component={GenerateQRScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="BackdatedAttendance"
              component={BackdatedAttendanceScreen}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      ) : null}
      {showSplash ? (
        <View style={styles.splashOverlay}>
          <SplashScreen />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_TEAL,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});

export default AppNavigator;
