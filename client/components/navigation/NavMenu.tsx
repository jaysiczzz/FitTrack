import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import NavMenuItem from '@/components/navigation/NavMenuItem';
import colors from '@/constants/colors';

const MENU_ITEMS = [
  { label: 'Dashboard', route: '/(app)/dashboard', icon: 'grid' as const, set: 'feather' as const },
  { label: 'Food Log', route: '/(app)/food-log', icon: 'book-open' as const, set: 'feather' as const },
  { label: 'Workouts', route: '/(app)/workouts', icon: 'dumbbell' as const, set: 'mci' as const },
  { label: 'Profile', route: '/(app)/profile', icon: 'user' as const, set: 'feather' as const },
  { label: 'Notifications', route: '/(app)/notifications', icon: 'bell' as const, set: 'feather' as const },
  { label: 'Settings', route: '/(app)/settings', icon: 'settings' as const, set: 'feather' as const },
];

const NavMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const navigate = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  const handleLogout = () => {
    setOpen(false);
    router.replace('/(auth)');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.hamburger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityLabel="Open navigation menu"
      >
        <Feather name="menu" size={18} color={colors.textPrimary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            {MENU_ITEMS.map((item) => (
              <NavMenuItem
                key={item.route}
                label={item.label}
                icon={
                  item.set === 'mci' ? (
                    <MaterialCommunityIcons name={item.icon as 'dumbbell'} size={18} color={colors.textPrimary} />
                  ) : (
                    <Feather name={item.icon as keyof typeof Feather.glyphMap} size={18} color={colors.textPrimary} />
                  )
                }
                onPress={() => navigate(item.route)}
              />
            ))}

            <View style={styles.divider} />

            <NavMenuItem
              label="Logout"
              danger
              icon={<Feather name="log-out" size={18} color={colors.danger} />}
              onPress={handleLogout}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 24,
  },
  menu: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginHorizontal: 16,
    marginVertical: 4,
  },
});

export default NavMenu;
