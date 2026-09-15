import React from 'react';
import { View, Text, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const { colors } = useThemeColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark h-[80%] shadow-xl">
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Privacy & Data Policy
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                How FitTrack handles your health & nutrition data
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="flex-1 mt-3.5 pr-1" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                🔒 Security & Encryption
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-relaxed">
                FitTrack protects your credentials with industry-standard bcrypt hashing and short-lived JWT access tokens with rotating refresh tokens. Sensitive authentication tokens are stored in your device's hardware-backed SecureStore.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                🥗 Health & Food Logs
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-relaxed">
                Your meals, water intake, and workout records are stored securely and never shared with or sold to third-party advertisers. All nutrition calculations are performed strictly to help you reach your personal fitness goals.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                ✨ AI Vision & Photo Analysis
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-relaxed">
                When you scan food with our AI food scanner, images are processed in real-time via Google Gemini Vision solely to estimate macros and calories. Images are not retained or used for public machine learning training.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                📱 Offline Storage
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-relaxed">
                Recent foods, check-ins, and notification preferences are cached locally on your device for instant performance and offline functionality. Logging out automatically clears session caches from your device.
              </Text>
            </View>

            <View className="py-3 items-center">
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark text-center mb-1">
                For privacy inquiries or account data requests, contact us at:
              </Text>
              <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                fittrack.app.help@gmail.com
              </Text>
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-2">
                FitTrack Version 1.0.5 · Last updated September 2026
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
