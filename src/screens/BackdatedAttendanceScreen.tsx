import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';
import { fetchEvents, submitCheckIn } from '../services/api';
import { getUser, isAdmin, parseQrPayload } from '../utils';
import DateTimePicker from '../components/DateTimePicker';

type BackdatedAttendanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BackdatedAttendance'>;

interface Props {
  navigation: BackdatedAttendanceScreenNavigationProp;
}

interface LastAttendance {
  volunteerId: string;
  volunteerName: string;
  time: string;
}

const BackdatedAttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userService, setUserService] = useState<string | null>(null);
  const [userServiceUnit, setUserServiceUnit] = useState<string | null>(null);

  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [occasionOptions, setOccasionOptions] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [processingQR, setProcessingQR] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<LastAttendance | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  
  const scannedRef = useRef(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    checkAdminAccess();
    loadOccasions();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getUser();
      const admin = isAdmin(user?.email);
      setIsUserAdmin(admin);
      setUserId(user?.id || '');
      setUserService(user?.service || null);
      setUserServiceUnit(user?.serviceUnit || null);
    } catch {
      setIsUserAdmin(false);
    }
  };

  const loadOccasions = async () => {
    try {
      const data = await fetchEvents();
      if (data && typeof data === 'object') {
        const all: string[] = Array.from(
          new Set(
            ([] as string[]).concat(
              ...Object.values(data).filter(Array.isArray)
            ).filter(Boolean)
          )
        );
        if (all.length > 0) {
          setOccasionOptions(all);
        }
      }
    } catch (error) {
      console.error('Failed to load occasions:', error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
      return cameraPermission === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const openScanner = async () => {
    const permissionGranted = await checkCameraPermission();
    if (!permissionGranted) {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to scan QR codes. Please enable it in settings.'
      );
      return;
    }
    scannedRef.current = false;
    setProcessingQR(false);
    setTorchOn(false);
    setShowScanner(true);
    setIsActive(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setIsActive(false);
    scannedRef.current = false;
    setProcessingQR(false);
    setTorchOn(false);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (processingQR || scannedRef.current || !isActive) {
        return;
      }

      if (codes.length > 0 && codes[0].value) {
        scannedRef.current = true;
        setProcessingQR(true);
        processQRCode(codes[0].value);
      }
    },
  });

  const buildActionTimestamps = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return {
      actionAt: date.toISOString(),
      actionAtClient: `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`,
    };
  };

  const processQRCode = async (qrData: string) => {
    try {
      const parsedData = parseQrPayload(qrData);

      if (!parsedData || !parsedData.volunteerId) {
        throw new Error('Invalid QR code format');
      }

      const { volunteerId, volunteerName } = parsedData;

      if (!selectedDate) {
        throw new Error('Date and time not selected');
      }

      if (!selectedOccasion) {
        throw new Error('Occasion not selected');
      }

      if (!userId) {
        throw new Error('User not logged in');
      }

      const { actionAt, actionAtClient } = buildActionTimestamps(selectedDate);

      await submitCheckIn({
        volunteerId,
        volunteerName: volunteerName || '',
        event: selectedOccasion,
        takenByUserId: userId,
        service: userService || undefined,
        serviceUnit: userServiceUnit || undefined,
        actionAt,
        actionAtClient,
      });

      setLastAttendance({
        volunteerId,
        volunteerName: volunteerName || volunteerId,
        time: actionAtClient,
      });

      Alert.alert(
        'Success',
        `Attendance marked for ${volunteerName || volunteerId} at ${actionAtClient}`
      );

      closeScanner();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backdated check-in failed';
      Alert.alert('Error', errorMessage);
      scannedRef.current = false;
      setProcessingQR(false);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${year}-${month}-${day} at ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const canOpenScanner = selectedDate && selectedOccasion && !processingQR;

  if (isUserAdmin === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isUserAdmin) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>Only admins can use backdated attendance.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Backdated Attendance</Text>
              <Text style={styles.headerSubtitle}>
                Select the date and time, then scan QR code
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerBackButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Date/Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date & Time</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[
                styles.selectButtonText,
                !selectedDate && styles.placeholderText
              ]}>
                {selectedDate ? formatDate(selectedDate) : 'Select date and time'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Occasion Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Occasion</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowOccasionPicker(true)}
            >
              <Text style={[
                styles.selectButtonText,
                !selectedOccasion && styles.placeholderText
              ]}>
                {selectedOccasion || 'Select occasion'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Open Scanner Button */}
          <TouchableOpacity
            style={[
              styles.scannerButton,
              !canOpenScanner && styles.scannerButtonDisabled
            ]}
            onPress={openScanner}
            disabled={!canOpenScanner}
          >
            <Text style={styles.scannerButtonText}>📷 Open QR Scanner</Text>
          </TouchableOpacity>

          {/* Selection Summary */}
          {selectedDate && selectedOccasion && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                Will record attendance for:
              </Text>
              <Text style={styles.summaryValue}>
                📅 {formatDate(selectedDate)}
              </Text>
              <Text style={styles.summaryValue}>
                📍 {selectedOccasion}
              </Text>
            </View>
          )}

          {/* Last Attendance */}
          {lastAttendance && (
            <View style={styles.lastAttendanceBox}>
              <Text style={styles.lastAttendanceTitle}>Latest Attendance Saved</Text>
              <Text style={styles.lastAttendanceName}>
                {lastAttendance.volunteerName} ({lastAttendance.volunteerId})
              </Text>
              <Text style={styles.lastAttendanceTime}>{lastAttendance.time}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker - It already includes a Modal */}
      <DateTimePicker
        visible={showDatePicker}
        initialDate={selectedDate || new Date()}
        onSelectDateTime={(date: Date) => {
          setSelectedDate(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Occasion Picker Modal */}
      <Modal
        visible={showOccasionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOccasionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.occasionPickerModal}>
            <View style={styles.occasionPickerHeader}>
              <Text style={styles.occasionPickerTitle}>Select Occasion</Text>
              <TouchableOpacity onPress={() => setShowOccasionPicker(false)}>
                <Text style={styles.closePicker}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.occasionList}>
              {occasionOptions.map(occasion => (
                <TouchableOpacity
                  key={occasion}
                  style={[
                    styles.occasionItem,
                    selectedOccasion === occasion && styles.occasionItemSelected
                  ]}
                  onPress={() => {
                    setSelectedOccasion(occasion);
                    setShowOccasionPicker(false);
                  }}
                >
                  <Text style={[
                    styles.occasionItemText,
                    selectedOccasion === occasion && styles.occasionItemTextSelected
                  ]}>
                    {occasion}
                  </Text>
                </TouchableOpacity>
              ))}
              {occasionOptions.length === 0 && (
                <Text style={styles.noOccasions}>No occasions available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <View style={styles.scannerContainer}>
          {device && hasPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isActive}
              torch={torchOn ? 'on' : 'off'}
              codeScanner={codeScanner}
            />
          ) : (
            <View style={styles.scannerLoadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.scannerLoadingText}>Loading camera...</Text>
            </View>
          )}

          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <View>
                <Text style={styles.scannerTitle}>Scan QR Code</Text>
                <Text style={styles.scannerSubtitle}>
                  {selectedDate ? formatDate(selectedDate) : ''}
                </Text>
              </View>
              <View style={styles.scannerHeaderActions}>
                <TouchableOpacity
                  style={[styles.flashToggleButton, torchOn && styles.flashToggleButtonOn]}
                  onPress={() => setTorchOn(prev => !prev)}
                >
                  <Text style={styles.flashToggleText}>{torchOn ? 'Flash ON' : 'Flash OFF'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeScannerButton}
                  onPress={closeScanner}
                >
                  <Text style={styles.closeScannerText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Warning tip */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                If scanning is weak, increase screen brightness on the QR source
              </Text>
            </View>

            <View style={styles.scanAreaContainer}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {processingQR && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
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
    fontSize: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  headerBackButton: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerBackButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 14,
    backgroundColor: COLORS.white,
  },
  selectButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  placeholderText: {
    color: COLORS.gray,
  },
  scannerButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  scannerButtonDisabled: {
    backgroundColor: '#b7c4d6',
  },
  scannerButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
  },
  summaryBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b3d4fc',
  },
  summaryText: {
    fontSize: 14,
    color: '#1e6091',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e6091',
    fontWeight: '600',
    marginTop: 2,
  },
  lastAttendanceBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ebfff1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b9ecc7',
  },
  lastAttendanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#146534',
    marginBottom: 8,
  },
  lastAttendanceName: {
    fontSize: 15,
    color: '#244a2f',
  },
  lastAttendanceTime: {
    fontSize: 14,
    color: '#244a2f',
    marginTop: 4,
  },
  // Modal styles (for occasion picker)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  occasionPickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  occasionPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  occasionPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closePicker: {
    fontSize: 24,
    color: COLORS.gray,
    padding: 4,
  },
  occasionList: {
    maxHeight: 400,
  },
  occasionItem: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  occasionItemSelected: {
    backgroundColor: '#e6f0ff',
    borderColor: COLORS.primary,
  },
  occasionItemText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  occasionItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  noOccasions: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    padding: 20,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scannerLoadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  scannerSubtitle: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 4,
  },
  scannerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#ffffff55',
    marginRight: 8,
  },
  flashToggleButtonOn: {
    backgroundColor: 'rgba(250, 204, 21, 0.95)',
    borderColor: '#facc15',
  },
  flashToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeScannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeScannerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  warningBox: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  warningText: {
    fontSize: 12,
    color: '#9a3412',
    textAlign: 'center',
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00ff00',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  processingContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
    fontWeight: '600',
  },
});

export default BackdatedAttendanceScreen;
