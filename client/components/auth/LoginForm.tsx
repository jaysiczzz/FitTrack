import React, { useState, useRef } from 'react';
import { View, TextInput } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ForgotPasswordLink from '@/components/auth/ForgotPasswordLink';

interface Props {
  onSubmit: (data: { email: string; password: string }) => void;
  loading?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = () => {
    let valid = true;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }

    if (valid) {
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
      <ForgotPasswordLink onPress={() => {}} />
    </View>
  );
};

export default LoginForm;