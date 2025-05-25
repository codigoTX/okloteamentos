/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Cor principal
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          500: '#14b8a6', // Cor secundária para ações e botões
        },
        success: {
          500: '#22c55e', // Verde para lotes disponíveis
        },
        warning: {
          500: '#f59e0b', // Amarelo para lotes reservados
        },
        danger: {
          500: '#ef4444', // Vermelho para lotes vendidos
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
