import React, { useState, useRef } from 'react';
import { View, TextInput } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordRequirements from '@/components/ui/PasswordRequirements';
import { validatePasswordStrength } from '@/utils/passwordValidation';
import { checkEmailApi } from '@/api/auth';

interface Props {
  onSubmit: (data: { firstName: string; lastName: string; email: string; password: string }) => void;
  loading?: boolean;
  onError?: (error: string) => void;
  onClearError?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterForm: React.FC<Props> = ({ onSubmit, loading, onError, onClearError }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    let valid = true;
    let firstError = '';

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      if (!firstError) firstError = 'First name is required';
      valid = false;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      if (!firstError) firstError = 'Last name is required';
      valid = false;
    } else {
      setLastNameError('');
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      if (!firstError) firstError = 'Email is required';
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      if (!firstError) firstError = 'Please enter a valid email address';
      valid = false;
    } else {
      const domain = trimmedEmail.split('@')[1]?.toLowerCase();
      const typoSuggestions: Record<string, string> = {
        'gamil.com': 'gmail.com',
        'gmaill.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'yaho.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'iclud.com': 'icloud.com',
      };
      if (domain && typoSuggestions[domain]) {
        const typoMsg = `Did you mean @${typoSuggestions[domain]}?`;
        setEmailError(typoMsg);
        if (!firstError) firstError = typoMsg;
        valid = false;
      } else {
        setEmailError('');
      }
    }

    if (!password) {
      setPasswordError('Password is required');
      if (!firstError) firstError = 'Password is required';
      valid = false;
    } else {
      const pwdCheck = validatePasswordStrength(password);
      if (!pwdCheck.valid) {
        const pwdMsg = pwdCheck.error || 'Password does not meet security requirements';
        setPasswordError(pwdMsg);
        if (!firstError) firstError = pwdMsg;
        valid = false;
      } else {
        setPasswordError('');
      }
    }

    if (!valid) {
      if (firstError && onError) onError(firstError);
      return;
    }

    if (onClearError) onClearError();
    setCheckingEmail(true);
    try {
      await checkEmailApi(trimmedEmail);
      onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        password,
      });
    } catch (err: any) {
      const msg = err.message || 'An account with this email already exists. Please log in.';
      setEmailError(msg);
      if (onError) onError(msg);
    } finally {
      setCheckingEmail(false);
    }
  };

  return (
    <View className="w-full">
      <View className="flex-row gap-2.5 w-full">
        <View className="flex-1">
          <Input
            className="w-full"
            label="First Name"
            placeholder="John"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (firstNameError) {
                setFirstNameError('');
                if (onClearError) onClearError();
              }
            }}
            autoCapitalize="words"
            error={firstNameError}
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        <View className="flex-1">
          <Input
            className="w-full"
            ref={lastNameRef}
            label="Last Name"
            placeholder="Doe"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (lastNameError) {
                setLastNameError('');
                if (onClearError) onClearError();
              }
            }}
            autoCapitalize="words"
            error={lastNameError}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
      </View>

      <Input
        ref={emailRef}
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) {
            setEmailError('');
            if (onClearError) onClearError();
          }
        }}
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
        placeholder="Min 8 chars, uppercase, number, symbol"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) {
            setPasswordError('');
            if (onClearError) onClearError();
          }
        }}
        isPassword
        autoCapitalize="none"
        error={passwordError}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      <PasswordRequirements password={password} />

      <Button title="Proceed" onPress={handleSubmit} loading={loading || checkingEmail} />
    </View>
  );
};

export default RegisterForm;