import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import ModalCloseButton from '../ui/ModalCloseButton';
import {
  getSubscriptionPlansApi,
  getCurrentSubscriptionApi,
  createCheckoutSessionApi,
  confirmSubscriptionApi,
  cancelSubscriptionApi,
  reactivateSubscriptionApi,
  getUserWalletApi,
  paySubscriptionWithWalletApi,
  SubscriptionPlanItem,
  UserSubscription,
  SubscriptionTierType,
} from '@/api/subscription';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionUpdated?: (tier: SubscriptionTierType) => void;
}

const DEFAULT_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'FREE',
    tier: 'FREE',
    name: 'FitTrack Free',
    badge: 'Starter',
    price: 0,
    currency: 'USD',
    interval: null,
    features: [
      'Basic workout & set logging',
      '50+ exercise guides with video demos',
      'Standard food & water logging',
      'Daily readiness check-in & streaks',
      'Community athlete stories',
    ],
  },
  {
    id: 'PRO_MONTHLY',
    tier: 'PRO_MONTHLY',
    name: 'Pro Monthly',
    badge: 'Most Popular',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Free tier',
      'Unlimited AI Fitness Coach (Google Gemini 2.0 Flash)',
      'AI Multimodal Camera Food Scanner & Macro Analysis',
      'Daily, weekly, and monthly workout routine planner',
      'Detailed Personal Record (PR) badges and trophies',
      'Cloud synchronization & offline resilience',
    ],
  },
  {
    id: 'PRO_ANNUAL',
    tier: 'PRO_ANNUAL',
    name: 'Pro Annual',
    badge: 'Best Value · Save 33%',
    price: 79.99,
    currency: 'USD',
    interval: 'year',
    features: [
      'All Pro Monthly features included',
      'Save 33% compared to monthly ($6.67/mo)',
      'Priority customer service & ticket support',
      'Advanced 1RM and volume analytics',
      'Early access to all upcoming features',
    ],
  },
  {
    id: 'LIFETIME_FOUNDER',
    tier: 'LIFETIME_FOUNDER',
    name: 'Lifetime Founder',
    badge: 'Limited Pass',
    price: 199.99,
    currency: 'USD',
    interval: 'lifetime',
    features: [
      'Permanent lifetime Pro access with zero recurring fees',
      'Exclusive Gold Founder athlete profile badge',
      'Direct developer feedback channel',
      'All future premium fitness models included forever',
    ],
  },
];

export default function SubscriptionModal({
  visible,
  onClose,
  onSubscriptionUpdated,
}: SubscriptionModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(DEFAULT_PLANS);
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierType>('PRO_ANNUAL');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'E_WALLET'>('STRIPE');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Card details state (Stripe checkout simulation & test card)
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Fetch plans & current status
  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, walletRes] = await Promise.all([
        getSubscriptionPlansApi().catch(() => null),
        getCurrentSubscriptionApi().catch(() => null),
        getUserWalletApi().catch(() => null),
      ]);

      if (plansRes?.success && plansRes.plans.length > 0) {
        setPlans(plansRes.plans);
      }
      if (subRes?.success && subRes.subscription) {
        setCurrentSub(subRes.subscription);
        setIsPro(subRes.isPro);
        setDaysRemaining(subRes.daysRemaining);
      }
      if (walletRes?.success && walletRes.wallet) {
        setWalletBalance(walletRes.wallet.balance);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
      setShowSuccessBanner(false);
    }
  }, [visible]);

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
  };

  const handleSubscribe = async () => {
    const selectedPlan = plans.find((p) => p.tier === selectedTier);
    if (!selectedPlan || selectedPlan.price <= 0) return;

    setProcessingPayment(true);
    try {
      if (paymentMethod === 'E_WALLET') {
        const res = await paySubscriptionWithWalletApi(selectedTier);
        if (res.success) {
          setCurrentSub(res.subscription);
          setIsPro(true);
          setWalletBalance(res.remainingBalance);
          setShowSuccessBanner(true);
          showSuccess('Subscribed!', `Welcome to ${res.planInfo.name}!`);
          if (onSubscriptionUpdated) onSubscriptionUpdated(selectedTier);
        }
      } else {
        // Stripe flow
        const checkoutRes = await createCheckoutSessionApi(selectedTier, 'STRIPE');
        if (checkoutRes.success && checkoutRes.paymentIntentId) {
          // Confirm payment
          const confirmRes = await confirmSubscriptionApi(selectedTier, checkoutRes.paymentIntentId);
          if (confirmRes.success) {
            setCurrentSub(confirmRes.subscription);
            setIsPro(true);
            setShowSuccessBanner(true);
            showSuccess('Subscribed with Stripe!', `Welcome to ${confirmRes.planInfo.name}!`);
            if (onSubscriptionUpdated) onSubscriptionUpdated(selectedTier);
          }
        }
      }
    } catch (err: any) {
      showError('Payment Failed', err?.message || 'Could not process subscription. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    setCanceling(true);
    try {
      const res = await cancelSubscriptionApi();
      if (res.success) {
        setCurrentSub(res.subscription);
        showSuccess('Renewal Canceled', 'Your subscription will not renew after the current billing cycle.');
      }
    } catch (err: any) {
      showError('Error', err?.message || 'Could not cancel auto-renewal.');
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivate = async () => {
    setCanceling(true);
    try {
      const res = await reactivateSubscriptionApi();
      if (res.success) {
        setCurrentSub(res.subscription);
        showSuccess('Reactivated', 'Auto-renewal has been resumed!');
      }
    } catch (err: any) {
      showError('Error', err?.message || 'Could not reactivate subscription.');
    } finally {
      setCanceling(false);
    }
  };

  const selectedPlan = plans.find((p) => p.tier === selectedTier) || plans[1];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[92%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center border border-amber-500/30">
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                  FitTrack Pro
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  Unlock AI fitness coaching, camera food scanner & cloud sync
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="mt-3.5" showsVerticalScrollIndicator={false}>
            {/* Active Subscription Status Banner */}
            {currentSub && currentSub.tier !== 'FREE' && (
              <View className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text className="text-xs font-black text-accent dark:text-accent-dark uppercase tracking-wider">
                      Active: {currentSub.tier.replace('_', ' ')}
                    </Text>
                  </View>
                  {daysRemaining !== null && (
                    <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                      {daysRemaining} {daysRemaining === 1 ? 'day left' : 'days left'}
                    </Text>
                  )}
                </View>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-tight">
                  {currentSub.cancelAtPeriodEnd
                    ? '⚠️ Auto-renewal is off. Access continues until the current cycle expires.'
                    : 'Auto-renewal is active via secure Stripe billing.'}
                </Text>

                {currentSub.tier !== 'LIFETIME_FOUNDER' && (
                  <View className="flex-row justify-end mt-2 pt-2 border-t border-emerald-500/20">
                    {currentSub.cancelAtPeriodEnd ? (
                      <TouchableOpacity
                        onPress={handleReactivate}
                        disabled={canceling}
                        className="px-3 py-1 rounded-xl bg-accent dark:bg-accent-dark"
                      >
                        <Text className="text-[11px] font-bold text-white">
                          Reactivate Auto-Renew
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={handleCancelAutoRenew}
                        disabled={canceling}
                        className="px-2.5 py-1 rounded-xl bg-danger/10 border border-danger/20"
                      >
                        <Text className="text-[10px] font-bold text-danger dark:text-danger-dark">
                          Turn Off Auto-Renew
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Plan Tier Selection Cards */}
            <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-2">
              Choose Your Plan
            </Text>

            <View className="gap-2.5 mb-4">
              {plans
                .filter((p) => p.tier !== 'FREE')
                .map((plan) => {
                  const isSelected = selectedTier === plan.tier;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => setSelectedTier(plan.tier)}
                      activeOpacity={0.8}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-accent/10 dark:bg-accent-dark/15 border-accent dark:border-accent-dark shadow-sm'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-4 h-4 rounded-full border items-center justify-center ${
                              isSelected ? 'border-accent bg-accent' : 'border-input-border'
                            }`}
                          >
                            {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </View>
                          <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                            {plan.name}
                          </Text>
                        </View>

                        <View className="bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-extrabold text-amber-500 dark:text-amber-400">
                            {plan.badge}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-baseline justify-between pl-6">
                        <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                          {plan.interval === 'year'
                            ? 'Billed annually · Cancel anytime'
                            : plan.interval === 'lifetime'
                            ? 'One-time payment · Forever access'
                            : 'Billed monthly · Cancel anytime'}
                        </Text>
                        <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                          ${plan.price.toFixed(2)}
                          <Text className="text-xs text-text-muted font-normal">
                            {plan.interval ? ` / ${plan.interval}` : ''}
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* Feature Checklist */}
            <View className="p-3.5 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
              <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-2">
                Included with {selectedPlan.name}
              </Text>
              <View className="gap-2">
                {selectedPlan.features.map((feature, idx) => (
                  <View key={idx} className="flex-row items-start gap-2">
                    <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginTop: 1 }} />
                    <Text className="text-xs text-text-primary dark:text-text-primary-dark flex-1 leading-snug">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-2">
              Payment Method
            </Text>

            <View className="flex-row gap-2 mb-4">
              {/* Stripe Card Option */}
              <TouchableOpacity
                onPress={() => setPaymentMethod('STRIPE')}
                activeOpacity={0.8}
                className={`flex-1 p-3 rounded-2xl border ${
                  paymentMethod === 'STRIPE'
                    ? 'bg-accent/15 border-accent dark:border-accent-dark'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="card-outline" size={16} color={paymentMethod === 'STRIPE' ? colors.accent : colors.textMuted} />
                  <Text className={`text-xs font-bold ${paymentMethod === 'STRIPE' ? 'text-accent dark:text-accent-dark' : 'text-text-primary'}`}>
                    Credit / Debit Card
                  </Text>
                </View>
                <Text className="text-[10px] text-text-muted">
                  Powered by Stripe Gateway
                </Text>
              </TouchableOpacity>

              {/* FitTrack e-Wallet Option */}
              <TouchableOpacity
                onPress={() => setPaymentMethod('E_WALLET')}
                activeOpacity={0.8}
                className={`flex-1 p-3 rounded-2xl border ${
                  paymentMethod === 'E_WALLET'
                    ? 'bg-accent/15 border-accent dark:border-accent-dark'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="wallet-outline" size={16} color={paymentMethod === 'E_WALLET' ? colors.accent : colors.textMuted} />
                  <Text className={`text-xs font-bold ${paymentMethod === 'E_WALLET' ? 'text-accent dark:text-accent-dark' : 'text-text-primary'}`}>
                    FitTrack e-Wallet
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                  Balance: ${walletBalance.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Details Container */}
            {paymentMethod === 'STRIPE' ? (
              <View className="p-3.5 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                    Card Information
                  </Text>
                  <TouchableOpacity
                    onPress={handleFillTestCard}
                    className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20"
                  >
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      1-Tap Test Card
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Card Number Input */}
                <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark mb-2">
                  <Ionicons name="card" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
                  />
                  <Text className="text-[10px] font-bold text-emerald-500">Stripe SSL</Text>
                </View>

                {/* Expiry and CVC Row */}
                <View className="flex-row gap-2">
                  <View className="flex-1 flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark">
                    <TextInput
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textMuted}
                      className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0 text-center"
                    />
                  </View>
                  <View className="flex-1 flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark">
                    <TextInput
                      value={cardCvc}
                      onChangeText={setCardCvc}
                      placeholder="CVC (123)"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0 text-center"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="p-3.5 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-text-muted">Required Amount:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    ${selectedPlan.price.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs text-text-muted">Available e-Wallet Balance:</Text>
                  <Text className={`text-xs font-bold ${walletBalance >= selectedPlan.price ? 'text-accent' : 'text-danger'}`}>
                    ${walletBalance.toFixed(2)}
                  </Text>
                </View>
                {walletBalance < selectedPlan.price && (
                  <Text className="text-[11px] text-danger dark:text-danger-dark font-semibold">
                    ⚠️ Insufficient balance. Please switch to Card (Stripe) or top up your e-wallet.
                  </Text>
                )}
              </View>
            )}

            {/* Subscribe Action Button */}
            <TouchableOpacity
              onPress={handleSubscribe}
              disabled={processingPayment || (paymentMethod === 'E_WALLET' && walletBalance < selectedPlan.price)}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-2xl items-center justify-center flex-row shadow-sm mb-4 ${
                paymentMethod === 'E_WALLET' && walletBalance < selectedPlan.price
                  ? 'bg-input border border-input-border opacity-60'
                  : 'bg-accent dark:bg-accent-dark'
              }`}
            >
              {processingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
              ) : (
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              )}
              <Text className="text-white font-black text-sm">
                Pay ${selectedPlan.price.toFixed(2)} & Unlock Pro
              </Text>
            </TouchableOpacity>

            <Text className="text-[10px] text-center text-text-muted dark:text-text-muted-dark mb-6">
              🔒 Encrypted with 256-bit Stripe security. Cancel anytime with one tap.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
