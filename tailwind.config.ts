import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
         sidebar: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--primary) / 0.9)',
          border: 'hsl(var(--primary) / 0.1)',
          accent: 'hsl(var(--primary) / 0.1)',
          'accent-foreground': 'hsl(var(--primary))',
          ring: 'hsl(var(--primary) / 0.5)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'branded-loader-glow': {
            '0%, 100%': {
              filter: 'drop-shadow(0 0 4px hsl(var(--accent) / 0.8))',
            },
            '50%': {
              filter: 'drop-shadow(0 0 12px hsl(var(--accent) / 1))',
            },
        },
        'branded-loader-shake': {
            '0%': { transform: 'translate(1px, 1px) rotate(0deg)' },
            '10%': { transform: 'translate(-1px, -2px) rotate(-1deg)' },
            '20%': { transform: 'translate(-3px, 0px) rotate(1deg)' },
            '30%': { transform: 'translate(3px, 2px) rotate(0deg)' },
            '40%': { transform: 'translate(1px, -1px) rotate(1deg)' },
            '50%': { transform: 'translate(-1px, 2px) rotate(-1deg)' },
            '60%': { transform: 'translate(-3px, 1px) rotate(0deg)' },
            '70%': { transform: 'translate(3px, 1px) rotate(-1deg)' },
            '80%': { transform: 'translate(-1px, -1px) rotate(1deg)' },
            '90%': { transform: 'translate(1px, 2px) rotate(0deg)' },
            '100%': { transform: 'translate(1px, -2px) rotate(-1deg)' },
        },
        'bounce-down': {
            '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateY(0)',
            },
            '40%': {
                transform: 'translateY(-15px)',
            },
            '60%': {
                transform: 'translateY(-8px)',
            },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'branded-loader-glow': 'branded-loader-glow 2s ease-in-out infinite',
        'branded-loader-shake': 'branded-loader-shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite',
        'bounce-down': 'bounce-down 2s ease-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
