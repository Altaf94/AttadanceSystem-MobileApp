import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { loginUser } from '../services/api';
import { saveUser } from '../utils';
import {
  ScreenLayout,
  FormField,
  PasswordField,
  PrimaryButton,
  Icon,
  AppAlertModal,
} from '../components';
import { screenStyles } from '../theme/screenStyles';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginError {
  message: string;
  showModal: boolean;
}

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const clearError = () => {
    if (error) setError(null);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError({ message: 'Please enter email and password', showModal: false });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email.trim().toLowerCase(), password.trim());
      const user = response?.user;

      if (user?.id) {
        await saveUser({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          service: user.service,
          serviceUnit: user.serviceUnit,
          active: user.active,
        });
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError({ message, showModal: true });
    } finally {
      setLoading(false);
    }
  };

  const inlineError = error && !error.showModal ? error.message : null;

  return (
    <ScreenLayout keyboard centered>
      <View style={screenStyles.card}>
        <View style={screenStyles.logoWrap}>
          <Image
            source={require('../assets/images/LoginLogo.jpg')}
            style={screenStyles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[screenStyles.screenTitle, loginStyles.headerTitle]}>
          Attendance System
        </Text>

        <FormField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearError();
          }}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        {inlineError ? (
          <View style={screenStyles.errorBanner}>
            <Icon name="alert-circle-outline" size={18} color={COLORS.danger} family="ionicons" />
            <Text style={[screenStyles.bannerText, screenStyles.errorText]}>{inlineError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Sign In"
          icon="log-in-outline"
          onPress={handleLogin}
          loading={loading}
        />
      </View>

      <AppAlertModal
        visible={!!error?.showModal}
        title="Login failed"
        message={error?.showModal ? error.message : ''}
        variant="error"
        confirmText="Try again"
        onClose={() => setError(null)}
      />
    </ScreenLayout>
  );
};

const loginStyles = StyleSheet.create({
  headerTitle: {
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
    marginBottom: 28,
  },
});

export default LoginScreen;
