import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
} from 'react-native';

export default function Settings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true);
<ScrollView className="flex-1" contentContainerClassName="px-5 pb-20"></ScrollView>
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        <Text className="mb-1 text-[28px] font-extrabold text-text-primary dark:text-text-primary-dark">
          Settings
        </Text>

        <Text className="mb-5 text-sm text-text-muted dark:text-text-muted-dark">
          Manage your account preferences
        </Text>

        <View className="rounded-xl border border-input-border bg-surface p-3 dark:border-input-border-dark dark:bg-surface-dark">

          <Text className="mb-2 font-bold text-text-primary dark:text-text-primary-dark">
            Account & Security
          </Text>

          <Pressable
            className="flex-row items-center border-t border-input-border py-3"
            onPress={() => console.log('Reset Password')}
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
              <Text className="text-lg">🔒</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Change your account password
              </Text>
            </View>

            <Text className="text-xl text-text-muted dark:text-text-muted-dark">
              ›
            </Text>
          </Pressable>


          <View className="flex-row items-center border-t border-input-border py-3">

            <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
              <Text className="text-lg">🛡️</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                Two-Factor Auth
              </Text>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Extra layer of security
              </Text>
            </View>

            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              thumbColor="#FFFFFF"
              trackColor={{
                false: '#2A3346',
                true: '#00B386',
              }}
            />

          </View>
        </View>


        <View className="mt-3 rounded-xl border border-input-border bg-surface p-3">

          <Text className="mb-2 font-bold text-text-primary dark:text-text-primary-dark">
            Support
          </Text>

          {[
            ['💬', 'Contact Support', 'Get help from our team'],
            ['⭐', 'Rate FitTrack', 'Share your feedback'],
            ['📄', 'Privacy Policy', 'Read our data practices'],
          ].map(([icon, title, subtitle]) => (
            <Pressable
              key={title}
              className="flex-row items-center border-t border-input-border py-3"
            >
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
                <Text className="text-lg">{icon}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                  {title}
                </Text>

                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {subtitle}
                </Text>
              </View>

              <Text className="text-xl text-text-muted dark:text-text-muted-dark">
                ›
              </Text>
            </Pressable>
          ))}

        </View>

        <View className="mt-3 rounded-xl border border-input-border bg-surface p-3">

          <Text className="mb-3 font-bold text-text-primary dark:text-text-primary-dark">
            Theme
          </Text>

          <Text className="text-sm text-text-muted dark:text-text-muted-dark">
            Theme switching requires NativeWind color scheme configuration.
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}