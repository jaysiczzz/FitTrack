import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';

export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  coachTip: string;
}

const MOODS: MoodOption[] = [
  { id: 'fire', emoji: '⚡', label: 'Fired Up!', coachTip: 'Channel that energy into progressive overload and intense sets today!' },
  { id: 'strong', emoji: '💪', label: 'Strong', coachTip: 'Great mindset! Focus on strict form and hitting your target reps.' },
  { id: 'good', emoji: '😊', label: 'Balanced', coachTip: 'Consistency is king. A steady, focused workout will keep your momentum.' },
  { id: 'tired', emoji: '😴', label: 'Low Energy', coachTip: 'Take a longer dynamic warmup and stay hydrated. Showing up is 80% of the battle!' },
  { id: 'rest', emoji: '🧘', label: 'Need Recovery', coachTip: 'Focus on active stretching, foam rolling, and nutrient-dense recovery meals.' },
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
  streakCount?: number;
}

export default function DailyCheckInCard({ onCheckInCompleted, streakCount = 0 }: DailyCheckInCardProps) {
  const { showToast } = useToast();
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const getTodayDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadCheckInState = async () => {
      try {
        const todayKey = getTodayDateKey();
        const savedCheckIn = await AsyncStorage.getItem(`daily_checkin_${todayKey}`);
        if (savedCheckIn) {
          const parsed = JSON.parse(savedCheckIn);
          setSelectedMoodId(parsed.moodId);
          setIsCheckedIn(true);
        }
      } catch (e) {
        console.log('Error loading daily check-in:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCheckInState();
  }, []);

  const handleSelectMood = async (mood: MoodOption) => {
    setSelectedMoodId(mood.id);
    setIsCheckedIn(true);

    const todayKey = getTodayDateKey();
    const data = {
      date: todayKey,
      moodId: mood.id,
      moodLabel: mood.label,
      timestamp: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(`daily_checkin_${todayKey}`, JSON.stringify(data));
      await AsyncStorage.setItem('last_checkin_date', todayKey);
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
    <View
      className="bg-surface dark:bg-surface-dark rounded-[28px] p-6 mb-4 border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)' } as any,
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 3,
        },
      })}
    >
      {/* Header Row */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-3">
            <Text className="text-xl">⚡</Text>
          </View>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-base">
              Daily Motivation Check-In
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
              {isCheckedIn ? 'Status recorded for today' : 'How are you feeling today?'}
            </Text>
          </View>
        </View>

        {isCheckedIn ? (
          <View className="bg-emerald-500/15 dark:bg-emerald-500/25 px-3 py-1.5 rounded-full flex-row items-center border border-emerald-500/30">
            <Text className="text-emerald-400 font-extrabold text-[11px] mr-1">✓</Text>
            <Text className="text-emerald-400 font-bold text-[11px]">Checked In</Text>
          </View>
        ) : (
          <View className="bg-accent/15 dark:bg-accent-dark/20 px-3 py-1.5 rounded-full flex-row items-center">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-[11px]">
              🔥 Streak Active
            </Text>
          </View>
        )}
      </View>

      {/* Mood Selector Buttons */}
      <Text className="text-text-muted dark:text-text-muted-dark text-xs font-bold uppercase tracking-wider mb-2.5">
        Energy & Readiness:
      </Text>
      <View className="flex-row justify-between gap-1.5 mb-4">
        {MOODS.map((mood) => {
          const isSelected = selectedMoodId === mood.id;
          return (
            <TouchableOpacity
              key={mood.id}
              activeOpacity={0.8}
              onPress={() => handleSelectMood(mood)}
              className={`flex-1 py-4 px-1.5 rounded-2xl items-center justify-center border min-h-[76px] ${
                isSelected
                  ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
                  : 'bg-input dark:bg-input-dark border-input-border/70 dark:border-input-border-dark/70'
              }`}
            >
              <Text className="text-2xl mb-1.5">{mood.emoji}</Text>
              <Text
                className={`text-[11px] font-extrabold text-center ${
                  isSelected
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
                numberOfLines={1}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tailored Coach Advice if selected, or Guidance banner if not */}
      {selectedMood ? (
        <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-4 mb-4 border border-input-border/50 dark:border-input-border-dark/50 flex-row items-start">
          <Text className="text-lg mr-2.5">💡</Text>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs mb-1">
              Coach Tip for Today ({selectedMood.label}):
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs leading-5">
              {selectedMood.coachTip}
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-input/40 dark:bg-input-dark/40 rounded-2xl p-3.5 mb-4 border border-input-border/40 dark:border-input-border-dark/40 flex-row items-center">
          <Text className="text-base mr-2.5">🎯</Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs flex-1 leading-4">
            Select your energy level above to receive personalized AI workout and nutrition guidance for today.
          </Text>
        </View>
      )}

      {/* Dynamic Motivation Quote of the Day */}
      <View className="bg-surface-variant/40 dark:bg-input-dark/30 rounded-2xl p-4 border border-input-border/40 dark:border-input-border-dark/40">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-accent dark:text-accent-dark text-[10px] font-black uppercase tracking-wider">
            Daily Spark ✨
          </Text>
          <TouchableOpacity
            onPress={handleNextQuote}
            activeOpacity={0.7}
            className="flex-row items-center bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg"
          >
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold mr-1">
              Shuffle
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">🔀</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-text-primary dark:text-text-primary-dark text-[13px] font-semibold italic leading-5 mb-1.5">
          “{currentQuote.quote}”
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-[11px] text-right font-medium">
          — {currentQuote.author}
        </Text>
      </View>
    </View>
  );
}
