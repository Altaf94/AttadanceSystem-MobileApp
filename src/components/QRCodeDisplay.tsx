import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../constants';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  logoSize?: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  logoSize = 60,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={value}
          size={size}
          color={COLORS.black}
          backgroundColor={COLORS.white}
          logoSize={logoSize}
          logoBackgroundColor="white"
          logoBorderRadius={8}
          quietZone={10}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default QRCodeDisplay;
