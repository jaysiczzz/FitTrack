import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useState, useEffect } from 'react';

export type WeightUnit = 'KG' | 'LBS';
export type HeightUnit = 'CM' | 'FT_IN';

export const KG_TO_LBS_FACTOR = 2.20462;
export const CM_PER_INCH = 2.54;

const WEIGHT_STORAGE_KEY = 'fittrack_preferred_weight_unit';
const HEIGHT_STORAGE_KEY = 'fittrack_preferred_height_unit';

// ==================== WEIGHT HELPERS ====================

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
  if (!kg) return '-';
  const converted = convertFromKg(kg, unit);
  return `${converted} ${unit.toLowerCase()}`;
}

export async function getSavedWeightUnit(): Promise<WeightUnit> {
  try {
    const saved = await AsyncStorage.getItem(WEIGHT_STORAGE_KEY);
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
    await AsyncStorage.setItem(WEIGHT_STORAGE_KEY, unit);
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

// ==================== HEIGHT HELPERS ====================

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  if (!cm || cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = cm / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  const totalInches = (feet || 0) * 12 + (inches || 0);
  return Math.round(totalInches * CM_PER_INCH);
}

export function formatHeightDisplay(cm: number, unit: HeightUnit = 'CM'): string {
  if (!cm) return '-';
  if (unit === 'FT_IN') {
    const { feet, inches } = cmToFtIn(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export async function getSavedHeightUnit(): Promise<HeightUnit> {
  try {
    const saved = await AsyncStorage.getItem(HEIGHT_STORAGE_KEY);
    if (saved === 'FT_IN' || saved === 'CM') {
      return saved;
    }
    return 'CM';
  } catch {
    return 'CM';
  }
}

export async function saveHeightUnit(unit: HeightUnit): Promise<void> {
  try {
    await AsyncStorage.setItem(HEIGHT_STORAGE_KEY, unit);
    DeviceEventEmitter.emit('HEIGHT_UNIT_CHANGED', unit);
  } catch (err) {
    console.warn('[Units] Failed to save height unit:', err);
  }
}

export function useHeightUnit(): [HeightUnit, (unit: HeightUnit) => Promise<void>] {
  const [unit, setUnit] = useState<HeightUnit>('CM');

  useEffect(() => {
    let isMounted = true;
    getSavedHeightUnit().then((saved) => {
      if (isMounted) setUnit(saved);
    });

    const sub = DeviceEventEmitter.addListener('HEIGHT_UNIT_CHANGED', (newUnit: HeightUnit) => {
      if (isMounted) setUnit(newUnit);
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  const changeUnit = async (newUnit: HeightUnit) => {
    setUnit(newUnit);
    await saveHeightUnit(newUnit);
  };

  return [unit, changeUnit];
}
