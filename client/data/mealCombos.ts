export interface MealComboIngredient {
  name: string;
  portion: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealCombo {
  id: string;
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  goal: 'High Protein' | 'Fat Loss' | 'Post-Workout' | 'Balanced Energy' | 'Clean Bulking';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTimeMinutes: number;
  icon: string;
  tagline: string;
  description: string;
  ingredients: MealComboIngredient[];
  prepTips?: string[];
  tags: string[];
}

export const BALANCED_MEAL_COMBOS: MealCombo[] = [
  // ===================== BREAKFAST =====================
  {
    id: 'combo-anabolic-proats',
    title: 'Anabolic Peanut Butter Proats Bowl',
    mealType: 'breakfast',
    goal: 'High Protein',
    calories: 475,
    protein: 38,
    carbs: 54,
    fat: 12,
    fiber: 8,
    prepTimeMinutes: 5,
    icon: '🥣',
    tagline: 'Sustained Morning Energy & Hypertrophy Fuel',
    description: 'Warm rolled oats blended with premium whey protein, sliced ripe banana, and creamy natural peanut butter.',
    ingredients: [
      { name: 'Rolled Oats (dry)', portion: '60g (approx 2/3 cup)', calories: 230, protein: 8, carbs: 40, fat: 4 },
      { name: 'Whey Protein Powder (Vanilla or Chocolate)', portion: '1 scoop (30g)', calories: 120, protein: 24, carbs: 2, fat: 1.5 },
      { name: 'Natural Peanut Butter', portion: '1 tbsp (16g)', calories: 95, protein: 4, carbs: 3, fat: 8 },
      { name: 'Sliced Banana', portion: '1/2 medium banana (55g)', calories: 50, protein: 1, carbs: 13, fat: 0.2 },
      { name: 'Ground Cinnamon & Water/Unsweetened Almond Milk', portion: '1 cup', calories: 15, protein: 1, carbs: 1, fat: 0.5 },
    ],
    prepTips: ['Cook oats first, let cool for 60 seconds before stirring in whey protein to prevent clumping.'],
    tags: ['breakfast', 'high-protein', 'oats', 'whey', 'mass', 'vegetarian']
  },
  {
    id: 'combo-steak-eggs-toast',
    title: 'Steak, Eggs & Avocado Power Plate',
    mealType: 'breakfast',
    goal: 'Balanced Energy',
    calories: 450,
    protein: 42,
    carbs: 26,
    fat: 18,
    fiber: 5,
    prepTimeMinutes: 12,
    icon: '🥩',
    tagline: 'High Testosterone & Satiety Power Breakfast',
    description: 'Tender lean sirloin steak strips paired with two sunny-side eggs, ripe avocado, and whole wheat sourdough toast.',
    ingredients: [
      { name: 'Lean Top Sirloin Steak (cooked)', portion: '120g (4.2 oz)', calories: 210, protein: 32, carbs: 0, fat: 8 },
      { name: 'Large Whole Eggs', portion: '2 eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
      { name: 'Whole Wheat Toast', portion: '1 thick slice (40g)', calories: 90, protein: 4, carbs: 18, fat: 1 },
      { name: 'Fresh Hass Avocado', portion: '1/4 medium avocado (35g)', calories: 55, protein: 1, carbs: 3, fat: 5 },
    ],
    prepTips: ['Sear sirloin on high heat for 2 minutes per side to retain maximum juiciness and nutrients.'],
    tags: ['breakfast', 'high-protein', 'steak', 'eggs', 'low-carb', 'strength']
  },
  {
    id: 'combo-eggwhite-spinach-scramble',
    title: 'Egg White & Spinach Lean Omelet',
    mealType: 'breakfast',
    goal: 'Fat Loss',
    calories: 285,
    protein: 34,
    carbs: 24,
    fat: 5,
    fiber: 4,
    prepTimeMinutes: 8,
    icon: '🍳',
    tagline: 'High Volume, Ultra-Lean Cutting Breakfast',
    description: 'Fluffy egg white scramble with baby spinach, cherry tomatoes, low-fat feta, and toasted whole grain bread.',
    ingredients: [
      { name: 'Liquid Egg Whites', portion: '1 cup (240g / ~6 egg whites)', calories: 125, protein: 26, carbs: 2, fat: 0.5 },
      { name: 'Large Whole Egg', portion: '1 egg', calories: 70, protein: 6, carbs: 0.5, fat: 5 },
      { name: 'Baby Spinach & Cherry Tomatoes', portion: '1.5 cups', calories: 25, protein: 2, carbs: 4, fat: 0.2 },
      { name: 'Whole Wheat Toast', portion: '1 slice (35g)', calories: 80, protein: 3.5, carbs: 15, fat: 1 },
    ],
    prepTips: ['Use non-stick olive oil cooking spray to keep added fats minimal while retaining crisp textures.'],
    tags: ['breakfast', 'fat-loss', 'egg-whites', 'low-calorie', 'high-volume', 'cutting']
  },
  {
    id: 'combo-greek-yogurt-parfait',
    title: 'Greek Yogurt Superberry Parfait',
    mealType: 'breakfast',
    goal: 'High Protein',
    calories: 310,
    protein: 26,
    carbs: 38,
    fat: 6,
    fiber: 7,
    prepTimeMinutes: 3,
    icon: '🫐',
    tagline: 'Probiotic Gut Health & Fast Morning Protein',
    description: 'Creamy non-fat Greek yogurt layered with wild blueberries, chia seeds, sliced almonds, and a touch of raw honey.',
    ingredients: [
      { name: 'Non-Fat Plain Greek Yogurt', portion: '200g (approx 3/4 cup)', calories: 130, protein: 22, carbs: 7, fat: 0.5 },
      { name: 'Fresh or Frozen Wild Blueberries', portion: '1/2 cup (75g)', calories: 45, protein: 0.5, carbs: 11, fat: 0.3 },
      { name: 'Chia Seeds', portion: '1 tsp (5g)', calories: 25, protein: 1, carbs: 2, fat: 1.5 },
      { name: 'Sliced Almonds', portion: '1 tbsp (10g)', calories: 60, protein: 2, carbs: 2, fat: 5 },
      { name: 'Raw Honey', portion: '1 tsp (7g)', calories: 21, protein: 0, carbs: 6, fat: 0 },
    ],
    prepTips: ['Great for make-ahead overnight meal prep in a mason jar.'],
    tags: ['breakfast', 'snack', 'yogurt', 'berries', 'probiotics', 'gut-health', 'vegetarian']
  },

  // ===================== LUNCH & POST-WORKOUT =====================
  {
    id: 'combo-classic-chicken-rice-broccoli',
    title: 'The Bodybuilder Anabolic Bowl',
    mealType: 'lunch',
    goal: 'Post-Workout',
    calories: 470,
    protein: 48,
    carbs: 58,
    fat: 5,
    fiber: 6,
    prepTimeMinutes: 15,
    icon: '🍗',
    tagline: 'The Gold Standard Post-Workout Muscle Meal',
    description: 'Herb-seasoned grilled chicken breast paired with fluffy steamed jasmine rice and crisp steamed broccoli florets.',
    ingredients: [
      { name: 'Grilled Chicken Breast (skinless)', portion: '180g (6.3 oz cooked)', calories: 235, protein: 44, carbs: 0, fat: 4 },
      { name: 'Steamed Jasmine White Rice', portion: '1.5 cups cooked (225g)', calories: 200, protein: 4, carbs: 52, fat: 0.5 },
      { name: 'Steamed Broccoli Florets', portion: '1 cup (90g)', calories: 35, protein: 3, carbs: 6, fat: 0.4 },
    ],
    prepTips: ['White jasmine rice provides fast glycogen replenishment post-workout without gastrointestinal distress.'],
    tags: ['lunch', 'post-workout', 'chicken', 'rice', 'broccoli', 'hypertrophy', 'clean-staple']
  },
  {
    id: 'combo-beef-rice-bowl',
    title: 'Teriyaki Lean Beef & Rice Bowl',
    mealType: 'lunch',
    goal: 'High Protein',
    calories: 490,
    protein: 42,
    carbs: 52,
    fat: 13,
    fiber: 4,
    prepTimeMinutes: 12,
    icon: '🍚',
    tagline: 'Natural Creatine & Iron Power Lunch',
    description: 'Sautéed 93/7 extra-lean ground beef with steamed white rice, sliced green onions, and sweet bell peppers.',
    ingredients: [
      { name: '93/7 Extra Lean Ground Beef', portion: '160g cooked', calories: 240, protein: 38, carbs: 0, fat: 9 },
      { name: 'Steamed Jasmine Rice', portion: '1.25 cups cooked (190g)', calories: 170, protein: 3.5, carbs: 44, fat: 0.4 },
      { name: 'Diced Bell Peppers & Green Onions', portion: '3/4 cup (80g)', calories: 30, protein: 1, carbs: 6, fat: 0.2 },
      { name: 'Low-Sodium Teriyaki / Coconut Aminos', portion: '1 tbsp (15ml)', calories: 25, protein: 0.5, carbs: 5, fat: 0 },
    ],
    prepTips: ['Drain any excess fat after browning the ground beef to keep macros lean and crisp.'],
    tags: ['lunch', 'dinner', 'beef', 'rice', 'creatine', 'iron', 'muscle-gain']
  },
  {
    id: 'combo-salmon-sweet-potato',
    title: 'Atlantic Salmon & Sweet Potato Mash',
    mealType: 'lunch',
    goal: 'Post-Workout',
    calories: 445,
    protein: 36,
    carbs: 38,
    fat: 16,
    fiber: 5,
    prepTimeMinutes: 18,
    icon: '🐟',
    tagline: 'Anti-Inflammatory Omega-3 Joint Recovery Plate',
    description: 'Pan-seared Atlantic salmon fillet with tender roasted sweet potato mash and grilled garlic asparagus.',
    ingredients: [
      { name: 'Atlantic Salmon Fillet (baked/seared)', portion: '160g (5.6 oz)', calories: 260, protein: 34, carbs: 0, fat: 14 },
      { name: 'Baked Sweet Potato (mashed)', portion: '1 medium (150g)', calories: 135, protein: 2, carbs: 32, fat: 0.2 },
      { name: 'Grilled Asparagus Spears', portion: '6-8 spears (90g)', calories: 25, protein: 2.5, carbs: 4, fat: 0.3 },
      { name: 'Fresh Lemon Juice & Sea Salt', portion: '1 wedge', calories: 5, protein: 0, carbs: 1, fat: 0 },
    ],
    prepTips: ['Bake salmon skin-down at 400°F (200°C) for 12-14 minutes for a crispy crust and tender center.'],
    tags: ['lunch', 'dinner', 'salmon', 'sweet-potato', 'omega-3', 'recovery', 'clean-eating']
  },
  {
    id: 'combo-burrito-bowl',
    title: 'Fiesta High-Protein Burrito Bowl',
    mealType: 'lunch',
    goal: 'High Protein',
    calories: 520,
    protein: 46,
    carbs: 56,
    fat: 14,
    fiber: 10,
    prepTimeMinutes: 10,
    icon: '🥗',
    tagline: 'Chipotle-Style High-Fiber Meal Prep Favorite',
    description: 'Shredded chicken breast over brown rice, fiber-packed black beans, crisp romaine, pico de gallo, and fresh guacamole.',
    ingredients: [
      { name: 'Shredded Chicken Breast', portion: '160g (5.6 oz)', calories: 210, protein: 40, carbs: 0, fat: 3.5 },
      { name: 'Cooked Brown Rice', portion: '3/4 cup (140g)', calories: 155, protein: 3.5, carbs: 34, fat: 1.2 },
      { name: 'Black Beans (drained/rinsed)', portion: '1/2 cup (85g)', calories: 80, protein: 5, carbs: 14, fat: 0.4 },
      { name: 'Fresh Pico de Gallo & Romaine', portion: '1/2 cup', calories: 20, protein: 1, carbs: 4, fat: 0.2 },
      { name: 'Fresh Guacamole / Mashed Avocado', portion: '2 tbsp (30g)', calories: 45, protein: 0.5, carbs: 2, fat: 4 },
    ],
    prepTips: ['High potassium and magnesium from black beans and avocado help prevent muscle cramps.'],
    tags: ['lunch', 'dinner', 'chicken', 'burrito', 'mexican', 'high-fiber', 'meal-prep']
  },
  {
    id: 'combo-tuna-poke-bowl',
    title: 'Ahi Tuna Poke Power Bowl',
    mealType: 'lunch',
    goal: 'Fat Loss',
    calories: 420,
    protein: 42,
    carbs: 46,
    fat: 8,
    fiber: 6,
    prepTimeMinutes: 10,
    icon: '🍣',
    tagline: 'Ultra-Lean Protein with Crisp Fresh Vegetables',
    description: 'High-protein tuna chunks served over sushi rice, steamed edamame, sliced cucumbers, and sesame soy drizzle.',
    ingredients: [
      { name: 'Yellowfin Tuna / Light Tuna in Water', portion: '170g (6 oz drained)', calories: 190, protein: 40, carbs: 0, fat: 1 },
      { name: 'Steamed White / Sushi Rice', portion: '1 cup cooked (150g)', calories: 160, protein: 3, carbs: 36, fat: 0.3 },
      { name: 'Shelled Edamame Beans', portion: '1/3 cup (50g)', calories: 60, protein: 6, carbs: 4, fat: 2.5 },
      { name: 'Diced Cucumbers & Nori Strips', portion: '1/2 cup', calories: 15, protein: 1, carbs: 3, fat: 0.1 },
      { name: 'Light Sesame Soy Sauce', portion: '1 tbsp', calories: 20, protein: 1, carbs: 2, fat: 1 },
    ],
    prepTips: ['One of the leanest protein-to-calorie ratios available in whole foods.'],
    tags: ['lunch', 'tuna', 'poke', 'low-fat', 'omega-3', 'cutting', 'pescatarian']
  },

  // ===================== DINNER =====================
  {
    id: 'combo-turkey-potato-wedges',
    title: 'Lean Turkey Burger & Roasted Potatoes',
    mealType: 'dinner',
    goal: 'Balanced Energy',
    calories: 410,
    protein: 38,
    carbs: 40,
    fat: 11,
    fiber: 5,
    prepTimeMinutes: 20,
    icon: '🍔',
    tagline: 'Clean Comfort Food for Evening Recovery',
    description: 'Juicy 93/7 ground turkey patty served bunless with crispy paprika-spiced roasted baby red potato wedges and green beans.',
    ingredients: [
      { name: 'Lean Ground Turkey Patty (93/7)', portion: '150g raw / 125g cooked', calories: 200, protein: 32, carbs: 0, fat: 9 },
      { name: 'Roasted Baby Red Potato Wedges', portion: '160g', calories: 140, protein: 3, carbs: 32, fat: 0.5 },
      { name: 'Steamed Whole Green Beans', portion: '1 cup (100g)', calories: 35, protein: 2, carbs: 7, fat: 0.2 },
      { name: 'Dijon Mustard & Paprika Seasoning', portion: '1 tbsp', calories: 15, protein: 1, carbs: 1, fat: 0.5 },
    ],
    prepTips: ['Toss potatoes in paprika, garlic powder, and a light mist of olive oil for crispy oven wedges.'],
    tags: ['dinner', 'turkey', 'potatoes', 'clean-eating', 'balanced', 'muscle-gain']
  },
  {
    id: 'combo-mediterranean-chicken-salad',
    title: 'Mediterranean Grilled Chicken Salad',
    mealType: 'dinner',
    goal: 'Fat Loss',
    calories: 340,
    protein: 40,
    carbs: 12,
    fat: 14,
    fiber: 5,
    prepTimeMinutes: 10,
    icon: '🥗',
    tagline: 'Low-Carb, High Satiety Evening Salad',
    description: 'Sliced grilled chicken breast on a bed of crisp romaine, cucumbers, cherry tomatoes, kalamata olives, and light feta vinaigrette.',
    ingredients: [
      { name: 'Grilled Chicken Breast', portion: '160g (5.6 oz)', calories: 210, protein: 40, carbs: 0, fat: 3.5 },
      { name: 'Chopped Romaine & Cucumbers', portion: '2.5 cups', calories: 30, protein: 2, carbs: 5, fat: 0.3 },
      { name: 'Kalamata Olives (sliced)', portion: '6 olives (20g)', calories: 45, protein: 0.3, carbs: 2, fat: 4.5 },
      { name: 'Light Crumbled Feta Cheese', portion: '2 tbsp (20g)', calories: 40, protein: 3, carbs: 1, fat: 3 },
      { name: 'Red Wine Vinegar & Lemon Juice', portion: '1 tbsp', calories: 8, protein: 0, carbs: 1, fat: 0 },
    ],
    prepTips: ['Ideal dinner when calories are low toward the end of a cutting phase.'],
    tags: ['dinner', 'fat-loss', 'low-carb', 'keto', 'salad', 'chicken', 'cutting']
  },
  {
    id: 'combo-cod-quinoa-asparagus',
    title: 'Lemon Herb White Fish & Fluffy Quinoa',
    mealType: 'dinner',
    goal: 'Fat Loss',
    calories: 330,
    protein: 36,
    carbs: 32,
    fat: 6,
    fiber: 4,
    prepTimeMinutes: 15,
    icon: '🎣',
    tagline: 'Light, Easy-Digesting Complete Protein Dinner',
    description: 'Pan-seared cod or tilapia fillet with lemon-herb seasoning, warm cooked quinoa, and tender zucchini slices.',
    ingredients: [
      { name: 'Wild Cod or Tilapia Fillet', portion: '180g (6.3 oz)', calories: 150, protein: 32, carbs: 0, fat: 1.5 },
      { name: 'Cooked Quinoa', portion: '3/4 cup (140g)', calories: 160, protein: 6, carbs: 29, fat: 2.5 },
      { name: 'Sautéed Zucchini Slices', portion: '1 cup (120g)', calories: 20, protein: 1.5, carbs: 3, fat: 0.3 },
      { name: 'Olive Oil drizzle & Lemon juice', portion: '1 tsp olive oil', calories: 40, protein: 0, carbs: 0, fat: 4.5 },
    ],
    prepTips: ['White fish provides pure protein with minimal fat, leaving room for complex carbs.'],
    tags: ['dinner', 'fish', 'quinoa', 'light', 'digestive-rest', 'pescatarian']
  },
  {
    id: 'combo-tofu-edamame-stirfry',
    title: 'Crispy Tofu & Edamame Protein Bowl',
    mealType: 'dinner',
    goal: 'High Protein',
    calories: 450,
    protein: 34,
    carbs: 48,
    fat: 15,
    fiber: 9,
    prepTimeMinutes: 15,
    icon: '🥢',
    tagline: 'Complete Plant-Based Muscle Fuel',
    description: 'Crispy cubed extra-firm tofu tossed with shelled edamame, sugar snap peas, carrots, jasmine rice, and ginger tamari sauce.',
    ingredients: [
      { name: 'Extra-Firm Tofu (air-fried or seared)', portion: '180g (6.3 oz)', calories: 170, protein: 18, carbs: 4, fat: 10 },
      { name: 'Shelled Edamame', portion: '1/2 cup (80g)', calories: 100, protein: 10, carbs: 7, fat: 4 },
      { name: 'Cooked Jasmine Rice', portion: '1 cup (150g)', calories: 150, protein: 3, carbs: 33, fat: 0.3 },
      { name: 'Mixed Stir-Fry Vegetables', portion: '1 cup (100g)', calories: 35, protein: 2, carbs: 6, fat: 0.2 },
      { name: 'Low-Sodium Tamari & Garlic Ginger', portion: '1 tbsp', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ],
    prepTips: ['Press tofu with a paper towel for 10 minutes prior to cooking to achieve restaurant-style crispy texture.'],
    tags: ['dinner', 'lunch', 'tofu', 'vegan', 'vegetarian', 'plant-based', 'high-protein']
  },

  // ===================== SNACKS & SHAKES =====================
  {
    id: 'combo-rapid-postworkout-shake',
    title: 'Rapid Glycogen Recovery Shake',
    mealType: 'snack',
    goal: 'Post-Workout',
    calories: 275,
    protein: 28,
    carbs: 38,
    fat: 2,
    fiber: 3,
    prepTimeMinutes: 2,
    icon: '🥤',
    tagline: 'Fast Spike for Immediate Protein Synthesis',
    description: 'Ultra-fast absorbing whey protein isolate blended with 1 whole ripe banana, honey, and ice-cold water or almond milk.',
    ingredients: [
      { name: 'Whey Protein Isolate', portion: '1 scoop (30g)', calories: 110, protein: 25, carbs: 1, fat: 0.5 },
      { name: 'Ripe Medium Banana', portion: '1 banana (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { name: 'Pure Honey', portion: '1 tbsp (21g)', calories: 60, protein: 0.1, carbs: 17, fat: 0 },
      { name: 'Unsweetened Almond Milk or Cold Water', portion: '1.25 cups (300ml)', calories: 15, protein: 0.5, carbs: 1, fat: 1 },
    ],
    prepTips: ['Drink within 45 minutes after intense resistance training for optimal muscle protein synthesis.'],
    tags: ['snack', 'shake', 'post-workout', 'whey', 'banana', 'fast-digesting']
  },
  {
    id: 'combo-chocolate-mass-shake',
    title: 'Chocolate Peanut Butter Mass Builder',
    mealType: 'snack',
    goal: 'Clean Bulking',
    calories: 620,
    protein: 46,
    carbs: 64,
    fat: 22,
    fiber: 9,
    prepTimeMinutes: 3,
    icon: '🍫',
    tagline: 'Clean Nutrient-Dense Calorie Surplus Shake',
    description: 'Rich chocolate whey protein blended with natural peanut butter, rolled oats, banana, and whole or oat milk.',
    ingredients: [
      { name: 'Chocolate Whey Protein Powder', portion: '1.5 scoops (45g)', calories: 175, protein: 36, carbs: 3, fat: 2 },
      { name: 'Rolled Oats (blended raw)', portion: '1/2 cup (45g)', calories: 170, protein: 6, carbs: 30, fat: 3 },
      { name: 'Creamy Natural Peanut Butter', portion: '2 tbsp (32g)', calories: 190, protein: 8, carbs: 6, fat: 16 },
      { name: 'Sliced Banana', portion: '1/2 banana', calories: 50, protein: 1, carbs: 13, fat: 0.2 },
      { name: 'Unsweetened Almond Milk', portion: '1.5 cups', calories: 45, protein: 1.5, carbs: 2, fat: 3 },
    ],
    prepTips: ['Blend the oats first into a fine powder before adding liquids to guarantee a smooth texture.'],
    tags: ['snack', 'shake', 'bulking', 'high-calorie', 'mass-gainer', 'peanut-butter']
  },
  {
    id: 'combo-cottage-cheese-berries',
    title: 'Slow-Release Nighttime Casein Bowl',
    mealType: 'snack',
    goal: 'High Protein',
    calories: 250,
    protein: 28,
    carbs: 22,
    fat: 5,
    fiber: 4,
    prepTimeMinutes: 2,
    icon: '🍨',
    tagline: 'Overnight Muscle Protein Breakdown Defense',
    description: 'Slow-digesting low-fat cottage cheese paired with fresh strawberries, raw honey, and crushed walnuts.',
    ingredients: [
      { name: 'Low-Fat Cottage Cheese (2%)', portion: '1 cup (226g)', calories: 180, protein: 26, carbs: 8, fat: 4.5 },
      { name: 'Fresh Sliced Strawberries', portion: '1/2 cup (75g)', calories: 25, protein: 0.5, carbs: 6, fat: 0.2 },
      { name: 'Crushed Raw Walnuts', portion: '1 tbsp (8g)', calories: 50, protein: 1.2, carbs: 1, fat: 5 },
      { name: 'Drizzle of Raw Honey', portion: '1/2 tsp', calories: 12, protein: 0, carbs: 3, fat: 0 },
    ],
    prepTips: ['Cottage cheese is rich in slow-digesting micellar casein, providing a continuous amino acid stream for 6-8 hours of sleep.'],
    tags: ['snack', 'nighttime', 'casein', 'cottage-cheese', 'berries', 'recovery']
  },
  {
    id: 'combo-ricecakes-turkey-avocado',
    title: 'Crispy Rice Cake Protein Stacks',
    mealType: 'snack',
    goal: 'Fat Loss',
    calories: 245,
    protein: 24,
    carbs: 24,
    fat: 6,
    fiber: 3,
    prepTimeMinutes: 4,
    icon: '🥪',
    tagline: 'Crunchy, Low-Calorie Clean Afternoon Fuel',
    description: 'Lightly salted brown rice cakes topped with thin-sliced lean deli turkey breast, mashed avocado, and spicy dijon mustard.',
    ingredients: [
      { name: 'Brown Rice Cakes', portion: '3 cakes', calories: 105, protein: 2.5, carbs: 22, fat: 0.8 },
      { name: 'Sliced Oven-Roasted Turkey Breast', portion: '100g (3.5 oz)', calories: 100, protein: 20, carbs: 1, fat: 1.5 },
      { name: 'Mashed Avocado', portion: '2 tbsp (30g)', calories: 45, protein: 0.5, carbs: 2, fat: 4 },
      { name: 'Dijon Mustard & Black Pepper', portion: '1 tsp', calories: 5, protein: 0.3, carbs: 0.5, fat: 0.2 },
    ],
    prepTips: ['Zero prep required; keep in gym bag or office desk for an emergency clean snack.'],
    tags: ['snack', 'quick', 'turkey', 'rice-cakes', 'cutting', 'low-calorie']
  },
  {
    id: 'combo-apple-peanut-butter',
    title: 'Crunchy Apple & Peanut Butter Slices',
    mealType: 'snack',
    goal: 'Balanced Energy',
    calories: 260,
    protein: 8,
    carbs: 32,
    fat: 16,
    fiber: 6,
    prepTimeMinutes: 2,
    icon: '🍎',
    tagline: 'Simple Pre-Workout Clean Carb & Fat Energy',
    description: 'Crisp Honeycrisp apple slices dipped in creamy natural peanut butter with a dash of sea salt and cinnamon.',
    ingredients: [
      { name: 'Crisp Medium Apple', portion: '1 apple (180g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      { name: 'Natural Peanut Butter', portion: '1.5 tbsp (24g)', calories: 145, protein: 6, carbs: 4.5, fat: 12 },
      { name: 'Ground Cinnamon & Pinch of Sea Salt', portion: 'To taste', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
    ],
    prepTips: ['Eat 60-90 minutes prior to lifting for smooth, sustained energy without stomach fullness.'],
    tags: ['snack', 'pre-workout', 'apple', 'peanut-butter', 'vegan', 'whole-foods']
  }
];

