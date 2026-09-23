import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import ModalCloseButton from '../ui/ModalCloseButton';
import {
  getTestimonialsApi,
  getMyTestimonialApi,
  submitTestimonialApi,
  deleteMyTestimonialApi,
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
];

export default function TestimonialModal({
  visible,
  onClose,
  initialTab = 'feed',
}: TestimonialModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'feed' | 'write'>(initialTab);
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<'ALL' | 'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('ALL');

  // Feed State
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);

  // User Submission State
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>('');
  const [highlightBadge, setHighlightBadge] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasExistingReview, setHasExistingReview] = useState<boolean>(false);
  const [loadingMyReview, setLoadingMyReview] = useState<boolean>(false);

  const fetchFeed = useCallback(async () => {
    try {
      setLoadingFeed(true);
      const goalQuery =
        selectedGoalFilter === 'ALL' ? undefined : selectedGoalFilter;
      const res = await getTestimonialsApi(goalQuery);
      setTestimonials(res.testimonials || []);
      setAverageRating(res.averageRating || 5.0);
      setTotalCount(res.totalCount || res.testimonials?.length || 0);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingFeed(false);
    }
  }, [selectedGoalFilter]);

  const fetchMyReview = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingMyReview(true);
      const res = await getMyTestimonialApi();
      if (res.testimonial) {
        setHasExistingReview(true);
        setRating(res.testimonial.rating);
        setContent(res.testimonial.content);
        setHighlightBadge(res.testimonial.highlightBadge || '');
      } else {
        setHasExistingReview(false);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingMyReview(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      fetchFeed();
      fetchMyReview();
    }
  }, [visible, initialTab, fetchFeed, fetchMyReview]);

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
      const res = await submitTestimonialApi({
        rating,
        content: content.trim(),
        highlightBadge: highlightBadge.trim() || undefined,
        goal: (user?.goal === 'MUSCLE_GAIN' || user?.goal === 'WEIGHT_LOSS') ? user.goal : undefined,
      });

      showSuccess('Success', res.message || 'Thank you for sharing your journey!');
      setHasExistingReview(true);
      fetchFeed();
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
      await deleteMyTestimonialApi();
      showSuccess('Removed', 'Your testimony has been deleted.');
      setHasExistingReview(false);
      setContent('');
      setHighlightBadge('');
      setRating(5);
      fetchFeed();
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark h-[88%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <View className="flex-row items-center space-x-1.5">
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
              className={`flex-1 py-2 rounded-xl items-center justify-center flex-row space-x-1.5 ${
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
              onPress={() => setActiveTab('write')}
              className={`flex-1 py-2 rounded-xl items-center justify-center flex-row space-x-1.5 ${
                activeTab === 'write'
                  ? 'bg-surface dark:bg-surface-dark shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="create-outline"
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
                {hasExistingReview ? 'Edit Your Story' : 'Share Your Story'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: COMMUNITY STORIES FEED */}
          {activeTab === 'feed' ? (
            <View className="flex-1">
              {/* Rating Summary Card */}
              <View className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20 mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center space-x-3">
                  <View className="items-center justify-center bg-accent/20 rounded-xl px-2.5 py-1.5">
                    <Text className="text-xl font-black text-accent dark:text-accent-mint">
                      {averageRating.toFixed(1)}
                    </Text>
                  </View>
                  <View>
                    <View className="flex-row items-center space-x-0.5">
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
                  onPress={() => setActiveTab('write')}
                  className="bg-accent px-3 py-1.5 rounded-xl shadow-sm"
                >
                  <Text className="text-[11px] font-bold text-white">
                    {hasExistingReview ? 'Edit Yours' : '+ Write Story'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Goal Filter Chips */}
              <View className="flex-row space-x-2 mb-3">
                {[
                  { key: 'ALL', label: 'All Stories' },
                  { key: 'MUSCLE_GAIN', label: 'Muscle Gain' },
                  { key: 'WEIGHT_LOSS', label: 'Weight Loss' },
                ].map((chip) => {
                  const isActive = selectedGoalFilter === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      onPress={() => setSelectedGoalFilter(chip.key as any)}
                      className={`px-3 py-1.5 rounded-full border ${
                        isActive
                          ? 'bg-accent/15 border-accent text-accent'
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
                  <View className="space-y-3 pb-8">
                    {testimonials.map((item) => (
                      <View
                        key={item.id}
                        className="p-4 rounded-2xl bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70 mb-3"
                      >
                        {/* Header: Avatar, Name, Rating */}
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center space-x-2.5">
                            <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center">
                              <Text className="text-xs font-extrabold text-accent dark:text-accent-mint">
                                {item.authorName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                {item.authorName}
                              </Text>
                              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                                {item.goal === 'MUSCLE_GAIN'
                                  ? 'Goal: Muscle Gain'
                                  : item.goal === 'WEIGHT_LOSS'
                                  ? 'Goal: Weight Loss'
                                  : 'FitTrack Athlete'}
                              </Text>
                            </View>
                          </View>

                          {/* Star Rating */}
                          <View className="flex-row items-center space-x-0.5">
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

                        {/* Quote Content */}
                        <Text className="text-xs text-text-primary dark:text-text-primary-dark leading-relaxed mb-2.5 italic">
                          "{item.content}"
                        </Text>

                        {/* Footer: Achievement Badge */}
                        {item.highlightBadge ? (
                          <View className="self-start px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25">
                            <Text className="text-[10px] font-semibold text-accent dark:text-accent-mint">
                              {item.highlightBadge}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ))}
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
                {/* Intro */}
                <View className="p-3.5 rounded-2xl bg-input dark:bg-input-dark mb-4 border border-input-border dark:border-input-border-dark">
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
                    {hasExistingReview ? 'Update Your Testimony' : 'Inspire Fellow Athletes'}
                  </Text>
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
                    <View className="flex-row items-center space-x-1.5">
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

                {/* Testimony Input */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      Your Transformation or Review
                    </Text>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      {content.length}/1000
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
                  className="w-full py-3.5 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20 mb-3"
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-xs font-bold text-white">
                      {hasExistingReview ? 'Update Testimony' : 'Publish My Testimony'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Delete Option if review exists */}
                {hasExistingReview ? (
                  <TouchableOpacity
                    onPress={handleDelete}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-2xl items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-danger dark:text-danger-dark">
                      Remove My Testimony
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
