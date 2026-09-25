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
import ModalCloseButton from '../ui/ModalCloseButton';
import {
  getUserWalletApi,
  initiateWalletDepositApi,
  confirmWalletDepositApi,
  WalletTransactionItem,
  CurrencyType,
  PaymentMethodType,
} from '@/api/subscription';
import { USD_PHP_EXCHANGE_RATE, convertCurrency, formatCurrency } from '@/constants/currency';
import {
  formatPhilippinePhone,
  validatePhilippinePhone,
  formatCardNumber,
  validateCardNumber,
  formatCardExpiry,
  validateCardExpiry,
  formatCardCvc,
  validateCardCvc,
  formatTopUpAmount,
  validateTopUpAmount,
  detectCardBrand,
} from '@/utils/paymentValidation';

interface EWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
}

const TOPUP_PRESETS_PHP = [100, 300, 500, 1000, 2500];
const TOPUP_PRESETS_USD = [10, 25, 50, 100];

export default function EWalletModal({
  visible,
  onClose,
  onBalanceUpdated,
}: EWalletModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();

  const [currency, setCurrency] = useState<CurrencyType>('PHP');
  const [rawBalance, setRawBalance] = useState<number>(0.0);
  const [walletBaseCurrency, setWalletBaseCurrency] = useState<string>('PHP');
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('500');
  const [depositMethod, setDepositMethod] = useState<PaymentMethodType>('GCASH');

  // Payment input details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [depositing, setDepositing] = useState(false);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await getUserWalletApi();
      if (res.success && res.wallet) {
        setRawBalance(res.wallet.balance);
        setWalletBaseCurrency(res.wallet.currency || 'PHP');
        setTransactions(res.transactions || []);
        if (onBalanceUpdated) onBalanceUpdated(res.wallet.balance);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadWallet();
      setShowTopUp(false);
    }
  }, [visible]);

  // Realistic FX Display: Convert stored PHP balance to USD dynamically when viewing in USD
  const displayedBalance =
    currency === 'PHP'
      ? rawBalance
      : rawBalance / USD_PHP_EXCHANGE_RATE;

  const symbol = currency === 'PHP' ? '₱' : '$';
  const presets = currency === 'PHP' ? TOPUP_PRESETS_PHP : TOPUP_PRESETS_USD;
  const numericTopUp = parseFloat(topUpAmount) || 0;

  // Real-time conversion preview calculation
  const convertedCreditPHP = currency === 'USD' ? numericTopUp * USD_PHP_EXCHANGE_RATE : numericTopUp;
  const convertedPreviewUSD = currency === 'PHP' ? numericTopUp / USD_PHP_EXCHANGE_RATE : numericTopUp;

  const handleDeposit = async () => {
    const amountValidation = validateTopUpAmount(topUpAmount, currency);
    if (!amountValidation.valid) {
      showWarning('Invalid Amount', amountValidation.error || 'Please enter a valid deposit amount.');
      return;
    }
    const cleanAmount = amountValidation.amount;

    // Strict Input Validation
    if (depositMethod === 'GCASH' || depositMethod === 'MAYA') {
      const phoneValidation = validatePhilippinePhone(phoneNumber);
      if (!phoneValidation.valid) {
        showWarning(
          'Invalid Mobile Number',
          phoneValidation.error || `Please enter your valid ${depositMethod === 'GCASH' ? 'GCash' : 'Maya'} mobile number.`
        );
        return;
      }
    } else if (depositMethod === 'CARD') {
      const cardValidation = validateCardNumber(cardNumber);
      if (!cardValidation.valid) {
        showWarning('Invalid Card Number', cardValidation.error || 'Please enter a valid 16-digit card number.');
        return;
      }
      const expiryValidation = validateCardExpiry(cardExpiry);
      if (!expiryValidation.valid) {
        showWarning('Invalid Expiry Date', expiryValidation.error || 'Please enter card expiry in MM/YY format (e.g. 12/28).');
        return;
      }
      const cvcValidation = validateCardCvc(cardCvc);
      if (!cvcValidation.valid) {
        showWarning('Invalid CVC', cvcValidation.error || 'Please enter the 3 or 4-digit card security code (CVC).');
        return;
      }
    }

    setDepositing(true);
    try {
      const initRes = await initiateWalletDepositApi(
        numericTopUp,
        currency,
        depositMethod,
        phoneNumber,
        {
          cardNumber,
          cardExpiry,
          cardCvc,
        }
      );

      if (initRes.success && initRes.paymentIntentId) {
        // In Live Production, if a checkout URL is generated, open official gateway portal
        if (initRes.checkoutUrl && !initRes.isSimulated) {
          await Linking.openURL(initRes.checkoutUrl);
        }

        const confirmRes = await confirmWalletDepositApi(
          initRes.paymentIntentId,
          numericTopUp,
          currency,
          depositMethod
        );

        if (confirmRes.success) {
          setRawBalance(confirmRes.balance);
          setTransactions((prev) => [confirmRes.transaction, ...prev]);
          setShowTopUp(false);
          setCardNumber('');
          setCardExpiry('');
          setCardCvc('');
          if (onBalanceUpdated) onBalanceUpdated(confirmRes.balance);
          showSuccess('Funds Deposited!', confirmRes.message);
        }
      }
    } catch (err: any) {
      showError('Deposit Failed', err?.message || 'Failed to deposit funds.');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[90%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center border border-emerald-500/30">
                <Ionicons name="wallet" size={16} color="#10B981" />
              </View>
              <View>
                <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                  FitTrack e-Wallet
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  GCash, Maya & Stripe Card Top-Ups
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
            {/* Balance Card */}
            <View className="p-4 rounded-2xl bg-input/60 dark:bg-input-dark/60 border border-input-border dark:border-input-border-dark mb-4 items-center">
              <View className="flex-row items-center justify-between w-full mb-1">
                <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark">
                  Available Balance
                </Text>
                {/* Currency Switcher */}
                <View className="flex-row bg-surface dark:bg-surface-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                  <TouchableOpacity
                    onPress={() => {
                      setCurrency('PHP');
                      setTopUpAmount('500');
                    }}
                    className={`px-2 py-0.5 rounded ${currency === 'PHP' ? 'bg-accent' : ''}`}
                  >
                    <Text className={`text-[10px] font-bold ${currency === 'PHP' ? 'text-white' : 'text-text-muted'}`}>
                      ₱ PHP
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrency('USD');
                      setTopUpAmount('25');
                    }}
                    className={`px-2 py-0.5 rounded ${currency === 'USD' ? 'bg-accent' : ''}`}
                  >
                    <Text className={`text-[10px] font-bold ${currency === 'USD' ? 'text-white' : 'text-text-muted'}`}>
                      $ USD
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-4xl font-black text-accent dark:text-accent-dark my-1">
                {symbol}{displayedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>

              {/* Realistic FX Conversion Indicator */}
              <View className="flex-row items-center gap-1.5 mb-2.5 px-2.5 py-0.5 rounded-full bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
                <Ionicons name="swap-horizontal" size={11} color={colors.textMuted} />
                <Text className="text-[10px] font-medium text-text-muted dark:text-text-muted-dark">
                  {currency === 'PHP'
                    ? `≈ $${(rawBalance / USD_PHP_EXCHANGE_RATE).toFixed(2)} USD (1 USD = ₱${USD_PHP_EXCHANGE_RATE.toFixed(2)})`
                    : `≈ ₱${rawBalance.toFixed(2)} PHP (1 USD = ₱${USD_PHP_EXCHANGE_RATE.toFixed(2)})`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowTopUp(!showTopUp)}
                activeOpacity={0.8}
                className="bg-accent dark:bg-accent-dark px-4 py-2 rounded-xl flex-row items-center gap-1.5 shadow-xs"
              >
                <Ionicons name={showTopUp ? 'chevron-up' : 'add-circle'} size={15} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">
                  {showTopUp ? 'Cancel Top-Up' : 'Top-Up via GCash / Maya / Card'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Top-Up Panel */}
            {showTopUp && (
              <View className="p-4 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                  1. Select Payment Rail
                </Text>

                {/* Payment Rail Options */}
                <View className="flex-row gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => setDepositMethod('GCASH')}
                    className={`flex-1 py-2 px-2 rounded-xl items-center border ${
                      depositMethod === 'GCASH'
                        ? 'bg-sky-500/15 border-sky-500'
                        : 'bg-input dark:bg-input-dark border-input-border'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${depositMethod === 'GCASH' ? 'text-sky-600' : 'text-text-primary'}`}>
                      GCash (PH)
                    </Text>
                    <Text className="text-[9px] text-text-muted">PayMongo Rail</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDepositMethod('MAYA')}
                    className={`flex-1 py-2 px-2 rounded-xl items-center border ${
                      depositMethod === 'MAYA'
                        ? 'bg-emerald-500/15 border-emerald-500'
                        : 'bg-input dark:bg-input-dark border-input-border'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${depositMethod === 'MAYA' ? 'text-emerald-600' : 'text-text-primary'}`}>
                      Maya (PH)
                    </Text>
                    <Text className="text-[9px] text-text-muted">Digital Bank</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDepositMethod('CARD')}
                    className={`flex-1 py-2 px-2 rounded-xl items-center border ${
                      depositMethod === 'CARD'
                        ? 'bg-accent/15 border-accent'
                        : 'bg-input dark:bg-input-dark border-input-border'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${depositMethod === 'CARD' ? 'text-accent' : 'text-text-primary'}`}>
                      Card (Stripe)
                    </Text>
                    <Text className="text-[9px] text-text-muted">Visa / Mastercard</Text>
                  </TouchableOpacity>
                </View>

                {/* Payment Rail Inputs */}
                {depositMethod === 'GCASH' || depositMethod === 'MAYA' ? (
                  <View className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                        {depositMethod === 'GCASH' ? 'GCash Mobile Number' : 'Maya Mobile Number'}
                      </Text>
                      {validatePhilippinePhone(phoneNumber).valid && (
                        <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Ionicons name="checkmark-circle" size={10} color="#10B981" />
                          <Text className="text-[10px] font-bold text-emerald-500">Valid Format</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center bg-input/60 dark:bg-input-dark/60 px-3 py-2 rounded-lg border border-input-border dark:border-input-border-dark mb-1">
                      <Text className="text-xs font-bold text-text-muted mr-2">🇵🇭 +63</Text>
                      <TextInput
                        value={phoneNumber}
                        onChangeText={(val) => setPhoneNumber(formatPhilippinePhone(val))}
                        keyboardType="phone-pad"
                        maxLength={13}
                        placeholder="0917 123 4567"
                        placeholderTextColor={colors.textMuted}
                        className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
                      />
                      <Text className="text-[10px] font-bold text-text-muted">
                        {phoneNumber.replace(/\D/g, '').length}/11
                      </Text>
                    </View>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      Enter your 11-digit Philippine registered mobile number (starts with 09).
                    </Text>
                  </View>
                ) : (
                  <View className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                        Credit / Debit Card Details
                      </Text>
                      <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                        <Text className="text-[10px] font-bold text-emerald-500">
                          {detectCardBrand(cardNumber) !== 'generic'
                            ? detectCardBrand(cardNumber).toUpperCase()
                            : 'Stripe Live API'}
                        </Text>
                      </View>
                    </View>

                    {/* Card Number */}
                    <View className="flex-row items-center bg-input/60 dark:bg-input-dark/60 px-3 py-2 rounded-lg border border-input-border dark:border-input-border-dark mb-2">
                      <Ionicons name="card" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                      <TextInput
                        value={cardNumber}
                        onChangeText={(val) => setCardNumber(formatCardNumber(val))}
                        keyboardType="number-pad"
                        maxLength={19}
                        placeholder="4242 4242 4242 4242"
                        placeholderTextColor={colors.textMuted}
                        className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0 font-mono"
                      />
                      {validateCardNumber(cardNumber).valid ? (
                        <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                      ) : (
                        <Ionicons name="lock-closed" size={12} color="#10B981" />
                      )}
                    </View>

                    {/* Expiry & CVC */}
                    <View className="flex-row gap-2">
                      <View className="flex-1 flex-row items-center bg-input/60 dark:bg-input-dark/60 px-3 py-2 rounded-lg border border-input-border dark:border-input-border-dark">
                        <TextInput
                          value={cardExpiry}
                          onChangeText={(val) => setCardExpiry(formatCardExpiry(val))}
                          placeholder="MM/YY"
                          keyboardType="number-pad"
                          maxLength={5}
                          placeholderTextColor={colors.textMuted}
                          className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0 text-center font-mono"
                        />
                        {validateCardExpiry(cardExpiry).valid && (
                          <Ionicons name="checkmark" size={12} color="#10B981" />
                        )}
                      </View>
                      <View className="flex-1 flex-row items-center bg-input/60 dark:bg-input-dark/60 px-3 py-2 rounded-lg border border-input-border dark:border-input-border-dark">
                        <TextInput
                          value={cardCvc}
                          onChangeText={(val) => setCardCvc(formatCardCvc(val))}
                          placeholder="CVC"
                          keyboardType="number-pad"
                          maxLength={4}
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                          className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0 text-center font-mono"
                        />
                        {validateCardCvc(cardCvc).valid && (
                          <Ionicons name="checkmark" size={12} color="#10B981" />
                        )}
                      </View>
                    </View>
                  </View>
                )}

                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                  2. Select Amount ({currency})
                </Text>

                {/* Quick Presets */}
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {presets.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => setTopUpAmount(String(amount))}
                      className={`flex-1 min-w-[28%] py-2 rounded-xl items-center border ${
                        topUpAmount === String(amount)
                          ? 'bg-accent/15 border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          topUpAmount === String(amount)
                            ? 'text-accent dark:text-accent-dark'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {symbol}{amount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Amount Input */}
                <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark mb-2">
                  <Text className="text-sm font-bold text-text-muted mr-1">{symbol}</Text>
                  <TextInput
                    value={topUpAmount}
                    onChangeText={(val) => setTopUpAmount(formatTopUpAmount(val))}
                    keyboardType="decimal-pad"
                    maxLength={8}
                    placeholder={currency === 'PHP' ? '500' : '25.00'}
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 text-sm font-bold text-text-primary dark:text-text-primary-dark py-0"
                  />
                </View>

                {/* Dynamic Real FX Conversion Notice */}
                {numericTopUp > 0 && (
                  <View className="p-2.5 rounded-xl bg-accent/5 border border-accent/20 mb-3">
                    <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                      {currency === 'USD'
                        ? `💵 Depositing $${numericTopUp.toFixed(2)} USD ≈ ₱${convertedCreditPHP.toFixed(2)} PHP credited to your wallet`
                        : `🇵🇭 Depositing ₱${numericTopUp.toFixed(2)} PHP (≈ $${convertedPreviewUSD.toFixed(2)} USD)`}
                    </Text>
                    <Text className="text-[9px] text-text-muted dark:text-text-muted-dark mt-0.5">
                      Rate: 1 USD = ₱{USD_PHP_EXCHANGE_RATE.toFixed(2)} PHP (Direct ledger credit)
                    </Text>
                  </View>
                )}

                {/* Action Button */}
                <TouchableOpacity
                  onPress={handleDeposit}
                  disabled={depositing}
                  activeOpacity={0.8}
                  className="bg-accent dark:bg-accent-dark py-3 rounded-xl items-center flex-row justify-center gap-1.5 shadow-sm"
                >
                  {depositing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="arrow-forward-circle" size={16} color="#FFFFFF" />
                      <Text className="text-white text-xs font-black">
                        Proceed to Top-Up {symbol}{numericTopUp.toFixed(2)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Transaction Ledger */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                Transaction History ({transactions.length})
              </Text>

              {loading ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : transactions.length === 0 ? (
                <View className="py-6 items-center bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark">
                  <Ionicons name="receipt-outline" size={24} color={colors.textMuted} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-1">
                    No transactions yet. Top up via GCash, Maya, or Card to start!
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    const txSymbol = tx.currency === 'USD' ? '$' : '₱';
                    return (
                      <View
                        key={tx.id}
                        className="p-3 bg-input/40 dark:bg-input-dark/40 rounded-xl border border-input-border dark:border-input-border-dark flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                          <View
                            className={`w-7 h-7 rounded-full items-center justify-center ${
                              isCredit ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                            }`}
                          >
                            <Ionicons
                              name={isCredit ? 'arrow-down' : 'arrow-up'}
                              size={13}
                              color={isCredit ? '#10B981' : '#F43F5E'}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-xs font-bold text-text-primary dark:text-text-primary-dark"
                              numberOfLines={1}
                            >
                              {tx.description}
                            </Text>
                            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                              {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              · {tx.paymentMethod}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className={`text-xs font-black ${
                            isCredit ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {isCredit ? '+' : ''}
                          {txSymbol}
                          {Math.abs(tx.amount).toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
