/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1F1D6B',
          gold: '#B0743C',
          white: '#FFFFFF',
        },
      },
      spacing: {
        'container': '480px',
      },
    },
  },
  plugins: [],
}
