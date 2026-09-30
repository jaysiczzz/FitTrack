import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useState, useEffect } from 'react';

export type WeightUnit = 'KG' | 'LBS';

export const KG_TO_LBS_FACTOR = 2.20462;
const STORAGE_KEY = 'fittrack_preferred_weight_unit';

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS_FACTOR * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS_FACTOR) * 10) / 10;
}

export function convertFromKg(kg: number, targetUnit: WeightUnit): number {
  if (targetUnit === 'LBS') {
    return kgToLbs(kg);
  }
  return Math.round(kg * 10) / 10;
}

export function convertToKg(value: number, sourceUnit: WeightUnit): number {
  if (sourceUnit === 'LBS') {
    return lbsToKg(value);
  }
  return Math.round(value * 10) / 10;
}

export function formatWeightDisplay(kg: number, unit: WeightUnit = 'KG'): string {
  const converted = convertFromKg(kg, unit);
  return `${converted} ${unit.toLowerCase()}`;
}

export async function getSavedWeightUnit(): Promise<WeightUnit> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'LBS' || saved === 'KG') {
      return saved;
    }
    return 'KG';
  } catch {
    return 'KG';
  }
}

export async function saveWeightUnit(unit: WeightUnit): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, unit);
    DeviceEventEmitter.emit('WEIGHT_UNIT_CHANGED', unit);
  } catch (err) {
    console.warn('[Units] Failed to save weight unit:', err);
  }
}

export function useWeightUnit(): [WeightUnit, (unit: WeightUnit) => Promise<void>] {
  const [unit, setUnit] = useState<WeightUnit>('KG');

  useEffect(() => {
    let isMounted = true;
    getSavedWeightUnit().then((saved) => {
      if (isMounted) setUnit(saved);
    });

    const sub = DeviceEventEmitter.addListener('WEIGHT_UNIT_CHANGED', (newUnit: WeightUnit) => {
      if (isMounted) setUnit(newUnit);
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  const changeUnit = async (newUnit: WeightUnit) => {
    setUnit(newUnit);
    await saveWeightUnit(newUnit);
  };

  return [unit, changeUnit];
}

