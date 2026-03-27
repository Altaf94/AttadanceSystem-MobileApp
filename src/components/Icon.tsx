import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { COLORS } from '../constants';

export type IconFamily = 'material' | 'feather' | 'fontawesome' | 'ionicons' | 'entypo';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  family?: IconFamily;
}

/**
 * Unified Icon component supporting multiple icon families
 * 
 * Usage Examples:
 * <Icon name="search" size={24} color={COLORS.primary} family="material" />
 * <Icon name="check" size={20} color="green" family="feather" />
 * <Icon name="home" size={24} family="ionicons" />
 * 
 * Available icon families:
 * - material: Material Design Icons (default)
 * - feather: Feather Icons
 * - fontawesome: Font Awesome Icons
 * - ionicons: Ionicons
 * - entypo: Entypo Icons
 * 
 * Find icons at: https://oblador.github.io/react-native-vector-icons/
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = COLORS.textPrimary,
  family = 'material',
}) => {
  switch (family) {
    case 'feather':
      return <Feather name={name} size={size} color={color} />;
    case 'fontawesome':
      return <FontAwesome name={name} size={size} color={color} />;
    case 'ionicons':
      return <Ionicons name={name} size={size} color={color} />;
    case 'entypo':
      return <Entypo name={name} size={size} color={color} />;
    case 'material':
    default:
      return <MaterialIcons name={name} size={size} color={color} />;
  }
};

export default Icon;
