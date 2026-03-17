import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList, ReportData, CheckIn } from '../types';
import { COLORS } from '../constants';
import { fetchReports } from '../services/api';
import { getUser, isAdmin, formatDate } from '../utils';

type ReportsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reports'>;

interface Props {
  navigation: ReportsScreenNavigationProp;
}

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins'>('overview');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getUser();
      const admin = isAdmin(user?.email);
      setIsUserAdmin(admin);
      if (admin) {
        loadReports();
      }
    } catch {
      setIsUserAdmin(false);
    }
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await fetchReports({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        event: selectedEvent || undefined,
        service: selectedService || undefined,
        search: searchQuery || undefined,
      });
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedEvent, selectedService, searchQuery]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadReports();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEvent('');
    setSelectedService('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const paginatedCheckins = data?.checkins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  const totalPages = data ? Math.ceil(data.checkins.length / itemsPerPage) : 0;

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
        <Text style={styles.accessDeniedText}>You do not have permission to view reports.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCheckInItem = ({ item }: { item: CheckIn }) => (
    <View style={styles.checkInItem}>
      <View style={styles.checkInRow}>
        <Text style={styles.checkInId}>{item.volunteerId}</Text>
        <Text style={styles.checkInName}>{item.volunteerName}</Text>
      </View>
      <View style={styles.checkInRow}>
        <Text style={styles.checkInEvent}>{item.event}</Text>
        <Text style={styles.checkInTime}>
          {item.checkinAtClient || formatDate(item.checkinAt)}
        </Text>
      </View>
      {item.service && (
        <Text style={styles.checkInService}>{item.service}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Attendance Reports</Text>
            <Text style={styles.headerSubtitle}>Detailed analytics and insights</Text>
          </View>
          <TouchableOpacity
            style={styles.backTouchable}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backTouchableText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filters & Search</Text>
          <View style={styles.filtersGrid}>
            <View style={styles.filterRow}>
              <TextInput
                style={[styles.filterInput, styles.filterInputHalf]}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={COLORS.gray}
                value={startDate}
                onChangeText={setStartDate}
              />
              <TextInput
                style={[styles.filterInput, styles.filterInputHalf]}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor={COLORS.gray}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEvent}
                onValueChange={setSelectedEvent}
                style={styles.picker}
              >
                <Picker.Item label="All Events" value="" />
                {data?.filters.events.map(e => (
                  <Picker.Item key={e} label={e} value={e} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedService}
                onValueChange={setSelectedService}
                style={styles.picker}
              >
                <Picker.Item label="All Services" value="" />
                {data?.filters.services.map(s => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.filterInput}
              placeholder="Search Volunteer Name or ID..."
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>🔍 Search</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              📈 Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'checkins' && styles.activeTab]}
            onPress={() => setActiveTab('checkins')}
          >
            <Text style={[styles.tabText, activeTab === 'checkins' && styles.activeTabText]}>
              📋 Check-ins
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && data && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <View style={styles.overviewContainer}>
                {/* Summary Tiles */}
                <View style={styles.tilesGrid}>
                  <View style={[styles.tile, styles.tilePrimary]}>
                    <Text style={styles.tileIcon}>📊</Text>
                    <Text style={styles.tileValue}>{data.summary.totalCheckins}</Text>
                    <Text style={styles.tileLabel}>Total Check-ins</Text>
                  </View>
                  <View style={[styles.tile, styles.tileSuccess]}>
                    <Text style={styles.tileIcon}>👥</Text>
                    <Text style={styles.tileValue}>{data.summary.uniqueVolunteers}</Text>
                    <Text style={styles.tileLabel}>Unique Volunteers</Text>
                  </View>
                  <View style={[styles.tile, styles.tileWarning]}>
                    <Text style={styles.tileIcon}>🗓️</Text>
                    <Text style={styles.tileValue}>{data.summary.totalEvents}</Text>
                    <Text style={styles.tileLabel}>Events Covered</Text>
                  </View>
                  <View style={[styles.tile, styles.tileInfo]}>
                    <Text style={styles.tileIcon}>📅</Text>
                    <Text style={styles.tileValue}>{data.summary.todayCheckins}</Text>
                    <Text style={styles.tileLabel}>Today's Check-ins</Text>
                  </View>
                </View>

                {/* Top Volunteers */}
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>🏆 Top Volunteers</Text>
                  {data.topVolunteers.slice(0, 5).map((vol, index) => (
                    <View key={vol.volunteerId} style={styles.statsRow}>
                      <Text style={styles.statsRank}>#{index + 1}</Text>
                      <View style={styles.statsInfo}>
                        <Text style={styles.statsName}>{vol.volunteerName}</Text>
                        <Text style={styles.statsId}>{vol.volunteerId}</Text>
                      </View>
                      <Text style={styles.statsCount}>{vol.count}</Text>
                    </View>
                  ))}
                </View>

                {/* Event Stats */}
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>🗓️ Check-ins by Event</Text>
                  {data.eventStats.slice(0, 5).map((event, index) => (
                    <View key={event.name} style={styles.statsRow}>
                      <Text style={styles.statsRank}>#{index + 1}</Text>
                      <Text style={[styles.statsName, { flex: 1 }]} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.statsCount}>{event.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Check-ins Tab */}
            {activeTab === 'checkins' && (
              <View style={styles.checkinsContainer}>
                <Text style={styles.checkinsTitle}>
                  Total: {data.checkins.length} check-ins
                </Text>
                
                <FlatList
                  data={paginatedCheckins}
                  renderItem={renderCheckInItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No check-ins found</Text>
                  }
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                      onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <Text style={styles.pageButtonText}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <TouchableOpacity
                      style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                      onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <Text style={styles.pageButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
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
    padding: 16,
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
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
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
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  backTouchable: {
    padding: 8,
  },
  backTouchableText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filtersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  filtersGrid: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterInput: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.black,
    fontSize: 14,
  },
  filterInputHalf: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  picker: {
    height: 44,
    color: COLORS.black,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  clearButtonText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.white,
  },
  loadingSection: {
    padding: 40,
    alignItems: 'center',
  },
  errorSection: {
    padding: 20,
    backgroundColor: '#fdecea',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
  overviewContainer: {
    gap: 16,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tilePrimary: {
    backgroundColor: '#e5f0ff',
    borderWidth: 1,
    borderColor: '#b3d4ff',
  },
  tileSuccess: {
    backgroundColor: '#e9f8ef',
    borderWidth: 1,
    borderColor: '#b7dfc1',
  },
  tileWarning: {
    backgroundColor: '#fff5eb',
    borderWidth: 1,
    borderColor: '#ffd9b3',
  },
  tileInfo: {
    backgroundColor: '#e5f7ff',
    borderWidth: 1,
    borderColor: '#b3e5ff',
  },
  tileIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  tileLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statsRank: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    width: 30,
  },
  statsInfo: {
    flex: 1,
  },
  statsName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  statsId: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    minWidth: 40,
    textAlign: 'right',
  },
  checkinsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkinsTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  checkInItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  checkInRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkInId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  checkInName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  checkInEvent: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  checkInTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  checkInService: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    padding: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  pageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  pageButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default ReportsScreen;
