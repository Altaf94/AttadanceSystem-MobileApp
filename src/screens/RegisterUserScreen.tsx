import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../types';
import { COLORS, SERVICE_UNIT_OPTIONS, SERVICE_OPTIONS } from '../constants';
import { registerUser } from '../services/api';
import { getUser, isAdmin } from '../utils';
import {
  ScreenLayout,
  FormField,
  PasswordField,
  PrimaryButton,
  Icon,
} from '../components';
import { screenStyles } from '../theme/screenStyles';

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
      setIsUserAdmin(isAdmin(user?.email));
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
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        service,
        serviceUnit,
      });
      setMessage('User registered successfully');
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
    return <ScreenLayout loading loadingText="Checking access..." />;
  }

  if (!isUserAdmin) {
    return (
      <ScreenLayout centered>
        <View style={screenStyles.card}>
          <View style={screenStyles.accessDeniedCard}>
            <Icon name="shield-off-outline" size={48} color={COLORS.danger} family="ionicons" />
            <Text style={[screenStyles.screenTitle, { marginTop: 16 }]}>Access denied</Text>
            <Text style={screenStyles.accessDeniedText}>
              You do not have permission to register users.
            </Text>
            <PrimaryButton title="Go Back" onPress={() => navigation.goBack()} variant="secondary" />
          </View>
        </View>
      </ScreenLayout>
    );
  }

  const isSuccess = message?.includes('successfully');

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

        <Text style={screenStyles.screenTitle}>Register User</Text>
        <Text style={screenStyles.screenSubtitle}>Add a new volunteer to the system</Text>

        <FormField
          label="Full name"
          icon="person-outline"
          placeholder="Volunteer name"
          value={name}
          onChangeText={setName}
        />

        <FormField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <PasswordField
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <Text style={screenStyles.label}>Service unit</Text>
        <View style={screenStyles.pickerWrap}>
          <Picker
            selectedValue={serviceUnit}
            onValueChange={(value) => {
              setServiceUnit(value);
              setService('');
            }}
            style={screenStyles.picker}
          >
            <Picker.Item label="Select service unit" value="" />
            {SERVICE_UNIT_OPTIONS.map(unit => (
              <Picker.Item key={unit} label={unit} value={unit} />
            ))}
          </Picker>
        </View>

        <Text style={screenStyles.label}>Service</Text>
        <View style={screenStyles.pickerWrap}>
          <Picker
            selectedValue={service}
            onValueChange={setService}
            style={screenStyles.picker}
            enabled={!!serviceUnit}
          >
            <Picker.Item label="Select service" value="" />
            {serviceUnit &&
              SERVICE_OPTIONS[serviceUnit]?.map(s => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
          </Picker>
        </View>

        {message ? (
          <View style={isSuccess ? screenStyles.successBanner : screenStyles.errorBanner}>
            <Icon
              name={isSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={isSuccess ? COLORS.success : COLORS.danger}
              family="ionicons"
            />
            <Text
              style={[
                screenStyles.bannerText,
                isSuccess ? screenStyles.successText : screenStyles.errorText,
              ]}
            >
              {message}
            </Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <View style={styles.primaryBtn}>
            <PrimaryButton
              title="Register"
              icon="person-add-outline"
              onPress={handleSubmit}
              loading={loading}
              disabled={!serviceUnit || !service || password.length < 6}
            />
          </View>
          <PrimaryButton
            title="Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.backBtn}
          />
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    alignItems: 'stretch',
  },
  primaryBtn: {
    flex: 1,
  },
  backBtn: {
    minWidth: 100,
  },
});

export default RegisterUserScreen;
