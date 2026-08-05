import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';

type BurgerMenuProps = {
  title?: string;
};

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: '📊' },
  { key: 'food', label: 'Food Log', route: '/foodlog', icon: '🍽️' },
  { key: 'workouts', label: 'Workouts', route: '/workouts', icon: '🏋️' },
  { key: 'profile', label: 'Profile', route: '/profile', icon: '👤' },
  { key: 'notifications', label: 'Notifications', route: '/notifications', icon: '🔔' },
  { key: 'settings', label: 'Settings', route: '/settings', icon: '⚙️' },
];

export default function BurgerMenu({ title }: BurgerMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuItem = (route: string) => {
    setMenuOpen(false);
    router.push(route);
  };

  return (
    <View className="h-14 flex-row items-center bg-background px-10 dark:bg-background-dark">
      <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={10}>
        <Text className="text-xl text-text-primary dark:text-white">
          ☰
        </Text>
      </TouchableOpacity>

      <Text className="ml-4 text-lg font-bold text-text-primary dark:text-white">
        {title}
      </Text>

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
            className="mt-14 ml-3 w-56 rounded-xl bg-white py-2 shadow-lg dark:bg-neutral-900"
            onPress={(e) => e.stopPropagation()}
          >
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleMenuItem(item.route)}
                className="flex-row items-center px-4 py-3"
              >
                <Text className="mr-3 text-lg">{item.icon}</Text>
                <Text className="text-base text-text-primary dark:text-white">
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