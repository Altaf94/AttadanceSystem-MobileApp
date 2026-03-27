import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { checkForUpdate, UpdateFlow } from 'react-native-in-app-updates';
import { RootStackParamList, User, LastAttendance } from '../types';
import {
  COLORS,
  SERVICE_UNIT_OPTIONS,
  SERVICE_OPTIONS,
  DAY_TYPE_OPTIONS,
  SPECIAL_USER_EMAILS,
} from '../constants';
import { fetchEvents, submitCheckIn } from '../services/api';
import { getUser, removeUser, isAdmin, isSpecialUser, parseQrPayload, getPakistanTime } from '../utils';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserSpecial, setIsUserSpecial] = useState(false);
  const [occasionOptions, setOccasionOptions] = useState<string[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedServiceUnit, setSelectedServiceUnit] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<LastAttendance | null>(null);
  const [hasCheckedUpdate, setHasCheckedUpdate] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUser();
      if (!userData) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      setUser(userData);
      setIsUserAdmin(isAdmin(userData.email));
      setIsUserSpecial(isSpecialUser(userData.email, SPECIAL_USER_EMAILS));
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const loadOccasions = useCallback(async () => {
    try {
      const data = await fetchEvents();
      if (data && typeof data === 'object') {
        // API returns { WORKING_DAYS: string[], FESTIVAL: string[], GENERAL_EVENT: string[] }
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
  }, []);

  const checkInAppUpdate = useCallback(() => {
    if (Platform.OS !== 'android' || hasCheckedUpdate) {
      return;
    }
    setHasCheckedUpdate(true);
    checkForUpdate(UpdateFlow.FLEXIBLE).catch(error => {
      console.log('In-app update check failed:', error?.message || error);
    });
  }, [hasCheckedUpdate]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadOccasions();
      checkInAppUpdate();
    }, [loadUserData, loadOccasions, checkInAppUpdate])
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await removeUser();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const handleScanQR = () => {
    if (!selectedOccasion) {
      Alert.alert('Select Occasion', 'Please select an occasion before scanning.');
      return;
    }
    
    // Navigate to QR Scanner screen with the selected occasion
    navigation.navigate('QRScanner', { event: selectedOccasion });
  };

  const handleManualCheckIn = () => {
    navigation.navigate('CheckIn', { event: selectedOccasion || undefined });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Admin Dashboard
  if (isUserAdmin) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <Text style={styles.headerSubtitle}>Welcome - {user?.email}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.adminGrid}>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('RegisterUser')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>👤</Text>
                  <Text style={styles.adminCardTitle}>Register User</Text>
                  <Text style={styles.adminCardSubtitle}>Add new volunteers</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('Reports')}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>📊</Text>
                  <Text style={styles.adminCardTitle}>View Reports</Text>
                  <Text style={styles.adminCardSubtitle}>Check attendance reports</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('AddEvent')}
              >
                <LinearGradient
                  colors={['#8e44ad', '#3498db']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>📅</Text>
                  <Text style={styles.adminCardTitle}>Add Event</Text>
                  <Text style={styles.adminCardSubtitle}>Create new events</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('ManageEvents')}
              >
                <LinearGradient
                  colors={['#e74c3c', '#c0392b']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>🗑️</Text>
                  <Text style={styles.adminCardTitle}>Manage Events</Text>
                  <Text style={styles.adminCardSubtitle}>View and delete events</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('GenerateQR')}
              >
                <LinearGradient
                  colors={['#f39c12', '#e74c3c']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>📱</Text>
                  <Text style={styles.adminCardTitle}>Generate QR</Text>
                  <Text style={styles.adminCardSubtitle}>Create volunteer QR codes</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('UserManagement')}
              >
                <LinearGradient
                  colors={['#1abc9c', '#16a085']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>👥</Text>
                  <Text style={styles.adminCardTitle}>User Management</Text>
                  <Text style={styles.adminCardSubtitle}>View & manage users</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('BackdatedAttendance')}
              >
                <LinearGradient
                  colors={['#9b59b6', '#8e44ad']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>⏪</Text>
                  <Text style={styles.adminCardTitle}>Backdated Attendance</Text>
                  <Text style={styles.adminCardSubtitle}>Record past attendance</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Special User Dashboard with service selection
  if (isUserSpecial) {
    const canOpenCamera = selectedServiceUnit && selectedService && selectedOccasion;
    const availableOccasions = occasionOptions.length > 0
      ? occasionOptions.map(o => ({ value: o, label: o }))
      : DAY_TYPE_OPTIONS;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Attendance Scanner</Text>
                <Text style={styles.headerSubtitle}>Welcome, {user?.name || user?.email}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Service Unit Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Service Unit</Text>
              <View style={styles.optionsContainer}>
                {SERVICE_UNIT_OPTIONS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.optionButton,
                      selectedServiceUnit === unit && styles.optionButtonSelected,
                    ]}
                    onPress={() => {
                      setSelectedServiceUnit(unit);
                      setSelectedService('');
                    }}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        selectedServiceUnit === unit && styles.optionButtonTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Selection */}
            {selectedServiceUnit && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Service</Text>
                <View style={styles.optionsContainer}>
                  {SERVICE_OPTIONS[selectedServiceUnit]?.map(service => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.optionButton,
                        selectedService === service && styles.optionButtonSelectedGreen,
                      ]}
                      onPress={() => setSelectedService(service)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          selectedService === service && styles.optionButtonTextSelected,
                        ]}
                      >
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Occasion Selection */}
            {selectedService && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Occasion</Text>
                <View style={styles.optionsContainer}>
                  {availableOccasions.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.optionButton,
                        selectedOccasion === opt.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setSelectedOccasion(opt.value)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          selectedOccasion === opt.value && styles.optionButtonTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Open Camera Button */}
            {canOpenCamera && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanQR}
                disabled={checkinLoading}
              >
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  style={styles.scanButtonGradient}
                >
                  {checkinLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.scanButtonText}>Open Camera</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Last Attendance Modal */}
        <Modal
          visible={!!lastAttendance}
          transparent
          animationType="fade"
          onRequestClose={() => setLastAttendance(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setLastAttendance(null)}
          >
            <View style={styles.attendanceModal}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setLastAttendance(null)}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.attendanceName}>{lastAttendance?.volunteerName}</Text>
              <Text style={styles.attendanceId}>{lastAttendance?.volunteerId}</Text>
              <Text style={styles.attendanceAction}>
                Checked in{lastAttendance?.time ? ` at ${lastAttendance.time}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Regular User Dashboard
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>Volunteer Attendance System</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Occasion Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Occasion</Text>
            <View style={styles.optionsContainer}>
              {(occasionOptions.length > 0 ? occasionOptions : DAY_TYPE_OPTIONS.map(o => o.label)).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionButton,
                    selectedOccasion === opt && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedOccasion(opt)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedOccasion === opt && styles.optionButtonTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Scan QR Code</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !selectedOccasion && styles.actionButtonDisabled,
                ]}
                onPress={handleScanQR}
                disabled={!selectedOccasion || checkinLoading}
              >
                <Text style={styles.actionButtonText}>
                  {checkinLoading ? 'Processing...' : 'Scan QR'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Manual Check-in</Text>
              <TouchableOpacity
                style={[
                  styles.actionButtonGreen,
                  !selectedOccasion && styles.actionButtonDisabled,
                ]}
                onPress={handleManualCheckIn}
                disabled={!selectedOccasion}
              >
                <Text style={styles.actionButtonText}>Manual Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  scrollContent: {
    padding: 20,
    paddingTop: 40,
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
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#e5f0ff',
    borderColor: COLORS.primary,
  },
  optionButtonSelectedGreen: {
    backgroundColor: '#e9f8ef',
    borderColor: COLORS.success,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  optionButtonTextSelected: {
    color: COLORS.primary,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGreen: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  scanButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 20,
  },
  scanButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  adminCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: 'transparent',
  },
  adminCardGradient: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  adminCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  adminCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  adminCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceModal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 28,
    minWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  modalCloseText: {
    fontSize: 24,
    color: COLORS.gray,
  },
  attendanceName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  attendanceId: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  attendanceAction: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
});

export default DashboardScreen;
