import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {parseQrPayload, getUser, getPakistanTime} from '../utils';
import {submitCheckIn} from '../services/api';

type QRScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

interface CheckInResult {
  success: boolean;
  volunteerName: string;
  volunteerId: string;
  action: string;
  time: string;
  errorMessage?: string;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({navigation, route}) => {
  const [processingQR, setProcessingQR] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userService, setUserService] = useState<string | null>(null);
  const [userServiceUnit, setUserServiceUnit] = useState<string | null>(null);
  const scannedRef = useRef(false);
  const device = useCameraDevice('back');

  // Get service/serviceUnit from route params (for special users) or user data
  const routeService = route.params?.service;
  const routeServiceUnit = route.params?.serviceUnit;

  useEffect(() => {
    checkCameraPermission();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getUser();
      if (user) {
        setUserId(user.id);
        setUserService(user.service || null);
        setUserServiceUnit(user.serviceUnit || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
      
      if (cameraPermission !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Camera permission is required to scan QR codes. Please enable it in settings.',
          [{text: 'OK', onPress: () => navigation.goBack()}]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request camera permission');
      navigation.goBack();
    }
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
        setIsActive(false);
        processQRCode(codes[0].value);
      }
    },
  });

  const processQRCode = async (qrData: string) => {
    try {
      // Parse the QR code data (format: volunteerId|volunteerName|cnic)
      const parsedData = parseQrPayload(qrData);

      if (!parsedData || !parsedData.volunteerId) {
        throw new Error('Invalid QR code format');
      }

      const { volunteerId, volunteerName } = parsedData;
      const event = route.params?.event;

      if (!event) {
        throw new Error('Event not specified');
      }

      if (!userId) {
        throw new Error('User not logged in');
      }

      // Call the check-in API directly
      const actionDate = new Date();
      const localTimeFormatted = getPakistanTime(actionDate);

      // Use route params (for special users) or fall back to user's default service/serviceUnit
      const serviceToUse = routeService || userService || undefined;
      const serviceUnitToUse = routeServiceUnit || userServiceUnit || undefined;

      const response = await submitCheckIn({
        volunteerId,
        volunteerName: volunteerName || '',
        event,
        takenByUserId: userId,
        service: serviceToUse,
        serviceUnit: serviceUnitToUse,
        actionAt: actionDate.toISOString(),
        actionAtClient: localTimeFormatted,
      });

      const action = response?.action === 'checked_out' ? 'Checked Out' : 'Checked In';
      const currentTime = getPakistanTime(actionDate);

      // Show success result
      setCheckInResult({
        success: true,
        volunteerName: volunteerName || volunteerId,
        volunteerId,
        action,
        time: currentTime,
      });
      setProcessingQR(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed';
      setCheckInResult({
        success: false,
        volunteerName: '',
        volunteerId: '',
        action: '',
        time: '',
        errorMessage,
      });
      setProcessingQR(false);
    }
  };

  const handleDismissResult = () => {
    // Reset everything to continue scanning
    setCheckInResult(null);
    scannedRef.current = false;
    setProcessingQR(false);
    setIsActive(true);
  };

  const handleRetry = () => {
    scannedRef.current = false;
    setProcessingQR(false);
    setIsActive(true);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        torch={torchOn ? 'on' : 'off'}
        codeScanner={codeScanner}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan QR Code</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanAreaContainer}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>

          <TouchableOpacity
            style={[styles.flashButton, torchOn && styles.flashButtonOn]}
            onPress={() => setTorchOn(prev => !prev)}
          >
            <Text style={styles.flashButtonText}>{torchOn ? 'Flashlight ON' : 'Flashlight OFF'}</Text>
          </TouchableOpacity>

          {processingQR && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.processingText}>Processing Check-in...</Text>
            </View>
          )}

          {!isActive && !processingQR && !checkInResult && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Result Card Modal */}
      <Modal
        visible={checkInResult !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismissResult}
      >
        <View style={styles.modalOverlay}>
          {checkInResult?.success ? (
            <View style={styles.resultCard}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.resultName}>{checkInResult.volunteerName}</Text>
              <Text style={styles.resultId}>{checkInResult.volunteerId}</Text>
              <Text style={styles.resultAction}>{checkInResult.action}</Text>
              <Text style={styles.resultTime}>{checkInResult.time}</Text>
              <TouchableOpacity
                style={styles.okButton}
                onPress={handleDismissResult}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultCard}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>✕</Text>
              </View>
              <Text style={styles.errorTitle}>Check-in Failed</Text>
              <Text style={styles.errorMessage}>{checkInResult?.errorMessage}</Text>
              <TouchableOpacity
                style={styles.okButton}
                onPress={handleDismissResult}
              >
                <Text style={styles.okButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
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
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  processingText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  flashButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffffaa',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  flashButtonOn: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderColor: '#ffd700',
  },
  flashButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
  },
  resultId: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  resultAction: {
    fontSize: 20,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  okButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 8,
  },
  okButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});

export default QRScannerScreen;
