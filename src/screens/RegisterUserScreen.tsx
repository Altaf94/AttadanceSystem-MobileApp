import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../types';
import { COLORS, SERVICE_UNIT_OPTIONS, SERVICE_OPTIONS } from '../constants';
import { registerUser } from '../services/api';
import { getUser, isAdmin } from '../utils';

type RegisterUserScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterUser'>;

interface Props {
  navigation: RegisterUserScreenNavigationProp;
}

const RegisterUserScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [service, setService] = useState('');
  const [serviceUnit, setServiceUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getUser();
      const admin = isAdmin(user?.email);
      setIsUserAdmin(admin);
    } catch {
      setIsUserAdmin(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password || !serviceUnit || !service) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await registerUser({ name, email, password, service, serviceUnit });
      setMessage('✓ User registered successfully');
      setName('');
      setEmail('');
      setPassword('');
      setService('');
      setServiceUnit('');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setMessage(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isUserAdmin === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  if (!isUserAdmin) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedTitle}>Access denied</Text>
        <Text style={styles.accessDeniedText}>You do not have permission to register users.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Image
                source={require('../assets/images/LoginLogo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.title}>Register User</Text>
              <Text style={styles.subtitle}>Add a new volunteer to the system</Text>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={COLORS.gray}
                  value={name}
                  onChangeText={setName}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={COLORS.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor={COLORS.gray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={serviceUnit}
                    onValueChange={(value) => {
                      setServiceUnit(value);
                      setService('');
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Service Unit" value="" />
                    {SERVICE_UNIT_OPTIONS.map(unit => (
                      <Picker.Item key={unit} label={unit} value={unit} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={service}
                    onValueChange={setService}
                    style={styles.picker}
                    enabled={!!serviceUnit}
                  >
                    <Picker.Item label="Select Service" value="" />
                    {serviceUnit && SERVICE_OPTIONS[serviceUnit]?.map(s => (
                      <Picker.Item key={s} label={s} value={s} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (loading || !serviceUnit || !service || password.length < 6) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || !serviceUnit || !service || password.length < 6}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>✓ Register</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.cancelButtonText}>Back</Text>
                  </TouchableOpacity>
                </View>

                {message && (
                  <View
                    style={[
                      styles.messageContainer,
                      message.includes('successfully') ? styles.successMessage : styles.errorMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.includes('successfully') ? styles.successText : styles.errorText,
                      ]}
                    >
                      {message}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.danger,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoSection: {
    backgroundColor: COLORS.cardBackground,
    padding: 30,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 100,
  },
  formSection: {
    padding: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.black,
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  picker: {
    height: 50,
    color: COLORS.black,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ec9ff',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  messageContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  successMessage: {
    backgroundColor: '#eaf7ee',
    borderWidth: 1,
    borderColor: '#b7dfc1',
  },
  errorMessage: {
    backgroundColor: '#ffe6e6',
    borderWidth: 1,
    borderColor: '#f8b4b4',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#146c43',
  },
  errorText: {
    color: '#c24242',
  },
});

export default RegisterUserScreen;
