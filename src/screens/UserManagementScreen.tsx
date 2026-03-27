import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserListItem } from '../types';
import { COLORS, SERVICE_UNIT_OPTIONS, SERVICE_OPTIONS } from '../constants';
import { fetchUsers, updateUserPassword, deleteUser, updateUserService } from '../services/api';
import { getUser, isAdmin } from '../utils';
import { Icon } from '../components';

type UserManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserManagement'>;

interface Props {
  navigation: UserManagementScreenNavigationProp;
}

const UserManagementScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Password change modal state
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Service editing modal state
  const [editingServiceUser, setEditingServiceUser] = useState<UserListItem | null>(null);
  const [selectedServiceUnit, setSelectedServiceUnit] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getUser();
      const admin = isAdmin(user?.email);
      setIsUserAdmin(admin);
      setLoggedInUserId(user?.id || null);
      if (admin) {
        loadUsers();
      }
    } catch {
      setIsUserAdmin(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: UserListItem) => {
    if (user.id === loggedInUserId) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.email}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(user.id);
            try {
              await deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              setUsers(prev => prev.filter(u => u.id !== user.id));
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete user';
              Alert.alert('Error', message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    if (!editingUser || !newPassword) return;

    if (newPassword.trim().length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setSavingPassword(true);
    try {
      await updateUserPassword(editingUser.id, newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setEditingUser(null);
      setNewPassword('');
      setShowPassword(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      Alert.alert('Error', message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleServiceChange = async () => {
    if (!editingServiceUser || !selectedServiceUnit || !selectedService) {
      Alert.alert('Error', 'Please select both Service Unit and Service');
      return;
    }

    setSavingService(true);
    try {
      await updateUserService(editingServiceUser.id, selectedServiceUnit, selectedService);
      Alert.alert('Success', 'Service updated successfully');
      setUsers(prev => prev.map(u => 
        u.id === editingServiceUser.id 
          ? { ...u, serviceUnit: selectedServiceUnit, service: selectedService }
          : u
      ));
      setEditingServiceUser(null);
      setSelectedServiceUnit('');
      setSelectedService('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update service';
      Alert.alert('Error', message);
    } finally {
      setSavingService(false);
    }
  };

  const activeUsers = users.filter(u => u.active).length;
  const inactiveUsers = users.filter(u => !u.active).length;

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
        <Text style={styles.accessDeniedText}>Only admins can manage users.</Text>
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
              <Text style={styles.headerTitle}>User Management</Text>
              <Text style={styles.headerSubtitle}>View and manage all users</Text>
            </View>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerBackButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#f0f4f8' }]}>
              <Text style={styles.statLabel}>Total Users</Text>
              <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{users.length}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e6f7f0' }]}>
              <Text style={[styles.statLabel, { color: '#27ae60' }]}>Active</Text>
              <Text style={[styles.statValue, { color: '#27ae60' }]}>{activeUsers}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fef3cd' }]}>
              <Text style={[styles.statLabel, { color: '#f39c12' }]}>Inactive</Text>
              <Text style={[styles.statValue, { color: '#f39c12' }]}>{inactiveUsers}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('RegisterUser')}
            >
              <Text style={styles.registerButtonText}>+ Register User</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {users.map(user => {
                const isDeleting = deletingId === user.id;
                const isCurrentUser = user.id === loggedInUserId;

                return (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || 'No name'}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.userDetailsRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: user.active ? '#e6f7f0' : '#f8f9fa' },
                          ]}
                        >
                          <Text style={[
                            styles.statusText,
                            { color: user.active ? '#27ae60' : '#6c757d' }
                          ]}>
                            {user.active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        <Text style={styles.userRole}>{user.role}</Text>
                      </View>
                      {user.serviceUnit && (
                        <Text style={styles.userService}>
                          {user.serviceUnit}
                          {user.service ? ` - ${user.service}` : ''}
                        </Text>
                      )}
                    </View>

                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={styles.changePasswordButton}
                        onPress={() => {
                          setEditingUser(user);
                          setNewPassword('');
                        }}
                      >
                        <Text style={styles.changePasswordButtonText}>Password</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editServiceButton}
                        onPress={() => {
                          setEditingServiceUser(user);
                          setSelectedServiceUnit(user.serviceUnit || '');
                          setSelectedService(user.service || '');
                        }}
                      >
                        <Text style={styles.editServiceButtonText}>Service</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.deleteButton,
                          (isDeleting || isCurrentUser) && styles.deleteButtonDisabled,
                        ]}
                        onPress={() => handleDeleteUser(user)}
                        disabled={isDeleting || isCurrentUser}
                      >
                        {isDeleting ? (
                          <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                          <Text style={styles.deleteButtonText}>
                            {isCurrentUser ? 'You' : 'Delete'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={!!editingUser}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditingUser(null);
          setNewPassword('');
          setShowPassword(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Change Password
            </Text>
            <Text style={styles.modalSubtitle}>
              {editingUser?.name || editingUser?.email}
            </Text>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={COLORS.gray}
                  family="feather"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingUser(null);
                  setNewPassword('');
                  setShowPassword(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.updateButton,
                  (savingPassword || newPassword.trim().length < 6) && styles.updateButtonDisabled,
                ]}
                onPress={handlePasswordChange}
                disabled={savingPassword || newPassword.trim().length < 6}
              >
                {savingPassword ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Service Editing Modal */}
      <Modal
        visible={!!editingServiceUser}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditingServiceUser(null);
          setSelectedServiceUnit('');
          setSelectedService('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit Service
            </Text>
            <Text style={styles.modalSubtitle}>
              {editingServiceUser?.name || editingServiceUser?.email}
            </Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Service Unit</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedServiceUnit}
                  onValueChange={(itemValue) => {
                    setSelectedServiceUnit(itemValue);
                    setSelectedService('');
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Service Unit" value="" />
                  {SERVICE_UNIT_OPTIONS.map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedServiceUnit && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Service</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedService}
                    onValueChange={setSelectedService}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Service" value="" />
                    {SERVICE_OPTIONS[selectedServiceUnit]?.map((service) => (
                      <Picker.Item key={service} label={service} value={service} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingServiceUser(null);
                  setSelectedServiceUnit('');
                  setSelectedService('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.updateButton,
                  (!selectedServiceUnit || !selectedService) && styles.updateButtonDisabled,
                ]}
                onPress={handleServiceChange}
                disabled={savingService || !selectedServiceUnit || !selectedService}
              >
                {savingService ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
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
    marginBottom: 20,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  actionsRow: {
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingSection: {
    padding: 40,
    alignItems: 'center',
  },
  emptySection: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  userList: {
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
  },
  userDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 12,
    color: COLORS.gray,
  },
  userService: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  userActions: {
    justifyContent: 'center',
    gap: 8,
  },
  changePasswordButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  changePasswordButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  editServiceButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editServiceButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: COLORS.textPrimary,
  },
});

export default UserManagementScreen;
