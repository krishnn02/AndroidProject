import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../../theme';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';

interface SafetyModalProps {
  visible: boolean;
  title: string;
  description: string;
  expectedText: string;
  placeholder?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({
  visible,
  title,
  description,
  expectedText,
  placeholder = 'Type here...',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}) => {
  const [inputText, setInputText] = useState('');

  // Clear text on opening/closing
  useEffect(() => {
    if (visible) {
      setInputText('');
    }
  }, [visible]);

  const isValid = inputText.trim().toLowerCase() === expectedText.trim().toLowerCase();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Card style={styles.modalCard}>
            <View style={styles.header}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning-outline" size={32} color={colors.error} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.instructionContainer}>
                <Text style={styles.instructionLabel}>
                  To confirm, type: <Text style={styles.keyword}>"{expectedText}"</Text>
                </Text>
              </View>

              <Input
                placeholder={placeholder}
                value={inputText}
                onChangeText={setInputText}
                autoCapitalize="none"
                autoCorrect={false}
                error={inputText.length > 0 && !isValid ? 'Text does not match confirmation keyword' : undefined}
              />

              <View style={styles.actions}>
                <Button
                  title={cancelText}
                  variant="outline"
                  onPress={onCancel}
                  style={styles.btn}
                />
                <Button
                  title={confirmText}
                  onPress={onConfirm}
                  loading={isConfirming}
                  disabled={!isValid}
                  style={[styles.btn, { backgroundColor: isValid ? colors.error : colors.border }]}
                />
              </View>
            </ScrollView>
          </Card>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.error + '40',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  scroll: {
    maxHeight: 350,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  instructionContainer: {
    backgroundColor: colors.bgInput,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  keyword: {
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
