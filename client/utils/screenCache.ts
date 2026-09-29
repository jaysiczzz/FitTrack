/**
 * In-memory session cache tracker for screen data loads.
 * Prevents jarring loading skeleton flashes every time a user switches tabs.
 * Skeletons are only shown on the initial cold fetch; subsequent tab switches render
 * existing data immediately (0ms) while silently syncing in the background.
 */
class ScreenCacheManager {
  private _dashboardLoaded = false;
  private _foodLogLoaded = false;
  private _workoutsLoaded = false;
  private _profileLoaded = false;

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

  /**
   * Reset all session load flags upon user logout or account switch.
   */
  clearAll() {
    this._dashboardLoaded = false;
    this._foodLogLoaded = false;
    this._workoutsLoaded = false;
    this._profileLoaded = false;
  }
}

export const screenCache = new ScreenCacheManager();
