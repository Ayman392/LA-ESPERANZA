const tailwindConfig = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/services/**/*.{ts,tsx}",
    "./src/supabase/**/*.{ts,tsx}",
    "./src/types/**/*.{ts,tsx}",
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
