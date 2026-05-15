/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#6C3CE0',
        primaryLight: '#8B5CF6',
        primaryDark: '#5B21B6',
        secondary: '#3B82F6',
        accent: '#D946EF',
        bg: '#0F0F1A',
        bgCard: '#1A1A2E',
        bgElevated: '#242442',
      }
    },
  },
  plugins: [],
}
