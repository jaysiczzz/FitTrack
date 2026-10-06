import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import {
  AdminRevenueResponse,
  processAdminPayoutApi,
} from '@/api/subscription';

interface AdminFinanceTabProps {
  revenueData: AdminRevenueResponse | null;
  loading: boolean;
  refreshing: boolean;
  onReloadFinance: () => void;
}

export default function AdminFinanceTab({
  revenueData,
  loading,
  refreshing,
  onReloadFinance,
}: AdminFinanceTabProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDestination, setPayoutDestination] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  const handleProcessPayout = async () => {
    const num = parseFloat(payoutAmount);
    if (!num || num <= 0) {
      showWarning('Invalid Amount', 'Enter a valid payout amount.');
      return;
    }
    if (!payoutDestination.trim()) {
      showWarning('Destination Required', 'Please enter account/bank destination info.');
      return;
    }

    try {
      setProcessingPayout(true);
      triggerHapticFeedback();
      const res = await processAdminPayoutApi(
        num,
        payoutDestination.trim(),
        payoutNotes.trim() || undefined
      );

      if (res.success) {
        const symbol = (revenueData?.platformWallet?.currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : '$';
        showSuccess('Payout Completed', `Recorded payout of ${symbol}${num.toFixed(2)}.`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutDestination('');
        setPayoutNotes('');
        onReloadFinance();
      }
    } catch (err: any) {
      showError('Payout Error', err?.message || 'Failed to process admin payout.');
    } finally {
      setProcessingPayout(false);
    }
  };

  const recentTxList =
    (revenueData as any)?.transactions ||
    (revenueData as any)?.recentTransactions ||
    [];

  if (loading && !refreshing) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="small" color={colors.accent} />
        <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
          Fetching ledger transactions...
        </Text>
      </View>
    );
  }

  if (!revenueData) return null;

  return (
    <View className="gap-4">
      {/* Treasury Card */}
      <SurfaceCard className="p-4 border-accent/30 dark:border-accent-dark/30">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase">
            Settlement & Treasury
          </Text>
          <TouchableOpacity
            onPress={() => {
              triggerHapticFeedback();
              setShowPayoutModal(true);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="bg-accent min-h-[34px] px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 shadow-xs"
          >
            <Text className="text-xs font-bold text-accent-contrast">Manual Transfer</Text>
          </TouchableOpacity>
        </View>

        {(() => {
          const rawBal = revenueData.platformWallet?.balance || 0;
          const currency = (revenueData.platformWallet?.currency || 'PHP').toUpperCase();
          const isPhp = currency === 'PHP';
          const phpBal = isPhp ? rawBal : rawBal * 58;
          const usdBal = isPhp ? rawBal / 58 : rawBal;

          return (
            <View>
              <View className="flex-row items-baseline gap-1.5 mb-0.5">
                <Text className="text-2xl font-extrabold text-accent dark:text-accent-dark">
                  ₱{phpBal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                  PHP
                </Text>
              </View>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                USD approx: ${usdBal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} USD
              </Text>
            </View>
          );
        })()}

        {/* Real-World Gateway Settlement Info */}
        <View className="mt-3 pt-3 border-t border-input-border/50 dark:border-input-border-dark/50 gap-1.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
                Auto-Deposit: Rolling 2 Business Days
              </Text>
            </View>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
              Stripe & PayMongo
            </Text>
          </View>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
            Customer card & e-wallet payments settle automatically into your linked business bank account.
          </Text>
        </View>
      </SurfaceCard>

      {/* Recent Ledger Transactions */}
      <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
        Live Transactions Ledger ({recentTxList.length})
      </Text>

      {recentTxList.length === 0 ? (
        <SurfaceCard className="p-6 items-center justify-center">
          <Text className="text-xs text-text-muted dark:text-text-muted-dark">
            No transactions recorded in database yet.
          </Text>
        </SurfaceCard>
      ) : (
        recentTxList.map((tx: any) => (
          <SurfaceCard key={tx.id} className="p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {tx.type}
                  </Text>
                  <View className="bg-success/15 border border-success/30 px-1.5 py-0.5 rounded">
                    <Text className="text-[9px] font-bold text-success dark:text-success-dark">{tx.status}</Text>
                  </View>
                </View>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                  {tx.user?.email || 'System Platform'} · {tx.paymentMethod}
                </Text>
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                  {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                  {new Date(tx.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text
                className={`text-sm font-extrabold ${
                  tx.type === 'PAYOUT' ? 'text-danger dark:text-danger-dark' : 'text-success dark:text-success-dark'
                }`}
              >
                {tx.type === 'PAYOUT' ? '-' : '+'}${tx.amount.toFixed(2)}
              </Text>
            </View>
          </SurfaceCard>
        ))
      )}

      {/* ── Process Payout Modal ── */}
      {showPayoutModal && (
        <Modal
          visible={showPayoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPayoutModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                    Manual Fund Transfer
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Auto-settlement is active. Record a manual withdrawal:
                  </Text>
                </View>
                <ModalCloseButton onClose={() => setShowPayoutModal(false)} />
              </View>

              <View className="gap-3 mb-4">
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Payout Amount ({((revenueData?.platformWallet?.currency || 'PHP').toUpperCase() === 'PHP') ? '₱ PHP' : '$ USD'})
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. 500.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={payoutAmount}
                    onChangeText={setPayoutAmount}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Destination (GCash / Maya / Bank)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. GCash 0917-123-4567"
                    placeholderTextColor={colors.textMuted}
                    value={payoutDestination}
                    onChangeText={setPayoutDestination}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Internal Reference Notes
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Monthly server cost reimbursement"
                    placeholderTextColor={colors.textMuted}
                    value={payoutNotes}
                    onChangeText={setPayoutNotes}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleProcessPayout}
                disabled={processingPayout}
                className="bg-accent min-h-[48px] py-3.5 rounded-xl items-center justify-center"
              >
                {processingPayout ? (
                  <ActivityIndicator size="small" color={colors.accentContrast} />
                ) : (
                  <Text className="text-xs font-bold text-accent-contrast">Confirm & Settle Payout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
