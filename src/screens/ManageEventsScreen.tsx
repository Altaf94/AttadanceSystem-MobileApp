import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, EventItem } from '../types';
import { COLORS } from '../constants';
import { fetchEventsWithId, deleteEvent } from '../services/api';
import { getUser, isAdmin } from '../utils';

type ManageEventsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageEvents'>;

interface Props {
  navigation: ManageEventsScreenNavigationProp;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  WORKING_DAYS: { label: 'Working Days', color: '#3498db', bg: '#e5f0ff' },
  FESTIVAL: { label: 'Festival', color: '#e67e22', bg: '#fff5eb' },
  GENERAL_EVENT: { label: 'General', color: '#27ae60', bg: '#e9f8ef' },
};

const ManageEventsScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getUser();
      const admin = isAdmin(user?.email);
      setIsUserAdmin(admin);
      if (admin) {
        loadEvents();
      }
    } catch {
      setIsUserAdmin(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEventsWithId();
      setEvents(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (event: EventItem) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.occasion}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(event.id);
            try {
              const result = await deleteEvent(event.id);
              Alert.alert('Success', `Event "${result.deleted}" deleted`);
              setEvents(prev => prev.filter(e => e.id !== event.id));
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete event';
              Alert.alert('Error', message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.accessDeniedText}>Only admins can manage events.</Text>
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
            <Text style={styles.headerTitle}>Manage Events</Text>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerBackButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No events found.</Text>
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={() => navigation.navigate('AddEvent')}
              >
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventList}>
              {events.map(event => {
                const cat = CATEGORY_LABELS[event.category] || CATEGORY_LABELS.GENERAL_EVENT;
                const isDeleting = deletingId === event.id;

                return (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{event.occasion}</Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: cat.bg },
                        ]}
                      >
                        <Text style={[styles.categoryText, { color: cat.color }]}>
                          {cat.label}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        isDeleting && styles.deleteButtonDisabled,
                      ]}
                      onPress={() => handleDelete(event)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
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
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
    marginBottom: 16,
  },
  addEventButton: {
    backgroundColor: '#8e44ad',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addEventButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  eventList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ManageEventsScreen;
