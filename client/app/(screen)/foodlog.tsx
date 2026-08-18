import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FoodItem: React.FC<{ title: string; subtitle?: string; macros: string[] }> = ({
  title,
  subtitle,
  macros,
}) => (
  <View className="bg-surface dark:bg-surface-dark rounded-[14px] p-3.5 mb-2.5 border border-input-border dark:border-input-border-dark flex-row justify-between items-center">
    <View className="flex-1 pr-3">
      <Text className="text-text-primary dark:text-text-primary-dark text-sm font-semibold mb-1.5">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-text-muted dark:text-text-muted-dark text-xs">{subtitle}</Text>
      ) : null}
    </View>
    <View className="items-end">
      {macros.map((line, index) => (
        <Text key={index} className="text-text-primary dark:text-text-primary-dark text-xs text-right">
          {line}
        </Text>
      ))}
    </View>
  </View>
);

export default function FoodLog() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        <Text className="text-text-muted dark:text-text-muted-dark mt-0.5 mb-4 text-sm">
          Track your daily meals with AI-powered nutritional analysis
        </Text>

        <View className="flex-row justify-between items-center mt-2 mb-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-[15px] font-bold">
            🍳 Breakfast · 480 kcal
          </Text>
          <TouchableOpacity className="bg-input dark:bg-input-dark py-1.5 px-2.5 rounded-lg border border-input-border dark:border-input-border-dark">
            <Text className="text-accent dark:text-accent-dark">+ Add Food</Text>
          </TouchableOpacity>
        </View>

        <FoodItem title="Greek Yogurt with Granola" subtitle="1 cup · 180g" macros={['18g Protein', '32g Carbs', '8g Fat']} />
        <FoodItem title="Banana" subtitle="1 medium · 120g" macros={['1g Protein', '27g Carbs', '0g Fat']} />

        <View className="flex-row justify-between items-center mt-2 mb-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-[15px] font-bold">
            🍽️ Lunch · 650 kcal
          </Text>
          <TouchableOpacity className="bg-input dark:bg-input-dark py-1.5 px-2.5 rounded-lg border border-input-border dark:border-input-border-dark">
            <Text className="text-accent dark:text-accent-dark">+ Add Food</Text>
          </TouchableOpacity>
        </View>

        <FoodItem title="Grilled Chicken Salad" subtitle="1 bowl · 350g" macros={['45g Protein', '18g Carbs', '14g Fat']} />
        <FoodItem title="Whole Wheat Bread" subtitle="2 slices · 60g" macros={['6g Protein', '24g Carbs', '2g Fat']} />

        <View className="flex-row justify-between items-center mt-2 mb-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-[15px] font-bold">
            🌙 Dinner · 710 kcal
          </Text>
          <TouchableOpacity className="bg-input dark:bg-input-dark py-1.5 px-2.5 rounded-lg border border-input-border dark:border-input-border-dark">
            <Text className="text-accent dark:text-accent-dark">+ Add Food</Text>
          </TouchableOpacity>
        </View>

        <FoodItem title="Baked Salmon" subtitle="200g fillet" macros={['40g Protein', '0g Carbs', '22g Fat']} />
        <FoodItem title="Brown Rice" subtitle="1 cup cooked · 200g" macros={['5g Protein', '45g Carbs', '2g Fat']} />

        <View className="h-7" />
        <TouchableOpacity
          className="bg-accent dark:bg-accent-dark mx-2 py-3 rounded-xl items-center mt-1.5"
          onPress={() => console.log('Complete Daily Log')}
        >
          <Text className="text-background dark:text-background-dark font-bold text-base">
            Complete Daily Log
          </Text>
        </TouchableOpacity>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}