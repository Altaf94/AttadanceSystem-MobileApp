import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { createEvent } from '../services/api';
import { DateTimePicker, Icon } from '../components';

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
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard'),
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add occasion';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Passcode verification screen
  if (!isPasscodeVerified) {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Verify Passcode</Text>
            <Text style={styles.subtitle}>Enter the passcode to create a new occasion.</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Enter passcode"
                placeholderTextColor={COLORS.gray}
                value={passcode}
                onChangeText={setPasscode}
                secureTextEntry
                keyboardType="number-pad"
              />

              {passcodeError && <Text style={styles.errorText}>{passcodeError}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handlePasscodeSubmit}
                >
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Add occasion form
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Add Occasion</Text>
            <Text style={styles.subtitle}>
              Create a new occasion to use when checking in volunteers.
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Occasion title"
                placeholderTextColor={COLORS.gray}
                value={title}
                onChangeText={setTitle}
              />

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="event" size={22} color={COLORS.gray} family="material" />
                <Text style={eventDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {eventDate ? formatDateTime(eventDate) : 'Select Date & Time'}
                </Text>
              </TouchableOpacity>

              <DateTimePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelectDateTime={(date) => {
                  setEventDate(date);
                }}
                initialDate={eventDate || undefined}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Occasion</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  datePickerButton: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePickerText: {
    color: COLORS.black,
    fontSize: 16,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: COLORS.gray,
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#8e44ad',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#8e44ad',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddEventScreen;
