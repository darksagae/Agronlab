import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        agron: {
          green: '#4CAF50',
          dark: '#2c5530',
          light: '#e8f5e9',
        },
      },
    },
  },
  plugins: [],
};

export default config;
