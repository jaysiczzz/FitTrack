import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  PanResponder,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useThemeColors } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';
import { convertBlobToDataUrl } from '@/utils/imageUtils';

interface PhotoCropEditorModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSaveCroppedImage: (croppedUri: string) => Promise<void> | void;
}

const VIEWPORT_SIZE = 280; // Size of the circular crop area

export default function PhotoCropEditorModal({
  visible,
  imageUri,
  onClose,
  onSaveCroppedImage,
}: PhotoCropEditorModalProps) {
  const { colors } = useThemeColors();

  // Original image dimensions
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [loadingDimensions, setLoadingDimensions] = useState(true);
  const [saving, setSaving] = useState(false);

  // Transform states
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Refs for tracking pan gesture coordinates without stale closures
  const currentPanRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });

  // Reset transforms when modal opens with a new image
  useEffect(() => {
    if (visible && imageUri) {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      currentPanRef.current = { x: 0, y: 0 };
      setLoadingDimensions(true);

      Image.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
          setLoadingDimensions(false);
        },
        (error) => {
          console.warn('Could not get image dimensions:', error);
          // Fallback default aspect ratio
          setImageSize({ width: 1000, height: 1000 });
          setLoadingDimensions(false);
        }
      );
    }
  }, [visible, imageUri]);

  // Compute displayed base size to cover the circular viewport (cover mode)
  const baseDisplayedSize = useMemo(() => {
    if (!imageSize) return { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE };

    const { width: origW, height: origH } = imageSize;
    // Swap dimensions if rotated by 90 or 270 deg
    const effectiveW = rotation % 180 === 0 ? origW : origH;
    const effectiveH = rotation % 180 === 0 ? origH : origW;

    if (effectiveW >= effectiveH) {
      const height = VIEWPORT_SIZE;
      const width = (effectiveW / effectiveH) * VIEWPORT_SIZE;
      return { width, height };
    } else {
      const width = VIEWPORT_SIZE;
      const height = (effectiveH / effectiveW) * VIEWPORT_SIZE;
      return { width, height };
    }
  }, [imageSize, rotation]);

  // PanResponder to enable smooth drag/move of the image (Facebook-style)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startPanRef.current = { ...currentPanRef.current };
        },
        onPanResponderMove: (_, gestureState) => {
          const newX = startPanRef.current.x + gestureState.dx;
          const newY = startPanRef.current.y + gestureState.dy;

          currentPanRef.current = { x: newX, y: newY };
          setPan({ x: newX, y: newY });
        },
        onPanResponderRelease: () => {
          hapticFeedback.light();
        },
      }),
    []
  );

  const handleZoomChange = (newZoom: number) => {
    hapticFeedback.light();
    const clamped = Math.max(1.0, Math.min(3.5, Number(newZoom.toFixed(2))));
    setZoom(clamped);
  };

  const handleReset = () => {
    hapticFeedback.light();
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    currentPanRef.current = { x: 0, y: 0 };
  };

  const handleRotate = () => {
    hapticFeedback.light();
    setRotation((prev) => (prev + 90) % 360);
    // Center pan upon rotation
    setPan({ x: 0, y: 0 });
    currentPanRef.current = { x: 0, y: 0 };
  };

  // Perform actual crop using expo-image-manipulator
  const handleSave = async () => {
    if (!imageUri || !imageSize) return;

    try {
      setSaving(true);
      hapticFeedback.medium();

      const origW = imageSize.width;
      const origH = imageSize.height;

      // Current displayed dimensions with zoom
      const currentDispW = baseDisplayedSize.width * zoom;
      const currentDispH = baseDisplayedSize.height * zoom;

      // Scale factor from displayed pixels to original pixels
      const scaleToOriginal = origW / (rotation % 180 === 0 ? baseDisplayedSize.width : baseDisplayedSize.height);

      // Viewport center relative to the scaled image
      const centerInDispX = currentDispW / 2 - pan.x;
      const centerInDispY = currentDispH / 2 - pan.y;

      // Crop origin in display coordinates
      const cropDispOriginX = centerInDispX - VIEWPORT_SIZE / 2;
      const cropDispOriginY = centerInDispY - VIEWPORT_SIZE / 2;

      // Convert to original image pixel coordinates (accounting for zoom)
      const zoomRatio = 1 / zoom;
      let originX = Math.round(cropDispOriginX * scaleToOriginal * zoomRatio);
      let originY = Math.round(cropDispOriginY * scaleToOriginal * zoomRatio);
      let cropSizeInOrig = Math.round(VIEWPORT_SIZE * scaleToOriginal * zoomRatio);

      // Boundaries safety clamping
      const maxW = rotation % 180 === 0 ? origW : origH;
      const maxH = rotation % 180 === 0 ? origH : origW;

      originX = Math.max(0, Math.min(originX, maxW - 10));
      originY = Math.max(0, Math.min(originY, maxH - 10));
      cropSizeInOrig = Math.max(20, Math.min(cropSizeInOrig, maxW - originX, maxH - originY));

      const actions: any[] = [];
      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      actions.push({
        crop: {
          originX,
          originY,
          width: cropSizeInOrig,
          height: cropSizeInOrig,
        },
      });

      actions.push({
        resize: { width: 512, height: 512 },
      });

      const manipResult = await manipulateAsync(imageUri, actions, {
        compress: 0.85,
        format: SaveFormat.JPEG,
        base64: true,
      });

      let finalUri = manipResult.uri;
      if (manipResult.base64) {
        finalUri = `data:image/jpeg;base64,${manipResult.base64}`;
      } else if (finalUri.startsWith('blob:')) {
        finalUri = await convertBlobToDataUrl(finalUri);
      }

      await onSaveCroppedImage(finalUri);
      onClose();
    } catch (err) {
      console.warn('Image manipulation error, falling back to original image:', err);
      // Fallback: convert original imageUri to base64 if it is a blob
      let fallbackUri = imageUri;
      if (fallbackUri.startsWith('blob:')) {
        try {
          fallbackUri = await convertBlobToDataUrl(fallbackUri);
        } catch {}
      }
      await onSaveCroppedImage(fallbackUri);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {/* Top Navigation Bar */}
        <View className="pt-12 pb-3 px-5 flex-row items-center justify-between border-b border-zinc-800">
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-white font-bold text-base">Adjust Profile Photo</Text>
            <Text className="text-zinc-400 text-[11px] mt-0.5">Drag to move • Slider to zoom</Text>
          </View>

          <TouchableOpacity
            onPress={handleRotate}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center"
            accessibilityLabel="Rotate 90 degrees"
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Central Crop Area (Facebook-style Circular Cutout) */}
        <View className="flex-1 items-center justify-center relative overflow-hidden">
          {loadingDimensions ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <View
              style={{
                width: VIEWPORT_SIZE,
                height: VIEWPORT_SIZE,
                borderRadius: VIEWPORT_SIZE / 2,
                overflow: 'hidden',
                borderWidth: 2.5,
                borderColor: '#FFFFFF',
                backgroundColor: '#18181B',
                position: 'relative',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 15,
              }}
              {...panResponder.panHandlers}
            >
              {/* Image with dynamic transforms */}
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: baseDisplayedSize.width,
                    height: baseDisplayedSize.height,
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { scale: zoom },
                      { rotate: `${rotation}deg` },
                    ],
                  }}
                  resizeMode="contain"
                />
              </View>

              {/* Subtle Facebook-style alignment crosshairs */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: VIEWPORT_SIZE / 2,
                }}
              />
            </View>
          )}

          {/* Quick Helper Floating Badge */}
          <View className="absolute bottom-6 bg-zinc-900/90 border border-zinc-700/60 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5">
            <Ionicons name="hand-left-outline" size={13} color="#A1A1AA" />
            <Text className="text-zinc-300 text-xs font-medium">Pan with 1 finger</Text>
          </View>
        </View>

        {/* Bottom Adjustment Controls */}
        <View className="bg-zinc-950 border-t border-zinc-800/80 px-6 pt-4 pb-8">
          {/* Zoom Slider / Stepper Bar (Facebook style) */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => handleZoomChange(zoom - 0.25)}
              disabled={zoom <= 1.0}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center opacity-90 disabled:opacity-40"
            >
              <Ionicons name="remove" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Quick Zoom Pill Steps */}
            <View className="flex-1 mx-3 flex-row items-center justify-between bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1">
              {[1.0, 1.5, 2.0, 2.5, 3.0].map((step) => {
                const isActive = Math.abs(zoom - step) < 0.2;
                return (
                  <TouchableOpacity
                    key={step}
                    onPress={() => handleZoomChange(step)}
                    className={`px-2.5 py-1 rounded-full ${
                      isActive ? 'bg-accent' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isActive ? 'text-white' : 'text-zinc-400'
                      }`}
                    >
                      {step === 1.0 ? '1x' : `${step}x`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => handleZoomChange(zoom + 0.25)}
              disabled={zoom >= 3.5}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center opacity-90 disabled:opacity-40"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions & Reset */}
          <View className="flex-row items-center justify-between mb-5">
            <TouchableOpacity
              onPress={handleReset}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <Ionicons name="contract-outline" size={14} color="#A1A1AA" />
              <Text className="text-zinc-300 text-xs font-semibold">Center & Reset</Text>
            </TouchableOpacity>

            <Text className="text-zinc-500 text-xs font-medium">
              Zoom: {zoom.toFixed(1)}x {rotation > 0 ? `• Rotated ${rotation}°` : ''}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-zinc-800 items-center justify-center"
            >
              <Text className="text-sm font-bold text-zinc-300">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-accent items-center justify-center flex-row shadow-lg"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text className="text-sm font-bold text-white uppercase tracking-wider">
                    Save Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
