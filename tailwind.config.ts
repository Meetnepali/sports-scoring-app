import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
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
        // Vibrant accent colors for dark mode
        neon: {
          blue: "#00D9FF",
          purple: "#B537F2",
          pink: "#FF0080",
          green: "#00FF94",
          orange: "#FF6B00",
          yellow: "#FFD600",
        },
        sport: {
          cricket: "#FF6B35",
          volleyball: "#4ECDC4",
          chess: "#95E1D3",
          futsal: "#F38181",
          tabletennis: "#AA96DA",
          badminton: "#FCBAD3",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out": {
          from: { transform: "translateY(0)", opacity: "1" },
          to: { transform: "translateY(10px)", opacity: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.6" },
        },
        "slide-left": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-right": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "energy-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 20px rgba(0, 217, 255, 0.3)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px rgba(0, 217, 255, 0.6)",
            transform: "scale(1.02)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "bounce-in": "bounce-in 0.4s ease-out",
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "skeleton-pulse": "skeleton-pulse 1.5s ease-in-out infinite",
        "slide-left": "slide-left 0.3s ease-out",
        "slide-right": "slide-right 0.3s ease-out",
        "energy-pulse": "energy-pulse 2s ease-in-out infinite",
      },
      backdropBlur: {
        xs: '2px',
      },
      clipPath: {
        'angular': 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
