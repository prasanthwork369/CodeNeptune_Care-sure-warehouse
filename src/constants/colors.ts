// DEPRECATED: Use '@/src/theme/colors' instead
import { colors as themeColors } from '../theme/colors';

export const colors = {
    primary: themeColors.brand.primary,
    textDeep: themeColors.text.deep,
    textMain: themeColors.text.DEFAULT,
    textSecondary: themeColors.text.secondary,
    textMuted: themeColors.text.muted,
    border: themeColors.border.DEFAULT,
    borderLight: themeColors.border.light,
    bgMain: themeColors.surface.main,
    bgGray: themeColors.surface.gray,
    blueInfo: themeColors.text.blue,
    warning: themeColors.status.warning,
    warningBg: themeColors.status.warningBg,
    successBg: themeColors.status.successBg,
    successBorder: themeColors.border.success,
    partialBg: themeColors.status.partialBg,
    partialBorder: themeColors.border.warning,
    completedBg: themeColors.status.completedBg,
    completedBorder: themeColors.border.success,
} as const;

export type AppColor = keyof typeof colors;
