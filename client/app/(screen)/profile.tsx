import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateUserProfile } from '@/api/user';

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
  const isDark = useColorScheme() === 'dark';
  const placeholderColor = isDark ? '#8A93A6' : '#5C6478';

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

  const calendarDays = new Set([1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
  const partialDays = new Set([11]);

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

    const loadProfile = async () => {
      // 1. Instant render from local AsyncStorage
      try {
        const cachedUserStr = await AsyncStorage.getItem('user');
        if (cachedUserStr && isMounted) {
          const cachedUser = JSON.parse(cachedUserStr);
          applyUserData(cachedUser);
        }
      } catch (e) {}

      // 2. Fetch fresh user profile from API server
      try {
        const res = await getUserProfile();
        if (res.user && isMounted) {
          applyUserData(res.user);
          await AsyncStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch (err: any) {
        console.log('Profile fetch error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const value = w / (h * h);
    const category =
      value < 18.5 ? 'Underweight' : value < 25 ? 'Normal Weight' : value < 30 ? 'Overweight' : 'Obese';
    return `${value.toFixed(2)} – ${category}`;
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
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* User Card Header */}
        <View className="bg-surface dark:bg-surface-dark rounded-[18px] p-4 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark text-xl font-extrabold text-center">
            {firstName || 'User'} {lastName || ''}
          </Text>
          {email ? (
            <Text className="text-text-muted dark:text-text-muted-dark text-center text-xs mt-0.5">
              {email}
            </Text>
          ) : null}
          <Text className="text-text-muted dark:text-text-muted-dark text-center mt-1.5 text-xs font-medium">
            🎯 Goal: {goal === 'muscle' ? 'Muscle Gain' : 'Weight Loss'}
          </Text>

          <View className="flex-row justify-around mt-3 pt-3 border-t border-input-border/60 dark:border-input-border-dark/60">
            <View className="items-center">
              <Text className="text-accent dark:text-accent-dark text-lg font-extrabold">12</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Day Streak</Text>
            </View>
            <View className="items-center">
              <Text className="text-accent dark:text-accent-dark text-lg font-extrabold">4</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Workouts</Text>
            </View>
            <View className="items-center">
              <Text className="text-accent dark:text-accent-dark text-lg font-extrabold">4.2</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">kg lost</Text>
            </View>
          </View>
        </View>

        {/* Feedback Alert Message */}
        {message ? (
          <View
            className={`w-full rounded-xl p-3 mb-3 border ${
              message.type === 'error'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40'
            }`}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                message.type === 'error'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-accent dark:text-accent-dark'
              }`}
            >
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Personal Information Edit Form */}
        <View className="bg-surface dark:bg-surface-dark rounded-[18px] p-4 border border-input-border dark:border-input-border-dark mb-4">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-3">
            Personal Information
          </Text>

          <View className="flex-row justify-between">
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5 font-semibold uppercase">
                FIRST NAME
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-[12px] border border-input-border dark:border-input-border-dark"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5 font-semibold uppercase">
                LAST NAME
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-[12px] border border-input-border dark:border-input-border-dark"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5 font-semibold uppercase">
                HEIGHT (CM)
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-[12px] border border-input-border dark:border-input-border-dark"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="170"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5 font-semibold uppercase">
                WEIGHT (KG)
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-[12px] border border-input-border dark:border-input-border-dark"
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
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5 font-semibold uppercase">AGE</Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-[12px] border border-input-border dark:border-input-border-dark"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="flex-1 mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5 font-semibold uppercase">BMI</Text>
              <View className="bg-input dark:bg-input-dark p-3 rounded-[12px] border border-input-border dark:border-input-border-dark justify-center">
                <Text className="text-text-primary dark:text-text-primary-dark text-xs font-bold" numberOfLines={1}>
                  {bmi ?? 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-2 mt-3">
            Select Fitness Goal
          </Text>
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              activeOpacity={0.8}
              className={`flex-1 p-3 rounded-2xl mr-2.5 border items-center ${
                goal === 'muscle'
                  ? 'border-accent dark:border-accent-dark bg-accent/10 dark:bg-accent-dark/15'
                  : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
              }`}
              onPress={() => setGoal('muscle')}
            >
              <Text className="text-2xl">💪</Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold mt-1.5 text-xs">
                Muscle Gain
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center mt-0.5">Build lean muscle mass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className={`flex-1 p-3 rounded-2xl border items-center ${
                goal === 'loss'
                  ? 'border-accent dark:border-accent-dark bg-accent/10 dark:bg-accent-dark/15'
                  : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
              }`}
              onPress={() => setGoal('loss')}
            >
              <Text className="text-2xl">🔥</Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold mt-1.5 text-xs">
                Weight Loss
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center mt-0.5">Burn fat efficiently</Text>
            </TouchableOpacity>
          </View>

          {/* Form Action Buttons */}
          <View className="flex-row justify-between items-center gap-x-2 pt-2 border-t border-input-border/60 dark:border-input-border-dark/60">
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-transparent border border-input-border dark:border-input-border-dark py-3 px-4 rounded-xl flex-1 items-center"
              onPress={handleDiscard}
            >
              <Text className="text-text-muted dark:text-text-muted-dark font-semibold text-xs">Discard Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={saving}
              className="bg-accent dark:bg-accent-dark py-3 px-4 rounded-xl flex-1 items-center justify-center"
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Text className="text-background dark:text-background-dark font-bold text-xs">Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar & Tracker */}
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-2">
          Calendar & Tracker
        </Text>
        <View className="bg-surface dark:bg-surface-dark rounded-[14px] p-3 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark text-center font-bold mb-2">
            May 2026
          </Text>
          <View className="flex-row flex-wrap">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i + 1;
              const isToday = calendarDays.has(day);
              const isPartial = partialDays.has(day);
              const inMonth = day <= 31;
              return (
                <View
                  key={i}
                  className={`w-[14.28%] p-1.5 items-center justify-center ${!inMonth ? 'opacity-20' : ''}`}
                >
                  {inMonth ? (
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        isToday
                          ? 'bg-accent dark:bg-accent-dark'
                          : isPartial
                          ? 'bg-[#FFD166]'
                          : 'bg-input dark:bg-input-dark'
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          isToday || isPartial
                            ? 'text-background dark:text-background-dark'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View className="flex-row justify-around mt-2">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-accent dark:bg-accent-dark" />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Done</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-[#FFD166]" />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Partial</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-input dark:bg-input-dark" />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Rest</Text>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View className="bg-surface dark:bg-surface-dark rounded-xl p-3 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-2">
            Today's Schedule
          </Text>

          <View className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-[10px] bg-input dark:bg-input-dark items-center justify-center mr-2.5">
              <Text>🏃‍♂️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">Morning Run</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">7:00 AM · 30 min</Text>
            </View>
            <Text className="text-accent dark:text-accent-dark font-extrabold ml-2">✓</Text>
          </View>

          <View className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-[10px] bg-input dark:bg-input-dark items-center justify-center mr-2.5">
              <Text>💪</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">Upper Body</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">10:00 AM · 45 min</Text>
            </View>
            <Text className="text-accent dark:text-accent-dark font-extrabold ml-2">✓</Text>
          </View>

          <View className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-[10px] bg-input dark:bg-input-dark items-center justify-center mr-2.5">
              <Text>🧘</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">Evening Yoga</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">6:00 PM · 20 min</Text>
            </View>
            <TouchableOpacity className="bg-accent dark:bg-accent-dark px-2.5 py-1.5 rounded-lg">
              <Text className="text-background dark:text-background-dark font-bold text-xs">Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}