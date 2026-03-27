import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { getUser, isAdmin } from '../utils';
import { QRCodeDisplay } from '../components';
import { generateVolunteerQRPayload } from '../utils/qrcode';
import { useEffect } from 'react';

type GenerateQRScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEvent'>;

interface Props {
  navigation: GenerateQRScreenNavigationProp;
}

const GenerateQRScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [volunteerId, setVolunteerId] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [cnic, setCnic] = useState('');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerateQR = () => {
    setError(null);

    if (!volunteerId.trim() || !volunteerName.trim()) {
      setError('Please enter Volunteer ID and Name');
      return;
    }

    const payload = generateVolunteerQRPayload(
      volunteerId.trim(),
      volunteerName.trim(),
      cnic.trim() || undefined
    );

    setQrValue(payload);
    setShowQRModal(true);
  };

  const handleReset = () => {
    setVolunteerId('');
    setVolunteerName('');
    setCnic('');
    setQrValue(null);
    setShowQRModal(false);
    setError(null);
  };

  if (isUserAdmin === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  if (!isUserAdmin) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedTitle}>Access denied</Text>
        <Text style={styles.accessDeniedText}>Only admins can generate QR codes.</Text>
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Generate QR Code</Text>
            <Text style={styles.subtitle}>Create QR codes for volunteers to scan during check-in</Text>

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Volunteer ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., VOL001"
                  placeholderTextColor={COLORS.gray}
                  value={volunteerId}
                  onChangeText={setVolunteerId}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Volunteer Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., John Doe"
                  placeholderTextColor={COLORS.gray}
                  value={volunteerName}
                  onChangeText={setVolunteerName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CNIC (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 12345-1234567-1"
                  placeholderTextColor={COLORS.gray}
                  value={cnic}
                  onChangeText={setCnic}
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerateQR}
                >
                  <Text style={styles.generateButtonText}>Generate QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡 How it works:</Text>
                <Text style={styles.infoText}>
                  1. Enter volunteer details above{'\n'}
                  2. Click "Generate QR Code"{'\n'}
                  3. A QR code will appear containing: Volunteer ID | Name | CNIC{'\n'}
                  4. Volunteers can scan this during check-in
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code Generated</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.qrSection}>
                {qrValue && <QRCodeDisplay value={qrValue} size={250} />}
              </View>

              <View style={styles.volunteerInfo}>
                <Text style={styles.infoLabel}>Volunteer ID:</Text>
                <Text style={styles.infoValue}>{volunteerId}</Text>

                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{volunteerName}</Text>

                {cnic && (
                  <>
                    <Text style={styles.infoLabel}>CNIC:</Text>
                    <Text style={styles.infoValue}>{cnic}</Text>
                  </>
                )}

                <Text style={styles.infoLabel}>QR Data:</Text>
                <Text style={[styles.infoValue, styles.qrDataText]}>{qrValue}</Text>
              </View>

              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>📝 Notes:</Text>
                <Text style={styles.notesText}>
                  • Print this QR code for the volunteer{'\n'}
                  • Volunteers can scan this code during check-in{'\n'}
                  • The QR contains ID, name, and CNIC (if provided)
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.newButton}
                onPress={handleReset}
              >
                <Text style={styles.newButtonText}>Generate New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
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
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 16,
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
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  generateButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e5f0ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.gray,
  },
  modalScrollContent: {
    padding: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  volunteerInfo: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  qrDataText: {
    fontSize: 13,
    fontFamily: 'Courier New',
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  notesBox: {
    backgroundColor: '#fff5eb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e67e22',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  newButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  newButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GenerateQRScreen;
