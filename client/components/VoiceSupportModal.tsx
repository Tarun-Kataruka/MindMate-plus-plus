import React, { useCallback, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useVoice } from '@/contexts/VoiceContext';

export default function VoiceSupportModal() {
  const { requestVoice, voiceEnabled, setVoiceEnabled } = useVoice();
  const [status, setStatus] = useState<'idle' | 'requesting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasAuthToken =
    // @ts-ignore
    typeof globalThis !== 'undefined' && Boolean((globalThis as any).authToken);
  const visible = hasAuthToken && voiceEnabled === null;

  const closeModal = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const closeModalWithDisable = useCallback(() => {
    setVoiceEnabled(false);
    closeModal();
  }, [setVoiceEnabled, closeModal]);

  const startVoice = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage(null);
    const result = await requestVoice();
    if (result.ok) {
      setVoiceEnabled(true);
      closeModal();
    } else {
      setErrorMessage(result.error ?? 'Something went wrong.');
      setStatus('error');
    }
  }, [requestVoice, setVoiceEnabled, closeModal]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeModalWithDisable}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.iconWrap}>
            <Ionicons name="mic" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Enable Voice Support</Text>
          <Text style={styles.subtitle}>
            Allow microphone access to stream your voice to MindMate for support. You can turn this off anytime.
          </Text>
          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={startVoice}
              disabled={status === 'requesting'}
              style={[styles.button, styles.primaryButton]}
            >
              {status === 'requesting' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Allow</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={closeModalWithDisable} style={styles.button} disabled={status === 'requesting'}>
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    maxWidth: 360,
    width: '100%',
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutralText,
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: Colors.secondary,
    fontSize: 16,
  },
});
