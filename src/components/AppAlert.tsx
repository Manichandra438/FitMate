import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../types';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

interface AlertState {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface PromptState {
  title: string;
  message?: string;
  secure: boolean;
  onSubmit: (value: string | null) => void;
}

let setAlertState: ((s: AlertState | null) => void) | null = null;
let setPromptState: ((s: PromptState | null) => void) | null = null;

/** Drop-in app-styled replacement for React Native's Alert.alert. */
export function appAlert(title: string, message?: string, buttons?: AlertButton[]) {
  setAlertState?.({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
}

/** Drop-in app-styled replacement for React Native's Alert.prompt (also fixes it being iOS-only). */
export function appPrompt(
  title: string,
  message: string | undefined,
  onSubmit: (value: string | null) => void,
  opts?: { secure?: boolean }
) {
  setPromptState?.({ title, message, secure: !!opts?.secure, onSubmit });
}

/** Mount once near the app root — renders whatever appAlert()/appPrompt() request. */
export default function AppAlertHost() {
  const [alertState, setAlertStateLocal] = useState<AlertState | null>(null);
  const [promptState, setPromptStateLocal] = useState<PromptState | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    setAlertState = setAlertStateLocal;
    setPromptState = (s) => {
      setPromptValue('');
      setPromptStateLocal(s);
    };
    return () => {
      setAlertState = null;
      setPromptState = null;
    };
  }, []);

  const closeAlert = () => setAlertStateLocal(null);
  const closePrompt = (value: string | null) => {
    const onSubmit = promptState?.onSubmit;
    setPromptStateLocal(null);
    onSubmit?.(value);
  };

  return (
    <>
      <Modal visible={!!alertState} transparent animationType="fade" onRequestClose={closeAlert}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {alertState && (
              <>
                <Text style={styles.title}>{alertState.title}</Text>
                {!!alertState.message && <Text style={styles.message}>{alertState.message}</Text>}
                <View style={alertState.buttons.length > 2 ? styles.btnCol : styles.btnRow}>
                  {alertState.buttons.map((b, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.btn,
                        b.style === 'destructive'
                          ? styles.btnDestructive
                          : b.style === 'cancel'
                          ? styles.btnCancel
                          : styles.btnDefault,
                      ]}
                      onPress={() => {
                        closeAlert();
                        b.onPress?.();
                      }}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          b.style === 'destructive' && styles.btnTextDestructive,
                          b.style === 'cancel' && styles.btnTextCancel,
                        ]}
                      >
                        {b.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!promptState}
        transparent
        animationType="fade"
        onRequestClose={() => closePrompt(null)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.card}>
            {promptState && (
              <>
                <Text style={styles.title}>{promptState.title}</Text>
                {!!promptState.message && <Text style={styles.message}>{promptState.message}</Text>}
                <TextInput
                  style={styles.input}
                  value={promptValue}
                  onChangeText={setPromptValue}
                  secureTextEntry={promptState.secure}
                  autoFocus
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnCancel]}
                    onPress={() => closePrompt(null)}
                  >
                    <Text style={[styles.btnText, styles.btnTextCancel]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDefault]}
                    onPress={() => closePrompt(promptValue)}
                  >
                    <Text style={styles.btnText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(46,42,38,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCol: {
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDefault: {
    backgroundColor: COLORS.green,
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnDestructive: {
    backgroundColor: COLORS.red,
  },
  btnText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextCancel: {
    color: COLORS.textSecondary,
  },
  btnTextDestructive: {
    color: '#fff',
  },
});
