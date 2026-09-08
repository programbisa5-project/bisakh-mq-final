import type { Config } from "tailwindcss";
const config: Config = {
content: ["./src/**/*.{ts,tsx}"],
theme: {
extend: {
colors: {


ink: "#1C2B2D",
paper: "#F7F5F0",
slate: {
925: "#141B1C",
},
moss: {
50: "#F1F5EE",
100: "#DEE8D6",
400: "#7C9A6E",
500: "#5F7F52",
600: "#4A6640",
700: "#3A4F33",
},
clay: {
500: "#B5652F",
600: "#9A5326",
},
amber: {
100: "#FBEFD6",
600: "#B27C1F",
},
rose: {
100: "#F7DFDD",
600: "#B0483F",
},
},
fontFamily: {
sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
display: ["'Fraunces'", "serif"],
},
borderRadius: {
sm: "4px",
md: "8px",
lg: "12px",
},


},
},
plugins: [],
};
export default config;
