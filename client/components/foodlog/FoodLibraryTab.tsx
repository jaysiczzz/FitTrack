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
} from 'react-native';
import {
  FoodCatalogItem,
  COMMON_FOODS_CATALOG,
} from '../../data/commonFoods';
import {
  MealCombo,
  BALANCED_MEAL_COMBOS,
} from '../../data/mealCombos';
import {
  MealType,
  getSmartMealType,
  MEAL_LABELS,
  MEAL_GLYPHS,
  FoodLogItem,
  getSmartFoodBadge,
} from './foodLogTypes';
import {
  fetchOpenFoodFactsProducts,
  getRecentLoggedFoods,
  saveFoodToRecentHistory,
} from '../../api/foodlog';
import { useThemeColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import FilterChip from '../ui/FilterChip';
import MealComboDetailsModal from './MealComboDetailsModal';
import FoodDetailsInspectorModal from './FoodDetailsInspectorModal';

export type LibraryMode = 'combos' | 'search' | 'recent';
export type ComboFilter = 'ALL' | 'High Protein' | 'Fat Loss' | 'Post-Workout' | 'Clean Bulking' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FilterCategory = 'ALL' | 'RECENT' | 'Protein' | 'Carbs' | 'Fats' | 'Fruits' | 'Vegetables' | 'Dairy';

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
  const { colors, isDark } = useThemeColors();
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('combos');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal || getSmartMealType());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeComboFilter, setActiveComboFilter] = useState<ComboFilter>('ALL');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

  // Meal Combo Modal state
  const [selectedComboForDetails, setSelectedComboForDetails] = useState<MealCombo | null>(null);

  // Single Food Inspector state
  const [selectedFoodForInspection, setSelectedFoodForInspection] = useState<FoodCatalogItem | null>(null);

  // Open Food Facts online state
  const [offFoods, setOffFoods] = useState<FoodCatalogItem[]>([]);
  const [isLoadingOff, setIsLoadingOff] = useState(false);

  // Recent foods state
  const [recentFoods, setRecentFoods] = useState<FoodCatalogItem[]>([]);
  const [sessionAddedCount, setSessionAddedCount] = useState(0);

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

  // Fetch foods from Open Food Facts API when in 'search' mode
  useEffect(() => {
    if (libraryMode !== 'search') return;
    if (activeCategory === 'RECENT') {
      setIsLoadingOff(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const q = searchQuery.trim();
    const delay = q.length >= 2 ? 400 : 0;

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingOff(true);
      try {
        const results = await fetchOpenFoodFactsProducts(q, activeCategory);
        setOffFoods(results);
      } catch (err) {
        console.log('[FoodLibrary] Failed to fetch Open Food Facts:', err);
      } finally {
        setIsLoadingOff(false);
      }
    }, delay);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, activeCategory, libraryMode]);

  // Filtered Meal Combos
  const filteredCombos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return BALANCED_MEAL_COMBOS.filter((combo) => {
      // 1. Text Search Filter
      if (q) {
        const matchesTitle = combo.title.toLowerCase().includes(q);
        const matchesTagline = combo.tagline.toLowerCase().includes(q);
        const matchesTags = combo.tags.some((t) => t.toLowerCase().includes(q));
        const matchesIngredients = combo.ingredients.some((ing) => ing.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTagline && !matchesTags && !matchesIngredients) return false;
      }

      // 2. Goal / Meal Filter
      if (activeComboFilter !== 'ALL') {
        if (
          activeComboFilter === 'breakfast' ||
          activeComboFilter === 'lunch' ||
          activeComboFilter === 'dinner' ||
          activeComboFilter === 'snack'
        ) {
          if (combo.mealType !== activeComboFilter) return false;
        } else {
          if (combo.goal !== activeComboFilter) return false;
        }
      }

      return true;
    });
  }, [searchQuery, activeComboFilter]);

  // Combined single foods list for search mode (Verified Staples + Open Food Facts)
  const displayedFoods = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (libraryMode === 'recent' || activeCategory === 'RECENT') {
      if (!q) return recentFoods;
      return recentFoods.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.keywords && f.keywords.some((k) => k.toLowerCase().includes(q)))
      );
    }

    // 1. Filter local verified staples catalog
    const localFiltered = COMMON_FOODS_CATALOG.filter((f) => {
      if (activeCategory !== 'ALL' && f.category !== activeCategory) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        (f.keywords && f.keywords.some((k) => k.toLowerCase().includes(q))) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }).map((f) => ({
      ...f,
      isVerified: true,
      nutriscore: f.nutriscore || ('A' as const),
      novaGroup: f.novaGroup || (1 as const),
    }));

    // 2. Combine with Open Food Facts results, avoiding duplicate names
    const localNames = new Set(localFiltered.map((f) => f.name.toLowerCase()));
    const uniqueOff = offFoods.filter((f) => !localNames.has(f.name.toLowerCase()));

    return [...localFiltered, ...uniqueOff];
  }, [searchQuery, activeCategory, recentFoods, offFoods, libraryMode]);

  // 1-Tap Log entire Meal Combo
  const handleLogMealCombo = (combo: MealCombo, scale: number = 1.0, targetMeal?: MealType) => {
    const scaledCalories = Math.round(combo.calories * scale);
    const scaledProtein = Math.round(combo.protein * scale);
    const scaledCarbs = Math.round(combo.carbs * scale);
    const scaledFat = Math.round(combo.fat * scale);
    const meal = targetMeal || selectedMeal;

    const ingredientsSummary = combo.ingredients
      .map((i) => i.name.split('(')[0].trim())
      .join(' · ');

    const portionLabel = scale === 1.0 ? '1 serving' : `${scale}x portion`;

    const newLogItem: FoodLogItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mealType: meal,
      title: combo.title,
      subtitle: `${portionLabel} · ${ingredientsSummary}`,
      calories: scaledCalories,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fat: scaledFat,
      goalBadge: combo.goal,
      goalBadgeColor:
        combo.goal === 'High Protein'
          ? 'green'
          : combo.goal === 'Fat Loss'
          ? 'yellow'
          : combo.goal === 'Post-Workout'
          ? 'blue'
          : 'purple',
      icon: combo.icon,
    };

    onAddFood(newLogItem);
    setSessionAddedCount((prev) => prev + 1);
  };

  // Quick 1-tap add of standard single serving
  const handleQuickLogStandard = (food: FoodCatalogItem) => {
    const smartBadge = getSmartFoodBadge({
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      category: food.category,
      brand: food.brand,
      name: food.name,
    });

    const newLogItem: FoodLogItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mealType: selectedMeal,
      title: food.name,
      subtitle: food.brand ? `${food.servingSize} · ${food.brand}` : food.servingSize,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      goalBadge: smartBadge.badge,
      goalBadgeColor: smartBadge.color,
      icon: food.icon,
      imageUri: food.imageUri,
    };

    onAddFood(newLogItem);
    saveFoodToRecentHistory(food);
    getRecentLoggedFoods().then((list) => setRecentFoods(list));
    setSessionAddedCount((prev) => prev + 1);
  };

  return (
    <View className="flex-1">
      {/* Session Added Banner */}
      {sessionAddedCount > 0 && onSwitchToToday && (
        <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 rounded-2xl p-3 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {sessionAddedCount} item{sessionAddedCount === 1 ? '' : 's'} added to your day
            </Text>
          </View>
          <TouchableOpacity
            onPress={onSwitchToToday}
            activeOpacity={0.8}
            className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl"
          >
            <Text className="text-white font-bold text-xs">
              View Today's Log →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Segmented Mode Selector: Meal Combos vs Search vs Recents */}
      <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl border border-input-border dark:border-input-border-dark mb-3">
        {[
          { key: 'combos', label: 'Balanced Meal Combos', icon: 'restaurant-outline' as const },
          { key: 'search', label: 'Search All Foods', icon: 'search-outline' as const },
          { key: 'recent', label: `Recents (${recentFoods.length})`, icon: 'time-outline' as const },
        ].map((tab) => {
          const active = libraryMode === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setLibraryMode(tab.key as LibraryMode)}
              activeOpacity={0.8}
              className={`flex-1 py-2 px-1 rounded-xl items-center justify-center flex-row gap-1.5 ${
                active ? 'bg-accent dark:bg-accent-dark' : ''
              }`}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={active ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                numberOfLines={1}
                className={`text-[11px] font-extrabold ${
                  active ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Target Meal Type Selector: Log To Meal */}
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

      {/* Search Input Bar */}
      <View className="flex-row items-center bg-input dark:bg-input-dark rounded-2xl border border-input-border dark:border-input-border-dark px-3.5 mb-3">
        <Ionicons name="search" size={17} color={colors.textMuted} className="mr-2" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={
            libraryMode === 'combos'
              ? 'Search meal combos (chicken, salmon, oats, bowl)...'
              : 'Search verified staples (chicken, oats, eggs) & brands...'
          }
          placeholderTextColor={colors.textMuted}
          className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark font-medium"
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {isLoadingOff ? (
          <ActivityIndicator size="small" color={colors.accent} className="ml-1" />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ===================== MODE 1: BALANCED MEAL COMBOS ===================== */}
      {libraryMode === 'combos' && (
        <View>
          {/* Goal & Meal Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-3"
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {[
              { key: 'ALL', label: 'All Combos' },
              { key: 'High Protein', label: '🔥 High Protein' },
              { key: 'Fat Loss', label: '✂️ Fat Loss' },
              { key: 'Post-Workout', label: '⚡ Post-Workout' },
              { key: 'Clean Bulking', label: '💪 Clean Bulking' },
              { key: 'breakfast', label: '🌅 Breakfast' },
              { key: 'lunch', label: '☀️ Lunch' },
              { key: 'dinner', label: '🌙 Dinner' },
              { key: 'snack', label: '🍎 Snacks' },
            ].map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                selected={activeComboFilter === f.key}
                onPress={() => setActiveComboFilter(f.key as ComboFilter)}
                className="mr-1.5"
              />
            ))}
          </ScrollView>

          {/* Combos Count Header */}
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Curated Balanced Meals ({filteredCombos.length})
            </Text>
            <Text className="text-[11px] text-accent dark:text-accent-dark font-bold">
              1-Tap Macro Logging
            </Text>
          </View>

          {/* Combos Cards List */}
          {filteredCombos.length === 0 ? (
            <View className="p-8 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center my-2">
              <Ionicons name="search" size={26} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                No meal combos found
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1 text-center">
                Try searching for another ingredient like "chicken", "oats", or "salmon".
              </Text>
            </View>
          ) : (
            filteredCombos.map((combo) => {
              const totalMacroCals = combo.protein * 4 + combo.carbs * 4 + combo.fat * 9;
              const pPct = totalMacroCals > 0 ? Math.round(((combo.protein * 4) / totalMacroCals) * 100) : 0;
              const cPct = totalMacroCals > 0 ? Math.round(((combo.carbs * 4) / totalMacroCals) * 100) : 0;
              const fPct = totalMacroCals > 0 ? 100 - pPct - cPct : 0;

              const goalBadgeClass =
                combo.goal === 'High Protein'
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : combo.goal === 'Fat Loss'
                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                  : combo.goal === 'Post-Workout'
                  ? 'bg-sky-500/15 text-sky-500 border-sky-500/30'
                  : combo.goal === 'Clean Bulking'
                  ? 'bg-purple-500/15 text-purple-500 border-purple-500/30'
                  : 'bg-amber-500/15 text-amber-500 border-amber-500/30';

              return (
                <View
                  key={combo.id}
                  className="mb-3.5 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark p-4 shadow-sm"
                >
                  {/* Top Row: Icon, Title & Goal Badge */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="w-11 h-11 rounded-2xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark">
                        <Text className="text-xl">{combo.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-black text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                          {combo.title}
                        </Text>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark font-medium mt-0.5">
                          ⏱️ {combo.prepTimeMinutes} min • {combo.tagline}
                        </Text>
                      </View>
                    </View>

                    <View className={`px-2 py-0.5 rounded-full border ${goalBadgeClass}`}>
                      <Text className="text-[9px] font-extrabold uppercase">
                        {combo.goal}
                      </Text>
                    </View>
                  </View>

                  {/* Macro Pills Grid */}
                  <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60 mb-2.5 flex-row items-center justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Calories</Text>
                      <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                        {combo.calories}
                      </Text>
                    </View>
                    <View className="items-center flex-1 border-x border-input-border/60">
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Protein</Text>
                      <Text className="text-sm font-black text-emerald-500">
                        {combo.protein}g
                      </Text>
                    </View>
                    <View className="items-center flex-1 border-r border-input-border/60">
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Carbs</Text>
                      <Text className="text-sm font-black text-sky-500">
                        {combo.carbs}g
                      </Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Fat</Text>
                      <Text className="text-sm font-black text-amber-500">
                        {combo.fat}g
                      </Text>
                    </View>
                  </View>

                  {/* Visual Macro Bar */}
                  <View className="h-1.5 rounded-full overflow-hidden flex-row bg-input-border/30 mb-2.5">
                    <View style={{ width: `${pPct}%`, backgroundColor: '#10B981' }} />
                    <View style={{ width: `${cPct}%`, backgroundColor: '#0EA5E9' }} />
                    <View style={{ width: `${fPct}%`, backgroundColor: '#F59E0B' }} />
                  </View>

                  {/* Ingredients Preview */}
                  <View className="mb-3">
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-4" numberOfLines={2}>
                      <Text className="font-bold text-text-primary dark:text-text-primary-dark">Ingredients: </Text>
                      {combo.ingredients.map((ing) => ing.name).join(' · ')}
                    </Text>
                  </View>

                  {/* Action Buttons Row */}
                  <View className="flex-row items-center justify-between pt-2.5 border-t border-input-border/60 dark:border-input-border-dark/60 gap-2">
                    <TouchableOpacity
                      onPress={() => setSelectedComboForDetails(combo)}
                      activeOpacity={0.7}
                      className="px-3 py-2 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1.5"
                    >
                      <Ionicons name="receipt-outline" size={13} color={colors.accent} />
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        Recipe & Scale
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleLogMealCombo(combo, 1.0, selectedMeal)}
                      activeOpacity={0.8}
                      className="flex-1 py-2 px-3 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Ionicons name="flash" size={13} color="#FFFFFF" />
                      <Text className="text-xs font-black text-white">
                        1-Tap Log ({combo.calories} kcal)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ===================== MODE 2 & 3: SEARCH ALL FOODS / RECENTS ===================== */}
      {(libraryMode === 'search' || libraryMode === 'recent') && (
        <View>
          {libraryMode === 'search' && (
            <View className="mb-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {[
                  { key: 'ALL', label: 'All Foods' },
                  { key: 'Protein', label: 'Protein' },
                  { key: 'Carbs', label: 'Carbs' },
                  { key: 'Fats', label: 'Fats' },
                  { key: 'Fruits', label: 'Fruits' },
                  { key: 'Vegetables', label: 'Veggies' },
                  { key: 'Dairy', label: 'Dairy' },
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
          )}

          {/* Database Indicator */}
          <View className="flex-row items-center justify-between px-1 mb-2.5">
            <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              {libraryMode === 'recent'
                ? `Recent Foods (${recentFoods.length})`
                : activeCategory !== 'ALL'
                ? `${activeCategory} Foods (${displayedFoods.length})`
                : `Verified Staples & Online Foods (${displayedFoods.length})`}
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
              Tap for Nutrition Facts
            </Text>
          </View>

          {/* Foods List */}
          {isLoadingOff && displayedFoods.length === 0 ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="small" color={colors.accent} />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-2 font-medium">
                Searching food database...
              </Text>
            </View>
          ) : displayedFoods.length === 0 ? (
            <View className="p-8 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center my-2">
              <Ionicons name="search" size={26} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                No foods found
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1 text-center">
                Try searching for another food or switch to Balanced Meal Combos.
              </Text>
            </View>
          ) : (
            displayedFoods.map((item) => {
              const nutriscoreColor =
                item.nutriscore === 'A'
                  ? 'bg-emerald-600 text-white'
                  : item.nutriscore === 'B'
                  ? 'bg-emerald-500 text-white'
                  : item.nutriscore === 'C'
                  ? 'bg-amber-500 text-white'
                  : item.nutriscore === 'D'
                  ? 'bg-orange-500 text-white'
                  : item.nutriscore === 'E'
                  ? 'bg-rose-600 text-white'
                  : '';

              return (
                <View
                  key={item.id}
                  className="mb-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark p-3.5 shadow-sm"
                >
                  {/* Top Row: Icon/Image + Name + Verified Badge */}
                  <View className="flex-row items-start justify-between mb-2">
                    <TouchableOpacity
                      onPress={() => setSelectedFoodForInspection(item)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3 flex-1 pr-2"
                    >
                      {item.imageUri ? (
                        <Image
                          source={{ uri: item.imageUri }}
                          className="w-11 h-11 rounded-2xl bg-input border border-input-border"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-11 h-11 rounded-2xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark">
                          <Text className="text-xl">{item.icon || '🥗'}</Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                          {item.brand ? `${item.brand} • ` : ''}{item.servingSize} ({item.servingWeightG || 100}g)
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Quality Badges */}
                    <View className="flex-row items-center gap-1.5">
                      {item.isVerified ? (
                        <View className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex-row items-center gap-1">
                          <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                          <Text className="text-[9px] font-black text-emerald-500">
                            Verified
                          </Text>
                        </View>
                      ) : null}

                      {item.nutriscore ? (
                        <View className={`px-1.5 py-0.5 rounded-md ${nutriscoreColor}`}>
                          <Text className="text-[8px] font-black">
                            Nutri-Score {item.nutriscore}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Macro Pills Grid */}
                  <View className="p-2 rounded-xl bg-input dark:bg-input-dark border border-input-border/60 mb-2 flex-row items-center justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Calories</Text>
                      <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                        {item.calories} kcal
                      </Text>
                    </View>
                    <View className="items-center flex-1 border-x border-input-border/60">
                      <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Protein</Text>
                      <Text className="text-xs font-black text-emerald-500">
                        {item.protein}g
                      </Text>
                    </View>
                    <View className="items-center flex-1 border-r border-input-border/60">
                      <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Carbs</Text>
                      <Text className="text-xs font-black text-sky-500">
                        {item.carbs}g
                      </Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">Fat</Text>
                      <Text className="text-xs font-black text-amber-500">
                        {item.fat}g
                      </Text>
                    </View>
                  </View>

                  {/* Micronutrients Line (if available) */}
                  {(item.fiber !== undefined || item.sugar !== undefined || item.sodiumMg !== undefined) && (
                    <View className="flex-row items-center gap-3 px-1 mb-2.5">
                      {item.fiber !== undefined && (
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          🌾 Fiber: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{item.fiber}g</Text>
                        </Text>
                      )}
                      {item.sugar !== undefined && (
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          🍬 Sugar: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{item.sugar}g</Text>
                        </Text>
                      )}
                      {item.sodiumMg !== undefined && (
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          🧂 Sodium: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{item.sodiumMg}mg</Text>
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Action Buttons Row */}
                  <View className="flex-row items-center justify-between pt-2 border-t border-input-border/60 dark:border-input-border-dark/60 gap-2">
                    <TouchableOpacity
                      onPress={() => setSelectedFoodForInspection(item)}
                      activeOpacity={0.7}
                      className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1.5"
                    >
                      <Ionicons name="nutrition-outline" size={13} color={colors.accent} />
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        Nutrition Facts & Scale
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleQuickLogStandard(item)}
                      activeOpacity={0.8}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Ionicons name="add" size={14} color="#FFFFFF" />
                      <Text className="text-xs font-black text-white">
                        Quick Add (+{item.servingSize})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Meal Combo Details & Scaler Modal */}
      <MealComboDetailsModal
        visible={Boolean(selectedComboForDetails)}
        combo={selectedComboForDetails}
        defaultMeal={selectedMeal}
        onClose={() => setSelectedComboForDetails(null)}
        onLogCombo={handleLogMealCombo}
      />

      {/* Comprehensive Food Nutrition Facts & Portion Tuner Modal */}
      <FoodDetailsInspectorModal
        visible={Boolean(selectedFoodForInspection)}
        food={selectedFoodForInspection}
        defaultMeal={selectedMeal}
        onClose={() => setSelectedFoodForInspection(null)}
        onConfirmLog={(logItem) => {
          onAddFood(logItem);
          saveFoodToRecentHistory(selectedFoodForInspection);
          getRecentLoggedFoods().then((list) => setRecentFoods(list));
          setSessionAddedCount((prev) => prev + 1);
        }}
      />
    </View>
  );
}
