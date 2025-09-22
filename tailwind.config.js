import tailwindcssAnimate from "tailwindcss-animate";
import * as tokens from "./src/design-system/tokens";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      spacing: tokens.spacing,
      colors: {
        // Shadcn/ui design system colors (CSS variables for theme switching)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Table header color
        'table-header': '#282828',

        // Chart colors for Risk Dashboard
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },

        // Brand colors from design tokens
        brand: tokens.colors.brand,

        // Blockscout orange for Risk Dashboard
        blockscout: {
          orange: '#F58B2C',
        },

        // Semantic colors from design tokens
        success: {
          DEFAULT: tokens.colors.semantic.success,
          dark: tokens.colors.semantic.successDark,
          light: tokens.colors.semantic.successLight,
        },
        warning: {
          DEFAULT: tokens.colors.semantic.warning,
          dark: tokens.colors.semantic.warningDark,
          light: tokens.colors.semantic.warningLight,
        },
        danger: {
          DEFAULT: tokens.colors.semantic.danger,
          dark: tokens.colors.semantic.dangerDark,
          light: tokens.colors.semantic.dangerLight,
        },
        info: {
          DEFAULT: tokens.colors.semantic.info,
          dark: tokens.colors.semantic.infoDark,
          light: tokens.colors.semantic.infoLight,
        },

        // Gray scale from design tokens
        gray: tokens.colors.gray,

        // Attribution colors from design tokens
        attribution: tokens.colors.attribution,
      },
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      zIndex: tokens.zIndex,
      animation: {
        fadeIn: 'fadeIn 0.5s cubic-bezier(0.3, 0, 0.7, 1) forwards',
        fadeOut: 'fadeOut 0.5s cubic-bezier(0.3, 0, 0.7, 1) forwards',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeOut: {
          from: {
            opacity: '1',
            transform: 'translateY(0)',
          },
          to: {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
        },
        slideIn: {
          from: {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        spin: {
          to: {
            transform: 'rotate(360deg)',
          },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} 