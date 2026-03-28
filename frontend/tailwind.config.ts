import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        app: {
          background: '#eef2f5',
          panel: '#ffffff',
          panelMuted: '#f6f8fa',
          border: '#aab4be',
          borderLight: '#d8dee5',
          text: '#1f2933',
          textMuted: '#596674',
          primary: '#2f5d85',
          primaryHover: '#244968',
          success: '#2f6b40',
          warning: '#9a6a21',
          danger: '#9a3c2d',
          navBg: '#485766',
          navText: '#dfe7ee',
          navActive: '#ffffff',
          headerBg: '#34414d',
          headerText: '#f8fbff',
          toolbar: '#f3f6f9',
        },
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 1px rgba(31,41,51,0.05)',
        inset: 'inset 0 1px 1px rgba(89,102,116,0.08)',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
