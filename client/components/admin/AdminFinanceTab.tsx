import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutCurrency, setPayoutCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [payoutMethod, setPayoutMethod] = useState<'GCASH' | 'MAYA' | 'BANK'>('GCASH');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountNum, setPayoutAccountNum] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    phone?: string;
    bankName?: string;
    accountNum?: string;
    general?: string;
  }>({});

  const handleProcessPayout = async () => {
    const errs: typeof fieldErrors = {};
    const num = parseFloat(payoutAmount);
    if (!num || num <= 0) {
      errs.amount = 'Please enter a valid payout amount.';
    }

    if (payoutMethod === 'GCASH' || payoutMethod === 'MAYA') {
      if (!payoutPhone.trim()) {
        errs.phone = `${payoutMethod === 'GCASH' ? 'GCash' : 'Maya'} mobile number is required.`;
      }
    } else {
      if (!payoutBankName.trim()) {
        errs.bankName = 'Bank name is required (e.g. BDO, BPI).';
      }
      if (!payoutAccountNum.trim()) {
        errs.accountNum = 'Bank account number is required.';
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    const destination =
      payoutMethod === 'GCASH'
        ? `GCash: ${payoutPhone.trim()}`
        : payoutMethod === 'MAYA'
        ? `Maya: ${payoutPhone.trim()}`
        : `Bank Transfer: ${payoutBankName.trim()} · Acct: ${payoutAccountNum.trim()}`;

    // Normalize amount if USD chosen while platform wallet is PHP
    const walletCurr = (revenueData?.platformWallet?.currency || 'PHP').toUpperCase();
    const finalAmount = payoutCurrency === 'USD' && walletCurr === 'PHP' ? num * 58 : num;
    const noteSuffix = payoutCurrency === 'USD' ? ` (Requested: $${num.toFixed(2)} USD)` : '';
    const fullNotes = (payoutNotes.trim() + noteSuffix).trim() || undefined;

    try {
      setProcessingPayout(true);
      triggerHapticFeedback();
      const res = await processAdminPayoutApi(finalAmount, destination, fullNotes);

      if (res.success) {
        const symbol = payoutCurrency === 'PHP' ? '₱' : '$';
        showSuccess('Payout Completed', `Recorded payout of ${symbol}${num.toFixed(2)}.`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutPhone('');
        setPayoutBankName('');
        setPayoutAccountNum('');
        setPayoutNotes('');
        setFieldErrors({});
        onReloadFinance();
      }
    } catch (err: any) {
      setFieldErrors({ general: err?.message || 'Failed to process admin payout.' });
    } finally {
      setProcessingPayout(false);
    }
  };

  const recentTxList =
    (revenueData as any)?.transactions ||
    (revenueData as any)?.recentTransactions ||
    [];

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return recentTxList;
    const q = searchQuery.toLowerCase().trim();
    return recentTxList.filter((tx: any) => {
      const email = (tx.user?.email || '').toLowerCase();
      const type = (tx.type || '').toLowerCase();
      const status = (tx.status || '').toLowerCase();
      const method = (tx.paymentMethod || '').toLowerCase();
      const notes = (tx.notes || '').toLowerCase();
      const id = (tx.id || '').toLowerCase();
      return (
        email.includes(q) ||
        type.includes(q) ||
        status.includes(q) ||
        method.includes(q) ||
        notes.includes(q) ||
        id.includes(q)
      );
    });
  }, [recentTxList, searchQuery]);

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
    <View className="flex-1 min-h-0">
      <ScrollView
        className="flex-1 min-h-0"
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onReloadFinance}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* Child 0: Treasury Card */}
        <View className="mb-3">
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
        </View>

        {/* Child 1: STICKY Ledger Header & Search Input */}
        <View className="bg-background dark:bg-background-dark pb-3 pt-1 gap-2.5 border-b border-input-border/40 dark:border-input-border-dark/40 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
              Live Transactions Ledger ({filteredTransactions.length}{searchQuery ? ` of ${recentTxList.length}` : ''})
            </Text>
          </View>

          {/* Ledger Search Input */}
          {recentTxList.length > 0 && (
            <View className="flex-row items-center bg-input dark:bg-input-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
              <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by email, payment method, status, notes..."
                placeholderTextColor={colors.textMuted}
                className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Child 2: Transactions List */}
        <View className="gap-3">
          {recentTxList.length === 0 ? (
            <SurfaceCard className="p-6 items-center justify-center">
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                No transactions recorded in database yet.
              </Text>
            </SurfaceCard>
          ) : filteredTransactions.length === 0 ? (
            <SurfaceCard className="p-6 items-center justify-center">
              <Ionicons name="search-outline" size={28} color={colors.textMuted} />
              <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark mt-2">
                No matching transactions found
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5 text-center">
                No ledger records match "{searchQuery}".
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30"
              >
                <Text className="text-xs font-bold text-accent dark:text-accent-mint">Clear Search</Text>
              </TouchableOpacity>
            </SurfaceCard>
          ) : (
            filteredTransactions.map((tx: any) => (
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
        </View>
      </ScrollView>

      {/* ── Process Payout Modal ── */}
      {showPayoutModal && (
        <Modal
          visible={showPayoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setFieldErrors({});
            setShowPayoutModal(false);
          }}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                    Manual Fund Transfer
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Record a manual payout / withdrawal:
                  </Text>
                </View>
                <ModalCloseButton onClose={() => {
                  setFieldErrors({});
                  setShowPayoutModal(false);
                }} />
              </View>

              {fieldErrors.general ? (
                <View className="mb-3 px-3 py-2 rounded-xl bg-danger/10 border border-danger/30 flex-row items-center gap-2">
                  <Ionicons name="alert-circle" size={15} color={colors.danger} />
                  <Text className="text-xs text-danger dark:text-danger-dark flex-1 font-medium">
                    {fieldErrors.general}
                  </Text>
                </View>
              ) : null}

              <View className="gap-3 mb-4">
                {/* Currency Selector */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Currency
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        triggerHapticFeedback();
                        setPayoutCurrency('PHP');
                      }}
                      className={`flex-1 py-1.5 rounded-xl border items-center justify-center ${
                        payoutCurrency === 'PHP'
                          ? 'bg-accent/15 border-accent'
                          : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          payoutCurrency === 'PHP' ? 'text-accent dark:text-accent-dark' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        🇵🇭 PHP (₱)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        triggerHapticFeedback();
                        setPayoutCurrency('USD');
                      }}
                      className={`flex-1 py-1.5 rounded-xl border items-center justify-center ${
                        payoutCurrency === 'USD'
                          ? 'bg-accent/15 border-accent'
                          : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          payoutCurrency === 'USD' ? 'text-accent dark:text-accent-dark' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        🇺🇸 USD ($)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Payout Amount Field */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Payout Amount ({payoutCurrency === 'PHP' ? '₱ PHP' : '$ USD'}) *
                  </Text>
                  <TextInput
                    className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark ${
                      fieldErrors.amount
                        ? 'border-danger dark:border-danger-dark'
                        : 'border-input-border dark:border-input-border-dark'
                    }`}
                    placeholder={payoutCurrency === 'PHP' ? 'e.g. 5000.00' : 'e.g. 100.00'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={payoutAmount}
                    onChangeText={(val) => {
                      setPayoutAmount(val);
                      if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                    }}
                  />
                  {fieldErrors.amount ? (
                    <Text className="text-[11px] text-danger dark:text-danger-dark mt-1 font-medium">
                      {fieldErrors.amount}
                    </Text>
                  ) : null}
                </View>

                {/* Destination Method Selector Chips */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Destination Method *
                  </Text>
                  <View className="flex-row gap-1.5">
                    {(['GCASH', 'MAYA', 'BANK'] as const).map((method) => (
                      <TouchableOpacity
                        key={method}
                        onPress={() => {
                          triggerHapticFeedback();
                          setPayoutMethod(method);
                          setFieldErrors((prev) => ({ ...prev, phone: undefined, bankName: undefined, accountNum: undefined }));
                        }}
                        className={`flex-1 py-1.5 rounded-xl border items-center justify-center ${
                          payoutMethod === method
                            ? 'bg-accent/15 border-accent'
                            : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            payoutMethod === method
                              ? 'text-accent dark:text-accent-dark'
                              : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {method === 'GCASH' ? 'GCash' : method === 'MAYA' ? 'Maya' : 'Bank'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Method Specific Inputs */}
                {payoutMethod === 'GCASH' || payoutMethod === 'MAYA' ? (
                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      {payoutMethod === 'GCASH' ? 'GCash Mobile Number' : 'Maya Mobile Number'} *
                    </Text>
                    <TextInput
                      className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark ${
                        fieldErrors.phone
                          ? 'border-danger dark:border-danger-dark'
                          : 'border-input-border dark:border-input-border-dark'
                      }`}
                      placeholder="e.g. 0917-123-4567"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      value={payoutPhone}
                      onChangeText={(val) => {
                        setPayoutPhone(val);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                    />
                    {fieldErrors.phone ? (
                      <Text className="text-[11px] text-danger dark:text-danger-dark mt-1 font-medium">
                        {fieldErrors.phone}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View className="gap-2">
                    <View>
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                        Bank Name *
                      </Text>
                      <TextInput
                        className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark ${
                          fieldErrors.bankName
                            ? 'border-danger dark:border-danger-dark'
                            : 'border-input-border dark:border-input-border-dark'
                        }`}
                        placeholder="e.g. BDO Unibank, BPI, UnionBank"
                        placeholderTextColor={colors.textMuted}
                        value={payoutBankName}
                        onChangeText={(val) => {
                          setPayoutBankName(val);
                          if (fieldErrors.bankName) setFieldErrors((prev) => ({ ...prev, bankName: undefined }));
                        }}
                      />
                      {fieldErrors.bankName ? (
                        <Text className="text-[11px] text-danger dark:text-danger-dark mt-1 font-medium">
                          {fieldErrors.bankName}
                        </Text>
                      ) : null}
                    </View>

                    <View>
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                        Bank Account Number *
                      </Text>
                      <TextInput
                        className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark ${
                          fieldErrors.accountNum
                            ? 'border-danger dark:border-danger-dark'
                            : 'border-input-border dark:border-input-border-dark'
                        }`}
                        placeholder="e.g. 1234-5678-9012"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={payoutAccountNum}
                        onChangeText={(val) => {
                          setPayoutAccountNum(val);
                          if (fieldErrors.accountNum) setFieldErrors((prev) => ({ ...prev, accountNum: undefined }));
                        }}
                      />
                      {fieldErrors.accountNum ? (
                        <Text className="text-[11px] text-danger dark:text-danger-dark mt-1 font-medium">
                          {fieldErrors.accountNum}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* Reference Notes */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Internal Reference Notes (Optional)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Server cost reimbursement"
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
