import React, { useState } from 'react';
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
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  MealType,
  FoodLogItem,
  getSmartMealType,
  MEAL_LABELS,
  MEAL_GLYPHS,
  getSmartFoodBadge,
  getBadgeStyles,
} from './foodLogTypes';
import { analyzeMeal, MealAnalysisResult } from '../../api/ai';
import { lookupFoodByBarcodeApi } from '../../api/foodlog';
import { useToast } from '../../context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import NutritionFactsModal from './NutritionFactsModal';

interface AiScanModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMealItem: (item: FoodLogItem | FoodLogItem[]) => void;
  initialMealType?: MealType;
  initialMode?: 'photo' | 'barcode' | 'text';
}

const SAMPLE_BARCODES = [
  { label: '🥣 Oats', code: '070501000108' },
  { label: '🥛 Greek Yogurt', code: '052159701007' },
  { label: '🍫 Protein Bar', code: '888849000011' },
  { label: '🥪 Whole Wheat', code: '073410013535' },
];

export default function AiScanModal({
  visible,
  onClose,
  onAddMealItem,
  initialMealType,
  initialMode = 'photo',
}: AiScanModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showWarning, showError, showSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<'photo' | 'barcode' | 'text'>(initialMode);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType || getSmartMealType());
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResult | null>(null);
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set());
  const [showNutritionFactsModal, setShowNutritionFactsModal] = useState(false);

  // Barcode specific state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Portion multiplier state
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [baseMacros, setBaseMacros] = useState<{
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

  React.useEffect(() => {
    if (visible) {
      setSelectedMeal(initialMealType || getSmartMealType());
      setActiveTab(initialMode);
    }
  }, [visible, initialMealType, initialMode]);

  const resetState = () => {
    setDescription('');
    setSelectedImage(null);
    setImageBase64(null);
    setImageMimeType('image/jpeg');
    setAnalysisResult(null);
    setBaseMacros(null);
    setPortionMultiplier(1.0);
    setBarcodeInput('');
    setSelectedItemIndices(new Set());
    setShowNutritionFactsModal(false);
    setLoading(false);
    setBarcodeLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMimeType(asset.mimeType || 'image/jpeg');
        setAnalysisResult(null);
        setBaseMacros(null);
        setPortionMultiplier(1.0);
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
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMimeType(asset.mimeType || 'image/jpeg');
        setAnalysisResult(null);
        setBaseMacros(null);
        setPortionMultiplier(1.0);
      }
    } catch (err: any) {
      console.error('Gallery Error:', err);
      Alert.alert('Gallery Error', 'Could not open photo library. Please check your permissions.');
    }
  };

  const handleAnalyze = async () => {
    if (activeTab === 'text' && !description.trim()) {
      showWarning('Description Needed', 'Please describe what you ate so we can analyze its nutrition.');
      return;
    }

    if (activeTab === 'photo' && !imageBase64 && !description.trim()) {
      showWarning('No Image', 'Please take or pick a photo of your meal or food package first.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setBaseMacros(null);
    setPortionMultiplier(1.0);

    try {
      const res = await analyzeMeal({
        description: description.trim() || undefined,
        imageBase64: imageBase64 || undefined,
        mimeType: imageMimeType || 'image/jpeg',
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
        setBaseMacros({
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
        setPortionMultiplier(1.0);

        if (res.data.items && res.data.items.length > 0) {
          setSelectedItemIndices(new Set(res.data.items.map((_, i) => i)));
        } else {
          setSelectedItemIndices(new Set());
        }
      } else {
        showWarning('Analysis Notice', 'Could not analyze meal. Please try again with a clearer image or description.');
      }
    } catch (err: any) {
      console.error('Analysis Error:', err);
      showError('Analysis Failed', 'Unable to analyze your meal right now. Please try again with a clearer photo or description.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupBarcode = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) {
      showWarning('Barcode Required', 'Please enter or scan a barcode number.');
      return;
    }

    setBarcodeLoading(true);
    Keyboard.dismiss();
    setAnalysisResult(null);
    setBaseMacros(null);
    setPortionMultiplier(1.0);

    try {
      const res = await lookupFoodByBarcodeApi(code);
      if (res.success && res.food) {
        const f = res.food;
        const result: MealAnalysisResult = {
          foodName: `${f.name}${f.brand ? ` (${f.brand})` : ''}`,
          servingSize: f.servingSize || '100g',
          calories: Number(f.calories) || 0,
          protein: Number(f.protein) || 0,
          carbs: Number(f.carbs) || 0,
          fat: Number(f.fat) || 0,
          fiber: f.fiber ? Number(f.fiber) : undefined,
          sugar: f.sugar ? Number(f.sugar) : undefined,
          sodiumMg: f.sodiumMg ? Number(f.sodiumMg) : undefined,
          saturatedFat: f.saturatedFat ? Number(f.saturatedFat) : undefined,
          confidenceScore: 0.99,
          dietaryFlags: f.isVerified ? ['Verified Product', 'Open Food Facts'] : ['Packaged Food'],
          healthNotes: f.ingredients ? `Ingredients: ${f.ingredients.slice(0, 140)}...` : 'Verified database nutrition profile.',
        };

        setAnalysisResult(result);
        setBaseMacros({
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber,
          sugar: result.sugar,
          sodiumMg: result.sodiumMg,
          saturatedFat: result.saturatedFat,
          servingSize: result.servingSize,
        });
        setPortionMultiplier(1.0);

        if (f.imageUri) {
          setSelectedImage(f.imageUri);
        }
        showSuccess('Product Found', `${result.foodName} matched.`);
      } else {
        showWarning(
          'Product Not Found',
          'Barcode not found in catalog. You can take a photo of the package/label or describe it instead.'
        );
      }
    } catch (err: any) {
      console.error('Barcode lookup error:', err);
      showError('Lookup Error', 'Could not query product barcode. Check your connection.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handlePortionMultiplierChange = (mult: number) => {
    if (!baseMacros || !analysisResult) return;
    setPortionMultiplier(mult);

    const scale = (val?: number) => (val !== undefined ? Math.round(val * mult * 10) / 10 : undefined);
    const scaleInt = (val?: number) => (val !== undefined ? Math.round(val * mult) : undefined);

    setAnalysisResult((prev) =>
      prev
        ? {
            ...prev,
            calories: scaleInt(baseMacros.calories) ?? 0,
            protein: scale(baseMacros.protein) ?? 0,
            carbs: scale(baseMacros.carbs) ?? 0,
            fat: scale(baseMacros.fat) ?? 0,
            fiber: scale(baseMacros.fiber),
            sugar: scale(baseMacros.sugar),
            sodiumMg: scaleInt(baseMacros.sodiumMg),
            saturatedFat: scale(baseMacros.saturatedFat),
            servingSize: mult === 1 ? baseMacros.servingSize : `${mult}x (${baseMacros.servingSize})`,
          }
        : null
    );
  };

  const handleToggleItem = (index: number) => {
    setSelectedItemIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      if (analysisResult?.items && analysisResult.items.length > 0) {
        const selected = analysisResult.items.filter((_, i) => next.has(i));
        if (selected.length > 0) {
          const sumCalories = selected.reduce((acc, it) => acc + (Number(it.calories) || 0), 0);
          const sumProtein = selected.reduce((acc, it) => acc + (Number(it.protein) || 0), 0);
          const sumCarbs = selected.reduce((acc, it) => acc + (Number(it.carbs) || 0), 0);
          const sumFat = selected.reduce((acc, it) => acc + (Number(it.fat) || 0), 0);
          const names = selected.map((it) => it.name).join(' + ');

          setAnalysisResult((prevRes) =>
            prevRes
              ? {
                  ...prevRes,
                  foodName: names,
                  calories: Math.round(sumCalories),
                  protein: Math.round(sumProtein * 10) / 10,
                  carbs: Math.round(sumCarbs * 10) / 10,
                  fat: Math.round(sumFat * 10) / 10,
                }
              : null
          );
        }
      }

      return next;
    });
  };

  const handleConfirmAndAdd = () => {
    if (!analysisResult) return;

    const hasMultiItems = analysisResult.items && analysisResult.items.length > 1;
    const selectedItems = hasMultiItems
      ? (analysisResult.items || []).filter((_, idx) => selectedItemIndices.has(idx))
      : [];

    if (hasMultiItems && selectedItems.length > 0) {
      // Multi-item logging: Log each individual component detected on the plate
      const itemsToAdd: FoodLogItem[] = selectedItems.map((item, idx) => {
        const smartBadge = getSmartFoodBadge({
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          title: item.name,
        });

        return {
          id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          mealType: selectedMeal,
          title: item.name,
          subtitle: item.servingSize || '1 serving',
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0,
          goalBadge: smartBadge.badge,
          goalBadgeColor: smartBadge.color,
          healthNotes: analysisResult.healthNotes,
          imageUri: selectedImage || undefined,
        };
      });

      onAddMealItem(itemsToAdd);
    } else {
      // Single meal or composite logging
      const smartBadge = getSmartFoodBadge({
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        title: analysisResult.foodName,
      });

      const newItem: FoodLogItem = {
        id: Date.now().toString(),
        mealType: selectedMeal,
        title: analysisResult.foodName || 'Scanned Meal',
        subtitle: analysisResult.servingSize || '1 serving',
        calories: Number(analysisResult.calories) || 0,
        protein: Number(analysisResult.protein) || 0,
        carbs: Number(analysisResult.carbs) || 0,
        fat: Number(analysisResult.fat) || 0,
        goalBadge: smartBadge.badge,
        goalBadgeColor: smartBadge.color,
        healthNotes: analysisResult.healthNotes,
        imageUri: selectedImage || undefined,
      };

      onAddMealItem(newItem);
    }

    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[92%] p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 pr-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                {activeTab === 'photo'
                  ? 'AI Photo Scanner'
                  : activeTab === 'barcode'
                  ? 'Barcode & Package Scanner'
                  : 'Describe Your Meal'}
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
                {activeTab === 'photo'
                  ? 'Snap a plate photo or nutrition label for instant nutrient breakdown'
                  : activeTab === 'barcode'
                  ? 'Scan barcode (UPC/EAN) or food packaging to pull verified macros'
                  : 'Type what you ate in plain English for instant macro estimates'}
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          {/* 3-Mode Switcher Tabs */}
          <View className="flex-row bg-input dark:bg-input-dark rounded-xl p-1 mb-3.5 border border-input-border dark:border-input-border-dark">
            {/* Photo Scanner */}
            <TouchableOpacity
              onPress={() => {
                setActiveTab('photo');
                setAnalysisResult(null);
                setBaseMacros(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1 ${
                activeTab === 'photo' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Ionicons
                name="camera"
                size={14}
                color={activeTab === 'photo' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'photo'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Photo
              </Text>
            </TouchableOpacity>

            {/* Barcode Scanner */}
            <TouchableOpacity
              onPress={() => {
                setActiveTab('barcode');
                setAnalysisResult(null);
                setBaseMacros(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1 ${
                activeTab === 'barcode' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Ionicons
                name="barcode-outline"
                size={15}
                color={activeTab === 'barcode' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'barcode'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Barcode
              </Text>
            </TouchableOpacity>

            {/* Text Description */}
            <TouchableOpacity
              onPress={() => {
                setActiveTab('text');
                setAnalysisResult(null);
                setBaseMacros(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1 ${
                activeTab === 'text' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Ionicons
                name="create"
                size={14}
                color={activeTab === 'text' ? colors.accent : colors.textMuted}
              />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'text'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Describe
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {/* Meal Category Selector */}
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase">
                Meal Category:
              </Text>
              <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-emerald-500 dark:text-emerald-400 text-[10px] font-extrabold">
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
                    className={`flex-1 py-1.5 px-1 rounded-xl items-center justify-center border ${
                      isSelected
                        ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Ionicons
                      name={MEAL_GLYPHS[m]}
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textMuted}
                      style={{ marginBottom: 2 }}
                    />
                    <Text
                      className={`text-[10px] font-bold capitalize ${
                        isSelected
                          ? 'text-white font-black'
                          : 'text-text-primary dark:text-text-primary-dark'
                      }`}
                    >
                      {MEAL_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TAB 1: Photo Mode Content */}
            {activeTab === 'photo' && (
              <View className="mb-3.5">
                {selectedImage ? (
                  <View className="relative rounded-2xl overflow-hidden mb-3 border border-input-border dark:border-input-border-dark">
                    <Image source={{ uri: selectedImage }} className="w-full h-48 bg-black/10" resizeMode="cover" />
                    <View className="absolute top-2 left-2 bg-black/70 px-2.5 py-1 rounded-full flex-row items-center">
                      <Text className="text-emerald-400 text-[10px] font-bold mr-1">●</Text>
                      <Text className="text-white text-[10px] font-bold">Photo Ready</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImage(null);
                        setImageBase64(null);
                        setAnalysisResult(null);
                        setBaseMacros(null);
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
                        className="bg-accent dark:bg-accent-dark px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-xs"
                      >
                        <Ionicons name="camera" size={14} color="#FFFFFF" />
                        <Text className="text-white font-bold text-xs">
                          Open Camera
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handlePickFromGallery}
                        activeOpacity={0.8}
                        className="bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-xs"
                      >
                        <Ionicons name="images" size={14} color={colors.textPrimary} />
                        <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs">
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
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            )}

            {/* TAB 2: Barcode & Package Scanner Mode */}
            {activeTab === 'barcode' && (
              <View className="mb-3.5">
                <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="barcode-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
                      Barcode & Package Scanner
                    </Text>
                  </View>
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-3 leading-4">
                    Enter any packaged product barcode (UPC / EAN) or snap a photo of its package or FDA nutrition label.
                  </Text>

                  {/* Barcode Input Row */}
                  <View className="flex-row gap-2 mb-3">
                    <View className="flex-1 bg-surface dark:bg-surface-dark rounded-xl px-3 py-1 border border-input-border dark:border-input-border-dark flex-row items-center">
                      <Ionicons name="search" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={barcodeInput}
                        onChangeText={setBarcodeInput}
                        placeholder="Enter barcode e.g. 070501000108"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        className="flex-1 text-text-primary dark:text-text-primary-dark text-xs py-2"
                        onSubmitEditing={() => handleLookupBarcode()}
                      />
                      {barcodeInput ? (
                        <TouchableOpacity onPress={() => setBarcodeInput('')}>
                          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleLookupBarcode()}
                      disabled={barcodeLoading || !barcodeInput.trim()}
                      className={`px-4 py-2.5 rounded-xl items-center justify-center flex-row ${
                        barcodeLoading || !barcodeInput.trim()
                          ? 'bg-accent/40 dark:bg-accent-dark/40'
                          : 'bg-accent dark:bg-accent-dark shadow-xs'
                      }`}
                    >
                      {barcodeLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-white font-bold text-xs">Lookup</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Sample Barcodes Quick Chips */}
                  <View className="mb-3">
                    <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                      Sample Packaged Items:
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {SAMPLE_BARCODES.map((item) => (
                        <TouchableOpacity
                          key={item.code}
                          activeOpacity={0.7}
                          onPress={() => {
                            setBarcodeInput(item.code);
                            handleLookupBarcode(item.code);
                          }}
                          className="bg-surface dark:bg-surface-dark px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark flex-row items-center"
                        >
                          <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Or Snap Photo of Package/Label */}
                  <View className="pt-2.5 border-t border-input-border/60 dark:border-input-border-dark/60">
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mb-2">
                      Or photograph the package / Nutrition Facts table:
                    </Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                        className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Ionicons name="camera" size={14} color={colors.accent} />
                        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
                          Snap Label
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handlePickFromGallery}
                        activeOpacity={0.8}
                        className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Ionicons name="images" size={14} color={colors.textPrimary} />
                        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
                          Pick Photo
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: Text Description Mode */}
            {activeTab === 'text' && (
              <View className="mb-3.5">
                <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-1.5">
                  Describe what you ate or drank:
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm min-h-[90px]"
                  placeholder="e.g. 200g grilled salmon with 1 cup cooked brown rice and steamed broccoli"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Analyze Action Button (for Photo and Text tabs) */}
            {!analysisResult && activeTab !== 'barcode' && (
              <TouchableOpacity
                onPress={handleAnalyze}
                disabled={loading}
                activeOpacity={0.8}
                className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center justify-center flex-row shadow-sm mt-1"
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                    <Text className="text-white font-bold text-sm">
                      Analyzing Nutrition...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white font-bold text-sm">
                    Analyze Nutrition
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* AI Result Card */}
            {analysisResult && (() => {
              const smartBadge = getSmartFoodBadge({
                calories: analysisResult.calories,
                protein: analysisResult.protein,
                carbs: analysisResult.carbs,
                fat: analysisResult.fat,
                title: analysisResult.foodName,
              });
              const badgeStyles = getBadgeStyles(smartBadge.color);
              const confPct =
                analysisResult.confidenceScore !== undefined
                  ? Math.round(analysisResult.confidenceScore * 100)
                  : null;

              return (
                <View className="mt-3 p-4 bg-input dark:bg-input-dark rounded-2xl border border-accent/50 dark:border-accent-dark/50 shadow-xs">
                  {/* Header: Title, Confidence, Smart Badge */}
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                        Nutrient Scan Result
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark ml-1.5">
                        (Tap to edit)
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
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
                      <View className={`px-2.5 py-0.5 rounded-full border ${badgeStyles.container}`}>
                        <Text className={`text-[10px] font-bold ${badgeStyles.text}`}>
                          {smartBadge.badge}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Dietary Flags */}
                  {analysisResult.dietaryFlags && analysisResult.dietaryFlags.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mb-2.5">
                      {analysisResult.dietaryFlags.map((flag, idx) => (
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
                  )}

                  {/* Multi-item Breakdown (if multiple items detected) */}
                  {analysisResult.items && analysisResult.items.length > 1 && (
                    <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                          Detected Plate Items ({selectedItemIndices.size}/{analysisResult.items.length})
                        </Text>
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          Tap to select
                        </Text>
                      </View>
                      <View className="gap-1.5">
                        {analysisResult.items.map((item, idx) => {
                          const isSelected = selectedItemIndices.has(idx);
                          return (
                            <TouchableOpacity
                              key={idx}
                              activeOpacity={0.7}
                              onPress={() => handleToggleItem(idx)}
                              className={`flex-row items-center justify-between p-2 rounded-lg border ${
                                isSelected
                                  ? 'bg-accent/5 dark:bg-accent-dark/5 border-accent/40 dark:border-accent-dark/40'
                                  : 'bg-input/50 dark:bg-input-dark/50 border-input-border dark:border-input-border-dark opacity-40'
                              }`}
                            >
                              <View className="flex-row items-center flex-1 pr-2">
                                <Ionicons
                                  name={isSelected ? 'checkbox' : 'square-outline'}
                                  size={18}
                                  color={isSelected ? colors.accent : colors.textMuted}
                                  style={{ marginRight: 6 }}
                                />
                                <View className="flex-1">
                                  <Text
                                    className="text-xs font-semibold text-text-primary dark:text-text-primary-dark"
                                    numberOfLines={1}
                                  >
                                    {item.name}
                                  </Text>
                                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                                    {item.servingSize}
                                  </Text>
                                </View>
                              </View>
                              <View className="items-end">
                                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                                  {item.calories} kcal
                                </Text>
                                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">
                                  {item.protein}P • {item.carbs}C • {item.fat}F
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Portion Multiplier Selector */}
                  <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                        Serving Multiplier:
                      </Text>
                      <Text className="text-xs font-black text-accent dark:text-accent-dark">
                        {portionMultiplier}x
                      </Text>
                    </View>
                    <View className="flex-row gap-1.5">
                      {[0.5, 1.0, 1.5, 2.0].map((mult) => {
                        const isSelected = portionMultiplier === mult;
                        return (
                          <TouchableOpacity
                            key={mult}
                            activeOpacity={0.7}
                            onPress={() => handlePortionMultiplierChange(mult)}
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
                      value={analysisResult.foodName}
                      onChangeText={(val) =>
                        setAnalysisResult((prev) => (prev ? { ...prev, foodName: val } : null))
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
                        value={analysisResult.servingSize}
                        onChangeText={(val) =>
                          setAnalysisResult((prev) => (prev ? { ...prev, servingSize: val } : null))
                        }
                        placeholder="e.g. 1 bowl, 200g"
                        placeholderTextColor={colors.textMuted}
                        className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-text-primary dark:text-text-primary-dark font-medium text-xs border border-input-border dark:border-input-border-dark"
                      />
                    </View>
                    <View className="w-28">
                      <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1">
                        Calories (kcal)
                      </Text>
                      <TextInput
                        value={String(analysisResult.calories ?? '')}
                        onChangeText={(val) =>
                          setAnalysisResult((prev) =>
                            prev ? { ...prev, calories: Number(val.replace(/[^0-9]/g, '')) || 0 } : null
                          )
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        className="bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl text-accent dark:text-accent-dark font-black text-sm text-right border border-input-border dark:border-input-border-dark"
                      />
                    </View>
                  </View>

                  {/* Macro Breakdown Inputs */}
                  <View className="flex-row justify-between gap-2 mb-2.5">
                    <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                      <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold">Protein</Text>
                      <View className="flex-row items-baseline justify-center mt-0.5">
                        <TextInput
                          value={String(analysisResult.protein ?? '')}
                          onChangeText={(val) =>
                            setAnalysisResult((prev) =>
                              prev ? { ...prev, protein: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                            )
                          }
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          className="text-emerald-500 dark:text-emerald-400 font-extrabold text-sm text-center p-0"
                        />
                        <Text className="text-text-muted dark:text-text-muted-dark text-[10px] ml-0.5">g</Text>
                      </View>
                    </View>
                    <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                      <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold">Carbs</Text>
                      <View className="flex-row items-baseline justify-center mt-0.5">
                        <TextInput
                          value={String(analysisResult.carbs ?? '')}
                          onChangeText={(val) =>
                            setAnalysisResult((prev) =>
                              prev ? { ...prev, carbs: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                            )
                          }
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          className="text-sky-500 dark:text-sky-400 font-extrabold text-sm text-center p-0"
                        />
                        <Text className="text-text-muted dark:text-text-muted-dark text-[10px] ml-0.5">g</Text>
                      </View>
                    </View>
                    <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                      <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold">Fat</Text>
                      <View className="flex-row items-baseline justify-center mt-0.5">
                        <TextInput
                          value={String(analysisResult.fat ?? '')}
                          onChangeText={(val) =>
                            setAnalysisResult((prev) =>
                              prev ? { ...prev, fat: Number(val.replace(/[^0-9.]/g, '')) || 0 } : null
                            )
                          }
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          className="text-amber-500 dark:text-amber-400 font-extrabold text-sm text-center p-0"
                        />
                        <Text className="text-text-muted dark:text-text-muted-dark text-[10px] ml-0.5">g</Text>
                      </View>
                    </View>
                  </View>

                  {/* Secondary Nutrients (Fiber, Sugar, Sodium, Sat Fat) */}
                  {(analysisResult.fiber !== undefined ||
                    analysisResult.sugar !== undefined ||
                    analysisResult.sodiumMg !== undefined ||
                    analysisResult.saturatedFat !== undefined) && (
                    <View className="mb-3 p-2.5 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                        Detailed Micronutrients & Fiber:
                      </Text>
                      <View className="flex-row flex-wrap justify-between gap-y-1">
                        {analysisResult.fiber !== undefined && (
                          <View className="w-[48%] flex-row justify-between">
                            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Fiber:</Text>
                            <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                              {analysisResult.fiber}g
                            </Text>
                          </View>
                        )}
                        {analysisResult.sugar !== undefined && (
                          <View className="w-[48%] flex-row justify-between">
                            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sugars:</Text>
                            <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                              {analysisResult.sugar}g
                            </Text>
                          </View>
                        )}
                        {analysisResult.sodiumMg !== undefined && (
                          <View className="w-[48%] flex-row justify-between">
                            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sodium:</Text>
                            <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                              {analysisResult.sodiumMg}mg
                            </Text>
                          </View>
                        )}
                        {analysisResult.saturatedFat !== undefined && (
                          <View className="w-[48%] flex-row justify-between">
                            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Sat. Fat:</Text>
                            <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                              {analysisResult.saturatedFat}g
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* FDA Nutrition Facts Modal Trigger */}
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
                  {analysisResult.healthNotes ? (
                    <View className="bg-surface/80 dark:bg-surface-dark/80 p-2.5 rounded-xl border border-input-border/60 dark:border-input-border-dark/60 mb-3">
                      <Text className="text-text-muted dark:text-text-muted-dark text-xs leading-4">
                        {analysisResult.healthNotes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Confirm Action Button */}
                  <TouchableOpacity
                    onPress={handleConfirmAndAdd}
                    activeOpacity={0.8}
                    className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center mt-1"
                  >
                    <Text className="text-white font-bold text-sm tracking-wide">
                      {analysisResult.items && analysisResult.items.length > 1
                        ? `+ Add ${selectedItemIndices.size} Item${selectedItemIndices.size === 1 ? '' : 's'} to ${MEAL_LABELS[selectedMeal]}`
                        : `+ Add to ${MEAL_LABELS[selectedMeal]}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </ScrollView>
        </View>
      </View>

      {/* Embedded Nutrition Facts Modal */}
      <NutritionFactsModal
        visible={showNutritionFactsModal}
        onClose={() => setShowNutritionFactsModal(false)}
        data={
          analysisResult
            ? {
                title: analysisResult.foodName || 'Scanned Meal',
                subtitle:
                  analysisResult.items && analysisResult.items.length > 1
                    ? `${analysisResult.items.length} plate items detected`
                    : undefined,
                servingSize: analysisResult.servingSize || '1 serving',
                calories: Number(analysisResult.calories) || 0,
                protein: Number(analysisResult.protein) || 0,
                carbs: Number(analysisResult.carbs) || 0,
                fat: Number(analysisResult.fat) || 0,
                fiber: analysisResult.fiber,
                sugar: analysisResult.sugar,
                sodiumMg: analysisResult.sodiumMg,
                saturatedFat: analysisResult.saturatedFat,
                dietaryFlags: analysisResult.dietaryFlags,
              }
            : null
        }
      />
    </Modal>
  );
}
