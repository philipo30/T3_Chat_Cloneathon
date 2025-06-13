import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
      fontFamily: {
        sans: ["var(--font-metropolis)", ...defaultTheme.fontFamily.sans],
      },
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
        selected: {
          DEFAULT: "#451a32",
          foreground: "#f2c3dc",
        },
        selection: "#a3004c",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        'app-page': {
          background: 'rgb(var(--app-page-background))',
          'gradient-start': 'rgb(var(--app-page-gradient-start))',
          'gradient-mid': 'rgb(var(--app-page-gradient-mid))',
          'gradient-end': 'rgb(var(--app-page-gradient-end))',
          overlay: 'rgba(var(--app-page-overlay), 0.4)',
        },
        'app-main': {
            background: 'rgb(var(--app-main-background))',
            border: 'rgb(var(--app-main-border))'
        },
        'primary-button': {
            'gradient-from': 'rgb(var(--primary-button-gradient-from))',
            'gradient-to': 'rgb(var(--primary-button-gradient-to))',
            'hover-gradient-from': 'rgb(var(--primary-button-hover-gradient-from))',
            'hover-gradient-to': 'rgb(var(--primary-button-hover-gradient-to))',
            'text': 'rgb(var(--primary-button-text))',
            'border': 'rgb(var(--primary-button-border))',
        },
        'chat-input': {
            'upgrade-text': 'rgb(var(--chat-input-upgrade-text))',
            'terms-backdrop': 'rgba(var(--chat-input-terms-backdrop), 0.5)',
            'terms-border': 'rgba(var(--chat-input-terms-border), 0.4)',
            'terms-text': 'rgba(var(--chat-input-terms-text), 0.8)',
            'backdrop': 'rgba(var(--chat-input-backdrop), 0.4)',
            'form-background': 'rgba(var(--chat-input-form-background), 0.043)',
            'form-border': 'rgba(var(--chat-input-form-border), 0.04)',
            'text': 'rgb(var(--chat-input-text))',
            'outline': 'rgba(var(--chat-input-outline), 0.4)',
            'send-button-background': 'rgba(var(--chat-input-send-button-background), 0.2)',
            'send-button-hover-background': 'rgba(var(--chat-input-send-button-background), 0.3)',
            'send-button-text': 'rgb(var(--chat-input-send-button-text))',
            'send-button-border': 'rgb(var(--chat-input-send-button-border))',
            'button-text': 'rgb(var(--chat-input-button-text))',
            'button-border': 'rgba(var(--chat-input-button-border), 0.1)',
        },
        'login-form': {
            'background': 'rgba(var(--login-form-background), 0.8)',
            'title-text': 'rgb(var(--login-form-title-text))',
            'description-text': 'rgba(var(--login-form-description-text), 0.8)',
            'error-text': 'rgb(var(--login-form-error-text))',
        },
        'sidebar-component': {
            'hidden-background': 'rgb(var(--sidebar-component-hidden-background))',
            'button-text': 'rgb(var(--sidebar-component-button-text))',
            'button-hover-text': 'rgb(var(--sidebar-component-button-hover-text))',
            'button-hover-background': 'rgba(var(--sidebar-component-button-hover-background), 0.25)',
            'title-text': 'rgb(var(--sidebar-component-title-text))',
            'search-border': 'rgb(var(--sidebar-component-search-border))',
            'search-icon-text': 'rgb(var(--sidebar-component-search-icon-text))',
            'search-placeholder': 'rgb(var(--sidebar-component-search-placeholder))',
            'user-info-text': 'rgb(var(--sidebar-component-user-info-text))',
            'loader-background': 'rgba(var(--sidebar-loader-background), 0.1)',
        },
        'logout-button': {
            'text': 'rgb(var(--logout-button-text))',
        },
        'welcome-screen': {
          'title-text': 'rgb(var(--welcome-screen-title-text))',
          'button-background': 'rgba(var(--welcome-screen-button-background), 0.3)',
          'button-hover-background': 'rgba(var(--welcome-screen-button-hover-background), 0.4)',
          'button-border': 'rgba(var(--welcome-screen-button-border), 0.7)',
          'button-text': 'rgba(var(--welcome-screen-button-text), 0.9)',
          'button-selected-background': 'rgb(var(--welcome-screen-button-selected-background))',
          'button-selected-hover-background': 'rgba(var(--welcome-screen-button-selected-hover-background), 0.8)',
          'button-selected-border': 'rgb(var(--welcome-screen-button-selected-border))',
          'button-selected-text': 'rgb(var(--welcome-screen-button-selected-text))',
          'question-border': 'rgba(var(--welcome-screen-question-border), 0.4)',
          'question-text': 'rgb(var(--welcome-screen-question-text))',
        },
        'top-bar': {
          'icon-color': 'rgb(var(--top-bar-icon-color))'
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
