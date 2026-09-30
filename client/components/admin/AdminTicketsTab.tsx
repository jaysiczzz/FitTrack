import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import {
  AdminSupportTicket,
  updateAdminTicketApi,
  deleteAdminTicketApi,
} from '@/api/admin';

interface AdminTicketsTabProps {
  tickets: AdminSupportTicket[];
  loading: boolean;
  refreshing: boolean;
  ticketFilter: 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  onFilterChange: (f: 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => void;
  onReloadTickets: () => void;
}

export default function AdminTicketsTab({
  tickets,
  loading,
  refreshing,
  ticketFilter,
  onFilterChange,
  onReloadTickets,
}: AdminTicketsTabProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [adminTicketNotes, setAdminTicketNotes] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const handleUpdateTicketStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedTicket) return;
    try {
      setUpdatingTicket(true);
      triggerHapticFeedback();
      const res = await updateAdminTicketApi(selectedTicket.id, {
        status,
        adminNotes: adminTicketNotes.trim() || undefined,
      });

      if (res.success) {
        showSuccess('Ticket Updated', `Status changed to ${status}.`);
        setSelectedTicket(res.ticket);
        onReloadTickets();
      }
    } catch (err: any) {
      showError('Update Failed', err?.message || 'Could not update ticket.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    Alert.alert(
      'Delete Ticket',
      'Remove this support ticket permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHapticFeedback();
              const res = await deleteAdminTicketApi(ticketId);
              if (res.success) {
                showSuccess('Ticket Removed', 'Ticket deleted from support queue.');
                setSelectedTicket(null);
                onReloadTickets();
              }
            } catch (err: any) {
              showError('Delete Failed', err?.message || 'Could not delete ticket.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="gap-3">
      {/* Filter chips */}
      <View className="flex-row gap-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => {
              triggerHapticFeedback();
              onFilterChange(filter);
            }}
            className={`px-3 py-1.5 rounded-full border ${
              ticketFilter === filter
                ? 'bg-amber-500 border-amber-500'
                : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                ticketFilter === filter
                  ? 'text-black font-bold'
                  : 'text-text-muted dark:text-text-muted-dark'
              }`}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket List */}
      {loading && !refreshing ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
            Loading support queue...
          </Text>
        </View>
      ) : tickets.length === 0 ? (
        <SurfaceCard className="py-16 items-center justify-center">
          <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" />
          <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-2">
            Queue is clear!
          </Text>
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
            No pending support tickets in this category.
          </Text>
        </SurfaceCard>
      ) : (
        tickets.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => {
              triggerHapticFeedback();
              setSelectedTicket(t);
              setAdminTicketNotes(t.adminNotes || '');
            }}
            activeOpacity={0.7}
          >
            <SurfaceCard className="p-3.5">
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center gap-2">
                  <View className="bg-amber-500/10 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-amber-500 uppercase">
                      {t.category}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View
                  className={`px-2 py-0.5 rounded-full border ${
                    t.status === 'RESOLVED'
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-blue-500/15 border-blue-500/30'
                      : 'bg-amber-500/15 border-amber-500/30'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase ${
                      t.status === 'RESOLVED'
                        ? 'text-emerald-500'
                        : t.status === 'IN_PROGRESS'
                        ? 'text-blue-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark mb-1">
                {t.subject}
              </Text>
              <Text
                className="text-xs text-text-muted dark:text-text-muted-dark mb-2"
                numberOfLines={2}
              >
                {t.message}
              </Text>

              <View className="flex-row items-center justify-between pt-2 border-t border-input-border dark:border-input-border-dark">
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                  From: {t.userName || t.userEmail}
                </Text>
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                  Review & Reply →
                </Text>
              </View>
            </SurfaceCard>
          </TouchableOpacity>
        ))
      )}

      {/* ── Review Support Ticket Modal ── */}
      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Support Ticket
                </Text>
                <ModalCloseButton onClose={() => setSelectedTicket(null)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <View className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] font-bold text-amber-500 uppercase">
                      {selectedTicket.category} · {selectedTicket.id}
                    </Text>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                    {selectedTicket.subject}
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    User:{' '}
                    {selectedTicket.userName
                      ? `${selectedTicket.userName} (${selectedTicket.userEmail})`
                      : selectedTicket.userEmail}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    User Message
                  </Text>
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark leading-relaxed">
                    {selectedTicket.message}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Admin Resolution Note
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-xs text-text-primary dark:text-text-primary-dark min-h-[60px]"
                    placeholder="Enter resolution notes, actions taken, or replies..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={adminTicketNotes}
                    onChangeText={setAdminTicketNotes}
                  />
                </View>

                {/* Workflow Buttons */}
                <View className="flex-row gap-2 mt-1">
                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('IN_PROGRESS')}
                    disabled={updatingTicket}
                    className="flex-1 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center"
                  >
                    <Text className="text-[11px] font-bold text-blue-500">In Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('RESOLVED')}
                    disabled={updatingTicket}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 items-center justify-center"
                  >
                    <Text className="text-[11px] font-bold text-black">Mark Resolved</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteTicket(selectedTicket.id)}
                  className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 items-center justify-center mt-1"
                >
                  <Text className="text-[11px] font-bold text-rose-500">Delete Ticket</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
