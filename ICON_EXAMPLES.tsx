/**
 * VECTOR ICONS USAGE EXAMPLES
 * 
 * This file demonstrates how to use the Icon component
 * throughout your application instead of emoji icons.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../components';
import { COLORS } from '../constants';

// Example 1: Tab Navigation Icons
export const TabIconExamples = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tabItem}>
        <Icon name="assessment" size={24} color={COLORS.primary} family="material" />
        <Text>Overview</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem}>
        <Icon name="assignment" size={24} color={COLORS.secondary} family="material" />
        <Text>Check-ins</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem}>
        <Icon name="people" size={24} color={COLORS.success} family="material" />
        <Text>Volunteers</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem}>
        <Icon name="event" size={24} color={COLORS.warning} family="material" />
        <Text>Events</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 2: Report Action Buttons
export const ActionButtonsExample = () => {
  return (
    <View style={styles.buttonGroup}>
      {/* Export Button */}
      <TouchableOpacity style={[styles.button, styles.exportBtn]}>
        <Icon name="download" size={18} color={COLORS.white} family="feather" />
        <Text style={styles.buttonText}>Export CSV</Text>
      </TouchableOpacity>

      {/* Search Button */}
      <TouchableOpacity style={[styles.button, styles.searchBtn]}>
        <Icon name="search" size={18} color={COLORS.white} family="material" />
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {/* Clear Button */}
      <TouchableOpacity style={[styles.button, styles.clearBtn]}>
        <Icon name="close" size={18} color={COLORS.textPrimary} family="material" />
        <Text style={styles.buttonText}>Clear</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity style={[styles.button, styles.backBtn]}>
        <Icon name="arrow-left" size={18} color={COLORS.primary} family="feather" />
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 3: Statistics Card Icons
export const StatCardExample = () => {
  const statsData = [
    { label: 'Total Check-ins', icon: 'pie-chart', count: '2,345', color: COLORS.primary },
    { label: 'Volunteers', icon: 'users', count: '156', color: COLORS.success, family: 'feather' },
    { label: 'Events', icon: 'calendar', count: '12', color: COLORS.warning, family: 'feather' },
    { label: "Today's Check-ins", icon: 'today', count: '89', color: COLORS.info },
  ];

  return (
    <View style={styles.statsGrid}>
      {statsData.map((stat, idx) => (
        <View key={idx} style={styles.statCard}>
          <Icon 
            name={stat.icon} 
            size={32} 
            color={stat.color}
            family={stat.family || 'material'}
          />
          <Text style={styles.statCount}>{stat.count}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

// Example 4: List Item Icons
export const ListItemExample = () => {
  const items = [
    { name: 'Ahmed Khan', event: 'Community Event', icon: 'user-check', status: 'checked-in' },
    { name: 'Fatima Ali', event: 'Workshop', icon: 'user-plus', status: 'pending' },
    { name: 'Hassan Raza', event: 'Charity Event', icon: 'alert-circle', status: 'delayed' },
  ];

  return (
    <View>
      {items.map((item, idx) => (
        <View key={idx} style={styles.listItem}>
          <Icon name={item.icon} size={20} color={COLORS.gray} family="feather" />
          <View style={styles.listItemContent}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemEvent}>{item.event}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Example 5: Header Icons
export const HeaderExample = () => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <Icon name="trending-up" size={28} color={COLORS.primary} family="feather" />
        <Text style={styles.headerText}>Attendance Reports</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity>
          <Icon name="download" size={24} color={COLORS.primary} family="feather" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="arrow-left" size={24} color={COLORS.primary} family="feather" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  tabItem: {
    alignItems: 'center',
    gap: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    padding: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exportBtn: {
    backgroundColor: COLORS.primary,
  },
  searchBtn: {
    backgroundColor: COLORS.info,
  },
  clearBtn: {
    backgroundColor: COLORS.lightGray,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemEvent: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.info,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default {
  TabIconExamples,
  ActionButtonsExample,
  StatCardExample,
  ListItemExample,
  HeaderExample,
};
