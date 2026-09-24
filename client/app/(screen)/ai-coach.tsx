import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  chatWithCoachApi,
  getChatHistoryApi,
  clearChatHistoryApi,
  ChatMessage,
} from '@/api/ai';
import { authStorage } from '@/utils/authStorage';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface PromptCategory {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
}

const QUICK_TOPICS: PromptCategory[] = [
  {
    id: 'nutrition',
    label: 'Nutrition & Macros',
    icon: 'restaurant-outline',
    prompt: 'What should I eat for my next meal based on my current calorie and protein targets?',
  },
  {
    id: 'workout',
    label: 'Daily Workout',
    icon: 'barbell-outline',
    prompt: 'Suggest an effective workout routine tailored to my training goal today.',
  },
  {
    id: 'readiness',
    label: 'Energy & Recovery',
    icon: 'pulse-outline',
    prompt: 'How should I tailor today’s workout based on my daily readiness check-in and recovery level?',
  },
  {
    id: 'hydration',
    label: 'Hydration Strategy',
    icon: 'water-outline',
    prompt: 'How much water and electrolytes should I drink today to maximize training recovery?',
  },
  {
    id: 'plateau',
    label: 'Break Plateau',
    icon: 'flame-outline',
    prompt: 'What evidence-based adjustments can I make to break through my current weight and strength plateau?',
  },
  {
    id: 'technique',
    label: 'Form & Safety',
    icon: 'shield-checkmark-outline',
    prompt: 'What are the most critical form cues and breathing tips for squats, deadlifts, and bench press?',
  },
];

const INITIAL_GREETING: ChatMessage = {
  role: 'model',
  content:
    "👋 Hi there! I'm your **FitTrack AI Coach**.\n\nI have live access to your profile goals, daily readiness check-in, logged nutrition, and workout streak. Whether you need a quick meal recommendation, workout tips, or recovery guidance, I'm here to help you crush your goals.\n\nWhat would you like to focus on today?",
  createdAt: new Date().toISOString(),
};

export default function AiCoachScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const storageKey = authStorage.getScopedKey(user?.id, 'ai_coach_chat_history');

  // Load chat history: Local cache first, then cloud synchronization
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      // 1. Instant local cache load
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (cacheErr) {
        console.warn('Failed to load local coach chat cache:', cacheErr);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }

      // 2. Cloud DB synchronization
      try {
        const cloudRes = await getChatHistoryApi();
        if (cloudRes?.success && Array.isArray(cloudRes.messages) && cloudRes.messages.length > 0) {
          if (isMounted) {
            setMessages(cloudRes.messages);
            await AsyncStorage.setItem(storageKey, JSON.stringify(cloudRes.messages));
          }
        }
      } catch (cloudErr) {
        // Graceful offline fallback: keep local cache
        console.log('Cloud chat sync offline or unreachable, using local storage.');
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Save messages to local storage
  const persistMessagesLocally = useCallback(
    async (newMessages: ChatMessage[]) => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch (err) {
        console.error('Failed to persist coach chat history locally:', err);
      }
    },
    [storageKey]
  );

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    const resetList = [INITIAL_GREETING];
    setMessages(resetList);
    await persistMessagesLocally(resetList);
    setShowClearConfirm(false);

    try {
      await clearChatHistoryApi();
    } catch (err) {
      console.warn('Could not clear cloud chat history:', err);
    }

    showSuccess('Chat Cleared', 'Conversation history was reset.');
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isSending) return;

    setInputText('');
    setFailedMessage(null);
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsSending(true);
    scrollToBottom(true);

    try {
      const apiPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatWithCoachApi(apiPayload);

      if (res.success && res.message) {
        const coachMsg: ChatMessage = {
          role: 'model',
          content: res.message,
          createdAt: new Date().toISOString(),
        };
        const finalMessages = [...updatedMessages, coachMsg];
        setMessages(finalMessages);
        await persistMessagesLocally(finalMessages);
      } else {
        setFailedMessage(textToSend);
        showError('Coach Offline', 'Could not get a response from your AI Coach. Tap retry below.');
      }
    } catch (err: any) {
      console.error('Coach Chat Error:', err);
      setFailedMessage(textToSend);
      showError('Message Failed', 'Unable to reach AI Coach right now. Check your connection.');
    } finally {
      setIsSending(false);
      scrollToBottom(true);
    }
  };

  const handleRetryFailed = () => {
    if (failedMessage) {
      const msg = failedMessage;
      setFailedMessage(null);
      handleSend(msg);
    }
  };

  // Enhanced markdown-like formatting with headers, numbered lists, bullets, and bold
  const renderMessageContent = (content: string, isUser: boolean) => {
    const lines = content.split('\n');

    return (
      <View className="gap-1">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <View key={lineIdx} className="h-1.5" />;
          }

          const trimmed = line.trim();

          // Subheadings (e.g. ### Header or ## Header)
          const isHeading = trimmed.startsWith('###') || trimmed.startsWith('##');
          if (isHeading) {
            const cleanHeading = trimmed.replace(/^#{2,3}\s*/, '');
            return (
              <Text
                key={lineIdx}
                selectable
                className={`text-sm font-black mt-1 mb-0.5 ${
                  isUser ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                {cleanHeading}
              </Text>
            );
          }

          // Bullet point lines
          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
          // Numbered step lines (e.g. 1. 2. 3.)
          const numberedMatch = trimmed.match(/^(\d+\.)\s+/);
          const isNumbered = !!numberedMatch;

          const prefix = isBullet ? '•' : isNumbered && numberedMatch ? numberedMatch[1] : '';
          const cleanLine = isBullet
            ? trimmed.replace(/^[-*•]\s*/, '')
            : isNumbered
            ? trimmed.replace(/^\d+\.\s*/, '')
            : line;

          // Simple bold formatting split
          const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

          return (
            <View
              key={lineIdx}
              className={isBullet || isNumbered ? 'flex-row items-start pl-1' : ''}
            >
              {(isBullet || isNumbered) && (
                <Text
                  selectable
                  className={`text-xs mr-1.5 font-bold ${
                    isUser
                      ? 'text-white'
                      : isNumbered
                      ? 'text-accent dark:text-accent-dark font-black'
                      : 'text-accent dark:text-accent-dark'
                  }`}
                >
                  {prefix}
                </Text>
              )}
              <Text
                selectable
                className={`text-sm leading-5 flex-1 ${
                  isUser
                    ? 'text-white font-medium'
                    : 'text-text-primary dark:text-text-primary-dark font-normal'
                }`}
              >
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <Text
                        key={pIdx}
                        selectable
                        className={`font-black ${
                          isUser
                            ? 'text-white'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {part.slice(2, -2)}
                      </Text>
                    );
                  }
                  return <Text key={pIdx} selectable>{part}</Text>;
                })}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface dark:bg-surface-dark border-b border-input-border dark:border-input-border-dark shadow-xs z-10">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-input dark:bg-input-dark items-center justify-center mr-3 border border-input-border dark:border-input-border-dark"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="relative mr-3">
            <View className="w-10 h-10 rounded-full bg-accent/15 dark:bg-accent-dark/20 items-center justify-center border border-accent/40 dark:border-accent-dark/40">
              <Ionicons name="sparkles" size={20} color={colors.accent} />
            </View>
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface dark:border-surface-dark" />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text
                className="text-text-primary dark:text-text-primary-dark font-extrabold text-base"
                numberOfLines={1}
              >
                FitTrack Coach
              </Text>
              <View className="bg-accent/15 dark:bg-accent-dark/20 px-1.5 py-0.5 rounded-md">
                <Text className="text-accent dark:text-accent-dark text-[9px] font-black">AI 3.1</Text>
              </View>
            </View>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]" numberOfLines={1}>
              Real-Time Nutrition, Workout & Readiness Coach
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClearHistory}
          activeOpacity={0.7}
          className="w-9 h-9 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark"
          accessibilityLabel="Clear chat history"
        >
          <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sync Context Banner */}
      <View className="bg-accent/10 dark:bg-accent-dark/15 px-4 py-2 flex-row items-center justify-between border-b border-accent/20 dark:border-accent-dark/20">
        <View className="flex-row items-center flex-1 pr-2">
          <Ionicons name="sync-circle-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text className="text-[11px] font-medium text-accent dark:text-accent-dark" numberOfLines={1}>
            Live Profile, Daily Check-In & Nutrition Synced
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
          Synced
        </Text>
      </View>

      {/* Quick Topic Chips Carousel */}
      <View className="bg-surface/50 dark:bg-surface-dark/50 border-b border-input-border dark:border-input-border-dark py-2 px-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {QUICK_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              activeOpacity={0.7}
              onPress={() => handleSend(topic.prompt)}
              className="mr-2 px-3 py-1.5 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center shadow-2xs active:opacity-70"
            >
              <Ionicons name={topic.icon} size={12} color={colors.accent} style={{ marginRight: 5 }} />
              <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                {topic.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Chat Stream */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToBottom(false)}
        >
          {isLoadingHistory ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="small" color={colors.accent} />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-2 font-medium">
                Loading coach conversation...
              </Text>
            </View>
          ) : (
            <>
              {/* Message List */}
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const showAvatar = !isUser;

                return (
                  <View
                    key={index}
                    className={`flex-row mb-3.5 ${isUser ? 'justify-end' : 'justify-start items-end'}`}
                  >
                    {showAvatar && (
                      <View className="w-7 h-7 rounded-full bg-accent/20 dark:bg-accent-dark/25 items-center justify-center mr-2 mb-1 border border-accent/30 dark:border-accent-dark/30 shrink-0">
                        <Ionicons name="sparkles" size={13} color={colors.accent} />
                      </View>
                    )}

                    <View
                      className={`max-w-[84%] px-4 py-3 rounded-2xl ${
                        isUser
                          ? 'bg-accent dark:bg-accent-dark rounded-tr-xs shadow-xs'
                          : 'bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {renderMessageContent(msg.content, isUser)}

                      {msg.createdAt && (
                        <Text
                          className={`text-[9px] mt-1.5 self-end ${
                            isUser
                              ? 'text-white/80 font-medium'
                              : 'text-text-muted dark:text-text-muted-dark font-medium'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Typing / Thinking Indicator */}
              {isSending && (
                <View className="flex-row items-end mb-3.5 justify-start">
                  <View className="w-7 h-7 rounded-full bg-accent/20 dark:bg-accent-dark/25 items-center justify-center mr-2 mb-1 border border-accent/30 dark:border-accent-dark/30 shrink-0">
                    <Ionicons name="sparkles" size={13} color={colors.accent} />
                  </View>
                  <View className="bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark px-4 py-3 rounded-2xl rounded-tl-xs flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                      Coach is analyzing your stats & crafting guidance...
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Failed Message Retry Banner */}
        {failedMessage && (
          <View className="mx-4 mb-2 p-2.5 bg-danger/10 border border-danger/30 rounded-xl flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text className="text-xs text-danger dark:text-danger-dark font-medium" numberOfLines={1}>
                Message failed to send
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRetryFailed}
              className="bg-danger/20 px-2.5 py-1 rounded-lg"
            >
              <Text className="text-xs font-bold text-danger dark:text-danger-dark">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Chat Input Bar */}
        <View className="px-4 py-3 bg-surface dark:bg-surface-dark border-t border-input-border dark:border-input-border-dark">
          <View className="flex-row items-end gap-2">
            <View className="flex-1 bg-input dark:bg-input-dark rounded-2xl px-3.5 py-2 border border-input-border dark:border-input-border-dark max-h-28">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask your coach anything about food, workouts, or goals..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={600}
                className="text-text-primary dark:text-text-primary-dark text-sm p-0 leading-5"
                style={Platform.select({
                  web: { outlineStyle: 'none' } as any,
                })}
              />
            </View>

            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}
              className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs transition-opacity ${
                !inputText.trim() || isSending
                  ? 'bg-accent/30 dark:bg-accent-dark/30'
                  : 'bg-accent dark:bg-accent-dark'
              }`}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={!inputText.trim() ? colors.textMuted : '#FFFFFF'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Confirm Clear Conversation Modal */}
      <ConfirmModal
        visible={showClearConfirm}
        title="Reset Conversation"
        message="Are you sure you want to clear your chat history with your AI Coach? This will reset your conversation to a fresh session."
        iconName="trash-outline"
        confirmText="Clear Chat"
        cancelText="Cancel"
        isDanger
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </SafeAreaView>
  );
}
