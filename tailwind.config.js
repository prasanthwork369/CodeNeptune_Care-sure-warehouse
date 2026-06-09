/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
        "inter-extrabold": ["Inter_800ExtraBold"],
        heading: ["Inter_700Bold"],
        sans: ["Inter_400Regular"],
      },
      colors: {
        brand: {
          primary: "#0F7635",
          secondary: "#D9A95D",
          "primary-soft": "#E8F4EC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          main: "#F9F9F9",
          gray: "#F2F2F2",
        },
        text: {
          DEFAULT: "#222222",
          deep: "#1A1A1A",
          secondary: "#6A6A6A",
          muted: "#969696",
          blue: "#2196F3",
        },
        border: {
          DEFAULT: "#E6E6E6",
          light: "#EEEEEE",
          success: "#A0C9AF",
          warning: "#EAD2AF",
        },
        status: {
          success: "#0F7635",
          "success-bg": "#E8F4EC",
          warning: "#D9A95D",
          "warning-bg": "#F5F2DC",
          "partial-bg": "#FDF2E2",
          "completed-bg": "#E8F4EC",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
      },
    },
  },
  plugins: [],
}