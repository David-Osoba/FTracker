/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'backdrop-blur-xl',
    'backdrop-blur-2xl', 
    'backdrop-blur-3xl',
    'bg-white/5',
    'bg-white/10',
    'border-white/10',
    'border-white/20',
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#0D0D1A',
        primary: '#7C5CFC',
        secondary: '#C850C0',
        highlight: '#F7971E',
        success: '#00F5A0',
        danger: '#FF4D6D',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #7C5CFC 0%, #C850C0 50%, #F7971E 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(124, 92, 252, 0.3)',
        'neon-strong': '0 0 30px rgba(124, 92, 252, 0.5), 0 0 10px rgba(200, 80, 192, 0.3)',
      }
    },
  },
  plugins: [],
}
