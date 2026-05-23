/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Safelist dynamic color classes used in CoachView (template literals aren't
  // picked up by Tailwind's static scanner, so we list them explicitly).
  safelist: [
    {
      pattern: /^bg-(red|blue|green|amber|orange|purple|teal|indigo|violet|rose|gray)-500\/(5|10|20)$/,
    },
    {
      pattern: /^bg-(red|blue|green|amber|orange|purple|teal|indigo|violet|rose|gray)-500\/(5|10|20)$/,
      variants: ['hover'],
    },
    {
      pattern: /^text-(red|blue|green|amber|orange|purple|teal|indigo|violet|rose|gray)-300$/,
    },
    {
      pattern: /^border-(red|blue|green|amber|orange|purple|teal|indigo|violet|rose|gray)-400\/60$/,
      variants: ['hover'],
    },
    {
      pattern: /^hover:bg-(red|blue|green|amber|orange|purple|teal|indigo|violet|rose|gray)-500\/(5|10)$/,
    },
  ],
}
