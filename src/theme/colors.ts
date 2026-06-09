export const colors = {
    brand: {
        primary: '#0F7635',         // Main Green
        primarySoft: '#E8F4EC',
        secondary: '#D9A95D',       // Muted Amber
    },

    text: {
        DEFAULT: '#222222',        // Body Text
        deep: '#1A1A1A',           // Headings
        secondary: '#6A6A6A',      // Labels / Subtitles
        muted: '#969696',          // Placeholders
        blue: '#2196F3',           // Info
    },

    surface: {
        DEFAULT: '#FFFFFF',
        main: '#F9F9F9',           // Screen background
        gray: '#F2F2F2',           // Secondary backgrounds
    },

    border: {
        DEFAULT: '#E6E6E6',        // Standard Borders
        light: '#EEEEEE',          // Subtle Dividers
        success: '#A0C9AF',
        warning: '#EAD2AF',
    },

    status: {
        success: '#0F7635',
        successBg: '#E8F4EC',
        warning: '#D9A95D',
        warningBg: '#F5F2DC',
        partialBg: '#FDF2E2',
        completedBg: '#E8F4EC',
    },
} as const;

export type AppColor = keyof typeof colors;
export default colors;
