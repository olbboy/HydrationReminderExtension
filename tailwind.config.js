/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx}',
    './popup.html',
    './index.html'
  ],
  theme: {
    container: {
      center: true,
      padding: "0.5rem",
      screens: {
        "2xl": "400px",
      },
    },
    extend: {
      colors: {
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
        water: {
          light: "#4fa7ff",
          DEFAULT: "#2196f3",
          dark: "#0c7cd5",
          foreground: "white",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      keyframes: {
        "ripple": {
          "0%": { transform: "scale(0)", opacity: 1 },
          "100%": { transform: "scale(4)", opacity: 0 },
        },
        "wave": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(0)" },
        },
        "drop": {
          "0%": { transform: "scale(0) translateY(-100px)", opacity: 0 },
          "70%": { transform: "scale(1.2) translateY(0)", opacity: 1 },
          "100%": { transform: "scale(1) translateY(0)", opacity: 1 },
        },
        "toast-in": {
          "0%": { transform: "translateY(100%)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "toast-out": {
          "0%": { transform: "translateY(0)", opacity: 1 },
          "100%": { transform: "translateY(100%)", opacity: 0 },
        },
      },
      animation: {
        "ripple": "ripple 0.8s ease-out",
        "wave": "wave 1.5s ease-in-out infinite",
        "drop": "drop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "toast-in": "toast-in 0.3s forwards",
        "toast-out": "toast-out 0.3s forwards",
      },
    },
  },
  plugins: [],
}; 