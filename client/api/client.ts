import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../api/auth';

const handleLogin = async () => {
  try {
    const data = await loginUser({ email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));

  } catch (err: any) {
    setError(err.message);
  }
};