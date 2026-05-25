import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList, User, LastAttendance, ServiceUnitItem } from '../types';
import {
  COLORS,
  SERVICE_UNIT_OPTIONS,
  SERVICE_OPTIONS,
  DAY_TYPE_OPTIONS,
  SPECIAL_USER_EMAILS,
} from '../constants';
import { fetchEvents, submitCheckIn, fetchServices } from '../services/api';
import { getUser, removeUser, isAdmin, isSpecialUser, parseQrPayload, getPakistanTime } from '../utils';
import { ScreenLayout, ScreenHeader, Icon, AppConfirmModal } from '../components';
import { screenStyles } from '../theme/screenStyles';
import { BRAND_BUTTON_GRADIENT } from '../theme/brand';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  // Dynamic service units from API
  const [serviceUnits, setServiceUnits] = useState<ServiceUnitItem[]>([]);
  const [serviceUnitsLoading, setServiceUnitsLoading] = useState(false);

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

  // Load dynamic service units from API
  const loadServiceUnits = useCallback(async () => {
    setServiceUnitsLoading(true);
    try {
      const data = await fetchServices();
      if (data && Array.isArray(data)) {
        setServiceUnits(data);
      }
    } catch (error) {
      console.error('Failed to load service units:', error);
      // Fall back to empty - will use hardcoded constants as backup
      setServiceUnits([]);
    } finally {
      setServiceUnitsLoading(false);
    }
  }, []);

  const dashboardDataLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      if (dashboardDataLoadedRef.current) {
        return;
      }
      dashboardDataLoadedRef.current = true;
      loadOccasions();
      loadServiceUnits();
    }, [loadUserData, loadOccasions, loadServiceUnits])
  );

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await removeUser();
      setShowLogoutConfirm(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleScanQR = () => {
    if (!selectedOccasion) {
      Alert.alert('Select Occasion', 'Please select an occasion before scanning.');
      return;
    }
    
    // Navigate to QR Scanner screen with the selected occasion
    // For special users, also pass the selected service/serviceUnit
    if (isUserSpecial && selectedServiceUnit && selectedService) {
      navigation.navigate('QRScanner', {
        event: selectedOccasion,
        service: selectedService,
        serviceUnit: selectedServiceUnit,
      });
    } else {
      navigation.navigate('QRScanner', { event: selectedOccasion });
    }
  };

  const handleManualCheckIn = () => {
    // For special users, also pass the selected service/serviceUnit
    if (isUserSpecial && selectedServiceUnit && selectedService) {
      navigation.navigate('CheckIn', {
        event: selectedOccasion || undefined,
        service: selectedService,
        serviceUnit: selectedServiceUnit,
      });
    } else {
      navigation.navigate('CheckIn', { event: selectedOccasion || undefined });
    }
  };

  const logoutModal = (
    <AppConfirmModal
      visible={showLogoutConfirm}
      title="Logout"
      message="Are you sure you want to logout? You will need to sign in again."
      variant="logout"
      confirmText="Logout"
      cancelText="Cancel"
      loading={logoutLoading}
      onConfirm={confirmLogout}
      onCancel={() => {
        if (!logoutLoading) {
          setShowLogoutConfirm(false);
        }
      }}
    />
  );

  if (loading) {
    return <ScreenLayout loading loadingText="Loading..." />;
  }

  // Admin Dashboard
  if (isUserAdmin) {
    return (
      <>
      <ScreenLayout>
          <View style={screenStyles.card}>
            <ScreenHeader
              title="Admin Dashboard"
              subtitle={`Welcome — ${user?.email}`}
              onLogout={handleLogout}
            />

            <View style={styles.adminGrid}>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('RegisterUser')}
              >
                <LinearGradient
                  colors={[...BRAND_BUTTON_GRADIENT]}
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
                  colors={['#1a8fb5', '#0b5a79']}
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
                  colors={['#2980b9', '#1a5276']}
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
                  colors={['#c0392b', '#922b21']}
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
                  colors={['#d68910', '#b7950b']}
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
                  colors={['#16a085', '#0e6655']}
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
                  colors={['#7d3c98', '#5b2c6f']}
                  style={styles.adminCardGradient}
                >
                  <Text style={styles.adminCardIcon}>⏪</Text>
                  <Text style={styles.adminCardTitle}>Backdated Attendance</Text>
                  <Text style={styles.adminCardSubtitle}>Record past attendance</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
      </ScreenLayout>
      {logoutModal}
      </>
    );
  }

  // Special User Dashboard with service selection
  if (isUserSpecial) {
    const canOpenCamera = selectedServiceUnit && selectedService && selectedOccasion;
    const availableOccasions = occasionOptions.length > 0
      ? occasionOptions.map(o => ({ value: o, label: o }))
      : DAY_TYPE_OPTIONS;

    return (
      <>
      <ScreenLayout>
          <View style={screenStyles.card}>
            <ScreenHeader
              title="Attendance Scanner"
              subtitle={`Welcome, ${user?.name || user?.email}`}
              onLogout={handleLogout}
            />

            <View style={styles.section}>
              <Text style={screenStyles.sectionTitle}>Select Service Unit</Text>
              {serviceUnitsLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <View style={screenStyles.optionsContainer}>
                  {(serviceUnits.length > 0 ? serviceUnits.map(u => u.name) : SERVICE_UNIT_OPTIONS).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        screenStyles.optionButton,
                        selectedServiceUnit === unit && screenStyles.optionButtonSelected,
                      ]}
                      onPress={() => {
                        setSelectedServiceUnit(unit);
                        setSelectedService('');
                      }}
                    >
                      <Text
                        style={[
                          screenStyles.optionButtonText,
                          selectedServiceUnit === unit && screenStyles.optionButtonTextSelected,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {selectedServiceUnit && (
              <View style={styles.section}>
                <Text style={screenStyles.sectionTitle}>Select Service</Text>
                <View style={screenStyles.optionsContainer}>
                  {/* Use dynamic services from API, fallback to hardcoded constants */}
                  {(() => {
                    const dynamicUnit = serviceUnits.find(u => u.name === selectedServiceUnit);
                    const services = dynamicUnit
                      ? dynamicUnit.services.map(s => s.name)
                      : (SERVICE_OPTIONS[selectedServiceUnit] || []);
                    return services.map(service => (
                      <TouchableOpacity
                        key={service}
                        style={[
                          screenStyles.optionButton,
                          selectedService === service && screenStyles.optionButtonSelectedGreen,
                        ]}
                        onPress={() => setSelectedService(service)}
                      >
                        <Text
                          style={[
                            screenStyles.optionButtonText,
                            selectedService === service && screenStyles.optionButtonTextSelected,
                          ]}
                        >
                          {service}
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
              </View>
            )}

            {selectedService && (
              <View style={styles.section}>
                <Text style={screenStyles.sectionTitle}>Select Occasion</Text>
                <View style={screenStyles.optionsContainer}>
                  {availableOccasions.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        screenStyles.optionButton,
                        selectedOccasion === opt.value && screenStyles.optionButtonSelected,
                      ]}
                      onPress={() => setSelectedOccasion(opt.value)}
                    >
                      <Text
                        style={[
                          screenStyles.optionButtonText,
                          selectedOccasion === opt.value && screenStyles.optionButtonTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {canOpenCamera && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanQR}
                disabled={checkinLoading}
              >
                <LinearGradient
                  colors={[...BRAND_BUTTON_GRADIENT]}
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
            <View style={screenStyles.modalCard}>
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
      </ScreenLayout>
      {logoutModal}
      </>
    );
  }

  return (
    <>
    <ScreenLayout centered contentContainerStyle={dashboardStyles.scrollCenter}>
      <View style={[screenStyles.card, dashboardStyles.card]}>
        <ScreenHeader
          title="Dashboard"
          subtitle="Volunteer Attendance System"
          onLogout={handleLogout}
        />

        <View style={styles.section}>
          <Text style={screenStyles.sectionTitle}>Select Occasion</Text>
          <View style={screenStyles.optionsContainer}>
            {(occasionOptions.length > 0 ? occasionOptions : DAY_TYPE_OPTIONS.map(o => o.label)).map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  screenStyles.optionButton,
                  selectedOccasion === opt && screenStyles.optionButtonSelected,
                ]}
                onPress={() => setSelectedOccasion(opt)}
              >
                <Text
                  style={[
                    screenStyles.optionButtonText,
                    selectedOccasion === opt && screenStyles.optionButtonTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionContainer}>
          <View style={styles.actionCard}>
            <Icon name="qr-code-outline" size={32} color="#0b5a79" family="ionicons" />
            <Text style={styles.actionTitle}>Scan QR Code</Text>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!selectedOccasion || checkinLoading) && styles.actionButtonDisabled,
              ]}
              onPress={handleScanQR}
              disabled={!selectedOccasion || checkinLoading}
              activeOpacity={0.85}
            >
              {checkinLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Scan QR</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.actionCard}>
            <Icon name="create-outline" size={32} color={COLORS.success} family="ionicons" />
            <Text style={styles.actionTitle}>Manual Check-in</Text>
            <TouchableOpacity
              style={[
                styles.actionButtonGreen,
                !selectedOccasion && styles.actionButtonDisabled,
              ]}
              onPress={handleManualCheckIn}
              disabled={!selectedOccasion}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>Manual Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenLayout>
    {logoutModal}
    </>
  );
};

const dashboardStyles = StyleSheet.create({
  scrollCenter: {
    paddingVertical: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#f0f7fa',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 148,
    borderWidth: 1,
    borderColor: 'rgba(11, 90, 121, 0.1)',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginVertical: 10,
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#0b5a79',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonGreen: {
    width: '100%',
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  scanButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#0b5a79',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
    borderRadius: 16,
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
  modalOverlay: screenStyles.modalOverlay,
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
