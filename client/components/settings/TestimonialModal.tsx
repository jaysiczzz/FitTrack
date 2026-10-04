import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import ModalCloseButton from '../ui/ModalCloseButton';
import {
  getTestimonialsApi,
  getMyTestimonialApi,
  submitTestimonialApi,
  deleteMyTestimonialApi,
  toggleHelpfulTestimonialApi,
  TestimonialItem,
} from '@/api/testimonial';

interface TestimonialModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'feed' | 'write';
}

const PRESET_BADGES = [
  '🏆 New PR Set',
  '🔥 Weight Goal Reached',
  '⚡ Active Workout Streak',
  '🥗 Macro Consistency',
  '🤖 AI Coach Routines',
  '💪 Progressive Overload',
];

export default function TestimonialModal({
  visible,
  onClose,
  initialTab = 'feed',
}: TestimonialModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const storageKey = `@fittrack_testimonial_votes_${user?.id || 'guest'}`;

  const [activeTab, setActiveTab] = useState<'feed' | 'write'>(initialTab);
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<'ALL' | 'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'helpful' | 'highest_rated' | 'recent'>('featured');

  // Feed State
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // User Submission State
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>('');
  const [highlightBadge, setHighlightBadge] = useState<string>('');
  const [weightChangeKg, setWeightChangeKg] = useState<string>('');
  const [durationWeeks, setDurationWeeks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasExistingReview, setHasExistingReview] = useState<boolean>(false);
  const [myReviews, setMyReviews] = useState<TestimonialItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);

  // Load persistent votes from AsyncStorage
  const loadStoredVotes = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setVotedIds((prev) => new Set([...prev, ...parsed]));
        }
      }
    } catch {
      // Ignored
    }
  }, [storageKey]);

  const fetchFeed = useCallback(async () => {
    try {
      setLoadingFeed(true);
      const goalQuery =
        selectedGoalFilter === 'ALL' ? undefined : selectedGoalFilter;
      const res = await getTestimonialsApi(goalQuery, sortBy);
      if (res.testimonials) {
        setTestimonials(res.testimonials);

        // Hydrate votedIds from backend hasVoted flags
        const backendVoted = res.testimonials
          .filter((t) => t.hasVoted)
          .map((t) => t.id);

        if (backendVoted.length > 0) {
          setVotedIds((prev) => {
            const next = new Set([...prev, ...backendVoted]);
            AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(next))).catch(() => {});
            return next;
          });
        }
      }
      setAverageRating(res.averageRating || 5.0);
      setTotalCount(res.totalCount || res.testimonials?.length || 0);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingFeed(false);
    }
  }, [selectedGoalFilter, sortBy, storageKey]);

  const handleNewStory = useCallback(() => {
    setEditingId(null);
    setContent('');
    setHighlightBadge('');
    setWeightChangeKg('');
    setDurationWeeks('');
    setRating(5);
    setIsComposing(true);
    setActiveTab('write');
  }, []);

  const handleSelectStory = useCallback((rev: TestimonialItem) => {
    setEditingId(rev.id);
    setRating(rev.rating);
    setContent(rev.content);
    setHighlightBadge(rev.highlightBadge || '');
    setWeightChangeKg(rev.weightChangeKg != null ? String(rev.weightChangeKg) : '');
    setDurationWeeks(rev.durationWeeks != null ? String(rev.durationWeeks) : '');
    setIsComposing(true);
    setActiveTab('write');
  }, []);

  const fetchMyReview = useCallback(async () => {
    if (!user) return;
    try {
      const res = (await getMyTestimonialApi()) as any;
      const list: TestimonialItem[] = res.testimonials || (res.testimonial ? [res.testimonial] : []);
      setMyReviews(list);
      setHasExistingReview(list.length > 0);
    } catch {
      // Ignored
    }
  }, [user]);

  // Handle modal opening and initial tab setup
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setIsComposing(false);
      loadStoredVotes();
      fetchFeed();
      fetchMyReview();
    }
  }, [visible, initialTab]);

  // Refetch feed when filter or sorting changes
  useEffect(() => {
    if (visible) {
      fetchFeed();
    }
  }, [visible, selectedGoalFilter, sortBy, fetchFeed]);

  // Live update when any user submits or modifies testimonials
  useEffect(() => {
    if (!visible) return;
    const sub = DeviceEventEmitter.addListener('testimonials:updated', () => {
      fetchFeed();
      fetchMyReview();
    });
    return () => {
      sub.remove();
    };
  }, [visible, fetchFeed, fetchMyReview]);

  const handleUpvote = async (item: TestimonialItem) => {
    const isVoted = votedIds.has(item.id);
    const newVoted = !isVoted;

    // Optimistic UI update
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (newVoted) next.add(item.id);
      else next.delete(item.id);
      AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });

    setTestimonials((prev) =>
      prev.map((s) =>
        s.id === item.id
          ? {
              ...s,
              hasVoted: newVoted,
              helpfulCount: Math.max((s.helpfulCount || 0) + (newVoted ? 1 : -1), 0),
            }
          : s
      )
    );

    try {
      const res = await toggleHelpfulTestimonialApi(item.id);
      if (res.hasVoted) {
        showSuccess('Inspiring!', `Thanked ${item.authorName} for the motivation!`);
      }
    } catch {
      // Rollback on error
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (isVoted) next.add(item.id);
        else next.delete(item.id);
        AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(next))).catch(() => {});
        return next;
      });
      setTestimonials((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? {
                ...s,
                hasVoted: isVoted,
                helpfulCount: Math.max((s.helpfulCount || 0) + (isVoted ? 1 : -1), 0),
              }
            : s
        )
      );
    }
  };

  const handleAutoFill = () => {
    const goal = user?.goal;
    const isWeightLoss = goal === 'WEIGHT_LOSS';

    if (isWeightLoss) {
      setContent(
        "FitTrack's daily check-ins and meal scanner kept me accountable every single day. Being able to visualize calorie targets without guesswork helped me shed fat while maintaining daily energy!"
      );
      setHighlightBadge('🔥 Caloric Consistency Reached');
      if (!weightChangeKg) setWeightChangeKg('-5.0');
      if (!durationWeeks) setDurationWeeks('8');
    } else {
      setContent(
        "The progressive overload tracking and tailored workout routines completely revitalized my training. Hitting consistent daily protein goals made a noticeable difference in recovery and muscle gains!"
      );
      setHighlightBadge('💪 Progressive Overload Milestone');
      if (!weightChangeKg) setWeightChangeKg('+3.5');
      if (!durationWeeks) setDurationWeeks('12');
    }
    setRating(5);
    showSuccess('Auto-Filled!', 'Generated a starter template tailored to your journey.');
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      showError('Required Field', 'Please share a few words about your journey.');
      return;
    }
    if (content.trim().length < 8) {
      showError('Too Short', 'Please enter at least 8 characters in your testimony.');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedWeight = weightChangeKg.trim() ? parseFloat(weightChangeKg) : undefined;
      const parsedWeeks = durationWeeks.trim() ? parseInt(durationWeeks, 10) : undefined;

      const res = await submitTestimonialApi({
        id: editingId || undefined,
        rating,
        content: content.trim(),
        highlightBadge: highlightBadge.trim() || undefined,
        goal: (user?.goal === 'MUSCLE_GAIN' || user?.goal === 'WEIGHT_LOSS') ? user.goal : undefined,
        weightChangeKg: !isNaN(parsedWeight as number) ? parsedWeight : undefined,
        durationWeeks: !isNaN(parsedWeeks as number) ? parsedWeeks : undefined,
        avatarUrl: user?.avatarUrl || undefined,
      });

      DeviceEventEmitter.emit('testimonials:updated');
      showSuccess('Success', res.message || 'Thank you for sharing your transformation story!');
      setHasExistingReview(true);
      fetchFeed();
      await fetchMyReview();
      setIsComposing(false);
      setEditingId(null);
      setActiveTab('feed');
    } catch (err: any) {
      showError('Submission Error', err?.message || 'Failed to submit testimony. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteMyTestimonialApi(editingId || undefined);
      DeviceEventEmitter.emit('testimonials:updated');
      showSuccess('Removed', 'Your testimony has been deleted.');
      handleNewStory();
      setIsComposing(false);
      fetchFeed();
      await fetchMyReview();
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to delete testimony.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return 'Exceptional • Life-Changing';
      case 4:
        return 'Great • Highly Recommended';
      case 3:
        return 'Good • Helpful Companion';
      case 2:
        return 'Fair • Needs Improvement';
      default:
        return 'Challenging Experience';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl md:rounded-3xl p-5 border-t md:border border-input-border dark:border-input-border-dark h-[90%] md:h-[82%] w-full md:max-w-xl shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                  Athlete Stories & Reviews
                </Text>
              </View>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Real community transformations & experiences
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Tab Selector */}
          <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl my-3">
            <TouchableOpacity
              onPress={() => setActiveTab('feed')}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              className={`flex-1 min-h-[44px] py-2 rounded-xl items-center justify-center flex-row gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-surface dark:bg-surface-dark shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={16}
                color={activeTab === 'feed' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'feed'
                    ? 'text-accent dark:text-accent-mint'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Community Stories ({totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('write');
                if (hasExistingReview) {
                  setIsComposing(false);
                } else {
                  setIsComposing(true);
                }
              }}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              className={`flex-1 min-h-[44px] py-2 rounded-xl items-center justify-center flex-row gap-1.5 ${
                activeTab === 'write'
                  ? 'bg-surface dark:bg-surface-dark shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={activeTab === 'write' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'write'
                    ? 'text-accent dark:text-accent-mint'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                {hasExistingReview ? 'My Stories' : 'Share Story'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: COMMUNITY STORIES FEED */}
          {activeTab === 'feed' ? (
            <View className="flex-1">
              {/* Rating Summary Card */}
              <View className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20 mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="items-center justify-center bg-accent/20 rounded-xl px-2.5 py-1.5">
                    <Text className="text-xl font-black text-accent dark:text-accent-mint">
                      {averageRating.toFixed(1)}
                    </Text>
                  </View>
                  <View>
                    <View className="flex-row items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= Math.round(averageRating) ? 'star' : 'star-outline'}
                          size={13}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                    <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark mt-0.5">
                      Based on {totalCount} athlete verified reviews
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('write');
                    if (hasExistingReview) {
                      setIsComposing(false);
                    } else {
                      setIsComposing(true);
                    }
                  }}
                  className="bg-accent px-3 py-1.5 rounded-xl shadow-sm"
                >
                  <Text className="text-[11px] font-bold text-white">
                    {hasExistingReview ? 'My Stories' : '+ Share Story'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Goal Filter Chips & Sort Selector */}
              <View className="gap-2 mb-3">
                {/* Goal Filters */}
                <View className="flex-row gap-2">
                  {[
                    { key: 'ALL', label: 'All Stories' },
                    { key: 'MUSCLE_GAIN', label: 'Muscle Gain' },
                    { key: 'WEIGHT_LOSS', label: 'Fat Loss' },
                  ].map((chip) => {
                    const isActive = selectedGoalFilter === chip.key;
                    return (
                      <TouchableOpacity
                        key={chip.key}
                        onPress={() => setSelectedGoalFilter(chip.key as any)}
                        className={`px-3 py-1.5 rounded-full border ${
                          isActive
                            ? 'bg-accent/15 border-accent'
                            : 'bg-input dark:bg-input-dark border-transparent'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            isActive
                              ? 'text-accent dark:text-accent-mint'
                              : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Sort Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} className="pt-1">
                  {[
                    { key: 'featured', label: '✨ Featured' },
                    { key: 'helpful', label: '🔥 Most Inspiring' },
                    { key: 'highest_rated', label: '⭐ Top Rated' },
                    { key: 'recent', label: '🕒 Most Recent' },
                  ].map((sort) => {
                    const isCurrent = sortBy === sort.key;
                    return (
                      <TouchableOpacity
                        key={sort.key}
                        onPress={() => setSortBy(sort.key as any)}
                        className={`px-2.5 py-1 rounded-lg border ${
                          isCurrent
                            ? 'bg-accent/20 border-accent/40'
                            : 'bg-transparent border-input-border/60 dark:border-input-border-dark/60'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${
                            isCurrent
                              ? 'text-accent dark:text-accent-mint'
                              : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {sort.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Stories ScrollView */}
              {loadingFeed ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                    Loading athlete stories...
                  </Text>
                </View>
              ) : testimonials.length === 0 ? (
                <View className="flex-1 items-center justify-center py-10 px-4">
                  <Ionicons name="chatbox-ellipses-outline" size={40} color={colors.textMuted} />
                  <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-2 text-center">
                    No stories found for this filter yet
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mt-1">
                    Be the first athlete to share your fitness transformation!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('write')}
                    className="mt-4 bg-accent px-4 py-2 rounded-xl"
                  >
                    <Text className="text-xs font-bold text-white">Share Your Story</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={loadingFeed}
                      onRefresh={fetchFeed}
                      tintColor={colors.accent}
                    />
                  }
                >
                  <View className="gap-3 pb-8">
                    {testimonials.map((item) => {
                      const hasUpvoted = votedIds.has(item.id);
                      return (
                        <View
                          key={item.id}
                          className="p-4 rounded-2xl bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70 mb-3"
                        >
                          {/* Header: Avatar, Name, Rating */}
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center gap-2.5">
                              {item.avatarUrl && !item.avatarUrl.startsWith('blob:') ? (
                                <Image
                                  source={{ uri: item.avatarUrl }}
                                  className="w-8 h-8 rounded-full border border-accent/40 bg-input dark:bg-input-dark"
                                  resizeMode="cover"
                                />
                              ) : (
                                <View className="w-8 h-8 rounded-full bg-accent/15 dark:bg-accent-dark/25 items-center justify-center border border-accent/35 dark:border-accent-dark/50">
                                  <Text className="text-xs font-black text-accent dark:text-accent-mint">
                                    {item.authorName.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View>
                                <View className="flex-row items-center gap-1">
                                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                    {item.authorName}
                                  </Text>
                                  {item.verifiedAthlete !== false ? (
                                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                  ) : null}
                                </View>
                                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                                  {item.goal === 'MUSCLE_GAIN'
                                    ? 'Goal: Muscle Gain'
                                    : item.goal === 'WEIGHT_LOSS'
                                    ? 'Goal: Fat Loss'
                                    : 'FitTrack Athlete'}
                                </Text>
                              </View>
                            </View>

                            {/* Star Rating */}
                            <View className="flex-row items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons
                                  key={s}
                                  name={s <= item.rating ? 'star' : 'star-outline'}
                                  size={12}
                                  color="#F59E0B"
                                />
                              ))}
                            </View>
                          </View>

                          {/* Transformation Metrics / Badges */}
                          <View className="flex-row flex-wrap gap-1 mb-2">
                            {item.highlightBadge ? (
                              <View className="px-1.5 py-0.5 rounded-md bg-accent/15 dark:bg-accent-dark/25 border border-accent/30 dark:border-accent-dark/40">
                                <Text className="text-[9px] font-bold text-accent dark:text-accent-mint">
                                  {item.highlightBadge}
                                </Text>
                              </View>
                            ) : null}

                            {item.weightChangeKg ? (
                              <View className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 dark:border-emerald-500/40">
                                <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                  {item.weightChangeKg > 0 ? `+${item.weightChangeKg} kg` : `${item.weightChangeKg} kg`}
                                </Text>
                              </View>
                            ) : null}

                            {item.durationWeeks ? (
                              <View className="px-1.5 py-0.5 rounded-md bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/30 dark:border-purple-500/40">
                                <Text className="text-[9px] font-bold text-purple-700 dark:text-purple-300">
                                  ⏱️ {item.durationWeeks} Weeks
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Quote Content */}
                          <Text className="text-xs text-text-primary dark:text-text-primary-dark leading-relaxed mb-3 italic">
                            "{item.content}"
                          </Text>

                          {/* Footer: Date & Upvote Action */}
                          <View className="flex-row items-center justify-between pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
                            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                              Verified Transformation
                            </Text>

                            <TouchableOpacity
                              onPress={() => handleUpvote(item)}
                              activeOpacity={0.7}
                              className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${
                                hasUpvoted
                                  ? 'bg-rose-500/15 border-rose-500/35'
                                  : 'bg-surface dark:bg-surface-dark border-input-border/70 dark:border-input-border-dark/70'
                              }`}
                            >
                              <Ionicons
                                name={hasUpvoted ? 'heart' : 'heart-outline'}
                                size={12}
                                color={hasUpvoted ? '#F43F5E' : colors.textMuted}
                              />
                              <Text
                                className={`text-[10px] font-bold ${
                                  hasUpvoted ? 'text-rose-500' : 'text-text-muted dark:text-text-muted-dark'
                                }`}
                              >
                                {item.helpfulCount || 0} inspired
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          ) : (
            /* TAB 2: WRITE / EDIT STORY */
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              <View className="pb-8">
                {/* List of user's stories (when user has stories and not actively composing) */}
                {myReviews.length > 0 && !isComposing ? (
                  <View>
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-3.5">
                      <View>
                        <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                          Your Published Stories ({myReviews.length})
                        </Text>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                          Milestones you've shared with the community
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleNewStory}
                        activeOpacity={0.8}
                        className="px-3 py-1.5 rounded-xl bg-accent flex-row items-center gap-1 shadow-sm"
                      >
                        <Ionicons name="add" size={14} color="#FFFFFF" />
                        <Text className="text-xs font-bold text-white">
                          New Story
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* List of User's Story Cards */}
                    {myReviews.map((item, index) => (
                      <View
                        key={item.id}
                        className="p-4 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark mb-3 shadow-sm"
                      >
                        {/* Top row: Rating, Story Number, and Edit Story Button */}
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center gap-1.5">
                            <View className="flex-row items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons
                                  key={s}
                                  name={s <= item.rating ? 'star' : 'star-outline'}
                                  size={13}
                                  color="#F59E0B"
                                />
                              ))}
                            </View>
                            <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark ml-1">
                              Story #{index + 1}
                            </Text>
                          </View>

                          {/* Top-Right "Edit Story" Button */}
                          <TouchableOpacity
                            onPress={() => handleSelectStory(item)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30"
                          >
                            <Ionicons name="pencil" size={12} color={colors.accent} />
                            <Text className="text-[11px] font-bold text-accent dark:text-accent-mint">
                              Edit Story
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Highlight Badge */}
                        {item.highlightBadge ? (
                          <View className="flex-row mb-2">
                            <View className="px-2 py-0.5 rounded-md bg-accent/15 dark:bg-accent-dark/25 border border-accent/30">
                              <Text className="text-[10px] font-bold text-accent dark:text-accent-mint">
                                {item.highlightBadge}
                              </Text>
                            </View>
                          </View>
                        ) : null}

                        {/* Quote Content */}
                        <Text className="text-xs text-text-primary dark:text-text-primary-dark leading-relaxed mb-3 italic">
                          "{item.content}"
                        </Text>

                        {/* Footer: Metrics and Inspired count */}
                        <View className="flex-row items-center justify-between pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
                          <View className="flex-row flex-wrap gap-1.5">
                            {item.weightChangeKg != null ? (
                              <View className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                                <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                  {item.weightChangeKg > 0 ? `+${item.weightChangeKg} kg` : `${item.weightChangeKg} kg`}
                                </Text>
                              </View>
                            ) : null}
                            {item.durationWeeks != null ? (
                              <View className="px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30">
                                <Text className="text-[9px] font-bold text-purple-700 dark:text-purple-300">
                                  ⏱️ {item.durationWeeks} Weeks
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <View className="flex-row items-center gap-1">
                            <Ionicons name="heart" size={11} color="#F43F5E" />
                            <Text className="text-[10px] font-medium text-text-muted dark:text-text-muted-dark">
                              {item.helpfulCount || 0} inspired
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Action card to add another story */}
                    <TouchableOpacity
                      onPress={handleNewStory}
                      activeOpacity={0.8}
                      className="p-3.5 rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 items-center justify-center flex-row gap-2 mt-1"
                    >
                      <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                      <Text className="text-xs font-bold text-accent dark:text-accent-mint">
                        Share Another Milestone Story
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* COMPOSER / EDITOR FORM */
                  <View>
                    {/* Back to Stories Header (if existing stories) */}
                    {myReviews.length > 0 && (
                      <View className="flex-row items-center justify-between mb-3.5 pb-2 border-b border-input-border/60 dark:border-input-border-dark/60">
                        <TouchableOpacity
                          onPress={() => {
                            setIsComposing(false);
                            setEditingId(null);
                          }}
                          activeOpacity={0.7}
                          className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                        >
                          <Ionicons name="chevron-back" size={14} color={colors.accent} />
                          <Text className="text-xs font-bold text-accent dark:text-accent-mint">
                            Back to My Stories
                          </Text>
                        </TouchableOpacity>

                        <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                          {editingId ? 'Editing Story' : 'New Milestone Story'}
                        </Text>
                      </View>
                    )}

                    {/* Intro Card + Auto-Fill Button */}
                    <View className="p-3.5 rounded-2xl bg-input dark:bg-input-dark mb-4 border border-input-border dark:border-input-border-dark">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                          {editingId ? 'Edit Selected Story' : 'Write a Transformation Story'}
                        </Text>
                        <TouchableOpacity
                          onPress={handleAutoFill}
                          activeOpacity={0.7}
                          className="px-2 py-1 rounded-lg bg-accent/15 border border-accent/30 flex-row items-center gap-1"
                        >
                          <Ionicons name="sparkles" size={11} color={colors.accent} />
                          <Text className="text-[10px] font-bold text-accent dark:text-accent-mint">
                            Auto-Fill
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-relaxed">
                        Share your experience with workouts, nutrition tracking, or AI coach recommendations.
                      </Text>
                    </View>

                    {/* Rating Selector */}
                    <View className="mb-4">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                        Overall Experience
                      </Text>
                      <View className="flex-row items-center justify-between p-3 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark">
                        <View className="flex-row items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <TouchableOpacity
                              key={s}
                              onPress={() => setRating(s)}
                              className="p-1"
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={s <= rating ? 'star' : 'star-outline'}
                                size={28}
                                color="#F59E0B"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                        <Text className="text-[11px] font-semibold text-accent dark:text-accent-mint">
                          {getRatingLabel(rating)}
                        </Text>
                      </View>
                    </View>

                    {/* Optional Metric Inputs: Weight Change & Duration */}
                    <View className="flex-row gap-2.5 mb-4">
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1.5">
                          Weight Change (kg)
                        </Text>
                        <TextInput
                          value={weightChangeKg}
                          onChangeText={setWeightChangeKg}
                          placeholder="e.g. -6.5 or +3.0"
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          keyboardType="numeric"
                          className="p-3 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border border-input-border dark:border-input-border-dark"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1.5">
                          Duration (Weeks)
                        </Text>
                        <TextInput
                          value={durationWeeks}
                          onChangeText={setDurationWeeks}
                          placeholder="e.g. 12"
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          keyboardType="number-pad"
                          className="p-3 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border border-input-border dark:border-input-border-dark"
                        />
                      </View>
                    </View>

                    {/* Testimony Input */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                          Your Transformation or Review
                        </Text>
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          {content.length}/500
                        </Text>
                      </View>
                      <TextInput
                        multiline
                        numberOfLines={4}
                        value={content}
                        onChangeText={setContent}
                        placeholder="Tell us what you accomplished with FitTrack, how the AI coach helped, or your favorite feature..."
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        textAlignVertical="top"
                        className="p-3.5 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border border-input-border dark:border-input-border-dark min-h-[110px]"
                      />
                    </View>

                    {/* Achievement Badge (Optional) */}
                    <View className="mb-5">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1.5">
                        Milestone or Achievement Badge (Optional)
                      </Text>
                      <TextInput
                        value={highlightBadge}
                        onChangeText={setHighlightBadge}
                        placeholder="e.g. 🏆 +15kg Bench PR or 🔥 -5kg in 8 Weeks"
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        className="p-3 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border border-input-border dark:border-input-border-dark mb-2.5"
                      />

                      {/* Preset quick suggestions */}
                      <View className="flex-row flex-wrap gap-1.5">
                        {PRESET_BADGES.map((badge) => (
                          <TouchableOpacity
                            key={badge}
                            onPress={() => setHighlightBadge(badge)}
                            className="px-2.5 py-1 rounded-full bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70"
                          >
                            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                              {badge}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full min-h-[48px] py-3.5 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20 mb-3"
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-xs font-bold text-white">
                          {editingId ? 'Update This Story' : 'Publish Story'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Delete Option if currently editing an existing review */}
                    {editingId ? (
                      <TouchableOpacity
                        onPress={handleDelete}
                        disabled={isSubmitting}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="w-full min-h-[44px] py-2.5 rounded-2xl items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-xs font-semibold text-danger dark:text-danger-dark">
                          Remove This Story
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
