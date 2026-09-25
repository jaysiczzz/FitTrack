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
} from 'react-native';
import * as Linking from 'expo-linking';
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
  CurrencyType,
  PaymentMethodType,
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
    priceUSD: 0,
    pricePHP: 0,
    currency: 'PHP',
    symbol: '₱',
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
    price: 499,
    priceUSD: 9.99,
    pricePHP: 499,
    currency: 'PHP',
    symbol: '₱',
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
    price: 3999,
    priceUSD: 79.99,
    pricePHP: 3999,
    currency: 'PHP',
    symbol: '₱',
    interval: 'year',
    features: [
      'All Pro Monthly features included',
      'Save 33% compared to monthly (₱333/mo)',
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
    price: 9999,
    priceUSD: 199.99,
    pricePHP: 9999,
    currency: 'PHP',
    symbol: '₱',
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

  const [currency, setCurrency] = useState<CurrencyType>('PHP');
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(DEFAULT_PLANS);
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierType>('PRO_ANNUAL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('GCASH');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Philippines payment rails
  const [phoneNumber, setPhoneNumber] = useState('');

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');


  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Fetch plans & current status
  const loadData = async (targetCurrency: CurrencyType = currency) => {
    try {
      setLoading(true);
      const [plansRes, subRes, walletRes] = await Promise.all([
        getSubscriptionPlansApi(targetCurrency).catch(() => null),
        getCurrentSubscriptionApi().catch(() => null),
        getUserWalletApi().catch(() => null),
      ]);

      if (plansRes?.success && plansRes.plans && plansRes.plans.length > 0) {
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
      loadData(currency);
      setShowSuccessBanner(false);
    }
  }, [visible]);

  const handleCurrencyChange = (newCurrency: CurrencyType) => {
    setCurrency(newCurrency);
    loadData(newCurrency);
  };

  const handleSubscribe = async () => {
    const selectedPlan = plans.find((p) => p.tier === selectedTier);
    if (!selectedPlan || selectedPlan.price <= 0) return;

    // Input validation
    if (paymentMethod === 'GCASH' || paymentMethod === 'MAYA') {
      const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        showWarning(
          'Mobile Number Required',
          `Please enter your valid ${paymentMethod === 'GCASH' ? 'GCash' : 'Maya'} mobile number (e.g. 0917 123 4567).`
        );
        return;
      }
    } else if (paymentMethod === 'CARD') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (!cleanCard || cleanCard.length < 13) {
        showWarning('Card Number Required', 'Please enter a valid 16-digit card number (e.g. 4242 4242 4242 4242).');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        showWarning('Expiry Date Required', 'Please enter card expiry in MM/YY format (e.g. 12/28).');
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        showWarning('CVC Required', 'Please enter the 3-digit card security code (CVC).');
        return;
      }
    }

    setProcessingPayment(true);
    try {
      if (paymentMethod === 'E_WALLET') {
        const res = await paySubscriptionWithWalletApi(selectedTier, currency);
        if (res.success) {
          setCurrentSub(res.subscription);
          setIsPro(true);
          setWalletBalance(res.remainingBalance);
          setShowSuccessBanner(true);
          showSuccess('Subscribed!', `Welcome to ${res.planInfo.name}!`);
          if (onSubscriptionUpdated) onSubscriptionUpdated(selectedTier);
        }
      } else {
        // GCash, Maya, Card, or Stripe
        const checkoutRes = await createCheckoutSessionApi(
          selectedTier,
          paymentMethod,
          currency,
          phoneNumber,
          {
            cardNumber,
            cardExpiry,
            cardCvc,
          }
        );
        if (checkoutRes.success) {
          // In Live Production, open official PayMongo / Stripe Checkout URL
          if (checkoutRes.checkoutUrl && !checkoutRes.isSimulated) {
            await Linking.openURL(checkoutRes.checkoutUrl);
          }

          if (checkoutRes.paymentIntentId) {
            const confirmRes = await confirmSubscriptionApi(
              selectedTier,
              checkoutRes.paymentIntentId,
              currency,
              paymentMethod
            );
            if (confirmRes.success) {
              setCurrentSub(confirmRes.subscription);
              setIsPro(true);
              setShowSuccessBanner(true);
              const methodLabel =
                paymentMethod === 'GCASH'
                  ? 'GCash'
                  : paymentMethod === 'MAYA'
                  ? 'Maya'
                  : 'Credit / Debit Card';
              const refText = checkoutRes.referenceNumber ? ` (Ref: ${checkoutRes.referenceNumber})` : '';
              showSuccess(`Subscribed via ${methodLabel}!`, `Welcome to ${confirmRes.planInfo.name}!${refText}`);
              if (onSubscriptionUpdated) onSubscriptionUpdated(selectedTier);
            }
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

  const selectedPlan = plans.find((p) => p.tier === selectedTier) || plans[1] || DEFAULT_PLANS[1];
  const symbol = currency === 'PHP' ? '₱' : '$';

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
                  AI fitness coach, food scanner & Philippines e-wallets
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
            {/* Currency Selector */}
            <View className="flex-row items-center justify-between p-2.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark mb-3">
              <View>
                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                  Select Currency
                </Text>
                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">
                  Tailored for Philippines & Global athletes
                </Text>
              </View>
              <View className="flex-row bg-surface dark:bg-surface-dark p-0.5 rounded-xl border border-input-border dark:border-input-border-dark">
                <TouchableOpacity
                  onPress={() => handleCurrencyChange('PHP')}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${
                    currency === 'PHP' ? 'bg-accent shadow-xs' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      currency === 'PHP' ? 'text-white' : 'text-text-muted'
                    }`}
                  >
                    🇵🇭 PHP (₱)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCurrencyChange('USD')}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${
                    currency === 'USD' ? 'bg-accent shadow-xs' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      currency === 'USD' ? 'text-white' : 'text-text-muted'
                    }`}
                  >
                    🇺🇸 USD ($)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Success Banner if upgraded */}
            {showSuccessBanner && (
              <View className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl mb-4 flex-row items-center gap-2.5">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-emerald-500">
                    Pro Membership Active!
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    All premium features unlocked. Thank you for supporting FitTrack!
                  </Text>
                </View>
              </View>
            )}

            {/* Current Subscription Status Banner */}
            {isPro && currentSub && (
              <View className="p-3.5 bg-input dark:bg-input-dark rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      Current Plan:{' '}
                      <Text className="text-accent dark:text-accent-dark">
                        {currentSub.tier === 'LIFETIME_FOUNDER'
                          ? 'Founder Lifetime'
                          : currentSub.tier.replace('_', ' ')}
                      </Text>
                    </Text>
                  </View>
                  <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-emerald-500 uppercase">
                      Active
                    </Text>
                  </View>
                </View>

                {currentSub.tier !== 'LIFETIME_FOUNDER' && (
                  <View className="flex-row items-center justify-between pt-2 border-t border-input-border dark:border-input-border-dark">
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                      {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Renews automatically'}
                    </Text>

                    {currentSub.cancelAtPeriodEnd ? (
                      <TouchableOpacity
                        onPress={handleReactivate}
                        disabled={canceling}
                        className="px-2.5 py-1 rounded-xl bg-accent/15 border border-accent/30"
                      >
                        <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                          Resume Auto-Renew
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
                            ? currency === 'PHP'
                              ? 'Billed ₱3,999 annually · Save 33%'
                              : 'Billed $79.99 annually · Save 33%'
                            : plan.interval === 'lifetime'
                            ? 'One-time payment · Lifetime VIP pass'
                            : currency === 'PHP'
                            ? '₱499 billed monthly · Cancel anytime'
                            : '$9.99 billed monthly · Cancel anytime'}
                        </Text>
                        <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                          {symbol}
                          {plan.price.toLocaleString(undefined, {
                            minimumFractionDigits: currency === 'PHP' ? 0 : 2,
                            maximumFractionDigits: 2,
                          })}
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
              Select Payment Method
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-3">
              {/* GCash (PH) */}
              <TouchableOpacity
                onPress={() => setPaymentMethod('GCASH')}
                activeOpacity={0.8}
                className={`flex-1 min-w-[45%] p-3 rounded-2xl border ${
                  paymentMethod === 'GCASH'
                    ? 'bg-sky-500/15 border-sky-500'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="phone-portrait" size={15} color={paymentMethod === 'GCASH' ? '#0284C7' : colors.textMuted} />
                    <Text className={`text-xs font-bold ${paymentMethod === 'GCASH' ? 'text-sky-600 dark:text-sky-400' : 'text-text-primary'}`}>
                      GCash
                    </Text>
                  </View>
                  <View className="bg-sky-500/20 px-1.5 py-0.5 rounded">
                    <Text className="text-[8px] font-bold text-sky-600 dark:text-sky-400 uppercase">PH Choice</Text>
                  </View>
                </View>
                <Text className="text-[10px] text-text-muted">
                  Direct GCash E-Wallet
                </Text>
              </TouchableOpacity>

              {/* Maya (PH) */}
              <TouchableOpacity
                onPress={() => setPaymentMethod('MAYA')}
                activeOpacity={0.8}
                className={`flex-1 min-w-[45%] p-3 rounded-2xl border ${
                  paymentMethod === 'MAYA'
                    ? 'bg-emerald-500/15 border-emerald-500'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="flash" size={15} color={paymentMethod === 'MAYA' ? '#10B981' : colors.textMuted} />
                    <Text className={`text-xs font-bold ${paymentMethod === 'MAYA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-primary'}`}>
                      Maya
                    </Text>
                  </View>
                  <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    <Text className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Instant</Text>
                  </View>
                </View>
                <Text className="text-[10px] text-text-muted">
                  Maya Wallet & Card
                </Text>
              </TouchableOpacity>

              {/* Card (Stripe Gateway) */}
              <TouchableOpacity
                onPress={() => setPaymentMethod('CARD')}
                activeOpacity={0.8}
                className={`flex-1 min-w-[45%] p-3 rounded-2xl border ${
                  paymentMethod === 'CARD'
                    ? 'bg-accent/15 border-accent dark:border-accent-dark'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="card-outline" size={15} color={paymentMethod === 'CARD' ? colors.accent : colors.textMuted} />
                  <Text className={`text-xs font-bold ${paymentMethod === 'CARD' ? 'text-accent dark:text-accent-dark' : 'text-text-primary'}`}>
                    Credit / Debit Card
                  </Text>
                </View>
                <Text className="text-[10px] text-text-muted">
                  Visa, MC, BDO, BPI, Maya
                </Text>
              </TouchableOpacity>

              {/* FitTrack e-Wallet */}
              <TouchableOpacity
                onPress={() => setPaymentMethod('E_WALLET')}
                activeOpacity={0.8}
                className={`flex-1 min-w-[45%] p-3 rounded-2xl border ${
                  paymentMethod === 'E_WALLET'
                    ? 'bg-amber-500/15 border-amber-500'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="wallet-outline" size={15} color={paymentMethod === 'E_WALLET' ? '#F59E0B' : colors.textMuted} />
                  <Text className={`text-xs font-bold ${paymentMethod === 'E_WALLET' ? 'text-amber-500' : 'text-text-primary'}`}>
                    FitTrack e-Wallet
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                  Bal: {symbol}{walletBalance.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Details Container */}
            {paymentMethod === 'GCASH' || paymentMethod === 'MAYA' ? (
              <View className="p-3.5 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                    {paymentMethod === 'GCASH' ? 'GCash Mobile Number' : 'Maya Mobile Number'}
                  </Text>
                </View>

                <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark mb-1.5">
                  <Text className="text-xs font-bold text-text-muted mr-2">🇵🇭 +63</Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="0917 123 4567"
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
                  />
                  <Text className="text-[10px] font-bold text-emerald-500">Fast Verified</Text>
                </View>

                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark leading-4">
                  {paymentMethod === 'GCASH'
                    ? 'When you tap "Subscribe", you will be redirected to the official PayMongo GCash verification screen to authorize with your MPIN and SMS OTP.'
                    : 'When you tap "Subscribe", you will be redirected to the official Maya portal to authorize instant payment directly from your Maya account.'}
                </Text>
              </View>
            ) : paymentMethod === 'CARD' ? (
              <View className="p-3.5 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                    Credit / Debit Card (Stripe)
                  </Text>
                  <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                    <Text className="text-[10px] font-bold text-emerald-500">Stripe Live API</Text>
                  </View>
                </View>

                {/* Card Number Input */}
                <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark mb-2">
                  <Ionicons name="card" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="number-pad"
                    placeholder="4242 4242 4242 4242"
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
                  />
                  <Ionicons name="lock-closed" size={13} color="#10B981" />
                </View>

                {/* Expiry and CVC Row */}
                <View className="flex-row gap-2 mb-2">
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
                      placeholder="CVC"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0 text-center"
                    />
                  </View>
                </View>

                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark leading-4">
                  Directly verified via Stripe Live API. Supports Visa, Mastercard, JCB, and Philippine bank cards (BDO, BPI, UnionBank).
                </Text>
              </View>
            ) : (
              <View className="p-3.5 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-text-muted">Required Amount:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {symbol}
                    {selectedPlan.price.toLocaleString(undefined, {
                      minimumFractionDigits: currency === 'PHP' ? 0 : 2,
                    })}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs text-text-muted">Available e-Wallet Balance:</Text>
                  <Text className={`text-xs font-bold ${walletBalance >= selectedPlan.price ? 'text-accent' : 'text-danger'}`}>
                    {symbol}{walletBalance.toFixed(2)}
                  </Text>
                </View>
                {walletBalance < selectedPlan.price && (
                  <Text className="text-[11px] text-danger dark:text-danger-dark font-semibold">
                    ⚠️ Insufficient balance. Please switch to GCash, Maya, Card, or top up your e-wallet.
                  </Text>
                )}
              </View>
            )}

            {/* Subscribe Action Button */}
            <TouchableOpacity
              onPress={handleSubscribe}
              disabled={processingPayment || (paymentMethod === 'E_WALLET' && walletBalance < selectedPlan.price)}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-2xl items-center justify-center flex-row shadow-sm mb-3 ${
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
                Pay {symbol}
                {selectedPlan.price.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'PHP' ? 0 : 2,
                })}{' '}
                via {paymentMethod === 'GCASH' ? 'GCash' : paymentMethod === 'MAYA' ? 'Maya' : paymentMethod === 'CARD' ? 'Card' : 'e-Wallet'}
              </Text>
            </TouchableOpacity>

            <Text className="text-[10px] text-center text-text-muted dark:text-text-muted-dark mb-6">
              🔒 Encrypted with 256-bit bank-grade SSL. Cancel anytime with one tap.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
