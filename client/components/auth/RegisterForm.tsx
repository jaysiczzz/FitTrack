import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Props {
  onSubmit: (data: { firstName: string; lastName: string; email: string; password: string }) => void;
}

const RegisterForm: React.FC<Props> = ({ onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => onSubmit({ firstName, lastName, email, password });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="First Name" placeholder="John" value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={styles.half}>
          <Input label="Last Name" placeholder="Doe" value={lastName} onChangeText={setLastName} />
        </View>
      </View>

      <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input label="Password" placeholder="" value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="Proceed" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '48%',
  } as ViewStyle,
});

export default RegisterForm;
