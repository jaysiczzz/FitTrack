import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
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
  MEAL_GLYPHS,
  FoodLogItem,
  getSmartFoodBadge,
  getBadgeStyles,
} from './foodLogTypes';
import {
  searchFoodsOnlineApi,
  getRecentLoggedFoods,
  saveFoodToRecentHistory,
} from '../../api/foodlog';
import { useThemeColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import FilterChip from '../ui/FilterChip';
import NutritionFactsModal from './NutritionFactsModal';

export type FilterCategory = 'ALL' | 'RECENT' | 'Protein' | 'Carbs' | 'Fats' | 'Fruits' | 'Vegetables' | 'Dairy' | 'Staples';

interface FoodLibraryTabProps {
  onAddFood: (item: FoodLogItem) => void;
  defaultMeal?: MealType;
  onSwitchToToday?: () => void;
}

export default function FoodLibraryTab({
  onAddFood,
  defaultMeal,
  onSwitchToToday,
}: FoodLibraryTabProps) {
  const { colors } = useThemeColors();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal || getSmartMealType());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

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
  const [showNutritionFacts, setShowNutritionFacts] = useState(false);

  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (defaultMeal) {
      setSelectedMeal(defaultMeal);
    }
  }, [defaultMeal]);

  useEffect(() => {
    getRecentLoggedFoods().then((list) => {
      setRecentFoods(list);
    });
  }, []);

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

  // Calculated scaled values for currently selected food
  const currentMacros = useMemo(() => {
    if (!selectedItem) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const numAmount = parseFloat(portionAmount) || 1;
    return scaleFoodMacros(selectedItem, numAmount, portionMode);
  }, [selectedItem, portionAmount, portionMode]);

  // Confirm logging selected food
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
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

    onAddFood(newLogItem);

    // Save to recent offline history
    saveFoodToRecentHistory(selectedItem);
    getRecentLoggedFoods().then((list) => {
      setRecentFoods(list);
    });

    setSessionAddedCount((prev) => prev + 1);
    setSelectedItem(null);
  };

  return (
    <View className="flex-1">
      {/* Session Added Banner (if items logged during this session) */}
      {sessionAddedCount > 0 && onSwitchToToday && (
        <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 rounded-2xl p-3 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {sessionAddedCount} food{sessionAddedCount === 1 ? '' : 's'} added to your day
            </Text>
          </View>
          <TouchableOpacity
            onPress={onSwitchToToday}
            activeOpacity={0.8}
            className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl"
          >
            <Text className="text-white font-bold text-xs">
              View Log →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 1. Add-To Meal Type Selector */}
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] tracking-wider font-bold uppercase">
            Log To Meal:
          </Text>
          <View className="bg-accent/15 dark:bg-accent-dark/25 px-2 py-0.5 rounded-full border border-accent/20">
            <Text className="text-accent dark:text-accent-dark text-[10px] font-extrabold">
              {MEAL_LABELS[selectedMeal]}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-1.5">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => {
            const isSelected = selectedMeal === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMeal(m)}
                activeOpacity={0.8}
                className={`flex-1 py-2 px-1 rounded-xl items-center justify-center border ${
                  isSelected
                    ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
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
      </View>

      {/* 2. Search Input */}
      <View className="flex-row items-center bg-input dark:bg-input-dark rounded-2xl border border-input-border dark:border-input-border-dark px-3.5 mb-3">
        <Ionicons name="search" size={17} color={colors.textMuted} className="mr-2" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search 100+ foods, brands, groceries..."
          placeholderTextColor={colors.textMuted}
          className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark"
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {isSearchingOnline ? (
          <ActivityIndicator size="small" color={colors.accent} className="ml-1" />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 3. Category Filter Chips */}
      <View className="mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {[
            { key: 'ALL', label: 'All Foods' },
            { key: 'RECENT', label: `Recent (${recentFoods.length})` },
            { key: 'Protein', label: 'Protein' },
            { key: 'Carbs', label: 'Carbs' },
            { key: 'Fats', label: 'Fats' },
            { key: 'Fruits', label: 'Fruits' },
            { key: 'Vegetables', label: 'Veggies' },
            { key: 'Dairy', label: 'Dairy' },
            { key: 'Staples', label: 'Quick Staples' },
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

      {/* 4. Food Items Catalog */}
      <View className="gap-2">
        {displayedItems.length === 0 ? (
          <View className="py-12 items-center justify-center">
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
                className={`bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3 border flex-row justify-between items-center ${
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
                  ) : item.icon ? (
                    <View className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark items-center justify-center mr-2.5 border border-input-border dark:border-input-border-dark">
                      <Text className="text-lg">{item.icon}</Text>
                    </View>
                  ) : null}

                  <View className="flex-1">
                    {/* Food Name on its own line */}
                    <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs mb-1" numberOfLines={1}>
                      {item.name}
                    </Text>

                    {/* Uniform Badges Row below name */}
                    <View className="flex-row items-center gap-1.5 flex-wrap mb-1">
                      <View className={`px-1.5 py-0.5 rounded-md border ${itemBadgeStyles.container}`}>
                        <Text className={`font-bold text-[8.5px] ${itemBadgeStyles.text}`}>
                          {itemBadge.badge}
                        </Text>
                      </View>
                      {item.brand && item.brand !== itemBadge.badge ? (
                        <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-1.5 py-0.5 rounded-md">
                          <Text className="text-text-muted dark:text-text-muted-dark font-medium text-[8px]" numberOfLines={1}>
                            {item.brand}
                          </Text>
                        </View>
                      ) : null}
                      {item.isOnlineResult ? (
                        <View className="bg-info/15 dark:bg-info-dark/25 border border-info/30 dark:border-info-dark/30 px-1.5 py-0.5 rounded-md">
                          <Text className="text-info dark:text-info-dark font-bold text-[8px]">
                            Grocery
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
                        {item.ingredients}
                      </Text>
                    ) : item.description ? (
                      <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mt-0.5" numberOfLines={1}>
                        {item.description}
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

                {/* Trailing Calorie Callout */}
                <View className="items-end pl-2">
                  <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
                    {item.calories}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-[9px] uppercase">
                    kcal
                  </Text>
                  <View className="mt-1 bg-accent/15 dark:bg-accent-dark/20 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      + Tune
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* 5. Interactive Portion Tuner Modal Sheet */}
      {selectedItem && (() => {
        const selectedBadge = getSmartFoodBadge(selectedItem);
        const selectedBadgeStyles = getBadgeStyles(selectedBadge.color);

        return (
          <Modal
            visible={Boolean(selectedItem)}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedItem(null)}
          >
            <View className="flex-1 bg-black/60 justify-end">
              <View className="bg-surface dark:bg-surface-dark rounded-t-3xl border-t border-input-border dark:border-input-border-dark p-5 max-h-[85%]">
                {/* Drag Handle Bar */}
                <View className="w-10 h-1 rounded-full bg-input-border dark:bg-input-border-dark self-center mb-3.5" />

                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-2 mb-1">
                        {selectedItem.icon ? <Text className="text-xl">{selectedItem.icon}</Text> : null}
                        <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-base flex-1" numberOfLines={1}>
                          {selectedItem.name}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5 flex-wrap mb-1">
                        <View className={`px-1.5 py-0.5 rounded-md border ${selectedBadgeStyles.container}`}>
                          <Text className={`font-bold text-[8.5px] ${selectedBadgeStyles.text}`}>
                            {selectedBadge.badge}
                          </Text>
                        </View>
                        {selectedItem.brand && selectedItem.brand !== selectedBadge.badge ? (
                          <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-1.5 py-0.5 rounded-md">
                            <Text className="text-text-muted dark:text-text-muted-dark font-medium text-[8px]" numberOfLines={1}>
                              {selectedItem.brand}
                            </Text>
                          </View>
                        ) : null}
                        {selectedItem.isOnlineResult ? (
                          <View className="bg-info/15 dark:bg-info-dark/25 border border-info/30 dark:border-info-dark/30 px-1.5 py-0.5 rounded-md">
                            <Text className="text-info dark:text-info-dark font-bold text-[8px]">
                              Grocery
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
                        Base: {selectedItem.servingSize} ({selectedItem.calories} kcal){selectedItem.fiber ? ` · ${selectedItem.fiber}g fiber` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setSelectedItem(null)}
                      className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-full border border-input-border dark:border-input-border-dark"
                    >
                      <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">✕ Close</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Portion Tuner Card */}
                  <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-4 border border-input-border dark:border-input-border-dark mb-4">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                      Adjust Portion Size
                    </Text>

                    {/* Mode Toggle (Grams vs Servings) */}
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="flex-row bg-surface dark:bg-surface-dark rounded-xl p-1 border border-input-border dark:border-input-border-dark">
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
                                  ? 'text-white font-black'
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
                                ? 'text-white font-black'
                                : 'text-text-muted dark:text-text-muted-dark'
                            }`}
                          >
                            Servings
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Amount Input */}
                      <View className="flex-1 flex-row items-center bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark px-3 py-1">
                        <TextInput
                          value={portionAmount}
                          onChangeText={setPortionAmount}
                          keyboardType="numeric"
                          className="flex-1 text-sm font-extrabold text-text-primary dark:text-text-primary-dark py-1"
                          selectTextOnFocus
                        />
                        <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                          {portionMode === 'grams' ? 'g' : selectedItem.servingUnit || 'serv'}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Multiplier Chips */}
                    <View className="flex-row gap-1.5">
                      {[
                        { label: '0.5x', mult: 0.5 },
                        { label: '1.0x', mult: 1.0 },
                        { label: '1.5x', mult: 1.5 },
                        { label: '2.0x', mult: 2.0 },
                      ].map((chip) => (
                        <TouchableOpacity
                          key={chip.label}
                          onPress={() => {
                            if (portionMode === 'grams') {
                              const base = selectedItem.servingWeightG || 100;
                              setPortionAmount(String(Math.round(base * chip.mult)));
                            } else {
                              setPortionAmount(String(chip.mult));
                            }
                          }}
                          className="flex-1 py-1 rounded-lg bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center"
                        >
                          <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark">
                            {chip.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Calculated Scaled Macros */}
                  <View className="bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-input-border dark:border-input-border-dark mb-4">
                    <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2">
                      Calculated Nutritional Value
                    </Text>

                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark">
                        {currentMacros.calories}{' '}
                        <Text className="text-sm font-normal text-text-muted dark:text-text-muted-dark">kcal</Text>
                      </Text>
                      <View className="bg-accent/10 dark:bg-accent-dark/15 px-2.5 py-1 rounded-full border border-accent/30">
                        <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                          {portionMode === 'grams' ? `${portionAmount}g` : `${portionAmount} serving(s)`}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <View className="flex-1 bg-input dark:bg-input-dark p-2.5 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                        <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">Protein</Text>
                        <Text className="text-sm font-black text-accent dark:text-accent-dark mt-0.5">
                          {currentMacros.protein}g
                        </Text>
                      </View>
                      <View className="flex-1 bg-input dark:bg-input-dark p-2.5 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                        <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">Carbs</Text>
                        <Text className="text-sm font-black text-info dark:text-info-dark mt-0.5">
                          {currentMacros.carbs}g
                        </Text>
                      </View>
                      <View className="flex-1 bg-input dark:bg-input-dark p-2.5 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                        <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">Fats</Text>
                        <Text className="text-sm font-black text-tertiary dark:text-tertiary-dark mt-0.5">
                          {currentMacros.fat}g
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* FDA Nutrition Facts Trigger */}
                  <TouchableOpacity
                    onPress={() => setShowNutritionFacts(true)}
                    className="flex-row items-center justify-center py-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark mb-4"
                  >
                    <Ionicons name="document-text-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                      View Full FDA-Style Nutrition Label
                    </Text>
                  </TouchableOpacity>

                  {/* Log Button */}
                  <TouchableOpacity
                    onPress={handleConfirmLog}
                    activeOpacity={0.8}
                    className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center mb-2"
                  >
                    <Text className="text-white font-bold text-sm tracking-wide">
                      + Add to {MEAL_LABELS[selectedMeal]} ({currentMacros.calories} kcal)
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* FDA Nutrition Facts Modal */}
      <NutritionFactsModal
        visible={showNutritionFacts}
        onClose={() => setShowNutritionFacts(false)}
        data={
          selectedItem
            ? {
                title: selectedItem.name,
                subtitle: selectedItem.brand,
                servingSize:
                  portionMode === 'grams'
                    ? `${portionAmount}g`
                    : `${portionAmount} ${selectedItem.servingUnit || 'serving'}${parseFloat(portionAmount) > 1 ? 's' : ''}`,
                calories: currentMacros.calories,
                protein: currentMacros.protein,
                carbs: currentMacros.carbs,
                fat: currentMacros.fat,
                fiber: selectedItem.fiber
                  ? Math.round(
                      (selectedItem.fiber * (currentMacros.calories / (selectedItem.calories || 1))) * 10
                    ) / 10
                  : undefined,
              }
            : null
        }
      />
    </View>
  );
}
