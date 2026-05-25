import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Icon } from './Icon';
import { COLORS } from '../constants';
import { BRAND_TEAL } from '../theme/brand';

export type AppAlertVariant = 'error' | 'success' | 'info';

interface AppAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: AppAlertVariant;
  confirmText?: string;
  onClose: () => void;
}

const variantConfig = {
  error: {
    icon: 'close-circle' as const,
    iconFamily: 'ionicons' as const,
    iconColor: COLORS.danger,
    iconBg: '#fdecea',
    iconRing: 'rgba(231, 76, 60, 0.25)',
    buttonBg: COLORS.danger,
  },
  success: {
    icon: 'checkmark-circle' as const,
    iconFamily: 'ionicons' as const,
    iconColor: COLORS.success,
    iconBg: '#eaf7ee',
    iconRing: 'rgba(39, 174, 96, 0.25)',
    buttonBg: COLORS.success,
  },
  info: {
    icon: 'information-circle' as const,
    iconFamily: 'ionicons' as const,
    iconColor: BRAND_TEAL,
    iconBg: '#eef6f9',
    iconRing: 'rgba(11, 90, 121, 0.2)',
    buttonBg: BRAND_TEAL,
  },
};

export const AppAlertModal: React.FC<AppAlertModalProps> = ({
  visible,
  title,
  message,
  variant = 'error',
  confirmText = 'OK',
  onClose,
}) => {
  const config = variantConfig[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: config.iconBg, borderColor: config.iconRing },
            ]}
          >
            <Icon
              name={config.icon}
              size={40}
              color={config.iconColor}
              family={config.iconFamily}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: config.buttonBg }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{confirmText}</Text>
          </TouchableOpacity>
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
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AppAlertModal;
