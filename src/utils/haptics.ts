import * as Haptics from "expo-haptics";

export const hapticFeedback = {
  // Light touch feedback for tab changes and subtle button presses
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  // Medium touch feedback for actions like adding/picking items
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },

  // Heavy touch feedback for critical actions like order completion or dispatching
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },

  // Success haptic pattern for successful barcode scans
  scanSuccess: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  },

  // Error haptic pattern for failed or invalid barcode scans
  scanError: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
  },

  // Warning pattern for quantity discrepancies or missing items
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  },

  // Selection change feedback
  selection: () => {
    Haptics.selectionAsync().catch(() => {});
  },
};

export default hapticFeedback;
