import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { screenStyles } from '../theme/screenStyles';
import { COLORS } from '../constants';
import { Icon, IconFamily } from './Icon';
interface FormFieldProps extends TextInputProps {
  label: string;
  icon?: string;
  iconFamily?: IconFamily;
  rightElement?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  icon,
  iconFamily = 'ionicons',
  rightElement,
  style,
  ...inputProps
}) => (
  <View>
    <Text style={screenStyles.label}>{label}</Text>
    <View style={screenStyles.inputRow}>
      {icon ? (
        <Icon name={icon} size={20} color={COLORS.gray} family={iconFamily} />
      ) : null}
      <TextInput
        style={[screenStyles.input, style]}
        placeholderTextColor={COLORS.gray}
        {...inputProps}
      />
      {rightElement}
    </View>
  </View>
);

interface PasswordFieldProps extends Omit<FormFieldProps, 'secureTextEntry' | 'rightElement'> {
  showPassword: boolean;
  onTogglePassword: () => void;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  showPassword,
  onTogglePassword,
  ...props
}) => (
  <FormField
    {...props}
    icon="lock-closed-outline"
    secureTextEntry={!showPassword}
    rightElement={
      <TouchableOpacity
        onPress={onTogglePassword}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Icon
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={COLORS.gray}
          family="ionicons"
        />
      </TouchableOpacity>
    }
  />
);

export default FormField;
