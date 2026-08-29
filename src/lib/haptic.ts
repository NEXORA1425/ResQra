/**
 * Safe haptic tactile confirmation utility using standard Navigator.vibrate API.
 * Provides custom vibration signatures for central operators and responders in high-stress settings.
 */
export const hapticFeedback = {
  /**
   * Triggers a specific vibration pattern safely.
   * @param pattern - Duration in ms (number) or vibration/pause sequence (number[])
   */
  vibrate: (pattern: number | number[]) => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
      return false;
    }
    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Navigator.vibrate was blocked or failed:', error);
      return false;
    }
  },

  /**
   * Tactical double-pulse vibration for a successful resource dispatch transmission.
   * Pattern: Vibrate 100ms, pause 50ms, vibrate 120ms.
   */
  triggerDispatch: () => {
    return hapticFeedback.vibrate([100, 50, 120]);
  },

  /**
   * Satisfying, solid haptic confirm for incident stabilization / resolution.
   * Pattern: Vibrate 180ms.
   */
  triggerResolve: () => {
    return hapticFeedback.vibrate(180);
  },

  /**
   * Short, crisp warning pulse for errors, alerts, or active alarms.
   * Pattern: Vibrate 60ms.
   */
  triggerNotification: () => {
    return hapticFeedback.vibrate(60);
  }
};
