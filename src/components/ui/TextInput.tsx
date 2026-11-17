// src/components/ui/TextInput.tsx

import { COLORS, RADIUS, SPACING } from '@/constants/theme';
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
  editable?: RNTextInputProps['editable'];
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
  editable,
}: TextInputProps) {
  const [focus, setFocus] = useState(false);

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.container, 
        focus && styles.containerFocus, 
        !!error && styles.containerError
      ]}>
        <RNTextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.t3}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          maxLength={maxLength}
          inputMode={inputMode}
          textContentType={textContentType}
          editable={editable}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {right && <View style={styles.rightContent}>{right}</View>}
      </View>

      {(error || hint) && (
        <Text style={[styles.hint, !!error && styles.hintError]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { 
    marginBottom: SPACING.s4 
  },
  label: { 
    fontSize: 14, 
    color: COLORS.t1, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.line, // Default gray
    borderRadius: RADIUS.lg,
    height: 56, // Taller for a premium feel
    paddingHorizontal: 16,
  },
  containerFocus: { 
    borderColor: COLORS.accent // Purple when focused
  },
  containerError: { 
    borderColor: COLORS.danger // Red when error
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.t1,
    fontWeight: '500',
  },
  rightContent: {
    marginLeft: 8,
  },
  hint: { 
    marginTop: 8, 
    fontSize: 12, 
    color: COLORS.t2,
    fontWeight: '500',
  },
  hintError: { 
    color: COLORS.danger 
  },
});