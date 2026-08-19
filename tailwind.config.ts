const config = {
  // Tailwind 4 DarkModeStrategy is `["class", selector]`, not `["class"]` alone.
  darkMode: ["class", ".dark"] as const,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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
        navy: {
          DEFAULT: "hsl(var(--brand-blue-dark))",
          mid: "hsl(var(--brand-blue-deep))",
        },
        brass: {
          DEFAULT: "hsl(var(--brass))",
          light: "hsl(var(--brass-light))",
        },
        starboard: {
          DEFAULT: "hsl(var(--starboard))",
          light: "hsl(var(--starboard-light))",
        },
        port: {
          DEFAULT: "hsl(var(--port))",
          light: "hsl(var(--port-light))",
        },
        amber: {
          signal: "hsl(var(--signal-amber))",
          "signal-light": "hsl(var(--signal-amber-light))",
        },
        parchment: "hsl(var(--parchment))",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: "var(--text-h1)",
        h2: "var(--text-h2)",
        h3: "var(--text-h3)",
        h4: "var(--text-h4)",
        h5: "var(--text-h5)",
        h6: "var(--text-h6)",
        body: "var(--text-body)",
        caption: "var(--text-caption)",
        label: "var(--text-label)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        nav: "var(--shadow-nav)",
        inset: "var(--shadow-inset)",
      },
      spacing: {
        "card-mobile": "var(--space-card-mobile)",
        "card-desktop": "var(--space-card-desktop)",
        "section-mobile": "var(--space-section-mobile)",
        "section-desktop": "var(--space-section-desktop)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
