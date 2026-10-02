import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

export interface BodyAnatomyMapProps {
  primaryMuscle?: string;
  secondaryMuscles?: string[] | string;
  category?: string;
  size?: 'sm' | 'md' | 'lg' | 'compact';
  showToggle?: boolean;
  initialView?: 'front' | 'back' | 'both';
  interactive?: boolean;
}

type MuscleRole = 'primary' | 'secondary' | 'none';

export function categorizeMuscle(
  muscleName: string,
  primaryTarget: string,
  secondaryTargets: string[]
): MuscleRole {
  const normName = muscleName.toLowerCase();
  const normPrimary = primaryTarget.toLowerCase();

  const isPrimary =
    normPrimary.includes(normName) ||
    normName.includes(normPrimary) ||
    (normName === 'chest' && (normPrimary.includes('pec') || normPrimary.includes('chest'))) ||
    (normName === 'lats' && (normPrimary.includes('back') || normPrimary.includes('lat'))) ||
    (normName === 'traps' && (normPrimary.includes('back') || normPrimary.includes('trap'))) ||
    (normName === 'quads' && (normPrimary.includes('leg') || normPrimary.includes('quad') || normPrimary.includes('thigh'))) ||
    (normName === 'hamstrings' && (normPrimary.includes('leg') || normPrimary.includes('hamstring'))) ||
    (normName === 'glutes' && (normPrimary.includes('glute') || normPrimary.includes('butt') || normPrimary.includes('hip'))) ||
    (normName === 'deltoids' && (normPrimary.includes('shoulder') || normPrimary.includes('delt'))) ||
    (normName === 'biceps' && (normPrimary.includes('bicep') || normPrimary.includes('arm'))) ||
    (normName === 'triceps' && (normPrimary.includes('tricep') || normPrimary.includes('arm'))) ||
    (normName === 'core' && (normPrimary.includes('ab') || normPrimary.includes('core') || normPrimary.includes('waist') || normPrimary.includes('oblique'))) ||
    (normName === 'calves' && (normPrimary.includes('calf') || normPrimary.includes('calves')));

  if (isPrimary) return 'primary';

  const isSecondary = secondaryTargets.some((sec) => {
    const normSec = sec.toLowerCase();
    return (
      normSec.includes(normName) ||
      normName.includes(normSec) ||
      (normName === 'chest' && (normSec.includes('pec') || normSec.includes('chest'))) ||
      (normName === 'lats' && (normSec.includes('back') || normSec.includes('lat'))) ||
      (normName === 'traps' && (normSec.includes('back') || normSec.includes('trap'))) ||
      (normName === 'quads' && (normSec.includes('leg') || normSec.includes('quad'))) ||
      (normName === 'hamstrings' && (normSec.includes('hamstring') || normSec.includes('leg'))) ||
      (normName === 'glutes' && normSec.includes('glute')) ||
      (normName === 'deltoids' && (normSec.includes('shoulder') || normSec.includes('delt'))) ||
      (normName === 'biceps' && normSec.includes('bicep')) ||
      (normName === 'triceps' && normSec.includes('tricep')) ||
      (normName === 'core' && (normSec.includes('ab') || normSec.includes('core') || normSec.includes('oblique'))) ||
      (normName === 'calves' && normSec.includes('calf'))
    );
  });

  if (isSecondary) return 'secondary';
  return 'none';
}

export default function BodyAnatomyMap({
  primaryMuscle = '',
  secondaryMuscles = [],
  category = '',
  size = 'md',
  showToggle = true,
  initialView = 'front',
  interactive = true,
}: BodyAnatomyMapProps) {
  const { colors, isDark } = useThemeColors();

  // Normalize secondary muscles into an array of strings
  const secList: string[] = Array.isArray(secondaryMuscles)
    ? secondaryMuscles
    : typeof secondaryMuscles === 'string' && secondaryMuscles.trim().length > 0
    ? secondaryMuscles.split(',').map((s) => s.trim())
    : [];

  // Determine which side is more relevant if not specified
  const defaultSide = React.useMemo(() => {
    if (initialView === 'back') return 'back';
    if (initialView === 'both') return 'both';
    const p = primaryMuscle.toLowerCase();
    if (p.includes('back') || p.includes('lat') || p.includes('glute') || p.includes('hamstring') || p.includes('trap')) {
      return 'back';
    }
    return 'front';
  }, [primaryMuscle, initialView]);

  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>(defaultSide);

  const primaryColor = '#10B981'; // Emerald glow for primary target
  const secondaryColor = '#06B6D4'; // Cyan for assisting synergists
  const inactiveColor = isDark ? '#272F3E' : '#E2E8F0';
  const inactiveBorder = isDark ? '#374151' : '#CBD5E1';

  const getStyleForMuscle = (muscleKey: string) => {
    const role = categorizeMuscle(muscleKey, primaryMuscle, secList);
    if (role === 'primary') {
      return {
        backgroundColor: primaryColor,
        borderColor: '#34D399',
        borderWidth: 1.5,
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 5,
        elevation: 3,
      };
    }
    if (role === 'secondary') {
      return {
        backgroundColor: secondaryColor,
        borderColor: '#38BDF8',
        borderWidth: 1,
        opacity: 0.9,
      };
    }
    return {
      backgroundColor: inactiveColor,
      borderColor: inactiveBorder,
      borderWidth: 1,
    };
  };

  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.15 : size === 'compact' ? 0.55 : 0.95;

  const renderFrontSilhouette = () => (
    <View className="items-center" style={{ width: 130 * scale, height: 230 * scale }}>
      {/* Head */}
      <View
        style={[
          {
            width: 26 * scale,
            height: 32 * scale,
            borderRadius: 16 * scale,
            marginBottom: 3 * scale,
          },
          getStyleForMuscle('head'),
        ]}
      />

      {/* Shoulders & Chest & Arms Row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Left Bicep / Arm */}
        <View style={{ alignItems: 'center', marginRight: 3 * scale }}>
          <View
            style={[
              {
                width: 14 * scale,
                height: 38 * scale,
                borderRadius: 7 * scale,
                marginBottom: 2 * scale,
              },
              getStyleForMuscle('biceps'),
            ]}
          />
          <View
            style={[
              {
                width: 11 * scale,
                height: 34 * scale,
                borderRadius: 6 * scale,
              },
              getStyleForMuscle('forearms'),
            ]}
          />
        </View>

        {/* Torso: Shoulders, Chest & Core */}
        <View style={{ alignItems: 'center', width: 66 * scale }}>
          {/* Deltoids & Clavicle Bar */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: 2 * scale,
            }}
          >
            <View
              style={[
                {
                  width: 20 * scale,
                  height: 18 * scale,
                  borderRadius: 9 * scale,
                },
                getStyleForMuscle('deltoids'),
              ]}
            />
            <View
              style={[
                {
                  width: 20 * scale,
                  height: 18 * scale,
                  borderRadius: 9 * scale,
                },
                getStyleForMuscle('deltoids'),
              ]}
            />
          </View>

          {/* Chest (Pecs) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 58 * scale,
              marginBottom: 3 * scale,
            }}
          >
            <View
              style={[
                {
                  width: 27 * scale,
                  height: 25 * scale,
                  borderTopLeftRadius: 6 * scale,
                  borderBottomLeftRadius: 12 * scale,
                  borderBottomRightRadius: 6 * scale,
                },
                getStyleForMuscle('chest'),
              ]}
            />
            <View
              style={[
                {
                  width: 27 * scale,
                  height: 25 * scale,
                  borderTopRightRadius: 6 * scale,
                  borderBottomRightRadius: 12 * scale,
                  borderBottomLeftRadius: 6 * scale,
                },
                getStyleForMuscle('chest'),
              ]}
            />
          </View>

          {/* Core (Abs & Obliques) */}
          <View
            style={[
              {
                width: 44 * scale,
                height: 40 * scale,
                borderRadius: 8 * scale,
                marginBottom: 3 * scale,
              },
              getStyleForMuscle('core'),
            ]}
          />
        </View>

        {/* Right Bicep / Arm */}
        <View style={{ alignItems: 'center', marginLeft: 3 * scale }}>
          <View
            style={[
              {
                width: 14 * scale,
                height: 38 * scale,
                borderRadius: 7 * scale,
                marginBottom: 2 * scale,
              },
              getStyleForMuscle('biceps'),
            ]}
          />
          <View
            style={[
              {
                width: 11 * scale,
                height: 34 * scale,
                borderRadius: 6 * scale,
              },
              getStyleForMuscle('forearms'),
            ]}
          />
        </View>
      </View>

      {/* Legs Row (Quads & Calves) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 58 * scale,
          marginTop: 1 * scale,
        }}
      >
        {/* Left Quad & Calf */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={[
              {
                width: 24 * scale,
                height: 52 * scale,
                borderRadius: 9 * scale,
                marginBottom: 3 * scale,
              },
              getStyleForMuscle('quads'),
            ]}
          />
          <View
            style={[
              {
                width: 18 * scale,
                height: 44 * scale,
                borderRadius: 8 * scale,
              },
              getStyleForMuscle('calves'),
            ]}
          />
        </View>

        {/* Right Quad & Calf */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={[
              {
                width: 24 * scale,
                height: 52 * scale,
                borderRadius: 9 * scale,
                marginBottom: 3 * scale,
              },
              getStyleForMuscle('quads'),
            ]}
          />
          <View
            style={[
              {
                width: 18 * scale,
                height: 44 * scale,
                borderRadius: 8 * scale,
              },
              getStyleForMuscle('calves'),
            ]}
          />
        </View>
      </View>
    </View>
  );

  const renderBackSilhouette = () => (
    <View className="items-center" style={{ width: 130 * scale, height: 230 * scale }}>
      {/* Head / Neck */}
      <View
        style={[
          {
            width: 26 * scale,
            height: 32 * scale,
            borderRadius: 16 * scale,
            marginBottom: 3 * scale,
          },
          getStyleForMuscle('head'),
        ]}
      />

      {/* Traps & Shoulders & Triceps Row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Left Tricep / Arm */}
        <View style={{ alignItems: 'center', marginRight: 3 * scale }}>
          <View
            style={[
              {
                width: 14 * scale,
                height: 38 * scale,
                borderRadius: 7 * scale,
                marginBottom: 2 * scale,
              },
              getStyleForMuscle('triceps'),
            ]}
          />
          <View
            style={[
              {
                width: 11 * scale,
                height: 34 * scale,
                borderRadius: 6 * scale,
              },
              getStyleForMuscle('forearms'),
            ]}
          />
        </View>

        {/* Back Torso */}
        <View style={{ alignItems: 'center', width: 66 * scale }}>
          {/* Upper Traps & Rear Delts */}
          <View
            style={[
              {
                width: 58 * scale,
                height: 24 * scale,
                borderTopLeftRadius: 12 * scale,
                borderTopRightRadius: 12 * scale,
                marginBottom: 2 * scale,
              },
              getStyleForMuscle('traps'),
            ]}
          />

          {/* Lats (Latissimus Dorsi) */}
          <View
            style={[
              {
                width: 54 * scale,
                height: 36 * scale,
                borderBottomLeftRadius: 14 * scale,
                borderBottomRightRadius: 14 * scale,
                marginBottom: 3 * scale,
              },
              getStyleForMuscle('lats'),
            ]}
          />

          {/* Glutes */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 56 * scale,
              marginBottom: 2 * scale,
            }}
          >
            <View
              style={[
                {
                  width: 26 * scale,
                  height: 24 * scale,
                  borderRadius: 12 * scale,
                },
                getStyleForMuscle('glutes'),
              ]}
            />
            <View
              style={[
                {
                  width: 26 * scale,
                  height: 24 * scale,
                  borderRadius: 12 * scale,
                },
                getStyleForMuscle('glutes'),
              ]}
            />
          </View>
        </View>

        {/* Right Tricep / Arm */}
        <View style={{ alignItems: 'center', marginLeft: 3 * scale }}>
          <View
            style={[
              {
                width: 14 * scale,
                height: 38 * scale,
                borderRadius: 7 * scale,
                marginBottom: 2 * scale,
              },
              getStyleForMuscle('triceps'),
            ]}
          />
          <View
            style={[
              {
                width: 11 * scale,
                height: 34 * scale,
                borderRadius: 6 * scale,
              },
              getStyleForMuscle('forearms'),
            ]}
          />
        </View>
      </View>

      {/* Hamstrings & Calves */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 58 * scale,
          marginTop: 1 * scale,
        }}
      >
        {/* Left Hamstring & Calf */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={[
              {
                width: 24 * scale,
                height: 52 * scale,
                borderRadius: 9 * scale,
                marginBottom: 3 * scale,
              },
              getStyleForMuscle('hamstrings'),
            ]}
          />
          <View
            style={[
              {
                width: 18 * scale,
                height: 44 * scale,
                borderRadius: 8 * scale,
              },
              getStyleForMuscle('calves'),
            ]}
          />
        </View>

        {/* Right Hamstring & Calf */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={[
              {
                width: 24 * scale,
                height: 52 * scale,
                borderRadius: 9 * scale,
                marginBottom: 3 * scale,
              },
              getStyleForMuscle('hamstrings'),
            ]}
          />
          <View
            style={[
              {
                width: 18 * scale,
                height: 44 * scale,
                borderRadius: 8 * scale,
              },
              getStyleForMuscle('calves'),
            ]}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View className="rounded-2xl p-3.5 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center">
      {/* View Switcher Controls */}
      {showToggle && (
        <View className="flex-row items-center justify-between w-full mb-3 px-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="body-outline" size={16} color={colors.accent} />
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Target Muscle Anatomy
            </Text>
          </View>

          <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-xl border border-input-border dark:border-input-border-dark">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSide('front')}
              className={`px-2.5 py-1 rounded-lg ${
                activeSide === 'front' ? 'bg-accent' : ''
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold ${
                  activeSide === 'front'
                    ? 'text-white'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Front
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSide('back')}
              className={`px-2.5 py-1 rounded-lg ${
                activeSide === 'back' ? 'bg-accent' : ''
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold ${
                  activeSide === 'back'
                    ? 'text-white'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSide('both')}
              className={`px-2.5 py-1 rounded-lg ${
                activeSide === 'both' ? 'bg-accent' : ''
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold ${
                  activeSide === 'both'
                    ? 'text-white'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Silhouettes Stage */}
      <View className="flex-row items-center justify-center gap-6 my-1">
        {(activeSide === 'front' || activeSide === 'both') && (
          <View className="items-center">
            {renderFrontSilhouette()}
            <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark mt-2 uppercase tracking-wide">
              Anterior (Front)
            </Text>
          </View>
        )}

        {(activeSide === 'back' || activeSide === 'both') && (
          <View className="items-center">
            {renderBackSilhouette()}
            <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark mt-2 uppercase tracking-wide">
              Posterior (Back)
            </Text>
          </View>
        )}
      </View>

      {/* Legend & Breakdown Badges */}
      <View className="w-full mt-3 pt-3 border-t border-input-border/60 dark:border-input-border-dark/60 flex-row flex-wrap items-center justify-around gap-2">
        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: primaryColor,
              shadowColor: primaryColor,
              shadowOpacity: 0.8,
              shadowRadius: 3,
            }}
          />
          <Text className="text-[11px] font-extrabold text-text-primary dark:text-text-primary-dark">
            Primary Target: <Text style={{ color: primaryColor }}>{primaryMuscle || 'Target Muscle'}</Text>
          </Text>
        </View>

        {secList.length > 0 && (
          <View className="flex-row items-center gap-1.5">
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: secondaryColor,
              }}
            />
            <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
              Assisting: <Text style={{ color: secondaryColor }}>{secList.join(', ')}</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
