const tailwindConfig = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./supabase/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FCF8F8",
        charcoal: "#262421",
        accent: "#8f7356",
      },
      borderRadius: {
        card: "0.5rem",
      },
    },
  },
};

export default tailwindConfig;
