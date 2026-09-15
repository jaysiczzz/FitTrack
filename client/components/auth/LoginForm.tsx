import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ForgotPasswordLink from '@/components/auth/ForgotPasswordLink';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

interface Props {
  onSubmit: (data: { email: string; password: string }) => void;
  loading?: boolean;
  serverError?: string;
  onError?: (error: string) => void;
  onClearError?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginForm: React.FC<Props> = ({
  onSubmit,
  loading,
  serverError,
  onError,
  onClearError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Sync server error to highlight the specific failing field
  useEffect(() => {
    if (!serverError) {
      setEmailError('');
      setPasswordError('');
      return;
    }
    const lower = serverError.toLowerCase();
    if (lower.includes('email') || lower.includes('account')) {
      setEmailError(serverError);
      setPasswordError('');
    } else if (lower.includes('password')) {
      setPasswordError(serverError);
      setEmailError('');
    }
  }, [serverError]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
      if (onClearError) onClearError();
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError('');
      if (onClearError) onClearError();
    }
  };

  const handleSubmit = () => {
    let valid = true;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      if (onError) onError('Email is required');
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      if (onError) onError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      if (valid && onError) onError('Password is required');
      valid = false;
    }

    if (valid) {
      if (onClearError) onClearError();
      onSubmit({ email: trimmedEmail, password });
    }
  };

  return (
    <View className="w-full mt-2">
      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={emailError}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
      />
      <Input
        ref={passwordRef}
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={handlePasswordChange}
        isPassword
        autoCapitalize="none"
        error={passwordError}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <Button title="Log In" onPress={handleSubmit} loading={loading} />
      <ForgotPasswordLink onPress={() => setIsForgotModalOpen(true)} />

      <ForgotPasswordModal
        visible={isForgotModalOpen}
        initialEmail={email}
        onClose={() => setIsForgotModalOpen(false)}
        onSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword('');
          setEmailError('');
          setPasswordError('');
        }}
      />
    </View>
  );
};

export default LoginForm;