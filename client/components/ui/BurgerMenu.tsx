import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BurgerMenuProps = {
  title?: string;
};

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: '📊' },
  { key: 'food', label: 'Food Log', route: '/foodlog', icon: '🍽️' },
  { key: 'workouts', label: 'Workouts', route: '/workouts', icon: '🏋️' },
  { key: 'profile', label: 'Profile', route: '/profile', icon: '👤' },
  { key: 'settings', label: 'Settings', route: '/settings', icon: '⚙️' },
];

export default function BurgerMenu({ title }: BurgerMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuItem = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-background dark:bg-background-dark border-b border-input-border/20 dark:border-input-border-dark/20 z-50"
    >
      <View className="h-14 flex-row items-center px-5">
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Open navigation menu"
          accessibilityRole="button"
          className="w-10 h-10 items-center justify-center rounded-lg active:bg-surface dark:active:bg-surface-dark"
        >
          <Text className="text-2xl text-text-primary dark:text-white">
            ☰
          </Text>
        </TouchableOpacity>

        {title ? (
          <Text className="ml-3 text-lg font-bold text-text-primary dark:text-white">
            {title}
          </Text>
        ) : null}
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            style={{ marginTop: insets.top + 56 }}
            className="ml-5 w-60 rounded-2xl bg-surface p-2 shadow-xl border border-input-border dark:border-input-border-dark dark:bg-surface-dark"
            onPress={(e) => e.stopPropagation()}
          >
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleMenuItem(item.route)}
                className="flex-row items-center rounded-xl px-4 py-3 active:bg-input dark:active:bg-input-dark"
              >
                <Text className="mr-3 text-lg">{item.icon}</Text>
                <Text className="text-base font-semibold text-text-primary dark:text-white">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}