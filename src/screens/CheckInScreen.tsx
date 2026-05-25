import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { submitCheckIn } from '../services/api';
import { getUser, getPakistanTime } from '../utils';
import {
  DateTimePicker,
  ScreenLayout,
  FormField,
  PrimaryButton,
  Icon,
} from '../components';
import { screenStyles } from '../theme/screenStyles';

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

  const hasRouteService = !!route.params?.service;

  useEffect(() => {
    loadUserData().then(() => {
      if (route.params?.scannedData) {
        const { volunteerId: scannedId, volunteerName: scannedName } = route.params.scannedData;
        setVolunteerId(scannedId);
        setVolunteerName(scannedName);
        setIsAutoSubmitting(true);
      }
    });
  }, [route.params?.scannedData]);

  useEffect(() => {
    if (isAutoSubmitting && takenByUserId && volunteerId && event) {
      autoSubmitCheckIn();
    }
  }, [isAutoSubmitting, takenByUserId, volunteerId, event]);

  const loadUserData = async () => {
    try {
      const user = await getUser();
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      setTakenByUserId(user.id);
      if (!hasRouteService) {
        setService(user.service || null);
        setServiceUnit(user.serviceUnit || null);
      }
    } catch {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
      setMessage(`${action} at ${localTimeFormatted}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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
      setMessage(`${action} at ${localTimeFormatted}`);
      Alert.alert('Success', `Attendance marked successfully (${action} at ${localTimeFormatted})`);
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

  if (message) {
    return (
      <ScreenLayout centered>
        <View style={[screenStyles.card, styles.centerCard]}>
          <Icon name="checkmark-circle" size={56} color={COLORS.success} family="ionicons" />
          <Text style={styles.successName}>{volunteerName}</Text>
          <Text style={styles.successId}>{volunteerId}</Text>
          <Text style={styles.successMessage}>{message}</Text>
          <PrimaryButton title="New Check-in" onPress={handleNewCheckIn} icon="add-circle-outline" />
        </View>
      </ScreenLayout>
    );
  }

  if (isAutoSubmitting && loading) {
    return <ScreenLayout loading loadingText="Processing check-in..." />;
  }

  return (
    <ScreenLayout keyboard centered>
      <View style={[screenStyles.card, styles.formCard]}>
        <Text style={screenStyles.screenTitle}>Volunteer Check-in</Text>
        <Text style={screenStyles.screenSubtitle}>
          Enter volunteer details and event to check in or check out.
        </Text>

        <FormField
          label="Volunteer ID"
          icon="id-card-outline"
          placeholder="Volunteer ID"
          value={volunteerId}
          onChangeText={setVolunteerId}
          autoCapitalize="none"
        />

        <FormField
          label="Volunteer name"
          icon="person-outline"
          placeholder="Full name"
          value={volunteerName}
          onChangeText={setVolunteerName}
        />

        <FormField
          label="Event / occasion"
          icon="calendar-outline"
          placeholder="Event name"
          value={event}
          onChangeText={setEvent}
        />

        <Text style={screenStyles.label}>Date & time (optional)</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Icon name="time-outline" size={20} color={COLORS.gray} family="ionicons" />
          <Text style={styles.datePickerButtonText}>
            {customDateTime
              ? customDateTime.toLocaleString('en-GB', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Tap to select (leave empty for now)'}
          </Text>
        </TouchableOpacity>
        {customDateTime ? (
          <TouchableOpacity onPress={() => setCustomDateTime(null)} style={styles.clearDate}>
            <Text style={styles.clearDateText}>Clear date & time</Text>
          </TouchableOpacity>
        ) : null}

        {error ? (
          <View style={screenStyles.errorBanner}>
            <Icon name="alert-circle-outline" size={18} color={COLORS.danger} family="ionicons" />
            <Text style={[screenStyles.bannerText, screenStyles.errorText]}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Submit"
          icon="checkmark-circle-outline"
          onPress={handleSubmit}
          loading={loading}
        />
      </View>

      <DateTimePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDateTime={setCustomDateTime}
        initialDate={customDateTime || undefined}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  centerCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    alignSelf: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f8fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 90, 121, 0.1)',
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  clearDate: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
  },
  clearDateText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  successName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  successId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default CheckInScreen;
