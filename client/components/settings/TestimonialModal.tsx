import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { convertBlobToDataUrl } from '@/utils/imageUtils';
import { triggerHapticFeedback } from '@/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import ModalCloseButton from '../ui/ModalCloseButton';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';
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
  const insets = useSafeAreaInsets();

  const storageKey = `@fittrack_testimonial_votes_${user?.id || 'guest'}`;
  const myStoriesCacheKey = `@fittrack_user_stories_cache_${user?.id || 'guest'}`;

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
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>('');
  const [afterImageUrl, setAfterImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasExistingReview, setHasExistingReview] = useState<boolean>(false);
  const [loadingMyReview, setLoadingMyReview] = useState<boolean>(false);
  const [myReviews, setMyReviews] = useState<TestimonialItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [publishImmediately, setPublishImmediately] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ uri: string; label: string; author: string } | null>(null);

  // Form Validation State
  const [formErrors, setFormErrors] = useState<{
    content?: string;
    weightChangeKg?: string;
    durationWeeks?: string;
    highlightBadge?: string;
  }>({});

  const clearError = (field: 'content' | 'weightChangeKg' | 'durationWeeks' | 'highlightBadge') => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      content?: string;
      weightChangeKg?: string;
      durationWeeks?: string;
      highlightBadge?: string;
    } = {};

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      errors.content = 'Please share a few words about your journey.';
    } else if (trimmedContent.length < 8) {
      errors.content = 'Story must be at least 8 characters long.';
    } else if (trimmedContent.length > 500) {
      errors.content = 'Story cannot exceed 500 characters.';
    }

    const trimmedWeight = weightChangeKg.trim();
    if (trimmedWeight) {
      const parsedWeight = parseFloat(trimmedWeight);
      if (isNaN(parsedWeight)) {
        errors.weightChangeKg = 'Enter a valid number (e.g. -5.0 or +3.5).';
      } else if (parsedWeight < -100 || parsedWeight > 100) {
        errors.weightChangeKg = 'Weight change must be between -100 and +100 kg.';
      }
    }

    const trimmedWeeks = durationWeeks.trim();
    if (trimmedWeeks) {
      const parsedWeeks = Number(trimmedWeeks);
      if (!/^\d+$/.test(trimmedWeeks) || isNaN(parsedWeeks)) {
        errors.durationWeeks = 'Enter a whole number of weeks (e.g. 12).';
      } else if (parsedWeeks < 1 || parsedWeeks > 520) {
        errors.durationWeeks = 'Duration must be between 1 and 520 weeks.';
      }
    }

    const trimmedBadge = highlightBadge.trim();
    if (trimmedBadge && trimmedBadge.length > 60) {
      errors.highlightBadge = 'Badge title cannot exceed 60 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isAdmin = user?.role === 'ADMIN';

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

  const fetchFeed = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && testimonials.length === 0) {
        setLoadingFeed(true);
      }
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
  }, [selectedGoalFilter, sortBy, storageKey, testimonials.length]);

  const handleNewStory = useCallback(() => {
    setEditingId(null);
    setContent('');
    setHighlightBadge('');
    setWeightChangeKg('');
    setDurationWeeks('');
    setBeforeImageUrl('');
    setAfterImageUrl('');
    setRating(5);
    setFormErrors({});
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
    setBeforeImageUrl(rev.beforeImageUrl || '');
    setAfterImageUrl(rev.afterImageUrl || '');
    setFormErrors({});
    setIsComposing(true);
    setActiveTab('write');
  }, []);

  const loadStoredUserStories = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(myStoriesCacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMyReviews(parsed);
          setHasExistingReview(true);
        }
      }
    } catch {
      // Ignored
    }
  }, [myStoriesCacheKey]);

  const fetchMyReview = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingMyReview(true);
      const res = (await getMyTestimonialApi()) as any;
      const list: TestimonialItem[] = res.testimonials || (res.testimonial ? [res.testimonial] : []);
      setMyReviews(list);
      setHasExistingReview(list.length > 0);
      AsyncStorage.setItem(myStoriesCacheKey, JSON.stringify(list)).catch(() => {});
      if (list.length > 0) {
        setIsComposing(false);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingMyReview(false);
    }
  }, [user, myStoriesCacheKey]);

  // Handle modal opening and initial tab setup
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      loadStoredVotes();
      loadStoredUserStories();
      fetchFeed(testimonials.length > 0);
      fetchMyReview();
      setIsComposing(false);
    }
  }, [visible, initialTab, loadStoredVotes, loadStoredUserStories, fetchFeed, fetchMyReview]);

  // Refetch feed when filter or sorting changes
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (visible) {
      fetchFeed(false);
    }
  }, [selectedGoalFilter, sortBy]);

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

  const handlePickImage = async (type: 'before' | 'after') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showError('Permission Required', 'Please allow access to your photo library in device settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.65,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let persistentUri = '';
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          persistentUri = `data:${mime};base64,${asset.base64}`;
        } else {
          persistentUri = await convertBlobToDataUrl(asset.uri);
        }

        if (type === 'before') {
          setBeforeImageUrl(persistentUri);
        } else {
          setAfterImageUrl(persistentUri);
        }
      }
    } catch {
      showError('Error', 'Failed to pick photo from gallery.');
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
    setFormErrors({});
    showSuccess('Auto-Filled!', 'Generated a starter template tailored to your journey.');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Validation Error', 'Please check the highlighted fields below.');
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
        beforeImageUrl: beforeImageUrl.trim() || undefined,
        afterImageUrl: afterImageUrl.trim() || undefined,
        publishImmediately: isAdmin ? publishImmediately : false,
      });

      DeviceEventEmitter.emit('testimonials:updated');
      showSuccess(
        isAdmin && publishImmediately ? 'Published!' : 'Submitted for Review',
        res.message || 'Thank you for sharing your transformation story!'
      );
      setHasExistingReview(true);
      fetchFeed();
      await fetchMyReview();
      setIsComposing(false);
      setEditingId(null);
      if (!isAdmin || !publishImmediately) {
        setActiveTab('write');
      } else {
        setActiveTab('feed');
      }
    } catch (err: any) {
      showError('Submission Error', getFriendlyErrorMessage(err, 'Failed to submit testimony. Please try again.'));
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
      showError('Error', getFriendlyErrorMessage(err, 'Failed to delete testimony. Please try again.'));
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

  // Clicking outside / on the backdrop dismisses the keyboard, but NEVER closes the modal
  const handleBackdropPress = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
      >
        <Pressable
          className="absolute inset-0"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleBackdropPress}
          accessible={false}
        />

        <View
          style={{ paddingTop: Platform.OS !== 'web' && insets.top > 0 ? insets.top + 8 : 16 }}
          className="bg-surface dark:bg-surface-dark flex-1 md:flex-none h-full md:h-[92%] w-full md:max-w-2xl rounded-none md:rounded-3xl p-4 md:p-6 border-0 md:border border-input-border dark:border-input-border-dark shadow-2xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-1 pr-2 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                  Athlete Transformation Stories
                </Text>
              </View>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5" numberOfLines={1}>
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
                if (myReviews.length > 0) {
                  setIsComposing(false);
                }
                fetchMyReview();
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
                {myReviews.length > 0 ? 'My Stories' : 'Share Story'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: COMMUNITY STORIES FEED */}
          {activeTab === 'feed' ? (
            <View className="flex-1 min-h-0">
              {/* Rating Summary Banner (Fixed) */}
              <View className="p-3 rounded-2xl bg-input/80 dark:bg-input-dark/80 border border-input-border/70 dark:border-input-border-dark/70 mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-xl px-2.5 py-1.5 shadow-2xs gap-1.5">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                      {averageRating.toFixed(1)}
                    </Text>
                  </View>
                  <View>
                    <View className="flex-row items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= Math.round(averageRating) ? 'star' : 'star-outline'}
                          size={12}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                    <Text className="text-xs font-medium text-text-muted dark:text-text-muted-dark mt-0.5">
                      Based on {totalCount} athlete verified reviews
                    </Text>
                  </View>
                </View>
              </View>

              {/* Goal Filter Chips & Sort Selector (Fixed) */}
              <View className="gap-2 mb-3.5">
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
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        className={`min-h-[32px] flex justify-center items-center px-3.5 py-1.5 rounded-full border ${
                          isActive
                            ? 'bg-accent/15 border-accent'
                            : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} className="pt-0.5">
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
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        className={`min-h-[30px] flex justify-center items-center px-3 py-1 rounded-xl border ${
                          isCurrent
                            ? 'bg-accent/20 border-accent/40'
                            : 'bg-transparent border-input-border/70 dark:border-input-border-dark/70'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
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

              {/* Scrollable Stories Feed */}
              {loadingFeed && testimonials.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                    Loading athlete stories...
                  </Text>
                </View>
              ) : testimonials.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12 px-4">
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
                  contentContainerStyle={{ paddingBottom: 24 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={loadingFeed}
                      onRefresh={fetchFeed}
                      tintColor={colors.accent}
                    />
                  }
                >
                  <View className="gap-3 pb-4">
                    {/* User's Own Story Card (if user has submitted stories) */}
                    {myReviews.length > 0 && (
                      <View className="p-4 rounded-2xl bg-accent/10 dark:bg-accent-dark/15 border-2 border-accent/40 dark:border-accent-dark/50 mb-3 shadow-xs">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center gap-1.5">
                            <Ionicons name="person-circle" size={18} color={colors.accent} />
                            <Text
                              className="text-xs font-black"
                              style={{ color: colors.accent }}
                            >
                              Your Milestone Story
                            </Text>
                          </View>
                          {myReviews[0].status === 'APPROVED' && (
                            <View className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                              <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ Live & Public
                              </Text>
                            </View>
                          )}
                          {myReviews[0].status === 'PENDING_APPROVAL' && (
                            <View className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                              <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                ⏳ Pending Review
                              </Text>
                            </View>
                          )}
                          {myReviews[0].status === 'REJECTED' && (
                            <View className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40">
                              <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                ✕ Changes Requested
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          className="text-xs italic leading-relaxed mb-2.5"
                          style={{ color: colors.textPrimary }}
                          numberOfLines={2}
                        >
                          "{myReviews[0].content}"
                        </Text>

                        <View className="flex-row items-center justify-between pt-2 border-t border-accent/20">
                          <Text
                            className="text-[10px] font-medium"
                            style={{ color: colors.textMuted }}
                          >
                            {myReviews.length > 1
                              ? `You have ${myReviews.length} stories`
                              : 'Submitted by You'}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setActiveTab('write');
                              setIsComposing(false);
                            }}
                            activeOpacity={0.7}
                            className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/35"
                          >
                            <Ionicons name="eye-outline" size={12} color={colors.accent} />
                            <Text
                              className="text-[11px] font-bold"
                              style={{ color: colors.accent }}
                            >
                              Manage My Stories
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

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

                          {/* Before & After Photo Preview */}
                          {(item.beforeImageUrl || item.afterImageUrl) ? (
                            <View className="flex-row items-center gap-2 mb-3">
                              {item.beforeImageUrl ? (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    setPreviewPhoto({
                                      uri: item.beforeImageUrl!,
                                      label: 'Before Transformation',
                                      author: item.authorName,
                                    })
                                  }
                                  className="flex-1 h-28 rounded-xl overflow-hidden border border-input-border dark:border-input-border-dark relative bg-input dark:bg-input-dark"
                                >
                                  <Image
                                    source={{ uri: item.beforeImageUrl }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                  />
                                  <View className="absolute bottom-1.5 left-1.5 bg-black/75 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                                    <Ionicons name="expand-outline" size={10} color="#FFFFFF" />
                                    <Text className="text-[9px] font-black text-white uppercase">Before</Text>
                                  </View>
                                </TouchableOpacity>
                              ) : null}
                              {item.afterImageUrl ? (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    setPreviewPhoto({
                                      uri: item.afterImageUrl!,
                                      label: 'After Transformation',
                                      author: item.authorName,
                                    })
                                  }
                                  className="flex-1 h-28 rounded-xl overflow-hidden border border-accent/40 relative bg-input dark:bg-input-dark"
                                >
                                  <Image
                                    source={{ uri: item.afterImageUrl }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                  />
                                  <View className="absolute bottom-1.5 left-1.5 bg-accent px-2 py-0.5 rounded-md flex-row items-center gap-1">
                                    <Ionicons name="expand-outline" size={10} color="#FFFFFF" />
                                    <Text className="text-[9px] font-black text-white uppercase">After</Text>
                                  </View>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          ) : null}

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
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {loadingMyReview && myReviews.length === 0 ? (
                <View className="py-16 items-center justify-center">
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2 font-medium">
                    Loading your stories...
                  </Text>
                </View>
              ) : (
                <View>
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
                            {item.status === 'PENDING_APPROVAL' && (
                              <View className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                                <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                  ⏳ Pending Admin Review
                                </Text>
                              </View>
                            )}
                            {item.status === 'APPROVED' && (
                              <View className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                                <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Published
                                </Text>
                              </View>
                            )}
                            {item.status === 'REJECTED' && (
                              <View className="px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30">
                                <Text className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
                                  ✕ Changes Requested
                                </Text>
                              </View>
                            )}
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

                        {/* Before & After Photos Preview in My Stories */}
                        {(item.beforeImageUrl || item.afterImageUrl) ? (
                          <View className="flex-row items-center gap-2 mb-2.5">
                            {item.beforeImageUrl ? (
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() =>
                                  setPreviewPhoto({
                                    uri: item.beforeImageUrl!,
                                    label: 'Before Transformation',
                                    author: user?.firstName || 'My',
                                  })
                                }
                                className="flex-1 h-20 rounded-xl overflow-hidden border border-input-border dark:border-input-border-dark relative bg-surface dark:bg-surface-dark"
                              >
                                <Image source={{ uri: item.beforeImageUrl }} className="w-full h-full" resizeMode="cover" />
                                <View className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                                  <Ionicons name="expand-outline" size={8} color="#FFFFFF" />
                                  <Text className="text-[8px] font-bold text-white uppercase">Before</Text>
                                </View>
                              </TouchableOpacity>
                            ) : null}
                            {item.afterImageUrl ? (
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() =>
                                  setPreviewPhoto({
                                    uri: item.afterImageUrl!,
                                    label: 'After Transformation',
                                    author: user?.firstName || 'My',
                                  })
                                }
                                className="flex-1 h-20 rounded-xl overflow-hidden border border-accent/40 relative bg-surface dark:bg-surface-dark"
                              >
                                <Image source={{ uri: item.afterImageUrl }} className="w-full h-full" resizeMode="cover" />
                                <View className="absolute bottom-1 left-1 bg-accent px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                                  <Ionicons name="expand-outline" size={8} color="#FFFFFF" />
                                  <Text className="text-[8px] font-bold text-white uppercase">After</Text>
                                </View>
                              </TouchableOpacity>
                            ) : null}
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
                          onChangeText={(val) => {
                            setWeightChangeKg(val);
                            clearError('weightChangeKg');
                          }}
                          placeholder="e.g. -6.5 or +3.0"
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          keyboardType="numeric"
                          className={`p-3 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border ${
                            formErrors.weightChangeKg
                              ? 'border-danger dark:border-danger-dark'
                              : 'border-input-border dark:border-input-border-dark'
                          }`}
                        />
                        {formErrors.weightChangeKg ? (
                          <View className="flex-row items-center gap-1 mt-1.5 ml-1">
                            <Ionicons name="alert-circle" size={12} color={colors.danger} />
                            <Text className="text-[10px] font-semibold text-danger dark:text-danger-dark flex-1">
                              {formErrors.weightChangeKg}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1.5">
                          Duration (Weeks)
                        </Text>
                        <TextInput
                          value={durationWeeks}
                          onChangeText={(val) => {
                            setDurationWeeks(val);
                            clearError('durationWeeks');
                          }}
                          placeholder="e.g. 12"
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          keyboardType="number-pad"
                          className={`p-3 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border ${
                            formErrors.durationWeeks
                              ? 'border-danger dark:border-danger-dark'
                              : 'border-input-border dark:border-input-border-dark'
                          }`}
                        />
                        {formErrors.durationWeeks ? (
                          <View className="flex-row items-center gap-1 mt-1.5 ml-1">
                            <Ionicons name="alert-circle" size={12} color={colors.danger} />
                            <Text className="text-[10px] font-semibold text-danger dark:text-danger-dark flex-1">
                              {formErrors.durationWeeks}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Testimony Input */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                            Your Transformation or Review
                          </Text>
                          <Text className="text-danger dark:text-danger-dark text-xs font-bold">*</Text>
                        </View>
                        <Text
                          className={`text-[10px] font-medium ${
                            content.length > 500
                              ? 'text-danger dark:text-danger-dark font-bold'
                              : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {content.length}/500
                        </Text>
                      </View>
                      <TextInput
                        multiline
                        numberOfLines={4}
                        value={content}
                        onChangeText={(val) => {
                          setContent(val);
                          clearError('content');
                        }}
                        placeholder="Tell us what you accomplished with FitTrack, how the AI coach helped, or your favorite feature..."
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        textAlignVertical="top"
                        className={`p-3.5 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border min-h-[110px] ${
                          formErrors.content
                            ? 'border-danger dark:border-danger-dark'
                            : 'border-input-border dark:border-input-border-dark'
                        }`}
                      />
                      {formErrors.content ? (
                        <View className="flex-row items-center gap-1 mt-1.5 ml-1">
                          <Ionicons name="alert-circle" size={13} color={colors.danger} />
                          <Text className="text-[11px] font-semibold text-danger dark:text-danger-dark flex-1">
                            {formErrors.content}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Achievement Badge (Optional) */}
                    <View className="mb-5">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                          Milestone or Achievement Badge (Optional)
                        </Text>
                        {highlightBadge.length > 0 && (
                          <Text
                            className={`text-[10px] ${
                              highlightBadge.length > 60
                                ? 'text-danger dark:text-danger-dark font-bold'
                                : 'text-text-muted dark:text-text-muted-dark'
                            }`}
                          >
                            {highlightBadge.length}/60
                          </Text>
                        )}
                      </View>
                      <TextInput
                        value={highlightBadge}
                        onChangeText={(val) => {
                          setHighlightBadge(val);
                          clearError('highlightBadge');
                        }}
                        placeholder="e.g. 🏆 +15kg Bench PR or 🔥 -5kg in 8 Weeks"
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        className={`p-3 rounded-2xl bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark text-xs border mb-2.5 ${
                          formErrors.highlightBadge
                            ? 'border-danger dark:border-danger-dark'
                            : 'border-input-border dark:border-input-border-dark'
                        }`}
                      />
                      {formErrors.highlightBadge ? (
                        <View className="flex-row items-center gap-1 mb-2 ml-1">
                          <Ionicons name="alert-circle" size={13} color={colors.danger} />
                          <Text className="text-[11px] font-semibold text-danger dark:text-danger-dark flex-1">
                            {formErrors.highlightBadge}
                          </Text>
                        </View>
                      ) : null}

                      {/* Preset quick suggestions */}
                      <View className="flex-row flex-wrap gap-1.5">
                        {PRESET_BADGES.map((badge) => (
                          <TouchableOpacity
                            key={badge}
                            onPress={() => {
                              setHighlightBadge(badge);
                              clearError('highlightBadge');
                            }}
                            className="px-2.5 py-1 rounded-full bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70"
                          >
                            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                              {badge}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Before & After Transformation Photos (Optional) */}
                    <View className="mb-5 p-3.5 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                          Before & After Photos (Optional)
                        </Text>
                        <Text className="text-[10px] text-accent dark:text-accent-mint font-semibold">
                          Community Verified
                        </Text>
                      </View>
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mb-3">
                        Upload photos from your gallery. Photos are reviewed by admins before publishing to keep our community safe.
                      </Text>

                      <View className="flex-row gap-3">
                        {/* Before Photo Card */}
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-1.5">
                            Before Photo
                          </Text>
                          {beforeImageUrl.trim() ? (
                            <View className="h-28 rounded-xl overflow-hidden border border-input-border dark:border-input-border-dark relative bg-surface dark:bg-surface-dark">
                              <Image source={{ uri: beforeImageUrl.trim() }} className="w-full h-full" resizeMode="cover" />
                              <View className="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded">
                                <Text className="text-[8px] font-bold text-white uppercase">Before</Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => setBeforeImageUrl('')}
                                activeOpacity={0.8}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
                              >
                                <Ionicons name="close" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handlePickImage('before')}
                              activeOpacity={0.7}
                              className="h-28 rounded-xl border border-dashed border-input-border dark:border-input-border-dark items-center justify-center bg-surface dark:bg-surface-dark px-2 gap-1.5"
                            >
                              <View className="w-8 h-8 rounded-full bg-accent/10 dark:bg-accent-dark/20 items-center justify-center">
                                <Ionicons name="image-outline" size={16} color={colors.accent} />
                              </View>
                              <Text className="text-[10px] font-bold text-accent dark:text-accent-mint text-center">
                                Choose Photo
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* After Photo Card */}
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark mb-1.5">
                            After Photo
                          </Text>
                          {afterImageUrl.trim() ? (
                            <View className="h-28 rounded-xl overflow-hidden border border-accent/40 relative bg-surface dark:bg-surface-dark">
                              <Image source={{ uri: afterImageUrl.trim() }} className="w-full h-full" resizeMode="cover" />
                              <View className="absolute bottom-1.5 left-1.5 bg-accent px-1.5 py-0.5 rounded">
                                <Text className="text-[8px] font-bold text-white uppercase">After</Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => setAfterImageUrl('')}
                                activeOpacity={0.8}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
                              >
                                <Ionicons name="close" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handlePickImage('after')}
                              activeOpacity={0.7}
                              className="h-28 rounded-xl border border-dashed border-accent/40 items-center justify-center bg-accent/5 dark:bg-accent-dark/10 px-2 gap-1.5"
                            >
                              <View className="w-8 h-8 rounded-full bg-accent/20 dark:bg-accent-dark/30 items-center justify-center">
                                <Ionicons name="sparkles" size={16} color={colors.accent} />
                              </View>
                              <Text className="text-[10px] font-bold text-accent dark:text-accent-mint text-center">
                                Choose Photo
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Submit Button */}
                    {/* Admin Publish Option (Only for Admins) */}
                    {isAdmin && (
                      <View className="mb-3 p-3 rounded-xl bg-accent/10 border border-accent/25">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-2">
                            <Text className="text-xs font-bold text-accent dark:text-accent-mint">
                              ⚡ Admin Moderation Routing
                            </Text>
                            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
                              {publishImmediately
                                ? 'Will publish directly to Community Feed.'
                                : 'Will route to Story Moderation queue for review.'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              triggerHapticFeedback();
                              setPublishImmediately((prev) => !prev);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg border flex-row items-center gap-1.5 ${
                              publishImmediately
                                ? 'bg-accent border-accent'
                                : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                            }`}
                          >
                            <Ionicons
                              name={publishImmediately ? 'checkmark-circle' : 'time-outline'}
                              size={13}
                              color={publishImmediately ? '#FFFFFF' : colors.textMuted}
                            />
                            <Text
                              className={`text-[10px] font-bold ${
                                publishImmediately ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                              }`}
                            >
                              {publishImmediately ? 'Publish Live' : 'Queue for Review'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

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
                          {editingId
                            ? 'Update This Story'
                            : !isAdmin || !publishImmediately
                            ? 'Submit for Admin Approval'
                            : 'Publish Story Live'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {!isAdmin && (
                      <View className="flex-row items-center justify-center gap-1.5 mb-3 px-2">
                        <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark text-center">
                          Stories are reviewed by moderators before appearing in Community Stories.
                        </Text>
                      </View>
                    )}

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
            )}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>

      {/* Full-Screen Photo Zoom / Lightbox Modal */}
      {previewPhoto && (
        <Modal
          visible={Boolean(previewPhoto)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewPhoto(null)}
        >
          <View className="flex-1 bg-black/95 items-center justify-center p-4">
            <View className="w-full max-w-lg flex-row items-center justify-between mb-3 px-1">
              <View>
                <Text className="text-white font-extrabold text-sm">
                  {previewPhoto.author}'s Transformation
                </Text>
                <Text className="text-white/70 text-xs">
                  {previewPhoto.label}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewPhoto(null)}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="w-full max-w-lg h-4/5 rounded-2xl overflow-hidden bg-black/40 items-center justify-center">
              <Image
                source={{ uri: previewPhoto.uri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}
