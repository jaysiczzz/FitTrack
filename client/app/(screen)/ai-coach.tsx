import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  chatWithCoachApi,
  streamChatWithCoachApi,
  getChatHistoryApi,
  clearChatHistoryApi,
  ChatMessage,
} from '@/api/ai';

import { authStorage } from '@/utils/authStorage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import QuotaUsageMeter from '@/components/ui/QuotaUsageMeter';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Active cancellation refs for in-flight streaming/fetch
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Quota & tier tracking
  const [isPro, setIsPro] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [resetsAt, setResetsAt] = useState<string | null>(null);
  const [quotaReached, setQuotaReached] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const storageKey = authStorage.getScopedKey(user?.id, 'ai_coach_chat_history');

  // Dynamic reactive presence status based on genuine network, model, and quota states
  const statusInfo = useMemo(() => {
    if (isSending) {
      return {
        label: 'Thinking...',
        dotColor: 'bg-accent dark:bg-accent-dark',
        textColor: 'text-accent dark:text-accent-dark',
      };
    }
    if (failedMessage || isConnectionError) {
      return {
        label: 'Offline · Check connection',
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-600 dark:text-rose-400',
      };
    }
    if (quotaReached || (remainingMessages !== null && remainingMessages <= 0)) {
      return {
        label: 'Daily limit reached',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    }
    if (isLoadingHistory) {
      return {
        label: 'Connecting...',
        dotColor: 'bg-slate-400 dark:bg-slate-500',
        textColor: 'text-text-muted dark:text-text-muted-dark',
      };
    }
    return {
      label: 'Online · Ready to help',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    };
  }, [isSending, failedMessage, isConnectionError, quotaReached, remainingMessages, isLoadingHistory]);

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
        if (cloudRes?.success && isMounted) {
          setIsConnectionError(false);
          if (cloudRes.isPro !== undefined) setIsPro(cloudRes.isPro);
          if (cloudRes.dailyLimit !== undefined) setDailyLimit(cloudRes.dailyLimit);
          if (cloudRes.resetsAt !== undefined) setResetsAt(cloudRes.resetsAt);
          if (cloudRes.remainingMessages !== undefined && cloudRes.remainingMessages !== null) {
            setRemainingMessages(cloudRes.remainingMessages);
            if (cloudRes.remainingMessages === 0) {
              setQuotaReached(true);
            }
          }
          if (Array.isArray(cloudRes.messages) && cloudRes.messages.length > 0) {
            setMessages(cloudRes.messages);
            await AsyncStorage.setItem(storageKey, JSON.stringify(cloudRes.messages));
          }
        }
      } catch (cloudErr) {
        // Graceful offline fallback: keep local cache
        if (isMounted) setIsConnectionError(true);
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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      activeXhrRef.current?.abort();
      activeAbortControllerRef.current?.abort();
    };
  }, []);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    // 1. Immediately abort any active stream or HTTP request
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsSending(false);
    setFailedMessage(null);
    setInputText('');
    Keyboard.dismiss();

    const resetList = [INITIAL_GREETING];
    setMessages(resetList);
    await persistMessagesLocally(resetList);
    setShowClearConfirm(false);

    try {
      await clearChatHistoryApi();
      setIsConnectionError(false);
    } catch (err) {
      console.warn('Could not clear cloud chat history:', err);
    }

    showSuccess('Chat Cleared', 'Conversation history was reset.');
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isSending) return;

    if (!isPro && remainingMessages !== null && remainingMessages <= 0) {
      setQuotaReached(true);
      setShowSubscriptionModal(true);
      return;
    }

    if (isPro && remainingMessages !== null && remainingMessages <= 0) {
      showError('Fair Use Limit Reached', `You have reached today's Fair Use limit of ${dailyLimit || 150} AI Coach messages. Your quota will refresh at midnight.`);
      return;
    }

    // Cancel any previous lingering requests cleanly
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    activeAbortControllerRef.current = new AbortController();

    setInputText('');
    setFailedMessage(null);
    setIsConnectionError(false);
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

    const apiPayload = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const tempModelId = `stream_${Date.now()}`;
    let streamedText = '';

    try {
      let streamSuccess = false;

      try {
        // Optimistically insert streaming placeholder
        setMessages([
          ...updatedMessages,
          {
            id: tempModelId,
            role: 'model',
            content: '',
            createdAt: new Date().toISOString(),
          },
        ]);

        const streamRes = await streamChatWithCoachApi(
          apiPayload,
          (chunk: string) => {
            streamedText += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempModelId ? { ...m, content: streamedText } : m
              )
            );
            scrollToBottom(false);
          },
          (xhr) => {
            activeXhrRef.current = xhr;
          }
        );

        if (streamRes.success && (streamRes.message || streamedText)) {
          const finalText = streamRes.message || streamedText;
          const finalMessages = [
            ...updatedMessages,
            {
              role: 'model' as const,
              content: finalText,
              createdAt: new Date().toISOString(),
            },
          ];
          setMessages(finalMessages);
          await persistMessagesLocally(finalMessages);
          streamSuccess = true;
          setIsConnectionError(false);
          if (remainingMessages !== null) {
            const nextRemaining = Math.max(0, remainingMessages - 1);
            setRemainingMessages(nextRemaining);
            if (nextRemaining === 0) setQuotaReached(true);
          }
        }
      } catch (streamErr: any) {
        // If aborted by user action (clearing chat or leaving screen), exit cleanly
        if (
          streamErr?.message === 'Request aborted' ||
          streamErr?.name === 'AbortError' ||
          activeAbortControllerRef.current?.signal.aborted
        ) {
          return;
        }

        const streamErrText = streamErr?.message || '';
        if (
          streamErrText.includes('LIMIT_REACHED') ||
          streamErrText.includes('DAILY_AI_LIMIT_REACHED') ||
          streamErr?.status === 429
        ) {
          throw streamErr;
        }
        // Stream failed or timed out (25s), try standard JSON fallback with active abort signal
      }

      if (!streamSuccess) {
        // Check if aborted in the meantime
        if (activeAbortControllerRef.current?.signal.aborted) {
          return;
        }

        // Fallback to standard request
        const res = await chatWithCoachApi(apiPayload, {
          signal: activeAbortControllerRef.current?.signal,
        });
        if (res.success && res.message) {
          setIsConnectionError(false);
          if (res.isPro !== undefined) setIsPro(res.isPro);
          if (res.dailyLimit !== undefined) setDailyLimit(res.dailyLimit);
          if (res.resetsAt !== undefined) setResetsAt(res.resetsAt);
          if (res.remainingMessages !== undefined && res.remainingMessages !== null) {
            setRemainingMessages(res.remainingMessages);
            if (res.remainingMessages === 0) setQuotaReached(true);
          }
          const coachMsg: ChatMessage = {
            role: 'model',
            content: res.message,
            createdAt: new Date().toISOString(),
          };
          const finalMessages = [...updatedMessages, coachMsg];
          setMessages(finalMessages);
          await persistMessagesLocally(finalMessages);
        } else {
          setIsConnectionError(true);
          setMessages(updatedMessages);
          setFailedMessage(textToSend);
          showError('Coach Offline', 'Could not get a response from your AI Coach. Tap retry below.');
        }
      }
    } catch (err: any) {
      if (
        err?.message === 'Request aborted' ||
        err?.name === 'AbortError' ||
        activeAbortControllerRef.current?.signal.aborted
      ) {
        return;
      }
      console.error('Coach Chat Error:', err);
      const errText = err?.message || '';
      if (
        errText.includes('LIMIT_REACHED') ||
        errText.includes('DAILY_AI_LIMIT_REACHED') ||
        err?.status === 429
      ) {
        setIsConnectionError(false);
        setMessages(updatedMessages);
        setQuotaReached(true);
        setRemainingMessages(0);
        if (err?.resetsAt) setResetsAt(err.resetsAt);
        showError(
          'Daily Limit Reached',
          `Daily message limit of ${dailyLimit || (isPro ? 150 : 15)} reached. Resets at midnight UTC.`
        );
      } else {
        setIsConnectionError(true);
        setMessages(updatedMessages);
        setFailedMessage(textToSend);
        showError('Message Failed', 'Unable to reach AI Coach right now. Tap retry to send again.');
      }
    } finally {
      activeXhrRef.current = null;
      activeAbortControllerRef.current = null;
      setIsSending(false);
      scrollToBottom(true);
    }
  };

  const handleRetryFailed = () => {
    if (failedMessage) {
      setIsConnectionError(false);
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
                  className={`text-xs mr-1.5 font-bold shrink-0 ${
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
                className={`text-sm leading-5 ${
                  isBullet || isNumbered ? 'flex-1' : ''
                } ${
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
                  return (
                    <Text
                      key={pIdx}
                      className={
                        isUser
                          ? 'text-white'
                          : 'text-text-primary dark:text-text-primary-dark'
                      }
                    >
                      {part}
                    </Text>
                  );
                })}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-surface dark:bg-surface-dark border-b border-input-border dark:border-input-border-dark shadow-xs z-10">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => {
                if (activeXhrRef.current) {
                  activeXhrRef.current.abort();
                  activeXhrRef.current = null;
                }
                if (activeAbortControllerRef.current) {
                  activeAbortControllerRef.current.abort();
                  activeAbortControllerRef.current = null;
                }
                Keyboard.dismiss();
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(screen)/dashboard');
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-11 h-11 rounded-full bg-input dark:bg-input-dark items-center justify-center mr-3 border border-input-border dark:border-input-border-dark"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View className="relative mr-3">
              <View className="w-10 h-10 rounded-full bg-accent/15 dark:bg-accent-dark/20 items-center justify-center border border-accent/40 dark:border-accent-dark/40">
                <Ionicons name="fitness" size={20} color={colors.accent} />
              </View>
              <View
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusInfo.dotColor} border-2 border-surface dark:border-surface-dark`}
                accessibilityLabel={`Status: ${statusInfo.label}`}
              />
            </View>

            <View className="flex-1">
              <Text
                className="text-text-primary dark:text-text-primary-dark font-extrabold text-base"
                numberOfLines={1}
              >
                FitTrack Coach
              </Text>
              <Text className={`text-[11px] ${statusInfo.textColor} font-semibold`} numberOfLines={1}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClearHistory}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-11 h-11 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark"
            accessibilityLabel="Clear chat history"
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quick Topic Chips Carousel */}
        <View className="bg-surface/50 dark:bg-surface-dark/50 border-b border-input-border dark:border-input-border-dark py-1.5 px-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {QUICK_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={0.7}
                onPress={() => handleSend(topic.prompt)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                className="mr-2 px-3 py-1.5 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center shadow-2xs active:opacity-70"
              >
                <Ionicons name={topic.icon} size={13} color={colors.accent} style={{ marginRight: 5 }} />
                <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reusable Quota Usage Meter */}
        <View className="px-4 py-2 border-b border-input-border/30 dark:border-input-border-dark/30">
          <QuotaUsageMeter
            isPro={isPro}
            used={dailyLimit !== null && remainingMessages !== null ? Math.max(0, dailyLimit - remainingMessages) : 0}
            limit={dailyLimit || (isPro ? 150 : 15)}
            unit="messages"
            period="day"
            resetsAt={resetsAt || undefined}
            onUpgradePress={() => setShowSubscriptionModal(true)}
          />
        </View>

        {/* Main Chat Stream */}
        <View className="flex-1 w-full max-w-3xl self-center">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-3"
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToBottom(false)}
          >
            {isLoadingHistory && messages.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color={colors.accent} />
                <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-2 font-medium">
                  Getting your conversation ready...
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
                          <Ionicons name="fitness" size={14} color={colors.accent} />
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
                      <Ionicons name="fitness" size={14} color={colors.accent} />
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
                <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
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

          {/* Quota Exhausted Banner */}
          {quotaReached && (
            <View className="mx-4 mb-2 p-3 rounded-xl bg-accent/10 border border-accent/25 flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  Daily Limit Reached ({dailyLimit || (isPro ? 150 : 15)}/{dailyLimit || (isPro ? 150 : 15)})
                </Text>
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
                  Daily messages reset at midnight UTC. {isPro ? 'Thank you for being a Pro member!' : 'Upgrade to FitTrack Pro for 150 messages/day.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSubscriptionModal(true)}
                className="px-3 py-1.5 rounded-lg bg-accent"
              >
                <Text className="text-xs font-bold text-accent-contrast">
                  {isPro ? 'View Plan' : 'See Pro plan'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Chat Input Bar */}
          <View
            className="px-4 py-3 bg-surface dark:bg-surface-dark border-t border-input-border dark:border-input-border-dark"
            style={{
              paddingBottom: isKeyboardVisible
                ? (Platform.OS === 'ios' ? 8 : 10)
                : Math.max(20, insets.bottom + 8),
            }}
          >
            <View className="flex-row items-center gap-2">
              <View className="flex-1 bg-input dark:bg-input-dark rounded-2xl px-3.5 py-2.5 border border-input-border dark:border-input-border-dark min-h-[44px] justify-center max-h-28">
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                  placeholder={
                    quotaReached
                      ? `Daily limit reached (${dailyLimit || (isPro ? 150 : 15)}/${dailyLimit || (isPro ? 150 : 15)}). Resets at midnight UTC...`
                      : 'Ask your coach anything about food, workouts, or goals...'
                  }
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={600}
                  editable={isPro || !quotaReached}
                  className="text-text-primary dark:text-text-primary-dark text-sm p-0 leading-5"
                  style={Platform.select({
                    web: { outlineStyle: 'none' } as any,
                  })}
                />
              </View>

              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isSending || (!isPro && quotaReached)}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs transition-opacity shrink-0 ${
                  !inputText.trim() || isSending || (!isPro && quotaReached)
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

      {/* Subscription Upgrade Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionUpdated={() => {
          setIsPro(true);
          setQuotaReached(false);
          setRemainingMessages(null);
        }}
      />
    </SafeAreaView>
  );
}
