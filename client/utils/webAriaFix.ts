import { Platform } from 'react-native';

/**
 * Fix for React Native Web / Chrome 120+ W3C ARIA violation:
 * When React Native Web (e.g. Modals, screen transitions, or Stack navigators) sets
 * aria-hidden="true" on an ancestor container while an interactive descendant retains focus
 * (such as a clicked button or input), modern browsers block the aria-hidden attribute and log:
 * "Blocked aria-hidden on an element because its descendant retained focus."
 *
 * This utility safely intercepts aria-hidden mutations on Web and blurs any actively
 * focused descendant before aria-hidden="true" is applied, guaranteeing full compliance
 * with the W3C WAI-ARIA specification and keeping assistive technology unblocked.
 */
export function initWebAriaFix(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof Element === 'undefined') {
    return;
  }

  try {
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name: string, value: string) {
      if (name === 'aria-hidden' && (value === 'true' || value === '')) {
        try {
          if (
            typeof document !== 'undefined' &&
            document.activeElement &&
            document.activeElement !== document.body
          ) {
            if (this.contains(document.activeElement)) {
              (document.activeElement as HTMLElement)?.blur?.();
            }
          }
        } catch {
          // Ignore DOM query errors in special edge cases
        }
      }
      return originalSetAttribute.apply(this, [name, value]);
    };

    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'ariaHidden');
    if (desc && desc.set) {
      const originalSet = desc.set;
      Object.defineProperty(Element.prototype, 'ariaHidden', {
        ...desc,
        set(val: any) {
          if (val === 'true' || val === true) {
            try {
              if (
                typeof document !== 'undefined' &&
                document.activeElement &&
                document.activeElement !== document.body
              ) {
                if (this.contains(document.activeElement)) {
                  (document.activeElement as HTMLElement)?.blur?.();
                }
              }
            } catch {
              // Ignore DOM query errors
            }
          }
          return originalSet.call(this, val);
        },
      });
    }
  } catch (err) {
    // Graceful fallback if DOM prototypes cannot be extended
  }
}
