import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FilterChip from '@/components/ui/FilterChip';
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
  const [ticketToDelete, setTicketToDelete] = useState<AdminSupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

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

  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      triggerHapticFeedback();
      const res = await deleteAdminTicketApi(ticketToDelete.id);
      if (res.success) {
        showSuccess('Ticket Removed', 'Ticket deleted from support queue.');
        setTicketToDelete(null);
        setSelectedTicket(null);
        onReloadTickets();
      }
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete ticket.');
    } finally {
      setDeletingTicket(false);
    }
  };

  return (
    <View className="gap-3">
      {/* Filter chips */}
      <View className="flex-row flex-wrap gap-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((filter) => (
          <FilterChip
            key={filter}
            label={filter.replace('_', ' ')}
            selected={ticketFilter === filter}
            onPress={() => {
              triggerHapticFeedback();
              onFilterChange(filter);
            }}
          />
        ))}
      </View>

      {/* Ticket List */}
      {loading && !refreshing ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="small" color={colors.accent} />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
            Loading support queue...
          </Text>
        </View>
      ) : tickets.length === 0 ? (
        <SurfaceCard className="py-16 items-center justify-center">
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
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
                  <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark uppercase">
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
                      ? 'bg-success/15 border-success/30'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-info/15 border-info/30'
                      : 'bg-warning/15 border-warning/30'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase ${
                      t.status === 'RESOLVED'
                        ? 'text-success dark:text-success-dark'
                        : t.status === 'IN_PROGRESS'
                        ? 'text-info dark:text-info-dark'
                        : 'text-warning dark:text-warning-dark'
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
          visible={Boolean(selectedTicket) && !ticketToDelete}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Support Ticket
                </Text>
                <ModalCloseButton onClose={() => setSelectedTicket(null)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <View className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
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
                    className="flex-1 min-h-[48px] py-3 rounded-xl bg-info/15 border border-info/30 items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-info dark:text-info-dark">In Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('RESOLVED')}
                    disabled={updatingTicket}
                    className="flex-1 min-h-[48px] py-3 rounded-xl bg-accent items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-accent-contrast">Mark Resolved</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setTicketToDelete(selectedTicket)}
                  className="min-h-[48px] py-3 rounded-xl bg-danger/10 border border-danger/20 items-center justify-center mt-1"
                >
                  <Text className="text-xs font-bold text-danger dark:text-danger-dark">Delete Ticket</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Ticket Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(ticketToDelete)}
        title="Delete Support Ticket"
        message={`Are you sure you want to permanently remove this support ticket from the queue? This cannot be undone.`}
        confirmText="Delete Ticket"
        cancelText="Cancel"
        isDanger
        loading={deletingTicket}
        onConfirm={handleConfirmDeleteTicket}
        onCancel={() => setTicketToDelete(null)}
      />
    </View>
  );
}
