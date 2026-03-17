import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {parseQrPayload} from '../utils';

type QRScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({navigation, route}) => {
  const [processingQR, setProcessingQR] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const scannedRef = useRef(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    checkCameraPermission();
  }, []);

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

  const processQRCode = (qrData: string) => {
    try {
      // Parse the QR code data (format: volunteerId|volunteerName|cnic)
      const parsedData = parseQrPayload(qrData);

      if (!parsedData || !parsedData.volunteerId) {
        throw new Error('Invalid QR code format');
      }

      // Navigate back to CheckInScreen with the scanned data
      navigation.navigate('CheckIn', {
        event: route.params?.event,
        scannedData: {
          volunteerId: parsedData.volunteerId,
          volunteerName: parsedData.volunteerName || '',
          cnic: parsedData.cnic || '',
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid QR code';
      Alert.alert('Error', `${errorMessage}. Please try again.`, [
        {
          text: 'OK',
          onPress: () => {
            scannedRef.current = false;
            setProcessingQR(false);
            setIsActive(true);
          },
        },
      ]);
    }
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

          {processingQR && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.processingText}>Processing QR Code...</Text>
            </View>
          )}

          {!isActive && !processingQR && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
});

export default QRScannerScreen;
