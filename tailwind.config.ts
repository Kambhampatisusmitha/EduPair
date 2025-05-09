import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Color Palette
        "deep-indigo": "#2D3047", // Primary background, headers, footers
        "royal-purple": "#3A3E88", // Primary actions, "Teach" elements
        "teal": "#5BC0BE", // Secondary actions, "Learn" elements
        "amber": "#D7A84A", // Accents, highlights, CTAs
        "rich-cream": "#F5F5F5", // Light backgrounds, cards, text areas

        // Extended Color System
        "nightshade": "#1D1E33", // Dark mode background
        "lavender": "#AEB8FE", // Lighter accents, hover states
        "aqua-breeze": "#8CDCD9", // Lighter accents for teal
        "sunlight": "#FFDD99", // Lighter variant of amber
        "charcoal": "#494A61", // Text on light backgrounds
        "snow": "#FFFFFF", // Primary text on dark backgrounds
        "success": "#46B37E", // Positive states
        "alert": "#FF9770", // Warnings
        "error": "#F25F5C", // Error states
        
        // Semantic mappings
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          dark: "#5A5FA0", // Darker variant for active states
          light: "#8B8FD6", // Lighter variant for hover states
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          dark: "#4A9E9D", // Darker variant for active states
          light: "#7ACFCD", // Lighter variant for hover states
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          dark: "#E0AA3E", // Darker variant for active states
          light: "#FFD580", // Lighter variant for hover states
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        teach: "var(--teach)",
        learn: "var(--learn)",
        status: {
          accepted: "#46B37E",
          pending: "#FF9770",
          declined: "#F25F5C",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Playfair Display", "serif"],
      },
      fontSize: {
        // Typography scale
        "h1": ["48px", { lineHeight: "1.2", fontWeight: "700" }],
        "h2": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
        "h3": ["28px", { lineHeight: "1.3", fontWeight: "700" }],
        "h4": ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "small": ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        "button": ["16px", { lineHeight: "1", fontWeight: "600" }],
        "nav": ["16px", { lineHeight: "1", fontWeight: "500" }],
      },
      borderRadius: {
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "pill": "9999px",
      },
      boxShadow: {
        "card-light": "0px 8px 24px rgba(45, 48, 71, 0.08)",
        "card-dark": "0px 8px 24px rgba(0, 0, 0, 0.2)",
        "elevated": "0px 12px 32px rgba(45, 48, 71, 0.12)",
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
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(20px)", opacity: "0" },
        },
        "pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        "scale-out": "scale-out 0.25s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "pulse": "pulse 2s ease-in-out infinite",
      },
      transitionDuration: {
        "DEFAULT": "300ms",
        "fast": "200ms",
        "slow": "400ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
