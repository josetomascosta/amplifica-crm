import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "amp-blue": "#4548FF",
        "amp-yellow": "#F7DC4B",
        "amp-dark-blue": "#121755",
        "amp-dark-gray": "#1D1D1F",
        "amp-light-gray": "#E1E0E0",
        "amp-bg": "#F0F2F7",
        "amp-green": "#22c55e",
        "amp-red": "#ef4444",
        "amp-orange": "#f97316",
        "amp-purple": "#8b5cf6",
      },
      fontFamily: {
        barlow: ["Barlow Condensed", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        item: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
