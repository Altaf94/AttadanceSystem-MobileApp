import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, EventItem } from '../types';
import { COLORS } from '../constants';
import { fetchEventsWithId, deleteEvent } from '../services/api';
import { getUser, isAdmin } from '../utils';
import { ScreenLayout, ScreenHeader, PrimaryButton, Icon } from '../components';
import { screenStyles } from '../theme/screenStyles';

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
    return <ScreenLayout loading loadingText="Loading..." />;
  }

  if (!isUserAdmin) {
    return (
      <ScreenLayout centered>
        <View style={screenStyles.card}>
          <View style={screenStyles.accessDeniedCard}>
            <Icon name="lock-closed-outline" size={48} color={COLORS.danger} family="ionicons" />
            <Text style={[screenStyles.screenTitle, { marginTop: 16 }]}>Access denied</Text>
            <Text style={screenStyles.accessDeniedText}>Only admins can manage events.</Text>
            <PrimaryButton title="Back to Dashboard" onPress={() => navigation.navigate('Dashboard')} />
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
        <View style={screenStyles.card}>
          <ScreenHeader title="Manage Events" subtitle="View and delete occasions" onBack={() => navigation.goBack()} />

          {loading ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={screenStyles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No events found.</Text>
              <PrimaryButton title="Add Event" icon="add-circle-outline" onPress={() => navigation.navigate('AddEvent')} />
            </View>
          ) : (
            <View style={styles.eventList}>
              {events.map(event => {
                const cat = CATEGORY_LABELS[event.category] || CATEGORY_LABELS.GENERAL_EVENT;
                const isDeleting = deletingId === event.id;

                return (
                  <View key={event.id} style={[styles.eventItem, screenStyles.cardCompact]}>
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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
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
  eventList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
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
