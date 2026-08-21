import React, { useState } from 'react';
import { View } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Props {
  onSubmit: (data: { firstName: string; lastName: string; email: string; password: string }) => void;
  loading?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = () => {
    let valid = true;

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      valid = false;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      valid = false;
    } else {
      setLastNameError('');
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (valid) {
      onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        password,
      });
    }
  };

  return (
    <View className="w-full">
      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Input
            label="First Name"
            placeholder="John"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (firstNameError) setFirstNameError('');
            }}
            autoCapitalize="words"
            error={firstNameError}
          />
        </View>
        <View className="w-[48%]">
          <Input
            label="Last Name"
            placeholder="Doe"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (lastNameError) setLastNameError('');
            }}
            autoCapitalize="words"
            error={lastNameError}
          />
        </View>
      </View>

      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) setEmailError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={emailError}
      />
      <Input
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError('');
        }}
        isPassword
        autoCapitalize="none"
        error={passwordError}
      />

      <Button title="Proceed" onPress={handleSubmit} loading={loading} />
    </View>
  );
};

export default RegisterForm;