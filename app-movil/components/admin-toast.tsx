/**
 * AdminToast — componente reutilizable de notificación tipo "toast"
 * Aparece con animación suave desde la parte inferior y desaparece después de un tiempo.
 * type: 'success' | 'error' | 'info'
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';

type ToastType = 'success' | 'error' | 'info';

type Props = {
  message: string;
  type?: ToastType;
  visible: boolean;
};

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

const COLORS: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: '#fffbf7', icon: '#d4956a', border: '#f0e6df' },
  error:   { bg: '#fff5f5', icon: '#e07070', border: '#fcdada' },
  info:    { bg: '#f7fafc', icon: '#192847', border: '#e2e8f0' },
};

export default function AdminToast({ message, type = 'success', visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -40, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const colors = COLORS[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { backgroundColor: colors.bg, borderColor: colors.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={ICONS[type]} size={20} color={colors.icon} />
      <ThemedText style={[styles.text, { color: colors.icon }]}>{message}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 999,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
