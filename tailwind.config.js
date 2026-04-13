/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ufps: {
          red: '#C8102E',
          'red-dark': '#A00D24',
          'red-light': '#E8334F',
          black: '#1A1A1A',
          orange: '#E87722',
          'orange-light': '#F59B4B',
          green: '#2D6E3C',
          'green-light': '#3D8F50',
          white: '#FFFFFF',
          gray: {
            50: '#F8F9FA',
            100: '#F1F3F5',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#868E96',
            700: '#495057',
            800: '#343A40',
            900: '#212529',
          },
        },
      },
      fontFamily: {
        heading: ['"DM Sans"', 'sans-serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
