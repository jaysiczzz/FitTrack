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
  getAdminRevenueOverviewApi,
  processAdminPayoutApi,
  adminOverrideSubscriptionApi,
  AdminRevenueResponse,
  SubscriptionTierType,
} from '@/api/subscription';

interface AdminRevenueModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdminRevenueModal({ visible, onClose }: AdminRevenueModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();

  const [data, setData] = useState<AdminRevenueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'subscribers' | 'ledger'>('metrics');

  // Payout state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDestination, setPayoutDestination] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  // Override subscriber state
  const [selectedUserToOverride, setSelectedUserToOverride] = useState<{
    id: string;
    email: string;
    name: string;
    tier: SubscriptionTierType;
  } | null>(null);
  const [overrideTier, setOverrideTier] = useState<SubscriptionTierType>('PRO_ANNUAL');
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await getAdminRevenueOverviewApi();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      showError('Admin Access Error', err?.message || 'Could not fetch admin revenue metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchRevenueData();
    }
  }, [visible]);

  const handleProcessPayout = async () => {
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    if (!payoutDestination.trim()) {
      showWarning('Missing Destination', 'Please specify a payout destination (e.g. bank account or wire).');
      return;
    }

    setProcessingPayout(true);
    try {
      const res = await processAdminPayoutApi(amountNum, payoutDestination.trim(), payoutNotes);
      if (res.success) {
        const symbol = data?.platformWallet?.currency === 'USD' ? '$' : '₱';
        showSuccess('Payout Processed', `${symbol}${amountNum.toFixed(2)} dispatched to ${payoutDestination.trim()}`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutDestination('');
        fetchRevenueData();
      }
    } catch (err: any) {
      showError('Payout Error', err?.message || 'Could not complete payout.');
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleOverrideSubscription = async () => {
    if (!selectedUserToOverride) return;

    setSavingOverride(true);
    try {
      const res = await adminOverrideSubscriptionApi(selectedUserToOverride.id, overrideTier, 'ACTIVE', 12);
      if (res.success) {
        showSuccess('Subscription Updated', res.message);
        setSelectedUserToOverride(null);
        fetchRevenueData();
      }
    } catch (err: any) {
      showError('Error', err?.message || 'Could not override subscription.');
    } finally {
      setSavingOverride(false);
    }
  };

  const metrics = data?.metrics;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[94%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center border border-purple-500/30">
                <Ionicons name="shield-checkmark" size={16} color="#A855F7" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                    Admin Revenue & e-Wallet
                  </Text>
                  <View className="bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 rounded-full">
                    <Text className="text-[9px] font-black text-purple-500 uppercase">
                      Admin
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  Live Stripe metrics, platform wallet balance & subscriber ledger
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Navigation Sub-Tabs */}
          <View className="flex-row gap-1.5 my-3 p-1 bg-input/40 dark:bg-input-dark/40 rounded-xl border border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              onPress={() => setActiveTab('metrics')}
              className={`flex-1 py-1.5 rounded-lg items-center ${
                activeTab === 'metrics' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'metrics' ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                }`}
              >
                Revenue Metrics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('subscribers')}
              className={`flex-1 py-1.5 rounded-lg items-center ${
                activeTab === 'subscribers' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'subscribers' ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                }`}
              >
                Subscribers ({data?.subscribers?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('ledger')}
              className={`flex-1 py-1.5 rounded-lg items-center ${
                activeTab === 'ledger' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'ledger' ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                }`}
              >
                Ledger ({data?.transactions?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator size="large" color={colors.accent} />
                <Text className="text-xs text-text-muted mt-2">Aggregating platform revenue...</Text>
              </View>
            ) : metrics ? (
              <>
                {/* TAB 1: METRICS OVERVIEW */}
                {activeTab === 'metrics' && (
                  <View className="gap-3 pb-6">
                    {/* Platform Master Wallet Card */}
                    <View className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
                      <View className="flex-row justify-between items-start mb-1">
                        <View>
                          <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                            Platform Master Revenue Wallet
                          </Text>
                          <Text className="text-3xl font-black text-accent dark:text-accent-dark mt-0.5">
                            ${metrics.platformWalletBalance.toFixed(2)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => setShowPayoutModal(true)}
                          className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl flex-row items-center gap-1 shadow-xs"
                        >
                          <Ionicons name="arrow-up-circle-outline" size={14} color="#FFFFFF" />
                          <Text className="text-white text-xs font-bold">
                            Request Payout
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row items-center gap-3 mt-2 pt-2 border-t border-emerald-500/20">
                        <Text className="text-[11px] text-text-muted">
                          Total Paid Out: <Text className="font-bold text-text-primary dark:text-text-primary-dark">${metrics.totalPayouts.toFixed(2)}</Text>
                        </Text>
                        <Text className="text-[11px] text-text-muted">
                          Net Margin: <Text className="font-bold text-accent">${metrics.netRevenue.toFixed(2)}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* 4-Card Revenue Grid */}
                    <View className="flex-row gap-2.5">
                      {/* MRR */}
                      <View className="flex-1 p-3.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark">
                        <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-0.5">
                          Monthly Run Rate
                        </Text>
                        <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                          ${metrics.mrr.toFixed(2)}
                          <Text className="text-[10px] font-normal text-text-muted"> / mo</Text>
                        </Text>
                        <Text className="text-[10px] text-accent font-semibold mt-1">
                          ARR: ${metrics.arr.toFixed(2)}
                        </Text>
                      </View>

                      {/* Gross Revenue */}
                      <View className="flex-1 p-3.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark">
                        <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-0.5">
                          Gross Revenue
                        </Text>
                        <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                          ${metrics.grossRevenue.toFixed(2)}
                        </Text>
                        <Text className="text-[10px] text-text-muted mt-1">
                          Stripe Fees: -${metrics.stripeFees.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2.5">
                      {/* Active Subscribers */}
                      <View className="flex-1 p-3.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark">
                        <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-0.5">
                          Paying Subscribers
                        </Text>
                        <Text className="text-xl font-black text-purple-500">
                          {metrics.totalActivePayingSubscribers}
                        </Text>
                        <Text className="text-[10px] text-text-muted mt-1">
                          Total Users: {metrics.totalUsersCount}
                        </Text>
                      </View>

                      {/* Churn Rate */}
                      <View className="flex-1 p-3.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark">
                        <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-0.5">
                          Churn Rate
                        </Text>
                        <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                          {metrics.churnRate}%
                        </Text>
                        <Text className="text-[10px] text-accent font-semibold mt-1">
                          Industry Healthy &lt; 5%
                        </Text>
                      </View>
                    </View>

                    {/* Tier Breakdown Bars */}
                    <View className="p-3.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-2">
                        Subscribers by Tier
                      </Text>
                      <View className="gap-2">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xs text-text-primary dark:text-text-primary-dark">FitTrack Free</Text>
                          <Text className="text-xs font-bold text-text-muted">{data?.tierBreakdown.free} users</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xs text-text-primary dark:text-text-primary-dark">Pro Monthly ($9.99/mo)</Text>
                          <Text className="text-xs font-bold text-accent">{data?.tierBreakdown.proMonthly} users</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xs text-text-primary dark:text-text-primary-dark">Pro Annual ($79.99/yr)</Text>
                          <Text className="text-xs font-bold text-amber-500">{data?.tierBreakdown.proAnnual} users</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xs text-text-primary dark:text-text-primary-dark">Lifetime Founder ($199.99)</Text>
                          <Text className="text-xs font-bold text-purple-500">{data?.tierBreakdown.lifetime} users</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* TAB 2: SUBSCRIBERS DIRECTORY */}
                {activeTab === 'subscribers' && (
                  <View className="gap-2 pb-6">
                    {data.subscribers.length === 0 ? (
                      <View className="py-12 items-center justify-center">
                        <Text className="text-xs text-text-muted">No active paid subscribers yet.</Text>
                      </View>
                    ) : (
                      data.subscribers.map((sub) => {
                        const renewalStr = sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : 'Lifetime';

                        return (
                          <View
                            key={sub.id}
                            className="p-3.5 rounded-2xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark flex-row items-center justify-between"
                          >
                            <View className="flex-1 mr-2">
                              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                {sub.user?.firstName} {sub.user?.lastName}
                              </Text>
                              <Text className="text-[11px] text-text-muted">{sub.user?.email}</Text>
                              <Text className="text-[10px] text-text-muted mt-0.5">
                                Renews: {renewalStr} · ${sub.amount.toFixed(2)}
                              </Text>
                            </View>

                            <View className="items-end gap-1.5">
                              <View className="bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full">
                                <Text className="text-[10px] font-black text-accent dark:text-accent-dark">
                                  {sub.tier}
                                </Text>
                              </View>

                              <TouchableOpacity
                                onPress={() =>
                                  setSelectedUserToOverride({
                                    id: sub.user.id,
                                    email: sub.user.email,
                                    name: `${sub.user.firstName} ${sub.user.lastName}`,
                                    tier: sub.tier,
                                  })
                                }
                                className="px-2 py-0.5 rounded-md bg-input border border-input-border"
                              >
                                <Text className="text-[10px] font-semibold text-text-muted">
                                  Override Tier
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* TAB 3: GLOBAL TRANSACTION LEDGER */}
                {activeTab === 'ledger' && (
                  <View className="gap-2 pb-6">
                    {data.transactions.length === 0 ? (
                      <View className="py-12 items-center justify-center">
                        <Text className="text-xs text-text-muted">No transactions recorded yet.</Text>
                      </View>
                    ) : (
                      data.transactions.map((tx) => {
                        const isIncome = tx.amount > 0;
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
                            <View className="flex-1 mr-2">
                              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                {tx.description}
                              </Text>
                              <Text className="text-[10px] text-text-muted">
                                {tx.user ? `${tx.user.firstName} (${tx.user.email}) · ` : ''}
                                {dateStr} · {tx.paymentMethod}
                              </Text>
                            </View>

                            <View className="items-end">
                              <Text
                                className={`text-sm font-black ${
                                  isIncome ? 'text-accent dark:text-accent-dark' : 'text-danger dark:text-danger-dark'
                                }`}
                              >
                                {isIncome ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                              </Text>
                              {tx.fee > 0 && (
                                <Text className="text-[9px] text-text-muted">Fee: -${tx.fee.toFixed(2)}</Text>
                              )}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>

          {/* Payout Processing Modal */}
          {showPayoutModal && (
            <View className="absolute inset-0 bg-black/80 rounded-t-3xl p-5 justify-center">
              <View className="bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-input-border">
                <Text className="text-base font-black text-text-primary dark:text-text-primary-dark mb-1">
                  Request Platform Payout
                </Text>
                <Text className="text-xs text-text-muted mb-3">
                  Withdraw platform wallet balance to your bank account or Stripe Connect.
                </Text>

                <Text className="text-[10px] uppercase font-bold text-text-muted mb-1">
                  Amount (Available: ${metrics?.platformWalletBalance.toFixed(2)})
                </Text>
                <TextInput
                  value={payoutAmount}
                  onChangeText={setPayoutAmount}
                  keyboardType="decimal-pad"
                  placeholder="500.00"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border text-sm font-bold text-text-primary dark:text-text-primary-dark mb-3"
                />

                <Text className="text-[10px] uppercase font-bold text-text-muted mb-1">
                  Payout Destination
                </Text>
                <TextInput
                  value={payoutDestination}
                  onChangeText={setPayoutDestination}
                  placeholder="e.g. BDO / BPI Account 1234-5678 or Bank Wire"
                  placeholderTextColor={colors.textMuted}
                  className="bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border text-xs text-text-primary dark:text-text-primary-dark mb-4"
                />

                <View className="flex-row gap-2 justify-end">
                  <TouchableOpacity
                    onPress={() => setShowPayoutModal(false)}
                    className="px-3 py-2 rounded-xl border border-input-border"
                  >
                    <Text className="text-xs font-semibold text-text-muted">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleProcessPayout}
                    disabled={processingPayout}
                    className="px-4 py-2 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center"
                  >
                    {processingPayout && <ActivityIndicator size="small" color="#FFFFFF" className="mr-1.5" />}
                    <Text className="text-xs font-bold text-white">Authorize Payout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Admin Override Modal */}
          {selectedUserToOverride && (
            <View className="absolute inset-0 bg-black/80 rounded-t-3xl p-5 justify-center">
              <View className="bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-input-border">
                <Text className="text-base font-black text-text-primary dark:text-text-primary-dark mb-1">
                  Override User Tier
                </Text>
                <Text className="text-xs text-text-muted mb-3">
                  Admin grant for {selectedUserToOverride.name} ({selectedUserToOverride.email})
                </Text>

                <View className="flex-row gap-2 mb-4">
                  {(['FREE', 'PRO_MONTHLY', 'PRO_ANNUAL', 'LIFETIME_FOUNDER'] as SubscriptionTierType[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setOverrideTier(t)}
                      className={`flex-1 py-2 rounded-xl items-center border ${
                        overrideTier === t
                          ? 'bg-accent/15 border-accent'
                          : 'bg-input dark:bg-input-dark border-input-border'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          overrideTier === t ? 'text-accent' : 'text-text-muted'
                        }`}
                      >
                        {t.replace('PRO_', '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="flex-row gap-2 justify-end">
                  <TouchableOpacity
                    onPress={() => setSelectedUserToOverride(null)}
                    className="px-3 py-2 rounded-xl border border-input-border"
                  >
                    <Text className="text-xs font-semibold text-text-muted">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleOverrideSubscription}
                    disabled={savingOverride}
                    className="px-4 py-2 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center"
                  >
                    {savingOverride && <ActivityIndicator size="small" color="#FFFFFF" className="mr-1.5" />}
                    <Text className="text-xs font-bold text-white">Apply Override</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
