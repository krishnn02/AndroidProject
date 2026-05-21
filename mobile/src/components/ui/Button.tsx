import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style, textStyle,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<string, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: fontSize.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: fontSize.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: fontSize.lg },
  };

  const s = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8} style={style}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal, opacity: isDisabled ? 0.5 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, { bg: ViewStyle; text: TextStyle }> = {
    secondary: {
      bg: { backgroundColor: colors.bgElevated },
      text: { color: colors.text },
    },
    outline: {
      bg: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
      text: { color: colors.primary },
    },
    ghost: {
      bg: { backgroundColor: 'transparent' },
      text: { color: colors.primary },
    },
  };

  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[styles.base, vs.bg, { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal, opacity: isDisabled ? 0.5 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, vs.text, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  text: {
    color: '#fff',
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
});
