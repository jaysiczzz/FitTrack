import { Stack } from 'expo-router';
import { RegistrationProvider } from './_registrationContext';

export default function AuthLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistrationProvider>
  );
}