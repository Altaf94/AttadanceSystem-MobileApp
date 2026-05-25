import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_GRADIENT } from '../theme/brand';
import { screenStyles } from '../theme/screenStyles';
import { COLORS } from '../constants';

interface ScreenLayoutProps {
  children?: React.ReactNode;
  scroll?: boolean;
  centered?: boolean;
  keyboard?: boolean;
  loading?: boolean;
  loadingText?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  scroll = true,
  centered = false,
  keyboard = false,
  loading = false,
  loadingText = 'Loading...',
  contentContainerStyle,
}) => {
  if (loading) {
    return (
      <LinearGradient colors={[...BRAND_GRADIENT]} style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={screenStyles.loadingText}>{loadingText}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const scrollStyle = centered
    ? screenStyles.scrollContentCentered
    : screenStyles.scrollContent;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[scrollStyle, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  const content = keyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <LinearGradient colors={[...BRAND_GRADIENT]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {content}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenLayout;
