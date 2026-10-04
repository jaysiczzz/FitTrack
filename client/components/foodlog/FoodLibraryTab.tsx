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
  DeviceEventEmitter,
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
import MealSelectorPill from './MealSelectorPill';
import ResponsiveMacroRow from './ResponsiveMacroRow';
import MealComboDetailsModal from './MealComboDetailsModal';
import FoodDetailsInspectorModal from './FoodDetailsInspectorModal';
import { useResponsive } from '@/hooks/useResponsive';

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

  // Pagination state for progressive loading
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [libraryMode, searchQuery, activeCategory, activeComboFilter]);

  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setSelectedMeal(defaultMeal || getSmartMealType());
  }, [defaultMeal]);

  useEffect(() => {
    const loadRecents = () => {
      getRecentLoggedFoods().then((list) => {
        setRecentFoods(list);
      });
    };
    loadRecents();

    const sub = DeviceEventEmitter.addListener('RECENT_FOODS_UPDATED', loadRecents);
    return () => {
      sub.remove();
    };
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

  const paginatedCombos = useMemo(() => {
    return filteredCombos.slice(0, visibleCount);
  }, [filteredCombos, visibleCount]);

  const paginatedFoods = useMemo(() => {
    return displayedFoods.slice(0, visibleCount);
  }, [displayedFoods, visibleCount]);

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
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
          Food Library
        </Text>
      </View>
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

      {/* Row 2: Search Input + Meal Selector Pill Inline */}
      <View className="flex-row items-center gap-2 mb-2.5">
        <View className="flex-1 flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3 min-h-[34px] py-1">
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              libraryMode === 'combos'
                ? 'Search meal combos...'
                : libraryMode === 'recent'
                ? 'Search recents...'
                : 'Search foods & brands...'
            }
            placeholderTextColor={colors.textMuted}
            className="flex-1 py-2 text-xs text-text-primary dark:text-text-primary-dark font-medium"
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {isLoadingOff ? (
            <ActivityIndicator size="small" color={colors.accent} className="ml-1" />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <MealSelectorPill
          selectedMeal={selectedMeal}
          onSelectMeal={setSelectedMeal}
          compact
        />
      </View>

      {/* Row 3: Source Chips + Contextual Filters with Scroll Hint */}
      <View className="relative mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingRight: 28, alignItems: 'center' }}
        >
          {/* Leading Source Chips */}
          <FilterChip
            label="Meals"
            selected={libraryMode === 'combos'}
            onPress={() => setLibraryMode('combos')}
            className="mr-1.5"
          />
          <FilterChip
            label="Foods"
            selected={libraryMode === 'search'}
            onPress={() => setLibraryMode('search')}
            className="mr-1.5"
          />
          <FilterChip
            label="Recents"
            count={recentFoods.length > 0 ? recentFoods.length : undefined}
            selected={libraryMode === 'recent'}
            onPress={() => setLibraryMode('recent')}
            className="mr-2"
          />

          {/* Visual Divider between Source Chips and Category Sub-Filters */}
          <View className="h-5 w-[1px] bg-input-border dark:bg-input-border-dark mr-2" />

          {/* Sub-Filters: Combos */}
          {libraryMode === 'combos' && (
            <>
              {[
                { key: 'ALL', label: 'All Combos' },
                { key: 'High Protein', label: 'High Protein' },
                { key: 'Fat Loss', label: 'Fat Loss' },
                { key: 'Post-Workout', label: 'Post-Workout' },
                { key: 'Clean Bulking', label: 'Clean Bulking' },
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch', label: 'Lunch' },
                { key: 'dinner', label: 'Dinner' },
                { key: 'snack', label: 'Snacks' },
              ].map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  selected={activeComboFilter === f.key}
                  onPress={() => setActiveComboFilter(f.key as ComboFilter)}
                  className="mr-1.5"
                />
              ))}
            </>
          )}

          {/* Sub-Filters: Search Foods */}
          {libraryMode === 'search' && (
            <>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'Protein', label: 'Protein' },
                { key: 'Carbs', label: 'Carbs' },
                { key: 'Fats', label: 'Fats' },
                { key: 'Vegetables', label: 'Veggies' },
                { key: 'Fruits', label: 'Fruits' },
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
            </>
          )}
        </ScrollView>
      </View>

      {/* ===================== MODE 1: BALANCED MEAL COMBOS ===================== */}
      {libraryMode === 'combos' && (
        <View>

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
            <View className="flex-row flex-wrap justify-between">
              {paginatedCombos.map((combo) => {
                const goalBadgeContainerClass =
                  combo.goal === 'High Protein'
                    ? 'bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-500/20 dark:border-emerald-500/40'
                    : combo.goal === 'Fat Loss'
                    ? 'bg-rose-500/15 border-rose-500/30 dark:bg-rose-500/20 dark:border-rose-500/40'
                    : combo.goal === 'Post-Workout'
                    ? 'bg-sky-500/15 border-sky-500/30 dark:bg-sky-500/20 dark:border-sky-500/40'
                    : combo.goal === 'Clean Bulking'
                    ? 'bg-purple-500/15 border-purple-500/30 dark:bg-purple-500/20 dark:border-purple-500/40'
                    : 'bg-amber-500/15 border-amber-500/30 dark:bg-amber-500/20 dark:border-amber-500/40';

                const goalBadgeTextColor =
                  combo.goal === 'High Protein'
                    ? (isDark ? '#86EFAC' : '#059669')
                    : combo.goal === 'Fat Loss'
                    ? (isDark ? '#FDA4AF' : '#DC2626')
                    : combo.goal === 'Post-Workout'
                    ? (isDark ? '#7DD3FC' : '#0284C7')
                    : combo.goal === 'Clean Bulking'
                    ? (isDark ? '#D8B4FE' : '#9333EA')
                    : (isDark ? '#FDE047' : '#B45309');

                return (
                  <TouchableOpacity
                    key={combo.id}
                    onPress={() => setSelectedComboForDetails(combo)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${combo.title}`}
                    className="w-full md:w-[48.5%] lg:w-[32%] mb-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark p-3.5 shadow-sm"
                  >
                    {/* Top Row: Icon, Title & Goal Badge */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <View className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark shrink-0">
                          <Text className="text-lg">{combo.icon}</Text>
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark leading-snug" numberOfLines={2}>
                            {combo.title}
                          </Text>
                          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark font-medium mt-0.5" numberOfLines={1}>
                            ⏱️ {combo.prepTimeMinutes}m · {combo.tagline}
                          </Text>
                        </View>
                      </View>

                      <View className={`px-2 py-0.5 rounded-full border shrink-0 ${goalBadgeContainerClass}`}>
                        <Text
                          style={{ color: goalBadgeTextColor }}
                          className="text-[9px] font-extrabold uppercase"
                        >
                          {combo.goal}
                        </Text>
                      </View>
                    </View>

                    {/* Responsive 4-Column Macro Row */}
                    <View className="mt-1">
                      <ResponsiveMacroRow
                        calories={combo.calories}
                        protein={combo.protein}
                        carbs={combo.carbs}
                        fat={combo.fat}
                        compact
                      />
                    </View>

                    {/* Ingredients Preview */}
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-4 mt-2" numberOfLines={1}>
                      <Text className="font-bold text-text-primary dark:text-text-primary-dark">Ingredients: </Text>
                      {combo.ingredients.map((ing) => ing.name).join(' · ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Load More Combos */}
              {filteredCombos.length > visibleCount && (
                <View className="w-full items-center my-3">
                  <TouchableOpacity
                    onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    activeOpacity={0.8}
                    className="bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark px-5 py-2 rounded-xl shadow-sm"
                  >
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                      Load More Combos ({filteredCombos.length - visibleCount} remaining)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ===================== MODE 2 & 3: SEARCH ALL FOODS / RECENTS ===================== */}
      {(libraryMode === 'search' || libraryMode === 'recent') && (
        <View>

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
            <View className="flex-row flex-wrap justify-between">
              {paginatedFoods.map((item) => {
                const nutriscoreBg =
                  item.nutriscore === 'A'
                    ? 'bg-emerald-600'
                    : item.nutriscore === 'B'
                    ? 'bg-emerald-500'
                    : item.nutriscore === 'C'
                    ? 'bg-amber-500'
                    : item.nutriscore === 'D'
                    ? 'bg-orange-500'
                    : item.nutriscore === 'E'
                    ? 'bg-rose-600'
                    : '';

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedFoodForInspection(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${item.name}`}
                    className="w-full md:w-[48.5%] lg:w-[32%] mb-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark p-3.5 shadow-sm"
                  >
                    {/* Top Row: Icon/Image + Name & Subtitle */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        {item.imageUri ? (
                          <Image
                            source={{ uri: item.imageUri }}
                            className="w-10 h-10 rounded-xl bg-input border border-input-border shrink-0"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark shrink-0">
                            <Text className="text-lg">{item.icon || '🥗'}</Text>
                          </View>
                        )}
                        <View className="flex-1 min-w-0">
                          <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark leading-snug" numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5" numberOfLines={1}>
                            {item.brand ? `${item.brand} · ` : ''}{item.servingSize} ({item.servingWeightG || 100}g)
                          </Text>
                        </View>
                      </View>

                      {/* Compact Nutri-Score badge if present (no "Verified" clutter) */}
                      {item.nutriscore ? (
                        <View className={`px-1.5 py-0.5 rounded-md shrink-0 ${nutriscoreBg}`}>
                          <Text className="text-[8px] font-black text-white">
                            Nutri {item.nutriscore}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Responsive 4-Column Macro Row */}
                    <View className="mt-1">
                      <ResponsiveMacroRow
                        calories={item.calories}
                        protein={item.protein}
                        carbs={item.carbs}
                        fat={item.fat}
                        compact
                      />
                    </View>

                    {/* Ingredients / Description Preview if available */}
                    {Boolean(item.ingredients || item.description) && (
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-4 mt-2" numberOfLines={1}>
                        <Text className="font-bold text-text-primary dark:text-text-primary-dark">Ingredients: </Text>
                        {item.ingredients || item.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Load More Foods */}
              {displayedFoods.length > visibleCount && (
                <View className="w-full items-center my-3">
                  <TouchableOpacity
                    onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    activeOpacity={0.8}
                    className="bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark px-5 py-2 rounded-xl shadow-sm"
                  >
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                      Load More Foods ({displayedFoods.length - visibleCount} remaining)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
