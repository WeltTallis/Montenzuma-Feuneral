/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/components/coffins/**/*.{js,jsx,ts,tsx}',
    './src/components/leave/**/*.{js,jsx,ts,tsx}',
    './src/components/deceased/**/*.{js,jsx,ts,tsx}',
    './src/components/hearse/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};