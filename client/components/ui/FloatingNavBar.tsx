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

  const bottomInset = Math.max(10, insets.bottom);

  return (
    <View
      style={[
        styles.navBarContainer,
        {
          paddingBottom: bottomInset,
        },
        Platform.select({
          web: {
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.25), 0 -1px 4px rgba(0, 0, 0, 0.1)',
          } as any,
          default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 16,
          },
        }),
      ]}
      className="w-full bg-surface/95 dark:bg-[#0E131F]/95 border-t border-input-border/70 dark:border-white/10"
    >
      <View className="flex-row items-center justify-around w-full max-w-[480px] self-center pt-2 px-3">
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
              className="flex-1 items-center justify-center py-1"
            >
              {/* Icon Container with subtle active pill glow */}
              <View
                className={`w-12 h-8 rounded-full items-center justify-center mb-1 ${
                  isActive
                    ? 'bg-accent/15 dark:bg-accent-dark/25'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xl ${
                    isActive ? 'scale-110' : 'opacity-65'
                  }`}
                >
                  {item.icon}
                </Text>
              </View>

              {/* Text Label Below Icon (Always Visible) */}
              <Text
                className={`text-[11px] text-center tracking-tight ${
                  isActive
                    ? 'text-accent dark:text-accent-dark font-black'
                    : 'text-text-muted dark:text-text-muted-dark font-semibold opacity-80'
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
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
