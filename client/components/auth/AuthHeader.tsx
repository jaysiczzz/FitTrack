import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

const AuthHeader = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Welcome to FitTrack</Text>
      <Text style={styles.subtitle}>
        Your intelligent fitness companion powered by AI
      </Text>
    </View>
  )
}

export default AuthHeader

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center'
  },
})