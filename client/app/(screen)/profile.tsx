import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, updateUserProfile } from '@/api/user';
import { useAuth } from '@/context/AuthContext';
import { COLORS, useThemeColors } from '@/constants/colors';
import SurfaceCard from '@/components/ui/SurfaceCard';

interface UserData {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  height?: number;
  weight?: number;
  age?: number;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
}

export default function Profile() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuth();
  const { colors, isDark } = useThemeColors();
  const placeholderColor = colors.textMuted;

  const [savedUser, setSavedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'loss'>('muscle');

  const applyUserData = (u: UserData) => {
    setSavedUser(u);
    if (u.firstName) setFirstName(u.firstName);
    if (u.lastName) setLastName(u.lastName);
    if (u.email) setEmail(u.email);
    if (u.height !== undefined) setHeight(String(u.height));
    if (u.weight !== undefined) setWeight(String(u.weight));
    if (u.age !== undefined) setAge(String(u.age));
    if (u.goal) {
      setGoal(u.goal === 'MUSCLE_GAIN' ? 'muscle' : 'loss');
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (authUser) {
      applyUserData(authUser);
    }
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getUserProfile();
        if (res.user && isMounted) {
          applyUserData(res.user);
          await updateUser(res.user);
        }
      } catch (err) {
        console.log('Error fetching user profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const value = w / (h * h);
    const category =
      value < 18.5 ? 'Underweight' : value < 25 ? 'Normal' : value < 30 ? 'Overweight' : 'Obese';
    return `${value.toFixed(1)} (${category})`;
  }, [height, weight]);

  const handleDiscard = () => {
    if (savedUser) {
      applyUserData(savedUser);
      setMessage(null);
    }
  };

  const handleSave = async () => {
    setMessage(null);

    const hNum = Number(height);
    const wNum = Number(weight);
    const aNum = Number(age);

    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: 'error', text: 'First and last names are required.' });
      return;
    }
    if (isNaN(hNum) || hNum <= 0 || hNum > 300) {
      setMessage({ type: 'error', text: 'Please enter a valid height between 1 and 300 cm.' });
      return;
    }
    if (isNaN(wNum) || wNum <= 0 || wNum > 500) {
      setMessage({ type: 'error', text: 'Please enter a valid weight between 1 and 500 kg.' });
      return;
    }
    if (isNaN(aNum) || aNum <= 0 || aNum > 120) {
      setMessage({ type: 'error', text: 'Please enter a valid age between 1 and 120.' });
      return;
    }

    try {
      setSaving(true);
      const mappedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' = goal === 'muscle' ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS';

      const res = await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        height: hNum,
        weight: wNum,
        age: aNum,
        goal: mappedGoal,
      });

      if (res.user) {
        applyUserData(res.user);
        await updateUser(res.user);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}>
        {/* User Card Header */}
        <SurfaceCard className="mb-3">
          <View className="flex-row justify-between items-start mb-3">
            <View className="w-8" />
            <View className="flex-1 items-center">
              <View className="w-16 h-16 rounded-full bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-2 border border-accent/30">
                <Text className="text-accent dark:text-accent-dark font-black text-xl">
                  {((firstName?.[0] || 'U') + (lastName?.[0] || '')).toUpperCase()}
                </Text>
              </View>
              <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-black tracking-tight text-center">
                {firstName || 'User'} {lastName || ''}
              </Text>
              {email ? (
                <Text className="text-text-muted dark:text-text-muted-dark text-center text-xs mt-0.5 font-normal">
                  {email}
                </Text>
              ) : null}
              <View className="mt-2.5 bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                <Text className="text-accent dark:text-accent-dark text-[10px] font-bold uppercase tracking-wider">
                  {goal === 'muscle' ? 'Muscle Gain' : 'Weight Loss'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(screen)/settings' as any)}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark"
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Stats Row: Uppercase labels & heavy numbers */}
          <View className="flex-row justify-around pt-3.5 border-t border-input-border dark:border-input-border-dark">
            <View className="items-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-1">
                HEIGHT
              </Text>
              <Text className="text-text-primary dark:text-text-primary-dark text-xl font-black">
                {height ? `${height} cm` : '—'}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-1">
                WEIGHT
              </Text>
              <Text className="text-text-primary dark:text-text-primary-dark text-xl font-black">
                {weight ? `${weight} kg` : '—'}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-1">
                BMI
              </Text>
              <Text className="text-text-primary dark:text-text-primary-dark text-xl font-black">
                {bmi ? bmi.split(' ')[0] : '—'}
              </Text>
            </View>
          </View>
        </SurfaceCard>

        {/* Feedback Alert Message */}
        {message ? (
          <View
            className={`w-full rounded-2xl p-3 mb-3 border ${
              message.type === 'error'
                ? 'bg-danger/10 border-danger/30'
                : 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30'
            }`}
          >
            <Text
              className={`text-xs font-bold text-center ${
                message.type === 'error'
                  ? 'text-danger dark:text-danger-dark'
                  : 'text-accent dark:text-accent-dark'
              }`}
            >
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Personal Information Edit Form */}
        <SurfaceCard className="mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm mb-3">
            Personal Information
          </Text>

          <View className="flex-row justify-between">
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                FIRST NAME
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm font-medium"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                LAST NAME
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm font-medium"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                HEIGHT (CM)
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm font-medium"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="170"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                WEIGHT (KG)
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm font-medium"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1 mb-3 mr-2">
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                AGE
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm font-medium"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="flex-1 mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                BMI
              </Text>
              <View className="bg-input dark:bg-input-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark justify-center min-h-[46px]">
                <Text className="text-text-primary dark:text-text-primary-dark text-sm font-bold" numberOfLines={1}>
                  {bmi ?? 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase tracking-wider mb-2 mt-2">
            FITNESS GOAL
          </Text>
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              activeOpacity={0.8}
              className={`flex-1 p-3.5 rounded-2xl mr-2.5 border items-center ${
                goal === 'muscle'
                  ? 'border-accent dark:border-accent-dark bg-accent/15 dark:bg-accent-dark/20'
                  : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
              }`}
              onPress={() => setGoal('muscle')}
            >
              <Text
                className={`font-bold text-xs ${
                  goal === 'muscle'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                Muscle Gain
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center mt-0.5">
                Build lean muscle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className={`flex-1 p-3.5 rounded-2xl border items-center ${
                goal === 'loss'
                  ? 'border-accent dark:border-accent-dark bg-accent/15 dark:bg-accent-dark/20'
                  : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
              }`}
              onPress={() => setGoal('loss')}
            >
              <Text
                className={`font-bold text-xs ${
                  goal === 'loss'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                Weight Loss
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center mt-0.5">
                Burn fat efficiently
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between items-center gap-x-2.5 pt-3 border-t border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-transparent border border-input-border dark:border-input-border-dark py-3 px-4 rounded-xl flex-1 items-center"
              onPress={handleDiscard}
            >
              <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={saving}
              className="bg-accent dark:bg-accent-dark py-3 px-4 rounded-xl flex-1 items-center justify-center"
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white font-bold text-xs">Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </SurfaceCard>

        {/* Account & App Settings Shortcut Card */}
        <TouchableOpacity
          onPress={() => router.push('/(screen)/settings' as any)}
          activeOpacity={0.75}
        >
          <SurfaceCard className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                Account & App Settings
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
                Preferences, theme, and security
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </SurfaceCard>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}