import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface InputProps extends TextInputProps {
  label: string
}

const Input = ({ label, style, ...props }: InputProps) => {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#5C6370"
        {...props}
      />
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
  group: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
})