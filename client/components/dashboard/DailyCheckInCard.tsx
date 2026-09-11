import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authStorage } from '../../utils/authStorage';
import SurfaceCard from '../ui/SurfaceCard';

export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  coachTip: string;
}

const MOODS: MoodOption[] = [
  { id: 'fire', emoji: '⚡', label: 'Fired Up', coachTip: 'Channel that energy into progressive overload and intense sets today!' },
  { id: 'strong', emoji: '💪', label: 'Strong', coachTip: 'Great mindset! Focus on strict form and hitting your target reps.' },
  { id: 'good', emoji: '😊', label: 'Balanced', coachTip: 'Consistency is king. A steady, focused workout will keep your momentum.' },
  { id: 'tired', emoji: '😴', label: 'Low Energy', coachTip: 'Take a longer dynamic warmup and stay hydrated. Showing up is 80% of the battle!' },
  { id: 'rest', emoji: '🧘', label: 'Recovery', coachTip: 'Focus on active stretching, foam rolling, and nutrient-dense recovery meals.' },
];

const MOTIVATION_QUOTES = [
  { quote: 'The only bad workout is the one that didn’t happen.', author: 'Fitness Wisdom' },
  { quote: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { quote: 'Discipline is doing what needs to be done, even if you don’t feel like it.', author: 'Unknown' },
  { quote: 'Your body can stand almost anything. It’s your mind you have to convince.', author: 'Coach Pro' },
  { quote: 'Action creates motivation, not the other way around.', author: 'FitTrack AI' },
];

interface DailyCheckInCardProps {
  onCheckInCompleted?: (mood: MoodOption) => void;
}

export default function DailyCheckInCard({ onCheckInCompleted }: DailyCheckInCardProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const getTodayDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadCheckInState = async () => {
      try {
        const todayKey = getTodayDateKey();
        const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
        const savedCheckIn = await AsyncStorage.getItem(checkinKey);
        if (savedCheckIn) {
          const parsed = JSON.parse(savedCheckIn);
          setSelectedMoodId(parsed.moodId);
          setIsCheckedIn(true);
        } else {
          setSelectedMoodId(null);
          setIsCheckedIn(false);
        }
      } catch (e) {
        console.log('Error loading daily check-in:', e);
      }
    };

    loadCheckInState();
  }, [userId]);

  const handleSelectMood = async (mood: MoodOption) => {
    setSelectedMoodId(mood.id);
    setIsCheckedIn(true);

    const todayKey = getTodayDateKey();
    const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
    const lastCheckinKey = authStorage.getScopedKey(userId, 'last_checkin_date');

    const data = {
      date: todayKey,
      moodId: mood.id,
      moodLabel: mood.label,
      timestamp: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(checkinKey, JSON.stringify(data));
      await AsyncStorage.setItem(lastCheckinKey, todayKey);
      await AsyncStorage.removeItem(`daily_checkin_${todayKey}`).catch(() => {});
      await AsyncStorage.removeItem('last_checkin_date').catch(() => {});
    } catch (e) {
      console.log('Error saving check-in:', e);
    }

    showToast({
      message: `${mood.emoji} Daily Check-In Complete!`,
      description: mood.coachTip,
      type: 'success',
      icon: '🔥',
    });

    if (onCheckInCompleted) {
      onCheckInCompleted(mood);
    }
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
  };

  const currentQuote = MOTIVATION_QUOTES[quoteIndex];
  const selectedMood = MOODS.find((m) => m.id === selectedMoodId);

  return (
    <SurfaceCard className="mb-3">
      {/* Header Row */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2.5">
            <Text className="text-base">⚡</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              Daily Readiness
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              {isCheckedIn && selectedMood ? `Logged: ${selectedMood.label}` : 'How are you feeling today?'}
            </Text>
          </View>
        </View>

        {isCheckedIn ? (
          <TouchableOpacity
            onPress={() => setIsCheckedIn(false)}
            activeOpacity={0.7}
            className="bg-emerald-500/15 dark:bg-emerald-500/25 px-2.5 py-1 rounded-full flex-row items-center border border-emerald-500/30"
          >
            <Text className="text-emerald-400 font-extrabold text-[10px] mr-1">✓</Text>
            <Text className="text-emerald-400 font-bold text-[10px]">Checked In • Edit</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1 rounded-full flex-row items-center">
            <Text className="text-accent dark:text-accent-dark font-bold text-[10px]">
              🔥 Active Streak
            </Text>
          </View>
        )}
      </View>

      {/* Mood Selector Buttons (Shown when not checked in or when editing) */}
      {!isCheckedIn ? (
        <View className="mb-2.5">
          <View className="flex-row justify-between gap-1.5 mb-2.5">
            {MOODS.map((mood) => {
              const isSelected = selectedMoodId === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectMood(mood)}
                  className={`flex-1 py-2.5 px-1 rounded-xl items-center justify-center border ${
                    isSelected
                      ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
                      : 'bg-input/70 dark:bg-input-dark/70 border-input-border/60 dark:border-input-border-dark/60'
                  }`}
                >
                  <Text className="text-xl mb-1">{mood.emoji}</Text>
                  <Text
                    className={`text-xs font-bold text-center leading-tight ${
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

          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] text-center">
            💡 Tap your current energy to customize today's workout intensity.
          </Text>
        </View>
      ) : selectedMood ? (
        /* Collapsed Compact State when already checked in */
        <View className="bg-input/50 dark:bg-input-dark/50 rounded-xl p-3 mb-2.5 border border-input-border/40 dark:border-input-border-dark/40 flex-row items-start">
          <Text className="text-xl mr-2.5">{selectedMood.emoji}</Text>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs mb-0.5">
              Coach Recommendation ({selectedMood.label}):
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px] leading-4">
              {selectedMood.coachTip}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Streamlined Daily Motivation Spark */}
      <View className="pt-2 border-t border-input-border/30 dark:border-input-border-dark/30 flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-xs italic font-medium leading-snug">
            “{currentQuote.quote}”
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mt-0.5">
            — {currentQuote.author}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextQuote}
          activeOpacity={0.7}
          className="bg-input/60 dark:bg-input-dark/60 px-2 py-1 rounded-lg flex-row items-center"
        >
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold mr-1">
            Spark
          </Text>
          <Text className="text-[10px]">✨</Text>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
}
