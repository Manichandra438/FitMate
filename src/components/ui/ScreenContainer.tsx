import React from 'react';
import { StyleSheet, ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  headerGradient?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function ScreenContainer({
  children,
  scroll = true,
  headerGradient = false,
  style,
  edges = ['top'],
}: Props) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {headerGradient && (
        <LinearGradient
          colors={gradients.header}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.45 }}
          pointerEvents="none"
        />
      )}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
});
