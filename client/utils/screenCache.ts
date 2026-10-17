/**
 * In-memory session cache tracker and data snapshot store for screen loads.
 * Prevents jarring loading skeleton flashes every time a user switches tabs or screens.
 * Skeletons are only shown on the initial cold fetch; subsequent visits render
 * existing snapshot data immediately (0ms) while silently syncing in the background.
 */

export interface DashboardSnapshot {
  caloriesLogged: number;
  targetCalories: number;
  waterMl: number;
  targetWater: number;
  currentStreak: number;
  workoutSessionDone: boolean;
  activeMinutesToday: number;
  todayExercises: any[];
  isTodayRestDay: boolean;
  todayScheduledRoutine: any;
  todayCompletedWorkoutStats: any;
  workoutsThisWeek: number;
  isCheckedIn: boolean;
}

export interface FoodLogSnapshot {
  items: any[];
  waterMl: number;
  isDayCompleted: boolean;
}

export interface WorkoutsSnapshot {
  todayExercises: any[];
  completedSessionsCount: number | null;
  completedStats: any;
  todayScheduledRoutine: any;
}

class ScreenCacheManager {
  private _dashboardLoaded = false;
  private _foodLogLoaded = false;
  private _workoutsLoaded = false;
  private _profileLoaded = false;

  private _dashboardSnapshots = new Map<string, DashboardSnapshot>();
  private _foodLogSnapshots = new Map<string, FoodLogSnapshot>();
  private _workoutsSnapshots = new Map<string, WorkoutsSnapshot>();
  private _foodHistoryCache = new Map<string, any[]>();
  private _workoutHistoryCache = new Map<string, any[]>();
  private _pendingAiScanResult = new Map<string, any>();

  get dashboardLoaded(): boolean {
    return this._dashboardLoaded;
  }
  setDashboardLoaded(loaded: boolean) {
    this._dashboardLoaded = loaded;
  }

  get foodLogLoaded(): boolean {
    return this._foodLogLoaded;
  }
  setFoodLogLoaded(loaded: boolean) {
    this._foodLogLoaded = loaded;
  }

  get workoutsLoaded(): boolean {
    return this._workoutsLoaded;
  }
  setWorkoutsLoaded(loaded: boolean) {
    this._workoutsLoaded = loaded;
  }

  get profileLoaded(): boolean {
    return this._profileLoaded;
  }
  setProfileLoaded(loaded: boolean) {
    this._profileLoaded = loaded;
  }

  // Dashboard Snapshots
  getDashboardSnapshot(userId?: string): DashboardSnapshot | null {
    if (!userId) return null;
    return this._dashboardSnapshots.get(userId) || null;
  }

  setDashboardSnapshot(userId: string, data: Partial<DashboardSnapshot>) {
    if (!userId) return;
    const existing = this._dashboardSnapshots.get(userId) || {
      caloriesLogged: 0,
      targetCalories: 2000,
      waterMl: 0,
      targetWater: 2500,
      currentStreak: 0,
      workoutSessionDone: false,
      activeMinutesToday: 0,
      todayExercises: [],
      isTodayRestDay: false,
      todayScheduledRoutine: null,
      todayCompletedWorkoutStats: null,
      workoutsThisWeek: 0,
      isCheckedIn: false,
    };
    this._dashboardSnapshots.set(userId, { ...existing, ...data });
    this._dashboardLoaded = true;
  }

  // Food Log Snapshots
  getFoodLogSnapshot(userId?: string): FoodLogSnapshot | null {
    if (!userId) return null;
    return this._foodLogSnapshots.get(userId) || null;
  }

  setFoodLogSnapshot(userId: string, data: Partial<FoodLogSnapshot>) {
    if (!userId) return;
    const existing = this._foodLogSnapshots.get(userId) || {
      items: [],
      waterMl: 0,
      isDayCompleted: false,
    };
    this._foodLogSnapshots.set(userId, { ...existing, ...data });
    this._foodLogLoaded = true;
  }

  // Workouts Snapshots
  getWorkoutsSnapshot(userId?: string): WorkoutsSnapshot | null {
    if (!userId) return null;
    return this._workoutsSnapshots.get(userId) || null;
  }

  setWorkoutsSnapshot(userId: string, data: Partial<WorkoutsSnapshot>) {
    if (!userId) return;
    const existing = this._workoutsSnapshots.get(userId) || {
      todayExercises: [],
      completedSessionsCount: null,
      completedStats: null,
      todayScheduledRoutine: null,
    };
    this._workoutsSnapshots.set(userId, { ...existing, ...data });
    this._workoutsLoaded = true;
  }

  // History Caches
  getFoodHistory(userId?: string): any[] | null {
    if (!userId) return null;
    return this._foodHistoryCache.get(userId) || null;
  }

  setFoodHistory(userId: string, list: any[]) {
    if (!userId) return;
    this._foodHistoryCache.set(userId, list);
  }

  getWorkoutHistory(userId?: string): any[] | null {
    if (!userId) return null;
    return this._workoutHistoryCache.get(userId) || null;
  }

  setWorkoutHistory(userId: string, list: any[]) {
    if (!userId) return;
    this._workoutHistoryCache.set(userId, list);
  }

  // Pending AI Scan Result
  getPendingAiScanResult(userId?: string): any | null {
    if (!userId) return null;
    return this._pendingAiScanResult.get(userId) || null;
  }

  setPendingAiScanResult(userId: string, result: any) {
    if (!userId) return;
    this._pendingAiScanResult.set(userId, result);
  }

  clearPendingAiScanResult(userId?: string) {
    if (!userId) return;
    this._pendingAiScanResult.delete(userId);
  }

  /**
   * Reset all session load flags upon user logout or account switch.
   */
  clearAll() {
    this._dashboardLoaded = false;
    this._foodLogLoaded = false;
    this._workoutsLoaded = false;
    this._profileLoaded = false;
    this._dashboardSnapshots.clear();
    this._foodLogSnapshots.clear();
    this._workoutsSnapshots.clear();
    this._foodHistoryCache.clear();
    this._workoutHistoryCache.clear();
    this._pendingAiScanResult.clear();
  }
}

export const screenCache = new ScreenCacheManager();
