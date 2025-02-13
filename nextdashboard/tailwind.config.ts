import * as flowbite from "flowbite-react/tailwind";

const config = {
  content: [
//    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/react-tailwindcss-select/dist/index.esm.js",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [flowbite.plugin()],
};
export default  config; 