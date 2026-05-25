import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { screenStyles } from '../theme/screenStyles';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onLogout?: () => void;
  backLabel?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onLogout,
  backLabel = 'Back',
}) => (
  <View style={screenStyles.headerRow}>
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={screenStyles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={screenStyles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={screenStyles.headerActions}>
      {onBack ? (
        <TouchableOpacity style={screenStyles.backButton} onPress={onBack} activeOpacity={0.8}>
          <Text style={screenStyles.backButtonText}>{backLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {onLogout ? (
        <TouchableOpacity style={screenStyles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Text style={screenStyles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

export default ScreenHeader;
