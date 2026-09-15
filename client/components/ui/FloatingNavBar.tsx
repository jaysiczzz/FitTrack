import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AiScanModal from '@/components/foodlog/AiScanModal';
import { FoodLogItem } from '@/components/foodlog/foodLogTypes';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useThemeColors } from '@/constants/colors';

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
  const { colors, isDark } = useThemeColors();
  const [showScanModal, setShowScanModal] = useState(false);

  // Determine active route
  const getIsActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard' || pathname.includes('dashboard');
    }
    return pathname.includes(route.replace('/', ''));
  };

  const handleAddMealFromScan = async (item: FoodLogItem) => {
    try {
      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const saved = await AsyncStorage.getItem(foodKey);
      let arr: FoodLogItem[] = saved ? JSON.parse(saved) : [];
      arr.push(item);
      await AsyncStorage.setItem(foodKey, JSON.stringify(arr));
      await AsyncStorage.removeItem('food_log_today').catch(() => {});
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', item);
      showSuccess(`Added ${item.title}`, `${item.calories} kcal logged to ${item.mealType}`);
    } catch (e) {
      console.log('Error adding food from navbar scan:', e);
    }
  };

  const bottomInset = Math.max(8, insets.bottom);

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
                  onPress={() => {
                    if (!isActive) {
                      router.push(item.route as any);
                    }
                  }}
                  className="flex-1 items-center justify-center py-1"
                >
                  <View
                    className={`w-10 h-7.5 rounded-full items-center justify-center mb-0.5 ${
                      isActive
                        ? 'bg-accent/15 dark:bg-accent-dark/20'
                        : 'bg-transparent'
                    }`}
                  >
                    <Ionicons
                      name={isActive ? item.activeIcon : item.inactiveIcon}
                      size={22}
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
                onPress={() => setShowScanModal(true)}
                className="items-center justify-center -mt-5"
                hitSlop={{ top: 12, bottom: 8, left: 10, right: 10 }}
              >
                <View
                  className="w-13 h-13 rounded-full bg-accent dark:bg-accent-dark items-center justify-center border-4 border-surface dark:border-surface-dark"
                  style={[
                    styles.centerButton,
                    Platform.select({
                      web: {
                        boxShadow: '0 4px 12px rgba(13, 122, 87, 0.3)',
                      } as any,
                      default: {
                        elevation: 4,
                      },
                    }),
                  ]}
                >
                  <Ionicons name="camera" size={24} color={isDark ? colors.background : '#FFFFFF'} />
                </View>

                <Text
                  className="text-[10px] text-center tracking-tight font-bold text-accent dark:text-accent-dark mt-0.5"
                  numberOfLines={1}
                >
                  Scan
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
                  onPress={() => {
                    if (!isActive) {
                      router.push(item.route as any);
                    }
                  }}
                  className="flex-1 items-center justify-center py-1"
                >
                  <View
                    className={`w-10 h-7.5 rounded-full items-center justify-center mb-0.5 ${
                      isActive
                        ? 'bg-accent/15 dark:bg-accent-dark/20'
                        : 'bg-transparent'
                    }`}
                  >
                    <Ionicons
                      name={isActive ? item.activeIcon : item.inactiveIcon}
                      size={22}
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
          </View>
        </View>
      </View>

      {/* AI Food Scan Modal */}
      <AiScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onAddMealItem={handleAddMealFromScan}
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
