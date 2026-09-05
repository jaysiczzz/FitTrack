import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AiScanModal from '@/components/foodlog/AiScanModal';
import { FoodLogItem } from '@/components/foodlog/foodLogTypes';
import { useToast } from '@/context/ToastContext';

export interface NavItem {
  key: string;
  label: string;
  route: string;
  icon: string;
}

const NAV_ITEMS_LEFT: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: '📊' },
  { key: 'foodlog', label: 'Nutrition', route: '/foodlog', icon: '🥗' },
];

const NAV_ITEMS_RIGHT: NavItem[] = [
  { key: 'workouts', label: 'Workouts', route: '/workouts', icon: '🏋️‍♂️' },
  { key: 'profile', label: 'Profile', route: '/profile', icon: '👤' },
];

export default function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { showSuccess } = useToast();
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
      const saved = await AsyncStorage.getItem('food_log_today');
      let arr: FoodLogItem[] = saved ? JSON.parse(saved) : [];
      arr.push(item);
      await AsyncStorage.setItem('food_log_today', JSON.stringify(arr));
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', item);
      showSuccess(`Added ${item.title}`, `${item.calories} kcal logged to ${item.mealType}`);
    } catch (e) {
      console.log('Error adding food from navbar scan:', e);
    }
  };

  const bottomInset = Math.max(6, insets.bottom);

  return (
    <>
      <View
        pointerEvents="box-none"
        style={styles.navBarContainer}
      >
        <View
          style={[
            {
              paddingBottom: bottomInset,
            },
            Platform.select({
              web: {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 -2px 15px rgba(0, 0, 0, 0.18)',
              } as any,
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 10,
              },
            }),
          ]}
          className="w-full bg-surface/95 dark:bg-[#0E131F]/95 border-t border-input-border/60 dark:border-white/10"
        >
          <View className="flex-row items-center justify-around w-full max-w-[440px] self-center pt-1.5 px-2">
            {/* Left Nav Items: Dashboard, Nutrition */}
            {NAV_ITEMS_LEFT.map((item) => {
              const isActive = getIsActive(item.route);

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (!isActive) {
                      router.push(item.route as any);
                    }
                  }}
                  className="flex-1 items-center justify-center py-0.5"
                >
                  {/* Icon Container */}
                  <View
                    className={`w-9 h-6 rounded-full items-center justify-center mb-0.5 ${
                      isActive
                        ? 'bg-accent/15 dark:bg-accent-dark/25'
                        : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[17px] ${
                        isActive ? 'scale-105' : 'opacity-60'
                      }`}
                    >
                      {item.icon}
                    </Text>
                  </View>

                  {/* Text Label */}
                  <Text
                    className={`text-[10px] text-center tracking-tight leading-3 ${
                      isActive
                        ? 'text-accent dark:text-accent-dark font-extrabold'
                        : 'text-text-muted dark:text-text-muted-dark font-medium opacity-75'
                    }`}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Center Protruding Action Button: AI Food Scan */}
            <View className="flex-1 items-center justify-center">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowScanModal(true)}
                className="items-center justify-center -mt-6"
                hitSlop={{ top: 12, bottom: 8, left: 10, right: 10 }}
              >
                {/* Elevated Prominent Circular Scanner Icon */}
                <View
                  className="w-14 h-14 rounded-full bg-accent dark:bg-accent-dark items-center justify-center border-[3.5px] border-surface dark:border-[#0E131F]"
                  style={Platform.select({
                    web: {
                      boxShadow: '0 4px 14px rgba(0, 229, 160, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15)',
                    } as any,
                    default: {
                      shadowColor: '#00E5A0',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.45,
                      shadowRadius: 8,
                      elevation: 8,
                    },
                  })}
                >
                  <Text className="text-[24px]">📸</Text>
                </View>

                {/* Text Label Below Icon */}
                <Text
                  className="text-[10px] text-center tracking-tight leading-3 font-extrabold text-accent dark:text-accent-dark mt-0.5"
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
                  onPress={() => {
                    if (!isActive) {
                      router.push(item.route as any);
                    }
                  }}
                  className="flex-1 items-center justify-center py-0.5"
                >
                  {/* Icon Container */}
                  <View
                    className={`w-9 h-6 rounded-full items-center justify-center mb-0.5 ${
                      isActive
                        ? 'bg-accent/15 dark:bg-accent-dark/25'
                        : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[17px] ${
                        isActive ? 'scale-105' : 'opacity-60'
                      }`}
                    >
                      {item.icon}
                    </Text>
                  </View>

                  {/* Text Label */}
                  <Text
                    className={`text-[10px] text-center tracking-tight leading-3 ${
                      isActive
                        ? 'text-accent dark:text-accent-dark font-extrabold'
                        : 'text-text-muted dark:text-text-muted-dark font-medium opacity-75'
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
});
