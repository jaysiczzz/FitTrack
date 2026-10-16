import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import {
  InAppNotification,
  InAppNotificationType,
  getInAppNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteInAppNotificationApi,
  clearReadNotificationsApi,
  getCachedUnreadNotifCount,
  setCachedUnreadNotifCount,
} from '@/api/notifications';
import { hapticFeedback } from '@/utils/haptics';
import FilterChip from '@/components/ui/FilterChip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';

export type FilterTab =
  | 'ALL'
  | 'UNREAD'
  | 'STREAK'
  | 'WORKOUT'
  | 'NUTRITION'
  | 'AI'
  | 'SUPPORT'
  | 'ACHIEVEMENT';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { user } = useAuth();
  const notifsCacheKey = authStorage.getScopedKey(user?.id, 'in_app_notifications_cache');

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(getCachedUnreadNotifCount);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Instant local cache load
  useEffect(() => {
    let isMounted = true;
    async function loadCached() {
      try {
        const cached = await AsyncStorage.getItem(notifsCacheKey);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed);
          }
        }
      } catch {}
    }
    loadCached();
    return () => {
      isMounted = false;
    };
  }, [notifsCacheKey]);

  // 2. Load notifications from backend
  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (notifications.length === 0) setLoading(true);

    try {
      const res = await getInAppNotificationsApi();
      if (res && res.success) {
        const items = res.notifications || [];
        setNotifications(items);
        AsyncStorage.setItem(notifsCacheKey, JSON.stringify(items)).catch(() => {});
        const count = res.unreadCount ?? 0;
        setUnreadCount(count);
        setCachedUnreadNotifCount(count);
        DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', { unreadCount: count });
      }
    } catch (err) {
      console.warn('[NotificationsScreen] Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notifsCacheKey, notifications.length]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Handle Mark All As Read
  const handleMarkAllRead = async () => {
    hapticFeedback.light();
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setCachedUnreadNotifCount(0);
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', { unreadCount: 0 });
      await markAllNotificationsReadApi();
    } catch (err) {
      console.warn('[NotificationsScreen] Error marking all read:', err);
    }
  };

  // Resolve destination route to direct the user specifically to the cause of the notification
  const resolveNotificationTarget = (item: InAppNotification): string | null => {
    // 1. If linkUrl already contains targeted query params (e.g. ?modal=... or ?tab=...), trust it
    if (item.linkUrl && item.linkUrl.includes('?')) {
      return item.linkUrl;
    }

    const title = (item.title || '').toLowerCase();
    const message = (item.message || '').toLowerCase();

    // 2. Story / Testimonial Transformation notifications
    if (
      title.includes('story') ||
      message.includes('transformation story') ||
      message.includes('community stories')
    ) {
      if (
        title.includes('approved') ||
        title.includes('live') ||
        message.includes('now live')
      ) {
        return '/(screen)/dashboard?modal=testimonials&tab=feed';
      }
      return '/(screen)/dashboard?modal=testimonials&tab=write';
    }

    // 3. Admin Story Approval queue
    if (
      title.includes('pending approval') &&
      (item.type === 'SUPPORT' || title.includes('story') || message.includes('story'))
    ) {
      return '/(screen)/admin?tab=support&subTab=stories';
    }

    // 4. Support Tickets
    if (title.includes('ticket') || item.type === 'SUPPORT') {
      return '/(screen)/settings?modal=support&tab=contact';
    }

    // 5. Workouts & Sessions
    if (item.type === 'WORKOUT' || title.includes('workout') || title.includes('routine')) {
      return '/(screen)/workouts?tab=history';
    }

    // 6. Nutrition & Hydration
    if (
      item.type === 'NUTRITION' ||
      title.includes('nutrition') ||
      title.includes('hydration') ||
      title.includes('meal')
    ) {
      return '/(screen)/foodlog?tab=today';
    }

    // 7. Streak Milestones & Check-ins
    if (item.type === 'STREAK' || title.includes('streak') || title.includes('check-in')) {
      return '/(screen)/calendar';
    }

    // 8. AI Coach Messages
    if (item.type === 'AI' || title.includes('coach') || title.includes('jejo')) {
      return '/(screen)/ai-coach';
    }

    // 9. Subscription & Pro Tier
    if (
      title.includes('subscription') ||
      title.includes('pro athlete') ||
      title.includes('tier')
    ) {
      return '/(screen)/settings?modal=subscription';
    }

    return item.linkUrl || null;
  };

  // Handle Item Press (mark as read & direct to the cause of notification)
  const handleItemPress = async (item: InAppNotification) => {
    hapticFeedback.light();
    if (!item.isRead) {
      const newCount = Math.max(0, unreadCount - 1);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(newCount);
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', { unreadCount: newCount });
      markNotificationReadApi(item.id).catch(() => {});
    }

    const targetRoute = resolveNotificationTarget(item);
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  // Handle Delete Single
  const handleDelete = async (id: string) => {
    hapticFeedback.light();
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', { unreadCount: newCount });
    }
    try {
      await deleteInAppNotificationApi(id);
    } catch (err) {
      console.warn('[NotificationsScreen] Failed to delete:', err);
    }
  };

  // Handle Clear All Read
  const handleClearRead = async () => {
    hapticFeedback.light();
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await clearReadNotificationsApi();
    } catch (err) {
      console.warn('[NotificationsScreen] Failed to clear read:', err);
    }
  };

  // Format relative time (e.g. "5m ago", "2h ago", "Yesterday")
  const formatRelativeTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Visual Theme per Notification Type
  const getTypeConfig = (type: InAppNotificationType) => {
    switch (type) {
      case 'STREAK':
        return {
          icon: 'flame' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#FB7185' : '#E11D48',
          badgeClass: 'bg-rose-500/10 dark:bg-rose-400/20 border-rose-500/25 dark:border-rose-400/40',
        };
      case 'WORKOUT':
        return {
          icon: 'barbell' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#34D399' : '#059669',
          badgeClass: 'bg-emerald-500/10 dark:bg-emerald-400/20 border-emerald-500/25 dark:border-emerald-400/40',
        };
      case 'NUTRITION':
        return {
          icon: 'water' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#38BDF8' : '#0284C7',
          badgeClass: 'bg-sky-500/10 dark:bg-sky-400/20 border-sky-500/25 dark:border-sky-400/40',
        };
      case 'AI':
        return {
          icon: 'sparkles' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#C084FC' : '#9333EA',
          badgeClass: 'bg-purple-500/10 dark:bg-purple-400/20 border-purple-500/25 dark:border-purple-400/40',
        };
      case 'SUPPORT':
        return {
          icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#818CF8' : '#4F46E5',
          badgeClass: 'bg-indigo-500/10 dark:bg-indigo-400/20 border-indigo-500/25 dark:border-indigo-400/40',
        };
      case 'ACHIEVEMENT':
        return {
          icon: 'trophy' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#FBBF24' : '#D97706',
          badgeClass: 'bg-amber-500/10 dark:bg-amber-400/20 border-amber-500/25 dark:border-amber-400/40',
        };
      case 'SYSTEM':
      default:
        return {
          icon: 'notifications' as keyof typeof Ionicons.glyphMap,
          color: isDark ? '#34D399' : colors.accent,
          badgeClass: 'bg-emerald-500/10 dark:bg-emerald-400/20 border-emerald-500/25 dark:border-emerald-400/40',
        };
    }
  };

  // Filter & Search Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Category filter
      if (activeTab === 'UNREAD' && item.isRead) return false;
      if (activeTab !== 'ALL' && activeTab !== 'UNREAD' && item.type !== activeTab) return false;

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesMessage = item.message?.toLowerCase().includes(query);
        return matchesTitle || matchesMessage;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const hasReadItems = useMemo(() => notifications.some((n) => n.isRead), [notifications]);

  // Contextual empty state description per category
  const getEmptyState = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching alerts',
        subtitle: `No notifications matched "${searchQuery.trim()}". Try another search term.`,
      };
    }

    switch (activeTab) {
      case 'UNREAD':
        return {
          title: 'No unread notifications',
          subtitle: 'You have reviewed all your activity alerts. Switch to All to see past notifications.',
        };
      case 'STREAK':
        return {
          title: 'No streak alerts yet',
          subtitle: 'Check in daily and complete your workouts to build streak milestones.',
        };
      case 'WORKOUT':
        return {
          title: 'No workout notifications',
          subtitle: 'Complete workout routines and hit personal records to receive activity summaries.',
        };
      case 'NUTRITION':
        return {
          title: 'No nutrition notifications',
          subtitle: 'Log your meals and daily water intake to receive hydration & macro updates.',
        };
      case 'AI':
        return {
          title: 'No AI coach messages',
          subtitle: 'Chat with Coach Jejo for personalized workout recommendations and advice.',
        };
      case 'SUPPORT':
        return {
          title: 'No support notifications',
          subtitle: 'Need assistance? Submit a ticket from Settings anytime.',
        };
      case 'ACHIEVEMENT':
        return {
          title: 'No milestone badges yet',
          subtitle: 'Earn milestone badges and performance rewards as you stay consistent.',
        };
      case 'ALL':
      default:
        return {
          title: 'All caught up!',
          subtitle: 'Activity milestones, streak reminders, and coach updates will appear here.',
        };
    }
  };

  const emptyState = getEmptyState();

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'UNREAD', label: 'Unread' },
    { key: 'STREAK', label: 'Streaks' },
    { key: 'WORKOUT', label: 'Workouts' },
    { key: 'NUTRITION', label: 'Nutrition' },
    { key: 'AI', label: 'AI Coach' },
    { key: 'SUPPORT', label: 'Support' },
    { key: 'ACHIEVEMENT', label: 'Milestones' },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      {/* ── Top Header Bar ── */}
      <View className="px-4 pt-2 pb-2.5 bg-background dark:bg-background-dark">
        <View className="w-full max-w-4xl self-center mx-auto flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 pr-2 min-w-0">
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(screen)/dashboard');
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-none shrink-0"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5 min-w-0">
                <Text numberOfLines={1} className="text-lg sm:text-xl font-black text-text-primary dark:text-text-primary-dark tracking-tight shrink">
                  Notifications
                </Text>
                {unreadCount > 0 ? (
                  <View className="bg-emerald-500/15 dark:bg-emerald-400/25 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                    <Text className="text-[10px] font-black text-accent dark:text-emerald-400">
                      {unreadCount} new
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Mark All Read Button */}
          {unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark shadow-sm shadow-slate-200/40 dark:shadow-none shrink-0"
            >
              <Text className="text-[11px] sm:text-xs font-bold text-accent dark:text-emerald-400">
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Search Bar & Filter Pills Section (matching Nutrition & Workout Library) ── */}
      <View className="w-full border-b border-input-border dark:border-input-border-dark pb-3">
        <View className="w-full max-w-4xl self-center mx-auto px-4">
          {/* Row 1: Search Input */}
          <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3 min-h-[34px] py-1 mb-2.5">
            <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search notifications..."
              placeholderTextColor={colors.textMuted}
              className="flex-1 py-2 text-xs text-text-primary dark:text-text-primary-dark font-medium"
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setSearchQuery('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Row 2: Category Filter Chips */}
          <View className="relative">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ paddingRight: 20, alignItems: 'center' }}
            >
              {FILTER_TABS.map((tab) => (
                <FilterChip
                  key={tab.key}
                  label={tab.label}
                  count={tab.key === 'UNREAD' && unreadCount > 0 ? unreadCount : undefined}
                  selected={activeTab === tab.key}
                  onPress={() => {
                    hapticFeedback.light();
                    setActiveTab(tab.key);
                  }}
                  className="mr-1.5"
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* ── Main Notifications Scroll View ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 36,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View className="w-full max-w-4xl self-center mx-auto">
          {loading && !refreshing && notifications.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="small" color={colors.accent} />
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-3 font-medium">
                Loading notifications...
              </Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View className="py-20 items-center justify-center px-4">
              <View className="w-16 h-16 rounded-3xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center mb-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
                <Ionicons name="notifications-off-outline" size={28} color={colors.textMuted} />
              </View>
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark text-center">
                {emptyState.title}
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mt-1.5 max-w-xs leading-relaxed">
                {emptyState.subtitle}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {filteredNotifications.map((item) => {
                const cfg = getTypeConfig(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.75}
                    className={`px-3.5 py-3 rounded-2xl border transition-all ${
                      !item.isRead
                        ? 'bg-surface dark:bg-surface-dark border-emerald-500/35 dark:border-emerald-400/35 shadow-sm shadow-slate-200/50 dark:shadow-none'
                        : 'bg-surface/75 dark:bg-surface-dark/75 border-input-border dark:border-input-border-dark opacity-90'
                    }`}
                  >
                    <View className="flex-row items-start gap-3">
                      {/* Squircle Category Badge */}
                      <View
                        className={`w-9 h-9 rounded-xl items-center justify-center border mt-0.5 shrink-0 ${cfg.badgeClass}`}
                      >
                        <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                      </View>

                      {/* Content Details */}
                      <View className="flex-1 min-w-0 pr-1">
                        <View className="flex-row items-center justify-between gap-1.5 mb-1">
                          <Text
                            className={`text-xs flex-1 ${
                              !item.isRead
                                ? 'text-text-primary dark:text-text-primary-dark font-extrabold'
                                : 'text-text-primary dark:text-text-primary-dark font-semibold'
                            }`}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </Text>
                        </View>

                        <Text
                          className="text-[11px] text-text-muted dark:text-text-muted-dark leading-snug"
                          numberOfLines={2}
                        >
                          {item.message}
                        </Text>
                      </View>

                      {/* Unread Indicator / Trash Button */}
                      <View className="items-end justify-start pt-1 shrink-0">
                        {!item.isRead ? (
                          <View className="w-2 h-2 rounded-full bg-accent dark:bg-emerald-400" />
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Footer: Clear read history */}
          {hasReadItems && !loading ? (
            <View className="mt-6 pt-4 border-t border-input-border dark:border-input-border-dark flex-row items-center justify-between">
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                Read notifications are kept for 30 days
              </Text>
              <TouchableOpacity
                onPress={handleClearRead}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark"
              >
                <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                  Clear read
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
