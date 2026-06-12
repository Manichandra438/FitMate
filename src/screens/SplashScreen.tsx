import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.header}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Text style={styles.logo}>FitMate</Text>
      <Text style={styles.tagline}>Your personal diet & fitness coach</Text>
      <ActivityIndicator color={colors.primary} size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  spinner: { marginTop: 32 },
});
