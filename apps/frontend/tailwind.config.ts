import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080c14',
        card: '#101826',
        accent: '#4cc9f0'
      }
    }
  }
};

export default config;
