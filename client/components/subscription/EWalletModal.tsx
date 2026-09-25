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
  const [balance, setBalance] = useState<number>(0.0);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('500');
  const [depositMethod, setDepositMethod] = useState<PaymentMethodType>('GCASH');
  const [phoneNumber, setPhoneNumber] = useState('0917 123 4567');
  const [depositing, setDepositing] = useState(false);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await getUserWalletApi();
      if (res.success && res.wallet) {
        setBalance(res.wallet.balance);
        if (res.wallet.currency) {
          setCurrency(res.wallet.currency.toUpperCase() as CurrencyType);
        }
        setTransactions(res.transactions || []);
        if (onBalanceUpdated) onBalanceUpdated(res.wallet.balance);
      }
    } catch (err: any) {
      console.log('Error loading wallet:', err);
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

  const handleDeposit = async () => {
    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid deposit amount greater than 0.');
      return;
    }

    setDepositing(true);
    try {
      const initRes = await initiateWalletDepositApi(
        amountNum,
        currency,
        depositMethod,
        phoneNumber
      );
      if (initRes.success && initRes.paymentIntentId) {
        const confirmRes = await confirmWalletDepositApi(
          initRes.paymentIntentId,
          amountNum,
          currency,
          depositMethod
        );
        if (confirmRes.success) {
          setBalance(confirmRes.balance);
          setTransactions((prev) => [confirmRes.transaction, ...prev]);
          setShowTopUp(false);
          if (onBalanceUpdated) onBalanceUpdated(confirmRes.balance);
          const symbol = currency === 'PHP' ? '₱' : '$';
          const refText = initRes.referenceNumber ? ` (Ref: ${initRes.referenceNumber})` : '';
          const methodLabel =
            depositMethod === 'GCASH' ? 'GCash' : depositMethod === 'MAYA' ? 'Maya' : 'Card';
          showSuccess(
            'Funds Deposited!',
            `Successfully credited ${symbol}${amountNum.toLocaleString()} via ${methodLabel}!${refText}`
          );
        }
      }
    } catch (err: any) {
      showError('Deposit Failed', err?.message || 'Failed to deposit funds.');
    } finally {
      setDepositing(false);
    }
  };

  const symbol = currency === 'PHP' ? '₱' : '$';
  const presets = currency === 'PHP' ? TOPUP_PRESETS_PHP : TOPUP_PRESETS_USD;

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
                  Manage balance with GCash, Maya & Card top-ups
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

              <Text className="text-4xl font-black text-accent dark:text-accent-dark my-2">
                {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>

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
                    <Text className="text-[9px] text-text-muted">Instant</Text>
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
                    <Text className="text-[9px] text-text-muted">Instant</Text>
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
                    <Text className="text-[9px] text-text-muted">Visa/Mastercard</Text>
                  </TouchableOpacity>
                </View>

                {/* Mobile Number for GCash / Maya */}
                {(depositMethod === 'GCASH' || depositMethod === 'MAYA') && (
                  <View className="mb-3">
                    <Text className="text-[10px] uppercase font-bold text-text-muted mb-1">
                      {depositMethod === 'GCASH' ? 'GCash Registered Mobile Number' : 'Maya Mobile Number'}
                    </Text>
                    <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark">
                      <Text className="text-xs font-bold text-text-muted mr-1.5">🇵🇭 +63</Text>
                      <TextInput
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholder="0917 123 4567"
                        placeholderTextColor={colors.textMuted}
                        className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
                      />
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
                <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark mb-3">
                  <Text className="text-sm font-bold text-text-muted mr-1">{symbol}</Text>
                  <TextInput
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    keyboardType="decimal-pad"
                    placeholder={currency === 'PHP' ? '500' : '25.00'}
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 text-sm font-bold text-text-primary dark:text-text-primary-dark py-0"
                  />
                  <Text className="text-[10px] font-bold text-emerald-500">
                    {depositMethod === 'GCASH' ? 'GCash Rail' : depositMethod === 'MAYA' ? 'Maya Rail' : 'Stripe Rail'}
                  </Text>
                </View>

                {/* Confirm Deposit Button */}
                <TouchableOpacity
                  onPress={handleDeposit}
                  disabled={depositing}
                  activeOpacity={0.8}
                  className="w-full bg-accent dark:bg-accent-dark py-3 rounded-xl items-center justify-center flex-row"
                >
                  {depositing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                  ) : (
                    <Ionicons name="flash" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )}
                  <Text className="text-white text-xs font-bold">
                    Add {symbol}{parseFloat(topUpAmount) ? parseFloat(topUpAmount).toLocaleString() : '0.00'} via {depositMethod === 'GCASH' ? 'GCash' : depositMethod === 'MAYA' ? 'Maya' : 'Card'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Transaction History Ledger */}
            <View className="flex-row items-center justify-between mb-2 px-1">
              <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark">
                Transaction History ({transactions.length})
              </Text>
              <Text className="text-[10px] text-accent font-semibold">
                Instant Cloud Sync
              </Text>
            </View>

            {loading ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : transactions.length === 0 ? (
              <View className="py-8 items-center justify-center border border-dashed border-input-border dark:border-input-border-dark rounded-2xl">
                <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  No e-wallet transactions yet.
                </Text>
              </View>
            ) : (
              <View className="gap-2 mb-6">
                {transactions.map((tx) => {
                  const isDeposit = tx.type === 'DEPOSIT';
                  const txSymbol = tx.currency === 'USD' ? '$' : '₱';
                  return (
                    <View
                      key={tx.id}
                      className="p-3 bg-input dark:bg-input-dark rounded-2xl border border-input-border dark:border-input-border-dark flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center ${
                            isDeposit ? 'bg-emerald-500/15' : 'bg-accent/15'
                          }`}
                        >
                          <Ionicons
                            name={isDeposit ? 'arrow-down' : 'diamond'}
                            size={13}
                            color={isDeposit ? '#10B981' : colors.accent}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-xs font-semibold text-text-primary dark:text-text-primary-dark"
                          >
                            {tx.description}
                          </Text>
                          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                            {new Date(tx.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            • {tx.paymentMethod}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className={`text-xs font-black ${
                          isDeposit ? 'text-emerald-500' : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {isDeposit ? '+' : ''}{txSymbol}{Math.abs(tx.amount).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
