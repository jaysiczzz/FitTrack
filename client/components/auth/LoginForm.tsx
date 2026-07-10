import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ForgotPasswordLink from '@/components/auth/ForgotPasswordLink';

interface Props {
  onSubmit: (data: { email: string; password: string }) => void;
}

const LoginForm: React.FC<Props> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => onSubmit({ email, password });

  return (
    <View style={styles.container}>
      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input
        label="Password"
        placeholder=""
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Log In" onPress={handleSubmit} />
      <ForgotPasswordLink onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
});

export default LoginForm;
