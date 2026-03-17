import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
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
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const user = await getUser();
      setIsLoggedIn(!!user?.id);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'Dashboard' : 'Login'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
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
            headerTintColor: COLORS.primary,
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
            headerTintColor: COLORS.primary,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
