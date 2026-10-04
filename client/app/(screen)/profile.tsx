import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '@/api/user';
import { getWorkoutHistory } from '@/api/workout';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '@/components/ui/SurfaceCard';
import WeightProgressCard from '@/components/profile/WeightProgressCard';
import EditProfileModal from '@/components/profile/EditProfileModal';
import ChangeProfilePhotoModal from '@/components/profile/ChangeProfilePhotoModal';
import AthleteBadgesCard from '@/components/profile/AthleteBadgesCard';
import UnifiedFitnessCalendar from '@/components/calendar/UnifiedFitnessCalendar';
import { capitalizeWords } from '@/utils/formatters';
import { screenCache } from '@/utils/screenCache';
import { isTemporaryBlobUrl } from '@/utils/imageUtils';
import { authStorage } from '@/utils/authStorage';
import { hapticFeedback } from '@/utils/haptics';

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
}

export default function Profile() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuth();
  const { colors } = useThemeColors();

  const [savedUser, setSavedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(!screenCache.profileLoaded);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Modal states
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showChangeProfileOption, setShowChangeProfileOption] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'loss'>('muscle');

  // Athletic metrics
  const [streakCount, setStreakCount] = useState(0);
  const [totalWorkoutsCount, setTotalWorkoutsCount] = useState(0);

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
      const historyKey = authStorage.getScopedKey(userId, 'workout_history');
      const cachedHistory = await AsyncStorage.getItem(historyKey);
      if (cachedHistory) {
        try {
          const parsed = JSON.parse(cachedHistory);
          if (Array.isArray(parsed)) {
            setTotalWorkoutsCount(parsed.length);
          }
        } catch { }
      }

      const res = await getWorkoutHistory().catch(() => null);
      if (res && Array.isArray(res.sessions)) {
        setTotalWorkoutsCount(res.sessions.length);
      }

      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${dateKey}`);
        const checkin = await AsyncStorage.getItem(checkinKey);
        if (checkin) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      setStreakCount(streak);
    } catch { }
  }, [authUser?.id]);

  useEffect(() => {
    let isMounted = true;
    if (authUser) {
      applyUserData(authUser);
      loadAvatar();
    }
    loadAthleticHistory();

    const fetchProfile = async () => {
      try {
        if (!screenCache.profileLoaded) {
          setLoading(true);
        }
        const res = await getUserProfile();
        if (res.user && isMounted) {
          applyUserData(res.user);
          await updateUser(res.user);
        }
      } catch (err) {
        console.log('Error fetching user profile:', err);
      } finally {
        screenCache.setProfileLoaded(true);
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [authUser?.id, loadAvatar, loadAthleticHistory]);

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const value = w / (h * h);
    const category =
      value < 18.5 ? 'Underweight' : value < 25 ? 'Normal' : value < 30 ? 'Overweight' : 'Obese';
    return {
      value: value.toFixed(1),
      category,
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

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}
      >
        <View className="w-full max-w-2xl self-center">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              Profile
            </Text>

            {/* Single Settings Button */}
            <TouchableOpacity
              onPress={() => router.push('/(screen)/settings' as any)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center shadow-sm"
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-sharp" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
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
                      className="w-24 h-24 rounded-full border-2 border-accent dark:border-accent-dark bg-input dark:bg-input-dark"
                      resizeMode="cover"
                      onError={() => {
                        setAvatarUrl(null);
                        const avatarKey = authUser?.id ? `fittrack_user_avatar_${authUser.id}` : 'fittrack_user_avatar';
                        AsyncStorage.removeItem(avatarKey).catch(() => {});
                      }}
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-accent/20 dark:bg-accent-dark/25 border-2 border-accent dark:border-accent-dark items-center justify-center">
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
                    className="px-2.5 py-1 bg-surface dark:bg-surface-dark border border-accent/40 rounded-full flex-row items-center justify-center gap-1"
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
              <View className="flex-row items-center gap-2 mt-3">
                <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                  <Ionicons
                    name={goal === 'muscle' ? 'barbell' : 'flame'}
                    size={12}
                    color={colors.accent}
                  />
                  <Text className="text-accent dark:text-accent-dark text-[11px] font-black uppercase tracking-wider">
                    {goal === 'muscle' ? 'Muscle Gain' : 'Weight Loss'}
                  </Text>
                </View>

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
                  {height ? `${height} cm` : '—'}
                </Text>
              </View>

              <View className="items-center flex-1 border-r border-input-border/60 dark:border-input-border-dark/60">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-0.5">
                  WEIGHT
                </Text>
                <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
                  {weight ? `${weight} kg` : '—'}
                </Text>
              </View>

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

          {/* Weight & Body Progress Card */}
          <WeightProgressCard
            onWeightUpdated={(newW) => setWeight(String(newW))}
          />

          {/* Unified Activity & Consistency Calendar */}
          <View className="mb-3">
            <UnifiedFitnessCalendar
              initialFilter="all"
              onSwitchToTodayWorkout={() => router.push('/(screen)/workouts' as any)}
              onSwitchToTodayNutrition={() => router.push('/(screen)/foodlog' as any)}
            />
          </View>

          {/* Athlete Achievements & Milestones */}
          <AthleteBadgesCard
            currentStreak={streakCount}
            totalWorkouts={totalWorkoutsCount}
          />
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
    </SafeAreaView>
  );
}