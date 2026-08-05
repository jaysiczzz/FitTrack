import React, { useState } from 'react';
import { View } from 'react-native';
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
    <View className="w-full">
      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Input label="First Name" placeholder="John" value={firstName} onChangeText={setFirstName} />
        </View>
        <View className="w-[48%]">
          <Input label="Last Name" placeholder="Doe" value={lastName} onChangeText={setLastName} />
        </View>
      </View>

      <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input label="Password" placeholder="" value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="Proceed" onPress={handleSubmit} />
    </View>
  );
};

export default RegisterForm;