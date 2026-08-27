import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface NavItem {
  key: string;
  label: string;
  route: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: '📊' },
  { key: 'foodlog', label: 'Nutrition', route: '/foodlog', icon: '🥗' },
  { key: 'workouts', label: 'Workouts', route: '/workouts', icon: '🏋️‍♂️' },
  { key: 'profile', label: 'Profile', route: '/profile', icon: '👤' },
];

export default function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Determine active route
  const getIsActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard' || pathname.includes('dashboard');
    }
    return pathname.includes(route.replace('/', ''));
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: Math.max(14, insets.bottom + 6) },
      ]}
    >
      <View
        className="flex-row items-center justify-between bg-surface/90 dark:bg-[#121824]/90 border border-input-border/60 dark:border-white/10 rounded-full px-2.5 py-2 w-full max-w-[390px] shadow-2xl backdrop-blur-xl"
        style={Platform.select({
          web: {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)',
          } as any,
          default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 12,
          },
        })}
      >
        {NAV_ITEMS.map((item) => {
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
              className={`flex-row items-center py-2 px-3.5 rounded-full ${
                isActive
                  ? 'bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 dark:border-accent-dark/40'
                  : 'bg-transparent border border-transparent'
              }`}
            >
              <Text
                className={`text-lg ${
                  isActive ? 'scale-110' : 'opacity-70'
                }`}
              >
                {item.icon}
              </Text>

              {isActive ? (
                <Text className="ml-1.5 text-xs font-black text-accent dark:text-accent-dark">
                  {item.label}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 16,
  },
});
