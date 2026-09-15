import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { sendFeedbackApi, FeedbackPayload } from '@/api/support';
import ModalCloseButton from '../ui/ModalCloseButton';

interface FaqItem {
  id: string;
  category: 'nutrition' | 'workouts' | 'account' | 'ai';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'food-log',
    category: 'nutrition',
    question: 'How do I log meals in FitTrack?',
    answer:
      'Go to the Food Log tab and tap "+ Add" on Breakfast, Lunch, Dinner, or Snacks. You can search from over 30 verified staples, search the live Open Food Facts catalog, or tap the camera icon to scan your food with AI.',
  },
  {
    id: 'ai-scanner',
    category: 'ai',
    question: 'How does the AI Food Scanner work?',
    answer:
      'The scanner uses Google Gemini Vision AI. Snap a clear photo of your plate or describe your meal. The AI estimates portion size, calories, protein, carbs, and fat automatically, and lets you edit the numbers before logging.',
  },
  {
    id: 'calorie-target',
    category: 'nutrition',
    question: 'How is my daily calorie target calculated?',
    answer:
      'FitTrack calculates your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor formula based on your weight, height, age, and fitness goal (Muscle Gain or Weight Loss).',
  },
  {
    id: 'water-tracker',
    category: 'nutrition',
    question: 'How does the water tracker work?',
    answer:
      'Your daily hydration target is 2,000 ml. Use the +250 ml and +500 ml 1-tap buttons on your Dashboard or Food Log. The tracker automatically resets at midnight each day.',
  },
  {
    id: 'track-sets',
    category: 'workouts',
    question: 'How do I log exercise sets during a workout?',
    answer:
      'On the Workouts tab (Today), tap "+ Add Exercise" or generate an AI routine. For each exercise, adjust weight and reps, then tap the checkmark button when completed. When finished, tap "Complete Session" to record calories burned and history.',
  },
  {
    id: 'exercise-form',
    category: 'workouts',
    question: 'Where can I find proper exercise form guides?',
    answer:
      'Tap the "Exercise Library" tab under Workouts. Tap any of the 32 master exercises to view full step-by-step instructions, breathing technique, form tips, and common mistakes to avoid injuries.',
  },
  {
    id: 'ai-workout',
    category: 'ai',
    question: 'How does the AI Workout Generator work?',
    answer:
      'Tap the sparkle icon in the Workouts tab. The AI analyzes your fitness goal, experience level, and preferred duration to generate a personalized balanced routine with target sets and reps.',
  },
  {
    id: 'profile-update',
    category: 'account',
    question: 'Can I change my fitness goal or measurements?',
    answer:
      'Yes! Open the Profile screen anytime to adjust your weight, height, age, or toggle between Muscle Gain and Weight Loss. Your macro targets adjust dynamically.',
  },
  {
    id: 'dark-mode',
    category: 'account',
    question: 'How do I enable Dark Mode?',
    answer:
      'In Settings under Preferences, toggle the Dark Mode switch. FitTrack uses a calibrated WCAG AA compliant palette for comfortable eye relief in any lighting condition.',
  },
];

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'faq' | 'contact';
}

export default function HelpSupportModal({
  visible,
  onClose,
  initialTab = 'faq',
}: HelpSupportModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('food-log');

  // Contact form states
  const [feedbackCategory, setFeedbackCategory] = useState<'GENERAL' | 'BUG' | 'FEATURE' | 'QUESTION'>('GENERAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleSendFeedback = async () => {
    if (!subject.trim()) {
      showError('Required Field', 'Please enter a subject line.');
      return;
    }
    if (message.trim().length < 10) {
      showError('Message Too Short', 'Please enter at least 10 characters in your message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendFeedbackApi({
        category: feedbackCategory,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim() || undefined,
      });

      showSuccess('Feedback Sent', res.message || 'Thank you! Your feedback has been received.');
      setSubject('');
      setMessage('');
      setEmail('');
      onClose();
    } catch (err: any) {
      showError('Submission Error', err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectEmail = () => {
    const emailUrl = `mailto:support@fittrack.com?subject=${encodeURIComponent(
      subject ? `[FitTrack Support] ${subject}` : 'FitTrack Support Request'
    )}&body=${encodeURIComponent(message || '')}`;
    Linking.openURL(emailUrl).catch(() => {
      showError('Email Client Error', 'Could not open default email app.');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark h-[88%] shadow-xl">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Help & Support
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Guides, FAQs, and direct assistance
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Segmented Tab Switcher */}
          <View className="flex-row p-1 bg-input dark:bg-input-dark rounded-xl my-3">
            <TouchableOpacity
              onPress={() => setActiveTab('faq')}
              activeOpacity={0.8}
              className={`flex-1 py-2 rounded-lg items-center justify-center ${
                activeTab === 'faq' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'faq'
                    ? 'text-text-primary dark:text-text-primary-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                FAQs & Guide
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('contact')}
              activeOpacity={0.8}
              className={`flex-1 py-2 rounded-lg items-center justify-center ${
                activeTab === 'contact' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'contact'
                    ? 'text-text-primary dark:text-text-primary-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Contact & Feedback
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: FAQS */}
          {activeTab === 'faq' ? (
            <View className="flex-1">
              {/* Search Bar */}
              <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl px-3 py-2 border border-input-border dark:border-input-border-dark mb-2.5">
                <Ionicons name="search" size={16} color={colors.textMuted} className="mr-2" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search questions or topics..."
                  placeholderTextColor={colors.textMuted}
                  className="flex-1 text-xs text-text-primary dark:text-text-primary-dark p-0"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Category Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
                {[
                  { id: 'all', label: 'All Topics' },
                  { id: 'nutrition', label: '🥗 Nutrition' },
                  { id: 'workouts', label: '🏋️ Workouts' },
                  { id: 'ai', label: '✨ AI Features' },
                  { id: 'account', label: '⚙️ Account' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full mr-1.5 border ${
                      selectedCategory === cat.id
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        selectedCategory === cat.id
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* FAQ Accordion List */}
              <ScrollView className="flex-1 mt-1" showsVerticalScrollIndicator={false}>
                {filteredFaqs.length === 0 ? (
                  <View className="py-10 items-center justify-center">
                    <Ionicons name="help-circle-outline" size={36} color={colors.textMuted} />
                    <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mt-2 text-center">
                      No matching answers found.{'\n'}Switch to the Contact tab to reach our team!
                    </Text>
                  </View>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <View
                        key={faq.id}
                        className="mb-2 bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark overflow-hidden"
                      >
                        <TouchableOpacity
                          onPress={() => toggleFaq(faq.id)}
                          activeOpacity={0.8}
                          className="flex-row items-center justify-between p-3.5"
                        >
                          <Text className="flex-1 text-xs font-bold text-text-primary dark:text-text-primary-dark pr-2">
                            {faq.question}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>

                        {isExpanded ? (
                          <View className="px-3.5 pb-3.5 pt-0 border-t border-input-border/40 dark:border-input-border-dark/40">
                            <Text className="text-xs leading-relaxed text-text-muted dark:text-text-muted-dark pt-2">
                              {faq.answer}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : (
            /* TAB 2: CONTACT & FEEDBACK */
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {[
                  { id: 'GENERAL', label: 'General Feedback' },
                  { id: 'BUG', label: '🐛 Bug Report' },
                  { id: 'FEATURE', label: '💡 Feature Idea' },
                  { id: 'QUESTION', label: '❓ Question' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setFeedbackCategory(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      feedbackCategory === item.id
                        ? 'bg-accent/15 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        feedbackCategory === item.id
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1">
                  Subject
                </Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Question about calorie calculation"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark p-3 text-xs text-text-primary dark:text-text-primary-dark"
                />
              </View>

              {/* Message */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1">
                  Message Details
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your issue or feedback in detail..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark p-3 text-xs text-text-primary dark:text-text-primary-dark min-h-[90px]"
                />
              </View>

              {/* Email (Optional) */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1">
                  Contact Email (Optional)
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark p-3 text-xs text-text-primary dark:text-text-primary-dark"
                />
              </View>

              {/* Action Buttons */}
              <View className="gap-2 mb-4">
                <TouchableOpacity
                  onPress={handleSendFeedback}
                  disabled={submitting}
                  className="py-3.5 rounded-xl bg-accent dark:bg-accent-dark items-center justify-center flex-row shadow-sm"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={isDark ? colors.background : '#FFFFFF'} />
                  ) : (
                    <Text className="text-sm font-black text-background dark:text-background-dark">
                      Submit Feedback
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDirectEmail}
                  className="py-3 rounded-xl border border-input-border dark:border-input-border-dark items-center justify-center flex-row bg-input dark:bg-input-dark"
                >
                  <Ionicons name="mail-outline" size={16} color={colors.textPrimary} className="mr-2" />
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    Email Support Directly (support@fittrack.com)
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
