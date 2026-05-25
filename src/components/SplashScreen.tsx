import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_GRADIENT, BRAND_TEAL_LIGHT } from '../theme/brand';
import { COLORS } from '../constants';

export const SplashScreen: React.FC = () => (
  <LinearGradient
    colors={[...BRAND_GRADIENT]}
    style={styles.container}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/images/LoginLogo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Attendance System</Text>
        <Text style={styles.subtitle}>Volunteer check-in & events</Text>
        <ActivityIndicator
          size="large"
          color={BRAND_TEAL_LIGHT}
          style={styles.spinner}
        />
      </View>
    </SafeAreaView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 72,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 40,
  },
});

export default SplashScreen;
