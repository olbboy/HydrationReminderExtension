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
        health: {
          good: "#22c55e",
          moderate: "#f59e0b",
          poor: "#ef4444"
        },
        themes: {
          blue: "hsl(var(--theme-blue))",
          green: "hsl(var(--theme-green))",
          purple: "hsl(var(--theme-purple))",
          orange: "hsl(var(--theme-orange))",
        }
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
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: 0.5 },
          "50%": { opacity: 0.2 },
          "100%": { transform: "scale(1.8)", opacity: 0 },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)", opacity: 1 },
          "100%": { transform: "translateX(100%)", opacity: 0 },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.8)", opacity: 0 },
          "70%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
      animation: {
        "ripple": "ripple 0.8s ease-out",
        "wave": "wave 1.5s ease-in-out infinite",
        "drop": "drop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "toast-in": "toast-in 0.3s forwards",
        "toast-out": "toast-out 0.3s forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "slide-in-right": "slide-in-right 0.3s forwards",
        "slide-out-right": "slide-out-right 0.3s forwards",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      backgroundImage: {
        'wave-pattern': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 120\" preserveAspectRatio=\"none\"%3E%3Cpath d=\"M0,0 C150,20 300,0 450,20 C600,40 750,20 900,40 C1050,60 1200,40 1200,40 L1200,120 L0,120 Z\" fill=\"white\" opacity=\"0.3\"/%3E%3C/svg%3E')",
      },
      screens: {
        'xs': '400px',
      },
      scrollbar: {
        thin: '3px',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}; 