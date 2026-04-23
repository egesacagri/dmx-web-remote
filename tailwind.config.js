/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyan: '#00D1FF',
      },
      backgroundColor: {
        dark: '#0A0A0A',
        card: '#161616',
        input: '#2D2D2D',
      },
    },
  },
  safelist: [
    'text-[#00D1FF]',
    'bg-[#0A0A0A]',
    'bg-[#161616]',
    'bg-[#2D2D2D]',
    'border-[#00D1FF]',
    'text-green-400',
    'text-yellow-500',
    'accent-[#00D1FF]',
  ],
};