import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { createEvent } from '../services/api';
import {
  DateTimePicker,
  Icon,
  ScreenLayout,
  FormField,
  PrimaryButton,
} from '../components';
import { screenStyles } from '../theme/screenStyles';

type AddEventScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEvent'>;

interface Props {
  navigation: AddEventScreenNavigationProp;
}

const AddEventScreen: React.FC<Props> = ({ navigation }) => {
  const [passcode, setPasscode] = useState('');
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  const handlePasscodeSubmit = () => {
    setPasscodeError(null);
    if (passcode === '4321') {
      setIsPasscodeVerified(true);
    } else {
      setPasscodeError('Incorrect passcode. Please try again.');
      setPasscode('');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Please enter an occasion name');
      return;
    }

    setLoading(true);
    try {
      await createEvent(title.trim());
      Alert.alert('Success', 'Occasion added successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add occasion';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isPasscodeVerified) {
    return (
      <ScreenLayout keyboard centered>
        <View style={[screenStyles.card, styles.card]}>
          <Text style={screenStyles.screenTitle}>Verify Passcode</Text>
          <Text style={screenStyles.screenSubtitle}>
            Enter the passcode to create a new occasion.
          </Text>

          <FormField
            label="Passcode"
            icon="key-outline"
            placeholder="Enter passcode"
            value={passcode}
            onChangeText={setPasscode}
            secureTextEntry
            keyboardType="number-pad"
          />

          {passcodeError ? (
            <View style={screenStyles.errorBanner}>
              <Icon name="alert-circle-outline" size={18} color={COLORS.danger} family="ionicons" />
              <Text style={[screenStyles.bannerText, screenStyles.errorText]}>{passcodeError}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <View style={styles.flexBtn}>
              <PrimaryButton title="Verify" icon="shield-checkmark-outline" onPress={handlePasscodeSubmit} />
            </View>
            <PrimaryButton title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout keyboard centered>
      <View style={[screenStyles.card, styles.card]}>
        <Text style={screenStyles.screenTitle}>Add Occasion</Text>
        <Text style={screenStyles.screenSubtitle}>
          Create a new occasion to use when checking in volunteers.
        </Text>

        <FormField
          label="Occasion title"
          icon="calendar-outline"
          placeholder="Occasion name"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={screenStyles.label}>Date & time (optional)</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <Icon name="time-outline" size={20} color={COLORS.gray} family="ionicons" />
          <Text style={eventDate ? styles.dateText : styles.datePlaceholder}>
            {eventDate ? formatDateTime(eventDate) : 'Select date & time'}
          </Text>
        </TouchableOpacity>

        <DateTimePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectDateTime={setEventDate}
          initialDate={eventDate || undefined}
        />

        {error ? (
          <View style={screenStyles.errorBanner}>
            <Icon name="alert-circle-outline" size={18} color={COLORS.danger} family="ionicons" />
            <Text style={[screenStyles.bannerText, screenStyles.errorText]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <View style={styles.flexBtn}>
            <PrimaryButton
              title="Add Occasion"
              icon="add-circle-outline"
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
          <PrimaryButton title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f8fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 90, 121, 0.1)',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  cancelBtn: {
    minWidth: 100,
  },
});

export default AddEventScreen;
