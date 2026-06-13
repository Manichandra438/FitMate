import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PROTOCOLS = [
  {
    emoji: '🚫',
    label: 'No fasting',
    window: 'All day',
    benefit: 'Meals spread across your wake hours. Best for beginners.',
  },
  {
    emoji: '⏱️',
    label: '16:8',
    window: 'Eat 12 pm – 8 pm',
    benefit: 'Most popular. Skip breakfast, eat lunch and dinner. Easy to start.',
  },
  {
    emoji: '🕐',
    label: '18:6',
    window: 'Eat 1 pm – 7 pm',
    benefit: 'Stronger fat-burning window. Good after 16:8 feels comfortable.',
  },
  {
    emoji: '🔥',
    label: '20:4',
    window: 'Eat 2 pm – 6 pm',
    benefit: 'Advanced. Only 4 hours to eat. Not recommended for beginners.',
  },
];

export default function IFInfoModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title}>What is Intermittent Fasting?</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.intro}>
            Intermittent fasting (IF) is an eating pattern where you cycle
            between periods of eating and fasting. You don't change{' '}
            <Text style={styles.bold}>what</Text> you eat — just{' '}
            <Text style={styles.bold}>when</Text> you eat it.
          </Text>

          <Text style={styles.intro}>
            The numbers (e.g. 16:8) mean{' '}
            <Text style={styles.bold}>hours fasting : hours eating</Text>.
            During the fasting window, only water, black coffee, or plain
            tea are allowed.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.list}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {PROTOCOLS.map((p) => (
              <View key={p.label} style={styles.card}>
                <Text style={styles.cardEmoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardLabel}>{p.label}</Text>
                    <Text style={styles.cardWindow}>{p.window}</Text>
                  </View>
                  <Text style={styles.cardBenefit}>{p.benefit}</Text>
                </View>
              </View>
            ))}

            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={16} color={colors.sun} />
              <Text style={styles.tipText}>
                Not sure? Start with <Text style={styles.bold}>No fasting</Text>.
                You can always switch later in Settings → Edit Profile.
              </Text>
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(46,42,38,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.md,
  },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  bold: { fontWeight: '700', color: colors.textPrimary },
  list: { marginTop: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEmoji: { fontSize: 22, marginTop: 2 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardWindow: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardBenefit: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.sunSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.sun,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
