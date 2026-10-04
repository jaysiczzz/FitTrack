import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { hapticFeedback } from '@/utils/haptics';
import { updateUserProfile } from '@/api/user';
import { convertBlobToDataUrl, sanitizeAvatarUrl } from '@/utils/imageUtils';
import PhotoCropEditorModal from './PhotoCropEditorModal';

interface ChangeProfilePhotoModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatarUrl: string | null;
  onAvatarUpdated: (newAvatarUrl: string | null) => void;
}

export default function ChangeProfilePhotoModal({
  visible,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated,
}: ChangeProfilePhotoModalProps) {
  const { colors } = useThemeColors();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showCropEditor, setShowCropEditor] = useState(false);

  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showError('Permission Required', 'Please allow access to your photo library in settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Don't use stock cropper; let our Facebook-style editor handle pan and zoom!
        quality: 0.95,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImageUri(uri);
        setShowCropEditor(true);
      }
    } catch (err: any) {
      showError('Photo Selection Failed', err?.message || 'Could not select photo');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showError('Permission Required', 'Please allow camera access in settings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.95,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImageUri(uri);
        setShowCropEditor(true);
      }
    } catch (err: any) {
      showError('Camera Failed', err?.message || 'Could not take photo');
    }
  };

  const safeAvatarUrl = sanitizeAvatarUrl(currentAvatarUrl);

  const handleAdjustCurrent = () => {
    if (safeAvatarUrl) {
      hapticFeedback.light();
      setSelectedImageUri(safeAvatarUrl);
      setShowCropEditor(true);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      hapticFeedback.medium();
      const avatarKey = user?.id ? `fittrack_user_avatar_${user.id}` : 'fittrack_user_avatar';
      await AsyncStorage.removeItem(avatarKey);

      if (user) {
        await updateUser({ ...user, avatarUrl: undefined } as any);
      }
      // Sync removal with PostgreSQL database
      updateUserProfile({ avatarUrl: null }).catch((err) =>
        console.warn('Failed to sync avatar removal with backend:', err)
      );
      onAvatarUpdated(null);
      showSuccess('Photo Removed', 'Your profile picture has been reset to initials.');
      onClose();
    } catch (err: any) {
      showError('Action Failed', 'Could not remove photo');
    }
  };

  const saveNewAvatar = async (uri: string) => {
    try {
      hapticFeedback.light();
      // Ensure web blob URLs are converted to persistent base64 data URLs
      const persistentUri = await convertBlobToDataUrl(uri);
      const avatarKey = user?.id ? `fittrack_user_avatar_${user.id}` : 'fittrack_user_avatar';
      await AsyncStorage.setItem(avatarKey, persistentUri);

      if (user) {
        await updateUser({ ...user, avatarUrl: persistentUri } as any);
      }
      // Sync new avatar with PostgreSQL database
      updateUserProfile({ avatarUrl: persistentUri }).catch((err) =>
        console.warn('Failed to sync avatar with backend:', err)
      );
      onAvatarUpdated(persistentUri);
      showSuccess('Profile Updated', 'New profile photo saved successfully.');
      onClose();
    } catch (err: any) {
      showError('Save Failed', 'Could not save profile photo');
    }
  };

  const userInitials = (
    (user?.firstName?.[0] || 'A') + (user?.lastName?.[0] || '')
  ).toUpperCase();

  return (
    <>
      <Modal
        visible={visible && !showCropEditor}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/60 items-center justify-center p-4"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark p-5 shadow-2xl"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-accent/15 items-center justify-center">
                  <Ionicons name="camera" size={16} color={colors.accent} />
                </View>
                <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                  Profile Photo Options
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-7 h-7 rounded-full bg-input dark:bg-input-dark items-center justify-center"
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Current Avatar Preview */}
            <View className="items-center py-4">
              {safeAvatarUrl ? (
                <Image
                  source={{ uri: safeAvatarUrl }}
                  className="w-20 h-20 rounded-full border-2 border-accent dark:border-accent-dark bg-input dark:bg-input-dark"
                  resizeMode="cover"
                  onError={() => onAvatarUpdated(null)}
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-accent/20 dark:bg-accent-dark/25 border-2 border-accent dark:border-accent-dark items-center justify-center">
                  <Text className="text-accent dark:text-accent-dark font-black text-2xl">
                    {userInitials}
                  </Text>
                </View>
              )}
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2 font-medium">
                {safeAvatarUrl ? 'Custom photo active' : 'Default avatar'}
              </Text>
            </View>

            {/* Action Options */}
            <View className="gap-2.5">
              {/* Reposition Current Photo (if active) */}
              {safeAvatarUrl && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleAdjustCurrent}
                  className="flex-row items-center p-3.5 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30"
                >
                  <View className="w-9 h-9 rounded-lg bg-accent/20 items-center justify-center mr-3">
                    <Ionicons name="crop-outline" size={18} color={colors.accent} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-accent dark:text-accent-dark">
                      Adjust & Reposition Photo
                    </Text>
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                      Zoom or move your current picture
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
              )}

              {/* Take Photo */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  hapticFeedback.light();
                  handleTakePhoto();
                }}
                className="flex-row items-center p-3.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
              >
                <View className="w-9 h-9 rounded-lg bg-emerald-500/15 items-center justify-center mr-3">
                  <Ionicons name="camera-outline" size={20} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                    Take New Photo
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Use device camera for a fresh portrait
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Choose from Library */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  hapticFeedback.light();
                  handlePickFromGallery();
                }}
                className="flex-row items-center p-3.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
              >
                <View className="w-9 h-9 rounded-lg bg-sky-500/15 items-center justify-center mr-3">
                  <Ionicons name="images-outline" size={20} color="#0EA5E9" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                    Choose from Gallery
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Select an existing photo from your library
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Remove Photo (if active) */}
              {safeAvatarUrl && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRemovePhoto}
                  className="flex-row items-center p-3.5 rounded-xl bg-danger/10 dark:bg-danger/15 border border-danger/25"
                >
                  <View className="w-9 h-9 rounded-lg bg-danger/20 items-center justify-center mr-3">
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-danger dark:text-danger-dark">
                      Remove Current Photo
                    </Text>
                    <Text className="text-[11px] text-danger/80 dark:text-danger-dark/80">
                      Revert back to athlete initials
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="mt-4 py-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Facebook-style Photo Crop, Move & Zoom Editor */}
      <PhotoCropEditorModal
        visible={showCropEditor}
        imageUri={selectedImageUri}
        onClose={() => {
          setShowCropEditor(false);
          setSelectedImageUri(null);
        }}
        onSaveCroppedImage={async (croppedUri) => {
          await saveNewAvatar(croppedUri);
          setShowCropEditor(false);
          setSelectedImageUri(null);
        }}
      />
    </>
  );
}
