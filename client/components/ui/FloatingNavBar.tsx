import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AiScanModal from '@/components/foodlog/AiScanModal';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import { FoodLogItem, getTodayDateString } from '@/components/foodlog/foodLogTypes';
import { autoSyncFoodAndWater, saveFoodToRecentHistory } from '@/api/foodlog';
import {
  getInAppNotificationsApi,
  getCachedUnreadNotifCount,
  setCachedUnreadNotifCount,
} from '@/api/notifications';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useThemeColors } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';

export interface NavItem {
  key: string;
  label: string;
  route: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS_LEFT: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    activeIcon: 'grid',
    inactiveIcon: 'grid',
  },
  {
    key: 'foodlog',
    label: 'Nutrition',
    route: '/foodlog',
    activeIcon: 'restaurant',
    inactiveIcon: 'restaurant',
  },
];

const NAV_ITEMS_RIGHT: NavItem[] = [
  {
    key: 'workouts',
    label: 'Workouts',
    route: '/workouts',
    activeIcon: 'barbell',
    inactiveIcon: 'barbell',
  },
  {
    key: 'profile',
    label: 'Profile',
    route: '/profile',
    activeIcon: 'person',
    inactiveIcon: 'person',
  },
];

export default function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id;
  const { showSuccess } = useToast();
  const { colors } = useThemeColors();
  const [showScanModal, setShowScanModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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

  useEffect(() => {
    loadNotifications();

    const subN = DeviceEventEmitter.addListener('IN_APP_NOTIFICATIONS_UPDATED', (evt?: { unreadCount?: number }) => {
      if (typeof evt?.unreadCount === 'number') {
        setUnreadNotifCount(evt.unreadCount);
        setCachedUnreadNotifCount(evt.unreadCount);
      } else {
        loadNotifications();
      }
    });

    return () => {
      subN.remove();
    };
  }, [loadNotifications]);

  // Determine active route
  const getIsActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard' || pathname.includes('dashboard');
    }
    return pathname.includes(route.replace('/', ''));
  };

  const handleAddMealFromScan = async (incoming: FoodLogItem | FoodLogItem[]) => {
    try {
      const itemsToAdd = Array.isArray(incoming) ? incoming : [incoming];
      if (itemsToAdd.length === 0) return;

      const activeUserId = userId || (await authStorage.getUser())?.id;
      const todayStr = getTodayDateString();
      const foodKey = authStorage.getScopedKey(activeUserId, 'food_log_today');
      const dayCompletedKey = authStorage.getScopedKey(activeUserId, `food_log_completed_${todayStr}`);
      const saved = await AsyncStorage.getItem(foodKey);
      let arr: FoodLogItem[] = saved ? JSON.parse(saved) : [];
      arr.push(...itemsToAdd);
      await AsyncStorage.setItem(foodKey, JSON.stringify(arr));
      await AsyncStorage.setItem(dayCompletedKey, 'false');

      const waterKey = authStorage.getScopedKey(activeUserId, 'water_log_today');
      const savedWater = await AsyncStorage.getItem(waterKey);
      const currentWater = savedWater ? parseInt(savedWater, 10) || 0 : 0;
      autoSyncFoodAndWater(activeUserId, todayStr, arr, currentWater, false, false);
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'floating_navbar', items: arr });

      // Also record to recent history
      itemsToAdd.forEach((item) => {
        saveFoodToRecentHistory({
          id: item.id || `food-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.title,
          category: 'Staples',
          servingSize: item.subtitle || '1 serving',
          servingWeightG: 100,
          servingUnit: 'serving',
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          icon: item.icon || 'restaurant',
          imageUri: item.imageUri,
          keywords: [item.title.toLowerCase()],
        }).catch(() => {});
      });
      DeviceEventEmitter.emit('RECENT_FOODS_UPDATED');
      if (itemsToAdd.length === 1) {
        showSuccess(`Added ${itemsToAdd[0].title}`, `${itemsToAdd[0].calories} kcal logged to ${itemsToAdd[0].mealType}`);
      } else {
        showSuccess(`Added ${itemsToAdd.length} Items`, `Logged to ${itemsToAdd[0].mealType}`);
      }
    } catch (e) {
      console.log('Error adding food from navbar scan:', e);
    }
  };

  const bottomInset = Math.max(8, insets.bottom);

  // Hide the navbar on sub-screens that provide their own top header or back buttons
  if (
    !pathname ||
    pathname.includes('ai-coach') ||
    pathname.includes('settings') ||
    pathname.includes('calendar') ||
    pathname.includes('notifications') ||
    pathname.includes('admin') ||
    pathname.includes('auth')
  ) {
    return null;
  }

  return (
    <>
      <View style={[styles.navBarContainer, { pointerEvents: 'box-none' } as any]}>
        <View
          style={[
            { paddingBottom: bottomInset },
            Platform.select({
              web: {
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06)',
              } as any,
              default: {
                elevation: 8,
              },
            }),
          ]}
          className="w-full bg-surface/95 dark:bg-surface-dark/95 border-t border-input-border dark:border-input-border-dark"
        >
          <View className="flex-row items-center justify-around w-full max-w-[440px] self-center pt-2 px-2">
            {/* Left Nav Items: Dashboard, Nutrition */}
            {NAV_ITEMS_LEFT.map((item) => {
              const isActive = getIsActive(item.route);

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  onPress={() => {
                    hapticFeedback.selection();
                    if (!isActive) {
                      router.navigate(item.route as any);
                    }
                  }}
                  className="flex-1 items-center justify-center min-h-[48px] py-1.5"
                >
                  <View className="w-10 h-7 items-center justify-center mb-0.5">
                    <Ionicons
                      name={isActive ? item.activeIcon : item.inactiveIcon}
                      size={21}
                      color={isActive ? colors.accent : colors.textMuted}
                    />
                  </View>

                  <Text
                    className={`text-[11px] text-center tracking-tight leading-3 ${
                      isActive
                        ? 'text-accent dark:text-accent-dark font-bold'
                        : 'text-text-muted dark:text-text-muted-dark font-medium'
                    }`}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Center Elevated Action Button: AI Scan */}
            <View className="flex-1 items-center justify-center">
              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Scan Meal with AI"
                onPress={() => {
                  hapticFeedback.light();
                  setShowScanModal(true);
                }}
                className="items-center justify-center -mt-5"
                hitSlop={{ top: 12, bottom: 8, left: 10, right: 10 }}
              >
                <View
                  className="w-14 h-14 rounded-full bg-accent dark:bg-accent-dark items-center justify-center border-4 border-surface dark:border-surface-dark relative"
                  style={styles.centerButton}
                >
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>

                <Text
                  className="text-[10px] text-center tracking-tight font-medium text-text-muted dark:text-text-muted-dark mt-0.5"
                  numberOfLines={1}
                >
                  AI Scan
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right Nav Items: Workouts, Profile */}
            {NAV_ITEMS_RIGHT.map((item) => {
              const isActive = getIsActive(item.route);

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  onPress={() => {
                    hapticFeedback.selection();
                    if (!isActive) {
                      router.navigate(item.route as any);
                    }
                  }}
                  className="flex-1 items-center justify-center min-h-[48px] py-1.5"
                >
                  <View className="w-10 h-7 items-center justify-center mb-0.5">
                    <View className="relative">
                      <Ionicons
                        name={isActive ? item.activeIcon : item.inactiveIcon}
                        size={21}
                        color={isActive ? colors.accent : colors.textMuted}
                      />
                      {item.key === 'profile' && unreadNotifCount > 0 ? (
                        <View
                          className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 items-center justify-center border-[1.5px] border-surface dark:border-surface-dark shadow-sm"
                          accessibilityLabel={`${unreadNotifCount} unread notifications`}
                        >
                          <Text className="text-[9px] font-black text-white leading-none text-center">
                            {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Text
                    className={`text-[11px] text-center tracking-tight leading-3 ${
                      isActive
                        ? 'text-accent dark:text-accent-dark font-bold'
                        : 'text-text-muted dark:text-text-muted-dark font-medium'
                    }`}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* AI Food Scan Modal */}
      <AiScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onAddMealItem={handleAddMealFromScan}
        onUpgradePress={() => {
          setShowScanModal(false);
          setShowSubscriptionModal(true);
        }}
      />

      {/* Pro Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    overflow: 'visible',
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
