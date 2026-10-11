import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FilterChip from '@/components/ui/FilterChip';
import {
  AdminSupportTicket,
  updateAdminTicketApi,
  deleteAdminTicketApi,
} from '@/api/admin';
import {
  getAdminTestimonialsApi,
  moderateTestimonialApi,
  TestimonialItem,
} from '@/api/testimonial';
import { capitalizeWords } from '@/utils/formatters';

interface AdminTicketsTabProps {
  tickets: AdminSupportTicket[];
  loading: boolean;
  refreshing: boolean;
  ticketFilter: 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  onFilterChange: (f: 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => void;
  onReloadTickets: () => void;
}

export default function AdminTicketsTab({
  tickets,
  loading,
  refreshing,
  ticketFilter,
  onFilterChange,
  onReloadTickets,
}: AdminTicketsTabProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [subSection, setSubSection] = useState<'tickets' | 'stories'>('tickets');

  // Support Tickets State
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [adminTicketNotes, setAdminTicketNotes] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<AdminSupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Stories Moderation State
  const [storySearch, setStorySearch] = useState('');
  const [stories, setStories] = useState<TestimonialItem[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [storyFilter, setStoryFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      const res = await getAdminTestimonialsApi();
      if (res?.success) {
        setStories(res.testimonials);
      }
    } catch (err: any) {
      console.warn('[Admin] Failed to load stories:', err?.message);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    if (refreshing) {
      loadStories();
    }
  }, [refreshing, loadStories]);

  const handleUpdateTicketStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedTicket) return;
    try {
      setUpdatingTicket(true);
      triggerHapticFeedback();
      const res = await updateAdminTicketApi(selectedTicket.id, {
        status,
        adminNotes: adminTicketNotes.trim() || undefined,
      });

      if (res.success) {
        showSuccess('Ticket Updated', `Status changed to ${status}.`);
        setSelectedTicket(res.ticket);
        onReloadTickets();
      }
    } catch (err: any) {
      showError('Update Failed', err?.message || 'Could not update ticket.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      triggerHapticFeedback();
      const res = await deleteAdminTicketApi(ticketToDelete.id);
      if (res.success) {
        showSuccess('Ticket Removed', 'Ticket deleted from support queue.');
        setTicketToDelete(null);
        setSelectedTicket(null);
        onReloadTickets();
      }
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete ticket.');
    } finally {
      setDeletingTicket(false);
    }
  };

  const handleModerateStory = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setModeratingId(id);
      triggerHapticFeedback();
      const res = await moderateTestimonialApi(id, { status });
      if (res.success) {
        showSuccess(
          status === 'APPROVED' ? 'Story Approved' : 'Story Rejected',
          status === 'APPROVED'
            ? 'The transformation story is now published to the community.'
            : 'The transformation story has been marked as rejected.'
        );
        loadStories();
      }
    } catch (err: any) {
      showError('Moderation Error', err?.message || 'Could not update story status.');
    } finally {
      setModeratingId(null);
    }
  };

  const openTicketsCount = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  ).length;

  const filteredTickets = useMemo(() => {
    if (!ticketSearch.trim()) return tickets;
    const q = ticketSearch.toLowerCase().trim();
    return tickets.filter((t) => {
      const email = (t.userEmail || '').toLowerCase();
      const name = (t.userName || '').toLowerCase();
      const subj = (t.subject || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      const msg = (t.message || '').toLowerCase();
      return (
        email.includes(q) ||
        name.includes(q) ||
        subj.includes(q) ||
        id.includes(q) ||
        msg.includes(q)
      );
    });
  }, [tickets, ticketSearch]);

  const pendingStoriesCount = stories.filter((s) => s.status === 'PENDING_APPROVAL').length;

  const filteredStories = stories.filter((s) => {
    if (storyFilter === 'PENDING') return s.status === 'PENDING_APPROVAL';
    if (storyFilter === 'APPROVED') return s.status === 'APPROVED';
    if (storyFilter === 'REJECTED') return s.status === 'REJECTED';
    return true;
  });

  const displayedStories = useMemo(() => {
    if (!storySearch.trim()) return filteredStories;
    const q = storySearch.toLowerCase().trim();
    return filteredStories.filter((s) => {
      const author = (s.authorName || '').toLowerCase();
      const content = (s.content || '').toLowerCase();
      const goal = (s.goal || '').toLowerCase();
      const badge = (s.highlightBadge || '').toLowerCase();
      return (
        author.includes(q) ||
        content.includes(q) ||
        goal.includes(q) ||
        badge.includes(q)
      );
    });
  }, [filteredStories, storySearch]);

  return (
    <View className="gap-3">
      {/* ── Sub-Section Switcher ── */}
      <View className="flex-row bg-surface-card dark:bg-surface-card-dark p-1 rounded-xl border border-input-border dark:border-input-border-dark">
        <TouchableOpacity
          onPress={() => {
            triggerHapticFeedback();
            setSubSection('tickets');
          }}
          className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1.5 ${
            subSection === 'tickets' ? 'bg-accent' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              subSection === 'tickets' ? 'text-accent-contrast' : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            Support Tickets
          </Text>
          {openTicketsCount > 0 && (
            <View
              className={`px-1.5 py-0.5 rounded-full ${
                subSection === 'tickets' ? 'bg-accent-contrast/25' : 'bg-warning/20 border border-warning/30'
              }`}
            >
              <Text
                className={`text-[9px] font-black ${
                  subSection === 'tickets' ? 'text-accent-contrast' : 'text-warning dark:text-warning-dark'
                }`}
              >
                {openTicketsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHapticFeedback();
            setSubSection('stories');
          }}
          className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1.5 ${
            subSection === 'stories' ? 'bg-accent' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              subSection === 'stories' ? 'text-accent-contrast' : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            Story Moderation
          </Text>
          {pendingStoriesCount > 0 && (
            <View
              className={`px-1.5 py-0.5 rounded-full ${
                subSection === 'stories' ? 'bg-accent-contrast/25' : 'bg-warning/20 border border-warning/30'
              }`}
            >
              <Text
                className={`text-[9px] font-black ${
                  subSection === 'stories' ? 'text-accent-contrast' : 'text-warning dark:text-warning-dark'
                }`}
              >
                {pendingStoriesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ────────────────────────────────────────── */}
      {/* SECTION 1: Support Tickets                 */}
      {/* ────────────────────────────────────────── */}
      {subSection === 'tickets' && (
        <>
          {/* Ticket Search Input */}
          <View className="flex-row items-center bg-input dark:bg-input-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
            <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={ticketSearch}
              onChangeText={setTicketSearch}
              placeholder="Search tickets by user, email, subject, ID..."
              placeholderTextColor={colors.textMuted}
              className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
              autoCapitalize="none"
            />
            {ticketSearch.length > 0 && (
              <TouchableOpacity onPress={() => setTicketSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter chips */}
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'OPEN', label: 'Open' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'RESOLVED', label: 'Resolved' },
              ] as const
            ).map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                selected={ticketFilter === filter.id}
                onPress={() => {
                  triggerHapticFeedback();
                  onFilterChange(filter.id);
                }}
              />
            ))}
          </View>

          {/* Ticket List */}
          {loading && !refreshing ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="small" color={colors.accent} />
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                Loading support queue...
              </Text>
            </View>
          ) : tickets.length === 0 ? (
            <SurfaceCard className="py-16 items-center justify-center">
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-2">
                Queue is clear!
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                No pending support tickets in this category.
              </Text>
            </SurfaceCard>
          ) : filteredTickets.length === 0 ? (
            <SurfaceCard className="py-16 items-center justify-center">
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-2">
                No matching tickets found
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5 text-center">
                No tickets match "{ticketSearch}".
              </Text>
              <TouchableOpacity
                onPress={() => setTicketSearch('')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30"
              >
                <Text className="text-xs font-bold text-accent dark:text-accent-mint">Clear Search</Text>
              </TouchableOpacity>
            </SurfaceCard>
          ) : (
            filteredTickets.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  triggerHapticFeedback();
                  setSelectedTicket(t);
                  setAdminTicketNotes(t.adminNotes || '');
                }}
                activeOpacity={0.7}
              >
                <SurfaceCard className="p-3.5">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2">
                      <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark uppercase">
                          {t.category}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View
                      className={`px-2 py-0.5 rounded-full border ${
                        t.status === 'RESOLVED'
                          ? 'bg-success/15 border-success/30'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-info/15 border-info/30'
                          : 'bg-warning/15 border-warning/30'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold uppercase ${
                          t.status === 'RESOLVED'
                            ? 'text-success dark:text-success-dark'
                            : t.status === 'IN_PROGRESS'
                            ? 'text-info dark:text-info-dark'
                            : 'text-warning dark:text-warning-dark'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark mb-1">
                    {t.subject}
                  </Text>
                  <Text
                    className="text-xs text-text-muted dark:text-text-muted-dark mb-2"
                    numberOfLines={2}
                  >
                    {t.message}
                  </Text>

                  <View className="flex-row items-center justify-between pt-2 border-t border-input-border dark:border-input-border-dark">
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      From: {t.userName || t.userEmail}
                    </Text>
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      Review & Reply →
                    </Text>
                  </View>
                </SurfaceCard>
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {/* ────────────────────────────────────────── */}
      {/* SECTION 2: Athlete Stories Moderation     */}
      {/* ────────────────────────────────────────── */}
      {subSection === 'stories' && (
        <>
          {/* Story Search Input */}
          <View className="flex-row items-center bg-input dark:bg-input-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
            <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={storySearch}
              onChangeText={setStorySearch}
              placeholder="Search stories by athlete name, review content, goal..."
              placeholderTextColor={colors.textMuted}
              className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
              autoCapitalize="none"
            />
            {storySearch.length > 0 && (
              <TouchableOpacity onPress={() => setStorySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Moderation filter chips */}
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { id: 'PENDING', label: `Pending (${pendingStoriesCount})` },
                { id: 'ALL', label: `All Stories (${stories.length})` },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
              ] as const
            ).map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                selected={storyFilter === filter.id}
                onPress={() => {
                  triggerHapticFeedback();
                  setStoryFilter(filter.id);
                }}
              />
            ))}
          </View>

          {loadingStories && !refreshing ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="small" color={colors.accent} />
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                Loading transformation stories...
              </Text>
            </View>
          ) : filteredStories.length === 0 ? (
            <SurfaceCard className="py-16 items-center justify-center">
              <Ionicons name="images-outline" size={40} color={colors.accent} />
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-2">
                No stories in this queue
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                {storyFilter === 'PENDING'
                  ? 'All athlete transformation submissions have been reviewed.'
                  : 'No stories found for this filter.'}
              </Text>
            </SurfaceCard>
          ) : displayedStories.length === 0 ? (
            <SurfaceCard className="py-16 items-center justify-center">
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-2">
                No matching stories found
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5 text-center">
                No transformation stories match "{storySearch}".
              </Text>
              <TouchableOpacity
                onPress={() => setStorySearch('')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30"
              >
                <Text className="text-xs font-bold text-accent dark:text-accent-mint">Clear Search</Text>
              </TouchableOpacity>
            </SurfaceCard>
          ) : (
            displayedStories.map((story) => {
              const isPending = story.status === 'PENDING_APPROVAL';
              const isApproved = story.status === 'APPROVED';
              const isRejected = story.status === 'REJECTED';
              const hasPhotos = Boolean(story.beforeImageUrl || story.afterImageUrl);

              return (
                <SurfaceCard key={story.id} className="p-4 gap-2.5">
                  {/* Author Header & Status */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-9 h-9 rounded-full bg-accent/15 items-center justify-center overflow-hidden border border-accent/30">
                        {story.avatarUrl ? (
                          <Image source={{ uri: story.avatarUrl }} className="w-full h-full" />
                        ) : (
                          <Text className="text-xs font-black text-accent">
                            {story.authorName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View>
                        <View className="flex-row items-center gap-1.5">
                          <Text className="font-bold text-xs text-text-primary dark:text-text-primary-dark">
                            {story.authorName}
                          </Text>
                          {story.verifiedAthlete && (
                            <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                          )}
                        </View>
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          {story.goal === 'MUSCLE_GAIN'
                            ? 'Goal: Muscle Gain'
                            : story.goal === 'WEIGHT_LOSS'
                            ? 'Goal: Fat Loss'
                            : 'FitTrack Athlete'}{' '}
                          · Submitted {new Date(story.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end gap-1">
                      <View
                        className={`px-2 py-0.5 rounded-full border ${
                          isApproved
                            ? 'bg-success/15 border-success/30'
                            : isRejected
                            ? 'bg-danger/15 border-danger/30'
                            : 'bg-warning/15 border-warning/30'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-bold uppercase ${
                            isApproved
                              ? 'text-success dark:text-success-dark'
                              : isRejected
                              ? 'text-danger dark:text-danger-dark'
                              : 'text-warning dark:text-warning-dark'
                          }`}
                        >
                          {story.status?.replace(/_/g, ' ') || 'APPROVED'}
                        </Text>
                      </View>

                      {/* 5-Star Row */}
                      <View className="flex-row items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= story.rating ? 'star' : 'star-outline'}
                            size={11}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Highlights / Badges Row */}
                  <View className="flex-row flex-wrap gap-1.5">
                    {story.highlightBadge ? (
                      <View className="px-1.5 py-0.5 rounded-md bg-accent/15 dark:bg-accent-dark/25 border border-accent/30 dark:border-accent-dark/40">
                        <Text className="text-[9px] font-bold text-accent dark:text-accent-mint">
                          {story.highlightBadge}
                        </Text>
                      </View>
                    ) : null}

                    {story.weightChangeKg != null ? (
                      <View className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 dark:border-emerald-500/40">
                        <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                          {story.weightChangeKg > 0 ? `+${story.weightChangeKg} kg` : `${story.weightChangeKg} kg`}
                        </Text>
                      </View>
                    ) : null}

                    {story.durationWeeks != null ? (
                      <View className="px-1.5 py-0.5 rounded-md bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/30 dark:border-purple-500/40">
                        <Text className="text-[9px] font-bold text-purple-700 dark:text-purple-300">
                          ⏱️ {story.durationWeeks} Weeks
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Review Text */}
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark leading-relaxed italic">
                    "{story.content}"
                  </Text>

                  {/* Before & After Photos Verification */}
                  {hasPhotos && (
                    <View className="mt-1 pt-2 border-t border-input-border/40 dark:border-input-border-dark/40">
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
                        Uploaded Photos for Verification:
                      </Text>
                      <View className="flex-row gap-3">
                        {story.beforeImageUrl ? (
                          <TouchableOpacity
                            onPress={() => setPreviewImageUri(story.beforeImageUrl || null)}
                            activeOpacity={0.85}
                            className="flex-1 max-w-[280px] h-52 sm:h-64 rounded-xl overflow-hidden border border-input-border dark:border-input-border-dark bg-black/60 relative"
                          >
                            <Image
                              source={{ uri: story.beforeImageUrl }}
                              className="w-full h-full"
                              resizeMode="contain"
                            />
                            <View className="absolute bottom-1.5 left-1.5 bg-black/75 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                              <Ionicons name="expand-outline" size={10} color="#FFFFFF" />
                              <Text className="text-[9px] font-black text-white uppercase">Before</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}

                        {story.afterImageUrl ? (
                          <TouchableOpacity
                            onPress={() => setPreviewImageUri(story.afterImageUrl || null)}
                            activeOpacity={0.85}
                            className="flex-1 max-w-[280px] h-52 sm:h-64 rounded-xl overflow-hidden border border-accent/40 bg-black/60 relative"
                          >
                            <Image
                              source={{ uri: story.afterImageUrl }}
                              className="w-full h-full"
                              resizeMode="contain"
                            />
                            <View className="absolute bottom-1.5 left-1.5 bg-accent px-2 py-0.5 rounded-md flex-row items-center gap-1">
                              <Ionicons name="expand-outline" size={10} color="#FFFFFF" />
                              <Text className="text-[9px] font-black text-white uppercase">After</Text>
                            </View>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {/* Moderation Actions */}
                  <View className="flex-row gap-2 mt-2 pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
                    {isPending ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleModerateStory(story.id, 'REJECTED')}
                          disabled={moderatingId === story.id}
                          className="flex-1 min-h-[40px] py-2 rounded-xl bg-danger/10 border border-danger/30 items-center justify-center flex-row gap-1"
                        >
                          <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
                          <Text className="text-xs font-bold text-danger dark:text-danger-dark">Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleModerateStory(story.id, 'APPROVED')}
                          disabled={moderatingId === story.id}
                          className="flex-1 min-h-[40px] py-2 rounded-xl bg-success border border-success items-center justify-center flex-row gap-1"
                        >
                          {moderatingId === story.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
                              <Text className="text-xs font-bold text-white">Approve & Publish</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : isApproved ? (
                      <TouchableOpacity
                        onPress={() => handleModerateStory(story.id, 'REJECTED')}
                        disabled={moderatingId === story.id}
                        className="flex-1 min-h-[40px] py-2 rounded-xl bg-danger/10 border border-danger/25 items-center justify-center"
                      >
                        <Text className="text-xs font-bold text-danger dark:text-danger-dark">
                          Revoke Approval (Reject)
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleModerateStory(story.id, 'APPROVED')}
                        disabled={moderatingId === story.id}
                        className="flex-1 min-h-[40px] py-2 rounded-xl bg-success/15 border border-success/30 items-center justify-center"
                      >
                        <Text className="text-xs font-bold text-success dark:text-success-dark">
                          Re-Approve Story
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </SurfaceCard>
              );
            })
          )}
        </>
      )}

      {/* ── Review Support Ticket Modal ── */}
      {selectedTicket && (
        <Modal
          visible={Boolean(selectedTicket) && !ticketToDelete}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Support Ticket
                </Text>
                <ModalCloseButton onClose={() => setSelectedTicket(null)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <View className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
                      {selectedTicket.category} · {selectedTicket.id}
                    </Text>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                    {selectedTicket.subject}
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    User:{' '}
                    {selectedTicket.userName
                      ? `${selectedTicket.userName} (${selectedTicket.userEmail})`
                      : selectedTicket.userEmail}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    User Message
                  </Text>
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark leading-relaxed">
                    {selectedTicket.message}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Admin Resolution Note
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-xs text-text-primary dark:text-text-primary-dark min-h-[60px]"
                    placeholder="Enter resolution notes, actions taken, or replies..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={adminTicketNotes}
                    onChangeText={setAdminTicketNotes}
                  />
                </View>

                {/* Workflow Buttons */}
                <View className="flex-row gap-2 mt-1">
                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('IN_PROGRESS')}
                    disabled={updatingTicket}
                    className="flex-1 min-h-[48px] py-3 rounded-xl bg-info/15 border border-info/30 items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-info dark:text-info-dark">In Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('RESOLVED')}
                    disabled={updatingTicket}
                    className="flex-1 min-h-[48px] py-3 rounded-xl bg-accent items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-accent-contrast">Mark Resolved</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setTicketToDelete(selectedTicket)}
                  className="min-h-[48px] py-3 rounded-xl bg-danger/10 border border-danger/20 items-center justify-center mt-1"
                >
                  <Text className="text-xs font-bold text-danger dark:text-danger-dark">Delete Ticket</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Ticket Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(ticketToDelete)}
        title="Delete Support Ticket"
        message={`Are you sure you want to permanently remove this support ticket from the queue? This cannot be undone.`}
        confirmText="Delete Ticket"
        cancelText="Cancel"
        isDanger
        loading={deletingTicket}
        onConfirm={handleConfirmDeleteTicket}
        onCancel={() => setTicketToDelete(null)}
      />

      {/* Full Screen Image Preview Modal */}
      {previewImageUri && (
        <Modal
          visible={Boolean(previewImageUri)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImageUri(null)}
        >
          <View className="flex-1 bg-black/90 items-center justify-center p-4">
            <View className="w-full max-w-lg items-end mb-2">
              <TouchableOpacity
                onPress={() => setPreviewImageUri(null)}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: previewImageUri }}
              className="w-full h-4/5 rounded-2xl"
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
