import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { COLORS } from '../constants';
import { BRAND_TEAL } from '../theme/brand';

export type AppConfirmVariant = 'logout' | 'danger' | 'default';

interface AppConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: AppConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  logout: {
    icon: 'log-out-outline' as const,
    iconColor: COLORS.danger,
    iconBg: '#fdecea',
    iconRing: 'rgba(231, 76, 60, 0.25)',
    confirmBg: COLORS.danger,
  },
  danger: {
    icon: 'warning-outline' as const,
    iconColor: COLORS.danger,
    iconBg: '#fdecea',
    iconRing: 'rgba(231, 76, 60, 0.25)',
    confirmBg: COLORS.danger,
  },
  default: {
    icon: 'help-circle-outline' as const,
    iconColor: BRAND_TEAL,
    iconBg: '#eef6f9',
    iconRing: 'rgba(11, 90, 121, 0.2)',
    confirmBg: BRAND_TEAL,
  },
};

export const AppConfirmModal: React.FC<AppConfirmModalProps> = ({
  visible,
  title,
  message,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const config = variantConfig[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: config.iconBg, borderColor: config.iconRing },
            ]}
          >
            <Icon
              name={config.icon}
              size={36}
              color={config.iconColor}
              family="ionicons"
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: config.confirmBg }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: 'rgba(11, 90, 121, 0.12)',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AppConfirmModal;
