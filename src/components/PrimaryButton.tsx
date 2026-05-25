import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_BUTTON_GRADIENT } from '../theme/brand';
import { COLORS } from '../constants';
import { Icon, IconFamily } from './Icon';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconFamily?: IconFamily;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconFamily = 'ionicons',
  style,
  variant = 'primary',
}) => {
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[styles.secondary, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.secondaryText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  const colors =
    variant === 'danger'
      ? (['#c0392b', '#e74c3c'] as const)
      : BRAND_BUTTON_GRADIENT;

  return (
    <TouchableOpacity
      style={[styles.wrap, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[...colors]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <View style={styles.row}>
            <Text style={styles.text}>{title}</Text>
            {icon ? (
              <Icon name={icon} size={20} color={COLORS.white} family={iconFamily} />
            ) : null}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0b5a79',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondary: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#dce4ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.65,
  },
});

export default PrimaryButton;
