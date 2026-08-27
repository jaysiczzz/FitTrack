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
import { MealType, FoodLogItem, getSmartMealType, MEAL_LABELS, MEAL_ICONS } from './foodLogTypes';
import { analyzeMeal, MealAnalysisResult } from '../../api/ai';
import { useToast } from '../../context/ToastContext';

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
  const { showWarning, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>(initialMode);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType || getSmartMealType());
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResult | null>(null);

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
        Alert.alert('Camera Error', err.message || 'Could not launch camera on this device.');
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
      Alert.alert('Gallery Error', err.message || 'Could not select photo from library.');
    }
  };

  const handleAnalyze = async () => {
    if (activeTab === 'text' && !description.trim()) {
      showWarning('Empty Description', 'Please type what you ate to analyze it with Gemini AI.');
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
      } else {
        showWarning('AI Notice', 'Could not analyze meal. Please try again with a clearer image or description.');
      }
    } catch (err: any) {
      console.error('Analysis Error:', err);
      showError('AI Error', err.message || 'Failed to analyze meal with Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndAdd = () => {
    if (!analysisResult) return;

    let badge = 'Balanced';
    let badgeColor: 'green' | 'blue' | 'yellow' | 'purple' = 'blue';

    if (analysisResult.protein >= 25) {
      badge = '🟢 High Protein';
      badgeColor = 'green';
    } else if (analysisResult.calories <= 300) {
      badge = '🌱 Low Calorie';
      badgeColor = 'green';
    } else if (analysisResult.carbs >= 45) {
      badge = '⚡ High Energy';
      badgeColor = 'blue';
    } else if (analysisResult.fat >= 20) {
      badge = '🟡 Healthy Fats';
      badgeColor = 'yellow';
    }

    const newItem: FoodLogItem = {
      id: Date.now().toString(),
      mealType: selectedMeal,
      title: analysisResult.foodName,
      subtitle: `${analysisResult.servingSize} (${analysisResult.calories} kcal)`,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      carbs: analysisResult.carbs,
      fat: analysisResult.fat,
      goalBadge: badge,
      goalBadgeColor: badgeColor,
      healthNotes: analysisResult.healthNotes,
      imageUri: selectedImage || undefined,
    };

    onAddMealItem(newItem);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface dark:bg-surface-dark rounded-t-[28px] max-h-[92%] p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                AI Meal Scanner ✨
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                Scan photo or describe dish for Gemini AI nutritional breakdown
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center"
            >
              <Text className="text-text-primary dark:text-text-primary-dark font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View className="flex-row bg-input dark:bg-input-dark rounded-xl p-1 mb-3.5 border border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              onPress={() => {
                setActiveTab('photo');
                setAnalysisResult(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === 'photo' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'photo'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                📸 Photo Scanner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('text');
                setAnalysisResult(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === 'text' ? 'bg-surface dark:bg-surface-dark shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'text'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                ✍️ Text Description
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
                  ✨ Auto-selected by time
                </Text>
              </View>
            </View>

            <View className="flex-row gap-1.5 mb-3.5">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMeal(m)}
                  activeOpacity={0.8}
                  className={`flex-1 py-1.5 px-1 rounded-xl items-center border ${
                    selectedMeal === m
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text className="text-xs mb-0.5">{MEAL_ICONS[m]}</Text>
                  <Text
                    className={`text-[11px] font-bold capitalize ${
                      selectedMeal === m
                        ? 'text-background dark:text-background-dark font-black'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                  >
                    {MEAL_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
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
                  <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-6 mb-3 border-2 border-dashed border-accent/40 dark:border-accent-dark/40 items-center justify-center">
                    <Text className="text-4xl mb-2">📸</Text>
                    <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-1 text-center">
                      Scan Meal with Gemini AI
                    </Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[250px] leading-4">
                      Take a clear top-down photo of your food or select one from your gallery for instant nutritional recognition.
                    </Text>

                    <View className="flex-row gap-2.5">
                      <TouchableOpacity
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                        className="bg-accent dark:bg-accent-dark px-4 py-2.5 rounded-xl flex-row items-center shadow-xs"
                      >
                        <Text className="text-background dark:text-background-dark font-extrabold text-xs">
                          📷 Open Camera
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handlePickFromGallery}
                        activeOpacity={0.8}
                        className="bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark px-4 py-2.5 rounded-xl flex-row items-center shadow-xs"
                      >
                        <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs">
                          🖼️ Photo Library
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
                  placeholderTextColor="#8E8E93"
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
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark text-sm min-h-[90px]"
                  placeholder="e.g. 200g grilled salmon with 1 cup cooked brown rice and steamed broccoli"
                  placeholderTextColor="#8E8E93"
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
                className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center flex-row shadow-sm mt-1"
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#0B0F1A" className="mr-2" />
                    <Text className="text-background dark:text-background-dark font-black text-sm">
                      Gemini AI Analyzing Meal...
                    </Text>
                  </>
                ) : (
                  <Text className="text-background dark:text-background-dark font-black text-sm">
                    ✨ Analyze Meal with Gemini AI
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* AI Result Card */}
            {analysisResult && (
              <View className="mt-3 p-4 bg-input dark:bg-input-dark rounded-2xl border border-accent/50 dark:border-accent-dark/50 shadow-xs">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-2">
                    <Text className="text-text-primary dark:text-text-primary-dark font-black text-base">
                      {analysisResult.foodName}
                    </Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                      Estimated Portion: {analysisResult.servingSize}
                    </Text>
                  </View>
                  <View className="bg-accent/15 dark:bg-accent-dark/20 px-3 py-1 rounded-xl items-end">
                    <Text className="text-accent dark:text-accent-dark font-black text-base">
                      {analysisResult.calories}
                    </Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">kcal</Text>
                  </View>
                </View>

                {/* Macro Breakdown Pills */}
                <View className="flex-row justify-between gap-1.5 my-2.5">
                  <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                    <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">Protein</Text>
                    <Text className="text-emerald-500 dark:text-emerald-400 font-extrabold text-xs mt-0.5">
                      {analysisResult.protein}g
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                    <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">Carbs</Text>
                    <Text className="text-sky-500 dark:text-sky-400 font-extrabold text-xs mt-0.5">
                      {analysisResult.carbs}g
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface dark:bg-surface-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                    <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">Fat</Text>
                    <Text className="text-purple-500 dark:text-purple-400 font-extrabold text-xs mt-0.5">
                      {analysisResult.fat}g
                    </Text>
                  </View>
                </View>

                {/* AI Health Tip */}
                {analysisResult.healthNotes ? (
                  <View className="bg-surface/80 dark:bg-surface-dark/80 p-2.5 rounded-xl border border-input-border/60 dark:border-input-border-dark/60 mb-3 flex-row items-center">
                    <Text className="mr-1.5 text-xs">💡</Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-xs flex-1 leading-4">
                      {analysisResult.healthNotes}
                    </Text>
                  </View>
                ) : null}

                {/* Confirm Action Button */}
                <TouchableOpacity
                  onPress={handleConfirmAndAdd}
                  activeOpacity={0.8}
                  className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center mt-1 shadow-sm"
                >
                  <Text className="text-background dark:text-background-dark font-black text-xs uppercase tracking-wide">
                    + Add to {MEAL_ICONS[selectedMeal]} {MEAL_LABELS[selectedMeal]}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
