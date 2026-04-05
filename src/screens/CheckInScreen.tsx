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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { submitCheckIn } from '../services/api';
import { getUser, getPakistanTime } from '../utils';
import DateTimePicker from '../components/DateTimePicker';

type CheckInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckIn'>;
type CheckInScreenRouteProp = RouteProp<RootStackParamList, 'CheckIn'>;

interface Props {
  navigation: CheckInScreenNavigationProp;
  route: CheckInScreenRouteProp;
}

const CheckInScreen: React.FC<Props> = ({ navigation, route }) => {
  const [volunteerId, setVolunteerId] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [event, setEvent] = useState(route.params?.event || '');
  const [customDateTime, setCustomDateTime] = useState<Date | null>(null);
  const [takenByUserId, setTakenByUserId] = useState('');
  const [service, setService] = useState<string | null>(route.params?.service || null);
  const [serviceUnit, setServiceUnit] = useState<string | null>(route.params?.serviceUnit || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // Check if service/serviceUnit came from route params (special user)
  const hasRouteService = !!route.params?.service;

  useEffect(() => {
    loadUserData().then(() => {
      // Auto-submit if scanned data is provided
      if (route.params?.scannedData) {
        const { volunteerId: scannedId, volunteerName: scannedName } = route.params.scannedData;
        setVolunteerId(scannedId);
        setVolunteerName(scannedName);
        setIsAutoSubmitting(true);
      }
    });
  }, [route.params?.scannedData]);

  useEffect(() => {
    // Auto-submit when user data is loaded and we have scanned data
    if (isAutoSubmitting && takenByUserId && volunteerId && event) {
      autoSubmitCheckIn();
    }
  }, [isAutoSubmitting, takenByUserId, volunteerId, event]);

  const loadUserData = async () => {
    try {
      const user = await getUser();
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      setTakenByUserId(user.id);
      // Only set service/serviceUnit from user if not provided via route params (special user)
      if (!hasRouteService) {
        setService(user.service || null);
        setServiceUnit(user.serviceUnit || null);
      }
    } catch (err) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const autoSubmitCheckIn = async () => {
    setLoading(true);
    setError(null);

    const actionDate = new Date();
    const localTimeFormatted = getPakistanTime(actionDate);

    try {
      const response = await submitCheckIn({
        volunteerId,
        volunteerName,
        event,
        takenByUserId,
        service: service || undefined,
        serviceUnit: serviceUnit || undefined,
        actionAt: actionDate.toISOString(),
        actionAtClient: localTimeFormatted,
      });

      const action = response?.action === 'checked_out' ? 'Checked out' : 'Checked in';
      const currentTime = getPakistanTime(actionDate);

      setMessage(`${action} at ${currentTime}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      setLoading(false);
      // Allow user to close and rescan
      setIsAutoSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!volunteerId || !event) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    const actionDate = customDateTime || new Date();
    const localTimeFormatted = getPakistanTime(actionDate);

    try {
      const response = await submitCheckIn({
        volunteerId,
        volunteerName,
        event,
        takenByUserId,
        service: service || undefined,
        serviceUnit: serviceUnit || undefined,
        actionAt: actionDate.toISOString(),
        actionAtClient: localTimeFormatted,
      });

      const action = response?.action === 'checked_out' ? 'Checked out' : 'Checked in';
      const currentTime = getPakistanTime(actionDate);

      setMessage(`${action} at ${currentTime}`);
      Alert.alert('Success', `Attendance marked successfully (${action} at ${currentTime})`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCheckIn = () => {
    setMessage(null);
    setVolunteerId('');
    setVolunteerName('');
    setCustomDateTime(null);
    setError(null);
    setIsAutoSubmitting(false);
  };

  // Success state
  if (message) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successName}>{volunteerName}</Text>
          <Text style={styles.successId}>{volunteerId}</Text>
          <Text style={styles.successMessage}>{message}</Text>
          <TouchableOpacity style={styles.newCheckInButton} onPress={handleNewCheckIn}>
            <Text style={styles.newCheckInButtonText}>New Check-in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state when auto-submitting
  if (isAutoSubmitting && loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Processing Check-in...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Volunteer Check-in</Text>
            <Text style={styles.subtitle}>
              Enter volunteer details + event to check-in (or check-out if already checked in).
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Volunteer ID"
                placeholderTextColor={COLORS.gray}
                value={volunteerId}
                onChangeText={setVolunteerId}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Volunteer Name"
                placeholderTextColor={COLORS.gray}
                value={volunteerName}
                onChangeText={setVolunteerName}
              />

              <TextInput
                style={styles.input}
                placeholder="Event"
                placeholderTextColor={COLORS.gray}
                value={event}
                onChangeText={setEvent}
              />

              <View>
                <Text style={styles.label}>Date & Time (Optional)</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>
                    {customDateTime
                      ? customDateTime.toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Tap to select date & time (leave empty for automatic)'}
                  </Text>
                </TouchableOpacity>
                {customDateTime && (
                  <TouchableOpacity
                    onPress={() => setCustomDateTime(null)}
                    style={styles.clearDateButton}
                  >
                    <Text style={styles.clearDateButtonText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDateTime={setCustomDateTime}
        initialDate={customDateTime || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    padding: 28,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.black,
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 6,
  },
  datePickerButton: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
  },
  datePickerButtonText: {
    color: COLORS.black,
    fontSize: 16,
  },
  clearDateButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  clearDateButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    width: '90%',
    maxWidth: 500,
    padding: 28,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  successName: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  successId: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 20,
    textAlign: 'center',
  },
  newCheckInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newCheckInButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingCard: {
    width: '90%',
    maxWidth: 500,
    padding: 40,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.black,
    marginTop: 16,
    fontWeight: '500',
  },
});

export default CheckInScreen;
