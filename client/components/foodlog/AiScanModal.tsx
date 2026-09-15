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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MealType, FoodLogItem, getSmartMealType, MEAL_LABELS, MEAL_GLYPHS, getSmartFoodBadge, getBadgeStyles } from './foodLogTypes';
import { analyzeMeal, MealAnalysisResult } from '../../api/ai';
import { useToast } from '../../context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import NutritionFactsModal from './NutritionFactsModal';

interface AiScanModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMealItem: (item: FoodLogItem) => void;
  initialMealType?: MealType;
  initialMode?: 'photo' | 'text';
}

export default function AiScanModal({
  visible,
  onClose,
  onAddMealItem,
  initialMealType,
  initialMode = 'photo',
}: AiScanModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showWarning, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>(initialMode);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType || getSmartMealType());
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResult | null>(null);
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set());
  const [showNutritionFactsModal, setShowNutritionFactsModal] = useState(false);

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
    setSelectedItemIndices(new Set());
    setShowNutritionFactsModal(false);
    setLoading(false);
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
            'Camera access is required to take photos of your meals.'
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
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      // On web desktop, prompt fallback to file picker
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
      showWarning('No Image', 'Please take or pick a photo of your meal first.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const res = await analyzeMeal({
        description: description.trim() || undefined,
        imageBase64: imageBase64 || undefined,
        mimeType: imageMimeType || 'image/jpeg',
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
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
      selectedItems.forEach((item, idx) => {
        const smartBadge = getSmartFoodBadge({
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          title: item.name,
        });

        const newItem: FoodLogItem = {
          id: `${Date.now()}-${idx}`,
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

        onAddMealItem(newItem);
      });
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
                {activeTab === 'photo' ? 'AI Photo Scanner' : 'Describe Your Meal'}
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                {activeTab === 'photo'
                  ? 'Take or select a photo of your plate for instant nutritional breakdown'
                  : 'Type what you ate in plain English for instant macro estimates'}
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          {/* Mode Switcher Tabs */}
          <View className="flex-row bg-input dark:bg-input-dark rounded-xl p-1 mb-3.5 border border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              onPress={() => {
                setActiveTab('photo');
                setAnalysisResult(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1.5 ${
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
                Photo Scanner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('text');
                setAnalysisResult(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1.5 ${
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
                Describe Meal
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {/* Meal Category Selector with Auto-Detection Badge */}
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
                      color={isSelected ? (colors.surface) : colors.textMuted}
                      style={{ marginBottom: 2 }}
                    />
                    <Text
                      className={`text-[10px] font-bold capitalize ${
                        isSelected
                          ? 'text-white dark:text-background-dark font-black'
                          : 'text-text-primary dark:text-text-primary-dark'
                      }`}
                    >
                      {MEAL_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Photo Mode Content */}
            {activeTab === 'photo' ? (
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
                      }}
                      className="absolute top-2 right-2 bg-black/70 px-3 py-1.5 rounded-full"
                    >
                      <Text className="text-white text-xs font-bold">Retake / Clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-6 mb-3 border border-dashed border-input-border dark:border-input-border-dark items-center justify-center">
                    <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-1 text-center">
                      Scan Meal
                    </Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[250px] leading-4">
                      Take a clear top-down photo of your food or select one from your gallery for instant nutritional recognition.
                    </Text>

                    <View className="flex-row gap-2.5">
                      <TouchableOpacity
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                        className="bg-accent dark:bg-accent-dark px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-xs"
                      >
                        <Ionicons name="camera" size={14} color={isDark ? colors.background : '#FFFFFF'} />
                        <Text className="text-background dark:text-background-dark font-extrabold text-xs">
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
                  placeholder="e.g. extra olive oil dressing, 2 eggs"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            ) : (
              /* Text Description Mode */
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

            {/* Analyze Action Button */}
            {!analysisResult && (
              <TouchableOpacity
                onPress={handleAnalyze}
                disabled={loading}
                activeOpacity={0.8}
                className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center justify-center flex-row shadow-sm mt-1"
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color={isDark ? colors.background : '#FFFFFF'} className="mr-2" />
                    <Text className="text-background dark:text-background-dark font-black text-sm">
                      Analyzing Meal...
                    </Text>
                  </>
                ) : (
                  <Text className="text-background dark:text-background-dark font-black text-sm">
                    Analyze Meal
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
              const confPct = analysisResult.confidenceScore !== undefined
                ? Math.round(analysisResult.confidenceScore * 100)
                : null;

              return (
                <View className="mt-3 p-4 bg-input dark:bg-input-dark rounded-2xl border border-accent/50 dark:border-accent-dark/50 shadow-xs">
                  {/* Header: Title, Confidence, Smart Badge */}
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                        AI Detection
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
                          className="text-purple-500 dark:text-purple-400 font-extrabold text-sm text-center p-0"
                        />
                        <Text className="text-text-muted dark:text-text-muted-dark text-[10px] ml-0.5">g</Text>
                      </View>
                    </View>
                  </View>

                  {/* Micronutrient Summary (Fiber, Sugar, Sodium, Saturated Fat) */}
                  {(analysisResult.fiber !== undefined ||
                    analysisResult.sugar !== undefined ||
                    analysisResult.sodiumMg !== undefined ||
                    analysisResult.saturatedFat !== undefined) && (
                    <View className="mb-2.5 p-2 bg-surface/70 dark:bg-surface-dark/70 rounded-xl border border-input-border/70 dark:border-input-border-dark/70">
                      <Text className="text-[9px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1 px-1">
                        Micronutrients
                      </Text>
                      <View className="flex-row justify-between">
                        <View className="items-center flex-1">
                          <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Fiber</Text>
                          <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                            {analysisResult.fiber ?? 0}g
                          </Text>
                        </View>
                        <View className="items-center flex-1">
                          <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Sugar</Text>
                          <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                            {analysisResult.sugar ?? 0}g
                          </Text>
                        </View>
                        <View className="items-center flex-1">
                          <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Sodium</Text>
                          <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                            {analysisResult.sodiumMg ?? 0}mg
                          </Text>
                        </View>
                        <View className="items-center flex-1">
                          <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Sat. Fat</Text>
                          <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                            {analysisResult.saturatedFat ?? 0}g
                          </Text>
                        </View>
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
                    className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center justify-center mt-1 shadow-sm"
                  >
                    <Text className="text-background dark:text-background-dark font-black text-xs uppercase tracking-wide">
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
