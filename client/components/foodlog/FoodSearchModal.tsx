import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  FoodCatalogItem,
  COMMON_FOODS_CATALOG,
  scaleFoodMacros,
} from '../../data/commonFoods';
import {
  MealType,
  getSmartMealType,
  MEAL_LABELS,
  MEAL_ICONS,
  FoodLogItem,
  getSmartFoodBadge,
  getBadgeStyles,
} from './foodLogTypes';
import {
  searchFoodsOnlineApi,
  getRecentLoggedFoods,
  saveFoodToRecentHistory,
} from '../../api/foodlog';
import { COLORS } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import FilterChip from '../ui/FilterChip';
import InModalToast from '../ui/InModalToast';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (item: FoodLogItem) => void;
  defaultMeal?: MealType;
  initialCategory?: FilterCategory;
}

export type FilterCategory = 'ALL' | 'RECENT' | 'Protein' | 'Carbs' | 'Fats' | 'Fruits' | 'Vegetables' | 'Dairy' | 'Staples';

export default function FoodSearchModal({
  visible,
  onClose,
  onAddFood,
  defaultMeal,
  initialCategory = 'ALL',
}: FoodSearchModalProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal || getSmartMealType());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(initialCategory);

  // Online search state
  const [onlineResults, setOnlineResults] = useState<FoodCatalogItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Recent foods state
  const [recentFoods, setRecentFoods] = useState<FoodCatalogItem[]>([]);

  // Selected item for portion tuner
  const [selectedItem, setSelectedItem] = useState<FoodCatalogItem | null>(null);
  const [portionMode, setPortionMode] = useState<'grams' | 'servings'>('grams');
  const [portionAmount, setPortionAmount] = useState<string>('100');
  const [sessionAddedCount, setSessionAddedCount] = useState(0);
  const [inModalToast, setInModalToast] = useState<{
    message: string;
    description?: string;
    icon?: string;
  } | null>(null);

  const debounceTimerRef = useRef<any>(null);

  // Load recent foods whenever modal opens
  useEffect(() => {
    if (visible) {
      setSelectedMeal(defaultMeal || getSmartMealType());
      setSelectedItem(null);
      setSearchQuery('');
      setActiveCategory(initialCategory || 'ALL');
      setSessionAddedCount(0);
      setInModalToast(null);
      getRecentLoggedFoods().then((list) => {
        setRecentFoods(list);
      });
    }
  }, [visible, defaultMeal, initialCategory]);

  // Handle live search with debounced online query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await searchFoodsOnlineApi(searchQuery.trim());
        if (res.success && Array.isArray(res.foods)) {
          setOnlineResults(res.foods);
        }
      } catch {
        // Offline fallback is silent
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  // Combine and filter items based on category and search
  const displayedItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (activeCategory === 'RECENT') {
      if (!q) return recentFoods;
      return recentFoods.filter((f) =>
        f.name.toLowerCase().includes(q) ||
        (f.keywords && f.keywords.some((k) => k.toLowerCase().includes(q)))
      );
    }

    const allCatalog = COMMON_FOODS_CATALOG;

    // Local items filtering
    let localMatches = allCatalog.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const nameMatch = item.name.toLowerCase().includes(q);
      const categoryMatch = item.category.toLowerCase().includes(q);
      const brandMatch = item.brand ? item.brand.toLowerCase().includes(q) : false;
      const keywordMatch = item.keywords && item.keywords.some((k) => k.toLowerCase().includes(q));
      return nameMatch || categoryMatch || brandMatch || keywordMatch;
    });

    // If typing a search, merge with online results (avoiding duplicates by name)
    if (q) {
      const existingNames = new Set(localMatches.map((m) => m.name.toLowerCase()));
      const uniqueOnline = onlineResults.filter((o) => !existingNames.has(o.name.toLowerCase()));
      return [...localMatches, ...uniqueOnline];
    }

    return localMatches;
  }, [searchQuery, activeCategory, recentFoods, onlineResults]);

  // Select item to adjust portions
  const handleSelectItem = (item: FoodCatalogItem) => {
    setSelectedItem(item);
    if (item.category === 'Staples' || !item.servingWeightG || item.servingWeightG <= 0) {
      setPortionMode('servings');
      setPortionAmount('1');
    } else {
      setPortionMode('grams');
      setPortionAmount(String(item.servingWeightG));
    }
  };

  // Calculated scaled values for the currently tuned item
  const currentMacros = useMemo(() => {
    if (!selectedItem) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const numAmount = parseFloat(portionAmount) || 1;
    return scaleFoodMacros(selectedItem, numAmount, portionMode);
  }, [selectedItem, portionAmount, portionMode]);

  // Confirm logging the selected item
  const handleConfirmLog = () => {
    if (!selectedItem) return;

    const numAmount = parseFloat(portionAmount) || 1;
    const portionDesc =
      selectedItem.category === 'Staples'
        ? numAmount === 1
          ? selectedItem.servingSize
          : `${numAmount}x · ${selectedItem.servingSize}`
        : portionMode === 'grams'
        ? `${numAmount}g`
        : `${numAmount} ${selectedItem.servingUnit || 'serving'}`;

    const displaySubtitle = selectedItem.ingredients
      ? `${portionDesc} · ${selectedItem.ingredients}`
      : selectedItem.description
      ? `${portionDesc} · ${selectedItem.description}`
      : portionDesc;

    const smartBadge = getSmartFoodBadge({
      calories: currentMacros.calories,
      protein: currentMacros.protein,
      carbs: currentMacros.carbs,
      fat: currentMacros.fat,
      fiber: selectedItem.fiber,
      category: selectedItem.category,
      brand: selectedItem.brand,
      name: selectedItem.name,
    });

    const newLogItem: FoodLogItem = {
      id: Date.now().toString(),
      mealType: selectedMeal,
      title: selectedItem.name,
      subtitle: displaySubtitle,
      calories: currentMacros.calories,
      protein: currentMacros.protein,
      carbs: currentMacros.carbs,
      fat: currentMacros.fat,
      goalBadge: smartBadge.badge,
      goalBadgeColor: smartBadge.color,
      icon: selectedItem.icon,
      imageUri: selectedItem.imageUri,
    };

    // Commit item to meal
    onAddFood(newLogItem);

    // Save item to recent offline history
    saveFoodToRecentHistory(selectedItem);
    getRecentLoggedFoods().then((list) => {
      setRecentFoods(list);
    });

    setSessionAddedCount((prev) => prev + 1);
    setInModalToast({
      message: `Added ${selectedItem.name}`,
      description: `${currentMacros.calories} kcal · ${currentMacros.protein}g Protein to ${MEAL_LABELS[selectedMeal] || selectedMeal}`,
      icon: selectedItem.icon || '✓',
    });
    setSelectedItem(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-surface dark:bg-surface-dark">
        <View className="flex-1 p-4 relative">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                Search & Log Food 🥗
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                Popular fitness staples, healthy meals & groceries
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {sessionAddedCount > 0 && (
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl shadow-xs"
                >
                  <Text className="text-background dark:text-background-dark font-extrabold text-xs">
                    Done ({sessionAddedCount})
                  </Text>
                </TouchableOpacity>
              )}
              <ModalCloseButton onClose={onClose} />
            </View>
          </View>

          {/* Add-To Meal Type Selector */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase">
                Add To Meal:
              </Text>
              <View className="bg-accent/15 dark:bg-accent-dark/25 px-2 py-0.5 rounded-full border border-accent/20">
                <Text className="text-accent dark:text-accent-dark text-[10px] font-extrabold">
                  ✨ Auto-selected by time
                </Text>
              </View>
            </View>

            <View className="flex-row gap-1.5">
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
          </View>

          {/* Search Input Bar */}
          <View className="mb-3">
            <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl px-3 border border-input-border dark:border-input-border-dark">
              <Text className="text-base mr-2">🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search chicken, oats, rice, brands..."
                placeholderTextColor={COLORS.textMuted.dark}
                className="flex-1 py-2 text-sm text-text-primary dark:text-text-primary-dark"
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {isSearchingOnline ? (
                <ActivityIndicator size="small" color={COLORS.accent.DEFAULT} className="ml-2" />
              ) : searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                  <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Category Filter Chips */}
          <View className="mb-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
              {[
                { key: 'ALL', label: 'All Foods' },
                { key: 'RECENT', label: `Recent (${recentFoods.length}) ⏱️` },
                { key: 'Protein', label: '🥩 Protein' },
                { key: 'Carbs', label: '🍚 Carbs' },
                { key: 'Fats', label: '🥑 Fats' },
                { key: 'Fruits', label: '🍎 Fruits' },
                { key: 'Vegetables', label: '🥦 Veggies' },
                { key: 'Dairy', label: '🥛 Dairy' },
                { key: 'Staples', label: '🥗 Quick Staples' },
              ].map((cat) => (
                <FilterChip
                  key={cat.key}
                  label={cat.label}
                  selected={activeCategory === cat.key}
                  onPress={() => setActiveCategory(cat.key as FilterCategory)}
                  className="mr-1.5"
                />
              ))}
            </ScrollView>
          </View>

          {/* Foods List */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {displayedItems.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <Text className="text-3xl mb-2">🍽️</Text>
                <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm text-center">
                  No Foods Found
                </Text>
                <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mt-1">
                  {searchQuery
                    ? `No matches for "${searchQuery}". Check spelling or try a broader term.`
                    : 'No items in this category.'}
                </Text>
              </View>
            ) : (
              displayedItems.map((item, idx) => {
              const itemBadge = getSmartFoodBadge(item);
              const itemBadgeStyles = getBadgeStyles(itemBadge.color);

              return (
                <TouchableOpacity
                  key={`${item.id}-${idx}`}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.8}
                  className={`bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3 mb-2 border flex-row justify-between items-center ${
                    selectedItem?.id === item.id
                      ? 'border-accent dark:border-accent-dark bg-accent/5'
                      : 'border-input-border/70 dark:border-input-border-dark/70'
                  }`}
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        className="w-10 h-10 rounded-xl mr-2.5 bg-black/10"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark items-center justify-center mr-2.5 border border-input-border dark:border-input-border-dark">
                        <Text className="text-lg">{item.icon || '🥗'}</Text>
                      </View>
                    )}

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs">
                          {item.name}
                        </Text>
                        <View className={`px-1.5 py-0.5 rounded-md border ${itemBadgeStyles.container}`}>
                          <Text className={`font-bold text-[8.5px] ${itemBadgeStyles.text}`}>
                            {itemBadge.badge}
                          </Text>
                        </View>
                        {item.brand && item.brand !== itemBadge.badge ? (
                          <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-1.5 py-0.5 rounded-md">
                            <Text className="text-text-muted dark:text-text-muted-dark font-medium text-[8px]" numberOfLines={1}>
                              🏷️ {item.brand}
                            </Text>
                          </View>
                        ) : null}
                        {item.isOnlineResult ? (
                          <View className="bg-info/15 dark:bg-info-dark/25 border border-info/30 dark:border-info-dark/30 px-1.5 py-0.5 rounded-md">
                            <Text className="text-info dark:text-info-dark font-bold text-[8px]">
                              🌐 Grocery
                            </Text>
                          </View>
                        ) : null}
                        {item.isVerified ? (
                          <View className="bg-accent/15 dark:bg-accent-dark/25 border border-accent/30 dark:border-accent-dark/30 px-1.5 py-0.5 rounded-md">
                            <Text className="text-accent dark:text-accent-dark font-bold text-[8px]">
                              ✓ Verified
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {item.ingredients ? (
                        <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mt-0.5" numberOfLines={1}>
                          🥗 {item.ingredients}
                        </Text>
                      ) : item.description ? (
                        <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mt-0.5" numberOfLines={1}>
                          ℹ️ {item.description}
                        </Text>
                      ) : null}

                      <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mt-0.5 mb-1">
                        Per {item.servingSize}
                      </Text>

                      <View className="flex-row gap-1">
                        <View className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded border border-input-border dark:border-input-border-dark">
                          <Text className="text-[9px] font-bold text-accent dark:text-accent-dark">
                            {item.protein}g P
                          </Text>
                        </View>
                        <View className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded border border-input-border dark:border-input-border-dark">
                          <Text className="text-[9px] font-bold text-info dark:text-info-dark">
                            {item.carbs}g C
                          </Text>
                        </View>
                        <View className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded border border-input-border dark:border-input-border-dark">
                          <Text className="text-[9px] font-bold text-tertiary dark:text-tertiary-dark">
                            {item.fat}g F
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="items-end justify-center">
                    <Text className="text-accent dark:text-accent-dark font-black text-sm">
                      {item.calories}
                    </Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-[9px] mb-1.5">kcal</Text>
                    <View className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1 rounded-lg">
                      <Text className="text-accent dark:text-accent-dark font-extrabold text-[10px]">
                        + Select
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
            )}
          </ScrollView>

          {/* Item Details / Portion Tuner Sheet (Overlay when an item is selected) */}
          {selectedItem && (() => {
            const selectedBadge = getSmartFoodBadge(selectedItem);
            const selectedBadgeStyles = getBadgeStyles(selectedBadge.color);
            return (
              <View className="absolute inset-0 bg-black/60 justify-end z-50">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setSelectedItem(null)}
                  className="flex-1"
                />
                <View
                  className="bg-surface dark:bg-surface-dark p-5 rounded-t-3xl border-t border-input-border dark:border-input-border-dark shadow-2xl max-h-[85%]"
                  style={Platform.select({
                    web: { boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)' } as any,
                    default: { elevation: 10 },
                  })}
                >
                  {/* Drag Handle Bar */}
                  <View className="w-10 h-1 rounded-full bg-input-border dark:bg-input-border-dark self-center mb-3.5" />

                  <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text className="text-xl">{selectedItem.icon}</Text>
                          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-base" numberOfLines={1}>
                            {selectedItem.name}
                          </Text>
                          <View className={`px-1.5 py-0.5 rounded-md border ${selectedBadgeStyles.container}`}>
                            <Text className={`font-bold text-[8.5px] ${selectedBadgeStyles.text}`}>
                              {selectedBadge.badge}
                            </Text>
                          </View>
                          {selectedItem.brand && selectedItem.brand !== selectedBadge.badge ? (
                            <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-1.5 py-0.5 rounded-md">
                              <Text className="text-text-muted dark:text-text-muted-dark font-medium text-[8px]" numberOfLines={1}>
                                🏷️ {selectedItem.brand}
                              </Text>
                            </View>
                          ) : null}
                          {selectedItem.isOnlineResult ? (
                            <View className="bg-info/15 dark:bg-info-dark/25 border border-info/30 dark:border-info-dark/30 px-1.5 py-0.5 rounded-md">
                              <Text className="text-info dark:text-info-dark font-bold text-[8px]">
                                🌐 Grocery
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
                          Base: {selectedItem.servingSize} ({selectedItem.calories} kcal){selectedItem.fiber ? ` · ${selectedItem.fiber}g fiber` : ''}
                        </Text>
                        {Boolean(selectedItem.ingredients) && (
                          <Text className="text-accent dark:text-accent-dark text-[11px] font-medium mt-1 leading-tight" numberOfLines={2}>
                            🥗 {selectedItem.ingredients}
                          </Text>
                        )}
                        {Boolean(selectedItem.description && !selectedItem.ingredients) && (
                          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mt-1 leading-tight" numberOfLines={2}>
                            ℹ️ {selectedItem.description}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => setSelectedItem(null)}
                        className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-full border border-input-border dark:border-input-border-dark"
                      >
                        <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">✕ Close</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Amount Tuner */}
                    <View className="flex-row items-center gap-2 mb-3 mt-1">
                      <View className="flex-row bg-input dark:bg-input-dark rounded-xl p-0.5 border border-input-border dark:border-input-border-dark shrink-0">
                        {Boolean(selectedItem.servingWeightG && selectedItem.servingWeightG > 0) && (
                          <TouchableOpacity
                            onPress={() => {
                              setPortionMode('grams');
                              setPortionAmount(String(selectedItem.servingWeightG || 100));
                            }}
                            className={`px-2.5 py-1.5 rounded-lg ${
                              portionMode === 'grams' ? 'bg-accent dark:bg-accent-dark' : ''
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                portionMode === 'grams'
                                  ? 'text-background dark:text-background-dark font-black'
                                  : 'text-text-muted dark:text-text-muted-dark'
                              }`}
                            >
                              Grams
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            setPortionMode('servings');
                            setPortionAmount('1');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg ${
                            portionMode === 'servings' ? 'bg-accent dark:bg-accent-dark' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              portionMode === 'servings'
                                ? 'text-background dark:text-background-dark font-black'
                                : 'text-text-muted dark:text-text-muted-dark'
                            }`}
                          >
                            Servings
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Amount Input */}
                      <View className="flex-1 min-w-0 flex-row items-center justify-between bg-input dark:bg-input-dark rounded-xl px-3 border border-input-border dark:border-input-border-dark overflow-hidden">
                        <TextInput
                          value={portionAmount}
                          onChangeText={setPortionAmount}
                          keyboardType="numeric"
                          className="flex-1 min-w-0 py-1.5 text-sm font-black text-text-primary dark:text-text-primary-dark"
                          style={Platform.select({
                            web: { outlineStyle: 'none', minWidth: 0 } as any,
                            default: { minWidth: 0 },
                          })}
                        />
                        <Text
                          className="text-text-muted dark:text-text-muted-dark text-xs font-bold shrink-0 ml-1.5"
                          numberOfLines={1}
                        >
                          {portionMode === 'grams'
                            ? 'g'
                            : selectedItem.servingUnit
                            ? (selectedItem.servingUnit.length > 8 ? selectedItem.servingUnit.slice(0, 7) + '…' : selectedItem.servingUnit)
                            : 'serving'}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Amount Chips */}
                    <View className="flex-row gap-1.5 mb-3">
                      {(portionMode === 'grams' ? [50, 100, 150, 200, 250] : [0.5, 1, 1.5, 2, 3]).map((val) => (
                        <TouchableOpacity
                          key={val}
                          onPress={() => setPortionAmount(String(val))}
                          className={`flex-1 py-1.5 rounded-lg items-center border ${
                            portionAmount === String(val)
                              ? 'bg-accent/20 border-accent'
                              : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${
                              portionAmount === String(val)
                                ? 'text-accent dark:text-accent-dark font-black'
                                : 'text-text-muted dark:text-text-muted-dark'
                            }`}
                          >
                            {portionMode === 'grams' ? `${val}g` : `${val}x`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Scaled Macro Preview */}
                    <View className="flex-row justify-between items-center bg-input/50 dark:bg-input-dark/50 p-2.5 rounded-xl mb-3 border border-input-border/70 dark:border-input-border-dark/70">
                      <View className="items-center flex-1">
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Calories</Text>
                        <Text className="text-accent dark:text-accent-dark font-black text-sm">
                          {currentMacros.calories} kcal
                        </Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Protein</Text>
                        <Text className="text-emerald-500 dark:text-emerald-400 font-black text-sm">
                          {currentMacros.protein}g
                        </Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Carbs</Text>
                        <Text className="text-sky-500 dark:text-sky-400 font-black text-sm">
                          {currentMacros.carbs}g
                        </Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Fat</Text>
                        <Text className="text-purple-500 dark:text-purple-400 font-black text-sm">
                          {currentMacros.fat}g
                        </Text>
                      </View>
                    </View>

                    {/* Log Button */}
                    <TouchableOpacity
                      onPress={handleConfirmLog}
                      activeOpacity={0.8}
                      className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center shadow-xs mb-2"
                    >
                      <Text className="text-background dark:text-background-dark font-black text-xs uppercase tracking-wide">
                        + Add to {MEAL_LABELS[selectedMeal]} ({currentMacros.calories} kcal)
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            );
          })()}

          {/* In-Modal Toast Notification */}
          <InModalToast
            visible={Boolean(inModalToast)}
            message={inModalToast?.message || ''}
            description={inModalToast?.description}
            icon={inModalToast?.icon || '✓'}
            onDismiss={() => setInModalToast(null)}
            bottomOffset={20}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
