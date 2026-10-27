// src/components/ui/TextInput.tsx

import { COLORS, SPACING } from '@/constants/theme';
import { useState, type ReactNode } from 'react';
import type { TextInputProps as RNTextInputProps } from 'react-native';
import { TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';

interface TextInputProps {
  label?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  hint?: string;
  right?: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: RNTextInputProps['keyboardType'];
  autoCapitalize?: RNTextInputProps['autoCapitalize'];
  autoFocus?: boolean;
  maxLength?: number;
  inputMode?: RNTextInputProps['inputMode'];
  textContentType?: RNTextInputProps['textContentType'];
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  right,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoFocus,
  maxLength,
  inputMode,
  textContentType,
}: TextInputProps) {
  const [focus, setFocus] = useState(false);

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, focus && styles.rowFocus, !!error && styles.rowError]}>
        <RNTextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#C4C7CC"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          maxLength={maxLength}
          inputMode={inputMode}
          textContentType={textContentType}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {right}
      </View>
      {(error || hint) && (
        <Text style={[styles.hint, !!error && styles.hintError]}>{error || hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: SPACING.s4 },
  label: { fontSize: 13, color: COLORS.t2, fontWeight: '500', marginBottom: SPACING.s1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  rowFocus: { borderBottomColor: COLORS.t1 },
  rowError: { borderBottomColor: COLORS.down },
  input: {
    flex: 1,
    height: 48,
    fontSize: 17,
    color: COLORS.t1,
    letterSpacing: -0.17,
  },
  hint: { marginTop: 6, fontSize: 12, color: COLORS.t3 },
  hintError: { color: COLORS.down },
});