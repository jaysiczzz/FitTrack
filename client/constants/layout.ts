/**
 * FitTrack Layout and Spacing System
 * Unified tokens for safe insets, floating navigation bar clearance, and screen containers.
 */

export const LAYOUT = {
  // Height of the floating bottom navigation bar
  NAV_BAR_BASE_HEIGHT: 64,

  /**
   * Calculates bottom padding for scroll views on screens displaying the FloatingNavBar.
   * Ensures content clears the floating bar with generous breathing room across all device form factors.
   */
  getTabBarPadding: (bottomInset: number = 0): number => {
    return Math.max(108, 64 + Math.max(8, bottomInset) + 24);
  },

  /**
   * Calculates bottom padding for standalone screens (screens with back buttons that hide the bottom bar).
   */
  getScreenBottomPadding: (bottomInset: number = 0): number => {
    return Math.max(28, bottomInset + 16);
  },

  // Max widths for clean container scaling on tablets and web
  MAX_CONTENT_WIDTH: 440,
  MAX_MODAL_WIDTH: 480,
};
