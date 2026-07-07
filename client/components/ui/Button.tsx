import { Pressable, Text, StyleSheet, PressableProps } from 'react-native'
import { Colors } from '@/constants/colors'

interface ButtonProps extends PressableProps {
  title: string
}

const Button = ({ title, style, ...props }: ButtonProps) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.85 : 1 },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  text: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
})