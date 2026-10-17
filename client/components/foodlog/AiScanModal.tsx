import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { getCurrentSubscriptionApi, getSubscriptionPlansApi } from '@/api/subscription';
import QuotaUsageMeter from '../ui/QuotaUsageMeter';
import {
  MealType,
  FoodLogItem,
  getSmartMealType,
  getTodayDateString,
  MEAL_LABELS,
  MEAL_GLYPHS,
  getSmartFoodBadge,
  getBadgeStyles,
} from './foodLogTypes';
import { analyzeMeal, MealAnalysisResult } from '../../api/ai';
import { useToast } from '../../context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import NutritionFactsModal from './NutritionFactsModal';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';

export type AiScanMode = 'photo' | 'describe';

interface AiScanModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMealItem: (item: FoodLogItem | FoodLogItem[]) => void;
  initialMealType?: MealType;
  initialMode?: 'photo' | 'text' | 'describe';
  onUpgradePress?: () => void;
}

export default function AiScanModal({
  visible,
  onClose,
  onAddMealItem,
  initialMealType,
  initialMode = 'photo',
  onUpgradePress,
}: AiScanModalProps) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { showWarning, showError, showSuccess } = useToast();
  const { user } = useAuth();

  // Mode Selection: 'photo' vs 'describe'
  const [scanMode, setScanMode] = useState<AiScanMode>(
    initialMode === 'text' || initialMode === 'describe' ? 'describe' : 'photo'
  );
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType || getSmartMealType());
  const [showNutritionFactsModal, setShowNutritionFactsModal] = useState(false);

  // Quota & Pro state (shared quota pool)
  const [isPro, setIsPro] = useState(false);
  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [freeScanLimit, setFreeScanLimit] = useState(3);
  const [proScanLimit, setProScanLimit] = useState(30);
  const [scanResetsAt, setScanResetsAt] = useState<string | null>(null);

  // =========================================================================
  // 1. PHOTO SCANNER STATE (Completely Isolated - Never shared with Describe)
  // =========================================================================
  const [photoNotes, setPhotoNotes] = useState('');
  const [photoSelectedImage, setPhotoSelectedImage] = useState<string | null>(null);
  const [photoImageBase64, setPhotoImageBase64] = useState<string | null>(null);
  const [photoImageMimeType, setPhotoImageMimeType] = useState<string>('image/jpeg');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoAnalysisPhase, setPhotoAnalysisPhase] = useState<'uploading' | 'detecting' | 'calculating'>('uploading');
  const photoPhaseTimerRef = useRef<{ t1?: ReturnType<typeof setTimeout>; t2?: ReturnType<typeof setTimeout> }>({});
  const photoAbortControllerRef = useRef<AbortController | null>(null);
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState<MealAnalysisResult | null>(null);
  const [photoScanError, setPhotoScanError] = useState<string | null>(null);
  const [photoPortionMultiplier, setPhotoPortionMultiplier] = useState<number>(1.0);
  const [photoBaseMacros, setPhotoBaseMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodiumMg?: number;
    saturatedFat?: number;
    servingSize: string;
  } | null>(null);

  // =========================================================================
  // 2. DESCRIBE MEAL STATE (Completely Isolated - Never shared with Photo)
  // =========================================================================
  const [describeText, setDescribeText] = useState('');
  const [describeLoading, setDescribeLoading] = useState(false);
  const [describeAnalysisPhase, setDescribeAnalysisPhase] = useState<'analyzing' | 'calculating'>('analyzing');
  const describePhaseTimerRef = useRef<{ t1?: ReturnType<typeof setTimeout> }>({});
  const describeAbortControllerRef = useRef<AbortController | null>(null);
  const [describeAnalysisResult, setDescribeAnalysisResult] = useState<MealAnalysisResult | null>(null);
  const [describeScanError, setDescribeScanError] = useState<string | null>(null);
  const [describePortionMultiplier, setDescribePortionMultiplier] = useState<number>(1.0);
  const [describeBaseMacros, setDescribeBaseMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodiumMg?: number;
    saturatedFat?: number;
    servingSize: string;
  } | null>(null);

  // Unmount safety: immediately abort any in-flight AI requests if modal is removed from DOM
  useEffect(() => {
    return () => {
      photoAbortControllerRef.current?.abort();
      describeAbortControllerRef.current?.abort();
    };
  }, []);

  // Sync initial state on modal open
  useEffect(() => {
    if (visible) {
      setSelectedMeal(initialMealType || getSmartMealType());
      if (initialMode === 'text' || initialMode === 'describe') {
        setScanMode('describe');
      } else {
        setScanMode('photo');
      }

      getCurrentSubscriptionApi()
        .then((res) => {
          if (res.success && res.isPro) {
            setIsPro(true);
          }
        })
        .catch(() => {});

      getSubscriptionPlansApi()
        .then((res) => {
          if (res?.limits?.FREE?.FOOD_SCAN?.max) {
            setFreeScanLimit(res.limits.FREE.FOOD_SCAN.max);
          }
          if (res?.limits?.PRO?.FOOD_SCAN?.max) {
            setProScanLimit(res.limits.PRO.FOOD_SCAN.max);
          }
          if (res?.userUsage?.usage?.FOOD_SCAN) {
            setDailyScanCount(res.userUsage.usage.FOOD_SCAN.used);
            if (res.userUsage.usage.FOOD_SCAN.resetsAt) {
              setScanResetsAt(res.userUsage.usage.FOOD_SCAN.resetsAt);
            }
          }
        })
        .catch(() => {});

      const todayStr = getTodayDateString();
      const countKey = authStorage.getScopedKey(user?.id, `daily_ai_scans_${todayStr}`);
      AsyncStorage.getItem(countKey).then((val) => {
        if (val) setDailyScanCount(parseInt(val, 10) || 0);
      });
    }
  }, [visible, initialMealType, initialMode, user?.id]);

  const resetAllState = () => {
    // Abort any ongoing AI network operations immediately to cancel processing & refund quota
    if (photoAbortControllerRef.current) {
      photoAbortControllerRef.current.abort();
      photoAbortControllerRef.current = null;
    }
    if (describeAbortControllerRef.current) {
      describeAbortControllerRef.current.abort();
      describeAbortControllerRef.current = null;
    }

    // Reset Photo Mode
    setPhotoNotes('');
    setPhotoSelectedImage(null);
    setPhotoImageBase64(null);
    setPhotoImageMimeType('image/jpeg');
    setPhotoAnalysisResult(null);
    setPhotoBaseMacros(null);
    setPhotoPortionMultiplier(1.0);
    setPhotoScanError(null);
    setPhotoLoading(false);
    setPhotoAnalysisPhase('uploading');
    if (photoPhaseTimerRef.current.t1) clearTimeout(photoPhaseTimerRef.current.t1);
    if (photoPhaseTimerRef.current.t2) clearTimeout(photoPhaseTimerRef.current.t2);

    // Reset Describe Mode
    setDescribeText('');
    setDescribeAnalysisResult(null);
    setDescribeBaseMacros(null);
    setDescribePortionMultiplier(1.0);
    setDescribeScanError(null);
    setDescribeLoading(false);
    setDescribeAnalysisPhase('analyzing');
    if (describePhaseTimerRef.current.t1) clearTimeout(describePhaseTimerRef.current.t1);

    setShowNutritionFactsModal(false);
    setSelectedMeal(initialMealType || getSmartMealType());
    setScanMode(initialMode === 'text' || initialMode === 'describe' ? 'describe' : 'photo');
  };

  const handleClearPhotoAnalysis = () => {
    setPhotoNotes('');
    setPhotoSelectedImage(null);
    setPhotoImageBase64(null);
    setPhotoImageMimeType('image/jpeg');
    setPhotoAnalysisResult(null);
    setPhotoBaseMacros(null);
    setPhotoPortionMultiplier(1.0);
    setPhotoScanError(null);
    setPhotoLoading(false);
    setPhotoAnalysisPhase('uploading');
    if (photoPhaseTimerRef.current.t1) clearTimeout(photoPhaseTimerRef.current.t1);
    if (photoPhaseTimerRef.current.t2) clearTimeout(photoPhaseTimerRef.current.t2);
  };

  const handleClearDescribeAnalysis = () => {
    setDescribeText('');
    setDescribeAnalysisResult(null);
    setDescribeBaseMacros(null);
    setDescribePortionMultiplier(1.0);
    setDescribeScanError(null);
    setDescribeLoading(false);
    setDescribeAnalysisPhase('analyzing');
    if (describePhaseTimerRef.current.t1) clearTimeout(describePhaseTimerRef.current.t1);
  };

  const handleClose = () => {
    if (photoLoading && photoAbortControllerRef.current) {
      photoAbortControllerRef.current.abort();
      photoAbortControllerRef.current = null;
      setPhotoLoading(false);
    }
    if (describeLoading && describeAbortControllerRef.current) {
      describeAbortControllerRef.current.abort();
      describeAbortControllerRef.current = null;
      setDescribeLoading(false);
    }
    setShowNutritionFactsModal(false);
    onClose();
  };

  const optimizeFoodImage = async (
    uri: string,
    fallbackBase64?: string | null
  ): Promise<{ uri: string; base64: string | null }> => {
    try {
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );
      return {
        uri: manipResult.uri || uri,
        base64: manipResult.base64 || fallbackBase64 || null,
      };
    } catch (err) {
      console.warn('[AiScanModal] Image optimization skipped, using fallback:', err);
      return { uri, base64: fallbackBase64 || null };
    }
  };

  // =========================================================================
  // PHOTO SCANNER FUNCTIONS (Dedicated — Never shared with Describe)
  // =========================================================================
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission Required',
            'Camera access is required to take photos of your meals and food packages.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const optimized = await optimizeFoodImage(asset.uri, asset.base64);
        setPhotoSelectedImage(optimized.uri);
        setPhotoImageBase64(optimized.base64);
        setPhotoImageMimeType('image/jpeg');
        setPhotoScanError(null);
        setPhotoAnalysisResult(null);
        setPhotoBaseMacros(null);
        setPhotoPortionMultiplier(1.0);
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      if (Platform.OS === 'web') {
        handlePickFromGallery();
      } else {
        Alert.alert('Camera Error', 'Could not open camera. Please check your camera permissions.');
      }
    }
  };

  const handlePickFromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission Required',
            'Photo library access is required to select food images.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const optimized = await optimizeFoodImage(asset.uri, asset.base64);
        setPhotoSelectedImage(optimized.uri);
        setPhotoImageBase64(optimized.base64);
        setPhotoImageMimeType('image/jpeg');
        setPhotoScanError(null);
        setPhotoAnalysisResult(null);
        setPhotoBaseMacros(null);
        setPhotoPortionMultiplier(1.0);
      }
    } catch (err: any) {
      console.error('Gallery Error:', err);
      Alert.alert('Gallery Error', 'Could not open photo library. Please check your permissions.');
    }
  };

  const handleAnalyzePhoto = async () => {
    const dailyScanLimit = isPro ? proScanLimit : freeScanLimit;
    if (dailyScanCount >= dailyScanLimit) {
      showWarning(
        isPro ? 'Daily Pro Limit Reached' : 'Daily Free AI Limit Reached',
        `You have used your ${dailyScanLimit} scans for today. Resets at midnight UTC.`
      );
      if (!isPro && onUpgradePress) {
        onUpgradePress();
      }
      return;
    }

    if (!photoImageBase64 && !photoNotes.trim()) {
      showWarning('No Image', 'Please take or pick a photo of your meal or food package first.');
      return;
    }

    if (photoAbortControllerRef.current) {
      photoAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    photoAbortControllerRef.current = controller;

    setPhotoLoading(true);
    setPhotoAnalysisPhase('uploading');
    if (photoPhaseTimerRef.current.t1) clearTimeout(photoPhaseTimerRef.current.t1);
    if (photoPhaseTimerRef.current.t2) clearTimeout(photoPhaseTimerRef.current.t2);
    photoPhaseTimerRef.current.t1 = setTimeout(() => setPhotoAnalysisPhase('detecting'), 700);
    photoPhaseTimerRef.current.t2 = setTimeout(() => setPhotoAnalysisPhase('calculating'), 1600);
    setPhotoScanError(null);
    setPhotoAnalysisResult(null);
    setPhotoBaseMacros(null);
    setPhotoPortionMultiplier(1.0);

    try {
      const res = await analyzeMeal({
        description: photoNotes.trim() || undefined,
        imageBase64: photoImageBase64 || undefined,
        mimeType: photoImageBase64 ? (photoImageMimeType || 'image/jpeg') : undefined,
        signal: controller.signal,
      });

      if (res.success && res.data && res.data.isFood !== false) {
        const nextCount = dailyScanCount + 1;
        setDailyScanCount(nextCount);
        const todayStr = getTodayDateString();
        const countKey = authStorage.getScopedKey(user?.id, `daily_ai_scans_${todayStr}`);
        AsyncStorage.setItem(countKey, nextCount.toString()).catch(() => {});

        setPhotoAnalysisResult(res.data);
        setPhotoBaseMacros({
          calories: Number(res.data.calories) || 0,
          protein: Number(res.data.protein) || 0,
          carbs: Number(res.data.carbs) || 0,
          fat: Number(res.data.fat) || 0,
          fiber: res.data.fiber,
          sugar: res.data.sugar,
          sodiumMg: res.data.sodiumMg,
          saturatedFat: res.data.saturatedFat,
          servingSize: res.data.servingSize || '1 serving',
        });
        setPhotoPortionMultiplier(1.0);
      } else {
        const errorMsg =
          res.error ||
          res.message ||
          res.data?.rejectionReason ||
          'The provided image does not appear to be food. Please take a photo of a meal, drink, or food nutrition facts label.';
        setPhotoScanError(errorMsg);
        showError('Image is Not Food', errorMsg);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // User aborted the scan or closed the modal; exit cleanly without displaying error banner
        return;
      }

      const errText = err?.message || '';
      const dailyScanLimit = isPro ? proScanLimit : freeScanLimit;
      if (errText.includes('LIMIT_REACHED') || err?.status === 429) {
        setDailyScanCount(dailyScanLimit);
        const limitMsg = `Daily limit reached (${dailyScanLimit}/${dailyScanLimit}). Resets at midnight UTC.`;
        setPhotoScanError(limitMsg);
        showWarning('Scan Limit Reached', limitMsg);
        return;
      }

      const errMsg = getFriendlyErrorMessage(
        err,
        'Unable to analyze your meal photo right now. Please try again with a clearer photo.'
      );
      setPhotoScanError(errMsg);
      showError('Analysis Failed', errMsg);
    } finally {
      if (photoAbortControllerRef.current === controller) {
        photoAbortControllerRef.current = null;
      }
      if (photoPhaseTimerRef.current.t1) clearTimeout(photoPhaseTimerRef.current.t1);
      if (photoPhaseTimerRef.current.t2) clearTimeout(photoPhaseTimerRef.current.t2);
      setPhotoLoading(false);
    }
  };

  const handlePhotoPortionMultiplierChange = (mult: number) => {
    if (!photoBaseMacros || !photoAnalysisResult) return;
    setPhotoPortionMultiplier(mult);

    const scale = (val?: number) => (val !== undefined ? Math.round(val * mult * 10) / 10 : undefined);
    const scaleInt = (val?: number) => (val !== undefined ? Math.round(val * mult) : undefined);

    setPhotoAnalysisResult((prev) =>
      prev
        ? {
            ...prev,
            calories: scaleInt(photoBaseMacros.calories) ?? 0,
            protein: scale(photoBaseMacros.protein) ?? 0,
            carbs: scale(photoBaseMacros.carbs) ?? 0,
            fat: scale(photoBaseMacros.fat) ?? 0,
            fiber: scale(photoBaseMacros.fiber),
            sugar: scale(photoBaseMacros.sugar),
            sodiumMg: scaleInt(photoBaseMacros.sodiumMg),
            saturatedFat: scale(photoBaseMacros.saturatedFat),
            servingSize: mult === 1 ? photoBaseMacros.servingSize : `${mult}x (${photoBaseMacros.servingSize})`,
          }
        : null
    );
  };

  const handleConfirmAndAddPhoto = () => {
    if (!photoAnalysisResult) return;

    const smartBadge = getSmartFoodBadge({
      calories: photoAnalysisResult.calories,
      protein: photoAnalysisResult.protein,
      carbs: photoAnalysisResult.carbs,
      fat: photoAnalysisResult.fat,
      title: photoAnalysisResult.foodName,
    });

    const newItem: FoodLogItem = {
      id: Date.now().toString(),
      mealType: selectedMeal,
      title: photoAnalysisResult.foodName || 'Scanned Meal',
      subtitle: photoAnalysisResult.servingSize || '1 serving',
      calories: Number(photoAnalysisResult.calories) || 0,
      protein: Number(photoAnalysisResult.protein) || 0,
      carbs: Number(photoAnalysisResult.carbs) || 0,
      fat: Number(photoAnalysisResult.fat) || 0,
      goalBadge: smartBadge.badge,
      goalBadgeColor: smartBadge.color,
      healthNotes: photoAnalysisResult.healthNotes,
      imageUri: photoSelectedImage || undefined,
    };

    onAddMealItem(newItem);
    handleClearPhotoAnalysis();
    setShowNutritionFactsModal(false);
    onClose();
  };

  // =========================================================================
  // DESCRIBE MEAL FUNCTIONS (Dedicated — Never shared with Photo)
  // =========================================================================
  const handleAnalyzeDescription = async () => {
    const dailyScanLimit = isPro ? proScanLimit : freeScanLimit;
    if (dailyScanCount >= dailyScanLimit) {
      showWarning(
        isPro ? 'Daily Pro Limit Reached' : 'Daily Free AI Limit Reached',
        `You have used your ${dailyScanLimit} scans for today. Resets at midnight UTC.`
      );
      if (!isPro && onUpgradePress) {
        onUpgradePress();
      }
      return;
    }

    if (!describeText.trim()) {
      showWarning('Description Required', 'Please describe what you are eating (e.g. 1 bowl of chicken soup with rice).');
      return;
    }

    if (describeAbortControllerRef.current) {
      describeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    describeAbortControllerRef.current = controller;

    setDescribeLoading(true);
    setDescribeAnalysisPhase('analyzing');
    if (describePhaseTimerRef.current.t1) clearTimeout(describePhaseTimerRef.current.t1);
    describePhaseTimerRef.current.t1 = setTimeout(() => setDescribeAnalysisPhase('calculating'), 1200);
    setDescribeScanError(null);
    setDescribeAnalysisResult(null);
    setDescribeBaseMacros(null);
    setDescribePortionMultiplier(1.0);

    try {
      // NOTE: Strictly isolated payload! Passes ONLY the text description.
      // imageBase64 and mimeType are explicitly undefined so camera residue never bleeds into text analysis.
      const res = await analyzeMeal({
        description: describeText.trim(),
        imageBase64: undefined,
        mimeType: undefined,
        signal: controller.signal,
      });

      if (res.success && res.data && res.data.isFood !== false) {
        const nextCount = dailyScanCount + 1;
        setDailyScanCount(nextCount);
        const todayStr = getTodayDateString();
        const countKey = authStorage.getScopedKey(user?.id, `daily_ai_scans_${todayStr}`);
        AsyncStorage.setItem(countKey, nextCount.toString()).catch(() => {});

        setDescribeAnalysisResult(res.data);
        setDescribeBaseMacros({
          calories: Number(res.data.calories) || 0,
          protein: Number(res.data.protein) || 0,
          carbs: Number(res.data.carbs) || 0,
          fat: Number(res.data.fat) || 0,
          fiber: res.data.fiber,
          sugar: res.data.sugar,
          sodiumMg: res.data.sodiumMg,
          saturatedFat: res.data.saturatedFat,
          servingSize: res.data.servingSize || '1 serving',
        });
        setDescribePortionMultiplier(1.0);
      } else {
        const errorMsg =
          res.error ||
          res.message ||
          res.data?.rejectionReason ||
          'The description provided does not seem to contain edible food or beverage. Please enter a valid meal description.';
        setDescribeScanError(errorMsg);
        showError('Not Recognized as Food', errorMsg);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // User aborted the analysis or closed the modal; exit cleanly without displaying error banner
        return;
      }

      const errText = err?.message || '';
      const dailyScanLimit = isPro ? proScanLimit : freeScanLimit;
      if (errText.includes('LIMIT_REACHED') || err?.status === 429) {
        setDailyScanCount(dailyScanLimit);
        const limitMsg = `Daily limit reached (${dailyScanLimit}/${dailyScanLimit}). Resets at midnight UTC.`;
        setDescribeScanError(limitMsg);
        showWarning('Scan Limit Reached', limitMsg);
        return;
      }

      const errMsg = getFriendlyErrorMessage(
        err,
        'Unable to analyze your meal description right now. Please try again with more details.'
      );
      setDescribeScanError(errMsg);
      showError('Analysis Failed', errMsg);
    } finally {
      if (describeAbortControllerRef.current === controller) {
        describeAbortControllerRef.current = null;
      }
      if (describePhaseTimerRef.current.t1) clearTimeout(describePhaseTimerRef.current.t1);
      setDescribeLoading(false);
    }
  };

  const handleDescribePortionMultiplierChange = (mult: number) => {
    if (!describeBaseMacros || !describeAnalysisResult) return;
    setDescribePortionMultiplier(mult);

    const scale = (val?: number) => (val !== undefined ? Math.round(val * mult * 10) / 10 : undefined);
    const scaleInt = (val?: number) => (val !== undefined ? Math.round(val * mult) : undefined);

    setDescribeAnalysisResult((prev) =>
      prev
        ? {
            ...prev,
            calories: scaleInt(describeBaseMacros.calories) ?? 0,
            protein: scale(describeBaseMacros.protein) ?? 0,
            carbs: scale(describeBaseMacros.carbs) ?? 0,
            fat: scale(describeBaseMacros.fat) ?? 0,
            fiber: scale(describeBaseMacros.fiber),
            sugar: scale(describeBaseMacros.sugar),
            sodiumMg: scaleInt(describeBaseMacros.sodiumMg),
            saturatedFat: scale(describeBaseMacros.saturatedFat),
            servingSize: mult === 1 ? describeBaseMacros.servingSize : `${mult}x (${describeBaseMacros.servingSize})`,
          }
        : null
    );
  };

  const handleConfirmAndAddDescribe = () => {
    if (!describeAnalysisResult) return;

    const smartBadge = getSmartFoodBadge({
      calories: describeAnalysisResult.calories,
      protein: describeAnalysisResult.protein,
      carbs: describeAnalysisResult.carbs,
      fat: describeAnalysisResult.fat,
      title: describeAnalysisResult.foodName,
    });

    const newItem: FoodLogItem = {
      id: Date.now().toString(),
      mealType: selectedMeal,
      title: describeAnalysisResult.foodName || 'Described Meal',
      subtitle: describeAnalysisResult.servingSize || '1 serving',
      calories: Number(describeAnalysisResult.calories) || 0,
      protein: Number(describeAnalysisResult.protein) || 0,
      carbs: Number(describeAnalysisResult.carbs) || 0,
      fat: Number(describeAnalysisResult.fat) || 0,
      goalBadge: smartBadge.badge,
      goalBadgeColor: smartBadge.color,
      healthNotes: describeAnalysisResult.healthNotes,
      imageUri: undefined, // Described meals have no photo
    };

    onAddMealItem(newItem);
    handleClearDescribeAnalysis();
    setShowNutritionFactsModal(false);
    onClose();
  };

  // Active result for the FDA nutrition facts modal
  const activeNutritionFactsResult = scanMode === 'photo' ? photoAnalysisResult : describeAnalysisResult;

  // Clicking outside / on the backdrop dismisses the keyboard, but NEVER closes the modal
  const handleBackdropPress = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
      >
        <Pressable
          className="absolute inset-0"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleBackdropPress}
          accessible={false}
        />

        <View
          style={{
            paddingTop: Platform.OS !== 'web' && insets.top > 0 ? insets.top + 8 : 16,
            paddingBottom: Platform.OS !== 'web' && insets.bottom > 0 ? insets.bottom + 8 : 16,
          }}
          className="bg-surface dark:bg-surface-dark flex-1 md:flex-none h-full md:h-[92%] w-full md:max-w-2xl rounded-none md:rounded-3xl p-4 md:p-6 border-0 md:border border-input-border dark:border-input-border-dark shadow-2xl flex-col"
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center pb-3 border-b border-input-border dark:border-input-border-dark mb-2.5">
            <View className="flex-1 pr-2 min-w-0">
              <Text numberOfLines={1} className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                {scanMode === 'photo' ? 'AI Food Scanner' : 'Describe Meal'}
              </Text>
              <Text numberOfLines={1} className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
                {scanMode === 'photo'
                  ? 'Snap a plate photo or nutrition label for instant nutrient breakdown'
                  : 'Describe what you are eating in plain text for instant AI macro breakdown'}
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          {/* Mode Switcher Segmented Control */}
          <View className="flex-row rounded-xl bg-input dark:bg-input-dark p-1 mb-3 border border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              onPress={() => {
                if (scanMode !== 'photo') {
                  if (describeLoading) {
                    describeAbortControllerRef.current?.abort();
                    describeAbortControllerRef.current = null;
                    if (describePhaseTimerRef.current.t1) clearTimeout(describePhaseTimerRef.current.t1);
                    setDescribeLoading(false);
                  }
                  setScanMode('photo');
                }
              }}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${
                scanMode === 'photo'
                  ? 'bg-surface dark:bg-surface-dark shadow-xs border border-input-border/70 dark:border-input-border-dark/70'
                  : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="camera"
                size={14}
                color={scanMode === 'photo' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  scanMode === 'photo'
                    ? 'text-text-primary dark:text-text-primary-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Photo Scanner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (scanMode !== 'describe') {
                  if (photoLoading) {
                    photoAbortControllerRef.current?.abort();
                    photoAbortControllerRef.current = null;
                    if (photoPhaseTimerRef.current.t1) clearTimeout(photoPhaseTimerRef.current.t1);
                    if (photoPhaseTimerRef.current.t2) clearTimeout(photoPhaseTimerRef.current.t2);
                    setPhotoLoading(false);
                  }
                  setScanMode('describe');
                }
              }}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${
                scanMode === 'describe'
                  ? 'bg-surface dark:bg-surface-dark shadow-xs border border-input-border/70 dark:border-input-border-dark/70'
                  : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={scanMode === 'describe' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  scanMode === 'describe'
                    ? 'text-text-primary dark:text-text-primary-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Describe Meal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subscription Quota / Pro Perk Banner */}
          <QuotaUsageMeter
            isPro={isPro}
            used={dailyScanCount}
            limit={isPro ? proScanLimit : freeScanLimit}
            unit="scans"
            period="day"
            resetsAt={scanResetsAt || undefined}
            onUpgradePress={onUpgradePress}
            className="mb-3"
          />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="flex-1 mb-2">
            {/* Meal Category Selector */}
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-baloo-bold uppercase">
                Meal Category:
              </Text>
              <View className="bg-accent/10 dark:bg-accent-dark/20 px-2 py-0.5 rounded-full border border-accent/20">
                <Text className="text-accent dark:text-accent-dark text-[10px] font-baloo-bold">
                  Auto-selected by time
                </Text>
              </View>
            </View>

            <View className="flex-row gap-1.5 mb-3.5">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => {
                const isSelected = selectedMeal === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMeal(m)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={MEAL_LABELS[m]}
                    className={`flex-1 min-h-[44px] py-1.5 px-1 rounded-xl items-center justify-center border active:opacity-75 ${
                      isSelected
                        ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Ionicons
                      name={MEAL_GLYPHS[m]}
                      size={14}
                      color={isSelected ? colors.accentContrast : colors.textMuted}
                      style={{ marginBottom: 2 }}
                    />
                    <Text
                      className={`text-[10px] capitalize ${
                        isSelected
                          ? 'text-accent-contrast dark:text-accent-contrast-dark font-baloo-bold'
                          : 'text-text-primary dark:text-text-primary-dark font-baloo-medium'
                      }`}
                    >
                      {MEAL_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ========================================================================= */}
            {/* MODE 1: PHOTO SCANNER VIEW                                                */}
            {/* ========================================================================= */}
            {scanMode === 'photo' && (
              <View>
                <View className="mb-3.5">
                  {photoSelectedImage ? (
                    <View className="relative rounded-2xl overflow-hidden mb-3 border border-input-border dark:border-input-border-dark">
                      <Image source={{ uri: photoSelectedImage }} className="w-full h-48 bg-black/10" resizeMode="cover" />
                      <View className="absolute top-2 left-2 bg-black/70 px-2.5 py-1 rounded-full flex-row items-center">
                        <Text className="text-emerald-400 text-[10px] font-bold mr-1">●</Text>
                        <Text className="text-white text-[10px] font-bold">Photo Ready</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setPhotoSelectedImage(null);
                          setPhotoImageBase64(null);
                          setPhotoScanError(null);
                          setPhotoAnalysisResult(null);
                          setPhotoBaseMacros(null);
                        }}
                        className="absolute top-2 right-2 bg-black/70 px-3 py-1.5 rounded-full"
                      >
                        <Text className="text-white text-xs font-bold">Retake / Clear</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-6 mb-3 border border-dashed border-input-border dark:border-input-border-dark items-center justify-center">
                      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-1 text-center">
                        Snap Food Photo or Nutrition Facts
                      </Text>
                      <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[260px] leading-4">
                        Take a clear top-down photo of your meal or the FDA Nutrition Facts label on the back of any package.
                      </Text>

                      <View className="flex-row gap-2.5">
                        <TouchableOpacity
                          onPress={handleTakePhoto}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel="Open camera to photograph meal"
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          className="bg-accent dark:bg-accent-dark px-4 py-2.5 min-h-[44px] rounded-xl flex-row items-center justify-center gap-2 shadow-xs active:opacity-90"
                        >
                          <Ionicons name="camera" size={16} color={colors.accentContrast} />
                          <Text className="text-accent-contrast dark:text-accent-contrast-dark font-baloo-bold text-xs">
                            Open Camera
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handlePickFromGallery}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel="Choose photo from library"
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          className="bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark px-4 py-2.5 min-h-[44px] rounded-xl flex-row items-center justify-center gap-2 shadow-xs active:opacity-80"
                        >
                          <Ionicons name="images" size={16} color={colors.textPrimary} />
                          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-xs">
                            Photo Library
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-1">
                    Optional notes or portion details:
                  </Text>
                  <TextInput
                    className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                    placeholder="e.g. 1.5 cups, extra avocado, low sodium"
                    placeholderTextColor={colors.textMuted}
                    value={photoNotes}
                    onChangeText={setPhotoNotes}
                  />
                </View>

                {/* Photo Scan Error Banner */}
                {photoScanError && (
                  <View className="mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text className="text-rose-500 dark:text-rose-400 font-extrabold text-sm">
                        {photoScanError.toLowerCase().includes('food') ? 'Image is Not Food' : 'Scan Notice'}
                      </Text>
                    </View>
                    <Text className="text-text-primary dark:text-text-primary-dark text-xs leading-4 mb-3">
                      {photoScanError}
                    </Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                        className="flex-1 bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                      >
                        <Ionicons name="camera" size={14} color="#EF4444" />
                        <Text className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                          Retake Photo
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handlePickFromGallery}
                        activeOpacity={0.8}
                        className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                      >
                        <Ionicons name="images" size={14} color={colors.textPrimary} />
                        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
                          Choose Another
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Photo Analyze Action Button */}
                {!photoAnalysisResult && (
                  photoLoading ? (
                    <View className="mt-1 flex-row gap-2">
                      <View className="flex-1 bg-accent/90 dark:bg-accent-dark/90 py-3.5 px-3 rounded-xl items-center justify-center flex-row shadow-sm">
                        <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                        <Text numberOfLines={1} className="text-white font-bold text-xs flex-1 text-center">
                          {photoAnalysisPhase === 'uploading'
                            ? 'Processing photo...'
                            : photoAnalysisPhase === 'detecting'
                            ? 'Detecting ingredients...'
                            : 'Calculating macros...'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          photoAbortControllerRef.current?.abort();
                          photoAbortControllerRef.current = null;
                          if (photoPhaseTimerRef.current.t1) clearTimeout(photoPhaseTimerRef.current.t1);
                          if (photoPhaseTimerRef.current.t2) clearTimeout(photoPhaseTimerRef.current.t2);
                          setPhotoLoading(false);
                        }}
                        activeOpacity={0.7}
                        className="bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 px-4 py-3.5 rounded-xl items-center justify-center"
                      >
                        <Text className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleAnalyzePhoto}
                      activeOpacity={0.8}
                      className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center justify-center flex-row shadow-sm mt-1"
                    >
                      <Ionicons name="scan" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text className="text-white font-bold text-sm">
                        Analyze Meal Photo
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                {/* Photo Result Card */}
                {photoAnalysisResult && (() => {
                  const smartBadge = getSmartFoodBadge({
                    calories: photoAnalysisResult.calories,
                    protein: photoAnalysisResult.protein,
                    carbs: photoAnalysisResult.carbs,
                    fat: photoAnalysisResult.fat,
                    title: photoAnalysisResult.foodName,
                  });
                  const badgeStyles = getBadgeStyles(smartBadge.color);
                  const confPct =
                    photoAnalysisResult.confidenceScore !== undefined
                      ? Math.round(photoAnalysisResult.confidenceScore * 100)
                      : null;

                  return (
                    <View className="mt-3 p-4 bg-input dark:bg-input-dark rounded-2xl border border-accent/50 dark:border-accent-dark/50 shadow-xs">
                      {/* Result Header */}
                      <View className="flex-row justify-between items-center mb-2 flex-wrap gap-y-1">
                        <View className="flex-row items-center flex-1 mr-2">
                          <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                            Photo Nutrient Breakdown
                          </Text>
                        </View>
                        {confPct !== null && (
                          <View
                            className={`px-2 py-0.5 rounded-full border ${
                              confPct >= 85
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : confPct >= 65
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-zinc-500/10 border-zinc-500/30'
                            }`}
                          >
                            <Text
                              className={`text-[9px] font-bold ${
                                confPct >= 85
                                  ? 'text-emerald-500 dark:text-emerald-400'
                                  : confPct >= 65
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-text-muted dark:text-text-muted-dark'
                              }`}
                            >
                              {confPct}% confidence
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Smart Badge & Dietary Flags */}
                      <View className="flex-row flex-wrap items-center gap-1.5 mb-2.5">
                        {smartBadge.badge ? (
                          <View className={`px-2.5 py-0.5 rounded-full border ${badgeStyles.container}`}>
                            <Text className={`text-[10px] font-bold ${badgeStyles.text}`}>
                              {smartBadge.badge}
                            </Text>
                          </View>
                        ) : null}
                        {(photoAnalysisResult.dietaryFlags || []).map((flag, idx) => (
                          <View
                            key={idx}
                            className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark"
                          >
                            <Text className="text-[10px] font-medium text-text-muted dark:text-text-muted-dark">
                              {flag}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Portion Multiplier Selector */}
                      <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                        <View className="flex-row justify-between items-center mb-1.5">
                          <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                            Serving Multiplier:
                          </Text>
                          <Text className="text-xs font-black text-accent dark:text-accent-dark">
                            {photoPortionMultiplier}x
                          </Text>
                        </View>
                        <View className="flex-row gap-1.5">
                          {[0.5, 1.0, 1.5, 2.0].map((mult) => {
                            const isSelected = photoPortionMultiplier === mult;
                            return (
                              <TouchableOpacity
                                key={mult}
                                activeOpacity={0.7}
                                onPress={() => handlePhotoPortionMultiplierChange(mult)}
                                className={`flex-1 py-1 rounded-lg items-center justify-center border ${
                                  isSelected
                                    ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${
                                    isSelected
                                      ? 'text-white font-black'
                                      : 'text-text-primary dark:text-text-primary-dark'
                                  }`}
                                >
                                  {mult}x
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Food Name Input */}
                      <View className="mb-2.5">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1">
                          Food / Dish Name
                        </Text>
                        <TextInput
                          value={photoAnalysisResult.foodName}
                          onChangeText={(val) =>
                            setPhotoAnalysisResult((prev) => (prev ? { ...prev, foodName: val } : null))
                          }
                          placeholder="e.g. Grilled Chicken Breast"
                          placeholderTextColor={colors.textMuted}
                          className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-text-primary dark:text-text-primary-dark font-bold text-sm border border-input-border dark:border-input-border-dark"
                        />
                      </View>

                      {/* Portion & Calories Inputs */}
                      <View className="flex-row gap-2 mb-2.5">
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1">
                            Portion / Serving
                          </Text>
                          <TextInput
                            value={photoAnalysisResult.servingSize}
                            onChangeText={(val) =>
                              setPhotoAnalysisResult((prev) => (prev ? { ...prev, servingSize: val } : null))
                            }
                            placeholder="e.g. 1 bowl, 200g"
                            placeholderTextColor={colors.textMuted}
                            className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-text-primary dark:text-text-primary-dark font-medium text-xs border border-input-border dark:border-input-border-dark"
                          />
                        </View>
                        <View className="w-28">
                          <View className="flex-row items-center gap-1 mb-1">
                            <View className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            <Text
                              numberOfLines={1}
                              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider"
                            >
                              Calories
                            </Text>
                          </View>
                          <TextInput
                            value={String(photoAnalysisResult.calories ?? '')}
                            onChangeText={(val) =>
                              setPhotoAnalysisResult((prev) =>
                                prev ? { ...prev, calories: Number(val.replace(/[^0-9]/g, '')) || 0 } : null
                              )
                            }
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-orange-600 dark:text-orange-400 font-black text-sm text-right border border-orange-500/25 dark:border-orange-500/35"
                          />
                        </View>
                      </View>

                      {/* Macro Breakdown Inputs */}
                      <View className="flex-row justify-between gap-2 mb-2.5">
                        <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-emerald-500/25 dark:border-emerald-500/35 items-center">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <Text numberOfLines={1} className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              Protein
                            </Text>
                          </View>
                          <View className="flex-row items-baseline justify-center mt-0.5">
                            <TextInput
                              value={String(photoAnalysisResult.protein ?? '')}
                              onChangeText={(val) =>
                                setPhotoAnalysisResult((prev) =>
                                  prev ? { ...prev, protein: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                                )
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textMuted}
                              className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm text-center p-0"
                            />
                            <Text className="text-emerald-600/70 dark:text-emerald-400/70 text-[10px] ml-0.5 font-semibold">g</Text>
                          </View>
                        </View>

                        <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-sky-500/25 dark:border-sky-500/35 items-center">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            <Text numberOfLines={1} className="text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider">
                              Carbs
                            </Text>
                          </View>
                          <View className="flex-row items-baseline justify-center mt-0.5">
                            <TextInput
                              value={String(photoAnalysisResult.carbs ?? '')}
                              onChangeText={(val) =>
                                setPhotoAnalysisResult((prev) =>
                                  prev ? { ...prev, carbs: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                                )
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textMuted}
                              className="text-sky-600 dark:text-sky-400 font-extrabold text-sm text-center p-0"
                            />
                            <Text className="text-sky-600/70 dark:text-sky-400/70 text-[10px] ml-0.5 font-semibold">g</Text>
                          </View>
                        </View>

                        <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-purple-500/25 dark:border-purple-500/35 items-center">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <Text numberOfLines={1} className="text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                              Fat
                            </Text>
                          </View>
                          <View className="flex-row items-baseline justify-center mt-0.5">
                            <TextInput
                              value={String(photoAnalysisResult.fat ?? '')}
                              onChangeText={(val) =>
                                setPhotoAnalysisResult((prev) =>
                                  prev ? { ...prev, fat: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                                )
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textMuted}
                              className="text-purple-600 dark:text-purple-400 font-extrabold text-sm text-center p-0"
                            />
                            <Text className="text-purple-600/70 dark:text-purple-400/70 text-[10px] ml-0.5 font-semibold">g</Text>
                          </View>
                        </View>
                      </View>

                      {/* Secondary Nutrients */}
                      {(photoAnalysisResult.fiber !== undefined ||
                        photoAnalysisResult.sugar !== undefined ||
                        photoAnalysisResult.sodiumMg !== undefined ||
                        photoAnalysisResult.saturatedFat !== undefined) && (
                        <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                          <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                            Detailed Micronutrients & Fiber:
                          </Text>
                          <View className="flex-row flex-wrap justify-between gap-y-1">
                            {photoAnalysisResult.fiber !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Fiber:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {photoAnalysisResult.fiber}g
                                </Text>
                              </View>
                            )}
                            {photoAnalysisResult.sugar !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sugars:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {photoAnalysisResult.sugar}g
                                </Text>
                              </View>
                            )}
                            {photoAnalysisResult.sodiumMg !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sodium:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {photoAnalysisResult.sodiumMg}mg
                                </Text>
                              </View>
                            )}
                            {photoAnalysisResult.saturatedFat !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sat. Fat:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {photoAnalysisResult.saturatedFat}g
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* FDA Facts Modal Trigger */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowNutritionFactsModal(true)}
                        className="flex-row items-center justify-center p-2.5 rounded-xl border border-accent/40 dark:border-accent-dark/40 bg-accent/5 dark:bg-accent-dark/5 mb-3"
                      >
                        <Ionicons name="document-text-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                        <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                          View FDA-Style Nutrition Facts Label
                        </Text>
                      </TouchableOpacity>

                      {/* AI Health Tip */}
                      {photoAnalysisResult.healthNotes ? (
                        <View className="bg-surface/80 dark:bg-surface-dark/80 p-2.5 rounded-xl border border-input-border/60 dark:border-input-border-dark/60 mb-3">
                          <Text className="text-text-muted dark:text-text-muted-dark text-xs leading-4">
                            {photoAnalysisResult.healthNotes}
                          </Text>
                        </View>
                      ) : null}

                      {/* Confirm & Discard Action Buttons */}
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity
                          onPress={handleClearPhotoAnalysis}
                          activeOpacity={0.7}
                          className="flex-1 py-3.5 rounded-2xl items-center justify-center border border-input-border dark:border-input-border-dark bg-input/80 dark:bg-input-dark/80"
                        >
                          <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">
                            Discard
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleConfirmAndAddPhoto}
                          activeOpacity={0.8}
                          className="flex-[2] bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center shadow-sm"
                        >
                          <Text className="text-white font-bold text-sm tracking-wide">
                            + Add to {MEAL_LABELS[selectedMeal]}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* ========================================================================= */}
            {/* MODE 2: DESCRIBE MEAL VIEW (Dedicated Functions & State)                  */}
            {/* ========================================================================= */}
            {scanMode === 'describe' && (
              <View>
                <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.accent} />
                      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
                        What are you eating?
                      </Text>
                    </View>
                    {describeText.trim().length > 0 && (
                      <TouchableOpacity
                        onPress={() => setDescribeText('')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark">
                          Clear
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark p-3.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm min-h-[110px] leading-5"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="e.g. 1 bowl of chicken sinigang with kangkong, radish, and 1 cup of white rice. Plus a glass of unsweetened iced tea."
                    placeholderTextColor={colors.textMuted}
                    value={describeText}
                    onChangeText={setDescribeText}
                    editable={!describeLoading}
                  />

                  <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mt-2 leading-4">
                    💡 <Text className="font-bold">Tip:</Text> Mention portions (e.g. 1 bowl, 200g, 2 slices) and preparation methods (grilled, fried, boiled) for best accuracy.
                  </Text>
                </View>

                {/* Describe Scan Error Banner */}
                {describeScanError && (
                  <View className="mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text className="text-rose-500 dark:text-rose-400 font-extrabold text-sm">
                        {describeScanError.toLowerCase().includes('food') ? 'Not Recognized as Food' : 'Notice'}
                      </Text>
                    </View>
                    <Text className="text-text-primary dark:text-text-primary-dark text-xs leading-4 mb-2">
                      {describeScanError}
                    </Text>
                  </View>
                )}

                {/* Describe Analyze Action Button */}
                {!describeAnalysisResult && (
                  describeLoading ? (
                    <View className="mt-1 flex-row gap-2">
                      <View className="flex-1 bg-accent/90 dark:bg-accent-dark/90 py-3.5 px-3 rounded-xl items-center justify-center flex-row shadow-sm">
                        <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                        <Text numberOfLines={1} className="text-white font-bold text-xs flex-1 text-center">
                          {describeAnalysisPhase === 'analyzing'
                            ? 'Analyzing ingredients...'
                            : 'Calculating macros...'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          describeAbortControllerRef.current?.abort();
                          describeAbortControllerRef.current = null;
                          if (describePhaseTimerRef.current.t1) clearTimeout(describePhaseTimerRef.current.t1);
                          setDescribeLoading(false);
                        }}
                        activeOpacity={0.7}
                        className="bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 px-4 py-3.5 rounded-xl items-center justify-center"
                      >
                        <Text className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleAnalyzeDescription}
                      activeOpacity={0.8}
                      className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center justify-center flex-row shadow-sm mt-1"
                    >
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text className="text-white font-bold text-sm">
                        Calculate Nutrition with AI
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                {/* Describe Result Card */}
                {describeAnalysisResult && (() => {
                  const smartBadge = getSmartFoodBadge({
                    calories: describeAnalysisResult.calories,
                    protein: describeAnalysisResult.protein,
                    carbs: describeAnalysisResult.carbs,
                    fat: describeAnalysisResult.fat,
                    title: describeAnalysisResult.foodName,
                  });
                  const badgeStyles = getBadgeStyles(smartBadge.color);
                  const confPct =
                    describeAnalysisResult.confidenceScore !== undefined
                      ? Math.round(describeAnalysisResult.confidenceScore * 100)
                      : null;

                  return (
                    <View className="mt-3 p-4 bg-input dark:bg-input-dark rounded-2xl border border-accent/50 dark:border-accent-dark/50 shadow-xs">
                      {/* Result Header */}
                      <View className="flex-row justify-between items-center mb-2 flex-wrap gap-y-1">
                        <View className="flex-row items-center flex-1 mr-2">
                          <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                            Estimated Nutrition Breakdown
                          </Text>
                        </View>
                        {confPct !== null && (
                          <View
                            className={`px-2 py-0.5 rounded-full border ${
                              confPct >= 85
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : confPct >= 65
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-zinc-500/10 border-zinc-500/30'
                            }`}
                          >
                            <Text
                              className={`text-[9px] font-bold ${
                                confPct >= 85
                                  ? 'text-emerald-500 dark:text-emerald-400'
                                  : confPct >= 65
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-text-muted dark:text-text-muted-dark'
                              }`}
                            >
                              {confPct}% confidence
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Smart Badge & Dietary Flags */}
                      <View className="flex-row flex-wrap items-center gap-1.5 mb-2.5">
                        {smartBadge.badge ? (
                          <View className={`px-2.5 py-0.5 rounded-full border ${badgeStyles.container}`}>
                            <Text className={`text-[10px] font-bold ${badgeStyles.text}`}>
                              {smartBadge.badge}
                            </Text>
                          </View>
                        ) : null}
                        {(describeAnalysisResult.dietaryFlags || []).map((flag, idx) => (
                          <View
                            key={idx}
                            className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark"
                          >
                            <Text className="text-[10px] font-medium text-text-muted dark:text-text-muted-dark">
                              {flag}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Portion Multiplier Selector */}
                      <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                        <View className="flex-row justify-between items-center mb-1.5">
                          <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                            Serving Multiplier:
                          </Text>
                          <Text className="text-xs font-black text-accent dark:text-accent-dark">
                            {describePortionMultiplier}x
                          </Text>
                        </View>
                        <View className="flex-row gap-1.5">
                          {[0.5, 1.0, 1.5, 2.0].map((mult) => {
                            const isSelected = describePortionMultiplier === mult;
                            return (
                              <TouchableOpacity
                                key={mult}
                                activeOpacity={0.7}
                                onPress={() => handleDescribePortionMultiplierChange(mult)}
                                className={`flex-1 py-1 rounded-lg items-center justify-center border ${
                                  isSelected
                                    ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${
                                    isSelected
                                      ? 'text-white font-black'
                                      : 'text-text-primary dark:text-text-primary-dark'
                                  }`}
                                >
                                  {mult}x
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Food Name Input */}
                      <View className="mb-2.5">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1">
                          Food / Dish Name
                        </Text>
                        <TextInput
                          value={describeAnalysisResult.foodName}
                          onChangeText={(val) =>
                            setDescribeAnalysisResult((prev) => (prev ? { ...prev, foodName: val } : null))
                          }
                          placeholder="e.g. Chicken Sinigang with Rice"
                          placeholderTextColor={colors.textMuted}
                          className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-text-primary dark:text-text-primary-dark font-bold text-sm border border-input-border dark:border-input-border-dark"
                        />
                      </View>

                      {/* Portion & Calories Inputs */}
                      <View className="flex-row gap-2 mb-2.5">
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1">
                            Portion / Serving
                          </Text>
                          <TextInput
                            value={describeAnalysisResult.servingSize}
                            onChangeText={(val) =>
                              setDescribeAnalysisResult((prev) => (prev ? { ...prev, servingSize: val } : null))
                            }
                            placeholder="e.g. 1 bowl, 350g"
                            placeholderTextColor={colors.textMuted}
                            className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-text-primary dark:text-text-primary-dark font-medium text-xs border border-input-border dark:border-input-border-dark"
                          />
                        </View>
                        <View className="w-28">
                          <View className="flex-row items-center gap-1 mb-1">
                            <View className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            <Text
                              numberOfLines={1}
                              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider"
                            >
                              Calories
                            </Text>
                          </View>
                          <TextInput
                            value={String(describeAnalysisResult.calories ?? '')}
                            onChangeText={(val) =>
                              setDescribeAnalysisResult((prev) =>
                                prev ? { ...prev, calories: Number(val.replace(/[^0-9]/g, '')) || 0 } : null
                              )
                            }
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-orange-600 dark:text-orange-400 font-black text-sm text-right border border-orange-500/25 dark:border-orange-500/35"
                          />
                        </View>
                      </View>

                      {/* Macro Breakdown Inputs */}
                      <View className="flex-row justify-between gap-2 mb-2.5">
                        <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-emerald-500/25 dark:border-emerald-500/35 items-center">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <Text numberOfLines={1} className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              Protein
                            </Text>
                          </View>
                          <View className="flex-row items-baseline justify-center mt-0.5">
                            <TextInput
                              value={String(describeAnalysisResult.protein ?? '')}
                              onChangeText={(val) =>
                                setDescribeAnalysisResult((prev) =>
                                  prev ? { ...prev, protein: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                                )
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textMuted}
                              className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm text-center p-0"
                            />
                            <Text className="text-emerald-600/70 dark:text-emerald-400/70 text-[10px] ml-0.5 font-semibold">g</Text>
                          </View>
                        </View>

                        <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-sky-500/25 dark:border-sky-500/35 items-center">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            <Text numberOfLines={1} className="text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider">
                              Carbs
                            </Text>
                          </View>
                          <View className="flex-row items-baseline justify-center mt-0.5">
                            <TextInput
                              value={String(describeAnalysisResult.carbs ?? '')}
                              onChangeText={(val) =>
                                setDescribeAnalysisResult((prev) =>
                                  prev ? { ...prev, carbs: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                                )
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textMuted}
                              className="text-sky-600 dark:text-sky-400 font-extrabold text-sm text-center p-0"
                            />
                            <Text className="text-sky-600/70 dark:text-sky-400/70 text-[10px] ml-0.5 font-semibold">g</Text>
                          </View>
                        </View>

                        <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-purple-500/25 dark:border-purple-500/35 items-center">
                          <View className="flex-row items-center gap-1 mb-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <Text numberOfLines={1} className="text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                              Fat
                            </Text>
                          </View>
                          <View className="flex-row items-baseline justify-center mt-0.5">
                            <TextInput
                              value={String(describeAnalysisResult.fat ?? '')}
                              onChangeText={(val) =>
                                setDescribeAnalysisResult((prev) =>
                                  prev ? { ...prev, fat: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                                )
                              }
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textMuted}
                              className="text-purple-600 dark:text-purple-400 font-extrabold text-sm text-center p-0"
                            />
                            <Text className="text-purple-600/70 dark:text-purple-400/70 text-[10px] ml-0.5 font-semibold">g</Text>
                          </View>
                        </View>
                      </View>

                      {/* Secondary Nutrients */}
                      {(describeAnalysisResult.fiber !== undefined ||
                        describeAnalysisResult.sugar !== undefined ||
                        describeAnalysisResult.sodiumMg !== undefined ||
                        describeAnalysisResult.saturatedFat !== undefined) && (
                        <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                          <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                            Detailed Micronutrients & Fiber:
                          </Text>
                          <View className="flex-row flex-wrap justify-between gap-y-1">
                            {describeAnalysisResult.fiber !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Fiber:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {describeAnalysisResult.fiber}g
                                </Text>
                              </View>
                            )}
                            {describeAnalysisResult.sugar !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sugars:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {describeAnalysisResult.sugar}g
                                </Text>
                              </View>
                            )}
                            {describeAnalysisResult.sodiumMg !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sodium:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {describeAnalysisResult.sodiumMg}mg
                                </Text>
                              </View>
                            )}
                            {describeAnalysisResult.saturatedFat !== undefined && (
                              <View className="w-[48%] flex-row justify-between">
                                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sat. Fat:</Text>
                                <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                                  {describeAnalysisResult.saturatedFat}g
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* FDA Facts Modal Trigger */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowNutritionFactsModal(true)}
                        className="flex-row items-center justify-center p-2.5 rounded-xl border border-accent/40 dark:border-accent-dark/40 bg-accent/5 dark:bg-accent-dark/5 mb-3"
                      >
                        <Ionicons name="document-text-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                        <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                          View FDA-Style Nutrition Facts Label
                        </Text>
                      </TouchableOpacity>

                      {/* AI Health Tip */}
                      {describeAnalysisResult.healthNotes ? (
                        <View className="bg-surface/80 dark:bg-surface-dark/80 p-2.5 rounded-xl border border-input-border/60 dark:border-input-border-dark/60 mb-3">
                          <Text className="text-text-muted dark:text-text-muted-dark text-xs leading-4">
                            {describeAnalysisResult.healthNotes}
                          </Text>
                        </View>
                      ) : null}

                      {/* Confirm & Discard Action Buttons */}
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity
                          onPress={handleClearDescribeAnalysis}
                          activeOpacity={0.7}
                          className="flex-1 py-3.5 rounded-2xl items-center justify-center border border-input-border dark:border-input-border-dark bg-input/80 dark:bg-input-dark/80"
                        >
                          <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">
                            Discard
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleConfirmAndAddDescribe}
                          activeOpacity={0.8}
                          className="flex-[2] bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center shadow-sm"
                        >
                          <Text className="text-white font-bold text-sm tracking-wide">
                            + Add to {MEAL_LABELS[selectedMeal]}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Embedded Nutrition Facts Modal */}
      <NutritionFactsModal
        visible={showNutritionFactsModal}
        onClose={() => setShowNutritionFactsModal(false)}
        data={
          activeNutritionFactsResult
            ? {
                title: activeNutritionFactsResult.foodName || (scanMode === 'photo' ? 'Scanned Meal' : 'Described Meal'),
                subtitle: activeNutritionFactsResult.servingSize || '1 serving',
                servingSize: activeNutritionFactsResult.servingSize || '1 serving',
                calories: Number(activeNutritionFactsResult.calories) || 0,
                protein: Number(activeNutritionFactsResult.protein) || 0,
                carbs: Number(activeNutritionFactsResult.carbs) || 0,
                fat: Number(activeNutritionFactsResult.fat) || 0,
                fiber: activeNutritionFactsResult.fiber,
                sugar: activeNutritionFactsResult.sugar,
                sodiumMg: activeNutritionFactsResult.sodiumMg,
                saturatedFat: activeNutritionFactsResult.saturatedFat,
                dietaryFlags: activeNutritionFactsResult.dietaryFlags,
              }
            : null
        }
      />
    </Modal>
  );
}
