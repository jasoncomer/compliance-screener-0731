/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn/ui design system colors
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
        
        // Blockscout brand colors (from Ant Design variables)
        brand: {
          primary: "var(--bs-primary)",
          "primary-dark": "var(--bs-primary-dark)",
          secondary: "var(--bs-secondary)",
        },
        
        // Semantic colors matching Ant Design
        success: {
          DEFAULT: "var(--bs-success)",
          dark: "var(--bs-success-dark)",
        },
        warning: {
          DEFAULT: "var(--bs-warning)",
          dark: "var(--bs-warning-dark)",
        },
        danger: {
          DEFAULT: "var(--bs-danger)",
          dark: "var(--bs-danger-dark)",
        },
        info: {
          DEFAULT: "var(--bs-info)",
          dark: "var(--bs-info-dark)",
        },
        
        // Extended gray scale to match Ant Design
        gray: {
          50: "var(--bs-gray-50)",
          100: "var(--bs-gray-100)",
          200: "var(--bs-gray-200)",
          300: "var(--bs-gray-300)",
          400: "var(--bs-gray-400)",
          500: "var(--bs-gray-500)",
          600: "var(--bs-gray-600)",
          700: "var(--bs-gray-700)",
          800: "var(--bs-gray-800)",
          900: "var(--bs-gray-900)",
        },
        
        // Attribution specific colors
        attribution: {
          DEFAULT: "var(--bs-attribution)",
          light: "var(--bs-attribution-light)",
          hover: "var(--bs-attribution-hover)",
          reference: "var(--bs-attribution-reference)",
          "reference-hover": "var(--bs-attribution-reference-hover)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        fadeIn: 'fadeIn 0.5s cubic-bezier(0.3, 0, 0.7, 1) forwards',
        fadeOut: 'fadeOut 0.5s cubic-bezier(0.3, 0, 0.7, 1) forwards',
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
      },
    },
  },
  plugins: [],
} 