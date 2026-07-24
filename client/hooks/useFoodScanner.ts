import { useState, useCallback } from 'react';

export interface RecentScan {
  id: string;
  name: string;
  quantity?: string;
  calories: number;
  timestamp: string;
  icon?: string;
  barcode?: string;
}

const INITIAL_SCANS: RecentScan[] = [
  {
    id: '1',
    name: 'Boiled Eggs',
    quantity: '(x2)',
    calories: 155,
    timestamp: '5h ago',
    icon: '🥚',
    barcode: '123456789',
  },
  {
    id: '2',
    name: 'Banana',
    calories: 105,
    timestamp: '7h ago',
    icon: '🍌',
    barcode: '987654321',
  },
  {
    id: '3',
    name: 'Whey Protein Shake',
    calories: 120,
    timestamp: '1 day ago',
    icon: '🥤',
    barcode: '555555555',
  },
];

export const useFoodScanner = () => {
  const [recentScans, setRecentScans] = useState<RecentScan[]>(INITIAL_SCANS);

  const addScan = useCallback(
    (scan: Omit<RecentScan, 'id' | 'timestamp'>) => {
      const newScan: RecentScan = {
        ...scan,
        id: Date.now().toString(),
        timestamp: 'just now',
      };
      setRecentScans((prev) => [newScan, ...prev]);
    },
    []
  );

  const removeScan = useCallback((id: string) => {
    setRecentScans((prev) => prev.filter((scan) => scan.id !== id));
  }, []);

  const clearAllScans = useCallback(() => {
    setRecentScans([]);
  }, []);

  const searchScans = useCallback(
    (query: string): RecentScan[] => {
      return recentScans.filter((scan) =>
        scan.name.toLowerCase().includes(query.toLowerCase()) ||
        scan.barcode?.includes(query)
      );
    },
    [recentScans]
  );

  return {
    recentScans,
    addScan,
    removeScan,
    clearAllScans,
    searchScans,
  };
};
