import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface AuthTabsProps {
  active: 'login' | 'register'
  onChange: (mode: 'login' | 'register') => void
}

const AuthTabs = ({ active, onChange }: AuthTabsProps) => {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, active === 'login' && styles.activeTab]}
        onPress={() => onChange('login')}
      >
        <Text style={active === 'login' ? styles.activeText : styles.inactiveText}>
          Log In
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, active === 'register' && styles.activeTab]}
        onPress={() => onChange('register')}
      >
        <Text style={active === 'register' ? styles.activeText : styles.inactiveText}>
          Register
        </Text>
      </Pressable>
    </View>
  )
}

export default AuthTabs

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  activeText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  inactiveText: {
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
})