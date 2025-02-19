export default {
  // ...existing config...
  theme: {
    extend: {
      // ...existing extensions...
      transitionProperty: {
        colors:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
      },
      transitionDuration: {
        300: "300ms",
      },
    },
  },
};
