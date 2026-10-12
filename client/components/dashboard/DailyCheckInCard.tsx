import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authStorage } from '../../utils/authStorage';
import { useThemeColors } from '../../constants/colors';
import SurfaceCard from '../ui/SurfaceCard';
import {
  getTodayCheckInApi,
  saveCheckInApi,
  getCheckInStreakApi,
  deleteTodayCheckInApi,
  CheckInStreakStats,
} from '../../api/checkin';

export interface MoodOption {
  id: 'fire' | 'strong' | 'good' | 'tired' | 'rest';
  emoji: string;
  label: string;
  coachTip: string;
  color: string;
}

export const MOODS: MoodOption[] = [
  {
    id: 'fire',
    emoji: '⚡',
    label: 'Energized',
    coachTip: 'Channel that high energy into progressive overload and pushing your top sets today.',
    color: '#F59E0B',
  },
  {
    id: 'strong',
    emoji: '💪',
    label: 'Strong',
    coachTip: 'Focus on strict exercise form and hitting your target repetitions with confidence.',
    color: '#10B981',
  },
  {
    id: 'good',
    emoji: '😊',
    label: 'Balanced',
    coachTip: 'Consistency builds champions. A steady, focused workout maintains your momentum.',
    color: '#38BDF8',
  },
  {
    id: 'tired',
    emoji: '😴',
    label: 'Low Energy',
    coachTip: 'Take a longer dynamic warmup and stay well hydrated. Showing up is already half the battle.',
    color: '#818CF8',
  },
  {
    id: 'rest',
    emoji: '🧘',
    label: 'Recovery',
    coachTip: 'Focus on mobility, light stretching, foam rolling, and nutrient-dense recovery meals.',
    color: '#A855F7',
  },
];

const MOTIVATION_QUOTES = [
  { quote: 'The resistance you fight physically in the gym builds the character you need in life.', author: 'Arnold Schwarzenegger' },
  { quote: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { quote: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { quote: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { quote: 'Don’t count the days, make the days count.', author: 'Muhammad Ali' },
  { quote: 'Only the disciplined ones in life are truly free.', author: 'Eliud Kipchoge' },
  { quote: 'What stands in the way becomes the way.', author: 'Marcus Aurelius' },
];

interface DailyCheckInCardProps {
  onCheckInCompleted?: (mood: MoodOption) => void;
}

export default function DailyCheckInCard({ onCheckInCompleted }: DailyCheckInCardProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast, showSuccess } = useToast();
  const { colors } = useThemeColors();

  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const quoteIndex = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return Math.abs(dayOfYear) % MOTIVATION_QUOTES.length;
  }, []);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);

  // Streak state
  const [streakStats, setStreakStats] = useState<CheckInStreakStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalCheckIns: 0,
    todayCheckedIn: false,
  });

  const getTodayDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayKey = getTodayDateKey();

  // Load check-in state, streak, and recent history
  const loadCheckInData = useCallback(async () => {
    if (!userId) return;

    // 1. Load local cache first for instant UI response
    try {
      const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
      const streakKey = authStorage.getScopedKey(userId, 'daily_checkin_streak_cache');
      const [savedLocalCheckin, savedLocalStreak] = await Promise.all([
        AsyncStorage.getItem(checkinKey),
        AsyncStorage.getItem(streakKey),
      ]);

      if (savedLocalCheckin) {
        const parsed = JSON.parse(savedLocalCheckin);
        setSelectedMoodId(parsed.moodId);
        setIsCheckedIn(true);
        if (parsed.notes) setNotes(parsed.notes);
      }

      if (savedLocalStreak) {
        const parsedStreak = JSON.parse(savedLocalStreak);
        setStreakStats(parsedStreak);
      }
    } catch (e) {
      console.log('Error reading local check-in cache:', e);
    }

    // 2. Fetch fresh data from backend
    try {
      const [todayRes, streakRes] = await Promise.all([
        getTodayCheckInApi(todayKey).catch(() => null),
        getCheckInStreakApi(todayKey).catch(() => null),
      ]);

      if (todayRes?.success && todayRes.checkIn) {
        setSelectedMoodId(todayRes.checkIn.moodId);
        setIsCheckedIn(true);
        if (todayRes.checkIn.notes) setNotes(todayRes.checkIn.notes);

        // Cache locally
        const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
        await AsyncStorage.setItem(
          checkinKey,
          JSON.stringify({
            date: todayKey,
            moodId: todayRes.checkIn.moodId,
            moodLabel: todayRes.checkIn.moodLabel,
            notes: todayRes.checkIn.notes || '',
            timestamp: todayRes.checkIn.createdAt,
          })
        );
      }

      if (streakRes?.success) {
        const newStreak: CheckInStreakStats = {
          currentStreak: streakRes.currentStreak,
          bestStreak: streakRes.bestStreak,
          totalCheckIns: streakRes.totalCheckIns,
          todayCheckedIn: streakRes.todayCheckedIn,
          todayCheckIn: streakRes.todayCheckIn,
        };
        setStreakStats(newStreak);
        const streakKey = authStorage.getScopedKey(userId, 'daily_checkin_streak_cache');
        await AsyncStorage.setItem(streakKey, JSON.stringify(newStreak));
      }
    } catch (err) {
      console.log('Error synchronizing check-in with server:', err);
    }
  }, [userId, todayKey]);

  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  const handleSelectMood = async (mood: MoodOption) => {
    setSelectedMoodId(mood.id);
    setIsCheckedIn(true);
    setIsSavingMood(true);

    const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
    const lastCheckinKey = authStorage.getScopedKey(userId, 'last_checkin_date');

    const localData = {
      date: todayKey,
      moodId: mood.id,
      moodLabel: mood.label,
      coachTip: mood.coachTip,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };

    // Save locally
    try {
      await AsyncStorage.setItem(checkinKey, JSON.stringify(localData));
      await AsyncStorage.setItem(lastCheckinKey, todayKey);
    } catch (e) {
      console.log('Error caching check-in locally:', e);
    }

    // Call Backend API
    try {
      const res = await saveCheckInApi({
        date: todayKey,
        moodId: mood.id,
        moodLabel: mood.label,
        coachTip: mood.coachTip,
        quote: MOTIVATION_QUOTES[quoteIndex].quote,
        quoteAuthor: MOTIVATION_QUOTES[quoteIndex].author,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.streak) {
        setStreakStats(res.streak);
        const streakKey = authStorage.getScopedKey(userId, 'daily_checkin_streak_cache');
        await AsyncStorage.setItem(streakKey, JSON.stringify(res.streak));
      }
    } catch (err: any) {
      console.log('Error saving check-in to backend:', err);
    } finally {
      setIsSavingMood(false);
    }

    showToast({
      message: `${mood.emoji} Check-In Complete!`,
      description: mood.coachTip,
      type: 'success',
      icon: '✓',
    });

    DeviceEventEmitter.emit('DAILY_CHECKIN_UPDATED', {
      date: todayKey,
      moodId: mood.id,
      moodLabel: mood.label,
      isCheckedIn: true,
    });

    if (onCheckInCompleted) {
      onCheckInCompleted(mood);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedMood) return;
    setSavingNote(true);

    try {
      const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
      const saved = await AsyncStorage.getItem(checkinKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.notes = notes.trim();
        await AsyncStorage.setItem(checkinKey, JSON.stringify(parsed));
      }

      await saveCheckInApi({
        date: todayKey,
        moodId: selectedMood.id,
        moodLabel: selectedMood.label,
        coachTip: selectedMood.coachTip,
        quote: MOTIVATION_QUOTES[quoteIndex].quote,
        quoteAuthor: MOTIVATION_QUOTES[quoteIndex].author,
        notes: notes.trim() || undefined,
      });

      DeviceEventEmitter.emit('DAILY_CHECKIN_UPDATED', {
        date: todayKey,
        notes: notes.trim(),
        isCheckedIn: true,
      });

      showSuccess('Reflection Saved', 'Your morning check-in note was updated.');
      setShowNotesInput(false);
    } catch (err) {
      console.log('Error updating note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleResetCheckIn = async () => {
    setIsCheckedIn(false);
    setSelectedMoodId(null);
    setNotes('');
    setShowNotesInput(false);

    try {
      const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
      await AsyncStorage.removeItem(checkinKey);
      await deleteTodayCheckInApi(todayKey).catch(() => {});

      // Refresh streak
      const streakRes = await getCheckInStreakApi(todayKey).catch(() => null);
      if (streakRes?.success) {
        setStreakStats({
          currentStreak: streakRes.currentStreak,
          bestStreak: streakRes.bestStreak,
          totalCheckIns: streakRes.totalCheckIns,
          todayCheckedIn: false,
        });
      }

      DeviceEventEmitter.emit('DAILY_CHECKIN_UPDATED', {
        date: todayKey,
        moodId: null,
        isCheckedIn: false,
      });
    } catch (e) {
      console.log('Error clearing check-in:', e);
    }
  };

  const currentQuote = MOTIVATION_QUOTES[quoteIndex];
  const selectedMood = MOODS.find((m) => m.id === selectedMoodId);

  return (
    <SurfaceCard className="mb-3">
      {/* Header Row: Title & Streaks */}
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
              Daily Readiness
            </Text>
          </View>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            {isCheckedIn && selectedMood
              ? `Today's Energy: ${selectedMood.label}`
              : 'How is your energy and readiness today?'}
          </Text>
        </View>

        {/* Toggle / Edit Action */}
        <View className="flex-row items-center gap-1.5">
          {isCheckedIn ? (
            <TouchableOpacity
              onPress={() => setIsCheckedIn(false)}
              activeOpacity={0.7}
              className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center"
            >
              <Ionicons name="checkmark" size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text className="text-accent dark:text-accent-dark font-bold text-[10px] uppercase tracking-wider">
                Edit
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Mood Selector Buttons */}
      {!isCheckedIn ? (
        <View className="mb-2">
          <View className="flex-row justify-between gap-1.5 mb-2">
            {MOODS.map((mood) => {
              const isSelected = selectedMoodId === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  activeOpacity={0.8}
                  disabled={isSavingMood}
                  onPress={() => handleSelectMood(mood)}
                  className={`flex-1 py-1.5 px-0.5 rounded-xl items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark shadow-xs'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text className="text-base mb-0.5">{mood.emoji}</Text>
                  <Text
                    className={`text-[10px] font-bold text-center leading-tight ${
                      isSelected
                        ? 'text-accent dark:text-accent-dark'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : selectedMood ? (
        /* Checked-In Active Recommendation Box */
        <View className="bg-input dark:bg-input-dark rounded-2xl p-3.5 mb-2.5 border border-input-border dark:border-input-border-dark">
          <View className="flex-row items-start mb-2">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 border"
              style={{
                backgroundColor: `${selectedMood.color}15`,
                borderColor: `${selectedMood.color}30`,
              }}
            >
              <Text className="text-2xl">{selectedMood.emoji}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-primary dark:text-text-primary-dark font-black text-xs">
                  Today's Focus: {selectedMood.label}
                </Text>
                <TouchableOpacity
                  onPress={handleResetCheckIn}
                  className="px-2 py-0.5 rounded-md bg-danger/10 border border-danger/20"
                >
                  <Text className="text-[10px] font-bold text-danger dark:text-danger-dark">
                    Reset
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs leading-4 mt-1">
                {selectedMood.coachTip}
              </Text>
            </View>
          </View>

          {/* Optional Reflection Note Section */}
          {showNotesInput ? (
            <View className="mt-2 pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional: How did you sleep? Any soreness?"
                placeholderTextColor={colors.textMuted}
                maxLength={200}
                className="bg-surface dark:bg-surface-dark p-2 rounded-xl text-text-primary dark:text-text-primary-dark text-xs border border-input-border dark:border-input-border-dark mb-2"
              />
              <View className="flex-row justify-end gap-2">
                <TouchableOpacity
                  onPress={() => setShowNotesInput(false)}
                  className="px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveNote}
                  disabled={savingNote}
                  className="px-3 py-1 rounded-lg bg-accent dark:bg-accent-dark flex-row items-center"
                >
                  {savingNote ? (
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-1" />
                  ) : null}
                  <Text className="text-[10px] font-bold text-white">
                    Save Note
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : notes ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowNotesInput(true)}
              className="mt-2 pt-2 border-t border-input-border/50 dark:border-input-border-dark/50 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="create-outline" size={13} color={colors.accent} style={{ marginRight: 5 }} />
                <Text
                  className="text-xs italic text-text-primary dark:text-text-primary-dark"
                  numberOfLines={1}
                >
                  "{notes}"
                </Text>
              </View>
              <Text className="text-[10px] text-accent dark:text-accent-dark font-bold">Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowNotesInput(true)}
              className="mt-1 pt-1.5 border-t border-input-border/40 dark:border-input-border-dark/40 flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                Add morning reflection note...
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Motivational Fitness Quote */}
      <View className="pt-2 border-t border-input-border dark:border-input-border-dark flex-row items-center">
        <View className="flex-1">
          <Text className="text-text-primary dark:text-text-primary-dark text-xs italic font-medium leading-snug">
            “{currentQuote.quote}”
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mt-0.5">
            — {currentQuote.author}
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}
