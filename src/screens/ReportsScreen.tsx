import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DateTimePicker } from '../components';
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
  Share,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList, ReportData, CheckIn, ServiceUnitItem } from '../types';
import { COLORS, SERVICE_UNIT_OPTIONS, SERVICE_OPTIONS } from '../constants';
import { fetchReports, submitCheckIn, deleteCheckIn, updateCheckIn, fetchServices } from '../services/api';
import { getUser, isAdmin, formatDate } from '../utils';

type ReportsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reports'>;

interface Props {
  navigation: ReportsScreenNavigationProp;
}

// Custom Bar Chart Component
interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  title: string;
  horizontal?: boolean;
  maxBars?: number;
  barColor?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, horizontal = false, maxBars = 10, barColor = COLORS.primary }) => {
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(d => d.value), 1);

  if (horizontal) {
    return (
      <View style={chartStyles.chartContainer}>
        <Text style={chartStyles.chartTitle}>{title}</Text>
        {displayData.map((item, index) => (
          <View key={index} style={chartStyles.horizontalBarRow}>
            <Text style={chartStyles.horizontalBarLabel} numberOfLines={1}>{item.label}</Text>
            <View style={chartStyles.horizontalBarContainer}>
              <View
                style={[
                  chartStyles.horizontalBar,
                  {
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || barColor,
                  },
                ]}
              />
              <Text style={chartStyles.horizontalBarValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={chartStyles.chartContainer}>
      <Text style={chartStyles.chartTitle}>{title}</Text>
      <View style={chartStyles.verticalChartWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={chartStyles.verticalBarsContainer}>
            {displayData.map((item, index) => (
              <View key={index} style={chartStyles.verticalBarWrapper}>
                <Text style={chartStyles.verticalBarValue}>{item.value}</Text>
                <View
                  style={[
                    chartStyles.verticalBar,
                    {
                      height: Math.max((item.value / maxValue) * 120, 20),
                      backgroundColor: item.color || barColor,
                    },
                  ]}
                />
                <Text style={chartStyles.verticalBarLabel} numberOfLines={2}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins' | 'volunteers' | 'events' | 'charts'>('overview');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [currentUserId, setCurrentUserId] = useState('');

  // Add Attendance Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addVolId, setAddVolId] = useState('');
  const [addVolName, setAddVolName] = useState('');
  const [addEvent, setAddEvent] = useState('');
  const [addService, setAddService] = useState('');
  const [addServiceUnit, setAddServiceUnit] = useState('');
  const [addDate, setAddDate] = useState<Date>(new Date());
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Edit Check-in Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CheckIn | null>(null);
  const [editVolId, setEditVolId] = useState('');
  const [editVolName, setEditVolName] = useState('');
  const [editEvent, setEditEvent] = useState('');
  const [editService, setEditService] = useState('');
  const [editServiceUnit, setEditServiceUnit] = useState('');
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Dynamic service units from API
  const [serviceUnits, setServiceUnits] = useState<ServiceUnitItem[]>([]);

  const getGenderFromVolunteerId = (volunteerId: string): 'Male' | 'Female' | 'Unknown' => {
    if (!volunteerId) return 'Unknown';
    const parts = volunteerId.split('.');
    const genderCode = parts.find((p) => p === 'M' || p === 'F');
    if (genderCode === 'M') return 'Male';
    if (genderCode === 'F') return 'Female';
    return 'Unknown';
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Load dynamic service units
  useEffect(() => {
    const loadServiceUnits = async () => {
      try {
        const data = await fetchServices();
        if (data && Array.isArray(data)) {
          setServiceUnits(data);
        }
      } catch (error) {
        console.error('Failed to load service units:', error);
        setServiceUnits([]);
      }
    };
    loadServiceUnits();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getUser();
      const admin = isAdmin(user?.email);
      setIsUserAdmin(admin);
      setCurrentUserId(user?.id || '');
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

  const handleDeleteCheckIn = (checkIn: CheckIn) => {
    Alert.alert(
      'Delete Attendance',
      `Delete attendance record for ${checkIn.volunteerName} (${checkIn.volunteerId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCheckIn(checkIn.id);
              loadReports();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete attendance');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (checkIn: CheckIn) => {
    setEditTarget(checkIn);
    setEditVolId(checkIn.volunteerId);
    setEditVolName(checkIn.volunteerName);
    setEditEvent(checkIn.event);
    setEditService(checkIn.service || '');
    setEditServiceUnit(checkIn.serviceUnit || '');
    setEditDate(
      checkIn.checkinAtClient
        ? new Date(checkIn.checkinAtClient)
        : new Date(checkIn.checkinAt)
    );
    setShowEditModal(true);
  };

  const handleEditCheckIn = async () => {
    if (!editTarget) return;
    if (!editVolId.trim() || !editVolName.trim() || !editEvent) {
      Alert.alert('Validation', 'Volunteer ID, Name, and Event are required.');
      return;
    }
    setEditLoading(true);
    try {
      await updateCheckIn(editTarget.id, {
        volunteerId: editVolId.trim(),
        volunteerName: editVolName.trim(),
        event: editEvent,
        service: editService.trim() || null,
        serviceUnit: editServiceUnit.trim() || null,
        checkinAt: editDate.toISOString(),
        checkinAtClient: formatDate(editDate),
      });
      setShowEditModal(false);
      setEditTarget(null);
      loadReports();
      Alert.alert('Success', 'Attendance updated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update attendance');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddAttendance = async () => {
    if (!addVolId.trim() || !addVolName.trim() || !addEvent) {
      Alert.alert('Validation', 'Volunteer ID, Name, and Event are required.');
      return;
    }
    setAddLoading(true);
    try {
      await submitCheckIn({
        volunteerId: addVolId.trim(),
        volunteerName: addVolName.trim(),
        event: addEvent,
        takenByUserId: currentUserId,
        service: addService.trim() || undefined,
        serviceUnit: addServiceUnit.trim() || undefined,
        actionAt: addDate.toISOString(),
        actionAtClient: formatDate(addDate),
      });
      setShowAddModal(false);
      setAddVolId('');
      setAddVolName('');
      setAddEvent('');
      setAddService('');
      setAddServiceUnit('');
      setAddDate(new Date());
      loadReports();
      Alert.alert('Success', 'Attendance added successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add attendance');
    } finally {
      setAddLoading(false);
    }
  };

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

  const handleShareCsv = async () => {
    if (!data || !data.checkins.length) {
      Alert.alert('No Data', 'There are no check-ins to export.');
      return;
    }

    try {
      const headers = [
        'Volunteer ID',
        'Volunteer Name',
        'Event',
        'Service',
        'Service Unit',
        'Check-in Time',
        'Recorded By',
      ];

      const rows = data.checkins.map((c) => [
        c.volunteerId,
        c.volunteerName,
        c.event,
        c.service || '',
        c.serviceUnit || '',
        c.checkinAtClient || formatDate(c.checkinAt),
        // @ts-ignore takenByUserName comes from backend but is not part of CheckIn type
        c.takenByUserName || '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const value = (cell ?? '').toString().replace(/"/g, '""');
              return `"${value}"`;
            })
            .join(',')
        )
        .join('\n');

      await Share.share({
        title: 'Attendance Report',
        message: csvContent,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share CSV report.');
    }
  };

  const paginatedCheckins = data?.checkins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  const totalPages = data ? Math.ceil(data.checkins.length / itemsPerPage) : 0;

  const genderStats = useMemo(() => {
    if (!data) {
      return { male: 0, female: 0, unknown: 0 };
    }

    let male = 0;
    let female = 0;
    let unknown = 0;

    data.checkins.forEach((checkin) => {
      const gender = getGenderFromVolunteerId(checkin.volunteerId);
      if (gender === 'Male') male += 1;
      else if (gender === 'Female') female += 1;
      else unknown += 1;
    });

    return { male, female, unknown };
  }, [data]);

  // Chart data computations
  const serviceUnitStats = useMemo(() => {
    if (!data) return [];
    const unitCounts: Record<string, number> = {};
    data.checkins.forEach((checkin) => {
      const unit = checkin.serviceUnit || 'Other';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    return Object.entries(unitCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const committeeStatsFemale = useMemo(() => {
    if (!data) return [];
    const committeeCounts: Record<string, number> = {};
    data.checkins.forEach((checkin) => {
      const gender = getGenderFromVolunteerId(checkin.volunteerId);
      if (gender === 'Female') {
        const service = checkin.service || 'Other';
        committeeCounts[service] = (committeeCounts[service] || 0) + 1;
      }
    });
    return Object.entries(committeeCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const committeeStatsMale = useMemo(() => {
    if (!data) return [];
    const committeeCounts: Record<string, number> = {};
    data.checkins.forEach((checkin) => {
      const gender = getGenderFromVolunteerId(checkin.volunteerId);
      if (gender === 'Male') {
        const service = checkin.service || 'Other';
        committeeCounts[service] = (committeeCounts[service] || 0) + 1;
      }
    });
    return Object.entries(committeeCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const userWiseStats = useMemo(() => {
    if (!data) return [];
    const userCounts: Record<string, { name: string; count: number }> = {};
    data.checkins.forEach((checkin) => {
      const id = checkin.volunteerId;
      if (!userCounts[id]) {
        userCounts[id] = { name: checkin.volunteerName || id, count: 0 };
      }
      userCounts[id].count += 1;
    });
    return Object.values(userCounts)
      .map(({ name, count }) => ({ label: name.split(' ')[0], value: count }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const genderChartData = useMemo(() => [
    { label: 'Female', value: genderStats.female, color: '#FF6B6B' },
    { label: 'Male', value: genderStats.male, color: '#4ECDC4' },
  ], [genderStats]);

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
        <View style={styles.checkInActions}>
          <TouchableOpacity
            style={styles.editCheckInButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editCheckInButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteCheckInButton}
            onPress={() => handleDeleteCheckIn(item)}
          >
            <Text style={styles.deleteCheckInButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
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
      <Text style={styles.checkInGender}>{getGenderFromVolunteerId(item.volunteerId)}</Text>
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.exportButton, !data?.checkins.length && styles.exportButtonDisabled]}
              onPress={handleShareCsv}
              disabled={!data?.checkins.length}
            >
              <Text style={styles.exportButtonText}>📊 Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backTouchable}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backTouchableText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filters & Search</Text>
          <View style={styles.filtersGrid}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterInput, styles.filterInputHalf]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={startDate ? styles.dateText : styles.datePlaceholder}>
                  {startDate || 'Start Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterInput, styles.filterInputHalf]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={endDate ? styles.dateText : styles.datePlaceholder}>
                  {endDate || 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              visible={showStartDatePicker}
              onClose={() => setShowStartDatePicker(false)}
              onSelectDateTime={(date) => {
                const formatted = date.toISOString().split('T')[0];
                setStartDate(formatted);
              }}
              dateOnly
            />
            <DateTimePicker
              visible={showEndDatePicker}
              onClose={() => setShowEndDatePicker(false)}
              onSelectDateTime={(date) => {
                const formatted = date.toISOString().split('T')[0];
                setEndDate(formatted);
              }}
              dateOnly
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEvent}
                onValueChange={setSelectedEvent}
                style={styles.picker}
              >
                <Picker.Item label="All Events" value="" />
                {Array.from(new Set(data?.filters.events)).map((e, idx) => (
                  <Picker.Item key={`event-${idx}`} label={e} value={e} />
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
                {Array.from(new Set(data?.filters.services)).map((s, idx) => (
                  <Picker.Item key={`service-${idx}`} label={s} value={s} />
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
            <Text style={styles.tabIcon}>📈</Text>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'checkins' && styles.activeTab]}
            onPress={() => setActiveTab('checkins')}
          >
            <Text style={styles.tabIcon}>📋</Text>
            <Text style={[styles.tabText, activeTab === 'checkins' && styles.activeTabText]}>
              Check-ins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'volunteers' && styles.activeTab]}
            onPress={() => setActiveTab('volunteers')}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={[styles.tabText, activeTab === 'volunteers' && styles.activeTabText]}>
              Volunteers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={styles.tabIcon}>🗓️</Text>
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'charts' && styles.activeTab]}
            onPress={() => setActiveTab('charts')}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text style={[styles.tabText, activeTab === 'charts' && styles.activeTabText]}>
              Charts
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
                    <View key={`${event.name}-${index}`} style={styles.statsRow}>
                      <Text style={styles.statsRank}>#{index + 1}</Text>
                      <Text style={[styles.statsName, { flex: 1 }]} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.statsCount}>{event.count}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>👤 Gender Breakdown (by Check-ins)</Text>
                  <View style={styles.statsRow}>
                    <Text style={styles.statsName}>Male (M)</Text>
                    <Text style={styles.statsCount}>{genderStats.male}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statsName}>Female (F)</Text>
                    <Text style={styles.statsCount}>{genderStats.female}</Text>
                  </View>
                  {genderStats.unknown > 0 && (
                    <View style={styles.statsRow}>
                      <Text style={styles.statsName}>Unknown</Text>
                      <Text style={styles.statsCount}>{genderStats.unknown}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Check-ins Tab */}
            {activeTab === 'checkins' && (
              <View style={styles.checkinsContainer}>
                <View style={styles.checkinsHeader}>
                  <Text style={styles.checkinsTitle}>
                    Total: {data.checkins.length} check-ins
                  </Text>
                  <TouchableOpacity
                    style={styles.addAttendanceButton}
                    onPress={() => {
                      setAddEvent(selectedEvent || (data.filters.events[0] || ''));
                      setAddDate(new Date());
                      setShowAddModal(true);
                    }}
                  >
                    <Text style={styles.addAttendanceButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                
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

            {/* Volunteers Tab */}
            {activeTab === 'volunteers' && (
              <View style={styles.volunteersContainer}>
                <Text style={styles.statsTitle}>Top Volunteers</Text>
                {data.topVolunteers.length === 0 && (
                  <Text style={styles.emptyText}>No volunteer data available.</Text>
                )}
                {data.topVolunteers.map((vol, index) => (
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
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <View style={styles.eventsContainer}>
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>🗓️ Check-ins by Event</Text>
                  {data.eventStats.length === 0 && (
                    <Text style={styles.emptyText}>No event data available.</Text>
                  )}
                  {data.eventStats.map((event, index) => (
                    <View key={`${event.name}-${index}`} style={styles.statsRow}>
                      <Text style={styles.statsRank}>#{index + 1}</Text>
                      <Text style={[styles.statsName, { flex: 1 }]} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.statsCount}>{event.count}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>📂 Check-ins by Category</Text>
                  {data.categoryStats.length === 0 && (
                    <Text style={styles.emptyText}>No category data available.</Text>
                  )}
                  {data.categoryStats.map((cat, index) => (
                    <View key={`${cat.name}-${index}`} style={styles.statsRow}>
                      <Text style={styles.statsRank}>#{index + 1}</Text>
                      <Text style={[styles.statsName, { flex: 1 }]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Text style={styles.statsCount}>{cat.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
              <View style={styles.chartsContainer}>
                {/* Summary Header */}
                <View style={chartStyles.summaryHeader}>
                  <Text style={chartStyles.summaryTitle}>
                    {selectedEvent || 'All Events'} {startDate ? `- ${startDate}` : ''}
                  </Text>
                  <View style={chartStyles.summaryCards}>
                    <View style={[chartStyles.summaryCard, chartStyles.summaryCardTotal]}>
                      <Text style={chartStyles.summaryLabel}>Total Check Ins</Text>
                      <Text style={[chartStyles.summaryValue, { color: '#1976D2' }]}>
                        {data.summary.totalCheckins}
                      </Text>
                    </View>
                    <View style={[chartStyles.summaryCard, chartStyles.summaryCardMale]}>
                      <Text style={chartStyles.summaryLabel}>Male</Text>
                      <Text style={[chartStyles.summaryValue, { color: '#1976D2' }]}>
                        {genderStats.male}
                      </Text>
                    </View>
                    <View style={[chartStyles.summaryCard, chartStyles.summaryCardFemale]}>
                      <Text style={chartStyles.summaryLabel}>Female</Text>
                      <Text style={[chartStyles.summaryValue, { color: '#D32F2F' }]}>
                        {genderStats.female}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service Unit Wise & Gender Wise Charts */}
                <View style={chartStyles.chartsRow}>
                  <View style={chartStyles.chartHalf}>
                    <BarChart
                      data={serviceUnitStats}
                      title="Service Unit Wise"
                      horizontal={false}
                      maxBars={5}
                      barColor="#4285F4"
                    />
                  </View>
                  <View style={chartStyles.chartHalf}>
                    <BarChart
                      data={genderChartData}
                      title="Gender Wise"
                      horizontal={false}
                      maxBars={2}
                    />
                  </View>
                </View>

                {/* Committee Wise Charts */}
                <View style={chartStyles.chartsRow}>
                  <View style={chartStyles.chartHalf}>
                    <BarChart
                      data={committeeStatsFemale}
                      title="Committee Wise (Female)"
                      horizontal={true}
                      maxBars={10}
                      barColor="#FF6B6B"
                    />
                  </View>
                  <View style={chartStyles.chartHalf}>
                    <BarChart
                      data={committeeStatsMale}
                      title="Committee Wise (Male)"
                      horizontal={true}
                      maxBars={10}
                      barColor="#4ECDC4"
                    />
                  </View>
                </View>

                {/* User Wise Chart */}
                <BarChart
                  data={userWiseStats}
                  title="User Wise"
                  horizontal={false}
                  maxBars={25}
                  barColor="#FF9800"
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Attendance Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Attendance</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.modalInput}
                placeholder="Volunteer ID*"
                placeholderTextColor={COLORS.gray}
                value={addVolId}
                onChangeText={setAddVolId}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Volunteer Name*"
                placeholderTextColor={COLORS.gray}
                value={addVolName}
                onChangeText={setAddVolName}
              />
              <View style={[styles.pickerContainer, { marginBottom: 12 }]}>
                <Picker
                  selectedValue={addEvent}
                  onValueChange={setAddEvent}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Event*" value="" />
                  {(data?.filters.events || []).map((e, idx) => (
                    <Picker.Item key={`add-event-${idx}`} label={e} value={e} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.pickerContainer, { marginBottom: 12 }]}>
                <Picker
                  selectedValue={addServiceUnit}
                  onValueChange={(val) => {
                    setAddServiceUnit(val);
                    setAddService('');
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Service Unit (optional)" value="" />
                  {/* Use dynamic service units from API, fallback to hardcoded constants */}
                  {(serviceUnits.length > 0 ? serviceUnits.map(u => u.name) : SERVICE_UNIT_OPTIONS).map((unit, idx) => (
                    <Picker.Item key={`add-unit-${idx}`} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.pickerContainer, { marginBottom: 12 }, !addServiceUnit && styles.pickerDisabled]}>
                <Picker
                  selectedValue={addService}
                  onValueChange={setAddService}
                  style={styles.picker}
                  enabled={!!addServiceUnit}
                >
                  <Picker.Item label={addServiceUnit ? 'Select Service (optional)' : 'Select a Service Unit first'} value="" />
                  {/* Use dynamic services from API, fallback to hardcoded constants */}
                  {(() => {
                    const dynamicUnit = serviceUnits.find(u => u.name === addServiceUnit);
                    const services = dynamicUnit
                      ? dynamicUnit.services.map(s => s.name)
                      : (addServiceUnit ? (SERVICE_OPTIONS[addServiceUnit] || []) : []);
                    return services.map((svc, idx) => (
                      <Picker.Item key={`add-svc-${idx}`} label={svc} value={svc} />
                    ));
                  })()}
                </Picker>
              </View>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setShowAddDatePicker(true)}
              >
                <Text style={{ color: COLORS.black }}>📅 {formatDate(addDate)}</Text>
              </TouchableOpacity>
              <DateTimePicker
                visible={showAddDatePicker}
                onClose={() => setShowAddDatePicker(false)}
                onSelectDateTime={(date) => {
                  setAddDate(date);
                  setShowAddDatePicker(false);
                }}
              />
              <TouchableOpacity
                style={[styles.modalSubmitButton, addLoading && styles.exportButtonDisabled]}
                onPress={handleAddAttendance}
                disabled={addLoading}
              >
                {addLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Add Attendance</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Attendance Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Attendance</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.modalInput}
                placeholder="Volunteer ID*"
                placeholderTextColor={COLORS.gray}
                value={editVolId}
                onChangeText={setEditVolId}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Volunteer Name*"
                placeholderTextColor={COLORS.gray}
                value={editVolName}
                onChangeText={setEditVolName}
              />
              <View style={[styles.pickerContainer, { marginBottom: 12 }]}>
                <Picker
                  selectedValue={editEvent}
                  onValueChange={setEditEvent}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Event*" value="" />
                  {(data?.filters.events || []).map((e, idx) => (
                    <Picker.Item key={`edit-event-${idx}`} label={e} value={e} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.pickerContainer, { marginBottom: 12 }]}>
                <Picker
                  selectedValue={editServiceUnit}
                  onValueChange={(val) => {
                    setEditServiceUnit(val);
                    setEditService('');
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Service Unit (optional)" value="" />
                  {/* Use dynamic service units from API, fallback to hardcoded constants */}
                  {(serviceUnits.length > 0 ? serviceUnits.map(u => u.name) : SERVICE_UNIT_OPTIONS).map((unit, idx) => (
                    <Picker.Item key={`edit-unit-${idx}`} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.pickerContainer, { marginBottom: 12 }, !editServiceUnit && styles.pickerDisabled]}>
                <Picker
                  selectedValue={editService}
                  onValueChange={setEditService}
                  style={styles.picker}
                  enabled={!!editServiceUnit}
                >
                  <Picker.Item label={editServiceUnit ? 'Select Service (optional)' : 'Select a Service Unit first'} value="" />
                  {/* Use dynamic services from API, fallback to hardcoded constants */}
                  {(() => {
                    const dynamicUnit = serviceUnits.find(u => u.name === editServiceUnit);
                    const services = dynamicUnit
                      ? dynamicUnit.services.map(s => s.name)
                      : (editServiceUnit ? (SERVICE_OPTIONS[editServiceUnit] || []) : []);
                    return services.map((svc, idx) => (
                      <Picker.Item key={`edit-svc-${idx}`} label={svc} value={svc} />
                    ));
                  })()}
                </Picker>
              </View>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setShowEditDatePicker(true)}
              >
                <Text style={{ color: COLORS.black }}>📅 {formatDate(editDate)}</Text>
              </TouchableOpacity>
              <DateTimePicker
                visible={showEditDatePicker}
                onClose={() => setShowEditDatePicker(false)}
                onSelectDateTime={(date) => {
                  setEditDate(date);
                  setShowEditDatePicker(false);
                }}
              />
              <TouchableOpacity
                style={[styles.modalSubmitButton, editLoading && styles.exportButtonDisabled]}
                onPress={handleEditCheckIn}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  exportButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  exportButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
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
  dateText: {
    color: COLORS.black,
    fontSize: 14,
  },
  datePlaceholder: {
    color: COLORS.gray,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    height: 50,
    justifyContent: 'center',
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  picker: {
    height: 50,
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
    justifyContent: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.darkGray,
    textAlign: 'center',
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
  checkinsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkinsTitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  addAttendanceButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addAttendanceButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: 20,
    color: COLORS.gray,
    padding: 4,
  },
  modalInput: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.black,
    fontSize: 14,
    marginBottom: 12,
  },
  modalSubmitButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalSubmitButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  volunteersContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 16,
  },
  eventsContainer: {
    marginTop: 16,
    rowGap: 16,
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
  checkInGender: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  checkInActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editCheckInButton: {
    padding: 4,
    marginLeft: 8,
  },
  editCheckInButtonText: {
    fontSize: 16,
  },
  deleteCheckInButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteCheckInButtonText: {
    fontSize: 16,
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
  chartsContainer: {
    gap: 16,
  },
});

// Chart-specific styles
const chartStyles = StyleSheet.create({
  summaryHeader: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    padding: 8,
    borderRadius: 4,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  summaryCardTotal: {
    borderColor: COLORS.textPrimary,
  },
  summaryCardMale: {
    borderColor: COLORS.textPrimary,
  },
  summaryCardFemale: {
    borderColor: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  chartsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chartHalf: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 12,
  },
  // Horizontal bar styles
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  horizontalBarLabel: {
    width: 100,
    fontSize: 10,
    color: COLORS.textSecondary,
    paddingRight: 8,
  },
  horizontalBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  horizontalBar: {
    height: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  horizontalBarValue: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  // Vertical bar styles
  verticalChartWrapper: {
    alignItems: 'center',
  },
  verticalBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    minHeight: 150,
  },
  verticalBarWrapper: {
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 40,
  },
  verticalBarValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    backgroundColor: '#1976D2',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  verticalBar: {
    width: 36,
    borderRadius: 4,
    minHeight: 20,
  },
  verticalBarLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 50,
  },
});

export default ReportsScreen;
