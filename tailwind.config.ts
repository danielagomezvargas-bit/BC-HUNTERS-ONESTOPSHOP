import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mp: {
          yellow:  '#FFE600',
          navy:    '#1A1F71',
          blue:    '#009EE3',
          dark:    '#333333',
        },
      },
    },
  },
  plugins: [],
}
export default config
