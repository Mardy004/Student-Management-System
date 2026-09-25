import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#3A2633",
        surface: "#FFF7FA",
        panel: "#FFFFFF",
        primary: {
          DEFAULT: "#C44569",
          dark: "#8E2448",
          light: "#FCE4EC",
        },
        accent: {
          DEFAULT: "#B7791F",
          light: "#FFF4D6",
        },
        status: {
          present: "#1E824C",
          absent: "#B3261E",
          excused: "#946200",
          pending: "#7C5CBF",
        },
        border: "#F0DCE3",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(58,38,51,0.06), 0 1px 8px rgba(58,38,51,0.04)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
