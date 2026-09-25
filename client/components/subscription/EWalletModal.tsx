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
} from '@/api/subscription';

interface EWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
}

const TOPUP_PRESETS = [10, 25, 50, 100];

export default function EWalletModal({
  visible,
  onClose,
  onBalanceUpdated,
}: EWalletModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();

  const [balance, setBalance] = useState<number>(0.0);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('25');
  const [depositing, setDepositing] = useState(false);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await getUserWalletApi();
      if (res.success && res.wallet) {
        setBalance(res.wallet.balance);
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
      showWarning('Invalid Amount', 'Please enter a valid deposit amount greater than $0.');
      return;
    }

    setDepositing(true);
    try {
      const initRes = await initiateWalletDepositApi(amountNum);
      if (initRes.success && initRes.paymentIntentId) {
        const confirmRes = await confirmWalletDepositApi(initRes.paymentIntentId, amountNum);
        if (confirmRes.success) {
          setBalance(confirmRes.balance);
          setTransactions((prev) => [confirmRes.transaction, ...prev]);
          setShowTopUp(false);
          if (onBalanceUpdated) onBalanceUpdated(confirmRes.balance);
          showSuccess('Funds Added', `$${amountNum.toFixed(2)} added to your e-wallet!`);
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
                  In-app balance for subscriptions and training perks
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Balance Card */}
            <View className="p-4 rounded-2xl bg-input/60 dark:bg-input-dark/60 border border-input-border dark:border-input-border-dark mb-4 items-center">
              <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted dark:text-text-muted-dark mb-1">
                Available e-Wallet Balance
              </Text>
              <Text className="text-4xl font-black text-accent dark:text-accent-dark mb-3">
                ${balance.toFixed(2)}
              </Text>

              <TouchableOpacity
                onPress={() => setShowTopUp(!showTopUp)}
                activeOpacity={0.8}
                className="bg-accent dark:bg-accent-dark px-4 py-2 rounded-xl flex-row items-center gap-1.5 shadow-xs"
              >
                <Ionicons name={showTopUp ? 'chevron-up' : 'add-circle'} size={15} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">
                  {showTopUp ? 'Cancel Top-Up' : 'Top-Up Balance via Stripe'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Top-Up Panel */}
            {showTopUp && (
              <View className="p-4 bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                  Select Deposit Amount
                </Text>

                {/* Quick Presets */}
                <View className="flex-row gap-2 mb-3">
                  {TOPUP_PRESETS.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => setTopUpAmount(String(amount))}
                      className={`flex-1 py-2 rounded-xl items-center border ${
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
                        ${amount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Amount Input */}
                <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark mb-3">
                  <Text className="text-sm font-bold text-text-muted mr-1">$</Text>
                  <TextInput
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    keyboardType="decimal-pad"
                    placeholder="25.00"
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 text-sm font-bold text-text-primary dark:text-text-primary-dark py-0"
                  />
                  <Text className="text-[10px] font-bold text-emerald-500">Stripe Gateway</Text>
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
                    <Ionicons name="card" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )}
                  <Text className="text-white text-xs font-bold">
                    Authorize & Add ${parseFloat(topUpAmount) ? parseFloat(topUpAmount).toFixed(2) : '0.00'}
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
              <View className="py-6 items-center justify-center bg-input/20 dark:bg-input-dark/20 rounded-2xl border border-input-border/40">
                <Ionicons name="receipt-outline" size={24} color={colors.textMuted} className="mb-1" />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  No e-wallet transactions yet.
                </Text>
              </View>
            ) : (
              <View className="gap-2 mb-6">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  const dateStr = new Date(tx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <View
                      key={tx.id}
                      className="p-3 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                        <View
                          className={`w-7 h-7 rounded-xl items-center justify-center ${
                            isPositive ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                          }`}
                        >
                          <Ionicons
                            name={isPositive ? 'arrow-down' : 'arrow-up'}
                            size={14}
                            color={isPositive ? '#10B981' : '#F59E0B'}
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
                            {dateStr} · {tx.paymentMethod}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className={`text-sm font-black ${
                          isPositive ? 'text-accent dark:text-accent-dark' : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {isPositive ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
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
