import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SurfaceCard from '../ui/SurfaceCard';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  getTestimonialsApi,
  toggleHelpfulTestimonialApi,
  TestimonialItem,
} from '@/api/testimonial';

interface CommunityStoriesCardProps {
  onOpenFeed: () => void;
  onOpenWrite: () => void;
}

export default function CommunityStoriesCard({
  onOpenFeed,
  onOpenWrite,
}: CommunityStoriesCardProps) {
  const { colors } = useThemeColors();
  const { showSuccess } = useToast();
  const { user } = useAuth();

  const storageKey = `@fittrack_testimonial_votes_${user?.id || 'guest'}`;

  const [stories, setStories] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

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

  const loadStories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTestimonialsApi(undefined, 'featured', 6);
      if (res.testimonials) {
        setStories(res.testimonials);

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
    } catch {
      // Fallback silently if offline or network error
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    loadStoredVotes();
    loadStories();
  }, [loadStoredVotes, loadStories]);

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

    setStories((prev) =>
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
      setStories((prev) =>
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

  return (
    <SurfaceCard className="mb-3 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center space-x-2 flex-1 mr-2">
          <View className="w-8 h-8 rounded-full bg-accent/15 items-center justify-center">
            <Ionicons name="sparkles" size={16} color={colors.accent} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
              Athlete Transformations
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs">
              Real community journeys & milestones
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onOpenFeed}
          activeOpacity={0.7}
          className="px-2.5 py-1.5 rounded-xl bg-accent/10 border border-accent/25 flex-row items-center space-x-1"
        >
          <Text className="text-accent dark:text-accent-mint text-xs font-bold">
            All Stories
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Stories Horizontal Carousel */}
      {loading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" color={colors.accent} />
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-2 font-medium">
            Loading community stories...
          </Text>
        </View>
      ) : stories.length === 0 ? (
        <View className="py-6 px-4 bg-input dark:bg-input-dark rounded-2xl items-center justify-center">
          <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark mb-1">
            Be the first to share your journey!
          </Text>
          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark text-center mb-3">
            Every fitness transformation begins with day one.
          </Text>
          <TouchableOpacity
            onPress={onOpenWrite}
            className="bg-accent px-3.5 py-2 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-xs font-bold text-white">+ Share Your Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
          className="-mx-1"
        >
          {stories.map((item) => {
            const hasUpvoted = votedIds.has(item.id);
            return (
              <View
                key={item.id}
                className="w-72 bg-input dark:bg-input-dark rounded-2xl p-3.5 mr-3 border border-input-border/70 dark:border-input-border-dark/70 justify-between"
              >
                {/* Top Row: User Avatar, Name, Rating */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center space-x-2">
                      <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center border border-accent/40">
                        <Text className="text-xs font-extrabold text-accent dark:text-accent-mint">
                          {item.authorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <View className="flex-row items-center space-x-1">
                          <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                            {item.authorName}
                          </Text>
                          {item.verifiedAthlete !== false ? (
                            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                          ) : null}
                        </View>
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          {item.goal === 'MUSCLE_GAIN'
                            ? 'Muscle Gain'
                            : item.goal === 'WEIGHT_LOSS'
                            ? 'Fat Loss'
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
                          size={11}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>

                  {/* Badges / Metrics Row */}
                  <View className="flex-row flex-wrap gap-1 mb-2">
                    {item.highlightBadge ? (
                      <View className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25">
                        <Text className="text-[9px] font-bold text-accent dark:text-accent-mint">
                          {item.highlightBadge}
                        </Text>
                      </View>
                    ) : null}

                    {item.weightChangeKg ? (
                      <View className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                        <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {item.weightChangeKg > 0
                            ? `+${item.weightChangeKg} kg`
                            : `${item.weightChangeKg} kg`}
                        </Text>
                      </View>
                    ) : null}

                    {item.durationWeeks ? (
                      <View className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25">
                        <Text className="text-[9px] font-bold text-purple-600 dark:text-purple-400">
                          ⏱️ {item.durationWeeks} wks
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Quote Body */}
                  <Text
                    numberOfLines={3}
                    className="text-xs text-text-primary dark:text-text-primary-dark leading-snug italic mb-3"
                  >
                    "{item.content}"
                  </Text>
                </View>

                {/* Footer Action Row */}
                <View className="flex-row items-center justify-between pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                    Verified FitTrack Journey
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleUpvote(item)}
                    activeOpacity={0.7}
                    className={`flex-row items-center space-x-1 px-2.5 py-1 rounded-full border ${
                      hasUpvoted
                        ? 'bg-rose-500/15 border-rose-500/35'
                        : 'bg-input dark:bg-input-dark border-input-border/70 dark:border-input-border-dark/70'
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
                      {item.helpfulCount || 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Share Transformation Footer Banner */}
      <View className="mt-3 pt-2.5 border-t border-input-border/50 dark:border-input-border-dark/50 flex-row items-center justify-between">
        <Text className="text-xs text-text-muted dark:text-text-muted-dark">
          Crushed a goal or PR recently?
        </Text>
        <TouchableOpacity
          onPress={onOpenWrite}
          activeOpacity={0.7}
          className="flex-row items-center space-x-1 px-3 py-1.5 rounded-xl bg-accent"
        >
          <Ionicons name="add" size={14} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">Share Your Story</Text>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
}
