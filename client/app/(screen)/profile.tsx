import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from 'react-native';

const INITIAL = {
  firstName: 'John',
  lastName: 'Doe',
  height: '178',
  weight: '74.5',
  age: '28',
  goal: 'muscle' as 'muscle' | 'loss',
};

export default function Profile() {
  const isDark = useColorScheme() === 'dark';
  const placeholderColor = isDark ? '#8A93A6' : '#5C6478';

  const [firstName, setFirstName] = React.useState(INITIAL.firstName);
  const [lastName, setLastName] = React.useState(INITIAL.lastName);
  const [height, setHeight] = React.useState(INITIAL.height);
  const [weight, setWeight] = React.useState(INITIAL.weight);
  const [age, setAge] = React.useState(INITIAL.age);
  const [goal, setGoal] = React.useState<'muscle' | 'loss'>(INITIAL.goal);

  const calendarDays = new Set([1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
  const partialDays = new Set([11]);

  const bmi = React.useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return null;
    const value = w / (h * h);
    const category =
      value < 18.5 ? 'Underweight' : value < 25 ? 'Normal Weight' : value < 30 ? 'Overweight' : 'Obese';
    return `${value.toFixed(2)} – ${category}`;
  }, [height, weight]);

  const handleDiscard = () => {
    setFirstName(INITIAL.firstName);
    setLastName(INITIAL.lastName);
    setHeight(INITIAL.height);
    setWeight(INITIAL.weight);
    setAge(INITIAL.age);
    setGoal(INITIAL.goal);
  };

  const handleSave = () => {
    console.log('Save profile', { firstName, lastName, height, weight, age, goal });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        <View className="bg-surface dark:bg-surface-dark rounded-[18px] p-4 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark text-xl font-extrabold text-center">
            {firstName} {lastName}
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center mt-1.5">
            🎯 Goal: {goal === 'muscle' ? 'Muscle Gain' : 'Weight Loss'}
          </Text>

          <View className="flex-row justify-around mt-3">
            <View className="items-center">
              <Text className="text-accent dark:text-accent-dark text-lg font-extrabold">12</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Day Streak</Text>
            </View>
            <View className="items-center">
              <Text className="text-accent dark:text-accent-dark text-lg font-extrabold">4</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Workouts</Text>
            </View>
            <View className="items-center">
              <Text className="text-accent dark:text-accent-dark text-lg font-extrabold">4.2</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">kg lost</Text>
            </View>
          </View>
        </View>

        <View className="bg-surface dark:bg-surface-dark rounded-[18px] p-4 border border-input-border dark:border-input-border-dark mb-4">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-2">
            Personal Information
          </Text>

          <View className="flex-row justify-between">
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5">
                FIRST NAME
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-2.5 rounded-[10px] border border-input-border dark:border-input-border-dark"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5">
                LAST NAME
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-2.5 rounded-[10px] border border-input-border dark:border-input-border-dark"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5">
                HEIGHT (CM)
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-2.5 rounded-[10px] border border-input-border dark:border-input-border-dark"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="w-[48%] mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5">
                CURRENT WEIGHT (KG)
              </Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-2.5 rounded-[10px] border border-input-border dark:border-input-border-dark"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholderTextColor={placeholderColor}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1 mb-3 mr-2">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5">AGE</Text>
              <TextInput
                className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-2.5 rounded-[10px] border border-input-border dark:border-input-border-dark"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholderTextColor={placeholderColor}
              />
            </View>
            <View className="flex-1 mb-3">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1.5">BMI</Text>
              <View className="bg-input dark:bg-input-dark p-2.5 rounded-[10px] border border-input-border dark:border-input-border-dark">
                <Text className="text-text-primary dark:text-text-primary-dark">
                  {bmi ?? 'Enter height & weight'}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-2 mt-[18px]">
            Select Fitness Goal
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className={`flex-1 p-3 rounded-xl mr-2.5 border items-center ${
                goal === 'muscle'
                  ? 'border-accent dark:border-accent-dark bg-accent/10 dark:bg-accent-dark/10'
                  : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
              }`}
              onPress={() => setGoal('muscle')}
            >
              <Text className="text-2xl">💪</Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold mt-1.5">
                Muscle Gain
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Build lean muscle mass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 p-3 rounded-xl border items-center ${
                goal === 'loss'
                  ? 'border-accent dark:border-accent-dark bg-accent/10 dark:bg-accent-dark/10'
                  : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
              }`}
              onPress={() => setGoal('loss')}
            >
              <Text className="text-2xl">🔥</Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold mt-1.5">
                Weight Loss
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">Burn fat efficiently</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mt-3.5">
            <TouchableOpacity
              className="bg-transparent border border-input-border dark:border-input-border-dark py-2.5 px-3 rounded-[10px]"
              onPress={handleDiscard}
            >
              <Text className="text-text-muted dark:text-text-muted-dark">Discard Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-accent dark:bg-accent-dark py-2.5 px-4 rounded-[10px]"
              onPress={handleSave}
            >
              <Text className="text-background dark:text-background-dark font-bold">Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-2">
          Calendar & Tracker
        </Text>
        <View className="bg-surface dark:bg-surface-dark rounded-[14px] p-3 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark text-center font-bold mb-2">
            May 2026
          </Text>
          <View className="flex-row flex-wrap">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i + 1;
              const isToday = calendarDays.has(day);
              const isPartial = partialDays.has(day);
              const inMonth = day <= 31;
              return (
                <View
                  key={i}
                  className={`w-[14.28%] p-1.5 items-center justify-center ${!inMonth ? 'opacity-20' : ''}`}
                >
                  {inMonth ? (
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        isToday
                          ? 'bg-accent dark:bg-accent-dark'
                          : isPartial
                          ? 'bg-[#FFD166]'
                          : 'bg-input dark:bg-input-dark'
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          isToday || isPartial
                            ? 'text-background dark:text-background-dark'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View className="flex-row justify-around mt-2">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-accent dark:bg-accent-dark" />
              <Text className="text-text-muted dark:text-text-muted-dark">Done</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-[#FFD166]" />
              <Text className="text-text-muted dark:text-text-muted-dark">Partial</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-input dark:bg-input-dark" />
              <Text className="text-text-muted dark:text-text-muted-dark">Rest</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between mb-3">
          <View className="bg-surface dark:bg-surface-dark rounded-xl p-3 items-center flex-1 mr-2">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-lg">12</Text>
            <Text className="text-text-muted dark:text-text-muted-dark">Day Streak</Text>
          </View>
          <View className="bg-surface dark:bg-surface-dark rounded-xl p-3 items-center flex-1 mr-2">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-lg">18</Text>
            <Text className="text-text-muted dark:text-text-muted-dark">Completed</Text>
          </View>
          <View className="bg-surface dark:bg-surface-dark rounded-xl p-3 items-center flex-1">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-lg">4</Text>
            <Text className="text-text-muted dark:text-text-muted-dark">Rest Days</Text>
          </View>
        </View>

        <View className="bg-surface dark:bg-surface-dark rounded-xl p-3 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-muted dark:text-text-muted-dark font-bold mb-1.5">Weekly Goal</Text>
          <View className="h-2 bg-input dark:bg-input-dark rounded-lg overflow-hidden">
            <View className="h-2 w-[71%] bg-accent dark:bg-accent-dark" />
          </View>
          <Text className="text-text-muted dark:text-text-muted-dark mt-2">5 / 7 days completed · 71%</Text>
        </View>

        <View className="bg-surface dark:bg-surface-dark rounded-xl p-3 border border-input-border dark:border-input-border-dark mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-2">
            Today's Schedule
          </Text>

          <View className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-[10px] bg-input dark:bg-input-dark items-center justify-center mr-2.5">
              <Text>🏃‍♂️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold">Morning Run</Text>
              <Text className="text-text-muted dark:text-text-muted-dark">7:00 AM · 30 min</Text>
            </View>
            <Text className="text-accent dark:text-accent-dark font-extrabold ml-2">✓</Text>
          </View>

          <View className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-[10px] bg-input dark:bg-input-dark items-center justify-center mr-2.5">
              <Text>💪</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold">Upper Body</Text>
              <Text className="text-text-muted dark:text-text-muted-dark">10:00 AM · 45 min</Text>
            </View>
            <Text className="text-accent dark:text-accent-dark font-extrabold ml-2">✓</Text>
          </View>

          <View className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-[10px] bg-input dark:bg-input-dark items-center justify-center mr-2.5">
              <Text>🧘</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold">Evening Yoga</Text>
              <Text className="text-text-muted dark:text-text-muted-dark">6:00 PM · 20 min</Text>
            </View>
            <TouchableOpacity className="bg-accent dark:bg-accent-dark px-2.5 py-1.5 rounded-lg">
              <Text className="text-background dark:text-background-dark font-bold">Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}