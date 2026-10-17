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
  const { colors, isDark } = useThemeColors();

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
  const [isEditingMood, setIsEditingMood] = useState(false);

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
    setIsEditingMood(false);
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
      duration: 4000,
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
    setIsEditingMood(false);
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
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <Text
              className="text-text-primary dark:text-text-primary-dark font-black text-sm"
              style={{ color: colors.textPrimary }}
            >
              Daily Readiness
            </Text>
          </View>
          <Text
            className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5"
            style={{ color: colors.textMuted }}
          >
            {isCheckedIn && selectedMood && !isEditingMood
              ? `Logged for today • ${selectedMood.label}`
              : isEditingMood
              ? 'Select your updated readiness'
              : 'How are you feeling today?'}
          </Text>
        </View>

        {/* Right Actions: Change/Cancel button */}
        <View className="flex-row items-center gap-1.5">
          {isCheckedIn ? (
            isEditingMood ? (
              <TouchableOpacity
                onPress={() => setIsEditingMood(false)}
                activeOpacity={0.7}
                className="px-2.5 py-1 rounded-full flex-row items-center"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
                }}
              >
                <Ionicons name="close" size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                <Text
                  className="font-bold text-[10px] uppercase tracking-wider"
                  style={{ color: colors.textMuted }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingMood(true)}
                activeOpacity={0.7}
                className="px-2.5 py-1 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark ? '#10B98120' : '#04785715',
                  borderColor: isDark ? '#10B98150' : '#04785740',
                  borderWidth: 1,
                }}
              >
                <Ionicons name="pencil" size={10} color={colors.accent} style={{ marginRight: 3 }} />
                <Text
                  className="font-bold text-[10px] uppercase tracking-wider"
                  style={{ color: colors.accent }}
                >
                  Change
                </Text>
              </TouchableOpacity>
            )
          ) : null}
        </View>
      </View>

      {/* Mood Selector Buttons: 5 items in a single responsive row */}
      {!isCheckedIn || isEditingMood ? (
        <View className="mb-2.5">
          <View className="flex-row items-center gap-1.5">
            {MOODS.map((mood) => {
              const isSelected = selectedMoodId === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  activeOpacity={0.75}
                  disabled={isSavingMood}
                  onPress={() => handleSelectMood(mood)}
                  className="flex-1 py-2.5 px-0.5 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? `${mood.color}20` : colors.input,
                    borderColor: isSelected ? mood.color : colors.inputBorder,
                    borderWidth: isSelected ? 1.5 : 1,
                  }}
                >
                  <Text className="text-xl mb-1">{mood.emoji}</Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    className="text-[10px] font-bold text-center leading-tight"
                    style={{
                      color: isSelected ? mood.color : colors.textMuted,
                    }}
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
        <View
          className="rounded-2xl p-3.5 mb-2.5"
          style={{
            backgroundColor: colors.input,
            borderColor: colors.inputBorder,
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-start mb-2.5">
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              style={{
                backgroundColor: `${selectedMood.color}15`,
                borderColor: `${selectedMood.color}35`,
                borderWidth: 1,
              }}
            >
              <Text className="text-2xl">{selectedMood.emoji}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text
                    className="font-black text-sm"
                    style={{ color: colors.textPrimary }}
                  >
                    {selectedMood.label}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleResetCheckIn}
                  activeOpacity={0.7}
                  className="px-2 py-0.5 rounded-md bg-danger/10 border border-danger/20"
                >
                  <Text className="text-[10px] font-bold text-danger dark:text-danger-dark">
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                className="text-xs leading-relaxed mt-1.5 font-medium"
                style={{ color: colors.textMuted }}
              >
                {selectedMood.coachTip}
              </Text>
            </View>
          </View>

          {/* Optional Reflection Note Section */}
          {showNotesInput ? (
            <View
              className="mt-2.5 pt-2.5"
              style={{
                borderTopWidth: 1,
                borderTopColor: isDark ? '#334155' : '#E2E8F0',
              }}
            >
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional: How did you sleep? Any soreness?"
                placeholderTextColor={colors.textMuted}
                maxLength={200}
                multiline
                numberOfLines={2}
                className="p-2.5 rounded-xl text-xs mb-2 min-h-[52px]"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
                  color: colors.textPrimary,
                }}
                textAlignVertical="top"
              />
              <View className="flex-row justify-end gap-2">
                <TouchableOpacity
                  onPress={() => setShowNotesInput(false)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{
                    borderColor: colors.inputBorder,
                    borderWidth: 1,
                  }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: colors.textMuted }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveNote}
                  disabled={savingNote}
                  className="px-3 py-1.5 rounded-lg bg-accent dark:bg-accent-dark flex-row items-center"
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
              className="mt-2 pt-2 flex-row items-start justify-between"
              style={{
                borderTopWidth: 1,
                borderTopColor: isDark ? '#334155' : '#E2E8F0',
              }}
            >
              <View className="flex-row items-start flex-1 mr-2">
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.accent} style={{ marginRight: 5, marginTop: 1 }} />
                <Text
                  className="text-xs italic leading-4 flex-1"
                  style={{ color: colors.textPrimary }}
                >
                  "{notes}"
                </Text>
              </View>
              <Text className="text-[10px] text-accent dark:text-accent-dark font-bold ml-1">Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowNotesInput(true)}
              className="mt-1.5 pt-2 flex-row items-center"
              style={{
                borderTopWidth: 1,
                borderTopColor: isDark ? '#334155' : '#E2E8F0',
              }}
            >
              <Ionicons name="add-circle-outline" size={14} color={colors.textMuted} style={{ marginRight: 5 }} />
              <Text
                className="text-[11px] font-medium"
                style={{ color: colors.textMuted }}
              >
                Add morning reflection note...
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Daily Motivation Quote */}
      <View
        className="pt-2.5 mt-1"
        style={{
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#E2E8F0',
        }}
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="sparkles" size={11} color={colors.accent} />
            <Text
              className="text-[10px] font-bold uppercase tracking-wider text-accent dark:text-accent-mint"
              style={{ color: colors.accent }}
            >
              Daily Motivation
            </Text>
          </View>
          <Text
            className="text-text-primary dark:text-text-primary-dark text-xs italic font-medium leading-snug"
            style={{ color: colors.textPrimary }}
          >
            “{currentQuote.quote}”
          </Text>
          <Text
            className="text-text-muted dark:text-text-muted-dark text-[10px] mt-1 font-semibold"
            style={{ color: colors.textMuted }}
          >
            — {currentQuote.author}
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}
