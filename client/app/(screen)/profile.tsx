import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LAYOUT } from '@/constants/layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '@/api/user';
import { getWorkoutHistory } from '@/api/workout';
import { getCheckInHistoryApi } from '@/api/checkin';
import { getFoodLogHistoryApi } from '@/api/foodlog';
import {
  getInAppNotificationsApi,
  getCachedUnreadNotifCount,
  setCachedUnreadNotifCount,
} from '@/api/notifications';
import { calculateActiveStreak, extractActiveDatesFromHistory, formatDateKey } from '@/utils/streakUtils';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '@/components/ui/SurfaceCard';
import EditProfileModal from '@/components/profile/EditProfileModal';
import ChangeProfilePhotoModal from '@/components/profile/ChangeProfilePhotoModal';
import LogWeightModal from '@/components/profile/LogWeightModal';
import { saveWeightLogApi } from '@/api/weight';
import UnifiedFitnessCalendar from '@/components/calendar/UnifiedFitnessCalendar';
import { capitalizeWords, calculateBmi } from '@/utils/formatters';
import { screenCache } from '@/utils/screenCache';
import { isTemporaryBlobUrl } from '@/utils/imageUtils';
import { authStorage } from '@/utils/authStorage';
import { hapticFeedback } from '@/utils/haptics';
import { useHeightUnit, useWeightUnit, formatHeightDisplay, formatWeightDisplay } from '@/constants/units';
import {
  DEFAULT_WATER_TARGET_ML,
  MIN_WATER_TARGET_ML,
  WATER_INCREMENT_SMALL_ML,
} from '@/constants/fitnessDefaults';

interface UserData {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  height?: number;
  weight?: number;
  targetWeight?: number | null;
  age?: number;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  avatarUrl?: string | null;
  subscription?: {
    tier: string;
    status: string;
  } | null;
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser, updateUser } = useAuth();
  const { colors, isDark } = useThemeColors();
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(getCachedUnreadNotifCount);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getInAppNotificationsApi();
      if (res && res.success) {
        const count = res.unreadCount ?? 0;
        setUnreadNotifCount(count);
        setCachedUnreadNotifCount(count);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  const [savedUser, setSavedUser] = useState<UserData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [heightUnit] = useHeightUnit();
  const [weightUnit] = useWeightUnit();

  // Modal states
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showChangeProfileOption, setShowChangeProfileOption] = useState(false);
  const [showLogWeightModal, setShowLogWeightModal] = useState(false);

  const handleSaveWeight = async (newWeight: number, date: string, notes?: string) => {
    try {
      await saveWeightLogApi({ weight: newWeight, date, notes });
      setWeight(String(newWeight));
      if (updateUser) {
        updateUser({ weight: newWeight });
      }
      setShowLogWeightModal(false);
    } catch (e: any) {
      console.warn('Error saving weight:', e);
    }
  };

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'loss'>('muscle');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');

  // Athletic metrics
  const [streakCount, setStreakCount] = useState(0);

  const applyUserData = (u: UserData) => {
    setSavedUser(u);
    if (u.firstName) setFirstName(u.firstName);
    if (u.lastName) setLastName(u.lastName);
    if (u.email) setEmail(u.email);
    if (u.height !== undefined) setHeight(String(u.height));
    if (u.weight !== undefined) setWeight(String(u.weight));
    if (u.goal) {
      setGoal(u.goal === 'MUSCLE_GAIN' ? 'muscle' : 'loss');
    }
    if ((u as any).gender) {
      setGender((u as any).gender);
    }
  };

  const loadAvatar = useCallback(async () => {
    try {
      const avatarKey = authUser?.id ? `fittrack_user_avatar_${authUser.id}` : 'fittrack_user_avatar';
      const saved = await AsyncStorage.getItem(avatarKey);
      if (saved) {
        if (isTemporaryBlobUrl(saved)) {
          await AsyncStorage.removeItem(avatarKey);
          setAvatarUrl(null);
        } else {
          setAvatarUrl(saved);
        }
      } else if (authUser?.avatarUrl) {
        if (isTemporaryBlobUrl(authUser.avatarUrl)) {
          setAvatarUrl(null);
        } else {
          setAvatarUrl(authUser.avatarUrl);
        }
      }
    } catch { }
  }, [authUser?.id, authUser?.avatarUrl]);

  const loadAthleticHistory = useCallback(async () => {
    try {
      const userId = authUser?.id;
      if (!userId) return;

      // 1. Workout history
      const historyKey = authStorage.getScopedKey(userId, 'fittrack_workout_history_cache');
      let workoutSessions: any[] = [];
      const cachedHistory = await AsyncStorage.getItem(historyKey);
      if (cachedHistory) {
        try {
          const parsed = JSON.parse(cachedHistory);
          if (Array.isArray(parsed)) {
            workoutSessions = parsed;
          }
        } catch { }
      }

      const res = await getWorkoutHistory().catch(() => null);
      if (res && Array.isArray(res.sessions)) {
        workoutSessions = res.sessions;
        AsyncStorage.setItem(historyKey, JSON.stringify(res.sessions)).catch(() => {});
      }

      // 2. Check-in history
      const checkinHistoryKey = authStorage.getScopedKey(userId, 'fittrack_checkin_history_cache');
      let checkIns: any[] = [];
      const cachedCheckins = await AsyncStorage.getItem(checkinHistoryKey);
      if (cachedCheckins) {
        try {
          const parsed = JSON.parse(cachedCheckins);
          if (Array.isArray(parsed)) {
            checkIns = parsed;
          }
        } catch {}
      }

      try {
        const checkinRes = await getCheckInHistoryApi(60).catch(() => null);
        if (checkinRes?.success && Array.isArray(checkinRes.history)) {
          checkIns = checkinRes.history;
          AsyncStorage.setItem(checkinHistoryKey, JSON.stringify(checkinRes.history)).catch(() => {});
        }
      } catch {}

      // 3. Nutrition history & Macro status for streak
      const foodHistoryKey = authStorage.getScopedKey(userId, 'fittrack_food_history_cache');
      let foodLogs: any[] = [];
      const cachedFoodHistory = await AsyncStorage.getItem(foodHistoryKey);
      if (cachedFoodHistory) {
        try {
          const parsed = JSON.parse(cachedFoodHistory);
          if (Array.isArray(parsed)) {
            foodLogs = parsed;
          }
        } catch {}
      }

      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const cachedFood = await AsyncStorage.getItem(foodKey);
      if (cachedFood) {
        try {
          const parsed = JSON.parse(cachedFood);
        } catch { }
      }

      const foodRes = await getFoodLogHistoryApi().catch(() => null);
      if (foodRes?.success && Array.isArray(foodRes.history)) {
        foodLogs = foodRes.history;
        AsyncStorage.setItem(foodHistoryKey, JSON.stringify(foodRes.history)).catch(() => {});
      }

      // Dynamic water target matching dashboard personalized metrics
      const parsedWeight = authUser?.weight || (weight ? parseFloat(weight) : undefined);
      const userTargetWater = parsedWeight
        ? Math.max(MIN_WATER_TARGET_ML, Math.round((parsedWeight * 35) / WATER_INCREMENT_SMALL_ML) * WATER_INCREMENT_SMALL_ML)
        : DEFAULT_WATER_TARGET_ML;

      // Extract all active dates across history (workout, check-in, nutrition, hydration)
      const activeDates = extractActiveDatesFromHistory(workoutSessions, checkIns, foodLogs, userTargetWater);

      // Check if at least 1 goal in "Today's Goals" is completed today
      const today = new Date();
      const todayKey = formatDateKey(today);

      const hasWorkoutToday = workoutSessions.some((s) => {
        const ts = s.completedAt || s.dateStr || (s.completed ? s.createdAt : null);
        return ts && (ts.startsWith(todayKey) || ts === todayKey);
      });

      const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
      const cachedCheckin = await AsyncStorage.getItem(checkinKey);
      const isCheckinToday = Boolean(cachedCheckin) || checkIns.some((c) => c.date === todayKey);

      const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayKey}`);
      const cachedCompleted = await AsyncStorage.getItem(dayCompletedKey);
      const isNutritionDoneToday = cachedCompleted === 'true';

      const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
      const cachedWater = await AsyncStorage.getItem(waterKey);
      const isWaterDoneToday = (parseInt(cachedWater || '0', 10) || 0) >= userTargetWater;

      const isAnyGoalDoneToday = Boolean(hasWorkoutToday || isCheckinToday || isNutritionDoneToday || isWaterDoneToday);

      const activeStreak = calculateActiveStreak(activeDates, isAnyGoalDoneToday);
      setStreakCount(activeStreak);
      const streakKey = authStorage.getScopedKey(userId, 'fittrack_current_streak_cache');
      AsyncStorage.setItem(streakKey, activeStreak.toString()).catch(() => {});
    } catch { }
  }, [authUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadAthleticHistory();
      loadNotifications();
    }, [loadAthleticHistory, loadNotifications])
  );

  useEffect(() => {
    let isMounted = true;
    if (authUser) {
      applyUserData(authUser);
      loadAvatar();
    }
    if (authUser?.id) {
      const streakKey = authStorage.getScopedKey(authUser.id, 'fittrack_current_streak_cache');
      AsyncStorage.getItem(streakKey)
        .then((cached) => {
          if (cached !== null && isMounted) {
            const val = parseInt(cached, 10);
            if (!isNaN(val)) setStreakCount(val);
          }
        })
        .catch(() => {});
    }
    loadAthleticHistory();
    loadNotifications();

    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();
        if (res.user && isMounted) {
          applyUserData(res.user);
          await updateUser(res.user);
        }
      } catch (err) {
        console.log('Error fetching user profile:', err);
      } finally {
        screenCache.setProfileLoaded(true);
      }
    };

    fetchProfile();

    const subW = DeviceEventEmitter.addListener('WORKOUT_SESSION_COMPLETED', () => {
      loadAthleticHistory();
    });
    const subWD = DeviceEventEmitter.addListener('WORKOUT_SESSION_DELETED', () => {
      loadAthleticHistory();
    });
    const subC = DeviceEventEmitter.addListener('DAILY_CHECKIN_UPDATED', () => {
      loadAthleticHistory();
    });
    const subF = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', () => {
      loadAthleticHistory();
    });
    const subN = DeviceEventEmitter.addListener('IN_APP_NOTIFICATIONS_UPDATED', (evt?: { unreadCount?: number }) => {
      if (typeof evt?.unreadCount === 'number') {
        setUnreadNotifCount(evt.unreadCount);
        setCachedUnreadNotifCount(evt.unreadCount);
      } else {
        loadNotifications();
      }
    });

    return () => {
      isMounted = false;
      subW.remove();
      subWD.remove();
      subC.remove();
      subF.remove();
      subN.remove();
    };
  }, [authUser?.id, loadAvatar, loadAthleticHistory, loadNotifications]);

  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const res = calculateBmi(w, h);
    return {
      value: res.bmi.toFixed(1),
      category: res.category,
    };
  }, [height, weight]);

  const capitalizedFullName = useMemo(() => {
    const full = `${firstName} ${lastName}`.trim();
    return capitalizeWords(full || 'Athlete');
  }, [firstName, lastName]);

  const initials = useMemo(() => {
    const f = firstName?.[0] || 'A';
    const l = lastName?.[0] || '';
    return (f + l).toUpperCase();
  }, [firstName, lastName]);

  const isPro = useMemo(() => {
    return Boolean(
      savedUser?.subscription?.tier &&
      savedUser.subscription.tier !== 'FREE' &&
      savedUser.subscription.status === 'ACTIVE'
    );
  }, [savedUser?.subscription]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: LAYOUT.getTabBarPadding(insets.bottom) }}
      >
        <View className="w-full max-w-2xl self-center">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              Profile
            </Text>

            <View className="flex-row items-center gap-2">
              {/* Notification Inbox Button */}
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  router.push('/(screen)/notifications' as any);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`relative w-10 h-10 rounded-xl items-center justify-center shadow-xs border transition-colors ${
                  unreadNotifCount > 0
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-500/40'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
                accessibilityLabel={`Notifications, ${unreadNotifCount} unread`}
              >
                <Ionicons
                  name={unreadNotifCount > 0 ? 'notifications' : 'notifications-outline'}
                  size={19}
                  color={unreadNotifCount > 0 ? '#10B981' : colors.textPrimary}
                />
                {unreadNotifCount > 0 ? (
                  <View
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 items-center justify-center border-2 border-surface dark:border-surface-dark shadow-sm"
                    accessibilityLabel={`${unreadNotifCount} unread notifications`}
                  >
                    <Text className="text-[9px] font-black text-white leading-none text-center">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {/* Settings Button */}
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  router.push('/(screen)/settings' as any);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center shadow-sm"
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-sharp" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Athlete Identity Card */}
          <SurfaceCard className="mb-3 p-5">
            <View className="items-center">
              {/* Profile Icon with Floating "Change Profile" */}
              <View className="relative items-center mb-3">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    hapticFeedback.light();
                    setShowChangeProfileOption((prev) => !prev);
                  }}
                  className="rounded-full shadow-sm"
                  accessibilityLabel="Profile photo"
                >
                  {avatarUrl && !isTemporaryBlobUrl(avatarUrl) ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-24 h-24 rounded-full"
                      resizeMode="cover"
                      onError={() => {
                        setAvatarUrl(null);
                        const avatarKey = authUser?.id ? `fittrack_user_avatar_${authUser.id}` : 'fittrack_user_avatar';
                        AsyncStorage.removeItem(avatarKey).catch(() => {});
                      }}
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-accent/15 dark:bg-accent-dark/20 border-2 border-input-border dark:border-input-border-dark items-center justify-center shadow-sm">
                      <Text className="text-accent dark:text-accent-dark font-black text-3xl">
                        {initials}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Floating "Change Profile" text shown below avatar when clicked */}
                {showChangeProfileOption && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      hapticFeedback.light();
                      setShowChangeProfileOption(false);
                      setShowPhotoModal(true);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: -11,
                      zIndex: 30,
                      minWidth: 108,
                      alignSelf: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 6,
                    }}
                    className="px-2.5 py-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-full flex-row items-center justify-center gap-1"
                  >
                    <Ionicons name="camera" size={11} color={colors.accent} />
                    <Text
                      numberOfLines={1}
                      style={{ flexShrink: 0 }}
                      className="text-[11px] font-bold text-accent dark:text-accent-dark"
                    >
                      Change Profile
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Capitalized Name & Athlete Email */}
              <Text className="text-text-primary dark:text-text-primary-dark text-xl font-black tracking-tight text-center mt-2">
                {capitalizedFullName}
              </Text>
              {email ? (
                <Text className="text-text-muted dark:text-text-muted-dark text-center text-xs mt-0.5 font-normal">
                  {email}
                </Text>
              ) : null}

              {/* Badges & Actions Row */}
              <View className="flex-row items-center gap-2 mt-3 flex-wrap justify-center">
                {isPro && (
                  <View className="bg-amber-500/15 dark:bg-amber-400/20 border border-amber-500/40 dark:border-amber-400/40 px-2.5 py-1 rounded-lg flex-row items-center gap-1">
                    <Ionicons name="sparkles" size={11} color="#f59e0b" />
                    <Text className="text-amber-600 dark:text-amber-400 text-[11px] font-black tracking-wider uppercase">
                      PRO ATHLETE
                    </Text>
                  </View>
                )}

                <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2.5 py-1 rounded-lg">
                  <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-medium tracking-wide">
                    Goal:{' '}
                    <Text className="text-text-primary dark:text-text-primary-dark font-bold">
                      {goal === 'muscle' ? 'Muscle Gain' : 'Weight Loss'}
                    </Text>
                  </Text>
                </View>

                {gender ? (
                  <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2.5 py-1 rounded-lg">
                    <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-medium tracking-wide">
                      Sex:{' '}
                      <Text className="text-text-primary dark:text-text-primary-dark font-bold">
                        {gender === 'MALE' ? 'Male' : 'Female'}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                {/* Edit Personal Information Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowEditInfoModal(true)}
                  className="px-3 py-1 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1.5"
                >
                  <Ionicons name="pencil" size={11} color={colors.textPrimary} />
                  <Text className="text-text-primary dark:text-text-primary-dark text-[11px] font-bold">
                    Edit Info
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Vitals Quick-Stats Grid */}
            <View className="flex-row justify-around pt-4 mt-4 border-t border-input-border dark:border-input-border-dark">
              <View className="items-center flex-1 border-r border-input-border/60 dark:border-input-border-dark/60">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-0.5">
                  HEIGHT
                </Text>
                <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
                  {height ? formatHeightDisplay(parseFloat(height), heightUnit) : '—'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setShowLogWeightModal(true);
                }}
                activeOpacity={0.7}
                className="items-center flex-1 border-r border-input-border/60 dark:border-input-border-dark/60"
              >
                <View className="flex-row items-center gap-0.5 mb-0.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark">
                    WEIGHT
                  </Text>
                  <Ionicons name="pencil" size={9} color={colors.accent} />
                </View>
                <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
                  {weight ? formatWeightDisplay(parseFloat(weight), weightUnit) : '—'}
                </Text>
                <Text className="text-[9px] font-semibold text-accent dark:text-accent-dark">
                  Log entry
                </Text>
              </TouchableOpacity>

              <View className="items-center flex-1 border-r border-input-border/60 dark:border-input-border-dark/60">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-0.5">
                  BMI
                </Text>
                <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
                  {bmi ? bmi.value : '—'}
                </Text>
                {bmi ? (
                  <Text className="text-[9px] font-semibold text-text-muted dark:text-text-muted-dark">
                    {bmi.category}
                  </Text>
                ) : null}
              </View>

              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-0.5">
                  STREAK
                </Text>
                <View className="flex-row items-center gap-0.5">
                  <Ionicons name="flame" size={14} color="#EF4444" />
                  <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
                    {streakCount}
                  </Text>
                </View>
                <Text className="text-[9px] font-semibold text-text-muted dark:text-text-muted-dark">
                  Days
                </Text>
              </View>
            </View>
          </SurfaceCard>

          {/* Unified Activity & Consistency Calendar */}
          <View className="mb-3">
            <UnifiedFitnessCalendar
              initialFilter="all"
              onSwitchToTodayWorkout={() => router.push('/(screen)/workouts' as any)}
              onSwitchToTodayNutrition={() => router.push('/(screen)/foodlog' as any)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Profile Photo Options Modal (Take photo, Choose from gallery, Remove) */}
      <ChangeProfilePhotoModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={(newAvatar) => {
          setAvatarUrl(newAvatar);
        }}
      />

      {/* Edit Personal Information Modal (First name, Last name, Height, Weight, Age, Goal) */}
      <EditProfileModal
        visible={showEditInfoModal}
        onClose={() => setShowEditInfoModal(false)}
        onProfileUpdated={(updated) => {
          applyUserData(updated);
        }}
      />

      {/* Log Weight Modal */}
      <LogWeightModal
        visible={showLogWeightModal}
        onClose={() => setShowLogWeightModal(false)}
        currentWeight={weight ? parseFloat(weight) : 70}
        onSaveWeight={handleSaveWeight}
      />
    </SafeAreaView>
  );
}