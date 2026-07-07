import { useState } from 'react'
import {
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Colors } from '@/constants/colors'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthTabs from '@/components/auth/AuthTabs'
import AuthHeader from '@/components/auth/AuthHeader'

const LoginScreen = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = () => {
    console.log({ mode, email, password })
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader />

        <AuthTabs active={mode} onChange={setMode} />

        <Input
          label="EMAIL"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          label="PASSWORD"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={mode === 'login' ? 'Log In' : 'Register'}
          onPress={handleSubmit}
        />

        {mode === 'login' && (
          <Pressable style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>
              Forgot password? <Text style={styles.resetLink}>Reset</Text>
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  forgotWrapper: {
    marginTop: 18,
    alignItems: 'center',
  },
  forgotText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  resetLink: {
    color: Colors.accent,
    fontWeight: '600',
  },
})